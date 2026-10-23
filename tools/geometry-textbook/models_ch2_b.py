#!/usr/bin/env python3
"""Authored content and exact coordinate scenes: Atanasyan 2023, II, 125–157.

Source images checked: printed 32, 38, 41–43, 48. No OCR-generated solutions.
Coordinates illustrate the actual hypotheses; alternative positions have separate
views. This author check does not constitute an independent release review.
"""
from copy import deepcopy
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXERCISES = {}
MODELS = []


def scene(points=(), segments=(), **kw):
    return dict(label=kw.pop('label', 'Условие'), points=list(points),
                segments=[list(pair) for pair in segments], **kw)


def eq(a, b, marks=1): return dict(a=a, b=b, marks=marks)
def arc(v, a, b, marks=0, radius=7):
    return dict(vertex=v, **{'from': a, 'to': b}, marks=marks, radius=radius)
def claim(kind, **kw): return dict(type=kind, **kw)
def length(points, a, b): return math.dist(points[a], points[b])
def tri(a, b, c): return [[a, b], [b, c], [c, a]]
def shift(p, dx=48, dy=0): return [p[0]+dx, p[1]+dy]
def polar(o, angle, r):
    return [o[0]+r*math.cos(math.radians(angle)), o[1]+r*math.sin(math.radians(angle))]
def midpoint(a, b): return [(a[0]+b[0])/2, (a[1]+b[1])/2]
def scaled(a, b, t): return [a[0]+t*(b[0]-a[0]), a[1]+t*(b[1]-a[1])]
def intersect(a, u, b, v):
    cross=lambda x,y:x[0]*y[1]-x[1]*y[0]
    t=cross([b[0]-a[0],b[1]-a[1]],v)/cross(u,v)
    return [a[0]+t*u[0], a[1]+t*u[1]]
def bisector_hit(p, a, b, c):
    # AD meets BC; BD:DC = AB:AC, used for coordinates only.
    ab,ac=length(p,a,b),length(p,a,c)
    return [(ac*p[b][i]+ab*p[c][i])/(ab+ac) for i in range(2)]
def incenter(p,a,b,c):
    weights=[length(p,b,c),length(p,a,c),length(p,a,b)]
    return [sum(w*p[n][i] for w,n in zip(weights,[a,b,c]))/sum(weights) for i in range(2)]
def S(prompt, explanation, reason, *theory): return (prompt,explanation,reason,list(theory))


def add(n, part, page, condition, answer, steps, points, neutral, stages=(), cases=(), checks=(), labels=None, offsets=None, notes=(), description=None, bounds=None):
    e=EXERCISES.setdefault(n,dict(number=n,printedPages=[page],pdfPages=[page+1],parts=[],notes=[]))
    e['parts'].append(dict(part=part,conditionSummary=condition,answer=answer,
                          steps=[s[1] for s in steps],sourceVerified=True,mathVerified=True,
                          visual=dict(initial='Отдельная фигура по условию; дополнительные линии открываются по шагам.',
                                      stepChanges=[],cases=[c.get('label','Вариант') for c in cases]),
                          notes=list(notes)))
    views={'neutral':deepcopy(neutral)}
    for i in range(len(steps)):
        view=deepcopy(stages[i] if i<len(stages) else stages[-1] if stages else neutral)
        view['label']=f'Шаг {i+1}'
        views[f'step-{i+1}']=view
    for i,c in enumerate(cases): views[f'case-{i+1}']=deepcopy(c)
    model=dict(points={k:[round(float(v[0]),9),round(float(v[1]),9),0] for k,v in points.items()},
               edges=[],planar=True,bounds=bounds or [0,0,100,70],views=views,checks=list(checks),
               description=description or 'Авторский чертёж к этому пункту. Буквенные подписи размещаются у вершин; доказательство читается рядом с моделью.')
    if labels: model['labels']=labels
    if offsets: model['labelOffsets']=offsets
    MODELS.append(dict(chapter=2,collection='main',number=n,part=part,model=model,
                       didactics=dict(steps=[dict(prompt=s[0],justification=s[2],theoryPoints=s[3]) for s in steps])))


# 125. Equal cut-offs on the equal legs; the two requested proofs are separate.
p={'A':[20,15],'B':[50,60],'C':[80,15],'D':[50,15],'E':[33.5,35.25],'F':[66.5,35.25]}
base=scene(p,tri('A','B','C')+[['B','D']],equalSegments=[eq('A','E'),eq('C','F')])
v=scene(p,tri('A','B','C')+[['B','D'],['D','E'],['D','F']])
checks=[claim('equalLength',segments=[['A','B'],['C','B']]),claim('equalLength',segments=[['A','E'],['C','F']]),claim('equalLength',segments=[['A','D'],['D','C']]),claim('collinear',points=['A','E','B']),claim('collinear',points=['C','F','B'])]
given='В ABC стороны AB и BC равны, BD — медиана к AC. На AB и CB выбраны E и F с AE = CF.'
add(125,'а',38,given+' Докажите равенство BDE и BDF.','△BDE = △BDF по двум сторонам и углу между ними.',[
 S('Почему BE = BF?','AB = BC и AE = CF, поэтому BE = AB − AE = BC − CF = BF.','Из равных отрезков вычитаем равные.',7,18),
 S('Какое свойство имеет медиана BD?','В равнобедренном ABC медиана BD к основанию одновременно является биссектрисой: ∠EBD = ∠DBF.','Свойство медианы к основанию равнобедренного треугольника.',18),
 S('Какие три равенства завершают доказательство?','BE = BF, BD — общая сторона, ∠EBD = ∠DBF. По первому признаку △BDE = △BDF.','Первый признак равенства треугольников.',15)],p,base,[base,v,v],checks=checks)
add(125,'б',38,given+' Докажите равенство ADE и CDF.','△ADE = △CDF по двум сторонам и углу между ними.',[
 S('Какие стороны уже равны?','AD = DC, поскольку BD — медиана; AE = CF по условию.','Определение медианы и данные задачи.',17),
 S('Почему равны углы EAD и FCD?','Лучи AE и AB совпадают, CF и CB совпадают. Углы EAD и FCD — углы при основании равнобедренного ABC, поэтому они равны.','Свойство углов при основании.',18),
 S('Какой признак применим?','Две стороны и заключённый между ними угол равны: △ADE = △CDF.','Первый признак равенства треугольников.',15)],p,base,[v,v,v],checks=checks)

# 126. CD=26, AD=15; scale two coordinate units per centimetre.
x=math.sqrt(30**2-26**2)
p={'A':[50-x,35],'B':[50+x,35],'C':[50,9],'D':[50,61],'O':[50,35]}
base=scene(p,[['A','B'],['C','D'],['A','D'],['B','C']],equalSegments=[eq('A','O'),eq('O','B')])
checks=[claim('equalLength',segments=[['A','O'],['B','O']]),claim('equalLength',segments=[['A','D'],['B','C']]),claim('distanceRatio',segments=[['A','D'],['C','D']],ratio=15/26),claim('collinear',points=['A','O','B']),claim('collinear',points=['C','O','D'])]
given='AB и CD пересекаются в O; AO = OB, ∠OAD = ∠OBC.'
proof=[S('Какие углы при O равны?','∠AOD = ∠BOC, так как это вертикальные углы.','Вертикальные углы равны.',11),S('Как сопоставить вершины?','В треугольниках CBO и DAO: BO = AO, ∠CBO = ∠DAO, ∠COB = ∠DOA.','Данные задачи и равенство вертикальных углов.',11),S('Какой признак даёт равенство?','Сторона и два прилежащих угла равны, поэтому △CBO = △DAO.','Второй признак равенства треугольников.',19)]
add(126,'а',41,given+' Докажите △CBO = △DAO.','△CBO = △DAO по стороне и двум прилежащим углам.',proof,p,base,checks=checks)
add(126,'б',41,given+' При CD = 26 см и AD = 15 см найдите BC и CO.','BC = 15 см; CO = 13 см.',proof+[
 S('Что следует о соответствующих сторонах?','Из равенства треугольников BC = AD = 15 см и CO = DO.','Соответствующие стороны равных треугольников.',14),
 S('Как найти половину CD?','O лежит на CD, поэтому CD = CO + OD = 2CO. Значит, CO = 26 : 2 = 13 см.','Сложение длин отрезков.',7)],p,base,checks=checks)

# 127. Figure 59, with lengths from part b.
h=math.sqrt(33**2-11**2)
p={'A':[12,15],'B':[23,15+h],'C':[80,15+h],'D':[69,15]}
base=scene(p,tri('A','B','C')+[['C','D'],['D','A']],angleArcs=[arc('C','B','A',1),arc('A','C','D',1),arc('C','A','D',2,11),arc('A','B','C',2,11)])
checks=[claim('equalLength',segments=[['A','B'],['C','D']]),claim('equalLength',segments=[['A','D'],['B','C']]),claim('distanceRatio',segments=[['A','D'],['C','D']],ratio=19/11)]
given='В четырёхугольнике ABCD проведена AC (рис. 59): ∠BCA = ∠CAD и ∠BAC = ∠ACD.'
proof=[S('Какую общую сторону используем?','AC — общая сторона треугольников ABC и CDA.','Отрезок равен самому себе.',14),S('Какие углы прилегают к AC?','При A в первом треугольнике и при C во втором углы равны; при C в первом и при A во втором — тоже.','Два заданных равенства углов.' ,19),S('Каков вывод?','По стороне AC и двум прилежащим углам △ABC = △CDA.','Второй признак равенства треугольников.',19)]
add(127,'а',41,given+' Докажите △ABC = △CDA.','△ABC = △CDA.',proof,p,base,checks=checks)
add(127,'б',41,given+' Найдите AB и BC при AD = 19 см, CD = 11 см.','AB = 11 см; BC = 19 см.',proof+[S('Какие стороны соответствуют AB и BC?','AB соответствует CD, а BC — AD. Поэтому AB = 11 см и BC = 19 см.','Соответствующие стороны равных треугольников.',14)],p,base,checks=checks)

# 128. Angle bisector and two equal angles at D.
p={'A':[15,35],'B':[73,60],'C':[73,10],'D':[58,35]}
base=scene(p,[['A','B'],['A','C'],['A','D'],['D','B'],['D','C']],angleArcs=[arc('A','B','D',1),arc('A','D','C',1)])
add(128,'single',41,'Точка D лежит на биссектрисе угла A; B и C — на его сторонах, причём ∠ADB = ∠ADC. Докажите BD = CD.','BD = CD.',[
 S('Какие углы при A равны?','AD лежит на биссектрисе, значит ∠BAD = ∠DAC.','Определение биссектрисы.',17),
 S('Какая сторона соединяет пары равных углов?','AD — общая; углы при A равны по свойству биссектрисы, а при D — по условию. Поэтому △ADB = △ADC по второму признаку.','Признак по стороне и двум прилежащим углам.',19),
 S('Какие стороны соответствуют?','BD и CD — соответствующие стороны равных треугольников, следовательно, BD = CD.','Свойство равных треугольников.',14)],p,base,checks=[claim('equalLength',segments=[['B','D'],['C','D']])])

# 129. Two right triangles in figure 79.
p={'C':[20,35],'O':[50,35],'B':[80,35],'T':[20,58],'P':[80,12]}
base=scene(p,[['C','B'],['T','P'],['C','T'],['B','P']],rightAngles=[dict(a='T',vertex='C',b='O'),dict(a='O',vertex='B',b='P')],equalSegments=[eq('C','O'),eq('O','B')])
add(129,'single',41,'На рис. 79 C, O, B лежат на одной прямой, T, O, P — на другой; CO = OB, CT ⟂ CB и BP ⟂ CB. Докажите OP = OT и ∠BPO = ∠CTO.','OP = OT; ∠BPO = ∠CTO.',[
 S('Какие углы можно сопоставить?','∠TCO и ∠PBO прямые; ∠TOC и ∠POB вертикальные, значит обе пары углов равны.','Прямые углы равны; вертикальные углы равны.',11,12),
 S('Какую сторону между ними используем?','CO = OB по условию, поэтому △TCO = △PBO по стороне и двум прилежащим углам.','Второй признак.',19),
 S('Что следует из равенства?','Соответствующие стороны OT и OP равны, как и соответствующие углы CTO и BPO.','Равенство соответствующих элементов.',14)],p,base,checks=[claim('equalLength',segments=[['C','O'],['O','B']]),claim('equalLength',segments=[['O','T'],['O','P']]),claim('collinear',points=['T','O','P'])])

# 130–131. Figure 80; two congruent crossed triangles.
p={'O':[50,35],'A':[80,45],'B':[40,65],'C':[56,17],'D':[32,29]}
base=scene(p,[['A','B'],['B','C'],['C','A'],['B','D'],['D','A']])
checks=[claim('collinear',points=['A','O','D']),claim('collinear',points=['B','O','C']),claim('equalLength',segments=[['A','O'],['B','O']]),claim('equalLength',segments=[['A','C'],['B','D']])]
add(130,'single',41,'На рис. 80 AD и BC пересекаются в O; ∠DAC = ∠DBC и AO = BO. Докажите ∠ACB = ∠BDA и AC = BD.','∠ACB = ∠BDA; AC = BD.',[
 S('Как переписать данные углы через O?','Лучи AD и AO совпадают, как и BC и BO. Поэтому ∠OAC = ∠OBD.','Положение O на отрезках AD и BC.',19),
 S('Какие углы при пересечении равны?','∠AOC = ∠BOD как вертикальные. Вместе с AO = BO это даёт △AOC = △BOD по второму признаку.','Вертикальные углы и второй признак.',11,19),
 S('Как вернуться к обозначениям задачи?','AC = BD и ∠ACO = ∠BDO. Лучи CO и CB, DO и DA совпадают, значит ∠ACB = ∠BDA.','Соответствующие элементы равных треугольников.',14)],p,base,checks=checks)
add(131,'single',41,'В конфигурации рис. 80 даны ∠DAB = ∠CBA, ∠CAB = ∠DBA и AC = 13 см. Найдите BD.','BD = 13 см.',[
 S('Какие треугольники имеют общую сторону AB?','Рассмотрим DAB и CBA: сторона AB общая, а обе пары прилежащих к ней углов равны по условию.','Данные задачи.',19),
 S('Какое равенство треугольников получаем?','△DAB = △CBA по второму признаку. При этом D соответствует C, A — B, B — A.','Второй признак равенства треугольников.',19),
 S('Чему равна соответствующая сторона?','BD = AC = 13 см.','Соответствующие стороны равных треугольников.',14)],p,base,checks=checks)

# 132. Two exact translated copies, with D on AB.
p={'A':[10,15],'B':[42,15],'C':[22,53],'D':[29,15]}
p.update({k+'1':shift(v) for k,v in list(p.items())})
labels={k+'1':k+'₁' for k in ['A','B','C','D']}
base=scene(p,tri('A','B','C')+tri('A1','B1','C1')+[['C','D'],['C1','D1']])
add(132,'single',41,'В ABC и A₁B₁C₁ равны AB и A₁B₁, BC и B₁C₁, углы B и B₁. На AB и A₁B₁ взяты D и D₁, причём ∠ACD = ∠A₁C₁D₁. Докажите △BCD = △B₁C₁D₁.','△BCD = △B₁C₁D₁.',[
 S('Какие исходные треугольники равны?','△ABC = △A₁B₁C₁ по двум сторонам и углу между ними. Поэтому ∠BCA = ∠B₁C₁A₁.','Первый признак и равенство соответствующих углов.',15),
 S('Как выделить углы BCD и B₁C₁D₁?','Вычтем из равных полных углов при C и C₁ равные углы ACD и A₁C₁D₁: ∠BCD = ∠B₁C₁D₁.','Вычитание равных углов.',9),
 S('Что известно при B и B₁?','D лежит на AB, D₁ — на A₁B₁, значит ∠CBD = ∠C₁B₁D₁. Вместе с BC = B₁C₁ и равенством углов при C получаем искомое равенство по второму признаку.','Второй признак.',19)],p,base,checks=[claim('collinear',points=['A','D','B']),claim('collinear',points=['A1','D1','B1']),claim('equalLength',segments=[['B','C'],['B1','C1']]),claim('equalLength',segments=[['C','D'],['C1','D1']])],labels=labels)

# 133. Corresponding bisectors in congruent triangles.
p={'A':[10,15],'B':[42,15],'C':[23,54]};p['D']=bisector_hit(p,'A','B','C')
p.update({k+'1':shift(v) for k,v in list(p.items())});labels={k+'1':k+'₁' for k in ['A','B','C','D']}
base=scene(p,tri('A','B','C')+tri('A1','B1','C1')+[['A','D'],['A1','D1']])
add(133,'single',41,'В равных ABC и A₁B₁C₁ проведены биссектрисы AD и A₁D₁ к соответствующим сторонам BC и B₁C₁. Докажите AD = A₁D₁.','Соответствующие биссектрисы равных треугольников равны.',[
 S('Какие элементы больших треугольников равны?','AB = A₁B₁, ∠A = ∠A₁, ∠B = ∠B₁, поскольку исходные треугольники равны.','Соответствующие элементы равных треугольников.',14),
 S('Какие углы делят биссектрисы?','∠BAD = ½∠A = ½∠A₁ = ∠B₁A₁D₁. Также ∠ABD = ∠A₁B₁D₁.','Определение биссектрисы; D и D₁ лежат на соответствующих сторонах.',17),
 S('Как сравнить отрезки AD и A₁D₁?','△ABD = △A₁B₁D₁ по стороне AB и двум прилежащим углам. Следовательно, AD = A₁D₁.','Второй признак и равенство соответствующих сторон.',19)],p,base,checks=[claim('equalLength',segments=[['A','D'],['A1','D1']]),claim('collinear',points=['B','D','C'])],labels=labels)

# 134. The first congruence supplies the missing two half-diagonals.
p={'A':[20,35],'C':[80,35],'O':[50,35],'B':[64,60],'D':[36,10]}
base=scene(p,[['A','C'],['B','D'],['B','C'],['A','D']])
full=scene(p,base['segments']+[['A','B'],['C','D']])
add(134,'single',42,'AC и BD пересекаются в середине AC — точке O. Известно, что ∠BCO = ∠DAO. Докажите △BOA = △DOC.','△BOA = △DOC.',[
 S('Как сначала сравнить BCO и DAO?','CO = AO; ∠BCO = ∠DAO по условию; ∠BOC = ∠DOA как вертикальные. Поэтому △BCO = △DAO по второму признаку.','Середина отрезка, вертикальные углы, второй признак.',11,19),
 S('Какой новый отрезок равен своему соответствующему?','Из равенства BCO и DAO получаем BO = DO.','Соответствующие стороны равных треугольников.',14),
 S('Какие данные подходят для BOA и DOC?','BO = DO, OA = OC и ∠BOA = ∠DOC как вертикальные. Следовательно, △BOA = △DOC по первому признаку.','Первый признак.',15)],p,base,[base,base,full],checks=[claim('collinear',points=['A','O','C']),claim('collinear',points=['B','O','D']),claim('equalLength',segments=[['O','A'],['O','C']]),claim('equalLength',segments=[['O','B'],['O','D']])])

# 135. ASA of the large triangles, then medians to AB.
p={'A':[10,15],'B':[42,15],'C':[20,53],'O':[26,15]};p.update({k+'1':shift(v) for k,v in list(p.items())})
labels={k+'1':k+'₁' for k in ['A','B','C','O']}
base=scene(p,tri('A','B','C')+tri('A1','B1','C1')+[['C','O'],['C1','O1']])
given='В ABC и A₁B₁C₁ отрезки CO и C₁O₁ — медианы; BC = B₁C₁, ∠B = ∠B₁, ∠C = ∠C₁.'
start=[S('Что дают исходные равенства?','△ABC = △A₁B₁C₁ по стороне BC и двум прилежащим углам. Значит, AB = A₁B₁, AC = A₁C₁ и ∠A = ∠A₁.','Второй признак.',19),S('Как связаны половины AB и A₁B₁?','O и O₁ — середины равных сторон. Поэтому AO = A₁O₁ и BO = B₁O₁.','Определение медианы и половины равных отрезков.',17)]
checks=[claim('equalLength',segments=[['A','O'],['O','B'],['A1','O1'],['O1','B1']]),claim('equalLength',segments=[['C','O'],['C1','O1']])]
add(135,'а',42,given+' Докажите △ACO = △A₁C₁O₁.','△ACO = △A₁C₁O₁.',start+[S('Какой признак применим к ACO?','AC = A₁C₁, AO = A₁O₁, ∠CAO = ∠C₁A₁O₁. Поэтому △ACO = △A₁C₁O₁ по первому признаку.','Две стороны и угол между ними.',15)],p,base,checks=checks,labels=labels)
add(135,'б',42,given+' Докажите △BCO = △B₁C₁O₁.','△BCO = △B₁C₁O₁.',start+[S('Какой признак применим к BCO?','BC = B₁C₁, BO = B₁O₁, ∠CBO = ∠C₁B₁O₁. Поэтому △BCO = △B₁C₁O₁ по первому признаку.','Две стороны и угол между ними.',15)],p,base,checks=checks,labels=labels)

# 136. Incenter coordinates are for rendering only; proof uses ASA, not angle sum.
p={'D':[10,15],'E':[44,15],'F':[24,54]};p['O']=incenter(p,'D','E','F')
for a,b in [('D','M'),('E','N'),('F','P'),('O','K')]:p[b]=shift(p[a])
base=scene(p,tri('D','E','F')+tri('M','N','P')+[['D','O'],['E','O'],['M','K'],['N','K']])
add(136,'single',42,'В DEF и MNP даны EF = NP, DF = MP, ∠F = ∠P. Биссектрисы углов D и E пересекаются в O, углов M и N — в K. Докажите ∠DOE = ∠MKN.','∠DOE = ∠MKN.',[
 S('Как сопоставить большие треугольники?','△DEF = △MNP по двум сторонам и углу между ними. Поэтому DE = MN, ∠D = ∠M и ∠E = ∠N.','Первый признак.',15),
 S('Какие половины равных углов получим?','∠ODE = ∠KMN и ∠OED = ∠KNM, поскольку DO, EO, MK, NK — биссектрисы соответствующих углов.','Половины равных углов равны.',17),
 S('Как сравнить углы при точках пересечения?','По стороне DE = MN и двум прилежащим углам △DOE = △MKN. Следовательно, ∠DOE = ∠MKN.','Второй признак и соответствующие углы.',19)],p,base,checks=[claim('equalLength',segments=[['D','E'],['M','N']]),claim('equalLength',segments=[['D','O'],['M','K']]),claim('equalLength',segments=[['E','O'],['N','K']])])

# 137–138. ASA around the common bisector/altitude.
p={'A':[15,35],'M':[75,60],'N':[75,10],'H':[75,35]}
base=scene(['A','M','N'],tri('A','M','N'),rays=[['A','H']])
full=scene(p,tri('A','M','N')+[['A','H']],rightAngles=[dict(a='A',vertex='H',b='M')])
add(137,'single',42,'Прямая, перпендикулярная биссектрисе угла A, пересекает его стороны в M и N. Докажите, что AMN равнобедренный.','AM = AN, поэтому △AMN равнобедренный.',[
 S('Как обозначить точку пересечения с биссектрисой?','Пусть H — пересечение MN с биссектрисой. Тогда ∠MAH = ∠HAN, а углы AHM и AHN прямые.','Определения биссектрисы и перпендикулярных прямых.',12,17),
 S('Какую общую сторону использовать?','AH общая. По ней и двум прилежащим углам △AMH = △ANH.','Второй признак.',19),
 S('Что это даёт для AMN?','AM = AN как соответствующие стороны. Следовательно, AMN равнобедренный с основанием MN.','Определение равнобедренного треугольника.',18)],p,base,[full,full,full],checks=[claim('perpendicular',segments=[['A','H'],['M','N']]),claim('equalLength',segments=[['A','M'],['A','N']])])
p={'A':[50,60],'B':[20,15],'C':[80,15],'D':[50,15]}
base=scene(p,tri('A','B','C')+[['A','D']],rightAngles=[dict(a='A',vertex='D',b='B')],angleArcs=[arc('A','B','D',1),arc('A','D','C',1)])
add(138,'single',42,'В ABC биссектриса AD одновременно является высотой. Докажите, что ABC равнобедренный.','AB = AC.',[
 S('Какие две пары углов равны?','∠BAD = ∠DAC по определению биссектрисы; ∠ADB = ∠ADC = 90°, так как AD — высота.','Определения биссектрисы и высоты.',17),
 S('Как сравнить ABD и ACD?','AD — общая сторона между указанными углами. Поэтому △ABD = △ACD по второму признаку.','Второй признак.',19),
 S('Какой вывод о большом треугольнике?','Соответствующие стороны AB и AC равны, следовательно, ABC равнобедренный.','Определение равнобедренного треугольника.',18)],p,base,checks=[claim('perpendicular',segments=[['A','D'],['B','C']]),claim('equalLength',segments=[['A','B'],['A','C']])])

# 139–140. Separate copies and correspondences.
p={'A':[26,54],'B':[10,15],'C':[42,15]};p.update({k+'1':shift(v) for k,v in list(p.items())});labels={k+'1':k+'₁' for k in ['A','B','C']}
base=scene(p,tri('A','B','C')+tri('A1','B1','C1'))
add(139,'single',42,'У двух равнобедренных треугольников ABC и A₁B₁C₁ основания BC и B₁C₁ равны; равны также углы B и B₁ при этих основаниях. Докажите равенство треугольников.','△ABC = △A₁B₁C₁.',[
 S('Чему равны вторые углы при основаниях?','В каждом равнобедренном треугольнике углы при основании равны: ∠C = ∠B и ∠C₁ = ∠B₁. Поэтому ∠C = ∠C₁.','Свойство углов при основании.',18),
 S('Какой признак теперь применим?','BC = B₁C₁, ∠B = ∠B₁ и ∠C = ∠C₁. Следовательно, треугольники равны по стороне и двум прилежащим углам.','Второй признак.',19)],p,base,checks=[claim('equalLength',segments=[['A','B'],['A','C'],['A1','B1'],['A1','C1']]),claim('equalLength',segments=[['B','C'],['B1','C1']])],labels=labels)
p={'A':[26,15+16*math.sqrt(3)],'B':[10,15],'C':[42,15]};p.update({k+'1':shift(v) for k,v in list(p.items())})
base=scene(p,tri('A','B','C')+tri('A1','B1','C1'))
add(140,'single',42,'Одна сторона равностороннего ABC равна стороне равностороннего A₁B₁C₁. Докажите, что треугольники равны.','△ABC = △A₁B₁C₁.',[
 S('Что известно обо всех сторонах каждого треугольника?','В равностороннем треугольнике все три стороны равны. Если AB = A₁B₁, то и BC = B₁C₁, CA = C₁A₁.','Определение равностороннего треугольника.',18),
 S('Какой признак достаточно применить?','Три стороны одного треугольника соответственно равны трём сторонам другого; значит, треугольники равны.','Третий признак.',20)],p,base,checks=[claim('equalLength',segments=[['A','B'],['B','C'],['C','A'],['A1','B1'],['B1','C1'],['C1','A1']])],labels=labels)

# 141. The unillustrated hypothesis permits 25° AND 155°.
p={'A':[40,35],'B':polar([40,35],25,42),'C':polar([40,35],-25,42),'D':[87,35],'D2':[16,35]}
v1=scene(['A','B','C','D'],tri('A','B','D')+[['A','C'],['C','D']],label='D внутри угла BAC',availableFromStep=0)
v2=scene(['A','B','C','D2'],tri('A','B','D2')+[['A','C'],['C','D2']],label='D на противоположном луче',availableFromStep=0)
add(141,'single',42,'В ABD и ACD даны AB = AC и BD = DC. B и C находятся по разные стороны прямой AD; ∠BAC = 50°. Найдите ∠CAD.','∠CAD = 25° или 155°; выбор зависит от направления луча AD.',[
 S('Что даёт третий признак?','AB = AC, BD = DC, AD — общая сторона. Поэтому △ABD = △ACD и ∠BAD = ∠CAD.','Третий признак.',20),
 S('Что получится, если AD проходит внутри угла BAC?','Тогда ∠BAC = ∠BAD + ∠DAC = 2∠CAD, поэтому ∠CAD = 50° : 2 = 25°.','Сложение углов.',9),
 S('Может ли D находиться на противоположном луче?','Да: условие задаёт разные стороны прямой AD, но не направление луча AD. В этом положении противоположный AD луч делит угол BAC пополам, а ∠CAD смежен с углом 25°.','Нужно различать прямую и луч.',3,11),
 S('Какой второй ответ необходимо сохранить?','Во втором положении ∠CAD = 180° − 25° = 155°. Оба положения удовлетворяют исходным равенствам, поэтому без дополнительного условия ответ содержит два значения.','Свойство смежных углов.',11)],p,v1,[v1,v1,v2,v2],cases=[v1,v2],checks=[claim('angle',points=['B','A','C'],degrees=50),claim('angle',points=['C','A','D'],degrees=25),claim('angle',points=['C','A','D2'],degrees=155),claim('equalLength',segments=[['A','B'],['A','C']]),claim('equalLength',segments=[['B','D'],['C','D']]),claim('equalLength',segments=[['B','D2'],['C','D2']])],labels={'D2':'D'},notes=['В источнике направление луча AD внутри угла BAC не задано; рассмотрены оба допустимых ответа.'])

# 142. Opposite and same half-planes, as explicitly requested in the book.
p={'A':[20,35],'C':[80,35],'B':[40,59],'D':[60,11],'D2':[60,59]}
v1=scene(['A','B','C','D'],tri('A','B','C')+[['A','D'],['D','C']],label='B и D по разные стороны AC',availableFromStep=0)
v2=scene(['A','B','C','D2'],tri('A','B','C')+[['A','D2'],['D2','C']],label='B и D по одну сторону AC',availableFromStep=0)
add(142,'single',42,'В ABC и ADC выполнены BC = AD и AB = CD. Докажите ∠ABC = ∠CDA, рассматривая разные положения B и D.','∠ABC = ∠CDA при обоих взаимных положениях B и D.',[
 S('Как сопоставить стороны?','В треугольниках ABC и CDA: AB = CD, BC = DA, AC — общая сторона. Значит, △ABC = △CDA по трём сторонам.','Третий признак.',20),
 S('Какие вершины соответствуют B и D?','B соответствует D, поэтому ∠ABC = ∠CDA. Это доказательство работает, когда B и D по разные стороны AC.','Соответствующие углы равных треугольников.',14),
 S('Меняется ли доказательство по одну сторону AC?','Нет. Все три равенства сторон сохраняются и при B и D в одной полуплоскости относительно AC; третьему признаку не требуется расположение по разные стороны общей стороны.','Третий признак не зависит от положения рисунков.',20)],p,v1,[v1,v1,v2],cases=[v1,v2],checks=[claim('equalLength',segments=[['B','C'],['A','D'],['A','D2']]),claim('equalLength',segments=[['A','B'],['C','D'],['C','D2']])],labels={'D2':'D'})

# 143. Figure 81.
p={'A':[18,15],'B':[33,55],'C':[67,55],'D':[82,15]}
base=scene(p,[['A','B'],['B','C'],['C','D'],['D','A'],['A','C'],['B','D']])
given='В четырёхугольнике ABCD на рис. 81 AB = CD и BD = AC.'
checks=[claim('equalLength',segments=[['A','B'],['C','D']]),claim('equalLength',segments=[['B','D'],['A','C']])]
add(143,'а',42,given+' Докажите ∠CAD = ∠ADB.','∠CAD = ∠ADB.',[
 S('Какие треугольники содержат нужные углы?','Рассмотрим CAD и BDA: CA = BD, CD = BA, AD — общая сторона.','Данные задачи и общая сторона.',20),
 S('Какой вывод следует по трём сторонам?','△CAD = △BDA. Вершина A первого соответствует D второго, поэтому ∠CAD = ∠BDA = ∠ADB.','Третий признак и соответствующие углы.',20)],p,base,checks=checks)
add(143,'б',42,given+' Докажите ∠BAC = ∠CDB.','∠BAC = ∠CDB.',[
 S('Как использовать общую сторону BC?','В треугольниках BAC и CDB: BA = CD, AC = DB, BC — общая сторона.','Данные задачи.',20),
 S('Какие углы соответствуют друг другу?','△BAC = △CDB по трём сторонам. Поэтому углы при A и D равны: ∠BAC = ∠CDB.','Третий признак.',20)],p,base,checks=checks)

# 144. Figure 82, with bisectors intersecting CA at their actual positions.
p={'C':[15,15],'B':[70,15],'D':[30,55],'A':[85,55]}
p['E']=bisector_hit(p,'B','A','C');p['F']=bisector_hit(p,'D','A','C')
base=scene(p,[['C','B'],['B','A'],['A','D'],['D','C'],['C','A'],['B','E'],['D','F']])
given='В ABCD (рис. 82) AB = CD, AD = BC. BE — биссектриса ABC, DF — биссектриса ADC; E и F лежат на AC.'
checks=[claim('equalLength',segments=[['A','B'],['C','D']]),claim('equalLength',segments=[['A','D'],['B','C']]),claim('collinear',points=['A','E','C']),claim('collinear',points=['A','F','C']),claim('equalLength',segments=[['B','E'],['D','F']])]
start=[S('Что известно о больших треугольниках?','△ABC = △CDA по трём сторонам: AB = CD, BC = DA, AC общая. Поэтому ∠ABC = ∠CDA и ∠BAC = ∠DCA.','Третий признак.',20),S('Как использовать биссектрисы?','∠ABE = ½∠ABC, а ∠ADF = ½∠CDA. Половины равных углов равны, значит ∠ABE = ∠ADF.','Определение биссектрисы.',17)]
add(144,'а',42,given+' Докажите ∠ABE = ∠ADF.','∠ABE = ∠ADF.',start,p,base,checks=checks)
add(144,'б',42,given+' Докажите △ABE = △CDF.','△ABE = △CDF.',start+[
 S('Какие ещё углы равны?','DF — биссектриса, поэтому ∠CDF = ∠ADF = ∠ABE. Поскольку E и F лежат на AC, ∠BAE = ∠DCF.','Биссектриса и равенство углов BAC и DCA.',17,20),
 S('Какую сторону между этими углами используем?','AB = CD; равны углы при A и C, при B и D. Следовательно, △ABE = △CDF по второму признаку.','Второй признак.',19)],p,base,checks=checks)

# 145. Median lengths are given, not a new theorem.
p={'A':[10,15],'B':[22,54],'C':[42,15],'M':[26,15]};p.update({k+'1':shift(v) for k,v in list(p.items())});labels={k+'1':k+'₁' for k in ['A','B','C','M']}
base=scene(p,tri('A','B','C')+tri('A1','B1','C1')+[['B','M'],['B1','M1']])
add(145,'single',42,'В ABC и A₁B₁C₁ медианы BM и B₁M₁ равны; AB = A₁B₁ и AC = A₁C₁. Докажите равенство треугольников.','△ABC = △A₁B₁C₁.',[
 S('Что даёт определение медиан?','AM = ½AC и A₁M₁ = ½A₁C₁, поэтому AM = A₁M₁.','Половины равных сторон равны.',17),
 S('Как сравнить меньшие треугольники?','AB = A₁B₁, BM = B₁M₁, AM = A₁M₁. Значит, △ABM = △A₁B₁M₁ по трём сторонам и ∠BAM = ∠B₁A₁M₁.','Третий признак.',20),
 S('Как получить равенство больших треугольников?','Лучи AM и AC совпадают, как и A₁M₁ и A₁C₁. Значит, ∠BAC = ∠B₁A₁C₁. С AB = A₁B₁ и AC = A₁C₁ это даёт равенство по первому признаку.','Первый признак.',15)],p,base,checks=[claim('equalLength',segments=[['A','M'],['M','C'],['A1','M1'],['M1','C1']]),claim('equalLength',segments=[['B','M'],['B1','M1']])],labels=labels)

# 146. SSS of ABD, followed by ASA of the original triangles.
p={'A':[10,15],'B':[42,15],'C':[23,54]};p['D']=bisector_hit(p,'A','B','C');p.update({k+'1':shift(v) for k,v in list(p.items())});labels={k+'1':k+'₁' for k in ['A','B','C','D']}
base=scene(p,tri('A','B','C')+tri('A1','B1','C1')+[['A','D'],['A1','D1']])
add(146,'single',43,'В ABC и A₁B₁C₁ отрезки AD и A₁D₁ — биссектрисы. Даны AB = A₁B₁, BD = B₁D₁ и AD = A₁D₁. Докажите △ABC = △A₁B₁C₁.','△ABC = △A₁B₁C₁.',[
 S('Какие треугольники равны по исходным данным?','△ABD = △A₁B₁D₁ по трём сторонам. Значит, ∠BAD = ∠B₁A₁D₁ и ∠ABD = ∠A₁B₁D₁.','Третий признак.',20),
 S('Как восстановить полный угол при A?','AD и A₁D₁ — биссектрисы, поэтому ∠BAC = 2∠BAD = 2∠B₁A₁D₁ = ∠B₁A₁C₁.','Определение биссектрисы.',17),
 S('Что известно об углах при B?','D лежит на BC, D₁ — на B₁C₁, значит ∠ABC = ∠A₁B₁C₁. По стороне AB = A₁B₁ и двум прилежащим углам исходные треугольники равны.','Второй признак.',19)],p,base,checks=[claim('equalLength',segments=[['A','D'],['A1','D1']]),claim('equalLength',segments=[['B','D'],['B1','D1']])],labels=labels)

# 147. Both positions of A and B relative to the shared base DC.
p={'D':[20,30],'C':[80,30],'O':[50,30],'A':[50,64],'B':[50,8],'B2':[50,40]}
v1=scene(['A','B','C','D','O'],tri('A','D','C')+[['B','D'],['B','C'],['A','B']],label='A и B по разные стороны DC',availableFromStep=0)
v2=scene(['A','B2','C','D','O'],tri('A','D','C')+[['B2','D'],['B2','C']],lines=[['A','B2']],label='A и B по одну сторону DC',availableFromStep=0)
given='Равнобедренные ADC и BCD имеют общее основание DC. Прямая AB пересекает DC в O.'
checks=[claim('equalLength',segments=[['A','D'],['A','C']]),claim('equalLength',segments=[['B','D'],['B','C']]),claim('equalLength',segments=[['B2','D'],['B2','C']]),claim('equalLength',segments=[['D','O'],['O','C']]),claim('collinear',points=['A','B','O']),claim('collinear',points=['A','B2','O'])]
start=[S('Какие треугольники можно сравнить по трём сторонам?','В ADB и ACB: AD = AC, DB = CB, AB — общая сторона. Значит, △ADB = △ACB.','Равные боковые стороны и третий признак.',18,20)]
add(147,'а',43,given+' Докажите ∠ADB = ∠ACB.','∠ADB = ∠ACB.',start+[S('Какие углы соответствуют друг другу?','При указанном соответствии D ↔ C. Поэтому ∠ADB = ∠ACB. Это верно при A и B как по разные, так и по одну сторону DC.','Соответствующие углы равных треугольников.',14)],p,v1,[v1,v2],cases=[v1,v2],checks=checks,labels={'B2':'B'},bounds=[0,0,100,85])
add(147,'б',43,given+' Докажите DO = OC.','DO = OC.',start+[
 S('Что известно о равенстве углов при A?','Из равенства треугольников ∠DAB = ∠BAC. Если луч AO совпадает с AB, то ∠DAO = ∠OAC; если противоположен ему, получаем равенство смежных с ними углов.','Равенство соответствующих углов и их смежных углов.',11,14),
 S('Как сравнить ADO и ACO?','AD = AC, AO — общая сторона, ∠DAO = ∠OAC. По первому признаку △ADO = △ACO, откуда DO = OC.','Первый признак.',15)],p,v1,[v1,v2,v2],cases=[v1,v2],checks=checks,labels={'B2':'B'},bounds=[0,0,100,85])

# 148. Faithful figure96: C1D1 is not a radius; TS is exterior.
o=[48,35];r=24
p={'O':o,'A':polar(o,-60,r),'B':polar(o,120,r),'P':polar(o,180,r),'M':polar(o,155,r),'N':polar(o,25,r),'C':polar(o,200,r),'D':polar(o,275,r),'C1':polar(o,85,r),'D1':[61,40],'T':polar(o,10,r)}
p['S']=[88,p['T'][1]]
segs=[['A','B'],['M','N'],['C','D'],['P','O'],['C1','D1'],['T','S']]
base=scene(p,segs,circles=[dict(center='O',through='A')])
labels={'C1':'C₁','D1':'D₁'}
given='Рассмотрите модель рис. 96 с центром O: показаны AB, MN, CD, PO, C₁D₁ и TS.'
checks=[claim('equalLength',segments=[['O',k] for k in ['A','B','P','M','N','C','D','C1','T']]),claim('collinear',points=['A','O','B'])]
for part,question,answer,highlight,steps in [
 ('а','Какие из изображённых отрезков — хорды?','AB, MN и CD.',[['A','B'],['M','N'],['C','D']],[S('Где должны лежать оба конца хорды?','Оба конца хорды принадлежат окружности. Этому условию удовлетворяют AB, MN и CD.','Определение хорды.',21),S('Почему остальные отрезки не подходят?','У PO один конец — центр; D₁ лежит внутри окружности; S — вне неё. Поэтому PO, C₁D₁, TS не являются хордами.','Для хорды нужны два конца на окружности.',21)]),
 ('б','Какой отрезок является диаметром?','AB.',[['A','B']],[S('Как отличить диаметр от другой хорды?','Диаметр — хорда через центр. AB проходит через O, значит AB — диаметр.','Определение диаметра.',21)]),
 ('в','Какие отрезки рисунка являются радиусами?','OA, OB и OP.',[['O','A'],['O','B'],['O','P']],[S('Что соединяет радиус?','Радиус соединяет центр с точкой окружности. На рисунке это OA, OB и OP; OA и OB — части изображённого диаметра AB.','Определение радиуса.',21),S('Почему C₁D₁ не является радиусом?','Хотя C₁ лежит на окружности, D₁ не совпадает с центром O.','У радиуса один конец обязательно центр.',21)])]:
    v=deepcopy(base);v['highlightSegments']=highlight
    add(148,part,48,given+' '+question,answer,steps,p,base,[v]*len(steps),checks=checks,labels=labels)

# 149. Two arbitrary diameters; no theorem on inscribed angles is assumed.
o=[50,35];p={'O':o,'A':[25,35],'B':[75,35],'C':polar(o,65,25),'D':polar(o,245,25)}
base=scene(p,[['A','B'],['C','D']],circles=[dict(center='O',through='A')])
full=scene(p,[['A','B'],['C','D'],['A','C'],['B','D'],['A','D'],['B','C']],circles=[dict(center='O',through='A')])
checks=[claim('equalLength',segments=[['O','A'],['O','B'],['O','C'],['O','D']]),claim('equalLength',segments=[['B','D'],['A','C']]),claim('equalLength',segments=[['A','D'],['B','C']])]
given='AB и CD — диаметры одной окружности с центром O.'
proofa=[S('Какие радиусы и углы равны?','OA = OB, OC = OD как радиусы. ∠AOC = ∠BOD как вертикальные.','Радиусы одной окружности и вертикальные углы.',11,21),S('Как сравнить нужные хорды?','△AOC = △BOD по первому признаку, поэтому AC = BD.','Первый признак и соответствующие стороны.',15)]
proofb=[S('Какие пары треугольников нужны?','Рассмотрим AOD и BOC: OA = OB, OD = OC как радиусы, а ∠AOD = ∠BOC как вертикальные.','Радиусы и вертикальные углы.',11,21),S('Какой вывод получается?','△AOD = △BOC по первому признаку, поэтому AD = BC.','Первый признак.',15)]
add(149,'а',48,given+' Докажите BD = AC.','BD = AC.',proofa,p,base,[full,full],checks=checks)
add(149,'б',48,given+' Докажите AD = BC.','AD = BC.',proofb,p,base,[full,full],checks=checks)
add(149,'в',48,given+' Докажите ∠BAD = ∠BCD.','∠BAD = ∠BCD.',proofb+[
 S('Какие большие треугольники равны?','В BAD и DCB: BA = DC как диаметры одной окружности, AD = CB доказано, BD — общая сторона. Поэтому △BAD = △DCB по трём сторонам.','Диаметр равен двум радиусам; третий признак.',20,21),
 S('Какие углы соответствуют?','Угол BAD соответствует углу DCB, то есть BCD. Поэтому ∠BAD = ∠BCD.','Соответствующие углы.',14)],p,base,[full]*4,checks=checks)

# 150. The radius to P is the median of an isosceles triangle.
p={'O':[50,35],'M':[25,35],'K':[75,35],'P':[50,60]}
base=scene(p,[['M','K'],['M','P'],['P','K']],circles=[dict(center='O',through='M')])
full=scene(p,base['segments']+[['O','P']],circles=[dict(center='O',through='M')],rightAngles=[dict(a='P',vertex='O',b='M')])
add(150,'single',48,'MK — диаметр окружности с центром O; хорды MP и PK равны. Найдите ∠POM.','∠POM = 90°.',[
 S('Какой треугольник образуют равные хорды?','PM = PK, поэтому PMK равнобедренный с основанием MK. O — середина диаметра MK.','Определения равнобедренного треугольника и диаметра.',18,21),
 S('Какую роль играет PO?','PO — медиана к основанию равнобедренного треугольника; она также является высотой. Следовательно, PO ⟂ MK.','Свойство медианы равнобедренного треугольника.',18),
 S('Чему равен искомый угол?','OM лежит на MK, поэтому ∠POM = 90°.','Определение перпендикулярности.',12)],p,base,[base,full,full],checks=[claim('equalLength',segments=[['P','M'],['P','K']]),claim('equalLength',segments=[['O','M'],['O','K'],['O','P']]),claim('angle',points=['P','O','M'],degrees=90)])

# 151. Exact radius8 and chord13, rendered at scale3.
cx=8-169/16;cy=math.sqrt(64-cx*cx)
p={'O':[50,35],'A':[26,35],'B':[74,35],'C':[50+3*cx,35+3*cy],'D':[50-3*cx,35-3*cy]}
base=scene(p,[['A','B'],['C','D'],['C','B']],circles=[dict(center='O',through='A')])
full=scene(p,base['segments']+[['A','D']],circles=[dict(center='O',through='A')])
add(151,'single',48,'AB и CD — диаметры окружности с центром O; CB = 13 см, AB = 16 см. Найдите периметр AOD.','P(AOD) = 29 см.',[
 S('Как найти радиусы AO и OD?','AO = OD = AB : 2 = 8 см, поскольку все радиусы одной окружности равны.','Диаметр вдвое больше радиуса.',21),
 S('Почему AD равно известной хорде CB?','В AOD и BOC равны две пары радиусов и вертикальные углы при O. По первому признаку треугольники равны, значит AD = BC = 13 см.','Первый признак.',11,15),
 S('Как вычислить периметр?','P(AOD) = AO + OD + AD = 8 + 8 + 13 = 29 см.','Периметр — сумма длин сторон.',14)],p,base,[base,full,full],checks=[claim('equalLength',segments=[['O','A'],['O','B'],['O','C'],['O','D']]),claim('distanceRatio',segments=[['B','C'],['A','B']],ratio=13/16),claim('equalLength',segments=[['A','D'],['B','C']])])

# 152. Both central angles are right.
p={'O':[50,35],'A':[50,60],'B':[25,35],'C':[75,35]}
base=scene(p,[['B','C'],['A','O'],['A','B'],['A','C']],circles=[dict(center='O',through='A')],rightAngles=[dict(a='A',vertex='O',b='B')])
add(152,'single',48,'A и B лежат на окружности с центром O, ∠AOB = 90°. BC — диаметр. Докажите AB = AC.','AB = AC.',[
 S('Чему равен смежный угол AOC?','OB и OC — противоположные лучи, поэтому ∠AOC = 180° − 90° = 90°.','Свойство смежных углов.',11),
 S('Какие стороны в AOB и AOC равны?','OA — общая сторона, OB = OC как радиусы. Углы AOB и AOC между ними равны.','Радиусы одной окружности.',21),
 S('Как получить равенство хорд?','△AOB = △AOC по первому признаку, поэтому AB = AC.','Первый признак.',15)],p,base,checks=[claim('equalLength',segments=[['O','A'],['O','B'],['O','C']]),claim('angle',points=['A','O','B'],degrees=90),claim('equalLength',segments=[['A','B'],['A','C']])])

# 153. Extend beyond A along BA, never along the opposite ray.
p={'B':[20,35],'A':[45,35],'C':[70,35]}
base=scene(['A','B'],lines=[['B','A']])
v=scene(p,[['B','A'],['A','C']],rays=[['B','C']],equalSegments=[eq('B','A'),eq('A','C')])
add(153,'single',48,'На прямой даны A и B. На продолжении луча BA постройте C, для которой BC = 2AB.','Отложите AC = AB за точкой A на луче BA; тогда BC = 2AB.',[
 S('В каком направлении должна находиться C?','Двигаемся от B через A и далее; A должна лежать между B и C.','Порядок точек на продолжении луча.',3),
 S('Как перенести длину AB циркулем?','Проведём окружность с центром A радиуса AB. Из её пересечений с прямой AB выберем C, противоположную B относительно A. Тогда AC = AB.','Построение отрезка, равного данному.',22),
 S('Почему результат удовлетворяет условию?','BC = BA + AC = AB + AB = 2AB.','Сложение отрезков при A между B и C.',7)],p,base,[base,v,v],checks=[claim('collinear',points=['B','A','C']),claim('equalLength',segments=[['B','A'],['A','C']]),claim('distanceRatio',segments=[['B','C'],['A','B']],ratio=2)])

# 154. Circle/line intersections; reference segment changes with the data case.
p={'B':[50,40],'_l':[12,20],'_r':[88,20],'P':[12,6],'Q':[37,6],'_R':[75,40],'M':[35,20],'N':[65,20],
   'Q1':[32,6],'_R1':[70,40],'M1':[50,20],'Q0':[24,6],'_R0':[62,40]}
base=scene(['B','P','Q'],[['P','Q']],lines=[['_l','_r']])
v2=scene(['B','P','Q','M','N'],[['P','Q']],lines=[['_l','_r']],circles=[dict(center='B',through='_R')],label='Две точки пересечения',availableFromStep=1)
v1=scene(['B','P','Q1','M1'],[['P','Q1']],lines=[['_l','_r']],circles=[dict(center='B',through='_R1')],label='Одна точка: касание',availableFromStep=1)
v0=scene(['B','P','Q0'],[['P','Q0']],lines=[['_l','_r']],circles=[dict(center='B',through='_R0')],label='Пересечений нет',availableFromStep=1)
add(154,'single',48,'Даны прямая a, точка B вне неё и отрезок PQ. Постройте на a точку M с BM = PQ. Всегда ли она существует?','Искомые точки — пересечения a с окружностью центра B радиуса PQ. Возможны две, одна или ни одной.',[
 S('Где находятся все точки на расстоянии PQ от B?','Они образуют окружность с центром B и радиусом PQ. Построим её циркулем.','Определение окружности.',21,22),
 S('Как одновременно выполнить условие M ∈ a?','Берём общие точки построенной окружности и прямой a. Каждая такая точка M лежит на a и имеет BM = PQ.','Пересечение двух требований задачи.',21),
 S('Всегда ли прямая пересечёт эту окружность?','Нет. Прямая может пересечь окружность в двух точках, коснуться в одной или пройти вне неё. Отдельные варианты модели показывают все три случая для разных длин PQ.','Существование решения определяется наличием общих точек.',21)],p,base,[v2,v2,v0],cases=[v2,v1,v0],checks=[claim('equalLength',segments=[['B','M'],['B','N'],['P','Q']]),claim('equalLength',segments=[['B','M1'],['P','Q1']])],labels={'Q1':'Q','Q0':'Q','M1':'M'},description='Три отдельных набора исходных данных: для каждого PQ задаёт свой радиус. Число решений видно по пересечениям одной окружности с одной прямой.')

# 155. Include the often missed coincident-circles case A=O.
xx=(15**2-28**2+35**2)/(2*35);yy=math.sqrt(15**2-xx**2)
p={'O':[30,35],'_T':[45,35],'A':[65,35],'P':[12,6],'Q':[40,6],'_R':[93,35],'M':[30+xx,35+yy],'N':[30+xx,35-yy],
   'Q1':[32,6],'_R1':[85,35],'M1':[45,35],'Q0':[22,6],'_R0':[75,35],
   'OA':[50,35],'_Tinf':[65,35],'Pinf':[12,6],'Qinf':[27,6]}
base=scene(['O','A','P','Q'],[['P','Q']],circles=[dict(center='O',through='_T')])
v2=scene(['O','A','P','Q','M','N'],[['P','Q']],circles=[dict(center='O',through='_T'),dict(center='A',through='_R')],label='Две общие точки',availableFromStep=1)
v1=scene(['O','A','P','Q1','M1'],[['P','Q1']],circles=[dict(center='O',through='_T'),dict(center='A',through='_R1')],label='Одна общая точка',availableFromStep=1)
v0=scene(['O','A','P','Q0'],[['P','Q0']],circles=[dict(center='O',through='_T'),dict(center='A',through='_R0')],label='Общих точек нет',availableFromStep=1)
vi=scene(['OA','Pinf','Qinf'],[['Pinf','Qinf']],circles=[dict(center='OA',through='_Tinf')],label='A — центр, окружности совпали',availableFromStep=3)
add(155,'single',48,'Даны окружность, точка A, не лежащая на ней, и отрезок PQ. Постройте на окружности M так, чтобы AM = PQ. Всегда ли это возможно?','Пересеките данную окружность с окружностью центра A радиуса PQ. Возможны 0, 1, 2 решения; при совпадении окружностей — бесконечно много.',[
 S('Как выразить условие AM = PQ геометрически?','Построим окружность с центром A и радиусом PQ. Все её точки и только они удовлетворяют AM = PQ.','Определение окружности.',21),
 S('Какие точки удовлетворяют обоим условиям?','Общие точки двух окружностей лежат на данной окружности и находятся на расстоянии PQ от A. Каждая из них — решение.','Пересечение условий.',21),
 S('Всегда ли есть общие точки?','Нет. Для двух несовпадающих окружностей возможны отсутствие общих точек, одна точка касания либо две точки пересечения.','Решение существует именно при наличии пересечения.',21),
 S('Какой особый случай допускает условие?','A может быть центром данной окружности: центр не лежит на окружности. Если PQ равен её радиусу, построенная окружность совпадает с данной и подходит любая её точка; решений бесконечно много. Если при том же центре радиусы различны, решений нет.','Определение окружности и точное чтение условия «не лежит на ней».',21)],p,base,[v2,v2,v0,vi],cases=[v2,v1,v0,vi],checks=[claim('equalLength',segments=[['O','M'],['O','N'],['O','_T']]),claim('equalLength',segments=[['A','M'],['A','N'],['P','Q']]),claim('equalLength',segments=[['A','M1'],['P','Q1']]),claim('equalLength',segments=[['OA','_Tinf'],['Pinf','Qinf']])],labels={'Q1':'Q','Q0':'Q','M1':'M','OA':'A = O','Pinf':'P','Qinf':'Q'},notes=['Фраза «не лежит на окружности» допускает точку внутри круга, в том числе центр. Это не условие «вне круга».'],description='Варианты показываются отдельно. В варианте совпадения рисуется одна общая окружность; никаких двух совпадающих контуров не накладывается.')

# 156. Two consecutive copies of the given acute angle.
p={'A':[15,48],'B':[37,48],'C':polar([15,48],35,22),'X':[55,15],'Y':[90,15],'W':polar([55,15],35,35),'Z':polar([55,15],70,35)}
base=scene(['A','B','C','X','Y'],[['A','B'],['A','C']],rays=[['X','Y']])
v1=scene(['A','B','C','X','Y','W'],[['A','B'],['A','C']],rays=[['X','Y'],['X','W']])
v2=scene(p,[['A','B'],['A','C']],rays=[['X','Y'],['X','W'],['X','Z']])
add(156,'single',48,'Даны острый ∠BAC и луч XY. Постройте ∠YXZ, равный удвоенному ∠BAC.','Последовательно отложите от XY два угла, каждый равный ∠BAC.',[
 S('Как получить первую копию данного угла?','Построением из пункта 23 отложим от XY угол YXW, равный BAC, в выбранную полуплоскость.','Построение угла, равного данному.',23),
 S('В какую сторону откладывать вторую копию?','От XW отложим угол WXZ, равный BAC, по другую сторону от XW относительно луча XY, чтобы новый угол продолжал первый.','Повторное построение равного угла.',23),
 S('Почему сумма даёт нужный угол?','Так как BAC острый, 2∠BAC < 180°. Луч XW находится внутри YXZ; поэтому ∠YXZ = ∠YXW + ∠WXZ = 2∠BAC.','Сложение углов и условие остроты.',9)],p,base,[v1,v2,v2],checks=[claim('angle',points=['B','A','C'],degrees=35),claim('angle',points=['Y','X','W'],degrees=35),claim('angle',points=['W','X','Z'],degrees=35),claim('angle',points=['Y','X','Z'],degrees=70)],description='Иллюстрация построения на примере острого угла 35°. Точные размеры служат для проверки модели; способ действует для любого острого угла.')

# 157. The opposite ray to the internal bisector gives two equal obtuse angles.
o=[50,35]
p={'O':o,'A':polar(o,0,34),'B':polar(o,110,30),'M':polar(o,55,28),'X':polar(o,235,30)}
base=scene(['O','A','B'],rays=[['O','A'],['O','B']])
v1=scene(['O','A','B','M'],rays=[['O','A'],['O','B'],['O','M']],angleArcs=[arc('O','A','M',1),arc('O','M','B',1)])
v2=scene(p,rays=[['O','A'],['O','B'],['O','M'],['O','X']])
add(157,'single',48,'Дан тупой ∠AOB. Постройте луч OX так, чтобы ∠XOA и ∠XOB были равными тупыми углами.','Постройте биссектрису OM угла AOB и проведите противоположный ей луч OX.',[
 S('Как получить равные части исходного угла?','Циркулем и линейкой построим биссектрису OM. Тогда ∠AOM = ∠MOB = ½∠AOB.','Построение биссектрисы.',23),
 S('Как получить равные углы вне исходного?','Продолжим прямую OM за O и выберем на противоположном луче точку X. Углы XOA и XOB смежны соответственно с AOM и MOB.','Противоположные лучи и смежные углы.',11),
 S('Почему оба угла равны и тупые?','Оба равны 180° − ½∠AOB. Поскольку 90° < ∠AOB < 180°, его половина лежит между 45° и 90°, а искомые углы — между 90° и 135°. Значит, они равны и тупые.','Свойство смежных углов и границы тупого угла.',11)],p,base,[v1,v2,v2],checks=[claim('collinear',points=['M','O','X']),claim('angle',points=['A','O','B'],degrees=110),claim('angle',points=['A','O','M'],degrees=55),claim('angle',points=['M','O','B'],degrees=55),claim('angle',points=['X','O','A'],degrees=125),claim('angle',points=['X','O','B'],degrees=125)])


def main():
    expected=set(range(125,158))
    assert set(EXERCISES)==expected
    keys=[(m['number'],m['part']) for m in MODELS]
    assert len(keys)==len(set(keys))
    from check_models import validate
    for m in MODELS:
        errors=validate(m['model'])
        assert not errors, (m['number'],m['part'],errors)
    prep=dict(bookId='atanasyan-2023-7-9',edition='14-е издание, переработанное, 2023',chapter=2,
              title='Треугольники',status='authored-awaiting-independent-review',
              source=dict(pdfSha256='3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72',
                          printedPages=[38,41,42,43,48],figureReferencePages=[32],
                          verification='Все условия и рисунки сверены автором визуально по указанным страницам PDF; OCR использован только как вспомогательный текст.'),
              review=dict(independent=False,status='pending'),
              coverage=dict(first=125,last=157,numbers=len(EXERCISES),parts=len(MODELS)),
              exercises=[EXERCISES[n] for n in sorted(EXERCISES)])
    target=ROOT/'geometry-course/textbook'
    (target/'preparation/chapter-02-b.json').write_text(json.dumps(prep,ensure_ascii=False,indent=2)+'\n')
    (target/'models/chapter-02-b.json').write_text(json.dumps(dict(schemaVersion=1,chapter=2,models=MODELS),ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(dict(numbers=len(EXERCISES),parts=len(MODELS),views=sum(len(x['model']['views']) for x in MODELS),steps=sum(len(x['didactics']['steps']) for x in MODELS),claims=sum(len(x['model']['checks']) for x in MODELS))))


if __name__=='__main__':main()
