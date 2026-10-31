#!/usr/bin/env python3
"""Independent targeted regression for the two-sphere argument in point 51.

No author generator or existing sphere oracle is imported. Sphere centers and
section points are solved from distances/projections and quadratic intersections.
This checks the mathematics and actual model coordinates, not prose keywords or
browser pixels. The separate source/text review remains necessary.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

EPS = 2e-8
AXIS = (0.0, 0.0, 1.0)


def add(a, b): return tuple(x+y for x, y in zip(a, b))
def sub(a, b): return tuple(x-y for x, y in zip(a, b))
def mul(a, t): return tuple(x*t for x in a)
def dot(a, b): return sum(x*y for x, y in zip(a, b))
def norm(a): return math.sqrt(dot(a, a))
def distance(a, b): return norm(sub(a, b))
def cross(a, b):
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
def unit(a): return mul(a, 1/norm(a))


def near(actual, expected, label, scale=1.0):
    assert math.isfinite(actual) and math.isfinite(expected), label
    assert abs(actual-expected) <= EPS*max(scale, abs(actual), abs(expected)), (label, actual, expected)


def coefficients(function):
    """Recover a quadratic by three evaluations of an independent geometry function."""
    zero, plus, minus = function(0.0), function(1.0), function(-1.0)
    return ((plus+minus)/2-zero, (plus-minus)/2, zero)


def roots(a, b, c):
    if abs(a) < 1e-10:
        assert abs(b) > 1e-10, 'nondegenerate linear intersection must remain'
        return [-c/b]
    discriminant = b*b-4*a*c
    assert discriminant >= -EPS*max(1.0, b*b, abs(4*a*c)), 'chosen section line must intersect'
    q = -.5*(b+math.copysign(math.sqrt(max(0.0, discriminant)), b))
    assert abs(q) > 1e-14, 'nonzero plane offset excludes a zero center/root here'
    return sorted([q/a, c/q])


def cone_residual(point, theta):
    axial = dot(point, AXIS)
    radial = sub(point, mul(AXIS, axial))
    return dot(radial, radial)-axial*axial*math.tan(theta)**2


def verify_section_point(point, normal, h, theta):
    near(dot(point, normal), h, 'point belongs to the secant plane')
    near(cone_residual(point, theta), 0, 'point belongs to the cone',
         1+dot(point, point)*(1+math.tan(theta)**2))


def plane_basis(normal):
    projected_axis = sub(AXIS, mul(normal, dot(AXIS, normal)))
    if norm(projected_axis) < 1e-10:
        projected_axis = sub((1.0, 0.0, 0.0), mul(normal, normal[0]))
    u = unit(projected_axis)
    return u, unit(cross(normal, u))


def section_points(normal, h, theta, kind):
    """Intersect the cone with five lines in an orthonormal frame of the plane."""
    origin, (u, v) = mul(normal, h), plane_basis(normal)
    at = lambda x, y: add(origin, add(mul(u, x), mul(v, y)))
    a, b, c = coefficients(lambda x: cone_residual(at(x, 0), theta))
    if kind in ('ellipse', 'circle'):
        assert a > 0, 'elliptic section has positive quadratic coefficient'
        maximum_v = math.sqrt((b*b-4*a*c)/(4*a))
        offsets = [fraction*maximum_v for fraction in (-.9, -.45, 0, .3, .85)]
    else:
        offsets = [fraction*abs(h) for fraction in (-2.2, -.65, 0, .4, 1.8)]
        assert abs(a) < 1e-10 if kind == 'parabola' else a < 0
    points = []
    for offset in offsets:
        line_coefficients = coefficients(lambda x: cone_residual(at(x, offset), theta))
        values = roots(*line_coefficients)
        assert len(values) == (1 if kind == 'parabola' else 2)
        points.extend(at(value, offset) for value in values)
    return points


def sphere_centers(normal, h, theta):
    generator = (math.sin(theta), 0.0, math.cos(theta))
    def tangency_equation(t):
        center = mul(AXIS, t)
        radius_vector = sub(center, mul(generator, dot(center, generator)))
        return (dot(normal, center)-h)**2-dot(radius_vector, radius_vector)
    quadratic = coefficients(tangency_equation)
    return roots(*quadratic), quadratic


def sphere_geometry(t, normal, h, theta):
    center = mul(AXIS, t)
    generator = (math.sin(theta), 0.0, math.cos(theta))
    contact = mul(generator, dot(center, generator))
    radius = distance(center, contact)
    signed_side = dot(normal, center)-h
    near(abs(signed_side), radius, 'sphere tangent to the secant plane')
    assert radius > EPS, 'nondegenerate Dandelin sphere'
    focus = sub(center, mul(normal, signed_side))
    near(dot(normal, focus), h, 'orthogonal projection is the plane contact')
    near(distance(center, focus), radius, 'focus belongs to the sphere')
    return {'t': t, 'center': center, 'radius': radius, 'focus': focus, 'side': signed_side}


def contact_on_full_generator(sphere, point, supplied_contact=None):
    generator = unit(point)
    contact = mul(generator, dot(sphere['center'], generator))
    if supplied_contact is not None:
        near(distance(contact, supplied_contact), 0, 'contact is on the full generator, without ray clipping')
        contact = supplied_contact
    near(distance(sphere['center'], contact), sphere['radius'], 'generator tangent to sphere')
    near(dot(sub(sphere['center'], contact), generator), 0, 'radius normal to generator')
    near(distance(point, sphere['focus']), distance(point, contact), 'equal tangent lengths')
    return contact


def directrix(normal, h, contact_height):
    """Intersection of two planes, obtained by solving their 2x2 Gram system."""
    cosine = dot(normal, AXIS)
    determinant = 1-cosine*cosine
    assert determinant > 1e-10, 'circle case has no directrix from parallel planes'
    first = (h-cosine*contact_height)/determinant
    second = (contact_height-cosine*h)/determinant
    origin = add(mul(normal, first), mul(AXIS, second))
    return origin, unit(cross(normal, AXIS))


def line_distance(point, origin, direction):
    return norm(sub(sub(point, origin), mul(direction, dot(sub(point, origin), direction))))


def focal_identity(point, spheres, contact_gap, mode):
    lengths = [distance(point, sphere['focus']) for sphere in spheres]
    actual = sum(lengths) if mode == 'sum' else abs(lengths[0]-lengths[1])
    near(actual, contact_gap, mode+' focal invariant')


def verify_family(theta_degrees, phi_degrees, h, normal=None, name=None):
    theta, phi = math.radians(theta_degrees), math.radians(phi_degrees)
    assert 0 < theta < math.pi/2 and h != 0
    normal = normal or (math.cos(phi), 0.0, math.sin(phi))
    near(norm(normal), 1, 'unit plane normal')
    near(dot(normal, AXIS), math.sin(phi), 'specified line-plane angle')
    kind = ('circle' if abs(phi-math.pi/2) < 1e-10 else
            'parabola' if abs(phi-theta) < 1e-10 else
            'ellipse' if phi > theta else 'hyperbola')
    values, quadratic = sphere_centers(normal, h, theta)
    assert len(values) == (1 if kind == 'parabola' else 2)
    # These formulas are checked against independently solved distance equations.
    written = [h/(math.sin(phi)+math.sin(theta))]
    if kind != 'parabola': written.append(h/(math.sin(phi)-math.sin(theta)))
    for actual, expected in zip(sorted(values), sorted(written)):
        near(actual, expected, 'written sphere center agrees with geometric roots')
    spheres = [sphere_geometry(t, normal, h, theta) for t in values]
    if kind == 'parabola':
        near(quadratic[0], 0, 'parabola tangency equation is linear')
        assert abs(quadratic[1]) > EPS, 'linear equation has exactly one finite sphere'
    elif kind in ('ellipse', 'circle'):
        assert values[0]*values[1] > 0, 'elliptic spheres occupy the same nappe'
        assert spheres[0]['side']*spheres[1]['side'] < 0, 'elliptic spheres lie on opposite plane sides'
    else:
        assert values[0]*values[1] < 0, 'hyperbolic spheres occupy different nappes'
        assert all(sphere['side']*(-h) > 0 for sphere in spheres), 'hyperbolic spheres share the vertex side'
    points = section_points(normal, h, theta, kind)
    directrix_checks, branch_signs = 0, {}
    for point in points:
        verify_section_point(point, normal, h, theta)
        generator = unit(point)
        contacts = [contact_on_full_generator(sphere, point) for sphere in spheres]
        for sphere, contact in zip(spheres, contacts):
            assert (dot(normal, contact)-h)*sphere['side'] > 0, 'contact is strictly on its sphere side'
            near(dot(contact, AXIS), sphere['t']*math.cos(theta)**2, 'contact-circle plane height')
            if kind != 'circle':
                origin, direction = directrix(normal, h, dot(contact, AXIS))
                md = line_distance(point, origin, direction)
                assert md > EPS and line_distance(sphere['focus'], origin, direction) > EPS, 'nonzero point and focus directrix distances'
                vertical = abs(dot(sub(point, contact), AXIS))
                near(vertical, distance(point, contact)*math.cos(theta), 'generator projection')
                near(vertical, md*math.cos(phi), 'plane-to-directrix projection')
                near(distance(point, sphere['focus'])/md, math.cos(phi)/math.cos(theta), 'focal-directrix eccentricity')
                directrix_checks += 1
        if len(spheres) == 2:
            separation = distance(*contacts)
            near(separation, abs(values[1]-values[0])*math.cos(theta), 'constant contact separation')
            focus_gap = distance(spheres[0]['focus'], spheres[1]['focus'])
            near(focus_gap, abs(values[1]-values[0])*math.cos(phi), 'projected center separation')
            order_product = math.prod(dot(sub(point, contact), generator) for contact in contacts)
            if kind in ('ellipse', 'circle'):
                assert order_product < 0 and focus_gap < separation, 'M between contacts; nondegenerate ellipse sum'
                focal_identity(point, spheres, separation, 'sum')
                if kind == 'circle': near(focus_gap, 0, 'circle foci coincide')
            else:
                assert order_product > 0 and focus_gap > separation, 'M outside contacts; nondegenerate hyperbola difference'
                focal_identity(point, spheres, separation, 'difference')
                difference = distance(point, spheres[0]['focus'])-distance(point, spheres[1]['focus'])
                branch_signs.setdefault(math.copysign(1, point[2]), set()).add(math.copysign(1, difference))
    if kind == 'hyperbola':
        assert set(branch_signs) == {-1.0, 1.0}, 'quadratic intersections cover both nappes'
        assert all(len(signs) == 1 for signs in branch_signs.values())
        assert branch_signs[-1.0] != branch_signs[1.0], 'signed focal difference reverses between branches'
    return {'name': name or f'{theta_degrees}/{phi_degrees}/{h}', 'kind': kind,
            'thetaDegrees': theta_degrees, 'phiDegrees': phi_degrees, 'h': h,
            'sphereCenters': values, 'sphereSignedSides': [s['side'] for s in spheres],
            'sectionPoints': len(points), 'directrixChecks': directrix_checks}, (normal, h, theta, spheres, points)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', type=Path, help='Optional scratch JSON result; no repository mutation by default.')
    args = parser.parse_args()
    families = [(20,65,.7), (37,58,-1.3), (64,78,2.9), (45,90,1.1),
                (20,0,.9), (45,0,1), (35,12,-2.2), (64,43,3.1),
                (45,44,.8), (45,46,-.8), (15,15,.7), (45,45,-1.8), (70,70,2.6)]
    results, records = [], []
    for family in families:
        result, record = verify_family(*family)
        results.append(result); records.append(record)

    lesson_path = Path(__file__).resolve().parents[2]/'stereo-course/textbook/lessons/theory-051.json'
    raw = lesson_path.read_bytes()
    model = json.loads(raw)['visualization']['model']; p = model['points']
    # Bind a further two-sphere family to the existing figure, deriving its plane
    # from three sampled section points rather than the author helper/formulas.
    first, second, third = [p['_ellipse'+str(i)] for i in range(3)]
    normal = unit(cross(sub(second, first), sub(third, first)))
    if dot(normal, AXIS) < 0: normal = mul(normal, -1)
    h = dot(normal, first)
    actual_theta = math.degrees(math.acos(abs(dot(unit(sub(p['M'], p['P'])), AXIS))))
    actual_phi = math.degrees(math.asin(dot(normal, AXIS)))
    result, actual = verify_family(actual_theta, actual_phi, h, normal, 'actual theory-051 ellipse plane')
    results.append(result)
    existing_sphere = model['spheres'][0]
    assert any(distance(existing_sphere['center'], s['center']) < EPS for s in actual[3]), 'drawn sphere is one of the two independently constructed spheres'
    drawn = min(actual[3], key=lambda s: distance(s['center'], existing_sphere['center']))
    near(distance(drawn['focus'], p['F']), 0, 'drawn focus agrees with independent plane projection')

    negative_controls = []
    def reject(name, check):
        try: check()
        except AssertionError: negative_controls.append(name)
        else: raise AssertionError('negative control accepted: '+name)
    normal, h, theta, spheres, points = records[6]
    wrong = -spheres[0]['t']
    reject('wrong-side replacement sphere', lambda: sphere_geometry(wrong, normal, h, theta))
    gap = distance(*(contact_on_full_generator(s, points[0]) for s in spheres))
    reject('hyperbola focal sum mistaken for absolute difference', lambda: focal_identity(points[0], spheres, gap, 'sum'))
    opposite = next(s for s in spheres if dot(s['center'], points[0]) < 0)
    generator = unit(points[0])
    clipped = mul(generator, abs(dot(opposite['center'], generator)))
    reject('contact incorrectly clipped to the ray containing M', lambda: contact_on_full_generator(opposite, points[0], clipped))
    _, _, _, ellipse_spheres, ellipse_points = records[0]
    ellipse_gap = distance(*(contact_on_full_generator(s, ellipse_points[0]) for s in ellipse_spheres))
    reject('ellipse absolute difference mistaken for sum', lambda: focal_identity(ellipse_points[0], ellipse_spheres, ellipse_gap, 'difference'))
    normal, h, theta, spheres, _ = records[11]
    reject('invented second finite parabolic sphere', lambda: sphere_geometry(spheres[0]['t']+1, normal, h, theta))

    # In the actual hyperbola plane x=1, both asymptotes are missing from the
    # curve: x²+y²-z² is exactly 1, not 0. Parallel projection generators also
    # have no finite intersection with that offset plane.
    near(p['_hyperU0'][0], 1, 'actual upper hyperbola plane offset')
    near(p['_hyperL0'][0], 1, 'actual lower hyperbola plane offset')
    asymptote_points = [(1.0, y, sign*y) for y in (-3.0, -.5, 0, 2.75) for sign in (-1,1)]
    for point in asymptote_points:
        near(cone_residual(point, math.pi/4), 1, 'x=1 asymptote cone residual is one')
    reject('asymptote accepted as section curve', lambda: verify_section_point(asymptote_points[0], (1,0,0), 1, math.pi/4))
    for sign in (-1,1):
        generator = unit((0.0, 1.0, float(sign)))
        near(dot((1,0,0), generator), 0, 'asymptotic generator parallel to x=1')
        assert dot((1,0,0), mul(generator, 4.0)) != 1, 'no finite projected point on offset plane'

    report = {'verdict':'SPHERE_CONICS_FOLLOWUP_OK', 'method':'Independent vector projections, distance quadratics and plane/cone intersections; no text keyword checks or author generators.',
              'lessonSha256':hashlib.sha256(raw).hexdigest(), 'testSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              'families':results, 'familyCount':len(results), 'sectionPointCount':sum(r['sectionPoints'] for r in results),
              'directrixChecks':sum(r['directrixChecks'] for r in results), 'asymptoteResidualOneChecks':len(asymptote_points),
              'negativeControls':negative_controls, 'negativeControlCount':len(negative_controls),
              'limits':['Targeted mathematical regression, not an independent prose approval or rendered visual review.', 'The original sphere-math oracle is neither imported nor modified.']}
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
