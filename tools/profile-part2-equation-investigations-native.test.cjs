'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const investigations = require('../ege-profil/part-two/equation-investigations-data.js');

const root = path.resolve(__dirname, '..');
const prefix = 'mathexam.profilePartTwoLab.v1.';
const credit = 'mathExam.profile.partTwo.v1.p14-circle-selection-4';
const creditRecord = JSON.stringify({ version: 1, taskId: 'p14-circle-selection-4',
  drafts: { final: [], steps: [], proof: '' }, solvedSteps: [], hints: [], proofChecks: [], attempts: [],
  attemptCount: 0, wrong: 0, helped: false, solution: false, solutionSteps: 0, completed: true, independent: true, updatedAt: 321 });
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
const setup = {
  'p14-circle-selection': { steps: [{ closed: false }, { rightPi: '3' }, { closed: true }], answers: { answer: '0π' } },
  'p14-trig-factors': { steps: [{ operation: 'divide' }], answers: { answer: '4/2' } },
  'p14-exponential-substitution': { steps: [{ x: '-2' }, { x: '2' }],
    checks: [{ 'positive-t': 'yes', 'negative-t': 'no' }, { 'inverse-x': '2/2' }], answers: { t: '2/6', x: '1,0' } },
  'p14-log-domain': { steps: [{ x: '0' }, { x: '4' }], checks: [{ 'log-domain': 'right' }], answers: { answer: 'inside' } },
  'p14-radical-check': { steps: [{ x: '-1' }, { equation: 'original' }, { x: '2' }], answers: { answer: '∅' } },
  'p14-rational-hole': { steps: [{ x: '3' }, { x: '4' }], answers: { answer: '−2/2' } }
};

async function run(page, base, lab, width) {
  const { steps, checks = [], answers } = setup[lab.lessonId];
  const url = base + '#lesson/' + lab.lessonId;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const gate = page.locator('#model-lab > summary');
  await gate.waitFor();
  assert(await gate.evaluate(summary => summary.parentElement.nextElementSibling.querySelector('h2').textContent === 'Начать с задачи'));
  await gate.press('Enter');
  const first = page.locator('[data-lab-prediction] select');
  await first.waitFor();
  assert(!(await page.locator('[data-lab-model]').isVisible()));
  assert(!(await page.locator('[data-lab-transfer]').isVisible()));
  await first.selectOption(lab.prediction.choices.find(choice => choice.id !== lab.prediction.correct).id);
  await page.getByRole('button', { name: 'Сохранить прогноз', exact: true }).press('Enter');
  await page.locator('[data-lab-model]').waitFor();
  await page.waitForFunction(() => document.activeElement === document.querySelector('[data-control]'));
  const compare = page.getByRole('button', { name: 'Сравнить с прогнозом', exact: true });
  assert(await compare.isDisabled());
  for (const update of steps) for (const [id, value] of Object.entries(update)) {
    const control = page.locator(`[data-control="${id}"]`);
    if (typeof value === 'boolean') {
      if (width < 600) await control.tap();
      else await control.press('Space');
      assert.equal(await control.isChecked(), value);
    } else {
      assert(await control.isVisible());
      await control.selectOption(value);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert(overflow <= 1, `${lab.lessonId} ${width}px overflow ${overflow}`);
  }
  for (const [index, selections] of checks.entries()) {
    const form = page.locator(`[data-lab-verification="${index}"]`);
    await form.waitFor();
    assert(await compare.isDisabled());
    for (const [id, value] of Object.entries(selections)) {
      const field = form.locator(`[data-response="${id}"]`);
      if (await field.evaluate(node => node.tagName === 'SELECT')) await field.selectOption(value);
      else await field.fill(value);
    }
    await form.getByRole('button', { name: 'Проверить', exact: true }).press('Enter');
    await form.getByText('Верно.', { exact: true }).waitFor();
  }
  await page.waitForFunction(() => !document.querySelector('[data-lab-compare]').disabled);
  await compare.press('Enter');
  const transfer = page.locator('[data-lab-transfer]');
  await transfer.waitFor();
  assert.match(await page.locator('[data-lab-prediction-result]').innerText(), /другой результат/);
  for (const [id, value] of Object.entries(answers)) {
    const field = transfer.locator(`[data-response="${id}"]`);
    if (await field.evaluate(node => node.tagName === 'SELECT')) await field.selectOption(value);
    else await field.fill(value);
  }
  await transfer.getByRole('button', { name: 'Проверить ответ', exact: true }).press('Enter');
  await transfer.getByText(/^Верно\./).waitFor();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await gate.press('Enter');
  await transfer.getByText(/^Верно\./).waitFor();
  const saved = await page.evaluate(({ id, prefix, credit }) => ({ record: JSON.parse(localStorage.getItem(prefix + id)),
    historical: localStorage.getItem(prefix + '14'), credit: localStorage.getItem(credit) }), { id: lab.lessonId, prefix, credit });
  assert.equal(saved.historical, '{"record":"historical"}');
  assert.equal(saved.credit, creditRecord);
  assert.deepEqual(saved.record.last.answers, answers);
  assert(saved.record.last.correct);
}


test('native H06 journeys use the actual lesson loader and preserve the historical research and credit', {
  skip: !(process.env.CI || process.env.H06_NATIVE_BROWSER === '1') && 'set H06_NATIVE_BROWSER=1 for native Chromium',
  timeout: 180000
}, async t => {
  const { chromium } = require('playwright');
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://fixture').pathname);
    const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(response);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections();await new Promise(resolve => server.close(resolve)); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const base = origin + '/ege-profil/part-two/index.html';
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] });
  t.after(() => browser.close());
  for (const width of [320, 390, 1280]) await t.test(width + 'px', async () => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 600 });
    try {
      await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(({prefix, credit, creditRecord}) => {
        if (localStorage.getItem(prefix + '14') === null) localStorage.setItem(prefix + '14', '{"record":"historical"}');
        if (localStorage.getItem(credit) === null) localStorage.setItem(credit, creditRecord);
      }, { prefix, credit, creditRecord });
      for (const lab of investigations) await run(page, base, lab, width);
      await page.goto(base + '#lesson/p16-fixed-log');
      await page.locator('#model-lab > summary').press('Enter');
      const legacy = page.locator('#model-lab [data-lab-prediction]');
      await legacy.waitFor();
      assert(await page.locator('#model-lab input[type="range"]').count(), 'an unrelated lesson still uses the historical model');
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
  t.diagnostic('18 complete H06 journeys at 320/390/1280px, legacy model fallback retained');
});
