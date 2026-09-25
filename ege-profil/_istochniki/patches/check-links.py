# -*- coding: utf-8 -*-
"""
Проверка собранного дерева курса:
  1) все относительные href/src разрешаются в файлы, которые GitHub Pages
     опубликует;
  2) какие страницы никуда не ведут (тупики) и на какие никто не ссылается (сироты);
  3) где какой ключ прогресса используется.
Ничего не меняет. Код выхода 1, если есть битые ссылки, тупики или сироты;
иначе печатает маркер CHECK_LINKS_OK.

Ссылка — атрибут href="…"/src="…" и JS-свойство href:"…" / href: '…'
(так собираются карточки оглавления мини-курса trainers/parameters-18/).

Ссылка считается битой, если цели нет на диске с ТОЧНО таким регистром
имени (сверка с листингом каталога на каждом уровне: GitHub Pages различает
регистр, Windows — нет), если она ведёт в каталог без index.html или если
в пути есть компонент на «_» или «.» (кроме .htaccess): Jekyll такие файлы
и каталоги не публикует, на сайте будет 404.

Страницами курса не считаются служебные каталоги: всё, что начинается
с «_» или «.», и исходники/тесты (src, tests, node_modules). Ссылки внутри
комментариев (<!-- … -->, /* … */) не проверяются: это пояснения, а не
ссылки (так в тренажёрах Ященко описан встроенный банк:
«<script src="bank-t1-planimetry.js">» в комментарии).
"""
import io
import os
import re
import sys
from urllib.parse import unquote

# корень курса: аргумент или, по умолчанию, ege-profil/ (patches → _istochniki → ege-profil)
ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
ROOT = os.path.abspath(ROOT)

# атрибут href="…"/src="…" или JS-свойство href:"…"; кавычка закрывается той же
LINK_RE = re.compile(r'(?:\b(?:href|src)\s*=|\bhref\s*:)\s*(["\'])([^"\']+)\1', re.I)
EXT_RE = re.compile(r'^(?:https?:|mailto:|tel:|javascript:|data:|//|#)', re.I)
COMMENT_RE = re.compile(r'<!--.*?-->|/\*.*?\*/', re.S)
NON_PAGE_DIRS = {"src", "tests", "node_modules"}


def page_dir(d):
    return not (d.startswith("_") or d.startswith(".") or d in NON_PAGE_DIRS)


def hidden_from_jekyll(relt):
    """Компонент пути на «_» или «.» (кроме .htaccess): Jekyll его не публикует."""
    return any(c not in ("..", ".htaccess") and c[:1] in ("_", ".")
               for c in relt.replace("\\", "/").split("/") if c)


def resolve_exact(relt):
    """Цель ссылки на диске с точным регистром каждого имени.
    Возвращает путь к публикуемому файлу (для каталога — его index.html)
    или None, если такой страницы на сайте не будет."""
    cur = ROOT
    for c in relt.replace("\\", "/").split("/"):
        if c in ("", "."):
            continue
        if c == "..":
            cur = os.path.dirname(cur)
            continue
        try:
            names = os.listdir(cur)
        except OSError:
            return None
        if c not in names:
            return None
        cur = os.path.join(cur, c)
    if os.path.isdir(cur):
        try:
            return os.path.join(cur, "index.html") if "index.html" in os.listdir(cur) else None
        except OSError:
            return None
    return cur if os.path.isfile(cur) else None


pages, broken, external, links_from, linked_to = [], [], set(), {}, set()

for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if page_dir(d)]
    for name in sorted(filenames):
        if not name.lower().endswith((".html", ".htm")):
            continue
        path = os.path.join(dirpath, name)
        rel = os.path.relpath(path, ROOT)
        pages.append(rel)
        text = COMMENT_RE.sub("", io.open(path, encoding="utf-8", errors="replace").read())
        outs = set()
        for _q, raw in LINK_RE.findall(text):
            if EXT_RE.match(raw):
                if raw.lower().startswith("http"):
                    external.add(raw.split("/")[2])
                continue
            target = unquote(raw.split("#")[0].split("?")[0]).strip()
            if not target:
                continue
            resolved = os.path.normpath(os.path.join(dirpath, target))
            relt = os.path.relpath(resolved, ROOT)
            outs.add(relt)
            real = None if hidden_from_jekyll(relt) else resolve_exact(relt)
            if real:
                linked_to.add(os.path.relpath(real, ROOT))
            else:
                broken.append((rel, raw, relt))
        links_from[rel] = outs

print("=" * 66)
print("Страниц в дереве: %d" % len(pages))
print("=" * 66)

print("\n## Битые ссылки: %d" % len(broken))
for src, raw, relt in broken:
    print("  %-46s → %s" % (src, raw))

print("\n## Тупики (страница без единой ссылки внутрь курса)")
dead = [p for p in pages if not links_from.get(p)]
for p in dead:
    print("  %s" % p)
if not dead:
    print("  нет")

print("\n## Сироты (на страницу никто не ссылается)")
orphans = [p for p in pages if p not in linked_to and p != "index.html"]
for p in orphans:
    print("  %s" % p)
if not orphans:
    print("  нет")

print("\n## Внешние домены")
for d in sorted(external):
    print("  %s" % d)

print("\n## Ключи прогресса")
keys = {}
for dirpath, dirnames, filenames in os.walk(ROOT):
    for name in sorted(filenames):
        if not name.lower().endswith((".html", ".js")):
            continue
        path = os.path.join(dirpath, name)
        rel = os.path.relpath(path, ROOT)
        text = io.open(path, encoding="utf-8", errors="replace").read()
        for k in re.findall(r'["\']((?:mathExamCourseProgress|stereo3|ep_progress|trig-stp-trainer|profile-ege-course)[\w.\-]*)["\']', text):
            keys.setdefault(k, set()).add(rel)
for k in sorted(keys):
    print("  %-34s %s" % (k, ", ".join(sorted(keys[k])[:4]) + (" …" if len(keys[k]) > 4 else "")))

print("\nИтог: страниц %d, битых ссылок %d, тупиков %d, сирот %d" % (len(pages), len(broken), len(dead), len(orphans)))
if broken or dead or orphans:
    print("\nCHECK_LINKS_FAIL: битых ссылок %d, тупиков %d, сирот %d" % (len(broken), len(dead), len(orphans)))
    sys.exit(1)
print("\nCHECK_LINKS_OK")
