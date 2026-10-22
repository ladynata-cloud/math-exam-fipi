#!/usr/bin/env python3
"""Authored planar configurations for Atanasyan 2023, chapter I, 31–60.
No source document bytes or machine-specific paths are included.
"""
import copy
import json
import math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PREP=json.loads((ROOT/'geometry-course/textbook/preparation/chapter-01.json').read_text())
PARTS={(e['number'],p['part']):p for e in PREP['exercises'] for p in e['parts']}
MODELS=[]

def xy(x,y): return [round(x,9),round(y,9),0]
def polar(x,y,angle,r=36): return xy(x+r*math.cos(math.radians(angle)),y+r*math.sin(math.radians(angle)))
def scene(points=(),segments=(),**kw):
    return dict(label='Условие',points=list(points),segments=[list(x)for x in segments],**kw)
def segmark(a,b,n=1):return dict(a=a,b=b,marks=n)
def arc(a,o,b,r=11,n=None):return dict(vertex=o,from_=a,to=b,radius=r,**({'marks':n} if n is not None else {}))
def aa(a,o,b,r=11,n=None):
    d=arc(a,o,b,r,n);d['from']=d.pop('from_');return d

def add(number,part,points,neutral,steps,description,checks=(),cases=None,labels=None,offsets=None,givens=None,didactics=None):
    assert len(steps)==len(PARTS[number,part]['steps']), (number,part,len(steps))
    views={'neutral':copy.deepcopy(neutral)}
    for i,v in enumerate(steps,1):
        views[f'step-{i}']=copy.deepcopy(v);views[f'step-{i}']['label']=f'Шаг {i}';views[f'step-{i}']['availableFromStep']=i
    for key,v in (cases or {}).items():views[key]=copy.deepcopy(v)
    label_only=set()
    for view in views.values():
        extra=view.pop('labelOnly',[])
        label_only.update(extra)
        view['points']=list(dict.fromkeys(view.get('points',[])+extra))
    m=dict(labelOnly=sorted(label_only),points=points,edges=[],planar=True,bounds=[0,0,100,70],labels=labels or {},labelOffsets=offsets or {},views=views,checks=list(checks),description=description)
    entry=dict(number=number,part=part,model=m)
    if givens:entry['statementGivens']=givens
    if didactics:
        assert len(didactics)==len(steps),(number,'didactics')
        entry['didactics']={'steps':[dict(prompt=p,justification=j)for p,j in didactics]}
    MODELS.append(entry)
    return entry

def linepoints(pos,y=35):return {n:xy(x,y) for n,x in pos.items()}|{'_left':xy(5,y),'_right':xy(95,y)}
def lineview(names,**kw):return scene(names,lines=[['_left','_right']],**kw)
def coll(names):return {'type':'collinear','points':list(names)}
def eq(a,b,c,d):return {'type':'equalLength','segments':[[a,b],[c,d]]}
def ratio(a,b,c,d,r):return {'type':'distanceRatio','segments':[[a,b],[c,d]],'ratio':r}
def ang(a,o,b,d):return {'type':'angle','points':[a,o,b],'degrees':d}
def high(v,pairs):v=copy.deepcopy(v);v['highlightSegments']=[list(p)for p in pairs];return v

# 31: points are introduced exactly when constructed.
p=linepoints({'A':14,'B':46,'C':78,'D':62})
v=lineview(['A','B']);s1=lineview(['A','B','C'],equalSegments=[segmark('A','B'),segmark('B','C')]);s2=lineview(['A','B','C','D'],equalSegments=[segmark('B','D',2),segmark('D','C',2)])
add(31,'single',p,v,[s1,s2,s2],'Прямая AB. Точки C и D добавляются при построении.',[coll('ABCD'),eq('A','B','B','C'),eq('B','D','D','C')],offsets={n:[0,5]for n in 'ABCD'},didactics=[('Где должна находиться C, чтобы B была серединой AC?','Середина отрезка лежит между его концами и делит его на две равные части.'),('Как найти середину полученного отрезка BC?','Середина BC равноудалена от B и C и принадлежит BC.'),('Как обозначить найденную середину?','По условию середину BC требуется назвать D.')])
# 32: two directions, no solutions initially.
p=linepoints({'A':50,'B':85,'C1':28,'C2':72})
v=lineview(['A','B']);s1=lineview(['A','B','C2']);s2=lineview(['A','B','C1','C2'],equalSegments=[segmark('A','C1'),segmark('A','C2')])
add(32,'single',p,v,[s1,s2,s2],'На прямой AB точки с заданным расстоянием от A появляются по очереди.',[coll(['A','B','C1','C2']),eq('A','C1','A','C2')],labels={'C1':'C₁','C2':'C₂'},offsets={n:[0,5]for n in p},didactics=[('В каком направлении сначала отложим заданное расстояние?','На луче с началом A можно отложить единственный отрезок заданной длины.'),('Есть ли другое направление на той же прямой?','Прямая делится точкой A на два противоположных луча.'),('Почему других точек быть не может?','Каждая искомая точка принадлежит одному из этих двух лучей; на каждом такая точка единственна.')])
# 33–34: exact ratios, unobstructed one-dimensional scenes.
for n,part,ab,bc,ds in [(33,'single',7.8,2.5,[('В каких единицах удобно выразить обе части?','Один сантиметр содержит десять миллиметров.'),('Как связаны AC и его части?','Если B лежит между A и C, то AC=AB+BC.'),('Какова сумма полученных длин?','Складываем длины, выраженные в одинаковых единицах.')]),(34,'а',3.7,3.5,[('Какая часть AC ещё неизвестна?','B лежит внутри AC и разделяет его на AB и BC.'),('Как выразить BC через известные длины?','Из AC=AB+BC следует BC=AC−AB.'),('Чему равна разность длин?','Вычитаем величины, выраженные в сантиметрах.')]),(34,'б',4,36,[('Сколько миллиметров в четырёх сантиметрах?','Один сантиметр равен десяти миллиметрам.'),('Как найти оставшуюся часть отрезка?','Если B между A и C, BC=AC−AB; единицы должны совпадать.')])]:
    p=linepoints({'A':12,'B':12+76*ab/(ab+bc),'C':88});v=scene(['A','B','C'],[['A','C']]);steps=[high(v,[['A','B']]),high(v,[['B','C']]),high(v,[['A','C']])][:len(ds)]
    if n==33:steps[0]=high(v,[['B','C']])
    elif part=='а':steps=[high(v,[['B','C']]),high(v,[['A','C']]),high(v,[['B','C']])]
    else:steps[0]=high(v,[['A','C']])
    add(n,part,p,v,steps,'Точка B внутри отрезка AC. Числовые данные приведены рядом с чертежом.',[coll('ABC'),ratio('A','B','B','C',ab/bc)],offsets={'A':[0,-5],'B':[0,5],'C':[0,-5]},didactics=ds)
# 35/36: each arrangement has separate geometry, no superposition.
for n,left,middle,right,near,far in [(35,'A','B','C',12,13.5),(36,'B','D','M',7,16)]:
    p={};labels={};cases={};vv=[]
    for idx in [1,2]:
        if idx==1:xs={left:12,middle:12+76*near/(near+far),right:88}
        else:xs={middle:12,left:12+76*near/far,right:88}
        for name,x in xs.items():p[f'{name}{idx}']=xy(x,35);labels[f'{name}{idx}']=name
        v=scene([f'{x}{idx}'for x in [left,middle,right]],[[f'{middle}{idx}',f'{left}{idx}'],[f'{middle}{idx}',f'{right}{idx}']]);vv.append(v)
        case=copy.deepcopy(v);case['label']='По разные стороны' if idx==1 else 'По одну сторону';case['availableFromStep']=0;cases[f'case-{idx}']=case
    checks=[coll([f'{x}{i}'for x in [left,middle,right]])for i in [1,2]]+[ratio(f'{middle}{i}',f'{left}{i}',f'{middle}{i}',f'{right}{i}',near/far)for i in [1,2]]
    steps=[vv[0],vv[1]]+([vv[1]]if n==35 else [])
    ds=[(f'Что меняется, если {left} и {right} по разные стороны {middle}?','Когда общая точка лежит между двумя другими, расстояния до неё складываются.'),(f'Что меняется, если {left} и {right} по одну сторону {middle}?','Для точек на одном луче расстояние между ними равно разности их расстояний от начала луча.')]+([('Есть ли ещё взаимное расположение с этими длинами?','На прямой две точки относительно третьей лежат либо по одну, либо по разные стороны. Дальняя точка определяется большей длиной.')]if n==35 else [])
    add(n,'single',p,vv[0],steps,'Два допустимых расположения показаны отдельными видами.',checks,cases,labels,{f'{left}{i}':[0,5]for i in [1,2]}|{f'{right}{i}':[0,-5]for i in [1,2]}|{f'{middle}{i}':[0,-5]for i in [1,2]},didactics=ds)
# 37
p=linepoints({'A':10,'D':10+80*17/64,'C':50,'B':90});v=scene(list('ADCB'),[['A','B']],equalSegments=[segmark('A','C'),segmark('C','B')])
add(37,'single',p,v,[high(v,[['A','C'],['C','B']]),high(v,[['C','D']]),high(v,[['D','B']])],'C — середина AB; D лежит на луче CA на заданном расстоянии.',[coll('ADCB'),eq('A','C','C','B'),ratio('C','D','A','B',15/64)],offsets={n:[0,5]for n in 'ADCB'},didactics=[('Что даёт условие о середине C?','Середина делит AB на два равных отрезка.'),('Где находится D относительно A и C?','На луче CA отрезок CD короче CA, поэтому D лежит между C и A.'),('Какие части нужно сложить и какие вычесть?','Из порядка A–D–C–B следуют DA=AC−CD и BD=BC+CD.')])
# 38: schematic route, not actual map.
p=linepoints({'M':12,'T':12+76*170/650,'P':88});v=scene(['M','T','P'],[['M','P']])
add(38,'single',p,v,[v,high(v,[['T','P']]),high(v,[['T','P']])],'Условная одномерная схема: Москва, Тверь, Петербург.',[coll('MTP'),ratio('M','T','M','P',170/650)],labels={'M':'М','T':'Т','P':'П'},offsets={n:[0,5]for n in 'MTP'},givens=['М — Москва; Т — Тверь; П — Петербург. Это условная схема расстояний из задачи.'],didactics=[('Как передать условие о положении Твери?','В данной одномерной модели Тверь расположена между Москвой и Петербургом.'),('Какую часть общего расстояния нужно найти?','Для точки между концами МП=МТ+ТП.'),('Как получить приближённое расстояние?','Из общей длины вычитаем известную часть; исходные данные приближённые.')])
# 39: separate length-comparison strips, never an impossible collinear triple.
p={'A1':xy(15,54),'B1':xy(45,54),'B2':xy(15,35),'C2':xy(55,35),'A3':xy(15,16),'C3':xy(65,16)}
v=scene(list(p),[['A1','B1'],['B2','C2'],['A3','C3']])
add(39,'single',p,v,[high(v,[['A3','C3']]),high(v,[['A1','B1'],['B2','C2']]),high(v,[['A3','C3']])],'Отдельные полоски сравнивают три заданные длины; это не расположение трёх точек на прямой.',[ratio('A1','B1','A3','C3',3/5),ratio('B2','C2','A3','C3',4/5)],labels={'A1':'A','B1':'B','B2':'B','C2':'C','A3':'A','C3':'C'},offsets={n:[0,4]for n in p},givens=['Три полоски на модели — сравнение длин, а не утверждение о взаимном расположении A, B и C.'],didactics=[('Какое равенство обязательно для трёх точек на одной прямой?','Одна из трёх точек лежала бы между двумя другими; самый длинный отрезок равнялся бы сумме двух остальных.'),('Какой из заданных отрезков самый длинный?','Из длин 3, 4 и 5 наибольшая — 5; сравниваем её с суммой 3 и 4.'),('Выполняется ли необходимое равенство?','Если необходимое свойство расположения на одной прямой не выполняется, такое расположение невозможно.')])
# 40: same exact shape required by both numerical subparts, independent entries.
for part in ['а','б']:
    p=linepoints({'A':12,'O':31,'C':50,'B':88});v=scene(list('AOCB'),[['A','B']],equalSegments=[segmark('A','O'),segmark('O','C')])
    s1=copy.deepcopy(v);s1['equalSegments']=[segmark('A','C'),segmark('C','B')]
    ds=[('Какие длины равны, поскольку C — середина AB?','Середина делит отрезок на две равные части.'),('Как условие о середине O помогает найти AO?','O — середина AC, поэтому AO=AC/2.'),('Как выразить OB через AB и AO?','Из порядка A–O–C–B следует OB=AB−AO.')]
    add(40,part,p,v,[s1,v,high(v,[['O','B']])],'C — середина AB, O — середина AC; числовые данные относятся к выбранному подпункту.',[coll('AOCB'),eq('A','C','C','B'),eq('A','O','O','C')],offsets={n:[0,5]for n in 'AOCB'},didactics=ds)
# 41: midpoint locations follow from exact coordinate lengths.
for part,pos in [('а',{'A':-12,'M':-6,'O':0,'N':4.5,'B':9}),('б',{'O':0,'N':4.5,'M':6,'B':9,'A':12})]:
    lo,hi=min(pos.values()),max(pos.values());p=linepoints({n:12+76*(x-lo)/(hi-lo)for n,x in pos.items()});v=scene(['A','O','B'],[['A','O'],['O','B']]);s1=scene(list(pos),[['A','O'],['O','B']]);s2=copy.deepcopy(s1);s2['equalSegments']=[segmark('A','M'),segmark('M','O'),segmark('O','N',2),segmark('N','B',2)]
    add(41,part,p,v,[s1,s2,high(s1,[['M','N']])],'Середины M и N вводятся после рассмотрения исходного расположения O, A и B.',[coll(list(pos)),eq('A','M','M','O'),eq('O','N','N','B'),ratio('O','A','O','B',12/9)],offsets={n:[0,5]for n in pos}|{'M':[0,5],'N':[0,-5]},didactics=[('Где находятся середины M и N?','M принадлежит OA и делит OA пополам; N принадлежит OB и делит OB пополам.'),('Чему равны расстояния от O до середин?','Длина половины отрезка равна половине его полной длины.'),('Нужно сложить или вычесть OM и ON?','При расположении по разные стороны O длины складываются; на одном луче вычитаются.')])
# 42: varied positions are separate cases; exact invariant remains half AB.
p={};labels={};cases={};vv=[];checks=[]
for i,c in enumerate([35,60,72],1):
    vals={'A':12,'C':c,'B':88,'M':(12+c)/2,'N':(c+88)/2}
    for n,x in vals.items():p[f'{n}{i}']=xy(x,35);labels[f'{n}{i}']=n
    v=scene([f'{n}{i}'for n in 'ACB'],[[f'A{i}',f'B{i}']]);full=scene([f'{n}{i}'for n in 'AMCNB'],[[f'A{i}',f'B{i}']]);vv.append((v,full))
    cases[f'case-{i}']=dict(full,label=f'Положение C · вариант {i}',availableFromStep=1)
    checks += [coll([f'{n}{i}'for n in 'AMCNB']),eq(f'A{i}',f'M{i}',f'M{i}',f'C{i}'),eq(f'C{i}',f'N{i}',f'N{i}',f'B{i}'),ratio(f'M{i}',f'N{i}',f'A{i}',f'B{i}',.5)]
add(42,'single',p,vv[0][0],[vv[0][1],high(vv[0][1],[['M1','C1'],['C1','N1']]),high(vv[0][1],[['M1','N1']])],'Точка C делит AB; положения C можно сравнить в отдельных видах.',checks,cases,labels,{n:[0,5]for n in p},didactics=[('Как обозначить середины двух частей?','Середины принадлежат соответствующим отрезкам и делят их пополам.'),('Из каких двух частей складывается MN?','Из порядка A–M–C–N–B следует MN=MC+CN; MC=AC/2, CN=CB/2.'),('Зависит ли полученная сумма от положения C?','Сумма AC+CB всегда равна AB=a; сумма половин равна половине суммы.')])
# 43: unequal pieces 10,4,14 satisfy midpoint distance 16 exactly.
p=linepoints({n:12+x*76/28 for n,x in {'A':0,'M':5,'C':10,'D':14,'N':21,'B':28}.items()});v=scene(list('ACDB'),[['A','B']]);mid=scene(list('AMCDNB'),[['A','B']],equalSegments=[segmark('A','M'),segmark('M','C'),segmark('D','N',2),segmark('N','B',2)])
add(43,'single',p,v,[v,high(mid,[['M','N']]),high(mid,[['C','D']])],'Отрезок разделён на три неравные части. Середины крайних частей появляются на втором шаге.',[coll('AMCDNB'),eq('A','M','M','C'),eq('D','N','N','B'),ratio('M','N','A','B',16/28),ratio('C','D','A','B',4/28)],offsets={n:[0,5]for n in 'ACDB'}|{'M':[0,-5],'N':[0,-5]},didactics=[('Как записать длину всего отрезка через три части?','Длина отрезка равна сумме длин последовательных неперекрывающихся частей.'),('Какие части входят в расстояние между серединами?','В него входят половина первой части, вся средняя часть и половина последней.'),('Как исключить две крайние длины из равенств?','После удвоения равенства для расстояния вычитание равенства для общей длины оставляет одну среднюю часть.')])
# 44: two equilateral triangles sharing BD. Closed and open routes separated.
h=30*math.sqrt(3)/2;p={'A':xy(50,35+h),'B':xy(35,35),'C':xy(50,35-h),'D':xy(65,35)}
edges=[['A','B'],['B','C'],['C','D'],['D','A'],['B','D']];v=scene(list('ABCD'),edges)
s=[high(v,route)for route in [[['A','B'],['B','D'],['D','A']],[['B','C'],['C','D'],['D','B']],[['A','B'],['B','C'],['C','D'],['D','A']],edges]]
cases={f'case-{i}':dict(copy.deepcopy(s[i-1]),label=label,availableFromStep=i)for i,label in enumerate(['Замкнутый маршрут ABD','Замкнутый маршрут BCD','Замкнутый маршрут ABCD','Открытый маршрут B–A–D–C–B–D'],1)}
add(44,'single',p,v,s,'Два равносторонних треугольника с общей стороной BD. Маршруты показываются отдельно.',[eq('A','B',a,b)for a,b in edges[1:]],cases,offsets={'A':[0,5],'B':[-5,0],'C':[0,-5],'D':[5,0]},givens=['На рисунке проведены AB, BC, CD, DA и BD. Длина каждого из этих пяти звеньев равна 3 см.','Замкнутые маршруты и дополнительная открытая ломаная рассматриваются отдельно; выбранную трактовку последнего вопроса обсудите с учителем.'],didactics=[('Какие звенья образуют замкнутый маршрут ABD?','Длина ломаной равна сумме длин её звеньев; у ABD три звена заданной длины.'),('Как найти длину маршрута BCD?','У второго треугольного маршрута также три звена той же длины.'),('Какой замкнутый маршрут проходит по внешней границе?','Внешняя граница состоит из четырёх различных звеньев; диагональ BD в неё не входит.'),('Что меняется, если разрешить незамкнутую ломаную?','Открытый путь B–A–D–C–B–D проходит каждое ребро один раз. Он не относится к простым замкнутым маршрутам.')])
# Angular construction helper.
def fan(angles,center=(50,14),radius=35):
    return {'O':xy(*center)}|{n:polar(*center,a,radius)for n,a in angles.items()}
def fanview(names,**kw):return scene(['O']+list(names),rays=[['O',n]for n in names],**kw)
def fanoffsets(angles):
    return {'O':[0,-5]}|{n:([0,-6] if abs(a)%360<1e-8 else [round(-6*math.sin(math.radians(a)),3),round(6*math.cos(math.radians(a)),3)])for n,a in angles.items()}
# 45: one visible angle at a time, examples are not fixed textbook numerical answers.
p={};labels={};cases={};vv=[];checks=[];offs={}
for i,(names,measure) in enumerate([(('A','O','B'),45),(('C','D','E'),110),(('h','V','k'),70),(('M','N','P'),180)],1):
    a,o,b=names;keys=[f'{x}{i}'for x in names];pts={keys[1]:xy(50,22),keys[0]:polar(50,22,0),keys[2]:polar(50,22,measure)};p.update(pts)
    labels.update({k:n for k,n in zip(keys,names)});offs.update({keys[1]:[0,-5],keys[0]:[4,-3],keys[2]:[-3,4]})
    v=scene(keys,[[keys[1],keys[0]],[keys[1],keys[2]]],angleArcs=[aa(keys[0],keys[1],keys[2])]);v.update({'labelOnly':[keys[0],keys[2]]}if i==3 else {});vv.append(v);cases[f'case-{i}']=dict(copy.deepcopy(v),label='Угол '+('hk'if i==3 else ''.join(names)),availableFromStep=0);checks.append(ang(keys[0],keys[1],keys[2],measure))
add(45,'single',p,vv[0],[vv[0],vv[0],vv[3]],'Примеры углов показаны по одному; их можно измерять, меняя выбранный вид.',checks,cases,labels,offs,givens=['В модели предложены примеры рисунков. Для самостоятельного построения и измерения можно использовать транспортир на бумаге.'],didactics=[('Какие углы можно выбрать для первых трёх рисунков?','Неразвёрнутый угол меньше 180°; развёрнутый образован противоположными лучами.'),('Как правильно установить транспортир?','Центр транспортира совмещают с вершиной, а нулевую отметку — с одной стороной.'),('От какой отметки нужно читать шкалу?','Используют шкалу, чей нуль совпадает с выбранной стороной; измерение записывают в градусах.')])
# 46
for part,letter,degree in [('AOB','B',23),('AOC','C',67),('AOD','D',138)]:
    angles={'A':0,letter:degree};p=fan(angles);v=fanview(['A']);full=fanview(['A',letter],angleArcs=[aa('A','O',letter)])
    add(46,part,p,v,[v,full],'Исходный луч OA; второй луч появляется на шаге построения.',[ang('A','O',letter,degree)],offsets=fanoffsets(angles),didactics=[('Как совместить транспортир с исходным лучом?','Центр транспортира помещают в O, а нуль выбранной шкалы — на OA.'),('Через какую отметку нужно провести второй луч?','Луч проводится из O через отметку заданной в условии градусной меры.')])
# 47
angles={'A':0,'B':70,'C':35};p=fan(angles);v=fanview(['A','B'],angleArcs=[aa('A','O','B')]);full=fanview(['A','B','C'],angleArcs=[aa('A','O','C',11,1),aa('C','O','B',11,1)])
add(47,'single',p,v,[v,v,full],'Угол AOB; биссектриса OC появляется после деления градусной меры пополам.',[ang('A','O','B',70),ang('A','O','C',35),ang('C','O','B',35)],offsets=fanoffsets(angles),didactics=[('Как построить угол заданной меры?','С помощью транспортира откладываем 70° от выбранного луча.'),('Какова мера каждой половины?','Биссектриса делит угол на два равных угла.'),('Где пройдёт биссектриса?','Внутренний луч, образующий с каждой стороной половину данного угла, является биссектрисой.')])
# 48: four distinct original situations and step-specific reflections.
p={};labels={};offs={};before=[];after=[];checks=[];cases={}
for i,d in enumerate([40,90,115,180],1):
    angles={'A':0,'B':d,'C':-d};pts=fan(angles,center=(50,35),radius=25)
    for n,pt in pts.items():p[f'{n}{i}']=pt;labels[f'{n}{i}']=n;offs[f'{n}{i}']=fanoffsets(angles)[n]
    def fv(names):return scene([f'O{i}']+[f'{n}{i}'for n in names],rays=[[f'O{i}',f'{n}{i}']for n in names])
    v=fv(['A','B']);w=fv(['A','B','C'])
    if i==4:
        w=fv(['A','B']);p['BC4']=copy.deepcopy(p['B4']);labels['BC4']='B, C';offs['BC4']=[0,-6];w['points']=['O4','A4','BC4']
    before.append(v);after.append(w);checks.append(ang(f'A{i}',f'O{i}',f'B{i}',d));checks.append(ang(f'A{i}',f'O{i}',f'C{i}',d))
    cases[f'case-{i}']=dict(copy.deepcopy(v),label=['Острый исходный угол','Прямой исходный угол','Тупой исходный угол','Развёрнутый исходный угол'][i-1],availableFromStep=0)
offs['C1']=[-6,-6]
s1=copy.deepcopy(after[0]);s1['angleArcs']=[aa('B1','O1','A1',11,1),aa('A1','O1','C1',11,1)]
s3=copy.deepcopy(after[1]);s3['angleArcs']=[aa('B2','O2','A2',11,1),aa('A2','O2','C2',11,1)]
s4=copy.deepcopy(after[2]);s4['angleArcs']=[aa('B3','O3','C3')];s4['note']='Проверка тупого исходного угла: OA вне меньшего угла BOC, поэтому это не искомое построение.'
after[3]['note']='Проверка развёрнутого исходного угла: отражённый луч совпал с OB; допустимый угол BOC не получился.'
add(48,'single',p,before[0],[s1,s1,s3,s4,after[3]],'Рассматриваются разные исходные углы; отражённый луч появляется только на соответствующем шаге.',checks,cases,labels,offs,didactics=[('Как построить второй угол, равный AOB, по другую сторону OA?','Отражённый относительно OA луч образует с OA угол той же меры.'),('Какова мера угла, который должен делиться пополам?','Если OA — биссектриса, весь угол BOC вдвое больше AOB.'),('Какая мера допустима для всего угла BOC?','Рассматриваемый школьный угол не превосходит 180°, поэтому его половина не превосходит 90°.'),('Где лежит OA при тупом исходном угле?','Меньший угол между отражёнными лучами лежит с противоположной стороны от OA; OA не проходит внутри него.'),('Что происходит при развёрнутом исходном угле?','Отражение противоположного OA луча совпадает с ним самим; допустимый угол BOC с указанной биссектрисой не получается.')])
# 49: sides shown as short illustrative segments to keep separate figures separate.
p={'O1':xy(16,22),'A1':xy(40,22),'B1':polar(16,22,55,24),'O2':xy(62,22),'A2':xy(82,22),'B2':polar(62,22,55,20),'O3':xy(40,22),'A3':xy(73,22),'B3':polar(40,22,55,33)}
v=scene(['O1','A1','B1','O2','A2','B2'],[['O1','A1'],['O1','B1'],['O2','A2'],['O2','B2']],angleArcs=[aa('A1','O1','B1',8,1),aa('A2','O2','B2',8,1)])
w=scene(['O3','A3','B3'],[['O3','A3'],['O3','B3']],angleArcs=[aa('A3','O3','B3')])
add(49,'single',p,v,[v,w,w],'Два угла одинаковой градусной меры с разной длиной изображённых сторон; затем их направления совмещаются.',[ang('A1','O1','B1',55),ang('A2','O2','B2',55),ang('A3','O3','B3',55)],labels={k:k[0]+('₁'if k.endswith('1')else '₂'if k.endswith('2')else '')for k in p},offsets={n:[0,-5]if n.startswith('O')else[2,4]for n in p},givens=['Оба изображённых угла имеют одну и ту же градусную меру. Длина нарисованных сторон на величину угла не влияет.'],didactics=[('Какую величину сравнивает градусная мера?','Градусная мера характеризует величину угла, а не длину изображения его сторон.'),('Что получится при наложении равных по мере углов?','При совмещении вершин и одной стороны одинаковая мера задаёт совпадающее направление второй стороны.'),('Как называются углы, которые можно совместить?','Углы, совмещающиеся при наложении, называются равными.')])
# 50: source figure43 scale, measurements in adjacent given list.
angles={'X':0,'A':40,'B':60,'C':80,'D':130,'Z':180};p=fan(angles,center=(50,13),radius=34);v=fanview(list(angles))
def angleview(a,b):
    return fanview([a,b],angleArcs=[aa(a,'O',b,12)])
given=['Отсчёт шкалы рисунка 43 от OX: X — 0°, A — 40°, B — 60°, C — 80°, D — 130°, Z — 180°.']
for part in ['а','б','в','г']:
    cases={}
    if part=='а':
        steps=[v,angleview('X','A'),angleview('A','B'),angleview('X','D')];pairs=[('X','A'),('X','B'),('A','B'),('B','C'),('X','D')]
        ds=[('От какого луча начинается нужная шкала?','Выбираем шкалу, на которой OX соответствует нулю.'),('Какие углы можно прочитать прямо от нулевой отметки?','Если одна сторона совпадает с нулём шкалы, мера угла равна отметке второй стороны.'),('Как найти угол между двумя ненулевыми отметками?','Мера угла равна разности отметок его сторон на одной шкале.'),('Какую отметку имеет луч OD?','Угол DOX отсчитывается от OX до OD по выбранной шкале.')]
    elif part=='б':
        steps=[angleview('A','B'),angleview('B','C')];pairs=[('A','B'),('B','C')]
        ds=[('Какова разность отметок OA и OB?','Угол между лучами равен разности их отметок на одной шкале.'),('Есть ли другая пара с той же разностью?','Равные разности отметок соответствуют равным углам.')]
    elif part=='в':
        steps=[angleview('A','B'),angleview('X','A'),angleview('C','D')];pairs=[('A','B'),('B','C'),('X','A'),('A','C'),('C','D'),('D','Z')]
        ds=[('Как сравнить любые два угла на этой шкале?','Каждый угол вычисляется как разность отметок его сторон.'),('Какие разности повторяются?','Равные градусные меры означают равенство углов.'),('Как записать равные углы без повторного счёта одного и того же угла?','Обратный порядок сторон обозначает тот же неориентированный угол, а не новый угол.')]
    else:
        steps=[v,angleview('A','B'),angleview('A','Z')];pairs=[('A','X'),('A','B'),('A','C'),('A','D'),('A','Z')]
        ds=[('Какую сторону оставляем неизменной?','В условии выбрана общая сторона OA.'),('Какие лучи могут стать второй стороной?','Перебираем остальные лучи рисунка, не меняя OA.'),('Как вычислить каждую меру?','Для всех пар используется модуль разности отметок на одной шкале.')]
    for i,(a,b)in enumerate(pairs,1):cases[f'case-{i}']=dict(angleview(a,b),label=f'Угол {a}O{b}',availableFromStep=1)
    add(50,part,p,v,steps,'Лучи рисунка 43. Шкала с числовыми данными вынесена в условие, выбранные углы показаны отдельно.',[ang('X','O',n,d)for n,d in angles.items()if n!='X'],cases,offsets=fanoffsets(angles),givens=given,didactics=ds)
# 51
for part,a,b in [('а',44,77),('б',12+37/60,108+25/60)]:
    angles={'A':0,'E':a,'B':a+b};p=fan(angles);v=fanview(list(angles));s=copy.deepcopy(v);s['angleArcs']=[aa('A','O','E'),aa('E','O','B')];full=copy.deepcopy(v);full['angleArcs']=[aa('A','O','B',18)]
    ds=[('Как складываются углы, разделённые внутренним лучом?','Если OE проходит внутри AOB, то AOB=AOE+EOB.'),('Чему равна сумма данных градусных мер?','Складываем меры двух неперекрывающихся частей угла.')]if part=='а'else[('Сколько минут получается при сложении?','В одном градусе 60 угловых минут; 60 минут можно заменить одним градусом.'),('Как учесть градус, полученный из минут?','При сложении разрядов перенос добавляется к сумме градусов.'),('Как записать меру без лишних минут?','В смешанной записи число минут должно быть меньше 60.')]
    add(51,part,p,v,[s,full]if part=='а'else[s,s,full],'Луч OE внутри AOB; части и весь угол выделяются последовательно.',[ang('A','O','E',a),ang('E','O','B',b),ang('A','O','B',a+b)],offsets=fanoffsets(angles),didactics=ds)
# 52 and53 difference-of-parts geometry.
for n,angles,stepspec in [(52,{'A':0,'C':30,'_D':60,'B':78},[('C','_D','B')]),(53,{'A':0,'_D':70,'C':85,'B':155},[])]:
    p=fan(angles);visible=['A','C','B'];v=fanview(visible);v['angleArcs']=[aa('A','O','B',9)]
    if n==52:
        s1=copy.deepcopy(v);s1['angleArcs']=[aa('_D','O','B',17)];s2=copy.deepcopy(v);s2['angleArcs']=[aa('A','O','C',17,1),aa('C','O','_D',17,1)];s3=copy.deepcopy(v);s3['angleArcs']=[aa('C','O','B',17)]
        ds=[('Как убрать избыток большей части?','Из всего угла вычитаем разность двух частей; остаётся сумма двух одинаковых меньших частей.'),('Как найти одну из двух равных частей?','Две равные части имеют одинаковую меру, поэтому их сумму делим на два.'),('Как перейти от меньшей части к искомой большей?','Большая часть превышает меньшую на указанную в условии разность.')]
    else:
        s1=copy.deepcopy(v);s1['angleArcs']=[aa('_D','O','C',17)];s2=copy.deepcopy(v);s2['angleArcs']=[aa('A','O','_D',17,1),aa('C','O','B',17,1)];s3=copy.deepcopy(v);s3['angleArcs']=[aa('A','O','C',17)]
        ds=[('Что останется, если вычесть разность частей из всего угла?','Останутся две равные меньшие части.'),('Как найти меру меньшей части?','Сумма двух равных величин делится пополам.'),('Как восстановить большую часть AOC?','К меньшей части прибавляем заданное превышение.')]
    for aux in [s1,s2]:aux['dashSegments']=[['O','_D']];aux['note']='Пунктирный вспомогательный луч введён для сравнения частей; его нет в исходном условии.'
    checks=[ang('A','O','B',angles['B']),ang('A','O','C',angles['C']),ang('C','O','B',angles['B']-angles['C'])]
    add(n,'single',p,v,[s1,s2,s3],'Внутренний луч делит данный угол на две части. Сравнение частей появляется по шагам.',checks,offsets=fanoffsets(angles),didactics=ds)
# 54 proportional parts.
angles={'A':0,'_P':27,'_Q':54,'B':81,'C':108};p=fan(angles);v=fanview(['A','B','C']);quarters=copy.deepcopy(v);quarters['angleArcs']=[aa(a,'O',b,16,1)for a,b in [('A','_P'),('_P','_Q'),('_Q','B'),('B','C')]];whole=copy.deepcopy(v);whole['angleArcs']=[aa('A','O','B',18)]
quarters['dashSegments']=[['O','_P'],['O','_Q']];quarters['note']='Два пунктирных вспомогательных луча показывают границы равных долей только на этом шаге.'
add(54,'single',p,v,[quarters,quarters,whole],'Угол AOC и внутренний луч OB; равные доли отмечаются только на шаге решения.',[ang('A','O','C',108),ang('A','O','B',81),ang('B','O','C',27)],offsets=fanoffsets(angles),didactics=[('Сколько одинаковых долей содержит каждая часть?','По условию AOB в три раза больше BOC, значит части содержат три доли и одну долю.'),('Сколько долей во всём угле и какова одна доля?','При сложении частей получаем четыре равные доли; меру всего угла делим на четыре.'),('Сколько долей содержит искомый угол AOB?','AOB состоит из трёх найденных одинаковых долей.')])
# 55 trisected right angle, bisectors only appear later.
angles={'A':90,'B':60,'C':30,'D':0,'U':75,'V':15};p=fan(angles,center=(25,14),radius=38);v=fanview(['A','B','C','D'],rightAngles=[{'vertex':'O','a':'A','b':'D','size':4}],angleArcs=[aa(a,'O',b,12,1)for a,b in [('A','B'),('B','C'),('C','D')]])
s2=fanview(list(angles),angleArcs=[aa(a,'O',b,17,1)for a,b in [('A','U'),('U','B'),('C','V'),('V','D')]])
s3=fanview(list(angles),angleArcs=[aa('U','O','V',23)])
add(55,'single',p,v,[v,s2,s3],'Прямой угол разделён на три равные части; биссектрисы крайних частей появляются после их вычисления.',[ang('A','O','D',90),ang('A','O','B',30),ang('B','O','C',30),ang('C','O','D',30),ang('A','O','U',15),ang('U','O','B',15),ang('C','O','V',15),ang('V','O','D',15)],offsets=fanoffsets(angles)|{'U':[-2,6],'B':[-2,1]},didactics=[('Какова мера одной из трёх равных частей прямого угла?','Прямой угол имеет меру 90°; каждая треть равна 90°/3.'),('Как биссектрисы делят крайние части?','Биссектриса делит свой угол на два равных угла.'),('Из каких частей складывается угол между биссектрисами?','Он состоит из половины первого угла, всего среднего и половины последнего.')])
# 56 original mutual order exactly as fig45; two different equal-angle pairs.
angles={'X':0,'U':30,'Y':60,'V':110,'Z':160};p=fan(angles);v=fanview(list(angles),angleArcs=[aa('X','O','U',12,1),aa('U','O','Y',12,1),aa('Y','O','V',16,2),aa('V','O','Z',16,2)])
s2=fanview(list(angles),angleArcs=[aa('U','O','V',22)]);s3=fanview(list(angles),angleArcs=[aa('X','O','Z',27)])
add(56,'single',p,v,[v,s2,s3],'Лучи расположены в порядке OX, OU, OY, OV, OZ. OU и OV делят соседние углы пополам.',[ang('X','O','U',30),ang('U','O','Y',30),ang('Y','O','V',50),ang('V','O','Z',50),ang('U','O','V',80)],offsets=fanoffsets(angles),givens=['Внутри угла XOZ лучи идут в порядке OX, OU, OY, OV, OZ.'],didactics=[('Какие две пары углов равны по условию?','OU и OV — биссектрисы соответствующих углов, поэтому каждая делит свой угол на две равные части.'),('Из каких двух половин складывается UOV?','В заданном порядке лучей UOV=UOY+YOV.'),('Как связаны целые соседние углы с их половинами?','XOY вдвое больше UOY, а YOZ вдвое больше YOV; сумма целых вдвое больше суммы половин.')])
# 57 varied examples support but do not replace the general inequality proof.
p={};labels={};offs={};cases={};vv=[];checks=[]
for i,d in enumerate([60,120,170],1):
    angles={'H':0,'L':d/2,'K':d};pts=fan(angles,center=(50,15),radius=32)
    for n,pt in pts.items():p[f'{n}{i}']=pt;labels[f'{n}{i}']={'H':'h','L':'l','K':'k','O':'O'}[n];offs[f'{n}{i}']=fanoffsets(angles)[n]
    v=scene([f'O{i}'],rays=[[f'O{i}',f'{n}{i}']for n in 'HLK'],labelOnly=[f'{n}{i}'for n in 'HLK'],angleArcs=[aa(f'H{i}',f'O{i}',f'L{i}',13,1),aa(f'L{i}',f'O{i}',f'K{i}',13,1)])
    vv.append(v);cases[f'case-{i}']=dict(copy.deepcopy(v),label=f'Пример {i}',availableFromStep=0);checks += [ang(f'H{i}',f'O{i}',f'K{i}',d),ang(f'H{i}',f'O{i}',f'L{i}',d/2),ang(f'L{i}',f'O{i}',f'K{i}',d/2)]
add(57,'single',p,vv[0],[vv[1],vv[2],vv[2]],'Неразвёрнутый угол и его биссектриса; отдельные примеры имеют разные величины угла.',checks,cases,labels,offs,givens=['Примеры на модели иллюстрируют условие. Общее доказательство использует неравенство для любого неразвёрнутого угла.'],didactics=[('Чем ограничена мера неразвёрнутого угла?','Его градусная мера строго меньше 180°.'),('Как меняется эта верхняя граница при делении пополам?','Половина величины, меньшей 180°, строго меньше 90°.'),('Как называется угол с такой мерой?','Угол меньше 90° является острым и не может быть прямым или тупым.')])
# 58 opposing ray fixed by source, not another ray on same side.
angles={'B':0,'A':40,'D':180};p=fan(angles);v=fanview(list(angles));s1=high(v,[['D','B']]);s2=fanview(list(angles),angleArcs=[aa('B','O','A',12),aa('A','O','D',17)]);s3=fanview(list(angles),angleArcs=[aa('A','O','D',17)])
add(58,'single',p,v,[s1,s2,s3],'OB и OD — противоположные лучи; OA образует острый угол с OB.',[ang('B','O','D',180),ang('A','O','B',40)],offsets=fanoffsets(angles),givens=['Здесь OD — луч, противоположный OB: O лежит между B и D.'],didactics=[('Как расположены OB и OD?','По построению это противоположные лучи одной прямой.'),('Как связаны углы по разные стороны OA?','У смежных углов общая сторона OA, а две другие стороны противоположны; сумма углов равна 180°.'),('Что можно сказать о смежном к острому угле?','Если из 180° вычесть величину меньше 90°, получится величина больше 90°.')])
# 59 each requested class is its own independent model.
for part,d in [('острый',40),('прямой',90),('тупой',130)]:
    angles={'B':0,'A':d,'D':180};p=fan(angles);v=fanview(['A','B']);w=fanview(['A','B','D']);v['angleArcs']=[aa('B','O','A')];w['angleArcs']=[aa('A','O','D',17)]
    if d==90:v['rightAngles']=[{'vertex':'O','a':'A','b':'B','size':4}];v.pop('angleArcs');w['rightAngles']=[{'vertex':'O','a':'A','b':'D','size':4}];w.pop('angleArcs')
    add(59,part,p,v,[v,w,w],'Пример выбранного вида угла; противоположный луч добавляется при построении смежного угла.',[ang('B','O','A',d),ang('B','O','D',180)],offsets=fanoffsets(angles),didactics=[('Какой угол требуется начертить в этом подпункте?','Острый угол меньше 90°, прямой равен 90°, тупой больше 90°, но меньше 180°.'),('Как получить вторую сторону смежного угла?','Одну из сторон продолжаем за вершину, получая противоположный луч.'),('Как определить вид полученного угла?','Сумма смежных углов равна 180°; сравниваем разность с 90°.')])
# 60 two opposite rays introduced separately.
angles={'H':15,'K':70,'H1':195,'K1':250};p=fan(angles,center=(50,35),radius=26);v=scene(['O'],rays=[['O','H'],['O','K']],labelOnly=['H','K']);s2=scene(['O'],rays=[['O',n]for n in ['H','K','H1']],labelOnly=['H','K','H1']);s3=scene(['O'],rays=[['O',n]for n in angles],labelOnly=list(angles));s4=copy.deepcopy(s3);s4['angleArcs']=[aa('H1','O','K1',13)]
add(60,'single',p,v,[v,s2,s3,s4],'Исходный угол hk и последовательно построенные противоположные лучи h₁ и k₁.',[ang('H','O','H1',180),ang('K','O','K1',180),ang('H','O','K',55),ang('H1','O','K1',55)],labels={'H':'h','K':'k','H1':'h₁','K1':'k₁'},offsets=fanoffsets(angles),didactics=[('Где должны начинаться новые лучи?','У вертикальных углов одна и та же вершина.'),('Как провести луч h₁?','Он должен быть противоположен h: лежать на той же прямой и идти в другую сторону от вершины.'),('Как провести луч k₁?','Аналогично строим луч, противоположный k.'),('Почему полученные углы вертикальные?','Два угла называются вертикальными, если стороны одного являются продолжениями сторон другого.')])

# The verified theory-point mapping links definitions without changing authored claims.
for entry in MODELS:
    n=entry['number']
    refs=([6,7] if n<=43 else [7] if n==44 else [4,9] if n<=46 else [6,9] if n in [47,48] else [5,9] if n==49 else [9] if n<=54 else [6,9] if n<=57 else [11])
    for step in entry.get('didactics',{}).get('steps',[]):step['theoryPoints']=refs

# Deterministic checks for authored output, not status promotion.
keys={(m['number'],m['part'])for m in MODELS};expected={k for k in PARTS if 31<=k[0]<=60}
assert keys==expected and len(keys)==len(MODELS)
for e in MODELS:
    m=e['model'];pts=m['points'];assert not m['edges']
    for key,v in m['views'].items():
        for name in v.get('points',[])+v.get('labelOnly',[]):assert name in pts,(e['number'],key,name)
        for primitive in ['segments','lines','rays','dashSegments','highlightSegments']:
            for pair in v.get(primitive,[]):assert len(pair)==2 and all(n in pts for n in pair),(e['number'],key,primitive,pair)
        for a in v.get('angleArcs',[]):assert all(a[k]in pts for k in ['from','to','vertex'])
        for a in v.get('equalSegments',[]):assert all(a[k]in pts for k in ['a','b'])
    for c in m['checks']:
        def dist(a,b):return math.dist(pts[a],pts[b])
        if c['type']=='equalLength':
            a,b=c['segments'];assert abs(dist(*a)-dist(*b))<1e-7,(e['number'],c)
        if c['type']=='distanceRatio':
            a,b=c['segments'];assert abs(dist(*a)/dist(*b)-c['ratio'])<1e-7,(e['number'],c)
        if c['type']=='collinear':
            p0,p1,*more=[pts[n]for n in c['points']]
            for p2 in more:assert abs((p1[0]-p0[0])*(p2[1]-p0[1])-(p1[1]-p0[1])*(p2[0]-p0[0]))<1e-6,(e['number'],c)
        if c['type']=='angle':
            a,o,b=[pts[n]for n in c['points']];u=[a[i]-o[i]for i in range(2)];w=[b[i]-o[i]for i in range(2)];cos=sum(x*y for x,y in zip(u,w))/(math.hypot(*u)*math.hypot(*w));d=math.degrees(math.acos(max(-1,min(1,cos))));assert abs(d-c['degrees'])<1e-5,(e['number'],c,d)
out=ROOT/'geometry-course/textbook/models/chapter-01-b.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps({'schemaVersion':1,'models':MODELS},ensure_ascii=False,indent=2)+'\n')
print(f'Authored {len(MODELS)} part models, {sum(len(m["model"]["views"])for m in MODELS)} scenes, {sum(len(m["model"]["checks"])for m in MODELS)} coordinate checks')
