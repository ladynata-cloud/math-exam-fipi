#!/usr/bin/env python3
"""Independent reviewer invariants for the 13 supplementary research exercises.
Source pages independently inspected: PDF31/143. This is not an approval marker.
"""
import json, math, pathlib, hashlib
from review_state import assert_review_state
BASE=pathlib.Path(__file__).resolve().parents[2]
LESSONS=BASE/'stereo-course/merzlyak-10-base/lessons'
EPS=2e-7
checks=[]
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def norm(a):return math.sqrt(dot(a,a))
def close(x,y):assert abs(x-y)<EPS*max(1,abs(x),abs(y)),(x,y)
def zero(a):close(norm(a),0)
def load(f,n):
 global p,current
 current=f'research-{f}-{n:03d}'; d=json.loads((LESSONS/(current+'.json')).read_text());p=d['visualization']['model']['points'];checks.append(current)
 assert_review_state(d)
 assert d['source']['printedPages']==([30] if f=='sections' else [142]);assert d['source']['pdfPages']==([31] if f=='sections' else [143])
 return d
def v(a,b):return sub(p[b],p[a])
def dist(a,b):return norm(v(a,b))
def line(x,a,b):zero(cross(v(a,x),v(a,b)))
def par(a,b,c,d):zero(cross(v(a,b),v(c,d)))
def perp(a,b,c,d):close(dot(v(a,b),v(c,d)),0)
def midpoint(m,a,b):zero(tuple(2*p[m][i]-p[a][i]-p[b][i] for i in range(3)))
def coplanar(*names):
 n=cross(v(names[0],names[1]),v(names[0],names[2]));assert norm(n)>EPS,(current,names)
 for x in names[3:]:close(dot(n,v(names[0],x)),0)
def skewdistance(a,b,c,d):
 n=cross(v(a,b),v(c,d));assert norm(n)>EPS
 return abs(dot(v(a,c),n))/norm(n)
def prism(base):
 t=v(base[0],base[0]+'1')
 for a in base:zero(sub(v(a,a+'1'),t))
def cube():
 prism('ABCD');a=dist('A','B')
 for x,y in [('B','C'),('C','D'),('D','A'),('A','A1')]:close(dist(x,y),a)
 for ab,cd in [(('A','B'),('A','D')),(('A','B'),('A','A1')),(('A','D'),('A','A1'))]:perp(*ab,*cd)

load('sections',1)
for x,a,b in [('M','A','D'),('N','A','C'),('K','C','B'),('X','N','M'),('X','C','D'),('Y','N','K'),('Y','A','B'),('Z','X','K'),('Z','M','Y'),('Z','B','D')]:line(x,a,b)
load('sections',2);cube()
for m,a,b in [('M','A','B'),('N','B','C'),('P','C','C1'),('Q','C1','D1'),('R','D1','A1'),('S','A1','A')]:midpoint(m,a,b)
coplanar('M','N','P','Q','R','S');midpoint('O','A','C1');midpoint('O','B','D1')
for a,b in [('M','Q'),('N','R'),('P','S')]:midpoint('O',a,b)
par('M','N','O','P');close(dist('M','N'),dist('O','P'))
load('sections',3);prism('ABC')
line('X','A','A1');line('Y','B','B1');close(dist('A','X')/dist('X','A1'),dist('B','Y')/dist('Y','B1'))
for x,a,b in [('U','C1','X'),('U','A','C'),('V','C1','Y'),('V','B','C')]:line(x,a,b)
par('U','V','A','B')
load('sections',4);cube();line('X','A','B');close(dist('A','X')/dist('X','B'),2);midpoint('T','A1','D1')
for y,c,h in [('Y','C1','H'),('V','E1','J')]:
 line(y,'A','A1');coplanar('X',y,c,'T',h)
line('H','B','C');line('J','B','E');close(dist('A','Y')/dist('Y','A1'),2/3);close(dist('A','V')/dist('V','A1'),1/3)
zero(sub(v('E','E1'),v('A','A1')));line('F','T','E1');line('F','A1','B1');line('V','F','X');close(dist('A1','F'),2*dist('A','B'))
load('sections',5);cube();midpoint('M','A1','D1');midpoint('N','C','C1')
for x,a,b in [('T','A','N'),('T','A1','C1'),('Q','M','T'),('Q','C1','D1'),('R','Q','N'),('R','C','D'),('P','A','R'),('P','B','C')]:line(x,a,b)
coplanar('A','P','N','Q','M');close(dist('B','P')/dist('P','C'),3);line('U','C1','D1');par('T','U','A1','D1');close(dist('Q','D1')/dist('Q','U'),.5);close(dist('C','R'),dist('C1','Q'))
load('sections',6);midpoint('K','B','C');midpoint('E','A','K');midpoint('F','D','K')
zero(tuple(3*p['G'][i]-p['A'][i]-p['B'][i]-p['D'][i] for i in range(3)))
for x,a,b in [('P','A','B'),('Q','B','D'),('E','C','P'),('F','C','Q'),('G','P','Q')]:line(x,a,b)
coplanar('C','P','Q','E','F','G');close(dist('A','C'),12)
load('skew-lines',1);cube();midpoint('O','A','B1');line('O','A1','B');perp('A','C1','A1','B');par('O','H','B','C');coplanar('A','B1','C1','O','H')
load('skew-lines',2);close(skewdistance('A','B','C','D'),1.5);coplanar('A','B','P','Q');assert norm(cross(v('A','B'),v('A','P')))>EPS
assert p['A'][2]==p['B'][2]==p['P'][2]==p['Q'][2]==0 and p['C'][2]==p['D'][2]==1.5
load('skew-lines',3)
for a,b,c,d in [('A','B','C','D'),('A','B','E','F'),('C','D','E','F')]:assert skewdistance(a,b,c,d)>EPS
assert abs(dot(v('A','B'),cross(v('C','D'),v('E','F'))))>EPS
line('P','A','B');line('Q','C','D');par('P','Q','E','F')
load('skew-lines',4);prism('ABCD');par('A','B','D','C');par('A','D','B','C')
for a,b,c,d in [('A','B','A1','D1'),('A','B','C','C1'),('A1','D1','C','C1')]:assert skewdistance(a,b,c,d)>EPS
assert abs(dot(v('A','B'),cross(v('A1','D1'),v('C','C1'))))>EPS
load('skew-lines',5);perp('C','D','C','A');perp('C','D','C','B');midpoint('M','D','B');midpoint('N','A','B');line('K','C','D');close(dist('C','K')/dist('K','D'),.5)
for a,q in [('A','P'),('B','Q'),('M','R')]:
 par(a,q,'C','N');perp('C',q,'C','N')
midpoint('C','P','Q');midpoint('R','D','Q');line('K','P','R');close(skewdistance('C','N','A','M'),skewdistance('C','N','B','K'))
for x,a,b in [('H','P','K'),('J','Q','K')]:line(x,a,b);perp('C',x,a,b)
close(dist('C','H'),dist('C','J'))
load('skew-lines',6);cube();line('O','A1','B');line('H','A','C1');perp('O','H','A','C1');perp('O','H','A1','B');close(dist('O','H'),dist('A','B')*math.sqrt(6)/6)
load('skew-lines',7)
for a,b in [('A','B'),('A','C'),('A','D'),('B','C'),('B','D'),('C','D')]:close(dist(a,b),2)
midpoint('M','A','B');midpoint('N','C','D');perp('M','N','A','B');perp('M','N','C','D');close(dist('M','N'),math.sqrt(2))
# All authored base faces and highlighted polygons must be flat/nonzero, all visible segments nonzero.
for name in checks:
 d=json.loads((LESSONS/(name+'.json')).read_text());model=d['visualization']['model'];p=model['points'];current=name
 for e in model['edges']:assert dist(*e)>EPS,(name,e)
 for f in model['faces']:coplanar(*f)
 for view in model['views'].values():
  for e in view.get('segments',[]):assert dist(*e)>EPS,(name,e)
  if view.get('polygon'):coplanar(*view['polygon'])
print(f'Independent checks passed: {len(checks)} supplementary lessons; exact source pages, task-specific invariants and all model geometry.')
