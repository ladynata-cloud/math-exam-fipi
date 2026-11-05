#!/usr/bin/env python3
"""Build the original, four-variant teacher worksheets and their public catalog.

The source modules contain original exercises; publisher books are never bundled.
Run from any directory. Requires reportlab. Output PDFs have deterministic metadata.
"""
from pathlib import Path
import hashlib
import html
import importlib.util
import json
import re
import zipfile
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'pedagogam/raboty'
BANK = ROOT / 'tools/teacher-banks'
WIDTH, HEIGHT, LEFT, RIGHT = 595.276, 841.89, 43, 552
CONTENT = RIGHT - LEFT
INK, GREEN = colors.HexColor('#20352d'), colors.HexColor('#246246')
FONT = Path('/usr/share/fonts/truetype/dejavu')
pdfmetrics.registerFont(TTFont('TeacherSans', str(FONT / 'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('TeacherBold', str(FONT / 'DejaVuSans-Bold.ttf')))
pdfmetrics.registerFontFamily('TeacherSans', normal='TeacherSans', bold='TeacherBold')
FILES = {'sr': ('samostoyatelnaya.pdf', 'samostoyatelnaya-otvety.pdf'),
         'kr': ('kontrolnaya.pdf', 'kontrolnaya-otvety.pdf')}


def load_packs():
    packs = []
    for path in sorted(BANK.glob('*.py')):
        spec = importlib.util.spec_from_file_location(path.stem, path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        packs.extend(module.build())
    if not packs or len({p['id'] for p in packs}) != len(packs):
        raise ValueError('Empty bank or duplicate identifiers')
    coverage_path = ROOT / 'tools/teacher-textbook-coverage.json'
    if coverage_path.exists():
        coverage = json.loads(coverage_path.read_text())
        by_id = {p['id']: p for p in packs}
        for p in packs:
            numbers = [int(n) for n in re.findall(r'\d+', p['grade'])]
            original = list(range(min(numbers), max(numbers)+1))
            p.setdefault('book_grades', {b: original[:] for b in p['books']})
        aliases = coverage.get('existing_title_aliases', {})
        for book in coverage['books']:
            title = aliases.get(book['title'], book['title'])
            for pid in book['pack_ids']:
                pack = by_id[pid]
                if title not in pack['books']:
                    pack['books'].append(title)
                pack['book_grades'][title] = book['pack_grades'][pid]
                pack['source_refs'].append({
                    'path': 'tools/teacher-textbook-coverage.json',
                    'sections': title + ': ' + pack['title'] + '. Оглавление, страницы PDF ' +
                        ', '.join(map(str, book['checked_pdf_pages'])) + '. ' +
                        book.get('pack_prerequisite_notes', {}).get(pid, '')})
        for override in coverage.get('existing_book_grade_overrides', []):
            for pid, grades in override['pack_grades'].items():
                by_id[pid]['book_grades'][override['book']] = grades
        for pack in packs:
            grades = sorted({g for gs in pack['book_grades'].values() for g in gs})
            # Enumerate the actual grades; never fill gaps such as 8, 10–11.
            runs, start, last = [], grades[0], grades[0]
            for grade in grades[1:]:
                if grade == last + 1:
                    last = grade
                else:
                    runs.append(str(start) if start == last else f'{start}–{last}')
                    start = last = grade
            runs.append(str(start) if start == last else f'{start}–{last}')
            pack['grade'] = ', '.join(runs) + (' класс' if len(grades) == 1 else ' классы')
    return sorted(packs, key=lambda p: (int(re.search(r'\d+', p['grade'])[0]), p['subject'], p['id']))


def para(c, text, y, *, size=12, leading=17, bold=False, width=CONTENT, x=LEFT):
    text = html.escape(str(text)).replace('\n', '<br/>')
    # Plain school notation remains selectable and searchable in the PDF.
    text = re.sub(r'\^([23456789])\b', r'<super>\1</super>', text)
    p = Paragraph(text, ParagraphStyle('p', fontName='TeacherBold' if bold else 'TeacherSans',
                  fontSize=size, leading=leading, textColor=INK))
    _, h = p.wrap(width, HEIGHT)
    if y - h < 46:
        raise ValueError(f'PDF page overflow: {text[:100]}')
    p.drawOn(c, x, y - h)
    return y - h


def footer(c, pack, teacher, page):
    c.setStrokeColor(colors.HexColor('#bec8c1'))
    c.line(LEFT, 39, RIGHT, 39)
    c.setFillColor(INK)
    c.setFont('TeacherSans', 8)
    c.drawString(LEFT, 25, 'MathExam · mathexam.space/pedagogam/raboty/')
    c.drawRightString(RIGHT, 25, f'{pack["id"]} · {"Ответы" if teacher else "Задания"} · {page}')


def heading(c, pack, kind, variant, teacher):
    c.setFillColor(GREEN)
    c.setFont('TeacherBold', 10)
    c.drawString(LEFT, 802, 'MathExam  /  Материалы для преподавателей')
    y = para(c, ('Самостоятельная работа' if kind == 'sr' else 'Контрольная работа')
             + f'. Вариант {variant["name"]}', 779, size=17, leading=23, bold=True)
    y = para(c, pack['title'], y - 10, size=14, leading=20, bold=True)
    y = para(c, f'{pack["grade"]} · {pack["subject"]} · Базовые задания', y - 7, size=10, leading=14)
    if teacher:
        return para(c, 'Ответы, решения и критерии для преподавателя', y - 10, size=11, leading=16, bold=True) - 13
    y = para(c, 'Фамилия, имя _________________________  Дата __________', y - 14, size=11, leading=16)
    minutes = pack[f'{kind}_minutes']
    instruction = f'Ориентир: {minutes} минут. Записывайте решение, а не только ответ. При необходимости продолжите запись в тетради.'
    if pack.get('instruction'):
        instruction += ' ' + pack['instruction']
    y = para(c, instruction, y - 9, size=10, leading=14)
    c.setStrokeColor(GREEN)
    c.line(LEFT, y - 10, RIGHT, y - 10)
    y -= 24
    if pack['id'] in ('geo-prostranstvo-parallelnost','geo-prostranstvo-perpendikulyarnost'):
        # Conventional labels are the same for all variants; the investigated
        # edges rotate in the exercise text. The sketch gives no numerical answer.
        points = {'A':(0,0),'B':(88,0),'C':(121,28),'D':(33,28),
                  'A₁':(0,57),'B₁':(88,57),'C₁':(121,85),'D₁':(33,85)}
        ox,oy=RIGHT-158,y-91
        hidden={frozenset(e) for e in [('A','D'),('D','C'),('D','D₁')]}
        for u,v in [('A','B'),('B','C'),('C','D'),('D','A'),('A₁','B₁'),('B₁','C₁'),('C₁','D₁'),('D₁','A₁'),('A','A₁'),('B','B₁'),('C','C₁'),('D','D₁')]:
            c.setDash(3,3) if frozenset((u,v)) in hidden else c.setDash()
            c.setStrokeColor(INK)
            c.line(ox+points[u][0],oy+points[u][1],ox+points[v][0],oy+points[v][1])
        c.setDash()
        c.setFont('TeacherSans',9)
        for label,(x,z) in points.items():
            c.drawString(ox+x-7,oy+z-13 if label in ('A','B','C','D') else oy+z+5,label)
        para(c,'Схема куба для задач.\nВсе отношения заданы в условиях;\nдлины с рисунка не измеряйте.',y-10,size=9,leading=13,width=CONTENT-183)
        y -= 116
    return y


def make_pdf(pack, kind, teacher=False):
    folder = OUT / pack['id']
    folder.mkdir(parents=True, exist_ok=True)
    dest = folder / FILES[kind][int(teacher)]
    c = canvas.Canvas(str(dest), pagesize=(WIDTH, HEIGHT), invariant=1, pageCompression=1)
    c.setTitle(f'{pack["grade"]}. {pack["title"]}. '
               + ('Самостоятельная' if kind == 'sr' else 'Контрольная')
               + (' - ответы и критерии' if teacher else ' - четыре варианта'))
    c.setAuthor('MathExam')
    for page, variant in enumerate(pack['variants'], 1):
        y = heading(c, pack, kind, variant, teacher)
        tasks = variant[kind]
        if teacher:
            for i, task in enumerate(tasks, 1):
                y = para(c, f'{i}. {task["a"]} ({task["points"]} б.)', y, size=11, leading=15, bold=True)
                y = para(c, task['solution'], y - 4, size=10.5, leading=14) - 11
            total = sum(t['points'] for t in tasks)
            y = para(c, f'Всего: {total} баллов.', y - 1, size=11, leading=16, bold=True)
            y = para(c, 'Задание на 1 балл: 1 за верное выполнение. Задание на 2 балла: '
                     '2 за верное решение; 1 за верный способ с одной вычислительной ошибкой '
                     'или за содержательный незавершённый шаг доказательства; 0 при неверном способе. '
                     'Равноценные верные способы принимаются. Одну ошибку, перенесённую в следующие '
                     'действия, повторно не штрафуют. Баллы не задают обязательную школьную отметку.',
                     y - 6, size=9, leading=12)
        else:
            available = y - 68
            weights = [2.5 if t.get('grid_rows', 0) > 12 else 1 for t in tasks]
            for i, task in enumerate(tasks, 1):
                row = available * weights[i-1] / sum(weights)
                start = y
                y = para(c, f'{i}. {task["q"]}', y, size=12, leading=17)
                if task.get('workspace') == 'grid':
                    rows, cols = task['grid_rows'], task['grid_columns']
                    cell = min(9, (row - (start-y) - 13) / rows)
                    if cell < 5:
                        raise ValueError(f'Grid too small: {pack["id"]} {kind} {i}')
                    top = y - 7
                    c.setStrokeColor(colors.HexColor('#c3cfc7'))
                    c.setLineWidth(.3)
                    for r in range(rows+1):
                        c.line(LEFT, top-r*cell, LEFT+cols*cell, top-r*cell)
                    for col in range(cols+1):
                        c.line(LEFT+col*cell, top, LEFT+col*cell, top-rows*cell)
                    c.setLineWidth(1)
                else:
                    line_y = y - 20
                    while line_y > start - row + 9:
                        c.setStrokeColor(colors.HexColor('#d8ded9'))
                        c.line(LEFT, line_y, RIGHT, line_y)
                        line_y -= 19
                # Preserve enough space for the next task even with longer conditions.
                if y < start - row + 7:
                    raise ValueError(f'Question exceeds allocated row: {pack["id"]} {kind} {i}')
                y = start - row
            c.setFont('TeacherSans', 9)
            c.setFillColor(INK)
            c.drawString(LEFT, 52, f'Максимум: {sum(t["points"] for t in tasks)} баллов. '
                         + 'Баллы по заданиям: ' + ', '.join(str(t['points']) for t in tasks) + '.')
        footer(c, pack, teacher, page)
        c.showPage()
    c.save()
    return dest


def zip_files(dest, paths):
    with zipfile.ZipFile(dest, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for path in sorted(paths):
            info = zipfile.ZipInfo(path.relative_to(OUT).as_posix(), (2026, 11, 5, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, path.read_bytes())


def page_html(packs):
    esc = html.escape
    grades = [f'{n} класс' for n in range(5,12)]
    books = sorted(set(b for p in packs for b in p['books']))
    options = lambda values: ''.join(f'<option value="{esc(v, quote=True)}">{esc(v)}</option>' for v in values)
    cards = []
    for p in packs:
        base = '/pedagogam/raboty/' + p['id'] + '/'
        refs = '; '.join(r['sections'] for r in p['source_refs'])
        search = esc(' '.join([p['title'], p['grade'], p['subject'], *p['books']]), quote=True)
        links = ''.join(f'<div class="work"><h3>{name} · 4 варианта</h3>'
                        f'<a class="button" href="{base}{FILES[kind][0]}" download>Задания PDF</a> '
                        f'<a href="{base}{FILES[kind][1]}" download>Ответы и решения PDF</a></div>'
                        for kind, name in [('sr','Самостоятельная'), ('kr','Контрольная')])
        numbers = [int(n) for n in re.findall(r'\d+', p['grade'])]
        applies = sorted({g for gs in p.get('book_grades', {}).values() for g in gs}) or list(range(min(numbers),max(numbers)+1))
        book_grades = p.get('book_grades', {book: applies for book in p['books']})
        cards.append(f'<article class="pack" data-grade="{esc(p["grade"], quote=True)}" data-grades="{esc(json.dumps(applies), quote=True)}" '
                     f'data-books="{esc(json.dumps(p["books"], ensure_ascii=False), quote=True)}" '
                     f'data-book-grades="{esc(json.dumps(book_grades, ensure_ascii=False), quote=True)}" '
                     f'data-search="{search}" id="{esc(p["id"])}">'
                     f'<p class="kicker">{esc(p["grade"])} · {esc(p["subject"])}</p>'
                     f'<h2>{esc(p["title"])}</h2>'
                     f'<details class="books"><summary>Учебники: {len(p["books"])}</summary><ul>'+''.join(f'<li>{esc(b)}</li>' for b in p['books'])+'</ul></details>'
                     f'{links}<details><summary>Темы учебника и оценивание</summary>'
                     f'<p>{esc(p["scope_note"])}</p><p>{esc(refs)}</p><p>Самостоятельная: 4 задания, 6 баллов, около {p["sr_minutes"]} минут. '
                     f'Контрольная: 5 заданий, 10 баллов, около {p["kr_minutes"]} минут. '
                     'Четыре варианта одинаковы по структуре и баллам. '
                     'Критерии приведены в файлах с ответами; преподаватель может изменить время и шкалу отметок.</p>'
                     f'</details><p><a href="{base}komplekt.zip" download>Скачать комплект ZIP</a></p></article>')
    return f'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Самостоятельные и контрольные работы по математике · 4 варианта · PDF | MathExam</title>
<meta name="description" content="Базовые самостоятельные и контрольные работы по математике 5–11 классов. Четыре варианта, отдельные ответы, решения и критерии. PDF для печати.">
<link rel="canonical" href="https://mathexam.space/pedagogam/raboty/">
<meta property="og:title" content="Самостоятельные и контрольные · 4 варианта · PDF">
<meta property="og:description" content="Математика 5–11 классов: задания для печати и отдельные решения для преподавателя.">
<meta property="og:type" content="website"><meta property="og:url" content="https://mathexam.space/pedagogam/raboty/">
<meta property="og:site_name" content="MathExam"><meta property="og:locale" content="ru_RU">
<link rel="stylesheet" href="/assets/site.css"><style>
body{{background:#f4f7f2;color:#20352d}}main{{max-width:1120px;margin:auto;padding:32px 20px 70px}}
h1{{font-size:clamp(27px,5vw,44px);line-height:1.15}}h2{{font-size:23px;line-height:1.25}}h3{{font-size:16px;margin:0 0 9px}}
.intro{{max-width:790px;font-size:19px;line-height:1.55}}.filters{{display:flex;gap:15px;flex-wrap:wrap;margin:28px 0 16px;padding:18px;background:#e5eee1;border-radius:14px}}
label{{display:flex;flex-direction:column;gap:6px;flex:1 1 210px;min-width:0}}input,select{{font:inherit;padding:12px;border:1px solid #9cac99;border-radius:8px;max-width:100%;background:white}}
button{{font:inherit;padding:12px 16px;border:1px solid #246246;border-radius:8px;color:#246246;background:white;cursor:pointer}}
.grid{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}}.pack{{padding:23px;background:white;border:1px solid #d2ded0;border-radius:15px;min-width:0;overflow-wrap:anywhere}}
.kicker,.books{{font-size:14px;color:#53664f}}.work{{padding:16px 0;border-top:1px solid #dce4d9}}.button{{display:inline-block;background:#246246;color:white;padding:10px 13px;border-radius:8px;text-decoration:none;margin:0 9px 9px 0}}
details{{font-size:14px}}summary{{cursor:pointer;font-weight:bold}}.note{{padding:18px;background:#e9efe5;border-radius:12px;line-height:1.55}}[hidden]{{display:none!important}}
@media(max-width:650px){{.grid{{grid-template-columns:1fr}}main{{padding:22px 14px 50px}}.pack{{padding:18px}}.site-nav{{flex-wrap:wrap}}}}
@media print{{.filters,header,.downloads{{display:none}}.grid{{display:block}}.pack{{break-inside:avoid;margin-bottom:12px}}}}
</style></head><body>
<header class="site-header"><div class="container"><a class="logo" href="/">∑ MathExam</a>
<nav class="site-nav" aria-label="Основные разделы"><a href="/pedagogam/">Педагогам</a><a href="/courses/">Учебные курсы</a><a href="/trainers/">Тренажёры</a></nav></div></header>
<main><p><a href="/pedagogam/">← Все материалы для преподавателей</a></p>
<h1>Самостоятельные и контрольные работы</h1>
<p class="intro">Выберите тему и распечатайте нужный вариант. В каждой работе — четыре равноценных варианта с базовыми заданиями. Ответы, решения и критерии скачиваются отдельно.</p>
<p class="downloads"><a class="button" href="mathexam-raboty-pdf.zip" download>Скачать все PDF</a> <a href="#catalog">Выбрать тему</a></p>
<details class="note"><summary>Что входит в подборку</summary><p>Подборка охватывает указанные темы учебников, а не все упражнения и дополнительные разделы каждого издания. Порядок тем у разных авторов отличается: выбирайте работу после изучения нужного материала. Задания составлены для MathExam; исходные сборники издательств в архив не входят.</p></details>
<form class="filters" role="search" onsubmit="return false"><label>Класс<select id="grade"><option value="">Все классы</option>{options(grades)}</select></label>
<label>Учебник<select id="book"><option value="">Все учебники</option>{options(books)}</select></label>
<label>Тема<input id="search" type="search" placeholder="Например, дроби или Пифагор"></label><button type="reset">Сбросить фильтры</button></form>
<p id="count" role="status" aria-live="polite">Комплектов: {len(packs)}. В каждом — самостоятельная и контрольная.</p>
<div id="catalog" class="grid">{''.join(cards)}</div><p id="empty" hidden>По этому сочетанию ничего не найдено. Измените класс, учебник или тему.</p>
<details class="note" style="margin-top:30px"><summary>Источники и границы подборки</summary><p>Темы сверены с картами и прочитанными оглавлениями конкретных учебников, указанными в каждом комплекте. Открытые методические пособия и издательские фрагменты использованы для сверки школьного формата. Дополнительно предоставленные сборники Ершовой и Голобородько просмотрены по оглавлениям и выборке работ. Полные тексты всех сборников получить не удалось. Углублённые и нестандартные задачи в эту базовую подборку не включены.</p><p>Численные и символьные ответы пересчитаны. Доказательства и объяснения проверены отдельно чтением. Проверка в реальных классах ещё не проводилась.</p><p><a href="istochniki.html">Что удалось найти в открытых источниках</a></p></details>
</main><script>
const cards=[...document.querySelectorAll('.pack')],grade=document.querySelector('#grade'),book=document.querySelector('#book'),search=document.querySelector('#search');
const norm=s=>s.toLocaleLowerCase('ru').replaceAll('ё','е');
function filter(){{const tokens=norm(search.value).split(/\\s+/).filter(Boolean);let n=0;for(const card of cards){{const show=(!grade.value||(book.value?JSON.parse(card.dataset.bookGrades)[book.value]||[]:JSON.parse(card.dataset.grades)).includes(parseInt(grade.value)))&&(!book.value||JSON.parse(card.dataset.books).includes(book.value))&&tokens.every(t=>norm(card.dataset.search).includes(t));card.hidden=!show;if(show)n++;}}document.querySelector('#count').textContent='Комплектов: '+n+'. В каждом — самостоятельная и контрольная.';document.querySelector('#empty').hidden=!!n;}}
for(const el of [grade,book,search])el.addEventListener('input',filter);
document.querySelector('.filters').addEventListener('reset',event=>{{event.preventDefault();grade.value='';book.value='';search.value='';filter();}});
</script><script defer src="/assets/assistant/navigator-data.js?v=20261105-site1"></script><script defer src="/assets/assistant/navigator-widget.js?v=20261105-site1"></script></body></html>'''


def main():
    packs = load_packs()
    OUT.mkdir(parents=True, exist_ok=True)
    paths = []
    manifest = []
    for pack in packs:
        paths_for_pack = []
        assert len(pack['variants']) == 4, pack['id']
        for kind in FILES:
            for teacher in (False, True):
                path = make_pdf(pack, kind, teacher)
                paths.append(path)
                paths_for_pack.append(path)
        zip_files(OUT / pack['id'] / 'komplekt.zip', paths_for_pack)
        manifest.append({'id': pack['id'], 'title': pack['title'], 'grade': pack['grade'],
                         'subject': pack['subject'], 'books': pack['books'],
                         'files': [{'path': str(p.relative_to(OUT)),
                                    'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
                                   for p in paths_for_pack]})
    (OUT / 'bank.json').write_text(json.dumps(packs, ensure_ascii=False, indent=2) + '\n')
    (OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    (OUT / 'index.html').write_text(page_html(packs))
    research = json.loads((ROOT / 'tools/teacher-source-research.json').read_text())
    received = json.loads((ROOT / 'tools/teacher-uploaded-source-review.json').read_text())
    received_rows = ''.join('<tr><td>'+html.escape(r['title'])+' ('+str(r['year'])+')</td><td>'+html.escape('; '.join(r['notes']))+'</td></tr>' for r in received['sources'])
    received_html = '<h2>Дополнительно предоставленные сборники</h2><p>Сверены титулы, оглавления, отдельные ответы и 12 образцов уровня А. Полная постраничная проверка этих книг не проводилась. Для старого издания алгебры 2005 года обнаружен пропуск страниц 54–55; доступно также издание 2013 года.</p><div class="scroll"><table><thead><tr><th>Издание</th><th>Результат осмотра</th></tr></thead><tbody>'+received_rows+'</tbody></table></div><p>Наши базовые контрольные проще образцов сборников. Время на листах — ориентир: преподаватель выбирает его с учетом подготовки класса.</p>'
    rows = ''.join('<tr><td>'+html.escape(r['title'])+'</td><td>'+html.escape(r['read_scope'])+
                   '</td><td>'+html.escape(r['notes'])+'</td><td><a href="'+html.escape(r['url'],quote=True)+
                   '">Официальный источник</a></td></tr>' for r in research)
    (OUT / 'istochniki.html').write_text('''<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Источники подборки работ для преподавателей | MathExam</title>
<meta name="description" content="Официальные методические материалы и издательские фрагменты для сверки тем самостоятельных и контрольных работ MathExam.">
<link rel="canonical" href="https://mathexam.space/pedagogam/raboty/istochniki.html">
<style>body{font:17px/1.55 system-ui,sans-serif;max-width:1100px;margin:auto;padding:25px;color:#20352d}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border:1px solid #c4d0c0;padding:12px;text-align:left;vertical-align:top;overflow-wrap:anywhere}a{color:#246246}.scroll{overflow:auto}</style></head><body>
<p><a href="/pedagogam/raboty/">← Самостоятельные и контрольные работы</a></p><h1>Источники и образцы школьного контроля</h1>
<p>Состояние поиска: 5 ноября 2026 года. Полный открытый текст найден не для каждого пособия. Ниже указано, что удалось прочитать: описание, фрагмент, оглавление или полную книгу. Карточка издательства не считается прочитанным сборником.</p>
<p>Из этих книг не копировались готовые варианты. Они помогают сверять темы, методы и формат; опубликованные задания составлены для MathExam. Четвёртый вариант имеет ту же базовую сложность, что и первые три.</p>
<div class="scroll"><table><thead><tr><th>Пособие</th><th>Что прочитано</th><th>Примечание</th><th>Ссылка</th></tr></thead><tbody>'''+rows+'</tbody></table></div>'+received_html+'<script defer src="/assets/assistant/navigator-data.js?v=20261105-site1"></script><script defer src="/assets/assistant/navigator-widget.js?v=20261105-site1"></script></body></html>')
    zip_files(OUT / 'mathexam-raboty-pdf.zip', paths)
    print(f'Built {len(packs)} topic packs; {len(paths)} PDFs; {len(paths) * 4} PDF pages.')


if __name__ == '__main__':
    main()
