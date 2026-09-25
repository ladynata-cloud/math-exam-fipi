/* Прогон тренажёра стереометрии на телефоне: Chromium с касанием,
   {hasTouch, isMobile, viewport 360×740}. Мышью эти дефекты не ловятся:
   Chromium отменяет касание (pointercancel), если touch-action не none,
   и тогда чертёж не вращается пальцем, а страница уезжает.

   Выборка: N старых задач (числовой id) и N новых, равномерно по банку
   (по умолчанию N = 10). Для каждой задачи:
     • ошибок консоли и страницы нет;
     • нет горизонтальной прокрутки страницы;
     • touch-action: none у холста и у его контейнера #viewport;
     • при открытии тело и подписи целиком на холсте (_frame.js, FRAME),
       а легенда не лежит поверх холста;
     • протяжка пальцем по чертежу вращает сцену (кадр меняется),
       касание не отменяется (pointercancel = 0), страница не прокручивается;
     • щипок двумя пальцами только масштабирует: расстояние камеры меняется,
       углы обзора — нет (раньше каждый палец ещё и вращал чертёж), и
       отпускание пальцев не выбирает линию;
     • кнопки не перекрыты (в центре кнопки — сама кнопка) и не ниже 44 px.
       Обязательные (#btnCheck, #btnHint, #btnSolution, #btnPrev, #btnNext,
       #btnHome, #btnRotate, #navToggle, #sendProgressMail): нет на странице
       или скрыта — тоже отказ; условная — только #btnConstruct (есть не
       у каждой задачи);
     • верный ответ принимается, «Построение» включается.
   Плюс хаб (index.html): нет горизонтальной прокрутки, ссылка в курс есть,
   обязательные #sendProgressMail («Отправить прогресс») и .hub-back
   есть, видны, не перекрыты и не ниже 44 px.
   Плюс выбор линии касанием (панель измерений): у kub-14 (два куба со
   скрытыми буквами, не призраки) касание ребра открывает измерение, в панели
   слово «ребро», а не невидимые имена; у 27061 касание ребра призрака без
   букв (px "2": A₂B₂…) ничего не выбирает, а ребра основного куба — выбирает
   (контроль, что касание вообще доходит до выбора). И касание рёбер в верхней
   половине чертежа (kub-14, par-29, 27064; вид заранее повёрнут) задевает только
   выбор: задача та же, автовращение не включилось, вид не сброшен, холст
   не сдвинулся (± 1 px), click после касания браузер не прислал.

   node touch-test.js [--n=10] [--shots=папка]
   STEREO_ROOT — папка стерео-пакета (по умолчанию ege-profil/trainers/stereo),
   PW_CHROME — путь к Chrome/Chromium, если у Playwright нет своего.
   Маркер успеха: STEREO_TOUCH_OK.                                           */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
const { HOOK, FRAME } = require("./_frame.js");

const ROOT = process.env.STEREO_ROOT || path.resolve(__dirname, "..", "..", "trainers", "stereo");
const N = +((process.argv.find(a => a.startsWith("--n=")) || "").slice(4) || 10);
const shotsDir = (process.argv.find(a => a.startsWith("--shots=")) || "").slice(8) || null;
const url = f => pathToFileURL(path.join(ROOT, f)).href;

const fails = [];
const bad = (where, msg) => fails.push(where + ": " + msg);

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROME || undefined,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"]
  });
  const ctx = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 });
  /* доступ к сцене и камере (проверка кадра и щипка): _frame.js, HOOK */
  await ctx.addInitScript(HOOK);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
  page.on("pageerror", e => errors.push(String(e).slice(0, 200)));
  const cdp = await ctx.newCDPSession(page);
  if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });

  /* кнопки: не перекрыты и не ниже 44 px. required — обязательные: нет на странице
     или скрыта — отказ; optional — условные: проверяются, только если видны */
  async function buttonsOk(where, required, optional = []) {
    for (const sel of [...required, ...optional]) {
      const el = page.locator(sel);
      if (!(await el.count()) || !(await el.first().isVisible())) {
        if (required.includes(sel)) bad(where, sel + (await el.count() ? " скрыта" : " — нет на странице") + " (обязательная кнопка)");
        continue;
      }
      await el.first().scrollIntoViewIfNeeded();
      const r = await el.first().evaluate(b => {
        const q = b.getBoundingClientRect();
        const top = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2);
        return { h: q.height, covered: !(top && (top === b || b.contains(top))), by: top ? (top.id || top.className || top.tagName) : "(нет)" };
      });
      if (r.covered) bad(where, sel + " перекрыта элементом " + r.by);
      if (r.h < 44 - 0.5) bad(where, sel + " высотой " + r.h.toFixed(1) + " px (< 44)");
    }
  }

  /* ---------- хаб ---------- */
  await page.goto(url("index.html"));
  await page.waitForTimeout(600);
  await page.evaluate(() => localStorage.clear());
  await page.reload(); await page.waitForTimeout(600);
  {
    const m = await page.evaluate(() => ({
      over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      back: !!document.querySelector('a[href="../../index.html"]'),
      cards: document.querySelectorAll(".card").length
    }));
    if (m.over > 0) bad("хаб", "горизонтальная прокрутка " + m.over + " px");
    if (!m.back) bad("хаб", "нет ссылки назад в курс (../../index.html)");
    if (m.cards !== 11) bad("хаб", "карточек " + m.cards + ", ждали 11 (10 тем + марафон)");
    await buttonsOk("хаб", ["#sendProgressMail", ".hub-back"]);   /* обе обязательные */
    if (shotsDir) await page.screenshot({ path: path.join(shotsDir, "hub-360.png"), fullPage: true });
  }

  /* ---------- выборка задач ---------- */
  await page.goto(url("trainer.html"));
  await page.waitForTimeout(800);
  const all = await page.evaluate(() => PROBLEMS.map((p, i) => ({ i, id: p.id, ans: p.ans, old: /^\d+$/.test(p.id) })));
  const pickEven = arr => { const out = []; for (let k = 0; k < N && k < arr.length; k++) out.push(arr[Math.floor(k * arr.length / N)]); return out; };
  const sample = [...pickEven(all.filter(p => p.old)), ...pickEven(all.filter(p => !p.old))];
  console.log("выборка:", sample.map(p => p.id).join(" "));

  let okCount = 0;
  for (const p of sample) {
    const before = errors.length, failsBefore = fails.length;
    await page.evaluate(i => { localStorage.setItem("stereo3.last.all", String(i)); }, p.i);
    await page.goto(url("trainer.html"));
    await page.waitForTimeout(900);
    const shown = await page.evaluate(() => document.getElementById("probMeta").textContent);
    if (!shown.includes("№ " + p.id)) { bad(p.id, "открылась не та задача: " + shown); continue; }

    const m = await page.evaluate(() => {
      const cv = document.querySelector("#viewport canvas");
      return {
        over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        taCanvas: cv ? getComputedStyle(cv).touchAction : "(нет холста)",
        taBox: getComputedStyle(document.getElementById("viewport")).touchAction
      };
    });
    if (m.over > 0) bad(p.id, "горизонтальная прокрутка " + m.over + " px");
    if (m.taCanvas !== "none") bad(p.id, "touch-action холста: " + m.taCanvas);
    if (m.taBox !== "none") bad(p.id, "touch-action #viewport: " + m.taBox);

    /* кадр при открытии на 360 px: тело и подписи целиком на холсте, а легенда
       не поверх холста (на узком экране она под ним) */
    {
      const fr = await page.evaluate(FRAME);
      if (!fr) bad(p.id, "камера тренажёра недоступна тесту (обёртка WebGLRenderer не сработала)");
      else if (fr.ext > 1) bad(p.id, "чертёж не в кадре: тела " + fr.geo.toFixed(3) + ", подписи " + fr.lab.toFixed(3) + " (≤ 1 — на холсте), r = " + fr.r.toFixed(2));
      const lg = await page.evaluate(() => {
        const a = document.querySelector("#viewport canvas").getBoundingClientRect(), b = document.querySelector(".legend").getBoundingClientRect();
        return b.top < a.bottom - 0.5 && b.bottom > a.top + 0.5;
      });
      if (lg) bad(p.id, "легенда лежит поверх холста — закрывает нижние вершины");
    }

    /* протяжка пальцем по чертежу */
    await page.locator("#viewport").scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const box = await page.locator("#viewport").boundingBox();
    await page.evaluate(() => {
      const cv = document.querySelector("#viewport canvas");
      window.__tt = { move: 0, cancel: 0 };
      cv.addEventListener("pointermove", e => { if (e.pointerType === "touch") window.__tt.move++; });
      cv.addEventListener("pointercancel", () => { window.__tt.cancel++; });
    });
    const shot0 = await page.locator("#viewport").screenshot();
    const y0 = await page.evaluate(() => window.scrollY);
    const cx = box.x + box.width * 0.5, cy = box.y + box.height * 0.45;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx - 60, y: cy }] });
    for (let k = 1; k <= 12; k++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx - 60 + k * 10, y: cy + k * 3 }] });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(250);
    const shot1 = await page.locator("#viewport").screenshot();
    const y1 = await page.evaluate(() => window.scrollY);
    const tt = await page.evaluate(() => window.__tt);
    if (!tt.move) bad(p.id, "касание не дошло до холста (pointermove 0)");
    if (tt.cancel) bad(p.id, "касание отменено браузером (pointercancel " + tt.cancel + ")");
    if (Buffer.compare(shot0, shot1) === 0) bad(p.id, "после протяжки пальцем кадр не изменился — сцена не вращается");
    if (y1 !== y0) bad(p.id, "протяжка по чертежу прокрутила страницу (" + y0 + " → " + y1 + ")");

    /* щипок двумя пальцами, симметрично от центра чертежа: масштаб меняется,
       углы обзора — нет; отпускание не выбирает линию */
    {
      const cam = () => page.evaluate(() => {
        const c = window.__stereoCap && window.__stereoCap.c; if (!c) return null;
        const q = c.position, r = Math.hypot(q.x, q.y, q.z);
        return { r, th: Math.atan2(q.x, q.z), ph: Math.acos(q.y / r) };
      });
      await page.locator("#viewport").scrollIntoViewIfNeeded();
      const vb = await page.locator("#viewport").boundingBox();
      const mx = vb.x + vb.width / 2, my = vb.y + vb.height / 2;
      const c0 = await cam();
      const two = d => [{ x: mx - d, y: my, id: 1 }, { x: mx + d, y: my, id: 2 }];
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: two(30) });
      for (let k = 1; k <= 8; k++) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: two(30 + k * 8) });
        await page.waitForTimeout(16);
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForTimeout(200);
      const c1 = await cam();
      if (!c0 || !c1) bad(p.id, "камера тренажёра недоступна тесту (обёртка WebGLRenderer не сработала)");
      else {
        const dA = Math.max(Math.abs(c1.th - c0.th), Math.abs(c1.ph - c0.ph));
        if (dA > 1e-6) bad(p.id, "щипок повернул чертёж: углы обзора сдвинулись на " + dA.toFixed(4) + " рад");
        if (!(c1.r < c0.r - 1e-6)) bad(p.id, "щипок (пальцы врозь) не приблизил чертёж: r " + c0.r.toFixed(3) + " → " + c1.r.toFixed(3));
      }
      const picked = await page.evaluate(() => document.getElementById("measures").style.display !== "none" ||
        document.getElementById("pendingHint").style.display !== "none");
      if (picked) bad(p.id, "после щипка выбран отрезок или точка — отпускание пальцев сработало как клик");
      await page.click("#btnHome");
    }

    /* кнопки */
    await buttonsOk(p.id,
      ["#navToggle", "#btnCheck", "#btnHint", "#btnSolution", "#btnPrev", "#btnNext", "#btnRotate", "#btnHome", "#sendProgressMail"],
      ["#btnConstruct"]);

    /* верный ответ и построение */
    await page.locator("#answer").scrollIntoViewIfNeeded();
    await page.fill("#answer", p.ans);
    await page.tap("#btnCheck");
    await page.waitForTimeout(150);
    const fb = await page.evaluate(() => document.getElementById("feedback").className);
    if (!/\bok\b/.test(fb)) bad(p.id, "верный ответ не принят");
    if (await page.locator("#btnConstruct").isVisible()) { await page.tap("#btnConstruct"); await page.waitForTimeout(500); }
    if (shotsDir) await page.screenshot({ path: path.join(shotsDir, p.id + "-360.png"), fullPage: true });

    if (errors.length > before) bad(p.id, "ошибки консоли: " + errors.slice(before).join(" | "));
    if (fails.length === failsBefore) okCount++;
  }

  /* запись прогресса — как в опубликованной линейке */
  const rec = await page.evaluate(id => (JSON.parse(localStorage.getItem("stereo3.status")) || {})[id], sample[sample.length - 1].id);
  const need = ["st", "revealed", "attempts", "wrong", "topic", "updatedAt"];
  if (!rec || need.some(k => !(k in rec))) bad("прогресс", "запись задачи без полей " + need.filter(k => !rec || !(k in rec)).join(", "));

  /* ---------- выбор линии касанием ----------
     Какие рёбра чьи — по данным задачи (sceneData), независимо от trainer.js:
     solidHidden — ребро настоящего тела, буквы концов не видны (hideLabels);
     solidNamed — ребро настоящего тела с видимыми буквами; ghostHidden —
     ребро призрака без букв. Касание — в точку ребра на экране, далёкую
     от других линий и вершин.
     opt.upper — только верхняя половина чертежа. opt.guard — касание не должно
     задевать ничего, кроме выбора линии: чертёж сначала повёрнут протяжкой
     (вид не «домашний»), и после каждого касания номер задачи тот же,
     автовращение не включилось, камера не сдвинулась (вид не сброшен кнопкой ⌂),
     холст на месте (top ± 1 px), а click браузер не прислал вовсе (эмуляция
     мыши после касания чертежа погашена — trainer.js, touchend). Раньше на 360 px
     выбор линии раскрывал панель измерений над чертежом, холст съезжал вниз
     на ~117 px, и click после касания попадал в то, что оказалось под пальцем:
     ⟳, ⌂, «Назад», «Следующая задача». */
  async function tapEdges(topic, id, cls, max, opt = {}) {
    const i = await page.evaluate(([t, pid]) => PROBLEMS.filter(q => (q.topic || "Параллелепипед") === t).findIndex(q => q.id === pid), [topic, id]);
    if (i < 0) { bad(id, "задачи нет в теме " + topic); return null; }
    await page.evaluate(([t, n]) => localStorage.setItem("stereo3.last." + t, String(n)), [topic, i]);
    await page.goto(url("trainer.html") + "?topic=" + encodeURIComponent(topic));
    await page.waitForTimeout(900);
    const shown = await page.evaluate(() => document.getElementById("probMeta").textContent);
    if (!shown.includes("№ " + id)) { bad(id, "открылась не та задача: " + shown); return null; }
    await page.locator("#viewport").scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const state = () => page.evaluate(() => {
      const c = window.__stereoCap && window.__stereoCap.c;
      return { meta: document.getElementById("probMeta").textContent, rot: document.getElementById("btnRotate").classList.contains("on"),
        cam: c ? c.position.toArray() : null, top: document.querySelector("#viewport canvas").getBoundingClientRect().top,
        clicks: (window.__clk || []).splice(0) };
    });
    let s0 = null;
    if (opt.guard) {
      /* повернуть чертёж протяжкой пальцем: «сброс вида» (⌂) станет заметен */
      const vb = await page.locator("#viewport").boundingBox();
      const cx = vb.x + vb.width / 2, cy = vb.y + vb.height * 0.6;
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: cy }] });
      for (let k = 1; k <= 6; k++) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx + k * 6, y: cy + k * 2 }] });
        await page.waitForTimeout(16);
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForTimeout(250);
      await page.evaluate(() => { window.__clk = []; window.addEventListener("click", e => { if (e.isTrusted) window.__clk.push(e.target.id || String(e.target.className || "") || e.target.tagName); }, true); });
      s0 = await state();
    }
    const pts = await page.evaluate(([pid, want, upper]) => {
      const p = PROBLEMS.find(q => q.id === pid);
      const { gen } = sceneData(p);
      const vis = new Set();
      for (const g of gen) if (!g.anonymous && !g.hideLabels) for (const n of Object.keys(g.pts)) if (n[0] !== "_") vis.add(n);
      const named = n => n[0] === "_" || vis.has(n);
      const kind = {};
      for (const g of gen) for (const [a, b] of g.edges) {
        const k = segKey(a, b);
        if (kind[k] && !(kind[k].startsWith("ghost") && !g.ghost)) continue;
        kind[k] = (g.ghost ? "ghost" : "solid") + (named(a) && named(b) ? "Named" : "Hidden");
      }
      const cap = window.__stereoCap; if (!cap) return null;
      const cv = document.querySelector("#viewport canvas").getBoundingClientRect();
      cap.s.updateMatrixWorld(true);
      const scr = w => { const q = w.clone().project(cap.c); return { x: cv.left + (q.x + 1) / 2 * cv.width, y: cv.top + (1 - q.y) / 2 * cv.height }; };
      const shownObj = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
      /* все видимые линии (концы цилиндра: локальные y = ±0,5) и вершины — на экране */
      const segs = [], verts = [];
      cap.s.traverse(o => {
        if (!o.userData || !shownObj(o)) return;
        if (o.userData.seg) segs.push({ k: o.userData.seg, a: scr(new THREE.Vector3(0, 0.5, 0).applyMatrix4(o.matrixWorld)), b: scr(new THREE.Vector3(0, -0.5, 0).applyMatrix4(o.matrixWorld)) });
        else if (o.userData.vertex) verts.push(scr(o.getWorldPosition(new THREE.Vector3())));
      });
      const dSeg = (p, s) => {
        const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y, L = dx * dx + dy * dy;
        const t = L ? Math.max(0, Math.min(1, ((p.x - s.a.x) * dx + (p.y - s.a.y) * dy) / L)) : 0;
        return Math.hypot(p.x - s.a.x - t * dx, p.y - s.a.y - t * dy);
      };
      /* точка касания на ребре — там, где до чужих линий и вершин на экране
         дальше всего (не ближе 10 px): иначе касание попало бы в соседнюю линию,
         которая на экране проходит через то же место */
      const out = [];
      const yMax = upper ? cv.top + cv.height * 0.5 : cv.bottom - 4;
      for (const s of segs) {
        if (kind[s.k] !== want) continue;
        let best = null;
        for (let t = 0.2; t <= 0.801; t += 0.05) {
          const p = { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t };
          if (!(p.x > cv.left + 4 && p.x < cv.right - 4 && p.y > cv.top + 4 && p.y < yMax)) continue;
          let d = Infinity;
          for (const o of segs) if (o.k !== s.k) d = Math.min(d, dSeg(p, o));
          for (const q of verts) d = Math.min(d, Math.hypot(p.x - q.x, p.y - q.y) - 6);
          if (!best || d > best.d) best = { k: s.k, x: p.x, y: p.y, d };
        }
        if (best && best.d >= 10) out.push(best);
      }
      return out;
    }, [id, cls, !!opt.upper]);
    if (!pts) { bad(id, "камера тренажёра недоступна тесту"); return null; }
    const res = { tapped: 0, picked: 0, labels: [], guard: [], maxShift: 0 };
    for (const q of pts.slice(0, max)) {
      await page.touchscreen.tap(q.x, q.y);
      await page.waitForTimeout(opt.guard ? 450 : 80);   /* click браузера и таймер эмуляции успевают прийти */
      const st = await page.evaluate(() => ({
        on: getComputedStyle(document.getElementById("measures")).display !== "none",
        rows: Array.from(document.querySelectorAll("#measureList .measure-row span")).map(s => s.textContent.trim())
      }));
      res.tapped++;
      if (st.on && st.rows.length) { res.picked++; res.labels.push(...st.rows); }
      if (opt.guard) {
        const s1 = await state();
        const where = q.k + " @" + Math.round(q.x) + "," + Math.round(q.y - s0.top);
        const shift = Math.abs(s1.top - s0.top);
        res.maxShift = Math.max(res.maxShift, shift);
        if (s1.meta !== s0.meta) res.guard.push(where + ": сменилась задача (" + s0.meta.split("·")[1] + "→" + s1.meta.split("·")[1] + ")");
        if (s1.rot) res.guard.push(where + ": включилось автовращение");
        if (!s1.cam || s1.cam.some((v, j) => Math.abs(v - s0.cam[j]) > 1e-6)) res.guard.push(where + ": камера сдвинулась (вид сброшен или вращается)");
        if (shift > 1) res.guard.push(where + ": холст сдвинулся на " + shift.toFixed(1) + " px");
        if (s1.clicks.length) res.guard.push(where + ": после касания пришёл click → " + s1.clicks.join(","));
        if (s1.rot) await page.evaluate(() => document.getElementById("btnRotate").click());
      }
      await page.evaluate(() => document.querySelectorAll("#measureList .measure-del").forEach(b => b.click()));
      await page.waitForTimeout(30);
      if (opt.guard) {
        const s2 = await state();
        const shift = Math.abs(s2.top - s0.top);
        res.maxShift = Math.max(res.maxShift, shift);
        if (shift > 1) res.guard.push(q.k + ": после снятия выделения холст сдвинулся на " + shift.toFixed(1) + " px");
        if (s2.meta !== s0.meta || (s2.cam && s2.cam.some((v, j) => Math.abs(v - s0.cam[j]) > 1e-6))) break;   /* дальше сравнивать не с чем */
      }
    }
    return res;
  }
  {
    const before = errors.length;
    const hid = await tapEdges("Куб", "kub-14", "solidHidden", 6);
    if (hid) {
      if (hid.tapped < 3) bad("kub-14", "в кадре меньше трёх рёбер тела со скрытыми буквами: " + hid.tapped);
      if (hid.picked !== hid.tapped) bad("kub-14", "касание ребра тела со скрытыми буквами не открыло измерение: выбрано " + hid.picked + " из " + hid.tapped);
      const odd = hid.labels.filter(l => !/^ребро = \S/.test(l));
      if (odd.length) bad("kub-14", "в панели не «ребро = …»: " + odd.join(" ; "));
    }
    const gh = await tapEdges("Куб", "27061", "ghostHidden", 12);
    if (gh) {
      if (gh.tapped < 3) bad("27061", "в кадре меньше трёх рёбер призрака: " + gh.tapped);
      if (gh.picked) bad("27061", "касание ребра призрака без букв выбрало линию: " + gh.labels.join(" ; "));
    }
    const ctl = await tapEdges("Куб", "27061", "solidNamed", 4);
    if (ctl) {
      if (ctl.picked !== ctl.tapped || ctl.tapped < 3) bad("27061", "контроль: касание ребра основного куба выбрало " + ctl.picked + " из " + ctl.tapped);
      const odd = ctl.labels.filter(l => !/^[A-Z][₀-₉]*[A-Z][₀-₉]* = /.test(l));
      if (odd.length) bad("27061", "контроль: в панели не имя ребра: " + odd.join(" ; "));
    }
    if (errors.length > before) bad("касание рёбер", "ошибки консоли: " + errors.slice(before).join(" | "));
    console.log("касание рёбер: kub-14 (тело без букв) выбрано " + (hid ? hid.picked + " из " + hid.tapped + " [" + hid.labels.slice(0, 2).join(" ; ") + "]" : "—") +
      "; 27061 призрак выбрано " + (gh ? gh.picked + " из " + gh.tapped : "—") +
      "; 27061 основной куб выбрано " + (ctl ? ctl.picked + " из " + ctl.tapped + " [" + ctl.labels.slice(0, 2).join(" ; ") + "]" : "—"));
  }
  /* касание рёбер в верхней половине чертежа ничего, кроме выбора, не задевает */
  {
    const before = errors.length, out = [];
    for (const [topic, id, cls] of [["Куб", "kub-14", "solidHidden"], ["Параллелепипед", "par-29", "solidHidden"], ["Комбинации тел", "27064", "solidNamed"]]) {
      const r = await tapEdges(topic, id, cls, 8, { upper: true, guard: true });
      if (!r) continue;
      if (r.tapped < 3) bad(id, "в верхней половине чертежа меньше трёх рёбер для касания: " + r.tapped);
      if (!r.picked) bad(id, "касание рёбер в верхней половине чертежа ничего не выбрало — проверка ничего не проверяет");
      r.guard.forEach(g => bad(id, g));
      out.push(id + " " + r.picked + "/" + r.tapped + " (сдвиг холста до " + r.maxShift.toFixed(1) + " px, замечаний " + r.guard.length + ")");
    }
    if (errors.length > before) bad("касание вверху чертежа", "ошибки консоли: " + errors.slice(before).join(" | "));
    console.log("касание вверху чертежа (выбрано/касаний): " + out.join("; "));
  }

  await browser.close();
  console.log("задач чисто:", okCount, "из", sample.length, "(старых " + sample.filter(p => p.old).length + ", новых " + sample.filter(p => !p.old).length + ")");
  if (fails.length) {
    console.log("ПРОБЛЕМЫ (" + fails.length + "):");
    fails.forEach(f => console.log("  - " + f));
    process.exit(1);
  }
  console.log("STEREO_TOUCH_OK");
})();
