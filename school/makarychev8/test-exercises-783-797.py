"""Reconstruct the original two printed pages and check every trinomial and fraction."""
import json,re,collections
from pathlib import Path
import sympy as S
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application,convert_xor
x,m,n=S.symbols('x m n',real=True)
ts=json.loads(Path(__file__).with_name('exercises-783-797.json').read_text())
def expr(tree):
 if isinstance(tree,str):return {'x':x,'m':m,'n':n}.get(tree) if tree in ['x','m','n']else S.Rational(tree)
 op=tree[0];a=expr(tree[1])
 if op=='sqrt':return S.sqrt(a)
 if op=='neg':return -a
 b=expr(tree[2]);return {'+':lambda:a+b,'-':lambda:a-b,'*':lambda:a*b,'/':lambda:a/b,'^':lambda:a**b}[op]()
def num(raw):return parse_expr(re.sub(r'√(\d+)',r'sqrt(\1)',raw),transformations=standard_transformations+(implicit_multiplication_application,convert_xor))
printed={783:[x*x/6+2*x/3-2,x*x/2-x/3-S.Rational(1,4),-x*x+4*x-S.Rational(5,2),2*x*x/5-x+S.Rational(1,5)],786:[2*x*x-10*x+3,x*x/3+7*x-2,x*x/2+6*x+1,-x*x/2+x/3+S.Rational(1,2)],789:[2*x*x-3*x+7,-3*x*x+4*x-1,5*x*x-3*x,-4*x*x+8*x],790:[-x*x+20*x-103,x*x-16*x+65],791:[3*x*x-4*x+5,-3*x*x+12*x],793:[4*x*x/5-99*x/5-5,S.Rational(7,2)-S.Rational(10,3)*x+2*x*x/3,x*x+S.sqrt(2)*x-2,x*x-S.sqrt(6)*x+1]}
fracs=[(2*m*m-8)/(m*m+6*m+8),(2*m*m-5*m+2)/(m*n-2*n-3*m+6),(x+4)/(x-1)-(37*x-12)/(4*x*x-3*x-1),(x-1)/(x+2)-(1-x)/(x*x+3*x+2),(7*x-x*x)/(x+4)*(x*x-x-20)/(7-x),(x*x+11*x+30)/(3*x-15)/((x+5)/(x-5)),(2*x*x-7)/(x*x-3*x-4)-(x+1)/(x-4),(2+x-x*x)/(2-5*x+3*x*x)+10*x/(3*x-2)]
for t in ts:
 ref=t['source']['reference'];numb=int(re.search(r'№ (\d+)',ref).group(1));l=re.search(r'№ \d+([абвгде])',ref)
 assert t['source']['page']==(178 if numb<=791 else 179) and t['source']['section']=='additional-3' and t['source']['paragraph']==8
 if numb in printed:
  f=printed[numb]['абвгде'.index(l[1])];assert S.expand(expr(t['mathExpression'])-f)==0
  values=list(map(num,t['answer'].split(';')));a,b,c=S.Poly(f,x).all_coeffs()
  if numb==783:assert all(S.simplify(f.subs(x,z))==0 for z in values) and values[0]!=values[1]
  if numb==786:assert values==[b*b-4*a*c,-b/a,c/a] and values[0]>0
  if numb==789:A,H,K=values;assert S.expand(A*(x-H)**2+K-f)==0
  if numb in [790,791]:H,K=values;assert H==-b/(2*a) and K==f.subs(x,H)
  if numb==793:A,r,s=values;assert S.simplify(S.expand(A*(x-r)*(x-s)-f))==0
 elif numb in [796,797]:
  i='абвгде'.index(l[1])+(0 if numb==796 else 2);g=t['graph']
  assert S.cancel(expr(g['original'])-fracs[i])==S.cancel(expr(g['reduced'])-fracs[i])==0
  if i==5 and t['id'].endswith('domain'):assert set(map(num,t['answer'].split(';')))=={-5,5}
 elif numb==795:
  poly=m*x*x+(m-3)*x-3;assert S.factor(poly)==(x+1)*(m*x-3)
  if ref.endswith('остальные целые m'):assert t['answer']=='-1';continue
  p=int(ref.split('=')[1].replace('−','-'));assert set(map(num,t['answer'].split(';')))==set(S.solve(poly.subs(m,p),x))
assert len(ts)==49 and {int(re.search(r'№ (\d+)',t['title']).group(1))for t in ts}==set(range(783,798))
print('PASS 49 cases on printed pp. 178–179, all radicals, six integer parameter cases and eight original fraction expressions')
