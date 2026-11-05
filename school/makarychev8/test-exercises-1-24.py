"""Independent source fixtures and mathematical oracle for printed pp. 7–10.

The formulas below were transcribed separately from the supplied PDF. They do
not use authored explanations or worked-step answers to calculate expectations.
"""
import json
import re
from collections import Counter
from fractions import Fraction
from pathlib import Path
import sympy as S
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, rationalize

HERE = Path(__file__).resolve().parent
added = json.loads((HERE / 'exercises-1-24.json').read_text())
original = json.loads((HERE / 'ch1.json').read_text())[0]['tasks']
tasks = original[:2] + added
by_id = {t['id']: t for t in tasks}
checks = 0

def expect(condition, message):
    global checks
    assert condition, message
    checks += 1

def task(n, part):
    return by_id[f'p01-ex{n:03d}-{part}']

def numeric(t, expected):
    expect(Fraction(t['answer']) == Fraction(expected), t['id'] + ' numeric answer')

def values(text):
    return set() if text == 'нет' else {S.Rational(v) for v in text.split(';')}

symbols = {c: S.Symbol(c, real=True) for c in 'abcmnstvxy'}
symbols.update({'V': S.Symbol('V', real=True), 'rho': S.Symbol('rho', real=True),
                'v1': S.Symbol('v1', real=True), 'v2': S.Symbol('v2', real=True)})

def parse(text):
    text = text.replace('−', '-').replace('²', '**2').replace('³', '**3').replace('^', '**').replace(',', '.').replace('ρ', 'rho')
    return parse_expr(text, local_dict=symbols,
                      transformations=standard_transformations + (implicit_multiplication_application, rationalize))

def same(actual, expected, label):
    expect(S.simplify(S.nsimplify(parse(actual)) - S.nsimplify(parse(expected))) == 0, label)

def formula(t, numerator, denominator):
    m = re.search(r'\{\{frac:([^:}]+):([^}]+)\}\}', t['prompt'])
    expect(m is not None, t['id'] + ' missing fraction')
    same(m[1], numerator, t['id'] + ' source numerator')
    same(m[2], denominator, t['id'] + ' source denominator')

expected_counts = [6,2,6,2,2,8,3,3,3,4,6,6,3,4,4,4,4,4,2,2,3,6,6,2]
counts = Counter(int(re.search(r'№\s*(\d+)', t['source']['reference'])[1]) for t in tasks)
expect(counts == dict(enumerate(expected_counts, 1)), 'every subpart/table cell/formula covered')
expect(len(tasks) == 95 and len(added) == 93, 'coverage totals')
expect(len(by_id) == 95, 'unique identities')
for t in tasks:
    n = int(re.search(r'№\s*(\d+)', t['source']['reference'])[1])
    expect(t['source']['page'] == (7 if n == 1 else 8 if n <= 10 else 9 if n <= 19 else 10), t['id']+' page')

for i in range(1,7):
    expect(task(1,str(i))['answer'] == ('Дробное' if i in (3,4,6) else 'Целое'), 'classification '+str(i))
expect(values(task(2,'а')['answer']) == {1,2,5}, 'whole expressions')
expect(values(task(2,'б')['answer']) == {3,4,6}, 'fractional expressions')
for i,y in enumerate([3,1,-5,Fraction(1,2),Fraction(-8,5),100],1):
    t = by_id['p01-t01'] if i == 1 else task(3,str(i))
    formula(t, 'y-1', '4')
    numeric(t, (Fraction(y)-1)/4)
formula(by_id['p01-t02'], 'a-8', '2a+5')
numeric(by_id['p01-t02'], Fraction(-2-8,2*(-2)+5))
formula(task(4,'б'), 'b**2+6', '2b')
numeric(task(4,'б'), Fraction(3**2+6,2*3))
for p,a,b in [('а',Fraction(-3),Fraction(-1)),('б',Fraction(3,2),Fraction(1,2))]:
    formula(task(5,p),'(a+b)**2-1','a**2+1')
    numeric(task(5,p), ((a+b)**2-1)/(a*a+1))
for i,x in enumerate(map(Fraction,['-13','-5','-1/5','0','1/17','1','17/3','7']),1):
    formula(task(6,str(i)),'x+5','x-3')
    numeric(task(6,str(i)),(x+5)/(x-3))
for key,expected in [('a-s','v*t'),('a-t','s/v'),('б','m/rho')]:
    same(task(7,key)['answer'],expected,'formula rearrangement '+key)
same(task(8,'formula')['answer'],'s/(v1+v2)','relative speed')
numeric(task(8,'а'),Fraction(250,60+40))
numeric(task(8,'б'),Fraction(310,75+80))
for p,expr in [('а','x*y/(x+y)'),('б','(a-b)/(a*b)'),('в','(c+d)/(c-d)')]:
    same(task(9,p)['answer'],expr,'constructed fraction '+p)

# Domain fixtures include every denominator, not only the first fraction.
denominators={
10:[('x',['x-2']),('b',['b**2+7']),('y',['y','y-3']),('a',['a*(a-1)'])],
11:[('x',[]),('x',['6*x-3']),('x',['7']),('x',['4*x*(x+1)']),('x',['x**2+25']),('x',['x+8','x'])],
12:[('y',['11']),('y',['y-9']),('y',['y**2-2*y']),('y',['y**2+3']),('y',['y-6','y+6']),('y',['y','y+7'])],
13:[('x',['x-2']),('x',['x*(x+1)']),('x',['x+5'])]}
for n,rows in denominators.items():
    for p,(var,dens) in zip('абвгде',rows):
        t=task(n,p)
        actual = re.findall(r'\{\{frac:([^:}]+):([^}]+)\}\}',t['prompt'])
        expect(len(actual)==len(dens),t['id']+' denominator count')
        forbidden=set()
        for (_,den),fixture in zip(actual,dens):
            same(den,fixture,t['id']+' source denominator')
            forbidden.update(S.solveset(parse(fixture),symbols[var],domain=S.S.Reals))
        expect(values(t['answer'])==forbidden,t['id']+' domain')
for p,target in zip('абвг',[1,0,-1,3]):
    t=task(14,p); formula(t,'x-3','5');numeric(t,5*target+3)

zero_fixtures=[(15,'а','y-5','8','y'),(15,'б','2*y+3','10','y'),
 (15,'в','x*(x-1)','x+4','x'),(15,'г','x*(x+3)','2*x+6','x'),
 (16,'а','m+4','6','m'),(16,'б','7-5*n','11','n'),
 (16,'в','b**2-b','b+2','b'),(16,'г','y**2-25','3*y-15','y')]
for n,p,top,bot,var in zero_fixtures:
    t=task(n,p);formula(t,top,bot)
    candidates=S.solveset(parse(top),symbols[var],domain=S.S.Reals)
    forbidden=S.solveset(parse(bot),symbols[var],domain=S.S.Reals)
    expect(values(t['answer'])==set(candidates-forbidden),t['id']+' zeros including denominator check')

for p,a,b in [('а',2,3),('б',2,-3),('в',-2,3),('г',-2,-3)]:
    expect(task(17,p)['answer']==('Положительный' if a/b>0 else 'Отрицательный'),'sign '+p)

proof_fixtures=[('а','3','x**2+1','x'),('б','-5','y**2+4','y'),('в','(a-1)**2','a**2+10','a'),('г','(b-3)**2','-b**2-1','b')]
for p,top,bot,var in proof_fixtures:
    formula(task(18,p),top,bot)
    for v in [S.Rational(i,4) for i in range(-80,81)]:
        result=(parse(top)/parse(bot)).subs(symbols[var],v)
        expect(bool({'а':result>0,'б':result<0,'в':result>=0,'г':result<=0}[p]),'proof sign '+p)
expect('a = 1' in task(18,'в')['answer'],'zero equality in nonnegative proof')
expect('b = 3' in task(18,'г')['answer'],'zero equality in nonpositive proof')

extrema=[(19,'а','a','4/(a**2+5)',0,S.Rational(4,5)),(19,'б','a','10/((a-3)**2+1)',3,S.Integer(10)),(20,'а','b','(b**2+7)/21',0,S.Rational(1,3)),(20,'б','b','((b-2)**2+16)/8',2,S.Integer(2))]
for n,p,var,expr,point,bound in extrema:
    t=task(n,p);numeric(t,point)
    f=parse(expr);expect(f.subs(symbols[var],point)==bound,t['id']+' bound attained')
    for v in range(-40,41):
        delta=S.simplify(f.subs(symbols[var],v)-bound)
        expect(bool(delta<=0 if n==19 else delta>=0),t['id']+' extremum')
for p,answer in [('а','Нет'),('б','Да'),('в','Нет')]:
    formula(task(21,p),'18','4*x**2+9+y**2+4*x*y')
    expect(task(21,p)['answer']==answer,'two-variable bound '+p)
x,y=symbols['x'],symbols['y']
same('4*x**2+9+y**2+4*x*y','(2*x+y)**2+9','square identity')
f=18/((2*x+y)**2+9)
expect(S.simplify(f.subs(y,-2*x))==2,'maximum attained on line')
expect(S.limit(f.subs(y,0),x,S.oo)==0,'infimum zero, positive numerator means not attained')

expanded=['(2a+3)*(2a-3)','(y-5b)*(y+5b)','(0.8x+y)*(y-0.8x)','(b+0.5)**2','(a-2x)**2','(a*b-1)**2']
factored=['x**2-25','16-c**2','a**2-6a+9','x**2+8x+16','a**3-8','b**3+27']
for n,fixtures in [(22,expanded),(23,factored)]:
    for p,fixture in zip('абвгде',fixtures):
        t=task(n,p)
        for answer in [t['answer']]+t.get('accepts',[]):
            same(answer,fixture,t['id']+' algebraic identity / alias')
price_a=(5-5//3)*350
price_b=Fraction(5*390*70,100)
expect(task(24,'store')['answer']==('Джем' if price_b<price_a else 'Сладость'),'shop choice')
numeric(task(24,'saving'),abs(price_a-price_b))
expect([int(q['answer']) for q in task(24,'store')['steps']]==[4,price_a,70,price_b],'discount intermediate facts')
print(json.dumps({'status':'PASS','sourceCards':len(tasks),'addedCards':len(added),'checks':checks,'coverage':'all 24 exercises and every subpart; independent formulas, domains, zero exclusions, signs, extrema, identities, discounts'},ensure_ascii=False))
