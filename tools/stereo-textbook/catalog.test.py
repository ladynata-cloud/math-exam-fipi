import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('build_textbook', Path(__file__).with_name('build_textbook.py'))
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
COURSE = ROOT / 'stereo-course/textbook'
INDEX = json.loads((COURSE / 'source-index.json').read_text())
LESSONS = [json.loads(p.read_text()) for p in sorted((COURSE / 'lessons').glob('*.json'))]


class SourceCoverage(unittest.TestCase):
    def test_complete_number_namespaces(self):
        entries = INDEX['entries']
        main = [int(x['source']['exercise']) for x in entries if x['source']['collection'] == 'main']
        self.assertEqual(main, list(range(1, 871)))
        for group, count in [(3, 38), (6, 25), (8, 29), (14, 22), (16, 43)]:
            numbers = [int(x['source']['exercise']) for x in entries if x['source'].get('examTask') == group]
            self.assertEqual(numbers, list(range(1, count + 1)))
        for group, count in [('practical', 24), ('research', 5), ('selfcheck', 96), ('theory', 101)]:
            self.assertEqual(sum(x['source']['collection'] == group for x in entries), count)
        self.assertEqual(len(entries), 1253)

    def test_each_partial_exercise_keeps_remaining_parts(self):
        first = next(x for x in LESSONS if x['source'].get('exercise') == '1' and x['source'].get('subpart') == 'а')
        bundle = builder.build(INDEX, [first])
        parts = [x for x in bundle['catalog']['entries'] if x['source']['collection'] == 'main' and x['source']['exercise'] == '1']
        self.assertEqual({x['source']['subpart'] for x in parts}, {'а', 'б', 'в', 'г'})
        self.assertEqual(sum(x['status'] == 'draft' for x in parts), 3)

    def test_partial_unlettered_question_or_theory_never_hides_siblings(self):
        cases = [('main', '18', None, 2), ('main', '7', None, 2), ('theory', None, '2', 5), ('theory', None, '3', 2)]
        for collection, number, point, expected in cases:
            first = next(x for x in LESSONS if x['source']['collection'] == collection
                         and x['source'].get('exercise') == number and x['source'].get('point') == point)
            bundle = builder.build(INDEX, [first])
            group = [x for x in bundle['catalog']['entries']
                     if builder.identity(x['source']) == builder.identity(first['source'])]
            self.assertEqual(len(group), expected)
            self.assertEqual(sum(x['status'] == 'draft' for x in group), expected - 1)

    def test_authored_source_requires_explicit_completeness_contract(self):
        import copy
        index = copy.deepcopy(INDEX)
        first = LESSONS[0]
        entry = next(x for x in index['entries'] if builder.identity(x['source']) == builder.identity(first['source']))
        entry.pop('requiredParts')
        self.assertRaises(ValueError, builder.build, index, [first])

    def test_source_pages_and_no_raw_upload(self):
        for entry in INDEX['entries']:
            source = entry['source']
            self.assertEqual(source['pdfPages'], [n + 2 for n in source['printedPages']])
            self.assertTrue(all(0 < n <= 290 for n in source['pdfPages']))
        serialized = json.dumps(INDEX, ensure_ascii=False)
        for prohibited in ['raw_text', 'condition_text_raw', '/workspace/', 'libfile_', 'file_000000']:
            self.assertNotIn(prohibited, serialized)

    def test_source_rejects_unknown_number_or_wrong_page(self):
        import copy
        bad = copy.deepcopy(LESSONS[0])
        bad['source']['printedPages'] = [287]
        self.assertRaises(ValueError, builder.build, INDEX, [bad])
        bad = copy.deepcopy(next(x for x in LESSONS if x['kind'] == 'exercise'))
        bad['source']['exercise'] = '9999'
        self.assertRaises(ValueError, builder.build, INDEX, [bad])

    def test_reproducible_course(self):
        actual = json.loads((COURSE / 'data/course.json').read_text())
        self.assertEqual(actual, builder.build(INDEX, LESSONS))


if __name__ == '__main__':
    unittest.main()
