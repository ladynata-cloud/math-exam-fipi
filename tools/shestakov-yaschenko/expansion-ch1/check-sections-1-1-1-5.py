"""Independent numeric/geometry checks for the 36 new §1.1/§1.5 cards.

Inputs below are transcribed source values. Determinants and intersections
cross-check the lessons' different elementary solution routes. This is an
author check, not independent content-review approval or a general proof gate.
Run from any directory; standard library only; no writes.
"""
import math
import runpy
import sys
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
cards = runpy.run_path(str(HERE / 'sections-1-1-1-5.py'))['lessons']
lookup = {(c['section'], c['level'], c['number'], c['part']): c for c in cards}
expected = {('1.1', level, n, part) for level, nums in [('A', [3, 4, 5, 6, 7, 10, 11, 12]), ('B', [3, 4])] for n in nums for part in 'ab'}
expected |= {('1.5', level, n, part) for level, nums in [('A', [1, 2, 3, 7]), ('B', [1, 3]), ('C', [1, 3])] for n in nums for part in 'ab'}
assert set(lookup) == expected and len(cards) == 36


def sub(a, b): return tuple(x - y for x, y in zip(a, b))
def dot(a, b): return sum(x * y for x, y in zip(a, b))
def cross(a, b): return a[0] * b[1] - a[1] * b[0]
def norm(a): return math.sqrt(dot(a, a))
def dist(a, b): return norm(sub(a, b))
def close(a, b): assert math.isclose(a, b, abs_tol=1e-8, rel_tol=1e-8), (a, b)
def angle(a, o, b):
    u, w = sub(a, o), sub(b, o)
    return math.degrees(math.acos(max(-1, min(1, dot(u, w) / norm(u) / norm(w)))))
def lesson(sec, level, n, part): return lookup[(sec, level, n, part)]
def pts(sec, level, n, part): return {k: tuple(v[:2]) for k, v in lesson(sec, level, n, part)['model']['points'].items()}
def answer(sec, level, n, part, value): assert str(value) in lesson(sec, level, n, part)['answer']['accepted']
def sourcecoords(p, expectedpoints):
    for name, point in expectedpoints.items(): assert p[name] == point, (name, p[name], point)


# Source diagrams: exact lattice nodes independently read from page images.
for part, A, B, C, distance in [('a', (5, 5), (2, 2), (8, 2), 3), ('b', (2, 2), (8, 5), (8, 1), 6)]:
    p = pts('1.1', 'A', 3, part)
    sourcecoords(p, {'A': A, 'B': B, 'C': C})
    close(abs(cross(sub(A, B), sub(C, B))) / dist(C, B), distance)
    close(dot(sub(A, p['H']), sub(C, B)), 0)
    answer('1.1', 'A', 3, part, distance)

for part, A, B, C in [('a', (2, 2), (6, 4), (2, 6)), ('b', (2, 4), (4, 7), (8, 1))]:
    p = pts('1.1', 'A', 4, part)
    sourcecoords(p, {'A': A, 'B': B, 'C': C})
    ab, bc = dist(A, B), dist(B, C)
    D = tuple((bc * a + ab * c) / (ab + bc) for a, c in zip(A, C))
    close(dist(D, p['D']), 0)
    close(angle(A, B, D), angle(D, B, C))
    close(dist(B, D), 4)
    answer('1.1', 'A', 4, part, 4)

for part, A, B, C in [('a', (2, 2), (6, 4), (4, 6)), ('b', (2, 1), (8, 7), (2, 4))]:
    p = pts('1.1', 'A', 5, part)
    sourcecoords(p, {'A': A, 'B': B, 'C': C})
    M = tuple((a + b) / 2 for a, b in zip(A, B))
    close(dist(M, p['M']), 0)
    close(dist(C, M), 3)
    answer('1.1', 'A', 5, part, 3)

for part, ab, ac, bc in [('a', 17, 33, 16), ('b', 45, 30, 75)]:
    p = pts('1.1', 'A', 6, part)
    for a, b, expectedangle in [('_a1', '_b1', ab), ('_a1', '_c1', ac), ('_b1', '_c1', bc)]: close(angle(p[a], p['O'], p[b]), expectedangle)
    answer('1.1', 'A', 6, part, bc)

for part, result in [('a', 35), ('b', 145)]:
    p = pts('1.1', 'A', 7, part)
    close(cross(sub(p['_a1'], p['_a0']), sub(p['_b1'], p['_b0'])), 0)
    close(angle(p['_a1'], p['K'], p['L']), 35)
    answer('1.1', 'A', 7, part, result)

for part in 'ab':
    p = pts('1.1', 'A', 10, part)
    close(angle(p['A'], p['O'], p['B']), 180)
    close(angle(p['K'], p['O'], p['C']), 28)
    close(angle(p['K'], p['O'], p['C']), angle(p['K'], p['O'], p['B']))
    close(angle(p['L'], p['O'], p['C']), angle(p['L'], p['O'], p['A']))
    close(angle(p['L'], p['O'], p['C']) + angle(p['K'], p['O'], p['C']), 90)
    close(angle(p['A'], p['O'], p['C']), 124)
assert lesson('1.1', 'A', 10, 'a')['answer']['mode'] == 'manual'
answer('1.1', 'A', 10, 'b', 124)

for part in 'ab':
    p = pts('1.1', 'A', 11, part)
    for a, b, degrees in [('A', 'C', 53), ('B', 'C', 23), ('B', 'D', 56), ('C', 'D', 33), ('A', 'D', 86)]: close(angle(p[a], p['O'], p[b]), degrees)
    answer('1.1', 'A', 11, part, 33 if part == 'a' else 86)
    p = pts('1.1', 'A', 12, part)
    close(cross(sub(p['B'], p['A']), sub(p['D'], p['C'])), 0)
    close(angle(p['C'], p['L'], p['M']), angle(p['M'], p['L'], p['K']))
    close(angle(p['L'], p['K'], p['N']), angle(p['N'], p['K'], p['B']))
    close(cross(sub(p['M'], p['L']), sub(p['N'], p['K'])), 0)
    close(angle(p['K'], p['M'], p['L']), angle(p['K'], p['N'], p['L']))
    assert lesson('1.1', 'A', 12, part)['answer']['mode'] == 'manual'

for part, ab, dc, ac, mc in [('a', 14, 42, 56, 42), ('b', 17, 51, 64, 48)]:
    p = pts('1.1', 'B', 3, part)
    for a, b, length in [('A', 'B', ab), ('D', 'C', dc), ('A', 'C', ac), ('M', 'C', mc)]: close(dist(p[a], p[b]), length)
    close(cross(sub(p['A'], p['M']), sub(p['C'], p['M'])), 0)
    close(cross(sub(p['B'], p['M']), sub(p['D'], p['M'])), 0)
    assert dot(sub(p['A'], p['M']), sub(p['C'], p['M'])) < 0
    close(ac * dc / (ab + dc), mc)
    answer('1.1', 'B', 3, part, mc)

for part, O, P, Q, result in [('a', (2, 1), (3, 4), (6, 3), 1), ('b', (4, 2), (2, 3), (7, 3), -1)]:
    p = pts('1.1', 'B', 4, part)
    sourcecoords(p, {'O': O, 'P': P, 'Q': Q})
    u, w = sub(P, O), sub(Q, O)
    close(abs(cross(u, w)) / dot(u, w), result)
    close(angle(P, O, Q), 45 if part == 'a' else 135)
    answer('1.1', 'B', 4, part, result)

# Determinants cross-check all three base/height and square-subtraction methods.
areas = [(1, 'a', (1, 6), (9, 6), (9, 9), 12), (1, 'b', (1, 6), (10, 6), (1, 8), 9),
         (2, 'a', (1, 6), (9, 6), (7, 9), 12), (2, 'b', (1, 6), (10, 6), (3, 8), 9),
         (3, 'a', (1, 7), (3, 7), (5, 9), 2), (3, 'b', (1, 7), (5, 7), (9, 9), 4)]
for n, part, A, B, C, area in areas:
    p = pts('1.5', 'A', n, part)
    sourcecoords(p, {'A': A, 'B': B, 'C': C})
    close(abs(cross(sub(B, A), sub(C, A))) / 2, area)
    answer('1.5', 'A', n, part, area)
    if n == 3: assert p['H'][0] > B[0]

for part, a, b, result in [('a', (-3, 5), (0, -1), (-3, 4)), ('b', (5, 3), (-2, -3), (3, 0))]:
    p = pts('1.5', 'A', 7, part)
    sourcecoords(p, {'O': (0, 0), 'P': a, 'Q': b, 'R': result})
    assert tuple(x + y for x, y in zip(a, b)) == result
    answer('1.5', 'A', 7, part, f'{result[0]};{result[1]}')

for part, A, B, area in [('a', (7, 10), (10, 7), 25.5), ('b', (9, 10), (10, 9), 9.5)]:
    p = pts('1.5', 'B', 1, part)
    sourcecoords(p, {'O': (0, 0), 'A': A, 'B': B})
    close(abs(cross(A, B)) / 2, area)
    answer('1.5', 'B', 1, part, area)

for part, A, B, C, target, start, end1, end2, length in [
    ('a', (2, 5), (0, 0), (4, 3), 'M', 'B', 'A', 'C', 5),
    ('b', (-3, -2), (-6, 2), (0, 0), 'P', 'C', 'A', 'B', 4.5)]:
    p = pts('1.5', 'B', 3, part)
    sourcecoords(p, {'A': A, 'B': B, 'C': C})
    assert tuple((x + y) / 2 for x, y in zip(p[end1], p[end2])) == p[target]
    close(dist(p[start], p[target]), length)
    answer('1.5', 'B', 3, part, length)

for part, am, mc, ab, bc, squared in [('a', 2, 3, 10, 5, 40), ('b', 3, 5, 16, 8, 109)]:
    p = pts('1.5', 'C', 1, part)
    close(dist(p['A'], p['M']) / dist(p['M'], p['C']), am / mc)
    close(dist(p['A'], p['B']), ab)
    close(dist(p['B'], p['C']), bc)
    close(dot(sub(p['A'], p['B']), sub(p['C'], p['B'])), 0)
    alpha, beta = F(mc, am + mc), F(am, am + mc)
    assert (alpha * ab) ** 2 + (beta * bc) ** 2 == squared
    close(dist(p['B'], p['M']) ** 2, squared)
    assert f'{alpha};{beta};' in lesson('1.5', 'C', 1, part)['answer']['accepted'][0]

# Exact reflection and intersection; the equality case beats every off-line
# path by the triangle inequality explained in the authored solution.
for part, A, B, axisindex, expectedM in [('a', (4, 4), (6, -4), 0, (F(0), F(4, 5))),
                                       ('b', (-3, 2), (2, 6), 1, (F(-7, 4), F(0)))]:
    reflected = list(A)
    reflected[axisindex] *= -1
    t = F(-reflected[axisindex], B[axisindex] - reflected[axisindex])
    assert 0 < t < 1
    M = tuple(F(a) + t * (b - a) for a, b in zip(reflected, B))
    assert M == expectedM
    p = pts('1.5', 'C', 3, part)
    sourcecoords(p, {'A': A, 'B': B, 'Aprime': tuple(reflected), 'M': tuple(float(c) for c in M)})
    close(dist(A, M) + dist(M, B), dist(reflected, B))
    for displacement in [-5, -1, F(-1, 10), F(1, 10), 1, 5]:
        other = list(M)
        other[1 - axisindex] += displacement
        assert dist(A, other) + dist(other, B) > dist(A, M) + dist(M, B)

# Every view is renderable; exact source/target objects are exposed initially.
for c in cards:
    m = c['model']; p = m['points']; names = set(m['labelNames'])
    assert len(c['steps']) >= 3 and 'neutral' in m['views']
    assert names <= set(p)
    assert all(len(q) == 3 and all(math.isfinite(x) for x in q) for q in p.values())
    for s in c['steps']: assert s['view'] in m['views'] and s['reason']
    for view in m['views'].values():
        assert set(view.get('points', [])) <= set(p)
        assert set(view.get('polygon', [])) <= set(p)
        for edge in view.get('segments', []): assert len(edge) == 2 and set(edge) <= set(p)
    for edge in m['edges']: assert len(edge) == 2 and set(edge) <= set(p)
    if c['section'] == '1.1' and c['number'] in [4, 5] and c['level'] == 'A': assert ('D' if c['number'] == 4 else 'M') in names
    if c['section'] == '1.5' and c['level'] == 'C' and c['number'] == 3: assert not {'Aprime', 'M'} & names

print('SECTIONS_1_1_1_5_MATH_OK: 36 source variants, exact/determinant/vector/angle checks; 125 justified steps.')
