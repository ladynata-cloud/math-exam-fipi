"""Compare elimination by resultants with every system, retain rational exclusions, and check the printed key."""
from pathlib import Path
import json,re
import sympy as S
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application
p=Path(__file__).resolve().parent
old=next(l['tasks'][:2] for l in json.loads((p/'ch3.json').read_text()) if l['id']=='p31')
new=json.loads((p/'exercises-702-718.json').read_text())
cards={t['source']['reference'][2:]:t for t in [*old,*new]}
assert len(cards)==55
for ref,t in cards.items():
    n=int(ref[:3]);assert t['source']['page']==(167 if n<=704 else 168 if n<=711 else 169)
x,y=S.symbols('x y',real=True)
def value(text):
    text=re.sub(r'√(\d+)',r'sqrt(\1)',text)
    return parse_expr(text.replace('√(','sqrt('),transformations=standard_transformations+(implicit_multiplication_application,))
def pairs(raw):return [] if raw=='нет' else [(value(a),value(b))for a,b in re.findall(r'\(([^;]+);([^,]+?)\)(?:,|$)',raw)]
def same(a,b):return len(a)==len(b) and all(any(S.simplify(u-p)==0 and S.simplify(v-q)==0 for p,q in b)for u,v in a)
for ref,t in cards.items():
    if t['kind']!='algebra-pairs':continue
    graph=t['graph'];source=[]
    for eq,poly in zip(graph['equations'],graph['terms']):
        a,b=eq.split('=');local={graph['symbols'][0]:x,graph['symbols'][1]:y}
        f=S.sympify(a,locals=local,rational=True)-S.sympify(b,locals=local,rational=True)
        n=S.cancel(f).as_numer_denom()[0];encoded=sum(S.Rational(c)*x**i*y**j for c,i,j in poly)
        quotient=S.cancel(n/encoded);assert quotient!=0 and not quotient.free_symbols,ref
        source.append(f)
    numer=[S.cancel(f).as_numer_denom()[0]for f in source]
    resultant=S.resultant(*numer,y);candidates=S.solveset(resultant,x,domain=S.Reals)
    expected=[]
    for xt in candidates:
        if graph['excludeZero'] and xt==0:continue
        vals=S.Reals
        for f in numer:vals=vals.intersect(S.solveset(f.subs(x,xt),y,domain=S.Reals))
        for yt in vals:
            if graph['excludeZero'] and yt==0:continue
            if all(S.simplify(f.subs({x:xt,y:yt}))==0 for f in source):expected.append((xt,yt))
    assert same(pairs(t['answer']),expected),ref
    for m in t['steps']:
        if m['kind']=='graph-values' and 'старший коэффициент положительным' in m['prompt']:
            coefficients=list(map(int,m['answer'].split(';')));assert next(k for k in coefficients if k)>0
printed={'702б':[(-4,-5),(6,5)],'704г':[(S.Rational(21,4),S.Rational(13,4))],'705в':[(3,-1)],
'706в':[(v,w) for v,w in [(-1,1),(1,1),(-S.sqrt(5)/3,S.Rational(1,3)),(S.sqrt(5)/3,S.Rational(1,3))]],
'709, аналитический способ':[(-2,0),(4,6)],'711а':[(15,10),(2,-3)],'711б':[(12,-6),(2,4)],
'711в':[(S.Rational(2,5),-S.Rational(1,5)),(-S.Rational(1,3),2)],'711г':[(6,2),(-1,-S.Rational(3,2))],
'712а':[(6,4),(S.Rational(8,3),S.Rational(16,9))],'712б':[(-5,0),(S.Rational(1,2),0),(0,-5)]}
for ref,answers in printed.items():assert same(pairs(cards[ref]['answer']),answers),ref
assert all(3*u*u-2*v!=1 for u,v in [(-32,-18),(-10,4)])
for ref,poly in [('716а, число решений',x**3-15*x),('716б, число решений',x*x-10)]:
    assert len(S.solveset(poly,x,domain=S.Reals))==int(cards[ref]['answer'])
for l,f in [('а',9*x*x-100),('б',2-7*x*x),('в',9*x*x-4),('г',-S.Rational(4,5)*x*x+3*x)]:
    assert {value(v)for v in cards['717'+l]['answer'].split(';')}==S.solveset(f,x,domain=S.Reals)
for l,ineq in [('а',-x*x-2*x+168>0),('б',15*x*x+x-2<0),('в',(x+14)/(3-2*x)<0),('г',(6-5*x)/(x+25)>0)]:
    intervals=[]
    for a,b in re.findall(r'\(([^;]+);([^)]*)\)',cards['718'+l]['answer']):
        z=lambda v:S.sympify(v.replace('∞','oo'));intervals.append(S.Interval.open(z(a),z(b)))
    assert S.Union(*intervals)==S.solve_univariate_inequality(ineq,x,relational=False),l
print('PASS exact resultants for all systems, rational exclusions, source-key discrepancies and all four strict inequalities')
