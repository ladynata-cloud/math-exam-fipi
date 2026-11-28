"""Independent source and algebra oracle for Makarychev 2024, printed pp. 56–57."""
import json
import random
import re
import subprocess
from collections import Counter
from pathlib import Path

import sympy as S
from sympy.parsing.sympy_parser import (parse_expr, standard_transformations,
                                        implicit_multiplication_application, rationalize)

base = Path(__file__).resolve().parent
tasks = json.loads((base/'exercises-215-220.json').read_text())
cards = {q['source']['reference'][2:]: q for q in tasks}
assert Counter(int(re.match(r'\d+', key)[0]) for key in cards) == {215:4,216:3,217:2,218:4,219:4,220:4}
assert all(q['source']['page'] == (56 if int(key[:3])<=218 else 57) for key,q in cards.items())
assert all(q['source']['section'] == 'additional-1' for q in cards.values())
assert sum(len(q['steps']) for q in tasks) == 45
a,b,c,x,y,z = S.symbols('a b c x y z', real=True)
def parse(text):
    superscript = str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹', '0123456789')
    text=re.sub(r'[⁰¹²³⁴⁵⁶⁷⁸⁹]+', lambda m: '**'+m[0].translate(superscript), text)
    return parse_expr(text.replace('−','-').replace('^','**').replace(',','.'),
                      local_dict={s.name:s for s in (a,b,c,x,y,z)}, transformations=standard_transformations+(implicit_multiplication_application,rationalize))
def same(first,second):
    return S.cancel(first-second) == 0

expected_domains=[{2},{0,3},{-3,3},{-S.Rational(1,2),S.Rational(1,2)}]
for part,expected in zip('абвг',expected_domains):
    task=cards['215'+part]
    assert {S.Rational(v) for v in task['exclusions']} == expected
    assert set(S.solveset(S.denom(parse(task['answer'])),x,domain=S.Reals)) == expected
for part,den in zip('абв',[x-2,x+5,2*x-6]):
    assert set(S.solveset(den,x,domain=S.Reals)) == {S.Rational(cards['216'+part]['answer'])}
for part,divisor,digits in [('а',101,'a0a0'),('б',91,'a00a')]:
    for digit in range(1,10):
        assert parse(cards['217'+part]['answer']).subs(a,digit)*divisor == int(digits.replace('a',str(digit)))

originals={
 '218а':((3*a-3*c)**2,9*a**2-9*c**2), '218б':((a*a-9)**2,(3-a)**3),
 '218в':(8*y**3-1,y-4*y**3),'218г':(5*a*a-3*a*b,a*a-S.Rational(36,100)*b*b),
 '219а':(a*a-4*a+4,a*a+a*b-2*a-2*b),'219б':(6*x*x-3*x*y+4*x-2*y,9*x*x+12*x+4),
 '219в':(a*a+4*a*b+4*b*b,a**3+8*b**3),'219г':(27*x**3-y**3,18*x*x+6*x*y+2*y*y),
 '220а':(b**14-b**7+1,b**21+1),'220б':(x**33-1,x**33+x**22+x**11),
 '220в':(x*(y-z)-y*(x-z),x*(y-z)**2-y*(x-z)**2),
 '220г':(a*(b+1)**2-b*(a+1)**2,a*(b+1)-b*(a+1))}
for ref,(top,bottom) in originals.items():
    task=cards[ref]
    source=re.search(r'\{\{frac:([^:}]+):([^}]+)\}\}',task['prompt'])
    assert source and same(parse(source[1]),top) and same(parse(source[2]),bottom),ref
    assert same(parse(task['answer']),top/bottom),ref
    factor=parse(task['steps'][1]['answer'])
    assert S.cancel(S.gcd(top,bottom)/factor).is_Rational,ref

# Count distinct real zeros by independent exact isolation. Some are irrational
# or repeated; a finite set of numerical probes would incorrectly accept these.
rng=random.Random(215)
denominators=[(x*x+1)*(x-2)**4, (x-2)**2*(x*x-2), (x*x-1)**3, (2*x-1)**2*(2*x+1)**3,
              x**2+S.Rational(1,10**6), x*x, S.Integer(1)]
for _ in range(90):
    degree=rng.randrange(1,9)
    denominators.append(sum(rng.randrange(-5,6)*x**i for i in range(degree))+rng.choice([-3,-1,1,4])*x**degree)
cases=[]
for denominator in denominators:
    polynomial=S.Poly(denominator,x)
    points=[-S.Rational(1,2),S.Integer(0),S.Integer(2)]
    cases.append(dict(fraction='1/('+str(denominator).replace('**','^')+')',pts=[str(v) for v in points],
                      zeros=[polynomial.eval(v)==0 for v in points],count=len(polynomial.intervals())))
node="""const C=require('./check.js');const data=JSON.parse(require('node:fs').readFileSync(0,'utf8'));
for(const t of data){const got=C.inspectDomainFraction(t.fraction,t.pts);if(got.count!==t.count||JSON.stringify(got.zeros)!==JSON.stringify(t.zeros))throw Error(JSON.stringify([t,got]));}
const assert=require('node:assert/strict');const domain={kind:'domain-fraction',exclusions:['2']};
for(const form of ['3/(x-2)','(x-2)/((x-2)^2)','(x+2)/((2-x)*(x^2+1))','((x+2)/(x^2-4x+4))'])assert(C.check(form,domain),form);
for(const form of ['1/(x^2-4)','1/((x-2)*(x^2-2))','1/(x-2x+2)^0','1/(x-x)','1/x-2','x+1/(x-2)','1/(x-2)(x+2)','1/(1/(x-2))'])assert(!C.check(form,domain),form);
for(const form of ['a-c','3(c-a)','(a-c)/2'])assert(C.check(form,{kind:'common-factor',answer:'9(a-c)'}),form);
assert(!C.check('(a-c)/a',{kind:'common-factor',answer:'9(a-c)'}));"""
subprocess.run(['node','-e',node],cwd=base,input=json.dumps(cases),text=True,check=True)
print('PASS 21 source cards, 12 reduced identities and greatest common factors, 97 exact real-root counts, 45 steps')
