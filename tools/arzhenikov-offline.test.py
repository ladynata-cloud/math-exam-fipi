#!/usr/bin/env python3
"""Regression tests for offline completeness, link semantics and reproducibility."""

import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
import zipfile


spec = importlib.util.spec_from_file_location("offline", Path(__file__).with_name("build-arzhenikov-offline.py"))
offline = importlib.util.module_from_spec(spec)
spec.loader.exec_module(offline)


class OfflinePackageTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.license_bytes = b"MIT License\r\n\r\nCopyright (c) test fixture\r\nPermission notice preserved exactly.\r\n"
        (self.root / "LICENSE").write_bytes(self.license_bytes)
        self.page = self.root / offline.PAGE
        self.page.parent.mkdir(parents=True)
        self.page.write_text('''<!doctype html><html><head>
<script defer src="/assets/assistant/navigator-data.js?v=example"></script>
<script defer src="/assets/assistant/navigator-widget.js?v=example"></script>
<link rel="stylesheet" href="arzhenikov-style.css">
<script defer src="arzhenikov-game.js"></script>
</head><body><main>
<a href="#workshop">Игра</a>
<a href="arzhenikov-map.html#harbor">Порт</a>
<a href="index.html">Соседняя страница</a>
<a href="/trainers/algebra.html">Алгебра онлайн</a>
<a href="https://letopis.msu.ru/peoples/8648">Источник</a>
<a class="download" download href="arzhenikov-offline.zip"><strong>Скачать ZIP</strong></a>
</main></body></html>''', encoding="utf-8")
        (self.page.parent / "arzhenikov-style.css").write_text(
            '.token{background:url("arzhenikov-object.png")} .remote{background:url("/assets/extra.png")}', encoding="utf-8"
        )
        (self.page.parent / "arzhenikov-game.js").write_text(
            "const art = ['arzhenikov-world.png']; const another = new URL('arzhenikov-peach.png', location.href);",
            encoding="utf-8",
        )
        for name in ["arzhenikov-object.png", "arzhenikov-world.png", "arzhenikov-peach.png"]:
            (self.page.parent / name).write_bytes(b"image fixture " + name.encode())
        (self.root / "assets").mkdir()
        (self.root / "assets/extra.png").write_bytes(b"root image")

    def test_transitive_assets_and_navigation(self):
        members = offline.build_members(self.root)
        self.assertIn("arzhenikov-world.png", members)
        self.assertIn("arzhenikov-peach.png", members)
        self.assertIn("_site/assets/extra.png", members)
        self.assertIn(b'_site/assets/extra.png', members["arzhenikov-style.css"])
        html = members["index.html"].decode()
        self.assertNotIn("navigator-data.js", html)
        self.assertNotIn("navigator-widget.js", html)
        self.assertNotIn("Скачать ZIP", html)
        self.assertNotIn('href="arzhenikov-offline.zip"', html)
        self.assertIn('href="#workshop"', html)
        self.assertIn('href="#harbor"', html)
        self.assertIn('href="https://mathexam.space/trainers/oge-basics/multiplication-division/index.html"', html)
        self.assertIn('href="https://mathexam.space/trainers/algebra.html"', html)
        self.assertIn('href="https://letopis.msu.ru/peoples/8648"', html)
        offline.verify_resource_closure(members)

    def test_missing_or_network_assets_fail(self):
        (self.page.parent / "arzhenikov-world.png").unlink()
        with self.assertRaisesRegex(ValueError, "Missing or invalid"):
            offline.build_members(self.root)
        (self.page.parent / "arzhenikov-world.png").write_bytes(b"restored")
        self.page.write_text(self.page.read_text().replace("arzhenikov-game.js", "https://example.org/game.js"))
        with self.assertRaisesRegex(ValueError, "Network-dependent"):
            offline.build_members(self.root)

    def test_resource_closure_rejects_missing_embedded_file(self):
        members = offline.build_members(self.root)
        del members["arzhenikov-peach.png"]
        with self.assertRaisesRegex(ValueError, "Incomplete offline resource"):
            offline.verify_resource_closure(members)

    def test_zip_is_deterministic_and_checks_reject_changes(self):
        members = offline.build_members(self.root)
        first = offline.zip_bytes(members)
        second = offline.zip_bytes(dict(reversed(list(members.items()))))
        self.assertEqual(first, second)
        offline.check_archive(first, members)
        with zipfile.ZipFile(io.BytesIO(first)) as archive:
            self.assertEqual(archive.namelist(), sorted(members))
            for info in archive.infolist():
                self.assertEqual(info.date_time, offline.STAMP)
                self.assertEqual(info.external_attr >> 16 & 0o777, 0o644)
        altered = dict(members)
        altered["arzhenikov-game.js"] += b"\n// changed"
        with self.assertRaisesRegex(ValueError, "stale content"):
            offline.check_archive(first, altered)
        altered["extra-file.txt"] = b"unexpected"
        with self.assertRaisesRegex(ValueError, "member list"):
            offline.check_archive(first, altered)

    def test_manifest_identifies_every_resource(self):
        import hashlib
        members = offline.build_members(self.root)
        manifest = json.loads(members["manifest.json"])
        self.assertEqual({entry["path"] for entry in manifest["files"]}, set(members) - {"manifest.json"})
        for entry in manifest["files"]:
            content = members[entry["path"]]
            self.assertEqual(entry["bytes"], len(content))
            self.assertEqual(entry["sha256"], hashlib.sha256(content).hexdigest())

    def test_license_notice_is_preserved_exactly(self):
        members = offline.build_members(self.root)
        self.assertEqual(members["LICENSE.txt"], self.license_bytes)
        archive_bytes = offline.zip_bytes(members)
        with zipfile.ZipFile(io.BytesIO(archive_bytes)) as archive:
            self.assertEqual(archive.read("LICENSE.txt"), self.license_bytes)
        changed = self.license_bytes + b"Additional notice.\r\n"
        (self.root / "LICENSE").write_bytes(changed)
        revised = offline.build_members(self.root)
        self.assertEqual(revised["LICENSE.txt"], changed)
        with self.assertRaisesRegex(ValueError, "stale content: LICENSE.txt"):
            offline.check_archive(archive_bytes, revised)

    def test_repository_page_is_complete_without_writing(self):
        members = offline.build_members()
        self.assertIn("arzhenikov-object-atlas.png", members)
        self.assertIn("arzhenikov-world-atlas.png", members)
        self.assertIn("arzhenikov-peach.png", members)
        self.assertIn("arzhenikov-garden-bank.js", members)
        self.assertIn("arzhenikov-life-bank.js", members)
        self.assertIn("arzhenikov-harbor-bank.js", members)
        self.assertEqual(members["LICENSE.txt"], (offline.ROOT / "LICENSE").read_bytes())
        offline.check_archive(offline.zip_bytes(members), members)


if __name__ == "__main__":
    unittest.main()
