"""Independent numeric and clipping checks for §4–5 draft models.
No claim of source, pedagogical or publication review approval is made here.
"""
import json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DIR=ROOT/'stereo-course/merzlyak-10-base/lessons'
def lesson(s,n,part=''):
 return json.loads((DIR/f'ex-{s:02}-{n:03}{"-"+part if part else ""}.json').read_text())
def pts(s,n,part=''):return lesson(s,n,part)['visualization']['model']['points']
def eq(a,b,label=''):
 assert math.isclose(a,b,rel_tol=1e-8,abs_tol=1e-8),(label,a,b)
def sub(a,b):return [x-y for x,y in zip(a,b)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def dist(p,a,b):return math.dist(p[a],p[b])
def vec(p,a,b):return sub(p[b],p[a])
def parallel(p,a,b,c,d):eq(math.hypot(*cross(vec(p,a,b),vec(p,c,d))),0,f'{a}{b} ∥ {c}{d}')
def collinear(p,a,b,c):parallel(p,a,b,a,c)
def midpoint(p,m,a,b):
 for i in range(3):eq(p[m][i],(p[a][i]+p[b][i])/2,f'{m} midpoint {a}{b}')
def perimeter(p,cycle):return sum(dist(p,a,b) for a,b in zip(cycle,cycle[1:]+cycle[:1]))
def area(p,a,b,c):return math.hypot(*cross(vec(p,a,b),vec(p,a,c)))/2
# Source lengths and ratios, including positive/negative projection cases.
p=pts(4,10);collinear(p,'B','D2','X');collinear(p,'A','C','X')
for part,target in [('2',10),('3',28)]:
 p=pts(4,14,part);eq(dist(p,'B','B1'),target);parallel(p,'B','B1','C','C1')
p=pts(4,14,'2');midpoint(p,'C','A','B');eq(dist(p,'C','C1'),5)
p=pts(4,14,'3');eq(dist(p,'A','C')/dist(p,'C','B'),3/4);eq(dist(p,'C','C1'),12)
p=pts(4,15)
for a,b,d in [('C','E',6),('D','E',9),('E','E1',12),('D','D1',30)]:eq(dist(p,a,b),d)
parallel(p,'E','E1','D','D1')
p=pts(4,16)
for a,b,d in [('A','C',4),('C','B',8),('B1','C1',10),('A1','C1',5)]:eq(dist(p,a,b),d)
for s,n,expected in [(4,17,12),(4,23,4),(4,24,6),(4,25,9),(4,26,35)]:
 p=pts(s,n);name={17:'A',23:'C',24:'A',25:'B',26:'C'}[n];eq(dist(p,name,name+'1'),expected)
p=pts(4,23);midpoint(p,'C','A','B');eq(dist(p,'A','A1'),16);eq(dist(p,'B','B1'),8);assert p['A'][2]*p['B'][2]<0
p=pts(4,24);eq(dist(p,'A','C')/dist(p,'C','B'),5/3);eq(dist(p,'B','B1'),10);eq(dist(p,'C','C1'),4);assert p['A'][2]*p['C'][2]<0
p=pts(4,25);midpoint(p,'M','A','C');midpoint(p,'O','B','M');eq(dist(p,'A','A1'),17);eq(dist(p,'C','C1'),13);eq(dist(p,'O','O1'),12)
p=pts(4,26)
for i in range(3):eq(p['A'][i]+p['C'][i],p['B'][i]+p['D'][i])
p=pts(4,27);eq(dist(p,'B','M')/dist(p,'M','A'),dist(p,'B','K')/dist(p,'K','C'));parallel(p,'M','K','A','C')
p=pts(4,28);midpoint(p,'M','A','C');midpoint(p,'E','B','M');collinear(p,'A','E','K');eq(dist(p,'B','K')/dist(p,'K','C'),.5)
p=pts(5,13);eq(dist(p,'A','C'),18);eq(dist(p,'A','A1')/dist(p,'A1','B'),7/5);eq(dist(p,'A1','C1'),7.5)
p=pts(5,14);eq(dist(p,'C','F')/dist(p,'C','B'),3/11);eq(dist(p,'A','E')/dist(p,'E','C'),8/3)
p=pts(5,16);eq(area(p,'A','B','C'),28);eq(area(p,'A','B','C')-area(p,'B','M','K'),21)
p=pts(5,19)
for a,b in [('A','B'),('A','C'),('A','D'),('B','C'),('B','D'),('C','D')]:eq(dist(p,a,b),4)
midpoint(p,'M','D','C');parallel(p,'M','N','A','D');parallel(p,'M','P','B','D');eq(area(p,'M','N','P'),math.sqrt(3))
p=pts(5,20);midpoint(p,'E','A','D');parallel(p,'E','F','A','C');eq(perimeter(p,['B','E','F']),2+4*math.sqrt(3))
p=pts(5,22);midpoint(p,'E','A','B');midpoint(p,'F','B','C');parallel(p,'E','E1','D','D1');eq(perimeter(p,['E','F','F1','E1']),4*(2+math.sqrt(2)))
p=pts(5,25);midpoint(p,'E','A','B');midpoint(p,'F','B','C');midpoint(p,'M','A','D');midpoint(p,'K','C','D');midpoint(p,'O','M','F');midpoint(p,'O','K','E')
p=pts(5,30)
for a,b,d in [('A','B',10),('A','D',17),('A','A1',24)]:eq(dist(p,a,b),d)
for m,a,b in [('E','A','B'),('F','C','D'),('M','A','A1')]:midpoint(p,m,a,b)
eq(perimeter(p,['E','F','N','M']),60)
p=pts(5,31);eq(dist(p,'B','E')/dist(p,'E','C'),2);eq(dist(p,'A','B'),18);eq(dist(p,'C','D'),12);eq(perimeter(p,['E','P','Q','R']),28);parallel(p,'E','P','A','B');parallel(p,'E','R','C','D')
for n,one,two,direction in [(32,('M','P'),('K','Q'),('C','D')),(33,('M','Q'),('K','P'),('A','B'))]:
 p=pts(5,n);collinear(p,'A','D','M');collinear(p,'B','C','K');parallel(p,*one,*direction);parallel(p,*two,*direction)
p=pts(5,34);collinear(p,'A','L','O');collinear(p,'D','M','O');parallel(p,'O','Q','A','A1')
p=pts(5,35);collinear(p,'A','F','P');collinear(p,'A1','E','P');parallel(p,'P','Q','A','D');parallel(p,'P','Q','A1','D1')
p=pts(5,36);midpoint(p,'E','A','D');midpoint(p,'F','C','D');midpoint(p,'T','A','B1');parallel(p,'E','T','D','B1');collinear(p,'E','F','U');collinear(p,'E','F','V');collinear(p,'U','T','P');collinear(p,'U','T','Q');collinear(p,'V','Q','R')
p=pts(5,37);midpoint(p,'M','C','C1');midpoint(p,'O','A','C');collinear(p,'B','D','O');parallel(p,'M','O','A','C1')
p=pts(5,38)
for a,b,c in [('P','R','M'),('P','Q','N'),('Q','R','K')]:collinear(p,a,b,c)
p=pts(5,39);eq(dist(p,'S','M')/dist(p,'S','E'),dist(p,'S','N')/dist(p,'S','D'));parallel(p,'M','N','E','D')
p=pts(5,40)
for a,b,d in [('B','C',12),('A','D',18),('A','C',20),('A','O',12),('O','C',8)]:eq(dist(p,a,b),d)
collinear(p,'B','D','O')
p=pts(5,41);eq(dist(p,'A','B')/dist(p,'C','D'),3/5);eq(dist(p,'A','D')-dist(p,'B','C'),16);eq(dist(p,'A','C'),13);eq(area(p,'A','B','C')+area(p,'A','C','D'),156)
# Independently clip the original solid edges by each claimed section plane.
# The complete set of edge-plane intersections must match the claimed polygon.
sections=[(19,6,['M','N','P']),(20,6,['B','E','F']),(21,9,['M','N','C1']),(22,12,['E','F','F1','E1']),(30,12,['E','F','N','M']),(31,6,['E','P','Q','R']),(32,6,['M','P','K','Q']),(33,6,['M','Q','K','P']),(36,12,['P','Q','R','F','E']),(37,12,['B','D','M']),(38,9,['P','Q','R']),(39,10,['B','P','M','N','Q'])]
for n,count,names in sections:
 model=lesson(5,n)['visualization']['model'];p=model['points'];a,b,c=[p[k] for k in names[:3]];normal=cross(sub(b,a),sub(c,a));offset=dot(normal,a);hits=[]
 for k in names:eq(dot(normal,p[k]),offset,f'5.{n} coplanar {k}')
 for u,v in model['edges'][:count]:
  a,b=p[u],p[v];da=dot(normal,a)-offset;db=dot(normal,b)-offset
  for x,d in [(a,da),(b,db)]:
   if abs(d)<1e-8 and not any(math.dist(x,h)<1e-8 for h in hits):hits.append(x)
  if da*db< -1e-10:
   t=da/(da-db);x=[a[i]+t*(b[i]-a[i]) for i in range(3)]
   if not any(math.dist(x,h)<1e-8 for h in hits):hits.append(x)
 assert len(hits)==len(names),(n,'unexpected edge intersection count',hits,names)
 for h in hits:assert any(math.dist(h,p[k])<1e-8 for k in names),(n,'missing section vertex',h)
# Metadata and all internal source references stay explicit.
coverage=json.loads((ROOT/'tools/merzlyak-10-base/coverage-04-05.json').read_text())
assert len(coverage['entries'])==69 and not coverage['unresolved']
assert sum(len(c['lessonFiles']) for c in coverage['entries'])==72
for c in coverage['entries']:
 for file in c['lessonFiles']:
  x=json.loads((ROOT/file).read_text());assert x['status']=='draft';assert all(v=='pending' for v in x['review'].values());assert x['source'].get('subpart') in c['requiredParts']
  assert x['source']['pdfPages']==[p+1 for p in x['source']['printedPages']]
print('MERZLYAK_PARA04_05_MODEL_METRICS_OK: numeric givens, parallel directions, 12 complete solid-edge section clips, 72 draft cards / 69 exercises')
