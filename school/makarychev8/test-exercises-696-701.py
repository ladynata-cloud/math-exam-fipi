"""Reconstruct both graphs and the condition in every subproblem from pp. 164–165."""
from pathlib import Path
import json,re
import sympy as S
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application,convert_xor
p=Path(__file__).resolve().parent
old=next(l['tasks'][:2] for l in json.loads((p/'ch3.json').read_text()) if l['id']=='p30')
cards={t['source']['reference'][2:]:t for t in [*old,*json.loads((p/'exercises-696-701.json').read_text())]}
assert len(cards)==28
for ref,t in cards.items():assert t['source']['page']==(164 if int(ref[:3])<700 else 165)
x,y,a,b,c=S.symbols('x y a b c')
for ref,pt in [('696а',(-2,1)),('696б',(1,-2))]:
    u,v=pt;assert (cards[ref]['answer']=='Да')==(u*u+v*v==5 and 6*u+5*v==-4)
def rule(g):
    kind=g['kind']
    if kind=='line':return g['k']*x+g['b']
    if kind=='cube':return x**3
    if kind=='hyperbola':return g['k']/x
    return g.get('a',1)*x**2+g.get('b',0)*x+g.get('c',0)
spec={'697, построение':[x*x,2*x+3],'698а, эскиз':[x**3,-12/x],'698б, эскиз':[x*x+8,12-x*x],
      '698в, эскиз':[x*x+1,3/x],'700а, построение':[-3/x],'700в, построение':[4*x*x-4],'700г, построение':[-2/x]}
for ref,exprs in spec.items():
    t=cards[ref];curves=t['graph']['curves']
    assert len(curves)==len(exprs) and all(S.cancel(rule(g)-f)==0 for f,g in zip(exprs,curves))
    table=[S.simplify(f.subs(x,u)) for f,g in zip(exprs,curves)for u in g['xs']]
    assert table==list(map(S.Rational,t['answer'].split(';')))
for part,ct in zip('абв',[0,2,1]):
    f,g=spec['698'+part+', эскиз'];poly=S.fraction(S.cancel(f-g))[0];assert S.Poly(poly,x).count_roots(-S.oo,S.oo)==ct
    assert int(cards['698'+part+', число решений']['answer'])==ct
def pairs(t):return {tuple(map(S.Rational,m))for m in re.findall(r'\(([^;()]+);([^;()]+)\)',t['answer'])}
assert pairs(cards['697, общие точки'])=={(u,u*u)for u in S.solve(x*x-2*x-3,x)}
assert pairs(cards['699, решения системы'])=={(u,v)for u in [-2,2]for v in [-3,3]}
for part,line in [('б',(0,3,1)),('д',(2,0,-1)),('е',(2,-2,5))]:
    t=cards['700'+part+', построение'];assert t['lines']==[list(line)]
    assert all(line[0]*u+line[1]*v==line[2] for u,v in pairs(t))
for part,f in [('а',(c-1+2*c+7-(6-3*c))/(12*c)),('б',(a-4*b-(2*a-6*b)-(3*a-b))/(2*a*b)),('в',(17*x-4*y+8*x+9*y-(11*x-16*y))/(21*x*y))]:
    ans=parse_expr(cards['701'+part]['answer'],transformations=standard_transformations+(implicit_multiplication_application,convert_xor))
    assert S.cancel(f-ans)==0
print('PASS 28 original course cards, every defining ordinate, graph families, all intersections and rational domains')
