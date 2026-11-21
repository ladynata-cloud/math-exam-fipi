"""Compute every story's two independent quantities and compare with the printed conditions."""
import json
from fractions import Fraction as F
from pathlib import Path
import sympy as S
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application,convert_xor
p=Path(__file__).resolve().parent
old=next(t['tasks'][:2] for t in json.loads((p/'ch3.json').read_text()) if t['id']=='p32')
data=json.loads((p/'exercises-719-732.json').read_text())
q={t['source']['reference'].removeprefix('№ '):t for t in [*old,*data]}
assert len(q)==24
for ref,t in q.items():
    if ref.startswith('§'): assert t['source']['adaptation'] and t['source']['page']==171
    else: assert t['source']['page']==(170 if int(ref[:3])<=723 else 171)
assert F(q['719']['answer'])==42*F(5,7)
assert list(map(F,q['721']['answer'].split(';')))==[40,25] and 40+25==65 and F(40,25)==F(8,5)
rows={720:([1,3,10],[1,-3,2]),722:([1,1,18],[-1,1,3]),723:([1,-1,40],[-1,9,0]),
724:([1,1,28],[5,2,92]),725:([1,1,10],[5,3,44]),726:([2,3,46],[-F(12,5),1,0]),
728:([2,2,66],[-10,1,0]),729:([2,3,47],[3,-6,18]),730:([1,1,120],[F(7,5),-F(9,10),30])}
for n,system in rows.items():
    t=q[str(n)];computed=S.linsolve((S.Matrix([r[:2] for r in system]),S.Matrix([r[2] for r in system])))
    x,y=next(iter(computed));assert list(map(F,t['steps'][1]['answer'].split(';')))==[x,y]
    graph=t['graph'];assert [[*map(F,a['coeff']),F(a['rhs'])]for a in graph['checks']]==list(system)
    if t['kind']=='choice':assert t['answer']=='Нет' and any(v.q!=1 for v in (x,y))
    elif graph['mode']=='pair':assert list(map(F,t['answer'].split(';')))==[x,y]
    else:assert F(t['answer'])==(x if graph['mode']=='x'else y)
assert [n for n in range(10,100)if n==2*(n//10+n%10)]==[int(q['727']['answer'])]
r=next(iter(q['727']['graph']['checks']));assert r['coeff']==['8','-1'] and r['rhs']=='0'
x,a,c=S.symbols('x a c')
for l,f in [('а',4*x*x-12*x+9),('б',1-14*a+49*a*a),('в',25+4*c*c+20*c)]:
    answer=parse_expr(q['731'+l]['answer'],transformations=standard_transformations+(implicit_multiplication_application,convert_xor))
    assert answer.is_Pow and answer.exp==2 and S.expand(answer-f)==0
for l,f in zip('абвгде',[(20-3)*(20+3),(10+F(1,2))*(10-F(1,2)),102*98,F('8.6')*F('7.4'),F(19,4)*F(21,4),F('2.7')*F('3.3')]):
    assert F(q['732'+l]['answer'])==f
print('PASS source pp. 170–171: all applications, physical integer constraints, 6 products, 3 binomial squares and 3 controls')
