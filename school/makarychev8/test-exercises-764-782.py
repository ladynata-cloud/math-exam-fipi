"""Independent Vieta identities for the printed exercises, including both signs and zero coefficients."""
import json,collections,re
from pathlib import Path
import sympy as z
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application,convert_xor
p,q,b,c,k,u,v,x=z.symbols('p q b c k u v x',real=True)
tasks=json.loads(Path(__file__).with_name('exercises-764-782.json').read_text())
cards={t['title']:t for t in tasks}
def form(a):return parse_expr(re.sub(r'√(\d+)',r'sqrt(\1)',a),local_dict={'p':p,'q':q,'b':b,'c':c,'k':k},transformations=standard_transformations+(implicit_multiplication_application,convert_xor))
def values(ref):return [form(vv) for vv in cards['№ '+ref]['answer'].split(';')]
def checkvals(ref,*expected):
 actual=values(ref);assert len(actual)==len(expected) and all(any(z.simplify(v-w)==0 for v in actual) for w in expected),ref
assert len(tasks)==29
for n,t in cards.items():
 number=int(re.search(r'№ (\d+)',n).group(1));assert t['source']['page']==(176 if number==764 else 177 if number<=780 else 178) and t['source']['paragraph']==7
for letter,B,C in [('а',-5*z.sqrt(2),12),('б',2*z.sqrt(3),-72),('в',-6,7),('г',-10,7)]:
 U,V=values('764'+letter);assert z.simplify(U+V+B)==z.simplify(U*V-C)==0
for letter,f,given in [('а',2*x*x+b*x-10,5),('б',3*x*x+b*x+24,3),('в',(b-1)*x*x-(b+1)*x-72,3),('г',(b-5)*x*x-(b-2)*x+b,z.Rational(1,2))]:
 par,*roots=values('765'+letter);assert z.solve(f.subs(x,given),b)==[par] and set(z.solve(f.subs(b,par),x))==set(roots)
assert z.discriminant(7*x*x+b*x-23,x)==b*b+644
assert z.expand(12*x*x+70*x+p*p+1-(12*x*x+70*x+(p*p+1)))==0
for l,f in [('а',2*x*x-41*x+39),('б',17*x*x+243*x-260)]:
 checkvals('768'+l,*z.solve(f,x));assert f.subs(x,1)==0
checkvals('769',*z.solve(b*b/9-4*z.Rational(10,3)-z.Rational(13,3)**2,b))
small=z.solve(4*x-z.Rational(12,5),x)[0];checkvals('770',5*3*small*small)
checkvals('771',*[8*r for r in z.solve(-3*x*x+z.Rational(27,4),x)])
checkvals('772',*z.solve(p*p-4*90-81,p))
S=z.Rational(5,2);diff=z.Rational(1,4)/S;checkvals('773',2*(S+diff)*(S-diff)/4)
assert z.solve([z.Rational(1,2)+c+b/4,c/2-c/4],[b,c])=={b:values('774')[0],c:values('774')[1]}
assert [(v[b],v[c]) for v in z.solve([b+c+b,b*c-c],[b,c],dict=True)if v[c]!=0]==[tuple(values('775'))]
assert z.expand(values('776')[0]-(p*p-2*q))==0
checkvals('777',z.solve(225-2*q-153,q)[0]);checkvals('778',*z.solve(p*p-4*405-144,p))
sol=z.solve([u+v+z.Rational(2,3),2*u+3*v],[u,v]);checkvals('779',3*sol[u]*sol[v])
sol=z.solve([u+v-8,3*u+4*v-29],[u,v]);checkvals('780',sol[u]*sol[v])
for ref,roots in [('781а',(3*u,3*v)),('781б',(u+2,v+2)),('782',(u/v,v/u))]:
 B,C=values(ref);BC=[vv.subs({p:-u-v,q:u*v})for vv in [B,C]]
 assert z.cancel(BC[0]+sum(roots))==z.cancel(BC[1]-roots[0]*roots[1])==0
print('PASS exact radical sum/product, degree and coefficient recovery, both signs, symbolic transformed equations and source pages')
