#!/usr/bin/env python3
"""Offline tests for the single authorized ready-result consultation."""

import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest import mock
import urllib.error


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("ready_review", ROOT / "tools/arzhenikov-ready-review.py")
review = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(review)
TEST_KEY = "sk-ant-api03-offline-synthetic-not-a-real-credential"


def environment():
    return {
        "GITHUB_REPOSITORY": review.REPOSITORY,
        "GITHUB_EVENT_NAME": "pull_request",
        "REVIEW_EVENT_ACTION": "ready_for_review",
        "REVIEW_HEAD_REPOSITORY": review.REPOSITORY,
        "GITHUB_HEAD_REF": review.BRANCH,
        "GITHUB_RUN_ATTEMPT": "1",
        "GITHUB_RUN_ID": "123456",
        "REVIEW_PR_NUMBER": "999",
        "REVIEW_BASE_SHA": "b" * 40,
        "REVIEW_HEAD_SHA": "a" * 40,
        "REVIEW_ARITHMETIC_RESULT": "success",
        "ANTHROPIC_API_KEY": TEST_KEY,
    }


def metadata():
    with mock.patch.object(review, "public_process", return_value="a" * 40):
        return review.identity(environment(), ROOT, False)


def success_body(text="1. Уточнить единицу ответа в указанной задаче.", stop="end_turn"):
    return {"id": "msg_offline_fixture", "model": review.MODEL, "stop_reason": stop,
            "content": [{"type": "text", "text": text}],
            "usage": {"input_tokens": 120, "output_tokens": 30}}


class FakeResponse:
    def __init__(self, body, status=200):
        self.body = body if isinstance(body, bytes) else json.dumps(body).encode()
        self.status = status

    def getcode(self):
        return self.status

    def read(self, size):
        return self.body[:size]

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False


class FakeOpener:
    def __init__(self, body=None, error=None):
        self.calls = []
        self.body = success_body() if body is None else body
        self.error = error

    def open(self, request, timeout):
        self.calls.append((request, timeout))
        if self.error:
            raise self.error
        return FakeResponse(self.body)


class ReadyReviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Public local data only. No HTTP transport is constructed here.
        cls.metadata = metadata()
        cls.payload = review.build_payload(ROOT, cls.metadata)

    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.output = Path(self.directory.name)
        self.addCleanup(self.directory.cleanup)

    def run_consult(self, opener, key=TEST_KEY, dry_run=False, payload=None):
        return review.consult(payload or self.payload, self.metadata, self.output,
                              key, dry_run=dry_run, opener=opener)

    def saved(self, name="response.json"):
        return json.loads((self.output / name).read_text())

    def artifacts_text(self):
        return "\n".join(path.read_text() for path in self.output.glob("*.json"))

    def test_public_packet_is_bounded_and_contains_the_requested_ready_course(self):
        self.assertEqual(self.payload["model"], "claude-opus-5-5")
        self.assertEqual(self.payload["max_tokens"], 2400)
        self.assertNotIn("temperature", self.payload)
        self.assertLessEqual(len(json.dumps(self.payload, ensure_ascii=False)), 60000)
        content = self.payload["messages"][0]["content"]
        packet = json.loads(content.split("\n\n", 1)[1])
        self.assertEqual(len(packet["curriculum"]), 82)
        self.assertEqual(len(packet["bridges"]), 6)
        self.assertEqual(len(packet["final"]), 16)
        self.assertEqual(packet["scope"]["lesson_conditions"], 656)
        self.assertEqual(packet["scope"]["separate_transfer_conditions"], 48)
        self.assertEqual(packet["gate_evidence"]["conclusion"], "success")
        self.assertIn("merge ref", packet["gate_evidence"]["ci_checkout"])
        for lesson in packet["curriculum"]:
            self.assertEqual(set(lesson), {"id", "track", "title", "goal"})
        for bridge in packet["bridges"]:
            self.assertEqual(len(bridge["independent_conditions"]), 2)
            self.assertEqual(set(bridge["worked"]), {"problem", "expression", "explanation"})
            self.assertTrue(bridge["source_pages"])
        for item in packet["final"]:
            self.assertTrue(item["id"].endswith("-final"))
            self.assertEqual(set(item), {"id", "prompt", "answer", "answer_format", "unit", "hint"})
        self.assertIn("не более пяти", self.payload["system"])
        self.assertIn("не предлагай пока ИИ-помощника", self.payload["system"])
        self.assertNotIn(str(ROOT), content)
        self.assertNotIn(TEST_KEY, content)
        self.assertNotIn("Library", content)

    def test_child_export_process_never_receives_provider_or_github_credentials(self):
        result = subprocess.CompletedProcess([], 0, stdout="{}", stderr=TEST_KEY)
        with mock.patch.dict(os.environ, {"ANTHROPIC_API_KEY": TEST_KEY, "GITHUB_TOKEN": "synthetic-github-token"}):
            with mock.patch.object(review.subprocess, "run", return_value=result) as run:
                self.assertEqual(review.public_process(["node", "-e", "public code"], ROOT), "{}")
        passed = run.call_args.kwargs
        self.assertEqual(set(passed["env"]), {"PATH"})
        self.assertNotIn("shell", passed)
        self.assertEqual(passed["timeout"], 20)

    def test_only_successful_exact_ready_context_can_send(self):
        with mock.patch.object(review, "public_process", return_value="a" * 40):
            result = review.identity(environment(), ROOT, False)
            self.assertEqual(result["head_sha"], "a" * 40)
            self.assertEqual(result["base_sha"], "b" * 40)
            self.assertEqual(result["pr_number"], 999)
            self.assertIn("/pull/999", result["pr_url"])
            changes = {
                "GITHUB_REPOSITORY": "someone/else", "GITHUB_EVENT_NAME": "workflow_dispatch",
                "REVIEW_EVENT_ACTION": "synchronize", "REVIEW_HEAD_REPOSITORY": "fork/repo",
                "GITHUB_HEAD_REF": "other-branch", "GITHUB_RUN_ATTEMPT": "2",
                "REVIEW_ARITHMETIC_RESULT": "failure", "REVIEW_PR_NUMBER": "not-a-pr",
                "REVIEW_BASE_SHA": "not-a-sha", "REVIEW_HEAD_SHA": "c" * 40,
                "GITHUB_RUN_ID": "not-a-run",
            }
            for field, wrong in changes.items():
                with self.subTest(field=field):
                    altered = {**environment(), field: wrong}
                    with self.assertRaisesRegex(review.ReviewError, "ready_context_not_authorized"):
                        review.identity(altered, ROOT, False)

    def test_dry_run_and_missing_key_never_call_transport_or_invent_a_verdict(self):
        for key, dry_run, status in [(TEST_KEY, True, "dry_run"), ("", False, "unavailable")]:
            with self.subTest(status=status):
                opener = FakeOpener()
                self.assertEqual(self.run_consult(opener, key, dry_run), 0)
                self.assertEqual(opener.calls, [])
                report = self.saved()
                self.assertEqual(report["status"], status)
                self.assertFalse(report["reviewed"])
                self.assertFalse(report["formal_release_approval"])
                self.assertNotIn("verdict", report)
                self.assertNotIn("advice", report)
                self.assertNotIn(TEST_KEY, self.artifacts_text())

    def test_success_is_exactly_one_bounded_post_to_the_fixed_provider(self):
        opener = FakeOpener()
        self.assertEqual(self.run_consult(opener), 0)
        self.assertEqual(len(opener.calls), 1)
        request, timeout = opener.calls[0]
        self.assertEqual(request.full_url, "https://api.anthropic.com/v1/messages")
        self.assertEqual(request.get_method(), "POST")
        self.assertEqual(timeout, 120)
        self.assertEqual(request.get_header("Authorization"), "Bearer " + TEST_KEY)
        self.assertEqual(request.get_header("Anthropic-version"), "2026-10-21")
        self.assertEqual(json.loads(request.data), self.payload)
        report = self.saved()
        self.assertEqual(report["status"], "reviewed")
        self.assertTrue(report["reviewed"])
        self.assertFalse(report["formal_release_approval"])
        self.assertEqual(report["message_id"], "msg_offline_fixture")
        self.assertEqual(report["identity"], self.metadata)
        self.assertNotIn("headers", self.saved("request.json"))
        self.assertNotIn(TEST_KEY, self.artifacts_text())

    def test_response_credentials_machine_paths_and_unrequested_blocks_are_removed(self):
        fragments = [TEST_KEY, "sk-ant-api03-different-secret-sample", "sk-abcdefghijklmno",
                     "ghp_abcdefghijklmno", "github_pat_abcd_123456", "xoxb-12345-abcdef",
                     "Bearer another-private-token", "password=very-private-password",
                     "/workspace/private/course/file.txt", "/home/runner/private.txt",
                     r"C:\Users\person\secret.txt"]
        body = success_body("Полезная рекомендация. " + " ".join(fragments))
        body["debug"] = TEST_KEY
        body["content"].append({"type": "thinking", "thinking": TEST_KEY})
        self.assertEqual(self.run_consult(FakeOpener(body)), 0)
        text = self.artifacts_text()
        for fragment in fragments:
            self.assertNotIn(fragment, text)
        self.assertIn("Полезная рекомендация", self.saved()["advice"])
        self.assertIn("[REDACTED]", text)
        self.assertNotIn("debug", self.saved())

    def test_failed_http_is_not_retried_and_raw_error_material_is_never_saved(self):
        for status in [301, 302, 307, 308, 400, 401, 429, 500]:
            with self.subTest(status=status):
                body = io.BytesIO((TEST_KEY + " /workspace/private/raw-error").encode())
                error = urllib.error.HTTPError(review.ENDPOINT, status, TEST_KEY, {"X-Debug": TEST_KEY}, body)
                opener = FakeOpener(error=error)
                self.assertEqual(self.run_consult(opener), 1)
                self.assertEqual(len(opener.calls), 1)
                self.assertEqual(body.tell(), 0, "No raw error body is read")
                report = self.saved()
                self.assertEqual(report["status"], "failed")
                self.assertEqual(report["http_status"], status)
                self.assertFalse(report["reviewed"])
                self.assertNotIn(TEST_KEY, self.artifacts_text())
                self.assertNotIn("/workspace/private", self.artifacts_text())

    def test_redirect_handler_refuses_to_forward_any_request(self):
        handler = review.NoRedirect()
        for status in [301, 302, 303, 307, 308]:
            with self.subTest(status=status):
                with self.assertRaises(urllib.error.HTTPError):
                    handler.redirect_request(None, None, status, "moved", {}, "https://elsewhere.invalid/" + TEST_KEY)

    def test_transport_failure_and_malformed_response_are_safe_nonzero_results(self):
        cases = [FakeOpener(error=urllib.error.URLError(TEST_KEY)),
                 FakeOpener(error=TimeoutError(TEST_KEY)), FakeOpener(TEST_KEY.encode()),
                 FakeOpener({"content": "unexpected", "secret": TEST_KEY}),
                 FakeOpener(success_body("", "end_turn")),
                 FakeOpener(success_body("advice", "tool_use")),
                 FakeOpener(error=review.ReviewError(TEST_KEY))]
        for index, opener in enumerate(cases):
            with self.subTest(index=index):
                self.assertEqual(self.run_consult(opener), 1)
                self.assertEqual(len(opener.calls), 1)
                self.assertFalse(self.saved()["reviewed"])
                self.assertEqual(self.saved()["status"], "failed")
                self.assertNotIn(TEST_KEY, self.artifacts_text())

    def test_provider_limits_and_truncation_do_not_masquerade_as_completed_review(self):
        for body, reason in [(b"x" * (review.MAX_RESPONSE_BYTES + 1), "provider_response_too_large"),
                             (success_body("x" * (review.MAX_ADVICE_CHARS + 1)), "invalid_provider_advice")]:
            opener = FakeOpener(body)
            self.assertEqual(self.run_consult(opener), 1)
            self.assertEqual(self.saved()["reason"], reason)
            self.assertFalse(self.saved()["reviewed"])
        self.assertEqual(self.run_consult(FakeOpener(success_body("Часть совета", "max_tokens"))), 1)
        self.assertEqual(self.saved()["status"], "incomplete")
        self.assertFalse(self.saved()["reviewed"])
        self.assertIn("Часть совета", self.saved()["advice"])

    def test_packet_limit_is_enforced_before_any_transport(self):
        exported = json.loads(review.public_process(["node", "-e", review.NODE_EXPORT], ROOT))
        exported["curriculum"][0]["goal"] = "x" * review.MAX_PACKET_CHARS
        with mock.patch.object(review, "public_process", return_value=json.dumps(exported)):
            with self.assertRaisesRegex(review.ReviewError, "public_packet_too_large"):
                review.build_payload(ROOT, self.metadata)

    def test_main_dry_run_writes_a_reviewable_packet_without_network_or_secret_access(self):
        console = io.StringIO()
        with mock.patch.object(review, "OUTPUT", self.output), \
             mock.patch.object(review.urllib.request, "build_opener") as transport, \
             mock.patch.dict(os.environ, {"ANTHROPIC_API_KEY": TEST_KEY}, clear=False), \
             contextlib.redirect_stdout(console):
            self.assertEqual(review.main(["--dry-run"]), 0)
        transport.assert_not_called()
        self.assertEqual(self.saved()["status"], "dry_run")
        self.assertNotIn(TEST_KEY, console.getvalue() + self.artifacts_text())
        self.assertNotIn(str(ROOT), console.getvalue() + self.artifacts_text())

    def test_main_invalid_context_writes_safe_failure_receipts_without_a_request(self):
        with mock.patch.object(review, "OUTPUT", self.output), \
             mock.patch.object(review.urllib.request, "build_opener") as transport, \
             mock.patch.dict(os.environ, {}, clear=True), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(review.main([]), 1)
        transport.assert_not_called()
        self.assertFalse(self.saved()["reviewed"])
        self.assertEqual(self.saved("request.json")["status"], "not_sent")

    def test_workflow_scopes_the_secret_job_to_one_ready_event_after_course_ci(self):
        text = (ROOT / ".github/workflows/arzhenikov-arithmetic.yml").read_text()
        self.assertIn("types: [opened, synchronize, reopened, ready_for_review]", text)
        arithmetic, job = text.split("  ready-result-consultation:", 1)
        self.assertLess(arithmetic.index("python3 tools/arzhenikov-ready-review.test.py"), arithmetic.index("Install browser dependencies"))
        self.assertNotIn("secrets.ANTHROPIC_API_KEY", arithmetic)
        for required in ["needs: arithmetic", "github.event.action == 'ready_for_review'",
                         "github.event.pull_request.head.repo.full_name == github.repository",
                         "github.head_ref == '" + review.BRANCH + "'", "github.run_attempt == 1",
                         "needs.arithmetic.result == 'success'", "timeout-minutes: 5",
                         "contents: read", "ref: ${{ github.event.pull_request.head.sha }}",
                         "persist-credentials: false", "if: always()", "artifacts/arzhenikov-ready-review/"]:
            self.assertIn(required, job)
        self.assertEqual(job.count("run: python3 tools/arzhenikov-ready-review.py"), 1)
        self.assertNotIn("pull_request_target", text)
        self.assertNotIn("continue-on-error", job)


if __name__ == "__main__":
    unittest.main()
