"""Offline boundary tests: never access provider or credentials."""
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.error

spec = importlib.util.spec_from_file_location('basics_claude', Path(__file__).with_name('oge-basics-claude.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
BASE, HEAD = 'a' * 40, 'b' * 40
FILE = 'trainers/oge-basics/example.html'
ENV = {'REVIEW_BASE': BASE, 'REVIEW_HEAD': HEAD, 'REVIEW_PR': '123',
       'GITHUB_REPOSITORY': m.REPO, 'ANTHROPIC_API_KEY': 'synthetic-test-key'}


def response(text='A small practical design.', **changes):
    return {'id': 'msg_test', 'model': m.MODEL, 'stop_reason': 'end_turn',
            'content': [{'type': 'text', 'text': text}],
            'usage': {'input_tokens': 12, 'output_tokens': 7}, **changes}


def review(**changes):
    return {'verdict': 'APPROVE', 'findings': [], 'limits': ['No live browser observed.'], **changes}


class Boundaries(unittest.TestCase):
    def source(self, head, path):
        if path == m.MANIFEST:
            return json.dumps({'files': [FILE]})
        return 'Sanitized public design material.'

    def run_main(self, mode='design', network=None, prepare=False):
        with tempfile.TemporaryDirectory() as tmp, patch.dict(os.environ, ENV, clear=True), \
                patch.object(m, 'package_material', return_value=('public context', [FILE])), \
                patch.object(m.urllib.request, 'urlopen', side_effect=network) as call, \
                contextlib.redirect_stdout(io.StringIO()) as output:
            old = os.getcwd()
            os.chdir(tmp)
            try:
                code = m.main([mode] + (['--prepare-only'] if prepare else []))
                p = Path('artifacts/oge-basics-claude-' + mode + '.json')
                data = json.loads(p.read_text()) if p.exists() else None
            finally:
                os.chdir(old)
        return code, data, call.call_count, output.getvalue()

    def test_design_reads_only_two_exact_head_files(self):
        with patch.object(m, 'read_head', side_effect=self.source) as read, patch.object(m, 'git') as git:
            material, files = m.package_material('design', BASE, HEAD)
        self.assertEqual(files, [])
        self.assertEqual([c.args for c in read.call_args_list], [(HEAD, m.BRIEF), (HEAD, m.GUIDE)])
        git.assert_not_called()
        self.assertIn(HEAD, material)

    def test_context_size_and_credentials_block_before_request(self):
        for text in ('x' * 40_001, 'sk-ant-' + 'x' * 25):
            with self.subTest(text=text[:12]), patch.object(m, 'read_head', return_value=text):
                with self.assertRaises(ValueError):
                    m.package_material('design', BASE, HEAD)

    def test_invalid_sha_rejected(self):
        with self.assertRaises(ValueError):
            m.package_material('design', '--all', HEAD)

    def test_manifest_requires_exact_changed_files(self):
        with patch.object(m, 'read_head', side_effect=self.source), \
                patch.object(m, 'git', return_value=FILE + '\nserver/private.js\n'):
            with self.assertRaisesRegex(ValueError, 'Actual delta'):
                m.package_material('review', BASE, HEAD)

    def test_manifest_rejects_traversal_unrelated_duplicates(self):
        for files in [['trainers/oge-basics/../../private.js'], ['board-server/index.js'], [FILE, FILE]]:
            def source(head, path):
                return json.dumps({'files': files}) if path == m.MANIFEST else 'public'
            with self.subTest(files=files), patch.object(m, 'read_head', side_effect=source):
                with self.assertRaisesRegex(ValueError, 'out-of-scope'):
                    m.package_material('review', BASE, HEAD)

    def test_review_size_bound(self):
        with patch.object(m, 'read_head', side_effect=self.source), \
                patch.object(m, 'git', side_effect=[FILE, 'x' * 1_500_001]):
            with self.assertRaisesRegex(ValueError, '1.5 MB'):
                m.package_material('review', BASE, HEAD)

    def test_approved_response_needs_identity_complete_turn(self):
        for data in (response(json.dumps(review()), id=''),
                     response(json.dumps(review()), stop_reason='max_tokens')):
            with self.subTest(data=data), self.assertRaises(ValueError):
                m.response_result(data, 'review', [FILE], '')

    def test_duplicate_verdict_key_cannot_approve(self):
        text = '{"verdict":"REQUEST_CHANGES","verdict":"APPROVE","findings":[],"limits":[]}'
        with self.assertRaises(ValueError):
            m.response_result(response(text), 'review', [FILE], '')

    def test_out_of_scope_or_contradictory_finding_cannot_approve(self):
        finding = {'severity': 'medium', 'file': FILE, 'description': 'Input lost', 'suggested_fix': 'Preserve input'}
        for data in (review(findings=[finding]),
                     review(verdict='REQUEST_CHANGES', findings=[{**finding, 'file': 'secret.js'}])):
            with self.subTest(data=data), self.assertRaises(ValueError):
                m.response_result(response(json.dumps(data)), 'review', [FILE], '')

    def test_design_advice_is_never_a_release_verdict(self):
        result = m.response_result(response('APPROVE\nUse a visual model.'), 'design', [], '')
        self.assertNotIn('verdict', result)
        self.assertIn('Use a visual model', result['advice'])

    def test_prepare_only_never_calls_network(self):
        code, data, count, output = self.run_main(prepare=True)
        self.assertEqual((code, data, count), (0, None, 0))
        self.assertIn('context_bytes', output)

    def test_balance_failure_is_recorded_once_without_key_or_verdict(self):
        body = json.dumps({'error': {'type': 'invalid_request_error',
                                   'message': 'Insufficient credit balance synthetic-test-key'}}).encode()
        error = urllib.error.HTTPError('https://api.anthropic.com/v1/messages', 400, 'Bad Request', {}, io.BytesIO(body))
        code, data, count, output = self.run_main(network=error)
        self.assertEqual((code, count, data['status']), (1, 1, 'unavailable'))
        self.assertIn('Insufficient credit balance', data['reason'])
        self.assertNotIn('synthetic-test-key', output)
        self.assertNotIn('verdict', data)

    def test_malformed_response_is_recorded_without_body_leak(self):
        body = io.BytesIO(b'synthetic-test-key invalid JSON')
        code, data, count, output = self.run_main(network=lambda *a, **k: body)
        self.assertEqual((code, count, data['status']), (1, 1, 'unavailable'))
        self.assertNotIn('synthetic-test-key', output)

    def test_network_timeout_is_not_retried(self):
        code, data, count, _ = self.run_main(network=TimeoutError())
        self.assertEqual((code, count, data['status']), (1, 1, 'unavailable'))

    def test_valid_review_records_usage_and_exact_provenance(self):
        body = io.BytesIO(json.dumps(response(json.dumps(review()))).encode())
        code, data, count, _ = self.run_main('review', network=lambda *a, **k: body)
        self.assertEqual((code, count, data['verdict']), (0, 1, 'APPROVE'))
        self.assertEqual((data['base_sha'], data['head_sha'], data['response_id']), (BASE, HEAD, 'msg_test'))
        self.assertEqual(data['usage']['output_tokens'], 7)


if __name__ == '__main__':
    unittest.main()
