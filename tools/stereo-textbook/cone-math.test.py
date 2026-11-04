#!/usr/bin/env python3
"""Independent Euclidean/source oracle: Atanasyan 2024, IV §2 Cone.

The reviewer independently viewed source PDF96–102 and answer PDF266–267.
No lesson-author helper or authored answer is used to construct the numerical
oracle. Vector products measure triangles, line-plane intersections measure
sections, and surface Jacobians measure smooth (not faceted) lateral areas.
"""
import json
import math
import random
from pathlib import Path


def add(a, b):
    return tuple(x+y for x, y in zip(a, b))


def sub(a, b):
    return tuple(x-y for x, y in zip(a, b))


def mul(a, k):
    return tuple(x*k for x in a)


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
    assert math.isclose(a, b, rel_tol=3e-8, abs_tol=3e-8), (label, a, b)


def angle(a, b):
    return math.acos(max(-1, min(1, dot(a, b)/(norm(a)*norm(b)))))


def triangle(a, b, c):
    return norm(cross(sub(b, a), sub(c, a)))/2


def polygon(points):
    return sum(triangle(points[0], points[i], points[i+1])
               for i in range(1, len(points)-1))


def apex_section(r, h, arc):
    """Plane through apex and chord with a prescribed minor central angle."""
    assert r > 0 and h > 0 and 0 < arc <= math.pi
    p = (0, 0, h)
    a = (r*math.cos(arc/2), -r*math.sin(arc/2), 0)
    b = (a[0], -a[1], 0)
    return p, a, b


def horizontal_section_point(r, h, distance_from_apex, rho, theta):
    """Intersect vertex-to-base-point ray with the plane z=h-distance.

    rho in[0,1] covers the filled base disk, including its centre and rim.
    None denotes an empty section; distance0 gives the degenerate vertex.
    """
    assert r > 0 and h > 0 and 0 <= rho <= 1
    if not 0 <= distance_from_apex <= h:
        return None
    p = (0, 0, h)
    q = (r*rho*math.cos(theta), r*rho*math.sin(theta), 0)
    t = distance_from_apex/h
    return add(p, mul(sub(q, p), t))


def cone_jacobian(r, h, u, theta):
    """X(u,theta)=(u*r*cos(theta),u*r*sin(theta),h*(1-u))."""
    du = (r*math.cos(theta), r*math.sin(theta), -h)
    dt = (-u*r*math.sin(theta), u*r*math.cos(theta), 0)
    return norm(cross(du, dt))


def cone_lateral(r, h):
    # Jacobian is linear in u: exact midpoint integration on[0,1] ×[0,2π].
    return 2*math.pi*cone_jacobian(r, h, .5, .371)


def frustum_jacobian(big, small, h, u, theta):
    radius = big+(small-big)*u
    du = ((small-big)*math.cos(theta), (small-big)*math.sin(theta), h)
    dt = (-radius*math.sin(theta), radius*math.cos(theta), 0)
    return norm(cross(du, dt))


def frustum_lateral(big, small, h):
    assert big > small > 0 and h > 0
    return 2*math.pi*frustum_jacobian(big, small, h, .5, .733)


def parameter_checks():
    rng = random.Random(346371)
    counts = dict.fromkeys([str(n) for n in range(346, 372)], 0)
    for _ in range(120):
        r, h = rng.uniform(.2, 20), rng.uniform(.2, 30)
        p, a, b = apex_section(r, h, math.pi)
        l = distance(p, a)
        near(l*l, r*r+h*h, '346 actual right triangle')
        counts['346'] += 1

        phi = angle(sub(p, a), mul(a, -1))
        near(math.pi*(l*math.cos(phi))**2, math.pi*r*r, '347 projection onto base')
        counts['347'] += 1

        k = rng.uniform(.001, .999)
        q = horizontal_section_point(r, h, h*math.sqrt(k), 1, .821)
        measured_r = math.hypot(q[0], q[1])
        near(measured_r**2/r**2, k, '348 area fraction determines vertex distance')
        counts['348'] += 1

        p, a, b = apex_section(r, r, math.pi)
        near(dot(sub(a, p), sub(b, p)), 0, '349 right apex of isosceles triangle')
        near(triangle(p, a, b), r*r, '349 full axial right triangle')
        counts['349'] += 1

        for theta in [math.pi/6, math.pi/4, math.pi/3]:
            equilateral_h = math.sqrt(3)*r
            # Recover azimuth from the spatial scalar product, independently of area.
            arc = math.acos(max(-1, min(1, 4*math.cos(theta)-3)))
            pp, aa, bb = apex_section(r, equilateral_h, arc)
            near(angle(sub(aa, pp), sub(bb, pp)), theta, '350 true generator angle')
            near(triangle(pp, aa, bb), 2*r*r*math.sin(theta), '350 measured section')
        counts['350'] += 1

        pp, aa, bb = apex_section(math.sqrt(3)*h, h, math.acos(-1/3))
        near(dot(sub(aa, pp), sub(bb, pp)), 0, '351 perpendicular actual generators')
        near(angle(sub(aa, pp), (0, 0, -h)), math.pi/3, '351 generator-axis60')
        near(triangle(pp, aa, bb), 2*h*h, '351 measured perpendicular section')
        counts['351'] += 1

        pp, aa, bb = apex_section(r, h, math.pi)
        axial = triangle(pp, aa, bb)
        near(axial/math.sqrt(math.pi*r*r/math.pi), h, '352 reconstruct height')
        counts['352'] += 1

        for arc in [math.pi/3, math.pi/2]:
            pp, aa, bb = apex_section(r, h, arc)
            expected = r*math.sin(arc/2)*math.sqrt(l*l-r*r*math.sin(arc/2)**2)
            near(triangle(pp, aa, bb), expected, '353 chord altitude from actual vectors')
        counts['353'] += 1

        beta = rng.uniform(.003, math.pi/2-.003)
        rr = 2*h/(math.sqrt(3)*math.tan(beta))
        pp, aa, bb = apex_section(rr, h, math.pi/3)
        m = mul(add(aa, bb), .5)
        normal = cross(sub(aa, pp), sub(bb, pp))
        measured_angle = math.acos(abs(normal[2])/norm(normal))
        near(measured_angle, beta, '354 dihedral from plane normals')
        near(dot(sub(pp, m), sub(bb, aa)), 0, '354 section altitude is normal to chord')
        near(dot(m, sub(bb, aa)), 0, '354 projected altitude is normal to chord')
        near(triangle(pp, aa, bb), h*h*math.cos(beta)/(math.sqrt(3)*math.sin(beta)**2),
             '354 measured area')
        counts['354'] += 1

        t = rng.uniform(.001, .999)
        for rho in [0, rng.uniform(.01, .99), 1]:
            q = horizontal_section_point(r, h, h*t, rho, rng.uniform(-math.pi, math.pi))
            near(q[2], h*(1-t), '355 section plane')
            near(math.hypot(q[0], q[1]), r*t*rho, '355 full disk including interior')
            # Inverse homothety sends EVERY section disk point into the original disk.
            base_preimage = add((0, 0, h), mul(sub(q, (0, 0, h)), 1/t))
            near(base_preimage[2], 0, '355 reverse containment')
            assert math.hypot(*base_preimage[:2]) <= r+1e-8
        counts['355'] += 1

        t2 = rng.uniform(.001, .999)
        q1 = horizontal_section_point(r, h, h*t, 1, 0)
        q2 = horizontal_section_point(r, h, h*t2, 1, 0)
        near(q1[0]**2/q2[0]**2, (h*t)**2/(h*t2)**2, '356 squared vertex distances')
        counts['356'] += 1

        theta = 2*math.pi*r/l
        near(l*theta, 2*math.pi*r, '357 length of net arc equals base circumference')
        near(.5*l*l*theta, cone_lateral(r, h), '357 net versus smooth surface integral')
        counts['357'] += 1
        near(math.degrees(theta), 360*math.cos(phi), '358 generator-base angle')
        counts['358'] += 1
        near(2*math.asin(theta/(2*math.pi)), 2*math.atan2(r, h),
             '359 sector angle versus distinct axial apex angle')
        counts['359'] += 1
        near(math.sqrt(l*l-(l*theta/(2*math.pi))**2), h, '360 recover height from net')
        counts['360'] += 1
        axis_angle = math.atan2(r, h)
        near(cone_lateral(r, h), math.pi*l*l*math.sin(axis_angle), '361 axis angle')
        counts['361'] += 1
        near(math.pi*(axial/h)*(math.hypot(axial/h, h)+axial/h),
             cone_lateral(r, h)+math.pi*r*r, '362 total from axial area')
        counts['362'] += 1

        alpha = rng.uniform(.005, math.pi-.005)
        # A=(-r sinα,r cosα), B=(r sinα,r cosα), C=(0,-r) are on same circle.
        aa, bb, cc = (-r*math.sin(alpha), r*math.cos(alpha), 0), (r*math.sin(alpha), r*math.cos(alpha), 0), (0, -r, 0)
        near(angle(sub(aa, cc), sub(bb, cc)), alpha, '363 genuine inscribed angle, obtuse allowed')
        side = distance(aa, bb)
        expected = math.pi*side*side*(1+math.cos(phi))/(4*math.sin(alpha)**2*math.cos(phi))
        near(cone_lateral(r, h)+math.pi*r*r, expected, '363 sine theorem plus cone surface')
        counts['363'] += 1

        short, long = sorted([r, h])
        near(cone_lateral(long, short), math.pi*long*math.hypot(short, long), '364 rotate around smaller leg')
        counts['364'] += 1
        m, base_angle = rng.uniform(.2, 20), rng.uniform(.002, math.pi/2-.002)
        rr, hh = m*math.sin(base_angle), m*math.cos(base_angle)
        near(2*cone_lateral(rr, hh), 2*math.pi*m*m*math.sin(base_angle), '365 exposed bicone surface only')
        counts['365'] += 1

        small, delta, hh = rng.uniform(.2, 10), rng.uniform(.2, 10), rng.uniform(.2, 15)
        big = small+delta
        aa, bb, cc, dd = (-big, 0, 0), (big, 0, 0), (small, 0, hh), (-small, 0, hh)
        slant = distance(bb, cc)
        near(slant*slant, hh*hh+delta*delta, '366 actual trapezoid slant')
        counts['366'] += 1
        near(polygon([aa, bb, cc, dd]), (big+small)*math.sqrt(slant*slant-delta*delta), '367 actual axial trapezoid')
        counts['367'] += 1
        near(polygon([(-big, 0, 0), (big, 0, 0), (small, 0, delta), (-small, 0, delta)]),
             big*big-small*small, '368 angle45 gives axial trapezoid')
        counts['368'] += 1
        small_surface = cone_lateral(r*t, h*t)
        near(small_surface/cone_lateral(r, h), t*t, '369 smooth area scales quadratically')
        near(frustum_lateral(r, r*t, h*(1-t)), cone_lateral(r, h)-small_surface,
             '369 independently integrated frustum')
        counts['369'] += 1
        near(frustum_lateral(big, small, delta), math.pi*(big+small)*delta*math.sqrt(2), '370 trapezoid45 smooth surface')
        counts['370'] += 1
        one_side = frustum_lateral(big, small, hh)+math.pi*small*small
        near(2*one_side, 2*math.pi*((big+small)*slant+small*small), '371 open bucket two sides, one bottom')
        assert 2*one_side < 2*(one_side+math.pi*big*big)
        counts['371'] += 1
    return counts


def fixed_and_boundary_checks():
    near(distance((0, 0, 15), (8, 0, 0)), 17, '346 source')
    for deg, coefficient in [(30, 108), (45, 72), (60, 36)]:
        near((12*math.cos(math.radians(deg)))**2, coefficient, '347 source')
    near(8*math.sqrt(.5), 4*math.sqrt(2), '348a distance from vertex')
    near(8*math.sqrt(.25), 4, '348b distance from vertex')
    near(triangle(*apex_section(5, 5, math.pi)), 25, '349 source')
    near(6/math.sqrt(8/math.pi), 3*math.sqrt(math.pi/2), '352 source')
    for deg, expected in [(30, 200), (45, 100*math.sqrt(6)/3), (60, 200*math.sqrt(3)/9)]:
        beta = math.radians(deg)
        near(triangle(*apex_section(20/(math.sqrt(3)*math.tan(beta)), 10, math.pi/3)), expected, '354 source')
    near(360*3/5, 216, '357 source')
    near(360*math.cos(math.pi/3), 180, '358 source')
    for sector, sine in [(180, .5), (90, .25), (60, 1/6)]:
        apex = 2*math.asin(sector/360)
        near(math.sin(apex/2), sine, '359 inverse sine exact input')
    near(2*math.asin(.5), math.pi/3, '359a exact60')
    assert not math.isclose(2*math.asin(.25), math.pi/6, rel_tol=1e-3)
    assert not math.isclose(2*math.asin(1/6), math.pi/9, rel_tol=1e-3)
    near(9*120/360, 3, '360 source radius')
    near(math.sqrt(81-9), 6*math.sqrt(2), '360 source height')
    near(cone_lateral(6.5/math.sqrt(2), 6.5/math.sqrt(2)), 169*math.sqrt(2)*math.pi/8, '361 source')
    near(cone_lateral(.5, 1.2)+math.pi*.25, .9*math.pi, '362 source')
    near(cone_lateral(8, 6), 80*math.pi, '364 source lateral')
    near(cone_lateral(8, 6)+64*math.pi, 144*math.pi, '364 source total')
    near(math.hypot(6-3, 4), 5, '366 source')
    near(math.sqrt(100-36), 8, '367a source')
    near(polygon([(-11, 0, 0), (11, 0, 0), (5, 0, 8), (-5, 0, 8)]), 128, '367b source')
    near(80*(1-.5**2), 60, '369 source')
    near(frustum_lateral(7, 4, 3), 33*math.sqrt(2)*math.pi, '370 source CD3sqrt2')
    near(frustum_lateral(7, 4, 3)+math.pi*(49+16), math.pi*(65+33*math.sqrt(2)), '370 source total')
    bucket_h = math.sqrt(30**2-5**2)
    paint_m2 = 2*100*(frustum_lateral(15, 10, bucket_h)+math.pi*10**2)/10000
    near(paint_m2*.150, 2.55*math.pi, '371 cm2→m2, both sides100buckets,150g→kg')

    for r, h in [(.001, 100), (100, .001), (1, 1)]:
        p = horizontal_section_point(r, h, 0, .5, 1)
        near(distance(p, (0, 0, h)), 0, '355 vertex degeneration is point')
        q = horizontal_section_point(r, h, h, 1, 0)
        near(distance(q, (0, 0, 0)), r, '355 base endpoint')
        assert horizontal_section_point(r, h, -h*.001, 1, 0) is None
        assert horizontal_section_point(r, h, h*1.001, 1, 0) is None
        near(triangle(*apex_section(r, h, math.pi)), r*h, 'diametric chord gives full axial section')
        assert 0 < 360*r/math.hypot(r, h) < 360
        near(cone_jacobian(r, h, 0, 0), 0, 'smooth apex zero Jacobian')
    for invalid in [0, -1, math.pi+.1]:
        try:
            apex_section(1, 2, invalid)
        except AssertionError:
            pass
        else:
            raise AssertionError('invalid minor chord angle accepted')
    return 'PASS exact source values, inverse angles, disk interiors/endpoints/empty planes, proper cones, open bucket units'


def plane_check(points, label):
    """Find a genuine plane without assuming the first three vertices differ."""
    assert len(points) >= 3, label
    base = points[0]
    raw = next((cross(sub(points[i], base), sub(points[j], base))
                for i in range(1, len(points)) for j in range(i+1, len(points))
                if norm(cross(sub(points[i], base), sub(points[j], base))) > 1e-10), None)
    assert raw is not None, (label, 'zero-area polygon')
    normal = mul(raw, 1/norm(raw))
    for p in points:
        near(dot(sub(p, base), normal), 0, label+' coplanarity')


def check_cone_mesh(model, label):
    p = model['points']
    origin, apex = p['O'], p['P']
    axis = sub(apex, origin)
    h = norm(axis)
    assert h > 0
    n = mul(axis, 1/h)
    vertices = set().union(*(set(face) for face in model['faces']))
    rim = vertices-{'P'}
    assert len(rim) >= 32, label
    radii = []
    for name in rim:
        q = sub(p[name], origin)
        near(dot(q, n), 0, label+' every mesh rim point in base plane')
        radii.append(norm(q))
    r = radii[0]
    assert r > 0
    for measured in radii:
        near(measured, r, label+' every mesh rim point on true circle')
    bases, facets = 0, 0
    for face in model['faces']:
        if 'P' in face:
            assert len(face) == 3, (label, face)
            assert triangle(*(p[k] for k in face)) > 1e-12
            facets += 1
        else:
            assert len(face) >= 32
            bases += 1
    assert bases == 1 and facets == len(rim), (label, bases, facets, len(rim))
    assert model.get('smooth') is True
    for name in rim:
        near(distance(p[name], apex), math.hypot(r, h), label+' equal true generators')
    return r, h, facets


def check_frustum_mesh(model, label, open_large=False, centres=('O', 'O1')):
    p = model['points']
    origin, top = p[centres[0]], p[centres[1]]
    axis = sub(top, origin)
    h = norm(axis)
    assert h > 0
    n = mul(axis, 1/h)
    vertices = set().union(*(set(face) for face in model['faces']))
    levels = {0: [], 1: []}
    for name in vertices:
        offset = sub(p[name], origin)
        height = dot(offset, n)
        level = 0 if abs(height) < 1e-8 else 1
        near(height, h*level, label+' frustum parallel rim planes')
        levels[level].append((name, norm(sub(offset, mul(n, height)))))
    radii = [levels[k][0][1] for k in [0, 1]]
    for level in [0, 1]:
        assert len(levels[level]) >= 32
        for name, radius in levels[level]:
            near(radius, radii[level], label+' frustum exact circular rim '+name)
    assert radii[0] > 0 and radii[1] > 0 and radii[0] != radii[1]
    bases, facets = [], 0
    for face in model['faces']:
        heights = [dot(sub(p[k], origin), n) for k in face]
        if max(heights)-min(heights) < 1e-8:
            assert len(face) >= 32
            bases.append(0 if abs(heights[0]) < 1e-8 else 1)
        else:
            assert len(face) == 4
            plane_check([p[k] for k in face], label+' frustum facet')
            facets += 1
    small_level = 0 if radii[0] < radii[1] else 1
    assert sorted(bases) == ([small_level] if open_large else [0, 1]), (label, bases)
    assert facets >= 32 and model.get('smooth') is True
    # Corresponding generators must have no twist between the two circles.
    for name, radius in levels[0]:
        q = sub(p[name], origin)
        target = add(top, mul(q, radii[1]/radii[0]))
        assert any(distance(target, p[k]) < 1e-8 for k, _ in levels[1]), (label, name)
    return radii[0], radii[1], h, facets


def actual_model_checks():
    root = Path(__file__).resolve().parents[2]
    folder = root/'stereo-course/textbook/lessons'
    files = sorted([p for p in folder.glob('ex-main-03*.json')
                    if 346 <= int(p.stem[8:12]) <= 371]+
                   [folder/f'theory-{n:03d}.json' for n in [40, 41, 42]])
    assert len(files) == 40, 'all37exercise parts and three full theory cards'
    cards = {p.stem: json.loads(p.read_text()) for p in files}
    models = {key: card['visualization']['model'] for key, card in cards.items()}
    dimensions, frustums = {}, {}
    facets = 0
    for key, model in models.items():
        points = model['points']
        face_adjacencies = {frozenset((face[i], face[(i+1) % len(face)]))
                            for face in model['faces'] for i in range(len(face))}
        for edge in model['edges']:
            assert frozenset(edge) in face_adjacencies, (key, 'mesh edge lacks face adjacency', edge)
        for face in model['faces']:
            plane_check([points[k] for k in face], key+' actual mesh face')
        for name, view in model['views'].items():
            for a, b in view.get('segments', []):
                assert distance(points[a], points[b]) > 1e-9, (key, name, a, b)
            if view.get('polygon'):
                plane_check([points[k] for k in view['polygon']], key+' view '+name)
        if key == 'theory-041':
            assert model.get('planar') is True
            assert all(abs(p[2]) < 1e-8 for p in points.values())
        elif key == 'ex-main-0365':
            # The two tips lie on opposite sides of the common centre along AB.
            # The check is invariant under any proper rotation of the model.
            # The shared equatorial disk
            # belongs to the solid's interior and must not be an exposed face.
            a, b, o, c = [points[k] for k in ['A', 'B', 'O', 'C']]
            near(distance(o, mul(add(a, b), .5)), 0, '365 shared centre midpoint')
            axis = sub(b, a)
            n = mul(axis, 1/norm(axis))
            r, h = distance(c, o), distance(a, o)
            vertices = set().union(*(set(face) for face in model['faces']))
            rim = vertices-{'A', 'B'}
            assert len(rim) >= 32
            for k in rim:
                near(dot(sub(points[k], o), n), 0, '365 shared ring plane')
                near(distance(points[k], o), r, '365 true shared circle')
                near(distance(points[k], a), math.hypot(r, h), '365 first generator')
                near(distance(points[k], b), math.hypot(r, h), '365 second generator')
            for face in model['faces']:
                assert len(face) == 3 and (('A' in face) != ('B' in face)), ('365 exposed face', face)
            assert len(model['faces']) == 2*len(rim)
            assert model.get('smooth') is True
            dimensions[key] = (r, h)
            facets += len(model['faces'])
        elif key.startswith(('ex-main-0366', 'ex-main-0367', 'ex-main-0368', 'ex-main-0370', 'ex-main-0371')) or key == 'theory-042':
            R, r, h, count = check_frustum_mesh(model, key, key == 'ex-main-0371',
                                               ('A', 'B') if key == 'ex-main-0370' else ('O', 'O1'))
            frustums[key] = (R, r, h)
            facets += count
        else:
            r, h, count = check_cone_mesh(model, key)
            dimensions[key] = (r, h)
            facets += count

    def p(key):
        return models['ex-main-'+key]['points']

    def dim(key):
        return dimensions['ex-main-'+key]

    exact = {'0346': (8, 15), '0349': (5, 5), '0352': (math.sqrt(8/math.pi), 6/math.sqrt(8/math.pi)),
             '0357': (3, 4), '0360': (3, 6*math.sqrt(2)),
             '0361': (6.5/math.sqrt(2), 6.5/math.sqrt(2)), '0362': (.5, 1.2), '0364': (8, 6)}
    for suffix, degrees in [('a', 30), ('b', 45), ('c', 60)]:
        exact['0347-'+suffix] = (12*math.cos(math.radians(degrees)), 12*math.sin(math.radians(degrees)))
        exact['0354-'+suffix] = (20/(math.sqrt(3)*math.tan(math.radians(degrees))), 10)
    for key, expected in exact.items():
        actual = dim(key)
        for a, b in zip(actual, expected):
            near(a, b, key+' source-determined model dimensions')

    # Every named base chord and its midpoint are genuine constructions, not
    # just arbitrary auxiliary points lying near the intended figure.
    for key, (r, h) in dimensions.items():
        if key == 'ex-main-0365':
            continue
        q = models[key]['points']
        near(distance(q['A'], q['O']), r, key+' chord endpoint A on circle')
        near(distance(q['B'], q['O']), r, key+' chord endpoint B on circle')
        if key != 'ex-main-0355':
            near(distance(q['M'], mul(add(q['A'], q['B']), .5)), 0, key+' chord midpoint M')
            near(dot(sub(q['B'], q['A']), sub(q['M'], q['O'])), 0, key+' midpoint perpendicular')
        near(distance(q['D'], q['E']), 2*r, key+' full axial diameter')

    for suffix, fraction in [('a', .5), ('b', .25)]:
        key = '0348-'+suffix
        r, h = dim(key)
        near(h, 8, key+' source height')
        q = p(key)
        d = distance(q['P'], q['O1'])
        near(d, 8*math.sqrt(fraction), key+' requested distance from vertex')
        cut = [point for name, point in q.items() if name.startswith('_slice')]
        assert len(cut) >= 32
        for point in cut:
            near(point[2], q['O1'][2], key+' section plane')
            near(distance(point, q['O1'])**2/r**2, fraction, key+' section area fraction')

    for suffix, theta in [('a', math.pi/6), ('b', math.pi/4), ('c', math.pi/3)]:
        key = '0350-'+suffix
        r, h = dim(key)
        q = p(key)
        near(h, math.sqrt(3)*r, key+' equilateral axial section')
        near(angle(sub(q['A'], q['P']), sub(q['B'], q['P'])), theta, key+' source generator angle')
        near(triangle(q['P'], q['A'], q['B']), 2*r*r*math.sin(theta), key+' measured section area')
        if suffix == 'c':
            assert distance(q['M'], q['O']) < 1e-12, '350c maximum generator angle is exactly axial'
    q = p('0351')
    r, h = dim('0351')
    near(r, math.sqrt(3)*h, '351 height-generator60')
    near(dot(sub(q['A'], q['P']), sub(q['B'], q['P'])), 0, '351 perpendicular selected generators')
    near(triangle(q['P'], q['A'], q['B']), 2*h*h, '351 actual section area')

    for suffix, arc in [('a', math.pi/3), ('b', math.pi/2)]:
        key = '0353-'+suffix
        q = p(key)
        r, h = dim(key)
        l = math.hypot(r, h)
        near(angle(sub(q['A'], q['O']), sub(q['B'], q['O'])), arc, key+' source base arc')
        near(triangle(q['P'], q['A'], q['B']),
             r*math.sin(arc/2)*math.sqrt(l*l-r*r*math.sin(arc/2)**2), key+' independent cross-product area')

    for suffix, beta in [('a', math.pi/6), ('b', math.pi/4), ('c', math.pi/3)]:
        key = '0354-'+suffix
        q = p(key)
        near(angle(sub(q['A'], q['O']), sub(q['B'], q['O'])), math.pi/3, key+' arc60')
        near(dot(sub(q['P'], q['M']), sub(q['B'], q['A'])), 0, key+' actual section altitude')
        normal = cross(sub(q['A'], q['P']), sub(q['B'], q['P']))
        near(math.acos(abs(normal[2])/norm(normal)), beta, key+' actual dihedral')
        near(angle(sub(q['P'], q['M']), sub(q['O'], q['M'])), beta, key+' displayed linear angle')

    def cut_check(key, centre, prefix, expected_t, endpoint=None, original=None):
        model = models[key]
        q = model['points']
        r, h = dimensions[key]
        t = distance(q['P'], q[centre])/h
        near(t, expected_t, key+' actual section position')
        ring = [value for name, value in q.items() if name.startswith(prefix)]
        assert len(ring) >= 32
        for point in ring:
            near(point[2], q[centre][2], key+' all section points in plane')
            near(distance(point, q[centre]), r*t, key+' all section points at true radius')
            near(distance(point, q['P']), math.hypot(r, h)*t, key+' section rim on cone surface')
        if endpoint:
            near(distance(q[endpoint], q[centre]), r*t, key+' named section endpoint')
            if original:
                target = add(q['P'], mul(sub(q[original], q['P']), t))
                near(distance(target, q[endpoint]), 0, key+' named endpoint lies on exact generator')

    cut_check('ex-main-0355', 'O1', '_cut', .55, 'M1', 'M')
    q = p('0355')
    near(distance(q['M'], q['O']), dim('0355')[0], '355 M is a boundary point, not chord midpoint')
    near(distance(q['X1'], add(q['P'], mul(sub(q['X'], q['P']), .55))), 0, '355 true interior homothety')
    assert 0 < distance(q['X'], q['O']) < dim('0355')[0]
    assert 0 < distance(q['X1'], q['O1']) < distance(q['M1'], q['O1'])
    cut_check('ex-main-0356', 'O1', '_uppercut', .35, 'M1')
    cut_check('ex-main-0356', 'O2', '_lowercut', .7, 'M2')
    q = p('0356')
    near(norm(cross(sub(q['M1'], q['P']), sub(q['M2'], q['P']))), 0, '356 common selected generator')
    near(distance(q['M1'], q['O1'])**2/distance(q['M2'], q['O2'])**2,
         distance(q['P'], q['O1'])**2/distance(q['P'], q['O2'])**2, '356 actual ordered area ratio')

    for key, sector in [('0357', 216), ('0358', 180), ('0359-a', 180),
                        ('0359-b', 90), ('0359-c', 60), ('0360', 120)]:
        q = p(key)
        r, h = dim(key)
        l = distance(q['P'], q['B'])
        near(360*r/l, sector, key+' true net angle from actual cone')
        if key.startswith('0359'):
            near(angle(sub(q['A'], q['P']), sub(q['B'], q['P'])),
                 2*math.asin(sector/360), key+' actual full axial apex angle')
    q = p('0361')
    near(angle(sub(q['B'], q['P']), sub(q['O'], q['P'])), math.pi/4, '361 actual axis-generator angle')
    q = p('0362')
    near(triangle(q['P'], q['A'], q['B']), .6, '362 exact source axial area')

    q = p('0363')
    r, h = dim('0363')
    for name in ['A', 'B', 'C']:
        near(distance(q[name], q['O']), r, '363 actual inscribed vertex '+name)
    side = distance(q['A'], q['B'])
    alpha = angle(sub(q['A'], q['C']), sub(q['B'], q['C']))
    phi = angle(sub(q['P'], q['E']), sub(q['O'], q['E']))
    near(side/math.sin(alpha), 2*r, '363 actual sine theorem')
    expected = math.pi*side*side/(4*math.sin(alpha)**2)*(1+1/math.cos(phi))
    near(cone_lateral(r, h)+math.pi*r*r, expected, '363 actual total surface')
    assert 0 < alpha < math.pi and 0 < phi < math.pi/2
    q = p('0364')
    near(distance(q['P'], q['O']), 6, '364 smaller leg is rotation axis')
    near(distance(q['O'], q['E']), 8, '364 other leg is radius, not diameter')
    near(distance(q['P'], q['E']), 10, '364 source hypotenuse')
    q = p('0365')
    r, h = dim('0365')
    m = distance(q['A'], q['C'])
    phi = angle(sub(q['C'], q['A']), sub(q['B'], q['A']))
    near(r, m*math.sin(phi), '365 actual triangle base angle')
    near(2*cone_lateral(r, h), 2*math.pi*m*m*math.sin(phi), '365 two exposed surfaces, no shared disk')

    for key, expected in [('0366', (6, 3, 4)), ('0367-a', (11, 5, 8)),
                          ('0367-b', (11, 5, 8)), ('0368', (3, 1, 2)),
                          ('0370', (7, 4, 3)), ('0371', (10, 15, math.sqrt(875)))]:
        values = frustums['ex-main-'+key]
        for actual, wanted in zip(values, expected):
            near(actual, wanted, key+' actual source frustum dimension')
        if key == '0370':
            continue
        q = p(key)
        lower, upper, h = values
        near(distance(q['B'], q['B1']), math.hypot(lower-upper, h), key+' true generator')
        near(distance(q['H'], (q['B1'][0], q['B1'][1], q['O'][2])), 0, key+' true projection H')
        near(dot(sub(q['B1'], q['H']), sub(q['B'], q['H'])), 0, key+' right auxiliary triangle')
        near(polygon([q[k] for k in ['A', 'B', 'B1', 'A1']]), (lower+upper)*h, key+' actual full axial trapezoid')
    q = p('0368')
    near(angle(sub(q['B1'], q['B']), sub(q['H'], q['B'])), math.pi/4, '368 source generator-base45')
    q = p('0369')
    r, h = dim('0369')
    near(cone_lateral(r, h), 80, '369 actual source lateral80')
    cut_check('ex-main-0369', 'O1', '_cut', .5, 'E1', 'E')
    near(distance(q['D1'], add(q['P'], mul(sub(q['D'], q['P']), .5))), 0, '369 second half generator')
    near(frustum_lateral(r, r/2, h/2), 60, '369 actual remaining lateral area')
    q = p('0370')
    near(distance(q['C'], q['D']), 3*math.sqrt(2), '370 source radical CD')
    near(angle(sub(q['C'], q['D']), sub(q['A'], q['D'])), math.pi/4, '370 source angle D')
    near(dot(sub(q['B'], q['A']), sub(q['D'], q['A'])), 0, '370 source right angle A')
    near(norm(cross(sub(q['D'], q['A']), sub(q['C'], q['B']))), 0, '370 bases AD parallel BC')
    near(distance(q['K'], (q['C'][0], q['C'][1], q['A'][2])), 0, '370 true projection K')
    near(distance(q['A'], q['K']), 4, '370 rectangle AK equals BC')
    near(distance(q['K'], q['D']), 3, '370 true radius difference')
    near(distance(p('0371')['B'], p('0371')['B1']), 30, '371 source slant30')

    q = models['theory-040']['points']
    near(dimensions['theory-040'][0], 3, '40 illustrated radius')
    near(dimensions['theory-040'][1], 4, '40 illustrated height')
    cut_check('theory-040', 'O1', '_cut', .5, 'E1', 'E')
    for prefix, end in [('_d', 'D'), ('_e', 'E')]:
        for suffix in ['lo', 'hi']:
            near(norm(cross(sub(q[prefix+suffix], q['P']), sub(q[end], q['P']))), 0,
                 '40 extended conical-surface generatrix really collinear')
        assert q[prefix+'lo'][2] < 0 and q[prefix+'hi'][2] > 4
    q = models['theory-041']['points']
    net = models['theory-041']
    assert len(net['faces']) == 2
    sector = next(face for face in net['faces'] if 'P' in face)
    assert sector[0] == 'P' and sector[1] == 'A' and sector[-1] == 'A1'
    arc_points = [q[name] for name in sector[1:]]
    sweep = 0
    for point in arc_points:
        near(distance(point, q['P']), 5, '41 every sector arc point at slant radius5')
    for a, b in zip(arc_points, arc_points[1:]):
        va, vb = sub(a, q['P']), sub(b, q['P'])
        da = math.atan2(cross(va, vb)[2], dot(va, vb))
        assert 0 < da < math.pi/2, '41 ordered sector arc, not complementary minor sector'
        sweep += da
    near(math.degrees(sweep), 216, '41 actual major sector angle216')
    near(5*sweep, 2*math.pi*3, '41 exact arc length matches base circumference')
    near(5*5*sweep/2, cone_lateral(3, 4), '41 exact smooth/net area identity')
    disk = next(face for face in net['faces'] if 'P' not in face)
    assert len(disk) >= 32
    for name in disk:
        near(distance(q[name], q['O']), 3, '41 true base radius3')
    near(distance(q['O'], q['B']), 3, '41 labelled base radius')
    R, r, h = frustums['theory-042']
    near(R, 3, '42 illustrated larger radius')
    near(r, 1, '42 illustrated smaller radius')
    near(h, 3, '42 illustrated height')
    q = models['theory-042']['points']
    near(distance(q['P'], q['O']), 4.5, '42 complete cone apex')
    near(norm(cross(sub(q['B1'], q['P']), sub(q['B'], q['P']))), 0, '42 shared original generator')
    near(distance(q['P'], q['B1'])/distance(q['P'], q['B']), r/R, '42 actual similar triangles')
    near(frustum_lateral(R, r, h), cone_lateral(R, 4.5)-cone_lateral(r, 1.5),
         '42 independent surface subtraction')
    return {'cards': len(cards), 'coneOrBiconeModels': len(dimensions),
            'frustumModels': len(frustums), 'planarNetModels': 1,
            'lateralFacetsChecked': facets,
            'modelViews': sum(len(m['views']) for m in models.values()),
            'solutionSteps': sum(len(c['steps']) for c in cards.values())}


if __name__ == '__main__':
    families = parameter_checks()
    boundary = fixed_and_boundary_checks()
    models = actual_model_checks()
    print(json.dumps({'verdict': 'PASS_INDEPENDENT_CONE_SOURCE_MATHEMATICS',
                      'parameterCases': sum(families.values()),
                      'casesByExercise': families, 'fixedAndBoundaryChecks': boundary,
                      'actualModelChecks': models}, ensure_ascii=False, indent=2))
