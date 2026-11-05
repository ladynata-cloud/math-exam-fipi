#!/usr/bin/env python3
"""Deterministic mathematical illustrations, not recordings of trainer sessions.
Requires Pillow 13, DejaVu Sans fonts; run from any working directory.
"""
from pathlib import Path
import json, math
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/trainer-previews'
OUT.mkdir(parents=True,exist_ok=True)
W,H,S=640,500,2
BG='#f6f5ef'; INK='#183f36'; GREEN='#267c64'; SOFT='#e3f1e9'; PINK='#d53e73'; GRID='#dce6e5'; MUTED='#526d65'; WHITE='#ffffff'
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
items=[]
def item(id,title,tag,kind,steps,url,page,alt):
 items.append(dict(id=id,title=title,tag=tag,kind=kind,steps=steps,url=url,page=page,alt=alt))
item('01-percent','15% от 200 — сколько?','ПРОЦЕНТЫ','percent',['100% — это 200','10% — это 20','5% — это 10','15% = 10% + 5%','20 + 10 = 30'],'/trainers/oge-1-5-trainers/percent-table-trainer.html','oge/variants/2027/index.html','15 процентов от 200: 10 процентов — 20, 5 процентов — 10, вместе 30.')
item('02-parabola','Как сдвигается парабола?','ОГЭ · ГРАФИКИ','parabola',['y = x² − 2: вершина (0; −2)','y = x² − 1: на 1 выше','y = x²: вершина в начале осей','y = x² + 1: на 1 выше','y = x² + 2: вершина (0; 2)'],'/trainers/oge-task11-graphs-trainer.html','oge/index.html','При увеличении c от −2 до 2 парабола y = x² + c перемещается вверх. Форма остаётся прежней.')
item('03-pythagoras','Найдём гипотенузу','ГЕОМЕТРИЯ','triangle',['Катеты: 3 и 4','c² = 3² + 4²','c² = 9 + 16','c² = 25','c = 5'],'/trainers/oge-task15-triangles.html','oge/variants/2027/index.html','Прямоугольный треугольник с катетами 3 и 4. По теореме Пифагора гипотенуза равна 5.')
item('04-rounding','Округляем до десятых','ВЫЧИСЛЕНИЯ','rounding',['Число: 3,746','Сохраняем десятые: 3,7','Смотрим на сотые: 4','4 < 5: десятую не меняем','3,746 ≈ 3,7'],'/trainers/rounding-stepwise.html','trainers/index.html','Округление 3,746 до десятых: цифра сотых 4 меньше 5, получается 3,7.')
item('05-multiply','Умножаем столбиком','ВЫЧИСЛЕНИЯ','multiply',['23 × 14','23 × 4 = 92','23 × 10 = 230','92 + 230 = 322','23 × 14 = 322'],'/trainers/trainers/long-multiplication.html','trainers/index.html','Умножение 23 на 14: частичные произведения 92 и 230, сумма 322.')
item('06-fractions','Складываем дроби','ДРОБИ','fraction',['1/2 + 1/4','Делим целое на 4 части','1/2 = 2/4','2/4 + 1/4','Получаем 3/4'],'/trainers/oge-basics/fraction-common-denominator.html','trainers/index.html','Половина равна двум четвертям. Две четверти и одна четверть составляют три четверти.')
item('07-gcd','Общая часть разложений','НОД · 6 КЛАСС','gcd',['12 = 2 × 2 × 3','18 = 2 × 3 × 3','Общие множители: 2 и 3','Перемножим: 2 × 3','НОД(12; 18) = 6'],'/trainers/grade6-nod.html','trainers/index.html','Разложение 12 и 18 на простые множители. Общие множители 2 и 3 дают НОД 6.')
item('08-lcm','Первое общее число','НОК · 6 КЛАСС','lcm',['Считаем четвёрками','4, 8, 12, 16, …','Считаем шестёрками','6, 12, 18, …','НОК(4; 6) = 12'],'/trainers/grade6-nok.html','trainers/index.html','Первые положительные числа, кратные 4 и 6. Наименьшее общее кратное равно 12.')
item('09-tires','Что означает 195/65?','ОГЭ · ШИНЫ','tire',['195 — ширина шины, мм','65 — высота в % от ширины','h = 195 × 65/100','h = 195 × 0,65','Высота боковины: 126,75 мм'],'/trainers/oge-1-5-trainers/practice-1-5-tires.html','oge/index.html','В маркировке шины 195/65 R15 высота боковины составляет 65 процентов от ширины 195 мм: 126,75 мм.')
item('10-plan','Площадь по клеткам','ОГЭ · ПЛАН КВАРТИРЫ','plan',['Сторона клетки — 0,5 м','Комната: 6 на 4 клетки','Длина: 6 × 0,5 = 3 м','Ширина: 4 × 0,5 = 2 м','Площадь: 3 × 2 = 6 м²'],'/trainers/oge-1-5-trainers/practice-1-5-apartments.html','oge/index.html','Прямоугольная комната 6 на 4 клетки. Сторона клетки 0,5 метра. Размеры комнаты 3 на 2 метра, площадь 6 квадратных метров.')
item('11-probability','Какова вероятность?','ОГЭ · ВЕРОЯТНОСТЬ','probability',['В мешке 3 зелёных шара','И ещё 7 белых шаров','Выбираем один шар наугад','P = 3/10','P = 0,3'],'/trainers/oge-task10-probability.html','oge/index.html','В мешке 10 одинаковых на ощупь шаров: 3 зелёных и 7 белых. При случайном выборе вероятность зелёного равна 0,3.')
item('12-equation','Решаем и проверяем','ОГЭ · УРАВНЕНИЯ','equation',['3x + 5 = 20','Вычтем 5 из обеих частей','3x = 15','Разделим обе части на 3','x = 5; 3 × 5 + 5 = 20'],'/trainers/oge-task9-equations.html','oge/index.html','Уравнение 3x + 5 = 20. Вычитаем 5, делим на 3, получаем x = 5. Проверка даёт 20.')
item('13-inequality','Знак меняет направление','ОГЭ · НЕРАВЕНСТВА','inequality',['−2x < 6','Делим на отрицательное −2','Знак < меняется на >','x > −3','Точка −3 не входит в ответ'],'/trainers/oge-task13-inequalities.html','oge/index.html','Неравенство −2x < 6: при делении на −2 знак меняется. Ответ x > −3; на прямой открытая точка −3 и луч вправо.')
item('14-progression','Каждый раз прибавляем 3','ОГЭ · ПРОГРЕССИИ','progression',['2, 5, 8, 11, …','Первый член: a₁ = 2','Разность: d = 3','a₅ = 2 + 4 × 3','Пятый член: a₅ = 14'],'/trainers/oge-task14-progressions.html','trainers/index.html','Арифметическая прогрессия 2, 5, 8, 11, 14. Разность 3, пятый член равен 14.')
item('15-division','Делим по разрядам','ДЕЛЕНИЕ УГОЛКОМ','division',['48 : 2','4 десятка : 2 = 2 десятка','В частном записываем 2','8 единиц : 2 = 4 единицы','48 : 2 = 24'],'/trainers/long-division-stepwise.html#start','lessons/index.html','Деление 48 на 2: четыре десятка делим на два, затем восемь единиц делим на два. Частное 24.')
item('16-line','Формула и её график','ОГЭ · ГРАФИКИ','line',['y = 2x + 1','При x = 0 получаем y = 1','Первая точка: (0; 1)','При x = 1 получаем y = 3','Соединим точки прямой'],'/trainers/oge-task11-graphs-trainer.html','lessons/index.html','Построение прямой y = 2x + 1 по точкам (0; 1) и (1; 3).')
item('17-triangle','От квадратов к длине','ЕГЭ · ГЕОМЕТРИЯ','triangle9',['Катеты: 9 и 12','c² = 9² + 12²','c² = 81 + 144','c² = 225','c = 15'],'/ege-profil/start/index.html#practice/geo-right/guided','lessons/index.html','Прямоугольный треугольник с катетами 9 и 12. Квадрат гипотенузы 225, длина гипотенузы 15.')
item('18-cone','Треугольник внутри конуса','СТЕРЕОМЕТРИЯ','cone',['Прямой круговой конус','Радиус r = 8; высота h = 15','l² = r² + h²','l² = 64 + 225 = 289','Образующая l = 17'],'/stereo-course/textbook/#ex-main-0346','lessons/index.html','В прямом круговом конусе радиус 8, высота 15. Радиус, высота и образующая образуют прямоугольный треугольник; образующая 17.')
item('19-bisector','Построим биссектрису','ЦИРКУЛЬ И ЛИНЕЙКА','bisector',['Дан угол с вершиной O','Дуга из O даёт точки A и B','Из A проведём вторую дугу','Из B — дугу тем же раствором','Луч OC делит угол пополам'],'/trainers/bisector-trainer-v2.html','trainers/index.html','Построение биссектрисы: дуга из O пересекает стороны угла в A и B. Дуги одинакового радиуса из A и B пересекаются в C. Луч OC — биссектриса; треугольники AOC и BOC равны по трём сторонам.')
item('20-circle','Одна дуга — два угла','ОГЭ · ОКРУЖНОСТЬ','circle',['Дуга AB составляет 90°','Центральный угол AOB = 90°','Точка P на другой дуге','Вписанный угол APB — половина','∠APB = 90° : 2 = 45°'],'/trainers/oge-task16-circle.html','trainers/index.html','Центральный угол AOB равен 90 градусам. Вписанный угол APB, опирающийся на ту же дугу AB, равен 45 градусам; точка P на другой дуге.')

def font(n,b=False): return ImageFont.truetype(BOLD if b else FONT,round(n*S))
def render(it,stage,phase=1):
 im=Image.new('RGB',(W*S,H*S),BG);d=ImageDraw.Draw(im)
 def box(xy,fill,outline=None,r=12,width=1): d.rounded_rectangle(tuple(round(v*S) for v in xy),r*S,fill,outline,width*S)
 def line(pts,fill=INK,width=3):d.line([(round(x*S),round(y*S)) for x,y in pts],fill,width*S,joint='curve')
 def txt(x,y,t,n=24,c=INK,b=False,anchor=None):d.text((x*S,y*S),t,font=font(n,b),fill=c,anchor=anchor)
 def circle(x,y,r=6,fill=PINK,outline=None):d.ellipse(((x-r)*S,(y-r)*S,(x+r)*S,(y+r)*S),fill,outline,2*S)
 def arrow(x1,y1,x2,y2,c=GREEN):
  line([(x1,y1),(x2,y2)],c);a=math.atan2(y2-y1,x2-x1)
  line([(x2-10*math.cos(a-.5),y2-10*math.sin(a-.5)),(x2,y2),(x2-10*math.cos(a+.5),y2-10*math.sin(a+.5))],c)
 txt(26,18,it['tag'],13,MUTED,True)
 txt(26,44,it['title'],27,INK,True)
 box((24,94,616,350),WHITE,GRID,16)
 k=it['kind']
 if k in ('parabola','line'):
  ox,oy,sc=(320,260,34) if k=='parabola' else (260,280,40)
  def p(x,y):return ox+x*sc,oy-y*sc
  for j in range(-6,8):
   x=ox+j*sc;y=oy+j*sc
   if 75<x<565:line([(x,110),(x,333)],GRID,1)
   if 110<y<333:line([(75,y),(565,y)],GRID,1)
  arrow(75,oy,570,oy,MUTED);arrow(ox,333,ox,106,MUTED)
  txt(576,oy-13,'x',15,MUTED);txt(ox+10,103,'y',15,MUTED)
  pts=[]
  for j in range(401):
   x=-6+j/40;y=(x*x+stage-2-(1-phase if stage else 0)) if k=='parabola' else 2*x+1
   px,py=p(x,y)
   if 78<px<560 and 113<py<330:pts.append((px,py))
  if pts:line(pts[:max(2,int(len(pts)*(phase if k=='line' and stage==4 else 1)))],PINK,3)
  txt(95,114,'y = x² + c' if k=='parabola' else 'y = 2x + 1',19)
  if k=='parabola':
   x,y=p(0,stage-2-(1-phase if stage else 0));circle(x,y);txt(450,300,'c = '+str(stage-2),20,PINK,True)
  elif stage>=2:
   x,y=p(0,1);circle(x,y);txt(x+13,y+6,'(0; 1)',18,PINK,True)
  if k=='line' and stage>=3:
   x,y=p(1,3);circle(x,y);txt(x+13,y-20,'(1; 3)',18,PINK,True)
 elif k in ('triangle','triangle9','cone'):
  if k=='cone':
   theta=(stage+phase)*math.pi/7
   bx,by=320+112*math.cos(theta),285+32*math.sin(theta)
   d.ellipse((208*S,253*S,432*S,317*S),fill=SOFT,outline=GREEN,width=2*S)
   line([(208,285),(320,120),(432,285)],GREEN)
   A,B,C=(320,285),(bx,by),(320,120)
   line([C,A,B,C],PINK,3)
   txt(274,193,'15',24,PINK,True);txt((320+bx)/2,(285+by)/2+8,'8',22,PINK,True)
   txt((320+bx)/2+12,(120+by)/2,'l',25)

  else:
   A,B,C=(182,314),(422,314),(182,134)
   line([A,B,C,A],GREEN,4);line([(182,296),(200,296),(200,314)],INK,2)
   txt(142,207,'9' if k=='triangle9' else '3',25);txt(300,318,'12' if k=='triangle9' else '4',25)
   txt(323,197,'c',28,PINK,True)
  if stage>=4:txt(480,264,'15' if k=='triangle9' else '17' if k=='cone' else '5',36,PINK,True)
 elif k in ('percent','discount','fraction'):
  n=20 if k=='percent' else 10 if k=='discount' else 4
  active=3 if k=='percent' else 2 if k=='discount' else (2 if stage<3 else 3)
  txt(320,123,'200' if k=='percent' else '1 000 ₽' if k=='discount' else 'Одно целое',29,anchor='mt',b=True)
  for i in range(n):
   x=70+i*500/n
   fill= PINK if i<active and stage>=1 else SOFT
   box((x,187,x+500/n-3,261),fill,r=3)
  txt(320,288,'15%' if k=='percent' else '20%' if k=='discount' else ('2/4' if stage<3 else '3/4'),32,PINK,True,anchor='mt')
 elif k=='rounding':
  nums=['3',',','7','4','6']
  for j,n in enumerate(nums):
   x=181+j*56
   if (stage==1 and j==2) or (stage>=2 and j==3):box((x-8,154,x+44,225),SOFT,r=8)
   txt(x,155,n,45,PINK if j==3 and stage>=2 else INK,True)
  txt(320,262,'десятые ← сотые',23,MUTED,anchor='mt')
 elif k=='multiply':
  txt(374,108,'23',30,anchor='rt');txt(284,147,'×',24);txt(374,147,'14',30,anchor='rt');line([(268,189),(394,189)],INK,2)
  if stage>=1:txt(374,195,'92',28,anchor='rt')
  if stage>=2:txt(374,235,'230',28,anchor='rt')
  if stage>=3:line([(258,275),(394,275)],INK,2);txt(374,283,'322',31,PINK,True,anchor='rt')
 elif k in ('gcd','lcm'):
  txt(81,143,'12 = ' if k=='gcd' else '4:',26,b=True);txt(81,231,'18 = ' if k=='gcd' else '6:',26,b=True)
  arr1=['2','2','3'] if k=='gcd' else ['4','8','12','16']
  arr2=['2','3','3'] if k=='gcd' else ['6','12','18','24']
  for row,arr in enumerate((arr1,arr2)):
   for j,n in enumerate(arr):
    x=224+j*78;y=156+row*88
    highlight=stage>=3 and ((k=='gcd' and j in ((0,2) if row==0 else (0,1))) or (k=='lcm' and n=='12'))
    box((x-22,y-19,x+32,y+28),SOFT if highlight else BG,r=9);txt(x+5,y,n,24,PINK if highlight else INK,True,anchor='mm')
    if k=='gcd' and j<2:txt(x+47,y,'×',20,MUTED,anchor='mm')
 elif k=='tire':
  circle(270,224,103,INK);circle(270,224,65,'#dde7e4');circle(270,224,43,WHITE,GRID)
  txt(416,133,'195/65',25,b=True);txt(416,172,'R15',23)
  if stage>=1:
   arrow(350,224,372,224,PINK);arrow(351,224,335,224,PINK);txt(410,231,'h = 65%',22,PINK,True);txt(410,262,'от 195 мм',18)
 elif k=='plan':
  for r in range(4):
   for c in range(6):box((179+c*47,137+r*45,226+c*47,182+r*45),SOFT,GREEN,0)
  txt(320,104,'6 клеток → 3 м' if stage>=2 else '6 клеток',20,anchor='mt')
  txt(91,208,'2 м' if stage>=3 else '4 кл.',20)
  if stage>=4:box((246,198,393,250),WHITE,r=8);txt(320,222,'6 м²',30,GREEN,True,anchor='mm')
 elif k=='probability':
  txt(320,113,'Один шар наугад',23,anchor='mt')
  for i in range(10):circle(168+(i%5)*76,190+(i//5)*78,25,GREEN if i<3 else BG,GREEN)
  if stage>=3:txt(548,232,'3/10',18,PINK,True,anchor='mm')
 elif k=='equation':
  expr=['3x + 5 = 20','3x + 5 − 5 = 20 − 5','3x = 15','x = 15 : 3','x = 5'][stage]
  txt(320,180,expr,34,INK,True,anchor='mt');txt(320,260,'Одинаковое действие с двух сторон',19,MUTED,anchor='mt')
 elif k=='inequality':
  txt(320,126,'−2x < 6' if stage<3 else 'x > −3',36,INK,True,anchor='mt')
  arrow(100,265,554,265,MUTED)
  for x,n in [(180,'−3'),(375,'0')]:line([(x,260),(x,270)],MUTED,2);txt(x,282,n,21,anchor='mt')
  if stage>=3:arrow(181,265,546,265,PINK);circle(180,265,8,WHITE,PINK)
 elif k=='progression':
  vals=['2','5','8','11','14']
  for j,v in enumerate(vals):
   x=108+j*104
   if j<4 or stage>=4:circle(x,228,30,SOFT);txt(x,228,v,29,PINK if j==4 else INK,True,anchor='mm')
   if j<4:arrow(x+32,180,x+71,180,GREEN);txt(x+52,143,'+3',18,GREEN,anchor='mt')
 elif k=='division':
  txt(260,119,'48',39,b=True);line([(341,113),(341,198),(423,198)],INK,2);txt(366,119,'2',39)
  if stage>=1:txt(260,176,'4',37);line([(257,218),(316,218)],INK,2);txt(366,207,'2' if stage<3 else '24',35,GREEN,True)
  if stage>=3:txt(286,220,'8',34);txt(286,261,'8',34);line([(277,300),(317,300)],INK,2);txt(286,303,'0',27)
 elif k=='bisector':
  O=(190,223);A=(190+60*math.sqrt(3),163);B=(190+60*math.sqrt(3),283);C=(190+60*math.sqrt(3)+80,223)
  line([(363,123),O,(363,323)],GREEN,3);circle(*O,4,INK);txt(165,212,'O',20)
  def arc(center,r,start,end,color):
   d.arc(((center[0]-r)*S,(center[1]-r)*S,(center[0]+r)*S,(center[1]+r)*S),start,end,fill=color,width=3*S)
  if stage>=1:
   arc(O,120,-38,-38+76*(phase if stage==1 else 1),PINK);circle(*A,4);circle(*B,4);txt(A[0]-5,A[1]-28,'A',18);txt(B[0]-5,B[1]+7,'B',18)
  if stage>=2:arc(A,100,16,16+52*(phase if stage==2 else 1),GREEN)
  if stage>=3:arc(B,100,-68,-68+52*(phase if stage==3 else 1),GREEN);circle(*C,4);txt(C[0]+10,C[1]-24,'C',18)
  if stage>=4:arrow(*O,O[0]+255*phase,O[1],PINK);txt(454,185,'30°',20,PINK);txt(454,241,'30°',20,PINK)
 elif k=='circle':
  O=(320,225);A=(410,225);B=(320,135);P=(230,225)
  circle(*O,90,WHITE,GREEN)
  d.arc((230*S,135*S,410*S,315*S),270,360,fill=PINK,width=5*S)
  for pt,label,dx,dy in [(A,'A',12,-10),(B,'B',-7,-29),(O,'O',5,8)]:circle(*pt,4,INK);txt(pt[0]+dx,pt[1]+dy,label,19)
  if stage>=1:line([A,O,B],GREEN,3);line([(320,210),(335,210),(335,225)],GREEN,2);txt(346,173,'90°',20,GREEN)
  if stage>=2:circle(*P,4,PINK);txt(205,225,'P',19);line([A,P,B],PINK,3)
  if stage>=3:
   d.arc((205*S,200*S,255*S,250*S),315,360,fill=PINK,width=2*S)
  if stage>=4:txt(265,195,'45°',18,PINK,True)
 elif k=='proportion':
  for j in range(5 if stage>=3 else 3):
   x=102+j*88
   box((x,151,x+62,239),SOFT,GREEN,5);line([(x+12,157),(x+12,232)],PINK,1)
   for z in range(3):line([(x+20,172+z*18),(x+52,172+z*18)],GRID,2)
  txt(320,273,'150 ₽' if stage>=3 else '90 ₽',33,PINK,True,anchor='mt')
 box((24,365,616,450),SOFT,r=13)
 txt(44,376,f'ШАГ {stage+1} ИЗ 5',12,MUTED,True)
 text=it['steps'][stage];size=26
 while d.textbbox((0,0),text,font=font(size,True))[2]>548*S:size-=1
 txt(44,401,text,size,INK,True)
 txt(26,471,'mathexam.space',13,INK,True)
 txt(275,471,'Короткий пример по теме',12,MUTED)
 for j in range(5):box((514+j*19,475,526+j*19,479),GREEN if j<=stage else GRID,r=2)
 return im.resize((W,H),Image.Resampling.LANCZOS)

for it in items:
 frames=[];dur=[]
 for stage in range(5):
  # Four short reveal frames followed by a readable hold.
  for n in range(1,9):frames.append(render(it,stage,n/8));dur.append(80 if n<8 else (1500 if stage<4 else 2200))
 palette=render(it,4).quantize(colors=96,method=Image.Quantize.MEDIANCUT)
 frames=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
 frames[0].save(OUT/(it['id']+'.gif'),save_all=True,append_images=frames[1:],duration=dur,loop=0,optimize=True,disposal=1)
 render(it,4).save(OUT/(it['id']+'.png'),optimize=True)
 it['width']=W;it['height']=H;it['bytes']=(OUT/(it['id']+'.gif')).stat().st_size
 it['duration_ms']=sum(dur)
 print(it['id'],it['bytes'],flush=True)
(OUT/'manifest.json').write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n')
