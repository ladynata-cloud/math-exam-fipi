"""Exact independent source solving of applied problems and every system, pp. 231–233."""
import json,re,operator
from fractions import Fraction as F
from collections import Counter
from pathlib import Path
ts=json.loads(Path(__file__).with_name('exercises-1049-1062.json').read_text())
num=lambda t:int(re.search(r'№ (\d+)',t['title'])[1])
assert Counter(map(num,ts))=={1049:1,1050:1,1051:1,1052:1,1053:6,1054:6,1055:4,1056:4,1057:3,1058:2,1059:1,1060:1,1061:1,1062:1}
inside=lambda x,ans:False if ans=='∅' else (x in set(map(F,ans.split(';'))) if ans[0]not in '([' else ((ans[1:-1].split(';')[0]=='-∞'or(x>=F(ans[1:-1].split(';')[0])if ans[0]=='['else x>F(ans[1:-1].split(';')[0]))) and(ans[1:-1].split(';')[1]=='+∞'or(x<=F(ans[1:-1].split(';')[1])if ans[-1]==']'else x<F(ans[1:-1].split(';')[1])))))
checks=[
 lambda x:x.denominator==1 and 0<=x<=12 and 500*x+200*(12-x)<=4000,
 lambda x:x>4 and 4*(2+8/(x-4))<24,
 lambda x:x>12 and 20+12*(20/(x-12))<60,
 lambda x:x.denominator==1 and x>0 and x+x>20 and x+x+20<=46,
 lambda x:3*x/10-1<x+F(2,5) and 2-3*x<5*x+1,
 lambda x:F(5,2)*x-F(3,25)>F(3,5)*x+F(7,100) and 1-2*x>-x-4,
 lambda x:2*x+F(7,5)<(3*x-7)/5 and 2*x>3-2*x/5,
 lambda x:3*(x-2)*(x+2)-3*x*x<x and 5*x-4>4-5*x,
 lambda x:(x-4)*(5*x-1)-5*x*x>x+1 and 3*x-F(2,5)<2*x-F(3,5),
 lambda x:1+(1+x)/3>(2*x-1)/6-2 and 3*x-x/4>4,
 lambda x:6*x*(x-1)-3*x*(2*x-1)<x and x/2-F(37,10)<x/5-F(7,10),
 lambda x:7*x/10-3*(x/5+1)<=x/2+1 and (3*(1-x)/10+4*x/5>=x+F(53,10)),
 lambda x:(3*x-2)/3+(12*x+1)/6>0 and (14*x-21)/7+2*(9*x-6)/9<0,
 lambda x:(5*x-1)/5+(3*x+1)/3<x+F(29,5) and 8*x-7-(6*x-2)/6>x,
 lambda x:(x-1)/2-(x-4)/3>2*x-1 and 2*x-(x-5)/3>0,
 lambda x:3*x-(1+5*x)/4<x and (4-x)/5-x-1<0,
 lambda x:-9<3*x<18,lambda x:1<(2*x-1)/2<2,lambda x:3<=5*x-1<=4,lambda x:0<=(1-x)/3<=1,
 lambda x:-1<2*x-4<5,lambda x:0<=(x-5)/2<=5,lambda x:-1<-x/3+8<1,lambda x:-6<=-5*x/2+6<=-2,
 lambda x:x>0 and 3*(x-1)-4*(x+8)<5*(x+5) and F(6,5)*(1+5*x)-F(1,5)<5*(1-3*x)-3*x,
 lambda x:x>0 and 15*(x-4)-14*(x-3)<x*(x-9)-x*x and (5-x)/3-x>14-(2-x)/6,
 lambda x:x>0 and (2*x-1)*(3*x+2)-6*x*(x-4)<48 and (x-1)/8-(6*x+1)/4-1<0,
 lambda x:x<0 and (5*x-1)/6-(2*x-1)/2>0 and 1-(x+4)/3<0,
 lambda x:x<0 and (x+6)*(5-x)+x*(x-1)>0 and 3*x*(10*x+20)/10-3*x*x+30>0,
 lambda x:2*x-5>2 and 2*x+5>2,lambda x:-5<x-2<5 and -5<x<5,
 lambda x:x>5 and 6*(x+5)>90 and 8*(x-5)<90,lambda x:x>60 and 120/(1+60/x)<=72]
assert len(checks)==len(ts)
grid={F(n,d)for n in range(-100,201)for d in [1,2,3,7,11]}
for t in ts:
 for term in [t,*t['steps']]:
  for raw in re.findall(r'-?\d+(?:/\d+)?',term['answer']):
   a=F(raw);grid.update([a-F(1,100),a,a+F(1,100)])
count=0;rel={'<':operator.lt,'≤':operator.le,'>':operator.gt,'≥':operator.ge}
for f,t in zip(checks,ts,strict=True):
 n=num(t);assert t['source']['page']==(231 if n<=1052 else 232 if n<=1055 or t['title']=='№ 1056а'else 233)
 for x in grid:
  domain=n!=1054 or x.denominator==1
  ok=domain and f(x)
  assert inside(x,t['answer'])==ok,(t['title'],x,t['answer'])
  for row,step in zip(t['graph'].get('rows',[]),t['steps'][1:]):
   value=lambda cs:sum(F(a)*x**i for i,a in enumerate(cs));assert rel[row['operator']](value(row['left']),value(row['right']))==inside(x,step['answer']);count+=1
  count+=1
print('PASS',count,'source-formula, individual row, endpoint and integer membership comparisons')
