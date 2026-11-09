#!/usr/bin/env python3
"""Independent Euclidean checks for the authored Sections From Zero course.

The oracle uses coordinates, finite edges and metric formulae. It never imports
the renderer, answer checker or a precomputed audit's pass counters.
Run: python tools/sections-course.test.py [--course path/to/course.json]
"""
import argparse
import itertools
import json
import math
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--course", type=Path, default=ROOT / "stereo-course/sections/data/course.json")
args, unittest_args = parser.parse_known_args()
C = json.loads(args.course.read_text(encoding="utf-8"))
LESSONS = {item["id"]: item for item in C["lessons"]}
EPS = 1e-7


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def mul(a, k):
    return tuple(x * k for x in a)


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def norm(a):
    return math.sqrt(dot(a, a))


def distance(a, b):
    return norm(sub(a, b))


def plane(points):
    """Fit any noncollinear triple, and independently check every point."""
    scale = max(1, *(distance(a, b) for a, b in itertools.combinations(points, 2)))
    for a, b, c in itertools.combinations(points, 3):
        normal = cross(sub(b, a), sub(c, a))
        if norm(normal) > EPS * scale * scale:
            normal = mul(normal, 1 / norm(normal))
            if not all(abs(dot(sub(p, a), normal)) < EPS * scale for p in points):
                raise AssertionError("vertices are not coplanar")
            return a, normal
    raise AssertionError("plane has no three noncollinear vertices")


def on_plane(point, fitted, tolerance=EPS):
    origin, normal = fitted
    return abs(dot(sub(point, origin), normal)) <= tolerance * max(1, distance(point, origin))


def point_line(point, a, b):
    return norm(cross(sub(point, a), sub(b, a))) / distance(a, b)


def point_plane(point, vertices):
    origin, normal = plane(vertices)
    return abs(dot(sub(point, origin), normal))


def plane_angle(first, second):
    n1, n2 = plane(first)[1], plane(second)[1]
    return math.degrees(math.acos(min(1, abs(dot(n1, n2)))))


def polygon_area(points):
    # Vector area works for an ordered convex polygon in any orientation.
    return norm(tuple(sum(cross(points[i], points[(i + 1) % len(points)])[k] for i in range(len(points))) for k in range(3))) / 2


def perimeter(points):
    return sum(distance(p, points[(i + 1) % len(points)]) for i, p in enumerate(points))


def finite_intersections(model, origin, normal):
    """Intersect finite edges, including vertices and contained edges."""
    normal = mul(normal, 1 / norm(normal))
    found = []
    for u, v in model["edges"]:
        a, b = model["points"][u], model["points"][v]
        da, db = dot(sub(a, origin), normal), dot(sub(b, origin), normal)
        candidates = []
        if abs(da) <= EPS:
            candidates.append(a)
        if abs(db) <= EPS:
            candidates.append(b)
        if da * db < -EPS * EPS:
            candidates.append(add(a, mul(sub(b, a), da / (da - db))))
        for p in candidates:
            if not any(distance(p, previous) <= EPS for previous in found):
                found.append(p)
    return found


def point_in_face(point, vertices):
    origin, normal = plane(vertices)
    if not on_plane(point, (origin, normal)):
        return False
    signs = [dot(cross(sub(vertices[(i + 1) % len(vertices)], a), sub(point, a)), normal) for i, a in enumerate(vertices)]
    return all(x >= -EPS for x in signs) or all(x <= EPS for x in signs)


def coordinates(lesson, names):
    return [lesson["model"]["points"][name] for name in names]


class CourseGeometry(unittest.TestCase):
    def test_authored_coverage_and_learning_path(self):
        self.assertEqual(len(LESSONS), len(C["lessons"]))
        self.assertEqual(len(LESSONS), 186)
        self.assertEqual(sum(len(l["steps"]) for l in LESSONS.values()), 967)
        self.assertEqual(sum(len(l.get("calculationSteps", [])) for l in LESSONS.values()), 81)
        self.assertEqual(len(C["learningPath"]), 26)
        self.assertEqual(sum(len(stage["lessons"]) for stage in C["learningPath"]), 100)
        self.assertEqual(C["learningPath"][0]["lessons"][0], "starter-01")
        main = [id for stage in C["learningPath"] for id in stage["lessons"]]
        self.assertEqual(len(main), len(set(main)), "a main-path exercise appears once")
        for stage in C["learningPath"]:
            self.assertTrue(stage["readiness"])
            for id in stage["lessons"] + ([stage["reserveLesson"]] if "reserveLesson" in stage else []):
                self.assertIn(id, LESSONS)
                self.assertEqual(LESSONS[id]["pathStageId"], stage["id"])
        for category in ["starter", "scaffold"]:
            cards = [l for l in LESSONS.values() if category in l]
            self.assertEqual(len(cards), 24)
            self.assertEqual(sum(bool(l[category]["reserve"]) for l in cards), 6)

    def test_planes_non_degenerate_coplanar_and_finite(self):
        count = 0
        for l in LESSONS.values():
            points = l["model"]["points"]
            for name, point in points.items():
                with self.subTest(lesson=l["id"], point=name):
                    self.assertEqual(len(point), 3)
                    self.assertTrue(all(isinstance(x, (int, float)) and math.isfinite(x) for x in point))
            defined = {p["id"]: p for p in l["model"]["faces"] + l["model"].get("planes", [])}
            for id, p in defined.items():
                with self.subTest(lesson=l["id"], plane=id):
                    self.assertEqual(len(p["vertices"]), len(set(p["vertices"])))
                    plane(coordinates(l, p["vertices"]))
                    count += 1
        self.assertEqual(count, 1163)

    def test_step_planes_are_available_before_the_action(self):
        count = segments = 0
        for l in LESSONS.values():
            model = l["model"]
            defined = {p["id"]: p for p in model["faces"] + model.get("planes", [])}
            known = set(itertools.chain.from_iterable(model["edges"])) | set(model.get("given", []))
            for index, step in enumerate(l["steps"]):
                with self.subTest(lesson=l["id"], step=index + 1):
                    self.assertIn(step["plane"], defined)
                    self.assertTrue(set(defined[step["plane"]]["vertices"]) <= known,
                                    "the working plane uses a point that has not been constructed yet")
                    fitted = plane(coordinates(l, defined[step["plane"]]["vertices"]))
                    for segment in step.get("segments", []):
                        self.assertNotEqual(segment["a"], segment["b"])
                        for name in (segment["a"], segment["b"]):
                            self.assertTrue(on_plane(model["points"][name], fitted), "segment leaves working plane")
                        segments += 1
                    self.assertTrue(step["reason"].strip())
                    self.assertTrue(step["action"].strip())
                    known.update(step.get("points", []))
                    known.update(name for segment in step.get("segments", []) for name in (segment["a"], segment["b"]))
                    count += 1
        self.assertEqual(count, 967)
        self.assertEqual(segments, 1057)

    def test_polygons_are_closed_convex_face_boundaries(self):
        count = 0
        for l in LESSONS.values():
            names = l["result"].get("polygon")
            if names is None:
                continue
            with self.subTest(lesson=l["id"]):
                self.assertGreaterEqual(len(names), 3)
                self.assertEqual(len(names), len(set(names)), "unique cyclic vertices, no repeated closing vertex")
                pts = coordinates(l, names)
                _, normal = plane(pts)
                for a, b in itertools.combinations(pts, 2):
                    self.assertGreater(distance(a, b), EPS, "distinct names cannot hide duplicate polygon vertices")
                self.assertGreater(polygon_area(pts), EPS)
                turns = [dot(cross(sub(pts[(i + 1) % len(pts)], pts[i]), sub(pts[(i + 2) % len(pts)], pts[(i + 1) % len(pts)])), normal) for i in range(len(pts))]
                self.assertTrue(all(t > EPS for t in turns) or all(t < -EPS for t in turns), "convex boundary order has no crossing or collinear duplicate")
                faces = [coordinates(l, face["vertices"]) for face in l["model"]["faces"]]
                for i, a in enumerate(pts):
                    b = pts[(i + 1) % len(pts)]  # includes final closing side
                    self.assertTrue(any(point_in_face(a, f) and point_in_face(b, f) for f in faces),
                                    "every whole side lies on a finite face, including closure")
                count += 1
        self.assertEqual(count, 123)

    def test_all_cut_planes_equal_the_complete_finite_edge_intersection(self):
        count = 0
        for l in LESSONS.values():
            cut = l.get("validation", {}).get("cutPlane")
            if cut is None or "polygon" not in l["result"]:
                continue
            with self.subTest(lesson=l["id"]):
                self.assertGreater(norm(cut["normal"]), EPS)
                expected = finite_intersections(l["model"], cut["point"], cut["normal"])
                actual = coordinates(l, l["result"]["polygon"])
                self.assertEqual(len(actual), len(expected), "no missed or invented finite-edge vertices")
                self.assertTrue(all(any(distance(a, e) <= EPS for e in expected) for a in actual))
                self.assertTrue(all(any(distance(a, e) <= EPS for a in actual) for e in expected))
                count += 1
        self.assertEqual(count, 122)

    def test_eight_partial_constructions_do_not_claim_a_complete_polygon(self):
        partial = [l for l in LESSONS.values() if l.get("validation", {}).get("cutPlane") and "polygon" not in l["result"]]
        self.assertEqual(len(partial), 8)
        for l in partial:
            with self.subTest(lesson=l["id"]):
                cut = l["validation"]["cutPlane"]
                fitted = (cut["point"], mul(cut["normal"], 1 / norm(cut["normal"])))
                faces = [coordinates(l, face["vertices"]) for face in l["model"]["faces"]]
                sides = [s for step in l["steps"] for s in step["segments"] if s["kind"] == "section"]
                self.assertTrue(sides)
                for segment in sides:
                    a, b = coordinates(l, [segment["a"], segment["b"]])
                    self.assertTrue(on_plane(a, fitted) and on_plane(b, fitted))
                    self.assertTrue(any(point_in_face(a, f) and point_in_face(b, f) for f in faces))

    def test_intersection_of_two_planes_is_not_misclassified_as_a_face_side(self):
        # These tasks ask for a line through the solid, not a polygon boundary.
        cases = {
            "ii-self-7": (["A", "B1", "C"], ["B", "C1", "D"], ["O", "T"]),
            "ii-self-8": (["A", "B", "C1"], ["A1", "B1", "C"], ["P", "Q"]),
            "ii-self-9": (["A", "B1", "C1", "D"], ["C", "B1", "A1", "D"], ["B1", "D"]),
        }
        for id, (first, second, endpoints) in cases.items():
            with self.subTest(lesson=id):
                l = LESSONS[id]
                self.assertNotIn("polygon", l["result"])
                self.assertNotIn("cutPlane", l.get("validation", {}))
                self.assertIn("линию пересечения", l["goal"])
                a, b = coordinates(l, endpoints)
                self.assertGreater(distance(a, b), EPS)
                for names in (first, second):
                    fitted = plane(coordinates(l, names))
                    self.assertTrue(on_plane(a, fitted) and on_plane(b, fitted))

    def test_all_41_numeric_answers_from_independent_metric_formulae(self):
        # Names below identify what is asked. No expected answer is copied from
        # result.numeric. Area/perimeter use the separately validated polygon;
        # inverse problems and extrema use the dimensions stated in conditions.
        area = {"auth-core-16", "auth-metric-02", "auth-metric-03", "auth-metric-04", "iii-worked-1", "iii-self-4", "iii-self-6", "iii-self-8", "iii-self-10", "auth-metric-11"}
        lengths = {"auth-method-04": ("B", "Q"), "prep-17-a": ("R", "C1"), "prep-09": ("M", "N"), "prep-16": ("D", "L"), "prep-14-a": ("A", "E"), "prep-14-b": ("E", "F"), "prep-19": ("K", "L")}
        perimeters = {"auth-method-13", "iii-self-7", "iii-self-9"}
        point_planes = {"iii-self-3": ("A", ["P", "Q", "M"]), "iii-self-11": ("D", ["P", "Q", "R"]), "iii-self-12": ("A", ["M", "N", "P"]), "auth-metric-06": ("C", ["A1", "B", "D"])}
        angles = {"auth-metric-05": (["S", "A", "B"], ["A", "B", "C"]), "iii-self-2": (["A", "M", "N"], ["A", "B", "C"]), "iii-self-5": (["A", "B1", "D1"], ["A", "C", "D1"])}
        checked = set()
        for id, l in LESSONS.items():
            if "numeric" not in l["result"]:
                continue
            with self.subTest(lesson=id):
                p = l["model"]["points"]
                length = lambda a, b: distance(p[a], p[b])
                if id in area:
                    actual = polygon_area(coordinates(l, l["result"]["polygon"]))
                elif id in perimeters:
                    actual = perimeter(coordinates(l, l["result"]["polygon"]))
                elif id in lengths:
                    actual = length(*lengths[id])
                elif id in point_planes:
                    vertex, names = point_planes[id]
                    actual = point_plane(p[vertex], coordinates(l, names))
                elif id in angles:
                    a, b = angles[id]
                    actual = plane_angle(coordinates(l, a), coordinates(l, b))
                elif id == "auth-method-10":
                    actual = length("B", "F") / length("F", "S")
                elif id == "auth-core-15":
                    actual = abs(dot(sub(p["M"], p["A"]), cross(sub(p["N"], p["A"]), sub(p["K"], p["A"])))) / 6
                elif id == "auth-metric-01":
                    base = polygon_area(coordinates(l, ["A", "B", "C", "D"]))
                    height = point_plane(p["S"], coordinates(l, ["A", "B", "C"]))
                    ratio = length("S", "M") / length("S", "A")
                    actual = base * height / 3 * (1 - ratio ** 3)
                elif id == "iii-self-1":
                    actual = point_line(p["C"], p["P"], p["Q"])
                elif id == "auth-metric-07":
                    normal = cross(sub(p["B"], p["A"]), sub(p["C"], p["S"]))
                    actual = abs(dot(sub(p["S"], p["A"]), normal)) / norm(normal)
                elif id == "auth-metric-08":
                    normal = plane(coordinates(l, ["A", "B1", "C"]))[1]
                    actual = math.degrees(math.asin(abs(dot(sub(p["D1"], p["A"]), normal)) / length("A", "D1")))
                elif id == "auth-metric-12":
                    base = polygon_area(coordinates(l, ["A", "B", "C", "D"]))
                    # Integral of an affine height over a parallelogram.
                    heights = [point_plane(p[name], coordinates(l, ["A", "B", "C"])) for name in ("M", "N", "P", "Q")]
                    actual = base * sum(heights) / 4
                elif id == "auth-core-14":
                    # S = sqrt(3) x²/2, condition S = 18 sqrt(3).
                    actual = math.sqrt(2 * (18 * math.sqrt(3)) / math.sqrt(3))
                elif id in {"auth-method-11", "auth-method-12"}:
                    # Opposite corner heights of an affine plane have equal sums;
                    # h_B=0 implies h_D=h_A+h_C, independent of shown candidate.
                    actual = length("A", "M") + length("C", "N")
                elif id == "auth-metric-09":
                    # Rectangle sides a*t, a*(1-t): t(1-t)=1/4-(t-1/2)^2.
                    actual = length("S", "A") ** 2 / 4
                elif id == "auth-metric-10":
                    # Given section area 40 and base side 8; height is found
                    # from section altitude, not the authored top coordinates.
                    actual = math.sqrt((2 * 40 / 8) ** 2 - (8 * math.sqrt(3) / 2) ** 2)
                elif id == "auth-metric-13":
                    # Sum areas of the three lateral parallelograms directly.
                    side = sub(p["A1"], p["A"])
                    actual = sum(norm(cross(sub(p[b], p[a]), side)) for a, b in [("A", "B"), ("B", "C"), ("C", "A")])
                elif id == "auth-metric-14":
                    # Normal-plane equation (X-M).v=0 with |AM|=m.
                    # A+t*v intersection is finite iff 0<=t<=1. Intersect the
                    # three allowable m intervals rather than use the candidate M.
                    v = sub(p["A1"], p["A"])
                    actual = max(dot(sub(p[name], p["A"]), v) / norm(v) for name in ["A", "B", "C"])
                    upper = min(dot(sub(p[name], p["A"]), v) / norm(v) + norm(v) for name in ["A", "B", "C"])
                    self.assertLessEqual(actual, upper)
                else:
                    self.fail("numeric exercise has no independent derivation: " + id)
                self.assertTrue(math.isfinite(actual))
                self.assertAlmostEqual(actual, l["result"]["numeric"]["value"], delta=EPS * max(1, abs(actual)))
                checked.add(id)
        self.assertEqual(len(checked), 41)


if __name__ == "__main__":
    unittest.main(argv=[__file__] + unittest_args)
