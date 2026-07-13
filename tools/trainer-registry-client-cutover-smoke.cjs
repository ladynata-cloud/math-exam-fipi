'use strict';

const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const { createServer } = require('node:http');
const { createReadStream, existsSync, readFileSync } = require('node:fs');
const { createServer: createNetServer } = require('node:net');
const { dirname, extname, resolve, sep } = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const REPO_ROOT = resolve(__dirname, '..');
const BOARD_SERVER_DIR = resolve(REPO_ROOT, 'board-server');
const BASE_SHA = 'e9097137b6cd66d80962cadcef336255db28e9b1';
const EDGE_PATHS = [
  process.env.BROWSER_EXECUTABLE_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  process.env.LOCALAPPDATA && resolve(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
].filter(Boolean);

const wait = ms => new Promise(resolvePromise => setTimeout(resolvePromise, ms));

async function freePort() {
  return new Promise((resolvePromise, reject) => {
    const server = createNetServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolvePromise(port));
    });
  });
}

function contentType(file) {
  return ({
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  })[extname(file).toLowerCase()] || 'application/octet-stream';
}

function oldBoardHtml() {
  return execFileSync('git', ['show', `${BASE_SHA}:trainers/trainer-board.html`], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024
  });
}

async function startStaticServer(port) {
  const oldHtml = oldBoardHtml();
  const server = createServer((request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch (_error) { response.writeHead(400).end(); return; }
    if (pathname === '/old/trainers/trainer-board.html') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(oldHtml);
      return;
    }
    if (pathname.startsWith('/old/trainers/')) pathname = pathname.slice(4);
    const file = resolve(REPO_ROOT, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(`${REPO_ROOT}${sep}`) || !existsSync(file)) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': contentType(file), 'Cache-Control': 'no-store' });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolvePromise);
  });
  return server;
}

async function waitForHttp(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch (_error) {}
    await wait(100);
  }
  throw new Error(`HTTP_TIMEOUT ${url}`);
}

async function startBoardServer(port) {
  const stderr = [];
  const child = spawn(process.execPath, ['index.js'], {
    cwd: BOARD_SERVER_DIR,
    env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
    stdio: ['ignore', 'ignore', 'pipe']
  });
  child.stderr.on('data', chunk => stderr.push(String(chunk)));
  child.once('exit', code => {
    if (code && code !== 0) stderr.push(`BOARD_SERVER_EXIT_${code}`);
  });
  try { await waitForHttp(`http://127.0.0.1:${port}/health`); } catch (error) {
    child.kill();
    throw new Error(`${error.message}\n${stderr.join('').slice(0, 1000)}`);
  }
  return child;
}

function stopChild(child) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGTERM');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeDigest(character) {
  return `sha256:${character.repeat(64)}`;
}

function instrument(page, label, allowWarnings = []) {
  const evidence = { consoleErrors: [], pageErrors: [], warnings: [] };
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);
  page.on('console', message => {
    const text = message.text();
    if (message.type() === 'error') evidence.consoleErrors.push(`${label}: ${text}`);
    if (message.type() === 'warning' && !allowWarnings.some(value => text.includes(value))) evidence.warnings.push(`${label}: ${text}`);
  });
  page.on('pageerror', error => evidence.pageErrors.push(`${label}: ${error.message}`));
  return evidence;
}

function assertNoPageErrors(evidence) {
  assert.deepEqual(evidence.pageErrors, [], evidence.pageErrors.join('\n'));
}

function assertCleanBrowser(evidence) {
  assert.deepEqual(evidence.consoleErrors, [], evidence.consoleErrors.join('\n'));
  assert.deepEqual(evidence.pageErrors, [], evidence.pageErrors.join('\n'));
  assert.deepEqual(evidence.warnings, [], evidence.warnings.join('\n'));
}

async function fulfillJson(route, origin, body, status = 200) {
  try {
    await route.fulfill({
      status,
      contentType: 'application/json; charset=utf-8',
      headers: { 'Access-Control-Allow-Origin': origin, 'Cache-Control': 'no-store' },
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });
  } catch (_error) {}
}

async function installRegistryRoute(page, origin, control) {
  await page.route('**/api/trainer-registry', async route => {
    control.calls++;
    const mode = typeof control.mode === 'function' ? control.mode(control.calls) : control.mode;
    if (mode === 'live') { await route.continue(); return; }
    if (mode === 'abort') { await route.abort('connectionfailed'); return; }
    if (mode?.delay) await wait(mode.delay);
    if (mode?.abort) { try { await route.abort('timedout'); } catch (_error) {} return; }
    await fulfillJson(route, origin, mode?.body ?? control.registry, mode?.status ?? 200);
  });
}

async function gotoBoard(page, siteOrigin, boardOrigin, path = '/trainers/trainer-board.html') {
  await page.goto(`${siteOrigin}${path}?server=${encodeURIComponent(boardOrigin)}`, { waitUntil: 'commit', timeout: 60000 });
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const frame = page.locator('#trainerFrame');
      if (await frame.count()) {
        const src = await frame.getAttribute('src');
        if (src && src !== 'about:blank') return;
      }
    } catch (_error) {}
    await wait(100);
  }
  throw new Error('TRAINER_FRAME_INITIAL_NAVIGATION_TIMEOUT');
}

async function waitMirror(page, state, timeout = 15000) {
  await page.waitForFunction(expected => document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === expected, state, { timeout, polling: 100 });
}

async function registryAuthorized(page, file) {
  return page.evaluate(value => mirrorTrainerFromUrl(value), file);
}

async function waitForRegistryAuthorization(page, file, expected, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      if (await registryAuthorized(page, file) === expected) return;
    } catch (_error) {}
    await wait(100);
  }
  const status = await page.locator('#mirrorStatus').getAttribute('data-mirror-status').catch(() => 'missing');
  throw new Error(`REGISTRY_AUTHORIZATION_TIMEOUT file=${file} expected=${expected} status=${status}`);
}

async function trainerFrame(page, suffix) {
  await page.waitForFunction(expected => [...document.querySelectorAll('iframe')].some(frame => frame.src.includes(expected)), suffix, { polling: 100 });
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const frame = page.frames().find(item => item.url().includes(suffix));
    if (frame) return frame;
    await wait(50);
  }
  throw new Error(`Missing trainer frame ${suffix}`);
}

async function createRoom(page) {
  await page.locator('#createRoom').waitFor({ state: 'attached' });
  await page.locator('#createRoom').evaluate(button => button.click());
  try {
    await page.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено', null, { polling: 100 });
  } catch (error) {
    const state = await page.evaluate(() => ({
      shareStatus: document.querySelector('#shareStatus')?.textContent || '',
      mirrorStatus: document.querySelector('#mirrorStatus')?.dataset.mirrorStatus || '',
      roomCreated: (document.querySelector('#studentLink')?.value || '').includes('role=student')
    }));
    if (state.shareStatus !== 'подключено' || !state.roomCreated) throw new Error(`CREATE_ROOM_TIMEOUT ${JSON.stringify(state)}: ${error.message}`);
  }
  await page.waitForFunction(() => document.querySelector('#studentLink')?.value.includes('role=student'), null, { polling: 100 });
  return page.inputValue('#studentLink');
}

async function canvasHash(page) {
  return page.locator('#canvas').evaluate(canvas => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 2166136261;
    for (let index = 0; index < data.length; index += 4) {
      hash = Math.imul(hash ^ data[index], 16777619);
      hash = Math.imul(hash ^ data[index + 1], 16777619);
      hash = Math.imul(hash ^ data[index + 2], 16777619);
    }
    return hash >>> 0;
  });
}

async function drawCanvas(page) {
  const canvas = page.locator('#canvas');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  assert.ok(box && box.width > 100 && box.height > 100);
  await page.mouse.move(box.x + 80, box.y + 80);
  await page.mouse.down();
  await page.mouse.move(box.x + 180, box.y + 140, { steps: 5 });
  await page.mouse.up();
}

async function registryValidationMatrix(browser, siteOrigin, boardOrigin, registry) {
  const cases = [
    ['http-404', () => ({ status: 404, body: {} }), 1, false],
    ['http-503', () => ({ status: 503, body: {} }), 2, false],
    ['invalid-json', () => ({ body: '{' }), 1, false],
    ['unsupported-schema', () => ({ body: { ...clone(registry), schemaVersion: 2 } }), 1, false],
    ['duplicate-id', () => { const body = clone(registry); body.trainers.push({ ...body.trainers[0], file: 'trainers/duplicate.html' }); return { body }; }, 1, false],
    ['duplicate-file', () => { const body = clone(registry); body.trainers.push({ ...body.trainers[0], trainerId: 'duplicate-trainer' }); return { body }; }, 1, false],
    ['missing-field', () => { const body = clone(registry); delete body.trainers[0].version; return { body }; }, 1, false],
    ['network-error', () => ({ abort: true }), 2, false],
    ['timeout-retry-success', call => call === 1 ? { delay: 4300, body: registry } : { body: registry }, 2, true],
    ['terminal-timeout', () => ({ delay: 5000, body: registry }), 2, false]
  ];
  for (const [name, response, expectedCalls, succeeds] of cases) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const evidence = instrument(page, name);
    const control = { calls: 0, registry, mode: call => response(call) };
    await installRegistryRoute(page, siteOrigin, control);
    await gotoBoard(page, siteOrigin, boardOrigin);
    if (succeeds) {
      await waitForRegistryAuthorization(page, 'negative-numbers-line.html', 'negative-numbers-line', 12000);
    } else {
      await waitMirror(page, 'registry-unavailable', 15000);
      assert.equal(await registryAuthorized(page, 'negative-numbers-line.html'), '');
    }
    assert.equal(control.calls, expectedCalls, `${name} request count`);
    assertNoPageErrors(evidence);
    await context.close();
  }
  const emptyContext = await browser.newContext();
  const emptyPage = await emptyContext.newPage();
  const emptyEvidence = instrument(emptyPage, 'empty-registry');
  const emptyControl = { calls: 0, registry, mode: { body: { schemaVersion: 1, digest: safeDigest('0'), trainers: [] } } };
  await installRegistryRoute(emptyPage, siteOrigin, emptyControl);
  await gotoBoard(emptyPage, siteOrigin, boardOrigin);
  await waitMirror(emptyPage, 'unsupported-trainer');
  assert.equal(await registryAuthorized(emptyPage, 'negative-numbers-line.html'), '', 'shadow registry never authorizes mirror behavior');
  assert.equal(emptyControl.calls, 1);
  assertNoPageErrors(emptyEvidence);
  await emptyContext.close();

  const versionContext = await browser.newContext();
  const versionPage = await versionContext.newPage();
  const versionEvidence = instrument(versionPage, 'version-mismatch');
  const incompatible = clone(registry);
  incompatible.digest = safeDigest('d');
  incompatible.trainers.find(entry => entry.trainerId === 'negative-numbers-line').version = '2.0.0';
  const versionControl = { calls: 0, registry, mode: { body: incompatible } };
  await installRegistryRoute(versionPage, siteOrigin, versionControl);
  await gotoBoard(versionPage, siteOrigin, boardOrigin);
  await waitMirror(versionPage, 'version-mismatch');
  assert.equal(versionControl.calls, 1);
  assertCleanBrowser(versionEvidence);
  await versionContext.close();
}

async function canonicalPathMatrix(browser, siteOrigin, boardOrigin, otherOrigin, registry) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const evidence = instrument(page, 'canonical-path');
  const control = { calls: 0, registry, mode: { body: registry } };
  await installRegistryRoute(page, siteOrigin, control);
  await gotoBoard(page, siteOrigin, boardOrigin);
  await waitForRegistryAuthorization(page, 'negative-numbers-line.html', 'negative-numbers-line');
  const matrix = [
    ['negative-numbers-line.html', 'trainers/negative-numbers-line.html'],
    ['/trainers/negative-numbers-line.html', 'trainers/negative-numbers-line.html'],
    [`${siteOrigin}/trainers/negative-numbers-line.html?seed=x#part`, 'trainers/negative-numbers-line.html'],
    ['/trainers/future/nested-trainer.html?seed=x#part', 'trainers/future/nested-trainer.html'],
    [`${otherOrigin}/trainers/negative-numbers-line.html`, ''],
    ['file:///trainers/negative-numbers-line.html', ''],
    ['data:text/html,hello', ''],
    ['javascript:void(0)', ''],
    ['/trainers/a%2fb.html', ''],
    ['/trainers/a%5Cb.html', ''],
    ['/trainers/%2e%2e/a.html', ''],
    ['/trainers/../a.html', ''],
    ['/trainers//a.html', ''],
    ['/trainers/a∕b.html', ''],
    ['/trainers/a%E0%A4%A.html', '']
  ];
  for (const [value, expected] of matrix) {
    assert.equal(await page.evaluate(input => canonicalTrainerFileFromUrl(input), value), expected, value);
  }
  assert.equal(await registryAuthorized(page, '/trainers/collision/negative-numbers-line.html'), '', 'same basename at another full path is not authorized');
  assertCleanBrowser(evidence);
  await context.close();
}

async function arrivalAndFailClosed(browser, siteOrigin, boardOrigin, registry) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const evidence = instrument(page, 'arrival-fail-closed');
  const frameRequests = [];
  page.on('request', request => { if (request.url().includes('/trainers/negative-numbers-line.html')) frameRequests.push(request.url()); });
  const control = { calls: 0, registry, mode: { status: 404, body: {} } };
  await installRegistryRoute(page, siteOrigin, control);
  await gotoBoard(page, siteOrigin, boardOrigin);
  await waitMirror(page, 'registry-unavailable');
  await page.waitForFunction(() => document.querySelectorAll('#trainerQuick option').length >= 12, null, { polling: 100 });
  const studentLink = await createRoom(page);
  assert.ok(studentLink);
  const before = await canvasHash(page);
  await drawCanvas(page);
  assert.notEqual(await canvasHash(page), before, 'canvas remains operational while registry is unavailable');
  await page.waitForTimeout(10200);
  const requestsBeforeRecovery = frameRequests.length;
  control.mode = { body: registry };
  await page.click('#retryTrainerRegistry');
  await waitMirror(page, 'connected', 15000);
  assert.equal(frameRequests.length, requestsBeforeRecovery + 1, 'expired bridge recovers with one controlled reload');
  await page.fill('#trainerUrl', 'like-terms-trainer.html');
  await page.click('#openTrainer');
  await trainerFrame(page, 'like-terms-trainer.html');
  await waitMirror(page, 'unsupported-trainer');
  assertNoPageErrors(evidence);
  await context.close();
}

async function arrivalOrder(browser, siteOrigin, boardOrigin, registry, mode) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const evidence = instrument(page, `arrival-${mode}`);
  const control = { calls: 0, registry, mode: ['ready-first', 'reload-pending'].includes(mode) ? { delay: 1200, body: registry } : { body: registry } };
  await installRegistryRoute(page, siteOrigin, control);
  if (mode === 'registry-first' || mode === 'room-first') {
    await page.route('**/trainers/negative-numbers-line.html*', async route => { await wait(mode === 'room-first' ? 1200 : 800); try { await route.continue(); } catch (_error) {} });
  }
  await gotoBoard(page, siteOrigin, boardOrigin);
  if (mode === 'reload-pending') {
    const frame = await trainerFrame(page, 'negative-numbers-line.html');
    await frame.evaluate(() => location.reload());
  }
  if (mode === 'room-last') await page.waitForTimeout(500);
  await createRoom(page);
  await waitMirror(page, 'connected', 15000);
  assert.equal(control.calls, 1, `${mode} does not create a registry fetch storm`);
  assertNoPageErrors(evidence);
  await context.close();
}

async function waitForCalls(control, count, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (control.calls >= count) return;
    await wait(50);
  }
  throw new Error(`REGISTRY_CALL_TIMEOUT expected=${count} actual=${control.calls}`);
}

async function publishNegativeState(frame, feedbackText, visualValue) {
  await frame.evaluate(({ text, point }) => {
    const value = window.getBoardTrainerState();
    value.feedbackText = text;
    value.visual = { start: point, end: point, traveler: point, arc: { from: point, to: point }, wrong: null };
    window.applyBoardTrainerState(value);
    sendBoardTrainerState();
  }, { text: feedbackText, point: visualValue });
}

async function forceSocketReconnect(page) {
  await page.evaluate(() => shared.socket.io.engine.close());
  await page.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено', null, { polling: 100, timeout: 30000 });
}

async function reconnectRegistryMatrix(browser, siteOrigin, boardOrigin, registry) {
  const teacherContext = await browser.newContext();
  const teacher = await teacherContext.newPage();
  const teacherEvidence = instrument(teacher, 'reconnect-teacher');
  const teacherControl = { calls: 0, registry, mode: { body: registry } };
  await installRegistryRoute(teacher, siteOrigin, teacherControl);
  await gotoBoard(teacher, siteOrigin, boardOrigin);
  const studentLink = await createRoom(teacher);
  await waitMirror(teacher, 'connected');

  const studentContext = await browser.newContext();
  const student = await studentContext.newPage();
  const studentEvidence = instrument(student, 'reconnect-student');
  const studentControl = { calls: 0, registry, mode: { body: registry } };
  await installRegistryRoute(student, siteOrigin, studentControl);
  await student.goto(studentLink, { waitUntil: 'domcontentloaded' });
  await waitMirror(student, 'connected');
  const teacherFrame = await trainerFrame(teacher, 'negative-numbers-line.html');
  const studentFrame = await trainerFrame(student, 'negative-numbers-line.html');

  await publishNegativeState(teacherFrame, 'unchanged-digest', 1);
  await studentFrame.waitForFunction(() => window.getBoardTrainerState().feedbackText === 'unchanged-digest', null, { polling: 100 });
  let calls = studentControl.calls;
  await forceSocketReconnect(student);
  await waitForCalls(studentControl, calls + 1);
  await waitMirror(student, 'connected');

  studentControl.mode = { body: { ...clone(registry), digest: safeDigest('a') } };
  calls = studentControl.calls;
  await forceSocketReconnect(student);
  await waitForCalls(studentControl, calls + 1);
  await waitMirror(student, 'connected');

  const removed = clone(registry);
  removed.digest = safeDigest('b');
  removed.trainers = removed.trainers.filter(entry => entry.trainerId !== 'negative-numbers-line');
  studentControl.mode = { body: removed };
  calls = studentControl.calls;
  await forceSocketReconnect(student);
  await waitForCalls(studentControl, calls + 1);
  await waitMirror(student, 'unsupported-trainer');
  const beforeRemovedUpdate = await studentFrame.evaluate(() => window.getBoardTrainerState().feedbackText);
  await publishNegativeState(teacherFrame, 'must-not-apply-while-removed', 2);
  await student.waitForTimeout(200);
  assert.equal(await studentFrame.evaluate(() => window.getBoardTrainerState().feedbackText), beforeRemovedUpdate, 'stored latest state is not applied while capability is removed');

  studentControl.mode = { body: { ...clone(registry), digest: safeDigest('c') } };
  calls = studentControl.calls;
  await forceSocketReconnect(student);
  await waitForCalls(studentControl, calls + 1);
  await waitMirror(student, 'connected');
  const recoveredFrame = await trainerFrame(student, 'negative-numbers-line.html');
  await recoveredFrame.waitForFunction(() => window.getBoardTrainerState().feedbackText === 'must-not-apply-while-removed', null, { polling: 100 });

  assert.deepEqual(studentEvidence.consoleErrors, [], studentEvidence.consoleErrors.join('\n'));
  studentControl.mode = { status: 503, body: {} };
  calls = studentControl.calls;
  await forceSocketReconnect(student);
  await waitForCalls(studentControl, calls + 2);
  await waitMirror(student, 'registry-unavailable');
  assert.equal(await student.evaluate(() => document.querySelector('#shareStatus').textContent), 'подключено', 'room remains connected when registry refresh fails');
  const beforeFailedRefresh = await recoveredFrame.evaluate(() => window.getBoardTrainerState().feedbackText);
  await publishNegativeState(teacherFrame, 'must-not-apply-after-refresh-failure', 3);
  await student.waitForTimeout(200);
  assert.equal(await recoveredFrame.evaluate(() => window.getBoardTrainerState().feedbackText), beforeFailedRefresh, 'failed refresh suspends mirror');
  assert.equal(studentEvidence.consoleErrors.length, 2, 'the injected 503 is attempted once plus one retry');
  assert.ok(studentEvidence.consoleErrors.every(message => message.includes('status of 503')), studentEvidence.consoleErrors.join('\n'));
  studentEvidence.consoleErrors.length = 0;

  assertCleanBrowser(teacherEvidence);
  assertCleanBrowser(studentEvidence);
  await studentContext.close();
  await teacherContext.close();
}

async function storageSnapshot(frame, key, ids) {
  return frame.evaluate(({ key: storageKey, ids: elementIds }) => ({
    storage: localStorage.getItem(storageKey),
    values: Object.fromEntries(elementIds.map(id => [id, document.getElementById(id)?.textContent || '']))
  }), { key, ids });
}

async function liveTeacherStudent(browser, siteOrigin, boardOrigin, registry) {
  const teacherContext = await browser.newContext();
  const teacher = await teacherContext.newPage();
  const teacherEvidence = instrument(teacher, 'teacher');
  await installRegistryRoute(teacher, siteOrigin, { calls: 0, registry, mode: 'live' });
  await gotoBoard(teacher, siteOrigin, boardOrigin);
  const studentLink = await createRoom(teacher);
  await waitMirror(teacher, 'connected');
  assert.equal(new URL(teacher.url()).searchParams.has('token'), false, 'teacher URL does not expose a token');

  const studentContext = await browser.newContext();
  const student = await studentContext.newPage();
  const studentEvidence = instrument(student, 'student');
  const studentRegistryControl = { calls: 0, registry, mode: 'live' };
  await installRegistryRoute(student, siteOrigin, studentRegistryControl);
  await student.goto(studentLink, { waitUntil: 'domcontentloaded' });
  await waitMirror(student, 'connected');

  await teacher.selectOption('#trainerQuick', 'linear-inequalities-stepwise.html');
  const teacherLinear = await trainerFrame(teacher, 'linear-inequalities-stepwise.html');
  const studentLinear = await trainerFrame(student, 'linear-inequalities-stepwise.html');
  await waitMirror(teacher, 'connected');
  await waitMirror(student, 'connected');
  const storageBefore = await storageSnapshot(studentLinear, 'mathExamCourseProgress.v1', ['total', 'right', 'streak', 'history']);
  await student.evaluate(() => { window.__mirrorMessages = 0; addEventListener('message', event => { if (event.data?.type === 'mathexam:trainer-state') window.__mirrorMessages++; }); });
  await teacherLinear.click('.choices button[data-act="move"]');
  await studentLinear.waitForFunction(() => window.getBoardTrainerState().currentStep === 1, null, { polling: 100 });
  assert.deepEqual(await storageSnapshot(studentLinear, 'mathExamCourseProgress.v1', ['total', 'right', 'streak', 'history']), storageBefore);
  assert.equal(await student.evaluate(() => window.__mirrorMessages), 0, 'remote apply does not echo trainer state');

  const beforePendingRevoke = await teacherLinear.inputValue('#val');
  studentRegistryControl.mode = { delay: 1200, body: registry };
  await student.evaluate(() => { window.__pendingRegistryRefresh = loadTrainerRegistry({ force: true }); });
  await waitMirror(student, 'pending');
  await teacher.click('#controlToggle');
  await student.waitForFunction(() => document.body.classList.contains('control-owner'), null, { polling: 100 });
  await studentLinear.fill('#val', '66');
  await teacher.click('#controlToggle');
  await student.waitForFunction(() => !document.body.classList.contains('control-owner'), null, { polling: 100 });
  await waitMirror(student, 'connected');
  assert.equal(await teacherLinear.inputValue('#val'), beforePendingRevoke, 'revoke during pending registry hydration drops student state');
  studentRegistryControl.mode = 'live';

  await teacher.click('#controlToggle');
  await student.waitForFunction(() => document.body.classList.contains('control-owner'), null, { polling: 100 });
  await studentLinear.fill('#val', '7');
  await teacherLinear.waitForFunction(() => document.querySelector('#val').value === '7', null, { polling: 100 });
  const revokeTarget = Date.now() + 500;
  await Promise.all([
    teacher.evaluate(target => { setTimeout(() => shared.socket.emit('control:revoke', roomPayload()), Math.max(0, target + 10 - Date.now())); }, revokeTarget),
    studentLinear.evaluate(target => new Promise(resolvePromise => { setTimeout(() => { const input = document.querySelector('#val'); input.value = '88'; input.dispatchEvent(new Event('input', { bubbles: true })); resolvePromise(); }, Math.max(0, target - Date.now())); }), revokeTarget)
  ]);
  await student.waitForFunction(() => !document.body.classList.contains('control-owner'), null, { polling: 100 });
  await teacher.waitForTimeout(150);
  assert.equal(await teacherLinear.inputValue('#val'), '7', 'revoke drops debounced mid-input state');

  await teacher.click('#controlToggle');
  await student.waitForFunction(() => document.body.classList.contains('control-owner'), null, { polling: 100 });
  await teacher.reload({ waitUntil: 'domcontentloaded' });
  await teacher.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено', null, { polling: 100 });
  await waitMirror(teacher, 'connected');
  const reloadedTeacherLinear = await trainerFrame(teacher, 'linear-inequalities-stepwise.html');
  assert.ok(await student.evaluate(() => document.body.classList.contains('control-owner')), 'student keeps control through teacher reload');
  await studentLinear.fill('#val', '9');
  await reloadedTeacherLinear.waitForFunction(() => document.querySelector('#val').value === '9', null, { polling: 100 });
  await teacher.click('#controlToggle');
  await student.waitForFunction(() => !document.body.classList.contains('control-owner'), null, { polling: 100 });

  const isolatedContext = await browser.newContext();
  const isolated = await isolatedContext.newPage();
  const isolatedEvidence = instrument(isolated, 'isolated-tab');
  await installRegistryRoute(isolated, siteOrigin, { calls: 0, registry, mode: 'live' });
  await isolated.goto(teacher.url(), { waitUntil: 'domcontentloaded' });
  await isolated.waitForFunction(() => document.querySelector('#shareStatus')?.textContent.includes('Сессия учителя'), null, { polling: 100 });
  assert.equal(await isolated.evaluate(() => document.querySelector('#shareStatus').textContent), 'Сессия учителя не восстановлена. Создайте новую комнату.');
  assertCleanBrowser(isolatedEvidence);
  await isolatedContext.close();

  await student.reload({ waitUntil: 'domcontentloaded' });
  await student.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено', null, { polling: 100 });
  await waitMirror(student, 'connected');
  const reloadedStudentLinear = await trainerFrame(student, 'linear-inequalities-stepwise.html');
  await reloadedStudentLinear.waitForFunction(() => document.querySelector('#val').value === '9', null, { polling: 100 });

  const lateContext = await browser.newContext();
  const late = await lateContext.newPage();
  const lateEvidence = instrument(late, 'late-join');
  await installRegistryRoute(late, siteOrigin, { calls: 0, registry, mode: 'live' });
  await late.goto(studentLink, { waitUntil: 'domcontentloaded' });
  await waitMirror(late, 'connected');
  const lateLinear = await trainerFrame(late, 'linear-inequalities-stepwise.html');
  await lateLinear.waitForFunction(() => document.querySelector('#val').value === '9', null, { polling: 100 });
  const participants = await teacher.locator('#participantsList .participant').evaluateAll(nodes => nodes.map(node => node.textContent.trim()));
  assert.equal(new Set(participants).size, participants.length, 'participants are not duplicated after reload');
  assert.equal(participants.length, 2, 'teacher and the logical student participant are online');

  await teacher.fill('#trainerUrl', 'negative-numbers-line.html');
  await teacher.click('#openTrainer');
  const teacherNegative = await trainerFrame(teacher, 'negative-numbers-line.html');
  const studentNegative = await trainerFrame(student, 'negative-numbers-line.html');
  await waitMirror(teacher, 'connected');
  await waitMirror(student, 'connected');
  const negativeStorageBefore = await storageSnapshot(studentNegative, 'mathExamCourseProgress.v1', ['sTotal', 'sRight', 'sStreak', 'history']);
  await teacherNegative.evaluate(() => {
    const value = window.getBoardTrainerState();
    value.visual = { start: null, end: null, traveler: null, arc: null, wrong: null };
    window.applyBoardTrainerState(value);
    sendBoardTrainerState();
  });
  await studentNegative.waitForFunction(() => {
    const value = window.getBoardTrainerState().visual;
    return value.start === null && value.end === null && value.traveler === null && value.arc === null && value.wrong === null;
  }, null, { polling: 100 });
  await teacherNegative.evaluate(() => {
    const value = window.getBoardTrainerState();
    value.visual = { start: 0, end: 0, traveler: 0, arc: { from: 0, to: 0 }, wrong: 0 };
    window.applyBoardTrainerState(value);
    sendBoardTrainerState();
  });
  await studentNegative.waitForFunction(() => {
    const value = window.getBoardTrainerState().visual;
    return value.start === 0 && value.end === 0 && value.traveler === 0 && value.arc?.from === 0 && value.wrong === 0;
  }, null, { polling: 100 });
  assert.deepEqual(await storageSnapshot(studentNegative, 'mathExamCourseProgress.v1', ['sTotal', 'sRight', 'sStreak', 'history']), negativeStorageBefore);

  const oldContext = await browser.newContext();
  const oldStudent = await oldContext.newPage();
  const oldEvidence = instrument(oldStudent, 'old-client', ['[MathExamBoard] envelope-mismatch']);
  const oldUrl = new URL(studentLink);oldUrl.pathname = '/old/trainers/trainer-board.html';
  await oldStudent.goto(oldUrl.href, { waitUntil: 'domcontentloaded' });
  await oldStudent.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено', null, { polling: 100 });
  const oldNegative = await trainerFrame(oldStudent, 'negative-numbers-line.html');
  await teacherNegative.evaluate(() => { hint(); });
  await oldNegative.waitForFunction(() => typeof window.getBoardTrainerState === 'function' && window.getBoardTrainerState().hintVisible === true, null, { polling: 100 });

  assertCleanBrowser(teacherEvidence);
  assertCleanBrowser(studentEvidence);
  assertCleanBrowser(lateEvidence);
  assertCleanBrowser(oldEvidence);
  await oldContext.close();
  await lateContext.close();
  await studentContext.close();
  await teacherContext.close();
}

async function main() {
  const [sitePort, otherSitePort, boardPort] = await Promise.all([freePort(), freePort(), freePort()]);
  const siteOrigin = `http://127.0.0.1:${sitePort}`;
  const otherOrigin = `http://127.0.0.1:${otherSitePort}`;
  const boardOrigin = `http://127.0.0.1:${boardPort}`;
  const staticServer = await startStaticServer(sitePort);
  const otherStaticServer = await startStaticServer(otherSitePort);
  const boardServer = await startBoardServer(boardPort);
  let browser;
  try {
    const response = await fetch(`${boardOrigin}/api/trainer-registry`);
    assert.equal(response.status, 200);
    const registry = await response.json();
    const executablePath = EDGE_PATHS.find(candidate => existsSync(candidate));
    browser = await chromium.launch(executablePath ? { headless: true, executablePath } : { headless: true });
    const section = process.env.B2_SMOKE_SECTION || 'all';
    if (section === 'all' || section === 'static') await canonicalPathMatrix(browser, siteOrigin, boardOrigin, otherOrigin, registry);
    if (section === 'all' || section === 'registry') await registryValidationMatrix(browser, siteOrigin, boardOrigin, registry);
    if (section === 'all' || section === 'arrival') {
      await arrivalOrder(browser, siteOrigin, boardOrigin, registry, 'ready-first');
      await arrivalOrder(browser, siteOrigin, boardOrigin, registry, 'registry-first');
      await arrivalOrder(browser, siteOrigin, boardOrigin, registry, 'room-first');
      await arrivalOrder(browser, siteOrigin, boardOrigin, registry, 'room-last');
      await arrivalOrder(browser, siteOrigin, boardOrigin, registry, 'reload-pending');
    }
    if (section === 'all' || section === 'fail-closed') await arrivalAndFailClosed(browser, siteOrigin, boardOrigin, registry);
    if (section === 'all' || section === 'reconnect') await reconnectRegistryMatrix(browser, siteOrigin, boardOrigin, registry);
    if (section === 'all' || section === 'live') await liveTeacherStudent(browser, siteOrigin, boardOrigin, registry);
    console.log('TRAINER_REGISTRY_B2_BROWSER_REGRESSION_OK');
  } finally {
    if (browser) await browser.close();
    stopChild(boardServer);
    await Promise.all([
      new Promise(resolvePromise => staticServer.close(resolvePromise)),
      new Promise(resolvePromise => otherStaticServer.close(resolvePromise))
    ]);
  }
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
