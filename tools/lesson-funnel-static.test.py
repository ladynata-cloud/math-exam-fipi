"""Preserve all existing page bytes and narrowly validate the SEO exception."""
import importlib.util
from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("seo", ROOT / "tools/seo-check.py")
seo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(seo)
BASE = "1aa517ed819d09ff18649b0855319ecccaee5bc0"
INCLUDE = '<script defer src="/assets/lesson-funnel.js?v=20261026"></script>\n'
PAGES = ['index.html', 'lessons/index.html', 'courses/index.html', 'foundations/index.html',
         'trainers/oge-course/index.html', 'topics/index.html'] + [f'topics/{slug}/index.html'
         for slug in ['delenie-ugolkom', 'obyknovennye-drobi', 'procenty',
                      'lineynye-uravneniya', 'oge-geometriya']]

class FunnelStatic(unittest.TestCase):
    def test_existing_html_unchanged_except_one_include(self):
        for name in PAGES:
            with self.subTest(page=name):
                current = (ROOT / name).read_text()
                before = subprocess.check_output(['git', 'show', f'{BASE}:{name}'], cwd=ROOT).decode()
                self.assertEqual(current.count(INCLUDE), 1)
                self.assertEqual(current.replace(INCLUDE, ''), before)

    def test_exception_rejects_executable_content_other_urls_and_missing_defer(self):
        valid = ({'defer': None, 'src': '/assets/lesson-funnel.js?v=20261026'}, '')
        self.assertTrue(seo.is_lesson_funnel(valid))
        for script in [(valid[0], 'alert(1)'), ({'src': valid[0]['src']}, ''),
                       ({'defer': None, 'src': 'https://example.com/x.js'}, ''),
                       ({'defer': None, 'src': '/assets/lesson-funnel.js?v=other'}, ''),
                       ({**valid[0], 'onload': 'alert(1)'}, '')]:
            self.assertFalse(seo.is_lesson_funnel(script))

if __name__ == '__main__':
    unittest.main()
