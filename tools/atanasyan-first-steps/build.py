#!/usr/bin/env python3
"""Project reviewed Atanasyan cards into the bounded beginning-geometry route.

The canonical textbook bundle is a sealed input.  This builder never edits it,
renumbers lessons, or changes their conditions, geometry, steps, or review
records.  Readability corrections are separate display-only metadata.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE_PATH = Path("geometry-course/textbook/data/course.json")
TARGET_PATH = Path("learning/atanasyan-first-steps/course.json")
SOURCE_SHA256 = "af1e3a373745d3a66e3e6f71b14d02de4cd81f0c688a8929c0475277cc22b574"
BOOK_ID = "atanasyan-2023-7-9"
BOOK_SHA256 = "3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72"
GATE = "ATANASYAN_FIRST_STEPS_SOURCE_OK"

# These are route sections.  The circle and constructions parts of chapter II
# are separated for a shorter learner sequence; no new textbook paragraph
# numbering is invented.  Chapter-I additional tasks remain before triangles.
SECTION_SPECS = (
    ("lines-segments", "Точки, прямые и отрезки", "I", (1, 2), (1, 10)),
    ("rays-angles", "Лучи и углы", "I", (3, 4), (11, 20)),
    ("compare-figures", "Равенство фигур. Сравнение отрезков и углов", "I", (5, 6), (21, 26)),
    ("measure-segments", "Измерение отрезков", "I", (7, 8), (27, 44)),
    ("measure-angles", "Измерение углов", "I", (9, 10), (45, 57)),
    ("adjacent-vertical-perpendicular", "Смежные и вертикальные углы. Перпендикулярные прямые", "I", (11, 12, 13), (58, 74)),
    ("chapter-one-practice", "Дополнительные задачи к начальным сведениям", "I", (), (75, 91)),
    ("triangle-first-criterion", "Треугольник и первый признак равенства", "II", (14, 15), (92, 104)),
    ("triangle-cevians-isosceles", "Медиана, биссектриса, высота. Равнобедренный треугольник", "II", (16, 17, 18), (105, 125)),
    ("triangle-second-third-criteria", "Второй и третий признаки равенства треугольников", "II", (19, 20), (126, 147)),
    ("circle", "Окружность, радиус, хорда и диаметр", "II", (21,), (148, 152)),
    ("elementary-constructions", "Элементарные построения циркулем и линейкой", "II", (22, 23), (153, 160)),
)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def stable_bytes(value: object) -> bytes:
    """Canonical bytes used only for the selected-content fingerprint."""
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


def theory_references(value: object) -> set[str]:
    refs: set[str] = set()
    if isinstance(value, dict):
        for key, item in value.items():
            if key == "theoryId":
                require(isinstance(item, str), "A theory reference must be a string")
                refs.add(item)
            elif key == "theoryIds":
                require(isinstance(item, list) and all(isinstance(ref, str) for ref in item), "Theory references must be strings")
                refs.update(item)
            else:
                refs.update(theory_references(item))
    elif isinstance(value, list):
        for item in value:
            refs.update(theory_references(item))
    return refs


def selected(lesson: dict) -> bool:
    source = lesson.get("source", {})
    if source.get("collection") == "main":
        number = str(source.get("exercise", ""))
        return number.isdigit() and 1 <= int(number) <= 160
    if lesson.get("kind") == "theory" and source.get("collection") == "theory":
        point = str(source.get("point", ""))
        return point.isdigit() and 1 <= int(point) <= 23
    return False


def build_projection(bundle: dict) -> dict:
    """Validate and select the declared source without mutating the input."""
    require(bundle["catalog"]["book"]["id"] == BOOK_ID, "Wrong textbook edition")
    require(bundle["sourceInventory"]["book"]["sourceSha256"] == BOOK_SHA256, "Wrong source PDF identity")
    require(bundle["build"].get("publicationReviewMatches") is True, "Source publication review does not match")
    cards = [lesson for lesson in bundle["lessons"] if selected(lesson)]
    by_id = {lesson["id"]: lesson for lesson in cards}
    require(len(by_id) == len(cards) == 255, "Expected exactly 255 unique reviewed cards")
    problems = [lesson for lesson in cards if lesson["source"]["collection"] == "main"]
    theories = [lesson for lesson in cards if lesson["kind"] == "theory"]
    require(len(problems) == 232 and len(theories) == 23, "Problem/theory card coverage changed")
    require({int(lesson["source"]["exercise"]) for lesson in problems} == set(range(1, 161)), "Exercise numbers 1–160 must be complete")
    require({int(lesson["source"]["point"]) for lesson in theories} == set(range(1, 24)), "Theory points 1–23 must be complete")
    require(sum(len(lesson["steps"]) for lesson in problems) == 682, "Authored problem steps changed")
    theory_ids = {lesson["id"] for lesson in theories}
    for lesson in cards:
        require(lesson.get("status") == "reviewed", "Unreviewed lesson in the bounded route")
        require(all(lesson.get("review", {}).get(key) == "passed" for key in ("source", "mathematics", "pedagogy")), "Incomplete lesson review")
        require(lesson["source"]["bookId"] == BOOK_ID, "Mixed textbook editions")
        require(lesson["source"]["chapter"] in ("I", "II"), "Unexpected chapter")
        require(theory_references(lesson) <= theory_ids, "Theory dependency leaves the bounded route")
        require(lesson["visualization"]["model"].get("planar") is True, "A lesson lacks its planar model")
        if lesson["kind"] == "exercise":
            require(lesson["answer"]["mode"] == "manual", "The route must not certify written proofs")

    sections = []
    ordered_ids: list[str] = []
    for section_id, title, chapter, points, numbers in SECTION_SPECS:
        section_cards = []
        for point in points:
            section_cards.extend(lesson for lesson in theories if int(lesson["source"]["point"]) == point)
        for number in range(numbers[0], numbers[1] + 1):
            # Existing array order preserves the textbook's exact subpart order.
            section_cards.extend(lesson for lesson in problems if int(lesson["source"]["exercise"]) == number)
        require(section_cards and all(lesson["source"]["chapter"] == chapter for lesson in section_cards), "Section/chapter mismatch")
        pages = [page for lesson in section_cards for page in lesson["source"]["printedPages"]]
        ids = [lesson["id"] for lesson in section_cards]
        sections.append({
            "id": section_id,
            "title": title,
            "chapter": chapter,
            "theoryPoints": list(points),
            "exerciseNumbers": list(numbers),
            "printedPages": [min(pages), max(pages)],
            "lessonIds": ids,
        })
        ordered_ids.extend(ids)
    require(len(ordered_ids) == len(set(ordered_ids)) == 255 and set(ordered_ids) == set(by_id), "Route sections must partition the selected cards")

    catalog_entries = {entry["id"]: entry for entry in bundle["catalog"]["entries"]}
    for lesson_id in ordered_ids:
        require(lesson_id in catalog_entries, "Selected lesson absent from source catalogue")
        entry, lesson = catalog_entries[lesson_id], by_id[lesson_id]
        require(all(entry[key] == lesson[key] for key in ("id", "revision", "kind", "title", "status", "source")), "Source catalogue/lesson mismatch")
    catalog = copy.deepcopy(bundle["catalog"])
    catalog["entries"] = [copy.deepcopy(catalog_entries[lesson_id]) for lesson_id in ordered_ids]
    lessons = [copy.deepcopy(by_id[lesson_id]) for lesson_id in ordered_ids]

    overrides = {}
    for part, degrees in ((1, 111), (2, 90), (3, 15)):
        lesson_id = f"atanasyan-7-9-main-62-part-{part}"
        original = f"Найти смежный к ABC{degrees}°."
        require(by_id[lesson_id]["statement"]["text"] == original, "Display-only correction needs a fresh source review")
        overrides[lesson_id] = {
            "statementText": f"Найдите угол, смежный с углом ABC, если ∠ABC = {degrees}°.",
            "originalStatementText": original,
            "reason": "Уточнено отображение обозначения угла и его градусной меры. Данные и исходная карточка сохранены.",
        }

    return {
        "schemaVersion": 1,
        "id": "atanasyan-first-steps",
        "title": "К учебнику Атанасяна: от начала геометрии до построений",
        "description": "Задачи №1–160 и теория 1–23: условие, чертёж и разбор по шагам. Решения и доказательства обсуждаем с учителем.",
        "book": copy.deepcopy(bundle["catalog"]["book"]),
        "source": {
            "path": SOURCE_PATH.as_posix(),
            "sha256": SOURCE_SHA256,
            "bookId": BOOK_ID,
            "bookSha256": BOOK_SHA256,
            "bookFilename": bundle["sourceInventory"]["book"]["sourceFilename"],
            "selectionSha256": sha256(stable_bytes(lessons)),
        },
        "boundaries": {
            "exerciseNumbers": [1, 160],
            "theoryPoints": [1, 23],
            "printedPages": [5, 49],
            "completeWithinScope": True,
            "fullTextbookComplete": False,
        },
        "counters": {
            "exerciseNumbers": 160,
            "exerciseCards": 232,
            "theoryCards": 23,
            "cards": 255,
            "exerciseSteps": 682,
            "sections": len(sections),
        },
        "sections": sections,
        "displayOverrides": overrides,
        "catalog": catalog,
        "lessons": lessons,
    }


def build_bytes(source_path: Path = ROOT / SOURCE_PATH) -> bytes:
    source_bytes = source_path.read_bytes()
    require(sha256(source_bytes) == SOURCE_SHA256, "Canonical source SHA256 changed; audit the source before updating this route")
    projection = build_projection(json.loads(source_bytes))
    return (json.dumps(projection, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Compare exact generated bytes without writing any file")
    args = parser.parse_args(argv)
    try:
        generated = build_bytes()
        target = ROOT / TARGET_PATH
        if args.check:
            require(target.is_file() and target.read_bytes() == generated, "Bounded course is missing or differs from the deterministic projection")
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(generated)
        print(json.dumps({"gate": GATE, "checkOnly": args.check, "sourceSha256": SOURCE_SHA256, "courseSha256": sha256(generated), "cards": 255, "exerciseNumbers": 160, "sections": len(SECTION_SPECS)}))
        return 0
    except (KeyError, TypeError, ValueError, OSError) as error:
        print(f"{GATE}: FAILED: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
