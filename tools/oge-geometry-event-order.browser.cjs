'use strict';

// Native Chromium actions, two real trainer pages and the adapter's subscription
// boundary. No production rooms or personal learner accounts are used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const names = { 16: 'circle', 17: 'quadrilaterals', 18: 'grid' };
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };
const server = http.createServer((request, response) => {
  const filename = path.resolve(root, '.' + new URL(request.url, 'http://local').pathname);
  if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename) || fs.statSync(filename).isDirectory()) {
    response.writeHead(404).end(); return;
  }
  response.setHeader('Content-Type', mime[path.extname(filename)] || 'application/octet-stream');
  fs.createReadStream(filename).pipe(response);
});
const bridge = `window.__ogeSnapshots=[];window.MathExamBoard={register(config){
  window.__ogeRegistration=config;
  config.subscribe(()=>window.__ogeSnapshots.push(JSON.parse(JSON.stringify(config.getState()))));
}};`;

async function open(browser, base, n, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/board-bridge.js', route => route.fulfill({ contentType: 'application/javascript', body: bridge }));
  await page.goto(`${base}/trainers/oge-task${n}-${names[n]}.html?board=1`);
  await page.waitForFunction(() => !!window.__ogeRegistration);
  await page.waitForTimeout(30);
  assert.deepEqual(errors, []);
  return { page, errors };
}

async function publishedAction(writer, reader, label, action) {
  const before = await writer.evaluate(() => window.__ogeSnapshots.length);
  await action();
  await writer.waitForFunction(count => window.__ogeSnapshots.length > count, before, { timeout: 2000 });
  await writer.waitForTimeout(30);
  const value = await writer.evaluate(() => ({
    latest: window.__ogeSnapshots.at(-1), current: window.__ogeRegistration.getState()
  }));
  assert.deepEqual(value.latest, value.current, label + ': the first action publishes its completed state');
  const receivedBefore = await reader.evaluate(() => window.__ogeSnapshots.length);
  await reader.evaluate(packet => window.__ogeRegistration.applyState(packet), value.latest);
  await reader.waitForTimeout(30);
  assert.deepEqual(await reader.evaluate(() => window.__ogeRegistration.getState()), value.current, label + ': peer restores');
  assert.equal(await reader.evaluate(() => window.__ogeSnapshots.length), receivedBefore, label + ': no remote echo');
  return value.current;
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const width of [360, 1280]) for (const n of [16, 17, 18]) {
      const writer = await open(browser, base, n, width), reader = await open(browser, base, n, width);
      const page = writer.page, peer = reader.page, label = `OGE${n} ${width}px`;
      const input = n === 18 ? '#ansIn' : '#ans';
      const check = { 16: '#check', 17: '#chk', 18: '#chkBtn' }[n];
      const next = { 16: '#next', 17: '#nxt', 18: '#nextBtn' }[n];
      let state = await publishedAction(page, peer, label + ' open hint', () => page.locator('#courseHintToggle').click());
      assert.equal(state.helpOpen, true); assert.equal(state.helpUsed, true);
      state = await publishedAction(page, peer, label + ' close hint', () => page.locator('#courseHintToggle').click());
      assert.equal(state.helpOpen, false); assert.equal(state.helpUsed, true);
      state = await publishedAction(page, peer, label + ' first input', () => page.locator(input).fill('123,45'));
      assert.equal(state.answer, '123,45');
      const correct = await page.evaluate(number => String(window.eval(number === 16 ? 'trTask.ans' : number === 17 ? 'CUR.ans' : 'TR.task.ans')), n);
      await publishedAction(page, peer, label + ' corrected draft', () => page.locator(input).fill(correct));
      state = await publishedAction(page, peer, label + ' check', () => page.locator(check).click());
      assert.equal(state.actions.at(-1)[0], 'check'); assert.equal(await page.locator(input).isDisabled(), true);
      const oldTask = state.task;
      state = await publishedAction(page, peer, label + ' next task', () => page.locator(next).click());
      assert.notDeepEqual(state.task, oldTask); assert.equal(state.answer, '');
      assert.deepEqual(state.actions, []); assert.equal(state.helpUsed, false);
      assert.deepEqual(writer.errors.concat(reader.errors), []);
      await page.close(); await peer.close();
      console.log(label + ': native input/click, next task and peer restore OK');
    }
    console.log('OGE_GEOMETRY_NATIVE_EVENT_ORDER_OK 6 viewport/trainer scenarios');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
