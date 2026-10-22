#!/usr/bin/env python3
"""Independent reviewer checks supplement the author's full 84-card invariant suite.
No lesson or review flag is modified. Checks edge clipping, actual projection rays,
source triangle realizations and the literal nonuniqueness diagnostic in7.31.
"""
import json,math,itertools
from pathlib import Path
import numpy as np
R=Path(__file__).resolve().parents[2];D=R/'stereo-course/merzlyak-10-base/lessons';count=0

def check(x,msg):
 global count;count+=1
 assert bool(x),msg

def near(a,b,msg):check(np.allclose(a,b,rtol=1e-8,atol=1e-8),msg)
def lesson(p,n,part=None):return json.loads((D/f'ex-{p:02}-{n:03}{"-"+str(part) if part else ""}.json').read_text())
def points(d):return {k:np.array(x) for k,x in d['visualization']['model']['points'].items()}
def norm(v):return np.linalg.norm(v)
def plane(p,ks):
 q=p[ks[0]];return q,np.cross(p[ks[1]]-q,p[ks[2]]-q)
def onplane(p,base,normal,k):near(np.dot(p[k]-base,normal),0,'on plane '+k)
def distance(p,a,b):return norm(p[b]-p[a])
allcards=[json.loads(p.read_text()) for p in sorted(D.glob('ex-0[67]-*.json'))];check(len(allcards)==84,'84cards')
for d in allcards:
 p,n=map(int,d['source']['exercise'].split('.'));expected=(55 if n<=7 else 56 if n<=14 else 57 if n<=22 else 58 if n<=29 else 59) if p==6 else (68 if n<=6 else 69 if n<=13 else 70 if n<=20 else 71 if n<=29 else 72 if n<=38 else 73)
 check(expected in d['source']['printedPages'],d['id']+' literal condition page')
 check([i+1 for i in d['source']['printedPages']]==d['source']['pdfPages'],d['id']+' offset')
 check(d['answer']['mode'] in ['manual','exact'],d['id']+' proof or numeric answer mode')
 for st in d['steps']:
  check(bool(st['prompt'].strip()) and bool(st['explanation'].strip()) and st['view'] in d['visualization']['model']['views'],d['id']+' useful step structure')
# Full edge-plane intersection reconstructed without using author's clip routine.
base_edges=[('A','B'),('B','C'),('C','D'),('D','A'),('A1','B1'),('B1','C1'),('C1','D1'),('D1','A1'),('A','A1'),('B','B1'),('C','C1'),('D','D1')]
for n,anchors in [(16,['M','N','Q']),(17,['M','N','P']),(18,['M','N','K']),(19,['E','F','K']),(27,['E','F','_Edir']),(28,['E','F','_Edir']),(29,['E','F','K']),(30,['M','N','K'])]:
 d=lesson(6,n);p=points(d);origin,normal=plane(p,anchors);normal=normal/norm(normal)
 poly=next(v['polygon'] for v in reversed(list(d['visualization']['model']['views'].values())) if v.get('polygon'))
 intersections=[]
 for a,b in base_edges:
  fa=np.dot(normal,p[a]-origin);fb=np.dot(normal,p[b]-origin)
  if fa*fb<0:intersections.append(p[a]+fa/(fa-fb)*(p[b]-p[a]))
  if abs(fa)<1e-8:intersections.append(p[a])
  if abs(fb)<1e-8:intersections.append(p[b])
 for x in intersections:check(any(norm(x-p[k])<1e-8 for k in poly),f'6.{n} missed boundary intersection')
 for k in poly:check(any(norm(x-p[k])<1e-8 for x in intersections),f'6.{n} extraneous section vertex')
 # Each consecutive pair must share one boundary face (coordinate extremes).
 extremes=[(min(p[k][i] for k in ['A','B','C','D','A1','B1','C1','D1']),max(p[k][i] for k in ['A','B','C','D','A1','B1','C1','D1'])) for i in range(3)]
 for a,b in zip(poly,poly[1:]+poly[:1]):check(any(abs(p[a][i]-t)<1e-8 and abs(p[b][i]-t)<1e-8 for i in range(3) for t in extremes[i]),f'6.{n} edge crosses solid interior')
p=points(lesson(6,1));check(abs(np.dot(np.cross(p['B']-p['A'],p['H']-p['G']),p['G']-p['A']))>1e-8,'6.1 true skew counterexample')
p=points(lesson(6,7));origin,n=plane(p,['_b0','_b1','_b2'])
for k in ['A1','B1']:onplane(p,origin,n,k)
check(not any(k in p for k in ['C1','D1']),'6.7 removed wrong redundant points')
for n in [27,28]:
 d=lesson(6,n);p=points(d);check('X'in p,'aux X exists');v=d['visualization']['model']['views'][d['steps'][2]['view']];visible=set(v.get('points',[])+[x for e in v.get('segments',[]) for x in e]+v.get('polygon',[]));check('X'in visible,'aux X is actually focused')
for p,n,part,names in [(7,6,1,'ABCD'),(7,6,2,'ABCD'),(7,6,3,'AB'),(7,6,4,'AB'),(7,7,None,'ABC'),(7,13,None,'ABC'),(7,23,None,'AB'),(7,24,None,'ABC')]:
 q=points(lesson(p,n,part));rays=[q[k+'1']-q[k] for k in names];u=rays[0]
 for r in rays[1:]:near(np.cross(u,r),[0,0,0],f'{p}.{n} one projection direction')
# Check transformed vertices as actual mappings, not merely equal edge lengths.
for n in [19,20,21,22]:
 for part in [1,2]:
  p=points(lesson(7,n,part));keys=[k for k in p if k+'r'in p]
  if n<21:
   center=p[('B1' if n==19 else 'A') if part==1 else 'M']
   for k in keys:near(p[k]+p[k+'r'],2*center,'central symmetry every vertex')
  else:
   ends=(('A','D') if part==1 else ('B','C1')) if n==21 else (('D','B') if part==1 else ('A','M'))
   shift=p[ends[1]]-p[ends[0]]
   for k in keys:near(p[k+'r']-p[k],shift,'translation every vertex')
# A concrete preimage establishes compatibility of both alleged heights in7.28.
p=points(lesson(7,28));src={'A1':np.array([0.,0.]),'B1':np.array([4.,0.]),'C1':np.array([1.,3.]),'D1':np.array([2.,2.]),'E1':np.array([1.,0.])}
T=np.column_stack([p['B1'][:2]/4,(p['C1'][:2]-p['B1'][:2]/4)/3])
for k,x in src.items():near(T@x,p[k][:2],f'7.28 consistent preimage {k}')
near(np.dot(src['D1']-src['A1'],src['C1']-src['B1']),0,'7.28 AD altitude');near(np.dot(src['E1']-src['C1'],src['B1']-src['A1']),0,'7.28 CE altitude')
#7.31 two actual spatial squares, not just two arbitrary parallelograms.
p=points(lesson(7,31))
for h,suffix in [(1,'1'),(2,'2')]:
 unit=np.array([0.,1/h,math.sqrt(h*h-1)/h]);s=h/(1+h);left=(1-s)/2
 q={'D':np.array([left,0.,0.]),'E':np.array([left,0.,0.])+s*unit,'F':np.array([left+s,0.,0.])+s*unit,'M':np.array([left+s,0.,0.])}
 for k in q:near(q[k][:2]*4,p[k+suffix][:2],'7.31 exact projected square vertex')
 for a,b,c in [('D','E','F'),('E','F','M'),('F','M','D'),('M','D','E')]:near(norm(q[b]-q[a]),s,'7.31 equal square sides');near(np.dot(q[b]-q[a],q[c]-q[b]),0,'7.31 right square angles')
check(not np.allclose(p['E1'],p['E2']),'7.31 outputs differ')
# Recover circle geometry from the scene's two conjugate radius images.
T=np.array([[2.4,.7],[.2,1.3]]);Ti=np.linalg.inv(T)
for n,part in [(16,None),(17,None),(18,None),(33,None),(34,None),(36,1),(36,2),(37,1),(37,2)]:
 p=points(lesson(7,n,part));q={k:Ti@x[:2] for k,x in p.items()}
 for k,x in q.items():
  if k.startswith('_c'):near(norm(x),1,'ellipse drawn as affine circle')
 if n==34:
  near(np.dot(q['A1'],q['T2']-q['T1']),0,'7.34 tangent direction');near(np.dot(q['A1'],q['T1']),1,'7.34 tangent incidence')
 if n==36 and part==2:
  for a,b,k in [('X1','Y1','P1'),('Y1','Z1','A1'),('Z1','X1','Q1')]:near(np.dot(q[k],q[b]-q[a]),0,'7.36 tangent');near(np.dot(q[k],q[a]),1,'7.36 contact plane')
 if n==37 and part==2:
  for a,b in [('P1','Q1'),('Q1','R1'),('R1','S1'),('S1','P1')]:near(norm(q[b]-q[a]),2,'7.37 outer square side')
print(f'INDEPENDENT_06_07_MODEL_OK: {count} assertions;84 cards structurally covered, selected substantive geometry independently reconstructed.')
