#!/usr/bin/env python3
"""Validate public teacher topic pages and the existing downloads they expose.

This is independent of the page builder: it reads generated HTML, sitemap,
existing PDF hashes, archive members and actual local destination files.
"""
from collections import Counter
from hashlib import sha256
from html.parser import HTMLParser
import json
import re
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://mathexam.space"
TOPICS = (
    "arith-decimals", "arith-gcd-lcm", "arith-fraction-add-subtract",
    "alg-linear", "geo-ravenstvo-treugolnikov", "alg-roots", "alg-quadratics",
    "alg-arithmetic-progression", "alg-trig-equations", "alg-derivatives",
)
PDF_NAMES = ("samostoyatelnaya.pdf", "samostoyatelnaya-otvety.pdf",
             "kontrolnaya.pdf", "kontrolnaya-otvety.pdf")


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.links, self.download_buttons, self.canonicals, self.descriptions, self.jsonld = [], [], [], [], []
        self.ids, self.names, self.robots = [], [], []
        self.h1_count, self.main_count, self.details_count = 0, 0, 0
        self.title, self.h1 = "", ""
        self.in_title = self.in_h1 = self.in_jsonld = False
        self.json_text = ""
        self.viewport = False
        self.lang = ""
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.append(a["id"])
        if tag == "html":
            self.lang = a.get("lang", "")
        elif tag == "a":
            if a.get("href"):
                self.links.append(a)
            if a.get("name"):
                self.names.append(a["name"])
        elif tag == "button" and a.get("data-numbered-source"):
            self.download_buttons.append(a)
        elif tag == "h1":
            self.h1_count += 1
            self.in_h1 = True
        elif tag == "title":
            self.in_title = True
        elif tag == "main":
            self.main_count += 1
        elif tag == "details":
            self.details_count += 1
        elif tag == "link" and "canonical" in a.get("rel", "").split():
            self.canonicals.append(a.get("href"))
        elif tag == "meta":
            name = a.get("name", "").lower()
            if name == "description":
                self.descriptions.append(a.get("content", ""))
            elif name == "viewport":
                self.viewport = "width=device-width" in a.get("content", "")
            elif name in ("robots", "googlebot", "yandex"):
                self.robots.extend(a.get("content", "").lower().replace(",", " ").split())
        elif tag == "script" and a.get("type") == "application/ld+json":
            self.in_jsonld = True
            self.json_text = ""

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        elif tag == "h1":
            self.in_h1 = False
        elif tag == "script" and self.in_jsonld:
            self.jsonld.append(json.loads(self.json_text))
            self.in_jsonld = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.in_h1:
            self.h1 += data
        if self.in_jsonld:
            self.json_text += data


def local_file(url):
    part = urlsplit(url)
    file = ROOT / unquote(part.path).lstrip("/")
    if part.path.endswith("/") or file.is_dir():
        file /= "index.html"
    assert file.resolve().is_relative_to(ROOT), ("unsafe local route", url)
    return file


def json_nodes(value):
    if isinstance(value, dict):
        yield value
        for nested in value.values():
            yield from json_nodes(nested)
    elif isinstance(value, list):
        for nested in value:
            yield from json_nodes(nested)



# These are JavaScript router destinations, not HTML element anchors. Validate
# the loaded lesson registry and its actual router; browser QA also opens them.
SPA_TITLES = {
    ("equations/index.html", "both"): "Неизвестное с двух сторон",
    ("equations/index.html", "brackets"): "Скобки и подобные",
    ("equations/index.html", "square"): "Квадрат числа",
    ("equations/index.html", "quadratic"): "Квадратное уравнение",
    ("school/makarychev8/index.html", "lesson/p11"): "Квадратные корни. Арифметический квадратный корень",
    ("school/makarychev8/index.html", "lesson/p21"): "Формула корней квадратного уравнения",
    ("school/makarychev8/index.html", "lesson/p23"): "Теорема Виета",
    ("school/index.html", "lesson/m9f-arithmetic-term"): "Арифметическая прогрессия: n−1 шагов",
    ("school/index.html", "lesson/m9f-arithmetic-sum"): "Сумма: пары первого и последнего",
    ("school/alimov10-11/index.html", "lesson/p34"): "Уравнение sin x = a",
    ("school/alimov10-11/index.html", "lesson/p35"): "Уравнение tg x = a",
    ("school/alimov10-11/index.html", "lesson/p45"): "Производная степенной функции",
    ("school/alimov10-11/index.html", "lesson/p47"): "Производные элементарных функций",
}


def is_verified_spa_route(file, fragment):
    key = (file.relative_to(ROOT).as_posix(), unquote(fragment))
    title = SPA_TITLES.get(key)
    if title is None:
        return False
    index = file.read_text()
    app = (file.parent / "app.js").read_text()
    assert 'app.js' in index and "location.hash" in app and "hashchange" in app, key
    if key[0] == "equations/index.html":
        data = (file.parent / "data.js").read_text()
        assert 'data.js' in index and f"['{fragment}','{title}'" in data, key
        assert 'C.lessons.find' in app and 'l.title' in app, key
    elif key[0] == "school/index.html":
        data = (file.parent / "makarychev9-lessons.js").read_text()
        slug = fragment.split("m9f-", 1)[1]
        assert 'makarychev9-lessons.js' in index, key
        assert re.search(r"L\(\d+,'" + re.escape(slug) + "','" + re.escape(title) + "'", data), key
        assert "parts[0]==='lesson'" in app and 'C.byId[parts[1]]' in app, key
    else:
        data = (file.parent / "data.js").read_text()
        registry = json.JSONDecoder().raw_decode(data[data.index("={") + 1:])[0]
        matching = [lesson for lesson in registry["lessons"] if lesson["id"] == fragment.split("/")[1]]
        assert len(matching) == 1 and matching[0]["title"] == title and matching[0]["tasks"], key
        assert 'data.js' in index and "parts[0]==='lesson'" in app and 'lessonView(parts[1]' in app, key
    return True


def main():
    out = ROOT / "pedagogam/raboty"
    manifest = {p["id"]: p for p in json.loads((out / "manifest.json").read_text())}
    bank = {p["id"]: p for p in json.loads((out / "bank.json").read_text())}
    catalog = Document((out / "index.html").read_text())
    sitemap = [el.text for el in ET.parse(ROOT / "sitemap.xml").iter(
        "{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
    cache, titles, descriptions = {}, [], []
    checks = Counter()
    for topic in TOPICS:
        route = "/pedagogam/raboty/" + topic + "/"
        canonical = ORIGIN + route
        doc = Document(local_file(canonical).read_text())
        assert doc.lang == "ru" and doc.viewport, topic
        assert doc.h1_count == doc.main_count == 1, (topic, "h1/main")
        assert doc.h1.strip() and doc.title.strip(), topic
        assert doc.canonicals == [canonical], (topic, doc.canonicals)
        assert len(doc.descriptions) == 1 and doc.descriptions[0].strip(), topic
        assert not {"none", "noindex"}.intersection(doc.robots), topic
        assert sitemap.count(canonical) == 1, (topic, "sitemap")
        assert len(doc.ids) == len(set(doc.ids)), (topic, "duplicate IDs")
        assert doc.details_count, (topic, "progressive disclosure missing")
        nodes = list(json_nodes(doc.jsonld))
        assert any(n.get("@type") == "BreadcrumbList" for n in nodes), (topic, "breadcrumbs JSON-LD")
        assert any(n.get("url") == canonical for n in nodes), (topic, "canonical JSON-LD URL")
        assert any(urlsplit(urljoin(ORIGIN + "/pedagogam/raboty/", a["href"])).path == route
                   for a in catalog.links), (topic, "no catalog entrance")
        assert any(urlsplit(urljoin(canonical, a["href"])).path == "/pedagogam/raboty/"
                   for a in doc.links), (topic, "no catalog return")
        titles.append(doc.title)
        descriptions.append(doc.descriptions[0])
        pdf_links = {urlsplit(urljoin(canonical, a["data-numbered-source"])).path: a
                     for a in doc.download_buttons
                     if urlsplit(a["data-numbered-source"]).path.endswith(".pdf")}
        expected_paths = {route + name for name in PDF_NAMES}
        assert set(pdf_links) == expected_paths, (topic, "wrong PDF selection", set(pdf_links))
        expected_hashes = {"/pedagogam/raboty/" + f["path"]: f["sha256"]
                           for f in manifest[topic]["files"]}
        for urlpath, link in pdf_links.items():
            assert link.get("type") == "button" and "disabled" in link, (topic, "download must wait for numbering", urlpath)
            assert "href" not in link and link.get("data-numbered-role") in ("student", "teacher"), (topic, "numbered action", urlpath)
            data = local_file(ORIGIN + urlpath).read_bytes()
            assert data.startswith(b"%PDF-"), urlpath
            assert sha256(data).hexdigest() == expected_hashes[urlpath], (urlpath, "hash")
            checks["pdfs"] += 1
        assert [v["name"] for v in bank[topic]["variants"]] == ["1", "2", "3", "4"]
        zip_path = route + "komplekt.zip"
        zip_buttons = [a for a in doc.download_buttons
                       if urlsplit(urljoin(canonical, a["data-numbered-source"])).path == zip_path]
        assert len(zip_buttons) == 1 and zip_buttons[0].get("data-numbered-pack") == topic, (topic, "ZIP")
        assert zip_buttons[0].get("type") == "button" and "disabled" in zip_buttons[0] and "href" not in zip_buttons[0], (topic, "ZIP must wait for numbering")
        assert not any(urlsplit(a["href"]).path.endswith((".pdf", ".zip")) for a in doc.links), (topic, "silent unnumbered download")
        with zipfile.ZipFile(local_file(ORIGIN + zip_path)) as archive:
            archived_pdfs = {Path(n).name: archive.read(n) for n in archive.namelist() if n.endswith(".pdf")}
        assert set(archived_pdfs) == set(PDF_NAMES), (topic, "ZIP members")
        for name, data in archived_pdfs.items():
            assert data == (out / topic / name).read_bytes(), (topic, name, "ZIP bytes")
        checks["archives"] += 1
        for a in doc.links:
            target = urljoin(canonical, a["href"])
            parts = urlsplit(target)
            if parts.scheme + "://" + parts.netloc != ORIGIN:
                continue
            file = local_file(target)
            assert file.is_file(), (topic, "broken link", target)
            if parts.fragment and file.suffix == ".html":
                if file not in cache:
                    cache[file] = Document(file.read_text())
                assert (unquote(parts.fragment) in cache[file].ids + cache[file].names
                        or is_verified_spa_route(file, parts.fragment)), (topic, "broken anchor or app route", target)
            checks["internal_links"] += 1
        checks["pages"] += 1
    assert len(set(titles)) == len(TOPICS), "Repeated titles"
    assert len(set(descriptions)) == len(TOPICS), "Repeated descriptions"
    print(json.dumps({"result": "PASS", **checks}, ensure_ascii=False))


if __name__ == "__main__":
    main()
