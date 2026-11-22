"""Check each exercise and every requested table column, coordinate, figure and proof in pp.48–52."""
import json, re, math
from fractions import Fraction as F
from pathlib import Path
import sympy as sp
here=Path(__file__).parent
new=json.loads((here/'exercises-181-200.json').read_text());old=json.loads((here/'ch1.json').read_text())[7]['tasks']
bank={q['source']['reference']:q for q in old+new if q['source']['type']=='textbook'}
refs=lambda n:[q for name,q in bank.items() if re.match(rf'№\s*{n}(?!\d)',name)]
assert len(new)==81 and len(bank)==83 and sorted(n for n in range(181,201) if refs(n))==list(range(181,201))
by=lambda title:bank['№ '+title]
def values(n,rows):
 for key,answer in rows:
  real=by(str(n)+key)['answer'];assert F(real)==F(answer),(n,key,real,answer)
for n,given,want in [(181,[-4,-4,'-1/4',2,5,16,'2/5'],['-2','-2','-32','4','8/5','1/2','20']),
 (182,[-1200,-600,'-1/2',-1,76,120,'2/5',1000],['-1/10','-1/5','-240','-120','30/19','1','300','3/25'])]:
 for i,(known,answer) in enumerate(zip(given,want),1):
  row=by('181, столбец x = −4') if (n,i)==(181,1) else by(f'{n}, столбец {i}')
  assert F(row['answer'])==F(answer) and F(known)*F(answer)==(8 if n==181 else 120)
assert by('183а')['answer']=='600/t' and by('183б')['answer']=='600/v'
values(184,[(f'(1), случай {i}',ans) for i,ans in enumerate(['1/10','1/100','100','500'],1)])
for name,answer in zip('ABCD',['да','нет','да','нет']):assert by('184(2), точка '+name)['answer']==answer
assert F(by('185')['answer'])==24 and by('185, формула')['answer']=='24/x'
for n,groups in [(186,[['4','2','-8','-2','-8/5'],['-2','-4','1']]),(187,[['-2','-16/5','-16/3','8','16/5'],['-1','4']])]:
 for part,answers in zip('аб',groups):values(n,[(part+', '+str(i),v) for i,v in enumerate(answers,1)])
ks=[F(-8),F(2),F(-2),F(3),F(-4),F(1,2),F(-2,5),F(6),F(6)]
drawn=[by('187, построение')]+[by('188'+p) for p in 'абвгде']+[by('189, построение'),by('192, построение')]
for q,k in zip(drawn,ks):
 c=q['graph']['curves'][0];assert F(str(c['k']))==k
 assert [k/F(x) for x in c['xs']]==[F(v) for v in q['answer'].split(';')]
assert by('192, построение')['graph']['xRange'][0]==0
for title,solutions in [('189а',[-math.sqrt(6),math.sqrt(6)]),('189б',[3-math.sqrt(3),3+math.sqrt(3)]),('190а',[2]),('190б',[-8**.25,8**.25])]:
 q=by(title);assert all(abs(a-b)<1e-10 for a,b in zip(q['rootValues'],solutions)) and len(q['rootValues'])==len(solutions)
assert [int(by('191'+part)['answer']) for part in 'абвг']==[1,1,2,0]
assert by('192, зависимость')['answer']=='6/a' and by('192, область')['answer']=='a > 0'
for p,expected in zip('абв',[1,F(6,5),5]):assert F(by('193'+p)['answer'].rsplit('/x',1)[0])==expected
values(194,[('а, 1',1),('а, 2','16/5'),('а, 3',2),('б, 1',80),('б, 2',20),('б, 3',10),('б, 4',5),('в',80)])
assert by('195а')['answer']=='положительный' and by('195б')['answer']=='отрицательный'
assert by('196')['answer']=='y = −3/x'
assert [by('197'+p)['answer'] for p in 'абвг']==['График 1','График 3','График 2','График 4']
values(198,[('а','5/9'),('б','9/4')])
x=sp.Symbol('x')
a,b=map(int,by('199')['answer'].split(';'));assert sp.expand(a*(x+2)+b*(x-5))==5*x+31
original=(3/(x+2)-1/(x-2)-12/(4-x*x))/((x+7)/(x-2));assert sp.cancel(original-sp.sympify(by('200')['answer']))==0
for page, first, last in [(48,181,184), (49,185,191), (50,192,196),
                          (51,197,199), (52,200,200)]:
 for n in range(first, last+1):
  assert refs(n) and all(task['source']['page']==page for task in refs(n)), (n,page)
assert all(len(q['steps'])>=2 for q in new)
print('PASS 20 exercises and 83 source cases, every table cell, exact graph scales, coefficients, real intersections, proofs and training steps')
