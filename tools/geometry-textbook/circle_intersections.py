"""Classify points and solve horizontal/vertical circle sections, source 1047–1050."""
import argparse
import json
from itertools import permutations, product
from math import isqrt
from coordinate_actions import show
from coordinate_curves import curve_lesson, graph, set_answers
from vector_scaling import BOOK, ROOT

OUT = ROOT / 'geometry-course/textbook/data/circle-intersections.json'


def squared(point, center):
    return sum((x - a) ** 2 for x, a in zip(point, center, strict=True))


def marked_circle(label, center, radius, points, edges=(), line=None):
    return graph(label, {'S': center, **points}, circle=('S', radius), edges=edges, lines=[line] if line else [])


def entries_1047():
    center = (-5, 1)
    points = dict(A=(-2, 4), B=(-5, -3), C=(-7, -2), D=(1, 5))
    categories = [('а','внутри круга','C','меньше','<','M','2'), ('б','на окружности','B','равен','=','N','9'), ('в','вне круга','AD','больше','>','P','10')]
    examples = dict(M=(2, 0), N=(1, 2), P=(4, 0))
    values = '; '.join(f'{k}: {squared(p,center)}' for k,p in points.items())
    rows = []
    for part, where, names, comparison, symbol, probe, q in categories:
        initial = marked_circle('Центр и четыре исходные точки', center, 4, points)
        sample = marked_circle('Сравни расстояния SA и SB', center, 4, {k:points[k] for k in 'AB'}, [('S','A'),('S','B')])
        relevant = marked_circle('Проверь найденные точки', center, 4, {k:points[k] for k in names}, [('S',k) for k in names])
        variant = marked_circle('Новый центр и три положения', (1,-1), 3, examples, [('S',probe)])
        m = f'Новая окружность имеет центр (1;−1), r=3. У M=(2;0), N=(1;2), P=(4;0) квадраты расстояний от центра равны 2, 9 и 10. Поэтому {probe} находится {where}.'
        card = curve_lesson(1047, part=part, pages=[264], question=f'По уравнению (x+5)²+(y−1)²=16 и координатам A=(−2;4), B=(−5;−3), C=(−7;−2), D=(1;5) выбери все точки {where}. Сначала обоснуй ответ вычислением. Чертёж поможет проверить результат.',
            answer=f'Подходят {", ".join(names)}. Квадрат расстояния до центра S=(−5;1) должен быть {comparison} 16. Для исходных точек получаем {values}.', hint='Сначала найди центр, затем сравни квадрат расстояния до него с 16. Отдельно различай круг и его границу.',
            steps=[('Определи меру расстояния','В скобках обращают обе разности в ноль x=−5 и y=1. Радиус равен 4, а для сравнений удобнее его квадрат 16.','В сравнении не нужны квадратные корни, если обе величины неотрицательны.'),
                   ('Сравни каждую точку',f'От S до A смещение (3;3), до B — (0;−4), до C — (−2;−3), до D — (6;4). Квадраты расстояний: {values}. Оставь те, для которых d²{symbol}16.','Равенство означает границу, строгое неравенство выбирает одну из сторон.'),
                   ('Перенеси способ на новый круг',m,'Меняя центр, вычисляй разности координат заново, затем сравни их квадраты с новым квадратом радиуса.')],
            frames=[initial,sample,relevant,variant], cases=[sample,relevant,variant],
            prompts=[('Вычисли квадрат расстояния от S до C в исходной задаче.','13','Смещение от центра до C равно (−2;−3), поэтому нужны 4+9.'),
                     (f'Найди квадрат расстояния от нового центра (1;−1) до {probe}={show(examples[probe])}.',q,'Вычти координаты нового центра. Складывай квадраты полученных разностей.')]);
        card['answer']=dict(mode='exact',accepted=set_answers(names),prompt='Введи все подходящие буквы через запятую, в любом порядке.',feedback=f'Для положения «{where}» проверь условие d²{symbol}16 у всех четырёх точек, включая граничную B.')
        rows.append(card)
    return rows


def entry_1048():
    source = dict(A=(3,4), B=(4,-3)); new=dict(M=(5,3),N=(-2,2),K=(5,2))
    first=marked_circle('Два исходных конца отрезка',(0,0),5,source)
    radii=marked_circle('Проверь оба радиуса',(0,0),5,source,[('S','A'),('S','B')])
    chord=marked_circle('Хорда между точками окружности',(0,0),5,source,[('A','B')])
    transfer=marked_circle('Новый центр: один конец внутри',(2,-1),5,new,[('M','N'),('M','K')]);
    card=curve_lesson(1048,pages=[264],question='У окружности x²+y²=25 рассмотрены A=(3;4) и B=(4;−3). Докажи, что отрезок AB является её хордой. Укажи, какие два факта о концах нужны.',
        answer='A и B различны, и обе лежат на окружности: 3²+4²=25 и 4²+(−3)²=25. По определению весь отрезок с двумя концами на окружности является хордой.', hint='У хорды оба конца принадлежат окружности. Глазомер и положение середины не доказывают этого условия.',
        steps=[('Испытай точку A','Подставь координаты A в левую часть. 3²+4²=9+16=25. Первый конец действительно на окружности.','Уравнение окружности позволяет проверить одну точку без чертежа.'),
               ('Испытай B и примени определение','Для B получается 4²+(−3)²=16+9=25. Координаты A и B различны. Соединив точки окружности отрезком, получаем хорду AB.','Чтобы доказать утверждение о хорде, нужно проверить оба конца.'),
               ('Найди хорду на новом рисунке','Новый центр S=(2;−1), радиус 5. Для M=(5;3) и N=(−2;2) значения SM² и SN² равны 25. Для K=(5;2) получаем 18. Поэтому MN — хорда, а у MK только один конец лежит на окружности.','Если хотя бы одна из двух точек внутри круга, весь данный отрезок нельзя назвать хордой этой окружности.')],
        frames=[first,radii,chord,transfer],cases=[radii,chord,transfer],prompts=[('Каков квадрат расстояния от начала координат до B?','25','У отрицательной ординаты квадрат всё равно положительный.'),('На новом рисунке вычисли SK² для K=(5;2), S=(2;−1).','18','По каждой координате разность равна 3; нужны два квадрата.')]);
    card['answer']['prompt']='Объясни принадлежность каждого из двух концов окружности и назови определение, завершающее доказательство.'
    return card


def section_points(center,r,axis,fixed):
    j=0 if axis=='x' else 1; k=1-j; rest=r*r-(fixed-center[j])**2
    if rest<0:return rest,[]
    delta=isqrt(rest);assert delta*delta==rest
    values=sorted({center[k]-delta,center[k]+delta})
    return rest,[(fixed,t) if j==0 else (t,fixed) for t in values]


def section_model(label,center,r,axis,fixed,found,show_points):
    x,y=center
    segment=((fixed,y-r-1),(fixed,y+r+1)) if axis=='x' else ((x-r-1,fixed),(x+r+1,fixed))
    points={k:p for k,p in zip('MN',found)} if show_points else {}
    return marked_circle(label,center,r,points,line=segment)


def accept_pair_set(points):
    accepted=[]
    for (a,b),(c,d) in permutations(points):
        for separator,brackets,inner in product(('; ', ';', ', ', ',', ' и ', ' '), (True,False), (';', '; ')):
            first=f'{a}{inner}{b}';second=f'{c}{inner}{d}'
            if brackets:first=f'({first})';second=f'({second})'
            accepted.append(first+separator+second)
    return accepted


def sections():
    data=[(1049,'а',(0,0),5,'x',-4,(1,-2),5,4,'большее значение y','2'),(1049,'б',(0,0),5,'y',3,(1,-2),5,3,'сколько различных точек получается','1'),
          (1050,'а',(3,5),5,'x',3,(-2,1),3,2,'сколько точек пересечения получается','0'),(1050,'б',(3,5),5,'y',5,(-2,1),5,4,'меньшее значение x','-6')]
    rows=[]
    for n,part,center,r,axis,fixed,other,rr,otherfixed,task,value in data:
        j=0 if axis=='x' else 1;missing='y' if j==0 else 'x'; coord='ординаты' if j==0 else 'абсциссы'; direction='вертикальную' if j==0 else 'горизонтальную'; k=1-j
        rest,pts=section_points(center,r,axis,fixed);varrest,varpts=section_points(other,rr,axis,otherfixed)
        eq='x²+y²=25' if n==1049 else '(x−3)²+(y−5)²=25';both=' и '.join(map(show,pts)); delta=isqrt(rest)
        first=marked_circle('Прочти центр и радиус',center,r,{})
        line=section_model(f'Прямая {axis}={fixed}',center,r,axis,fixed,pts,False)
        points=section_model('Обе найденные точки',center,r,axis,fixed,pts,True)
        variant=section_model('Новые центр и прямая',other,rr,axis,otherfixed,varpts,True)
        reduced=f'При {axis}={fixed} квадрат известной разности равен ({fixed}−({center[j]}))²={(fixed-center[j])**2}. После вычитания из {r*r} остаётся {rest} — это квадрат отклонения неизвестной координаты от {center[k]}.'
        reasons=(f'Новый остаток {varrest} положителен. Отклонение неизвестной координаты имеет два знака; получаются '+ ' и '.join(map(show,varpts))+'.' if varrest>0 else f'Новый остаток равен нулю. Обе записи ±0 дают одну и ту же точку {show(varpts[0])}: прямая касается окружности.' if varrest==0 else f'Новый остаток {varrest} отрицателен. Квадрат действительного числа отрицательным быть не может: у этой прямой нет общих точек с окружностью.')
        card=curve_lesson(n,part=part,pages=[264],question=f'На окружности {eq} найди все точки с координатой {axis}={fixed}. Запиши обе координаты каждой точки и поясни, как понимаешь число решений.',
            answer=f'{both}. {reduced} Значит, {missing} принимает значения {center[k]}−{delta} и {center[k]}+{delta}, а {axis}={fixed} остаётся тем же.',hint=f'Проведи {direction} прямую {axis}={fixed}. Подставь известное значение в уравнение, затем проверь оба возможных знака квадратного корня.',
            steps=[('Подставь известную координату',reduced,'Координата, заданная в условии, одинакова у всех искомых точек.'),
                   ('Найди и проверь оба корня',f'Длина отклонения от {center[k]} равна {delta}. Для {coord} получаем {pts[0][k]} и {pts[1][k]}. Полные точки {both} лежат на рисунке на одной прямой. При подстановке сумма квадратов равна {r*r} для каждой.','Квадрат определяет модуль разности. При положительном остатке два знака дают две различные точки.'),
                   ('Измени центр или сечение',f'Для нового центра S={show(other)}, r={rr}, {axis}={otherfixed} после подстановки остаётся {rr*rr}−{(otherfixed-other[j])**2}={varrest}. '+reasons,'Положительный, нулевой и отрицательный остаток соответствуют двум, одной и нулю точек пересечения.')],
            frames=[first,line,points,variant],cases=[line,points,variant],prompts=[(f'Какой квадрат отклонения неизвестной координаты получен после подстановки {axis}={fixed}?',str(rest),reduced),
                (f'Новый пример: центр {show(other)}, r={rr}, {axis}={otherfixed}. Найди ответ: {task}.',value,reasons)]);
        card['answer']=dict(mode='exact',accepted=accept_pair_set(pts),prompt='Запиши две точки в формате (x;y), (x;y). Порядок точек свободный.',feedback=f'Сохрани {axis}={fixed} в каждой паре. Квадрат отклонения {missing} равен {rest}, поэтому здесь нужны оба знака.');rows.append(card)
    return rows


def build():
    cards=entries_1047()+[entry_1048()]+sections()
    for card in cards:
        card['review']['reviewer']='Учебник Атанасяна 7–9, 2023: печатная с. 264, ключ с. 398. Проверены сравнения квадратов расстояния, оба конца хорды и каждое пересечение прямых с окружностями.'
    return {'bookId':BOOK,'lessons':cards}


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');opts=parser.parse_args()
    text=json.dumps(build(),ensure_ascii=False,separators=(',',':'))+'\n'
    if opts.check:assert OUT.read_text()==text
    else:OUT.write_text(text)
