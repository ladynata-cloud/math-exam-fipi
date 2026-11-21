'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((request, response) => {
  const file = path.resolve(root, '.' + new URL(request.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
  try {
    response.setHeader('Content-Type', {'.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript'}[path.extname(file)] || 'application/octet-stream');
    response.end(fs.readFileSync(file));
  } catch { response.writeHead(404); response.end(); }
});
async function state(page) { return page.evaluate(() => {const state = window.__divisionGuidedDebug.state(); return state.sessions[state.active];}); }
async function finish(page) {
  for (let guard = 0; guard < 180; guard++) {
    const next = await page.evaluate(() => { const s = window.__divisionGuidedDebug.state(); const session = s.sessions[s.active]; return session.done ? null : window.__divisionGuidedDebug.plan().actions[session.step]; });
    if (!next) return;
    if (next.options) await page.locator('[data-option="' + next.answer + '"]').click();
    else await page.locator('#answer').fill(next.answer);
    await page.locator('#primary').click();
  }
  throw Error('Division did not finish');
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
  try {
    for (const width of [320, 1280]) {
      const context = await browser.newContext({viewport:{width, height:900}});
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(base + '/trainers/long-division-stepwise.html?multiples=build#twoDigit');
      await page.waitForFunction(() => window.__divisionGuidedDebug);
      assert.equal(await page.locator('#multiples-builder input').count(), 9);
      assert.equal((await state(page)).hints, 1);
      await page.locator('[data-multiple-check="1"]').click();
      assert.equal((await state(page)).errors, 0, 'blank row is not a mathematical error');
      await page.locator('[data-multiple-input="1"]').fill('35');
      await page.locator('[data-multiple-check="1"]').click();
      assert.equal((await state(page)).multiples.checked[0], false);
      assert.equal((await state(page)).errors, 1);
      await page.locator('[data-multiple-input="1"]').fill('36');
      await page.locator('[data-multiple-input="1"]').press('Enter');
      await page.reload();
      await page.waitForFunction(() => window.__divisionGuidedDebug);
      assert.equal((await state(page)).multiples.values[0], '36');
      assert.equal(await page.locator('[data-multiple-input="1"]').getAttribute('readonly'), '');
      assert.equal((await state(page)).hints, 1);
      if (process.env.DIVISION_SCREENSHOTS) {
        fs.mkdirSync(process.env.DIVISION_SCREENSHOTS, {recursive:true});
        await page.screenshot({path:path.join(process.env.DIVISION_SCREENSHOTS, 'multiples-open-' + width + '.png'), fullPage:true});
      }
      for (let n = 2; n <= 9; n++) {
        await page.locator('[data-multiple-input="' + n + '"]').fill(String(36 * n));
        await page.locator('[data-multiple-check="' + n + '"]').click();
      }
      assert.equal(await page.locator('#multiples-builder').getAttribute('open'), null, 'completed table folds away');
      assert((await state(page)).multiples.checked.every(Boolean));
      await page.locator('#multiples-builder summary').click();
      assert.equal(await page.locator('[data-multiple-input="9"]').inputValue(), '324');
      await page.locator('#multiples-builder summary').click();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no page overflow at ' + width);
      await finish(page);
      assert.match(await page.locator('#topic-progress').innerText(), /без подсказок: 0/);
      await page.locator('#next-without-multiples').click();
      assert.equal((await state(page)).multiples, undefined);
      assert.equal((await state(page)).hints, 0);
      assert.equal(await page.locator('#multiples-builder').isVisible(), false);
      assert(!page.url().includes('multiples=build'));
      assert.equal(await page.locator('#division-learning-route a').first().getAttribute('href'), '/trainers/oge-basics/multiplication-division/division-path.html');
      if (process.env.DIVISION_SCREENSHOTS) await page.screenshot({path:path.join(process.env.DIVISION_SCREENSHOTS, 'division-without-table-' + width + '.png'), fullPage:true});
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log('DIVISION_PROGRESSION_BROWSER_OK: 320/1280 px; pupil-built multiples; incorrect/empty input; reload; supported progress; unassisted continuation; no overflow');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
