'use strict';
// Real native clicks with a synthetic receiver; no production cabinet request.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const helper = fs.readFileSync(path.join(ROOT, 'trainers/oge-geometry-helper.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'trainers/oge-geometry-helper.css'), 'utf8');
const cases = [
  ['oge-task15-triangles', 'oge-triangles', '#ans'],
  ['oge-task16-circle', 'oge-circle', '#ans'],
  ['oge-task17-quadrilaterals', 'oge-quadrilaterals', '#ans'],
  ['oge-task18-grid', 'oge-grid', '#ansIn'],
  ['task19-trainer', 'oge-statements', null]
];
const output = process.env.GEOMETRY_HELPER_SCREENSHOTS || path.join(os.tmpdir(), 'oge-geometry-helper-browser');
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const server = http.createServer((req, res) => {
    const relative = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const file = path.resolve(ROOT, '.' + relative);
    if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    const type = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type + '; charset=utf-8' }); res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true });
  let journeys = 0;
  try {
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport });
      context.setDefaultTimeout(15000);
      try {
        await context.route('**/*', route => {
          const url = new URL(route.request().url());
          if (url.origin === base) return route.continue();
          if (url.origin === 'https://mathexam-board-ladynata.msk1.amvera.tech' && url.pathname === '/learning/') {
            return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Synthetic receiver</title><h1>Only a local handoff test</h1>' });
          }
          return route.abort();
        });
        for (const [id, topic, inputSelector] of cases) {
          const page = await context.newPage(), errors = [];
          page.on('pageerror', error => errors.push(error.message));
          await page.goto(base + '/trainers/' + id + '.html', { waitUntil: 'load' });
          await page.addScriptTag({ content: helper }); await page.addStyleTag({ content: css });
          const details = page.locator('[data-oge-geometry-helper]');
          await details.waitFor({ state: 'visible' });
          if (inputSelector) await page.locator(inputSelector).fill('876543210987');
          await details.locator('summary').click();
          const box = await details.boundingBox();
          assert(box.x >= 0 && box.width <= viewport.width && box.x + box.width <= viewport.width + 1, id + ': helper layout');
          await page.screenshot({ path: path.join(output, id + '-' + viewport.width + '.png'), fullPage: true });
          const newTab = context.waitForEvent('page');
          await details.locator('[data-oge-helper-transfer]').click();
          const received = await newTab;
          await received.waitForLoadState('load');
          const url = new URL(received.url()), params = new URLSearchParams(url.hash.slice(1));
          assert.equal(url.origin, 'https://mathexam-board-ladynata.msk1.amvera.tech');
          assert.equal(params.get('geometry-help'), topic); assert.equal(params.get('from'), id);
          assert(!params.get('question').includes('876543210987'));
          // Playwright may retain opener target metadata even with noopener;
          // the browser-visible reference is the security property we need.
          assert.equal(await received.evaluate(() => window.opener === null), true, id + ': no opener');
          if (inputSelector) {
            assert.equal(await page.locator(inputSelector).inputValue(), '876543210987');
            assert.equal(await page.locator(inputSelector).isEnabled(), true);
          }
          const helped = await page.evaluate(id => id === 'oge-task15-triangles' ? window.__oge15.debug().tr.hinted === true
            : id === 'task19-trainer' ? JSON.parse(localStorage.getItem('mathExam.task19.visualHints.v1')).current.helpUsed
              : window.OgeGeometryHelpUsed, id);
          assert.equal(helped, true); assert.deepEqual(errors, []);
          journeys++; await received.close(); await page.close();
          console.log('PASS ' + id + ' ' + viewport.width);
        }
      } finally { await context.close(); }
    }
    console.log('OGE_GEOMETRY_HELPER_BROWSER_OK ' + journeys + ' desktop/mobile native handoffs; synthetic receiver only');
    console.log('Screenshots: ' + output);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
