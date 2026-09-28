#!/usr/bin/env node
/*
  Браузерный гейт OGE_COURSE_03D_ALGEBRA: тренажёры 7, 8, 9 в Chromium на 360 px
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
  - ?mode=review — задачи только открытого типа, плашка с его именем.
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
    for (const t of TR) {
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
    for (const t of TR) {
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

  await browser.close();
  server.close();
  console.log('\nпроверок: ' + checks + ', провалов: ' + fails);
  if (fails) { failed.slice(0, 60).forEach(f => console.log('  ' + f)); process.exitCode = 1; }
  else console.log('OGE_ALGEBRA_BROWSER_OK');
}
main().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
