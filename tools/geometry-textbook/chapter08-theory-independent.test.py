#!/usr/bin/env python3
"""Independent VIII theory/selfcheck oracle; does not import authoring helpers.

This verifies the final JSON geometrically and samples theorem identities with
new inputs. It is not a substitute for a proof review or rendered-image review.
Reviewer: /root/viii_a, who authored none of the theory/selfcheck payloads.
"""
from pathlib import Path
import json, math, hashlib, sys
ROOT=Path(__file__).resolve().parents[2]
FILES=[ROOT/'geometry-course/textbook/preparation/chapter-08-theory.json',ROOT/'geometry-course/textbook/models/chapter-08-theory.json']
DATA=json.loads(FILES[0].read_text()); ITEMS=json.loads(FILES[1].read_text())['models']
MODELS={(i['collection'],i['number']):i['model'] for i in ITEMS}
COUNT=0

def close(a,b,where=''):
 global COUNT
 COUNT+=1
 assert math.isclose(a,b,rel_tol=2e-7,abs_tol=2e-7),(where,a,b)
def ok(t,where=''):
 global COUNT
 COUNT+=1
 assert t,where
def vec(p,a,b):return [p[b][j]-p[a][j] for j in range(2)]
def length(p,a,b):return math.hypot(*vec(p,a,b))
def dot(u,v):return sum(x*y for x,y in zip(u,v))
def cross(u,v):return u[0]*v[1]-u[1]*v[0]
def normalized_cross(u,v):return cross(u,v)/(math.hypot(*u)*math.hypot(*v))
def normalized_dot(u,v):return dot(u,v)/(math.hypot(*u)*math.hypot(*v))
def angle(p,a,o,b):return math.degrees(math.atan2(abs(cross(vec(p,o,a),vec(p,o,b))),dot(vec(p,o,a),vec(p,o,b))))
def area(p,ns):return abs(sum(p[ns[i]][0]*p[ns[(i+1)%len(ns)]][1]-p[ns[i]][1]*p[ns[(i+1)%len(ns)]][0] for i in range(len(ns))))/2

def model(kind,n):return MODELS[kind,n]
def pts(kind,n,case=0):
 p=model(kind,n)['points']
 if not case:return {k:v for k,v in p.items() if '__case' not in k}
 suffix='__case'+str(case);return {k[:-len(suffix)]:v for k,v in p.items() if k.endswith(suffix)}
def side_ratios(p,left,right):return [length(p,left[i],left[(i+1)%3])/length(p,right[i],right[(i+1)%3]) for i in range(3)]
def similar(p,left,right,k=None):
 rr=side_ratios(p,left,right)
 for r in rr:close(r,rr[0] if k is None else k,(left,right))
 for i in range(3):close(angle(p,left[(i+1)%3],left[i],left[(i+2)%3]),angle(p,right[(i+1)%3],right[i],right[(i+2)%3]),'corresponding angle')
def right_projection(p):
 close(angle(p,'A','C','B'),90,'right triangle')
 close(angle(p,'C','D','B'),90,'height foot')
 close(length(p,'A','D')+length(p,'D','B'),length(p,'A','B'),'foot inside hypotenuse')
 close(length(p,'C','D')**2,length(p,'A','D')*length(p,'D','B'),'geometric mean height')
 close(length(p,'A','C')**2,length(p,'A','B')*length(p,'A','D'),'first leg own projection')
 close(length(p,'B','C')**2,length(p,'A','B')*length(p,'B','D'),'second leg own projection')
 similar(p,['A','B','C'],['A','C','D']);similar(p,['A','B','C'],['C','B','D']);similar(p,['A','C','D'],['C','B','D'])
def centroid(p):
 for j in range(2):close(p['G'][j],sum(p[k][j] for k in 'ABC')/3,'centroid barycentric')
 for a,b in [('A','D'),('B','E'),('C','F')]:close(length(p,a,'G')/length(p,'G',b),2,'median from vertex')
def midline(p):
 for m,a,b in [('M','A','C'),('N','B','C')]:
  for j in range(2):close(p[m][j],(p[a][j]+p[b][j])/2,'midpoint')
 close(normalized_cross(vec(p,'M','N'),vec(p,'A','B')),0,'midline parallel')
 close(length(p,'M','N')/length(p,'A','B'),.5,'midline half')
def trig(p):
 close(angle(p,'A','C','B'),90,'right angle')
 a=angle(p,'C','A','B');rad=math.radians(a)
 close(length(p,'B','C')/length(p,'A','B'),math.sin(rad),'sine definition')
 close(length(p,'A','C')/length(p,'A','B'),math.cos(rad),'cosine definition')
 close(length(p,'B','C')/length(p,'A','C'),math.tan(rad),'tangent definition')
 close((length(p,'B','C')**2+length(p,'A','C')**2)/length(p,'A','B')**2,1,'identity')
def construction(p,k):
 close(length(p,'C','D'),length(p,'U','V'),'prescribed bisector')
 close(angle(p,'A','C','D'),angle(p,'D','C','B'),'bisector')
 for z in 'ABD':close(length(p,'C',z)/length(p,'C',z+'1'),k,'positive scale')
 close(normalized_cross(vec(p,'A','B'),vec(p,'A1','B1')),0,'parallel final base')
 similar(p,['A','B','C'],['A1','B1','C'],k)
def measurement(kind,n):
 p=pts(kind,n)
 close(length(p,'A','C')/length(p,'U','V'),1.7,'rod metres')
 close(length(p,'A1','C1')/length(p,'U','V'),5.1,'height metres')
 close(length(p,'B','C1')/length(p,'B','C'),3,'horizontal scale')
 close(normalized_cross(vec(p,'B','A'),vec(p,'B','A1')),0,'line of sight')
 q=pts(kind,n,1);close(angle(q,'C','A','B'),73);close(angle(q,'A','C','B'),58);close(angle(q,'A','B','C'),49)
 close(length(q,'A','C')/length(q,'U','V')*10,130)
 # Independent ray intersection, instead of the author's sine-law expression.
 ta=math.tan(math.radians(73));tc=math.tan(math.radians(58))
 bx=130*tc/(ta+tc);by=ta*bx;expected=math.hypot(bx,by)
 close(expected,146.0777171633721,'corrected source example')
 close(length(q,'A','B')/length(q,'U','V')*10,expected)
 ok(abs(expected-153)>6,'153m must not silently be represented as exact')
 r=pts(kind,n,2);close(length(r,'A1','C1')/length(r,'U','V')*10,130,'paper mm')
 close(length(r,'A1','B1')/length(r,'U','V')*10,expected,'paper length mm')
def special(kind,n):
 p=pts(kind,n);close(angle(p,'B','E','C'),30);close(angle(p,'E','B','C'),60)
 close(length(p,'B','C')/length(p,'B','E'),.5);close(length(p,'C','E')/length(p,'B','E'),math.sqrt(3)/2)
 close(length(p,'B','C')/length(p,'C','E'),math.sqrt(3)/3);close(length(p,'C','E')/length(p,'B','C'),math.sqrt(3))
 q=pts(kind,n,1);trig(q);close(angle(q,'C','A','B'),45)
 close(length(q,'B','C')/length(q,'A','B'),math.sqrt(2)/2)
 close(length(q,'B','C')/length(q,'A','C'),1)

ok([t['number'] for t in DATA['theory']]==list(range(63,76)),'all13 theory points')
ok([t['number'] for t in DATA['selfchecks']]==list(range(1,19)),'all18 questions')
ok(set(MODELS)=={('theory',n) for n in range(63,76)}|{('selfcheck',n) for n in range(1,19)},'exact model coverage')
# Re-evaluate declared claims with this independent vector implementation.
claim_count=0;marker_count=0
for item in ITEMS:
 m=item['model'];p=m['points'];where=(item['collection'],item['number'])
 for c in m['checks']:
  claim_count+=1;t=c['type']
  if t=='equalLength':
   rr=[length(p,*s) for s in c['segments']]
   for x in rr[1:]:close(x,rr[0],where)
  elif t=='distanceRatio':close(length(p,*c['segments'][0])/length(p,*c['segments'][1]),c['ratio'],where)
  elif t in ['parallel','perpendicular']:
   u,v=[vec(p,*s) for s in c['segments']];close(normalized_cross(u,v) if t=='parallel' else normalized_dot(u,v),0,where)
  elif t=='collinear':
   ns=c['points'];u=vec(p,ns[0],ns[1])
   for z in ns[2:]:close(normalized_cross(u,vec(p,ns[0],z)),0,where)
  elif t=='angle':close(angle(p,*c['points']),c['degrees'],where)
  else:raise AssertionError(('unsupported claim',t))
 for key,v in m['views'].items():
  for mark in v.get('rightAngles',[]):marker_count+=1;close(angle(p,mark['a'],mark['vertex'],mark['b']),90,(where,key,'right marker'))
  groups={}
  for mark in v.get('equalSegments',[]):groups.setdefault(mark.get('marks',1),[]).append(length(p,mark['a'],mark['b']))
  for values in groups.values():
   for value in values[1:]:marker_count+=1;close(value,values[0],(where,key,'equality marker'))
  for name in v.get('points',[]):ok(name in p,(where,key,'defined point'))
  if key.startswith('step-'):ok(int(key[5:])<=len(item['didactics']['steps']),'step view index')
# Per-card independent conclusions, including all selfcheck model variants.
coverage=[]
for kind,n in sorted(MODELS):
 p=pts(kind,n);tag=(kind,n)
 if tag in [('theory',63),('selfcheck',1),('selfcheck',2)]:
  for a,b,value in [('A','B',4),('C','D',2),('A1','B1',6),('C1','D1',3)]:close(length(p,a,b)/length(p,'U','V'),value,tag)
  close(length(p,'A','B')/length(p,'A1','B1'),length(p,'C','D')/length(p,'C1','D1'),tag)
 elif tag in [('theory',64),('theory',65),('theory',66),('theory',67),('theory',68),('selfcheck',3),('selfcheck',4),('selfcheck',5),('selfcheck',6),('selfcheck',7)]:
  similar(p,['A','B','C'],['A1','B1','C1'],1.5);close(area(p,'ABC')/area(p,['A1','B1','C1']),2.25,tag)
  if 'C2' in p:
   close(length(p,'A','C'),length(p,'A','C2'));close(length(p,'B','C'),length(p,'B','C2'))
   ok(cross(vec(p,'A','B'),vec(p,'A','C'))*cross(vec(p,'A','B'),vec(p,'A','C2'))<0,'auxiliary opposite side')
   ok('C2' not in model(kind,n)['views']['neutral']['points'],'auxiliary initially hidden')
   ok('C2' in model(kind,n)['views']['step-2']['points'],'auxiliary at construction step')
  if tag in [('theory',66),('selfcheck',5)]:
   for c in [1,2]:similar(pts(kind,n,c),['A','B','C'],['A1','B1','C1'],1.5)
 elif tag==('theory',69):midline(p);centroid(pts(kind,n,1))
 elif tag==('selfcheck',8):midline(p)
 elif tag==('selfcheck',9):centroid(p)
 elif tag==('theory',70):
  for a,b,c in [('A','B','C'),('B','C','A'),('C','A','B')]:close(normalized_dot(vec(p,a,'H'),vec(p,b,c)),0,'three orthocenter lines')
  centroid(pts(kind,n,1));q=pts(kind,n,2)
  for z in 'KLM':close(length(q,'I',z),length(q,'I','K'),'inradius')
  q=pts(kind,n,3)
  for z in 'ABC':close(length(q,'O',z),length(q,'O','A'),'circumradius')
  q=pts(kind,n,4);close(angle(q,'B','A','C'),90,'orthocenter at right vertex')
  q=pts(kind,n,5);ok(angle(q,'B','A','C')>90,'obtuse alternative');ok(q['H'][0]<min(q['A'][0],q['B'][0]),'external orthocenter')
 elif tag in [('theory',71),('selfcheck',10),('selfcheck',11)]:
  right_projection(p)
  if 'case-1' in model(kind,n)['views']:right_projection(pts(kind,n,1))
 elif tag in [('theory',72),('selfcheck',12)]:construction(p,1.6);construction(pts(kind,n,1),.6)
 elif tag in [('theory',73),('selfcheck',13)]:measurement(kind,n)
 elif tag==('selfcheck',14):
  for a,b in [('A','B'),('B','C'),('C','D'),('D','A'),('A','C'),('B','D')]:close(length(p,a+'1',b+'1')/length(p,a,b),1.5,'all polygon distances')
  # Check interior points too, not only the finitely many declared segments.
  for u,v in [(.13,.72),(.4,.8),(.8,.22)]:
   X=[(1-u)*p['A'][j]+u*p['C'][j] for j in range(2)];Y=[(1-v)*p['B'][j]+v*p['D'][j] for j in range(2)]
   X1=[(1-u)*p['A1'][j]+u*p['C1'][j] for j in range(2)];Y1=[(1-v)*p['B1'][j]+v*p['D1'][j] for j in range(2)]
   close(math.dist(X1,Y1)/math.dist(X,Y),1.5,'interior polygon points')
 elif tag in [('theory',74),('selfcheck',15),('selfcheck',16),('selfcheck',17)]:
  trig(p)
  q={k[:-1]:v for k,v in p.items() if k in ['A1','B1','C1']};trig(q)
 elif tag in [('theory',75),('selfcheck',18)]:special(kind,n)
 else:raise AssertionError(('missing independent card conclusion',tag))
 coverage.append({'collection':kind,'number':n,'result':'pass'})
# New samples provide an oracle independent of the fixed author figures.
for a,b,h in [(7,2,3),(3,8,5),(9,-2,4),(8,0,6)]:
 p={'A':[0,0],'B':[a,0],'C':[b,h]};p['M']=[b/2,h/2];p['N']=[(a+b)/2,h/2];midline(p)
for x,y in [(1,9),(7,3),(5,5),(.2,12)]:right_projection({'A':[0,0],'B':[x+y,0],'C':[x,math.sqrt(x*y)],'D':[x,0]})
for deg in [13,30,45,60,83]:
 trig({'A':[0,0],'C':[1,0],'B':[1,math.tan(math.radians(deg))]})
# Negative control: swapped projection formula must fail for unequal projections.
try:
 close(3.2*8,4.8*8,'negative swapped projection')
 raise AssertionError('negative control escaped')
except AssertionError as e:
 ok(str(e)!='negative control escaped','negative control is effective')
report={'reviewer':'/root/viii_a','independentOfTheoryAuthor':True,'scope':'mathematics and pedagogy of theory63–75 and selfchecks1–18; no rendered-image verdict','result':'pass','cards':31,'coordinateClaimsIndependentlyRecomputed':claim_count,'markersRecomputed':marker_count,'assertions':COUNT,'coverage':coverage,'payloadSha256':{str(f.relative_to(ROOT)):hashlib.sha256(f.read_bytes()).hexdigest() for f in FILES},'sourceDiscrepancy73':{'printedABmetres':153,'recomputedABmetres':146.0777171633721,'retainedAndExplicit':True},'limitations':['A finite coordinate oracle supplements, rather than replaces, manual reading of every proof.','No external Claude review is claimed.','No browser or image review is claimed by this test.']}
print(json.dumps(report,ensure_ascii=False,indent=2))
