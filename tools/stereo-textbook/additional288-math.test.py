"""Independent coordinate and parameter oracles for additional tasks 288–293.

Uses dot products/projections as a test oracle; the lessons themselves keep
school-geometric proofs. Sampled coordinates do not certify universal proofs.
"""
import json
import math
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
CARDS = {n: json.loads((ROOT / f'stereo-course/textbook/lessons/ex-main-{n:04}.json').read_text()) for n in range(288, 294)}


def close(actual, expected, message):
    assert np.allclose(actual, expected, rtol=1e-9, atol=1e-8), (message, actual, expected)


def points(number):
    return {name: np.array(value, dtype=float) for name, value in CARDS[number]['visualization']['model']['points'].items()}


def distance(a, b):
    return float(np.linalg.norm(a - b))


def angle(a, b):
    return math.acos(np.clip(np.dot(a, b) / np.linalg.norm(a) / np.linalg.norm(b), -1, 1))


def rectangle_box(number):
    p = points(number)
    u, v, w = p['B'] - p['A'], p['D'] - p['A'], p['A1'] - p['A']
    for first, second in [(u, v), (u, w), (v, w)]:
        close(np.dot(first, second), 0, f'{number} perpendicular box directions')
    for name, expected in {'C': p['A'] + u + v, 'B1': p['A'] + u + w, 'D1': p['A'] + v + w, 'C1': p['A'] + u + v + w}.items():
        close(p[name], expected, f'{number} affine vertex {name}')
    return p, np.linalg.norm(u), np.linalg.norm(v), np.linalg.norm(w)


# 288: a general translated-polygon prism has two disjoint vertex layers and
# exactly three n-edge classes. Do not infer a general count from the model n=5.
for n in range(3, 61):
    lower = {('lower', i) for i in range(n)}
    upper = {('upper', i) for i in range(n)}
    edges = {frozenset((('lower', i), ('lower', (i + 1) % n))) for i in range(n)}
    edges |= {frozenset((('upper', i), ('upper', (i + 1) % n))) for i in range(n)}
    edges |= {frozenset((('lower', i), ('upper', i))) for i in range(n)}
    assert not lower & upper and len(lower | upper) == 2 * n and len(edges) == 3 * n
p = points(288)
translation = p['A1'] - p['A']
for letter in 'ABCDE':
    close(p[letter + '1'] - p[letter], translation, '288 matching prism vertices')
model = CARDS[288]['visualization']['model']
assert len(model['points']) == 10
assert len({frozenset(edge) for edge in model['edges']}) == 15
assert abs(translation[0]) + abs(translation[1]) > 0, '288 illustrates a genuinely oblique prism'

# 289: both the drawn cube and arbitrary edge sizes obey the space-diagonal
# identity. A face diagonal would produce the wrong claimed surface area.
p, a, b, h = rectangle_box(289)
close([a, b, h], [a, a, a], '289 actual cube')
close(6 * a * a, 2 * distance(p['A'], p['C1']) ** 2, '289 actual space diagonal')
for side in [0.01, 0.5, 1, math.sqrt(2), 4, 1000]:
    close(6 * side * side, 2 * (math.sqrt(3) * side) ** 2, '289 arbitrary cube edge')
    assert not math.isclose(6 * side * side, 2 * (math.sqrt(2) * side) ** 2), 'face diagonal is not interchangeable'


def area_290(a, b, h):
    l = math.hypot(a, b)
    q = math.sqrt(a * a + b * b + h * h)
    phi = math.atan2(b, a)
    theta = math.acos(a / q)
    assert 0 < phi < theta < math.pi / 2
    result = 2 * l * l * (math.cos(phi) + math.sin(phi)) * math.sqrt(math.cos(phi) ** 2 - math.cos(theta) ** 2) / math.cos(theta)
    close(result, 2 * (a + b) * h, '290 symbolic area versus four rectangular faces')
    return phi, theta


def area_291(a, b, h):
    d = math.sqrt(a * a + b * b + h * h)
    phi = math.atan2(h, math.hypot(a, b))
    theta = math.acos(a / d)
    assert 0 < phi < theta < math.pi / 2
    result = 2 * d * d * math.sin(phi) * (math.cos(theta) + math.sqrt(math.cos(phi) ** 2 - math.cos(theta) ** 2))
    close(result, 2 * (a + b) * h, '291 symbolic area versus four rectangular faces')
    return phi, theta


# Non-special samples make swapped φ/θ and plane/line-angle substitutions fail.
rng = np.random.default_rng(288293)
for a, b, h in rng.uniform(0.2, 25, size=(400, 3)):
    area_290(a, b, h)
    area_291(a, b, h)
for number, oracle in [(290, area_290), (291, area_291)]:
    p, a, b, h = rectangle_box(number)
    phi, theta = oracle(a, b, h)
    ab, ac, ac1 = p['B'] - p['A'], p['C'] - p['A'], p['C1'] - p['A']
    close(angle(ab, ac if number == 290 else ac1), phi if number == 290 else theta, f'{number} side angle')
    close(angle(ab, ac1), theta, f'{number} θ uses the space diagonal')
    if number == 291:
        close(angle(ac, ac1), phi, '291 φ uses orthogonal projection onto the base')
    close(np.dot(p['C1'] - p['B'], ab), 0, f'{number} right angle ABC1')

# 292: derive the unique shortest connector by an independent two-line least
# squares solve, then check both authored feet and the plane-to-line transfer.
p, a, b, h = rectangle_box(292)
close([a, b, h], [6, 6, 8], '292 source dimensions')
u, v = p['B'] - p['A'], p['B1'] - p['D']
t, s = np.linalg.lstsq(np.column_stack((u, -v)), p['D'] - p['A'], rcond=None)[0]
on_base, on_diagonal = p['A'] + t * u, p['D'] + s * v
assert 0 < t < 1 and 0 < s < 1
close(p['P'], on_base, '292 actual base foot')
close(p['N'], on_diagonal, '292 actual diagonal foot')
connector = p['N'] - p['P']
close(np.dot(connector, u), 0, '292 normal to AB')
close(np.dot(connector, v), 0, '292 normal to DB1')
close(np.linalg.norm(connector), 4.8, '292 common-perpendicular length')
line = p['A1'] - p['D']
foot = p['D'] + np.dot(p['A'] - p['D'], line) / np.dot(line, line) * line
close(p['H'], foot, '292 auxiliary foot H')
close(p['N'] - p['H'], p['P'] - p['A'], '292 parallelogram transfer')
close(distance(p['A'], p['H']), distance(p['P'], p['N']), '292 transferred normal length')
assert not math.isclose(distance(p['A'], p['D']), 4.8), '292 arbitrary connector is not the distance'

# 293: the supplied perpendicular diagonals force h²=2a². Check the proof's
# actual centre and equilateral triangle, not only a computed final angle.
p, a, b, h = rectangle_box(293)
close(a, b, '293 square base')
close(np.dot(p['B1'] - p['D'], p['D1'] - p['B']), 0, '293 source perpendicular diagonals')
close(h * h, 2 * a * a, '293 forced height')
for first, second in [('A1', 'C'), ('B1', 'D'), ('D1', 'B')]:
    close(p['O'], (p[first] + p[second]) / 2, '293 common diagonal midpoint')
close([distance(p['O'], p['A1']), distance(p['O'], p['B1']), distance(p['A1'], p['B1'])], [a, a, a], '293 equilateral proof triangle')
close(angle(p['A1'] - p['O'], p['B1'] - p['O']), math.pi / 3, '293 acute line angle')
for side in [0.2, 1, math.sqrt(3), 5, 100]:
    height = side * math.sqrt(2)
    first, second = np.array([side, side, -height]), np.array([-side, side, -height])
    close(abs(np.dot(first, second)) / np.linalg.norm(first) / np.linalg.norm(second), .5, '293 all admissible scales')

print('ATANASYAN_ADDITIONAL_288_293_MATH_OK: six actual models; 400 parameter boxes; exact common perpendicular; diagonal-centre proof')
