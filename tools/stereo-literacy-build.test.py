#!/usr/bin/env python3
import copy
import runpy
import unittest
from pathlib import Path


BUILDER = runpy.run_path(str(Path(__file__).with_name("stereo-literacy-build.py")))
ROOT = BUILDER["ROOT"]
READ = BUILDER["read_json"]
BUILD = BUILDER["build"]


class StereometryRouteTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.route = READ(ROOT / BUILDER["ROUTE"])
        cls.source = READ(ROOT / BUILDER["SOURCE"])

    def test_full_cards_remain_identical_to_their_reviewed_textbook_source(self):
        result = BUILD(self.route, self.source)
        source_by_id = {card["id"]: card for card in self.source["lessons"]}
        identifiers = [identifier for stage in self.route["stages"] for identifier in stage["lessonIds"]]
        self.assertEqual(len(identifiers), 36)
        self.assertEqual(result["lessons"], [source_by_id[identifier] for identifier in identifiers])
        self.assertEqual(result, READ(ROOT / BUILDER["OUTPUT"]))
        self.assertEqual(identifiers[0], "atanasyan2024-theory-001")
        self.assertEqual(identifiers[-1], "ex-main-0167")

    def test_reject_unknown_and_repeated_lessons(self):
        for identifier, error in (("unknown", "Unknown route lesson"), ("theory-004", "Repeated route lesson")):
            with self.subTest(identifier=identifier):
                changed = copy.deepcopy(self.route)
                changed["stages"][1]["lessonIds"].insert(1, identifier)
                with self.assertRaisesRegex(ValueError, error):
                    BUILD(changed, self.source)

    def test_reject_skipped_or_out_of_order_theory_points(self):
        changed = copy.deepcopy(self.route)
        changed["stages"][1]["lessonIds"][:2] = ["theory-005", "theory-004"]
        with self.assertRaisesRegex(ValueError, "Missing or out-of-order"):
            BUILD(changed, self.source)

    def test_reject_later_topics_and_their_exercises(self):
        for identifier in ("theory-023", "ex-main-0177"):
            with self.subTest(identifier=identifier):
                changed = copy.deepcopy(self.route)
                changed["stages"][-1]["lessonIds"].insert(1, identifier)
                with self.assertRaisesRegex(ValueError, "outside stage points"):
                    BUILD(changed, self.source)

    def test_reject_missing_theory_dependency_even_with_all_points_present(self):
        changed = copy.deepcopy(self.route)
        changed["stages"][3]["lessonIds"].remove("theory-017-example")
        with self.assertRaisesRegex(ValueError, "Unresolved theory reference theory-017-example"):
            BUILD(changed, self.source)


if __name__ == "__main__":
    unittest.main()
