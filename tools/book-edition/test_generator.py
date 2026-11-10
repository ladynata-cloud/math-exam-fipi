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
        # Main 30e1af62 adds exactly four course-map dependencies, checked below.
        # The course guide adds exactly two local assets, checked below.
        # This is the future candidate closure; published v1/v2 stay immutable.
        # Video-model investigations add exactly four self-contained local assets.
        # PR525 adds one all-topics stylesheet, with its exact closure checked below.
        self.assertEqual(len(first), 240)
        self.assertEqual(first[edition.prefix + "assets/math-home.css"],
                         (ROOT / "assets/math-home.css").read_bytes())
        # The navigation-only continuation adds exactly these two dependencies.
        for asset in ("assets/oge-wayfinding.css", "assets/oge-wayfinding.js"):
            self.assertEqual(first[edition.prefix + asset], (ROOT / asset).read_bytes())
        # Provenance is public navigation, not a missing file in a future copy.
        task12 = first[edition.prefix + "trainers/oge-task12-formulas-trainer.html"]
        self.assertTrue(b"link.href='https://mathexam.space/trainers/oge-task12-sources.html'+'#'+task.generatorId" in task12)
        self.assertTrue(all(name.startswith((edition.prefix, edition.alias)) for name in first))
        self.assertEqual(manifest["sourceBase"], builder.PUBLISHED_V1)
        self.assertEqual(manifest["storageNamespace"], "mathExamBook:oge-2026-10-31-v2:")
        self.assertIn(b'"version":"v2"', first[edition.prefix + "edition-assets/bootstrap.js"])
        self.assertIn("Редакция 31.10.2026 · v2.".encode(), first[edition.alias + "01/index.html"])

    def test_reviewed_course_map_closure_retains_dependencies_and_storage_boundary(self):
        edition = builder.Edition("v2", builder.PUBLISHED_V1)
        output, manifest = builder.build(edition)
        # Exact additions from the published OGE map (30e1af62), not a relaxed
        # minimum count. Replacing only the entry HTML with pre-map 8bd4c47
        # reproduces 228 outputs; these four paths are the complete 232-228 delta.
        reviewed = {
            "oge/learning-map-view.js": [],
            "oge/learning-map.css": [],
            "oge/learning-map.js": ["oge/registry.js"],
            "oge/registry.js": [],
        }
        sources = {record["path"]: record for record in manifest["sourceFiles"]}
        entry = "trainers/oge-course/index.html"
        self.assertTrue(set(reviewed).issubset(sources[entry]["dependencies"]))
        for asset, dependencies in reviewed.items():
            with self.subTest(asset=asset):
                self.assertIn(asset, sources)
                self.assertEqual(sources[asset]["dependencies"], dependencies)
                self.assertEqual(sources[asset]["sha256"],
                                 hashlib.sha256((ROOT / asset).read_bytes()).hexdigest())
                self.assertIn(edition.prefix + asset, output)
                self.assertTrue(output[edition.prefix + asset])
        page = output[edition.prefix + entry].decode()
        bootstrap = '<script src="/' + edition.prefix + 'edition-assets/bootstrap.js"></script>'
        self.assertEqual(page.count(bootstrap), 1)
        for asset in reviewed:
            frozen = '/' + edition.prefix + asset + '?v=20261109'
            self.assertEqual(page.count(frozen), 1)
            self.assertNotIn('"/' + asset, page)
            self.assertLess(page.index(bootstrap), page.index(frozen))
        # The map reads localStorage only after the fixed-edition bootstrap has
        # installed its namespace. Existing package/runtime tests verify isolation.
        self.assertEqual(manifest["storageNamespace"], "mathExamBook:oge-2026-10-31-v2:")

    def test_pr536_entry_sections_add_exactly_one_stylesheet(self):
        # The published main already includes this dependency (PR536). Keep
        # the future-candidate count exact and verify the complete one-file delta.
        edition = builder.Edition("v2", builder.PUBLISHED_V1)
        output, manifest = builder.build(edition)
        entry, asset = "trainers/oge-course/index.html", "assets/oge-entry-sections.css"
        raw = (ROOT / entry).read_bytes()
        tag = b'<link rel="stylesheet" href="/assets/oge-entry-sections.css?v=20261110">'
        self.assertEqual(raw.count(tag), 1)
        original_read = Path.read_bytes
        with patch.object(Path, "read_bytes", lambda path: raw.replace(tag, b"", 1) if path == ROOT / entry else original_read(path)):
            previous, _ = builder.build(edition)
        self.assertEqual(len(previous), 239)
        self.assertEqual(set(output) - set(previous), {edition.prefix + asset})
        self.assertEqual(set(previous) - set(output), set())
        sources = {record["path"]: record for record in manifest["sourceFiles"]}
        self.assertEqual(sources[asset]["dependencies"], [])
        self.assertEqual(sources[asset]["sha256"], hashlib.sha256((ROOT / asset).read_bytes()).hexdigest())
        self.assertEqual(output[edition.prefix + asset], (ROOT / asset).read_bytes())

    def test_course_guide_closure_is_exact_and_keeps_early_storage_namespace(self):
        edition = builder.Edition("v2", builder.PUBLISHED_V1)
        output, manifest = builder.build(edition)
        entry = "trainers/oge-course/index.html"
        reviewed = {"oge/course-guide.css", "oge/course-guide.js"}
        sources = {record["path"]: record for record in manifest["sourceFiles"]}
        self.assertTrue(reviewed.issubset(sources[entry]["dependencies"]))
        raw = (ROOT / entry).read_bytes()
        tags = (
            '<link rel="stylesheet" href="/oge/course-guide.css?v=20261109">',
            '<script defer src="/oge/course-guide.js?v=20261109"></script>',
        )
        for tag in tags:
            self.assertEqual(raw.count(tag.encode()), 1, "exact reviewed course-guide include")
            raw = raw.replace(tag.encode(), b"", 1)
        page = output[edition.prefix + entry].decode()
        bootstrap = '<script src="/' + edition.prefix + 'edition-assets/bootstrap.js"></script>'
        self.assertEqual(page.count(bootstrap), 1)
        for asset in reviewed:
            self.assertEqual(sources[asset]["dependencies"], [], asset + ": no hidden dependencies")
            self.assertEqual(sources[asset]["sha256"], hashlib.sha256((ROOT / asset).read_bytes()).hexdigest())
            self.assertEqual(output[edition.prefix + asset], (ROOT / asset).read_bytes())
            frozen = '/' + edition.prefix + asset + '?v=20261109'
            self.assertEqual(page.count(frozen), 1)
            self.assertLess(page.index(bootstrap), page.index(frozen))
        original_read = Path.read_bytes
        with patch.object(Path, "read_bytes", lambda path: raw if path == ROOT / entry else original_read(path)):
            previous, previous_manifest = builder.build(edition)
        # The independent video-model additions remain in the no-guide candidate.
        self.assertEqual(len(previous), 238)
        self.assertEqual(set(output) - set(previous), {edition.prefix + asset for asset in reviewed})
        self.assertEqual(set(previous) - set(output), set())
        old_sources = {record["path"] for record in previous_manifest["sourceFiles"]}
        self.assertEqual(set(sources) - old_sources, reviewed)
        self.assertEqual(old_sources - set(sources), set())
        self.assertEqual(manifest["storageNamespace"], "mathExamBook:oge-2026-10-31-v2:")

    def test_video_models_add_only_four_dependencies_and_preserve_prior_closure(self):
        edition = builder.Edition("v2", builder.PUBLISHED_V1)
        output, manifest = builder.build(edition)
        entries = {
            11: "trainers/oge-task11-graphs-trainer.html",
            15: "trainers/oge-task15-triangles.html",
            16: "trainers/oge-task16-circle.html",
            17: "trainers/oge-task17-quadrilaterals.html",
            19: "trainers/task19-trainer.html",
            22: "trainers/oge-task22-functions-graphs.html",
            23: "trainers/oge-task23-geometry-calculations.html",
            24: "trainers/oge-task24-proofs.html",
            25: "trainers/oge-task25-geometry.html",
        }
        reviewed = {"trainers/oge-video-models.css", "trainers/oge-video-graphs.js",
                    "trainers/oge-video-geometry.js", "trainers/oge-video-models.js"}
        sources = {record["path"]: record for record in manifest["sourceFiles"]}
        old_html = {}
        for number, entry in entries.items():
            block = ('<!-- OGE video-model investigations: standalone practice -->\n'
                     '<link rel="stylesheet" href="oge-video-models.css">\n'
                     '<script defer src="oge-video-graphs.js"></script>\n'
                     '<script defer src="oge-video-geometry.js"></script>\n'
                     f'<script defer src="oge-video-models.js" data-oge-video-task="{number}"></script>\n')
            raw = (ROOT / entry).read_bytes()
            self.assertEqual(raw.count(block.encode()), 1)
            self.assertIn(block.encode() + b"</head>", raw)
            old_html[ROOT / entry] = raw.replace(block.encode(), b"", 1)
            if number == 15:
                # The established 71-entry book maps no source to this newer
                # standalone trainer; adding lessons must not expand its routes.
                self.assertNotIn(entry, sources)
                continue
            self.assertTrue(reviewed.issubset(sources[entry]["dependencies"]))
            page = output[edition.prefix + entry].decode()
            bootstrap = '<script src="/' + edition.prefix + 'edition-assets/bootstrap.js"></script>'
            self.assertEqual(page.count(bootstrap), 1)
            for asset in reviewed:
                frozen = '/' + edition.prefix + asset
                self.assertEqual(page.count(frozen), 1)
                self.assertLess(page.index(bootstrap), page.index(frozen))
        for asset in reviewed:
            self.assertEqual(sources[asset]["dependencies"], [], asset + ": no hidden dependencies")
            self.assertEqual(sources[asset]["sha256"], hashlib.sha256((ROOT / asset).read_bytes()).hexdigest())
            self.assertEqual(output[edition.prefix + asset], (ROOT / asset).read_bytes())
        original_read = Path.read_bytes
        with patch.object(Path, "read_bytes", lambda path: old_html[path] if path in old_html else original_read(path)):
            previous, previous_manifest = builder.build(edition)
        self.assertEqual(len(previous), 236, "the guide/map package with the reviewed all-topics stylesheet is recovered")
        self.assertEqual(set(output) - set(previous), {edition.prefix + asset for asset in reviewed})
        self.assertEqual(set(previous) - set(output), set())
        old_sources = {record["path"] for record in previous_manifest["sourceFiles"]}
        self.assertEqual(set(sources) - old_sources, reviewed)
        self.assertEqual(old_sources - set(sources), set())
        self.assertEqual(manifest["storageNamespace"], "mathExamBook:oge-2026-10-31-v2:")

    def test_all_topics_adds_only_its_stylesheet_and_preserves_prior_closure(self):
        edition = builder.Edition("v2", builder.PUBLISHED_V1)
        output, manifest = builder.build(edition)
        entry = "trainers/oge-course/index.html"
        asset = "assets/oge-all-topics.css"
        tag = '<link rel="stylesheet" href="/assets/oge-all-topics.css?v=20261110">'
        raw = (ROOT / entry).read_bytes()
        self.assertEqual(raw.count(tag.encode()), 1, "exact reviewed all-topics include")
        sources = {record["path"]: record for record in manifest["sourceFiles"]}
        self.assertIn(asset, sources[entry]["dependencies"])
        self.assertEqual(sources[asset]["dependencies"], [], "no hidden stylesheet dependencies")
        self.assertEqual(sources[asset]["sha256"], hashlib.sha256((ROOT / asset).read_bytes()).hexdigest())
        self.assertEqual(output[edition.prefix + asset], (ROOT / asset).read_bytes())
        page = output[edition.prefix + entry].decode()
        bootstrap = '<script src="/' + edition.prefix + 'edition-assets/bootstrap.js"></script>'
        frozen = '/' + edition.prefix + asset + '?v=20261110'
        self.assertEqual(page.count(bootstrap), 1)
        self.assertEqual(page.count(frozen), 1)
        self.assertNotIn('"/' + asset, page)
        self.assertLess(page.index(bootstrap), page.index(frozen))
        previous_raw = raw.replace(tag.encode(), b"", 1)
        original_read = Path.read_bytes
        with patch.object(Path, "read_bytes", lambda path: previous_raw if path == ROOT / entry else original_read(path)):
            previous, previous_manifest = builder.build(edition)
        self.assertEqual(len(previous), 239, "removing only the reviewed stylesheet restores the prior closure")
        self.assertEqual(set(output) - set(previous), {edition.prefix + asset})
        self.assertEqual(set(previous) - set(output), set())
        old_sources = {record["path"] for record in previous_manifest["sourceFiles"]}
        self.assertEqual(set(sources) - old_sources, {asset})
        self.assertEqual(old_sources - set(sources), set())
        self.assertEqual(manifest["storageNamespace"], "mathExamBook:oge-2026-10-31-v2:")

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
                self.assertNotIn(b"learning-bridge.js", data)
                self.assertNotIn(b"oge-learning.js", data)

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
