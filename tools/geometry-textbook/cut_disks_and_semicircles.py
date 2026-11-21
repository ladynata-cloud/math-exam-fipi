"""The cut-out square, four-ring target and Pythagorean semicircles, source 1214–1216."""
import argparse
import json
from math import atan2,cos,hypot,pi,sin

from coordinate_curves import graph
from triangle_sine_area import area
from trigonometric_signs import grade
from vector_scaling import BOOK,ROOT

OUT=ROOT/'geometry-course/textbook/data/cut-disks-and-semicircles.json'


def square_cut(label,r,diagonals):
    p={'T':(0,0),'A':(r,0),'B':(0,r),'C':(-r,0),'D':(0,-r),'U':(-r,-r-.6),'W':(1-r,-r-.6)}
    edges=[('A','B'),('B','C'),('C','D'),('D','A'),('U','W')]
    if diagonals:edges.extend([('A','C'),('B','D')])
    loops=[]
    for j,(a,b) in enumerate(zip('ABCD','BCDA',strict=True)):
        names=[a]
        for k in range(1,19):
            theta=(j+k/19)*pi/2;name=f'_curve{j}_{k}';p[name]=(r*cos(theta),r*sin(theta));names.append(name)
        names.append(b);loops.append(names)
    return graph(label,p,edges=edges,circle=('T',r)),loops,[]


def target(label,factor,index):
    rs=[factor*n for n in (1,2,3,4)];p={'T':(0,0),'U':(-rs[-1],-rs[-1]-.7),'W':(1-rs[-1],-rs[-1]-.7)}
    for i,n in enumerate('ABCD'):p[n]=(rs[i],0)
    loops=[];edge=[('T','A'),('A','B'),('B','C'),('C','D'),('U','W')]
    boundaries=[]
    for i in [index] if index==0 else [index,index-1]:
        names=['ABCD'[i]]
        for j in range(1,64):
            theta=j*pi/32;k=f'_area{i}_{j}';p[k]=(rs[i]*cos(theta),rs[i]*sin(theta));names.append(k)
        boundaries.append(names)
    if index==0:loops=[boundaries[0]]
    else:
        outside,inside=boundaries
        for j in range(64):
            k=(j+1)%64;loops.append([outside[j],outside[k],inside[k],inside[j]])
    return graph(label,p,edges=edge,circle=('T',rs[-1])),loops,[('T','A'),('T','B'),('T','C')]


def halves(label,x,y,shaded):
    p={'A':(0,0),'B':(x,0),'C':(0,y),'U':(-1,-x/2-.7),'W':(0,-x/2-.7)}
    edges=[('A','B'),('B','C'),('C','A'),('U','W')];fills=[]
    for j,(a,b,center) in enumerate([('A','B','H'),('B','C','K'),('C','A','L')]):
        t=tuple((p[a][k]+p[b][k])/2 for k in (0,1));p[center]=t
        rad=hypot(p[a][0]-t[0],p[a][1]-t[1]);start=atan2(p[a][1]-t[1],p[a][0]-t[0]);names=[a]
        for k in range(1,32):
            theta=start+pi*k/32;name=f'_arc{j}_{k}';p[name]=(t[0]+rad*cos(theta),t[1]+rad*sin(theta));names.append(name)
        names.append(b);edges.extend(zip(names,names[1:]));edges.append((a,center))
        if j in shaded:fills.append(names)
    g=graph(label,p,edges=edges)
    # The internal plotting origin represents visible A. Model groups use this actual point ID.
    return g,[['O' if k=='A' else k for k in ns] for ns in fills],[]


def card(n,task,reason,hint,steps,vs,checks,note,forms=None):
    e=area(n,None,[309],task,reason,hint,steps,[v for v,_,_ in vs],checks,refs=[120])
    e['source']['chapter']='XIII';e['review']['reviewer']='Атанасян 7–9, 2023: исходные №1214–1216 на с. 309, ответы к №1214–1215 на с. 402. Проверены четыре сегмента за квадратом, каждый круговой слой и полуокружности на всех трёх диаметрах.'
    e['help'][1]['text']=hint;m=e['visualization']['model'];m['description']=note;e['visualization']['caption']=note
    for i,(v,(scene,loops,circles)) in enumerate(zip(m['views'].values(),[vs[0],*vs[:3],*vs],strict=True)):
        suf='__v'+str(i)
        # The legacy frame fitter only repositions points used by a visible edge.
        # Reproject fill-only arc samples in the same unit system as the named points.
        ids={name:k for k in v['points'] for name in m['labels'][k].split('=')}
        center=ids['A' if n==1216 else 'T'];cx,cy=m['points'][center][:2]
        scale=m['points'][ids['W']][0]-m['points'][ids['U']][0]
        for name in {name for loop in loops for name in loop if name.startswith('_')}:
            x,y=scene[0][1][name]
            m['points'][name+suf][:2]=[cx+x*scale,cy+y*scale]
        v['polygons']=[[k+suf for k in loop] for loop in loops]
        if n==1216:
            ids={name:k for k in v['points'] for name in m['labels'][k].split('=')}
            v['rightAngles']=[{'vertex':ids['A'],'a':ids['B'],'b':ids['C'],'size':1.7}]
        if circles:
            ids={name:k for k in v['points'] for name in m['labels'][k].split('=')}
            v['circles'].extend([{'center':ids[a],'through':ids[b]} for a,b in circles])
    if forms:return grade(e,forms,hint,'Запиши точную площадь или последовательность площадей через точку с запятой.')
    e['answer']['prompt']='Запиши доказательство для произвольных катетов и гипотенузы. Сравни своё рассуждение со схемой.';return e


def cut():
    vs=[square_cut('Белый квадрат вырезан из круга',4,False),square_cut('Проведи обе диагонали',4,True),square_cut('Уменьши радиус до двух',2,True)]
    hint='У вписанного квадрата диагональ равна диаметру 2r. Площадь квадрата равна половине квадрата диагонали. Её надо вычесть из πr².'
    return card(1214,'Из круга радиуса r вырезали квадрат, вершины которого лежат на его границе. Вырази суммарную площадь четырёх оставшихся частей.',
      'Диагональ вписанного квадрата равна 2r. Его площадь (2r)²/2=2r². Остаток равен πr²−2r²=r²(π−2).',hint,[
      ('Отдели вырезанную часть','Стороны квадрата — хорды между соседними вершинами. Белая середина удалена; суммируются четыре закрашенных области между хордами и дугами.','Площадь самого квадрата не является ответом.'),
      ('Вычисли площадь квадрата по диагоналям','Диагонали AC и BD равны и перпендикулярны. Через их половину произведения получаем 2r². Из круга убираем квадрат один раз, а не четыре раза.','Радиус r и сторона квадрата различаются.'),
      ('Проверь на другом радиусе','При r=2 полный круг имеет площадь 4π, квадрат — 8. Остаток 4π−8; все четыре закрашенные части равны.','Каждой отдельной части принадлежит четверть остатка.')],vs,[
      ('При радиусе 4 какой длины диагональ квадрата?','8','Удвой радиус.'),('При новом радиусе 2 какова площадь вырезанного квадрата?','8','Умножь r²=4 на два.')],
      'T — общий центр. Закрашены четыре части вне квадрата. Один отрезок UW соответствует единице.',
      ['r²(π−2)','r²(π-2)','πr²-2r²','r^2*(pi-2)'])


def rings():
    vs=[target('Центральный круг радиуса 1',1,0),target('Наружное кольцо между 3 и 4',1,3),target('Удвой все радиусы',2,3),target('Кольцо между 1 и 2',1,1),target('Кольцо между 2 и 3',1,2)]
    hint='Сначала найди четыре накопленные площади: π, 4π, 9π, 16π. Центральный круг оставь как есть. Для каждого следующего слоя вычти предыдущую накопленную площадь.'
    return card(1215,'Четыре концентрические окружности имеют радиусы 1,2,3,4. Найди площадь центрального круга, а затем площади трёх отдельных колец по порядку от центра к краю.',
      'Центр имеет площадь π. Кольца последовательно имеют площади (4−1)π=3π, (9−4)π=5π и (16−9)π=7π. Сумма равна 16π — площади большого круга.',hint,[
      ('Измерь центр','До A радиус 1. Внутренний круг имеет площадь π. Следующая граница с радиусом 2 заключает внутри и этот круг, и первое кольцо.','4π — площадь всего круга радиуса 2, а не одного нового слоя.'),
      ('Вычитай соседние квадраты','Снаружи лежит кольцо между 3 и 4. Вычитание 4²−3² даёт коэффициент 7. Тем же способом получаем 3 и 5 для двух внутренних колец. Все слои ширины 1, но их площади разные.','При одинаковой ширине внешний слой возникает вокруг более длинной окружности.'),
      ('Удвой все расстояния','При радиусах 2,4,6,8 площади слоёв умножатся на четыре. Наружное кольцо теперь имеет площадь (64−36)π=28π. В вариантах чертежа можно выбрать и каждое из исходных внутренних колец.','Учитывается площадь только между выбранными границами.')],vs,[
      ('Каков коэффициент при π у исходного наружного кольца?','7','Вычти квадрат 3 из квадрата 4.'),('У мишени с удвоенными радиусами найди коэффициент при π для наружного кольца.','28','Вычти 36 из 64.')],
      'T — центр. Точки A, B, C, D лежат на четырёх границах. У каждого варианта закрашен только указанный круг или кольцо. UW — единичная мерка.',
      ['π;3π;5π;7π','pi;3*pi;5*pi;7*pi','1π;3π;5π;7π'])


def semicircles():
    vs=[halves('Полукруги на двух катетах',4,3,[0,2]),halves('Полукруг на гипотенузе',4,3,[1]),halves('Три полукруга для катетов 5 и 12',5,12,[0,1,2])]
    hint='Площадь полукруга с диаметром d равна (π/2)(d/2)²=πd²/8. Один и тот же коэффициент π/8 умножает квадрат соответствующей стороны.'
    return card(1216,'На сторонах прямоугольного треугольника как на диаметрах построены три полукруга. Докажи, что площадь полукруга на гипотенузе равна сумме двух площадей на катетах.',
      'Для катетов a,b и гипотенузы c площади равны πa²/8, πb²/8, πc²/8. По теореме Пифагора a²+b²=c²; умножение равенства на π/8 доказывает требуемое.',hint,[
      ('Запиши площадь через диаметр','Радиус равен половине стороны, а из всего круга берётся половина площади. Так получаем πd²/8. Для диаметров 3 и 4 площади равны 9π/8 и 16π/8.','Сначала раздели диаметр на два, прежде чем возводить радиус в квадрат; затем возьми половину площади.'),
      ('Подставь теорему Пифагора','При гипотенузе 5 площадь большого полукруга равна 25π/8; сумма числителей 9+16=25. Общее равенство следует из a²+b²=c², не только из этого примера.','Прямой угол у A — существенное условие.'),
      ('Проверь другое отношение катетов','У прямоугольного треугольника с катетами 5 и 12 гипотенуза 13. Коэффициенты площадей при π/8 равны 25,144 и 169. Первые два снова дают третий.','Для проверки можно сравнивать только квадраты диаметров, поскольку π/8 общий.')],vs,[
      ('Каков числитель суммы площадей при общем множителе π/8 для катетов 3 и 4?','25','Сложи 9 и 16.'),('У нового треугольника с катетами 5 и 12 какой числитель у полукруга на гипотенузе при множителе π/8?','169','Сложи 25 и 144.')],
      'A — вершина прямого угла. H, K, L — середины сторон и центры полуокружностей. Все три области построены снаружи треугольника. UW — единица длины.')


def build():return {'bookId':BOOK,'lessons':[cut(),rings(),semicircles()]}


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true')
    text=json.dumps(build(),ensure_ascii=False,separators=(',',':'))+'\n'
    if parser.parse_args().check:assert OUT.read_text()==text
    else:OUT.write_text(text)
