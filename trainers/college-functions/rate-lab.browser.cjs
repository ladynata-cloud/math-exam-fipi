'use strict';

// Run with Playwright. Set CHROMIUM_PATH to use an installed Chromium binary.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '../..');
const ORIGIN = 'https://mathexam.test';
const URL = ORIGIN + '/trainers/college-functions/';
const COURSE_KEY = 'mathExam.collegeFunctions.v1';
const LAB_KEY = 'mathExam.collegeFunctions.rate.v1';
const existingWork = {
  attempts: {}, seen: { F8: true }, last: { id: 'F8', mode: 'learn' },
  results: { 'test:F1': { completed: true, fresh: true, errors: 0, helpUsed: false } }
};
const mime = { '.js': 'application/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.ico': 'image/x-icon' };

async function participant(browser, width, seed = existingWork) {
  const errors = [];
  const context = await browser.newContext({ viewport: { width, height: 850 }, reducedMotion: 'reduce' });
  await context.route('**/*', route => {
    const url = new globalThis.URL(route.request().url());
    if (url.origin !== ORIGIN) {
      errors.push('Unexpected external request: ' + url.origin);
      return route.abort();
    }
    const pathname = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
    const file = path.join(ROOT, pathname);
    if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file)) {
      errors.push('Missing local asset: ' + pathname);
      return route.fulfill({ status: 404, body: '' });
    }
    return route.fulfill({ path: file, contentType: mime[path.extname(file)] });
  });
  await context.addInitScript(({ key, work }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(work));
  }, { key: COURSE_KEY, work: seed });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(6500);
  return { context, page, errors };
}

const stored = (page, key) => page.evaluate(k => localStorage.getItem(k), key);
const openLab = page => page.locator('#open-rate-lab').press('Enter');
const field = (page, id) => page.locator('#rate-lab [data-rate="' + id + '"]');
const action = (page, id) => page.locator('#rate-lab [data-action="' + id + '"]');
async function inView(page) {
  const size = await page.evaluate(() => {
    const dialog = document.querySelector('#rate-dialog[open]');
    return { viewport: innerWidth, pageWidth: document.documentElement.scrollWidth,
      dialogWidth: dialog?.clientWidth ?? 0, dialogContentWidth: dialog?.scrollWidth ?? 0 };
  });
  assert(size.pageWidth <= size.viewport + 1 && size.dialogContentWidth <= size.dialogWidth + 1,
    'horizontal overflow: ' + JSON.stringify(size));
}

async function answerChanges(page, dx, dy, rate) {
  for (const [key, answer] of Object.entries({ dx, dy, rate })) await field(page, key).fill(answer);
  await action(page, 'check').press('Enter');
}

async function personal(browser, width) {
  const { context, page, errors } = await participant(browser, width);
  try {
    await page.goto(URL);
    await page.locator('#task-select').waitFor();
    assert.equal(await page.locator('#task-select').inputValue(), 'F8', 'resumed earlier work');
    const before = await stored(page, COURSE_KEY);
    await openLab(page);
    const lab = page.locator('#rate-lab');
    await field(page, 'prediction').waitFor();
    await inView(page);
    assert.equal(await field(page, 'a').inputValue(), '0');
    assert.equal(await field(page, 'b').inputValue(), '2');
    assert.equal(await field(page, 'dx').isVisible(), false, 'prediction precedes calculations');
    await field(page, 'prediction').selectOption('up');
    await action(page, 'predict').press('Enter');
    assert.equal(await lab.locator('[data-secant]').count(), 0, 'incorrect forecast keeps the line hidden');
    await field(page, 'prediction').selectOption('down');
    await action(page, 'predict').press('Enter');
    await lab.locator('[data-secant]').waitFor({ state: 'attached' });
    await answerChanges(page, '2', '-4', '-4');
    assert.equal(await field(page, 'rate').inputValue(), '-4', 'attempt survives targeted feedback');
    await answerChanges(page, '2', '-4', '-2');
    await field(page, 'b').focus();
    await page.keyboard.press('End');
    assert.equal(await field(page, 'b').inputValue(), '4');
    assert.equal(await field(page, 'dx').isVisible(), false, 'new endpoints need a new prediction');
    await field(page, 'prediction').selectOption('flat');
    await action(page, 'predict').press('Enter');
    await answerChanges(page, '4', '0', '0');
    await action(page, 'transfer').press('Enter');
    await field(page, 'unit').waitFor();
    assert.equal(await lab.locator('table').isVisible(), true);
    assert.equal(await lab.locator('svg:visible').count(), 0, 'independent transfer removes the graph');
    await field(page, 'rate').fill('-1,5');
    await field(page, 'unit').selectOption('deg-per-min');
    await field(page, 'reason').selectOption('ends');
    const note = 'За 6 минут температура уменьшилась на 9 градусов.';
    await field(page, 'note').fill(note);
    await page.reload();
    if (!(await field(page, 'note').isVisible())) await openLab(page);
    assert.equal(await field(page, 'note').inputValue(), note, 'writing survives reopening');
    assert.equal(await field(page, 'rate').inputValue(), '-1,5');
    await field(page, 'unit').selectOption('deg');
    await action(page, 'check').press('Enter');
    assert.equal(await action(page, 'next').count(), 0, 'incorrect units reject the transfer');
    await field(page, 'unit').selectOption('deg-per-min');
    await action(page, 'check').press('Enter');
    await action(page, 'next').press('Enter');
    await field(page, 'rate').fill('0');
    await field(page, 'reason').selectOption('varies');
    await field(page, 'note').fill('На концах получаем 3, а в нуле значение равно −1.');
    await action(page, 'check').press('Enter');
    await action(page, 'next').press('Enter');
    assert.match(await lab.innerText(), /1 из 2/);
    await action(page, 'variant').press('Enter');
    assert.equal(await field(page, 'rate').inputValue(), '');
    assert.match(await lab.locator('table').innerText(), /14/);
    await field(page, 'rate').fill('5/2');
    await field(page, 'unit').selectOption('deg-per-min');
    await field(page, 'reason').selectOption('ends');
    await field(page, 'note').fill('10 градусов за 4 минуты.');
    await action(page, 'check').press('Enter');
    await action(page, 'next').press('Enter');
    await field(page, 'rate').fill('−2');
    await field(page, 'reason').selectOption('turns');
    await field(page, 'note').fill('От 3 до −5 за 4 единицы x. В нуле значение равно 4.');
    await action(page, 'check').press('Enter');
    await action(page, 'next').press('Enter');
    assert.match(await lab.innerText(), /2 из 2/);
    await inView(page);
    assert.equal(await stored(page, COURSE_KEY), before, 'old task and results preserved');
    assert.ok(await stored(page, LAB_KEY), 'separate draft');
    await page.keyboard.press('Escape');
    assert(await page.locator('#open-rate-lab').evaluate(el => el === document.activeElement));
    await page.goto(URL + '#rate-lab');
    await action(page, 'reset').waitFor();
    page.once('dialog', dialog => dialog.accept());
    await action(page, 'reset').click();
    await field(page, 'prediction').waitFor();
    assert.equal(await stored(page, COURSE_KEY), before, 'lab reset leaves previous work intact');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
}

async function independentParabola(browser) {
  const seed = { attempts: {}, results: {}, seen: { C1: true, C2: true }, last: { id: 'C2', mode: 'learn' } };
  for (const studyFirst of [false, true]) {
    const { context, page, errors } = await participant(browser, 900, seed);
    try {
      await page.goto(URL);
      if (studyFirst) {
        await openLab(page);
        await field(page, 'prediction').waitFor();
        await page.reload();
      }
      await page.locator('#test-mode').click();
      assert.equal(await page.locator('#task-select').inputValue(), 'C3');
      const snapshot = () => page.evaluate(() => window.CollegeFunctionsApp.snapshot().attempt);
      assert.equal((await snapshot()).fresh, !studyFirst, 'prior exposure determines independent credit');
      await page.locator('#answer-domain').fill('R');
      await page.goto(URL + '#rate-lab');
      await page.reload();
      assert.equal(await page.locator('#open-rate-lab').isDisabled(), true);
      assert.match(await page.locator('#rate-entry-note').innerText(), /C3/);
      assert.equal(await page.locator('#rate-dialog').isVisible(), false);
      assert.equal(await page.locator('#answer-domain').inputValue(), 'R');
      assert.equal((await snapshot()).fresh, !studyFirst);
      if (studyFirst) continue;
      assert.equal(await stored(page, LAB_KEY), null, 'deep link does not secretly load the model');
      await page.locator('#check-step').click();
      const points = [[0,5],[1,2],[2,1],[3,2],[4,5]];
      for (const [x,y] of points) await page.locator('[data-answer="y' + x + '"]').fill(String(y));
      await page.locator('#check-step').click();
      for (const [x,y] of points) {
        await page.locator('#plot-x').fill(String(x));
        await page.locator('#plot-y').fill(String(y));
        await page.locator('#place-point').click();
      }
      for (const values of [
        { range: '[1; +inf)' }, { zeros: 'нет' }, { positive: 'R', negative: 'нет' },
        { up: '[2; +inf)', down: '(-inf; 2]', constant: 'нет' }
      ]) {
        for (const [name, value] of Object.entries(values)) await page.locator('#answer-' + name).fill(value);
        await page.locator('#check-step').click();
      }
      await page.locator('#answer-parity').selectOption('neither');
      await page.locator('#check-step').click();
      assert.equal((await snapshot()).completed, true);
      const record = JSON.parse(await stored(page, COURSE_KEY)).results['test:C3'];
      assert.equal(record.fresh, true);
      await page.locator('#rate-after-graph').click();
      await field(page, 'prediction').waitFor();
      await page.reload();
      await field(page, 'prediction').waitFor();
      assert.equal((await snapshot()).fresh, true);
      assert.deepEqual(JSON.parse(await stored(page, COURSE_KEY)).results['test:C3'], record);
    } finally { await context.close(); assert.deepEqual(errors, []); }
  }
}

async function mirror(sender, receiver) {
  const state = await sender.evaluate(() => window.getBoardTrainerState());
  await receiver.evaluate(value => window.applyBoardTrainerState(value), state);
  assert.deepEqual(await receiver.evaluate(() => window.getBoardTrainerState()), state);
  return state;
}

async function board(browser) {
  const a = await participant(browser, 1024);
  const b = await participant(browser, 360);
  try {
    await Promise.all([a.page.goto(URL + '?board=1'), b.page.goto(URL + '?board=1')]);
    const before = await Promise.all([stored(a.page, COURSE_KEY), stored(b.page, COURSE_KEY)]);
    await a.page.locator('#answer-domain').fill('[-2;');
    const legacy = await mirror(a.page, b.page);
    assert.equal(legacy.taskId, 'B1');
    await openLab(a.page);
    const original = await mirror(a.page, b.page);
    assert.equal(original.taskId, legacy.taskId);
    assert.equal(original.stage, legacy.stage);
    assert.deepEqual(original.drafts, legacy.drafts, 'opening the lab preserves the in-progress answer');
    await b.page.locator('#rate-board-graph [data-secant]').waitFor({ state: 'attached' });
    await a.page.locator('[data-rate-task="C3"]').click();
    const content = page => page.locator('#rate-board-work');
    const graph = page => page.locator('#rate-board-graph');
    const c3 = await mirror(a.page, b.page);
    assert.equal(c3.taskId, 'C3');
    assert.equal(c3.mode, 'learn');
    assert.equal(c3.panels.cheatsheet, true);
    assert.deepEqual(Object.keys(c3).sort(), Object.keys(legacy).sort(), 'unchanged v1 schema');
    await Promise.all([a, b].map(client => graph(client.page).locator('[data-secant]').waitFor({ state: 'attached' })));
    const c3Text = await content(a.page).innerText();
    assert.equal(await content(b.page).innerText(), c3Text);
    for (const [src, dst, id] of [[b.page, a.page, 'C4'], [a.page, b.page, 'C7']]) {
      await src.locator('#task-select').selectOption(id);
      assert.equal((await mirror(src, dst)).taskId, id);
      await Promise.all([src, dst].map(page => graph(page).locator('[data-secant]').waitFor({ state: 'attached' })));
      assert(await graph(dst).isVisible());
      assert.equal(await content(dst).innerText(), await content(src).innerText());
      assert.notEqual(await content(dst).innerText(), c3Text);
    }
    await inView(b.page);
    await a.page.locator('#test-mode').click();
    const testMode = await mirror(a.page, b.page);
    assert.equal(testMode.mode, 'test');
    assert.equal(await b.page.locator('#open-rate-lab').isVisible(), false, 'test remains without hints');
    await b.page.evaluate(value => window.applyBoardTrainerState(value), legacy);
    assert.deepEqual(await b.page.evaluate(() => window.getBoardTrainerState()), legacy);
    for (const [index, client] of [a, b].entries()) {
      assert.equal(await stored(client.page, COURSE_KEY), before[index]);
      assert.equal(await stored(client.page, LAB_KEY), null, 'no personal lab state in board');
      assert.deepEqual(client.errors, []);
    }
  } finally { await Promise.all([a.context.close(), b.context.close()]); }
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH });
  try {
    for (const width of [320, 360, 1280]) {
      await personal(browser, width);
      console.log('Personal lesson, old progress, controls and independent transfer: ' + width + 'px');
    }
    await independentParabola(browser);
    console.log('Independent C3, unfinished and finished restore, prior exposure and deep link: OK');
    await board(browser);
    console.log('Two Chromium contexts, bidirectional board snapshots, old state and isolated storage: OK');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
