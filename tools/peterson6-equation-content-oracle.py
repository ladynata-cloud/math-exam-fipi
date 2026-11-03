#!/usr/bin/env python3
"""Independent exact arithmetic and modeling checks for Peterson's equation overlay.

The expected quantities below are reconstructed from the original task conditions.
They do not call the browser's arithmetic, generator, answer checker, or builder.
The chosen relation and both distractors are evaluated independently at the
condition-derived unknown; every numeric intermediate and final answer is checked.
"""

import ast
import json
import re
from fractions import Fraction as F
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'school' / 'peterson6'
OVERLAY = json.loads((COURSE / 'equation-lessons.json').read_text())
BASE = {t['id']: t for name in ('logic.json', 'arithmetic.json', 'percent.json')
        for lesson in json.loads((COURSE / name).read_text()) for t in lesson['tasks']}
cases = {}


def c(task_id, unknown, *, final=None, **numeric_steps):
    assert task_id not in cases
    # "root" denotes the unknown explicitly selected in that task, which can
    # differ from the final requested quantity (coefficient versus percentage).
    cases[task_id] = {'x': F(unknown), 'final': F(unknown if final is None else final),
                      'numeric': {'root': F(unknown), **{k: F(v) for k, v in numeric_steps.items()}}}


# River: reconstruct shore speeds, distances and times from the given facts.
c('p09-t01', 12 + 2, check=(12 + 2) - 2)
c('p09-t02', 16 - 3, check=(16 - 3) + 3)
c('p09-t03', (9 + F('1.5')) * 2, speed=9 + F('1.5'), check=((9 + F('1.5')) * 2) / 2)
c('p09-t04', (F('14.5') - F('2.5')) * 3, speed=F('14.5') - F('2.5'), check=(F('14.5') - F('2.5')))
c('p09-t05', F(50, 18 + 2), coefficient=18 + 2, check=(18 + 2) * F(50, 18 + 2))
c('p09-t06', F(15, 8 - 2), coefficient=8 - 2, check=(8 - 2) * F(15, 8 - 2))
c('p09-t07', (12 + 2) - (12 - 2), slower=12 - 2, check=(12 - 2) + ((12 + 2) - (12 - 2)))
c('p09-t08', F(17 - 11, 2), coefficient=17 - 11, check=(17 - F(17 - 11, 2)) - F(17 - 11, 2))
c('p09-t09', F(17 + 11, 2), sum=17 + 11, check=17 - F(17 + 11, 2))
c('p09-t10', (F('18.6') - F('13.4')) / 2, difference=F('18.6') - F('13.4'),
  check=(F('18.6') + F('13.4')) / 2 - (F('18.6') - F('13.4')) / 2)
c('p09-t11', F(10, 4), check=4 * F(10, 4))
c('p09-t12', F('1.8') * 5, check=F('1.8') * 5 / 5)
c('p09-t13', F(36, 15 + 3) + F(36, 15 - 3), down=F(36, 15 + 3), up=F(36, 15 - 3), check=36 + 36)
c('p09-t14', F(60, 20) + F(30, 60) + F(60, 12), down=F(60, 20), up=F(60, 12), check=F(30, 60))
c('p09-t15', (10 + F('1.5')) - (10 - F('1.5')), shorter=10 - F('1.5'), check=10 + F('1.5'))
c('p09-t16', F(27, 3) - F('1.5'), speed=F(27, 3), check=3 * (F(27, 3) - F('1.5') + F('1.5')))
c('p09-t18', (F(30, 2) - F(27, 3)) / 2, down=F(30, 2), up=F(27, 3), check=(F(30, 2) + F(27, 3)) / 2)

# Averages: independent sums and weights, including distinct travel times.
c('p10-t01', F(4 + 7 + 10, 3), sum=4 + 7 + 10, check=4 + 7 + 10)
c('p10-t05', 5 * 12, check=F(5 * 12, 5))
c('p10-t06', 4 * 9 - (7 + 8 + 10), sum=4 * 9, check=F(7 + 8 + 10 + (4 * 9 - 25), 4))
c('p10-t09', F(2 * 8 + 3 * 6, 5), sum=2 * 8 + 3 * 6, check=2 * 8 + 3 * 6)
c('p10-t10', F(10 * 12 + 10 * 16, 20), sum=10 * 12 + 10 * 16, check=10 * 12 + 10 * 16)
c('p10-t11', F(2 * 80 + 3 * 100, 2 + 3), cost=2 * 80 + 3 * 100, check=2 * 80 + 3 * 100)
c('p10-t12', F(2 * 40 + 2 * 60, 2 + 2), distance=2 * 40 + 2 * 60, check=2 * 40 + 2 * 60)
c('p10-t13', F(30 + 30) / (F(30, 15) + F(30, 10)), time=F(30, 15) + F(30, 10), check=30 + 30)
c('p10-t14', F(3 * 6 + 10, 4), sum=3 * 6 + 10, check=3 * 6)
c('p10-t15', F(5 * 8 - 6 + 11, 5), sum=5 * 8 - 6 + 11, check=5 * 8)
c('p10-t16', F('4.2') * 5 - (3 + 4 + 5 + 4), sum=F('4.2') * 5, check=F('4.2'))
c('p10-t18', (4 * F('2.5') + 6 * 4) / 10, mass=4 * F('2.5') + 6 * 4, check=4 * F('2.5') + 6 * 4)

# Percent introduction: pct/100 always refers to the explicitly stated base.
c('p11-t01', F(360, 100), check=360)
c('p11-t02', F(7, 100) * 500, rate=F(7, 100), check=F(7, 100) * 100)
c('p11-t03', F('0.6') / 100 * 250, rate=F('0.6') / 100, check=F('0.6'))
c('p11-t04', F(125, 100) * 80, rate=F(125, 100), check=125)
c('p11-t08', F(150, 100) * 360, rate=F(150, 100), check=150)
c('p11-t09', F(12, 48) * 100, coefficient=F(48, 100), check=12)
c('p11-t10', 80 * (1 - F(35, 100)), used=80 * F(35, 100), check=80)
c('p11-t11', 200 * (1 + F(25, 100)), gain=200 * F(25, 100), check=25)
c('p11-t12', F(120 - 40, 40) * 100, gain=120 - 40, check=120)
c('p11-t13', F(90 - 45, 90) * 100, loss=90 - 45, check=45)
c('p11-t14', F(20, 100) * 300 - F(30, 100) * 160, second=F(30, 100) * 160, first=F(20, 100) * 300, check=F(20, 100) * 300)
c('p11-t15', F('12.5') / 100 * 64, rate=F('12.5') / 100, check=F('12.5'))
c('p11-t16', F(45 - 30, 30) * 100, gain=45 - 30, check=45)
c('p11-t17', F(25, 100) * 100 - F(40, 100) * 60, first=F(40, 100) * 60, check=F(25, 100) * 100)
c('p11-t18', F('0.08') / F(1, 100), check=F('0.08'))

# Percent problems: preserve salt/dry matter, not the whole solution mass.
c('p12-t01', F(15, 100) * 240, rate=F(15, 100), check=15)
c('p12-t02', F(18) / F(12, 100), rate=F(12, 100), check=18)
c('p12-t03', F(27, 45) * 100, coefficient=F(45, 100), check=27)
c('p12-t04', 800 * (1 - F(15, 100)), discount=800 * F(15, 100), check=15)
c('p12-t05', F(640) / (1 - F(20, 100)), rate=1 - F(20, 100), check=640)
c('p12-t06', F(540 - 450, 450) * 100, gain=540 - 450, check=540)
c('p12-t07', F(250 - 200, 250) * 100, loss=250 - 200, check=200)
c('p12-t08', F(75 - 60, 60) * 100, gain=75 - 60, check=75)
salt_mix = 200 * F(15, 100) + 300 * F(5, 100)
c('p12-t09', salt_mix / (200 + 300) * 100, salt=salt_mix, check=salt_mix)
salt_evap = 500 * F(8, 100)
c('p12-t10', salt_evap / (500 - 100) * 100, salt=salt_evap, check=salt_evap)
dry = 10 * (1 - F(80, 100))
c('p12-t11', dry / (1 - F(50, 100)), dry=dry, check=dry)
c('p12-t12', F(40) * F(55, 100) / 2, girls=40 * F(55, 100), check=40 * F(55, 100))
c('p12-t13', ((1 + F(20, 100)) * (1 + F(10, 100)) - 1) * 100, factor=F('1.2') * F('1.1'), check=12 * 11)
c('p12-t14', 80 * (1 - F(30, 100)) * (1 - F(1, 4)), first=80 * (1 - F(30, 100)), check=80)
c('p12-t15', F(6) / (F('0.75') / 100), rate=F('0.75') / 100, check=6)
c('p12-t16', F(100 - 80, 100) * 100, difference=100 - 80, check=80)
c('p12-t17', 350 * (1 + F(12, 100)), delivery=350 * F(12, 100), check=350 * F(12, 100))
c('p12-t18', F(84) / (1 - F(30, 100)), rate=1 - F(30, 100), check=F(84) / F('0.7') - 84)

# Simple growth: sum of equal increments rather than powers.
c('p13-t01', 1000 * (1 + 3 * F(8, 100)), annual=1000 * F(8, 100), check=1000 * F(8, 100))
c('p13-t02', 2500 * (1 + 5 * F(4, 100)), annual=2500 * F(4, 100), check=2500 * F(4, 100))
c('p13-t03', 8000 * (1 + 6 * F('0.5') / 100), monthly=8000 * F('0.5') / 100, check=8000 * F('0.5') / 100)
c('p13-t04', 1200 * 8 * F('2.5') / 100, each=1200 * F('2.5') / 100, check=F('2.5'))
c('p13-t05', F(1560) / (1 + 5 * F(6, 100)), coefficient=1 + 5 * F(6, 100), check=1560)
c('p13-t06', F(2300 - 2000, 3 * 2000) * 100, gain=2300 - 2000, check=2300)
c('p13-t07', F(520 - 400) / (400 * F('7.5') / 100), each=400 * F('7.5') / 100, check=520)
c('p13-t08', F(1) / (F('12.5') / 100), gain=100, check=200)
c('p13-t09', F(3 - 1) / F(5, 100), gain=300 - 100, check=300)
c('p13-t10', 5000 * (1 + 30 * F('0.02') / 100), daily=5000 * F('0.02') / 100, check=5000 * F('0.02') / 100)
c('p13-t11', 600 * (6 - 4) * F('1.5') / 100, monthly=600 * F('1.5') / 100, check=600 * (1 + 6 * F('1.5') / 100))
c('p13-t12', 900 * (1 - 5 * F(2, 100)), daily=900 * F(2, 100), check=900 * 5 * F(2, 100))
c('p13-t13', 1500 * (1 - 8 * F(3, 100)), each=1500 * F(3, 100), check=1500 * F(3, 100))
c('p13-t14', F(1, 4) / F(5, 100), target=F(1, 4) * 100, check=F(1, 4) * 100)
c('p13-t15', 1200 * (1 + F(1, 2) * F(9, 100)), year=1200 * F(9, 100), check=1200 * F(1, 2) * F(9, 100))
c('p13-t16', 800 * (1 + 3 * F(5, 100) + 2 * F(2, 100)), first=800 * 3 * F(5, 100), second=800 * 2 * F(2, 100), check=800 * (3 * F(5, 100) + 2 * F(2, 100)))
c('p13-t17', 1000 * (8 * F(3, 100) - 4 * F(6, 100)), first=1000 * (1 + 4 * F(6, 100)), check=1000 * (1 + 8 * F(3, 100)))
c('p13-t18', F(4000 - 3200) / (3200 * F('2.5') / 100), each=3200 * F('2.5') / 100, check=4000)

# Compound growth: exact products; no rounding or logarithm implementation.
c('p14-t01', 1000 * F('1.1') ** 2, first=1000 * F('1.1'), check=10)
c('p14-t02', 5000 * F('1.04') ** 3, first=5000 * F('1.04'), second=5000 * F('1.04') ** 2, check=4)
c('p14-t03', 800 * F('0.8') ** 2, first=800 * F('0.8'), check=20)
c('p14-t04', 400 * F('1.25') * F('0.8'), first=400 * F('1.25'), check=20)
c('p14-t05', 1000 * F('1.1') * F('0.9'), first=1000 * F('1.1'), check=10)
c('p14-t06', 200 * F('1.2') * F('1.15'), first=200 * F('1.2'), check=15)
c('p14-t07', F(1440) / F('1.2') ** 2, coefficient=F('1.2') ** 2, check=1440)
assert F('1.1') ** 2 == F(121, 100)
c('p14-t08', F('1.1'), final=(F('1.1') - 1) * 100, product=F(121, 100), percent=(F('1.1') - 1) * 100, check=121)
c('p14-t09', 25 * 2 ** 3, factor=2 ** 3, check=25)
c('p14-t10', (F('1.2') ** 2 - 1) * 100, factor=F('1.2') ** 2, check=12 ** 2)
c('p14-t11', (F('1.1') - 1) * 100, factor=F('1.1'), check=4 * 11)
simple, compound = 2000 * (1 + 3 * F('0.1')), 2000 * F('1.1') ** 3
c('p14-t12', compound - simple, simple=simple, compound=compound, check=compound)
c('p14-t13', 1600 * F('1.025') ** 2, first=1600 * F('1.025'), check=F('2.5'))
c('p14-t14', 40000 * F('1.005') ** 2, first=40000 * F('1.005'), check=F('0.5'))
c('p14-t15', F(35) / F('0.5') ** 2, coefficient=F('0.5') ** 2, check=35)
c('p14-t16', F(400 - 240, 400) * 100, loss=400 - 240, check=240)
c('p14-t17', 1600 * F('1.05') ** 2, first=1600 * F('1.05'), check=5)
periods, amount = 0, 1000
while amount < 8000:
    amount *= 2
    periods += 1
c('p14-t18', periods, previous=F(amount, 2), check=amount)
assert amount >= 8000 and amount / 2 < 8000


def expression(text, x):
    """Evaluate only an explicit arithmetic grammar, not arbitrary Python code."""
    text = re.sub(r'\{\{frac:([^:{}]+):([^:{}]+)\}\}', r'((\1)/(\2))', text)
    text = text.replace('−', '-').replace('·', '*').replace(':', '/').replace(',', '.').replace('^', '**')
    text = re.sub(r'(?<=[0-9x)])\s*(?=[x(])', '*', text)

    def walk(node):
        if isinstance(node, ast.Constant) and type(node.value) in (int, float):
            return F(str(node.value))
        if isinstance(node, ast.Name) and node.id == 'x':
            return x
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            val = walk(node.operand)
            return val if isinstance(node.op, ast.UAdd) else -val
        if isinstance(node, ast.BinOp):
            a, b = walk(node.left), walk(node.right)
            if isinstance(node.op, ast.Add): return a + b
            if isinstance(node.op, ast.Sub): return a - b
            if isinstance(node.op, ast.Mult): return a * b
            if isinstance(node.op, ast.Div): return a / b
            if isinstance(node.op, ast.Pow):
                assert b.denominator == 1 and 0 <= b <= 100
                return a ** int(b)
        raise AssertionError('Unsupported expression: ' + text)

    return walk(ast.parse(text.strip(), mode='eval').body)


def relation(text, x):
    text = text.replace('≥', '>=').replace('≤', '<=')
    parts = re.split(r'(>=|<=|=|>|<)', text)
    assert len(parts) == 3, text
    left, sign, right = parts
    a, b = expression(left, x), expression(right, x)
    return {'=': a == b, '>=': a >= b, '<=': a <= b, '>': a > b, '<': a < b}[sign]


def expected_ids():
    numbers = {
        'p09': list(range(1, 17)) + [18],
        'p10': [1, 5, 6] + list(range(9, 17)) + [18],
        'p11': list(range(1, 5)) + list(range(8, 19)),
        'p12': list(range(1, 19)), 'p13': list(range(1, 19)), 'p14': list(range(1, 19)),
    }
    return {f'{lesson}-t{number:02}' for lesson, ns in numbers.items() for number in ns}


def main():
    assert OVERLAY['version'] == 2
    assert set(OVERLAY) == {'version', 'lessons', 'tasks'}
    assert set(OVERLAY['tasks']) == expected_ids() == set(cases)
    assert len(cases) == 98
    assert set(OVERLAY['lessons']) == {f'p{n:02}' for n in range(9, 15)}
    for lesson in OVERLAY['lessons'].values():
        assert set(lesson) == {'theory', 'goals'}
        assert len(lesson['goals']) >= 2 and len(lesson['theory']) >= 3
        for block in lesson['theory']:
            assert all(isinstance(block[k], str) and block[k] for k in ('title', 'text', 'example'))
    numeric_count = 0
    choice_positions = set()
    for tid, task in OVERLAY['tasks'].items():
        assert set(task) <= {'methodVersion', 'steps', 'hint', 'explanation', 'finalLabel'}, tid
        assert task['methodVersion'] == 2 and task['hint'] and task['explanation']
        assert F(BASE[tid]['answer'].replace(',', '.')) == cases[tid]['final'], tid + ': original answer'
        steps = task['steps']
        assert [s['id'] for s in steps[:2]] == ['unknown', 'equation'], tid
        assert len({s['id'] for s in steps}) == len(steps), tid + ': duplicate step'
        assert {s['id'] for s in steps if s['kind'] == 'number'} == set(cases[tid]['numeric']), tid + ': numeric coverage'
        for step in steps:
            assert all(isinstance(step[k], str) and step[k].strip() for k in ('id', 'prompt', 'answer', 'hint', 'explanation')), tid
            if step['kind'] == 'number':
                assert F(step['answer']) == cases[tid]['numeric'][step['id']], (tid, step['id'], step['answer'], cases[tid]['numeric'][step['id']])
                numeric_count += 1
            elif step['kind'] == 'choice':
                assert len(step['choices']) == len(set(step['choices'])) == 3, tid
                assert step['choices'].count(step['answer']) == 1, tid
                choice_positions.add(step['choices'].index(step['answer']))
                if step['id'] == 'equation':
                    outcomes = [relation(option, cases[tid]['x']) for option in step['choices']]
                    assert sum(outcomes) == 1 and outcomes[step['choices'].index(step['answer'])], (tid, step['choices'], outcomes)
            else:
                raise AssertionError((tid, 'unknown kind', step['kind']))
        assert 'x' in steps[0]['answer'], tid
        assert 'Проверка' in steps[-1]['prompt'], tid
    assert numeric_count == 295
    assert choice_positions == {0, 1, 2}, 'correct option must not always occupy one slot'
    assert not relation(OVERLAY['tasks']['p14-t18']['steps'][1]['answer'], cases['p14-t18']['x'] - 1)
    print(json.dumps({'ok': True, 'tasks': len(cases), 'numeric_steps': numeric_count,
                      'model_relations': len(cases), 'checked_distractors': 2 * len(cases),
                      'original_answers': len(cases), 'lesson_guides': len(OVERLAY['lessons']),
                      'gate': 'PETERSON6_EQUATION_CONTENT_OK'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
