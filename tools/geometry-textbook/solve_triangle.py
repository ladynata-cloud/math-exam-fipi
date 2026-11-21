"""Exercise 1114, all nine named cases. Rounding is applied only to the three displayed unknowns."""
import argparse
import json
from itertools import product
from math import acos, asin, cos, degrees, radians, sin, sqrt
from triangle_sine_area import ROOT, BOOK, area
from coordinate_curves import graph
from trigonometric_signs import grade

OUT=ROOT/'geometry-course/textbook/data/solve-triangle.json'
ORDER='ABCabc'
SPECS=[
    ('а',{'A':60,'B':40,'c':14},'abC',{'A':60,'B':30,'c':10}),
    ('б',{'A':30,'C':75,'b':4.5},'acB',{'A':45,'C':60,'b':6}),
    ('в',{'A':80,'a':16,'b':10},'BCc',{'A':90,'a':10,'b':6}),
    ('г',{'B':45,'C':70,'a':24.6},'bcA',{'B':30,'C':60,'a':12}),
    ('д',{'A':60,'a':10,'b':7},'BCc',{'A':45,'a':10,'b':6}),
    ('е',{'a':6.3,'b':6.3,'C':54},'cAB',{'a':5,'b':5,'C':60}),
    ('ж',{'b':32,'c':45,'A':87},'aBC',{'b':6,'c':8,'A':90}),
    ('з',{'a':14,'b':18,'c':20},'ABC',{'a':3,'b':4,'c':5}),
    ('и',{'a':6,'b':7.3,'c':4.8},'ABC',{'a':5,'b':5,'c':6})]


def third(left,right):
    return next(c for c in 'ABC' if c not in (left,right))


def cos_angle(a,b,c):
    return degrees(acos(max(-1,min(1,(b*b+c*c-a*a)/(2*b*c)))))


def solve(given):
    d=dict(given)
    angles=[s for s in 'ABC' if s in d];sides=[s for s in 'abc' if s in d]
    rejected=None
    if len(angles)==2:
        i,j=angles;d[third(i,j)]=180-d[i]-d[j];base=sides[0];ratio=d[base]/sin(radians(d[base.upper()]))
        for s in 'abc':d[s]=ratio*sin(radians(d[s.upper()]))
        method='asa'
    elif len(angles)==1 and angles[0].lower() in sides:
        A=angles[0];a=A.lower();b=next(s for s in sides if s!=a);B=b.upper();C=third(A,B)
        d[B]=degrees(asin(d[b]*sin(radians(d[A]))/d[a]));rejected=180-d[B]
        if d[A]+rejected<180-1e-9:raise ValueError('The source or practice problem has a second solution.')
        d[C]=180-d[A]-d[B];d[C.lower()]=d[a]*sin(radians(d[C]))/sin(radians(d[A]))
        method='ssa'
    else:
        if len(angles)==1:
            I=angles[0];u,v=sides
            d[I.lower()]=sqrt(d[u]**2+d[v]**2-2*d[u]*d[v]*cos(radians(d[I])))
            method='sas'
        else:method='sss'
        for I,J,K in [('A','b','c'),('B','a','c'),('C','a','b')]:
            if I not in d:d[I]=cos_angle(d[I.lower()],d[J],d[K])
    return d,method,rejected


def fmt(v,n=2):
    return f'{v:.{n}f}'.rstrip('0').rstrip('.').replace('.',',')


def value(name,v):
    return fmt(v,1 if name.isupper() else 2)+('°' if name.isupper() else '')


def description(d):
    return ', '.join(name+'='+value(name,v) for name,v in d.items())


def shown(d,keys):
    return ', '.join(k+'≈'+value(k,d[k]) for k in keys)


def figure(label,d,altitude):
    b,c,A=d['b'],d['c'],radians(d['A'])
    x,y=b*cos(A),b*sin(A)
    if abs(x)<1e-10:x=0
    p={'A':(0,0),'B':(c,0),'C':(x,y)}
    edges=[('A','B'),('B','C'),('C','A')]
    if altitude:
        p['H']=(x,0);edges.append(('C','H'))
    return graph(label,p,edges=edges)


def exact_forms(d,keys):
    variants=[]
    for key in keys:
        digits=1 if key.isupper() else 2
        v=d[key];plain=fmt(v,digits);fixed=f'{v:.{digits}f}'.replace('.',',')
        forms={plain,fixed,plain.replace(',','.'),fixed.replace(',','.')}
        if key.isupper():forms|={n+'°' for n in forms}
        variants.append(sorted(forms))
    return sorted({sep.join(row) for row in product(*variants) for sep in (';','; ')})


def author_one(part,given,keys,other):
    d,method,rejected=solve(given);nd,_,_=solve(other)
    if method=='asa':
        found=next(k for k in 'ABC' if k not in given);base=next(k for k in 'abc' if k in given)
        first=f'Вычти из 180° два заданных угла. Получишь {found}={value(found,d[found])}. Сторона {base} лежит напротив угла {base.upper()}.'
        body=f'Из теоремы синусов для любой другой стороны x: x={base}·sin X/sin {base.upper()}. Для данных {description(given)} получаем {shown(d,keys)}.'
        hint='Сначала найди недостающий угол из суммы 180°. В пропорции длина и синус в одном отношении должны стоять напротив друг друга.'
        q1=f'Каков восстановленный третий угол {found}, в градусах?';a1=fmt(d[found],0)
    elif method=='ssa':
        first=f'Найди sin B=b sin A/a. Основной угол B≈{value("B",d["B"])}. Проверь и второй кандидат 180°−B≈{value("B",rejected)}.'
        body=f'Второй кандидат вместе с A={value("A",d["A"])} даёт не меньше 180°, он невозможен. Для первого C=180°−A−B. Затем c=a sin C/sin A. Получается {shown(d,keys)}.'
        hint='Обратное вычисление синуса даёт два возможных угла. Сначала проверь, помещается ли каждый вместе с данным углом в треугольник.'
        q1='Сколько углов B из двух кандидатов удовлетворяют условию A+B<180°?';a1='1'
    elif method=='sas':
        I=next(k for k in 'ABC' if k in given);i=I.lower();u,v=[k for k in 'abc' if k in given]
        first=f'Сторона {i} лежит напротив известного угла {I}. По теореме косинусов {i}²={u}²+{v}²−2{u}{v} cos {I}. Получается {i}≈{value(i,d[i])}.'
        body=f'Для оставшихся углов используй косинусы по трём найденным сторонам и сумму 180°. Результат {shown(d,keys)}.'
        hint='Угол дан между двумя известными сторонами. Сначала вычисли третью сторону через косинус этого угла, затем восстанавливай углы.'
        if part=='е':
            first+=' Равные стороны a и b означают A=B.'
            q1='Чему равен каждый угол при основании в этом примере?';a1='63'
        else:q1='Каков заданный угол между известными сторонами?';a1=fmt(d[I],0)
    else:
        first=f'Сравни стороны. Угол A находим из cos A=(b²+c²−a²)/(2bc), получаем A≈{value("A",d["A"])}.'
        body=f'Аналогично cos B=(a²+c²−b²)/(2ac). Найди B и вычисли C=180°−A−B. Проверка по всем трём сторонам даёт {shown(d,keys)}.'
        hint='В числителе формулы для cos A вычитай квадрат стороны a, лежащей напротив A. Для остальных углов меняй и сторону, и знаменатель.'
        q1='Каков наибольший исходный угол: 1 — A, 2 — B, 3 — C?';a1=str(1+'ABC'.index(max('ABC',key=d.get)))
    if part=='ж':
        correction=('В ответах на с. 400 указано a≈58,84. Проверь число по исходным b=32, c=45, A=87°. '
                    'Получаем a²=3049−2880 cos 87°≈2898,27, тогда a≈53,84. Значение 58,84 дало бы сторону длиннее гипотенузы при прямом угле, хотя 87° — острый угол. '
                    'Дальнейший расчёт без промежуточного округления даёт B≈36,4°, C≈56,6°.')
        body+=' '+correction
        hint+=' '+correction
    fresh_known=description(other);fresh=shown(nd,keys)
    q2='Каков новый угол C, округлённый до целых градусов?';a2=str(round(nd['C']))
    views=[figure('Исходный треугольник ABC',d,False),figure('Высота к AB и проверка углов',d,True),figure('Новый треугольник с другими исходными данными',nd,True)]
    final=area(1114,part,[282],f'Реши треугольник ABC при {description(given)}. Обозначения a=BC, b=CA, c=AB. Найди '+', '.join(keys)+'. Стороны округли до сотых, углы до десятых градуса.',
        first+' '+body,hint,[('Выбери первый вычисляемый элемент',first,hint),('Заверши решение',body,'Для проверки сложи три угла и сравни стороны напротив большего и меньшего углов.'),
            ('Реши по новым данным',f'Пусть {fresh_known}. Тем же способом получаются {fresh}. Используй неокруглённые промежуточные значения.','Перестрой исходный треугольник и снова проверь сумму углов.')],views,
        [(q1,a1,'Сверь найденный угол и ограничения суммы трёх углов.'),(q2,a2,'Считай по новым данным, затем округли величину угла один раз.')],refs=[105,106,107])
    return grade(final,exact_forms(d,keys),hint,'Введи через точку с запятой в порядке '+', '.join(keys)+'. Углы — до десятых градуса, стороны — до сотых; нули в конце можно опустить.')


def build():
    return {'bookId':BOOK,'lessons':[author_one(*row) for row in SPECS]}


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--check',action='store_true')
    result=json.dumps(build(),ensure_ascii=False,separators=(',',':'))+'\n'
    if parser.parse_args().check:assert OUT.read_text()==result
    else:OUT.write_text(result)
