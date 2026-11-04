#!/usr/bin/env python3
"""Exact-source authoring: Atanasyan 2023, chapter III, exercises 191–207.

The source page images were read by the author. Independent review remains
separate. Coordinates test the displayed examples, never a universal proof.
"""
import json
import math
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'geometry-course/textbook'
EX, MODELS = {}, []


def scene(points=(), segments=(), **kw):
    return dict(label=kw.pop('label', 'Условие'), points=list(points),
                segments=[list(pair) for pair in segments], **kw)


def tri(a='A', b='B', c='C'):
    return [[a, b], [b, c], [c, a]]


def arc(vertex, a, b, marks=0, radius=7):
    return dict(vertex=vertex, **{'from': a, 'to': b}, marks=marks, radius=radius)


def eq(a, b, marks=1):
    return dict(a=a, b=b, marks=marks)


def right(a, vertex, b):
    return dict(a=a, vertex=vertex, b=b)


def check(kind, **kw):
    return dict(type=kind, **kw)


def equal(*segments):
    return check('equalLength', segments=[list(s) for s in segments])


def col(*points):
    return check('collinear', points=list(points))


def parallel(a, b, c, d):
    return check('parallel', segments=[[a, b], [c, d]])


def perpendicular(a, b, c, d):
    return check('perpendicular', segments=[[a, b], [c, d]])


def angle(a, vertex, b, degrees):
    return check('angle', points=[a, vertex, b], degrees=degrees)


def pol(origin, degrees, radius):
    t = math.radians(degrees)
    return [origin[0] + radius * math.cos(t), origin[1] + radius * math.sin(t)]


def fit(points):
    xs, ys = zip(*points.values())
    scale = min(76 / (max(xs) - min(xs) or 1), 48 / (max(ys) - min(ys) or 1))
    cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
    return {name: [50 + (p[0] - cx) * scale, 35 + (p[1] - cy) * scale]
            for name, p in points.items()}


def step(prompt, explanation, justification, theory):
    return prompt, explanation, justification, theory


def add(number, part, condition, answer, steps, points, neutral, views=None,
        cases=(), checks=(), givens=(), labels=None, offsets=None,
        label_only=(), notes=()):
    page = 57 if number <= 200 else 65 if number <= 203 else 66
    item = dict(part=part, conditionSummary=condition, answer=answer,
                steps=[s[1] for s in steps], sourceVerified=True, mathVerified=True,
                visual=dict(initial=neutral.get('note', 'Отдельный чертёж условия.'),
                            stepChanges=['Дополнительные линии и отметки раскрываются на соответствующем шаге.'],
                            cases=[c['label'] for c in cases]))
    EX.setdefault(number, dict(number=number, printedPages=[page],
                                pdfPages=[page + 1], parts=[], notes=[]))['parts'].append(item)
    EX[number]['notes'].extend(notes)
    seq = views or [neutral]
    vv = dict(neutral=deepcopy(neutral))
    for i, _ in enumerate(steps):
        v = deepcopy(seq[min(i, len(seq) - 1)])
        v['label'] = f'Шаг {i + 1}'
        vv[f'step-{i + 1}'] = v
    for i, case in enumerate(cases, 1):
        vv[f'case-{i}'] = deepcopy(case)
    model = dict(points={k: [round(v[0], 9), round(v[1], 9), 0]
                         for k, v in points.items()}, edges=[], planar=True,
                 bounds=[0, 0, 100, 70], views=vv, checks=list(checks),
                 description='Чертёж именно этой задачи. Рассуждения и вычисления находятся рядом; дополнительные элементы появляются по шагам.')
    if labels:
        model['labels'] = labels
    if offsets:
        model['labelOffsets'] = offsets
    if label_only:
        model['labelOnly'] = list(label_only)
    MODELS.append(dict(chapter=3, collection='main', number=number, part=part,
                       model=model,
                       didactics=dict(steps=[dict(prompt=s[0], justification=s[2],
                                                   theoryPoints=s[3] if isinstance(s[3], list) else [s[3]])
                                              for s in steps]),
                       statementGivens=list(givens)))


def sector_label(points, name, vertex, a, b, radius=11):
    o, p, q = points[vertex], points[a], points[b]
    t1, t2 = math.atan2(p[1] - o[1], p[0] - o[0]), math.atan2(q[1] - o[1], q[0] - o[0])
    delta = (t2 - t1 + math.pi) % (2 * math.pi) - math.pi
    points[name] = [o[0] + radius * math.cos(t1 + delta / 2),
                    o[1] + radius * math.sin(t1 + delta / 2)]


def figure111(theta):
    # Source numbering: top 1,2,3,4 clockwise; bottom 8,5,6,7.
    dy = 26
    dx = dy / math.tan(math.radians(theta))
    p = {'_U': [50 - dx / 2, 48], '_V': [50 + dx / 2, 22],
         '_UL': [8, 48], '_UR': [92, 48], '_VL': [8, 22], '_VR': [92, 22],
         'a': [89, 53], 'b': [89, 27]}
    p['_up'] = pol(p['_U'], 180 - theta, 16)
    p['_down'] = pol(p['_V'], -theta, 16)
    p['c'] = pol(p['_U'], 180 - theta, 20)
    definitions = {1: ('_U', '_UL', '_up'), 2: ('_U', '_up', '_UR'),
                   3: ('_U', '_UR', '_V'), 4: ('_U', '_V', '_UL'),
                   5: ('_V', '_VR', '_U'), 6: ('_V', '_VR', '_down'),
                   7: ('_V', '_down', '_VL'), 8: ('_V', '_VL', '_U')}
    for n, (o, a, b) in definitions.items():
        sector_label(p, f'n{n}', o, a, b)
    def view(numbers, marks=0):
        return scene(['a', 'b', 'c'] + [f'n{n}' for n in numbers],
                     lines=[['_UL', '_UR'], ['_VL', '_VR'], ['_U', '_V']],
                     angleArcs=[arc(*definitions[n], marks=marks) for n in numbers])
    labels = {f'n{n}': str(n) for n in definitions}
    only = ['a', 'b', 'c'] + list(labels)
    return p, definitions, view, labels, only


# 191: all three source subparts, with precisely the source's angle numbering.
p, defs, v, labels, only = figure111(37)
add(191, 'а', 'Прямые a и b пересечены секущей c; номера углов соответствуют рисунку 111. Даны ∠1 = 37° и ∠7 = 143°. Докажите a ∥ b.',
    'a ∥ b: соответственные углы 1 и 8 равны 37°.', [
        step('Как найти угол 8 рядом с углом 7?', 'Углы 7 и 8 смежные: ∠8 = 180° − 143° = 37°.', 'Сумма смежных углов равна 180°.', 11),
        step('Как расположены углы 1 и 8?', 'Углы 1 и 8 занимают одинаковое положение при двух пересечениях: это соответственные углы. Оба равны 37°.', 'Определение соответственных углов.', 25),
        step('Какой признак завершает доказательство?', 'Равенство соответственных углов при секущей c даёт a ∥ b.', 'Признак параллельности по соответственным углам.', 25)],
    p, v([1, 7]), [v([7, 8]), v([1, 8], 1), v([1, 8], 1)],
    checks=[angle(defs[n][1], defs[n][0], defs[n][2], d) for n, d in [(1, 37), (7, 143), (8, 37)]] +
           [parallel('_UL', '_UR', '_VL', '_VR')],
    givens=['∠1 = 37°', '∠7 = 143°'], labels=labels,
    offsets={x: [0, 0] for x in only}, label_only=only)

p, defs, v, labels, only = figure111(56)
add(191, 'б', 'При секущей c углы 1 и 6 на рисунке 111 равны. Докажите, что прямые a и b параллельны.',
    'a ∥ b: ∠3 = ∠1 = ∠6, а углы 3 и 6 соответственные.', [
        step('Как заменить угол 1 углом внутри полосы?', 'Углы 1 и 3 вертикальные, поэтому ∠3 = ∠1.', 'Равенство вертикальных углов.', 11),
        step('Какая пара равных углов теперь получилась?', 'По условию ∠1 = ∠6; значит, ∠3 = ∠6. Это соответственные углы.', 'Условие; определение соответственных углов.', 25),
        step('Что следует из их равенства?', 'По признаку параллельности прямых a ∥ b.', 'Признак по соответственным углам.', 25)],
    p, v([1, 6], 1), [v([1, 3], 1), v([3, 6], 1), v([3, 6], 1)],
    checks=[angle(defs[n][1], defs[n][0], defs[n][2], 56) for n in [1, 3, 6]] +
           [parallel('_UL', '_UR', '_VL', '_VR')],
    givens=['∠1 = ∠6'], labels=labels, offsets={x: [0, 0] for x in only}, label_only=only,
    notes=['Число 56° используется только в координатном примере, не является данным и не появляется в объяснении.'])

p, defs, v, labels, only = figure111(45)
add(191, 'в', 'На рисунке 111 ∠1 = 45°, а угол 7 втрое больше угла 3. Докажите a ∥ b.',
    '∠3 = 45°, ∠7 = 135°, ∠8 = 45°; a ∥ b.', [
        step('Чему равен угол 3?', 'Углы 1 и 3 вертикальные: ∠3 = 45°.', 'Равенство вертикальных углов.', 11),
        step('Как найти угол 7?', 'По условию ∠7 = 3 · ∠3 = 3 · 45° = 135°.', 'Данное отношение углов.', 9),
        step('Как получить угол, соответственный углу 1?', 'Углы 7 и 8 смежные, поэтому ∠8 = 180° − 135° = 45°.', 'Сумма смежных углов.', 11),
        step('Почему прямые параллельны?', 'Соответственные углы 1 и 8 равны 45°. По признаку параллельности a ∥ b.', 'Признак по соответственным углам.', 25)],
    p, v([1, 3, 7]), [v([1, 3], 1), v([3, 7]), v([7, 8]), v([1, 8], 1)],
    checks=[angle(defs[n][1], defs[n][0], defs[n][2], d) for n, d in [(1, 45), (3, 45), (7, 135), (8, 45)]] +
           [parallel('_UL', '_UR', '_VL', '_VR')],
    givens=['∠1 = 45°', '∠7 = 3 · ∠3'], labels=labels,
    offsets={x: [0, 0] for x in only}, label_only=only)

# 192: two isosceles triangles on intersecting lines, source figure 112.
p = {'A': [15, 30], 'B': [37.5, 60], 'C': [60, 30], 'D': [72, 14], 'E': [84, 30]}
edges = [['A', 'B'], ['B', 'D'], ['D', 'E'], ['E', 'A']]
base = scene(p, edges, equalSegments=[eq('A', 'B', 2), eq('B', 'C', 2), eq('C', 'D'), eq('D', 'E')])
v1 = dict(base, angleArcs=[arc('A', 'B', 'C', 1), arc('C', 'A', 'B', 1)])
v2 = dict(base, angleArcs=[arc('C', 'D', 'E', 1), arc('E', 'C', 'D', 1)])
v3 = dict(base, angleArcs=[arc('C', 'A', 'B', 1), arc('C', 'D', 'E', 1)])
v4 = dict(base, angleArcs=[arc('A', 'B', 'E', 1), arc('E', 'A', 'D', 1)])
add(192, 'single', 'В конфигурации рисунка 112 точки A, C, E лежат на одной прямой, а B, C, D — на другой; C находится между крайними точками. Даны AB = BC и CD = DE. Докажите AB ∥ DE.',
    'AB ∥ DE по равенству накрест лежащих углов BAC и CED.', [
        step('Какие углы равны в первом треугольнике?', 'В равнобедренном ABC основание AC, поэтому ∠BAC = ∠ACB.', 'Углы при основании равнобедренного треугольника.', 18),
        step('Какие углы равны во втором треугольнике?', 'В равнобедренном CDE основание CE, поэтому ∠DCE = ∠CED.', 'Углы при основании равнобедренного треугольника.', 18),
        step('Как связать два равенства?', 'Углы ACB и DCE вертикальные. Поэтому ∠BAC = ∠ACB = ∠DCE = ∠CED.', 'Вертикальные углы и полученные равенства.', 11),
        step('Какую секущую используем?', 'Прямая AE пересекает AB и DE. Равные углы BAC и CED — накрест лежащие, значит AB ∥ DE.', 'Признак по накрест лежащим углам.', 25)],
    p, base, [v1, v2, v3, v4], checks=[equal(['A', 'B'], ['B', 'C']), equal(['C', 'D'], ['D', 'E']),
    col('A', 'C', 'E'), col('B', 'C', 'D'), parallel('A', 'B', 'D', 'E')],
    givens=['AB = BC', 'CD = DE'], offsets={'A': [-3, 0], 'B': [0, 4], 'C': [0, 5], 'D': [1, -5], 'E': [4, 0]})

# 193: shared midpoint and SAS; no parallelism is assumed in the proof.
p = {'A': [18, 49], 'B': [82, 21], 'C': [28, 16], 'D': [72, 54], 'O': [50, 35]}
base = scene(p, [['A', 'B'], ['C', 'D'], ['A', 'C'], ['B', 'D']],
             equalSegments=[eq('A', 'O'), eq('O', 'B'), eq('C', 'O', 2), eq('O', 'D', 2)])
vertical = dict(base, angleArcs=[arc('O', 'A', 'C', 1), arc('O', 'B', 'D', 1)])
finish = dict(base, angleArcs=[arc('A', 'O', 'C', 1), arc('B', 'O', 'D', 1)])
add(193, 'single', 'Отрезки AB и CD пересекаются в одной точке O — общей середине обоих отрезков. Докажите параллельность прямых AC и BD.',
    'AC ∥ BD: равенство ΔAOC и ΔBOD даёт равные накрест лежащие углы.', [
        step('Какие две пары сторон равны?', 'AO = BO и CO = DO, поскольку O — середина обоих отрезков.', 'Определение середины отрезка.', 6),
        step('Какие углы заключены между этими сторонами?', 'Углы AOC и BOD вертикальные и потому равны.', 'Равенство вертикальных углов.', 11),
        step('Как сравнить треугольники?', 'По двум сторонам и углу между ними ΔAOC = ΔBOD. Соответствуют A ↔ B, O ↔ O, C ↔ D.', 'Первый признак равенства треугольников.', 15),
        step('Как получить параллельность?', 'Из равенства треугольников ∠OAC = ∠OBD. Они накрест лежащие при секущей AB, поэтому AC ∥ BD.', 'Соответствующие углы равных треугольников; признак параллельности.', [14, 25])],
    p, base, [base, vertical, vertical, finish],
    checks=[equal(['A', 'O'], ['O', 'B']), equal(['C', 'O'], ['O', 'D']), col('A', 'O', 'B'), col('C', 'O', 'D'),
            parallel('A', 'C', 'B', 'D')], offsets={'A': [-3, 3], 'B': [3, -3], 'C': [-3, -4], 'D': [3, 4], 'O': [1, 5]})

# 194: the given equal angles at A transfer to the base angle at C.
p = {'A': [20, 15], 'B': [28, 55], 'C': [28 + math.hypot(8, 40), 55], 'D': [84, 15]}
edges = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A', 'C']]
base = scene(p, edges, equalSegments=[eq('A', 'B'), eq('B', 'C')],
             angleArcs=[arc('A', 'B', 'C', 1), arc('A', 'C', 'D', 1)])
v1 = dict(base, angleArcs=[arc('A', 'B', 'C', 1), arc('C', 'B', 'A', 1)])
v2 = dict(base, angleArcs=[arc('C', 'B', 'A', 1), arc('A', 'C', 'D', 1)])
add(194, 'single', 'На рисунке 113 в четырёхугольнике ABCD проведена AC; отмечены AB = BC и ∠BAC = ∠CAD. Докажите BC ∥ AD.',
    'BC ∥ AD: ∠BCA = ∠BAC = ∠CAD.', [
        step('Какое свойство даёт AB = BC?', 'Треугольник ABC равнобедренный с основанием AC. Поэтому ∠BCA = ∠BAC.', 'Углы при основании равнобедренного треугольника.', 18),
        step('Как использовать отметки углов при A?', 'По условию ∠BAC = ∠CAD. Значит, ∠BCA = ∠CAD.', 'Условие; равенство углов.', [6, 18]),
        step('Почему это доказывает BC ∥ AD?', 'Углы BCA и CAD — накрест лежащие при секущей AC. Их равенство даёт BC ∥ AD.', 'Признак параллельности.', 25)],
    p, base, [v1, v2, v2], checks=[equal(['A', 'B'], ['B', 'C']), parallel('B', 'C', 'A', 'D')],
    givens=['AB = BC', '∠BAC = ∠CAD'], offsets={'A': [-3, -3], 'B': [-3, 4], 'C': [2, 5], 'D': [3, -3]})

# 195: no triangle-angle-sum theorem is needed.
t70, t35 = math.tan(math.radians(70)), math.tan(math.radians(35))
t = 2 * t35 / (t70 + t35)
p = fit({'A': [0, 0], 'B': [1, t70], 'C': [2, 0], 'D': [t, t * t70], 'E': [2 - t, t * t70]})
base = scene(p, tri() + [['A', 'E'], ['D', 'E']],
             equalSegments=[eq('A', 'B', 2), eq('B', 'C', 2), eq('A', 'D'), eq('D', 'E')],
             angleArcs=[arc('C', 'A', 'B'), arc('A', 'E', 'C')])
v1 = dict(base, angleArcs=[arc('A', 'B', 'C', 1), arc('C', 'A', 'B', 1)])
v2 = dict(base, angleArcs=[arc('A', 'D', 'E'), arc('A', 'E', 'C')])
v3 = dict(base, angleArcs=[arc('A', 'D', 'E', 1), arc('E', 'A', 'D', 1)])
v4 = dict(base, angleArcs=[arc('A', 'E', 'C', 1), arc('E', 'A', 'D', 1)])
add(195, 'single', 'В треугольнике ABC точки D и E лежат на AB и BC, как на рисунке 114. Даны AB = BC, AD = DE, ∠ACB = 70° и ∠EAC = 35°. Докажите DE ∥ AC.',
    'DE ∥ AC: ∠DAE = ∠AED = ∠EAC = 35°.', [
        step('Чему равен угол BAC?', 'Из AB = BC следует ∠BAC = ∠ACB = 70°.', 'Углы при основании равнобедренного треугольника.', 18),
        step('Как найти угол DAE?', 'D лежит на AB, а AE проходит внутри угла BAC. Поэтому ∠DAE = 70° − 35° = 35°.', 'Вычитание углов; данное положение лучей.', 9),
        step('Как использовать AD = DE?', 'Треугольник ADE равнобедренный с основанием AE. Значит, ∠AED = ∠DAE = 35°.', 'Углы при основании равнобедренного треугольника.', 18),
        step('Какие равные углы доказывают параллельность?', 'Углы AED и EAC равны 35° и накрест лежат при секущей AE. Поэтому DE ∥ AC.', 'Признак по накрест лежащим углам.', 25)],
    p, base, [v1, v2, v3, v4], checks=[equal(['A', 'B'], ['B', 'C']), equal(['A', 'D'], ['D', 'E']),
    col('A', 'D', 'B'), col('B', 'E', 'C'), angle('A', 'C', 'B', 70), angle('E', 'A', 'C', 35),
    angle('D', 'A', 'E', 35), angle('A', 'E', 'D', 35), parallel('D', 'E', 'A', 'C')],
    givens=['AB = BC', 'AD = DE', '∠ACB = 70°', '∠EAC = 35°'],
    offsets={'A': [-3, -4], 'B': [0, 4], 'C': [3, -4], 'D': [-4, 1], 'E': [4, 1]})

# 196: the angle bisector produces the alternate-angle equality through BM=MK.
A, B, C = [12, 14], [27, 58], [86, 14]
ab, bc = math.dist(A, B), math.dist(B, C)
kx = (bc * A[0] + ab * C[0]) / (ab + bc)
f = ab / (ab + bc)
p = {'A': A, 'B': B, 'C': C, 'K': [kx, 14], 'M': [B[i] + f * (C[i] - B[i]) for i in [0, 1]]}
base = scene(p, tri() + [['B', 'K'], ['K', 'M']], equalSegments=[eq('B', 'M'), eq('M', 'K')],
             angleArcs=[arc('B', 'A', 'K', 1), arc('B', 'K', 'C', 1)])
v1 = dict(base, angleArcs=[arc('B', 'M', 'K', 1), arc('B', 'K', 'A', 1)])
v2 = dict(base, angleArcs=[arc('B', 'M', 'K', 1), arc('K', 'B', 'M', 1)])
v3 = dict(base, angleArcs=[arc('B', 'K', 'A', 1), arc('K', 'B', 'M', 1)])
add(196, 'single', 'В ABC отрезок BK — биссектриса, K лежит на AC. Прямая через K встречает сторону BC в M, причём BM = MK. Докажите KM ∥ AB.',
    'KM ∥ AB: ∠KBA = ∠MBK = ∠BKM.', [
        step('Какие углы равны благодаря биссектрисе?', 'Так как M лежит на BC, ∠MBK = ∠CBK = ∠KBA.', 'Определение биссектрисы угла.', [6, 17]),
        step('Как использовать BM = MK?', 'В равнобедренном BMK основание BK. Поэтому ∠MBK = ∠BKM.', 'Углы при основании равнобедренного треугольника.', 18),
        step('Какая пара углов получилась?', '∠KBA = ∠BKM. Это накрест лежащие углы при секущей BK для прямых AB и KM, значит KM ∥ AB.', 'Признак параллельности.', 25)],
    p, base, [v1, v2, v3], checks=[equal(['B', 'M'], ['M', 'K']), col('A', 'K', 'C'), col('B', 'M', 'C'),
    parallel('K', 'M', 'A', 'B')], givens=['BK — биссектриса', 'BM = MK'],
    offsets={'A': [-3, -3], 'B': [-3, 4], 'C': [3, -3], 'K': [0, -5], 'M': [4, 2]})

# 197: exterior-angle bisector, without computing the third triangle angle.
t40, t80 = math.tan(math.radians(40)), math.tan(math.radians(80))
x = t80 / (t80 - t40)
p = fit({'A': [0, 0], 'B': [x, x * t40], 'C': [1, 0], 'E': [1.9, 0], 'T': pol([1, 0], 40, 1.0)})
base = scene(['A', 'B', 'C', 'E'], tri() + [['C', 'E']],
             angleArcs=[arc('A', 'B', 'C'), arc('C', 'B', 'E')])
bis = scene(p, tri() + [['C', 'E'], ['C', 'T']],
            angleArcs=[arc('C', 'B', 'T', 1), arc('C', 'T', 'E', 1)])
finish = dict(bis, angleArcs=[arc('A', 'B', 'C', 1), arc('C', 'T', 'E', 1)])
add(197, 'single', 'В ABC ∠BAC = 40°. Сторона AC продолжена за C до E; смежный с ∠ACB угол BCE равен 80°. Докажите, что биссектриса угла BCE параллельна AB.',
    'Биссектриса CT параллельна AB, поскольку ∠TCE = ∠BAC = 40°.', [
        step('Как обозначить нужную биссектрису?', 'Обозначим биссектрису внешнего угла BCE лучом CT. Он лежит внутри этого угла.', 'Определение биссектрисы.', 6),
        step('Чему равен угол между CT и CE?', '∠TCE = ∠BCT = 80° : 2 = 40°.', 'Биссектриса делит угол на два равных угла.', 6),
        step('Как сравнить CT с AB?', 'Углы TCE и BAC равны 40° и соответственные при секущей AC. Поэтому прямые CT и AB параллельны.', 'Признак по соответственным углам; параллельность луча и прямой.', [24, 25])],
    p, base, [bis, bis, finish], checks=[col('A', 'C', 'E'), angle('B', 'A', 'C', 40),
    angle('B', 'C', 'E', 80), angle('B', 'C', 'T', 40), angle('T', 'C', 'E', 40), parallel('C', 'T', 'A', 'B')],
    givens=['∠BAC = 40°', '∠BCE = 80°'],
    offsets={'A': [-3, -3], 'B': [-2, 5], 'C': [-2, -5], 'E': [3, -2], 'T': [3, 3]})

# 198: 40 + 2·70 = 180, so the same-side-angle criterion suffices.
t70 = math.tan(math.radians(70))
x = t70 / (t70 + t40)
p = fit({'A': [0, 0], 'B': [x, x * t40], 'C': [1, 0], 'D': [1.7, x * t40]})
base = scene(p, tri() + [['B', 'D']], angleArcs=[arc('A', 'B', 'C'), arc('B', 'A', 'C', 1), arc('B', 'C', 'D', 1)])
wide = dict(base, angleArcs=[arc('A', 'B', 'C'), arc('B', 'A', 'D', radius=11)])
add(198, 'single', 'В ABC углы A и B равны 40° и 70°. Через B проведена BD так, что BC — биссектриса угла ABD. Докажите AC ∥ BD.',
    'AC ∥ BD: ∠ABD = 140°, и ∠BAC + ∠ABD = 180°.', [
        step('Какой угол равен углу ABC?', 'Так как BC — биссектриса угла ABD, ∠CBD = ∠ABC = 70°.', 'Определение биссектрисы.', 6),
        step('Как найти полный угол ABD?', '∠ABD = ∠ABC + ∠CBD = 70° + 70° = 140°.', 'Сложение углов при внутреннем луче BC.', 9),
        step('Какой признак применяем к AC и BD?', 'При секущей AB углы BAC и ABD односторонние. Их сумма 40° + 140° = 180°, значит AC ∥ BD.', 'Признак по сумме односторонних углов.', 25)],
    p, base, [base, wide, wide], checks=[angle('B', 'A', 'C', 40), angle('A', 'B', 'C', 70),
    angle('C', 'B', 'D', 70), angle('A', 'B', 'D', 140), parallel('A', 'C', 'B', 'D')],
    givens=['∠A = 40°', '∠B = 70°', 'BC — биссектриса ∠ABD'],
    offsets={'A': [-3, -4], 'B': [-3, 4], 'C': [2, -5], 'D': [3, 3]})

# 199: practical construction; each of the three results has a separate view.
p = {'A': [20, 15], 'B': [47, 55], 'C': [81, 20]}
p['_a'] = [p['A'][i] + .4 * (p['C'][i] - p['B'][i]) for i in [0, 1]]
p['_b'] = [p['B'][i] + .3 * (p['C'][i] - p['A'][i]) for i in [0, 1]]
p['_c'] = [p['C'][i] + .3 * (p['B'][i] - p['A'][i]) for i in [0, 1]]
base = scene(['A', 'B', 'C'], tri())
va = dict(base, lines=[['A', '_a']], highlightSegments=[['B', 'C']])
vb = dict(base, lines=[['B', '_b']], highlightSegments=[['A', 'C']])
vc = dict(base, lines=[['C', '_c']], highlightSegments=[['A', 'B']])
cases = [dict(va, label='Через A', availableFromStep=2), dict(vb, label='Через B', availableFromStep=3),
         dict(vc, label='Через C', availableFromStep=4)]
add(199, 'single', 'Нарисуйте треугольник. С помощью чертёжного угольника и линейки проведите через каждую вершину прямую, параллельную противоположной стороне.',
    'Через A проведена прямая, параллельная BC; через B — параллельная AC; через C — параллельная AB.', [
        step('Как начать построение?', 'Нарисуйте любой невырожденный треугольник ABC. Для каждой вершины найдите противоположную сторону.', 'Элементы треугольника.', 14),
        step('Как провести параллельную прямую через A?', 'Приложите одну сторону угольника к BC, а другую — к линейке. Удерживая линейку, сдвиньте угольник до A и проведите прямую вдоль первой стороны.', 'Практический способ построения параллельных прямых.', 26),
        step('Что нужно повторить для B?', 'Приложите угольник к AC. Сдвиньте его вдоль неподвижной линейки до B и проведите вторую прямую.', 'Тот же способ для противоположной стороны AC.', 26),
        step('Что нужно повторить для C?', 'Приложите угольник к AB. Сдвиньте его до C и проведите третью прямую. Каждый результат можно рассмотреть отдельно.', 'Тот же способ для противоположной стороны AB.', 26),
        step('Почему построенные прямые действительно параллельны?', 'При скольжении вдоль неподвижной линейки угол между её краем и стороной угольника сохраняется. Соответственные углы равны, поэтому каждая новая прямая параллельна выбранной стороне.', 'Признак параллельности по соответственным углам.', 25)],
    p, base, [base, va, vb, vc, vc], cases=cases,
    checks=[parallel('A', '_a', 'B', 'C'), parallel('B', '_b', 'A', 'C'), parallel('C', '_c', 'A', 'B')],
    offsets={'A': [-3, -4], 'B': [-1, 5], 'C': [3, -4]},
    notes=['Результаты произвольного бумажного построения не имеют фиксированных длин. Прямые показаны отдельно, чтобы не загромождать исходный треугольник.'])

# 200: select an interior point, as the practical exercise permits.
p = {'A': [15, 15], 'B': [36, 55], 'C': [85, 15], 'D': [45, 15]}
p['_u'] = [p['D'][i] + .5 * (p['B'][i] - p['A'][i]) for i in [0, 1]]
p['_v'] = [p['D'][i] + .5 * (p['B'][i] - p['C'][i]) for i in [0, 1]]
base = scene(['A', 'B', 'C', 'D'], tri())
v1 = dict(base, lines=[['D', '_u']], highlightSegments=[['A', 'B']])
v2 = dict(base, lines=[['D', '_v']], highlightSegments=[['B', 'C']])
add(200, 'single', 'Нарисуйте ABC и отметьте на стороне AC точку D. Угольником и линейкой проведите через D прямые, параллельные двум другим сторонам треугольника.',
    'Для D между A и C построены две прямые: через D параллельно AB и через D параллельно BC.', [
        step('Где выбрать точку D?', 'Выберите D между A и C, не в вершине. Тогда D не принадлежит ни AB, ни BC, и обе требуемые параллельные прямые можно провести.', 'Выбор точки в практическом задании; определение параллельности.', 24),
        step('Как построить первую прямую?', 'Приложите сторону угольника к AB и придвиньте к другой стороне линейку. Удерживая линейку, сдвиньте угольник до D и проведите прямую.', 'Практическое построение параллельной прямой.', 26),
        step('Как построить вторую прямую?', 'Повторите построение для BC: совместите с ней сторону угольника, закрепите линейку и сдвиньте угольник до D.', 'Практическое построение параллельной прямой.', 26),
        step('Как обосновать результат?', 'При каждом перемещении сохраняется угол угольника с направлением линейки. Равные соответственные углы дают параллельность. Если выбрать D в A или C, одна линия совпадёт со стороной; поэтому для двух параллельных прямых D выбираем внутри AC.', 'Признак параллельности; совпадающие прямые не являются двумя параллельными прямыми.', [24, 25])],
    p, base, [base, v1, v2, v2], cases=[dict(v1, label='Параллельно AB', availableFromStep=2),
    dict(v2, label='Параллельно BC', availableFromStep=3)],
    checks=[col('A', 'D', 'C'), parallel('D', '_u', 'A', 'B'), parallel('D', '_v', 'B', 'C')],
    offsets={'A': [-3, -3], 'B': [0, 5], 'C': [3, -3], 'D': [0, -5]})

# 201: existence and uniqueness are deliberately distinguished.
p = {'A': [18, 16], 'B': [82, 22], 'C': [43, 54], '_q': [75, 57]}
base = scene(['A', 'B', 'C'], tri())
final = dict(base, lines=[['C', '_q']], highlightSegments=[['A', 'B']])
add(201, 'single', 'Сколько прямых, параллельных стороне AB треугольника ABC, можно провести через вершину C?',
    'Ровно одну прямую.', [
        step('Лежит ли C на прямой AB?', 'У невырожденного треугольника C не лежит на прямой AB.', 'Определение треугольника.', 14),
        step('Что утверждает аксиома параллельных прямых?', 'Через точку вне данной прямой проходит ровно одна прямая, параллельная данной. Для точки C и прямой AB это даёт ответ: одна.', 'Аксиома параллельных прямых; существование установлено перед ней.', 28)],
    p, base, [base, final], checks=[parallel('C', '_q', 'A', 'B')],
    offsets={'A': [-3, -3], 'B': [3, -3], 'C': [-2, 5]})

# 202: the four lines are distinct. Both possible configurations are shown.
p = {'M': [50, 49], '_pL': [7, 16], '_pR': [93, 16], 'p': [89, 21],
     '_h': [82, 49], '_i1': [15, 16], '_i2': [46, 16], '_i3': [84, 16],
     '_j1': [10, 16], '_j2': [35, 16], '_j3': [65, 16], '_j4': [90, 16]}
v3 = scene(['M', 'p'], lines=[['_pL', '_pR'], ['M', '_h'], ['M', '_i1'], ['M', '_i2'], ['M', '_i3']])
v4 = scene(['M', 'p'], lines=[['_pL', '_pR'], ['M', '_j1'], ['M', '_j2'], ['M', '_j3'], ['M', '_j4']])
add(202, 'single', 'Через точку M вне прямой p проведены четыре различные прямые. Сколько из них пересекают p? Рассмотрите все возможные случаи.',
    'Три или четыре: три, если одна из четырёх параллельна p; четыре, если такой прямой среди них нет.', [
        step('Сколько из четырёх прямых может быть параллельно p?', 'Через M проходит только одна прямая, параллельная p. Поэтому среди четырёх различных прямых параллельна p не более одной.', 'Аксиома параллельных прямых.', 28),
        step('Что происходит, если параллельная прямая выбрана?', 'Одна из четырёх не пересекает p. Остальные три отличны от неё и не могут быть параллельны p, поэтому все три пересекают p.', 'Единственность параллельной; две разные прямые либо пересекаются, либо параллельны.', [24, 28]),
        step('А если параллельная прямая не входит в четвёрку?', 'Тогда каждая из четырёх прямых не параллельна p и пересекает её.', 'Определение параллельности на плоскости.', 24),
        step('Почему других ответов нет?', 'Две непересекающие p прямые из этой четвёрки дали бы две параллельные p через M, что невозможно. Значит, возможны только три или четыре пересечения.', 'Аксиома параллельных прямых.', 28)],
    p, v3, [v3, v3, v4, v4], cases=[dict(v3, label='Одна из четырёх параллельна p', availableFromStep=2),
    dict(v4, label='Параллельная p не выбрана', availableFromStep=3)],
    checks=[parallel('M', '_h', '_pL', '_pR'), col('_pL', '_i1', '_i2', '_i3', '_pR'),
    col('_pL', '_j1', '_j2', '_j3', '_j4', '_pR')], labels={'p': 'p'}, offsets={'M': [14, 6], 'p': [0, 0]}, label_only=['p'])

# 203: parallelism from two perpendiculars, then a consequence of the axiom.
p = {'_aL': [7, 49], '_aR': [93, 49], '_bL': [7, 21], '_bR': [93, 21],
     '_p1': [23, 7], '_p2': [23, 63], '_P': [23, 49], '_Q': [23, 21],
     '_c1': [33, 58], '_c2': [78, 9], 'a': [88, 54], 'b': [88, 26], 'p': [18, 61], 'c': [81, 12]}
base = scene(['a', 'b', 'p', 'c'], lines=[['_aL', '_aR'], ['_bL', '_bR'], ['_p1', '_p2'], ['_c1', '_c2']],
             rightAngles=[right('_aR', '_P', '_p2'), right('_bR', '_Q', '_p2')])
add(203, 'single', 'Прямые a и b перпендикулярны прямой p. Прямая c пересекает a. Обязательно ли c пересекает b?',
    'Да, c пересекает b.', [
        step('Как связаны a и b?', 'Две различные прямые, перпендикулярные одной прямой, параллельны. Поэтому a ∥ b.', 'Свойство двух перпендикуляров.', [12, 24]),
        step('Что даёт пересечение c с a?', 'Если прямая пересекает одну из двух параллельных прямых, то пересекает и другую. Значит, c пересекает b.', 'Следствие из аксиомы параллельных прямых.', 28)],
    p, base, checks=[perpendicular('_aL', '_aR', '_p1', '_p2'), perpendicular('_bL', '_bR', '_p1', '_p2'),
    parallel('_aL', '_aR', '_bL', '_bR')], givens=['a ⟂ p', 'b ⟂ p', 'c пересекает a'],
    offsets={x: [0, 0] for x in ['a', 'b', 'p', 'c']}, label_only=['a', 'b', 'p', 'c'])

# 204: distinguish the complete lines AC, BC from the side segments.
p = {'A': [23, 18], 'B': [23, 56], 'C': [64, 26], '_p1': [83, 5], '_p2': [83, 64], 'p': [88, 59]}
base = scene(['A', 'B', 'C', 'p'], tri(), lines=[['_p1', '_p2']])
bc_view = dict(base, lines=[['_p1', '_p2'], ['B', 'C']])
ac_view = dict(base, lines=[['_p1', '_p2'], ['A', 'C']])
add(204, 'single', 'Прямая p параллельна стороне AB треугольника ABC. Докажите, что прямые BC и AC пересекают p.',
    'Обе прямые BC и AC пересекают p; точки пересечения могут лежать на продолжениях сторон.', [
        step('Где BC встречается с AB?', 'Прямые BC и AB пересекаются в B. Они различны, поскольку A, B, C не лежат на одной прямой.', 'Определение треугольника.', 14),
        step('Почему BC пересекает p?', 'Так как p ∥ AB, прямая BC, пересекающая AB, пересекает и p.', 'Следствие из аксиомы параллельных прямых.', 28),
        step('Почему AC тоже пересекает p?', 'Прямая AC пересекает AB в A. По тому же следствию она пересекает p. Речь идёт о целых прямых: их пересечения с p могут находиться вне сторон треугольника.', 'Следствие из аксиомы; различие прямой и отрезка.', [1, 28])],
    p, base, [base, bc_view, ac_view],
    cases=[dict(bc_view, label='Прямая BC', availableFromStep=2), dict(ac_view, label='Прямая AC', availableFromStep=3)],
    checks=[parallel('A', 'B', '_p1', '_p2')], givens=['p ∥ AB'],
    offsets={'A': [-4, -3], 'B': [-4, 4], 'C': [-2, -5], 'p': [0, 0]}, label_only=['p'])

# 205: a source-faithful main diagram; selected straight lines shown separately.
p = {'A': [40, 57], 'B': [12, 13], 'C': [75, 13], 'D': [29, 13], 'E': [56, 13],
     'P': [26, 35], 'Q': [57.5, 35], '_p1': [81, 13], '_p2': [92, 57], 'p': [93, 48]}
edges = tri() + [['A', 'D'], ['A', 'E'], ['P', 'Q']]
base = scene(['A', 'B', 'C', 'D', 'E', 'P', 'Q', 'p'], edges, lines=[['_p1', '_p2']])
def selected205(pair):
    names = ['A', 'D', 'p'] + [q for q in pair if q not in ['A', 'D']]
    return scene(names, lines=[['A', 'D'], ['_p1', '_p2'], pair],
                 note='Показаны фрагменты прямых. Их точка пересечения может находиться за пределами рисунка.')
vab, vae, vac, vbc = [selected205(pair) for pair in [['A', 'B'], ['A', 'E'], ['A', 'C'], ['B', 'C']]]
vpq = scene(['B', 'C', 'P', 'Q', 'p'], lines=[['B', 'C'], ['_p1', '_p2'], ['P', 'Q']],
            note='Прямая p пересекает BC; PQ ∥ BC. Точки пересечения могут находиться за пределами рисунка.')
add(205, 'single', 'В конфигурации рисунка 123 D и E лежат на BC, P — на AB, Q — на AC; AD ∥ p и PQ ∥ BC. Докажите, что p пересекает каждую из прямых AB, AE, AC, BC и PQ.',
    'Прямая p пересекает AB, AE, AC, BC и PQ.', [
        step('Почему p пересекает AB?', 'Прямая AB пересекает AD в A. Поскольку AD ∥ p, прямая AB пересекает и p.', 'Следствие из аксиомы параллельных прямых.', 28),
        step('Почему p пересекает AE?', 'Прямая AE отлична от AD и пересекает её в A. Поэтому AE пересекает p.', 'То же следствие для AE.', 28),
        step('Почему p пересекает AC?', 'Прямая AC пересекает AD в A. Поэтому AC пересекает p.', 'То же следствие для AC.', 28),
        step('Почему p пересекает BC?', 'Прямая BC пересекает AD в D. Поэтому BC пересекает p.', 'То же следствие для BC.', 28),
        step('Как получить пересечение с PQ?', 'Уже установлено: p пересекает BC. Так как PQ ∥ BC, та же прямая p пересекает и PQ.', 'Следствие из аксиомы для параллельных PQ и BC.', 28)],
    p, base, [vab, vae, vac, vbc, vpq], cases=[dict(vab, label='AB', availableFromStep=1),
    dict(vae, label='AE', availableFromStep=2), dict(vac, label='AC', availableFromStep=3),
    dict(vbc, label='BC', availableFromStep=4), dict(vpq, label='PQ', availableFromStep=5)],
    checks=[col('B', 'D', 'E', 'C'), col('A', 'P', 'B'), col('A', 'Q', 'C'),
    parallel('A', 'D', '_p1', '_p2'), parallel('P', 'Q', 'B', 'C')],
    givens=['AD ∥ p', 'PQ ∥ BC'],
    offsets={'A': [0, 5], 'B': [-4, -3], 'C': [0, -6], 'D': [0, -5], 'E': [0, -5], 'P': [-4, 1], 'Q': [4, 1], 'p': [0, 0]},
    label_only=['p'], notes=['Расположение D, E, P, Q явно включено в условие по рисунку 123; все пять требуемых прямых разобраны.'])

# 206: both alternate interior angles are obtuse (105°), not 75°.
p, defs, _, _, _ = figure111(75)
for old in [f'n{i}' for i in range(1, 9)]:
    p.pop(old)
sector_label(p, 'alpha', *defs[4]); sector_label(p, 'beta', *defs[5])
base = scene(['a', 'b', 'c', 'alpha', 'beta'], lines=[['_UL', '_UR'], ['_VL', '_VR'], ['_U', '_V']],
             angleArcs=[arc(*defs[4]), arc(*defs[5])])
same = dict(base, angleArcs=[arc(*defs[4], marks=1), arc(*defs[5], marks=1)])
add(206, 'single', 'Две параллельные прямые пересечены секущей. Сумма двух накрест лежащих углов равна 210°. Найдите каждый из них.',
    '105° и 105°.', [
        step('Как связаны накрест лежащие углы?', 'При параллельных прямых накрест лежащие углы равны: α = β.', 'Свойство параллельных прямых.', 29),
        step('Как использовать сумму 210°?', 'Два равных угла в сумме дают 210°, поэтому каждый равен 210° : 2 = 105°.', 'Деление суммы двух равных величин пополам.', 9),
        step('Как проверить ответ?', '105° + 105° = 210°. Оба найденных угла тупые; смежные с ними углы по 75° не являются искомой парой.', 'Проверка условия; сумма смежных углов.', 11)],
    p, base, [same, same, same], checks=[parallel('_UL', '_UR', '_VL', '_VR'),
    angle(defs[4][1], defs[4][0], defs[4][2], 105), angle(defs[5][1], defs[5][0], defs[5][2], 105)],
    givens=['a ∥ b', 'α + β = 210°'], labels={'alpha': 'α', 'beta': 'β'},
    offsets={k: [0, 0] for k in ['a', 'b', 'c', 'alpha', 'beta']}, label_only=['a', 'b', 'c', 'alpha', 'beta'])

# 207: a and c are parallel, while b makes a genuinely different 2° direction.
t42 = math.tan(math.radians(42))
p = {'_M': [50, 35], '_U': [50 + 18 / t42, 53], '_V': [50 - 18 / t42, 17],
     '_aL': [7, 53], '_aR': [93, 53], '_cL': [7, 17], '_cR': [93, 17],
     '_bL': [7, 35 - 43 * math.tan(math.radians(2))], '_bR': [93, 35 + 43 * math.tan(math.radians(2))],
     'a': [89, 58], 'b': [89, 41], 'c': [89, 22], 'd': [84, 64]}
defs = {1: ('_U', '_aL', '_M'), 2: ('_M', '_U', '_bL'), 3: ('_V', '_M', '_cL')}
for n, definition in defs.items():
    sector_label(p, f'n{n}', *definition)
base = scene(['a', 'b', 'c', 'd', 'n1', 'n2', 'n3'],
             lines=[['_aL', '_aR'], ['_bL', '_bR'], ['_cL', '_cR'], ['_U', '_V']],
             angleArcs=[arc(*definition) for definition in defs.values()])
def pair207(numbers):
    result = deepcopy(base)
    result['points'] = ['a', 'b', 'c', 'd'] + [f'n{n}' for n in numbers]
    result['angleArcs'] = [arc(*defs[n]) for n in numbers]
    return result
add(207, 'single', 'Прямые a, b и c пересечены секущей d, как на рисунке 124. Углы 1, 2 и 3 равны соответственно 42°, 140° и 138°. Какие из прямых a, b, c параллельны?',
    'Только a ∥ c. Прямая b не параллельна ни a, ни c.', [
        step('Что дают углы 1 и 3?', 'Углы 1 и 3 односторонние для a и c. Их сумма 42° + 138° = 180°, поэтому a ∥ c.', 'Признак по сумме односторонних углов.', 25),
        step('Могут ли a и b быть параллельны?', 'Для параллельных a и b сумма односторонних углов 1 и 2 была бы 180°. Но 42° + 140° = 182°, значит a и b не параллельны.', 'Необходимое свойство односторонних углов при параллельных прямых.', 29),
        step('Могут ли b и c быть параллельны?', 'Углы 2 и 3 соответственные для b и c. При параллельности они были бы равны, но 140° ≠ 138°. Поэтому b и c не параллельны.', 'Свойство соответственных углов.', 29)],
    p, base, [pair207([1, 3]), pair207([1, 2]), pair207([2, 3])],
    checks=[parallel('_aL', '_aR', '_cL', '_cR')] +
           [angle(defs[n][1], defs[n][0], defs[n][2], value) for n, value in [(1, 42), (2, 140), (3, 138)]],
    givens=['∠1 = 42°', '∠2 = 140°', '∠3 = 138°'],
    labels={'n1': '1', 'n2': '2', 'n3': '3'}, offsets={x: [0, 0] for x in ['a', 'b', 'c', 'd', 'n1', 'n2', 'n3']},
    label_only=['a', 'b', 'c', 'd', 'n1', 'n2', 'n3'])


def main():
    assert sorted(EX) == list(range(191, 208))
    assert len(MODELS) == 19
    prep = dict(bookId='atanasyan-2023-7-9',
                edition='Атанасян и др. Геометрия 7–9. Базовый уровень. 14-е изд., перераб., Просвещение, 2023',
                chapter=3, title='Параллельные прямые', status='draft-content-preparation',
                source=dict(fileName='1701411644_geometrija_-uchebnik_-7-9-kl_-atanasjan_compressed.pdf',
                            sha256='3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72',
                            printedPageRange=[57, 66], pdfPageRange=[58, 67], pageOffset=1),
                review=dict(independentSource='pending', independentMathematics='pending',
                            interactiveModels='implemented-awaiting-independent-review', claude='not-performed-owner-task-waiver'),
                visualPolicy=['Собственная модель каждого подпункта.', 'Вычисления вне рисунка.',
                              'Дополнительные элементы по шагам.', 'Разные случаи на отдельных видах.'],
                coverage=dict(numberedExercises=17, parts=19, firstExercise=191, lastExercise=207,
                              missingNumberedExercises=[], unresolvedInterpretationExercises=[]),
                authorSourceCheck=dict(printedPages=[57, 65, 66], pdfPages=[58, 66, 67],
                                       method='Визуальное чтение исходных страниц и рисунков 111–114,123–124; теория сверена по страницам 53–61.',
                                       reviewedAt='2026-10-24', independent=False),
                exercises=list(EX.values()))
    (OUT / 'preparation/chapter-03-a.json').write_text(json.dumps(prep, ensure_ascii=False, indent=2) + '\n')
    (OUT / 'models/chapter-03-a.json').write_text(json.dumps(dict(schemaVersion=1, chapter=3, models=MODELS), ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(dict(exercises=len(EX), parts=len(MODELS),
                          steps=sum(len(part['steps']) for e in EX.values() for part in e['parts']),
                          views=sum(len(m['model']['views']) for m in MODELS),
                          claims=sum(len(m['model']['checks']) for m in MODELS))))


if __name__ == '__main__':
    main()
