#!/usr/bin/env python3
"""Authored coordinate scenes for Atanasyan 2023, exercises 1–30.

This generator encodes each construction explicitly. It does not infer geometry
from prose, choose an arbitrary diagram by exercise number, or certify lessons.
"""
from copy import deepcopy
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PREP = json.loads((ROOT / 'geometry-course/textbook/preparation/chapter-01.json').read_text())
PARTS = {(e['number'], p['part']): p for e in PREP['exercises'] for p in e['parts']}
MODELS = []


def scene(points=(), segments=(), **kwargs):
    return dict(label=kwargs.pop('label', 'Условие'), points=list(points), segments=[list(x) for x in segments], **kwargs)


def arc(vertex, a, b, radius=8, marks=0):
    return dict(vertex=vertex, **{'from': a, 'to': b}, radius=radius, marks=marks)


def eq(a, b, marks=1):
    return dict(a=a, b=b, marks=marks)


def check(kind, **kwargs):
    return dict(type=kind, **kwargs)


def polar(origin, degrees, distance):
    return [origin[0] + distance * math.cos(math.radians(degrees)), origin[1] + distance * math.sin(math.radians(degrees))]


def add(number, part, points, neutral, steps=None, cases=None, checks=(), labels=None, offsets=None, label_only=(), description=''):
    p = PARTS[number, part]
    steps = steps or []
    assert len(steps) <= len(p['steps']), (number, part)
    views = {'neutral': deepcopy(neutral)}
    for index in range(len(p['steps'])):
        s = deepcopy(steps[index] if index < len(steps) else steps[-1] if steps else neutral)
        s['label'] = f'Шаг {index + 1}'
        views[f'step-{index + 1}'] = s
    for index, item in enumerate(cases or []):
        v = deepcopy(item)
        v.setdefault('label', f'Вариант {index + 1}')
        views[f'case-{index + 1}'] = v
    model = dict(points={name: [round(float(x), 9) for x in (*xy[:2], 0)] for name, xy in points.items()},
                 edges=[], planar=True, bounds=[0, 0, 100, 70], views=views,
                 checks=list(checks), description=description or 'Отдельный чертёж к условию задачи; дополнительные элементы раскрываются по шагам.')
    if labels:
        model['labels'] = labels
    if offsets:
        model['labelOffsets'] = offsets
    if label_only:
        model['labelOnly'] = list(label_only)
    MODELS.append(dict(number=number, part=part, model=model))


# 1. Membership in one line. The requested points appear at the placing step.
pts = {'_l': [10, 32], '_r': [90, 32], 'a': [90, 34], 'A': [28, 32], 'B': [63, 32], 'P': [22, 54], 'Q': [74, 51], 'R': [47, 13]}
v = scene(['a'], lines=[['_l', '_r']])
full = scene(['a', 'A', 'B', 'P', 'Q', 'R'], lines=[['_l', '_r']])
add(1, 'single', pts, v, [v, full, full], label_only=['a'],
    checks=[check('collinear', points=['_l', 'A', 'B', '_r'])])

# 2. Each of the three pairs defines its own infinite line.
pts = {'A': [22, 20], 'B': [79, 24], 'C': [45, 54]}
v = scene(pts)
add(2, 'single', pts, v, [scene(pts, lines=[['A', 'B']]), scene(pts, lines=[['A', 'B'], ['A', 'C']]), scene(pts, lines=[['A', 'B'], ['A', 'C'], ['B', 'C']])], offsets={'A': [-4, -4], 'B': [3, -4], 'C': [1, 5]})

# 3. Concurrent and nonconcurrent cases never share one view.
pts = {'O': [50, 35], '_a': [20, 35], '_b': [80, 35], '_c': [30, 15], '_d': [70, 55], '_e': [25, 53], '_f': [75, 17], 'A': [23, 21], 'B': [78, 21], 'C': [43, 54]}
concurrent = scene(['O'], lines=[['_a', '_b'], ['_c', '_d'], ['_e', '_f']])
triangle = scene(['A', 'B', 'C'], lines=[['A', 'B'], ['A', 'C'], ['B', 'C']])
concurrent['label'] = 'Положение 1'
triangle['label'] = 'Положение 2'
add(3, 'single', pts, concurrent, [concurrent, triangle, triangle], cases=[concurrent, triangle], checks=[check('collinear', points=['_a', 'O', '_b']), check('collinear', points=['_c', 'O', '_d']), check('collinear', points=['_e', 'O', '_f'])], offsets={'O': [1, 6], 'A': [-4, -4], 'B': [3, -4], 'C': [1, 5]})

# 4. Three collinear points and one exterior point; only the required joins.
pts = {'A': [20, 20], 'B': [50, 20], 'C': [80, 20], 'D': [38, 54]}
base = scene(pts, lines=[['A', 'C']])
joined = scene(pts, lines=[['A', 'C'], ['A', 'D'], ['B', 'D'], ['C', 'D']])
add(4, 'single', pts, base, [base, joined, joined], checks=[check('collinear', points=['A', 'B', 'C'])], offsets={'A': [-4, -4], 'B': [1, -5], 'C': [3, -4], 'D': [1, 5]})

# 5. Each placement request gets its own configuration.
for part, extras in [('а', {'M': [40, 35], 'N': [58, 35]}), ('б', {'P': [12, 35], 'Q': [87, 35]}), ('в', {'K': [34, 54], 'R': [67, 17]})]:
    pts = {'A': [26, 35], 'B': [74, 35], 'a': [91, 37], **extras}
    base = scene(['A', 'B', 'a'], [['A', 'B']], lines=[['A', 'B']])
    full = scene(pts, [['A', 'B']], lines=[['A', 'B']])
    first = scene(['A', 'B', 'a', 'K'], [['A', 'B']], lines=[['A', 'B']]) if part == 'в' else base
    add(5, part, pts, base, [first, full], label_only=['a'], offsets={'a': [0, -8]}, checks=[check('collinear', points=['A', 'M', 'N', 'B'])] if part == 'а' else [check('collinear', points=['P', 'A', 'B', 'Q'])] if part == 'б' else [])

# 6. Count intervals by selecting one segment, without stacking length bars.
pts = {'A': [20, 35], 'B': [44, 35], 'C': [79, 35]}
base = scene(pts, lines=[['A', 'C']])
cases = []
for a, b in [('A', 'B'), ('B', 'C'), ('A', 'C')]:
    cases.append(scene(pts, lines=[['A', 'C']], highlightSegments=[[a, b]], label=f'Отрезок {a}{b}', availableFromStep=2))
add(6, 'single', pts, base, [base, cases[0], cases[2]], cases=cases, checks=[check('collinear', points=list(pts))])

# 7. The exact A–B–C–D order is fixed; candidate intervals are separate views.
pts = {'A': [16, 35], 'B': [36, 35], 'C': [61, 35], 'D': [84, 35]}
base = scene(pts, lines=[['A', 'D']])
candidates = [scene(pts, lines=[['A', 'D']], highlightSegments=[[a, b]], label=f'Отрезок {a}{b}', availableFromStep=1) for a, b in [('A', 'B'), ('A', 'C'), ('A', 'D'), ('B', 'C'), ('B', 'D'), ('C', 'D')]]
for part in ['а', 'б']:
    add(7, part, pts, base, [candidates[0], candidates[2], candidates[0] if part == 'а' else candidates[-1]], cases=candidates, checks=[check('collinear', points=list(pts))])

# 8. Closed and open polylines use separate vertices and unfolding sequences.
pts = {'A': [22, 20], 'B': [78, 20], 'C': [47, 55]}
add(8, 'а', pts, scene(pts), [scene(pts), scene(pts, [['A', 'B'], ['B', 'C']]), scene(pts, [['A', 'B'], ['B', 'C'], ['C', 'A']])], offsets={'A': [-3, -4], 'B': [3, -4], 'C': [1, 5]})
pts = {'A': [15, 24], 'B': [37, 54], 'C': [61, 22], 'D': [84, 49]}
openline = scene(pts, [['A', 'B'], ['B', 'C'], ['C', 'D']])
add(8, 'б', pts, scene(pts), [scene(pts), openline, openline], offsets={'A': [-4, -3], 'B': [-2, 5], 'C': [-1, -5], 'D': [3, 3]})

# 9. The postal shapes are redrawn from fig. 15, not ordinary font digits.
# One graph per view. The two routes for 8 remain methodological alternatives.
digit_paths = {
    1: [[(35, 35), (65, 60), (65, 10)]],
    2: [[(35, 60), (65, 60), (65, 35), (35, 10), (65, 10)]],
    3: [[(35, 60), (65, 60), (35, 35), (65, 35), (35, 10)]],
    4: [[(35, 60), (35, 35), (65, 35)], [(65, 60), (65, 10)]],
    5: [[(65, 60), (35, 60), (35, 35), (65, 35), (65, 10), (35, 10)]],
    6: [[(65, 60), (35, 35), (65, 35), (65, 10), (35, 10), (35, 35)]],
    7: [[(35, 60), (65, 60), (35, 35), (35, 10)]],
    8: [[(35, 35), (35, 60), (65, 60), (65, 10), (35, 10), (35, 35), (65, 35)]],
    9: [[(35, 10), (65, 35), (65, 60), (35, 60), (35, 35), (65, 35)]],
    0: [[(35, 60), (65, 60), (65, 10), (35, 10), (35, 60)]],
}
pts = {}
cases = []
for digit in [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]:
    links = []
    for path_index, path in enumerate(digit_paths[digit]):
        names = []
        for index, xy in enumerate(path):
            name = f'_d{digit}_{path_index}_{index}'
            pts[name] = xy
            names.append(name)
        links += list(zip(names, names[1:]))
    cases.append(scene([], links, label=f'Цифра {digit}', availableFromStep=0))
other_path = [(35, 35), (35, 60), (65, 60), (65, 35), (35, 35), (35, 10), (65, 10), (65, 35)]
other_names = []
for index, xy in enumerate(other_path):
    name = f'_eight_other_{index}'
    pts[name] = xy
    other_names.append(name)
other_eight = scene([], list(zip(other_names, other_names[1:])), label='Другой путь обхода восьмёрки', availableFromStep=3)
cases.append(other_eight)
first = deepcopy(cases[0])
active = deepcopy(first)
active['highlightSegments'] = [first['segments'][0]]
eight = deepcopy(cases[7])
eight['highlightSegments'] = [eight['segments'][0]]
add(9, 'single', pts, first, [active, active, eight, cases[9]], cases=cases,
    description='Почтовые цифры рисунка 15 показаны по одной. Выберите цифру, затем проследите непрерывный путь по её штрихам; допустимость пути обсуждается отдельно.')

# 10. A convex pentagon and three independently gated subdivisions.
pts = {'A': [18, 28], 'B': [32, 56], 'C': [66, 56], 'D': [83, 28], 'E': [51, 12], 'O4': [42, 42], 'O5': [50, 33]}
boundary = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'E'], ['E', 'A']]
base = scene(['A', 'B', 'C', 'D', 'E'], boundary)
three = scene(['A', 'B', 'C', 'D', 'E'], boundary + [['A', 'C'], ['A', 'D']], label='Только диагонали', availableFromStep=1)
four = scene(['A', 'B', 'C', 'D', 'E', 'O4'], boundary + [['A', 'C'], ['O4', 'D'], ['O4', 'E']], label='Дополнительная точка на диагонали', availableFromStep=3)
five = scene(['A', 'B', 'C', 'D', 'E', 'O5'], boundary + [['O5', a] for a in ['A', 'B', 'C', 'D', 'E']], label='Дополнительная внутренняя точка', availableFromStep=4)
add(10, 'single', pts, base, [three, three, four, five], cases=[three, four, five], labels={'O4': 'O', 'O5': 'O'}, offsets={'A': [-4, 0], 'B': [-3, 5], 'C': [2, 5], 'D': [4, 0], 'E': [0, -5], 'O4': [-1, -5], 'O5': [2, 3]}, checks=[check('collinear', points=['A', 'O4', 'C'])], description='Выпуклый пятиугольник. Сначала видна только граница; дополнительные точки и соединяющие отрезки показываются в отдельных вариантах.')

# 11. Equal-origin rays overlap exactly. Do not draw duplicate arrows on top.
pts = {'A': [20, 35], 'C': [47, 35], 'B': [78, 35]}
base = scene(pts, lines=[['A', 'B']])
from_a = scene(pts, rays=[['A', 'B']], label='Начало в A', availableFromStep=2)
from_b = scene(pts, rays=[['B', 'A']], label='Начало в B', availableFromStep=3)
add(11, 'а', pts, base, [base, from_a, from_b], cases=[from_a, from_b], checks=[check('collinear', points=['A', 'C', 'B'])])
left = scene(pts, rays=[['C', 'A']], label='Луч CA')
right = scene(pts, rays=[['C', 'B']], label='Противоположное направление', availableFromStep=2)
add(11, 'б', pts, left, [left, right], cases=[left, right], checks=[check('collinear', points=['A', 'C', 'B'])])

# 12. Three notation conventions, one angle at a time.
pts = {'O': [25, 21], 'A': [77, 21], 'B': [53, 56], 'V': [25, 21], 'h': [77, 21], 'k': [53, 56], 'M': [25, 21], '_m1': [77, 21], '_m2': [53, 56]}
aob = scene(['O', 'A', 'B'], rays=[['O', 'A'], ['O', 'B']], label='Обозначение тремя буквами', availableFromStep=0)
hk = scene(['h', 'k'], rays=[['V', 'h'], ['V', 'k']], label='Обозначение сторон', availableFromStep=3)
m = scene(['M'], rays=[['M', '_m1'], ['M', '_m2']], label='Обозначение вершины', availableFromStep=3)
add(12, 'single', pts, aob, [aob, aob, hk], cases=[aob, hk, m], label_only=['h', 'k'], offsets={'O': [-4, -4], 'M': [-4, -4], 'A': [0, -5], 'B': [-5, 2], 'h': [0, -5], 'k': [-5, 2]})

# 13. Opposite rays in each separate straight-angle drawing.
pts = {'A': [20, 35], 'O': [50, 35], 'B': [80, 35], 'C': [20, 35], 'D': [50, 35], 'E': [80, 35]}
aob = scene(['A', 'O', 'B'], rays=[['O', 'A'], ['O', 'B']], label='Первый рисунок')
cde = scene(['C', 'D', 'E'], rays=[['D', 'C'], ['D', 'E']], label='Второй рисунок', availableFromStep=3)
add(13, 'single', pts, aob, [aob, aob, cde], cases=[aob, cde], checks=[check('angle', points=['A', 'O', 'B'], degrees=180), check('angle', points=['C', 'D', 'E'], degrees=180)])

# 14. Three distinct rays and one selected angular pair at a time.
pts = {'O': [23, 22], 'h': [79, 22], 'k': polar([23, 22], 31, 58), 'l': polar([23, 22], 63, 43)}
rays = [['O', n] for n in ['h', 'k', 'l']]
base = scene(pts, rays=rays)
cases = [scene(pts, rays=rays, angleArcs=[arc('O', a, b)], label=f'Стороны {a} и {b}', availableFromStep=1) for a, b in [('h', 'k'), ('h', 'l'), ('k', 'l')]]
add(14, 'single', pts, base, [cases[0], cases[1], cases[2]], cases=cases, label_only=['h', 'k', 'l'], offsets={'O': [-4, -4], 'h': [0, -4], 'k': [3, 1], 'l': [1, 4]})

# 15. Place inside, outside and boundary points in different views.
pts = {'O': [20, 16], 'h': [85, 16], 'k': [51, 59], 'A': [48, 24], 'B': [58, 39], 'C': [19, 49], 'D': [74, 7], 'E': [66, 16], 'F': [35.5, 37.5]}
rays = [['O', 'h'], ['O', 'k']]
base = scene(['O', 'h', 'k'], rays=rays)
inside = scene(['O', 'h', 'k', 'A', 'B'], rays=rays)
outside = scene(['O', 'h', 'k', 'C', 'D'], rays=rays)
boundary = scene(['O', 'h', 'k', 'E', 'F'], rays=rays)
inside['label'], outside['label'], boundary['label'] = 'Первая пара точек', 'Вторая пара точек', 'Точки на сторонах'
for s in [inside, outside, boundary]:
    s['availableFromStep'] = 2 if s is inside else 3
add(15, 'single', pts, base, [base, inside, outside], cases=[inside, outside, boundary], label_only=['h', 'k'], offsets={'O': [-4, -4], 'h': [1, -4], 'k': [1, 4], 'F': [-5, 0], 'E': [0, -4], 'D': [1, 3]}, checks=[check('collinear', points=['O', 'E', 'h']), check('collinear', points=['O', 'F', 'k'])])

# 16. Inside/outside whole segments, followed by an explicit counterexample.
pts = {'O': [18, 18], 'h': [88, 18], 'k': [54, 59], 'A': [39, 25], 'B': [69, 37], 'M': [38, 8], 'N': [76, 10], 'Mc': [24, 58], 'Nc': [81, 7]}
rays = [['O', 'h'], ['O', 'k']]
base = scene(['O', 'h', 'k'], rays=rays)
inside = scene(['O', 'h', 'k', 'A', 'B'], [['A', 'B']], rays=rays)
full = scene(['O', 'h', 'k', 'A', 'B', 'M', 'N'], [['A', 'B'], ['M', 'N']], rays=rays)
counter = scene(['O', 'h', 'k', 'Mc', 'Nc'], [['Mc', 'Nc']], rays=rays, label='Проверка всего отрезка: другой пример', availableFromStep=3,
                note='Это неудачный выбор: оба конца снаружи, но отрезок пересекает внутреннюю область. Вернитесь к варианту «Выбранное построение», чтобы увидеть подходящий отрезок.')
add(16, 'single', pts, base, [inside, full, counter], cases=[dict(full, label='Выбранное построение', availableFromStep=2), counter], labels={'Mc': 'M', 'Nc': 'N'}, label_only=['h', 'k'], offsets={'O': [-4, -3], 'h': [0, -4], 'k': [0, 4], 'M': [-3, -4], 'N': [2, -4], 'Mc': [-4, 2], 'Nc': [1, -2]})

# 17. An internal ray and an external ray are independent views/cards.
pts = {'O': [23, 20], 'A': [81, 20], 'B': polar([23, 20], 55, 48), 'C': polar([23, 20], 25, 58), 'D': [36, 60]}
base = scene(['O', 'A', 'B'], rays=[['O', 'A'], ['O', 'B']])
inner = scene(['O', 'A', 'B', 'C'], rays=[['O', n] for n in ['A', 'B', 'C']])
add(17, 'а', pts, base, [base, inner, inner], offsets={'O': [-4, -4], 'A': [0, -4], 'B': [0, 4], 'C': [3, 0]})
base2 = scene(['O', 'A', 'C'], rays=[['O', 'A'], ['O', 'C']])
external = scene(['O', 'A', 'C', 'D'], rays=[['O', n] for n in ['A', 'C', 'D']])
add(17, 'б', pts, base2, [base2, external, external], offsets={'O': [-4, -4], 'A': [0, -4], 'C': [3, 0], 'D': [1, 4]})

# 18. Oblique intersecting lines, with only one arc selected.
pts = {'O': [50, 35], 'A': [17, 35], 'B': [83, 35], 'C': [28, 12], 'D': [72, 58]}
base = scene(pts, lines=[['A', 'B'], ['C', 'D']])
cases = [scene(pts, lines=[['A', 'B'], ['C', 'D']], angleArcs=[arc('O', a, b, 10)], label=f'Стороны O{a} и O{b}', availableFromStep=3) for a, b in [('A', 'C'), ('C', 'B'), ('B', 'D'), ('D', 'A')]]
straight = scene(pts, lines=[['A', 'B'], ['C', 'D']], angleArcs=[arc('O', 'A', 'B', 11)])
add(18, 'single', pts, base, [base, straight, cases[0]], cases=cases, checks=[check('collinear', points=['A', 'O', 'B']), check('collinear', points=['C', 'O', 'D'])], offsets={'A': [-2, -5], 'B': [1, -5], 'C': [-4, -3], 'D': [1, 4], 'O': [2, -5]})

# 19. Relative positions follow fig. 22: h right, k up-left.
pts = {'O': [33, 20], 'h': [86, 20], 'k': [18, 62], 'A': [62, 36], 'M': [58, 56], 'C': [17, 39], 'N': [57, 10], 'D': [23, 48], 'B': [72, 20]}
base = scene(pts, rays=[['O', 'h'], ['O', 'k']])
inside = scene(['O', 'h', 'k', 'A', 'M'], rays=[['O', 'h'], ['O', 'k']])
outside = scene(['O', 'h', 'k', 'C', 'N'], rays=[['O', 'h'], ['O', 'k']])
boundary = scene(['O', 'h', 'k', 'D', 'B'], rays=[['O', 'h'], ['O', 'k']])
add(19, 'single', pts, base, [base, inside, boundary], cases=[dict(inside, label='Первая пара', availableFromStep=2), dict(outside, label='Вторая пара', availableFromStep=2), dict(boundary, label='Точки на границе', availableFromStep=3)], label_only=['h', 'k'], offsets={'O': [-4, -4], 'h': [0, -4], 'k': [-4, 0], 'D': [-5, 0], 'B': [1, -4], 'C': [-4, 0], 'N': [1, -3]}, checks=[check('collinear', points=['O', 'D', 'k']), check('collinear', points=['O', 'B', 'h'])])

# 20. The seven ray directions reproduce fig. 23 without internal labels.
pts = {'O': [24, 29], 'A': polar([24, 29], 35, 53), 'B': [83, 29], 'h': polar([24, 29], 8, 64), 'l': polar([24, 29], 22, 59), 'n': [24, 61], 'm': [13, 14], 'k': polar([24, 29], -22, 58)}
rays = [['O', n] for n in ['A', 'B', 'h', 'l', 'n', 'm', 'k']]
base = scene(pts, rays=rays)
cases = [scene(pts, rays=rays, highlightSegments=[['O', n]], label=f'Луч {n}', availableFromStep=1) for n in ['h', 'l', 'n', 'm', 'k']]
add(20, 'single', pts, base, [base, cases[0], cases[2]], cases=cases, label_only=['h', 'l', 'n', 'm', 'k'], offsets={'O': [-4, -3], 'A': [0, 4], 'B': [1, -4], 'h': [-1, 6], 'l': [-2.3, 5.6], 'n': [-4, 0], 'm': [-3, -2], 'k': [2.3, 5.6]})

# 21. The fixed order is O–B–A–C; comparison retains a common origin.
pts = {'O': [15, 35], 'B': [35, 35], 'A': [59, 35], 'C': [83, 35]}
base = scene(pts, rays=[['O', 'C']])
cases = [scene(pts, rays=[['O', 'C']], highlightSegments=[['O', a]], label=f'Отрезок O{a}', availableFromStep=1) for a in ['B', 'A', 'C']]
add(21, 'single', pts, base, [cases[0], cases[2], cases[2]], cases=cases, checks=[check('collinear', points=['O', 'B', 'A', 'C'])])

# 22. A midpoint; translated copies are shown below the original only on steps.
pts = {'A': [20, 46], 'O': [50, 46], 'B': [80, 46], 'U': [20, 20], 'V': [50, 20], 'W': [80, 20]}
marks = [eq('A', 'O'), eq('O', 'B')]
base = scene(['A', 'O', 'B'], [['A', 'B']], equalSegments=marks)
copy_half = scene(['A', 'O', 'B', 'U', 'V'], [['A', 'B'], ['U', 'V']], equalSegments=marks)
superposed = scene(['A', 'O', 'B'], [['A', 'B']], equalSegments=marks, highlightSegments=[['O', 'B']])
add(22, 'а', pts, base, [copy_half, superposed], cases=[dict(copy_half, label='Копия половины', availableFromStep=1), dict(superposed, label='Копия перенесена к O', availableFromStep=2)], labels={'U': 'A′', 'V': 'O′', 'W': 'B′'}, checks=[check('collinear', points=['A', 'O', 'B']), check('equalLength', segments=[['A', 'O'], ['O', 'B']]), check('equalLength', segments=[['U', 'V'], ['O', 'B']])])
add(22, 'б', pts, base, [copy_half, copy_half], labels={'U': 'O′', 'V': 'A′'}, checks=[check('collinear', points=['A', 'O', 'B']), check('equalLength', segments=[['A', 'O'], ['O', 'B']]), check('distanceRatio', segments=[['A', 'B'], ['U', 'V']], ratio=2)])

# 23. Five equally spaced points. One requested interval is selected per view.
pts = {name: [14 + 18 * i, 35] for i, name in enumerate('ABCDE')}
marks = [eq(a, b) for a, b in zip('ABCD', 'BCDE')]
base = scene(pts, [['A', 'E']], equalSegments=marks)
def selected(a, b, label, start):
    return scene(pts, [['A', 'E']], equalSegments=marks, highlightSegments=[[a, b]], label=label, availableFromStep=start)
for part, pairs in [('а', [('A', 'C'), ('A', 'E'), ('C', 'E')]), ('б', [('C', 'E')]), ('в', [('B', 'D'), ('A', 'E')])]:
    ss = [selected(a, b, f'Отрезок {a}{b}', i + 1) for i, (a, b) in enumerate(pairs)]
    add(23, part, pts, base, ss, cases=ss, checks=[check('collinear', points=list(pts)), check('equalLength', segments=[['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'E']])])

# 24. An internal ray; comparison arcs appear one at a time.
pts = {'O': [23, 20], 'A': [83, 20], 'B': polar([23, 20], 58, 48), 'C': polar([23, 20], 25, 59)}
rays = [['O', n] for n in ['A', 'B', 'C']]
base = scene(pts, rays=rays)
sub = scene(pts, rays=rays, angleArcs=[arc('O', 'A', 'C', 12)])
rest = scene(pts, rays=rays, angleArcs=[arc('O', 'C', 'B', 12)])
whole = scene(pts, rays=rays, angleArcs=[arc('O', 'A', 'B', 15)])
add(24, 'single', pts, base, [sub, rest, whole], cases=[dict(sub, label='Угол AOC', availableFromStep=1), dict(whole, label='Угол AOB', availableFromStep=3)], offsets={'O': [-4, -4], 'A': [0, -4], 'B': [0, 4], 'C': [3, 0]}, checks=[check('angle', points=['A', 'O', 'C'], degrees=25), check('angle', points=['A', 'O', 'B'], degrees=58)])

# 25. A genuine angle bisector; copies are translated instead of overlapping text.
pts = {'O': [20, 18], 'h': polar([20, 18], 0, 52), 'l': polar([20, 18], 25, 52), 'k': polar([20, 18], 50, 52),
       'U': [20, 18], '_uh': polar([20, 18], 0, 52), '_ul': polar([20, 18], 25, 52)}
rays = [['O', n] for n in ['h', 'l', 'k']]
marks = [arc('O', 'h', 'l', 11, 1), arc('O', 'l', 'k', 11, 1)]
base = scene(['O', 'h', 'l', 'k'], rays=rays, angleArcs=marks)
left = scene(['O', 'h', 'l'], rays=[['O', 'h'], ['O', 'l']], angleArcs=[arc('O', 'h', 'l', 12)], label='Угол hl', availableFromStep=1)
right = scene(['O', 'l', 'k'], rays=[['O', 'l'], ['O', 'k']], angleArcs=[arc('O', 'l', 'k', 12)], label='Угол lk', availableFromStep=2)
whole = scene(['O', 'h', 'k'], rays=[['O', 'h'], ['O', 'k']], angleArcs=[arc('O', 'h', 'k', 12)], label='Угол hk', availableFromStep=1)
for part, ss in [('а', [left, right]), ('б', [left, whole])]:
    add(25, part, pts, base, ss, cases=ss, label_only=['h', 'l', 'k'], offsets={'O': [-4, -4], 'h': [1, -4], 'l': [3, 1], 'k': [1, 4]}, checks=[check('angle', points=['h', 'O', 'l'], degrees=25), check('angle', points=['l', 'O', 'k'], degrees=25)])

# 26. Six rays in the exact A…F angular order, with equal adjacent angles.
pts = {'O': [19, 32]}
for i, name in enumerate('ABCDEF'):
    pts[name] = polar([19, 32], 54 - 18 * i, 36)
rays = [['O', n] for n in 'ABCDEF']
marks = [arc('O', a, b, 12, 1) for a, b in zip('ABCDE', 'BCDEF')]
base = scene(pts, rays=rays, angleArcs=marks)
def angle_selection(a, b, middle=None, start=1):
    s = scene(pts, rays=rays, angleArcs=[arc('O', a, b, 18)], label=f'Угол {a}O{b}', availableFromStep=start)
    if middle:
        s['highlightSegments'] = [['O', middle]]
    return s
ss = [angle_selection('A', 'C', 'B', 1), angle_selection('B', 'F', 'D', 2), angle_selection('A', 'E', 'C', 3)]
checks = [check('angle', points=[a, 'O', b], degrees=18) for a, b in zip('ABCDE', 'BCDEF')]
offsets = {'O': [-4, -4], 'A': [-4, 2], 'B': [-1, 5], 'C': [0, 6], 'D': [0, 5], 'E': [0, -6], 'F': [-4, -4]}
add(26, 'а', pts, base, ss, cases=ss, checks=checks, offsets=offsets)
ss = [angle_selection('B', 'D', 'C', 1), angle_selection('A', 'E', 'C', 2)]
add(26, 'б', pts, base, [ss[0], ss[1], ss[1]], cases=ss, checks=checks, offsets=offsets)
partial = scene(['O', 'B', 'C', 'D'], rays=[['O', n] for n in 'BCD'], angleArcs=[arc('O', 'B', 'C', 12, 1), arc('O', 'C', 'D', 12, 1)])
ss = [scene(['O', 'B', 'C', 'D'], rays=[['O', n] for n in 'BCD'], angleArcs=[arc('O', a, b, 16)], label=f'Угол {a}O{b}', availableFromStep=i + 1) for i, (a, b) in enumerate([('B', 'C'), ('B', 'D')])]
add(26, 'сравнение', pts, partial, ss, cases=ss, checks=checks, offsets=offsets)

# 27. An unnumbered cover and ruler; the student's measured values stay in text.
pts = {'A': [28, 19], 'B': [70, 19], 'C': [70, 59], 'D': [28, 59], '_r0': [22, 12], '_r1': [79, 12], '_r2': [79, 16], '_r3': [22, 16], '_v0': [77, 18], '_v1': [77, 62], '_v2': [81, 62], '_v3': [81, 18]}
book = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']]
h_rule = [['_r0', '_r1'], ['_r1', '_r2'], ['_r2', '_r3'], ['_r3', '_r0']]
v_rule = [['_v0', '_v1'], ['_v1', '_v2'], ['_v2', '_v3'], ['_v3', '_v0']]
for i in range(12):
    pts[f'_h{i}a'] = [28 + 4 * i, 12]
    pts[f'_h{i}b'] = [28 + 4 * i, 15 if i % 2 == 0 else 14]
    h_rule.append([f'_h{i}a', f'_h{i}b'])
for i in range(10):
    pts[f'_v{i}a'] = [77, 19 + 4.5 * i]
    pts[f'_v{i}b'] = [80 if i % 2 == 0 else 79, 19 + 4.5 * i]
    v_rule.append([f'_v{i}a', f'_v{i}b'])
base = scene([], book)
hview = scene([], book + h_rule, label='Измеряем одну сторону', availableFromStep=1)
vview = scene([], book + v_rule, label='Измеряем другую сторону', availableFromStep=2)
add(27, 'single', pts, base, [hview, vview, vview], cases=[hview, vview], checks=[check('perpendicular', segments=[['A', 'B'], ['B', 'C']]), check('parallel', segments=[['A', 'B'], ['D', 'C']])], description='Обложка показана условным прямоугольником. Ненумерованная линейка переносится к измеряемой стороне; свои размеры нужно измерить на настоящей книге.')

# 28. Side-on paper block, separate cover strokes and a separate sheet view.
pts = {'_tl': [20, 52], '_tr': [80, 52], '_bl': [20, 22], '_br': [80, 22], '_cover1a': [16, 57], '_cover1b': [84, 57], '_cover2a': [16, 17], '_cover2b': [84, 17], '_measureA': [88, 22], '_measureB': [88, 52], '_cap1a': [85, 22], '_cap1b': [91, 22], '_cap2a': [85, 52], '_cap2b': [91, 52], '_sheetA': [20, 36], '_sheetB': [80, 36], '_sheetC': [80, 34], '_sheetD': [20, 34]}
block = [['_tl', '_tr'], ['_tr', '_br'], ['_br', '_bl'], ['_bl', '_tl'], ['_cover1a', '_cover1b'], ['_cover2a', '_cover2b']]
for i in range(1, 8):
    pts[f'_p{i}a'] = [20, 22 + 30 * i / 8]
    pts[f'_p{i}b'] = [80, 22 + 30 * i / 8]
    block.append([f'_p{i}a', f'_p{i}b'])
base = scene([], block)
measure = scene([], block + [['_measureA', '_measureB'], ['_cap1a', '_cap1b'], ['_cap2a', '_cap2b']])
sheet = scene([], [['_sheetA', '_sheetB'], ['_sheetB', '_sheetC'], ['_sheetC', '_sheetD'], ['_sheetD', '_sheetA']], label='Отдельный лист — увеличено', availableFromStep=2)
add(28, 'single', pts, base, [measure, sheet, sheet], cases=[dict(measure, label='Бумажный блок без обложки', availableFromStep=1), sheet], description='Условный профиль бумажного блока: две линии обложки отделены зазорами. Число нарисованных прослоек не задаёт число листов настоящей книги.')

# 29. Fig. 36: common scale, interval count (not mark count), no printed answers.
pts = {}
segments = []
for a, b, units, y in [('C', 'D', 6, 59), ('E', 'F', 5, 47), ('P', 'Q', 3, 35), ('A', 'B', 2, 23), ('K', 'L', 1, 11)]:
    pts[a], pts[b] = [18, y], [18 + 10 * units, y]
    segments.append([a, b])
    for j in range(1, units):
        pts[f'_{a}{j}a'], pts[f'_{a}{j}b'] = [18 + 10 * j, y - 1.5], [18 + 10 * j, y + 1.5]
        segments.append([f'_{a}{j}a', f'_{a}{j}b'])
shown = list('CDEFPQABKL')
base = scene(shown, segments)
checks = [check('distanceRatio', segments=[[a, b], ['K', 'L']], ratio=r) for a, b, r in [('C', 'D', 6), ('E', 'F', 5), ('P', 'Q', 3), ('A', 'B', 2)]]
offsets = {n: [-5, 0] if n in 'CEPAK' else [4, 0] for n in shown}
for part, unit in [('а', ['K', 'L']), ('б', ['A', 'B'])]:
    active = deepcopy(base)
    active['highlightSegments'] = [unit]
    cases = [scene(shown, segments, highlightSegments=[[a, b]], label=f'Отрезок {a}{b}', availableFromStep=1) for a, b in [('K', 'L'), ('A', 'B'), ('P', 'Q'), ('E', 'F'), ('C', 'D')]]
    add(29, part, pts, active, [active, cases[-1], cases[-1]], cases=cases, checks=checks, offsets=offsets, description='Пять отрезков из рисунка 36 в едином масштабе. На отрезках отмечены только внутренние деления; числа вычисляются отдельно.')

# 30. One original segment and one requested construction per card.
for part, factor, name in [('2AB', 2, 'M'), ('1/2AB', .5, 'N'), ('1/4AB', .25, 'P')]:
    length = 30 if factor == 2 else 64
    pts = {'A': [18, 51], 'B': [18 + length, 51], 'O': [18, 20], 'h': [88, 20], name: [18 + length * factor, 20]}
    base = scene(['A', 'B', 'O', 'h'], [['A', 'B']], rays=[['O', 'h']])
    divided = deepcopy(base)
    if factor < 1:
        count = round(1 / factor)
        division_names = ['A']
        for i in range(1, count):
            nm = f'_division{i}'
            pts[nm] = [18 + length * i / count, 51]
            division_names.append(nm)
            pts[f'_tick{i}a'], pts[f'_tick{i}b'] = [18 + length * i / count, 49], [18 + length * i / count, 53]
            divided['segments'].append([f'_tick{i}a', f'_tick{i}b'])
        division_names.append('B')
        divided['equalSegments'] = [eq(a, b) for a, b in zip(division_names, division_names[1:])]
    completed = deepcopy(divided)
    completed['points'].append(name)
    completed['highlightSegments'] = [['O', name]]
    add(30, part, pts, base, [base, divided, completed], label_only=['h'], checks=[check('distanceRatio', segments=[['O', name], ['A', 'B']], ratio=factor)], offsets={'A': [-2, 4], 'B': [1, 4], 'O': [-3, -4], 'h': [1, -4], name: [1, -4]}, description='Данный отрезок AB расположен отдельно над лучом h. Конечная точка искомого отрезка появляется на последнем шаге построения.')


# Questions precede the frozen explanations; reasons name the actual property.
def did(number, part, rows, theory=()):
    item = next(m for m in MODELS if (m['number'], m['part']) == (number, part))
    assert len(rows) == len(PARTS[number, part]['steps']), (number, part)
    item['didactics'] = {'steps': [dict(prompt=p, justification=j, theoryPoints=list(theory)) for p, j in rows]}


did(1, 'single', [
    ('Как изобразить прямую a?', 'Прямая не имеет концов; на рисунке изображается только видимая её часть.'),
    ('Какие из пяти точек должны лежать на прямой?', 'По условию A и B принадлежат прямой a, а P, Q и R не принадлежат ей.'),
    ('Каким знаком записывают принадлежность точки прямой?', 'Символ ∈ обозначает принадлежность, а ∉ — отсутствие принадлежности.')], [1])
did(2, 'single', [
    ('Какую прямую задают точки A и B?', 'Через две различные точки проходит ровно одна прямая.'),
    ('Совпадёт ли прямая AC с уже проведённой AB?', 'Точка C не лежит на AB по условию, поэтому прямая AC отличается от AB.'),
    ('Осталась ли ещё пара точек? Будет ли её прямая новой?', 'Если BC совпала бы с AB или AC, все три точки лежали бы на одной прямой, вопреки условию.')], [1])
did(3, 'single', [
    ('Могут ли все три прямые проходить через одну точку?', 'Попарное пересечение не запрещает общего для всех трёх прямых пересечения.'),
    ('Что получится, если третья прямая не проходит через пересечение первых двух?', 'Она пересекает каждую из первых двух прямых в отдельной точке: совпадение этих точек означало бы прохождение через их общее пересечение.'),
    ('Почему ровно двух точек пересечения быть не может?', 'Через две различные точки проходит только одна прямая; две разные прямые не имеют двух общих точек.')], [1])
did(4, 'single', [
    ('Сколько различных прямых задают пары из A, B, C?', 'Точки A, B, C коллинеарны; любые две из них определяют одну и ту же прямую.'),
    ('Какие новые прямые можно провести через D?', 'D не лежит на прямой ABC; прямые DA, DB, DC различны, иначе D оказалась бы на ABC.'),
    ('Как избежать повторного подсчёта совпадающих прямых?', 'Считаются различные прямые, а не различные записи пар точек.')], [1])
for part, row in {
    'а': [('Какая часть прямой является отрезком AB?', 'Отрезок AB состоит из точек A, B и всех точек прямой между ними.'), ('Где можно поставить M и N?', 'Точка внутри отрезка принадлежит отрезку и содержащей его прямой.')],
    'б': [('Какие части прямой находятся вне отрезка AB?', 'Прямая продолжается по обе стороны от концов A и B.'), ('Выберите положения P и Q на этих продолжениях.', 'Точка может принадлежать прямой и не принадлежать выделенному на ней отрезку.')],
    'в': [('Где поставить точку K, чтобы она не лежала на прямой a?', 'Точка вне линии, изображающей a, не принадлежит этой прямой.'), ('Выберите вторую точку R вне прямой.', 'Условие требует непринадлежности прямой для каждой из двух точек по отдельности.')],
}.items():
    did(5, part, row, [1])
did(6, 'single', [
    ('Как назвать три отмеченные точки?', 'У каждого отрезка два конца; имена точек помогают не повторять один и тот же отрезок.'),
    ('Как выбрать все пары концов без повторений?', 'Пара различных точек определяет один отрезок; AB и BA — один и тот же отрезок.'),
    ('Учтён ли отрезок между крайними точками?', 'Отрезок может содержать другую отмеченную точку внутри; это не мешает считать его отдельным отрезком.')], [1])
did(7, 'а', [
    ('Какие отрезки задают пары четырёх точек?', 'Каждая пара различных точек даёт отрезок; порядок записи концов не меняет отрезок.'),
    ('Как проверить, лежит ли C на выбранном отрезке?', 'Отрезку принадлежат оба конца и все точки прямой между ними.'),
    ('Почему C не принадлежит AB?', 'В порядке A–B–C–D точка C находится за концом B отрезка AB.')], [1])
did(7, 'б', [
    ('Нужно ли считать принадлежность B, когда B является концом?', 'Оба конца входят в отрезок.'),
    ('Какие из шести отрезков содержат B?', 'При порядке A–B–C–D точка B либо конец, либо внутренняя точка пяти отрезков.'),
    ('Какой отрезок расположен целиком по другую сторону от B?', 'Обе точки C и D лежат дальше B в одном направлении, поэтому B не принадлежит CD.')], [1])
did(8, 'а', [
    ('Как выбрать вершины, чтобы соседние звенья не лежали на одной прямой?', 'Смежные звенья ломаной соединяются концами и не лежат на одной прямой.'),
    ('Как провести первые два звена?', 'Первые два звена AB и BC имеют общую вершину B.'),
    ('Куда должно прийти последнее звено замкнутой ломаной?', 'У замкнутой ломаной конец последнего звена совпадает с началом первого.')], [1])
did(8, 'б', [
    ('Сколько вершин удобно выбрать для незамкнутой ломаной из трёх звеньев?', 'У последовательных трёх звеньев имеются начало, две промежуточные вершины и конец.'),
    ('В каком порядке соединить выбранные вершины?', 'Смежные звенья должны иметь общий конец и не лежать на одной прямой.'),
    ('Как проверить, что ломаная не замкнута?', 'Начальная и конечная точки незамкнутой ломаной различны.')], [1])
did(9, 'single', [
    ('Можно ли пройти выбранную цифру одной непрерывной трассой?', 'Последовательные звенья ломаной соединяются общими концами; разветвлённую запись нельзя считать одной ломаной без выбора пути.'),
    ('Где при выбранном пути заканчивается одно звено и начинается следующее?', 'Соседние звенья ломаной не лежат на одной прямой; прямолинейный участок без поворота не делят только из-за промежуточной точки.'),
    ('Запрещает ли определение повторное посещение вершины?', 'Указанное определение не запрещает общих точек несмежных звеньев; нужно отдельно оговорить путь и повторение штрихов.'),
    ('Совпадают ли начало и конец выбранной трассы?', 'Замкнутость определяется совпадением начала и конца всей ломаной, а не только наличием внутри неё замкнутого участка.')], [1])
did(10, 'single', [
    ('Какие диагонали из A разбивают пятиугольник на треугольники?', 'В выпуклом пятиугольнике диагонали AC и AD лежат внутри него; каждая полученная часть имеет сторону исходного пятиугольника.'),
    ('Какие четырёхугольники получаются объединением соседних частей?', 'При объединении соседних треугольников их общая сторона становится внутренним отрезком; граница объединения имеет четыре стороны.'),
    ('Как изменится построение, если разрешить точку на диагонали AC?', 'Точка внутри AC вместе с отрезками к D и E делит ACDE на три треугольника, сохраняя ABC; каждый имеет целую сторону исходного пятиугольника.'),
    ('Что получится, если соединить внутреннюю точку со всеми вершинами?', 'Выпуклый пятиугольник разбивается этими отрезками на треугольники с непересекающимися внутренностями; основанием каждого служит исходная сторона.')], [1])
did(11, 'а', [
    ('Как расположены A, C, B на прямой?', 'C находится внутри AB по условию.'),
    ('Совпадают ли начало и направление лучей AB и AC?', 'Луч задаётся началом и направлением; точки C и B лежат по одну сторону от A.'),
    ('Какие лучи совпадают при начале B?', 'Точки C и A лежат по одну сторону от B, поэтому соответствующие лучи совпадают.')], [3])
did(11, 'б', [
    ('В какой точке должно начинаться продолжение CA?', 'Дополнительные лучи имеют одно общее начало.'),
    ('В каком направлении нужно продолжить CA за C?', 'Дополнительный луч лежит на той же прямой и направлен в противоположную сторону; порядок A–C–B задан условием.')], [3])
did(12, 'single', [
    ('Какие два луча зададут неразвёрнутый угол?', 'Угол образован двумя лучами с общим началом; его стороны здесь не являются противоположными лучами.'),
    ('Где записывают букву вершины в обозначении ∠AOB?', 'В обозначении угла тремя буквами вершину записывают посередине.'),
    ('Как подписать угол названиями сторон или одной вершиной?', 'Угол можно обозначить названиями его сторон; одной буквы вершины достаточно, если нужный угол определяется однозначно.')], [4])
did(13, 'single', [
    ('Где выбрать вершину развёрнутого угла?', 'Вершина располагается на прямой между точками, задающими противоположные направления.'),
    ('Какими должны быть стороны такого угла?', 'Стороны развёрнутого угла — два дополнительных луча.'),
    ('Как обозначить второй рисунок, не смешивая его с первым?', 'Буква вершины ставится посередине трёхбуквенного обозначения; разные рисунки могут иметь разные имена точек.')], [3, 4])
did(14, 'single', [
    ('Сколько лучей нужно выбрать, чтобы получить один угол?', 'Один угол образуется двумя лучами с общим началом.'),
    ('Как выписать все пары из h, k, l без повторений?', 'Для трёх различных лучей имеются три неупорядоченные пары.'),
    ('Создаёт ли перестановка названий сторон новый угол?', 'В рассматриваемом обозначении пара h,k задаёт тот же угол, что и пара k,h.')], [4])
did(15, 'single', [
    ('Какая область лежит внутри выбранного неразвёрнутого угла?', 'Внутренняя область находится между его сторонами; сами стороны к внутренним точкам не относятся.'),
    ('Где разместить A и B, чтобы они не попали на стороны?', 'Внутренняя точка находится строго между граничными лучами.'),
    ('Как различить внешние точки и точки на сторонах?', 'Точки на сторонах принадлежат границе угла и не являются ни внутренними, ни внешними.')], [4])
did(16, 'single', [
    ('Как расположить A и B, чтобы весь AB находился внутри угла?', 'Внутренняя область неразвёрнутого угла выпукла: отрезок между двумя внутренними точками целиком находится внутри.'),
    ('Где удобно поставить M и N, чтобы весь отрезок был внешним?', 'Если обе точки лежат строго по внешнюю сторону одной граничной прямой, весь соединяющий их отрезок лежит в той же полуплоскости.'),
    ('Достаточно ли проверить только внешнее положение концов?', 'Внешняя область угла не выпукла: отрезок с двумя внешними концами может пересекать внутреннюю область.')], [4])
did(17, 'а', [
    ('Откуда должен выходить луч, разделяющий угол?', 'Разделяющий угол луч должен иметь то же начало, что и обе стороны угла.'),
    ('В каком направлении провести OC?', 'Луч с началом в вершине проходит строго внутри угла и не совпадает со стороной.'),
    ('Какие две части получаются?', 'Внутренний луч является общей стороной двух полученных углов; другие стороны — исходные OA и OB.')], [4])
did(17, 'б', [
    ('Какой угол сейчас требуется не разделить?', 'В этом подпункте рассматривается ∠AOC, а не весь исходный ∠AOB.'),
    ('Где можно провести OD?', 'Луч из O, лежащий вне ∠AOC, не проходит через его внутреннюю область.'),
    ('Почему выбранный OD не делит внутреннюю область?', 'Разделяющий луч должен идти внутри угла; внешнее направление этому условию не отвечает.')], [4])
did(18, 'single', [
    ('Сколько лучей выходит из точки пересечения?', 'Каждая из двух прямых даёт два противоположных луча с общим началом.'),
    ('Какие пары нужно исключить при счёте неразвёрнутых углов?', 'Два луча, лежащие на одной прямой в противоположных направлениях, образуют развёрнутый угол.'),
    ('Сколько остальных пар лучей осталось?', 'Из шести пар четырёх лучей две пары противоположные; остальные пары определяют неразвёрнутые углы.')], [3, 4])
did(19, 'single', [
    ('Где находится внутренняя область между h и k?', 'Стороны угла служат границей внутренней области; положение точек оценивается относительно обеих сторон.'),
    ('Какие точки находятся строго внутри, а какие снаружи?', 'На исходном рисунке A и M лежат между лучами, C и N — во внешней области.'),
    ('Как классифицировать B, D и вершину O?', 'Точки сторон и вершина относятся к границе; они не являются внутренними или внешними точками угла.')], [4])
did(20, 'single', [
    ('Какими лучами ограничен именно ∠AOB?', 'В трёхбуквенном обозначении средняя буква O задаёт вершину, а OA и OB — стороны.'),
    ('Какие лучи проходят строго между OA и OB?', 'Только внутренний луч с началом O разделяет данный угол.'),
    ('Почему остальные лучи не подходят?', 'В исходной конфигурации n, m, k проходят вне ∠AOB, поэтому не разделяют его внутреннюю область.')], [4])
did(21, 'single', [
    ('Какой из отрезков OB и OA заканчивается раньше на луче?', 'При порядке O–B–A отрезок OB составляет собственную часть OA.'),
    ('Как соотносятся OA и OC?', 'При порядке O–A–C отрезок OA составляет собственную часть OC.'),
    ('Как получить сравнение OB и OC?', 'Если OB меньше OA, а OA меньше OC, то OB меньше OC по транзитивности сравнения.')], [6])
did(22, 'а', [
    ('Что означает утверждение «O — середина AB»?', 'Середина лежит на отрезке и делит его на два равных отрезка.'),
    ('Можно ли совместить два равных отрезка?', 'Равными называют отрезки, которые можно совместить наложением.')], [5, 6])
did(22, 'б', [
    ('Из каких частей состоит AB?', 'O — середина AB, поэтому AB составлен из равных OA и OB.'),
    ('Может ли часть OA полностью совпасть с целым AB?', 'Собственная часть отрезка меньше целого; неравные отрезки нельзя совместить наложением.')], [5, 6])
did(23, 'а', [
    ('Какая точка делит AC на равные части?', 'AB и BC равны по условию, а B лежит между A и C.'),
    ('Какая точка делит AE на две одинаковые группы частей?', 'Слева и справа от C содержится по два равных соседних отрезка.'),
    ('Какая точка делит CE пополам?', 'CD и DE равны по условию, а D лежит между C и E.')], [6])
did(23, 'б', [
    ('Какие отмеченные точки лежат по разные стороны от D?', 'При порядке A–B–C–D–E только E лежит справа от D.'),
    ('Какая точка слева удалена от D на столько же, сколько E?', 'CD = DE по условию; середина отрезка должна быть равноудалена от его концов.')], [6])
did(23, 'в', [
    ('Какие ближайшие точки симметрично расположены по обе стороны C?', 'BC = CD по условию; C лежит между B и D.'),
    ('Есть ли ещё пара отмеченных точек на равных расстояниях от C?', 'AC и CE состоят каждый из двух равных соседних частей; C лежит между A и E.')], [6])
did(24, 'single', [
    ('Какую часть ∠AOB занимает ∠AOC?', 'OC — внутренний луч, поэтому ∠AOC является частью исходного угла.'),
    ('Остаётся ли ещё ненулевой угол после ∠AOC?', 'OC не совпадает с OB, следовательно, ∠COB имеет положительную величину.'),
    ('Как сравнить целый угол и его собственную часть?', 'Угол больше каждой своей собственной части.')], [6])
did(25, 'а', [
    ('Какие углы равны по условию о биссектрисе?', 'Биссектриса делит угол на два равных угла.'),
    ('Когда два угла можно совместить наложением?', 'Равными называют углы, которые можно совместить наложением.')], [5, 6])
did(25, 'б', [
    ('Какую часть ∠hk составляет ∠hl?', 'По условию l — биссектриса ∠hk, поэтому ∠hl — одна из двух равных частей.'),
    ('Может ли половина ненулевого угла совпасть со всем углом?', 'Собственная часть угла меньше целого; неравные углы не совмещаются наложением.')], [5, 6])
did(26, 'а', [
    ('Какой луч делит ∠AOC на одинаковое число равных секторов?', '∠AOB = ∠BOC по условию; OB проходит внутри ∠AOC.'),
    ('Как разделить четыре сектора ∠BOF на две равные группы?', '∠BOD и ∠DOF состоят каждый из двух равных соседних углов.'),
    ('Как разделить четыре сектора ∠AOE пополам?', '∠AOC и ∠COE состоят каждый из двух равных соседних углов.')], [6])
did(26, 'б', [
    ('Какие лучи удалены от OC на один сектор с обеих сторон?', 'Равенство соседних углов даёт равенство ∠BOC и ∠COD.'),
    ('Какие лучи удалены от OC на два сектора?', '∠AOC и ∠COE состоят каждый из двух равных секторов.'),
    ('Есть ли показанный луч на таком же угловом расстоянии по другую сторону от OC, как OF?', 'На стороне OA показано только два сектора от OC, а до OF — три; нужной третьей пары среди данных лучей нет.')], [6])
did(26, 'сравнение', [
    ('Сколько исходных равных секторов образуют ∠BOC?', 'BOC — один из соседних углов, равенство которых задано условием.'),
    ('Сколько таких же секторов содержит ∠BOD?', '∠BOD состоит из равных ∠BOC и ∠COD, поэтому он вдвое больше ∠BOC.')], [6])
did(27, 'single', [
    ('С какой отметкой линейки нужно совместить край обложки?', 'Длина равна разности отсчётов у концов; при начале от нуля второй отсчёт сразу даёт длину.'),
    ('Какие два размера нужно записать отдельно?', 'Длина и ширина — размеры по двум соседним сторонам прямоугольной обложки; они определяются измерением своего экземпляра.'),
    ('Как перевести полученные сантиметры в миллиметры?', 'Один сантиметр равен десяти миллиметрам.')], [7, 8])
did(28, 'single', [
    ('Что именно входит в измеряемую толщину бумажного блока?', 'Обложка имеет собственную толщину и не является листом бумажного блока; её исключают из измерения.'),
    ('Совпадает ли число страниц с числом листов?', 'У одного листа две стороны — две страницы; число листов нужно установить для своего экземпляра.'),
    ('Как получить среднюю толщину одного листа?', 'Для одинаковых по толщине листов толщина стопки равна числу листов, умноженному на толщину одного; измерение даёт приближённое среднее.')], [7, 8])
did(29, 'а', [
    ('Какой отрезок теперь служит мерой длины?', 'По условию KL принят за единицу; все деления рисунка имеют общий масштаб.'),
    ('Сколько промежутков этой длины содержится в каждом отрезке?', 'Длина измеряется числом последовательно уложенных единичных отрезков.'),
    ('Почему нельзя просто посчитать внутренние засечки?', 'Засечки обозначают границы промежутков; для длины считают промежутки между соседними границами, включая концы.')], [7])
did(29, 'б', [
    ('Сколько прежних единиц KL содержит новая единица AB?', 'На рисунке AB состоит из двух промежутков длиной KL.'),
    ('Как меняются числовые значения при удвоении единицы?', 'При той же длине и вдвое большей единице число единиц уменьшается вдвое.'),
    ('Как записать длины, если новая единица укладывается не целое число раз?', 'Если целая единица не укладывается целое число раз, длину выражают долями этой единицы.')], [7])
for part, word, operation, factor in [('2AB', 'двойную длину', 'умножить на 2', 2), ('1/2AB', 'половину длины', 'разделить на 2', .5), ('1/4AB', 'четверть длины', 'разделить на 4', .25)]:
    did(30, part, [
        ('Как определить длину данного AB?', 'Длину AB измеряют в выбранной единице; для обоих отрезков нужно сохранить ту же единицу.'),
        (f'Как вычислить {word} AB?', f'Чтобы получить {word}, числовую длину AB нужно {operation}.'),
        ('От какой точки и в каком направлении отложить найденную длину?', 'На заданном луче от его начала можно отложить единственный отрезок данной положительной длины.')], [7, 8])

shared_givens = {
    (5, 'а'): ['На прямой a дан отрезок AB.'],
    (5, 'б'): ['На прямой a дан отрезок AB.'],
    (5, 'в'): ['На прямой a дан отрезок AB.'],
    (7, 'б'): ['Четыре точки на одной прямой расположены в порядке A–B–C–D.'],
    (11, 'б'): ['C лежит внутри отрезка AB; порядок точек A–C–B.'],
    (22, 'б'): ['O — середина отрезка AB.'],
    (23, 'б'): ['Точки расположены в порядке A–B–C–D–E.', 'AB = BC = CD = DE.'],
    (23, 'в'): ['Точки расположены в порядке A–B–C–D–E.', 'AB = BC = CD = DE.'],
    (25, 'б'): ['Луч l — биссектриса угла hk.'],
    (26, 'б'): ['Лучами OA, OB, OC, OD, OE, OF последовательно образованы пять равных соседних углов.'],
    (26, 'сравнение'): ['Углы AOB, BOC, COD, DOE, EOF — равные соседние углы; лучи идут в указанном порядке.'],
    (29, 'а'): ['Все отрезки на рисунке показаны в одном масштабе; расстояния между соседними делениями равны.'],
    (29, 'б'): ['Все отрезки на рисунке показаны в одном масштабе; расстояния между соседними делениями равны.'],
}
for item in MODELS:
    givens = shared_givens.get((item['number'], item['part']))
    if givens:
        item['statementGivens'] = givens


def main():
    expected = {(n, part) for n, part in PARTS if n <= 30}
    actual = {(x['number'], x['part']) for x in MODELS}
    assert actual == expected, (expected - actual, actual - expected)
    assert len(actual) == len(MODELS)
    for item in MODELS:
        model = item['model']
        assert set(model['views']) >= {'neutral'} | {f'step-{i+1}' for i in range(len(PARTS[item['number'], item['part']]['steps']))}
        for view in model['views'].values():
            assert all(n in model['points'] for n in view['points'])
            for primitive in ['segments', 'lines', 'rays', 'highlightSegments']:
                assert all(n in model['points'] for pair in view.get(primitive, []) for n in pair)
    output = ROOT / 'geometry-course/textbook/models/chapter-01-a.json'
    output.write_text(json.dumps(dict(schemaVersion=1, models=MODELS), ensure_ascii=False, indent=2) + '\n')
    print(f'Wrote {len(MODELS)} models for 30 exercise numbers.')


if __name__ == '__main__':
    main()
