from pathlib import Path
import json,collections,re,math
from fractions import Fraction as F
ts=json.loads(Path(__file__).with_name('exercises-869-880.json').read_text());num=lambda t:int(re.search(r'№ (\d+)',t['title'])[1])
assert collections.Counter(map(num,ts))=={869:1,870:3,871:5,872:4,873:3,874:2,875:4,876:4,877:2,878:2,879:3,880:4}
assert all(t['source']['page']==(194 if num(t)<=877 else 195)for t in ts)
for t in ts:
 n=num(t)
 if 871<=n<=874 or n in(877,878):
  g=t['graph'];lo,hi=map(F,g['source']);f=(lambda x:1/x)if n==878 else(lambda x:F(g['slope'])*x+F(g['offset']))
  limits=list(map(f,(lo,hi)));assert [F(q['answer'])for q in t['steps'][:2]]==limits
  assert list(map(F,t['answer'][1:-1].split(';')))==sorted(limits)
  assert (t['answer'][0],t['answer'][-1])==(('[',']')if n==877 else('(',')'))
r=math.sqrt
sides=[(r(11)+13,15),(r(84),7+r(6)),(r(8)-r(3),2),(r(47)-r(7),5),(r(2)+5,2+r(5)),(r(3)-4,1-r(5)),((2*r(3)+23)/3,9),((1-r(15))/12,-7/8)]
assert [t['answer']for t in ts if num(t)in(875,876)]==['<'if a<b else'>'for a,b in sides]
for a in [.01,.1,1,100,1000]:
 for values,desc,t in [([2*a,a*r(3),-a,a/(r(3)+r(2)),3*a],False,ts[1]),([6*a,-a*r(5),a/(r(7)+r(6)),-a,-5*a-1],True,ts[2])]:
  assert sorted(values,reverse=desc)==[values[int(i)-1]for i in t['answer'].split(';')]
assert [t['answer']for t in ts if num(t)==879]==['1/16','22','0']
assert [t['answer']for t in ts if num(t)==880]==['-1;1','2','-6;3','-1;5']
for t in [t for t in ts if num(t)==880]:
 g=t['graph'];a,b,c=g['coefficients'];ban=list(map(F,g['excluded']))
 assert set(map(F,t['answer'].split(';')))==set(i for i in range(-20,21)if a*i*i+b*i+c==0 and i not in ban)
print('PASS 37 source cards, 18 intervals, exact source comparisons, exclusions and endpoint images')

