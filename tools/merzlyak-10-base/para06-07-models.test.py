#!/usr/bin/env python3
"""Author-side source-contract, incidence, metric and projection checks for §§6–7.
These are deterministic mathematical checks, not independent review or release approval.
"""
import json, math
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
DIR=ROOT/'stereo-course/merzlyak-10-base/lessons'
COUNT=0

def check(ok,label):
 global COUNT
 COUNT+=1
 assert bool(ok),label

def near(a,b,label):check(np.allclose(a,b,rtol=1e-8,atol=1e-8),label)
def card(s,n,part=None):return json.loads((DIR/f'ex-{s:02}-{n:03}{"-"+str(part) if part is not None else ""}.json').read_text())
def pts(s,n,part=None):return {k:np.array(v) for k,v in card(s,n,part)['visualization']['model']['points'].items()}
def dist(p,a,b):return np.linalg.norm(p[a]-p[b])
def vec(p,a,b):return p[b]-p[a]
def par(p,a,b,c,d,label='parallel'):near(np.cross(vec(p,a,b),vec(p,c,d)),[0,0,0],label)
def col(p,a,b,c,label='collinear'):par(p,a,b,a,c,label)
def ratio(p,a,m,b,t,label='division'):near(p[m],(1-t)*p[a]+t*p[b],label)
def normal(p,ns):return np.cross(p[ns[1]]-p[ns[0]],p[ns[2]]-p[ns[0]])
def inplane(p,ns,x,label='coplanar'):near(np.dot(normal(p,ns),p[x]-p[ns[0]]),0,label)
def parallel_planes(p,first,second,label):
 n=normal(p,first);m=normal(p,second);check(np.linalg.norm(n)>1e-7 and np.linalg.norm(m)>1e-7,label+' nondegenerate');near(np.cross(n,m),[0,0,0],label);check(abs(np.dot(n,p[second[0]]-p[first[0]]))>1e-7,label+' distinct')
def angle(p,a,b,c):
 u=vec(p,b,a);v=vec(p,b,c);return math.degrees(math.acos(np.clip(np.dot(u,v)/np.linalg.norm(u)/np.linalg.norm(v),-1,1)))

def section_check(n,defining,expected):
 d=card(6,n);m=d['visualization']['model'];p={k:np.array(v) for k,v in m['points'].items()};poly=next(v['polygon'] for k,v in reversed(list(m['views'].items())) if 'polygon'in v)
 check(set(poly)==set(expected),f'6.{n} contour names')
 verts=['A','B','C','D','A1','B1','C1','D1'];edges=[x for x in m['edges'] if x[0] in verts and x[1] in verts];nrm=normal(p,defining)
 for x in poly:
  inplane(p,defining,x,f'6.{n} {x} on plane')
  on=[]
  for a,b in edges:
   t=np.dot(p[x]-p[a],p[b]-p[a])/np.dot(p[b]-p[a],p[b]-p[a]);on.append(-1e-8<=t<=1+1e-8 and np.linalg.norm(p[x]-(p[a]+t*(p[b]-p[a])))<1e-8)
  check(any(on),f'6.{n} {x} on solid edge')
 # Every strictly crossed edge contributes a vertex already in the polygon.
 for a,b in edges:
  fa=np.dot(nrm,p[a]-p[defining[0]]);fb=np.dot(nrm,p[b]-p[defining[0]])
  if fa*fb< -1e-8:
   hit=p[a]+fa/(fa-fb)*(p[b]-p[a]);check(any(np.linalg.norm(hit-p[x])<1e-8 for x in poly),f'6.{n} complete edge {a}{b}')

# Source coverage and authoring status: 74 exact numbered positions, 84 cards.
cov=json.loads((ROOT/'tools/merzlyak-10-base/coverage-06-07.json').read_text());allcards=[json.loads(x.read_text()) for x in sorted(DIR.glob('ex-0[67]-*.json'))]
check(len(allcards)==84,'84 authored cards');check(len(cov['entries'])==74,'74 numbered exercise contracts')
check({d['source']['exercise'] for d in allcards}=={f'{s}.{n}' for s,count in [(6,34),(7,40)] for n in range(1,count+1)},'all numbers, no omissions')
for d in allcards:
 s=d['source'];sec,n=map(int,s['exercise'].split('.'));page=(55 if n<=7 else 56 if n<=14 else 57 if n<=22 else 58 if n<=29 else 59) if sec==6 else (68 if n<=6 else 69 if n<=13 else 70 if n<=20 else 71 if n<=29 else 72 if n<=38 else 73)
 pages=[58,59] if sec==6 and n==29 else [68,69] if sec==7 and n in (1,2) else [page]
 check(s['printedPages']==pages and s['pdfPages']==[x+1 for x in pages],d['id']+' exact source pages')
 check(d['status']=='draft' and all(d['review'][k]=='pending' for k in ('source','mathematics','pedagogy')),d['id']+' no unearned review')
 check(3<=len(d['steps'])<=7,d['id']+' meaningful bounded sequence')
 check(all(x.get('view') in d['visualization']['model']['views'] for x in d['steps']),d['id']+' every step resolves a view')
for g in cov['entries']:
 actual=[d for d in allcards if d['source']['exercise']==g['exercise']]
 check(g['requiredParts']==[d['source'].get('subpart') for d in actual],g['exercise']+' exact parts')

p=pts(6,1);par(p,'C','D','E','F');par(p,'A','B','C','D');check(np.linalg.norm(np.cross(vec(p,'A','B'),vec(p,'G','H')))>1,'6.1 skew directions');near(p['A'][2],0,'lower plane');near(p['G'][2],2,'upper plane')
p=pts(6,2);par(p,'A','B','D','C');par(p,'A','E','D','F');parallel_planes(p,['A','B','E'],['D','C','F'],'6.2')
p=pts(6,3)
for mid,end in [('M','B'),('N','C'),('K','D')]:ratio(p,'A',mid,end,.5,'6.3 midpoint')
parallel_planes(p,['M','N','K'],['B','C','D'],'6.3')
p=pts(6,4)
for q,x in [('E','A'),('F','B'),('K','C')]:ratio(p,'D',q,x,.45,'6.4 ratio')
parallel_planes(p,['E','F','K'],['A','B','C'],'6.4')
p=pts(6,5)
for k in 'ABCDEF':near(np.linalg.norm(p[k]),2,'6.5 regular radius')
for i,k in enumerate('ABCDEF'):near(dist(p,k,'ABCDEF'[(i+1)%6]),2,'6.5 regular side')
par(p,'A','C','D','F');n=normal(p,['_a0','_a1','_a2']);near(np.dot(n,vec(p,'A','C')),0,'6.5 line direction parallel plane');check(abs(np.dot(n,p['A']-p['_a0']))>1e-8,'6.5 AC outside plane');check(abs(np.dot(n,p['D']-p['_a0']))>1e-8,'6.5 DF outside plane');check(np.linalg.norm(np.cross(n,[0,0,1]))>1e-8,'6.5 planes not parallel')
p=pts(6,6);par(p,'A','D','B','C');col(p,'A','B','X');col(p,'D','C','X')
p=pts(6,7);par(p,'A','B','A1','B1');par(p,'A','A1','B','B1');near(dist(p,'A','A1'),dist(p,'B','B1'),'6.7 equal intercepts');inplane(p,['_b0','_b1','_b2'],'A1');inplane(p,['_b0','_b1','_b2'],'B1');check(np.linalg.norm(np.cross(normal(p,['_b0','_b1','_b2']),[0,0,1]))>1e-8,'6.7 planes intersect')
p=pts(6,8)
for a,b,length in [('C','D',12),('C','C1',4),('D','D1',4),('C1','D1',12)]:near(dist(p,a,b),length,'6.8 metric')
p=pts(6,9)
for x in 'ABC':near(p[x+'1']-p[x],[.5,.7,2],'6.9 common translation')
p=pts(6,10);par(p,'D','E','A','B');par(p,'D','F','B','C');inplane(p,['A','B','D'],'E');inplane(p,['B','C','D'],'F')
p=pts(6,11);par(p,'M','E','K','P');par(p,'K','F','M','N');inplane(p,['M','K','P'],'E');inplane(p,['M','N','K'],'F')
p=pts(6,12,1);near(dist(p,'A2','C2'),36,'6.12.1 given');near(dist(p,'B','A1')/dist(p,'B','A2'),5/9,'6.12.1 ratio');near(dist(p,'A1','C1'),20,'6.12.1 answer')
p=pts(6,12,2)
for a,b,v in [('A1','C1',14),('A2','C2',21),('B','C1',12),('C1','C2',6)]:near(dist(p,a,b),v,'6.12.2 metric')
p=pts(6,13);near(dist(p,'C','D'),32,'6.13 CD');near(dist(p,'A','C')/dist(p,'A','O'),7/3,'6.13 AC:AO');near(dist(p,'A','B'),24,'6.13 answer');col(p,'A','O','C');col(p,'B','O','D')
p=pts(6,14)
for a,b in [('A','B'),('C','D'),('E','F')]:ratio(p,a,'O',b,.5,'6.14 midpoint')
parallel_planes(p,['A','C','E'],['B','D','F'],'6.14')
p=pts(6,15);parallel_planes(p,['A','C','B1'],['A1','C1','D'],'6.15')
p=pts(6,16);ratio(p,'A','M','B',1/3);parallel_planes(p,['M','N','Q'],['A','C','C1'],'6.16');near(np.dot(vec(p,'M','N'),vec(p,'M','Q')),0,'6.16 right angle');near(sum(dist(p,a,b) for a,b in [('M','N'),('N','P'),('P','Q'),('Q','M')]),6+4*math.sqrt(2),'6.16 perimeter a=3')
p=pts(6,17);ratio(p,'C','M','C1',.5);parallel_planes(p,['M','N','P'],['A1','B','C'],'6.17');near(np.dot(vec(p,'N','M'),vec(p,'N','P')),0,'6.17 right angle');near(sum(dist(p,a,b) for a,b in [('M','N'),('N','P'),('P','Q'),('Q','M')]),3*(2+math.sqrt(2)),'6.17 perimeter')
for n,tri,names in [(18,['M','N','K'],'MKLPQR'),(19,['E','F','K'],'EHRGFQ'),(27,['E','F','_Edir'],['E','P','F','W','Q','S']),(28,['E','F','_Edir'],'EPRFQS'),(29,['E','F','K'],'EFSKPQ'),(30,['M','N','K'],'MPKQRN')]:section_check(n,tri,names)
p=pts(6,18);ratio(p,'A','M','A1',.4);ratio(p,'A','K','D',.75);ratio(p,'B','N','B1',1.4);col(p,'M','N','R');par(p,'N','P','M','K');par(p,'R','Q','K','L')
p=pts(6,19);ratio(p,'A','E','B',.25);ratio(p,'A1','F','D1',.3);ratio(p,'B1','K','C1',1.5);col(p,'F','K','U');col(p,'E','Q','U');par(p,'H','R','Q','F');par(p,'E','H','F','G')
p=pts(6,20)
for x in ['X','Y']:inplane(p,['B','D','D1'],x);inplane(p,['C','C1','M'],x)
par(p,'X','Y','C','C1')
p=pts(6,21)
for x in ['O','P']:inplane(p,['A','C','C1'],x);inplane(p,['B','E','D'],x)
par(p,'E','P','B','D')
p=pts(6,22);inplane(p,['B','C','D'],'K');col(p,'P','Q','K');parallel_planes(p,['P','Q','R'],['A','B','D'],'6.22')
p=pts(6,23);inplane(p,['A','B','C'],'E');col(p,'P','Q','E');parallel_planes(p,['P','Q','R'],['C','M','D'],'6.23');inplane(p,['P','Q','R'],'S');col(p,'M','A','R');col(p,'M','B','S')
p=pts(6,24)
for z,prefix in [(0,'a'),(1.8,'b'),(3.6,'g')]:
 for i in range(4):near(p[f'_{prefix}{i}'][2],z,'6.24 parallel plane')
p=pts(6,25);par(p,'A','C','B','V');par(p,'B','D','A','U');parallel_planes(p,['A','U','C'],['B','V','D'],'6.25')
p=pts(6,26);near(p['P'][2],0,'6.26 P in alpha');near(p['Q'][2],0,'6.26 line in alpha');near(np.dot(vec(p,'P','Q'),[0,0,1]),0,'6.26 direction parallel beta')
for n in [27,28]:
 p=pts(6,n);par(p,'U','V','E','_Edir',f'6.{n} prescribed direction');check(np.linalg.norm(np.cross(p['U']-p['E'],p['_Edir']-p['E']))>1e-8,f'6.{n} a distinct from base trace')
p=pts(6,27);col(p,'E','P','X','6.27 base extension');col(p,'X','Q','S','6.27 left trace');par(p,'X','Q','P','F','6.27 parallel opposite traces')
p=pts(6,28);col(p,'F','Q','X','6.28 top extension');col(p,'E','S','X','6.28 left trace')
p=pts(6,31)
for a,b,c,d in [('A','B','D','E'),('B','C','E','F'),('C','D','F','A')]:par(p,a,b,c,d,'6.31 opposite directions')
check(abs(dist(p,'A','B')-dist(p,'D','E'))>1,'6.31 unequal lengths')
p=pts(6,32);ratio(p,'A','M','D',.2);ratio(p,'C','N','A1',.6);near(np.dot(vec(p,'M','N'),normal(p,['B','C1','D'])),0,'6.32 MN parallel plane');check(abs(np.dot(p['M']-p['B'],normal(p,['B','C1','D'])))>1e-8,'6.32 MN outside plane')
for ns in [('H','O','C1'),('H','G','C1'),('A1','G','C'),('L','T','N'),('A1','L','H')]:col(p,*ns,'6.32 auxiliary incidence')
par(p,'L','N','H','C1');near(dist(p,'A1','N')/dist(p,'A1','C'),2/5,'6.32 ratio answer')
p=pts(6,33)
for a,b,v in [('B1','B2',4),('B2','B3',6),('A1','A3',15),('A1','A2',6)]:near(dist(p,a,b),v,'6.33 metric')
col(p,'A1','A2','A3');col(p,'B1','B2','B3')
p=pts(6,34);ratio(p,'C','M','O',1/3);near(np.dot(vec(p,'O','B'),vec(p,'O','M')),0,'6.34 right angle');near(dist(p,'O','B')/dist(p,'O','M'),1.5,'6.34 tangent')

# Projection and construction contracts.
p=pts(7,1)
for a in 'ABCD':near(p[a+'1']-p[a],[0,0,3],'7.1 translation')
p=pts(7,2)
for a,b in [('B','C'),('B1','C1'),('A','D'),('A1','D1')]:near(p[b]-p[a],[3,0,0],'7.2 translation')
p=pts(7,3)
for names,count in [(['A','B','C'],1),(['D','E','F'],2),(['G','H','I'],3)]:check(len({tuple(p[k][:2]) for k in names})==count,'7.3 projection count')
p=pts(7,4);col(p,'A','B','O');col(p,'C','D','O');check(np.linalg.norm(np.cross(vec(p,'A','B'),vec(p,'C','D')))>1e-8,'7.4 intersecting distinct');near(p['O1'][:2],p['O'][:2],'7.4 common image')
p=pts(7,5);check(abs(np.dot(np.cross(vec(p,'A','B'),vec(p,'C','D')),p['C']-p['A']))>1e-8,'7.5 originals skew');par(p,'A1','B1','C1','D1','7.5 parallel images')
for part in [1,2]:
 p=pts(7,6,part)
 for x in 'ABCD':near(p[x][:2],p[x+'1'][:2],'7.6 vertical projection')
 if part==1:check(abs(dist(p,'A','B')-dist(p,'C','D'))>1e-7,'7.6.1 unequal');near(dist(p,'A1','B1'),dist(p,'C1','D1'),'7.6.1 equal images')
 else:near(dist(p,'A','B'),dist(p,'C','D'),'7.6.2 equal');check(abs(dist(p,'A1','B1')-dist(p,'C1','D1'))>1e-7,'7.6.2 unequal images')
p=pts(7,6,3);par(p,'A','A1','B','B1');near(dist(p,'A','B'),1,'7.6.3 original');near(dist(p,'A1','B1'),2,'7.6.3 image')
p=pts(7,6,4);par(p,'A','B','A1','B1');check(p['A'][2]!=p['A1'][2],'7.6.4 distinct')
p=pts(7,7);check(np.linalg.norm(normal(p,['A','B','C']))>1e-8,'7.7 triangle nondegenerate');col(p,'A1','B1','C1');ratio(p,'A1','B1','C1',.575)
p=pts(7,8)
for a,b,c,v in [('D1','A1','B1',10),('A1','B1','C1',40),('B1','C1','D1',140),('C1','D1','A1',170)]:near(angle(p,a,b,c),v,'7.8 exact angles')
p=pts(7,9)
for a,b in [('A1','B1'),('B1','C1'),('C1','D1'),('D1','A1')]:near(dist(p,a,b),12,'7.9 rhombus side')
p=pts(7,10);ratio(p,'A1','O1','C1',.5);ratio(p,'B1','H1','C1',.5)
p=pts(7,11);ratio(p,'A1','M1','B1',.5);ratio(p,'A1','N1','C1',.5);par(p,'M1','N1','B1','C1')
p=pts(7,12);ratio(p,'A1','M1','B1',.6);ratio(p,'A1','N1','C1',.5);par(p,'M1','H1','B1','N1');col(p,'A1','H1','C1')
p=pts(7,13)
for a,b,v in [('A','B',8),('B','C',6),('A1','B1',12),('B1','C1',9)]:near(dist(p,a,b),v,'7.13 exact metric')
par(p,'A','A1','B','B1');par(p,'A','A1','C','C1');col(p,'A','B','C')
p=pts(7,14);ratio(p,'A1','N1','C1',.5);ratio(p,'B1','M1','C1',.5);ratio(p,'B1','I1','N1',2/3);col(p,'A1','M1','I1')
p=pts(7,15)
for a,m,b in [('A1','K1','B1'),('C1','L1','D1'),('B1','M1','C1'),('A1','N1','D1')]:ratio(p,a,m,b,.5)
# Recover the original circle coordinates from the exact affine ellipse map.
T=np.array([[2.4,.7],[.2,1.3]]);Ti=np.linalg.inv(T)
def unellipse(p,k):return Ti@p[k][:2]
for n,part in [(16,None),(17,None),(18,None),(33,None),(34,None),(36,1),(36,2),(37,1),(37,2)]:
 p=pts(7,n,part)
 for k in p:
  if k.startswith('_c'):near(np.linalg.norm(unellipse(p,k)),1,f'7.{n} ellipse locus')
p=pts(7,16);near(unellipse(p,'A1'),-unellipse(p,'B1'),'7.16 diameter');near(np.dot(unellipse(p,'A1')-unellipse(p,'C1'),unellipse(p,'B1')-unellipse(p,'C1')),0,'7.16 original right angle')
p=pts(7,17)
for i,k in enumerate(['A1','B1','C1','D1']):
 prev=['A1','B1','C1','D1'][(i-1)%4];nxt=['A1','B1','C1','D1'][(i+1)%4];near(np.dot(unellipse(p,prev)-unellipse(p,k),unellipse(p,nxt)-unellipse(p,k)),0,'7.17 original rectangle')
p=pts(7,18);ratio(p,'A1','M1','B1',.5);near(np.dot(unellipse(p,'P1')-unellipse(p,'Q1'),unellipse(p,'A1')-unellipse(p,'B1')),0,'7.18 original perpendicular diameter')
for n in [19,20,21,22]:
 for part in [1,2]:
  p=pts(7,n,part);vertices=list('ABCD')+([k+'1' for k in 'ABCD'] if n in [19,21] else [])
  if n in [19,20]:
   center=('B1' if part==1 else 'M') if n==19 else ('A' if part==1 else 'M')
   for x in vertices:near((p[x]+p[x+'r'])/2,p[center],f'7.{n}.{part} center')
  else:
   a,b=(('A','D') if part==1 else ('B','C1')) if n==21 else (('D','B') if part==1 else ('A','M'))
   for x in vertices:near(p[x+'r']-p[x],p[b]-p[a],f'7.{n}.{part} translation')
  for a,b in card(7,n,part)['visualization']['model']['edges']:near(dist(p,a,b),dist(p,a+'r',b+'r'),f'7.{n}.{part} isometry')
p=pts(7,23);par(p,'A','A1','B','B1');par(p,'A','B','A1','B1');near(dist(p,'A','B'),dist(p,'A1','B1'),'7.23 equal lengths')
p=pts(7,24)
for x in 'ABC':near(p[x+'1']-p[x],[.7,-.3,-2],'7.24 translation')
p=pts(7,25);ratio(p,'A1','D1','C1',1/3)
p=pts(7,26);ratio(p,'A1','N1','C1',.5);ratio(p,'B1','D1','C1',5/9);ratio(p,'B1','I1','N1',5/7);col(p,'A1','D1','I1')
p=pts(7,27);ratio(p,'B1','M1','C1',5/6);ratio(p,'A1','N1','C1',.5);ratio(p,'B1','O1','N1',6/11)
# Independent original isosceles triangle: B at origin, C=(6,0), A=(5,sqrt11).
A=np.array([5,math.sqrt(11)]);B=np.array([0.,0]);C=np.array([6.,0]);N=(A+C)/2;O=(6/11)*N
near(np.linalg.norm(A-B),6,'7.27 original equal sides');near(np.linalg.norm(O-A),np.linalg.norm(O-B),'7.27 circumcenter A/B');near(np.linalg.norm(O-C),np.linalg.norm(O-B),'7.27 circumcenter C/B')
p=pts(7,28);ratio(p,'B1','X1','C1',.5);ratio(p,'A1','Y1','B1',.5);par(p,'X1','O1','A1','D1');par(p,'Y1','O1','C1','E1');col(p,'B1','D1','C1');col(p,'A1','E1','B1')
p=pts(7,29);ratio(p,'A1','H1','D1',.75);ratio(p,'A1','O1','C1',.5)
p=pts(7,30);ratio(p,'B1','H1','C1',-.5)
p=pts(7,31)
for h,suffix in [(1,'1'),(2,'2')]:
 s=h/(h+1);near(p['D'+suffix]/4,[1/(2*(h+1)),0,0],'7.31 left square image');near(p['E'+suffix]/4,[1/(2*(h+1)),1/(h+1),0],'7.31 top square image');col(p,'A1','E'+suffix,'C1');col(p,'B1','F'+suffix,'C1')
 # Explicit orthogonal realization of the same triangle image.
 sourceC=np.array([.5,1,math.sqrt(h*h-1)]);near(np.linalg.norm(sourceC-[.5,0,0]),h,'7.31 source height');near(sourceC[:2],[.5,1],'7.31 common projected apex')
p=pts(7,32);ratio(p,'A1','M1','B1',.5);near(vec(p,'A1','D1'),2*vec(p,'C1','M1'),'7.32 external side');near(vec(p,'B1','E1'),2*vec(p,'C1','M1'),'7.32 second side')
p=pts(7,33);ratio(p,'E1','M1','F1',.5);par(p,'A1','B1','E1','F1');near(np.dot(unellipse(p,'A1')-unellipse(p,'B1'),unellipse(p,'C1')-unellipse(p,'D1')),0,'7.33 perpendicular original diameters')
p=pts(7,34);ratio(p,'E1','M1','F1',.5);par(p,'O1','A1','E1','F1');col(p,'O1','M1','J1');par(p,'T1','T2','O1','M1');near(np.dot(unellipse(p,'A1'),unellipse(p,'T2')-unellipse(p,'T1')),0,'7.34 true original tangent')
p=pts(7,35);ratio(p,'A1','D1','C1',2/3)
for part in [1,2]:
 p=pts(7,36,part);orig={k:unellipse(p,k) for k in ['A1','P1','Q1']}
 for a,b in [('A1','P1'),('P1','Q1'),('Q1','A1')]:near(np.linalg.norm(orig[a]-orig[b]),math.sqrt(3),'7.36 inscribed equilateral')
 if part==2:
  for contact,a,b in [('A1','Y1','Z1'),('P1','X1','Y1'),('Q1','X1','Z1')]:
   u=unellipse(p,a);v=unellipse(p,b);w=unellipse(p,contact);near(np.dot(w,v-u),0,'7.36 true tangent');near(np.cross(np.append(v-u,0),np.append(w-u,0)),[0,0,0],'7.36 contact on tangent')
  for a,b in [('X1','Y1'),('Y1','Z1'),('Z1','X1')]:near(np.linalg.norm(unellipse(p,a)-unellipse(p,b)),2*math.sqrt(3),'7.36 outer equilateral')
for part in [1,2]:
 p=pts(7,37,part);names=['A1','B1','C1','D1'] if part==1 else ['P1','Q1','R1','S1'];length=math.sqrt(2) if part==1 else 2
 for i,k in enumerate(names):
  prev=names[(i-1)%4];nxt=names[(i+1)%4];near(np.linalg.norm(unellipse(p,k)-unellipse(p,nxt)),length,'7.37 square side');near(np.dot(unellipse(p,prev)-unellipse(p,k),unellipse(p,nxt)-unellipse(p,k)),0,'7.37 square angle')
p=pts(7,38)
for a,b,c,d in [('A','C','D','E'),('B','D','E','A'),('C','E','A','B'),('D','A','B','C'),('E','B','C','D')]:par(p,a,b,c,d,'7.38 each diagonal')
check(dist(p,'C','D')>dist(p,'A','B'),'7.38 nonregular')
p=pts(7,39);near(dist(p,'A','B'),6,'7.39 side');near(dist(p,'A','D'),2*math.sqrt(3),'7.39 short side');near(min(angle(p,'A','O','B'),180-angle(p,'A','O','B')),60,'7.39 line angle')
p=pts(7,40)
for a,b,v in [('A','B',13),('B','C',5*math.sqrt(2)),('A','C',7)]:near(dist(p,a,b),v,'7.40 source length')
near(angle(p,'A','C','B'),135,'7.40 triangle angle');near(angle(p,'_X','C','B'),45,'7.40 line angle')
print(f'MERZLYAK_PARA06_07_SOURCE_AND_MODEL_OK: {COUNT} assertions, 84 draft cards, 74 exercises; not independent review')
