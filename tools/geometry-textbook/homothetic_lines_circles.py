"""Every line and circle construction of exercises 1311 and 1312 (Atanasyan 2023)."""
import argparse
import json
from homothety_centers import CAP,RULE
from polygon_similarity_intro import entry
from rotated_circles_lines import diagram
from vector_scaling import BOOK,ROOT

OUT=ROOT/'geometry-course/textbook/data/homothetic-lines-circles.json'


def show(k):
    return str(k).replace('.',',').replace('-', '−')


def image(x,k):return tuple(z*k for z in x)


def line_view(title,d,k,n,span=3):
    nx,ny=n
    tx,ty=ny,-nx
    a=(d*nx,d*ny)
    b=(a[0]+span*tx,a[1]+span*ty)
    def extended(t):return (a[0]+t*tx,a[1]+t*ty)
    before=(extended(-2.3),extended(span+1.7));after=tuple(image(z,k) for z in before)
    return diagram(title,{'T':(0,0),'A':a,'B':b,'A′':image(a,k),'B′':image(b,k)},
                   [('A','A′'),('B','B′')],[before,after])


def lines(part,k):
    sign='на лучах OA и OB' if k>0 else 'на противоположных к OA и OB лучах'
    place='с той же стороны от центра по перпендикуляру' if k>0 else 'по другую сторону от центра по перпендикуляру'
    distance=round(2*abs(k-1));normal=[(0,1),(3/5,4/5),(-4/5,3/5)]
    scenes=[line_view(t,d,k,n) for t,d,n in zip(['Построение по двум точкам','Проверь расстояние от центра','Новая наклонная прямая'],(2,4,2),normal,strict=True)]
    return entry(1311,part,[344],f'Даны точка O и прямая l, которая не проходит через неё. Построй образ прямой l при гомотетии с центром O и коэффициентом k={show(k)}.',
        f'Выбираем на l две различные точки A и B. Строим A₁ и B₁ {sign}, откладывая OA₁=|k|·OA, OB₁=|k|·OB. Прямая через A₁ и B₁ — искомая. Действительно, вектор A₁B₁=k·AB, поэтому прямая образа параллельна исходной. Любая точка исходной прямой имеет образ на найденной прямой, а обратная гомотетия с коэффициентом 1/k возвращает все её точки. Полученная прямая лежит {place}.',
        [('Возьми две разные точки на прямой',f'Построй их образы для k={show(k)}. Знак определяет луч для каждой точки, модуль задаёт длину от центра. Соедини две построенные точки и продолжи линию в обе стороны.','Один построенный образ определяет только точку. Для прямой возьми вторую точку или проведи через первый образ параллель исходной прямой.'),
         ('Проверь расстояние по перпендикуляру',f'На втором чертеже TA перпендикулярно l и TA=4. Найди TA′. Отрезок TA′ тоже перпендикулярен прямой-образу.','Расстояние до прямой неотрицательно. Знак коэффициента определяет сторону центра и не меняет это требование.'),
         ('Найди зазор между прямыми в новой модели',f'В третьем чертеже TA=2 и k={show(k)}. Координата A вдоль направленного перпендикуляра равна 2, координата A′ равна 2k. Найди расстояние между прямыми как |2k−2|.','При отрицательном k исходная и новая прямые по разные стороны от T. Их расстояния до центра тогда складываются.')],
        scenes,[('Какова длина TA′ при TA=4?',str(round(4*abs(k))),'Умножь 4 на |k|.'),('Какое расстояние разделяет прямые в третьей модели?',str(distance),'Возьми модуль разности направленных координат A и A′.')],
        RULE,'Сначала проверь сторону от центра, затем проверь длину. Искомая прямая проходит через обе полученные точки.',CAP,refs=[133,134])


def circle_view(title,center,r,k):
    cx,cy=center;cx1,cy1=image(center,k);rho=abs(k)*r
    points={'T':(0,0),'C':center,'R':(cx,cy+r),'C′':(cx1,cy1),'R′':image((cx,cy+r),k)}
    for q,(x,y,rad) in enumerate([(cx,cy,r),(cx1,cy1,rho)]):
        for j,(dx,dy) in enumerate(((rad,0),(-rad,0),(0,rad),(0,-rad))):points[f'bound{q}{j}']=(x+dx,y+dy)
    return diagram(title,points,[('C','R'),('C′','R′'),('T','C′'),('C','C′')])


def exact_circles(card):
    m=card['visualization']['model']
    for v in m['views'].values():
        clean=[]
        names={}
        for key in v['points']:
            labels=[z for z in m['labels'][key].split('=') if not z.startswith('bound')]
            if not labels:continue
            clean.append(key);m['labels'][key]='='.join(labels)
            for z in labels:names[z]=key
        v['points']=clean
        v['circles']=[dict(center=names['C'],through=names['R']),dict(center=names['C′'],through=names['R′'])]
    return card


def circle(part,k):
    ray='противоположном луче к OC' if k<0 else 'луче OC'
    return exact_circles(entry(1312,part,[345],f'Даны окружность произвольного радиуса r с центром C и другая точка O. Построй окружность-образ при гомотетии с центром O и k={show(k)}.',
        f'На {ray} строим центр C₁ так, что OC₁=|k|·OC. Из C₁ проводим окружность радиуса |k|r. Для любой точки R исходной окружности её образ R₁ удовлетворяет C₁R₁=|k|·CR=|k|r. Обратное преобразование показывает, что каждая точка построенной окружности действительно является образом. Центр гомотетии O и центр заданной окружности C в условии различны.',
        [('Найди центр образа',f'Проследи пару C,C′ в первом построении. При k={show(k)} центр C′ находится на {ray}. Окружность рисуют из C′.','Проводя окружность из центра гомотетии T, ты заменяешь её настоящий центр C′ другой точкой.'),
         ('Пересчитай радиус',f'Во втором авторском примере исходный радиус CR=2. Найди C′R′. Эта величина не зависит от расстояния TC.','Если коэффициент отрицательный, умножать длину радиуса следует на модуль коэффициента.'),
         ('Повтори с другим радиусом','В третьем построении центр перенесён в другое место, исходный радиус равен 3. Каков диаметр окружности-образа?','Сначала найди новый радиус, затем удвой. Длина диаметра и длина радиуса различаются в два раза.')],
        [circle_view('Образ центра и одной точки на окружности',(5,1),1,k),circle_view('Исходный радиус 2',(5,-1),2,k),circle_view('Новый радиус 3',(6,2),3,k)],
        [('Чему равен радиус образа при исходном радиусе 2?',str(round(2*abs(k))),'Новый радиус равен 2·|k|.'),('Чему равен диаметр образа при исходном радиусе 3?',str(round(6*abs(k))),'Умножь диаметр 6 на |k|.')],
        RULE,'Выполни два действия: построй центр C₁, затем отложи радиус |k|r. Для окружности оба действия необходимы.',CAP,refs=[133,134]))


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--check',action='store_true')
    rows=[*[lines(p,k) for p,k in zip('абвг',[2,-.5,-3,3],strict=True)],*[circle(p,k) for p,k in zip('абв',[-1,1.5,3],strict=True)]]
    for card in rows:
        model=card['visualization']['model']
        for key,label in model['labels'].items():
            if label=='U':model['labelOffsets'][key]=[-2.5,-4]
            if label=='W':model['labelOffsets'][key]=[2.5,-4]
    raw=json.dumps({'bookId':BOOK,'lessons':rows},ensure_ascii=False,separators=(',',':'))+'\n'
    if parser.parse_args().check:assert OUT.read_text()==raw
    else:OUT.write_text(raw)
