#!/usr/bin/env python3
"""Source-authored lessons and coordinate models: 2023 edition, II, 92–124.

Coordinates verify the illustrated configuration; they do not replace a proof.
The displayed explanations use only material available through textbook point 18.
"""
import json
import math
from copy import deepcopy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'geometry-course/textbook'
EX={}; MODELS=[]
def scene(points=(),segments=(),**kw):
    return dict(label=kw.pop('label','Условие'),points=list(points),segments=[list(s) for s in segments],**kw)
def tri(a='A',b='B',c='C'):return [[a,b],[b,c],[c,a]]
def eq(a,b,n=1):return dict(a=a,b=b,marks=n)
def arc(v,a,b,n=0,r=7):return dict(vertex=v,**{'from':a,'to':b},marks=n,radius=r)
def right(a,v,b):return dict(a=a,vertex=v,b=b)
def ck(t,**kw):return dict(type=t,**kw)
def equal(*pairs):return ck('equalLength',segments=[list(p) for p in pairs])
def col(*names):return ck('collinear',points=list(names))
def angle(a,v,b,d):return ck('angle',points=[a,v,b],degrees=d)
def ratio(p,q,r):return ck('distanceRatio',segments=[list(p),list(q)],ratio=r)
def pol(p,d,r):return [p[0]+r*math.cos(math.radians(d)),p[1]+r*math.sin(math.radians(d))]
def mid(a,b):return [(x+y)/2 for x,y in zip(a,b)]
def dist(a,b):return math.dist(a,b)
def fit(p):
    xs=[q[0] for q in p.values()];ys=[q[1] for q in p.values()]
    s=min(76/(max(xs)-min(xs) or 1),48/(max(ys)-min(ys) or 1))
    cx=(max(xs)+min(xs))/2;cy=(max(ys)+min(ys))/2
    return {n:[50+(q[0]-cx)*s,35+(q[1]-cy)*s] for n,q in p.items()}
def sss(ab,ac,bc):
    x=(ac*ac+ab*ab-bc*bc)/(2*ab)
    return fit({'A':[0,0],'B':[ab,0],'C':[x,math.sqrt(ac*ac-x*x)]})
def aas(a,c,base=60):
    # A,C at ends of the baseline; prescribed angles at A,C.
    x=base*math.tan(math.radians(c))/(math.tan(math.radians(a))+math.tan(math.radians(c)))
    return {'A':[0,0],'C':[base,0],'B':[x,x*math.tan(math.radians(a))]}
def step(prompt,explanation,justification,point):return (prompt,explanation,justification,point)
def add(n,part,condition,answer,steps,points,neutral,views=None,cases=None,checks=(),givens=(),labels=None,offsets=None,label_only=(),notes=()):
    page=31 if n<=93 else 32 if n<=104 else 37 if n<=116 else 38
    item={'part':part,'conditionSummary':condition,'answer':answer,'steps':[x[1] for x in steps],
          'sourceVerified':True,'mathVerified':True,
          'visual':{'initial':neutral.get('note','Отдельная модель условия; пояснения находятся рядом с чертежом.'),'stepChanges':[],'cases':[v['label'] for v in cases or []]}}
    EX.setdefault(n,dict(number=n,printedPages=[page],pdfPages=[page+1],parts=[],notes=[]))['parts'].append(item)
    EX[n]['notes'].extend(notes)
    vv={'neutral':deepcopy(neutral)}; views=views or []
    for i in range(len(steps)):
        v=deepcopy(views[i] if i<len(views) else views[-1] if views else neutral)
        v['label']=f'Шаг {i+1}';vv[f'step-{i+1}']=v
    for i,v in enumerate(cases or []):vv[f'case-{i+1}']=deepcopy(v)
    model=dict(points={k:[round(v[0],9),round(v[1],9),0] for k,v in points.items()},edges=[],planar=True,bounds=[0,0,100,70],views=vv,checks=list(checks),
               description='Чертёж именно этой задачи. Сравниваемые элементы выделяются по шагам; вычисления и доказательство размещены вне фигуры.')
    if labels:model['labels']=labels
    if offsets:model['labelOffsets']=offsets
    if label_only:model['labelOnly']=list(label_only)
    MODELS.append(dict(chapter=2,collection='main',number=n,part=part,model=model,
                       didactics={'steps':[dict(prompt=x[0],justification=x[2],theoryPoints=x[3] if isinstance(x[3],list) else [x[3]]) for x in steps]},statementGivens=list(givens)))

# 92: a freely chosen triangle; measurements are an example, not a fixed answer.
p={'M':[22,15],'N':[70,15],'P':[22,51]};edges=tri('M','N','P');v=scene(p,edges)
add(92,'а','Изобразите произвольный треугольник MNP. Перечислите его стороны и углы.','Стороны MN, NP, PM; углы ∠NMP, ∠MNP, ∠MPN.',[
 step('Какие отрезки образуют границу?','Соединяем M с N, N с P и P с M. Получаем стороны MN, NP и PM.','Определение треугольника',14),
 step('Как записать угол при каждой вершине?','При M расположен ∠NMP, при N — ∠MNP, при P — ∠MPN. Буква вершины стоит в середине записи.','Обозначение угла и элементы треугольника',[4,14])],p,v,checks=[angle('N','M','P',90)])
add(92,'б','Для своего треугольника MNP измерьте линейкой три стороны и вычислите периметр.','P = MN + NP + PM. Например, при длинах 4 см, 5 см и 3 см получаем 12 см; Ваш результат зависит от чертежа.',[
 step('Какие измерения нужны?','Совместите нуль линейки с началом каждой стороны и запишите MN, NP и PM в одной единице длины. Экранный размер модели не задаёт сантиметры на бумаге.','Измерение отрезков',8),
 step('Как связаны периметр и стороны?','Сложите три измеренные длины: P = MN + NP + PM.','Определение периметра',14),
 step('Как проверить вычисление на примере?','На выбранном примере MN = 4 см, NP = 5 см, PM = 3 см. Тогда P = 4 + 5 + 3 = 12 см. Для другого чертежа подставьте свои измерения.','Сложение длин и единицы измерения',[7,8])],p,v,checks=[ratio(['M','N'],['M','P'],4/3),ratio(['N','P'],['M','P'],5/3)])
# 93: all three semantic subparts retain the right angle at E.
p={'D':[22,55],'E':[22,15],'F':[78,15]};v=scene(p,tri('D','E','F'),rightAngles=[right('D','E','F')])
for part,cond,ans,st in [
 ('а','Перечислите стороны, противолежащие углам D, E и F.','Против ∠D лежит EF, против ∠E — DF, против ∠F — DE.',[
 step('Что означает «против угла»?','Искомая сторона не содержит вершину данного угла.','Элементы треугольника',14),step('Каковы три соответствия?','Для вершины D это EF; для E — DF; для F — DE.','Противолежащие сторона и угол',14)]),
 ('б','Укажите углы, противолежащие сторонам DE, EF и FD.','Против DE — ∠F; против EF — ∠D; против FD — ∠E.',[
 step('Как найти противолежащую вершину?','Выбираем вершину, не являющуюся концом данной стороны.','Элементы треугольника',14),step('Какие углы получились?','Стороне DE соответствует ∠DFE, стороне EF — ∠EDF, стороне FD — ∠DEF. Последний угол прямой.','Противолежащие сторона и угол',14)]),
 ('в','Укажите пары углов, прилежащих к DE, EF и FD.','К DE прилежат ∠D и ∠E; к EF — ∠E и ∠F; к FD — ∠F и ∠D.',[
 step('Где расположены прилежащие углы?','Их вершины — два конца выбранной стороны.','Прилежащие к стороне углы',14),step('Перечислите пары.','DE: ∠EDF и ∠DEF. EF: ∠DEF и ∠EFD. FD: ∠EFD и ∠EDF.','Элементы треугольника',14)])]:
    add(93,part,'Постройте треугольник DEF с прямым углом E. '+cond,ans,st,p,v,checks=[angle('D','E','F',90)],givens=['∠DEF = 90°'])
# 94: each construction has its own exact, uniformly scaled coordinates.
for part,vertex,n1,n2,l1,l2,degrees in [('а','A','B','C',4.3,2.3,23),('б','B','C','A',9,6.2,122),('в','C','A','B',3,4,90)]:
    p=fit({vertex:[0,0],n1:[l1,0],n2:pol([0,0],degrees,l2)})
    initial=scene([vertex,n1],[[vertex,n1]])
    second=scene([vertex,n1,n2],[[vertex,n1],[vertex,n2]],angleArcs=[arc(vertex,n1,n2)])
    full=scene([vertex,n1,n2],tri(vertex,n1,n2),angleArcs=[arc(vertex,n1,n2)])
    if degrees==90:full['rightAngles']=[right(n1,vertex,n2)];full.pop('angleArcs')
    lengths=f'{vertex}{n1} = {str(l1).replace(".",",")} см, {vertex}{n2} = {str(l2).replace(".",",")} см'
    add(94,part,f'Линейкой и транспортиром постройте ABC: {lengths}, ∠{vertex} = {degrees}°.',f'Треугольник построен по двум сторонам и углу {degrees}° между ними.',[
      step('С какой стороны удобно начать?',f'Постройте отрезок {vertex}{n1} длиной {str(l1).replace(".",",")} см.','Измерение отрезка',8),
      step('Где расположить вторую сторону?',f'От луча {vertex}{n1} отложите транспортиром угол {degrees}°. На второй стороне угла отметьте {n2} так, чтобы {vertex}{n2} = {str(l2).replace(".",",")} см.','Измерение угла и отрезка',[8,9]),
      step('Как завершить и проверить построение?',f'Соедините {n1} и {n2}. Сверьте обе заданные длины и угол при {vertex}; это угол именно между заданными сторонами.','Первый признак равенства объясняет определённость формы',15)],p,initial,[initial,second,full],checks=[angle(n1,vertex,n2,degrees),ratio([vertex,n1],[vertex,n2],l1/l2)],givens=[lengths,f'∠{vertex} = {degrees}°'])
# 95: image verified AB=17, not the OCR reading 11.
p=sss(17,34,24);v=scene(p,tri())
add(95,'single','В ABC сторона AB равна 17 см, AC вдвое длиннее AB, а BC на 10 см короче AC. Найдите периметр.','75 см.',[
 step('Какова длина AC?','AC = 2 · AB = 2 · 17 = 34 см.','Связь сторон по условию',14),
 step('Какова длина BC?','BC = AC − 10 = 34 − 10 = 24 см.','Связь сторон по условию',14),
 step('Как найти периметр?','P = AB + AC + BC = 17 + 34 + 24 = 75 см.','Определение периметра',14)],p,v,checks=[ratio(['A','C'],['A','B'],2),ratio(['B','C'],['A','B'],24/17)],givens=['AB = 17 см','AC = 2 · AB','BC = AC − 10 см'])
p=sss(18,12.7,17.3);v=scene(p,tri())
add(96,'single','Периметр треугольника 48 см. Одна сторона равна 18 см; две другие отличаются на 4,6 см. Найдите их.','12,7 см и 17,3 см.',[
 step('Чему равна сумма неизвестных сторон?','Сумма двух сторон: 48 − 18 = 30 см.','Определение периметра',14),
 step('Как выделить меньшую сторону?','Пусть меньшая сторона x см, тогда большая x + 4,6 см. Уравнение x + (x + 4,6) = 30 даёт 2x = 25,4, поэтому x = 12,7.','Сумма и разность двух величин',14),
 step('Как проверить вторую сторону?','Большая сторона равна 12,7 + 4,6 = 17,3 см. Проверка: 18 + 12,7 + 17,3 = 48; 17,3 − 12,7 = 4,6.','Проверка обоих условий',14)],p,v,checks=[ratio(['A','C'],['A','B'],12.7/18),ratio(['B','C'],['A','B'],17.3/18)])
p={'A':[20,15],'B':[80,15],'C':[36,56],'D':[30,20],'E':[70,20],'F':[40.666666667,47.333333333]}
v1=scene(['A','B','C'],tri(),label='Первый треугольник',availableFromStep=0)
v2=scene(['D','E','F'],tri('D','E','F'),label='Второй треугольник',availableFromStep=0)
add(97,'single','У двух треугольников разные периметры. Возможно ли равенство этих треугольников?','Нет: равные треугольники имеют одинаковые периметры.',[
 step('Что было бы при равенстве треугольников?','Все три стороны первого треугольника соответственно равнялись бы сторонам второго.','Равенство треугольников',14),
 step('Как тогда сравнились бы периметры?','Суммы трёх соответственно равных сторон были бы равны. Но один периметр больше другого; это противоречие. Следовательно, треугольники не равны.','Определение периметра; доказательство от противного',14)],p,v1,[v1,v2],cases=[v1,v2],checks=[ratio(['A','B'],['D','E'],1.5)])
# 98 central reflection, with A=42° and C=47° in the numerical subpart.
p=aas(42,47);p['E']=[2*p['B'][i]-p['A'][i] for i in (0,1)];p['D']=[2*p['B'][i]-p['C'][i] for i in (0,1)];p=fit(p)
v=scene(p,[['A','E'],['C','D'],['A','C'],['D','E']],equalSegments=[eq('A','B'),eq('B','E'),eq('C','B',2),eq('B','D',2)])
st=[step('Какие стороны попарно равны?','AB = BE и CB = BD: точка B — середина каждого из отрезков AE и DC.','Определение середины отрезка',6),step('Что известно об углах между ними?','∠ABC = ∠EBD как вертикальные углы при пересечении прямых AE и DC.','Вертикальные углы',11),step('Как применить признак равенства?','По двум сторонам и углу между ними ΔABC = ΔEBD. Соответствие вершин: A ↔ E, B ↔ B, C ↔ D.','Первый признак равенства',15)]
va=deepcopy(v);va['angleArcs']=[arc('B','A','C',1),arc('B','E','D',1)]
checks=[equal(['A','B'],['B','E']),equal(['C','B'],['B','D']),col('A','B','E'),col('C','B','D'),angle('B','E','D',42),angle('B','D','E',47)]
add(98,'а','Отрезки AE и DC пересекаются в общей середине B. Докажите равенство треугольников ABC и EBD.','ΔABC = ΔEBD по первому признаку.',st,p,v,[v,va,va],checks=checks)
add(98,'б','AE и DC имеют общую середину B. В треугольнике BDE углы D и E равны 47° и 42°. Найдите углы A и C треугольника ABC.','∠A = 42°, ∠C = 47°.',st+[
 step('Какие углы соответствуют искомым?','В равных треугольниках A соответствует E, а C соответствует D. Значит, ∠A = 42°, ∠C = 47°.','Соответствующие элементы равных треугольников',14)],p,v,[v,va,va,deepcopy(v)],checks=checks,givens=['∠BDE = 47°','∠BED = 42°'])
# 99 exact side ratio AC:CD=15:5, mirror symmetry about AD.
l=math.hypot(60,18);p={'A':[15,35],'B':[75,53],'C':[75,17],'D':[75-math.sqrt((l/3)**2-18**2),35]}
v=scene(p,[['A','B'],['A','C'],['A','D'],['B','D'],['C','D']],equalSegments=[eq('A','B'),eq('A','C')],angleArcs=[arc('A','B','D',1),arc('A','D','C',1)])
st=[step('Какие две стороны сравним?','AB = AC дано, а AD — общая сторона треугольников ABD и ACD.','Условие и общая сторона',15),step('Какое равенство углов дано на рисунке?','∠BAD = ∠DAC; это углы между названными сторонами. Поэтому ΔABD = ΔACD по первому признаку.','Первый признак равенства',15)]
checks=[equal(['A','B'],['A','C']),equal(['B','D'],['C','D']),ratio(['A','C'],['C','D'],3)]
add(99,'а','В конфигурации рисунка 58 AB = AC и ∠BAD = ∠DAC. Докажите ΔABD = ΔACD.','ΔABD = ΔACD по двум сторонам и углу между ними.',st,p,v,checks=checks)
add(99,'б','В конфигурации рисунка 58 AB = AC, ∠BAD = ∠DAC, AC = 15 см, DC = 5 см. Найдите BD и AB.','BD = 5 см, AB = 15 см.',st+[step('Какие длины соответствуют данным?','Из равенства треугольников BD = CD = 5 см. По условию AB = AC = 15 см.','Соответствующие стороны равных треугольников',14)],p,v,checks=checks,givens=['AC = 15 см','DC = 5 см'])
# 100: no assumption of parallel sides enters the proof.
p={'A':[15,15],'D':[66,15],'B':[29,15+math.sqrt(42**2-14**2)],'C':[80,15+math.sqrt(42**2-14**2)]}
v=scene(p,[['A','B'],['B','C'],['C','D'],['D','A'],['A','C']],equalSegments=[eq('B','C'),eq('A','D')],angleArcs=[arc('C','B','A',1),arc('A','C','D',1)])
st=[step('Какие стороны равны?','BC = AD по условию, AC — общая сторона.','Условие и общая сторона',15),step('Где находится данный угол?','∠BCA = ∠CAD — углы между BC, CA и AD, AC. Поэтому ΔABC = ΔCDA по первому признаку. Соответствие: A ↔ C, B ↔ D, C ↔ A.','Первый признак равенства',15)]
checks=[equal(['B','C'],['A','D']),equal(['A','B'],['C','D']),ratio(['A','D'],['C','D'],17/14)]
add(100,'а','В четырёхугольнике ABCD проведена AC (рис. 59). Даны BC = AD и ∠BCA = ∠CAD. Докажите ΔABC = ΔCDA.','ΔABC = ΔCDA по первому признаку.',st,p,v,checks=checks)
add(100,'б','На рисунке 59 BC = AD и ∠BCA = ∠CAD. Если AD = 17 см, DC = 14 см, найдите AB и BC.','AB = 14 см, BC = 17 см.',st+[step('Какие стороны соответствуют AB и BC?','В равных треугольниках AB = CD = 14 см, а BC = DA = 17 см.','Соответствующие стороны равных треугольников',14)],p,v,checks=checks,givens=['AD = 17 см','DC = 14 см'])
# 101: the two given numbers belong to ∠ABO=74° and ∠ACB=36°.
p=aas(70,36,55);p['O']=mid(p['B'],p['C']);p['D']=[p['B'][i]+p['C'][i]-p['A'][i] for i in (0,1)];p=fit(p)
v=scene(p,[['A','B'],['A','C'],['C','D'],['A','D'],['B','C']],equalSegments=[eq('A','O'),eq('O','D'),eq('B','O',2),eq('O','C',2)])
st=[step('Как сравнить углы при O?','∠AOB = ∠DOC: они вертикальные при пересечении AD и BC.','Вертикальные углы',11),step('Какие стороны прилежат к этим углам?','OA = OD и OB = OC по условию. Вместе с равными углами это даёт ΔAOB = ΔDOC по первому признаку.','Первый признак равенства',15)]
checks=[equal(['A','O'],['O','D']),equal(['B','O'],['O','C']),col('A','O','D'),col('B','O','C'),angle('A','B','O',74),angle('A','C','B',36),angle('A','C','D',110)]
va=deepcopy(v);va['angleArcs']=[arc('O','A','B',1,5),arc('O','D','C',1,5)]
add(101,'а','В конфигурации рисунка 60 AD и BC пересекаются в O; OA = OD, OB = OC, ∠ABO = 74°, ∠ACB = 36°. Докажите ΔAOB = ΔDOC.','ΔAOB = ΔDOC по первому признаку.',st,p,v,[va,va],checks=checks,givens=['∠ABO = 74°','∠ACB = 36°'])
add(101,'б','В конфигурации рисунка 60 OA = OD, OB = OC, ∠ABO = 74°, ∠ACB = 36°. Найдите ∠ACD.','110°.',st+[
 step('Как найти часть угла при C?','Из равенства треугольников ∠DCO = ∠ABO = 74°. Луч CO совпадает с CB, поэтому ∠BCD = 74°.','Соответствующие углы равных треугольников',14),
 step('Как сложить две части искомого угла?','Луч CB лежит внутри ∠ACD. Значит, ∠ACD = ∠ACB + ∠BCD = 36° + 74° = 110°.','Сложение углов',9)],p,v,[va,va,dict(v,angleArcs=[arc('C','B','D')]),dict(v,angleArcs=[arc('C','A','D',0,9)])],checks=checks,givens=['∠ABO = 74°','∠ACB = 36°'])
# 102 obtains the large triangles by SAS, without using future SSS.
p={'A':[16,18],'B':[65,13],'C':[84,52],'D':[35,57],'O':[50,35]}
v=scene(p,[['A','B'],['B','C'],['C','D'],['D','A'],['A','C'],['B','D']],equalSegments=[eq('A','O'),eq('O','C'),eq('B','O',2),eq('O','D',2)])
add(102,'single','Диагонали AC и BD имеют общую середину. Докажите ΔABC = ΔCDA.','ΔABC = ΔCDA по первому признаку.',[
 step('Как назвать точку пересечения?','Обозначим её O. Тогда BO = DO, CO = AO, а ∠BOC = ∠DOA как вертикальные.','Середина отрезка и вертикальные углы',[6,11]),
 step('Какие малые треугольники равны?','ΔBOC = ΔDOA по первому признаку. Следовательно, BC = DA и ∠BCO = ∠DAO.','Первый признак; соответствующие элементы',[15,14]),
 step('Как перейти к большим треугольникам?','Луч CO совпадает с CA, луч AO — с AC. Поэтому ∠BCA = ∠DAC. Сторона AC общая, BC = DA, значит ΔABC = ΔCDA по двум сторонам и углу между ними.','Первый признак равенства',15)],p,v,[v,dict(v,highlightSegments=tri('B','O','C')),dict(v,highlightSegments=tri())],checks=[col('A','O','C'),col('B','O','D'),equal(['A','O'],['O','C']),equal(['B','O'],['O','D']),equal(['B','C'],['A','D'])])
# 103 two separate comparison views, corresponding points carry subscripts.
p={'A':[20,15],'B':[80,15],'C':[34,55],'P':[43,15],'A1':[20,15],'B1':[80,15],'C1':[34,55],'P1':[43,15]}
v1=scene(['A','B','C','P'],tri()+[['P','C']],label='Треугольник ABC',availableFromStep=0)
v2=scene(['A1','B1','C1','P1'],tri('A1','B1','C1')+[['P1','C1']],label='Треугольник A₁B₁C₁',availableFromStep=0)
add(103,'single','Даны AB = A₁B₁, AC = A₁C₁ и ∠A = ∠A₁. На сторонах AB и A₁B₁ отмечены P и P₁, причём AP = A₁P₁. Докажите ΔBPC = ΔB₁P₁C₁.','ΔBPC = ΔB₁P₁C₁ по первому признаку.',[
 step('Равны ли исходные треугольники?','ΔABC = ΔA₁B₁C₁ по двум сторонам и углу между ними. Отсюда BC = B₁C₁ и ∠ABC = ∠A₁B₁C₁.','Первый признак равенства',15),
 step('Как сравнить BP и B₁P₁?','BP = AB − AP, B₁P₁ = A₁B₁ − A₁P₁. Вычитая равные отрезки из равных, получаем BP = B₁P₁.','Сложение длин отрезков',7),
 step('Какой угол заключён между нужными сторонами?','Лучи BP и BA совпадают, как и B₁P₁ и B₁A₁. Значит, ∠PBC = ∠P₁B₁C₁. Вместе с BP = B₁P₁ и BC = B₁C₁ это даёт требуемое равенство.','Первый признак равенства',15)],p,v1,[v1,v2,dict(v1,highlightSegments=tri('B','P','C'))],cases=[v1,v2],checks=[col('A','P','B'),col('A1','P1','B1'),equal(['A','B'],['A1','B1']),equal(['A','C'],['A1','C1']),equal(['A','P'],['A1','P1']),equal(['B','P'],['B1','P1'])],labels={'A1':'A₁','B1':'B₁','C1':'C₁','P1':'P₁'})
# 104: supplement the equal angles obtained from SAS.
p={'A':[16,35],'C':[80,58],'D':[80,12],'B':[44,45.0625],'E':[44,24.9375]}
v=scene(p,[['A','C'],['A','D'],['B','D'],['E','C']],equalSegments=[eq('A','C'),eq('A','D'),eq('A','B',2),eq('A','E',2)])
add(104,'single','На сторонах угла CAD расположены B ∈ AC и E ∈ AD; AC = AD и AB = AE. Докажите ∠CBD = ∠DEC.','∠CBD = ∠DEC.',[
 step('Какие треугольники содержат известные равные стороны?','В треугольниках ABD и AEC имеем AB = AE, AD = AC и общий угол при A.','Условие и общий угол',15),
 step('Что следует из первого признака?','ΔABD = ΔAEC. Поэтому ∠ABD = ∠AEC.','Первый признак и соответствующие углы',[15,14]),
 step('Как связаны эти углы с искомыми?','Лучи BA и BC противоположны, как и EA и ED. Поэтому ∠CBD = 180° − ∠ABD, а ∠DEC = 180° − ∠AEC. Вычитая равные углы из 180°, получаем равные результаты.','Смежные углы',11)],p,v,[dict(v,highlightSegments=tri('A','B','D')),dict(v,highlightSegments=tri('A','E','C')),v],checks=[col('A','B','C'),col('A','E','D'),equal(['A','C'],['A','D']),equal(['A','B'],['A','E']),equal(['B','D'],['E','C'])])
# 105 perpendiculars from opposite half-planes.
p={'_L':[12,35],'_R':[88,35],'a':[87,37],'A':[31,58],'B':[68,12],'H':[31,35],'K':[68,35]}
v=scene(['a','A','B'],lines=[['_L','_R']])
vh=scene(['a','A','B','H'],[['A','H']],lines=[['_L','_R']],rightAngles=[right('A','H','_R')])
vk=scene(['a','A','B','H','K'],[['A','H'],['B','K']],lines=[['_L','_R']],rightAngles=[right('A','H','_R'),right('B','K','_R')])
add(105,'single','Проведите прямую a. Выберите A и B по разные стороны от неё и опустите из каждой точки перпендикуляр с помощью угольника.','AH ⟂ a и BK ⟂ a; H и K — основания перпендикуляров.',[
 step('Как расположить угольник для точки A?','Приложите один катет угольника к a и передвиньте его вдоль прямой, чтобы другой катет прошёл через A. Отметьте основание H и проведите AH.','Построение перпендикуляра из точки',16),
 step('Как повторить построение для B?','С другой стороны прямой тем же способом проведите BK, где K лежит на a.','Построение перпендикуляра из точки',16),
 step('Как проверить результат?','У основания каждого отрезка угол с a равен 90°. Каждый из этих перпендикуляров из своей точки единственный.','Теорема о перпендикуляре',16)],p,v,[vh,vk,vk],checks=[col('_L','H','K','_R'),angle('A','H','_R',90),angle('B','K','_R',90)],label_only=['a'])
# 106 one median at a time; all three are accessible without overlaying them.
p={'A':[45,57],'B':[18,14],'C':[82,14]};p.update(M=mid(p['B'],p['C']),N=mid(p['A'],p['C']),P=mid(p['A'],p['B']))
v=scene(['A','B','C'],tri())
med=[]
for name,vertex,x,y in [('M','A','B','C'),('N','B','A','C'),('P','C','A','B')]:
    med.append(scene(['A','B','C',name],tri()+[[vertex,name]],equalSegments=[eq(x,name),eq(name,y)],label=f'Медиана {vertex}{name}',availableFromStep=len(med)+2))
add(106,'single','Постройте произвольный треугольник, линейкой найдите середины его сторон и проведите все три медианы.','AM, BN и CP — три медианы; M, N и P — середины BC, AC и AB.',[
 step('Как найти середину стороны линейкой?','Измерьте сторону и от её конца отложите половину длины. Так отметьте M на BC, N на AC и P на AB.','Середина отрезка',6),
 step('Как провести медиану из A?','Соедините A с M. Поскольку BM = MC, отрезок AM — медиана.','Определение медианы',17),
 step('Как провести медиану из B?','Соедините B с N. Равенство AN = NC означает, что BN — медиана.','Определение медианы',17),
 step('Как провести медиану из C?','Соедините C с P. Равенство AP = PB означает, что CP — медиана. В модели каждая медиана показана отдельно; на бумаге можно нанести все три.','Определение медианы',17)],p,v,[scene(['A','B','C','M','N','P'],tri()),*med],cases=med,checks=[col('B','M','C'),col('A','N','C'),col('A','P','B'),equal(['B','M'],['M','C']),equal(['A','N'],['N','C']),equal(['A','P'],['P','B'])])
# 107 the coordinates use length weights only to draw exact bisectors;
# the learner construction uses a protractor and the definition.
p={'A':[40,58],'B':[15,14],'C':[85,14]}
def bisector_foot(a,b,c):
    ab=dist(a,b);ac=dist(a,c)
    return [(ac*b[i]+ab*c[i])/(ab+ac) for i in (0,1)]
p.update(D=bisector_foot(p['A'],p['B'],p['C']),E=bisector_foot(p['B'],p['A'],p['C']),F=bisector_foot(p['C'],p['A'],p['B']))
v=scene(['A','B','C'],tri());bis=[]
for foot,vertex,x,y in [('D','A','B','C'),('E','B','A','C'),('F','C','A','B')]:
    bis.append(scene(['A','B','C',foot],tri()+[[vertex,foot]],angleArcs=[arc(vertex,x,foot,1),arc(vertex,foot,y,1)],label=f'Биссектриса {vertex}{foot}',availableFromStep=len(bis)+2))
add(107,'single','Начертите треугольник. Транспортиром и линейкой постройте все его биссектрисы.','AD, BE и CF делят соответственно углы A, B и C пополам.',[
 step('Как определить направление биссектрисы?','Измерьте угол транспортиром и разделите число градусов на два. От одной стороны угла отложите полученную половину внутрь треугольника.','Определение биссектрисы угла',6),
 step('Как получить биссектрису треугольника из A?','Проведите луч в найденном направлении из A до встречи с BC в точке D. Отрезок AD — биссектриса.','Биссектриса треугольника',17),
 step('Что построить из B?','Повторите измерение и деление пополам для ∠B; пересечение нужного луча с AC обозначьте E. Получаем BE.','Биссектриса треугольника',17),
 step('Как завершить построение?','Аналогично постройте CF из C до AB. Проверьте транспортиром равенство двух частей каждого угла. В модели три построения разделены по сценам.','Определение и проверка биссектрисы',17)],p,v,[v,*bis],cases=bis,checks=[col('B','D','C'),col('A','E','C'),col('A','F','B')])
# 108 all six altitudes, with exterior feet in the obtuse example.
p={'A':[46,57],'B':[17,15],'C':[83,15],'M':[40,30],'N':[17,15],'P':[83,15]}
def projection(a,b,c):
    u=[c[i]-b[i] for i in (0,1)];t=sum((a[i]-b[i])*u[i] for i in (0,1))/sum(z*z for z in u)
    return [b[i]+t*u[i] for i in (0,1)]
alt=[];checks=[]
for vertices,feet,triangle_label in [(('A','B','C'),('H1','H2','H3'),'ABC'),(('M','N','P'),('K1','K2','K3'),'MNP')]:
    for i,vertex in enumerate(vertices):
        x,y=[z for z in vertices if z!=vertex];foot=feet[i];p[foot]=projection(p[vertex],p[x],p[y])
        sv=scene([*vertices,foot],tri(*vertices)+[[vertex,foot]],rightAngles=[right(vertex,foot,y)],label=f'{triangle_label}: высота {vertex}{foot}',availableFromStep=len(alt)+2)
        # Extension only where the foot is outside the side.
        vx=p[y][0]-p[x][0];vy=p[y][1]-p[x][1];t=((p[foot][0]-p[x][0])*vx+(p[foot][1]-p[x][1])*vy)/(vx*vx+vy*vy)
        if t<0:sv['dashSegments']=[[x,foot]]
        if t>1:sv['dashSegments']=[[y,foot]]
        alt.append(sv);checks += [col(x,foot,y),angle(vertex,foot,y,90)]
v=scene(['A','B','C'],tri())
steps=[step('Что является основанием высоты?','Это точка на прямой противоположной стороны, в которой проведённый из вершины отрезок образует прямой угол. У тупоугольного треугольника основание может лежать за концом стороны.','Определение высоты',17)]
for vertex,foot,line,explanation in [('A','H₁','BC','Основание лежит на стороне BC.'),('B','H₂','AC','Основание лежит на стороне AC.'),('C','H₃','AB','Основание лежит на стороне AB.'),('M','K₁','NP','В треугольнике MNP угол M тупой; основание этой высоты лежит на NP.'),('N','K₂','MP','Продлите MP за M: основание высоты лежит на этом продолжении.'),('P','K₃','MN','Продлите MN за M: основание высоты лежит на этом продолжении.')]:
    steps.append(step(f'Как провести высоту из {vertex}?',f'Угольником проведите из {vertex} перпендикуляр к прямой {line}; его основание обозначьте {foot}. {explanation}','Единственность перпендикуляра; определение высоты',[16,17]))
add(108,'single','Начертите остроугольный ABC и треугольник MNP с тупым углом M. Угольником проведите по три высоты в каждом.','У ABC основания всех трёх высот находятся на сторонах. У MNP высота из M идёт к NP, а высоты из N и P — к продолжениям MP и MN.',steps,p,v,[v,*alt],cases=alt,checks=checks,labels={'H1':'H₁','H2':'H₂','H3':'H₃','K1':'K₁','K2':'K₂','K3':'K₃'},notes=['Каждая из шести высот вынесена в отдельную сцену; обе формы треугольника полностью представлены.'])
# 109 free constructions: exact examples of each requested vertex angle.
for part,degrees,name in [('а',60,'острым'),('б',90,'прямым'),('в',120,'тупым')]:
    p=fit({'A':[0,0],'B':pol([0,0],-90-degrees/2,1),'C':pol([0,0],-90+degrees/2,1)})
    v=scene(['A','B'],[['A','B']]);full=scene(p,tri(),equalSegments=[eq('A','B'),eq('A','C')],angleArcs=[arc('A','B','C')])
    angle_view=scene(['A','B'],rays=[['A','B'],['A','C']],angleArcs=[arc('A','B','C')])
    if degrees==90:
        full.pop('angleArcs');full['rightAngles']=[right('B','A','C')]
        angle_view.pop('angleArcs');angle_view['rightAngles']=[right('B','A','C')]
    add(109,part,f'Постройте равнобедренный треугольник, у которого угол напротив основания является {name}.',f'Например, AB = AC и ∠A = {degrees}°; основание — BC.',[
      step('Как выбрать нужный угол?',f'Постройте угол A величиной {degrees}°. Такой угол является {name}.','Виды углов',9),
      step('Как обеспечить равные боковые стороны?','На сторонах угла отложите от A равные отрезки AB и AC, затем соедините B с C.','Определение равнобедренного треугольника',18)],p,v,[angle_view,full],checks=[equal(['A','B'],['A','C']),angle('B','A','C',degrees)])
# 110 equal perpendiculars on the same side; ∠ADB=44° exactly.
h=45*math.tan(math.radians(44));p={'B':[25,12],'D':[70,12],'A':[25,12+h],'C':[70,12+h],'a':[86,14]}
v=scene(['A','B','C','D','a'],[['A','B'],['C','D']],lines=[['B','D']],equalSegments=[eq('A','B'),eq('C','D')],rightAngles=[right('A','B','D'),right('C','D','B')])
full=scene(['A','B','C','D','a'],[['A','B'],['C','D'],['A','D'],['B','C']],lines=[['B','D']],equalSegments=[eq('A','B'),eq('C','D')])
st=[step('Какие треугольники следует сравнить?','Соединим A с D и C с B. В треугольниках ABD и CDB стороны AB = CD, BD — общая.','Условие и общая сторона',15),
 step('Что известно об углах между этими сторонами?','∠ABD = ∠CDB = 90°, поскольку AB и CD перпендикулярны прямой a. Значит, ΔABD = ΔCDB по первому признаку.','Перпендикулярность; первый признак',[12,15])]
checks=[equal(['A','B'],['C','D']),angle('A','B','D',90),angle('C','D','B',90),angle('A','D','B',44),angle('A','B','C',46)]
add(110,'а','A и C лежат по одну сторону от a; равные перпендикуляры AB и CD имеют основания на a. Докажите ΔABD = ΔCDB.','ΔABD = ΔCDB по первому признаку.',st,p,v,[full,full],checks=checks,label_only=['a'])
add(110,'б','Равные перпендикуляры AB и CD проведены к a с одной стороны; ∠ADB = 44°. Найдите ∠ABC.','46°.',st+[
 step('Как найти угол DBC?','Из равенства треугольников ∠DBC = ∠ADB = 44°.','Соответствующие углы',14),
 step('Какую часть прямого угла он занимает?','Луч BC проходит внутри прямого ∠ABD. Поэтому ∠ABC = 90° − ∠DBC = 90° − 44° = 46°.','Сложение углов',9)],p,v,[full,full,dict(full,angleArcs=[arc('B','D','C')]),dict(full,angleArcs=[arc('B','A','C')])],checks=checks,label_only=['a'],givens=['∠ADB = 44°'])
# 111 reflected median; required numerical answer is 56+40, not their difference.
p0=aas(40,56,64);p={'B':p0['A'],'C':p0['C'],'A':p0['B']};p['D']=mid(p['B'],p['C']);p['E']=[2*p['D'][i]-p['A'][i] for i in (0,1)];p=fit(p)
v=scene(p,tri()+[['A','E'],['C','E']],equalSegments=[eq('A','D'),eq('D','E'),eq('B','D',2),eq('D','C',2)])
st=[step('Какие пары отрезков равны?','BD = DC, так как AD — медиана. AD = DE по построению.','Медиана и условие',[17,6]),
 step('Какие углы между ними равны?','∠ADB = ∠EDC как вертикальные. Поэтому ΔABD = ΔECD по двум сторонам и углу между ними.','Вертикальные углы и первый признак',[11,15])]
checks=[col('B','D','C'),col('A','D','E'),equal(['B','D'],['D','C']),equal(['A','D'],['D','E']),angle('A','C','D',56),angle('A','B','D',40),angle('A','C','E',96)]
add(111,'а','Медиану AD треугольника ABC продлили за D до E так, что DE = AD; проведено CE. Докажите ΔABD = ΔECD.','ΔABD = ΔECD по первому признаку.',st,p,v,checks=checks)
add(111,'б','Медиана AD продолжена за D до E, DE = AD, проведено CE. Если ∠ACD = 56° и ∠ABD = 40°, найдите ∠ACE.','96°.',st+[
 step('Какой угол при C равен данному углу B?','В равных треугольниках ∠ECD = ∠ABD = 40°.','Соответствующие углы',14),
 step('Как составить искомый угол?','A и E лежат по разные стороны от BC, поэтому луч CD разделяет ∠ACE на ∠ACD и ∠DCE. Значит, ∠ACE = 56° + 40° = 96°.','Сложение углов',9)],p,v,[v,v,dict(v,angleArcs=[arc('C','D','E')]),dict(v,angleArcs=[arc('C','A','E',0,10)])],checks=checks,givens=['∠ACD = 56°','∠ABD = 40°'])
# 112–114 numeric isosceles problems; lengths are kept out of the drawings.
p=fit({'A':[0,math.sqrt(20**2-5**2)],'B':[-5,0],'C':[5,0]});v=scene(p,tri(),equalSegments=[eq('A','B'),eq('A','C')])
add(112,'single','Основание равнобедренного треугольника вдвое короче боковой стороны. Периметр равен 50 см. Найдите три стороны.','Основание 10 см; боковые стороны по 20 см.',[
 step('Как выразить стороны одной величиной?','Пусть основание x см. Тогда каждая из двух боковых сторон равна 2x см.','Определение равнобедренного треугольника и условие',18),
 step('Какое уравнение даёт периметр?','x + 2x + 2x = 50, поэтому 5x = 50 и x = 10.','Периметр треугольника',14),
 step('Каковы все стороны?','Основание равно 10 см, каждая боковая сторона — 20 см. Проверка: 10 + 20 + 20 = 50 см.','Проверка условия',14)],p,v,checks=[equal(['A','B'],['A','C']),ratio(['A','B'],['B','C'],2)])
p={'A':[50,55],'B':[35,35],'C':[65,35],'D':[50,35-15*math.sqrt(3)]}
v=scene(p,tri()+[['B','D'],['C','D']],equalSegments=[eq('A','B'),eq('A','C'),eq('B','C',2),eq('B','D',2),eq('C','D',2)])
add(113,'single','ABC равнобедренный с основанием BC и периметром 40 см. На BC построен равносторонний BCD с периметром 45 см. Найдите AB и BC.','AB = 12,5 см, BC = 15 см.',[
 step('Как найти общую сторону BC?','В равностороннем BCD три стороны равны. Поэтому BC = 45 : 3 = 15 см.','Равносторонний треугольник и периметр',[18,14]),
 step('Как найти боковую сторону ABC?','AB = AC, поэтому 2 · AB + BC = 40. Следовательно, AB = (40 − 15) : 2 = 12,5 см.','Равнобедренный треугольник и периметр',[18,14]),
 step('Как проверить ответ?','12,5 + 12,5 + 15 = 40, а 15 + 15 + 15 = 45. Оба периметра совпадают с условием.','Подстановка найденных длин',14)],p,v,checks=[equal(['A','B'],['A','C']),equal(['B','C'],['B','D'],['C','D']),ratio(['A','B'],['B','C'],12.5/15)])
p={'A':[50,56],'B':[20,16],'C':[80,16],'M':[50,16]};v=scene(p,tri()+[['A','M']],equalSegments=[eq('A','B'),eq('A','C'),eq('B','M',2),eq('M','C',2)])
add(114,'single','В равнобедренном ABC с основанием BC проведена медиана AM. Периметры ABC и ABM равны 32 см и 24 см. Найдите AM.','8 см.',[
 step('Как выразить половину большого периметра?','AB = AC и BM = MC. Поэтому 32 = AB + AC + BC = 2 · AB + 2 · BM, откуда AB + BM = 16 см.','Равнобедренный треугольник и медиана',[18,17]),
 step('Что добавляется в малом треугольнике?','Периметр ABM равен AB + BM + AM = 24 см. Значит, AM = 24 − 16 = 8 см.','Определение периметра',14)],p,v,checks=[equal(['A','B'],['A','C']),equal(['B','M'],['M','C']),col('B','M','C'),ratio(['A','M'],['B','M'],8/6)])
# 115 the common perpendicular median supplies SAS, no converse theorem assumed.
v115 = dict(v, equalSegments=[eq('B','M'),eq('M','C')], rightAngles=[right('A','M','C')])
add(115,'single','Докажите: если медиана треугольника одновременно является его высотой, этот треугольник равнобедренный.','Боковые стороны, прилегающие к проведённой медиане, равны.',[
 step('Как обозначить данные?','Пусть AM — и медиана, и высота ABC. Тогда BM = CM, AM ⟂ BC.','Определения медианы и высоты',17),
 step('Какие треугольники сравним?','В ABM и ACM сторона AM общая, BM = CM, ∠AMB = ∠AMC = 90°. Поэтому ΔABM = ΔACM по первому признаку.','Первый признак равенства',15),
 step('Какое равенство сторон получим?','AB = AC как соответствующие стороны равных треугольников. Значит, ABC равнобедренный с основанием BC.','Равные треугольники и определение равнобедренного',[14,18])],p,v115,[v115,v115,dict(v,rightAngles=[right('A','M','C')])],checks=[equal(['B','M'],['M','C']),col('B','M','C'),angle('A','M','B',90),equal(['A','B'],['A','C'])])
# 116 the two equal angles are at D; D is not on the base.
p={'A':[50,59],'B':[80,14],'C':[20,14],'D':[50,29]};v=scene(p,tri()+[['A','D'],['B','D'],['C','D']],equalSegments=[eq('B','D'),eq('C','D')],angleArcs=[arc('D','A','B',1,6),arc('D','C','A',1,6)])
add(116,'single','На рисунке 72 точка D внутри ABC; BD = CD и ∠ADB = ∠CDA. Докажите, что ABC равнобедренный.','AB = AC, поэтому ABC равнобедренный.',[
 step('Какие стороны сравниваемых треугольников известны?','В треугольниках ADB и ADC сторона AD общая, DB = DC по условию.','Условие и общая сторона',15),
 step('Как использовать равенство отмеченных углов?','∠ADB = ∠ADC — углы между названными сторонами. Поэтому ΔADB = ΔADC по первому признаку.','Первый признак равенства',15),
 step('Почему весь треугольник равнобедренный?','Из равенства треугольников AB = AC. Это две равные стороны ABC.','Определение равнобедренного треугольника',18)],p,v,checks=[equal(['B','D'],['C','D']),equal(['A','B'],['A','C'])])
# 117 opposite rays faithfully reproduce both marked exterior angles of fig.73a.
p={'A':[40,50],'C':[40,20],'B':[40+15*math.tan(math.radians(50)),35]}
p.update(U=pol(p['A'],140,18),V=[40,65],W=[40,7])
v=scene(['A','B','C'],tri(),dashSegments=[['A','U'],['A','V'],['C','W']],equalSegments=[eq('A','B'),eq('B','C')],angleArcs=[arc('C','B','W',0,8),arc('A','U','V',0,9)])
add(117,'single','На рисунке 73а AB = BC. Внешний угол при C, смежный с ∠ACB, равен 130°; угол 2 вертикален ∠BAC. Найдите угол 2.','50°.',[
 step('Чему равен внутренний угол при C?','∠ACB = 180° − 130° = 50°, потому что он смежный с углом 1.','Смежные углы',11),
 step('Что известно об угле при A?','AB = BC, значит основание равнобедренного треугольника — AC. Углы при нём равны: ∠BAC = ∠ACB = 50°.','Углы при основании равнобедренного треугольника',18),
 step('Как связан угол 2 с внутренним углом?','Угол 2 вертикален ∠BAC, поэтому также равен 50°.','Вертикальные углы',11)],p,v,checks=[equal(['A','B'],['B','C']),col('U','A','B'),col('V','A','C','W'),angle('B','C','W',130),angle('U','A','V',50)],givens=['∠1 = 130°'])
# 118 symmetric perpendiculars, with exact central angle 105°.
h=25/math.tan(math.radians(52.5));p={'N':[25,15],'Q':[75,15],'O':[50,15],'M':[25,15+h],'P':[75,15+h],'b':[88,17]}
v=scene(['N','Q','O','M','P','b'],[['M','N'],['P','Q'],['O','M'],['O','P'],['M','P']],lines=[['N','Q']],rightAngles=[right('M','N','O'),right('P','Q','O')],equalSegments=[eq('M','N'),eq('P','Q'),eq('N','O',2),eq('O','Q',2)])
st=[step('Какие малые треугольники равны?','В MNO и PQO имеем MN = PQ, NO = QO и ∠MNO = ∠PQO = 90°. Поэтому ΔMNO = ΔPQO по первому признаку.','Перпендикулярность, середина и первый признак',[12,6,15]),
 step('Как связаны OM и OP?','OM = OP как соответствующие стороны равных треугольников. Поэтому треугольник MOP равнобедренный и ∠OMP = ∠OPM.','Соответствующие стороны и углы при основании',[14,18])]
checks=[equal(['M','N'],['P','Q']),equal(['N','O'],['O','Q']),equal(['O','M'],['O','P']),col('N','O','Q'),angle('M','N','O',90),angle('P','Q','O',90),angle('M','O','P',105),angle('N','O','M',37.5)]
add(118,'а','M и P лежат по одну сторону от b; MN и PQ — равные перпендикуляры к b, O — середина NQ. Докажите ∠OMP = ∠OPM.','∠OMP = ∠OPM.',st,p,v,checks=checks,label_only=['b'])
add(118,'б','M и P по одну сторону от b; MN = PQ и оба отрезка перпендикулярны b. O — середина NQ, ∠MOP = 105°. Найдите ∠NOM.','37,5°.',st+[
 step('Какие углы у прямой b равны?','Из ΔMNO = ΔPQO получаем ∠NOM = ∠QOP. Обозначим их общую величину x.','Соответствующие углы',14),
 step('Как используют развёрнутый угол NOQ?','Лучи OM и OP делят развёрнутый угол NOQ на x, 105° и x. Поэтому 2x + 105° = 180°, откуда x = 37,5°.','Сложение углов в развёрнутом угле',9)],p,v,[v,v,v,dict(v,angleArcs=[arc('O','N','M',1),arc('O','P','Q',1),arc('O','M','P',0,10)])],checks=checks,label_only=['b'],givens=['∠MOP = 105°'])
# 119 independent views avoid crowding eight corresponding point labels.
p={'A':[37,57],'B':[18,15],'C':[82,15],'M':[50,15],'A1':[37,57],'B1':[18,15],'C1':[82,15],'M1':[50,15]}
v1=scene(['A','B','C','M'],tri()+[['A','M']],equalSegments=[eq('B','M'),eq('M','C')],label='Медиана AM',availableFromStep=0)
v2=scene(['A1','B1','C1','M1'],tri('A1','B1','C1')+[['A1','M1']],equalSegments=[eq('B1','M1'),eq('M1','C1')],label='Медиана A₁M₁',availableFromStep=0)
add(119,'single','Докажите, что у равных треугольников медианы к соответствующим равным сторонам равны.','Если ΔABC = ΔA₁B₁C₁, то медианы AM и A₁M₁ к BC и B₁C₁ равны.',[
 step('Как сравнить половины соответствующих сторон?','Обозначим медианы AM и A₁M₁. Из BC = B₁C₁ следует BM = BC : 2 = B₁C₁ : 2 = B₁M₁.','Медиана и равенство соответствующих сторон',[17,14]),
 step('Что ещё равно в треугольниках ABM и A₁B₁M₁?','AB = A₁B₁, ∠ABM = ∠A₁B₁M₁, поскольку это соответствующие стороны и углы исходных равных треугольников.','Равные треугольники',14),
 step('Какой признак завершает доказательство?','ΔABM = ΔA₁B₁M₁ по двум сторонам и углу между ними. Отсюда AM = A₁M₁. Выбор пары соответствующих сторон был произвольным, поэтому утверждение верно для каждой из трёх пар медиан.','Первый признак равенства',15)],p,v1,[v1,v2,v1],cases=[v1,v2],checks=[equal(['B','M'],['M','C']),equal(['B1','M1'],['M1','C1']),equal(['A','M'],['A1','M1'])],labels={'A1':'A₁','B1':'B₁','C1':'C₁','M1':'M₁'})
# 120 proof uses only two isosceles triangles, not the later angle-sum theorem.
p={'M':[50,18],'B':[21,18],'C':[79,18],'A':pol([50,18],70,29)}
v=scene(p,tri()+[['A','M']],equalSegments=[eq('A','M'),eq('B','M'),eq('M','C')])
add(120,'single','Медиана AM треугольника ABC равна BM. Докажите, что один угол ABC равен сумме двух остальных.','∠BAC = ∠ABC + ∠ACB.',[
 step('Какие три отрезка равны?','BM = CM, так как AM — медиана; по условию AM = BM. Поэтому AM = BM = CM.','Медиана и условие',17),
 step('Что даёт равнобедренный ABM?','AM = BM, значит ∠BAM = ∠ABM. Луч BM совпадает с BC, поэтому ∠BAM = ∠ABC.','Углы при основании равнобедренного треугольника',18),
 step('Что даёт равнобедренный ACM?','AM = CM, значит ∠MAC = ∠ACM. Луч CM совпадает с CB, поэтому ∠MAC = ∠ACB.','Углы при основании равнобедренного треугольника',18),
 step('Как собрать весь угол A?','Медиана AM проходит внутри ∠BAC. Следовательно, ∠BAC = ∠BAM + ∠MAC = ∠ABC + ∠ACB.','Сложение углов',9)],p,v,[v,dict(v,angleArcs=[arc('A','B','M',1),arc('B','A','M',1)]),dict(v,angleArcs=[arc('A','M','C',1),arc('C','A','M',1)]),v],checks=[equal(['A','M'],['B','M'],['M','C']),col('B','M','C')])
# 121 equality, without invoking the not-yet-proved sum of angles.
p={'A':[50,14+25*math.sqrt(3)],'B':[25,14],'C':[75,14]};v=scene(p,tri(),equalSegments=[eq('A','B'),eq('B','C'),eq('A','C')])
add(121,'single','Докажите равенство всех углов равностороннего треугольника.','∠A = ∠B = ∠C.',[
 step('Что следует из AB = AC?','Рассматриваем ABC как равнобедренный с основанием BC. Тогда ∠B = ∠C.','Углы при основании',18),
 step('Как сравнить с ними угол A?','Равенство AB = BC позволяет взять основанием AC; тогда ∠A = ∠C. Значит, все три угла равны.','Углы при основании',18)],p,v,checks=[equal(['A','B'],['B','C'],['A','C'])])
# 122 the two small triangles meet at C with opposite rays.
p={'A':[50,60],'B':[80,45],'C':[50,30],'D':[38,24],'E':[50,18]}
v=scene(p,tri()+[['C','D'],['D','E'],['E','C']],equalSegments=[eq('A','B'),eq('B','C'),eq('C','D',2),eq('D','E',2)])
add(122,'single','На рисунке 73б A, C, E лежат на одной прямой, B, C, D — на другой; C находится между A и E и между B и D. Даны AB = BC и CD = DE. Докажите ∠BAC = ∠CED.','∠BAC = ∠CED.',[
 step('Какие углы равны в верхнем треугольнике?','AB = BC, поэтому ∠BAC = ∠ACB как углы при основании AC.','Свойство равнобедренного треугольника',18),
 step('Как перейти через вершину C?','∠ACB = ∠DCE как вертикальные углы двух пересекающихся прямых.','Вертикальные углы',11),
 step('Какие углы равны в нижнем треугольнике?','CD = DE, поэтому ∠DCE = ∠CED как углы при основании CE. Объединяя три равенства, получаем ∠BAC = ∠CED.','Свойство равнобедренного треугольника',18)],p,v,[dict(v,highlightSegments=tri()),dict(v,angleArcs=[arc('C','A','B',1,6),arc('C','D','E',1,6)]),dict(v,highlightSegments=tri('C','D','E'))],checks=[equal(['A','B'],['B','C']),equal(['C','D'],['D','E']),col('A','C','E'),col('B','C','D')])
# 123 both orders of the two interior points are valid and illustrated.
p={'A':[50,57],'B':[16,15],'C':[84,15],'M':[34,15],'N':[66,15],'M2':[66,15],'N2':[34,15]}
v=scene(['A','B','C','M','N'],tri()+[['A','M'],['A','N']],equalSegments=[eq('A','B'),eq('A','C'),eq('B','M',2),eq('C','N',2)],label='Порядок B–M–N–C',availableFromStep=0)
v2=scene(['A','B','C','M2','N2'],tri()+[['A','M2'],['A','N2']],equalSegments=[eq('A','B'),eq('A','C'),eq('B','M2',2),eq('C','N2',2)],label='Порядок B–N–M–C',availableFromStep=0)
st=[step('Какие углы между известными сторонами равны?','В равнобедренном ABC углы ABC и ACB равны. Так как M и N лежат на основании, ∠ABM = ∠ACN независимо от порядка M и N.','Углы при основании; совпадающие лучи',18),
 step('Как применить первый признак?','AB = AC, BM = CN и ∠ABM = ∠ACN. Значит, ΔBAM = ΔCAN по двум сторонам и углу между ними.','Первый признак равенства',15)]
checks=[equal(['A','B'],['A','C']),equal(['B','M'],['C','N']),equal(['B','M2'],['C','N2']),equal(['A','M'],['A','N']),equal(['A','M2'],['A','N2']),col('B','M','N','C')]
add(123,'а','На основании BC равнобедренного ABC выбраны M и N так, что BM = CN. Докажите ΔBAM = ΔCAN.','ΔBAM = ΔCAN по первому признаку.',st,p,v,cases=[v,v2],checks=checks,labels={'M2':'M','N2':'N'})
add(123,'б','На основании BC равнобедренного ABC выбраны различные M и N, BM = CN. Докажите, что AMN равнобедренный.','AM = AN; основание равнобедренного AMN — MN.',st+[
 step('Какие стороны малых треугольников соответствуют?','Из ΔBAM = ΔCAN получаем AM = AN. Поэтому AMN равнобедренный. Рассуждение одинаково для обоих порядков M и N на основании.','Соответствующие стороны и определение равнобедренного',[14,18])],p,v,cases=[v,v2],checks=checks,labels={'M2':'M','N2':'N'},notes=['Обе взаимные позиции M и N сохранены. Как и в формулировке о треугольнике AMN, предполагаются различные точки M и N.'])
# 124: bisector to the base is simultaneously a median and an altitude.
p={'D':[20,15],'K':[80,15],'F':[50,15],'E':[50,15+30/math.tan(math.radians(43))]}
v=scene(p,tri('D','E','K')+[['E','F']],equalSegments=[eq('D','E'),eq('E','K')],angleArcs=[arc('E','D','F',1),arc('E','F','K',1)])
add(124,'single','В равнобедренном DEK основание DK = 16 см; EF — биссектриса, ∠DEF = 43°. Найдите KF, ∠DEK и ∠EFD.','KF = 8 см; ∠DEK = 86°; ∠EFD = 90°.',[
 step('Какие свойства имеет EF?','Биссектриса к основанию равнобедренного треугольника одновременно является медианой и высотой. Поэтому DF = FK и EF ⟂ DK.','Биссектриса равнобедренного треугольника',18),
 step('Как найти KF?','KF = DK : 2 = 16 : 2 = 8 см.','Середина основания',17),
 step('Как найти полный угол при E?','∠DEF = ∠FEK = 43°, поскольку EF — биссектриса. Поэтому ∠DEK = 43° + 43° = 86°.','Биссектриса и сложение углов',[6,9]),
 step('Чему равен угол EFD?','EF ⟂ DK, а FD лежит на DK. Следовательно, ∠EFD = 90°.','Перпендикулярность прямых',12)],p,v,[dict(v,rightAngles=[right('E','F','K')]),dict(v,equalSegments=[eq('D','F'),eq('F','K')]),v,dict(v,rightAngles=[right('E','F','D')])],checks=[equal(['D','E'],['E','K']),equal(['D','F'],['F','K']),col('D','F','K'),angle('D','E','F',43),angle('D','E','K',86),angle('E','F','D',90)],givens=['DK = 16 см','∠DEF = 43°'])

assert sorted(EX)==list(range(92,125))
assert sum(len(e['parts']) for e in EX.values())==48
prep=dict(bookId='atanasyan-2023-7-9',edition='Атанасян и др. Геометрия 7–9. Базовый уровень. 14-е изд., перераб., Просвещение, 2023',chapter=2,title='Треугольники',status='draft-content-preparation',
 source=dict(fileName='1701411644_geometrija_-uchebnik_-7-9-kl_-atanasjan_compressed.pdf',sha256='3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72',printedPageRange=[31,38],pdfPageRange=[32,39],pageOffset=1),
 review=dict(independentSource='pending',independentMathematics='pending',interactiveModels='implemented-awaiting-independent-review',claude='not-performed-owner-task-waiver'),
 visualPolicy=['Отдельная модель каждого подпункта.','Текст решения и вычисления вне чертежа.','Вспомогательные элементы раскрываются по шагам.','Различные положения и семейства построений показаны отдельными сценами.'],
 coverage=dict(numberedExercises=33,parts=48,firstExercise=92,lastExercise=124,missingNumberedExercises=[],unresolvedInterpretationExercises=[]),
 authorSourceCheck=dict(printedPages=[31,32,37,38],pdfPages=[32,33,38,39],method='Визуально прочитаны все четыре страницы исходного PDF, включая рисунки 58–60,72–73; OCR использован только как помощник.',reviewedAt='2026-10-22',independent=False),exercises=list(EX.values()))
(OUT/'preparation/chapter-02-a.json').write_text(json.dumps(prep,ensure_ascii=False,indent=2)+'\n')
(OUT/'models/chapter-02-a.json').write_text(json.dumps(dict(schemaVersion=1,chapter=2,models=MODELS),ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(exercises=len(EX),parts=len(MODELS),steps=sum(len(p['steps']) for e in EX.values() for p in e['parts']),views=sum(len(m['model']['views']) for m in MODELS),claims=sum(len(m['model']['checks']) for m in MODELS))))
