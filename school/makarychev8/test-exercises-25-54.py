"""Separate transcription of pp14–18; exact algebra, all steps, domains and proofs.
The oracle computes from the source formulas, not the authored explanations.
"""
import json,re,itertools
from pathlib import Path
from fractions import Fraction
import sympy as S
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application,rationalize
P=Path(__file__).resolve().parent
added=json.loads((P/'exercises-25-54.json').read_text())
old=json.loads((P/'ch1.json').read_text())[1]['tasks'][:2]
T={t['id']:t for t in added}; checks=0
letters='абвгдежзик'
loc={c:S.Symbol(c,real=True) for c in 'abcdmnpqxyz'}
trans=standard_transformations+(implicit_multiplication_application,rationalize)
def parse(v):
 v=re.sub('[⁰¹²³⁴⁵⁶⁷⁸⁹]+',lambda m:'^'+''.join(str('⁰¹²³⁴⁵⁶⁷⁸⁹'.index(c)) for c in m[0]),v)
 return parse_expr(v.replace('−','-').replace('·','*').replace('^','**').replace(',','.'),local_dict=loc,transformations=trans)
def ok(v,msg):
 global checks
 assert v,msg
 checks+=1
def eq(a,b,msg):ok(S.cancel(parse(a)-parse(b))==0,msg)
def task(n,p=''):return T[f'p02-ex{n:03d}-{p}']
def source(t,N,D,quot=False):
 if quot:
  prompt=t['prompt'].split(': ',1)[1].rstrip('.'); a,b=prompt.split(' : ')
  eq(a,N,t['id']+' source dividend');eq(b,D,t['id']+' source divisor')
 else:
  m=re.search(r'\{\{frac:([^:}]+):([^}]+)\}\}',t['prompt']);ok(m is not None,t['id']+' source fraction')
  eq(m[1],N,t['id']+' source numerator');eq(m[2],D,t['id']+' source denominator')
def domain(t,D):
 constraints=[parse(a)-parse(b) for a,b in (v.strip().split('≠') for v in t['domain'].split(','))]
 expr=parse(D);variables=sorted(expr.free_symbols,key=str)
 # Include half-integers for 2b-1, and the larger source exclusions.
 samples=[S.Rational(x) for x in ['-12','-8','-5','-3','-2','-1','0','1/2','1','2','3','5','12']]
 if len(variables)>2:samples=[S.Rational(x) for x in ['-2','-1','0','1/2','1','2','3']]
 for vals in itertools.product(samples,repeat=len(variables)):
  sub=dict(zip(variables,vals));valid=all(c.subs(sub)!=0 for c in constraints)
  ok(valid==(expr.subs(sub)!=0),t['id']+' original domain '+str(sub))
# Every source numerator and denominator, including quotient forms. Independent of content generation.
fixtures={
25:'2x/3x|15x/25y|6a/24a|7ab/21bc|-2xy/5x^2y|8x^2y^2/24xy',
26:'10xz/15yz|6ab^2/9bc^2|2ay^3/-4a^2b|-6p^2q/-2q^3|24a^2c^2/36ac|63x^2y^3/42x^6y^4',
27:'4a^2b^3/2a^4b^2|3xy^2/6x^3y^3|24p^4q^4/48p^2q^2|36m^2n/18mn|-32b^5c/12b^4c^2|-6ax/-18ax',
28:'4a^2/6ac|7x^2y/21xy^2|56m^2n^5/35mn^5|25p^4q/100p^5q',
30:'a(b-2)/5(b-2)|3(x+4)/c(x+4)|ab(y+3)/a^2b(y+3)|15a(a-b)/20b(a-b)',
31:'3a+12b/6ab|15b-20c/10b|2a-4/3(a-2)|5x(y+2)/6y+12|a-3b/a^2-3ab|3x^2+15xy/x+5y',
32:'y^2-16/3y+12|5x-15y/x^2-9y^2|(c+2)^2/7c^2+14c|6cd-18c/(d-3)^2|a^2+10a+25/a^2-25|y^2-9/y^2-6y+9',
33:'a^2-ab+b^2/a^3+b^3|a^3-b^3/a-b|(a+b)^3/a^3+b^3|a^3-b^3/a^2-b^2',
35:'x^2-4x+4/x^2-2x|3y^2+24y/y^2+16y+64|a^2+a+1/a^3-1|b+2/b^3+8',
36:'9x^2-y^2/3x+y|2ab-a/4b^2-4b+1|x^2+2x+4/x^3-8|1+a^3/1+a',
37:'2x+bx-2y-by/7x-7y|8a+4b/2ab+b^2-2ad-bd|xy-x+y-y^2/x^2-y^2|a^2+2ac+c^2/a^2+ac-ax-cx',
40:'a-b/b-a|(a-b)^2/(b-a)^2|(a-b)^2/b-a|a-b/(b-a)^2|-a-b/a+b|(a+b)^2/(-a-b)^2|(-a-b)^2/a+b|a-b-c/b+c-a',
42:'a(x-2y)/b(2y-x)|5x(x-y)/x^3(y-x)|3a-36/12b-ab|7b-14b^2/42b^2-21b|25-a^2/3a-15|3-3x/x^2-2x+1|8b^2-8a^2/a^2-2ab+b^2|(b-2)^3/(2-b)^2',
43:'ax+bx-ay-by/bx-by|ab-3b-2a+6/15-5a',
44:'x^6+x^4/x^4+x^2|y^6-y^8/y^4-y^2|b^7-b^10/b^5-b^2|c^6-c^4/c^3-c^2',
46:'(2a-2b)^2/a-b|(3c+9d)^2/c+3d|(3x+6y)^2/5x+10y|4x^2-y^2/(10x+5y)^2'}
for n,rows in fixtures.items():
 for i,row in enumerate(rows.split('|')):
  N,D=row.split('/')
  t=old[0] if (n,i)==(25,0) else old[1] if (n,i)==(31,2) else task(n,letters[i])
  if t in old:
   eq(t['answer'],f'({N})/({D})',t['id']);continue
  source(t,N,D,n in [27,36]);eq(t['answer'],f'({N})/({D})',t['id']+' reduced answer');domain(t,D)
  steps=t['steps']
  if t['reduction']=='common-factor':
   F,A,B=[s['answer'] for s in steps];eq(f'({F})*({A})',N,t['id']+' numerator division');eq(f'({F})*({B})',D,t['id']+' denominator division')
  else:
   eq(steps[0]['answer'],N,t['id']+' numerator factorisation');eq(steps[1]['answer'],D,t['id']+' denominator factorisation')
# Power values and exponent steps.
for p,N,D,powers in [('а','8^16','16^12',[48,48,0]),('б','81^25','27^33',[100,99,1])]:
 t=task(29,p);source(t,N,D);eq(t['answer'],f'({N})/({D})',t['id']);ok([int(x['answer']) for x in t['steps']]==powers,'29 steps')
# Fixed substitutions, reconstructed directly from the printed values.
evals={34:[('15a^2-10ab','3ab-2b^2',{'a':-2,'b':S.Rational(-1,10)}),('9c^2-4d^2','18c^2d-12cd^2',{'c':S.Rational(2,3),'d':S.Rational(1,2)}),('6x^2+12xy','5xy+10y^2',{'x':S.Rational(2,3),'y':S.Rational(-2,5)}),('x^2+6xy+9y^2','4x^2+12xy',{'x':S.Rational(-1,5),'y':S.Rational(-3,5)})],45:[('a^8+a^5','a^5+a^2',{'a':S.Rational(-1,2)}),('b^10-b^8','b^8-b^6',{'b':S.Rational(-1,10)})]}
for n,rows in evals.items():
 for i,(N,D,sub) in enumerate(rows):
  t=task(n,letters[i]);source(t,N,D);sub={loc[k]:v for k,v in sub.items()};ok(parse(D).subs(sub)!=0,'valid substitution');ok(parse(t['answer'])==(parse(N)/parse(D)).subs(sub),t['id']+' value');domain(t,D)
  eq(t['steps'][0]['answer'],N,t['id']);eq(t['steps'][1]['answer'],D,t['id']);eq(t['steps'][2]['answer'],f'({N})/({D})',t['id'])
# Build both graph equations and retain every denominator zero.
for p,N,D in [('а','x^2-25','2x+10'),('б','x^3-9x','x^2-9')]:
 t=task(38,p);source(t,N,D);parts=[parse(v) for v in t['answer'].split(';')];k,b=parts[:2];excluded=parts[2:]
 eq(str(k*loc['x']+b),f'({N})/({D})',t['id']+' line');ok(set(excluded)==set(S.solve(parse(D),loc['x'])),'graph exclusions')
 ok({parse(x) for x in t['steps'][0]['answer'].split(';')}==set(excluded),'graph exclusion step');eq(t['steps'][1]['answer'],f'({N})/({D})','graph reduction');eq(t['steps'][2]['answer'],str(k),'graph k');eq(t['steps'][3]['answer'],str(b),'graph b')
for p,expected in [('а','1;4'),('б','2;3')]:ok(task(39,p)['answer']==expected,'39 signs')
t=task(41);source(t,'(1-x)^2','x-1');ok(t['answer']=='4','source figure2 option4');ok([s['answer'] for s in t['steps']]==['1','x-1','0'],'41 steps')
t=task(47);source(t,'a^2-4','12+a^2-a^4');domain(t,'12+a^2-a^4');ok(t['answer']=='Да','47 conclusion');eq(t['steps'][0]['answer'],'-1/3','47 example');eq(t['steps'][1]['answer'],'12+a^2-a^4','47 factoring');eq(t['steps'][2]['answer'],'(a^2-4)/(12+a^2-a^4)','47 reduction');ok(t['steps'][3]['answer']=='3','47 positive denominator bound')
n=S.Symbol('n',positive=True,integer=True);a=task(48,'а');b=task(48,'б')
ok(S.simplify((3**(n+2)-3**n)/(3**(n+2)+3**(n+1)+3**n))==S.Rational(a['answer']),'48a proof')
ok(S.simplify((16**(n+1)-2**(n+4))/(4*2**n*(2**(3*n)-1)))==S.Rational(b['answer']),'48b proof')
ok([x['answer'] for x in a['steps']]==['8','13','нет'],'48a proof steps');ok([x['answer'] for x in b['steps']]==['4n+4','2^(3n)-1','2','2'],'48b proof steps')
for i,(N,D) in enumerate([('5b','8a^3'),('7a','3b^2'),('1','2ab'),('2','a^2b^2')]):
 t=task(49,str(i+1));source(t,N,D);eq(t['answer']+'/(24a^3b^2)',f'({N})/({D})','49 fraction');eq(f'({D})*('+t['steps'][0]['answer']+')','24a^3b^2','49 multiplier');eq(t['steps'][1]['answer'],'24a^3b^2','49 denominator');domain(t,'24a^3b^2')
for i,D in enumerate(['b','5','3a','2a-b']):
 t=task(50,letters[i]);eq('('+t['answer']+')/('+D+')','2a+b','50 numerator');eq(t['steps'][0]['answer'],'1','50 initial denominator');eq(t['steps'][1]['answer'],D,'50 multiplier')
 if i!=1:domain(t,D)
for i,(N,D,newD) in enumerate([('x','a-b','(a-b)^2'),('y','x-a','x^2-a^2'),('a','a-10','10-a'),('p','p-2','4-p^2'),('mn','n-m','m^2-n^2')]):
 t=task(51,letters[i]);source(t,N,D);eq('('+t['answer']+')/('+newD+')',f'({N})/({D})','51 numerator');eq('('+D+')*('+t['steps'][0]['answer']+')',newD,'51 multiplier');domain(t,newD);ok(t['steps'][1]['answer']==t['domain'],'51 domain step')
for i,(a,b) in enumerate([('-5','16'),('2','1/5'),('1/3','4'),('4','-2'),('0.6','3'),('-0.7','5')]):
 t=task(52,letters[i]);eq(f'({a})*('+t['answer']+')',b,'52 equation');eq(t['steps'][0]['answer'],a,'52 divisor');ok(t['steps'][1]['answer']==('положительный' if parse(t['answer'])>0 else 'отрицательный'),'52 sign')
for i,expr in enumerate(['5bc-5c','10n+15n^2','8ab+12bc','5y-5x+y^2-xy','a^2-9','x^2+10x+25','y^2-2y+1','a^3+64','b^3-1']):
 t=task(53,letters[i]);eq(t['answer'],expr,'53 factoring');eq(t['steps'][1]['answer'],expr,'53 step2');ok(t['steps'][0]['answer']==['5c','5n','4b','y-x','3','5','1','4','1'][i],'53 step1')
for p,vals,reverse in [('а',[Fraction(5,16)/6,Fraction(5,16)/10,Fraction(5,16)*-7],False),('б',[Fraction('0.8')*Fraction('-0.4'),Fraction('0.8')/Fraction('-0.4'),Fraction('0.8')-Fraction('-0.4'),Fraction('0.8')+Fraction('-0.4')],True)]:
 t=task(54,p);ok([Fraction(s['answer']) for s in t['steps']]==vals,'54 values');ok([int(x) for x in t['answer'].split(';')]==sorted(range(1,len(vals)+1),key=lambda i:vals[i-1],reverse=reverse),'54 order')
# All explicit algebraic aliases must be the same expression; never trust normalization alone.
for t in added:
 for q in [t,*t['steps']]:
  if q['kind']=='text' and not re.search('[а-я≠;]',q['answer']):
   for alias in q.get('accepts',[]):eq(alias,q['answer'],t['id']+' algebraic alias')
counts=[6,6,6,4,2,4,6,6,4,4,4,4,4,2,2,8,1,8,2,4,2,4,1,2,4,4,5,6,9,2]
alltasks=old+added
for n,c in enumerate(counts,25):ok(sum(int(re.search(r'№\s*(\d+)',t['source']['reference'])[1])==n for t in alltasks)==c,'coverage '+str(n))
ok(len(added)==124,'124 new cards');ok(len(set(t['id'] for t in added))==124,'unique IDs')
print(json.dumps({'status':'PASS','checks':checks,'newCards':len(added),'sourceExercises':'25–54','coverage':'all126subparts (2previous)','oracle':'separate source fixtures, exact algebra, all steps, original/new domains, both proofs, graphs and aliases'},ensure_ascii=False))
