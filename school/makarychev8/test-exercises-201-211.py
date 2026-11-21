"""An independent oracle for printed pp. 55–56, Makarychev 2024."""
import json
from fractions import Fraction
from pathlib import Path

base = Path(__file__).resolve().parent
new = json.loads((base / 'exercises-201-211.json').read_text())
old = json.loads((base / 'ch1.json').read_text())[8]['tasks']
cards = {t['source']['reference']: t for t in old + new if t['source']['type'] == 'textbook'}

def get(ref):
    return cards['№ ' + ref]

def numbers(ref):
    return [Fraction(v) for v in get(ref)['answer'].split(';')]

def pairs(ref):
    return {tuple(map(int, pair.strip()[1:-1].split(';'))) for pair in get(ref)['answer'].split(',')}

assert len(new) == 12 and len(cards) == 14
assert {name.split()[1].rstrip('аб,') for name in cards} == {str(n) for n in range(201, 212)}
for n in range(201, 212):
    assert all(t['source']['page'] == (55 if n <= 209 else 56)
               for title, t in cards.items() if title.startswith('№ ' + str(n)))
for ref, left_shift, right_shift, slope, intercept in [
        ('201', -1, -2, 6, 0), ('202', 4, -2, 5, -1), ('203', -1, 1, 4, 3)]:
    a, b = numbers(ref)
    assert (a+b, right_shift*a + left_shift*b) == (slope, intercept)

integers = range(-100, 101)
def integral_values(numerator, denominator):
    return {n: Fraction(numerator(n), denominator(n)) for n in integers
            if denominator(n) and numerator(n) % denominator(n) == 0}

# The remainder after division is a constant (−3, 1, 4, −8), so the
# denominator of every integer-valued case divides that very constant.
v = integral_values(lambda a: a*a-4*a+1, lambda a: a-2)
assert set(v) == set(numbers('204'))
assert set(v.values()) == set(numbers('204, значения'))
for ref, numerator, denominator in [
        ('205а', lambda m:m*m-6*m+10, lambda m:m-3),
        ('205б', lambda m:(m-4)**2, lambda m:m-2)]:
    assert set(numbers(ref)) == set(integral_values(numerator, denominator).values())
assert pairs('206а') == {(x,y) for x in integers for y in integers if 5*x+y-x*y == 2}
assert pairs('206б') == {(x,y) for x in integers for y in integers if x*y-x+y == 8}
assert pairs('207') == set(integral_values(lambda x:x*x-6*x+1, lambda x:x-3).items())
assert numbers('208') == [5,6]
assert all(5 < Fraction(5*a*a+6,a*a+1) < 6 for a in integers if a)
# Positivity implies a,b>7 and (a−7)(b−7)=49, bounding both by 56.
assert pairs('209') == {(a,b) for a in range(8,57) for b in range(8,57)
                         if Fraction(1,a)+Fraction(1,b) == Fraction(1,7)}
assert numbers('210') == [3*3**2-3+6]
assert numbers('211') == [(Fraction(1,5)-3)**2]
assert sum(len(t['steps']) for t in new) == 32
print('PASS all 11 printed numbers, 14 parts, exact decompositions, divisors, integer pairs and rational substitutions')
