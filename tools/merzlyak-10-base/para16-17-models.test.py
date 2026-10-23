#!/usr/bin/env python3
"""Author's independent-of-generator numerical checks; not independent release review."""
import json, math, re
from pathlib import Path
import numpy as np
from review_state import assert_review_state
R=Path(__file__).resolve().parents[2];L=R/'stereo-course/merzlyak-10-base/lessons';COUNT=0

def check(x,msg):
 global COUNT
 COUNT+=1
 assert x,msg

def eq(x,y,msg='metric'):check(abs(float(x)-float(y))<1e-7*max(1,abs(float(y))),f'{msg}: {x} != {y}')
def card(s,n):return json.loads((L/f'ex-{s}-{n:03}.json').read_text())
def pts(s,n):return {k:np.array(v,float) for k,v in card(s,n)['visualization']['model']['points'].items()}
def dist(p,a,b):return np.linalg.norm(p[a]-p[b])
def dot(p,a,b,c,d):return float(np.dot(p[b]-p[a],p[d]-p[c]))
def orth(p,a,b,c,d):eq(dot(p,a,b,c,d),0,'orthogonal')
def parallel(p,a,b,c,d):eq(np.linalg.norm(np.cross(p[b]-p[a],p[d]-p[c])),0,'parallel')
def col(p,a,b,c):parallel(p,a,b,a,c)
def area(p,ns):return sum(np.linalg.norm(np.cross(p[ns[i]]-p[ns[0]],p[ns[i+1]]-p[ns[0]]))/2 for i in range(1,len(ns)-1))
def perim(p,ns):return sum(dist(p,ns[i],ns[(i+1)%len(ns)]) for i in range(len(ns)))
def lateral(p,ns):return sum(area(p,[ns[i],ns[(i+1)%len(ns)],ns[(i+1)%len(ns)]+'1',ns[i]+'1']) for i in range(len(ns)))
def cosine(p,a,b,c,d):return dot(p,a,b,c,d)/dist(p,a,b)/dist(p,c,d)
def plane_cos(p,ns,ms):
 u=np.cross(p[ns[1]]-p[ns[0]],p[ns[2]]-p[ns[0]]);v=np.cross(p[ms[1]]-p[ms[0]],p[ms[2]]-p[ms[0]])
 return abs(np.dot(u,v))/np.linalg.norm(u)/np.linalg.norm(v)
def allrib(p,ns,a):
 for k,q in zip(ns,ns[1:]+ns[:1]):eq(dist(p,k,q),a);eq(dist(p,k,k+'1'),a)

for sec,num in [(16,47),(17,29)]:
 for n in range(1,num+1):
  d=card(sec,n);p=pts(sec,n);m=d['visualization']['model'];s=d['source']
  assert_review_state(d)
  check(s['exercise']==f'{sec}.{n}' and s['chapter']=='Глава 4. Многогранники','source identity')
  pg=(153 if n<=10 else 154 if n<=21 else 155 if n<=31 else 156 if n<=42 else 157) if sec==16 else(160 if n<=7 else 161 if n<=20 else 162)
  check(s['printedPages']==[pg] and s['pdfPages']==[pg+1],'source pages')
  check(3<=len(d['steps'])<=7,'step count')
  for step in d['steps']:check(step['view'] in m['views'] and bool(step['justifications']),'step evidence')
  for q in p.values():check(np.all(np.isfinite(q)),'finite coordinate')
  # Every represented prism must have a common translation between its bases.
  base=[k for k in p if re.fullmatch('[A-Z]',k) and k+'1' in p]
  if len(base)>=3:
   v=p[base[0]+'1']-p[base[0]]
   for k in base:eq(np.linalg.norm(p[k+'1']-p[k]-v),0,'prism translation')
  if m.get('planar'):check(all(abs(q[2])<1e-12 for q in p.values()),'planar XY')

p=pts(16,1);check(len(p)==6,'triangular minimum');eq(len(card(16,1)['visualization']['model']['edges']),9)
p=pts(16,2);eq(len(p),20);eq(len(card(16,2)['visualization']['model']['edges']),30)
p=pts(16,3);parallel(p,'O','O1','A','A1');orth(p,'A','A1','A','B')
p=pts(16,4);check(abs(dot(p,'A','A1','A','B'))>0,'counterexample oblique');eq(p['A1'][0],p['A'][0]);eq(p['C1'][0],p['C'][0])
p=pts(16,5);allrib(p,list('ABCD'),3);check(abs(dot(p,'A','B','A','D'))>1,'base non-square')
p=pts(16,6);eq(dist(p,'A','B'),dist(p,'C','D'));eq(cosine(p,'A','B','A','D'),math.cos(math.radians(70)))
p=pts(16,7);eq(len(p),10);eq(len(card(16,7)['visualization']['model']['edges']),15)
p=pts(16,8);eq(dist(p,'A','B'),3);eq(dist(p,'A','A1'),3*math.sqrt(6));eq(dist(p,'A','C1'),6*math.sqrt(2))
p=pts(16,9);eq(dist(p,'A','B'),5);eq(dist(p,'A','B1'),13);eq(dist(p,'A','A1'),12)
p=pts(16,10);col(p,'A','D','C');col(p,'B','E','C');eq(dist(p,'A','D'),dist(p,'D','C'));eq(area(p,['D','E','F']),18);eq(plane_cos(p,['D','E','F'],list('ABC')),math.cos(math.pi/6))
p=pts(16,11);eq(dist(p,'A','B'),8);eq(area(p,['A','C','M']),32*math.sqrt(2));eq(plane_cos(p,['A','C','M'],list('ABC')),1/math.sqrt(2))
p=pts(16,12);eq(dist(p,'A','B'),2);eq(dist(p,'A','D'),3);eq(lateral(p,list('ABCD')),60)
p=pts(16,13);eq(dist(p,'A','B'),6);eq(lateral(p,list('ABCDEFG')),420)
p=pts(16,14);eq(lateral(p,list('ABCD'))+2*area(p,list('ABCD')),2*3**2+4*3*4)
p=pts(16,15);eq(lateral(p,list('ABC'))+2*area(p,list('ABC')),3*3*4+9*math.sqrt(3)/2)
p=pts(16,16);eq(dist(p,'A','A1'),20);eq(dist(p,'A1','H'),10);orth(p,'A','H','H','A1')
p=pts(16,17);eq(lateral(p,list('ABCD')),160)
for k,q in zip('ABCD','BCDA'):eq(dist(p,k+'s',q+'s'),5);orth(p,k+'s',q+'s',k,k+'1')
p=pts(16,18);eq(dist(p,'As','Bs'),9);eq(dist(p,'As','Cs'),12);orth(p,'As','Bs','As','Cs');eq(lateral(p,list('ABC')),288)
p=pts(16,19);eq(dist(p,'A','A1'),3*math.sqrt(2));eq(dist(p,'B1','C1')/dist(p,'A','C1'),.5)
p=pts(16,20);allrib(p,list('ABCDEF'),3);eq(dist(p,'A','C1'),6);eq(dist(p,'A','D1'),3*math.sqrt(5))
p=pts(16,21);eq(dist(p,'A','B'),3);eq(cosine(p,'A','B','A','D'),.5);eq(dist(p,'A','C'),3*math.sqrt(3));eq(dist(p,'A','C1'),6)
p=pts(16,22);eq(dist(p,'A','C1'),16);eq(dist(p,'B','D1'),10);eq(dist(p,'A','A1'),4);eq(dist(p,'A','B'),9)
p=pts(16,23);eq(dist(p,'A','D'),18);eq(dist(p,'B','D'),2);orth(p,'C','D','A','B');eq(area(p,['C','D','D1','C1']),48)
p=pts(16,24);eq(dist(p,'C','A'),30);eq(dist(p,'C','B'),40);eq(dist(p,'A','A1'),50);eq(area(p,['C','M','M1','C1']),1250)
p=pts(16,25);allrib(p,list('ABC'),3);eq(area(p,['A','B','C1']),9*math.sqrt(7)/4);eq(plane_cos(p,['A','B','C1'],list('ABC')),math.sqrt(3/7))
p=pts(16,26);orth(p,'C','A','C','B');eq(cosine(p,'A','B','A','C'),math.cos(math.pi/6));eq(plane_cos(p,['A','C','D'],list('ABC')),1/math.sqrt(2));eq(dist(p,'B','D'),3)
p=pts(16,27);eq(dist(p,'A','C'),6);eq(cosine(p,'A','B','A','D'),.5);eq(plane_cos(p,['B','D','A1'],list('ABC')),1/math.sqrt(2));eq(area(p,['B','D','A1']),3*math.sqrt(6))
p=pts(16,28);eq(dist(p,'A','B'),2);eq(dist(p,'A','A1'),6);eq(np.linalg.norm(p['D']-(p['A']+p['B1'])/2),0);eq(cosine(p,'C','D','C','H'),.5)
p=pts(16,29);eq(dist(p,'A','B'),1);eq(dist(p,'A','A1'),math.sqrt(5));eq(np.linalg.norm(p['M']-(p['C']+p['D1'])/2),0);eq(dist(p,'A','H'),dist(p,'H','M'))
p=pts(16,30);eq(perim(p,list('ABC')),30);eq(lateral(p,list('ABC'))+2*area(p,list('ABC')),270)
p=pts(16,31);eq(lateral(p,list('ABCD')),96);eq(lateral(p,list('ABCD'))+2*area(p,list('ABCD')),128)
p=pts(16,32);eq(dist(p,'A','C1'),12);eq(dist(p,'C','C1')/dist(p,'A','C1'),.5);eq(lateral(p,list('ABCD'))+2*area(p,list('ABCD')),108+72*math.sqrt(6))
p=pts(16,33);eq(lateral(p,list('ABCD'))/area(p,['A','C','C1','A1']),2*math.sqrt(2))
p=pts(16,34);eq(dist(p,'A','C1'),5);eq(dist(p,'A','B1'),4)
p=pts(16,35);eq(dist(p,'A','D'),21);eq(dist(p,'B','C'),11);eq(dist(p,'A','B'),13);eq(area(p,['A','C','C1','A1']),180);eq(lateral(p,list('ABCD')),522);eq(area(p,['A','B1','C1','D']),240)
p=pts(16,36);eq(dist(p,'A','B1'),10);eq(lateral(p,list('ABCDEF')),288)
for a,h in [(6,8),(8,6)]:eq(a*a+h*h,100);eq(6*a*h,288)
p=pts(16,37);eq(dist(p,'A','A1'),9);eq(dist(p,'As','Bs'),8);eq(dist(p,'As','Cs'),15);orth(p,'As','Bs','As','Cs');eq(lateral(p,list('ABC')),360)
p=pts(16,38);eq(dist(p,'As','Bs'),16);eq(dist(p,'As','Cs'),14);eq(cosine(p,'As','Bs','As','Cs'),-.5);eq(lateral(p,list('ABC')),840);eq(dist(p,'A','A1'),15)
p=pts(16,39);eq(dist(p,'A','A1'),6);eq(np.linalg.norm(p['D']-(p['A1']+p['C1'])/2),0);eq(np.linalg.norm(p['E']-(p['B1']+p['C1'])/2),0);eq(plane_cos(p,['A','B','E'],list('ABC')),.5);eq(area(p,['A','B','E','D']),24*math.sqrt(3))
p=pts(16,40);eq(dist(p,'A','B'),4*math.sqrt(2));eq(dist(p,'A','A1'),6);parallel(p,'O','M','B','D1');eq(area(p,['A','C','M']),20)
p=pts(16,41);c=cosine(p,'A1','B','A1','D');eq(area(p,['B','A1','D']),4**2/2*math.sqrt(1-c*c)/c)
p=pts(16,42);c=cosine(p,'A1','B','A1','C');eq(area(p,['B','A1','C']),4**2*math.sqrt(1-c*c)/(2*(2*c-1)))
p=pts(16,43);allrib(p,list('ABC'),3);eq(cosine(p,'A','A1','A','B'),1/math.sqrt(2));eq(cosine(p,'A','A1','A','C'),1/math.sqrt(2));orth(p,'A','A1','B','C');eq(lateral(p,list('ABC')),9*(1+math.sqrt(2)))
p=pts(16,44);allrib(p,list('ABC'),3);eq(np.linalg.norm(p['O']-(p['A']+p['B']+p['C'])/3),0);orth(p,'A','A1','B','C');eq(lateral(p,list('ABC')),9*(1+math.sqrt(3)))
p=pts(16,45);check('не существует' in card(16,45)['steps'][1]['explanation'],'literal contradiction');check('только' in card(16,45)['visualization']['caption'],'conditional model');parallel(p,'A','C1','C','E');eq(dist(p,'C','E'),dist(p,'C','B1'));eq(dist(p,'C','E'),dist(p,'E','B1'))
p=pts(16,46);col(p,'B','E','C');col(p,'A','F','D');eq(np.linalg.norm(p['O']-(p['B']+p['D'])/2),0);eq(np.linalg.norm(p['O']-(p['E']+p['F'])/2),0)
p=pts(16,47);d=dist(p,'A','C');eq(dist(p,'A','B'),d/(2*math.cos(math.pi/6)));eq(dist(p,'B','D'),d*math.tan(math.pi/6));eq(area(p,list('ABCD')),d*d/2*math.tan(math.pi/6));eq(dist(p,'O','H'),d/2*math.sin(math.pi/6))

p=pts(17,1);allrib(p,list('ABCD'),3)
p=pts(17,2);orth(p,'A','A1','A','B');orth(p,'A','A1','A','D')
p=pts(17,3);eq(dist(p,'A','B'),5);eq(dist(p,'A','D'),12);eq(dist(p,'C','C1')/dist(p,'A','C'),math.sqrt(3))
p=pts(17,4);eq(area(p,['A','C','C1','A1']),100)
for n in [5,6]:
 p=pts(17,n);eq(dist(p,'A','B'),5);eq(dist(p,'A','D'),7);eq(dist(p,'A','A1'),12)
p=pts(17,5);eq(dist(p,'D','C')/dist(p,'C','C1'),5/12);eq(dist(p,'D','A')/dist(p,'A','B1'),7/13)
p=pts(17,6);eq(dist(p,'D','D1')/dist(p,'D1','C1'),12/5);eq(dist(p,'B','B1')/dist(p,'D','B'),12/math.sqrt(74))
p=pts(17,7);eq(dist(p,'A','C1'),7)
p=pts(17,8);eq(dist(p,'A','C1'),6);eq(sorted([dist(p,'A','B'),dist(p,'A','D'),dist(p,'A','A1')])[0],2)
p=pts(17,9);eq(dist(p,'A','C1'),3*math.sqrt(3))
p=pts(17,10);eq(lateral(p,list('ABCD'))+2*area(p,list('ABCD')),216);eq(area(p,['A','C','C1','A1']),36*math.sqrt(2))
p=pts(17,11);eq(lateral(p,list('ABCD'))+2*area(p,list('ABCD')),18)
p=pts(17,12);a=dist(p,'A','B');d=dist(p,'B','D');beta=math.atan(dist(p,'A','A1')/dist(p,'A','C'));eq(lateral(p,list('ABCD')),2*d*d/math.tan(math.pi/6)*math.tan(beta)/math.sin(math.pi/6))
p=pts(17,13);eq(dist(p,'A','B'),6);eq(dist(p,'B','D1'),dist(p,'A','C'));eq(lateral(p,list('ABCD')),144*math.sqrt(2))
p=pts(17,14);eq(dist(p,'A','B'),2*math.sqrt(2));eq(dist(p,'A','D'),4);eq(cosine(p,'A','B','A','D'),1/math.sqrt(2));eq(dist(p,'A','C1'),7);eq(lateral(p,list('ABCD')),12*(math.sqrt(2)+2))
p=pts(17,15);eq(dist(p,'A','B'),2);eq(dist(p,'A','D'),2*math.sqrt(3));eq(area(p,['B','D','D1','B1']),8);eq(lateral(p,list('ABCD'))+2*area(p,list('ABCD')),16+20*math.sqrt(3))
p=pts(17,16);eq(dist(p,'A','C'),11);eq(dist(p,'A','D1'),19);eq(dist(p,'A','B1'),20);eq(dist(p,'A','C1'),21)
p=pts(17,17);eq(dist(p,'A','C1'),17);eq(dist(p,'A','D'),8);eq(dist(p,'A','B'),9);eq(dist(p,'A','A1'),12)
p=pts(17,18);eq(dist(p,'A','C1'),dist(p,'B','D1'));orth(p,'A','B','A','D')
p=pts(17,19);eq(dist(p,'A','B'),6);eq(cosine(p,'A','B','A','D'),1/math.sqrt(2));col(p,'A','H','D');orth(p,'B','H','A','D');eq(plane_cos(p,['A','B1','D'],list('ABC')),.5);eq(dist(p,'A','A1'),3*math.sqrt(6));eq(area(p,['A','B1','C1','D']),36*math.sqrt(2))
p=pts(17,20);eq(dist(p,'A','D'),8);eq(cosine(p,'A','B','A','D'),math.cos(math.pi/6));col(p,'C','D','H');orth(p,'A','H','C','D');eq(plane_cos(p,['A1','C','D'],list('ABC')),1/math.sqrt(2));eq(dist(p,'A','A1'),4)
p=pts(17,21);d=dist(p,'A','C1');sa=5/d;sb=4/d;eq(lateral(p,list('ABCD')),2*d*d*sa*(sb+math.sqrt(1-sb*sb-sa*sa)))
p=pts(17,22);d=dist(p,'A','C1');a=3;sa=5/d;cb=3/d;eq(lateral(p,list('ABCD')),2*a*a*sa*(cb+math.sqrt(1-cb*cb-sa*sa))/(cb*cb))
p=pts(17,23);s1=area(p,['A','C','C1','A1']);s2=area(p,['B','D','D1','B1']);eq(lateral(p,list('ABCD')),2*math.hypot(s1,s2))
p=pts(17,24);s1=area(p,['A','C','C1','A1']);s2=area(p,['B','D','D1','B1']);eq(dist(p,'A','A1'),math.sqrt(s1*s2/(2*area(p,list('ABCD')))))
p=pts(17,25);eq(dist(p,'B','C'),8);eq(dist(p,'C','D'),4);eq(cosine(p,'C','B','C','D'),.5);orth(p,'D','B','D','C');eq(plane_cos(p,['B','D','C1'],list('ABC')),math.cos(math.pi/6));eq(lateral(p,list('ABCD')),32*math.sqrt(3))
p=pts(17,26);eq(dist(p,'A','B'),8)
for k in 'ABCD':eq(dist(p,'A1',k),6)
eq(dist(p,'O','A1'),2)
p=pts(17,27);allrib(p,list('ABCD'),8);eq(plane_cos(p,['A','B','B1'],list('ABC')),0);eq(plane_cos(p,['C','D','D1'],list('ABC')),0);eq(area(p,['A','D','D1','A1']),64)
p=pts(17,28);eq(dist(p,'A','B'),2*math.sqrt(2));eq(dist(p,'A','C'),dist(p,'B','C'));eq(cosine(p,'A','B','A','C'),math.cos(math.pi/6));col(p,'B','D','C');eq(cosine(p,'A','B','A','D'),cosine(p,'A','D','A','C'));eq(dist(p,'A','D'),2)
p=pts(17,29);eq(dist(p,'A','B'),20);eq(dist(p,'A','C'),30);eq(dist(p,'B','C'),30);col(p,'B','D','C');eq(dist(p,'B','D')/dist(p,'D','C'),2/3);eq(cosine(p,'A','B','A','D'),cosine(p,'A','D','A','C'));eq(dist(p,'A','D'),8*math.sqrt(6))
manifest=json.loads((R/'tools/merzlyak-10-base/coverage-16-17.json').read_text());check(len(manifest['entries'])==76,'coverage length')
for z in manifest['entries']:
 sec,n=map(int,z['exercise'].split('.'));check(z['sourceEntryId']==f'source-main-{sec:02}-{n:03}','sourceEntryId');check(z['requiredParts']==[None],'combined parts')
print(f'MERZLYAK_PARA16_17_SOURCE_AND_MODEL_OK: {COUNT} assertions, 76 cards with verified review state, 76 exercises; not independent review')
