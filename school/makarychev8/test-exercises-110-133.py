"""Witnesses from a second reading of printed pages 32–35 (2024, ISBN 978-5-09-116445-9)."""
import json
import re
from pathlib import Path
import sympy as sp

root = Path(__file__).resolve().parent
cards = json.loads((root / 'exercises-110-133.json').read_text())
before = json.loads((root / 'ch1.json').read_text())[4]['tasks']
entries = {card['source']['reference']: card for card in before + cards if card['source']['type'] == 'textbook'}
expected = {
    110:['10*b/(9*a)','7*a/(16*y)','b/2','3/(4*c)'],
    111:['5/(2*x*y)','a/b**2','7*a**3*b/3','2*a/(3*b**2)'],
    112:['x**2/(5*a)','2/(15*m)','22*b/a','6*n**2/m'],
    113:['35/(2*x)','25/8','8*a**2/m','4*b/a'],
    114:['3*x**2/(7*y**2)','4*m*n','-4/(15*x*y)','-10*a**2*x/(9*b*y**2)'],
    115:['-6*a*x*y','-a*m**2/(15*a**2*b)','13*x*m/(3*n)','11*x**2/(3*a*b)'],
    116:['a**2*x**2/(5*b**3)','1*m**2/(p**4)'],
    117:['x**3/(8*y**3)','81*a**4/c**4','n**6/(1000*m**3)','81*a**6/(4*b**4)'],
    118:['16*a**4/(p**8*q**12)','9*a**4*b**6/s**8','4*a**4*b**2/(9*m**2*n**6)','-27*x**6/(8*y**9)'],
    119:['625*a**12/(81*b**8)','32*x**10/(243*y**15)','-1000*m**6/(n**6*p**3)','b**6*c**4/(64*a**6)'],
    120:['14'],
    121:['y*(x-y)','a*(a+b)/(3*b)','-2/m','2*(a+b)/(c+d)','-2*m**2/(3*n**3)','a/(b*x*y)'],
    122:['24/(a+5*b)','2*x*(x-2)/(x+2)','y*(y-2)/(3*(y+2))','2*a*b*(a+3*b)/(a-3*b)'],
    123:['1/(a*x*y)','4/x**2'],
    124:['(y-4)/(6*x)','-3*b/(a+b)'],
    125:['7*(a-1)/a','5*b/(b-2*c)','(x+3)*(x+2)/6','(y-5)*(y-6)/4'],
    126:['1','-10/9','-2/21'],
    127:['2*(a-b)/(a*(a+b))','b*(x-5)/(a*(x+5))'],
    128:['3*(x-y)/2','a*x/(7*(x-y))','(x-y)**2','1/(a-1)'],
    129:['(x-4)*(x-5)/6','(1+a)*(a+2*b)/12','3*(y-5)/(2*(y+6))','(b+2)/(9*b)'],
    131:['(a-4*b)/(a-b)'],
    132:['3','151/60'],
    133:['(a-b)/3','(2*b-a)/7','a*(b-1)','10*(b-a)'],
}
letters = 'абвгде'
variables = {c:sp.Symbol(c) for c in 'abcxyzmnpsqv'}
def val(text):
    return sp.sympify(str(text).replace('^','**'),locals=variables)
for n, answers in expected.items():
    parts = (['а','б1','б2'] if n==126 else [''] if len(answers)==1 else list(letters[:len(answers)]))
    for letter, expr in zip(parts,answers):
        q=entries['№ '+str(n)+letter]
        if q['id']=='p05-t01': actual='b/2' if 'b/2' in q.get('accepts',[])+[q['answer']] else q['answer']
        elif q['id']=='p05-t02': actual='x**3/(8*y**3)' if 'x^3/(8y^3)' in q.get('accepts',[]) else q['answer']
        else: actual=q['answer']
        assert sp.cancel(val(actual)-val(expr))==0,(n,letter,actual,expr)
assert '17,5' in entries['№ 113а']['steps'][0]['explanation']
assert len(cards)==76 and len(entries)==78 and len(entries['№ 130']['steps'])>=2
assert set(range(110,134))=={int(re.search(r'\d+',q).group()) for q in entries}
assert all(q['source']['page'] in range(32,36) and len(q['steps'])>=2 for q in cards)
print('PASS 24 exercises, every subpart and both substitutions; 76 new + 2 preserved cards')
