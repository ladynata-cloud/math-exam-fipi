"""Independent exact checks; does not import JS solvers or generated answers."""
import json
import math
from fractions import Fraction as F
from pathlib import Path

rows = {r['id']: r for r in json.loads((Path(__file__).parents[1] / 'knowledge/model-reference-cases.json').read_text())['cases']}
numeric = {
    'd01': F(3, 4) + F(2, 3),
    'd02': F(math.floor(F('9.96') * 10 + F(1, 2)), 10),
    'd03': math.lcm(12, 18, 30),
    'd04': F(19 - 4, -3),
    'd05': F(9 + 3 + 8, 6 - 2),
    'd06': math.isqrt(13**2 - 5**2),
    'd07': 12000 * F(11, 10) * F(12, 10),
    'd09': F('3.6') / F('.12'),
    'd11': F(110, 2), 'd12': 8 * 3,
    'd13': (6 * F(1, 2)) * (4 * F(1, 2)) / 2,
    'd15': F(125, 1000), 'd16': F(6) / F(1, 2),
    'c03': F(3, 5) * F(2, 4), 'c04': 2**3 + 1, 'c05': 1 + 2,
}
for key, value in numeric.items():
    assert F(rows[key]['expected']) == value, key
# Cross product of PQ=(-1,1,0), PR=(-1,0,1) gives squared triangle area 3/4.
u, v = (-1, 1, 0), (-1, 0, 1)
cross = (u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0])
assert F(sum(x*x for x in cross), 4) == F(3, 4)
assert rows['d08']['expected'] == 'sqrt(3)/2'
# Quadratic factors (x-2)(x-3); all roots, not just substitution of one root.
roots = {F(x) for x in rows['c01']['expected'].split(';')}
assert roots == {F(2), F(3)} and sum(roots) == 5 and math.prod(roots) == 6
# Rational inequality: critical points -2 (excluded) and 1 (included).
assert rows['c02']['expected'] == '(-inf;-2) U [1;inf)'
assert [(F(x)-1)/(F(x)+2) > 0 for x in [-3, 0, 2]] == [True, False, True]
assert (F(1)-1)/(F(1)+2) == 0
# Unit-circle exact angles in units of pi; endpoints included in c08.
assert rows['c06']['expected'].split(';') == ['pi/6', '5pi/6']
assert rows['c08']['expected'].split(';') == ['0', 'pi/3', 'pi', '5pi/3', '2pi']
for key in ['d10', 'd14', 'c07']:
    assert rows[key]['expected'] is None  # Never claim automatic proof validation.
assert len(rows) == 24
print(json.dumps({'exactReferenceChecks': 21, 'humanOnlyCases': ['d10', 'd14', 'c07'], 'liveCalls': 0}))
