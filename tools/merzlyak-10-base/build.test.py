#!/usr/bin/env python3
"""Isolated wrapper regressions: metadata, subparts and honest draft state."""
import copy
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]


class BuildContract(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.course = self.root / 'stereo-course/merzlyak-10-base'
        (self.course / 'lessons').mkdir(parents=True)
        for filename in ['tools/stereo-textbook/build_textbook.py',
                         'stereo-course/textbook/schema/catalog.schema.json']:
            target = self.root / filename
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / filename, target)
        fixture = json.loads((ROOT / 'tools/stereo-textbook/fixtures/course.json')
                             .read_text(encoding='utf-8'))
        lesson = copy.deepcopy(fixture['lessons'][0])
        lesson['status'] = 'draft'
        lesson['review'] = {'source': 'pending', 'mathematics': 'pending',
                            'pedagogy': 'pending'}
        lesson['source'].update(bookId='merzlyak-2022-10-base', exercise='1.1',
                                printedPages=[3], pdfPages=[4], subpart='а',
                                paragraph=1)
        self.lesson = lesson
        source = copy.deepcopy(lesson['source'])
        del source['subpart']
        self.index = {
            'book': {'id': 'merzlyak-2022-10-base', 'title': 'TEST ONLY',
                     'edition': 'TEST ONLY 2022', 'pdfPageCount': 209,
                     'printedPageCount': 208, 'isbn': 'TEST ONLY'},
            'inventoryComplete': False,
            'entries': [{'id': 'source-01-01', 'kind': 'exercise',
                         'title': 'TEST ONLY 1.1', 'source': source,
                         'requiredParts': ['а', 'б']}],
        }

    def tearDown(self):
        self.temp.cleanup()

    def run_build(self):
        self.original = json.dumps(self.index, ensure_ascii=False)
        (self.course / 'source-index.json').write_text(self.original, encoding='utf-8')
        (self.course / 'lessons/fixture.json').write_text(
            json.dumps(self.lesson, ensure_ascii=False), encoding='utf-8')
        env = dict(os.environ, PYTHONDONTWRITEBYTECODE='1')
        return subprocess.run(['python3', str(ROOT / 'tools/merzlyak-10-base/build.py'),
                               '--root', str(self.root)], env=env, text=True,
                              capture_output=True, check=False)

    def test_rich_source_metadata_preserved_and_pending_part_counted(self):
        result = self.run_build()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((self.course / 'source-index.json').read_text(encoding='utf-8'),
                         self.original)
        bundle = json.loads((self.course / 'data/course.json').read_text(encoding='utf-8'))
        self.assertNotIn('isbn', bundle['catalog']['book'])
        self.assertNotIn('printedPageCount', bundle['catalog']['book'])
        self.assertEqual(len(bundle['catalog']['entries']), 2)
        self.assertEqual({entry['source']['subpart'] for entry in bundle['catalog']['entries']},
                         {'а', 'б'})
        self.assertTrue(all(entry['status'] == 'draft' for entry in bundle['catalog']['entries']))
        self.assertTrue(all('paragraph' not in entry['source']
                            for entry in bundle['catalog']['entries']))
        self.assertEqual(bundle['lessons'][0]['status'], 'draft')
        self.assertEqual(bundle['lessons'][0]['review']['mathematics'], 'pending')
        self.assertNotIn('paragraph', bundle['lessons'][0]['source'])
        self.assertFalse(bundle['catalog']['inventoryComplete'])

    def test_missing_completeness_contract_is_rejected(self):
        del self.index['entries'][0]['requiredParts']
        result = self.run_build()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('completeness contract', result.stderr)
        self.assertFalse((self.course / 'data/course.json').exists())

    def test_wrong_book_is_rejected(self):
        self.index['book']['id'] = 'another-book'
        result = self.run_build()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Wrong source book', result.stderr)
        self.assertFalse((self.course / 'data/course.json').exists())


if __name__ == '__main__':
    unittest.main()
