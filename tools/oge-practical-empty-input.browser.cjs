'use strict';
// Cloud Chromium verifies the visible field guidance on current and downloadable pages.
if (!process.env.CI) throw new Error('Run this browser gate in cloud CI.');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = process.env.PRACTICAL_EMPTY_INPUT_ARTIFACTS || path.join(root, 'artifacts/oge-practical-discovery/empty-input');
const unpacked = fs.mkdtempSync(path.join(os.tmpdir(), 'oge-empty-input-'));
execFileSync('unzip', ['-q', path.join(root, 'downloads/trainers/oge-1-5-trainers/oge-1-5-trainers-package.zip'), '-d', unpacked]);
assert.deepEqual(
  fs.readFileSync(path.join(unpacked, 'practical-variant.js')),
  fs.readFileSync(path.join(root, 'trainers/oge-1-5-trainers/practical-variant.js')),
  'downloaded and public input handling must match'
);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://local');
  const offline = url.pathname.startsWith('/offline/');
  const base = offline ? unpacked : root;
  const file = path.resolve(base, offline ? decodeURIComponent(url.pathname.slice(9)) : '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(base + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404).end(); return; }
  response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  response.end(fs.readFileSync(file));
});
const stories = ['roads-grid', 'roads-schema', 'apartments', 'land-plots', 'stoves', 'tariffs', 'paper-sheets'];
const records = [];
let browser;
const saved = page => page.evaluate(() => JSON.stringify(['localStorage', 'sessionStorage'].map(name => [
  name, Object.keys(window[name]).sort().map(key => [key, window[name].getItem(key)])
])));
async function expectPrompt(page, card, missing, before, label) {
  assert.equal(await missing.evaluate(node => node === document.activeElement), true, label + ': focus the missing field');
  assert.equal(await missing.getAttribute('aria-invalid'), 'true');
  assert.ok((await card.locator('.pv-feedback').textContent()).includes(await missing.getAttribute('aria-label')));
  assert.equal(await card.locator('[data-pv-field]').evaluateAll(nodes => nodes.some(node => node.disabled)), false);
  assert.equal(await card.locator('.pv-check').isDisabled(), false);
  assert.equal(await card.locator('.pv-feedback').evaluate(node => node.classList.contains('pv-incorrect') || node.classList.contains('pv-correct')), false);
  assert.notEqual(await card.getAttribute('data-result'), 'incorrect');
  assert.notEqual(await card.getAttribute('data-result'), 'correct');
  const state = await card.evaluate(node => node.__practicalQuestion.capture());
  assert.equal(state.checked, false, label + ': an incomplete form is not a checked answer');
  assert.equal(state.helpUsed, false, label + ': field guidance is not mathematical help');
  assert.equal(await saved(page), before, label + ': attempts and drafts stay unchanged');
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ headless: true });
  for (const [width, offline] of [[320, false], [1280, false], [320, true]]) for (const story of stories) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const label = story + '@' + width + (offline ? '-offline' : '');
    try {
      await page.goto(origin + (offline ? '/offline/' : '/trainers/oge-1-5-trainers/') + 'practice-1-5-' + story + '.html');
      await page.waitForFunction(() => document.documentElement.dataset.practicalVariant === 'ready');
      const cards = page.locator('.pv-task-stream > .pv-question');
      assert.equal(await cards.count(), 5, label + ': five real tasks');
      for (let index = 0; index < 5; index++) {
        const card = cards.nth(index), fields = card.locator('[data-pv-field]'), first = fields.first();
        const before = await saved(page);
        await card.locator('.pv-check').click();
        await expectPrompt(page, card, first, before, label + ' Q' + (index + 1));
        if (await fields.count() > 1) {
          if (await first.evaluate(node => node.tagName === 'SELECT')) {
            const value = await first.locator('option').evaluateAll(options => options.find(option => option.value).value);
            await first.selectOption(value);
          } else await first.fill('0');
          const typed = await first.inputValue(), partialBefore = await saved(page);
          await card.locator('.pv-check').click();
          await expectPrompt(page, card, fields.nth(1), partialBefore, label + ' partial matching');
          assert.equal(await first.inputValue(), typed, 'the completed first field is retained');
          assert.equal(await first.getAttribute('aria-invalid'), null);
        }
      }
      if (width === 320 && !offline) {
        await cards.first().screenshot({ path: path.join(output, story + '-missing-field-320.png') });
      }
      assert.deepEqual(errors, [], label + ': browser errors');
      records.push({ story, width, offline, questions: 5, result: 'pass' });
    } catch (error) {
      await page.screenshot({ path: path.join(output, 'FAIL-' + label + '.png'), fullPage: true }).catch(() => {});
      throw error;
    } finally { await context.close(); }
  }
  fs.writeFileSync(path.join(output, 'coverage.json'), JSON.stringify({ cases: records.length, questions: records.reduce((sum, record) => sum + record.questions, 0), records }, null, 2));
  console.log('OGE_PRACTICAL_EMPTY_INPUT_BROWSER_OK ' + records.length + ' cases');
})().catch(error => {
  console.error(error); process.exitCode = 1;
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'partial-coverage.json'), JSON.stringify(records, null, 2));
}).finally(async () => {
  if (browser) await browser.close();
  server.close();
  fs.rmSync(unpacked, { recursive: true, force: true });
});
