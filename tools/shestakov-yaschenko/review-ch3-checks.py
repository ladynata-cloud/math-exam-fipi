"""Independent numerical verification of authored chapter 3; does not import its author."""
import json,math,re
from pathlib import Path
p=Path(__file__).resolve().parents[2]/'stereo-course/shestakov-yaschenko-10-11/chapters/ch3.json'
b=json.loads(p.read_text());count=0

def eq(x,y):
 global count
 assert abs(x-y)<1e-7,(x,y)
 count+=1

def d(P,a,b):return math.dist(P[a],P[b])
def angle(P,a,b,c):
 u=[x-y for x,y in zip(P[a],P[b])];v=[x-y for x,y in zip(P[c],P[b])]
 return math.degrees(math.acos(max(-1,min(1,sum(x*y for x,y in zip(u,v))/(math.sqrt(sum(x*x for x in u))*math.sqrt(sum(x*x for x in v)))))))
def distLine(p,a,b):
 return abs((b[0]-a[0])*(a[1]-p[1])-(a[0]-p[0])*(b[1]-a[1]))/math.dist(a,b)
def circle(P,prefix):
 pts=[v for k,v in P.items() if re.fullmatch(re.escape(prefix)+r'\d+',k)]
 assert len(pts)==64
 C=[sum(v[i] for v in pts)/len(pts) for i in range(3)];r=math.dist(C,pts[0])
 for q in pts:eq(math.dist(C,q),r)
 return C,r

def area(P,keys):return abs(sum(P[keys[i]][0]*P[keys[(i+1)%len(keys)]][1]-P[keys[i]][1]*P[keys[(i+1)%len(keys)]][0] for i in range(len(keys))))/2
expected={'3.1-A3':[25,44],'3.1-A16':[3,12],'3.1-A18':[12,12],'3.1-B1':[15,30],'3.1-B5':[45,60],'3.1-C1':[14,5],'3.2-A1':[8.5,13],'3.2-A2':[3,4],'3.2-A13':[26,22],'3.2-B1':[10,9],'3.2-B10':[14,12],'3.2-C17':[28,22],'3.3-A1':[94,114],'3.3-A3':[6,1.5],'3.3-A5':[6400,196],'3.3-B2':[130,180],'3.3-B3':[20,7],'3.3-C4':[117,79]}
for l in b['lessons']:
 k=f"{l['section']}-{l['level']}{l['number']}";i=0 if l['part']=='a' else 1;P=l['model']['points'];val=expected[k][i]
 assert str(val).replace('.0','') in [v.replace(',','.').replace('.0','') for v in l['answer']['accepted']],k
 if k=='3.1-A3':
  eq(angle(P,'A','C','B'),val);eq(angle(P,'A','O','B'),2*val)
 elif k=='3.1-A16':
  eq(d(P,'M','B'),[8,3][i]);eq(d(P,'M','C'),[6,4][i]);eq(d(P,'M','D'),[4,9][i]);eq(d(P,'M','A'),val)
  C,r=circle(P,'_c')
  for v in 'ABCD':eq(math.dist(C,P[v]),r)
 elif k=='3.1-A18':
  eq(d(P,'A','B'),[18,10][i]);eq(d(P,'O','A'),[15,13][i]);eq(distLine(P['O'],P['A'],P['B']),val)
 elif k=='3.1-B1':
  eq(d(P,'A','B'),[30,16][i]);eq(distLine(P['O'],P['A'],P['B']),[20,15][i]);eq(d(P,'C','D'),[40,30][i]);eq(distLine(P['O'],P['C'],P['D']),[15,8][i])
 elif k=='3.1-B5':
  eq(angle(P,*(['A1','A7','A3'] if i==0 else ['A2','A9','A5'])),val)
  n=[8,9][i]; lengths=[d(P,'A'+str(j),'A'+str(j%n+1)) for j in range(1,n+1)]
  for x in lengths:eq(x,lengths[0])
 elif k=='3.1-C1':
  C1,r1=circle(P,'_left');C2,r2=circle(P,'_right')
  eq(math.dist(C1,C2),r1+r2);eq(r1,[12,8][i]);eq(r2,[14,10][i]);eq(d(P,'A','C'),[6,4][i]);eq(d(P,'B','C'),[7,5][i]);eq(distLine(P['C'],P['A'],P['B']),0);eq(math.dist(C1,P['A']),r1);eq(math.dist(C2,P['B']),r2)
 elif k in ['3.2-A1','3.2-A2']:
  eq(d(P,'A','C'),[8,10][i]);eq(d(P,'B','C'),[15,24][i]);eq(angle(P,'A','C','B'),90);C,r=circle(P,'_c');eq(r,val)
  if k.endswith('A1'):
   for v in 'ABC':eq(math.dist(C,P[v]),r)
  else:
   for u,v in [('A','B'),('B','C'),('A','C')]:eq(distLine(C,P[u],P[v]),r)
 elif k=='3.2-A13':
  eq(d(P,'A','P'),[4,5][i]);eq(d(P,'B','M'),[6,2][i]);eq(d(P,'C','K'),[3,4][i]);eq(d(P,'A','B')+d(P,'B','C')+d(P,'C','A'),val)
  C,r=circle(P,'_c')
  for v,u,w in [('M','A','B'),('K','B','C'),('P','A','C')]:eq(distLine(P[v],P[u],P[w]),0);eq(math.dist(C,P[v]),r);eq(distLine(C,P[u],P[w]),r)
 elif k=='3.2-B1':
  eq(angle(P,'A','B','C'),[61,73][i]);eq(angle(P,'A','C','B'),[89,77][i]);eq(d(P,'B','C'),val);C,r=circle(P,'_c');eq(r,[10,9][i])
 elif k=='3.2-B10':
  eq(angle(P,'B','A','M'),angle(P,'M','A','C'));eq(d(P,'B','M'),val);eq(d(P,'C','M'),val)
 elif k=='3.2-C17':
  C,R=circle(P,'_outer');C1,r1=circle(P,'_one');C2,r2=circle(P,'_two');eq(math.dist(C,C1),R-r1);eq(math.dist(C,C2),R-r2);eq(math.dist(C1,C2),r1+r2);eq(R,[14,11][i]);eq(d(P,'O','O1')+d(P,'O1','O2')+d(P,'O2','O'),val);assert area(P,['O','O1','O2'])>0
 elif k=='3.3-A1':
  eq(angle(P,'A','B','D'),[39,80][i]);eq(angle(P,'C','A','D'),[55,34][i]);eq(angle(P,'A','B','C'),val)
 elif k=='3.3-A3':
  C,r=circle(P,'_c');eq(r,val);eq(d(P,'A','C'),[12,3][i]*math.sqrt(2))
  for u,v in [('A','B'),('B','C'),('C','D'),('D','A')]:eq(distLine(C,P[u],P[v]),r)
 elif k=='3.3-A5':
  C,r=circle(P,'_c');eq(r,[40,7][i]);eq(area(P,list('ABCD')),val)
 elif k=='3.3-B2':
  eq(d(P,'A','B'),[10,12][i]);eq(d(P,'C','D'),[16,18][i]);eq(angle(P,'D','A','B'),90);eq(area(P,list('ABCD')),val);C,r=circle(P,'_c')
  for u,v in [('A','B'),('B','C'),('C','D'),('D','A')]:eq(distLine(C,P[u],P[v]),r)
 elif k=='3.3-B3':
  C,r=circle(P,'_c')
  if i==0:
   for u,v in [('A','B'),('B','C'),('C','D'),('D','A')]:eq(d(P,u,v),5);eq(distLine(C,P[u],P[v]),r)
  else:
   eq(d(P,'A','C'),7);eq(d(P,'B','D'),7)
   for v in 'ABCD':eq(math.dist(C,P[v]),r)
 elif k=='3.3-C4':
  if i==0:eq(angle(P,'A','B','D'),angle(P,'A','C','D'));eq(angle(P,'D','B','C'),53);eq(angle(P,'C','D','B'),64);eq(angle(P,'D','A','B'),val)
  else:eq(angle(P,'D','B','C'),angle(P,'D','A','C'));eq(angle(P,'B','A','C'),42);eq(angle(P,'B','C','A'),37);eq(angle(P,'C','D','A'),val)
 print(k+l['part'],'verified')
for t in b['theory']:
 P=t['model']['points']
 if t['section']=='3.1':eq(d(P,'A','H'),4);eq(d(P,'O','A'),5);eq(d(P,'O','H'),3);eq(angle(P,'O','B','T'),90);eq(angle(P,'A','O','B'),2*angle(P,'A','C','B'))
 if t['section']=='3.2':eq(d(P,'A','B'),10);eq(d(P,'O','A'),5);eq(distLine(P['I'],P['A'],P['B']),2);eq(area(P,['A','B','C']),24)
 if t['section']=='3.3':eq(angle(P,'D','A','B')+angle(P,'B','C','D'),180);eq(angle(P,'C','A','D'),angle(P,'C','B','D'))
print('Independent assertions:',count,'; all 36 variants and 3 theory models verified.')
