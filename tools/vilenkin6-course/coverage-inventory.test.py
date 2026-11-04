#!/usr/bin/env python3
"""Negative tests for evidence-backed whole-exercise completion."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('coverage_inventory', Path(__file__).with_name('coverage-inventory.py'))
MOD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MOD)


class CompletionProofTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = MOD.read_json(MOD.CATALOG)
        cls.original_manifest = MOD.read_json(MOD.VERIFICATIONS)
        cls.tasks = {}
        for path in MOD.DATA.glob('units-*.json'):
            for unit in MOD.read_json(path):
                for task in unit['tasks']:
                    cls.tasks[task['id']] = task
        cls.selections = {}
        for item in cls.original_manifest['fullExerciseVerifications']:
            cls.selections[item['sourceId']] = [
                {'taskId': part['taskId'], 'selectedSubpart': part['part']}
                for part in item['sourceSubparts']
            ]

    def setUp(self):
        self.manifest = copy.deepcopy(self.original_manifest)

    def verify(self, manifest=None, tasks=None, selections=None):
        return MOD.verify_complete_exercises(self.catalog, selections or self.selections,
                                             tasks or self.tasks, manifest or self.manifest)

    def test_exact_independent_source_and_content_proofs_pass(self):
        self.assertEqual(set(self.verify()), {'p1-exercise-2-97', 'p1-exercise-2-134'})

    def test_card_presence_without_declaration_never_implies_complete(self):
        self.manifest['fullExerciseVerifications'] = []
        self.assertEqual(self.verify(), {})

    def test_missing_subpart_is_rejected_even_if_other_cards_remain(self):
        self.manifest['fullExerciseVerifications'][0]['sourceSubparts'].pop()
        with self.assertRaisesRegex(AssertionError, 'selections differ'):
            self.verify()

    def test_wrong_part_mapping_is_rejected(self):
        self.manifest['fullExerciseVerifications'][0]['sourceSubparts'][0]['part'] = 'я'
        with self.assertRaisesRegex(AssertionError, 'subpart mapping differs'):
            self.verify()

    def test_changed_task_with_same_id_is_not_reviewed(self):
        tasks = copy.deepcopy(self.tasks)
        tasks['v6-book-2-97-д']['answer'] = '15'
        with self.assertRaisesRegex(AssertionError, 'content changed'):
            self.verify(tasks=tasks)

    def test_unrelated_task_change_does_not_invalidate_subset_proof(self):
        tasks = copy.deepcopy(self.tasks)
        tasks['v6-book-2-98-а']['hint'] += ' Other exercise change.'
        self.assertEqual(len(self.verify(tasks=tasks)), 2)

    def test_wrong_edition_is_rejected(self):
        self.manifest['fullExerciseVerifications'][0]['sourcePdfSha256'] = '0' * 64
        with self.assertRaises(AssertionError):
            self.verify()

    def test_changed_evidence_digest_is_rejected(self):
        self.manifest['fullExerciseVerifications'][0]['independentReview']['sha256'] = '0' * 64
        with self.assertRaisesRegex(AssertionError, 'evidence changed'):
            self.verify()

    def test_same_author_and_reviewer_is_rejected(self):
        self.manifest['fullExerciseVerifications'] = self.manifest['fullExerciseVerifications'][:1]
        evidence = self.manifest['fullExerciseVerifications'][0]['independentReview']
        review = MOD.read_json(MOD.ROOT / evidence['file'])
        review['exercises'][0]['reviewer'] = review['exercises'][0]['author']
        with tempfile.TemporaryDirectory() as tmp:
            evidence['file'] = 'independent-review.json'
            path = Path(tmp) / evidence['file']
            path.write_text(json.dumps(review, ensure_ascii=False), encoding='utf-8')
            evidence['sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
            with patch.object(MOD, 'ROOT', Path(tmp)):
                with self.assertRaisesRegex(AssertionError, 'Independent reviewer required'):
                    self.verify()

    def test_summary_keeps_full_book_unfinished(self):
        coverage = MOD.build_coverage(self.catalog)
        self.assertEqual(coverage['summary']['selectedTaskCards'], 194)
        self.assertEqual(coverage['summary']['byKind']['exercise']['complete'], 2)
        self.assertFalse(coverage['summary']['wholeCourseComplete'])
        self.assertFalse(coverage['summary']['subpartsInventoryComplete'])


if __name__ == '__main__':
    unittest.main()
