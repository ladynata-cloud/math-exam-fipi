"""Independently read printed polynomials, classify parameters and verify each lesson model."""
import json
from pathlib import Path
import sympy as s
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application,convert_xor
tasks=json.loads(Path(__file__).with_name('exercises-733-742.json').read_text())
x,p=s.symbols('x p',real=True)
printed={
 '733':p*x+2*x-3*p-6,'734-a':p*x-p-1,'734-b':p*x-3*x-4*p+12,
 '735':p*x-2*x-p**3+2*p**2+9*p-18,'736':2*x**2-4*x+p,
 '737-a':x**2-5*p*x+4*p**2,'737-b':3*x**2-10*p*x+3*p**2,
 '738-b':2*x**2-p*x+50,'738-c':p*x**2-6*x+1,'738-d':p*x**2+x-2,
 '739':x**2-p*x+p-3,'740':(p-1)*x**2+2*p*x+p+1,'741':x**2-(4*p+1)*x+2*(2*p**2+p-3)}
seen=set()
def parse(z,letter):
 return parse_expr(z,local_dict={letter:p},transformations=standard_transformations+(implicit_multiplication_application,convert_xor))
for t in tasks:
 tok=t['id'].removeprefix('p33-source-')
 key=next(key for key in printed if tok==key or tok.startswith(key+'-'))
 seen.add(key);f=printed[key];g=t['graph']
 raw=[sum(v*p**i for i,v in enumerate(row)) for row in g['coefficients']]
 assert s.expand(raw[0]*x**2+raw[1]*x+raw[2]-f)==0,t['id']
 assert t['source']['page']==(173 if key=='733'else 174)
 roots=t['answer'].split(';')
 if t['kind']=='parameter-formulas' and key!='736':
  for val in roots: assert s.simplify(f.subs(x,parse(val,g['symbol'])))==0,t['id']
 if key in ['738-b','738-c','738-d']:
  values=set(s.solve(s.discriminant(f,x),p))
  linear=s.solve(s.Poly(f,x).LC(),p)
  values.update(r for r in linear if s.degree(f.subs(p,r),x)==1)
  assert set(map(s.Rational,roots))==values
 elif key=='736':
  assert s.expand(2*((x-1)**2-(1-p/2))-f)==0
 elif key=='739':
  assert s.expand(s.discriminant(f,x)-((p-2)**2+8))==0
  assert s.expand(p**2-2*(p-3)-((p-1)**2+5))==0
  assert roots==['1','5']
assert seen==set(printed) and len(tasks)==20
historical=next(l for l in json.loads(Path(__file__).with_name('ch3.json').read_text())if l['id']=='p33')['tasks']
assert historical[0]['answer']=='-6;6' and set(s.solve(s.discriminant(3*x**2+p*x+3,x),p))=={-6,6}
assert historical[1]['answer']=='4' and s.solve(2*p-1-7,p)==[4] and s.discriminant(x*x-(2*p-1)*x+p*p-p-2,x)==9
print('PASS 20 new cases and two preserved originals, exact coefficients, factorizations, degree loss and minimum')
