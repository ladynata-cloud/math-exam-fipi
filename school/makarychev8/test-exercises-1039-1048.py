"""Independent checks of the expressions before simplification, pp. 230–231."""
import json,re,operator
from pathlib import Path
from fractions import Fraction as F
from collections import Counter
ts=json.loads(Path(__file__).with_name('exercises-1039-1048.json').read_text())
num=lambda q:int(re.search(r'№ (\d+)',q['title'])[1])
assert Counter(map(num,ts))=={1039:6,1040:4,1041:2,1042:2,1043:2,1044:2,1045:4,1046:4,1047:4,1048:2}
assert all(t['source']['page']==(230 if num(t)<=1043 else 231)and t['source']['paragraph']==12 for t in ts)
L=[
 lambda x:(1-3*x)/100,lambda x:12*(1-12*x)+100*x,lambda x:F(3,5)*x-1-(3*x+1)/5,lambda x:F(2,3)*(6*x+4)-(12*x-5)/6,lambda x:(3*x+1)*(x-1)-3*x*x,lambda x:15*x*x-(5*x-2)*(3*x+1),
 lambda x:(x-1)/4-1,lambda x:(3*x-1)/2-(x-1)/4,lambda x:(1-2*x)/4-2,lambda x:5*x/6-(3*x-1)/3+(2*x-1)/2,
 lambda x:(x-F(1,2))/4+(x-F(1,4))/4+(x-F(1,8))/8,lambda x:(5-x)/3-(1-x)/2,
 lambda x:3*(5-4*x)+2*(14+x),lambda x:(x+1)*(x-1)-(x*x-3*x),
 lambda x:(3*x-8)/12,lambda x:(x+1)/3,lambda x:2*(4*x-1)-5*x,lambda x:6*(1-x)-8*(3*x+1)+30*x]
R=[lambda x:x/50+F(301,100),lambda x:36-49*x,lambda x:5*x-4,lambda x:4-6*x,lambda x:6*x+7,lambda x:7*x-8,
 lambda x:(x+1)/3+8,lambda x:0,lambda x:(1-5*x)/8,lambda x:1,lambda x:0,lambda x:1,lambda x:0,lambda x:14,lambda x:(x-1)/4,lambda x:(2*x+3)/6,lambda x:3*x+5,lambda x:-5]
rels={'>':operator.gt,'<':operator.lt,'≤':operator.le,'≥':operator.ge}
def inside(v,ans):
 if ans=='∅':return False
 if ans[:1] not in '([':return v in set(map(F,ans.split(';')))
 lo,hi=ans[1:-1].split(';')
 return (lo=='-∞'or(v>=F(lo)if ans[0]=='['else v>F(lo))) and (hi=='+∞'or(v<=F(hi)if ans[-1]==']'else v<F(hi)))
grid={F(i,d)for i in range(-146,152)for d in [1,3,8,25]}
for t in ts:
 for raw in re.findall(r'-?\d+(?:/\d+)?',t['answer']):
  n=F(raw);grid.update([n-F(1,1000),n,n+F(1,1000)])
count=0
for i,t in enumerate(ts):
 g=t['graph'];mode=g['mode'];ans=t['answer']
 for x in grid:
  val=lambda co:sum(F(v)*x**j for j,v in enumerate(co))
  if i<len(L):
   a,b=L[i](x),R[i](x);assert (a,b)==(val(g['left']),val(g['right']))
   good=rels[g['operator']](a,b) and (mode!='natural'or x.denominator==1 and x>0)
  elif mode=='root':
   y=val(g['left']);eqs=[3*y==9*x,y+2==x,y-8==3*x+1,2*y-3==x+4,10*y==3*x,y-4==x,3*y-1==x+2,3*y-3==5*x-2];assert eqs[i-18]
   good=y>0 if i<22 else y<0
  elif mode=='abs':
   a=[2*x-16,12-6*x,x+6,10*x-35][i-26];assert a==val(g['left'])
   good=abs(a)==a if i==26 else (a!=0 and abs(a)/a==1) if i==27 else abs(a)==-a if i==28 else a!=0 and abs(a)/a==-1
  else:good=(-6*x+12>0)if i==30 else(-6*x+12<0)
  assert inside(x,ans)==good,(t['title'],x,ans);count+=1
print('PASS',count,'original rational products, parameter equations, excluded zero denominators and ordinate signs')
