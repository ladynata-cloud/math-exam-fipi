#!/usr/bin/env python3
"""Check that newly added learner-facing HTML documents have a public sitemap entry."""
import argparse
from pathlib import Path
import re
import runpy
import subprocess
import sys
from urllib.parse import urljoin
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sitemap = runpy.run_path(str(ROOT / "tools/build-sitemap.py"))
LEARNING_SECTIONS = {
    "courses", "trainers", "school", "oge", "ege-baza", "ege-profil", "vpr", "equations",
    "stereo-course", "geometry-course", "geometry-pogorelov", "geometry-merzlyak", "foundations",
}
NON_LESSON_PARTS = {"src", "dist", "drafts", "tests", "examples-src", "node_modules", "vendor", "templates"}
TITLE = re.compile(r"<title\b[^>]*>(.*?)</title\s*>", re.I | re.S)
TRAINER_TITLE = re.compile(r"тренаж[её]р|практикум|карта навыков|интерактивный курс", re.I)


def required_url(file, root):
    relative = file.relative_to(root)
    path = "/" + relative.as_posix()
    if (sitemap["excluded_path"](path) or NON_LESSON_PARTS.intersection(relative.parts)
            or file.name == "404.html" or file.name.endswith("-fragment.html")):
        return None
    text = file.read_text(encoding="utf-8")
    title = TITLE.search(text)
    if not title or not (relative.parts[0] in LEARNING_SECTIONS
                         or re.fullmatch(r"grade\d+", relative.parts[0])
                         or TRAINER_TITLE.search(title[1])):
        return None
    page = sitemap["Page"](text)
    if page.noindex or page.refresh:
        return None
    public = sitemap["ORIGIN"] + path
    if page.canonicals:
        return urljoin(urljoin(public, page.base or ""), page.canonicals[0])
    return public.removesuffix("index.html") if file.name == "index.html" else public


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", required=True, help="Base/first parent of the PR merge candidate")
    args = parser.parse_args()
    names = subprocess.check_output(
        ["git", "diff", "--no-renames", "--diff-filter=A", "--name-only", "-z", args.base,
         "HEAD", "--", "*.html"], cwd=ROOT,
    ).decode().split("\0")
    listed = {node.text for node in ET.parse(ROOT / "sitemap.xml").findall(".//{*}loc")}
    missing = []
    checked = 0
    for name in filter(None, names):
        url = required_url(ROOT / name, ROOT)
        if url and url.startswith(sitemap["ORIGIN"] + "/"):
            checked += 1
            if url not in listed:
                missing.append((name, url))
    for name, url in missing:
        print(f"{name}: {url} missing from sitemap. Link the public lesson from its catalog, "
              "update the reviewed sitemap inputs if needed, then run tools/build-sitemap.py.", file=sys.stderr)
    print(f"New learner pages checked: {checked}; missing: {len(missing)}")
    return int(bool(missing))


if __name__ == "__main__":
    sys.exit(main())
