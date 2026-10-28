#!/usr/bin/env python3
"""Original proofs/constructions and exact scenes for Atanasyan 2023, 430–445.

Printed pages 117–119 were visually read. Author checks do not constitute an
independent review. No source scans or source OCR are included here.
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


def arc(o, a, b, marks=0, radius=6):
    return dict(vertex=o, **{'from': a, 'to': b}, marks=marks, radius=radius)


def eq(a, b, marks=1):
    return dict(a=a, b=b, marks=marks)


def right(a, o, b):
    return dict(a=a, vertex=o, b=b, size=2.5)


def circle(o, r):
    return dict(center=o, through=r)


def ck(kind, **kw):
    return dict(type=kind, **kw)


def equal(*pairs):
    return ck('equalLength', segments=[list(p) for p in pairs])


def col(*ps):
    return ck('collinear', points=list(ps))


def perp(a, b, c, d):
    return ck('perpendicular', segments=[[a, b], [c, d]])


def par(a, b, c, d):
    return ck('parallel', segments=[[a, b], [c, d]])


def ang(a, o, b, degrees):
    return ck('angle', points=[a, o, b], degrees=degrees)


def ratio(a, b, c, d, value):
    return ck('distanceRatio', segments=[[a, b], [c, d]], ratio=value)


def S(prompt, text, reason, refs):
    return prompt, text, reason, refs if isinstance(refs, list) else [refs]


def mid(a, b):
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]


def dist(a, b):
    return math.dist(a, b)


def interp(a, b, t):
    return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]


def foot(p, a, b):
    u = [b[0] - a[0], b[1] - a[1]]
    t = sum((p[i] - a[i]) * u[i] for i in (0, 1)) / sum(x*x for x in u)
    return interp(a, b, t)


def intersection(a, b, c, d):
    u = [b[i] - a[i] for i in (0, 1)]
    v = [d[i] - c[i] for i in (0, 1)]
    w = [c[i] - a[i] for i in (0, 1)]
    cross = lambda x, y: x[0]*y[1] - x[1]*y[0]
    return interp(a, b, cross(w, v)/cross(u, v))


def unit(angle, radius=1):
    return [radius*math.cos(math.radians(angle)), radius*math.sin(math.radians(angle))]


def bisector(a, b, c):
    # Only coordinates use the angle-bisector ratio; the learner proofs do not.
    ab, ac = dist(a, b), dist(a, c)
    return interp(b, c, ab/(ab+ac))


def update(view, **kw):
    return dict(deepcopy(view), **kw)


def variant(points, view, suffix, label, unlock):
    names = {k: k+suffix for k in points}
    def rename(value):
        if isinstance(value, str): return names.get(value, value)
        if isinstance(value, list): return [rename(v) for v in value]
        if isinstance(value, dict): return {k: rename(v) for k, v in value.items()}
        return value
    v = rename(view)
    v.update(label=label, availableFromStep=unlock)
    return {names[k]: p for k, p in points.items()}, v, {names[k]: k for k in points if not k.startswith('_')}


def add(n, condition, answer, steps, points, neutral, views=None, cases=(), checks=(), givens=(), labels=None, notes=(), offsets=None):
    pages = [117] if n < 442 else [118, 119] if n == 442 else [119]
    all_views = {'neutral': deepcopy(neutral)}
    sequence = views or [neutral]
    for i in range(len(steps)):
        all_views['step-'+str(i+1)] = deepcopy(sequence[min(i, len(sequence)-1)])
        all_views['step-'+str(i+1)]['label'] = 'Шаг '+str(i+1)
    for i, view in enumerate(cases, 1): all_views['case-'+str(i)] = deepcopy(view)
    extents = list(points.values())
    circles = {(c['center'], c['through']) for v in all_views.values() for c in v.get('circles', [])}
    for o, through in circles:
        x, y = points[o]; r = dist(points[o], points[through])
        extents.extend([(x-r, y-r), (x+r, y+r)])
    xs, ys = zip(*extents)
    scale = min(76/(max(xs)-min(xs) or 1), 48/(max(ys)-min(ys) or 1))
    cx, cy = (max(xs)+min(xs))/2, (max(ys)+min(ys))/2
    transformed = {k: [round(50+scale*(x-cx), 9), round(35+scale*(y-cy), 9), 0] for k, (x,y) in points.items()}
    all_labels = {k:k for k in points if not k.startswith('_')}; all_labels.update(labels or {})
    model = dict(points=transformed, edges=[], planar=True, bounds=[0,0,100,70],
                 views=all_views, checks=list(checks), labels=all_labels, labelOffsets=offsets or {},
                 description='Собственный чертёж к этой задаче. Вспомогательные построения открываются по шагам, а разные случаи — отдельно.')
    item = dict(part='single', conditionSummary=condition, answer=answer, steps=[s[1] for s in steps],
                sourceVerified=True, mathVerified=True,
                visual=dict(initial='Только заданная конфигурация; вспомогательные точки и выводы скрыты.',
                            stepChanges=['Новые построения и доказанные отметки появляются на соответствующем шаге.'],
                            cases=[c['label'] for c in cases]))
    EX[n] = dict(number=n, printedPages=pages, pdfPages=[p+1 for p in pages], parts=[item], notes=list(notes))
    MODELS.append(dict(chapter='7-advanced', collection='main', number=n, part='single', model=model,
                       didactics=dict(steps=[dict(prompt=s[0], justification=s[2], theoryPoints=s[3]) for s in steps]), statementGivens=list(givens)))


# 430. Compare each half-angle with the opposite exterior-angle sum.
p={'A':(-3,0),'B':(-1,4),'C':(4,0)}; p['D']=bisector(p['B'],p['A'],p['C'])
b=scene('ABCD',tri()+[['B','D']],angleArcs=[arc('B','A','D',1),arc('B','D','C',1)])
add(430,'В треугольнике ABC отрезок BB₁ — биссектриса, B₁ лежит на AC. Докажите: BA > B₁A и BC > B₁C.',
    'BA > B₁A и BC > B₁C.',[
    S('Как обозначить равные половины угла B?','Пусть ∠ABB₁ = ∠B₁BC = x. Обозначим углы A и C через α и γ. Тогда α + 2x + γ = 180°.','Биссектриса и сумма углов треугольника.',[17,31]),
    S('Какой угол в треугольнике ABB₁ больше?','∠AB₁B = 180° − α − x = γ + x > x. Значит угол при B₁ больше угла при B.','Сумма углов; γ > 0.',31),
    S('Что это означает для сторон BA и B₁A?','В треугольнике ABB₁ против большего угла при B₁ лежит большая сторона BA. Поэтому BA > B₁A.','Соотношение сторон и противолежащих углов.',33),
    S('Как повторить рассуждение для второй стороны?','В треугольнике CBB₁ угол CB₁B равен α + x > x. Поэтому против него лежит BC > B₁C. Оба неравенства строгие.','То же соотношение сторон и углов.',[31,33])],p,b,
    [b,update(b,angleArcs=[arc('D','A','B',2),arc('B','A','D',1)]),update(b,highlightSegments=[['B','A']]),update(b,highlightSegments=[['B','C']])],
    checks=[col('A','D','C')],labels={'D':'B₁'})

# 431. Extend BD to AC; the exterior angle at D is obtuse.
p={'A':(0,4),'B':(-2,0),'C':(6,0)}
v=unit(-55,dist(p['A'],p['B']));p['D']=[p['A'][i]+v[i] for i in (0,1)]
p['E']=intersection(p['B'],p['D'],p['A'],p['C'])
b=scene('ABCD',tri()+[['A','D']],equalSegments=[eq('A','B'),eq('A','D')])
v1=update(b,points=list('ABCDE'),segments=b['segments']+[['B','E']])
add(431,'Точка D находится внутри треугольника ABC, причём AD = AB. Докажите, что AC > AB.',
    'AC > AE > AD = AB, где E — пересечение луча BD со стороной AC.',[
    S('Как использовать то, что D находится внутри?','Продолжим луч BD до пересечения E со стороной AC. Точки идут в порядке B, D, E, а E находится между A и C.','Внутренняя точка треугольника и пересечение луча со стороной.',[1,3,14]),
    S('Какие углы равны в ABD?','Так как AD = AB, треугольник ABD равнобедренный. Его углы ABD и ADB равны и каждый меньше 90°.','Свойство равнобедренного треугольника и сумма углов.',[18,31]),
    S('Как сравнить AE и AD?','Угол ADE смежен с острым ADB, поэтому он тупой. В треугольнике ADE угол AED острый, значит AE > AD.','Смежные углы; против большего угла лежит большая сторона.',[11,33]),
    S('Как завершить цепочку?','Поскольку E находится внутри AC, имеем AC > AE. Следовательно, AC > AE > AD = AB.','Сложение длин отрезков и данное равенство.',7)],p,b,[v1,v1,update(v1,highlightSegments=[['A','E']]),update(v1,highlightSegments=[['A','C']])],
    checks=[equal(('A','B'),('A','D')),col('B','D','E'),col('A','E','C')])

# 432. Reflection onto the longer side proves the segment inequality without similarity.
p={'A':(0,3),'B':(-4,0),'C':(2,0)};p['D']=bisector(p['A'],p['B'],p['C']);p['E']=interp(p['A'],p['B'],dist(p['A'],p['C'])/dist(p['A'],p['B']))
b=scene('ABCD',tri()+[['A','D']],angleArcs=[arc('A','B','D',1),arc('A','D','C',1)])
v=update(b,points=list('ABCDE'),segments=b['segments']+[['E','D']],equalSegments=[eq('A','E'),eq('A','C'),eq('E','D',2),eq('D','C',2)])
add(432,'В треугольнике ABC дано AB > AC, а AD — биссектриса. Докажите, что ∠ADB > ∠ADC и BD > CD.',
    '∠ADB > ∠ADC; BD > CD.',[
    S('Какие углы исходного треугольника сравнимы?','Из AB > AC следует ∠ACB > ∠ABC. Обозначим эти углы γ и β, а половину угла A — x.','Большей стороне противолежит больший угол.',33),
    S('Как сравнить углы при D?','∠ADB = 180° − x − β, а ∠ADC = 180° − x − γ. Так как γ > β, получаем ∠ADB > ∠ADC.','Сумма углов треугольника.',31),
    S('Как получить отрезок, равный CD, внутри AB?','На AB отметим E с AE = AC. Точка E лежит между A и B. Треугольники AED и ACD равны по двум сторонам и углу между ними, поэтому ED = CD и ∠AED = γ.','Построение отрезка и первый признак равенства.',[15,23]),
    S('Что даёт сравнение углов BED и EBD?','∠BED = 180° − γ = ∠A + β > β = ∠EBD. В треугольнике BED против большего угла лежит BD > ED = CD.','Смежные углы и соотношение сторон и углов.',[11,31,33])],p,b,[b,b,v,update(v,highlightSegments=[['B','D']])],
    checks=[col('B','D','C'),col('A','E','B'),equal(('A','E'),('A','C')),equal(('E','D'),('D','C'))],givens=['AB > AC'])

# 433. Double the median, then use an isosceles triangle.
p={'A':(0,3),'B':(-3,0),'C':(3,0),'D':(0,0),'E':(0,-3)}
b=scene('ABCD',tri()+[['A','D']],equalSegments=[eq('B','D'),eq('D','C')],angleArcs=[arc('A','B','D',1),arc('A','D','C',1)])
v=update(b,points=list('ABCDE'),segments=b['segments']+[['D','E'],['E','C']],equalSegments=[eq('B','D'),eq('D','C'),eq('A','D',2),eq('D','E',2)])
add(433,'Докажите: если биссектриса треугольника одновременно является медианой, то треугольник равнобедренный.',
    'Две стороны, выходящие из вершины этой биссектрисы, равны.',[
    S('Как записать обе роли отрезка?','Пусть AD — биссектриса и медиана треугольника ABC. Тогда ∠BAD = ∠DAC и BD = DC.','Определения биссектрисы и медианы.',17),
    S('Какое дополнительное построение поможет?','Продолжим AD за D до E так, чтобы DE = AD. Треугольники ADB и EDC равны: AD = DE, DB = DC, а углы при D вертикальные.','Первый признак равенства треугольников.',[11,15]),
    S('Какие элементы теперь можно сравнить?','Из равенства треугольников получаем AB = EC и ∠BAD = ∠CED. Но ∠BAD = ∠DAC, значит ∠CEA = ∠CAE.','Соответствующие элементы равных треугольников; A, D, E лежат на одной прямой.',[5,15]),
    S('Почему равны стороны исходного треугольника?','В треугольнике ACE равные углы при A и E лежат против равных сторон CE и CA. Поэтому AB = CE = CA.','Признак равнобедренного треугольника.',[18,33])],p,b,[b,v,v,update(v,highlightSegments=[['A','B'],['A','C']])],
    checks=[col('A','D','E'),col('B','D','C'),equal(('A','D'),('D','E')),equal(('B','D'),('D','C')),equal(('A','B'),('E','C'),('A','C'))])

# 434. The same doubled-median construction compares the two angles.
p={'A':(0,3),'B':(-4,0),'C':(2,0)};p['M']=mid(p['B'],p['C']);p['E']=interp(p['A'],p['M'],2)
b=scene('ABCM',tri()+[['A','M']],equalSegments=[eq('B','M'),eq('M','C')])
v=update(b,points=list('ABCME'),segments=b['segments']+[['M','E'],['E','C']],equalSegments=[eq('B','M'),eq('M','C'),eq('A','M',2),eq('M','E',2)])
add(434,'Две стороны треугольника не равны. Докажите: медиана из их общей вершины образует больший угол с меньшей стороной.',
    'Если AB > AC и AM — медиана, то ∠MAC > ∠BAM; при AB < AC неравенство меняется местами.',[
    S('Как выбрать обозначения без потери общего случая?','Пусть AB > AC, а M — середина BC. Нужно доказать ∠MAC > ∠BAM. Если длиннее AC, достаточно поменять буквы B и C.','Симметрия обозначений в условии.',17),
    S('Зачем удвоить медиану?','На продолжении AM за M отложим ME = AM. Треугольники AMB и EMC равны по двум сторонам и вертикальному углу.','Первый признак равенства.',[11,15]),
    S('Как перенести неравенство сторон в один треугольник?','Получаем EC = AB > AC и ∠CEM = ∠BAM. Рассмотрим треугольник ACE.','Соответствующие стороны и углы равных треугольников.',15),
    S('Какой угол в ACE больше?','Против EC > AC лежат углы CAE > CEA. Так как A, M, E коллинеарны, это и есть ∠MAC > ∠BAM.','Соотношение сторон и углов.',33)],p,b,[b,v,v,update(v,angleArcs=[arc('A','M','C',2),arc('A','B','M',1)])],
    checks=[col('A','M','E'),col('B','M','C'),equal(('A','M'),('M','E')),equal(('B','M'),('M','C')),equal(('A','B'),('E','C'))],givens=['AB > AC'])

# 435. Congruence does not imply a prescribed vertex correspondence; handle both.
p={'A':(0,3),'B':(-4,0),'C':(2,0),'M':(-.5,0)}
b=scene('ABCM',tri()+[['A','M']])
add(435,'В треугольнике ABC стороны AB и AC не равны. Точка M лежит на стороне BC. Докажите, что треугольники AMB и AMC не равны.',
    'Треугольники AMB и AMC не равны при любом внутреннем положении M на BC.',[
    S('Почему нельзя сразу предположить соответствие вершин?','Равенство двух треугольников допускает перестановку вершин. Поэтому проверим все возможные соответствия длин, а не только AB ↔ AC.','Определение равных треугольников.',[5,14]),
    S('Что остаётся после исключения общей длины AM?','Предположим, что треугольники равны. Их наборы длин {AM, AB, BM} и {AM, AC, CM} совпадают. Удалим по одному одинаковому AM. Тогда либо AB = AC и BM = CM, либо AB = CM и BM = AC. Это верно и при повторяющихся длинах.','Соответствующие стороны равных треугольников; два способа сопоставить оставшуюся пару.',14),
    S('Почему первый вариант невозможен?','Равенство AB = AC противоречит условию.','Данное неравенство сторон.',6),
    S('Чем противоречив второй вариант?','Если AB = CM и AC = BM, то AB + AC = CM + BM = BC. Но в невырожденном треугольнике ABC сумма двух сторон строго больше третьей. Противоречие.','Сложение отрезков и неравенство треугольника.',[7,34]),
    S('Что с концами стороны BC?','Если M совпадает с B или C, один из двух рассматриваемых треугольников вырожден, а другой совпадает с ABC. Они также не равны. Обычная постановка задачи о двух треугольниках подразумевает M внутри BC.','Различие вырожденной и невырожденной фигуры.',14)],p,b,
    [b,b,update(b,highlightSegments=[['A','B'],['A','C']]),update(b,highlightSegments=[['B','M'],['M','C']]),b],
    checks=[col('B','M','C')],givens=['AB ≠ AC'],notes=['В доказательстве явно учтено произвольное соответствие вершин равных треугольников.'])

# 436. Reflect B in the perpendicular to the bisector; its image lies beyond A on CA.
p={'A':(0,0),'B':unit(30,4),'C':unit(-30,6),'H':(0,2),'D':(-4*math.cos(math.pi/6),2),'_u':(0,-2),'_v':(0,4),'_bis':(3,0)}
b=scene('ABCH',tri()+[['B','H']],lines=[['_u','_v']],rays=[['A','_bis']],rightAngles=[right('B','H','A'),right('_v','A','_bis')],angleArcs=[arc('A','B','_bis',1),arc('A','_bis','C',1)])
v=update(b,points=list('ABCHD'),segments=tri()+[['B','D'],['C','H'],['A','D']],equalSegments=[eq('B','H'),eq('H','D'),eq('A','B',2),eq('A','D',2)])
add(436,'Через A проведена прямая, перпендикулярная биссектрисе угла A треугольника ABC. Из B опущен перпендикуляр BH к этой прямой. Докажите: периметр BCH больше периметра ABC.',
    'BC + BH + CH > BC + AB + AC.',[
    S('Как использовать прямую AH как ось отражения?','Отразим B относительно данной прямой AH и обозначим образ через D. Тогда H — середина BD, BH = HD и AD = AB.','Свойства осевой симметрии.',[44,45]),
    S('Где расположен образ луча AB?','Данная ось перпендикулярна внутренней биссектрисе. Поэтому луч AB отражается в луч, противоположный AC. Значит D, A, C лежат в этом порядке и DC = DA + AC = AB + AC.','Равные половины угла A и смежные углы; сложение отрезков.',[7,11,17,45]),
    S('Какое строгое неравенство даёт треугольник DHC?','В невырожденном треугольнике DHC имеем DH + HC > DC. Подставляя DH = BH, получаем BH + HC > AB + AC.','Неравенство треугольника.',34),
    S('Как перейти к периметрам?','Прибавим BC к обеим частям: BC + BH + HC > BC + AB + AC. Это требуемое сравнение периметров.','Периметр как сумма длин сторон.',14)],p,b,[v,v,update(v,highlightSegments=[['D','H'],['H','C']]),update(v,highlightSegments=tri('B','C','H'))],
    checks=[perp('B','H','A','H'),equal(('B','H'),('H','D')),equal(('A','B'),('A','D')),col('B','H','D'),col('D','A','C')])

# 437/438. All relative positions of the altitude foot are retained separately.
def feet_config(ax):
    q={'A':(ax,3),'B':(-3,0),'C':(4,0)}
    q['D']=bisector(q['A'],q['B'],q['C']);q['H']=foot(q['A'],q['B'],q['C']);q['M']=mid(q['B'],q['C'])
    return q


p=feet_config(-1)
b=scene('ABCDH',tri()+[['A','D'],['A','H']],rightAngles=[right('A','H','C')],angleArcs=[arc('A','B','D',1),arc('A','D','C',1)])
cases=[];labels={};checks=[col('B','H','D','C'),perp('A','H','B','C')]
for suffix,ax,label in [('o',-4,'Основание высоты вне стороны BC'),('b',-3,'Высота проходит через вершину B')]:
    q=feet_config(ax);vv=scene('ABCDH' if ax!=-3 else 'ABCD',tri()+[['A','D'],['A','H']],rightAngles=[right('A','H','C')])
    if ax==-3: vv['note']='Основание H совпадает с B.'
    else: vv['dashSegments']=[['B','H']]
    qp,qv,ql=variant(q,vv,suffix,label,3);p.update(qp);cases.append(qv);labels.update(ql)
    checks.extend([col('B'+suffix,'D'+suffix,'C'+suffix),perp('A'+suffix,'H'+suffix,'B'+suffix,'C'+suffix)])
add(437,'В треугольнике ABC дано AB < AC; AD — биссектриса, AH — высота. Докажите, что H лежит на луче DB.',
    'Основание H находится на луче DB и не совпадает с D; оно может лежать внутри BC, совпасть с B или оказаться за B.',[
    S('Как сравниваются углы B и C?','Из AB < AC следует ∠C < ∠B. Пусть половина угла A равна x.','Соотношение сторон и противолежащих углов.',33),
    S('Чему равен угол ADB?','∠ADB = 180° − ∠B − x = (180° − ∠B + ∠C)/2 < 90°. Значит луч DA образует острый угол именно с лучом DB.','Сумма углов треугольника и равенство половин угла A.',[17,31]),
    S('В какую сторону от D попадёт основание перпендикуляра?','Перпендикуляр из A к прямой BC имеет основание на той стороне от D, куда направлен луч DB: иначе угол ADB был бы прямым или тупым. Поэтому H принадлежит лучу DB и H ≠ D.','В прямоугольном треугольнике оба непрямых угла острые.',[16,31,35]),
    S('Нужно ли H обязательно находиться внутри стороны?','Нет. При остром угле B точка H лежит между B и D; при прямом B совпадает с B; при тупом B лежит за B. Во всех трёх случаях это один и тот же луч DB.','Виды углов и положение основания высоты.',[17,32])],p,b,[b,update(b,angleArcs=[arc('D','B','A',1)]),update(b,highlightSegments=[['D','H']]),b],
    cases=cases,checks=checks,labels=labels,givens=['AB < AC'])

p=feet_config(-1)
p['E']=interp(p['A'],p['C'],dist(p['A'],p['B'])/dist(p['A'],p['C']))
b=scene('ABCDHM',tri()+[['A','D'],['A','H'],['A','M']],equalSegments=[eq('B','M'),eq('M','C')],rightAngles=[right('A','H','C')],angleArcs=[arc('A','B','D',1),arc('A','D','C',1)])
q=feet_config(-4);vv=scene('ABCDHM',tri()+[['A','D'],['A','H'],['A','M']],dashSegments=[['B','H']],equalSegments=[eq('B','M'),eq('M','C')],rightAngles=[right('A','H','C')]);qp,qv,ql=variant(q,vv,'o','Высота вне треугольника',4);p.update(qp)
add(438,'В неравнобедренном треугольнике из одной вершины проведены биссектриса, медиана и высота. Докажите: основание биссектрисы лежит между основаниями медианы и высоты.',
    'Если AD — биссектриса, AM — медиана, AH — высота, то D лежит строго между H и M.',[
    S('Как выбрать удобный порядок сторон?','Пусть AB < AC. Для противоположного неравенства можно поменять буквы B и C. Обозначим основания биссектрисы, медианы и высоты через D, M и H.','Условие неравнобедренности и определения отрезков.',17),
    S('С какой стороны от D лежит H?','Как в задаче 437, ∠ADB = (180° − ∠B + ∠C)/2 < 90°. Поэтому H лежит на луче DB и H ≠ D.','Сумма углов и основание перпендикуляра.',[31,33,35]),
    S('Почему M лежит по другую сторону от D?','Отметим E на AC так, чтобы AE = AB. Треугольники AED и ABD равны по двум сторонам и углу между ними, поэтому ED = BD. В треугольнике CED угол CED = 180° − ∠B = ∠A + ∠C > ∠C, значит CD > ED = BD. Поэтому D лежит между B и серединой M стороны BC.','Первый признак равенства; смежные углы; соотношение сторон и углов.',[15,31,33]),
    S('Как соединить два вывода?','H находится со стороны B от D, а M — со стороны C. Следовательно, D лежит строго между H и M. Это верно и при высоте вне треугольника.','Порядок точек на одной прямой.',1)],p,b,[b,update(b,highlightSegments=[['D','H']]),update(b,points=list('ABCDHME'),segments=b['segments']+[['E','D']],equalSegments=[eq('A','E',2),eq('A','B',2),eq('E','D',3),eq('B','D',3)]),update(b,highlightSegments=[['H','D'],['D','M']])],
    cases=[qv],checks=[col('B','H','D','M','C'),perp('A','H','B','C'),equal(('B','M'),('M','C')),col('Bo','Ho','Do','Mo','Co'),col('A','E','C'),equal(('A','E'),('A','B')),equal(('E','D'),('B','D'))],labels=ql,givens=['AB < AC'])

# 439. Prove the midpoint-of-hypotenuse lemma within the solution.
p={'A':(0,0),'B':(0,3),'C':(5,0)};p['M']=mid(p['B'],p['C']);p['D']=bisector(p['A'],p['B'],p['C']);p['H']=foot(p['A'],p['B'],p['C']);p['E']=interp(p['A'],p['M'],2)
b=scene('ABCDHM',tri()+[['A','D'],['A','H'],['A','M']],equalSegments=[eq('B','M'),eq('M','C')],rightAngles=[right('B','A','C'),right('A','H','C')],angleArcs=[arc('A','B','D',1),arc('A','D','C',1)])
v=update(b,points=list('ABCDHME'),segments=b['segments']+[['M','E'],['E','B'],['E','C']])
add(439,'В прямоугольном треугольнике с неравными катетами биссектриса прямого угла, высота и медиана выходят из одной вершины. Докажите: биссектриса делит пополам угол между высотой и медианой.',
    'Для AD — биссектрисы прямого угла A, AH — высоты и AM — медианы: ∠MAD = ∠DAH (либо тот же порядок с H и M, поменянными местами).',[
    S('Как выбрать более короткий катет?','Пусть ∠A = 90° и AB < AC. Положим γ = ∠ACB. Тогда γ < 45°, а AD образует с AC угол 45°.','Сумма углов и сравнение углов против неравных катетов.',[17,31,33]),
    S('Почему AM = CM?','Продолжим AM до E с ME = AM. Из равенства треугольников BMA и CME следует CE = AB и CE ∥ AB. Поэтому AC ⟂ CE. Прямоугольные треугольники ABC и CEA равны по двум катетам: AB = CE, AC — общий. Значит BC = AE = 2AM. Так как CM = BC/2, получаем AM = CM.','Первый признак; параллельность по накрест лежащим углам; равенство прямоугольных треугольников.',[15,25,36]),
    S('Какой угол медиана образует с AC?','Треугольник AMC равнобедренный, поэтому ∠MAC = ∠ACM = γ.','Равные углы при основании равнобедренного треугольника.',18),
    S('Какой угол высота образует с AC?','В прямоугольном треугольнике AHC угол ACH = γ, следовательно ∠HAC = 90° − γ.','Сумма углов прямоугольного треугольника.',[31,35]),
    S('Почему AD делит угол MAH пополам?','Луч AM образует с AC угол γ < 45°, луч AD — 45°, луч AH — 90° − γ > 45°. Поэтому ∠MAD = 45° − γ = ∠DAH. При AB > AC рассуждение повторяется после перестановки B и C.','Вычитание углов и порядок лучей.',[6,9])],p,b,[b,v,update(b,equalSegments=[eq('A','M'),eq('C','M')]),b,update(b,angleArcs=[arc('A','M','D',2),arc('A','D','H',2)])],
    checks=[perp('A','B','A','C'),perp('A','H','B','C'),equal(('A','M'),('B','M'),('C','M')),equal(('A','M'),('M','E')),par('C','E','A','B'),col('B','M','H','D','C')])

# 440. A reflection in the median gives an equilateral triangle, avoiding trigonometry.
p={'A':(0,3),'H':(0,0),'B':(-3*math.sqrt(3),0),'M':(-math.sqrt(3),0),'C':(math.sqrt(3),0),'P':(0,-3)}
b=scene('ABCHM',tri()+[['A','H'],['A','M']],equalSegments=[eq('B','M'),eq('M','C')],rightAngles=[right('A','H','C')],angleArcs=[arc('A','B','M',1),arc('A','M','H',1),arc('A','H','C',1)])
v1=update(b,equalSegments=[eq('B','M'),eq('M','C'),eq('M','H',2),eq('H','C',2)])
v2=update(v1,points=list('ABCHMP'),segments=b['segments']+[['H','P'],['M','P'],['P','C']])
add(440,'Медиана и высота, проведённые из одной вершины треугольника, делят угол при этой вершине на три равные части. Докажите, что треугольник прямоугольный.',
    'Каждая из трёх частей равна 30°, поэтому разделённый угол равен 90°.',[
    S('Как зафиксировать порядок лучей?','Обозначим вершину через A, медиану через AM, высоту через AH. Поменяв B и C при необходимости, получим порядок лучей AB, AM, AH, AC. Пусть каждая часть угла равна x. Тогда 0 < x < 60°.','Условие о трёх равных частях внутреннего угла.',[9,17]),
    S('Почему H — середина MC?','Прямоугольные треугольники AMH и ACH равны по катету AH и прилежащему острому углу x. Поэтому MH = HC и AM = AC. Точки идут в порядке B, M, H, C.','Признак равенства прямоугольных треугольников.',36),
    S('Куда отразится B относительно AM?','Отразим B относительно прямой AM в точку P. Равенство ∠BAM = ∠MAH помещает P на луч AH. При отражении MB = MP, а AM остаётся на месте. Угол AMP равен углу BMA = 90° + x, поэтому P лежит за H.','Свойства осевой симметрии; сумма углов AMH и смежные углы.',[11,31,45]),
    S('Почему треугольник MPC равносторонний?','Из медианы BM = MC и отражения MP = BM получаем MP = MC. Так как H — середина MC и PH ⟂ MC, точка P лежит на серединном перпендикуляре: PM = PC. Значит MP = MC = PC.','Медиана и свойство серединного перпендикуляра.',[17,40]),
    S('Как найти x?','В равностороннем MPC угол PMC равен 60°. Лучи MA и MP лежат по разные стороны MC, а MH направлен так же, как MC. Поэтому ∠AMP = ∠AMH + ∠HMP = (90° − x) + 60° = 150° − x. При этом из отражения ∠AMP = 90° + x. Получаем 150° − x = 90° + x, откуда x = 30°.','Углы равностороннего треугольника и сложение смежных частей.',[9,18,31]),
    S('Каков угол исходного треугольника?','∠BAC = 3x = 90°. Следовательно, треугольник ABC прямоугольный при A.','Три равные части исходного угла.',9)],p,b,[b,v1,v2,update(v2,equalSegments=[eq('M','P',3),eq('M','C',3),eq('P','C',3)]),v2,update(b,rightAngles=[right('B','A','C'),right('A','H','C')])],
    checks=[col('B','M','H','C'),col('A','H','P'),equal(('B','M'),('M','C'),('M','P'),('P','C')),equal(('M','H'),('H','C')),equal(('A','B'),('A','P')),perp('A','H','B','C'),ang('B','A','M',30),ang('M','A','H',30),ang('H','A','C',30)])

# 441. A chain of universal height bounds forces equality everywhere.
p={'A':(0,3),'B':(3,0),'C':(0,0)};b=scene('ABC',tri())
v=update(b,rightAngles=[right('A','C','B')],equalSegments=[eq('A','C'),eq('B','C')],note='Оба основания высот совпадают с C: A₁ = B₁ = C.')
add(441,'В треугольнике ABC высота AA₁ не меньше BC, а высота BB₁ не меньше AC. Докажите, что ABC — равнобедренный прямоугольный треугольник.',
    'AC = BC, ∠C = 90°; оба основания высот A₁ и B₁ совпадают с C.',[
    S('С какой стороной всегда можно сравнить высоту AA₁?','Высота AA₁ — расстояние от A до прямой BC. Поэтому AA₁ ≤ AC, причём равенство возможно только при A₁ = C. Аналогично BB₁ ≤ BC, с равенством только при B₁ = C.','Перпендикуляр короче любой наклонной к той же прямой.',37),
    S('Как объединить эти оценки с условием?','По условию BC ≤ AA₁ и AC ≤ BB₁. Получаем замкнутую цепочку BC ≤ AA₁ ≤ AC ≤ BB₁ ≤ BC.','Данные неравенства и оценки расстояний.',6),
    S('Что означает такая цепочка?','Все четыре величины равны. В частности AC = BC, AA₁ = AC и BB₁ = BC.','Если величина не меньше и не больше другой, они равны.',6),
    S('Почему угол C прямой?','Равенство AA₁ = AC означает A₁ = C, поэтому AC ⟂ BC. Значит ∠C = 90°, а равенство AC = BC делает треугольник равнобедренным.','Условие равенства для расстояния до прямой.',[12,18,37])],p,b,[b,b,update(b,equalSegments=[eq('A','C'),eq('B','C')]),v],
    checks=[perp('A','C','B','C'),equal(('A','C'),('B','C'))],givens=['AA₁ ≥ BC','BB₁ ≥ AC'])

# 442. Given side lengths and altitude: all existence and congruence cases.
p={'A':(0,3),'H':(0,0),'B':(-4,0),'C':(math.sqrt(27),0),'D':(-math.sqrt(27),0),'_left':(-6,0),'_right':(6,0),
   'U':(-5,-2),'V':(0,-2),'W':(-5,-3.2),'X':(1,-3.2),'Y':(-5,-4.4),'Z':(-2,-4.4),'_rb':(5,3),'_rc':(6,3)}
b=scene('UVWXYZ',[['U','V'],['W','X'],['Y','Z']],equalSegments=[eq('U','V'),eq('W','X',2),eq('Y','Z',3)])
v1=scene('AH',[['A','H']],lines=[['_left','_right']],rightAngles=[right('A','H','_right')])
v2=update(v1,points=list('AHB'),segments=[['A','H'],['A','B']],circles=[circle('A','_rb')])
v3=scene('ABCH',tri()+[['A','H']],rightAngles=[right('A','H','C')])
other=scene('ABDH',tri('A','B','D')+[['A','H']],lines=[['_left','_right']],rightAngles=[right('A','H','_right')],label='Вторая форма: обе вершины по одну сторону H',availableFromStep=5)
cases=[other];labels={'U':'P','V':'Q','W':'R','X':'S','Y':'T','Z':'U','D':'C′'}
checks=[perp('A','H','B','C'),equal(('A','B'),('U','V')),equal(('A','C'),('W','X')),equal(('A','D'),('A','C')),equal(('A','H'),('Y','Z'))]
for suffix,r1,r2,h,label in [('e',5,5,3,'Одна форма: данные стороны равны'),('r',5,3,3,'Одна форма: одна сторона равна высоте'),('n',2,5,3,'Нет решения: сторона короче высоты'),('z',3,3,3,'Нет решения: обе стороны равны высоте')]:
    q={'A':(0,h),'H':(0,0),'_L':(-6,0),'_R':(6,0),'_r':(r1,h),'_s':(r2,h)}
    if suffix in ('e','r'):
        q['B']=(-math.sqrt(r1*r1-h*h),0);q['C']=(math.sqrt(r2*r2-h*h),0)
        vv=scene('ABCH' if suffix=='e' else 'ABC',tri()+[['A','H']],rightAngles=[right('A','H','B')])
        if suffix=='r':vv['note']='Точка C совпадает с H.'
    else:
        vv=scene('AH',[['A','H']],lines=[['_L','_R']],circles=[circle('A','_r')],rightAngles=[right('A','H','_R')])
        vv['note']='Окружность меньшего радиуса не пересекает прямую основания.' if suffix=='n' else 'Обе окружности касаются прямой в H: B = C = H, треугольник вырожден.'
    qp,qv,ql=variant(q,vv,suffix,label,5);p.update(qp);cases.append(qv);labels.update(ql)
add(442,'Постройте треугольник по двум данным сторонам и высоте, проведённой к третьей стороне. Исследуйте существование и число решений.',
    'При положительных b, c, h решение существует тогда и только тогда, когда b ≥ h, c ≥ h и не одновременно b = c = h. При b,c > h и b ≠ c — две формы; при b = c > h или ровно одной стороне, равной h, — одна форма с точностью до равенства треугольников.',[
    S('Что нужно восстановить сначала?','Обозначим заданные стороны AB = c, AC = b, высоту AH = h. Построим AH длины h и через H проведём прямую l, перпендикулярную AH. Вершины B и C должны лежать на l.','Определение высоты и построение перпендикуляра.',[17,23]),
    S('Где взять вершину B?','Пересечём l с окружностью центра A радиуса c. Любая точка пересечения может быть B. Если c < h, таких точек нет; если c = h, получается только B = H.','Расстояние от центра окружности до прямой.',[21,37,42]),
    S('Как выбрать C и проверить результат?','Пересечём l с окружностью центра A радиуса b и возьмём C, отличную от B. Соединим A с B и C. По построению AB = c, AC = b, AH ⟂ BC и AH = h.','Окружность и определение высоты.',[17,21]),
    S('Когда построение невозможно?','Если b < h или c < h, соответствующая окружность не достигает l. Если b = c = h, обе дают только H, так что B = C и треугольник вырожден. Других препятствий нет.','Перпендикуляр — кратчайший отрезок до прямой; разные вершины треугольника.',[14,37,42]),
    S('Сколько неравных треугольников получается?','Когда b и c различны и оба больше h, B и C можно взять по разные стороны H либо по одну сторону: длины BC различны, значит получаются две формы. При b = c > h выбор по одну сторону совпадёт, остаётся одна равнобедренная форма. Если ровно одна сторона равна h, одна вершина совпадает с H и остаётся одна прямоугольная форма. Зеркальные положения считаем равными треугольниками.','Взаимное положение точек на прямой; признаки равенства и осевая симметрия.',[7,20,45])],p,b,[v1,v2,update(v3,circles=[circle('A','_rc')],lines=[['_left','_right']]),v1,v3],cases=cases,checks=checks,labels=labels,
    givens=['Даны длины b > 0, c > 0 и h > 0.','PQ задаёт c = AB, RS задаёт b = AC, TU задаёт h = AH.'],notes=['Все конструктивные случаи источника на печатных страницах 118–119 включены. Зеркальные изображения не считаются новыми формами.'])

# 443. Determine D first, then draw the perpendicular to the chosen leg.
beta=50
p={'B':(0,0),'_ray':(6,0),'_upper':unit(beta,6),'C':(4,0),'A':(4,4*math.tan(math.radians(beta))),'D':(4,4*math.tan(math.radians(beta/2))),'U':(-1,-2),'V':(math.hypot(4,4*math.tan(math.radians(beta/2)))-1,-2)}
b=scene('BUV',[['U','V']],rays=[['B','_ray'],['B','_upper']])
v1=update(b,rays=b['rays']+[['B','D']],angleArcs=[arc('B','_ray','D',1),arc('B','D','_upper',1)])
v2=update(v1,points=list('BDUV'),segments=b['segments']+[['B','D']])
v3=scene('ABCD',tri()+[['B','D']],rightAngles=[right('B','C','A')],angleArcs=[arc('B','C','D',1),arc('B','D','A',1)])
add(443,'Постройте прямоугольный треугольник ABC по острому углу B и длине биссектрисы BD.',
    'Для 0° < B < 90° и BD > 0 существует единственный треугольник с точностью до равенства.',[
    S('Где удобно разместить данный угол?','Можно считать прямым угол C: случай прямого угла A получается перестановкой A и C и даёт равный треугольник. Построим данный угол с вершиной B; его лучи назовём BC и BA. Проведём биссектрису угла.','Построение данного угла и его биссектрисы.',23),
    S('Как определить точку D?','На биссектрисе отложим BD = UV, где UV — заданный отрезок. Точка D теперь определена однозначно.','Построение отрезка данной длины на луче.',[3,23]),
    S('Как восстановить оставшиеся вершины?','Через D проведём прямую, перпендикулярную лучу BC. Её пересечения с лучами BC и BA обозначим C и A. Так как исходный угол острый, эти точки лежат на самих лучах, а D — между C и A.','Построение перпендикуляра и расположение лучей острого угла.',[16,23,35]),
    S('Почему построение решает задачу?','Угол C прямой; угол B задан; D принадлежит AC, а BD имеет данную длину и делит угол B пополам. Все условия выполнены.','Определения прямоугольного треугольника и биссектрисы.',[17,32]),
    S('Есть ли другие неравные решения?','В любом искомом треугольнике после совмещения данного угла точка D обязана занять построенное положение, а AC — единственную прямую через D, перпендикулярную BC. Поэтому решение единственно. Нулевой или неострый угол и нулевая длина BD не отвечают условию.','Единственность отложения отрезка и перпендикуляра.',[16,23])],p,b,[v1,v2,v3,v3,v3],
    checks=[col('A','D','C'),perp('A','C','B','C'),ang('C','B','D',25),ang('D','B','A',25),equal(('B','D'),('U','V'))],givens=['Отрезок UV задаёт длину биссектрисы BD.'])

# 444. Double O about the desired midpoint, reducing to two standard circles.
r=2;d=4;x=(d*d+3*r*r)/(2*d);y=math.sqrt(4*r*r-x*x)
p={'O':(0,0),'A':(d,0),'_r':(r,0),'_2r':(2*r,0),'_ar':(d+r,0),'X':(x,y),'B':(x/2,y/2),'C':(x-d,y)}
b=scene('OA',circles=[circle('O','_r')])
v1=update(b,circles=[circle('O','_r'),circle('O','_2r')])
v2=update(b,points=list('OAX'),circles=[circle('O','_2r'),circle('A','_ar')])
v3=update(v2,points=list('OAXB'),segments=[['O','X']],equalSegments=[eq('O','B'),eq('B','X')])
v4=scene('OABCX',tri('O','C','X')+[['A','C'],['O','X']],circles=[circle('O','_r')],equalSegments=[eq('A','B'),eq('B','C'),eq('O','B',2),eq('B','X',2)])
final=scene('OABC',[['A','C']],circles=[circle('O','_r')],equalSegments=[eq('A','B'),eq('B','C')])
q={k:(a,-b0) for k,(a,b0) in p.items()};qp,qv,ql=variant(q,final,'s','Второе симметричное решение',5);p.update(qp);cases=[qv];labels=ql
qt={'O':(0,0),'A':(6,0),'B':(2,0),'C':(-2,0),'X':(4,0),'_r':(2,0),'_2r':(4,0),'_ar':(8,0)}
qp,qv,ql=variant(qt,scene('OABC',[['A','C']],circles=[circle('O','_r')],equalSegments=[eq('A','B'),eq('B','C')]),'t','OA = 3r: единственная прямая',5);p.update(qp);cases.append(qv);labels.update(ql)
qn={'O':(0,0),'A':(7,0),'_2r':(4,0),'_ar':(9,0)}
qp,qv,ql=variant(qn,scene('OA',circles=[circle('O','_2r'),circle('A','_ar')],note='Вспомогательные окружности не имеют общих точек.'),'n','OA > 3r: решений нет',5);p.update(qp);cases.append(qv);labels.update(ql)
add(444,'Даны окружность с центром O и точка A вне неё. Проведите через A прямую, пересекающую окружность в B и C так, чтобы AB = BC.',
    'Если радиус равен r, а OA = d > r: при r < d < 3r — две прямые; при d = 3r — одна; при d > 3r — ни одной.',[
    S('Как заменить условие AB = BC построением окружностей?','В искомой конфигурации B — середина AC. Отразим O относительно B в X, то есть отложим BX = BO на продолжении OB. Треугольники ABX и CBO равны по двум сторонам и вертикальному углу. Поэтому AX = OC = r, а OX = 2OB = 2r.','Первый признак равенства и середина отрезка.',[11,15]),
    S('Где искать X?','Построим окружности с центрами O и A радиусов 2r и r. Их общие точки — все возможные X. Радиус 2r получаем, откладывая данный радиус дважды.','Окружность как множество точек на заданном расстоянии.',[7,21,23]),
    S('Как восстановить B и C?','Для каждой общей точки X возьмём B — середину OX. Затем на прямой AB отложим BC = AB за B, получив C. Так B — середина и OX, и AC.','Построение середины и отрезка заданной длины.',23),
    S('Почему обе точки лежат на исходной окружности?','OB = OX/2 = r. Треугольники ABX и CBO равны по двум сторонам и вертикальному углу, поэтому OC = AX = r. Значит B и C на исходной окружности и AB = BC. Точка A вне неё, поэтому B — ближайшая точка пересечения, C — дальняя.','Первый признак равенства; определение окружности.',[11,15,21]),
    S('Когда есть решения и сколько их?','Две вспомогательные окружности радиусов 2r и r пересекаются в двух точках при r < OA < 3r, касаются внешним образом при OA = 3r и не встречаются при OA > 3r. Условие OA > r уже дано. Каждая общая точка задаёт одну прямую; при двух точках прямые симметричны относительно AO и различны. В граничном случае OA = 3r получается сама AO.','Условия построения треугольника OAX со сторонами 2r, r, OA; неравенство треугольника.',[21,34,38])],p,b,[v1,v2,v3,v4,final],cases=cases,labels=labels,
    checks=[equal(('O','B'),('O','C'),('A','X')),ratio('O','X','O','B',2),equal(('O','B'),('B','X')),equal(('A','B'),('B','C')),col('A','B','C'),col('O','B','X'),equal(('Ot','Bt'),('Ot','Ct')),equal(('At','Bt'),('Bt','Ct')),col('At','Bt','Ct')],
    notes=['Построение доказано равенством треугольников, без теоремы о средней линии или гомотетии.'])

# 445. Recover the fixed side from the angle/height; use an isosceles completion.
alpha=55;h=3;c=h/math.sin(math.radians(alpha));s=9
bx=c*math.cos(math.radians(alpha));cx=(s*s-c*c)/(2*(s-bx))
p={'A':(0,0),'B':(bx,h),'H':(bx,0),'E':(s,0),'C':(cx,0),'N':mid((bx,h),(s,0)),
   '_ray':(10,0),'_upper':unit(alpha,7),'_L':(-1,h),'_R':(10,h),'P':(-1,-2),'Q':(s+c-1,-2),'U':(-1,-3.3),'V':(2,-3.3)}
p['_bis']=[p['N'][0]+h,p['N'][1]+s-bx]
b=scene('APQUV',[['P','Q'],['U','V']],rays=[['A','_ray'],['A','_upper']])
v1=update(b,points=list('ABH'),segments=[['B','H']],rays=[['A','_ray'],['A','_upper']],lines=[['_L','_R']],rightAngles=[right('B','H','A')])
v2=scene('ABE',[['A','B'],['A','E'],['B','E']])
v3=update(v2,points=list('ABENC'),lines=[['N','_bis']],equalSegments=[eq('B','N'),eq('N','E')],rightAngles=[right('B','N','_bis')])
v4=scene('ABCEH',tri()+[['C','E'],['B','E'],['B','H']],rightAngles=[right('B','H','A')],equalSegments=[eq('B','C'),eq('C','E')])
q={'A':(0,0),'B':(-2,3),'H':(-2,0),'E':(8,0),'_ray':(9,0)}
qc=dist(q['A'],q['B']);q['C']=((64-qc*qc)/(2*(8-(-2))),0)
qv=scene('ABCEH',tri()+[['C','E'],['B','H']],lines=[['H','E']],rightAngles=[right('B','H','A')],equalSegments=[eq('B','C'),eq('C','E')]);qp,case,ql=variant(q,qv,'o','Данный угол тупой: высота вне стороны',5);p.update(qp)
cases445=[case];labels445=dict(ql)
for suffix,length,label in [('r',8,'Данный угол прямой: H совпадает с A'),('z',3,'Периметр равен 2AB: треугольник вырожден'),('n',2,'Периметр меньше 2AB: решений нет')]:
    q={'A':(0,0),'B':(0,3),'E':(length,0)}
    if suffix=='r':
        q['C']=((length*length-9)/(2*length),0)
        vv=scene('ABCE',tri()+[['C','E']],rightAngles=[right('B','A','C')],equalSegments=[eq('B','C'),eq('C','E')],note='Основание H совпадает с A.')
    else:
        vv=scene('ABE',[['A','B'],['A','E'],['B','E']],rightAngles=[right('B','A','E')],note='Единственная точка, равноудалённая от B и E на прямой AE, совпадает с A.' if suffix=='z' else 'Неравенство AC + BC > AB противоречит заданному периметру.')
    qp,qv,ql=variant(q,vv,suffix,label,5);p.update(qp);cases445.append(qv);labels445.update(ql)

add(445,'Постройте треугольник по данному периметру, одному углу и высоте, проведённой из вершины другого угла.',
    'Пусть задан угол A и высота BH к AC. Сначала они однозначно задают AB = c. Невырожденное решение существует и единственно с точностью до равенства тогда и только тогда, когда периметр p > 2c.',[
    S('Как восстановить сторону по углу и высоте?','Пусть задан угол A = α, периметр p и высота BH = h к прямой AC. Построим угол A. В его внутренней полуплоскости проведём параллельную лучу AC прямую на расстоянии h. Её пересечение с лучом AB определяет B, а перпендикуляр к AC — H. Так найдена длина c = AB. При тупом α точка H лежит за A; при α = 90° совпадает с A.','Параллельные прямые на заданном расстоянии и построение перпендикуляра.',[23,28,37]),
    S('Как превратить периметр в сумму двух сторон?','Нужно AC + BC = p − c. Обозначим эту заданную разность через s. Для невырожденного треугольника необходимо s > c, то есть p > 2c. Если p ≤ 2c, решения нет.','Периметр и неравенство треугольника.',[14,34]),
    S('Как найти C при p > 2c?','Отложим на луче AC точку E так, чтобы AE = s. Построим серединный перпендикуляр к BE. Его пересечение с AE обозначим C. Точка C лежит внутри AE: A ближе к B, чем к E, поскольку AB = c < s = AE, а E ближе к E, чем к B. Поэтому концы AE находятся по разные стороны серединного перпендикуляра.','Геометрическое место точек, равноудалённых от B и E; свойства полуплоскостей.',[23,40]),
    S('Как проверить все три данных элемента?','По построению BC = CE, поэтому AB + BC + CA = c + CE + CA = c + AE = c + s = p. Угол A остался заданным, а расстояние B до AC равно h. Получен искомый треугольник.','Серединный перпендикуляр и сложение отрезков.',[7,14,40]),
    S('Почему другого неравного треугольника нет?','Данные угол и высота фиксируют B после совмещения луча AC. Периметр фиксирует E. Любая искомая C должна удовлетворять BC = CE и лежать между A и E, значит обязана совпасть с единственной точкой пересечения AE и серединного перпендикуляра к BE. Данные предполагают 0° < α < 180°, h > 0.','Единственность пересечения двух различных прямых; необходимые условия невырожденности.',[1,14,40])],p,b,[v1,v2,v3,v4,v4],cases=cases445,labels=labels445,
    checks=[perp('B','H','A','E'),col('A','H','C','E'),equal(('B','C'),('C','E')),equal(('B','N'),('N','E')),perp('B','E','N','_bis'),equal(('B','H'),('U','V')),col('Ao','Co','Eo'),perp('Bo','Ho','Ao','Eo'),equal(('Bo','Co'),('Co','Eo'))],
    givens=['Даны периметр p, угол α и высота h из другой вершины.','PQ задаёт периметр p; UV задаёт высоту h.'],notes=['Нулевые/развёрнутые углы и неположительная высота не задают невырожденный треугольник. Для α = 90° основание высоты совпадает с A.'])


def main():
    assert sorted(EX) == list(range(430,446))
    assert len(MODELS) == 16
    from check_models import validate
    errors=[f'{m["number"]}: {issue}' for m in MODELS for issue in validate(m['model'])]
    if errors: raise SystemExit('\n'.join(errors))
    prep=dict(bookId='atanasyan-2023-7-9', edition='Атанасян и др. Геометрия 7–9. 14-е изд., 2023',
              chapter='7-advanced',title='Задачи повышенной трудности за 7 класс',status='draft-content-preparation',
              source=dict(fileName='1701411644_geometrija_-uchebnik_-7-9-kl_-atanasjan_compressed.pdf',sha256='3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72',printedPageRange=[117,119],pdfPageRange=[118,120],pageOffset=1),
              review=dict(independentSource='pending',independentMathematics='pending',interactiveModels='implemented-awaiting-independent-review',claude='not-performed-owner-task-waiver'),
              coverage=dict(numberedExercises=16,parts=16,firstExercise=430,lastExercise=445,missingNumberedExercises=[],unresolvedInterpretationExercises=[]),
              authorSourceCheck=dict(printedPages=[117,118,119],pdfPages=[118,119,120],method='Визуальное чтение точных страниц; самостоятельные доказательства и проверка координат. Не независимая рецензия.',reviewedAt='2026-10-28',independent=False),exercises=list(EX.values()))
    (OUT/'preparation/grade-07-advanced-b.json').write_text(json.dumps(prep,ensure_ascii=False,indent=2)+'\n')
    (OUT/'models/grade-07-advanced-b.json').write_text(json.dumps(dict(schemaVersion=1,chapter='7-advanced',models=MODELS),ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(dict(exercises=len(EX),parts=len(MODELS),steps=sum(len(e['parts'][0]['steps']) for e in EX.values()),views=sum(len(m['model']['views']) for m in MODELS),claims=sum(len(m['model']['checks']) for m in MODELS))))


if __name__ == '__main__': main()
