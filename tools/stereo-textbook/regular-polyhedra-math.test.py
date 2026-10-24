"""Coordinate regressions for the continuation of points 35–36 and tasks 279–280.

Derives incidence, symmetry and section areas from actual authored coordinates.
Uses numpy only. This test is not a source/pedagogy review or a learning study.
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


def model(name):
    return json.loads((D / (name + '.json')).read_text())['visualization']['model']


def points(m):
    return {k: np.array(v, dtype=float) for k, v in m['points'].items()}


def close(a, b, message='coordinate equality'):
    assert np.allclose(a, b, atol=EPS, rtol=EPS), (message, a, b)


def same_set(a, b):
    return len(a) == len(b) and all(any(np.linalg.norm(x-y) < EPS for y in b) for x in a)


def area(v):
    return np.linalg.norm(sum((np.cross(v[i]-v[0], v[i+1]-v[0]) for i in range(1, len(v)-1)), np.zeros(3))) / 2


def section(vertices, edges, p0, normal):
    found = []
    for u, v in edges:
        a, b = vertices[u], vertices[v]
        da, db = np.dot(a-p0, normal), np.dot(b-p0, normal)
        for x, dx in [(a, da), (b, db)]:
            if abs(dx) < EPS and not any(np.linalg.norm(x-q) < EPS for q in found):
                found.append(x)
        if da*db < -EPS:
            x = a + da/(da-db)*(b-a)
            if not any(np.linalg.norm(x-q) < EPS for q in found):
                found.append(x)
    assert len(found) >= 3
    center = np.mean(found, axis=0)
    ex = found[0]-center
    ex /= np.linalg.norm(ex)
    ez = normal/np.linalg.norm(normal)
    ey = np.cross(ez, ex)
    return sorted(found, key=lambda p: math.atan2(np.dot(p-center, ey), np.dot(p-center, ex)))


# Every pair of the twelve face diagonals is enumerated, including invalid pairs.
cm = model('ex-main-0279')
p = points(cm)
lengths = [np.linalg.norm(p[a]-p[b]) for a, b in cm['edges']]
assert len(lengths) == 12
close(lengths, np.repeat(lengths[0], 12), 'cube edges')
a = lengths[0]
diagonals = []
for i, f in enumerate(cm['faces']):
    assert len(f) == 4
    diagonals += [(i, (f[0], f[2])), (i, (f[1], f[3]))]
assert len(diagonals) == 12
counts = Counter()
for (fi, (x, y)), (fj, (u, v)) in itertools.combinations(diagonals, 2):
    dx, du = p[y]-p[x], p[v]-p[u]
    shared = set([x, y]) & set([u, v])
    if shared:
        o = shared.pop()
        r = next(t for t in [x, y] if t != o)
        s = next(t for t in [u, v] if t != o)
        cosine = np.dot(p[r]-p[o], p[s]-p[o]) / (np.linalg.norm(p[r]-p[o])*np.linalg.norm(p[s]-p[o]))
        close(cosine, 0.5, 'every common-endpoint diagonal angle is 60 degrees')
        counts['common_endpoint'] += 1
    cross = np.cross(dx, du)
    parallel = np.linalg.norm(cross) < EPS
    coplanar = parallel or abs(np.dot(cross, p[u]-p[x])) < EPS
    if not coplanar:
        counts['skew'] += 1
        continue
    normal = np.cross(dx, p[u]-p[x]) if parallel else cross
    cut = section(p, cm['edges'], p[x], normal)
    if fi == fj:
        assert len(cut) == 4
        close(area(cut), a*a)
        counts['same_face'] += 1
    elif parallel:
        assert len(cut) == 4
        close(area(cut), a*a*math.sqrt(2), 'parallel-diagonal section area')
        counts['rectangle'] += 1
    else:
        assert len(cut) == 3
        close(area(cut), a*a*math.sqrt(3)/2, 'intersecting-diagonal section area')
        counts['triangle'] += 1
assert counts == Counter(common_endpoint=24, skew=30, same_face=6, rectangle=6, triangle=24), counts

# The two displayed solutions use the actual section, with a true perpendicular height.
for name, view, expected_factor in [('ex-main-0280-intersecting', 'triangle', math.sqrt(3)/2), ('ex-main-0280-parallel', 'rectangle', math.sqrt(2))]:
    m = model(name); p = points(m)
    edge_lengths = [np.linalg.norm(p[x]-p[y]) for x, y in m['edges']]
    assert len(edge_lengths) == 12
    close(edge_lengths, np.repeat(edge_lengths[0], 12))
    a = edge_lengths[0]
    polygon = [p[k] for k in m['views'][view]['polygon']]
    normal = np.cross(polygon[1]-polygon[0], polygon[2]-polygon[0])
    actual = section(p, m['edges'], polygon[0], normal)
    assert same_set(polygon, actual), name
    close(area(polygon), expected_factor*a*a, name)
    if name.endswith('intersecting'):
        close(p['M'], (p['C']+p['B1'])/2)
        close(np.dot(p['A']-p['M'], p['C']-p['B1']), 0)
        close(np.linalg.norm(p['A']-p['M']), a*math.sqrt(6)/2)
    else:
        close(np.dot(p['A1']-p['A'], p['C']-p['A']), 0)

# The non-right parallelepiped counterexample really has a half-turn and a mirror.
m = model('theory-035-general-solids-examples'); p = points(m)
body_names = sorted({x for edge in m['edges'] for x in edge})
v = np.array([p[k] for k in body_names]); o = p['O']
assert len(v) == 8 and same_set(v, 2*o-v)
u = p['L1']-p['L']; u /= np.linalg.norm(u)
rotation = 2*np.outer(u, u)-np.eye(3)
assert same_set(v, (v-o)@rotation.T+o)
face = m['views']['mirror']['polygon']; q = p[face[0]]
n = np.cross(p[face[1]]-q, p[face[2]]-q); n /= np.linalg.norm(n)
assert same_set(v, v-2*np.outer((v-q)@n, n))
for vertex in body_names:
    incident = [p[b if a == vertex else a]-p[vertex] for a, b in m['edges'] if vertex in (a, b)]
    assert len(incident) == 3
    # No candidate lateral edge is perpendicular to both candidate base edges.
    for i in range(3):
        assert not all(abs(np.dot(incident[i], incident[j])) < EPS for j in range(3) if i != j)

# Right rhombic prism and crystal examples preserve their entire vertex sets.
for name, expected in [('theory-035-parallelepiped-examples', 8), ('theory-035-applications-elements', 6)]:
    m = model(name); p = points(m)
    v = np.array([p[k] for k in sorted({x for e in m['edges'] for x in e})]); o=p['O']
    assert len(v) == expected
    assert same_set(v, 2*o-v)
    axis = p['L1']-p['L']; axis /= np.linalg.norm(axis)
    assert same_set(v, (v-o)@(2*np.outer(axis, axis)-np.eye(3)).T+o)
    for key in ['midplane', 'vertical', 'plane']:
        if key not in m['views']: continue
        f=m['views'][key]['polygon']; q=p[f[0]]
        n=np.cross(p[f[1]]-q,p[f[2]]-q);n/=np.linalg.norm(n)
        assert same_set(v,v-2*np.outer((v-q)@n,n)),(name,key)

# Infinite-plane constructions must keep points in the plane, with correct midpoints.
m=model('theory-035-unbounded-examples');p=points(m)
close((p['A']+p['A1'])/2,p['O'])
close((p['A']+p['A2'])/2,p['K'])
close(p['A'][2],0);close(p['A1'][2],0);close(p['A2'][2],0);close(p['B'][2],0)
close(np.cross(p['Z1']-p['Z'],[0,0,1]),[0,0,0])
f=m['views']['mirror']['polygon'];q=p[f[0]];n=np.cross(p[f[1]]-q,p[f[2]]-q);n/=np.linalg.norm(n)
close(p['A']-2*np.dot(p['A']-q,n)*n,p['B'])


def check_regular_polyhedron(name, vertices, edges, faces, face_sides, valence):
    m=model(name);p=points(m)
    perimeter=Counter(tuple(sorted((f[i],f[(i+1)%len(f)]))) for f in m['faces'] for i in range(len(f)))
    declared={tuple(sorted(e)) for e in m['edges']}
    body={v for edge in declared for v in edge}
    assert (len(body),len(declared),len(m['faces']))==(vertices,edges,faces),name
    assert set(perimeter)==declared and set(perimeter.values())=={2},name
    assert len(body)-len(declared)+len(m['faces'])==2
    degree=Counter(v for edge in declared for v in edge)
    assert set(degree.values())=={valence},(name,degree)
    lengths=[np.linalg.norm(p[a]-p[b]) for a,b in declared]
    close(lengths,np.repeat(lengths[0],len(lengths)),name+': equal edges')
    outward=[];c=np.mean([p[k] for k in body],axis=0)
    for f in m['faces']:
        assert len(f)==face_sides
        v=np.array([p[k] for k in f]);q=v[0]
        normal=np.cross(v[1]-q,v[2]-q);normal/=np.linalg.norm(normal)
        close((v-q)@normal,np.zeros(len(v)),name+': planar faces')
        if np.dot(normal,np.mean(v,axis=0)-c)<0:normal=-normal
        distances=np.array([np.dot(p[k]-q,normal) for k in body])
        assert max(distances)<EPS and min(distances)<-EPS,name+': supporting face'
        for i in range(len(v)):
            e1=v[i-1]-v[i];e2=v[(i+1)%len(v)]-v[i]
            cosine=np.dot(e1,e2)/(np.linalg.norm(e1)*np.linalg.norm(e2))
            close(cosine,math.cos((face_sides-2)*math.pi/face_sides),name+': regular face angles')
        outward.append(normal)
    dihedrals=[]
    for edge in declared:
        indices=[i for i,f in enumerate(m['faces']) if set(edge).issubset(f)]
        assert len(indices)==2
        dihedrals.append(np.dot(outward[indices[0]],outward[indices[1]]))
    close(dihedrals,np.repeat(dihedrals[0],len(dihedrals)),name+': equal dihedral angles')
    assert face_sides*faces==2*edges and valence*vertices==2*edges
    denominator=2*valence+2*face_sides-valence*face_sides
    close([faces,edges,vertices],[4*valence/denominator,2*valence*face_sides/denominator,4*face_sides/denominator])
    print(name,':',vertices,'vertices;',edges,'edges;',faces,'regular supporting faces; valence',valence)


for args in [('tetrahedron',4,6,4,3,3),('cube',8,12,6,4,3),('octahedron',6,12,8,3,4),('icosahedron',12,30,20,3,5),('dodecahedron',20,30,12,5,3)]:
    check_regular_polyhedron('theory-036-'+args[0],*args[1:])

# Equal regular faces alone are insufficient: actual bipyramid has unequal valences.
m=model('theory-036-definition');p=points(m)
degree=Counter(v for e in m['edges'] for v in e)
assert set(degree.values())=={3,4}
close([np.linalg.norm(p[a]-p[b]) for a,b in m['edges']],np.repeat(2.0,len(m['edges'])))
assert len(m['faces'])==6 and all(len(f)==3 for f in m['faces'])

# Exactly five integer angle patterns survive the strict convex-vertex inequality.
possible=[]
for n in range(3,101):
    for q in range(3,101):
        if q*(n-2)*180 < 360*n:possible.append((n,q))
assert possible==[(3,3),(3,4),(3,5),(4,3),(5,3)]
m=model('theory-036-vertex-angles');p=points(m)
assert len(m['faces'])==3
for f in m['faces']:
    assert len(f)==6 and 'O' in f
    i=f.index('O');a=p[f[i-1]]-p['O'];b=p[f[(i+1)%6]]-p['O']
    close(np.dot(a,b)/np.linalg.norm(a)/np.linalg.norm(b),-0.5)
    close([p[k][2] for k in f],np.zeros(6))

# Tetrahedron exists at height a√6/3, with O at the base circumcenter.
m=model('theory-036-tetrahedron');p=points(m)
a=np.linalg.norm(p['A']-p['B'])
close(p['O'],(p['A']+p['B']+p['C'])/3)
close(np.linalg.norm(p['S']-p['O']),a*math.sqrt(6)/3)
close(np.dot(p['S']-p['O'],p['A']-p['O']),0)

# Octahedron's six vertices are precisely the centers of the displayed cube faces.
m=model('theory-036-octahedron');p=points(m)
cube_names=['KA','KB','KC','KD','KA1','KB1','KC1','KD1']
cube_faces=[['KA','KB','KC','KD'],['KA1','KB1','KC1','KD1'],['KA','KB','KB1','KA1'],['KB','KC','KC1','KB1'],['KC','KD','KD1','KC1'],['KD','KA','KA1','KD1']]
centers=[np.mean([p[k] for k in f],axis=0) for f in cube_faces]
assert same_set(centers,[p[k] for k in ['A','B','C','D','S','T']])

# Icosahedron: two staggered regular pentagons, ten belt triangles and two caps.
m=model('theory-036-icosahedron');p=points(m)
a=np.linalg.norm(p['A1']-p['A2']);r=a/(2*math.sin(math.pi/5))
cap=math.sqrt(a*a-r*r);belt=math.sqrt(a*a-(2*r*math.sin(math.pi/10))**2)
upper=np.mean([p['A'+str(i)] for i in range(1,6)],axis=0)
lower=np.mean([p['B'+str(i)] for i in range(1,6)],axis=0)
close([np.linalg.norm(p['A'+str(i)]-upper) for i in range(1,6)],np.repeat(r,5))
close([np.linalg.norm(p['B'+str(i)]-lower) for i in range(1,6)],np.repeat(r,5))
close(np.linalg.norm(upper-lower),belt)
close(np.linalg.norm(p['P']-upper),cap);close(np.linalg.norm(p['Q']-lower),cap)
assert sum('P' in f for f in m['faces'])==5 and sum('Q' in f for f in m['faces'])==5
assert sum(not set(f)&{'P','Q'} for f in m['faces'])==10

# Dodecahedron is genuinely the face-center dual of this same icosahedron.
centers=[np.mean([p[k] for k in f],axis=0) for f in m['faces']]
dm=model('theory-036-dodecahedron');dp=points(dm)
dvertices=[dp[k] for k in sorted({k for e in dm['edges'] for k in e})]
assert same_set(centers,dvertices)
# Construction cards must use the same real bodies and correct auxiliary points.
for name in ['theory-036-icosahedron-existence','theory-036-dodecahedron-existence']:
    check_regular_polyhedron(name,12,30,20,3,5)
    em=model(name);ep=points(em)
    for k in p:close(ep[k],p[k],name+': underlying icosahedron')
    if name.endswith('icosahedron-existence'):
        close(ep['U'],upper);close(ep['L'],lower)
        close(ep['C']-ep['B1'],upper-lower)
        close(np.linalg.norm(ep['A1']-ep['C']),2*r*math.sin(math.pi/10))
        close(np.dot(ep['C']-ep['A1'],ep['C']-ep['B1']),0)
        radii=[np.linalg.norm(ep[k]-ep['O']) for k in p]
        close(radii,np.repeat(radii[0],len(radii)))
    else:
        for k in dp:close(ep[k],dp[k],name+': exact face centers')
        close(ep['M'],(ep['A4']+ep['A5'])/2)
        close(ep['F4'],ep['P']+2*(ep['M']-ep['P'])/3)
        pentagon=[ep[k] for k in em['views']['centers']['polygon']]
        lengths=[np.linalg.norm(pentagon[i]-pentagon[(i+1)%5]) for i in range(5)]
        close(lengths,np.repeat(lengths[0],5))
        normal=ep['P']-ep['O'];normal/=np.linalg.norm(normal)
        close([(v-pentagon[0])@normal for v in pentagon],np.zeros(5))
        # All remaining dual vertices are strictly behind this supporting pentagon.
        distances=[(v-pentagon[0])@normal for v in dvertices]
        assert max(distances)<EPS and min(distances)<-EPS
print('ATANASYAN_REGULAR_POLYHEDRA_MATH_OK: all66diagonal pairs, both sections, counterexample, five solids, Euler and constructions')
