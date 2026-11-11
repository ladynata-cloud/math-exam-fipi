#!/usr/bin/env python3
"""Validate the frozen course bank, exact arithmetic evidence and coverage.

Run from any working directory. Only the Python standard library is required.
The authored oracle expressions are interpreted as a tiny arithmetic language;
they are never passed to eval/exec. Semantic mathematics review is separate.
"""

import argparse
import ast
import collections
from fractions import Fraction
import hashlib
import json
import math
from pathlib import Path
import re
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parent
EXPECTED_ROUTES = {"g5", "g6", "g7", "g7u", "g8", "g8u", "g10"}
EXPECTED_COUNTS = {"lessons": 82, "tasks": 492, "steps": 1284}


def numeric(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def exact(node):
    """Evaluate only constants, arithmetic and abs with rational operands."""
    if isinstance(node, ast.Expression):
        return exact(node.body)
    if isinstance(node, ast.Constant) and numeric(node.value):
        return Fraction(str(node.value))
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.USub, ast.UAdd)):
        value = exact(node.operand)
        return -value if isinstance(node.op, ast.USub) else value
    if isinstance(node, ast.BinOp):
        left, right = exact(node.left), exact(node.right)
        if isinstance(node.op, ast.Add):
            return left + right
        if isinstance(node.op, ast.Sub):
            return left - right
        if isinstance(node.op, ast.Mult):
            return left * right
        if isinstance(node.op, ast.Div):
            return left / right
        if isinstance(node.op, ast.Pow):
            return left ** right
        if isinstance(node.op, ast.Mod):
            return left % right
        if isinstance(node.op, ast.FloorDiv):
            return left // right
    if (isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
            and node.func.id == "abs" and len(node.args) == 1 and not node.keywords):
        return abs(exact(node.args[0]))
    raise ValueError("Unsupported oracle syntax: " + ast.dump(node))


def evaluate(expression):
    tree = ast.parse(expression, mode="eval")
    if len(list(ast.walk(tree))) > 100:
        raise ValueError("Oracle expression is too large")
    value = float(exact(tree))
    if not math.isfinite(value):
        raise ValueError("Oracle result is not finite")
    return value


def validate(data, coverage, source_digest):
    failures = []
    counts = collections.Counter()
    seen = set()
    lessons = {}
    tasks = {}
    routes = {route["id"]: route for route in data["routes"]}

    def check(condition, message):
        if not condition:
            failures.append(message)

    def unique(identifier, kind):
        check(identifier not in seen, f"Duplicate {kind} id: {identifier}")
        check(bool(re.fullmatch(r"[a-z0-9-]+", identifier)), f"Invalid {kind} id: {identifier}")
        seen.add(identifier)

    check(set(routes) == EXPECTED_ROUTES, "The seven approved routes must be present exactly once")
    check(len(routes) == len(data["routes"]), "Duplicate route id")
    check(data["sources"]["year"] == 2027, "Official source year must be 2027")
    check(data["sources"]["no_official_grade9_vpr"] is True, "Do not invent an official grade 9 route")
    check(set(data["sources"]["separate_advanced_math_classes"]) == {7, 8}, "Advanced official levels are grade 7 and 8")

    for lesson in data["lessons"]:
        identifier = lesson["id"]
        unique(identifier, "lesson")
        lessons[identifier] = lesson
        counts["lessons"] += 1
        check(bool(lesson["routes"]) and all(route in routes for route in lesson["routes"]), f"Invalid route membership: {identifier}")
        check(len(set(lesson["routes"])) == len(lesson["routes"]), f"Duplicate lesson route: {identifier}")
        check(len(lesson["tasks"]) == 6, f"Each lesson needs six tasks: {identifier}")
        check(all(lesson.get(field) for field in ["section", "title", "goal", "theory", "example"]), f"Incomplete lesson: {identifier}")
        check(all(isinstance(text, str) and text.strip() for text in lesson["theory"]), f"Empty theory: {identifier}")
        check(all(lesson["example"].get(field) for field in ["prompt", "steps", "answer"]), f"Incomplete example: {identifier}")
        levels = collections.Counter(task["level"] for task in lesson["tasks"])
        check(levels == {"start": 2, "practice": 2, "exam": 2}, f"Difficulty progression: {identifier}")

        for task in lesson["tasks"]:
            task_id = task["id"]
            unique(task_id, "task")
            tasks[task_id] = (task, lesson)
            counts["tasks"] += 1
            check(2 <= len(task["steps"]) <= 6, f"Unsupported step count: {task_id}")
            check(bool(task.get("prompt")) and bool(task.get("finalExplanation")), f"Incomplete task: {task_id}")
            for flag in ["assessAllSteps", "requiresWrittenSolution"]:
                check(flag not in task or isinstance(task[flag], bool), f"Invalid {flag}: {task_id}")

            if task.get("svg"):
                try:
                    svg = ET.fromstring(task["svg"])
                    check(svg.tag.rsplit("}", 1)[-1] == "svg", f"SVG root: {task_id}")
                    check("viewBox" in svg.attrib, f"SVG viewBox: {task_id}")
                    check(svg.attrib.get("role") == "img" and bool(svg.attrib.get("aria-label")), f"SVG accessible label: {task_id}")
                    for element in svg.iter():
                        name = element.tag.rsplit("}", 1)[-1].lower()
                        check(name not in {"script", "foreignobject", "iframe", "image", "object", "embed"}, f"Active SVG element: {task_id}")
                        for attribute in element.attrib:
                            key = attribute.rsplit("}", 1)[-1].lower()
                            check(not key.startswith("on") and key not in {"href", "src"}, f"Active SVG attribute: {task_id}")
                    check(not re.search(r"@import|url\(\s*['\"]?(?!#)[a-z]+:", task["svg"], re.I), f"External SVG resource: {task_id}")
                    counts["svg"] += 1
                except (ET.ParseError, TypeError) as error:
                    failures.append(f"Malformed SVG {task_id}: {error}")

            if task.get("plot"):
                plot = task["plot"]
                check(plot["kind"] in {"line", "parabola"}, f"Unsupported graph: {task_id}")
                check(all(isinstance(plot.get(bound), int) for bound in ["minX", "maxX", "minY", "maxY"]), f"Integer graph bounds: {task_id}")
                check(plot["minX"] < plot["maxX"] and plot["minY"] < plot["maxY"], f"Nonempty graph bounds: {task_id}")
                visible = []
                for x in range(plot["minX"], plot["maxX"] + 1):
                    y = (x - plot["h"]) ** 2 + plot["k"] if plot["kind"] == "parabola" else plot["k"] * x + plot["b"]
                    if numeric(y) and int(y) == y and plot["minY"] <= y <= plot["maxY"]:
                        visible.append((x, y))
                check(len(visible) >= (3 if plot["kind"] == "parabola" else 2), f"Insufficient visible integer graph points: {task_id}")
                counts["plots"] += 1

            for index, step in enumerate(task["steps"]):
                tag = f"{task_id}:{index + 1}"
                answer = step["answer"]
                kind = answer["kind"]
                counts["steps"] += 1
                counts[kind] += 1
                check(all(isinstance(step.get(field), str) and step[field].strip() for field in ["prompt", "hint", "solution"]), f"Incomplete step: {tag}")
                if kind == "choice":
                    options = step.get("options", [])
                    check(isinstance(answer["value"], int) and not isinstance(answer["value"], bool) and 0 <= answer["value"] < len(options), f"Choice key out of bounds: {tag}")
                    check(2 <= len(options) <= 10 and len(options) == len(set(options)), f"Invalid or duplicate options: {tag}")
                    check(all(isinstance(option, str) and option.strip() for option in options), f"Empty option: {tag}")
                    continue
                if kind == "number":
                    expected = [answer["value"]]
                elif kind in {"set", "tuple"}:
                    expected = answer["values"]
                    check(isinstance(expected, list) and bool(expected), f"Empty numeric collection: {tag}")
                    if kind == "set":
                        check(len(expected) == len(set(expected)), f"Repeated root in canonical set: {tag}")
                else:
                    failures.append(f"Unknown answer type: {tag}")
                    continue
                check(all(numeric(value) for value in expected), f"Nonfinite answer: {tag}")
                expressions = [step["oracle"]] if step.get("oracle") else step.get("oracles", step.get("oracleValues", []))
                try:
                    if expressions:
                        actual = [evaluate(expression) for expression in expressions]
                        counts["oracle_components"] += len(actual)
                    elif kind == "set" and task.get("plot", {}).get("kind") == "parabola":
                        # These two intersection exercises predate collection oracles.
                        # Derive the roots independently from the prompt's horizontal
                        # line and the graph metadata, rather than trusting its key.
                        match = re.search(r"прямой y = ([-+]?\d+)", task["prompt"])
                        if not match:
                            raise ValueError("Missing horizontal-line value in graph problem")
                        plot = task["plot"]
                        distance = math.sqrt(int(match.group(1)) - plot["k"])
                        actual = [plot["h"] - distance, plot["h"] + distance]
                        counts["derived_graph_components"] += len(actual)
                    else:
                        raise ValueError("No independent numerical oracle")
                    if kind == "set":
                        actual, expected = sorted(actual), sorted(expected)
                    check(len(actual) == len(expected) and all(math.isclose(left, right, rel_tol=1e-12, abs_tol=1e-9) for left, right in zip(actual, expected)), f"Oracle mismatch: {tag}; calculated={actual}; stored={expected}")
                except (ValueError, TypeError, ZeroDivisionError, OverflowError, SyntaxError) as error:
                    failures.append(f"Oracle error {tag}: {error}")

    for name, expected in EXPECTED_COUNTS.items():
        check(counts[name] == expected, f"Frozen bank {name}: expected {expected}, found {counts[name]}")

    for route_id, route in routes.items():
        listed = route["lessonIds"]
        membership = {lesson_id for lesson_id, lesson in lessons.items() if route_id in lesson["routes"]}
        check(len(listed) == len(set(listed)), f"Repeated route lesson: {route_id}")
        check(set(listed) == membership, f"Route syllabus differs from lesson membership: {route_id}")
        check(route["advanced"] == route_id.endswith("u"), f"Advanced route marker: {route_id}")

    check(coverage.get("canonical_source_sha256") == source_digest, "Coverage canonical_source_sha256 does not match content/full_data.json")
    check(coverage.get("source_year") == 2027, "Coverage source year")
    check(coverage.get("coverage_kind") == "author_training_by_official_category", "Coverage must not claim official test certification")
    official_routes = {route["route_id"]: route for route in data["sources"]["routes"]}
    mapped_routes = {route["route_id"]: route for route in coverage["routes"]}
    check(set(official_routes) == EXPECTED_ROUTES and set(mapped_routes) == EXPECTED_ROUTES, "Official and mapped routes must match")
    slots_checked = 0
    for route_id, official in official_routes.items():
        mapped = mapped_routes.get(route_id, {})
        official_slots = {slot["number"]: slot for slot in official["slots"]}
        mapped_slots = {slot["number"]: slot for slot in mapped.get("slots", [])}
        expected_count = 16 if route_id == "g6" else 17
        check(len(official_slots) == expected_count and set(official_slots) == set(range(1, expected_count + 1)), f"Official slot numbering: {route_id}")
        check(len(mapped_slots) == len(mapped.get("slots", [])) and set(mapped_slots) == set(official_slots), f"Coverage slot numbering: {route_id}")
        check(sum(slot["max_points"] for slot in official_slots.values()) == official["max_points"], f"Official point total: {route_id}")
        for number, source in official_slots.items():
            slot = mapped_slots.get(number)
            if slot is None:
                continue
            slots_checked += 1
            tag = f"{route_id}#{number}"
            check(slot["coverage_status"] == "taught", f"Unresolved category: {tag}")
            check(bool(slot["lesson_ids"]) and bool(slot["evidence_task_ids"]), f"Missing training evidence: {tag}")
            for lesson_id in slot["lesson_ids"]:
                check(lesson_id in lessons and route_id in lessons[lesson_id]["routes"], f"Unavailable coverage lesson {tag}: {lesson_id}")
            for task_id in slot["evidence_task_ids"]:
                check(task_id in tasks and tasks[task_id][1]["id"] in slot["lesson_ids"] and route_id in tasks[task_id][1]["routes"], f"Unreachable evidence task {tag}: {task_id}")
            for coverage_field, source_field in [("official_part", "part"), ("official_subject", "subject"), ("official_max_points", "max_points"), ("official_requires_full_solution", "full_solution")]:
                check(slot[coverage_field] == source[source_field], f"Official metadata differs {tag}: {coverage_field}")
            expected_assessment = "taught;full_written_answer_human" if source["full_solution"] else "automatic_training_answers"
            check(slot["assessment"] == expected_assessment, f"Written-solution assessment claim: {tag}")
    check(slots_checked == 118, "All 118 official categories need reachable training evidence")
    check(not coverage.get("pending_dependencies"), "Unresolved coverage dependencies")
    check(coverage["summary"]["official_slots"] == slots_checked and coverage["summary"]["taught_categories"] == slots_checked, "Coverage summary differs from actual mapping")

    return {
        "gate": "VPR_CONTENT_GATE",
        "canonicalSource": "content/full_data.json",
        "sourceSha256": source_digest,
        "counts": dict(counts),
        "coverageSlots": slots_checked,
        "routes": {identifier: {"lessons": len(route["lessonIds"]), "tasks": sum(len(lessons[key]["tasks"]) for key in route["lessonIds"] if key in lessons)} for identifier, route in routes.items()},
        "failures": failures,
        "scope": "Arithmetic, schema, SVG, graph and coverage checks. Semantic mathematics and human-written solutions are reviewed separately.",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", type=Path, help="Optional output path for a JSON report; no file is written by default")
    args = parser.parse_args()
    source = (ROOT / "content" / "full_data.json").read_bytes()
    data = json.loads(source)
    coverage = json.loads((ROOT / "content" / "coverage.json").read_text(encoding="utf-8"))
    report = validate(data, coverage, hashlib.sha256(source).hexdigest())
    rendered = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    print(rendered, end="")
    if args.report:
        args.report.write_text(rendered, encoding="utf-8")
    raise SystemExit(bool(report["failures"]))


if __name__ == "__main__":
    main()
