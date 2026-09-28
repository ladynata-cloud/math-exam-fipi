#!/usr/bin/env node
/*
  Браузерный гейт OGE_COURSE_03A_GEOMETRY: тренажёры 16, 17, 18, 23, 24, 25
  в Chromium на 360 px с касанием (isMobile, hasTouch).
  Внешние инструменты, ничего не устанавливает:
    PLAYWRIGHT_CORE_PATH=<каталог playwright-core или node_modules с ним>
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<системный Chrome/Chromium>
    node tools/oge-geometry-contract.browser.mjs
  Маркер успеха: OGE_GEOMETRY_BROWSER_OK; при ошибке — список и код 1.

  Сценарии (спецификация 03A, решение F8 делегата владельца):
  - ?selftest=1 печатает <ИМЯ>_SELFTEST_OK, ключ прогресса не создаётся;
  - открытие по http и по file:// без ошибок, без горизонтального вылета;
  - прохождение касаниями: промах, затем верный ответ — задача засчитана
    (solvedByType), промах записан в журнал один раз, помощью не считается;
  - 16: зачёт 10/10 → passed, 5/10 в чистом профиле → не сдан;
  - 18: после верного ответа «Проверить» заблокирована;
  - 23, 16, 25: двойное касание в зачёте засчитывает один ответ и один переход;
  - 24: собрано само — засчитано; две подсветки — «решение показано»;
  - 25: ловушка показывает адресное сообщение; проводка без показа — решено.
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
  { n: 16, file: 'trainers/oge-task16-circle.html', tid: 'oge-task16-circle', name: 'OGE16' },
  { n: 17, file: 'trainers/oge-task17-quadrilaterals.html', tid: 'oge17-chetyrehugolniki', name: 'OGE17' },
  { n: 18, file: 'trainers/oge-task18-grid.html', tid: 'oge18-kletki', name: 'OGE18' },
  { n: 23, file: 'trainers/oge-task23-geometry-calculations.html', tid: 'oge23-vychisleniya', name: 'OGE23' },
  { n: 24, file: 'trainers/oge-task24-proofs.html', tid: 'oge24-dokazatelstva', name: 'OGE24' },
  { n: 25, file: 'trainers/oge-task25-geometry.html', tid: 'oge25-geometriya', name: 'OGE25' },
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
const tap = (page, sel) => page.locator(sel).first().tap();

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
      for (let i = 0; i < 60 && !logs.some(l => /_SELFTEST_(OK|FAIL)/.test(l)); i++) await sleep(250);
      const mk = logs.filter(l => /_SELFTEST_(OK|FAIL)/.test(l));
      ok(mk.length === 1 && mk[0] === t.name + '_SELFTEST_OK', 'A', t.file + ': «' + mk.join(' | ') + '»');
      ok(!errs.length, 'A', t.file + ': ' + errs.slice(0, 2).join(' | '));
      ok((await store(page)) === null, 'A', t.file + ': ключ прогресса создан в режиме самопроверки');
      await ctx.close();
    }
  });

  await run('B. открытие по http и file:// — без ошибок и вылета на 360 px', async () => {
    for (const t of TR) {
      for (const url of [base + t.file, pathToFileURL(path.join(ROOT, t.file)).href]) {
        const ctx = await fresh();
        const { page, errs } = await openPage(ctx, url);
        await sleep(300);
        const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, text: document.body.innerText.length,
          small: [...document.querySelectorAll('button,input,select,a[href]')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height && r.height < 43.5; }).length }));
        ok(!errs.length, 'B', url + ': ' + errs.slice(0, 2).join(' | '));
        ok(m.sw <= 360, 'B', url + ': горизонтальный вылет ' + m.sw + ' px');
        ok(m.text > 200, 'B', url + ': страница пустая');
        ok(m.small === 0, 'B', url + ': элементов ниже 44 px: ' + m.small);
        await ctx.close();
      }
    }
  });

  await run('C16. тренировка: промах, затем верно — засчитано; зачёт 10/10 и 5/10', async () => {
    const t = TR[0];
    let ctx = await fresh(); let { page, errs } = await openPage(ctx, base + t.file);
    await tap(page, '[data-tab=train]'); await page.waitForSelector('#ans');
    const task = await page.evaluate(() => ({ k: trTask.k, ans: trTask.ans }));
    await page.fill('#ans', String(task.ans + 1)); await tap(page, '#check');
    ok((await page.locator('#fb').innerText()).trim().length > 0 && (await page.getAttribute('#fb', 'aria-live')) === 'polite', 'C16', 'сообщение о промахе в aria-live');
    await page.fill('#ans', String(task.ans)); await tap(page, '#check');
    let s = await store(page), r = s && s[t.tid], mk = s && s.mistakes && s.mistakes[t.tid + '|' + task.k];
    ok(r && r.solvedByType[task.k] === 1, 'C16', 'исправленный самостоятельно промах — задача засчитана');
    ok(mk && mk.w === 1 && mk.r === 0, 'C16', 'промах записан в журнал один раз');
    // зачёт 10/10, с двойным касанием «Проверить» на первом вопросе
    await tap(page, '[data-tab=quiz]'); await tap(page, '#qStart');
    for (let i = 0; i < 10; i++) {
      await page.waitForSelector('#qAns');
      const a = await page.evaluate(() => qz.items[qz.i].ans);
      await page.fill('#qAns', String(a));
      await tap(page, '#qCheck'); if (i === 0) { await page.locator('#qCheck').tap({ force: true }).catch(() => {}); ok(await page.evaluate(() => qz.results.length) === 1, 'C16', 'двойное касание «Проверить» — один ответ'); }
      await tap(page, '#qNext');
    }
    s = await store(page); r = s[t.tid];
    ok(r.passed === true && r.best === 10 && r.total === 10, 'C16', 'зачёт 10/10 → passed');
    ok(!errs.length, 'C16', errs.slice(0, 2).join(' | '));
    await ctx.close();
    ({ page, errs } = await openPage(ctx = await fresh(), base + t.file));
    await tap(page, '[data-tab=quiz]'); await tap(page, '#qStart');
    for (let i = 0; i < 10; i++) {
      await page.waitForSelector('#qAns');
      const a = await page.evaluate(() => qz.items[qz.i].ans);
      await page.fill('#qAns', String(i < 5 ? a : a + 7)); await tap(page, '#qCheck'); await tap(page, '#qNext');
    }
    s = await store(page); r = s[t.tid];
    ok(r.passed !== true && r.best === 5 && r.runs === 1, 'C16', 'зачёт 5/10 → не сдан');
    await ctx.close();
  });

  await run('C17. тренировка: промах, затем верно — засчитано', async () => {
    const t = TR[1];
    const ctx = await fresh(); const { page, errs } = await openPage(ctx, base + t.file);
    await tap(page, '[data-tab=train]'); await page.waitForSelector('#ans');
    const task = await page.evaluate(() => ({ k: CUR.key, ans: String(CUR.ans).replace('.', ',') }));
    await page.fill('#ans', '1000'); await tap(page, '#chk');
    ok((await page.getAttribute('#fb', 'aria-live')) === 'polite' && (await page.locator('#fb').innerText()).trim().length > 0, 'C17', 'сообщение о промахе в aria-live');
    await page.fill('#ans', task.ans); await tap(page, '#chk');
    const s = await store(page), r = s[t.tid], mk = s.mistakes && s.mistakes[t.tid + '|' + task.k];
    ok(r.solvedByType[task.k] === 1 && mk && mk.w === 1 && mk.r === 0, 'C17', 'засчитано, промах в журнале один раз');
    ok(!errs.length, 'C17', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await run('C18. тренировка: засчитано, «Проверить» блокируется после верного', async () => {
    const t = TR[2];
    const ctx = await fresh(); const { page, errs } = await openPage(ctx, base + t.file);
    await tap(page, '#tabTrain'); await page.waitForSelector('#ansIn');
    const task = await page.evaluate(() => ({ k: TR.task.sub, ans: TR.task.ans }));
    await page.fill('#ansIn', String(task.ans + 100)); await tap(page, '#chkBtn');
    await page.fill('#ansIn', String(task.ans)); await tap(page, '#chkBtn');
    ok(await page.locator('#chkBtn').isDisabled(), 'C18', '«Проверить» заблокирована после верного ответа');
    const s = await store(page), r = s[t.tid], mk = s.mistakes && s.mistakes[t.tid + '|' + task.k];
    ok(r.solvedByType[task.k] === 1 && mk && mk.w === 1, 'C18', 'засчитано, промах в журнале');
    ok(!errs.length, 'C18', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await run('C23. «Решаю без подсказок»: промах, затем точный ответ; двойное касание в зачёте', async () => {
    const t = TR[3];
    const ctx = await fresh(); const { page, errs } = await openPage(ctx, base + t.file);
    await page.evaluate(() => { const orig = buildTask; buildTask = function (m, task, mode) { window.__t = { task, mode }; return orig.apply(this, arguments); }; });
    await tap(page, '.tab[data-tab=train]');
    await page.locator('button.mt', { hasText: 'Решаю без подсказок' }).tap();
    await page.waitForSelector('.ans-inp');
    const task = await page.evaluate(() => { const q = __t.task, S = SUBS[q.sub]; return { k: q.sub, a: q.sub === 'rhombAng' ? String(S.calc(q.p)) : ansDisplay(q.sub, q.p) }; });
    await page.fill('.ans-inp', '100000'); await page.locator('.btn.primary', { hasText: 'Проверить' }).first().tap();
    await page.fill('.ans-inp', task.a); await page.locator('.btn.primary', { hasText: 'Проверить' }).first().tap();
    const s = await store(page), r = s[t.tid], mk = s.mistakes && s.mistakes[t.tid + '|' + task.k];
    ok(r.solvedByType[task.k] === 1 && mk && mk.w === 1, 'C23', 'засчитано по точному ответу «' + task.a + '», промах в журнале');
    // зачёт: двойное касание «Проверить» — один ответ и один переход
    await tap(page, '.tab[data-tab=quiz]'); await page.locator('button', { hasText: 'Начать зачёт' }).tap();
    await page.waitForSelector('.ans-inp'); await page.fill('.ans-inp', '1');
    const btn = page.locator('.btn.primary', { hasText: 'Проверить' }).first();
    await btn.tap(); await btn.tap({ force: true }).catch(() => {});
    await sleep(1300);
    ok(/Задача 2 из 10/.test(await page.locator('.prog-txt').innerText()), 'C23', 'после двойного касания — задача 2, а не 3');
    ok(!errs.length, 'C23', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await run('C24. сборка доказательства: само — засчитано; две подсветки — «решение показано»', async () => {
    const t = TR[4];
    const ctx = await fresh(); const { page, errs } = await openPage(ctx, base + t.file);
    await page.locator('.tab', { hasText: 'Тренировка' }).tap();
    await page.locator('.mcard').first().tap();
    const place = async (hints) => {
      const id = await page.evaluate(() => curTask().id), n = await page.evaluate(() => curTask().steps.length);
      for (let h = 0; h < hints; h++) await page.locator('button', { hasText: 'Подсказать' }).first().tap();
      for (let i = 0; i < n; i++) await page.locator(`button.card[onclick*="type:'s',i:${i}}"]`).first().tap();
      return id;
    };
    const id1 = await place(0);
    let s = await store(page);
    ok(s[t.tid].solvedByType[id1] === 1, 'C24', 'собрано самостоятельно — засчитано');
    ok(/Верно|шаг/.test(await page.locator('#live').innerText()), 'C24', 'итог выбора озвучен в aria-live');
    await page.locator('button', { hasText: /Следующ/ }).first().tap();
    const id2 = await place(2);
    s = await store(page);
    ok(id2 !== id1 && !s[t.tid].solvedByType[id2], 'C24', 'две подсветки — задача не засчитана как решённая');
    ok(!errs.length, 'C24', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await run('C25. ловушка, частичная диагностика, проводка без показа; двойное касание в зачёте', async () => {
    const t = TR[5];
    const ctx = await fresh(); const { page, errs } = await openPage(ctx, base + t.file);
    await tap(page, '[data-tab=train]'); await page.locator('#panel-train .tcard[data-id="8"]').tap();
    await page.waitForSelector('[data-act=tr-check]');
    const tr = await page.evaluate(() => ({ trap: trS.traps[0].v[0], ans: trS.b.ans.map(a => a.v) }));
    await page.fill('input[data-ai="0"]', String(tr.trap)); await tap(page, '[data-act=tr-check]');
    ok(/Вы нашли AD/.test(await page.locator('#trFb').innerText()) && (await page.getAttribute('#trFb', 'aria-live')) === 'polite', 'C25', 'ловушка: адресное сообщение в aria-live');
    await page.fill('input[data-ai="0"]', String(tr.ans[0])); await tap(page, '[data-act=tr-check]');
    let s = await store(page), mk = s.mistakes && s.mistakes[t.tid + '|8'];
    ok(s[t.tid].solvedByType['8'] === 1 && mk && mk.w === 1, 'C25', 'после ловушки верный ответ засчитан, промах в журнале');
    // проводка: «Шаг за шагом» — явная помощь; все числа ученик — решено
    await page.locator('[data-act=train-pick]').tap(); await page.locator('#panel-train .tcard[data-id="2"]').tap();
    await tap(page, '[data-act=tr-hint]');
    for (let g = 0; g < 30; g++) {
      const st = await page.evaluate(() => { const s = trS.b.steps[trS.gstep]; return { done: trS.done, ask: !!(s.ask && !trS.gres[trS.gstep]), v: s.ask ? s.ask.v : null, next: trS.gstep < gInfo().gT, ans: trS.b.ans.map(a => a.v) }; });
      if (st.done) break;
      if (st.ask) { await page.fill('#gAsk', String(st.v)); await tap(page, '[data-act=g-check]'); }
      else if (st.next) await tap(page, '[data-act=g-next]');
      else { for (let i = 0; i < st.ans.length; i++) await page.fill(`input[data-ai="${i}"]`, String(st.ans[i])); await tap(page, '[data-act=tr-check]'); }
    }
    s = await store(page);
    ok(s[t.tid].solvedByType['2'] === 1, 'C25', 'проводка, все числа ученик — задача решена');
    // зачёт: двойное касание «Ответить» и «Следующая»
    await tap(page, '[data-tab=exam]'); await tap(page, '[data-act=exam-start]');
    const q = await page.evaluate(() => exS.list[0].b.ans.map(a => a.v));
    for (let i = 0; i < q.length; i++) await page.fill(`#panel-exam input[data-ai="${i}"]`, String(q[i]));
    const ab = page.locator('[data-act=exam-answer]');
    await ab.tap(); await ab.tap({ force: true }).catch(() => {});
    ok(await page.evaluate(() => exS.res.filter(Boolean).length) === 1, 'C25', 'двойное касание «Ответить» — один ответ');
    const nb = page.locator('[data-act=exam-next]');
    await nb.tap(); await page.evaluate(() => { const b = document.querySelector('[data-act=exam-next]'); if (b) b.click(); });
    ok(await page.evaluate(() => exS.i) === 1, 'C25', 'повторное «Следующая» без ответа не пропускает задачу');
    ok(!errs.length, 'C25', errs.slice(0, 2).join(' | '));
    await ctx.close();
  });

  await browser.close();
  server.close();
  console.log('\nпроверок: ' + checks + ', провалов: ' + fails);
  if (fails) { failed.slice(0, 60).forEach(f => console.log('  ' + f)); process.exitCode = 1; }
  else console.log('OGE_GEOMETRY_BROWSER_OK');
}
main().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
