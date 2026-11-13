"""Build a source-specific geometry course from checked-in content and assets."""
from pathlib import Path
import json,html
ROOT=Path(__file__).resolve().parents[2]
author=Path(__file__).parent.name
D=ROOT/('geometry-'+author); A=D/'assets'
c=json.loads((D/'data/course.json').read_text()); P=json.loads((D/'data/proofs.json').read_text()); units=c['units']; E=html.escape
catalog=[{k:u[k] for k in ['id','title','grade','chapter','points','requires']} for u in units]
units_by_id = {u['id']: u for u in units}
COURSE_URL = 'https://mathexam.space/geometry-pogorelov/'
COURSE_TITLE = 'Геометрия 7–9 классов по Погорелову: тренажёры | MathExam'
COURSE_DESCRIPTION = ('Курс геометрии по темам Погорелова для 7–9 классов. Исследуйте чертежи, '
                      'стройте дополнительные линии, разбирайте доказательства и решайте задачи.')
NAVIGATOR = json.loads((ROOT/'assets/assistant/page-rollout.json').read_text(encoding='utf-8'))['snippet']
MIDLINE = 'pogorelov-base-8-58'
LESSON_DESCRIPTIONS = {
    'pogorelov-base-8-50': ('Четырёхугольники в 8 классе по Погорелову. Проведите диагональ и разберите, '
                           'почему сумма углов выпуклого четырёхугольника равна 360°.'),
    'pogorelov-base-8-51': ('Свойства и признаки параллелограмма по Погорелову. '
                           'Исследуйте диагонали на чертеже и найдите сумму их длин.'),
    'pogorelov-base-8-54': ('Прямоугольник в курсе Погорелова. Разберите, почему его диагонали равны, '
                           'и найдите длину отрезка от вершины до точки их пересечения.'),
    'pogorelov-base-8-55': ('Ромб в курсе Погорелова. Разберите, почему диагонали перпендикулярны '
                           'и делят углы пополам, и решите задачу на угол ромба.'),
    'pogorelov-base-8-56': ('Квадрат как прямоугольник и ромб. Разберите свойства его диагоналей '
                           'и найдите периметр по длине стороны в уроке Погорелова.'),
    'pogorelov-base-8-57': ('Теорема Фалеса по Погорелову. Разберите, почему параллельные прямые отсекают '
                           'равные отрезки на втором луче, если они равны на первом.'),
    MIDLINE: ('Постройте среднюю линию треугольника на интерактивном чертеже, разберите доказательство '
              'и найдите её длину. Бесплатный урок по Погорелову для 8 класса.'),
    'pogorelov-base-8-59': ('Средняя линия трапеции по Погорелову. Проведите диагональ, разберите '
                           'доказательство и найдите длину средней линии по двум основаниям.'),
    'pogorelov-base-8-60': ('Пропорциональные отрезки по Погорелову. Найдите недостающую длину на втором луче, '
                           'используя отношение отрезков, отсечённых параллельными прямыми.'),
    'pogorelov-base-8-61': ('Замечательные точки треугольника по Погорелову. Постройте медиану и разберите, '
                           'как точка пересечения медиан делит её в отношении 2:1 от вершины.'),
}
MIDLINE_BACKLINKS = {
    'pogorelov-base-8-51': 'Применить свойства параллелограмма к средней линии треугольника',
    'pogorelov-base-8-57': 'Следующий урок о средней линии треугольника',
    'pogorelov-base-8-59': 'Повторить теорему о средней линии треугольника',
    'pogorelov-base-8-61': 'Повторить теорему о средней линии треугольника',
}

def data(name,obj):return '<script>window.'+name+'='+json.dumps(obj,ensure_ascii=False).replace('<','\\u003c')+';</script>'
def scripts(names,up=''):return ''.join('<script src="'+up+'assets/'+n+'"></script>' for n in names)

def course_metadata():
    title, description = E(COURSE_TITLE), E(COURSE_DESCRIPTION)
    return (f'\n<meta name="description" content="{description}">\n'
            f'<link rel="canonical" href="{COURSE_URL}">\n'
            '<meta property="og:type" content="website">\n'
            f'<meta property="og:title" content="{title}">\n'
            f'<meta property="og:description" content="{description}">\n'
            f'<meta property="og:url" content="{COURSE_URL}">\n'
            '<meta property="og:site_name" content="MathExam">\n'
            '<meta property="og:locale" content="ru_RU">\n'
            '<meta name="twitter:card" content="summary">\n'
            f'<meta name="twitter:title" content="{title}">\n'
            f'<meta name="twitter:description" content="{description}">')


def lesson_metadata(lesson_id):
    canonical = f'<link rel="canonical" href="{COURSE_URL}atlas/{lesson_id}.html">'
    description = LESSON_DESCRIPTIONS.get(lesson_id)
    if description:
        return f'<meta name="description" content="{E(description)}">{canonical}'
    return canonical


def lesson_link(lesson_id, label=None):
    return f'<a href="{lesson_id}.html">{E(label or units_by_id[lesson_id]["title"])}</a>'


def shell(title, body, code, *, up='', metadata='', head_scripts=NAVIGATOR, course_fragment=''):
    return (
        '<!doctype html><html lang="ru"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        f'<title>{E(title)}</title>{metadata}<link rel="stylesheet" href="{up}assets/course.css">'
        f'<link rel="stylesheet" href="{up}assets/space.css">{head_scripts}</head><body>'
        f'<header class="topbar"><a class="brand" href="{up}index.html">Геометрия · {E(c["name"])}</a>'
        '<nav class="toplinks"><a href="/">Главная</a><a href="/ege-baza/">ЕГЭ база</a>'
        f'<a href="{up}index.html{course_fragment}">Карта курса</a><a href="{up}teacher.html">Учителю</a>'
        '<button id="export-progress">Скачать прогресс</button></nav></header><main class="container">'
        f'<p id="storage-notice" class="warning" hidden role="alert"></p>{body}'
        f'<footer>Авторские объяснения и задачи. {E(c["edition"])} '
        'Полная карта пунктов не означает разбор всех упражнений. '
        'Измерение помогает исследовать, а доказательство объясняет общий случай. '
        f'Результаты хранятся только в этом браузере.</footer></main>{code}</body></html>'
    )


(D/'atlas').mkdir(exist_ok=True)
for u in units:
    lesson_id = u['id']
    source = '; '.join(
        f'{s["grade"]} класс, {s["track"]}, п. {s["point"]} «{s["title"]}»'
        + (f', с. {s["page"]}' if s.get('page') else '')
        for s in u['source']
    )
    prereq = ''.join(lesson_link(need) for need in u['requires'])
    sidebar_heading = 'Если есть пробел'
    related = '<a href="/trainers/oge-basics/">Повторить арифметику</a>'
    introduction = ''
    course_fragment = ''
    if lesson_id == MIDLINE:
        sidebar_heading = 'Повторить для доказательства'
        prereq += lesson_link('pogorelov-base-7-20', 'Первый признак равенства треугольников')
        prereq += lesson_link('pogorelov-base-7-11')
        trapezoid = lesson_link('pogorelov-base-8-59', 'Средняя линия трапеции')
        centroid = lesson_link('pogorelov-base-8-61', 'Точка пересечения медиан')
        related = (
            f'<h3>Применить теорему</h3>{trapezoid}{centroid}'
            '<h3>Потренироваться</h3>'
            '<a href="/geometry-course/atlas/midline.html">Атанасян · Построение средней линии</a>'
            '<a href="/trainers/task19-trainer.html?card=prev-042">ОГЭ №19 · Свойство средней линии</a>'
        )
        introduction = f'<p class="law">{E(u["idea"])}</p>'
        course_fragment = '#course'
    elif lesson_id in MIDLINE_BACKLINKS:
        backlink = lesson_link(MIDLINE, MIDLINE_BACKLINKS[lesson_id])
        if prereq:
            related = backlink + related
        else:
            prereq = backlink
    prereq = prereq or '<p>Начни с объяснения и исследуй предложенную модель.</p>'
    sidebar = (
        f'<aside class="panel sidebar"><h3>{sidebar_heading}</h3>{prereq}'
        '<p>После повторения вернись кнопкой браузера: шаг урока сохраняется.</p>'
        f'<details><summary>Связь с учебником</summary><p>{E(source)}</p>'
        '<p>Числовые упражнения авторские. Это не ответы ко всем номерам учебника.</p></details>'
        f'{related}</aside>'
    )
    track = 'Основной маршрут' if u['track'] == 'base' else 'Углубление'
    body = (
        f'<div class="lesson-head"><p class="eyebrow">{u["grade"]} класс · {track}</p>'
        f'<h1>{E(u["title"])}</h1><span class="pill">Исследуй → построй → объясни → реши</span></div>'
        '<nav class="stage-nav" aria-label="Этапы урока"></nav>'
        f'<div class="layout"><section class="panel" id="lesson">{introduction}</section>{sidebar}</div>'
    )
    cfg = dict(unit=u, proof=P[u['proof']], catalog=catalog, investigation=u['investigation'], experiment=u.get('experiment'))
    code = data('COURSE_CONFIG', cfg) + scripts([
        'geometry.js', 'lab.js', 'experiments.js', 'extra-models.js', 'tasks.js',
        'extra-tasks.js', 'space.js', 'viewer.js', 'store.js', 'lesson.js',
    ], '../')
    title = f'{u["title"]} · {c["name"]} · MathExam'
    page = shell(title, body, code, up='../', metadata=lesson_metadata(lesson_id), course_fragment=course_fragment)
    (D/'atlas'/(lesson_id+'.html')).write_text(page, encoding='utf-8')
body='<section class="hero"><div><p class="eyebrow">'+E(c['name'])+' · 7–9 классы</p><h1>Геометрию можно<br>построить самому.</h1><p class="lead">Двигай точки, выбирай дополнительные линии, собирай доказательство и проверяй новый вариант без подсказки.</p><div class="row"><a class="button primary" href="atlas/'+units[0]['id']+'.html">Начать с основ →</a><a class="button" href="#course">Найти тему</a><a class="button" href="textbook/">К задачам учебника 2022 →</a></div></div><div class="panel"><h2>'+str(len(units))+' учебных узла</h2><p>'+str(len(c['sources']))+' пунктов в карте источников. Объяснение, построение, рассуждение и числовая практика в каждом узле.</p><p><strong id="independent-count">0</strong> тем с самостоятельным решением в этом браузере.</p><p>Начальная версия курса: отдельные типы задач, а не весь задачник. Углублённые темы явно выделены.</p></div></section><div class="filters" id="course"><button class="on" data-grade="all">Все классы</button><button data-grade="7">7 класс</button><button data-grade="8">8 класс</button><button data-grade="9">9 класс</button><input id="search" type="search" aria-label="Найти тему" placeholder="Тема, теорема или пункт…"></div>'
for grade in [7,8,9]:
 for track in ['base','advanced']:
  subset=[u for u in units if u['grade']==grade and u['track']==track]
  if not subset:continue
  body+='<section class="chapter"><h2>'+str(grade)+' класс · '+('Основной маршрут' if track=='base' else 'Углубление')+'</h2><div class="cards">'
  for u in subset:
   body+='<article class="card course-card" data-id="'+u['id']+'"><p class="eyebrow">Пункт '+', '.join(map(str,u['points']))+'</p><h3><a href="atlas/'+u['id']+'.html">'+E(u['title'])+'</a></h3><p>'+E(u['investigation'].split('. ')[0])+'.</p><div class="card-bottom"><span class="status">Можно начать</span><a href="atlas/'+u['id']+'.html">Открыть →</a></div></article>'
  body+='</div></section>'
body+='<section class="panel"><h2>Сохранить свою работу</h2><p>Скачай прогресс в верхнем меню. Для переноса выбери сохранённый файл. Более новые записи этого браузера сохранятся.</p><label>Загрузить файл прогресса<input id="import-progress" type="file" accept=".json,application/json"></label><p id="import-result" role="status"></p><a href="teacher.html">Посмотреть работы группы</a></section>'
(D/'index.html').write_text(shell(COURSE_TITLE, body, data('CATALOG',catalog)+scripts(['store.js','catalog.js']),
                                 metadata=course_metadata()))
body='<div class="lesson-head"><p class="eyebrow">Для преподавателя</p><h1>Увидеть ход мысли.</h1><p>Загрузите файлы учеников. Данные остаются в этом браузере; это локальный просмотр работ, а не облачный журнал.</p></div><section class="panel"><label>Файлы работ<input id="report-files" type="file" accept=".json,application/json" multiple></label><div class="row"><button id="local-report">Показать работу этого браузера</button><button id="clear-reports">Очистить просмотр</button></div><p id="report-error" role="alert"></p><p>Собранное по карточкам доказательство — работа с опорой. Письменный текст оценивает преподаватель. Самостоятельный числовой ответ не подтверждает освоение всей темы.</p></section><div id="reports"></div>'
(D/'teacher.html').write_text(shell(f'Работы учеников · {c["name"]} · MathExam', body,
                                   data('CATALOG',catalog)+scripts(['store.js','teacher.js'])+'<script>document.getElementById("export-progress").hidden=true;</script>',
                                   head_scripts='<script defer src="/assets/assistant/home-link.js"></script>\n'))
(D/'README.md').write_text('# '+c['name']+' 7–9\n\n'+c['edition']+'\n\n'+str(len(units))+' учебных узла и '+str(len(c['sources']))+' пунктов карты. Авторские уроки и задачи, не полный задачник. Письменные доказательства оценивает преподаватель. Прогресс хранится локально, отдельно от других курсов; доступен экспорт и импорт.\n\nСборка: `python tools/'+author+'/build.py`. Для автономного запуска сохраняйте всю папку курса. Исходные учебники в публикацию не входят.\n')
print(author,len(units),'lessons built')
