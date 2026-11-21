from pathlib import Path
from fractions import Fraction as F
import json,collections,re,operator
ts=json.loads(Path(__file__).with_name('exercises-932-955.json').read_text());n=lambda t:int(re.search(r'№ (\d+)',t['title'])[1])
assert collections.Counter(map(n,ts))=={932:4,933:1,934:4,935:11,936:12,937:2,938:4,939:8,940:8,941:3,942:2,943:7,944:6,945:4,946:4,947:4,948:9,949:6,950:4,951:6,952:4,953:6,954:4,955:2}
assert all(t['source']['page']==(210 if n(t)<=934 else 211 if n(t)<=942 else 212 if n(t)<950 or t['title']=='№ 950а'else 213)for t in ts)
comp={'<':operator.lt,'>':operator.gt,'≤':operator.le,'≥':operator.ge,'>=':operator.ge,'<=':operator.le};checks=0
for t in ts:
 g=t['graph'];l,r=([F(v)for v in g[k]]for k in ('left','right'));bound=F(g['threshold'])
 value=lambda a,x:sum(c*x**j for j,c in enumerate(a))
 assert value(l,bound)==value(r,bound)
 for x in [bound-F(7,3),bound-F(1,100),bound,bound+F(1,100),bound+F(29,7)]:
  assert comp[g['operator']](value(l,x),value(r,x))==comp[g['relation']](x,bound);checks+=1
 if t['kind']=='choice':assert (t['answer']=='да')==comp[g['operator']](value(l,F(g['fixed'])),value(r,F(g['fixed'])))
by={t['title']:t['answer']for t in ts}
for title,target in {'№ 935в':'x≤-1','№ 936ж':'x≤1/4','№ 936м, чертёж':'x≥-20','№ 943г':'m≤4/5','№ 944д':'x≤47/10','№ 945б':'x>0','№ 946г':'y<2/15','№ 948и':'x≥17','№ 950б':'y>7','№ 951д':'x≥-5/3','№ 953в':'y≥3/2','№ 954г':'y<-23/6','№ 955а':'a>7/10','№ 955б':'b<3'}.items():assert by[title]==target
print('PASS',len(ts),'individual statements and',checks,'rational substitution comparisons including original boundary equality')
