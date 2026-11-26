#!/usr/bin/env python3
"""Build or verify the reproducible, self-contained Arzhenikov exercise ZIP."""

from __future__ import annotations

import argparse
import hashlib
from html import escape, unescape
from html.parser import HTMLParser
import io
import json
import posixpath
from pathlib import Path
import re
import stat
import sys
from urllib.parse import unquote, urljoin, urlsplit, urlunsplit
import zipfile


ROOT = Path(__file__).resolve().parents[1]
PAGE = Path("trainers/oge-basics/multiplication-division/arzhenikov-map.html")
OUTPUT = PAGE.with_name("arzhenikov-offline.zip")
ONLINE_PAGE = "https://mathexam.space/" + PAGE.as_posix()
NAVIGATOR = {
    "/assets/assistant/navigator-data.js",
    "/assets/assistant/navigator-widget.js",
}
STAMP = (2026, 11, 23, 0, 0, 0)
ASSET_EXTENSIONS = r"(?:css|js|png|jpe?g|svg|gif|webp|avif|ico|woff2?|ttf|json)"
CSS_URL = re.compile(r"url\(\s*(['\"]?)(.*?)\1\s*\)", re.IGNORECASE)
JS_ASSET = re.compile(
    r"(?P<quote>['\"])(?P<url>[^'\"\r\n]+?\." + ASSET_EXTENSIONS
    + r"(?:\?[^'\"\r\n#]*)?(?:#[^'\"\r\n]*)?)(?P=quote)", re.IGNORECASE
)
SCRIPT = re.compile(r"<script\b[^>]*>.*?</script\s*>", re.IGNORECASE | re.DOTALL)
ANCHOR = re.compile(r"<a\b[^>]*>.*?</a\s*>", re.IGNORECASE | re.DOTALL)
START_TAG = re.compile(r"<[a-zA-Z][^>]*>")

README = """ГОРОД МАЛЕНЬКИХ ДЕЛ — MathExam
Автономные занятия по мотивам методики К. П. Арженикова

Как начать
1. Распакуйте ВЕСЬ ZIP в отдельную папку. Не открывайте страницу внутри архива.
2. Откройте index.html обычным браузером.
3. Выберите историю, исследование или нужное место на карте.

Все включённые режимы работают бесплатно, без интернета, регистрации,
аккаунта и ключа ИИ. В комплект входят город, порт, оранжерея, пошаговое
деление и исследования с пространственной картой маршрутов. Добавлены
82 последовательных урока: 24 по основам арифметики, по 12 по письменному
делению, обыкновенным и десятичным дробям, 6 связующих уроков, 8 по алгебре, 8 по геометрии.
В них 656 условий, модели, промежуточные вычисления ученика, объяснения
и отдельная новая проверка. Входные 8 задач, повторение начатых тем и
16 итоговых ситуаций помогают выбрать и завершить путь. Проверки используют
48 отдельных условий и проверочные задачи знакомых уроков. Первый ответ,
помощь, исправление и знакомый повтор сохраняются раздельно.
Все прежние игры и сохранения поддерживаются.
Можно бесплатно использовать комплект на занятиях и передавать его детям,
семьям и коллегам. Передавайте всю распакованную папку или исходный ZIP.

Комплект распространяется по существующей лицензии MIT проекта MathExam.
Она разрешает копирование, изменение и публикацию с сохранением уведомлений
об авторском праве и разрешении. Полный текст прилагается в LICENSE.txt.
Открытый исходный код: https://github.com/ladynata-cloud/math-exam-fipi

Ответы и незаконченная работа сохраняются в этом браузере на этом устройстве,
если браузер разрешает локальное хранение. Они не передаются вместе с ZIP.
Если хранение недоступно, страница сообщает об этом; заниматься всё равно
можно. После перемещения папки браузер может открыть отдельное хранилище.

Ссылки на соседние онлайн-тренажёры MathExam и библиотечные источники требуют
интернета. Книги и внешние страницы не включены в архив. Вводные переходы
к алгебре и геометрии и новые вводные уроки не означают, что здесь собран
полный постраничный исторический курс Киселёва.

Об авторе и происхождении
Константин Петрович Аржеников (1862–1933) — преподаватель математики и автор
работ о начальном обучении арифметике. Игра, её истории и интерактивные
маршруты — современная авторская адаптация MathExam по мотивам его подхода,
а не копия исторического задачника.

Источники и дальнейшее чтение
Биография Арженикова, Летопись МГУ:
https://letopis.msu.ru/peoples/8648
Задачник, часть III (1924), письменное деление на с. 24:
https://djvu.online/file/Zmmk0C6Gqh83D
Задачник, часть IV (1924), обыкновенные и десятичные дроби:
https://djvu.online/file/AIsMeWPu7uz8w
«Методика начальной арифметики», 1936, электронная библиотека НГПУ:
https://repo.nspu.ru/handle/nspu/5833
Издание в переработке А. С. Пчёлко, библиотека Mathedu:
https://www.mathedu.ru/text/arzhenikov_metodika_nachalnoy_arifmetiki_1936/
А. П. Киселёв, «Алгебра», часть I, 1946, под редакцией А. Н. Барсукова:
https://search.rsl.ru/ru/record/01005810663
А. П. Киселёв, «Геометрия», 1955, под редакцией и с дополнениями Н. А. Глаголева:
https://search.rsl.ru/ru/record/01005583374

Онлайн-версия:
""" + ONLINE_PAGE + "\n"

OFFLINE_LINKS = """/* Offline-only navigation: all lessons stay local; other pages open online. */
(() => {
  'use strict';
  const onlinePage = '""" + ONLINE_PAGE + """';
  const pagePath = new URL(onlinePage).pathname;
  const archiveName = 'arzhenikov-offline.zip';
  function adapt(link) {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || /^(?:[a-z][a-z0-9+.-]*:|\\/\\/)/i.test(href)) return;
    const target = new URL(href, onlinePage);
    if (target.pathname.endsWith('/' + archiveName)) {
      const note = document.createElement('span');
      note.className = 'offline-download-note';
      note.textContent = 'Автономный комплект уже открыт.';
      link.replaceWith(note);
    } else if (target.pathname === pagePath) {
      link.setAttribute('href', target.hash || '#workshop');
    } else {
      link.setAttribute('href', target.href);
    }
  }
  function adaptWithin(root) {
    if (root.matches?.('a[href]')) adapt(root);
    root.querySelectorAll?.('a[href]').forEach(adapt);
  }
  adaptWithin(document);
  new MutationObserver(records => records.forEach(record => {
    if (record.type === 'attributes') adaptWithin(record.target);
    record.addedNodes.forEach(adaptWithin);
  })).observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['href']});
})();
"""


class Tags(HTMLParser):
    def __init__(self, text: str):
        super().__init__(convert_charrefs=True)
        self.tags: list[tuple[str, dict[str, str | None]]] = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


def attributes(tag: str) -> dict[str, str | None]:
    parsed = Tags(tag)
    return parsed.tags[0][1] if parsed.tags else {}


def replace_attribute(tag: str, name: str, value: str) -> str:
    pattern = re.compile(r"(\s" + re.escape(name) + r"\s*=\s*)(?:\"[^\"]*\"|'[^']*'|[^\s>]+)", re.I)
    return pattern.sub(lambda match: match[1] + '"' + escape(value, quote=True) + '"', tag, count=1)


def is_archive_link(url: str) -> bool:
    return unquote(urlsplit(urljoin(ONLINE_PAGE, url)).path) == "/" + OUTPUT.as_posix()


def navigation_url(url: str) -> str:
    if not url or url.startswith("#") or urlsplit(url).scheme or url.startswith("//"):
        return url
    target = urlsplit(urljoin(ONLINE_PAGE, url))
    if unquote(target.path) == "/" + PAGE.as_posix():
        return target.fragment and "#" + target.fragment or "#workshop"
    return urlunsplit(target)


def offline_html(source: str) -> str:
    def strip_navigator(match):
        src = attributes(match[0]).get("src") or ""
        return "" if urlsplit(src).path in NAVIGATOR else match[0]

    source = SCRIPT.sub(strip_navigator, source)
    source = ANCHOR.sub(
        lambda match: '<span class="offline-download-note">Автономный комплект уже открыт.</span>'
        if is_archive_link(attributes(match[0]).get("href") or "") else match[0], source
    )

    def rewrite_navigation(match):
        tag = match[0]
        if re.match(r"<a\b", tag, re.I):
            href = attributes(tag).get("href")
            if href is not None:
                tag = replace_attribute(tag, "href", navigation_url(href))
        return tag

    source = START_TAG.sub(rewrite_navigation, source)
    note = ('<aside id="offline-help" class="teachers"><p><strong>Автономный комплект.</strong> '
            'Включённые занятия работают без интернета, регистрации и ключа ИИ. '
            'Соседние онлайн-тренажёры и библиотечные источники открываются в интернете. '
            'Инструкция — в файле README.txt.</p></aside>')
    if "</main>" not in source or "</body>" not in source:
        raise ValueError("Expected the Arzhenikov page to contain main and body closing tags")
    source = source.replace("</main>", note + "\n</main>", 1)
    return source.replace("</body>", '<script src="offline-links.js"></script>\n</body>', 1)


def html_resources(text: str):
    for tag, attrs in Tags(text).tags:
        if tag == "script" and attrs.get("src"):
            yield attrs["src"]
        elif tag == "link" and set((attrs.get("rel") or "").lower().split()) & {
            "stylesheet", "icon", "preload", "modulepreload"
        } and attrs.get("href"):
            yield attrs["href"]
        elif tag in {"img", "source", "audio", "video", "track", "iframe"}:
            for attr in ("src", "poster"):
                if attrs.get(attr):
                    yield attrs[attr]
            if attrs.get("srcset"):
                for candidate in attrs["srcset"].split(","):
                    yield candidate.strip().split()[0]
        if attrs.get("style"):
            yield from (match[2] for match in CSS_URL.finditer(attrs["style"]))


def resources(path: Path, data: bytes):
    if path.suffix not in {".html", ".css", ".js"}:
        return
    text = data.decode("utf-8")
    if path.suffix == ".html":
        yield from html_resources(text)
    elif path.suffix == ".css":
        yield from (match[2] for match in CSS_URL.finditer(text))
    else:
        yield from (match["url"] for match in JS_ASSET.finditer(text))


def resolve_resource(parent: Path, url: str) -> Path | None:
    parsed = urlsplit(unescape(url))
    if not parsed.path or url.startswith("#") or parsed.scheme == "data":
        return None
    if parsed.scheme or parsed.netloc:
        raise ValueError(f"Network-dependent exercise resource: {url}")
    decoded = unquote(parsed.path)
    path = posixpath.normpath(decoded.lstrip("/") if decoded.startswith("/")
                              else (parent.parent / decoded).as_posix())
    if path == ".." or path.startswith("../") or "\\" in path:
        raise ValueError(f"Resource escapes repository: {url}")
    return Path(path)


def archive_name(path: Path) -> str:
    if path == PAGE:
        return "index.html"
    if path.is_relative_to(PAGE.parent):
        return path.relative_to(PAGE.parent).as_posix()
    return "_site/" + path.as_posix()


def rewrite_resources(path: Path, data: bytes) -> bytes:
    if path.suffix not in {".html", ".css", ".js"}:
        return data
    text = data.decode("utf-8")

    def local_url(url):
        target = resolve_resource(path, url)
        if target is None:
            return url
        parsed = urlsplit(unescape(url))
        relative = posixpath.relpath(archive_name(target), posixpath.dirname(archive_name(path)) or ".")
        return urlunsplit(("", "", relative, parsed.query, parsed.fragment))

    if path.suffix == ".css":
        text = CSS_URL.sub(lambda match: "url(" + match[1] + local_url(match[2]) + match[1] + ")", text)
    elif path.suffix == ".js":
        text = JS_ASSET.sub(lambda match: match["quote"] + local_url(match["url"]) + match["quote"], text)
    else:
        def rewrite_tag(match):
            tag = match[0]
            for value in html_resources(tag):
                # Exact attribute values are rewritten; text and navigation stay intact.
                attrs = attributes(tag)
                for attr in ("src", "href", "poster"):
                    if attrs.get(attr) == value:
                        tag = replace_attribute(tag, attr, local_url(value))
            return tag
        text = START_TAG.sub(rewrite_tag, text)
    return text.encode("utf-8")


def build_members(root: Path = ROOT) -> dict[str, bytes]:
    source = (root / PAGE).read_text(encoding="utf-8")
    # The generated helper is added after dependency traversal.
    html = offline_html(source).replace('<script src="offline-links.js"></script>', "")
    pending = {PAGE: html.encode("utf-8")}
    seen: dict[Path, bytes] = {}
    while pending:
        path, data = pending.popitem()
        if path in seen:
            continue
        seen[path] = data
        for url in resources(path, data):
            resource = resolve_resource(path, url)
            if resource is None or resource in seen or resource in pending:
                continue
            disk_path = root / resource
            if not disk_path.is_file() or not disk_path.resolve().is_relative_to(root.resolve()):
                raise ValueError(f"Missing or invalid exercise resource: {resource.as_posix()}")
            pending[resource] = disk_path.read_bytes()
    members = {archive_name(path): rewrite_resources(path, data) for path, data in seen.items()}
    members["index.html"] = members["index.html"].replace(
        b"</body>", b'<script src="offline-links.js"></script>\n</body>', 1
    )
    members["README.txt"] = README.encode("utf-8")
    members["LICENSE.txt"] = (root / "LICENSE").read_bytes()
    members["offline-links.js"] = OFFLINE_LINKS.encode("utf-8")
    manifest = {
        "format": 1,
        "source": ONLINE_PAGE,
        "files": [{"path": name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
                  for name, data in sorted(members.items())],
    }
    members["manifest.json"] = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    verify_resource_closure(members)
    return members


def verify_resource_closure(members: dict[str, bytes]) -> None:
    for name, data in members.items():
        if name == "offline-links.js":
            continue  # Its URL literals are navigation destinations, not fetched assets.
        for url in resources(Path(name), data):
            target = resolve_resource(Path(name), url)
            if target is not None and target.as_posix() not in members:
                raise ValueError(f"Incomplete offline resource: {name} -> {url}")
    for tag, attrs in Tags(members["index.html"].decode("utf-8")).tags:
        if tag == "a" and attrs.get("href"):
            href = attrs["href"]
            if not (href.startswith("#") or href.startswith("//") or urlsplit(href).scheme):
                raise ValueError(f"Unresolved offline navigation: {href}")
            if is_archive_link(href):
                raise ValueError("The offline page still offers its own ZIP download")


def zip_bytes(members: dict[str, bytes]) -> bytes:
    stream = io.BytesIO()
    # PNG assets are already compressed; STORED also avoids zlib-version variance.
    with zipfile.ZipFile(stream, "w", compression=zipfile.ZIP_STORED) as archive:
        for name, data in sorted(members.items()):
            info = zipfile.ZipInfo(name, date_time=STAMP)
            info.create_system = 3
            info.external_attr = (stat.S_IFREG | 0o644) << 16
            info.compress_type = zipfile.ZIP_STORED
            archive.writestr(info, data)
    return stream.getvalue()


def check_archive(data: bytes, members: dict[str, bytes]) -> None:
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        if archive.namelist() != sorted(members):
            raise ValueError("Offline ZIP member list differs from current page dependencies")
        if archive.testzip() is not None:
            raise ValueError("Offline ZIP has a corrupt member")
        for name, expected in members.items():
            if archive.read(name) != expected:
                raise ValueError(f"Offline ZIP has stale content: {name}")
    if data != zip_bytes(members):
        raise ValueError("Offline ZIP metadata/order is not reproducible")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify the committed ZIP without writing")
    args = parser.parse_args()
    try:
        members = build_members()
        output = ROOT / OUTPUT
        if args.check:
            if not output.is_file():
                raise ValueError("Offline ZIP is missing; run tools/build-arzhenikov-offline.py")
            data = output.read_bytes()
            check_archive(data, members)
        else:
            data = zip_bytes(members)
            output.write_bytes(data)
            check_archive(data, members)
        print(f"Arzhenikov offline {'CHECK PASS' if args.check else 'built'}: "
              f"{len(members)} files, {len(data)} bytes, SHA-256 {hashlib.sha256(data).hexdigest()}")
        return 0
    except (OSError, ValueError, zipfile.BadZipFile) as exc:
        print(f"Arzhenikov offline FAIL: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
