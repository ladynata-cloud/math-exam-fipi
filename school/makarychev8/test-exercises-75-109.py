"""Independent source transcription and exact oracle, Макарычев 2024 pp25–29.

No authoring helper is imported. Original denominators are retained before any
cancellation; identities, domains, every algebraic step and aliases are checked.
"""
import itertools
import hashlib
import json
import re
from pathlib import Path
import sympy as S
from sympy.parsing.sympy_parser import (parse_expr, standard_transformations,
    implicit_multiplication_application, rationalize)

P=Path(__file__).resolve().parent
added=json.loads((P/'exercises-75-109.json').read_text())
T={t['id']:t for t in added};letters='абвгдежз';checks=0
loc={c:S.Symbol(c,real=True) for c in 'abcdmnpqstvxyz'}
def parse(raw,evaluate=True):
 raw=re.sub('[⁰¹²³⁴⁵⁶⁷⁸⁹]+',lambda m:'^'+''.join(str('⁰¹²³⁴⁵⁶⁷⁸⁹'.index(c)) for c in m[0]),str(raw))
 return parse_expr(raw.replace('^','**').replace('−','-').replace('·','*').replace(',','.'),local_dict=loc,
     transformations=standard_transformations+(implicit_multiplication_application,rationalize),evaluate=evaluate)
def ok(value,label):
 global checks
 assert value,label
 checks+=1
def eq(a,b,label):ok(S.cancel(parse(a)-parse(b))==0,label)
def task(n,part=''):return T[f'p04-ex{n:03d}-{part}']
def math_text(text):return re.sub(r'\{\{frac:([^:}]+):([^}]+)\}\}',lambda m:'('+m[1]+')/('+m[2]+')',text)
def expression_in_prompt(t,n):
 text=t['prompt']
 if n==89:text=text.split('выражения ',1)[1].removesuffix(' не зависит от y.')
 elif n==97:text=text.removeprefix('Упрости выражение ').split(' и найди его значение',1)[0]
 else:text=text.removeprefix('Представь в виде одной дроби: ').removesuffix('.')
 return math_text(text)
def original_denominators(source):
 tree=parse(source,evaluate=False)
 return [S.expand(power.base**(-power.exp)) for power in tree.atoms(S.Pow) if power.exp.is_Integer and power.exp<0]
def zero_factors(expressions):
 out=set()
 for e in expressions:
  for factor,_ in S.factor_list(e)[1]:
   symbols=sorted(factor.free_symbols,key=str)
   if len(symbols)==1 and S.solveset(factor,symbols[0],domain=S.Reals)==S.EmptySet:continue
   out.add(S.Poly(factor,*symbols).monic().as_expr())
 return out
def domain(t,source):
 required=zero_factors(original_denominators(source))
 claimed=[] if t['domain'].startswith('все действительные') else [parse(left)-parse(right) for left,right in (x.strip().split('≠') for x in t['domain'].split(','))]
 ok(zero_factors(claimed)==required,t['id']+' exact original-domain factors')
def generic(t,source,n):
 E=parse(source);den=original_denominators(source);D=S.lcm(den) if den else S.Integer(1)
 eq(expression_in_prompt(t,n),source,t['id']+' printed source')
 eq(t['steps'][0]['answer'],str(D),t['id']+' least common denominator')
 N=S.cancel(E*D);ok(S.denom(N)==1,t['id']+' common numerator is polynomial')
 eq(t['steps'][1]['answer'],str(N),t['id']+' full numerator with subtraction signs')
 for step in t['steps'][2:]:
  eq(step['answer'],str(E if 'Сократи полученную дробь' in step['prompt'] else N),t['id']+' subsequent algebraic step')
 domain(t,source)
 if n==97:
  ok('x=−1,5' in t['prompt'],t['id']+' source substitution')
  ok(all(d.subs(loc['x'],S.Rational(-3,2))!=0 for d in den),t['id']+' substitution is permitted')
  eq(t['answer'],str(E.subs(loc['x'],S.Rational(-3,2))),t['id']+' exact value')
 else:eq(t['answer'],source,t['id']+' final answer')
 # Independent rational evaluation probes catch sign, grouping and variable drift.
 symbols=sorted(E.free_symbols,key=str)
 for offset in range(-4,5):
  sub={symbol:S.Rational(offset+2*i,2) for i,symbol in enumerate(symbols)}
  if all(d.subs(sub)!=0 for d in den) and n!=97:
   ok(S.cancel(parse(t['answer']).subs(sub)-E.subs(sub))==0,t['id']+' rational substitution')

# A second transcription, using complete parenthesised mathematical expressions.
fixtures={
75:['x/2+y/3','c/4-d/12','a/b-b^2/a','3/(2*x)-2/(3*x)','5*x/(8*y)+x/(4*y)','17*y/(24*c)-25*y/(36*c)','1/(5*a)-8/(25*a)','3*b/(4*c)+c/(2*b)'],
76:['(5*y-3)/(6*y)+(y+2)/(4*y)','(3*x+5)/(35*x)+(x-3)/(21*x)','(b+2)/(15*b)-(3*c-5)/(45*c)','(8*b+y)/(40*b)-(6*y+b)/(30*y)'],
77:['(15*a-b)/(12*a)-(a-4*b)/(9*a)','(7*x+4)/(8*y)-(3*x-1)/(6*y)'],
78:['b/a^2-1/a','(1-x)/x^3+1/x^2','1/(2*a^7)+(4-2*a^3)/a^10','(a+b)/a^2+(a-b)/(a*b)','(2*a-3*b)/(a^2*b)-(4*a-5*b)/(a*b^2)','(x-2*y)/(x*y^2)-(2*y-x)/(x^2*y)'],
79:['(2*x*y-1)/(4*x^3)-(3*y-x)/(6*x^2)','(1-b^2)/(3*a*b)+(2*b^3-1)/(6*a*b^2)','1/(3*a^3)-2/(5*a^5)','b^2/(6*x^5)-b/(3*x^6)'],
80:['1/(a*b)+1/(a*c)+1/(b*c)','(a*b-b)/a-(a*b-a)/b-(a^2-b^2)/(a*b)','(b-a)/(a*b)+(c-b)/(b*c)-(c-a)/(a*c)','(3*a*b+2*b^2)/(a*b)-(a+2*b)/a+(a-2*b)/b'],
81:['(x-y)/(x*y)-(x-z)/(x*z)','(a-2*b)/(3*b)-(b-2*a)/(3*a)','(p-q)/(p^3*q^2)-(p+q)/(p^2*q^3)','(3*m-n)/(3*m^2*n)-(2*n-m)/(2*m*n^2)'],
82:['x+1/y','1/a-a','3*a-a/4','5*b-2/b','(a^2+b)/a-a','2*p-(4*p^2+1)/(2*p)','(a-b)^2/(2*a)+b','c-(b+c)^2/(2*b)'],
83:['5-c/2','5*y^2-(15*y^2-1)/3','a+b-(a-3)/3','(2*b^2-1)/b-b+5'],
84:['1-a/5-b/4','12-1/a-1/b','(a-2)/2-1-(a-3)/3','4*a-(a-1)/4-(a+2)/3','(a+b)/4-a+b','a+b-(a^2+b^2)/a'],
85:['x-(x-y)/2+(x+y)/4','3/x-2-5/x','3-(2*x-y)/4+(x+4*y)/12','(6*a-4*b)/5-(b+7*a)/3-2'],
86:['(b-c)/b+b/(b+c)','(x+1)/(x-2)-(x+3)/x','m/(m-n)-n/(m+n)','2*a/(2*a-1)-1/(2*a+1)','a/(a+2)-a/(a-2)','p/(3*p-1)-p/(1+3*p)'],
87:['3*x/(5*(x+y))-2*y/(3*(x+y))','a^2/(5*(a-b))-b^2/(4*(a-b))','3/(a*x-a*y)+2/(b*y-b*x)','13*c/(b*m-b*n)-12*b/(c*n-c*m)'],
88:['p/(2*x+1)-p/(3*x-2)','6*a/(x-2*y)+2*a/(x+y)','a/(5*x-10)+a/(6*x-12)','5*b/(12*a-36)-b/(48-16*a)'],
89:['(5*y+3)/(2*y+2)-(7*y+4)/(3*y+3)','(11*y+13)/(3*y-3)+(15*y+17)/(4-4*y)'],
90:['a^2/(a*x-x^2)+x/(x-a)','(b^2-4*b*y)/(2*y^2-b*y)-4*y/(b-2*y)'],
91:['1/(a^2+a*b)+1/(a*b+b^2)','1/(b^2-a*b)-1/(a*b-a^2)'],
92:['1-(a+b)/(a-b)','(a^2+b^2)/(a-b)-a','m-n+n^2/(m+n)','a+b-(a^2+b^2)/(a+b)','x-9/(x-3)-3','a^2-(a^4+1)/(a^2-1)+1'],
93:['(a^2+3*a)/(a*b-5*b+8*a-40)-a/(b+8)','y/(3*x-2)-3*y/(6*x*y+9*x-4*y-6)'],
94:['c/(b-c)+(b^2-3*b*c)/(b^2-c^2)','(a+3)/(a^2-1)-1/(a^2+a)'],
95:['(b-6)/(4-b^2)+2/(2*b-b^2)','b/(a*b-5*a^2)-(15*b-25*a)/(b^2-25*a^2)','(x-12*a)/(x^2-16*a^2)-4*a/(4*a*x-x^2)','(a-30*y)/(a^2-100*y^2)-10*y/(10*a*y-a^2)'],
96:['(a+4)/(a^2-2*a)-a/(a^2-4)','(4-x^2)/(16-x^2)-(x+1)/(x+4)','(a+b)^2/(a^2+a*b)+(a-b)^2/(a^2-a*b)','(x^2-4)/(5*x-10)-(x^2+4*x+4)/(5*x+10)'],
97:['(x+1)/(x^2-x)-(x+2)/(x^2-1)','(x+2)/(x^2+3*x)-(1+x)/(x^2-9)'],
98:['4/(y+2)-3/(y-2)+12/(y^2-4)','a/(a-6)-3/(a+6)+a^2/(36-a^2)','x^2/(x-y)^2-(x+y)/(2*x-2*y)','b/(a-b)^2-(a+b)/(b^2-a*b)'],
99:['(2*a+b)/(2*a^2-a*b)-16*a/(4*a^2-b^2)-(2*a-b)/(2*a^2+a*b)','1/(a-3)^2-2/(a^2-9)+1/(a+3)^2','(x-2)/(x^2+2*x+4)-6*x/(x^3-8)+1/(x-2)','(2*a^2+7*a+3)/(a^3-1)-(1-2*a)/(a^2+a+1)-3/(a-1)'],
100:['1/(a-4*b)-1/(a+4*b)-2*a/(16*b^2-a^2)','1/(2*b-2*a)+1/(2*b+2*a)+a^2/(a^2*b-b^3)'],
}
old=json.loads((P/'ch1.json').read_text())[3]['tasks'][:2]
for n,group in fixtures.items():
 for index,source in enumerate(group):
  if n==75 and index in [0,3]:
   t=old[0 if index==0 else 1];eq(t['answer'],source,t['id']+' retained source');continue
  generic(task(n,letters[index]),source,n)

# Identities: both sides are checked independently, including intermediate proof lines.
for part,L,R in [('а','3/(a^2-3*a)+a^2/(a-3)','a+3+(9*a+3)/(a^2-3*a)'),('б','a^3/(a^2-4)-a/(a-2)-2/(a+2)','a-1')]:
 t=task(101,part);eq(L,R,'101 identity '+part);eq(t['answer'],L,t['id']+' common result');domain(t,L)
 printed_left,printed_right=t['prompt'].split('выражения ',1)[1].removesuffix('.').split(' и ')
 eq(math_text(printed_left),L,'101 source left');eq(math_text(printed_right),R,'101 source right')
 den=S.lcm(original_denominators(L));eq(t['steps'][0]['answer'],str(den),'101 common denominator');eq(t['steps'][1]['answer'],str(S.cancel(parse(L)*den)),'101 numerator')
 for q in t['steps'][2:]:eq(q['answer'],R if 'Какое выражение' in q['prompt'] else str(S.cancel(parse(L)*den)),'101 proof step')
 ok('тождественно равны' in t['prompt'],'101 proof requested')
for part,L,expected,v,excluded in [('а','(x^3+3*x)/(x+2)-(3*x^2-14*x+16)/(x^2-4)+2*x','x^2+4','x',{-2,2}),('б','y+(2*y^2+3*y+1)/(y^2-1)-(y^3+2*y)/(y-1)','-y^2-1','y',{-1,1})]:
 t=task(102,part);eq(L,expected,'102 exact reduced expression');domain(t,L)
 printed=t['prompt'].split('выражение ',1)[1].removesuffix(' положительно.').removesuffix(' отрицательно.')
 eq(math_text(printed),L,'102 source expression')
 D=S.lcm(original_denominators(L));eq(t['steps'][0]['answer'],str(D),'102 denominator');eq(t['steps'][1]['answer'],str(S.cancel(parse(L)*D)),'102 numerator')
 for q in t['steps'][2:-2]:eq(q['answer'],str(S.cancel(parse(L)*D)),'102 factorisation')
 eq(t['steps'][-2]['answer'],expected,'102 reduction');eq(t['steps'][-1]['answer'],'0','102 square minimum')
 eq(t['answer'],'4' if part=='а' else '-1','102 strict sign bound')
 ok(parse(expected).subs(loc[v],0)==parse(t['answer']) and 0 not in excluded,'102 attained strict bound')
 d=task(102,'ОДЗ-'+part);ok({parse(a) for a in d['answer'].split(';')}==excluded,'102 complete excluded roots')
 ok({parse(q['answer']) for q in d['steps']}==excluded,'102 excluded-root steps')
ok(task(102,'зачем-ОДЗ')['answer']=='В исходных дробях нельзя делить на ноль.','102 reason for domain')

# The misleading answer in103 is not an identity; the other three really are.
orig='(x^2+7*x-25)/(x-5)';options=['x+5+7*x/(x-5)','x+12+35/(x-5)','-x+(2*x-25)/(x-5)','x+(12*x-25)/(x-5)']
t=task(103)
for i,value in enumerate(options):ok((S.cancel(parse(value)-parse(orig))==0)==(i!=2),'103 option '+str(i+1))
for i,value in enumerate(t['choices']):eq(math_text(value.split('. ',1)[1]),options[i],'103 source option '+str(i+1))
match=re.search(r'\{\{frac:([^:}]+):([^}]+)\}\}',t['prompt']);eq('('+match[1]+')/('+match[2]+')',orig,'103 original source fraction')
ok(t['answer']==t['choices'][2],'103 incorrect third answer');eq(t['steps'][0]['answer'],'-x^2+7*x-25','103 numerator');eq(t['steps'][1]['answer'],'-2*x^2','103 discrepancy')

t=task(104,'тождество');L='1/(x+n)-1/(x+n+1)';R='1/((x+n)*(x+n+1))';eq(L,R,'104 identity');domain(t,L);eq(t['steps'][0]['answer'],'(x+n)*(x+n+1)','104 denominator');eq(t['steps'][1]['answer'],'1','104 numerator');eq(t['answer'],'1','104 proof')
printed_left,printed_right=math_text(t['prompt'].removeprefix('Докажи тождество ').removesuffix('.')).split(' = ');eq(printed_left,L,'104 source left');eq(printed_right,R,'104 source right')
t=task(104,'сумма');L='1/((x+1)*(x+2))+1/((x+2)*(x+3))+1/((x+3)*(x+4))';eq(t['answer'],L,'104 sum');domain(t,L)
eq(math_text(t['prompt'].split(', упрости ',1)[1].removesuffix('.')),L,'104 source sum')
eq(t['steps'][0]['answer'],'1/((x+1)*(x+2))','104 first telescoping term');eq(t['steps'][1]['answer'],L,'104 telescoping cancellation');eq(t['steps'][2]['answer'],'3','104 final numerator')
ok(zero_factors(original_denominators(L))=={loc['x']+1,loc['x']+2,loc['x']+3,loc['x']+4},'104 cancelled exclusions survive')

boat='s/(v+5)+s/(v-5)';walk='s/v+2*s/(v-2)'
t=task(105,'формула');eq(t['answer'],boat,'105 round trip');eq(t['steps'][0]['answer'],'v+5','105 downstream');eq(t['steps'][1]['answer'],'v-5','105 upstream');eq(t['steps'][2]['answer'],boat,'105 time sum');ok(t['domain']=='s>0, v>5','105 physical domain')
for part,distance,speed in [('а',50,25),('б',105,40)]:
 t=task(105,part);a=S.Rational(distance,speed+5);b=S.Rational(distance,speed-5)
 eq(t['steps'][0]['answer'],str(a),'105 leg1');eq(t['steps'][1]['answer'],str(b),'105 leg2');eq(t['answer'],str(a+b),'105 total');ok(str(distance) in t['prompt'] and str(speed) in t['prompt'],'105 source values')
t=task(106,'формула');eq(t['answer'],walk,'106 total');eq(t['steps'][0]['answer'],'2*s','106 longer path');eq(t['steps'][1]['answer'],'v-2','106 slower speed');eq(t['steps'][2]['answer'],walk,'106 time sum');ok(t['domain']=='s>0, v>2','106 positive speed')
t=task(106,'значение');eq(t['steps'][0]['answer'],'10/6','106 highway');eq(t['steps'][1]['answer'],'20/4','106 path');eq(t['answer'],'10/6+20/4','106 total value')
for value in [-2,0,16]:
 t=task(107,'x='+str(value));eq(t['steps'][0]['answer'],str(2*value),'107 twice x');eq(t['steps'][1]['answer'],str(2*value-5),'107 numerator');eq(t['answer'],str(S.Rational(2*value-5,3)),'107 function value')
 match=re.search(r'\{\{frac:([^:}]+):([^}]+)\}\}',t['prompt']);eq('('+match[1]+')/('+match[2]+')','(2*x-5)/3','107 source function');ok('x='+str(value) in t['prompt'],'107 source x')
for value in [3,0,-9]:
 t=task(107,'y='+str(value));eq(t['steps'][0]['answer'],str(3*value),'107 clearing denominator');eq(t['steps'][1]['answer'],str(3*value+5),'107 transfer');ok((2*parse(t['answer'])-5)/3==value,'107 inverse substitution')
 match=re.search(r'\{\{frac:([^:}]+):([^}]+)\}\}',t['prompt']);eq('('+match[1]+')/('+match[2]+')','(2*x-5)/3','107 source inverse function');ok('равно '+str(value)+'?' in t['prompt'],'107 source y')

t=task(108,'графики');ok(list(map(parse,t['answer'].split(';')))==[-4,1,2,-3],'108 source coefficients');ok([parse(q['answer']) for q in t['steps']]==[-4,1,2,-3],'108 line construction steps')
ok('y=−4x+1' in t['prompt'] and 'y=2x−3' in t['prompt'],'108 source graph functions')
t=task(108,'пересечение');point=list(map(parse,t['answer'].strip('()').split(';')));x,y=point
ok(y==-4*x+1==2*x-3,'108 both line equations');ok(-4!=2,'108 unique intersection');ok([parse(q['answer']) for q in t['steps']]==[4,x,y],'108 algebraic solution');ok(t['graph']['lines']==[[-4,1],[2,-3]],'108 displayed source lines')
t=task(109);eq(t['steps'][0]['answer'],'3*x','109 first withdrawal');eq(t['steps'][1]['answer'],'90-3*x','109 first remainder');L,R=t['steps'][2]['answer'].split('=');eq(L,'2*(90-3*x)','109 double first remainder');eq(R,'75-x','109 second remainder');x=parse(t['steps'][3]['answer']);ok(2*(90-3*x)==75-x and 0<=x<=30,'109 unique feasible withdrawal');ok(parse(t['answer'])==3*x==63,'109 requested first mass')

# Every advertised algebraic alias is exact; no shortcut silently accepts a sum
# when the question explicitly requires one fraction.
for t in added:
 for q in [t,*t['steps']]:
  if q['kind']=='text' and not re.search('[а-я≠;=]',q['answer']):
   for alias in q.get('accepts',[]):eq(alias,q['answer'],t['id']+' equivalent alias')
 if t.get('operation')=='common-denominator':
  if t['kind']=='text':
   for value in [t['answer'],*t.get('accepts',[])]:
    tree=parse(value,evaluate=False)
    ok(not isinstance(tree,S.Add) or all(not part.atoms(S.Pow) or all(power.exp>=0 for power in part.atoms(S.Pow)) for part in tree.args),t['id']+' requested single fraction')

counts=[8,4,2,6,4,4,4,8,4,6,4,6,4,4,2,2,2,6,2,2,4,4,2,4,4,2,2,5,1,2,3,2,6,2,1]
for n,count in enumerate(counts,75):
 group=[t for t in old+added if int(re.search(r'№\s*(\d+)',t['source']['reference'])[1])==n]
 ok(len(group)==count,'complete source subparts №'+str(n))
 expected_page=25 if n<=81 else 26 if n<=88 else 27 if n<=97 else 28 if n<=102 else 29
 ok(all(t['source']['page']==expected_page for t in group),'printed page №'+str(n))
ok(len(added)==126 and len(T)==126,'126 appended unique cards')
# Immutable snapshot of all596 prior task objects, grouped in their public
# lesson/index order at task base8448cce. This is not the new-answer oracle.
prior=sorted(sum([json.loads((P/name).read_text()) for name in ['ch1.json','ch2.json','ch3.json','ch4-6.json']],[]),key=lambda lesson:lesson['order'])
for i,name in enumerate(['exercises-1-24.json','exercises-25-54.json','exercises-55-74.json']):prior[i]['tasks']+=json.loads((P/name).read_text())
previous=[lesson['tasks'] for lesson in prior]
ok(sum(map(len,previous))==596,'all prior task objects retained')
ok(hashlib.sha256(json.dumps(previous,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()=='a48e07fb8537a72e0da2419dd7e91951189c69aa9b7074b3edbe0e6189b36695','prior task content and indices unchanged')
print(json.dumps({'status':'PASS','checks':checks,'newCards':126,'sourceCards':128,'sourceExercises':'75–109','oracle':'separate source transcription, exact identities/steps/aliases, complete original-domain factors, all modelling questions and unique intersection'},ensure_ascii=False))
