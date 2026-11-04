"""Authored, deterministic planar scenes for chapter I exercises 61–91.
The frozen preparation file supplies the exact part identities and step counts.
"""
import copy,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PREP=json.loads((ROOT/'geometry-course/textbook/preparation/chapter-01.json').read_text())
EX={e['number']:e for e in PREP['exercises']}
OUT=[]

def pt(x,y): return [float(x),float(y),0]
def polar(o,a,r=30):
 t=math.radians(a);return pt(o[0]+r*math.cos(t),o[1]+r*math.sin(t))
def arc(v,a,b,r=8,marks=0,**kw):return dict(vertex=v,**{'from':a,'to':b},radius=r,marks=marks,**kw)
def right(v,a,b):return dict(vertex=v,a=a,b=b,size=3)
def tick(a,b,marks=1):return dict(a=a,b=b,marks=marks)
def check(t,**kw):return dict(type=t,**kw)
def scene(label='Условие',points=(),segments=(),**kw):return dict(label=label,points=list(points),segments=[list(e) for e in segments],**kw)
def new(points,description,offsets=None,labels=None):
 return dict(points=points,edges=[],planar=True,bounds=[0,0,100,70],labels=labels or {},labelOffsets=offsets or {},views={},checks=[],description=description)
def put(m,k,v):m['views'][k]=copy.deepcopy(v);return v
def add(n,part,m,steps,case_views=None,givens=None,prompts=None,reasons=None,theory=None):
 src=next(p for p in EX[n]['parts'] if p['part']==part)
 assert len(steps)==len(src['steps']),(n,part,len(steps),len(src['steps']))
 for i,s in enumerate(steps,1):
  v=copy.deepcopy(s);v.setdefault('availableFromStep',i);put(m,'step-'+str(i),v)
 if case_views:
  for i,v in enumerate(case_views,1):put(m,'case-'+str(i),v)
 d=[]
 for i,text in enumerate(src['steps']):
  d.append(dict(prompt=(prompts[i] if prompts else 'Объясни следующий переход, опираясь на данные и рисунок.'),justification=(reasons[i] if isinstance(reasons,list) else reasons or 'Используем данные задачи и соответствующее определение.'),theoryPoints=theory or []))
 entry=dict(number=n,part=part,model=m,didactics=dict(steps=d))
 if givens:entry['statementGivens']=givens
 OUT.append(entry)

def adjacent(n,part,theta,kind='ABC',equal=False):
 o=pt(50,20)
 names=('B','A','C','D') if kind=='ABC' else ('O','h','k','l')
 v,a,b,c=names
 p={v:o,a:polar(o,0,37),b:polar(o,theta,35),c:polar(o,180,37)}
 m=new(p,'Два угла с общей стороной; две другие стороны — противоположные лучи.',{v:[0,-5],a:[2,-4],c:[-3,-4],b:[0,5]})
 if kind!='ABC':m['labelOnly']=['h','k','l']
 s=scene(points=names,lines=[[a,c]],rays=[[v,b]],angleArcs=[arc(v,a,b,10)])
 if equal:s['angleArcs']=[arc(v,a,b,9,marks=1),arc(v,b,c,9,marks=1)]
 if theta==90 and not equal:s['angleArcs']=[];s['rightAngles']=[right(v,a,b)]
 put(m,'neutral',s)
 m['checks']=[check('collinear',points=[a,v,c]),check('angle',points=[a,v,b],degrees=theta)]
 st=[]
 count=len(next(x for x in EX[n]['parts'] if x['part']==part)['steps'])
 for i in range(count):
  t=copy.deepcopy(s);t['label']='Смежные углы: шаг '+str(i+1)
  if i==count-1:
   t['angleArcs']=[arc(v,b,c,11)]
   if theta==90:t['angleArcs']=[];t['rightAngles']=[right(v,a,b),right(v,b,c)]
  st.append(t)
 return m,st

# 61: each perpendicular has its own scene; no pile-up of all four.
p={'O':pt(30,18),'M':pt(86,18),'N':polar(pt(30,18),60,49),'P':pt(48,30),'Q':pt(17,48)}
m=new(p,'Угол MON; P внутри угла, Q вне угла. Выбирай одно построение за раз.',{'O':[-4,-4],'M':[2,-4],'N':[0,4],'P':[3,2],'Q':[-4,3]})
s=scene(points=['O','M','N','P','Q'],rays=[['O','M'],['O','N']]);put(m,'neutral',s)
perps=[]
for j,(q,b) in enumerate([('P','M'),('P','N'),('Q','M'),('Q','N')],1):
 u=[p[b][k]-p['O'][k] for k in range(2)];w=[p[q][k]-p['O'][k] for k in range(2)];t=sum(u[k]*w[k] for k in range(2))/sum(x*x for x in u)
 h='H'+str(j);p[h]=pt(p['O'][0]+t*u[0],p['O'][1]+t*u[1]);m['labels'][h]='H';m['labelOffsets'][h]=[-3,-4]
 v=scene(q+' и прямая O'+b,points=['O',b,q,h],lines=[['O',b],[q,h]],rightAngles=[right(h,q,b)],availableFromStep=2 if j==1 else 3 if j==2 else 4)
 perps.append(v);m['checks'].append(check('perpendicular',segments=[[q,h],['O',b]]))
add(61,'single',m,[s,perps[0],perps[1],perps[2]],perps,givens=['Проверяется перпендикулярность полным прямым OM и ON; основание может лежать на продолжении стороны.'],prompts=['С какой прямой нужно совместить сторону угольника?','Как сохранить прямой угол при перемещении угольника?','Как повторить построение для другой стороны угла?','Как провести оба перпендикуляра через Q?'],reasons='Стороны угольника перпендикулярны. Скольжение вдоль выбранной прямой сохраняет угол между сторонами.',theory=[12,13])
# 62–65.
for part,t in [('а',111),('б',90),('в',15)]:
 m,st=adjacent(62,part,t);add(62,part,m,st,prompts=['Как связаны величины смежных углов?','Вычти известный угол из развёрнутого.'][:len(st)],reasons='Сумма смежных углов равна 180°.',theory=[11])
for n,equal in [(63,False),(64,True)]:
 m,st=adjacent(n,'single',90,equal=equal)
 add(n,'single',m,st,prompts=(['Какова сумма двух углов?','Найди величину неизвестного угла.','Как называется угол такой величины?'] if n==63 else ['Какова сумма двух равных смежных углов?','Как разделить эту сумму между равными углами?']),reasons='Смежные углы дают 180°. Прямым называется угол 90°.',theory=[9,11])
for part,t in [('а',70),('б',150),('в',113+39/60),('г',135),('д',100)]:
 m,st=adjacent(65,part,t,kind='rays')
 prompts={'а':['Как получить удвоенный меньший угол?','Как найти меньший угол?','Как восстановить больший угол?'],'б':['Вычти разность из суммы углов.','Как найти меньший угол?','Как восстановить больший угол?'],'в':['Вычти разность, переведя один градус в минуты.','Раздели полученную величину пополам.','Прибавь разность к меньшему углу.'],'г':['Сколько равных долей содержит развёрнутый угол?','Найди одну долю.','Найди три такие доли.'],'д':['Сколько долей приходится на оба угла?','Найди величину одной доли.','Найди величины пяти и четырёх долей.']}[part]
 add(65,part,m,st,givens=['Лучи h и l противоположны; k — общая сторона смежных углов.'],prompts=prompts,reasons='Смежные углы в сумме дают 180°; далее используем заданную разность или отношение.',theory=[9,11])
# 66 exact source layout.
o=pt(50,18);p={'O':o,'A':polar(o,180,36),'B':polar(o,0,36),'C':polar(o,148,38),'D':polar(o,74,42)}
m=new(p,'OA и OB — противоположные лучи; OD делит угол COB на две равные части.',{'O':[0,-5],'A':[-3,-3],'B':[3,-3],'C':[-3,4],'D':[1,5]})
s=scene(points=p,lines=[['A','B']],rays=[['O','C'],['O','D']],angleArcs=[arc('O','B','D',10,marks=1),arc('O','D','C',10,marks=1)])
put(m,'neutral',s);st=[]
for a,b in [('B','C'),('B','D'),('A','D')]:
 t=copy.deepcopy(s);t['angleArcs']=[arc('O',a,b,12)];t['label']='Угол '+a+'O'+b;st.append(t)
m['checks']=[check('collinear',points=['A','O','B']),check('angle',points=['C','O','B'],degrees=148),check('angle',points=['B','O','D'],degrees=74),check('angle',points=['C','O','D'],degrees=74)]
add(66,'single',m,st,givens=['OA и OB — противоположные лучи; OD лежит внутри угла COB.','∠BOD = ∠COD; ∠COB = 148°.'],prompts=['Как называется луч, делящий угол на равные части?','Найди половину известного угла.','Как связаны AOD и BOD?'],reasons=['Определение биссектрисы.','Биссектриса делит градусную меру угла пополам.','Сумма смежных углов равна 180°.'],theory=[6,11])
# 67 equal angles in separately switched orientations.
p={};cases=[]
for i,rot in [(1,0),(2,25)]:
 o=pt(50,24);v='O'+str(i);a='A'+str(i);b='B'+str(i);c='C'+str(i)
 p.update({v:o,a:polar(o,rot,34),b:polar(o,rot+65,34),c:polar(o,rot+180,34)})
 cases.append(scene('Пара '+str(i),points=[v,a,b,c],lines=[[a,c]],rays=[[v,b]],angleArcs=[arc(v,a,b,10)],availableFromStep=0))
m=new(p,'Две пары смежных углов показаны раздельно. Исходные углы в этих парах равны.',labels={x:x[0] for x in p},offsets={x:[0,-5] if x[0]=='O' else [2,4] for x in p})
put(m,'neutral',cases[0]);st=[cases[0],copy.deepcopy(cases[0]),copy.deepcopy(cases[1])]
st[1]['angleArcs']=[arc('O1','B1','C1',11)];st[2]['angleArcs']=[arc('O2','B2','C2',11)]
m['checks']=[check('angle',points=['A'+str(i),'O'+str(i),'B'+str(i)],degrees=65) for i in (1,2)]
add(67,'single',m,st,cases,prompts=['Обозначь одинаковую величину исходных углов.','Вырази величину угла, смежного с первым.','Сравни её с величиной угла, смежного со вторым.'],reasons='Из одной и той же величины 180° вычитаются равные углы.',theory=[11])
# Crossed lines: sectors 1 left, 2 top, 3 right, 4 bottom.
def cross(top):
 o=pt(50,35);t=(180-top)/2
 p={'O':o,'A':polar(o,t,35),'B':polar(o,180-t,35),'C':polar(o,180+t,35),'D':polar(o,360-t,35)}
 m=new(p,'Две пересекающиеся прямые. Угол 1 слева, 2 сверху, 3 справа, 4 снизу.',{'O':[3,-5],'A':[3,3],'B':[-4,3],'C':[-4,-4],'D':[3,-4]})
 s=scene(points=['O'],lines=[['A','C'],['B','D']]);put(m,'neutral',s)
 m['checks']=[check('collinear',points=['A','O','C']),check('collinear',points=['B','O','D']),check('angle',points=['A','O','B'],degrees=top)]
 return m,s
PAIRS={1:('B','C'),2:('A','B'),3:('D','A'),4:('C','D')}
def sectors(s,nums,label=None):
 t=copy.deepcopy(s);t['angleArcs']=[arc('O',*PAIRS[x],r=10,marks=1 if x in (1,3) else 2) for x in nums];t['label']=label or 'Углы '+', '.join(map(str,nums));return t
for part,top,seq in [('а',117,[[2,4],[1,2],[1,3]]),('б',180-(43+27/60),[[1,3],[1,2],[2,4]])]:
 m,s=cross(top);put(m,'neutral',sectors(s,[2 if part=='а' else 3],'Условие'))
 add(68,part,m,[sectors(s,x) for x in seq],givens=['Нумерация: 1 слева, 2 сверху, 3 справа, 4 снизу.'],prompts=['Какой угол вертикален данному?','Как найти смежный угол?','Используй равенство оставшейся вертикальной пары.'],reasons=['Вертикальные углы равны.','Сумма смежных углов равна 180°.','Вертикальные углы равны.'],theory=[11])
for part,top,seq in [('а',123,[[1,3],[1],[2]]),('б',140,[[1,2,3,4],[4],[1,3]])]:
 m,s=cross(top);initial=sectors(s,[1,3] if part=='а' else [1,2,3],'Условие')
 for ar in initial.get('angleArcs',[]):ar['marks']=0
 put(m,'neutral',initial)
 add(69,part,m,[sectors(s,x) for x in seq],prompts=(['Могут ли данные два угла быть смежными?','Что следует из равенства вертикальных углов?','Найди смежный угол.'] if part=='а' else ['Какова сумма углов вокруг точки?','Найди величину оставшегося угла.','Найди вертикальный и смежные ему углы.']),reasons='Вокруг точки полный угол 360°. Смежные углы дают 180°, вертикальные углы равны.',theory=[9,11])
for part,top,seq in [('а',110,[[2,4],[2],[1,3]]),('б',135,[[1,3],[2,4],[1,2],[2]]),('в',105,[[1,2],[1],[1,2],[1,3]])]:
 m,s=cross(top);put(m,'neutral',sectors(s,[],'Условие'))
 add(70,part,m,[sectors(s,x) for x in seq],givens=['Нумерация: 1 слева, 2 сверху, 3 справа, 4 снизу.'],prompts={'а':['Какие углы равны?','Найди один из равных углов по их сумме.','Найди смежные углы.'],'б':['Обозначь равные вертикальные пары.','Упрости данное соотношение.','Используй сумму смежных углов.','Найди вторую величину.'],'в':['Запиши сумму соседних углов.','Вычти разность из их суммы.','Раздели остаток пополам и найди второй угол.','Восстанови вертикальные пары.']}[part],reasons='Вертикальные углы равны, смежные в сумме дают 180°; подстановка сохраняет данное отношение.',theory=[11])
# 71 three lines, one active sector at a time.
o=pt(50,35);p={'O':o}
for name,a in [('R',0),('A',30),('B',145),('L',180),('C',210),('D',325)]:p[name]=polar(o,a,35)
m=new(p,'Три прямые через O. Угол 1 справа сверху, 2 слева сверху, 3 между нижними наклонными лучами.',{'O':[3,5]})
s=scene(points=['O'],lines=[['L','R'],['A','C'],['B','D']]);put(m,'neutral',s)
t1=copy.deepcopy(s);t1.update(label='Вертикальная пара для угла 3',angleArcs=[arc('O','C','D',16),arc('O','A','B',16)])
t2=copy.deepcopy(s);t2.update(label='Верхняя полуплоскость',angleArcs=[arc('O','R','L',16)])
m['checks']=[check('collinear',points=[a,'O',b]) for a,b in [('L','R'),('A','C'),('B','D')]]
add(71,'single',m,[t1,t2,t2],givens=['1 — между правым горизонтальным и правым верхним лучами.','2 — между левым горизонтальным и левым верхним лучами.','3 — между нижними наклонными лучами.'],prompts=['Найди угол, вертикальный углу 3.','Какие углы вместе заполняют верхнюю полуплоскость?','Какова величина развёрнутого угла?'],reasons=['Вертикальные углы равны.','Величина целого угла равна сумме его частей.','Развёрнутый угол равен 180°.'],theory=[9,11])
# 72 exact angular order C B A F E D.
o=pt(50,35);p={'O':o};angles={'C':0,'B':70,'A':120,'F':180,'E':250,'D':300}
for a,t in angles.items():p[a]=polar(o,t,29)
m=new(p,'Прямые AD, BE и FC пересекаются в O. Даны углы AOB и FOE.',{'O':[3,4],'C':[4,0],'B':[4,0],'A':[-3,4],'F':[-4,0],'E':[-6,0],'D':[3,-4]})
s=scene(points=p,lines=[['A','D'],['B','E'],['F','C']]);put(m,'neutral',s)
st=[]
for a,b in [('B','C'),('A','C'),('B','D'),('C','E'),('C','D')]:
 t=copy.deepcopy(s);t.update(label='Угол '+a+'O'+b,angleArcs=[arc('O',a,b,10)])
 if len(st)==4:t['lines']=[['A','D'],['F','C']];t['points']=['O','A','D','F','C']
 st.append(t)
m['checks']=[check('collinear',points=[a,'O',b]) for a,b in [('A','D'),('B','E'),('F','C')]]+[check('angle',points=['A','O','B'],degrees=50),check('angle',points=['F','O','E'],degrees=70)]
add(72,'single',m,st,givens=['A, O, D; B, O, E; F, O, C — три тройки точек на прямых.','∠AOB = 50°, ∠FOE = 70°.'],prompts=['Какой угол вертикален FOE?','Из каких двух углов складывается AOC?','Как найти угол, смежный AOB?','Как найти угол, смежный BOC?','Выбери меньший угол между AD и FC.'],reasons=['Вертикальные углы равны.','Складываем величины соседних частей угла.','Смежные углы дают 180°.','Смежные углы дают 180°.','Углом между пересекающимися прямыми называют меньший из образованных неразвёрнутых углов.'],theory=[9,11])
# 73–74: valid original drawings and separately labeled perpendicular principle.
for n in [73,74]:
 p={'A':pt(45 if n==73 else 50,56),'P':pt(22,19),'Q':pt(78,19),'H':pt(50,19),'_a':pt(94,19),'_Pup':pt(22,57),'_Qup':pt(78,57)}
 m=new(p,'Прямая a и точка A вне неё. Исходные наклонные прямые не снабжены ложными отметками прямого угла.',{'A':[0,5],'P':[-3,-5],'Q':[3,-5],'H':[0,-5],'_a':[0,-5]},labels={'_a':'a'})
 if n==74:m['labelOffsets'].update({'A':[8,4],'H':[4,-6]})
 m['labelOnly']=['_a']
 s=scene(points=['A','P','Q','_a'],lines=[['P','Q']],rays=[['A','P'],['A','Q']])
 if n==74:s['lines']+=[['A','P'],['A','Q'],['A','H']];s['rays']=[];s['points'].append('H')
 put(m,'neutral',s)
 principle=scene('Две различные прямые, перпендикулярные a',points=['P','Q','_a'],lines=[['P','Q'],['P','_Pup'],['Q','_Qup']],rightAngles=[right('P','_Pup','Q'),right('Q','_Qup','P')],availableFromStep=3 if n==73 else 1,note='Это отдельная схема свойства перпендикуляров, а не изменение исходного рисунка.')
 m['checks']=[check('perpendicular',segments=[['P','_Pup'],['P','Q']]),check('perpendicular',segments=[['Q','_Qup'],['P','Q']]),check('parallel',segments=[['P','_Pup'],['Q','_Qup']])]
 if n==73:
  st=[s,s,principle,s];pr=['Почему прямые сторон угла различны?','Какая точка у них общая?','Что известно о двух перпендикулярах к одной прямой?','Сравни это свойство с исходным рисунком.']
 else:
  last=copy.deepcopy(s);last['rightAngles']=[right('H','A','Q')];st=[principle,s,last];pr=['Предположи, что две прямые перпендикулярны a.','Совместимо ли это с их общей точкой A?','Сколько из трёх прямых тогда могут быть перпендикулярны a?']
 add(n,'single',m,st,[principle],prompts=pr,reasons='Две различные прямые, перпендикулярные одной прямой, не пересекаются. Прямые через A имеют общую точку.',theory=[1,12])
# 75 all pairwise lines through four points.
p={'A':pt(18,20),'B':pt(76,15),'C':pt(82,54),'D':pt(30,59)}
m=new(p,'Четыре точки, никакие три из которых не лежат на одной прямой.',{'A':[-3,-4],'B':[3,-4],'C':[3,4],'D':[-3,4]})
s=scene(points=p);put(m,'neutral',s)
lines=[];st=[]
for batch in [[['A','B'],['A','C'],['A','D']],[['B','C'],['B','D']],[['C','D']],[]]:
 lines+=batch;t=scene('Прямые через пары точек',points=p,lines=copy.deepcopy(lines));st.append(t)
add(75,'single',m,st,prompts=['Какие прямые проходят через A?','Какие новые прямые добавляет B?','Какая пара ещё не учтена?','Сложи количества различных прямых.'],reasons='Через две точки проходит единственная прямая. Условие о трёх точках запрещает совпадение прямых разных пар.',theory=[1])
# 76 four generic lines; exactly six distinct pair intersections.
p={'_a':pt(8,20),'_b':pt(92,20),'_c':pt(10,10),'_d':pt(65,65),'_e':pt(35,65),'_f':pt(90,10),'_g':pt(58,56),'_h':pt(75,5)}
I=[(20,20),(80,20),(70,20),(50,50),(57.5,57.5),(65,35)]
for i,(x,y) in enumerate(I,1):p['_I'+str(i)]=pt(x,y)
m=new(p,'Четыре попарно пересекающиеся прямые; через каждую точку пересечения проходят ровно две.',{})
s=scene(lines=[['_a','_b'],['_c','_d'],['_e','_f'],['_g','_h']]);put(m,'neutral',s)
st=[]
for k in [3,5,6,6]:st.append(scene('Отмечаем различные пересечения',points=['_I'+str(i) for i in range(1,k+1)],lines=s['lines']))
for a,b,i in [('_a','_b',1),('_c','_d',1),('_a','_b',2),('_e','_f',2),('_a','_b',3),('_g','_h',3),('_c','_d',4),('_e','_f',4),('_c','_d',5),('_g','_h',5),('_e','_f',6),('_g','_h',6)]:m['checks'].append(check('collinear',points=[a,'_I'+str(i),b]))
add(76,'single',m,st,prompts=['Скольким парам принадлежит первая прямая?','Какие пары ещё не учтены?','Почему разные пары дают разные точки?','Сложи количества новых пересечений.'],reasons='Каждая пара пересекающихся прямых имеет одну общую точку; тройные пересечения исключены условием.',theory=[1])
# 77 choose a single angle, never all twelve arcs.
o=pt(50,35);p={'O':o}
for a,t in zip('ABCDEF',[0,40,115,180,220,295]):p[a]=polar(o,t,29)
m=new(p,'Три прямые дают шесть лучей OA, OB, OC, OD, OE, OF. Выбираем одну пару лучей за раз.',{'O':[2,-5],'A':[4,0],'B':[3,4],'C':[-2,4],'D':[-4,0],'E':[-3,-4],'F':[2,-4]})
s=scene(points=p,lines=[['A','D'],['B','E'],['C','F']]);put(m,'neutral',s)
cases=[]
for q in 'BCEF':
 t=copy.deepcopy(s);t.update(label='Выбран угол AO'+q,angleArcs=[arc('O','A',q,10)],availableFromStep=2);cases.append(t)
m['checks']=[check('collinear',points=[a,'O',b]) for a,b in [('A','D'),('B','E'),('C','F')]]
add(77,'single',m,[s,cases[0],cases[1],cases[0]],cases,prompts=['Сколько лучей получается?','С какими лучами OA образует неразвёрнутые углы?','Сосчитай выборы для всех первых лучей.','Почему каждый угол посчитан дважды?'],reasons='Противоположная пара образует развёрнутый угол и исключается; неупорядоченная пара лучей считается один раз.',theory=[3,4,9])
# 78–82 segment arithmetic, no lengths written inside figures.
for part in ['а','б']:
 p={'M':pt(12,35),'N':pt(12+76*2/3,35),'P':pt(88,35),'_T':pt(12+76/3,35)}
 m=new(p,'N лежит между M и P; MN вдвое длиннее NP.',{'M':[-2,-5],'N':[0,5],'P':[2,-5]})
 s=scene(points=['M','N','P'],segments=[['M','P']]);put(m,'neutral',s)
 t=copy.deepcopy(s);t['points'].append('_T');t['equalSegments']=[tick('M','_T'),tick('_T','N'),tick('N','P')]
 q=copy.deepcopy(t);q['highlightSegments']=[['N','P'] if part=='а' else ['M','N']]
 m['checks']=[check('collinear',points=['M','N','P']),check('distanceRatio',segments=[['M','N'],['N','P']],ratio=2)]
 add(78,part,m,[t,q],prompts=['На сколько одинаковых долей делится MP?','Найди нужную часть по величине одной доли.'],reasons='N внутри MP, поэтому MP=MN+NP. По условию MN=2NP.',theory=[7])
# 79 two separate arrangements.
p={'K1':pt(12,35),'L1':pt(40.5,35),'M1':pt(88,35),'L2':pt(12,35),'K2':pt(57.6,35),'M2':pt(88,35)}
m=new(p,'Два возможных порядка точек K, L, M показаны раздельно; данные длины сохраняются.',{k:[0,5] for k in p},labels={k:k[0] for k in p})
cases=[scene('L между K и M',points=['K1','L1','M1'],segments=[['K1','M1']],availableFromStep=0),scene('K между L и M',points=['L2','K2','M2'],segments=[['L2','M2']],availableFromStep=0)]
put(m,'neutral',cases[0]);m['checks']=[check('distanceRatio',segments=[['K'+str(i),'L'+str(i)],['L'+str(i),'M'+str(i)]],ratio=.6) for i in [1,2]]
add(79,'single',m,[cases[0],cases[1],cases[1]],cases,prompts=['Как сложить отрезки, если L находится внутри KM?','Как найти разность, если K находится внутри LM?','Может ли M лежать между K и L при данных длинах?'],reasons='Длина целого отрезка равна сумме частей и больше длины каждой его части.',theory=[7])
for part in ['а','б']:
 p={a:pt(x,35) for a,x in [('A',10),('P',50),('Q',70),('B',90),('R',30),('S',80)]}
 m=new(p,'A, P, Q, B идут в указанном порядке; AP вдвое больше каждой из частей PQ и QB.',{'A':[-2,-5],'P':[0,-5],'Q':[0,-5],'B':[2,-5],'R':[0,5],'S':[0,5]})
 s=scene(points=['A','P','Q','B'],segments=[['A','B']],equalSegments=[tick('P','Q'),tick('Q','B')]);put(m,'neutral',s)
 st=[]
 for i in range(3 if part=='а' else 4):
  t=copy.deepcopy(s);t['label']='Середины частей отрезка'
  if part=='а' and i>=1:t['points'].append('S');t['equalSegments']=[tick('Q','S',2),tick('S','B',2)]
  if part=='б':
   t['points'].append('R');t['equalSegments']=[tick('A','R',2),tick('R','P',2)]
   if i>=2:t['points'].append('S');t['equalSegments']=[tick('Q','S',2),tick('S','B',2)]
  if i==2 and part=='а':t['highlightSegments']=[['A','S']]
  if i==3:t['highlightSegments']=[['R','S']]
  st.append(t)
 m['checks']=[check('collinear',points=['A','P','Q','B']),check('distanceRatio',segments=[['A','P'],['P','Q']],ratio=2),check('equalLength',segments=[['P','Q'],['Q','B']]),check('equalLength',segments=[['A','R'],['R','P']]),check('equalLength',segments=[['Q','S'],['S','B']])]
 add(80,part,m,st,givens=['A—P—Q—B; AB=a; AP=2PQ=2QB.'],prompts=(['Найди длины частей через a.','Какова половина QB?','Какие части составляют путь от A до середины QB?'] if part=='а' else ['Какова половина AP?','Вырази длину PQ через a.','Какова половина QB?','Сложи части между двумя серединами.']),reasons='Определение середины отрезка и сложение длин последовательных частей.',theory=[6,7])
for part,n in [('а',3),('б',5)]:
 p={('_'+str(i)):pt(10+80*i/n,35) for i in range(n+1)}
 p.update({'M':pt(10+40/n,35),'N':pt(90-40/n,35)})
 m=new(p,'Отрезок разбит на '+str(n)+' равных частей; M и N — середины крайних частей.',{'M':[0,6],'N':[0,6]})
 s=scene(points=list(p),segments=[['_0','_'+str(n)]],equalSegments=[tick('_'+str(i),'_'+str(i+1)) for i in range(n)]);put(m,'neutral',s)
 t=copy.deepcopy(s);t['highlightSegments']=[['_0','M'],['N','_'+str(n)]]
 u=copy.deepcopy(s);u['highlightSegments']=[['M','N']]
 m['checks']=[check('equalLength',segments=[['_'+str(i),'_'+str(i+1)] for i in range(n)]),check('equalLength',segments=[['_0','M'],['M','_1']]),check('equalLength',segments=[['_'+str(n-1),'N'],['N','_'+str(n)]])]
 add(81,part,m,[t,u],prompts=['Какая доля целого остаётся за каждой из крайних середин?','Вычти две крайние половинки из целого.'],reasons='Равные части имеют одинаковую длину; середина делит свою часть пополам.',theory=[6,7])
# 82 choose four distinct positive parts 4, 10, 14, 8, preserving all givens.
x=lambda a:10+80*a/36
p={a:pt(x(t),35) for a,t in [('A',0),('P',4),('Q',14),('R',28),('B',36),('M',2),('N',32),('U',9),('V',21)]}
m=new(p,'Четыре неравные части отрезка AB. M и N — середины крайних частей; U и V появятся при разборе.',{'A':[-3,-6],'P':[0,-6],'Q':[0,-6],'R':[0,-6],'B':[3,-6],'M':[-1,6],'N':[1,6],'U':[0,6],'V':[0,6]})
s=scene(points=['A','P','Q','R','B','M','N'],segments=[['A','B']]);put(m,'neutral',s)
st=[]
for segs in [[['A','M'],['N','B']],[['A','P'],['R','B']],[['P','Q'],['Q','R']],[['U','V']]]:
 t=copy.deepcopy(s);t['highlightSegments']=segs;t['label']='Части отрезка'
 if len(st)==3:t['points']+=['U','V']
 st.append(t)
m['checks']=[check('distanceRatio',segments=[['M','N'],['A','B']],ratio=30/36)]+[check('equalLength',segments=[[a,b],[b,c]]) for a,b,c in [('A','M','P'),('R','N','B'),('P','U','Q'),('Q','V','R')]]
add(82,'single',m,st,givens=['AB=36 см; MN=30 см.','Четыре части AP, PQ, QR, RB неравны; M и N — середины крайних.'],prompts=['Что остаётся от AB за отрезком MN?','Найди сумму длин двух крайних частей.','Найди сумму двух средних частей.','Как связана эта сумма с расстоянием между их серединами?'],reasons='Середина делит отрезок пополам. Длины последовательных частей складываются.',theory=[6,7])
# 83 both topological arrangements; no unsupported B/N ordering argument.
p={};cases=[]
for i,coords in [(1,{'A':10,'B':42,'C':90,'M':26,'N':50}),(2,{'B':10,'A':46,'C':90,'M':28,'N':68}),(3,{'A':10,'B':78,'C':90,'M':44,'N':50})]:
 for a,x0 in coords.items():p[a+str(i)]=pt(x0,35)
 cases.append(scene(['B и C по одну сторону от A','B и C по разные стороны от A','Тот же первый случай при другом порядке B и N'][i-1],points=[a+str(i) for a in coords],segments=[[('A' if i!=2 else 'B')+str(i),'C'+str(i)]],availableFromStep=0))
m=new(p,'M — середина AB, N — середина AC. Положение B относительно N не фиксируется.',{k:([-2,-6] if k[0]=='M' else [2,6]) if k[0] in 'MN' else [0,-5] for k in p},labels={k:k[0] for k in p})
put(m,'neutral',cases[0]);m['checks']=[check('equalLength',segments=[[a+str(i),b+str(i)],[b+str(i),c+str(i)]]) for i in (1,2,3) for a,b,c in [('A','M','B'),('A','N','C')]]
add(83,'single',m,[cases[0],cases[1],cases[2]],cases,prompts=['Вырази MN через расстояния от A на одном луче.','Как изменится выражение на противоположных лучах?','Сравни два результата.'],reasons='На одном луче расстояние между точками равно разности расстояний от начала; на противоположных — их сумме. Используем определения середин.',theory=[3,6,7])
# 84 two actual angular arrangements.
def angular_cases(spec,description):
 p={};cases=[]
 for i,angles in enumerate(spec,1):
  o='O'+str(i);p[o]=pt(50,35)
  for a,deg in angles.items():p[a+str(i)]=polar(p[o],deg,29)
  cases.append(scene('Случай '+str(i),points=[o]+[a+str(i) for a in angles],rays=[[o,a+str(i)] for a in angles],availableFromStep=0))
 m=new(p,description,{k:([0,-5] if k.startswith('O') else [3,4]) for k in p},labels={k:k[0] for k in p});put(m,'neutral',cases[0]);return m,cases
m,c=angular_cases([{'A':35,'B':0,'C':-50},{'A':35,'B':0,'C':50}],'Два расположения OA и OC относительно прямой OB. Данные углы AOB и BOC одинаковы в обоих случаях.')
m['labelOffsets'].update({'A2':[4,-3],'C2':[0,5],'B2':[4,-3]})
c[0]['label']='OA и OC по разные стороны OB';c[1]['label']='OA и OC по одну сторону OB';put(m,'neutral',c[0]);st=[]
for i,v in enumerate(c,1):
 t=copy.deepcopy(v);t['angleArcs']=[arc('O'+str(i),'A'+str(i),'C'+str(i),12)];st.append(t)
m['checks']=[check('angle',points=[a+str(i),'O'+str(i),b+str(i)],degrees=d) for i in (1,2) for a,b,d in [('A','B',35),('B','C',50)]]
add(84,'single',m,st,c,givens=['∠AOB=35°, ∠BOC=50°.'],prompts=['В каком случае нужно сложить данные углы?','В каком случае нужна разность?'],reasons='Величина целого угла равна сумме его неперекрывающихся частей.',theory=[9])
m,c=angular_cases([{'h':0,'k':120,'m':150},{'h':0,'k':120,'m':210}],'Лучи k и m могут находиться по одну либо по разные стороны прямой, содержащей h.')
m['labelOnly']=[k for k in m['points'] if not k.startswith('O')];c[0]['label']='k и m по одну сторону прямой h';c[1]['label']='k и m по разные стороны прямой h';put(m,'neutral',c[0]);st=[]
t=copy.deepcopy(c[0]);t['angleArcs']=[arc('O1','k1','m1',12)];st.append(t)
t=copy.deepcopy(c[1]);t.update(label='Путь от k к m через h',angleArcs=[arc('O2','k2','m2',12,reflex=True)],note='Эта большая дуга — промежуточный путь через h. Искомый неразвёрнутый угол расположен с другой стороны.');st.append(t)
t=copy.deepcopy(c[1]);t['angleArcs']=[arc('O2','k2','m2',12)];st.append(t)
m['checks']=[check('angle',points=[a+str(i),'O'+str(i),b+str(i)],degrees=d) for i in (1,2) for a,b,d in [('h','k',120),('h','m',150)]]
add(85,'single',m,st,c,givens=['∠hk=120°, ∠hm=150°.','Ищем неразвёрнутый угол между k и m.'],prompts=['Найди разность углов в первом расположении.','Найди величину пути через h во втором расположении.','Как получить оставшийся неразвёрнутый угол из полного оборота?'],reasons='Используем сложение величин частей и полный оборот 360°; угол между данными лучами выбираем неразвёрнутым.',theory=[9])
for part,t in [('а',67.5),('б',72.5)]:
 m,st=adjacent(86,part,t,kind='rays');add(86,part,m,st,prompts=['Как найти меньший угол по сумме и разности?','Как найти оставшийся угол?'],reasons='Сумма смежных углов 180°. Один градус содержит 60 минут.',theory=[9,11])
# 87 bisectors introduced at the appropriate step.
o=pt(50,20);p={'O':o}
for name,t in [('A',0),('B',180),('C',65),('M',32.5),('N',122.5)]:p[name]=polar(o,t,35)
m=new(p,'Смежные углы AOC и COB. Их биссектрисы появляются при разборе.',{'O':[0,-5],'A':[3,-3],'B':[-3,-3],'C':[0,5],'M':[4,2],'N':[-3,4]})
s=scene(points=['O','A','B','C'],lines=[['A','B']],rays=[['O','C']]);put(m,'neutral',s)
t=copy.deepcopy(s);t['points']+=['M','N'];t['rays']+=[['O','M'],['O','N']];t['angleArcs']=[arc('O','M','C',10),arc('O','C','N',13,marks=2)]
u=copy.deepcopy(t);u['angleArcs']=[];u['rightAngles']=[right('O','M','N')]
m['checks']=[check('collinear',points=['A','O','B']),check('angle',points=['A','O','M'],degrees=32.5),check('angle',points=['M','O','C'],degrees=32.5),check('angle',points=['C','O','N'],degrees=57.5),check('angle',points=['N','O','B'],degrees=57.5),check('perpendicular',segments=[['O','M'],['O','N']])]
add(87,'single',m,[s,t,u],prompts=['Какова сумма исходных смежных углов?','Из каких половин складывается угол между биссектрисами?','Найди половину суммы исходных углов.'],reasons=['Сумма смежных углов равна 180°.','Биссектриса делит угол на две равные части.','Половина суммы равна сумме половин.'],theory=[6,11])
# 88 extension of the first bisector becomes the second.
o=pt(50,35);p={'O':o}
for name,t in [('A',25),('B',155),('C',205),('D',335),('M',90),('N',270)]:p[name]=polar(o,t,29)
m=new(p,'Две пересекающиеся прямые; OM — биссектриса верхнего угла.',{'O':[3,-5],'M':[5,0],'N':[5,0],'A':[3,2],'B':[-3,2],'C':[-3,-3],'D':[3,-3]})
s=scene(points=['O','A','B','C','D','M'],lines=[['A','C'],['B','D']],rays=[['O','M']],angleArcs=[arc('O','A','M',10,marks=1),arc('O','M','B',10,marks=1)]);put(m,'neutral',s)
t=copy.deepcopy(s);t['points'].append('N');t['dashSegments']=[['O','N']];t['label']='Продолжение OM за точку O'
u=copy.deepcopy(t);u['angleArcs']=[arc('O','C','N',10,marks=1),arc('O','N','D',10,marks=1)]
v=copy.deepcopy(u);v.pop('dashSegments');v['lines'].append(['M','N']);v['rays']=[];v['label']='Биссектрисы двух вертикальных углов'
m['checks']=[check('collinear',points=[a,'O',b]) for a,b in [('A','C'),('B','D'),('M','N')]]+[check('angle',points=[a,'O',b],degrees=65) for a,b in [('A','M'),('M','B'),('C','N'),('N','D')]]
add(88,'single',m,[t,t,u,v],prompts=['Продолжи биссектрису через вершину.','Что известно о двух половинах первого угла?','Какие нижние углы вертикальны этим половинам?','Почему продолжение также является биссектрисой?'],reasons=['Через точку на прямой имеется противоположный луч.','Определение биссектрисы.','Вертикальные углы равны.','Луч, делящий угол на равные части, является его биссектрисой.'],theory=[3,6,11])
# 89 keep the original rays valid and fixed; counterfactual in a separate scene.
p={'B':pt(50,35)}
for name,t in [('C',0),('A',110),('D',290),('E',55),('F',325)]:p[name]=polar(p['B'],t,29)
p['B2']=pt(50,20)
for name,t in [('C2',0),('A2',120),('D2',40),('E2',60),('F2',20)]:p[name]=polar(p['B2'],t,35)
m=new(p,'BE и BF — перпендикулярные биссектрисы углов ABC и CBD. Исходные лучи не перемещаются во время доказательства.',{k:[0,-5] if k in ['B','B2'] else [2,4] for k in p},labels={k:k[0] for k in p})
m['labelOffsets']['A']=[-5,0]
s=scene(points=['B','A','C','D','E','F'],rays=[['B',x] for x in ['A','C','D','E','F']],rightAngles=[right('B','E','F')]);put(m,'neutral',s)
counter=scene('Предположение: BA и BD по одну сторону BC',points=['B2','A2','C2','D2','E2','F2'],rays=[['B2',x] for x in ['A2','C2','D2','E2','F2']],angleArcs=[arc('B2','E2','F2',12)],availableFromStep=1,note='Отдельная схема предположения: биссектрисы здесь не перпендикулярны, поэтому эта конфигурация не удовлетворяет условию задачи.')
t=copy.deepcopy(s);t['rightAngles']=[];t['angleArcs']=[arc('B','E','C',10),arc('B','C','F',13,marks=2)]
u=copy.deepcopy(s);u['angleArcs']=[arc('B','A','D',12)]
v=copy.deepcopy(s);v['rays']=[['B','C'],['B','E'],['B','F']];v['lines']=[['A','D']];v['label']='Вывод о точках A, B, D'
m['checks']=[check('angle',points=['A','B','E'],degrees=55),check('angle',points=['E','B','C'],degrees=55),check('angle',points=['C','B','F'],degrees=35),check('angle',points=['F','B','D'],degrees=35),check('perpendicular',segments=[['B','E'],['B','F']]),check('collinear',points=['A','B','D'])]
add(89,'single',m,[counter,s,t,u,v],[counter],givens=['BE — внутренняя биссектриса ABC; BF — внутренняя биссектриса CBD; BE ⟂ BF.'],prompts=['Что произойдёт с углом между биссектрисами, если BA и BD лежат по одну сторону BC?','Какое взаимное расположение остаётся?','Вырази угол EBF через исходные углы.','Используй его прямой угол.','Что означает полученная сумма углов?'],reasons=['Внутренняя половина неразвёрнутого угла меньше 90°; разность двух таких углов меньше 90°.','Исключено расположение по одну сторону общей прямой.','Биссектрисы делят исходные углы пополам.','По условию угол между биссектрисами 90°.','Два луча, образующие развёрнутый угол, противоположны.'],theory=[4,6,9,12])
# 90 true perpendiculars to intersecting originals; consequence separately.
p={'O':pt(45,18),'A':pt(25,50),'H':pt(25,18),'K':pt(51,24),'_a':pt(90,18),'_b':pt(81,54),'_m':pt(25,61),'_n':pt(65,10),'_P':pt(50,20),'_Q':pt(50,50),'_a2':pt(90,20),'_b2':pt(90,50),'_m2':pt(50,62)}
m=new(p,'Прямые a и b пересекаются. Через A строятся перпендикуляры m к a и n к b.',{'A':[-3,5],'O':[-4,-5],'H':[-4,-5],'K':[4,1],'_a':[0,-5],'_b':[3,4],'_m':[3,0],'_n':[4,-3]},labels={'_a':'a','_b':'b','_m':'m','_n':'n','_a2':'a','_b2':'b','_m2':'m'})
m['labelOnly']=['_a','_b','_m','_n','_a2','_b2','_m2']
s=scene(points=['A','O','_a','_b'],lines=[['O','_a'],['O','_b']]);put(m,'neutral',s)
t=scene('Перпендикуляры через A',points=['A','O','H','K','_a','_b','_m','_n'],lines=[['O','_a'],['O','_b'],['A','H'],['A','K']],rightAngles=[right('H','A','_a'),right('K','A','_b')])
initial=copy.deepcopy(t);initial['label']='Условие';initial['points']=['A','O','_a','_b','_m','_n'];put(m,'neutral',initial)
u=scene('Следствие предположения об общей прямой m',points=['_a2','_b2','_m2'],lines=[['_P','_a2'],['_Q','_b2'],['_P','_Q']],rightAngles=[right('_P','_Q','_a2'),right('_Q','_P','_b2')],availableFromStep=2,note='Это отдельная схема следствия предположения. На ней a и b не пересекаются, что несовместимо с исходными данными.')
m['checks']=[check('collinear',points=['O','K','_b']),check('perpendicular',segments=[['A','H'],['O','_a']]),check('perpendicular',segments=[['A','K'],['O','_b']]),check('perpendicular',segments=[['_P','_Q'],['_P','_a2']]),check('perpendicular',segments=[['_P','_Q'],['_Q','_b2']])]
add(90,'single',m,[t,u,u,t],[u],prompts=['Запиши предположение о совпадении m и n, не меняя исходные прямые.','Чему тогда обе прямые a и b перпендикулярны?','Могут ли такие две прямые пересекаться?','Сравни это следствие с условием.'],reasons='Две различные прямые, перпендикулярные одной прямой, не пересекаются; в условии a и b пересекаются.',theory=[12])
# 91 equal-square grids, alternate factorizations kept separate.
def grid(points,cols,rows,prefix):
 cell=min(72/cols,38/rows);x0=50-cols*cell/2;y0=35-rows*cell/2
 for y in range(rows+1):
  for x in range(cols+1):points[prefix+str(x)+'_'+str(y)]=pt(x0+x*cell,y0+y*cell)
 seg=[]
 for x in range(cols+1):seg.append([prefix+str(x)+'_0',prefix+str(x)+'_'+str(rows)])
 for y in range(rows+1):seg.append([prefix+'0_'+str(y),prefix+str(cols)+'_'+str(y)])
 corners=[prefix+'0_0',prefix+str(cols)+'_0',prefix+str(cols)+'_'+str(rows),prefix+'0_'+str(rows)]
 return seg,corners
for part,layouts in [('а',[(2,1)]),('б',[(3,1)]),('в',[(4,1),(2,2)]),('г',[(6,1),(3,2)])]:
 p={};cases=[];corners=[]
 for i,(cols,rows) in enumerate(layouts,1):
  seg,cor=grid(p,cols,rows,'_g'+str(i)+'_');corners.append(cor)
  label=('Пример n=6: ' if part=='г' else 'Раскладка: ')+str(rows)+' ряд(а), '+str(cols)+' квадрат(а) в ряду'
  cases.append(scene(label,segments=seg,availableFromStep=0))
 m=new(p,('Пример для n=6; общие формулы далее применяются ко всем натуральным n>1.' if part=='г' else 'Прямоугольник составлен из одинаковых квадратов. Периметр каждого квадрата дан в условии.'))
 put(m,'neutral',cases[0]);st=[]
 for j in range(len(next(x for x in EX[91]['parts'] if x['part']==part)['steps'])):
  idx=1 if len(cases)>1 and ((part=='в' and j==2) or (part=='г' and j>=1)) else 0
  t=copy.deepcopy(cases[idx]);co=corners[idx]
  if j>0:t['highlightSegments']=[[co[k],co[(k+1)%4]] for k in range(4)]
  st.append(t)
 for i,(cols,rows) in enumerate(layouts,1):
  pre='_g'+str(i)+'_';m['checks'] += [check('equalLength',segments=[[pre+'0_0',pre+'1_0'],[pre+'0_0',pre+'0_1']]),check('perpendicular',segments=[[pre+'0_0',pre+'1_0'],[pre+'0_0',pre+'0_1']])]
 add(91,part,m,st,cases,givens=['Каждый квадрат имеет периметр 8 см.','Квадраты образуют прямоугольную сетку без зазоров и перекрытий.']+(['На рисунках n=6 — иллюстрация двух раскладок, а не ограничение общего условия.'] if part=='г' else []),prompts={'а':['Найди сторону одного квадрата.','Найди стороны составленного прямоугольника.','Вычисли площадь и внешний периметр.'],'б':['Найди сторону одного квадрата.','Найди стороны полосы из трёх квадратов.','Вычисли площадь и внешний периметр.'],'в':['Какова суммарная площадь четырёх квадратов?','Найди периметр раскладки в один ряд.','Сравни его с раскладкой два на два.'],'г':['Какова общая площадь n квадратов?','Какие количества квадратов могут быть в одном ряду?','Вырази стороны через число рядов и столбцов.','Запиши общий периметр и учти разные пары делителей.']}[part],reasons='У квадрата четыре равные стороны. Площади неперекрывающихся частей складываются; периметр — длина только внешней границы.',theory=[7])

# Visible line names use ordinary identifiers; underscore remains for unlabeled helpers.
for entry in OUT:
 m=entry['model']
 rename={name:name[1:] for name in m.get('labelOnly',[]) if name.startswith('_')}
 if rename:
  def names(obj):
   if isinstance(obj,str):return rename.get(obj,obj)
   if isinstance(obj,list):return [names(x) for x in obj]
   if isinstance(obj,dict):return {rename.get(k,k):names(v) for k,v in obj.items()}
   return obj
  entry['model']=names(m)

# Verify exact coverage and step counts before writing canonical content.
expected={(e['number'],p['part']) for e in EX.values() if 61<=e['number']<=91 for p in e['parts']}
assert {(x['number'],x['part']) for x in OUT}==expected
assert len(OUT)==len(expected)
for e in OUT:
 m=e['model'];known=set(m['points'])
 for k,v in m['views'].items():
  assert set(v['points'])<=known,(e['number'],k,'points')
  for kind in ['segments','lines','rays','dashSegments','highlightSegments']:
   for a,b in v.get(kind,[]):assert a in known and b in known and a!=b,(e['number'],k,kind,a,b)
  for q in v.get('rightAngles',[]):
   a=m['points'][q['a']];b=m['points'][q['b']];o=m['points'][q['vertex']]
   dot=sum((a[j]-o[j])*(b[j]-o[j]) for j in (0,1))
   assert abs(dot)<1e-7,(e['number'],k,'false right angle',dot)
path=ROOT/'geometry-course/textbook/models/chapter-01-c.json'
path.write_text(json.dumps({'schemaVersion':1,'models':OUT},ensure_ascii=False,indent=2)+'\n')
print('Models:',len(OUT),'exercises:',len(set(e['number'] for e in OUT)),'views:',sum(len(e['model']['views']) for e in OUT))
