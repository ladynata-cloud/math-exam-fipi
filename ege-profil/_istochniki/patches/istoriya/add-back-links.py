# -*- coding: utf-8 -*-
"""
Четыре страницы курса не ведут никуда: открыв их, ученик не может вернуться
в навигатор. Добавляем возврат — плавающую плашку внизу слева.

Стили инлайновые и намеренно нейтральные: у четырёх страниц четыре разных
дизайн-системы, и подстраиваться под каждую здесь неуместно. Плашка помечена
комментарием, чтобы её легко было найти и переоформить.
"""
import io
import os
import re

# Путь сборочной машины архива убран 24.09.2026 (машинных путей в репозитории
# не держим). Скрипт уже применён и лежит для истории, см. README.md рядом.
# Корень дерева курса задаётся только явно — переменной COURSE_ROOT.
ROOT = os.environ.get("COURSE_ROOT", "")
if not ROOT:
    raise SystemExit("история: скрипт уже применён 22.09.2026; корень курса — только через COURSE_ROOT")

MARK = "<!-- курс: возврат в навигатор -->"

LINK = (
    MARK + "\n"
    '<a href="../index.html" class="course-back" style="position:fixed;left:14px;bottom:14px;'
    "z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:9px 14px;min-height:40px;"
    "border-radius:999px;background:#FFFFFF;border:1px solid rgba(30,58,159,.28);color:#1E3A9F;"
    "font:600 13px/1 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;text-decoration:none;"
    'box-shadow:0 2px 8px rgba(0,0,0,.14)">← Курс</a>\n'
)

FILES = [
    "trainers/inequalities.html",
    "trainers/interval-method.html",
    "trainers/trig-sum-to-product.html",
    "trainers/trigonometry.html",
]

for rel in FILES:
    path = os.path.join(ROOT, rel)
    text = io.open(path, encoding="utf-8").read()

    if MARK in text:
        print("%-42s уже есть, пропуск" % rel)
        continue

    assert text.count("</body>") == 1, "%s: </body> встречается %d раз" % (rel, text.count("</body>"))
    assert 'href="../index.html"' not in text, "%s: ссылка на курс уже есть" % rel

    before = len(text)
    text = text.replace("</body>", LINK + "</body>")

    assert text.count(MARK) == 1
    assert text.rstrip().endswith("</html>")
    assert text.count("<script") == io.open(path, encoding="utf-8").read().count("<script")

    io.open(path, "w", encoding="utf-8").write(text)
    print("%-42s +%d байт" % (rel, len(text) - before))

print("\nпроверка: у всех четырёх есть возврат")
for rel in FILES:
    t = io.open(os.path.join(ROOT, rel), encoding="utf-8").read()
    ok = MARK in t and 'href="../index.html"' in t and t.rstrip().endswith("</html>")
    print("  %-42s %s" % (rel, "ок" if ok else "ПРОБЛЕМА"))
