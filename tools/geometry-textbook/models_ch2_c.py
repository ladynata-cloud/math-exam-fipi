#!/usr/bin/env python3
"""Source-authored chapter II exercises 158–190 (2023 edition), with exact planar scenes.
The source scans were visually checked; this is author preparation, not independent review.
"""
from copy import deepcopy
import json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'geometry-course/textbook'
EX={}; MODELS=[]
def sc(points=(),segments=(),**kw):
 return dict(label=kw.pop('label','Условие'),points=list(points),segments=[list(p) for p in segments],**kw)
def eq(a,b,marks=1): return dict(a=a,b=b,marks=marks)
def arc(o,a,b,radius=7,marks=0): return dict(vertex=o,**{'from':a,'to':b},radius=radius,marks=marks)
def ck(kind,**kw):return dict(type=kind,**kw)
def right(a,o,b): return dict(a=a,vertex=o,b=b)
def circle(o,p):return dict(center=o,through=p)
def lerp(a,b,t):return [a[i]+t*(b[i]-a[i]) for i in range(2)]
def dist(a,b):return math.dist(a,b)
def polar(o,d,r):return [o[0]+r*math.cos(math.radians(d)),o[1]+r*math.sin(math.radians(d))]
def triangles(*names):return [list(pair) for s in names for pair in zip(s,s[1:]+s[:1])]
def translated(p,suffix='1',dx=0,dy=0):return {k+suffix:[v[0]+dx,v[1]+dy] for k,v in p.items()}
def add(n,part,condition,answer,steps,points,neutral,views=None,checks=(),cases=(),pages=None,labels=None,offsets=None,bounds=None,givens=()):
 # A step tuple is (learner prompt, worked explanation, named reason, theory references).
 pages=pages or ([48,49] if n==158 else [49] if n<161 else [50] if n<169 else [51] if n<178 else [52])
 e=EX.setdefault(n,dict(number=n,printedPages=pages,pdfPages=[p+1 for p in pages],parts=[],notes=[]))
 e['parts'].append(dict(part=part,conditionSummary=condition,answer=answer,steps=[s[1] for s in steps],sourceVerified=True,mathVerified=True,
  visual=dict(initial='Отдельный чертёж условия; вычисления и доказательство вынесены за пределы фигуры.',stepChanges=['Дополнительные отрезки и отметки раскрываются на соответствующем шаге.'],cases=[v.get('label','Случай') for v in cases])))
 vv={'neutral':deepcopy(neutral)}
 views=views or [neutral]*len(steps)
 assert len(views)==len(steps),(n,part,len(views),len(steps))
 for i,v in enumerate(views,1):vv[f'step-{i}']={**deepcopy(v),'label':f'Шаг {i}'}
 for i,v in enumerate(cases,1):vv[f'case-{i}']=deepcopy(v)
 model=dict(points={k:[round(float(v[0]),9),round(float(v[1]),9),0] for k,v in points.items()},edges=[],planar=True,bounds=bounds or [0,0,100,70],views=vv,checks=list(checks),description=f'Задача {n}'+(f' ({part})' if part!='single' else '')+': отдельная модель. Вспомогательные построения и выводы показываются по шагам.')
 default_labels={k:k[:-1]+'₁' for k in points if k.endswith('1') and not k.startswith('_')}
 if default_labels or labels:model['labels']={**default_labels,**(labels or {})}
 if offsets:model['labelOffsets']=offsets
 # Fix desktop viewport cropping without reducing mobile label pixels: a
 # similarity maps the reviewed wide framing to a 100-unit-wide viewBox.
 if (n,part) in {(159,'в'),(178,'single'),(179,'single'),(181,'single'),(186,'single')}:
  xmin,ymin,xmax,ymax=model['bounds'];scale=100/(xmax-xmin)
  model['points']={name:[round((point[0]-xmin)*scale,9),round((point[1]-ymin)*scale,9),0] for name,point in model['points'].items()}
  model['bounds']=[0,0,100,round((ymax-ymin)*scale,9)]
  for view in model['views'].values():
   for a in view.get('angleArcs',[]):a['radius']=round(a.get('radius',8)*scale,9)
   for r in view.get('rightAngles',[]):
    if 'size' in r:r['size']=round(r['size']*scale,9)
  if 'labelOffsets' in model:model['labelOffsets']={key:[round(value[0]*scale,9),round(value[1]*scale,9)] for key,value in model['labelOffsets'].items()}
 item=dict(chapter=2,collection='main',number=n,part=part,model=model,didactics=dict(steps=[dict(prompt=s[0],justification=s[2],theoryPoints=s[3]) for s in steps]))
 if givens:item['statementGivens']=list(givens)
 MODELS.append(item)

# 158. The two auxiliary circles are shown separately from the final proof.
p={'M':[50,49],'A':[30,32],'B':[70,32],'N':[50,15],'C':[50,32],'_l':[10,32],'_r':[90,32]}
v=sc(['M'],lines=[['_l','_r']]);c1=sc(['M','A','B'],lines=[['_l','_r']],circles=[circle('M','A')]);c2=sc(['M','A','B','N'],lines=[['_l','_r']],circles=[circle('A','M'),circle('B','M')]);joined=sc(['M','A','B','N','C'],triangles('AMN','BMN'),lines=[['_l','_r'],['M','N']]);final=sc(['M','A','B','C'],[['M','A'],['M','B']],lines=[['_l','_r'],['M','N']],rightAngles=[right('M','C','B')])
add(158,'single','Даны прямая a и точка M вне неё. Циркулем и линейкой проведите через M перпендикуляр к a.','Искомая прямая MN перпендикулярна a.',[
 ('Как получить на a две точки на одинаковом расстоянии от M?','Построим окружность с центром M и достаточно большим радиусом, чтобы она пересекла a в разных точках A и B. Тогда MA = MB.','Радиусы одной окружности',[21,22]),
 ('Как получить вторую точку будущего перпендикуляра?','Проведём окружности с центрами A и B через M. Их второе пересечение обозначим N; AN = AM и BN = BM. Проведём MN и обозначим C = MN ∩ a.','Построение окружностей циркулем',[21,23]),
 ('Почему MN делит угол AMB пополам?','Треугольники AMN и BMN равны по трём сторонам: AM = BM, AN = BN, MN — общая. Поэтому ∠AMN = ∠BMN.','Третий признак равенства треугольников',[20]),
 ('Почему получена именно перпендикулярная прямая?','В равнобедренном треугольнике AMB прямая MN содержит биссектрису из вершины M. Эта биссектриса является высотой, поэтому MN ⟂ AB, то есть MN ⟂ a.','Биссектриса равнобедренного треугольника',[18])],p,v,[c1,c2,joined,final],checks=[ck('equalLength',segments=[['M','A'],['M','B'],['N','A'],['N','B']]),ck('perpendicular',segments=[['M','N'],['A','B']])],bounds=[0,-3,100,80])

# 159. One construction per subpart, with the same scalene given triangle.
p0={'A':[35,55],'B':[15,15],'C':[85,15]};base=sc(p0,triangles('ABC'))
a,b,c=p0['A'],p0['B'],p0['C'];ab=dist(a,b);ac=dist(a,c);k=lerp(b,c,ab/(ab+ac));u=lerp(a,b,12/ab);v=lerp(a,c,12/ac);mid=lerp(u,v,.5);dx,dy=v[0]-u[0],v[1]-u[1];w=[mid[0]+dy*math.sqrt(3)/2,mid[1]-dx*math.sqrt(3)/2]
p={**p0,'K':k,'U':u,'V':v,'W':w}
cut=sc(['A','B','C','U','V'],triangles('ABC'),circles=[circle('A','U')]);construction=sc(['A','U','V','W'],[['A','U'],['A','V']],circles=[circle('U','V'),circle('V','U')],dashSegments=[['U','W'],['V','W']]);fin=sc(['A','B','C','K'],triangles('ABC')+[['A','K']],angleArcs=[arc('A','B','K',9,1),arc('A','K','C',12,1)])
add(159,'а','В треугольнике ABC постройте биссектрису AK циркулем и линейкой.','AK — биссектриса угла BAC, K ∈ BC.',[
 ('Какие равные отрезки отложим на сторонах угла?','Окружность с центром A пересекает AB и AC в U и V. Выбираем радиус меньше обеих сторон; AU = AV.','Равенство радиусов',[21]),
 ('Как построить луч, делящий угол пополам?','Окружности с центрами U и V одинакового радиуса UV пересекаются. Выберем их точку W внутри угла и проведём луч AW.','Построение биссектрисы',[23]),
 ('Почему AW — биссектриса?','В треугольниках AUW и AVW равны AU и AV, UW и VW, а AW общая. По третьему признаку они равны, значит ∠UAW = ∠WAV.','Третий признак',[20]),
 ('Как получить биссектрису именно треугольника?','Обозначим пересечение луча AW со стороной BC буквой K. Отрезок AK делит угол A пополам и заканчивается на противоположной стороне.','Определение биссектрисы треугольника',[17])],p,base,[cut,construction,construction,fin],checks=[ck('equalLength',segments=[['A','U'],['A','V']]),ck('equalLength',segments=[['U','W'],['V','W']]),ck('collinear',points=['A','W','K']),ck('collinear',points=['B','K','C'])])
p={**p0,'M':lerp(a,c,.5),'A2':[38,35],'C2':[62,35],'M2':[50,35],'U':[50,35+12*math.sqrt(3)],'V':[50,35-12*math.sqrt(3)]}
midconstruction=sc(['A2','C2','M2','U','V'],[['A2','C2']],lines=[['U','V']],circles=[circle('A2','C2'),circle('C2','A2')])
midview=sc(['A','B','C','M'],triangles('ABC'),equalSegments=[eq('A','M'),eq('M','C')]);fin=sc(['A','B','C','M'],triangles('ABC')+[['B','M']])
add(159,'б','В треугольнике ABC постройте медиану BM циркулем и линейкой.','BM — медиана, AM = MC.',[
 ('Как найти середину AC без измерительной шкалы?','Отдельный вид показывает построение на отрезке AC. Построим окружности с центрами A и C радиуса AC. Они пересекутся в U и V. Прямая UV — серединный перпендикуляр к AC.','Построение середины отрезка',[23]),
 ('Где расположена середина стороны?','Пересечение UV с AC обозначим M. Треугольники AUV и CUV равны по трём сторонам, поэтому UV делит угол равнобедренного AUC пополам и является его медианой. Следовательно AM = MC. Возвращаемся к виду исходного треугольника.','Третий признак и биссектриса равнобедренного треугольника',[20,18]),
 ('Какой отрезок является медианой?','Соединим B с M. Медиана соединяет вершину с серединой противоположной стороны, следовательно BM — искомый отрезок.','Определение медианы',[17])],p,base,[midconstruction,midview,fin],cases=[{**midconstruction,'label':'Построение середины AC отдельно','availableFromStep':1}],labels={'A2':'A','C2':'C','M2':'M'},checks=[ck('equalLength',segments=[['A','M'],['M','C']]),ck('collinear',points=['A','M','C']),ck('equalLength',segments=[['A2','C2'],['A2','U'],['A2','V'],['C2','U'],['C2','V']]),ck('perpendicular',segments=[['A2','C2'],['U','V']])])
a,b,c=p0['A'],p0['B'],p0['C'];d=[a[i]-b[i] for i in range(2)];t=sum((c[i]-b[i])*d[i] for i in range(2))/sum(x*x for x in d);h=[b[i]+t*d[i] for i in range(2)]
p={**p0,'H':h,'C2':[50,48],'U':[32,30],'V':[68,30],'N':[50,12],'H2':[50,30],'_l':[9,30],'_r':[91,30]}
line=sc(['A','B','C'],triangles('ABC'),lines=[['A','B']]);aux1=sc(['C2','U','V'],lines=[['_l','_r']],circles=[circle('C2','U')]);aux2=sc(['C2','U','V','N'],lines=[['_l','_r']],circles=[circle('U','C2'),circle('V','C2')],dashSegments=[['C2','N']]);fin=sc(['A','B','C','H'],triangles('ABC')+[['C','H']],lines=[['A','B']],rightAngles=[right('C','H','A')])
add(159,'в','В треугольнике ABC постройте высоту CH циркулем и линейкой.','CH ⟂ AB, H лежит на прямой AB.',[
 ('На какую прямую опускается высота из C?','Проведём прямую AB. Основание высоты может лежать как на стороне AB, так и на её продолжении.','Определение высоты',[17]),
 ('Как начать построение перпендикуляра?','На отдельном виде прямая AB расположена горизонтально. Проведём окружность с центром C, пересекающую эту прямую в двух точках U и V. Тогда CU = CV.','Равенство радиусов',[21,23]),
 ('Как получить вторую точку перпендикуляра?','Построим окружности с центрами U и V через C. Их второе пересечение обозначим N. Прямая CN перпендикулярна AB, как доказано в № 158: равные по трём сторонам треугольники UCN и VCN дают биссектрису-высоту равнобедренного UCV.','Построение № 158, третий признак и свойство равнобедренного треугольника',[20,18,23]),
 ('Как выделить искомую высоту?','Вернёмся к исходному треугольнику. Обозначим пересечение построенного перпендикуляра с AB буквой H. Отрезок CH — искомая высота.','Определение высоты',[17])],p,base,[line,aux1,aux2,fin],cases=[{**aux1,'label':'Первый этап перпендикуляра отдельно','availableFromStep':2},{**aux2,'label':'Второй этап перпендикуляра отдельно','availableFromStep':3}],labels={'C2':'C','H2':'H'},bounds=[-5,-5,105,80],checks=[ck('collinear',points=['A','B','H']),ck('perpendicular',segments=[['C','H'],['A','B']]),ck('equalLength',segments=[['C2','U'],['C2','V'],['N','U'],['N','V']]),ck('perpendicular',segments=[['C2','N'],['U','V']])])

# 160. Exact 90°, 45° and 22.5° rays; calculations remain in the text.
p={'O':[28,18],'A':[79,18],'B':[28,58],'P':polar([28,18],45,46),'Q':polar([28,18],22.5,48)}
r=sc(['O','A'],rays=[['O','A']]);rr=sc(['O','A','B'],rays=[['O','A'],['O','B']],rightAngles=[right('A','O','B')]);r45=sc(['O','A','B','P'],rays=[['O','A'],['O','B'],['O','P']],angleArcs=[arc('O','A','P',9,1),arc('O','P','B',12,1)]);r22=sc(['O','A','P','Q'],rays=[['O','A'],['O','P'],['O','Q']],angleArcs=[arc('O','A','Q',10,1),arc('O','Q','P',14,1)])
for part,ans,steps,views in [('а','45°',[
 ('Как получить прямой угол?','Проведём прямую через O и построим в O перпендикуляр к ней. Выберем лучи OA и OB: ∠AOB = 90°.','Построение перпендикулярных прямых',[23]),
 ('Как из прямого угла получить 45°?','Построим циркулем и линейкой биссектрису OP угла AOB. Она делит его на равные углы.','Построение биссектрисы',[23]),
 ('Чему равен построенный угол?','∠AOP = 90° : 2 = 45°. Построение выполнено без транспортира.','Определение биссектрисы',[6])],[rr,r45,r45]),('б','22°30′',[
 ('С какого угла начнём?','Построим прямой угол AOB, затем его биссектрису OP. Получим ∠AOP = 45°.','Построения перпендикуляра и биссектрисы',[23]),
 ('Как уменьшить угол ещё вдвое?','Построим биссектрису OQ угла AOP. Тогда ∠AOQ = 45° : 2.','Построение биссектрисы',[23]),
 ('Как записать половину градуса в минутах?','45° : 2 = 22,5° = 22°30′, поскольку 1° = 60′.','Градусная мера угла',[9])],[r45,r22,r22])]:
 add(160,part,f'Циркулем и линейкой постройте угол {ans}.',f'Построенный угол равен {ans}.',steps,p,r,views,checks=[ck('angle',points=['A','O','B'],degrees=90),ck('angle',points=['A','O','P'],degrees=45),ck('angle',points=['A','O','Q'],degrees=22.5)])

# 161–163. Geometric scale agrees with the calculated side lengths.
x=(4*4+6*6-5*5)/(2*6);y=math.sqrt(16-x*x)
p={'B':[20,16],'C':[80,16],'A':[20+10*x,16+10*y]};v=sc(p,triangles('ABC'))
add(161,'single','Периметр ABC равен 15 см; BC длиннее AB на 2 см, AC длиннее AB на 1 см. Найдите стороны.','AB = 4 см, AC = 5 см, BC = 6 см.',[
 ('Как выразить стороны через одну неизвестную?','Пусть AB = x см. Тогда BC = x + 2 см, AC = x + 1 см.','Зависимости из условия',[14]),
 ('Как использовать периметр?','Сумма трёх сторон равна 15: x + (x + 2) + (x + 1) = 15, то есть 3x + 3 = 15.','Определение периметра',[14]),
 ('Чему равны стороны?','Получаем x = 4. Поэтому AB = 4 см, BC = 6 см, AC = 5 см. Проверка: 4 + 6 + 5 = 15; 6 − 4 = 2; 5 − 4 = 1.','Решение уравнения и проверка условия',[14])],p,v,checks=[ck('distanceRatio',segments=[['A','B'],['B','C']],ratio=4/6),ck('distanceRatio',segments=[['A','C'],['B','C']],ratio=5/6)])
p={'B':[22,15],'C':[78,15],'A':[50,15+8*math.sqrt(25-12.25)]};v=sc(p,triangles('ABC'),equalSegments=[eq('A','B'),eq('A','C')])
add(162,'single','В равнобедренном треугольнике основание на 2 см длиннее боковой стороны и на 3 см короче суммы боковых сторон. Найдите стороны.','Боковые стороны по 5 см; основание 7 см.',[
 ('Как обозначить равные стороны?','Пусть каждая боковая сторона равна x см. Тогда основание равно x + 2 см.','Определение равнобедренного треугольника',[18]),
 ('Как выразить основание вторым способом?','Сумма боковых сторон равна 2x см, поэтому основание равно также 2x − 3 см. Значит x + 2 = 2x − 3.','Два выражения одной длины',[18]),
 ('Каков ответ и проверка?','x = 5, основание равно 7 см. Проверка: 7 − 5 = 2, 5 + 5 − 7 = 3.','Решение уравнения',[14])],p,v,checks=[ck('equalLength',segments=[['A','B'],['A','C']]),ck('distanceRatio',segments=[['B','C'],['A','B']],ratio=7/5)])
p={'B':[26,14],'C':[74,14],'A':[50,14+6*math.sqrt(36-16)]};p['M']=lerp(p['A'],p['C'],.5)
p.update({'B2':[26,9],'C2':[74,9],'A2':[50,9+6*math.sqrt(100-16)]});p['M2']=lerp(p['A2'],p['C2'],.5)
v=sc(['A','B','C','M'],triangles('ABC')+[['B','M']],equalSegments=[eq('A','M'),eq('M','C')]);small={**deepcopy(v),'label':'Боковая сторона 6 см','availableFromStep':3};large=sc(['A2','B2','C2','M2'],triangles(['A2','B2','C2'])+[['B2','M2']],equalSegments=[eq('A2','M2'),eq('M2','C2')],label='Боковая сторона 10 см',availableFromStep=3)
add(163,'single','Основание равнобедренного ABC равно 8 см. Медиана BM к боковой стороне AC образует два треугольника, периметры которых различаются на 2 см. Найдите боковую сторону.','Боковая сторона равна 6 см или 10 см.',[
 ('Какие слагаемые входят в оба периметра?','Пусть AB = AC = x, AM = MC = x/2, BM = m. Тогда P(ABM) = x + x/2 + m, а P(CBM) = 8 + x/2 + m.','Медиана делит сторону пополам',[17,18]),
 ('Что останется после вычитания?','Общие слагаемые x/2 и m сокращаются. Разность периметров равна x − 8, а её модуль по условию равен 2.','Вычитание одинаковых слагаемых',[14]),
 ('Почему есть два случая?','Не сказано, чей периметр больше. Поэтому x − 8 = 2 или 8 − x = 2, откуда x = 10 или x = 6.','Оба возможных порядка периметров',[14]),
 ('Оба ли ответа возможны?','Оба равнобедренных треугольника можно построить с основанием 8 см и боковыми сторонами 6 см или 10 см. Подстановка в выражения периметров даёт разность 2 см в каждом случае.','Проверка каждого решения',[14,18])],p,v,[v,v,small,large],cases=[small,large],labels={'A2':'A','B2':'B','C2':'C','M2':'M'},checks=[ck('equalLength',segments=[['A','B'],['A','C']]),ck('distanceRatio',segments=[['A','B'],['B','C']],ratio=6/8),ck('distanceRatio',segments=[['A2','B2'],['B2','C2']],ratio=10/8),ck('equalLength',segments=[['A2','B2'],['A2','C2']])])

# 164. Correspondence is displayed by two clean selectable views, not overlapping figures.
p0={'A':[50,56],'B':[23,14],'C':[77,14]};p={**p0,**translated(p0)};v=sc(p0,triangles('ABC'),equalSegments=[eq('A','B'),eq('A','C')],angleArcs=[arc('A','B','C')]);v1=sc(['A1','B1','C1'],triangles(['A1','B1','C1']),equalSegments=[eq('A1','B1'),eq('A1','C1')],angleArcs=[arc('A1','B1','C1')],label='Второй треугольник',availableFromStep=0)
add(164,'single','Два равнобедренных треугольника имеют равные боковые стороны и равные углы при вершинах, противоположных основаниям. Докажите равенство треугольников.','Треугольники равны по двум сторонам и углу между ними.',[
 ('Как обозначить соответствующие стороны?','Пусть AB = AC и A₁B₁ = A₁C₁, а по условию AB = A₁B₁ и ∠A = ∠A₁.','Определение равнобедренного треугольника',[18]),
 ('Почему равны вторые боковые стороны?','AC = AB = A₁B₁ = A₁C₁, поэтому AC = A₁C₁.','Равенство величин',[18]),
 ('Какой признак теперь применим?','Равны AB и A₁B₁, AC и A₁C₁ и углы между ними. Следовательно, △ABC = △A₁B₁C₁ по первому признаку.','Первый признак равенства',[15])],p,v,[v,v1,v],cases=[{**v,'label':'Первый треугольник','availableFromStep':0},v1],checks=[ck('equalLength',segments=[['A','B'],['A','C'],['A1','B1'],['A1','C1']])])

# 165. Include the exceptional point on AB explicitly in the reasoning.
p={'A':[22,23],'B':[78,23],'M':[50,23],'P':[50,56],'_t':[50,63],'_b':[50,8]};base=sc(['A','B','M','P'],[['A','B']],lines=[['_t','_b']],equalSegments=[eq('A','M'),eq('M','B')],rightAngles=[right('A','M','P')]);joined=sc(['A','B','M','P'],triangles('AMP','BMP'),lines=[['_t','_b']])
add(165,'а','Прямая a перпендикулярна AB и проходит через его середину M. Докажите, что любая её точка P равноудалена от A и B.','PA = PB для каждой точки P прямой a.',[
 ('Что происходит, если P совпадает с M?','Тогда PA = MA = MB = PB, поскольку M — середина AB.','Определение середины',[6]),
 ('Какие треугольники сравним для P ≠ M?','В треугольниках AMP и BMP AM = BM, PM общая, ∠AMP = ∠BMP = 90°.','Перпендикулярность и общая сторона',[12,16]),
 ('Как получить нужные расстояния?','По первому признаку △AMP = △BMP. Поэтому их соответствующие стороны PA и PB равны.','Первый признак',[15])],p,base,[base,joined,joined],checks=[ck('equalLength',segments=[['A','M'],['M','B']]),ck('equalLength',segments=[['P','A'],['P','B']]),ck('perpendicular',segments=[['A','B'],['M','P']])])
base2=sc(['A','B','P'],triangles('APB'),equalSegments=[eq('P','A'),eq('P','B')]);fin=sc(['A','B','P','M'],triangles('APB')+[['P','M']],lines=[['_t','_b']],rightAngles=[right('A','M','P')])
add(165,'б','Прямая a — серединный перпендикуляр к AB. Докажите: если PA = PB, то P лежит на a.','Всякая точка, равноудалённая от A и B, лежит на a.',[
 ('Можно ли P лежать на прямой AB?','Если P лежит между A и B, равенство PA = PB означает, что P — середина M. Если P вне AB, одно из расстояний больше другого на AB, поэтому равенство невозможно. Для P = M утверждение верно.','Сложение длин на прямой',[7]),
 ('Что сделать, когда P вне прямой AB?','Соединим P с серединой M. Треугольники PAM и PBM равны по трём сторонам: PA = PB, AM = BM, PM общая.','Третий признак',[20]),
 ('Почему PM совпадает с a?','Углы PMA и PMB равны и смежны, значит каждый равен 90°. Поэтому PM — перпендикуляр к AB через M; он совпадает с a по единственности такого перпендикуляра.','Смежные углы и единственность перпендикуляра',[11,16])],p,base2,[base2,joined,fin],checks=[ck('equalLength',segments=[['P','A'],['P','B']]),ck('perpendicular',segments=[['A','B'],['M','P']])])

# 166. Equal medians plus equal adjacent half-bases give SAS twice.
p0={'A':[38,57],'B':[18,16],'C':[82,16],'M':[50,16]};p={**p0,**translated(p0)};v=sc(p0,triangles('ABC')+[['A','M']]);v1=sc(['A1','B1','C1','M1'],triangles(['A1','B1','C1'])+[['A1','M1']],label='Второй треугольник',availableFromStep=0)
add(166,'single','В ABC и A₁B₁C₁ равны медианы AM и A₁M₁, основания BC и B₁C₁, а также углы AMB и A₁M₁B₁. Докажите равенство треугольников.','△ABC = △A₁B₁C₁.',[
 ('Какие половины оснований равны?','BM = MC = BC/2 и B₁M₁ = M₁C₁ = B₁C₁/2. Из BC = B₁C₁ следует BM = B₁M₁.','Определение медианы',[17]),
 ('Какие малые треугольники равны?','AM = A₁M₁, BM = B₁M₁ и ∠AMB = ∠A₁M₁B₁. По первому признаку △AMB = △A₁M₁B₁. Поэтому AB = A₁B₁ и ∠ABM = ∠A₁B₁M₁.','Первый признак',[15]),
 ('Как перейти к большим треугольникам?','Лучи BM и BC совпадают, как и B₁M₁ и B₁C₁. Значит ∠ABC = ∠A₁B₁C₁. Вместе с AB = A₁B₁ и BC = B₁C₁ это даёт равенство больших треугольников по первому признаку.','Первый признак',[15])],p,v,[v,v1,v],cases=[{**v,'label':'Первый треугольник','availableFromStep':0},v1],checks=[ck('equalLength',segments=[['B','M'],['M','C'],['B1','M1'],['M1','C1']]),ck('equalLength',segments=[['A','M'],['A1','M1']])])

# 167. The exact order D–B–C–E from fig.98 is retained.
p={'A':[50,59],'D':[18,13],'B':[32,13],'C':[68,13],'E':[82,13]};v=sc(p,triangles('ADE')+[['A','B'],['A','C']],equalSegments=[eq('A','D'),eq('A','E')]);focus=sc(p,triangles('ADB','AEC'),equalSegments=[eq('A','D'),eq('A','E'),eq('D','B',2),eq('C','E',2)])
add(167,'а','В равнобедренном ADE с основанием DE точки идут в порядке D–B–C–E. Из BD = CE докажите ∠CAD = ∠BAE и AB = AC.','∠CAD = ∠BAE, AB = AC.',[
 ('Какие углы равны по свойству ADE?','∠ADB = ∠AEC: это углы при основании равнобедренного ADE, поскольку DB направлен к E, а EC — к D.','Углы при основании',[18]),
 ('Какие треугольники сравним?','AD = AE, DB = EC и углы между ними равны. По первому признаку △ADB = △AEC, поэтому AB = AC и ∠DAB = ∠EAC.','Первый признак',[15]),
 ('Как получить равенство больших углов при A?','Прибавим общий угол BAC: ∠DAC = ∠DAB + ∠BAC = ∠EAC + ∠BAC = ∠BAE. Следовательно ∠CAD = ∠BAE.','Сложение углов',[9])],p,v,[v,focus,v],checks=[ck('equalLength',segments=[['A','D'],['A','E']]),ck('equalLength',segments=[['D','B'],['C','E']]),ck('equalLength',segments=[['A','B'],['A','C']])])
add(167,'б','В равнобедренном ADE с основанием DE точки идут в порядке D–B–C–E. Из ∠CAD = ∠BAE докажите BD = CE и AB = AC.','BD = CE, AB = AC.',[
 ('Как выделить углы DAB и CAE?','Из равных углов CAD и BAE вычтем общий угол BAC. Получим ∠DAB = ∠CAE.','Вычитание равных углов',[9]),
 ('Что ещё известно о треугольниках ADB и AEC?','AD = AE; углы ADB и AEC равны как углы при основании ADE. Значит, сторона и два прилежащих к ней угла в этих треугольниках равны.','Свойство равнобедренного треугольника',[18]),
 ('Как завершить доказательство?','По второму признаку △ADB = △AEC. Соответствующие стороны дают BD = CE и AB = AC.','Второй признак',[19])],p,v,[v,focus,focus],checks=[ck('equalLength',segments=[['A','D'],['A','E']]),ck('equalLength',segments=[['D','B'],['C','E']]),ck('equalLength',segments=[['A','B'],['A','C']])])

# 168. No midline theorem is invoked.
p={'A':[50,59],'B':[20,13],'C':[80,13]};p.update(M=lerp(p['A'],p['B'],.5),N=lerp(p['A'],p['C'],.5),K=lerp(p['B'],p['C'],.5));v=sc(p,triangles('ABC'));f=sc(p,triangles('ABC')+triangles('MNK'))
add(168,'single','Докажите, что середины трёх сторон равнобедренного треугольника образуют равнобедренный треугольник.','Если M, N, K — середины AB, AC, BC и AB = AC, то KM = KN.',[
 ('Какие половины сторон равны?','Обозначим середины AB, AC, BC через M, N, K. Из AB = AC следует BM = CN; кроме того BK = CK.','Равные половины равных отрезков',[17,18]),
 ('Как сравнить треугольники BMK и CNK?','∠MBK = ∠NCK как углы при основании ABC. Вместе с BM = CN и BK = CK это даёт △BMK = △CNK по первому признаку.','Первый признак',[15,18]),
 ('Почему новый треугольник равнобедренный?','Соответствующие стороны равных треугольников дают KM = KN. Значит, MNK равнобедренный с основанием MN.','Определение равнобедренного треугольника',[18])],p,v,[v,f,f],checks=[ck('equalLength',segments=[['A','B'],['A','C']]),ck('equalLength',segments=[['K','M'],['K','N']]),ck('equalLength',segments=[['A','M'],['M','B'],['A','N'],['N','C']])])

# 169. Fig.99 places D on AC, E on BA, F on CB.
p={'A':[21,13],'B':[50,13+29*math.sqrt(3)],'C':[79,13]};p.update(D=lerp(p['A'],p['C'],.29),E=lerp(p['B'],p['A'],.29),F=lerp(p['C'],p['B'],.29));v=sc(p,triangles('ABC')+triangles('DEF'),equalSegments=[eq('A','D'),eq('B','E'),eq('C','F')]);f=sc(p,triangles('ADE','BEF','CFD'))
add(169,'single','В равностороннем ABC точки D ∈ AC, E ∈ BA, F ∈ CB выбраны так, что AD = BE = CF. Докажите, что DEF равносторонний.','DE = EF = FD.',[
 ('Какие оставшиеся части сторон равны?','Из AB = BC = CA и AD = BE = CF вычитанием получаем AE = BF = CD.','Вычитание равных отрезков',[7,18]),
 ('Почему равны три угла между выбранными сторонами?','Углы DAE, EBF и FCD — углы при вершинах равностороннего ABC. Все они равны: каждая пара является углами при основании одного из равнобедренных представлений ABC.','Углы равностороннего треугольника',[18]),
 ('Какие три треугольника равны?','В ADE, BEF, CFD равны соответственно две стороны AD = BE = CF и AE = BF = CD, а также углы между ними. По первому признаку эти треугольники равны.','Первый признак',[15]),
 ('Что это даёт для внутреннего треугольника?','Соответствующие третьи стороны равны: DE = EF = FD. Значит, DEF равносторонний.','Равные элементы равных треугольников',[14,18])],p,v,[v,v,f,v],checks=[ck('equalLength',segments=[['A','B'],['B','C'],['C','A']]),ck('equalLength',segments=[['A','D'],['B','E'],['C','F']]),ck('equalLength',segments=[['D','E'],['E','F'],['F','D']])])

# 170–171. Both crossing segments share the midpoint O.
p0={'O':[50,35],'A':[18,55],'B':[82,15],'C':[78,56],'D':[22,14]};p={**p0,'K':lerp(p0['A'],p0['C'],.38),'K1':lerp(p0['B'],p0['D'],.38)};v=sc(p,[['A','B'],['C','D'],['A','C'],['B','D']],equalSegments=[eq('A','O'),eq('O','B'),eq('C','O',2),eq('O','D',2)]);f=sc(p,[['A','B'],['C','D'],['A','C'],['B','D'],['O','K'],['O','K1']]);ff=sc(p,[['A','B'],['C','D'],['A','C'],['B','D'],['K','K1']])
steps170=[('Какие большие треугольники равны?','Если K = A, то AK = 0, поэтому K₁ = B. Тогда OK = OA = OB = OK₁ и K, O, K₁ лежат на AB. Далее рассматриваем K ≠ A. OA = OB, OC = OD, ∠AOC = ∠BOD как вертикальные. По первому признаку △AOC = △BOD, поэтому ∠OAC = ∠OBD.','Первый признак и вертикальные углы',[11,15]),('Какие малые треугольники сравним?','Поскольку K ∈ AC и K₁ ∈ BD, ∠OAK = ∠OBK₁. С учётом OA = OB и AK = BK₁ получаем △OAK = △OBK₁ по первому признаку.','Первый признак',[15])]
add(170,'а','Отрезки AB и CD пересекаются в общей середине O. Точки K ∈ AC, K₁ ∈ BD удовлетворяют AK = BK₁. Докажите OK = OK₁.','OK = OK₁.',steps170+[('Какой вывод дают равные малые треугольники?','Их соответствующие стороны OK и OK₁ равны.','Соответствующие элементы равных треугольников',[14])],p,v,[v,f,f],checks=[ck('equalLength',segments=[['O','A'],['O','B']]),ck('equalLength',segments=[['O','C'],['O','D']]),ck('equalLength',segments=[['A','K'],['B','K1']]),ck('equalLength',segments=[['O','K'],['O','K1']])])
add(170,'б','В условиях № 170 (O — общая середина AB и CD, K ∈ AC, K₁ ∈ BD, AK = BK₁) докажите, что O лежит на прямой KK₁.','Точки K, O, K₁ лежат на одной прямой.',steps170+[('Что известно об углах при O?','Из равенства △OAK и △OBK₁ следует ∠AOK = ∠BOK₁. Лучи OA и OB противоположны.','Равные углы равных треугольников',[14]),('Почему OK и OK₁ противоположны?','K лежит в полуплоскости относительно AB, содержащей C, а K₁ — в противоположной, содержащей D. В этой полуплоскости луч, образующий с OB угол ∠AOK, единственен; это продолжение OK за O. Значит OK₁ — противоположный луч. Если K = A, то K₁ = B и вывод очевиден.','Единственность откладывания угла в заданной полуплоскости',[9])],p,v,[v,f,f,ff],checks=[ck('collinear',points=['K','O','K1']),ck('equalLength',segments=[['O','K'],['O','K1']])])
p={**p0,'M':lerp(p0['A'],p0['C'],.5),'N':lerp(p0['B'],p0['D'],.5)};v=sc(p,[['A','B'],['C','D'],['A','C'],['B','D']]);f=sc(p,[['A','B'],['C','D'],['A','C'],['B','D'],['M','N']])
add(171,'single','AB и CD пересекаются в общей середине O. Точки M и N — середины AC и BD. Докажите, что O — середина MN.','M, O, N лежат на одной прямой и OM = ON.',[
 ('Как связаны AC и BD?','По первому признаку △AOC = △BOD: OA = OB, OC = OD, углы AOC и BOD вертикальные. Поэтому AC = BD.','Первый признак',[15]),
 ('Какие расстояния от концов до середин равны?','AM = AC/2 и BN = BD/2. Из AC = BD получаем AM = BN.','Определение середины',[17]),
 ('Как применить доказанные свойства № 170?','Для K = M и K₁ = N выполнены все условия № 170. Поэтому OM = ON и точки M, O, N лежат на одной прямой; M и N находятся по разные стороны от AB, значит O между ними.','Результат № 170, доказанный по первому признаку',[15]),
 ('Что означает полученное?','O лежит на отрезке MN и делит его на равные части, то есть является его серединой.','Определение середины отрезка',[6])],p,v,[v,v,f,f],checks=[ck('collinear',points=['M','O','N']),ck('equalLength',segments=[['M','O'],['O','N']]),ck('equalLength',segments=[['A','M'],['M','C'],['B','N'],['N','D']])])

# 172. Exact extension directions from fig.100: B–A–D, A–C–E, C–B–F.
p={'A':[36,24],'B':[50,24+14*math.sqrt(3)],'C':[64,24]};p.update(D=lerp(p['B'],p['A'],1.42),E=lerp(p['A'],p['C'],1.42),F=lerp(p['C'],p['B'],1.42));v=sc(p,triangles('ABC')+[['A','D'],['C','E'],['B','F']]);f=sc(p,triangles('DEF')+triangles('ABC'))
add(172,'single','Стороны равностороннего ABC продолжены в порядках B–A–D, A–C–E, C–B–F, причём AD = CE = BF. Докажите, что DEF равносторонний.','DE = EF = FD.',[
 ('Какие удлинённые стороны равны?','DB = DA + AB, AE = AC + CE, CF = CB + BF. Так как AB = AC = CB и AD = CE = BF, получаем DB = AE = CF.','Сложение равных отрезков',[7,18]),
 ('Какие углы между нужными сторонами равны?','Углы DAE, ECF, FBD смежны соответственно с равными углами BAC, ACB, CBA. Поэтому ∠DAE = ∠ECF = ∠FBD.','Смежные углы при равных углах',[11,18]),
 ('Какие треугольники равны по первому признаку?','В DAE, ECF, FBD равны AD = CE = BF, AE = CF = BD и углы между ними. Следовательно эти три треугольника равны.','Первый признак',[15]),
 ('Почему DEF равносторонний?','Их соответствующие третьи стороны DE, EF, FD равны. Значит DEF — равносторонний треугольник.','Определение равностороннего треугольника',[18])],p,v,[v,v,f,f],checks=[ck('equalLength',segments=[['A','D'],['C','E'],['B','F']]),ck('equalLength',segments=[['D','E'],['E','F'],['F','D']])])

# 173. Angle values are exact; D and E follow A–D–E–C.
a=[15,14];c=[85,14];height=70/(1/math.tan(math.radians(38))+1/math.tan(math.radians(32)));b=[15+height/math.tan(math.radians(38)),14+height];d=[15+dist(a,b)**2/(2*(b[0]-a[0])),14];e=[85-dist(c,b)**2/(2*(c[0]-b[0])),14];p={'A':a,'B':b,'C':c,'D':d,'E':e};v=sc(p,triangles('ABC')+[['B','D'],['B','E']],equalSegments=[eq('B','D'),eq('D','A'),eq('B','E',2),eq('E','C',2)]);f={**v,'angleArcs':[arc('B','D','E',10)]}
add(173,'single','В ABC даны ∠A = 38°, ∠B = 110°, ∠C = 32°. На AC точки идут A–D–E–C, причём BD = DA и BE = EC. Найдите ∠DBE.','∠DBE = 40°.',[
 ('Чему равен угол ABD?','В треугольнике ABD стороны BD и DA равны. Его углы при основании AB равны, поэтому ∠ABD = ∠BAD = 38°.','Углы при основании равнобедренного треугольника',[18]),
 ('Чему равен угол EBC?','В треугольнике BEC стороны BE и EC равны. Значит ∠EBC = ∠BCE = 32°.','Углы при основании',[18]),
 ('Как выделить искомый угол?','Лучи BD и BE делят угол ABC на три последовательные части. Поэтому ∠DBE = 110° − 38° − 32° = 40°.','Сложение углов',[9])],p,v,[v,v,f],checks=[ck('equalLength',segments=[['B','D'],['D','A']]),ck('equalLength',segments=[['B','E'],['E','C']]),ck('angle',points=['B','A','C'],degrees=38),ck('angle',points=['A','B','C'],degrees=110),ck('angle',points=['A','C','B'],degrees=32),ck('angle',points=['D','B','E'],degrees=40)])

# 174. Collinear A–B–C and D–E–F, with A–O–F, B–O–E, C–O–D as fig.101.
p={'O':[50,35],'A':[18,54],'B':[55,54],'C':[70,54],'D':[30,16],'E':[45,16],'F':[82,16]};v=sc(p,[['A','C'],['D','F'],['A','F'],['B','E'],['C','D']],equalSegments=[eq('O','C'),eq('O','D'),eq('O','B',2),eq('O','E',2)]);f=sc(['A','B','O','E','F'],triangles('ABO','FEO'))
add(174,'single','Как на рисунке 101, A–B–C и D–E–F лежат на двух прямых, A–O–F, B–O–E, C–O–D — на трёх пересекающихся прямых; OC = OD, OB = OE. Докажите AB = EF и объясните измерение ширины озера AB.','AB = EF; доступный отрезок EF позволяет измерить недоступный AB.',[
 ('Какие малые треугольники равны?','В △BOC и △EOD OB = OE, OC = OD, углы BOC и EOD вертикальные. По первому признаку треугольники равны; значит ∠OBC = ∠OED.','Первый признак',[15]),
 ('Как связаны углы у концов измеряемых отрезков?','Углы ABO и FEO смежны соответственно с равными OBC и OED. Поэтому ∠ABO = ∠FEO. Также ∠AOB = ∠FOE как вертикальные.','Смежные и вертикальные углы',[11]),
 ('Почему AB = EF?','OB = OE и два прилежащих к этим сторонам угла равны. По второму признаку △ABO = △FEO, откуда AB = EF.','Второй признак',[19]),
 ('Как применить построение на местности?','На доступном берегу продолжают линию AB до C; выбирают O так, чтобы можно было отметить E за O на BO с OE = OB и D за O на CO с OD = OC. Пересечение прямых DE и AO обозначают F. Измеряют доступный EF: его длина равна ширине AB.','Доказанное равенство и перенос равных отрезков',[22])],p,v,[v,v,f,v],checks=[ck('collinear',points=['A','B','C']),ck('collinear',points=['D','E','F']),ck('collinear',points=['A','O','F']),ck('collinear',points=['B','O','E']),ck('collinear',points=['C','O','D']),ck('equalLength',segments=[['O','C'],['O','D']]),ck('equalLength',segments=[['O','B'],['O','E']]),ck('equalLength',segments=[['A','B'],['E','F']])])

# 175. Two applications of SAS/ASA avoid a future bisector-length formula.
p0={'A':[35,56],'B':[18,14],'C':[82,14]};p0['D']=lerp(p0['B'],p0['C'],dist(p0['A'],p0['B'])/(dist(p0['A'],p0['B'])+dist(p0['A'],p0['C'])));p={**p0,**translated(p0)};v=sc(p0,triangles('ABC')+[['A','D']],angleArcs=[arc('A','B','D',9,1),arc('A','D','C',12,1)]);v1=sc(['A1','B1','C1','D1'],triangles(['A1','B1','C1'])+[['A1','D1']],label='Второй треугольник',availableFromStep=0)
add(175,'single','В ABC и A₁B₁C₁ равны AB и A₁B₁, углы A и A₁, а также биссектрисы AD и A₁D₁. Докажите равенство треугольников.','△ABC = △A₁B₁C₁.',[
 ('Какие половины углов равны?','Поскольку AD и A₁D₁ — биссектрисы равных углов, ∠BAD = ∠B₁A₁D₁.','Определение биссектрисы',[17]),
 ('Какие треугольники равны сначала?','AB = A₁B₁, AD = A₁D₁ и углы между ними равны. По первому признаку △ABD = △A₁B₁D₁; значит ∠ABD = ∠A₁B₁D₁.','Первый признак',[15]),
 ('Почему теперь равны исходные треугольники?','D лежит на BC, D₁ — на B₁C₁, поэтому углы ABC и A₁B₁C₁ равны. В исходных треугольниках равны сторона AB и два прилежащих к ней угла A и B. По второму признаку треугольники равны.','Второй признак',[19])],p,v,[v,v1,v],cases=[{**v,'label':'Первый треугольник','availableFromStep':0},v1],checks=[ck('equalLength',segments=[['A','B'],['A1','B1']]),ck('equalLength',segments=[['A','D'],['A1','D1']]),ck('collinear',points=['B','D','C'])])

# 176. Converse isosceles fact is justified, rather than silently imported.
p={'A':[22,14],'C':[78,14],'O':[50,42],'B':[32,60],'D':[68,60],'M':[50,14]};v=sc(['A','B','C','D','O'],triangles('ABC','ADC'));f=sc(['A','B','C','D','O'],triangles('ABO','CDO'))
add(176,'single','В треугольниках ABC и ADC стороны BC и AD равны и пересекаются в O; ∠OAC = ∠OCA. Докажите △ABO = △CDO.','△ABO = △CDO.',[
 ('Почему OA = OC из равенства углов при A и C?','Сравним △AOC и △COA: сторона AC общая, а прилежащие к ней углы при A и C равны по условию. По второму признаку треугольники равны при соответствии A ↔ C, O ↔ O. Поэтому OA = OC.','Второй признак для △AOC и △COA',[19]),
 ('Какие остатки равных сторон равны?','Так как O лежит на BC и AD, BO = BC − CO, DO = AD − AO. Из BC = AD и CO = AO получаем BO = DO.','Вычитание равных отрезков',[7]),
 ('Как завершить сравнение треугольников?','AO = CO, BO = DO, а ∠AOB = ∠COD как вертикальные. По первому признаку △ABO = △CDO.','Первый признак',[15,11])],p,v,[v,v,f],checks=[ck('collinear',points=['A','O','D']),ck('collinear',points=['B','O','C']),ck('equalLength',segments=[['B','C'],['A','D']]),ck('equalLength',segments=[['O','A'],['O','C']]),ck('equalLength',segments=[['B','O'],['D','O']])])

# 177. Fig.102 has A and B on opposite sides of CD.
p={'A':[50,12],'B':[50,61],'C':[23,31],'D':[77,31],'H':[50,31]};v=sc(['A','B','C','D'],triangles('ACD','BCD')+[['A','B']],equalSegments=[eq('A','C'),eq('A','D')],rightAngles=[right('A','H','C')]);f=sc(p,triangles('ACD','BCD')+[['A','B']],equalSegments=[eq('C','H'),eq('H','D')])
add(177,'single','Как на рисунке 102, A и B находятся по разные стороны CD, AC = AD и AB ⟂ CD. Докажите BC = BD и ∠ACB = ∠ADB.','BC = BD, ∠ACB = ∠ADB.',[
 ('Где пересекает AB основание CD?','Пусть H = AB ∩ CD. В равнобедренном ACD биссектриса из A является медианой и высотой. По единственности перпендикуляра она лежит на AB, поэтому CH = HD.','Свойство биссектрисы равнобедренного треугольника и единственность перпендикуляра',[18,16]),
 ('Почему равны BC и BD?','В △BHC и △BHD BH общая, CH = DH, углы при H прямые. По первому признаку треугольники равны, поэтому BC = BD.','Первый признак',[15]),
 ('Как сравнить полные углы ACB и ADB?','В △ACB и △ADB равны AC = AD, BC = BD и AB — общая. По третьему признаку они равны, значит ∠ACB = ∠ADB.','Третий признак',[20])],p,v,[f,f,v],checks=[ck('equalLength',segments=[['A','C'],['A','D']]),ck('perpendicular',segments=[['A','B'],['C','D']]),ck('equalLength',segments=[['B','C'],['B','D']])])

# 178. Euclid's midpoint extension proof; angle-sum theorem is not assumed.
p={'A':[27,54],'B':[14,17],'C':[66,17],'D':[90,17]};p['M']=lerp(p['A'],p['C'],.5);p['E']=[2*p['M'][i]-p['B'][i] for i in range(2)];p['N']=lerp(p['B'],p['C'],.5);p['F']=[2*p['N'][i]-p['A'][i] for i in range(2)];p['G']=[2*p['C'][i]-p['A'][i] for i in range(2)]
v=sc(['A','B','C','D'],triangles('ABC')+[['C','D']],angleArcs=[arc('C','A','D')]);s1=sc(['A','B','C','D','M','E'],triangles('ABC')+[['C','D'],['B','E'],['C','E']]);s2=sc(['A','B','C','D','N','F','G'],triangles('ABC')+[['C','D'],['A','F'],['C','F'],['C','G']]);clean1=sc(['A','B','C','D','E'],triangles('ABC')+[['C','D'],['C','E']],angleArcs=[arc('C','A','E',9),arc('C','E','D',13)]);clean2=sc(['A','B','C','D','F','G'],triangles('ABC')+[['C','D'],['C','F'],['C','G']])
add(178,'single','Докажите, что внешний угол треугольника (смежный с внутренним) больше каждого из двух внутренних углов, не смежных с ним.','Если BC продолжено за C до D, то ∠ACD > ∠A и ∠ACD > ∠B.',[
 ('Как сравнить внешний угол при C с углом A?','Пусть M — середина AC. Продолжим BM за M до E так, чтобы ME = MB, и соединим C с E. △AMB = △CME по двум сторонам и вертикальному углу при M.','Первый признак',[15]),
 ('Почему получено строгое неравенство?','Из равенства треугольников ∠BAM = ∠ECM, то есть ∠BAC = ∠ECA. Луч CE лежит внутри внешнего угла ACD: E находится с той же стороны BC, что A, и с противоположной B стороны AC. Поэтому ∠ACD > ∠ECA = ∠A.','Внутренний луч делит угол на две положительные части',[9]),
 ('Как аналогично сравнить с углом B?','Продолжим AC за C до G. Для внешнего угла BCG повторим построение: возьмём середину N стороны BC, удвоим медиану AN до F. По первому признаку △BNA = △CNF, поэтому ∠BCF = ∠B; луч CF внутри угла BCG, значит ∠BCG > ∠B.','То же доказательство с перестановкой A и B',[15]),
 ('Почему это относится к исходному внешнему углу?','Углы ACD и BCG вертикальные, поэтому равны. Следовательно ∠ACD > ∠B. Оба требуемых неравенства доказаны без использования суммы углов треугольника.','Вертикальные углы',[11])],p,v,[s1,clean1,s2,clean2],checks=[ck('equalLength',segments=[['A','M'],['M','C']]),ck('equalLength',segments=[['B','M'],['M','E']]),ck('equalLength',segments=[['B','N'],['N','C']]),ck('equalLength',segments=[['A','N'],['N','F']])],bounds=[-10,-32,130,78])

# 179. AAS without using the later angle-sum theorem.
p0={'A':[35,57],'B':[18,14],'C':[82,14]};p={**p0,**translated(p0)};p['X']=lerp(p['B'],p['A'],.63);p['X2']=lerp(p['B'],p['A'],1.4);v=sc(p0,triangles('ABC'));v1=sc(['A1','B1','C1'],triangles(['A1','B1','C1']),label='Второй треугольник',availableFromStep=0);contr=sc(['A','B','C','X'],triangles('ABC')+[['X','C']],label='Предположение: X внутри AB',availableFromStep=2);contr_far=sc(['A','B','C','X2'],triangles('ABC')+[['A','X2'],['X2','C']],label='Предположение: X за A',availableFromStep=3)
add(179,'single','В ABC и A₁B₁C₁ даны ∠A = ∠A₁, ∠B = ∠B₁ и BC = B₁C₁. Докажите равенство треугольников.','△ABC = △A₁B₁C₁.',[
 ('Как перенести второй треугольник к стороне BC?','На луче BA отложим BX = B₁A₁. По первому признаку △XBC = △A₁B₁C₁: BX = B₁A₁, BC = B₁C₁ и углы при B равны. Следовательно ∠BXC = ∠A₁ = ∠A.','Первый признак',[15,22]),
 ('Может ли X лежать между B и A?','Предположим B–X–A. Тогда ∠BXC — внешний угол △AXC. По доказанному в № 178 он больше внутреннего ∠XAC = ∠A. Это противоречит равенству ∠BXC = ∠A.','Внешний угол больше несмежного внутреннего, № 178',[15]),
 ('Может ли A лежать между B и X?','Если B–A–X, то ∠BAC — внешний угол △AXC и больше внутреннего ∠AXC = ∠BXC. Но эти углы равны по первому шагу. Снова противоречие.','Внешний угол, № 178',[15]),
 ('Какое положение остаётся?','Точки A и X должны совпасть. Поэтому исходный △ABC совпадает с △XBC, уже равным △A₁B₁C₁.','Исключение всех иных положений на луче',[7])],p,v,[v1,contr,contr_far,v],cases=[{**v,'label':'Первый треугольник','availableFromStep':0},v1,contr,contr_far],labels={'X2':'X'},bounds=[-8,0,108,90],checks=[ck('equalLength',segments=[['B','C'],['B1','C1']]),ck('collinear',points=['B','X','A']),ck('collinear',points=['B','A','X2'])])

# 180. Exact symmetric crossing construction from fig.103.
p={'O':[50,9],'A':[64,32],'C':[78,55],'B':[36,32],'D':[22,55],'E':[50,39.666666666666664],'X':[82,61.5714285714],'Y':[18,61.5714285714]};v=sc(['O','A','B','C','D','E'],[['A','D'],['B','C']],rays=[['O','C'],['O','D']],equalSegments=[eq('O','A'),eq('O','B'),eq('A','C',2),eq('B','D',2)]);f=sc(['O','A','B','C','D','E'],[['A','D'],['B','C'],['O','E']],rays=[['O','C'],['O','D']])
add(180,'single','На сторонах угла XOY точки идут O–A–C и O–B–D; OA = OB, AC = BD. Прямые AD и BC пересекаются в E. Докажите, что OE — биссектриса, и опишите такое построение.','OE делит угол XOY пополам.',[
 ('Какие большие треугольники равны?','OC = OA + AC = OB + BD = OD. В △OAD и △OBC равны OA = OB, OD = OC и общий угол при O. По первому признаку треугольники равны; значит AD = BC и ∠OAD = ∠OBC.','Первый признак',[15]),
 ('Как получить AE = BE?','Углы CAE и DBE смежны с равными OAD и OBC, а ∠AEC = ∠BED как вертикальные. Для более короткого пути сравним △ACB и △BDA по трём сторонам: AC = BD, CB = DA, AB общая. Получим ∠BAE = ∠ABE. По второму признаку △ABE = △BAE (общая AB и два равных прилежащих угла), значит AE = BE.','Третий и второй признаки',[20,19]),
 ('Почему OE делит угол пополам?','В △OAE и △OBE OA = OB, AE = BE, OE общая. По третьему признаку треугольники равны, поэтому ∠AOE = ∠BOE.','Третий признак',[20]),
 ('Как выполнить построение биссектрисы?','На сторонах угла отложим равные OA и OB, затем одинаковые ненулевые AC и BD в направлении от O. Проведём AD и BC; их внутреннее пересечение E соединим с O. По доказанному луч OE — биссектриса.','Перенос равных отрезков и доказанное свойство',[22,23])],p,v,[v,v,f,f],checks=[ck('collinear',points=['O','A','C']),ck('collinear',points=['O','B','D']),ck('collinear',points=['A','E','D']),ck('collinear',points=['B','E','C']),ck('equalLength',segments=[['O','A'],['O','B']]),ck('equalLength',segments=[['A','C'],['B','D']]),ck('equalLength',segments=[['E','A'],['E','B']])])

# 181. Doubling the median reveals SSS triangle ABK, then recovers ABC.
p0={'A':[31,57],'B':[17,22],'C':[76,22]};p0['M']=lerp(p0['B'],p0['C'],.5);p0['K']=[2*p0['M'][i]-p0['A'][i] for i in range(2)];p={**p0,**translated(p0)};v=sc(['A','B','C','M'],triangles('ABC')+[['A','M']]);double=sc(p0,triangles('ABC')+[['A','K'],['B','K']]);double1=sc(['A1','B1','C1','M1','K1'],triangles(['A1','B1','C1'])+[['A1','K1'],['B1','K1']],label='Удвоенная медиана второго треугольника',availableFromStep=1)
add(181,'single','В ABC и A₁B₁C₁ равны AB и A₁B₁, AC и A₁C₁, медианы AM и A₁M₁. Докажите равенство методом удвоения медианы.','△ABC = △A₁B₁C₁.',[
 ('Как удвоить обе медианы?','Продолжим AM за M до K с MK = AM. Аналогично построим K₁, где M₁K₁ = A₁M₁. Тогда AK = 2AM = 2A₁M₁ = A₁K₁.','Перенос равного отрезка',[22]),
 ('Почему BK = AC?','В △BМK и △CМA BM = CM, MK = MA, а углы при M вертикальные. По первому признаку треугольники равны, значит BK = AC. Аналогично B₁K₁ = A₁C₁.','Первый признак',[15]),
 ('Какие новые треугольники равны по трём сторонам?','AB = A₁B₁, BK = AC = A₁C₁ = B₁K₁, AK = A₁K₁. Следовательно △ABK = △A₁B₁K₁; в частности ∠BAK = ∠B₁A₁K₁.','Третий признак',[20]),
 ('Как восстановить равенство исходных треугольников?','M лежит на AK, M₁ — на A₁K₁. По первому признаку △ABM = △A₁B₁M₁, поэтому BM = B₁M₁ и ∠ABM = ∠A₁B₁M₁. Тогда BC = 2BM = 2B₁M₁ = B₁C₁ и углы ABC и A₁B₁C₁ равны. По первому признаку △ABC = △A₁B₁C₁.','Два применения первого признака',[15,17])],p,v,[double,double,double1,v],cases=[{**double,'label':'Удвоенная медиана первого треугольника','availableFromStep':1},double1],checks=[ck('equalLength',segments=[['B','M'],['M','C']]),ck('equalLength',segments=[['A','M'],['M','K'],['A1','M1'],['M1','K1']]),ck('equalLength',segments=[['B','K'],['A','C'],['B1','K1'],['A1','C1']])],bounds=[-15,-25,115,75])

# 182. Each requested segment has its own model and proof sequence.
p0={'A':[27,56],'B':[17,13],'C':[83,13]};p0.update(K=lerp(p0['A'],p0['C'],.43),L=lerp(p0['C'],p0['B'],.35));p={**p0,**translated(p0)};v=sc(p0,triangles('ABC'));vv=sc(['A1','B1','C1','K1','L1'],triangles(['A1','B1','C1']),label='Второй треугольник',availableFromStep=0)
common182=('Почему исходные треугольники равны?','AB = A₁B₁, AC = A₁C₁ и ∠A = ∠A₁. По первому признаку △ABC = △A₁B₁C₁, поэтому соответствующие углы при B и C равны, BC = B₁C₁.','Первый признак',[15])
for part,target,steps,seg in [('а','KL = K₁L₁',[
 common182,('Какие стороны у вершин C равны?','CK = AC − AK = A₁C₁ − A₁K₁ = C₁K₁. По условию CL = C₁L₁.','Вычитание равных отрезков',[7]),('Как сравнить нужные отрезки?','Углы KCL и K₁C₁L₁ равны как углы C и C₁. Поэтому △KCL = △K₁C₁L₁ по первому признаку, откуда KL = K₁L₁.','Первый признак',[15])],['K','L']),('б','AL = A₁L₁',[
 common182,('Какие стороны сравним у вершины B?','BL = BC − LC = B₁C₁ − L₁C₁ = B₁L₁. Также AB = A₁B₁.','Вычитание равных отрезков',[7]),('Почему искомые отрезки равны?','Углы ABL и A₁B₁L₁ — равные углы B и B₁ исходных треугольников. По первому признаку △ABL = △A₁B₁L₁, значит AL = A₁L₁.','Первый признак',[15])],['A','L'])]:
 f=sc(p0,triangles('ABC')+[seg]);f1=sc(['A1','B1','C1','K1','L1'],triangles(['A1','B1','C1'])+[[z+'1' for z in seg]],label='Соответствующий отрезок второго треугольника',availableFromStep=3)
 add(182,part,'В ABC и A₁B₁C₁ равны AB и A₁B₁, AC и A₁C₁, углы A и A₁. Точки K ∈ AC, K₁ ∈ A₁C₁, L ∈ BC, L₁ ∈ B₁C₁ удовлетворяют AK = A₁K₁ и LC = L₁C₁. Докажите '+target+'.',target+'.',steps,p,v,[vv,v,f],cases=[{**v,'label':'Первый треугольник','availableFromStep':0},vv,f1],checks=[ck('equalLength',segments=[['A','K'],['A1','K1']]),ck('equalLength',segments=[['L','C'],['L1','C1']]),ck('equalLength',segments=[seg,[z+'1' for z in seg]])])

# 183. Contradiction by two equal non-adjacent base angles; no circle-line theorem needed.
p={'A':[18,15],'B':[50,15],'C':[82,15],'D':[50,56]};v=sc(p,[['A','C'],['A','D'],['B','D'],['C','D']])
add(183,'single','Три различные точки A, B, C лежат на одной прямой, D — вне неё. Докажите, что расстояния DA, DB, DC не могут быть все равными.','Хотя бы два из отрезков DA, DB, DC различаются по длине.',[
 ('Можно ли выбрать среднюю точку?','Переобозначим три точки при необходимости так, чтобы B лежала между A и C. Это не меняет утверждения о трёх расстояниях.','Порядок трёх точек на прямой',[7]),
 ('Что следует из предположения о трёх равных расстояниях?','Предположим DA = DB = DC. Тогда D равноудалена от A и B, а также от A и C. Значит, по задаче № 165 она должна лежать сразу на серединных перпендикулярах к AB и AC.','Свойство серединного перпендикуляра, № 165',[16,20]),
 ('Почему D не может быть равноудалена ещё и от B?','По доказанному в № 165 равенства DA = DB и DA = DC означают, что D лежит на серединных перпендикулярах к AB и AC. Эти прямые различны: их основания — разные середины AB и AC. Но через D можно провести только один перпендикуляр к прямой AC. Получено противоречие.','Свойство № 165 и единственность перпендикуляра',[16,23]),
 ('Каков логический вывод?','Предположение о равенстве всех трёх отрезков невозможно. Следовательно среди DA, DB, DC найдётся пара неравных.','Доказательство от противного',[15])],p,v,checks=[ck('collinear',points=['A','B','C']),ck('equalLength',segments=[['D','A'],['D','C']])])

# 184. Compare base-side small triangles, then the requested crossing segments.
p={'A':[50,59],'B':[19,13],'C':[81,13],'X':[50,13]};p.update(P=lerp(p['B'],p['A'],.61),Q=lerp(p['C'],p['A'],.61));v=sc(p,triangles('ABC')+[['X','P'],['X','Q']],angleArcs=[arc('X','P','B',10,1),arc('X','Q','C',13,1)]);f=sc(['A','B','C','P','Q','X'],triangles('ABC')+[['B','Q'],['C','P']])
add(184,'single','В равнобедренном ABC с AB = AC точка X — середина BC, P ∈ AB, Q ∈ AC, причём ∠PXB = ∠QXC. Докажите BQ = CP.','BQ = CP.',[
 ('Какие углы при концах основания равны?','∠PBX = ∠QCX: это углы при основании равнобедренного ABC. Кроме того BX = CX, поскольку X — середина BC.','Углы при основании и середина',[18,17]),
 ('Какие малые треугольники равны?','В △BXP и △CXQ равны BX = CX и два прилежащих к этим сторонам угла: при X по условию, при B и C по предыдущему шагу. По второму признаку треугольники равны, значит BP = CQ.','Второй признак',[19]),
 ('Как перейти к BQ и CP?','В △BCP и △CBQ сторона BC общая, BP = CQ, ∠CBP = ∠BCQ как углы при основании ABC. По первому признаку треугольники равны, значит CP = BQ.','Первый признак',[15])],p,v,[v,v,f],checks=[ck('equalLength',segments=[['A','B'],['A','C']]),ck('equalLength',segments=[['B','X'],['X','C']]),ck('equalLength',segments=[['B','P'],['C','Q']]),ck('equalLength',segments=[['B','Q'],['C','P']])])

# 185–188. Candidate centres/vertices are intersections; final figures exclude auxiliary clutter.
p={'P':[50,45],'H':[50,27],'O1':[50-math.sqrt(25**2-18**2),27],'O2':[50+math.sqrt(25**2-18**2),27],'_l':[8,27],'_r':[92,27],'R':[75,45]};v=sc(['P'],lines=[['_l','_r']]);s=sc(['P','O1','O2'],lines=[['_l','_r']],circles=[circle('P','R')]);f=sc(['P','O1'],lines=[['_l','_r']],circles=[circle('O1','P')]);f2=sc(['P','O2'],lines=[['_l','_r']],circles=[circle('O2','P')],label='Вторая окружность',availableFromStep=2)
add(185,'single','Постройте окружность заданного радиуса r > 0, проходящую через данную точку P, с центром на данной прямой a.','Центры — пересечения a с окружностью (P; r). Решений 0, 1 или 2.',[
 ('Какое условие должен выполнять центр?','Если центр O лежит на a, а искомая окружность проходит через P и имеет радиус r, то OP = r. Значит O должен лежать также на окружности с центром P и радиусом r.','Определение окружности',[21]),
 ('Как найти все возможные центры?','Проведём вспомогательную окружность (P; r). Каждую её точку пересечения с a принимаем за возможный центр O.','Пересечение двух условий',[21,22]),
 ('Как построить искомые окружности?','Из каждого полученного O проведём окружность радиуса r. Она проходит через P, потому что OP = r. Любое решение имеет такой центр, поэтому все решения найдены.','Необходимость и достаточность построения',[21]),
 ('Сколько решений возможно?','Число решений равно числу общих точек прямой a и вспомогательной окружности: при двух пересечениях — два, при касании — одно, при отсутствии общих точек — ноль. Если P лежит на a, прямая проходит через центр вспомогательной окружности и даёт два центра искомых окружностей.','Пересечение прямой и окружности; проверка числа точек построения',[16,21])],p,v,[s,s,f,f2],cases=[{**f,'label':'Первая окружность','availableFromStep':2},f2],checks=[ck('equalLength',segments=[['P','O1'],['P','O2'],['P','R']]),ck('collinear',points=['_l','O1','O2','_r'])],bounds=[0,-5,100,78])
p={'A':[29,34],'B':[71,34],'O1':[50,34+math.sqrt(28**2-21**2)],'O2':[50,34-math.sqrt(28**2-21**2)],'R':[57,34]};v=sc(['A','B'],[['A','B']]);s=sc(['A','B','O1','O2'],[['A','B']],circles=[circle('A','R'),circle('B','_R')]);p['_R']=[43,34];f=sc(['A','B','O1'],[['A','B']],circles=[circle('O1','A')]);f2=sc(['A','B','O2'],[['A','B']],circles=[circle('O2','A')],label='Вторая окружность',availableFromStep=2)
add(186,'single','Постройте окружность заданного радиуса r > 0 через две различные данные точки A и B.','Центры — общие точки окружностей (A; r) и (B; r). Число решений равно числу этих общих точек: 0, 1 или 2.',[
 ('Какие расстояния должен иметь центр O?','Искомый центр удовлетворяет OA = OB = r. Значит он лежит на двух окружностях радиуса r с центрами A и B.','Определение окружности',[21]),
 ('Как найти центры?','Построим окружности (A; r) и (B; r). Каждую их общую точку O возьмём как центр искомой окружности радиуса r.','Пересечение двух условий',[21,22]),
 ('Почему построение верно и полно?','Для найденного O выполнены OA = OB = r, поэтому искомая окружность проходит через обе точки. И наоборот, центр любого решения обязан быть общей точкой вспомогательных окружностей.','Проверка построения',[21]),
 ('Как определить число решений?','Если у вспомогательных окружностей две общие точки, получаем два центра; если одна — один; если общих точек нет, решения нет. Точки A и B предполагаются различными. При совпадении A и B задача сводится к выбору любого центра на окружности (A; r), и решений бесконечно много.','Число общих точек окружностей при построении',[21])],p,v,[s,s,f,f2],cases=[{**f,'label':'Первое решение','availableFromStep':2},f2],checks=[ck('equalLength',segments=[['O1','A'],['O1','B'],['O2','A'],['O2','B'],['A','R']])],bounds=[-15,-15,115,85])
p={'A':[48,43],'B':[50,69],'C':[48-math.sqrt(27**2-18**2),25],'C1':[48+math.sqrt(27**2-18**2),25],'P':[72,57],'Q':[99,57],'_l':[5,25],'_r':[95,25],'_R':[75,43]};v=sc(['A','B','P','Q'],[['P','Q']],lines=[['_l','_r']]);s=sc(['A','B','C','C1'],lines=[['_l','_r']],circles=[circle('A','_R')]);f=sc(['A','B','C'],triangles('ABC'),lines=[['_l','_r']]);f2=sc(['A','B','C1'],triangles(['A','B','C1']),lines=[['_l','_r']],label='Вторая допустимая вершина',availableFromStep=3)
add(187,'single','Даны прямая a, точки A, B и отрезок PQ. Постройте невырожденный треугольник ABC с C ∈ a и AC = PQ.','Вершины C — пересечения a с окружностью (A; PQ), исключая точки на прямой AB.',[
 ('Где может лежать вершина C?','Равенство AC = PQ означает, что C лежит на окружности с центром A и радиусом PQ. Одновременно C должна лежать на a.','Определение окружности',[21]),
 ('Как найти всех кандидатов?','Перенесём циркулем длину PQ и построим окружность (A; PQ). Отметим все её пересечения с a.','Перенос длины циркулем',[22]),
 ('Какие точки нужно исключить?','Если A = B или PQ = 0, невырожденный треугольник невозможен. При различных A и B отбрасываем кандидатов C на прямой AB, включая C = A или C = B. Остальные соединяем с A и B.','Три вершины треугольника не лежат на одной прямой',[14]),
 ('Сколько решений может остаться?','Прямая даёт не более двух пересечений с окружностью. После проверки невырожденности решений может быть 0, 1 или 2; каждый оставшийся треугольник удовлетворяет обоим условиям.','Проверка условий и полноты построения',[14,21])],p,v,[s,s,f,f2],cases=[{**f,'label':'Первая допустимая вершина','availableFromStep':3},f2],checks=[ck('equalLength',segments=[['A','C'],['A','C1'],['P','Q']]),ck('collinear',points=['_l','C','C1','_r'])],bounds=[0,0,115,80])
# Two circles of radius 23 with centres 24 apart.
p={'O':[40,35],'A':[64,35],'B':[90,35],'C':[52,35+math.sqrt(23**2-12**2)],'C1':[52,35-math.sqrt(23**2-12**2)],'_R':[17,35],'_S':[87,35],'P':[13,65],'Q':[36,65]};v=sc(['O','A','B','P','Q'],[['P','Q']],circles=[circle('O','_R')]);s=sc(['O','A','B','C','C1'],circles=[circle('O','_R'),circle('A','_S')]);f=sc(['O','A','B','C'],triangles('ABC'),circles=[circle('O','_R')]);f2=sc(['O','A','B','C1'],triangles(['A','B','C1']),circles=[circle('O','_R')],label='Вторая допустимая вершина',availableFromStep=3)
add(188,'single','Даны окружность, точки A, B и отрезок PQ. Постройте невырожденный треугольник ABC, у которого C лежит на данной окружности и AC = PQ.','Выберите C среди пересечений данной окружности с (A; PQ), исключив прямую AB.',[
 ('Как описать второе условие на C?','Так как AC = PQ, точка C принадлежит окружности с центром A и радиусом PQ.','Определение окружности',[21]),
 ('Как получить кандидатов?','Построим (A; PQ) и отметим её общие точки с данной окружностью. Каждая общая точка удовлетворяет двум условиям на C.','Пересечение условий',[21,22]),
 ('Когда кандидат даёт треугольник?','Если A и B различны и PQ > 0, оставляем только точки C, не лежащие на прямой AB. Соединяем каждую с A и B. При A = B или PQ = 0 решений нет.','Определение треугольника',[14]),
 ('Все ли случаи учтены?','У двух различных окружностей бывает 0, 1 или 2 общие точки; после исключения вырожденных случаев решений не больше двух. Если окружности совпали, подходят все их точки вне AB, и решений бесконечно много.','Полнота построения, включая совпадающие окружности',[21])],p,v,[s,s,f,f2],cases=[{**f,'label':'Первое решение','availableFromStep':3},f2],checks=[ck('equalLength',segments=[['O','C'],['O','C1'],['A','C'],['A','C1'],['P','Q']])],bounds=[0,-3,100,78])

# 189. A side intersection is not guaranteed; test membership in segment BC.
p={'A':[25,57],'B':[15,13],'C':[85,13]};a,b,c=p['A'],p['B'],p['C'];x=(sum(z*z for z in c)-sum(z*z for z in a)-2*b[1]*(c[1]-a[1]))/(2*(c[0]-a[0]));p['M']=[x,b[1]];p['H']=lerp(a,c,.5);direction=[-(c[1]-a[1]),c[0]-a[0]];p['_u']=[p['H'][i]-.6*direction[i] for i in range(2)];p['_v']=[p['H'][i]+.6*direction[i] for i in range(2)];v=sc(['A','B','C'],triangles('ABC'));s=sc(['A','B','C','H','M'],triangles('ABC'),lines=[['_u','_v']],rightAngles=[right('A','H','M')]);f=sc(['A','B','C','M'],triangles('ABC')+[['A','M']],equalSegments=[eq('A','M'),eq('M','C')])
add(189,'single','На стороне BC треугольника ABC постройте точку, находящуюся на одинаковом расстоянии от A и C.','Искомая точка — пересечение BC с серединным перпендикуляром к AC, если оно принадлежит отрезку BC.',[
 ('Где находятся точки с равными расстояниями до A и C?','По задаче № 165 это в точности точки серединного перпендикуляра к AC.','Свойство серединного перпендикуляра, доказанное в № 165',[16,20]),
 ('Как выполнить построение?','Циркулем и линейкой построим середину H стороны AC и перпендикуляр к AC через H. Проверим, пересекается ли он с прямой BC; если да, обозначим точку пересечения M.','Построения середины и перпендикуляра',[23]),
 ('Как проверить, что найдено решение задачи?','Если M принадлежит отрезку BC, то MA = MC по свойству серединного перпендикуляра; M — искомая точка. Пересечение на продолжении BC не подходит.','Проверка обоих условий',[16,20]),
 ('Всегда ли решение существует?','Не всегда: серединный перпендикуляр может не пересечь отрезок BC. Тогда решений нет; если пересекает, решение единственно, поскольку две различные прямые имеют не более одной общей точки. При BA = BC подходит сама точка B. Для частного примера отсутствия решения возьмём прямой угол C: серединный перпендикуляр к AC и BC — разные перпендикуляры к AC, поэтому не пересекаются (иначе из их общей точки было бы два перпендикуляра к AC).','Проверка принадлежности отрезку; единственность перпендикуляра',[1,16])],p,v,[s,s,f,f],checks=[ck('equalLength',segments=[['A','M'],['M','C']]),ck('collinear',points=['B','M','C']),ck('perpendicular',segments=[['A','C'],['_u','_v']])])

# 190. Every midpoint construction has its own uncluttered compass view.
p={'A':[14,30],'P':[32,30],'M':[50,30],'Q':[68,30],'B':[86,30]}
construction_views=[];construction_checks=[];labels={}
for suffix,left,middle,right_name in [('2','A','M','B'),('3','A','P','M'),('4','M','Q','B')]:
 l=left+suffix;r=right_name+suffix;mid=middle+suffix;u='U'+suffix;w='V'+suffix
 p.update({l:[38,35],r:[62,35],mid:[50,35],u:[50,35+12*math.sqrt(3)],w:[50,35-12*math.sqrt(3)]})
 labels.update({l:left,r:right_name,mid:middle,u:'U',w:'V'})
 construction_views.append(sc([l,r,mid,u,w],[[l,r]],lines=[[u,w]],circles=[circle(l,r),circle(r,l)]))
 construction_checks.extend([ck('equalLength',segments=[[l,r],[l,u],[l,w],[r,u],[r,w]]),ck('equalLength',segments=[[l,mid],[mid,r]]),ck('perpendicular',segments=[[l,r],[u,w]])])
v=sc(['A','B'],[['A','B']]);s1=sc(['A','M','B'],[['A','B']],equalSegments=[eq('A','M'),eq('M','B')]);s2=sc(['A','P','M','B'],[['A','B']],equalSegments=[eq('A','P'),eq('P','M')]);f=sc(['A','P','M','Q','B'],[['A','B']],equalSegments=[eq('A','P'),eq('P','M'),eq('M','Q'),eq('Q','B')])
add(190,'single','Циркулем и линейкой разделите данный ненулевой отрезок AB на четыре равные части.','Точки P, M, Q делят AB на четыре отрезка: AP = PM = MQ = QB = AB/4.',[
 ('Как построить середину AB?','Построим окружности с центрами A и B одного радиуса AB. Через их общие точки U и V проведём прямую. На отдельном виде показаны обе окружности и эта прямая.','Построение середины отрезка',[23]),
 ('Как отметить первую точку деления?','Пересечение UV с AB обозначим M. По свойству построения M — середина AB, поэтому AM = MB. Вернёмся к общему виду отрезка.','Обоснование построения середины',[23]),
 ('Как разделить первую половину?','Отдельно повторим то же построение для AM: окружности с центрами A и M радиуса AM дают две общие точки. Прямая через них пересекает AM в его середине P.','Построение середины',[23]),
 ('Какие части уже равны?','На общем виде отметим P. По построению AP = PM = AM/2.','Определение середины',[6]),
 ('Как разделить вторую половину?','Построим две окружности с центрами M и B радиуса MB. Прямая через их общие точки пересечёт MB в середине Q. Отдельный вид показывает эти вспомогательные окружности.','Построение середины',[23]),
 ('Почему все четыре части равны?','AM = MB = AB/2. Следовательно AP = PM = MQ = QB = AB/4. Все действия выполнены циркулем и линейкой без измерительной шкалы.','Половины равных отрезков равны',[7])],p,v,[construction_views[0],s1,construction_views[1],s2,construction_views[2],f],cases=[{**vv,'label':f'Построение середины {name} отдельно','availableFromStep':step} for vv,name,step in zip(construction_views,['AB','AM','MB'],[1,3,5])],labels=labels,checks=[ck('collinear',points=['A','P','M','Q','B']),ck('equalLength',segments=[['A','P'],['P','M'],['M','Q'],['Q','B']])]+construction_checks)

# Preserve authorship versus independent review as separate states.
prep=dict(bookId='atanasyan-2023-7-9',edition='Атанасян и др. Геометрия 7–9. Базовый уровень. 14-е изд., перераб., Просвещение, 2023',chapter=2,title='Треугольники',status='draft-content-preparation',source=dict(fileName='1701411644_geometrija_-uchebnik_-7-9-kl_-atanasjan_compressed.pdf',sha256='3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72',printedPageRange=[48,52],pdfPageRange=[49,53],pageOffset=1),review=dict(independentSource='pending',independentMathematics='pending',interactiveModels='authored-coordinate-check-pending',claude='not-performed-owner-waiver'),coverage=dict(numberedExercises=len(EX),parts=len(MODELS),first=158,last=190,missingNumberedExercises=sorted(set(range(158,191))-set(EX))),exercises=[EX[n] for n in sorted(EX)],authorSourceCheck=dict(method='Visual reading of exact-edition scans; OCR used only as a helper',printedPages=[48,49,50,51,52],figures=[97,98,99,100,101,102,103],independentApproval=False))
assert len(EX)==33 and set(EX)==set(range(158,191))
for folder,name,data in [('preparation','chapter-02-c.json',prep),('models','chapter-02-c.json',dict(schemaVersion=1,chapter=2,models=MODELS))]:
 (OUT/folder/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(exercises=len(EX),parts=len(MODELS),views=sum(len(m['model']['views']) for m in MODELS),steps=sum(len(m['didactics']['steps']) for m in MODELS),checks=sum(len(m['model']['checks']) for m in MODELS))))
