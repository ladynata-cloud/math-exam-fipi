from pathlib import Path
import json,collections,re
from fractions import Fraction as F
ts=json.loads(Path(__file__).with_name('exercises-911-931.json').read_text());n=lambda t:int(re.search(r'№ (\d+)',t['title'])[1])
assert collections.Counter(map(n,ts))=={911:9,912:6,913:4,914:6,915:4,916:12,917:3,918:4,919:1,920:2,921:4,922:4,923:2,924:4,925:1,926:4,927:8,928:2,929:1,930:1,931:1}
assert all(t['source']['page']==(205 if n(t)<=916 else 206 if n(t)<=927 else 207)for t in ts)
def valid(v,x):
 l,r=v[1:-1].split(';');return (l=='-∞'or F(l)<x or v.startswith('[')and F(l)==x)and(r=='+∞'or x<F(r)or v.endswith(']')and F(r)==x)
for t in ts:
 k=n(t);g=t['graph']
 if k in(924,926,927):
  op=any if(k==926 or k==927 and t['title'].endswith('объединение'))else all
  for i in range(-100,101):
   x=F(i,5);assert op(valid(s,x)for s in g['given'])==any(valid(s,x)for s in t['answer'].split('∪'))
 if k==916:assert (t['answer']=='да')==valid(g['given'][0],F(g['probe']))
 if k==918:assert (t['answer']=='да')==(F(9,4)<g['surd']<F(144,25))
 if k in(920,921):assert set(map(int,t['answer'].split(';')))=={x for x in range(-20,30)if valid(g['given'][0],F(x))}
assert [t['graph']['given'][0]for t in ts if n(t)==913]==['[-2;6]','[-1;+∞)','(-1;7)','(-∞;4]']
assert next(t for t in ts if n(t)==919)['answer']=='6/54;7/54;8/54;9/54'
assert (F(120,40)-F(120,45))*60==20
x=F(3,4);assert (3*x-1)/(x-2)==-1
for a in (-3,-1,1,4):
 for b in map(F,[-2,1,5]):
  assert (1+(a-b)/b)/(a*b)==1/(b*b)
  assert ((a*a-b*b)/(a*a)-1)/(2*a*a*b*b)==F(-1,2*a**4)
print('PASS original figure 41, all 83 source cards, 3,216 independent set/number memberships, review equations and domains')
