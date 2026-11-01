#!/usr/bin/env python3
"""Compare every deployed book byte and public entry with a reviewed local manifest.

Read-only. HTTPS is required except for an explicit loopback rehearsal. This
check verifies HTTP delivery and the exact reviewed alias programs; actual
JavaScript navigation and learner behavior have separate browser evidence.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

sys.dont_write_bytecode = True


DEFAULT_MANIFEST = "book/oge/2026-10-31/v1/manifest.json"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def validated_origin(value, local_rehearsal=False):
    parsed = urlsplit(value)
    if parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path not in ("", "/"):
        raise ValueError("Origin must contain only scheme, host and optional port")
    local = parsed.hostname in ("localhost", "127.0.0.1", "::1")
    if not parsed.hostname or (parsed.scheme != "https" and not (local_rehearsal and local and parsed.scheme == "http")):
        raise ValueError("HTTPS required; HTTP is allowed only for explicit loopback rehearsal")
    if local_rehearsal and not local:
        raise ValueError("Local rehearsal must use a loopback origin")
    return parsed.scheme + "://" + parsed.netloc


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # A 200 response at some unrelated fallback URL is not a passing entry.
        return None


def request_bytes(url, expected_size, timeout):
    opener = build_opener(NoRedirect())
    request = Request(url, headers={"User-Agent": "MathExam-Book-Release-Check/1", "Accept-Encoding": "identity", "Cache-Control": "no-cache"})
    try:
        with opener.open(request, timeout=timeout) as response:
            data = response.read(expected_size + 1)
            return response.status, response.geturl(), data, None
    except HTTPError as error:
        return error.code, error.geturl(), b"", "HTTP " + str(error.code)
    except (URLError, OSError, TimeoutError) as error:
        return None, url, b"", str(error)


def plan(root, manifest_name):
    verifier_path = Path(__file__).with_name("verify.py")
    spec = importlib.util.spec_from_file_location("book_integrity", verifier_path)
    verifier = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(verifier)
    # Never trust remote hash declarations or an invalid local package.
    verifier.inspect(root, manifest_name)
    manifest_bytes = (root / manifest_name).read_bytes()
    manifest = json.loads(manifest_bytes)
    files = {row["path"]: row for row in manifest["files"]}
    files[manifest_name] = {"path": manifest_name, "bytes": len(manifest_bytes), "sha256": sha(manifest_bytes)}
    checks = [{"kind": "file", "route": "/" + name, **row} for name, row in sorted(files.items())]
    for entry in manifest["entries"]:
        for field, kind in (("bookUrl", "alias"), ("frozenUrl", "target")):
            route = urlsplit(entry[field]).path
            name = route.lstrip("/") + ("index.html" if route.endswith("/") else "")
            checks.append({"kind": kind, "entryId": entry["id"], "route": route, **files[name]})
    return manifest, sha(manifest_bytes), checks


def verify(root, origin, manifest_name=DEFAULT_MANIFEST, *, local_rehearsal=False, workers=6, timeout=20, fetch=request_bytes):
    origin = validated_origin(origin, local_rehearsal)
    manifest, manifest_sha, checks = plan(Path(root).resolve(), manifest_name)
    if not local_rehearsal and origin != manifest["publicOrigin"]:
        raise ValueError("Production origin differs from the reviewed manifest")

    def check(row):
        url = origin + quote(row["route"], safe="/%-._~")
        status, final, data, error = fetch(url, row["bytes"], timeout)
        matched = status == 200 and final == url and len(data) == row["bytes"] and sha(data) == row["sha256"]
        return {**row, "url": url, "httpStatus": status, "finalUrl": final, "observedBytes": len(data),
                "observedSha256": sha(data), "status": "PASS" if matched else "FAIL", "error": error}

    with ThreadPoolExecutor(max_workers=workers) as executor:
        results = list(executor.map(check, checks))
    failures = [row for row in results if row["status"] != "PASS"]
    return {"schemaVersion": 1, "checkedAt": datetime.now(timezone.utc).isoformat(), "edition": manifest["edition"],
            "origin": origin, "manifestSha256": manifest_sha, "mode": "LOCAL_REHEARSAL" if local_rehearsal else "PRODUCTION",
            "status": "PASS" if not failures else "FAIL", "productionVerified": not local_rehearsal and not failures,
            "counts": {kind: sum(row["kind"] == kind for row in results) for kind in ("file", "alias", "target")},
            "failedChecks": len(failures), "results": results,
            "limitations": ["HTTP bytes and reviewed alias code only; this command does not execute JavaScript.",
                            "A local rehearsal never certifies production publication or deployment authorization.",
                            "Physical QR, physical devices and learner outcomes require separate evidence."]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--origin", default="https://mathexam.space")
    parser.add_argument("--manifest", default=DEFAULT_MANIFEST)
    parser.add_argument("--local-rehearsal", action="store_true")
    parser.add_argument("--workers", type=int, choices=range(1, 17), default=6)
    parser.add_argument("--timeout", type=float, default=20)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.timeout <= 0 or args.timeout > 60:
        parser.error("timeout must be greater than zero and at most 60 seconds")
    root = args.root.resolve()
    output = args.output.resolve()
    if output == (root / args.manifest).resolve() or any(output.is_relative_to(root / prefix) for prefix in ("book", "b")):
        parser.error("output must not overwrite the immutable package")
    report = verify(root, args.origin, args.manifest, local_rehearsal=args.local_rehearsal, workers=args.workers, timeout=args.timeout)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({key: report[key] for key in ("status", "mode", "counts", "failedChecks", "productionVerified")}, ensure_ascii=False))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
