"""Build a self-contained review ZIP; no site publication or state migration."""
from pathlib import Path
import sys, zipfile, re
ROOT = Path(__file__).resolve().parents[1]
DEST = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('MathExam_Labs.zip')
files = {p.name: p.read_bytes() for p in (ROOT / 'ege-baza/labs').iterdir() if p.is_file()}
files['three.min.js'] = (ROOT / 'ege-profil/trainers/stereo/js/three.min.js').read_bytes()
html = files['index.html'].decode().replace('../../ege-profil/trainers/stereo/js/three.min.js', 'three.min.js').replace('href="../index.html"', 'href="https://mathexam.space/"').replace('К курсу</a>', 'На сайт</a>')
html = html.replace('../algebra/index.html', 'https://mathexam.space/ege-baza/algebra/').replace('../percent/index.html', 'https://mathexam.space/ege-baza/percent/')
files['index.html'] = html.encode()
files['READ-ME.txt'] = ('MathExam — четыре интерактивные лаборатории\n\nРаспакуйте архив целиком. Откройте index.html.\nИнтернет для моделей не нужен. Для объёмной графики нужен WebGL.\nЭто черновик: результаты временные, отчёт можно скачать.\nОбщий прогресс курса и опубликованный сайт не меняются.\n\nСтереометрия: вращение, погружение детали, сечение конуса.\nПланиметрия: выбирайте инструмент и точки сами.\nТригонометрия: круг, обороты, радианы и координаты.\nЗадание 18: постройте решение на оси и проверьте границы.\n').encode()
for ref in re.findall(r'(?:src|href)="([^"]+)"', html):
    if not ref.startswith(('https:', '#')):
        assert ref in files, ref
DEST.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(DEST, 'w', zipfile.ZIP_DEFLATED) as z:
    for name, content in sorted(files.items()):
        z.writestr(name, content)
with zipfile.ZipFile(DEST) as z:
    assert z.testzip() is None
print(f'LABS_PREVIEW_OK: {len(files)} files, {DEST.stat().st_size} bytes; {DEST}')
