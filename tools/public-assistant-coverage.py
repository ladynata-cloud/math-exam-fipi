#!/usr/bin/env python3
"""Reviewable public helper coverage; never crawl private/archived HTML blindly.

--write inserts only the exact two-script block and updates the manifest.
--check checks inventory and inclusion without modifying files.
--base SHA additionally proves every existing HTML byte is unchanged after
removing the new block. Use that scope check for the initial integration PR.
"""

import argparse
from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://mathexam.space"
MANIFEST = ROOT / "tools/public-assistant-pages.json"
SCOPE_MANIFEST = ROOT / "tools/public-assistant-scope.json"
MARKER = b"MathExam public assistant"
BLOCK = (
    b'\n<!-- MathExam public assistant -->\n'
    b'<script defer src="/assets/assistant/data.js?v=public-assistant-20261031"></script>\n'
    b'<script defer src="/assets/assistant/widget.js?v=public-assistant-20261031"></script>\n'
    b'<!-- /MathExam public assistant -->\n'
)
REVIEWED_NOINDEX = {
    "school/index.html", "ege-baza/index.html", "ege-baza/algebra/index.html",
    "ege-baza/labs/index.html", "ege-baza/percent/index.html",
    "ege-baza/reasoning/index.html", "soviet-math/arithmetic-practice.html",
    "trainers/oge-basics/multiplication-division/division-diagnostic.html",
}
EXCLUDED = {
    "trainers/trainer-board.html", "trainers/group-board.html",
    "video-lessons/studio.html", "trainers/testing-hub.html",
    "trainers/logic-trainer/404.html",
}
DEFERRED = {
    "geometry-course/textbook/index.html": {
        "reason": "The exact shell is bound to the current textbook implementation reviews; a new valid review is required before changing it.",
        "evidence": "tools/geometry-textbook/build_course.py",
    },
    "stereo-course/textbook/index.html": {
        "reason": "The released textbook records this exact runtime as immutable; integration requires a separately reviewed change to that boundary.",
        "evidence": "tools/stereo-textbook/polyhedra-practical-content.test.cjs",
    },
}
EXISTING_HELPERS = {
    "school/peterson6/index.html": {
        "reason": "Published task-aware Peterson helper already owns this page; preserve one helper and its saved-work behavior.",
        "evidence": "trainers/peterson-assistant.js",
    },
    "trainers/maxim-peterson6/index.html": {
        "reason": "Published task-aware practice helper already owns this page; avoid a second launcher or competing explanations.",
        "evidence": "trainers/peterson-assistant.js",
    },
}
# Reviewed shells reached through JS-built links or retained public families.
# Empty speed-test.html and memory-fishing.html are not functioning trainers.
EXTRA_ENTRIES = {
    "trainers/multiplication-table/elevator-sprint.html":
        "learning/division-course-map.js",
    "ege-profil/atanasyan-10-11/lesson.html":
        "ege-profil/atanasyan-10-11/course.js",
    "trainers/ege-profile-stereometry-3d/index.html":
        "ege-profil/tests/links-test.js",
    "trainers/ege-profile-stereometry-3d/trainer.html":
        "trainers/ege-profile-stereometry-3d/index.html",
    "trainers/ege-baza/data-course/index.html": "ege-baza/course-definitions.js",
    "soviet-math/arithmetic-practice.html": "soviet-math/arithmetic-practice.js",
    "school/m9-exercises/index.html": "school/app.js",
    "trainers/ege-t2-vectors-trainer.html": "ege-profil/start/geometry-data.js",
    "trainers/ege-profile-task3-stereometry-catalog.html": "ege-profil/start/stereo-data.js",
    "trainers/oge-basics/multiplication-division/arithmetic-foundations.html":
        "trainers/oge-basics/multiplication-division/division-diagnostic-core.js",
}
IMPLICIT_HEAD = {"trainers/desyatichnye-drobi-level-1.html"}

spec = importlib.util.spec_from_file_location("public_sitemap", ROOT / "tools/build-sitemap.py")
seo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(seo)


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)


def tracked_html():
    return {p for p in git("ls-files", "-z").decode().split("\0") if p.endswith(".html")}


def local_file(href, base=ORIGIN + "/"):
    url = urlsplit(urljoin(base, href))
    if url.scheme + "://" + url.netloc != ORIGIN:
        return None
    path = unquote(url.path).lstrip("/")
    if "\\" in path or "\x00" in path or any(p in {".", ".."} for p in path.split("/")):
        raise ValueError("Unsafe public route")
    if not path or path.endswith("/"):
        path += "index.html"
    return path


def exclusion(path, raw, page):
    if path in DEFERRED:
        return "deferred pending implementation review"
    if path in EXISTING_HELPERS:
        return "existing task-aware helper"
    if (seo.excluded_path("/" + path)
            or any(p in Path(path).parts for p in ("src", "drafts", "assistant-service", "ggb"))
            or path in EXCLUDED
            or re.search(r"(?:^|/)yandex_[a-z0-9]+\.html$", path)
            or Path(path).name == "offline.html"):
        return "private/technical/archive/export"
    if not raw.strip() or (not re.search(r"</head\s*>", raw, re.I) and path not in IMPLICIT_HEAD):
        return "empty/incomplete shell"
    if page.refresh:
        return "redirect"
    if re.search(r"<body[^>]+\bdata-[a-z-]*board\s*=", raw, re.I):
        return "board shell"
    if "textbook-entry.js" in raw:
        return "managed textbook redirect"
    if page.noindex and path not in REVIEWED_NOINDEX:
        return "unreviewed noindex"
    return None


def inventory():
    tracked = tracked_html()
    sitemap_urls = [e.text for e in ET.parse(ROOT / "sitemap.xml").getroot().iter(
        "{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
    courses = json.loads((ROOT / "courses/catalog.json").read_text())
    downloads = json.loads((ROOT / "downloads/trainers-manifest.json").read_text())["trainers"]
    learning = json.loads(subprocess.check_output([
        "node", "-e", "process.stdout.write(JSON.stringify(require('./learning/catalog.js').items.map(x=>x.url)))"
    ], cwd=ROOT, text=True))
    seeds = sitemap_urls + [r["url"] for r in courses] + learning
    for row in downloads:
        if not row.get("public"):
            continue
        if row.get("sourceHtml"):
            seeds.append(row["sourceHtml"])
        if row.get("sourceDir"):
            seeds.extend("/" + p for p in tracked if p.startswith(row["sourceDir"].lstrip("/") + "/"))
    for path, evidence in EXTRA_ENTRIES.items():
        if path not in tracked or not (ROOT / evidence).is_file():
            raise ValueError("Reviewed JS entry/evidence is missing: " + path)
        seeds.append("/" + path)
    seen, accepted, excluded, missing = set(), set(), {}, set()
    pending = [urljoin(ORIGIN + "/", s) for s in seeds]
    while pending:
        url = pending.pop()
        path = local_file(url)
        if path is None or path in seen:
            continue
        seen.add(path)
        if path not in tracked:
            if path.endswith(".html"):
                missing.add(path)
            continue
        raw = (ROOT / path).read_text(errors="replace")
        page = seo.Page(raw)
        base = urljoin(ORIGIN + "/" + path, page.base or "")
        reason = exclusion(path, raw, page)
        if reason:
            excluded[path] = reason
            if reason == "redirect" and page.refresh_target:
                pending.append(urljoin(base, page.refresh_target))
            continue
        accepted.add(path)
        pending.extend(urljoin(base, href) for href in page.links)
    sitemap = {local_file(u) for u in sitemap_urls}
    retained = set(DEFERRED) | set(EXISTING_HELPERS)
    if sitemap - accepted != sitemap.intersection(retained):
        raise ValueError("Unaccounted public sitemap pages excluded: " + ", ".join(sorted(sitemap - accepted - retained)))
    if set(EXTRA_ENTRIES) - accepted:
        raise ValueError("Reviewed JS entries were excluded")
    if missing:
        raise ValueError("Missing public link targets: " + ", ".join(sorted(missing)))
    return {
        "schema": 1,
        "origin": ORIGIN,
        "sources": ["sitemap.xml", "courses/catalog.json", "downloads/trainers-manifest.json",
                    "learning/catalog.js", "same-origin HTML anchors", "reviewed JavaScript shells"],
        "reviewed_js_entries": EXTRA_ENTRIES,
        "deferred_pages": DEFERRED,
        "existing_helper_pages": EXISTING_HELPERS,
        "sitemap_existing_helper_pages": sorted(sitemap.intersection(EXISTING_HELPERS)),
        "sitemap_pages": len(sitemap),
        "sitemap_covered_pages": len(accepted.intersection(sitemap)),
        "additional_pages": len(accepted - sitemap),
        "pages": sorted(accepted),
    }, dict(Counter(excluded.values()))


def insert_block(raw, path):
    heads = list(re.finditer(rb"</head\s*>", raw, re.I))
    if not heads and path in IMPLICIT_HEAD:
        # Valid HTML can omit both head/body tags. Preserve that source and
        # defer the same scripts at its explicit closing html boundary.
        heads = list(re.finditer(rb"</html\s*>", raw, re.I))
    if len(heads) != 1:
        raise ValueError("Expected one closing head: " + path)
    pos = heads[0].start()
    # Keep existing inline whitespace after the block for exact source identity.
    while pos > 0 and raw[pos - 1:pos] in (b" ", b"\t"):
        pos -= 1
    return raw[:pos] + BLOCK + raw[pos:]


def validate_block(raw, path):
    if raw.count(BLOCK) != 1 or raw.count(MARKER) != 2:
        raise ValueError("Missing/duplicate exact helper block: " + path)
    original = raw.replace(BLOCK, b"", 1)
    if b"/assets/assistant/" in original:
        raise ValueError("Unexpected extra helper resource: " + path)
    if raw != insert_block(original, path):
        raise ValueError("Helper block moved outside its reviewed insertion boundary: " + path)
    return original


def apply(manifest):
    # Validate all pages before the first write; do not repair unexpected blocks.
    updates = []
    for path in set(DEFERRED) | set(EXISTING_HELPERS):
        f = ROOT / path
        raw = f.read_bytes()
        if BLOCK in raw:
            updates.append((f, validate_block(raw, path)))
    for path in manifest["pages"]:
        f = ROOT / path
        raw = f.read_bytes()
        if BLOCK in raw:
            raw = validate_block(raw, path)
        if MARKER in raw or b"/assets/assistant/" in raw:
            raise ValueError("Unexpected helper inclusion: " + path)
        updated = insert_block(raw, path)
        if updated != f.read_bytes():
            updates.append((f, updated))
    for f, raw in updates:
        f.write_bytes(raw)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    return len(updates)


def check(manifest):
    if json.loads(MANIFEST.read_text()) != manifest:
        raise ValueError("Coverage manifest drift; review inventory before --write")
    wanted = set(manifest["pages"])
    for path in tracked_html():
        raw = (ROOT / path).read_bytes()
        if path in wanted:
            validate_block(raw, path)
        elif MARKER in raw or b"/assets/assistant/" in raw:
            raise ValueError("Helper leaked into an excluded page: " + path)


def check_base(base):
    records = git("ls-tree", "-r", "-z", base).decode().split("\0")
    blobs = {}
    for record in records:
        if not record:
            continue
        meta, path = record.split("\t", 1)
        if path.endswith(".html"):
            blobs[path] = meta.split()[2]
    if set(blobs) != tracked_html():
        raise ValueError("HTML file set changed from the reviewed base")
    for path, expected in blobs.items():
        raw = (ROOT / path).read_bytes().replace(BLOCK, b"", 1)
        actual = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
        if actual != expected:
            raise ValueError("Existing HTML bytes changed beyond helper inclusion: " + path)
    print("Base-byte preservation: " + str(len(blobs)) + " HTML files")


def validate_scope_paths(changed, allowed):
    unexpected = set(changed) - set(allowed)
    if unexpected:
        raise ValueError("Out-of-task changed files: " + ", ".join(sorted(unexpected)))


def check_scope(base, manifest):
    scope = json.loads(SCOPE_MANIFEST.read_text())
    if scope.get("base_sha") != base or scope.get("task") != "MATHEXAM_PUBLIC_ASSISTANT_V1":
        raise ValueError("Task scope base must match the explicitly recorded preparation base")
    allowed = set(manifest["pages"]) | set(scope["allowed_non_html"])
    changed = {p for p in git("diff", "--name-only", "-z", base).decode().split("\0") if p}
    untracked = {p for p in git("ls-files", "--others", "--exclude-standard", "-z").decode().split("\0")
                 if p and "__pycache__" not in Path(p).parts}
    validate_scope_paths(changed | untracked, allowed)
    print("Current task scope: " + str(len(changed | untracked)) + " changed files accounted for")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true")
    mode.add_argument("--check", action="store_true")
    mode.add_argument("--inventory", action="store_true")
    parser.add_argument("--base")
    args = parser.parse_args()
    manifest, exclusions = inventory()
    if args.write:
        print("Updated inclusion blocks: " + str(apply(manifest)))
    if args.check or args.write:
        check(manifest)
    if args.base:
        check_base(args.base)
        check_scope(args.base, manifest)
    print(json.dumps({"pages": len(manifest["pages"]), "sitemap": manifest["sitemap_pages"],
                      "sitemap_covered": manifest["sitemap_covered_pages"], "deferred": len(DEFERRED),
                      "existing_helpers": len(EXISTING_HELPERS),
                      "additional": manifest["additional_pages"], "excluded_reached": exclusions}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print("PUBLIC_ASSISTANT_COVERAGE_FAILED: " + str(error), file=sys.stderr)
        raise SystemExit(1)
