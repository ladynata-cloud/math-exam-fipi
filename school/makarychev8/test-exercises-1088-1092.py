from fractions import Fraction as F
from pathlib import Path
from math import sqrt
import json
cards=json.loads(Path(__file__).with_name('exercises-1088-1092.json').read_text());by={t['id'].split('source-')[1]:t for t in cards};assert len(by)==24
for k,v in by.items():assert v['source']['page']==(241 if int(k[:4])<=1090 else 242)
assert [by['1088-'+s]['answer']for s in ['half','reciprocal','slope','negative']]==['3','1','4','2'];assert [by['1089-'+s]['answer']for s in ['a','b','c','min','max','range']]==['-7/2;7/2','(-2;2)','(-∞;-4]∪[4;+∞)','0','наибольшего значения нет','[0;+∞)']
for s,formula in [('a',lambda x:x**3-8*x),('b',lambda x:4/(x+2))]:
 t=by['1090-'+s+'-build'];assert [formula(F(str(i)))for i in t['graph']['xs']]==list(map(F,t['answer'].split(';')))
assert by['1090-a-range']['answer']=='[−32√6/9; 32√6/9]';assert by['1090-b-range']['answer']=='[1/2;8]';assert F(3,2)**3-8*F(3,2)==F(-69,8)<-8
for s,a in [('rise','[0;6]'),('fall','[6;12]'),('change','4')]:assert by['1091-'+s]['answer']==a
p=lambda t:2*t+20 if t<40 else F(100)if t<=60 else 140-F(2,3)*t
assert [p(F(x))for x in [0,40,60,150]]==list(map(F,by['1092-build']['answer'].split(';')));checks=0
for d in range(1,10):
 for n in range(-3*d,3*d+1):
  x=F(n,d);fx=x**3-8*x;assert -32*sqrt(6)/9<=fx<=32*sqrt(6)/9;checks+=1
 for n in range(150*d):
  t=F(n,d);delta=p(t+F(1,d))-p(t);assert delta==(F(2,d)if t<40 else 0 if t<60 else F(-2,3*d));checks+=1
print('PASS printed 241–242, 24 cards, both original drawings and',checks,'independent cubic and piecewise checks.')
