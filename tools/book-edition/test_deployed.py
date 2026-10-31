#!/usr/bin/env python3
"""Negative controls for the release HTTP verifier; no production requests."""
import functools
import http.server
import importlib.util
from pathlib import Path
import sys
import threading
import unittest
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[2]
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("deployed", Path(__file__).with_name("verify_deployed.py"))
deployed = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deployed)


class ReleaseCheck(unittest.TestCase):
    def fetch(self, url, size, timeout):
        name = unquote(urlsplit(url).path).lstrip("/")
        if name.endswith("/"):
            name += "index.html"
        return 200, url, (ROOT / name).read_bytes(), None

    def run_check(self, fetch=None):
        return deployed.verify(ROOT, "https://mathexam.space", fetch=fetch or self.fetch)

    def test_all_reviewed_bytes_and_pretty_entries(self):
        result = self.run_check()
        self.assertEqual(result["counts"], {"file": 225, "alias": 71, "target": 71})
        self.assertEqual(result["status"], "PASS")

    def test_200_error_page_is_rejected(self):
        result = self.run_check(lambda url, size, timeout: (200, url, b"Not found", None))
        self.assertEqual(result["failedChecks"], 367)
        self.assertFalse(result["productionVerified"])

    def test_one_changed_payload_is_rejected(self):
        def changed(url, size, timeout):
            status, final, data, error = self.fetch(url, size, timeout)
            if url.endswith("edition-assets/bootstrap.js"):
                data = data[:-1] + bytes([data[-1] ^ 1])
            return status, final, data, error
        result = self.run_check(changed)
        self.assertEqual(result["failedChecks"], 1)

    def test_redirect_to_200_fallback_is_rejected(self):
        def redirected(url, size, timeout):
            status, final, data, error = self.fetch(url, size, timeout)
            return status, "https://mathexam.space/", data, error
        self.assertEqual(self.run_check(redirected)["failedChecks"], 367)

    def test_missing_alias_route_is_rejected_even_if_index_file_exists(self):
        def missing(url, size, timeout):
            if url.endswith("/b/oge26-1/05/"):
                return 404, url, b"", "HTTP 404"
            return self.fetch(url, size, timeout)
        result = self.run_check(missing)
        self.assertEqual(result["failedChecks"], 1)
        self.assertEqual(next(r for r in result["results"] if r["status"] == "FAIL")["entryId"], "05")

    def test_origin_and_rehearsal_boundaries(self):
        for origin in ("http://mathexam.space", "https://user:pass@mathexam.space", "https://mathexam.space/subpath", "https://mathexam.space?query=1"):
            with self.subTest(origin=origin), self.assertRaises(ValueError):
                deployed.validated_origin(origin)
        with self.assertRaises(ValueError):
            deployed.validated_origin("https://mathexam.space", True)
        with self.assertRaises(ValueError):
            deployed.verify(ROOT, "https://example.org", fetch=self.fetch)

    def test_real_loopback_delivery_is_never_production_evidence(self):
        class Quiet(http.server.SimpleHTTPRequestHandler):
            def log_message(self, *args):
                pass
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(ROOT)))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            result = deployed.verify(ROOT, "http://127.0.0.1:" + str(server.server_port), local_rehearsal=True)
            self.assertEqual(result["status"], "PASS")
            self.assertEqual(result["mode"], "LOCAL_REHEARSAL")
            self.assertFalse(result["productionVerified"])
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == "__main__":
    unittest.main()
