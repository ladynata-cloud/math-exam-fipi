"""Measured Cartesian loci, including the printed minus sign and two branches in 1046в."""
import argparse
import json
from itertools import product, permutations
from math import sqrt
from coordinate_actions import show
from coordinate_positions import lesson, panel
from vector_scaling import BOOK, ROOT

OUT=ROOT/'geometry-course/textbook/data/coordinate-curves.json'


def graph(label, vertices, *, edges=(), circle=None, hyperbola=False, lines=(), radius_line=False):
    """Build distinct visible point marks; axes, hidden grid controls and loci stay independent."""
    points={};aliases={};locations={(0,0):'O'}
    def put(k,p,visible=True):
        position=tuple(p);existing=locations.get(position)
        if existing is None:
            locations[position]=k;points[k]=position;return k
        if visible and existing!=k:aliases[existing]=aliases.get(existing,existing)+'='+k
        return existing
    for name,point in vertices.items():put(name,point)
    segments=[];names={'O':'O',**{k:locations[tuple(v)] for k,v in vertices.items()}}
    for a,b in edges:
        pair=(names[a],names[b]);
        if pair[0]!=pair[1]:segments.append(pair)
    exact_circle=None
    if circle:
        name,r=circle;cx,cy=vertices[name];center=names[name];through=put('_radius',(cx+r,cy),False)
        for idx,p in enumerate(((cx-r,cy),(cx,cy-r),(cx,cy+r))):put('_bound'+str(idx),p,False)
        # Include both radius anchors when fitting the view even if the radius is hidden.
        segments.append((center,through))
        exact_circle=(center,through,radius_line)
    highlighted=[]
    for idx,(start,end) in enumerate(lines):
        a=put('_line'+str(idx)+'a',start,False);b=put('_line'+str(idx)+'b',end,False)
        segments.append((a,b));highlighted.append((a,b))
    if hyperbola:
        for sign in (-1,1):
            ids=[]
            for j in range(-24,25):
                y=j/5;x=.5+sign*sqrt(.25+y*y)
                ids.append(put(f'_curve{sign}p{j}',(x,y),False))
            sampled=list(zip(ids,ids[1:]));segments.extend(sampled);highlighted.extend(sampled)
    frame,_=panel(label,points)
    title,allpoints,arrows,gridlines=frame
    return (title,allpoints,arrows,gridlines+segments),aliases,exact_circle,highlighted


def curve_lesson(n,*,frames,cases,part=None,pages,**content):
    card=lesson(n,part=part,pages=pages,frames=[(g[0],()) for g in frames],cases=[(g[0],()) for g in cases],**content)
    model=card['visualization']['model']
    for i,((_,aliases,circle,curves),v) in enumerate(zip(frames+cases,model['views'].values(),strict=True)):
        suffix=f'__v{i}'
        if circle:
            center,through,draw_radius=circle
            v['circles']=[dict(center=center+suffix,through=through+suffix)]
            if not draw_radius:v['segments'].remove([center+suffix,through+suffix])
        if curves:v['highlightSegments'] += [[a+suffix,b+suffix] for a,b in curves]
        for k,label in aliases.items():model['labels'][k+suffix]=label
        for k in v['points']:
            if model['labels'].get(k) in ('O','O=D','O=S','O=S=D'):model.setdefault('labelOffsets',{})[k]=[-2.5,-3]
    model['description']='На координатной сетке одна клетка соответствует единице. Сравни точки заданной линии с точками вне неё.'
    card['visualization']['caption']=model['description']
    if card['kind']=='exercise':
        card['help'][1].update(theoryIds=['atanasyan-7-9-theory-97-part-1','atanasyan-7-9-theory-98-part-1'],text='Подставь обе координаты точки в исходное равенство. Для окружности квадраты двух разностей складываются.')
    card['review']['reviewer']='Атанасян 7–9, 2023, печатные с. 260–263; проверены исходные знаки, радиусы, контрольные точки и линии на построенных координатных моделях.'
    return card


def foundations():
    on=graph('Две точки прямой',{'A':(1,1),'B':(-2,-2)},lines=[((-3,-3),(3,3))]);off=graph('Проверь точку вне прямой',{'A':(1,1),'N':(2,1)},lines=[((-3,-3),(3,3))]);vertical=graph('Другая линия x=−1',{'A':(-1,2),'B':(-1,-2),'N':(1,-1)},lines=[((-1,-3),(-1,3))]);
    t97=curve_lesson(97,title='Уравнение линии на плоскости',pages=[260,261],question='Когда равенство с переменными x и y задаёт именно данную линию? Как связать подстановку пары чисел с принадлежностью точки?',
        answer='Должны выполняться два условия. Координаты каждой точки линии превращают уравнение в верное равенство, а у каждой точки вне линии равенство нарушается. Значит, все решения и только они дают точки линии.',hint='Проверь оба направления: от точки на линии к равенству и от пары, удовлетворяющей равенству, к линии.',
        steps=[('Проверь точки на примере','Для y=x точки A=(1;1), B=(−2;−2) удовлетворяют уравнению. Для N=(2;1) равенство 1=2 ложно, поэтому N лежит вне этой прямой.','Координаты точки указывают аргументы, которые надо подставить вместо x и y.'),
               ('Отдели доказательство от проверки','Пара удачных примеров ещё не описывает всю линию. Чтобы доказать, что уравнение нужное, установи оба включения: каждая точка линии подходит и каждая подходящая точка принадлежит линии.','Уравнение линии задаёт ровно множество её точек.'),
               ('Измени условие','На прямой x=−1 ордината может быть любой. Обе точки (−1;2), (−1;−2) подходят, а (1;−1) нет. Можно идти от фигуры к уравнению или от уравнения к фигуре.','Равенство может задавать линию, которую нельзя записать как график y=f(x).')],
        frames=[on,on,off,vertical],cases=[on,off,vertical],prompts=[('У точки (−2;y), лежащей на y=x, чему равно y?','-2','Подставь x=−2 в указанное равенство.'),('Какова абсцисса любой точки новой линии x=−1?','-1','Значение абсциссы уже фиксировано, даже когда меняется y.')])
    sample=graph('Центр S и радиус',{'S':(-2,1),'T':(1,1)},circle=('S',3),radius_line=True)
    compare=graph('Точки на окружности и внутри',{'S':(-2,1),'T':(-2,4),'N':(-1,1)},circle=('S',3),edges=[('S','T'),('S','N')]);origin=graph('Другая окружность проходит через O',{'S':(-3,4)},circle=('S',5),edges=[('S','O')]);
    t98=curve_lesson(98,title='Уравнение окружности',pages=[261,262],question='Выведи уравнение окружности с центром S=(a;b) и радиусом r. Объясни, почему оно включает ровно точки окружности, и найди радиус, если известна одна её точка.',
        answer='Пусть M=(x;y). Условие SM=r при r>0 эквивалентно (x−a)²+(y−b)²=r². Для центра в начале координат это x²+y²=r². Известная точка позволяет вычислить r² подстановкой её координат.',hint='Окружность состоит из всех точек на одном и том же расстоянии от центра. Воспользуйся формулой квадрата расстояния.',
        steps=[('Запиши расстояние','Квадрат расстояния между M и S равен (x−a)²+(y−b)². Например, при S=(−2;1), r=3 возникает (x+2)²+(y−1)²=9. Знак внутри скобок учитывает обе координаты центра.','Радиус и расстояние неотрицательны, поэтому можно равносильно сравнивать их квадраты.'),
               ('Проверь границу','У T=(−2;4) расстояние от S равно 3, значит T на окружности. У N=(−1;1) расстояние равно 1, меньше радиуса: это внутренняя точка, уравнение границы не выполняется.','В уравнении окружности стоит точное равенство, а не неравенство для круга.'),
               ('Восстанови неизвестный радиус','Если центр S=(−3;4) и окружность проходит через O, то r²=3²+4²=25. Её уравнение (x+3)²+(y−4)²=25. После раскрытия получится x²+y²+6x−8y=0.','Каждая известная точка окружности даёт верное равенство после подстановки.')],
        frames=[sample,sample,compare,origin],cases=[sample,compare,origin],prompts=[('Каков квадрат радиуса у (x+2)²+(y−1)²=9?','9','Сравни правую часть с r².'),('Чему равен радиус окружности с центром (−3;4), проходящей через O?','5','От центра до O длина √(9+16).')])
    bis=graph('Равные расстояния до A и B',{'A':(-2,1),'B':(2,1),'P':(0,3)},edges=[('A','B'),('A','P'),('B','P')],lines=[((0,-2),(0,4))]);oblique=graph('Наклонная прямая y=x+1',{'P':(1,2),'Q':(-2,-1)},lines=[((-3,-2),(3,4))]);par=graph('Две различные параллельные прямые',{'P':(0,1),'Q':(0,-1)},lines=[((-3,-2),(3,4)),((-3,-4),(3,2))]);vert=graph('Вертикальная прямая x=2',{'A':(2,-1),'B':(2,3)},lines=[((2,-2),(2,4))]);
    t99=curve_lesson(99,title='Уравнение прямой',pages=[262,263],question='Почему прямую на координатной плоскости можно задать уравнением ax+by+c=0? Как распознать наклонную, горизонтальную и вертикальную прямые?',
        answer='Прямую можно получить как серединный перпендикуляр к отрезку с разными концами. Равенство квадратов расстояний до концов после сокращения квадратов x и y линейно. В ax+by+c=0 коэффициенты a и b не равны нулю одновременно. При b≠0 имеем y=(−a/b)x−c/b; при b=0 имеем x=−c/a.',hint='Выбери две точки, симметричные относительно данной прямой. Сравни расстояния до них у переменной точки M.',
        steps=[('Выведи линейный вид','M лежит на серединном перпендикуляре к AB тогда и только тогда, когда MA²=MB². Запиши оба квадрата по координатам и раскрой скобки. Слагаемые x² и y² сократятся. Так как A≠B, коэффициенты при x и y не оба нулевые.','Геометрическое свойство серединного перпендикуляра действует в обе стороны.'),
               ('Прочитай наклон','Если b≠0, вырази y=kx+d, где k=−a/b и d=−c/b. Для различных невертикальных прямых одинаковый k означает параллельность. Если совпал и d, это одна прямая. У горизонтальной k=0.','За один и тот же шаг по x величина k задаёт одинаковый подписанный шаг по y.'),
               ('Сохрани вертикальный случай','Если b=0, тогда a≠0 и x постоянно, а y произвольно. Например, x=2 задаёт вертикальную прямую. У осей уравнения x=0 для Oy и y=0 для Ox.','Деление уравнения на b допустимо лишь при b≠0; вертикальную прямую следует рассмотреть отдельно.')],
        frames=[bis,bis,oblique,vert],cases=[bis,oblique,par,vert],prompts=[('Каков угловой коэффициент прямой y=x+1?','1','В записи y=kx+d коэффициент при x равен k.'),('Для другой вертикальной прямой 2x−8=0 найди абсциссу любой её точки.','4','Реши 2x=8; значение y не ограничено.')])
    return [t97,t98,t99]


def construction():
    data=[('x²+y²=9',(0,0),9,'3',(-2,1),4),('(x−1)²+(y+2)²=4',(1,-2),4,'2',(2,1),9),
          ('(x+5)²+(y−3)²=25',(-5,3),25,'5',(-2,2),4),('(x−1)²+y²=4',(1,0),4,'2',(2,0),9),
          ('x²+(y+2)²=2',(0,-2),2,'√2',(0,1),5)]
    rows=[]
    for part,(eq,(cx,cy),q,rad,another,rr) in zip('абвгд',data,strict=True):
        r=sqrt(q);center={'S':(cx,cy)};probe={'T':(cx+1,cy+1) if part=='д' else (cx+r,cy)}
        initial=graph('Выбери центр на пустой сетке',{'_extent':(cx+r,cy+r),'_corner':(cx-r,cy-r)})
        place=graph('Отложи положительный радиус',{**center,**probe},edges=[('S','T')]);outline=graph('Окружность и контрольная точка',{**center,**probe},circle=('S',r),edges=[('S','T')],radius_line=False)
        transfers={
            'а':((0,1),'Новый S=(−2;1), r=2. Какова абсцисса самой правой точки?','0','К абсциссе центра −2 прибавь радиус 2.'),
            'б':((2,-2),'Новый S=(2;1), r=3. Какова ордината нижней точки?','-2','Из ординаты центра 1 вычти радиус 3.'),
            'в':((-4,2),'Новый S=(−2;2), r=2. Чему равна абсцисса левой точки?','-4','Нужно от −2 отойти влево ещё на 2.'),
            'г':((2,3),'В новом уравнении (x−2)²+y²=9 точка лежит над центром при x=2. Найди положительное y.','3','Первая скобка нулевая: y²=9; требуется положительный корень.'),
            'д':((2,2),'Новый S=(0;1), r²=5. Точка имеет x=2 и y>1. Чему равно y?','2','Вычти 2² из 5, затем реши (y−1)²=1 с условием y>1.')
        }
        target,transfer_prompt,transfer_answer,transfer_hint=transfers[part]
        other=graph('Новый центр: найди отмеченную точку',{'S':another,'T':target},circle=('S',sqrt(rr)),edges=[('S','T')])
        x,y=another
        center_rule=(f'Чтобы найти центр, приравняй каждое выражение под квадратом к нулю. После подстановки получается x={cx}, y={cy}. Это S={show((cx,cy))}.')
        draw=('Справа стоит 2, поэтому радиус равен √2. Для точного построения отложи от S один шаг вправо и один вверх, получив точку окружности: квадрат расстояния равен 1²+1²=2. Затем проведи окружность с этим радиусом.' if rad=='√2' else f'Справа стоит {q}=r², поэтому r={rad}. От S можно отложить на горизонтали вправо {rad} единиц до T; проведи окружность с центром S через T.')
        e=curve_lesson(1045,part=part,pages=[263],question=f'Построй на координатной сетке окружность {eq}. Сначала отметь центр и хотя бы одну точку на окружности, затем проверь их на модели. Укажи центр и точный радиус.',
            answer=f'Центр S={show((cx,cy))}, радиус {rad}. '+draw,hint='Приведи левую часть к сумме (x−a)²+(y−b)². Точка (a;b) — центр; справа стоит квадрат радиуса.',
            steps=[('Найди центр',center_rule,'Координаты центра обращают в ноль обе разности под квадратами.'),
                   ('Построй окружность',draw,'Любая точка с квадратом расстояния до S, равным правой части, лежит на окружности.'),
                   ('Измени исходные данные',f'На новом рисунке S={show(another)}, r²={rr}. {transfer_prompt} Контрольная точка T={show(target)}. Подстановка даёт квадрат расстояния {rr}.','Сдвиг центра и изменение радиуса действуют независимо.')],
            frames=[initial,place,outline,other],cases=[place,outline,other],prompts=[('Какова ордината центра в исходном уравнении?',str(cy),center_rule),(transfer_prompt,transfer_answer,transfer_hint)])
        # A classification answer includes the entire construction data, including the radius sign/zero restrictions.
        radius_values=[rad]+(['sqrt(2)','корень(2)','корень из 2'] if rad=='√2' else [rad+',0',rad+'.0'])
        accepted=[]
        for radius in radius_values:
            for xval,yval in [(str(cx),str(cy))]:
                accepted.extend([f'{xval};{yval};{radius}',f'{xval}; {yval}; {radius}',f'({xval};{yval});{radius}',f'({xval}; {yval}); {radius}'])
        e['answer']=dict(mode='exact',accepted=accepted,prompt='Введи три величины через точку с запятой: x центра; y центра; радиус. Для √2 можно набрать sqrt(2).',
                         feedback=f'Проверь знаки у центра: скобки должны исчезнуть при x={cx}, y={cy}. Правая часть {q} — квадрат радиуса. Радиус берётся положительным.')
        rows.append(e)
    return rows


LETTERS={'A':('A','А'),'B':('B','В'),'C':('C','С'),'D':('D','Д'),'E':('E','Е')}


def set_answers(members):
    accepted=set()
    for order in permutations(members):
        for chosen in product(*(LETTERS[x] for x in order)):
            for div in (',',', ',';','; ',' и ',' '):
                text=div.join(chosen);accepted.update([text,text.lower()])
    return sorted(accepted,key=lambda s:(s!=','.join(members),s))


def membership():
    pts={'A':(3,-4),'B':(1,0),'C':(0,5),'D':(0,0),'E':(0,1)}
    data=[('x²+y²=25',(0,0),5,'AC',[25,1,25,0,1]),('(x−1)²+(y+3)²=9',(1,-3),3,'B',[5,9,65,10,17]),
          ('(x−½)²−y²=¼',None,None,'BD',[-9.75,.25,-24.75,.25,-.75])]
    rows=[]
    for part,(eq,center,r,letters,values) in zip('абв',data,strict=True):
        is_circle=center is not None
        def view(label,names):
            shown={k:pts[k] for k in names}
            if is_circle:shown={'S':center,**shown}
            g=graph(label,shown,circle=('S',r) if is_circle else None,hyperbola=not is_circle)
            return g
        initial=view('Исходные точки и линия','ABCDE');first=view('Сравни A и B','AB');rest=view('Проверь C, D и E','CDE');yes=view('Все точки, удовлетворяющие равенству',letters)
        challenge=(graph('Новый пример: окружность радиуса 2',{'S':(1,0),'T':(3,0),'N':(1,1)},circle=('S',2)) if is_circle else
                   graph('Новая точка на правой ветви',{'U':(2,sqrt(2)),'V':(2,-1)},hyperbola=True))
        fmt=lambda value:str(value).replace('.',',').replace('-','−')
        lst='; '.join(k+' → '+fmt(v) for k,v in zip('ABCDE',values,strict=True))
        target='25' if part=='а' else '9' if part=='б' else '¼'
        warning=('При этом равенстве сравни квадраты расстояний с '+target+'.' if is_circle else 'В печати перед y² стоит минус. Получается гипербола. В этом подпункте надо проверить напечатанное равенство; смена знака изменила бы саму линию.')
        if part=='б':challenge=graph('Новый центр и ближайшая точка справа',{'S':(-1,2),'N':(1,2),'T':(2,2)},circle=('S',3),edges=[('S','T')])
        a=curve_lesson(1046,part=part,pages=[263],question=f'Для A=(3;−4), B=(1;0), C=(0;5), D=(0;0), E=(0;1) укажи все точки, удовлетворяющие {eq}. '+('Проверь каждую подстановкой.' if is_circle else 'Сохрани знак между квадратами таким, как он напечатан; определи, какая линия действительно изображена.'),
            answer=f'Подходят '+', '.join(letters)+'. После подстановки левая часть даёт: '+lst+'. '+warning,
            hint='Составь пять отдельных подстановок. Равенство проверяется для каждой точки целиком. '+warning,
            steps=[('Испытай A и B',f'Для A получился результат {fmt(values[0])}, для B — {fmt(values[1])}. Сравни оба с {target}; значение y берётся из проверяемой точки со своим знаком.','Принадлежность линии равносильна выполнению её уравнения.'),
                   ('Проверь оставшиеся точки',f'У C левая часть равна {fmt(values[2])}, у D — {fmt(values[3])}, у E — {fmt(values[4])}. После всех пяти подстановок остаются '+', '.join(letters)+'.','Одной верной подстановки недостаточно, если вопрос просит найти все подходящие точки.'),
                   ('Измени данные',('На новой окружности с центром (1;0) и радиусом 2 точка T=(3;0) даёт квадрат расстояния 4, тогда как N=(1;1) даёт 1 и лежит внутри.' if part=='а' else 'У нового центра S=(−1;2), r=3. Из N=(1;2) пройди вправо одну единицу до T=(2;2). Для T получается 9, поэтому она на окружности.' if part=='б' else 'У новой U=(2;√2) левая часть напечатанного равенства равна (3/2)²−2=¼, поэтому U подходит. Если заменить минус плюсом, получится 17/4, и эта точка уже не подходит. Для контрольной V=(2;−1) левая часть равна 5/4, поэтому V вне гиперболы. Две ветви на чертеже соответствуют двум возможным x для заданного y.'),warning)],
            frames=[initial,first,rest,challenge],cases=[first,rest,yes,challenge],
            prompts=[('Сколько из пяти исходных точек удовлетворяют равенству?',str(len(letters)),'Засчитывай только полное совпадение левой и правой частей после подстановки.'),
                     (('В новом примере чему равен квадрат расстояния ST?','4','ST=2, значит ST²=4.') if part=='а' else ('В новом примере сколько единиц надо пройти вправо от N=(1;2) до правой точки окружности?','1','Правая точка имеет x=−1+3=2; из 1 нужно дойти до 2.') if part=='б' else ('В новом примере для точки U=(2;√2) чему равно y²?','2','Квадрат √2 равен 2. Его нужно вычесть.'))])
        a['answer']=dict(mode='exact',accepted=set_answers(letters),prompt='Введи все подходящие буквы через запятую. Порядок не важен.',feedback=('Сравни результаты всех пяти подстановок с '+target+'. '+warning))
        rows.append(a)
    return rows


def build():return {'bookId':BOOK,'lessons':foundations()+construction()+membership()}


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true')
    text=json.dumps(build(),ensure_ascii=False,separators=(',',':'))+'\n'
    if parser.parse_args().check:assert OUT.read_text()==text
    else:OUT.write_text(text)
