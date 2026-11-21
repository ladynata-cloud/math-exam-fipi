"""Collinearity in an arbitrary basis, lengths of sums and distances on Ox. Printed p. 269."""
from fractions import Fraction as F
from itertools import product
from math import isqrt
import argparse
import json
from coordinate_positions import lesson,panel
from vector_scaling import ROOT,BOOK

OUT=ROOT/'geometry-course/textbook/data/coordinate-additional-vectors.json'


def text(p):
    return '('+';'.join(str(t).replace('-','−') for t in p)+')'


def scaled(k,p):
    return tuple(k*x for x in p)


def combine(h,a,k,b):
    return tuple(h*x+k*y for x,y in zip(a,b,strict=True))


def squares(p):
    return sum(x*x for x in p)


def radical(sq):
    t=max(n for n in range(1,isqrt(sq)+1) if sq%(n*n)==0)
    r=sq//(t*t)
    return str(t) if r==1 else (str(t) if t!=1 else '')+'√'+str(r)


def card(n,part,task,reason,hint,steps,views,probes,refs,unit=1):
    c=lesson(n,part=part,pages=[269],question=task,answer=reason,hint=hint,steps=steps,frames=[views[0],*views[:3]],cases=views,prompts=probes,unit={1:'1 единица',2:'2 единицы',3:'3 единицы'}[unit])
    c['review']['reviewer']='Атанасян 7–9, издание 2023, печатная с. 269; сверены номера и подпункты, ответы на с. 399, координаты построений и новые примеры.'
    c['help'][1].update(theoryIds=[f'atanasyan-7-9-theory-{r}-part-1' for r in refs],text='Свяжи вычисление с определением в указанном пункте. Затем проверь результат по направлениям или длинам на своей модели.')
    return c


def vectors(label,p,q):
    if p==q:return panel(label+' (концы P и Q совпадают)',{'P':p},arrows='OP')
    return panel(label,{'P':p,'Q':q},arrows='OP OQ')


def parameters():
    rows=[]
    items=[
        ('а','p=2a−b, q=a+xb','1=2t','t=1/2','x=−t=−1/2','для p=3a−2b, q=a+xb имеем t=1/3, x=−2/3',
         [(4,-2),(2,0),(4,-2),(2,-1),(9,-6),(3,-2)],'q=p/2. Обе компоненты q вдвое меньше компонент p.','Чему равна ордината q на втором рисунке?','-1','У p она −2, а t=1/2.','-2/3',['-1/2','-½','-0,5','-0.5']),
        ('б','p=xa−b, q=a+xb','1=tx и x=−t','t=−x','1=−x², то есть действительных решений нет','для p=xa+b, q=a+xb получаем t=x и x²=1: подходят −1 и 1',
         [(0,-2),(2,0),(2,-2),(2,2),(-2,2),(2,-2)],'При x=1 стрелки идут в разные стороны по диагоналям. Отсутствие решения для всех x следует из невозможности отрицательного квадрата.','Чему пришлось бы равняться x² в исходном равенстве?','-1','Подставь t=−x в 1=tx.','2',['нет','нет решений','решений нет','не существует']),
        ('в','p=a+xb, q=a−2b','1=t','t=1','x=−2','для p=a+xb, q=2a+6b получаем t=2 и x=3',
         [(2,2),(2,-4),(2,-4),(2,-4),(1,3),(2,6)],'Оба разложения теперь равны, поэтому и стрелки равны.','Каково значение множителя t в исходной задаче?','1','Коэффициенты при a у обоих векторов равны 1.','3',['-2','-2,0','-2.0']),
        ('г','p=2a+b, q=xa+b','1=t','t=1','x=2','для p=2a+b, q=xa−2b получаем t=−2 и x=−4',
         [(4,2),(0,2),(4,2),(4,2),(2,1),(-4,-2)],'После подстановки p=q=2a+b, общий конец находится в (4;2).','Чему равна ордината q на верном втором рисунке?','2','q совпадает с p, обладающим ординатой 2.','-4',['2','+2','2,0','2.0'])]
    for part,expr,equation,t,solution,transfer,points,proof,q1,v1,h1,v2,accepted in items:
        p0,q0,p1,q1pos,p2,q2=points
        hint=('Не дели на x: оно может быть нулём. Из компоненты при b вырази t и подставь в другую.' if part=='б' else 'Сравни коэффициенты при том из векторов a,b, где они уже известны. Один и тот же t должен работать для обеих компонент.')
        full=f'Запишем q=tp. Так как a и b неколлинеарны, коэффициенты при них сравниваются по отдельности. Из {equation} следует {t}. Сравнение обеих компонент даёт {solution}.'
        views=[vectors('Проверка пробного x',p0,q0),vectors('Проверка исходного рассуждения',p1,q1pos),vectors('Изменённые коэффициенты',p2,q2)]
        steps=[('Сопоставь коэффициенты',f'Уравнение q=tp обязательно: p не может стать нулём, потому что один его коэффициент при неколлинеарной паре всегда ненулевой. По {expr} получаем {equation}, значит {t}.','Единственность разложения позволяет сравнивать соответствующие коэффициенты.'),('Проследи второе условие',f'Получаем {solution}. {proof} Здесь для модели взяты a=(2;0), b=(0;2).','Отдельный числовой рисунок проверяет рассуждение; вывод делай для произвольной неколлинеарной пары.'),('Проверь новую пару','Теперь '+transfer+'. На рисунке получаются p='+text(p2)+', q='+text(q2)+'.','При изменении коэффициентов проверь обе компоненты заново.')]
        q2text='Сколько действительных решений у изменённой задачи?' if part=='б' else 'Какое x получилось в изменённой паре?'
        c=card(1076,part,'Векторы a и b неколлинеарны. Для '+expr+' найди все действительные x, при которых p и q коллинеарны, либо обоснуй невозможность.',full,hint,steps,views,[(q1,v1,h1),(q2text,v2,'Для новой пары сначала сравни коэффициенты при одной букве, затем при другой.')],[93])
        c['answer']=dict(mode='exact',prompt='Введи x, при необходимости дробью через черту, или напиши «нет».',accepted=accepted,feedback=hint)
        rows.append(c)
    return rows


def lengths():
    rows=[]
    for part,expr,h,k,a,b,aa,bb,unit in [
        ('а','7a−3b',7,-3,(1,-1),(5,-2),(1,2),(3,1),1),
        ('б','4a−2b',4,-2,(6,3),(5,4),(-1,2),(2,1),2),
        ('в','5a−4b',5,-4,(F(3,5),F(1,5)),(6,-1),(2,1),(1,-2),3),
        ('г','3(−2a−4b)',-6,-12,(1,5),(-1,-1),(1,0),(0,1),3)]:
        p=tuple(int(x) for x in combine(h,a,k,b));q=combine(h,aa,k,bb);s=squares(p);r=radical(s);new=squares(q)
        def draw(label,pts,arr):
            return panel(label,{v:tuple(float(F(x,unit)) for x in point) for v,point in pts.items()},arrows=arr)
        views=[draw('Исходные векторы',{'A':a,'B':b},'OA OB'),draw('Сумма двух кратных',{'U':scaled(h,a),'P':p},'OU UP OP'),draw('Результат с новыми a и b',{'U':scaled(h,aa),'Q':q},'OU UQ OQ')]
        hint='Умножь на коэффициент обе координаты. Ответ включает координаты и длину. Длина равна корню из суммы квадратов, а не этой сумме.'
        before='Сначала раскрой скобки: 3(−2a−4b)=−6a−12b. ' if part=='г' else ''
        subs=f'{before}Два векторных слагаемых имеют координаты {text(scaled(h,a))} и {text(scaled(k,b))}. Их сумма p={text(p)}.'
        square=f'Квадрат длины ({p[0]})²+({p[1]})²={s}, поэтому |p|={r}.'
        steps=[('Умножь по компонентам',subs,'Коэффициент с минусом меняет направление всего вектора.'),('Перейди от вектора к длине',square+' У второй стрелки на рисунке начало в конце первой. Прямая из O в P изображает их сумму.','Длина совпадает с длиной результирующей стрелки OP.'),('Повтори на новых данных',f'При a={text(aa)}, b={text(bb)} выражение с теми же коэффициентами даёт {text(q)}. Теперь квадрат длины равен {new}, сама длина {radical(new)}.','Знаки компонент сохраняй до возведения в квадрат.')]
        c=card(1077,part,f'Для p={expr} с a={text(a)}, b={text(b)} найди координаты p и его длину.',subs+' '+square,hint,steps,views,[('Чему равна ордината исходного p?',str(p[1]),'Сложи вторые координаты кратных.'),('Каков квадрат длины нового вектора?',str(new),f'Сложи квадраты компонент {text(q)}.')],[94,96],unit)
        rootforms={r,'√'+str(s),'sqrt('+str(s)+')'}
        if '√' in r:
            coeff,rad=r.split('√');rootforms.add((coeff+'*' if coeff else '')+'sqrt('+rad+')')
        ans=[]
        for space,rad,wrap in product(('',' '),sorted(rootforms),(False,True)):
            coords=f'{p[0]};{space}{p[1]}'
            if wrap:coords='('+coords+')'
            ans.append(coords+';'+space+rad)
        c['answer']=dict(mode='exact',accepted=list(dict.fromkeys(ans)),prompt='Введи x;y;длина. Например, 2;−1;√5. Корень также можно записать через sqrt().',feedback=hint)
        rows.append(c)
    return rows


def axis():
    def line(label,x,y):return panel(label,{'A':(x,0),'B':(y,0)},'AB')
    views=[line('A слева от B',-3,2),line('A справа от B',4,-2),line('Обе точки левее начала',-6,-2)]
    reason='Для A=(x₁;0), B=(x₂;0) имеем AB=√((x₂−x₁)²)=|x₂−x₁|=|x₁−x₂|. При совпадении абсцисс расстояние равно нулю.'
    return card(1078,None,'Докажи формулу расстояния между произвольными точками оси Ox через модуль разности их абсцисс.',reason,'Учти, что квадратный корень из квадрата числа даёт его модуль.',[('Прочитай расстояние на оси','При абсциссах −3 и 2 расстояние 5; разность −3−2 равна −5. Модуль превращает её в неотрицательную длину.','Положение начала координат не меняет расстояния.'),('Обоснуй формулу',reason+' При x₁=4, x₂=−2 расстояние равно 6.','Перестановка A и B меняет знак разности, сохраняя её модуль.'),('Испытай две отрицательные абсциссы','Для A=(−6;0), B=(−2;0) расстояние равно |−6−(−2)|=4.','Сначала вычисли разность исходных координат.')],views,[('Какое расстояние между абсциссами 4 и −2?','6','Вычисли модуль 4−(−2).'),('Каково расстояние на третьем рисунке?','4','Вычти −2 из −6, затем возьми модуль.')],[96])


def build():return {'bookId':BOOK,'lessons':parameters()+lengths()+[axis()]}


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');opts=parser.parse_args()
    result=json.dumps(build(),ensure_ascii=False,separators=(',',':'))+'\n'
    if opts.check:assert OUT.read_text()==result
    else:OUT.write_text(result)
