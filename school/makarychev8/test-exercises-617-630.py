"""Source points 617–630, printed pp. 144–145, and answer samples on pp. 309–310."""
import json
from pathlib import Path
import sympy as S
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application
root=Path(__file__).resolve().parent
old=next(t['tasks'][:2] for t in json.loads((root/'ch3.json').read_text()) if t['id']=='p25')
cards=[*old,*json.loads((root/'exercises-617-630.json').read_text())]
num={t['source']['reference'][2:]:t for t in cards if t['source']['type']=='textbook'}
assert len(num)==45 and {int(r[:3]) for r in num}==set(range(617,631))
assert all(t['source']['page']==(144 if int(r[:3])<=625 else 145) for r,t in num.items())
reviews=[t for t in cards if t['source'].get('adaptation')]
assert len(reviews)==3 and all(t['source']['page']==145 and t['source']['type']=='authored' for t in reviews)
def read(s):
    return parse_expr(s.replace('²','^2').replace('^','**'),transformations=standard_transformations+(implicit_multiplication_application,))
def ast(n):
    if isinstance(n,str):return S.sympify(n,rational=True)
    op,*rest=n;v=list(map(ast,rest))
    return {'neg':lambda:-v[0],'=':lambda:v[0]-v[1],'+':lambda:v[0]+v[1],'-':lambda:v[0]-v[1],'*':lambda:v[0]*v[1],'/':lambda:v[0]/v[1],'^':lambda:v[0]**v[1]}[op]()
def vals(t):return [S.Rational(v) for v in t.split(';')]
x,z,y,t,a,b,m,n,p=S.symbols('x z y t a b m n p')
rows={
 617:[3*x*x-24*x+21,5*z*z+10*z-15,x*x/6+x/2+S.Rational(1,3),x*x-12*x+20,-y*y+16*y-15,-t*t-8*t+9,2*x*x-5*x+3,5*y*y+2*y-3,-2*n*n+5*n+7],
 618:[2*x*x-2*x+S.Rational(1,2),-9*x*x+12*x-4,16*a*a+24*a+9,m*m/4-2*m+4],
 619:[2*x*x+12*x-14,-m*m+5*m-6,3*x*x+5*x-2,6*x*x-13*x+6]}
for no,parts in rows.items():
    for suffix,poly in zip('абвгдежзи',parts):
        q=num[str(no)+suffix]
        if 'mathExpression' in q:assert S.expand(ast(q['mathExpression'])-poly)==0
        assert S.expand(read(q['answer'])-poly)==0
for suffix in 'аб':assert S.simplify(ast(num['620'+suffix]['mathExpression']))==0
for suffix,d in zip('абвг',[141,-31,5,0]):
    q=num['621'+suffix];assert S.discriminant(ast(q['mathExpression']))==d and (q['answer']=='Можно')==(d>=0)
assert num['622']['answer']=='Нельзя' and S.expand(S.discriminant(a*x*x+a*x+a,x)+3*a*a)==0
from itertools import permutations
valid=[c for c in permutations([1,2,3]) if c[1]*c[1]>=4*c[0]*c[2]]
assert set(valid)=={(1,3,2),(2,3,1)}
A,B,C,prod=num['623']['answer'].split(';');assert (int(A),int(B),int(C)) in valid and S.expand(read(prod))==int(A)*x*x+int(B)*x+int(C)
fractions={624:[(4*x+4,3*x*x+2*x-1),(2*a*a-5*a-3,3*a-9),(16-b*b,b*b-b-12),(2*y*y+7*y+3,y*y-9),(p*p-11*p+10,20+8*p-p*p),(3*x*x+16*x-12,10-13*x-3*x*x)],625:[(x*x-11*x+24,x*x-64),(2*y*y+9*y-5,4*y*y-1)]}
for no,parts in fractions.items():
    for suffix,(top,bottom) in zip('абвгде',parts):
        q=num[str(no)+suffix];v=next(iter(bottom.free_symbols))
        assert S.simplify(top/bottom-read(q['answer']))==0 and S.simplify(top/bottom-ast(q['mathExpression']))==0
        assert set(vals(q['steps'][0]['answer']))==set(S.solve(bottom,v))
        assert top.subs(v,vals(q['steps'][1]['answer'])[0])==0
for suffix,raw,inputs,printed in [('а',(36-x*x)/(6-7*x+x*x),[-9,-99,-999],['-3/10','-93/100','-993/1000']),('б',(4*x*x+8*x-32)/(4*x*x-16),[-1,5,10],['3','9/7','7/6'])]:
    q=num['626'+suffix];v=[raw.subs(x,z) for z in inputs]
    assert v==vals(q['answer'])==list(map(S.Rational,printed)) and S.simplify(raw-ast(q['mathExpression']))==0
assert num['627, первая функция']['answer']=='1;-4;нет' and num['627, вторая функция']['answer']=='1;-4;2'
assert S.factor(x*x-6*x+8)==(x-4)*(x-2)
for suffix,e in zip('абвг',[(x*x-1)/2-11*x-11,(x*x+x)/2-(8*x-7)/3,x-3-(1-x*x)/3,(2-x*x)/7-x/2]):
    q=num['628'+suffix]
    assert S.expand(e-ast(q['mathExpression']))==0 and set(vals(q['answer']))==set(S.solve(e,x))
for suffix,e in [('а',4*x*x-6*x+2*x*y-3*y),('б',4*a**3+2*b**3-2*a*a*b-4*a*b*b)]:
    q=num['629'+suffix];assert S.expand(e-ast(q['mathExpression']))==0 and S.expand(e-read(q['answer']))==0
    assert q['requiredFactors']==len(S.factor_list(e)[1])
xf=S.Rational(9,17);yf=S.Rational(429,170)
assert S.Rational(8,10)*xf+S.Rational(21,10)==yf==-S.Rational(9,10)*xf+3 and num['630']['answer']=='I'
assert vals(reviews[0]['answer'])==[0,1,2]
A,h,k=vals(reviews[1]['answer']);assert S.expand(A*(x-h)**2+k)==3*x*x+12*x+32
print('PASS 45 source cards and 3 section reviews, factor multiplicities, original domains, six numeric substitutions and graph holes')
