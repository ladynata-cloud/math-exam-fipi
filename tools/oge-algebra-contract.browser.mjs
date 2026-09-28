#!/usr/bin/env node
/*
  Браузерный гейт OGE_COURSE_03D_ALGEBRA: тренажёры 7, 8, 9, 10, 11, 12, 14 в Chromium на 360 px
  с касанием (isMobile, hasTouch).
  Внешние инструменты, ничего не устанавливает:
    PLAYWRIGHT_CORE_PATH=<каталог playwright-core или node_modules с ним>
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<системный Chrome/Chromium>
    node tools/oge-algebra-contract.browser.mjs
  Маркер успеха: OGE_ALGEBRA_BROWSER_OK; при ошибке — список и код 1.

  Сценарии (спецификация 03D, решения D1–D10 делегата владельца):
  - ?selftest=1 печатает <ИМЯ>_SELFTEST_OK, ключ прогресса не создаётся;
  - открытие по http и по file:// без ошибок и вылета; на каждой вкладке
    кнопки и поля не ниже 44 px;
  - 7: промах, затем верный вариант — засчитано без пометки помощи; по шагам:
    промах на ступени и самостоятельное исправление — засчитано, подсказка
    сама не открывается; две ошибки в ответе — не засчитано;
  - 8: «Решить по шагам» три раза подряд — «решено» = 1;
  - 9: промах и исправление — засчитано, «без подсказок» не снимается;
    «Решить по шагам» — не помощь, «Подсказка» — помощь;
  - зачёт 10/10 → passed, двойное касание — один ответ;
  - ?mode=review — задачи только открытого типа, плашка с его именем;
  - часть B (решения D15–D53): 10 — ловушка «как будто вернули», исправление засчитано,
    лестница закрывает поле; 11 — «верно 1 из 3» без букв, тот же ответ — не попытка,
    разбор по пунктам, две ошибки — не в счёт, три графика в строку; 12 — строка разбора,
    подстановка в любом порядке сомножителей, подписи без чисел; 14 — «найди свою»,
    «змейка» без вылета; зачёт 10/10 и повтор у всех четырёх; миграция старого ключа и
    сброс только своей ветки с подтверждением на странице.
*/
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = 'mathExamCourseProgress.v1';
let chromium;
try { ({ chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || 'playwright-core')); }
catch { throw new Error('Set PLAYWRIGHT_CORE_PATH to an external playwright-core package; no dependencies are installed by this gate.'); }

const TR = [
  { n: 7, file: 'trainers/oge-task7-number-line.html', tid: 'oge-t7-pryamaya', name: 'OGE7', tabs: '.tab' },
  { n: 8, file: 'trainers/oge-task8-powers-roots.html', tid: 'oge-t8-stepeni', name: 'OGE8', tabs: 'nav.tabs button' },
  { n: 9, file: 'trainers/oge-task9-equations.html', tid: 'oge-t9-uravneniya', name: 'OGE9', tabs: 'nav.tabs .tab' },
  { n: 10, file: 'trainers/oge-task10-probability.html', tid: 'oge-t10-veroyatnost', name: 'OGE10', tabs: 'nav.tabs button' },
  { n: 11, file: 'trainers/oge-task11-graphs-trainer.html', tid: 'oge-t11-grafiki', name: 'OGE11', tabs: '#tabs button' },
  { n: 12, file: 'trainers/oge-task12-formulas-trainer.html', tid: 'oge-t12-formuly', name: 'OGE12', tabs: '#modes button' },
  { n: 14, file: 'trainers/oge-task14-progressions.html', tid: 'oge-t14-progressii', name: 'OGE14', tabs: '#tabs .tab' },
];
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

async function openPage(ctx, url) {
  const page = await ctx.newPage();
  const errs = [], logs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { logs.push(m.text()); if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(url, { waitUntil: 'load' });
  return { page, errs, logs };
}
const store = page => page.evaluate(k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return 'junk'; } }, KEY);
/* кнопки и поля ниже 44 px; ссылка внутри фразы — исключение (размер задан строкой текста) */
const small = page => page.evaluate(() => [...document.querySelectorAll('button,input:not([type=radio]):not([type=checkbox]),select,a[href]')]
  .filter(e => !(e.tagName === 'A' && getComputedStyle(e).display === 'inline' && e.parentElement &&
    e.parentElement.textContent.trim().length > e.textContent.trim().length + 20))
  .filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height && r.height < 43.5; })
  .map(e => (e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().height) + ':' + (e.textContent || '').trim().slice(0, 14)));

async function main() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.BROWSER_EXECUTABLE_PATH;
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const device = { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
  const fresh = () => browser.newContext(device);
  const run = async (title, fn) => {
    const before = fails, t0 = Date.now();
    try { await fn(); } catch (e) { ok(false, title, 'исключение: ' + String(e && e.message || e).split('\n')[0]); }
    console.log((fails === before ? 'ok  ' : 'FAIL') + '  ' + title + '  (' + (Date.now() - t0) + ' мс)');
  };

  await run('A. ?selftest=1: маркер в консоли, ключ не создаётся', async () => {
    for (const t of TR) {
      const ctx = await fresh();
      const { page, errs, logs } = await openPage(ctx, base + t.file + '?selftest=1');
      for (let i = 0; i < 80 && !logs.some(l => /_SELFTEST_(OK|FAIL)/.test(l)); i++) await sleep(250);
      const mk = logs.filter(l => /_SELFTEST_(OK|FAIL)/.test(l));
      ok(mk.length === 1 && mk[0] === t.name + '_SELFTEST_OK', 'A', t.file + ': «' + mk.join(' | ') + '» ' + logs.filter(l => /^  /.test(l)).slice(0, 3).join(' | '));
      ok(!errs.length, 'A', t.file + ': ' + errs.slice(0, 2).join(' | '));
      ok((await store(page)) === null, 'A', t.file + ': ключ прогресса создан в режиме самопроверки');
      await ctx.close();
    }
  });

  await run('B. http и file:// без ошибок и вылета; на каждой вкладке 44 px', async () => {
    for (const t of TR) {
      for (const url of [base + t.file, pathToFileURL(path.join(ROOT, t.file)).href]) {
        const ctx = await fresh();
        const { page, errs } = await openPage(ctx, url);
        await sleep(300);
        const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, text: document.body.innerText.length, y: window.scrollY }));
        ok(!errs.length, 'B', url + ': ' + errs.slice(0, 2).join(' | '));
        ok(m.sw <= 360, 'B', url + ': горизонтальный вылет ' + m.sw + ' px');
        ok(m.text > 200, 'B', url + ': страница пустая');
        ok(m.y === 0, 'B', url + ': страница при загрузке уехала вниз на ' + m.y + ' px');
        const tabs = await page.locator(t.tabs).count();
        for (let i = 0; i < tabs; i++) {
          await page.locator(t.tabs).nth(i).tap(); await sleep(150);
          const s = await small(page), sw = await page.evaluate(() => document.documentElement.scrollWidth);
          ok(!s.length, 'B', url + ' вкладка ' + (i + 1) + ': ниже 44 px — ' + s.slice(0, 4).join(', '));
          ok(sw <= 360, 'B', url + ' вкладка ' + (i + 1) + ': горизонтальный вылет ' + sw + ' px');
        }
        ok(!errs.length, 'B', url + ' после вкладок: ' + errs.slice(0, 2).join(' | '));
        await ctx.close();
      }
    }
  });

  await run('C7. Марафон: промах, затем верно — засчитано без помощи; по шагам; две ошибки — не в счёт', async () => {
    const t = TR[0];
    const ctx = await fresh(); const { page, errs } = await openPage(ctx, base + t.file);
    await page.locator('.tab[data-t=mar]').tap();
    // задача 1: неверный вариант, затем верный
    let q = await page.evaluate(() => ({ key: BANK[marIdx].key, tt: typeOf(BANK[marIdx]), n: BANK[marIdx].opts.length }));
    const wrong = q.key === 1 ? 2 : 1;
    await page.locator('#marTask .optbtn').nth(wrong - 1).tap();
    const msg = page.locator('#marTask > .msg');
    const m1 = (await msg.innerText()).trim();
    ok(m1.length > 20 && !/не то, попробуй/.test(m1) && (await msg.getAttribute('aria-live')) === 'polite', 'C7', 'адресное сообщение в aria-live: «' + m1.slice(0, 60) + '»');
    await page.locator('#marTask .optbtn').nth(q.key - 1).tap();
    let s = await store(page), r = s && s[t.tid], mk = s && s.mistakes && s.mistakes[t.tid + '|' + q.tt];
    ok(r && r.solvedByType[q.tt] === 1, 'C7', 'исправленный самостоятельно промах — задача засчитана');
    ok(mk && mk.w === 1 && mk.r === 0, 'C7', 'промах записан в журнал один раз');
    ok(/решено: 1\b/.test(await page.locator('#marCnt').innerText()) && /с подсказкой: 0/.test(await page.locator('#marCnt').innerText()), 'C7', 'статус «решено», не «с подсказкой»');
    // задача 2: по шагам — промах на ступени, исправление, ни одной подсказки
    await page.locator('#marTask .btn', { hasText: 'Следующая' }).tap();
    q = await page.evaluate(() => ({ key: BANK[marIdx].key, tt: typeOf(BANK[marIdx]), steps: stepsFor(BANK[marIdx], 'school').map(s => ({ type: s.type, ans: s.ans, ans1: s.ans1, ans2: s.ans2, qans: s.qans ? qShow(s.qans) : null, correct: s.correct })) }));
    await page.locator('#marTask .btn', { hasText: 'Решить по шагам' }).tap();
    let missed = false;
    for (let j = 0; j < q.steps.length; j++) {
      const st = q.steps[j], card = page.locator('#marTask .stepcard').nth(j);
      if (st.type === 'choice') { await card.locator('button.choice').nth(st.correct).tap(); continue; }
      const ins = card.locator('input.ans');
      if (!missed) { // один промах на первой числовой ступени
        await ins.nth(0).fill('999'); if (st.type === 'int2') await ins.nth(1).fill('999');
        await card.locator('.btn.primary').tap(); missed = true;
        ok(!(await card.locator('.hintbox').isVisible()), 'C7', 'после ошибки подсказка сама не открылась');
      }
      await ins.nth(0).fill(String(st.qans != null ? st.qans : st.type === 'int' ? st.ans : st.ans1).replace('-', '−'));
      if (st.type === 'int2') await ins.nth(1).fill(String(st.ans2));
      await card.locator('.btn.primary').tap();
    }
    s = await store(page); r = s[t.tid];
    const cnt = await page.locator('#marCnt').innerText();
    ok(r.solvedByType[q.tt] >= 1 && /решено: 2\b/.test(cnt) && /с подсказкой: 0/.test(cnt), 'C7', 'по шагам с исправленной ошибкой — «решено», без пометки помощи: ' + cnt);
    // задача 3: две ошибки в ответе — не засчитана
    await page.locator('#marTask .btn', { hasText: 'Следующая' }).tap();
    q = await page.evaluate(() => ({ key: BANK[marIdx].key, tt: typeOf(BANK[marIdx]) }));
    const before = (await store(page))[t.tid].solvedByType[q.tt] || 0;
    const wr = [1, 2, 3, 4].filter(x => x !== q.key);
    await page.locator('#marTask .optbtn').nth(wr[0] - 1).tap();
    await page.locator('#marTask .optbtn').nth(wr[1] - 1).tap();
    ok(/Две ошибки/.test(await msg.innerText()), 'C7', 'после двух ошибок — строка «Две ошибки…»');
    await page.locator('#marTask .optbtn').nth(q.key - 1).tap();
    ok(((await store(page))[t.tid].solvedByType[q.tt] || 0) === before, 'C7', 'две ошибки — задача в счёт не идёт');
    ok(!errs.length, 'C7', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await run('C8. Марафон: «Решить по шагам» три раза — решено один раз', async () => {
    const t = TR[1];
    const ctx = await fresh(); const { page, errs } = await openPage(ctx, base + t.file);
    await page.locator('nav.tabs button[data-v=mar]').tap();
    const q = await page.evaluate(() => ({ g: typeGroup[BANK[0].type], steps: buildSteps(BANK[0]).map(s => s.ins.map(i => fmtFr(i.val))) }));
    const card = page.locator('#marGrid .mtask').first();
    for (let k = 0; k < 3; k++) {
      await card.locator('button.bs').tap();
      for (let j = 0; j < q.steps.length; j++) {
        const st = card.locator('.msteps .step').nth(j);
        for (let i = 0; i < q.steps[j].length; i++) await st.locator('input.ans').nth(i).fill(q.steps[j][i].replace('−', '-'));
        await st.locator('button.ck').tap();
      }
      await card.locator('button.bs').tap();   // свернуть
    }
    const s = await store(page), r = s[t.tid];
    ok(r && r.solvedByType[q.g] === 1, 'C8', 'solvedByType = 1 после трёх лестниц: ' + (r && r.solvedByType[q.g]));
    ok(/решено задач: 1\b/.test(await page.locator('#scorebar').innerText()), 'C8', 'счётчик «решено задач» = 1');
    // промах в поле ответа — сообщение в aria-live, в журнал один раз
    const c2 = page.locator('#marGrid .mtask').nth(1);
    await c2.locator('input.ans').fill('123456'); await c2.locator('button.ck').tap();
    ok((await c2.locator('.fb').getAttribute('aria-live')) === 'polite' && (await c2.locator('.fb').innerText()).length > 10, 'C8', 'сообщение о промахе в aria-live');
    ok(!errs.length, 'C8', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await run('C9. Марафон: промах и исправление — засчитано; «по шагам» — не помощь; «Подсказка» — помощь', async () => {
    const t = TR[2];
    const ctx = await fresh(); const { page, errs } = await openPage(ctx, base + t.file);
    await page.locator('nav.tabs .tab[data-pane=mara]').tap();
    const ans = await page.evaluate(() => BANK.slice(0, 3).map(t => ({ fam: t.fam, key: decStr(taskKey(t)), wrong: decStr(fadd(taskKey(t), F(1))) })));
    const cards = page.locator('#mara-list .task-card');
    const answer = async (i, v) => { const c = cards.nth(i); await c.locator('.field input.ans').first().fill(v.replace('−', '-')); await c.locator('.btn-row .btn', { hasText: 'Проверить' }).first().tap(); };
    await answer(0, ans[0].wrong);
    ok((await cards.nth(0).locator('.fb').getAttribute('aria-live')) === 'polite', 'C9', 'сообщение в aria-live');
    await answer(0, ans[0].key);
    let s = await store(page), mk = s.mistakes && s.mistakes[t.tid + '|' + ans[0].fam];
    ok(s[t.tid].solvedByType[ans[0].fam] >= 1 && mk && mk.w === 1 && mk.r === 0, 'C9', 'промах и исправление: засчитано, промах в журнале один раз');
    await cards.nth(1).locator('.btn', { hasText: 'Решить по шагам' }).tap();
    await cards.nth(1).locator('.btn', { hasText: 'Свернуть шаги' }).tap();
    await answer(1, ans[1].key);
    ok(/без подсказок: 2/.test(await page.locator('#pane-mara .counters').first().innerText()), 'C9', '«Решить по шагам» не снимает «без подсказок»');
    await cards.nth(2).locator('.btn', { hasText: 'Решить по шагам' }).tap();
    const hb = cards.nth(2).locator('.step .btn', { hasText: 'Подсказка' }).first();
    if (await hb.count()) await hb.tap();
    await answer(2, ans[2].key);
    const cnt = await page.locator('#pane-mara .counters').first().innerText();
    ok(/Решено: 3/.test(cnt) && /без подсказок: 2/.test(cnt), 'C9', '«Подсказка» снимает «без подсказок»: ' + cnt);
    ok(!/Показать ответ/.test(await page.locator('#pane-mara').innerText()), 'C9', 'кнопки «Показать ответ» нет');
    ok(!errs.length, 'C9', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await run('Q. Зачёт 10/10 → passed; двойное касание — один ответ', async () => {
    for (const t of TR.filter(x => x.n <= 9)) {   // часть B — сценарий QB
      const ctx = await fresh(); const { page, errs } = await openPage(ctx, base + t.file);
      if (t.n === 7) {
        await page.evaluate(() => { const o = buildQuiz7; buildQuiz7 = function () { const l = o(); window.__q = l; return l; }; });
        await page.locator('.tab[data-t=quiz]').tap(); await page.locator('#quizBox .btn', { hasText: 'Начать зачёт' }).tap();
        for (let i = 0; i < 10; i++) {
          const key = await page.evaluate(i => window.__q[i].key, i);
          const b = page.locator('#quizBox .optbtn').nth(key - 1);
          await b.tap(); if (i === 0) await b.tap({ force: true }).catch(() => {});
          await page.locator('#quizBox .btn', { hasText: /Дальше|Итоги/ }).tap();
        }
      } else if (t.n === 8) {
        await page.evaluate(() => { const o = buildQuiz8; buildQuiz8 = function () { const l = o(); window.__q = l; return l; }; });
        await page.locator('nav.tabs button[data-v=quiz]').tap(); await page.locator('#quizStart').tap();
        for (let i = 0; i < 10; i++) {
          const a = await page.evaluate(i => fmtFr(quizAns(window.__q[i])), i);
          await page.locator('#qBox input.ans').fill(a.replace('−', '-'));
          const b = page.locator('#qBox .qok'); await b.tap(); if (i === 0) await b.tap({ force: true }).catch(() => {});
          await page.locator('#qBox .qnx').tap();
        }
      } else {
        await page.evaluate(() => { const o = buildQuiz; buildQuiz = function () { const l = o(); window.__q = l; return l; }; });
        await page.locator('nav.tabs .tab[data-pane=quiz]').tap(); await page.locator('#pane-quiz .btn', { hasText: 'Начать зачёт' }).tap();
        for (let i = 0; i < 10; i++) {
          const a = await page.evaluate(i => decStr(taskKey(window.__q[i])), i);
          await page.locator('#pane-quiz input.ans').fill(a.replace('−', '-'));
          const b = page.locator('#pane-quiz .btn', { hasText: 'Ответить' }); await b.tap(); if (i === 0) await b.tap({ force: true }).catch(() => {});
          await page.locator('#pane-quiz .btn', { hasText: /Дальше|Итоги/ }).tap();
        }
      }
      await sleep(200);
      const s = await store(page), r = s && s[t.tid];
      ok(r && r.passed === true && r.best === 10 && r.total === 10 && r.runs === 1, 'Q', t.n + ': 10/10 → passed ' + JSON.stringify(r && { p: r.passed, b: r.best, t: r.total, n: r.runs }));
      ok(!errs.length, 'Q', t.n + ': ' + errs.slice(0, 2).join(' | '));
      await ctx.close();
    }
  });

  await run('R. ?mode=review: задачи только открытого типа, плашка с именем', async () => {
    const OPEN = { 7: ['root/inrange', 'Оценка: корни: какой из корней в отрезке'], 8: ['pow1', 'Степени: одно основание'], 9: ['XF', 'Вида x + a/x = b'] };
    for (const t of TR.filter(x => x.n <= 9)) {   // часть B — сценарий RB
      const ctx = await fresh();
      const [type, name] = OPEN[t.n];
      await ctx.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch (e) {} },
        [KEY, JSON.stringify({ mistakes: { [t.tid + '|' + type]: { w: 1, r: 0, last: 1 } }, other: { x: 1 } })]);
      const { page, errs } = await openPage(ctx, base + t.file + '?mode=review');
      await sleep(300);
      const text = await page.evaluate(() => document.body.innerText);
      ok(text.includes('Работа над ошибками') && text.includes(name), 'R', t.n + ': плашка с именем типа «' + name + '»');
      let got;
      if (t.n === 7) got = await page.evaluate(() => { const r = []; const o = genType; genType = function (tt) { r.push(tt); return o(tt); }; for (let i = 0; i < 12; i++) newStepTask(); genType = o; return r; });
      else if (t.n === 8) got = await page.evaluate(() => { const r = []; for (let i = 0; i < 12; i++) r.push(typeGroup[reviewTask().type]); stepNew(); return r; });
      else got = await page.evaluate(() => { const r = []; const card = [...document.querySelectorAll('#pane-step .card')].pop(); for (let i = 0; i < 12; i++) { renderGenTask({ review: true }, card); r.push(reviewTask().fam); } return r; });
      ok(got.length && got.every(x => x === type), 'R', t.n + ': задачи повтора — только ' + type + ': ' + [...new Set(got)].join(','));
      const s = await store(page);
      ok(s && JSON.stringify(s.other) === '{"x":1}', 'R', t.n + ': чужая ветка цела');
      ok(!errs.length, 'R', t.n + ': ' + errs.slice(0, 2).join(' | '));
      await ctx.close();
    }
  });

  await run('E. пустое поле — не промах (9); выход из повтора (9); две ошибки в номере — «разбор закончен» (7)', async () => {
    { // 9: пустое поле уравнения и невыбранный вариант на ступени — не промах
      const ctx = await fresh(); const { page, errs } = await openPage(ctx, base + TR[2].file);
      await page.locator('nav.tabs .tab[data-pane=step]').tap();
      await page.locator('#pane-step .chip', { hasText: '(x+a)² = (x+b)²' }).tap();
      await page.locator('#step-work .step .btn', { hasText: 'Проверить' }).first().tap();
      await page.locator('#pane-step .chip', { hasText: 'разложено на множители' }).tap();
      await page.locator('#step-work .step .btn', { hasText: 'Проверить' }).first().tap();
      const fb = (await page.locator('#step-work .step .fb').first().innerText()).trim();
      const s = await store(page);
      ok(!s || !s.mistakes || !Object.keys(s.mistakes).length, 'E', '9: пустое поле или невыбранный вариант записаны промахом: ' + JSON.stringify(s && s.mistakes));
      ok(/Выбери вариант|Заполни поле/.test(fb), 'E', '9: подсказка «выбери вариант / заполни поле»: «' + fb + '»');
      ok(!errs.length, 'E', errs.slice(0, 2).join(' | '));
      await ctx.close();
    }
    { // 9: последний открытый тип закрыт — обычный режим с чипсами
      const ctx = await fresh();
      await ctx.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch (e) {} },
        [KEY, JSON.stringify({ mistakes: { 'oge-t9-uravneniya|L': { w: 1, r: 2, last: 1 } } })]);
      const { page, errs } = await openPage(ctx, base + TR[2].file + '?mode=review');
      await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('mathExamCourseProgress.v1')); s.mistakes['oge-t9-uravneniya|L'].r = 3; localStorage.setItem('mathExamCourseProgress.v1', JSON.stringify(s)); });
      await page.locator('#pane-step .btn', { hasText: 'Следующая задача' }).first().tap();
      const chips = await page.locator('#pane-step .chip').count();
      ok(chips >= 10 && /Все ошибки исправлены/.test(await page.locator('#pane-step').innerText()), 'E', '9: после закрытия последнего типа — сообщение и чипсы (' + chips + ')');
      ok(!errs.length, 'E', errs.slice(0, 2).join(' | '));
      await ctx.close();
    }
    { // 7: две ошибки в номере варианта на последней ступени — «Разбор закончен», не «решена»
      const ctx = await fresh(); const { page, errs } = await openPage(ctx, base + TR[0].file);
      await page.locator('.tab[data-t=mar]').tap();
      const q = await page.evaluate(() => ({ key: BANK[marIdx].key, tt: typeOf(BANK[marIdx]), steps: stepsFor(BANK[marIdx], 'school').map(s => ({ type: s.type, ans: s.ans, ans1: s.ans1, ans2: s.ans2, qans: s.qans ? qShow(s.qans) : null, correct: s.correct })) }));
      await page.locator('#marTask .btn', { hasText: 'Решить по шагам' }).tap();
      const wr = [1, 2, 3, 4].filter(x => x !== q.key);
      for (let j = 0; j < q.steps.length; j++) {
        const st = q.steps[j], card = page.locator('#marTask .stepcard').nth(j);
        if (st.type === 'choice') { await card.locator('button.choice').nth(st.correct).tap(); continue; }
        const ins = card.locator('input.ans');
        if (j === q.steps.length - 1) for (const w of wr.slice(0, 2)) { await ins.nth(0).fill(String(w)); await card.locator('.btn.primary').tap(); }
        await ins.nth(0).fill(String(st.qans != null ? st.qans : st.type === 'int' ? st.ans : st.ans1).replace('-', '−'));
        if (st.type === 'int2') await ins.nth(1).fill(String(st.ans2));
        await card.locator('.btn.primary').tap();
      }
      const txt = await page.locator('#marTask').innerText();
      ok(/Разбор закончен/.test(txt) && !/Задача решена/.test(txt), 'E', '7: после двух ошибок в номере — «Разбор закончен», не «Задача решена»');
      const s = await store(page);
      ok(!(s && s[TR[0].tid] && s[TR[0].tid].solvedByType && s[TR[0].tid].solvedByType[q.tt]), 'E', '7: две ошибки в номере — задача в счёт не идёт');
      ok(!errs.length, 'E', errs.slice(0, 2).join(' | '));
      await ctx.close();
    }
  });


  /* ===================== часть B: 10, 11, 12, 14 ===================== */
  const TBn = (n) => TR.find(t => t.n === n);

  await run('C10. Марафон 10: ловушка — адресно; исправление — засчитано; лестница закрывает поле, показ — не в счёт', async () => {
    const t = TBn(10);
    const ctx = await fresh(); const { page, errs } = await openPage(ctx, base + t.file);
    await page.locator('#tabb-mar').tap();
    ok(await page.locator('#mar-root button', { hasText: 'Показать разбор' }).count() === 0, 'C10', 'в Марафоне нет «Показать разбор»');
    await page.evaluate(() => { marFilter = '10.3'; marChips(); marNew(); });
    const q = await page.evaluate(() => { const m = /лежат (\d+) \S+ и (\d+)/.exec(document.querySelector('#mar-root .card').innerText); return { g: +m[1], y: +m[2] }; });
    await page.locator('#mar-root .aw-tog').first().tap();
    await page.locator('#mar-root .aw-n').fill(String(q.g)); await page.locator('#mar-root .aw-d').fill(String(q.g + q.y));
    await page.locator('#mar-root button', { hasText: 'Проверить' }).tap();
    const fb = page.locator('#mar-root .fb').first();
    ok(/вернули в мешочек/.test(await fb.innerText()) && (await fb.getAttribute('aria-live')) === 'polite', 'C10', '10.3: «как будто вернули» в aria-live');
    await page.locator('#mar-root .aw-n').fill(String(q.g - 1)); await page.locator('#mar-root .aw-d').fill(String(q.g + q.y - 1));
    await page.locator('#mar-root button', { hasText: 'Проверить' }).tap();
    let s = await store(page), mk = s.mistakes && s.mistakes[t.tid + '|10_3'];
    ok(s[t.tid].solvedByType['10_3'] === 1 && mk && mk.w === 1 && mk.r === 0, 'C10', 'промах и исправление: засчитано, промах в журнале один раз');
    await page.locator('#mar-root button', { hasText: 'Следующая задача' }).tap();
    await page.evaluate(() => { marFilter = '10.1'; marChips(); marNew(); });
    await page.locator('#mar-root button', { hasText: 'Решить по шагам' }).tap();
    ok(await page.locator('#mar-root .aw-dec').first().isDisabled(), 'C10', 'лестница закрывает главное поле');
    for (let k = 0; k < 3; k++) await page.locator('#mar-root .step .act.show').last().tap();
    s = await store(page);
    ok(!s[t.tid].solvedByType['10_1'] && /в счёт решённых не идёт/.test(await page.locator('#mar-root').innerText()), 'C10', 'показанные шаги — не в счёт');
    ok(!errs.length, 'C10', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await run('C11. ОГЭ-режим 11: «верно 1 из 3» без букв; тот же ответ — не попытка; разбор по пунктам; две ошибки — не в счёт', async () => {
    const t = TBn(11);
    const ctx = await fresh(); const { page, errs } = await openPage(ctx, base + t.file);
    await page.locator('#tabs button[data-m=m4]').tap();
    await page.locator('#m4-chips .btn[data-t=t41]').tap();
    const key = await page.evaluate(() => M4.task.key);
    await page.locator('#m4-answer').fill([key[1], key[0], key[2]].join('')); await page.locator('#m4-check').tap();
    const m1 = await page.locator('#m4-soft').innerText();
    ok(/^Верно 1 из 3\./.test(m1) && !/(^|[^А-Яа-яЁё])[АБВ](\)|\s*→|,|\s)/.test(m1) && (await page.locator('#m4-soft').getAttribute('aria-live')) === 'polite', 'C11', 'сообщение без букв в aria-live: «' + m1.slice(0, 60) + '»');
    await page.locator('#m4-check').tap();
    ok(/Ответ не изменился/.test(await page.locator('#m4-soft').innerText()), 'C11', 'тот же ответ — не попытка');
    await page.locator('#m4-show').tap();
    const r1 = await page.locator('#m4-razbor').innerText();
    ok(/А → /.test(r1) && !/Б → /.test(r1) && !/Ответ:/.test(r1), 'C11', 'разбор открывает один пункт');
    await page.locator('#m4-answer').fill(key.join('')); await page.locator('#m4-check').tap();
    let s = await store(page);
    ok(!s[t.tid].solvedByType.t41, 'C11', 'после показа разбора — не в счёт');
    await page.locator('#m4-next').tap();
    const k2 = await page.evaluate(() => M4.task.key);
    await page.locator('#m4-answer').fill([k2[1], k2[0], k2[2]].join('')); await page.locator('#m4-check').tap();
    await page.locator('#m4-answer').fill([k2[2], k2[1], k2[0]].join('')); await page.locator('#m4-check').tap();
    ok(/Две ошибки — задача в счёт не идёт/.test(await page.locator('#m4-soft').innerText()), 'C11', 'вторая ошибка — строка D2 и признак пары');
    await page.locator('#m4-answer').fill(k2.join('')); await page.locator('#m4-check').tap();
    await page.locator('#m4-next').tap();
    const k3 = await page.evaluate(() => M4.task.key);
    await page.locator('#m4-answer').fill([k3[1], k3[0], k3[2]].join('')); await page.locator('#m4-check').tap();
    await page.locator('#m4-answer').fill(k3.join('')); await page.locator('#m4-check').tap();
    s = await store(page);
    ok(s[t.tid].solvedByType.t41 === 1, 'C11', 'две ошибки — не в счёт, одна ошибка и исправление — засчитано: ' + s[t.tid].solvedByType.t41);
    const rows = await page.evaluate(() => [...document.querySelectorAll('#m4-graphs .gitem')].map(e => Math.round(e.getBoundingClientRect().top)));
    ok(new Set(rows).size === 1, 'C11', 'три графика в одну строку на 360 px');
    ok(!errs.length, 'C11', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await run('C12. 12: исправленная ошибка — засчитано; строка разбора — не в счёт; подстановка 12 · 3 = 3 · 12; подписи без чисел', async () => {
    const t = TBn(12);
    const ctx = await fresh(); const { page, errs } = await openPage(ctx, base + t.file);
    const a1 = await page.evaluate(() => String(cur.answer).replace('.', ','));
    await page.locator('#ansIn').fill('1'); await page.locator('#checkBtn').tap();
    ok((await page.locator('#fb').getAttribute('aria-live')) === 'polite', 'C12', 'сообщение в aria-live');
    await page.locator('#ansIn').fill(a1); await page.locator('#checkBtn').tap();
    let s = await store(page), mk = s.mistakes && s.mistakes[t.tid + '|1'];
    ok(s[t.tid].solvedByType['1'] === 1 && mk && mk.w === 1 && !/не идёт/.test(await page.locator('#fb').innerText()), 'C12', 'исправленная ошибка засчитана без оговорки');
    await page.locator('#nextBtn').tap(); await page.locator('#solBtn').tap();
    ok(await page.evaluate(() => document.querySelectorAll('#sol .line:not([hidden])').length) === 1, 'C12', '«Показать строку» открывает одну строку');
    await page.locator('#ansIn').fill(await page.evaluate(() => String(cur.answer).replace('.', ','))); await page.locator('#checkBtn').tap();
    s = await store(page);
    ok(s[t.tid].solvedByType['1'] === 1, 'C12', 'после показа строки — не в счёт');
    await page.locator('#modes button[data-id=subst]').tap();
    for (let k = 0; k < 60; k++) { if (await page.evaluate(() => /^[^%]*%0 · %1$/.test(cur.subst.tpl) && cur.subst.vals[0] !== cur.subst.vals[1])) break; await page.locator('#nextBtn').tap(); }
    const vals = await page.evaluate(() => cur.subst.vals);
    for (const v of [vals[1], vals[0]]) await page.locator('#chips button[data-v="' + v + '"]:not([disabled])').first().tap();
    await page.locator('#checkBtn').tap();
    ok(/Верно/.test(await page.locator('#fb').innerText()), 'C12', 'подстановка в обратном порядке сомножителей принята');
    await page.locator('#modes button[data-id=find]').tap();
    const labels = await page.evaluate(() => [...document.querySelectorAll('#mc1 button')].map(b => b.innerText));
    ok(labels.length && labels.every(l => !/\d|ищем|спрашива|нужна/.test(l.replace(/^[^—]*—/, ''))), 'C12', '«Найди, что спрашивают»: подписи без чисел ' + labels.join(' | '));
    ok(!errs.length, 'C12', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await run('C14. Марафон 14: «найди свою»; исправление — засчитано; лестница закрывает поле; «змейка» без вылета', async () => {
    const t = TBn(14);
    const ctx = await fresh(); const { page, errs } = await openPage(ctx, base + t.file);
    await page.locator('#tabs .tab[data-page=marathon]').tap();
    ok(await page.locator('#m-task button', { hasText: 'Показать ответ' }).count() === 0, 'C14', 'в Марафоне нет «Показать ответ»');
    await page.evaluate(() => { window.__M.filters.clear(); window.__M.filters.add('gp'); });
    let got = null;
    for (let k = 0; k < 40 && !got; k++) {
      await page.locator('#m-skip').tap();
      got = await page.evaluate(() => { const t = window.__M.task; if (t.code !== 'GP-COMPL') return null; const d = t.distract.find(x => /найди свою/.test(x.hint)); return d && d.v.d === 1n ? { trap: d.v.n.toString(), ans: t.ans.n.toString() } : null; });
    }
    ok(!!got, 'C14', 'нашлась задача GP-COMPL');
    if (got) {
      await page.locator('#m-dec').fill(got.trap); await page.locator('#m-ck').tap();
      ok(/двумя разными ошибками — найди свою/.test(await page.locator('#m-fb').innerText()), 'C14', 'GP-COMPL: сообщение «найди свою»');
      await page.locator('#m-dec').fill(got.ans); await page.locator('#m-ck').tap();
      const s = await store(page), mk = s.mistakes && s.mistakes[t.tid + '|GP-COMPL'];
      ok(s[t.tid].solvedByType['GP-COMPL'] === 1 && mk && mk.w === 1, 'C14', 'промах и исправление: засчитано, промах в журнале');
      await page.locator('#m-next').tap();
    }
    await page.locator('#m-solve').tap();
    ok(await page.locator('#m-dec').isDisabled(), 'C14', 'лестница закрывает главное поле');
    await page.locator('#tabs .tab[data-page=steps]').tap();
    await page.locator('.casebtn[data-code=PIC]').tap();
    for (let k = 0; k < 30; k++) { if (/змейка/.test(await page.locator('#st-task .task-chip').innerText())) break; await page.locator('#st-new').tap(); }
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= 360), 'C14', '«змейка»: страница не шире экрана');
    ok(!errs.length, 'C14', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await run('QB. Зачёт 10, 11, 12, 14: 10/10 → passed; двойное касание — один ответ', async () => {
    for (const n of [10, 11, 12, 14]) {
      const t = TBn(n);
      const ctx = await fresh(); const { page, errs } = await openPage(ctx, base + t.file);
      if (n === 10) {
        await page.evaluate(() => { const o = buildQuiz10; buildQuiz10 = function () { const l = o(); window.__q = l; return l; }; });
        await page.locator('#tabb-quiz').tap(); await page.locator('#quiz-start').tap();
        for (let i = 0; i < 10; i++) {
          const a = await page.evaluate(i => { const t = window.__q[i]; return fToDec(t.needRound ? t.rounded : t.answer); }, i);
          await page.locator('#quiz-root .aw-dec').fill(a.replace('−', '-'));
          const b = page.locator('#quiz-root .act', { hasText: 'Ответить' }); await b.tap(); if (i === 0) await b.tap({ force: true }).catch(() => {});
          await page.locator('#quiz-root .act', { hasText: /Дальше|Итоги/ }).tap();
        }
      } else if (n === 11) {
        await page.evaluate(() => { const o = buildQuiz11; buildQuiz11 = function () { const l = o(); window.__q = l; return l; }; });
        await page.locator('#tabs button[data-m=m6]').tap(); await page.locator('#m6-start').tap();
        for (let i = 0; i < 10; i++) {
          const k = await page.evaluate(i => window.__q[i].key.join(''), i);
          await page.locator('#m6-answer').fill(k);
          const b = page.locator('#m6-ok'); await b.tap(); if (i === 0) await b.tap({ force: true }).catch(() => {});
          await page.locator('#m6-next').tap();
        }
      } else if (n === 12) {
        await page.evaluate(() => { const o = buildQuiz12; buildQuiz12 = function () { const l = o(); window.__q = l; return l; }; });
        await page.locator('#modes button[data-id=diag]').tap();
        for (let i = 0; i < 10; i++) {
          const a = await page.evaluate(i => String(window.__q[i].answer).replace('.', ','), i);
          await page.locator('#ansIn').fill(a);
          const b = page.locator('#checkBtn'); await b.tap(); if (i === 0) await b.tap({ force: true }).catch(() => {});
          await page.locator('#qNext').tap();
        }
      } else {
        await page.evaluate(() => { const o = T14.buildQuiz; T14.buildQuiz = function () { const l = o(); window.__q = l; return l; }; });
        await page.locator('#tabs .tab[data-page=quiz]').tap(); await page.locator('#q-start').tap();
        for (let i = 0; i < 10; i++) {
          const a = await page.evaluate(i => T14.fmtN(window.__q[i].ans).replace(/[  ]/g, '').replace('−', '-'), i);
          await page.locator('#q-dec').fill(a);
          const b = page.locator('#q-ok'); await b.tap(); if (i === 0) await b.tap({ force: true }).catch(() => {});
          await page.locator('#q-next').tap();
        }
      }
      await sleep(200);
      const s = await store(page), r = s && s[t.tid];
      ok(r && r.passed === true && r.best === 10 && r.total === 10 && r.runs === 1, 'QB', n + ': 10/10 → passed ' + JSON.stringify(r && { p: r.passed, b: r.best, t: r.total, n: r.runs }));
      const mk = Object.keys((s && s.mistakes) || {}).filter(k => k.startsWith(t.tid + '|'));
      ok(!mk.length, 'QB', n + ': верные ответы зачёта не заводят записей журнала: ' + mk.join(','));
      ok(!errs.length, 'QB', n + ': ' + errs.slice(0, 2).join(' | '));
      await ctx.close();
    }
  });

  await run('RB. ?mode=review 10, 11, 12, 14: задачи только открытого типа, плашка с именем', async () => {
    const OPEN = { 10: ['10_6', 'Дерево вероятностей', () => { const r = []; for (let i = 0; i < 12; i++) r.push(typeOf(reviewTask().code)); return r; }],
      11: ['t44', 'Гиперболы', () => { const r = []; for (let i = 0; i < 12; i++) { m4New(); r.push(M4.task.type); } return r; }],
      12: ['6', 'Корень', () => { const r = []; for (let i = 0; i < 12; i++) { newTask(); r.push(String(cur.t)); } return r; }],
      14: ['TAXI', 'Старт плюс плата за минуту', () => { const r = []; for (let i = 0; i < 12; i++) r.push(T14.reviewCode()); return r; }] };
    for (const n of [10, 11, 12, 14]) {
      const t = TBn(n), [type, name, fn] = OPEN[n];
      const ctx = await fresh();
      await ctx.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch (e) {} },
        [KEY, JSON.stringify({ mistakes: { [t.tid + '|' + type]: { w: 1, r: 0, last: 1 } }, other: { x: 1 } })]);
      const { page, errs } = await openPage(ctx, base + t.file + '?mode=review');
      await sleep(300);
      if (n === 14) await page.waitForSelector('#st-review');
      const text = await page.evaluate(() => document.body.innerText);
      ok(text.includes('Работа над ошибками') && text.includes(name), 'RB', n + ': плашка с именем типа «' + name + '»');
      const got = await page.evaluate(fn);
      ok(got.length && got.every(x => x === type), 'RB', n + ': задачи повтора — только ' + type + ': ' + [...new Set(got)].join(','));
      const s = await store(page);
      ok(s && JSON.stringify(s.other) === '{"x":1}', 'RB', n + ': чужая ветка цела');
      ok(!errs.length, 'RB', n + ': ' + errs.slice(0, 2).join(' | '));
      await ctx.close();
    }
  });

  await run('MB. миграция и сброс с подтверждением на странице (10, 11, 12, 14)', async () => {
    const CASES = {
      10: { old: 'oge10_progress_v1', val: { correct: 3, byType: { '10.1': { correct: 3 } } }, open: async (p) => { await p.locator('#tabb-mar').tap(); await p.locator('#mar-reset').tap(); }, confirm: '#mar-confirm', yes: '#mar-yes' },
      11: { old: 'mathexam_oge11_stats_v1', val: { skills: { oge: { total: 2, first: 1 } }, errors: {} }, open: async (p) => { await p.locator('#tabs button[data-m=m5]').tap(); await p.locator('#m5-reset').tap(); }, confirm: '#m5-confirm', yes: '#m5-yes' },
      12: { old: 'mx-oge12-v1', val: { byType: { 1: { a: 2, c: 2 } }, bestDiag: 9 }, open: async (p) => { await p.locator('#resetBtn').tap(); }, confirm: '#copyArea', yes: '#resetYes' },
      14: { old: 'oge14_progress_v1', val: { totalOk: 2, okByCode: { TAXI: 2 } }, open: async (p) => { await p.locator('#tabs .tab[data-page=marathon]').tap(); await p.locator('#m-reset').tap(); }, confirm: '#m-confirm', yes: '#rs-yes' },
    };
    for (const n of [10, 11, 12, 14]) {
      const t = TBn(n), c = CASES[n];
      const ctx = await fresh();
      await ctx.addInitScript(([k, v, ok2, ov]) => { try { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem(k, v); localStorage.setItem(ok2, ov); } } catch (e) {} },
        [KEY, JSON.stringify({ other: { x: 1 }, mistakes: { 'other|x': { w: 1, r: 0 } } }), c.old, JSON.stringify(c.val)]);
      const { page, errs } = await openPage(ctx, base + t.file);
      await sleep(300);
      let s = await store(page);
      ok(s && s[t.tid] && s[t.tid].migratedFrom === c.old, 'MB', n + ': миграция поставила отметку');
      await c.open(page);
      ok(/Записи других тренажёров курса не тронутся/.test(await page.locator(c.confirm).innerText()), 'MB', n + ': подтверждение сброса на странице');
      await page.locator(c.yes).tap();
      s = await store(page);
      ok(s[t.tid].migratedFrom === c.old && !Object.keys(s[t.tid].solvedByType).length && !s[t.tid].runs && JSON.stringify(s.other) === '{"x":1}' && s.mistakes['other|x'], 'MB', n + ': сброс только своей ветки, отметка миграции осталась');
      await page.reload(); await sleep(300);
      s = await store(page);
      ok(!Object.keys(s[t.tid].solvedByType).length, 'MB', n + ': после сброса старый ключ снова не переносится');
      ok(!errs.length, 'MB', n + ': ' + errs.slice(0, 2).join(' | '));
      await ctx.close();
    }
  });

  await browser.close();
  server.close();
  console.log('\nпроверок: ' + checks + ', провалов: ' + fails);
  if (fails) { failed.slice(0, 60).forEach(f => console.log('  ' + f)); process.exitCode = 1; }
  else console.log('OGE_ALGEBRA_BROWSER_OK');
}
main().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
