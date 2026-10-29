'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');

const root = path.resolve(__dirname, '..');
const route = '/trainers/oge-basics/multiplication-division/decimal-divisor-shift.html';
const key = 'mathExamBasics.decimal-divisor-shift.v1';
const legacy = {independent:11, supported:2, reviewed:1, best:2, sentinel:'preserve'};
const shared = {otherTopic:{solved:7}, sentinel:'preserve'};
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + new URL(req.url,'http://fixture').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try {
    res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});
const state = page => page.evaluate(() => window.__trainerDebug.state());
async function check(page, value) {
  await page.locator('#answerArea input').fill(value);
  await page.locator('#answerArea input').press('Enter');
}
async function help(page, expected) {
  await page.locator('.bh-toggle').click();
  const hint = await page.locator('[data-bh-node="root"] #hintStack').innerText();
  for (const text of expected) assert(hint.includes(text), 'Current hint should include ' + text + ': ' + hint);
  assert.doesNotMatch(hint, /4,8|0,6|прямым вычислением/);
  await page.locator('.bh-close').click();
}
async function reflow(page, width) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), width + ': no horizontal page overflow');
}
async function shot(page, name) {
  if (!process.env.DIVISION_SCREENSHOTS) return;
  fs.mkdirSync(process.env.DIVISION_SCREENSHOTS, {recursive:true});
  await page.screenshot({path:path.join(process.env.DIVISION_SCREENSHOTS, 'decimal-entry-' + name + '.png'), fullPage:true});
}
async function prepare(page) {
  assert.equal(await page.locator('#taskTitle').innerText(), '21,44 : 6,7');
  assert.equal(await page.locator('#divisionBoard').isVisible(), false);
  assert.equal(await page.locator('#partialPanel').isVisible(), false);
  assert.equal(await page.locator('#normalizeDividend').innerText(), '21,44 × ? = ?');
  assert.equal(await page.locator('#normalizeDivisor').innerText(), '6,7 × ? = ?');
  assert.equal(await page.locator('#normalizeEquation').isVisible(), false);
  await check(page, '2');
  assert.equal((await state(page)).phase, 'shiftCount', 'Wrong shift cannot reveal the converted board');
  await help(page, ['6,7','21,44','цифры справа']);
  await check(page, '1');
  assert.equal((await state(page)).phase, 'shiftDividend');
  assert.equal(await page.locator('#normalizeDividend').innerText(), '21,44 × 10 = ?');
  assert.equal(await page.locator('#normalizeDivisor').innerText(), '6,7 × 10 = ?');
  await help(page, ['21,44','10','вправо']);
  await check(page, '214.4');
  assert.equal((await state(page)).phase, 'shiftDivisor');
  assert.equal(await page.locator('#normalizeDividend').innerText(), '21,44 × 10 = 214,4');
  assert.equal(await page.locator('#normalizeDivisor').innerText(), '6,7 × 10 = ?');
  assert.equal(await page.locator('#divisionBoard').isVisible(), false);
  await help(page, ['214,4','6,7','10']);
  await check(page, '6,7');
  assert.equal((await state(page)).phase, 'shiftDivisor');
  assert.equal(await page.locator('#divisionBoard').isVisible(), false);
  await check(page, '67');
  assert.equal((await state(page)).phase, 'digit');
  assert.equal(await page.locator('#taskTitle').innerText(), '21,44 : 6,7', 'Original expression remains unchanged');
  assert.equal(await page.locator('#normalizeDivisor').innerText(), '6,7 × 10 = 67');
  assert.equal(await page.locator('#normalizeEquation').innerText(), '21,44 : 6,7 = 214,4 : 67');
  assert.equal(await page.locator('#divisionBoard').isVisible(), true);
  assert.equal(await page.locator('#partialPanel').isVisible(), true);
  assert.equal(await page.locator('#dividendDisplay').innerText(), '214,4');
  assert.equal(await page.locator('#divisorDisplay').innerText(), '67');
}

(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
  const failures = [];
  try {
    for (const width of [1280,390,320]) {
      const context = await browser.newContext({viewport:{width,height:950}});
      const page = await context.newPage();
      page.on('pageerror', e => failures.push(e.message));
      await page.addInitScript(({key,legacy,shared}) => {
        // The production generator makes 21,44 : 6,7 (214,4 : 67), without
        // replacing its task structure or introducing test-only app hooks.
        const values = [0,55.5 / 78,0.75,21.5 / 89];
        Math.random = () => values.length ? values.shift() : 0.5;
        if (!localStorage.getItem(key)) localStorage.setItem(key,JSON.stringify(legacy));
        if (!localStorage.getItem('mathExamCourseProgress.v1')) localStorage.setItem('mathExamCourseProgress.v1',JSON.stringify(shared));
      }, {key,legacy,shared});
      await page.goto(origin + route);
      await page.locator('body[data-basics-standalone="division"]').waitFor();
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://mathexam.space' + route);
      assert.match(await page.locator('meta[name="description"]').getAttribute('content'), /обоих числах/);
      await reflow(page,width); await shot(page,width + '-original');
      await prepare(page);
      await reflow(page,width); await shot(page,width + '-converted');
      assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)),key),legacy, 'Preparing the display does not change persisted progress');
      if (width === 1280) {
        await page.locator('.multiple').nth(3).click();
        assert.equal((await state(page)).phase,'product');
        await help(page,['3','67','умножаем']);
        await check(page,'201');
        await help(page,['214','201','вычтите']);
        await check(page,'13');
        await help(page,['13','4','134']);
        await page.locator('#bringBtn').click();
        assert.equal((await state(page)).phase,'comma');
        await help(page,['214,4','целой части 3']);
        await page.locator('#commaBtn').click();
        await page.locator('.multiple').nth(2).click();
        await check(page,'134'); await check(page,'0');
        assert.equal((await state(page)).phase,'done');
        assert.match(await page.locator('#feedback').innerText(), /3,2/);
        assert.equal((await state(page)).supported,3);
        assert.equal((await state(page)).independent,11);
        const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)),key);
        assert.equal(saved.sentinel, 'preserve');
        assert.equal(saved.supported,3);
        const sharedSaved = await page.evaluate(() => JSON.parse(localStorage.getItem('mathExamCourseProgress.v1')));
        assert.deepEqual(sharedSaved.otherTopic,shared.otherTopic);
        assert.equal(sharedSaved.sentinel,'preserve');
        await page.reload();
        await page.locator('body[data-basics-standalone="division"]').waitFor();
        assert.equal((await state(page)).supported,3, 'Original storage contract survives reload');
        assert.equal(await page.locator('#divisionBoard').isVisible(),false);
      }
      await context.close();
    }
    // The page-local rendering stays inactive in saved teacher/learner tasks.
    const managed = await browser.newPage();
    managed.on('pageerror', e => failures.push(e.message));
    await managed.goto(origin + route + '?learning=1');
    await managed.waitForFunction(() => window.MathExamRemediationManaged && window.MathExamRemediation);
    assert.equal(await managed.evaluate(() => typeof window.__trainerDebug), 'undefined');
    assert.equal(await managed.locator('#view-practice').isVisible(),false);
    await managed.close();
    assert.deepEqual(failures,[]);
    console.log('DECIMAL_DIVISOR_ENTRY_BROWSER_OK: original operands, earned conversion of both numbers, no premature/mixed board, contextual hints, exact completion, storage, managed-mode isolation, 320/390/1280px.');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
