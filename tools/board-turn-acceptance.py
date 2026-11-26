#!/usr/bin/env python3
"""Независимая приёмка индивидуальной доски MathExam.

Запуск из рабочего дерева кандидата (Node 24, установленные зависимости
board-server, Python 3.10+, Playwright с поддержкой route_web_socket и Chromium):

    python tools/board-turn-acceptance.py --repo . --suite all
    python tools/board-turn-acceptance.py --repo . --suite reconnect
    python tools/board-turn-acceptance.py --repo . --suite hint

--chromium PATH задаёт уже установленный Chromium. По умолчанию используется
браузер Python Playwright. Скрипт запускает сервер и два браузерных контекста
на loopback. Тестовые комнаты живут в памяти нового процесса. Исходники
кандидата используются в режиме чтения. Код 1 означает расхождение или
ошибку испытания. Немедленный обрыв допускает старое или новое целостное
состояние и выводит наблюдаемое значение. Для штатной передачи последнего
завершённого действия, подтверждённых записей и закрытия подсказки проверки
обязательны. Вывод содержит только синтетические значения.
"""
import argparse
import asyncio
import functools
import json
import mimetypes
import os
import socket
import subprocess
import sys
import threading
import traceback
from contextlib import suppress
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from urllib.request import ProxyHandler, build_opener

from playwright.async_api import async_playwright


class Quiet(SimpleHTTPRequestHandler):

    def log_message(self, *args):
        pass

class HistoricalSite(Quiet):
    def __init__(self, *args, root, ref, **kwargs):
        self.root, self.ref = root, ref
        super().__init__(*args, **kwargs)

    def do_GET(self):
        resource = urlsplit(self.path).path.lstrip("/")
        result = subprocess.run(["git", "-C", str(self.root), "show", self.ref + ":" + resource],
                                stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        if result.returncode:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(resource)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(result.stdout)))
        self.end_headers()
        with suppress(BrokenPipeError, ConnectionResetError):
            self.wfile.write(result.stdout)


class LocalLink:
    """A separate TCP path to the same test server for each participant."""

    def __init__(self, server_port):
        self.server_port = server_port
        self.blocked = False
        self.connections = set()

    async def start(self):
        self.server = await asyncio.start_server(self.accept, '127.0.0.1', 0)
        self.origin = 'http://127.0.0.1:' + str(self.server.sockets[0].getsockname()[1])
        return self.origin

    async def accept(self, reader, writer):
        if self.blocked:
            writer.transport.abort()
            return
        upstream = None
        try:
            upstream_reader, upstream = await asyncio.open_connection('127.0.0.1', self.server_port)
            self.connections.update([writer, upstream])
            if self.blocked:
                return

            async def pump(src, dst):
                while data := await src.read(65536):
                    dst.write(data)
                    await dst.drain()
            tasks = [asyncio.create_task(pump(reader, upstream)), asyncio.create_task(pump(upstream_reader, writer))]
            _, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
            for task in pending:
                task.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)
        except OSError:
            pass
        finally:
            for endpoint in [writer, upstream]:
                if endpoint:
                    self.connections.discard(endpoint)
                    endpoint.transport.abort()

    def cut(self):
        self.blocked = True
        assert self.connections
        for endpoint in list(self.connections):
            endpoint.transport.abort()

    async def close(self):
        self.blocked = True
        for endpoint in list(self.connections):
            endpoint.transport.abort()
        self.server.close()
        await self.server.wait_closed()


class Client:

    def __init__(self):
        self.link = None

    async def install(self, browser, site, api, legacy=None):
        self.link = LocalLink(urlsplit(api).port)
        proxy = await self.link.start()
        self.context = await browser.new_context(viewport={'width': 1280, 'height': 900}, service_workers='block')
        self.site = legacy or site
        allowed = {urlsplit(self.site).netloc, urlsplit(proxy).netloc}

        async def http(route):
            url = urlsplit(route.request.url)
            if url.netloc in allowed:
                await route.continue_()
            else:
                await route.abort()

        async def ws(route):
            if urlsplit(route.url).netloc in allowed:
                route.connect_to_server()
            else:
                await route.close()
        await self.context.route('**/*', http)
        await self.context.route_web_socket('**/*', ws)
        self.p = await self.context.new_page()
        self.p.set_default_timeout(20000)

    async def cut(self):
        self.link.cut()

    async def locked(self):
        await self.p.wait_for_function("!roomReady() && !canWrite() && document.querySelector('#trainerFrame').inert")

    async def ready(self, writer):
        await self.p.wait_for_function("w=>shared.connected && roomStateReceived && shared.socket?.connected && bridgeSession?.hydrated && canWrite()===w && document.querySelector('#mirrorStatus').dataset.mirrorStatus==='connected' && document.querySelector('#trainerFrame').inert===!w", arg=writer)
        await self.p.wait_for_function("shared.socket.io.engine.transport.name==='websocket'")

    async def snapshot(self):
        return await asyncio.wait_for(self.p.evaluate("()=>new Promise(resolve=>{\n            shared.socket.once('room:state', msg=>resolve({trainer:msg.state.latestTrainerState?.state, pages:msg.state.pages, pageBytes:JSON.stringify(msg.state.pages)}));\n            shared.socket.emit('room:state');\n        })"), timeout=8)

    async def state(self):
        return await self.p.evaluate("document.querySelector('#trainerFrame').contentWindow.getBoardTrainerState()")

    async def same(self, state):
        await self.p.wait_for_function("expected=>{\n          const s=document.querySelector('#trainerFrame').contentWindow.getBoardTrainerState();\n          return [s,latestTrainerState?.state].every(obj=>obj && Object.entries(expected).every(([k,v])=>obj[k]===v))\n        }", arg=state)

    async def point(self, x):
        svg = self.p.frame_locator('#trainerFrame').locator('#svg')
        await svg.scroll_into_view_if_needed()
        box = await svg.bounding_box()
        await self.p.mouse.click(box['x'] + box['width'] * (50 + (x + 10) * 31) / 720, box['y'] + box['height'] / 2)

    async def draw(self):
        pen = self.p.locator('[data-tool=pen]').first
        await pen.click()
        cv = self.p.locator('#canvas')
        await cv.scroll_into_view_if_needed()
        box = await cv.bounding_box()
        x, y = (box['x'] + 50, box['y'] + 65)
        await self.p.mouse.move(x, y)
        await self.p.mouse.down()
        await self.p.mouse.move(x + 75, y + 12, steps=5)
        await self.p.mouse.up()
        await self.p.wait_for_function('publicSnapshot().pages.some(p=>p.strokes.length>0)')

async def open_room(teacher, pupil, site, trainer):
    query = urlencode({"server": teacher.link.origin, "trainer": f"/trainers/{trainer}.html"})
    await teacher.p.goto(f"{teacher.site}/trainers/trainer-board.html?{query}")
    await teacher.p.wait_for_function(
        "id => trainerRegistry.status === 'ready' && state.trainerUrl.includes(id)", arg=trainer
    )
    await teacher.p.locator("#openShare").click()
    await teacher.p.locator("#createRoom").click()
    await teacher.p.wait_for_function("document.querySelector('#studentLink').value.includes('room=')")
    parts = urlsplit(await teacher.p.locator("#studentLink").input_value())
    assert (parts.scheme, parts.netloc) == ("http", urlsplit(teacher.site).netloc), "Invitation must be local"
    params = dict(parse_qsl(parts.query))
    assert params["server"] == teacher.link.origin
    # Both loopback links forward to the same server and room. Each can fail independently.
    params["server"] = pupil.link.origin
    await teacher.p.keyboard.press("Escape")
    await pupil.p.goto(urlunsplit(parts._replace(netloc=urlsplit(pupil.site).netloc, query=urlencode(params))))
    await asyncio.gather(teacher.ready(True), pupil.ready(False))


async def pupil_turn(teacher, pupil):
    await teacher.p.locator("#boardControlToggle").click()
    await asyncio.gather(teacher.ready(False), pupil.ready(True))


async def point_setup(teacher, pupil):
    await pupil_turn(teacher, pupil)
    await pupil.p.frame_locator("#trainerFrame").locator('[data-mode="gte"]').click()
    await pupil.point(-8)
    old = await pupil.state()
    await teacher.same(old)
    assert old["score"] == 0 and old["x"] == -8 and not old["scored"]
    return old


async def reconnect_both(teacher, pupil, pupil_first, delayed_registry=False):
    await teacher.cut()
    await teacher.locked()
    await pupil.p.wait_for_function("roomReady() && canWrite() && knownRoleOffline('teacher')")
    await pupil.point(6)
    expected = await pupil.state()
    assert expected["score"] == 1 and expected["x"] == 6
    await pupil.draw()
    await pupil.same(expected)
    acknowledged = await pupil.snapshot()
    assert acknowledged["trainer"] == expected
    assert sum(len(p["strokes"]) for p in acknowledged["pages"]) == 1
    await pupil.cut()
    await pupil.locked()

    delayed = asyncio.Event()
    if delayed_registry:
        async def hold_registry(route):
            await asyncio.sleep(.45)
            delayed.set()
            await route.fallback()
        await teacher.context.route("**/api/trainer-registry", hold_registry)
    order = [(teacher, True), (pupil, False)]
    for client, writer in (reversed(order) if pupil_first else order):
        client.link.blocked = False
        await client.ready(writer)
        await client.same(expected)
        assert await client.snapshot() == acknowledged, "Authoritative state changed after reconnect"
        page_bytes = await client.p.evaluate("JSON.stringify(publicSnapshot().pages)")
        assert page_bytes == acknowledged["pageBytes"], "Client ink differs from acknowledged bytes"
    if delayed_registry:
        assert delayed.is_set(), "Teacher must restore with a delayed registry"


async def reconnect_pupil(teacher, pupil, old, wait_for_delivery):
    await pupil.p.evaluate("""()=>{
        const w=document.querySelector('#trainerFrame').contentWindow;
        w.document.querySelector('#svg').addEventListener('pointerdown', e=>{
            window.auditPoint={trusted:e.isTrusted, state:w.getBoardTrainerState()};
        },{once:true});
    }""")
    await pupil.point(6)
    if wait_for_delivery:
        expected = await pupil.state()
        await teacher.same(expected)
        assert (await pupil.snapshot())["trainer"] == expected
    await pupil.cut()
    await pupil.locked()
    await teacher.ready(True)
    await teacher.p.wait_for_function("knownRoleOffline('student')")
    event = await pupil.p.evaluate("window.auditPoint")
    expected = event["state"]
    assert event["trusted"] and expected["x"] == 6 and expected["score"] == 1
    actual = (await teacher.snapshot())["trainer"]
    print(f"  learner x={expected['x']}, score={expected['score']}; room x={actual['x']}, score={actual['score']}")
    if wait_for_delivery:
        assert actual == expected, "Acknowledged pupil action disappeared"
    else:
        assert actual in (old, expected), "Room retained a partial action"

    await teacher.p.frame_locator("#trainerFrame").locator('[data-mode="lt"]').click()
    await teacher.point(-7)
    newer = await teacher.state()
    await teacher.same(newer)
    assert (await teacher.snapshot())["trainer"] == newer
    pupil.link.blocked = False
    await pupil.ready(False)
    await asyncio.gather(pupil.same(newer), teacher.same(newer))
    assert (await pupil.snapshot())["trainer"] == newer, "Stale pupil state replaced teacher action"
    if not wait_for_delivery and actual != expected:
        await pupil.p.locator("#downloadTrainerDraft").wait_for(state="visible")
        assert await pupil.p.evaluate("trainerDraft.state") == expected
        await pupil.p.reload()
        await pupil.ready(False)
        await pupil.p.locator("#downloadTrainerDraft").wait_for(state="visible")
        assert await pupil.p.evaluate("trainerDraft.state") == expected
        assert (await pupil.snapshot())["trainer"] == newer


async def handoff(teacher, pupil, pupil_gives):
    if pupil_gives:
        await pupil_turn(teacher, pupil)
    old_writer, new_writer = (pupil, teacher) if pupil_gives else (teacher, pupil)
    old = await old_writer.state()
    await new_writer.same(old)
    selector = "#releaseControl" if pupil_gives else "#boardControlToggle"
    # Two normal UI handlers in one browser task give a reproducible ordering.
    wanted = await old_writer.p.evaluate("""selector=>{
        const child=document.querySelector('#trainerFrame').contentWindow;
        child.document.querySelector('#hintBtn').click();
        const state=child.getBoardTrainerState();
        document.querySelector(selector).click();
        return state;
    }""", selector)
    assert old["hint"] != wanted["hint"], "UI action did not change the hint"
    await asyncio.gather(old_writer.ready(False), new_writer.ready(True))
    # Allow asynchronous transport and rendering to settle before comparing.
    await asyncio.sleep(.6)
    visible = [await old_writer.state(), await new_writer.state()]
    assert visible == [wanted, wanted], (
        f"Desired hint={wanted['hint']}, outgoing={visible[0]['hint']}, incoming={visible[1]['hint']}"
    )
    assert (await new_writer.snapshot())["trainer"] == wanted


async def rapid_revoke(teacher, pupil):
    """Use trusted mouse events on two separate screens and measure their spacing."""
    old = await point_setup(teacher, pupil)
    button = teacher.p.locator("#boardControlToggle")
    await button.scroll_into_view_if_needed()
    box = await button.bounding_box()
    await pupil.p.evaluate("""()=>{
        const w=document.querySelector('#trainerFrame').contentWindow;
        w.document.querySelector('#svg').addEventListener('pointerdown', e=>{
            window.auditRevokeInput={trusted:e.isTrusted, time:performance.timeOrigin+performance.now(),
                state:w.getBoardTrainerState()};
        },{once:true});
    }""")
    await teacher.p.evaluate("""()=>{
        document.querySelector('#boardControlToggle').addEventListener('click', e=>{
            window.auditRevoke={trusted:e.isTrusted,time:performance.timeOrigin+performance.now()};
        },{capture:true,once:true});
    }""")
    await pupil.point(6)
    await teacher.p.mouse.click(box["x"]+box["width"]/2, box["y"]+box["height"]/2)
    await asyncio.gather(teacher.ready(True), pupil.ready(False))
    event = await pupil.p.evaluate("window.auditRevokeInput")
    revoke = await teacher.p.evaluate("window.auditRevoke")
    gap_ms = revoke["time"] - event["time"]
    assert event["trusted"] and revoke["trusted"] and event["state"]["score"] == old["score"]+1
    if not 0 <= gap_ms < 30:
        raise RuntimeError(f"Timing window missed ({gap_ms:.1f} ms); repeat on an idle local host")
    await asyncio.sleep(.6)
    expected = event["state"]
    actual = [await teacher.state(), await pupil.state()]
    print(f"  revoke gap={gap_ms:.1f} ms; expected x={expected['x']}, score={expected['score']}")
    assert actual == [expected, expected], f"Restored x={[x['x'] for x in actual]}, score={[x['score'] for x in actual]}"
    assert (await teacher.snapshot())["trainer"] == expected


async def hint_expiry(teacher, pupil, hand_off):
    await teacher.p.frame_locator("#trainerFrame").locator("#hint").click()
    await pupil.same({"hintVisible": True})
    if hand_off:
        await pupil_turn(teacher, pupil)
    await asyncio.sleep(5.2)
    flags = [(await teacher.state())["hintVisible"], (await pupil.state())["hintVisible"]]
    room = (await (pupil if hand_off else teacher).snapshot())["trainer"]
    flags.append(room["hintVisible"])
    assert flags == [False, False, False], f"Expired hint: teacher, pupil, room = {flags}"


async def repeat_turns(teacher, pupil):
    await pupil_turn(teacher, pupil)
    await pupil.draw()
    await teacher.p.wait_for_function("publicSnapshot().pages[0].strokes.length === 1")
    first = await pupil.snapshot()
    for _ in range(4):
        await teacher.p.locator("#boardControlToggle").click()
        await asyncio.gather(teacher.ready(True), pupil.ready(False))
        await pupil_turn(teacher, pupil)
    assert (await pupil.snapshot())["pageBytes"] == first["pageBytes"]
    assert await teacher.p.evaluate("shared.controlVersion") == await pupil.p.evaluate("shared.controlVersion")


async def change_rooms(browser, site, api, teacher, pupil):
    await teacher.draw()
    await pupil.p.wait_for_function("publicSnapshot().pages[0].strokes.length === 1")
    old = await pupil.snapshot()
    old_link = pupil.p.url
    marker = '{"topics":{"synthetic":{"right":7}}}'
    await pupil.p.evaluate("v=>localStorage.setItem('mathExamCourseProgress.v1',v)", marker)
    second = Client()
    try:
        await second.install(browser, site, api)
        await open_room(second, pupil, site, "inequalities-number-line")
        new = await pupil.snapshot()
        assert all(not page["strokes"] for page in new["pages"])
        await pupil.p.reload()
        await pupil.ready(False)
        assert (await pupil.snapshot())["pageBytes"] == new["pageBytes"]
        await pupil.p.goto(old_link)
        await pupil.ready(False)
        assert (await pupil.snapshot())["pageBytes"] == old["pageBytes"]
        assert await pupil.p.evaluate("localStorage.getItem('mathExamCourseProgress.v1')") == marker
    finally:
        await second.context.close()
        await second.link.close()


CASES = {
    "reconnect": ["immediate", "confirmed", "both-teacher-first", "both-pupil-first", "both-teacher-delayed", "both-pupil-delayed"],
    "handoff": ["teacher-grants", "pupil-releases", "revoke-fast"],
    "rooms": ["repeat-turns", "change-rooms"],
    "hint": ["hint-expires", "hint-handoff"],
}


async def run_case(browser, site, api, case, legacy=None):
    teacher, pupil = Client(), Client()
    try:
        historical = case in ("mixed-clients", "legacy-pair")
        await asyncio.gather(teacher.install(browser, site, api, legacy if case == "legacy-pair" else None),
                             pupil.install(browser, site, api, legacy if historical else None))
        if historical:
            await open_room(teacher, pupil, site, "negative-numbers-line")
            await teacher.draw()
            await pupil.p.wait_for_function("state.pages[0].strokes.length === 1")
            before = await teacher.snapshot()
            if case == "legacy-pair":
                await pupil_turn(teacher, pupil)
                await pupil.draw()
                await teacher.p.wait_for_function("state.pages[0].strokes.length === 2")
                assert len((await teacher.snapshot())["pages"][0]["strokes"]) == 2
            else:
                await teacher.p.locator("#boardControlToggle").click()
                await teacher.p.wait_for_function("document.querySelector('#shareStatus').textContent.includes('обновите доску')")
                await asyncio.gather(teacher.ready(True), pupil.ready(False))
                assert (await teacher.snapshot())["pages"] == before["pages"]
                await teacher.draw()
                await pupil.p.wait_for_function("state.pages[0].strokes.length === 2")
            return
        trainer = "negative-numbers-line" if case in CASES["hint"] else "inequalities-number-line"
        await open_room(teacher, pupil, site, trainer)
        if case == "repeat-turns":
            await repeat_turns(teacher, pupil)
        elif case == "change-rooms":
            await change_rooms(browser, site, api, teacher, pupil)
        elif case in CASES["hint"]:
            await hint_expiry(teacher, pupil, hand_off=(case == "hint-handoff"))
        elif case == "revoke-fast":
            await rapid_revoke(teacher, pupil)
        elif case in CASES["handoff"]:
            await handoff(teacher, pupil, pupil_gives=(case == "pupil-releases"))
        else:
            previous = await point_setup(teacher, pupil)
            if case.startswith("both-"):
                await reconnect_both(teacher, pupil, pupil_first=case.startswith("both-pupil"), delayed_registry=case.endswith("-delayed"))
            else:
                await reconnect_pupil(teacher, pupil, previous, wait_for_delivery=(case == "confirmed"))
    except Exception:
        # Print booleans and diagnostic labels only. Keep room IDs and invitations private.
        for role, client in [("teacher", teacher), ("pupil", pupil)]:
            if hasattr(client, "p"):
                with suppress(Exception):
                    info = await client.p.evaluate("""()=>({
                        ready:typeof shared!=="undefined" && shared.connected && roomStateReceived,
                        writer:typeof canWrite==="function" && canWrite(),
                        transport:typeof shared!=="undefined" && !!shared.socket?.connected,
                        mirror:document.querySelector("#mirrorStatus")?.dataset.mirrorStatus
                    })""")
                    print(f"  {role}: {info}", flush=True)
        raise
    finally:
        for client in (teacher, pupil):
            if hasattr(client, "context"):
                await client.context.close()
            if client.link is not None:
                await client.link.close()


async def run(args):
    root = args.repo.resolve()
    if not (root / "board-server" / "index.js").is_file():
        raise SystemExit("--repo must point to a MathExam checkout")
    head = subprocess.check_output(["git", "-C", str(root), "rev-parse", "HEAD"], text=True).strip()
    dirty = subprocess.run(["git","-C",str(root),"diff","--quiet","HEAD","--",
                            "trainers","board-server/index.js"], check=False).returncode
    print(f"Candidate {head} ({'local modifications' if dirty else 'committed runtime'})", flush=True)
    web = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(root)))
    threading.Thread(target=web.serve_forever, daemon=True).start()
    site = f"http://127.0.0.1:{web.server_port}"
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    api = f"http://127.0.0.1:{port}"
    server = None
    failed = 0
    cases = [c for group in CASES.values() for c in group] if args.suite == "all" else CASES[args.suite]
    legacy = None
    previous_web = None
    if args.legacy_ref:
        ref = subprocess.check_output(["git", "-C", str(root), "rev-parse", "--verify", "--end-of-options",
                                       args.legacy_ref + "^{commit}"], text=True).strip()
        previous_web = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(HistoricalSite, root=root, ref=ref))
        threading.Thread(target=previous_web.serve_forever, daemon=True).start()
        legacy = f"http://127.0.0.1:{previous_web.server_port}"
        print("Previous client " + ref, flush=True)
        if args.suite == "all":
            cases += ["mixed-clients", "legacy-pair"]
    if args.case in ("mixed-clients", "legacy-pair") and not legacy:
        raise SystemExit("Historical browser cases require --legacy-ref")
    if args.case is not None:
        cases = [args.case]
    try:
        server = subprocess.Popen(
            ["node", "index.js"], cwd=root/"board-server", stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            env={"PATH": os.environ["PATH"], "NODE_ENV": "test", "PORT": str(port), "HOST": "127.0.0.1"}
        )
        for _ in range(80):
            if server.poll() is not None:
                raise RuntimeError("Temporary server exited; verify board-server dependencies")
            with suppress(OSError):
                with build_opener(ProxyHandler({})).open(api+"/health", timeout=.5) as response:
                    if response.status == 200:
                        break
            await asyncio.sleep(.1)
        else:
            raise RuntimeError("Temporary board server did not become ready")
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(executable_path=args.chromium, args=["--disable-background-networking"])
            try:
                for case in cases:
                    try:
                        await asyncio.wait_for(run_case(browser, site, api, case, legacy), timeout=100)
                    except AssertionError as error:
                        failed += 1
                        print(f"FAIL {case}: {error}", flush=True)
                    except RuntimeError as error:
                        failed += 1
                        print(f"ERROR {case}: {error}", flush=True)
                    except Exception as error:
                        failed += 1
                        frames = [f for f in traceback.extract_tb(error.__traceback__) if Path(f.filename).resolve() == Path(__file__).resolve()]
                        location = " -> ".join(f"{f.name}:{f.lineno}" for f in frames)
                        print(f"ERROR {case}: {type(error).__name__} at {location}", flush=True)
                    else:
                        print(f"PASS {case}", flush=True)
            finally:
                await browser.close()
    finally:
        if server is not None and server.poll() is None:
            server.terminate()
            server.wait(timeout=5)
        if previous_web:
            previous_web.shutdown()
            previous_web.server_close()
        web.shutdown()
        web.server_close()
    print(f"TOTAL {len(cases)}, PASSED {len(cases)-failed}, FAILED {failed}", flush=True)
    return int(bool(failed))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument("--chromium", help="Optional path to an installed Chromium executable")
    parser.add_argument("--suite", choices=["all", *CASES], default="all")
    parser.add_argument("--legacy-ref", help="Also test two previously published clients and a mixed-version pair from this git commit")
    parser.add_argument("--case", choices=[case for group in CASES.values() for case in group]+["mixed-clients", "legacy-pair"], help="Run one case")
    if not __debug__:
        sys.exit("Run without python -O; acceptance assertions must be enabled")
    sys.exit(asyncio.run(run(parser.parse_args())))
