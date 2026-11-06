#!/usr/bin/env python3
"""Regression gate for fixed grade/edition teacher-work identities.

These checks include independent eligibility calculations and known source-map
examples. They also mutate input order and corrupt the proposed numbering to
verify that the build fails closed instead of assigning accidental new serials.
"""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("teacher_work_numbering", ROOT / "tools/teacher-work-numbering.py")
builder = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(builder)


def read(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


class NumberingChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bank = read("pedagogam/raboty/bank.json")
        cls.word = read("pedagogam/raboty/word-packs.json")
        cls.coverage = read("tools/teacher-textbook-coverage.json")
        cls.order = read("tools/teacher-work-order.json")
        cls.data = builder.build_registry()
        cls.collections = {c["id"]: c for c in cls.data["collections"]}
        cls.books = {b["title"]: b for b in cls.data["books"]}

    def scope(self, title, grade):
        return self.collections[f'{self.books[title]["id"]}-{grade}']

    def test_checked_in_registry_is_current(self):
        self.assertEqual((ROOT / "pedagogam/raboty/numbering.json").read_text(),
                         builder.serialized(self.data))

    def test_independent_grade_and_edition_coverage(self):
        """Calculate required membership from source mappings, not saved lists."""
        pack_by_id = {p["id"]: p for p in self.bank}
        word_by_id = {"word:" + p["id"]: p for p in self.word["packs"]}
        all_work_ids = {p["id"] + ":" + kind for p in self.bank for kind in ("sr", "kr")} | set(word_by_id)
        self.assertEqual(set(self.data["works"]), all_work_ids)
        books = {b["id"]: b for b in self.order["books"]}
        for scope in self.data["collections"]:
            grade, bid = scope["grade"], scope["bookId"]
            expected = {"sr": set(), "kr": set()}
            for pack in self.bank:
                if bid:
                    book = books[bid]
                    applies = grade in book["grades"] and grade in pack["book_grades"].get(book["title"], [])
                else:
                    applies = any(grade in grades for grades in pack["book_grades"].values())
                if applies:
                    for kind in expected:
                        expected[kind].add(pack["id"] + ":" + kind)
            for wid, pack in word_by_id.items():
                # Word metadata here uses either one grade or one contiguous
                # range. The general non-contiguous parser has a separate test.
                import re
                bounds = [int(g) for g in re.findall(r"\d+", pack["grade"])]
                applies = min(bounds) <= grade <= max(bounds)
                if bid:
                    book = books[bid]
                    source = pack_by_id[pack["bankId"]]
                    applies = applies and grade in book["grades"] and grade in source["book_grades"].get(book["title"], [])
                if applies:
                    expected["sr"].add(wid)
            for kind in expected:
                self.assertEqual(set(scope[kind]), expected[kind], (scope["id"], kind))
                self.assertEqual(len(scope[kind]), len(set(scope[kind])), (scope["id"], kind))
                # The explicit ordered index is the serial. Every complete
                # collection starts at one and has no duplicate or skipped index.
                serials = [index + 1 for index, _ in enumerate(scope[kind])]
                self.assertEqual(serials, list(range(1, len(expected[kind]) + 1)))

    def test_word_only_general_grades_are_preserved(self):
        grade7 = self.collections["grade-7"]
        self.assertIn("word:minus-pered-skobkami", grade7["sr"])
        self.assertNotIn("arith-brackets-like-terms:sr", grade7["sr"])
        self.assertNotIn("arith-brackets-like-terms:kr", grade7["kr"])
        grade9 = self.collections["grade-9"]
        self.assertIn("word:lineynye-grafiki-oge", grade9["sr"])
        self.assertNotIn("alg-line:sr", grade9["sr"])
        self.assertNotIn("alg-line:kr", grade9["kr"])

    def test_word_and_pdf_are_separate_work_numbers(self):
        scope = self.collections["grade-6"]
        pdf = scope["sr"].index("arith-brackets-like-terms:sr") + 1
        word = scope["sr"].index("word:minus-pered-skobkami") + 1
        self.assertNotEqual(pdf, word)
        self.assertIn("arith-brackets-like-terms:kr", scope["kr"])
        self.assertNotIn("word:minus-pered-skobkami", scope["kr"])

    def test_out_of_edition_grades_are_excluded(self):
        known = {
            "Виленкин и др. Математика. 5 класс. 2023": [5],
            "Виленкин и др. Математика. 6 класс. 2024": [6],
            "Дорофеев — Петерсон. Математика. 5 класс. Части 1–2. 2019": [5],
            "Дорофеев — Петерсон. Математика. 6 класс. Часть 1. 2019": [6],
        }
        for title, grades in known.items():
            book = self.books[title]
            self.assertEqual(book["grades"], grades)
            actual = [c["grade"] for c in self.data["collections"] if c["bookId"] == book["id"]]
            self.assertEqual(actual, grades)
        self.assertEqual(len(self.data["corrections"]), 13)
        # Correcting an edition does not remove reusable fraction topics from
        # the general grade-six list.
        self.assertIn("arith-fraction-add-subtract:sr", self.collections["grade-6"]["sr"])

    def test_known_textbook_sequence_examples(self):
        v6 = self.scope("Виленкин и др. Математика. 6 класс. 2024", 6)
        # Points 1, 2, 3, 4, 5 of the 2024 edition, independently read from its
        # existing page inventory, rather than sorted pack identifiers.
        expected = ["arith-mean", "arith-percent", "arith-pie-diagrams", "arith-triangle-types", "arith-sets"]
        for kind in ("sr", "kr"):
            self.assertEqual(v6[kind][:5], [p + ":" + kind for p in expected])
        m8 = self.scope("Макарычев и соавторы. Алгебра. 8 класс. Базовый уровень, 2024", 8)
        self.assertLess(m8["sr"].index("alg-roots:sr"), m8["sr"].index("alg-radicals:sr"))
        self.assertLess(m8["sr"].index("alg-radicals:sr"), m8["sr"].index("alg-quadratics:sr"))
        self.assertGreater(m8["sr"].index("alg-negative-powers:sr"), m8["sr"].index("alg-domains:sr"))
        merzlyak = self.scope("Мерзляк, Полонский, Якир. Геометрия 7–9 (издания 2015/2013/2022)", 7)
        # Parallel lines are points 13–15; the full triangle-angle work
        # requires points 16–18, not only the earlier isosceles-triangle topic.
        for kind in ("sr", "kr"):
            self.assertLess(merzlyak[kind].index("geo-parallelnye-pryamye:" + kind),
                            merzlyak[kind].index("geo-ugly-treugolnika:" + kind))
        self.assertLess(merzlyak["sr"].index("geo-parallelnye-pryamye:sr"),
                        merzlyak["sr"].index("word:summa-uglov-treugolnika"))

    def test_same_topic_has_independent_book_numbers(self):
        v6 = self.scope("Виленкин и др. Математика. 6 класс. 2024", 6)
        p6 = self.scope("Дорофеев — Петерсон. Математика. 6 класс. Часть 1. 2019", 6)
        self.assertNotEqual(v6["sr"].index("arith-mean:sr"), p6["sr"].index("arith-mean:sr"))

    def test_edition_references_do_not_mix_authors(self):
        v5 = self.scope("Виленкин и др. Математика. 5 класс. 2023", 5)
        refs = v5["referenceSources"]["arith-fraction-add-subtract:sr"]
        self.assertEqual(refs, ["school/vilenkin5-lessons.js"])
        ty7 = self.scope("Тюрин, Макаров, Высоцкий, Ященко. Теория вероятностей и статистика. 7–9 классы. 2011", 8)
        reference = ty7["references"]["prob-permutations:sr"]
        self.assertIn("Источник 113:", reference)
        self.assertNotIn("Источник 114:", reference)
        title = "Алгебра 8 класс - Мерзляк А.Г., Полонский В.Б., Якир М.С. (2022)"
        scope = self.scope(title, 8)
        for reference in scope["references"].values():
            self.assertIn("Оглавление этого издания:", reference)
            self.assertNotIn("Макарычев", reference)
            self.assertNotIn("Мордкович", reference)

    def test_input_order_does_not_change_numbers(self):
        bank, word, coverage = copy.deepcopy((self.bank, self.word, self.coverage))
        bank.reverse()
        for p in bank:
            p["books"].reverse()
            p["book_grades"] = dict(reversed(list(p["book_grades"].items())))
        word["packs"].reverse()
        coverage["books"].reverse()
        actual = builder.build_registry(bank=bank, word=word, coverage=coverage)
        self.assertEqual(actual, self.data)

    def test_non_contiguous_grade_parser_preserves_gaps(self):
        self.assertEqual(builder.parse_grades("8, 10–11 классы"), [8, 10, 11])
        self.assertEqual(builder.parse_grades("7–8, 11 классы"), [7, 8, 11])
        for bad in ("11–5 классы", "2024 год", "6 класс / 2024", "4 класс"):
            with self.assertRaises(ValueError):
                builder.parse_grades(bad)

    def test_new_work_cannot_acquire_an_automatic_number(self):
        bank = copy.deepcopy(self.bank)
        new = copy.deepcopy(bank[0])
        new["id"] = "arith-unreviewed-new-work"
        bank.append(new)
        with self.assertRaisesRegex(ValueError, "explicit numbering coverage differs"):
            builder.build_registry(bank=bank)

    def test_same_edition_rejects_renumbering_and_removal(self):
        for mutation in ("reorder", "remove-work", "insert-work", "remove-collection"):
            candidate = copy.deepcopy(self.data)
            ids = candidate["collections"][0]["sr"]
            if mutation == "reorder":
                ids[:2] = reversed(ids[:2])
            elif mutation == "remove-work":
                ids.pop()
            elif mutation == "insert-work":
                ids.insert(0, "arith-new-work:sr")
            else:
                candidate["collections"].pop(0)
            with self.subTest(mutation=mutation), self.assertRaisesRegex(ValueError, "Fixed numbering"):
                builder.validate_stable_numbers(self.data, candidate)

    def test_same_edition_allows_appends_and_new_collections(self):
        candidate = copy.deepcopy(self.data)
        candidate["collections"][0]["sr"].append("arith-new-work:sr")
        candidate["collections"].append({
            "id": "book-new-edition-5", "grade": 5, "bookId": "book-new-edition",
            "sr": ["arith-new-work:sr"], "kr": [],
        })
        builder.validate_stable_numbers(self.data, candidate)

    def test_renumbering_requires_an_explicit_new_edition(self):
        candidate = copy.deepcopy(self.data)
        candidate["collections"][0]["sr"].reverse()
        candidate["edition"] = "2027-01"
        builder.validate_stable_numbers(self.data, candidate)
        for edition in (None, "", " "):
            candidate["edition"] = edition
            with self.subTest(edition=edition), self.assertRaisesRegex(ValueError, "numbering edition"):
                builder.validate_stable_numbers(self.data, candidate)

    def test_git_baseline_distinguishes_absent_registry_from_errors(self):
        # A real isolated Git history checks the fail-closed boundary: a first
        # publication has no registry, but invalid refs and corrupt files fail.
        with tempfile.TemporaryDirectory(prefix="numbering-baseline-") as directory:
            root = Path(directory)
            def git(*args):
                return subprocess.run(["git", *args], cwd=root, check=True,
                                      capture_output=True, text=True).stdout.strip()
            def commit(message):
                git("-c", "user.name=Numbering test", "-c", "user.email=numbering-test@example.invalid",
                    "commit", "--quiet", "--allow-empty", "-m", message)
                return git("rev-parse", "HEAD")
            git("init", "--quiet")
            empty = commit("Empty baseline")
            self.assertIsNone(builder.read_baseline_registry(empty, root=root))
            with self.assertRaisesRegex(ValueError, "Cannot read numbering baseline"):
                builder.read_baseline_registry("missing-ref", root=root)
            path = root / builder.REGISTRY_PATH
            path.parent.mkdir(parents=True)
            path.write_text("not JSON", encoding="utf-8")
            git("add", builder.REGISTRY_PATH)
            corrupt = commit("Corrupt registry")
            with self.assertRaisesRegex(ValueError, "Invalid JSON"):
                builder.read_baseline_registry(corrupt, root=root)
            path.write_text(builder.serialized(self.data), encoding="utf-8")
            git("add", builder.REGISTRY_PATH)
            valid = commit("Saved registry")
            self.assertEqual(builder.read_baseline_registry(valid, root=root), self.data)

    def test_unknown_edition_is_not_silently_added(self):
        bank = copy.deepcopy(self.bank)
        bank[0]["books"].append("Непроверенный новый учебник")
        bank[0]["book_grades"]["Непроверенный новый учебник"] = [5]
        with self.assertRaisesRegex(ValueError, "Textbooks"):
            builder.build_registry(bank=bank)

    def test_duplicate_and_missing_work_ids_are_rejected(self):
        for mutation in ("duplicate", "missing", "wrong-kind"):
            order = copy.deepcopy(self.order)
            scope = order["collections"][0]
            if mutation == "duplicate":
                scope["sr"].append(scope["sr"][0])
            elif mutation == "missing":
                scope["sr"].pop()
            else:
                scope["sr"][0] = scope["kr"][0]
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                builder.build_registry(order=order)

    def test_missing_edition_source_is_rejected(self):
        order = copy.deepcopy(self.order)
        book = next(b for b in order["books"] if b["title"] == "Виленкин и др. Математика. 5 класс. 2023")
        book["sourcePaths"] = ["school/peterson5/source-part1.json"]
        with self.assertRaisesRegex(ValueError, "No edition-specific topic evidence"):
            builder.build_registry(order=order)


if __name__ == "__main__":
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(NumberingChecks))
    if result.wasSuccessful():
        print("TEACHER_WORK_NUMBERING_REGRESSIONS_OK " + str(result.testsRun))
    sys.exit(0 if result.wasSuccessful() else 1)
