#!/usr/bin/env python3
"""Independent source-derived Euclidean oracles for Atanasyan 310–319.

No lesson answer or authoring helper supplies these constructions. Cross products,
orthogonal projections, supporting hull planes, and all tetrahedral permutations
check area, convexity, interior angles, and the exact reflection-plane count.
The fixed lesson coordinates are checked separately below the parameter families.
"""
import itertools
import json
import math
import random
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


def norm(a):
    return math.sqrt(dot(a, a))


def unit(a):
    return mul(a, 1/norm(a))


def distance(a, b):
    return norm(sub(a, b))


def centre(points):
    return tuple(sum(p[i] for p in points)/len(points) for i in range(3))


def midpoint(a, b):
    return centre([a, b])


def near(a, b, label):
    assert math.isclose(a, b, rel_tol=2e-8, abs_tol=2e-8), (label, a, b)


def normal(a, b, c):
    return unit(cross(sub(b, a), sub(c, a)))


def area(a, b, c):
    return norm(cross(sub(b, a), sub(c, a)))/2


def line_foot(p, a, b):
    ab = sub(b, a)
    parameter = dot(sub(p, a), ab)/dot(ab, ab)
    return add(a, mul(ab, parameter)), parameter


def plane_foot(p, a, b, c):
    n = normal(a, b, c)
    return sub(p, mul(n, dot(sub(p, a), n)))


def plane_edge_intersections(points, edges, plane):
    """All distinct intersections of a plane with a polyhedron's actual edges."""
    a, b, c = plane
    n = normal(a, b, c)
    found = []
    for x, y in edges:
        p, q = points[x], points[y]
        dp, dq = dot(n, sub(p, a)), dot(n, sub(q, a))
        candidates = []
        if abs(dp) < 1e-8:
            candidates.append(p)
        if abs(dq) < 1e-8:
            candidates.append(q)
        if dp*dq < -1e-16:
            candidates.append(add(p, mul(sub(q, p), dp/(dp-dq))))
        for point in candidates:
            if not any(distance(point, old) < 1e-7 for old in found):
                found.append(point)
    return found


def signed_volume(a, b, c, d):
    return dot(sub(b, a), cross(sub(c, a), sub(d, a)))/6


def rotate(p, axis, angle):
    # Rodrigues' formula: all model checks also tolerate arbitrary rigid placement.
    axis = unit(axis)
    return add(add(mul(p, math.cos(angle)), mul(cross(axis, p), math.sin(angle))),
               mul(axis, dot(axis, p)*(1-math.cos(angle))))


def move(points, scale, axis, angle, shift):
    return [add(rotate(mul(p, scale), axis, angle), shift) for p in points]


def hull_faces(points):
    """Enumerate maximal supporting faces from independent point triples.

    Coplanar triples are merged, so a cube produces six quadrilaterals rather
    than twenty-four triangles. Merely having equal edge lengths is insufficient.
    """
    tolerance = 1e-8*max(distance(a, b) for a, b in itertools.combinations(points, 2))
    faces = set()
    for i, j, k in itertools.combinations(range(len(points)), 3):
        raw = cross(sub(points[j], points[i]), sub(points[k], points[i]))
        if norm(raw) < tolerance*tolerance:
            continue
        n = unit(raw)
        signed = [dot(n, sub(p, points[i])) for p in points]
        if max(signed) > tolerance and min(signed) < -tolerance:
            continue
        face = frozenset(i for i, d in enumerate(signed) if abs(d) <= tolerance)
        if len(face) != len(points):
            faces.add(face)
    return faces


def regular_hull(points, kind, edge):
    faces = hull_faces(points)
    vertices, face_count, face_size, neighbour_count = {
        'tetrahedron': (4, 4, 3, 3),
        'cube': (8, 6, 4, 3),
        'octahedron': (6, 8, 3, 4),
    }[kind]
    assert len(points) == vertices and len(faces) == face_count, (kind, faces)
    assert set().union(*faces) == set(range(vertices)), kind+' all vertices extreme'
    for face in faces:
        assert len(face) == face_size, (kind, face)
        measured = sorted(distance(points[i], points[j]) for i, j in itertools.combinations(face, 2))
        expected = [edge]*3 if face_size == 3 else [edge]*4+[edge*math.sqrt(2)]*2
        for a, b in zip(measured, expected):
            near(a, b, kind+' regular supporting face')
    for i, p in enumerate(points):
        neighbours = sum(math.isclose(distance(p, q), edge, rel_tol=1e-8)
                         for j, q in enumerate(points) if j != i)
        assert neighbours == neighbour_count, kind+' edge incidence'
    return faces


def outward_normal(points, face):
    a, b, c = [points[i] for i in list(face)[:3]]
    n = normal(a, b, c)
    return n if dot(n, sub(centre(points), a)) < 0 else mul(n, -1)


def interior_dihedral(points, face1, face2):
    assert len(set(face1) & set(face2)) == 2
    cosine = -dot(outward_normal(points, face1), outward_normal(points, face2))
    return math.acos(max(-1, min(1, cosine)))


def reflect(p, plane_point, plane_normal):
    n = unit(plane_normal)
    return sub(p, mul(n, 2*dot(n, sub(p, plane_point))))


def matvec(matrix, vector):
    return tuple(dot(row, vector) for row in matrix)


def determinant(matrix):
    return dot(matrix[0], cross(matrix[1], matrix[2]))


def permutation_transform(points, permutation):
    """Linear isometry about the centroid for a permutation of four vertices."""
    o = centre(points)
    basis = [sub(points[i], o) for i in range(3)]
    det = dot(basis[0], cross(basis[1], basis[2]))
    inverse_rows = [mul(cross(basis[1], basis[2]), 1/det),
                    mul(cross(basis[2], basis[0]), 1/det),
                    mul(cross(basis[0], basis[1]), 1/det)]
    targets = [sub(points[permutation[i]], o) for i in range(3)]
    matrix = tuple(tuple(sum(targets[k][i]*inverse_rows[k][j] for k in range(3))
                         for j in range(3)) for i in range(3))
    for i in range(4):
        near(distance(add(matvec(matrix, sub(points[i], o)), o), points[permutation[i]]),
             0, '319 exact vertex permutation')
    for i in range(3):
        for j in range(3):
            near(dot(matrix[i], matrix[j]), int(i == j), '319 orthogonality')
    return matrix


def regular_polygon(n, radius, height=0):
    return [(radius*math.cos(2*math.pi*i/n), radius*math.sin(2*math.pi*i/n), height)
            for i in range(n)]


TETRA = [(1, 1, 1), (1, -1, -1), (-1, 1, -1), (-1, -1, 1)]
CUBE = list(itertools.product((-1, 1), repeat=3))
OCTA = [tuple(s if i == axis else 0 for i in range(3))
        for axis in range(3) for s in (-1, 1)]
CHECK_KEYS = ['310', '311a', '311b', '312', '313', '314', '315', '316', '317', '318', '319']


def source_parameter_checks():
    rng = random.Random(310319)
    checks = dict.fromkeys(CHECK_KEYS, 0)
    for iteration in range(120):
        scale = rng.uniform(.2, 12)
        axis = (rng.uniform(.2, 1), rng.uniform(-1, 1), rng.uniform(-1, 1))
        angle = rng.uniform(-math.pi, math.pi)
        shift = tuple(rng.uniform(-9, 9) for _ in range(3))
        transform = lambda points: move(points, scale, axis, angle, shift)

        # 310: an isosceles base, with arbitrary side/base ratio and vertical edge.
        a, c, h = rng.uniform(2, 25), rng.uniform(.1, 1.95), rng.uniform(.2, 17)
        c *= a
        y = math.sqrt(a*a-c*c/4)
        A, B, C, D = transform([(0, y, 0), (-c/2, 0, 0), (c/2, 0, 0), (0, y, h)])
        measured = area(D, A, B)+area(D, A, C)+area(D, B, C)
        near(measured, (a*h+c*math.sqrt(y*y+h*h)/2)*scale*scale, '310 lateral area')
        checks['310'] += 1

        # 311: any triangle whose chosen altitude has its foot inside BC.
        c, y, h = rng.uniform(1, 20), rng.uniform(.2, 18), rng.uniform(.2, 16)
        x = rng.uniform(.05, .95)*c
        A, B, C, D, E = transform([(x, y, 0), (0, 0, 0), (c, 0, 0), (x, y, h), (x, 0, 0)])
        total = sum(area(*face) for face in [(A, B, C), (D, A, B), (D, A, C), (D, B, C)])
        expected = (c*y+h*(math.hypot(x, y)+math.hypot(c-x, y))+c*math.hypot(y, h))/2
        near(total, expected*scale*scale, '311a full area')
        checks['311a'] += 1
        H = plane_foot(A, D, B, C)
        J, t = line_foot(A, E, D)
        near(distance(H, J), 0, '311b plane foot lies on altitude')
        assert 0 < t < 1
        near(t, y*y/(y*y+h*h), '311b internal altitude position')
        near(distance(A, H), h*y/math.hypot(y, h)*scale, '311b perpendicular length')
        near(dot(sub(A, H), unit(sub(B, C))), 0, '311b first face direction')
        near(dot(sub(A, H), unit(sub(D, E))), 0, '311b second face direction')
        checks['311b'] += 1

        # 312: n varies; plane normals determine phi independently of h/r.
        n = 3+iteration % 60
        R, phi = rng.uniform(.2, 15), rng.uniform(.025, math.pi/2-.025)
        height = R*math.cos(math.pi/n)*math.tan(phi)
        base = regular_polygon(n, R)
        O, S = (0, 0, 0), (0, 0, height)
        measured_phi = math.acos(abs(dot(normal(S, base[0], base[1]), (0, 0, 1))))
        measured_alpha = math.asin(abs(dot(unit(sub(S, base[0])), (0, 0, 1))))
        near(measured_phi, phi, '312 source dihedral')
        near(math.tan(measured_alpha), math.cos(math.pi/n)*math.tan(phi), '312 edge angle')
        assert 0 < measured_alpha < phi < math.pi/2
        checks['312'] += 1

        # 313: use actual trapezoid triangles, not perimeter/apothem as oracle.
        a, b, h = rng.uniform(3, 25), rng.uniform(.05, .95), rng.uniform(.2, 9)
        b *= a
        bottom, top = regular_polygon(3, a/math.sqrt(3)), regular_polygon(3, b/math.sqrt(3), h)
        points = transform(bottom+top)
        measured = sum(area(points[i], points[(i+1) % 3], points[i+3])+
                       area(points[(i+1) % 3], points[(i+1) % 3+3], points[i+3]) for i in range(3))
        slant = math.sqrt(h*h+(a-b)**2/12)
        near(measured, 3*(a+b)*slant/2*scale*scale, '313 frustum lateral area')
        checks['313'] += 1

        # 314: variable ratio and height/apothem, including the stated 7:3 case.
        q, p = rng.uniform(.2, 5), rng.uniform(1.05, 5)
        p *= q
        h, offset = rng.uniform(.2, 20), rng.uniform(.2, 15)
        l = math.hypot(h, offset)
        a, b = 2*p*math.sqrt(l*l-h*h)/(p-q), 2*q*math.sqrt(l*l-h*h)/(p-q)
        near(a/b, p/q, '314 given ratio')
        near(math.hypot(h, (a-b)/2), l, '314 apothem from square side midpoints')
        assert a > b > 0
        checks['314'] += 1

        # 315: eight face centroids, their complete support hull, and square faces.
        octa = transform(OCTA)
        octa_faces = regular_hull(octa, 'octahedron', scale*math.sqrt(2))
        centroids = [centre([octa[i] for i in sorted(face)]) for face in sorted(octa_faces, key=lambda f: tuple(sorted(f)))]
        regular_hull(centroids, 'cube', 2*scale/3)
        checks['315'] += 1

        # 316: every pair is at one-third edge length; volume rules out coplanarity.
        tetra = transform(TETRA)
        centroids = [centre([p for j, p in enumerate(tetra) if j != i]) for i in range(4)]
        regular_hull(centroids, 'tetrahedron', 2*math.sqrt(2)*scale/3)
        near(signed_volume(*centroids), -signed_volume(*tetra)/27, '316 volume and orientation')
        O = centre(tetra)
        for V, G in zip(tetra, centroids):
            near(distance(G, add(O, mul(sub(V, O), -1/3))), 0, '316 centroid homothety')
        checks['316'] += 1

        # 317: face-centre hull of the cube really has eight triangular faces.
        cube = transform(CUBE)
        cube_faces = regular_hull(cube, 'cube', 2*scale)
        centroids = [centre([cube[i] for i in face]) for face in cube_faces]
        regular_hull(centroids, 'octahedron', math.sqrt(2)*scale)
        checks['317'] += 1

        # 318: all interior dihedrals, and the synthetic midpoint section's rays.
        tetra_faces = regular_hull(tetra, 'tetrahedron', 2*math.sqrt(2)*scale)
        tet_angles = [interior_dihedral(tetra, f, g) for f, g in itertools.combinations(tetra_faces, 2)]
        for theta in tet_angles:
            near(math.cos(theta), 1/3, '318 interior tetrahedron cosine')
        midpoints = [midpoint(a, b) for a, b in itertools.combinations(tetra, 2)]
        mid_faces = regular_hull(midpoints, 'octahedron', math.sqrt(2)*scale)
        oct_angles = [interior_dihedral(midpoints, f, g) for f, g in itertools.combinations(mid_faces, 2) if len(f & g) == 2]
        assert len(oct_angles) == 12
        for theta in oct_angles:
            near(math.cos(theta), -1/3, '318 interior octahedron cosine')
            near(theta+tet_angles[0], math.pi, '318 supplementary interior angles')
        A, B, C, D = tetra
        E, F, G, K = midpoint(A, B), midpoint(A, C), midpoint(A, D), midpoint(B, C)
        P = midpoint(E, F)
        for X in [A, G, K]:
            near(dot(unit(sub(E, F)), sub(X, P)), 0, '318 all section rays normal to edge')
        near(dot(unit(sub(A, P)), unit(sub(K, P))), -1, '318 opposite outer rays')
        checks['318'] += 1

        # 319: enumerate all 24 vertex isometries, then select genuine reflections.
        reflections = []
        for permutation in itertools.permutations(range(4)):
            matrix = permutation_transform(tetra, permutation)
            trace = sum(matrix[i][i] for i in range(3))
            involution = all(permutation[permutation[i]] == i for i in range(4))
            if determinant(matrix) < 0 and involution and math.isclose(trace, 1, abs_tol=1e-8):
                reflections.append(permutation)
        assert len(reflections) == 6 and sum(p[0] == 0 for p in reflections) == 3
        for j, k in itertools.combinations([1, 2, 3], 2):
            M, n = midpoint(tetra[j], tetra[k]), sub(tetra[j], tetra[k])
            near(dot(unit(n), sub(tetra[0], M)), 0, '319 plane through selected vertex')
            for i, point in enumerate(tetra):
                image = reflect(point, M, n)
                expected = tetra[k if i == j else j if i == k else i]
                near(distance(image, expected), 0, '319 reflection preserves the tetrahedron')
        checks['319'] += 1

    assert all(value == 120 for value in checks.values())
    # Exact source data are checked independently of the random families.
    A, B, C, D = (0, 15, 0), (-20, 0, 0), (20, 0, 0), (0, 15, 8)
    near(sum(area(*f) for f in [(D, A, B), (D, A, C), (D, B, C)]), 540, '310 source result')
    A, B, C, D = (9, 12, 0), (0, 0, 0), (14, 0, 0), (9, 12, 9)
    near(sum(area(*f) for f in [(A, B, C), (D, A, B), (D, A, C), (D, B, C)]), 315, '311a source result')
    near(distance(A, plane_foot(A, D, B, C)), 36/5, '311b source result')
    near(3*(12+6)/2*math.sqrt(1+(12-6)**2/12), 54, '313 source result')
    near(2*7*math.sqrt(65**2-63**2)/(7-3), 56, '314 larger base')
    near(2*3*math.sqrt(65**2-63**2)/(7-3), 24, '314 smaller base')
    for n in [3, 4, 5, 127, 512, 1024]:
        for phi in [1e-4, math.pi/4, math.pi/2-1e-4]:
            r = math.cos(math.pi/n)
            h = r*math.tan(phi)
            vertex, neighbour = regular_polygon(n, 1)[:2]
            foot = midpoint(vertex, neighbour)
            near(norm(foot), r, '312 general-n polygon apothem')
            plane_normal = normal((0, 0, h), vertex, neighbour)
            # tan of the measured face angle avoids inverse-cosine cancellation.
            measured_tan_phi = math.hypot(plane_normal[0], plane_normal[1])/abs(plane_normal[2])
            near(h, norm(foot)*measured_tan_phi, '312 limiting-domain geometry')
            assert 0 < math.atan(h) < phi
    return checks


def actual_model_checks():
    """Check the exact source data and constructions in all eleven lesson models."""
    lesson_root = Path(__file__).resolve().parents[2]/'stereo-course/textbook/lessons'
    ids = ['0310', '0311-a', '0311-b', '0312', '0313', '0314',
           '0315', '0316', '0317', '0318', '0319']
    models = {key: json.loads((lesson_root/('ex-main-'+key+'.json')).read_text())['visualization']['model']
              for key in ids}
    totals = {'models': len(models), 'states': 0, 'polygons': 0, 'segments': 0}

    def coincides(a, b, label):
        near(distance(a, b), 0, label)

    def parallel(a, b, label):
        near(norm(cross(unit(a), unit(b))), 0, label)

    def displayed_edge_graph(model, view, names, edge, label):
        expected = {frozenset((x, y)) for x, y in itertools.combinations(names, 2)
                    if math.isclose(distance(model['points'][x], model['points'][y]), edge, rel_tol=1e-8)}
        actual = [frozenset(pair) for pair in model['views'][view]['segments']]
        assert len(actual) == len(set(actual)) and set(actual) == expected, label+' complete displayed edge graph'

    def polygon(points, label):
        assert len(points) >= 3
        n = normal(*points[:3])
        for point in points:
            near(dot(n, sub(point, points[0])), 0, label+' planar')
        turns = [dot(cross(sub(points[i], points[i-1]),
                           sub(points[(i+1) % len(points)], points[i])), n)
                 for i in range(len(points))]
        assert all(x > 1e-9 for x in turns) or all(x < -1e-9 for x in turns), label+' strictly convex order'
        assert sum(area(points[0], points[i], points[i+1]) for i in range(1, len(points)-1)) > 1e-9

    for key, model in models.items():
        points = model['points']
        for name, point in points.items():
            assert len(point) == 3 and all(math.isfinite(x) for x in point), (key, name)
        segments = list(model['edges'])
        polygons = list(model.get('faces', []))
        for name, view in model['views'].items():
            segments.extend(view.get('segments', []))
            if 'polygon' in view:
                polygons.append(view['polygon'])
        for a, b in segments:
            assert a in points and b in points and distance(points[a], points[b]) > 1e-9, (key, a, b)
        for i, names in enumerate(polygons):
            polygon([points[n] for n in names], key+' polygon '+str(i))
        totals['states'] += len(model['views'])
        totals['polygons'] += len(polygons)
        totals['segments'] += len(segments)

    p = models['0310']['points']
    for a, b, value in [('A', 'B', 25), ('A', 'C', 25), ('B', 'C', 40), ('D', 'A', 8)]:
        near(distance(p[a], p[b]), value, '310 actual source dimension')
    parallel(sub(p['D'], p['A']), normal(p['A'], p['B'], p['C']), '310 vertical source edge')
    coincides(p['E'], midpoint(p['B'], p['C']), '310 actual midpoint')
    near(distance(p['A'], p['E']), 15, '310 actual base altitude')
    near(distance(p['D'], p['E']), 17, '310 actual side altitude')
    near(dot(sub(p['D'], p['E']), unit(sub(p['B'], p['C']))), 0, '310 side altitude perpendicular')
    near(sum(area(p['D'], p[x], p[y]) for x, y in [('A', 'B'), ('A', 'C'), ('B', 'C')]),
         540, '310 actual lateral area')

    for key in ['0311-a', '0311-b']:
        p = models[key]['points']
        for a, b, value in [('A', 'B', 15), ('A', 'C', 13), ('B', 'C', 14), ('D', 'A', 9)]:
            near(distance(p[a], p[b]), value, key+' actual source dimension')
        parallel(sub(p['D'], p['A']), normal(p['A'], p['B'], p['C']), key+' vertical source edge')
        foot, t = line_foot(p['A'], p['B'], p['C'])
        coincides(p['E'], foot, key+' base altitude foot')
        near(t, 9/14, key+' internal base foot parameter')
        near(distance(p['A'], p['E']), 12, key+' base altitude')
        near(distance(p['D'], p['E']), 15, key+' face altitude')
        near(area(p['A'], p['B'], p['C']), 84, key+' base area')
        total = sum(area(p[a], p[b], p[c]) for a, b, c in
                    [('A', 'B', 'C'), ('D', 'A', 'B'), ('D', 'A', 'C'), ('D', 'B', 'C')])
        near(total, 315, key+' full area')
        if key.endswith('b'):
            coincides(p['H'], plane_foot(p['A'], p['D'], p['B'], p['C']), '311b exact plane foot')
            foot, t = line_foot(p['A'], p['D'], p['E'])
            coincides(p['H'], foot, '311b foot on face altitude')
            near(t, 9/25, '311b foot strictly inside altitude')
            near(distance(p['A'], p['H']), 36/5, '311b source perpendicular length')
            parallel(sub(p['T'], p['E']), sub(p['D'], p['A']), '311b ET auxiliary perpendicular')
            parallel(sub(p['J'], p['H']), sub(p['C'], p['B']), '311b HJ constructed parallel')
            near(dot(normal(p['D'], p['B'], p['C']), sub(p['J'], p['D'])), 0, '311b J in stated face plane')
            assert all('J' not in edge for edge in models[key]['edges'])
            assert 'J' not in models[key]['labelNames']

    p = models['0312']['points']
    base = [p[x] for x in ['A', 'B', 'C', 'D', 'E', 'F']]
    coincides(p['O'], centre(base), '312 illustrated regular hexagon centre')
    for a, b in zip(base, base[1:]+base[:1]):
        near(distance(a, b), 4, '312 illustrative side length')
        near(distance(a, p['O']), 4, '312 illustrative circumradius')
    coincides(p['K'], midpoint(p['A'], p['B']), '312 apothem foot')
    near(distance(p['M'], p['O']), 3, '312 illustrative height')
    normal_base = normal(*base[:3])
    parallel(sub(p['M'], p['O']), normal_base, '312 height normal to base')
    phi = math.acos(abs(dot(normal_base, normal(p['M'], p['A'], p['B']))))
    alpha = math.asin(abs(dot(unit(sub(p['M'], p['A'])), normal_base)))
    near(math.tan(alpha), math.cos(math.pi/len(base))*math.tan(phi), '312 actual distinct edge and face angles')
    assert 0 < alpha < phi < math.pi/2

    for key, letters, a, b, height, slant in [
            ('0313', ['A', 'B', 'C'], 12, 6, 1, 2),
            ('0314', ['A', 'B', 'C', 'D'], 56, 24, 63, 65)]:
        p = models[key]['points']
        lower, upper = [p[x] for x in letters], [p[x+'1'] for x in letters]
        coincides(p['O'], centre(lower), key+' lower centre')
        coincides(p['O1'], centre(upper), key+' upper centre')
        coincides(p['E'], midpoint(p['A'], p['B']), key+' lower side midpoint')
        coincides(p['F'], midpoint(p['A1'], p['B1']), key+' upper side midpoint')
        for points, side in [(lower, a), (upper, b)]:
            for x, y in zip(points, points[1:]+points[:1]):
                near(distance(x, y), side, key+' source base sides')
        for name in letters:
            coincides(sub(p[name+'1'], p['O1']), mul(sub(p[name], p['O']), b/a),
                      key+' aligned homothetic corresponding vertices')
        parallel(sub(p['O1'], p['O']), normal(*lower[:3]), key+' correct vertical axis')
        parallel(normal(*upper[:3]), normal(*lower[:3]), key+' parallel bases')
        near(distance(p['O'], p['O1']), height, key+' source height')
        near(distance(p['E'], p['F']), slant, key+' apothem')
        coincides(p['H'], plane_foot(p['F'], *lower[:3]), key+' foot onto lower base')
        foot, t = line_foot(p['H'], p['O'], p['E'])
        coincides(foot, p['H'], key+' foot on radius')
        assert 0 < t < 1
        near(t, b/a, key+' homothetic corresponding radii')
        near(dot(sub(p['F'], p['E']), unit(sub(p['B'], p['A']))), 0, key+' apothem normal to base edge')
        if key == '0313':
            measured = sum(area(p[x], p[y], p[x+'1'])+area(p[y], p[y+'1'], p[x+'1'])
                           for x, y in zip(letters, letters[1:]+letters[:1]))
            near(measured, 54, '313 actual lateral area')
            # The filled axial trapezoid is the full section; the small right
            # triangle remains three explicit segments inside that same plane.
            section = plane_edge_intersections(p, models[key]['edges'], [p['O'], p['E'], p['F']])
            assert len(section) == 4
            for name in ['C', 'E', 'F', 'C1']:
                assert any(distance(p[name], point) < 1e-7 for point in section), '313 exact axial section vertex'
            near(area(p['C'], p['E'], p['F'])+area(p['C'], p['F'], p['C1']),
                 9*math.sqrt(3)/2, '313 full axial section area')
            for view in ['section', 'length']:
                assert models[key]['views'][view]['polygon'] == ['C', 'E', 'F', 'C1']
                shown = {frozenset(edge) for edge in models[key]['views'][view]['segments']}
                assert all(frozenset(edge) in shown for edge in [('E', 'H'), ('H', 'F'), ('E', 'F')])
            near(distance(p['E'], p['H']), math.sqrt(3), '313 small triangle horizontal cathetus')
            near(distance(p['F'], p['H']), 1, '313 small triangle vertical cathetus')
        else:
            near(a/b, 7/3, '314 source ratio')
            near(distance(p['E'], p['H']), 16, '314 actual half-side difference')

    p = models['0315']['points']
    original = [p[x] for x in ['A', 'B', 'C', 'D', 'S', 'T']]
    a = distance(p['A'], p['B'])
    regular_hull(original, 'octahedron', a)
    coincides(p['O'], centre(original), '315 octahedron centre')
    for name, x, y in [('M', 'A', 'B'), ('N', 'B', 'C'), ('K', 'C', 'D'), ('L', 'D', 'A')]:
        coincides(p[name], midpoint(p[x], p[y]), '315 square side midpoint '+name)
    for top, bottom, x, y in [('P', 'P1', 'A', 'B'), ('Q', 'Q1', 'B', 'C'),
                              ('R', 'R1', 'C', 'D'), ('U', 'U1', 'D', 'A')]:
        coincides(p[top], centre([p['S'], p[x], p[y]]), '315 upper face centroid')
        coincides(p[bottom], centre([p['T'], p[x], p[y]]), '315 lower face centroid')
        parallel(sub(p[top], p[bottom]), sub(p['S'], p['T']), '315 vertical joining edge')
        near(distance(p[top], p[bottom]), a*math.sqrt(2)/3, '315 joining edge length')
    regular_hull([p[x] for x in ['P', 'Q', 'R', 'U', 'P1', 'Q1', 'R1', 'U1']], 'cube', a*math.sqrt(2)/3)
    displayed_edge_graph(models['0315'], 'cube', ['P', 'Q', 'R', 'U', 'P1', 'Q1', 'R1', 'U1'],
                         a*math.sqrt(2)/3, '315 final cube')

    p = models['0316']['points']
    original = [p[x] for x in ['A', 'B', 'C', 'D']]
    a = distance(p['A'], p['B'])
    regular_hull(original, 'tetrahedron', a)
    for name, face in [('G', 'ABC'), ('H', 'ABD'), ('K', 'ACD'), ('L', 'BCD')]:
        coincides(p[name], centre([p[x] for x in face]), '316 actual face centroid')
    coincides(p['M'], midpoint(p['A'], p['B']), '316 midpoint of common edge')
    regular_hull([p[x] for x in ['G', 'H', 'K', 'L']], 'tetrahedron', a/3)
    near(abs(signed_volume(p['G'], p['H'], p['K'], p['L'])), abs(signed_volume(*original))/27,
         '316 noncoplanarity and volume')
    parallel(normal(p['G'], p['H'], p['K']), normal(p['B'], p['C'], p['D']), '316 parallel distinct planes')
    assert abs(dot(normal(p['G'], p['H'], p['K']), sub(p['L'], p['G']))) > 1e-8
    displayed_edge_graph(models['0316'], 'tetrahedron', ['G', 'H', 'K', 'L'], a/3, '316 final tetrahedron')

    p = models['0317']['points']
    cube = [p[x] for x in ['_A', '_B', '_C', '_D', '_A1', '_B1', '_C1', '_D1']]
    a = distance(p['_A'], p['_B'])
    regular_hull(cube, 'cube', a)
    for name, lower in [('K', '_A'), ('L', '_B'), ('M', '_C'), ('N', '_D')]:
        coincides(p[name], midpoint(p[lower], p[lower+'1']), '317 mid-height section')
    for name, face in [('E', ['_A', '_B', '_B1', '_A1']), ('F', ['_B', '_C', '_C1', '_B1']),
                       ('G', ['_C', '_D', '_D1', '_C1']), ('H', ['_D', '_A', '_A1', '_D1']),
                       ('S', ['_A1', '_B1', '_C1', '_D1']), ('T', ['_A', '_B', '_C', '_D'])]:
        coincides(p[name], centre([p[x] for x in face]), '317 cube face centre')
    regular_hull([p[x] for x in ['E', 'F', 'G', 'H', 'S', 'T']], 'octahedron', a/math.sqrt(2))
    coincides(p['O'], centre(cube), '317 shared centre')
    for x, y in [('E', 'G'), ('F', 'H'), ('S', 'T')]:
        coincides(midpoint(p[x], p[y]), p['O'], '317 opposite pairs')
    displayed_edge_graph(models['0317'], 'octahedron', ['E', 'F', 'G', 'H', 'S', 'T'],
                         a/math.sqrt(2), '317 final octahedron')

    p = models['0318']['points']
    tetra = [p[x] for x in ['A', 'B', 'C', 'D']]
    a = distance(p['A'], p['B'])
    regular_hull(tetra, 'tetrahedron', a)
    for name, x, y in [('E', 'A', 'B'), ('F', 'A', 'C'), ('G', 'A', 'D'),
                       ('H', 'B', 'C'), ('I', 'B', 'D'), ('J', 'C', 'D')]:
        coincides(p[name], midpoint(p[x], p[y]), '318 original edge midpoint')
    corner = [p[x] for x in ['A', 'E', 'F', 'G']]
    central = [p[x] for x in ['E', 'F', 'G', 'H', 'I', 'J']]
    regular_hull(corner, 'tetrahedron', a/2)
    regular_hull(central, 'octahedron', a/2)
    alpha = interior_dihedral(corner, [1, 2, 3], [0, 1, 2])
    beta = interior_dihedral(central, [0, 1, 2], [0, 1, 3])
    near(alpha+beta, math.pi, '318 actual interior dihedrals')
    coincides(p['K'], midpoint(p['E'], p['F']), '318 normal section edge midpoint')
    coincides(p['K'], midpoint(p['A'], p['H']), '318 opposite outer rays')
    for name in ['A', 'G', 'H']:
        near(dot(sub(p[name], p['K']), unit(sub(p['E'], p['F']))), 0, '318 normal section ray')
    near(dot(unit(sub(p['A'], p['K'])), unit(sub(p['G'], p['K']))), math.cos(alpha), '318 inner tetrahedron ray angle')
    near(dot(unit(sub(p['G'], p['K'])), unit(sub(p['H'], p['K']))), math.cos(beta), '318 inner octahedron ray angle')
    displayed_edge_graph(models['0318'], 'octahedron', ['E', 'F', 'G', 'H', 'I', 'J'], a/2, '318 central octahedron')

    p = models['0319']['points']
    vertices = [p[x] for x in ['A', 'B', 'C', 'D']]
    regular_hull(vertices, 'tetrahedron', distance(p['A'], p['B']))
    for mid, fixed, x, y in [('M', 'B', 'C', 'D'), ('N', 'C', 'B', 'D'), ('P', 'D', 'B', 'C')]:
        coincides(p[mid], midpoint(p[x], p[y]), '319 plane midpoint')
        n = normal(p['A'], p[fixed], p[mid])
        parallel(n, sub(p[x], p[y]), '319 plane is perpendicular bisector')
        for name in ['A', 'B', 'C', 'D']:
            expected = p[y if name == x else x if name == y else name]
            coincides(reflect(p[name], p[mid], n), expected, '319 authored symmetry preserves every vertex')
    count = 0
    for permutation in itertools.permutations(range(4)):
        matrix = permutation_transform(vertices, permutation)
        if permutation[0] == 0 and determinant(matrix) < 0 and all(permutation[permutation[i]] == i for i in range(4)):
            near(sum(matrix[i][i] for i in range(3)), 1, '319 actual plane reflection trace')
            count += 1
    assert count == 3
    return totals


if __name__ == '__main__':
    checks = source_parameter_checks()
    actual = actual_model_checks()
    print('ATANASYAN_ADDITIONAL_310_319_MATH_OK', sum(checks.values()),
          'parameter families;', checks, '; actual models', actual)
