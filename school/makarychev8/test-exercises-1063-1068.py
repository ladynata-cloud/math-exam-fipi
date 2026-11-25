"""Printed p237. Independently evaluate every textbook subpart, including historical entries."""
from pathlib import Path
from fractions import Fraction as F
import json,re
read=lambda f:json.loads(Path(__file__).with_name(f).read_text())
D=json.loads(Path(__file__).with_name('data.js').read_text().split('window.MakarychevCourse=',1)[1].removesuffix(';\n'))
lesson=next(l for l in D['lessons'] if l['id']=='p42');index={q['id']:q for q in lesson['tasks']}
assert len(read('exercises-1063-1068.json'))==14
get=lambda key:F(index[key]['answer'])
for key,x in [('p42-t01',F(-1)),('p42-source-1063-b',F(0)),('p42-source-1063-c',F(1,3))]:assert get(key)==-3*x*x+10
for k,x in [('zero',F(0)),('positive',F('1.5')),('negative',F(-1))]:assert get('p42-source-1064-'+k)==(x-F(1,2))/(x+F(1,2))
for key,x in [('p42-t02',5),('p42-source-1065-b',4),('p42-source-1065-c',2),('p42-source-1065-d',-3)]:assert get(key)==x**3-10
assert get('p42-source-1066-sum')==sum(n*n+n+1 for n in range(4))
for l,y in [('a',17),('b',-3),('c',0)]:assert -5*get('p42-source-1067-'+l)+6==y
assert set(map(F,index['p42-source-1068-a']['answer'].split(';')))=={-4,0}
assert get('p42-source-1068-b')==-1
num=lambda t:int(re.search(r'№\s*(\d+)',t['source']['reference'])[1])
selected=[lesson['tasks'][i]for i in lesson['studyOrder']if lesson['tasks'][i]['source']['type']=='textbook'and 1063<=num(lesson['tasks'][i])<=1068]
assert len(selected)==16 and [num(t)for t in selected]==sorted(map(num,selected))and all(t['source']['page']==237 for t in selected)
func={1063:lambda x:-3*x*x+10,1064:lambda x:(x-F(1,2))/(x+F(1,2)),1065:lambda x:x**3-10,1066:lambda x:x*x+x+1,1067:lambda x:-5*x+6}
count=0
for t in selected:
 if 'graph'not in t:continue
 g=t['graph'];fn=func.get(num(t),lambda x:x*(x+4)if t['id'].endswith('-a')else(x+1)/(5-x))
 for den in [1,2,3,7]:
  for n in range(-49,53):
   x=F(n,den);power=lambda coeff:sum(F(v)*x**i for i,v in enumerate(coeff));a,b=power(g['numerator']),power(g['denominator'])
   try:expected=fn(x)
   except ZeroDivisionError:assert b==0
   else:assert a/b==expected
   count+=1
print('PASS',count,'independent rational evaluations; 16 original subparts and stable old addresses')
