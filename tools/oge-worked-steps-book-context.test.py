"""The UI receipt cannot excuse altered mathematics, geometry or resource bytes."""
import copy
import hashlib
import importlib.util
import json
import subprocess
import unittest
from unittest.mock import patch
from oge_worked_steps_book_context import ROOT, PINS, OLD_HELP, NEW_HELP, PAN, matches_worked_steps_ui

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
    hashes = {pin['route']: pin['sha256'], **PINS['assets']}
    record = dict(id=ident, width=width, prefix='', route=pin['route'], finalPath=pin['route'],
                  resources={p: dict(status=200, sha256=h) for p, h in hashes.items()},
                  initialVisibleText=text, visibleSvgLabels=[])
    return record, text, original, fixture


class WorkedStepContext(unittest.TestCase):
    def test_pins_bind_only_the_three_committed_pages_and_two_figure_assets(self):
        self.assertEqual(set(PINS['pages']), {'58', '59', '60'})
        self.assertEqual(set(PINS['assets']), {'/trainers/oge-course-geometry.css', '/trainers/oge-course-geometry.js'})
        for route, expected in {**{v['route']: v['sha256'] for v in PINS['pages'].values()}, **PINS['assets']}.items():
            committed = subprocess.check_output(['git', 'show', PINS['sourceCommit'] + ':' + route[1:]], cwd=ROOT)
            self.assertEqual(hashlib.sha256(committed).hexdigest(), expected)
            self.assertEqual((ROOT / route[1:]).read_bytes(), committed)

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


if __name__ == '__main__':
    unittest.main()
