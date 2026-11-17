'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const mime = { '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
const taskId = 'p2-15-projection-4';

test('native Chromium keeps the review attached to the correct proof on two tabs', {
  skip: !(process.env.CI || process.env.H05_NATIVE_BROWSER === '1') && 'set H05_NATIVE_BROWSER=1 to run native Chromium',
  timeout: 90000
}, async t => {
  const { chromium } = require('playwright');
  const server = http.createServer((request, response) => {
    const requested = new URL(request.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + (requested.endsWith('/') ? requested + 'index.html' : requested));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(response);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] });
  t.after(() => browser.close());
  const url = `http://127.0.0.1:${server.address().port}/ege-profil/part-two/#task/${taskId}/independent`;
  const record = page => page.evaluate(id => ProfilePartTwoApp.store.read(id), taskId);
  const written = (page, text) => page.waitForFunction(({ id, text }) => ProfilePartTwoApp.store.read(id).drafts.proof === text, { id: taskId, text });
  const checkbox = page => page.locator('[data-proof-check="0"]');
  const draft = page => page.locator('#proof-draft');

  for (const width of [320, 390, 1280]) await t.test(`${width}px`, async () => {
    const context = await browser.newContext({ viewport: { width, height: 910 } });
    try {
      const first = await context.newPage(), second = await context.newPage(), errors = [];
      [first, second].forEach(page => page.on('pageerror', error => errors.push(error.message)));
      await first.goto(url);
      await draft(first).waitFor();
      await first.locator('.proof-criteria summary').click();
      assert(await checkbox(first).isDisabled());
      assert(!(await record(first)).helped);
      const earlier = 'Первый довод.\nПроверка следствия.';
      const later = 'Новый довод из соседней вкладки.';
      await draft(first).fill(earlier);await written(first, earlier);
      await checkbox(first).check();
      await first.waitForFunction(id => ProfilePartTwoApp.store.read(id).proofChecks.length === 1, taskId);
      await second.goto(url);await draft(second).waitFor();
      await second.locator('.proof-criteria summary').click();
      assert(await checkbox(second).isChecked());
      await draft(second).fill(later);await written(second, later);
      assert(!(await checkbox(second).isChecked()));
      await first.locator('#proof-sync-warning').waitFor();
      assert.equal(await draft(first).inputValue(), earlier);
      assert(await checkbox(first).isDisabled());
      const latest = await record(second);
      await draft(first).evaluate(element => {
        element.value = 'Потенциально устаревшая запись.';
        element.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await first.evaluate(() => ProfilePartTwoApp.store.flush());
      assert.deepEqual(await record(first), latest);
      await first.locator('#proof-open-saved').click();
      await first.locator('#proof-sync-warning').waitFor({ state: 'hidden' });
      assert.equal(await draft(first).inputValue(), later);
      assert(!(await checkbox(first).isChecked()));
      await checkbox(first).check();
      await second.waitForFunction(() => document.querySelector('[data-proof-check="0"]').checked);
      await draft(second).fill('');await written(second, '');
      await first.locator('#proof-sync-warning').waitFor();
      await first.locator('#proof-open-saved').click();
      await first.locator('#proof-sync-warning').waitFor({ state: 'hidden' });
      assert.equal(await draft(first).inputValue(), '');
      assert(await checkbox(first).isDisabled());
      await first.reload();await draft(first).waitFor();
      assert.equal(await draft(first).inputValue(), '');
      assert.deepEqual((await record(first)).proofChecks, []);
      assert(!(await record(first)).helped);

      const key = `mathExam.profile.partTwo.v1.${taskId}`;
      const conflictingDraft = 'Мой несохранённый довод.\nХочу сохранить эту запись.';
      await first.evaluate(key => new Promise(ready => {
        navigator.locks.request(key, () => new Promise(release => {
          window.releaseProofLock = release;
          ready();
        }));
      }), key);
      try {
        await draft(second).fill(later);
        await second.waitForFunction(async key =>
          (await navigator.locks.query()).pending.filter(lock => lock.name === key).length === 1, key);
        await draft(first).fill(conflictingDraft);
        await first.waitForFunction(async key =>
          (await navigator.locks.query()).pending.filter(lock => lock.name === key).length === 2, key);
      } finally {
        await first.evaluate(() => window.releaseProofLock());
      }
      await written(second, later);
      await first.locator('#proof-sync-warning').waitFor();
      assert.equal(await draft(first).inputValue(), conflictingDraft);

      await first.locator('#request-help').click();
      await first.locator('#feedback').waitFor();
      assert(await first.locator('#proof-sync-warning').isVisible());
      assert(await draft(first).evaluate(element => element.readOnly));
      assert.equal(await draft(first).inputValue(), conflictingDraft);
      const afterHelp = await record(first);
      assert.equal(afterHelp.drafts.proof, later);
      assert(afterHelp.helped && afterHelp.hints.includes(99));
      assert.equal(afterHelp.attemptCount, 0);

      await first.locator('.modes a[href$="/plan"]').click();
      await first.locator('.modes a[aria-current="page"][href$="/plan"]').waitFor();
      assert(await first.locator('#proof-sync-warning').isVisible());
      assert.equal(await draft(first).inputValue(), conflictingDraft);
      await first.locator('#proof-open-saved').click();
      await first.locator('#proof-sync-warning').waitFor({ state: 'hidden' });
      assert.equal(await draft(first).inputValue(), later);
      assert(!(await draft(first).evaluate(element => element.readOnly)));
      assert(await first.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  });
});
