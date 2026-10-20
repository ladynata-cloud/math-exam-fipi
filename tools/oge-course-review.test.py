"""Offline boundary tests; no credentials, network calls or external review requests."""
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SOURCE = Path(__file__).with_name('oge-course-external-review.py')
spec = importlib.util.spec_from_file_location('course_review', SOURCE)
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)
BASE = '1' * 40
HEAD = '2' * 40
FILE = 'trainers/oge-task16-circle.html'
MANIFEST = {'files': [FILE]}
GOOD = {'verdict': 'APPROVE', 'findings': [], 'limits': ['Only the scoped diff was reviewed.']}


def response(verdict=None, **changes):
    value = {'id': 'msg_offline_test', 'model': 'claude-opus-4-7', 'stop_reason': 'end_turn',
             'content': [{'type': 'text', 'text': json.dumps(GOOD if verdict is None else verdict)}]}
    value.update(changes)
    return value


class PackageBoundaries(unittest.TestCase):
    def package(self, patch_text, changed=FILE, manifest=MANIFEST, base=BASE, head=HEAD):
        with patch.object(review, 'git', side_effect=[changed, patch_text]):
            return review.package_review(base, head, manifest)

    def test_exact_public_scope_is_packaged(self):
        self.assertEqual(self.package('+new public UI\n'), '+new public UI\n')

    def test_sha_and_scope_mismatch_stop_before_transmission(self):
        for base in ['main', '1' * 39, '1' * 41, '$(false)']:
            with self.subTest(base=base), self.assertRaises(ValueError):
                self.package('+safe\n', base=base)
        for changed in ['', FILE + '\nother.html']:
            with self.subTest(changed=changed), self.assertRaises(ValueError):
                self.package('+safe\n', changed=changed)

    def test_size_counts_utf8_bytes(self):
        with self.assertRaises(ValueError):
            self.package('+' + 'я' * 750_001)

    def test_credential_like_additions_are_rejected(self):
        specimens = ['ghp_' + 'a' * 24, 'sk-ant-' + 'x' * 24, '-----BEGIN RSA ' + 'PRIVATE KEY-----']
        for value in specimens:
            with self.subTest(value=value), self.assertRaises(ValueError):
                self.package('+' + value)

    def test_guard_definitions_and_synthetic_fixtures_are_safe_public_source(self):
        additions = ''.join('+' + line + '\n' for source in (SOURCE, Path(__file__))
                            for line in source.read_text().splitlines())
        self.assertEqual(self.package(additions), additions)

    def test_generated_downloads_are_excluded_from_model_diff(self):
        paths = [FILE, 'downloads/trainer.html', 'downloads/trainer.zip']
        with patch.object(review, 'git', side_effect=['\n'.join(paths), '+source']) as git:
            review.package_review(BASE, HEAD, {'files': paths})
            self.assertEqual(git.call_args.args[-2:], ('--', FILE))


class VerdictBoundaries(unittest.TestCase):
    def run_review(self, reply, expected_failure=False):
        with tempfile.TemporaryDirectory() as tmp:
            previous = Path.cwd()
            os.chdir(tmp)
            try:
                manifest = Path('docs/tasks/OGE_COURSE_MINIMAL_FILES.json')
                manifest.parent.mkdir(parents=True)
                manifest.write_text(json.dumps(MANIFEST))
                environment = {'REVIEW_BASE': BASE, 'REVIEW_HEAD': HEAD, 'REVIEW_PR': '321',
                               'GITHUB_REPOSITORY': 'public-owner/public-repo',
                               'ANTHROPIC_API_KEY': 'offline-placeholder-not-a-secret'}
                out = io.StringIO()
                captured = {}
                def fake_open(request, timeout):
                    captured['request'] = request
                    self.assertEqual(timeout, 600)
                    return io.BytesIO(json.dumps(reply).encode())
                with patch.dict(os.environ, environment, clear=True), patch.object(review, 'package_review', return_value='+public UI'), patch.object(review.urllib.request, 'urlopen', side_effect=fake_open), patch.object(review.sys, 'argv', [str(SOURCE)]), contextlib.redirect_stdout(out):
                    if expected_failure:
                        with self.assertRaises(SystemExit):
                            review.main()
                    else:
                        review.main()
                report_path = Path('artifacts/oge-course-external-review.json')
                report = json.loads(report_path.read_text()) if report_path.exists() else None
                return report, out.getvalue(), captured
            finally:
                os.chdir(previous)

    def test_approval_is_tied_to_exact_head_base_pr_provider_and_response(self):
        report, output, captured = self.run_review(response())
        self.assertEqual(report['verdict'], 'APPROVE')
        self.assertEqual(report['head_sha'], HEAD)
        self.assertEqual(report['base_sha'], BASE)
        self.assertEqual(report['provider'], 'Anthropic')
        self.assertEqual(report['model'], 'claude-opus-4-7')
        self.assertEqual(report['response_id'], 'msg_offline_test')
        self.assertEqual(report['pr'], 'https://github.com/public-owner/public-repo/pull/321')
        self.assertTrue(report['reviewed_at'])
        self.assertIn('OGE_COURSE_EXTERNAL_REVIEW_OK', output)
        request = captured['request']
        self.assertEqual(request.full_url, 'https://api.anthropic.com/v1/messages')
        self.assertEqual(request.get_header('X-api-key'), 'offline-placeholder-not-a-secret')
        self.assertNotIn('offline-placeholder-not-a-secret', request.data.decode())
        self.assertNotIn('offline-placeholder-not-a-secret', output)

    def test_nonapproval_and_high_medium_findings_fail_closed(self):
        values = [{'verdict': 'REQUEST_CHANGES', 'findings': [], 'limits': []}]
        for severity in ['high', 'medium']:
            values.append({'verdict': 'APPROVE', 'findings': [{'severity': severity, 'file': FILE, 'description': 'Reproducible defect.', 'suggested_fix': 'Preserve state.'}], 'limits': []})
        for verdict in values:
            with self.subTest(verdict=verdict):
                _, output, _ = self.run_review(response(verdict), expected_failure=True)
                self.assertNotIn('OGE_COURSE_EXTERNAL_REVIEW_OK', output)

    def test_invalid_schema_never_becomes_an_approval(self):
        values = [[], 'APPROVE', {}, {**GOOD, 'extra': True}, {**GOOD, 'findings': 'none'},
                  {**GOOD, 'limits': [None]}, {**GOOD, 'verdict': 'approved'},
                  {**GOOD, 'findings': [{'severity': 'low', 'file': FILE, 'description': '', 'suggested_fix': 'Fix'}]},
                  {**GOOD, 'findings': [{'severity': 'critical', 'file': FILE, 'description': 'Bug', 'suggested_fix': 'Fix'}]},
                  {**GOOD, 'findings': [{'severity': 'low', 'file': 'outside.html', 'description': 'Bug', 'suggested_fix': 'Fix'}]}]
        for value in values:
            with self.subTest(value=value):
                report, output, _ = self.run_review(response(value), expected_failure=True)
                self.assertIsNone(report)
                self.assertNotIn('OGE_COURSE_EXTERNAL_REVIEW_OK', output)

    def test_incomplete_response_does_not_leave_approval_artifact(self):
        for reason in ['max_tokens', 'tool_use', None]:
            with self.subTest(reason=reason):
                report, output, _ = self.run_review(response(stop_reason=reason), expected_failure=True)
                self.assertIsNone(report)
                self.assertNotIn('OGE_COURSE_EXTERNAL_REVIEW_OK', output)

    def test_missing_provider_metadata_cannot_claim_verifiable_review(self):
        for field in ['id', 'model']:
            for value in [None, '', []]:
                with self.subTest(field=field, value=value):
                    reply = response(**{field: value})
                    report, output, _ = self.run_review(reply, expected_failure=True)
                    self.assertIsNone(report)
                    self.assertNotIn('OGE_COURSE_EXTERNAL_REVIEW_OK', output)

    def test_duplicate_verdict_keys_are_rejected(self):
        text = '{"verdict":"REQUEST_CHANGES","findings":[],"limits":[],"verdict":"APPROVE"}'
        report, output, _ = self.run_review(response(content=[{'type': 'text', 'text': text}]), expected_failure=True)
        self.assertIsNone(report)
        self.assertNotIn('OGE_COURSE_EXTERNAL_REVIEW_OK', output)


if __name__ == '__main__':
    unittest.main()
