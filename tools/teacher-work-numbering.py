#!/usr/bin/env python3
"""Build the fixed grade/textbook numbering of the teacher work catalogue.

The ordered lists are editorial data in teacher-work-order.json. Rebuilding this
file never assigns a newly discovered work a number, and never derives a number
from a browser filter, a filename, or a mutable source-file order. Every new
work or edition needs an explicit update of its collection lists.

The source bank contains original MathExam exercises. Textbook references below
identify the relevant topics, not an exercise-by-exercise equivalence or the
publisher's own numbering of tests.
"""
from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path
import re
import subprocess


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "pedagogam/raboty/numbering.json"
REGISTRY_PATH = "pedagogam/raboty/numbering.json"
ORDER = ROOT / "tools/teacher-work-order.json"
PREFIX = "/pedagogam/raboty/"
KINDS = ("sr", "kr")
FILENAMES = {
    "sr": ("samostoyatelnaya.pdf", "samostoyatelnaya-otvety.pdf"),
    "kr": ("kontrolnaya.pdf", "kontrolnaya-otvety.pdf"),
}


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def parse_grades(label: str) -> list[int]:
    """Parse a grade label without filling gaps such as '8, 10–11 классы'."""
    match = re.fullmatch(r"([\d\s,\-–—]+)\s+класс(?:ы)?", label.strip())
    if not match:
        raise ValueError(f"Invalid grade label: {label!r}")
    prefix = match.group(1).strip()
    grades = set()
    for item in prefix.split(","):
        bounds = [int(n) for n in re.split(r"\s*[-–—]\s*", item.strip())]
        if len(bounds) == 1:
            grades.add(bounds[0])
        elif len(bounds) == 2 and bounds[0] <= bounds[1]:
            grades.update(range(bounds[0], bounds[1] + 1))
        else:
            raise ValueError(f"Invalid grade range: {label!r}")
    if not grades or not grades <= set(range(5, 12)):
        raise ValueError(f"Unsupported school grade: {label!r}")
    return sorted(grades)


def _check_grades(grades, label):
    if (not isinstance(grades, list) or not grades
            or any(type(g) is not int or g not in range(5, 12) for g in grades)
            or grades != sorted(set(grades))):
        raise ValueError(f"Invalid explicit grades for {label}: {grades!r}")


def _require_same(actual, expected, label):
    if actual != expected:
        added, removed = sorted(expected - actual), sorted(actual - expected)
        raise ValueError(
            f"{label}: explicit numbering coverage differs; "
            f"missing={added}, unexpected={removed}. Update the reviewed order lists."
        )


def _safe_relative(path):
    value = str(path)
    parts = Path(value).parts
    if not value or Path(value).is_absolute() or ".." in parts or "\\" in value:
        raise ValueError(f"Unsafe repository-relative reference: {value!r}")
    return value


def _safe_download(path):
    path = _safe_relative(path)
    if not re.fullmatch(r"[a-z0-9-]+/[a-z0-9-]+\.(?:pdf|docx)", path):
        raise ValueError(f"Unexpected work download path: {path!r}")
    return PREFIX + path


def _source_reference(pack, book, coverage_by_title):
    """Pick only evidence belonging to the selected edition, never a neighbour."""
    direct = [r for r in pack["source_refs"]
              if r["path"] != "tools/teacher-textbook-coverage.json"
              and r["path"] in book.get("sourcePaths", [])
              and (not book.get("referencePrefix")
                   or r["sections"].startswith(book["referencePrefix"]))]
    if direct:
        text = "; ".join(dict.fromkeys(r["sections"] for r in direct))
        paths = list(dict.fromkeys(_safe_relative(r["path"]) for r in direct))
        return text, paths

    coverage = coverage_by_title.get(book["title"])
    if coverage and pack["id"] in coverage["pack_ids"]:
        pages = ", ".join(map(str, coverage["checked_pdf_pages"]))
        text = f'Тема «{pack["title"]}». Оглавление этого издания: страницы PDF {pages}.'
        note = coverage.get("pack_prerequisite_notes", {}).get(pack["id"])
        if note:
            text += " " + note.strip()
        return text, ["tools/teacher-textbook-coverage.json"]
    raise ValueError(f'No edition-specific topic evidence: {book["title"]} / {pack["id"]}')


def build_registry(*, bank=None, word=None, coverage=None, order=None, root=ROOT):
    """Return a checked public registry without writing or modifying source data."""
    root = Path(root)
    bank = copy.deepcopy(bank if bank is not None else read_json(root / "pedagogam/raboty/bank.json"))
    word = copy.deepcopy(word if word is not None else read_json(root / "pedagogam/raboty/word-packs.json"))
    coverage = copy.deepcopy(coverage if coverage is not None else read_json(root / "tools/teacher-textbook-coverage.json"))
    order = copy.deepcopy(order if order is not None else read_json(root / "tools/teacher-work-order.json"))
    if order.get("schemaVersion") != 1:
        raise ValueError("Unsupported numbering order schema")
    if not isinstance(order.get("edition"), str) or not order["edition"].strip():
        raise ValueError("Numbering edition must be an explicit non-empty string")
    packs = {p["id"]: p for p in bank}
    if not packs or len(packs) != len(bank):
        raise ValueError("Empty source bank or duplicate pack IDs")
    book_titles = {b for p in bank for b in p["books"]}
    books = order["books"]
    by_book_id = {b["id"]: b for b in books}
    by_book_title = {b["title"]: b for b in books}
    if len(by_book_id) != len(books) or len(by_book_title) != len(books):
        raise ValueError("Duplicate textbook identity in fixed numbering")
    _require_same(set(by_book_title), book_titles, "Textbooks")
    aliases = coverage.get("existing_title_aliases", {})
    coverage_by_title = {aliases.get(b["title"], b["title"]): b for b in coverage["books"]}
    for book in books:
        if not re.fullmatch(r"book-[a-f0-9]{10}", book["id"]):
            raise ValueError(f'Invalid stable textbook ID: {book["id"]}')
        _check_grades(book["grades"], book["title"])
        if not book.get("gradeEvidence") or not book.get("orderBasis"):
            raise ValueError(f'Missing editorial provenance for {book["title"]}')
        for path in book["sourcePaths"]:
            _safe_relative(path)
            if not (root / path).is_file():
                raise ValueError(f"Missing numbering evidence: {path}")
        # Additional editions have explicit grade metadata in the checked
        # source inventory. A change cannot silently create a new grade scope.
        covered = coverage_by_title.get(book["title"])
        if covered and set(covered["grades"]) != set(book["grades"]):
            raise ValueError(f'Edition grades changed in source inventory: {book["title"]}')

    works, corrections = {}, []
    for pack_id, pack in sorted(packs.items()):
        if not re.fullmatch(r"[a-z0-9-]+", pack_id):
            raise ValueError(f"Invalid pack ID: {pack_id}")
        if set(pack["book_grades"]) != set(pack["books"]):
            raise ValueError(f"Incomplete book-grade source mapping: {pack_id}")
        grades = sorted({g for gs in pack["book_grades"].values() for g in gs})
        _check_grades(grades, pack_id)
        # General grade availability is intentionally not narrowed by an
        # edition correction: a reusable topic may remain useful in both grades.
        if grades != parse_grades(pack["grade"]):
            raise ValueError(f"General grade label differs from bank mappings: {pack_id}")
        book_grades = {}
        for title, raw in sorted(pack["book_grades"].items()):
            book = by_book_title[title]
            _check_grades(raw, f"{pack_id} / {title}")
            applicable = sorted(set(raw) & set(book["grades"]))
            if not applicable:
                raise ValueError(f"Work has no grade in its assigned edition: {pack_id} / {title}")
            book_grades[book["id"]] = applicable
            if applicable != raw:
                corrections.append({
                    "bankId": pack_id, "bookId": book["id"], "bookTitle": title,
                    "previousGrades": raw, "grades": applicable,
                    "excludedGrades": sorted(set(raw) - set(applicable)),
                    "reason": "Класс подборки ограничен классами конкретного издания; общая применимость темы сохранена.",
                    "evidence": book["gradeEvidence"],
                    "sourcePaths": book["sourcePaths"],
                })
        for kind in KINDS:
            work_id = f"{pack_id}:{kind}"
            student, teacher = FILENAMES[kind]
            works[work_id] = {
                "id": work_id, "bankId": pack_id, "kind": kind, "format": "pdf",
                "title": pack["title"], "subject": pack["subject"], "grades": grades,
                "bookGrades": book_grades,
                "studentUrl": _safe_download(f"{pack_id}/{student}"),
                "teacherUrl": _safe_download(f"{pack_id}/{teacher}"),
            }
    seen_word = set()
    for pack in sorted(word["packs"], key=lambda p: p["id"]):
        work_id = "word:" + pack["id"]
        if work_id in works or pack["id"] in seen_word:
            raise ValueError(f"Duplicate Word work identity: {work_id}")
        seen_word.add(pack["id"])
        bank_id = pack["bankId"]
        if bank_id not in packs:
            raise ValueError(f"Word work has no topic in the source bank: {work_id}")
        grades = parse_grades(pack["grade"])
        # Word packs are separate standalone works, not alternate file formats
        # of the PDF questions. Their general grades and serials are independent.
        pdf_book_grades = works[f"{bank_id}:sr"]["bookGrades"]
        book_grades = {bid: sorted(set(gs) & set(grades)) for bid, gs in pdf_book_grades.items()
                       if set(gs) & set(grades)}
        works[work_id] = {
            "id": work_id, "bankId": bank_id, "kind": "sr", "format": "docx",
            "title": pack["title"], "subject": packs[bank_id]["subject"], "grades": grades,
            "bookGrades": book_grades,
            "studentUrl": _safe_download(pack["studentFile"]),
            "teacherUrl": _safe_download(pack["teacherFile"]),
        }

    expected_scopes = {f"grade-{g}" for g in range(5, 12)}
    for bid in by_book_id:
        grades = {g for work in works.values() for g in work["bookGrades"].get(bid, [])}
        expected_scopes.update(f"{bid}-{g}" for g in grades)
    collections = order["collections"]
    scope_ids = [c["id"] for c in collections]
    if len(scope_ids) != len(set(scope_ids)):
        raise ValueError("Duplicate numbering collection ID")
    _require_same(set(scope_ids), expected_scopes, "Collections")
    public_collections = []
    for collection in collections:
        grade, bid = collection["grade"], collection["bookId"]
        if type(grade) is not int or grade not in range(5, 12):
            raise ValueError(f'Invalid collection grade: {collection["id"]}')
        expected_id = f"{bid}-{grade}" if bid else f"grade-{grade}"
        if collection["id"] != expected_id:
            raise ValueError(f'Collection identity mismatch: {collection["id"]}')
        if bid is not None and bid not in by_book_id:
            raise ValueError(f"Unknown collection textbook: {bid}")
        book = by_book_id[bid] if bid else None
        if collection["bookTitle"] != (book["title"] if book else None):
            raise ValueError(f'Collection book title mismatch: {collection["id"]}')
        if book and grade not in book["grades"]:
            raise ValueError(f'Collection grade is outside its edition: {collection["id"]}')
        eligible = {wid for wid, work in works.items()
                    if grade in (work["bookGrades"].get(bid, []) if bid else work["grades"])}
        references, reference_sources = {}, {}
        for kind in KINDS:
            ids = collection[kind]
            if not isinstance(ids, list) or len(ids) != len(set(ids)):
                raise ValueError(f'Duplicate work number in {collection["id"]} / {kind}')
            required = {wid for wid in eligible if works[wid]["kind"] == kind}
            _require_same(set(ids), required, f'{collection["id"]} / {kind}')
            for wid in ids:
                work = works[wid]
                source_pack = packs[work["bankId"]]
                if book:
                    text, paths = _source_reference(source_pack, book, coverage_by_title)
                    if work["format"] == "docx":
                        text = "Отдельная самостоятельная работа Word по этой теме. " + text
                else:
                    text = f'Тема «{work["title"]}». Порядок общей подборки MathExam для {grade} класса.'
                    paths = []
                references[wid], reference_sources[wid] = text, paths
        if not collection.get("orderBasis"):
            raise ValueError(f'Missing order basis: {collection["id"]}')
        public = copy.deepcopy(collection)
        public["references"] = references
        public["referenceSources"] = reference_sources
        public["scopeNote"] = (
            "Авторские работы MathExam по указанным темам. Номера действуют в этой подборке; "
            "это не номера упражнений или контрольных работ издательства."
        )
        public_collections.append(public)

    public_books = [{k: b[k] for k in ("id", "title", "grades", "gradeEvidence", "orderBasis", "sourcePaths")}
                    for b in books]
    return {
        "schemaVersion": 1,
        "edition": order["edition"],
        "policy": order["policy"],
        "books": public_books,
        "works": works,
        "collections": public_collections,
        "corrections": corrections,
        "counts": {
            "books": len(public_books), "works": len(works),
            "generalCollections": 7, "textbookCollections": len(public_collections) - 7,
            "numberAssignments": sum(len(c[k]) for c in public_collections for k in KINDS),
            "correctedEditionMemberships": len(corrections),
        },
    }


def serialized(registry):
    return json.dumps(registry, ensure_ascii=False, indent=2) + "\n"


def validate_stable_numbers(previous, candidate):
    """Keep every saved serial in the same edition; new work may only append.

    The registry builder validates membership and source evidence separately.
    This comparison protects existing numbers across editorial changes, which
    cannot be checked by looking at the candidate's consecutive lists alone.
    An explicit edition change permits a newly reviewed numbering scheme.
    """
    for label, registry in (("previous", previous), ("candidate", candidate)):
        if not isinstance(registry, dict) or registry.get("schemaVersion") != 1:
            raise ValueError(f"Unsupported {label} numbering registry schema")
        if not isinstance(registry.get("edition"), str) or not registry["edition"].strip():
            raise ValueError(f"Missing {label} numbering edition")
    if previous["edition"] != candidate["edition"]:
        return
    before, after = {}, {}
    for label, registry, indexed in (("previous", previous, before),
                                     ("candidate", candidate, after)):
        if not isinstance(registry.get("collections"), list):
            raise ValueError(f"Invalid {label} numbering collections")
        for collection in registry["collections"]:
            cid = collection.get("id") if isinstance(collection, dict) else None
            if not isinstance(cid, str) or not cid or cid in indexed:
                raise ValueError(f"Invalid or duplicate {label} numbering collection")
            for kind in KINDS:
                ids = collection.get(kind)
                if (not isinstance(ids, list) or any(not isinstance(wid, str) for wid in ids)
                        or len(ids) != len(set(ids))):
                    raise ValueError(f"Invalid {label} numbering list: {cid} / {kind}")
            indexed[cid] = collection
    for cid, old in before.items():
        if cid not in after:
            raise ValueError(f"Fixed numbering collection removed within edition: {cid}")
        new = after[cid]
        if any(old.get(field) != new.get(field) for field in ("grade", "bookId")):
            raise ValueError(f"Fixed numbering collection identity changed: {cid}")
        for kind in KINDS:
            for index, work_id in enumerate(old[kind]):
                actual = new[kind][index] if index < len(new[kind]) else "<removed>"
                if actual != work_id:
                    raise ValueError(
                        f"Fixed numbering changed in {cid} / {kind} at number {index + 1}: "
                        f"{work_id} -> {actual}. Append new works or explicitly change edition."
                    )


def read_baseline_registry(ref, *, root=ROOT):
    """Read a prior Git registry; only a genuinely absent path returns None."""
    def git(*args):
        result = subprocess.run(["git", *args], cwd=root, capture_output=True, text=True)
        if result.returncode:
            raise ValueError(f"Cannot read numbering baseline {ref!r}: {result.stderr.strip()}")
        return result.stdout

    commit = git("rev-parse", "--verify", "--end-of-options", ref + "^{commit}").strip()
    entry = git("ls-tree", "--full-tree", "-z", commit, "--", REGISTRY_PATH)
    if not entry:
        return None
    entries = entry.rstrip("\0").split("\0")
    metadata, separator, path = entries[0].partition("\t")
    fields = metadata.split()
    if (len(entries) != 1 or not separator or path != REGISTRY_PATH
            or len(fields) != 3 or fields[1] != "blob" or fields[0] not in ("100644", "100755")):
        raise ValueError(f"Numbering baseline is not a regular registry file: {ref!r}")
    try:
        return json.loads(git("show", f"{commit}:{REGISTRY_PATH}"))
    except json.JSONDecodeError as error:
        raise ValueError(f"Invalid JSON in numbering baseline {ref!r}") from error


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if the checked-in registry is stale")
    parser.add_argument("--baseline-ref", help="also preserve numbers from this Git commit/ref; requires local history")
    args = parser.parse_args()
    data = build_registry()
    if OUT.is_file():
        validate_stable_numbers(read_json(OUT), data)
    if args.baseline_ref:
        previous = read_baseline_registry(args.baseline_ref)
        if previous is None:
            print(f"NUMBERING_BASELINE_ABSENT {args.baseline_ref}: registry not yet present at this commit")
        else:
            validate_stable_numbers(previous, data)
    result = serialized(data)
    if args.check:
        if not OUT.is_file() or OUT.read_text(encoding="utf-8") != result:
            raise SystemExit("Numbering registry is stale; run tools/teacher-work-numbering.py")
    else:
        OUT.write_text(result, encoding="utf-8")
    print("TEACHER_WORK_NUMBERING_OK " + json.dumps(data["counts"], ensure_ascii=False))


if __name__ == "__main__":
    main()
