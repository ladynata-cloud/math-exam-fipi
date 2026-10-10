#!/usr/bin/env python3
"""Build the public sitemap without crawling every HTML file in the repository.

Run from any directory:
    python3 tools/build-sitemap.py
    python3 tools/build-sitemap.py --check
    python3 tools/build-sitemap.py --check --verbose

The reviewed seeds and permitted linked sections are in seo-public-pages.json.
Add a new public hub there; never add private/account or source/fixture folders.
Missing seed files fail the build before sitemap.xml is written. Only ordinary
HTML links inside permitted sections are followed; query and fragment routes
are not separate sitemap entries. Existing noindex, canonical and meta-refresh
signals take precedence. Explicit self-canonicals are preserved, including an
explicit index.html; otherwise directory indexes use the trailing-slash URL.

No lastmod dates are inferred from checkout times, shallow Git history or this
generator's execution. Add dates only after a reliable per-page source exists.
The --root option is for the temporary-site regression tests.
"""

import argparse
from collections import Counter, deque
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
import sys
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET


ORIGIN = "https://mathexam.space"
NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
ROOT = Path(__file__).resolve().parents[1]
MANIFEST = "tools/seo-public-pages.json"
BLOCKED_COMPONENTS = {
    "admin", "account", "accounts", "assets", "archive", "archives", "data",
    "deploy", "dev", "docs", "downloads", "fixtures", "learning", "nginx",
    "node_modules", "private", "scripts", "source", "sources", "tests", "tools",
    "utils", "video-worker", "board-server",
}
BLOCKED_NAME = re.compile(
    r"(?:^|[-_.])(admin|account|accounts|archive|backup|fixture|fixtures|invite|"
    r"login|logout|old|parent|preview|private|source|sources|student|teacher)"
    r"(?:[-_.]|$)|(?:^test[-_.])|(?:\.test\.html$)", re.I
)


class SitemapError(ValueError):
    pass


class Page(HTMLParser):
    """Read static indexing signals and actual anchor links, not script strings."""

    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.links = []
        self.canonicals = []
        self.noindex = False
        self.refresh = False
        self.refresh_target = None
        self.base = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = {key.lower(): value or "" for key, value in attrs}
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])
        elif tag == "base" and attrs.get("href") and self.base is None:
            self.base = attrs["href"]
        elif tag == "link" and "canonical" in attrs.get("rel", "").lower().split():
            if not attrs.get("href"):
                raise SitemapError("Canonical link has no href")
            self.canonicals.append(attrs["href"])
        elif tag == "meta":
            name = attrs.get("name", "").strip().lower()
            directives = re.split(r"[\s,]+", attrs.get("content", "").lower())
            if name in {"robots", "googlebot", "yandex"}:
                self.noindex |= bool({"noindex", "none"}.intersection(directives))
            if attrs.get("http-equiv", "").strip().lower() == "refresh":
                self.refresh = True
                target = re.search(r"(?:^|;)\s*url\s*=\s*(.*)", attrs.get("content", ""), re.I)
                if target:
                    self.refresh_target = target.group(1).strip().strip("\"'")


def local_path(href, base=ORIGIN + "/"):
    """Return a clean same-origin HTML route, or None for non-page links."""
    url = urlsplit(urljoin(base, href.strip()))
    if (url.scheme + "://" + url.netloc != ORIGIN
            or url.query or url.fragment):
        return None
    path = url.path or "/"
    decoded = unquote(path)
    if ("\\" in decoded or "\x00" in decoded or "//" in decoded
            or any(part in {".", ".."} for part in decoded.split("/"))):
        raise SitemapError("Unsafe URL path: " + path)
    if not (path.endswith("/") or path.endswith(".html") or "." not in PurePosixPath(path).name):
        return None
    return path


def excluded_path(path):
    parts = PurePosixPath(unquote(path)).parts[1:]
    return any(
        part.startswith((".", "_")) or part.lower() in BLOCKED_COMPONENTS
        or BLOCKED_NAME.search(part)
        for part in parts
    )


class Builder:
    def __init__(self, root):
        self.root = root.resolve()
        config = json.loads((self.root / MANIFEST).read_text(encoding="utf-8"))
        self.seeds = set(config["seed_paths"])
        self.prefixes = tuple(config["follow_prefixes"])
        if not self.seeds or len(self.seeds) != len(config["seed_paths"]):
            raise SitemapError("The seed list must be nonempty and unique")
        for path in self.seeds:
            if local_path(path) != path or not path.startswith("/"):
                raise SitemapError("Seed must be a same-origin path without query/fragment: " + path)
            if excluded_path(path):
                raise SitemapError("Seed is in an excluded private/technical location: " + path)
        for prefix in self.prefixes:
            if (local_path(prefix) != prefix or prefix == "/"
                    or not prefix.startswith("/") or not prefix.endswith("/")
                    or excluded_path(prefix)):
                raise SitemapError("Unsafe linked-section prefix: " + prefix)
        self.pages = {}
        self.skipped = {}

    def file_for(self, path):
        file = self.root / unquote(path).lstrip("/")
        if path.endswith("/") or file.is_dir():
            file /= "index.html"
        file = file.resolve()
        if not file.is_relative_to(self.root) or file.suffix != ".html" or not file.is_file():
            raise SitemapError("URL has no local HTML file: " + path)
        return file

    def read_page(self, file):
        if file not in self.pages:
            self.pages[file] = Page(file.read_text(encoding="utf-8"))
        return self.pages[file]

    def permitted(self, path):
        return not excluded_path(path) and (
            path in self.seeds or path.startswith(self.prefixes)
            or (path.endswith("/index.html") and path[:-10] in self.seeds)
        )

    def canonical(self, page, path, file):
        base = urljoin(ORIGIN + path, page.base or "")
        canonicals = {urljoin(base, href) for href in page.canonicals}
        if len(canonicals) > 1:
            raise SitemapError("Conflicting canonical links: " + path)
        if canonicals:
            target = local_path(canonicals.pop())
            return target, self.file_for(target) if target else None
        # Use directory URLs only in the absence of a different explicit signal.
        relative = "/" + file.relative_to(self.root).as_posix()
        return (relative[:-10] if relative.endswith("/index.html") else relative), file

    def build(self):
        # Validate all reviewed seeds, even if one later becomes noindex.
        for path in sorted(self.seeds):
            self.file_for(path)
        pending = deque(sorted(self.seeds))
        seen = set()
        result = set()
        while pending:
            path = pending.popleft()
            if path in seen:
                continue
            seen.add(path)
            file = self.file_for(path)
            page = self.read_page(file)
            base = urljoin(ORIGIN + path, page.base or "")
            if page.noindex:
                self.skipped[path] = "noindex"
                continue
            if page.refresh:
                self.skipped[path] = "redirect"
                target = local_path(page.refresh_target, base) if page.refresh_target else None
                if target and self.permitted(target):
                    pending.append(target)
                continue
            canonical, target_file = self.canonical(page, path, file)
            if canonical is None:
                self.skipped[path] = "external or parameterized canonical"
                continue
            if excluded_path(canonical):
                self.skipped[path] = "excluded canonical target"
                continue
            if target_file != file:
                self.skipped[path] = "canonical alternative"
                if self.permitted(canonical):
                    pending.append(canonical)
                continue
            result.add(ORIGIN + canonical)
            for href in page.links:
                target = local_path(href, base)
                if target and self.permitted(target):
                    pending.append(target)
        return sorted(result)


def render(urls):
    ET.register_namespace("", NS)
    root = ET.Element("{" + NS + "}urlset")
    for url in urls:
        item = ET.SubElement(root, "{" + NS + "}url")
        ET.SubElement(item, "{" + NS + "}loc").text = url
    ET.indent(root, space="  ")
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding="unicode") + "\n"


def check_sitemap(file, expected, urls, builder):
    if not file.exists():
        raise SitemapError("sitemap.xml is missing; run python3 tools/build-sitemap.py")
    actual = file.read_text(encoding="utf-8")
    tree = ET.fromstring(actual)
    if tree.tag != "{" + NS + "}urlset":
        raise SitemapError("sitemap.xml has the wrong root/namespace")
    listed = [item.text for item in tree.iter("{" + NS + "}loc")]
    if len(listed) != len(set(listed)):
        raise SitemapError("sitemap.xml contains duplicate URLs")
    for url in listed:
        if not url or not url.startswith(ORIGIN + "/"):
            raise SitemapError("sitemap.xml contains a foreign or empty URL")
        path = local_path(url)
        if path is None or excluded_path(path):
            raise SitemapError("sitemap.xml contains an excluded URL: " + url)
        file_for_url = builder.file_for(path)
        page = builder.read_page(file_for_url)
        canonical, target_file = builder.canonical(page, path, file_for_url)
        if page.noindex or page.refresh or target_file != file_for_url or ORIGIN + (canonical or "") != url:
            raise SitemapError("sitemap.xml contains a non-indexable/non-canonical URL: " + url)
    if actual != expected:
        added, removed = set(urls) - set(listed), set(listed) - set(urls)
        raise SitemapError(
            f"sitemap.xml is stale (+{len(added)}, -{len(removed)} URLs or formatting); "
            "run python3 tools/build-sitemap.py"
        )


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true", help="validate pages and require the exact generated sitemap")
    parser.add_argument("--verbose", action="store_true", help="show each intentionally omitted route")
    parser.add_argument("--root", type=Path, default=ROOT, help=argparse.SUPPRESS)
    args = parser.parse_args()
    try:
        builder = Builder(args.root)
        urls = builder.build()
        expected = render(urls)
        sitemap = args.root / "sitemap.xml"
        if args.check:
            check_sitemap(sitemap, expected, urls, builder)
        else:
            sitemap.write_text(expected, encoding="utf-8")
        print(f"{'Checked' if args.check else 'Wrote'} sitemap.xml: {len(urls)} public canonical URLs")
        if builder.skipped:
            counts = Counter(builder.skipped.values())
            print("Omitted: " + ", ".join(f"{count} {reason}" for reason, count in sorted(counts.items())))
        if args.verbose:
            for path, reason in sorted(builder.skipped.items()):
                print(f"  {reason}: {path}")
    except (SitemapError, OSError, KeyError, TypeError, ET.ParseError, json.JSONDecodeError) as error:
        print("Sitemap check failed: " + str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
