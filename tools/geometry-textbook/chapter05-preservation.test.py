#!/usr/bin/env python3
"""Protect the published I–IV course, chapter V and explicit supplement boundaries.

The oracle was frozen from published commit 44eab4d1, not from a candidate build.
Default mode requires complete independently inventoried V integration and any
explicitly scoped grade-seven supplement. A hash-bound caption-only amendment
may change presentation files; it may not change published lesson payloads.
--preservation-only is an explicitly limited early-authoring check, not a V gate.
All corruption probes and missing-review experiments stay in memory or temp dirs.
"""
from __future__ import annotations

import argparse
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

from build_course import compose
from published_preservation import (assert_runtime_preserved, assert_source_inventory_preserved,
                                    assert_file_preserved)

ROOT = Path(__file__).resolve().parents[2]
COURSE = ROOT / 'geometry-course/textbook'
FIXTURE = ROOT / 'tools/geometry-textbook/published-chapters-01-04.json'
SOURCE_MAP = ROOT / 'tools/geometry-textbook/chapter-05-source-map.json'
SOURCE_COMMIT = '44eab4d11046d8613b50a73b00185755c814dba6'
FIXTURE_SHA256 = '379869da94677385c338d0b6332f809ff7e407ae5af60a695c7773298583b625'
BOOK_ID = 'atanasyan-2023-7-9'
SOURCE_SHA256 = '3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72'
OLD_LABELS = ('I', 'II', 'III', 'IV')
VIEW_FIELDS = frozenset(('label', 'points', 'segments', 'lines', 'rays',
                        'dashSegments', 'highlightSegments', 'polygons',
                        'circles', 'rightAngles', 'angleArcs', 'equalSegments',
                        'availableFromStep', 'note'))


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def normalized(value):
    return sha(json.dumps(value, ensure_ascii=False, sort_keys=True,
                          separators=(',', ':')).encode())


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def assert_file_bytes(name, raw, expected):
    assert_file_preserved(name, raw, expected)


def validate_published(bundle, frozen):
    """Full old records, ordered identifiers and build review bindings survive."""
    require(frozen['sourceCommit'] == SOURCE_COMMIT, 'Wrong frozen publication')
    require(frozen['cards'] == 569, 'Wrong published card count')
    for key, ids_key in [('lessons', 'publishedLessonIds'),
                         ('entries', 'publishedCatalogIds')]:
        all_rows = bundle['lessons'] if key == 'lessons' else bundle['catalog']['entries']
        ids = [row['id'] for row in all_rows]
        require(len(ids) == len(set(ids)), 'Duplicate ' + key + ' identity')
        previous = [row for row in all_rows if row['source']['chapter'] in OLD_LABELS]
        require([row['id'] for row in previous] == frozen[ids_key],
                'Published ordered ' + key + ' IDs changed')
        hash_key = 'normalizedLessonsSha256' if key == 'lessons' else 'normalizedCatalogEntriesSha256'
        require(normalized(previous) == frozen[hash_key], 'Published ' + key + ' payload changed')
    lessons = {row['id']: row for row in bundle['lessons']}
    entries = {row['id']: row for row in bundle['catalog']['entries']}
    for record in frozen['perCardHashes']:
        ident = record['id']
        require(ident in lessons and ident in entries, 'Missing published ID: ' + ident)
        require(lessons[ident]['revision'] == entries[ident]['revision'] == record['revision'],
                'Published learner-storage revision changed: ' + ident)
        require(normalized(lessons[ident]) == record['lessonSha256'], 'Published lesson changed: ' + ident)
        require(normalized(entries[ident]) == record['catalogEntrySha256'], 'Published catalog changed: ' + ident)
        require(lessons[ident]['status'] == entries[ident]['status'] == 'reviewed',
                'Published card approval revoked: ' + ident)
    for chapter in frozen['chapters']:
        actual = next((c for c in bundle['build']['chapters'] if c['chapter'] == chapter['chapter']), None)
        require(actual == chapter['publishedBuildRecord'],
                'Published chapter review/build binding changed: ' + chapter['label'])
    assert_runtime_preserved(bundle['build']['implementationSha256'], frozen['implementationSha256'])
    require(normalized(bundle['catalog']['book']) == frozen['catalogBookSha256'], 'Catalog edition changed')
    assert_source_inventory_preserved(bundle['sourceInventory'], frozen['normalizedSourceInventorySha256'])
    require(bundle['catalog']['inventoryComplete'] is False, 'Complete exercise inventory falsely claimed')
    require(bundle['build']['fullTextbookComplete'] is False, 'Complete textbook falsely claimed')


def expected_v_rows(source_map):
    """An independent source-map oracle; no counts or parts inferred from lessons."""
    require(source_map['bookId'] == BOOK_ID and source_map['chapter'] == 5, 'Wrong V source identity')
    source = source_map['source']
    require(source['sha256'] == SOURCE_SHA256, 'Wrong exact PDF')
    require(source['printedPages'] == [91, 115] and source['pdfPages'] == [92, 116]
            and source['pdfPageOffset'] == 1, 'Wrong V page scope')
    require([x['number'] for x in source_map['exercises']] == list(range(331, 413)),
            'V must include exactly main331–412; advanced413 onward is separate')
    require([x['number'] for x in source_map['theory']] == list(range(39, 46)),
            'V theory must be exactly independently inventoried39–45')
    require([x['number'] for x in source_map['selfchecks']] == list(range(1, 31)),
            'V selfchecks must be exactly1–30')
    expected = {}
    for collection, items in [('main', source_map['exercises']), ('theory', source_map['theory']),
                              ('selfcheck', source_map['selfchecks'])]:
        for item in items:
            pages = item['printedPages']
            require(pages and pages == sorted(set(pages)) and
                    all(type(p) is int and 91 <= p <= 115 for p in pages), 'Invalid exact V pages')
            parts = item['parts'] if collection == 'main' else ['single']
            require(parts and len(parts) == len(set(parts)), 'Missing/duplicate source parts')
            for index, part in enumerate(parts, 1):
                namespace = 'selfcheck-chapter-5' if collection == 'selfcheck' else collection
                ident = f'atanasyan-7-9-{namespace}-{item["number"]}-part-{index}'
                expected[ident] = dict(collection=collection, number=str(item['number']), part=part,
                                       printedPages=pages, pdfPages=[p+1 for p in pages])
    counts = source_map['counts']
    main_parts = sum(len(item['parts']) for item in source_map['exercises'])
    require(counts['mainNumbers'] == 82 and counts['mainParts'] == main_parts
            and counts['theory'] == 7 and counts['selfchecks'] == 30
            and counts['cards'] == len(expected) == main_parts+37, 'Independent V count mismatch')
    return expected


def expected_supplement_rows(scope):
    """A separately inventoried grade section must never be counted as chapter V."""
    supplements = scope.get('supplements', [])
    require(len(supplements) <= 1, 'Unexpected extra supplement')
    if not supplements:
        return {}
    supplement = supplements[0]
    require(supplement['key'] == '7-advanced' and supplement['exerciseNumbers'] == [413, 461]
            and supplement['label'] == '7 класс · повышенная трудность', 'Wrong advanced section scope')
    source = read(ROOT/'tools/geometry-textbook/grade-07-advanced-source-map.json')
    require(source['bookId'] == BOOK_ID and source['source']['sha256'] == SOURCE_SHA256,
            'Wrong advanced source edition')
    require([e['number'] for e in source['exercises']] == list(range(413, 462)),
            'Incomplete independent advanced inventory')
    rows = {}
    for exercise in source['exercises']:
        for i, part in enumerate(exercise['parts'], 1):
            rows[f"atanasyan-7-9-main-{exercise['number']}-part-{i}"] = part
    require(len(rows) == supplement['mainParts'] == supplement['cards'] == source['counts']['cards'],
            'Advanced card count differs from independent source')
    return rows


def validate_chapter_v(bundle, frozen, source_map, scope):
    validate_published(bundle, frozen)
    require(scope.get('schemaVersion') == 1 and scope.get('bookId') == BOOK_ID,
            'Release scope schema or exact edition changed')
    require(scope.get('fullTextbookComplete') is False,
            'Release scope falsely claims the full textbook is complete')
    expected = expected_v_rows(source_map)
    supplementary = expected_supplement_rows(scope)
    allowed = set(frozen['publishedLessonIds']) | set(expected) | set(supplementary)
    require({x['id'] for x in bundle['lessons']} == allowed, 'Missing or out-of-scope lesson identity')
    require({x['id'] for x in bundle['catalog']['entries']} == allowed, 'Missing or out-of-scope catalog identity')
    require([x['chapter'] for x in scope['chapters']] == [1, 2, 3, 4, 5], 'Release includes a later chapter')
    require(scope['chapters'][:4] == frozen['publishedReleaseScope']['chapters'],
            'Prior release scopes changed')
    expected_count = 569 + len(expected) + len(supplementary)
    require(scope['totalCards'] == len(bundle['lessons']) == len(bundle['catalog']['entries'])
            == bundle['build']['authoredCards'] == expected_count, 'Integrated V card count mismatch')
    target = scope['chapters'][-1]
    require(target['label'] == 'V' and target['exerciseNumbers'] == [331, 412]
            and target['theoryPoints'] == [39, 45] and target['selfcheckQuestions'] == 30
            and target['mainParts'] == source_map['counts']['mainParts']
            and target['cards'] == len(expected), 'V release scope differs from independent source')
    require([c['chapter'] for c in bundle['build']['chapters']] == [1, 2, 3, 4, 5], 'Wrong built chapter scope')
    built = bundle['build']['chapters'][-1]
    require(built['numberedExercises'] == 82 and built['theoryPoints'] == 7
            and built['selfcheckQuestions'] == 30 and built['authoredCards'] == len(expected),
            'Wrong built V source counts')
    extra_numbers = sum(last-first+1 for first,last in [s['exerciseNumbers'] for s in scope.get('supplements', [])])
    require(bundle['build']['numberedExercises'] == 412 + extra_numbers, 'Wrong integrated exercise endpoint')
    entries = {x['id']: x for x in bundle['catalog']['entries']}
    for lesson in (row for row in bundle['lessons'] if row['id'] in expected):
        ident = lesson['id']
        wanted = expected[ident]
        actual = lesson['source']
        require(actual['bookId'] == BOOK_ID and actual['chapter'] == 'V', 'V card edition/chapter mismatch')
        require(actual['collection'] == wanted['collection'], 'V collection mismatch')
        number_key = 'point' if wanted['collection'] == 'theory' else 'exercise'
        require(actual[number_key] == wanted['number'] and actual.get('subpart', 'single') == wanted['part'],
                'V source part mismatch: ' + ident)
        require(actual['printedPages'] == wanted['printedPages'] and actual['pdfPages'] == wanted['pdfPages'],
                'V source page mismatch: ' + ident)
        require(lesson['revision'] == 1, 'Unexpected new V storage revision')
        catalog = {key: lesson[key] for key in ('id', 'revision', 'kind', 'title', 'status', 'source')}
        require(entries[ident] == catalog, 'V catalog/lesson mismatch: ' + ident)
        require(lesson['status'] == ('reviewed' if built['publicationReviewMatches'] else 'in-review'),
                'V status is inconsistent with its own publication binding')
        for view_id, view in lesson['visualization']['model']['views'].items():
            require(not set(view)-VIEW_FIELDS, f'Unsupported invisible V drawing fields: {ident}/{view_id}')
    require(bundle['build']['fullTextbookComplete'] is False, 'Chapter V is not the entire7–9 textbook')


class PublishedPreservation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.frozen = read(FIXTURE)
        cls.bundle = read(COURSE / 'data/course.json')

    def test_fixture_is_the_exact_frozen_published_oracle(self):
        self.assertEqual(sha(FIXTURE.read_bytes()), FIXTURE_SHA256)
        self.assertEqual(self.frozen['sourceCommit'], SOURCE_COMMIT)
        self.assertEqual(self.frozen['fullPublishedBundleSha256'],
                         'afd4228a2e1444c8fca719fcc2dc0145ca5419354980a33dcadbf637b560325d')
        self.assertEqual([c['label'] for c in self.frozen['chapters']], list(OLD_LABELS))
        self.assertEqual(len(self.frozen['perCardHashes']), 569)

    def test_all569_full_records_catalog_ids_and_reviews_are_unchanged(self):
        validate_published(self.bundle, self.frozen)

    def test_published_files_match_exact_bytes_or_the_scoped_caption_amendment(self):
        for name, expected in self.frozen['immutableFiles'].items():
            with self.subTest(file=name):
                assert_file_bytes(name, (ROOT/name).read_bytes(), expected)
        for name, expected in self.frozen['implementationFiles'].items():
            assert_file_bytes(name, (ROOT/name).read_bytes(), expected)

    def test_realistic_published_record_corruptions_are_rejected(self):
        for label in ('lesson text', 'catalog title', 'storage revision', 'removed ID',
                      'duplicate ID', 'revoked old review', 'full-book claim', 'source inventory'):
            with self.subTest(mutation=label):
                changed = deepcopy(self.bundle)
                if label == 'lesson text': changed['lessons'][0]['statement']['text'] += ' changed'
                elif label == 'catalog title': changed['catalog']['entries'][0]['title'] += ' changed'
                elif label == 'storage revision': changed['lessons'][0]['revision'] += 1
                elif label == 'removed ID': changed['lessons'].pop(0)
                elif label == 'duplicate ID': changed['lessons'].append(deepcopy(changed['lessons'][0]))
                elif label == 'revoked old review': changed['build']['chapters'][3]['publicationReviewMatches'] = False
                elif label == 'full-book claim': changed['build']['fullTextbookComplete'] = True
                else: changed['sourceInventory']['chapters'][4]['exerciseNumbers'][1] = 461
                with self.assertRaises(AssertionError): validate_published(changed, self.frozen)

    def test_runtime_review_and_history_byte_changes_are_rejected(self):
        for name in ('geometry-course/textbook/assets/engine.js',
                     'geometry-course/textbook/release-review-chapter-04.json',
                     'tools/geometry-textbook/published-chapters-01-03.json'):
            with self.subTest(file=name), self.assertRaises(AssertionError):
                assert_file_bytes(name, (ROOT/name).read_bytes()+b'\n', self.frozen['immutableFiles'][name])


def historical_v_projection(bundle, scope):
    """Run the original I–V integration oracle on its exact historical scope.

    VI is separately subject to chapter06-release.test.py's exact union gate.
    Unknown sections are retained here so the existing whitelist rejects them.
    """
    from chapter07_release import historical_vii_projection
    if any(c['chapter'] == 8 for c in scope['chapters']):
        from chapter08_release import validate_release as validate_viii_release
        validate_viii_release(bundle, scope=scope)
    bundle, scope = historical_vii_projection(bundle, scope)
    # VII is independently constrained by the exact1083 release union gate.
    if any(c['chapter'] == 7 for c in scope['chapters']):
        bundle['lessons'] = [r for r in bundle['lessons'] if r['source']['chapter'] != 'VII']
        bundle['catalog']['entries'] = [r for r in bundle['catalog']['entries'] if r['source']['chapter'] != 'VII']
        bundle['build']['chapters'] = [c for c in bundle['build']['chapters'] if c['chapter'] != 7]
        bundle['build']['authoredCards'] -= 190
        bundle['build']['numberedExercises'] -= 99
        scope['chapters'] = [c for c in scope['chapters'] if c['chapter'] != 7]
        scope['totalCards'] -= 190
    if any(c['chapter'] == 6 for c in scope['chapters']):
        bundle['lessons'] = [r for r in bundle['lessons'] if r['source']['chapter'] != 'VI']
        bundle['catalog']['entries'] = [r for r in bundle['catalog']['entries'] if r['source']['chapter'] != 'VI']
        bundle['build']['chapters'] = [c for c in bundle['build']['chapters'] if c['chapter'] != 6]
        bundle['build']['authoredCards'] -= 138
        bundle['build']['numberedExercises'] -= 79
        scope['chapters'] = [c for c in scope['chapters'] if c['chapter'] != 6]
        scope['totalCards'] -= 138
    return bundle, scope


class ChapterVIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.frozen = read(FIXTURE)
        cls.bundle = read(COURSE/'data/course.json')
        cls.source_map = read(SOURCE_MAP)
        cls.scope = read(ROOT/'tools/geometry-textbook/release-scope.json')
        cls.bundle, cls.scope = historical_v_projection(cls.bundle, cls.scope)

    def test_exact_source_and_stable_v_namespaces(self):
        validate_chapter_v(self.bundle, self.frozen, self.source_map, self.scope)

    def test_missing_parts_foreign_tasks_wrong_pages_and_invisible_primitives_fail(self):
        for label in ('missing V', 'duplicate V', 'wrong printed page', 'wrong PDF offset',
                      'unsupported circle primitive', 'wrong selfcheck namespace'):
            with self.subTest(mutation=label):
                changed = deepcopy(self.bundle)
                lesson = next(row for row in changed['lessons'] if row['source']['chapter'] == 'V')
                if label == 'missing V': changed['lessons'].remove(lesson)
                elif label == 'duplicate V': changed['lessons'].append(deepcopy(lesson))
                elif label == 'wrong printed page': lesson['source']['printedPages'] = [999]
                elif label == 'wrong PDF offset': lesson['source']['pdfPages'] = [p+2 for p in lesson['source']['printedPages']]
                elif label == 'unsupported circle primitive': lesson['visualization']['model']['views']['neutral']['sectors'] = []
                else:
                    question = next(row for row in changed['lessons'] if row['source']['chapter'] == 'V' and row['source']['collection'] == 'selfcheck')
                    question['id'] = 'atanasyan-7-9-selfcheck-'+question['source']['exercise']+'-part-1'
                with self.assertRaises(AssertionError):
                    validate_chapter_v(changed, self.frozen, self.source_map, self.scope)

    def test_the_independent_scope_cannot_expand_into_advanced413_or_theory46(self):
        for collection, number in [('exercises', 413), ('theory', 46), ('selfchecks', 31)]:
            with self.subTest(collection=collection):
                source = deepcopy(self.source_map)
                source[collection].append({**source[collection][-1], 'number': number})
                with self.assertRaises(AssertionError): expected_v_rows(source)
        for key, wrong in [('schemaVersion', 2), ('bookId', 'another-edition'),
                           ('fullTextbookComplete', True)]:
            with self.subTest(scope_metadata=key):
                changed = deepcopy(self.scope)
                changed[key] = wrong
                with self.assertRaises(AssertionError):
                    validate_chapter_v(self.bundle, self.frozen, self.source_map, changed)

    def test_absent_v_review_keeps_all569_prior_cards_public_and_v_pending(self):
        with tempfile.TemporaryDirectory(prefix='chapter05-preservation-') as name:
            course = Path(name)/'course'
            shutil.copytree(COURSE, course)
            (course/'release-review-chapter-05.json').unlink(missing_ok=True)
            pending = compose(course)
            validate_published(pending, self.frozen)
            target = next(c for c in pending['build']['chapters'] if c['chapter'] == 5)
            self.assertFalse(target['publicationReviewMatches'])
            self.assertFalse(pending['build']['publicationReviewMatches'])
            new = [c for c in pending['lessons'] if c['source']['chapter'] == 'V']
            self.assertEqual(len(new), self.source_map['counts']['cards'])
            self.assertTrue(all(c['status'] == 'in-review' for c in new))
            path = Path(name)/'pending.json'
            path.write_text(json.dumps(pending, ensure_ascii=False))
            script = """const fs=require('node:fs'),assert=require('node:assert/strict');
const API=require(process.argv[1]),bundle=JSON.parse(fs.readFileSync(process.argv[2]));
const actual=API.inspectBundle(bundle.catalog,bundle.lessons),preview=API.inspectBundle(bundle.catalog,bundle.lessons,{allowInReview:true});
assert.equal(actual.available.size,bundle.lessons.filter(l=>l.status==='reviewed').length);assert.deepEqual(actual.issues,[]);
assert.equal([...actual.available.values()].filter(row=>['I','II','III','IV'].includes(row.source.chapter)).length,569);
assert(![...actual.available.values()].some(row=>row.source.chapter==='V'));
assert.equal(preview.available.size,bundle.lessons.length);assert.deepEqual(preview.issues,[]);
console.log('CHAPTER_V_PENDING_PUBLICATION_BOUNDARY_OK');"""
            result = subprocess.run(['node', '-e', script, str(COURSE/'assets/engine.js'), str(path)],
                                    text=True, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stdout+result.stderr)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--preservation-only', action='store_true',
                        help='Early-authoring baseline check only; no integrated V readiness claim')
    args = parser.parse_args()
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(PublishedPreservation)
    if not args.preservation_only:
        suite.addTests(unittest.defaultTestLoader.loadTestsFromTestCase(ChapterVIntegration))
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    print(json.dumps({'gate': 'CHAPTER05_PUBLISHED_PRESERVATION_OK' if result.wasSuccessful() else 'CHAPTER05_PRESERVATION_FAILED',
                      'mode': 'published-baseline-only' if args.preservation_only else 'full-V-integration',
                      'previousCards': 569, 'testsRun': result.testsRun,
                      'chapterVIntegrationChecked': not args.preservation_only,
                      'publicationApprovalGranted': False}))
    return 0 if result.wasSuccessful() else 1


if __name__ == '__main__':
    raise SystemExit(main())
