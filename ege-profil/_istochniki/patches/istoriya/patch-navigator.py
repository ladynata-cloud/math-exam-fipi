# -*- coding: utf-8 -*-
"""
Две правки навигатора перед выкладкой.

1. Мини-курс «Параметры с нуля» (trainers/parameters-18/) восстановлен, но
   из навигатора на него не ведёт ни одной ссылки — добавляем вторую pill
   в строку маршрута линии 18.

2. trainers/rationalization.html утрачен: его тела нет ни в файлах проекта,
   ни в переписке. Сейчас навигатор ссылается на него дважды, и обе ссылки
   дают 404. Пока файл не найдётся, обе ссылки ведут в курс неравенств —
   там метод рационализации разобран отдельным модулем (m8/«Модуль 9»).
   ОТКАТ: вернуть строки RAT_*_NEW на RAT_*_OLD и положить файл на место.
"""
import io
import os

# Путь сборочной машины архива убран 24.09.2026 (машинных путей в репозитории
# не держим). Скрипт уже применён и лежит для истории, см. README.md рядом.
# Корень дерева курса задаётся только явно — переменной COURSE_ROOT.
ROOT = os.environ.get("COURSE_ROOT", "")
if not ROOT:
    raise SystemExit("история: скрипт уже применён 22.09.2026; корень курса — только через COURSE_ROOT")
PATH = os.path.join(ROOT, "index.html")

# --- 1. мини-курс параметров в маршрут линии 18 ---
P18_OLD = ('<div class="line-links"><a class="pill" target="_blank" rel="noopener" '
           'href="trainers/parameters-t18.html">Параметр на графике</a>'
           '<a class="ghostlink" target="_blank" rel="noopener" '
           'href="exam/variant.html?m=18">вариант</a></div>')
P18_NEW = ('<div class="line-links"><a class="pill" target="_blank" rel="noopener" '
           'href="trainers/parameters-t18.html">Параметр на графике</a>'
           '<a class="pill" target="_blank" rel="noopener" '
           'href="trainers/parameters-18/index.html">Мини-курс: параметры с нуля</a>'
           '<a class="ghostlink" target="_blank" rel="noopener" '
           'href="exam/variant.html?m=18">вариант</a></div>')

# --- 2. рационализация: снять две битые ссылки ---
RAT_CARD_OLD = ('<p class="open"><a class="btn" target="_blank" rel="noopener" '
                'href="trainers/rationalization.html">Открыть</a></p>')
RAT_CARD_NEW = ('<p class="open"><a class="btn" target="_blank" rel="noopener" '
                'href="trainers/inequalities.html">Открыть</a></p>')
RAT_META_OLD = '<p class="meta">продвинутый приём · интерактивные графики</p>'
RAT_META_NEW = '<p class="meta">продвинутый приём · разобран модулем 9 курса неравенств</p>'

PAIRS = [
    (P18_OLD, P18_NEW, 1, "мини-курс параметров в маршрут линии 18"),
    (RAT_CARD_OLD, RAT_CARD_NEW, 1, "карточка рационализации → курс неравенств"),
    (RAT_META_OLD, RAT_META_NEW, 1, "подпись карточки рационализации"),
]

text = io.open(PATH, encoding="utf-8").read()

if P18_NEW in text:
    print("правки уже применены, выходим")
    raise SystemExit(0)

for old, new, cnt, what in PAIRS:
    n = text.count(old)
    assert n == cnt, "%s: якорь x%d (ждали %d)" % (what, n, cnt)
    text = text.replace(old, new)
    print("ок: %s" % what)

# вторая битая ссылка на рационализацию — в строке маршрута линии 15
n = text.count('href="trainers/rationalization.html"')
if n:
    text = text.replace('href="trainers/rationalization.html"', 'href="trainers/inequalities.html"')
    print("ок: снято ещё %d ссылок на rationalization.html в маршруте" % n)

assert 'href="trainers/rationalization.html"' not in text
assert text.rstrip().endswith("</html>")
io.open(PATH, "w", encoding="utf-8").write(text)
print("index.html: %d байт" % os.path.getsize(PATH))
