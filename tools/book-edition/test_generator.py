#!/usr/bin/env python3
"""Versioned build contracts and write refusal with a genuinely stale Git ref."""
import importlib.util
import json
import hashlib
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("book_generator", ROOT / "scripts/build-oge-book-edition.py")
builder = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = builder
spec.loader.exec_module(builder)


class GeneratorTests(unittest.TestCase):
    def test_version_cannot_escape_or_alias_an_existing_namespace(self):
        for version in ["v0", "v01", "V2", "2", "v2/", "v2/../v1", "v2 "]:
            with self.subTest(version=version), self.assertRaises(ValueError):
                builder.Edition(version, builder.PUBLISHED_V1)

    def test_mapping_preserves_original_sources_and_separates_versions(self):
        original = json.loads((builder.DATA / "urls.json").read_text())
        self.assertEqual(builder.edition_rows(builder.Edition()), original)
        rows = builder.edition_rows(builder.Edition("v2", builder.PUBLISHED_V1))
        self.assertEqual(len(rows), 71)
        for old, new in zip(original, rows):
            self.assertEqual(new["sourceUrl"], old["sourceUrl"])
            self.assertEqual(new["id"], old["id"])
            self.assertEqual(new["bookUrl"], old["bookUrl"].replace("/oge26-1/", "/oge26-2/"))
            self.assertEqual(new["frozenUrl"], old["frozenUrl"].replace("/v1/", "/v2/"))

    def test_candidate_build_is_deterministic_and_confined_to_v2(self):
        edition = builder.Edition("v2", builder.PUBLISHED_V1)
        first, manifest = builder.build(edition)
        second, _ = builder.build(edition)
        self.assertEqual(first, second)
        # PR442 already added the general-home stylesheet to the source closure.
        # This pins that exact addition; published v1/v2 bytes remain immutable.
        self.assertEqual(len(first), 226)
        self.assertEqual(first[edition.prefix + "assets/math-home.css"],
                         (ROOT / "assets/math-home.css").read_bytes())
        # Provenance is public navigation, not a missing file in a future copy.
        task12 = first[edition.prefix + "trainers/oge-task12-formulas-trainer.html"]
        self.assertTrue(b"link.href='https://mathexam.space/trainers/oge-task12-sources.html'+'#'+task.generatorId" in task12)
        self.assertTrue(all(name.startswith((edition.prefix, edition.alias)) for name in first))
        self.assertEqual(manifest["sourceBase"], builder.PUBLISHED_V1)
        self.assertEqual(manifest["storageNamespace"], "mathExamBook:oge-2026-10-31-v2:")
        self.assertIn(b'"version":"v2"', first[edition.prefix + "edition-assets/bootstrap.js"])
        self.assertIn("Редакция 31.10.2026 · v2.".encode(), first[edition.alias + "01/index.html"])

    def test_reviewed_task13_redirects_preserve_query_and_fragment(self):
        source = "trainers/oge-task13-inequalities.html"
        edition = builder.Edition("v2", builder.PUBLISHED_V1)
        original = "window.location.replace('/trainers/oge13-inequalities-series.html');"
        shared = "window.location.replace('/trainers/oge13-inequalities-series.html'+window.location.search+window.location.hash);"
        outputs = [builder.sanitize(source, "<script>" + value + "</script>", edition)
                   for value in (original, shared)]
        self.assertEqual(outputs[0], outputs[1])
        self.assertIn("destination.search=location.search;destination.hash=location.hash", outputs[0])
        for unsafe in (shared.replace("oge13-inequalities-series", "unexpected-trainer"),
                       shared + shared, original + shared):
            with self.subTest(unsafe=unsafe), self.assertRaisesRegex(ValueError, "Task-13 redirect changed"):
                builder.sanitize(source, "<script>" + unsafe + "</script>", edition)

    def test_native_shared_adapters_are_not_fixed_book_dependencies(self):
        edition = builder.Edition("v2", builder.PUBLISHED_V1)
        output, manifest = builder.build(edition)
        sources = {record["path"] for record in manifest["sourceFiles"]}
        self.assertFalse(sources & builder.REMOVED)
        for name, data in output.items():
            if name.endswith(".html"):
                self.assertNotIn(b"oge-course-shared-mode.js", data)
                self.assertNotIn(b"oge-native-10-14-board.js", data)

    def test_public_navigator_tags_are_removed_without_changing_learning_links(self):
        edition = builder.Edition("v2", builder.PUBLISHED_V1)
        retained = ('<script src="/assets/retained.js"></script></head>'
                    '<a href="/trainers/oge-task9-equations.html">Practice</a>')
        source = ('<head>'
                  '<script src="/assets/assistant/navigator-data.js?v=test"></script>'
                  '<script defer src="assets/assistant/navigator-widget.js?v=test"></script>'
                  '<link rel="stylesheet" href="https://mathexam.space/assets/assistant/widget.css?v=test">'
                  + retained)
        self.assertEqual(builder.sanitize("index.html", source, edition),
                         "<head>" + retained)

    def test_public_navigator_assets_cannot_enter_the_candidate_closure(self):
        edition = builder.Edition("v2", builder.PUBLISHED_V1)
        navigator_assets = {
            "assets/assistant/navigator-data.js",
            "assets/assistant/navigator-widget.js",
            "assets/assistant/widget.css",
        }
        output, manifest = builder.build(edition)
        sources = {record["path"] for record in manifest["sourceFiles"]}
        dependencies = {path for record in manifest["sourceFiles"]
                        for path in record["dependencies"]}
        self.assertFalse(sources & navigator_assets)
        self.assertFalse(dependencies & navigator_assets)
        for asset in navigator_assets:
            self.assertNotIn(edition.prefix + asset, output)
        for name, data in output.items():
            if name.endswith(".html"):
                for asset in navigator_assets:
                    with self.subTest(page=name, asset=asset):
                        self.assertNotIn(asset.encode(), data)

    def test_no_implicit_write_base(self):
        with self.assertRaisesRegex(ValueError, "explicit full --base"):
            builder.ensure_writable(builder.Edition("v2", builder.PUBLISHED_V1), None)

    def test_check_rejects_a_rehashed_candidate_edit_without_writing(self):
        output, manifest = builder.build(builder.Edition("v2", builder.PUBLISHED_V1))
        with tempfile.TemporaryDirectory(prefix="mathexam-book-reproduce-") as directory:
            root = Path(directory)
            for record in manifest["sourceFiles"] + manifest["generatorInputs"]:
                destination = root / record["path"]
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT / record["path"], destination)
            for name, data in output.items():
                destination = root / name
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(data)
            command = [sys.executable, str(root / "scripts/build-oge-book-edition.py"),
                       "--version", "v2", "--base", builder.PUBLISHED_V1, "--check"]
            pristine = subprocess.run(command, cwd=root, capture_output=True, text=True)
            self.assertEqual(pristine.returncode, 0, pristine.stderr)
            name = "book/oge/2026-10-31/v2/edition-assets/edition.css"
            file = root / name
            file.write_bytes(file.read_bytes() + b"/* accidental post-build edit */")
            record = next(record for record in manifest["files"] if record["path"] == name)
            record.update(bytes=file.stat().st_size, sha256=hashlib.sha256(file.read_bytes()).hexdigest())
            manifest_file = root / "book/oge/2026-10-31/v2/manifest.json"
            manifest_file.write_bytes(builder.encoded(manifest))
            before = {name: (root / name).read_bytes() for name in output}
            forged = subprocess.run(command, cwd=root, capture_output=True, text=True)
            self.assertNotEqual(forged.returncode, 0)
            self.assertIn("Candidate differs from current sources", forged.stderr)
            self.assertEqual({name: (root / name).read_bytes() for name in output}, before)

    def test_stale_tracking_ref_cannot_authorize_published_bytes(self):
        with tempfile.TemporaryDirectory(prefix="mathexam-book-generator-") as directory:
            root = Path(directory)
            def git(*args):
                return subprocess.check_output(["git", *args], cwd=root, stderr=subprocess.STDOUT).decode().strip()
            git("init", "-q")
            git("config", "user.name", "Book generator regression")
            git("config", "user.email", "book-generator-tests@example.invalid")
            git("commit", "--allow-empty", "-qm", "Before fixed editions")
            stale = git("rev-parse", "HEAD")
            git("update-ref", "refs/remotes/origin/main", stale)
            old = root / "book/oge/2026-10-31/v1/manifest.json"
            alias = root / "b/oge26-1/01/index.html"
            for file in [old, alias]:
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text("Published immutable fixture\n")
            git("add", "book", "b")
            git("commit", "-qm", "Published v1")
            published = git("rev-parse", "HEAD")
            before = {str(file): file.read_bytes() for file in [old, alias]}
            self.assertEqual(git("ls-tree", "-r", "--name-only", "origin/main", "--", "book", "b"), "")
            with patch.object(builder, "PUBLISHED_V1", published):
                with self.assertRaisesRegex(ValueError, "Edition exists on " + published):
                    builder.ensure_writable(builder.Edition("v1", published), published, root)
                with self.assertRaisesRegex(ValueError, "published-v1 anchor"):
                    builder.ensure_writable(builder.Edition("v2", stale), stale, root)
                builder.ensure_writable(builder.Edition("v2", published), published, root)
            self.assertEqual({str(file): file.read_bytes() for file in [old, alias]}, before)
            self.assertFalse((root / "book/oge/2026-10-31/v2").exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
