#!/usr/bin/env python3
"""Inventory the author bank without redistributing problem text or figures."""

import argparse
from collections import Counter, defaultdict
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path


POSITIONS = tuple(n for n in range(1, 26) if n != 19)
SOURCE_COVERAGE = Path(__file__).with_name("source-coverage-20261116.json")
AUTHOR_BANK_SHA = "719ecb2ed53b59a78a3f8ad3cefef2c2260d3d2d0a7ff88607f5d202761f1404"


def load_author_bank(path):
    raw = path.read_bytes()
    if sha256(raw).hexdigest() != AUTHOR_BANK_SHA:
        raise ValueError("Bank hash does not match the recovered catalogue source.")
    variants = json.loads(raw)["variants"]
    if [variant["number"] for variant in variants] != list(range(1, 105)):
        raise ValueError("Expected the numbered 104-variant author bank.")
    return variants


def subtype(task):
    oracle = task["oracle"]
    params = oracle.get("params", {})
    return params.get("operation") or params.get("family") or oracle["kind"]


def by_position(variants):
    groups = defaultdict(lambda: defaultdict(list))
    for variant in variants:
        number = variant["number"]
        tasks = variant["tasks"]
        if [task["number"] for task in tasks] != list(range(1, 26)):
            raise ValueError(f"Unexpected numbering in variant {number}.")
        if (variant["time_minutes"], variant["max_points"]) != (235, 31):
            raise ValueError(f"Unexpected exam format in variant {number}.")
        for task in tasks:
            position = task["number"]
            points = 1 if position < 20 else 2
            if (task["part"], task["points"]) != (points, points):
                raise ValueError(f"Unexpected part or points at {number}.{position}.")
            if position not in POSITIONS:
                continue
            family = subtype(task)
            if position <= 5:
                family = f"{variant['context_family']}/{family}"
            groups[position][family].append(number)
    return {
        position: dict(sorted(groups[position].items()))
        for position in POSITIONS
    }


def find_matches(variants, check):
    number = check["position"]
    allowed_variants = set(check["variants"])
    matches = []
    for variant in variants:
        if variant["number"] in allowed_variants:
            task = variant["tasks"][number - 1]
            match = {"variant": variant["number"], "family": subtype(task)}
            if task["part"] == 1:
                match["answer_denominator"] = Fraction(task["answer"]).denominator
            matches.append(match)
    return matches


def audit(variants, coverage):
    by_number = by_position(variants)
    for position, groups in by_number.items():
        if sorted(variant for group in groups.values() for variant in group) != list(range(1, 105)):
            raise ValueError(f"An inventory row is missing or duplicated at №{position}.")

    sources = {source["id"] for source in coverage["sources"]}
    demo_positions = set()
    checks = []
    for check in coverage["checks"]:
        position = check["position"]
        if position not in POSITIONS or check["source"] not in sources:
            raise ValueError(f"Invalid source or position in {check['id']}.")
        if check["source"] == "fipi-2027":
            demo_positions.add(position)
        matches = find_matches(variants, check)
        if len(matches) != len(check["variants"]) or len(matches) != check["expected"]:
            raise ValueError(f"{check['id']}: expected {check['expected']}, found {len(matches)}.")
        checks.append({"id": check["id"], "position": position, "variants": matches})
    if demo_positions != set(POSITIONS):
        raise ValueError("The approved demo needs an evidence row at every reviewed position.")

    context_counts = Counter(variant["context_family"] for variant in variants)
    if len(context_counts) != 8 or set(context_counts.values()) != {13}:
        raise ValueError("Unexpected allocation of the eight practical contexts.")
    return {
        "bank_sha256": AUTHOR_BANK_SHA,
        "variants": len(variants),
        "positions": list(POSITIONS),
        "reviewed_positions_in_variants": len(variants) * len(POSITIONS),
        "contexts": dict(sorted(context_counts.items())),
        "source_checks": checks,
        "families_and_variant_numbers": by_number,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bank", type=Path, help="Path to the recovered materials/bank.json")
    parser.add_argument("--output", type=Path, help="Write the inventory as JSON")
    args = parser.parse_args()
    coverage = json.loads(SOURCE_COVERAGE.read_text(encoding="utf-8"))
    result = audit(load_author_bank(args.bank), coverage)
    if args.output:
        args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "variants": result["variants"],
        "positions_in_variants": result["reviewed_positions_in_variants"],
        "source_checks": len(result["source_checks"]),
        "status": "OGE_PDF_SOURCE_INVENTORY_OK",
    }))


if __name__ == "__main__":
    main()
