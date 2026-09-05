from __future__ import annotations

import datetime as dt
import io
import json
from pathlib import Path
import socket
import sys
import tempfile
import unittest
import urllib.error

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from exporter import (  # noqa: E402
    API_ROOT,
    AuthorizationError,
    CourseExporter,
    ExportError,
    MethodNotAllowed,
    RateLimitError,
    RequestTimeout,
    SafeRedirectHandler,
    StepikClient,
    validate_output_directory,
)


class Response:
    def __init__(self, body: bytes):
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return self.body


class ScriptedOpener:
    def __init__(self, events):
        self.events = list(events)
        self.requests = []

    def open(self, request, timeout=None):
        self.requests.append((request, timeout))
        event = self.events.pop(0)
        if isinstance(event, BaseException):
            raise event
        return Response(event)


class FakeClient:
    def __init__(self, singular, pages):
        self.singular = singular
        self.pages = pages
        self.calls = []

    def get_json(self, url):
        self.calls.append(("get", url))
        item = self.singular[url]
        if isinstance(item, BaseException):
            raise item
        return item

    def paginated(self, path):
        self.calls.append(("pages", path))
        return self.pages[path]


def raw(value):
    data = json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode()
    return value, data


def page(value, url="https://stepik.org/api/fake"):
    value, data = raw(value)
    return value, data, url


class ExportTests(unittest.TestCase):
    def fixture(self, *, missing_step=False):
        singular = {
            API_ROOT + "courses/294611": raw({"courses": [{"id": 294611, "title": "Курс <script>x</script>", "sections": [20, 10]}]}),
            API_ROOT + "lessons/7": raw({"lessons": [{"id": 7, "title": "Повторяем & учимся", "steps": [701, 702]}]}),
            API_ROOT + "lessons/8": raw({"lessons": [{"id": 8, "title": "Второй урок", "steps": [801]}]}),
            API_ROOT + "step-sources/701": raw({"step-sources": [{"id": 701, "block": {"name": "text", "text": "<b>Формула</b>"}}]}),
            API_ROOT + "step-sources/702": raw({"step-sources": [{"id": 702, "block": {"name": "choice", "options": [{"text": "A", "is_correct": True}]}}]}),
            API_ROOT + "step-sources/801": raw({"step-sources": [{"id": 801, "block": {"name": "video", "video": {"urls": [{"url": "https://cdn.example/video.mp4"}]}}}]}),
        }
        if missing_step:
            singular[API_ROOT + "step-sources/702"] = ExportError("not available")
        sections1 = {"sections": [{"id": 10, "title": "Позже", "units": [101]}], "meta": {"has_next": True}}
        sections2 = {"sections": [{"id": 20, "title": "Сначала", "units": [201, 202]}], "meta": {"has_next": False}}
        units = {"units": [
            {"id": 101, "section": 10, "lesson": 8},
            {"id": 201, "section": 20, "lesson": 7},
            {"id": 202, "section": 20, "lesson": 7},
        ], "meta": {"has_next": False}}
        pages = {
            "sections?ids%5B%5D=20&ids%5B%5D=10": [page(sections1), page(sections2)],
            "units?ids%5B%5D=201&ids%5B%5D=202&ids%5B%5D=101": [page(units)],
        }
        return FakeClient(singular, pages)

    def test_preserves_raw_json_order_pagination_and_reused_lesson(self):
        client = self.fixture()
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp)
            manifest = CourseExporter(
                client,
                output,
                now=lambda: dt.datetime(2026, 9, 5, 12, 0, tzinfo=dt.timezone.utc),
            ).export(294611)
            structure = json.loads((output / "structure.json").read_text())
            self.assertEqual([m["section_id"] for m in structure["modules"]], [20, 10])
            self.assertEqual([x["lesson_id"] for x in structure["modules"][0]["lessons"]], [7, 7])
            self.assertEqual([x["step_id"] for x in structure["modules"][0]["lessons"][0]["steps"]], [701, 702])
            self.assertEqual(manifest["counts"], {"modules": 2, "lessons": 2, "steps": 3})
            self.assertEqual(manifest["status"], "COMPLETE")
            self.assertEqual(manifest["exported_at"], "2026-09-05T12:00:00Z")
            self.assertEqual(sum(call == ("get", API_ROOT + "lessons/7") for call in client.calls), 1)
            expected = client.singular[API_ROOT + "step-sources/702"][1]
            self.assertEqual((output / "raw/step-sources/702.json").read_bytes(), expected)
            self.assertTrue(all(len(item["sha256"]) == 64 for item in manifest["files"]))
            self.assertNotIn("TOP-SECRET", "".join(path.read_text(errors="ignore") for path in output.rglob("*.*")))
            toc = (output / "contents.html").read_text()
            self.assertIn("Курс &lt;script&gt;x&lt;/script&gt;", toc)
            self.assertNotIn("<script>x</script>", toc)
            self.assertIn("file not downloaded", toc)

    def test_unavailable_step_is_visible_and_incomplete(self):
        client = self.fixture(missing_step=True)
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp)
            manifest = CourseExporter(client, output).export(294611)
            self.assertEqual(manifest["status"], "INCOMPLETE")
            self.assertIn({"resource": "step-sources", "id": 702}, manifest["unavailable_objects"])
            structure = json.loads((output / "structure.json").read_text())
            step = structure["modules"][0]["lessons"][0]["steps"][1]
            self.assertEqual(step, {"step_id": 702, "available": False})

    def test_empty_course(self):
        client = FakeClient(
            {API_ROOT + "courses/5": raw({"courses": [{"id": 5, "title": "Пустой", "sections": []}]})},
            {},
        )
        with tempfile.TemporaryDirectory() as temp:
            manifest = CourseExporter(client, Path(temp)).export(5)
            self.assertEqual(manifest["status"], "COMPLETE")
            self.assertEqual(manifest["counts"], {"modules": 0, "lessons": 0, "steps": 0})

    def test_course_authorization_error_is_not_silently_empty(self):
        client = FakeClient({API_ROOT + "courses/9": AuthorizationError("authorization failed")}, {})
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaisesRegex(ExportError, "Course 9 is unavailable"):
                CourseExporter(client, Path(temp)).export(9)


class HttpPolicyTests(unittest.TestCase):
    def test_content_mutations_are_blocked_before_send(self):
        opener = ScriptedOpener([b"should not be used"])
        client = StepikClient(opener=opener)
        for method in ("POST", "PUT", "PATCH", "DELETE"):
            with self.assertRaises(MethodNotAllowed):
                client.request(method, API_ROOT + "step-sources/1", b"{}")
        self.assertEqual(opener.requests, [])

    def test_non_stepik_and_non_tls_reads_are_blocked(self):
        opener = ScriptedOpener([])
        client = StepikClient(opener=opener)
        for url in ("https://example.com/api/courses/1", "http://stepik.org/api/courses/1"):
            with self.assertRaises(MethodNotAllowed):
                client.request("GET", url)
        self.assertEqual(opener.requests, [])

    def test_cross_origin_redirect_drops_authorization(self):
        request = __import__("urllib.request").request.Request(
            API_ROOT + "courses/1", headers={"Authorization": "Bearer TOP-SECRET"}
        )
        redirected = SafeRedirectHandler().redirect_request(
            request, None, 302, "found", {}, "https://example.com/elsewhere"
        )
        self.assertIsNone(redirected.get_header("Authorization"))

    def test_authorization_failure_is_sanitized(self):
        error = urllib.error.HTTPError(API_ROOT, 401, "secret server message", {}, io.BytesIO())
        client = StepikClient(token="TOP-SECRET", opener=ScriptedOpener([error]))
        with self.assertRaises(AuthorizationError) as raised:
            client.request("GET", API_ROOT + "courses/1")
        self.assertNotIn("TOP-SECRET", str(raised.exception))
        self.assertNotIn("secret server message", str(raised.exception))

    def test_timeout(self):
        client = StepikClient(opener=ScriptedOpener([urllib.error.URLError(socket.timeout("timed out"))]))
        with self.assertRaises(RequestTimeout):
            client.request("GET", API_ROOT + "courses/1")

    def test_rate_limit_retries_then_succeeds(self):
        rate = lambda: urllib.error.HTTPError(API_ROOT, 429, "rate", {"Retry-After": "0"}, io.BytesIO())
        opener = ScriptedOpener([rate(), rate(), b'{"courses":[]}'])
        sleeps = []
        client = StepikClient(opener=opener, max_rate_retries=2, sleep=sleeps.append)
        self.assertEqual(client.request("GET", API_ROOT + "courses/1"), b'{"courses":[]}')
        self.assertEqual(sleeps, [0.0, 0.0])

    def test_rate_limit_exhaustion(self):
        def rate():
            return urllib.error.HTTPError(API_ROOT, 429, "rate", {"Retry-After": "0"}, io.BytesIO())
        client = StepikClient(opener=ScriptedOpener([rate(), rate()]), max_rate_retries=1, sleep=lambda _x: None)
        with self.assertRaises(RateLimitError):
            client.request("GET", API_ROOT + "courses/1")

    def test_pagination_supports_documented_style_and_legacy_spelling(self):
        opener = ScriptedOpener([
            b'{"sections":[{"id":1}],"meta":{"has_next":true}}',
            b'{"sections":[{"id":2}],"meta":{"has-page-next":false}}',
        ])
        pages = StepikClient(opener=opener).paginated("sections?course=4")
        self.assertEqual(len(pages), 2)
        self.assertIn("page=2", opener.requests[1][0].full_url)


class OutputPolicyTests(unittest.TestCase):
    def test_repository_output_is_rejected(self):
        repo = Path(__file__).resolve().parents[3]
        with self.assertRaises(ExportError):
            validate_output_directory(repo / "exports", repo)

    def test_nonempty_output_is_rejected(self):
        with tempfile.TemporaryDirectory() as repo, tempfile.TemporaryDirectory() as output:
            (Path(output) / "existing").write_text("x")
            with self.assertRaises(ExportError):
                validate_output_directory(Path(output), Path(repo))


if __name__ == "__main__":
    unittest.main()
