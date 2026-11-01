#!/usr/bin/env python3
"""Build a new fixed OGE book edition without altering published namespaces.

The normal verification gate reads only frozen bytes. --check additionally
reproduces this candidate from its source inputs and is used before freezing.
New source revisions require a new edition after the old one reaches main.
"""
import argparse
from dataclasses import dataclass
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
from urllib.parse import urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = "https://mathexam.space"
DATA = ROOT / "scripts/oge-book-edition"
LEGACY_BASE = "139b944a70f2e8ba4d340d152d08807fad03e5da"
PUBLISHED_V1 = "4a90592077934d9a6d8a617b4afa50938798efb2"


@dataclass(frozen=True)
class Edition:
    version: str = "v1"
    source_base: str = LEGACY_BASE

    def __post_init__(self):
        if not re.fullmatch(r"v[1-9]\d*", self.version):
            raise ValueError("Version must be v followed by a positive integer")
        if not re.fullmatch(r"[0-9a-f]{40}", self.source_base):
            raise ValueError("Source base must be a full lowercase commit SHA")

    @property
    def prefix(self):
        return "book/oge/2026-10-31/" + self.version + "/"

    @property
    def alias(self):
        return "b/oge26-" + self.version[1:] + "/"

    @property
    def name(self):
        return "oge-2026-10-31-" + self.version

TEXT = {".html", ".js", ".css", ".json", ".svg"}
REMOVED = {
    "assets/lesson-funnel.js", "assets/download-panel.css",
    "ege-baza/return-to-course.js", "learning/practice-entry.js",
    "trainers/learning-bridge.js",
    "trainers/task19-board-session.js", "trainers/oge-geometry-board-mode.js",
    "trainers/oge-geometry-board.js",
}
NODE_ONLY = {"trainers/p2_core.js", "trainers/p3_families.js"}
STATIC_REF = re.compile(r'''["']([^"'\s<>`]+\.(?:js|css|json|png|jpg|jpeg|webp|gif|svg|woff2?)(?:[?#][^"'\s<>`]*)?)["']''')
ATTR = re.compile(r'''\b(href|src|poster|action)\s*=\s*(["'])(.*?)\2''', re.I | re.S)
SCRIPT = re.compile(r"<script\b[^>]*>.*?</script\s*>", re.I | re.S)
LINK = re.compile(r"<link\b[^>]*>", re.I)
ROOT_REF = re.compile(r'''(["'`])((?:https://mathexam\.space)?/(?:trainers|assets|oge|ege-baza|learning|courses|school|topics|foundations|downloads|lessons)(?:/[^"'`\s<>]*)?)(?=\1)''')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def encoded(data):
    return (json.dumps(data, ensure_ascii=False, indent=2) + "\n").encode()


def file_path(path):
    return path.lstrip("/") + ("index.html" if path.endswith("/") else "")


def resolve(source, reference):
    return urlsplit(urljoin(PUBLIC + "/" + source, html.unescape(reference)))


def local_path(source, reference):
    target = resolve(source, reference)
    if target.netloc != "mathexam.space" or target.scheme != "https":
        return None
    return file_path(target.path)


def sanitize(source, text, edition):
    # External font services are decoration, not a learning dependency. Existing
    # system font fallbacks remain in each stylesheet.
    def script(match):
        tag = match.group()
        attrs = dict((m[0].lower(), m[2]) for m in ATTR.findall(tag.split(">", 1)[0]))
        if "src" in attrs and local_path(source, attrs["src"]) in REMOVED:
            return ""
        if "src" in attrs and local_path(source, attrs["src"]) == "trainers/board-bridge.js" and source != "trainers/oge-1-5-trainers/practice-1-5-roads-grid.html":
            return ""
        return tag
    text = SCRIPT.sub(script, text)
    def link(match):
        tag = match.group()
        attrs = dict((m[0].lower(), m[2]) for m in ATTR.findall(tag))
        href = attrs.get("href", "")
        if "fonts.googleapis.com" in href or "fonts.gstatic.com" in href:
            return ""
        if local_path(source, href) in REMOVED:
            return ""
        return tag
    text = LINK.sub(link, text)
    text = re.sub(r"<!-- download-panel:start:[\s\S]*?<!-- download-panel:end:[\s\S]*?-->", "", text)
    if source == "trainers/oge-basics/learning-loader.js":
        marker = "document.documentElement.classList.add('learning-remediation-mode');"
        if marker not in text:
            raise ValueError("Standalone loader boundary changed; review before packaging")
        text = text.split(marker, 1)[0] + "})();\n"
        text, count = re.subn(r"const managed=new URLSearchParams\(location.search\).get\('learning'\)==='1';", "const managed=false; // Fixed book copies use independent local practice.", text)
        if count != 1:
            raise ValueError("Managed-loader declaration changed")
    if source == "trainers/board-bridge.js":
        guard = "if (!global.parent || global.parent === global) {"
        if text.count(guard) != 1:
            raise ValueError("Bridge standalone boundary changed")
        text = text.replace(guard, "if (true) { // Fixed book practice retains validation but never joins a board.")
    if source == "trainers/task19-textbook-reference.js":
        # Keep the existing narrow image allowlist, rooted at the copied assets.
        old = r"^\/trainers\/task19-"
        if text.count(old) != 1:
            raise ValueError("Textbook excerpt allowlist changed")
        text = text.replace(old, "^\\/" + edition.prefix.replace("/", "\\/") + r"trainers\/task19-")
    if source == "trainers/oge-task13-inequalities.html":
        old = "window.location.replace('/trainers/oge13-inequalities-series.html');"
        if text.count(old) != 1:
            raise ValueError("Task-13 redirect changed; review its effective destination")
        text = text.replace(old, "const destination=new URL('/trainers/oge13-inequalities-series.html',location.origin);destination.search=location.search;destination.hash=location.hash;location.replace(destination.href);")
    if source == "trainers/oge-1-5-trainers/practice-1-5-roads-grid.html":
        old = "const IS_STANDALONE=window.parent===window;"
        if text.count(old) != 1:
            raise ValueError("Roads-grid standalone storage boundary changed")
        text = text.replace(old, "const IS_STANDALONE=true; // Fixed book results stay local, also in an embedded reader.")
    return text


class Resources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []
        self.canonical = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in {"script", "img", "iframe", "source", "audio", "video", "embed"} and attrs.get("src"):
            self.references.append(attrs["src"])
        if tag == "link" and attrs.get("rel", "").lower() in {"stylesheet", "icon", "preload", "modulepreload"} and attrs.get("href"):
            self.references.append(attrs["href"])
        if tag == "link" and attrs.get("rel", "").lower() == "canonical":
            self.canonical = attrs.get("href")


def collect(rows, edition):
    # A real redirect is part of the entry contract, not a mere outgoing link.
    seeds = {file_path(urlsplit(row["sourceUrl"]).path) for row in rows}
    seeds.add("trainers/oge13-inequalities-series.html")
    # FIPI pages are chosen by a numeric expression at runtime; include their
    # published local source PDF and every referenced crop as a bounded closure.
    for folder in ["trainers/task19-reference", "trainers/task19-textbook", "trainers/oge-course-reference"]:
        for path in (ROOT / folder).iterdir():
            if path.suffix in {".png", ".jpg", ".svg", ".pdf"}:
                seeds.add(path.relative_to(ROOT).as_posix())
    queue, files, dependencies = list(sorted(seeds)), {}, {}
    while queue:
        source = queue.pop()
        if source in files or source in REMOVED:
            continue
        path = ROOT / source
        if not path.is_file():
            raise ValueError("Missing source dependency: " + source)
        raw = path.read_bytes()
        text = sanitize(source, raw.decode(), edition) if path.suffix in TEXT else None
        refs = set(STATIC_REF.findall(text or ""))
        resources = Resources()
        if path.suffix == ".html":
            resources.feed(text)
            refs.update(resources.references)
        refs.update(re.findall(r"url\(\s*['\"]?([^'\")\s]+)", text or ""))
        found = []
        for ref in sorted(refs):
            if ref.startswith(("data:", "#", "blob:")) or "${" in ref:
                continue
            target = resolve(source, ref)
            candidate = local_path(source, ref)
            if candidate in REMOVED:
                raise ValueError(f"Removed integration is still referenced: {source}: {ref}")
            if candidate in NODE_ONLY:
                continue  # Existing typeof module !== 'undefined' test-only branch.
            if candidate is None:
                if ref in resources.references or re.search(r"url\(\s*['\"]?" + re.escape(ref), text or ""):
                    raise ValueError(f"Unpinned remote runtime/resource: {source}: {ref}")
                continue  # An explicitly outbound instructional hyperlink.
            if not (ROOT / candidate).is_file():
                raise ValueError(f"Unresolved dependency: {source}: {ref}")
            queue.append(candidate)
            found.append(candidate)
        files[source] = {"raw": raw, "text": text, "canonical": resources.canonical}
        dependencies[source] = sorted(set(found))
    return files, dependencies


def rewrite(source, text, paths, edition):
    canonical = re.search(r'<link\b(?=[^>]*\brel=["\']canonical["\'])[^>]*>', text, re.I)
    canonical_attrs = dict((name.lower(), value) for name, _, value in ATTR.findall(canonical[0])) if canonical else {}
    original_canonical = canonical_attrs.get("href", PUBLIC + "/" + source.removesuffix("index.html"))
    def target(reference, resource=False):
        if reference.startswith(("#", "data:", "blob:", "javascript:", "mailto:", "tel:")) or "${" in reference or re.search(r"['\"]\s*\+|\+\s*['\"]", reference):
            return reference
        url = resolve(source, reference)
        if url.netloc != "mathexam.space" or url.scheme != "https":
            return reference
        file = file_path(url.path)
        suffix = ("?" + url.query if url.query else "") + ("#" + url.fragment if url.fragment else "")
        if file in paths:
            return "/" + edition.prefix + url.path.lstrip("/") + suffix
        if resource:
            raise ValueError(f"Resource outside closure: {source}: {reference}")
        return PUBLIC + url.path + suffix

    # HTML attributes also occur in string templates and keep the same document
    # resolution. Dynamic hrefs are handled by the narrow startup adapter.
    if source.endswith(".html"):
        def attr(match):
            name, quote, value = match.groups()
            return name + "=" + quote + target(value, name.lower() in {"src", "poster"}) + quote
        text = re.sub(r"<[A-Za-z][^<>]*>", lambda tag: ATTR.sub(attr, tag[0]), text)
        # Existing noindex is preserved; adding noindex avoids duplicate search
        # entries while all established public canonicals remain untouched.
        text = re.sub(r"<meta\b[^>]*\bname=[\"']robots[\"'][^>]*>", "", text, flags=re.I)
        head = ('\n<meta name="robots" content="noindex,follow">\n'
                '<meta name="referrer" content="strict-origin-when-cross-origin">\n'
                '<meta http-equiv="Content-Security-Policy" content="default-src \'self\' data: blob:; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob:; font-src \'self\'; connect-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\'">\n'
                '<link rel="stylesheet" href="/' + edition.prefix + 'edition-assets/edition.css">\n'
                '<script src="/' + edition.prefix + 'edition-assets/bootstrap.js"></script>\n')
        if not re.search(r"<head\b[^>]*>", text, re.I):
            raise ValueError("Expected HTML head: " + source)
        text = re.sub(r"<head\b[^>]*>", lambda m: m[0] + head, text, count=1, flags=re.I)
        # Keep charset detection before any long source text.
        text = re.sub(r"(<head\b[^>]*>)", r'\1<meta charset="utf-8">', text, count=1, flags=re.I)

    def absolute(match):
        quote, ref = match.groups()
        if ref.startswith("/" + edition.prefix):
            return match[0]
        url = urlsplit(ref if ref.startswith("http") else PUBLIC + ref)
        pathname = url.path
        # Prefix literals used for computed image filenames need the same
        # transformation as full references. Other navigation remains public.
        included = file_path(pathname) in paths or any(("/" + p).startswith(pathname) for p in paths)
        result = ((PUBLIC if ref.startswith("https:") else "") + "/" + edition.prefix + pathname.lstrip("/")) if included else PUBLIC + pathname
        result += ("?" + url.query if url.query else "") + ("#" + url.fragment if url.fragment else "")
        return quote + result
    text = ROOT_REF.sub(absolute, text)
    if source.endswith(".html"):
        text = re.sub(r'<link\b(?=[^>]*\brel=["\']canonical["\'])[^>]*>', lambda tag: ATTR.sub(lambda a: a[1] + "=" + a[2] + (original_canonical if a[1].lower() == "href" else a[3]) + a[2], tag[0]), text, flags=re.I)
    # Generic home links inside inline templates return to this edition.
    text = re.sub(r'''(href\s*=\s*["'])/(#[^"']*)?(["'])''', lambda m: m[1] + "/" + edition.prefix + (m[2] or "") + m[3], text)
    # Removed optional tags leave indented blank lines. The only remaining
    # source trailing spaces are after JS statements, outside string literals.
    # Normalize these mechanical copies so the full added-file diff is clean.
    return re.sub(r"[ \t]+(?=\r?$)", "", text, flags=re.M)


def alias_page(row, edition):
    destination = urlsplit(row["frozenUrl"]).path
    dest_json = json.dumps(destination)
    return (f'<!doctype html><html lang="ru"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<meta name="robots" content="noindex,follow"><title>Книжный тренажёр {row["id"]} · MathExam</title>'
            f'<link rel="canonical" href="{row["frozenUrl"]}">'
            f'<script>const target=new URL({dest_json},location.origin);target.search=location.search;target.hash=location.hash;location.replace(target.href);</script>'
            f'<noscript><meta http-equiv="refresh" content="0;url={destination}"></noscript>'
            f'</head><body><p><a href="{destination}">Открыть книжный тренажёр {row["id"]}</a></p>'
            f'<p>Редакция 31.10.2026 · {edition.version}. Для упражнений нужен JavaScript.</p></body></html>\n').encode()


def edition_rows(edition):
    rows = json.loads((DATA / "urls.json").read_text())
    if (len(rows) != 71 or len({r["sourceUrl"] for r in rows}) != 71
            or [r["id"] for r in rows] != [f"{n:02}" for n in range(1, 72)]):
        raise ValueError("Expected the exact 71-source book inventory")
    result = []
    for row in rows:
        source = urlsplit(row["sourceUrl"])
        if source.scheme + "://" + source.netloc != PUBLIC or source.query or source.fragment:
            raise ValueError("Unexpected source URL in book inventory")
        result.append({**row, "bookUrl": PUBLIC + "/" + edition.alias + row["id"] + "/",
                       "frozenUrl": PUBLIC + "/" + edition.prefix + source.path.lstrip("/")})
    return result


def build(edition=Edition()):
    rows = edition_rows(edition)
    files, dependencies = collect(rows, edition)
    paths = set(files)
    output = {}
    for source, info in files.items():
        output[edition.prefix + source] = rewrite(source, info["text"], paths, edition).encode() if info["text"] is not None else info["raw"]
    config = {"edition": edition.name, "version": edition.version, "path": "/" + edition.prefix, "aliasPath": "/" + edition.alias,
              "publicOrigin": PUBLIC, "paths": ["/" + p for p in sorted(paths)] + ["/manifest.json", "/url-map.json"]}
    output[edition.prefix + "edition-assets/bootstrap.js"] = (DATA / "bootstrap.js").read_text().replace("__BOOK_CONFIG__", json.dumps(config, ensure_ascii=False, separators=(",", ":"))).encode()
    output[edition.prefix + "edition-assets/edition.css"] = (DATA / "edition.css").read_bytes()
    output[edition.prefix + "url-map.json"] = encoded(rows)
    for row in rows:
        output[edition.alias + row["id"] + "/index.html"] = alias_page(row, edition)
    manifest = {
        "schema": 1, "edition": edition.name, "preparedAs": "candidate in accepted fixed-edition architecture; separate merge and deployment approval required",
        "sourceBase": edition.source_base, "publicOrigin": PUBLIC, "prefix": edition.prefix, "aliasPrefix": edition.alias,
        "entries": rows, "storageNamespace": "mathExamBook:" + edition.name + ":",
        "removedOptionalIntegrations": sorted(REMOVED), "externalFonts": "system fallbacks; no remote font requests",
        "retainedLocalBoundary": "Roads-grid requires the original state validator; its copied board register is always inert, including inside an iframe.",
        "redirectContract": "Short aliases and the task-13 legacy redirect preserve the complete query and fragment; the original public redirect is unchanged.",
        "sourceFiles": [{"path": p, "sha256": sha(info["raw"]), "dependencies": dependencies[p], **({"canonical": info["canonical"]} if info["canonical"] else {})} for p, info in sorted(files.items())],
        "generatorInputs": [{"path": p.relative_to(ROOT).as_posix(), "sha256": sha(p.read_bytes())} for p in [Path(__file__), DATA / "urls.json", DATA / "bootstrap.js", DATA / "edition.css"]],
        "files": [{"path": p, "bytes": len(data), "sha256": sha(data)} for p, data in sorted(output.items())],
        "verificationLimit": "Hashes and closure do not establish learner completion; see the separate per-page audit registry."
    }
    output[edition.prefix + "manifest.json"] = encoded(manifest)
    return output, manifest


def ensure_writable(edition, base, root=ROOT):
    """A stale tracking ref must never allow rewriting published v1 bytes."""
    if not base or not re.fullmatch(r"[0-9a-f]{40}", base):
        raise ValueError("Writing requires an explicit full --base commit SHA")
    # This publication anchor is part of the supported edition history. A base
    # preceding it cannot authorize writes, even when origin/main is stale.
    ancestry = subprocess.run(["git", "merge-base", "--is-ancestor", PUBLISHED_V1, base],
                              cwd=root, capture_output=True)
    if ancestry.returncode != 0:
        raise ValueError("Write base must include the published-v1 anchor " + PUBLISHED_V1)
    for ref in [base, "origin/main"]:
        frozen = subprocess.run(["git", "ls-tree", "-r", "--name-only", ref, "--",
                                 edition.prefix, edition.alias], cwd=root,
                                capture_output=True, text=True, check=True)
        if frozen.stdout.strip():
            raise ValueError("Edition exists on " + ref + "; create a new version instead of rewriting it")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--version", default="v1", help="New version, e.g. v2; published versions cannot be rewritten")
    parser.add_argument("--base", help="Explicit approved base SHA; required for writing")
    parser.add_argument("--check", action="store_true", help="Compare deterministic generated bytes without writing")
    args = parser.parse_args()
    try:
        edition = Edition(args.version, args.base or (LEGACY_BASE if args.version == "v1" else PUBLISHED_V1))
        if not args.check:
            ensure_writable(edition, args.base)
        output, manifest = build(edition)
        actual = {p.relative_to(ROOT).as_posix() for folder in [edition.prefix, edition.alias]
                  for p in (ROOT / folder).rglob("*") if p.is_file()}
        extra = actual - set(output)
        if extra:
            raise ValueError("Unexpected files in edition; review explicitly: " + repr(sorted(extra)))
        if args.check:
            mismatch = [p for p, value in output.items() if not (ROOT / p).is_file() or (ROOT / p).read_bytes() != value]
            if mismatch:
                raise ValueError("Candidate differs from current sources: " + repr(mismatch))
        else:
            for name, data in output.items():
                path = ROOT / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(data)
    except (ValueError, subprocess.CalledProcessError) as error:
        raise SystemExit(str(error)) from error
    print(json.dumps({"edition": edition.name, "entries": len(manifest["entries"]),
                      "sources": len(manifest["sourceFiles"]), "files": len(output),
                      "bytes": sum(map(len, output.values())), "mode": "checked" if args.check else "built"}))


if __name__ == "__main__":
    main()
