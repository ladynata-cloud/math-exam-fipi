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
NEW_PREFIX = "book/oge/2026-10-31/v2/"
NEW_MANIFEST = NEW_PREFIX + "manifest.json"


class GateTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="mathexam-book-gate-")
        self.root = Path(self.directory.name)
        for folder in ["book", "b"]:
            shutil.copytree(ROOT / folder, self.root / folder)
        self.command("init", "-q")
        self.command("config", "user.name", "Book edition regression")
        self.command("config", "user.email", "book-edition-tests@example.invalid")
        # The fixture models this PR: v1 is published, v2 is a new candidate.
        self.command("add", PREFIX, "b/oge26-1/")
        self.command("commit", "-qm", "Fixture edition")
        self.base = self.command("rev-parse", "HEAD").decode().strip()

    def tearDown(self):
        self.directory.cleanup()

    def command(self, *args):
        return subprocess.check_output(["git", *args], cwd=self.root, stderr=subprocess.STDOUT)

    def update_record(self, file, manifest_name=MANIFEST):
        path = self.root / manifest_name
        manifest = json.loads(path.read_text())
        records = {r["path"]: r for r in manifest["files"]}
        data = (self.root / file).read_bytes()
        records[file] = {"path": file, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
        manifest["files"] = sorted(records.values(), key=lambda r: r["path"])
        path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

    def test_complete_package_and_unmodified_baseline(self):
        result = verify.verify(self.root, self.base)
        self.assertEqual(result["protectedBaseEditions"], 1)
        self.assertEqual([(e["edition"], e["entries"]) for e in result["editions"]],
                         [("oge-2026-10-31-v1", 71), ("oge-2026-10-31-v2", 71)])

    def test_new_edition_cannot_reuse_old_storage_identity(self):
        path = self.root / NEW_MANIFEST
        manifest = json.loads(path.read_text())
        manifest["edition"] = "oge-2026-10-31-v1"
        manifest["storageNamespace"] = "mathExamBook:oge-2026-10-31-v1:"
        path.write_text(json.dumps(manifest))
        with self.assertRaisesRegex(verify.InvalidEdition, "identity differs"):
            verify.inspect(self.root, NEW_MANIFEST)

    def test_rehashed_bootstrap_cannot_use_old_storage_configuration(self):
        name = NEW_PREFIX + "edition-assets/bootstrap.js"
        file = self.root / name
        file.write_text(file.read_text().replace('"edition":"oge-2026-10-31-v2"',
                                                '"edition":"oge-2026-10-31-v1"'))
        self.update_record(name, NEW_MANIFEST)
        with self.assertRaisesRegex(verify.InvalidEdition, "Startup configuration differs"):
            verify.inspect(self.root, NEW_MANIFEST)

    def test_rehashed_bootstrap_cannot_display_a_wrong_or_missing_version(self):
        name = NEW_PREFIX + "edition-assets/bootstrap.js"
        file = self.root / name
        original, manifest_bytes = file.read_text(), (self.root / NEW_MANIFEST).read_bytes()
        for label in ['"version":"v1",', '']:
            with self.subTest(label=label):
                file.write_text(original.replace('"version":"v2",', label))
                self.update_record(name, NEW_MANIFEST)
                with self.assertRaisesRegex(verify.InvalidEdition, "Startup visible version differs"):
                    verify.inspect(self.root, NEW_MANIFEST)
                (self.root / NEW_MANIFEST).write_bytes(manifest_bytes)
        file.write_text(original)

    def test_rehashed_v2_resource_cannot_cross_to_v1(self):
        name = NEW_PREFIX + "index.html"
        file = self.root / name
        file.write_text(file.read_text().replace("</head>",
                        '<script src="/' + PREFIX + 'assets/site.css"></script></head>', 1))
        self.update_record(name, NEW_MANIFEST)
        with self.assertRaisesRegex(verify.InvalidEdition, "Mutable or missing resource"):
            verify.inspect(self.root, NEW_MANIFEST)

    def test_rehashed_mapping_cannot_swap_two_valid_targets(self):
        path = self.root / NEW_MANIFEST
        manifest = json.loads(path.read_text())
        rows = manifest["entries"]
        rows[0]["frozenUrl"], rows[1]["frozenUrl"] = rows[1]["frozenUrl"], rows[0]["frozenUrl"]
        path.write_text(json.dumps(manifest))
        (self.root / NEW_PREFIX / "url-map.json").write_text(json.dumps(rows))
        self.update_record(NEW_PREFIX + "url-map.json", NEW_MANIFEST)
        with self.assertRaisesRegex(verify.InvalidEdition, "Frozen entry differs"):
            verify.inspect(self.root, NEW_MANIFEST)

    def test_v2_alias_cannot_reuse_published_v1_address(self):
        path = self.root / NEW_MANIFEST
        manifest = json.loads(path.read_text())
        manifest["entries"][0]["bookUrl"] = "https://mathexam.space/b/oge26-1/01/"
        path.write_text(json.dumps(manifest))
        (self.root / NEW_PREFIX / "url-map.json").write_text(json.dumps(manifest["entries"]))
        self.update_record(NEW_PREFIX + "url-map.json", NEW_MANIFEST)
        with self.assertRaisesRegex(verify.InvalidEdition, "Short URL differs"):
            verify.inspect(self.root, NEW_MANIFEST)

    def test_byte_mutation_is_detected(self):
        file = self.root / PREFIX / "edition-assets/edition.css"
        file.write_bytes(file.read_bytes() + b"/* change */")
        with self.assertRaisesRegex(verify.InvalidEdition, "Size mismatch|Hash mismatch"):
            verify.inspect(self.root, MANIFEST)

    def test_rehashing_cannot_rewrite_old_edition(self):
        name = PREFIX + "edition-assets/edition.css"
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

    def test_rehashed_old_underscore_asset_layout_is_rejected(self):
        # Reproduce the real release defect: all files and hashes are valid,
        # yet default Jekyll omits the startup/storage boundary and its CSS.
        manifest_path = self.root / MANIFEST
        manifest = json.loads(manifest_path.read_text())
        for name in ("bootstrap.js", "edition.css"):
            old = self.root / PREFIX / "_edition" / name
            old.parent.mkdir(parents=True, exist_ok=True)
            (self.root / PREFIX / "edition-assets" / name).rename(old)
        for record in manifest["files"]:
            record["path"] = record["path"].replace(PREFIX + "edition-assets/", PREFIX + "_edition/")
            file = self.root / record["path"]
            if file.suffix == ".html":
                file.write_bytes(file.read_bytes().replace(
                    ("/" + PREFIX + "edition-assets/").encode(),
                    ("/" + PREFIX + "_edition/").encode()))
            data = file.read_bytes()
            record.update(bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        with self.assertRaisesRegex(verify.InvalidEdition, "Jekyll-hidden package path: .*_edition/"):
            verify.inspect(self.root, MANIFEST)

    def test_rehashed_jekyll_hidden_components_are_rejected(self):
        manifest_path = self.root / MANIFEST
        original = manifest_path.read_bytes()
        hidden_names = ["_runtime/payload.js", "assets/.hidden/payload.js",
                        "assets/#draft/payload.js", "assets/runtime.js~",
                        "assets/node_modules/runtime.js", "assets/vendor/runtime.js"]
        for hidden in hidden_names:
            with self.subTest(path=hidden):
                name = PREFIX + hidden
                file = self.root / name
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text("A valid manifest hash cannot make this path publishable.")
                self.update_record(name)
                try:
                    with self.assertRaisesRegex(verify.InvalidEdition, "Jekyll-hidden package path") as caught:
                        verify.inspect(self.root, MANIFEST)
                    self.assertIn(name, str(caught.exception))
                finally:
                    file.unlink()
                    manifest_path.write_bytes(original)

    def test_new_version_path_does_not_modify_old_version(self):
        new = self.root / "book/oge/2026-11-01/v1/example.txt"
        new.parent.mkdir(parents=True)
        new.write_text("A separate candidate has a separate path.")
        self.assertEqual(verify.append_only(self.root, self.base), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
