"""Printed pp. 179–181. Re-evaluate original ASTs and their domains before simplifying."""
import json,re,collections
from pathlib import Path
import sympy as S
x,y=S.symbols('x y',real=True)
tasks=json.loads(Path(__file__).with_name('exercises-798-805.json').read_text())
def form(raw):return S.sympify(raw.replace('√','sqrt'))
def evaluate(t):
 if isinstance(t,str):return ({'x':x,'y':y}[t]if t in ['x','y']else S.Rational(t)),set()
 op=t[0];a,ban=evaluate(t[1])
 if op=='neg':return -a,ban
 if op=='sqrt':return S.sqrt(a),ban
 b,restricted=evaluate(t[2]);ban=ban|restricted
 if op=='/':
  var=next(iter(b.free_symbols),x)
  ban|={r for r in S.solve(b,var) if r.is_real and r not in restricted}
 return {'+':lambda:a+b,'-':lambda:a-b,'*':lambda:a*b,'/':lambda:a/b,'^':lambda:a**b,'=':lambda:a-b}[op](),ban
counts=collections.Counter(int(re.search(r'№ (\d+)',t['title'])[1])for t in tasks)
assert counts=={798:8,799:4,800:7,801:2,802:4,803:2,804:8,805:3}
for t in tasks:
 n=int(re.search(r'№ (\d+)',t['title'])[1]);g=t['graph'];assert t['source']['page']==(179 if n<=799 else 180 if n<=804 else 181)
 if g['type']=='graph-root-reading':
  for v in g['locations']:
   u,w=g['curves'];a=u['k']/abs(v)
   b=w['k']*v+w['b']if w['kind']=='line'else w['a']*v*v+w['b']*v+w['c']
   assert abs(a-b)<1e-10
  continue
 raw,excluded=evaluate(t['mathExpression']);var=next(iter(raw.free_symbols),x)
 if g['type']=='rational-intersections':
  if n==799:roots=S.solve(raw,var);direct=lambda z:0
  else:roots=S.solve(raw,var);direct=lambda z:evaluate(t['mathExpression'][1])[0].subs(var,z)
  valid={(str(v),str(direct(v)))for v in roots if v not in excluded}
  actual={(str(form(a)),str(form(b)))for a,b in re.findall(r'\(([^;]+);([^()]+)\)',t['answer'])}
  assert valid==actual,(t['id'],valid,actual)
 else:
  assert set(map(form,g['excluded']))==excluded,(t['id'],excluded)
  valid={v for v in S.solve(raw,var) if v.is_real and v not in excluded}
  actual=set()if t['answer']=='нет'else set(map(form,t['answer'].split(';')))
  assert len(valid)==len(actual)and all(any(S.simplify(v-w)==0 for w in actual)for v in valid),t['id']
  a,b,c=g['coefficients'];P=S.Poly(a*var**2+b*var+c,var)
  assert S.rem(S.fraction(S.cancel(raw,extension=True))[0],P.as_expr(),var)==0
print('PASS all 38 original equations, domains and graph points; all seven function levels and four absolute-reciprocal plots')
