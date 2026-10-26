#!/usr/bin/env python3
"""Original solutions and task-specific scenes, Atanasyan 2023 IV, 228–258.
Source printed71,74,75 read visually. Author checks are not independent review.
"""
import json, math, re
from copy import deepcopy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'geometry-course/textbook'
EX,MODELS={},[]

def scene(points=(),segments=(),**kw):
 return dict(label=kw.pop('label','Условие'),points=list(points),segments=[list(s) for s in segments],**kw)
def tri(a='A',b='B',c='C'):return [[a,b],[b,c],[c,a]]
def arc(o,a,b,marks=0,radius=7):return dict(vertex=o,**{'from':a,'to':b},marks=marks,radius=radius)
def eq(a,b,marks=1):return dict(a=a,b=b,marks=marks)
def right(a,o,b):return dict(a=a,vertex=o,b=b)
def ck(kind,**kw):return dict(type=kind,**kw)
def equal(*ss):return ck('equalLength',segments=[list(s) for s in ss])
def col(*ps):return ck('collinear',points=list(ps))
def par(a,b,c,d):return ck('parallel',segments=[[a,b],[c,d]])
def perp(a,b,c,d):return ck('perpendicular',segments=[[a,b],[c,d]])
def ang(a,o,b,d):return ck('angle',points=[a,o,b],degrees=d)
def readable(text):
 return re.sub(r'(\d)([А-Яа-яЁё])',r'\1 \2',re.sub(r'([А-Яа-яЁё])(\d)',r'\1 \2',text))
def S(prompt,text,reason,refs):
 refs=refs if isinstance(refs,list) else [refs]
 return (readable(prompt),readable(text),readable(reason),refs)
def mid(a,b):return [(a[0]+b[0])/2,(a[1]+b[1])/2]
def dist(a,b):return math.hypot(a[0]-b[0],a[1]-b[1])
def interp(a,b,t):return [a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def intersect(a,b,c,d):
 u=[b[0]-a[0],b[1]-a[1]];v=[d[0]-c[0],d[1]-c[1]]
 t=cross([c[0]-a[0],c[1]-a[1]],v)/cross(u,v)
 return interp(a,b,t)
def direction(p,a,b):return [p[0]+b[0]-a[0],p[1]+b[1]-a[1]]
def foot(p,a,b):
 u=[b[0]-a[0],b[1]-a[1]];t=((p[0]-a[0])*u[0]+(p[1]-a[1])*u[1])/(u[0]**2+u[1]**2)
 return interp(a,b,t)
def angles(A,B,names=('A','B','C')):
 aa,bb=math.radians(A),math.radians(B);r=10*math.sin(bb)/math.sin(aa+bb)
 return dict(zip(names,[(0,0),(10,0),(r*math.cos(aa),r*math.sin(aa))]))
def sides(ab,ac,bc):
 x=(ac*ac+ab*ab-bc*bc)/(2*ab);return {'A':(0,0),'B':(ab,0),'C':(x,math.sqrt(ac*ac-x*x))}
def bisect(p,a,b,c,name):
 # Internal bisector at a meets bc; used only for numerical model construction.
 p[name]=interp(p[b],p[c],dist(p[a],p[b])/(dist(p[a],p[b])+dist(p[a],p[c])))
 return p

def fit(points):
 xs,ys=zip(*points.values());w=max(xs)-min(xs);h=max(ys)-min(ys);s=min(72/(w or 1),44/(h or 1));cx=(max(xs)+min(xs))/2;cy=(max(ys)+min(ys))/2
 return {k:[50+s*(v[0]-cx),35+s*(v[1]-cy)] for k,v in points.items()}
def variant(p,v,suffix,label,unlock=1):
 # Separate scene with reused visible mathematical labels, never overlay cases.
 names={k:k+suffix for k in p};pp={names[k]:xy for k,xy in p.items()}
 def rename(z):
  if isinstance(z,str):return names.get(z,z)
  if isinstance(z,list):return [rename(q) for q in z]
  if isinstance(z,dict):return {k:rename(val) for k,val in z.items()}
  return z
 vv=rename(v);vv.update(label=label,availableFromStep=unlock)
 return pp,vv,{names[k]:k for k in p if not k.startswith('_')}

def add(n,part,condition,answer,steps,p,base,views=None,cases=(),checks=(),givens=(),labels=None,notes=()):
 condition,answer=readable(condition),readable(answer)
 page=71 if n<=240 else 74 if n<=251 else 75
 vv={'neutral':deepcopy(base)};seq=views or [base]
 for i in range(len(steps)):
  vv[f'step-{i+1}']=deepcopy(seq[min(i,len(seq)-1)]);vv[f'step-{i+1}']['label']=f'Шаг {i+1}'
 for i,v in enumerate(cases,1):vv[f'case-{i}']=deepcopy(v)
 pp=fit(p)
 m=dict(points={k:[round(x,9),round(y,9),0] for k,(x,y) in pp.items()},edges=[],planar=True,bounds=[0,0,100,70],views=vv,checks=list(checks),description='Отдельный чертёж этой задачи. Данные и вычисления находятся рядом; вспомогательные линии появляются по шагам.')
 if labels:m['labels']=labels
 item=dict(part=part,conditionSummary=condition,answer=answer,steps=[s[1] for s in steps],sourceVerified=True,mathVerified=True,visual=dict(initial='Только данные условия.',stepChanges=['Линии и отметки вводятся на своём шаге.'],cases=[v['label'] for v in cases]))
 EX.setdefault(n,dict(number=n,printedPages=[page],pdfPages=[page+1],parts=[],notes=[]))['parts'].append(item);EX[n]['notes'].extend(notes)
 MODELS.append(dict(chapter=4,collection='main',number=n,part=part,model=m,didactics=dict(steps=[dict(prompt=s[0],justification=s[2],theoryPoints=s[3]) for s in steps]),statementGivens=list(givens)))

#228: every algebraic subpart retains its own givens and numerical realization.
for part,A,B,given,expr,answer,extra in [
 ('а',65,57,'∠A =65°, ∠B =57°','180° −65° −57° =58°','58°.','65° +57° +58° =180°.'),
 ('б',24,130,'∠A =24°, ∠B =130°','180° −24° −130° =26°','26°.','24° +130° +26° =180°.'),
 ('в',35,70,'∠A =α, ∠B =2α','180° −α −2α =180° −3α','180° −3α; 0° <α <60°.','Все углы положительны: α >0°, 180° −3α >0°. Поэтому 0° <α <60°.'),
 ('г',80,40,'∠A =60° +α, ∠B =60° −α','180° −(60° +α) −(60° −α) =60°','60°; −60° <α <60°.','Два данных угла должны быть положительными: −60° <α <60°. При любом таком α угол C равен60°.')]:
 p=angles(A,B);base=scene('ABC',tri(),angleArcs=[arc('A','B','C'),arc('B','A','C')]);final=dict(base,angleArcs=[arc('C','A','B')])
 add(228,part,f'Найдите угол C треугольника ABC, если {given}.',answer,[S('Сколько составляют три угла вместе?','∠A +∠B +∠C =180°.','Сумма углов треугольника.',31),S('Как найти оставшийся угол?',f'∠C ={expr}.','Вычитаем известные углы из180°.',31),S('Как проверить результат?',extra,'Положительность углов и проверка суммы.',[9,31])],p,base,[base,final,final],checks=[ang('B','A','C',A),ang('A','B','C',B)],givens=[given],notes=['В буквенных заданиях чертёж представляет один допустимый пример; вывод относится ко всем указанным значениям α.'] if part in 'вг' else [])
p=angles(40,60);base=scene('ABC',tri())
add(229,'single','Углы треугольника ABC относятся как2 :3 :4. Найдите их.','∠A =40°, ∠B =60°, ∠C =80°.',[S('Как записать углы через одну величину?','Пусть ∠A =2x, ∠B =3x, ∠C =4x. Всего9 одинаковых частей.','Данное отношение.',9),S('Чему равна одна часть?','2x +3x +4x =180°, поэтому9x =180° и x =20°.','Сумма углов треугольника.',31),S('Чему равны сами углы?','∠A =2·20° =40°, ∠B =3·20° =60°, ∠C =4·20° =80°. Их сумма180°.','Подстановка и проверка.',31)],p,base,checks=[ang('B','A','C',40),ang('A','B','C',60),ang('A','C','B',80)],givens=['∠A :∠B :∠C =2 :3 :4'])
p=angles(60,60);base=scene('ABC',tri(),equalSegments=[eq('A','B'),eq('B','C'),eq('C','A')]);end=dict(base,angleArcs=[arc('A','B','C',1),arc('B','A','C',1),arc('C','A','B',1)])
add(230,'single','Докажите, что каждый угол равностороннего треугольника равен60°.','Каждый угол равен60°.',[S('Почему углы равны?','AB =AC, поэтому ∠B =∠C. Также AB =BC, поэтому ∠C =∠A. Все три угла равны.','Углы при основании равнобедренного треугольника.',18),S('Чему равна их сумма?','∠A +∠B +∠C =180°. Три равных слагаемых дают180°.','Сумма углов треугольника.',31),S('Как найти один угол?','Каждый угол равен180° :3 =60°.','Деление суммы равных величин.',31)],p,base,[end,end,end],checks=[equal(('A','B'),('B','C'),('C','A'))])
for part in ['а','б']:
 p=angles(50,80);p['D']=interp(p['A'],p['C'],-.35);base=scene('ABC',tri(),equalSegments=[eq('A','B'),eq('B','C')]);inside=dict(base,angleArcs=[arc('A','B','C',1),arc('C','A','B',1)]);external=dict(base,points=list('ABCD'),segments=tri()+[['A','D']],angleArcs=[arc('A','B','D')])
 rows=[S('Как связаны углы при основании?','Пусть каждый угол при основании AC равенα. Угол B положителен.','Свойство равнобедренного треугольника.',18),S('Может ли α достигать90°?','2α +∠B =180°, а ∠B >0°. Значит2α <180° и α <90°: оба угла при основании острые.','Сумма углов и положительность угла.',31)]
 if part=='б':rows.append(S('Каков смежный внешний угол?','Внешний угол при основании равен180° −α. Так как0° <α <90°, он больше90° и меньше180°, то есть тупой.','Смежные углы.',11))
 add(231,part,'Докажите, что '+('углы при основании равнобедренного треугольника острые.' if part=='а' else 'внешние углы при основании равнобедренного треугольника тупые.'),'Углы при основании меньше90°.' if part=='а' else 'Каждый внешний угол при основании больше90°.',rows,p,base,[inside,inside,external],checks=[equal(('A','B'),('B','C'))])
for part,baseang,cond,rows in [
 ('а',72,'угол при основании в2 раза больше угла, противолежащего основанию',[S('Как обозначить меньший угол?','Угол при вершине B обозначим x. Каждый угол при основании AC равен2x.','Условие и равенство углов при основании.',18),S('Как составить равенство?','x +2x +2x =180°. Отсюда5x =180°, x =36°.','Сумма углов треугольника.',31),S('Чему равны два других угла?','∠A =∠C =2·36° =72°. Получены36°,72°,72°.','Подстановка.',31)]),
 ('б',45,'угол при основании в3 раза меньше внешнего угла, смежного с ним',[S('Как обозначить угол при основании?','Пусть ∠A =x. Смежный с ним внешний угол равен3x.','Данное отношение.',9),S('Как использовать смежность?','x +3x =180°, поэтому x =45°. Второй угол при основании также45°.','Смежные углы и равнобедренный треугольник.',[11,18]),S('Как найти угол при вершине?','∠B =180° −45° −45° =90°.','Сумма углов треугольника.',31)])]:
 p=angles(baseang,180-2*baseang);base=scene('ABC',tri(),equalSegments=[eq('A','B'),eq('B','C')]);add(232,part,f'Найдите углы равнобедренного треугольника, если {cond}.',f'{baseang}°, {180-2*baseang}°, {baseang}°.',rows,p,base,checks=[equal(('A','B'),('B','C')),ang('B','A','C',baseang)])
#233 distinguishes the role of the given angle instead of silently choosing it.
for part,value in [('а',40),('б',60),('в',100)]:
 beta=(180-value)/2;p=angles(beta,value);base=scene('ABC',tri(),equalSegments=[eq('A','B'),eq('B','C')]);cases=[];labels={}
 rows=[S('Где может находиться данный угол?',f'Сначала считаем, что{value}° — угол B при вершине, противоположной основанию AC. Тогда ∠A =∠C =(180° −{value}°) :2 ={beta:g}°.','Равные углы при основании и сумма углов.',[18,31])]
 if value<90:
  q=angles(value,180-2*value);qb=scene('ABC',tri(),equalSegments=[eq('A','B'),eq('B','C')]);qp,qv,ql=variant(q,qb,'2','Данный угол при основании',2);p.update(qp);labels.update(ql);cases=[qv]
  rows.append(S('А если дан угол при основании?',f'Тогда оба угла при основании по{value}°, а угол при вершине равен180° −2·{value}° ={180-2*value}°.','Второе допустимое положение данного угла.',[18,31]))
  answer=f'{value}°, {beta:g}°, {beta:g}°' + (f' или {value}°, {value}°, {180-2*value}°.' if value!=60 else ' — один набор.')
 else:
  rows.append(S('Может ли100° быть углом при основании?','Нет: два равных угла по100° уже дали бы200°, что больше180°. Поэтому остаётся только первый случай.','Сумма углов треугольника.',31));answer='100°,40°,40°.'
 rows.append(S('Все ли варианты учтены?','Данный угол находится либо при основании, либо при противоположной вершине; третьего положения нет. Оставляем только треугольники с положительными углами.','Проверка полноты случаев.',31))
 add(233,part,f'Один из углов равнобедренного треугольника равен{value}°. Найдите остальные углы.',answer,rows,p,base,cases=cases,labels=labels,checks=[equal(('A','B'),('B','C'))])
p=angles(50,80);bisect(p,'A','B','C','D');base=scene('ABCD',tri()+[['A','D']],equalSegments=[eq('A','B'),eq('B','C')],angleArcs=[arc('A','B','D',1),arc('A','D','C',1)]);focus=dict(base,highlightSegments=tri('A','D','C'))
add(234,'single','В равнобедренном треугольнике ABC с основанием AC проведена биссектриса AD. Найдите ∠ADC, если ∠C =50°.','∠ADC =105°.',[S('Чему равен угол A?','∠A =∠C =50°, потому что AC — основание.','Углы при основании.',18),S('Чему равен угол DAC?','AD делит угол A пополам: ∠DAC =50° :2 =25°.','Биссектриса угла.',6),S('Как найти угол D в треугольнике ADC?','∠ADC =180° −25° −50° =105°.','Сумма углов треугольника ADC.',31)],p,base,[base,focus,focus],checks=[equal(('A','B'),('B','C')),col('B','D','C'),ang('D','A','C',25),ang('A','D','C',105)])
p=angles(58,96);bisect(p,'A','B','C','D');bisect(p,'B','A','C','E');p['M']=intersect(p['A'],p['D'],p['B'],p['E']);base=scene('ABCM',tri()+[['A','M'],['B','M']]);focus=dict(base,highlightSegments=tri('A','M','B'))
add(235,'single','Биссектрисы углов A и B треугольника ABC пересекаются в точке M. Найдите ∠AMB, если ∠A =58°, ∠B =96°.','∠AMB =103°.',[S('Какие углы при A и B входят в треугольник AMB?','∠MAB =58° :2 =29°; ∠MBA =96° :2 =48°.','Определение биссектрисы.',6),S('Что известно о сумме углов AMB?','∠AMB +29° +48° =180°.','Сумма углов треугольника.',31),S('Каков искомый угол?','∠AMB =180° −29° −48° =103°.','Вычисление.',31)],p,base,[focus,focus,focus],checks=[ang('M','A','B',29),ang('M','B','A',48),ang('A','M','B',103)])
p={'B':(-5,0),'C':(5,0),'M':(0,0),'A':(-3,4)};base=scene('ABCM',tri()+[['A','M']],equalSegments=[eq('B','M'),eq('M','C')]);small=dict(base,equalSegments=[eq('A','M'),eq('B','M'),eq('M','C')]);final=dict(small,rightAngles=[right('B','A','C')])
add(236,'single','Медиана AM треугольника ABC равна половине BC. Докажите, что треугольник ABC прямоугольный.','∠BAC =90°.',[S('Какие три отрезка равны?','M — середина BC, поэтому BM =CM =BC :2. По условию AM =BC :2, значит AM =BM =CM.','Медиана и данное равенство.',17),S('Какие углы равны в двух маленьких треугольниках?','В AMB имеем ∠BAM =∠ABM =x. В AMC имеем ∠MAC =∠ACM =y.','Углы при основании равнобедренного треугольника.',18),S('Как связаны x и y?','В ABC угол A равен x +y, угол B равен x, угол C равен y. Поэтому2(x +y) =180°.','M лежит внутри BC; сумма углов.',31),S('Как закончить?','x +y =90°, то есть ∠BAC =90°.','Определение прямоугольного треугольника.',32)],p,base,[small,small,small,final],checks=[equal(('A','M'),('B','M'),('M','C')),col('B','M','C'),ang('B','A','C',90)])
p=angles(55,70);p['D']=interp(p['A'],p['B'],1.35);base=scene('ABCD',tri()+[['B','D']],equalSegments=[eq('A','B'),eq('B','C')]);end=dict(base,angleArcs=[arc('B','D','C'),arc('A','B','C',1),arc('C','A','B',1)])
add(237,'single','Верно ли, что в равнобедренном треугольнике один из внешних углов в2 раза больше угла треугольника, не смежного с этим внешним углом?','Да: внешний угол при вершине, противоположной основанию, равен удвоенному углу при основании.',[S('Какой внешний угол выбрать?','Пусть AC — основание. Возьмём внешний угол при вершине B. Несмежные с ним углы A и C равны.','Свойство равнобедренного треугольника.',18),S('Чему равен внешний угол?','Внешний угол при B равен ∠A +∠C.','Теорема о внешнем угле.',31),S('Почему получается удвоение?','Так как ∠A =∠C, внешний угол равен2∠A и2∠C. Значит утверждение верно.','Сложение двух равных углов.',31)],p,base,[base,end,end],checks=[equal(('A','B'),('B','C'))])
p={'B':(-5,0),'C':(5,0),'A':(0,6),'X':(2.5,9),'E':(7,6)};base=scene('ABCXE',tri()+[['A','X'],['A','E']],equalSegments=[eq('A','B'),eq('A','C')],angleArcs=[arc('A','X','E',1),arc('A','E','C',1)]);end=dict(base,highlightSegments=[['A','E'],['B','C']])
add(238,'single','Докажите, что биссектриса внешнего угла при вершине равнобедренного треугольника, противоположной основанию, параллельна основанию.','AE ∥ BC.',[S('Чему равны углы при основании?','Пусть ∠B =∠C =β. Внешний угол XAC равен ∠B +∠C =2β.','Равнобедренный треугольник; внешний угол.',[18,31]),S('Какой угол отсекает биссектриса?','AE — биссектриса внешнего угла, поэтому ∠EAC =β.','Определение биссектрисы.',6),S('Как доказать параллельность?','∠EAC =∠ACB. Это накрест лежащие углы при секущей AC; значит AE ∥ BC.','Признак параллельности.',25)],p,base,[base,base,end],checks=[equal(('A','B'),('A','C')),col('B','A','X'),par('A','E','B','C')])
#239: the115° external angle may be at the apex or at the base.
p=angles(57.5,65);p['D']=interp(p['A'],p['B'],1.3);base=scene('ABCD',tri()+[['B','D']],equalSegments=[eq('A','B'),eq('B','C')]);q=angles(65,50);q['D']=interp(q['C'],q['A'],1.3);qb=scene('ABCD',tri()+[['A','D']],equalSegments=[eq('A','B'),eq('B','C')]);qp,qv,ql=variant(q,qb,'2','Внешний угол при основании',3);p.update(qp)
add(239,'single','Один из внешних углов равнобедренного треугольника равен115°. Найдите углы треугольника.','65°,57°30′,57°30′ или65°,65°,50°.',[S('Чему равен смежный внутренний угол?','Он равен180° −115° =65°.','Смежные углы.',11),S('Если65° — угол при вершине?','Два равных угла при основании равны(180° −65°) :2 =57,5° =57°30′.','Сумма углов; равнобедренный треугольник.',[18,31]),S('Если65° — угол при основании?','Второй угол при основании тоже65°, а угол при вершине180° −130° =50°.','Второе допустимое положение данного угла.',[18,31]),S('Какие ответы оставить?','Оба набора дают положительные углы с суммой180°, поэтому нужны оба ответа.','Проверка и полнота случаев.',31)],p,base,cases=[qv],labels=ql,checks=[equal(('A','B'),('B','C')),ang('A','B','C',65)])
p=angles(220/3,100/3);bisect(p,'A','B','C','D');base=scene('ABCD',tri()+[['A','D']],equalSegments=[eq('A','B'),eq('B','C')]);focus=dict(base,highlightSegments=tri('A','D','B'))
add(240,'single','В равнобедренном треугольнике ABC с основанием AC проведена биссектриса AD. Найдите углы ABC, если ∠ADB =110°.','∠A =∠C =73°20′, ∠B =33°20′.',[S('Как обозначить равные углы?','Пусть ∠A =∠C =x. Тогда ∠B =180° −2x, а ∠BAD =x :2.','Углы при основании, сумма углов и биссектриса.',[18,31,6]),S('Как использовать треугольник ADB?','x :2 +(180° −2x) +110° =180°. После вычитания180° получаем110° =3x :2.','Сумма углов ADB.',31),S('Чему равен x?','x =220° :3 =73°20′. Поэтому ∠A =∠C =73°20′.','Вычисление;1° =60′.',9),S('Как найти оставшийся угол?','∠B =180° −146°40′ =33°20′. Проверка в ADB:36°40′ +33°20′ +110° =180°.','Сумма углов и проверка.',31)],p,base,[base,focus,focus,focus],checks=[equal(('A','B'),('B','C')),col('B','D','C'),ang('A','D','B',110)])
#241–242: order angles by opposite sides, not adjacency.
for part,A,B,cond,answer,rows in [
 ('а',60,40,'AB >BC >AC','∠C >∠A >∠B. Угол A не может быть тупым.',[S('Какая сторона противолежит каждому углу?','AB лежит против C, BC — против A, AC — против B. Поэтому ∠C >∠A >∠B.','Против большей стороны лежит больший угол.',33),S('Почему A не может быть тупым?','Если ∠A >90°, то ∠C >∠A >90°. Уже ∠A +∠C >180°, что невозможно.','Сумма углов треугольника.',31)]),
 ('б',100,40,'AB =AC <BC','∠B =∠C <∠A. Угол A может быть тупым.',[S('Какие углы равны?','AB =AC, поэтому ∠B =∠C. Сторона BC больше равных сторон, значит ∠A больше обоих этих углов.','Равные стороны и порядок сторон/углов.',[18,33]),S('Возможен ли тупой угол A?','Да. Например, ∠A =100°, ∠B =∠C =40°. Сумма180°, а против100° находится самая большая сторона BC.','Пример, удовлетворяющий всем условиям.',31)])]:
 p=angles(A,B);base=scene('ABC',tri());add(241,part,f'Сравните углы ABC и выясните, может ли угол A быть тупым, если {cond}.',answer,rows,p,base,checks=[ang('B','A','C',A),ang('A','B','C',B)],givens=[cond])
for part,A,B,cond,answer in [('а',80,60,'∠A >∠B >∠C','BC >AC >AB.'),('б',80,50,'∠A >∠B =∠C','BC >AC =AB.')]:
 p=angles(A,B);base=scene('ABC',tri());add(242,part,f'Сравните стороны ABC, если {cond}.',answer,[S('Какие стороны лежат против данных углов?','Против A лежит BC, против B — AC, против C — AB.','Сторона, противолежащая вершине.',14),S('Как перенести сравнение углов на стороны?',answer,'Против большего угла лежит большая сторона; против равных углов — равные стороны.',33)],p,base,checks=[ang('B','A','C',A),ang('A','B','C',B)],givens=[cond])
p={'A':(0,7),'B':(-5,0),'C':(5,0),'M':(-2,0)};base=scene('ABCM',tri()+[['A','M']],equalSegments=[eq('A','B'),eq('A','C')]);focus=dict(base,highlightSegments=tri('A','B','M'),angleArcs=[arc('M','A','B'),arc('B','A','M')])
add(243,'single','В равнобедренном треугольнике ABC с основанием BC точка M лежит внутри BC. Докажите, что AM меньше боковой стороны.','AM <AB =AC.',[S('Какой угол можно выразить как внешний?','В треугольнике AMC угол AMB внешний, поэтому ∠AMB =∠MAC +∠ACM.','Теорема о внешнем угле.',31),S('С каким углом его сравнить?','∠ACM =∠ABC, так как углы при основании равны. Поэтому ∠AMB >∠ABM.','M лежит внутри BC; равенство углов при основании.',18),S('Что следует для сторон ABM?','Против большего угла AMB лежит AB, а против меньшего ABM — AM. Следовательно, AB >AM.','Соотношение сторон и углов.',33)],p,base,[base,focus,focus],checks=[equal(('A','B'),('A','C')),col('B','M','C')])
p={'B':(-5,0),'C':(7,0),'A':(-2,7),'M':(1,0),'H':(-2,0)};base=scene('ABCMH',tri()+[['A','M'],['A','H']],equalSegments=[eq('B','M'),eq('M','C')],rightAngles=[right('A','H','C')]);focus=dict(base,highlightSegments=tri('A','H','M'))
q={'B':(-5,0),'C':(5,0),'A':(0,7),'M':(0,0)};qb=scene('ABCM',tri()+[['A','M']],rightAngles=[right('A','M','C')]);qp,qv,ql=variant(q,qb,'2','Медиана совпадает с высотой',1);p.update(qp)
q={'B':(-5,0),'C':(7,0),'A':(-8,7),'M':(1,0),'H':(-8,0)};qb=scene('ABCMH',tri()+[['A','M'],['A','H'],['H','B']],rightAngles=[right('A','H','C')]);qp,qv2,ql2=variant(q,qb,'3','Основание высоты вне стороны',2);p.update(qp);ql.update(ql2)
add(244,'single','Докажите, что медиана треугольника не меньше высоты, проведённой из той же вершины.','AM ≥AH; равенство при совпадении M и H.',[S('Что будет, если основания совпали?','Если M =H, отрезки AM и AH совпадают, поэтому их длины равны.','Один и тот же отрезок.',7),S('Что делать, если M и H различны?','Точки H и M лежат на прямой BC, а AH перпендикулярен ей. Поэтому AHM — прямоугольный треугольник.','Определение высоты.',17),S('Как сравнить его стороны?','Против прямого угла H лежит AM. Против острого угла M лежит AH. Поэтому AM >AH. В обоих случаях AM ≥AH.','Против большего угла лежит большая сторона.',[31,33])],p,base,[base,focus,focus],cases=[qv,qv2],labels=ql,checks=[perp('A','H','B','C'),col('B','H','M','C')],notes=['Рассуждение охватывает и случай H вне стороны BC: используется вся прямая BC.'])
p=angles(55,70);bisect(p,'A','B','C','D');bisect(p,'C','A','B','E');p['O']=intersect(p['A'],p['D'],p['C'],p['E']);base=scene('ABCO',tri()+[['A','O'],['C','O']],equalSegments=[eq('A','B'),eq('B','C')]);focus=dict(base,highlightSegments=tri('A','O','C'))
add(245,'single','В равнобедренном ABC с основанием AC биссектрисы углов A и C пересекаются в O. Докажите, что AOC равнобедренный.','AO =CO.',[S('Какие углы ABC равны?','∠BAC =∠ACB, потому что AC — основание.','Углы при основании.',18),S('Что меняется после деления пополам?','∠OAC =∠BAC :2, ∠ACO =∠ACB :2. Половины равных углов равны.','Определение биссектрисы.',6),S('Почему AOC равнобедренный?','В нём равны углы OAC и ACO. Против них лежат CO и AO, значит CO =AO.','Признак равнобедренного треугольника.',33)],p,base,[base,focus,focus],checks=[equal(('A','B'),('B','C')),equal(('A','O'),('C','O'))])
p={'A':(0,7),'B':(-5,0),'C':(5,0),'M':(-3,2.8),'N':(3,2.8)};base=scene('ABCMN',tri()+[['M','N']],equalSegments=[eq('A','B'),eq('A','C')]);focus=dict(base,highlightSegments=tri('A','M','N'))
add(246,'single','Прямая, параллельная основанию BC равнобедренного ABC, пересекает боковые стороны AB и AC в M и N. Докажите, что AMN равнобедренный.','AM =AN.',[S('С какими углами равны углы AMN?','MN ∥ BC, поэтому ∠AMN =∠ABC и ∠ANM =∠ACB как соответственные углы.','Свойство параллельных прямых.',29),S('Почему найденные углы равны?','В исходном равнобедренном треугольнике ∠ABC =∠ACB. Значит ∠AMN =∠ANM.','Углы при основании.',18),S('Что следует для AM и AN?','Против равных углов AMN лежат равные стороны AN и AM.','Признак равнобедренного треугольника.',33)],p,base,[focus,focus,focus],checks=[equal(('A','B'),('A','C')),par('M','N','B','C'),col('A','M','B'),col('A','N','C')])
p={'A':(0,6),'B':(-5,0),'C':(5,0),'X':(2.5,9),'E':(7,6)};base=scene('ABCXE',tri()+[['A','X'],['A','E']],angleArcs=[arc('A','X','E',1),arc('A','E','C',1)]);end=dict(base,equalSegments=[eq('A','B'),eq('A','C')])
add(247,'single','Биссектриса внешнего угла треугольника параллельна одной из его сторон. Докажите, что треугольник равнобедренный.','AB =AC, если AE — биссектриса внешнего угла при A и AE ∥ BC.',[S('Какая сторона может быть параллельна биссектрисе?','Биссектриса проходит через вершину A и не совпадает с её сторонами, поэтому параллельной может быть только противоположная сторона BC.','Параллельные прямые не пересекаются.',24),S('Какие углы даёт параллельность?','Пусть AX — продолжение BA. При AE ∥ BC имеем ∠XAE =∠ABC и ∠EAC =∠ACB.','Соответственные и накрест лежащие углы.',29),S('Какие углы оказываются равными?','AE — биссектриса, поэтому ∠XAE =∠EAC. Следовательно, ∠ABC =∠ACB, а значит AB =AC.','Биссектриса; признак равнобедренного треугольника.',[6,33])],p,base,[base,base,end],checks=[par('A','E','B','C'),col('B','A','X'),equal(('A','B'),('A','C'))])
p={'A':(0,0),'B':(10,0),'C':(4,6)};bisect(p,'A','B','C','A1');p['D']=intersect(p['A'],p['B'],p['C'],direction(p['C'],p['A'],p['A1']));base=scene(['A','B','C','A1','D'],tri()+[['A','A1'],['C','D'],['A','D']]);focus=dict(base,highlightSegments=tri('A','C','D'))
add(248,'single','Через C треугольника ABC проведена прямая, параллельная биссектрисе AA₁ и пересекающая прямую AB в D. Докажите AC =AD.','AC =AD.',[S('Какие половины угла A равны?','∠BAA₁ =∠A₁AC.','AA₁ — биссектриса.',6),S('Какие углы треугольника ACD им равны?','CD ∥ AA₁. Угол ADC равен ∠BAA₁, а угол ACD равен ∠A₁AC. Поэтому ∠ADC =∠ACD.','Соответственные и накрест лежащие углы.',29),S('Как закончить доказательство?','В ACD против равных углов D и C лежат стороны AC и AD. Значит AC =AD.','Признак равнобедренного треугольника.',33)],p,base,[base,focus,focus],labels={'A1':'A₁'},checks=[par('C','D','A','A1'),col('A','D','B'),equal(('A','C'),('A','D'))])
p={'A':(0,0),'B':(10,0),'C':(4,6)};bisect(p,'A','B','C','D');p['E']=intersect(p['A'],p['B'],p['D'],direction(p['D'],p['A'],p['C']));base=scene('ABCDE',tri()+[['A','D'],['D','E']]);focus=dict(base,highlightSegments=tri('A','D','E'))
add(249,'single','AD — биссектриса треугольника ABC. Через D проведена прямая, параллельная AC и пересекающая AB в E. Докажите, что ADE равнобедренный.','AE =DE.',[S('Какие углы при A равны?','∠DAE =∠DAC, потому что E лежит на AB, а AD — биссектриса.','Определение биссектрисы.',6),S('Чему равен угол ADE?','При DE ∥ AC угол ADE равен ∠DAC как накрест лежащий. Поэтому ∠ADE =∠DAE.','Свойство параллельных прямых.',29),S('Какие стороны равны?','Против равных углов A и D треугольника ADE лежат DE и AE. Следовательно, DE =AE.','Признак равнобедренного треугольника.',33)],p,base,[base,focus,focus],checks=[col('B','D','C'),col('A','E','B'),par('D','E','A','C'),equal(('A','E'),('D','E'))])
#250–251 use the actual intersection of the two internal bisectors.
for n in [250,251]:
 p={'A':(0,8),'B':(-5,0),'C':(7,0)}
 weights=[dist(p['B'],p['C']),dist(p['A'],p['C']),dist(p['A'],p['B'])];total=sum(weights)
 p['O']=[sum(weights[i]*p[k][j] for i,k in enumerate('ABC'))/total for j in (0,1)]
 if n==250:
  p['M']=intersect(p['A'],p['B'],p['O'],direction(p['O'],p['B'],p['C']));p['N']=intersect(p['A'],p['C'],p['O'],direction(p['O'],p['B'],p['C']))
  base=scene('ABCOMN',tri()+[['B','O'],['C','O'],['M','N']]);left=dict(base,highlightSegments=tri('B','M','O'));rightv=dict(base,highlightSegments=tri('C','N','O'))
  rows=[S('Почему BM =MO?','BO делит угол B пополам. Поскольку MO ∥ BC, ∠BOM =∠OBC =∠MBO. Значит треугольник BMO равнобедренный и BM =MO.','Биссектриса, параллельность, равные углы.',[6,29,33]),S('Почему CN =NO?','CO делит угол C пополам. При NO ∥ BC получаем ∠CON =∠OCB =∠NCO. Поэтому CN =NO.','То же рассуждение в CNO.',[6,29,33]),S('Как получить равенство из условия?','O лежит между M и N, поэтому MN =MO +ON =BM +CN.','Сложение отрезков.',7)]
  add(n,'single','Через точку O пересечения биссектрис BB₁ и CC₁ треугольника ABC проведена прямая, параллельная BC. Она пересекает AB и AC в M и N. Докажите MN =BM +CN.','MN =BM +CN.',rows,p,base,[left,rightv,base],checks=[par('M','N','B','C'),col('A','M','B'),col('A','N','C'),col('M','O','N'),equal(('B','M'),('M','O')),equal(('C','N'),('N','O'))])
 else:
  p['E']=intersect(p['B'],p['C'],p['O'],direction(p['O'],p['A'],p['B']));p['D']=intersect(p['B'],p['C'],p['O'],direction(p['O'],p['A'],p['C']))
  base=scene('ABCODE',tri()+[['B','O'],['C','O'],['O','E'],['O','D']]);left=dict(base,highlightSegments=tri('B','E','O'));rightv=dict(base,highlightSegments=tri('C','D','O'));final=dict(base,highlightSegments=tri('E','D','O'))
  rows=[S('Какие стороны равны в BEO?','BO — биссектриса угла B и OE ∥ AB. Поэтому ∠EBO =∠BOE. Отсюда BE =EO.','Биссектриса, накрест лежащие углы и равнобедренный треугольник.',[6,29,33]),S('Какие стороны равны в CDO?','Аналогично, CO — биссектриса и OD ∥ AC, поэтому ∠DCO =∠COD и CD =DO.','То же рассуждение у вершины C.',[6,29,33]),S('Чему равен периметр EDO?','P =EO +OD +DE =BE +CD +DE =BC, так как E и D лежат на BC в порядке B,E,D,C.','Подстановка равных отрезков и сложение.',7)]
  add(n,'single','На рисунке135 BO и CO — биссектрисы углов B и C треугольника ABC; OE ∥ AB, OD ∥ AC, точки E и D лежат на BC. Докажите, что периметр EDO равен BC.','P(EDO) =BC.',rows,p,base,[left,rightv,final],checks=[par('O','E','A','B'),par('O','D','A','C'),col('B','E','D','C'),equal(('B','E'),('E','O')),equal(('C','D'),('D','O'))])
#252: equality of two large triangles establishes the required symmetry.
for part in ['а','б']:
 p={'A':(0,8),'B':(-5,0),'C':(5,0),'P':(-2.5,4),'Q':(2.5,4)};p['O']=intersect(p['B'],p['Q'],p['C'],p['P']);p['M']=(0,0)
 base=scene('ABCPQO',tri()+[['B','Q'],['C','P']],equalSegments=[eq('A','B'),eq('A','C'),eq('A','P',2),eq('A','Q',2)])
 big=dict(base,highlightSegments=tri('A','B','Q')+tri('A','C','P'));small=dict(base,highlightSegments=tri('B','O','C'));final=dict(base,points=list('ABCOM'),segments=tri()+[['A','M']],rightAngles=[right('A','M','C')],equalSegments=[eq('B','M',3),eq('M','C',3)])
 rows=[S('Какие треугольники равны по двум сторонам и углу?','В ABQ и ACP имеем AB =AC, AQ =AP и общий угол A. Значит △ABQ =△ACP.','Первый признак равенства.',15),S('Что это даёт для углов при B и C?','∠ABQ =∠ACP. Из равных углов ABC и ACB вычтем эти равные углы: ∠OBC =∠OCB.','Соответствующие углы равных треугольников; углы при основании.',[14,18]),S('Как получить первый вывод?','В BOC равны углы при B и C, значит BO =CO.','Признак равнобедренного треугольника.',33)]
 if part=='б':rows +=[S('Что известно о треугольниках ABO и ACO?','AB =AC, BO =CO, AO — общая сторона. Значит △ABO =△ACO по трём сторонам, поэтому AO — биссектриса угла A.','Третий признак равенства.',20),S('Почему AO проходит через середину BC и перпендикулярна BC?','В равнобедренном ABC биссектриса из вершины A одновременно медиана и высота. Значит её прямая проходит через середину M основания, и AO ⟂ BC.','Свойство биссектрисы равнобедренного треугольника.',18)]
 add(252,part,'На рисунке136 AB =AC, AP =AQ; P лежит на AB, Q — на AC, O — пересечение BQ и CP. Докажите, что '+('BOC равнобедренный.' if part=='а' else 'прямая AO проходит через середину BC и перпендикулярна BC.'),'BO =CO.' if part=='а' else 'BM =MC и AO ⟂ BC.',rows,p,base,[big,small,small,dict(base,segments=base['segments']+[['A','O']]),final],checks=[equal(('A','B'),('A','C')),equal(('A','P'),('A','Q')),col('B','O','Q'),col('C','O','P'),equal(('B','O'),('C','O'))])
#253: display supplied segments, never a fictitious impossible triangle.
for part,lengths,unit,calc in [('а',(1,2,3),'м','1 +2 =3'),('б',(1.2,1,2.4),'дм','1,2 +1 =2,2 <2,4')]:
 p={};segs=[]
 for i,v in enumerate(lengths):p[f'A{i}']=(0,2*i);p[f'B{i}']=(v,2*i);segs.append([f'A{i}',f'B{i}'])
 base=scene(list(p),segs)
 add(253,part,f'Существует ли треугольник со сторонами '+', '.join(str(v).replace('.',',') for v in lengths)+f' {unit}?','Нет.',[S('Какое условие необходимо для треугольника?','Самая большая сторона должна быть строго меньше суммы двух других.','Неравенство треугольника.',34),S('Выполняется ли это условие?',calc+'. Строгого неравенства нет.','Сравнение длин.',34),S('Какой вывод?','Такого треугольника не существует. Равенство суммы двух сторон третьей даёт только вырожденное расположение на прямой.','Неравенство треугольника.',34)],p,base,labels={f'A{i}':f'A{i+1}' for i in range(3)}|{f'B{i}':f'B{i+1}' for i in range(3)},givens=[str(v).replace('.',',')+' '+unit for v in lengths])
p=sides(25,25,10);base=scene('ABC',tri(),equalSegments=[eq('A','B'),eq('A','C')])
add(254,'single','В равнобедренном треугольнике одна сторона равна25 см, другая —10 см. Какая из них является основанием?','Основание равно10 см; боковые стороны по25 см.',[S('Что получится, если основание равно25 см?','Тогда обе боковые стороны равны10 см. Но10 +10 =20 <25 — такой треугольник невозможен.','Неравенство треугольника.',34),S('Какой случай остаётся?','Основание10 см, а боковые стороны25 см и25 см. Условие25 <25 +10 выполнено.','Две стороны равнобедренного треугольника равны.',18),S('Каков ответ?','Основание — сторона длиной10 см.','Исключение невозможного случая.',34)],p,base,checks=[equal(('A','B'),('A','C'))],givens=['Две различные длины:25 см и10 см.'])
for part,large,small in [('а',7,3),('б',8,2),('в',10,5)]:
 p=sides(large,large,small);base=scene('ABC',tri(),equalSegments=[eq('A','B'),eq('A','C')])
 add(255,part,f'Две стороны равнобедренного треугольника равны{large} см и{small} см. Найдите третью сторону.',f'{large} см.',[S('Какие длины может иметь третья сторона?',f'В равнобедренном треугольнике две стороны равны. Поэтому третья сторона равна либо{small} см, либо{large} см.','Определение равнобедренного треугольника.',18),S('Можно ли взять меньшую длину?',f'Если равные стороны по{small} см, их сумма{2*small} см '+('меньше' if 2*small<large else 'равна')+f' третьей стороны{large} см. Треугольника нет.','Строгое неравенство треугольника.',34),S('Какой ответ остаётся?',f'Третья сторона равна{large} см. Тогда боковые стороны по{large} см, основание{small} см; все неравенства выполняются.','Проверка оставшегося случая.',34)],p,base,checks=[equal(('A','B'),('A','C'))],givens=[f'{large} см',f'{small} см'])
p={'A':(0,0),'B':(2,4),'C':(5,1),'D':(9,5)};base=scene('ABCD',[['A','B'],['B','C'],['C','D']]);first=dict(base,dashSegments=[['A','C']]);end=dict(base,dashSegments=[['A','D']]);q={'A':(0,0),'B':(3,0),'C':(6,0),'D':(9,0)};qb=scene('ABCD',[['A','B'],['B','C'],['C','D']]);qp,qv,ql=variant(q,qb,'2','Равенство на прямой',4);p.update(qp)
add(256,'single','Докажите неравенство о длине ломаной: длина ломаной не меньше длины отрезка, соединяющего её концы.','A₀A₁ +A₁A₂ +… +Aₙ₋₁Aₙ ≥A₀Aₙ.',[S('Что верно для трёх точек?','Для любых X,Y,Z имеем XZ ≤XY +YZ. Если точки не лежат на одной прямой, это строгое неравенство треугольника; если лежат, оно следует из сложения отрезков.','Неравенство треугольника и сложение отрезков.',[7,34]),S('Как укоротить ломаную на одно звено?','Первые два звена A₀A₁ и A₁A₂ заменим отрезком A₀A₂. Его длина не больше их суммы, поэтому общая длина не увеличилась.','Неравенство для трёх точек.',34),S('Как дойти до одного отрезка?','Повторяем замену: присоединяем следующее звено и заменяем два отрезка одним. После конечного числа замен останется A₀Aₙ. Его длина не больше исходной длины ломаной.','Последовательное применение одного неравенства.',34),S('Почему в ответе нестрогое неравенство?','Равенство возможно, например, когда все вершины идут по порядку на одном отрезке. Поэтому общее утверждение содержит знак ≥.','Проверка случая равенства.',7)],p,base,[first,first,end,end],cases=[qv],labels=ql)
p=sides(29,29,16);base=scene('ABC',tri());end=dict(base,equalSegments=[eq('A','B'),eq('A','C')])
add(257,'single','Два внешних угла треугольника при разных вершинах равны. Периметр равен74 см, одна сторона —16 см. Найдите две другие стороны.','29 см и29 см.',[S('Что следует из равенства внешних углов?','Смежные с ними внутренние углы также равны: каждый равен180° минус соответствующий внешний. Значит треугольник равнобедренный.','Смежные углы; признак равнобедренного треугольника.',[11,33]),S('Может ли16 см быть боковой стороной?','Тогда обе боковые стороны по16 см, а основание74 −32 =42 см. Но16 +16 <42, что невозможно.','Периметр и неравенство треугольника.',34),S('Как найти две равные стороны?','16 см — основание. На две равные стороны приходится74 −16 =58 см; каждая равна58 :2 =29 см.','Определение периметра.',7)],p,base,[end,end,end],checks=[equal(('A','B'),('A','C'))])
p=sides(7,7,11);p['D']=interp(p['B'],p['A'],1.5);base=scene('ABCD',tri()+[['A','D']],equalSegments=[eq('A','B'),eq('A','C')]);end=dict(base,highlightSegments=[['B','C']])
add(258,'single','Периметр равнобедренного треугольника25 см, разность двух сторон4 см, а один из внешних углов острый. Найдите стороны треугольника.','7 см,7 см и11 см.',[S('Какой внутренний угол соответствует острому внешнему?','Смежный с острым внешним внутренний угол тупой. В равнобедренном треугольнике углы при основании острые, значит тупой угол находится при противоположной вершине.','Смежные углы; сумма двух равных углов при основании.',[11,18,31]),S('Какая сторона самая большая?','Против тупого угла лежит основание BC. Оно больше каждой боковой стороны. Пусть боковая сторона x см; тогда основание x +4 см.','Соотношение сторон и углов.',33),S('Как использовать периметр?','x +x +(x +4) =25. Значит3x =21, x =7; основание7 +4 =11 см.','Периметр треугольника.',7),S('Согласуются ли длины с условием?','7 +7 >11, периметр25, разность11 −7 =4. У данного треугольника основание больше боковых сторон, как требовалось в решении; наличие тупого угла было дано условием.','Проверка вычислений без подмены данного условия.',34)],p,base,[base,end,end,end],checks=[equal(('A','B'),('A','C'))])

def main():
 assert sorted(EX)==list(range(228,259))
 assert len(MODELS)==44
 prep=dict(bookId='atanasyan-2023-7-9',edition='Атанасян и др. Геометрия7–9.14-е изд.,2023',chapter=4,title='Соотношения между сторонами и углами треугольника',status='draft-content-preparation',source=dict(fileName='1701411644_geometrija_-uchebnik_-7-9-kl_-atanasjan_compressed.pdf',sha256='3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72',printedPageRange=[71,75],pdfPageRange=[72,76],pageOffset=1),review=dict(independentSource='pending',independentMathematics='pending',interactiveModels='implemented-awaiting-independent-review',claude='not-performed-owner-task-waiver'),coverage=dict(numberedExercises=31,parts=len(MODELS),firstExercise=228,lastExercise=258,missingNumberedExercises=[],unresolvedInterpretationExercises=[]),authorSourceCheck=dict(printedPages=[71,74,75],pdfPages=[72,75,76],method='Визуальное чтение точных исходных страниц71,74,75; авторское решение каждой части.',reviewedAt='2026-10-26',independent=False),exercises=list(EX.values()))
 (OUT/'preparation/chapter-04-a.json').write_text(json.dumps(prep,ensure_ascii=False,indent=2)+'\n')
 (OUT/'models/chapter-04-a.json').write_text(json.dumps(dict(schemaVersion=1,chapter=4,models=MODELS),ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(dict(exercises=len(EX),parts=len(MODELS),steps=sum(len(x['steps']) for e in EX.values() for x in e['parts']),views=sum(len(m['model']['views']) for m in MODELS),claims=sum(len(m['model']['checks']) for m in MODELS))))
if __name__=='__main__':main()
