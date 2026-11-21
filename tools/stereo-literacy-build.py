#!/usr/bin/env python3
"""Select reviewed Atanasyan textbook cards for the early stereometry route."""

import argparse
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ROUTE = Path("stereo-course/literacy/route.json")
SOURCE = Path("stereo-course/textbook/data/course.json")
OUTPUT = Path("stereo-course/literacy/data/course.json")
BOOK = "atanasyan-2024-10-11"
STAGE_POINTS = {
    "literacy": range(1, 4),
    "lines-and-planes": range(4, 12),
    "sections": range(12, 15),
    "perpendicular": range(15, 22),
    "linear-angle": range(22, 23),
}
STAGE_EXERCISES = {
    "literacy": range(1, 16),
    "lines-and-planes": range(16, 66),
    "sections": range(66, 116),
    "perpendicular": range(116, 166),
    "linear-angle": range(166, 177),
}
FIRST_LESSON = "atanasyan2024-theory-001"
LAST_LESSON = "ex-main-0167"


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def index_by_id(records):
    index = {}
    for record in records:
        identifier = record["id"]
        if identifier in index:
            raise ValueError(f"Duplicate source card: {identifier}")
        index[identifier] = record
    return index


def theory_references(value):
    if isinstance(value, dict):
        for key, child in value.items():
            if key == "theoryId":
                yield child
            elif key == "theoryIds":
                yield from child
            else:
                yield from theory_references(child)
    elif isinstance(value, list):
        for child in value:
            yield from theory_references(child)


def build(route, source):
    if set(route) != {"schemaVersion", "stages"} or type(route["schemaVersion"]) is not int or route["schemaVersion"] != 1:
        raise ValueError("Expected route schema version 1")
    stages = route["stages"]
    if not isinstance(stages, list) or any(not isinstance(stage, dict) for stage in stages) or [stage.get("id") for stage in stages] != list(STAGE_POINTS):
        raise ValueError("Unexpected route stages or stage order")
    if source["catalog"]["book"]["id"] != BOOK:
        raise ValueError("Unexpected source edition")

    lessons_by_id = index_by_id(source["lessons"])
    entries_by_id = index_by_id(source["catalog"]["entries"])
    chosen = {}
    for stage in stages:
        if set(stage) != {"id", "title", "description", "lessonIds"}:
            raise ValueError(f"Unexpected fields in stage: {stage['id']}")
        if any(not isinstance(stage[key], str) or not stage[key].strip() for key in ("title", "description")):
            raise ValueError(f"Missing title or description: {stage['id']}")
        ids = stage["lessonIds"]
        if not isinstance(ids, list) or not ids or any(not isinstance(identifier, str) for identifier in ids):
            raise ValueError(f"Expected a nonempty list of lesson IDs: {stage['id']}")

        expected_points = STAGE_POINTS[stage["id"]]
        expected_exercises = STAGE_EXERCISES[stage["id"]]
        found_points = []
        for identifier in ids:
            if identifier in chosen:
                raise ValueError(f"Repeated route lesson: {identifier}")
            lesson = lessons_by_id.get(identifier)
            entry = entries_by_id.get(identifier)
            if lesson is None or entry is None:
                raise ValueError(f"Unknown route lesson: {identifier}")
            if lesson["status"] != "reviewed" or lesson["source"]["bookId"] != BOOK:
                raise ValueError(f"Expected a reviewed Atanasyan lesson: {identifier}")
            for field in ("revision", "title", "kind", "status", "source"):
                if lesson[field] != entry[field]:
                    raise ValueError(f"Source catalog mismatch in {field}: {identifier}")

            point = lesson["source"].get("point")
            if point is not None:
                number = int(point)
                if number not in expected_points:
                    raise ValueError(f"Lesson outside stage points: {identifier}")
                if not found_points or number != found_points[-1]:
                    found_points.append(number)
            elif lesson["source"]["collection"] != "main" or int(lesson["source"]["exercise"]) not in expected_exercises:
                raise ValueError(f"Exercise outside stage points: {identifier}")
            chosen[identifier] = lesson

        if found_points != list(expected_points):
            raise ValueError(f"Missing or out-of-order theory points: {stage['id']}")

    if next(iter(chosen)) != FIRST_LESSON or next(reversed(chosen)) != LAST_LESSON:
        raise ValueError("Unexpected first or final lesson")
    for identifier, lesson in chosen.items():
        for reference in theory_references(lesson):
            if reference not in chosen or chosen[reference]["kind"] != "theory":
                raise ValueError(f"Unresolved theory reference {reference} in {identifier}")
    return {"schemaVersion": 1, "stages": stages, "lessons": list(chosen.values())}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Compare generated bytes without writing")
    args = parser.parse_args()
    try:
        bundle = build(read_json(ROOT / ROUTE), read_json(ROOT / SOURCE))
        generated = (json.dumps(bundle, ensure_ascii=False, separators=(",", ":"), allow_nan=False) + "\n").encode("utf-8")
        output = ROOT / OUTPUT
        if args.check:
            if output.read_bytes() != generated:
                raise ValueError(f"Outdated {OUTPUT}. Run tools/stereo-literacy-build.py")
        else:
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(generated)
    except (KeyError, OSError, TypeError, ValueError) as error:
        print(f"Stereometry route: {error}", file=sys.stderr)
        return 1
    print(f"Stereometry route: {len(bundle['stages'])} stages, {len(bundle['lessons'])} reviewed cards")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
