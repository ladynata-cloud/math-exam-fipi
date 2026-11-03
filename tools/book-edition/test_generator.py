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
        self.assertEqual(len(first), 225)
        self.assertTrue(all(name.startswith((edition.prefix, edition.alias)) for name in first))
        self.assertEqual(manifest["sourceBase"], builder.PUBLISHED_V1)
        self.assertEqual(manifest["storageNamespace"], "mathExamBook:oge-2026-10-31-v2:")
        self.assertIn(b'"version":"v2"', first[edition.prefix + "edition-assets/bootstrap.js"])
        self.assertIn("Редакция 31.10.2026 · v2.".encode(), first[edition.alias + "01/index.html"])

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
