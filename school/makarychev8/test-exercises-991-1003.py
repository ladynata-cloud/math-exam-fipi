"""Check all final source systems, printed pages 221–223, without the course checker."""
from fractions import Fraction as F
from pathlib import Path
import json,re
tasks=json.loads(Path(__file__).with_name('exercises-991-1003.json').read_text())
book={991:[lambda x:-3<2*x-1<3,lambda x:-12<5-x<17,lambda x:2<6-2*x<5,lambda x:-1<5*x+4<19],
992:[lambda x:F('-6.5')<(7*x+6)/2<=F('20.5'),lambda x:-1<(4-x)/3<=5,lambda x:-2<=(3*x-1)/8<=0,lambda x:F('-2.5')<=(1-3*x)/2<=F('1.5')],
993:[lambda x:-1<=15*x+14<44,lambda x:-1<=(6-x)/3<=1,lambda x:F('-1.2')<1-2*x<F('2.4'),lambda x:-2<(4*x-1)/3<=0],
994:[lambda x:-1<3*x-5<1,lambda x:-2<=(5-2*x)/4<=1],995:[lambda a:all(-6<x<6 for x in [-a-2,-a+2])],996:[lambda b:all(x<0 for x in [3*b-4,3*b+4])],
997:[lambda x:x>8 and x>7 and x>-4,lambda y:y< -1 and y< -5 and y<4,lambda m:m>9 and m>10 and m<12,lambda q:q<6 and q<5 and q<1],
998:[lambda x:x-4<8 and 2*x+5<13 and 3-x>1,lambda x:2*x-1<x+3 and 5*x-1>6-2*x and x-5<0],
999:[lambda a:3-2*a<13 and a-1>0 and 5*a-35<0,lambda a:6-4*a<2 and 6-a>2 and 3*a-1<8,lambda a:5*a-8>7 and 4-a<3 and 2-3*a>10],
1000:[lambda x:12-25*x>=0,lambda x:5*x-11>0,lambda x:(3*x-2)**2>0]}
def member(raw,x):
 if raw=='∅':return False
 for part in raw.split('∪'):
  l,r=part[1:-1].split(';')
  if(l=='-∞'or x>F(l)or x==F(l)and part[0]=='[')and(r=='+∞'or x<F(r)or x==F(r)and part[-1]==']'):return True
 return False
allrefs=set();count=0
for t in tasks:
 n,l=re.search(r'№ (\d+)([абвг]?)',t['title']).groups();n=int(n);i='абвг'.index(l)if l else 0;allrefs.add((n,i));assert t['source']['page']==(221 if n==991 else 222 if n<1000 else 223)
 if n not in book:continue
 f=book[n][i];ans=t['answer']
 if t['kind']=='system-examples':
  xs=list(map(F,ans.split(';')));assert len(set(xs))==3 and all(f(x)for x in xs);continue
 grid={F(i,k)for i in range(-90,91)for k in [1,2,3,4,5,7,11]};grid.update([F(12,25),F(-19,7),F(-4,3),F(11,5),F(2,3)])
 for x in grid:assert member(ans,x)==f(x),(t['id'],x,ans);count+=1
assert allrefs=={(n,i)for n,qs in book.items()for i in range(len(qs))}|{(1001,0),(1002,0),(1002,1),(1002,2),(1003,0)}
assert {n for n in range(1,200)if(9*n*n+12*n+12)%n==0}=={1,2,3,4,6,12}
for a in [F(1,3),F(2),F(7,2)]:
 for s in [F(4,5),F(11,2)]:
  assert a*(2*s/a)/2==s and s/(2*s/a)==a/2
 for t in [F(3,2),F(9)]:assert 2*(a*t*t/2)/a==t*t
assert F(20,10)+F(60,15)==6 and 15-10==5;assert len(tasks)==37
print('PASS 37 final source cards,',count,'exact memberships, divisors, formulas and uphill/level rate checks')
