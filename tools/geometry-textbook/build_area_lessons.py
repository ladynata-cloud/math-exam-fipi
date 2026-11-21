"""Build the separately loaded, numbered area lessons for the 2023 edition."""
import argparse
from fractions import Fraction as F
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
DRAFT = ROOT / 'content-drafts/atanasyan-grade8-area-842-844'
sys.path.insert(0, str(DRAFT))
from build_cards import cards as first_three, drawing, edges, model, step
from verify_areas import intersection, segment_point

BOOK = 'atanasyan-2023-7-9'
OUT = ROOT / 'geometry-course/textbook/data/area-lessons.json'
GEOMETRY = dict(source='passed', mathematics='passed', pedagogy='passed',
                reviewer='Codex, сверка печатных с. 215–216 и проверка геометрических зависимостей',
                at='2026-11-21T11:00:00Z')


def mid(a, b):
    return segment_point(a, b, F(1, 2))


def card(number, condition, answer, steps, frames, hint, markers=None):
    scene = model(frames)
    for i, angle in (markers or {}).items():
        key = f'step-{i}' if i else 'neutral'
        scene['views'][key]['rightAngles'] = [dict(
            vertex=f'{angle[0]}__v{i}', a=f'{angle[1]}__v{i}', b=f'{angle[2]}__v{i}', size=2)]
    return dict(number=number, condition=condition, answer=answer, steps=steps, model=scene,
                printedPages=[216], pdfPages=[217], notes=['Подсказка. ' + hint])


def next_three():
    a, b, c, d = (0, 0), (8, 0), (10, 5), (2, 5)
    p, q, r, t = (mid(u, v) for u, v in [(a,b),(b,c),(c,d),(d,a)])
    u = intersection(a,q,d,p)
    v = intersection(a,q,b,r)
    w = intersection(c,t,b,r)
    z = intersection(c,t,d,p)
    marks = dict(A=a,B=b,C=c,D=d,P=p,Q=q,R=r,T=t,U=u,V=v,W=w,Z=z)
    givens = {k:v for k,v in marks.items() if k not in 'UVWZ'}
    lines = edges('ABCD') + [['A','Q'],['B','R'],['C','T'],['D','P']]
    first = card(845,
        'В параллелограмме ABCD обозначь середины сторон AB, BC, CD и DA буквами P, Q, R и T. '
        'Четыре прямые AQ, BR, CT и DP ограничивают центральную фигуру. Докажи, что это параллелограмм, и найди его долю площади.',
        'Площадь внутреннего параллелограмма равна одной пятой площади ABCD.',
        [step('Почему противоположные стороны внутренней фигуры параллельны?',
              'Поворот на 180° вокруг центра ABCD меняет местами A и C, Q и T. Поэтому AQ ∥ CT. Тем же поворотом BR переходит в DP.',
              'Прямая, которая не проходит через центр поворота на 180°, переходит в параллельную прямую.'),
         step('Как задать положение каждой точки двумя долями сторон?',
              'Пиши (x, y), когда из A прошли x долей AB и y долей AD. Тогда A=(0,0), B=(1,0), C=(1,1), D=(0,1). '
              'На AQ имеем y=x/2, а на DP — y=1−2x. Пересечение U имеет доли (2/5,1/5). На BR имеем y=2−2x, поэтому V=(4/5,2/5).',
              'Доля пути между концами отрезка одинакова по обоим направлениям.'),
         step('Как найти площадь, пользуясь отсекаемыми углами?',
              'Возьми UV за основание внутреннего параллелограмма. '
              'Центральный параллелограмм лежит между AQ и CT. Параллелограмм AQCT занимает '
              'половину площади ABCD (основание AT — половина AD, высота от C та же). Основание UV лежит на AQ, противоположная сторона WZ на CT: высоты одинаковы. '
              'По долям вдоль AQ получаем UV/AQ=4/5−2/5=2/5. Искомая доля равна (1/2)·(2/5)=1/5.',
              'Площади параллелограммов между двумя параллельными прямыми относятся как основания.',57)],
        [drawing(givens,lines),drawing(marks,lines,('UVWZ',)),drawing(marks,lines,('AUP',)),drawing(marks,lines,('AQCT','UVWZ'))],
        'Найди, какие пары прямых меняются местами при повороте всей фигуры вокруг её центра.')
    a, b, c, d = (0,0),(0,6),(4,F(34,5)),(10,2)
    m = mid(c,d); h = (0,m[1])
    base = dict(A=a,B=b,C=c,D=d,M=m,H=h)
    lines = edges('ABCD') + [['M','H']]
    second = card(846,
        'Основания трапеции ABCD — AD и BC. M — середина CD, H — основание перпендикуляра из M на прямую AB. '
        'Объясни, почему площадь трапеции равна AB · MH.',
        'S = AB · MH. Расстояние от середины CD до AB равно полусумме расстояний от C и D до AB.',
        [step('Какие два треугольника можно взять для подсчёта площади трапеции?',
              'Возьми ABC и ABD. Для ABC основание BC, для ABD основание AD. Высота к этим основаниям одна и та же — расстояние между параллельными прямыми BC и AD. Сумма площадей равна площади трапеции.',
              'S трапеции — полусумма оснований, умноженная на высоту.',58,59),
         step('Что изменится, если взять у обоих треугольников основание AB?',
              'Обозначь расстояния от C и D до прямой AB через c и d. Тогда сумма площадей ABC и ABD равна AB · (c+d)/2.',
              'Площадь треугольника равна половине произведения основания и высоты.',58),
         step('Почему (c+d)/2 — это именно MH?',
              'Опусти на AB перпендикуляры из C и D. Их длины c и d измерены в одном направлении, потому что C и D по одну сторону AB. '
              'Проекция середины отрезка есть середина проекций, поэтому расстояние от M равно (c+d)/2. При c=d расстояние постоянно вдоль CD. Подставь MH в выражение площади.',
              'Параллельное проектирование сохраняет середину отрезка.')],
        [drawing(base,lines),drawing(base,lines+[ ['A','C'],['B','D'] ],('ABC','ABD')),
         drawing(base,lines+[ ['A','C'],['B','D'] ],('ABD',)),drawing(base,lines)],
        'Попробуй выразить сумму площадей ABC и ABD двумя способами.',{0:'HMA',1:'HMA',2:'HMA',3:'HMA'})
    a, b, c, d = (0,0),(2,4),(6,4),(9,0)
    o = intersection(a,c,b,d); pts = dict(A=a,B=b,C=c,D=d,O=o)
    lines = edges('ABCD') + [['A','C'],['B','D']]
    third = card(847,
        'Диагонали трапеции ABCD с основаниями BC и AD встретились в O. Площади треугольников BOC и AOD равны S₁ и S₂. Вырази площадь всей трапеции.',
        'S = S₁ + 2√(S₁S₂) + S₂ = (√S₁ + √S₂)².',
        [step('Какие треугольники подобны?',
              'Треугольники BOC и DOA подобны: углы при O вертикальные, а углы при основаниях попарно равны из-за параллельности оснований. '
              'Если k=AD/BC, то k=AO/OC=DO/OB=√(S₂/S₁).',
              'Площади подобных треугольников относятся как квадраты соответствующих сторон.',66),
         step('Какова площадь каждого бокового треугольника?',
              'У AOB и BOC основания AO и OC лежат на одной прямой, вершина B общая. Поэтому [AOB]=kS₁=√(S₁S₂). '
              'Для COD и COB возьми основания DO и OB на второй диагонали и общую вершину C — получится та же площадь.',
              'При общей высоте отношение площадей равно отношению оснований.',58),
         step('Какие четыре площади нужно сложить?',
              'Вся трапеция разбита на четыре треугольника. Сложи S₁, S₂ и две одинаковые площади √(S₁S₂). Получится квадрат суммы корней.',
              'Диагонали внутри выпуклого четырёхугольника делят его на части без перекрытия.')],
        [drawing(pts,lines,('BOC','AOD')),drawing(pts,lines,('BOC','AOD')),
         drawing(pts,lines,('AOB','COD')),drawing(pts,lines,('ABCD',))],
        'Начни с отношения площадей двух данных треугольников и найди соответствующее отношение длин.')
    return [first,second,third]


# Each question uses a fresh numeric instance. The child's answer is saved by the
# normal textbook step-input engine and the general proof remains a written task.
CHECKS = {
    863: (2,'Если AB=10, AE=BF=2 и MC=15, чему равна длина MK?', ['9'], 'Отрезок ME равен 5−2. Доля MK от MC равна ME/MA.'),
    864: (3,'Если сумма катетов равна 10, чему равен квадрат CO?', ['50'], 'Подставь 10 в CO²=a²/2.'),
    865: (1,'Из скольких седьмых окружности состоит меньшая дуга WA?', ['3'], 'На этой дуге между W и A ещё две вершины семиугольника.'),
    866: (1,'При угле AOB в 60° и OP=4 найди OR.', ['2'], 'Проекция даёт OR=OP·cos 60°, а cos 60°=1/2.'),
    867: (2,'Пусть a=3, b=4, x=1,92. Чему равна координата y точки H?', ['1,44','1.44'], 'Из ax=by получаем y=ax/b.'),
    (868,'а'): (1,'Если катеты равны 6 и 8, какова длина высоты CD к гипотенузе?', ['4,8','4.8'], 'Сначала найди гипотенузу по теореме Пифагора, затем раздели произведение катетов на неё.'),
    (868,'б'): (3,'При AB=10 сколько составляет AE²+BF²+3CD²?', ['100'], 'Доказанное равенство превращает сумму в квадрат гипотенузы.'),
    (868,'в'): (3,'Если AB=8, чему равна сумма ∛(AE²)+∛(BF²)?', ['4'], 'Вычисли кубический корень из 64.'),
    (869,'а'): (3,'У трёх вершин углы равны 75°, 60° и 90°. Сколько градусов у четвёртой?', ['135'], 'Выпуклый четырёхугольник имеет сумму углов 360°.'),
    (869,'б'): (1,'Сколько градусов в угле BAP, соответствующем углу BDA?', ['30'], 'Вычти угол DAP из угла DAB.'),
    870: (2,'Если сторона AB равна 7, чему равно MP?', ['14'], 'AB соединяет середины двух сторон MNP.'),
    871: (3,'Если AB=12 и CD=8, какой числовой верхней границе строго уступает MN?', ['10'], 'Найди полусумму длин противоположных сторон.'),
    854: (3,'В другом параллелограмме S₁=9, S₂=16. Найди его площадь.', ['24'], 'Найди корень из произведения двух площадей и удвой.'),
    855: (2,'При OM/OK=3/4 и OC=12 найди OE.', ['9'], 'Длина OE занимает такую же долю OC, как OM от OK.'),
    856: (3,'При α=74° чему равен угол BKM в градусах?', ['37'], 'У равнобедренного ADC два одинаковых угла при основании.'),
    857: (3,'Если MB=6, MC=7, MD=8, сколько составляет квадрат MA?', ['51'], 'Найди сумму 6² и 8² и вычти 7².'),
    858: (3,'Если AD=3, DC=6, BD=4, найди квадрат MB.', ['61'], 'Сложи квадраты трёх данных длин.'),
    859: (3,'При AC=9 и BC=12 найди OA²+OB².', ['125'], 'Сначала вычисли OC²=(9²+12²)/9.'),
    (860,'а'): (3,'Сколько градусов в угле AFE?', ['108'], 'Два других угла этого треугольника равны 36° каждый.'),
    (860,'б'): (3,'Если DF/AF близко к 1,62, а DF=8, вычисли приближённую длину DA.', ['12,96','12.96'], 'Умножь DF на доказанное отношение DA/DF.'),
    861: (3,'AB=8, AC=4, D лежит на AB, E — на продолжении CA за A. Из AD=AE и BD=CE найди CE.', ['6'], 'Обозначь AD=AE через x. Тогда 8−x=4+x. Найди x, затем CE.'),
    862: (3,'Если угол A равен 58°, сколько градусов в угле ADE?', ['32'], 'Угол ADE дополняет A до прямого угла.'),
    842: (2,'При площади большого параллелограмма 50 и x=y=1/5 какова площадь MPBQ?', ['8'], 'Возьми долю (1−x)y от всей площади.'),
    843: (1,'Проверь на новых данных: S₁=4, S₂=8, S₃=6. Какова площадь OMK?', ['3'], 'Сначала найди OM/OB, затем умножь эту долю на S₃.'),
    844: (4,'Проверь формулу при S₁=1 и S₂=27. Какова площадь всего треугольника?', ['64'], 'Извлеки корни, сложи их и только потом возведи в куб.'),
    845: (3,'Если площадь ABCD равна 45, какова площадь UVWZ?', ['9'], 'Сначала возьми половину площади, затем две пятых от полученного числа.'),
    846: (3,'AB=5 см. До прямой AB от C — 4 см, от D — 12 см. Какова площадь трапеции в см²?', ['40'], 'Найди среднее двух расстояний, затем умножь на AB.'),
    848: (3,'В другом чертеже три крайние площади равны 4, 9 и 6. Чему равна площадь пятиугольника?', ['19'], 'Сложи площади двух боковых треугольников и треугольника у меньшего основания.'),
    849: (3,'MK=8, а расстояния A и B до MK равны 3 и 2. Найди площадь DCM.', ['20'], 'Используй одну и ту же основу MK для двух слагаемых.'),
    850: (3,'Площадь ABCD равна 60. EO/ED=2/3, KO/KB=2/3. Найди площадь CEOK.', ['40'], 'Вычисли две трети от половины площади параллелограмма и возьми этот результат дважды.'),
    851: (3,'Вся площадь равна 57 см². Какова площадь средней полосы в см²?', ['19'], 'Средняя полоса занимает треть площади.'),
    852: (3,'Средняя фигура имеет площадь 23, треугольник ADU — 8. Найди площадь BCV.', ['15'], 'Из площади центральной фигуры вычти площадь ADU.'),
    853: (3,'Когда a=b=3, какова длина OA?', ['6'], 'При равных расстояниях A лежит на биссектрисе. На рисунке с углом 30° катет равен половине гипотенузы.'),
    847: (3,'Новый пример: S₁=4, S₂=25. Найди площадь трапеции.', ['49'], 'Учитывай оба боковых треугольника.'),
}


def lesson(card):
    n=card['number']
    origin=dict(bookId=BOOK, collection='main', chapter='8 класс · повышенная трудность', advancedGrade=8,
                relatedChapters=[card.get('relatedChapter',7)],exercise=str(n),printedPages=card['printedPages'],pdfPages=card['pdfPages'])
    part=card.get('sourcePart')
    if part: origin['subpart']=part
    steps=[]; refs=[]
    for i, item in enumerate(card['steps'], 1):
        reason=dict(kind='reason', text=item['justification'])
        for point in item['theoryPoints']:
            ref=f'atanasyan-7-9-theory-{point}-part-1'
            if ref not in refs: refs.append(ref)
            if 'theoryId' not in reason: reason['theoryId']=ref
        s=dict(id=f'step-{i}',title=f'Шаг {i}',prompt=item['prompt'],explanation=item['explanation'],
               view=f'step-{i}',justifications=[reason])
        idx, question, accepted, feedback=card['practice'] if 'practice' in card else CHECKS[(n,part) if part else n]
        if i==idx: s['input']=dict(prompt=question,accepted=accepted,feedback=feedback)
        steps.append(s)
    hint=card['notes'][0].removeprefix('Подсказка. ')
    help_items=[dict(id='first-hint',question='С чего начать?',text=hint)]
    if refs: help_items.append(dict(id='recall-theory',question='Вспомнить свойство',text='Открой объяснение рядом с задачей.',theoryIds=refs))
    help_items.append(dict(id='compare-result',question='Сверить свой итог',text=card['answer']))
    review=GEOMETRY
    if n>=854:
        printed_page=card['printedPages'][0]
        review={**GEOMETRY,'reviewer':f'Codex, сверка печатной с. {printed_page} и проверка геометрических зависимостей'}
    part_number={'а':1,'б':2,'в':3}[part] if part else 1
    return dict(schemaVersion=1,id=f'atanasyan-7-9-main-{n}-part-{part_number}',revision=1,kind='exercise',
                title=f'Задача {n}',status='reviewed',source=origin,review=review,
                statement=dict(text=card['condition'],goal='Сначала предложи своё решение. Подсказки и разбор можно открыть рядом.'),
                visualization=dict(type='scene3d',caption='Меняй шаг разбора, чтобы увидеть соответствующее построение.',model=card['model']),
                help=help_items,steps=steps,answer=dict(mode='manual',prompt='Запиши своё обоснование.'))


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--check',action='store_true')
    opts=parser.parse_args()
    from area_lesson_continuation import continuation
    all_cards = first_three() + next_three() + continuation(card, step, drawing, edges, mid, intersection, F)
    lessons=[lesson(c) for c in all_cards]
    output=json.dumps({'bookId':BOOK,'lessons':lessons},ensure_ascii=False,separators=(',',':'))+'\n'
    if opts.check:
        assert OUT.read_text()==output
    else:
        OUT.write_text(output)
