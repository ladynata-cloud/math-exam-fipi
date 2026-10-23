"""Independent source/model checks for §§12–13, separate from author generator.
Source PNG115–118,123–128 and203 were visually inspected by the reviewer.
This script changes no lesson or review status.
"""
import json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DIR=ROOT/'stereo-course/merzlyak-10-base/lessons'
def load(s,n):return json.loads((DIR/f'ex-{s:02}-{n:03}.json').read_text())
def points(s,n):return load(s,n)['visualization']['model']['points']
def sub(a,b):return [x-y for x,y in zip(a,b)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def v(q,a,b):return sub(q[b],q[a])
def norm(a):return math.hypot(*a)
def dist(q,a,b):return norm(v(q,a,b))
def eq(a,b=0):assert math.isclose(a,b,rel_tol=1e-7,abs_tol=1e-7),(a,b)
def plane_normal(q,a,b,c):return cross(v(q,a,b),v(q,a,c))
def anglecos(q,a,o,b):return dot(v(q,o,a),v(q,o,b))/(dist(q,o,a)*dist(q,o,b))
def line_plane_sin(q,a,b,c,d,e):
 normal=plane_normal(q,c,d,e)
 return abs(dot(v(q,a,b),normal))/(dist(q,a,b)*norm(normal))
def plane_cos(q,first,second):
 n1,n2=plane_normal(q,*first),plane_normal(q,*second)
 return abs(dot(n1,n2))/(norm(n1)*norm(n2))
# Source pages checked directly against PNG, not inferred from index.
for sec,maximum in [(12,34),(13,41)]:
 for n in range(1,maximum+1):
  x=load(sec,n)
  if sec==12:expected=[115,116] if n==1 else [115 if n<=5 else 116 if n<=13 else 117 if n<=23 else 118]
  else:expected=[123,124] if n==2 else [123 if n<=3 else 124 if n<=9 else 125 if n<=15 else 126 if n<=25 else 127 if n<=37 else 128]
  assert x['source']['pdfPages']==expected,(sec,n)
  assert x['source']['printedPages']==[p-1 for p in expected]
  assert x['answer']['mode']=='manual' and x['help']
  for s in x['steps']:assert s['view'] in x['visualization']['model']['views']
# Orthogonal projections used by the line-plane angle proofs have perpendicular directions.
for num,segment,plane in [(1,('A','A1'),('A1','B1','C1')),(1,('A','D'),('C','D','D1')),(1,('C','D'),('A','D','D1')),(22,('B','E'),('A','D','E')),(22,('C','F'),('A','B','D')),(23,('A','O'),('B','M','D')),(28,('A1','D1'),('C','D','D1')),(29,('C1','D1'),('D','A','A1')),(30,('D','O'),('A','C','C1'))]:
 q=points(12,num);a,b,c=plane
 assert norm(cross(v(q,a,b),v(q,a,c)))>1e-6
 eq(dot(v(q,*segment),v(q,a,b)));eq(dot(v(q,*segment),v(q,a,c)))
# Impossibility and ambiguity checks derived from the printed conditions themselves.
h=3*math.sqrt(3);ab=h/math.sin(math.pi/3);ac=h/math.sin(math.pi/4)
formal_bc=math.hypot(ab,ac);bh=h/math.tan(math.pi/3);ch=h/math.tan(math.pi/4)
assert formal_bc>bh+ch # Violates triangle inequality in the base plane.
q=points(12,14);eq(anglecos(q,'B','A','C'),math.cos(math.radians(75)))
q=points(12,26);eq(anglecos(q,'B','A','C'),math.sqrt(6)/4);eq(anglecos(q,'B','A','D'),-math.sqrt(6)/4)
q=points(12,32)
for candidate in ['M','N']:
 eq(abs(anglecos(q,candidate,'O','A')),.5);eq(abs(anglecos(q,candidate,'O','B')),.5)
eq(line_plane_sin(q,'O','N','O','A','B'),0)
eq(math.sqrt(1-line_plane_sin(q,'O','M','O','A','B')**2),1/math.sqrt(3))
# Normal-section rays must be perpendicular to the common edge, including skew directions.
for num,edge,rays in [(8,('A','D'),[('A','B'),('A','B1')]),(9,('B','C'),[('E','A'),('E','D')]),(10,('B','C'),[('B','A'),('B','F')]),(11,('A','C'),[('C','B'),('C','D')]),(17,('C','D'),[('M','A'),('M','B')]),(21,('B','C'),[('E','A'),('E','D')]),(22,('A','C'),[('C','B'),('C','D')]),(23,('A','C'),[('H','O'),('H','D')]),(24,('A','B'),[('H','O'),('H','D')]),(25,('C','D'),[('H','B'),('H','M')]),(26,('A','D'),[('D','C'),('D','M')]),(36,('C','D'),[('H','A'),('H','M')]),(37,('B','D'),[('O','A1'),('O','M')]),(38,('B','D'),[('O','M'),('O','K')])]:
 q=points(13,num)
 for ray in rays:eq(dot(v(q,*edge),v(q,*ray)))
# Signed linear angles vs the acute angle of planes are checked separately.
q=points(13,16);eq(anglecos(q,'A','B','C'),math.cos(math.radians(100)));eq(plane_cos(q,('A','B','K'),('C','B','K')),math.cos(math.radians(80)))
q=points(13,20);eq(anglecos(q,'A','O','B'),-.5)
q=points(13,32);eq(anglecos(q,'B','O','D'),-.5);eq(plane_cos(q,('A','B','C'),('A','D','C')),.5)
q=points(13,39)
for line,plane in [(('A1','C'),('B','C1','D')),(('B1','D'),('A','D1','C'))]:
 a,b,c=plane;eq(dot(v(q,*line),v(q,a,b)));eq(dot(v(q,*line),v(q,a,c)))
eq(plane_cos(q,('B','C1','D'),('A','D1','C')),1/3)
# Two roots of13.35 are independently obtained from quadratic distances.
for x in [3,9]:eq(2**2+x**2+(4*math.sqrt(3))**2-2*x*4*math.sqrt(3)*math.cos(math.pi/6),25)
# Recheck the exact auxiliary constructions added after independent review.
for num,original,moved,foot,other,longitudinal,normal_sq in [(33,'C','Cp','B','A',3,247),(34,'B','Bp','C','A',2,4),(35,'D','Dp','E','C',2,21)]:
 q=points(13,num)
 eq(dist(q,original,moved),longitudinal)
 eq(norm(cross(v(q,original,moved),v(q,'L','R'))))
 eq(dot(v(q,original,moved),v(q,moved,other)))
 eq(dist(q,moved,other)**2,normal_sq)
 eq(q[moved][0],q[foot][0])
 m=load(13,num)['visualization']['model']
 assert moved not in m['labelNames']
 assert any(moved in view.get('polygon',[]) or moved in sum(view.get('segments',[]),[]) for view in m['views'].values())
q=points(13,20)
eq(norm(cross(v(q,'A','A1'),v(q,'B','B1'))))
eq(norm(cross(v(q,'A','A1'),v(q,'L','R'))))
eq(dot(plane_normal(q,'A','A1','B1'),v(q,'A','B')))
eq(dot(v(q,'A','B'),v(q,'A','A1')))
assert 'H' not in points(13,4) and 'section' not in load(13,4)['visualization']['model']['views']
print('REVIEWER_12_13_CHECKS_OK:75source mappings, projection normals, dihedral sections, source diagnostics, signed/acute angles, both quadratic roots, repaired auxiliary constructions')
