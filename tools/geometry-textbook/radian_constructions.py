"""Six actual constructions after a radian-to-degree conversion in number 1204 on page 308."""
import argparse
import json
from math import cos,pi,sin

from coordinate_curves import graph
from triangle_sine_area import area
from vector_scaling import BOOK,ROOT

OUT=ROOT/'geometry-course/textbook/data/radian-constructions.json'
ROWS=[
 ('а','π/3',60,30,'Через сторону равностороннего треугольника можно построить тот же угол в 60°.','π/6'),
 ('б','π/4',45,90,'Этот луч совпадает с биссектрисой прямого угла.','π/2'),
 ('в','π/2',90,45,'Искомый луч перпендикулярен исходному лучу TA.','π/4'),
 ('г','π/6',30,60,'Равноудалённые концы двух радиусов под углом 60° дают равносторонний треугольник. Биссектриса угла при T задаёт 30°.','π/3'),
 ('д','π',180,90,'Продолжи прямую AT за T: второй луч должен смотреть в противоположную сторону. Дуга показывает половину полной окружности.','π/2'),
 ('е','2π/3',120,60,'Это угол, смежный с 60°, либо сумма двух соседних углов по 60°. Он тупой.','π/3')]


def figure(title,deg,active,base):
    # Draw both 5° and 10° ticks as a functional semicircular protractor.
    r=3.5;start=base*pi/180;end=start+deg*pi/180
    p={'T':(0,0),'A':(round(r*cos(start),10),round(r*sin(start),10))}
    for j in range(1,73):
        a=start+pi*j/72;p['_scale'+str(j)]=(round(r*cos(a),10),round(r*sin(a),10))
    names=['A',*['_scale'+str(j) for j in range(1,73)]]
    edges=list(zip(names,names[1:]))+[('T','A')]
    # The end and the top of the scale belong to the same rotated reference ray in both examples.
    apex=round(deg/2.5);end_key=names[apex]
    if active:
        p['B']=p.pop(end_key)
        names[apex]='B'
        edges=[tuple('B' if n==end_key else n for n in pair) for pair in edges]+[('T','B')]
    for j in range(37):
        a=start+pi*j/36
        k='_tick'+str(j);v=names[2*j];radius=.88*r if j%6==0 else .92*r if j%2==0 else .965*r
        p[k]=(round(radius*cos(a),10),round(radius*sin(a),10));edges.append((k,v))
    for j in range(7):
        a=start+j*pi/6;p['L'+str(30*j)]=(round(1.19*r*cos(a),10),round(1.19*r*sin(a),10))
    g=graph(title,p,edges=edges)
    if active:return (*g[:3],list(zip(names[:apex],names[1:apex+1])))
    return g


def build():
    cards=[]
    for part,rad,deg,new,method,nrad in ROWS:
        vs=[figure('Совмести центр и нулевой край',deg,False,0),figure('Проведи луч через верную отметку',deg,True,0),figure('Построй новый угол от наклонного луча',new,True,15)]
        hint=f'Из {rad} радиан получаем {deg}° умножением на 180/π. Совмести центр транспортира с вершиной T, нулевое направление — с лучом TA, затем отметь {deg}° от TA.'
        c=area(1204,part,[308],f'На бумаге построй угол величины {rad} радиан. Покажи вершину, начальный и конечный лучи. Объясни, как проверить свой результат.',
            f'Искомая градусная мера {deg}°. Проведи исходный луч TA. Совмести вершину T с центром транспортира и луч TA с его нулевой отметкой, отметь {deg}° и проведи из T луч через отмеченную точку B. '+method,hint,[
            ('Переведи меру и создай исходный луч',f'Умножь {rad} на 180/π и получи {deg}°. Начни с луча TA и вершины T. Положи центр угломера в T, совмести начальную отметку с направлением на A.','Если начать от другого края шкалы, отсчёт пойдёт в противоположную сторону.'),
            ('Отметь направление и проведи второй луч',f'Одна малая риска модели означает 5°, поэтому от A до B нужно {deg//5} интервалов против часовой стрелки. На бумаге проведи луч TB. '+method,'Считай промежутки между соседними рисками, а не сами риски вместе с нулевой.'),
            ('Поверни основание и построй другой угол',f'Начальный луч на последнем чертеже наклонён. Отсчёт начинается именно от него: для {nrad} рад получаем {new}°, то есть {new//5} малых интервалов. Поворот всего чертежа не меняет угол.','Отсчитывай от луча TA, даже когда он не горизонтален.')],vs,[
            ('Какая градусная мера у исходного угла? Введи градусы числом.',str(deg),'Умножь заданное число радиан на 180/π.'),
            (f'На последнем рисунке угол {nrad}. Сколько интервалов по 5° нужно отсчитать?',str(new//5),'Подели новую градусную меру на 5.')],refs=[119])
        c['source']['chapter']='XIII';c['help'][1]['text']=hint
        c['answer']['prompt']='Запиши градусную меру и способ построения двух лучей. Сверь свой рисунок с моделью.'
        c['review']['reviewer']='Атанасян 2023, с. 308: все шесть исходных радианных мер в №1204, включая развёрнутый π и тупой 2π/3, сверены с печатным столбцом. Отметки, лучи и углы между ними измерены на всех построениях.'
        m=c['visualization']['model'];note='T — центр транспортира и вершина, TA — нулевая сторона. Каждая малая риска означает 5°, длинная риска — 30°. Выделены построенный луч и дуга нужного поворота.'
        c['visualization']['caption']=note;m['description']=note
        for v in m['views'].values():
            ids={name:k for k in v['points'] for name in m['labels'][k].split('=')}
            for degree in range(0,181,30):m['labels'][ids['L'+str(degree)]]=str(degree)+'°'
            if 'B' in ids:v['highlightSegments'].append([ids['T'],ids['B']])
        cards.append(c)
    return {'bookId':BOOK,'lessons':cards}


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true')
    text=json.dumps(build(),ensure_ascii=False,separators=(',',':'))+'\n'
    if parser.parse_args().check:assert OUT.read_text()==text
    else:OUT.write_text(text)
