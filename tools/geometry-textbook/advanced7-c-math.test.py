#!/usr/bin/env python3
"""Independent geometric oracles for every 446–461 illustration and construction families.
No UI/code calls generate expected mathematical answers. Fixed seed, no network.
"""
import json,math,random,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[2];path=root/'geometry-course/textbook/models/grade-07-advanced-c.json';m={e['number']:e['model'] for e in json.loads(path.read_text())['models']}
checks=0
def eq(a,b,tol=1e-7):
 global checks
 assert math.isclose(a,b,rel_tol=tol,abs_tol=tol),(a,b);checks+=1
def dist(a,b):return math.dist(a[:2],b[:2])
def angle(a,o,b):
 u=[a[i]-o[i] for i in range(2)];v=[b[i]-o[i] for i in range(2)];return math.degrees(math.acos(max(-1,min(1,sum(u[i]*v[i] for i in range(2))/(math.hypot(*u)*math.hypot(*v))))))
def line_dist(p,a,b):return abs((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))/dist(a,b)
def P(n):return m[n]['points']
p=P(446);eq(dist(p['A'],p['B'])+dist(p['B'],p['C'])+dist(p['C'],p['A']),dist(p['D'],p['E']));eq(angle(p['A'],p['B'],p['C']),50);eq(angle(p['A'],p['C'],p['B']),70)

p=P(447);eq(dist(p['X'],p['A']),dist(p['X'],p['B']));eq(line_dist(p['X'],p['U'],p['V']),0)
p=P(448)
for X in ['X','Y']:eq(dist(p[X],p['A']),dist(p[X],p['B']));eq(dist(p[X],p['O']),dist(p['O'],p['_r']))
p=P(449);eq(dist(p['O'],p['A']),dist(p['O'],p['B']));eq(dist(p['O'],p['B']),dist(p['O'],p['C']))
def intersections(center,r,a,b):
 u=[(b[i]-a[i])/dist(a,b) for i in (0,1)];v=[a[i]-center[i] for i in (0,1)];dot=sum(v[i]*u[i] for i in (0,1));disc=r*r-sum(x*x for x in v)+dot*dot
 if disc < -1e-6:return []
 if abs(disc)<1e-6:return [[a[i]-dot*u[i] for i in (0,1)]]
 return [[a[i]+(-dot+sg*math.sqrt(disc))*u[i] for i in (0,1)] for sg in [-1,1]]
p=P(450)
for suffix,want in [('',4),('0',0),('1',1),('2',2),('3',3)]:
 center=p['C'+suffix];r=dist(center,p['_r'+suffix]);allp=intersections(center,r,p['_x'+suffix],p['_xx'+suffix])+intersections(center,r,p['_y'+suffix],p['_yy'+suffix]);unique=[]
 for point in allp:
  if not any(dist(point,other)<1e-6 for other in unique):unique.append(point)
 eq(len(unique),want)
p=P(451)
for suffix in ['', '1','2','3']:
 eq(dist(p['O'+suffix],p['H'+suffix]),dist(p['O'+suffix],p['K'+suffix]));eq(dist(p['O'+suffix],p['K'+suffix]),dist(p['O'+suffix],p['L'+suffix]))
p=P(452);eq(dist(p['A'],p['C'])+dist(p['B'],p['C']),dist(p['A'],p['D']));eq(angle(p['A'],p['B'],p['C'])-angle(p['B'],p['A'],p['C']),20)
p=P(453);eq(dist(p['O1'],p['O2']),dist(p['O1'],p['A'])+dist(p['O2'],p['B']));eq(dist(p['A'],p['B']),dist(p['O1'],p['O2']))
p=P(454)
for suffix in ['', '1','2','3','e']:
 eq(line_dist(p['O1'+suffix],p['A'+suffix],p['B'+suffix]),dist(p['O1'+suffix],p['A'+suffix]));eq(line_dist(p['O2'+suffix],p['A'+suffix],p['B'+suffix]),dist(p['O2'+suffix],p['B'+suffix]))
p=P(455)
for center,rpoint in [('O','_o'),('P','_p')]:
 r=dist(p[center],p['A']);eq(r,dist(p[center],p[rpoint]));eq(r,line_dist(p[center],p['U'],p['V']));eq(r,line_dist(p[center],p['S'],p['T']))
p=P(456);eq(dist(p['O'],p['A']),dist(p['O'],p['B']));eq(dist(p['O'],p['A']),line_dist(p['O'],p['U'],p['V']))
p=P(457)
for suffix,centers in [('', ['X','Y']),('one',['X']),('inf',['X']),('internal',['X'])]:
 for center in centers:
  R=dist(p['O'+suffix],p['_r'+suffix]);r=dist(p[center+suffix],p['A'+suffix]);d=dist(p['O'+suffix],p[center+suffix]);eq(min(abs(d-(R+r)),abs(d-abs(R-r))),0);eq(line_dist(p[center+suffix],p['_m'+suffix],p['_mm'+suffix]),r)
p=P(458);eq(dist(p['C'],p['A']),dist(p['C'],p['B']));eq(line_dist(p['C'],p['O'],p['U']),dist(p['C'],p['A']));eq(line_dist(p['C'],p['O'],p['V']),dist(p['C'],p['A']))
p=P(459);eq(dist(p['A'],p['B'])+dist(p['B'],p['C'])+dist(p['C'],p['A']),dist(p['A1'],p['A2']));eq(dist(p['O'],p['A']),dist(p['O'],p['A1']));eq(dist(p['O'],p['A']),dist(p['O'],p['A2']))
p=P(460)
for center in ['O','P']:eq(dist(p[center],p['C']),line_dist(p[center],p['A'],p['B']))
p=P(461)
for k,mm in [('K','M'),('K1','M1')]:eq(dist(p['A'],p[k])-dist(p['A'],p[mm]),dist(p['P'],p['Q']))
# Independent numerical probes of entire construction families, not renderer checks.
rng=random.Random(20261028)
for _ in range(500):
 perimeter=rng.uniform(.1,30);beta=rng.uniform(.2,178);gamma=rng.uniform(.1,179-beta)
 t1=math.tan(math.radians(beta/2));t2=math.tan(math.radians(gamma/2));ax=perimeter*t2/(t1+t2);ay=ax*t1
 A=[ax,ay];D=[0,0];E=[perimeter,0];B=[(ax*ax+ay*ay)/(2*ax),0];C=[(perimeter**2-ax*ax-ay*ay)/(2*(perimeter-ax)),0]
 assert 0<B[0]<C[0]<perimeter
 eq(dist(A,B)+dist(B,C)+dist(C,A),perimeter);eq(angle(A,B,C),beta,1e-6);eq(angle(A,C,B),gamma,1e-6)
 c=rng.uniform(.1,15);s=c+rng.uniform(.1,15);delta=rng.uniform(0,178)
 u=[math.sin(math.radians(delta/2)),math.cos(math.radians(delta/2))];v=-c*u[0]+math.sqrt(s*s-c*c*u[1]*u[1]);A=[0,0];B=[c,0];D=[c+v*u[0],v*u[1]]
 scale=(s*s-c*c)/(2*(s*s-c*D[0]));C=[scale*D[0],scale*D[1]]
 assert 0<scale<1
 eq(dist(A,C)+dist(B,C),s);eq(angle(A,B,C)-angle(B,A,C),delta,2e-6)
 x,y,R=rng.uniform(-8,8),rng.uniform(-8,8),rng.uniform(.1,5);q=x*x+y*y-R*R
 if abs(q)>1e-8 and min(abs(y+R),abs(y-R))>1e-8:
  for sign in [-1,1]:
   center=q/(2*(y+sign*R));r=abs(center);d=math.hypot(x,y-center);eq(min(abs(d-(r+R)),abs(d-abs(r-R))),0,1e-6)
 OA=rng.uniform(.1,5);R=OA+rng.uniform(.1,5);given=rng.uniform(.0001,2*OA-.0001);AH=given/2
 # Intersection of circle(diameter OA) with circle(A, given/2).
 hx=OA-AH*AH/OA;hy=math.sqrt(max(0,AH*AH-(hx-OA)**2));u=[(hx-OA)/AH,hy/AH];dot=OA*u[0];d=math.sqrt(dot*dot+R*R-OA*OA)
 eq((-dot+d)-(dot+d),given)
print(json.dumps({'independentChecks':checks,'randomFamilies':500,'authoredModels':16,'modelsSha256':hashlib.sha256(path.read_bytes()).hexdigest()}))
