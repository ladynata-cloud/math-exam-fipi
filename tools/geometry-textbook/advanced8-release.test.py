#!/usr/bin/env python3
"""Advanced8 admission, review invalidation and exact1407 preservation.

Synthetic receipts are confined to temporary roots and are explicitly labelled.
No test writes approval, published content, or learner data in the repository.
"""
from copy import deepcopy
import contextlib
import io
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

from build_course import ROOT, COURSE, compose
from build_advanced8_candidate import candidate
from advanced8_release import (KEY, LABEL, PREFIX, SOURCE_FILE, REVIEW_FILE, SCOPE,
    BASE_BUNDLE_SHA, BASE_SCOPE_SHA, RUNTIME, IMPLEMENTATION, MATH_EVIDENCE,
    NUMERIC_EVIDENCE, VISUAL_EVIDENCE, encoded, serialized, sha, read, draft_rows,
    has_supplement, previous_scope, historical_ix_projection, append_release,
    authored_rows, binding_fields, matching_review, validate_release)
from stage_advanced8_release import stage
import stage_advanced8_release as staging


class Advanced8Release(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        current = compose()
        current_scope = read(ROOT / 'tools/geometry-textbook/release-scope.json')
        if has_supplement(current, current_scope):
            validate_release(current)
        cls.base, cls.old_scope = historical_ix_projection(current, current_scope)
        cls.scope = deepcopy(cls.old_scope)
        cls.scope['supplements'].append(SCOPE)
        cls.scope['totalCards'] += 18

    def fixture(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name).resolve()
        self.assertNotEqual(root, ROOT)
        self.assertNotIn(ROOT, root.parents)
        course = root / PREFIX
        for name in RUNTIME + (SOURCE_FILE,):
            target = course / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(COURSE / name, target)
        for name in IMPLEMENTATION + (MATH_EVIDENCE, NUMERIC_EVIDENCE):
            target = root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / name, target)
        source = read(course / SOURCE_FILE)
        visual = dict(source='passed', models='passed', browser='passed',
                      reviewer='TEST FIXTURE ONLY, NO REVIEW OR PUBLICATION APPROVAL',
                      at='2000-01-01T00:00:00Z', independentReviewer=True,
                      authoredFileSha256=sha((course / SOURCE_FILE).read_bytes()),
                      runtimeFiles={name: sha((course / name).read_bytes()) for name in RUNTIME},
                      widths=[320, 1280], views=94, viewWidthPairs=188,
                      sourcePages=[214, 215], sourceFigure=274,
                      inspectedViewPairs=sorted(
                          f'atanasyan-7-9-main-{c["number"]}-part-1/{view}/{width}'
                          for c in source['cards'] for view in c['model']['views']
                          for width in (320, 1280)))
        (root / VISUAL_EVIDENCE).write_bytes(encoded(visual))
        target = root / 'tools/geometry-textbook/release-scope.json'
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(encoded(self.scope))
        receipt = binding_fields(self.base, root, course)
        receipt.update(status='passed', source='passed', mathematics='passed',
                       models='passed', pedagogy='passed', browser='passed',
                       reviewer='TEST FIXTURE ONLY, NO REVIEW OR PUBLICATION APPROVAL',
                       at='2000-01-01T00:00:00Z')
        (course / REVIEW_FILE).write_bytes(encoded(receipt))
        return root, course, receipt

    def test_exact_frozen_publication_and_scope(self):
        self.assertEqual(sha(serialized(self.base)), BASE_BUNDLE_SHA)
        self.assertEqual(sha(encoded(self.old_scope)), BASE_SCOPE_SHA)
        self.assertEqual(len(self.base['lessons']), 1407)
        self.assertTrue(self.base['build']['publicationReviewMatches'])
        self.assertEqual((COURSE / SOURCE_FILE).read_bytes(),
                         (ROOT / 'content-drafts/atanasyan-grade8-advanced/authored.json').read_bytes())

    def test_same_teaching_as_reviewed_preview_and_all_stable_ids(self):
        rows = authored_rows(self.base, read(COURSE / SOURCE_FILE))
        self.assertEqual(rows, draft_rows(candidate()['lessons'][-18:]))
        root, course, _ = self.fixture()
        result = append_release(self.base, root, course, self.scope)
        self.assertEqual(result['lessons'][:1407], self.base['lessons'])
        self.assertEqual(result['catalog']['entries'][:1407], self.base['catalog']['entries'])
        self.assertEqual(len({r['id'] for r in result['lessons']}), 1425)
        self.assertEqual(result['build']['numberedExercises'], 841)
        self.assertEqual([r['revision'] for r in result['lessons'][-18:]], [1] * 18)
        self.assertEqual(result['sourceInventory'], self.base['sourceInventory'])
        self.assertNotIn('candidateOnly', result['build'])
        self.assertFalse(result['build']['fullTextbookComplete'])

    def test_no_receipt_cannot_inherit_old_approval(self):
        root, course, _ = self.fixture()
        (course / REVIEW_FILE).unlink()
        result = append_release(self.base, root, course, self.scope)
        self.assertFalse(result['build']['publicationReviewMatches'])
        self.assertEqual(result['lessons'][:1407], self.base['lessons'])
        self.assertTrue(all(r['status'] == 'in-review' for r in result['lessons'][-18:]))
        self.assertTrue(all(r['review']['reviewer'] == '' for r in result['lessons'][-18:]))
        self.assertIsNone(matching_review(self.base, root, course))

    def test_changed_or_unreviewed_predecessor_cannot_approve_supplement(self):
        root, course, _ = self.fixture()
        for mutation in ('old review missing', 'old content changed'):
            with self.subTest(mutation=mutation):
                base = deepcopy(self.base)
                if mutation == 'old review missing':
                    base['build']['publicationReviewMatches'] = False
                    base['lessons'][0]['status'] = 'in-review'
                else:
                    base['lessons'][0]['statement']['text'] += ' Changed predecessor.'
                self.assertIsNone(matching_review(base, root, course))
                result = append_release(base, root, course, self.scope)
                self.assertEqual(result['lessons'][:1407], base['lessons'])
                self.assertFalse(result['build']['publicationReviewMatches'])
                self.assertTrue(all(r['status'] == 'in-review' for r in result['lessons'][-18:]))

    def test_malformed_predecessor_metadata_is_an_explicit_gate_rejection(self):
        root, course, _ = self.fixture()
        result = append_release(self.base, root, course, self.scope)
        result['build']['chapters'].append({'chapter': 8})
        with self.assertRaisesRegex(AssertionError, 'Malformed previous'):
            historical_ix_projection(result, self.scope)

    def test_each_review_dimension_provenance_and_scope_are_required(self):
        root, course, receipt = self.fixture()
        self.assertIsNotNone(matching_review(self.base, root, course))
        for key in ('status', 'source', 'mathematics', 'models', 'pedagogy',
                    'browser', 'reviewer', 'at', 'scope'):
            with self.subTest(field=key):
                changed = deepcopy(receipt)
                changed[key] = {} if key == 'scope' else ''
                (course / REVIEW_FILE).write_bytes(encoded(changed))
                self.assertIsNone(matching_review(self.base, root, course))
        (course / REVIEW_FILE).write_bytes(encoded(receipt))

    def test_authored_edit_and_runtime_edit_invalidate_only_the_new_receipt(self):
        root, course, receipt = self.fixture()
        for name in (SOURCE_FILE, 'assets/planar-viewer.js', 'assets/engine.js'):
            with self.subTest(file=name):
                target = course / name
                raw = target.read_bytes()
                if name == SOURCE_FILE:
                    data = json.loads(raw)
                    data['cards'][0]['condition'] += ' Changed after review.'
                    target.write_bytes(encoded(data))
                else:
                    target.write_bytes(raw + b'\n// Unreviewed change.\n')
                self.assertIsNone(matching_review(self.base, root, course))
                target.write_bytes(raw)
        target = root / IMPLEMENTATION[1]
        target.write_bytes(target.read_bytes() + b'\n# Unreviewed composer change.\n')
        self.assertIsNone(matching_review(self.base, root, course))
        self.assertEqual(self.base['lessons'][0]['status'], 'reviewed')

    def test_rehashed_partial_or_duplicate_visual_evidence_is_rejected(self):
        root, course, original = self.fixture()
        target = root / VISUAL_EVIDENCE
        visual = read(target)
        mutations = {
            'source': lambda x: x.update(source='pending'),
            'models': lambda x: x.update(models='pending'),
            'browser': lambda x: x.update(browser='pending'),
            'reviewer': lambda x: x.update(reviewer=''),
            'independence': lambda x: x.update(independentReviewer=False),
            'source hash': lambda x: x.update(authoredFileSha256='stale'),
            'width': lambda x: x.update(widths=[1280]),
            'partial views': lambda x: x.update(viewWidthPairs=187),
            'figure': lambda x: x.update(sourceFigure=273),
            'duplicate pair': lambda x: x['inspectedViewPairs'].__setitem__(0, x['inspectedViewPairs'][1]),
            'missing pair': lambda x: x['inspectedViewPairs'].pop(),
            'runtime': lambda x: x['runtimeFiles'].__setitem__('assets/engine.js', 'stale'),
        }
        for name, mutate in mutations.items():
            with self.subTest(case=name):
                changed = deepcopy(visual)
                mutate(changed)
                target.write_bytes(encoded(changed))
                receipt = deepcopy(original)
                receipt.update(binding_fields(self.base, root, course))
                (course / REVIEW_FILE).write_bytes(encoded(receipt))
                self.assertIsNone(matching_review(self.base, root, course))
        target.write_bytes(encoded(visual))

    def test_rehashed_pending_mathematical_evidence_is_rejected(self):
        root, course, receipt = self.fixture()
        target = root / NUMERIC_EVIDENCE
        numeric = read(target)
        numeric['mathematics'] = 'pending'
        target.write_bytes(encoded(numeric))
        receipt.update(binding_fields(self.base, root, course))
        (course / REVIEW_FILE).write_bytes(encoded(receipt))
        self.assertIsNone(matching_review(self.base, root, course))
        target.unlink()
        self.assertIsNone(matching_review(self.base, root, course))

    def test_complete_union_gate_and_frozen_1407_reject_mutations(self):
        # This real-code candidate is in-review until the actual receipt exists.
        result = append_release(self.base, ROOT, COURSE, self.scope)
        validate_release(result, ROOT, COURSE, False, self.scope)
        for mode in ('old text', 'old revision', 'old review', 'old order',
                     'old catalog', 'old runtime', 'old metadata', 'new text',
                     'new review', 'new model', 'duplicate new', 'missing new',
                     'extra group', 'full book'):
            with self.subTest(case=mode):
                changed = deepcopy(result)
                if mode == 'old text': changed['lessons'][0]['statement']['text'] += ' edited'
                elif mode == 'old revision': changed['lessons'][0]['revision'] += 1
                elif mode == 'old review': changed['lessons'][0]['review']['reviewer'] = 'forged'
                elif mode == 'old order': changed['lessons'][0], changed['lessons'][1] = changed['lessons'][1], changed['lessons'][0]
                elif mode == 'old catalog': changed['catalog']['entries'][0]['id'] = 'changed'
                elif mode == 'old runtime': changed['build']['implementationSha256'] = 'forged'
                elif mode == 'old metadata': changed['catalog']['book']['title'] += ' edited'
                elif mode == 'new text': changed['lessons'][-1]['statement']['text'] += ' edited'
                elif mode == 'new review': changed['lessons'][-1]['review']['reviewer'] = 'forged'
                elif mode == 'new model': changed['lessons'][-1]['visualization']['model']['points']['A__v0'][0] += 1
                elif mode == 'duplicate new': changed['lessons'].append(deepcopy(changed['lessons'][-1]))
                elif mode == 'missing new': changed['lessons'].pop()
                elif mode == 'extra group': changed['build']['supplements'].append(dict(key='unreviewed'))
                else: changed['build']['fullTextbookComplete'] = True
                with self.assertRaises((AssertionError, ValueError)):
                    validate_release(changed, ROOT, COURSE, False, self.scope)

    def test_adjacent_source_numbers_and_scope_cannot_be_admitted(self):
        root, course, _ = self.fixture()
        source = read(course / SOURCE_FILE)
        for mode in ('omitted number', 'next number', 'wrong page', 'missing view'):
            with self.subTest(case=mode):
                changed = deepcopy(source)
                if mode == 'omitted number': changed['cards'].pop()
                elif mode == 'next number': changed['cards'][-1]['number'] = 842
                elif mode == 'wrong page': changed['cards'][-1]['printedPages'] = [216]
                else: changed['cards'][0]['model']['views'].pop('step-1')
                (course / SOURCE_FILE).write_bytes(encoded(changed))
                with self.assertRaises(ValueError):
                    append_release(self.base, root, course, self.scope)
        for key, value in (('totalCards', 1426), ('fullTextbookComplete', True)):
            changed = deepcopy(self.scope)
            changed[key] = value
            with self.assertRaises(AssertionError): previous_scope(changed)

    def test_inactive_preparation_cannot_silently_expand_publication(self):
        root, course, _ = self.fixture()
        self.assertIs(append_release(self.base, root, course, self.old_scope), self.base)
        (course / REVIEW_FILE).unlink()
        self.assertIs(append_release(self.base, root, course, self.old_scope), self.base)

    def test_staging_cannot_overwrite_a_repository_or_existing_directory(self):
        with self.assertRaises(AssertionError): stage(ROOT / 'forbidden-release')
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(AssertionError): stage(Path(directory))

    def test_hash_only_binding_refresh_does_not_approve_a_missing_receipt(self):
        with tempfile.TemporaryDirectory() as directory:
            course = Path(directory) / 'course'
            shutil.copytree(COURSE, course)
            (course / REVIEW_FILE).unlink(missing_ok=True)
            pending = append_release(self.base, ROOT, course, self.scope)
            self.assertTrue(all(row['status'] == 'in-review' for row in pending['lessons'][-18:]))
            with patch.object(staging, 'compose', return_value=pending), \
                 patch.object(staging, 'read', return_value=self.scope), \
                 patch.object(staging, 'COURSE', course):
                with self.assertRaises(AssertionError): staging.base_course()
                base, scope = staging.base_course(require_review=False)
            self.assertEqual(sha(serialized(base)), BASE_BUNDLE_SHA)
            self.assertEqual(scope, self.old_scope)
            self.assertFalse((course / REVIEW_FILE).exists())

    def test_current_publication_requires_all_reviews_if_promoted(self):
        current = compose()
        scope = read(ROOT / 'tools/geometry-textbook/release-scope.json')
        if has_supplement(current, scope):
            validate_release(current, require_review=True)
            self.assertEqual(len(current['lessons']), 1425)
        else:
            self.assertEqual(sha(serialized(current)), BASE_BUNDLE_SHA)


if __name__ == '__main__':
    unittest.main(verbosity=2)
