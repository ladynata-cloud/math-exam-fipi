#!/usr/bin/env python3
"""Negative controls for integrity and the separately anchored append-only gate."""
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("verify", Path(__file__).with_name("verify.py"))
verify = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verify)
PREFIX = "book/oge/2026-10-31/v1/"
MANIFEST = PREFIX + "manifest.json"


class GateTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="mathexam-book-gate-")
        self.root = Path(self.directory.name)
        for folder in ["book", "b"]:
            shutil.copytree(ROOT / folder, self.root / folder)
        self.command("init", "-q")
        self.command("config", "user.name", "Book edition regression")
        self.command("config", "user.email", "book-edition-tests@example.invalid")
        self.command("add", "book", "b")
        self.command("commit", "-qm", "Fixture edition")
        self.base = self.command("rev-parse", "HEAD").decode().strip()

    def tearDown(self):
        self.directory.cleanup()

    def command(self, *args):
        return subprocess.check_output(["git", *args], cwd=self.root, stderr=subprocess.STDOUT)

    def update_record(self, file):
        path = self.root / MANIFEST
        manifest = json.loads(path.read_text())
        records = {r["path"]: r for r in manifest["files"]}
        data = (self.root / file).read_bytes()
        records[file] = {"path": file, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
        manifest["files"] = sorted(records.values(), key=lambda r: r["path"])
        path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

    def test_complete_package_and_unmodified_baseline(self):
        result = verify.verify(self.root, self.base)
        self.assertEqual(result["protectedBaseEditions"], 1)
        self.assertEqual(result["editions"][0]["entries"], 71)

    def test_byte_mutation_is_detected(self):
        file = self.root / PREFIX / "_edition/edition.css"
        file.write_bytes(file.read_bytes() + b"/* change */")
        with self.assertRaisesRegex(verify.InvalidEdition, "Size mismatch|Hash mismatch"):
            verify.inspect(self.root, MANIFEST)

    def test_rehashing_cannot_rewrite_old_edition(self):
        name = PREFIX + "_edition/edition.css"
        file = self.root / name
        file.write_bytes(file.read_bytes() + b"/* same-manifest forgery */")
        self.update_record(name)
        verify.inspect(self.root, MANIFEST)
        with self.assertRaisesRegex(verify.InvalidEdition, "Append-only violation"):
            verify.append_only(self.root, self.base)

    def test_missing_file_is_detected(self):
        (self.root / "b/oge26-1/01/index.html").unlink()
        with self.assertRaisesRegex(verify.InvalidEdition, "Missing or extra"):
            verify.inspect(self.root, MANIFEST)
        with self.assertRaisesRegex(verify.InvalidEdition, "removed or changed type"):
            verify.append_only(self.root, self.base)

    def test_addition_cannot_modify_existing_namespace(self):
        name = PREFIX + "unexpected.txt"
        (self.root / name).write_text("unexpected")
        self.update_record(name)
        verify.inspect(self.root, MANIFEST)
        with self.assertRaisesRegex(verify.InvalidEdition, "Append-only violation"):
            verify.append_only(self.root, self.base)

    def test_rehashed_mutable_runtime_escape_is_rejected(self):
        name = PREFIX + "index.html"
        file = self.root / name
        text = file.read_text().replace("</head>", '<script src="/assets/mutable.js"></script></head>', 1)
        file.write_text(text)
        self.update_record(name)
        with self.assertRaisesRegex(verify.InvalidEdition, "Mutable or missing resource"):
            verify.inspect(self.root, MANIFEST)

    def test_rehashed_alias_target_change_is_rejected(self):
        name = "b/oge26-1/01/index.html"
        file = self.root / name
        file.write_text(file.read_text().replace('new URL("/' + PREFIX + '"', 'new URL("/"'))
        self.update_record(name)
        with self.assertRaisesRegex(verify.InvalidEdition, "Alias points"):
            verify.inspect(self.root, MANIFEST)

    def test_new_version_path_does_not_modify_old_version(self):
        new = self.root / "book/oge/2026-11-01/v1/example.txt"
        new.parent.mkdir(parents=True)
        new.write_text("A separate candidate has a separate path.")
        self.assertEqual(verify.append_only(self.root, self.base), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
