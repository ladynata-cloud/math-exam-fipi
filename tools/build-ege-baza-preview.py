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
         ('index.html', 'course.css', 'registry.js', 'foundation-reference.js', 'course-state.js', 'app.js')}

# Keep only the course/module pair local; existing site resources remain online.
files['ege-baza/index.html'] = re.sub(r'href="(\.\./[^"]*)"',
    lambda m: m.group(0) if m[1].startswith('../trainers/ege-baza/course/') else
    'href="' + urljoin(NAV, m[1]) + '"', files['ege-baza/index.html'])
files['ege-baza/registry.js'] = files['ege-baza/registry.js'].replace(
    "href:'../trainers/oge-basics/'+path", "href:'https://mathexam.space/trainers/oge-basics/'+path")
source = (ROOT / 'trainers/ege-baza/course/index.html').read_text()
source = re.sub(r'href="(\.[^"\n]*)"', lambda m: m.group(0)
    if m[1].startswith('../../../ege-baza/') else 'href="' + urljoin(MODULE, m[1]) + '"', source)
source = re.sub(r"link:'(\.[^']*)'", lambda m: "link:'" + urljoin(MODULE, m[1]) + "'", source)
skill_links = re.findall(r"link:'([^']+)'", source)
assert len(skill_links) == 6 and all(link.startswith('https://mathexam.space/trainers/') for link in skill_links)
files['trainers/ege-baza/course/index.html'] = source
files['READ-ME.txt'] = '''Базовый ЕГЭ — рабочая версия для просмотра

1. Распакуйте весь архив в одну папку.
2. Откройте ege-baza/index.html в браузере.
3. На карте выберите первый модуль. Из урока можно вернуться по ссылке «Карта курса».

Внутри: навигатор, семь модулей в плане и шесть уроков первого модуля.
Остальные уроки ещё не готовы. Это не публикация готового курса.
Дополнительные тренажёры открываются на mathexam.space и требуют интернета.
Основная страница сайта в этот архив не входит.

При открытии файлов с диска поведение сохранения зависит от браузера.
Результат модуля может не отображаться в навигаторе при ограничении file://.
Для работы с учениками нужна проверенная сборка на одном адресе сайта.
Настоящую синхронизацию между браузерами эта версия не выполняет.
'''
for filename, content in files.items():
    if filename.endswith('.html'):
        for href in re.findall(r'(?:href|src)="([^"]+)"', content):
            if filename == 'trainers/ege-baza/course/index.html' and href == '${s.link}':
                continue  # All six possible values were validated above.
            if href.startswith(('http:', 'https:', '#', 'data:')):
                continue
            target = (ROOT / filename).parent / href.split('#')[0]
            normalized = target.resolve().relative_to(ROOT).as_posix().rstrip('/')
            if normalized not in files:
                normalized += '/index.html'
            assert normalized in files, (filename, href)
assert "href:'https://mathexam.space/trainers/oge-basics/'+path" in files['ege-baza/registry.js']
assert "modulePath='../trainers/ege-baza/course/'" in files['ege-baza/registry.js']
assert 'href="../../../ege-baza/#map"' in source
DEST.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(DEST, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for filename, content in files.items():
        info = zipfile.ZipInfo(filename, date_time=(2026, 10, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(info, content.encode('utf-8'))
with zipfile.ZipFile(DEST) as archive:
    assert archive.testzip() is None
print(f'EGE_BAZA_PREVIEW_OK: {len(files)} files, internal links checked; {DEST.stat().st_size} bytes')
