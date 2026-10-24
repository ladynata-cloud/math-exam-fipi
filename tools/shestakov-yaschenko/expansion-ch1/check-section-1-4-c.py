"""Numerical condition checks for all 34 §1.4 C expansion cards.
Independent geometric measurements, not checks of the generation formula alone.
Run from any directory; writes nothing.
"""
import ast, importlib.util, math, pathlib, re, sys
HERE=pathlib.Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
spec=importlib.util.spec_from_file_location('section14c',HERE/'section-1-4-c.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
cards={(v['number'],v['part']):v for v in module.lessons}
def near(a,b):assert math.isclose(a,b,rel_tol=2e-9,abs_tol=2e-9),(a,b)
def pt(v,n):return v['model']['points'][n][:2]
def vec(a,b):return (b[0]-a[0],b[1]-a[1])
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def dist(v,a,b):return math.dist(pt(v,a),pt(v,b))
def angle(v,a,b,c):
 u=vec(pt(v,b),pt(v,a));w=vec(pt(v,b),pt(v,c));return math.degrees(math.acos(max(-1,min(1,dot(u,w)/math.hypot(*u)/math.hypot(*w)))))
def area(v,*names):
 p=[pt(v,n) for n in names];return abs(sum(cross(p[i],p[(i+1)%len(p)]) for i in range(len(p))))/2

def perpendicular(v,a,b,c,d):near(dot(vec(pt(v,a),pt(v,b)),vec(pt(v,c),pt(v,d))),0)
def collinear(v,a,b,c):near(cross(vec(pt(v,a),pt(v,b)),vec(pt(v,a),pt(v,c))),0)
def midpoint(v,m,a,b):
 for x,y,z in zip(pt(v,m),pt(v,a),pt(v,b)):near(2*x,y+z)
def acute(v):
 for a,b,c in [('A','B','C'),('B','C','A'),('C','A','B')]:assert angle(v,a,b,c)<90-1e-7

def evaluate(s):
 s=s.replace(' ','').replace(',', '.').replace(':','/').replace('√(', 'sqrt(')
 s=re.sub(r'√(\d+)',r'sqrt(\1)',s);s=re.sub(r'(\d)(sqrt)',r'\1*\2',s)
 def calc(n):
  if isinstance(n,ast.Constant) and isinstance(n.value,(int,float)):return n.value
  if isinstance(n,ast.UnaryOp) and isinstance(n.op,ast.USub):return -calc(n.operand)
  if isinstance(n,ast.BinOp):
   a,b=calc(n.left),calc(n.right)
   if isinstance(n.op,ast.Add):return a+b
   if isinstance(n.op,ast.Sub):return a-b
   if isinstance(n.op,ast.Mult):return a*b
   if isinstance(n.op,ast.Div):return a/b
  if isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id=='sqrt' and len(n.args)==1:return math.sqrt(calc(n.args[0]))
  raise AssertionError(ast.dump(n))
 return [calc(ast.parse(x,mode='eval').body) for x in s.split(';')]
expected={
 (1,'a'):46,(1,'b'):72,(3,'a'):[4*math.sqrt(13),8*math.sqrt(13),12*math.sqrt(5)],(3,'b'):[11*math.sqrt(13),22*math.sqrt(13),33*math.sqrt(5)],
 (4,'a'):63,(4,'b'):57,(5,'a'):16/5,(5,'b'):8/7,(7,'a'):35,(7,'b'):28,
 (8,'a'):[8*math.sqrt(37),6*math.sqrt(37)],(8,'b'):[10*math.sqrt(61),8*math.sqrt(61)],
 (9,'a'):60,(9,'b'):45,(10,'a'):28,(10,'b'):28,(11,'a'):16/9,(11,'b'):11/25,
 (12,'a'):5/19,(12,'b'):2/33,(13,'a'):3/5,(13,'b'):1/5,(14,'a'):1/4,(14,'b'):1/3,
 (15,'a'):9/20,(15,'b'):1/6,(16,'a'):15,(16,'b'):30*math.sqrt(3)+2*math.sqrt(15),(17,'a'):13/3,(17,'b'):4/49,(18,'a'):132/5,(18,'b'):28/5}
for key,v in cards.items():
 assert 3<=len(v['steps'])<=6,(key,len(v['steps']))
 assert v['model']['planar']
 assert all(len(x)==3 and x[2]==0 and all(math.isfinite(c) for c in x) for x in v['model']['points'].values())
 for edge in v['model']['edges']:assert all(n in v['model']['points'] for n in edge),(key,edge)
 for st in v['steps']:
  assert st['explanation'] and st['reason'] and st['view'] in v['model']['views'],(key,st)
 for view in v['model']['views'].values():
  assert all(n in v['model']['points'] for n in view.get('points',[]))
  for edge in view.get('segments',[]):assert all(n in v['model']['points'] for n in edge)
 if key[0]==2:assert v['answer']['mode']=='manual' and 'accepted' not in v['answer'];continue
 expected_values=expected[key] if isinstance(expected[key],list) else [expected[key]]
 for alias in v['answer']['accepted']:
  actual=evaluate(alias);assert len(actual)==len(expected_values)
  for x,y in zip(actual,expected_values):near(x,y)

for part in ('a','b'):
 v=cards[1,part]
 if part=='a':
  near(angle(v,'B','A','C'),46);near(angle(v,'B','P','C')-angle(v,'B','M','C'),21)
  near(angle(v,'A','B','M'),angle(v,'M','B','C'));near(angle(v,'A','C','M'),angle(v,'M','C','B'))
  perpendicular(v,'B','P','A','C');perpendicular(v,'C','P','A','B')
 else:
  near(angle(v,'A','C','B'),72);near(angle(v,'A','K','B')-angle(v,'A','H','B'),18)
  near(angle(v,'B','A','K'),angle(v,'K','A','C'));near(angle(v,'A','B','K'),angle(v,'K','B','C'))
  perpendicular(v,'A','H','B','C');perpendicular(v,'B','H','A','C')
 v=cards[2,part]
 for names,length in zip([('A','B'),('B','C'),('A','C')],(16,17,22) if part=='a' else (18,19,26)):near(dist(v,*names),length)
 if part=='a':perpendicular(v,'A','H','B','C');near(dist(v,'B','H')+dist(v,'H','C'),17)
 else:perpendicular(v,'B','H','A','C');near(dist(v,'A','H')+dist(v,'H','C'),26)
 v=cards[3,part];L=16 if part=='a' else 44
 near(dist(v,'A','D'),L);near(dist(v,'B','E'),L);midpoint(v,'D','B','C');perpendicular(v,'A','D','B','E');collinear(v,'A','E','C')
 near(angle(v,'A','B','E'),angle(v,'E','B','C'));assert 'O' not in v['model']['labelNames']
 for names,length in zip([('A','B'),('B','C'),('A','C')],expected[3,part]):near(dist(v,*names),length)
 v=cards[4,part]
 midpoint(v,'D','B','C');midpoint(v,'E','A','C');midpoint(v,'F','A','B');perpendicular(v,'B','E','C','F');near(dist(v,'B','C'),42 if part=='a' else 38);near(dist(v,'A','D'),expected[4,part])
 v=cards[5,part];V,W,Z,r,s=('A','B','C',5,4) if part=='a' else ('B','C','A',7,2)
 midpoint(v,'M',V,Z);midpoint(v,'N',V,W);collinear(v,V,'D','K');collinear(v,V,'D','L');collinear(v,W,'K','M');collinear(v,Z,'L','N')
 near(angle(v,W,V,'D'),angle(v,'D',V,Z));near(dist(v,W,'K')/dist(v,'K','M'),r/s);near(dist(v,Z,'L')/dist(v,'L','N'),expected[5,part])
 v=cards[7,part];base,p,q=(7,4,1) if part=='a' else (8,5,2)
 near(dist(v,'B','C'),base);near(dist(v,'A','I')/dist(v,'I','D'),p/q)
 for V,W,Z in [('A','B','C'),('B','A','C'),('C','A','B')]:near(angle(v,W,V,'I'),angle(v,'I',V,Z))
 near(sum(dist(v,*edge) for edge in [('A','B'),('B','C'),('C','A')]),expected[7,part])
 v=cards[8,part];p,q,base=(4,3,14) if part=='a' else (5,4,18)
 near(dist(v,'B','H'),p);near(dist(v,'C','K'),q);near(dist(v,'B','C'),base);perpendicular(v,'B','H','A','H');perpendicular(v,'C','K','A','H');collinear(v,'A','K','H');near(angle(v,'B','A','H'),angle(v,'H','A','C'))
 near(dist(v,'A','B'),expected[8,part][0]);near(dist(v,'A','C'),expected[8,part][1])
 v=cards[9,part];acute(v);perpendicular(v,'A','K','B','C');perpendicular(v,'B','P','A','C');collinear(v,'B','K','C');collinear(v,'A','P','C');near(area(v,'C','K','P')/area(v,'A','B','C'),1/4 if part=='a' else 1/2);near(angle(v,'A','C','B'),expected[9,part])
 v=cards[10,part];acute(v);perpendicular(v,'A','K','B','C');perpendicular(v,'B','P','A','C');midpoint(v,'M','A','B');near(dist(v,'A','B'),16 if part=='a' else 20);near(math.cos(math.radians(angle(v,'A','C','B'))),3/4 if part=='a' else 2/5);near(dist(v,'M','K')+dist(v,'K','P')+dist(v,'P','M'),28)
 v=cards[11,part];near(angle(v,'C','B','P'),angle(v,'C','A','B'));collinear(v,'A','P','C');near(dist(v,'A','C')/dist(v,'B','C'),5/4 if part=='a' else 6/5)
 near(area(v,'C','B','P')/area(v,'A','B','P') if part=='a' else dist(v,'A','P')/dist(v,'P','C'),expected[11,part])
 v=cards[12,part];collinear(v,'A','P','B');collinear(v,'A','M','C');near(dist(v,'A','P')/dist(v,'P','B'),5/4 if part=='a' else 2/5);near(dist(v,'A','M')/dist(v,'M','C'),3/5 if part=='a' else 1/4);near(area(v,'A','P','M')/area(v,'M','C','B','P'),expected[12,part])
for key in [(13,'a'),(13,'b'),(14,'a'),(14,'b'),(15,'a'),(15,'b')]:
 v=cards[key];midpoint(v,'M','A','C');collinear(v,'B','K','M');collinear(v,'A','K','P');collinear(v,'B','P','C');S=area(v,'A','B','C')
 if key in [(13,'a'),(14,'a'),(14,'b')]:midpoint(v,'K','B','M')
 else:near(dist(v,'A','C')/dist(v,'A','B'),3);near(angle(v,'B','A','P'),angle(v,'P','A','C'))
 if key==(13,'a'):actual=area(v,'A','B','K')/area(v,'K','P','C','M')
 elif key in [(13,'b'),(14,'a')]:actual=area(v,'A','B','K')/S
 elif key in [(14,'b'),(15,'b')]:actual=area(v,'B','K','P')/area(v,'A','K','M')
 else:actual=area(v,'K','P','C','M')/S
 near(actual,expected[key])
 if 'N' in v['model']['points']:
  assert 'N' not in v['model']['labelNames'];collinear(v,'B','N','C');near(cross(vec(pt(v,'M'),pt(v,'N')),vec(pt(v,'A'),pt(v,'P'))),0);midpoint(v,'N','C','P')
for part in ('a','b'):
 v=cards[16,part]
 if part=='a':
  near(dist(v,'A','B'),6);near(dist(v,'A','C'),3*math.sqrt(5));perpendicular(v,'B','H','A','C');collinear(v,'A','K','D');collinear(v,'B','K','H');near(dist(v,'B','K')/dist(v,'K','H'),3/2);near(angle(v,'B','A','D'),angle(v,'D','A','C'))
 else:
  near(dist(v,'A','B'),8);near(dist(v,'A','C'),4*math.sqrt(15));perpendicular(v,'A','H','B','C');collinear(v,'B','K','D');collinear(v,'A','K','H');near(dist(v,'A','K')/dist(v,'K','H'),4);near(angle(v,'A','B','D'),angle(v,'D','B','C'))
 near(area(v,'A','B','C'),expected[16,part])
 v=cards[17,part];t=2/3 if part=='a' else 3/2
 for origin,tip,ext in [('B','C','A1'),('C','A','B1'),('A','B','C1')]:
  collinear(v,origin,tip,ext);near(dist(v,origin,ext),dist(v,origin,tip)+dist(v,tip,ext));near(dist(v,tip,ext)/dist(v,origin,tip),t)
 S=area(v,'A','B','C');outer=area(v,'A1','B1','C1');near(outer/S if part=='a' else S/outer,expected[17,part]);near(S+area(v,'A','B1','C1')+area(v,'B','C1','A1')+area(v,'C','A1','B1'),outer)
 v=cards[18,part];acute(v);perpendicular(v,'A','P','B','C');perpendicular(v,'B','M','A','C');collinear(v,'A','H','P');collinear(v,'B','H','M');collinear(v,'A','M','C');collinear(v,'B','P','C')
 near(dist(v,'B','M')/dist(v,'A','P'),8/7 if part=='a' else 3/2);near(area(v,'A','M','H'),3 if part=='a' else 4);near(area(v,'B','P','H'),12 if part=='a' else 16);near(area(v,'M','C','P','H'),expected[18,part]);assert ['H','C'] not in v['model']['edges']
print('SECTION_1_4_C_CHECKS_OK: 34 source-condition models, 32 exact answers/all aliases, 2 manual classifications, 3–6 steps each')
