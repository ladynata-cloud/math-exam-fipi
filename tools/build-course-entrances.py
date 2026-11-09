#!/usr/bin/env python3
"""Generate public topic entrances and the shared authored example catalogue.
Does not generate native app code or modify persisted learner data.
"""
from pathlib import Path
from html import escape as e
import json,re,subprocess,argparse
ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'content/course-entrances/topics.json').read_text())
COURSES={
 'peterson6':dict(path='/school/peterson6/',title='Петерсон, 6 класс: дроби, движение и проценты',label='Петерсон · 6 класс',desc='Первая часть: 14 тем от логики до сложного процентного роста. Пошаговые задания, модели и самостоятельные примеры. Материалы идут по темам Дорофеева и Петерсон, часть 1 (2019); курс не заявляет охват всех трёх частей.'),
 'makarychev8':dict(path='/school/makarychev8/',title='Алгебра 8 класса: курс по темам Макарычева',label='Макарычев · 8 класс',desc='Все 51 тема: рациональные дроби, квадратные корни, уравнения, неравенства и степени. Теория, выбранные задачи, модели и тренировка вычислений по темам учебника 2024 года. Охват тем не означает наличие решения каждого номера.'),
 'ege-baza':dict(path='/ege-baza/',title='ЕГЭ база: курс математики с задачами и подсказками',label='ЕГЭ · Базовый уровень',desc='Подготовка по заданиям 1–21: вычисления, текстовые задачи, вероятность, графики и геометрия. Авторские условия, разбор трудного шага и новые варианты. Начните с темы, в которой нужна помощь, или пройдите диагностику.')}
def math(s):
 return re.sub(r'(?<![\w/])(\([^()]+\)|\d+)/(\([^()]+\)|\d+)(?![\w/])',lambda m:'<span class="ce-fraction" role="math" aria-label="'+m[1]+' разделить на '+m[2]+'"><span>'+m[1]+'</span><span>'+m[2]+'</span></span>',e(s))
def url(t):return COURSES[t['course']]['path']+'topics/'+t['slug']+'/'
def lesson(t):
 c=COURSES[t['course']];return c['path']+('#lesson/'+t['lesson'] if t['course']!='ege-baza' else 'path/index.html#lesson='+t['lesson'])
def example(t):
 return f'''<div class="ce-example" data-course-example="{t['id']}"><figure><img src="/assets/course-examples/{t['id']}-0.png" width="720" height="420" loading="lazy" alt="{e(t['steps'][0],quote=True)}"><figcaption data-ce-caption>Шаг 1 из 5. {math(t['steps'][0])}</figcaption></figure><div class="ce-controls" hidden><button type="button" data-ce-action="play" aria-pressed="false">▶ Смотреть GIF</button><button type="button" data-ce-action="prev" aria-label="Предыдущий кадр" disabled>←</button><button type="button" data-ce-action="next" aria-label="Следующий кадр">→</button><span data-ce-counter>Кадр 1 / 5</span></div><ol class="ce-steps">{''.join('<li>'+math(s)+'</li>' for s in t['steps'])}</ol></div>'''
def quiz(t,fresh=False):
 kind='fresh' if fresh else 'first'; label=t['fresh'] if fresh else t['question']
 return f'''<form class="ce-try" data-ce-quiz="{kind}" data-ce-topic="{t['id']}"><label for="{t['id']}-{kind}">{math(label)}</label><p id="{t['id']}-{kind}-format" class="ce-note">{e('Введи число или дробь — ответ на новый вопрос.' if fresh else t['unit'])}</p><input id="{t['id']}-{kind}" type="text" inputmode="text" autocomplete="off" maxlength="40" aria-describedby="{t['id']}-{kind}-format"><button type="submit" hidden>Проверить ответ</button><p class="ce-result" role="status" aria-live="polite"></p></form>'''
def cards(ts):return '<ul class="ce-links">'+''.join(f'<li><a href="{url(t)}">{e(t["short"])}</a></li>' for t in ts)+'</ul>'
outputs={}
for t in DATA:
 c=COURSES[t['course']];siblings=[s for s in DATA if s['course']==t['course'] and s!=t]
 t['url']=url(t);t['lessonUrl']=lesson(t)
 body=f'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#17694e">
<title>{e(t['title'])} | MathExam</title><meta name="description" content="{e(t['intro'],quote=True)}"><link rel="canonical" href="https://mathexam.space{url(t)}">
<meta property="og:type" content="website"><meta property="og:title" content="{e(t['title'],quote=True)}"><meta property="og:description" content="{e(t['intro'],quote=True)}"><meta property="og:url" content="https://mathexam.space{url(t)}"><meta property="og:image" content="https://mathexam.space/assets/course-examples/{t['id']}-0.png">
<link rel="stylesheet" href="/assets/course-examples.css?v=20261110"><script defer src="/assets/course-examples-data.js?v=20261110"></script><script defer src="/assets/course-examples.js?v=20261110"></script>
</head><body style="margin:0;background:#f3f8f5"><div class="ce-shell"><header><nav class="ce-nav" aria-label="Навигация"><a href="/">MathExam · Главная</a><span aria-hidden="true">/</span><a href="{c['path']}">{e(c['label'])}</a></nav></header>
<main><p class="ce-note">Попробовать → понять → проверить на новом примере</p><h1>{e(t['short'])}</h1><p class="ce-lead">{e(t['intro'].split('. ')[0]+'.')}</p><a class="ce-button" href="{lesson(t)}">Сразу к задачам курса →</a>
<section class="ce-card"><h2>Сначала попробуй самостоятельно</h2>{quiz(t)}<details class="ce-help"><summary>Нужна небольшая подсказка</summary><p>{math(t['hint'])}</p></details><details class="ce-help" data-ce-explanation><summary>Посмотреть наглядный разбор</summary>{example(t)}<p class="ce-note">Это разобранный пример. После него реши новое условие ниже.</p></details><noscript><p>Объяснение и ответы доступны без JavaScript. Для проверки введённого ответа и управления GIF включите JavaScript.</p></noscript></section>
<section class="ce-card"><h2>Теперь другой пример</h2>{quiz(t,True)}<details class="ce-help" data-ce-fresh-solution><summary>Сверить ответ и объяснение</summary><p>{math(t['freshWhy'])}</p></details><p class="ce-note">Эта короткая проверка не меняет результаты курса. Если пользовались разбором, закрепите способ на новом условии в тренажёре.</p><a class="ce-button" href="{lesson(t)}">Продолжить тренировку →</a></section>
<section class="ce-card"><h2>Что дальше</h2><p>В занятии сначала введи свой ответ. Если трудно, открой помощь к текущему шагу: записи сохранятся. После разбора выбери новое условие; курс различает самостоятельные решения и работу с помощью.</p>{cards(siblings)}<a href="{c['path']}">Все темы курса →</a></section></main>
<footer class="ce-note"><p>MathExam · Авторский наглядный разбор. <a href="/">О проекте</a> · <a href="/courses/">Другие курсы</a></p></footer></div></body></html>'''
 outputs[url(t).strip('/')+'/index.html']=body.replace('</head>', json.loads((ROOT/'assets/assistant/page-rollout.json').read_text())['snippet']+'</head>')+'\n'
outputs['assets/course-examples-data.js']='/* Authored source: content/course-entrances/topics.json. Generated. */\nwindow.MathExamCourseExampleData = '+json.dumps(DATA,ensure_ascii=False,separators=(',',':'))+';\n'
# Read native catalogues rather than maintain a second topic registry.
node="global.window=global;require('./school/peterson6/data.js');require('./school/makarychev8/data.js');global.PathData=require('./ege-baza/path/data.js');require('./ege-baza/path/practice.js');require('./ege-baza/path/equation-practice.js');console.log(JSON.stringify({peterson6:PetersonCourse.lessons.map(l=>({id:l.id,title:l.title})),makarychev8:MakarychevCourse.lessons.map(l=>({id:l.id,title:l.title})), 'ege-baza':PathData.meta.filter(l=>l.pos&&!l.grade7&&!l.pre7).map(l=>({id:l.id,title:l.title,pos:l.pos}))}));"
catalogues=json.loads(subprocess.check_output(['node','-e',node],cwd=ROOT,text=True))
for key,c in COURSES.items():
 path=c['path'].strip('/')+'/index.html';s=(ROOT/path).read_text();topics=[t for t in DATA if t['course']==key]
 links=''.join('<li><a href="'+lesson(dict(course=key,lesson=l['id']))+'">'+e(l['title'])+'</a></li>' for l in catalogues[key])
 catalog=f'''<section class="ce-catalog"><h1>{e(c['title'])}</h1><p class="ce-lead">{e(c['desc'])}</p><h2>Начать с наглядного примера</h2>{cards(topics)}<h2>Все темы курса</h2><ul class="ce-links">{links}</ul><p>Попробуй решить задачу сам, затем при необходимости открой подсказку. После разбора переходи к новому условию. Курс сохраняет работу в этом браузере и отдельно показывает самостоятельные ответы и решения с помощью.</p><noscript><p>Краткие разборы доступны по ссылкам выше. Для интерактивных заданий и сохранения результатов включите JavaScript.</p></noscript></section>'''
 id='content' if key=='ege-baza' else 'main'
 s=re.sub(r'(<main\b[^>]*\bid="'+id+r'"[^>]*>).*?(</main>)',lambda m:m[1]+catalog+m[2],s,flags=re.S)
 s=re.sub(r'<title>.*?</title>',f'<title>{e(c["title"])} | MathExam</title>',s,flags=re.S)
 if key=='ege-baza':s=re.sub(r'\s*<meta name="robots" content="noindex,nofollow">','',s)
 if 'rel="canonical"' not in s:s=s.replace('</title>','</title>\n<link rel="canonical" href="https://mathexam.space'+c['path']+'">',1)
 if 'course-examples.css' not in s:
  includes='<link rel="stylesheet" href="/assets/course-examples.css?v=20261110">\n<script defer src="/assets/course-examples-data.js?v=20261110"></script>\n<script defer src="/assets/course-examples.js?v=20261110"></script>\n'
  s=s.replace('<script',includes+'<script',1)
 footer='<nav class="ce-guide-footer" aria-label="Наглядные разборы"><a href="/">Главная MathExam</a>'+''.join(f'<a href="{url(t)}">{e(t["short"])}</a>' for t in topics)+'</nav>'
 s=re.sub(r'<nav class="ce-guide-footer".*?</nav>\n?','',s,flags=re.S);s=s.replace('</body>',footer+'\n</body>')
 if key=='peterson6':s=s.replace('src="/assets/course-examples','src="../../assets/course-examples').replace('href="/assets/course-examples','href="../../assets/course-examples')
 outputs[path]=s
args=argparse.ArgumentParser();args.add_argument('--check',action='store_true');check=args.parse_args().check
changed=[]
for name,content in outputs.items():
 p=ROOT/name
 if not p.exists() or p.read_text()!=content:
  changed.append(name)
  if not check:p.parent.mkdir(parents=True,exist_ok=True);p.write_text(content)
if check and changed:raise SystemExit('Stale generated content: '+', '.join(changed))
print('Checked' if check else 'Generated',len(outputs),'course/entrance files')
