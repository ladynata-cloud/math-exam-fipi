"""Measured figures for original work with lengths, coordinate projections and a median."""
import argparse
import json
from math import isqrt
from coordinate_actions import show
from coordinate_positions import lesson,panel
from coordinate_tables import picture
from vector_scaling import BOOK,ROOT

OUT=ROOT/'geometry-course/textbook/data/coordinate-distances.json'


def magnitude(q):
    if q==0:return '0',['0','0,0','0.0']
    k=next(i for i in range(isqrt(q),0,-1) if q%(i*i)==0);n=q//(k*k)
    if n==1:return str(k),[str(k),str(k)+'.0',str(k)+',0','+'+str(k),f'√{q}',f'sqrt({q})']
    base='√'+str(n); canonical=(str(k) if k!=1 else '')+base
    accepted=[canonical,'√'+str(q),'√('+str(q)+')',f'sqrt({q})',f'корень({q})',f'корень из {q}']
    if k>1:accepted.extend([f'{k}·{base}',f'{k}*{base}',f'{k} sqrt({n})',f'{k}*sqrt({n})',f'{k}sqrt({n})'])
    return canonical,list(dict.fromkeys(accepted))


def grade_length(card,q,hint):
    _,values=magnitude(q)
    card['answer']=dict(mode='exact',accepted=values,prompt='Введи точную длину. Корень можно набрать как sqrt(число), множитель — как 3*sqrt(2).',feedback=hint)
    return card


def geometry(n,part=None,*,frames,cases,**content):
    out=lesson(n,part=part,pages=[257],frames=[f for f,_ in frames],cases=[f for f,_ in cases],**content)
    for i,(_,aliases) in enumerate(frames+cases):
        for mark,display in aliases.items():out['visualization']['model']['labels'][f'{mark}__v{i}']=display
    return out


def triangle(label,a,b,unit=1,*,arrow=False,show_legs=True):
    # The projection foot may coincide with an endpoint when one component is zero.
    named={'A':a,'B':b};h=(b[0],a[1]);right=a!=h and h!=b
    if right and show_legs:named['H']=h
    mapped={(0,0):'O'};points={};aliases={}
    for name,p in named.items():
        p=tuple(t/unit for t in p)
        if p not in mapped:mapped[p]=name;points[name]=p
        nick=mapped[p]
        if nick!=name:aliases[nick]=aliases.get(nick,nick)+'='+name
    key=lambda p:mapped[tuple(t/unit for t in p)]
    p,q=key(a),key(b);edge=p+q if p!=q else ''
    sides=[] if arrow or not edge else [edge];marks=[]
    if right and show_legs:
        foot=key(h);sides.extend([p+foot,foot+q]);marks.append(p+foot+q)
    return panel(label,points,' '.join(sides),edge if arrow else '',marks),aliases


def consecutive_midpoints():
    pts={'A':(0,1),'B':(5,-3),'C':(10,-7),'D':(7.5,-5)}
    def stage(text,names):return panel(text,{k:pts[k] for k in names},'AC' if 'C' in names else 'AB'),{}
    original=stage('A и первая середина B','AB');whole=stage('B делит AC пополам','ABC');half=stage('D делит BC пополам','ABCD')
    fresh=panel('Другой отрезок и две его середины',{'A':(0,3),'B':(2,1),'C':(4,-1),'D':(3,0)},'AC'),{}
    return geometry(1024,question='Известны A=(0;1) и B=(5;−3). Точка B является серединой AC, а D — серединой BC. Найди обе точки C и D, прослеживая порядок A,B,D,C.',
        answer='Из 2B=A+C следует C=(10;−7). Затем D=(B+C)/2=(7½;−5). Проверка: AB=BC как векторы, а BD=DC.',
        hint='В первом равенстве известна середина и один конец — отрази A через B. Во втором известны оба конца, поэтому возьми их полусумму.',
        steps=[('Продолжи отрезок за B','Сдвиг от A к B равен (5;−4). Чтобы B стала серединой AC, сделай точно такой же сдвиг от B к C. Получишь C=(10;−7).','У середины равны направленные перемещения от первого конца к середине и от середины ко второму концу.'),
               ('Раздели второй участок пополам','Для середины BC вычисли xD=(5+10)/2=7½, yD=(−3−7)/2=−5. Точка D находится между B и C.','Для каждой координаты середина даёт полусумму координат соответствующих концов.'),
               ('Проверь две роли середины','Векторы BD и DC равны (2½;−2), тогда как AB=(5;−4). На новом чертеже A=(0;3), B=(2;1), C=(4;−1), D=(3;0).','Первая и вторая середины относятся к разным отрезкам.')],
        frames=[original,whole,half,fresh],cases=[original,half,fresh],prompts=[('Какова ордината исходной точки C?','-7','От −3 сдвинься вниз ещё на 4.'),('Для нового A=(0;3), B=(2;1) найди абсциссу D.','3','Вычисли xC=4, затем усредни 2 и 4.')])


def vectors():
    data=[((5,9),(2,3)),((-3,4),(-4,3)),((-10,-10),(-3,-3)),((10,17),(4,-3)),((11,-11),(2,-2)),((10,0),(-7,0))]
    cards=[]
    for part,((x,y),new) in zip('абвгде',data,strict=True):
        q=x*x+y*y;rr=new[0]**2+new[1]**2;res=magnitude(q)[0];unit=2 if max(abs(x),abs(y))>6 else 1
        a=triangle('Исходный вектор',(0,0),(x,y),unit,arrow=True,show_legs=False)
        b=triangle('Сравни длину с проекциями',(0,0),(x,y),unit,arrow=True)
        c=triangle('Новая стрелка',(0,0),new,unit,arrow=True)
        proof=(f'Горизонтальная проекция имеет длину {abs(x)}, вертикальная — {abs(y)}. Они перпендикулярны. Для длины берём положительный корень из {x*x}+{y*y}={q}.') if x*y else 'Стрелка лежит на горизонтальной оси. Её длина равна модулю ненулевой координаты; дополнительный треугольник здесь не нужен.'
        e=geometry(1025,part,unit=f'{unit} '+('единица' if unit==1 else 'единицы'),question=f'Дан вектор с координатами {show((x,y))}. Вычисли его длину точно и проверь по проекциям.',
            answer=f'Длина равна {res}. Получаем |v|²=({x})²+({y})²={q}. {proof}',hint='Координаты определяют направления. При вычислении длины возведи каждую координату в квадрат до сложения.',
            steps=[('Отметь компоненты',f'Отложи от начала координат горизонтальный шаг {x} и вертикальный шаг {y}. Конечная точка имеет координаты {show((x,y))}.','Координаты радиус-вектора совпадают с координатами его конца.'),
                   ('Перейди от компонент к длине',proof+f' Получаем |v|={res}.','По Пифагору квадрат длины равен сумме квадратов координат, в том числе при нулевой проекции.'),
                   ('Проверь на новом примере',f'Для {show(new)} квадрат длины равен ({new[0]})²+({new[1]})²={rr}. При изменении сразу обоих знаков длина останется прежней.','Квадраты не зависят от знака исходных координат; знак длины неотрицателен.')],
            frames=[a,a,b,c],cases=[a,b,c],prompts=[('Чему равен квадрат длины исходной стрелки?',str(q),f'Сложи квадраты {x*x} и {y*y}.'),
                    (f'В новом примере {show(new)} найди квадрат длины.',str(rr),f'Сложи {new[0]**2} и {new[1]**2}.')])
        cards.append(grade_length(e,q,f'Значение {q} — квадрат длины, затем нужно извлечь корень. Квадраты отрицательных компонент положительны. Дай точный ответ.'))
    return cards


def distances_to_axes():
    m=(3,-2);rows=[]
    descriptions=[('оси абсцисс Ox','H',(3,0),2,(-4,5),5,'горизонтали','Расстояние до Ox равно |yM|: меняется только высота, а x сохраняется.'),
                  ('оси ординат Oy','K',(0,-2),3,(-4,5),4,'вертикали','Расстояние до Oy равно |xM|: перпендикуляр к Oy горизонтален, его длина измеряет сдвиг по x.'),
                  ('начала координат O','O',(0,0),13,(-4,5),41,'начала координат','Для расстояния до O используй обе координаты: OM²=xM²+yM².')]
    for part,(to,key,foot,q,npos,other,axis,reason) in zip('абв',descriptions,strict=True):
        def prepare(label,p,visible):
            x,y=p;coords={'M':p}
            if key=='O':
                coords['H']=(x,0);return panel(label,coords,'OM OH HM' if visible else 'OM','',['OHM'] if visible else []),{}
            if visible:coords[key]=(x,0) if key=='H' else (0,y)
            sides=(key+'M O'+key) if visible else ''
            return panel(label,coords,sides,'',['O'+key+'M'] if visible else []),{}
        a=prepare('Точка M и две оси',m,False);b=prepare('Кратчайший отрезок',m,True);c=prepare('Другая точка M',npos,True)
        square=q if key=='O' else q*q;fresh=other if key=='O' else other*other
        res=magnitude(square)[0]
        e=geometry(1026,part,question=f'Найди расстояние от M=(3;−2) до {to}. Покажи на рисунке отрезок, длину которого вычисляешь.',
            answer=f'Расстояние равно {res}. '+reason+' '+('Здесь 3²+(−2)²=13, поэтому OM=√13.' if key=='O' else f'Основание перпендикуляра имеет координаты {show(foot)}.'),
            hint=('До точки O обычно нельзя дойти только по вертикали или только по горизонтали. Построй прямоугольный треугольник.' if key=='O' else f'Проведи из M перпендикуляр к {axis}. Проверь, какая из координат точки при этом меняется.'),
            steps=[('Определи, где заканчивается отрезок',('Нужен отрезок OM, а не любая проекция на ось. Начало координат O=(0;0).' if key=='O' else f'Искомый отрезок соединяет M с точкой {key}={show(foot)}. Он перпендикулярен соответствующей оси.'),('У двух заданных точек соединяющий отрезок определён однозначно.' if key=='O' else 'Расстоянием от точки до прямой называется длина перпендикуляра.')),
                   ('Вычисли длину',reason+f' Для M=(3;−2) получаем {res}.','Длина неотрицательна.'),
                   ('Проверь на новом положении',f'Перенеси M в (−4;5). Применяй то же правило; квадрат нового расстояния равен {fresh}. Сторона оси влияет на знак координаты, но само расстояние положительно.','Для расстояния до оси сравни только координату перпендикулярной проекции; для расстояния до O нужны обе составляющие.')],
            frames=[a,a,b,c],cases=[a,b,c],prompts=[('У исходной точки чему равен квадрат искомого расстояния?',str(square),reason),('Для M=(−4;5) найди квадрат расстояния до той же цели.',str(fresh),reason)])
        rows.append(grade_length(e,square,('Для O надо учесть обе координаты. Значение 13 — квадрат длины; извлеки корень.' if key=='O' else reason+' Знак координаты в расстояние не переносится.')))
    return rows


def distances_between():
    rows=[]
    values=[((2,7),(-2,7),(1,-3),(-2,-3)),((-5,1),(-5,-7),(2,3),(2,-1)),((-3,0),(0,4),(1,2),(4,6)),((0,3),(-4,0),(-2,2),(2,-1))]
    for part,(a,b,c,d) in zip('абвг',values,strict=True):
        dx,dy=b[0]-a[0],b[1]-a[1];q=dx*dx+dy*dy;rr=dist2(c,d);res=magnitude(q)[0]
        neutral=triangle('Точки A и B',a,b,show_legs=False);source=triangle('Проверь по проекциям',a,b);new=triangle('Другие концы отрезка',c,d)
        if dx==0:why='Абсциссы одинаковы. Весь отрезок вертикален, достаточно модуля разности ординат.'
        elif dy==0:why='Ординаты одинаковы. Весь отрезок горизонтален, достаточно модуля разности абсцисс.'
        else:why='Обе разности ненулевые. Горизонтальная и вертикальная проекции образуют катеты прямоугольного треугольника.'
        e=geometry(1027,part,question=f'Каково расстояние между точками A={show(a)} и B={show(b)}? Проверь, лежит ли весь отрезок на горизонтали или на вертикали.',
            answer=f'Координаты перемещения равны {show((dx,dy))}, квадрат расстояния равен {q}, расстояние {res}. {why}',hint=why,
            steps=[('Найди смещения',f'От A к B по горизонтали надо сдвинуться на {b[0]}−({a[0]})={dx}, по вертикали на {b[1]}−({a[1]})={dy}.','Разности координат соответствуют отдельным проекциям отрезка.'),
                   ('Вычисли длину',f'{why} Используй AB²=({dx})²+({dy})²={q}. Длина равна {res}.','Квадрат длины равен сумме квадратов перпендикулярных составляющих.'),
                   ('Проверь перестановкой концов',f'При перестановке A и B обе разности поменяют знак, их квадраты сохранятся. Для других A={show(c)} и B={show(d)} квадрат длины равен {rr}.','Расстояние симметрично: AB=BA.')],
            frames=[neutral,neutral,source,new],cases=[neutral,source,new],prompts=[('Какова ордината вектора AB в исходной паре?',str(dy),f'Вычти yA={a[1]} из yB={b[1]}.'),('Чему равен квадрат расстояния для новой пары?',str(rr),f'Квадраты разностей x и y равны {(d[0]-c[0])**2} и {(d[1]-c[1])**2}.')])
        rows.append(grade_length(e,q,f'Для этой пары AB²={q}. Извлеки корень: расстояние — положительная длина, даже при отрицательной разности координат.'))
    return rows


def dist2(a,b):
    return sum((x-y)**2 for x,y in zip(a,b,strict=True))


def triangle_problems():
    pts={'M':(2,0),'N':(6,-1),'P':(2.5,-4.5)}  # two mathematical units per grid square
    def perimeter_scene(label,sides):return panel(label,{key:pts[key] for key in 'MNP' if any(key in edge for edge in sides.split())},sides),{}
    tri=perimeter_scene('Три стороны треугольника','MN NP PM');mn=perimeter_scene('Длина MN','MN');np=perimeter_scene('Длина NP','NP');pm=perimeter_scene('Длина PM','PM')
    e=geometry(1028,unit='2 единицы',question='Найди точный периметр треугольника MNP, если M=(4;0), N=(12;−2), P=(5;−9). Какие корни в сумме можно упростить?',
        answer='MN=√68=2√17, NP=√98=7√2, PM=√82. Периметр равен 2√17+7√2+√82. Разные радикалы складываются как отдельные слагаемые.',
        hint='Найди три длины отдельно. После извлечения корней сложи сами длины, а не их квадраты.',
        steps=[('Первая сторона','У MN смещения (8;−2). Поэтому MN²=64+4=68 и MN=2√17.','Число 68 имеет квадратный множитель 4.'),
               ('Вторая сторона','NP идёт на семь влево и семь вниз. Получаем NP²=49+49=98, то есть NP=7√2.','Диагональ квадрата со стороной 7 имеет длину 7√2.'),
               ('Третья сторона','От P до M разности (−1;9), так что PM²=1+81=82. Число 82=2·41 не содержит нетривиального квадратного множителя.','Знаки у двух компонент не определяют знак длины.'),
               ('Сложи границу','Точная сумма равна 2√17+7√2+√82. Возражение «извлечь корень из 68+98+82» неверно: периметр — сумма длин, а не корень из суммы их квадратов. На другом чертеже катеты 6 и 8 дают гипотенузу 10.','Расстояния сторон измеряются в единицах длины.')],
        frames=[tri,mn,np,pm,tri],cases=[mn,np,pm,tri],prompts=[('Чему равен квадрат NP?','98','Сложи 7²+7².'),('Чему равен квадрат PM?','82','Вычисли (−1)²+9².'),('В новом треугольнике сторона имеет проекции 6 и 8. Какова её длина?','10','Извлеки корень из 36+64.')])
    e['answer']['prompt']='Запиши три длины и их точную сумму. Объясни, как извлекал квадратные множители.'
    v={'A':(0,1),'B':(1,-4),'C':(5,2),'M':(3,-1)}
    tr=panel('Заданные вершины ABC',{k:v[k] for k in 'ABC'},'AB BC CA'),{}
    mid=panel('Середина стороны BC',v,'AB BC CA AM'),{}
    length=panel('Две проекции медианы',{**{k:v[k] for k in 'AM'},'H':(3,1)},'AH HM AM','',['AHM']),{}
    nav=panel('Новый пример с серединой',{'A':(-1,0),'B':(1,1),'C':(5,5),'M':(3,3)},'AB BC CA AM'),{}
    m=geometry(1029,question='В треугольнике A=(0;1), B=(1;−4), C=(5;2) проведена медиана AM. Найди её длину. Сначала определи, какой отрезок делит пополам точка M.',
        answer='M — середина BC. Её координаты (3;−1). Смещение AM=(3;−2), поэтому длина медианы √(3²+(−2)²)=√13.',
        hint='Буква A уже называет вершину, из которой проведена медиана. У противоположной стороны концы B и C.',
        steps=[('Найди конец медианы','Средняя абсцисса точек B и C равна (1+5)/2=3. Средняя ордината (−4+2)/2=−1. Получаем M=(3;−1).','Медиана соединяет вершину с серединой противоположной стороны.'),
               ('Найди длину','Из A=(0;1) к M=(3;−1) сдвиг равен (3;−2). Квадрат длины равен 9+4=13, а сама длина равна √13.','Расстояние двух точек вычисляется по разностям соответствующих координат.'),
               ('Проверь на новых данных','Пусть A=(−1;0), B=(1;1), C=(5;5). Середина BC теперь M=(3;3), а путь AM имеет проекции 4 и 3. Длина равна 5.','Сначала находи середину нужной стороны, затем измеряй отрезок из заданной вершины.')],
        frames=[tr,mid,length,nav],cases=[mid,length,nav],prompts=[('Какова ордината исходной середины M?','-1','Усредни −4 и 2, сохрани знак.'),('Какова длина медианы на новом рисунке?','5','Точка M=(3;3), A=(−1;0): используй 4²+3².')])
    return [e,grade_length(m,13,'Проверь, что усреднены B и C, а затем вычтено A. Число 13 — квадрат длины, а √13 — сама длина медианы.')]


def build():
    return {'bookId':BOOK,'lessons':[consecutive_midpoints()]+vectors()+distances_to_axes()+distances_between()+triangle_problems()}


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true')
    text=json.dumps(build(),ensure_ascii=False,separators=(',',':'))+'\n'
    if parser.parse_args().check:assert OUT.read_text()==text
    else:OUT.write_text(text)
