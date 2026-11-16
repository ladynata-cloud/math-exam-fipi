"""The UI receipt cannot excuse altered mathematics, geometry or resource bytes."""
import copy
import hashlib
import importlib.util
import json
import subprocess
import unittest
from unittest.mock import patch
from oge_worked_steps_book_context import ROOT, PINS, OLD_HELP, NEW_HELP, PAN, source_pin, matches_worked_steps_ui
from oge_video_models_book_context import V3, WAYFINDING_LABEL, sha, without_download_controls

spec = importlib.util.spec_from_file_location('book_math', ROOT / 'tools/oge-book-exam-math.py')
math = importlib.util.module_from_spec(spec)
spec.loader.exec_module(math)
FIXTURES = json.loads((ROOT / 'tools/fixtures/oge-book-exam-math.json').read_text())['fixtures']


def case(ident, width):
    pin = PINS['pages'][ident]
    fixture = FIXTURES[ident].get('sourceVariant', FIXTURES[ident])
    original = fixture['visibleText']
    text = original.replace('Хочешь подсказку?', 'Разобрать по шагам')
    if ident in ('59', '60') and width == 1280:
        text = text.replace('Если рисунок не помещается, прокрути его пальцем или кнопками. Стрелки клавиатуры тоже работают. ← ВлевоВправо → ', '')
    hashes = {route: hashlib.sha256((ROOT / route[1:]).read_bytes()).hexdigest()
              for route in [pin['route'], *PINS['assets']]}
    record = dict(id=ident, width=width, prefix='', route=pin['route'], finalPath=pin['route'],
                  resources={p: dict(status=200, sha256=h) for p, h in hashes.items()},
                  initialVisibleText=text, visibleSvgLabels=[])
    return record, text, original, fixture


def frozen_record(record, text, assets):
    record = copy.deepcopy(record)
    prefix, route = V3['prefix'], record['route']
    record.update(prefix=prefix, finalPath=prefix + route)
    files = [route, *assets, '/edition-assets/bootstrap.js', '/edition-assets/edition.css',
             '/assets/oge-wayfinding.css', '/assets/oge-wayfinding.js']
    record['resources'] = {prefix + file: dict(status=200, sha256=sha((ROOT / (prefix + file)[1:]).read_bytes()))
                           for file in files}
    record['frozenWayfinding'] = dict(kind='oge-frozen-return-v3', visibleText=WAYFINDING_LABEL,
                                     servedHtmlSha256=record['resources'][prefix + route]['sha256'],
                                     manifestSha256=V3['manifestSha256'])
    record['initialVisibleText'] = text + ' ' + math.BOOK_BANNERS[prefix]
    record['unfilteredInitialVisibleText'] = WAYFINDING_LABEL + ' ' + record['initialVisibleText']
    return record


class WorkedStepContext(unittest.TestCase):
    def test_pins_bind_only_the_three_committed_pages_and_two_figure_assets(self):
        self.assertEqual(set(PINS['pages']), {'58', '59', '60'})
        self.assertEqual(set(PINS['assets']), {'/trainers/oge-course-geometry.css', '/trainers/oge-course-geometry.js'})
        for route, expected in {**{v['route']: v['sha256'] for v in PINS['pages'].values()}, **PINS['assets']}.items():
            committed = subprocess.check_output(['git', 'show', PINS['sourceCommit'] + ':' + route[1:]], cwd=ROOT)
            self.assertEqual(hashlib.sha256(committed).hexdigest(), expected)
            raw = (ROOT / route[1:]).read_bytes()
            if route == PINS['pages']['58']['route']:
                reviewed = subprocess.check_output(['git', 'show', V3['sourceCommit'] + ':' + route[1:]], cwd=ROOT)
                self.assertEqual(sha(without_download_controls(route[1:], reviewed)), source_pin('58')['sha256'])
                self.assertEqual(without_download_controls(route[1:], raw), without_download_controls(route[1:], reviewed))
            else:
                self.assertEqual(without_download_controls(route[1:], raw), committed)

    def test_receipt_requires_served_bytes_and_original_exercise(self):
        record, text, original, _ = case('59', 320)
        route = record['route']
        file = ROOT / route[1:]
        raw = file.read_bytes()
        stale = copy.deepcopy(record)
        stale['resources'][route]['sha256'] = PINS['pages']['59']['sha256']
        self.assertNotEqual(stale['resources'][route]['sha256'], record['resources'][route]['sha256'])
        self.assertFalse(matches_worked_steps_ui(stale, text, [original]))
        for changed in (raw.replace(b'<title>', b'<title>Extra ', 1),
                        raw.replace(b'<section class="download-panel"', b'<section class="download-panel" extra', 1)
                           .replace(b'data-trainer-download=', b'data-trainer-export=', 1)):
            self.assertNotEqual(changed, raw)
            wrong = copy.deepcopy(record)
            wrong['resources'][route]['sha256'] = hashlib.sha256(changed).hexdigest()
            read = type(file).read_bytes
            with patch.object(type(file), 'read_bytes', lambda p: changed if p == file else read(p)):
                self.assertFalse(matches_worked_steps_ui(wrong, text, [original]))

    def test_nine_exact_ui_deltas_and_no_other_text_changes(self):
        for ident in ('58', '59', '60'):
            for width in (320, 390, 1280):
                with self.subTest(ident=ident, width=width):
                    r, text, original, _ = case(ident, width)
                    self.assertTrue(matches_worked_steps_ui(r, text, [original]))
                    for changed in (text + ' ', text + NEW_HELP, text.replace(NEW_HELP, 'Другой текст'),
                                    text.replace('Найдите', 'Не найдите'), text.replace('Ответ', 'Другой ответ')):
                        if changed != text:
                            self.assertFalse(matches_worked_steps_ui(r, changed, [original]))
                    if PAN in text:
                        self.assertFalse(matches_worked_steps_ui(r, text.replace(PAN, ''), [original]))
                    else:
                        self.assertFalse(matches_worked_steps_ui(r, PAN + text, [original]))

    def test_changed_route_width_resources_and_fixed_editions_are_rejected(self):
        r, text, original, _ = case('59', 1280)
        for field, value in [('id', '58'), ('width', 1000), ('route', '/other'), ('finalPath', '/other'), ('prefix', '/book/oge/2026-10-31/v1')]:
            self.assertFalse(matches_worked_steps_ui(dict(r, **{field: value}), text, [original]), field)
        for route in r['resources']:
            for key, value in [('status', 404), ('sha256', '0' * 64)]:
                changed = copy.deepcopy(r); changed['resources'][route][key] = value
                self.assertFalse(matches_worked_steps_ui(changed, text, [original]))
            changed = copy.deepcopy(r); del changed['resources'][route]
            self.assertFalse(matches_worked_steps_ui(changed, text, [original]))

    def test_exact_v3_worked_ui_in_all_nine_cases_preserves_text_and_served_resource_guards(self):
        for ident in ('58', '59', '60'):
            for width in (320, 390, 1280):
                record, text, original, _ = case(ident, width)
                record = frozen_record(record, text, PINS['assets'])
                self.assertTrue(matches_worked_steps_ui(record, text, [original]), (ident, width))
                for changed_text in (text + ' ', text + NEW_HELP, text.replace(NEW_HELP, 'Другой текст'),
                                     text.replace('Ответ', 'Другой ответ')):
                    if changed_text != text:
                        self.assertFalse(matches_worked_steps_ui(record, changed_text, [original]))
                for prefix in ('', '/book/oge/2026-10-31/v1', '/book/oge/2026-10-31/v2', '/book/oge/2026-11-17/v3'):
                    self.assertFalse(matches_worked_steps_ui(dict(record, prefix=prefix), text, [original]))
                for route in record['resources']:
                    changed = copy.deepcopy(record); changed['resources'][route]['sha256'] = '0' * 64
                    self.assertFalse(matches_worked_steps_ui(changed, text, [original]), route)
                changed = copy.deepcopy(record); del changed['frozenWayfinding']
                self.assertFalse(matches_worked_steps_ui(changed, text, [original]))

    def test_v3_math_context_retains_prompt_answer_and_geometry_checks_after_exact_ui_projection(self):
        record, text, original, fixture = case('58', 320)
        record = frozen_record(record, text, PINS['assets'])
        oracle = fixture['oracles'][0]
        with (patch.object(math, 'verified_context', return_value=(record['initialVisibleText'], [])),
              patch.object(math, 'geom', return_value=fixture['geometrySha256'])):
            self.assertTrue(math.exact_reviewed_context(record, oracle, FIXTURES))
            self.assertFalse(math.exact_reviewed_context(record, dict(oracle, expected=[26]), FIXTURES))
            self.assertFalse(math.exact_reviewed_context(record, dict(oracle, prompt=oracle['prompt'] + ' changed'), FIXTURES))
        with (patch.object(math, 'verified_context', return_value=(record['initialVisibleText'], [])),
              patch.object(math, 'geom', return_value='0' * 64)):
            self.assertFalse(math.exact_reviewed_context(record, oracle, FIXTURES))

    def test_v3_proof_caption_projection_requires_the_frozen_wrapper_and_exact_oracle(self):
        fixture = FIXTURES['65']
        old = fixture['oracles'][0]['prompt'].split(' A B C D E ', 1)[0]
        captions = {320: 'Увеличить подписи Чертёж целиком.', 390: 'Увеличить подписи Чертёж целиком.',
                    1280: 'Показать целиком Крупный чертёж: прокручивай его стрелками после выбора рисунка.'}
        assets = ['/trainers/oge-course-proof.css', '/trainers/oge-course-proof.js']
        for width, caption in captions.items():
            text = fixture['visibleText'].replace(old, caption, 1)
            oracle = fixture['oracles'][0]
            updated = dict(oracle, prompt=oracle['prompt'].replace(old, caption, 1))
            record = dict(id='65', width=width, route='/trainers/oge-task24-proofs.html',
                          videoModelContext=dict(sourceBase=V3['sourceCommit']))
            record = frozen_record(record, text, assets)
            with (patch.object(math, 'verified_context', return_value=(record['initialVisibleText'], [])),
                  patch.object(math, 'geom', return_value=fixture['geometrySha256'])):
                self.assertTrue(math.exact_reviewed_context(record, updated, FIXTURES))
                self.assertTrue(math.exact_reviewed_context(record, fixture['oracles'][1], FIXTURES))
                self.assertFalse(math.exact_reviewed_context(record, oracle, FIXTURES))
                self.assertFalse(math.exact_reviewed_context(record, dict(updated, expected=[]), FIXTURES))
                self.assertFalse(math.exact_reviewed_context(record, dict(updated, prompt=updated['prompt'] + ' changed'), FIXTURES))
                for asset in assets:
                    changed = copy.deepcopy(record); changed['resources'][V3['prefix'] + asset]['sha256'] = '0' * 64
                    self.assertFalse(math.exact_reviewed_context(changed, updated, FIXTURES))

    def test_math_context_still_requires_exact_prompt_answer_and_geometry(self):
        r, text, original, fixture = case('58', 320)
        oracle = fixture['oracles'][0]
        # Isolate the new text allowance; geometry/oracle comparisons must remain mandatory.
        with patch.object(math, 'verified_context', return_value=(text, [])), patch.object(math, 'geom', return_value=fixture['geometrySha256']):
            self.assertTrue(math.exact_reviewed_context(r, oracle, FIXTURES))
            self.assertFalse(math.exact_reviewed_context(r, dict(oracle, expected=[26]), FIXTURES))
            self.assertFalse(math.exact_reviewed_context(r, dict(oracle, prompt=oracle['prompt'] + ' changed'), FIXTURES))
        with patch.object(math, 'verified_context', return_value=(text, [])), patch.object(math, 'geom', return_value='0' * 64):
            self.assertFalse(math.exact_reviewed_context(r, oracle, FIXTURES))

    def test_proof_figure_captions_keep_reviewed_condition_and_steps_exact(self):
        route = '/trainers/oge-task24-proofs.html'
        fixture = FIXTURES['65']
        old = fixture['oracles'][0]['prompt'].split(' A B C D E ', 1)[0]
        phone = 'Увеличить подписи Чертёж целиком.'
        desktop = 'Показать целиком Крупный чертёж: прокручивай его стрелками после выбора рисунка.'
        assets = ['/trainers/oge-course-proof.css', '/trainers/oge-course-proof.js']
        resources = {asset: dict(status=200, sha256=hashlib.sha256((ROOT / asset[1:]).read_bytes()).hexdigest())
                     for asset in assets}
        for width, caption in [(320, phone), (390, phone), (1280, desktop)]:
            record = dict(id='65', prefix='', route=route, finalPath=route, width=width, resources=resources,
                          videoModelContext=dict(sourceBase=V3['sourceCommit']))
            text = fixture['visibleText'].replace(old, caption, 1)
            oracle = fixture['oracles'][0]
            updated = dict(oracle, prompt=oracle['prompt'].replace(old, caption, 1))
            with (patch.object(math, 'verified_context', return_value=(text, [])),
                  patch.object(math, 'geom', return_value=fixture['geometrySha256'])):
                self.assertTrue(math.exact_reviewed_context(record, updated, FIXTURES))
                self.assertTrue(math.exact_reviewed_context(record, fixture['oracles'][1], FIXTURES))
                self.assertFalse(math.exact_reviewed_context(record, oracle, FIXTURES))
                self.assertFalse(math.exact_reviewed_context(record, dict(updated, prompt=updated['prompt']+' changed'), FIXTURES))
                self.assertFalse(math.exact_reviewed_context(record, dict(updated, expected=[]), FIXTURES))
                for field, value in [('width', 360), ('route', '/other'), ('finalPath', '/other'),
                                     ('prefix', '/book/oge/2026-10-31/v1'), ('videoModelContext', {})]:
                    self.assertFalse(math.exact_reviewed_context(dict(record, **{field: value}), updated, FIXTURES))
                for asset in assets:
                    changed = copy.deepcopy(record)
                    changed['resources'][asset]['sha256'] = '0' * 64
                    self.assertFalse(math.exact_reviewed_context(changed, updated, FIXTURES))
            with (patch.object(math, 'verified_context', return_value=(text+' changed', [])),
                  patch.object(math, 'geom', return_value=fixture['geometrySha256'])):
                self.assertFalse(math.exact_reviewed_context(record, updated, FIXTURES))
            with (patch.object(math, 'verified_context', return_value=(text, [])),
                  patch.object(math, 'geom', return_value='0' * 64)):
                self.assertFalse(math.exact_reviewed_context(record, updated, FIXTURES))


if __name__ == '__main__':
    unittest.main()
