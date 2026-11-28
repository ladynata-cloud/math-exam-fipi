'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createInterface } = require('node:readline');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const engine = require('../ege-baza/reasoning/row-sums.js');

const root = path.resolve(__dirname, '..');
const familyPath = '/ege-baza/path/index.html#lesson=practice-whole-count';
const lessonPath = '/ege-baza/reference/index.html#row-sums';

async function startSite(t) {
  const server = spawn('python3', ['-u', '-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', root],
    { stdio: ['ignore', 'pipe', 'ignore'] });
  t.after(() => server.kill());
  const lines = createInterface({ input: server.stdout });
  const [line] = await Promise.race([
    once(lines, 'line'),
    once(server, 'exit').then(([code]) => { throw Error('Preview exited with ' + code); })
  ]);
  return 'http://127.0.0.1:' + line.match(/port (\d+)/)[1];
}

async function checkTable(model, columns, above, below, count) {
  await model.locator('[data-witness]').click();
  const rows = await model.locator('[data-witness-table] tbody tr').evaluateAll(elements =>
    elements.map(row => Array.from(row.cells, cell => Number(cell.textContent))));
  assert.equal(rows.length, count);
  const sums = columns.map(() => 0);
  for (const row of rows) {
    const reported = row.pop();
    assert.equal(row.length, columns.length);
    assert(row.every(value => Number.isInteger(value) && value > 0));
    assert.equal(row.reduce((sum, value) => sum + value, 0), reported);
    assert(reported > above && reported < below);
    row.forEach((value, i) => { sums[i] += value; });
  }
  assert.deepEqual(sums, columns);
}

test('№21 — от черновика семейства до модели, контроля и возврата', async t => {
  const site = await startSite(t);
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const errors = [];
  context.on('page', p => p.on('pageerror', err => errors.push(err.message)));
  const family = await context.newPage();
  await family.goto(site + familyPath);
  await family.locator('#answer').fill('12');
  await family.locator('.ref-help > summary').click();
  const sheet = family.locator('.ref-rule[data-sheet-id="reasoning"]');
  await sheet.locator('summary').first().click();
  const [page] = await Promise.all([family.waitForEvent('popup'), sheet.locator('a[href*="#sheet=reasoning"]').click()]);
  await page.locator('a[href="#row-sums"]').click();
  const practice = page.locator('[data-row-practice]');
  const check = page.locator('[data-row-check]');
  const model = page.locator('[data-row-model]');
  await model.waitFor();
  await page.evaluate(() => localStorage.setItem('untouched-course-fixture', 'прежний результат'));
  const before = await page.evaluate(() => ({ ...localStorage }));

  const slider = model.getByRole('slider', { name: 'Предполагаемое число строк' });
  const reason = model.locator('[data-model-feedback]');
  await slider.fill('11');
  assert.match(await reason.innerText(), /Строк мало.*165/);
  assert(await model.locator('[data-witness]').isDisabled());
  await slider.press('ArrowRight');
  assert.equal(await model.locator('[data-row-value]').innerText(), '12');
  await checkTable(model, [48, 60, 67], 13, 16, 12);
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'overflow at ' + width);
  }
  await slider.fill('13');
  assert.equal(await model.locator('[data-witness-table]').count(), 0);
  assert.match(await reason.innerText(), /Строк много.*182/);
  await model.locator('[data-model-case]').selectOption('small');
  assert.match(await reason.innerText(), /малого столбца/);
  assert(await model.locator('[data-witness]').isDisabled());
  await slider.fill('8');
  await checkTable(model, [8, 24, 34], 6, 10, 8);

  const answer = practice.locator('input[name=answer]');
  const trial = engine.task('practice', 0);
  await answer.fill(String(trial.columns.length));
  await practice.locator('button[type=submit]').click();
  assert.match(await practice.locator('[data-feedback]').innerText(), /число столбцов/);
  await practice.locator('[data-hint]').click();
  assert.match(await practice.locator('[data-feedback]').innerText(), /строго между/);
  await answer.fill(String(engine.analyze(trial).answer));
  await practice.locator('button[type=submit]').click();
  assert.match(await practice.locator('[data-feedback]').innerText(), /Верно.*с помощью/);
  const initial = await practice.locator('[data-condition]').innerText();
  await practice.locator('[data-next]').click();
  assert.notEqual(await practice.locator('[data-condition]').innerText(), initial);

  await practice.locator('[data-next]').click();
  await practice.locator('[data-next]').click();
  assert.match(await practice.locator('[data-condition]').innerText(), /73, 8, 68, 93/);
  await answer.fill('9');
  await practice.locator('button[type=submit]').click();
  assert.match(await practice.locator('[data-feedback]').innerText(), /малом столбце сумма 8/);
  await answer.fill('8');
  await practice.locator('button[type=submit]').click();
  assert.match(await practice.locator('[data-feedback]').innerText(), /Верно/);

  const examAnswer = check.locator('input[name=answer]');
  const submit = check.locator('[type=submit]');
  const next = check.locator('[data-next]');
  assert.equal(await check.locator('[data-hint], details, [data-witness]').count(), 0);
  assert(await next.isDisabled());
  await examAnswer.fill('1,5');
  await submit.click();
  assert.match(await check.locator('[data-feedback]').innerText(), /целое число/);
  assert(await examAnswer.isEditable());
  await examAnswer.fill('2');
  await page.reload();
  assert.equal(await examAnswer.inputValue(), '2');
  await submit.click();
  assert.match(await check.locator('[data-feedback]').innerText(), /^Ответ принят\. В нём есть ошибка\.$/);
  await page.reload();
  assert(await examAnswer.isDisabled());
  for (let i = 1; i < engine.count; i++) {
    await next.click();
    await examAnswer.fill(String(engine.analyze(engine.task('check', i)).answer));
    await submit.click();
    assert.match(await check.locator('[data-feedback]').innerText(), /самостоятельно/);
  }
  await page.reload();
  assert(await next.isDisabled());
  assert(await examAnswer.isDisabled());
  assert.deepEqual(await page.evaluate(() => ({ ...localStorage })), before);
  for (const id of ['rounding', 'inequality-line']) {
    const [basic] = await Promise.all([page.waitForEvent('popup'), page.locator('a[href="#sheet=' + id + '"]').click()]);
    await basic.locator('.ref-rule-text').waitFor();
    assert.equal(new URL(basic.url()).hash, '#sheet=' + id);
    await basic.close();
  }
  await page.locator('footer a[href$="#lesson=practice-whole-count"]').click();
  assert.equal(await page.locator('#answer').inputValue(), '12');
  await family.reload();
  assert.equal(await family.locator('#answer').inputValue(), '12');
  assert.deepEqual(errors, []);

  await t.test('прямая ссылка при повторной загрузке, уход во время загрузки и открытие с диска', async () => {
    const fresh = await browser.newPage();
    const asset = '**/reference/row-sums.js';
    await fresh.route(asset, route => route.abort());
    await fresh.goto(site + lessonPath);
    const retry = fresh.getByRole('button', { name: 'Загрузить ещё раз' });
    await retry.waitFor();
    await fresh.unroute(asset);
    await retry.click();
    await fresh.locator('[data-row-check]').waitFor();
    let release;
    const pause = new Promise(resolve => { release = resolve; });
    let arrived;
    const pending = new Promise(resolve => { arrived = resolve; });
    await fresh.route(asset, async route => { arrived(); await pause; await route.continue(); });
    await fresh.reload({ waitUntil: 'domcontentloaded' });
    await pending;
    await fresh.evaluate(() => { location.hash = 'catalogue'; });
    await fresh.locator('.ref-catalogue').waitFor();
    const loaded = fresh.waitForResponse(response => response.url().endsWith('/reference/row-sums.js'));
    release();
    await loaded;
    assert.equal(await fresh.locator('[data-row-check]').count(), 0);
    await fresh.goto(pathToFileURL(path.join(root, 'ege-baza/reference/index.html')).href + '#row-sums');
    await fresh.locator('[data-row-check]').waitFor();
    await fresh.close();
  });
});
