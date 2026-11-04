"""Author self-check, not an independent review. Geometry and exact results."""
import sys,runpy,math,json
from pathlib import Path
folder=Path(__file__).resolve().parent;sys.path.insert(0,str(folder))
ls=runpy.run_path(str(folder/'section-1-3.py'))['lessons'];cards={(c['level'],c['number'],c['part']):c for c in ls};n=0

def eq(a,b):
 global n;n+=1;assert math.isclose(a,b,rel_tol=1e-9,abs_tol=1e-9),(a,b)
def dist(c,a,b):return math.dist(c['model']['points'][a],c['model']['points'][b])
def dot(c,a,b,d):
 p=c['model']['points'];return sum((p[a][i]-p[b][i])*(p[d][i]-p[b][i]) for i in range(3))
def angle(c,a,b,d):return math.degrees(math.acos(dot(c,a,b,d)/dist(c,a,b)/dist(c,b,d)))
for c in ls:
 for coord in c['model']['points'].values():assert len(coord)==3 and all(math.isfinite(x) for x in coord)
 for s in c['steps']:assert s['view'] in c['model']['views']
 if c['answer']['mode']=='exact':
  for a in c['answer']['accepted']:assert not a.endswith('.0'),(c['number'],a)
for part,ang in [('a',34),('b',43)]:
 c=cards['A',1,part];eq(angle(c,'B','A','C'),ang);eq(angle(c,'A','C','B'),90)
 if part=='b':eq(angle(c,'B','A','E'),137)
for part,ang in [('a',37),('b',32)]:
 c=cards['A',2,part];eq(angle(c,'B','A','C'),ang);eq(angle(c,'B','H','A'),90);eq(angle(c,'B','H','C'),90)
for part,h in [('a',3),('b',3.7)]:
 c=cards['A',3,part];eq(dist(c,'B','C'),h);eq(dist(c,'H','M'),h/2);eq(dist(c,'A','M'),dist(c,'M','C'));eq(angle(c,'M','H','A'),90)
for part,h,d,rope in [('a',15,8,17),('b',12,9,15)]:
 c=cards['A',5,part];eq(dist(c,'B','C'),h);eq(dist(c,'A','B'),d);eq(dist(c,'A','C'),rope)
for part,lad,ground,high in [('a',3,1.8,2.4),('b',2.5,2,1.5)]:
 c=cards['A',6,part];eq(dist(c,'A','C'),lad);eq(dist(c,'A','B'),ground);eq(dist(c,'B','C'),high)
for part,a,b,hyp in [('a',6,8,10),('b',10,24,26)]:
 c=cards['A',9,part];eq(dist(c,'A','C'),a);eq(dist(c,'B','C'),b);eq(dist(c,'A','B'),hyp);eq(dist(c,'M','N'),hyp/2)
for part,sh,hyp in [('a',24,48),('b',27,54)]:
 c=cards['A',10,part];eq(dist(c,'A','B'),hyp);eq(dist(c,'B','C'),sh);eq(angle(c,'B','A','C'),30)
c=cards['A',11,'a'];eq(dist(c,'A','B'),5);eq(math.cos(math.radians(angle(c,'A','B','C'))),3/5);eq(dist(c,'A','C'),4)
c=cards['A',11,'b'];eq(dist(c,'A','C'),8);eq(math.tan(math.radians(angle(c,'B','C','A'))),3/4);eq(dist(c,'B','C'),10)
for num,part,a,b,hyp,S in [(12,'a',12,16,20,96),(12,'b',15,8,17,60),(13,'a',16,30,34,240),(13,'b',28,21,35,294),(14,'a',2,3,math.sqrt(13),3),(14,'b',1,4,math.sqrt(17),2)]:
 c=cards['A',num,part];eq(dist(c,'A','C'),a);eq(dist(c,'B','C'),b);eq(dist(c,'A','B'),hyp);eq(a*b/2,S)
for part,tan,bc,S in [('a',7/24,48,336),('b',8/15,30,240)]:
 c=cards['A',15,part];eq(math.tan(math.radians(angle(c,'A','B','C'))),tan);eq(dist(c,'B','C'),bc);eq(dist(c,'A','C')*bc/2,S)
for part,k,q,S in [('a',2,5,4),('b',5,17,50)]:
 c=cards['A',16,part];eq(dist(c,'A','B'),k*math.sqrt(q));eq(math.sin(math.radians(angle(c,'B','A','C'))),1/math.sqrt(q));eq(dist(c,'A','C')*dist(c,'B','C')/2,S)
for part,a,med,result in [('a',8,4*math.sqrt(10),10),('b',6,math.sqrt(73),5)]:
 c=cards['B',3,part];eq(dist(c,'A','C'),a);eq(dist(c,'B','M'),med);eq(dist(c,'A','M'),dist(c,'C','M'));eq(dist(c,'A' if part=='a' else 'C','N'),result)
for part,p,q,med,S in [('a',4,3,5,24),('b',12,5,13,120)]:
 c=cards['B',4,part];eq(dist(c,'C','M'),med);eq(dist(c,'A','D')/dist(c,'D','B'),p/q);eq(angle(c,'A','C','D'),45);eq(dist(c,'C','A')*dist(c,'C','B')/2,S)
for part,a,b,x,y,ratio in [('a',32,8,20,3,3/5),('b',24,6,4,5,5)]:
 c=cards['C',2,part];eq(dist(c,'A','C'),a);eq(dist(c,'B','C'),b);eq(dist(c,'M','P'),y);eq(dist(c,'M','Q'),x);eq(dist(c,'A','M')/dist(c,'M','B'),ratio)
for part,hyp,short,vertex,result in [('a',25,1,'C',5*math.sqrt(13)/13),('b',24,3,'B',4)]:
 c=cards['C',3,part];eq(dist(c,'B','C'),hyp);eq(dist(c,'A',vertex),short);eq(angle(c,'A',vertex,'D'),angle(c,'D',vertex,'B' if part=='a' else 'C'));eq(dist(c,vertex,'D'),result)
c=cards['C',5,'a'];eq(dist(c,'B','C'),2*math.sqrt(3));eq(dist(c,'B','K')/dist(c,'K','M'),4/3);eq(angle(c,'B','A','D'),45);eq(dist(c,'A','M'),dist(c,'C','M'));eq(dist(c,'A','B')*dist(c,'A','C')/2,36/13)
c=cards['C',5,'b'];eq(dist(c,'A','C'),2*math.sqrt(7));eq(dist(c,'C','K')/dist(c,'K','M'),8/3);eq(angle(c,'A','B','D'),angle(c,'D','B','C'));eq(dist(c,'A','M'),dist(c,'B','M'));eq(dist(c,'A','B')*dist(c,'A','C')/2,6*math.sqrt(7))
# C1 covers both segment-distance counterexamples, not only line distance.
def segdist(p,a,b):
 vx=b[0]-a[0];vy=b[1]-a[1];t=max(0,min(1,((p[0]-a[0])*vx+(p[1]-a[1])*vy)/(vx*vx+vy*vy)))
 return math.hypot(p[0]-a[0]-t*vx,p[1]-a[1]-t*vy)
c=cards['C',1,'b'];p=c['model']['points']
for k in ['M','M′']:eq(segdist(p[k],p['A'],p['B']),6);eq(segdist(p[k],p['B'],p['C']),3)
print('Coordinate and exact-result assertions:',n)
