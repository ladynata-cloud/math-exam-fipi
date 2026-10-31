"""Fail-closed audit-registry regressions using synthetic, non-private fixtures."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
SPEC = importlib.util.spec_from_file_location('book_collector', Path(__file__).with_name('oge-book-collect-results.py'))
C = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(C)


class EvidenceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='oge-book-registry-')
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'repo'
        self.directory = self.root / 'artifacts/book-audit-exam/source'
        self.directory.mkdir(parents=True)
        self.route = '/trainers/exercise.html'
        self.prefix = '/book/oge/2026-10-31/v1'
        self.files = {self.route: b'<html><script src="/assets/engine.js"></script>One independent fixture</html>', '/assets/engine.js': b'const exercise = 1;'}
        for url, content in self.files.items():
            path = self.root / url.lstrip('/')
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
        self.report = {'id': '01', 'route': self.route, 'prefix': '', 'width': 1280,
                       'testScriptSha256': 'a' * 64, 'randomSeed': 123, 'checkedAt': '2026-10-31T00:00:00Z',
                       'actions': [{'action': action, 'status': 'PASS'} for action in C.ACTIONS] + [{'action': 'runtime', 'status': 'PASS'}],
                       'status': 'PASS_SELECTED_CASE', 'errors': [], 'network': [],
                       'resources': {url: {'status': 200, 'sha256': hashlib.sha256(content).hexdigest()} for url, content in self.files.items()},
                       'resourceHashErrors': [], 'finalPath': self.route,
                       'sha256': hashlib.sha256(self.files[self.route]).hexdigest(),
                       'finalHtmlSha256': hashlib.sha256(self.files[self.route]).hexdigest(),
                       'oracles': [{'prompt': 'Compute 2 + 3', 'expected': 5, 'method': 'source-derived read-only native key'}]}
        self.data = {'prefix': '', 'generatedAt': '2026-10-31T00:00:01Z', 'testScriptSha256': 'b' * 64}

    def case(self, report=None, family='exam', version='source', write=True):
        report = copy.deepcopy(self.report if report is None else report)
        individual = self.directory / (('book-' if family == 'basics' else '') + f"{report['id']}-{report['width']}.json")
        if write:
            individual.write_text(json.dumps(report, indent=2))
        mapping = {'sourceUrl': 'https://mathexam.space' + report['route']}
        return C.collect_case(self.root, report, self.data, family, version, self.directory, 0, mapping, self.prefix)

    def review(self, case, verdict='PASS'):
        return {'id': case['id'], 'width': case['width'], 'prefix': case['prefix'],
                **case['oracles'][0], 'verdict': verdict,
                'evidence': {'reportSha256': case['individualReportSha256']}}

    def test_complete_record_uses_individual_runner_and_seed(self):
        case = self.case()
        self.assertEqual(case['status'], 'PASS')
        self.assertEqual(case['testScriptSha256'], 'a' * 64)
        self.assertEqual(case['seed'], 123)
        self.assertEqual(case['individualReportSha256'], C.sha(self.directory / '01-1280.json'))

    def test_shared_javascript_drift_blocks_pass(self):
        (self.root / 'assets/engine.js').write_text('const exercise = 2;')
        case = self.case()
        self.assertEqual(case['actions']['identity'], 'FAIL')
        self.assertNotEqual(case['status'], 'PASS')

    def test_missing_html_blocks_pass(self):
        (self.root / self.route.lstrip('/')).unlink()
        self.assertEqual(self.case()['actions']['identity'], 'FAIL')

    def test_redirect_destination_must_be_hashed_and_current(self):
        report = copy.deepcopy(self.report)
        report['finalPath'] = '/trainers/destination.html'
        report['finalHtmlSha256'] = 'c' * 64
        self.assertEqual(self.case(report)['actions']['identity'], 'FAIL')
        report['resources'][report['finalPath']] = {'status': 200, 'sha256': 'c' * 64}
        (self.root / 'trainers/destination.html').write_text('different bytes')
        self.assertEqual(self.case(report)['actions']['identity'], 'FAIL')

    def test_html_only_fallback_is_not_complete_identity(self):
        report = copy.deepcopy(self.report)
        del report['resources']
        self.assertEqual(self.case(report)['actions']['identity'], 'NOT_RUN')

    def test_basics_hash_schema_remains_supported(self):
        report = copy.deepcopy(self.report)
        report['resourceHashes'] = {url: value['sha256'] for url, value in report.pop('resources').items()}
        report.update(status='PASS', testedPath=self.route, family='basic', seed=report.pop('randomSeed'))
        del report['testScriptSha256']
        case = self.case(report, family='basics')
        self.assertEqual(case['status'], 'PASS')
        self.assertEqual(case['testScriptSha256'], 'b' * 64)

    def test_missing_or_different_individual_record_blocks_pass(self):
        self.assertEqual(self.case(write=False)['actions']['provenance'], 'FAIL')
        self.case()
        (self.directory / '01-1280.json').write_text('{}')
        self.assertEqual(self.case(write=False)['actions']['provenance'], 'FAIL')

    def test_missing_seed_or_runner_hash_blocks_pass(self):
        for key in ('randomSeed', 'testScriptSha256'):
            report = copy.deepcopy(self.report)
            del report[key]
            with self.subTest(key=key):
                self.assertNotEqual(self.case(report)['status'], 'PASS')

    def test_unknown_or_partial_extra_action_blocks_pass(self):
        for state in ('PARTIAL', 'NOT_RUN', None, 'UNKNOWN'):
            report = copy.deepcopy(self.report)
            report['actions'].append({'action': 'additional-check', 'status': state})
            with self.subTest(state=state):
                self.assertNotEqual(self.case(report)['status'], 'PASS')

    def test_undeclared_frozen_dependency_check_is_not_pass(self):
        report = copy.deepcopy(self.report)
        report['prefix'] = self.prefix
        report['finalPath'] = self.prefix + self.route
        report['resources'] = {self.prefix + url: value for url, value in report['resources'].items()}
        report['dependencyEscapes'] = []
        for url, content in self.files.items():
            path = self.root / (self.prefix + url).lstrip('/')
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
        self.assertEqual(self.case(report, version='frozen')['actions']['dependencies'], 'NOT_RUN')

    def test_desktop_finite_assessment_requires_saved_result_after_finish(self):
        report = copy.deepcopy(self.report)
        report['route'] = '/trainers/oge-task8-expressions.html'
        self.assertEqual(C.finite_check(report, 'exam')[0], 'NOT_RUN')
        report['actions'].extend([{'action': 'assessment-start', 'status': 'PASS'},
                                  {'action': 'assessment-finish', 'status': 'PASS'},
                                  {'action': 'session-completion', 'status': 'PASS', 'mode': 'finite assessment'}])
        self.assertEqual(C.finite_check(report, 'exam')[0], 'NOT_RUN')
        report['actions'].append({'action': 'saved-result', 'status': 'PASS'})
        self.assertEqual(C.finite_check(report, 'exam')[0], 'PASS')
        report['actions'][-1]['status'] = 'PARTIAL'
        self.assertEqual(C.finite_check(report, 'exam')[0], 'NOT_RUN')

    def test_source_generator_called_independent_is_still_pending(self):
        case = self.case()
        case['oracles'][0]['method'] = 'source-derived independent Node VM of native generator'
        self.assertEqual(C.mathematical_status([case], [], False)[0], 'PENDING')

    def test_math_pass_requires_exact_record_width_prefix_and_oracle(self):
        case = self.case()
        record = self.review(case)
        self.assertEqual(C.mathematical_status([case], [record], False)[0], 'PASS')
        for field, value in [('id', '02'), ('width', 390), ('prefix', self.prefix), ('expected', 6), ('prompt', 'New figure')]:
            changed = copy.deepcopy(record)
            changed[field] = value
            with self.subTest(field=field):
                self.assertEqual(C.mathematical_status([case], [changed], False)[0], 'PENDING')
        record['evidence']['reportSha256'] = 'd' * 64
        self.assertEqual(C.mathematical_status([case], [record], False)[0], 'PENDING')

    def test_failed_or_partial_math_overrides_independent_label(self):
        case = self.case()
        case['oracles'][0]['method'] = 'independent visible calculation'
        self.assertEqual(C.mathematical_status([case], [], False)[0], 'PASS')
        for verdict, expected in [('FAIL', 'FAIL'), ('PARTIAL', 'PENDING'), ('PENDING', 'PENDING')]:
            with self.subTest(verdict=verdict):
                self.assertEqual(C.mathematical_status([case], [self.review(case, verdict)], False)[0], expected)
        self.assertEqual(C.mathematical_status([case], [self.review(case), self.review(case, 'FAIL')], False)[0], 'FAIL')

    def test_fail_is_not_hidden_by_missing_actions(self):
        self.assertEqual(C.outcome([{'status': 'FAIL'}, {'status': 'NOT_RUN'}]), 'FAIL')

    def test_missing_verification_evidence_never_claims_pass(self):
        result = C.collect_verification(self.root, [{'sourceUrl': 'https://mathexam.space/'}],
                                        {'sources': [{'name': 'original.docx', 'sha256': 'e' * 64}]},
                                        {'sourceBase': 'f' * 40})
        self.assertTrue(all(item['status'] == 'NOT_RUN' for item in result.values()))

    def test_document_caption_evidence_requires_the_exact_approved_delta(self):
        original = {'all_non_url_text_unchanged': True}
        self.assertTrue(C.document_text_evidence_valid(original))
        approved = {'all_non_url_text_unchanged': False,
                    'all_non_url_text_unchanged_except_approved_corrections': True,
                    'approved_editorial_corrections': [{
                        'paragraph': 168, 'pdf_page': 13,
                        'before': 'Входная диагностика ОГЭ-2026.',
                        'after': 'Входная диагностика ОГЭ-2027.',
                    }]}
        self.assertTrue(C.document_text_evidence_valid(approved))
        for field, value in [('paragraph', 167), ('pdf_page', 14),
                             ('before', 'Other caption'), ('after', 'ОГЭ-2028')]:
            bad = copy.deepcopy(approved)
            bad['approved_editorial_corrections'][0][field] = value
            with self.subTest(field=field):
                self.assertFalse(C.document_text_evidence_valid(bad))
        for field in ('all_non_url_text_unchanged',
                      'all_non_url_text_unchanged_except_approved_corrections',
                      'approved_editorial_corrections'):
            bad = copy.deepcopy(approved)
            del bad[field]
            with self.subTest(missing=field):
                self.assertFalse(C.document_text_evidence_valid(bad))
        bad = copy.deepcopy(approved)
        bad['all_non_url_text_unchanged'] = True
        self.assertFalse(C.document_text_evidence_valid(bad))
        bad = copy.deepcopy(approved)
        bad['approved_editorial_corrections'].append(dict(bad['approved_editorial_corrections'][0]))
        self.assertFalse(C.document_text_evidence_valid(bad))

    def test_document_negative_cases_cannot_be_omitted_or_invented(self):
        expected = {
            'swapped_docx_qr_images', 'wrong_displayed_url_unchanged_hyperlink',
            'swapped_same_page_pdf_qr', 'moved_pdf_qr_page',
            'extra_non_url_edit', 'diagnostic_edit_without_opt_in',
            'missing_diagnostic_edit', 'duplicated_diagnostic_edit',
            'moved_diagnostic_edit', 'wrong_diagnostic_year',
            'stale_pdf_diagnostic_caption', 'moved_pdf_diagnostic_caption',
        }
        cases = dict.fromkeys(expected, 'rejected')
        self.assertTrue(C.document_negative_cases_valid(cases))
        for name in expected:
            missing = dict(cases)
            del missing[name]
            failed = dict(cases, **{name: 'accepted'})
            with self.subTest(name=name):
                self.assertFalse(C.document_negative_cases_valid(missing))
                self.assertFalse(C.document_negative_cases_valid(failed))
        self.assertFalse(C.document_negative_cases_valid({**cases, 'invented': 'rejected'}))
        self.assertFalse(C.document_negative_cases_valid(None))

    def test_forged_live_counts_do_not_hide_failed_rows(self):
        path = self.root / 'live.json'
        path.write_text(json.dumps({'base_sha': 'f' * 40, 'counts': {'http_200': 71},
                                   'results': [{'url': 'https://mathexam.space/', 'http_status': 503}]}))
        result = C.live_verification(self.root, path, {'https://mathexam.space/'}, 'f' * 40)
        self.assertEqual(result['status'], 'FAIL')
        self.assertEqual(result['http200'], 0)

    def test_failed_rerun_removes_stale_success_output(self):
        output = self.root / 'old-success.json'
        output.write_text('{"counts":{"requiresTesting":0}}')
        with patch.object(C, 'ROOT', self.root), patch.object(sys, 'argv', ['collector', '--output', str(output)]):
            with self.assertRaises(FileNotFoundError):
                C.main()
        self.assertFalse(output.exists())

    def test_always_applicable_checks_cannot_be_na_even_with_an_explanation(self):
        for name in ('start', 'layout', 'topic', 'runtime'):
            for keep_pass in (False, True):
                report = copy.deepcopy(self.report)
                action = {'action': name, 'status': 'NA', 'reason': 'Synthetic omission with a nonempty explanation'}
                if keep_pass:
                    report['actions'].append(action)
                else:
                    next(a for a in report['actions'] if a['action'] == name).update(action)
                with self.subTest(name=name, keep_pass=keep_pass):
                    self.assertNotEqual(self.case(report)['status'], 'PASS')

    def test_four_na_exercise_actions_do_not_turn_a_trainer_into_navigation(self):
        report = copy.deepcopy(self.report)
        for action in report['actions']:
            if action['action'] in {'wrong-answer', 'correct-answer', 'hints', 'finish'}:
                action.update(status='NA', reason='Synthetic omitted exercise')
        case = self.case(report)
        self.assertFalse(case['navigation'])
        self.assertNotEqual(case['status'], 'PASS')
        self.assertEqual(C.mathematical_status([case], [], case['navigation'])[0], 'PENDING')
        report['family'] = 'navigation'
        self.assertFalse(self.case(report)['navigation'])
        self.assertNotEqual(self.case(report)['status'], 'PASS')

    def test_exact_six_navigation_contracts_preserve_valid_na_actions(self):
        self.assertEqual(len(C.NAVIGATION), 6)
        for route, (ident, family) in C.NAVIGATION.items():
            report = copy.deepcopy(self.report)
            raw = b'<html>Navigation fixture</html>'
            local = self.root / C.path_for_url(route)
            local.parent.mkdir(parents=True, exist_ok=True)
            local.write_bytes(raw)
            digest = hashlib.sha256(raw).hexdigest()
            report.update(id=ident, route=route, finalPath=route, sha256=digest, finalHtmlSha256=digest, oracles=[])
            report['resources'][route] = {'status': 200, 'sha256': digest}
            for action in report['actions']:
                if action['action'] in C.NAVIGATION_NA:
                    action.update(status='NA', reason='Navigation index, no exercise.')
            if family == 'basics':
                report.update(status='PASS', testedPath=route, family='navigation')
            with self.subTest(route=route):
                case = self.case(report, family=family)
                self.assertEqual(case['status'], 'PASS')
                self.assertTrue(case['navigation'])
                self.assertEqual(C.mathematical_status([case], [], True)[0], 'NA')
                wrong_family = 'exam' if family == 'basics' else 'basics'
                self.assertFalse(self.case(report, family=wrong_family)['navigation'])

    def test_missing_single_declared_engine_hash_is_not_complete_identity(self):
        report = copy.deepcopy(self.report)
        del report['resources']['/assets/engine.js']
        case = self.case(report)
        self.assertEqual(case['actions']['identity'], 'FAIL')
        self.assertNotEqual(case['status'], 'PASS')
        self.assertTrue(any('declared script dependency was not hashed' in reason for reason in case['staleResources']))

    def test_missing_declared_stylesheet_and_recursive_css_import_are_rejected(self):
        report = copy.deepcopy(self.report)
        raw = b'<html><link rel="stylesheet" href="/assets/first.css"></html>'
        (self.root / self.route.lstrip('/')).write_bytes(raw)
        report['sha256'] = report['finalHtmlSha256'] = hashlib.sha256(raw).hexdigest()
        report['resources'][self.route]['sha256'] = report['sha256']
        assets = {'/assets/first.css': b'@import url("second.css");',
                  '/assets/second.css': b'@import "/assets/third.css";',
                  '/assets/third.css': b'body { color: black; }'}
        for url, content in assets.items():
            (self.root / url.lstrip('/')).write_bytes(content)
        self.assertEqual(self.case(report)['actions']['identity'], 'FAIL')
        for url in ('/assets/first.css', '/assets/second.css'):
            report['resources'][url] = {'status': 200, 'sha256': hashlib.sha256(assets[url]).hexdigest()}
        case = self.case(report)
        self.assertEqual(case['actions']['identity'], 'FAIL')
        self.assertTrue(any('/assets/third.css' in problem for problem in case['staleResources']))
        report['resources']['/assets/third.css'] = {'status': 200, 'sha256': hashlib.sha256(assets['/assets/third.css']).hexdigest()}
        self.assertEqual(self.case(report)['actions']['identity'], 'PASS')

    def test_missing_static_module_dependency_is_rejected(self):
        report = copy.deepcopy(self.report)
        raw = b'import { number } from "./nested.js";\nexport { other } from "./other.js";'
        (self.root / 'assets/engine.js').write_bytes(raw)
        report['resources']['/assets/engine.js']['sha256'] = hashlib.sha256(raw).hexdigest()
        for name in ('nested', 'other'):
            content = ('export const ' + name + ' = 1;').encode()
            (self.root / ('assets/' + name + '.js')).write_bytes(content)
        case = self.case(report)
        self.assertEqual(case['actions']['identity'], 'FAIL')
        self.assertTrue(any('/assets/nested.js' in problem for problem in case['staleResources']))
        self.assertTrue(any('/assets/other.js' in problem for problem in case['staleResources']))
        for name in ('nested', 'other'):
            local = self.root / ('assets/' + name + '.js')
            report['resources']['/assets/' + name + '.js'] = {'status': 200, 'sha256': C.sha(local)}
        self.assertEqual(self.case(report)['actions']['identity'], 'PASS')

    def test_only_source_font_stylesheets_have_an_explicit_external_exclusion(self):
        raw = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Example">'
        local = self.root / self.route.lstrip('/')
        local.write_text(raw)
        observed = {self.route.lstrip('/'): C.sha(local)}
        result = C.declared_dependencies(self.root, observed, self.report, self.route, False)
        self.assertEqual(result['status'], 'PASS')
        self.assertEqual(len(result['exclusions']), 1)
        self.assertEqual(result['exclusions'][0]['status'], 'NA')
        self.assertEqual(C.declared_dependencies(self.root, observed, self.report, self.route, True)['status'], 'FAIL')
        local.write_text('<script src="https://fonts.googleapis.com/css2?family=Example"></script>')
        self.assertEqual(C.declared_dependencies(self.root, observed, self.report, self.route, False)['status'], 'FAIL')

    def test_redirect_shell_style_exclusion_requires_exact_known_destination(self):
        route = '/trainers/oge-task13-inequalities.html'
        target = '/trainers/oge13-inequalities-series.html'
        shell = self.root / route.lstrip('/')
        shell.write_text('<meta http-equiv="refresh" content="0; url=' + target + '"><link rel="stylesheet" href="/assets/unused.css">')
        destination = self.root / target.lstrip('/')
        destination.write_text('<html>Actual trainer</html>')
        report = {'route': route, 'finalPath': target}
        observed = {route.lstrip('/'): C.sha(shell), target.lstrip('/'): C.sha(destination)}
        result = C.declared_dependencies(self.root, observed, report, route, False)
        self.assertEqual(result['status'], 'PASS')
        self.assertEqual(len(result['exclusions']), 1)
        report['finalPath'] = route
        self.assertEqual(C.declared_dependencies(self.root, observed, report, route, False)['status'], 'FAIL')
        report['finalPath'] = target
        shell.write_text(shell.read_text() + '<script src="/assets/missing.js"></script>')
        self.assertEqual(C.declared_dependencies(self.root, observed, report, route, False)['status'], 'FAIL')


if __name__ == '__main__':
    unittest.main(verbosity=2)
