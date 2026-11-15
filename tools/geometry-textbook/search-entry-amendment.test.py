"""New entry bytes are bound separately; every historical review stays intact."""
import hashlib
import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch as replace_global
from copy import deepcopy

from build_course import COURSE, ROOT, compose
from layout_amendment import historical_bytes
import public_navigator_preservation as navigator
from public_navigator_preservation import SNIPPET
from search_entry_amendment import BASE_COMMIT, BEFORE_SHA, NAME, PATCH, restore_search_entry


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


class SearchEntryAmendment(unittest.TestCase):
    def test_exact_entry_delta_restores_the_real_base_then_the_old_navigator(self):
        patch = json.loads(PATCH.read_text())
        self.assertEqual(set(patch['files']), {'index.html'})
        current = (COURSE / 'index.html').read_bytes()
        self.assertEqual(sha(current), patch['files']['index.html']['afterSha256'])
        original = subprocess.check_output(['git', 'show', BASE_COMMIT + ':' + NAME], cwd=ROOT)
        self.assertEqual(sha(original), BEFORE_SHA)
        self.assertEqual(restore_search_entry(NAME, current), original)
        self.assertEqual(restore_search_entry(NAME, original), original)
        self.assertEqual(historical_bytes(COURSE / 'index.html'), original.replace(SNIPPET, b'', 1))

    def test_same_historical_bytes_before_and_after_a_normal_navigator_refresh(self):
        current = (COURSE / 'index.html').read_bytes()
        original = restore_search_entry(NAME, current)
        historical = original.replace(SNIPPET, b'', 1)
        without = current.replace(SNIPPET, b'', 1)
        self.assertEqual(restore_search_entry(NAME, without), historical)
        for source in (original, current):
            binding = deepcopy(navigator.ROLLOUT)
            binding['addedPages'][NAME] = {'beforeSha256': sha(source.replace(SNIPPET, b'', 1)),
                                          'afterSha256': sha(source)}
            with replace_global.object(navigator, 'ROLLOUT', binding):
                self.assertEqual(historical_bytes(COURSE / 'index.html', current), historical)
                changed = current + b'\n<!-- unknown -->'
                self.assertEqual(historical_bytes(COURSE / 'index.html', changed), changed)

    def test_unknown_entry_bytes_and_wrong_routes_are_never_normalized(self):
        current = (COURSE / 'index.html').read_bytes()
        self.assertEqual(restore_search_entry('unrelated/index.html', current), current)
        for changed in (current + b'\n<!-- unbound -->',
                        current.replace(b'controller.abort()', b'controller.abortChanged()', 1),
                        current.replace(b'ch4-p1-t2-proof-angle-sum.html', b'unapproved-topic.html', 1),
                        current.replace(b'navigator-widget.js?v=20261105-site1', b'navigator-widget.js?v=other', 1)):
            with self.subTest(probe=sha(changed)):
                self.assertNotEqual(changed, current)
                self.assertEqual(restore_search_entry(NAME, changed), changed)
                self.assertEqual(historical_bytes(COURSE / 'index.html', changed), changed)

    def test_all1425_cards_ids_revisions_and_release_records_remain_exact(self):
        actual = compose()
        published = json.loads((COURSE / 'data/course.json').read_bytes())
        self.assertEqual(actual, published)
        self.assertEqual(len(actual['lessons']), 1425)
        self.assertTrue(actual['build']['publicationReviewMatches'])
        unchanged = ['data/course.json', 'assets/engine.js', 'assets/style.css',
                     'assets/math-text.js', 'assets/planar-viewer.js',
                     'assets/board-adapter.js', 'source-inventory.json']
        unchanged += [str(path.relative_to(COURSE)) for path in COURSE.glob('release-review*.json')]
        for name in unchanged:
            expected = subprocess.check_output(['git', 'show', BASE_COMMIT + ':' + NAME.rsplit('/', 1)[0] + '/' + name], cwd=ROOT)
            self.assertEqual((COURSE / name).read_bytes(), expected, name)

    def test_extra_entry_or_runtime_byte_invalidates_publication(self):
        for name in ['index.html', 'assets/engine.js']:
            with self.subTest(file=name), tempfile.TemporaryDirectory() as folder:
                course = Path(folder) / 'course'
                shutil.copytree(COURSE, course)
                target = course / name
                target.write_bytes(target.read_bytes() + b'\n/* unbound runtime */')
                result = compose(course)
                self.assertFalse(result['build']['publicationReviewMatches'])
                self.assertTrue(all(row['status'] == 'in-review' for row in result['lessons']))


if __name__ == '__main__':
    unittest.main()
