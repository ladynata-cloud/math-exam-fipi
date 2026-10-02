"""Build the edition-specific course manifest without shipping the source scan."""
import json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from chapter01 import P
R=Path(__file__).resolve().parents[2]; D=R/'geometry-classic'
new=json.loads((R/'geometry-course/data/course.json').read_text())
# Old numbered points map to the existing substantive topic lessons, not to exercise solutions.
rows='''1-2|1|Точки, прямые, отрезки. Провешивание прямой|segments
3-4|1|Луч и угол|angles
5-6|1|Равенство фигур. Сравнение отрезков и углов|equality
7-8|1|Длина, единицы и измерительные инструменты|length
9-10|1|Градусная мера и измерение углов|measure-angle
11-13|1|Смежные, вертикальные углы. Перпендикулярные прямые|perpendicular
14-15|2|Треугольник. Первый признак равенства|triangle-sas
16-18|2|Перпендикуляр, медиана, биссектриса, высота. Равнобедренный треугольник|cevians
19-20|2|Второй и третий признаки равенства|triangle-signs
21-23|2|Окружность. Построения циркулем и линейкой|compass
24-28|3|Параллельные прямые: признаки и аксиома|parallels
29-30|3|Углы при параллельных прямых|parallel-angles
31-34|4|Сумма углов. Стороны и углы. Неравенство треугольника|triangle-angles
35-36|4|Свойства и равенство прямоугольных треугольников|right-triangle
37|4|Уголковый отражатель|reflector
38-39|4|Расстояния и построение треугольника по трём элементам|distance
40-42|5|Многоугольники и четырёхугольники|polygons
43-44|5|Параллелограмм и его признаки|parallelogram
45|5|Трапеция|trapezoid
46|5|Прямоугольник|rectangle
47|5|Ромб и квадрат|rhombus
48|5|Осевая и центральная симметрии|central
49-51|6|Площадь многоугольника, квадрата и прямоугольника|area-basics
52|6|Площадь параллелограмма|area-parallelogram
53|6|Площадь треугольника|area-triangle
54|6|Площадь трапеции|area-trapezoid
55-56|6|Теорема Пифагора и обратная теорема|pythagoras
57|6|Формула Герона|heron
58-60|7|Подобие. Отношение площадей|similarity
61-63|7|Признаки подобия|similarity-signs
64|7|Средняя линия треугольника|midline
65|7|Пропорциональные отрезки в прямоугольном треугольнике|projections
66-67|7|Практические применения подобия|similarity-measure
68-69|7|Синус, косинус, тангенс острого угла. Углы 30°, 45°, 60°|trig-right
70-71|8|Прямая и окружность. Касательная|chords-tangent
72-73|8|Градусная мера дуги. Вписанный угол|inscribed
74|8|Свойства биссектрисы угла|angle-locus
75|8|Свойства серединного перпендикуляра|perp-locus
76|8|Пересечение высот треугольника|centers
77-78|8|Вписанная и описанная окружности|triangle-circles
79-81|9|Понятие, равенство и откладывание вектора|vectors
82-85|9|Сложение и вычитание векторов|vector-add
86-87|9|Умножение вектора на число. Решение задач|vector-scale
88|9|Средняя линия трапеции|trapezoid
89-90|10|Разложение вектора и его координаты|vector-basis
91-92|10|Координаты концов вектора. Простейшие задачи|coordinates
93-95|10|Уравнения линии, окружности и прямой|line-circle-equations
96|10|Взаимное расположение окружностей|circle-position
97-99|11|Тригонометрия, тождество и координаты точки|trig-circle
100|11|Площадь треугольника через синус|area-sine
101|11|Теорема синусов|sine-rule
102|11|Теорема косинусов|cosine-rule
103-104|11|Решение треугольников и измерительные работы|solve-triangle
105-108|11|Скалярное произведение и его свойства|dot-product
109-113|12|Правильные многоугольники: окружности, формулы, построения|regular-polygons
114-116|12|Длина окружности, площадь круга и сектора|circle-metric
117-119|13|Отображение, движение, наложение|movement
120-121|13|Параллельный перенос и поворот|translation-rotation
122|14|Предмет стереометрии|stereo:space
123|14|Многогранник|stereo:polyhedra
124|14|Призма|stereo:prism
125|14|Параллелепипед|stereo:box
126|14|Объём тела|stereo:box-volume
127|14|Свойства прямоугольного параллелепипеда|stereo:box
128|14|Пирамида|stereo:pyramid
129|14|Цилиндр|stereo:cylinder
130|14|Конус|stereo:cone
131|14|Сфера и шар|stereo:sphere'''
chapters=['Начальные геометрические сведения','Треугольники','Параллельные прямые','Соотношения между сторонами и углами треугольника','Четырёхугольники','Площадь','Подобные треугольники','Окружность','Векторы','Метод координат','Соотношения в треугольнике. Скалярное произведение','Длина окружности и площадь круга','Движения','Начальные сведения из стереометрии']
units=[]
for row in rows.splitlines():
 pts,ch,title,target=row.split('|'); a,b=map(int,(pts+'-'+pts).split('-')[:2]); points=list(range(a,b+1));ch=int(ch)
 if target=='reflector': href='reflector.html';status='lesson'
 elif target.startswith('stereo:'):href='../stereo-course/atlas/'+target.split(':')[1]+'.html';status='shared'
 else:href='../geometry-course/atlas/'+target+'.html';status='shared'
 units.append(dict(points=points,chapter=ch,grade=7 if ch<=4 else 8 if ch<=9 else 9,title=title,href=href,status=status))
assert sorted(n for u in units for n in u['points'])==list(range(1,132))
for p in P:
 p['topic']=next(u['href'] for u in units if u['chapter']==1 and (p['number']<=7 and 1 in u['points'] or 8<=p['number']<=17 and 3 in u['points'] or 18<=p['number']<=23 and 5 in u['points'] or 24<=p['number']<=40 and 7 in u['points'] or 41<=p['number']<=53 and 9 in u['points'] or p['number']>=54 and 11 in u['points']))
 if 71<=p['number']<=79 and p['number']!=73: p['topic']='../geometry-course/atlas/length.html'
 p['kind']='practical' if p.get('practical') else 'proof' if any(s['type']=='written' for s in p['steps']) else 'exercise'
manifest=dict(edition='Атанасян и др. · Геометрия 7–9 · 2-е издание · 2014',year=2014,printedPages=383,pdfPages=390,totalNumberedExercises=1310,numberedSolutions=len(P),chapters=chapters,units=units,problems=P)
(D/'data/course.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(D/'data/course.js').write_text('window.ClassicCourse='+json.dumps(manifest,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+';\n')
print('CLASSIC_BUILD',len(units),'topic units;',len(P),'individual numbered walkthroughs;',sum(len(p['steps']) for p in P),'steps')
