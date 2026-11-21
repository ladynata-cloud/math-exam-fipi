"""Catalogue links may name an HTML section; missing targets still fail."""
from pathlib import Path
import tempfile
import unittest

from check import check_local_link


class CatalogueLinks(unittest.TestCase):
    def test_real_contact_destination(self):
        self.assertEqual(check_local_link('/lessons/#contact').name, 'index.html')

    def test_paths_queries_and_fragments_are_checked_separately(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'lesson').mkdir()
            (root / 'lesson/index.html').write_text('<section id="contact"></section><a name="old"></a>')
            for href in ('/lesson/', '/lesson/?from=catalogue#contact',
                         '/lesson/index.html#old', '/lesson/#%63ontact'):
                self.assertTrue(check_local_link(href, root).is_file(), href)
            for href in ('/missing/', '/missing/#contact', '/lesson/#missing',
                         '/lesson/index.html#missing', '/../outside', '//example.com/lesson/'):
                with self.subTest(href=href), self.assertRaises(AssertionError):
                    check_local_link(href, root)


if __name__ == '__main__':
    unittest.main()
