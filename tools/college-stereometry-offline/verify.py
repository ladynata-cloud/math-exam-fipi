"""Check the site download and exercise the unpacked ZIP in offline Chromium."""

import argparse
import re
from functools import partial
from html import unescape
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
from zipfile import ZipFile

from playwright.sync_api import expect, sync_playwright

from build import DOWNLOAD_PATH, LESSON, PACKAGE, ROOT


def exercise(page, index):
    page.goto(index)
    expect(page.locator("#research")).to_be_visible()
    polygon = page.locator(".cut-plane")
    initial = polygon.get_attribute("points")
    page.locator("#cut-position").focus()
    page.keyboard.press("End")
    expect(page.locator("#cut-height")).to_have_text("6 см")
    expect(polygon).not_to_have_attribute("points", initial)
    page.get_by_label("Показать размеры").check()
    expect(page.locator("#cut-measures")).to_contain_text("верхняя 2 см")
    before_turn = polygon.get_attribute("points")
    page.get_by_role("button", name="Другой вид").click()
    expect(polygon).not_to_have_attribute("points", before_turn)
    section = page.locator('[data-explore="section"]')
    section.get_by_role("button", name="Трапецию").click()
    expect(section.locator(".feedback")).to_have_attribute("data-result", "bad")
    section.get_by_role("button", name="Квадрат").click()
    expect(section.locator(".feedback")).to_have_attribute("data-result", "good")
    page.reload()
    expect(section.get_by_role("button", name="Квадрат")).to_have_attribute("aria-pressed", "true")

    page.get_by_role("link", name="Формулы", exact=True).click()
    expect(page.locator("#rules")).to_be_visible()
    page.get_by_role("link", name="Сразу к задаче №239").click()
    expect(page.locator("#exercise-title")).to_contain_text("№239")
    sketch = page.locator("#exercise-figure svg").first
    before_turn = sketch.inner_html()
    page.get_by_role("button", name="Повернуть вправо").click()
    assert sketch.inner_html() != before_turn
    submit = page.get_by_role("button", name="Проверить шаг")
    for wrong_answer in ("7", "8"):
        page.locator("#answer-0").fill(wrong_answer)
        submit.click()
    expect(page.locator(".hint")).to_contain_text("две равные части")
    for i, answer in enumerate(("4", "3", "√65", "sqrt(58)")):
        field = page.locator(f"#answer-{i}")
        field.fill(answer)
        submit.click()
        expect(field).to_be_disabled()
    expect(page.locator("#work-progress")).to_contain_text("Решено 1 из 6")
    page.reload()
    expect(page.locator("#answer-2")).to_have_value("√65")
    expect(page.locator("#answer-2")).to_be_disabled()
    expect(page.locator("#work-progress")).to_contain_text("без подсказок 0")


def submit_homework(page, first, second):
    page.locator("#answer-0").fill(first)
    page.locator("#answer-1").fill(second)
    page.get_by_role("button", name="Проверить ответы").click()


def edit_sample(directory):
    guide = (directory / "guide.html").read_text(encoding="utf-8")
    sample = unescape(re.search(r"<pre><code>(.*?)</code></pre>", guide, re.S)[1])
    content = directory / "content.js"
    source = content.read_text(encoding="utf-8")
    start = source.index("id: 'hw-square',")
    end = source.index("\n    },", start)
    content.write_text(source[:start] + sample + source[end:], encoding="utf-8")


def mobile(page, index):
    for width in (320, 390):
        page.set_viewport_size({"width": width, "height": 850})
        for stage, target in (("research", "#research"), ("rules", "#rules"),
                              ("task-239", "#work"), ("homework", "#work")):
            page.goto(f"{index}#{stage}")
            expect(page.locator(target)).to_be_visible()
            assert page.evaluate("document.documentElement.scrollWidth === innerWidth"), (width, stage)


def run(chromium):
    with TemporaryDirectory() as temp, sync_playwright() as playwright:
        directory = Path(temp) / "Урок 6"
        with ZipFile(PACKAGE) as archive:
            assert archive.testzip() is None
            archive.extractall(directory)
        index = (directory / "index.html").as_uri()
        browser = playwright.chromium.launch(executable_path=chromium)
        offline = browser.new_context(offline=True)
        page = offline.new_page()
        page.set_default_timeout(6000)
        external, failed, errors = [], [], []
        page.on("request", lambda request: external.append(request.url)
                if not request.url.startswith(("file:", "data:")) else None)
        page.on("requestfailed", lambda request: failed.append(request.url))
        page.on("pageerror", lambda error: errors.append(str(error)))
        exercise(page, index)

        page.get_by_role("link", name="Домашняя работа", exact=True).click()
        submit_homework(page, "17", "544")
        expect(page.locator(".exercise-complete")).to_contain_text("решена")
        page.emulate_media(media="print")
        expect(page.locator("#print-sheet")).to_be_visible()
        expect(page.locator("#print-list li")).to_have_count(6)
        page.emulate_media(media="screen")

        page.get_by_role("link", name="Как изменить задание").click()
        expect(page.locator("img")).to_be_visible()
        assert page.locator("img").evaluate("(image) => image.complete && image.naturalWidth > 0")
        edit_sample(directory)
        page.goto(index + "#homework")
        expect(page.locator("#exercise-condition")).to_contain_text("24 см, высота равна 5 см")
        expect(page.locator("#answer-0")).to_have_value("")
        assert page.evaluate("PyramidLesson.homework[0].figure().points.P[2]") == 5
        submit_homework(page, "17", "544")
        expect(page.locator('#answer-form [data-result="bad"]')).to_have_count(2)
        submit_homework(page, "13", "624")
        expect(page.locator(".exercise-complete")).to_contain_text("решена")
        page.locator("#solution summary").click()
        expect(page.locator("#solution-steps")).to_contain_text("624 см²")
        page.reload()
        expect(page.locator("#answer-1")).to_have_value("624")
        expect(page.locator("#answer-1")).to_be_disabled()
        mobile(page, index)
        assert not (external or failed or errors), (external, failed, errors)
        offline.close()

        handler = partial(SimpleHTTPRequestHandler, directory=ROOT)
        with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
            Thread(target=server.serve_forever, daemon=True).start()
            try:
                site = f"http://127.0.0.1:{server.server_port}"
                online = browser.new_page(viewport={"width": 320, "height": 850})
                online.goto(f"{site}/{LESSON.relative_to(ROOT).as_posix()}/")
                expect(online.locator("#research")).to_be_visible()
                assert online.evaluate("document.documentElement.scrollWidth === innerWidth")
                link = online.get_by_role("link", name="Скачать тренажёр (ZIP)")
                expect(link).to_have_attribute("href", DOWNLOAD_PATH)
                with online.expect_download() as download:
                    link.click()
                assert download.value.suggested_filename == PACKAGE.name
                assert download.value.path().read_bytes() == PACKAGE.read_bytes()
            finally:
                server.shutdown()
        browser.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--chromium", help="Path to a Chromium or Chromium Headless Shell executable")
    run(parser.parse_args().chromium)
    print("Site download, offline research, models, checking, persistence, adaptation and mobile layouts passed.")
