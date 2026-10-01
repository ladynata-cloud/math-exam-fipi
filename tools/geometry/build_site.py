"""Reproducible offline HTML builder. No external script, font or image requests."""
import json,html,csv,io
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]; D=ROOT/'geometry-course'; A=D/'assets'
c=json.loads((D/'data/course.json').read_text());proofs=json.loads((D/'data/proofs.json').read_text());units=c['units'];E=html.escape
css=(A/'course.css').read_text()
def js(name):return '<script>'+((A/name).read_text()).replace('</script','<\\/script')+'</script>'
def data(name,obj):return '<script>window.'+name+'='+json.dumps(obj,ensure_ascii=False).replace('<','\\u003c')+';</script>'
def shell(title,body,scripts='',lesson=False):
 up='../' if lesson else ''
 return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+E(title)+' · MathExam</title><style>'+css+'</style></head><body><header class="topbar"><a class="brand" href="'+up+'index.html">MathExam <span class="muted">/ Геометрия</span></a><nav class="toplinks"><a href="'+up+'index.html">Карта курса</a><a href="'+up+'teacher-atlas.html">Учителю</a><button id="export-progress">Скачать прогресс</button></nav></header><div class="container"><p id="storage-notice" class="warning" hidden role="alert"></p>'+body+'<footer>Авторские объяснения и задачи по темам учебника Атанасяна и др., 7–9 классы, 2023. Измерение на чертеже помогает исследовать; доказательство объясняет общий случай. Прогресс хранится в этом браузере — скачивай файл для переноса.</footer></div>'+scripts+'</body></html>'
# Explicit prerequisites: small bridges, not a forced linear course.
req={
'angles':['segments'],'equality':['segments','angles'],'length':['segments'],'measure-angle':['angles'],
'perpendicular':['measure-angle'],'triangle-sas':['equality','angles'],'cevians':['triangle-sas','perpendicular'],'triangle-signs':['triangle-sas'],
'compass':['length','triangle-signs'],'parallels':['perpendicular'],'parallel-angles':['parallels'],'triangle-angles':['parallel-angles'],
'right-triangle':['triangle-angles','cevians'],'distance':['right-triangle'],'angle-locus':['right-triangle','cevians'],'perp-locus':['triangle-signs','compass'],
'chords-tangent':['distance','compass'],'triangle-circles':['angle-locus','perp-locus'],'axis':['perp-locus'],
'polygons':['triangle-angles'],'parallelogram':['parallel-angles','triangle-signs'],'trapezoid':['parallelogram'],
'rectangle':['parallelogram'],'rhombus':['parallelogram','triangle-signs'],'central':['parallelogram','axis'],'area-basics':['length','rectangle'],
'area-parallelogram':['area-basics','parallelogram'],'area-triangle':['area-parallelogram'],'area-trapezoid':['area-triangle','trapezoid'],
'pythagoras':['area-triangle','right-triangle'],'heron':['pythagoras','area-triangle'],'similarity':['area-triangle','triangle-signs'],
'similarity-signs':['similarity','triangle-angles'],'midline':['similarity-signs'],'centers':['midline','cevians'],'projections':['similarity-signs','pythagoras'],
'similarity-measure':['similarity-signs','distance'],'trig-right':['similarity-signs','pythagoras'],'circle-position':['distance','compass'],
'inscribed':['triangle-angles','compass'],'chord-angles':['inscribed','similarity-signs'],'cyclic-quad':['inscribed','chords-tangent'],
'vectors':['axis','parallelogram'],'vector-add':['vectors'],'vector-scale':['vector-add'],'vector-basis':['vector-scale'],
'coordinates':['vector-basis','pythagoras'],'line-circle-equations':['coordinates','compass'],'trig-circle':['trig-right','coordinates'],
'area-sine':['trig-circle','area-triangle'],'sine-rule':['area-sine','inscribed'],'cosine-rule':['trig-circle','coordinates'],
'solve-triangle':['sine-rule','cosine-rule'],'dot-product':['cosine-rule','vector-basis'],'regular-polygons':['triangle-circles','trig-right'],
'circle-metric':['regular-polygons','area-basics'],'movement':['axis','central'],'translation-rotation':['movement','vectors'],
'symmetry-method':['movement','distance'],'polygon-similarity':['similarity-signs','area-basics'],'homothety':['vector-scale','polygon-similarity'],
'similarity-method':['homothety','midline']}
experiments={'trig-circle':'trig','trig-right':'trig','homothety':'scale','similarity':'scale','polygon-similarity':'scale','similarity-method':'scale','area-parallelogram':'area','area-triangle':'area','pythagoras':'pythagoras','translation-rotation':'rotation','movement':'rotation','central':'rotation','circle-position':'circle','perpendicular':'angles','parallel-angles':'angles','measure-angle':'angles'}
goals={'midpoint':'Построй середину AB, затем передвинь A и B. Почему равенство двух частей сохраняется?','bisector':'Построй биссектрису угла ACB: выбери A, C, B. Передвинь исходные точки и проверь две части угла.','perpendicular':'Проведи через C перпендикуляр к прямой AB. Поменяй положение точек: должен меняться рисунок, а не прямой угол.','median':'Построй середину AB и соедини её с C. Может ли медиана оказаться наклонной к стороне?','perpbisector':'Построй серединный перпендикуляр к AB только окружностями, пересечениями и прямой. Две окружности: центр A через B и центр B через A.','parallel':'Проведи через C параллельную AB. Передвинь A, B и C. Чем это отличается от линии, поставленной на глаз?','altitude':'Проведи высоту из C к прямой AB. Перемести C так, чтобы основание высоты оказалось на продолжении AB.','reflection':'Отрази C относительно прямой AB. Какой отрезок прямая AB делит пополам и под каким углом?','diagonal':'Проведи диагональ четырёхугольника. Передвинь доступные вершины: какие треугольники и равенства можно использовать?','midline':'Построй середины AC и BC, затем соедини их. Поменяй размеры треугольника и сравни новое построение с AB.','explore':'Передвинь доступные точки. Сформулируй, что изменилось, а что осталось неизменным. Попробуй предельное положение и объясни, когда привычная фигура перестаёт существовать.'}
for u in units:u['requires']=req.get(u['id'],[])
(D/'data/course.json').write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
catalog=[{k:u[k] for k in ['id','title','grade','chapter','points','requires']} for u in units]
# Preserve established links and all earlier trainers.
if not (D/'legacy7.html').exists():(D/'legacy7.html').write_text((D/'index.html').read_text())
legacy=[]
from html.parser import HTMLParser
class Title(HTMLParser):
 def __init__(self):super().__init__();self.active=False;self.title=''
 def handle_starttag(self,t,a):
  if t=='title':self.active=True
 def handle_endtag(self,t):
  if t=='title':self.active=False
 def handle_data(self,d):
  if self.active:self.title+=d
for p in sorted((D/'trainers').glob('*.html')):
 s=p.read_text();s=s.replace(',user-scalable=no','').replace(', user-scalable=no','').replace('user-scalable=no,','').replace('user-scalable=no','').replace(',maximum-scale=1','').replace(', maximum-scale=1','');p.write_text(s)
 parser=Title();parser.feed(s);legacy.append(dict(title=parser.title or p.stem,href='trainers/'+p.name))
(D/'data/legacy.json').write_text(json.dumps(legacy,ensure_ascii=False,indent=2)+'\n')
(D/'atlas').mkdir(exist_ok=True)
helptext='<details><summary>Нужна помощь с вычислениями?</summary><p><strong>Знаки.</strong> Разность a−(−b)=a+b. Квадрат отрицательного числа положителен: (−3)²=9.</p><p><strong>Дроби.</strong> 2/3+1/4=8/12+3/12=11/12. При делении умножай на обратную дробь: (2/3):(4/5)=5/6.</p><p><strong>Пропорция.</strong> Из a/b=c/d при ненулевых b,d следует ad=bc. Сначала сопоставь одинаковые роли сторон.</p><p><strong>Корни.</strong> √(a²)=модуль a. Длина положительна. √(a+b) обычно не равен √a+√b.</p><p><strong>Формулы.</strong> (a±b)²=a²±2ab+b², a²−b²=(a−b)(a+b).</p><p><strong>Единицы.</strong> 1 м=100 см, но 1 м²=10000 см². Сначала переведи к одним единицам.</p></details>'
for u in units:
 source='; '.join('п. '+str(s['point'])+' «'+s['title']+'», с. '+str(s['page']) for s in u['source'])
 prereq=''.join('<a href="'+x+'.html">'+E(next(z['title'] for z in units if z['id']==x))+'</a>' for x in u['requires']) or '<p>Можно начинать без предыдущих уроков.</p>'
 sidebar='<aside class="panel sidebar"><p class="eyebrow">Путь к пониманию</p><h3>Если есть пробел</h3>'+prereq+'<p>Открой нужную тему, затем вернись кнопкой браузера: текущий шаг сохраняется.</p>'+helptext+'<details><summary>Связь с учебником</summary><p>'+E(source)+'</p><p>Разборы и числовые варианты авторские. Это не сборник решений всех упражнений.</p></details><a href="../legacy7.html">Ранее созданные тренажёры 7 класса</a></aside>'
 body='<div class="lesson-head"><p class="eyebrow">'+str(u['grade'])+' класс · глава '+str(u['chapter'])+'</p><h1>'+E(u['title'])+'</h1><span class="pill">Двигаем → строим → объясняем</span></div><nav class="stage-nav" aria-label="Этапы урока"></nav><div class="layout"><section class="panel" id="lesson"></section>'+sidebar+'</div>'
 investigation=goals[u['goal']]
 if u['goal']=='altitude' and u['figure']=='right':
  investigation='Проведи высоту из вершины прямого угла C к гипотенузе AB. Двигай C: почему основание высоты остаётся внутри AB? Какие два меньших прямоугольных треугольника получились?'
 elif u['goal']=='altitude' and u['figure']=='iso':
  investigation='Проведи высоту из вершины C к основанию AB равнобедренного треугольника. Двигай вершины: какие ещё роли выполняет эта высота? Объясни, почему основание высоты делит AB пополам.'
 cfg=dict(unit=u,proof=proofs[u['proof']],catalog=catalog,investigation=investigation,experiment=experiments.get(u['id']))
 scripts=data('COURSE_CONFIG',cfg)+''.join(js(f) for f in ['geometry.js','lab.js','experiments.js','tasks.js','store.js','lesson.js'])
 (D/'atlas'/f"{u['id']}.html").write_text(shell(u['title'],body,scripts,True))
art='''<svg viewBox="0 0 500 340" aria-hidden="true"><defs><pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#ffffff25"/></pattern></defs><rect width="500" height="340" fill="url(#dots)"/><path d="M85 270 L420 270 L240 55 Z" fill="#77bd9f25" stroke="#e8f1db" stroke-width="2.5"/><path d="M240 55L252 270M169 162L330 162" stroke="#f4bc70" stroke-width="2.5" stroke-dasharray="7 7"/><circle cx="240" cy="55" r="11" fill="#f3ba70"/><circle cx="85" cy="270" r="8" fill="#91cdbb"/><circle cx="420" cy="270" r="8" fill="#91cdbb"/><circle cx="169" cy="162" r="7" fill="#91cdbb"/><circle cx="330" cy="162" r="7" fill="#91cdbb"/><g fill="#fff9ea" font-family="system-ui" font-size="20"><text x="62" y="298">A</text><text x="426" y="298">B</text><text x="250" y="42">C</text><text x="139" y="158">M</text><text x="341" y="158">N</text></g><text x="245" y="322" text-anchor="middle" fill="#b8d5d1" font-size="14" font-family="system-ui">Не просто увидеть. Понять почему.</text></svg>'''
body='<section class="hero"><div><p class="eyebrow">Атанасян · геометрия 7–9</p><h1>Геометрия,<br>которую можно<br>исследовать.</h1><p class="lead">Двигай точки, создавай построения, проверяй догадки. Учись объяснять каждый шаг — и постепенно обходиться без подсказок.</p><div class="row"><a class="button primary" href="atlas/segments.html">Начать с основ →</a><a class="button" href="#course">Выбрать тему</a></div><div class="stats"><div class="stat"><strong>63</strong><span>учебных узла</span></div><div class="stat"><strong>137</strong><span>пунктов в карте</span></div><div class="stat"><strong id="independent-count">0</strong><span>тем с самостоятельной задачей</span></div></div></div><div class="hero-art">'+art+'</div></section><section class="panel"><div class="row"><span class="pill">01 Исследование</span><span class="pill">02 Построение</span><span class="pill">03 Обоснование</span><span class="pill">04 Своя задача</span></div><p>Карта охватывает все главы издания 2023 года. В каждом узле — объяснение, поле построений, разбор рассуждения и числовая практика. Ещё 70 ранее созданных тренажёров доступны отдельно. Полнота карты не означает, что здесь разобрано каждое упражнение учебника.</p></section><div class="filters" id="course"><button class="on" data-grade="all">Все классы</button><button data-grade="7">7 класс</button><button data-grade="8">8 класс</button><button data-grade="9">9 класс</button><input id="search" type="search" aria-label="Найти тему" placeholder="Тема, теорема или номер пункта…"></div>'
for chapter,title in enumerate(c['chapters'],1):
 body+='<section class="chapter"><div class="chapter-head"><span class="chapter-number">ГЛАВА '+str(chapter).zfill(2)+'</span><h2>'+E(title)+'</h2></div><div class="cards">'
 for u in [u for u in units if u['chapter']==chapter]:
  pts=', '.join(map(str,u['points']));body+='<article class="card course-card" data-id="'+u['id']+'"><span class="eyebrow">'+str(u['grade'])+' класс · п. '+pts+'</span><h3><a href="atlas/'+u['id']+'.html">'+E(u['title'])+'</a></h3><p>'+E(goals[u['goal']].split('. ')[0])+'.</p><div class="card-bottom"><span class="status">Можно начать</span><a href="atlas/'+u['id']+'.html" aria-label="Открыть '+E(u['title'])+'">Открыть →</a></div></article>'
 body+='</div></section>'
body+='<section class="panel"><h2>Перенести свою работу</h2><p>Скачай прогресс в верхнем меню. На другом устройстве выбери этот файл. В нём также сохраняются наблюдения и письменные доказательства.</p><label>Загрузить файл прогресса<input id="import-progress" type="file" accept=".json,application/json"></label><p id="import-result" role="status"></p><details><summary>Ещё 70 тренажёров: наложения, перегибы, построения</summary><div class="legacy-list">'+''.join('<a href="'+x['href']+'">'+E(x['title'])+'</a>' for x in legacy)+'</div></details><details><summary>Как повторять и работать с группой</summary><p>Первый проход: догадка → построение → разбор. Через день: новая задача без подсказки. Через неделю: объяснение без карточек и изменение чертежа. Учитель собирает файлы прогресса и читает письменные работы в отдельной панели.</p><a href="teacher-atlas.html">Открыть панель учителя</a></details></section>'
(D/'index.html').write_text(shell('Геометрия, которую можно исследовать',body,data('CATALOG',catalog)+js('store.js')+js('catalog.js')))
teacher='<div class="lesson-head"><p class="eyebrow">Для занятий с группой</p><h1>Смотреть на рассуждение,<br>а не только на ответ.</h1><p>Открой файлы учеников и сравни самостоятельные попытки, наблюдения и доказательства. Данные читаются здесь, в браузере; страница их никуда не отправляет.</p></div><section class="panel"><label>Файлы работ<input id="report-files" type="file" accept=".json,application/json" multiple></label><div class="row" style="margin-top:20px"><button id="local-report">Показать работу этого браузера</button><button id="clear-reports">Очистить просмотр</button></div><p id="report-error" role="alert"></p><details open><summary>Как читать результат</summary><p>«Разбор решён» означает работу с опорой. «Первая попытка» засчитывается только без открытой помощи в этом варианте. Письменное доказательство требует проверки учителем: текст не оценивается автоматически. Журнал предназначен для обучения, не для защищённого экзамена.</p><p>Для одного занятия выберите один узел. Начните с контрпримера, дайте время на собственный чертёж, обсудите назначение дополнительной линии и только затем откройте карточки. На следующем занятии предложите восстановить рассуждение без них.</p></details></section><div id="reports"></div>'
(D/'teacher-atlas.html').write_text(shell('Работы учеников',teacher,data('CATALOG',catalog)+js('store.js')+js('teacher.js')+'<script>document.getElementById("export-progress").hidden=true;</script>'))
# All source points have a visible route, but assessment scope is explicitly narrower.
f=io.StringIO();w=csv.writer(f);w.writerow(['point','chapter','printed_page','source_title','unit','lesson','practice_type','proof_argument'])
for u in units:
 for s in u['source']:w.writerow([s['point'],s['chapter'],s['page'],s['title'],u['id'],'atlas/'+u['id']+'.html',u['calc'],u['proof']])
(D/'data/coverage.csv').write_text(f.getvalue())
print('Built',len(units),'standalone lessons, catalog, teacher; retained',len(legacy),'legacy trainers')
