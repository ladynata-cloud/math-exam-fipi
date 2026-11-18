import contextlib
import importlib.util
import io
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('composition', Path(__file__).with_name('unified-main-composition.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CompositionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.previous = Path.cwd()
        os.chdir(self.tmp.name)
        self.addCleanup(self.cleanup)
        self.git('init', '-b', 'main')
        self.git('config', 'user.name', 'Synthetic test')
        self.git('config', 'user.email', 'test@example.invalid')
        self.git('remote', 'add', 'origin', '.')
        self.commit('retired.txt', 'old')
        self.base = self.git('rev-parse', 'HEAD')
        self.commit('course.txt', 'main course')
        self.main = self.git('rev-parse', 'HEAD')
        self.git('checkout', '-b', 'task', self.base)
        self.commit('board.txt', 'board code')

    def cleanup(self):
        os.chdir(self.previous)
        self.tmp.cleanup()

    def git(self, *args):
        return subprocess.check_output(['git', *args], text=True, stderr=subprocess.PIPE).strip()

    def commit(self, path, text):
        Path(path).write_text(text)
        self.git('add', path)
        self.git('commit', '-m', 'synthetic fixture')

    def compose(self):
        with contextlib.redirect_stdout(io.StringIO()) as result:
            module.compose(self.main, 'proof.json')
        return result.getvalue().strip()

    def test_preserves_both_branches_and_deletions_without_moving_refs(self):
        self.git('rm', 'retired.txt')
        self.git('commit', '-m', 'synthetic deletion')
        before = self.git('show-ref')
        tree = self.compose()
        self.assertEqual(self.git('show', tree + ':course.txt'), 'main course')
        self.assertEqual(self.git('show', tree + ':board.txt'), 'board code')
        self.assertNotIn('retired.txt', self.git('ls-tree', '-r', '--name-only', tree))
        self.assertEqual(self.git('show-ref'), before)

    def test_overlapping_file_requires_review(self):
        self.commit('course.txt', 'competing change')
        with self.assertRaisesRegex(RuntimeError, 'overlap'):
            self.compose()
        self.assertFalse(Path('proof.json').exists())

    def test_main_movement_fails_closed(self):
        self.git('checkout', 'main')
        self.commit('later.txt', 'later main')
        self.git('checkout', 'task')
        with self.assertRaisesRegex(RuntimeError, 'Main moved'):
            self.compose()
        self.assertFalse(Path('proof.json').exists())


if __name__ == '__main__':
    unittest.main()
