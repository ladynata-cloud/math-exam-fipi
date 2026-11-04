"""Independent geometry oracle for point37 and exercises281--287.

All transformations and sections are derived from actual authored coordinates.
A full orthogonal group is enumerated by images of one independent vertex triple;
axis/plane counts are not obtained by filtering a preselected list of axes.
"""
from collections import Counter
from functools import lru_cache
import itertools
import json
import math
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
D = ROOT / 'stereo-course/textbook/lessons'
EPS = 1e-7


def card(name):
    return json.loads((D / (name + '.json')).read_text())


def model(name):
    return card(name)['visualization']['model']


def points(m):
    return {k: np.array(v, dtype=float) for k, v in m['points'].items()}


def close(actual, expected, label='coordinate identity'):
    assert np.allclose(actual, expected, atol=EPS, rtol=EPS), (label, actual, expected)


def same_set(a, b):
    if len(a) != len(b):
        return False
    distances = np.linalg.norm(np.array(a)[:, None, :] - np.array(b)[None, :, :], axis=2)
    return bool(np.max(np.min(distances, axis=1)) < EPS and len(set(np.argmin(distances, axis=1))) == len(a))


def body(m):
    p = points(m)
    names = sorted({x for edge in m['edges'] for x in edge})
    return names, np.array([p[k] for k in names])


def area(polygon):
    return np.linalg.norm(sum((np.cross(polygon[i]-polygon[0], polygon[i+1]-polygon[0]) for i in range(1, len(polygon)-1)), np.zeros(3))) / 2


def section(p, edges, origin, normal):
    found = []
    def add(x):
        if not any(np.linalg.norm(x-y) < EPS for y in found):
            found.append(x)
    for u, v in edges:
        a, b = p[u], p[v]
        da, db = np.dot(a-origin, normal), np.dot(b-origin, normal)
        if abs(da) < EPS:
            add(a)
        if abs(db) < EPS:
            add(b)
        if da*db < -EPS:
            add(a + da/(da-db)*(b-a))
    assert len(found) >= 3
    center = np.mean(found, axis=0)
    x = found[0]-center; x /= np.linalg.norm(x)
    z = normal/np.linalg.norm(normal); y = np.cross(z, x)
    return np.array(sorted(found, key=lambda p: math.atan2(np.dot(p-center, y), np.dot(p-center, x))))


def displayed_polygon(m, expected, label):
    p = points(m)
    assert any(same_set([p[k] for k in v.get('polygon', [])], expected) for v in m['views'].values() if len(v.get('polygon', [])) == len(expected)), label+': actual section shown in a model view'


def regular_edges(m, count):
    p = points(m)
    lengths = [np.linalg.norm(p[a]-p[b]) for a, b in m['edges']]
    assert len(lengths) == count
    close(lengths, np.repeat(lengths[0], count), 'all regular-body edges equal')
    return lengths[0]


def halfturn(m, first, second, expected=True):
    p = points(m); _, v = body(m)
    direction = p[second]-p[first]; direction /= np.linalg.norm(direction)
    close(np.cross(np.mean(v, axis=0)-p[first], direction), np.zeros(3), 'drawn axis passes through body center')
    transformed = (v-p[first]) @ (2*np.outer(direction, direction)-np.eye(3)).T + p[first]
    assert same_set(v, transformed) is expected, ('actual drawn half-turn axis', first, second, expected)
    return direction


def mirror(m, view, expected=True):
    p = points(m); _, v = body(m)
    polygon = np.array([p[k] for k in m['views'][view]['polygon']])
    normal = np.cross(polygon[1]-polygon[0], polygon[2]-polygon[0]); normal /= np.linalg.norm(normal)
    close((polygon-polygon[0]) @ normal, np.zeros(len(polygon)), 'drawn mirror polygon planar')
    transformed = v-2*np.outer((v-polygon[0]) @ normal, normal)
    assert same_set(v, transformed) is expected, ('actual drawn mirror', view, expected)
    return polygon[0], normal


@lru_cache(maxsize=None)
def orthogonal_group(coordinates):
    v = np.array(coordinates, dtype=float)
    basis = next(np.array(t).T for t in itertools.combinations(v, 3) if abs(np.linalg.det(np.array(t).T)) > EPS)
    inverse = np.linalg.inv(basis)
    gram = basis.T @ basis
    matrices = {}
    for triple in itertools.permutations(v, 3):
        target = np.array(triple).T
        if not np.allclose(target.T @ target, gram, atol=EPS, rtol=EPS):
            continue
        transform = target @ inverse
        close(transform.T @ transform, np.eye(3), 'orthogonal candidate')
        if same_set(v @ transform.T, v):
            matrices[tuple(np.round(transform, 8).flat)] = transform
    return tuple(matrices.values())


expected_solids = {
    'tetrahedron': (4, 6, 4, 3, 24, 0, 3, 6),
    'cube': (8, 12, 6, 4, 48, 1, 9, 9),
    'octahedron': (6, 12, 8, 3, 48, 1, 9, 9),
    'icosahedron': (12, 30, 20, 3, 120, 1, 15, 15),
    'dodecahedron': (20, 30, 12, 5, 120, 1, 15, 15),
}
manifest = json.loads((ROOT/'tools/stereo-textbook/polyhedra-symmetry-manifest.json').read_text())
theory_ids = [name for name in manifest['cards'] if name.startswith('theory-037-')]
assert len(theory_ids) == 10
for name in theory_ids:
    solid = next(k for k in expected_solids if name.startswith('theory-037-'+k))
    vertices, edge_count, face_count, face_sides, order, centers, halfturns, mirrors = expected_solids[solid]
    m = model(name); p = points(m); names, v = body(m)
    assert (len(names), len(m['edges']), len(m['faces'])) == (vertices, edge_count, face_count), name
    a = regular_edges(m, edge_count)
    perimeter = Counter(tuple(sorted((f[i], f[(i+1) % len(f)]))) for f in m['faces'] for i in range(len(f)))
    declared = {tuple(sorted(edge)) for edge in m['edges']}
    assert set(perimeter) == declared and set(perimeter.values()) == {2}, name+': closed edge/face incidence'
    for face in m['faces']:
        assert len(face) == face_sides
        polygon = np.array([p[k] for k in face]); n = np.cross(polygon[1]-polygon[0], polygon[2]-polygon[0]); n /= np.linalg.norm(n)
        close((polygon-polygon[0]) @ n, np.zeros(face_sides), name+': planar face')
        distances = (v-polygon[0]) @ n
        assert max(distances) < EPS or min(distances) > -EPS, name+': supporting face'
        for i in range(face_sides):
            u, w = polygon[i-1]-polygon[i], polygon[(i+1) % face_sides]-polygon[i]
            close(np.dot(u, w)/(np.linalg.norm(u)*np.linalg.norm(w)), math.cos(math.pi*(face_sides-2)/face_sides), name+': regular face')
    center = np.mean(v, axis=0); centered = v-center
    group = orthogonal_group(tuple(tuple(float(x) for x in row) for row in centered))
    counts = Counter()
    face_sets = {frozenset(face) for face in m['faces']}
    for transform in group:
        det, trace = round(np.linalg.det(transform)), np.trace(transform)
        if det == 1 and abs(trace+1) < EPS:
            counts['halfturn'] += 1
        if det == -1 and abs(trace-1) < EPS:
            counts['mirror'] += 1
        if np.allclose(transform, -np.eye(3), atol=EPS):
            counts['center'] += 1
        targets = centered @ transform.T
        permutation = {names[i]: names[int(np.argmin(np.linalg.norm(centered-target, axis=1)))] for i, target in enumerate(targets)}
        assert {tuple(sorted((permutation[a], permutation[b]))) for a, b in declared} == declared
        assert {frozenset(permutation[k] for k in f) for f in m['faces']} == face_sets
    assert (len(group), counts['center'], counts['halfturn'], counts['mirror']) == (order, centers, halfturns, mirrors), (name, len(group), counts)
    if centers:
        rotations = [t for t in group if np.linalg.det(t)>0 and abs(np.trace(t)+1)<EPS]
        for t in rotations:
            assert any(np.allclose(-t, s, atol=EPS) for s in group if np.linalg.det(s)<0 and abs(np.trace(s)-1)<EPS), name+': axis-perpendicular mirror via central inversion'
    print(name, 'group', len(group), 'center/halfturn/mirror', counts['center'], counts['halfturn'], counts['mirror'])

# Validate the displayed helpers independently of the full solid/group counts.
m=model('theory-037-tetrahedron-center');p=points(m);_,v=body(m)
close(p['M'],(p['A']+p['B'])/2);close(p['N'],(p['C']+p['D'])/2)
assert np.linalg.norm(p['M']-p['N'])>EPS
close(p['O'],np.mean(v,axis=0));close(p['A1'],2*p['O']-p['A'])
assert not any(np.linalg.norm(p['A1']-q)<EPS for q in v)
m=model('theory-037-tetrahedron-axes');p=points(m)
for first,second,left,right in [('M','N','AB','CD'),('K','L','AC','BD'),('E','F','AD','BC')]:
    close(p[first],(p[left[0]]+p[left[1]])/2);close(p[second],(p[right[0]]+p[right[1]])/2)
    halfturn(m,first,second)
m=model('theory-037-tetrahedron-planes');p=points(m)
close(p['M'],(p['C']+p['D'])/2);close(p['N'],(p['A']+p['B'])/2)
mirror(m,'mirror');mirror(m,'other')
m=model('theory-037-cube-center');p=points(m);_,v=body(m)
close(p['O'],np.mean(v,axis=0));assert same_set(v,2*p['O']-v)
for x,y in [('A','C1'),('B','D1'),('A1','C'),('D','B1')]:close((p[x]+p[y])/2,p['O'])
m=model('theory-037-cube-axes');p=points(m)
halfturn(m,'E','F');halfturn(m,'M','N');halfturn(m,'A','C1',False)
close(p['M'],(p['A']+p['B'])/2);close(p['N'],(p['C1']+p['D1'])/2)
face_centers=[np.mean([p[k] for k in f],axis=0) for f in m['faces']]
assert all(any(np.linalg.norm(p[k]-center)<EPS for center in face_centers) for k in ['E','F'])
m=model('theory-037-cube-planes');p=points(m)
_,normal=mirror(m,'middle');mirror(m,'diagonal');mirror(m,'normal')
close(np.cross(p['V']-p['U'],normal),np.zeros(3),'displayed axis normal to its mirror')
m=model('theory-037-octahedron');p=points(m);_,v=body(m)
close(p['O'],np.mean(v,axis=0))
for x,y in [('A','C'),('B','D'),('S','T')]:close((p[x]+p[y])/2,p['O'])
close(p['M'],(p['A']+p['B'])/2);close(p['N'],(p['C']+p['D'])/2)
halfturn(m,'S','T');halfturn(m,'M','N');origin,normal=mirror(m,'plane')
close(np.cross(p['S']-p['T'],normal),np.zeros(3))
displayed_polygon(m,section(p,m['edges'],origin,normal),'actual octahedron mirror section')
ico=model('theory-037-icosahedron');ip=points(ico);_,iv=body(ico)
close(ip['O'],np.mean(iv,axis=0))
for name in ['A','B','C','D','E','F']:close((ip[name]+ip[name+'1'])/2,ip['O'])
close(ip['M'],(ip['A']+ip['B'])/2);close(ip['N'],(ip['A1']+ip['B1'])/2)
close(ip['X'],(ip['C']+ip['F1'])/2);close(ip['Y'],(ip['F']+ip['C1'])/2)
halfturn(ico,'M','N');origin,normal=mirror(ico,'plane')
close(np.cross(ip['M']-ip['N'],normal),np.zeros(3))
displayed_polygon(ico,section(ip,ico['edges'],origin,normal),'actual icosahedron mirror section')
neighbor_names=ico['views']['neighbors']['polygon']
actual_neighbors={b if a=='A' else a for a,b in ico['edges'] if 'A' in (a,b)}
assert set(neighbor_names)==actual_neighbors and len(actual_neighbors)==5
pentagon=np.array([ip[k] for k in neighbor_names]);n=np.cross(pentagon[1]-pentagon[0],pentagon[2]-pentagon[0]);n/=np.linalg.norm(n)
close((pentagon-pentagon[0])@n,np.zeros(5))
side=np.linalg.norm(pentagon[1]-pentagon[0])
for i in range(5):
    a,b=pentagon[i-1]-pentagon[i],pentagon[(i+1)%5]-pentagon[i]
    close([np.linalg.norm(a),np.linalg.norm(b)],[side,side]);close(np.dot(a,b)/(side*side),math.cos(3*math.pi/5),'regular neighbor pentagon')
m=model('theory-037-dodecahedron');p=points(m);_,v=body(m)
close(p['O'],np.mean(v,axis=0));close((p['G7']+p['G18'])/2,p['O'])
ico_centroids=np.array([np.mean([ip[k] for k in f],axis=0) for f in ico['faces']])
assert same_set(v,ico_centroids),'actual dodecahedron vertices are all20actual icosahedron face centers'
dual=m['views']['dual']['polygon'];assert frozenset(dual) in {frozenset(f) for f in m['faces']}
close(p['J'],np.mean([p[k] for k in dual],axis=0),'actual J is pentagon center')
close(p['V'],ip['A']);close(np.cross(p['J']-p['O'],p['V']-p['O']),np.zeros(3),'actual O,J,V collinear')
scale=np.dot(p['J']-p['O'],p['V']-p['O'])/np.dot(p['V']-p['O'],p['V']-p['O']);assert scale>0
recovered=np.array([np.mean([p[k] for k in f],axis=0) for f in m['faces']])
assert same_set(recovered,iv*scale),'all12dodecahedron face centers recover the scaled icosahedron'
assert tuple(sorted(['G6','G7'])) in {tuple(sorted(e)) for e in m['edges']}
close(p['M'],(p['G6']+p['G7'])/2);close(p['N'],2*p['O']-p['M']);halfturn(m,'M','N')
origin,normal=mirror(m,'plane');close(np.cross(p['M']-p['N'],normal),np.zeros(3))
displayed_polygon(m,section(p,m['edges'],origin,normal),'actual dodecahedron mirror section')

# Source erratum uses the actual drawn axes, polygon and reflected helper points.
m=model('theory-037-cube-plane-correction');p=points(m);_,v=body(m)
u=halfturn(m,'U','U1');w=halfturn(m,'V','V1');origin,n=mirror(m,'plane',False)
close(np.cross(n,np.cross(u,w)),np.zeros(3),'erroneous plane is the span of the two drawn axes')
close([(p[k]-origin)@n for k in ['O','U','U1','V','V1','H']],np.zeros(6),'drawn axes and projection foot lie in plane')
mirror(m,'reflection',False)
reflected=p['C1']-2*np.dot(p['C1']-origin,n)*n
close(p['P'],reflected,'actual helper P is reflection of actual C1')
close(2*p['H'],p['C1']+p['P'],'actual foot H is reflection-segment midpoint')
close(np.cross(p['C1']-p['H'],n),np.zeros(3),'C1H is normal to actual plane')
assert any(p['P'][i]<min(v[:,i])-EPS or p['P'][i]>max(v[:,i])+EPS for i in range(3)), 'reflected P outside cube'
close(p['P'],[5/3,1/3,1/3],'explicit erratum counterexample')

#281: alternate cube vertices make a tetrahedron; areas are computed by triangles.
m = model('ex-main-0281'); p = points(m); a = regular_edges(m, 12)
tetra = ['D1', 'A', 'B1', 'C']
close([np.linalg.norm(p[u]-p[v]) for u, v in itertools.combinations(tetra, 2)], np.repeat(a*math.sqrt(2), 6))
cube_area = sum(area(np.array([p[k] for k in f])) for f in m['faces'])
tetra_area = sum(area(np.array([p[k] for k in f])) for f in itertools.combinations(tetra, 3))
close(cube_area/tetra_area, math.sqrt(3), '281 surface ratio cube/tetrahedron')

#282: every two incident octahedron edges outside one face meet at90degrees.
m = model('ex-main-0282'); p = points(m); a = regular_edges(m, 12)
names, v = body(m); assert len(names) == 6
count = 0
for vertex in names:
    adjacent = [b if x == vertex else x for x, b in m['edges'] if vertex in (x, b)]
    assert len(adjacent) == 4
    for left, right in itertools.combinations(adjacent, 2):
        if any({vertex, left, right}.issubset(f) for f in m['faces']):
            continue
        close(np.dot(p[left]-p[vertex], p[right]-p[vertex]), 0, '282 all eligible edge pairs')
        count += 1
assert count == 12, '282 complete case enumeration at all six vertices'
close(np.linalg.norm(p['A']-p['C']), a*math.sqrt(2))
close(np.dot(p['A']-p['P'], p['C']-p['P']), 0, '282 displayed pair PA,PC')

#283: derive both complete sections from edge/plane intersections through G.
for suffix, factor in [('a', math.sqrt(3)/9), ('b', math.sqrt(2)/9)]:
    m = model('ex-main-0283-'+suffix); p = points(m); a = regular_edges(m, 6)
    g = (p['A']+p['B']+p['C'])/3
    normal = np.cross(p['B']-p['D'], p['C']-p['D']) if suffix == 'a' else p['D']-p['A']
    cut = section(p, m['edges'], g, normal)
    assert len(cut) == 3
    close(area(cut), factor*a*a, '283'+suffix+' actual section area')
    wanted = [p['A']+2*(p['B']-p['A'])/3, p['A']+2*(p['C']-p['A'])/3, p['A']+(2 if suffix=='a' else 1)*(p['D']-p['A'])/3]
    assert same_set(cut, wanted), '283'+suffix+' exact three edge fractions'
    displayed_polygon(m, cut, '283'+suffix)
    sides = sorted(np.linalg.norm(cut[i]-cut[(i+1)%3]) for i in range(3))
    if suffix == 'a':
        close(sides, np.repeat(2*a/3, 3), '283a equilateral section')
    else:
        close(sides, [a/math.sqrt(3), a/math.sqrt(3), 2*a/3], '283b isosceles non-equilateral section')
        assert max(sides)-min(sides)>EPS, '283b must not be called regular'

#284: at half the original edge, truncation leaves an octahedron, not hexagonal faces.
m = model('ex-main-0284'); p = points(m)
tetra = ['A', 'B', 'C', 'D']; original_edges = list(itertools.combinations(tetra, 2))
close([np.linalg.norm(p[a]-p[b]) for a,b in original_edges], np.repeat(2., 6), '284 given tetrahedron edge2')
midpoints = np.array([(p[a]+p[b])/2 for a,b in original_edges]); o=np.mean(midpoints,axis=0)
assert same_set(midpoints, 2*o-midpoints)
pair_lengths = [np.linalg.norm(a-b) for a,b in itertools.combinations(midpoints,2)]
assert sum(abs(x-1)<EPS for x in pair_lengths)==12 and sum(abs(x-math.sqrt(2))<EPS for x in pair_lengths)==3
faces=[]
for triple in itertools.combinations(midpoints,3):
    polygon=np.array(triple);normal=np.cross(polygon[1]-polygon[0],polygon[2]-polygon[0]);normal/=np.linalg.norm(normal)
    d=(midpoints-polygon[0])@normal
    if max(d)<EPS or min(d)>-EPS:
        close([np.linalg.norm(a-b) for a,b in itertools.combinations(polygon,2)],np.ones(3));faces.append(polygon)
assert len(faces)==8, '284 eight regular triangular supporting faces'
assert all(any(np.linalg.norm(v-q)<EPS for q in p.values()) for v in midpoints), '284 all six actual midpoint constructions exist'
midpoint_names = {k for k, value in p.items() if any(np.linalg.norm(value-v)<EPS for v in midpoints)}
assert len(midpoint_names) == 6
expected_edges = {tuple(sorted((x, y))) for x, y in itertools.combinations(midpoint_names, 2) if abs(np.linalg.norm(p[x]-p[y])-1)<EPS}
for view in ['all', 'result']:
    assert {tuple(sorted(e)) for e in m['views'][view]['segments']} == expected_edges, '284 displayed remaining octahedron has exactly12edges'

#285--286: enumerate all six face-center distances, then derive the altitude relation.
for name in ['ex-main-0285','ex-main-0286-a','ex-main-0286-b']:
    m=model(name);p=points(m);a=regular_edges(m,6)
    centroids=[sum((p[k] for k in f),np.zeros(3))/3 for f in m['faces']]
    close([np.linalg.norm(g-h) for g,h in itertools.combinations(centroids,2)],np.repeat(a/3,6),name+': ALL face-center segments')
    g=(p['A']+p['B']+p['C'])/3;h=(p['D']+p['B']+p['C'])/3
    close(h-g,(p['D']-p['A'])/3,name+': parallel centroid connector')
    if name=='ex-main-0286-a':
        close(p['O'],g);normal=np.cross(p['B']-p['A'],p['C']-p['A']);normal/=np.linalg.norm(normal)
        height=abs(np.dot(p['D']-g,normal));close(p['D']-g,np.dot(p['D']-g,normal)*normal)
        close(a,height*math.sqrt(6)/2,'286a m(h)')
    else:
        close(p['G'],g);close(p['H'],h)

#287: distinguish vertex, adjacent-center and opposite-plane distances.
for suffix in ['a','b','c']:
    m=model('ex-main-0287-'+suffix);p=points(m);a=regular_edges(m,12)
    _,v=body(m);o=np.mean(v,axis=0);assert len(v)==6 and same_set(v,2*o-v)
    close(np.linalg.norm(p['S']-p['T']),a*math.sqrt(2),'287a opposite vertices')
    centroids=[sum((p[k] for k in f),np.zeros(3))/3 for f in m['faces']]
    adjacent=[]
    for i,j in itertools.combinations(range(len(m['faces'])),2):
        if len(set(m['faces'][i]) & set(m['faces'][j]))==2:
            adjacent.append(np.linalg.norm(centroids[i]-centroids[j]))
    assert len(adjacent)==12;close(adjacent,np.repeat(a*math.sqrt(2)/3,12),'287b every adjacent face-center distance')
    g=(p['S']+p['A']+p['B'])/3
    if suffix=='b':
        h=(p['T']+p['A']+p['B'])/3;close(p['G'],g);close(p['H'],h);close(h-g,(p['T']-p['S'])/3)
    if suffix=='c':
        h=(p['T']+p['C']+p['D'])/3;close(p['G'],g);close(p['H'],h);close((g+h)/2,o)
        normal=np.cross(p['A']-p['S'],p['B']-p['S']);normal/=np.linalg.norm(normal)
        close(g-h,np.dot(g-h,normal)*normal,'287c common perpendicular connects opposite face centers')
        distance=abs(np.dot(g-h,normal));close(distance,a*math.sqrt(6)/3,'287c distance between opposite face planes')
        close(np.linalg.norm(g-o),a*math.sqrt(6)/6,'287c inradius is HALF opposite-plane distance')
        for f,c in zip(m['faces'],centroids):
            n=np.cross(p[f[1]]-p[f[0]],p[f[2]]-p[f[0]]);n/=np.linalg.norm(n)
            close(abs(np.dot(o-p[f[0]],n)),a*math.sqrt(6)/6,'287c all face-plane distances from center')

print('ATANASYAN_POLYHEDRA_SYMMETRY_MATH_OK: full orthogonal groups, cube erratum,11exercise cases and actual sections/distances')
