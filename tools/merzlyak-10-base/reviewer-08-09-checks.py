"""Independent reviewer checks, authored separately from author-08-09.py.
Source: inspected PNG86–88 and95–99. No lesson content or flags are modified.
"""
import json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];D=ROOT/'stereo-course/merzlyak-10-base/lessons'
def lesson(s,n,part=''):return json.loads((D/f'ex-{s:02}-{n:03}{"-"+part if part else ""}.json').read_text())
def p(s,n,part=''):return lesson(s,n,part)['visualization']['model']['points']
def sub(a,b):return [x-y for x,y in zip(a,b)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def norm(a):return math.hypot(*a)
def eq(a,b):assert math.isclose(a,b,abs_tol=2e-7,rel_tol=2e-7),(a,b)
def vec(q,a,b):return sub(q[b],q[a])
def dist(q,a,b):return norm(vec(q,a,b))
def angle(q,a,b,c,d):return math.degrees(math.acos(min(1,abs(dot(vec(q,a,b),vec(q,c,d)))/(dist(q,a,b)*dist(q,c,d)))))
def mid(q,m,a,b):
 for i in range(3):eq(q[m][i],(q[a][i]+q[b][i])/2)
def triangle_area(q,a,b,c):return norm(cross(vec(q,a,b),vec(q,a,c)))/2
# Source-specific scalar results checked directly from card coordinates.
for sec,num,a,b,value in [(8,8,'C','D',10),(8,9,'B','C',10),(8,10,'M','K',math.sqrt(.5)),(8,18,'C','D',3),(9,8,'D','O',2),(9,9,'M','D',2*math.sqrt(5)),(9,10,'O','B1',math.sqrt(1.5)),(9,11,'A','D',8),(9,20,'E','F',9),(9,26,'C','D',12),(9,27,'A','B',14),(9,28,'C','C1',17),(9,29,'N','N1',10/3),(9,30,'C','C1',23),(9,40,'P','H',12),(9,41,'B','C',8)]:eq(dist(p(sec,num),a,b),value)
for sec,num,a,b,c,d,result in [(8,4,'A','B','M','C',60),(8,5,'M','B','A','D',90),(8,5,'M','B','C','D',40),(8,6,'A','D','M','E',70),(8,6,'B','C','M','F',35),(8,7,'B','C','A','E',80),(8,12,'O','B1','A1','C1',90),(8,13,'A','D1','B1','C',60),(8,15,'A','C','B','D',90),(8,16,'A','C','B','D',60),(9,38,'A','B1','A1','E',math.degrees(math.acos(1/math.sqrt(10)))),(9,39,'S','M','C','K',45)]:eq(angle(p(sec,num),a,b,c,d),result)
q=p(8,14);mid(q,'E','A','A1');mid(q,'F','C','D');mid(q,'H','E','F');eq(dot(vec(q,'D1','H'),vec(q,'E','F')),0)
q=p(9,12);eq(dot(vec(q,'A','C'),vec(q,'B','E')),0);eq(dot(vec(q,'A','C'),vec(q,'B','O')),0);eq(norm(cross(vec(q,'B','O'),vec(q,'B','D'))),0)
# Line–plane proof models: direction is perpendicular to two independent plane directions.
for n,line,plane in [(13,('B','C'),('A','F','C')),(15,('A','D'),('B','K','C')),(21,('B','C'),('A','K','D')),(22,('A','C'),('B','K','D')),(23,('B','D'),('A','E','C')),(25,('M','O'),('A','B','C')),(33,('O','A'),('O','B','C')),(35,('A','C'),('B','C','D')),(36,('M','Q'),('B','C','M')),(37,('E','F'),('A','B','C'))]:
 q=p(9,n);u=vec(q,*line);a,b,c=plane;v,w=vec(q,a,b),vec(q,a,c);assert norm(cross(v,w))>1e-5;eq(dot(u,v),0);eq(dot(u,w),0)
# Exact source continuations, independent of the source-index assumptions.
assert lesson(9,24)['source']['pdfPages']==[97,98]
assert lesson(9,35)['source']['pdfPages']==[98,99]
# The two nontrivial sections must equal all intersections with original solid edges.
for n,edgecount,names in [(14,12,['M','N','P','Q']),(34,6,['M','P','Q'])]:
 model=lesson(9,n)['visualization']['model'];q=model['points'];a,b,c=names[:3];normal=cross(vec(q,a,b),vec(q,a,c));offset=dot(normal,q[a]);hits=[]
 for u,v1 in model['edges'][:edgecount]:
  a,b=q[u],q[v1];da=dot(normal,a)-offset;db=dot(normal,b)-offset
  for x,d in [(a,da),(b,db)]:
   if abs(d)<2e-8 and not any(math.dist(x,h)<2e-7 for h in hits):hits.append(x)
  if da*db< -2e-8:
   t=da/(da-db);x=[a[i]+t*(b[i]-a[i]) for i in range(3)]
   if not any(math.dist(x,h)<2e-7 for h in hits):hits.append(x)
 assert len(hits)==len(names),(n,hits,names)
 for h in hits:assert any(math.dist(h,q[k])<2e-7 for k in names),(n,h)
q=p(9,34);eq(dist(q,'A','M')/dist(q,'M','D'),3);eq(triangle_area(q,'M','P','Q'),math.sqrt(2)/16)
files=sorted(D.glob('ex-0[89]-*.json'));assert len(files)==68
for file in files:
 x=json.loads(file.read_text());assert x['source']['pdfPages']==[a+1 for a in x['source']['printedPages']];assert 3<=len(x['steps'])<=7
 assert x['answer']['mode']=='manual';assert x['help']
print('REVIEWER_08_09_CHECKS_OK: scalar answers, angle conclusions, plane normals, complete section clipping, continuation page references, 68 cards')
