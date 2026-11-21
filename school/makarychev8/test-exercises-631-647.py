"""Check original denominators recursively before cancellation; compare with printed p. 310."""
import json
from pathlib import Path
import sympy as S
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application

d=Path(__file__).resolve().parent
new=json.loads((d/'exercises-631-647.json').read_text());prior=next(l['tasks'][:2] for l in json.loads((d/'ch3.json').read_text()) if l['id']=='p26')
q={t['source']['reference'][2:]:t for t in [*new,*prior]}
assert len(q)==84 and {int(k[:3]) for k in q}==set(range(631,648))
assert all(t['source']['page']==(148 if int(k[:3])<=633 else 149 if int(k[:3])<=638 else 150 if int(k[:3])<=643 else 151) for k,t in q.items())
def exact(s):
    return parse_expr(s.replace('√(','sqrt(').replace('√2','sqrt(2)').replace('√6','sqrt(6)').replace('√3','sqrt(3)'),transformations=standard_transformations+(implicit_multiplication_application,))
def values(s):return set() if s=='нет' else {S.simplify(exact(t)) for t in s.split(';')}
def algebra(ast,divisors):
    if isinstance(ast,str):return S.sympify(ast,rational=True)
    op,*children=ast;v=[algebra(c,divisors) for c in children]
    if op=='/':divisors.append(v[1])
    return {'neg':lambda:-v[0],'=':lambda:v[0]-v[1],'+':lambda:v[0]+v[1],'-':lambda:v[0]-v[1],'*':lambda:v[0]*v[1],'/':lambda:v[0]/v[1],'^':lambda:v[0]**v[1],'sqrt':lambda:S.sqrt(v[0])}[op]()
def same(actual,expected):return len(actual)==len(expected) and all(any(S.simplify(u-v)==0 for v in expected) for u in actual)
for ref,t in q.items():
    if 'excludedRoots' not in t:continue
    denominators=[];expr=algebra(t['mathExpression'],denominators);vars=expr.free_symbols.union(*(p.free_symbols for p in denominators));x=next(iter(vars))
    banned=set()
    for denominator in denominators:banned.update(S.solveset(denominator,x,domain=S.Reals))
    assert same(banned,values(t['excludedRoots'])),ref
    reduced=S.cancel(expr)
    numerator=S.fraction(reduced)[0]
    expected={z for z in S.solveset(numerator,x,domain=S.Reals) if z not in banned}
    assert same(values(t['answer']),expected),ref
    for z in expected:assert S.simplify(expr.subs(x,z))==0
printed={
 631:{'г':'1','д':'-27;-1','е':'-1/5','ж':'-1/2;1','з':'2/9','и':'0;1/6'},
 632:dict(zip('абвгдежз',['-25/2','3;4','6','-1;7/2','-2;4/3','-8;0','1;3/2','0;3/2'])),
 633:{'в':'2/11','г':'1;10','д':'-1;1','е':'1;2','ж':'-13/4;1','з':'-7/2;5'},
 634:dict(zip('абвгде',['3-sqrt(5);3+sqrt(5)','-6;5','-13/3','-9;1','нет','4'])),
 636:dict(zip('абвгде',['6','-3;2/3','нет','5','-6;6','-4;4'])),
 637:dict(zip('абвг',['2','1','-11','6'])),
 638:dict(zip('абвгде',['-3','-5/3;0','3','-3;3','9;13','4/3;7/3'])),
 639:dict(zip('абвг',['1;7','1-sqrt(14);1+sqrt(14)','(5-sqrt(17))/4;(5+sqrt(17))/4','-1/9;1'])),
 640:{'б':'(-1-sqrt(5))/2;(-1+sqrt(5))/2','в':'(7-3*sqrt(6))/10;(7+3*sqrt(6))/10'},
 641:{'а':'-sqrt(2);sqrt(2)','б':'-3;3'}}
for n,parts in printed.items():
    for part,answer in parts.items():assert same(values(q[str(n)+part]['answer']),values(answer)),(n,part)
for part in 'аб':
    t=q['641'+part];den=[];eq=algebra(t['mathExpression'],den);x=S.Symbol('x')
    for r in values(t['answer']):assert S.simplify(eq.subs(x,r))==0 and all(v.subs(x,r)!=0 for v in den)
for part in 'аб':
    build=q['642'+part+', построение'];read=q['642'+part+', корни по графику'];model=build['graph']
    hyper,line=model['curves'];xs=hyper['xs'];assert 0 not in xs and xs==line['xs']
    assert list(map(S.Rational,build['answer'].split(';')))==[S.Rational(6,x) for x in xs]+[line['k']*x+line['b'] for x in xs]
    x=S.Symbol('x');assert same(values(read['exactAnswers'][0]),set(S.solve(line['k']*x*x+line['b']*x-6,x)))
for ct in range(3):
    t=q[f'643, пример с {ct} корнями'];a,b=map(S.Rational,t['answer'].split(';'));x=S.Symbol('x')
    assert len(S.solveset(a*x**2+b*x-1,x,domain=S.Reals))==ct
assert S.simplify(((3+S.sqrt(5))-(3-S.sqrt(5)))**2)==int(q['644']['answer'])
for name,ab,ord in [('A',S.Rational(3,2),S.Rational(29,4)),('B',S.Rational(-16,5),9),('C',S.sqrt(3)-1,7)]:
    assert (q['645, точка '+name]['answer']=='Принадлежит')==(S.simplify(ab**2+2*ab+5-ord)==0)
u,v=S.symbols('u v',positive=True)
for key in ['646а','646б']:
    num=algebra(q[key]['mathExpression'],[]).subs({S.Symbol('x'):u*u,S.Symbol('y'):v*v})
    assert S.simplify(num-v)==0 and q[key]['answer']=='√y'
assert [q['647'+k]['answer'] for k in 'аб']==['Меньше нуля','Больше нуля']
print('PASS 84 source cards, original exclusions, selected published answer keys, nested denominators, reciprocal graphs and all parameter cases')
