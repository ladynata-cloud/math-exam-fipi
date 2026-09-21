import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

// External, already installed tooling only. No dependency or browser downloads.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || 'playwright-core');
const evidenceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oge2027-6-10-browser-'));
const evidence = { surfaces: [], errors: [], externalRequests: [], cleanup: [], evidenceDir };
const files = new Map([
  [6, 'oge-task6-fractions.html'], [7, 'oge-task7-number-line.html'],
  [8, 'oge-task8-powers-roots.html'], [9, 'oge-task9-equations.html'], [10, 'oge-task10-probability.html']
]);
const authorId = number => 'oge2027-analogue-1-task-' + String(number).padStart(2, '0');
const label = 'Авторский аналог ОГЭ-2027 · Вариант 1';
const disclaimer = 'Авторский материал MathExam. Не является официальным материалом ФИПИ.';
const foreign = { 'browser-test.foreign-progress': 'retain-exactly', 'mathExamOge2027Analogue1.v2': '{"foreign":true}' };
const { loadTrainerRegistry } = require(path.join(root, 'board-server/trainer-registry.js'));
const registry = loadTrainerRegistry({ baseDir: path.join(root, 'board-server'), env: {} });
assert.equal(registry.loaded, true);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/api/trainer-registry') {
      response.writeHead(200, { 'Content-Type': mime['.json'] }).end(JSON.stringify(registry.publicPayload)); return;
    }
    const file = path.resolve(root, pathname.replace(/^\/+/, '') || 'index.html');
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(file, (error, bytes) => {
      if (error) { response.writeHead(404).end(); return; }
      response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(bytes);
    });
  } catch { response.writeHead(400).end(); }
});
let origin, browser, browserServer, failure, port;
function progress(stage) { console.log(JSON.stringify({ stage, evidenceDir })); }
async function closeStage(name, close, limit = 90000) {
  const start = Date.now(); let timer;
  try {
    await Promise.race([close(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(name + ': cleanup timeout')), limit);
    })]);
  } finally {
    clearTimeout(timer);
    evidence.cleanup.push({ name, start: new Date(start).toISOString(), end: new Date().toISOString(), durationMs: Date.now() - start });
  }
}
function observe(page, name) {
  page.on('pageerror', error => evidence.errors.push(name + ': ' + error.message));
  page.on('console', message => { if (message.type() === 'error') evidence.errors.push(name + ': ' + message.text()); });
  page.on('requestfailed', request => evidence.errors.push(name + ': ' + request.url() + ': ' + request.failure()?.errorText));
  page.on('response', response => { if (response.status() >= 400) evidence.errors.push(name + ': HTTP ' + response.status() + ': ' + response.url()); });
}
async function makeContext(options) {
  const context = await browser.newContext(options);
  context.setDefaultTimeout(12000);
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.protocol === 'file:' || url.origin === origin) return route.continue();
    evidence.externalRequests.push(url.href); return route.abort('blockedbyclient');
  });
  await context.addInitScript(({ foreign, names }) => {
    if (!names.some(name => location.pathname.endsWith('/' + name))) return;
    if (!sessionStorage.getItem('browser-test.seeded')) {
      for (const [key, value] of Object.entries(foreign)) localStorage.setItem(key, value);
      sessionStorage.setItem('browser-test.seeded', 'yes');
      sessionStorage.setItem('browser-test.foreign-session', 'retain-exactly');
    }
    window.browserTestStorageWrites = [];
    for (const method of ['setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (...args) {
        window.browserTestStorageWrites.push({ method, key: args[0], area: this === localStorage ? 'local' : 'session' });
        return original.apply(this, args);
      };
    }
  }, { foreign, names: [...files.values()] });
  return context;
}
async function commonChecks(target, number) {
  const source = target.locator('[data-source-task-id="' + authorId(number) + '"]');
  await source.waitFor({ state: 'visible' });
  const text = await source.innerText();
  assert.ok(text.includes(label)); assert.ok(text.includes(disclaimer));
  assert.equal(await target.locator('[data-author-cohort="oge-2027-analogue-1"]').count(), 1);
  const layout = await target.evaluate(() => ({ client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(layout.scroll <= layout.client + 1 && layout.body <= layout.client + 1, JSON.stringify(layout));
  const state = await target.evaluate(keys => ({ values: Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])),
    session: sessionStorage.getItem('browser-test.foreign-session'), writes: window.browserTestStorageWrites }), Object.keys(foreign));
  assert.deepEqual(state.values, foreign); assert.equal(state.session, 'retain-exactly');
  assert.ok(state.writes.every(write => number === 10 && write.area === 'local' && write.key === 'oge10_progress_v1' && write.method === 'setItem'),
    'Unexpected storage write: ' + JSON.stringify(state.writes));
}

// Trainer-specific flows are kept here so this committed gate is self-contained.
const variant = 'oge-2027-analogue-1';
const authorSelector = `[data-author-cohort="${variant}"]`;

async function storageSnapshot(page) {
  // The composing harness seeds its own foreign sentinel before invoking this flow.
  return page.evaluate(() => ({
    local: Object.fromEntries(Object.entries(localStorage).sort()),
    session: Object.fromEntries(Object.entries(sessionStorage).sort()),
  }));
}
async function noOverflow(page, surface) {
  const geometry = await page.evaluate(() => ({
    width: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(Math.max(geometry.document, geometry.body) <= geometry.width + 1,
    `${surface}: horizontal overflow ${JSON.stringify(geometry)}`);
}
async function focusVisible(page, target, surface) {
  await target.focus();
  await target.press('Shift');
  const focus = await target.evaluate(element => {
    const style = getComputedStyle(element);
    return { active: document.activeElement === element, visible: element.matches(':focus-visible'),
      outline: style.outlineStyle, width: parseFloat(style.outlineWidth), shadow: style.boxShadow };
  });
  assert.equal(focus.active, true, `${surface}: keyboard focus stays on answer`);
  assert.equal(focus.visible, true, `${surface}: keyboard focus-visible`);
  assert.ok((focus.outline !== 'none' && focus.width >= 2) || focus.shadow !== 'none',
    `${surface}: visible focus ring`);
}
async function targets44(page, selector, surface) {
  const controls = await page.locator(selector).evaluateAll(elements => elements
    .filter(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden')
    .map(element => { const r = element.getBoundingClientRect();
      return { name: element.id || element.textContent.trim() || element.getAttribute('aria-label'), width:r.width, height:r.height }; }));
  assert.ok(controls.length >= 3, `${surface}: author controls measured`);
  for (const control of controls) assert.ok(control.width >= 44 && control.height >= 44,
    `${surface}: ${control.name} is ${control.width} x ${control.height}`);
  return controls.length;
}

async function flow6(page, surface = 'task6') {
  const storage = await storageSnapshot(page);
  const sourceId = 'oge2027-analogue-1-task-06';
  const author = page.locator(authorSelector);
  const state = () => page.evaluate(() => ({ cat, pos, streak, order:[...order],
    records:JSON.parse(JSON.stringify(records)), summary:summarizeRecords(order,records) }));
  const answer = async value => { await page.locator('#ans').fill(value); await page.locator('#ans').press('Enter'); };
  const reset = () => page.locator('#restart').click();
  const revisit = () => page.locator('#taskJump').selectOption({ index:0 });

  await page.locator('#chips .chip').filter({ hasText:/^банк заданий 81$/ }).click();
  await reset();
  assert.equal((await state()).order.length, 81, `${surface}: legacy bank unchanged`);
  assert.equal(await page.evaluate(() => TASKS[order[0]].code), '097E41');
  await answer('-0.6');
  assert.equal((await state()).records[0].wrongAttempts, 1);
  await answer('-0,62');
  assert.equal((await state()).records[0].status, 'solved-retry');
  assert.equal((await state()).summary.independent, 1);

  assert.equal(await author.count(), 1, `${surface}: exactly one author selector`);
  assert.ok((await author.innerText()).includes(label));
  await author.click();
  assert.deepEqual((await state()).order, [174]);
  assert.equal((await state()).summary.independent, 0, `${surface}: legacy credit does not enter author cohort`);
  const provenance = page.locator(`[data-source-task-id="${sourceId}"]`);
  assert.equal(await provenance.count(), 1);
  assert.ok((await provenance.innerText()).includes(label));
  assert.ok((await provenance.innerText()).includes(disclaimer));
  assert.equal((await page.locator('.expr').innerText()).replace(/\s+/g,''), '4,8·2,7');
  assert.equal(await page.locator('#taskJump option').count(), 1);
  await targets44(page, '#chips [data-author-cohort], #card button, #card input, #taskJump, #restart', surface);
  await focusVisible(page, page.locator('#ans'), surface);
  await noOverflow(page, surface);

  await answer('12');
  assert.equal((await state()).records[174].wrongAttempts, 1);
  assert.equal((await state()).summary.independent, 0);
  assert.ok((await page.locator('#mark').innerText()).length > 10);
  await answer('12,96');
  assert.equal((await state()).records[174].status, 'solved-retry');
  assert.equal((await state()).summary.independent, 1);
  assert.equal((await state()).pos, 0, `${surface}: Enter checks without advancing`);
  const credit = (await state()).streak;
  await revisit();
  await answer('12.96');
  assert.equal((await state()).summary.independent, 1);
  assert.equal((await state()).streak, credit, `${surface}: repeated answer does not mint credit`);
  assert.equal((await state()).records[174].wrongAttempts, 1);

  for (const value of ['12,96', '12.96', '324/25', '1296/100']) {
    await reset();
    await answer(value);
    assert.equal((await state()).records[174].status, 'solved-first', `${surface}: accepts ${value}`);
    assert.equal((await state()).summary.independent, 1);
  }
  await reset();
  await answer('0');
  await page.locator('#reveal').click();
  assert.equal((await state()).records[174].status, 'revealed');
  assert.equal((await state()).summary.independent, 0);
  assert.ok((await page.locator('#mark').innerText()).includes('12,96'));
  await revisit();
  await answer('12.96');
  assert.equal((await state()).records[174].status, 'revealed', `${surface}: reveal cannot become independent`);
  assert.equal((await state()).records[174].wrongAttempts, 1);
  assert.equal((await state()).summary.independent, 0);

  // Crossing the author boundary preserves both sessions; switching legacy categories keeps its old reset contract.
  await page.locator('#chips .chip').filter({ hasText:/^банк заданий 81$/ }).click();
  assert.equal((await state()).order.length, 81);
  assert.equal((await state()).summary.independent, 1);
  assert.equal((await state()).records[0].status, 'solved-retry');
  assert.equal((await state()).records[0].wrongAttempts, 1);
  assert.equal(await page.locator('[data-source-task-id]').count(), 0);
  await page.locator('#chips .chip').first().click();
  assert.equal((await state()).order.length, 174, `${surface}: all previous tasks retain membership`);
  await page.locator('#chips .chip').filter({ hasText:/^Десятичные дроби 21$/ }).click();
  assert.equal((await state()).order.length, 21);
  await author.click();
  assert.deepEqual((await state()).order, [174]);
  assert.equal((await state()).records[174].status, 'revealed');
  assert.equal((await state()).records[174].wrongAttempts, 1);
  assert.equal((await state()).summary.independent, 0);
  await revisit();
  await answer('12,96');
  assert.equal((await state()).records[174].status, 'revealed', `${surface}: assistance survives cohort switching`);
  await noOverflow(page, surface);
  assert.deepEqual(await storageSnapshot(page), storage, `${surface}: all foreign storage remains untouched`);
  return { task:6, surface, canonicalCount:175, legacyCount:174,
    answers:['12,96','12.96','324/25','1296/100'], assistance:'PASS', credit:'PASS', storage:'PASS' };
}

async function flow9(page, surface = 'task9') {
  const storage = await storageSnapshot(page);
  const sourceId = 'oge2027-analogue-1-task-09';
  const state = () => page.evaluate(() => ({ filter:maraState.filter,
    solved:[...maraState.solved].sort(), clean:[...maraState.clean].sort(),
    author:{...authorMaraProgress} }));
  await page.locator('.tab[data-pane="mara"]').click();
  const filters = page.locator('#pane-mara .filter-row');
  const all = filters.getByRole('button', {name:'Все',exact:true});
  await all.click();
  assert.equal(await page.locator('#mara-list .task-card').count(), 136);
  const legacy = page.locator('#mara-list .task-card').first();
  assert.ok((await legacy.locator('.task-q').innerText()).includes('4x − 4 = 16 + 2x'));
  await legacy.locator('input').fill('10');
  await legacy.locator('input').press('Enter');
  assert.ok((await state()).solved.includes('d91-1'));
  assert.ok((await state()).clean.includes('d91-1'));
  const legacyProgress = { solved:(await state()).solved.filter(id=>id!==sourceId), clean:(await state()).clean.filter(id=>id!==sourceId) };
  const author = page.locator(authorSelector);
  assert.equal(await author.count(), 1);
  assert.equal(await author.innerText(), label);
  await author.click();
  assert.equal(await page.locator('#mara-list .task-card').count(), 1);
  const card = page.locator(`[data-source-task-id="${sourceId}"]`);
  const input = card.locator('input[aria-label="Ответ на авторскую задачу 9"]');
  const answer = async value => { await input.fill(value); await input.press('Enter'); };
  const reset = async () => { await card.getByRole('button',{name:'Начать авторскую задачу заново',exact:true}).click(); };
  const assertLegacy = async () => {
    const current = await state();
    assert.deepEqual({ solved:current.solved.filter(id=>id!==sourceId), clean:current.clean.filter(id=>id!==sourceId) }, legacyProgress,
      `${surface}: author actions preserve every legacy progress ID`);
  };
  assert.equal(await card.count(), 1);
  assert.equal(await card.locator('.src-badge').innerText(), label);
  assert.equal(await card.locator('.author-disclaimer').innerText(), disclaimer);
  assert.ok((await card.locator('.task-q').innerText()).replace(/\s+/g,'').includes('5(x+4)−3(x−2)=12'));
  await reset();
  await targets44(page, `${authorSelector}, .author-task button, .author-task input, .author-task textarea`, surface);
  await focusVisible(page, input, surface);
  await noOverflow(page, surface);

  await answer('7');
  assert.ok((await card.locator('.fb').first().innerText()).includes('знак'));
  assert.equal((await state()).solved.includes(sourceId), false);
  await answer('-7');
  assert.equal((await state()).solved.includes(sourceId), true);
  assert.equal((await state()).clean.includes(sourceId), true);
  const once = await state();
  await answer('−7');
  await answer('-14/2');
  assert.deepEqual(await state(), once, `${surface}: repeats and equivalent numbers cannot mint credit`);
  await assertLegacy();

  await reset();
  await card.getByRole('button',{name:'Показать ответ',exact:true}).click();
  assert.ok((await card.locator('.fb').first().innerText()).includes('−7'));
  assert.equal((await state()).author.helpUsed, true);
  await filters.getByRole('button',{name:'Линейные',exact:true}).click();
  await author.click();
  await answer('−7');
  assert.equal((await state()).solved.includes(sourceId), true);
  assert.equal((await state()).clean.includes(sourceId), false, `${surface}: reveal persists across card re-render`);
  await answer('-7');
  assert.equal((await state()).clean.includes(sourceId), false);
  await assertLegacy();

  await reset();
  await card.getByRole('button',{name:'Решить по шагам',exact:true}).click();
  const values = [['5','20'],['-3','6'],['2','26'],['2','-14'],['-7']];
  for (const [index, row] of values.entries()) {
    const step = card.locator('.step.active');
    assert.equal(await step.count(), 1, `${surface}: one active step ${index+1}`);
    const inputs = step.locator('input');
    assert.equal(await inputs.count(), row.length);
    // Existing step renderer focuses the first field asynchronously. Let that
    // UI transition finish before typing into the next field.
    await page.waitForFunction(() => document.activeElement === document.querySelector('.author-task .step.active input'));
    for(let i=0;i<row.length;i++) await inputs.nth(i).fill(row[i]);
    assert.deepEqual(await inputs.evaluateAll(elements => elements.map(element => element.value)), row);
    await inputs.last().press('Enter');
    assert.equal(await card.locator('.step.done').count(), index+1, `${surface}: step ${index+1} accepted`);
  }
  assert.equal(await card.locator('.step.active').count(), 0);
  assert.equal(await card.locator('.step.done').count(), 5);
  await answer('-7');
  assert.equal((await state()).solved.includes(sourceId), true);
  assert.equal((await state()).clean.includes(sourceId), false, `${surface}: marathon preserves its existing step-help policy`);
  await noOverflow(page, surface);

  await reset();
  await card.getByRole('button',{name:'Решить по шагам',exact:true}).click();
  await card.locator('.step.active').getByRole('button',{name:'Подсказка',exact:true}).click();
  assert.ok((await card.locator('.step.active .fb').innerText()).includes('умножается'));
  await card.locator('.step.active').getByRole('button',{name:'Показать шаг',exact:true}).click();
  assert.equal(await card.locator('.step.shown').count(), 1);
  assert.ok((await card.locator('.step.shown .reveal-box').innerText()).includes('5x + 20'));
  await answer('-7');
  assert.equal((await state()).clean.includes(sourceId), false);
  await targets44(page, `${authorSelector}, .author-task button, .author-task input, .author-task textarea`, surface);
  await noOverflow(page, surface);
  await assertLegacy();

  await reset();
  assert.equal((await state()).solved.includes(sourceId), false);
  assert.equal((await state()).clean.includes(sourceId), false);
  assert.deepEqual((await state()).author, {helpUsed:false, independent:false});
  await assertLegacy();
  assert.deepEqual(await storageSnapshot(page), storage, `${surface}: all foreign storage remains untouched`);
  return { task:9, surface, canonicalCount:136, legacyCount:135, steps:5,
    answers:['-7','−7','-14/2'], assistance:'PASS', credit:'PASS', storage:'PASS' };
}
// Caller owns serving, launch, errors, reload/default/query cases, surfaces, overflow, cleanup.
async function flow10(target,surface){
  const id='oge2027-analogue-1-task-10';
  const label='Авторский аналог ОГЭ-2027 · Вариант 1';
  const storage=()=>storageSnapshot(target);
  const text=locator=>locator.textContent();
  await target.locator('#tabb-mar').click();
  const legacyChip=target.locator('#mar-chips').getByRole('button',{name:'10.1 Равновозможные исходы',exact:true});
  await legacyChip.click();
  const legacyCard=target.locator('#mar-root .card');
  const [total,favorable]=await legacyCard.locator('div[style="margin:6px 0"] b').allTextContents();
  assert(Number(total)>0&&Number(favorable)>0,surface+' legacy problem data');
  await legacyCard.locator('input.aw-dec').fill(String(Number(favorable)/Number(total)));
  await legacyCard.getByRole('button',{name:'Проверить',exact:true}).click();
  assert((await text(legacyCard)).includes('Верно!'),surface+' legacy solve');
  const beforeAuthor=await storage();
  const legacyProgress=await target.evaluate(()=>JSON.stringify(STATS));
  const chip=target.locator('[data-author-cohort="oge-2027-analogue-1"]');
  assert.equal(await chip.count(),1);
  await chip.click();
  const source=target.locator('[data-source-task-id="'+id+'"]');
  assert.equal(await source.count(),1);
  assert((await text(source)).includes(label));
  assert((await text(source)).includes('Авторский материал MathExam. Не является официальным материалом ФИПИ.'));
  const card=target.locator('#mar-root .author-task');
  const reset=()=>target.locator('#mar-reset').click();
  const input=()=>card.locator('input.aw-dec');
  const check=()=>card.getByRole('button',{name:'Проверить',exact:true}).first().click();
  const stats=()=>text(target.locator('#mar-stats'));
  assert((await text(card)).includes('250 маркеров: 35 красных, 45 зелёных и 50 фиолетовых.'));
  assert((await text(card)).includes('Остаток поровну разделён между синими и чёрными.'));
  assert(await input().evaluate(el=>el===document.activeElement),surface+' author input focused');
  const controlSelector='[data-author-cohort],#mar-root .author-task button,#mar-root .author-task input,#mar-reset';
  const measured=await targets44(target,controlSelector,surface);
  const focusTargets=target.locator('[data-author-cohort],#mar-root .author-task button:visible:not(:disabled),#mar-root .author-task input:visible:not(:disabled),#mar-reset');
  for(let i=0;i<await focusTargets.count();i++)await focusVisible(target,focusTargets.nth(i),surface);
  await focusVisible(target,input(),surface);
  await noOverflow(target,surface);
  const feedback=card.locator('span.fb').first();
  assert.equal(await feedback.getAttribute('role'),'status');
  assert.equal(await feedback.getAttribute('aria-live'),'polite');
  for(const [answer,diagnostic] of [
    ['0,14','Учтены только красные маркеры. Чёрные тоже подходят.'],
    ['0.24','Учтены только чёрные маркеры. Красные тоже подходят.'],
    ['0,48','Весь остаток включает и синие маркеры. Нужны красные и чёрные.']
  ]){
    await input().fill(answer);await check();
    const message=await feedback.innerText();
    assert.ok(message.startsWith('Пока неверно'),surface+' wrong-feedback prefix');
    assert.ok(message.includes(diagnostic),surface+' diagnostic for '+answer);
    assert.ok((await stats()).includes('Самостоятельно: 0/1'));
    await noOverflow(target,surface);
  }
  await input().fill('0,38');await input().press('Enter');assert((await stats()).includes('Самостоятельно: 1/1'));
  await card.getByRole('button',{name:'Повторить задачу',exact:true}).click();
  await input().fill('0.38');await check();assert((await stats()).includes('Самостоятельно: 1/1'));
  await reset();
  await card.getByRole('button',{name:'ввести дробью',exact:true}).click();
  await targets44(target,controlSelector,surface+' fraction');
  await focusVisible(target,card.locator('.aw-n'),surface);
  await focusVisible(target,card.locator('.aw-d'),surface);
  await noOverflow(target,surface+' fraction');
  await card.locator('.aw-n').fill('19');await card.locator('.aw-d').fill('50');await card.locator('.aw-d').press('Enter');
  assert((await stats()).includes('Самостоятельно: 1/1'));
  await reset();
  await card.getByRole('button',{name:'Подсказка',exact:true}).click();
  await noOverflow(target,surface+' hint');
  await legacyChip.click();await chip.click();
  await input().fill('0,38');await check();assert((await stats()).includes('Самостоятельно: 0/1'));
  assert((await stats()).includes('С подсказкой или разбором: 1/1'));
  await reset();await card.getByRole('button',{name:'Показать разбор',exact:true}).click();
  assert((await text(card)).includes('120 : 2 = 60'));
  await targets44(target,controlSelector,surface+' reveal');
  await noOverflow(target,surface+' reveal');
  await card.getByRole('button',{name:'Повторить задачу',exact:true}).click();
  await input().fill('0.38');await check();assert((await stats()).includes('Самостоятельно: 0/1'));
  await reset();await card.getByRole('button',{name:'Решить по шагам',exact:true}).click();
  for(const answer of ['120','60','95','0,38']){
    const step=card.locator('.step').last();
    await targets44(target,controlSelector,surface+' step '+answer);
    await focusVisible(target,step.locator('input').first(),surface);
    await noOverflow(target,surface+' step '+answer);
    await step.locator('input').first().fill(answer);
    await step.locator('input').first().press('Enter');
  }
  assert((await stats()).includes('Самостоятельно: 1/1'));
  await noOverflow(target,surface+' all steps');
  await reset();await card.getByRole('button',{name:'Решить по шагам',exact:true}).click();
  await card.locator('.step').last().getByRole('button',{name:'Показать шаг',exact:true}).click();
  await targets44(target,controlSelector,surface+' shown step');
  await noOverflow(target,surface+' shown step');
  await legacyChip.click();await chip.click();
  await input().fill('0,38');await check();assert((await stats()).includes('Самостоятельно: 0/1'));
  assert.deepEqual(await storage(),beforeAuthor,surface+' author flow changes legacy/foreign storage');
  assert.equal(await target.evaluate(()=>JSON.stringify(STATS)),legacyProgress,surface+' author flow changes legacy memory');
  await legacyChip.click();
  assert.equal(await target.locator('[data-source-task-id]').count(),0);
  assert((await text(target.locator('#mar-stats'))).includes('Решено верно:'));
  assert.deepEqual(await storage(),beforeAuthor,surface+' switch changes legacy/foreign storage');
  assert.equal(await target.evaluate(()=>JSON.stringify(STATS)),legacyProgress,surface+' cohort switch changes legacy memory');
  await chip.click();
  await noOverflow(target,surface+' final');
  return {surface,legacy:true,author:true,answer:'0,38',accepted:['0,38','0.38','19/50'],steps:['120','60','95','0,38'],diagnostics:3,controls:measured,keyboardFocus:'PASS',expandedLayout:'PASS',storageUnchanged:true};
}

const cohort=`[data-author-cohort="${variant}"]`;
async function storage(page){return page.evaluate(()=>({local:Object.fromEntries(Object.entries(localStorage).sort()),session:Object.fromEntries(Object.entries(sessionStorage).sort())}));}
async function controls(page,selector,surface){
  const sizes=await page.locator(selector).evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent||e.getAttribute('aria-label'),w:r.width,h:r.height};}));
  assert.ok(sizes.length>=3,`${surface}: author controls present`);
  for(const s of sizes)assert.ok(s.w>=44&&s.h>=44,`${surface}: control ${JSON.stringify(s)}`);
  return sizes.length;
}
async function expandedEvidence(target,number,surface){
  await noOverflow(target,surface+' expanded author state');
  if(surface==='mobile360'){
    const page=typeof target.page==='function'?target.page():target;
    await page.screenshot({path:path.join(evidenceDir,number+'-expanded-mobile360.png'),fullPage:true});
  }
}
async function focus(locator){
  await locator.focus();await locator.press('Shift');
  assert.deepEqual(await locator.evaluate(e=>({active:document.activeElement===e,visible:e.matches(':focus-visible'),ring:getComputedStyle(e).outlineStyle!=='none'&&parseFloat(getComputedStyle(e).outlineWidth)>=2})),{active:true,visible:true,ring:true});
}
async function provenance(page,n){
  assert.equal(await page.locator(cohort).count(),1);
  assert.equal(await page.locator(cohort).innerText(),label);
  const badge=page.locator(`[data-source-task-id="oge2027-analogue-1-task-0${n}"]`);
  assert.equal(await badge.count(),1);assert.ok(await badge.isVisible());
  const text=await badge.innerText();assert.ok(text.includes(label));assert.ok(text.includes(disclaimer));
}

async function flow7(page,surface='task7'){
  const beforeStorage=await storage(page);
  await page.locator('.tab[data-t="mar"]').click();
  const legacyHeading=await page.locator('#mode-mar h2').innerHTML();
  const legacyIntro=await page.locator('#mode-mar .card > p.note').innerHTML();
  assert.equal(await page.locator('#marGrid .tg').count(),142);
  assert.equal(await page.locator('#marTask [data-source-task-id]').count(),0);
  await page.locator('#marTask .optbtn').nth(0).click();
  await page.locator('#marTask .optbtn').nth(2).click();
  assert.equal(await page.evaluate(()=>marStatus[0].state),'ok');
  const legacy=await page.evaluate(()=>JSON.stringify(marStatus.slice(0,142)));
  await page.locator(cohort).click();
  await provenance(page,7);
  assert.match(await page.locator('#mode-mar h2').innerText(), /авторск/i);
  assert.doesNotMatch(await page.locator('#mode-mar .card > p.note').innerText(), /РЕШУ|math100|formulaoge/);
  assert.equal(await page.locator('#marGrid .tg').count(),1);
  assert.match(await page.locator('#marCnt').innerText(),/всего задач: 1$/);
  assert.match(await page.locator('#marTask .taskline').innerText(),/50/);
  assert.equal(await page.locator('#marTask .optbtn').count(),4);
  const diagram=await page.locator('#marTask svg').evaluate(svg=>({role:svg.getAttribute('role'),label:svg.getAttribute('aria-label'),pts:[...svg.querySelectorAll('circle[data-point]')].map(c=>({name:c.dataset.point,value:Number(c.dataset.value),x:Number(c.getAttribute('cx'))}))}));
  assert.equal(diagram.role,'img');assert.match(diagram.label,/6, 7, 8/);
  assert.deepEqual(diagram.pts.map(p=>[p.name,p.value]),[['A',6.6],['B',Math.sqrt(50)],['C',7.45],['D',7.8]]);
  const scale=(diagram.pts[3].x-diagram.pts[0].x)/(7.8-6.6);
  for(const p of diagram.pts)assert.ok(Math.abs(p.x-(diagram.pts[0].x+(p.value-6.6)*scale))<1e-7);
  const measured=await controls(page,`${cohort},#marTask button,#marTask input`,surface);
  await focus(page.locator('#marTask .optbtn').nth(1));
  const revealFirst=/offline|iframe|board/i.test(String(surface));
  if(revealFirst){await page.locator('#marTask').getByRole('button',{name:'Показать ответ',exact:true}).click();await page.locator('#marTask').getByRole('button',{name:'Начать заново',exact:true}).click();}
  await page.locator('#marTask .optbtn').nth(0).click();
  assert.match(await page.locator('#marTask > .msg').innerText(),/A левее 7/);
  await page.locator('#marTask .optbtn').nth(1).press('Enter');
  assert.match(await page.locator('#marTask > .msg').innerText(),/верно/);
  assert.equal(await page.evaluate(()=>authorProgress.credited),!revealFirst);
  const credit=await page.evaluate(()=>marStatus[142].state);
  await page.locator('#marTask').getByRole('button',{name:'Начать заново',exact:true}).click();
  await page.locator('#marTask .optbtn').nth(1).click();
  assert.equal(await page.evaluate(()=>marStatus[142].state),credit);
  await page.locator('#marTask').getByRole('button',{name:'Начать заново',exact:true}).click();
  await page.locator('#marTask').getByRole('button',{name:'Решить по шагам',exact:true}).click();
  await noOverflow(page,surface+' expanded steps');
  await controls(page,`${cohort},#marTask button,#marTask input`,surface);
  let current=page.locator('#marTask .stepcard:not(.done)').last();
  await current.locator('input').nth(0).fill('7');await current.locator('input').nth(1).fill('8');
  await current.getByRole('button',{name:'Проверить',exact:true}).click();
  await page.locator('#marTask .stepcard').last().getByRole('button',{name:'Показать шаг',exact:true}).click();
  assert.match(await page.locator('#marTask .stepcard').last().innerText(),/7,1/);
  await page.locator('#marTask .stepcard').last().getByRole('button',{name:'B',exact:true}).click();
  current=page.locator('#marTask .stepcard').last();
  await current.locator('input').fill('7,07');await current.getByRole('button',{name:'Проверить',exact:true}).click();
  assert.match(await current.locator('.msg').innerText(),/не то/);
  await current.locator('input').fill('2');await current.locator('input').press('Enter');
  assert.equal(await page.evaluate(()=>authorProgress.credited),!revealFirst);
  assert.equal(await page.evaluate(()=>authorProgress.revealed),true);
  await expandedEvidence(page,7,surface);
  await page.locator('#marSrcChips .chip').filter({hasText:/^Все источники$/}).click();
  assert.equal(await page.locator('#mode-mar h2').innerHTML(),legacyHeading);
  assert.equal(await page.locator('#mode-mar .card > p.note').innerHTML(),legacyIntro);
  assert.equal(await page.locator('#marGrid .tg').count(),142);
  assert.equal(await page.evaluate(()=>JSON.stringify(marStatus.slice(0,142))),legacy);
  await page.locator(cohort).click();
  await provenance(page,7);
  assert.deepEqual(await storage(page),beforeStorage);
  return {task:7,surface,legacy:142,canonical:143,answer:2,revealFirst,controls:measured,svg:diagram,storage:'unchanged'};
}

async function flow8(page,surface='task8'){
  const beforeStorage=await storage(page);
  await page.locator('nav.tabs button[data-v="mar"]').click();
  const legacyHeading=await page.locator('#view-mar h2').innerHTML();
  const legacyIntro=await page.locator('#view-mar .card > p').innerHTML();
  assert.equal(await page.locator('#marGrid > .mtask').count(),160);
  assert.equal(await page.locator('#marGrid [data-source-task-id]').count(),0);
  let card=page.locator('#marGrid > .mtask').first();
  await card.locator('input').fill('64');await card.locator('input').press('Enter');
  assert.equal(await page.evaluate(()=>marState['1.1']),'ok');
  const legacy=await page.evaluate(()=>JSON.stringify(marState));
  const oldScore=await page.evaluate(()=>score.solved);
  const cleanFirst=/desktop|390/i.test(String(surface));
  const expectedScore=oldScore+Number(cleanFirst);
  await page.locator(cohort).click();
  await provenance(page,8);
  assert.match(await page.locator('#view-mar h2').innerText(), /авторск/i);
  assert.doesNotMatch(await page.locator('#view-mar .card > p').innerText(), /Math4Skill/);
  assert.equal(await page.locator('#marGrid > .mtask').count(),1);
  card=page.locator('#marGrid > .author-task');
  assert.equal((await card.locator('.expr .fr > .fn').innerText()).replace(/\s+/g,''),'97·105');
  assert.equal((await card.locator('.expr .fr > .fd').innerText()).replace(/\s+/g,''),'905');
  assert.deepEqual(await card.locator('.expr sup').allTextContents(),['7','5','5']);
  const fraction=await card.locator('.expr .fr').evaluate(e=>{const n=e.querySelector('.fn').getBoundingClientRect(),d=e.querySelector('.fd').getBoundingClientRect();return{top:n.top,bottom:d.top,border:getComputedStyle(e.querySelector('.fn')).borderBottomStyle};});
  assert.ok(fraction.top<fraction.bottom);assert.equal(fraction.border,'solid');
  const measured=await controls(page,`${cohort},.author-task button,.author-task input`,surface);
  await focus(card.locator('input').first());
  await card.locator('input').first().fill('9');await card.locator('input').first().press('Enter');
  assert.match(await card.locator('.fb').first().innerText(),/9²/);
  if(cleanFirst){
    await card.locator('input').first().fill('81');await card.locator('input').first().press('Enter');
    assert.equal(await page.evaluate(()=>authorProgress.credited),true);
    assert.equal(await page.evaluate(()=>score.solved),expectedScore);
    await card.locator('input').first().press('Enter');
    assert.equal(await page.evaluate(()=>score.solved),expectedScore,'repeated independent answer earns no extra credit');
  }
  await card.locator('.bs').click();await card.locator('.msteps .hb').click();
  await noOverflow(page,surface+' expanded hint');
  await controls(page,`${cohort},.author-task button,.author-task input`,surface);
  assert.equal(await page.evaluate(()=>authorProgress.assisted),true);
  await card.getByRole('button',{name:'Начать заново',exact:true}).click();
  card=page.locator('#marGrid > .author-task');
  await card.locator('input').first().fill('81');await card.locator('input').first().press('Enter');
  assert.match(await card.locator('.fb').first().innerText(),/верно/);
  assert.equal(await page.evaluate(()=>authorProgress.credited),cleanFirst);
  assert.equal(await page.evaluate(()=>score.solved),expectedScore);
  await card.locator('input').first().press('Enter');
  assert.equal(await page.evaluate(()=>score.solved),expectedScore);
  await card.getByRole('button',{name:'Начать заново',exact:true}).click();
  card=page.locator('#marGrid > .author-task');
  await card.locator('.bs').click();
  for(const values of [['5'],['2','0'],['81']]){
    const inputs=card.locator('.msteps input:not([disabled])');assert.equal(await inputs.count(),values.length);
    for(let i=0;i<values.length;i++)await inputs.nth(i).fill(values[i]);
    await inputs.last().press('Enter');
  }
  assert.equal(await page.evaluate(()=>score.solved),expectedScore,'hint plus rerendered clean steps cannot mint independent credit');
  await expandedEvidence(page,8,surface);
  assert.equal(await page.evaluate(()=>authorProgress.credited),cleanFirst);
  await card.getByRole('button',{name:'Начать заново',exact:true}).click();
  card=page.locator('#marGrid > .author-task');
  await card.locator('.sa').click();assert.equal(await card.locator('input').first().inputValue(),'81');
  assert.equal(await page.evaluate(()=>authorProgress.revealed),true);
  assert.equal(await page.evaluate(()=>score.solved),expectedScore);
  await page.locator('#marChips [data-k="all"]').click();
  assert.equal(await page.locator('#view-mar h2').innerHTML(),legacyHeading);
  assert.equal(await page.locator('#view-mar .card > p').innerHTML(),legacyIntro);
  assert.equal(await page.locator('#marGrid > .mtask').count(),160);
  assert.equal(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(marState).filter(([id])=>id!==AUTHOR_SOURCE.localTaskId)))),legacy);
  assert.equal(await page.evaluate(()=>quizTask.id===AUTHOR_SOURCE.localTaskId),false);
  await page.locator(cohort).click();await provenance(page,8);
  assert.match(await page.locator('[data-author-status]').innerText(),cleanFirst?/Решено самостоятельно/:/Ответ показан/);
  assert.deepEqual(await storage(page),beforeStorage);
  return {task:8,surface,legacy:160,canonical:161,answer:81,cleanFirst,independentCredit:Number(cleanFirst),controls:measured,storage:'unchanged'};
}

async function runSurface(number, surface, options) {
  const name = number + ':' + surface;
  const context = await makeContext(options);
  let page;
  try {
    page = await context.newPage(); observe(page, name);
    const relative = '/trainers/' + files.get(number);
    const url = surface === 'file-offline' ? pathToFileURL(path.join(root, relative.slice(1))).href : origin + relative;
    let target = page;
    if (surface === 'board-iframe') {
      await page.goto(origin + '/trainers/trainer-board.html?server=' + encodeURIComponent(origin), { waitUntil: 'load' });
      await page.locator('#trainerUrl').fill(relative); await page.locator('#openTrainer').click();
      target = await (await page.locator('#trainerFrame').elementHandle()).contentFrame();
      await target.waitForURL(value => value.pathname === relative, { waitUntil: 'load' });
    } else {
      const response = await page.goto(url, { waitUntil: 'load' });
      if (surface !== 'file-offline') assert.equal(response.status(), 200);
    }
    const defaults = async () => target.evaluate(number => {
      if (number === 6) return { mode:cat, shuffle, count:order.length, first:TASKS[order[0]].code };
      if (number === 7) return { mode:document.querySelector('.mode.active').id, filter:marFilter, source:marSrc, count:marList().length };
      if (number === 8) return { mode:document.querySelector('.view.on').id, filter:marFilter, count:document.querySelectorAll('#marGrid > .mtask').length };
      if (number === 9) return { mode:document.querySelector('.pane.on').id, filter:maraState.filter };
      return { mode:document.querySelector('section.tab.on').id, filter:marFilter };
    }, number);
    const expectedDefault = {
      6:{mode:'bank',shuffle:false,count:81,first:'097E41'},
      7:{mode:'mode-learn',filter:'all',source:'all',count:142},
      8:{mode:'view-ref',filter:'all',count:160},
      9:{mode:'pane-ref',filter:'all'}, 10:{mode:'tab-uch',filter:'all'}
    }[number];
    assert.deepEqual(await defaults(), expectedDefault, name + ': legacy defaults');
    await ({ 6: flow6, 7: flow7, 8: flow8, 9: flow9, 10: flow10 })[number](target, surface);
    const savedStorage = await storageSnapshot(target);
    // A fresh navigation proves exact direct link, reload, and fail-closed query behavior.
    await target.goto(url + '?task=' + authorId(number), { waitUntil: 'load' });
    await commonChecks(target, number);
    await target.goto(target.url(), { waitUntil: 'load' });
    await commonChecks(target, number);
    const fresh = await target.evaluate(number => {
      if (number === 6) return Object.keys(records).length === 0 && streak === 0;
      if (number === 7 || number === 8) return !authorProgress.assisted && !authorProgress.revealed && !authorProgress.credited;
      if (number === 9) return !authorMaraProgress.helpUsed && !authorMaraProgress.independent && !maraState.solved.size && !maraState.clean.size;
      return !AUTHOR_PROGRESS.assisted && !AUTHOR_PROGRESS.credited && !AUTHOR_PROGRESS.shown;
    }, number);
    assert.equal(fresh, true, name + ': author progress remains session-only on reload');
    assert.deepEqual(await storageSnapshot(target), savedStorage, name + ': navigation/reload preserves persistent legacy and foreign state');
    if (surface === 'desktop' || surface === 'mobile360') await page.screenshot({ path: path.join(evidenceDir, name.replace(':', '-') + '.png'), fullPage: true });
    for (const query of ['', '?task=unknown', '?task=' + authorId(number) + '-extra',
      '?task=' + authorId(number) + '&task=' + authorId(number), '?task=unknown&task=' + authorId(number),
      '?task=' + authorId(number) + '&bad=%ZZ']) {
      await target.goto(url + query, { waitUntil: 'load' });
      assert.equal(await target.locator('[data-source-task-id]:visible').count(), 0, name + ': invalid query changed default');
      assert.deepEqual(await defaults(), expectedDefault, name + ': invalid query changes mode/filter');
    }
    evidence.surfaces.push({ number, surface, status: 'PASS', directLink: true, invalidQueries: 6 });
    progress(name + ' PASS');
  } catch (error) {
    if (page) await page.screenshot({ path: path.join(evidenceDir, 'failure-' + name.replace(':', '-') + '.png'), fullPage: true }).catch(() => {});
    throw error;
  } finally {
    if (page) await closeStage(name + ' page', () => page.close());
    await closeStage(name + ' context', () => context.close());
  }
}
try {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  port = server.address().port; origin = 'http://127.0.0.1:' + port;
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.BROWSER_EXECUTABLE_PATH;
  browserServer = await chromium.launchServer({ headless: true, ...(executablePath ? { executablePath } : { channel: 'msedge' }),
    args: ['--disable-background-mode', '--disable-extensions', '--no-first-run', '--disable-background-networking'] });
  evidence.browserPid = browserServer.process().pid;
  browser = await chromium.connect(browserServer.wsEndpoint());
  for (const number of files.keys()) {
    for (const [surface, width, height, mobile] of [['desktop', 1280, 900, false], ['mobile390', 390, 844, true],
      ['mobile360', 360, 844, true], ['board-iframe', 1280, 900, false], ['file-offline', 360, 844, true]]) {
      await runSurface(number, surface, { viewport: { width, height }, isMobile: mobile, hasTouch: mobile, offline: surface === 'file-offline' });
    }
  }
  assert.equal(evidence.surfaces.length, 25);
  assert.deepEqual(evidence.errors, []); assert.deepEqual(evidence.externalRequests, []);
} catch (error) { failure = error; }
finally {
  try {
    if (browser) await closeStage('browser connection', () => browser.close());
    if (browserServer) {
      await closeStage('owned browser process', () => browserServer.close());
      evidence.browserExitCode = browserServer.process().exitCode;
      evidence.browserSignal = browserServer.process().signalCode;
      assert.equal(evidence.browserExitCode, 0); assert.equal(evidence.browserSignal, null);
      assert.throws(() => process.kill(evidence.browserPid, 0), /ESRCH/);
    }
  } catch (error) { failure = failure ? new AggregateError([failure, error]) : error; }
  try {
    server.closeAllConnections();
    await closeStage('HTTP server', () => new Promise(resolve => server.close(resolve)));
    if (port) {
      const listening = await new Promise(resolve => {
        const socket = net.connect({ host: '127.0.0.1', port });
        socket.once('connect', () => { socket.destroy(); resolve(true); });
        socket.once('error', () => resolve(false));
      });
      assert.equal(listening, false); evidence.remainingPorts = 0;
    }
  } catch (error) { failure = failure ? new AggregateError([failure, error]) : error; }
}
evidence.status = failure ? 'FAIL' : 'PASS';
if (failure) evidence.failure = failure.stack + (failure.errors ? '\n' + failure.errors.map(error => error.stack).join('\n') : '');
fs.writeFileSync(path.join(evidenceDir, 'browser-results.json'), JSON.stringify(evidence, null, 2));
if (failure) throw failure;
console.log(JSON.stringify(evidence));
console.log('OGE_2027_ANALOGUE_6_10_BROWSER_OK');
