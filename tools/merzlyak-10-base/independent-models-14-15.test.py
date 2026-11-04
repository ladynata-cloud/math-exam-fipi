#!/usr/bin/env python3
"""Independent model review: original solid clipping, exact orthogonal maps and derived lengths.
Complements a direct reading of all54 proof texts and the author's metric suite.
"""
import json,math
from pathlib import Path
import numpy as np
R=Path(__file__).resolve().parents[2];D=R/'stereo-course/merzlyak-10-base/lessons';N=0

def check(ok,label):
 global N;N+=1
 assert bool(ok),label

def near(a,b=0,label=''):check(np.allclose(a,b,atol=1e-8,rtol=1e-8),label)
def load(s,n):return json.loads((D/f'ex-{s:02}-{n:03}.json').read_text())
def pts(d):return{k:np.array(v,dtype=float)for k,v in d['visualization']['model']['points'].items()}
def norm(a):return np.linalg.norm(a)
def normal(p,ks):return np.cross(p[ks[1]]-p[ks[0]],p[ks[2]]-p[ks[0]])
def area(p,ks):return norm(sum((np.cross(p[a],p[b])for a,b in zip(ks,ks[1:]+ks[:1])),np.zeros(3)))/2
cards=[load(14,n)for n in range(1,36)]+[load(15,n)for n in range(1,20)]
for d in cards:
 s,n=map(int,d['source']['exercise'].split('.'));expected=(131 if n<=5 else 132 if n<=11 else 133 if n<=22 else 134 if n<=33 else 135)if s==14 else(137 if n<=7 else 138 if n<=17 else 139)
 check(expected in d['source']['printedPages'],d['id']+' source condition page')
 near([p+1 for p in d['source']['printedPages']],d['source']['pdfPages'],d['id']+' offset')
 m=d['visualization']['model'];p=pts(d)
 for st in d['steps']:
  check(bool(st['explanation'].strip()) and bool(st['prompt'].strip()),d['id']+' nonempty educational step')
  check(st['view']in m['views'],d['id']+' step view exists')
 for v in m['views'].values():
  for k in v.get('points',[])+v.get('polygon',[])+[x for e in v.get('segments',[])for x in e]:check(k in p,d['id']+' focused point exists')
# Independently intersect each original box edge, including zero/same-plane endpoints.
edges=[('A','B'),('B','C'),('C','D'),('D','A'),('A1','B1'),('B1','C1'),('C1','D1'),('D1','A1'),('A','A1'),('B','B1'),('C','C1'),('D','D1')]
for s,n,v in [(14,12,'section'),(14,22,'section'),(14,23,'section'),(14,24,'section'),(14,25,'section'),(15,7,'section'),(15,15,'low'),(15,15,'high'),(15,16,'section')]:
 d=load(s,n);p=pts(d);poly=d['visualization']['model']['views'][v]['polygon'];o=p[poly[0]];u=normal(p,poly[:3]);u=u/norm(u);hits=[]
 for a,b in edges:
  fa=float(u@(p[a]-o));fb=float(u@(p[b]-o))
  if fa*fb<0:hits.append(p[a]+fa/(fa-fb)*(p[b]-p[a]))
  if abs(fa)<1e-8:hits.append(p[a])
  if abs(fb)<1e-8:hits.append(p[b])
 for h in hits:check(any(norm(h-p[k])<1e-7 for k in poly),f'{s}.{n} {v} missing actual boundary point')
 for k in poly:check(any(norm(h-p[k])<1e-7 for h in hits),f'{s}.{n} {v} extra vertex')
 corners=[p[k]for k in ['A','B','C','D','A1','B1','C1','D1']]
 for a,b in zip(poly,poly[1:]+poly[:1]):check(any(abs(p[a][i]-t)<1e-8 and abs(p[b][i]-t)<1e-8 for i in range(3)for t in [min(q[i]for q in corners),max(q[i]for q in corners)]),f'{s}.{n} {v} face adjacency')
# The corrected source's negative answer must remain negative.
d=load(14,5);p=pts(d);check('BE⊥BD'in d['statement']['text'],'literal14.5b');near((p['E']-p['B'])@(p['D']-p['B']),144,'14.5b nonorthogonal');check('неверно'in str(d['steps']).lower() or 'не перпендикуляр'in str(d['steps']).lower(),'14.5b explicit negative')
# Real normal-foot construction and a visible point exactly when introduced.
for n,ks,target in [(31,['A','M','B'],24/5),(32,['C','M','D'],4*math.sqrt(2)/3)]:
 d=load(14,n);p=pts(d);u=normal(p,ks);u/=norm(u);t=p['O']-((p['O']-p[ks[0]])@u)*u;near(p['T'],t,f'14.{n} actual perpendicular foot');near(norm(p['T']-p['O']),target)
 view=d['visualization']['model']['views'][d['steps'][1]['view']];visible=set(view.get('points',[])+view.get('polygon',[])+[x for e in view.get('segments',[])for x in e]);check('T'in visible,f'14.{n} T visible in introductory step')
# Reconstruct orthogonal projection from the actual target plane, not z truncation assumptions.
for n in [1,2,3,4,5,6,9,10,11,12,13,14,17]:
 d=load(15,n);p=pts(d);src=d['visualization']['model']['views']['original']['polygon'];dst=d['visualization']['model']['views']['projection']['polygon'];u=normal(p,dst[:3]);u/=norm(u)
 for a,b in zip(src,dst):near(p[b],p[a]-((p[a]-p[dst[0]])@u)*u,f'15.{n} actual orthogonal foot{a}')
 ua=normal(p,src[:3]);ua/=norm(ua);near(area(p,dst),area(p,src)*abs(ua@u),f'15.{n} true area factor')
 if n==13:
  twice=d['visualization']['model']['views']['second']['polygon']
  for a,b in zip(dst,twice):near(p[b],p[a]-((p[a]-p[src[0]])@ua)*ua,'15.13 backward foot')
  near(area(p,twice)/area(p,src),.5)
 if n==17:
  check(norm(p['B1']-p['A1'])<math.sqrt(3)/2,'15.17 strict first bound');check(norm(p['C1']-p['A1'])<.5,'15.17 strict second bound');check(abs(ua@u)<.5,'15.17 angle over60')
# General15.15 formula at multiple independent slopes, including exact boundary.
for a in [1,2.5,7]:
 for angle in [0,12,30,45,60,84,90]:
  t=math.radians(angle);length=a/max(math.cos(t),math.sin(t));via_formula=a*a/(math.cos(t)if angle<=45 else math.sin(t));near(a*length,via_formula,'15.15 both regimes');check(length*math.cos(t)<=a+1e-8 and length*math.sin(t)<=a+1e-8,'15.15 endpoint inside box')
p=pts(load(15,16));near(area(p,['M','B','C','D','K'])/area(p,list('ABCD')),7/8,'15.16 retained projected region')
# Two folding distances rederived directly from each preserved triangle.
p=pts(load(14,29));near(norm(p['B']-p['D']),2*math.sqrt(337));near(norm(p['A']-p['B']),30);near(norm(p['B']-p['C']),40);near(norm(p['A']-p['D']),40);near(norm(p['D']-p['C']),30)
p=pts(load(14,30));near(norm(p['A']-p['C']),5);near(norm(p['A']-p['B']),norm(p['C']-p['D']));near(norm(p['A']-p['D']),norm(p['C']-p['B']))
print(f'INDEPENDENT_14_15_MODEL_OK: {N} assertions,54cards;9fullsections and13projectionmodels independently reconstructed')
