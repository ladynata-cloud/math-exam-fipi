#!/usr/bin/env python3
"""Bounded independent oracle for the 17 newly authored practice families.

Node only produces tasks and the steps shown by the runtime. Expected answers
are reconstructed from their Russian prompts with Python's Fraction; this file
never calls E.check, E.exact, M.parse, M.equal or M.operation to validate a result.
No third-party dependencies, network access, browser state or progress writes.
"""
import json
import re
import subprocess
from fractions import Fraction as F
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAMILIES = [
    'logic-negation', 'logic-quantifiers', 'variable-value', 'equation',
    'time-units', 'meeting', 'chase', 'speed-ratio', 'river-roundtrip',
    'joint-work', 'mean', 'percent-to-number', 'number-to-percent',
    'percent-change', 'percent-mixture', 'simple-growth', 'compound-growth',
]
SEEDS = [1, 27, 41, 1024, 65537, 4294967295]
FIXED_CASES = [
    ('percent-to-number', 1, 658, '1/20'),
    ('percent-to-number', 1, 1201, '1/4'),
    ('percent-to-number', 3, 1, '49/600'),
    ('number-to-percent', 3, 1, '2450/3'),
]

# 123 anchors from the supplied source/key and separately evaluated formulas.
# The key conflicts at 185-4 and 186-1 are deliberately resolved from the prompt.
MIDDLE_ANCHORS = {
    '180-e':'25','180-f':'0.8','180-g':'6','180-h':'0.3',
    '185-1':'4','185-2':'0.04','185-3':'4/3','185-4':'0.2',
    '186-1':'20','186-2':'2.8','186-3':'202',
    '190-2':'350','191-2':'120','192-1':'56','193-2':'60',
    '195-1':'169.4','195-2-a':'15','195-2-b':'9',
    '198-1-a':'26','198-1-b':'9.75','198-1-c':'22.75',
    '198-2-a':'54','198-2-b':'39.6','198-2-c':'18',
    '199-1-a':'28','199-1-b':'100/3','199-2-a':'90','199-2-b':'810',
    '202-1':'12','202-2':'6/5','203-1':'44','203-2':'3',
    '205-1':'0.5','205-2':'13.5','206-1':'4.5','206-2':'5','206-3':'0.4',
    '207-1':'42','207-2':'0.6','208-1':'130','208-2':'2',
    '210-1':'1.2','211-1':'300','212-1':'3','212-2':'80','212-3':'7.2','212-4':'4.8',
    '213-1':'4.8','214-1':'14/3','214-2':'16/3','216-1':'12','216-2':'39',
    '218-2':'27','219-1':'12','223-1':'17.2','223-2-a':'19.5','223-2-b':'22.2',
    '226-1':'3.2','231-1':'42','231-2-a':'3','231-2-b':'6','232-1':'5','232-2':'52',
    '233-1':'25.2','233-2':'58.8','244-left':'2','244-right':'5','245-1':'12.5',
    '246-a':'30','246-b':'7.5','247-speed':'4.5','247-distance':'13',
    '253-value':'0.08','253-share':'0.02','253-percent':'2','254-1':'24',
    '268-2-diff':'5.6','268-2-total':'33',
    '269-4-second':'14.4','269-4-third':'7.2','269-4-share':'0.75','269-4-percent':'75',
    '274-3':'0','274-4':'4','279-2':'22/7','279-3':'25/6','279-4':'1',
    '283-5':'3.232','285-2':'19.8','286-1':'4.08','287-1':'820',
    '289-2-1':'1','289-2-2':'2','289-2-3':'3','289-2-4':'4',
    '291-a':'5','291-c':'3','292-1':'10','292-2':'5','293-b':'20',
    '296-1-speed':'400/9','298-1':'2.5','298-2':'5/3','298-3':'4',
    '299-1':'20','300-own':'20','300-current':'2','302-1':'35.7',
    '303-1':'210','304-1':'40','305-cyclist':'18','305-motorcycle':'54','306-1':'6',
    '320-a':'50','320-b':'100/3','320-c':'400','320-d':'80','320-e':'900','320-f':'90',
    '323-fraction':'4/15','323-percent':'80/3','323-rounded':'26.7','326-1':'20',
}


def plain(value):
    text = str(value).replace('−', '-')
    text = re.sub(r'\{\{mix:([+-]?\d+):(\d+):(\d+)\}\}', r'\1 \2/\3', text)
    return re.sub(r'\{\{frac:([+-]?\d+):(\d+)\}\}', r'\1/\2', text)


def number(value):
    text = plain(value).strip().replace(',', '.')
    mixed = re.fullmatch(r'([+-]?\d+)\s+(\d+)/(\d+)', text)
    if mixed:
        whole, numerator, denominator = mixed.groups()
        sign = -1 if whole.startswith('-') else 1
        return F(whole) + sign * F(int(numerator), int(denominator))
    return F(text)


def first_number(text):
    match = re.search(r'[+-]?(?:\d+\s+\d+/\d+|\d+/\d+|\d+(?:[.,]\d+)?)', plain(text))
    assert match, ('Missing diagram quantity', text)
    return number(match.group())


def match(pattern, text):
    found = re.fullmatch(pattern, plain(text))
    assert found, ('Unrecognised generated prompt', pattern, text)
    return found.groups()


def arithmetic(operation, left, right):
    a, b = number(left), number(right)
    if operation == 'add': return a + b
    if operation == 'subtract': return a - b
    if operation == 'multiply': return a * b
    if operation == 'divide': return a / b
    raise AssertionError(('Unexpected operation', operation))


def ast_value(node):
    if isinstance(node, (str, int)): return number(node)
    return arithmetic(node['op'], ast_value(node['left']), ast_value(node['right']))


def compare_steps(task, expected):
    steps = [s for s in task['shownSteps'] if s['kind'] == 'numeric']
    actual = [number(s['answer']) for s in steps]
    assert actual == list(map(number, expected)), ('Steps', actual, expected)
    for step in steps:
        assert step['prompt'] and step['explanation']
        if step.get('calculation'):
            calculation = step['calculation']
            assert arithmetic(calculation['op'], calculation['left'], calculation['right']) == number(step['answer']), ('Calculation', step)


def logical_check(task, branches):
    text = plain(task['prompt'])
    if task['skill'] == 'logic-negation':
        name, op, boundary = match(r'Выбери отрицание утверждения «([xan]) ([<>]) (\d+)»\.', text)
        boundary = int(boundary)
        domain = [boundary - 1, boundary, boundary + 1]
        original = [(x > boundary if op == '>' else x < boundary) for x in domain]
        def evaluate(option):
            symbol, operator, bound = match(r'([xan]) ([≤≥<>=]) (\d+)', option)
            assert symbol == name and int(bound) == boundary
            predicates = {'≤':lambda x:x <= boundary, '≥':lambda x:x >= boundary,
                          '<':lambda x:x < boundary, '>':lambda x:x > boundary, '=':lambda x:x == boundary}
            return [predicates[operator](x) for x in domain]
        branches.add('negation-' + op)
    else:
        original_body, boundary = match(r'Построй отрицание: «(Все числа набора больше |В наборе есть число, большее )(\d+)»\.', text)
        boundary = int(boundary)
        universal = original_body.startswith('Все')
        lo, equal, hi = boundary - 1, boundary, boundary + 1
        domain = [[], [lo], [equal], [hi], [lo,equal], [equal,hi], [lo,hi], [lo,equal,hi]]
        original = [(all(x > boundary for x in group) if universal else any(x > boundary for x in group)) for group in domain]
        def evaluate(option):
            body, bound = match(r'(Все числа набора (?:не больше|меньше) |В наборе есть число, (?:не большее|меньшее) )(\d+)', option)
            assert int(bound) == boundary
            quantifier = all if body.startswith('Все') else any
            predicate = (lambda x:x <= boundary) if 'не больше' in body else (lambda x:x < boundary)
            return [quantifier(predicate(x) for x in group) for group in domain]
        branches.add('quantifier-all' if universal else 'quantifier-exists')
    desired = [not truth for truth in original]
    matches = [option for option in task['choices'] if evaluate(option) == desired]
    assert matches == [task['answer']], ('Logical truth table', matches, task['answer'])
    choices = [s for s in task['shownSteps'] if s['kind'] == 'choice']
    assert len(choices) == 1 and choices[0]['answer'] == task['answer']
    assert set(choices[0]['choices']) == set(task['choices'])


def check_task(task, branches):
    skill, text = task['skill'], plain(task['prompt'])
    diagram = task.get('diagram', {})
    if skill.startswith('logic-'):
        logical_check(task, branches)
        return
    if skill == 'variable-value':
        a, b, x = map(number, match(r'Найди значение (\d+)x \+ (\d+) при x = (.+)\.', text))
        expected, steps = a*x+b, [a*x, a*x+b]
    elif skill == 'equation':
        a, b, result = map(number, match(r'Реши уравнение (\d+)x \+ (\d+) = (.+)\.', text))
        expected, steps = (result-b)/a, [result-b, (result-b)/a]
    elif skill == 'time-units':
        hours, minutes = map(number, match(r'Вырази (\d+) ч (\d+) мин в часах\. Ответ можно записать дробью\.', text))
        total = hours*60+minutes
        expected, steps = total/60, [hours*60, total, total/60]
        assert task['unit'] == 'ч'
    elif skill == 'meeting':
        distance, first, second = map(number, match(r'Из двух пунктов, расстояние между которыми (.+) км, одновременно навстречу друг другу выехали два автомобиля со скоростями (\d+) и (\d+) км/ч\. Через сколько часов они встретятся\?', text))
        expected, steps = distance/(first+second), [first+second, distance/(first+second)]
        assert diagram['type'] == 'motion' and diagram['mode'] == 'meeting'
        assert first_number(diagram['left']) == first and first_number(diagram['right']) == second
        assert first_number(diagram['gap']) == distance and task['unit'] == 'ч'
    elif skill == 'chase':
        slow, fast, gap = map(number, match(r'Впереди идёт турист со скоростью (\d+) км/ч, сзади - велосипедист со скоростью (\d+) км/ч\. Сейчас между ними (.+) км\. Через сколько часов велосипедист догонит туриста\?', text.replace('—','-')))
        assert fast > slow
        expected, steps = gap/(fast-slow), [fast-slow, gap/(fast-slow)]
        assert diagram['type'] == 'motion' and diagram['mode'] == 'chase'
        assert first_number(diagram['left']) == fast and 'сзади' in diagram['left']
        assert first_number(diagram['right']) == slow and 'впереди' in diagram['right']
        assert first_number(diagram['gap']) == gap and task['unit'] == 'ч'
    elif skill == 'speed-ratio':
        distance, ratio = map(number, match(r'Два поезда выехали одновременно навстречу друг другу\. Между городами (.+) км\. Скорость первого в (.+) раза больше скорости второго\. Сколько километров прошёл первый поезд до встречи\?', text))
        small = distance/(1+ratio)
        expected, steps = small*ratio, [1+ratio, small, small*ratio]
        assert ratio > 1
        assert diagram['type'] == 'motion' and diagram['mode'] == 'meeting'
        assert first_number(diagram['left']) == ratio and first_number(diagram['gap']) == distance
        assert task['unit'] == 'км'
    elif skill == 'river-roundtrip':
        own, current, distance = map(number, match(r'Собственная скорость катера (\d+) км/ч, скорость течения (\d+) км/ч\. Между пристанями (\d+) км\. Сколько часов займёт путь туда и обратно без остановки\?', text))
        assert own > current > 0
        down, up = own+current, own-current
        expected = distance/down+distance/up
        steps = [down, up, distance/down, distance/up, expected]
        assert diagram['type'] == 'river'
        assert first_number(diagram['own']) == own and first_number(diagram['current']) == current
        assert first_number(diagram['distance']) == distance and task['unit'] == 'ч'
        assert distance/down < distance/up
    elif skill == 'joint-work':
        first, together = map(number, match(r'Одна труба наполняет бассейн за (\d+) ч\. Вместе две трубы наполняют его за (.+) ч\. За сколько часов наполнит бассейн одна вторая труба\?', text))
        rate = 1/together-1/first
        assert rate > 0 and together < first
        expected, steps = 1/rate, [1/first, 1/together, rate, 1/rate]
        assert diagram['type'] == 'work' and '?' in diagram['second']
        assert first_number(diagram['first']) == first and first_number(diagram['together']) == together
        assert task['unit'] == 'ч'
    elif skill == 'mean':
        values, = match(r'Найди среднее арифметическое чисел (.+)\.', text)
        values = [number(x) for x in values.split('; ')]
        assert len(values) == 4
        expected, steps = sum(values)/len(values), [sum(values), sum(values)/len(values)]
    elif skill in ('percent-to-number', 'number-to-percent'):
        pattern = r'Замени (.+)% числом, выражающим часть величины\.' if skill == 'percent-to-number' else r'Вырази число (.+) в процентах\. Введи только число процентов\.'
        raw, = match(pattern, text)
        value = number(raw)
        expected = value/100 if skill == 'percent-to-number' else value*100
        steps = [expected]
        if task['level'] == 3:
            assert '{{mix:' in task['prompt'], ('Missing visible mixed number', task['prompt'])
            assert re.fullmatch(r'\d+ \d+/\d+', task['expression']['left'])
            steps.insert(0, value)
            assert task['shownSteps'][0]['answerFormat'] == 'improper-fraction'
    elif skill == 'percent-change':
        initial, change, rate = match(r'Цена (\d+) р\. (повысилась|снизилась) на (\d+)%\. Какой стала новая цена\?', text)
        initial, rate = number(initial), number(rate)
        sign = 1 if change == 'повысилась' else -1
        new_percent = 100+sign*rate
        expected, steps = initial*new_percent/100, [new_percent, new_percent/100, initial*new_percent/100]
        assert diagram['type'] == 'percent' and first_number(diagram['whole']) == initial
        assert first_number(diagram['rate']) == sign*rate and task['unit'] == 'р.'
        branches.add('price-up' if sign == 1 else 'price-down')
    elif skill == 'percent-mixture':
        m1, p1, m2, p2 = map(number, match(r'Смешали (\d+) г (\d+)%-го раствора соли и (\d+) г (\d+)%-го раствора\. Какова концентрация соли в смеси\? Запиши число процентов\.', text))
        salt1, salt2, total = m1*p1/100, m2*p2/100, m1+m2
        ratio = (salt1+salt2)/total
        expected, steps = ratio*100, [salt1, salt2, salt1+salt2, total, ratio, ratio*100]
        assert min(p1,p2) <= expected <= max(p1,p2)
        assert task['unit'] == '%'
        if m1 != m2: assert expected != (p1+p2)/2
    elif skill in ('simple-growth','compound-growth'):
        initial, rate, model, years = match(r'Начальная величина (\d+)\. Она растёт на (\d+)% за год по правилу (простого|сложного) процентного роста\. Чему будет равна величина через (\d+) года\?', text)
        initial, rate, years = number(initial), number(rate), int(years)
        assert model == ('простого' if skill == 'simple-growth' else 'сложного')
        if skill == 'simple-growth':
            annual = initial*rate/100
            expected, steps = initial+years*annual, [annual, years*annual, initial+years*annual]
        else:
            multiplier = 1+rate/100
            steps = [initial*multiplier**year for year in range(1,years+1)]
            expected = steps[-1]
            assert expected > initial*(1+years*rate/100)
        assert diagram['type'] == 'percent' and first_number(diagram['whole']) == initial
        assert first_number(diagram['rate']) == rate and first_number(diagram['part']) == years
        assert ('начальной' if skill == 'simple-growth' else 'новой') in diagram['other']
    else:
        raise AssertionError(('Out-of-scope family', skill))
    assert number(task['answer']) == expected, ('Final answer', task['answer'], str(expected))
    compare_steps(task, steps)
    if task.get('expression'):
        assert ast_value(task['expression']) == expected, ('AST disagrees with prompt', task['expression'])


def check_middle():
    data = json.loads((ROOT/'school/peterson6/textbook/content/176-339.json').read_text())
    parts = {p['id']:p for e in data['exercises'] for p in e['parts']}
    assert len(MIDDLE_ANCHORS) == 123
    for identifier, expected in MIDDLE_ANCHORS.items():
        assert number(parts[identifier]['answer']) == number(expected), ('Source anchor', identifier)
    for identifier in ('185-4','186-1','240-1'):
        assert parts[identifier]['sourceIssue']
    assert parts['240-1']['kind'] == 'written' and parts['240-1']['criteria']
    return len(MIDDLE_ANCHORS)


def main():
    cases = [(family,level,seed) for family in FAMILIES for level in (1,2,3) for seed in SEEDS]
    cases += [case[:3] for case in FIXED_CASES]
    producer = """
const fs=require('node:fs');
const G=require('./trainers/peterson6-workshop/generators.js');
const E=require('./school/peterson6/textbook/engine.js');
const requests=JSON.parse(fs.readFileSync(0,'utf8'));
const tasks=requests.map(([id,level,seed])=>{const p=G.generate(id,level,seed);return {...p,shownSteps:E.steps(p)};});
process.stdout.write(JSON.stringify(tasks));
"""
    tasks = json.loads(subprocess.check_output(['node','-e',producer],cwd=ROOT,input=json.dumps(cases),text=True))
    assert len(tasks) == len(cases)
    branches = set()
    for task in tasks:
        try:
            check_task(task, branches)
        except Exception as error:
            raise AssertionError(f'{task["skill"]} level={task["level"]} seed={task["seed"]}: {error}') from error
    assert branches == {'negation-<','negation->','quantifier-all','quantifier-exists','price-up','price-down'}, branches
    for task, (_,_,_,expected) in zip(tasks[-4:], FIXED_CASES):
        assert number(task['answer']) == number(expected)
    assert plain(tasks[-4]['prompt']).startswith('Замени 5%')
    assert plain(tasks[-3]['prompt']).startswith('Замени 25%')
    assert plain(tasks[-2]['prompt']).startswith('Замени 8 1/6%')
    anchors = check_middle()
    print(json.dumps({'result':'PASS','newFamilies':len(FAMILIES),'levels':[1,2,3],
                      'seedCount':len(SEEDS),'generatedCases':len(cases)-4,
                      'fixedRegressions':len(FIXED_CASES),'sourceAnchors':anchors,
                      'coveredBranches':sorted(branches),'thirdPartyDependencies':0},ensure_ascii=False))


if __name__ == '__main__':
    main()
