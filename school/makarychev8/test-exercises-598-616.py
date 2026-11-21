"""Compare each numbered subpart with the 2024 source, printed pp. 139–141."""
import json
from pathlib import Path
import sympy as s
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

d=Path(__file__).resolve().parent
cards=json.loads((d/'exercises-598-616.json').read_text())
old=next(l['tasks'][:2] for l in json.loads((d/'ch3.json').read_text()) if l['id']=='p24')
q={t['source']['reference'][2:]:t for t in [*cards,*old]}
assert len(q)==57 and {int(k[:3]) for k in q}==set(range(598,617))
assert all(t['source']['page']==(139 if int(k[:3])<604 else 140 if int(k[:3])<614 else 141) for k,t in q.items())
assert all(t['source']['endPage']==141 for k,t in q.items() if k.startswith('613,'))
def select(text):
    return s.sympify(text.replace('^','**'),rational=True)
def ast(n):
    if isinstance(n,str):return select(n)
    op,*rest=n;v=list(map(ast,rest))
    return {'neg':lambda:-v[0],'=':lambda:v[0]-v[1],'+':lambda:v[0]+v[1],'-':lambda:v[0]-v[1],'*':lambda:v[0]*v[1],'/':lambda:v[0]/v[1],'^':lambda:v[0]**v[1]}[op]()
def roots(answer):
    if answer=='нет':return set()
    return {parse_expr(w.replace('√(','sqrt('),transformations=standard_transformations+(implicit_multiplication_application,)) for w in answer.split(';')}
def fields(t):return [s.Rational(i) for i in t.split(';')]
x,y,a,b,t=s.symbols('x y a b t')
raw={598:[x**3-3*x*x-4*x+12],599:[x*x-7*x,2*x-5,y**3-4*y,y**4-16],600:[x*x+1,x**3-27,-2*y**6-1,y**4+3*y**2+7],
     601:[x*x-6*x+7],602:[x*x+x-6,9*x*x-9*x+2,x*x/5+3*x-20,-2*x*x-x-s.Rational(1,8),x*x/10+s.Rational(2,5),-3*x*x/10+3*x/2],
     603:[10*x*x+5*x-5,-2*x*x+12*x-18,x*x-2*x-4,12*x*x-12],604:[5*x*x-8*x+3,9*x*x+6*x+1,-7*x*x+6*x-2,-x*x+5*x-3],
     605:[-4*x*x-4*x+3,4*x*x-4*x+3,9*x*x-12*x+4,9*x*x-12*x-4],
     607:[x*x-6*x-2,x*x+5*x+20,2*x*x-4*x+10,x*x/2+x-6],608:[x*x-10*x+10,x*x+3*x-1,3*x*x+6*x-3,x*x/4-x+2],
     609:[x*x-6*x+10,5*x*x-10*x+5,-x*x+20*x-100,-2*x*x+16*x-33,x*x-s.Rational(32,100)*x+s.Rational(256,10000),4*x*x+s.Rational(8,10)*x+2],
     611:[2*x*x-4*x+6],612:[x*x/3+2*x+4],614:[-5*t*t+50*t+20],615:[3*(x+4)**2-10*x-32,31*x+77-15*(x+1)**2],
     616:[a*b+3*b-5*a-15,2*x*y-y+8*x-4]}
for n,parts in raw.items():
    for i,f in enumerate(parts):
        ref=str(n)+('абвгде'[i] if len(parts)>1 else '');target=q[ref]
        if 'mathExpression' in target:assert s.expand(f-ast(target['mathExpression']))==0,ref
        var=next(iter(f.free_symbols))
        if n in [599,602,603,615]:
            assert roots(target['answer'])==set(s.solveset(f,var,domain=s.S.Reals)),ref
        if n==600:assert (target['answer']=='Есть')==bool(s.solveset(f,var,domain=s.S.Reals))
        if n in [604,605]:assert int(target['answer'])==len(s.solveset(f,var,domain=s.S.Reals))
        if n in [607,608]:
            A,h,k=fields(target['answer']);assert s.expand(A*(var-h)**2+k-f)==0
        if n==609:
            h,k=[s.Rational(st['answer']) for st in target['steps']]
            assert f.diff(x).subs(x,h)==0 and f.subs(x,h)==k
        if n in [611,612]:
            h,k=fields(target['answer']);assert f.diff(x).subs(x,h)==0 and f.subs(x,h)==k and f.diff(x,2)>0
        if n==614:assert f.subs(t,5)==s.Rational(target['answer']) and f.diff(t).subs(t,5)==0 and f.diff(t,2)<0
        if n==616:assert s.expand(select(target['answer'])-f)==0 and target['factorizedAnswer']
assert roots(q['598']['answer'])=={v for v in [-2,-1,0,2,3] if raw[598][0].subs(x,v)==0}
chosen=[i for i in [1,2,3-s.sqrt(2),-7+s.sqrt(2)] if s.simplify(raw[601][0].subs(x,i))==0]
assert chosen==[3-s.sqrt(2)] and q['601']['answer']=='3 − √2'
assert roots(q['606']['answer'])=={1,4} and s.expand(a*(x-1)*(x-4))==a*x*x-5*a*x+4*a
assert roots(q['609, взаимопроверка']['answer'])=={i+1 for i,f in enumerate(raw[609]) if s.discriminant(f,x)==0}
assert s.expand(ast(q['610, первый трёхчлен']['mathExpression'])-(x-3)**2)==2
assert s.expand(ast(q['610, второй трёхчлен']['mathExpression'])+(x-3)**2)==-2
area=select(q['613, модель площади']['answer']);assert s.expand(area-x*(6-x)/2)==0 and area.diff(x,2)<0
h=s.Rational(q['613, исследование']['answer']);assert area.diff(x).subs(x,h)==0 and 0<h<6
assert fields(q['613, максимальная площадь']['answer'])==[h,6-h,area.subs(x,h)]
print('PASS 57 cards, polynomial identities, strict and weak signs, all original roots, area and height extrema')
