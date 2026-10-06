'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = process.env.OGE_FOCUS_SCREENSHOTS;
const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    let file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' })[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const width of [1280, 375]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.route('https://fonts.googleapis.com/**', route => route.abort());
      await context.route('https://fonts.gstatic.com/**', route => route.abort());
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin + '/');
      await page.evaluate(() => localStorage.setItem('mathExamCourseProgress.v1', JSON.stringify({ ogeBasicsDecimals: { best: 3 } })));
      for (const [url, name] of [['/', 'home'], ['/laboratory/', 'laboratory'], ['/trainers/oge-basics/', 'foundations'], ['/trainers/oge-course/', 'oge-course'], ['/oge/', 'oge-hub']]) {
        await page.goto(origin + url);
        await page.locator('h1').waitFor();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Page overflow: ' + name + ' at ' + width);
        if (output && ['home', 'laboratory', 'foundations'].includes(name)) {
          fs.mkdirSync(output, { recursive: true });
          await page.screenshot({ path: path.join(output, name + '-' + width + '.png'), fullPage: true });
        }
      }
      await page.goto(origin + '/');
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').getAttribute('href'), '#main-content', 'Keyboard skip link is first');
      await page.locator('footer a[href="/laboratory/"]').click();
      await page.waitForURL(origin + '/laboratory/');
      assert.equal(await page.locator('h1').innerText(), 'Лаборатория репетитора');
      await page.locator('.site-nav a[href="/trainers/oge-basics/"]').click();
      await page.waitForURL(origin + '/trainers/oge-basics/');
      assert.equal(await page.locator('[data-topic="ogeBasicsDecimals"] .topic-progress').innerText(), '3/5');
      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('mathExamCourseProgress.v1'))), { ogeBasicsDecimals: { best: 3 } });
      const division = page.locator('.map-hero .btn.primary');
      assert((await division.getAttribute('href')).endsWith('long-division-from-simple-to-decimals.html'));
      await division.click();
      await page.waitForURL('**/long-division-from-simple-to-decimals.html');
      await page.locator('h1').waitFor();
      await context.close();
    }
    assert.deepEqual(errors, []);
    console.log('OGE_FOCUS_BROWSER_OK: 10 desktop/mobile page layouts, keyboard entry, lab → foundations → canonical division, existing progress preserved.');
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
