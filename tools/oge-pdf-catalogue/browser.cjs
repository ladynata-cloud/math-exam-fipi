'use strict';
// Static candidate checks or explicit read-only HTTPS production verification.
// No accounts, learner data or third-party page requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const destination = '/oge/variants/2027/';
const output = process.env.QA_OUTPUT_DIR || path.join(root, 'artifacts/oge-pdf-catalogue');
const widths = [320, 375, 570, 571, 678, 679, 680, 768, 850, 851, 1003, 1004, 1005, 1280];
const manifest = JSON.parse(fs.readFileSync(path.join(root, destination, 'manifest.json'), 'utf8'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const types = {'.html': 'text/html; charset=utf-8', '.pdf': 'application/pdf', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json'};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});

(async () => {
  let browser;
  const report = {status: 'RUNNING', widths, pdf_http_hash_checks: 0, label_measurements: 0,
    filter_checks: 0, search_checks: 0, entry_clicks: 0, layouts: [], page_errors: []};
  fs.mkdirSync(output, {recursive: true});
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = process.env.QA_ORIGIN || `http://127.0.0.1:${server.address().port}`;
    assert(!process.env.QA_ORIGIN || origin === 'https://mathexam.space', 'Unexpected production origin');
    report.origin = origin;
    report.source_commit = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
    for (const javaScriptEnabled of [true, false]) {
      browser = await chromium.launch({headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
      report.browser = browser.version();
      const context = await browser.newContext({javaScriptEnabled});
      await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      const page = await context.newPage();
      page.on('pageerror', error => report.page_errors.push(error.message));
      await page.goto(origin + destination);
      const hrefs = await page.locator('a[type="application/pdf"]').evaluateAll(links => links.map(a => a.getAttribute('href')));
      assert.equal(hrefs.length, 315);
      assert.equal(new Set(hrefs).size, 315);
      if (javaScriptEnabled) {
        for (const href of hrefs) {
          const response = await context.request.get(origin + destination + href);
          assert.equal(response.status(), 200, href);
          assert(response.headers()['content-type'].startsWith('application/pdf'), href);
          const bytes = await response.body();
          assert.equal(bytes.subarray(0, 5).toString(), '%PDF-', href);
          assert.equal(hash(bytes), hash(fs.readFileSync(path.join(root, destination, href))), href);
          report.pdf_http_hash_checks++;
        }
        for (const family of Object.keys(manifest.family_counts)) {
          await page.locator('#story').selectOption(family);
          const numbers = await page.locator('.card:visible').evaluateAll(cards => cards.map(c => Number(c.dataset.number)));
          assert.deepEqual(numbers, manifest.variants.filter(v => v.type === family).map(v => v.number));
          assert.equal(numbers.length, 13);
          report.filter_checks++;
        }
        await page.locator('#story').selectOption('');
        for (let number = 1; number <= 104; number++) {
          await page.locator('#variant-number').fill(String(number));
          assert.deepEqual(await page.locator('.card:visible').evaluateAll(cards => cards.map(c => Number(c.dataset.number))), [number]);
          report.search_checks++;
        }
        for (const invalid of ['0', '105', 'abc']) {
          await page.locator('#variant-number').fill(invalid);
          assert.equal(await page.locator('.card:visible').count(), 0);
          assert(await page.locator('#empty').isVisible());
          await page.locator('#clear').click();
          assert.equal(await page.locator('.card:visible').count(), 104);
        }
        await page.locator('#story').selectOption('paper');
        await page.locator('#variant-number').fill('1');
        assert.equal(await page.locator('.card:visible').count(), 0);
        await page.locator('#clear').click();
      } else {
        assert.equal(await page.locator('.card:visible').count(), 104);
        assert.equal(await page.locator('#filters').isVisible(), false);
      }

      for (const width of widths) {
        await page.setViewportSize({width, height: 900});
        const layout = await page.evaluate(() => {
          const labels = [...document.querySelectorAll('.file-links a')].map(a => {
            const rect = a.getBoundingClientRect();
            const range = document.createRange(); range.selectNodeContents(a.firstChild);
            const text = range.getBoundingClientRect();
            const css = getComputedStyle(a);
            return {href: a.getAttribute('href'), width: rect.width, height: rect.height,
              left: text.left - rect.left - parseFloat(css.borderLeftWidth),
              right: rect.right - parseFloat(css.borderRightWidth) - text.right,
              font: parseFloat(css.fontSize)};
          });
          return {client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, labels};
        });
        const bad = layout.labels.filter(x => x.left < -.25 || x.right < -.25 || x.width < 70 || x.height < 44 || x.font < 15);
        report.label_measurements += layout.labels.length;
        report.layouts.push({width, javaScriptEnabled, client: layout.client, scroll: layout.scroll,
          min_width: Math.min(...layout.labels.map(x => x.width)), min_label_margin: Math.min(...layout.labels.flatMap(x => [x.left, x.right])), failures: bad.length});
        if (bad.length || layout.scroll > layout.client) {
          await page.locator('.card').first().screenshot({path: path.join(output, `failure-${width}-${javaScriptEnabled}.png`)});
        }
        assert.equal(layout.scroll, layout.client, `horizontal page overflow at ${width}`);
        assert.equal(bad.length, 0, `button text or touch target at ${width}, JS=${javaScriptEnabled}: ${JSON.stringify(bad.slice(0, 3))}`);
        if (javaScriptEnabled && [320, 571, 851, 1280].includes(width)) {
          await page.screenshot({path: path.join(output, `viewport-${width}.png`)});
          await page.locator('.card').first().screenshot({path: path.join(output, `card-${width}.png`)});
        }
      }
      for (const width of [320, 1280]) {
        await page.setViewportSize({width, height: 900});
        for (const source of ['/', '/oge/']) {
          await page.goto(origin + source);
          await page.locator(`a[href="${destination}"]`).first().click();
          await page.waitForURL(origin + destination);
          assert.equal(await page.locator('.card').count(), 104);
          report.entry_clicks++;
        }
      }
      await context.close();
      await browser.close();
      browser = null;
    }
    assert.deepEqual(report.page_errors, []);
    report.status = 'PASS';
    report.gate = process.env.QA_ORIGIN ? 'OGE_104_CATALOGUE_LIVE_BROWSER_OK' : 'OGE_104_CATALOGUE_BROWSER_OK';
    console.log(JSON.stringify({...report, layouts: `${report.layouts.length} layouts`}));
  } catch (error) {
    report.status = 'FAIL'; report.error = String(error);
    throw error;
  } finally {
    fs.writeFileSync(path.join(output, 'browser.json'), JSON.stringify(report, null, 2) + '\n');
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
