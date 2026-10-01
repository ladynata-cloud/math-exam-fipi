"""Build a source-specific geometry course from checked-in content and assets."""
from pathlib import Path
import json,html
ROOT=Path(__file__).resolve().parents[2]
author=Path(__file__).parent.name
D=ROOT/('geometry-'+author); A=D/'assets'
c=json.loads((D/'data/course.json').read_text()); P=json.loads((D/'data/proofs.json').read_text()); units=c['units']; E=html.escape
catalog=[{k:u[k] for k in ['id','title','grade','chapter','points','requires']} for u in units]
def data(name,obj):return '<script>window.'+name+'='+json.dumps(obj,ensure_ascii=False).replace('<','\\u003c')+';</script>'
def scripts(names,up=''):return ''.join('<script src="'+up+'assets/'+n+'"></script>' for n in names)
def shell(title,body,code='',lesson=False):
 up='../' if lesson else ''
 return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+E(title)+' · '+E(c['name'])+' · MathExam</title><link rel="stylesheet" href="'+up+'assets/course.css"><link rel="stylesheet" href="'+up+'assets/space.css"></head><body><header class="topbar"><a class="brand" href="'+up+'index.html">Геометрия · '+E(c['name'])+'</a><nav class="toplinks"><a href="/">Главная</a><a href="/ege-baza/">ЕГЭ база</a><a href="'+up+'index.html">Карта курса</a><a href="'+up+'teacher.html">Учителю</a><button id="export-progress">Скачать прогресс</button></nav></header><main class="container"><p id="storage-notice" class="warning" hidden role="alert"></p>'+body+'<footer>Авторские объяснения и задачи. '+E(c['edition'])+' Полная карта пунктов не означает разбор всех упражнений. Измерение помогает исследовать, а доказательство объясняет общий случай. Результаты хранятся только в этом браузере.</footer></main>'+code+'</body></html>'
(D/'atlas').mkdir(exist_ok=True)
for u in units:
 source='; '.join(str(s['grade'])+' класс, '+s['track']+', п. '+str(s['point'])+' «'+s['title']+'»'+(', с. '+str(s['page']) if s.get('page') else '') for s in u['source'])
 prereq=''.join('<a href="'+x+'.html">'+E(next(z['title'] for z in units if z['id']==x))+'</a>' for x in u['requires']) or '<p>Начни с объяснения и исследуй предложенную модель.</p>'
 sidebar='<aside class="panel sidebar"><h3>Если есть пробел</h3>'+prereq+'<p>После повторения вернись кнопкой браузера: шаг урока сохраняется.</p><details><summary>Связь с учебником</summary><p>'+E(source)+'</p><p>Числовые упражнения авторские. Это не ответы ко всем номерам учебника.</p></details><a href="/trainers/oge-basics/">Повторить арифметику</a></aside>'
 body='<div class="lesson-head"><p class="eyebrow">'+str(u['grade'])+' класс · '+('Основной маршрут' if u['track']=='base' else 'Углубление')+'</p><h1>'+E(u['title'])+'</h1><span class="pill">Исследуй → построй → объясни → реши</span></div><nav class="stage-nav" aria-label="Этапы урока"></nav><div class="layout"><section class="panel" id="lesson"></section>'+sidebar+'</div>'
 cfg=dict(unit=u,proof=P[u['proof']],catalog=catalog,investigation=u['investigation'],experiment=u.get('experiment'))
 code=data('COURSE_CONFIG',cfg)+scripts(['geometry.js','lab.js','experiments.js','extra-models.js','tasks.js','extra-tasks.js','space.js','viewer.js','store.js','lesson.js'],'../')
 (D/'atlas'/(u['id']+'.html')).write_text(shell(u['title'],body,code,True))
body='<section class="hero"><div><p class="eyebrow">'+E(c['name'])+' · 7–9 классы</p><h1>Геометрию можно<br>построить самому.</h1><p class="lead">Двигай точки, выбирай дополнительные линии, собирай доказательство и проверяй новый вариант без подсказки.</p><div class="row"><a class="button primary" href="atlas/'+units[0]['id']+'.html">Начать с основ →</a><a class="button" href="#course">Найти тему</a></div></div><div class="panel"><h2>'+str(len(units))+' учебных узла</h2><p>'+str(len(c['sources']))+' пунктов в карте источников. Объяснение, построение, рассуждение и числовая практика в каждом узле.</p><p><strong id="independent-count">0</strong> тем с самостоятельным решением в этом браузере.</p><p>Начальная версия курса: отдельные типы задач, а не весь задачник. Углублённые темы явно выделены.</p></div></section><div class="filters" id="course"><button class="on" data-grade="all">Все классы</button><button data-grade="7">7 класс</button><button data-grade="8">8 класс</button><button data-grade="9">9 класс</button><input id="search" type="search" aria-label="Найти тему" placeholder="Тема, теорема или пункт…"></div>'
for grade in [7,8,9]:
 for track in ['base','advanced']:
  subset=[u for u in units if u['grade']==grade and u['track']==track]
  if not subset:continue
  body+='<section class="chapter"><h2>'+str(grade)+' класс · '+('Основной маршрут' if track=='base' else 'Углубление')+'</h2><div class="cards">'
  for u in subset:
   body+='<article class="card course-card" data-id="'+u['id']+'"><p class="eyebrow">Пункт '+', '.join(map(str,u['points']))+'</p><h3><a href="atlas/'+u['id']+'.html">'+E(u['title'])+'</a></h3><p>'+E(u['investigation'].split('. ')[0])+'.</p><div class="card-bottom"><span class="status">Можно начать</span><a href="atlas/'+u['id']+'.html">Открыть →</a></div></article>'
  body+='</div></section>'
body+='<section class="panel"><h2>Сохранить свою работу</h2><p>Скачай прогресс в верхнем меню. Для переноса выбери сохранённый файл. Более новые записи этого браузера сохранятся.</p><label>Загрузить файл прогресса<input id="import-progress" type="file" accept=".json,application/json"></label><p id="import-result" role="status"></p><a href="teacher.html">Посмотреть работы группы</a></section>'
(D/'index.html').write_text(shell('Исследуем геометрию',body,data('CATALOG',catalog)+scripts(['store.js','catalog.js'])))
body='<div class="lesson-head"><p class="eyebrow">Для преподавателя</p><h1>Увидеть ход мысли.</h1><p>Загрузите файлы учеников. Данные остаются в этом браузере; это локальный просмотр работ, а не облачный журнал.</p></div><section class="panel"><label>Файлы работ<input id="report-files" type="file" accept=".json,application/json" multiple></label><div class="row"><button id="local-report">Показать работу этого браузера</button><button id="clear-reports">Очистить просмотр</button></div><p id="report-error" role="alert"></p><p>Собранное по карточкам доказательство — работа с опорой. Письменный текст оценивает преподаватель. Самостоятельный числовой ответ не подтверждает освоение всей темы.</p></section><div id="reports"></div>'
(D/'teacher.html').write_text(shell('Работы учеников',body,data('CATALOG',catalog)+scripts(['store.js','teacher.js'])+'<script>document.getElementById("export-progress").hidden=true;</script>'))
(D/'README.md').write_text('# '+c['name']+' 7–9\n\n'+c['edition']+'\n\n'+str(len(units))+' учебных узла и '+str(len(c['sources']))+' пунктов карты. Авторские уроки и задачи, не полный задачник. Письменные доказательства оценивает преподаватель. Прогресс хранится локально, отдельно от других курсов; доступен экспорт и импорт.\n\nСборка: `python tools/'+author+'/build.py`. Для автономного запуска сохраняйте всю папку курса. Исходные учебники в публикацию не входят.\n')
print(author,len(units),'lessons built')
