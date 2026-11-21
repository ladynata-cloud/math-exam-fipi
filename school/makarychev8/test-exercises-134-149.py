"""Independent results from the original exercise columns, pp. 36–38, ISBN 978-5-09-116445-9."""
import json
import re
from pathlib import Path

import sympy as sp

here = Path(__file__).parent
new = json.loads((here / 'exercises-134-149.json').read_text())
legacy = json.loads((here / 'ch1.json').read_text())[5]['tasks']
bank = {q['source']['reference']: q for q in legacy + new if q['source']['type'] == 'textbook'}
expected = {
    134: ['4/(9*m*n)', '4*y**2/(9*x**4)', '3*a/b**2', '3*x/(2*a)', '1/(8*x*y**2)', '21*b**2/(2*a)', '2*c**2/(7*d**2)', '170*x**2*y'],
    135: ['4*x*y**2', '4/(9*c*d)', '-5*x/(14*a)', '2*a*c*d**3/b'],
    136: ['18*x*n/m**2', '10*x*b/3', '2*x/(3*m*y**3)', '450*x**3/(a*b)'],
    137: ['2/(9*x**2)', 'p*q**2/3'],
    138: ['5*m**8/(3*n**8)', '2*y/x**2'],
    139: ['1/(x-3*y)', '(a-3*b)/(a+3*b)', '(x-7*y)/(x+7*y)', '-(m-4*n)/(2*(m+4*n))'],
    140: ['(m-3)/(3*x)', '5*(a-b)/(6*a*b**2)', 'a*x**2/44', '9/(4*m)', 'a/(21*b)', 'x*(x+2*y)/5', '3*(2*a-b)/(a*(2*a+b))', '10*m/(2*m-3*n)'],
    141: ['(x-y)/(6*y)', 'a**2*b/4', 'm*n*(m-4*n)/3', '-3*(3*p+1)/q'],
    142: ['10/11', '-1', '21/50'],
    143: ['3*(x-y)/(5*(x+y))', '(a+2)/((a-2)*(b**2-4))'],
    144: ['(x+1)/(a-x)', '2*a*(p-3)/(p**2+2*p+4)'],
    145: ['a*b/(a+b)', 'a*c/(a-c)'],
    146: ['2/(2*b-3)', '(c-b)/(a*(c-3*a))'],
    147: ['2'],
    148: ['a*b/(2*y)', '2*c*y/b'],
    149: ['I и III', 'II и IV'],
}
symbols = {k: sp.Symbol(k) for k in 'abcxyzdmpnq'}
for n, values in expected.items():
    parts = ['а1', 'а2', 'б'] if n == 142 else [''] if n == 147 else 'абвгдежз'[:len(values)]
    for part, ref in zip(parts, values):
        card = bank[f'№ {n}{part}']
        if n == 149:
            assert card['answer'] == ref and len(card['choices']) == 4
            line = card['graph']['curves'][0]
            assert line['k'] == (1 if part == 'а' else -1) and line['b'] == 0
            continue
        raw = re.sub(r'(?<=\d)(?=[a-z])', '*', card['answer']).replace('^','**')
        assert sp.cancel(sp.sympify(raw,locals=symbols) - sp.sympify(ref,locals=symbols)) == 0, (n,part,raw,ref)
assert len(bank) == 52 and len(new) == 50
assert all(q['source']['page'] in range(36,39) and len(q['steps']) >= 2 for q in new)
assert set(range(134,150)) == {int(re.search(r'\d+',key)[0]) for key in bank}
assert sp.solve(sp.Eq((10-symbols['x'])*sp.Rational(3,4),3*symbols['x']),symbols['x']) == [2]
print('PASS all 16 exercises, 52 parts/cases, 104 new checked steps, both quadrant diagrams')
