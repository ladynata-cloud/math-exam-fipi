from pathlib import Path
from fractions import Fraction as F
import json
cards=json.loads(Path(__file__).with_name('exercises-1093-1096.json').read_text());m={t['id'].split('source-')[1]:t for t in cards};assert len(m)==18 and all(t['source']['page']==243 for t in cards)
assert [sum(k.startswith(str(n)+'-')for k in m)for n in [1093,1094,1095,1096]]==[6,2,6,4]
trip=lambda t:15*t if t<F(7,6) else F(35,2)if t<=F(3,2)else F(71,2)-12*t
assert [F(m['1093-'+k]['answer']) for k in ['zero','one','decimal','two']]==list(map(trip,[0,1,F(7,5),2]));assert list(map(F,m['1093-build']['answer'].split(';')))==list(map(trip,[0,F(7,6),F(3,2),F(5,2)]));assert(F(3,2)-F(7,6))*60==20
expected={'1094-a':[F(2,3)],'1094-b':[5],'1095-a':[0,F(1,2)],'1095-b':[-9,0],'1095-c':[-6,6],'1095-f':[F(-1,15),0],'1096-a':[-4,-3],'1096-b':[-5,7],'1096-c':[F(-1,2),3],'1096-d':[1,F(5,3)]};evals=0
for k,roots in expected.items():
 t=m[k];left=list(map(F,t['graph']['left']));right=list(map(F,t['graph']['right']));assert set(map(F,t['answer'].split(';')))==set(roots)
 for den in range(1,9):
  for n in range(-100,101):
   x=F(n,den);assert (sum(v*x**i for i,v in enumerate(left))==sum(v*x**i for i,v in enumerate(right)))==(x in roots);evals+=1
assert m['1095-d']['answer']=='∅' and list(map(F,m['1095-d']['graph']['left']))==[1,0,5];assert m['1095-e']['answer']=='-√2;√2' and list(map(F,m['1095-e']['graph']['left']))==[-1,0,F(1,2)];print('PASS original printed page 243, trip scale, exact piece boundaries and',evals,'independent substitutions.')
