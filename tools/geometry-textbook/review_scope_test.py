#!/usr/bin/env python3
"""Release-boundary regressions; all forged review fixtures stay in temp copies."""
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from build_course import COURSE, ROOT, compose, digest, read
from published_preservation import assert_runtime_preserved, assert_file_preserved, assert_all_705_preserved


class ChapterReviewBoundary(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original = compose()
        cls.baseline = read(ROOT / 'tools/geometry-textbook/published-chapter-01.json')
        cls.previous = read(ROOT / 'tools/geometry-textbook/published-chapters-01-02.json')
        cls.published = read(ROOT / 'tools/geometry-textbook/published-chapters-01-03.json')
        cls.chapters = cls.original['build']['chapters']
        cls.supplements = cls.original['build'].get('supplements', [])

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.course = Path(self.temp.name) / 'course'
        shutil.copytree(COURSE, self.course)

    def write(self, name, value):
        (self.course / name).write_text(json.dumps(value, ensure_ascii=False))

    def chapter(self, bundle, chapter):
        if isinstance(chapter, str):
            return next(item for item in bundle['build'].get('supplements', []) if item['key'] == chapter)
        return next(item for item in bundle['build']['chapters'] if item['chapter'] == chapter)

    def review_name(self, chapter):
        if isinstance(chapter, str):
            return self.chapter(self.original, chapter)['reviewFile']
        return 'release-review.json' if chapter == 1 else f'release-review-chapter-{chapter:02d}.json'

    def approve_fixture_chapters(self):
        for chapter in self.chapters:
            self.synthetic_review(chapter['chapter'])
        for supplement in self.supplements:
            self.synthetic_review(supplement['key'])

    def test_published_chapter_is_unchanged(self):
        lessons = [lesson for lesson in self.original['lessons'] if lesson['source']['chapter'] == 'I']
        entries = [entry for entry in self.original['catalog']['entries'] if entry['source']['chapter'] == 'I']
        self.assertEqual(len(lessons), self.baseline['cards'])
        self.assertEqual(digest(lessons), self.baseline['normalizedLessonsSha256'])
        self.assertEqual(digest(entries), self.baseline['normalizedCatalogEntriesSha256'])
        self.assertEqual(self.chapter(self.original, 1)['authoredContentSha256'], self.baseline['authoredContentSha256'])
        assert_runtime_preserved(self.original['build']['implementationSha256'], self.baseline['implementationSha256'])

    def test_all_336_published_cards_and_their_review_provenance_are_unchanged(self):
        labels = [chapter['label'] for chapter in self.previous['chapters']]
        lessons = [lesson for lesson in self.original['lessons'] if lesson['source']['chapter'] in labels]
        entries = [entry for entry in self.original['catalog']['entries'] if entry['source']['chapter'] in labels]
        self.assertEqual(len(lessons), self.previous['cards'])
        self.assertEqual(digest(lessons), self.previous['normalizedLessonsSha256'])
        self.assertEqual(digest(entries), self.previous['normalizedCatalogEntriesSha256'])
        assert_runtime_preserved(self.original['build']['implementationSha256'], self.previous['implementationSha256'])
        for baseline in self.previous['chapters']:
            with self.subTest(chapter=baseline['chapter']):
                actual = [lesson for lesson in lessons if lesson['source']['chapter'] == baseline['label']]
                catalog = [entry for entry in entries if entry['source']['chapter'] == baseline['label']]
                self.assertEqual(len(actual), baseline['cards'])
                self.assertEqual(digest(actual), baseline['normalizedLessonsSha256'])
                self.assertEqual(digest(catalog), baseline['normalizedCatalogEntriesSha256'])
                self.assertEqual(self.chapter(self.original, baseline['chapter'])['authoredContentSha256'],
                                 baseline['authoredContentSha256'])

    def test_all_403_published_cards_catalog_and_content_review_provenance_are_unchanged(self):
        # Frozen from the published base Git object, not regenerated from the
        # candidate. Chapter III must receive the same preservation guarantee
        # as I–II when chapter IV is appended.
        labels = [chapter['label'] for chapter in self.published['chapters']]
        self.assertEqual(labels, ['I', 'II', 'III'])
        lessons = [lesson for lesson in self.original['lessons'] if lesson['source']['chapter'] in labels]
        entries = [entry for entry in self.original['catalog']['entries'] if entry['source']['chapter'] in labels]
        self.assertEqual(len(lessons), 403)
        self.assertEqual(len(entries), self.published['cards'])
        self.assertEqual(digest(lessons), self.published['normalizedLessonsSha256'])
        self.assertEqual(digest(entries), self.published['normalizedCatalogEntriesSha256'])
        assert_runtime_preserved(self.original['build']['implementationSha256'], self.published['implementationSha256'])
        for baseline in self.published['chapters']:
            with self.subTest(chapter=baseline['chapter']):
                actual = [lesson for lesson in lessons if lesson['source']['chapter'] == baseline['label']]
                catalog = [entry for entry in entries if entry['source']['chapter'] == baseline['label']]
                self.assertEqual(len(actual), baseline['cards'])
                self.assertEqual(digest(actual), baseline['normalizedLessonsSha256'])
                self.assertEqual(digest(catalog), baseline['normalizedCatalogEntriesSha256'])
                chapter = self.chapter(self.original, baseline['chapter'])
                self.assertTrue(chapter['publicationReviewMatches'])
                self.assertEqual(chapter['authoredContentSha256'], baseline['authoredContentSha256'])
                manifest = COURSE / self.review_name(baseline['chapter'])
                assert_file_preserved(str(manifest.relative_to(ROOT)), manifest.read_bytes(), baseline['releaseReviewSha256'])

    def test_all_705_published_cards_and_historical_evidence_survive_caption_changes(self):
        assert_all_705_preserved(self.original)

    def test_missing_new_review_does_not_revoke_old_review(self):
        for target in self.chapters[1:]:
            with self.subTest(chapter=target['chapter']):
                self.approve_fixture_chapters()
                (self.course / self.review_name(target['chapter'])).unlink(missing_ok=True)
                bundle = compose(self.course)
                for chapter in self.chapters:
                    self.assertEqual(self.chapter(bundle, chapter['chapter'])['publicationReviewMatches'],
                                     chapter['chapter'] != target['chapter'])
                self.assertFalse(bundle['build']['publicationReviewMatches'])
                self.assertTrue(all(lesson['status'] == 'in-review' for lesson in bundle['lessons']
                                    if lesson['source']['chapter'] == target['chapterLabel']))

    def test_review_cannot_be_reused_for_another_chapter(self):
        for target in self.chapters[1:]:
            for source in self.chapters:
                if source['chapter'] == target['chapter']:
                    continue
                with self.subTest(source=source['chapter'], target=target['chapter']):
                    self.approve_fixture_chapters()
                    self.write(self.review_name(target['chapter']),
                               read(self.course / self.review_name(source['chapter'])))
                    self.assertFalse(self.chapter(compose(self.course), target['chapter'])['publicationReviewMatches'])

    def synthetic_review(self, number):
        # This fixture is deliberately not an approval and never touches the
        # working course. It exercises invalidation after an otherwise matching
        # manifest, even before an independent new-chapter review exists.
        chapter = self.chapter(self.original, number)
        amended_vi = (number == '7-advanced' or (isinstance(number, int) and number <= 5)) and any(c['chapter'] == 6 for c in self.chapters)
        amended_vii = (number == '7-advanced' or (isinstance(number, int) and number <= 6)) and any(c['chapter'] == 7 for c in self.chapters)
        if amended_vi or amended_vii:
            # The old approval is immutable; exercise the actual extension chain.
            shutil.copy2(COURSE/self.review_name(number), self.course/self.review_name(number))
            return
        review = dict(schemaVersion=1, status='passed',
                      authoredContentSha256=chapter['authoredContentSha256'],
                      implementationSha256=self.original['build']['implementationSha256'],
                      source='passed', mathematics='passed', models='passed',
                      pedagogy='passed', browser='passed', reviewer='TEST FIXTURE ONLY',
                      at='2026-01-01T00:00:00Z', scope=({'key': number} if isinstance(number, str) else {'chapter': chapter['chapterLabel']}))
        self.write(self.review_name(number), review)

    def test_changed_new_content_invalidates_only_its_review(self):
        for target in self.chapters[1:]:
            with self.subTest(chapter=target['chapter']):
                self.approve_fixture_chapters()
                self.assertTrue(compose(self.course)['build']['publicationReviewMatches'])
                name = f'models/chapter-{target["chapter"]:02d}-a.json'
                models = read(self.course / name)
                models['models'][0]['model']['description'] += ' Changed after review.'
                self.write(name, models)
                bundle = compose(self.course)
                for chapter in self.chapters:
                    self.assertEqual(self.chapter(bundle, chapter['chapter'])['publicationReviewMatches'],
                                     chapter['chapter'] != target['chapter'])
                shutil.copy2(COURSE / name, self.course / name)

    def test_runtime_change_requires_every_chapter_to_be_reviewed_again(self):
        self.approve_fixture_chapters()
        for name in ['assets/engine.js', 'assets/board-adapter.js']:
            with self.subTest(runtime=name):
                path = self.course / name
                original = path.read_bytes()
                path.write_bytes(original + b'\n// Changed after review.\n')
                bundle = compose(self.course)
                self.assertTrue(all(not item['publicationReviewMatches'] for item in bundle['build']['chapters'] + bundle['build'].get('supplements', [])))
                path.write_bytes(original)


    def test_changed_paragraph_reference_invalidates_every_runtime_review(self):
        self.approve_fixture_chapters()
        inventory = read(self.course / 'source-inventory.json')
        inventory['paragraphs'][0]['number'] += 100
        self.write('source-inventory.json', inventory)
        bundle = compose(self.course)
        self.assertTrue(all(not item['publicationReviewMatches'] for item in bundle['build']['chapters'] + bundle['build'].get('supplements', [])))

    def test_advanced_review_is_separate_and_cannot_be_borrowed_from_chapter_v(self):
        for supplement in self.supplements:
            name = supplement['reviewFile']
            self.approve_fixture_chapters()
            (self.course/name).unlink(missing_ok=True)
            bundle = compose(self.course)
            self.assertTrue(all(c['publicationReviewMatches'] for c in bundle['build']['chapters']))
            self.assertFalse(self.chapter(bundle, supplement['key'])['publicationReviewMatches'])
            self.assertTrue(all(l['status'] == 'in-review' for l in bundle['lessons']
                                if l['source']['chapter'] == supplement['label']))
            self.write(name, read(self.course/'release-review-chapter-05.json'))
            self.assertFalse(self.chapter(compose(self.course), supplement['key'])['publicationReviewMatches'])

    def test_advanced_model_edit_invalidates_only_its_own_review(self):
        for supplement in self.supplements:
            self.approve_fixture_chapters()
            self.assertTrue(compose(self.course)['build']['publicationReviewMatches'])
            name = 'models/grade-07-advanced-a.json'
            models = read(self.course/name)
            models['models'][0]['model']['description'] += ' Changed after review.'
            self.write(name, models)
            bundle = compose(self.course)
            self.assertTrue(all(c['publicationReviewMatches'] for c in bundle['build']['chapters']))
            self.assertFalse(self.chapter(bundle, supplement['key'])['publicationReviewMatches'])
            shutil.copy2(COURSE/name, self.course/name)

    def test_advanced_number_and_model_omissions_fail_build(self):
        for supplement in self.supplements:
            name = 'preparation/grade-07-advanced-a.json'
            prepared = read(self.course/name)
            prepared['exercises'].pop()
            self.write(name, prepared)
            with self.assertRaisesRegex(ValueError, 'every exercise'):
                compose(self.course)
            shutil.copy2(COURSE/name, self.course/name)
            name = 'models/grade-07-advanced-a.json'
            models = read(self.course/name)
            models['models'].pop()
            self.write(name, models)
            with self.assertRaisesRegex(ValueError, 'Missing authored model'):
                compose(self.course)

    def test_source_number_and_model_omissions_fail_build(self):
        for target in self.chapters[1:]:
            with self.subTest(chapter=target['chapter']):
                name = f'preparation/chapter-{target["chapter"]:02d}-a.json'
                preparation = read(self.course / name)
                preparation['exercises'].pop()
                self.write(name, preparation)
                with self.assertRaisesRegex(ValueError, 'every exercise'):
                    compose(self.course)
                shutil.copy2(COURSE / name, self.course / name)
                name = f'models/chapter-{target["chapter"]:02d}-a.json'
                models = read(self.course / name)
                models['models'].pop()
                self.write(name, models)
                with self.assertRaisesRegex(ValueError, 'Missing authored model'):
                    compose(self.course)
                shutil.copy2(COURSE / name, self.course / name)


if __name__ == '__main__':
    unittest.main()
