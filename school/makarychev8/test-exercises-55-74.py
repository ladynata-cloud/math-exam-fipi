"""Separately transcribed source fixtures: Макарычев2024, printed pp20–23.
Exact algebra and domain tests derive expectations from the source expressions.
"""
import json,re,itertools
from pathlib import Path
from fractions import Fraction
import sympy as S
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application,rationalize
P=Path(__file__).resolve().parent
added=json.loads((P/'exercises-55-74.json').read_text());old=json.loads((P/'ch1.json').read_text())[2]['tasks'][:2]
T={t['id']:t for t in added};letters='абвгдежз';checks=0
loc={c:S.Symbol(c,real=True) for c in 'abcdmnpqxy'}
def parse(s):
 s=re.sub('[⁰¹²³⁴⁵⁶⁷⁸⁹]+',lambda m:'^'+''.join(str('⁰¹²³⁴⁵⁶⁷⁸⁹'.index(c)) for c in m[0]),str(s))
 return parse_expr(s.replace('^','**').replace('−','-').replace('·','*').replace(',','.'),local_dict=loc,transformations=standard_transformations+(implicit_multiplication_application,rationalize))
def ok(v,msg):
 global checks
 assert v,msg
 checks+=1
def eq(a,b,msg):ok(S.cancel(parse(a)-parse(b))==0,msg)
def task(n,p=''):return T[f'p03-ex{n:03d}-{p}']
def parts(raw):
 p=re.split(r' ([+-]) ',raw);return [a.split('/') for a in p[::2]],p[1::2]
def source(t,raw):
 terms,ops=parts(raw);matches=list(re.finditer(r'\{\{frac:([^:}]+):([^}]+)\}\}',t['prompt']))
 ok(len(matches)==len(terms),t['id']+' source fraction count')
 for m,(a,b) in zip(matches,terms):eq(m[1],a,t['id']+' source numerator');eq(m[2],b,t['id']+' source denominator')
 for i,op in enumerate(ops):ok(t['prompt'][matches[i].end():matches[i+1].start()].strip().replace('−','-')==op,t['id']+' source operation')
 expr=parse(terms[0][0])/parse(terms[0][1])
 for (a,b),op in zip(terms[1:],ops):expr+=(1 if op=='+' else -1)*parse(a)/parse(b)
 return expr,terms

def domain(t,denominators):
 if t['domain'].startswith('все действительные'):ok(all(not parse(d).free_symbols and parse(d)!=0 for d in denominators),'constant nonzero denominator');return
 constraints=[parse(a)-parse(b) for a,b in (v.strip().split('≠') for v in t['domain'].split(','))]
 den=[parse(x) for x in denominators];symbols=sorted(set().union(*(x.free_symbols for x in den)),key=str)
 values=[S.Rational(s) for s in ['-12','-8','-6','-5','-4','-3','-1','0','1/2','1','3','4','5','6','8','12']]
 if len(symbols)>2:values=[S.Rational(x) for x in ['-3','-1','0','1/2','1','3']]
 for vals in itertools.product(values,repeat=len(symbols)):
  sub=dict(zip(symbols,vals));ok(all(c.subs(sub)!=0 for c in constraints)==all(x.subs(sub)!=0 for x in den),t['id']+' original domain '+str(sub))
# Each term is numerator/denominator; spaced + or - separates fractions.
fixtures={
55:['x/3 + y/3','5b^2/a - 13b^2/a','x+y/9 - x/9','2c-x/b + x/b'],
56:['m/2p - m-p/2p','a+b/6 - a-2b/6','7y-13/10y - 2y+3/10y','8c+25/6c + 5-2c/6c'],
57:['2x-3y/4xy + 11y-2x/4xy','5a+b^5/8b - 5a-7b^5/8b','a-2/8a + 2a+5/8a - 3-a/8a','11a-2b/4a + 2a-3b/4a - a-b/4a'],
58:['17-12x/x - 10-x/x','12p-1/3p^2 - 1-3p/3p^2','6y-3/5y - y+2/5y','3p-q/5p - 2p+6q/5p + p-4q/5p','5c-2d/4c - 3d/4c + d-5c/4c','2a/b - 1-6a/b + 13-8a/b'],
59:['16/x-4 - x^2/x-4','25/a+5 - a^2/a+5','3a-1/a^2-b^2 - 3b-1/a^2-b^2','x-3/x^2-64 + 11/x^2-64','2a+b/(a-b)^2 - 2b-5a/(a-b)^2','13x+6y/(x+y)^2 - 11x+4y/(x+y)^2'],
63:['x/y-1 + 5/1-y','a/c-3 - 6/3-c','2m/m-n + 2n/n-m','5p/2q-p + 10q/p-2q','a^2+16/a-4 + 8a/4-a','x^2+9y^2/x-3y + 6xy/3y-x'],
64:['10p/p-q + 3p/q-p','5a/a-b + 5b/b-a','x-3/x-1 - 2/1-x','a/2a-b + 3a-b/b-2a','a/a^2-9 + 3/9-a^2','y^2/y-1 + 1/1-y'],
65:['3x+5/2x-1 + 7x+3/1-2x','5x+1/5x-20 + x+17/20-5x'],
66:['x^2/(x-5)^2 - 25/(5-x)^2','x^2+25/(x-5)^3 + 10x/(5-x)^3'],
67:['x^2/x^2-16 - 8(x-2)/x^2-16','64-2ab/(a-8)^2 + 2ab-a^2/(8-a)^2']}
for n,group in fixtures.items():
 for i,raw in enumerate(group):
  t=old[0] if (n,i)==(55,0) else old[1] if (n,i)==(56,0) else task(n,letters[i])
  expr,terms=source(t,raw);eq(t['answer'],str(expr),t['id']+' final result')
  if t in old:continue
  D=terms[0][1];steps=t['steps'];den=[d for _,d in terms];domain(t,den)
  if all(d==D for d in den):eq(steps[0]['answer'],D,t['id']+' common denominator')
  else:eq(steps[0]['answer'],str(parse(D)/parse(den[1])),t['id']+' sign change')
  N=S.cancel(expr*parse(D));eq(steps[1]['answer'],str(N),t['id']+' collected numerator')
  if len(steps)==3:eq(steps[2]['answer'],str(N),t['id']+' factored numerator')
# Proofs: verify the intermediate expansions and the checked proof line.
for p,D,op,k in [('а','ab','-',4),('б','a^2+b^2','+',2)]:
 t=task(60,p);expr,terms=source(t,f'(a+b)^2/{D} {op} (a-b)^2/{D}')
 eq(str(expr),str(k),'60 identity');eq(t['steps'][0]['answer'],'(a+b)^2','60 sum square');eq(t['steps'][1]['answer'],'(a-b)^2','60 difference square');eq(t['steps'][2]['answer'],str(expr*parse(D)),'60 numerator');eq(t['answer'],str(k*parse(D)),'60 proof line')
 if p=='а':domain(t,[D])
 else:
  ok(t['domain']=='a и b не равны нулю одновременно','60b domain statement')
  for a,b in itertools.product(range(-5,6),repeat=2):ok((a*a+b*b!=0)==(a!=0 or b!=0),'60b real domain')
# Numerical substitution after exact cancellation.
for p,raw,var,value in [('а','a^2-43/a-6 + 7/a-6','a',S.Rational(41,4)),('б','9b-1/b^2-9 - 6b-10/b^2-9','b',S.Rational(7,2))]:
 t=task(61,p);expr,terms=source(t,raw);domain(t,[d for _,d in terms]);ok(parse(t['answer'])==expr.subs(loc[var],value),t['id']+' substitution');D=parse(terms[0][1]);eq(t['steps'][0]['answer'],str(expr*D),'61 collected');eq(t['steps'][1]['answer'],str(expr*D),'61 factored');eq(t['steps'][2]['answer'],str(expr),'61 reduction')
 ok(('a=10,25' if p=='а' else 'b=3,5') in t['prompt'],'61 source substitution')
raw62='a^2-12b/a^2-3ab - 3ab-4a/a^2-3ab'
for label in ['значение','данные']:
 t=task(62,label);expr,terms=source(t,raw62);domain(t,[d for _,d in terms]);eq(str(expr),'(a+4)/a','62 identity');ok('a=−0,8' in t['prompt'] and 'b=−1,75' in t['prompt'],'62 source values')
 if label=='значение':
  ok(parse(t['answer'])==expr.subs({loc['a']:S.Rational(-4,5),loc['b']:S.Rational(-7,4)}),'62 value')
  for i,expected in enumerate(['a^2-3ab+4a-12b','a^2-3ab+4a-12b','a^2-3ab','(a+4)/a']):eq(t['steps'][i]['answer'],expected,'62 step'+str(i))
 else:eq(t['steps'][0]['answer'],str(expr),'62 data reduction');ok(t['steps'][1]['answer']=='a' and t['answer']=='b','62 redundant b')
# Split forms have two fractions. The unchanged original fraction must not be an accepted alias.
splitfixtures={68:[('a+b','x','a','b'),('2a^2+a','y','2a^2','a'),('x^2+6y^2','2xy','x^2','6y^2'),('12a+y^2','6ay','12a','y^2')],69:[('x^2+y^2','x^4','x^2','y^2'),('2x-y','b','2x','-y'),('a^2+1','2a','a^2','1'),('a^2-3ab','a^3','a^2','-3ab')]}
for n,group in splitfixtures.items():
 for i,(N,D,A,B) in enumerate(group):
  t=task(n,letters[i]);expr,_=source(t,N+'/'+D);domain(t,[D]);eq(t['answer'],str(expr),'split final');eq(t['steps'][0]['answer'],f'({A})/({D})','split first');eq(t['steps'][1]['answer'],f'({B})/({D})','split second')
  for v in [t['answer'],*t.get('accepts',[])]:ok(v.count('/')==2,'must remain two fractions '+t['id'])
# Natural/integer answers: exact divisibility establishes completeness, not a finite guess.
for label in ['преобразование','натуральные']:
 t=task(70,label);expr,_=source(t,'5n^2+3n+6/n');eq(str(expr),'5n+3+6/n','70 decomposition')
 if label=='преобразование':
  eq(t['answer'],str(expr),'70 form');eq(t['steps'][0]['answer'],'5n','70 first');eq(t['steps'][1]['answer'],'3','70 second');eq(t['steps'][2]['answer'],'6/n','70 third');ok(t['answer'].count('/')==1,'70 binomial plus fraction')
 else:
  eq(t['steps'][0]['answer'],str(expr),'70 proof decomposition');eq(t['steps'][1]['answer'],'6/n','70 only fractional part');eq(t['steps'][2]['answer'],'6','70 dividend');expected=set(S.divisors(6));ok({int(v) for v in t['answer'].split(';')}==expected,'70 all positive divisors')
  for n in range(1,201):ok((expr.subs(loc['n'],n).is_integer and expr.subs(loc['n'],n)>0)==(n in expected),'70 integer/positive check')
t=task(71);expr,_=source(t,'(m-1)(m+1)-10/m');eq(t['steps'][0]['answer'],'m^2-11','71 numerator');eq(t['steps'][1]['answer'],str(expr),'71 division');ok(t['steps'][2]['answer']=='также отрицательное','71 negative divisors included');expected={int(x*s) for x in S.divisors(11) for s in [-1,1]};ok({int(v) for v in t['answer'].split(';')}==expected,'71 complete divisor set')
for m in range(-200,201):
 if m:ok(expr.subs(loc['m'],m).is_integer==(m in expected),'71 integer check')
# Equations: separate transcription with decimal rationalisation.
equations=[('3(5x-4)-8x','4x+9'),('19x-8(x-3)','66-3x'),('0.2(0.7x-5)+0.02','1.4(x-1.6)'),('2.7(0.1x+3.2)+0.6(1.3-x)','16.02')]
for i,(L,R) in enumerate(equations):
 t=task(72,letters[i]);printed=t['prompt'].removeprefix('Реши уравнение ').removesuffix('.');a,b=printed.split('=');eq(a,L,'72 source L');eq(b,R,'72 source R');eq(t['steps'][0]['answer'],L,'72 expansion')
 diff=S.expand(parse(L)-parse(R));A=diff.coeff(loc['x']);B=-diff.subs(loc['x'],0);eq(t['steps'][1]['answer'],str(A),'72 collected coefficient');eq(t['steps'][2]['answer'],str(B),'72 collected constant');ok(diff.subs(loc['x'],parse(t['answer']))==0,'72 solution');ok(A!=0,'72 unique')
# Factorisation sources and both intermediate steps.
factors=['8x^4-16x^3y','15xy^5+10y^2','8a^2-50y^2','18b^2-98a^2','x^3-125','y^3+8','ab+8a+9b+72','6m-12-2n+mn']
for i,expr in enumerate(factors):
 t=task(73,letters[i]);eq(t['prompt'].split(': ',1)[1].rstrip('.'),expr,'73 source');eq(t['answer'],expr,'73 final')
 if i<4 or i>=6:eq('('+t['steps'][0]['answer']+')*('+t['steps'][1]['answer']+')',expr,'73 factors')
 else:
  root=int(t['steps'][0]['answer']);ok(root**3==(125 if i==4 else 8),'73 cube');first='x-5' if i==4 else 'y+2';eq('('+first+')*('+t['steps'][1]['answer']+')',expr,'73 cubic factors')
for p,N,D,var in [('а','3a','2a+25','a'),('б','2y','9+y^2','y'),('в','5x','3x(x+12)','x'),('г','7a','(a+1)(a-4)','a')]:
 t=task(74,p);source(t,N+'/'+D);roots=S.solveset(parse(D),loc[var],domain=S.Reals)
 if p=='б':ok(roots==S.EmptySet and t['answer']=='Все действительные','74 positive denominator');ok([s['answer'] for s in t['steps']]==['0','9'],'74 minima')
 else:ok({parse(x) for x in t['answer'].split(';')}==set(roots),'74 all excluded values')
# Every explicit symbolic alias must be equivalent to the checked line.
for t in added:
 for q in [t,*t['steps']]:
  if q['kind']=='text' and not re.search('[а-я≠;]',q['answer']):
   for alias in q.get('accepts',[]):eq(alias,q['answer'],t['id']+' alias')
counts=[4,4,4,6,6,2,2,2,6,6,2,2,2,4,4,2,1,4,8,4]
for n,c in enumerate(counts,55):ok(sum(int(re.search(r'№\s*(\d+)',t['source']['reference'])[1])==n for t in old+added)==c,'coverage '+str(n))
ok(len(added)==73 and len(T)==73,'73 appended cards')
print(json.dumps({'status':'PASS','checks':checks,'newCards':len(added),'sourceExercises':'55–74','sourceCards':75,'oracle':'separate source formulas, signs, every proof/step, exact substitutions/equations, domains, complete divisor sets and split forms'},ensure_ascii=False))
