'use strict';
/* Native standalone editor checks. Launch with the existing runtime Playwright. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { chromium } = require('playwright');
const M = require('../../trainers/spacemath/model.js');
const ROOT = path.resolve(__dirname, '../..');
const OUT = process.env.SPACEMATH_ARTIFACTS || path.join(os.tmpdir(), 'spacemath-editor-evidence');
fs.mkdirSync(OUT, { recursive: true });
const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH || process.env.BROWSER_EXECUTABLE_PATH;
const server = http.createServer((request, response) => {
  try {
    if (new URL(request.url, 'http://local').pathname === '/spacemath-sandbox-fixture.html') {
      response.setHeader('Content-Type', 'text/html');
      response.end('<!doctype html><html lang="ru"><meta charset="utf-8"><title>Sandbox fixture</title><style>body{margin:0}iframe{border:0;width:100%;height:1600px}</style><iframe title="SpaceMath sandbox" sandbox="allow-scripts allow-same-origin" src="/trainers/spacemath/"></iframe></html>');
      return;
    }
    let file = path.resolve(ROOT, '.' + new URL(request.url, 'http://local').pathname);
    if (!file.startsWith(ROOT + path.sep)) throw new Error('Outside site');
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    response.setHeader('Content-Type', { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[path.extname(file)] || 'application/octet-stream');
    response.end(fs.readFileSync(file));
  } catch (_) { response.writeHead(404).end(); }
});
const snapshot = page => page.evaluate(() => SpaceMathApp.getState());
const waitObjects = (page, count) => page.waitForFunction(n => SpaceMathApp.getState().objects.length === n, count);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, actual + ' ≈ ' + expected);
const passes = [], errors = [], requests = [];
function passed(name) { passes.push(name); console.log('PASS', name); }
async function pointScreen(page, name) {
  await page.locator('#geometry-board').scrollIntoViewIfNeeded();
  return page.evaluate(name => {
    const board = Object.values(JXG.boards).find(board => board.container === 'geometry-board' || board.containerObj?.id === 'geometry-board');
    const point = board.objectsList.find(item => item.elType === 'point' && item.name === name), rect = document.getElementById('geometry-board').getBoundingClientRect();
    return { x: rect.x + point.coords.scrCoords[1], y: rect.y + point.coords.scrCoords[2] };
  }, name);
}
async function mouseDrag(page, point, dx, dy) {
  await page.mouse.move(point.x, point.y); await page.mouse.down();
  await page.mouse.move(point.x + dx, point.y + dy, { steps: 10 }); await page.mouse.up();
}
async function touchDrag(page, point, dx, dy) {
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.x, y: point.y, id: 1 }] });
  for (let i = 1; i <= 8; i++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x + dx * i / 8, y: point.y + dy * i / 8, id: 1 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await session.detach();
}
async function open(context, origin) {
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith(origin) && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) requests.push(request.url()); });
  await page.goto(origin + '/trainers/spacemath/'); await page.waitForFunction(() => !!window.SpaceMathApp);
  return page;
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
    const page = await open(desktop, origin);
    await page.locator('[data-tool="segment"]').click();
    const box = await page.locator('#geometry-board').boundingBox();
    await page.mouse.click(box.x + 300, box.y + 170); await waitObjects(page, 1);
    await page.mouse.click(box.x + 500, box.y + 270); await waitObjects(page, 3);
    assert.equal((await snapshot(page)).objects[2].type, 'segment');
    await page.locator('#undo').click(); await waitObjects(page, 2); await page.locator('#redo').click(); await waitObjects(page, 3);
    passed('native canvas construction and undo/redo');

    await page.locator('[data-tool="move"]').click(); await page.locator('#example').click(); await page.locator('#confirm-accept').click(); await waitObjects(page, 11);
    let position = await pointScreen(page, 'C'); await mouseDrag(page, position, 48, 55);
    let state = await snapshot(page), c = state.objects.find(item => item.id === 'c'), values = M.evaluate(state);
    assert.notEqual(c.y, 4); near(values.h.x, c.x); near(values.h.y, -2); near(values.height.value, c.y + 2); near(values.reading.value, 90);
    await page.locator('#undo').click(); near((await snapshot(page)).objects.find(item => item.id === 'c').y, 4);
    await page.locator('#redo').click(); near((await snapshot(page)).objects.find(item => item.id === 'c').y, c.y);
    passed('native point drag recomputes dependencies and has one undo step');

    await page.locator('[data-object="a"]').click(); await page.locator('#edit-x').fill('-5'); await page.locator('#edit-object-form button[type="submit"]').click();
    state = await snapshot(page); assert.equal(state.objects.find(item => item.id === 'a').x, -5); near(M.evaluate(state).m.x, -.5);
    await page.locator('[data-object="c"]').click(); await page.locator('#delete-object').click();
    assert.match(await page.locator('#confirm-description').textContent(), /зависимые объекты/);
    await page.locator('#confirm-accept').click(); await waitObjects(page, 4); state = await snapshot(page);
    assert.equal(state.objects.some(item => ['c', 'triangle', 'median', 'altitude', 'h', 'height', 'reading'].includes(item.id)), false);
    assert.equal(state.objects.some(item => item.id === 'm'), true); M.normalize(state);
    await page.locator('#undo').click(); await waitObjects(page, 11);
    passed('coordinate alternative and confirmed transitive deletion');

    state = await snapshot(page);
    const downloaded = page.waitForEvent('download'); await page.locator('#export-json').click(); const download = await downloaded;
    const exported = fs.readFileSync(await download.path()); assert.ok(exported.length <= M.MAX_BYTES); assert.deepEqual(M.normalize(JSON.parse(exported)), state);
    await page.locator('#new-model').click(); await page.locator('#confirm-accept').click(); await waitObjects(page, 0);
    await page.locator('#import-file').setInputFiles({ name: 'synthetic-construction.json', mimeType: 'application/json', buffer: exported });
    await page.locator('#confirm-accept').click(); await waitObjects(page, 11); assert.deepEqual(await snapshot(page), state);
    const malicious = JSON.stringify({ ...state, objects: [...state.objects, { id: 'bad', type: 'script', label: '', source: 'alert(1)' }] });
    await page.locator('#import-file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(malicious) });
    await page.waitForFunction(() => document.getElementById('feedback').classList.contains('error'));
    assert.deepEqual(await snapshot(page), state); passed('JSON roundtrip and rejected executable import');

    await page.reload(); await page.waitForFunction(() => !!window.SpaceMathApp); assert.deepEqual(await snapshot(page), state);
    await page.locator('#fit-view').click(); await page.locator('#geometry-board').scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: path.join(OUT, 'desktop.png'), fullPage: true });
    position = await pointScreen(page, 'C'); await page.evaluate(() => SpaceMathApp.setReadOnly(true));
    await mouseDrag(page, position, 20, 20); assert.deepEqual(await snapshot(page), state);
    assert.equal(await page.locator('#model-title').isDisabled(), true); assert.equal(await page.locator('#import-json').isDisabled(), true);
    passed('standalone reload restores draft and read-only blocks native edits');

    await page.evaluate(() => {
      SpaceMathApp.setReadOnly(false);
      SpaceMathApp.applyState({ ...SpaceMathModel.empty(), objects: [{ id: 'limit', type: 'point', label: 'L', x: 999999, y: 0 }] });
    });
    await page.locator('#fit-view').click(); position = await pointScreen(page, 'L');
    const unitX = await page.evaluate(() => Object.values(JXG.boards)[0].unitX);
    await mouseDrag(page, position, unitX * 1.3, 0);
    const bound = await page.evaluate(() => ({ semantic: SpaceMathApp.getState().objects[0].x, drawn: Object.values(JXG.boards)[0].objectsList.find(item => item.name === 'L').X() }));
    assert.ok(bound.semantic <= M.MAX_COORD); near(bound.drawn, bound.semantic);
    assert.match(await page.locator('#feedback').textContent(), /допустимом положении/);
    passed('out-of-range native drag retains identical saved and rendered coordinates');

    await page.locator('[data-tool="point"]').click();
    await page.evaluate(() => {
      window.__spacemathOriginalTimeout = window.setTimeout; window.__spacemathHeldCallbacks = [];
      window.setTimeout = (callback, delay, ...args) => {
        // Hold only the app's deferred edit, leaving library scheduling intact.
        if (delay === 0 && String(callback).includes('activeTool')) { window.__spacemathHeldCallbacks.push(() => callback(...args)); return 987000 + window.__spacemathHeldCallbacks.length; }
        return window.__spacemathOriginalTimeout(callback, delay, ...args);
      };
    });
    const raceBox = await page.locator('#geometry-board').boundingBox();
    await page.mouse.click(raceBox.x + 30, raceBox.y + 50);
    await page.waitForFunction(() => window.__spacemathHeldCallbacks.length > 0);
    const race = await page.evaluate(() => {
      const replacement = { ...SpaceMathModel.empty(), title: 'Авторитетная модель', objects: [{ id: 'fresh', type: 'point', label: 'F', x: 1, y: 2 }] };
      let emits = 0; const unsubscribe = SpaceMathApp.subscribe(() => emits++);
      SpaceMathApp.applyState(replacement);
      window.setTimeout = window.__spacemathOriginalTimeout;
      for (const callback of window.__spacemathHeldCallbacks) callback();
      delete window.__spacemathHeldCallbacks; delete window.__spacemathOriginalTimeout; unsubscribe();
      return { actual: SpaceMathApp.getState(), expected: replacement, emits };
    });
    assert.deepEqual(race.actual, race.expected); assert.equal(race.emits, 0);
    passed('authoritative hydration cancels stale queued canvas mutation without echo');

    const mobile = await browser.newContext({ viewport: { width: 320, height: 900 }, isMobile: true, hasTouch: true });
    const phone = await open(mobile, origin); await phone.locator('[data-tool="point"]').tap(); await phone.locator('#geometry-board').scrollIntoViewIfNeeded();
    const mobileBox = await phone.locator('#geometry-board').boundingBox(); await phone.touchscreen.tap(mobileBox.x + mobileBox.width / 2 + 20, mobileBox.y + mobileBox.height / 2); await waitObjects(phone, 1);
    await phone.locator('[data-tool="move"]').tap(); await phone.locator('#example').tap(); await phone.locator('#confirm-accept').tap(); await waitObjects(phone, 11);
    position = await pointScreen(phone, 'C'); await touchDrag(phone, position, 20, 32);
    state = await snapshot(phone); c = state.objects.find(item => item.id === 'c'); values = M.evaluate(state);
    assert.notEqual(c.y, 4); near(values.h.x, c.x); near(values.reading.value, 90);
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await phone.screenshot({ path: path.join(OUT, 'mobile-320.png'), fullPage: true });
    await phone.evaluate(() => SpaceMathApp.setReadOnly(true)); position = await pointScreen(phone, 'C'); await touchDrag(phone, position, 20, 20); assert.deepEqual(await snapshot(phone), state);
    passed('320px touch construction, touch drag and read-only guard');

    const sandboxPage = await desktop.newPage(), sandboxConsoleErrors = [];
    sandboxPage.on('pageerror', error => errors.push(error.message));
    sandboxPage.on('console', message => { if (message.type() === 'error') sandboxConsoleErrors.push(message.text()); });
    await sandboxPage.goto(origin + '/spacemath-sandbox-fixture.html');
    const sandbox = await (await sandboxPage.locator('iframe').elementHandle()).contentFrame();
    await sandbox.waitForFunction(() => !!window.SpaceMathApp);
    await sandbox.locator('#point-x').fill('2.5'); await sandbox.locator('#point-y').fill('1.5'); await sandbox.locator('#add-point-form button').click();
    await waitObjects(sandbox, 1); near((await snapshot(sandbox)).objects[0].x, 2.5);
    await sandbox.locator('#point-x').fill('4.5'); await sandbox.locator('#point-y').fill('3'); await sandbox.locator('#point-y').press('Enter');
    await waitObjects(sandbox, 2);
    await sandbox.locator('[data-object="o1"]').click(); await sandbox.locator('#edit-x').fill('-2'); await sandbox.locator('#edit-x').press('Enter');
    near((await snapshot(sandbox)).objects[0].x, -2);
    await sandbox.locator('#delete-object').click(); await sandbox.locator('#confirm-accept').click(); await waitObjects(sandbox, 1);
    assert.deepEqual(sandboxConsoleErrors, []);
    passed('sandbox without allow-forms supports local numeric click, Enter, edit and confirmation');
    assert.deepEqual(errors, []); assert.deepEqual(requests, []);
    passed('no script errors or external resource requests');
    console.log('SPACEMATH_EDITOR_BROWSER_PASS', passes.length);
  } finally {
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify({ passes, errors, externalRequests: requests, chromium: browser.version() }, null, 2));
    await browser.close(); server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
