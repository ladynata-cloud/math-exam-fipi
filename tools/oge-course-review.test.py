"""Offline boundary tests; no credentials, network calls or external review requests."""
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
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

    def test_reduced_context_keeps_every_added_and_removed_line(self):
        with tempfile.TemporaryDirectory() as tmp:
            def git(*args):
                return subprocess.check_output(['git', '-C', tmp, *args], text=True)
            git('init', '-q')
            source = Path(tmp, FILE)
            source.parent.mkdir(parents=True)
            before = [f'unchanged line {n}\n' for n in range(100)]
            source.write_text(''.join(before))
            git('add', FILE)
            git('-c', 'user.name=Offline Test', '-c', 'user.email=offline@example.test', 'commit', '-qm', 'base')
            base = git('rev-parse', 'HEAD').strip()
            after = before.copy()
            for n in (10, 50, 90):
                after[n] = f'changed line {n}\n'
            source.write_text(''.join(after))
            git('add', FILE)
            git('-c', 'user.name=Offline Test', '-c', 'user.email=offline@example.test', 'commit', '-qm', 'head')
            head = git('rev-parse', 'HEAD').strip()
            wide = git('diff', '--unified=12', base, head, '--', FILE)
            with patch.object(review, 'git', side_effect=git):
                compact = review.package_review(base, head, MANIFEST)
            def changed(text):
                return [line for line in text.splitlines() if line.startswith(('+', '-'))
                        and not line.startswith(('+++', '---'))]
            self.assertEqual(changed(compact), changed(wide))
            self.assertEqual(len(changed(compact)), 6)
            self.assertLess(len(compact), len(wide))


class ExactContextBoundaries(unittest.TestCase):
    def setUp(self):
        self.sources = {
            'trainers/oge-task10-probability.html': (
                'outside before\nconst RECS=new Map();\nfunction recOf(t){return RECS.get(t.uid);}\n'
                'function taskDone(t){return !recOf(t).shown;}\n'
                '/* --- пошаговый раннер\noutside after'),
            'trainers/oge-task20-equations.html': (
                'outside before\nfunction mountMarathon(host, engine){\n'
                '  const result="task20 independent-credit message";\n}\n'
                '/* ============================ РЕНДЕР ПО ТИПАМ\noutside after'),
            'trainers/oge-task22-functions-graphs.html': (
                'outside before\nfunction renderMarathon(mod,host){\n'
                '  const result="Верно (ответ был показан).";\n}\n'
                '/* ============================================================\n   THEORY MODE\noutside after'),
            'tools/oge-part2-minimal.test.cjs': (
                "'use strict';\nfunction fill22(ans,p){return p;}\n"
                "for(const n of [20,21,22])test('unrelated',()=>{});\n"
                "test('task22: revealed helper steps stay marked through hide/reopen and final answer checking',()=>{\n"
                "  assert.equal(score,0);\n});\n"
                "test('unrelated between',()=>{});\n"
                "test('task22: full answer reveal is explicitly labelled when the learner later checks the correct main answer',()=>{\n"
                "  assert.equal(message,'Верно (ответ был показан).');\n});\n"
                "test('unrelated after',()=>{});"),
        }

    def package(self, patch_text='+public UI', sources=None):
        sources = self.sources if sources is None else sources
        selected = list(sources)
        def git(*args):
            if args[:2] == ('diff', '--name-only'):
                return '\n'.join(selected)
            if args[0] == 'diff':
                self.assertEqual(args[1:5], ('--no-ext-diff', '--unified=3', BASE, HEAD))
                return patch_text
            self.assertEqual(args[0], 'show')
            sha, filename = args[1].split(':', 1)
            self.assertEqual(sha, HEAD, 'context must come from exact head, never the working tree')
            return sources[filename]
        with patch.object(review, 'git', side_effect=git) as mock:
            material = review.package_review(BASE, HEAD, {'files': selected})
        return material, mock

    def test_exact_head_functions_and_reproduction_are_separate_bounded_sources(self):
        material, mock = self.package()
        self.assertTrue(material.startswith('+public UI'))
        self.assertEqual(material.count('EXACT HEAD SOURCE:'), 6)
        for filename in self.sources:
            self.assertIn(f'EXACT HEAD SOURCE: {filename} @ {HEAD} lines ', material)
            self.assertEqual(sum(call.args == ('show', HEAD + ':' + filename)
                                 for call in mock.call_args_list), 1)
        self.assertIn('function taskDone(t){return !recOf(t).shown;}', material)
        self.assertIn('const result="task20 independent-credit message";', material)
        self.assertIn('const result="Верно (ответ был показан).";', material)
        self.assertIn('function fill22(ans,p){return p;}', material)
        self.assertIn("assert.equal(message,'Верно (ответ был показан).');\n});", material)
        self.assertNotIn('outside', material)
        self.assertNotIn('unrelated', material)

    def test_context_is_never_filled_from_an_ambiguous_or_missing_region(self):
        filename = 'trainers/oge-task10-probability.html'
        original = self.sources[filename]
        for source in [original.replace('const RECS=new Map();', 'const OTHER=new Map();'),
                       original + '\nconst RECS=new Map();',
                       original.replace('/* --- пошаговый раннер', '/* renamed boundary')]:
            with self.subTest(source=source), self.assertRaises(ValueError):
                self.package(sources={filename: source})

    def test_unchanged_context_gets_the_same_credential_guard(self):
        filename = 'trainers/oge-task10-probability.html'
        for value in ['ghp_' + 'a' * 24, 'sk-ant-' + 'x' * 24,
                      '-----BEGIN RSA ' + 'PRIVATE KEY-----']:
            source = self.sources[filename].replace('function recOf', value + '\nfunction recOf')
            with self.subTest(value=value), self.assertRaises(ValueError):
                self.package(sources={filename: source})

    def test_combined_diff_and_context_obey_utf8_limit(self):
        filename = 'trainers/oge-task10-probability.html'
        source = self.sources[filename].replace('function recOf', 'я' * 1000 + '\nfunction recOf')
        with self.assertRaises(ValueError):
            self.package('+' + 'x' * 1_499_000, sources={filename: source})


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
                    if isinstance(reply, Exception):
                        raise reply
                    return io.BytesIO(json.dumps(reply).encode())
                with patch.dict(os.environ, environment, clear=True), patch.object(review, 'package_review', return_value='+public UI'), patch.object(review.urllib.request, 'urlopen', side_effect=fake_open), patch.object(review.sys, 'argv', [str(SOURCE)]), contextlib.redirect_stdout(out):
                    if expected_failure:
                        with self.assertRaises(SystemExit) as failure:
                            review.main()
                        captured['failure'] = str(failure.exception)
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

    def test_self_retracted_provider_finding_is_not_automatically_removed_or_approved(self):
        finding = {'severity': 'high', 'file': FILE,
                   'description': 'Candidate is not a defect; remove this finding.',
                   'suggested_fix': 'No code change.'}
        for declared in ['REQUEST_CHANGES', 'APPROVE']:
            value = {'verdict': declared, 'findings': [finding], 'limits': []}
            with self.subTest(verdict=declared):
                report, output, _ = self.run_review(response(value), expected_failure=True)
                self.assertEqual(report['findings'], [finding])
                self.assertEqual(report['verdict'], declared)
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

    def test_http_error_reports_only_sanitized_bounded_reason_and_never_approval(self):
        key = 'offline-placeholder-not-a-secret'
        values = [key, 'ghp_' + 'a' * 24, 'sk-ant-' + 'x' * 24,
                  'opaque-password-value', 'opaque-token-value', 'opaque-bearer-value']
        message = ('prompt is too long: 210000 tokens > 200000 limit\n' + values[0] + ' ' + values[1]
                   + ' ' + values[2] + ' password=' + values[3] + ' token="' + values[4]
                   + '" Bearer ' + values[5] + ' ' + 'detail ' * 200)
        body = {'error': {'type': 'invalid_request_error', 'message': message},
                'unrelated': 'do not echo this field'}
        error = review.urllib.error.HTTPError('https://api.anthropic.com/v1/messages', 400,
                                            'bad request', None, io.BytesIO(json.dumps(body).encode()))
        report, output, captured = self.run_review(error, expected_failure=True)
        reason = captured['failure']
        self.assertIsNone(report)
        self.assertIn('HTTP 400', reason)
        self.assertIn('invalid_request_error: prompt is too long: 210000 tokens > 200000 limit', reason)
        self.assertIn('no approval obtained', reason)
        self.assertNotIn('OGE_COURSE_EXTERNAL_REVIEW_OK', output)
        for value in values + ['do not echo this field', '\n']:
            self.assertNotIn(value, reason)
        self.assertLess(len(reason), 700)

    def test_unparseable_or_oversized_provider_error_is_not_echoed(self):
        for body in (b'private arbitrary server response', b'x' * 16_385,
                     b'{"error":{"message":"missing type"}}', b'[]'):
            error = review.urllib.error.HTTPError('https://api.anthropic.com/v1/messages', 400,
                                                'bad request', None, io.BytesIO(body))
            self.assertEqual(review.safe_provider_error(error, 'test-key'), 'provider detail unavailable')

    def test_pem_content_and_credentials_in_error_type_are_redacted(self):
        pem = '-----BEGIN RSA ' + 'PRIVATE KEY-----\nprivate content\n-----END RSA ' + 'PRIVATE KEY-----'
        body = {'error': {'type': 'sk-ant-' + 'z' * 24, 'message': pem}}
        error = review.urllib.error.HTTPError('https://api.anthropic.com/v1/messages', 400,
                                            'bad request', None, io.BytesIO(json.dumps(body).encode()))
        self.assertEqual(review.safe_provider_error(error, ''), '[REDACTED]: [REDACTED]')


if __name__ == '__main__':
    unittest.main()
