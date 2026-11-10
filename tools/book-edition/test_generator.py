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
        # The course guide adds exactly two local assets, also checked below.
        # The active-learning task adds exactly three local assets, also checked below.
        # The shared course shell adds exactly one stylesheet, checked below.
        # Video models add four assets and all-topic navigation adds one stylesheet.
        # This is the future candidate closure; published v1/v2 stay immutable.
        self.assertEqual(len(first), 244)
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
        self.assertEqual(len(previous), 242)
        self.assertEqual(set(output) - set(previous), {edition.prefix + asset for asset in reviewed})
        self.assertEqual(set(previous) - set(output), set())
        old_sources = {record["path"] for record in previous_manifest["sourceFiles"]}
        self.assertEqual(set(sources) - old_sources, reviewed)
        self.assertEqual(old_sources - set(sources), set())
        self.assertEqual(manifest["storageNamespace"], "mathExamBook:oge-2026-10-31-v2:")

    def test_active_learning_closure_is_exact_and_keeps_early_storage_namespace(self):
        edition = builder.Edition("v2", builder.PUBLISHED_V1)
        output, manifest = builder.build(edition)
        reviewed = {
            "trainers/oge-active-learning-data.js",
            "trainers/oge-active-learning.js",
            "trainers/oge-active-learning.css",
        }
        pages = {
            6: "trainers/oge-task6-fractions.html",
            7: "trainers/oge-task7-number-line.html",
            8: "trainers/oge-task8-powers-roots.html",
            9: "trainers/oge-task9-equations.html",
            10: "trainers/oge-task10-probability.html",
            11: "trainers/oge-task11-graphs-trainer.html",
            12: "trainers/oge-task12-formulas-trainer.html",
        }
        sources = {record["path"]: record for record in manifest["sourceFiles"]}
        without_active = {}
        bootstrap = '<script src="/' + edition.prefix + 'edition-assets/bootstrap.js"></script>'
        for number, source in pages.items():
            raw = (ROOT / source).read_bytes()
            tags = (
                '<link rel="stylesheet" href="oge-active-learning.css?v=20261109">',
                '<script defer src="oge-active-learning-data.js?v=20261109"></script>',
                '<script defer src="oge-active-learning.js?v=20261109" data-oa-task="' + str(number) + '"></script>',
            )
            for tag in tags:
                self.assertEqual(raw.count(tag.encode()), 1, source + ': exact reviewed include')
                raw = raw.replace(tag.encode(), b'', 1)
            without_active[ROOT / source] = raw
            self.assertTrue(reviewed.issubset(sources[source]["dependencies"]))
            frozen = output[edition.prefix + source].decode()
            self.assertEqual(frozen.count(bootstrap), 1)
            for asset in reviewed:
                url = '/' + edition.prefix + asset + '?v=20261109'
                self.assertEqual(frozen.count(url), 1, source + ': frozen dependency')
                self.assertNotIn('"/' + asset, frozen)
                self.assertLess(frozen.index(bootstrap), frozen.index(url))
            data_url = '/' + edition.prefix + 'trainers/oge-active-learning-data.js?v=20261109'
            ui_url = '/' + edition.prefix + 'trainers/oge-active-learning.js?v=20261109'
            self.assertLess(frozen.index(data_url), frozen.index(ui_url))
        for asset in reviewed:
            self.assertEqual(sources[asset]["dependencies"], [], asset + ': no hidden dependencies')
            self.assertEqual(sources[asset]["sha256"], hashlib.sha256((ROOT / asset).read_bytes()).hexdigest())
            self.assertEqual(output[edition.prefix + asset], (ROOT / asset).read_bytes())
        # Removing only the seven exact include triples reproduces the previous
        # 241-file closure (retaining guide, shared style, video and all-topic assets).
        # All old paths remain; only these three active-learning assets are new.
        original_read = Path.read_bytes
        with patch.object(Path, "read_bytes", lambda path: without_active[path]
                          if path in without_active else original_read(path)):
            previous, previous_manifest = builder.build(edition)
        self.assertEqual(len(previous), 241)
        self.assertEqual(set(output) - set(previous), {edition.prefix + asset for asset in reviewed})
        self.assertEqual(set(previous) - set(output), set())
        old_sources = {record["path"] for record in previous_manifest["sourceFiles"]}
        self.assertEqual(set(sources) - old_sources, reviewed)
        self.assertEqual(old_sources - set(sources), set())
        self.assertEqual(manifest["storageNamespace"], "mathExamBook:oge-2026-10-31-v2:")

    def test_course_style_closure_adds_only_the_reviewed_stylesheet(self):
        edition = builder.Edition("v2", builder.PUBLISHED_V1)
        output, manifest = builder.build(edition)
        entry = "trainers/oge-course/index.html"
        asset = "assets/course-ui.css"
        sources = {record["path"]: record for record in manifest["sourceFiles"]}
        self.assertEqual({path for path, record in sources.items()
                          if asset in record["dependencies"]}, {entry})
        self.assertEqual(sources[asset]["dependencies"], [], "no hidden stylesheet dependencies")
        source_css = (ROOT / asset).read_bytes()
        self.assertEqual(sources[asset]["sha256"], hashlib.sha256(source_css).hexdigest())
        self.assertEqual(output[edition.prefix + asset], source_css)

        raw = (ROOT / entry).read_bytes()
        tag = '<link rel="stylesheet" href="/assets/course-ui.css?v=20261109-1">'
        self.assertEqual(raw.count(tag.encode()), 1, "exact reviewed course stylesheet include")
        page = output[edition.prefix + entry].decode()
        bootstrap_path = edition.prefix + "edition-assets/bootstrap.js"
        bootstrap = '<script src="/' + bootstrap_path + '"></script>'
        frozen_tag = '<link rel="stylesheet" href="/' + edition.prefix + asset + '?v=20261109-1">'
        self.assertEqual(page.count(bootstrap), 1)
        self.assertEqual(page.count(frozen_tag), 1)
        self.assertNotIn('"/' + asset, page)
        self.assertLess(page.index(bootstrap), page.index(frozen_tag))

        original_read = Path.read_bytes
        restored = raw.replace(tag.encode(), b"", 1)
        with patch.object(Path, "read_bytes", lambda path: restored if path == ROOT / entry else original_read(path)):
            previous, previous_manifest = builder.build(edition)
        self.assertEqual(set(output) - set(previous), {edition.prefix + asset})
        self.assertEqual(set(previous) - set(output), set())
        old_sources = {record["path"]: record for record in previous_manifest["sourceFiles"]}
        self.assertEqual(set(sources) - set(old_sources), {asset})
        self.assertEqual(set(old_sources) - set(sources), set())
        self.assertEqual([path for path in sources[entry]["dependencies"] if path != asset],
                         old_sources[entry]["dependencies"])
        self.assertEqual(page.replace(frozen_tag, "", 1), previous[edition.prefix + entry].decode())
        # Bootstrap and manifest fingerprints include the changed source closure;
        # every other prior output remains byte-identical.
        changed = {edition.prefix + entry, bootstrap_path, edition.prefix + "manifest.json"}
        for path, data in previous.items():
            if path not in changed:
                self.assertEqual(output[path], data, path)
        namespace = "mathExamBook:oge-2026-10-31-v2:"
        self.assertEqual(manifest["storageNamespace"], namespace)
        self.assertEqual(previous_manifest["storageNamespace"], namespace)
        def bootstrap_config(data):
            text = data.decode()
            marker = "  const config = "
            self.assertEqual(text.count(marker), 1)
            prefix, encoded = text.split(marker, 1)
            config, suffix = encoded.split(";\n", 1)
            return json.loads(config), prefix + marker + "<CONFIG>;\n" + suffix
        current_config, current_runtime = bootstrap_config(output[bootstrap_path])
        old_config, old_runtime = bootstrap_config(previous[bootstrap_path])
        self.assertEqual(current_runtime, old_runtime, "storage and link isolation runtime is unchanged")
        self.assertEqual(current_config["paths"].count('/' + asset), 1)
        self.assertEqual([path for path in current_config["paths"] if path != '/' + asset], old_config["paths"])
        self.assertEqual({key: value for key, value in current_config.items() if key != "paths"},
                         {key: value for key, value in old_config.items() if key != "paths"})
        self.assertEqual(current_config["edition"], "oge-2026-10-31-v2")
        self.assertEqual(manifest["sourceBase"], builder.PUBLISHED_V1)

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
        self.assertEqual(len(previous), 240, "only the four reviewed video assets are removed")
        self.assertEqual(set(output) - set(previous), {edition.prefix + asset for asset in reviewed})
        self.assertEqual(set(previous) - set(output), set())
        old_sources = {record["path"] for record in previous_manifest["sourceFiles"]}
        self.assertEqual(set(sources) - old_sources, reviewed)
        self.assertEqual(old_sources - set(sources), set())
        self.assertEqual(manifest["storageNamespace"], "mathExamBook:oge-2026-10-31-v2:")

    def test_course_entry_stylesheets_add_only_reviewed_dependencies(self):
        edition = builder.Edition("v2", builder.PUBLISHED_V1)
        output, manifest = builder.build(edition)
        entry = "trainers/oge-course/index.html"
        assets = {"assets/oge-all-topics.css", "assets/oge-entry-sections.css"}
        raw = (ROOT / entry).read_bytes()
        sources = {record["path"]: record for record in manifest["sourceFiles"]}
        page = output[edition.prefix + entry].decode()
        bootstrap = '<script src="/' + edition.prefix + 'edition-assets/bootstrap.js"></script>'
        self.assertEqual(page.count(bootstrap), 1)
        original_read = Path.read_bytes
        for asset in sorted(assets):
            with self.subTest(asset=asset):
                tag = f'<link rel="stylesheet" href="/{asset}?v=20261110">'.encode()
                self.assertEqual(raw.count(tag), 1, "exact reviewed stylesheet include")
                self.assertIn(asset, sources[entry]["dependencies"])
                self.assertEqual(sources[asset]["dependencies"], [], "no hidden stylesheet dependencies")
                self.assertEqual(sources[asset]["sha256"], hashlib.sha256((ROOT / asset).read_bytes()).hexdigest())
                self.assertEqual(output[edition.prefix + asset], (ROOT / asset).read_bytes())
                frozen = '/' + edition.prefix + asset + '?v=20261110'
                self.assertEqual(page.count(frozen), 1)
                self.assertNotIn('"/' + asset, page)
                self.assertLess(page.index(bootstrap), page.index(frozen))
                previous_raw = raw.replace(tag, b"", 1)
                with patch.object(Path, "read_bytes", lambda path: previous_raw if path == ROOT / entry else original_read(path)):
                    previous, previous_manifest = builder.build(edition)
                self.assertEqual(len(previous), 243)
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

    def test_public_skill_detours_are_excluded_and_unknown_loader_changes_fail(self):
        edition = builder.Edition("v2", builder.PUBLISHED_V1)
        source = "trainers/oge-basics/navigation-minimal.js"
        original = (ROOT / source).read_text()
        cleaned = builder.sanitize(source, original, edition)
        self.assertEqual(cleaned, original.replace(builder.PUBLIC_SKILL_SUPPORT_LOADER, "", 1))
        self.assertIn("function fold(nodes,label,before)", cleaned)
        self.assertNotIn("skill-support", cleaned)
        for changed in (
                original.replace("skill-support.js?v=20261110", "skill-support.js?v=unreviewed"),
                original.replace("!window.MathExamBookEdition&&", ""),
                original.replace(builder.PUBLIC_SKILL_SUPPORT_LOADER,
                                 builder.PUBLIC_SKILL_SUPPORT_LOADER * 2)):
            with self.subTest(change=changed[:80]), self.assertRaisesRegex(ValueError, "skill-support loader changed"):
                builder.sanitize(source, changed, edition)
        # Direct includes are optional public UI too; instructional links remain.
        retained = '<a href="/trainers/long-division-stepwise.html">Division</a>'
        included = ('<script defer src="/trainers/oge-basics/skill-support.js?v=20261110"></script>'
                    '<link rel="stylesheet" href="/trainers/oge-basics/skill-support.css?v=20261110">')
        self.assertEqual(builder.sanitize("index.html", included + retained, edition), retained)
        output, manifest = builder.build(edition)
        excluded = {"trainers/oge-basics/skill-support.js", "trainers/oge-basics/skill-support.css"}
        sources = {record["path"] for record in manifest["sourceFiles"]}
        dependencies = {name for record in manifest["sourceFiles"] for name in record["dependencies"]}
        self.assertFalse(sources & excluded)
        self.assertFalse(dependencies & excluded)
        for name in excluded:
            self.assertNotIn(edition.prefix + name, output)
        self.assertNotIn(b"skill-support", output[edition.prefix + source])

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
