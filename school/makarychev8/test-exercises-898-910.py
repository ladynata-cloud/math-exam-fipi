from pathlib import Path
import json,collections,re
from fractions import Fraction as F
ts=json.loads(Path(__file__).with_name('exercises-898-910.json').read_text());n=lambda t:int(re.search(r'№ (\d+)',t['title'])[1])
assert collections.Counter(map(n,ts))=={898:3,899:3,900:8,901:6,902:2,903:2,904:7,905:1,906:5,907:4,908:1,909:1,910:1}
assert all(t['source']['page']==(201 if n(t)<=901 else 202 if n(t)<=908 else 203)for t in ts)
for t in ts:
 g=t['graph']
 if 'first' in g:
  a,b=map(set,(g['first'],g['second']));result={'left':a,'right':b,'intersection':a&b,'union':a|b}[g['operation']]
  assert set(t['answer'].split(';'))==set(map(str,result))
 if n(t)==901:
  x=g['fixed'];sq=x in [i*i for i in range(1,10)];cube=x in[i**3 for i in range(1,6)]
  assert (t['answer']=='да')==(sq and cube if g['operation']=='intersection'else sq or cube)
assert set('геометрия')&set('география')==set('герияо')
assert [t['answer']for t in ts if n(t)==902]==['CB','AD']
for x in map(F,[-3,F(2,3)]):assert 1-1/(2-x)==(6-x)/(3*x*x-12)-1/(x-2)
assert all((x-8)**2-(x+8)**2==-32*x for x in range(-25,26))
assert F(160,10)-F(180,12)==1 and 12-10==2
print('PASS 44 cards, two retained intersections, both words, six solid-power membership cases, figure 36, mathematical domains and yield')
