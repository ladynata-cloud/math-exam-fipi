"""Exact chapter IV additional source checks, pp. 227–228."""
from fractions import Fraction as F
from itertools import product
from pathlib import Path
from decimal import Decimal as D,localcontext
import json,collections,re
ts=json.loads(Path(__file__).with_name('exercises-1014-1021.json').read_text());num=lambda t:int(re.search(r'№ (\d+)',t['title'])[1])
assert collections.Counter(map(num,ts))=={1014:2,1015:4,1016:2,1017:2,1018:2,1019:1,1020:1,1021:1}
assert all(t['source']['section']=='additional-4'and t['source']['paragraph']==11 for t in ts)
for t in ts:assert t['source']['page']==(227 if num(t)<=1017 or t['title']=='№ 1018а'else 228)
grid=[F(i,j)for i in range(-7,17)for j in [1,2,3,5]];count=0
for x in grid:
 assert(3*x+4)*(2*x+1)-(6*x-1)*(x+2)==6
 assert(3*x-1)*(2*x+1)-(2*x-1)*(2+3*x)==1
 assert(x+1)**2-4*x==(x-1)**2
 assert(3*x+1)**2-6*x==9*x*x+1>0
 assert(x+3)**2-2*x-4*(x+2)==x*x+1>0
 assert 1+(x+2)**2-3*(2*x-1)==(x-1)**2+7>0;count+=6
 if x>3:assert((x-3)/(x+3)-(x+3)/(x-3))*(1+3/x)==-12/(x-3)<0;count+=1
 if x>1:
  div=1/(x*x-x)+(x-3)/(x*x-1);assert div==(x-1)/(x*(x+1))>0
  assert (x*x+3)/(x-1)-(2/x)/div==x-1>0;count+=2
for a,b,c in product(grid[:13],repeat=3):
 assert a*a+b*b+2-2*(a+b)==(a-1)**2+(b-1)**2>=0
 assert a*a+b*b+c*c+5-2*(a+b+c)==(a-1)**2+(b-1)**2+(c-1)**2+2>0;count+=2
with localcontext()as ctx:
 ctx.prec=40;assert D(7).sqrt()+2*D(5).sqrt()<2+D(35).sqrt();assert 4*D(6).sqrt()+2>2*D(3).sqrt()+4*D(2).sqrt()
for x in range(3,13):
 for y in range(1,x):
  a,b=F(x),F(y);assert 20/(a+b)+20/(a-b)-40/a==40*b*b/(a*(a*a-b*b))>0;count+=1
  for z in range(y+1,x):
   c=F(z)
   for d in [F(1,3),F(20),F(25,2)]:
    t1=d/(a+b)+d/(a-b);t2=d/(a+c)+d/(a-c)
    assert t1-t2==2*d*a*(b*b-c*c)/((a*a-b*b)*(a*a-c*c))<0;count+=1
for s in grid:
 if s>0:assert s/16+s/14-2*s/15==s/1680>0;count+=1
print('PASS',len(ts),'source cards including five-part investigation and',count,'exact independent checks')
