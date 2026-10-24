"""Independent coordinate oracle: enumerate isometries, not lesson answers.

Requires numpy. Tests geometry of the authored models and derives the number of
reflection planes / half-turn axes from the entire vertex set. This is a math
check, not a claim of independent human/model source or pedagogical review.
"""
import itertools,json,math
from pathlib import Path
import numpy as np
D=Path(__file__).resolve().parents[2] / 'stereo-course/textbook/lessons'
def lesson(name): return json.loads((D/(name+'.json')).read_text())
def vertices(name,names):
 p=lesson(name)['visualization']['model']['points']
 return np.array([p[n] for n in names],dtype=float)
def group(v):
 # Every isometry is fixed by the images of four affinely independent vertices.
 basis=next(t for t in itertools.permutations(range(1,len(v)),3) if abs(np.linalg.det((v[list(t)]-v[0]).T))>1e-7)
 X=(v[list(basis)]-v[0]).T;inv=np.linalg.inv(X);out=[]
 for q in itertools.permutations(range(len(v)),4):
  Y=(v[list(q[1:])]-v[q[0]]).T
  R=Y@inv
  if not np.allclose(R.T@R,np.eye(3),atol=1e-8):continue
  t=v[q[0]]-R@v[0];mapped=v@R.T+t
  if all(min(np.linalg.norm(p-u) for u in v)<1e-7 for p in mapped):out.append((R,t))
 return out
def count(name,names,planes,axes,centers):
 v=vertices(name,names);g=group(v)
 p=sum(np.linalg.det(r)<0 and np.isclose(np.trace(r),1) for r,t in g)
 a=sum(np.linalg.det(r)>0 and np.isclose(np.trace(r),-1) for r,t in g)
 c=sum(np.allclose(r,-np.eye(3)) for r,t in g)
 assert (p,a,c)==(planes,axes,centers),(name,p,a,c)
 print(name,':',p,'planes;',a,'half-turn axes;',c,'centers')
count('ex-main-0277-c',['A','B','C','D','A1','B1','C1','D1'],9,9,1)
count('ex-main-0278-a',['A','B','C','D','A1','B1','C1','D1'],5,5,1)
count('ex-main-0278-b',['A','B','C','D','S'],4,1,0)
count('ex-main-0278-c',['A','B','C','S'],3,0,0)
count('ex-main-0278-c-regular',['A','B','C','S'],6,3,0)
count('ex-main-0276-b',['A','B','C','A1','B1','C1'],4,3,0)
# For a skew parallelepiped, central symmetry does not require right angles.
v=vertices('ex-main-0276-a',['A','B','C','D','A1','B1','C1','D1'])
assert all(min(np.linalg.norm(-p-u) for u in v)<1e-8 for p in v)
assert not np.isclose(np.dot(v[1]-v[0],v[3]-v[0]),0)
# Explicit central/axial/plane constructions satisfy midpoint and orthogonality.
for name in ['center','axis','plane']:
 p=lesson('theory-035-'+name)['visualization']['model']['points']
 a,b=np.array(p['A']),np.array(p['A1']);h=np.array(p['O' if name=='center' else 'H'])
 assert np.allclose((a+b)/2,h)
 if name=='axis':assert abs(np.dot(a-b,np.array(p['V'])-p['U']))<1e-8
 if name=='plane':assert np.allclose((a-b)[:2],0)
# Arbitrarily sampled perpendicular axes preserve every sampled segment point.
v=np.array([[-2+4*t,0,0] for t in np.linspace(0,1,17)])
for theta in np.linspace(0,2*math.pi,29):
 u=np.array([0,math.cos(theta),math.sin(theta)]);R=2*np.outer(u,u)-np.eye(3)
 assert np.allclose(v@R.T,-v)
# Half-turn around a median preserves the triangle; 120 degrees is not a half-turn.
v=vertices('ex-main-0277-b',['A','B','C'])
R=np.diag([-1,1,-1]);assert all(min(np.linalg.norm(p-u) for u in v)<1e-8 for p in v@R.T)
assert any(min(np.linalg.norm(p-u) for u in v)>1e-5 for p in v@np.diag([-1,-1,1]))
# All edges of the special tetrahedron are equal. BCJ really is perpendicular to AS.
c=lesson('ex-main-0278-c-regular');p={k:np.array(v) for k,v in c['visualization']['model']['points'].items()}
lengths=[np.linalg.norm(p[a]-p[b]) for a,b in c['visualization']['model']['edges']]
assert np.allclose(lengths,lengths[0]);assert np.allclose(p['J'],(p['A']+p['S'])/2)
assert abs(np.dot(p['S']-p['A'],p['C']-p['B']))<1e-8
assert abs(np.dot(p['S']-p['A'],p['J']-p['B']))<1e-8
# Central reflection of A in the triangular prism falls outside its top triangle.
p=lesson('ex-main-0276-b')['visualization']['model']['points'];assert np.allclose(2*np.array(p['O'])-p['A'],p['X'])
assert p['X'][1]<min(p[n][1] for n in ['A1','B1','C1'])
print('ATANASYAN_SYMMETRY_MATH_OK: finite groups, constructions, infinite family and special cases')
