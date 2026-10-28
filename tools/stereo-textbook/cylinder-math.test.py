#!/usr/bin/env python3
"""Independent Euclidean oracle for Atanasyan §1 Cylinder, 320–345.

Source: supplied 2024 book, PDF 91–96 (printed 89–94), independently
inspected including answer page PDF 266 / printed 264. No authoring helper
or lesson answer supplies the parameter constructions below. Circle/line
intersections, vector products, line-line closest points, and rectangular
net coordinates are used as independent measurements.
"""
import json
import math
import random
from pathlib import Path


def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def mul(a, t):
    return tuple(x * t for x in a)


def dot(a, b):
    return sum(x*y for x, y in zip(a, b))


def cross(a, b):
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2],
            a[0]*b[1]-a[1]*b[0])


def norm(a):
    return math.sqrt(dot(a, a))


def distance(a, b):
    return norm(sub(a, b))


def near(a, b, label):
    assert math.isclose(a, b, rel_tol=2e-8, abs_tol=2e-8), (label, a, b)


def rectangle_area(points):
    a, b, c, d = points
    ab, ad = sub(b, a), sub(d, a)
    near(dot(ab, ad), 0, 'rectangle adjacent sides perpendicular')
    near(distance(c, add(b, ad)), 0, 'rectangle opposite corner')
    return norm(cross(ab, ad))


def vertical_section(r, h, offset):
    """Intersect x=offset with x²+y²≤r², 0≤z≤h.

    None denotes no intersection. At tangency the repeated endpoint pairs
    deliberately describe one generator, not a nondegenerate rectangle.
    """
    assert r > 0 and h > 0 and offset >= 0
    if offset > r:
        return None
    y = math.sqrt(max(0, r*r-offset*offset))
    return [(offset, -y, 0), (offset, y, 0),
            (offset, y, h), (offset, -y, h)]


def closest_line_axis(a, b):
    """Solve the closest-point normal equations for line AB and the z axis."""
    u = sub(b, a)
    horizontal_norm2 = u[0]*u[0]+u[1]*u[1]
    if horizontal_norm2 < 1e-24:
        return (a[0], a[1], a[2]), (0, 0, a[2]), None
    t = -(a[0]*u[0]+a[1]*u[1])/horizontal_norm2
    foot = add(a, mul(u, t))
    axis_foot = (0, 0, foot[2])
    near(dot(sub(foot, axis_foot), u), 0, '326 shortest vector normal to AB')
    near(dot(sub(foot, axis_foot), (0, 0, 1)), 0,
         '326 shortest vector normal to axis')
    return foot, axis_foot, t


def chord_from_boundary(r, angle):
    """Second intersection of a ray from A=(r,0) with the base circle."""
    a = (r, 0, 0)
    u = (-math.cos(angle), math.sin(angle), 0)
    # |A+t u|²=r² has the nonzero root -2 A·u / |u|².
    t = -2*dot(a, u)/dot(u, u)
    return a, add(a, mul(u, t))


def net_from_diagonal(d, phi):
    assert d > 0 and 0 < phi <= math.pi/2
    # Two equal diagonal vectors of length d; their sum/difference are sides.
    diagonal1 = (d*math.cos(phi/2), d*math.sin(phi/2), 0)
    diagonal2 = (d*math.cos(phi/2), -d*math.sin(phi/2), 0)
    long_side = norm(mul(add(diagonal1, diagonal2), .5))
    short_side = norm(mul(sub(diagonal1, diagonal2), .5))
    return long_side, short_side


def positive_root_for_339(delta, total_over_2pi):
    # r(r+h)=total/(2π), h=r+delta. Solve 2r²+delta*r-K=0.
    disc = math.sqrt(delta*delta+8*total_over_2pi)
    return (-delta+disc)/4, (-delta-disc)/4


def parameter_checks():
    rng = random.Random(320345)
    counts = dict.fromkeys([str(n) for n in range(320, 346)], 0)
    for _ in range(120):
        r, h = rng.uniform(.2, 20), rng.uniform(.2, 30)
        axial = vertical_section(r, h, 0)
        axial_area = rectangle_area(axial)
        near(axial_area, 2*r*h, '320 axial section')
        diagonal = distance(axial[0], axial[2])
        near(diagonal, math.hypot(2*r, h), '320 diagonal from actual vertices')
        counts['320'] += 1

        phi = math.acos(h/diagonal)
        near(diagonal*math.cos(phi), h, '321 height from generator angle')
        near(diagonal*math.sin(phi)/2, r, '321 radius from generator angle')
        near(math.pi*(diagonal*math.sin(phi)/2)**2, math.pi*r*r, '321 base')
        counts['321'] += 1

        side = rng.uniform(.2, 20)
        square = vertical_section(side/2, side, 0)
        diagonal_square = distance(square[0], square[2])
        near(diagonal_square/math.sqrt(2), side, '322 height')
        near(math.pi*diagonal_square**2/8, math.pi*(side/2)**2, '322 base')
        counts['322'] += 1

        # Congruence allows swapping the two rectangle dimensions.
        swapped = vertical_section(h/2, 2*r, 0)
        lengths1 = sorted(distance(axial[i], axial[j]) for i in range(4) for j in range(i))
        lengths2 = sorted(distance(swapped[i], swapped[j]) for i in range(4) for j in range(i))
        for x, y in zip(lengths1, lengths2):
            near(x, y, '323 congruent rectangles with exchanged height/diameter')
        assert not math.isclose(h, 2*r, rel_tol=1e-8)
        counts['323'] += 1

        base_area = math.pi*r*r
        near(axial_area/(2*math.sqrt(base_area/math.pi)), h, '324 height')
        counts['324'] += 1
        scale = rng.uniform(.2, 20)
        ratio_r, ratio_h = math.sqrt(3)*scale, 2*scale
        near(math.pi*ratio_r**2/(2*ratio_r*ratio_h), math.sqrt(3)*math.pi/4,
             '325 original radical ratio')
        v, w = (2*ratio_r, 0, ratio_h), (-2*ratio_r, 0, ratio_h)
        near(math.asin(v[2]/norm(v)), math.pi/6, '325 diagonal/base angle')
        near(math.acos(abs(dot(v, w))/(norm(v)*norm(w))), math.pi/3,
             '325 acute angle between diagonals')
        counts['325'] += 1

        a0, b0 = rng.uniform(-math.pi, math.pi), rng.uniform(-math.pi, math.pi)
        a = (r*math.cos(a0), r*math.sin(a0), 0)
        b = (r*math.cos(b0), r*math.sin(b0), h)
        foot, axis_foot, t = closest_line_axis(a, b)
        d = distance(foot, axis_foot)
        near(t, .5, '326 common perpendicular meets chord midpoint in height')
        near(distance(a, b)**2, h*h+4*(r*r-d*d), '326 skew line identity')
        assert h < distance(a, b) <= math.hypot(h, 2*r)+1e-8
        # Independent perturbations cannot shorten a vector normal to both lines.
        for ta, tb in [(-2, 3), (.2, -.7), (4, 4)]:
            other_a = add(foot, mul(sub(b, a), ta))
            other_b = add(axis_foot, (0, 0, tb))
            assert distance(other_a, other_b)+1e-8 >= d
        counts['326'] += 1

        offset = rng.uniform(0, .995)*r
        section = vertical_section(r, h, offset)
        area = rectangle_area(section)
        for p in section:
            near(p[0]*p[0]+p[1]*p[1], r*r, '327 endpoints on rim')
        near(distance(section[0], section[3]), h, '327 actual generator')
        near(area, 2*h*math.sqrt(r*r-offset*offset), '327/328 chord rectangle')
        counts['327'] += 1
        counts['328'] += 1
        square_height = rng.uniform(.02, 1.98)*r
        square_offset = math.sqrt(r*r-square_height*square_height/4)
        square_section = vertical_section(r, square_height, square_offset)
        near(distance(square_section[0], square_section[1]), square_height,
             '329 square chord equals height')
        counts['329'] += 1
        near(math.hypot(offset, area/(2*h)), r, '330 recover source radius')
        counts['330'] += 1

        phi = rng.uniform(.001, math.pi/2-.001)
        a, b = chord_from_boundary(r, phi)
        second_area = norm(cross(sub(b, a), (0, 0, h)))
        normal1, normal2 = (0, 1, 0), cross(sub(b, a), (0, 0, 1))
        angle = math.acos(abs(dot(normal1, normal2))/norm(normal2))
        near(angle, phi, '331 angle measured from plane normals')
        near(axial_area/second_area, 1/math.cos(phi), '331 explicit axial/nonaxial order')
        counts['331'] += 1
        near(area, math.sqrt(axial_area**2-4*h*h*offset*offset), '332 general section')
        counts['332'] += 1

        for number, arc in [('333', 2*math.pi/3), ('334', math.pi/3)]:
            x = r*math.cos(arc/2)
            sec = vertical_section(r, h, x)
            measured = rectangle_area(sec)
            expected = 2*math.sqrt(3)*x*h if number == '333' else 2*x*h/math.sqrt(3)
            near(measured, expected, number+' arc chord area')
            counts[number] += 1

        a, b = chord_from_boundary(r, math.pi/4)
        _, c = chord_from_boundary(r, -math.pi/4)
        near(dot(sub(b, a), sub(c, a)), 0, '335 perpendicular cutting planes')
        near(distance(b, c), 2*r, '335 opposite endpoints form diameter')
        equal_area = norm(cross(sub(b, a), (0, 0, h)))
        near(equal_area, norm(cross(sub(c, a), (0, 0, h))), '335 equal sections')
        near(axial_area, math.sqrt(2)*equal_area, '335 reconstructed axial area')
        counts['335'] += 1

        circumference = 2*math.pi*r
        # Parametrization X(t,z)=(r cos t,r sin t,z): |X_t×X_z|=r.
        angle = rng.uniform(-math.pi, math.pi)
        jacobian = norm(cross((-r*math.sin(angle), r*math.cos(angle), 0), (0, 0, 1)))
        lateral_integral = jacobian*(2*math.pi)*h
        near(lateral_integral, circumference*h, '39 surface integral/net identity')
        near(circumference*circumference, 4*math.pi**2*r*r, '336 h=circumference')
        counts['336'] += 1
        near(lateral_integral/math.pi, axial_area, '337 lateral/axial relation')
        counts['337'] += 1
        for bases in [0, 1, 2]:
            painted = lateral_integral+bases*base_area
            near(painted*.2, .2*(2*math.pi*r*h+bases*math.pi*r*r), '338 explicit base count')
        counts['338'] += 1
        delta = rng.uniform(.2, 20)
        positive, negative = positive_root_for_339(delta, r*(2*r+delta))
        near(positive, r, '339 positive geometric root')
        assert negative < 0
        counts['339'] += 1
        near(circumference*h*1.025, lateral_integral+lateral_integral*.025,
             '340 seam allowance applied only once to lateral area')
        counts['340'] += 1
        phi = math.atan2(2*r, h)
        near(4*base_area/math.tan(phi), lateral_integral, '341 generator angle cotangent')
        counts['341'] += 1

        d, phi = rng.uniform(.2, 30), rng.uniform(.002, math.pi/2)
        w, height = net_from_diagonal(d, phi)
        net = [(0, 0, 0), (w, 0, 0), (w, height, 0), (0, height, 0)]
        net_area = rectangle_area(net)
        near(net_area, .5*d*d*math.sin(phi), '342 net area from diagonals')
        for circumference, cylinder_height, trig in [(w, height, math.cos), (height, w, math.sin)]:
            radius = circumference/(2*math.pi)
            total = circumference*cylinder_height+2*math.pi*radius*radius
            near(total, net_area+d*d/(2*math.pi)*trig(phi/2)**2,
                 '342 both possible orientations of same net')
        assert w > height
        counts['342'] += 1
        square_side = d/math.sqrt(2)
        near(math.pi*(square_side/(2*math.pi))**2, d*d/(8*math.pi), '343 square net base')
        counts['343'] += 1
        a = rng.uniform(.2, 20)
        near(rectangle_area(vertical_section(a, a, 0)), 2*a*a, '344 axial rotation')
        near(2*math.pi*a*a+2*math.pi*a*a, 4*math.pi*a*a, '344 full rotation surface')
        counts['344'] += 1
        a, b = rng.uniform(.2, 20), rng.uniform(.2, 20)
        first_lateral, second_lateral = 2*math.pi*b*a, 2*math.pi*a*b
        near(first_lateral, second_lateral, '345 lateral rotation equality')
        near((first_lateral+2*math.pi*b*b)/(second_lateral+2*math.pi*a*a), b/a,
             '345 first AB-axis / second BC-axis ratio')
        counts['345'] += 1
    return counts


def fixed_and_boundary_checks():
    near(math.hypot(3, 4), 5, '320 source')
    near(48*math.cos(math.pi/3), 24, '321a source')
    near(48*math.sin(math.pi/3)/2, 12*math.sqrt(3), '321b source')
    near(math.pi*(48*math.sin(math.pi/3)/2)**2, 432*math.pi, '321c source')
    near(20/math.sqrt(2), 10*math.sqrt(2), '322a source')
    near(math.pi*(20/math.sqrt(2)/2)**2, 50*math.pi, '322b source')
    near(10/(2*math.sqrt(5/math.pi)), math.sqrt(5*math.pi), '324 source')
    near(math.sqrt(13**2-4*(10**2-8**2)), 5, '326a source')
    near(math.sqrt(5**2-(10**2-6**2)/4), 3, '326b source')
    near(rectangle_area(vertical_section(5, 8, 3)), 64, '328 source')
    near(math.sqrt(10**2-12**2/4), 8, '329 source')
    near(math.hypot(9, 240/10/2), 15, '330 source')
    near(rectangle_area(vertical_section(4/math.sqrt(3), 10*math.sqrt(3), 2)), 40,
         '334 source radical')
    near(2*math.pi*.5*math.pi, math.pi**2, '336 source')
    for bases, coefficient in [(0, .9), (1, 1.0125), (2, 1.125)]:
        near((2*math.pi*.75*3+bases*math.pi*.75**2)*.2,
             coefficient*math.pi, '338 source explicit '+str(bases)+' bases, kg')
    positive, negative = positive_root_for_339(12, 144)
    near(positive, 6, '339 source radius')
    near(positive+12, 18, '339 source height')
    near(negative, -12, '339 rejected root')
    near(math.pi*.2*4*1.025, .82*math.pi, '340 diameter converted cm to m')

    for r, h in [(.001, .002), (1, 1000), (1000, 1), (5, 6)]:
        near(rectangle_area(vertical_section(r, h, r)), 0, 'tangent degenerates to generator')
        assert vertical_section(r, h, 1.00001*r) is None
        near(rectangle_area(vertical_section(r, h, 0)), 2*r*h, 'zero offset is axial')
        a, b = (r, 0, 0), (r, 0, h)
        foot, axis_foot, parameter = closest_line_axis(a, b)
        near(distance(foot, axis_foot), r, '326 parallel generators distance r')
        assert parameter is None
        near(distance(a, b), h, '326 equal endpoint azimuth gives AB=h')
        a, b = (r, 0, 0), (-r, 0, h)
        foot, axis_foot, _ = closest_line_axis(a, b)
        near(distance(foot, axis_foot), 0, '326 diametric projection intersects axis')
        near(distance(a, b), math.hypot(2*r, h), '326 longest segment')
        a, b = chord_from_boundary(r, 0)
        near(distance(a, b), 2*r, '331 coincident axial planes limit')
        a, b = chord_from_boundary(r, math.pi/2)
        near(distance(a, b), 0, '331 perpendicular plane is tangent, excluded')

    for d in [.01, 1, 100]:
        w, h = net_from_diagonal(d, math.pi/2)
        near(w, h, '342 square is unique orientation case')
        near(w*h+w*w/(2*math.pi), w*h+h*h/(2*math.pi), '342 two totals coincide')
        for invalid in [0, -.1, math.pi]:
            try:
                net_from_diagonal(d, invalid)
            except AssertionError:
                pass
            else:
                raise AssertionError('342 invalid angle accepted')
    return 'PASS source values, tangent/missing sections, line-axis limits, quadratic roots, both wrap orientations'


def check_cylinder_mesh(model, prefix='', open_ends=False):
    """Check every actual displayed surface vertex, rather than mesh area.

    A sampled rim is an illustration of a circle. Its polygonal area is never
    substituted for the analytical cylinder/circle areas in the oracle.
    """
    points = model['points']
    origin, top = points[prefix+'O'], points[prefix+'O1']
    axis = sub(top, origin)
    h = norm(axis)
    assert h > 0
    normal = mul(axis, 1/h)
    def belongs(name):
        return not prefix or name.startswith(prefix) or name.startswith('_'+prefix)
    faces = [face for face in model['faces'] if all(belongs(k) for k in face)]
    vertices = set().union(*(set(face) for face in faces))
    heights, radii = {}, {}
    for name in vertices:
        offset = sub(points[name], origin)
        z = dot(offset, normal)
        heights[name] = z
        radii[name] = norm(sub(offset, mul(normal, z)))
        assert math.isclose(z, 0, abs_tol=2e-8) or math.isclose(z, h, abs_tol=2e-8)
    radius = next(iter(radii.values()))
    assert radius > 0
    for name, measured in radii.items():
        near(measured, radius, 'mesh rim on true circle '+name)
    base_count = 0
    lateral_count = 0
    for face in faces:
        zs = [heights[k] for k in face]
        if max(zs)-min(zs) < 1e-8:
            assert len(face) >= 32
            base_count += 1
        else:
            assert len(face) == 4
            rectangle_area([points[k] for k in face])
            lateral_count += 1
    assert base_count == (0 if open_ends else 2), (prefix, base_count)
    assert lateral_count >= 32
    for name in vertices:
        counterpart = add(points[name], mul(axis, 1 if heights[name] < h/2 else -1))
        assert any(distance(counterpart, points[k]) < 2e-8 for k in vertices), name
    assert model.get('smooth') is True
    return radius, h, lateral_count


def actual_model_checks():
    root = Path(__file__).resolve().parents[2]
    folder = root/'stereo-course/textbook/lessons'
    filenames = sorted([p for p in folder.glob('ex-main-03*.json')
                        if 320 <= int(p.stem[8:12]) <= 345]+
                       [folder/'theory-038.json', folder/'theory-039.json'])
    assert len(filenames) == 36, 'all printed parts and two full theory cards'
    cards = {p.stem: json.loads(p.read_text()) for p in filenames}
    models = {key: card['visualization']['model'] for key, card in cards.items()}
    dimensions = {}
    facets = 0
    for key, model in models.items():
        if model.get('planar'):
            assert all(abs(p[2]) < 1e-8 for p in model['points'].values()), key
            rectangle_area([model['points'][k] for k in ['A', 'D', 'C', 'B']])
        else:
            prefixes = ['L', 'R'] if key.startswith('ex-main-0345-') else ['']
            for prefix in prefixes:
                r, h, count = check_cylinder_mesh(model, prefix, key == 'ex-main-0340')
                dimensions[key+prefix] = (r, h)
                facets += count

        # Every authored polygon is coplanar and every highlighted segment has
        # positive length. This also checks all auxiliary vertices, not just rims.
        for name, view in model['views'].items():
            for a, b in view.get('segments', []):
                assert distance(model['points'][a], model['points'][b]) > 1e-9, (key, name)
            polygon = [model['points'][k] for k in view.get('polygon', [])]
            if polygon:
                anchor = polygon[0]
                raw_normal = None
                for i in range(1, len(polygon)-1):
                    candidate = cross(sub(polygon[i], anchor), sub(polygon[i+1], anchor))
                    if norm(candidate) > 1e-9:
                        raw_normal = candidate
                        break
                assert raw_normal is not None, (key, name, 'zero area')
                normal = mul(raw_normal, 1/norm(raw_normal))
                for point in polygon:
                    near(dot(normal, sub(point, anchor)), 0, key+' '+name+' planar overlay')

    exact = {
        '0320': (1.5, 4), '0321-a': (12*math.sqrt(3), 24),
        '0321-b': (12*math.sqrt(3), 24), '0321-c': (12*math.sqrt(3), 24),
        '0322-a': (5*math.sqrt(2), 10*math.sqrt(2)),
        '0322-b': (5*math.sqrt(2), 10*math.sqrt(2)),
        '0324': (math.sqrt(5/math.pi), math.sqrt(5*math.pi)),
        '0325-a': (math.sqrt(3), 2), '0325-b': (math.sqrt(3), 2),
        '0326-a': (10, 5), '0326-b': (5, 6), '0327': (5, 6),
        '0328': (5, 8), '0329': (10, 12), '0330': (15, 10),
        '0331': (4, 6), '0332': (4, 6), '0333': (4, 6),
        '0334': (4/math.sqrt(3), 10*math.sqrt(3)), '0335': (4, 6),
        '0336': (.5, math.pi), '0337': (2, 3.5), '0338': (.75, 3),
        '0339': (1.3, 3.9), '0340': (.1, 4), '0341': (2, 4.8),
        '0344-a': (2, 2), '0344-b': (2, 2), '0344-c': (2, 2),
        '0345-aL': (2.4, 1.6), '0345-aR': (1.6, 2.4),
        '0345-bL': (2.4, 1.6), '0345-bR': (1.6, 2.4),
    }
    for key, (r, h) in exact.items():
        actual_r, actual_h = dimensions['ex-main-'+key]
        near(actual_r, r, key+' model radius')
        near(actual_h, h, key+' model height')
    near(dimensions['theory-038'][0], 2, '38 illustrated radius')
    near(dimensions['theory-038'][1], 3, '38 illustrated height')

    def points(key):
        return models['ex-main-'+key]['points']
    for key in ['0320', '0321-a', '0321-b', '0321-c', '0322-a', '0322-b',
                '0324', '0325-a', '0325-b', '0336', '0337', '0338', '0339',
                '0340', '0341', '0344-a', '0344-b', '0344-c']:
        p = points(key)
        r, h = dimensions['ex-main-'+key]
        near(rectangle_area([p[k] for k in ['A', 'B', 'B1', 'A1']]), 2*r*h,
             key+' axial rectangle and correct boundary')
        near(distance(mul(add(p['A'], p['B']), .5), p['O']), 0, key+' full diameter')

    for key, diagonal in [('0320', 5), ('0321-a', 48), ('0321-b', 48),
                          ('0321-c', 48), ('0322-a', 20), ('0322-b', 20)]:
        p = points(key)
        near(distance(p['A'], p['B1']), diagonal, key+' given/derived diagonal')
    for key in ['0325-a', '0325-b']:
        p = points(key)
        r, h = dimensions['ex-main-'+key]
        near(math.pi*r*r/(2*r*h), math.sqrt(3)*math.pi/4, key+' source ratio')
        near(distance(p['K'], mul(add(p['A'], p['B1']), .5)), 0, key+' diagonal centre')
        near(distance(p['N'], mul(add(p['A'], p['A1']), .5)), 0, key+' middle parallel')
        v, w = sub(p['A'], p['K']), sub(p['A1'], p['K'])
        near(math.acos(dot(v, w)/(norm(v)*norm(w))), math.pi/3, key+' selected acute rays')

    for key, expected_d, expected_length in [('0326-a', 8, 13), ('0326-b', 3, 10)]:
        p = points(key)
        near(distance(p['A'], p['B']), expected_length, key+' source AB')
        foot, axis_foot, t = closest_line_axis(p['A'], p['B'])
        near(t, .5, key+' midpoint common perpendicular')
        near(distance(foot, p['K']), 0, key+' actual K is closest foot')
        near(distance(axis_foot, p['P']), 0, key+' actual P is closest axis foot')
        near(distance(p['K'], p['P']), expected_d, key+' actual line-axis distance')
        near(distance(p['M'], mul(add(p['A'], p['C']), .5)), 0, key+' projected midpoint')
        near(distance(p['C'], (p['B'][0], p['B'][1], 0)), 0, key+' orthogonal projection')
        near(distance(p['M'], p['O']), expected_d, key+' base chord distance')

    for key, expected_offset in [('0327', 3), ('0328', 3), ('0329', 8), ('0330', 9),
                                 ('0332', 2), ('0333', 2), ('0334', 2)]:
        p = points(key)
        r, h = dimensions['ex-main-'+key]
        near(distance(p['M'], p['O']), expected_offset, key+' true axis-plane offset')
        near(distance(p['M'], mul(add(p['A'], p['B']), .5)), 0, key+' chord midpoint')
        near(dot(sub(p['M'], p['O']), sub(p['B'], p['A'])), 0, key+' chord perpendicular')
        near(dot(sub(p['M'], p['O']), sub(p['A1'], p['A'])), 0, key+' second plane direction')
        area = rectangle_area([p[k] for k in ['A', 'B', 'B1', 'A1']])
        near(area, 2*h*math.sqrt(r*r-expected_offset**2), key+' full section area')
        if key in {'0328', '0330', '0334'}:
            near(area, {'0328': 64, '0330': 240, '0334': 40}[key], key+' source area')
        if key in {'0333', '0334'}:
            oa, ob = sub(p['A'], p['O']), sub(p['B'], p['O'])
            near(math.acos(dot(oa, ob)/(norm(oa)*norm(ob))),
                 (2 if key == '0333' else 1)*math.pi/3, key+' source central angle')

    p = points('0331')
    axial = rectangle_area([p[k] for k in ['A', 'B', 'B1', 'A1']])
    other = rectangle_area([p[k] for k in ['A', 'C', 'C1', 'A1']])
    ab, ac = sub(p['B'], p['A']), sub(p['C'], p['A'])
    phi = math.acos(dot(ab, ac)/(norm(ab)*norm(ac)))
    near(axial/other, 1/math.cos(phi), '331 actual ordered area ratio')
    near(dot(sub(p['A'], p['C']), sub(p['B'], p['C'])), 0, '331 actual inscribed right angle')
    p = points('0335')
    first = rectangle_area([p[k] for k in ['A', 'C', 'C1', 'A1']])
    second = rectangle_area([p[k] for k in ['A', 'D', 'D1', 'A1']])
    axial = rectangle_area([p[k] for k in ['C', 'D', 'D1', 'C1']])
    near(first, second, '335 equal actual sections')
    near(dot(sub(p['C'], p['A']), sub(p['D'], p['A'])), 0, '335 actual plane angle')
    near(distance(mul(add(p['C'], p['D']), .5), p['O']), 0, '335 CD true diameter')
    near(axial, first*math.sqrt(2), '335 actual area result')

    for key, dimensions_expected in [('0323', (4, 2)), ('0342', (4, 2.4)), ('0343', (3, 3))]:
        p = points(key)
        w, h = distance(p['A'], p['D']), distance(p['A'], p['B'])
        near(w, dimensions_expected[0], key+' model long side')
        near(h, dimensions_expected[1], key+' model short side')
        near(distance(p['K'], mul(add(p['A'], p['C']), .5)), 0, key+' diagonal centre')
        if key == '0342':
            kc, kd = sub(p['C'], p['K']), sub(p['D'], p['K'])
            phi = math.acos(dot(kc, kd)/(norm(kc)*norm(kd)))
            d = distance(p['A'], p['C'])
            near(w, d*math.cos(phi/2), '342 selected KCD angle corresponds to long side cosine')
            near(h, d*math.sin(phi/2), '342 selected KCD angle corresponds to short side sine')
    p = models['theory-038']['points']
    near(rectangle_area([p[k] for k in ['O', 'B', 'B1', 'O1']]), 6, '38 half axial rotation')
    for key, point in p.items():
        if key.startswith('_mid'):
            near(distance(point, p['K']), 2, '38 perpendicular cross-section true radius')
            near(point[2], 1.5, '38 middle disk plane')
    p = models['theory-039']['points']
    near(distance(p['A'], p['D']), 2*math.pi, '39 net circumference')
    near(distance(p['A'], p['B']), 3, '39 net height')
    for prefix, center in [('_base', 'O'), ('_cap', 'O1')]:
        rim = [v for k, v in p.items() if k.startswith(prefix)]
        assert len(rim) == 64
        for point in rim:
            near(distance(point, p[center]), 1, '39 exact circle radius')
    near(distance(p['O'], p['R']), 1, '39 first radius')
    near(distance(p['O1'], p['R1']), 1, '39 second radius')
    return {'cards': len(cards), 'cylinderComponents': len(dimensions),
            'lateralFacetsChecked': facets, 'modelViews': sum(len(m['views']) for m in models.values()),
            'solutionSteps': sum(len(c['steps']) for c in cards.values())}


if __name__ == '__main__':
    families = parameter_checks()
    boundary = fixed_and_boundary_checks()
    models = actual_model_checks()
    print(json.dumps({'verdict': 'PASS_INDEPENDENT_CYLINDER_SOURCE_MATHEMATICS',
                      'parameterCases': sum(families.values()),
                      'casesByExercise': families, 'fixedAndBoundaryChecks': boundary,
                      'actualModelChecks': models},
                     ensure_ascii=False, indent=2))
