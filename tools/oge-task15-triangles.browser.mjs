#!/usr/bin/env node
/*
  Браузерный гейт OGE_COURSE_03B_TASK15: тренажёр задания 15 в Chromium на 360 px
  с касанием (isMobile, hasTouch). Внешние инструменты, ничего не устанавливает:
    PLAYWRIGHT_CORE_PATH=<каталог playwright-core или node_modules с ним>
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<системный Chrome/Chromium>
    node tools/oge-task15-triangles.browser.mjs
  Маркер успеха: OGE_TASK15_BROWSER_OK; при ошибке — список и код 1.

  Сценарии (спецификация 03B, решения делегата владельца D1, D3, D9, F8):
  A. ?selftest=1 печатает OGE_TASK15_SELFTEST_OK, ключ прогресса не создаётся;
  B. http и file:// без ошибок; на всех вкладках нет вылета вбок, цели ≥ 44 px,
     чертёж не выше 40 % экрана;
  C. Разбор: сначала вопрос шага, потом ответ; «Отметить разобранным» пишет отметку;
  D. Тренировка касаниями: ловушка — адресное сообщение и промах в журнал один раз;
     исправленный сам ответ засчитан; лестница, где всё введено самим, — решено,
     «Подсказка» ничего не отнимает; «Показать шаг» — не в счёт; Enter не перелистывает;
     пустой ввод — не промах; неконечная ступень — допуск и точная запись;
  E. Зачёт 10/10 → passed; 5/10 в чистом профиле — не сдан; одна попытка, голый
     вердикт; Enter после ответа не перелистывает; двойное касание — один ответ;
  F. ?mode=review — плашка с именами типов, задачи только открытых типов;
  G. ?seed — одинаковая первая задача; H. печать — навигация уходит; reduced-motion;
  I. «Перейти к заданию» переводит фокус на задание; J. старая страница 15
     перенаправляет на тренажёр.
*/
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = 'mathExamCourseProgress.v1', TID = 'oge-t15-treugolniki';
const FILE = 'trainers/oge-task15-triangles.html';
let chromium;
try { ({ chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || 'playwright-core')); }
catch { throw new Error('Set PLAYWRIGHT_CORE_PATH to an external playwright-core package; no dependencies are installed by this gate.'); }

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  try {
    let file = path.resolve(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
    if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err, buf) => { if (err) { res.writeHead(404).end(); return; } res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' }).end(buf); });
  } catch { res.writeHead(400).end(); }
});

let fails = 0, checks = 0;
const failed = [];
function ok(cond, sec, msg) { checks++; if (!cond) { fails++; failed.push('[' + sec + '] ' + msg); } }
const sleep = ms => new Promise(r => setTimeout(r, ms));
/* после смены экрана тренажёр 400 мс не принимает касания (защита от двойного касания) */
const settle = () => sleep(450);
async function run(title, fn) {
  const before = fails, t0 = Date.now();
  try { await fn(); } catch (e) { ok(false, title, 'исключение: ' + (e && e.message ? e.message.split('\n')[0] : e)); }
  console.log((fails === before ? 'ok  ' : 'FAIL') + '  ' + title + '  (' + (Date.now() - t0) + ' мс)');
}
async function openPage(ctx, url) {
  const page = await ctx.newPage();
  const errs = [], logs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { logs.push(m.text()); if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(url, { waitUntil: 'load' });
  return { page, errs, logs };
}
const store = page => page.evaluate(k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return 'junk'; } }, KEY);
const rec = async page => { const s = await store(page); return (s && s[TID]) || null; };
const jr = async (page, type) => { const s = await store(page); return s && s.mistakes ? s.mistakes[TID + '|' + type] || null : null; };
const tap = (page, sel) => page.locator(sel).first().tap();
const fmt = x => String(Math.round(x * 1e6) / 1e6).replace('.', ',');
const task = page => page.evaluate(() => { const t = window.__oge15.debug().tr.t; return { k: t.k, ans: t.ans, diag: t.diag.map(d => d.v), steps: t.steps.map(s => s.a) }; });
/* элементы ниже 44 px и вылет вбок на текущем экране */
const layout = page => page.evaluate(() => {
  const small = [...document.querySelectorAll('button,input,select,a[href],summary')].filter(e => e.offsetParent !== null)
    .map(e => ({ t: (e.textContent || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 30), h: e.getBoundingClientRect().height })).filter(x => x.h < 44 - 0.5);
  const d = document.querySelector('.diagram svg');
  return { sw: document.documentElement.scrollWidth, small, fig: d ? d.getBoundingClientRect().height / innerHeight : 0 };
});

async function main() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.BROWSER_EXECUTABLE_PATH;
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const device = { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
  const fresh = () => browser.newContext(device);
  const URL15 = base + FILE;

  await run('A. ?selftest=1: маркер, ключ не создаётся', async () => {
    const ctx = await fresh(); const { page, errs, logs } = await openPage(ctx, URL15 + '?selftest=1');
    for (let i = 0; i < 120 && !logs.some(l => /_SELFTEST_/.test(l)); i++) await sleep(250);
    ok(logs.includes('OGE_TASK15_SELFTEST_OK'), 'A', 'маркер: ' + logs.filter(l => /SELFTEST/.test(l)).join(' | '));
    ok(await store(page) === null, 'A', 'в ?selftest=1 создан ключ прогресса');
    ok(!errs.length, 'A', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await run('B. http и file://: ошибок нет, 360 px без вылета, цели 44 px; поле ответа на первом экране у всех типов', async () => {
    for (const url of [URL15 + '?seed=3', pathToFileURL(path.join(ROOT, FILE)).href + '?seed=3']) {
      const ctx = await fresh(); const { page, errs } = await openPage(ctx, url);
      for (const tab of ['razbor', 'train', 'quiz', 'refs']) {
        await tap(page, `.tab[data-tab=${tab}]`);
        if (tab === 'refs') await tap(page, '[data-pin=sum]');
        if (tab === 'razbor') { await tap(page, '.rzcard[data-k=altAlt]'); await tap(page, '#rzNext'); }
        const L = await layout(page);
        ok(L.sw <= 360, 'B', `${tab}: ширина ${L.sw}`);
        ok(!L.small.length, 'B', `${tab}: ниже 44 px — ${JSON.stringify(L.small.slice(0, 3))}`);
        if (tab === 'train') ok(L.fig > 0 && L.fig <= 0.4, 'B', 'чертёж занимает ' + Math.round(L.fig * 100) + '% высоты экрана');
      }
      if (url.startsWith('http')) {
        /* канон: на 360 px чертёж не вытесняет поле ответа за экран — прототип и задача генератора каждого типа */
        const low = [];
        for (const k of await page.evaluate(() => window.__oge15.TYPE_IDS)) {
          for (const proto of [true, false]) {
            await page.evaluate(([k, proto]) => window.__oge15.trainWith(k, proto ? window.__oge15.SUBS[k].proto : null), [k, proto]);
            await page.evaluate(() => window.scrollTo(0, 0));
            const b = await page.locator('#ans').boundingBox();
            if (!b || b.y + b.height > 740) low.push(k + (proto ? '(прототип)' : '') + ': ' + Math.round(b ? b.y + b.height : -1));
          }
        }
        ok(!low.length, 'B', 'поле ответа ниже первого экрана (740 px): ' + low.slice(0, 6).join(', '));
        await tap(page, '.tab[data-tab=quiz]'); await tap(page, '#qStart'); await page.evaluate(() => window.scrollTo(0, 0));
        const qb = await page.locator('#qAns').boundingBox();
        ok(qb && qb.y + qb.height <= 740, 'B', 'поле ответа в зачёте ниже первого экрана: ' + (qb && Math.round(qb.y + qb.height)));
      }
      ok(!errs.length, 'B', url.slice(0, 20) + ': ' + errs.slice(0, 2).join(' | '));
      await ctx.close();
    }
  });

  await run('C. Разбор: вопрос шага, затем ответ; отметка «разобрано»', async () => {
    const ctx = await fresh(); const { page, errs } = await openPage(ctx, URL15);
    await tap(page, '.rzcard[data-k=bisIso]');
    await tap(page, '#rzNext');
    ok(await page.locator('.rzstep').count() === 1 && await page.locator('.rzstep .a').count() === 0, 'C', 'после первого нажатия виден вопрос без ответа');
    await tap(page, '#rzNext');
    ok(await page.locator('.rzstep .a').count() === 1, 'C', 'второе нажатие открывает ответ шага');
    for (let i = 0; i < 20 && await page.locator('#rzNext').count(); i++) await tap(page, '#rzNext');
    ok(/Ответ:/.test(await page.locator('#main').innerText()), 'C', 'в конце разбора — ответ');
    await tap(page, '#rzDone');
    const r = await rec(page);
    ok(r && r.razbor && r.razbor.bisIso === 1, 'C', 'отметка разбора: ' + JSON.stringify(r));
    ok(!r.solvedByType || !r.solvedByType.bisIso, 'C', 'разбор не засчитывает решённую задачу');
    ok(!errs.length, 'C', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await run('D. тренировка касаниями: ловушка, исправление, лестница, «Показать шаг», Enter, вкладки, двойное касание', async () => {
    const ctx = await fresh(); const { page, errs } = await openPage(ctx, URL15 + '?seed=11');
    const TW = async (k, p) => { await page.evaluate(([k, p]) => window.__oge15.trainWith(k, p), [k, p]); await settle(); };
    // D1: пустой ввод; ловушка → адресно, промах один раз; затем верно → засчитано без верного вердикта журнала
    await TW('extAng', { d: 'ext', a: 52, b: 71 });
    let t = await task(page);
    await page.locator('#check').tap();
    ok(/Введите число/.test(await page.locator('#fb').innerText()) && await jr(page, 'extAng') === null, 'D', 'пустой ввод — подсказка о формате, не промах');
    await page.locator('#ans').fill('2√3'); await page.locator('#check').tap();
    ok(/без корня/.test(await page.locator('#fb').innerText()) && await jr(page, 'extAng') === null, 'D', 'корень в ответе — объяснение формы ответа, не промах');
    await page.locator('#ans').fill(fmt(57)); await page.locator('#check').tap();
    ok(/внутренний угол при вершине C/.test(await page.locator('#fb').innerText()), 'D', 'ловушка 57 → адресное сообщение: ' + (await page.locator('#fb').innerText()).slice(0, 80));
    await page.locator('#ans').fill(fmt(128)); await page.locator('#ans').press('Enter');
    let j = await jr(page, 'extAng');
    ok(j && j.w === 1 && j.r === 0, 'D', 'второй промах той же задачи журнал не удваивает: ' + JSON.stringify(j));
    await page.locator('#ans').fill(fmt(t.ans)); await page.locator('#check').tap();
    let r = await rec(page); j = await jr(page, 'extAng');
    ok(r.solvedByType.extAng === 1 && j.w === 1 && j.r === 0, 'D', 'исправленная ошибка засчитана, верного вердикта в журнал нет: ' + JSON.stringify([r.solvedByType, j]));
    ok(/исправили сами/.test(await page.locator('#fb').innerText()), 'D', 'сообщение о самостоятельном исправлении');
    ok(await page.evaluate(() => window.__oge15.debug().streak) === 0, 'D', 'промах обнуляет серию');
    const txt = await page.locator('#taskText').innerText();
    await settle(); await page.keyboard.press('Enter'); await page.keyboard.press('Enter');   // и после защитной паузы
    ok(await page.locator('#taskText').innerText() === txt && /исправили сами/.test(await page.locator('#fb').innerText()), 'D', 'Enter после ответа не перелистывает задачу');
    await tap(page, '.tab[data-tab=refs]'); await tap(page, '.tab[data-tab=train]');
    ok(await page.locator('#next').isVisible() && await page.locator('#ans').isDisabled() && /исправили сами/.test(await page.locator('#fb').innerText()), 'D', 'после смены вкладки итог задачи и «Следующая →» сохранены');
    await tap(page, '.tab[data-tab=train]');
    ok(await page.locator('#next').isVisible(), 'D', 'нажатие на открытую вкладку не сбрасывает задачу');
    await settle(); await page.locator('#next').tap(); await settle();
    ok(await page.locator('#taskText').innerText() !== txt, 'D', '«Следующая →» после смены вкладки открывает новую задачу');
    // D2: чистое решение того же типа → r = 1
    await TW('extAng', { d: 'ext', a: 40, b: 65 });
    t = await task(page);
    await page.locator('#ans').fill(fmt(t.ans)); await page.locator('#check').tap();
    r = await rec(page); j = await jr(page, 'extAng');
    ok(r.solvedByType.extAng === 2 && j.r === 1, 'D', 'чистое решение: +1 и r = 1 — ' + JSON.stringify([r.solvedByType, j]));
    // D3: лестница, всё введено самим, «Подсказка» — засчитано
    await TW('bisIso', { d: 'B', L: 'K', g: 28, f: 0 });
    t = await task(page);
    await tap(page, '#ladBtn');
    ok(await page.locator('#ans').isDisabled(), 'D', '«Решить по шагам» закрывает главное поле');
    ok((await page.locator('.lnote').innerText()).startsWith('Подсказки ничего не отнимают. «Показать шаг» открывает результат ступени'), 'D', 'строка над лестницей D3');
    for (let i = 0; i < t.steps.length; i++) {
      const st = page.locator('.lstep').nth(i);
      if (i === 0) { const hb = st.locator('button.soft'); if (await hb.count()) { await hb.tap(); ok(await st.locator('.hintbox').count() === 1, 'D', 'подсказка открывается'); } }
      await st.locator('input').fill(fmt(t.steps[i])); await st.locator('input').press('Enter');
    }
    r = await rec(page);
    ok(r.solvedByType.bisIso === 1, 'D', 'лестница без показа (с подсказкой) — решено: ' + JSON.stringify(r.solvedByType));
    ok(/Все шаги решены самостоятельно/.test(await page.locator('#after').innerText()) && await page.locator('#next2').count() === 1, 'D', 'итог и «Следующая →» под лестницей');
    // D4: промах на ступени — промах задачи; «Показать шаг» — не в счёт
    await TW('isoApex', { a: 38, f: 0 });
    t = await task(page);
    await tap(page, '#ladBtn');
    await page.locator('.lstep').nth(0).locator('input').fill('13'); await page.locator('.lstep').nth(0).locator('button').first().tap();
    ok(/Пока не сходится: проверьте/.test(await page.locator('.lstep').nth(0).locator('.fb').innerText()), 'D', 'промах на ступени — сообщение «проверьте …»');
    ok((await jr(page, 'isoApex') || {}).w === 1, 'D', 'промах на ступени пишет промах задачи');
    await page.locator('.lstep').nth(0).locator('button.sec').tap();
    for (let i = 1; i < t.steps.length; i++) { const st = page.locator('.lstep').nth(i); await st.locator('input').fill(fmt(t.steps[i])); await st.locator('button').first().tap(); }
    r = await rec(page);
    ok(!r.solvedByType.isoApex && r.train.shown === 1, 'D', '«Показать шаг» — задача не в счёт: ' + JSON.stringify([r.solvedByType, r.train]));
    ok(/Шаг был показан/.test(await page.locator('#after').innerText()), 'D', 'сообщение «Шаг был показан»');
    // D5: неконечная ступень — допуск 0,005 и точная запись
    await TW('rtLegSin', { d: 'leg', p: 8, r: 15, q: 17, k: 2, f: 0 });
    await tap(page, '#ladBtn');
    const s0 = page.locator('.lstep').nth(0);
    ok(/можно обыкновенной дробью/.test(await s0.innerText()), 'D', 'приписка о дроби у неконечной ступени');
    await s0.locator('input').fill('0,47'); await s0.locator('button').first().tap();
    ok(/Верно: точное значение —\s*8\s*17/.test(await s0.locator('.fb').innerText()), 'D', '0,47 при 8/17 — верно с точной записью: ' + (await s0.locator('.fb').innerText()).slice(0, 60));
    // D6: лестница сохраняется при смене вкладки
    await TW('isoBase', { b: 112, ask: 'A', f: 0 });
    await tap(page, '#ladBtn');
    const b0 = page.locator('.lstep').nth(0); await b0.locator('input').fill('68'); await b0.locator('button').first().tap();
    await tap(page, '.tab[data-tab=razbor]'); await tap(page, '.tab[data-tab=train]');
    ok(await page.locator('.lstep').count() === 2 && await page.locator('.lstep.ok').count() === 1 && !(await page.locator('.lstep').nth(1).locator('input').isDisabled()), 'D', 'лестница сохранилась после смены вкладки');
    // D7: промах после «Показать шаг» в журнал не идёт (контракт §4)
    await TW('twoExt', { d: 'C', A: 64, B: 47 });
    await tap(page, '#ladBtn'); await page.locator('.lstep').nth(0).locator('button.sec').tap();
    await page.locator('.lstep').nth(1).locator('input').fill('1'); await page.locator('.lstep').nth(1).locator('button').first().tap();
    ok(await jr(page, 'twoExt') === null, 'D', 'промах после «Показать шаг» в журнал не пишется');
    // D8: двойное касание «Следующая →» не открывает лестницу новой задачи
    await TW('angSum', { a: 48, b: 67, f: 0 });
    await page.locator('#ans').fill('65'); await page.locator('#check').tap(); await settle();
    const nb = await page.locator('#next').boundingBox();
    await page.touchscreen.tap(nb.x + nb.width / 2, nb.y + nb.height / 2); await page.touchscreen.tap(nb.x + nb.width / 2, nb.y + nb.height / 2);
    await sleep(120);
    ok(await page.evaluate(() => { const d = window.__oge15.debug(); return !!d.tr && !d.tr.ladder && !d.tr.done; }) && !(await page.locator('#ans').isDisabled()), 'D', 'двойное касание «Следующая →» не открывает лестницу новой задачи');
    ok(!errs.length, 'D', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await run('E. зачёт: 10/10 → passed; 5/10 — не сдан; одна попытка, Enter, вкладки, двойное касание', async () => {
    for (const good of [10, 5]) {
      const ctx = await fresh(); const { page, errs } = await openPage(ctx, URL15 + '?seed=' + (40 + good));
      await tap(page, '.tab[data-tab=quiz]'); await tap(page, '#qStart'); await settle();
      for (let i = 0; i < 10; i++) {
        const a = await page.evaluate(() => { const d = window.__oge15.debug(); return d.qz.items[d.qz.i].ans; });
        if (i === 0) {
          await page.locator('#qCheck').tap();
          ok(/Введите число/.test(await page.locator('#qFb').innerText()), 'E', 'пустой ответ в зачёте — не вердикт');
          ok(await page.locator('.quizq').innerText() === 'Задача 1 из 10' && !/тип|Тема/.test(await page.locator('#main').innerText().then(s => s.split('\n')[0])), 'E', 'тип задачи в зачёте не показан');
        }
        await page.locator('#qAns').fill(i < good ? fmt(a) : '99999');
        const cb = await page.locator('#qCheck').boundingBox();
        await page.touchscreen.tap(cb.x + cb.width / 2, cb.y + cb.height / 2); await page.touchscreen.tap(cb.x + cb.width / 2, cb.y + cb.height / 2);   // двойное касание — один ответ
        const v = await page.locator('#qFb').innerText();
        ok(v === 'Верно.' || v === 'Неверно.', 'E', 'голый вердикт: «' + v + '»');
        await settle(); await page.keyboard.press('Enter'); await page.keyboard.press('Enter');   // и после защитной паузы
        ok(await page.locator('.quizq').innerText() === `Задача ${i + 1} из 10`, 'E', 'Enter после ответа не перелистывает');
        if (i === 1) {
          await tap(page, '.tab[data-tab=refs]'); await tap(page, '.tab[data-tab=quiz]'); await tap(page, '.tab[data-tab=quiz]');
          ok(await page.locator('#qNext').isVisible() && await page.locator('#qAns').isDisabled() && /^(Верно|Неверно)\.$/.test(await page.locator('#qFb').innerText())
            && await page.locator('.quizq').innerText() === 'Задача 2 из 10', 'E', 'после смены вкладки ответ, вердикт и «Дальше →» сохранены');
        }
        await settle();
        if (i < 9) { await page.locator('#qNext').tap(); await settle(); }
        else {
          const nb = await page.locator('#qNext').boundingBox();
          await page.touchscreen.tap(nb.x + nb.width / 2, nb.y + nb.height / 2); await page.touchscreen.tap(nb.x + nb.width / 2, nb.y + nb.height / 2);
          await sleep(150);
          ok(await page.locator('.fin .score').count() === 1 && await page.evaluate(() => !!window.__oge15.debug().qz), 'E', 'двойное касание «К результатам» не уводит с экрана итогов');
        }
      }
      const r = await rec(page);
      const n = await page.evaluate(() => (window.__oge15.debug().qz || { res: [] }).res.length);
      ok(n === 10, 'E', 'ответов в зачёте ' + n);
      if (good === 10) ok(r && r.passed === true && r.best === 10 && r.total === 10 && r.runs === 1, 'E', '10/10: ' + JSON.stringify(r));
      else {
        ok(r && r.passed !== true && r.best === 5, 'E', '5/10: ' + JSON.stringify(r));
        ok(/Разбор ошибок/.test(await page.locator('#main').innerText()) && /верный ответ/.test(await page.locator('#main').innerText()), 'E', 'в итогах — строки диагностики');
      }
      ok(!errs.length, 'E', errs.slice(0, 2).join(' | '));
      await ctx.close();
    }
  });

  await run('F. ?mode=review: плашка с типами, задачи только открытых типов', async () => {
    const ctx = await fresh();
    const page = await ctx.newPage();
    await page.goto(URL15);
    await page.evaluate(([k, t]) => localStorage.setItem(k, JSON.stringify({ mistakes: { [t + '|midline']: { w: 1, r: 0, last: 1 }, [t + '|regH']: { w: 2, r: 3, last: 1 } } })), [KEY, TID]);
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(URL15 + '?mode=review'); await settle();
    const note = await page.locator('.review-note').innerText();
    ok(/Работа над ошибками/.test(note) && /«Средняя линия»/.test(note) && !/высота/.test(note), 'F', 'плашка: ' + note.slice(0, 120));
    const ks = [];
    for (let i = 0; i < 4; i++) {
      ks.push((await task(page)).k);
      await page.locator('#ans').fill('99999'); await page.locator('#check').tap();
      await page.locator('#ladBtn').tap();
      for (let s = 0; s < 8 && await page.locator('.lstep:not(.ok):not(.shown) .sec').count(); s++) await page.locator('.lstep:not(.ok):not(.shown) .sec').first().tap();
      await settle(); await page.locator('#next2').tap(); await settle();
    }
    ok(ks.every(k => k === 'midline'), 'F', 'типы задач повтора: ' + ks.join(','));
    ok(!errs.length, 'F', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await run('G. ?seed: одинаковые задачи у группы', async () => {
    const first = async (s) => { const ctx = await fresh(); const { page } = await openPage(ctx, URL15 + '?seed=' + s); await tap(page, '.tab[data-tab=train]'); const x = await page.locator('#taskText').innerText(); await ctx.close(); return x; };
    const a = await first(5), b = await first(5), c = await first(6);
    ok(a === b, 'G', '?seed=5 дважды — разные задачи');
    ok(a !== c, 'G', '?seed=5 и ?seed=6 — одна и та же задача');
  });

  await run('H. печать и reduced-motion', async () => {
    const ctx = await fresh(); const { page, errs } = await openPage(ctx, URL15);
    await tap(page, '.tab[data-tab=train]');
    await page.emulateMedia({ media: 'print' });
    const pr = await page.evaluate(() => ({ tabs: getComputedStyle(document.querySelector('.tabs')).display, ctr: getComputedStyle(document.querySelector('.controls')).display, fig: getComputedStyle(document.querySelector('.diagram')).display, task: getComputedStyle(document.querySelector('#taskText')).display }));
    ok(pr.tabs === 'none' && pr.ctr === 'none' && pr.fig !== 'none' && pr.task !== 'none', 'H', 'печать: ' + JSON.stringify(pr));
    await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' });
    await tap(page, '.tab[data-tab=refs]'); await page.locator('.missing .misschip').first().tap();
    ok(await page.locator('.refcard.hot').count() === 1, 'H', 'reduced-motion: переход к карточке справочника');
    ok(!errs.length, 'H', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await run('I. «Перейти к заданию» переводит фокус на задание', async () => {
    const ctx = await fresh(); const { page, errs } = await openPage(ctx, URL15);
    await page.keyboard.press('Tab');
    ok(await page.evaluate(() => document.activeElement && document.activeElement.className) === 'skip', 'I', 'первая цель Tab — ссылка «Перейти к заданию»');
    await page.keyboard.press('Enter'); await sleep(100);
    ok(await page.evaluate(() => document.activeElement && document.activeElement.id) === 'main', 'I', 'после Enter фокус на задании');
    ok(!errs.length, 'I', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await run('J. старая страница задания 15 перенаправляет на тренажёр', async () => {
    const ctx = await fresh(); const page = await ctx.newPage();
    await page.goto(base + 'oge/geometry/task-15-external-angle.html');
    await page.waitForURL(/oge-task15-triangles\.html/, { timeout: 5000 }).catch(() => {});
    ok(/\/trainers\/oge-task15-triangles\.html$/.test(page.url()), 'J', 'адрес после перехода: ' + page.url());
    await ctx.close();
  });

  await browser.close();
  server.close();
  console.log('\nпроверок: ' + checks + ', провалов: ' + fails);
  if (fails) { console.log(failed.slice(0, 40).join('\n')); process.exit(1); }
  console.log('OGE_TASK15_BROWSER_OK');
}
main().catch(e => { console.log('ОШИБКА ГЕЙТА: ' + (e && e.stack || e)); process.exit(1); });
