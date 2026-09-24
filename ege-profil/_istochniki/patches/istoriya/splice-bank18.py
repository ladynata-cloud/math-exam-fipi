# -*- coding: utf-8 -*-
"""
Возвращает в exam/bank.js расширенный модуль линии 18 (8 генераторов),
собранный в июльском чате про параметры. В выгрузке из проекта лежит
версия ДО этой склейки — проект был загружен раньше, чем чат закончился.

Старый блок сохраняется рядом, чтобы правку можно было откатить.
"""
import io
import os

# Путь сборочной машины архива убран 24.09.2026 (машинных путей в репозитории
# не держим). Скрипт уже применён и лежит для истории, см. README.md рядом.
# Корень дерева курса задаётся только явно — переменной COURSE_ROOT.
ROOT = os.environ.get("COURSE_ROOT", "")
if not ROOT:
    raise SystemExit("история: скрипт уже применён 22.09.2026; корень курса — только через COURSE_ROOT")
BANK = os.path.join(ROOT, "exam", "bank.js")
NEW18 = os.path.join(ROOT, "trainers", "parameters-18", "bank.module18.js")
BACKUP = os.path.join(ROOT, "exam", "bank.module18.old.js")

text = io.open(BANK, encoding="utf-8").read()
new_block = io.open(NEW18, encoding="utf-8").read().rstrip("\n")

start_anchor = "        { id: 18,"
end_anchor = "        { id: 19,"

assert text.count(start_anchor) == 1, "якорь начала модуля 18 не единственный"
assert text.count(end_anchor) == 1, "якорь начала модуля 19 не единственный"

i = text.index(start_anchor)
j = text.index(end_anchor)
assert i < j, "модуль 18 должен идти раньше модуля 19"

old_block = text[i:j]
io.open(BACKUP, "w", encoding="utf-8").write(old_block)

# новый блок должен заканчиваться запятой перед следующим модулем
tail = new_block.rstrip()
if not tail.endswith(","):
    tail += ","
patched = text[:i] + tail + "\n" + text[j:]

assert patched.count("{ id: 19,") == 1
assert "id: 18," in patched
io.open(BANK, "w", encoding="utf-8").write(patched)

print("старый модуль 18: %d символов -> сохранён в %s" % (len(old_block), os.path.basename(BACKUP)))
print("новый модуль 18: %d символов" % len(tail))
print("bank.js теперь: %d байт" % os.path.getsize(BANK))
