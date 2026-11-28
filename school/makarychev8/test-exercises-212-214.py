"""Check supplemental §1 work against the printed Makarychev 2024 page 56."""
import json
from fractions import Fraction
from pathlib import Path
import sympy as S
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

root = Path(__file__).resolve().parent
tasks = json.loads((root / 'exercises-212-214.json').read_text())
refs = {q['source']['reference']: q for q in tasks}
expected = ['№ 212а','№ 212б','№ 213, формула','№ 213, скорости'] + ['№ 214'+part for part in 'абвгде']
assert list(refs) == expected and len(tasks) == 10
assert all(q['source']['page'] == 56 and q['source']['section'] == 'additional-1' for q in tasks)
assert refs['№ 212а']['answer'] == str(Fraction(51+17**2,10))
assert refs['№ 212б']['answer'] == str(Fraction(37**2+111,40))
x,t = S.symbols('x t', real=True)
speed_expr = parse_expr(refs['№ 213, формула']['answer'], local_dict={'t':t}, transformations=standard_transformations+(implicit_multiplication_application,))
assert S.simplify(60*t+(t-3)*speed_expr-600) == 0
assert S.solveset(S.denom(speed_expr), t, domain=S.Reals) == S.FiniteSet(3)
assert list(map(Fraction, refs['№ 213, скорости']['answer'].split(';'))) == [Fraction(600-60*n,n-3) for n in (7,6)]
for suffix, denominator in zip('абвгде', (S.Integer(25),2*x+7,x*x-7*x,x*x+8,S.Abs(x)-3,S.Abs(x)+2)):
    written = refs['№ 214'+suffix]['answer']
    excluded = S.EmptySet if written == 'нет' else S.FiniteSet(*[S.Rational(z) for z in written.split(';')])
    assert S.solveset(denominator, x, domain=S.Reals) == excluded, suffix
assert sum(len(q['steps']) for q in tasks) == 22
print('PASS all 10 supplemental parts, printed page 56, exact route, speeds, physical bounds and six real denominator zero sets')
