#!/usr/bin/env python3
"""Admission boundaries, mechanical preservation and strict static-SEO exception."""
import importlib.util
from pathlib import Path
import unittest


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


coverage = load("helper_coverage_test", "public-assistant-coverage.py")
seo = load("helper_seo_test", "seo-check.py")


class PublicAdmissionTests(unittest.TestCase):
    def reject(self, path, head="", body=""):
        raw = "<html><head>" + head + "</head><body " + body + "></body></html>"
        return coverage.exclusion(path, raw, coverage.seo.Page(raw))

    def test_private_source_board_archive_and_export_paths_stay_out(self):
        for path in ("learning/index.html", "docs/prototype.html", "trainers/src/example.html",
                     "trainers/archive-5-weeks/item.html", "downloads/course.html",
                     "trainers/trainer-board.html", "trainers/group-board.html",
                     "geometry-course/teacher.html", "video-lessons/studio.html",
                     "assistant-service/public/index.html", "trainers/drafts/item.html"):
            with self.subTest(path=path):
                self.assertIsNotNone(self.reject(path))

    def test_noindex_exception_does_not_admit_private_or_new_noindex_pages(self):
        head = '<meta name="robots" content="noindex,follow">'
        self.assertIsNone(self.reject("school/index.html", head))
        self.assertIsNone(self.reject("ege-baza/algebra/index.html", head))
        self.assertIsNotNone(self.reject("trainers/unreviewed.html", head))
        self.assertIsNotNone(self.reject("learning/index.html", head))

    def test_redirect_board_shell_and_empty_document_cannot_be_included(self):
        self.assertIsNotNone(self.reject("trainers/public.html", '<meta http-equiv="refresh" content="0;url=next.html">'))
        self.assertIsNotNone(self.reject("trainers/public.html", body='data-arithmetic-board=""'))
        self.assertIsNotNone(coverage.exclusion("trainers/empty.html", "\n", coverage.seo.Page("\n")))

    def test_url_context_keeps_document_only_and_never_follows_external_origin(self):
        self.assertEqual(coverage.local_file("/school/peterson6/?ignored=1#practice/decimal-add/1"), "school/peterson6/index.html")
        self.assertIsNone(coverage.local_file("https://example.test/trainers/"))
        self.assertIsNone(coverage.local_file("//example.test/trainers/"))
        self.assertIsNone(coverage.local_file("javascript:alert(1)"))
        for path in ("/%2e%2e/private/index.html", "/trainers/%5cprivate.html", "/%00.html"):
            with self.subTest(path=path), self.assertRaises(ValueError):
                coverage.local_file(path)

    def test_inventory_contains_every_sitemap_document_and_no_empty_games(self):
        manifest, _ = coverage.inventory()
        self.assertGreaterEqual(len(manifest["pages"]), manifest["sitemap_pages"])
        self.assertIn("index.html", manifest["pages"])
        self.assertIn("trainers/multiplication-table/elevator-sprint.html", manifest["pages"])
        for name in ("index", "pythagoras", "times-9", "speed-test", "memory-fishing"):
            self.assertNotIn("trainers/multiplication-table/" + name + ".html", manifest["pages"])
        coverage.check(manifest)


class StaticScriptBoundaryTests(unittest.TestCase):
    def scripts(self, markup):
        return seo.Page("<html><head>" + markup + "</head></html>").scripts

    def pair(self):
        return coverage.BLOCK.decode()

    def test_only_exact_deferred_pair_and_optional_single_observer_are_allowed(self):
        observer = '<script defer src="/assets/lesson-funnel.js?v=20261026"></script>'
        for markup in ("", observer, self.pair(), observer + self.pair()):
            self.assertTrue(seo.static_topic_scripts_allowed(self.scripts(markup)))
        self.assertFalse(seo.static_topic_scripts_allowed(self.scripts(observer + observer + self.pair())))

    def test_inline_async_foreign_attributes_duplicates_and_reordered_pair_fail(self):
        good = self.pair()
        first, second = seo.PUBLIC_ASSISTANT_SCRIPTS
        bad = [good + '<script>alert(1)</script>', good.replace(' defer ', ' async '),
               good.replace('defer src=', 'defer onload="alert(1)" src=', 1),
               good.replace('/assets/assistant/data.js', 'https://example.test/data.js'),
               good.replace('public-assistant-20261027', 'other-version'), good + good,
               good.replace(first, "PLACEHOLDER").replace(second, first).replace("PLACEHOLDER", second),
               '<script defer src="' + first + '"></script>',
               '<script defer src="' + second + '"></script>']
        for markup in bad:
            with self.subTest(markup=markup[:100]):
                self.assertFalse(seo.static_topic_scripts_allowed(self.scripts(markup)))
        with self.assertRaisesRegex(ValueError, "attributes must not repeat"):
            self.scripts(good.replace('defer src=', 'src="https://example.invalid/first.js" defer src=', 1))


if __name__ == "__main__":
    unittest.main()
