"""Independent metric checks against explicit §1 textbook givens and answers.

These checks establish numeric consistency of the named models, not source,
proof, pedagogical, or visual review approval.
"""
import json
import math
from pathlib import Path

COURSE = Path(__file__).resolve().parents[2] / 'stereo-course/merzlyak-10-base/lessons'


def points(number):
    card = json.loads((COURSE / f'ex-01-{number:03}.json').read_text())
    assert card['source']['chapter'] == 'Глава 1. Введение в стереометрию'
    return card['visualization']['model']['points']


def equal(actual, expected, label):
    assert math.isclose(actual, expected, rel_tol=1e-9, abs_tol=1e-9), (label, actual, expected)


def distance(p, a, b):
    return math.dist(p[a], p[b])


def vector(p, a, b):
    return [p[b][i] - p[a][i] for i in range(3)]


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def midpoint(p, middle, a, b):
    for i in range(3):
        equal(p[middle][i], (p[a][i] + p[b][i]) / 2, f'{middle} midpoint of {a}{b}')


p = points(7)
for a, b, length in [('A', 'B', 5), ('B', 'C', 6), ('A', 'C', 7)]:
    equal(distance(p, a, b), length, f'1.7 {a}{b}')

p = points(8)
for a, b, length in [('D', 'E', 2), ('E', 'F', 4), ('D', 'F', 6)]:
    equal(distance(p, a, b), length, f'1.8 {a}{b}')

p = points(15)
for square in [['A', 'B', 'C', 'D'], ['A', 'B', 'C1', 'D1']]:
    for i in range(4):
        a, b, c = square[i], square[(i + 1) % 4], square[(i + 2) % 4]
        equal(distance(p, a, b), 2, f'1.15 square side {a}{b}')
        equal(dot(vector(p, b, a), vector(p, b, c)), 0, f'1.15 right angle at {b}')
# CE crosses the common line AB at P; FD1 crosses it at Q.
for a, b, c in [('C', 'E', 'P'), ('D1', 'F', 'Q')]:
    x, y = vector(p, a, b), vector(p, a, c)
    cross = [x[1]*y[2]-x[2]*y[1], x[2]*y[0]-x[0]*y[2], x[0]*y[1]-x[1]*y[0]]
    equal(math.hypot(*cross), 0, f'1.15 collinear {a},{b},{c}')
for name in ['P', 'Q']:
    equal(p[name][0], 0, f'1.15 {name} on AB, x')
    equal(p[name][2], 0, f'1.15 {name} on AB, z')

p = points(22)
midpoint(p, 'M', 'A', 'C')
midpoint(p, 'N', 'A', 'B')
for name in ['A', 'K', 'E']:
    equal(p[name][1], 0, f'1.22 {name} on intersection, y')
    equal(p[name][2], 0, f'1.22 {name} on intersection, z')

p = points(24)
for a, b, length in [('B1', 'M', 4), ('B2', 'M', 4), ('M', 'C', 7), ('B1', 'C', 11), ('B2', 'C', 3)]:
    equal(distance(p, a, b), length, f'1.24 {a}{b}')

p = points(26)
for a, b, length in [('B', 'D', 12), ('B', 'M', 8), ('M', 'D', 4)]:
    equal(distance(p, a, b), length, f'1.26 {a}{b}')
equal(distance(p, 'A', 'B'), distance(p, 'B', 'C'), '1.26 isosceles')
equal(dot(vector(p, 'D', 'B'), vector(p, 'A', 'C')), 0, '1.26 BD perpendicular AC')
equal(distance(p, 'M', 'D') / distance(p, 'B', 'D'), 1/3, '1.26 area ratio')

p = points(27)
for a, b, length in [('E', 'K', 3), ('K', 'F', 5), ('A', 'B', 6), ('B', 'C', 6), ('C', 'D', 6), ('A', 'D', 10)]:
    equal(distance(p, a, b), length, f'1.27 {a}{b}')
midpoint(p, 'E', 'A', 'B')
midpoint(p, 'K', 'A', 'C')
midpoint(p, 'F', 'C', 'D')
ab, ac, ad = vector(p, 'A', 'B'), vector(p, 'A', 'C'), vector(p, 'A', 'D')
equal(dot(ab, ac)/(math.hypot(*ab)*math.hypot(*ac)), dot(ac, ad)/(math.hypot(*ac)*math.hypot(*ad)), '1.27 AC bisects BAD')
equal(sum(distance(p, a, b) for a, b in [('A','B'), ('B','C'), ('C','D'), ('D','A')]), 28, '1.27 perimeter')
print('MERZLYAK_PARA01_MODEL_METRICS_OK: 1.7, 1.8, 1.15, 1.22, 1.24, 1.26, 1.27')
