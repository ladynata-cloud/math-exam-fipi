'use strict';
// Public-entry integration boundaries. The existing guided suites cover the
// complete learning sequence and notebook geometry on each route.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');
const G = require('../trainers/oge-basics/multiplication-division/division-guided-core');
const root = path.resolve(__dirname, '..');
const shortPath = '/trainers/long-division-stepwise.html';
const deepPath = '/trainers/oge-basics/multiplication-division/long-division-from-simple-to-decimals.html';
const canonical = 'https://mathexam.space' + shortPath;
const guidedKey = 'mathExamBasics.guidedDivision.v1';
const legacyKey = 'mathExamCourseProgress.v1';
const legacyValue = JSON.stringify({topics:{longDivisionStepwise:{total:7,right:6,streak:2,history:[{text:'48 : 2 = 24'}]}},sentinel:'keep-old-progress'});
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.xml':'application/xml; charset=utf-8'};
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://fixture').pathname;
  if (pathname === '/blank') return res.writeHead(200, {'Content-Type':'text/html'}).end('<!doctype html><title>Fixture</title>');
  if (pathname === '/favicon.ico') return res.writeHead(204).end();
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try {
    const resolved = fs.statSync(file).isDirectory() ? path.join(file, 'index.html') : file;
    res.setHeader('Content-Type', mime[path.extname(resolved)] || 'application/octet-stream');
    res.end(fs.readFileSync(resolved));
  } catch (_) { res.writeHead(404).end(); }
});

function observe(page, label, failures) {
  page.on('pageerror', error => failures.push(label + ': ' + error.message));
  page.on('requestfailed', request => failures.push(label + ': ' + request.url() + ' ' + request.failure()?.errorText));
  page.on('response', response => { if (response.status() >= 400) failures.push(label + ': HTTP ' + response.status() + ' ' + response.url()); });
}
async function ready(page, url) {
  await page.goto(url, {waitUntil:'networkidle'});
  await page.waitForFunction(() => window.__divisionGuidedDebug);
}
const snapshot = page => page.evaluate(() => window.__divisionGuidedDebug.state());
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), guidedKey);
async function checkCanonical(page) {
  assert.deepEqual(await page.locator('link[rel="canonical"]').evaluateAll(nodes => nodes.map(node => node.href)), [canonical]);
  assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), canonical);
}
async function continueWith(page, value) {
  const before = await snapshot(page), previous = before.sessions[before.active];
  await page.locator('#answer').fill(value);
  await page.locator('#primary').click();
  const state = await snapshot(page), current = state.sessions[state.active];
  assert.equal(current.answers.length, previous.answers.length + 1, 'One check records one answer');
  assert.equal(current.step, previous.step + 1, 'One check advances to the next question');
  assert.equal(current.accepted, false);
  assert.equal(current.draft, '');
}
async function finishInitialExample(page) {
  for (let turn = 0; turn < 80; turn++) {
    const state = await snapshot(page), session = state.sessions[state.active];
    if (session.done) return;
    if (!session.accepted) {
      const action = G.plan(session.task).actions[session.step];
      if (action.options) await page.locator('[data-option="' + action.answer + '"]').click();
      else await page.locator('#answer').fill(action.answer);
    }
    await page.locator('#primary').click();
  }
  throw Error('The standalone initial example did not finish');
}
function existingLocalTarget(url, origin) {
  const target = new URL(url);
  assert.equal(target.origin, origin, 'Public assets and default links stay on the local site: ' + url);
  const file = path.resolve(root, '.' + target.pathname);
  assert(file.startsWith(root + path.sep), 'Target remains inside the repository');
  assert(fs.existsSync(file), 'Missing public-entry target: ' + target.pathname);
  if (fs.statSync(file).isDirectory()) assert(fs.existsSync(path.join(file, 'index.html')), 'Directory link needs an index: ' + target.pathname);
}

(async () => {
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.equal(locations.filter(url => url === canonical).length, 1, 'The public entry appears once in the sitemap');
  assert(!locations.includes('https://mathexam.space' + deepPath), 'The duplicate route is not a second sitemap destination');

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  const failures = [];
  try {
    browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
    const context = await browser.newContext({viewport:{width:1280,height:900}});
    const page = await context.newPage();
    observe(page, 'public entries', failures);
    // Seed once on this origin; an init script would overwrite storage at every
    // navigation and could conceal a migration or an accidental reset.
    await page.goto(origin + '/blank');
    await page.evaluate(({key,value}) => localStorage.setItem(key,value), {key:legacyKey,value:legacyValue});
    await ready(page, origin + shortPath);
    await checkCanonical(page);
    assert.equal(await page.locator('#problem').innerText(), '48 : 2');
    assert.equal(await page.locator('#answer').isVisible(), true);
    assert.equal(await page.locator('#notebook .right-side').isVisible(), true, 'The indexed entry renders the real corner layout');

    await ready(page, origin + deepPath);
    await checkCanonical(page);
    await continueWith(page, '4'); // First partial dividend.
    await continueWith(page, '2'); // Number of quotient digits.
    await continueWith(page, '2'); // First quotient digit.
    const toggle = page.locator('.bh-toggle');
    await toggle.waitFor({state:'visible'});
    await toggle.click();
    assert.equal(await page.locator('#help-content').isVisible(), true);
    await page.locator('#answer').fill('4'); // Keep the multiplication unfinished.
    const before = await snapshot(page), durable = await stored(page);
    assert.equal(before.sessions.start.done, false);
    assert.equal(before.sessions.start.accepted, false);
    assert.equal(before.sessions.start.draft, '4');
    assert(before.sessions.start.hints > 0, 'The transition must preserve a real use of help');
    assert(before.sessions.start.answers.length > 0, 'The transition must preserve prior accepted work');

    for (const route of [shortPath, deepPath]) {
      await ready(page, origin + route);
      assert.deepEqual(await snapshot(page), before, 'Unfinished guided state survives navigation to ' + route);
      assert.deepEqual(await stored(page), durable, 'Stored task, answers, draft and help counts survive ' + route);
      assert.equal(await page.locator('#answer').inputValue(), '4');
      assert.equal(await page.evaluate(key => localStorage.getItem(key), legacyKey), legacyValue, 'Legacy progress must remain untouched');
    }

    await ready(page, origin + shortPath + '?course=preoge#zero');
    assert.equal((await snapshot(page)).active, 'zero');
    assert.equal(await page.locator('#problem').innerText(), '1005 : 5');
    assert.equal(await page.locator('#course-navigation').isVisible(), true);
    for (const id of ['course-return','course-return-completion']) {
      const destination = new URL(await page.locator('#' + id).getAttribute('href'), page.url());
      assert.equal(destination.pathname, '/trainers/oge-basics/arithmetic-route.html');
      assert.equal(destination.searchParams.get('skill'), 'division');
      existingLocalTarget(destination.href, origin);
    }
    const practice = new URL(await page.locator('#arithmetic-link').getAttribute('href'), page.url());
    assert.equal(practice.pathname, '/trainers/arifmetika.html');
    assert.equal(practice.searchParams.get('course'), 'preoge');
    assert.equal(practice.searchParams.get('level'), 'n4c');
    existingLocalTarget(practice.href, origin);
    await page.locator('#topics-open').click();
    await page.locator('[data-topic="oneDigit"]').click();
    assert.equal((await snapshot(page)).active, 'oneDigit');
    assert.equal(new URL(page.url()).hash, '#oneDigit');
    assert.equal(new URL(page.url()).searchParams.get('course'), 'preoge');
    assert.deepEqual((await snapshot(page)).sessions.start, before.sessions.start, 'Selecting another topic retains the unfinished example');
    assert.equal(await page.evaluate(key => localStorage.getItem(key), legacyKey), legacyValue);
    await context.close();

    // Default links must work before JavaScript rewrites course navigation.
    const staticContext = await browser.newContext({javaScriptEnabled:false});
    const staticPage = await staticContext.newPage();
    observe(staticPage, 'static entry', failures);
    await staticPage.goto(origin + shortPath, {waitUntil:'networkidle'});
    const targets = await staticPage.locator('a[href], script[src], link[rel="stylesheet"][href]').evaluateAll(nodes => nodes.map(node => node.tagName === 'SCRIPT' ? node.src : node.href));
    for (const url of targets) existingLocalTarget(url, origin);
    for (const [selector, pathname] of [
      ['.brand','/trainers/oge-basics/multiplication-division/index.html'],
      ['#course-return','/trainers/oge-basics/arithmetic-route.html'],
      ['#course-return-completion','/trainers/oge-basics/arithmetic-route.html'],
      ['#arithmetic-link','/trainers/arifmetika.html']
    ]) assert.equal(new URL(await staticPage.locator(selector).getAttribute('href'), staticPage.url()).pathname, pathname);
    await staticContext.close();

    const offlineContext = await browser.newContext();
    const remoteRequests = [];
    await offlineContext.route(/^https?:\/\//, route => { remoteRequests.push(route.request().url()); return route.abort(); });
    const offline = await offlineContext.newPage();
    observe(offline, 'standalone download', failures);
    const download = path.join(root, 'downloads/trainers/long-division-stepwise/long-division-stepwise.html');
    await ready(offline, pathToFileURL(download).href);
    assert.equal(await offline.locator('#problem').innerText(), '48 : 2');
    assert.equal(await offline.locator('script[src], link[rel="stylesheet"][href]').count(), 0, 'Standalone HTML contains its own scripts and styles');
    await finishInitialExample(offline);
    assert.equal(await offline.locator('.quotient').innerText(), '24');
    assert.equal((await snapshot(offline)).records.length, 1);
    const offlinePractice = new URL(await offline.locator('#arithmetic-link').getAttribute('href'));
    assert.equal(offlinePractice.origin, 'https://mathexam.space', 'Dynamically assigned offline navigation opens the live site');
    assert.equal(offlinePractice.pathname, '/trainers/arifmetika.html');
    for (const id of ['course-return','course-return-completion']) {
      const destination = new URL(await offline.locator('#' + id).getAttribute('href'));
      assert.equal(destination.origin, 'https://mathexam.space');
      assert.equal(destination.pathname, '/trainers/oge-basics/arithmetic-route.html');
    }
    assert.deepEqual(remoteRequests, [], 'Opening and solving the downloaded trainer makes no HTTP requests');
    await offlineContext.close();
    assert.deepEqual(failures, [], 'No page errors, failed resources or HTTP errors');
    console.log('DIVISION_SEARCH_ENTRY_OK: canonical and sitemap; exact deep/short resume with hints and draft; untouched legacy progress; course/hash routes; static links/assets; standalone offline completion and HTTPS navigation.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
