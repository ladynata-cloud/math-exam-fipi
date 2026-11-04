"""Negative placement fixtures built from locally supplied private candidates.

No book or fixture is committed. Run after the positive document checker:

  python tools/oge-book-document-check.test.py --docx CANDIDATE.docx \
    --pdf CANDIDATE.pdf --source-docx ORIGINAL.docx --inventory INVENTORY.json \
    --report POSITIVE_REPORT.json [--mapping scripts/oge-book-edition/urls.json]

Requires the same dependencies as oge-book-document-check.py.
Use --synthetic-only in public CI to run the eight caption-boundary tests
without privately supplied books; it does not replace the full local run.
"""
import argparse
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile

sys.dont_write_bytecode = True
CHECKER = Path(__file__).with_name('oge-book-document-check.py')
SPEC = importlib.util.spec_from_file_location('oge_book_document_check', CHECKER)
CHECK = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CHECK)
ARGS = None


class PlacementRegressionTests(unittest.TestCase):
    def setUp(self):
        self.inventory = json.loads(Path(ARGS.inventory).read_text())
        self.report = json.loads(Path(ARGS.report).read_text())
        self.mapping = json.loads(Path(ARGS.mapping).read_text())
        self.replacement = {row['sourceUrl']: row['bookUrl'] for row in self.mapping}
        self.assertEqual(self.report['status'], 'passed')
        self.assertEqual(self.report['docx_sha256'], CHECK.checksum(ARGS.docx))
        self.assertEqual(self.report['pdf_sha256'], CHECK.checksum(ARGS.pdf))
        self.assertEqual(self.report['mapping_sha256'], CHECK.checksum(ARGS.mapping))

    def rejected_docx(self, edits, error):
        with tempfile.TemporaryDirectory(prefix='oge-book-placement-') as directory:
            candidate = Path(directory) / 'negative.docx'
            output = Path(directory) / 'result.json'
            # A stale success report must not survive a failed rerun.
            output.write_text('{"status":"passed","stale":true}\n')
            with zipfile.ZipFile(ARGS.docx) as original, zipfile.ZipFile(candidate, 'w') as changed:
                for item in original.infolist():
                    changed.writestr(item, edits.get(item.filename, original.read(item.filename)))
            command = [
                sys.executable, str(CHECKER), '--docx', str(candidate),
                '--pdf', ARGS.pdf, '--source-docx', ARGS.source_docx,
                '--inventory', ARGS.inventory, '--mapping', ARGS.mapping,
                '--output', str(output),
            ]
            if ARGS.allow_diagnostic_season_2027:
                command.append('--allow-diagnostic-season-2027')
            result = subprocess.run(command, capture_output=True, text=True, timeout=180)
            self.assertNotEqual(result.returncode, 0, 'Mutated candidate was incorrectly accepted')
            self.assertIn(error, result.stderr)
            self.assertFalse(output.exists(), 'Failed verification retained stale passing evidence')

    def test_swapping_two_docx_qr_images_is_rejected(self):
        first, second = self.inventory['docx']['qr_placements'][:2]
        self.assertNotEqual(first['normalized_url'], second['normalized_url'])
        self.assertNotEqual(first['media'], second['media'])
        with zipfile.ZipFile(ARGS.docx) as archive:
            edits = {first['media']: archive.read(second['media']),
                     second['media']: archive.read(first['media'])}
        self.rejected_docx(edits, 'DOCX QR placement mismatch')

    def test_displayed_short_url_with_unchanged_hyperlink_is_rejected(self):
        first, second = self.mapping[:2]
        with zipfile.ZipFile(ARGS.docx) as archive:
            body = archive.read('word/document.xml')
        old = first['bookUrl'].removeprefix('https://').encode()
        new = second['bookUrl'].removeprefix('https://').encode()
        self.assertIn(old, body)
        self.rejected_docx({'word/document.xml': body.replace(old, new, 1)},
                           'Visible URL placement mismatch')

    def test_swapping_pdf_qrs_on_the_same_page_is_rejected(self):
        actual = copy.deepcopy(self.report['pdf_qr'])
        same_page = next([row for row in actual if row['page'] == first['page']]
                         for first in actual
                         if sum(row['page'] == first['page'] for row in actual) > 1)
        first, second = same_page[:2]
        self.assertNotEqual(first['url'], second['url'])
        first['url'], second['url'] = second['url'], first['url']
        with self.assertRaisesRegex(ValueError, 'PDF QR placement mismatch'):
            CHECK.check_pdf_qr_placements(self.inventory['pdf']['qr_placements'], actual, self.replacement)

    def test_moving_pdf_qr_to_a_different_page_is_rejected(self):
        actual = copy.deepcopy(self.report['pdf_qr'])
        actual[0]['page'] = max(row['page'] for row in actual) + 1
        with self.assertRaisesRegex(ValueError, 'QR page assignment changed'):
            CHECK.check_pdf_qr_placements(self.inventory['pdf']['qr_placements'], actual, self.replacement)


class DiagnosticCaptionRegressionTests(unittest.TestCase):
    """Synthetic text fixtures; no private paragraphs are embedded in tests."""
    def setUp(self):
        self.source = ['Synthetic paragraph ' + str(i) for i in range(168)]
        self.source[167] = CHECK.DIAGNOSTIC_SEASON_CORRECTION['before'] + ' Synthetic text.'
        self.candidate = list(self.source)
        self.candidate[167] = CHECK.DIAGNOSTIC_SEASON_CORRECTION['after'] + ' Synthetic text.'
        self.corrections = CHECK.check_non_url_text(self.source, self.candidate, True)
        self.assertEqual(self.corrections, [CHECK.DIAGNOSTIC_SEASON_CORRECTION])

    def test_extra_non_url_edit_is_rejected(self):
        self.candidate[0] += ' Unapproved change.'
        with self.assertRaisesRegex(ValueError, 'outside approved corrections'):
            CHECK.check_non_url_text(self.source, self.candidate, True)

    def test_diagnostic_edit_without_opt_in_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'outside approved corrections'):
            CHECK.check_non_url_text(self.source, self.candidate)

    def test_missing_diagnostic_edit_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'missing, duplicated or moved'):
            CHECK.check_non_url_text(self.source, self.source, True)

    def test_duplicated_diagnostic_edit_is_rejected(self):
        self.candidate[0] = self.candidate[167]
        with self.assertRaisesRegex(ValueError, 'missing, duplicated or moved'):
            CHECK.check_non_url_text(self.source, self.candidate, True)

    def test_moved_diagnostic_edit_is_rejected(self):
        self.candidate[0], self.candidate[167] = self.candidate[167], self.candidate[0]
        with self.assertRaisesRegex(ValueError, 'missing, duplicated or moved'):
            CHECK.check_non_url_text(self.source, self.candidate, True)

    def test_wrong_diagnostic_year_is_rejected(self):
        self.candidate[167] = self.candidate[167].replace('2027', '2028')
        with self.assertRaisesRegex(ValueError, 'missing, duplicated or moved'):
            CHECK.check_non_url_text(self.source, self.candidate, True)

    def test_stale_pdf_diagnostic_caption_is_rejected(self):
        pages = ['Synthetic page' for _ in range(72)]
        pages[12] = CHECK.DIAGNOSTIC_SEASON_CORRECTION['before']
        with self.assertRaisesRegex(ValueError, 'PDF diagnostic season caption'):
            CHECK.check_pdf_diagnostic_caption(pages, self.corrections)

    def test_moved_pdf_diagnostic_caption_is_rejected(self):
        pages = ['Synthetic page' for _ in range(72)]
        pages[11] = CHECK.DIAGNOSTIC_SEASON_CORRECTION['after']
        with self.assertRaisesRegex(ValueError, 'PDF diagnostic season caption'):
            CHECK.check_pdf_diagnostic_caption(pages, self.corrections)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for argument in ('docx', 'pdf', 'source-docx', 'inventory', 'report'):
        parser.add_argument('--' + argument)
    parser.add_argument('--mapping', default='scripts/oge-book-edition/urls.json')
    parser.add_argument('--allow-diagnostic-season-2027', action='store_true')
    parser.add_argument('--synthetic-only', action='store_true',
                        help='Run public caption fixtures only; private placement checks remain required locally')
    ARGS, extra = parser.parse_known_args()
    if ARGS.synthetic_only:
        unittest.main(argv=[sys.argv[0], 'DiagnosticCaptionRegressionTests', *extra], verbosity=2)
    else:
        missing = [name for name in ('docx', 'pdf', 'source_docx', 'inventory', 'report')
                   if getattr(ARGS, name) is None]
        if missing:
            parser.error('Full document checks require: ' + ', '.join('--' + name.replace('_', '-') for name in missing))
        unittest.main(argv=[sys.argv[0], *extra], verbosity=2)
