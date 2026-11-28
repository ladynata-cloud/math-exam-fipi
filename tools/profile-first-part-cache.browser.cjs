'use strict';

// Same-origin navigations in ONE Chromium context. Playwright routing disables
// the HTTP cache, so the local server switches from old to current bytes instead.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { createServer } = require('node:http');
const { extname, resolve, sep } = require('node:path');
const { chromium } = require('playwright');
const map = require('../ege-profil/exam-map.js');

const root = resolve(__dirname, '..');
const start = '/ege-profil/start/';
const course = start + 'index.html';
const sections = map.entries.filter(entry => entry.part === 1);
const wrappers = [...sections.map(entry => entry.id), 'random-variables', 'log-trig'];
const courseStamp = '20261118-opposites';
const wrapperStamp = '20261115-fipi-map';
const oldStamps = {
  'app.js': [courseStamp, wrapperStamp],
  'calm-ui.js': [courseStamp, wrapperStamp],
  'board-session.js': [wrapperStamp],
  'applied-tasks.js': ['20261010-readable-help']
};
const oldRef = 'c385a8bc179119d7462e4bbc6e29b1d3576a90ff';
const oldBlobs = {
  'app.js': 'b997bfa0f0cfb5095af44e1c5090514aa4d93e5e',
  'calm-ui.js': '68af122e668072a145d214b5b9633c97b94160f7',
  'board-session.js': '9b4eb521840f3f5edf8a6b8deb038b58035b53b1',
  'applied-tasks.js': '30fe954fb100c18604b842e9efc3e6aa2cf484d4'
};

async function oldScript(name) {
  let bytes;
  if (process.env.PROFILE_CACHE_OLD_DIR) {
    bytes = readFileSync(resolve(process.env.PROFILE_CACHE_OLD_DIR, name));
  } else {
    const path = start.slice(1) + name;
    try {
      bytes = execFileSync('git', ['show', oldRef + ':' + path], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
      // A fresh Actions checkout has no history. Read just the immutable public
      // fixture, and verify its Git object ID before serving it to the browser.
      const url = 'https://raw.githubusercontent.com/ladynata-cloud/math-exam-fipi/' + oldRef + '/' + path;
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      assert(response.ok, 'Cannot load historical ' + name + ' (HTTP ' + response.status + ')');
      bytes = Buffer.from(await response.arrayBuffer());
    }
  }
  const blob = createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
  assert.equal(blob, oldBlobs[name], 'Exact pre-779 Git blob for ' + name);
  return bytes;
}

const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };

async function oldScriptLoads(frame, staleUrls) {
  return frame.evaluate(urls => performance.getEntriesByType('resource')
    .filter(entry => entry.initiatorType === 'script')
    .map(entry => {
      const url = new URL(entry.name);
      return { path: url.pathname + url.search, bytesTransferred: entry.transferSize };
    })
    .filter(entry => urls.includes(entry.path)), staleUrls);
}

async function verifyWarmCache(browser) {
  const oldBodies = new Map();
  for (const [name, stamps] of Object.entries(oldStamps)) {
    const bytes = await oldScript(name);
    for (const stamp of stamps) oldBodies.set(start + name + '?v=' + stamp, bytes);
  }
  const staleUrls = [...oldBodies.keys()];
  let seeding = true;
  const oldRequests = [];
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (oldBodies.has(request.url)) oldRequests.push(request.url);
    response.setHeader('Content-Security-Policy', "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
    response.setHeader('Cache-Control', 'no-store');
    if (seeding && oldBodies.has(request.url)) {
      response.setHeader('Cache-Control', 'public, max-age=600');
      response.writeHead(200, { 'Content-Type': 'text/javascript' }).end(oldBodies.get(request.url));
      return;
    }
    if (url.pathname === '/cache-test.html') {
      response.writeHead(200, { 'Content-Type': 'text/html' }).end('<!doctype html><iframe></iframe>');
      return;
    }
    const file = resolve(root, '.' + url.pathname);
    if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    try {
      let body = readFileSync(file);
      if (url.pathname === course && url.searchParams.has('negative-control')) {
        // Reintroduce the old public URLs in this response only. The server
        // already serves current JS for all URLs, just like after deployment.
        body = body.toString().replace(/(src=")(app\.js|calm-ui\.js|applied-tasks\.js)\?[^"]+"/g,
          (_, prefix, name) => prefix + name + '?v=' + oldStamps[name][0] + '"');
      }
      response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }).end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise((yes, no) => server.once('error', no).listen(0, '127.0.0.1', yes));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(origin + '/cache-test.html');
    await page.evaluate(async urls => {
      for (const url of urls) {
        const result = await fetch(url);
        if (!result.ok) throw Error('Cannot seed ' + url);
        await result.text();
      }
    }, staleUrls);
    seeding = false;
    await page.goto(origin + course + '?negative-control#fipi/2027/10');
    const cached = await oldScriptLoads(page, staleUrls);
    assert.deepEqual(cached.map(entry => entry.path).sort(),
      ['app.js', 'calm-ui.js', 'applied-tasks.js'].map(name => start + name + '?v=' + oldStamps[name][0]).sort(),
      'negative control must load the three original public URLs as scripts');
    assert(cached.every(entry => entry.bytesTransferred === 0), 'Chromium reused cached responses');
    assert.equal(await page.locator('#main h1').innerText(), map.get(10).title, 'old scripts still render the requested page');
    assert.equal(await page.locator('#main a.board-link').count(), 0, 'old URL control misses the №10 board link');

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + course);
    for (const entry of sections) {
      const hash = map.hash(entry);
      const cardLink = page.locator('[data-calm-exam="' + entry.number + '"] a[href="' + hash + '"]');
      await cardLink.click();
      const link = page.locator('#main a.board-link');
      const url = new URL(await link.getAttribute('href'), origin);
      assert.equal(url.pathname, '/trainers/trainer-board.html');
      assert.equal(url.searchParams.get('trainer'), course + (entry.number === 2 ? '#exam/2' : hash));
      assert.deepEqual(await oldScriptLoads(page, staleUrls), []);
      await page.goBack();
    }

    await page.goto(origin + '/cache-test.html');
    const frame = page.frames().find(item => item.parentFrame() === page.mainFrame());
    for (const entry of sections) {
      await frame.goto(origin + course + map.hash(entry));
      const title = entry.number === 2 ? 'Векторы с нуля' : entry.title;
      await frame.getByRole('heading', { level: 1, name: title, exact: true }).waitFor();
      assert.equal(await frame.locator('#main a.board-link').count(), 0, 'no nested board launch');
      assert.deepEqual(await oldScriptLoads(frame, staleUrls), []);
    }
    for (const slug of wrappers) {
      await frame.goto(origin + '/trainers/ege-profile-' + slug + '.html');
      const status = await frame.evaluate(() => {
        const keys = Object.keys(window).filter(key => /^__profile\w+Board$/.test(key));
        const api = keys.length === 1 && window[keys[0]];
        return { marker: document.body.dataset.profileBoard, ready: Boolean(api && api.validateState(api.getState())) };
      });
      assert.deepEqual(status, { marker: slug, ready: true }, slug);
      assert.deepEqual(await oldScriptLoads(frame, staleUrls), [], slug);
    }
    assert.deepEqual(errors, [], 'no runtime errors after switching to corrected HTML');
    assert.deepEqual(oldRequests.sort(), staleUrls.sort(), 'negative control read cached responses without contacting the server again');
    console.log('PASS warm HTTP cache: negative control, all 12 course board links, iframe isolation, 14 structured adapters.');
  } finally {
    await context.close();
    await new Promise(yes => server.close(yes));
  }
}

module.exports = { verifyWarmCache };

if (require.main === module) {
  (async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.BROWSER_EXECUTABLE_PATH });
    try { await verifyWarmCache(browser); } finally { await browser.close(); }
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
