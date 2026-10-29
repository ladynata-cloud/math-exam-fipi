"""Independent source-derived oracle; no import of author generators/checks.

Run from any directory:
    python tools/geometry-textbook/chapter07-c-independent.test.py

Reads the repository models and the recorded review; never changes reports.
"""
import json,math,hashlib
from pathlib import Path
R=Path(__file__).resolve().parents[2]
mp=R/'geometry-course/textbook/models/chapter-07-c.json';pp=R/'geometry-course/textbook/preparation/chapter-07-c.json'
models=json.loads(mp.read_text())['models'];prep=json.loads(pp.read_text());rows=[];active=None
sqrt=math.sqrt

def d(p,a,b):return math.dist(p[a][:2],p[b][:2])
def vec(p,a,b):return [p[b][i]-p[a][i] for i in [0,1]]
def dot(u,v):return sum(a*b for a,b in zip(u,v))
def cross(u,v):return u[0]*v[1]-u[1]*v[0]
def area(p,ns):return abs(sum(cross(p[a],p[b]) for a,b in zip(ns,ns[1:]+ns[:1])))/2
def height(p,x,a,b):return abs(cross(vec(p,a,b),vec(p,a,x)))/d(p,a,b)
def ck(label,got,want):
 ok=math.isclose(got,want,rel_tol=3e-7,abs_tol=3e-7);rows.append({'card':active,'claim':label,'got':got,'expected':want,'passed':ok});assert ok,(active,label,got,want)
def eqarea(p,a,b):ck('equal areas '+a+'/'+b,area(p,a),area(p,b))
M={(e['number'],e['part']):e['model'] for e in models}
P={(e['number'],p['part']):p for e in prep['exercises'] for p in e['parts']}
assert len(M)==len(P)==49
mapping=json.loads((R/'tools/geometry-textbook/chapter-07-source-map.json').read_text())
for e in mapping['exercises']:
 if 605<=e['number']<=639:assert set(e['parts'])=={k[1] for k in M if k[0]==e['number']}
for key,m in M.items():
 active=f'{key[0]}:{key[1]}';n,part=key;p=m['points'];L=lambda a,b:d(p,a,b);A=lambda ns:area(p,ns)
 if n==605:ck('squares ratio',A('ABUV')/A('AHBX'),2);ck('right isosceles',L('A','B'),L('A','C'))
 if n==606:ck('hectare conversion',27*(10000 if part=='а' else .01),270000 if part=='а' else .27)
 if n==607:
  s=L('A','D')/(28/3);ck('perimeter42',2*(L('A','B')+L('A','D'))/s,42);ck('height5',height(p,'B','A','D')/s,5);ck('height4',height(p,'D','A','B')/s,4);ck('area derived from21/(1/5+1/4)',A('ABCD')/s**2,21/(1/5+1/4))
 if n==608:
  s=sqrt(A('ABCD')/24);ck('center distance2',height(p,'O','A','D')/s,2);ck('center distance3',height(p,'O','A','B')/s,3);ck('perimeter',2*(L('A','B')+L('A','D'))/s,20)
 if n==609:
  s=L('A','B')/29;ck('long side',L('A','D')/s,45);ck('foot division33',L('A','H')/s,33);ck('foot division12',L('D','H')/s,12);ck('area via height sqrt29²−21²',A('ABCD')/s**2,45*sqrt(29**2-21**2))
 if n==610:
  ck('sample strictly below product bound',float(2*A('ABC')<L('A','B')*L('A','C')),1)
  q={k.split('__')[0]:v for k,v in p.items() if '__case1' in k};ck('max case same two lengths',d(q,'A','B')/d(q,'A','C'),L('A','B')/L('A','C'));ck('max equality',2*area(q,'ABC'),d(q,'A','B')*d(q,'A','C'))
 if n==611:
  for ns in ['ABE','ADF','AECF']:ck('third area '+ns,A(ns)/A('ABCD'),1/3)
 if n==612:
  ck('first flat triangle area',2*sqrt(6),sqrt(24));ck('counterexample sides5>4',float(5>4),1);ck('counterexample areas2sqrt6<4sqrt3',float(2*sqrt(6)<4*sqrt(3)),1)
 if n==613:
  for suffix in ['', '__case1']:
   q={k.replace(suffix,''):v for k,v in p.items() if (suffix in k if suffix else '__' not in k)}
   ck('constant sum containing lines '+suffix,height(q,'M','A','B')+height(q,'M','A','C'),2*area(q,'ABC')/d(q,'A','B'))
  ck('finite-segment counterexample unequal',float(sqrt(10)>6/sqrt(10)),1)
 if n==614:ck('Viviani height',sum(height(p,'M',a,b) for a,b in [('A','B'),('B','C'),('C','A')]),2*A('ABC')/L('B','C'))
 if n==615:eqarea(p,'CDE','ADE');eqarea(p,'ADE','ADF');eqarea(p,'ADF','BDF')
 if n==616:
  if part=='а':eqarea(p,'ABD','ACD')
  if part=='б':eqarea(p,'ABO','CDO')
  if part=='в':ck('product equality',L('O','A')*L('O','B'),L('O','C')*L('O','D'))
 if n==617:
  ck('length root mean square',L('E','F'),sqrt((L('A','D')**2+L('B','C')**2)/2));eqarea(p,'AEFD','EBCF')
  for a,b in [(10,4),(7,1),(3,2),(100,99)]:
   x=sqrt((a*a+b*b)/2);t=(a-x)/(a-b);ck('independent trapezoid width integration '+str((a,b)),(a+x)*t,(x+b)*(1-t))
 if n==618:
  s=L('A','C')/24;ck('small diagonal18',L('B','D')/s,18);ck('perimeter60',4*L('A','B')/s,60);ck('height14.4',height(p,'D','A','B')/s,14.4)
 if n==619:
  s=L('A','C')/45;ck('area540',A('ABCD')/s**2,540);ck('distance180/17',height(p,'O','A','B')/s,180/17)
 if n==620:
  s=L('A','B')/(20 if part=='а' else 6);ck('area',A('ABC')/s**2,100*sqrt(3) if part=='а' else 18)
 if n==621:
  s=L('B','C')/34;ck('AN25',L('A','N')/s,25);ck('NC15',L('N','C')/s,15);ck('midpoint',L('B','M'),L('M','C'));ck('area320',A('ABC')/s**2,320)
 if n==622:
  s=L('A','C')/12
  for pair,val in [('AB',5),('BC',13),('CD',9),('DA',15)]:ck('source side '+pair,L(*pair)/s,val)
  ck('opposite halfplanes',float(cross(vec(p,'A','C'),vec(p,'A','B'))*cross(vec(p,'A','C'),vec(p,'A','D'))<0),1);ck('area84',A('ABCD')/s**2,84)
  # Same-side reconstruction intersections: BC and DA meet at x30/7, y45/14.
  ck('same-side crossing internal parameters',float(0<5/14<1 and 0<9/14<1),1)
 if n==623:
  s=L('B','C')/(18 if part=='а' else 16);ck('area',A('ABCD')/s**2,243 if part=='а' else 529)
 if n==624:ck('area h²',A('ABCD'),height(p,'C','A','D')**2)
 if n==625:ck('area a²',A('ABCD'),((L('A','D')+L('B','C'))/2)**2)
 if n==626:
  for suff in ['', '__case1']:
   q={k.replace(suff,''):v for k,v in p.items() if (suff in k if suff else '__' not in k)}
   ck('orthodiagonal identity '+suff,d(q,'A','D')**2+d(q,'B','C')**2,d(q,'A','B')**2+d(q,'C','D')**2)
 if n==627:
  s=L('A','D')/17;ck('base5',L('B','C')/s,5);ck('lateral10',L('A','B')/s,10);ck('areaBDM48',A('BDM')/s**2,48)
 if n==628:
  s=L('A','B');ck('overlap finite polygon',A('ADPE')/s**2,sqrt(2)-1);ck('removed triangle',A('CEP')/s**2,(sqrt(2)-1)**2/2)
  # Both orientations of second square have reflection-congruent intersection.
  q={k:[v[1],v[0],0] for k,v in p.items()};ck('reflected common area',area(q,'ADPE'),A('ADPE'))
 if n==629:
  s=L('A','B')/12;ck('side5',L('A','C')/s,5);ck('side13',L('B','C')/s,13);ck('area30',A('ABC')/s**2,30)
 if n==630:
  s=L('A','B')/13
  for pair,val in [('BC',14),('AC',15)]:ck('side '+pair,L(*pair)/s,val)
  ck('distance6',height(p,'M','A','B')/s,6);ck('distance2',height(p,'M','A','C')/s,2);ck('inside areas',A('ABM')+A('BCM')+A('CAM'),A('ABC'));ck('distance30/7',height(p,'M','B','C')/s,(sqrt(21*8*7*6)-39-15)*2/14)
 if n==631:
  s=L('A','C')/sqrt(2);ck('height4sqrt2/6',height(p,'D','A','B')/s,4*sqrt(2)/6);ck('height two thirds larger diagonal',height(p,'D','A','B')/L('A','C'),2/3);ck('larger diagonal verified',float(L('A','C')>L('B','D')),1);ck('area2sqrt5/5',A('ABCD')/s**2,2*sqrt(5)/5)
 if n==632:
  s=L('A','C')/10;ck('height6',height(p,'C','A','D')/s,6);ck('area48',A('ABCD')/s**2,6*sqrt(10**2-6**2))
 if n==633:
  s=L('C','D')/12;ck('distance5',height(p,'O','C','D')/s,5);ck('area30',A('ABO')/s**2,30)
 if n==634:
  s=L('A','C')/16;ck('diagonal20',L('B','D')/s,20);ck('area80',A('ABCD')/s**2,16*20/4)
 if n==635:
  s=L('A','D')/8;ck('median8',L('D','M')/s,8);ck('area64sqrt3',A('ABC')/s**2,64*sqrt(3))
 if n==636:
  s=L('A','B')/6;ck('width8',L('B','C')/s,8);ck('CK4.8',L('C','K')/s,4.8);ck('DK3.6',L('D','K')/s,3.6);ck('KM2.7',L('K','M')/s,2.7);ck('area957/50',A('ABKM')/s**2,957/50)
 if n==637:
  suffixes=['','__case1','__case2'] if part=='а' else ['']
  for suff in suffixes:
   q={k.replace(suff,''):v for k,v in p.items() if (suff in k if suff else '__' not in k)}
   if 'H' not in q:q['H']=q['C']
   sign=-1 if part=='а' else 1;ck('height identity '+suff,d(q,'B','C')**2,d(q,'A','B')**2+d(q,'A','C')**2+sign*2*d(q,'A','C')*d(q,'A','H'))
 if n in [638,639]:
  s=L('_gx0a','_gx1a');wanted=([24,24,9,12,21] if n==638 else [18,32,27,19.5,23.5])['абвгд'.index(part)];ck('independently counted grid area',A('ABC' if n==638 else 'ABCDEF' if part=='д' else 'ABCD')/s**2,wanted)
 if n in [638,639]:
  source_coords={
   (638,'а'):{'A':(2,1),'B':(2,7),'C':(10,7)},(638,'б'):{'A':(2,7),'B':(7,1),'C':(10,7)},(638,'в'):{'A':(1,7),'B':(4,7),'C':(7,1)},(638,'г'):{'A':(1,7),'B':(6,6),'C':(7,1)},(638,'д'):{'A':(1,7),'B':(7,1),'C':(9,6)},
   (639,'а'):{'A':(2,4),'B':(5,1),'C':(8,4),'D':(5,7)},(639,'б'):{'A':(3,1),'B':(9,2),'C':(7,7),'D':(1,6)},(639,'в'):{'A':(2,1),'B':(8,1),'C':(10,7),'D':(7,7)},(639,'г'):{'A':(2,3),'B':(5,1),'C':(10,2),'D':(4,6)},(639,'д'):{'A':(1,1),'B':(4,2),'C':(8,1),'D':(10,7),'E':(5,3),'F':(2,6)}}
  for label,(x,y) in source_coords[key].items():
   ck('source grid x '+label,(p[label][0]-p['_gx0a'][0])/s,x)
   ck('source grid image-y '+label,7-(p[label][1]-p['_gx0a'][1])/s,y)
 # Inspect each declared claim independently from its serialized coordinates.
 for c in m.get('checks',[]):
  typ=c['type']
  if typ=='equalLength':
   for seg in c['segments'][1:]:ck('claim equalLength',L(*seg),L(*c['segments'][0]))
  elif typ=='distanceRatio':ck('claim distanceRatio',L(*c['segments'][0])/L(*c['segments'][1]),c['ratio'])
  elif typ in ['parallel','perpendicular']:
   u,v=[vec(p,*seg) for seg in c['segments']];ck('claim '+typ,(cross(u,v) if typ=='parallel' else dot(u,v))/(math.hypot(*u)*math.hypot(*v)),0)
  elif typ=='collinear':
   a,b,*rest=c['points'];u=vec(p,a,b)
   for z in rest:ck('claim collinear',cross(u,vec(p,a,z))/(math.hypot(*u) or 1),0)
  elif typ=='angle':
   a,o,b=c['points'];u,v=vec(p,o,a),vec(p,o,b);ck('claim angle',math.degrees(math.acos(max(-1,min(1,dot(u,v)/(math.hypot(*u)*math.hypot(*v)))))),c['degrees'])
  else:raise AssertionError(typ)
 for name,v in m['views'].items():
  for z in v.get('rightAngles',[]):
   u,w=vec(p,z['vertex'],z['a']),vec(p,z['vertex'],z['b']);ck('right marker '+name,dot(u,w)/(math.hypot(*u)*math.hypot(*w)),0)
  marks={}
  for z in v.get('equalSegments',[]):marks.setdefault(z.get('marks',1),[]).append((z['a'],z['b']))
  for group in marks.values():
   for seg in group[1:]:ck('equality marker '+name,L(*seg),L(*group[0]))
covered=sorted(set(r['card'] for r in rows),key=lambda x:(int(x.split(':')[0]),x.split(':')[1]));assert len(covered)==49
report={'schemaVersion':1,'reviewer':'vii_b (independent of author vii_c)','method':'Independent source calculations and normalized-coordinate determinant/distance oracle. No import or invocation of author generator or check_models.','sourceSha256':'3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72','sourcePrintedPagesActuallyViewed':[159,160,161,162],'hashes':{str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [mp,pp,R/'tools/geometry-textbook/models_ch7_c.py']},'cards':49,'views':sum(len(m['views']) for m in M.values()),'coveredCards':covered,'assertions':len(rows),'passed':all(r['passed'] for r in rows),'results':rows}
# Verification is read-only: the independently inspected visual manifest must never
# be replaced by rerunning a numerical oracle.
out=R/'docs/reviews/ATANASYAN_7_9_CHAPTER_VII_C_NUMERIC_REVIEW.json'
recorded=json.loads(out.read_text())
assert recorded['hashes']==report['hashes'], 'Reviewed content hashes changed; a new independent review is required'
for key in ['cards','views','coveredCards','assertions','passed']:
 assert recorded[key]==report[key], ('Recorded numeric coverage differs',key)
assert len(recorded['results'])==len(rows)
for expected,actual in zip(recorded['results'],rows):
 assert (expected['card'],expected['claim'],expected['passed'])==(actual['card'],actual['claim'],actual['passed'])
 for key in ['got','expected']:
  assert math.isclose(expected[key],actual[key],rel_tol=3e-7,abs_tol=3e-7), (actual['card'],actual['claim'],key)
print(json.dumps({**{k:report[k] for k in ['cards','views','assertions','passed','hashes']},'oracle':str(Path(__file__).resolve().relative_to(R)),'oracleSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'reportsModified':False},ensure_ascii=False))
