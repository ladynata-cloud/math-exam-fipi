#!/usr/bin/env python3
"""Black-box public-discovery checks: python3 tools/seo-sitemap.test.py."""

import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET


GENERATOR = Path(__file__).with_name("build-sitemap.py")
ORIGIN = "https://mathexam.space"
NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"


def load_tool(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class CanonicalSignalTests(unittest.TestCase):
    """Cover declarations on pages intentionally omitted from the sitemap."""

    @classmethod
    def setUpClass(cls):
        cls.generator = load_tool("seo_sitemap_test_generator", GENERATOR)
        cls.seo = load_tool("seo_check_test", GENERATOR.with_name("seo-check.py"))

    def check(self, head, url=ORIGIN + "/public/old.html"):
        page = self.generator.Page("<html><head>" + head + "</head></html>")
        self.seo.check_canonical_signals(page, url, "fixture")

    def test_redirect_self_canonical_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "conflicts with meta refresh"):
            self.check('<link rel="canonical" href="/public/old.html">'
                       '<meta http-equiv="refresh" content="0; url=new.html">')

    def test_relative_redirect_and_fragment_navigation_agree_with_document_canonical(self):
        self.check('<link rel="canonical" href="/public/new.html">'
                   '<meta http-equiv="refresh" content="0; url=new.html#step-2">')
        self.check('<base href="/public/">'
                   '<link rel="canonical" href="new.html">'
                   '<meta http-equiv="refresh" content="0; url=new.html">')

    def test_noindex_wrapper_canonical_fragment_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "must not contain a fragment"):
            self.check('<meta name="robots" content="noindex">'
                       '<link rel="canonical" href="/public/course/#task-92">')

    def test_noindex_wrapper_and_alternate_page_may_point_to_public_document(self):
        self.check('<meta name="robots" content="noindex">'
                   '<link rel="canonical" href="/public/course/">')
        self.check('<link rel="canonical" href="/public/course/">')
        self.check('<link rel="canonical" href="/public/index.html">', ORIGIN + "/public/")

    def test_conflicting_canonicals_are_rejected_even_on_noindex_wrapper(self):
        with self.assertRaisesRegex(ValueError, "conflicting canonical links"):
            self.check('<meta name="robots" content="noindex">'
                       '<link rel="canonical" href="/public/one.html">'
                       '<link rel="canonical" href="/public/two.html">')

    def test_scan_checks_unlisted_noindex_wrappers_but_excludes_source_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "trainers").mkdir()
            (root / "sources").mkdir()
            bad = '<meta name="robots" content="noindex"><link rel="canonical" href="/course/#task">'
            (root / "sources/original.html").write_text(bad, encoding="utf-8")
            self.assertEqual(self.seo.check_public_canonical_signals(root), (0, 0))
            (root / "trainers/wrapper.html").write_text(bad, encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "must not contain a fragment"):
                self.seo.check_public_canonical_signals(root)


class SitemapDiscoveryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / "tools").mkdir()

    def page(self, path, content="", body=""):
        file = self.root / path.lstrip("/")
        if path.endswith("/"):
            file /= "index.html"
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text("<!doctype html><html><head>" + content + "</head><body>" + body + "</body></html>", encoding="utf-8")

    def manifest(self, seeds, prefixes=()):
        (self.root / "tools/seo-public-pages.json").write_text(
            json.dumps({"seed_paths": seeds, "follow_prefixes": list(prefixes)}), encoding="utf-8"
        )

    def run_generator(self, *args):
        return subprocess.run(
            [sys.executable, str(GENERATOR), "--root", str(self.root), *args],
            text=True, capture_output=True, check=False,
        )

    def assert_success(self, result):
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def listed_paths(self):
        tree = ET.parse(self.root / "sitemap.xml")
        return [item.text.removeprefix(ORIGIN) for item in tree.iter(NS + "loc")]

    def test_only_reviewed_and_linked_public_pages_are_discovered(self):
        self.manifest(["/", "/public/", "/public/index.html", "/pinned/"], ["/public/"])
        self.page("/", body='<a href="/outside.html">Outside the reviewed section</a>')
        self.page("/outside.html")
        links = ["alias.html", "hidden.html", "redirect.html", "teacher.html",
                 "fixtures/example.html", "sources/original.html", "unlinked.html?version=2",
                 "unlinked.html#task", "https://example.com/page.html"]
        self.page("/public/", body=''.join('<a href="' + href + '">Link</a>' for href in links))
        self.page("/public/alias.html", '<link rel="canonical" href="/public/topic.html">')
        self.page("/public/topic.html")
        self.page("/public/hidden.html", '<meta NAME="Robots" CONTENT="NoIndex, Follow">')
        self.page("/public/redirect.html", '<meta http-equiv="refresh" content="0; url=real.html">'
                  '<link rel="canonical" href="/public/redirect.html">')
        self.page("/public/real.html")
        self.page("/public/teacher.html")
        self.page("/public/fixtures/example.html")
        self.page("/public/sources/original.html")
        self.page("/public/unlinked.html")
        self.page("/pinned/", '<link rel="canonical" href="/pinned/index.html">')

        self.assert_success(self.run_generator())
        self.assertEqual(self.listed_paths(), [
            "/", "/pinned/index.html", "/public/", "/public/real.html", "/public/topic.html"
        ])
        text = (self.root / "sitemap.xml").read_text()
        self.assertNotIn("lastmod", text)
        self.assertNotIn("changefreq", text)
        self.assertNotIn("priority", text)
        self.assert_success(self.run_generator("--check"))

    def test_missing_seed_fails_without_overwriting_previous_sitemap(self):
        self.manifest(["/", "/future/"])
        self.page("/")
        sitemap = self.root / "sitemap.xml"
        sitemap.write_text("previous contents")
        result = self.run_generator()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("/future/", result.stderr)
        self.assertEqual(sitemap.read_text(), "previous contents")

    def test_check_rejects_a_page_that_becomes_noindex(self):
        self.manifest(["/", "/lesson.html"])
        self.page("/")
        self.page("/lesson.html")
        self.assert_success(self.run_generator())
        self.page("/lesson.html", '<meta name="googlebot" content="none">')
        result = self.run_generator("--check")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("non-indexable", result.stderr)
        self.assert_success(self.run_generator())
        self.assertEqual(self.listed_paths(), ["/"])

    def test_check_rejects_duplicates_and_stale_output(self):
        self.manifest(["/"])
        self.page("/")
        self.assert_success(self.run_generator())
        sitemap = self.root / "sitemap.xml"
        tree = ET.parse(sitemap)
        duplicate = ET.SubElement(tree.getroot(), NS + "url")
        ET.SubElement(duplicate, NS + "loc").text = ORIGIN + "/"
        tree.write(sitemap, encoding="unicode")
        result = self.run_generator("--check")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("duplicate", result.stderr)
        self.assert_success(self.run_generator())
        self.page("/new.html")
        self.manifest(["/", "/new.html"])
        result = self.run_generator("--check")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("stale", result.stderr)

    def test_contradictory_canonical_signals_fail(self):
        self.manifest(["/"])
        self.page("/", '<link rel="canonical" href="/">'
                  '<link rel="canonical" href="/different.html">')
        result = self.run_generator()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Conflicting canonical", result.stderr)
        self.assertFalse((self.root / "sitemap.xml").exists())

    def test_external_canonical_is_not_replaced_with_a_local_url(self):
        self.manifest(["/", "/duplicate.html"])
        self.page("/")
        self.page("/duplicate.html", '<link rel="canonical" href="https://example.com/original">')
        self.assert_success(self.run_generator())
        self.assertEqual(self.listed_paths(), ["/"])


if __name__ == "__main__":
    unittest.main()
