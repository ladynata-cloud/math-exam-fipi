"""Build a dependency-free inspection archive; never include source textbooks."""
import argparse
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('output', type=Path)
args = parser.parse_args()
args.output.parent.mkdir(parents=True, exist_ok=True)
intro = '''MathExam · Математическая мастерская · 5–6 классы

1. Полностью распакуйте архив.
2. Откройте school/index.html в современном браузере.
3. Начните с «Сегодня» или «Карта тем». Кабинет группы — «Преподавателю».
4. Перед переносом на другое устройство скачайте резервную копию прогресса.

Это версия для просмотра: 74 вводных блока, маршруты 5 и 6 классов,
пошаговые разборы, интерактивные модели, задания группе и отчёты через файлы.
Не требуется установка. Основная работа доступна без интернета.
Внешние ссылки на сайт и источники требуют сети.

Это не два полных годовых курса. Полные учебники в архив не включены.
Карта соответствий и ограничения описаны в MATH_WORKSHOP_5_6.md.
На основном сайте ничего не публикуется при открытии этого архива.
'''
with ZipFile(args.output, 'w', ZIP_DEFLATED) as z:
    for p in sorted((root/'school').iterdir()):
        if p.is_file() and p.suffix in {'.html','.js','.css'}:
            z.write(p, p.relative_to(root).as_posix())
    for name in ['MATH_WORKSHOP_5_6.md','MATH_WORKSHOP_COVERAGE.csv']:
        z.write(root/'docs'/name, name)
    z.writestr('START_HERE.txt', intro)
print(f'{args.output.name}: {args.output.stat().st_size} bytes')
