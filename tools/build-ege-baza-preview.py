"""Build a review ZIP, without publishing or changing course sources.

Usage: python tools/build-ege-baza-preview.py /absolute/output/ege-baza-preview.zip
Extract ZIP; open ege-baza/index.html. Existing auxiliary resources open online.
"""
from pathlib import Path
import re
import sys
import zipfile
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[1]
DEST = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / 'ege-baza-preview.zip'
NAV = 'https://mathexam.space/ege-baza/'
MODULE = 'https://mathexam.space/trainers/ege-baza/course/'
files = {f'ege-baza/{name}': (ROOT / 'ege-baza' / name).read_text() for name in
         ('index.html', 'course.css', 'registry.js', 'foundation-reference.js', 'data-reference.js', 'course-definitions.js', 'course-state.js', 'backup.js', 'backup-ui.js', 'app.js')}

# Bundle isolated labs and their exact existing renderer with the course.
for section in ('algebra', 'percent', 'labs', 'reasoning'):
    for source in (ROOT / 'ege-baza' / section).glob('*'):
        if source.is_file():
            files[source.relative_to(ROOT).as_posix()] = source.read_text()
renderer = 'ege-profil/trainers/stereo/js/three.min.js'
files[renderer] = (ROOT / renderer).read_text()

# Keep implemented course modules local; existing site resources remain online.
files['ege-baza/index.html'] = re.sub(r'href="(\.\./[^"]*)"',
    lambda m: m.group(0) if m[1].startswith('../trainers/ege-baza/course/') else
    'href="' + urljoin(NAV, m[1]) + '"', files['ege-baza/index.html'])
files['ege-baza/registry.js'] = files['ege-baza/registry.js'].replace(
    "href:'../trainers/oge-basics/'+path", "href:'https://mathexam.space/trainers/oge-basics/'+path")
for folder, expected_links in [('course', 6), ('data-course', 4)]:
    prefix = f'trainers/ege-baza/{folder}/'
    online = 'https://mathexam.space/' + prefix
    source = (ROOT / prefix / 'index.html').read_text()
    source = re.sub(r'href="(\.[^"\n]*)"', lambda m: m.group(0)
        if m[1].startswith('../../../ege-baza/') else 'href="' + urljoin(online, m[1]) + '"', source)
    content = source if folder == 'course' else (ROOT / prefix / 'content.js').read_text()
    content = re.sub(r"link:'(\.[^']*)'", lambda m: "link:'" + urljoin(online, m[1]) + "'", content)
    skill_links = re.findall(r"link:'([^']+)'", content)
    assert len(skill_links) == expected_links and all(link.startswith('https://mathexam.space/trainers/') for link in skill_links)
    files[prefix + 'index.html'] = content if folder == 'course' else source
    if folder == 'data-course':
        files[prefix + 'content.js'] = content
        files[prefix + 'visuals.js'] = (ROOT / prefix / 'visuals.js').read_text()
files['READ-ME.txt'] = '''Базовый ЕГЭ — рабочая версия для просмотра

1. Распакуйте весь архив в одну папку.
2. Откройте ege-baza/index.html в браузере.
3. На карте выберите первый или второй модуль. Из урока можно вернуться по ссылке «Карта курса».

Внутри: навигатор, семь модулей в плане, десять уроков и 100 задач двух первых модулей.
Дополнительно: алгебра, основа 1–6 классов, проценты и пропорции, четыре лаборатории.
Они доступны через боковое меню. Результаты новых разделов временные, отчёт скачивается отдельно.
Для каждого готового модуля — практика, отдельные проверки и резервная копия.
Остальные уроки ещё не готовы. Это не публикация готового курса.
Дополнительные тренажёры открываются на mathexam.space и требуют интернета.
Основная страница сайта в этот архив не входит.

При открытии файлов с диска поведение сохранения зависит от браузера.
Результат модуля может не отображаться в навигаторе при ограничении file://.
Для работы с учениками нужна проверенная сборка на одном адресе сайта.
Настоящую синхронизацию между браузерами эта версия не выполняет.
'''
# file:// does not resolve directory URLs to index.html. Rewrite bundled links.
for filename in list(files):
    files[filename] = files[filename].replace('../trainers/ege-baza/course/', '../trainers/ege-baza/course/index.html').replace('../trainers/ege-baza/data-course/', '../trainers/ege-baza/data-course/index.html').replace('../../../ege-baza/#', '../../../ege-baza/index.html#')
files['REVIEW-RU.txt'] = (ROOT / 'docs/EGE_BAZA_REVIEW_RU.txt').read_text()
for filename, content in files.items():
    if filename.endswith('.html'):
        for href in re.findall(r'(?:href|src)="([^"]+)"', content):
            if filename in ('trainers/ege-baza/course/index.html', 'trainers/ege-baza/data-course/index.html') and href == '${s.link}':
                continue  # All possible skill links were validated above.
            if href.startswith(('http:', 'https:', '#', 'data:')):
                continue
            target = (ROOT / filename).parent / href.split('#')[0]
            normalized = target.resolve().relative_to(ROOT).as_posix().rstrip('/')
            if normalized not in files:
                normalized += '/index.html'
            assert normalized in files, (filename, href)
assert "href:'https://mathexam.space/trainers/oge-basics/'+path" in files['ege-baza/registry.js']
assert "modulePath='../trainers/ege-baza/course/index.html'" in files['ege-baza/registry.js']
assert 'href="../../../ege-baza/index.html#map"' in files['trainers/ege-baza/course/index.html']
assert 'href="../../../ege-baza/index.html#module?module=m02"' in files['trainers/ege-baza/data-course/index.html']
DEST.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(DEST, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for filename, content in files.items():
        info = zipfile.ZipInfo(filename, date_time=(2026, 10, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(info, content.encode('utf-8'))
with zipfile.ZipFile(DEST) as archive:
    assert archive.testzip() is None
print(f'EGE_BAZA_PREVIEW_OK: {len(files)} files, internal links checked; {DEST.stat().st_size} bytes')
