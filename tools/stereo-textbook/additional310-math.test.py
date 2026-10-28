"""Independent source-scale and geometric oracles for Atanasyan 310–314.

Scope is exactly six cards, including both parts of 311. Cross products and
orthogonal projection check the actual models; plane normals test the general
angle formula independently of the written right-triangle derivation. These
checks do not replace direct reading of the supplied printed page 88.
"""
import copy
import itertools
import json
import math
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
IDS = ['0310', '0311-a', '0311-b', '0312', '0313', '0314']


def close(actual, expected, message):
    assert np.allclose(actual, expected, rtol=1e-8, atol=1e-8), (message, actual, expected)


def length(vector):
    return float(np.linalg.norm(vector))


def unit(vector):
    norm = length(vector)
    assert norm > 1e-10, 'Nonzero direction is required'
    return vector / norm


def normal(a, b, c):
    return unit(np.cross(b - a, c - a))


def perpendicular(a, b, message):
    close(np.dot(unit(a), unit(b)), 0, message)


def line_foot(point, a, b):
    direction = b - a
    return a + np.dot(point - a, direction) / np.dot(direction, direction) * direction


def plane_foot(point, a, b, c):
    n = normal(a, b, c)
    return point - np.dot(point - a, n) * n


def triangle(a, b, c):
    return length(np.cross(b - a, c - a)) / 2


def polygon(vertices):
    """Keep authored cyclic order; do not sort away a crossed polygon."""
    assert len(vertices) >= 3
    origin = vertices[0]
    n = normal(*vertices[:3])
    for point in vertices:
        close(np.dot(point - origin, n), 0, 'Planar face or highlighted section')
    turns = [float(np.dot(np.cross(vertices[(i + 1) % len(vertices)] - vertices[i],
                                  vertices[(i + 2) % len(vertices)] - vertices[(i + 1) % len(vertices)]), n))
             for i in range(len(vertices))]
    assert all(turn > 1e-8 for turn in turns), 'Strictly convex, correctly ordered polygon'
    return sum(triangle(origin, vertices[i], vertices[i + 1]) for i in range(1, len(vertices) - 1))


def side_area(points, names, apex):
    return sum(triangle(points[apex], points[names[i]], points[names[(i + 1) % len(names)]])
               for i in range(len(names)))


def regular_base(points, names):
    vertices = [points[name] for name in names]
    centre = np.mean(vertices, axis=0)
    n = normal(*vertices[:3])
    radius = length(vertices[0] - centre)
    side = length(vertices[1] - vertices[0])
    polygon(vertices)
    for i, vertex in enumerate(vertices):
        close(length(vertex - centre), radius, 'Equal circumradii')
        close(length(vertices[(i + 1) % len(vertices)] - vertex), side, 'Equal base sides')
        close(np.dot(unit(vertex - centre), unit(vertices[(i + 1) % len(vertices)] - centre)),
              math.cos(2 * math.pi / len(vertices)), 'Consecutive regular-polygon vertices')
    return centre, n, side, radius


def check310(points):
    a, b, c, d = (points[name] for name in 'ABCD')
    close([length(b - a), length(c - a), length(c - b), length(d - a)],
          [25, 25, 40, 8], '310 exact source lengths, not a scaled lookalike')
    close(np.cross(unit(d - a), normal(a, b, c)), [0, 0, 0], '310 DA perpendicular to ABC')
    k = line_foot(a, b, c)
    close(k, (b + c) / 2, '310 isosceles-base altitude is a median')
    close(points['K'], k, '310 authored foot K')
    perpendicular(d - k, c - b, '310 actual face altitude DK')
    close([length(a - k), length(d - k)], [15, 17], '310 independently projected altitudes')
    areas = [triangle(d, a, b), triangle(d, a, c), triangle(d, b, c)]
    close(areas, [100, 100, 340], '310 direct cross-product face areas')
    close(sum(areas), 540, '310 lateral area excludes the base')


def check311(points, with_foot=False):
    a, b, c, d = (points[name] for name in 'ABCD')
    close([length(c - a), length(b - a), length(c - b), length(d - a)],
          [13, 15, 14, 9], '311 exact source lengths')
    close(np.cross(unit(d - a), normal(a, b, c)), [0, 0, 0], '311 DA perpendicular to base')
    h = line_foot(a, b, c)
    close(points['H'], h, '311 foot H on BC')
    close([length(h - c), length(a - h), length(d - h)], [5, 12, 15], '311 base and face altitudes')
    perpendicular(d - h, c - b, '311 DH is an altitude of face BDC')
    areas = [triangle(a, b, c), triangle(d, a, b), triangle(d, a, c), triangle(d, b, c)]
    close(areas, [84, 67.5, 58.5, 105], '311 direct cross-product areas')
    close(sum(areas), 315, '311a includes all four faces')
    # Derive the plane foot directly. This is independent of first choosing DH.
    k = plane_foot(a, b, d, c)
    close(k, line_foot(a, d, h), '311b plane foot actually belongs to DH')
    t = float(np.dot(k - d, h - d) / np.dot(h - d, h - d))
    close(t, 9 / 25, '311b foot is internal to altitude DH')
    assert 0 < t < 1
    close(length(a - k), 36 / 5, '311b exact distance to face plane')
    if with_foot:
        close(points['K'], k, '311b authored plane foot K')
        l = d + t * (b - d)
        close(points['L'], l, '311b L lies on DB, not merely on a parallel line')
        close(np.cross(unit(l - k), unit(c - b)), [0, 0, 0], '311b KL parallel to BC')
        perpendicular(a - k, h - d, '311b AK perpendicular to DH')
        perpendicular(a - k, l - k, '311b AK perpendicular to second intersecting face direction')


def check312(points, names, authored=False):
    centre, base_normal, _, radius = regular_base(points, names)
    apex = points['S']
    close(np.cross(unit(apex - centre), base_normal), [0, 0, 0], '312 apex above regular-base centre')
    assert length(apex - centre) > 0
    midpoint = (points[names[0]] + points[names[1]]) / 2
    for i, name in enumerate(names):
        next_name = names[(i + 1) % len(names)]
        face_normal = normal(apex, points[name], points[next_name])
        # Angles are measured independently from plane/line normals, not h/r.
        phi = math.acos(float(np.clip(abs(np.dot(face_normal, base_normal)), 0, 1)))
        beta = math.asin(float(np.clip(abs(np.dot(unit(apex - points[name]), base_normal)), 0, 1)))
        assert 0 < beta < phi < math.pi / 2
        close(math.tan(beta), math.cos(math.pi / len(names)) * math.tan(phi), '312 arbitrary n angle relation')
    if authored:
        close(points['O'], centre, '312 authored centre O')
        close(points['M'], midpoint, '312 authored side midpoint M')
        close([radius, length(apex - centre)], [4, 3.5], '312 explicitly labelled illustrative parameters')
        assert len(names) == 5


def frustum_metrics(points, names, helpers=False):
    centre, n, lower_side, _ = regular_base(points, names)
    upper_names = [name + '1' for name in names]
    upper_centre, upper_normal, upper_side, _ = regular_base(points, upper_names)
    close(np.cross(n, upper_normal), [0, 0, 0], 'Parallel frustum bases')
    axis = upper_centre - centre
    close(np.cross(unit(axis), n), [0, 0, 0], 'Regular-frustum axis perpendicular to bases')
    assert lower_side > upper_side > 0
    for name in names:
        close(points[name + '1'] - upper_centre, (upper_side / lower_side) * (points[name] - centre),
              'Aligned homothety, not a twisted prismatoid')
    index = 1 if len(names) == 3 else 0
    u, v = names[index], names[(index + 1) % len(names)]
    m = (points[u] + points[v]) / 2
    nn = (points[u + '1'] + points[v + '1']) / 2
    h = plane_foot(nn, *(points[name] for name in names[:3]))
    perpendicular(nn - m, points[v] - points[u], 'True trapezoid altitude, not a lateral edge')
    perpendicular(nn - h, m - h, 'Normal profile triangle is right at H')
    if helpers:
        for name, expected in [('O', centre), ('O1', upper_centre), ('M', m), ('N', nn), ('H', h)]:
            close(points[name], expected, 'Authored frustum auxiliary ' + name)
    face_areas = [polygon([points[name], points[names[(i + 1) % len(names)]],
                           points[names[(i + 1) % len(names)] + '1'], points[name + '1']])
                  for i, name in enumerate(names)]
    apothem = length(nn - m)
    height = length(axis)
    close(sum(face_areas), len(names) * (lower_side + upper_side) * apothem / 2, 'Lateral area from actual 3D trapezoids')
    close(apothem ** 2, height ** 2 + ((lower_side - upper_side) / (2 * math.tan(math.pi / len(names)))) ** 2,
          'Apothem from inradius difference, not circumradius difference')
    return lower_side, upper_side, height, apothem, sum(face_areas), length(m - h)


def check313(points):
    close(frustum_metrics(points, list('ABC'), True),
          [12, 6, 1, 2, 54, math.sqrt(3)], '313 exact triangular frustum and lateral area')


def check314(points):
    lower, upper, height, apothem, _, projection = frustum_metrics(points, list('ABCD'), True)
    close([height, apothem, lower / upper], [63, 65, 7 / 3], '314 actual source constraints')
    close([lower, upper, projection], [56, 24, 16], '314 sides obtained from source constraints')


def transform(points, rotation, translation):
    return {name: rotation @ value + translation for name, value in points.items()}


def rotation(rng):
    q, _ = np.linalg.qr(rng.normal(size=(3, 3)))
    if np.linalg.det(q) < 0:
        q[:, 0] *= -1
    return q


def generated_pyramid(n, radius, phi):
    names = [f'V{i}' for i in range(n)]
    points = {name: np.array([radius * math.cos(2 * math.pi * i / n), radius * math.sin(2 * math.pi * i / n), 0.])
              for i, name in enumerate(names)}
    points['S'] = np.array([0., 0., radius * math.cos(math.pi / n) * math.tan(phi)])
    return points, names


def generated_frustum(n, lower, upper, height):
    names = list('ABCD'[:n])
    r = lower / (2 * math.sin(math.pi / n))
    points = {name: np.array([r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n), 0.])
              for i, name in enumerate(names)}
    for name in names:
        points[name + '1'] = points[name] * upper / lower + np.array([0., 0., height])
    return points, names


def rejects(check, points, change, label):
    bad = copy.deepcopy(points)
    change(bad)
    try:
        check(bad)
    except AssertionError:
        return
    raise AssertionError('A meaningful invalid model was accepted: ' + label)


def run():
    cards = {key: json.loads((ROOT / f'stereo-course/textbook/lessons/ex-main-{key}.json').read_text()) for key in IDS}
    points = {key: {name: np.array(value, dtype=float) for name, value in card['visualization']['model']['points'].items()}
              for key, card in cards.items()}
    checks = {'0310': check310, '0311-a': check311, '0311-b': lambda p: check311(p, True),
              '0312': lambda p: check312(p, list('ABCDE'), True), '0313': check313, '0314': check314}
    polygons = segments = 0
    for key, card in cards.items():
        model = card['visualization']['model']
        p = points[key]
        checks[key](p)
        for seq in [model['edges']] + [view.get('segments', []) for view in model['views'].values()]:
            for a, b in seq:
                assert length(p[a] - p[b]) > 1e-8
                segments += 1
        for names in model.get('faces', []) + [view['polygon'] for view in model['views'].values() if view.get('polygon')]:
            assert polygon([p[name] for name in names]) > 1e-8
            polygons += 1

    rng = np.random.default_rng(310314)
    # A rigid change of frame must not affect any geometric/source invariant.
    for _ in range(12):
        q = rotation(rng)
        shift = rng.uniform(-20, 20, 3)
        for key, check in checks.items():
            check(transform(points[key], q, shift))

    pyramid_cases = 0
    for n, radius, phi in itertools.product([3, 4, 5, 6, 7, 8, 10, 12, 17, 24, 31], [.35, 2.7, 19], [.07, .31, .93, 1.43]):
        p, names = generated_pyramid(n, radius, phi)
        check312(transform(p, rotation(rng), rng.uniform(-3, 3, 3)), names)
        pyramid_cases += 1
    frustum_cases = 0
    for n, lower, ratio, height in itertools.product([3, 4], [1.7, 9.3, 28], [.21, .57, .83], [.3, 2.8, 16]):
        p, names = generated_frustum(n, lower, lower * ratio, height)
        frustum_metrics(transform(p, rotation(rng), rng.uniform(-4, 4, 3)), names)
        frustum_cases += 1

    mutations = [
        ('0310', lambda p: [p.__setitem__(k, v * 1.1) for k, v in p.items()], 'source scale changed'),
        ('0310', lambda p: p.__setitem__('D', p['A'] + np.array([.2, 0., math.sqrt(64 - .2 ** 2)])),
         'DA stays8 but is no longer perpendicular'),
        ('0311-a', lambda p: p['A'].__setitem__(0, p['A'][0] + .1), 'source base changed'),
        ('0311-b', lambda p: p['K'].__setitem__(2, p['K'][2] + .2), 'plane foot moved'),
        ('0311-b', lambda p: p.__setitem__('L', p['L'] + .1 * (p['C'] - p['B'])), 'L keeps KL parallel but leaves DB'),
        ('0312', lambda p: p['S'].__setitem__(0, .2), 'apex displaced from centre'),
        ('0312', lambda p: p['M'].__setitem__(0, p['M'][0] + .2), 'side midpoint moved'),
        ('0312', lambda p: p.__setitem__('B', p['B'] * 1.1), 'base is not regular'),
        ('0313', lambda p: [p[k].__setitem__(2, 2 * p[k][2]) for k in p], 'height changed from1 to2'),
        ('0313', lambda p: p['H'].__setitem__(0, p['H'][0] + .2), 'wrong projection foot'),
        ('0313', lambda p: [p[k].__setitem__(0, p[k][0] + .3) for k in ['A1', 'B1', 'C1', 'O1', 'N']], 'upper base shifted sideways'),
        ('0314', lambda p: [p[k].__setitem__(2, p[k][2] * .99) for k in p], 'source height and apothem changed'),
        ('0314', lambda p: p['N'].__setitem__(0, p['N'][0] + .3), 'apothem endpoint is not midpoint'),
    ]
    for key, mutation, label in mutations:
        rejects(checks[key], points[key], mutation, key + ': ' + label)
    return {'models': len(cards), 'polygons': polygons, 'segments': segments,
            'rigidFrameCases': 12 * len(cards), 'generalPyramidCases': pyramid_cases,
            'generalFrustumCases': frustum_cases, 'rejectedCounterexamples': len(mutations)}


if __name__ == '__main__':
    result = run()
    print('ATANASYAN_ADDITIONAL_310_314_MATH_OK: ' + json.dumps(result, sort_keys=True))
