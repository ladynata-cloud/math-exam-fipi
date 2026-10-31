#!/usr/bin/env python3
"""Independently verify frozen bytes and reject edits to published namespaces."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import urljoin, urlsplit


class InvalidEdition(ValueError):
    pass


def require(condition, reason):
    if not condition:
        raise InvalidEdition(reason)


def git(root, *args):
    return subprocess.check_output(["git", *args], cwd=root)


class HTMLResources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.resources, self.scripts, self.csp = [], [], None
        self.robots, self.canonical = None, None
        self.base = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "base":
            self.base = True
        if tag == "script":
            self.scripts.append(a.get("src"))
        if tag in {"script", "img", "iframe", "source", "audio", "video", "embed"} and a.get("src"):
            self.resources.append(a["src"])
        if tag == "link" and a.get("rel", "").lower() in {"stylesheet", "icon", "preload", "modulepreload"} and a.get("href"):
            self.resources.append(a["href"])
        if tag == "meta" and a.get("http-equiv", "").lower() == "content-security-policy":
            self.csp = a.get("content", "")
        if tag == "meta" and a.get("name", "").lower() == "robots":
            self.robots = a.get("content", "")
        if tag == "link" and a.get("rel", "").lower() == "canonical":
            self.canonical = a.get("href", "")


def relative_file(path):
    return path.lstrip("/") + ("index.html" if path.endswith("/") else "")


def require_pages_path(name):
    """Keep every package component publishable by default GitHub Pages/Jekyll.

    This package must not rely on global include/nojekyll exceptions. Reject
    the documented hidden-name patterns and dependency directories anywhere
    in its own namespace, including inside otherwise ordinary directories.
    https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll
    """
    hidden = [part for part in Path(name).parts
              if part.startswith(("_", ".", "#")) or part.endswith("~")
              or part in {"node_modules", "vendor"}]
    require(not hidden, "Jekyll-hidden package path: " + name)


def inspect(root, manifest_path):
    manifest = json.loads((root / manifest_path).read_text())
    prefix, alias = manifest["prefix"], manifest["aliasPrefix"]
    require(re.fullmatch(r"book/[a-z0-9-]+/\d{4}-\d{2}-\d{2}/v[1-9]\d*/", prefix), "Invalid fixed prefix")
    require(re.fullmatch(r"b/[a-z0-9-]+/", alias), "Invalid fixed alias prefix")
    require(manifest_path == prefix + "manifest.json", "Manifest location differs from its frozen namespace")
    files = manifest["files"]
    require(len({f["path"] for f in files}) == len(files), "Duplicate output path")
    expected = {f["path"] for f in files} | {manifest_path}
    for name in sorted(expected):
        require_pages_path(name)
    actual = {p.relative_to(root).as_posix() for d in [prefix, alias] for p in (root / d).rglob("*") if p.is_file()}
    require(actual == expected, "Missing or extra edition file: " + repr(sorted(actual ^ expected)))
    for record in files:
        name = record["path"]
        require(name.startswith((prefix, alias)) and ".." not in Path(name).parts, "Output escaped namespace")
        path = root / name
        require(not path.is_symlink(), "Frozen file cannot be a symlink: " + name)
        data = path.read_bytes()
        require(len(data) == record["bytes"], "Size mismatch: " + name)
        require(hashlib.sha256(data).hexdigest() == record["sha256"], "Hash mismatch: " + name)
    source_paths = {r["path"] for r in manifest["sourceFiles"]}
    source_canonicals = {r["path"]: r.get("canonical") for r in manifest["sourceFiles"]}
    for source in manifest["sourceFiles"]:
        require(source["path"] not in manifest["removedOptionalIntegrations"], "Removed integration was packaged")
        for dep in source["dependencies"]:
            require(dep in source_paths, "Dependency absent from frozen closure: " + dep)
    origin = manifest["publicOrigin"]
    for name in sorted(expected):
        if not name.endswith(".html"):
            continue
        text = (root / name).read_text()
        parser = HTMLResources()
        parser.feed(text)
        require(not parser.base, "A base tag could escape the frozen dependency namespace")
        require(parser.robots and "noindex" in parser.robots.lower(), "Book copies must remain outside search indexing: " + name)
        if name.startswith(prefix):
            require(parser.scripts and parser.scripts[0] == "/" + prefix + "edition-assets/bootstrap.js", "Storage boundary must run before source scripts: " + name)
            require(parser.csp and "connect-src 'none'" in parser.csp and "font-src 'self'" in parser.csp, "Missing fixed-edition network policy: " + name)
            require(parser.canonical and parser.canonical.startswith(origin + "/") and not parser.canonical.startswith(origin + "/" + prefix), "Original public canonical must be retained: " + name)
            require(parser.canonical == source_canonicals.get(name[len(prefix):]), "Canonical differs from recorded source: " + name)
        for ref in parser.resources:
            if ref.startswith(("data:", "blob:")):
                continue
            url = urlsplit(urljoin(origin + "/" + name, ref))
            require(url.scheme == "https" and origin == url.scheme + "://" + url.netloc, "Remote runtime resource: " + ref)
            target = relative_file(url.path)
            require(target.startswith(prefix) and target in expected, "Mutable or missing resource: " + name + " -> " + target)
    rows = manifest["entries"]
    require(len(rows) == len({r["sourceUrl"] for r in rows}) == len({r["bookUrl"] for r in rows}), "Duplicate entry URL")
    require(json.loads((root / prefix / "url-map.json").read_text()) == rows, "URL mapping differs from manifest")
    for row in rows:
        require(row["sourceUrl"].startswith(origin + "/"), "Unexpected source origin")
        frozen = row["frozenUrl"].removeprefix(origin + "/")
        target = relative_file("/" + frozen)
        require(target in expected and target.startswith(prefix), "Entry has no frozen target")
        alias_file = relative_file(urlsplit(row["bookUrl"]).path)
        require(alias_file.startswith(alias) and alias_file in expected, "Entry has no immutable short alias")
        alias_text = (root / alias_file).read_text()
        require("new URL(" + json.dumps("/" + frozen) + ",location.origin)" in alias_text, "Alias points at a different target")
        require("target.search=location.search;target.hash=location.hash;" in alias_text, "Alias drops query or fragment")
    require(manifest["storageNamespace"] == "mathExamBook:" + manifest["edition"] + ":", "Unexpected storage namespace")
    return {"edition": manifest["edition"], "entries": len(rows), "files": len(expected), "sourceFiles": len(source_paths)}


def append_only(root, base):
    """Use old manifest paths read from Git, never the proposed manifest."""
    baseline = git(root, "ls-tree", "-r", "--name-only", base, "--", "book/").decode().splitlines()
    old_manifests = [p for p in baseline if re.fullmatch(r"book/[^/]+/\d{4}-\d{2}-\d{2}/v\d+/manifest\.json", p)]
    for name in old_manifests:
        original = json.loads(git(root, "show", base + ":" + name))
        prefixes = [original["prefix"], original["aliasPrefix"]]
        old = git(root, "ls-tree", "-r", base, "--", *prefixes).decode().splitlines()
        old_names = set()
        for line in old:
            meta, file = line.split("\t", 1)
            mode, kind, blob = meta.split()
            old_names.add(file)
            path = root / file
            require(kind == "blob" and mode == "100644" and path.is_file() and not path.is_symlink(), "Frozen file removed or changed type: " + file)
            current = git(root, "hash-object", "--", str(path)).decode().strip()
            require(blob == current, "Append-only violation: frozen bytes changed: " + file)
        actual = {p.relative_to(root).as_posix() for d in prefixes for p in (root / d).rglob("*") if p.is_file()}
        require(actual == old_names, "Append-only violation: files added/deleted in existing edition: " + repr(sorted(actual ^ old_names)))
    return len(old_manifests)


def verify(root, base=None):
    old = append_only(root, base) if base else None
    manifests = sorted(p.relative_to(root).as_posix() for p in (root / "book").glob("*/*/v*/manifest.json"))
    require(bool(manifests), "No fixed edition manifest found")
    results = [inspect(root, name) for name in manifests]
    listed = set()
    for name in manifests:
        manifest = json.loads((root / name).read_text())
        files = {r["path"] for r in manifest["files"]} | {name}
        require(not listed.intersection(files), "Two manifests claim the same frozen file")
        listed.update(files)
    actual = {p.relative_to(root).as_posix() for d in ["book", "b"] for p in (root / d).rglob("*") if p.is_file()}
    require(actual == listed, "Unregistered file in fixed-book roots: " + repr(sorted(actual ^ listed)))
    return {"gate": "BOOK_EDITION_INTEGRITY_OK", "editions": results, "protectedBaseEditions": old}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--base", help="Authoritative PR base commit for append-only protection")
    args = parser.parse_args()
    print(json.dumps(verify(args.root.resolve(), args.base), ensure_ascii=False))


if __name__ == "__main__":
    main()
