'use strict';
// Native Chromium proof: malformed fractions must not consume the single quiz
// attempt; the same ten-question quiz must still finish and retain progress.
// Local HTTP serves the complete checkout, including root-relative assets.
// OGE8_BASE_URL=https://mathexam.space optionally checks the published bytes.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const route = '/trainers/oge-task8-powers-roots.html';
const storageKey = 'mathExamCourseProgress.v1';
const lessonKey = 'oge-t8-stepeni';
const output = path.resolve(process.env.SCREENSHOT_DIR || 'artifacts/oge8-quiz-input');
const expectedHash = process.env.OGE8_EXPECT_SHA256 || crypto.createHash('sha256')
  .update(fs.readFileSync(path.join(root, route))).digest('hex');
const utf8Bom = Buffer.from([0xef, 0xbb, 0xbf]);
const withoutLeadingBom = bytes => bytes.subarray(0, 3).equals(utf8Bom) ? bytes.subarray(3) : bytes;
fs.mkdirSync(output, { recursive: true });

// A renderer regression may loop synchronously. Bound the whole process as well
// as Playwright actions, including browser.close(), so CI cannot hang forever.
const watchdog = setTimeout(() => {
  console.error('OGE8_QUIZ_INPUT_BROWSER_TIMEOUT');
  process.exit(1);
}, 240000);
watchdog.unref();

async function serve() {
  const server = http.createServer((req, res) => {
    let file;
    try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
    catch { res.writeHead(400).end(); return; }
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (error, bytes) => {
      if (error) { res.writeHead(404).end(); return; }
      const type = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' }[path.extname(file)] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      res.end(bytes);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { server, base: 'http://127.0.0.1:' + server.address().port };
}

async function snapshot(page) {
  return page.evaluate(key => localStorage.getItem(key), storageKey);
}
async function record(page) {
  return JSON.parse(await snapshot(page) || '{}')[lessonKey];
}
async function layout(page, tag) {
  const measured = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth }));
  assert(measured.documentWidth <= measured.width + 1, tag + ' page overflow: ' + JSON.stringify(measured));
  return measured;
}

(async () => {
  let server, browser;
  const evidence = [];
  try {
    let base = process.env.OGE8_BASE_URL;
    if (base) {
      const url = new URL(base);
      assert.equal(url.protocol, 'https:', 'published check requires ordinary HTTPS');
      assert(!url.username && !url.password && !url.search && !url.hash, 'base URL must not contain credentials or query data');
    } else {
      const local = await serve(); server = local.server; base = local.base;
    }
    const url = new URL(route, base).href;
    const rawResponse = await fetch(url, { signal: AbortSignal.timeout(20000) });
    assert(rawResponse.ok, 'raw HTTP lesson loads successfully');
    const rawBytes = Buffer.from(await rawResponse.arrayBuffer());
    const actualHash = crypto.createHash('sha256').update(rawBytes).digest('hex');
    assert.equal(actualHash, expectedHash, 'raw HTTP response has the reviewed lesson bytes');
    browser = await chromium.launch({ headless: true });
    for (const width of [320, 360, 1280]) {
      const mobile = width < 640;
      const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: mobile, isMobile: mobile });
      const page = await context.newPage();
      page.setDefaultTimeout(8000);
      page.setDefaultNavigationTimeout(20000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const activate = locator => mobile ? locator.tap() : locator.click();
      try {
        const response = await page.goto(url);
        assert(response && response.ok(), 'lesson loads successfully');
        const browserBytes = await response.body();
        const browserBodySHA256 = crypto.createHash('sha256').update(browserBytes).digest('hex');
        // Chromium's text response body may omit one leading UTF-8 BOM. Keep
        // the raw SHA gate above and permit only that encoding difference.
        assert.deepEqual(withoutLeadingBom(browserBytes), withoutLeadingBom(rawBytes), 'browser receives the reviewed lesson content');
        await page.waitForFunction(() => document.documentElement.dataset.ogeAlgebraExperience === 'ready');
        assert.equal(await snapshot(page), null, 'fresh isolated context has no pupil progress');

        // A square beyond Number's finite range must stay exact, with wrapped
        // feedback rather than widening the mobile document.
        await activate(page.locator('.minimal-settings > summary'));
        await activate(page.locator('nav.tabs button[data-v="ref"]'));
        const square = '1' + '0'.repeat(310), squareRoot = '1' + '0'.repeat(155);
        const squareInput = page.locator('#sqFind');
        const findRoot = page.getByRole('button', { name: 'Найти корень', exact: true });
        await squareInput.fill(square); await activate(findRoot);
        assert.equal(await page.locator('#sqFb').innerText(), '√' + square + ' = ' + squareRoot + ' (это вне таблицы, но точный квадрат)');
        const hugeSquareLayout = await layout(page, 'large square feedback ' + width);
        await page.locator('#sqFb').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, 'large-square-' + width + '.png'), fullPage: true, animations: 'disabled' });
        const rootFeedback = [];
        for (const [value, expected] of [
          ['2', /не точный квадрат/],
          ['-4', /корень из отрицательного числа не определён/],
          ['0', /√0 = 0/]
        ]) {
          await squareInput.fill(value); await activate(findRoot);
          const message = await page.locator('#sqFb').innerText();
          assert.match(message, expected);
          await layout(page, 'square feedback ' + value + ' at ' + width);
          assert.equal(await snapshot(page), null, 'reference exploration awards no course progress');
          rootFeedback.push({ value, message });
        }
        await activate(page.locator('nav.tabs button[data-v="mar"]'));

        // Use the real first Marathon problem, answer 64 independently known
        // from sqrt(4^6). Repeated Enter must not duplicate accepted work.
        const card = page.locator('#marGrid > .mtask:not([hidden])');
        const answer = card.getByRole('textbox', { name: 'Ответ задачи № 1.1', exact: true });
        await answer.fill('64');
        await activate(card.getByRole('button', { name: 'Проверить', exact: true }));
        assert.match(await card.locator('.fb').innerText(), /верно/);
        assert.equal(await answer.getAttribute('readonly'), '');
        assert.equal(await card.getByRole('button', { name: 'Проверить', exact: true }).isEnabled(), false);
        assert.equal((await record(page)).solvedByType.rootdeg, 1);
        await answer.press('Enter'); await answer.press('Enter');
        assert.equal((await record(page)).solvedByType.rootdeg, 1, 'repeat submit does not double-count');
        const saved = await snapshot(page);
        await page.reload();
        await page.waitForFunction(() => document.documentElement.dataset.ogeAlgebraExperience === 'ready');
        assert.equal(await snapshot(page), saved, 'native browser reload retains the same saved course record');
        assert.equal((await record(page)).solvedByType.rootdeg, 1);

        await activate(page.locator('.minimal-settings > summary'));
        await activate(page.locator('nav.tabs button[data-v="quiz"]'));
        await activate(page.getByRole('button', { name: 'Начать зачёт', exact: true }));
        const unchanged = await snapshot(page);
        const quizInput = page.locator('#qBox').getByRole('textbox', { name: 'Ответ', exact: true });
        const submit = page.locator('#qBox').getByRole('button', { name: 'Ответить', exact: true });
        const rejected = [];
        for (const value of ['1/0', '0/0', '-1/0']) {
          await quizInput.fill(value);
          await activate(submit);
          const message = await page.locator('#qBox .fb').innerText();
          assert.match(message, /На ноль делить нельзя/);
          assert.equal(await quizInput.isEditable(), true);
          assert.equal(await submit.isEnabled(), true);
          assert.equal(await page.locator('#qBox .qnx').isVisible(), false);
          assert.equal(await page.locator('#qProg .qd.g, #qProg .qd.r').count(), 0, 'invalid fraction consumes no attempt');
          assert.equal(await snapshot(page), unchanged, 'invalid fraction writes no progress or error-journal entry');
          rejected.push({ value, message });
        }
        const invalidLayout = await layout(page, 'invalid answer ' + width);
        await page.locator('#qBox .fb').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, 'invalid-' + width + '.png'), fullPage: true, animations: 'disabled' });

        // Valid numeric answers may be right or wrong: both consume exactly one
        // attempt. Zero is deliberately not derived from the application's key.
        for (let index = 0; index < 10; index++) {
          await quizInput.fill('0'); await activate(submit);
          assert.equal(await quizInput.isEnabled(), false);
          assert.equal(await submit.isEnabled(), false);
          assert.match(await page.locator('#qBox .fb').innerText(), /^(Верно|Неверно)\.$/);
          assert.equal(await page.locator('#qProg .qd.g, #qProg .qd.r').count(), index + 1);
          await activate(page.locator('#qBox').getByRole('button', { name: index === 9 ? 'Итоги →' : 'Дальше →', exact: true }));
        }
        await page.locator('#view-quiz .qscore').waitFor();
        assert.match(await page.locator('#view-quiz .qscore').innerText(), /^\d+\s*\/\s*10$/);
        assert.equal(await page.locator('#view-quiz .qrow').count(), 10);
        const final = await record(page);
        assert.equal(final.runs, 1); assert.equal(final.total, 10);
        assert.equal(final.solvedByType.rootdeg, 1, 'quiz does not award Marathon credit');
        const summaryLayout = await layout(page, 'quiz summary ' + width);
        await page.locator('#view-quiz .qscore').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, 'summary-' + width + '.png'), fullPage: true, animations: 'disabled' });
        const afterQuiz = await snapshot(page);
        await page.reload();
        await page.waitForFunction(() => document.documentElement.dataset.ogeAlgebraExperience === 'ready');
        assert.equal(await snapshot(page), afterQuiz, 'quiz and solved task survive browser reload');
        assert.equal((await record(page)).runs, 1);
        assert.deepEqual(errors, [], 'no uncaught JavaScript errors');
        evidence.push({ width, height: 900, mobile, url, htmlSHA256: actualHash, browserBodySHA256, rootLookup: { squareDigits: square.length, rootDigits: squareRoot.length, exact: true, hugeSquareLayout, rootFeedback }, rejected, invalidLayout, summaryLayout, quizRows: 10, savedTaskCount: 1, quizRuns: 1, duplicateSubmitPrevented: true, nativeReloads: 2, errors });
        fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(evidence, null, 2) + '\n');
      } finally { await context.close(); }
    }
    console.log('OGE8_QUIZ_INPUT_BROWSER_OK', JSON.stringify({ widths: evidence.map(x => x.width), scenarios: evidence.length, htmlSHA256: expectedHash }));
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    clearTimeout(watchdog);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
