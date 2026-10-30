'use strict';

// Public navigation only: local static files, isolated storage, no real accounts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const targets = [
  '/trainers/oge-basics/multiplication-division/multiplication-mixed.html',
  '/trainers/oge-basics/multiplication-division/multiplication-pythagoras-table.html',
  '/trainers/oge-basics/multiplication-division/multiplication-tricks.html',
  '/trainers/grade6-nok.html',
  '/trainers/grade6-nod.html',
];
const legacy = ['index.html', 'pythagoras.html', 'times-9.html'];
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
    for (const javaScriptEnabled of [true, false]) {
      const context = await browser.newContext({ javaScriptEnabled });
      await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (let i = 0; i < legacy.length; i++) {
        await page.goto(`${origin}/trainers/multiplication-table/${legacy[i]}?source=compat-check#saved-route`, { waitUntil: 'commit' });
        await page.waitForURL(url => url.pathname === targets[i]);
        const url = new URL(page.url());
        assert.equal(url.search, javaScriptEnabled ? '?source=compat-check' : '');
        assert.equal(url.hash, javaScriptEnabled ? '#saved-route' : '');
        assert((await page.locator('h1').first().innerText()).trim());
      }
      for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        for (const target of targets) {
          await page.goto(`${origin}/trainers/`);
          const links = page.locator('#catalog .actions a');
          const hrefs = await links.evaluateAll(elements => elements.map(a => new URL(a.href).pathname));
          const index = hrefs.indexOf(target);
          assert(index >= 0, `missing catalog destination: ${target}`);
          await Promise.all([page.waitForURL(url => url.pathname === target), links.nth(index).click()]);
          assert((await page.locator('h1').first().innerText()).trim());
          if (javaScriptEnabled && target.includes('grade6-')) {
            await page.locator('#trainer button').first().waitFor();
            assert.equal(await page.locator('.public-explanation').isVisible(), true);
            await page.goto(`${origin}/trainers/`);
            await page.setContent(`<iframe title="Embedded practice" src="${origin}${target}" style="width:100%;height:800px"></iframe>`);
            const frame = page.frameLocator('iframe');
            await frame.locator('#trainer button').first().waitFor();
            assert.equal(await frame.locator('.public-explanation').isVisible(), false);
          }
        }
      }
      assert.deepEqual(errors, [], 'public navigation must not raise JavaScript errors');
      await context.close();
    }
    console.log('SEO_ENTRYPOINTS_BROWSER_OK: 6 compatibility routes and 30 catalog clicks; 320/390/1280 px; public/embedded NOK/NOD.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
