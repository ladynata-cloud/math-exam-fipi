#!/usr/bin/env python3
"""Negative controls: false geometry must not receive a passing model gate."""
from copy import deepcopy
import unittest
from check_models import validate


class GeometricClaims(unittest.TestCase):
    def setUp(self):
        self.model = dict(planar=True, edges=[], points={'O': [30, 30, 0], 'A': [50, 30, 0],
                            'B': [30, 50, 0], 'M': [40, 30, 0]}, views={'neutral': dict(label='Условие',
                            points=['O', 'A', 'B'], segments=[['O', 'A'], ['O', 'B']],
                            rightAngles=[dict(vertex='O', a='A', b='B')])}, checks=[])

    def test_true_right_angle(self):
        self.assertEqual(validate(self.model), [])

    def test_oblique_ray_cannot_be_marked_right(self):
        self.model['points']['B'] = [40, 50, 0]
        self.assertTrue(any('False right-angle' in e for e in validate(self.model)))

    def test_false_midpoint_mark(self):
        view = self.model['views']['neutral']
        view['equalSegments'] = [dict(a='O', b='M'), dict(a='M', b='A')]
        self.assertEqual(validate(self.model), [])
        self.model['points']['M'][0] = 42
        self.assertTrue(any('False equal-length' in e for e in validate(self.model)))

    def test_hidden_later_view_is_also_checked(self):
        self.model['views']['step-2'] = deepcopy(self.model['views']['neutral'])
        self.model['views']['step-2']['rightAngles'] = [dict(vertex='A', a='O', b='B')]
        self.assertTrue(any('step-2: False right-angle' in e for e in validate(self.model)))

    def test_parallel_and_ratio_claims(self):
        self.model['checks'] = [dict(type='parallel', segments=[['O', 'A'], ['O', 'B']]),
                                dict(type='distanceRatio', segments=[['O', 'M'], ['O', 'A']], ratio=2)]
        self.assertEqual(sum('claim is false' in e for e in validate(self.model)), 2)

    def test_complete_circle_must_fit_its_authored_viewport(self):
        self.model['bounds'] = [0, 0, 60, 60]
        self.model['views']['neutral']['circles'] = [dict(center='O', through='A')]
        self.assertEqual(validate(self.model), [])
        self.model['bounds'] = [15, 15, 45, 45]
        self.assertTrue(any('Circle is clipped' in e for e in validate(self.model)))


if __name__ == '__main__':
    unittest.main()
