#!/usr/bin/env python3
"""Rebuild auditable exercise coverage; source metadata contains no book prose.

Default: report the current counts. --write refreshes coverage.json.
--check fails if the checked-in coverage does not match current units.
--verify-source DIR additionally checks the supplied PDFs' hashes and the
sequential number evidence in pdftotext -layout part1.txt / part2.txt.
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "courses/vilenkin-6-part-1/textbook-data"
CATALOG = DATA / "source-catalog.json"
OUTPUT = DATA / "coverage.json"
VERIFICATIONS = DATA / "full-exercise-verifications.json"
MAIN_COUNTS = {1: 198, 2: 540, 3: 193, 4: 399, 5: 133, 6: 126}


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def check_catalog(catalog: dict) -> None:
    entries = catalog["entries"]
    assert len({entry["id"] for entry in entries}) == len(entries), "Duplicate source IDs"
    points = {point["id"]: point for point in catalog["hierarchy"]["points"]}
    assert set(points) == set(range(1, 45)), "Expected the 44 numbered points"
    for paragraph, count in MAIN_COUNTS.items():
        found = [entry for entry in entries if entry["kind"] == "exercise"
                 and entry["paragraph"] == paragraph]
        assert [entry["sequenceNumber"] for entry in found] == [
            f"{paragraph}.{number}" for number in range(1, count + 1)
        ], f"Broken sequence in paragraph {paragraph}"
    for entry in entries:
        assert entry["pdfPage"] == entry["printedPage"] + 1, entry["id"]
        if entry["pointId"] is not None:
            point = points[entry["pointId"]]
            assert (entry["bookPart"], entry["chapter"], entry["paragraph"]) == (
                point["bookPart"], point["chapter"], point["paragraph"]
            ), entry["id"]
            assert point["printedPage"] <= entry["printedPage"] <= point["endPrintedPage"], entry["id"]
            if entry["kind"] == "exercise":
                number = int(entry["sequenceNumber"].split(".")[1])
                assert int(point["firstSequenceNumber"].split(".")[1]) <= number <= int(
                    point["lastSequenceNumber"].split(".")[1]
                ), entry["id"]
        if entry["kind"] == "exercise" and entry["number"] != entry["sequenceNumber"]:
            assert (entry["number"], entry["sequenceNumber"], entry["printedPage"]) == (
                "7.361", "4.361", 66
            ), "Unreviewed printed-number anomaly"
    assert not catalog["inventoryScope"]["allTextbookTasksEnumerated"]
    assert not catalog["inventoryScope"]["subpartsComplete"]


def verify_source(catalog: dict, directory: Path) -> None:
    """Only accept the actual supplied edition, not an arbitrary same-title PDF."""
    for source in catalog["sources"]:
        path = directory / source["filename"]
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        assert digest == source["sha256"], f"Different source edition/file: {path.name}"
        part = source["bookPart"]
        pages = (directory / f"part{part}.txt").read_text(encoding="utf-8").split("\f")
        for paragraph, count in MAIN_COUNTS.items():
            expected_entries = [entry for entry in catalog["entries"]
                                if entry["bookPart"] == part
                                and entry["kind"] == "exercise"
                                and entry["paragraph"] == paragraph]
            if not expected_entries:
                continue
            first = expected_entries[0]["printedPage"]
            last = expected_entries[-1]["printedPage"]
            position = 0
            for page in range(first, last + 1):
                for match in re.finditer(r"^\s*([1-7]\.\d+)(?=\s)", pages[page], re.M):
                    if position == count:
                        break
                    entry = expected_entries[position]
                    if match[1] == entry["number"]:
                        assert page == entry["printedPage"], entry["id"]
                        position += 1
            assert position == count, f"Source number missing: part {part}, paragraph {paragraph}"
        applied_groups = defaultdict(list)
        for entry in catalog["entries"]:
            if entry["bookPart"] == part and entry["kind"] == "applied":
                applied_groups[entry["paragraph"]].append(entry)
        for paragraph, expected_entries in applied_groups.items():
            position = 0
            first = expected_entries[0]["printedPage"]
            last = expected_entries[-1]["printedPage"]
            for page in range(first, last + 1):
                text = pages[page]
                if page == first:
                    assert "ПРИМЕНЯЕМ МАТЕМАТИКУ" in text
                    text = text.split("ПРИМЕНЯЕМ МАТЕМАТИКУ", 1)[1]
                for match in re.finditer(r"^\s*(\d+)\.\s+", text, re.M):
                    if position < len(expected_entries) and match[1] == expected_entries[position]["number"]:
                        assert page == expected_entries[position]["printedPage"]
                        position += 1
            assert position == len(expected_entries), f"Incomplete applied rubric {paragraph}"
        for kind, prefix, count in [("final-review-exercise", "П", 113),
                                    ("final-review-question", "В", 65)]:
            if part != 2:
                continue
            expected_entries = [entry for entry in catalog["entries"] if entry["kind"] == kind]
            position = 0
            for page in range(124, 138):
                for match in re.finditer(r"^\s*(" + prefix + r"\.\d+)(?=\s)", pages[page], re.M):
                    if position < count and match[1] == expected_entries[position]["number"]:
                        assert page == expected_entries[position]["printedPage"]
                        position += 1
            assert position == count, f"Incomplete {kind} evidence"


def canonical_sha256(value) -> str:
    return hashlib.sha256(json.dumps(
        value, ensure_ascii=False, sort_keys=True, separators=(",", ":")
    ).encode("utf-8")).hexdigest()


def verify_complete_exercises(catalog: dict, selections: dict, tasks: dict,
                              manifest: dict | None = None) -> dict:
    """Completion needs explicit source enumeration and independent exact-content proof.

    Card counts never imply completion. A reviewed subset hash intentionally remains
    valid when unrelated exercises are added to the same unit file.
    """
    if manifest is None:
        manifest = read_json(VERIFICATIONS)
    assert manifest["schemaVersion"] == 1, "Unsupported completeness manifest"
    entries = {entry["id"]: entry for entry in catalog["entries"]}
    sources = {source["bookPart"]: source for source in catalog["sources"]}
    verified = {}
    for item in manifest["fullExerciseVerifications"]:
        source_id = item["sourceId"]
        assert source_id not in verified, f"Duplicate completeness declaration: {source_id}"
        assert source_id in entries, f"Unknown complete source: {source_id}"
        entry = entries[source_id]
        assert entry["kind"] == "exercise", f"Unsupported completion kind: {source_id}"
        assert item["sourcePdfSha256"] == sources[entry["bookPart"]]["sha256"], source_id
        assert (item["printedPage"], item["pdfPage"]) == (
            entry["printedPage"], entry["pdfPage"]
        ), f"Wrong completion source page: {source_id}"
        subparts = item["sourceSubparts"]
        assert subparts and item["allSourceSubpartsEnumerated"] is True, source_id
        parts = [part["part"] for part in subparts]
        ids = [part["taskId"] for part in subparts]
        assert len(set(parts)) == len(parts), f"Duplicate source subpart: {source_id}"
        assert len(set(ids)) == len(ids), f"Duplicate complete task: {source_id}"
        actual = selections.get(source_id, [])
        assert set(ids) == {selection["taskId"] for selection in actual}, (
            f"Complete exercise selections differ: {source_id}"
        )
        actual_parts = {selection["taskId"]: selection["selectedSubpart"] for selection in actual}
        assert all(actual_parts[part["taskId"]] == part["part"] for part in subparts), (
            f"Complete exercise subpart mapping differs: {source_id}"
        )
        evidence = item["independentReview"]
        relative = Path(evidence["file"])
        assert not relative.is_absolute() and ".." not in relative.parts, source_id
        review_path = ROOT / relative
        assert hashlib.sha256(review_path.read_bytes()).hexdigest() == evidence["sha256"], (
            f"Independent review evidence changed: {source_id}"
        )
        review = read_json(review_path)
        assert review["status"] == "PASS", f"Independent review failed: {source_id}"
        matches = [row for row in review["exercises"] if row["sourceId"] == source_id]
        assert len(matches) == 1, f"Missing or duplicate source review: {source_id}"
        proof = matches[0]
        assert proof["status"] == "PASS", source_id
        assert proof["reviewer"] and proof["author"] and proof["reviewer"] != proof["author"], (
            f"Independent reviewer required: {source_id}"
        )
        assert proof["sourcePdfSha256"] == item["sourcePdfSha256"], source_id
        assert (proof["printedPage"], proof["pdfPage"], proof["exerciseNumber"]) == (
            entry["printedPage"], entry["pdfPage"], entry["number"]
        ), source_id
        assert proof["requiredParts"] == parts and proof["taskIds"] == ids, (
            f"Reviewed full subpart list differs: {source_id}"
        )
        assert proof["sourceSubpartsChecked"] == len(parts), source_id
        ordered_tasks = [tasks[task_id] for task_id in ids]
        assert canonical_sha256(ordered_tasks) == proof["contentSha256"], (
            f"Reviewed exercise content changed: {source_id}"
        )
        for task in ordered_tasks:
            assert canonical_sha256(task) == proof["canonicalTaskSha256"][task["id"]], (
                f"Reviewed task changed: {task['id']}"
            )
        verified[source_id] = {
            "sourcePdfSha256": item["sourcePdfSha256"],
            "sourceSubparts": subparts,
            "independentReview": evidence,
            "reviewedContentSha256": proof["contentSha256"],
        }
    return verified


def build_coverage(catalog: dict) -> dict:
    by_key = {}
    for entry in catalog["entries"]:
        if entry["kind"] == "exercise":
            by_key[(entry["bookPart"], entry["number"], entry["printedPage"])] = entry
        elif entry["kind"] == "check-exercise" and "sourceSelectionNumber" in entry:
            by_key[(entry["bookPart"], entry["sourceSelectionNumber"], entry["printedPage"])] = entry
    selections = defaultdict(list)
    supplementary = []
    task_ids = set()
    tasks_by_id = {}
    unit_ids = set()
    for path in sorted(DATA.glob("units-*.json")):
        for unit in read_json(path):
            assert unit["id"] not in unit_ids, f"Duplicate unit {unit['id']}"
            unit_ids.add(unit["id"])
            for task in unit["tasks"]:
                assert task["id"] not in task_ids, f"Duplicate task {task['id']}"
                task_ids.add(task["id"])
                tasks_by_id[task["id"]] = task
                source = task["source"]
                selection = {"taskId": task["id"], "unitId": unit["id"],
                             "selectedSubpart": source.get("part", ""),
                             "sourceKind": source["kind"]}
                # Current units-A..D all belong to the verified first part.
                entry = by_key.get((1, source.get("number"), source["page"]))
                if entry:
                    assert entry["pointId"] == unit["id"], f"Wrong point: {task['id']}"
                    selections[entry["id"]].append(selection)
                else:
                    assert source["kind"] in ("example", "question"), (
                        f"Unmatched exercise source: {task['id']}: {source}"
                    )
                    supplementary.append({**selection, "bookPart": 1,
                                          "printedPage": source["page"],
                                          "number": source.get("number")})
    verified = verify_complete_exercises(catalog, selections, tasks_by_id)
    rows = []
    counts = defaultdict(Counter)
    by_part = defaultdict(Counter)
    for entry in catalog["entries"]:
        selected = selections[entry["id"]]
        # Presence of one selected subpart does not prove the whole number is done.
        status = "complete" if entry["id"] in verified else "partial-selected" if selected else "missing"
        row = {"sourceId": entry["id"], "bookPart": entry["bookPart"],
                     "kind": entry["kind"], "number": entry["number"],
                     "pointId": entry["pointId"], "status": status,
                     "allSubpartsVerified": entry["id"] in verified, "selections": selected}
        if entry["id"] in verified:
            row["completenessEvidence"] = verified[entry["id"]]
        rows.append(row)
        counts[entry["kind"]][status] += 1
        by_part[entry["bookPart"]][status] += 1
    summarize = lambda counter: {"total": sum(counter.values()), "complete": counter["complete"],
                                  "partial-selected": counter["partial-selected"],
                                  "missing": counter["missing"]}
    return {
        "schemaVersion": 1,
        "sourceCatalog": "source-catalog.json",
        "sourceCatalogSha256": hashlib.sha256(CATALOG.read_bytes()).hexdigest(),
        "fullExerciseVerifications": VERIFICATIONS.name,
        "fullExerciseVerificationsSha256": hashlib.sha256(VERIFICATIONS.read_bytes()).hexdigest(),
        "statusDefinitions": {
            "complete": "Все перечисленные подпункты номера сверены с источником и имеют независимую проверку точного содержимого. Это не оценка усвоения учеником и не подтверждение публикации.",
            "partial-selected": "Есть выбранные задания к номеру; полный охват всех подпунктов не подтверждён.",
            "missing": "В текущих units-A..D нет тренажёра, привязанного к этому номеру.",
        },
        "summary": {
            "units": len(unit_ids), "selectedTaskCards": len(task_ids),
            "mappedTaskCards": len(task_ids) - len(supplementary),
            "supplementaryTaskCards": len(supplementary),
            "byKind": {kind: summarize(counter) for kind, counter in sorted(counts.items())},
            "byBookPart": {str(part): summarize(counter) for part, counter in sorted(by_part.items())},
            "wholeCourseComplete": False,
            "allTextbookTasksEnumerated": False,
            "subpartsInventoryComplete": False,
            "unexpandedCheckGroups": sum(not group["localTasksEnumerated"]
                                           for group in catalog["checkGroups"]),
        },
        "scopeNote": "Число карточек и число номеров учебника — разные показатели. "
                     "Полный указатель номеров не означает полного курса. Локальные проверочные "
                     "работы и все подпункты ещё требуют полного перечисления и разбора.",
        "entries": rows,
        "supplementarySelections": supplementary,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--verify-source", type=Path, metavar="DIR")
    args = parser.parse_args()
    catalog = read_json(CATALOG)
    check_catalog(catalog)
    if args.verify_source:
        verify_source(catalog, args.verify_source)
    coverage = build_coverage(catalog)
    serialized = json.dumps(coverage, ensure_ascii=False, indent=2) + "\n"
    if args.write:
        OUTPUT.write_text(serialized, encoding="utf-8")
    if args.check:
        assert OUTPUT.read_text(encoding="utf-8") == serialized, (
            "coverage.json is stale; run coverage-inventory.py --write"
        )
    print(json.dumps(coverage["summary"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
