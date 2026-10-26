#!/usr/bin/env python3
"""Independent Euclidean-coordinate oracles for source exercises 299–309.

These constructions do not import lesson answers or authoring helpers. Areas are
measured with vector products; section vertices come from plane/edge intersections.
The 301 foot deliberately lies on the extension of the lateral edge.
"""
import math
import random
import json
from pathlib import Path


def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def mul(a, k):
    return tuple(x * k for x in a)


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def cross(a, b):
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2],
            a[0]*b[1]-a[1]*b[0])


def length(a):
    return math.sqrt(dot(a, a))


def dist(a, b):
    return length(sub(a, b))


def unit(a):
    return mul(a, 1/length(a))


def mid(a, b):
    return mul(add(a, b), .5)


def near(a, b, label):
    assert math.isclose(a, b, rel_tol=2e-9, abs_tol=2e-9), (label, a, b)


def normal(a, b, c):
    return unit(cross(sub(b, a), sub(c, a)))


def area(a, b, c):
    return length(cross(sub(b, a), sub(c, a))) / 2


def linefoot(p, a, b):
    u = sub(b, a)
    t = dot(sub(p, a), u)/dot(u, u)
    return add(a, mul(u, t)), t


def section(vertices, edges, p, q, r):
    """Intersect a plane with all edges, deduplicate and order the polygon."""
    n = normal(p, q, r)
    points = []
    for i, j in edges:
        a, b = vertices[i], vertices[j]
        da, db = dot(n, sub(a, p)), dot(n, sub(b, p))
        candidates = []
        if abs(da) < 1e-9:
            candidates.append(a)
        if abs(db) < 1e-9:
            candidates.append(b)
        if da * db < -1e-18:
            candidates.append(add(a, mul(sub(b, a), da/(da-db))))
        for candidate in candidates:
            if not any(dist(candidate, old) < 1e-8 for old in points):
                points.append(candidate)
    assert len(points) >= 3
    centre = mul(tuple(sum(p[i] for p in points) for i in range(3)), 1/len(points))
    u = unit(sub(points[0], centre))
    v = cross(n, u)
    points.sort(key=lambda x: math.atan2(dot(sub(x, centre), v), dot(sub(x, centre), u)))
    return points, sum(area(centre, a, b) for a, b in zip(points, points[1:]+points[:1]))


def triangular(a, h):
    return [(0, a/math.sqrt(3), 0), (-a/2, -a/(2*math.sqrt(3)), 0),
            (a/2, -a/(2*math.sqrt(3)), 0), (0, 0, h)]


def square(a, h):
    return [(-a/2, -a/2, 0), (a/2, -a/2, 0), (a/2, a/2, 0),
            (-a/2, a/2, 0), (0, 0, h)]


TETRA_EDGES = [(0, 1), (1, 2), (2, 0), (0, 3), (1, 3), (2, 3)]
SQUARE_EDGES = [(0, 1), (1, 2), (2, 3), (3, 0), (0, 4), (1, 4), (2, 4), (3, 4)]
rng = random.Random(299309)
checks = {str(n): 0 for n in range(299, 310)}
for _ in range(120):
    k = rng.uniform(.15, 12)
    # 299: infer altitude from the given area ratio, independently measured.
    a = rng.uniform(.5, 20)
    A, B, C, S = triangular(a, a/2)
    near(sum(area(S, x, y) for x, y in [(A, B), (B, C), (C, A)]),
         2*area(A, B, C), '299 lateral/base ratio')
    checks['299'] += 1

    # 300: the plane yields exactly a rectangle, not a generic parallelogram.
    h = rng.uniform(.2, 18)
    vertices = triangular(a, h)
    A, B, C, D = vertices
    E, F, P = mid(B, C), mid(A, B), mid(A, D)
    polygon, measured = section(vertices, TETRA_EDGES, E, F, P)
    assert len(polygon) == 4
    for i in range(4):
        near(dot(sub(polygon[i-1], polygon[i]), sub(polygon[(i+1)%4], polygon[i])), 0,
             '300 rectangle corner')
    near(measured, a*dist(A, D)/4, '300 section area')
    checks['300'] += 1

    # 301: fix the linear dihedral angle, then scale the normal distances.
    q = 16*k
    vertices = triangular(q*math.sqrt(3), q/(2*math.sqrt(2)))
    A, B, C, D = vertices
    H, t = linefoot(B, A, D)
    J, tc = linefoot(C, A, D)
    near(dist(H, J), 0, '301 common perpendicular foot')
    near(t, 4/3, '301 foot beyond D')
    near(tc, t, '301 same edge parameter')
    assert t > 1
    near(dist(B, H), q, '301 distance to supporting line')
    near(dot(unit(sub(B, H)), unit(sub(C, H))), -.5, '301 dihedral cosine')
    near(dist(D, mid(B, C)), 4*math.sqrt(6)*k, '301 apothem')
    checks['301'] += 1

    # 302: build a genuinely nonrectangular base, then measure all four edges.
    u = (7*k, 0, 0)
    v = (3*k*(-11/21), 3*k*math.sqrt(1-(11/21)**2), 0)
    A = (0, 0, 0)
    B, D, C = u, v, add(u, v)
    near(dist(A, C), 6*k, '302 given diagonal')
    O = mid(A, C)
    S = add(O, (0, 0, 4*k))
    actual = sorted(dist(S, x) for x in [A, B, C, D])
    for x, y in zip(actual, [5*k, 5*k, 6*k, 6*k]):
        near(x, y, '302 lateral edges')
    checks['302'] += 1

    # 303: vector face areas and plane angles verify the nonregular pyramid.
    h, a = 12*k, 24*k
    A, B = (0, 0, 0), (a, 0, 0)
    D = (-a/2, a*math.sqrt(3)/2, 0)
    C, S = add(B, D), (0, 0, h)
    base_n = normal(A, B, C)
    near(dot(unit(B), unit(D)), -.5, '303 vertical-face angle')
    for X, Y in [(A, B), (A, D)]:
        near(abs(dot(base_n, normal(S, X, Y))), 0, '303 perpendicular plane')
    for X, Y in [(B, C), (C, D)]:
        near(abs(dot(base_n, normal(S, X, Y))), math.sqrt(3)/2, '303 thirty degrees')
    measured = area(A, B, C)+area(A, C, D)
    measured += sum(area(S, x, y) for x, y in [(A, B), (B, C), (C, D), (D, A)])
    near(measured, (864+288*math.sqrt(3))*k*k, '303 full surface')
    checks['303'] += 1

    # 304: normals give base angle, projected face rays give interior side angle.
    a = rng.uniform(.5, 20)
    A, B, C, D, S = square(a, a/math.sqrt(2))
    H, t = linefoot(B, A, S)
    J, _ = linefoot(D, A, S)
    near(t, .5, '304 equilateral-face midpoint')
    near(dist(H, J), 0, '304 common dihedral vertex')
    delta = math.acos(abs(dot(normal(A, B, C), normal(S, A, B))))
    theta = math.acos(dot(unit(sub(B, H)), unit(sub(D, H))))
    near(theta, 2*delta, '304 exact angle relation')
    checks['304'] += 1

    # 305: vary a/h freely; derive the source angle from the actual side face.
    h = rng.uniform(.3, 15)
    A, B, C, D, S = square(a, h)
    alpha = math.acos(dot(unit(sub(A, S)), unit(sub(B, S))))
    assert 0 < alpha < math.pi/2
    side_area = sum(area(S, x, y) for x, y in [(A, B), (B, C), (C, D), (D, A)])
    near(side_area, 2*h*h*math.tan(alpha), '305 lateral surface')
    checks['305'] += 1

    # 306: angle between height and plane obtained from its normal, not its edge.
    phi = math.asin(abs(dot((0, 0, -1), normal(S, A, B))))
    assert 0 < phi < math.pi/2
    target = 4*h*h*math.tan(phi)*(math.tan(phi)+1/math.cos(phi))
    near(side_area+a*a, target, '306 full surface')
    checks['306'] += 1

    # 307: intersect the diagonal plane and compare signed point-plane distances.
    O, N = (0, 0, 0), mid(S, C)
    n = normal(B, D, N)
    near(dot(n, sub(A, S)), 0, '307 plane parallel lateral edge')
    polygon, measured = section([A, B, C, D, S], SQUARE_EDGES, B, D, N)
    assert len(polygon) == 3
    near(measured, a*dist(A, S)*math.sqrt(2)/4, '307 triangular section')
    ds, dc = dot(n, sub(S, B)), dot(n, sub(C, B))
    assert ds*dc < 0
    near(ds, -dc, '307 opposite equal signed distances')
    checks['307'] += 1

    # 308: all four altitudes are measured as point-to-line distances.
    A, B, C, D = (3*k, 0, 0), (0, 4*k, 0), (-3*k, 0, 0), (0, -4*k, 0)
    S = (0, 0, 3.2*k)
    for X, Y in [(A, B), (B, C), (C, D), (D, A)]:
        F, t = linefoot(S, X, Y)
        assert 0 < t < 1
        near(dist(X, Y), 5*k, '308 rhombus side')
        near(dist(S, F), 4*k, '308 face altitude')
    checks['308'] += 1

    # 309: section from the shorter edge and half-height, independent intersections.
    A, B, C, D = (-3*k, -4*k, 0), (3*k, -4*k, 0), (3*k, 4*k, 0), (-3*k, 4*k, 0)
    S, H = (0, 0, 6*k), (0, 0, 3*k)
    vertices = [A, B, C, D, S]
    for X in [A, B, C, D]:
        near(dist(S, X), math.sqrt(61)*k, '309 equal lateral edges')
    polygon, measured = section(vertices, SQUARE_EDGES, A, B, H)
    assert len(polygon) == 4
    top = [P for P in polygon if P[2] > 1e-8]
    assert len(top) == 2
    near(dist(*top), 2*k, '309 upper parallel side')
    near(measured, 80/3*k*k, '309 trapezoid area')
    checks['309'] += 1

assert all(count == 120 for count in checks.values())

# The published models must realize the same mathematics. This separately
# checks actual lesson coordinates; randomized oracles above are not a
# substitute for inspecting the models used by learners.
lesson_root = Path(__file__).resolve().parents[2] / 'stereo-course/textbook/lessons'


def model(number):
    return json.loads((lesson_root / ('ex-main-' + number + '.json')).read_text())['visualization']['model']


def point_near(a, b, label):
    near(dist(a, b), 0, label)


p = model('0299')['points']
a = dist(p['A'], p['B'])
point_near(p['E'], mid(p['B'], p['C']), '299 authored midpoint')
near(dist(p['D'], p['O']), a/2, '299 authored height')
near(sum(area(p['D'], p[x], p[y]) for x, y in [('A','B'), ('B','C'), ('C','A')]),
     2*area(p['A'], p['B'], p['C']), '299 authored ratio')

p = model('0300')['points']
for x, y, z in [('E','B','C'), ('F','A','B'), ('P','A','D'), ('Q','C','D'), ('M','A','C')]:
    point_near(p[x], mid(p[y], p[z]), '300 authored midpoint '+x)
near(dot(sub(p['F'], p['E']), sub(p['P'], p['F'])), 0, '300 authored rectangle')
vertices = [p[x] for x in ['A','B','C','D']]
polygon, measured = section(vertices, TETRA_EDGES, p['E'], p['F'], p['P'])
assert len(polygon) == 4
near(measured, dist(p['A'], p['B'])*dist(p['A'], p['D'])/4, '300 authored area')

m = model('0301')
p = m['points']
for x in ['B', 'C']:
    foot, t = linefoot(p[x], p['A'], p['D'])
    point_near(foot, p['H'], '301 authored foot')
    near(t, 4/3, '301 authored exterior foot')
    near(dist(p[x], p['H']), 16, '301 authored given distance')
near(dot(unit(sub(p['B'], p['H'])), unit(sub(p['C'], p['H']))), -.5, '301 authored 120 degrees')
near(dist(p['D'], p['E']), 4*math.sqrt(6), '301 authored apothem')
assert 'H' not in m['labelNames'] and all('H' not in edge for edge in m['edges'])

p = model('0302')['points']
for x, y, expected in [('A','B',3),('B','C',7),('C','D',3),('D','A',7),('A','C',6),('S','O',4)]:
    near(dist(p[x], p[y]), expected, '302 authored source dimension')
point_near(p['O'], mid(p['A'], p['C']), '302 authored centre')
point_near(p['O'], mid(p['B'], p['D']), '302 authored centre')
for x, expected in [('A',5),('B',6),('C',5),('D',6)]:
    near(dist(p['S'], p[x]), expected, '302 authored edge')

p = model('0303')['points']
for x, y in [('A','B'),('B','C'),('C','D'),('D','A')]:
    near(dist(p[x], p[y]), 24, '303 authored rhombus')
near(dist(p['S'], p['A']), 12, '303 authored height')
near(dot(unit(sub(p['B'], p['A'])), unit(sub(p['D'], p['A']))), -.5, '303 authored 120 degrees')
for x, y, z in [('B','C','K'), ('C','D','L')]:
    foot, t = linefoot(p['A'], p[x], p[y])
    point_near(foot, p[z], '303 authored base foot')
    near(dot(sub(p['S'], p[z]), sub(p[y], p[x])), 0, '303 authored face altitude')
    near(abs(dot(normal(p['A'],p['B'],p['C']), normal(p['S'],p[x],p[y]))),
         math.sqrt(3)/2, '303 authored 30 degrees')

p = model('0304')['points']
a = dist(p['A'],p['B'])
for x in ['A','B','C','D']:
    near(dist(p['S'],p[x]), a, '304 authored equilateral face')
point_near(p['H'],mid(p['S'],p['A']),'304 authored midpoint')
point_near(p['K'],mid(p['A'],p['B']),'304 authored base midpoint')
delta = math.acos(abs(dot(normal(p['A'],p['B'],p['C']),normal(p['S'],p['A'],p['B']))))
theta = math.acos(dot(unit(sub(p['B'],p['H'])),unit(sub(p['D'],p['H']))))
near(theta,2*delta,'304 authored angle relation')

for card in ['0305','0306']:
    p = model(card)['points']
    a, h = dist(p['A'],p['B']),dist(p['S'],p['O'])
    point_near(p['K'],mid(p['A'],p['B']),card+' authored apothem foot')
    near(dot(sub(p['S'],p['O']),sub(p['K'],p['O'])),0,card+' authored right section')
    measured = sum(area(p['S'],p[x],p[y]) for x,y in [('A','B'),('B','C'),('C','D'),('D','A')])
    alpha = math.acos(dot(unit(sub(p['A'],p['S'])),unit(sub(p['B'],p['S']))))
    near(measured,2*h*h*math.tan(alpha),card+' authored lateral area')
    if card == '0306':
        foot,t = linefoot(p['O'],p['S'],p['K'])
        point_near(foot,p['T'],'306 authored orthogonal projection')
        assert 0<t<1
        n = normal(p['S'],p['A'],p['B'])
        near(length(cross(unit(sub(p['T'],p['O'])),n)),0,'306 authored plane normal')
        phi=math.asin(abs(dot(unit(sub(p['O'],p['S'])),n)))
        near(measured+a*a,4*h*h*math.sin(phi)/(1-math.sin(phi)),'306 authored simplified answer')

for card in ['0307-a','0307-b']:
    p = model(card)['points']
    point_near(p['O'],mid(p['A'],p['C']),card+' authored centre')
    point_near(p['K'],mid(p['M'],p['C']),card+' authored midpoint')
    n = normal(p['B'],p['D'],p['K'])
    near(dot(n,sub(p['M'],p['A'])),0,card+' authored parallel edge')
    near(dot(sub(p['K'],p['O']),sub(p['D'],p['B'])),0,card+' authored section altitude')
    near(area(p['B'],p['K'],p['D']),dist(p['A'],p['D'])*dist(p['M'],p['A'])*math.sqrt(2)/4,
         card+' authored section area')
    if card.endswith('b'):
        for x,y in [('M','U'),('C','V')]:
            foot,t=linefoot(p[x],p['O'],p['K'])
            point_near(foot,p[y],'307b authored normal foot')
            near(length(cross(unit(sub(p[x],p[y])),n)),0,'307b authored perpendicular')
        point_near(mid(p['U'],p['V']),p['K'],'307b authored central symmetry')
        near(dist(p['M'],p['U']),dist(p['C'],p['V']),'307b authored equal distances')

p = model('0308')['points']
for x,y,z in [('A','B','K'),('B','C','L'),('C','D','N'),('D','A','T')]:
    foot,t=linefoot(p['O'],p[x],p[y])
    point_near(foot,p[z],'308 authored foot')
    assert 0<t<1
    near(dist(p[x],p[y]),5,'308 authored rhombus')
    near(dist(p['M'],p[z]),4,'308 authored face altitude')

p = model('0309')['points']
for x,y,z in [('N','A','B'),('Q','C','D'),('H','M','O'),('P','E','F')]:
    point_near(p[x],mid(p[y],p[z]),'309 authored midpoint')
for x,y in [('E','C'),('F','D')]:
    point_near(p[x],add(p['M'],mul(sub(p[y],p['M']),1/3)),'309 authored edge parameter')
n=normal(p['A'],p['B'],p['E'])
for x in ['F','H','N','P']:
    near(dot(n,sub(p[x],p['A'])),0,'309 authored plane incidence '+x)
near(area(p['A'],p['B'],p['E'])+area(p['A'],p['E'],p['F']),80/3,'309 authored area')
near(dist(p['N'],p['P']),20/3,'309 authored trapezoid altitude')
near(dist(p['E'],p['F']),2,'309 authored upper side')

print('ATANASYAN_PYRAMIDS_299_309_MATH_OK', sum(checks.values()),
      'independent families;120 each;all12 actual coordinate models;plane intersections,face areas,interior angles,exterior foot')
