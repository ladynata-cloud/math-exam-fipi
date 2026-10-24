"""Independent coordinate oracle for chapter III self-check questions 1--14.

Geometric conclusions are calculated from the actual lesson vertices, rather
than inferred from captions, answer strings or preselected face normals.
This does not replace independent source, proof or actual-image review.
"""
from collections import Counter
import itertools
import json
import math
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[2]
D = ROOT / 'stereo-course/textbook/lessons'
EPS = 1e-7


def card(suffix):
    return json.loads((D / ('ex-selfcheck-iii-' + suffix + '.json')).read_text())


def model(suffix):
    return card(suffix)['visualization']['model']


def points(m):
    return {name: np.array(value, dtype=float) for name, value in m['points'].items()}


def close(actual, expected, label='coordinate equality'):
    assert np.allclose(actual, expected, atol=EPS, rtol=EPS), (label, actual, expected)


def norm(vector):
    return float(np.linalg.norm(vector))


def unit_normal(poly):
    for i in range(1, len(poly) - 1):
        normal = np.cross(poly[i] - poly[0], poly[i + 1] - poly[0])
        if norm(normal) > EPS:
            return normal / norm(normal)
    raise AssertionError('degenerate polygon')


def polygon_area(poly):
    return norm(sum((np.cross(poly[i] - poly[0], poly[i + 1] - poly[0])
                     for i in range(1, len(poly) - 1)), np.zeros(3))) / 2


def perimeter(poly):
    return sum(norm(poly[(i + 1) % len(poly)] - poly[i]) for i in range(len(poly)))


def parallel(a, b):
    return norm(np.cross(a, b)) < EPS


def project(point, origin, normal):
    normal = normal / norm(normal)
    return point - np.dot(point - origin, normal) * normal


def on_line(point, a, b):
    return norm(np.cross(point - a, b - a)) < EPS


def between(point, a, b):
    return on_line(point, a, b) and np.dot(point - a, point - b) < EPS


def side_normals(p, cycle, apex):
    return [unit_normal(np.array([p[cycle[i]], p[cycle[(i + 1) % len(cycle)]], p[apex]]))
            for i in range(len(cycle))]


def vertical_side_indices(p, cycle, apex):
    base_normal = unit_normal(np.array([p[k] for k in cycle]))
    return [i for i, normal in enumerate(side_normals(p, cycle, apex))
            if abs(float(np.dot(normal, base_normal))) < EPS]


def planar_coordinates(poly):
    normal = unit_normal(poly)
    ex = (poly[1] - poly[0]) / norm(poly[1] - poly[0])
    ey = np.cross(normal, ex)
    close((poly - poly[0]) @ normal, np.zeros(len(poly)), 'planar polygon')
    return np.column_stack(((poly - poly[0]) @ ex, (poly - poly[0]) @ ey))


def turns(poly):
    xy = planar_coordinates(poly)
    result = []
    for i in range(len(xy)):
        a = xy[(i + 1) % len(xy)] - xy[i]
        b = xy[(i + 2) % len(xy)] - xy[(i + 1) % len(xy)]
        result.append(float(a[0]*b[1] - a[1]*b[0]))
    return result


def convex(poly):
    ts = turns(poly)
    return all(t > EPS for t in ts) or all(t < -EPS for t in ts)


def simple(poly):
    xy = planar_coordinates(poly)
    def cross2(a, b):
        return float(a[0] * b[1] - a[1] * b[0])
    for i, j in itertools.combinations(range(len(xy)), 2):
        if j == i + 1 or (i == 0 and j == len(xy) - 1):
            continue
        a, b, c, d = xy[i], xy[(i+1) % len(xy)], xy[j], xy[(j+1) % len(xy)]
        ab, cd = b-a, d-c
        denominator = cross2(ab, cd)
        if abs(denominator) < EPS:
            if abs(cross2(c-a, ab)) < EPS:
                values = sorted([float(np.dot(c-a, ab)), float(np.dot(d-a, ab))])
                if max(values[0], 0) <= min(values[1], float(np.dot(ab, ab))) + EPS:
                    return False
        else:
            t, u = cross2(c-a, cd)/denominator, cross2(c-a, ab)/denominator
            if -EPS <= t <= 1+EPS and -EPS <= u <= 1+EPS:
                return False
    return True


def inside_convex(point, poly):
    normal = unit_normal(poly)
    signs = [float(np.dot(np.cross(poly[(i+1) % len(poly)]-poly[i], point-poly[i]), normal))
             for i in range(len(poly))]
    return all(s >= -EPS for s in signs) or all(s <= EPS for s in signs)


def winding_contains(point, poly):
    """Independent winding test, including for the nonconvex base."""
    normal = unit_normal(poly)
    assert abs(float(np.dot(point-poly[0], normal))) < EPS
    angle = 0.0
    for i in range(len(poly)):
        u, v = poly[i]-point, poly[(i+1) % len(poly)]-point
        assert norm(u) > EPS and norm(v) > EPS
        angle += math.atan2(float(np.dot(np.cross(u, v), normal)), float(np.dot(u, v)))
    return abs(angle) > math.pi


def hull_faces(vertices):
    """Enumerate supporting planes without relying on authored face lists."""
    faces = set()
    for a, b, c in itertools.combinations(range(len(vertices)), 3):
        normal = np.cross(vertices[b]-vertices[a], vertices[c]-vertices[a])
        if norm(normal) < EPS:
            continue
        normal /= norm(normal)
        distances = (vertices-vertices[a]) @ normal
        if max(distances) < EPS or min(distances) > -EPS:
            faces.add(frozenset(np.flatnonzero(np.abs(distances) < EPS).tolist()))
    return faces


def volume(vertices):
    center = np.mean(vertices, axis=0)
    total = 0.0
    for face in hull_faces(vertices):
        poly = vertices[sorted(face)]
        midpoint = np.mean(poly, axis=0)
        normal = unit_normal(poly)
        ex = (poly[0]-midpoint)/norm(poly[0]-midpoint)
        ey = np.cross(normal, ex)
        poly = np.array(sorted(poly, key=lambda p: math.atan2(np.dot(p-midpoint, ey), np.dot(p-midpoint, ex))))
        total += polygon_area(poly) * abs(float(np.dot(center-poly[0], normal))) / 3
    return total


def assert_prism(m, lower, upper):
    p = points(m)
    base = np.array([p[k] for k in lower])
    top = np.array([p[k] for k in upper])
    delta = top[0] - base[0]
    close(top-base, np.tile(delta, (len(lower), 1)), 'parallel congruent prism bases')
    normal = unit_normal(base)
    assert abs(float(np.dot(delta, normal))) > EPS, 'nonzero prism height'
    assert simple(base), 'simple base polygon'
    return p, base, delta, normal


def shown_polygon(m, names):
    return any(set(v.get('polygon', [])) == set(names) for v in m['views'].values())


# Every card is required, even if a later check only needs one of its models.
SUFFIXES = ['01', '02', '03', '04', '05', '06', '07-a', '07-b', '08', '09',
            '10-zero', '10-one', '10-two', '10-nonconvex', '11', '12', '13', '14']
for suffix in SUFFIXES:
    c = card(suffix)
    assert c['id'] == 'ex-selfcheck-iii-' + suffix
    m = c['visualization']['model']; p = points(m)
    if suffix != '14':
        declared = {frozenset(e) for e in m['edges']}
        incident = Counter(frozenset([face[i], face[(i+1) % len(face)]])
                           for face in m['faces'] for i in range(len(face)))
        assert set(incident) == declared and set(incident.values()) == {2}, (suffix, 'closed edge/face incidence')
        for face in m['faces']:
            poly = np.array([p[k] for k in face])
            planar_coordinates(poly)
            assert polygon_area(poly) > EPS and simple(poly), (suffix, 'nondegenerate simple face', face)

# Question 1: the lower bound is realized by a genuine, closed tetrahedron.
m = model('01'); p = points(m)
vertices = set(itertools.chain.from_iterable(m['edges']))
assert vertices == set('ABCD') and len(m['edges']) == 6 and len(m['faces']) == 4
degrees = Counter(itertools.chain.from_iterable(m['edges']))
assert set(degrees.values()) == {3}
assert sum(degrees.values()) == 2*len(m['edges']) == 12
assert {frozenset(e) for e in m['edges']} == {frozenset(e) for e in itertools.combinations(vertices, 2)}
assert volume(np.array([p[k] for k in sorted(vertices)])) > EPS

# Question 2: count actual lateral faces independently of their presentation.
m = model('02')
p, base, delta, normal = assert_prism(m, list('ABCDE'), [k+'1' for k in 'ABCDE'])
assert len(m['faces']) == len(base)+2 == 7
assert len(m['edges']) == 3*len(base) == 15
assert sorted(map(len, m['faces'])) == [4]*5+[5]*2
base_sets = [set('ABCDE'), {k+'1' for k in 'ABCDE'}]
side_faces = [f for f in m['faces'] if set(f) not in base_sets]
assert len(side_faces) == 5
for f in side_faces:
    assert len(set(f) & base_sets[0]) == len(set(f) & base_sets[1]) == 2

# Questions 3--4: the actual lateral direction and displayed height are normal
# to the base.  The general converses are checked in independent prose review.
for suffix in ['03', '04']:
    m = model(suffix)
    p, base, delta, normal = assert_prism(m, list('ABC'), ['A1', 'B1', 'C1'])
    assert parallel(delta, normal), suffix+': right prism'
    if suffix == '03':
        for face in [['A', 'B', 'B1', 'A1'], ['A', 'C', 'C1', 'A1']]:
            side_normal = unit_normal(np.array([p[k] for k in face]))
            close(np.dot(side_normal, normal), 0, 'given adjacent side plane is vertical')
            assert shown_polygon(m, face)
        first = unit_normal(np.array([p[k] for k in ['A', 'B', 'A1']]))
        second = unit_normal(np.array([p[k] for k in ['A', 'C', 'A1']]))
        assert parallel(np.cross(first, second), delta), 'common plane intersection is lateral edge'
    else:
        close(p['K']-p['H'], delta, 'displayed independent height')
        close(p['H'], project(p['K'], base[0], normal))
        assert inside_convex(p['H'], base)
        assert all(norm(p['H']-p[k]) > EPS for k in 'ABC'), 'height is not an edge'

# Question 5: all twelve edges equal, yet unequal base angles.
m = model('05')
p, base, delta, normal = assert_prism(m, list('ABCD'), [k+'1' for k in 'ABCD'])
assert len(m['edges']) == 12 and parallel(delta, normal)
close([norm(p[a]-p[b]) for a, b in m['edges']], [2]*12, 'all actual edges length 2')
angle_cosines = [float(np.dot(base[i-1]-base[i], base[(i+1) % 4]-base[i]))/4 for i in range(4)]
close(sorted(angle_cosines), [-0.5, -0.5, 0.5, 0.5], '60/120-degree rhombus, not a square')

# Question 6: the same segment really lies in the side face and measures both
# the plane-to-plane height and the parallelogram altitude.
m = model('06')
p, base, delta, normal = assert_prism(m, list('ABC'), ['A1', 'B1', 'C1'])
assert not parallel(delta, normal), 'oblique prism'
close(p['H'], project(p['A1'], base[0], normal))
assert between(p['H'], p['A'], p['B'])
face_normal = unit_normal(np.array([p[k] for k in ['A', 'B', 'A1']]))
close(np.dot(p['H']-p['A'], face_normal), 0)
close(np.dot(p['A1']-p['H'], p['B']-p['A']), 0)
close(norm(p['A1']-p['H']), 2)
close(norm(delta), math.sqrt(5))
assert shown_polygon(m, ['A', 'B', 'B1', 'A1'])

# Question 7: enumerate all three directions and all three side planes.
for suffix in ['07-a', '07-b']:
    m = model(suffix)
    p, base, delta, normal = assert_prism(m, list('ABC'), ['A1', 'B1', 'C1'])
    close(p['H'], project(p['A1'], base[0], normal))
    edge_dots = [float(np.dot(p[b]-p[a], delta)) for a, b in [('A', 'B'), ('B', 'C'), ('C', 'A')]]
    assert [i for i, x in enumerate(edge_dots) if abs(x) < EPS] == [0], 'exactly AB perpendicular to side direction'
    vertical = []
    for i, (a, b) in enumerate([('A', 'B'), ('B', 'C'), ('C', 'A')]):
        side_normal = unit_normal(np.array([p[a], p[b], p[a+'1']]))
        if abs(float(np.dot(side_normal, normal))) < EPS:
            vertical.append(i)
    assert vertical == [2], 'exactly side plane ACC1A1 vertical'
    if suffix == '07-b':
        close(p['K'], project(p['B1'], base[0], normal))
        assert not on_line(p['H'], p['A'], p['B'])
        assert not on_line(p['K'], p['B'], p['C'])
        assert not inside_convex(p['K'], base), 'second height foot really external'

# Question 8: compute both new lateral surfaces as sums of actual rectangular
# areas, including the shared newly created face in both sums.
m = model('08')
p, base, delta, normal = assert_prism(m, list('ABC'), ['A1', 'B1', 'C1'])
assert parallel(delta, normal)
a = norm(p['B']-p['A'])
close([norm(base[(i+1) % 3]-base[i]) for i in range(3)], [a]*3)
for helper, endpoints in [('M', ('A', 'B')), ('N', ('A', 'C')),
                          ('M1', ('A1', 'B1')), ('N1', ('A1', 'C1'))]:
    close(p[helper], (p[endpoints[0]]+p[endpoints[1]])/2, 'actual midpoint '+helper)
small, large = list('AMN'), list('MBCN')
def lateral_area(cycle):
    result = 0.0
    for i, x in enumerate(cycle):
        y = cycle[(i+1) % len(cycle)]
        result += polygon_area(np.array([p[x], p[y], p[y]+delta, p[x]+delta]))
    return result
small_area, large_area = lateral_area(small), lateral_area(large)
close(small_area/large_area, 3/5, 'all actual lateral faces give ratio 3:5')
close(perimeter(np.array([p[k] for k in small])), 3*a/2)
close(perimeter(np.array([p[k] for k in large])), 5*a/2)
close(polygon_area(np.array([p[k] for k in small]))+polygon_area(np.array([p[k] for k in large])), polygon_area(base))
assert shown_polygon(m, small) and shown_polygon(m, large)
assert shown_polygon(m, ['M', 'N', 'N1', 'M1'])

# Question 9: every displayed lateral triangle really is equilateral; the
# separate general proof uses equal consecutive chords, not mere side equality.
m = model('09'); p = points(m)
cycle = list('ABCDE'); base = np.array([p[k] for k in cycle])
normal = unit_normal(base)
assert simple(base) and convex(base)
close(p['O'], project(p['P'], base[0], normal), 'height foot is circle center')
side_lengths = [norm(p[b]-p[a]) for a, b in m['edges']]
close(side_lengths, [side_lengths[0]]*len(side_lengths), 'all base and lateral edges equal')
R = norm(p['A']-p['O']); h = norm(p['P']-p['O']); a = side_lengths[0]
assert R > EPS and h > EPS
close([norm(p[k]-p['O']) for k in cycle], [R]*5)
close(R*R+h*h, a*a, 'common Pythagorean radius')
arc_angles = []
for i in range(len(cycle)):
    u, v = p[cycle[i]]-p['O'], p[cycle[(i+1) % len(cycle)]]-p['O']
    arc_angles.append(math.atan2(float(np.dot(np.cross(u, v), normal)), float(np.dot(u, v))) % (2*math.pi))
close(arc_angles, [2*math.pi/5]*5, 'actual circular order and regular pentagon')

# Question 10, convex cases: count perpendicular face planes independently.
for suffix, count, indices in [('zero', 0, []), ('one', 1, [0]), ('two', 2, [0, 3])]:
    m = model('10-'+suffix); p = points(m); cycle = list('ABCD')
    base = np.array([p[k] for k in cycle])
    assert simple(base) and convex(base)
    foot = p['A'] if suffix == 'two' else p['H']
    close(foot, project(p['P'], base[0], unit_normal(base)), 'actual height foot '+suffix)
    actual = vertical_side_indices(p, cycle, 'P')
    assert actual == indices and len(actual) == count
    assert [i for i in range(4) if on_line(foot, p[cycle[i]], p[cycle[(i+1) % 4]])] == actual

# Question 10, unrestricted number of sides: derive the radial construction for
# several k independently of the six-vertex displayed example.  The general
# proof is geometric: each connector is interior to its own angular sector of
# width 2*pi/k < pi, so nonadjacent connectors/radial segments cannot cross.
# Exactly the k radial side lines contain H; no connector line contains H.
for k in range(3, 13):
    cycle = [str(i) for i in range(2*k)]
    generated = {}
    for j in range(k):
        direction = np.array([math.cos(2*math.pi*j/k), math.sin(2*math.pi*j/k), 0.0])
        generated[str(2*j)] = direction
        generated[str(2*j+1)] = 2*direction
    generated['P'] = np.array([0.0, 0.0, 2.0])
    base = np.array([generated[name] for name in cycle])
    assert simple(base) and not convex(base), ('simple nonconvex radial construction', k)
    assert winding_contains(np.zeros(3), base), ('height foot inside radial polygon', k)
    assert polygon_area(base) > EPS
    expected_indices = list(range(0, 2*k, 2))
    assert vertical_side_indices(generated, cycle, 'P') == expected_indices, ('exactly k perpendicular faces', k)
    actual_lines = [i for i in range(2*k)
                    if on_line(np.zeros(3), base[i], base[(i+1) % (2*k)])]
    assert actual_lines == expected_indices, ('no connector line passes through H', k)

# The actual authored model must be the k=3 construction used in the proof.
m = model('10-nonconvex'); p = points(m); cycle = list('ABCDEF')
base = np.array([p[k] for k in cycle])
assert simple(base) and not convex(base)
close(p['H'], project(p['P'], base[0], unit_normal(base)))
assert winding_contains(p['H'], base), 'displayed height foot inside nonconvex base'
close([norm(p[k]-p['H']) for k in cycle], [1, 2, 1, 2, 1, 2], 'alternating radii in actual model')
for inner, outer in [('A', 'B'), ('C', 'D'), ('E', 'F')]:
    close(p[outer]-p['H'], 2*(p[inner]-p['H']), 'actual radial side')
assert vertical_side_indices(p, cycle, 'P') == [0, 2, 4]
for side in [('A', 'B'), ('C', 'D'), ('E', 'F')]:
    assert shown_polygon(m, ['P', *side]), 'each vertical triangle highlighted separately'

# Question 11: opposite, not adjacent, side planes are vertical; the actual
# height foot is outside a convex quadrilateral.
m = model('11'); p = points(m); cycle = list('ABCD')
base = np.array([p[k] for k in cycle])
assert simple(base) and convex(base)
close(p['H'], project(p['P'], base[0], unit_normal(base)))
assert not inside_convex(p['H'], base), 'external height foot'
assert vertical_side_indices(p, cycle, 'P') == [0, 2]
assert set(cycle[:2]).isdisjoint(set(cycle[2:])), 'opposite sides have no common endpoint'
assert shown_polygon(m, ['P', 'A', 'B']) and shown_polygon(m, ['P', 'C', 'D'])

# Question 12: independently examine all three angles of every tetrahedron face.
m = model('12'); p = points(m)
names = ['A', 'B', 'C', 'D']
assert len(m['edges']) == 6
assert {frozenset(f) for f in m['faces']} == {frozenset(f) for f in itertools.combinations(names, 3)}
right_corners = {}
for face in m['faces']:
    corners = [a for a in face
               if abs(float(np.dot(p[next(b for b in face if b != a)]-p[a],
                                   p[next(b for b in reversed(face) if b != a)]-p[a]))) < EPS]
    assert len(corners) == 1, ('one actual right angle per face', face, corners)
    right_corners[frozenset(face)] = corners[0]
assert right_corners == {frozenset('ABC'): 'B', frozenset('ABD'): 'B',
                         frozenset('ACD'): 'C', frozenset('BCD'): 'C'}
close(volume(np.array([p[k] for k in names])), 10, 'nondegenerate orthoscheme volume')
for face in m['faces']:
    assert shown_polygon(m, face), 'each checked face actually highlighted'

# Question 13: a valid illustrative pyramid, and a separate impossible budget.
m = model('13'); p = points(m)
base = np.array([p[k] for k in 'ABCD'])
close([norm(base[(i+1) % 4]-base[i]) for i in range(4)], [10]*4, '10-cm square sides')
for i in range(4):
    close(np.dot(base[i-1]-base[i], base[(i+1) % 4]-base[i]), 0, 'square right angle')
close(p['O'], np.mean(base, axis=0), 'drawn center')
close(p['O'], project(p['P'], base[0], unit_normal(base)), 'drawn positive height')
assert norm(p['P']-p['O']) > EPS
radii = [norm(p[k]-p['O']) for k in 'ABCD']
close(radii, [5*math.sqrt(2)]*4)
side_lengths = [norm(p[k]-p['P']) for k in 'ABCD']
close(side_lengths, [side_lengths[0]]*4, 'valid regular pyramid side edges')
assert side_lengths[0] > radii[0], 'model does not instantiate impossible 6.5-cm sides'
source_wire, source_side = 66, 10
available_side_length = (source_wire - 4*source_side)/4
assert 0 < available_side_length < source_side/math.sqrt(2)
assert 4*source_side + 4*source_side/math.sqrt(2) > source_wire
assert shown_polygon(m, ['P', 'O', 'A'])

# Question 14: derive the actual cut and both hull topologies, then verify the
# displayed edge sets and independent volume partition.
m = model('14')
p, base, delta, normal = assert_prism(m, list('ABC'), ['A1', 'B1', 'C1'])
original_edges = {frozenset(e) for e in [('A', 'B'), ('B', 'C'), ('C', 'A'),
                                       ('A1', 'B1'), ('B1', 'C1'), ('C1', 'A1'),
                                       ('A', 'A1'), ('B', 'B1'), ('C', 'C1')]}
assert {frozenset(e) for e in m['views']['neutral']['segments']} == original_edges
section_names = ['A1', 'B', 'C']
cut = np.array([p[k] for k in section_names])
cut_normal = unit_normal(cut)
distances = {k: float(np.dot(value-cut[0], cut_normal)) for k, value in p.items()}
close([distances[k] for k in section_names], [0]*3)
assert distances['A']*distances['B1'] < -EPS
assert distances['A']*distances['C1'] < -EPS
assert shown_polygon(m, section_names)
tetra_names = ['A1', 'A', 'B', 'C']
quad_names = ['A1', 'B', 'C', 'C1', 'B1']
tetra_vertices = np.array([p[k] for k in tetra_names])
quad_vertices = np.array([p[k] for k in quad_names])
assert sorted(map(len, hull_faces(tetra_vertices))) == [3, 3, 3, 3]
assert sorted(map(len, hull_faces(quad_vertices))) == [3, 3, 3, 3, 4]
assert shown_polygon(m, ['B', 'C', 'C1', 'B1'])
tetra_edges = {frozenset(e) for e in itertools.combinations(tetra_names, 2)}
quad_base = ['B', 'C', 'C1', 'B1']
quad_edges = {frozenset([quad_base[i], quad_base[(i+1) % 4]]) for i in range(4)}
quad_edges |= {frozenset(['A1', k]) for k in quad_base}
assert {frozenset(e) for e in m['views']['tetrahedron']['segments']} == tetra_edges
assert {frozenset(e) for e in m['views']['quadrangular']['segments']} == quad_edges
whole_volume = polygon_area(base) * abs(float(np.dot(delta, normal)))
close(volume(tetra_vertices), whole_volume/3, 'triangular-pyramid volume')
close(volume(quad_vertices), 2*whole_volume/3, 'quadrangular-pyramid volume')
close(volume(tetra_vertices)+volume(quad_vertices), whole_volume, 'no lost or duplicated volume')

print('ATANASYAN_POLYHEDRA_SELFCHECK_MATH_OK', len(SUFFIXES),
      'cards; prism counterexamples, 3:5 surfaces, equilateral faces,',
      'vertical-face counts and k=3..12 nonconvex construction,',
      'external height, four right faces, impossible wire budget, cut topology/volume')
