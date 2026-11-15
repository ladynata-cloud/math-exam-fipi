'use strict';

// The search entrance changes labels, never the numeric saved stages of §58.
// Exercise the real public HTML and retain work written before this change.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const out = process.env.SEARCH_ENTRY_ARTIFACTS || path.join(os.tmpdir(), 'mathexam-search-entry');
const unit = 'pogorelov-base-8-58';
const route = '/geometry-pogorelov/atlas/' + unit + '.html';
const key = 'mathExamGeometry.pogorelov.v1';
const labels = ['Исследовать', 'Проверить догадку', 'Доказать', 'Решить с опорой', 'Самостоятельно', 'Своими словами'];
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
const errors = [];
fs.mkdirSync(out, { recursive: true });
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  const file = path.resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end(); return;
  }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  let browser;
  let restoredStages = 0;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.GEOMETRY_CHROMIUM });
    for (const width of [320, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin + '/');
      const steps = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Как заниматься', exact: true }) });
      assert.deepEqual(await steps.locator('h3').allTextContents(), [
        '1. Исследуйте и предположите', '2. Разберитесь, почему', '3. Решите новое задание',
      ]);
      const textbook = page.locator('main a[href="/geometry-course/textbook/"]').first();
      assert(await textbook.isVisible(), 'The existing textbook entrance remains reachable');
      await textbook.click();
      await page.waitForURL(origin + '/geometry-course/textbook/');
      await page.goto(origin + route);
      assert.deepEqual(await page.locator('.stage-nav button').allTextContents(), labels.map((label, i) => String(i + 1).padStart(2, '0') + ' ' + label));
      assert.equal(await page.locator('[aria-current="step"]').getAttribute('data-stage'), '0');
      assert.equal(await page.locator('#lesson .midline-diagram svg').count(), 1);
      assert.equal(await page.locator('#lesson details').getAttribute('open'), null, 'The theorem is initially folded after the conjecture');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal overflow at ' + width);
      const firstAction = page.getByRole('button', { name: 'Проверить на модели', exact: true });
      const box = await firstAction.boundingBox();
      await page.screenshot({ path: path.join(out, 'pogorelov58-first-' + width + '.png') });
      assert(box && box.y >= 0 && box.y + box.height <= 900, 'The model action is visible before scrolling at ' + width + ': ' + JSON.stringify(box));
      await firstAction.click();
      assert.equal(await page.locator('[aria-current="step"]').getAttribute('data-stage'), '1');
      assert.equal(await page.locator('#geo-board canvas').count(), 1);
      await page.locator('#observation').fill('Двигаю вершину: предполагаю, что MN — половина AB. Нужны основания.');
      await page.locator('[data-stage="2"]').click();
      await page.locator('[data-stage="1"]').click();
      await page.reload();
      assert.match(await page.locator('#observation').inputValue(), /Нужны основания/);
      await page.goto(origin + '/geometry-pogorelov/atlas/pogorelov-base-9-106.html');
      assert.deepEqual((await page.locator('.stage-nav button').allTextContents()).slice(0, 2), ['01 Понять', '02 Исследовать'], 'Other lessons retain their existing labels');
      await context.close();
    }

    for (let stage = 0; stage < 6; stage++) {
      const saved = { stage, seed: 17, updated: 1, observation: 'Сохранённая догадка', written: 'Сохранённое доказательство', draft: 'черновик ответа', proofDone: ['s1'], attempts: 2, hints: 1, independent: 3, guided: true };
      const context = await browser.newContext();
      await context.addInitScript(({ key, unit, saved }) => {
        if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ version: 1, units: { [unit]: saved } }));
      }, { key, unit, saved });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin + route);
      assert.equal(await page.locator('[aria-current="step"]').getAttribute('data-stage'), String(stage), 'Old numeric stage ' + stage);
      if (stage === 1) assert.equal(await page.locator('#observation').inputValue(), saved.observation);
      if (stage === 3 || stage === 4) assert.equal(await page.locator('#answer').inputValue(), saved.draft);
      if (stage === 5) assert.equal(await page.locator('#written').inputValue(), saved.written);
      const actual = await page.evaluate(({ key, unit }) => JSON.parse(localStorage.getItem(key)).units[unit], { key, unit });
      for (const field of ['stage', 'seed', 'observation', 'written', 'draft', 'proofDone', 'attempts', 'hints', 'independent']) {
        assert.deepEqual(actual[field], saved[field], 'Preserve ' + field + ' in old stage ' + stage);
      }
      restoredStages++;
      await context.close();
    }
    assert.deepEqual(errors, []);
    console.log('SEARCH_ENTRY_GEOMETRY_BROWSER_OK ' + JSON.stringify({ widths: [320, 1280], restoredStages, unchangedNeighbour: true, errors }));
  } finally {
    await browser?.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
