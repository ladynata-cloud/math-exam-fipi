# -*- coding: utf-8 -*-
"""
Восстановление trainers/parameters-18/graphic.html по рецепту из чата:
это копия trainers/parameters-t18.html с двумя заменами —
back-ссылка ведёт в хаб мини-курса, а строка-eyebrow описывает практикум.
TID остаётся parameters-t18, чтобы прогресс учеников не потерялся.
"""
import io
import os

# Путь сборочной машины архива убран 24.09.2026 (машинных путей в репозитории
# не держим). Скрипт уже применён и лежит для истории, см. README.md рядом.
# Корень дерева курса задаётся только явно — переменной COURSE_ROOT.
ROOT = os.environ.get("COURSE_ROOT", "")
if not ROOT:
    raise SystemExit("история: скрипт уже применён 22.09.2026; корень курса — только через COURSE_ROOT")
SRC = os.path.join(ROOT, "trainers", "parameters-t18.html")
DST = os.path.join(ROOT, "trainers", "parameters-18", "graphic.html")

PAIRS = [
    ('<a class="back" href="../index.html">← Курс</a>',
     '<a class="back" href="index.html">← Оглавление</a>', 1),
    ('<p class="eyebrow">задание 18 · развёрнутый ответ · 4 балла</p>',
     '<p class="eyebrow">задание 18 · практикум · 6 задач · дриллы · зачёт</p>', 1),
]

text = io.open(SRC, encoding="utf-8").read()
for old, new, cnt in PAIRS:
    n = text.count(old)
    assert n == cnt, "якорь встретился %d раз (ждали %d): %r" % (n, cnt, old[:70])
    text = text.replace(old, new)

assert 'TID = "parameters-t18"' in text, "потерян TID parameters-t18"
assert text.rstrip().endswith("</html>"), "файл не заканчивается на </html>"

io.open(DST, "w", encoding="utf-8").write(text)
print("graphic.html собран: %d байт" % os.path.getsize(DST))
