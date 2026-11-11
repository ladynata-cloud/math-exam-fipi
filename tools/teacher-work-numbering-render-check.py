#!/usr/bin/env python3
"""Check that numbered Word renders visibly contain every source paragraph.

Reading the DOCX package alone cannot detect a renderer without Office Math
support. Expectations here come from the unchanged source DOCX, including its
native equation text, and are checked on each actual rendered PDF page.
"""

import argparse
import json
import re
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[1]
NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "m": "http://schemas.openxmlformats.org/officeDocument/2006/math",
    "v": "urn:schemas-microsoft-com:vml",
}
TEXT_TAGS = {"{" + NS[key] + "}t" for key in ("w", "m")}


def compact(text):
    return re.sub(r"\s+", "", text)


def source_pages(path):
    with zipfile.ZipFile(path) as package:
        document = ET.fromstring(package.read("word/document.xml"))
    body = document.find("w:body", NS)
    assert body is not None, (path.name, "Missing source body")
    pages = [[]]
    for paragraph in body:
        if paragraph.tag == "{" + NS["w"] + "}sectPr":
            continue
        assert paragraph.tag == "{" + NS["w"] + "}p", (
            path.name, "New source structure needs a visible-content check"
        )
        text = "".join(node.text or "" for node in paragraph.iter()
                       if node.tag in TEXT_TAGS)
        breaks = paragraph.findall('.//w:br[@w:type="page"]', NS)
        if breaks:
            assert len(breaks) == 1 and not text.strip(), (
                path.name, "Expected a separate page break between variants"
            )
            pages.append([])
            continue
        # Numbering intentionally changes Subtitle paragraphs. Drawing labels
        # are represented by the unchanged native VML and reviewed in page PNGs.
        if paragraph.find('./w:pPr/w:pStyle[@w:val="Subtitle"]', NS) is not None:
            continue
        if paragraph.find('.//v:group', NS) is not None:
            assert not paragraph.findall('.//m:oMath', NS), (
                path.name, "A drawing paragraph contains unchecked math"
            )
            continue
        if text.strip():
            pages[-1].append({
                "text": compact(text),
                "equations": len(paragraph.findall('.//m:oMath', NS)),
            })
    assert len(pages) == 4 and all(pages), (path.name, "Four nonempty source variants")
    for index, paragraphs in enumerate(pages, 1):
        assert compact("Вариант " + str(index)) in [p["text"] for p in paragraphs], (
            path.name, index, "Source variant identity"
        )
    return pages


def check_render(source, pdf):
    expected = source_pages(source)
    paragraphs_checked = 0
    equations_checked = 0
    with fitz.open(pdf) as rendered:
        assert len(rendered) == len(expected), (pdf.name, "Changed page count")
        for index, (page, paragraphs) in enumerate(zip(rendered, expected), 1):
            visible = compact(page.get_text())
            cursor = 0
            for paragraph in paragraphs:
                position = visible.find(paragraph["text"], cursor)
                assert position >= 0, (
                    pdf.name, index, "Source paragraph or formula missing from rendered page",
                    paragraph["text"]
                )
                cursor = position + len(paragraph["text"])
                paragraphs_checked += 1
                equations_checked += paragraph["equations"]
    return {"source": source.name, "pdf": pdf.name, "pages": len(expected),
            "paragraphs": paragraphs_checked, "equations": equations_checked}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--downloads-dir", type=Path, required=True)
    parser.add_argument("--renders-dir", type=Path, required=True)
    args = parser.parse_args()
    records = json.loads((args.downloads_dir / "numbered-downloads.json").read_text())
    word = [record for record in records if record["type"] == "docx"]
    assert len(word) == 6, "Six numbered Word documents are required"
    reports = []
    for record in word:
        key = "teacherUrl" if record["role"] == "teacher" else "studentUrl"
        source = (ROOT / record["work"][key].lstrip("/")).resolve()
        assert source.is_relative_to(ROOT / "pedagogam" / "raboty"), "Unexpected source path"
        pdf = args.renders_dir / Path(record["filename"]).with_suffix(".pdf").name
        reports.append(check_render(source, pdf))
    report = {"result": "PASS", "documents": len(reports),
              "pages": sum(item["pages"] for item in reports),
              "paragraphs": sum(item["paragraphs"] for item in reports),
              "equations": sum(item["equations"] for item in reports),
              "files": reports}
    (args.renders_dir / "word-visible-content.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    )
    print(json.dumps({key: value for key, value in report.items() if key != "files"}))


if __name__ == "__main__":
    main()
