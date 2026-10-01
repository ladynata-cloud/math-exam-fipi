"""Pack the workshop with the first textbook algebra module; no source PDFs."""
import argparse
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser()
p.add_argument('output', type=Path)
a = p.parse_args()
a.output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(a.output, 'w', ZIP_DEFLATED) as z:
    for f in sorted((root/'school').iterdir()):
        if f.is_file() and f.suffix in {'.html', '.js', '.css'}:
            z.write(f, f.relative_to(root))
    z.write(root/'docs/TEXTBOOK_COURSES.md', 'TEXTBOOK_COURSES.md')
    z.write(root/'docs/reports/TEXTBOOK_ALGEBRA_FIRST_MODULE.md', 'CHECKS.md')
    z.writestr('START_HERE.txt', '''Первый модуль алгебры · MathExam

1. Распакуйте архив целиком.
2. Откройте school/index.html.
3. Слева выберите «По учебнику» → «Макарычев и соавторы · 7 класс».
4. Откройте один из шести уроков. Доступны разбор, тренировка и проверка.

Это шесть новых уроков по ключевым навыкам пунктов 1–6, а не полный учебник.
В архив также входят прежние уроки мастерской — они нужны для возврата к основам.
PDF учебников здесь нет. Интернет для основной работы не нужен.
Прогресс привязан к браузеру и адресу открытия. Для переноса скачайте его
из раздела «Мой прогресс». При запрете локального сохранения доступны
работа во вкладке и экспорт; сообщение объяснит ограничение.

Проверки математики и виртуального DOM пройдены. Визуальная проверка
реальным браузером в текущей среде заблокирована; она не заявляется пройденной.
Публикация на mathexam.space этим архивом не производится.
''')
print(a.output.name, a.output.stat().st_size)
