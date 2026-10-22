"""Independent numerical review of §§10–11; reads authored JSON only."""
import json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DIR=ROOT/'stereo-course/merzlyak-10-base/lessons'
COUNT=0
def check(ok,why=''):
 global COUNT
 COUNT+=1
 assert ok,why
def eq(a,b,why=''):check(abs(a-b)<1e-7*max(1,abs(a),abs(b)),(why,a,b))
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def norm(a):return math.sqrt(dot(a,a))
def d(p,a,b):return math.dist(p[a],p[b])
def v(p,a,b):return sub(p[b],p[a])
def lesson(s,n):return json.loads((DIR/f'ex-{s:02d}-{n:03d}.json').read_text())
def points(s,n):return lesson(s,n)['visualization']['model']['points']
def perpendicular(p,a,b,c,e):eq(dot(v(p,a,b),v(p,c,e)),0,(a,b,c,e))
def parallel(p,a,b,c,e):eq(norm(cross(v(p,a,b),v(p,c,e))),0,(a,b,c,e))
def on(p,x,a,b):parallel(p,a,x,a,b)
def angle(p,a,b,c):return math.degrees(math.acos(max(-1,min(1,dot(v(p,b,a),v(p,b,c))/(d(p,b,a)*d(p,b,c))))))
def area(p,a,b,c):return norm(cross(v(p,a,b),v(p,a,c)))/2
def point_line(p,x,a,b):return norm(cross(v(p,a,x),v(p,a,b)))/d(p,a,b)
def line_distance(p,a,b,c,e):
 n=cross(v(p,a,b),v(p,c,e))
 return abs(dot(v(p,a,c),n))/norm(n) if norm(n)>1e-7 else point_line(p,c,a,b)
def midpoint(p,x,a,b):
 for i in range(3):eq(p[x][i],(p[a][i]+p[b][i])/2)

files=sorted(DIR.glob('ex-1[01]-*.json'));check(len(files)==71)
for f in files:
 x=json.loads(f.read_text());m=x['visualization']['model'];p=m['points'];s,n=map(int,x['source']['exercise'].split('.'))
 expected=(103 if n<=6 else 104 if n<=16 else 105 if n<=27 else 106 if n<=39 else 107) if s==10 else (108 if n<=2 else 109 if n<=8 else 110 if n<=18 else 111 if n<=28 else 112)
 eq(x['source']['printedPages'][0],expected,f.name)
 check(x['source']['pdfPages']==[q+1 for q in x['source']['printedPages']],f.name)
 check(3<=len(x['steps'])<=7,f.name)
 check(all(step['view'] in m['views'] for step in x['steps']),f.name)
 check(bool(x['help']),f.name)
 for q in p.values():check(len(q)==3 and all(math.isfinite(t) for t in q),f.name)
 for a,b in m.get('edges',[])+[e for w in m['views'].values() for e in w.get('segments',[])]:check(d(p,a,b)>1e-7,(f.name,a,b))
 for ns in m.get('faces',[])+[w['polygon'] for w in m['views'].values() if w.get('polygon')]:
  a,b,c=ns[:3];normal=cross(v(p,a,b),v(p,a,c));check(norm(normal)>1e-7,(f.name,ns))
  for name in ns:eq(dot(normal,v(p,a,name)),0,(f.name,ns))

# Exact metric givens and derived lengths in paragraph 10.
cases={3:[('A','H',12),('A','B',13),('H','B',5)],4:[('A','B',math.sqrt(7)),('H','B',math.sqrt(3)),('A','H',2)],5:[('A','B',8),('A','D',9),('C','D',7)],6:[('B','H',6*math.sqrt(6)),('M','B',18),('M','A',12)],10:[('P','Q',4)],11:[('P','Q',10)],12:[('P','Q',7),('Q','H',3)],14:[('A','B',10),('A','C',5*math.sqrt(2))],18:[('A','B',25),('A','C',17),('A','H',15)],19:[('D','A',15),('D','B',13),('H','A',9),('H','B',5)],21:[('B','C',6),('A','O',math.sqrt(6)),('A','B',2*math.sqrt(6)),('A','C',2*math.sqrt(6))],22:[('A','B',9),('M','A',6),('M','B',6),('M','C',6),('M','O',3)],23:[('A','C',6),('B','C',8),('D','A',13),('D','B',13),('D','C',13),('D','O',12)],25:[('A','B',4*math.sqrt(5)),('B','C',4*math.sqrt(5)),('A','C',8),('D','A',5*math.sqrt(5)),('D','B',5*math.sqrt(5)),('D','C',5*math.sqrt(5)),('D','O',10)],26:[('A','B1',math.sqrt(14)),('A','C1',3*math.sqrt(5)),('B','B1',2),('B','C',5)],27:[('B','C',20),('A','C',15),('B','C1',12),('B','A1',3*math.sqrt(41))],28:[('A','C',8),('B','D',6),('C','C1',3),('D','C1',4),('A','C1',math.sqrt(55)),('D','B1',3*math.sqrt(3))],29:[('A','B',5),('B','C',12),('A','C1',2*math.sqrt(22)),('C','C1',9)],32:[('B','C',10),('A','H',8)],33:[('A','B',6),('B','H',12)],36:[('A','D',20),('B','C',15),('O','H',8)],39:[('O','M',1)]}
for n,cs in cases.items():
 p=points(10,n)
 for a,b,t in cs:eq(d(p,a,b),t,(10,n,a,b))
for n,a,b,c,t in [(5,'B','A','C',45),(6,'M','A','H',60),(14,'B','A','C',45),(21,'A','B','O',30),(21,'A','C','O',30),(26,'B','A','C',45),(34,'M','A','H',30),(34,'M','B','H',45),(35,'A','B','O',45),(35,'A','C','O',45),(35,'B','O','C',120)]:eq(angle(points(10,n),a,b,c),t,(10,n))
p=points(10,18);eq(d(p,'H','B')/d(p,'H','C'),2.5)
for n in (7,8):
 p=points(10,n);eq(d(p,'A','B'),d(p,'A','C'));eq(d(p,'H','B'),d(p,'H','C'))
for n in (16,17):
 p=points(10,n);check(d(p,'A','B')>d(p,'A','C'));check(d(p,'H','B')>d(p,'H','C'))
for n in (9,15):
 p=points(10,n)
 for name in 'ABCD':eq(d(p,'M',name),5);eq(d(p,'O',name),4)
p=points(10,20);eq(angle(p,'A','B','H'),60);eq(angle(p,'A','C','H'),60);eq(angle(p,'B','A','C'),60)
check('не существует' in ''.join(s['explanation'] for s in lesson(10,20)['steps']))
# For all possible projection angles, cos between inclines >= 1/2, never zero.
for theta in range(181):check((3+math.cos(math.radians(theta)))/4>=.5-1e-10)
for n,args,t in [(13,('A','B','D','D1'),2),(14,('A','D','B','C'),5*math.sqrt(2)),(30,('B1','D1','A','A1'),math.sqrt(.5)),(31,('C','D','O','O1'),.5),(37,('B1','D','A','C'),math.sqrt(6)/6),(38,('A','B','C','D'),math.sqrt(.5))]:eq(line_distance(points(10,n),*args),t,(10,n))
p=points(10,37);on(p,'P','A','C');on(p,'Q','B1','D');perpendicular(p,'P','Q','A','C');perpendicular(p,'P','Q','B1','D')
p=points(10,38)
for a,b in [('A','B'),('A','C'),('A','D'),('B','C'),('B','D'),('C','D')]:eq(d(p,a,b),1)
p=points(10,32);eq(area(p,'A','B','C'),40)
p=points(10,33);eq(2*area(p,'A','B','C'),72)
p=points(10,34);eq(math.cos(math.radians(angle(p,'A','M','B'))),math.sqrt(2)/4)
p=points(10,35);eq(math.cos(math.radians(angle(p,'B','A','C'))),.25)
p=points(10,36);on(p,'O','A','C');on(p,'O','B','D');eq(d(p,'A','O')/d(p,'O','C'),4/3)
p=points(10,39);midpoint(p,'O','A','C');midpoint(p,'O','B','D');eq(sum(p[a][2] for a in 'ABCD'),4*p['O'][2]);check(4*p['O'][2]<=4)
p=points(10,40);eq(d(p,'A','B'),12);eq(d(p,'E','F'),4*math.sqrt(3))
for a,b in [('A','B'),('B','C'),('C','A'),('E','F'),('F','G'),('G','H'),('H','E')]:eq(point_line(p,'O',a,b),2*math.sqrt(3))
p=points(10,41);on(p,'T','A','B');eq(d(p,'A','T')/d(p,'T','B'),12/25);eq(area(p,'A','B','C'),1680);eq(point_line(p,'O','A','B'),120/7)

# The three-perpendiculars theorem: verify the actual target in each scene.
for n,a,b,c,e in [(1,'B','D','N','O'),(2,'A','F','B','D'),(3,'M','D','B','C'),(4,'A','B','P','Q'),(5,'D','H','A','C'),(6,'D','C','A','C'),(7,'E','O','A','C'),(8,'M','D','C','D'),(9,'M','D','A','C'),(10,'D','H','B','C'),(11,'E','C','B','C'),(12,'M','H','C','D'),(13,'D','H','B','C'),(21,'A1','C','B1','D1'),(22,'C','D1','A','B1'),(22,'C','D1','B1','C1'),(23,'C','D','A','K'),(23,'C','D','K','M'),(24,'A','B','D','O'),(24,'A','B','C','K'),(27,'A1','C','B','D'),(27,'A1','C','D','C1')]:perpendicular(points(11,n),a,b,c,e)
for n,cs in {10:[('A','B',10),('A','C',17),('B','C',21),('D','A',15),('D','H',17)],11:[('A','B',12),('E','C',10),('A','E',8)],12:[('A','D',10),('M','A',5*math.sqrt(3)),('M','H',5*math.sqrt(6))],13:[('A','B',14),('D','H',2*math.sqrt(43)),('D','A',5)],14:[('A','B',18),('M','O',3*math.sqrt(2))],15:[('A','B',10),('A','C',16),('M','O',2)],16:[('A','T1',3),('B','T1',10),('M','O',4)],18:[('B','C',16),('A','D',36),('M','O',16)],19:[('C','D',12),('M','O',6*math.sqrt(2))],20:[('A','B',25),('B','C',17),('B','E',17),('B','H',15),('A','C',28),('A','E',12)],25:[('B','B1',3*math.sqrt(7)),('B','D',24),('B1','D1',18)],26:[('B','B1',5),('A','B1',12),('B1','C',15),('A','C',9)],28:[('A','B',4*math.sqrt(2)),('B','C',4*math.sqrt(2)),('A','C',4*math.sqrt(2)),('S','C',2)],29:[('D','B',10*math.sqrt(3)),('H','K',15)],30:[('B','H',9)]}.items():
 p=points(11,n)
 for a,b,t in cs:eq(d(p,a,b),t,(11,n,a,b))
for n,a,b,c,t in [(11,'A','B','C',30),(12,'B','A','C',30),(13,'A','B','C',120),(19,'A','D','C',45),(29,'D','K','H',45),(29,'D','B','H',60)]:eq(angle(points(11,n),a,b,c),t,(11,n))
for n,ns,target in [(14,'ABC',3*math.sqrt(5)),(15,'ABCD',5.2),(16,'ABC',2*math.sqrt(5)),(17,'ABCD',5),(18,'ABCD',20),(19,'ABCD',3*math.sqrt(10))]:
 p=points(11,n)
 for a,b in zip(ns,ns[1:]+ns[:1]):eq(point_line(p,'M',a,b),target,(11,n,a,b))
p=points(11,23);eq(d(p,'A','C'),d(p,'A','D'));midpoint(p,'M','B','D');midpoint(p,'K','C','D')
p=points(11,24);eq(area(p,'D','C','K'),math.sqrt(2)/4)
for a,b in [('A','B'),('A','C'),('A','D'),('B','C'),('B','D'),('C','D')]:eq(d(p,a,b),1)
# Clip the tetrahedron independently by the plane specified by its normal.
for number,origin,direction,expected in [(23,'M',('C','D'),['A','K','M']),(24,'D',('A','B'),['D','C','K'])]:
 p=points(11,number);normal=v(p,*direction);hits=[]
 def remember(q):
  if all(math.dist(q,h)>1e-7 for h in hits):hits.append(q)
 for a,b in [('A','B'),('A','C'),('A','D'),('B','C'),('B','D'),('C','D')]:
  x=dot(normal,v(p,origin,a));y=dot(normal,v(p,origin,b))
  if abs(x)<1e-7:remember(p[a])
  if abs(y)<1e-7:remember(p[b])
  if x*y < -1e-10:remember([p[a][i]+x/(x-y)*(p[b][i]-p[a][i]) for i in range(3)])
 check(len(hits)==len(expected),(number,hits))
 for name in expected:check(any(math.dist(p[name],h)<1e-7 for h in hits),(number,name))
p=points(11,26);eq(area(p,'A','B','C'),117/2)
p=points(11,28);midpoint(p,'M','B','C');midpoint(p,'N','A','B');on(p,'P','S','M');on(p,'Q','C','N');perpendicular(p,'P','Q','S','M');perpendicular(p,'P','Q','C','N');eq(line_distance(p,'S','M','C','N'),2*math.sqrt(3)/3)
p=points(11,30);on(p,'O','A','C');on(p,'O','B','D');eq(d(p,'A','O')/d(p,'O','C'),13/5);eq(angle(p,'B','A','C'),angle(p,'C','A','D'));eq(area(p,'A','B','C')+area(p,'A','C','D'),243)
print(f'PASS: {COUNT} independent reviewer assertions, 71 cards; source inconsistency 10.20 explicitly verified.')
