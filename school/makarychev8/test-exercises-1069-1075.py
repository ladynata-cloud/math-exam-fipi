from fractions import Fraction as F
from pathlib import Path
import json, re
cards=json.loads(Path(__file__).with_name('exercises-1069-1075.json').read_text()); by={t['id'].split('source-')[1]:t for t in cards};assert len(by)==23
expected={1069:'abc',1070:'abc',1071:'abcdef',1072:'ab',1073:'abcd',1074:'ab',1075:['formula','a','b']}
for n,suffixes in expected.items():
 for s in suffixes: assert by[f'{n}-{s}']['source']['page']==238 and '№ '+str(n) in by[f'{n}-{s}']['source']['reference']
for i,y in zip('ab',[1,F(-1,2)]):assert 4/(6+F(by['1069-'+i]['answer']))==y
assert by['1069-c']['answer']=='∅'
for s,y in zip('abc',[-5,0,F(5,2)]):assert F(by['1070-'+s]['answer'])/2-4==y
for t in (by['1072-a'],by['1072-b']):
 a,b,c,d=map(F,t['answer'].split(';'));assert (c==0 and d!=0) if t['id'].endswith('a') else c!=0 and 7*c+d==0
assert list(map(F,by['1074-a']['answer'].split(';')))==[F(1,2),F(-3,2),-3];assert list(map(F,by['1074-b']['answer'].split(';')))==[2,-1,-2]
ks=F(3,4)/2;assert ks==F(by['1075-formula']['answer']);assert F(9,4)*60*ks==F(by['1075-a']['answer']);assert 60/ks==F(by['1075-b']['answer'])
count=0
for i in range(-220,221):
 for j in range(1,8):
  x=F(i,j)
  for suff,co,expectedValue in [('a',-3,(x-3)/2),('b',-2,2/x-1 if x else 0)]:
   if x==co or suff=='b' and x==0:continue
   y=(x*x-9)/(6+2*x) if suff=='a' else (4-x*x)/(x*x+2*x);assert y==expectedValue;count+=1
print('PASS source p. 238, 23 cards and',count,'independent rational identities.')
