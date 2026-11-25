"""Exercise the factory UI in Chromium. Run with Python Playwright installed.

Set CHROMIUM_EXECUTABLE_PATH for an existing Chromium or install Playwright's
Chromium. Both the HTTP and the disconnected file:// scenarios use local files.
"""

import functools
import json
import os
import threading
from contextlib import contextmanager
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
TRAINER = Path("trainers/like-terms-factory.html")
KEY = "mathExamCourseProgress.v1"
TOPIC = "likeTermsFactory"
SEED = {
    "topics": {
        TOPIC: {"solved": 6, "correct": 4, "streak": 1, "bestStreak": 3, "history": [1, 0, 1]},
        "otherTopic": {"solved": 11, "bookmark": "original"},
    },
    "preferences": {"sound": False},
}
FULL_ANSWERS = {
    "x + 2x": "3x",
    "5a − a + 2b": "4a+2b",
    "−b + 4b + 3": "3b+3",
    "3xy + 2yx − xy + x": "4xy+x",
    "ab + 3ba − 2a + a": "4ab−a",
    "x² + 2x − 3x² + x": "−2x²+3x",
    "xy − yx + 5x − x": "4x",
    "2xy − 3x + yx + x − 5xy": "−2xy−2x",
}


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass


@contextmanager
def serve_project():
    handler = functools.partial(QuietHandler, directory=ROOT)
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield f"http://127.0.0.1:{server.server_port}/{TRAINER.as_posix()}"
        finally:
            server.shutdown()
            thread.join()


def progress(page):
    value = page.evaluate("(key) => localStorage.getItem(key)", KEY)
    result = json.loads(value)
    assert result["topics"]["otherTopic"] == SEED["topics"]["otherTopic"]
    assert result["preferences"] == SEED["preferences"]
    return result["topics"][TOPIC]


def check_width(page):
    actual, view = page.evaluate("() => [document.documentElement.scrollWidth, innerWidth]")
    assert actual <= view + 1, f"page overflows: width {actual}, viewport {view}"


def term(page, name):
    return page.locator("#terms").get_by_role("button", name=name, exact=True)


def go_to_legacy_example(page, expression):
    for _ in FULL_ANSWERS:
        if page.locator("#expr").inner_text() == expression:
            return
        page.get_by_role("button", name="Следующий пример", exact=False).click()
    raise AssertionError(f"Missing example: {expression}")


def play_legacy(page):
    check = page.locator("#gameCheck")
    hint = page.locator("#gameHint")
    page.locator("#mLearn").click()
    expect(page.locator("#expr")).to_have_text("x + 2x")
    expect(page.locator("#solved")).to_have_text("6")
    term(page, "x").focus()
    page.keyboard.press("Space")
    expect(page.locator("#crateIn")).to_have_text("x")
    term(page, "2x").click()
    check.click()
    expect(page.locator("#coef")).to_be_visible()
    page.locator("#coef").fill("3")
    check.click()
    assert progress(page)["solved"] == 7
    assert progress(page)["correct"] == 5
    assert progress(page)["history"][1:] == [1, 0, 1]

    # The first hint guides classification; it does not list the answer.
    page.get_by_role("button", name="Следующий пример", exact=False).click()
    hint.click()
    first_hint = page.locator("#fb").inner_text()
    assert first_hint and all(token not in first_hint for token in ("5a", "−a", "5 − 1"))
    hint.click()
    expect(page.locator("#fb")).not_to_have_text(first_hint)
    term(page, "2b").click()
    check.click()
    assert page.locator("#terms .good").count() == 0
    term(page, "2b").click()
    term(page, "5a").click()
    term(page, "−a").click()
    check.click()
    page.locator("#coef").fill("4")
    check.click()
    assert progress(page)["solved"] == 8
    assert progress(page)["correct"] == 5

    page.locator("#mTrain").click()
    go_to_legacy_example(page, "xy − yx + 5x − x")
    term(page, "xy").click()
    term(page, "−yx").click()
    check.click()
    expect(page.locator("#coef")).to_have_value("")
    before = progress(page)
    check.click()
    assert progress(page) == before
    expect(page.locator("#coef")).to_be_enabled()
    page.locator("#coef").fill("0")
    check.click()
    assert progress(page)["solved"] == before["solved"] + 1

    # Exercise one full shuffled deck using independently derived answers.
    page.locator("#mFull").click()
    seen = set()
    for _ in FULL_ANSWERS:
        check_width(page)
        question = page.locator("#expr").inner_text()
        assert question not in seen, f"Repeated question before completing deck: {question}"
        seen.add(question)
        choices = page.locator("#answers")
        answer = choices.get_by_role("button", name=FULL_ANSWERS[question], exact=True)
        before = progress(page)
        answer.click()
        assert progress(page)["solved"] == before["solved"] + 1
        assert progress(page)["correct"] == before["correct"] + 1
        after = progress(page)
        if answer.is_enabled():
            answer.click()
        assert progress(page) == after
        page.get_by_role("button", name="Следующий пример", exact=False).click()
    assert seen == set(FULL_ANSWERS)
    go_to_legacy_example(page, "x + 2x")
    before = progress(page)
    choices = page.locator("#answers")
    choices.get_by_role("button", name="x+2x", exact=True).click()
    expect(page.locator("#fb")).to_contain_text("Значение сохранилось")
    assert choices.locator(".good").count() == 0
    choices.get_by_role("button", name="3x", exact=True).click()
    after = progress(page)
    assert after["solved"] == before["solved"] + 1
    assert after["correct"] == before["correct"]
    page.reload()
    expect(page.locator("#solved")).to_have_text(str(after["solved"]))
    assert progress(page) == after
    return after


BRIDGE_KEY = "likeTermsFactory.brackets.v1"


def bridge_steps(page):
    return json.loads(page.evaluate("(key) => localStorage.getItem(key)", BRIDGE_KEY))["steps"]


def bridge_step(page, slug):
    panel = page.locator("#bridgePanel")
    expect(panel).to_be_visible()
    item = panel.locator(f'[data-step="{slug}"]')
    expect(item).to_be_visible()
    check_width(page)
    return item


def write_answer(page, value):
    field = page.locator("#bridgeAnswer")
    field.fill(value)
    field.press("Enter")


def choose(page, value):
    page.locator(f'input[name="bridge-choice"][value="{value}"]').check()
    page.locator("#bridgeCheck").click()


def next_step(page, old, new):
    assert bridge_steps(page)[old]["done"] is True, f"{old} was not completed"
    expect(page.locator("#bridgeNext")).to_be_focused()
    page.keyboard.press("Enter")
    item = bridge_step(page, new)
    expect(item.locator("h2")).to_be_focused()
    return item


def play_bridge(page):
    page.locator("#mBridge").focus()
    page.keyboard.press("Enter")
    bridge_step(page, "boxes")
    expect(page.locator("#bridgeContent h2")).to_be_focused()
    write_answer(page, "6")
    expect(page.locator("#bridgeNext")).not_to_be_visible()
    box = page.locator('[data-box="0"]')
    box.focus()
    page.keyboard.press("Space")
    expect(box).to_have_attribute("aria-expanded", "true")
    for crate in page.locator("[data-box]").all():
        assert crate.evaluate("(e) => e.scrollWidth <= e.clientWidth + 1")
    write_answer(page, "6")
    next_step(page, "boxes", "from-boxes")

    # An equivalent but unexpanded expression cannot complete the task.
    write_answer(page, "3(x+2)")
    assert bridge_steps(page)["from-boxes"]["first"] == "wrong"
    assert not bridge_steps(page)["from-boxes"].get("done")
    expect(page.locator("#bridgeFeedback")).to_be_visible()
    write_answer(page, "6+3x")
    next_step(page, "from-boxes", "distribute")

    page.locator("#bridgeHint").click()
    assert "2a+6-a" not in page.locator("#bridgeFeedback").inner_text().replace(" ", "")
    write_answer(page, "2a+2*3-a")
    assert not bridge_steps(page)["distribute"]["done"]
    expect(page.locator("#bridgeFeedback")).to_contain_text("произведени")
    write_answer(page, "6-a+2a")
    assert bridge_steps(page)["distribute"]["first"] == "assisted"
    next_step(page, "distribute", "collect")

    # A draft that has never been submitted must survive both leaving the
    # workshop and reloading the page. Neither should mark it as completed.
    page.locator("#bridgeAnswer").fill("a+")
    page.locator("#mLearn").click()
    expect(page.locator("#expr")).to_be_visible()
    page.reload()
    page.locator("#mBridge").click()
    bridge_step(page, "collect")
    expect(page.locator("#bridgeAnswer")).to_have_value("a+")
    assert not bridge_steps(page)["collect"].get("done")
    write_answer(page, "6+a")
    next_step(page, "collect", "error-sign")

    # Diagnose a wrong transformation, then revise without overwriting the
    # evidence of the first decision.
    wrong = page.locator('input[name="bridge-choice"]:not([value="inner-minus"])').first
    wrong.check()
    page.locator("#bridgeCheck").click()
    assert not bridge_steps(page)["error-sign"].get("done")
    choose(page, "inner-minus")
    assert bridge_steps(page)["error-sign"]["first"] == "wrong"
    next_step(page, "error-sign", "correct-sign")
    write_answer(page, "2+5b")
    next_step(page, "correct-sign", "product")
    choose(page, "add-coefficients")
    next_step(page, "product", "negative-factor")
    write_answer(page, "8+y")
    next_step(page, "negative-factor", "method")

    method = "inside" if page.viewport_size["width"] == 320 else "distribute"
    choose(page, method)
    next_step(page, "method", "method-line")
    write_answer(page, "3a" if method == "inside" else "8a-a+4a")
    next_step(page, "method-line", "method-result")
    write_answer(page, "11a")
    next_step(page, "method-result", "perimeter")

    for slug, answer, following in [
        ("perimeter", "4+4t", "balance"), ("balance", "7", "summary"),
    ]:
        expect(page.locator("#bridgeHint")).not_to_be_visible()
        if slug == "balance":
            left = page.locator("#bridgeBalanceLeft")
            left.fill("3n+2")
            write_answer(page, answer)
            assert not bridge_steps(page)[slug]["done"], "A guessed number masked a false transformation"
            expect(page.locator("#bridgeFeedback")).to_contain_text("левой чаши")
            for unfinished in ("3n+3*2", "3n+2+2+2"):
                left.fill(unfinished)
                write_answer(page, answer)
                assert not bridge_steps(page)[slug]["done"]
                expect(page.locator("#bridgeFeedback")).to_contain_text("В первой строке значение верно")
            left.fill("6+3n")
        write_answer(page, answer)
        assert bridge_steps(page)[slug]["first"] == ("wrong" if slug == "balance" else "correct")
        next_step(page, slug, following)
    for target in (
        "arzhenikov-map.html#course-b-expressions", "makarychev7/#lesson/p05",
        "makarychev7/#lesson/p06", "formuly-sokrashchennogo-umnozheniya.html",
        "nikolsky10/#lesson/p11", "alimov10-11/#lesson/p08",
    ):
        expect(page.locator(f'#bridgeContent a[href$="{target}"]')).to_be_visible()
    expect(page.locator("#bridgeContent")).to_contain_text("без подсказки: 9.")
    expect(page.locator("#bridgeContent")).to_contain_text("исправления без подсказки: 3.")
    expect(page.locator("#bridgeContent")).to_contain_text("С подсказкой: 1.")
    assert bridge_steps(page)["from-boxes"]["first"] == "wrong"
    assert bridge_steps(page)["distribute"]["hints"] > 0


def check_two_tabs(browser, url):
    """A second open copy must not erase work saved by the first one."""
    with browser.new_context() as context:
        first = context.new_page()
        second = context.new_page()
        for page in (first, second):
            page.goto(url + "#brackets")
            bridge_step(page, "boxes")
        first.locator('[data-box="0"]').click()
        write_answer(first, "6")
        first.locator("#bridgeNext").click()
        first.locator("#bridgeAnswer").fill("3x+")
        old_crate = second.locator('[data-box="1"]')
        if old_crate.is_visible():
            old_crate.click()
        first.reload()
        bridge_step(first, "from-boxes")
        assert bridge_steps(first)["boxes"]["done"]
        assert bridge_steps(first)["from-boxes"]["draft"] == "3x+"
    print("Passed two-tab progress regression")


def run(browser, url, width, offline=False):
    with browser.new_context(viewport={"width": width, "height": 850}, offline=offline) as context:
        context.route("https://**/*", lambda route: route.abort())
        page = context.new_page()
        page.set_default_timeout(4000)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(url)
        page.evaluate("([key, value]) => localStorage.setItem(key, value)", [KEY, json.dumps(SEED)])
        page.reload()
        check_width(page)
        old = play_legacy(page)
        play_bridge(page)
        assert progress(page) == old
        assert not errors, errors
    print(f"Passed {width}px {'file (offline)' if offline else 'HTTP'}")


def main():
    with serve_project() as url, sync_playwright() as playwright:
        executable = os.environ.get("CHROMIUM_EXECUTABLE_PATH")
        with playwright.chromium.launch(executable_path=executable) as browser:
            run(browser, url, 1280)
            run(browser, url, 320)
            run(browser, (ROOT / TRAINER).as_uri(), 390, offline=True)
            check_two_tabs(browser, url)


if __name__ == "__main__":
    main()
