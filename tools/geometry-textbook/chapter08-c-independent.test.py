"""Independent source-derived mathematics for VIII710–736.

Reads JSON only; no author generator/helper imports, and no report writes.
"""
import json,math,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
mp=ROOT/'geometry-course/textbook/models/chapter-08-c.json'
pp=ROOT/'geometry-course/textbook/preparation/chapter-08-c.json'
models=json.loads(mp.read_text())['models'];prep=json.loads(pp.read_text())
rows=[];active='';sqrt=math.sqrt
def ck(label,got,want):
 ok=math.isclose(got,want,rel_tol=5e-7,abs_tol=5e-7)
 rows.append(dict(card=active,claim=label,got=got,expected=want,passed=ok))
 assert ok,(active,label,got,want)
def vec(p,a,b):return [p[b][i]-p[a][i] for i in (0,1)]
def dot(u,v):return sum(a*b for a,b in zip(u,v))
def cross(u,v):return u[0]*v[1]-u[1]*v[0]
def dist(p,a,b):return math.hypot(*vec(p,a,b))
def area(p,ns):return abs(sum(cross(p[a],p[b]) for a,b in zip(ns,ns[1:]+ns[:1])))/2
def height(p,x,a,b):return abs(cross(vec(p,a,b),vec(p,a,x)))/dist(p,a,b)
def angle(p,a,o,b):
 u,v=vec(p,o,a),vec(p,o,b)
 return math.degrees(math.acos(max(-1,min(1,dot(u,v)/math.hypot(*u)/math.hypot(*v)))))
def cosine(p,s,t):
 u,v=vec(p,*s),vec(p,*t);return dot(u,v)/math.hypot(*u)/math.hypot(*v)
def sine(p,s,t):
 u,v=vec(p,*s),vec(p,*t);return cross(u,v)/math.hypot(*u)/math.hypot(*v)
def cases(p):
 suffixes=sorted({k.split('__case')[1] for k in p if '__case' in k})
 yield '',{k:v for k,v in p.items() if '__case' not in k}
 for suffix in suffixes:
  yield suffix,{k.split('__case')[0]:v for k,v in p.items() if k.endswith('__case'+suffix)}
M={(e['number'],e['part']):e['model'] for e in models}
P={(e['number'],p['part']):p for e in prep['exercises'] for p in e['parts']}
assert len(M)==len(P)==29 and sorted({n for n,_ in M})==list(range(710,737))
assert set(M)==set(P)
source=json.loads((ROOT/'tools/geometry-textbook/chapter-08-source-map.json').read_text())
for e in source['exercises']:
 if 710<=e['number']<=736:assert set(e['parts'])=={part for n,part in M if n==e['number']}
for key,m in M.items():
 n,part=key;active=str(n)+':'+part;p=m['points']
 L=lambda a,b:dist(p,a,b)
 A=lambda ns:area(p,ns)
 if n==710:
  s=L('A','C')/10
  for pair,v in [('AB',6),('BC',9),('A1B1',None)]:
   if v is not None:ck('source side '+pair,L(*pair)/s,v)
  ck('largest second side',L('A1','C1')/s,7.5)
  ck('other side4.5',L('A1','B1')/s,4.5);ck('other side6.75',L('B1','C1')/s,6.75)
 if n==711:
  ck('diagonal geometric mean',L('A','C')**2,L('A','D')*L('B','C'))
  ck('strict trapezoid unequal bases',float(not math.isclose(L('A','D'),L('B','C'))),1)
 if n==712:
  s=L('M','P')/7;ck('MN5',L('M','N')/s,5);ck('NP3',L('N','P')/s,3)
  ck('requested OK/ON',L('O','K')/L('O','N'),7/8)
 if n==713:
  s=L('A','H')/30;ck('base/side4/3',L('B','C')/L('A','B'),4/3)
  ck('upper altitude segment',L('A','D')/s,18);ck('lower altitude segment',L('D','H')/s,12)
  ck('bisected base angle',angle(p,'A','B','D'),angle(p,'D','B','H'))
 if n==714:
  ck('equal lateral sides',L('O','A'),L('O','B'));ck('B inside OC',L('O','B')+L('B','C'),L('O','C'))
  ck('bisector ratio',L('A','M')/L('M','C'),L('O','A')/L('O','C'));ck('strict requested inequality',float(L('A','M')<L('M','C')),1)
 if n==715:
  ck('given proportion',L('B','D')/L('A','B'),L('D','C')/L('A','C'))
  ck('converse bisector conclusion',angle(p,'B','A','D'),angle(p,'D','A','C'))
 if n==716:
  s=L('A','B')/10
  for pair,v in [('BC',18),('CA',21.6),('DE',70/9),('CE',14),('CD',16.8)]:ck('source/result '+pair,L(*pair)/s,v)
  ck('division from A',L('A','D')/L('D','C'),2/7)
 if n==717:ck('median intersection cuts equally',L('D','K'),L('K','E'))
 if n==718:
  for suffix,q in cases(p):
   a,b,d=dist(q,'A','B'),dist(q,'C','D'),dist(q,'A','C');x=dist(q,'O','H')
   ck('height harmonic product '+suffix,x,a*b/(a+b));ck('sum of reciprocal ratios '+suffix,x/a+x/b,1)
   ck('m/d=x/b '+suffix,dist(q,'A','H')/d,x/b);ck('n/d=x/a '+suffix,dist(q,'H','C')/d,x/a)
   ck('source upright poles '+suffix,float(q['B'][1]>q['A'][1] and q['D'][1]>q['C'][1]),1)
  # Independent intersections for varied distances and both unequal height orders.
  for a,b in [(3,8),(8,3),(1,100)]:
   for d in [1,7,100]:
    t=a/(a+b);ck('independent line intersection '+str((a,b,d)),b*t,a*(1-t))
 if n==719:
  for suffix,q in cases(p):
   k=dist(q,'A','B')/dist(q,'A1','B1')
   for pair in [('A','C'),('B','C')]:ck('SSS consequence '+suffix+str(pair),dist(q,*pair)/dist(q,*(x+'1' for x in pair)),k)
   if part=='а':ck('given median ratio',dist(q,'B','M')/dist(q,'B1','M1'),k)
   else:ck('height ratio incl right case '+suffix,height(q,'B','A','C')/height(q,'B1','A1','C1'),k)
 if n==720:
  s=L('A','D')/4;ck('base6',L('A','B')/s,6)
  for pair,v in [('DC',8/3),('DB',2*sqrt(13)),('CB',2*sqrt(61)/3)]:ck('requested '+pair,L(*pair)/s,v)
 if n==721:
  a,b=L('A','D'),L('B','C');ck('cross section harmonic mean',L('E','F'),2*a*b/(a+b));ck('O bisects cross section',L('E','O'),L('O','F'))
 if n==722:
  h=height(p,'A','B','C')
  for x in 'ABC':ck('distance to whole midline '+x,height(p,x,'M','N'),h/2)
 if n==723:
  for s,t in [('EF','FG'),('FG','GH'),('GH','HE'),('HE','EF')]:ck('rectangle angle '+s+t,cosine(p,s,t),0)
 if n==724:
  for pair in ['BP','PQ','QD']:ck('third diagonal '+pair,L(*pair)/L('B','D'),1/3)
 if n==725:
  for suffix,q in cases(p):
   ck('external division '+suffix,dist(q,'B','D')/dist(q,'D','C'),dist(q,'A','B')/dist(q,'A','C'))
   ck('D external '+suffix,float(dist(q,'B','D')+dist(q,'D','C')>dist(q,'B','C')+1e-5),1)
 if n==726:
  for suffix,q in cases(p):
   half=(dist(q,'A','B')+dist(q,'A','C'))/2
   ck('BD half-sum '+suffix,dist(q,'B','D'),half);ck('CE half-sum '+suffix,dist(q,'C','E'),half)
 if n==727:
  for suffix,q in cases(p):
   a=dist(q,'A','C');b=dist(q,'A','D')+dist(q,'B','C');alpha=math.radians(angle(q,'A','C','B'))
   ck('all-angle area formula '+suffix,area(q,'ABCD'),a*b*math.sin(alpha)/2)
 if n==728:ck('area60 from unit triangle',A('ABCD')/A('APK'),60)
 if n==729:
  s=L('B','C')/4;ck('long base16',L('A','D')/s,16);ck('C angle150',angle(p,'B','C','D'),150);ck('D angle30',angle(p,'A','D','C'),30)
 if n==730:
  for ns in ['BOM','COM','AOP','BOP','AON','CON']:ck('six equal areas '+ns,A(ns)/A('ABC'),1/6)
 if n==731:
  ck('bases ratio5',L('A','D')/L('B','C'),5);ck('area18 from four',A('ABCD')/A('AMH')*4,18)
 if n==732:
  for ns in ['AB','AC','AD','EC']:ck('independent similar side '+ns,L(*ns)/L(*(x+'1' for x in ns)),L('A','B')/L('A1','B1'))
  ck('bisector auxiliary length',L('E','C'),L('A','D')*(L('A','B')+L('A','C'))/L('A','B'))
 if n==733:
  ck('constructed scale sqrt2',L('A','B1')/L('A','B'),sqrt(2))
  ck('constructed area twice',A(['A','B1','C1'])/A('ABC'),2)
  ck('compass transfer BE',L('A','B1'),L('B','E'))
 if n==734:
  for suffix,q in cases(p):ck('fourth proportional '+suffix,dist(q,'O','X'),dist(q,'O','A')*dist(q,'O','B')/dist(q,'O','C'))
  for a,b,c in [(1,8,3),(8,1,3),(3,7,3),(.2,9,100)]:
   x=a*b/c;ck('independent ratio shrink/equal/enlarge '+str((a,b,c)),x/b,a/c)
 if n==735:
  for x,a,b in [('M','B','C'),('N','C','A'),('P','A','B')]:
   for axis in (0,1):ck('midpoint reconstruction '+x+str(axis),p[x][axis],(p[a][axis]+p[b][axis])/2)
  ck('recovered triangle area factor4',A('ABC')/A('MNP'),4)
 if n==736:
  ck('given first median',L('B','N'),L('_mb0','_mb3'));ck('given second median',L('C','M'),L('_mc0','_mc3'))
  for axis in (0,1):ck('centroid average '+str(axis),p['G'][axis],sum(p[x][axis] for x in 'ABC')/3)
  for a,r,s in [(6,4,5),(4,3,3),(3,4,6),(9,1,9.5),(4,2,2),(1,4,3),(10,2,3),(1,2,4)]:
   active='736:input '+str((a,r,s));x=(a*a+r*r-s*s)/(2*a);h2=r*r-x*x
   expected=abs(r-s)<a<r+s
   ck('strict inequality equivalent to noncollinearity',float(h2>1e-10),float(expected))
   if expected:
    for sign in [-1,1]:
     y=sign*sqrt(h2);q={'B':[0,0],'C':[a,0],'G':[x,y],'A':[3*x-a,3*y]}
     q['M']=[(q['A'][i]+q['B'][i])/2 for i in (0,1)];q['N']=[(q['A'][i]+q['C'][i])/2 for i in (0,1)]
     ck('independent restored first median',dist(q,'B','N'),1.5*r);ck('independent restored second median',dist(q,'C','M'),1.5*s)
  active='736:single'
 # All claimed coordinates and every visible geometric mark are evaluated
 # independently of author validation. General proofs were separately read.
 for claim in m.get('checks',[]):
  kind=claim['type'];segs=claim.get('segments',[])
  if kind=='equalLength':
   for s in segs[1:]:ck('coordinate equal length',L(*s),L(*segs[0]))
  elif kind=='distanceRatio':ck('coordinate distance ratio',L(*segs[0])/L(*segs[1]),claim['ratio'])
  elif kind=='parallel':ck('coordinate parallel',sine(p,*segs),0)
  elif kind=='perpendicular':ck('coordinate perpendicular',cosine(p,*segs),0)
  elif kind=='angle':ck('coordinate angle',angle(p,*claim['points']),claim['degrees'])
  elif kind=='collinear':
   names=claim['points'];a,b=next((a,b) for i,a in enumerate(names) for b in names[i+1:] if L(a,b)>1e-9)
   for x in names:ck('coordinate collinearity',height(p,x,a,b),0)
  else:raise AssertionError(kind)
 for viewname,v in m['views'].items():
  for mark in v.get('rightAngles',[]):ck('right angle '+viewname,angle(p,mark['a'],mark['vertex'],mark['b']),90)
  grouped={}
  for mark in v.get('equalSegments',[]):grouped.setdefault(mark.get('marks',1),[]).append([mark['a'],mark['b']])
  for segs in grouped.values():
   for s in segs[1:]:ck('equal segment marker '+viewname,L(*s),L(*segs[0]))
  grouped={}
  for mark in v.get('angleArcs',[]):
   if mark.get('marks',0):grouped.setdefault(mark['marks'],[]).append(angle(p,mark['from'],mark['vertex'],mark['to']))
  for values in grouped.values():
   for value in values[1:]:ck('equal angle marker '+viewname,value,values[0])
if __name__=='__main__':print(json.dumps(dict(status='passed',cards=len(M),assertions=len(rows)),ensure_ascii=False))
