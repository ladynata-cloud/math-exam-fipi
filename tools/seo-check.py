#!/usr/bin/env python3
"""Check public SEO entrances without running or changing learner applications.

Run: python tools/seo-check.py [--base <reviewed Git commit>]
The optional base check proves that metadata edits preserved trainer bodies,
executable scripts, styles and existing indexing directives.
"""
import argparse
import importlib.util
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://mathexam.space"
ENTRANCES = [
    "index.html", "trainers/index.html", "trainers/oge-course/index.html",
    "trainers/oge-basics/index.html", "foundations/index.html",
    "soviet-math/index.html", "grade7/index.html", "courses/index.html",
    "articles/index.html", "pedagogam/index.html", "ege-profil/index.html",
    "ege-profil/start/index.html", "geometry-course/index.html",
    "geometry-merzlyak/index.html", "geometry-pogorelov/index.html",
    "equations/index.html",
    "trainers/oge-basics/multiplication-division/long-division-from-simple-to-decimals.html",
    "trainers/oge-task6-fractions.html", "trainers/oge-task9-equations.html",
    "trainers/oge-basics/percentages/index.html",
    "trainers/oge-1-5-trainers/practice-1-5-map.html",
    "oge/geometry/task-15-external-angle.html",
    "trainers/oge-task16-circle.html", "trainers/oge-task18-grid.html",
]
TOPICS = ["topics/index.html"] + [f"topics/{slug}/index.html" for slug in (
    "delenie-ugolkom", "obyknovennye-drobi", "procenty",
    "lineynye-uravneniya", "oge-geometriya",
)]


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.title = []
        self.meta = {}
        self.canonicals = []
        self.links = []
        self.ids = []
        self.h1 = 0
        self.scripts = []
        self.styles = []
        self.style_links = []
        self.schemas = []
        self._in_head = False
        self._capture = None
        self._data = []
        self._attrs = {}
        self.feed(text)

    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        if tag == "head":
            self._in_head = True
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "h1":
            self.h1 += 1
        if tag == "meta":
            key = attrs.get("name", attrs.get("property", "")).lower()
            self.meta.setdefault(key, []).append(attrs.get("content", ""))
        if tag == "link" and "canonical" in attrs.get("rel", "").lower().split():
            self.canonicals.append(attrs.get("href", ""))
        if tag == "link" and "stylesheet" in attrs.get("rel", "").lower().split():
            self.style_links.append(attrs)
        if tag in ("a", "link", "img", "script"):
            self.links.append(attrs.get("href", attrs.get("src", "")))
        if tag in ("script", "style") or (tag == "title" and self._in_head):
            self._capture, self._data, self._attrs = tag, [], attrs

    def handle_data(self, data):
        if self._capture:
            self._data.append(data)

    def handle_endtag(self, tag):
        if tag == "head":
            self._in_head = False
        if tag != self._capture:
            return
        text = "".join(self._data)
        if tag == "title":
            self.title.append(text.strip())
        elif tag == "style":
            self.styles.append((self._attrs, text))
        elif self._attrs.get("type", "").lower() == "application/ld+json":
            self.schemas.append(json.loads(text))
        else:
            self.scripts.append((self._attrs, text))
        self._capture = None


def require(condition, message):
    if not condition:
        raise ValueError(message)


def is_lesson_funnel(script):
    # This optional observer never renders lesson text. Keep other executable
    # scripts prohibited on static topic explanations.
    attrs, text = script
    return attrs == {"defer": None, "src": "/assets/lesson-funnel.js?v=20261026"} and not text.strip()


def public_url(path):
    return ORIGIN + "/" + path.removesuffix("index.html") if path.endswith("index.html") else ORIGIN + "/" + path


def local_path(url):
    path = unquote(urlsplit(url).path).lstrip("/")
    return ROOT / (path + "index.html" if not path or path.endswith("/") else path)


def check_canonical_signals(page, url, label):
    """Check declared canonicals without making every HTML file indexable.

    A noindex board wrapper can still have a valid canonical to its public
    course. A refresh may navigate to a fragment, but a canonical identifies
    the document, not an application state within that document.
    """
    base = urljoin(url, page.base or "")
    canonicals = {urljoin(base, href) for href in page.canonicals}
    require(len(canonicals) <= 1, label + ": conflicting canonical links")
    for canonical in canonicals:
        require(not urlsplit(canonical).fragment,
                label + ": canonical must not contain a fragment")
        if page.refresh_target:
            destination = urlsplit(urljoin(base, page.refresh_target))._replace(fragment="").geturl()
            require(canonical == destination,
                    label + ": canonical conflicts with meta refresh destination " + destination)


def check_public_canonical_signals(root=ROOT):
    # Reuse the sitemap parser and its reviewed technical-path exclusions;
    # do not add these files to the sitemap or change any noindex directive.
    spec = importlib.util.spec_from_file_location("seo_sitemap", Path(__file__).with_name("build-sitemap.py"))
    sitemap = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(sitemap)
    checked, redirects = 0, 0
    for file in sorted(root.rglob("*.html")):
        path = "/" + file.relative_to(root).as_posix()
        if sitemap.excluded_path(path):
            continue
        page = sitemap.Page(file.read_text(encoding="utf-8"))
        if not page.canonicals:
            continue
        check_canonical_signals(page, ORIGIN + path, path)
        checked += 1
        redirects += bool(page.refresh_target)
    return checked, redirects


def run(base=None):
    canonical_count, redirect_count = check_public_canonical_signals()
    # Catch generated public pages that lose their canonical on a later rebuild.
    # The existing sitemap policy still excludes technical and alternate routes.
    sitemap_urls = [node.text for node in ET.parse(ROOT / "sitemap.xml").findall(
        ".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
    require(sitemap_urls, "public sitemap must not be empty")
    for url in sitemap_urls:
        page = Page(local_path(url).read_text(encoding="utf-8"))
        require(page.canonicals == [url], url + ": sitemap entry needs one exact HTTPS self-canonical")
    titles, descriptions = set(), set()
    checked_links = 0
    for relative in ENTRANCES + TOPICS:
        text = (ROOT / relative).read_text(encoding="utf-8")
        page = Page(text)
        label = relative + ": "
        require(len(page.title) == 1 and page.title[0], label + "one non-empty title")
        description = page.meta.get("description", [])
        require(len(description) == 1 and description[0].strip(), label + "one description")
        require(page.title[0] not in titles, label + "duplicate title")
        require(description[0] not in descriptions, label + "duplicate description")
        titles.add(page.title[0]); descriptions.add(description[0])
        require(page.canonicals == [public_url(relative)], label + "self canonical")
        robot_values = [value for key in ("robots", "googlebot", "yandex") for value in page.meta.get(key, [])]
        directives = set(re.split(r"[\s,]+", ",".join(robot_values).lower()))
        require(not {"noindex", "none"}.intersection(directives), label + "public page unexpectedly noindex")
        for key, expected in {
            "og:title": page.title[0], "og:description": description[0],
            "og:url": public_url(relative), "og:site_name": "MathExam",
            "og:locale": "ru_RU", "twitter:title": page.title[0],
            "twitter:description": description[0], "twitter:card": "summary",
        }.items():
            require(page.meta.get(key) == [expected], label + "inconsistent " + key)
        for schema in page.schemas:
            require(schema.get("@context") == "https://schema.org", label + "invalid JSON-LD context")
        if relative in TOPICS:
            require(page.h1 == 1, label + "one H1")
            require(len(page.ids) == len(set(page.ids)), label + "duplicate DOM IDs")
            require(len(page.scripts) <= 1 and all(is_lesson_funnel(s) for s in page.scripts),
                    label + "explanation must remain static; only the optional deferred funnel observer is allowed")
            require(page.schemas, label + "missing breadcrumbs")
            graph = page.schemas[0]["@graph"]
            crumb = next(node for node in graph if node.get("@type") == "BreadcrumbList")
            items = crumb["itemListElement"]
            require([item["position"] for item in items] == list(range(1,len(items)+1)), label + "breadcrumb order")
            require(items[-1]["item"] == public_url(relative), label + "breadcrumb destination")
            for raw in page.links:
                if not raw:
                    continue
                url = urljoin(public_url(relative), raw)
                parts = urlsplit(url)
                if parts.netloc != "mathexam.space":
                    continue
                target = local_path(url)
                require(target.is_file(), label + "missing local target " + raw)
                if parts.fragment and target.suffix == ".html":
                    require(unquote(parts.fragment) in Page(target.read_text(encoding="utf-8")).ids, label + "missing fragment " + raw)
                checked_links += 1
        if base and relative in ENTRANCES:
            old = subprocess.check_output(["git", "show", f"{base}:{relative}"], cwd=ROOT).decode("utf-8")
            before = Page(old)
            preserved = text
            script_text = text
            # Catalog fallback is independently checked against the rendered
            # data by seo-catalog.test.cjs. Permit only the bounded addition
            # when comparing with a pre-fallback base.
            container = {"trainers/index.html": "catalog",
                         "trainers/oge-basics/percentages/index.html": "map"}.get(relative)
            if container and f"<!-- seo-catalog-fallback:{container}:start -->" not in old:
                preserved, count = re.subn(
                    rf"<!-- seo-catalog-fallback:{container}:start -->.*?<!-- seo-catalog-fallback:{container}:end -->",
                    "", preserved, flags=re.S)
                require(count == 1, label + "one bounded catalog fallback addition")
                if container == "map":
                    preserved = preserved.replace("box.replaceChildren();\nTOPICS.forEach", "TOPICS.forEach", 1)
                    script_text = script_text.replace("box.replaceChildren();\nTOPICS.forEach", "TOPICS.forEach", 1)
                else:
                    for ident in ("countCards", "countSections"):
                        old_count = re.search(rf'<b id="{ident}">[^<]+', old).group()
                        preserved = re.sub(rf'<b id="{ident}">[^<]+', old_count, preserved, count=1)
            without_funnel = lambda scripts: [s for s in scripts if not is_lesson_funnel(s)]
            require(without_funnel(before.scripts) == without_funnel(Page(script_text).scripts),
                    label + "executable scripts changed outside scoped catalog/funnel additions")
            require(before.styles == page.styles, label + "existing styles changed")
            require(before.style_links == page.style_links, label + "existing stylesheet links changed")
            for key in ("robots", "googlebot", "yandex", "viewport"):
                require(before.meta.get(key) == page.meta.get(key), label + "existing directive changed: " + key)
            old_body = re.split(r"</head\s*>", old, maxsplit=1, flags=re.I)[1]
            new_body = re.split(r"</head\s*>", preserved, maxsplit=1, flags=re.I)[1]
            # The initial SEO change adds this block. Later bases already
            # contain it and must retain the complete body byte for byte.
            if relative == "index.html" and "<!-- seo-topic-links:start -->" not in old_body:
                new_body, count = re.subn(r"<!-- seo-topic-links:start -->.*?<!-- seo-topic-links:end -->\n\n", "", new_body, flags=re.S)
                require(count == 1, label + "one bounded topic-links addition")
            if relative != "courses/index.html":
                require(old_body == new_body, label + "learner body changed outside scoped addition")
    home = Page((ROOT / "index.html").read_text(encoding="utf-8"))
    require(home.h1 == 1 and "ОГЭ" in home.title[0], "homepage must retain OGE focus")
    for topic in TOPICS:
        require(urlsplit(public_url(topic)).path in home.links, "homepage missing topic link " + topic)
    require("ПредОГЭ" in Page((ROOT / "trainers/oge-basics/index.html").read_text()).title[0], "preserve PreOGE title")
    print(f"SEO_ENTRANCES_OK: {len(titles)} distinct titles/descriptions/canonicals; {len(TOPICS)} static topic pages; {checked_links} valid local links.")
    print(f"SEO_CANONICAL_SIGNALS_OK: {canonical_count} public-path canonical declarations; {redirect_count} consistent refresh destinations.")
    print(f"SEO_SITEMAP_CANONICALS_OK: {len(sitemap_urls)} public URLs retain their self-canonical.")
    if base:
        print(f"SEO_PRESERVATION_OK: 24 existing pages retain scripts/styles/directives outside bounded catalog additions against {base}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", help="Git base for scoped preservation checks")
    args = parser.parse_args()
    try:
        run(args.base)
    except (ValueError, OSError, KeyError, StopIteration, json.JSONDecodeError) as exc:
        raise SystemExit("SEO_CHECK_FAILED: " + str(exc))
