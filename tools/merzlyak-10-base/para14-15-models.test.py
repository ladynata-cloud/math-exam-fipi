"""Numeric/affine assertions against source givens for §14–15 models.
This author test does not mark any review as passed.
"""
import json,math
from pathlib import Path
from review_state import assert_review_state
ROOT=Path(__file__).resolve().parents[2];DIR=ROOT/'stereo-course/merzlyak-10-base/lessons'
def lesson(s,n):return json.loads((DIR/f'ex-{s:02}-{n:03}.json').read_text())
def pts(s,n):return lesson(s,n)['visualization']['model']['points']
def eq(a,b,label=''):assert math.isclose(a,b,rel_tol=1e-8,abs_tol=1e-8),(label,a,b)
def sub(a,b):return [x-y for x,y in zip(a,b)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def norm(a):return math.hypot(*a)
def v(p,a,b):return sub(p[b],p[a])
def d(p,a,b):return math.dist(p[a],p[b])
def midpoint(p,m,a,b):
 for i in range(3):eq(p[m][i],(p[a][i]+p[b][i])/2)
def normal(p,names):return cross(v(p,names[0],names[1]),v(p,names[0],names[2]))
def perp(p,a,b,c,e):eq(dot(v(p,a,b),v(p,c,e)),0,f'{a}{b} ⟂ {c}{e}')
def collinear(p,a,b,c):eq(norm(cross(v(p,a,b),v(p,a,c))),0)
def planeperp(p,a,b):eq(dot(normal(p,a),normal(p,b)),0,str((a,b)))
def planecos(p,a,b):
 u,w=normal(p,a),normal(p,b);return abs(dot(u,w))/(norm(u)*norm(w))
def area(p,names):
 s=[0.,0.,0.]
 for a,b in zip(names,names[1:]+names[:1]):
  c=cross(p[a],p[b]);s=[s[i]+c[i] for i in range(3)]
 return norm(s)/2
p=pts(14,2)
for a,b in [(['A1','B1','C1'],['C','D','D1']),(['A','A1','C1'],['A','B','C']),(['A','C','C1'],['B','D','D1'])]:planeperp(p,a,b)
p=pts(14,5)
for a,b,x in [('A','B',5),('B','F',5),('B','C',12),('E','D',5*math.sqrt(2)),('D','B',13)]:eq(d(p,a,b),x)
planeperp(p,['A','B','C'],['C','B','F']);perp(p,'B','F','A','B');eq(dot(v(p,'B','E'),v(p,'B','D')),144,'14.5(1б): BE is not perpendicular to BD');assert 'б) BE⊥BD' in lesson(14,5)['statement']['text'];perp(p,'B','E','A','B');perp(p,'E','D','A','D')
p=pts(14,6)
for a,b in [('A','B'),('B','C'),('A','C'),('A','D'),('D','C')]:eq(d(p,a,b),4)
planeperp(p,['A','B','C'],['A','D','C']);eq(d(p,'D','H')/d(p,'B','D'),math.sqrt(.5))
p=pts(14,7);eq(d(p,'A','C'),6);perp(p,'B','A','B','C');perp(p,'D','A','D','C');eq(d(p,'B','D'),3*math.sqrt(2))
p=pts(14,8)
for a,b in [(['A','B','M'],['A','B','C']),(['A','B','M'],['C','B','M']),(['A','M','B'],['A','M','D'])]:planeperp(p,a,b)
p=pts(14,9);perp(p,'C','A','C','B');planeperp(p,['B','C','D'],['A','C','D'])
p=pts(14,10);eq(d(p,'M','A'),d(p,'M','C'));eq(d(p,'M','B'),d(p,'M','D'));planeperp(p,['A','B','C'],['B','M','D'])
p=pts(14,11);planeperp(p,['A','B','C'],['B','M','D'])
p=pts(14,13);midpoint(p,'E','A','D');midpoint(p,'F','B','C')
for a,b in [('A','B'),('A','C'),('A','D'),('B','C'),('B','D'),('C','D')]:eq(d(p,a,b),4)
planeperp(p,['A','D','F'],['B','C','D']);planeperp(p,['A','D','F'],['B','C','E'])
p=pts(14,14)
for a,b,x in [('A','C',15),('B','D',16),('C','D',12),('A','B',25)]:eq(d(p,a,b),x)
p=pts(14,15)
for a,b,x in [('A','C',9),('B','D',8),('C','D',12),('A','B',17)]:eq(d(p,a,b),x)
p=pts(14,16);eq(d(p,'A','C'),5);eq(d(p,'B','D'),5*math.sqrt(2));eq(d(p,'A','C')/d(p,'A','B'),.5);eq(d(p,'B','D')/d(p,'A','B'),math.sqrt(.5))
p=pts(14,17);eq(d(p,'A','B'),6);eq(d(p,'A','O'),3);eq(d(p,'B','O'),3*math.sqrt(3))
p=pts(14,18);eq(d(p,'C','D'),4);eq(d(p,'D','F'),8);eq(dot(v(p,'D','A'),v(p,'D','C'))/(d(p,'D','A')*d(p,'D','C')),.5);eq(dot(v(p,'D','A'),v(p,'D','F'))/(d(p,'D','A')*d(p,'D','F')),.5);eq(d(p,'B','E'),2*math.sqrt(15));eq(d(p,'C','F'),8)
p=pts(14,19);eq(area(p,list('ABCD')),25);eq(area(p,['A','E','F','D']),60);eq(d(p,'B','E'),13)
p=pts(14,22);planeperp(p,['A','C','C1'],['B','D','D1'])
p=pts(14,23);planeperp(p,['A','B1','C1'],['A1','B','C'])
p=pts(14,24);midpoint(p,'M','A1','B1');eq(d(p,'A','D'),10);eq(d(p,'A','B'),8);eq(d(p,'A','A1'),6);planeperp(p,['A','D','M'],['C','C1','D1']);eq(area(p,['A','D','N','M']),20*math.sqrt(13))
p=pts(14,25)
for m,a,b in [('E','B','C'),('F','B1','C1'),('M','C1','D1')]:midpoint(p,m,a,b)
eq(d(p,'A','D'),8);eq(d(p,'A','A1'),12);eq(d(p,'A','B'),6);planeperp(p,['E','F','M'],['A','B','C']);eq(area(p,['E','F','M','N']),60)
p=pts(14,26);eq(d(p,'A','B'),4);eq(d(p,'B','E'),8);eq(d(p,'C','E'),8);planeperp(p,['B','E','C'],['A','B','C']);eq(d(p,'E','H')/d(p,'D','H'),math.sqrt(3))
p=pts(14,27);eq(d(p,'A','B'),10);eq(d(p,'A','F'),15);eq(d(p,'B','F'),15)
for k in ['C','D','O']:eq(d(p,'K',k),5)
eq(d(p,'F','K'),10*math.sqrt(3))
p=pts(14,28);a=d(p,'A','B')
for u,w in [('B','E'),('E','F'),('F','D'),('D','B')]:eq(d(p,u,w),a*math.sqrt(2))
planeperp(p,['A','B','C'],['B','E','F']);perp(p,'B','C','B','E');perp(p,'B','C','C','D')
p=pts(14,29)
for a,b,x in [('A','B',30),('B','C',40),('C','D',30),('D','A',40),('A','C',50),('B','D',2*math.sqrt(337))]:eq(d(p,a,b),x)
planeperp(p,['A','B','C'],['A','D','C'])
p=pts(14,30);eq(d(p,'A','B'),4);eq(d(p,'B','D'),5);eq(dot(v(p,'B','A'),v(p,'B','D'))/(4*5),.5);eq(d(p,'A','D'),d(p,'B','C'));eq(d(p,'C','D'),4);planeperp(p,['A','B','D'],['C','B','D']);eq(d(p,'A','C'),5)
for n,target,plane in [(31,4.8,['A','M','B']),(32,4*math.sqrt(2)/3,['C','M','D'])]:
 p=pts(14,n);eq(d(p,'O','T'),target);collinear(p,'M','H','T');normal1=normal(p,plane);eq(norm(cross(v(p,'O','T'),normal1)),0)
 for a,b in zip('ABC','BCA'):eq(d(p,'M',a),d(p,'M',b))
p=pts(14,31);eq(d(p,'A','B'),12*math.sqrt(3));eq(d(p,'M','O'),8)
p=pts(14,32);eq(d(p,'A','B'),4);eq(d(p,'M','O'),4*math.sqrt(2))
p=pts(14,33);eq(d(p,'A','B'),d(p,'A','M'));eq(d(p,'B','M'),d(p,'A','M'));eq(d(p,'M','H')/d(p,'D','H'),math.sqrt(3/5))
p=pts(14,34);perp(p,'A','C','C','D');eq(dot(v(p,'A','B'),v(p,'A','C'))/(d(p,'A','B')*d(p,'A','C')),dot(v(p,'A','C'),v(p,'A','D'))/(d(p,'A','C')*d(p,'A','D')));a=d(p,'B','C');eq(area(p,list('ABCD')),3*math.sqrt(3)*a*a/4)
p=pts(14,35);eq(d(p,'A','B'),15);eq(d(p,'A','C')+d(p,'B','D'),42);eq(area(p,list('ABCD')),216)
# Every generic projection card has vertical connecting segments and the specified metric areas.
projection_cases=[(1,12,12,0,'ABCD'),(2,16,16/math.sqrt(2),45,'ABCD'),(3,18*math.sqrt(2),18,45,'ABCD'),(4,16*math.sqrt(3),24,30,'ABCD'),(5,20,16,math.degrees(math.acos(.8)),'ABCD'),(6,12,6,60,'ABCD'),(9,56*math.sqrt(3),84,30,'ABCD'),(10,36,18*math.sqrt(3),30,'ABCD'),(11,36*math.sqrt(3),48,math.degrees(math.acos(4*math.sqrt(3)/9)),'ABC'),(12,6*math.sqrt(3),9,30,'ABCDEF'),(13,8,4*math.sqrt(2),45,'ABC'),(14,20,10,60,'ABCD')]
for n,s,s1,angle,names0 in projection_cases:
 p=pts(15,n);names=list(names0);shadow=[k+'1' for k in names];eq(area(p,names),s,f'15.{n} original area');eq(area(p,shadow),s1,f'15.{n} shadow area');eq(planecos(p,names,shadow),math.cos(math.radians(angle)))
 for k in names:
  eq(p[k][0],p[k+'1'][0]);eq(p[k][1],p[k+'1'][1]);eq(p[k+'1'][2],0)
p=pts(15,7);eq(d(p,'A','B'),2);eq(area(p,['A','B1','C1','D']),4*math.sqrt(2))
p=pts(15,8);eq(d(p,'A','C'),8);eq(d(p,'B','C'),10);perp(p,'C','A','C','B');perp(p,'D','C','C','A');perp(p,'D','C','C','B');eq(planecos(p,['A','B','C'],['A','B','D']),math.sqrt(.5));eq(area(p,['A','D','B']),40*math.sqrt(2))
p=pts(15,9)
for a,b,x in [('A','D',18),('B','C',10),('A','B',8),('C','D',8)]:eq(d(p,a,b),x)
p=pts(15,10);eq(d(p,'A','C'),12);eq(d(p,'B','D'),6);eq(p['A'][2],0);eq(p['B'][2],0)
p=pts(15,11)
for a,b,x in [('A','B',12),('B','C',12),('C','A',12),('A1','B1',12),('B1','C1',10),('C1','A1',10)]:eq(d(p,a,b),x)
p=pts(15,12)
for a,b in zip('ABCDEF','BCDEFA'):eq(d(p,a,b),2)
p=pts(15,13);eq(area(p,['A2','B2','C2']),4);n=normal(p,['A','B','C']);w=dot(n,p['A'])
for k in 'ABC':eq(dot(n,p[k+'2']),w);eq(norm(cross(v(p,k+'1',k+'2'),n)),0)
p=pts(15,15);eq(area(p,['A','D','Q','P']),16/math.cos(math.pi/6));eq(area(p,['A','D','U','T']),16/math.sin(math.pi/3));eq(planecos(p,['A','D','Q'],['A','B','C']),math.cos(math.pi/6));eq(planecos(p,['A','D','U'],['A','B','C']),.5)
p=pts(15,16);midpoint(p,'M','A','B');midpoint(p,'K','A','D');projectionarea=area(p,['M','B','C','D','K']);eq(projectionarea,7*d(p,'A','B')**2/8);eq(area(p,['M','E','F','G','K'])*planecos(p,['M','E','F'],['A','B','C']),projectionarea)
p=pts(15,17)
for a,b in [('A','B'),('B','C'),('C','A')]:eq(d(p,a,b),1)
assert d(p,'A1','B1')<math.sqrt(3)/2 and d(p,'A1','C1')<.5
assert planecos(p,['A','B','C'],['A1','B1','C1'])<.5
n=normal(p,['A1','B1','C1'])
for k in 'ABC':eq(norm(cross(v(p,k,k+'1'),n)),0)
p=pts(15,18);eq(d(p,'P','Q'),6*math.sqrt(2));eq(d(p,'O','P'),6);eq(d(p,'O','H'),6)
for a,b in [('A','B'),('B','C'),('C','A')]:eq(d(p,a,b),12*math.sqrt(3))
p=pts(15,19);alpha=math.pi/4;beta=math.pi/3;eq(area(p,list('ABC')),6**2*math.sin(alpha)*math.sin(alpha+beta)/(2*math.sin(beta)))
# Complete solid-edge clipping verifies that claimed sections have no omitted vertices.
for s,n,names in [(14,12,['E','F','F1','E1']),(14,22,['A','C','C1','A1']),(14,23,['A','B1','C1','D']),(14,24,['A','D','N','M']),(14,25,['E','F','M','N']),(15,7,['A','B1','C1','D']),(15,15,['A','D','Q','P']),(15,15,['A','D','U','T']),(15,16,['M','E','F','G','K'])]:
 model=lesson(s,n)['visualization']['model'];p=model['points'];normal1=normal(p,names);w=dot(normal1,p[names[0]]);hits=[]
 for u,v1 in model['edges'][:12]:
  a,b=p[u],p[v1];da=dot(normal1,a)-w;db=dot(normal1,b)-w
  for x,d1 in [(a,da),(b,db)]:
   if abs(d1)<1e-8 and not any(math.dist(x,h)<1e-8 for h in hits):hits.append(x)
  if da*db< -1e-10:
   t=da/(da-db);x=[a[i]+t*(b[i]-a[i]) for i in range(3)]
   if not any(math.dist(x,h)<1e-8 for h in hits):hits.append(x)
 assert len(hits)==len(names),(s,n,'unexpected clipping vertices',hits,names)
 for h in hits:assert any(math.dist(h,p[k])<1e-8 for k in names),(s,n,'missing clipping vertex',h)
c=json.loads((ROOT/'tools/merzlyak-10-base/coverage-14-15.json').read_text());assert len(c['entries'])==54 and not c['unresolved']
for e in c['entries']:
 assert e['requiredParts']==[None]
 for file in e['lessonFiles']:
  x=json.loads((ROOT/file).read_text());assert_review_state(x);assert x['source']['pdfPages']==[p+1 for p in x['source']['printedPages']]
print('MERZLYAK_PARA14_15_MODEL_METRICS_OK: source metrics, plane/line angles, actual orthogonal maps, 9 complete section clips, all 54 cards with verified review state')

# Reviewer R1415-002: auxiliary perpendicular is visible in the step introducing it.
for num in (31,32):
 x=lesson(14,num);view=x["visualization"]["model"]["views"][x["steps"][1]["view"]]
 assert ["O","T"] in view["segments"] and view["polygon"]==["O","M","H"]
assert lesson(14,13)["source"]["pdfPages"]==[133,134]
