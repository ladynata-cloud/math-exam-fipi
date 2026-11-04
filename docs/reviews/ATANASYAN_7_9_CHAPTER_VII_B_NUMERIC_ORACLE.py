import json,math,hashlib,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
mp=ROOT/'geometry-course/textbook/models/chapter-07-b.json';pp=ROOT/'geometry-course/textbook/preparation/chapter-07-b.json'
models=json.loads(mp.read_text())['models'];prep=json.loads(pp.read_text())
records=[];cur=None

def chk(label,actual,expected,tol=1e-7):
 ok=abs(actual-expected)<=tol*max(1,abs(expected))
 cur['checks'].append(dict(label=label,actual=actual,expected=expected,pass_=ok))
 if not ok:print('FAIL',cur['id'],label,actual,expected)

def truth(label,ok):chk(label,int(bool(ok)),1,0)
def sub(a,b):return [a[i]-b[i] for i in range(2)]
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def norm(a):return math.hypot(*a)
def vec(a,b):return sub(P[b],P[a])
def L(a,b):return norm(vec(a,b))
def ar(ids):return abs(sum(cross(P[a],P[b]) for a,b in zip(ids,ids[1:]+ids[:1])))/2

def theta(a,b,c):
 u,v=vec(b,a),vec(b,c);return math.degrees(math.acos(max(-1,min(1,dot(u,v)/norm(u)/norm(v)))))
def line_distance(p,a,b):return abs(cross(vec(a,b),vec(a,p)))/L(a,b)
def metric(label,actual,expected):chk(label,actual/(scale**(2 if label.startswith('area') else 1)),expected)
def length(a,b,expected):metric('length '+a+b,L(a,b),expected)
def area(ids,expected):metric('area '+''.join(ids),ar(ids),expected)
def angle(a,b,c,expected):chk('angle '+a+b+c,theta(a,b,c),expected)
def perim(ids):return sum(L(a,b) for a,b in zip(ids,ids[1:]+ids[:1]))
sq=math.sqrt
parts='абвгдеж'
for e in models:
 n=e['number'];p=e['part'];m=e['model'];P=m['points'];cur=dict(id=f'{n}:{p}',checks=[]);records.append(cur)
 # Recalculate all explicit coordinate claims using this independent vector implementation.
 for c in m.get('checks',[]):
  typ=c['type'];ss=c.get('segments',[])
  if typ in ('perpendicular','parallel'):
   u=vec(*ss[0]);v=vec(*ss[1]);chk('declared '+typ,(dot(u,v) if typ=='perpendicular' else cross(u,v))/norm(u)/norm(v),0)
  elif typ=='distanceRatio':chk('declared distanceRatio',L(*ss[0])/L(*ss[1]),c['ratio'])
  elif typ=='equalLength':
   for s in ss[1:]:chk('declared equalLength',L(*s)/L(*ss[0]),1)
  elif typ=='collinear':
   a,b,*cs=c['points']
   for x in cs:chk('declared collinear',cross(vec(a,b),vec(a,x))/max(1,L(a,b)**2),0)
  elif typ=='angle':chk('declared angle',theta(*c['points']),c['degrees'])
  else:raise ValueError(c)
 # Validate every marker instance, even when repeated in later scenes.
 for vk,v in m['views'].items():
  for r in v.get('rightAngles',[]):chk(vk+' right '+r['vertex'],theta(r['a'],r['vertex'],r['b']),90)
  groups=collections.defaultdict(list)
  for s in v.get('equalSegments',[]):groups[s.get('marks',1)].append(L(s['a'],s['b']))
  for g,ls in groups.items():
   for x in ls[1:]:chk(vk+' equal-group '+str(g),x/ls[0],1)
  groups=collections.defaultdict(list)
  for a in v.get('angleArcs',[]):
   if a.get('marks',0):groups[a['marks']].append(theta(a['from'],a['vertex'],a['to']))
  for g,angles in groups.items():
   for x in angles[1:]:chk(vk+' equal-angle '+str(g),x,angles[0])
 # Source-grounded independent metric tests; select one source dimension as scale only.
 if n==566:
  scale=L('A','B')/7.5;length('A','C',3.2);length('C','H',2.4);length('B','K',5.625);area(['A','B','C'],9)
 elif n in (567,568,581,582,583,589,597,600):
  if n==567:a,b={'а':(4,11),'б':(1.2,3)}[p]
  elif n==568:a,b=14,24
  elif n==581:a,b={'а':(6,8),'б':(5,6),'в':(3/7,4/7),'г':(8,8*sq(3))}[p]
  elif n==582:a,b={'а':(12,5),'б':(7,4*sq(2)),'в':(12,4*sq(3)),'г':(2*sq(3),2),'д':(6,2)}[p]
  elif n==583:a,b=1,sq(3)
  elif n==589:a,b={'а':(5,12),'б':(12,16)}[p]
  elif n==597:a,b={'а':(7,24),'б':(8,15)}[p]
  else:a,b={'а':(8,6),'б':(18,18*sq(3))}[p]
  scale=L('A','C')/a;length('B','C',b);length('A','B',sq(a*a+b*b));angle('A','C','B',90);area(['A','B','C'],a*b/2)
  if n in (589,597):length('C','H',a*b/sq(a*a+b*b))
  if n==583:angle('C','A','B',60)
  if n==600:length('O','A',sq(a*a+b*b)/2)
 elif n in (569,570,598,599):
  if n==569 and p=='б':
   scale=perim(['A','B','C'])/144;area(['A','B','C'],252);chk('inradius from determinant/perimeter',2*ar(['A','B','C'])/perim(['A','B','C'])/scale,3.5)
  else:
   if n==569:
    if p=='а':scale=perim(['A','B','C'])/56;area(['A','B','C'],84);length('O','P',3)
    else:scale=L('A','B')/20;length('A','C',15);length('B','C',7);area(['A','B','C'],42);length('O','P',2)
   elif n==570:
    scale=L('A','P')/5;length('B','Q',5);length('C','R',6);area(['A','B','C'],20*sq(6));length('O','P',5*sq(6)/4);truth('source r3 impossible',abs(L('O','P')/scale-3)>.05)
   elif n==598:
    scale=L('A','C')/10;length('A','B',13);length('B','C',13);area(['A','B','C'],60);length('O','P',10/3)
   elif p=='а':
    scale=L('A','B')/26;length('O','P',4);metric('perimeter',perim(['A','B','C']),60)
   else:
    scale=L('A','P')/5;length('B','P',12);length('O','P',3);metric('perimeter',perim(['A','B','C']),40)
   for q,a,b in [('P','A','B'),('Q','B','C'),('R','C','A')]:
    chk('tangent point on side '+q,line_distance(q,a,b)/scale,0)
    chk('inradius distance '+q,line_distance('O',a,b)/L('O',q),1)
    chk('radius to contact '+q,L('O',q)/L('O','P'),1)
 elif n==571:
  scale=1;chk('equal triangle areas',ar(['A','B','C'])/ar(['A','B','D']),1)
 elif n==572:
  scale=1;chk('median equal areas',ar(['A','B','M'])/ar(['A','M','C']),1)
 elif n==573:
  scale=1
  for ids in [['A','B','M'],['A','M','N'],['A','N','C']]:chk('third area '+''.join(ids),ar(ids)/ar(['A','B','C']),1/3)
 elif n in (574,575,576,591,592):
  if n==574:diag1,diag2={'а':(32,14),'б':(4.6,20)}[p]
  elif n==575:diag1,diag2=9,6
  elif n==591:diag1,diag2=24,10
  elif n==592:diag1,diag2=16,12
  else:diag1,diag2=L('A','C'),L('B','D')
  scale=L('A','C')/diag1;length('B','D',diag2);area(['A','B','C','D'],diag1*diag2/2);angle('A','O','B',90)
  if n!=576:
   for a,b in [('B','C'),('C','D'),('D','A')]:chk('rhombus side '+a+b,L(a,b)/L('A','B'),1)
  else:truth('non-bisecting illustrative diagonals',abs(L('A','O')-L('O','C'))>1 and abs(L('B','O')-L('O','D'))>1)
  if n==591:length('A','B',13)
  if n==592:length('A','B',10)
 elif n==577:
  ab,ac,ad,ae={'а':(5,6,3,2),'б':(8,3,2.4,2)}[p];scale=L('A','B')/ab
  length('A','C',ac);length('A','D',ad);length('A','E',ae);area(['A','B','C'],10);area(['A','D','E'],2)
 elif n in (578,579,580,593):
  if n==578:ab,cd,h,S={'а':(21,17,7,133),'б':(2,10,4,24),'в':(5,13,8,72)}[p]
  elif n==579:ab,cd,h,S=6,12,6,54
  elif n==593:ab,cd,h,S={'а':(10,20,12,180),'б':(8,16,4*sq(3),48*sq(3)),'в':(6,24,9,135)}[p]
  else:ab,cd,h,S=4.8,2,1.4,4.76
  base1,base2=('A','D'),('B','C') if n==580 else ('C','D')
  if n!=580:base1=('A','B');base2=('C','D')
  scale=L(*base1)/ab;length(*base2,cd);metric('height',line_distance(base2[0],*base1),h);area(['A','B','C','D'],S)
  if n==578 and p=='б':length('D','A',8);angle('A','D','C',30)
  if n==579:angle('A','B','C',135)
  if n==580:length('A','H',1.4);length('H','D',3.4);angle('A','B','C',135)
  if n==593:
   if p=='а':length('B','C',13);length('D','A',13)
   else:angle('B','C','D',60 if p=='б' else 45);angle('C','D','A',60 if p=='б' else 45);length('B','C',8 if p=='б' else 9*sq(2))
 elif n==584:
  ab,bc,diag={'а':(5,12,13),'б':(1.5,2,2.5),'в':(8,15,17)}[p];scale=L('A','B')/ab;length('B','C',bc);length('A','C',diag);angle('A','B','C',90)
 elif n in (585,586,587,588,590):
  if n==585:base,side,height,S=16,17,15,120
  elif n==586:
   side=6 if p=='а' else 8*sq(3)/3;base=side;height=side*sq(3)/2;S=base*height/2
  elif n==587:
   side={'а':5,'б':1.2,'в':2*sq(2)}[p];base=side;height=side*sq(3)/2;S=side*side*sq(3)/4
  elif n==588:base,side,height,S={'а':(12,10,8,48),'б':(18,6*sq(3),3*sq(3),27*sq(3)),'в':(14,7*sq(2),7,49)}[p]
  else:base,side,height,S=12,10,8,48
  scale=L('A','C')/base;length('A','B',side);length('B','C',side);length('B','H',height);area(['A','B','C'],S)
  if n==590:length('A','K',9.6);length('C','L',9.6)
  if n==588 and p in 'бв':angle('A','B','C',120 if p=='б' else 90)
 elif n==594:
  scale=L('A','B')/3;length('C','D',sq(3));length('A','D',2);length('B','C',2);length('A','C',sq(7));truth('D inside AB',0<dot(vec('A','D'),vec('A','B'))/L('A','B')**2<1)
 elif n==595:
  scale=perim(['A','B','C','D'])/50;length('A','B',12);length('B','C',13);length('A','C',5);angle('B','A','C',90)
 elif n==596:
  sides={'а':(6,8,10),'б':(5,6,7),'в':(9,12,15),'г':(10,24,26),'д':(3,4,6),'е':(11,9,13),'ж':(15,20,25)}[p]
  actual=sorted([L('A','B'),L('B','C'),L('C','A')]);expect=sorted(sides);scale=actual[-1]/expect[-1]
  for i in range(3):metric('sorted side '+str(i),actual[i],expect[i])
  truth('triangle exists',expect[0]+expect[1]>expect[2]);truth('right marker delayed',not m['views']['neutral'].get('rightAngles'));truth('Pythagoras yes/no classification',bool(m['views']['step-3'].get('rightAngles'))==(expect[0]**2+expect[1]**2==expect[2]**2))
 elif n==601:
  scale=L('O','A')/10;length('A','B',10*sq(3));length('B','C',10*sq(3));length('C','A',10*sq(3));length('O','H',5);angle('O','B','H',30)
 elif n==602:
  scale=L('A','C')/8;length('B','C',8);angle('A','C','B',120);length('C','H',4);length('O','H',4);length('O','A',8);length('O','B',8);length('O','C',8)
 elif n==603:
  scale=L('A','B')/600;length('B','C',600);length('A','C',600*sq(2));length('P','Q',800);truth('trace inside window',all(0<dot(vec('A',x),vec('A','C'))/L('A','C')**2<1 for x in ['P','Q']));truth('source long side preserved', '2000' in next(x for x in prep['exercises'] if x['number']==603)['parts'][0]['conditionSummary'])
 elif n==604:
  scale=L('A','B')/74;width=80.01*16/sq(337);height=80.01*9/sq(337)
  length('E','H',width);length('E','F',height);length('E','G',80.01);truth('screen width fits',width<74);truth('screen height fits',height<74)
  scale=L('A__case1','B__case1')/35;length('E__case1','F__case1',25)
 else:raise AssertionError(n)
 if n in (600,601,602):
  for q in ['B','C']:chk('circumcircle '+q,L('O',q)/L('O','A'),1)
 cur['verdict']='PASS' if all(x['pass_'] for x in cur['checks']) else 'FAIL'

def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
report={'schemaVersion':1,'scope':'Independent non-author review of chapter VII B, 566–604; source/text/didactics/math/models and all declared markers. Visual PNG inspection is separate and pending.','reviewer':'/root/vii_a, author of disjoint block A only','authorAssertionsUsedAsOracle':False,'method':'Independently written determinant, norm, dot/cross, point-line-distance and angle calculations; source given dimensions calibrate one model length; all remaining lengths, areas, radii and displayed marker claims recomputed. No imports of author generators or model-checker.','toleranceRelative':1e-7,'files':{str(p.relative_to(ROOT)):sha(p) for p in [pp,mp,ROOT/'tools/geometry-textbook/models_ch7_b.py']},'oracleSha256':sha(__file__),'sourceSha256':'3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72','cards':len(records),'views':sum(len(e['model']['views']) for e in models),'declaredClaims':sum(len(e['model'].get('checks',[])) for e in models),'independentChecks':sum(len(e['checks']) for e in records),'failedChecks':sum(not c['pass_'] for e in records for c in e['checks']),'results':records,'verdict':'PASS' if all(e['verdict']=='PASS' for e in records) else 'FAIL','visualVerdict':'PENDING'}
output=ROOT/'docs/reviews/ATANASYAN_7_9_CHAPTER_VII_B_NUMERIC_REVIEW.json'
# Preserve separately performed human source/visual evidence only for matching input hashes.
if output.exists():
 previous=json.loads(output.read_text())
 if previous.get('sourceSha256')==report['sourceSha256'] and 'actuallyViewedSourcePages' in previous:
  report['actuallyViewedSourcePages']=previous['actuallyViewedSourcePages']
 if previous.get('files')==report['files']:
  for key in ['visualVerdict','visualEvidence']:
   if key in previous:report[key]=previous[key]
output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print({k:report[k] for k in ['cards','views','declaredClaims','independentChecks','failedChecks','verdict']})
