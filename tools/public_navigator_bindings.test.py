"""Source updates are explicit and cannot silently absorb an unrelated edit."""
import copy
import unittest
from public_navigator_bindings import SNIPPET, refresh, sha

A, B = 'trainers/first.html', 'trainers/second.html'
TASK = 'docs/tasks/EXPLICIT_SOURCE_CHANGE.md'
OLD, NEW = 'a' * 40, 'b' * 40


def page(text):
    return ('<html><head></head><body>' + text + '</body></html>').encode()


def added(raw):
    return raw.replace(b'</head>', SNIPPET + b'</head>')


class ExplicitSourceBindings(unittest.TestCase):
    def setUp(self):
        self.source = {A: page('2 + 2'), B: page('3 + 3')}
        self.current = {name: added(raw) for name, raw in self.source.items()}
        self.manifest = {'baseSha': OLD, 'snippet': SNIPPET.decode(), 'addedPages': {
            name: {'beforeSha256': sha(raw), 'afterSha256': sha(self.current[name])}
            for name, raw in self.source.items()}}

    def run_refresh(self, source=None, paths=(), current=None, manifest=None, task=TASK):
        return refresh(manifest or self.manifest, NEW, task, list(paths),
                       (source or self.source).__getitem__, (current or self.current).__getitem__)

    def test_uncommitted_math_or_source_change_is_rejected(self):
        changed = dict(self.current, **{A: added(page('2 + 3'))})
        with self.assertRaisesRegex(ValueError, 'Unbound source change'):
            self.run_refresh(paths=[A], current=changed)

    def test_explicit_reviewed_source_can_already_include_navigator(self):
        source = dict(self.source, **{A: added(page('2 + 3'))})
        current = dict(self.current, **{A: source[A]})
        before = copy.deepcopy(self.manifest)
        result = self.run_refresh(source=source, current=current, paths=[A])
        self.assertEqual(self.manifest, before, 'input/old provenance stays intact')
        self.assertEqual(result['originBaseSha'], OLD)
        self.assertEqual(result['baseSha'], NEW)
        self.assertEqual(result['addedPages'][B], before['addedPages'][B])
        self.assertNotEqual(result['addedPages'][A]['beforeSha256'], before['addedPages'][A]['beforeSha256'],
                            'an old independent math receipt would still reject the changed source')
        self.assertEqual(result['sourceBindingUpdates'][-1]['changedPaths'], [A])
        self.assertEqual(self.run_refresh(source=source, current=current, paths=[A], manifest=result), result)

    def test_unlisted_and_spurious_changes_cannot_be_rebound(self):
        source = {name: page('changed ' + name) for name in self.source}
        current = {name: added(raw) for name, raw in source.items()}
        for paths in ([], [A]):
            with self.assertRaisesRegex(ValueError, 'exactly match'):
                self.run_refresh(source=source, current=current, paths=paths)
        with self.assertRaisesRegex(ValueError, 'exactly match'):
            self.run_refresh(paths=[A])
        with self.assertRaisesRegex(ValueError, 'Unknown source path'):
            self.run_refresh(paths=['private/unknown.html'])

    def test_script_mutations_and_duplicate_pairs_are_never_source_approval(self):
        for raw in (self.source[A], self.current[A] + SNIPPET,
                    self.current[A].replace(b'defer src=', b'async src=', 1),
                    self.current[A].replace(b'</script>', b'changed();</script>', 1)):
            with self.assertRaises(ValueError):
                self.run_refresh(current=dict(self.current, **{A: raw}), paths=[A])

    def test_task_scope_must_be_named_and_coverage_cannot_expand(self):
        for task in ('', '../secret', 'docs/tasks/../../private.md'):
            with self.assertRaisesRegex(ValueError, 'task document'):
                self.run_refresh(task=task)
        self.assertEqual(set(self.run_refresh()['addedPages']), {A, B})


if __name__ == '__main__':
    unittest.main()
