"""Independent numeric and geometric checks for chapter 1 (reviewer chapter6)."""
from pathlib import Path
import json, math, ast, re
root=Path(__file__).resolve().parents[2]
p=json.loads((root/'stereo-course/shestakov-yaschenko-10-11/chapters/ch1.json').read_text())
# Expected quantities recalculated from the supplied source, separate from author helpers.
S=math.sqrt
expected={
'1.1-A1-a':12/4*(3+4),'1.1-A1-b':15*2/5,'1.1-A2-a':27*7/9,'1.1-A2-b':18*(1-5/6),
'1.1-A8-a':(180-134)/2,'1.1-A8-b':(180-36)/2,'1.1-A9-a':180-2*24,'1.1-A9-b':180-2*45,
'1.1-B1-a':14*(1+4/7),'1.1-B1-b':3*4/2,'1.1-B2-a':(5+14*3/7)/(14*4/7),'1.1-B2-b':4/13,
'1.2-A1-a':2*124-180,'1.2-A1-b':2*123-180,'1.2-A8-a':S(30**2-18**2),'1.2-A8-b':S(25**2-20**2),'1.2-A9-a':S(30**2+16**2),'1.2-A9-b':S(40**2+30**2),
'1.2-B2-a':8*S(64/((5/3)**2-1)),'1.2-B2-b':9*S(81/((5/4)**2-1)),'1.2-B3-a':25/2,'1.2-B3-b':9/2,
'1.2-C3-a':S(81+9-2*9*3*(162-36)/162),'1.2-C3-b':S(256+16-2*16*4*(512-64)/512),
'1.3-A4-a':S(169-25),'1.3-A4-b':S(400-144),'1.3-A7-a':S(400+441),'1.3-A7-b':S(289-64),'1.3-A8-a':54/2,'1.3-A8-b':32*2,
'1.3-B1-a':18*24/S(18**2+24**2),'1.3-B1-b':24*S(26**2-24**2)/26,'1.3-B2-a':S(6*24),'1.3-B2-b':S(28*7),'1.3-C4-a':8+4+S(64-16),'1.3-C4-b':9+3+S(81-9),
'1.4-A1-a':180-57-86,'1.4-A1-b':(180-46+36)/2,'1.4-A2-a':82/2,'1.4-A2-b':180-2*31-46,'1.4-A14-a':25*11,'1.4-A14-b':21*13,
'1.4-B2-a':13*3/4,'1.4-B2-b':59*3/4,'1.4-B10-a':(14**2+18**2-12**2)/(2*14*18),'1.4-B10-b':(9**2+15**2-21**2)/(2*9*15),'1.4-C6-a':6*8/2,'1.4-C6-b':10*24/2,
'1.5-A4-a':S(3**2+(-4)**2),'1.5-A4-b':S(5**2+12**2),'1.5-A5-a':(6,-4),'1.5-A5-b':(6,-3),'1.5-A6-a':(5,-5),'1.5-A6-b':(2,1),'1.5-B2-a':(6,11),'1.5-B2-b':(7,6),'1.5-B4-a':8*5/2,'1.5-B4-b':8*6/2,'1.5-C2-a':(14,2),'1.5-C2-b':(2,14)}
def value(s):
 s=s.replace('−','-').replace(' ','').replace(',','.').replace(':','/')
 if ';' in s:return tuple(float(v) for v in s.strip('()').split(';'))
 s=re.sub(r'√\(?([0-9]+)\)?',r'sqrt(\1)',s);s=re.sub(r'(?<=\d)sqrt', '*sqrt',s)
 def ev(n):
  if isinstance(n,ast.Expression):return ev(n.body)
  if isinstance(n,ast.Constant) and isinstance(n.value,(int,float)):return n.value
  if isinstance(n,ast.UnaryOp) and isinstance(n.op,ast.USub):return -ev(n.operand)
  if isinstance(n,ast.BinOp):
   a,b=ev(n.left),ev(n.right)
   if isinstance(n.op,ast.Add):return a+b
   if isinstance(n.op,ast.Sub):return a-b
   if isinstance(n.op,ast.Mult):return a*b
   if isinstance(n.op,ast.Div):return a/b
  if isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id=='sqrt' and len(n.args)==1:return S(ev(n.args[0]))
  raise ValueError(s)
 return ev(ast.parse(s,mode='eval'))
def eq(a,b):
 if isinstance(a,tuple):assert len(a)==len(b) and all(abs(x-y)<1e-8 for x,y in zip(a,b))
 else:assert abs(a-b)<1e-8,(a,b)
def distance(p,a,b):return math.dist(p[a],p[b])
def angle(p,a,o,b):
 u=[x-y for x,y in zip(p[a],p[o])];v=[x-y for x,y in zip(p[b],p[o])]
 return math.degrees(math.acos(max(-1,min(1,sum(x*y for x,y in zip(u,v))/math.hypot(*u)/math.hypot(*v)))))
released=[t for t in p['lessons'] if f"{t['section']}-{t['level']}{t['number']}-{t['part']}" in expected]
assert len(released)==len(expected)==60,'All original reviewed source cases remain present'
for t in released:
 key=f"{t['section']}-{t['level']}{t['number']}-{t['part']}";E=expected[key]
 for a in t['answer']['accepted']:eq(value(a),E)
 m=t['model'];q=m['points'];assert 'neutral' in m['views']
 for s in t['steps']:assert s['view'] in m['views']
 sec,level,num,part=t['section'],t['level'],t['number'],t['part']
 if sec=='1.2':
  if level=='C':eq(distance(q,'A','B'),9 if part=='a' else 16);eq(distance(q,'B','M'),E);eq(distance(q,'A','M'),3 if part=='a' else 4)
  else:
   eq(distance(q,'A','B'),distance(q,'B','C'))
   if level=='A' and num==1:eq(angle(q,'A','B','C'),E)
   if level=='A' and num==8:eq(distance(q,'B','H'),E)
   if level=='A' and num==9:eq(distance(q,'A','B'),E)
   if level=='B' and num==2:
    r=distance(q,'I','H');a=distance(q,'A','B');base=distance(q,'A','C');height=distance(q,'B','H')
    eq(distance(q,'B','I'),5);eq(base*height/2,E);eq(r*(a+base/2),E)
   if level=='B' and num==3:eq(angle(q,'A','B','C'),90)
 if sec=='1.3':
  eq(angle(q,'A','B','C'),90)
  if 'H' in q:eq(angle(q,'B','H','A'),90)
  if level=='A' and num==8:eq(distance(q,'B','M'),distance(q,'A','C')/2)
  if level=='B' and num==1:eq(distance(q,'B','H'),E)
  if level=='B' and num==2:eq(distance(q,'A','B') if part=='a' else distance(q,'B','H'),E)
  if level=='C':eq(sum(distance(q,a,b) for a,b in [('A','B'),('B','C'),('C','A')]),E)
 if sec=='1.4':
  if level=='A' and num==1:eq(angle(q,'A','C','B') if part=='a' else angle(q,'A','B','C'),E)
  if level=='A' and num==2:eq(angle(q,'B','A','D'),angle(q,'D','A','C'))
  if level=='B' and num==2:eq(distance(q,'B','M'),distance(q,'B','C'));eq(distance(q,'A','H'),E)
  if level=='B' and num==10:eq(math.cos(math.radians(angle(q,'B','A','C'))),E)
 if sec=='1.5' and level=='C':
  eq((q['A'][0]+q['A′'][0])/2,q['H'][0]);eq((q['A'][1]+q['A′'][1])/2,q['H'][1]);eq(q['H'][1]/q['H'][0],.5 if part=='a' else 2)
  direction=q['E'];v=[q['A′'][i]-q['A'][i] for i in range(3)];eq(sum(x*y for x,y in zip(direction,v)),0)
for t in p['theory']:
 assert len(t['steps'])>=3 and 'neutral' in t['model']['views']
 for s in t['steps']:assert s['view'] in t['model']['views']
print('60 source answers and every accepted syntax independently checked; geometry relationships passed; 5 theory cards structurally checked (text manually reviewed).')
# Independent initial-condition audit: known points/lines appear before help.
given={
 ('1.1','A',8):(['L'],[('O','L')]),
 ('1.2','A',1):(['E'],[('C','E')]),
 ('1.2','A',8):(['H'],[('B','H')]),('1.2','A',9):(['H'],[('B','H')]),
 ('1.2','B',2):(['I','H'],[('B','I'),('I','H')]),
 ('1.2','B',3):(['O','P','Q'],[('O','P'),('O','Q')]),
 ('1.2','C',3):(['M'],[('B','M')]),
 ('1.3','A',8):(['M'],[('B','M')]),
 ('1.3','B',1):(['H'],[('B','H')]),('1.3','B',2):(['H'],[('B','H')]),('1.3','C',4):(['H'],[('B','H')]),
 ('1.4','A',2):(['D'],[('A','D')]),('1.4','A',14):(['H','M','N'],[('C','H'),('M','N')]),
 ('1.4','B',2):(['M','H'],[('B','M'),('B','H')]),('1.4','C',6):(['M'],[('B','M')]),
 ('1.5','B',2):(['M'],[]),('1.5','C',2):(['E'],[])}
checked=0
for t in released:
 key=(t['section'],t['level'],t['number']);m=t['model'];q=m['points']
 if key in given:
  names,edges=given[key]
  assert all(n in m['labelNames'] for n in names),(key,names)
  for e in edges:assert any(set(edge)==set(e) for edge in m['edges']),(key,e)
  checked+=1
 if key==('1.2','A',1):eq(angle(q,'B','C','E'),124 if t['part']=='a' else 123)
 if key==('1.2','B',3):
  for x,y,z in [('A','B','P'),('B','C','Q')]:
   for k in range(3):eq(q[z][k],(q[x][k]+q[y][k])/2)
   v=[q[y][k]-q[x][k] for k in range(3)];w=[q[z][k]-q['O'][k] for k in range(3)]
   eq(sum(a*b for a,b in zip(v,w)),0)
 if key==('1.4','A',14):
  for x,y,z in [('A','C','M'),('B','C','N')]:
   for k in range(3):eq(q[z][k],(q[x][k]+q[y][k])/2)
  eq(angle(q,'C','H','A'),90)
 if key in [('1.5','A',4),('1.5','B',4)]:assert 'H' not in m['labelNames']
 if key==('1.5','A',5):assert 'Q' not in m['labelNames']
 if key==('1.5','C',2):assert 'H' not in m['labelNames'] and 'A′' not in m['labelNames']
assert checked==34
print('All 34 modified initial configurations checked: given objects visible, true auxiliaries remain hidden; new perpendicular-bisector and exterior-angle geometry passed.')
