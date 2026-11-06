'use strict';

// Actual local public-board/Socket.IO flow with two isolated synthetic users.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');
const M = require('../../trainers/spacemath/model.js');

const ROOT = path.resolve(__dirname, '../..');
const OUT = process.env.SPACEMATH_ARTIFACTS || path.join(os.tmpdir(), 'spacemath-public-evidence');
const TRAINER_PATH = '/trainers/spacemath/index.html';
const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH || process.env.BROWSER_EXECUTABLE_PATH;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const passes = [], errors = [], externalRequests = [], sessions = [];
let phase = 'startup';
fs.mkdirSync(OUT, { recursive: true });
function passed(name) { passes.push(name); console.log('PASS', name); }

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
function staticServer() {
  return http.createServer((request, response) => {
    try {
      const pathname = new URL(request.url, 'http://local').pathname;
      if (pathname === '/favicon.ico') return response.writeHead(204).end();
      let file = path.resolve(ROOT, '.' + pathname);
      if (!file.startsWith(ROOT + path.sep)) return response.writeHead(403).end();
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      response.setHeader('Content-Type', { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream');
      response.setHeader('Cache-Control', 'no-store');
      if (request.method === 'HEAD') return response.end();
      fs.createReadStream(file).pipe(response);
    } catch (_) { response.writeHead(404).end(); }
  });
}
async function healthy(origin, child, logs) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Local board server exited: ' + logs());
    try { if ((await fetch(origin + '/health', { signal: AbortSignal.timeout(1000) })).ok) return; } catch (_) {}
    await wait(100);
  }
  throw new Error('Local board server not ready: ' + logs());
}
async function session(browser, siteOrigin, boardOrigin, name) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const allowedOrigins = new Set([siteOrigin, boardOrigin]);
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (allowedOrigins.has(url.origin) || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
    externalRequests.push(name + ': ' + url.origin + url.pathname);
    return route.abort();
  });
  await context.addInitScript(({ origin, trainerPath }) => {
    if (location.origin !== origin) return;
    if (window === top) {
      window.__spaceMirrorMessages = 0;
      addEventListener('message', event => {
        if (event.source === document.querySelector('#trainerFrame')?.contentWindow &&
            event.data?.type === 'mathexam:trainer-state' && event.data?.trainerId === 'spacemath') window.__spaceMirrorMessages++;
      });
    } else if (location.pathname === trainerPath) {
      window.__spaceStorageCalls = [];
      for (const method of ['getItem', 'setItem', 'removeItem', 'clear']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (...args) {
          window.__spaceStorageCalls.push(method);
          return original.apply(this, args);
        };
      }
    }
  }, { origin: siteOrigin, trainerPath: TRAINER_PATH });
  const page = await context.newPage();
  page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(20000);
  page.on('pageerror', error => errors.push(name + ': ' + error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (allowedOrigins.has(url.origin) && response.status() >= 400) errors.push(name + ': HTTP ' + response.status() + ' ' + url.pathname);
  });
  const result = { context, page, name }; sessions.push(result); return result;
}
async function frameFor(page) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const frame = page.frames().find(item => { try { return new URL(item.url()).pathname === TRAINER_PATH; } catch (_) { return false; } });
    if (frame) { await frame.waitForFunction(() => !!window.SpaceMathApp); return frame; }
    await wait(50);
  }
  throw new Error('SpaceMath iframe did not load');
}
const snapshot = frame => frame.evaluate(() => SpaceMathApp.getState());
const messages = page => page.evaluate(() => window.__spaceMirrorMessages);
const connected = page => page.waitForFunction(() => document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected');
async function exact(frame, state) { await frame.waitForFunction(value => JSON.stringify(SpaceMathApp.getState()) === JSON.stringify(value), state); }
async function synchronized(controller, observer) {
  const state = await snapshot(controller); M.normalize(state); await exact(observer, state); return state;
}
async function quiet(pages) {
  let previous = await Promise.all(pages.map(messages)), unchanged = Date.now();
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    await wait(100); const current = await Promise.all(pages.map(messages));
    if (current.some((value, index) => value !== previous[index])) unchanged = Date.now();
    else if (Date.now() - unchanged >= 500) return current;
    previous = current;
  }
  throw new Error('SpaceMath mirrors did not settle');
}
async function pointScreen(page, frame, name) {
  await frame.locator('#geometry-board').scrollIntoViewIfNeeded();
  const local = await frame.evaluate(name => {
    const board = Object.values(JXG.boards).find(item => item.containerObj?.id === 'geometry-board');
    const point = board.objectsList.find(item => item.elType === 'point' && item.name === name);
    const rect = document.getElementById('geometry-board').getBoundingClientRect();
    return { x: rect.x + point.coords.scrCoords[1], y: rect.y + point.coords.scrCoords[2] };
  }, name);
  const outer = await page.locator('#trainerFrame').boundingBox();
  return { x: outer.x + local.x, y: outer.y + local.y };
}
async function drag(page, point, dx, dy) {
  await page.mouse.move(point.x, point.y); await page.mouse.down();
  await page.mouse.move(point.x + dx, point.y + dy, { steps: 12 }); await page.mouse.up();
}
async function handoff(teacher, student, pupilWrites) {
  await teacher.locator('#openShare').click(); await teacher.locator('#controlToggle').click();
  await student.waitForFunction(writes => document.body.classList.contains('control-owner') === writes, pupilWrites);
  await teacher.waitForFunction(writes => document.body.classList.contains('control-owner') !== writes, pupilWrites);
  assert.equal(await student.locator('#trainerFrame').evaluate(element => element.inert), !pupilWrites);
  assert.equal(await teacher.locator('#trainerFrame').evaluate(element => element.inert), pupilWrites);
  await teacher.locator('#sharePanel [data-close-panel]').click();
}

async function run(browser, siteOrigin, boardOrigin) {
  const ts = await session(browser, siteOrigin, boardOrigin, 'teacher'), teacher = ts.page;
  phase = 'existing picker and construction before room';
  await teacher.goto(siteOrigin + '/trainers/trainer-board.html?server=' + encodeURIComponent(boardOrigin));
  await teacher.waitForFunction(() => document.querySelector('#pickerGroup')?.options.length > 3);
  await teacher.locator('#chooseTrainer').click(); await teacher.locator('#pickerSearch').fill('SpaceMath');
  assert.equal(await teacher.locator('.picker-item').count(), 1);
  await teacher.locator('.picker-item').click(); let t = await frameFor(teacher);
  assert.equal(await teacher.locator('#openedTrainerTitle').innerText(), 'SpaceMath');
  await t.locator('#example').click(); await t.waitForFunction(() => SpaceMathApp.getState().objects.length === 11);
  await t.locator('#model-title').fill('SpaceMath · модель до комнаты'); await t.locator('#model-title').press('Tab');
  const beforeRoom = await snapshot(t); assert.equal(beforeRoom.title, 'SpaceMath · модель до комнаты');
  assert.deepEqual(await t.evaluate(() => window.__spaceStorageCalls), []);

  phase = 'create real local room and preserve constructed model';
  await teacher.locator('#openShare').click(); await teacher.locator('#createRoom').click();
  await teacher.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено' && document.querySelector('#studentLink')?.value.includes('role=student'));
  const invitation = await teacher.locator('#studentLink').inputValue();
  assert.equal(new URL(invitation).origin, siteOrigin, 'only a local synthetic invitation is used');
  await teacher.locator('#sharePanel [data-close-panel]').click(); await connected(teacher);
  t = await frameFor(teacher); await exact(t, beforeRoom);
  passed('existing picker opens SpaceMath and pre-room construction survives seeded iframe reload');

  phase = 'pupil late join and native observer guard';
  const ss = await session(browser, siteOrigin, boardOrigin, 'pupil'), student = ss.page;
  await student.goto(invitation); await connected(student); let s = await frameFor(student); await exact(s, beforeRoom);
  assert.equal(await student.locator('#trainerFrame').evaluate(element => element.inert), true);
  const observerBefore = await snapshot(s), position = await pointScreen(student, s, 'C');
  await drag(student, position, 35, 30); assert.deepEqual(await snapshot(s), observerBefore); await exact(t, observerBefore);
  passed('late pupil receives complete dependencies and native observer drag cannot change them');

  phase = 'teacher edit and passive observer silence';
  await quiet([teacher, student]); const studentMessages = await messages(student);
  await t.locator('[data-object="a"]').click(); await t.locator('#edit-x').fill('-5'); await t.locator('#edit-object-form button[type="submit"]').click();
  let state = await synchronized(t, s); assert.equal(M.evaluate(state).m.x, -.5);
  await quiet([teacher, student]); assert.equal(await messages(student), studentMessages, 'hydrated pupil does not echo teacher edits');
  passed('teacher edit mirrors exact semantic graph without observer echo');

  phase = 'explicit handoff and pupil native drag';
  await handoff(teacher, student, true); await quiet([teacher, student]); const teacherMessages = await messages(teacher);
  const start = await snapshot(s); await s.locator('[data-tool="move"]').click(); await drag(student, await pointScreen(student, s, 'C'), 35, 38);
  state = await synchronized(s, t);
  assert.notEqual(state.objects.find(item => item.id === 'c').y, start.objects.find(item => item.id === 'c').y);
  const values = M.evaluate(state), c = state.objects.find(item => item.id === 'c');
  assert.ok(Math.abs(values.h.x - c.x) < 1e-8); assert.ok(Math.abs(values.h.y + 2) < 1e-8);
  assert.ok(Math.abs(values.reading.value - 90) < 1e-8);
  await quiet([teacher, student]); assert.equal(await messages(teacher), teacherMessages, 'teacher observer does not echo pupil drag');
  passed('explicit handoff lets pupil drag free point while dependent geometry mirrors back');

  phase = 'reload pupil and restore model after automatic return of control';
  await student.reload(); await connected(student); s = await frameFor(student); await exact(s, state); await exact(t, state);
  // The existing room contract returns control to the teacher when the pupil's
  // last connection closes. Reload must restore work without reclaiming it.
  await teacher.waitForFunction(() => document.body.classList.contains('control-owner'));
  await student.waitForFunction(() => !document.body.classList.contains('control-owner'));
  assert.equal(await student.locator('#trainerFrame').evaluate(element => element.inert), true);
  await quiet([teacher, student]);
  const unchangedStudent = await messages(student); await t.locator('#show-grid').uncheck(); state = await synchronized(t, s);
  assert.equal(state.view.grid, false); await quiet([teacher, student]); assert.equal(await messages(student), unchangedStudent);
  const counts = await quiet([teacher, student]); await wait(500);
  assert.deepEqual(await Promise.all([teacher, student].map(messages)), counts, 'idle peers do not publish an echo loop');
  assert.deepEqual(await t.evaluate(() => window.__spaceStorageCalls), []); assert.deepEqual(await s.evaluate(() => window.__spaceStorageCalls), []);
  passed('pupil reload returns control to teacher and restores the model without personal storage');

  await t.evaluate(() => window.scrollTo(0, 0)); await s.evaluate(() => window.scrollTo(0, 0));
  await teacher.screenshot({ path: path.join(OUT, 'public-teacher.png'), fullPage: true, mask: [teacher.locator('#studentLink')] });
  await student.screenshot({ path: path.join(OUT, 'public-pupil.png'), fullPage: true, mask: [student.locator('#studentLink')] });
  assert.deepEqual(errors, []); assert.deepEqual(externalRequests, []);
  passed('no script errors, missing local assets or external requests');
  console.log('SPACEMATH_PUBLIC_BROWSER_PASS', passes.length);
}

(async () => {
  const server = staticServer(); let browser, child, watchdog, logs = '';
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const siteOrigin = 'http://127.0.0.1:' + server.address().port, boardOrigin = 'http://127.0.0.1:' + await freePort();
    const env = { ...process.env, HOST: '127.0.0.1', PORT: new URL(boardOrigin).port, NODE_ENV: 'test', CORS_ALLOWED_ORIGINS: siteOrigin };
    for (const key of Object.keys(env)) if (/^(LEARNING_|PROGRESS_|GROUP_LESSON_|TRAINER_REGISTRY_PATH$)/.test(key)) delete env[key];
    child = spawn(process.execPath, ['index.js'], { cwd: path.join(ROOT, 'board-server'), env, stdio: ['ignore', 'ignore', 'pipe'] });
    child.stderr.on('data', data => { logs = (logs + String(data)).slice(-4000); });
    await healthy(boardOrigin, child, () => logs);
    browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    await Promise.race([run(browser, siteOrigin, boardOrigin), new Promise((_, reject) => { watchdog = setTimeout(() => reject(new Error('Public browser gate timeout at ' + phase)), 180000); })]);
  } catch (error) {
    for (const session of sessions) if (!session.page.isClosed()) {
      const diagnostic = await session.page.evaluate(() => ({ mirror: document.querySelector('#mirrorStatus')?.dataset.mirrorStatus, connected: typeof shared === 'object' && shared.connected, writer: document.body.classList.contains('control-owner'), messages: window.__spaceMirrorMessages })).catch(() => null);
      console.error('DIAGNOSTIC', session.name, JSON.stringify(diagnostic));
      await session.page.screenshot({ path: path.join(OUT, 'public-failure-' + session.name + '.png'), mask: [session.page.locator('#studentLink')], timeout: 3000 }).catch(() => {});
    }
    throw error;
  } finally {
    clearTimeout(watchdog);
    fs.writeFileSync(path.join(OUT, 'public-summary.json'), JSON.stringify({ phase, passes, errors, externalRequests, chromium: browser?.version() || null }, null, 2));
    await browser?.close(); if (child && child.exitCode === null) child.kill('SIGTERM');
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error('SPACEMATH_PUBLIC_BROWSER_FAILED at ' + phase + '\n' + (error.stack || error)); process.exitCode = 1; });
