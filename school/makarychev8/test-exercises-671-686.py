"""Check printed pp. 157–160 independently, including figures 26–29 and two errata."""
import json,re
from pathlib import Path
import sympy as S
d=Path(__file__).resolve().parent
prior=next(t for t in json.loads((d/'ch3.json').read_text()) if t['id']=='p28')['tasks'][:2]
rows=[*prior,*json.loads((d/'exercises-671-686.json').read_text())]
q={t['source']['reference'][2:]:t for t in rows}
assert len(q)==len(rows)==52
for ref,t in q.items():
    n=int(ref[:3])
    assert t['source']['page']==(157 if n<=673 else 158 if n<=679 else 159 if n<=681 else 160)
X,Y,N=S.symbols('x y n')
def exact(ast):
    if isinstance(ast,str):return S.sympify(ast,rational=True)
    op,*ch=ast;v=list(map(exact,ch))
    return {'=':lambda:v[0]-v[1], '+':lambda:sum(v),'-':lambda:v[0]-v[1],'neg':lambda:-v[0],'*':lambda:S.prod(v),'/':lambda:v[0]/v[1],'^':lambda:v[0]**v[1]}[op]()
def points(s):return [[tuple(map(S.Rational,m)) for m in re.findall(r'\(([^;()]+);([^;()]+)\)',group)]for group in s.split('|')]
for ref,t in q.items():
    n=int(ref[:3])
    if n==672:
        actual=points(t['answer'])[0];assert len(set(actual))==3
        form=exact(t['mathExpression'])
        assert all(form.subs({X:x,Y:y})==0 for x,y in actual),ref
    if n==673:assert S.Poly(exact(t['mathExpression']),X,Y).total_degree()==int(t['answer']),ref
    if t['kind']=='construct-lines':
        lines=[S.Rational(a)*X+S.Rational(b)*Y-S.Rational(c) for a,b,c in t['lines']]
        gs=points(t['answer'])
        assert all(len(set(g))==2 and all(f.subs({X:x,Y:y})==0 for x,y in g)for f,g in zip(lines,gs))
        if 'mathExpression' in t:
            quotient=S.cancel(exact(t['mathExpression'])/S.prod(lines))
            assert quotient!=0 and not quotient.free_symbols,ref
    if n==681:
        f=exact(t['mathExpression']);xs=t['graph']['curves'][0]['xs'];ys=t['answer'].split(';')
        assert len(xs)==len(ys) and all(f.subs({X:x,Y:int(y)})==0 for x,y in zip(xs,ys))
    if n==685:assert S.solveset(exact(t['mathExpression']),X,domain=S.Reals)=={S.Rational(t['answer'])}
fig26=[[1,-1,-2],[2,-1,4],[1,0,6],[0,1,-4]]
for l,expected in zip('abcd',['x − y = −2','2x − y = 4','x − 6 = 0','y + 4 = 0']):
    t=q['674, прямая '+l];assert t['graph']['lines']==fig26 and t['answer']==expected
assert q['678']['graph']['lines']==[[2,1,6]] and q['678']['answer']=='2x + y = 6'
figures=[(X-1)*(Y-1),(X-Y)*(X+1),(X+2)*(X-1),(Y+1)*(Y-2),(X-3)*(Y-3),(X+2)*(Y+2),(Y-2)*(Y+2),(X+2)*(X-4)]
for f,ref in zip(figures,[str(n)+a for n in [679,680] for a in 'абвг']):
    constructed=S.prod(a*X+b*Y-c for a,b,c in q[ref]['graph']['lines'])
    ratio=S.simplify(constructed/f);assert ratio!=0 and not ratio.free_symbols
for ref,form in [('683а',X*Y-2),('683б',X**2-Y**2-3)]:
    expected={(x,y) for x in range(-4,5) for y in range(-4,5) if form.subs({X:x,Y:y})==0}
    assert expected==set(points(q[ref]['answer'])[0])
errata={'686а':(X**2-1)/(6*X**2)/((X**2+X)/3),'686б':(16*N**2-1)/(N**2-2*N)/(8*N/(3*N-6)),
        '686в':(X-4)/(Y**2-X*Y)/((5*X-20)/(X**2-X*Y))}
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application,convert_xor
for ref,raw in errata.items():
    f=parse_expr(q[ref]['answer'],transformations=standard_transformations+(implicit_multiplication_application,convert_xor))
    assert S.cancel(raw-f)==0 and S.cancel(exact(q[ref]['mathExpression'])-f)==0
assert errata['686а'].subs(X,2)==S.Rational(1,16) and errata['686б'].subs(N,-1)==S.Rational(45,8)
print('PASS 52 source cards including figures 26–29, arbitrary pairs, negative cube, domains and corrected printed key.')
