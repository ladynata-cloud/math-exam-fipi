"""Chapter XIII construction tasks 1236–1239 on page 312, including both given-circle constructions."""
import argparse
import json
from math import cos, hypot, pi, sin
from coordinate_curves import graph
from polygon_circle_applications import outline, ring
from triangle_sine_area import area
from vector_scaling import BOOK, ROOT

OUT=ROOT/'geometry-course/textbook/data/regular-compass-finale.json'


def octagon(label,a,mode):
    radius=a/(2*sin(pi/8));coords=ring(8,radius,-pi/8)
    names='ABCDEFGH' if mode=='complete' else 'ABC' if mode=='circle' else 'AB'
    p=dict(zip(names,coords[:len(names)],strict=True));p.update(T=(0,0),M=(radius*cos(pi/8),0))
    p.update(U=(-radius,-radius-.6),W=(1-radius,-radius-.6))
    edges=[('A','B'),('A','T'),('B','T'),('T','M'),('A','M'),('B','M'),('U','W')]
    if mode=='circle':edges.extend([('B','C'),('C','T')])
    if mode=='complete':edges+=outline(names)+[('T','C')]
    return graph(label,p,edges=edges,circle=None if mode=='center' else ('T',radius))


def sum_disks(label,a,b,mode):
    if mode=='given':
        c1=(-a-.5,0);c2=(b+.5,0)
        p={'I':c1,'J':c2,'F':(-.5,0),'G':(.5,0),
           'U':(-2*a,-max(a,b)-.7),'W':(1-2*a,-max(a,b)-.7)}
        # Extents of both independently drawn circles are included when fitting.
        p.update(_outer=(2*b+.5,0),_high=(c2[0],b),_low=(c2[0],-b))
        return graph(label,p,edges=[('I','F'),('J','G'),('J','_high'),('J','_low'),('J','_outer'),('U','W')],circle=('I',a))
    c=hypot(a,b)
    p={'A':(0,0),'B':(a,0),'C':(0,b),'U':(-c,-c-.6),'W':(1-c,-c-.6)}
    return graph(label,p,edges=outline('ABC')+[('U','W')],circle=('B',c) if mode=='result' else None)


def tangent_polygon(label,n,r,mode):
    contact=['A','B',*['_touch'+str(i) for i in range(2,n)]]
    outer=['P','Q',*['_vertex'+str(i) for i in range(2,n)]]
    pins=ring(n,r,0);vertices=ring(n,r/cos(pi/n),-pi/n)
    p=dict(zip(contact,pins,strict=True));p.update(T=(0,0),U=(-r*1.6,-r*1.8-.6),W=(1-r*1.6,-r*1.8-.6))
    edges=[('T','A'),('T','B'),('U','W')]
    if mode=='marks':
        edges+=outline(contact)
    elif mode=='tangents':
        for i in range(3): p[outer[i]]=vertices[i]
        edges +=[(outer[0],'A'),('A',outer[1]),(outer[1],'B'),('B',outer[2])]
    else:
        p.update(dict(zip(outer,vertices,strict=True)))
        for i in range(n):edges.extend([(outer[i],contact[i]),(contact[i],outer[(i+1)%n])])
    return graph(label,p,edges=edges,circle=('T',r))


def card(n,part,task,proof,hint,steps,views,checks,note):
    item=area(n,part,[312],task,proof,hint,steps,views,checks,refs=[114,115,117,120])
    item['source']['chapter']='XIII';item['help'][1]['text']=hint
    item['visualization']['model']['description']=item['visualization']['caption']=note
    item['answer']['prompt']='Опиши построение циркулем и линейкой и докажи, что полученная фигура отвечает условию.'
    item['review']['reviewer']='Атанасян и соавт., 2023, с. 312. Сверены четыре исходных задания на построение, две пары подпунктов, данные отрезка и кругов, указания с. 402 и достижимость каждого построения циркулем и линейкой.'
    return item


def given_side():
    task='Дан отрезок длины a. Построй правильный восьмиугольник, у которого каждая сторона равна этому отрезку. Как найти центр, пока радиус окружности неизвестен?'
    views=[octagon('Два луча находят центр',3,'center'),octagon('Одна новая хорда длины a',3,'circle'),octagon('Все восемь сторон для новой длины 4',4,'complete')]
    c=card(1236,None,task,'У соседних вершин центральный угол 360°/8=45°, поэтому при основании равнобедренного треугольника ATB по (180°−45°)/2=67,5°. Построй в A и B два таких угла по одну сторону от AB. Их лучи пересекутся в T. По окружности радиуса TA отложи последовательно хорду AB. Восемь равных центральных углов дают полный оборот.',
       'Сначала скопируй данную сторону как AB. Угол 67,5° получается как половина угла 135°; 135° — смежный с построенным углом 45°.',[
       ('Построй центр по двум углам','В A и B построй со стороны будущего центра по 67,5°. Для этого можно построить прямой угол, его биссектрисой получить 45°, смежным углом получить 135° и разделить его пополам. Точка T — пересечение двух полученных лучей.','Если отложить 45° при обоих концах AB, центральный угол получится 90°.'),
       ('Отложи равные хорды','Проведи окружность радиусом TA. Открой циркуль на длину AB. Из B отметь следующую точку C на окружности, выбирая её по ходу обхода, а не уже отмеченную A. Повторяй с тем же раствором.','Расстояние между соседними вершинами задаётся прямой хордой.'),
       ('Докажи замыкание','У каждого очередного равнобедренного центрального треугольника тот же радиус и та же хорда. Все углы при T по 45°. Через восемь шагов получается 360°. При новой исходной стороне 4 периметр 32.','Равные хорды одного круга отсекают равные малые дуги.')],views,
       [('Чему равен центральный угол между соседними вершинами?','45','Раздели 360° на 8.'),('Каков периметр для новой исходной стороны 4?','32','Все восемь сторон по 4.')],
       'AB — заданный отрезок, M — середина, T — пересечение построенных лучей. TM перпендикулярна AB. UW — единица длины.')
    for v in c['visualization']['model']['views'].values():
        m=c['visualization']['model'];ids={m['labels'][k]:k for k in v['points']}
        v['rightAngles']=[dict(vertex=ids['M'],a=ids['A'],b=ids['T'],size=1.4)]
    return c


def combined_area():
    vs=[sum_disks('Два заданных радиуса 3 и 4',3,4,'given'),sum_disks('Перенеси радиусы на перпендикуляры',3,4,'triangle'),sum_disks('Круг для новых радиусов 5 и 12',5,12,'result')]
    c=card(1237,None,'Даны два круга. Построй третий круг, площадь которого равна сумме площадей двух данных.',
       'Пусть данные радиусы равны a и b. Построй прямой угол и отложи на его лучах от вершины отрезки AB=a и AC=b. Соедини B и C. По теореме Пифагора BC²=a²+b², поэтому круг радиуса BC имеет площадь πa²+πb². Его центр можно выбрать произвольно.',
       'Складываются площади. Значит, для искомого радиуса c должно выполняться c²=a²+b². Такую длину даёт гипотенуза.',[
       ('Перенеси длины радиусов','Если у исходного круга не отмечен центр, проведи две непараллельные хорды и построй их серединные перпендикуляры. Их пересечение — центр. Циркулем сними оба радиуса, в примере 3 и 4.','Сумма самих радиусов 7 дала бы больший круг площади 49π.'),
       ('Построй прямоугольный треугольник','На взаимно перпендикулярных лучах от A отложи AB=3, AC=4. Гипотенуза BC=5. Проведи круг с радиусом BC. Его площадь 25π=9π+16π.','BC станет радиусом, а не диаметром нового круга.'),
       ('Проверь новую пару','При катетах 5 и 12 гипотенуза равна 13. Проведи круг из B через C. Получишь площадь 169π, точно равную 25π+144π.','Расположение исходных кругов не влияет на построение: из них взяты только радиусы.')],vs,
       [('Чему равен радиус при данных радиусах 3 и 4?','5','Найди корень из 9+16.'),('Какова площадь нового круга как коэффициент при π для радиусов 5 и 12?','169','Сложи квадраты 5 и 12.')],
       'I и J — центры заданных кругов. В построении A — вершина прямого угла, BC — искомый радиус. На последнем рисунке центр результата B. UW — единица длины.')
    m=c['visualization']['model']
    for i,v in enumerate(m['views'].values()):
        ids={m['labels'][k]:k for k in v['points']}
        if 'J' in ids:
            v['circles'].append(dict(center=ids['J'],through=ids['G']))
            v['segments']=[e for e in v['segments'] if not any(k.startswith(('_outer','_high','_low')) for k in e)]
        else:v['rightAngles']=[dict(vertex=ids['A'],a=ids['B'],b=ids['C'],size=1.4)]
    return c


def circumscribed(n,part,sides,construction,new_r):
    angle=360//sides
    names={3:'треугольник',4:'четырёхугольник (квадрат)',6:'шестиугольник',8:'восьмиугольник'}
    note='A и B — соседние точки касания, T — центр. Вершина Q лежит на пересечении соседних касательных. UW — единица длины.'
    vs=[tangent_polygon('Отметь точки касания',sides,3,'marks'),tangent_polygon('Пересечение соседних касательных',sides,3,'tangents'),tangent_polygon('Готовая фигура на новом круге',sides,new_r,'complete')]
    c=card(n,part,f'Около заданной окружности построй правильный {names[sides]}. Укажи, где провести касательные и как получить вершины.',construction+f' В каждой из {sides} точек проведи перпендикуляр к радиусу. Соседние касательные пересекаются в вершинах искомой фигуры. Поворот на {angle}° вокруг T переводит каждую касательную и вершину в следующую, поэтому равны все стороны и углы.',
       'Сначала на окружности нужны равноотстоящие точки касания. Соединяя их хордами, получают вписанную фигуру; вершины описанной лежат на пересечениях касательных.',[
       ('Разметь окружность',construction+f' Центральный угол между соседними радиусами равен {angle}°.','Проверяй равные дуги одним и тем же раствором или биссектрисами.'),
       ('Проведи касательные','В A построй перпендикуляр к TA, в B — к TB. Полученные прямые касаются окружности и пересекаются в Q. Продолжай по кругу; брать произвольные точки касания нельзя.','Радиус и касательная перпендикулярны именно в точке касания.'),
       ('Обоснуй и проверь на новом радиусе',f'Вращение на {angle}° сохраняет окружность и циклически переставляет касательные. Значит, фигура правильная. При новом радиусе {new_r} каждая сторона находится на расстоянии {new_r} от T.','Противоположные касательные могут быть параллельны; пересекай соседние.')],
       vs,[('Каков центральный угол между соседними точками касания в градусах?',str(angle),'Раздели 360° на число сторон.'),
       ('Чему равно расстояние от центра новой окружности до каждой построенной стороны?',str(new_r),'Радиус в точке касания перпендикулярен стороне.')],note)
    m=c['visualization']['model']
    for v in m['views'].values():
        ids={m['labels'][k]:k for k in v['points']}
        if 'Q' in ids:
            v['rightAngles']=[dict(vertex=ids[k],a=ids['T'],b=ids['Q'],size=1.3) for k in ('A','B')]
    return c


def build():
    return {'bookId':BOOK,'lessons':[given_side(),combined_area(),
        circumscribed(1238,'а',3,'Отложи на окружности шесть хорд длиной в радиус, затем возьми через одну три из шести отметок.',4),
        circumscribed(1238,'б',6,'Отложи на окружности шесть хорд длиной в радиус; каждая вместе с двумя радиусами даёт равносторонний треугольник.',5),
        circumscribed(1239,'а',4,'Проведи два взаимно перпендикулярных диаметра. Их четыре конца станут точками касания будущего квадрата.',2),
        circumscribed(1239,'б',8,'Проведи два перпендикулярных диаметра. Раздели каждый из четырёх центральных прямых углов пополам; вместе получатся восемь лучей к точкам касания.',4)]}


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true')
    content=json.dumps(build(),ensure_ascii=False,separators=(',',':'))+'\n'
    if p.parse_args().check:assert OUT.read_text()==content
    else:OUT.write_text(content)
