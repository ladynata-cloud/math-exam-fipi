/* Прогон тренажёра стереометрии в настоящем Chromium.
   Открывает trainer.html, шагает по всем задачам (или по теме из аргумента),
   собирает ошибки консоли/страницы, жмёт «Построение» там, где оно есть,
   проверяет ввод верного ответа и снимает скриншоты.
   Утечка памяти видеокарты: считаются живые WebGL-буферы и текстуры
   (create… минус delete…). При смене задачи сцена прежней освобождается
   (trainer.js, disposeTree), поэтому после прогона и возврата к первой
   задаче их столько же, сколько было при её открытии (допуск 16 буферов
   и 4 текстуры). Без освобождения к 60-й задаче буферов было 13 тысяч
   против ~230.
   Кадр (1280×800): при открытии задачи тело и подписи целиком на холсте
   (_frame.js, FRAME: ext ≤ 1). До подбора расстояния камеры (trainer.js,
   T.goHome) за край выходили 35 задач из 288.

   node render-test.js [тема] [--shots=папка] [--every=N]                    */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { HOOK, FRAME } = require("./_frame.js");

const ROOT = process.env.STEREO_ROOT ||
  path.resolve(__dirname, "..", "..", "trainers", "stereo");   /* раскладка курса: ege-profil/trainers/stereo */
const topicArg = process.argv.slice(2).find(a => !a.startsWith("--")) || null;
const shotsDir = (process.argv.find(a => a.startsWith("--shots=")) || "").slice(8) || null;
const every = +((process.argv.find(a => a.startsWith("--every=")) || "").slice(8) || 1);

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROME || undefined,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu-sandbox", "--no-sandbox"]
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  /* счётчики живых WebGL-ресурсов */
  await page.addInitScript(() => {
    const live = window.__gl = { buf: 0, tex: 0 };
    for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      if (!C) continue;
      const P = C.prototype, cb = P.createBuffer, db = P.deleteBuffer, ct = P.createTexture, dt = P.deleteTexture;
      P.createBuffer = function () { live.buf++; return cb.apply(this, arguments); };
      P.deleteBuffer = function (b) { if (b) live.buf--; return db.apply(this, arguments); };
      P.createTexture = function () { live.tex++; return ct.apply(this, arguments); };
      P.deleteTexture = function (t) { if (t) live.tex--; return dt.apply(this, arguments); };
    }
  });
  await page.addInitScript(HOOK);   /* сцена и камера — для проверки кадра */
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push("[console] " + m.text().slice(0, 300)); });
  page.on("pageerror", e => errors.push("[page] " + String(e).slice(0, 300)));

  const url = require("url").pathToFileURL(path.join(ROOT, "trainer.html")).href + (topicArg ? "?topic=" + encodeURIComponent(topicArg) : "");
  await page.goto(url);
  await page.waitForTimeout(900);

  const total = await page.evaluate(() => {
    localStorage.clear();
    return typeof PROBLEMS !== "undefined" ? PROBLEMS.length : -1;
  });
  const listLen = await page.evaluate(t => {
    const tf = t;
    const lst = tf ? PROBLEMS.filter(p => (p.topic || "Параллелепипед") === tf) : PROBLEMS;
    return lst.length;
  }, topicArg);
  console.log("PROBLEMS всего:", total, "| в прогоне:", listLen, topicArg ? "(" + topicArg + ")" : "");
  if (listLen <= 0) { console.log("ОШИБКИ:", errors); await browser.close(); process.exit(1); }

  if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });
  let okCount = 0, failIds = [];
  const glMax = { buf: 0, tex: 0 };
  let frameMax = 0;
  const glFirst = await page.evaluate(() => window.__gl ? { ...window.__gl } : null);   /* первая задача, как открылась */

  for (let i = 0; i < listLen; i++) {
    const before = errors.length;
    const info = await page.evaluate(() => {
      const t = document.getElementById("navToggleText").textContent;
      const cond = document.getElementById("probCond").textContent;
      return { t, cond: cond.slice(0, 40) };
    });
    /* кадр при открытии задачи: всё на холсте */
    const fr = await page.evaluate(FRAME);
    if (!fr) failIds.push(info.t + " (камера тренажёра недоступна тесту)");
    else {
      frameMax = Math.max(frameMax, fr.ext);
      if (fr.ext > 1) failIds.push(info.t + " (чертёж не в кадре: выходит на " + ((fr.ext - 1) * 50).toFixed(1) +
        "% ширины/высоты холста; тела " + fr.geo.toFixed(3) + ", подписи " + fr.lab.toFixed(3) + ", r = " + fr.r.toFixed(2) + ")");
    }
    /* построение, если есть */
    const hasConstruct = await page.evaluate(() => document.getElementById("btnConstruct").style.display !== "none");
    if (hasConstruct) { await page.click("#btnConstruct"); await page.waitForTimeout(350); }
    /* верный ответ из данных задачи */
    const okAns = await page.evaluate(t2 => {
      const tf = t2;
      const lst = tf ? PROBLEMS.filter(p => (p.topic || "Параллелепипед") === tf) : PROBLEMS;
      const m = document.getElementById("navToggleText").textContent.match(/Задача (\d+)/);
      const p = lst[+m[1] - 1];
      document.getElementById("answer").value = p.ans;
      document.getElementById("btnCheck").click();
      return document.getElementById("feedback").className.includes("ok");
    }, topicArg);
    if (!okAns) failIds.push(info.t + " (ответ не принят)");
    await page.waitForTimeout(120);
    if (shotsDir && i % every === 0) {
      const id = await page.evaluate(t2 => {
        const tf = t2;
        const lst = tf ? PROBLEMS.filter(p => (p.topic || "Параллелепипед") === tf) : PROBLEMS;
        const m = document.getElementById("navToggleText").textContent.match(/Задача (\d+)/);
        return lst[+m[1] - 1].id;
      }, topicArg);
      await page.locator("#viewport").screenshot({ path: path.join(shotsDir, id + ".png") });
    }
    const newErr = errors.length - before;
    if (newErr) failIds.push(info.t + " (+" + newErr + " ошибок)");
    else okCount++;
    const gl = await page.evaluate(() => window.__gl ? { ...window.__gl } : null);
    if (gl) { glMax.buf = Math.max(glMax.buf, gl.buf); glMax.tex = Math.max(glMax.tex, gl.tex); }
    if (i < listLen - 1) { await page.click("#btnNext"); await page.waitForTimeout(420); }
  }

  console.log("прошло чисто:", okCount, "из", listLen);
  console.log("кадр при открытии: самое крупное — " + frameMax.toFixed(3) + " (≤ 1 — всё на холсте)");

  /* утечка: вернуться к первой задаче — живых ресурсов столько же, сколько при её открытии */
  if (glFirst) {
    await page.click("#navToggle");
    await page.click("#navBody .nav-dot >> nth=0");
    await page.waitForTimeout(400);
    const back = await page.evaluate(() => ({ ...window.__gl }));
    console.log("WebGL живых ресурсов: первая задача при открытии — " + glFirst.buf + " буферов и " + glFirst.tex +
      " текстур; самая тяжёлая сцена прогона — до " + glMax.buf + " и " + glMax.tex + "; снова первая задача — " +
      back.buf + " и " + back.tex);
    if (back.buf > glFirst.buf + 16 || back.tex > glFirst.tex + 4)
      failIds.push("утечка памяти видеокарты: после " + listLen + " задач снова первая задача держит " + back.buf +
        " буферов и " + back.tex + " текстур, а при открытии держала " + glFirst.buf + " и " + glFirst.tex +
        " — сцены прежних задач не освобождаются");
  }
  if (failIds.length) { console.log("ПРОБЛЕМЫ:"); failIds.forEach(f => console.log("  -", f)); }
  if (errors.length) {
    console.log("ошибки (" + errors.length + "), первые 10:");
    [...new Set(errors)].slice(0, 10).forEach(e => console.log("  ", e));
  }
  await browser.close();
  process.exit(failIds.length || errors.length ? 1 : 0);
})();
