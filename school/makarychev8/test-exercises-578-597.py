"""Independent transcription of Vieta exercises on printed pp. 135–136 and selected results on p. 309."""
import json
from pathlib import Path
import sympy as sy
from fractions import Fraction as F

directory=Path(__file__).resolve().parent
src=json.loads((directory/'exercises-578-597.json').read_text())
base=next(t for t in json.loads((directory/'ch3.json').read_text()) if t['id']=='p23')['tasks'][:2]
by_ref={t['source']['reference'][2:]:t for t in [*src,*base]}
assert len(by_ref)==65 and {int(ref[:3]) for ref in by_ref}==set(range(578,598))
assert all(t['source']['page']==(135 if int(ref[:3])<=590 else 136) for ref,t in by_ref.items())
def pair(text):return [F(x) for x in text.split(';')]
def exact(s):
    return sy.parsing.sympy_parser.parse_expr(s.replace('√(','sqrt('),transformations=sy.parsing.sympy_parser.standard_transformations+(sy.parsing.sympy_parser.implicit_multiplication_application,))
def ast(x):
    if isinstance(x,str):return sy.sympify(x,rational=True)
    op,*children=x;v=list(map(ast,children))
    return {'neg':lambda:-v[0],'=':lambda:v[0]-v[1],'+':lambda:v[0]+v[1],'-':lambda:v[0]-v[1],'*':lambda:v[0]*v[1],'/':lambda:v[0]/v[1],'^':lambda:v[0]**v[1],'sqrt':lambda:sy.sqrt(v[0])}[op]()
source={
 578:[(1,-37,27),(1,41,-371),(1,-210,0),(1,0,-19),(2,-9,-10),(5,12,7),(-1,1,0),(3,0,-10)],
 579:[(1,-2,-9),(3,-4,-4),(2,7,-6),(2,9,8)],
 580:[(1,-15,-16),(1,-6,-11),(12,-4,-1),(1,0,-6),(5,-18,0),(2,0,-41)],
 581:[(1,-9,20),(1,11,-12),(1,1,-56),(1,-19,88)],
 582:[(1,16,63),(1,2,-48)]}
for n,rows in source.items():
    for suffix,(a,b,c) in zip('абвгдежз',rows):
        ref=f'{n}{suffix}';t=by_ref[ref];s,p=F(-b,a),F(c,a)
        if t.get('mathExpression'):
            eq=ast(t['mathExpression']);v=next(iter(eq.free_symbols))
            assert sy.Poly(eq,v).all_coeffs()==[a,b,c],ref
        if n==578:
            assert pair(t['answer'])==[s,p] and b*b>=4*a*c
        else:
            roots=[exact(v) for v in t['answer'].split(';')]
            assert len(roots)==2 and sy.simplify(sum(roots)-s)==0 and sy.simplify(sy.prod(roots)-p)==0,ref
        if n in (579,580):
            q=by_ref[ref+', проверка Виета'];assert pair(q['answer'])==[s,p];assert ast(t['mathExpression'])==ast(q['mathExpression'])
for n,known,coef,pub in [(583,7,(1,None,-35),'-5;-2'),(584,F('12.5'),(1,-13,None),'1/2;25/4'),(585,8,(5,None,24),'3/5;-43'),(586,F('5.3'),(10,-33,None),'-2;-106')]:
    other,param=pair(by_ref[str(n)]['answer']);a,b,c=tuple(param if k is None else k for k in coef)
    assert pair(pub)==[other,param] and known+other==F(-b,a) and known*other==F(c,a)
for ref,s,d,p in [(587,12,2,35),(588,-1,6,F(-35,4)),(589,-2,-6,-8)]:
    r,t=F(s+d,2),F(s-d,2);assert r*t==p==F(by_ref[str(ref)]['answer'])
    if ref==589:assert r*r-t*t==12
assert 3**2-2*F(by_ref['590']['answer'])==65
for k,(a,b,c) in zip('абвгде',[(1,7,-1),(1,-7,1),(5,17,16),(19,-23,5),(2,5*sy.sqrt(3),11),(11,-9,7-5*sy.sqrt(2))]):
    D=b*b-4*a*c
    assert by_ref['591'+k]['answer']==('Действительных корней нет' if D<0 else 'Разные знаки' if c/a<0 else 'Два положительных' if -b/a>0 else 'Два отрицательных')
for k in 'аб':
    q=by_ref['592'+k];poly=sy.Poly(ast(q['mathExpression']));a,b,c=poly.all_coeffs();assert a*c<0 and b*b-4*a*c>0
assert 25-2*F(by_ref['593а']['answer'])==35 and 25-4*F(by_ref['593а']['answer'])>0
candidate=F(40+125,15)
assert candidate==11 and 25-4*candidate<0 and by_ref['593б']['answer']=='Подходящего m нет'
assert pair(by_ref['593, сверка пары']['answer'])==[45,-19]
x=sy.Symbol('x')
left=[(3*x+1)**2]*3+[(3*x+4)**2,4*(x+3)**2,(6*x+3)**2]
right=[3*x+1,3*(x+1),(2*x-5)**2,4*(x+3),(2*x+6)**2,(x-4)**2]
for suffix,l,r in zip('абвгде',left,right):
    q=by_ref['594'+suffix];assert sy.expand(ast(q['mathExpression'])-l+r)==0
    if sy.expand(l-r)==0:assert q['answer']=='любое действительное x'
    else:assert set(pair(q['answer']))=={F(int(v.p),int(v.q)) for v in sy.solve(l-r,x)}
assert 8*15*F('6.8')**2/(2*17**2)==F(by_ref['595']['answer'])
assert (5+12+13)*15/5==int(by_ref['596']['answer'])
a,b=pair(by_ref['597']['answer']);assert b-a==14 and a*a+b*b==34**2
print('PASS 65 Vieta cards, source coefficients, radical pairs, reverse checks, proofs, domain of m and both geometric quantities')
