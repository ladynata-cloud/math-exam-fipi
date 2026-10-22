#!/usr/bin/env python3
"""Release-boundary regressions; all forged review fixtures stay in temp copies."""
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from build_course import COURSE, ROOT, compose, digest, read


class ChapterReviewBoundary(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original = compose()
        cls.baseline = read(ROOT / 'tools/geometry-textbook/published-chapter-01.json')

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.course = Path(self.temp.name) / 'course'
        shutil.copytree(COURSE, self.course)

    def write(self, name, value):
        (self.course / name).write_text(json.dumps(value, ensure_ascii=False))

    def chapter(self, bundle, chapter):
        return next(item for item in bundle['build']['chapters'] if item['chapter'] == chapter)

    def test_published_chapter_is_unchanged(self):
        lessons = [lesson for lesson in self.original['lessons'] if lesson['source']['chapter'] == 'I']
        entries = [entry for entry in self.original['catalog']['entries'] if entry['source']['chapter'] == 'I']
        self.assertEqual(len(lessons), self.baseline['cards'])
        self.assertEqual(digest(lessons), self.baseline['normalizedLessonsSha256'])
        self.assertEqual(digest(entries), self.baseline['normalizedCatalogEntriesSha256'])
        self.assertEqual(self.chapter(self.original, 1)['authoredContentSha256'], self.baseline['authoredContentSha256'])
        self.assertEqual(self.original['build']['implementationSha256'], self.baseline['implementationSha256'])

    def test_missing_new_review_does_not_revoke_old_review(self):
        (self.course / 'release-review-chapter-02.json').unlink(missing_ok=True)
        bundle = compose(self.course)
        self.assertTrue(self.chapter(bundle, 1)['publicationReviewMatches'])
        self.assertFalse(self.chapter(bundle, 2)['publicationReviewMatches'])
        self.assertFalse(bundle['build']['publicationReviewMatches'])
        self.assertTrue(all(lesson['status'] == 'in-review' for lesson in bundle['lessons'] if lesson['source']['chapter'] == 'II'))

    def test_review_cannot_be_reused_for_another_chapter(self):
        self.write('release-review-chapter-02.json', read(self.course / 'release-review.json'))
        self.assertFalse(self.chapter(compose(self.course), 2)['publicationReviewMatches'])

    def synthetic_review(self):
        # This fixture is deliberately not an approval and never touches the
        # working course. It exercises invalidation after an otherwise matching
        # manifest, even before an independent chapter-II review exists.
        chapter = self.chapter(self.original, 2)
        review = dict(schemaVersion=1, status='passed',
                      authoredContentSha256=chapter['authoredContentSha256'],
                      implementationSha256=self.original['build']['implementationSha256'],
                      source='passed', mathematics='passed', models='passed',
                      pedagogy='passed', browser='passed', reviewer='TEST FIXTURE ONLY',
                      at='2026-01-01T00:00:00Z', scope={'chapter': 'II'})
        self.write('release-review-chapter-02.json', review)

    def test_changed_new_content_invalidates_only_its_review(self):
        self.synthetic_review()
        self.assertTrue(compose(self.course)['build']['publicationReviewMatches'])
        name = 'models/chapter-02-a.json'
        models = read(self.course / name)
        models['models'][0]['model']['description'] += ' Changed after review.'
        self.write(name, models)
        bundle = compose(self.course)
        self.assertTrue(self.chapter(bundle, 1)['publicationReviewMatches'])
        self.assertFalse(self.chapter(bundle, 2)['publicationReviewMatches'])

    def test_runtime_change_requires_every_chapter_to_be_reviewed_again(self):
        self.synthetic_review()
        path = self.course / 'assets/engine.js'
        path.write_text(path.read_text() + '\n// Changed after review.\n')
        bundle = compose(self.course)
        self.assertTrue(all(not item['publicationReviewMatches'] for item in bundle['build']['chapters']))

    def test_source_number_and_model_omissions_fail_build(self):
        name = 'preparation/chapter-02-a.json'
        preparation = read(self.course / name)
        preparation['exercises'].pop()
        self.write(name, preparation)
        with self.assertRaisesRegex(ValueError, 'every exercise'):
            compose(self.course)
        shutil.copy2(COURSE / name, self.course / name)
        name = 'models/chapter-02-a.json'
        models = read(self.course / name)
        models['models'].pop()
        self.write(name, models)
        with self.assertRaisesRegex(ValueError, 'Missing authored model'):
            compose(self.course)


if __name__ == '__main__':
    unittest.main()
