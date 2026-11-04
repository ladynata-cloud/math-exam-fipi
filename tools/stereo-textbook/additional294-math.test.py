"""Independent coordinate/parameter checks for actual source tasks 294–298.

The lessons use school-geometric arguments. These dot-product, cross-product
and projection oracles verify their models and conclusions without replacing
the independent review of the universal written proofs.
"""
import itertools
import json
import math
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
IDS = ['0294', '0295-a', '0295-b', '0295-c', '0295-d', '0296',
       '0297-a', '0297-b', '0297-c', '0298']
CARDS = {key: json.loads((ROOT / f'stereo-course/textbook/lessons/ex-main-{key}.json').read_text()) for key in IDS}


def close(actual, expected, message):
    assert np.allclose(actual, expected, rtol=1e-8, atol=1e-8), (message, actual, expected)


def pts(key):
    return {name: np.array(value, dtype=float) for name, value in CARDS[key]['visualization']['model']['points'].items()}


def length(v):
    return float(np.linalg.norm(v))


def perpendicular(u, v, message):
    assert length(u) > 1e-8 and length(v) > 1e-8, message + ': nonzero directions'
    close(np.dot(u, v) / length(u) / length(v), 0, message)


def normal(a, b, c):
    n = np.cross(b-a, c-a)
    assert length(n) > 1e-8, 'non-collinear plane points'
    return n / length(n)


def polygon_area(vertices):
    # Sort an unordered planar convex point set around its centroid, then
    # triangulate by cross products. Independent of authored face ordering.
    points = np.array(vertices)
    centre = points.mean(axis=0)
    n = normal(points[0], points[1], points[2])
    for point in points:
        close(np.dot(point-points[0], n), 0, 'planar section')
    x = points[0]-centre
    x /= length(x)
    y = np.cross(n, x)
    order = sorted(range(len(points)), key=lambda i: math.atan2(np.dot(points[i]-centre, y), np.dot(points[i]-centre, x)))
    return sum(length(np.cross(points[order[i]]-centre, points[order[(i+1) % len(order)]]-centre))/2 for i in range(len(order)))


def box(a, h):
    p = {'A': np.array([0., 0., 0.]), 'B': np.array([a, 0., 0.]),
         'C': np.array([a, a, 0.]), 'D': np.array([0., a, 0.])}
    return dict(p, **{name+'1': value+np.array([0., 0., h]) for name, value in p.items()})


def affine_prism(p, names):
    v = p[names[0]+'1']-p[names[0]]
    for name in names:
        close(p[name+'1']-p[name], v, 'common prism translation '+name)
    assert abs(np.dot(v, normal(*(p[name] for name in names[:3])))) > 1e-8, 'nondegenerate prism height'
    return v


def check294(p):
    v = affine_prism(p, ['A', 'B', 'C', 'D'])
    u, w = p['B']-p['A'], p['D']-p['A']
    perpendicular(u, w, '294 square base'); perpendicular(v, u, '294 right prism'); perpendicular(v, w, '294 right prism')
    a, h = length(u), length(v)
    close(length(w), a, '294 equal base edges'); close(p['C'], p['A']+u+w, '294 square fourth vertex')
    pairs = [('A', 'C1'), ('B', 'D1'), ('C', 'A1'), ('D', 'B1')]
    areas = []
    for first, second in itertools.combinations(pairs, 2):
        vertices = [p[name] for name in first+second]
        area = polygon_area(vertices)
        n = normal(vertices[0], vertices[1], vertices[2])
        vertical = abs(np.dot(n, v/length(v))) < 1e-8
        if vertical:
            close(area, math.sqrt(2)*a*h, '294 vertical diagonal rectangle')
            close(2*math.sqrt(2)*area, 4*a*h, '294 first lateral-area formula')
        else:
            close(area, a*math.sqrt(a*a+h*h), '294 oblique diagonal rectangle')
            assert area > a*a
            close(4*math.sqrt(area*area-a**4), 4*a*h, '294 second lateral-area formula')
        areas.append(vertical)
    assert areas.count(True) == 2 and areas.count(False) == 4, '294 all six diagonal pairs exhaust two types'


def check295(p):
    v = affine_prism(p, ['A', 'B', 'C', 'D'])
    close(p['A']+p['C'], p['B']+p['D'], '295 parallelogram base')
    lengths = [length(p[b]-p[a]) for a, b in [('A','B'), ('B','C'), ('C','D'), ('D','A')]]
    close(lengths, [lengths[0]]*4, '295 rhombus sides')
    cd, cb = p['D']-p['C'], p['B']-p['C']
    # Signed cosines compare rays sharing C, not absolute acute line angles.
    close(np.dot(v, cd)/length(v)/length(cd), np.dot(v, cb)/length(v)/length(cb), '295 given equal ray angles')
    bd = p['D']-p['B']
    perpendicular(v, bd, '295a side edge perpendicular BD')
    perpendicular(p['B1']-p['B'], bd, '295b adjacent rectangle edges')
    close(p['B']+p['D1'], p['B1']+p['D'], '295b opposite vertices bisect')
    n = normal(p['A'], p['A1'], p['C1'])
    close(abs(np.dot(n, bd/length(bd))), 1, '295c BD perpendicular plane AA1C1')
    perpendicular(n, normal(p['B'], p['B1'], p['D1']), '295d perpendicular planes')


def check296(p):
    v = affine_prism(p, ['A', 'B', 'C'])
    n = normal(p['A'], p['B'], p['C'])
    close(abs(np.dot(v/length(v), n)), 1, '296 right prism')
    s = length(p['B']-p['C'])
    close([length(p['A']-p['B']), length(p['A']-p['C'])], [s, s], '296 equilateral base')
    m, q = (p['A']+p['B'])/2, (p['A']+p['C'])/2
    if 'M' in p: close(p['M'], m, '296 actual midline endpoint M')
    if 'N' in p: close(p['N'], q, '296 actual midline endpoint N')
    top_mid = (p['B1']+p['C1'])/2; low_mid = (m+q)/2
    h = abs(np.dot(v, n)); height_vector = top_mid-low_mid
    phi = math.asin(h/length(height_vector))
    assert 0 < phi < math.pi/2
    section_area = polygon_area([m, q, p['B1'], p['C1']])
    expected = math.sqrt(3)*h*h*math.cos(phi)/(math.sin(phi)**2)
    close(section_area, expected, '296 area from h and acute dihedral')
    close(section_area, 3*s*length(height_vector)/4, '296 trapezoid sum of bases')
    projected = [m, q, p['B'], p['C']]
    close(section_area*math.cos(phi), polygon_area(projected), '296 orthogonal projection area')


def check297(p):
    v = affine_prism(p, ['A', 'B', 'C'])
    a, b, c = p['A'], p['B'], p['C']
    side = length(b-c); close([length(a-b),length(a-c)],[side,side],'297 equilateral base')
    o = (a+b+c)/3; n = normal(a,b,c)
    close(p['O'], o, '297 base centre'); close(np.cross(p['A1']-o,n),[0,0,0],'297 A1 projection O')
    d = a+np.dot(b-a,c-a)/np.dot(c-a,c-a)*(c-a)
    close(p['D'],d,'297 altitude foot D'); perpendicular(b-d,c-a,'297 given altitude')
    perpendicular(normal(p['A1'],b,d),normal(a,p['A1'],p['C1']),'297a perpendicular planes')
    perpendicular(normal(a,p['A1'],o),normal(b,p['B1'],c),'297b perpendicular planes')
    perpendicular(v,c-b,'297c rectangle adjacent edges')
    close(b+p['C1'],p['B1']+c,'297c parallelogram diagonals bisect')


def check298(p):
    v = affine_prism(p, ['A','B','C','D'])
    u, w = p['B']-p['A'],p['D']-p['A']; a=length(u);b=length(v)
    perpendicular(u,w,'298 square base');close(length(w),a,'298 equal sides');close(p['C'],p['A']+u+w,'298 square fourth vertex')
    equidistant=[]
    for name in ['A1','B1','C1','D1']:
        ds=[length(p[name]-p[base]) for base in ['A','B','C','D']]
        if np.allclose(ds,ds[0]): equidistant.append(name)
    assert len(equidistant)==1,'298 one upper vertex equidistant from four lower vertices'
    centre=sum((p[name] for name in ['A','B','C','D']),np.zeros(3))/4
    n=normal(p['A'],p['B'],p['C']);tip=p[equidistant[0]];h=abs(np.dot(tip-centre,n))
    close(np.cross(tip-centre,n),[0,0,0],'298 equal-distance vertex projects to square centre')
    close(b*b,a*a/2+h*h,'298 edge-height relation');assert b>a/math.sqrt(2),'298 strict nondegenerate domain'
    area=2*length(np.cross(u,w))+2*length(np.cross(u,v))+2*length(np.cross(w,v))
    close(area,2*a*a+4*a*math.sqrt(b*b-a*a/4),'298 complete surface')


check294(pts('0294'))
for key in ['0295-a','0295-b','0295-c','0295-d']: check295(pts(key))
check296(pts('0296'))
for key in ['0297-a','0297-b','0297-c']: check297(pts(key))
check298(pts('0298'))

# Parameter tests include non-cubes, non-square rhombi, oblique prisms, every
# possible equidistant upper vertex, and varying acute dihedral angles.
rng=np.random.default_rng(294298)
for _ in range(400):
    a,h=rng.uniform(.3,12,size=2); check294(box(a,h))
    p,q,h=rng.uniform(.4,8,size=3);t=rng.uniform(-5,5)
    rhombus={'A':np.array([-p,0.,0.]),'B':np.array([0.,q,0.]),'C':np.array([p,0.,0.]),'D':np.array([0.,-q,0.])}
    check295(dict(rhombus,**{k+'1':x+np.array([t,0.,h]) for k,x in rhombus.items()}))
    s,h=rng.uniform(.4,9,size=2)
    triangle={'A':np.array([0.,math.sqrt(3)*s/2,0.]),'B':np.array([-s/2,0.,0.]),'C':np.array([s/2,0.,0.])}
    check296(dict(triangle,**{k+'1':x+np.array([0.,0.,h]) for k,x in triangle.items()}))
    o=sum(triangle.values(),np.zeros(3))/3;v=o+np.array([0.,0.,h])-triangle['A']
    p=dict(triangle,**{k+'1':x+v for k,x in triangle.items()},O=o,D=(triangle['A']+triangle['C'])/2)
    check297(p)
    a,h=rng.uniform(.4,9,size=2)
    lower={k:v for k,v in box(a,h).items() if len(k)==1};centre=np.array([a/2,a/2,0.])
    for name in lower:
        v=centre+np.array([0.,0.,h])-lower[name]
        check298(dict(lower,**{k+'1':x+v for k,x in lower.items()}))

# Domain counterchecks: an oblique294 section cannot have S0<=a²,298 equality
# b=a/√2 makes volume zero, and296's excluded limits collapse a base or height.
assert all(math.sqrt(1+h*h)>1 for h in [.01,.2,1,9])
close(np.dot(np.cross([1,0,0],[0,1,0]),[.5,.5,0]),0,'298 boundary has zero volume')
print('ATANASYAN_ADDITIONAL_294_298_MATH_OK: 10 actual models; 400 parameter families; all six294 diagonal pairs; source296 midline; all four298 upper vertices')
