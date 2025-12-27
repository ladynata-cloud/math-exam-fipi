#!/usr/bin/env python3
import importlib.util
import json
from pathlib import Path
from typing import Iterable, List, Optional, Tuple

from PIL import Image, ImageDraw, ImageFont

REPORTLAB_AVAILABLE = importlib.util.find_spec("reportlab") is not None

if REPORTLAB_AVAILABLE:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import ListFlowable, ListItem, Paragraph, SimpleDocTemplate

FONT_NAME = "DejaVuSans"
FONT_PATH = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
OUTPUT_NAME = "task19_base_statements_list.pdf"
OUTPUT_NAME_WITH_IDS = "task19_base_statements_list_with_ids.pdf"


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def score_task19_json(path: Path) -> Optional[Tuple[int, Path, dict]]:
    try:
        data = load_json(path)
    except (json.JSONDecodeError, OSError):
        return None
    if not isinstance(data, dict):
        return None
    cards = data.get("cards")
    if not isinstance(cards, list):
        return None
    if not any(isinstance(card, dict) and "statement" in card for card in cards):
        return None
    return (len(cards), path, data)


def find_task19_json(repo_root: Path) -> Tuple[Path, dict]:
    candidates: List[Tuple[int, Path, dict]] = []
    for path in sorted(repo_root.rglob("*task19*.json")):
        scored = score_task19_json(path)
        if scored:
            candidates.append(scored)
    if not candidates:
        raise FileNotFoundError("No task19 JSON bank found.")
    candidates.sort(key=lambda item: (-item[0], str(item[1])))
    _, path, data = candidates[0]
    return path, data


def normalize_statement(value: object) -> List[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        return [item for item in value if isinstance(item, str)]
    return []


def extract_statements(data: dict) -> List[dict]:
    statements: List[dict] = []
    for card in data.get("cards", []):
        if not isinstance(card, dict):
            continue
        card_id = card.get("id")
        values: List[str] = []
        for key in ("statement", "statements", "assertions", "items", "text"):
            if key in card:
                values.extend(normalize_statement(card.get(key)))
        for text in values:
            statements.append({"text": text, "id": card_id})
    return statements


def build_pdf_with_reportlab(
    statements: Iterable[dict], output_path: Path, include_ids: bool
) -> None:
    style = ParagraphStyle(
        "Base",
        fontName=FONT_NAME,
        fontSize=12,
        leading=16,
    )
    list_items: List[ListItem] = []
    for index, item in enumerate(statements, start=1):
        text = item["text"]
        if include_ids and item.get("id"):
            text = f"[#{item['id']}] {text}"
        paragraph = Paragraph(text, style)
        list_items.append(ListItem(paragraph, value=index))
    flowable = ListFlowable(
        list_items,
        bulletType="1",
        start="1",
        leftIndent=18,
        bulletFontName=FONT_NAME,
        bulletFontSize=12,
    )
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )
    doc.build([flowable])


def wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: float) -> List[str]:
    words = text.split()
    if not words:
        return [""]
    lines: List[str] = []
    current = ""
    for word in words:
        test_line = f"{current} {word}".strip()
        if font.getlength(test_line) <= max_width or not current:
            current = test_line
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def make_indent(prefix: str, font: ImageFont.FreeTypeFont) -> str:
    prefix_width = font.getlength(prefix)
    space_width = font.getlength(" ")
    if space_width <= 0:
        return " " * len(prefix)
    count = max(1, int(prefix_width / space_width))
    return " " * count


def build_pdf_with_pillow(
    statements: Iterable[dict], output_path: Path, include_ids: bool
) -> None:
    page_width, page_height = 595, 842
    margin = 36
    font = ImageFont.truetype(str(FONT_PATH), size=12)
    line_height = font.getbbox("Hg")[3] - font.getbbox("Hg")[1] + 4
    max_width = page_width - 2 * margin

    pages: List[Image.Image] = []
    page = Image.new("RGB", (page_width, page_height), "white")
    draw = ImageDraw.Draw(page)
    y_position = margin

    for index, item in enumerate(statements, start=1):
        prefix = f"{index}. "
        if include_ids and item.get("id"):
            prefix = f"{index}. [#{item['id']}] "
        wrapped_lines = wrap_text(item["text"], font, max_width - font.getlength(prefix))
        indent = make_indent(prefix, font)
        for line_index, line in enumerate(wrapped_lines):
            rendered_line = f"{prefix}{line}" if line_index == 0 else f"{indent}{line}"
            if y_position + line_height > page_height - margin:
                pages.append(page)
                page = Image.new("RGB", (page_width, page_height), "white")
                draw = ImageDraw.Draw(page)
                y_position = margin
            draw.text((margin, y_position), rendered_line, font=font, fill="black")
            y_position += line_height

    pages.append(page)
    pages[0].save(
        output_path,
        "PDF",
        resolution=72,
        save_all=True,
        append_images=pages[1:],
    )


def build_pdf(statements: Iterable[dict], output_path: Path, include_ids: bool) -> None:
    if REPORTLAB_AVAILABLE:
        build_pdf_with_reportlab(statements, output_path, include_ids)
    else:
        build_pdf_with_pillow(statements, output_path, include_ids)


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    if not FONT_PATH.exists():
        raise FileNotFoundError(f"Font not found at {FONT_PATH}")
    if REPORTLAB_AVAILABLE:
        pdfmetrics.registerFont(TTFont(FONT_NAME, str(FONT_PATH)))

    json_path, data = find_task19_json(repo_root)
    statements = extract_statements(data)
    if not statements:
        raise ValueError("No statements found in task19 JSON.")

    output_path = repo_root / OUTPUT_NAME
    build_pdf(statements, output_path, include_ids=False)

    has_ids = any(item.get("id") for item in statements)
    if has_ids:
        output_with_ids = repo_root / OUTPUT_NAME_WITH_IDS
        build_pdf(statements, output_with_ids, include_ids=True)

    print(f"Found {len(statements)} statements in {json_path}")
    print(f"Wrote {output_path}")
    if has_ids:
        print(f"Wrote {output_with_ids}")


if __name__ == "__main__":
    main()
