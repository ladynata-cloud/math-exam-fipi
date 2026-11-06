'use strict';

// Real authored UI, isolated synthetic cabinet and two actual Socket.IO roles.
// No production account, room, student record or mocked bridge transport.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createRequire } = require('node:module');
const { createServer } = require('node:net');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const express = createRequire(path.join(ROOT, 'board-server/package.json'))('express');
const { LearningStore } = require('../board-server/learning-store');
const { createLearningApi } = require('../board-server/learning-api');
const { createTeachingRouter } = require('../board-server/learning-teaching');
const { hashPassword } = require('../board-server/learning-auth');
const contracts = require('../board-server/learning-contracts');
const course = require('../stereo-course/sections/data/course.json');
const COURSE = '/stereo-course/sections/';
const WRAPPER = '/trainers/sections-from-zero.html';
const PERSONAL_KEYS = [course.storageKey, 'mathexam.sections.master.activities.v1', 'sections-gate.unrelated'];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const listen = app => new Promise((resolve, reject) => {
  const server = app.listen(0, '127.0.0.1', () => resolve(server)); server.once('error', reject);
});
const close = server => server && new Promise(resolve => { server.closeAllConnections?.(); server.close(resolve); });
let phase = 'setup';

function stable(value) {
  return Array.isArray(value) ? value.map(stable) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
}

const snapshot = frame => frame.evaluate(() => window.__sectionsBoard.getState());
const personal = frame => frame.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), PERSONAL_KEYS);

async function waitSnapshot(frame, expected, label) {
  try {
    await frame.waitForFunction(expected => {
      const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object'
        ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
      return JSON.stringify(stable(window.__sectionsBoard.getState())) === JSON.stringify(stable(expected));
    }, expected, { polling: 50, timeout: 15000 });
  } catch (error) { assert.deepEqual(stable(await snapshot(frame)), stable(expected), label); throw error; }
}

function visible(frame) {
  return frame.evaluate(() => ({
    title: document.querySelector('#lesson-title')?.textContent,
    condition: document.querySelector('.lesson-condition')?.textContent,
    work: document.querySelector('.step-panel')?.textContent,
    history: [...document.querySelectorAll('[data-history-step]')].map(node => node.textContent),
    draft: document.querySelector('#proof-draft')?.value,
    answer: document.querySelector('#numeric-answer')?.value,
    feedback: document.querySelector('.answer-form .feedback')?.textContent,
    disclosures: [...document.querySelectorAll('.course-main details')].map(node => [node.querySelector('summary')?.textContent, node.open]),
    // Participants have different iframe widths. Compare visible authored
    // topology/plane/focus, while shared semantic state checks exact camera.
    geometry: [...document.querySelectorAll('.model-svg [data-edge],.model-svg [data-segment],.model-svg [data-point],.model-svg [data-label],.model-svg [data-active-plane],.model-svg [data-section-polygon]')].map(node => [
      node.tagName, node.textContent, ...['class', 'data-edge', 'data-hidden', 'data-segment', 'data-kind', 'data-step', 'data-label', 'data-point', 'data-active-plane', 'data-section-polygon'].map(key => node.getAttribute(key))
    ])
  }));
}

async function synchronized(controller, observer, label) {
  await controller.waitForFunction(() => !window.__sectionsBoard.isApplying(), null, { polling: 25 });
  await delay(100);
  const expected = await snapshot(controller);
  assert.equal(await controller.evaluate(state => window.__sectionsBoard.validateState(state), expected), true, label + ': valid exported state');
  await waitSnapshot(observer, expected, label + ': state converges');
  assert.deepEqual(await visible(observer), await visible(controller), label + ': visible work converges');
  return expected;
}

async function courseFrame(host) {
  const handle = await host.locator('#trainerFrame').elementHandle();
  assert(handle, 'real board trainer iframe');
  const frame = await handle.contentFrame();
  await frame.waitForFunction(() => typeof window.__sectionsBoard?.getState === 'function', null, { timeout: 20000 });
  assert.equal(new URL(frame.url()).pathname, WRAPPER);
  return frame;
}

async function openCard(frame, id) {
  const catalog = frame.locator('.catalog');
  if (!(await catalog.evaluate(node => node.open))) await catalog.locator(':scope > summary').click();
  await frame.locator('#catalog-query').fill(id);
  await frame.locator('[data-lesson-id="' + id + '"]').click();
  await frame.waitForFunction(id => window.SECTIONS_APP.getState().current === id, id);
}

async function construct(frame, count) {
  for (let i = 0; i < count; i++) {
    if (await frame.locator('[data-action="next-step"]').count()) await frame.locator('[data-action="next-step"]').click();
    await frame.locator('[data-action="construct"]').click();
  }
}

async function layout(page, frame, width, shot) {
  await page.setViewportSize({ width, height: 900 });
  await frame.locator('.lesson-header').evaluate(node => node.scrollIntoView({ block: 'start' }));
  await delay(100);
  const boxes = await frame.evaluate(() => {
    const rect = selector => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    return { width: innerWidth, height: innerHeight, scroll: document.documentElement.scrollWidth, condition: rect('.lesson-condition'), model: rect('.model-svg') };
  });
  assert(boxes.scroll <= boxes.width + 1, width + ': no horizontal overflow');
  for (const [name, b] of [['condition', boxes.condition], ['model', boxes.model]]) {
    assert(b.width > 0 && b.height > 0, width + ': ' + name + ' has visible dimensions');
    assert(b.x >= -1 && b.right <= boxes.width + 1, width + ': ' + name + ' fits width');
    assert(b.y >= -1 && b.bottom <= boxes.height + 1, width + ': condition and model fit together in one viewport');
  }
  if (process.env.SECTIONS_SHOTS) {
    fs.mkdirSync(process.env.SECTIONS_SHOTS, { recursive: true });
    await page.screenshot({ path: path.join(process.env.SECTIONS_SHOTS, shot + '-' + width + '.png'), fullPage: false });
  }
}

async function standalone(browser, publicOrigin, errors) {
  phase = 'personal beginner UI, retries, persistence and responsive layout';
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ru-RU' });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push('personal: ' + error.message));
  try {
    await page.goto(publicOrigin + COURSE);
    await page.getByRole('button', { name: 'Начать с первой грани', exact: true }).click();
    assert.equal(await page.locator('#lesson-title').textContent(), 'Находим одну грань');
    assert.equal(await page.evaluate(() => typeof window.__sectionsBoard), 'undefined');
    for (const width of [320, 1280]) await layout(page, page, width, 'sections-first-face');
    await page.locator('[data-action="start-study"]').click();
    assert.equal(await page.locator('[data-history-step]').count(), 0);
    await construct(page, 1);
    assert.equal(await page.locator('[data-history-step]').count(), 1);
    await page.goto(publicOrigin + COURSE + '#starter-18');
    await page.locator('[data-action="start-practice"]').click();
    await page.locator('[data-plane-choice="CGHD"]').click();
    await page.locator('[data-plane-choice="BFGC"]').click();
    assert.equal(await page.locator('[data-action="construct"]').count(), 0);
    assert.equal(await page.evaluate(() => window.SECTIONS_APP.getState().tasks['starter-18'].revealed), 0);
    await page.locator('.step-hint > summary').click();
    assert.equal(await page.locator('.step-hint').evaluate(node => node.open), true);
    assert.match(await page.locator('.step-hint').innerText(), /рёбра|ребра/);
    await page.locator('[data-plane-choice="AEFB"]').click(); await construct(page, 1);
    await page.locator('[data-action="next-step"]').click();
    await page.locator('[data-plane-choice="BFGC"]').click(); await construct(page, 1);
    assert.equal(await page.locator('[data-history-step]').count(), 2);
    await page.locator('.starter-draft > summary').click();
    await page.locator('#proof-draft').fill('M и N принадлежат грани AEFB.');
    await page.locator('.model-svg').press('ArrowRight');
    await delay(100);
    const saved = await page.evaluate(() => window.SECTIONS_APP.getState().tasks['starter-18']);
    const oldView = await visible(page);
    await page.reload();
    await page.locator('#lesson-title').waitFor();
    assert.deepEqual(await page.evaluate(() => window.SECTIONS_APP.getState().tasks['starter-18']), saved);
    assert.deepEqual(await visible(page), oldView);
    assert.equal(saved.independentSteps, 0, 'helped work never certifies independent mastery');
    await page.goto(publicOrigin + COURSE + '#auth-method-04');
    assert.equal(await page.evaluate(() => window.SECTIONS_MASTER.getState().view), 'lessons');
    assert.match(await page.locator('.lesson-condition').innerText(), /BQ/);
  } finally { await context.close(); }
}

async function run() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sections-course-gate-'));
  const store = new LearningStore({ filePath: path.join(tmp, 'learning.sqlite'), contracts });
  let publicServer, cabinetServer, roomProcess, browser, releaseSocket = () => {};
  try {
    assert(store.available, 'isolated SQLite database required');
    const password = 'Synthetic-sections-' + randomUUID();
    const invitation = store.bootstrap({ login: 'fixture_sections_teacher', name: 'Преподаватель теста' });
    const teacher = store.activate(invitation.invitationToken, await hashPassword(password)).account;
    const pupilInvitation = store.createStudent(teacher, { login: 'fixture_sections_pupil', name: 'Ученик теста' });
    const pupil = store.activate(pupilInvitation.invitationToken, await hashPassword(password, 'student')).account;
    store.saveStudentProfile(teacher, pupil.id, { opId: randomUUID(), expectedVersion: 0, course: 'school', goal: null, focus: '',
      program: { grade: 10, courseIds: ['sections-from-zero'] } });
    const initialProfile = store.studentProfile(teacher, pupil.id), initialAttempts = store.row('SELECT COUNT(*) AS n FROM attempts').n;
    const publicApp = express(); publicApp.use(express.static(ROOT)); publicServer = await listen(publicApp);
    const publicOrigin = 'http://localhost:' + publicServer.address().port;
    const app = express(); app.use(express.json()); cabinetServer = await listen(app);
    const cabinetOrigin = 'http://127.0.0.1:' + cabinetServer.address().port;
    const learning = createLearningApi({ store, publicOrigin: cabinetOrigin, secureCookies: false });
    app.get('/api/learning/status', (_request, response) => response.json({ ...store.status(), trainerOrigin: publicOrigin }));
    app.use('/api/learning', learning.router, createTeachingRouter(learning)); app.use(express.static(ROOT));
    const reservation = await listen(createServer());
    const port = reservation.address().port; await close(reservation);
    const boardOrigin = 'http://127.0.0.1:' + port;
    roomProcess = spawn(process.execPath, ['index.js'], { cwd: path.join(ROOT, 'board-server'),
      env: { PATH: process.env.PATH, HOST: '127.0.0.1', PORT: String(port), NODE_ENV: 'test', CORS_ALLOWED_ORIGINS: publicOrigin },
      stdio: 'ignore' });
    const deadline = Date.now() + 15000;
    for (;;) {
      if (roomProcess.exitCode !== null) throw Error('isolated room service exited');
      try { if ((await fetch(boardOrigin + '/health', { signal: AbortSignal.timeout(750) })).ok) break; } catch (_) {}
      if (Date.now() >= deadline) throw Error('isolated room service not healthy');
      await delay(75);
    }
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'], timeout: 15000 });
    const errors = [], external = [], writes = [], leaks = [], documents = [];
    await standalone(browser, publicOrigin, errors);
    const allowed = new Set([publicOrigin, cabinetOrigin, boardOrigin]);
    let heldClients = 0;
    const socketGate = new Promise(resolve => { releaseSocket = resolve; });
    async function participant(holdSocket = false) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ru-RU', serviceWorkers: 'block' });
      await context.routeWebSocket(url => url.origin !== boardOrigin.replace(/^http:/, 'ws:'), socket => { external.push(new URL(socket.url()).origin); return socket.close(); });
      await context.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url());
        if (!allowed.has(url.origin) && !['data:', 'blob:'].includes(url.protocol)) { external.push(url.origin + url.pathname); return route.abort(); }
        if (url.origin === cabinetOrigin && url.pathname.startsWith('/api/learning/') && !['GET', 'HEAD'].includes(request.method()) && url.pathname !== '/api/learning/login') writes.push(request.method() + ' ' + url.pathname);
        if (url.origin === publicOrigin) {
          const headers = await request.allHeaders();
          if (request.url().includes(pupil.id) || request.url().includes(teacher.id) || headers.cookie || (headers.referer || '').startsWith(cabinetOrigin)) leaks.push(url.pathname);
          if (holdSocket && url.pathname === WRAPPER && request.isNavigationRequest()) documents.push(url.href);
        }
        if (holdSocket && url.origin === boardOrigin && url.pathname === '/socket.io/socket.io.js') { heldClients++; await socketGate; }
        return route.continue();
      });
      await context.addInitScript(({ origin, server, keys, storageKey }) => {
        if (location.origin !== origin) return;
        if (!localStorage.getItem(keys[2])) {
          localStorage.setItem(storageKey, JSON.stringify({ version: 1, current: 'starter-03', tasks: { 'starter-03': { draft: 'Личный черновик вне комнаты', revealed: 0 } } }));
          localStorage.setItem(keys[1], JSON.stringify({ view: 'map', path: { stageId: 'begin-02', readiness: {} } }));
          localStorage.setItem(keys[2], 'preserve-byte-for-byte');
        }
        if (location.pathname === '/trainers/trainer-board.html') {
          localStorage.setItem('mathexam.trainerBoard.serverUrl', server);
          window.__sectionsGatePublished = 0;
          addEventListener('message', event => {
            if (event.source === document.querySelector('#trainerFrame')?.contentWindow && event.data?.type === 'mathexam:trainer-state') window.__sectionsGatePublished++;
          });
        }
      }, { origin: publicOrigin, server: boardOrigin, keys: PERSONAL_KEYS, storageKey: course.storageKey });
      const page = await context.newPage(); page.setDefaultTimeout(20000);
      page.on('pageerror', error => errors.push(error.message));
      return page;
    }
    phase = 'assigned cabinet card and pre-room selected card';
    const t = await participant(true), s = await participant();
    const back = 'student=' + pupil.id;
    await t.goto(cabinetOrigin + '/learning/?role=teacher#' + back);
    await t.locator('[name=login]').fill(teacher.login); await t.locator('[name=password]').fill(password);
    await t.locator('#auth-form [type=submit]').click(); await t.locator('#navigation').waitFor();
    await t.goto(cabinetOrigin + '/learning/#' + back);
    const card = t.locator('[data-program-course="sections-from-zero"]');
    const launch = card.locator('[data-program-board][data-cabinet-practice]');
    await card.locator('[data-program-open]').click();
    await t.locator('[data-cabinet-return]').waitFor();
    const personalFrameElement = t.locator('[data-public-workspace] iframe');
    const personalSource = new URL(await personalFrameElement.getAttribute('src'));
    assert.equal(personalSource.origin, publicOrigin); assert.equal(personalSource.pathname, COURSE);
    const personalFrame = await (await personalFrameElement.elementHandle()).contentFrame();
    await personalFrame.waitForFunction(() => !!window.SECTIONS_APP);
    assert.equal(await personalFrame.evaluate(() => typeof window.__sectionsBoard), 'undefined');
    await t.locator('[data-cabinet-return]').click(); await launch.waitFor();
    assert.equal(new URL(t.url()).hash, '#' + back, 'personal course returns to the same cabinet context');
    await launch.click(); await t.locator('[data-cabinet-return]').waitFor(); await t.reload();
    const boardElement = t.locator('[data-public-workspace] iframe');
    const src = new URL(await boardElement.getAttribute('src'));
    assert.equal(src.origin, publicOrigin); assert.equal(src.pathname, '/trainers/trainer-board.html');
    assert.deepEqual([...src.searchParams], [['trainer', WRAPPER]]);
    const board = await (await boardElement.elementHandle()).contentFrame();
    let teacherFrame = await courseFrame(board);
    const originalPersonal = await personal(teacherFrame);
    assert.equal((await snapshot(teacherFrame)).work.draft, '', 'board does not import personal draft');
    await openCard(teacherFrame, 'starter-18');
    await board.waitForFunction(() => document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'bridge-timeout', null, { timeout: 20000 });
    assert.equal(await board.locator('#studentLink').inputValue(), '');
    await board.locator('#openShare').click(); await board.locator('#createRoom').click();
    await board.waitForFunction(() => document.querySelector('#studentLink')?.value.includes('role=student'));
    const link = await board.locator('#studentLink').inputValue(), target = new URL(link);
    assert.equal(target.origin, publicOrigin); assert.equal(target.searchParams.get('server'), boardOrigin);
    assert(!link.includes(teacher.id) && !link.includes(pupil.id));
    teacherFrame = await courseFrame(board);
    await teacherFrame.waitForFunction(room => new URL(location.href).searchParams.get('seed') === room && location.hash === '#starter-18' && window.__sectionsBoard.getState().lessonId === 'starter-18', target.searchParams.get('room'));
    phase = 'real delayed handshake recovers an expired seeded document';
    const expiredDocument = await teacherFrame.evaluate(() => performance.timeOrigin);
    await board.waitForFunction(() => document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'bridge-timeout', null, { timeout: 20000 });
    assert.equal(heldClients, 1);
    const beforeRecovery = documents.length; releaseSocket();
    await board.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено');
    await board.locator('#sharePanel [data-close-panel]').click(); await s.goto(link);
    const ready = () => document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected';
    await Promise.all([board.waitForFunction(ready), s.waitForFunction(ready)]);
    teacherFrame = await courseFrame(board); let studentFrame = await courseFrame(s);
    assert.equal(documents.length, beforeRecovery + 1, 'expired seeded bridge refreshes once');
    assert.notEqual(await teacherFrame.evaluate(() => performance.timeOrigin), expiredDocument);
    assert.equal((await snapshot(teacherFrame)).lessonId, 'starter-18');
    await synchronized(teacherFrame, studentFrame, 'room retains preselected card');
    const studentPersonal = await personal(studentFrame);
    assert.deepEqual(await personal(teacherFrame), originalPersonal);
    const observerMessages = await s.evaluate(() => window.__sectionsGatePublished);

    phase = 'wrong action, hint, explicit steps and retained explanations mirror';
    await teacherFrame.locator('[data-action="start-practice"]').click();
    await teacherFrame.locator('[data-plane-choice="CGHD"]').click();
    await teacherFrame.locator('[data-plane-choice="BFGC"]').click();
    const wrong = await synchronized(teacherFrame, studentFrame, 'wrong plane feedback');
    assert.equal(wrong.work.revealed, 0);
    await teacherFrame.locator('.step-hint > summary').click();
    await synchronized(teacherFrame, studentFrame, 'open hint after two errors');
    await teacherFrame.locator('[data-plane-choice="AEFB"]').click(); await construct(teacherFrame, 1);
    await teacherFrame.locator('[data-action="next-step"]').click();
    await teacherFrame.locator('[data-plane-choice="BFGC"]').click(); await construct(teacherFrame, 1);
    const built = await synchronized(teacherFrame, studentFrame, 'two retained explanations');
    assert.equal(built.work.revealed, 2); assert.equal(built.work.independentSteps, 0);
    assert.equal(await studentFrame.locator('[data-history-step]').count(), 2);
    await teacherFrame.locator('.starter-draft > summary').click();
    await teacherFrame.locator('#proof-draft').fill('a < b, c > d; <img src=x> — это текст рассуждения');
    await teacherFrame.locator('.model-svg').press('ArrowRight');
    await synchronized(teacherFrame, studentFrame, 'lossless text and camera');
    assert.equal(await studentFrame.locator('img[src=x]').count(), 0);
    assert.equal(await s.evaluate(() => window.__sectionsGatePublished), observerMessages, 'observer hydration does not echo');

    phase = 'observer reload, control transfer and board-host document reload';
    const beforeReload = await snapshot(teacherFrame);
    await s.reload(); await s.waitForFunction(ready); studentFrame = await courseFrame(s);
    await waitSnapshot(studentFrame, beforeReload, 'student reload');
    await synchronized(teacherFrame, studentFrame, 'reloaded observer');
    await board.locator('#openShare').click(); await board.locator('#controlToggle').click();
    await s.waitForFunction(() => document.body.classList.contains('control-owner'));
    await board.waitForFunction(() => !document.body.classList.contains('control-owner'));
    await board.locator('#sharePanel [data-close-panel]').click();
    assert.equal(await board.locator('#trainerFrame').evaluate(node => getComputedStyle(node).pointerEvents), 'none');
    await studentFrame.locator('#proof-draft').fill('Запись ученика после передачи управления');
    await studentFrame.locator('.model-svg').press('ArrowUp');
    const pupilState = await synchronized(studentFrame, teacherFrame, 'student text and camera reach teacher');
    // Reload the board host's current document, whose URL contains the room
    // marker. Reloading the outer cabinet instead remounts its original entry
    // URL; that separate platform behavior is not claimed as room recovery.
    assert.equal(new URL(board.url()).searchParams.get('room'), target.searchParams.get('room'));
    await Promise.all([board.waitForNavigation({ waitUntil: 'domcontentloaded' }), board.evaluate(() => location.reload())]);
    const reloadedBoard = board;
    await reloadedBoard.waitForFunction(ready); teacherFrame = await courseFrame(reloadedBoard);
    await waitSnapshot(teacherFrame, pupilState, 'teacher board-host document reload');
    assert.equal(await s.evaluate(() => document.body.classList.contains('control-owner')), true);
    const beforeRetry = await teacherFrame.evaluate(() => performance.timeOrigin);
    await reloadedBoard.locator('#trainerOptions').click(); await reloadedBoard.locator('#retryOpenedTrainer').click();
    await reloadedBoard.waitForFunction(ready); await reloadedBoard.locator('#trainerPanel [data-close-panel]').click();
    teacherFrame = await courseFrame(reloadedBoard);
    await waitSnapshot(teacherFrame, pupilState, 'actual retry button restores current trainer');
    assert.notEqual(await teacherFrame.evaluate(() => performance.timeOrigin), beforeRetry);
    await s.reload(); await s.waitForFunction(ready); studentFrame = await courseFrame(s);
    await waitSnapshot(studentFrame, pupilState, 'student controller reload');
    assert.equal(await s.evaluate(() => document.body.classList.contains('control-owner')), true);
    await reloadedBoard.locator('#openShare').click(); await reloadedBoard.locator('#controlToggle').click();
    await reloadedBoard.waitForFunction(() => document.body.classList.contains('control-owner'));
    await s.waitForFunction(() => !document.body.classList.contains('control-owner'));
    await reloadedBoard.locator('#sharePanel [data-close-panel]').click();
    await teacherFrame.locator('#proof-draft').fill('Работа преподавателя после возврата управления');
    await synchronized(teacherFrame, studentFrame, 'revocation preserves work');

    phase = 'numeric feedback, finite camera gesture and narrow board';
    await openCard(teacherFrame, 'auth-method-04');
    await teacherFrame.locator('[data-action="start-study"]').click();
    await construct(teacherFrame, course.lessons.find(l => l.id === 'auth-method-04').steps.length);
    await teacherFrame.locator('#numeric-answer').fill('1/0'); await teacherFrame.locator('.answer-form button[type="submit"]').click();
    await synchronized(teacherFrame, studentFrame, 'invalid numeric feedback');
    await teacherFrame.locator('#numeric-answer').fill('2/2'); await teacherFrame.locator('.answer-form button[type="submit"]').click();
    const answered = await synchronized(teacherFrame, studentFrame, 'correct fraction with help attribution');
    assert.equal(answered.work.correctAnswer, true); assert.equal(answered.work.workedSeen, true);
    const svg = teacherFrame.locator('.model-svg'); await svg.scrollIntoViewIfNeeded();
    const box = await svg.boundingBox(), beforeCamera = answered.work.camera;
    assert(box && box.width > 0 && box.height > 0);
    await t.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await t.mouse.down();
    await t.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 - 15, { steps: 4 }); await t.mouse.up();
    const dragged = await synchronized(teacherFrame, studentFrame, 'actual pointer gesture');
    assert(Math.abs(dragged.work.camera.yaw - beforeCamera.yaw - 30 * .008) < 1e-7);
    assert(Math.abs(dragged.work.camera.pitch - beforeCamera.pitch - 15 * .006) < 1e-7);
    await openCard(teacherFrame, 'starter-01');
    await synchronized(teacherFrame, studentFrame, 'return to first face');
    await t.setViewportSize({ width: 320, height: 900 });
    const narrow = await teacherFrame.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    assert(narrow.width <= 320 && narrow.scroll <= narrow.width + 1, 'nested board fits 320px');
    if (process.env.SECTIONS_SHOTS) await t.screenshot({ path: path.join(process.env.SECTIONS_SHOTS, 'sections-shared-cabinet-320.png') });
    await t.setViewportSize({ width: 1280, height: 900 });
    if (process.env.SECTIONS_SHOTS) await t.screenshot({ path: path.join(process.env.SECTIONS_SHOTS, 'sections-shared-cabinet-1280.png') });

    phase = 'invalid snapshots, storage isolation, idle and exact cabinet return';
    const beforeInvalid = await snapshot(teacherFrame), beforeInvalidView = await visible(teacherFrame);
    const rejected = await teacherFrame.evaluate(() => {
      const state = structuredClone(window.__sectionsBoard.getState()); state.lessonId = 'unreviewed-card';
      try { return window.__sectionsBoard.applyState(state) === false; } catch (_) { return true; }
    });
    assert.equal(rejected, true); assert.deepEqual(await snapshot(teacherFrame), beforeInvalid);
    assert.deepEqual(await visible(teacherFrame), beforeInvalidView);
    await delay(500);
    const counts = await Promise.all([reloadedBoard.evaluate(() => window.__sectionsGatePublished), s.evaluate(() => window.__sectionsGatePublished)]);
    await delay(600);
    assert.deepEqual(await Promise.all([reloadedBoard.evaluate(() => window.__sectionsGatePublished), s.evaluate(() => window.__sectionsGatePublished)]), counts, 'idle room produces no echo loop');
    assert.deepEqual(await personal(teacherFrame), originalPersonal); assert.deepEqual(await personal(studentFrame), studentPersonal);
    await t.locator('[data-cabinet-return]').click(); await launch.waitFor();
    assert.equal(new URL(t.url()).hash, '#' + back); assert.equal(await t.evaluate(() => LearningApp.account().id), teacher.id);
    assert.equal(await t.locator('[data-public-workspace] iframe').count(), 0);
    assert.deepEqual(store.studentProfile(teacher, pupil.id), initialProfile);
    assert.equal(store.row('SELECT COUNT(*) AS n FROM attempts').n, initialAttempts);
    assert.deepEqual(writes, []); assert.deepEqual(leaks, []); assert.deepEqual(external, []); assert.deepEqual(errors, []);
    console.log('SECTIONS_COURSE_BROWSER_OK: beginner start; wrong action and two-error hint; retained steps/draft/camera/deep links; 320/1280 layout; assigned cabinet course and board with exact return; pre-room selection and delayed Socket.IO document recovery; two participants; lossless text and numeric feedback; bidirectional camera; student observer/controller page reload; teacher board-host document reload; actual trainer retry button; transfer/revoke; no echo; isolated personal storage');
  } finally {
    releaseSocket(); await browser?.close(); if (roomProcess?.exitCode === null) roomProcess.kill('SIGTERM');
    await close(cabinetServer); await close(publicServer); store.close(); fs.rmSync(tmp, { recursive: true, force: true });
  }
}

run().catch(error => {
  console.error('SECTIONS_COURSE_BROWSER_FAILED at ' + phase + ': ' + String(error.stack || error).replace(/([?&](?:room|token)=)[^\s&"'<>]+/g, '$1[redacted]'));
  process.exitCode = 1;
});
