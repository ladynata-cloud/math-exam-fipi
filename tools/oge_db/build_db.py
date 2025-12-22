"""CLI tool for building a local OGE task database from PDF files.

The script extracts task numbers, variant markers, and page information
from a PDF and stores a draft database in CSV and XLSX formats. It is
intentionally light-weight so it can run locally without bundling PDF
assets into the repository.
"""
from __future__ import annotations

import argparse
import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional

import pandas as pd
import pdfplumber


VARIANT_PATTERN = re.compile(r"Вариант\s*№?\s*(\d+)", re.IGNORECASE)
TASK_PATTERN = re.compile(
    r"(?mi)^\s*(?:задание\s+|№\s*)?(\d{1,2})(?:\s*[\.)])?\b"
)


@dataclass
class TaskEntry:
    variant: Optional[int]
    task_number: int
    page: int
    page_pdf: str
    theme_guess: str
    text_preview: str


THEME_MAP = {
    1: "арифметика: вычисления",
    2: "арифметика: проценты",
    3: "арифметика: пропорции и доли",
    4: "геометрия: площадь и периметр",
    5: "функции и графики",
    6: "геометрия: углы",
    7: "геометрия: треугольники",
    8: "неравенства",
    9: "линейные уравнения",
    10: "вероятность",
    11: "координатная плоскость",
    12: "статистика и диаграммы",
    13: "квадратные уравнения",
    14: "последовательности и прогрессии",
    15: "геометрия: углы и биссектрисы",
    16: "геометрия: координаты и расстояния",
    17: "геометрия: объемы и площади",
    18: "геометрия: тригонометрия",
    19: "алгебра: рациональные выражения",
    20: "геометрия: доказательства",
}


def guess_theme(task_number: int) -> str:
    """Return a rough topic guess for the given task number."""
    return THEME_MAP.get(task_number, "прочее")


def extract_variant(text: str) -> Optional[int]:
    match = VARIANT_PATTERN.search(text)
    if match:
        return int(match.group(1))
    return None


def extract_tasks_from_page(text: str) -> Iterable[int]:
    for match in TASK_PATTERN.finditer(text):
        task_number = int(match.group(1))
        if 1 <= task_number <= 25:
            yield task_number


def rebuild_text_from_words(words: List[dict]) -> str:
    lines: dict[float, List[dict]] = defaultdict(list)
    for word in words:
        lines[round(word.get("top", 0))].append(word)

    rebuilt_lines = []
    for _, line_words in sorted(lines.items()):
        sorted_words = sorted(line_words, key=lambda w: w.get("x0", 0))
        rebuilt_lines.append(" ".join(word.get("text", "") for word in sorted_words))

    return "\n".join(rebuilt_lines)


def extract_page_text(page: pdfplumber.page.Page) -> str:
    text = page.extract_text() or ""
    if text.strip():
        return text

    words = page.extract_words() or []
    if not words:
        return ""

    return rebuild_text_from_words(words)


def build_entries(pdf_path: Path, debug: bool = False) -> List[TaskEntry]:
    entries: List[TaskEntry] = []
    current_variant: Optional[int] = None

    with pdfplumber.open(pdf_path) as pdf:
        for index, page in enumerate(pdf.pages):
            page_number = index + 1
            text = extract_page_text(page)

            if debug and page_number <= 3:
                snippet = " ".join(text.split())[:200]
                print(
                    f"[DEBUG] Page {page_number}: chars={len(page.chars)} snippet='{snippet}'"
                )

            variant = extract_variant(text)
            if variant is not None:
                current_variant = variant

            text_preview = " ".join(text.split())[:240]

            for task_number in extract_tasks_from_page(text):
                page_ref = f"{pdf_path.name}#page={page_number}"
                entries.append(
                    TaskEntry(
                        variant=current_variant,
                        task_number=task_number,
                        page=page_number,
                        page_pdf=page_ref,
                        theme_guess=guess_theme(task_number),
                        text_preview=text_preview,
                    )
                )
    return entries


def build_dataframe(entries: List[TaskEntry]) -> pd.DataFrame:
    data = [
        {
            "variant": entry.variant,
            "task_number": entry.task_number,
            "page": entry.page,
            "page_pdf": entry.page_pdf,
            "theme_guess": entry.theme_guess,
            "text_preview": entry.text_preview,
        }
        for entry in entries
    ]
    return pd.DataFrame(data)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract task metadata from an OGE PDF and build CSV/XLSX datasets",
    )
    parser.add_argument("--pdf", required=True, type=Path, help="Path to the source PDF")
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("tools/oge_db/out"),
        help="Output directory for oge_db.xlsx and oge_db.csv",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Print debug information for the first few pages",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    pdf_path: Path = args.pdf
    out_dir: Path = args.out

    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    out_dir.mkdir(parents=True, exist_ok=True)

    entries = build_entries(pdf_path, debug=args.debug)
    if not entries:
        raise RuntimeError(
            "Не удалось найти номера задач в PDF. Запустите с --debug и"
            " убедитесь, что PDF содержит текстовый слой (не сканы)."
        )

    df = build_dataframe(entries)

    csv_path = out_dir / "oge_db.csv"
    xlsx_path = out_dir / "oge_db.xlsx"

    df.to_csv(csv_path, index=False)
    df.to_excel(xlsx_path, index=False)

    print(f"Saved {len(df)} records to {csv_path} and {xlsx_path}")


if __name__ == "__main__":
    main()
