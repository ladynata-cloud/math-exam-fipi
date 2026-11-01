#!/usr/bin/env python3
"""Independent source/Euclidean oracle for Atanasyan 2024 IV §3 Sphere.

The reviewer inspected the actual printed pages 100–111 (PDF 102–113) and
recomputed the source PDF SHA256. Expectations below come from that source,
not a lesson generator. No authored answer or renderer helper is imported.
Vector projections measure real lesson coordinates; smooth area is checked
by a surface Jacobian rather than the area of a faceted picture.
"""
import copy
import json
import math
import random
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SOURCE_SHA256 = 'bead97a383e438b32b9caaff72d61d27e8fa6cd20c6b86a5f234bc4cdb629770'
PARTS = {
    372: ('a', 'b'), 373: ('a', 'b', 'c', 'd'), 374: ('',),
    375: ('',), 376: ('',), 377: ('',), 378: ('',), 379: ('',),
    380: ('',), 381: ('a', 'b', 'c', 'd'), 382: ('a', 'b'),
    383: ('a', 'b'), 384: ('a', 'b'), 385: ('',), 386: ('',),
    387: ('',), 388: ('a', 'b', 'c', 'd'), 389: ('',), 390: ('',),
    391: ('',), 392: ('',), 393: ('',), 394: ('',), 395: ('',),
}
CYRILLIC_PART = dict(zip('abcd', 'абвг'))
THEORY_PAGES = {
    43: [100], 44: [101, 102], 45: [102, 103], 46: [103],
    47: [104, 105], 48: [105], 49: [106], 50: [107, 108],
    51: [108, 109],
}
THEORY_TITLES = {
    43: 'Сфера и шар', 44: 'Взаимное расположение сферы и плоскости',
    45: 'Касательная плоскость к сфере', 46: 'Площадь сферы',
    47: 'Взаимное расположение сферы и прямой',
    48: 'Сфера, вписанная в цилиндрическую поверхность',
    49: 'Сфера, вписанная в коническую поверхность',
    50: 'Сечения цилиндрической поверхности', 51: 'Сечения конической поверхности',
}
EXPECTED_IDS = {
    'ex-main-%04d%s' % (n, '-'+part if part else '')
    for n, parts in PARTS.items() for part in parts
} | {'theory-%03d' % n for n in THEORY_PAGES}


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


def unit(a):
    length = norm(a)
    assert length > 1e-12, ('nonzero direction', a)
    return mul(a, 1/length)


def near(a, b, label):
    assert math.isfinite(a) and math.isfinite(b), (label, 'finite', a, b)
    assert math.isclose(a, b, rel_tol=4e-8, abs_tol=4e-8), (label, a, b)


def same_point(a, b, label):
    near(distance(a, b), 0, label)


def plane(points, label):
    assert len(points) >= 3, (label, 'at least three plane points')
    origin = points[0]
    normal = next((cross(sub(points[i], origin), sub(points[j], origin))
                   for i in range(1, len(points))
                   for j in range(i+1, len(points))
                   if norm(cross(sub(points[i], origin), sub(points[j], origin))) > 1e-10), None)
    assert normal is not None, (label, 'noncollinear plane points')
    normal = unit(normal)
    for point in points:
        near(dot(sub(point, origin), normal), 0, label+' coplanarity')
    return origin, normal


def foot_to_plane(point, origin, normal):
    normal = unit(normal)
    return sub(point, mul(normal, dot(sub(point, origin), normal)))


def foot_to_line(point, a, b):
    v = sub(b, a)
    assert dot(v, v) > 1e-20
    return add(a, mul(v, dot(sub(point, a), v)/dot(v, v)))


def triangle_area(a, b, c):
    return norm(cross(sub(b, a), sub(c, a)))/2


def triangle_incircle(a, b, c):
    aa, bb, cc = distance(b, c), distance(a, c), distance(a, b)
    perimeter = aa+bb+cc
    assert perimeter > 0
    center = mul(add(add(mul(a, aa), mul(b, bb)), mul(c, cc)), 1/perimeter)
    return center, 2*triangle_area(a, b, c)/perimeter


def circumcircle(a, b, c):
    u, v = sub(b, a), sub(c, a)
    n = cross(u, v)
    assert dot(n, n) > 1e-20
    offset = mul(add(mul(cross(v, n), dot(u, u)),
                     mul(cross(n, u), dot(v, v))), 1/(2*dot(n, n)))
    center = add(a, offset)
    return center, distance(center, a)


def sphere_plane(center, radius, origin, normal):
    """Return the exact section type, center projection and radius squared."""
    assert radius > 0 and math.isfinite(radius)
    normal = unit(normal)
    signed = dot(sub(center, origin), normal)
    projection = sub(center, mul(normal, signed))
    difference = radius*radius-signed*signed
    tolerance = 1e-10*max(1, radius*radius, signed*signed)
    kind = 'circle' if difference > tolerance else 'point' if difference >= -tolerance else 'empty'
    return kind, projection, max(0, difference)


def sphere_line(center, radius, a, b):
    """Solve the actual line/sphere quadratic without a diagram assumption."""
    assert radius > 0
    v, w = sub(b, a), sub(a, center)
    aa, bb, cc = dot(v, v), 2*dot(w, v), dot(w, w)-radius*radius
    assert aa > 1e-20
    discriminant = bb*bb-4*aa*cc
    tolerance = 1e-10*max(1, bb*bb, abs(4*aa*cc))
    if discriminant < -tolerance:
        return []
    if abs(discriminant) <= tolerance:
        return [add(a, mul(v, -bb/(2*aa)))]
    delta = math.sqrt(discriminant)
    return [add(a, mul(v, (-bb-sign*delta)/(2*aa))) for sign in (1, -1)]


def smooth_sphere_area(radius):
    """Integrate |X_azimuth × X_polar| with Simpson's rule, not a mesh."""
    assert radius > 0
    n = 256
    step = math.pi/n
    values = []
    for i in range(n+1):
        polar = i*step
        azimuth = .731
        da = (-radius*math.sin(polar)*math.sin(azimuth),
              radius*math.sin(polar)*math.cos(azimuth), 0)
        dp = (radius*math.cos(polar)*math.cos(azimuth),
              radius*math.cos(polar)*math.sin(azimuth), -radius*math.sin(polar))
        values.append(norm(cross(da, dp)))
    integral = step/3*(values[0]+values[-1]+4*sum(values[1:-1:2])+2*sum(values[2:-1:2]))
    return 2*math.pi*integral


def cone_quadratic(theta, phi, h):
    slope = math.tan(theta)
    ss, cc = math.sin(phi), math.cos(phi)
    return (ss*ss-slope*slope*cc*cc,
            h*ss*cc*(1+slope*slope),
            h*h*(cc*cc-slope*slope*ss*ss))


def cone_plane_point(phi, h, u, v):
    return (h*math.cos(phi)-u*math.sin(phi), v,
            h*math.sin(phi)+u*math.cos(phi))


def parameter_checks():
    rng = random.Random(372395)
    counts = dict.fromkeys([str(n) for n in range(372, 396)]+[str(n) for n in range(43, 52)], 0)
    for _ in range(100):
        R = rng.uniform(.3, 30)
        d = rng.uniform(.01, .99)*R
        r = math.sqrt(R*R-d*d)
        o, m = (0, 0, 0), (0, 0, d)
        a, b = (-r, 0, d), (r, 0, d)
        near(distance(o, a), R, '372 equal sphere radii')
        same_point(m, mul(add(a, b), .5), '372 actual midpoint')
        near(dot(sub(m, o), sub(b, a)), 0, '372 midpoint perpendicular')
        counts['372'] += 1
        near(math.sqrt(R*R-(distance(a, b)/2)**2), distance(o, m), '373 recover center distance')
        counts['373'] += 1
        near(distance(o, foot_to_line(o, a, b)), math.sqrt(R*R-distance(a, b)**2/4), '374 true line distance')
        counts['374'] += 1
        kind, center, rr = sphere_plane(o, R, m, (0, 0, 1))
        assert kind == 'circle'
        near(math.pi*rr, math.pi*r*r, '375 true filled disk area')
        counts['375'] += 1
        aa, bb = rng.uniform(.2, 10), rng.uniform(.2, 10)
        vertices = ((0, 0, d), (aa, 0, d), (0, bb, d))
        cc, cr = circumcircle(*vertices)
        near(cr, math.hypot(aa, bb)/2, '376 independently found right-triangle circumradius')
        counts['376'] += 1
        rectangle = ((-aa, -bb, d), (aa, -bb, d), (aa, bb, d), (-aa, bb, d))
        near(distance(rectangle[0], rectangle[2])/2, math.hypot(aa, bb), '377 actual diagonal/circumradius')
        counts['377'] += 1
        triangle = ((-6, 0, d), (6, 0, d), (0, 8, d))
        inc, ir = triangle_incircle(*triangle)
        near(ir, 3, '378 independent incircle')
        for p, q in zip(triangle, triangle[1:]+triangle[:1]):
            near(distance(inc, foot_to_line(inc, p, q)), ir, '378 each finite side tangent')
        counts['378'] += 1
        triangle = ((0, 0, d), (14, 0, d), (5, 12, d))
        inc, ir = triangle_incircle(*triangle)
        near(ir, 4, '379 Heron geometry without authored calculation')
        counts['379'] += 1
        rhombus = ((7.5, 0, d), (0, 10, d), (-7.5, 0, d), (0, -10, d))
        near(distance((0, 0, d), foot_to_line((0, 0, d), rhombus[0], rhombus[1])), 6, '380 true rhombus inscribed radius')
        counts['380'] += 1
        for factor, expected in ((.5, 'circle'), (1, 'point'), (1.5, 'empty')):
            assert sphere_plane(o, R, (0, 0, R*factor), (0, 0, 2))[0] == expected
        counts['381'] += 1
        disk_area = math.pi*r*r
        near(math.sqrt(d*d+disk_area/math.pi), R, '382 recover sphere from disk area')
        counts['382'] += 1
        near(math.sqrt(R*R-R*R/4), math.sqrt(3)*R/2, '383 middle-radius section')
        counts['383'] += 1
        alpha = rng.uniform(.05, math.pi/2-.05)
        section_point, normal = (R, 0, 0), (math.sin(alpha), 0, math.cos(alpha))
        kind, center, rr = sphere_plane(o, R, section_point, normal)
        near(math.sqrt(rr), R*math.cos(alpha), '384 angle from radius to secant plane')
        counts['384'] += 1
        phi = rng.uniform(.05, math.pi/2-.05)
        kind, center, rr = sphere_plane(o, R, (0, 0, R), (math.sin(phi), 0, math.cos(phi)))
        near(math.pi*rr, math.pi*R*R*math.sin(phi)**2, '385 angle between tangent and secant planes')
        counts['385'] += 1
        aa = rng.uniform(.1, 30)
        wedge_center, edge = (aa, 0, 0), (0, 0, 0)
        contacts = [foot_to_line(wedge_center, edge, (math.cos(t), math.sin(t), 0)) for t in (-math.pi/3, math.pi/3)]
        near(distance(wedge_center, contacts[0]), math.sqrt(3)*aa/2, '386 true distance to wedge face')
        near(distance(*contacts), math.sqrt(3)*aa/2, '386 actual contact chord')
        counts['386'] += 1
        tangential = rng.uniform(.1, 30)
        external = (tangential, 0, R)
        nearest = mul(external, R/norm(external))
        near(distance(external, nearest), math.hypot(R, tangential)-R, '387 nearest point lies on radial ray')
        counts['387'] += 1
        near(smooth_sphere_area(R), 4*math.pi*R*R, '388 smooth surface integral')
        counts['388'] += 1
        near(smooth_sphere_area(R)/(math.pi*R*R), 4, '389 four great-disk areas')
        counts['389'] += 1
        near(math.sqrt(smooth_sphere_area(R)/(4*math.pi)), R, '390 inverse of analytic area')
        counts['390'] += 1
        R2 = rng.uniform(.3, 30)
        near(smooth_sphere_area(R)/smooth_sphere_area(R2), (R/R2)**2, '391 radius square scaling')
        counts['391'] += 1
        near(math.sqrt(smooth_sphere_area(R)/math.pi), 2*R, '392 equal-area disk radius')
        counts['392'] += 1
        small, large, gap = 9, 12, 3
        farther = ((large*large-small*small)/gap+gap)/2
        nearer = farther-gap
        near(farther, 12, '393 same-side farther plane')
        near(nearer, 9, '393 same-side nearer plane')
        near(small*small+farther*farther, large*large+nearer*nearer, '393 shared sphere')
        assert (large*large-small*small)/gap > gap, '393 opposite-side case impossible'
        counts['393'] += 1
        x, y = rng.uniform(.1, 10), rng.uniform(.1, 10)
        radius, center = math.hypot(x, y), (x, y, 0)
        k1, _, r1sq = sphere_plane(center, radius, (0, 0, 0), (1, 0, 0))
        k2, _, r2sq = sphere_plane(center, radius, (0, 0, 0), (0, 1, 0))
        assert k1 == k2 == 'circle'
        assert len(sphere_line(center, radius, (0, 0, -1), (0, 0, 1))) == 1
        near(r1sq+r2sq, radius*radius, '394 two perpendicular sections with one common point')
        counts['394'] += 1
        near(2*math.pi*R*R+2*math.pi*R*R, smooth_sphere_area(R), '395 radius and height both square side')
        counts['395'] += 1

        # The full boundary/model arguments for the nine theory points.
        pole, equator = (0, 0, R), (R, 0, 0)
        near(distance(pole, o), distance(equator, o), '43 sphere equidistance')
        assert distance(mul(pole, .5), o) < R
        counts['43'] += 1
        for depth in (0, R/2, R, 2*R):
            kind, projection, rr = sphere_plane(o, R, (0, 0, depth), (0, 0, 1))
            if kind == 'circle':
                for azimuth in (.1, 1.3, 3.2):
                    point = add(projection, (math.sqrt(rr)*math.cos(azimuth), math.sqrt(rr)*math.sin(azimuth), 0))
                    near(distance(point, o), R, '44 converse inclusion of each circle point')
        counts['44'] += 1
        assert sphere_plane(o, R, pole, pole)[0] == 'point'
        assert len(sphere_line(o, R, add(pole, (1, 0, 0)), add(pole, (0, 1, 0)))) == 0
        counts['45'] += 1
        near(smooth_sphere_area(R), 4*math.pi*R*R, '46 analytic area, not polyhedral mesh')
        counts['46'] += 1
        for depth, intersections in ((0, 2), (R/2, 2), (R, 1), (2*R, 0)):
            hits = sphere_line(o, R, (-2*R, depth, 0), (2*R, depth, 0))
            assert len(hits) == intersections
            for point in hits:
                near(distance(point, o), R, '47 actual line/sphere intersection')
        counts['47'] += 1
        angle = rng.uniform(.1, 1.4)
        normal = (math.cos(angle), 0, math.sin(angle))
        offset = rng.uniform(-4, 4)
        for sign in (-1, 1):
            z = (offset+sign*R)/normal[2]
            c = (0, 0, z)
            point = mul(normal, offset)
            near(distance(c, foot_to_plane(c, point, normal)), R, '48 translated sphere tangent to plane')
            for azimuth in (.2, 2, 4):
                line = (R*math.cos(azimuth), R*math.sin(azimuth), z)
                near(distance(c, foot_to_line(c, line, add(line, (0, 0, 1)))), R, '48 each infinite generator tangent')
        counts['48'] += 1
        theta = rng.uniform(.15, .8)
        z = rng.uniform(.5, 8)
        radius = z*math.sin(theta)
        for azimuth in (.2, 1.1, 4):
            g = (math.sin(theta)*math.cos(azimuth), math.sin(theta)*math.sin(azimuth), math.cos(theta))
            contact = foot_to_line((0, 0, z), o, g)
            near(distance((0, 0, z), contact), radius, '49 perpendicular distance to cone generator')
            near(contact[2], z*math.cos(theta)**2, '49 exact contact-circle plane')
        counts['49'] += 1
        angle = rng.uniform(.15, 1.4)
        normal = (math.cos(angle), 0, math.sin(angle))
        shift = rng.uniform(-2, 2)
        centers = [(0, 0, (shift+sign*R)/math.sin(angle)) for sign in (-1, 1)]
        foci = [foot_to_plane(c, mul(normal, shift), normal) for c in centers]
        for t in (.1, 1, 2.8, 4.9):
            point = (R*math.cos(t), R*math.sin(t), shift/math.sin(angle)-R*math.cos(t)/math.tan(angle))
            near(dot(point, normal), shift, '50 ellipse stays in secant plane')
            near(math.hypot(point[0], point[1]), R, '50 ellipse stays on cylinder')
            near(sum(distance(point, f) for f in foci), 2*R/math.sin(angle), '50 Dandelin sum and converse parameterization')
        counts['50'] += 1
        for phi in (theta/2, theta, (theta+math.pi/2)/2, math.pi/2):
            h = rng.uniform(.3, 3)
            aa, bb, cc = cone_quadratic(theta, phi, h)
            near(aa, 1-(math.cos(phi)/math.cos(theta))**2, '51 focus/directrix eccentricity classification')
            near(aa*cc-bb*bb, -h*h*math.tan(theta)**2, '51 completed-square constant')
            for parameter in (-.7, .3, 1.1):
                if abs(aa) < 1e-10:
                    v = parameter
                    u = (v*v+cc)/(2*bb)
                elif aa > 0:
                    u = bb/aa+h*math.tan(theta)/aa*math.cos(parameter)
                    v = h*math.tan(theta)/math.sqrt(aa)*math.sin(parameter)
                else:
                    u = bb/aa+h*math.tan(theta)/abs(aa)*math.cosh(parameter)
                    v = h*math.tan(theta)/math.sqrt(-aa)*math.sinh(parameter)
                point = cone_plane_point(phi, h, u, v)
                near(point[0]**2+point[1]**2, point[2]**2*math.tan(theta)**2, '51 actual conic point on double cone')
                near(point[0]*math.cos(phi)+point[2]*math.sin(phi), h, '51 actual conic point in plane')
        counts['51'] += 1
    return counts


def boundary_checks():
    counts = {'diameterAndCentralSection': 0, 'lineAndPlaneTransitions': 0,
              'cylinderParallelPlanes': 0, 'cylinderCenterOnPlane': 0,
              'coneChosenNappeAndHomothety': 0, 'conicBothBranchesAndDegeneracies': 0}
    origin = (0, 0, 0)
    for radius in (.5, 1, 7, 100):
        near(math.sqrt(radius*radius-(2*radius)**2/4), 0, '374 diameter boundary')
        assert sphere_plane(origin, radius, origin, (0, 0, 1))[0] == 'circle'
        near(sphere_plane(origin, radius, origin, (0, 0, 1))[2], radius**2, '385 right-angle central section')
        counts['diameterAndCentralSection'] += 1
        for factor, kind, intersections in [(0, 'circle', 2), (1-1e-6, 'circle', 2),
                                             (1, 'point', 1), (1+1e-6, 'empty', 0)]:
            assert sphere_plane(origin, radius, (0, 0, factor*radius), (0, 0, 1))[0] == kind
            assert len(sphere_line(origin, radius, (-radius, factor*radius, 0), (radius, factor*radius, 0))) == intersections
            counts['lineAndPlaneTransitions'] += 1
        # A plane parallel to a cylinder axis has 0/1/2 generators according
        # to the line-circle equation in the perpendicular section.
        for q, number in [(0, 2), (radius/2, 2), (radius, 1), (2*radius, 0)]:
            delta = radius**2-q**2
            actual = 0 if delta < 0 else 1 if delta == 0 else 2
            assert actual == number
            if actual:
                y = math.sqrt(max(0, delta))
                near(math.hypot(q, y), radius, '50 parallel-plane generator lies on cylinder')
            counts['cylinderParallelPlanes'] += 1
        for beta in (0, math.pi/6, math.pi/3):
            normal = (math.sin(beta), 0, math.cos(beta))
            for sign in (-1, 1):
                center = (0, 0, sign*radius/math.cos(beta))
                assert sphere_plane(center, radius, origin, normal)[0] == 'point'
                counts['cylinderCenterOnPlane'] += 1
    for theta in (math.pi/12, math.pi/6, math.pi/4, math.pi/3):
        s = math.sin(theta)
        for m in (-s+1e-4, -s/2, 0, .5, 1):
            normal = (math.sqrt(1-m*m), 0, m)
            h = 2.7
            t = h/(m+s)
            center, radius = (0, 0, t), t*s
            assert t > 0 and radius > 0, '49 positive chosen nappe and sphere'
            kind, foot, _ = sphere_plane(center, radius, mul(normal, h), normal)
            assert kind == 'point', '49 full scalar construction tangent to plane'
            small_center, small_radius = mul(center, .25), radius*.25
            support = add(small_center, mul(normal, small_radius))
            assert 0 < dot(normal, support) < h, '49 entire initial sphere on vertex side'
            scale = h/dot(normal, support)
            near(scale, 4, '49 positive homothety is actually defined')
            same_point(mul(support, scale), foot, '49 supporting point reaches target plane')
            for azimuth in (0, .7, 2.1, 4.9):
                generator = (s*math.cos(azimuth), s*math.sin(azimuth), math.cos(theta))
                contact = foot_to_line(center, origin, generator)
                assert dot(contact, generator) > 0, '49 tangent on positive generator ray'
                near(distance(center, contact), radius, '49 every generator tangent')
            counts['coneChosenNappeAndHomothety'] += 1
        # The excluded side m<=-sin(theta) cannot meet a positive generator ray.
        for m in (-1, -s):
            maximum = m*math.cos(theta)+math.sqrt(max(0, 1-m*m))*s
            assert maximum <= 1e-12, '49 excluded plane orientation misses chosen nappe'
            counts['coneChosenNappeAndHomothety'] += 1
        for phi in (0, theta/2, theta, (theta+math.pi/2)/2, math.pi/2):
            for h in (-2, 2):
                aa, bb, cc = cone_quadratic(theta, phi, h)
                if abs(aa) < 1e-10:
                    assert abs(bb) > 0, '51 parabola retains nonzero linear term'
                    pairs = [((v*v+cc)/(2*bb), v) for v in (-1, 0, 1)]
                elif aa > 0:
                    pairs = [(bb/aa+abs(h)*math.tan(theta)/aa*math.cos(t),
                              abs(h)*math.tan(theta)/math.sqrt(aa)*math.sin(t))
                             for t in (0, 1, 3)]
                else:
                    # Both signs are essential: one branch does not prove a
                    # classification of the complete two-nappe cone.
                    pairs = [(bb/aa+sign*abs(h)*math.tan(theta)/abs(aa)*math.cosh(t),
                              abs(h)*math.tan(theta)/math.sqrt(-aa)*math.sinh(t))
                             for sign in (-1, 1) for t in (-.7, .4)]
                for u, v in pairs:
                    x, y, z = cone_plane_point(phi, h, u, v)
                    near(x*x+y*y, z*z*math.tan(theta)**2, '51 both branches or circle/parabola on exact cone')
                    near(x*math.cos(phi)+z*math.sin(phi), h, '51 exact plane after inverse substitution')
                    counts['conicBothBranchesAndDegeneracies'] += 1
            # h=0: two generator lines, one line, or vertex only.
            aa, bb, cc = cone_quadratic(theta, phi, 0)
            near(bb, 0, '51 plane through vertex has no linear term')
            near(cc, 0, '51 plane through vertex has no constant term')
            if aa < -1e-10:
                pairs = [(u, sign*math.sqrt(-aa)*u) for u in (-1, 1) for sign in (-1, 1)]
            elif abs(aa) <= 1e-10:
                pairs = [(-1, 0), (0, 0), (1, 0)]
            else:
                pairs = [(0, 0)]
                assert aa > 0
            for u, v in pairs:
                x, y, z = cone_plane_point(phi, 0, u, v)
                near(x*x+y*y, z*z*math.tan(theta)**2, '51 exact degenerate generator or vertex')
                counts['conicBothBranchesAndDegeneracies'] += 1
    return counts


def load_cards():
    folder = ROOT/'stereo-course/textbook/lessons'
    missing = sorted(name for name in EXPECTED_IDS if not (folder/(name+'.json')).is_file())
    assert not missing, ('all 46 authored source cards required; no partial PASS', missing)
    cards = {name: json.loads((folder/(name+'.json')).read_text()) for name in sorted(EXPECTED_IDS)}
    return cards


def source_checks(cards):
    assert set(cards) == EXPECTED_IDS, ('exact source parts', sorted(set(cards)^EXPECTED_IDS))
    for name, card in cards.items():
        assert card['id'] == name
        source = card['source']
        assert source['bookId'] == 'atanasyan-2024-10-11'
        assert source['chapter'] == 'IV. Цилиндр, конус и шар'
        if name.startswith('theory-'):
            number = int(name[-3:])
            assert card['kind'] == 'theory' and source['collection'] == 'theory'
            assert source['point'] == str(number)
            assert card['title'] == '%d%s. %s' % (number, '*' if number >= 47 else '', THEORY_TITLES[number]), (name, 'exact printed theory heading')
            pages = THEORY_PAGES[number]
        else:
            number = int(name[8:12])
            part = name[13:] if len(name) > 12 else ''
            assert card['kind'] == 'exercise' and source['collection'] == 'main'
            assert source['exercise'] == str(number)
            assert source.get('subpart', '') == CYRILLIC_PART.get(part, '')
            pages = [110 if number <= 385 else 111]
        assert source['printedPages'] == pages, (name, 'actual printed pages')
        assert source['pdfPages'] == [p+2 for p in pages], (name, 'actual PDF pages')
        assert card.get('steps') and all(step.get('explanation') and step.get('justifications') for step in card['steps']), (name, 'justified complete explanation')
    return {'cards': len(cards), 'exerciseParts': 37, 'theoryPoints': 9}


def compact(text):
    return re.sub(r'\s+', '', text).replace('−', '-').replace('⟂', '⊥')


def require_text(text, fragments, label):
    actual = compact(text)
    for fragment in fragments:
        assert compact(fragment) in actual, (label, 'independent source/proof requirement missing', fragment)


def written_contract_checks(cards):
    """Regression contracts supplement the full independent written review.

    Given values and conclusions were derived from the inspected printed source.
    Precise wording may change after a new independent review; these checks must
    never be weakened automatically merely because an authored lesson disagrees.
    """
    contracts = {
        '0372-a': (['O не лежит на прямой AB', 'M — середина'], ['90°', 'OM⊥AB']),
        '0372-b': (['не принадлежащим прямой AB', 'M лежит на отрезке AB', 'OM⊥AB'], ['AM=BM', 'серединаAB']),
        '0373-a': (['50см', '40см'], ['10√21см']),
        '0373-b': (['15мм', '18мм'], ['12мм']),
        '0373-c': (['10дм', '60см'], ['16дм', '160см']),
        '0373-d': (['радиусаa', 'OM=b'], ['0≤b<a', 'AM=√(a²-b²)']),
        '0374': (['радиусаR', 'равнаm'], ['0<m≤2R', 'd=√(R²-m²/4)']),
        '0375': (['41дм', '9дм'], ['1600πдм²']),
        '0376': (['13см', 'AB=6см', 'BC=8см', 'AC=10см'], ['12см']),
        '0377': (['10см', '16см'], ['OH=6см']),
        '0378': (['10см,10сми12см', '5см', 'стороны'], ['4см']),
        '0379': (['5см', 'AB=13см', 'BC=14см', 'CA=15см'], ['3см']),
        '0380': (['10см', '15сми20см', 'стороныромба'], ['8см']),
        '0381-a': (['R=6дм', 'OH=60см'], ['60см', 'плоскостькасаетсясферы', 'Единственнаяобщаяточка']),
        '0381-b': (['R=3м', 'OH=95см'], ['300см', 'пересекаетсферупоокружности']),
        '0381-c': (['R=5дм', 'OH=45см'], ['50см', 'пересекаетсферупоокружности']),
        '0381-d': (['R=3,5дм', 'OH=40см'], ['35см', 'нетобщихточек']),
        '0382-a': (['12см', '8см'], ['80πсм²']),
        '0382-b': (['Площадьсеченияшараравна12см²', 'равно2см'], ['R=√(4+12/π)см']),
        '0383-a': (['середину', 'перпендикулярная', 'РадиуссферыравенR'], ['√(3R²/4)', '√3R/2']),
        '0383-b': (['серединурадиуса', 'перпендикулярно', 'основаниемконуса', 'вершинойвцентресферы'], ['Sбок=√3πR²/2']),
        '0384-a': (['2см', '30°', 'междуэтимдиаметромисекущейплоскостью'], ['2π√3см']),
        '0384-b': (['5м', '45°', 'междуэтимдиаметромисекущейплоскостью'], ['5π√2м']),
        '0385': (['касательная', 'секущаяшар', 'Уголмеждуэтимиплоскостями'], ['φ=90°', 'πR²', 'φ=0']),
        '0386': (['120°', 'доребра', 'равноa'], ['AB=R=√3a/2']),
        '0387': (['112см', '15см', 'касательнойплоскости'], ['113-112=1см']),
        '0388-a': (['6см'], ['144πсм²']),
        '0388-b': (['2дм'], ['16πдм²']),
        '0388-c': (['√2м'], ['8πм²']),
        '0388-d': (['2√3см'], ['48πсм²']),
        '0389': (['черезегоцентр', 'равна9м²'], ['36м²', 'Дополнительногомножителяπвответенет']),
        '0390': (['Площадьсферыравна324см²'], ['9/√πсм']),
        '0391': (['R₁иR₂'], ['R₁²/R₂²']),
        '0392': (['Площадькругаравнаплощадисферы', '5м'], ['10м']),
        '0393': (['параллельных', '9сми12см', 'равно3см'], ['900πсм²']),
        '0394': (['взаимноперпендикулярные', 'r₁иr₂', 'ровнооднаобщаяточка'], ['S=4π(r₁²+r₂²)']),
        '0395': (['Квадратвращаетсявокругоднойизсвоихсторон', 'Радиуссферыравенстороне'], ['Sцил=4πa²', 'Sсф=4πa²']),
    }
    assert set(contracts) == {key[8:] for key in cards if key.startswith('ex-main-')}
    for suffix, (givens, answer) in contracts.items():
        name = 'ex-main-'+suffix
        card = cards[name]
        require_text(card['statement']['text'], givens, name+' given condition')
        require_text(card['steps'][-1]['explanation'], answer, name+' final conclusion')
    for number in (382, 389, 390):
        name = 'ex-main-%04d%s' % (number, '-b' if number == 382 else '')
        assert 'π' not in cards[name]['statement']['text'], (name, 'printed data have no pi multiplier')
    proof_requirements = {
        'ex-main-0378': ['вписанн', 'сторон'],
        'ex-main-0379': ['вписанн', 'сторон'],
        'ex-main-0380': ['вписанн', 'сторон'],
        'ex-main-0385': ['0<φ<90°', 'S=πr²=πR²sin²φ', '0<φ≤90°'],
        'ex-main-0386': ['внутреннейбиссектрисе', 'Внешняябиссектрисанеподходит'],
        'ex-main-0387': ['PX≥OP-OX', 'равенство'],
        'ex-main-0393': ['x+y=3', 'x-y=21', 'невозможно', 'пооднусторону', 'x=12см', 'y=9см'],
        'ex-main-0394': ['симметричная', 'OT⊥ℓ', 'прямоугольник', 'R²=OH₁²+H₁T²=r₂²+r₁²'],
        'ex-main-0395': ['h=AD=a', 'r=AB=a', 'Обаоснования'],
        'theory-043': ['R>0', 'OM=R', 'OM≤R', 'Обратно', 'полуокружност', 'полукруга'],
        'theory-044': ['d<R', 'd=0', 'd=R', 'd>R', 'Оба включения доказаны', 'HM≤r'],
        'theory-045': ['ровноодну', 'обратную', 'проходящейчерезT', 'тогдаитолькотогда'],
        'theory-046': ['наибольшийразмер', 'нулю', 'предел', 'S=4πR²', 'пункте62', 'S=πD²'],
        'theory-047': ['d<R', 'd=R', 'd>R', 'прямаяaпроходитчерезT', 'AB=AC', '∠BAO=∠CAO', 'AO>R'],
        'theory-048': ['cosβ>0', 'KO·cosβ', 'r/cosβ', 'две', 'сдвинуть'],
        'theory-049': ['0<θ<90°', 'непроходитчерезP', 'd·sinθ', 'd·cos²θ', 'm+s>0', 'h/(m+sinθ)', 'PD/PC>0'],
        'theory-050': ['MF₁+MF₂', '2r/sinφ', 'a=r/sinφ', 'b=r', 'u²/a²+v²/b²=1', 'Обратное включение', 'e=c/a=cosφ', 'φ=90°', 'q<r', 'q=r', 'q>r'],
        'theory-051': ['h≠0', 'A=1-(cos²φ)/(cos²θ)', 'A(u-B/A)²+v²=h²·tan²θ/A', 'B=h·tanθ≠0', 'v²=2Bu₀', 'обеветви', 'φ=0', 'φ=90°', 'однаветвь'],
    }
    for name, fragments in proof_requirements.items():
        # All written teaching fields were manually reviewed; this is a selected
        # regression contract for source-critical hypotheses and converse cases.
        card = cards[name]
        text = json.dumps({key: card.get(key) for key in ('statement', 'help', 'steps')}, ensure_ascii=False)
        require_text(text, fragments, name+' essential proof/boundary requirement')
    last_reasons = cards['theory-046']['steps'][-1]['justifications']
    assert len(last_reasons) == 2, '46 area substitution and diameter reference are separate reasons'
    assert 'theoryId' not in last_reasons[0], '46 source43 does not establish the sphere-area formula'
    assert last_reasons[1]['theoryId'] == 'theory-043'
    require_text(last_reasons[1]['text'], ['D=2R'], '46 diameter source link')
    return {'exerciseConditionAnswerContracts': len(contracts), 'essentialProofContracts': len(proof_requirements)}


def generic_model_checks(cards):
    totals = {'models': 0, 'spheres': 0, 'sphereArcEndpoints': 0, 'planarPolygons': 0, 'segments': 0, 'views': 0}
    for name, card in cards.items():
        model = card['visualization']['model']
        points = model['points']
        assert points and all(len(v) == 3 and all(math.isfinite(x) for x in v) for v in points.values())
        used = {'neutral'} | {item.get('view', 'neutral') for item in card.get('steps', [])+card.get('help', [])}
        assert used == set(model['views']), (name, 'all actual states reachable from steps or help', used ^ set(model['views']))
        for sphere in model.get('spheres', []):
            center, radius = sphere['center'], sphere['radius']
            assert len(center) == 3 and all(math.isfinite(x) for x in center) and radius > 0
            for edge in sphere.get('surfaceEdges', []):
                assert len(edge) == 2 and all(p in points for p in edge), (name, 'known sphere arc ends')
                for key in edge:
                    near(distance(points[key], center), radius, name+' analytic sphere surface point '+key)
                    totals['sphereArcEndpoints'] += 1
            totals['spheres'] += 1
        for face in model.get('faces', []):
            plane([points[p] for p in face], name+' actual face')
            totals['planarPolygons'] += 1
        for first, second in model.get('edges', []):
            assert first in points and second in points
            assert distance(points[first], points[second]) > 1e-10, (name, 'nonzero mesh edge')
            totals['segments'] += 1
        for key, view in model['views'].items():
            for first, second in view.get('segments', []):
                assert first in points and second in points
                assert distance(points[first], points[second]) > 1e-10, (name, key, 'nonzero displayed segment')
                totals['segments'] += 1
            if view.get('polygon'):
                plane([points[p] for p in view['polygon']], name+' highlighted plane '+key)
                totals['planarPolygons'] += 1
            totals['views'] += 1
        totals['models'] += 1
    return totals


def model_of(card):
    return card['visualization']['model']


def numbered_points(model, prefix, count=None):
    names = sorted((key for key in model['points'] if re.fullmatch(re.escape(prefix)+r'\d+', key)),
                   key=lambda key: int(key[len(prefix):]))
    assert len(names) >= 3, (prefix, 'sampled curve has at least three points')
    if count is not None:
        assert len(names) == count, (prefix, 'complete sampled curve', len(names), count)
    return [model['points'][key] for key in names]


def check_sphere(model, center_name='O', expected_radius=None, index=0):
    sphere = model['spheres'][index]
    same_point(sphere['center'], model['points'][center_name], 'sphere actual named center')
    if expected_radius is not None:
        near(sphere['radius'], expected_radius, 'source radius of analytic sphere')
    return sphere['center'], sphere['radius']


def check_circle(model, prefix, center, radius, sphere=None, count=64):
    vertices = numbered_points(model, prefix, count)
    origin, normal = plane(vertices, prefix+' circle plane')
    near(dot(sub(center, origin), normal), 0, prefix+' circle center in its plane')
    for vertex in vertices:
        near(distance(vertex, center), radius, prefix+' all actual circle radii')
        if sphere is not None:
            near(distance(vertex, sphere[0]), sphere[1], prefix+' section belongs to sphere')
    return origin, normal


def check_section(model, prefix, center_name, radius, sphere=None):
    sphere = sphere or check_sphere(model)
    center = model['points'][center_name]
    origin, normal = check_circle(model, prefix, center, radius, sphere)
    kind, foot, radius_sq = sphere_plane(*sphere, origin, normal)
    assert kind == 'circle', (prefix, 'actual nondegenerate section')
    same_point(foot, center, prefix+' center is perpendicular projection')
    near(radius_sq, radius*radius, prefix+' Pythagorean section radius')
    return origin, normal


def check_tangent_plane(model, prefix, contact, sphere=None):
    sphere = sphere or check_sphere(model)
    origin, normal = plane(numbered_points(model, prefix, 4), prefix+' tangent plane')
    kind, foot, _ = sphere_plane(*sphere, origin, normal)
    assert kind == 'point', (prefix, 'actual tangent plane, not a near secant')
    same_point(foot, model['points'][contact], prefix+' actual point of tangency')
    return origin, normal


def check_diameter(model, a, b, center='O'):
    sphere = check_sphere(model, center)
    points = model['points']
    same_point(mul(add(points[a], points[b]), .5), points[center], 'diameter through center')
    near(distance(points[a], points[b]), 2*sphere[1], 'diameter has length 2R')


def check_side_tangencies(model, vertices, contacts, expected_inradius, expected_height):
    p = model['points']
    sphere = check_sphere(model)
    polygon = [p[key] for key in vertices]
    origin, normal = plane(polygon, 'source polygon plane')
    same_point(foot_to_plane(p['O'], origin, normal), p['H'], 'center projection H')
    near(distance(p['O'], p['H']), expected_height, 'source answer center-plane distance')
    if len(vertices) == 3:
        inc, radius = triangle_incircle(*polygon)
        same_point(inc, p['H'], 'internal incenter, not an excenter')
        near(radius, expected_inradius, 'independently constructed inradius')
    for index, contact in enumerate(contacts):
        first, second = polygon[index], polygon[(index+1) % len(polygon)]
        foot = foot_to_line(p['O'], first, second)
        same_point(foot, p[contact], 'actual contact with side')
        parameter = dot(sub(foot, first), sub(second, first))/distance(first, second)**2
        assert 0 < parameter < 1, ('tangent touches finite side interior', contact, parameter)
        near(distance(foot, p['O']), sphere[1], 'side tangent to sphere')
        near(distance(foot, p['H']), expected_inradius, 'side tangent to incircle')
    check_section(model, '_incircle', 'H', expected_inradius, sphere)


def exercise_model_checks(cards):
    checked = set()
    # Chord configurations: all measurements are taken from actual points.
    chord_values = {'ex-main-0372-a': (5, 3, 8), 'ex-main-0372-b': (5, 3, 8),
                    'ex-main-0373-a': (50, 10*math.sqrt(21), 40),
                    'ex-main-0373-b': (15, 12, 18), 'ex-main-0373-c': (10, 6, 16),
                    'ex-main-0373-d': (5, 3, 8), 'ex-main-0374': (5, 3, 8)}
    for name, (radius, height, chord) in chord_values.items():
        m = model_of(cards[name]); p = m['points']
        check_sphere(m, expected_radius=radius)
        same_point(mul(add(p['A'], p['B']), .5), p['M'], name+' chord midpoint')
        near(distance(p['A'], p['B']), chord, name+' source chord')
        near(distance(p['O'], p['M']), height, name+' source/representative height')
        for end in ('A', 'B'):
            near(distance(p['O'], p[end]), radius, name+' chord end on sphere')
        near(dot(sub(p['O'], p['M']), sub(p['B'], p['A'])), 0, name+' perpendicular midpoint')
        if name in ('ex-main-0373-d', 'ex-main-0374'):
            check_diameter(m, 'D', 'E')
            assert ['D', 'E'] in m['views']['diameter']['segments']
            assert any(step['view'] == 'diameter' for step in cards[name]['steps'])
        checked.add(name)
    m = model_of(cards['ex-main-0375']); p = m['points']
    check_sphere(m, expected_radius=41)
    near(distance(p['O'], p['H']), 9, '375 source plane distance')
    check_section(m, '_section', 'H', 40)
    near(math.pi*distance(p['H'], p['A'])**2, 1600*math.pi, '375 actual answer area')
    checked.add('ex-main-0375')

    m = model_of(cards['ex-main-0376']); p = m['points']
    check_sphere(m, expected_radius=13)
    for a, b, length in [('A', 'B', 6), ('B', 'C', 8), ('C', 'A', 10)]:
        near(distance(p[a], p[b]), length, '376 exact triangle side')
    center, radius = circumcircle(p['A'], p['B'], p['C'])
    same_point(center, p['H'], '376 independently solved circumcenter')
    near(radius, 5, '376 circumradius')
    check_section(m, '_section', 'H', radius)
    near(distance(p['O'], p['H']), 12, '376 actual answer')
    checked.add('ex-main-0376')

    m = model_of(cards['ex-main-0377']); p = m['points']
    check_sphere(m, expected_radius=10)
    for a, b in [('A', 'C'), ('B', 'D')]:
        near(distance(p[a], p[b]), 16, '377 source diagonal')
        same_point(mul(add(p[a], p[b]), .5), p['H'], '377 diagonal midpoint')
    near(dot(sub(p['B'], p['A']), sub(p['D'], p['A'])), 0, '377 true rectangle')
    check_section(m, '_section', 'H', 8)
    near(distance(p['O'], p['H']), 6, '377 actual answer')
    checked.add('ex-main-0377')

    for name, vertices, contacts, sides, radius, inradius, height in [
        ('ex-main-0378', 'ABC', ['M', 'K', 'L'], [12, 10, 10], 5, 3, 4),
        ('ex-main-0379', 'ABC', ['K', 'T', 'L'], [13, 14, 15], 5, 4, 3),
        ('ex-main-0380', 'ABCD', ['T', 'K', 'L', 'N'], [12.5]*4, 10, 6, 8),
    ]:
        m = model_of(cards[name]); p = m['points']
        check_sphere(m, expected_radius=radius)
        for index, length in enumerate(sides):
            near(distance(p[vertices[index]], p[vertices[(index+1) % len(vertices)]]), length, name+' source sides')
        if name == 'ex-main-0380':
            assert sorted(round(distance(p[a], p[b]), 9) for a, b in [('A', 'C'), ('B', 'D')]) == [15, 20]
            near(dot(sub(p['C'], p['A']), sub(p['D'], p['B'])), 0, '380 perpendicular diagonals')
        check_side_tangencies(m, vertices, contacts, inradius, height)
        checked.add(name)

    for part, radius, height, expected in [('a', 60, 60, 'point'), ('b', 300, 95, 'circle'),
                                            ('c', 50, 45, 'circle'), ('d', 35, 40, 'empty')]:
        name = 'ex-main-0381-'+part; m = model_of(cards[name]); p = m['points']
        sphere = check_sphere(m, expected_radius=radius)
        origin, normal = plane([p[k] for k in 'ABC'], name+' tetrahedron base')
        kind, center, rr = sphere_plane(*sphere, origin, normal)
        assert kind == expected, (name, 'source classification')
        same_point(center, p['H'], name+' height foot')
        near(distance(p['O'], p['H']), height, name+' all units in cm')
        if kind == 'circle':
            check_section(m, '_section', 'H', math.sqrt(rr))
        checked.add(name)

    for name, radius, depth, section_radius in [
        ('ex-main-0382-a', 12, 8, math.sqrt(80)),
        ('ex-main-0382-b', math.sqrt(4+12/math.pi), 2, math.sqrt(12/math.pi)),
        ('ex-main-0383-a', 4, 2, 2*math.sqrt(3)),
        ('ex-main-0383-b', 4, 2, 2*math.sqrt(3)),
        ('ex-main-0384-a', 2, 1, math.sqrt(3)),
        ('ex-main-0384-b', 5, 5/math.sqrt(2), 5/math.sqrt(2)),
        ('ex-main-0385', 4, 2*math.sqrt(2), 2*math.sqrt(2)),
    ]:
        m = model_of(cards[name]); p = m['points']
        sphere = check_sphere(m, expected_radius=radius)
        near(distance(p['O'], p['H']), depth, name+' distance to secant plane')
        near(distance(p['A'], p['H']), section_radius, name+' named section radius')
        origin, normal = check_section(m, '_cut', 'H', section_radius, sphere)
        near(dot(sub(p['A'], origin), normal), 0, name+' named A in secant plane')
        near(distance(p['A'], p['O']), radius, name+' named A on sphere')
        if name == 'ex-main-0382-b':
            near(math.pi*section_radius**2, 12, '382b given 12, not 12pi')
        if name == 'ex-main-0383-b':
            near(math.pi*distance(p['H'], p['A'])*distance(p['O'], p['A']), math.sqrt(3)*math.pi*radius**2/2, '383b cone lateral area')
        if name.startswith('ex-main-0384'):
            check_diameter(m, 'A', 'B')
            angle = math.pi/6 if name.endswith('a') else math.pi/4
            near(abs(dot(unit(sub(p['O'], p['A'])), normal)), math.sin(angle), name+' angle of diameter to plane')
            assert not m['views']['disk'].get('polygon'), name+' circumference is not a filled disk'
        if name == 'ex-main-0383-a':
            assert not m['views']['disk'].get('polygon'), '383a sphere section is a circumference'
        if name == 'ex-main-0385':
            _, tangent_normal = check_tangent_plane(m, '_beta', 'A', sphere)
            secant_origin, secant_normal = plane(numbered_points(m, '_alpha', 4), '385 actual secant patch')
            near(abs(dot(normal, secant_normal)), 1, '385 section and patch share plane normal')
            near(dot(sub(origin, secant_origin), secant_normal), 0, '385 section and patch same plane')
            near(dot(sub(p['T'], p['A']), sub(p['O'], p['A'])), 0, '385 AT in tangent plane')
            phi = math.acos(min(1, abs(dot(normal, tangent_normal))))
            near(section_radius, radius*math.sin(phi), '385 angle is between planes, not line and plane')
            central_origin, central_normal = check_section(m, '_central', 'O', radius, sphere)
            near(dot(sub(p['A'], central_origin), central_normal), 0, '385 central plane contains contact A')
            near(dot(central_normal, tangent_normal), 0, '385 central plane perpendicular to tangent plane')
            assert cards[name]['steps'][3]['view'] == 'central', '385 right-angle case uses actual central geometry'
            central = m['views']['central']
            assert central['polygon'] == ['_central'+str(i) for i in range(64)], '385 entire actual central disk is shown'
            assert not any('H' in edge for edge in central.get('segments', [])), '385 central case has no fictitious nonzero OH'
            assert any(item['view'] == 'radius' for item in cards[name]['help']), '385 original acute radius view remains reachable'
        checked.add(name)

    m = model_of(cards['ex-main-0386']); p = m['points']; sphere = check_sphere(m)
    near(distance(p['O'], p['H']), 4, '386 representative a')
    near(dot(unit(sub(p['A'], p['H'])), unit(sub(p['B'], p['H']))), -.5, '386 exact 120-degree angle')
    edge = [p['_edge0'], p['_edge1']]
    same_point(foot_to_line(p['O'], *edge), p['H'], '386 distance to actual edge')
    for contact, face in [('A', '_faceA'), ('B', '_faceB')]:
        check_tangent_plane(m, face, contact, sphere)
        assert dot(sub(p[contact], p['H']), sub(p['O'], p['H'])) > 0, '386 feet on positive face rays'
    near(sphere[1], math.sqrt(3)*distance(p['O'], p['H'])/2, '386 radius')
    near(distance(p['A'], p['B']), sphere[1], '386 equilateral contact triangle')
    checked.add('ex-main-0386')

    m = model_of(cards['ex-main-0387']); p = m['points']; sphere = check_sphere(m, expected_radius=112)
    origin, normal = check_tangent_plane(m, '_plane', 'A', sphere)
    near(dot(sub(p['P'], origin), normal), 0, '387 P in tangent plane')
    near(distance(p['A'], p['P']), 15, '387 source tangential distance')
    near(distance(p['O'], p['P']), 113, '387 exact hypotenuse')
    same_point(p['Q'], add(p['O'], mul(sub(p['P'], p['O']), 112/113)), '387 nearest radial point')
    near(distance(p['Q'], p['P']), 1, '387 nearest distance, not PA')
    checked.add('ex-main-0387')

    for name, radius, area in [('ex-main-0388-a', 6, 144*math.pi), ('ex-main-0388-b', 2, 16*math.pi),
                              ('ex-main-0388-c', math.sqrt(2), 8*math.pi), ('ex-main-0388-d', 2*math.sqrt(3), 48*math.pi),
                              ('ex-main-0389', 3/math.sqrt(math.pi), 36), ('ex-main-0390', 9/math.sqrt(math.pi), 324)]:
        m = model_of(cards[name]); p = m['points']
        check_sphere(m, expected_radius=radius)
        near(distance(p['O'], p['A']), radius, name+' actual named radius')
        near(smooth_sphere_area(radius), area, name+' source surface area via Jacobian')
        if name == 'ex-main-0389':
            check_section(m, '_great', 'O', radius)
            near(math.pi*radius**2, 9, '389 given entire disk area without inserted pi')
        checked.add(name)

    m = model_of(cards['ex-main-0391']); p = m['points']
    assert len(m['spheres']) == 2
    for index in (1, 2):
        sphere = check_sphere(m, 'O'+str(index), index=index-1)
        near(distance(p['O'+str(index)], p['A'+str(index)]), sphere[1], '391 actual radius')
    r1, r2 = [s['radius'] for s in m['spheres']]
    near(smooth_sphere_area(r1)/smooth_sphere_area(r2), (r1/r2)**2, '391 squared scaling')
    checked.add('ex-main-0391')
    m = model_of(cards['ex-main-0392']); p = m['points']
    check_sphere(m, expected_radius=5)
    check_circle(m, '_disk', p['C'], 10)
    near(distance(p['C'], p['B']), 10, '392 answer circle radius')
    near(math.pi*distance(p['C'], p['B'])**2, smooth_sphere_area(5), '392 equal areas')
    checked.add('ex-main-0392')

    m = model_of(cards['ex-main-0393']); p = m['points']; sphere = check_sphere(m, expected_radius=15)
    a, na = check_section(m, '_small', 'M', 9)
    b, nb = check_section(m, '_large', 'N', 12)
    near(abs(dot(na, nb)), 1, '393 two parallel section planes')
    near(abs(dot(sub(a, b), na)), 3, '393 source gap is 3, not 21')
    assert dot(sub(p['M'], p['O']), na)*dot(sub(p['N'], p['O']), na) > 0, '393 same side of center'
    near(distance(p['M'], p['O']), 12, '393 farther small section')
    near(distance(p['N'], p['O']), 9, '393 nearer large section')
    near(smooth_sphere_area(sphere[1]), 900*math.pi, '393 source final area')
    checked.add('ex-main-0393')

    m = model_of(cards['ex-main-0394']); p = m['points']; sphere = check_sphere(m)
    r1, r2 = distance(p['H1'], p['T']), distance(p['H2'], p['T'])
    _, na = check_section(m, '_cutOne', 'H1', r1)
    _, nb = check_section(m, '_cutTwo', 'H2', r2)
    near(dot(na, nb), 0, '394 perpendicular secant planes')
    line = [p['_line0'], p['_line1']]
    hits = sphere_line(*sphere, *line)
    assert len(hits) == 1, '394 common line tangent, not secant'
    same_point(hits[0], p['T'], '394 unique common point')
    near(r1*r1+r2*r2, sphere[1]**2, '394 perpendicular rectangle diagonal')
    checked.add('ex-main-0394')

    m = model_of(cards['ex-main-0395']); p = m['points']; sphere = check_sphere(m)
    side = distance(p['A'], p['B'])
    for a, b in [('B', 'C'), ('C', 'D'), ('D', 'A')]:
        near(distance(p[a], p[b]), side, '395 actual square, all four sides')
    near(dot(sub(p['B'], p['A']), sub(p['D'], p['A'])), 0, '395 square right angle')
    near(sphere[1], side, '395 sphere radius equals square side')
    for prefix, center in [('_cylinderL', p['A']), ('_cylinderH', p['D'])]:
        check_circle(m, prefix, center, side, count=48)
    near(2*math.pi*side*distance(p['A'], p['D'])+2*math.pi*side**2, smooth_sphere_area(sphere[1]), '395 full cylinder area includes both bases')
    checked.add('ex-main-0395')
    assert checked == {key for key in cards if key.startswith('ex-main-')}, 'all 37 actual exercise models checked'
    return len(checked)


def theory_model_checks(cards):
    m = model_of(cards['theory-043']); p = m['points']; sphere = check_sphere(m, expected_radius=3)
    check_diameter(m, 'A', 'B'); check_diameter(m, 'N', 'S')
    assert 0 < distance(p['O'], p['X']) < sphere[1], '43 X is strictly inside the ball'
    check_section(m, '_equator', 'O', sphere[1]); check_section(m, '_meridian', 'O', sphere[1])
    semicircle = [p[key] for key in m['views']['disk']['polygon']]
    assert len(semicircle) == 33, '43 highlighted half circle, not full circle'
    same_point(semicircle[0], p['N'], '43 northern endpoint')
    same_point(semicircle[-1], p['S'], '43 southern endpoint')
    assert all(point[0] >= -1e-9 for point in semicircle), '43 one half plane only'

    m = model_of(cards['theory-044']); p = m['points']; sphere = check_sphere(m, expected_radius=3)
    check_section(m, '_section', 'H', 2.4); check_section(m, '_great', 'O', 3)
    assert not m['views']['circle'].get('polygon'), '44 sphere circumference without disk fill'
    check_tangent_plane(m, '_tanPlane', 'T', sphere)
    for prefix, expected, foot in [('_secPlane', 'circle', 'H'), ('_outPlane', 'empty', 'K')]:
        origin, normal = plane(numbered_points(m, prefix, 4), '44 exact plane')
        kind, projection, _ = sphere_plane(*sphere, origin, normal)
        assert kind == expected
        same_point(projection, p[foot], '44 actual nearest point of plane')

    m = model_of(cards['theory-045']); p = m['points']; sphere = check_sphere(m, expected_radius=2.5)
    origin, normal = check_tangent_plane(m, '_alpha', 'T', sphere)
    near(dot(sub(p['Q'], origin), normal), 0, '45 Q in actual tangent plane')
    assert distance(p['Q'], sphere[0]) > sphere[1], '45 other point outside sphere'
    near(dot(sub(p['O'], p['T']), sub(p['Q'], p['T'])), 0, '45 perpendicular radius')

    m = model_of(cards['theory-046']); p = m['points']; sphere = check_sphere(m, expected_radius=2)
    cube = numbered_points(m, '_cube', 8)
    for axis in range(3):
        for sign in (-1, 1):
            face = [v for v in cube if math.isclose(v[axis], sign*sphere[1])]
            assert len(face) == 4, '46 all six actual cube faces'
            origin, normal = plane(face, '46 cube tangent face')
            kind, projection, _ = sphere_plane(*sphere, origin, normal)
            assert kind == 'point', '46 each cube face tangent'
            same_point(mul(tuple(map(sum, zip(*face))), .25), projection, '46 contact inside actual face')
    check_section(m, '_great', 'O', sphere[1])
    near(distance(p['O'], p['T']), sphere[1], '46 top face contact')

    m = model_of(cards['theory-047']); p = m['points']; sphere = check_sphere(m, expected_radius=2)
    check_section(m, '_section', 'O', 2)
    check_diameter(m, 'I', 'J')
    assert any(help_item['view'] == 'diameter' for help_item in cards['theory-047']['help']), '47 reachable center-on-line case'
    for a, b, count, foot in [('L', 'M', 2, 'H'), ('U', 'V', 1, 'T'), ('W', 'Z', 0, 'K')]:
        hits = sphere_line(*sphere, p[a], p[b])
        assert len(hits) == count, '47 exact 0/1/2 intersections'
        same_point(foot_to_line(p['O'], p[a], p[b]), p[foot], '47 perpendicular foot')
        if count == 2:
            for named in ('D', 'E'):
                assert min(distance(p[named], hit) for hit in hits) < 1e-8
    for contact in ('B', 'C'):
        near(distance(p['O'], p[contact]), sphere[1], '47 tangency point on sphere')
        near(dot(sub(p['O'], p[contact]), sub(p['A'], p[contact])), 0, '47 actual tangent line')
        near(distance(p['A'], p[contact])**2, distance(p['A'], p['O'])**2-sphere[1]**2, '47 tangent length')
    near(distance(p['A'], p['B']), distance(p['A'], p['C']), '47 equal tangents')
    near(dot(unit(sub(p['B'], p['A'])), unit(sub(p['O'], p['A']))),
         dot(unit(sub(p['C'], p['A'])), unit(sub(p['O'], p['A']))), '47 equal angles')

    m = model_of(cards['theory-048']); p = m['points']; sphere = check_sphere(m, expected_radius=2)
    axis = unit(sub(p['K'], p['O']))
    check_section(m, '_contact', 'O', sphere[1])
    lower, upper = numbered_points(m, '_cylinderL', 48), numbered_points(m, '_cylinderH', 48)
    for a, b in zip(lower, upper):
        near(abs(dot(unit(sub(b, a)), axis)), 1, '48 parallel infinite generators')
        near(distance(p['O'], foot_to_line(p['O'], a, b)), sphere[1], '48 each generator tangent')
    origin, normal = check_tangent_plane(m, '_alpha', 'H', sphere)
    near(dot(sub(p['K'], origin), normal), 0, '48 K on alpha')
    near(distance(p['K'], p['O'])*abs(dot(axis, normal)), sphere[1], '48 KOcosbeta exact distance')
    same_point(foot_to_line(p['O'], p['A'], p['B']), p['M'], '48 named generator contact')

    m = model_of(cards['theory-049']); p = m['points']; sphere = check_sphere(m, expected_radius=2)
    axis = unit(sub(p['O'], p['P']))
    d = distance(p['P'], p['O'])
    theta = math.acos(dot(axis, unit(sub(p['A'], p['P']))))
    near(theta, math.pi/6, '49 representative 30-degree cone')
    near(sphere[1], d*math.sin(theta), '49 sphere tangent to every cone generator')
    same_point(foot_to_line(p['O'], p['P'], p['A']), p['T'], '49 exact contact with PA')
    near(distance(p['P'], p['Q']), d*math.cos(theta)**2, '49 contact-plane distance contains cos squared')
    near(distance(p['Q'], p['T']), d*math.sin(theta)*math.cos(theta), '49 contact circle radius')
    check_section(m, '_contact', 'Q', distance(p['Q'], p['T']))
    for vertex in numbered_points(m, '_coneB', 48):
        axial = dot(sub(vertex, p['P']), axis)
        assert axial > 0, '49 chosen positive nappe'
        near(norm(sub(sub(vertex, p['P']), mul(axis, axial))), axial*math.tan(theta), '49 actual cone surface')
        near(distance(p['O'], foot_to_line(p['O'], p['P'], vertex)), sphere[1], '49 each generator tangent')
    check_tangent_plane(m, '_alpha', 'F', sphere)

    m = model_of(cards['theory-050']); p = m['points']
    assert len(m['spheres']) == 2
    lower, upper = numbered_points(m, '_cylinderL', 48), numbered_points(m, '_cylinderH', 48)
    for a, b in zip(lower, upper):
        near(math.hypot(a[0], a[1]), 2, '50 actual lower cylindrical surface radius')
        near(math.hypot(b[0], b[1]), 2, '50 actual upper cylindrical surface radius')
        near(a[0], b[0], '50 generator x constant')
        near(a[1], b[1], '50 generator y constant')
    origin, normal = plane(numbered_points(m, '_alpha', 4), '50 secant plane')
    for index in (1, 2):
        sphere = check_sphere(m, 'O'+str(index), 2, index-1)
        kind, projection, _ = sphere_plane(*sphere, origin, normal)
        assert kind == 'point', '50 both Dandelin spheres tangent to alpha'
        same_point(projection, p['F'+str(index)], '50 actual focus is tangency point')
        check_circle(m, '_l'+str(index), p['O'+str(index)], 2, sphere)
    phi = math.asin(abs(dot(normal, (0, 0, 1))))
    a, b = 2/math.sin(phi), 2
    near(distance(p['O'], p['A']), a, '50 actual major semiaxis')
    near(distance(p['O'], p['B']), b, '50 actual minor semiaxis')
    near(dot(sub(p['A'], p['O']), sub(p['B'], p['O'])), 0, '50 orthogonal axes')
    for vertex in numbered_points(m, '_ellipse', 80):
        near(dot(sub(vertex, origin), normal), 0, '50 entire ellipse in plane')
        near(math.hypot(vertex[0], vertex[1]), 2, '50 entire ellipse on cylinder')
        near(distance(vertex, p['F1'])+distance(vertex, p['F2']), 2*a, '50 every actual point satisfies focus sum')
        directrix_distance = distance(vertex, foot_to_line(vertex, p['D1'], p['D2']))
        near(distance(vertex, p['F1'])/directrix_distance, math.cos(phi), '50 all focal/directrix ratios')
    same_point(foot_to_line(p['M'], p['D1'], p['D2']), p['H'], '50 H true directrix foot')
    for suffix in ('1', '2'):
        contact = p['M'+suffix]; center = p['O'+suffix]
        near(distance(center, contact), 2, '50 generator contact on sphere')
        near(dot(sub(center, contact), sub(p['M'], contact)), 0, '50 actual generator tangent')
        near(distance(p['M'], contact), distance(p['M'], p['F'+suffix]), '50 actual equal tangent lengths')

    m = model_of(cards['theory-051']); p = m['points']; sphere = check_sphere(m)
    for prefix, sign in [('_upperB', 1), ('_lowerB', -1)]:
        for vertex in numbered_points(m, prefix, 48):
            near(vertex[0]**2+vertex[1]**2, vertex[2]**2, '51 actual cone mesh is 45 degrees')
            assert vertex[2]*sign > 0, '51 actual mesh has both nappes'
    for prefix, count, plane_equation, sign in [
        ('_circle', 64, lambda v: v[2]-2, 1),
        ('_ellipse', 80, lambda v: v[2]-2-.5*v[0], 1),
        ('_parabola', 61, lambda v: v[2]-1-v[0], 1),
        ('_hyperU', 61, lambda v: v[0]-1, 1),
        ('_hyperL', 61, lambda v: v[0]-1, -1),
    ]:
        vertices = numbered_points(m, prefix, count)
        for vertex in vertices:
            near(vertex[0]**2+vertex[1]**2, vertex[2]**2, '51 each actual conic point on double cone')
            near(plane_equation(vertex), 0, '51 each conic point in its exact plane')
            assert vertex[2]*sign > 0, ('51 both correct hyperbola nappes', prefix)
    for a, b in [('A', 'D'), ('B', 'C')]:
        same_point(foot_to_line(p['P'], p[a], p[b]), p['P'], '51 full degenerate generator contains vertex')
    near(sphere[1], distance(p['P'], p['O'])/math.sqrt(2), '51 Dandelin sphere tangent to 45-degree cone')
    origin, normal = plane(numbered_points(m, '_ellipse', 80), '51 Dandelin secant plane')
    kind, projection, _ = sphere_plane(*sphere, origin, normal)
    assert kind == 'point', '51 actual Dandelin sphere tangent to ellipse plane'
    same_point(projection, p['F'], '51 focal tangency')
    same_point(foot_to_line(p['O'], p['P'], p['M']), p['M1'], '51 actual generator tangency')
    near(distance(p['M'], p['F']), distance(p['M'], p['M1']), '51 equal actual tangents')
    contact_center = (p['O'][0], p['O'][1], p['M1'][2])
    check_circle(m, '_contact', contact_center, distance(contact_center, p['M1']), sphere)
    same_point(foot_to_line(p['M'], p['D1'], p['D2']), p['H'], '51 H foot on directrix')
    phi = math.asin(abs(dot(normal, (0, 0, 1))))
    near(distance(p['M'], p['F'])/distance(p['M'], p['H']), math.cos(phi)/math.cos(math.pi/4), '51 focal/directrix eccentricity')
    near(distance(p['M'], p['K']), distance(p['M'], p['M1'])/math.sqrt(2), '51 generator projection')
    return 9


def actual_model_checks(cards):
    return {'exerciseModels': exercise_model_checks(cards), 'theoryModels': theory_model_checks(cards)}


def negative_controls(cards):
    """Mutate deep copies only; a rejected mutation is required for every case."""
    rejected = []

    def reject(label, checker, mutate):
        candidate = copy.deepcopy(cards)
        mutate(candidate)
        try:
            checker(candidate)
        except (AssertionError, KeyError, ValueError, ZeroDivisionError):
            rejected.append(label)
            return
        raise AssertionError(('negative control was not rejected', label))

    def replace(card_id, field, old, new):
        def mutation(candidate):
            target = candidate[card_id]
            for key in field[:-1]:
                target = target[key]
            assert old in target[field[-1]], ('negative control actually changes target', card_id, old)
            target[field[-1]] = target[field[-1]].replace(old, new)
        return mutation

    reject('omitted printed part 382b', source_checks, lambda c: c.pop('ex-main-0382-b'))
    reject('wrong source subpart 382b', source_checks, lambda c: c['ex-main-0382-b']['source'].__setitem__('subpart', 'а'))
    reject('382b inserted pi into given area', written_contract_checks,
           replace('ex-main-0382-b', ['statement', 'text'], '12 см²', '12π см²'))
    reject('382b wrong inverse-area answer', written_contract_checks,
           replace('ex-main-0382-b', ['steps', -1, 'explanation'], '12/π', '12'))
    reject('389 inserted pi into given area', written_contract_checks,
           replace('ex-main-0389', ['statement', 'text'], '9 м²', '9π м²'))
    reject('389 incorrect 36pi final answer', written_contract_checks,
           replace('ex-main-0389', ['steps', -1, 'explanation'], '36 м²', '36π м²'))
    reject('390 incorrect radius 9', written_contract_checks,
           replace('ex-main-0390', ['steps', -1, 'explanation'], '9/√π см', '9 см'))
    reject('390 incorrect geometric radius 9', actual_model_checks,
           lambda c: model_of(c['ex-main-0390'])['spheres'][0].__setitem__('radius', 9))
    reject('393 altered plane gap in condition', written_contract_checks,
           replace('ex-main-0393', ['statement', 'text'], '3 см', '21 см'))
    reject('393 omitted exclusion of opposite-side case', written_contract_checks,
           lambda c: c['ex-main-0393']['steps'][2].__setitem__('explanation', 'Полагаем x − y = 3 без проверки.'))
    reject('393 wrong area answer', written_contract_checks,
           replace('ex-main-0393', ['steps', -1, 'explanation'], '900π', '576π'))
    reject('393 wrong-side section center', actual_model_checks,
           lambda c: model_of(c['ex-main-0393'])['points'].__setitem__('N', [0, 0, -9]))
    reject('376 wrong circumcenter', actual_model_checks,
           lambda c: model_of(c['ex-main-0376'])['points'].__setitem__('H', [1, 0, 0]))
    reject('378 contact outside finite side', actual_model_checks,
           lambda c: model_of(c['ex-main-0378'])['points'].__setitem__('M', [10, 0, 0]))
    reject('384 incorrect line-plane angle', actual_model_checks,
           lambda c: model_of(c['ex-main-0384-a'])['points'].__setitem__('A', [1, 0, math.sqrt(3)]))
    reject('385 falsely secant tangent plane', actual_model_checks,
           lambda c: model_of(c['ex-main-0385'])['points']['_beta0'].__setitem__(2, 4))
    reject('385 central circle has wrong radius', actual_model_checks,
           lambda c: model_of(c['ex-main-0385'])['points']['_central16'].__setitem__(1, -3))
    reject('385 central paragraph uses ordinary acute triangle', actual_model_checks,
           lambda c: c['ex-main-0385']['steps'][3].__setitem__('view', 'radius'))
    reject('387 nearest point not on sphere', actual_model_checks,
           lambda c: model_of(c['ex-main-0387'])['points'].__setitem__('Q', [14, 0, 110]))
    reject('394 common line not tangent', actual_model_checks,
           lambda c: model_of(c['ex-main-0394'])['points']['_line0'].__setitem__(0, 1))
    reject('373d fake auxiliary diameter', actual_model_checks,
           lambda c: model_of(c['ex-main-0373-d'])['points']['D'].__setitem__(2, 1))
    reject('nonplanar highlighted polygon', generic_model_checks,
           lambda c: model_of(c['theory-045'])['points']['_alpha0'].__setitem__(2, 3))
    reject('off-sphere surface arc endpoint', generic_model_checks,
           lambda c: model_of(c['ex-main-0388-a'])['points']['_sphereTop'].__setitem__(2, 7))
    reject('47 converse without line through contact', written_contract_checks,
           replace('theory-047', ['steps', 3, 'explanation'], 'прямая a проходит через T и ', ''))
    reject('46 area formula incorrectly attributed to point43', written_contract_checks,
           lambda c: c['theory-046']['steps'][-1]['justifications'][0].__setitem__('theoryId', 'theory-043'))
    reject('49 wrong contact circle center', actual_model_checks,
           lambda c: model_of(c['theory-049'])['points']['Q'].__setitem__(2, 2))
    reject('50 incorrect Dandelin focus', actual_model_checks,
           lambda c: model_of(c['theory-050'])['points']['F1'].__setitem__(0, -1))
    reject('51 wrong cone mesh slope', actual_model_checks,
           lambda c: model_of(c['theory-051'])['points']['_upperB0'].__setitem__(0, 3))
    reject('51 lost lower hyperbola branch', actual_model_checks,
           lambda c: [model_of(c['theory-051'])['points'].pop('_hyperL'+str(i)) for i in range(61)])
    return {'rejected': len(rejected), 'cases': rejected}


if __name__ == '__main__':
    families = parameter_checks()
    boundaries = boundary_checks()
    cards = load_cards()
    source = source_checks(cards)
    written = written_contract_checks(cards)
    models = generic_model_checks(cards)
    actual = actual_model_checks(cards)
    negative = negative_controls(cards)
    print(json.dumps({'verdict': 'PASS_INDEPENDENT_SPHERE_SOURCE_MATHEMATICS',
                      'sourceSha256': SOURCE_SHA256,
                      'parameterCases': sum(families.values()),
                      'casesByFamily': families,
                      'boundaryCases': sum(boundaries.values()),
                      'boundaryCasesByFamily': boundaries,
                      'source': source, 'genericModelChecks': models,
                      'writtenContracts': written,
                      'actualModelChecks': actual,
                      'negativeControls': negative}, ensure_ascii=False, indent=2))
