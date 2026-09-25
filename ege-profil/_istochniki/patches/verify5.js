/* Поведенческая проверка пяти доработок. */
const { chromium } = require("playwright");
const path = require("path");
/* корень курса: COURSE_ROOT или, по умолчанию, ege-profil/ (patches → _istochniki → ege-profil);
   pathToFileURL — чтобы file://-адрес был верным и на Windows */
const R = require("url").pathToFileURL(process.env.COURSE_ROOT || path.resolve(__dirname, "..", "..")).href.replace(/\/?$/, "/");
const shots = (process.env.SHOTS_DIR || path.join(require("os").tmpdir(), "verify5-shots")) + "/";
require("fs").mkdirSync(shots, { recursive: true });
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? "  ok  " : "  FAIL") + " " + msg); if (!cond) fails++; };

(async () => {
  const b = await chromium.launch({
    executablePath: process.env.PW_CHROME || undefined,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"]
  });

  /* ---------- 1. Вторая попытка в отработке ---------- */
  console.log("1) exam/variant.html — лестница попыток");
  {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    await p.goto(R + "exam/variant.html"); await p.waitForTimeout(700);
    await p.evaluate(() => localStorage.clear());
    await p.reload(); await p.waitForTimeout(700);
    const fb = async () => await p.evaluate(() => ({ cls: document.getElementById("feedback").className, txt: document.getElementById("feedback").textContent.slice(0, 90) }));
    await p.fill("#short-answer", "123456789"); await p.click("#check-short"); await p.waitForTimeout(150);
    let f = await fb();
    ok(/hint/.test(f.cls) && /Попробуйте ещё раз/.test(f.txt), "первая ошибка → «попробуйте ещё раз», без ответа: «" + f.txt.slice(0, 60) + "»");
    ok(await p.evaluate(() => !document.getElementById("short-answer").disabled), "поле ввода не заблокировано");
    await p.fill("#short-answer", "123456789"); await p.click("#check-short"); await p.waitForTimeout(150);
    f = await fb();
    ok(/bad/.test(f.cls) && /Правильный ответ/.test(f.txt), "вторая ошибка → ответ и разбор");
    const attempts = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("profile-ege-course-v1") || "{}"); const pr = s.progress || {}; const k = Object.keys(pr)[0]; return pr[k] ? pr[k].attempts : -1; });
    ok(attempts === 1, "в статистику записана одна попытка, а не две (attempts=" + attempts + ")");
    await p.click("#next"); await p.waitForTimeout(400);
    await p.fill("#short-answer", "123456789"); await p.click("#check-short"); await p.waitForTimeout(150);
    f = await fb();
    ok(/hint/.test(f.cls), "после «Новое задание» лестница снова с первой ступени");
    await p.screenshot({ path: shots + "1-variant-retry.png" });
    await p.close();
  }

  /* ---------- 2. Интервалы на телефоне ---------- */
  console.log("2) interval-method — мобильная шапка и формулы");
  {
    const p = await b.newPage({ viewport: { width: 360, height: 760 } });
    await p.goto(R + "trainers/interval-method.html"); await p.waitForTimeout(2500);
    const m = await p.evaluate(() => {
      const d = document.documentElement;
      const nav = document.querySelector(".navchips");
      const last = nav ? nav.querySelector("a:last-child") : null;
      const before = last ? last.getBoundingClientRect().left : 9999;
      if (nav) nav.scrollLeft = nav.scrollWidth;
      const after = last ? last.getBoundingClientRect().right : 9999;
      return { over: d.scrollWidth - d.clientWidth, navScrollable: nav && nav.scrollWidth > nav.clientWidth + 10, lastReachable: after <= d.clientWidth + 2, mjx: document.querySelectorAll("mjx-container").length };
    });
    ok(m.over <= 2, "нет горизонтальной прокрутки страницы (лишних " + m.over + "px)");
    ok(m.navScrollable, "чипы шапки прокручиваются внутри бара");
    ok(m.lastReachable, "последняя ссылка шапки досягаема прокруткой");
    ok(m.mjx > 100, "формулы отрендерены локальным MathJax (" + m.mjx + ")");
    await p.screenshot({ path: shots + "2-interval-mobile.png" });
    await p.close();
  }

  /* ---------- 3. Неравенства: init жив, якоря работают ---------- */
  console.log("3) inequalities — первый экран и #m8");
  {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [];
    p.on("pageerror", e => errs.push(String(e).slice(0, 90)));
    await p.goto(R + "trainers/inequalities.html"); await p.waitForTimeout(3500);
    ok(errs.length === 0, "ошибок страницы нет (" + (errs[0] || "чисто") + ")");
    const av = await p.evaluate(() => (document.querySelector(".view.active") || {}).id || "(нет)");
    ok(av === "view-home", "домашний экран активен при загрузке: " + av);
    await p.screenshot({ path: shots + "3a-ineq-home.png" });
    await p.evaluate(() => { location.hash = "#m8"; }); await p.waitForTimeout(500);
    const av2 = await p.evaluate(() => (document.querySelector(".view.active") || {}).id || "(нет)");
    const head = await p.evaluate(() => { const v = document.querySelector(".view.active"); const h = v && v.querySelector("h2"); return h ? h.textContent.replace(/\s+/g, " ").trim() : ""; });
    ok(av2 === "view-m8" && /рационализац/i.test(head), "#m8 открывает модуль 9: «" + head.slice(0, 40) + "»");
    await p.screenshot({ path: shots + "3b-ineq-m8.png" });
    const p2 = await b.newPage({ viewport: { width: 1280, height: 800 } });
    await p2.goto(R + "trainers/inequalities.html#m8"); await p2.waitForTimeout(3000);
    const av3 = await p2.evaluate(() => (document.querySelector(".view.active") || {}).id || "(нет)");
    ok(av3 === "view-m8", "прямой заход по ссылке с #m8 тоже работает");
    await p2.close();
    await p.close();
  }

  /* ---------- 4. Финансы: учитель за ключом ---------- */
  console.log("4) finance — режим «Учитель»");
  {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    await p.goto(R + "trainers/finance.html"); await p.waitForTimeout(700);
    await p.evaluate(() => localStorage.clear());
    await p.reload(); await p.waitForTimeout(700);
    const hid = await p.evaluate(() => document.querySelector('#modeSwitch [data-mode="teacher"]').hidden);
    ok(hid === true, "без ключа кнопка «Учитель» скрыта");
    /* сохранённый режим teacher без ключа не восстанавливается */
    await p.evaluate(() => { const k = "mathExamCourseProgress.v1"; const a = JSON.parse(localStorage.getItem(k) || "{}"); a.financeNonstandardTrainer = { mode: "teacher", stats: {} }; localStorage.setItem(k, JSON.stringify(a)); });
    await p.reload(); await p.waitForTimeout(700);
    const act = await p.evaluate(() => (document.querySelector("#modeSwitch button.active") || {}).textContent);
    ok(act !== "Учитель", "сохранённый режим «Учитель» без ключа откатывается в «" + act + "»");
    await p.goto(R + "trainers/finance.html?teacher=1"); await p.waitForTimeout(700);
    const vis = await p.evaluate(() => !document.querySelector('#modeSwitch [data-mode="teacher"]').hidden);
    ok(vis, "с ?teacher=1 кнопка видна");
    await p.click('#modeSwitch [data-mode="teacher"]'); await p.waitForTimeout(300);
    const act2 = await p.evaluate(() => (document.querySelector("#modeSwitch button.active") || {}).textContent);
    ok(act2 === "Учитель", "режим включается");
    await p.goto(R + "trainers/finance.html"); await p.waitForTimeout(700);
    const vis2 = await p.evaluate(() => !document.querySelector('#modeSwitch [data-mode="teacher"]').hidden);
    ok(vis2, "ключ запомнился в браузере (без параметра кнопка осталась)");
    await p.screenshot({ path: shots + "4-finance-teacher.png" });
    await p.close();
  }

  /* ---------- 5. Навигатор: ссылки рационализации ---------- */
  console.log("5) навигатор — прямые ссылки");
  {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    await p.goto(R + "index.html"); await p.waitForTimeout(600);
    const links = await p.evaluate(() => [...document.querySelectorAll('a[href*="inequalities.html#m8"]')].length);
    ok(links === 2, "две ссылки ведут сразу на модуль 9 (" + links + ")");
    await p.close();
  }

  await b.close();
  console.log(fails ? "\nПРОВАЛОВ: " + fails : "\nвсе проверки пройдены");
  process.exit(fails ? 1 : 0);
})();
