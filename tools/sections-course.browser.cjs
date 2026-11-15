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

function assertTeacherRoomUrl(host, roomId, server) {
  const params = new URL(host.url()).searchParams;
  assert.equal(params.has('trainer'), false, 'teacher room URL has no obsolete course-entry query');
  assert.equal(params.has('token'), false, 'teacher room URL never exposes its token');
  assert.equal(params.get('room') === roomId, true, 'teacher retains the same room marker');
  assert.equal(params.get('server') === server, true, 'teacher retains the same room service');
  assert.equal(params.get('role'), 'teacher');
}

async function waitMirror(host, expected, label) {
  try {
    await host.waitForFunction(value => document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === value,
      expected, { timeout: 20000 });
  } catch (error) {
    // Diagnostics contain fixed status labels, booleans and paths only. Never
    // print room URLs, session credentials, participant IDs or authored work.
    const diagnostic = await host.evaluate(() => {
      const frame = document.querySelector('#trainerFrame');
      return {
        hostPath: location.pathname,
        trainerPath: frame ? new URL(frame.src, location.href).pathname : null,
        mirror: document.querySelector('#mirrorStatus')?.dataset.mirrorStatus || null,
        frameStatus: document.querySelector('#frameStatus')?.dataset.state || null,
        shareConnected: document.querySelector('#shareStatus')?.textContent === 'подключено',
        socketConnected: typeof shared !== 'undefined' && !!shared.connected,
        roomReceived: typeof roomStateReceived !== 'undefined' && !!roomStateReceived,
        bridgeReady: typeof readyCandidate !== 'undefined' && !!readyCandidate,
        bridgeHydrated: typeof bridgeSession !== 'undefined' && !!bridgeSession?.hydrated,
        controlOwner: document.body.classList.contains('control-owner')
      };
    }).catch(() => ({ unavailable: true }));
    console.error('SECTIONS_MIRROR_WAIT_DIAGNOSTIC ' + JSON.stringify({ label, expected, ...diagnostic }));
    throw error;
  }
}

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
    geometry: [...document.querySelectorAll('.course-main .model-svg [data-edge],.course-main .model-svg [data-segment],.course-main .model-svg [data-point],.course-main .model-svg [data-label],.course-main .model-svg [data-active-plane],.course-main .model-svg [data-section-polygon]')].map(node => [
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

async function checkNumericLesson(frame, observer = null) {
  let result;
  for (const [answer, action, invalid, checked, correct, feedback] of [
    ['1/0', 'click', true, false, false, /Введи число/],
    ['7/11', 'Enter', false, true, false, /Пока результат не совпал/],
    ['2/2', 'click', false, true, true, /Численный результат совпал/],
    ['1', 'Enter', false, true, true, /Численный результат совпал/]
  ]) {
    await frame.locator('#numeric-answer').fill(answer);
    if (action === 'click') await frame.locator('[data-action="check-numeric-answer"]').click();
    else await frame.locator('#numeric-answer').press('Enter');
    result = observer ? await synchronized(frame, observer, 'numeric ' + action + ' feedback') :
      { work: await frame.evaluate(() => { const state = window.SECTIONS_APP.getState(); return state.tasks[state.current]; }) };
    assert.equal(result.work.answer, answer); assert.equal(result.work.answerInvalid, invalid);
    assert.equal(result.work.answerChecked, checked); assert.equal(result.work.correctAnswer, correct);
    assert.equal(result.work.workedSeen, true, 'checking never erases explanation use');
    assert.match(await frame.locator('.answer-form .feedback').innerText(), feedback);
  }
  return result;
}

async function checkPersonalNumericPractice(frame) {
  await frame.locator('[data-view="practice"]').click();
  await frame.getByLabel('Тренируемое умение', { exact: true }).selectOption('ratio');
  assert.equal(await frame.locator('.drill-prompt').innerText(), 'M∈AB, AM:MB=2:4, AB=12. Найди AM.');
  for (const [answer, action, checked, correct, feedback] of [
    ['1/0', 'click', false, false, /Введи число/],
    ['7/11', 'Enter', true, false, /Пока не совпало/],
    ['8/2', 'click', true, true, /Ответ совпал/],
    ['4', 'Enter', true, true, /Ответ совпал/]
  ]) {
    await frame.locator('#drill-answer').fill(answer);
    if (action === 'click') await frame.locator('[data-action="check-drill-answer"]').click();
    else await frame.locator('#drill-answer').press('Enter');
    const work = await frame.evaluate(() => window.SECTIONS_MASTER.getState().practice.topics.ratio);
    assert.equal(work.answer, answer); assert.equal(work.checked, checked); assert.equal(work.correct, correct);
    assert.match(await frame.locator('.drill-card .feedback').innerText(), feedback);
  }
  const saved = await frame.evaluate(() => JSON.parse(localStorage.getItem('mathexam.sections.master.activities.v1')).practice.topics.ratio);
  assert.equal(saved.answer, '4'); assert.equal(saved.checked, true); assert.equal(saved.correct, true);
  assert.equal(saved.hadError, true, 'later success retains the earlier error');
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
    return { width: innerWidth, height: innerHeight, scroll: document.documentElement.scrollWidth, condition: rect('.lesson-condition'), model: rect('.course-main .model-svg'), boardAction: rect('[data-sections-board-open]') };
  });
  assert(boxes.scroll <= boxes.width + 1, width + ': no horizontal overflow');
  for (const [name, b] of [['condition', boxes.condition], ['model', boxes.model], ['board action', boxes.boardAction]]) {
    assert(b.width > 0 && b.height > 0, width + ': ' + name + ' has visible dimensions');
    assert(b.x >= -1 && b.right <= boxes.width + 1, width + ': ' + name + ' fits width');
    assert(b.y >= -1 && b.bottom <= boxes.height + 1, width + ': condition, model and board action fit together in one viewport');
  }
  assert(boxes.boardAction.height >= 44, width + ': board action has a usable touch target');
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
    assert.equal(await page.locator('[data-path-stage]').count(), 26, 'all route stages are exposed');
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.locator('[data-action="path-start"]').scrollIntoViewIfNeeded();
      const map = await page.evaluate(() => ({
        width: innerWidth, scroll: document.documentElement.scrollWidth,
        stages: [...document.querySelectorAll('[data-path-stage]')].map(node => {
          const r = node.getBoundingClientRect();
          return { id: node.dataset.pathStage, width: r.width, height: r.height, x: r.x, right: r.right,
            hiddenInDisclosure: !!node.closest('details:not([open])') };
        })
      }));
      assert(map.scroll <= width + 1, 'route has no horizontal overflow at ' + width);
      assert.deepEqual(map.stages.map(node => node.id), course.learningPath.map(stage => stage.id));
      for (const item of map.stages) {
        assert(!item.hiddenInDisclosure && item.height >= 44 && item.width > 0 && item.x >= -1 && item.right <= width + 1, 'visible, usable route stage at ' + width + ': ' + item.id);
      }
      if (process.env.SECTIONS_SHOTS) {
        fs.mkdirSync(process.env.SECTIONS_SHOTS, { recursive: true });
        await page.screenshot({ path: path.join(process.env.SECTIONS_SHOTS, 'sections-path-top-' + width + '.png') });
        await page.locator('#path-overview-title').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(process.env.SECTIONS_SHOTS, 'sections-path-map-' + width + '.png') });
      }
    }
    const beforeTour = await personal(page);
    await page.locator('.sections-tours > summary').click();
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const kind of ['start', 'resume', 'construct']) {
        const trigger = page.locator('[data-tour-open="' + kind + '"]');
        await trigger.click();
        const dialog = page.locator('[data-sections-tour]');
        await dialog.waitFor({ state: 'visible' });
        assert.equal(await dialog.locator('[data-tour-frame]').getAttribute('data-tour-frame'), '0');
        while (await dialog.locator('[data-tour-action="next"]').isEnabled()) await dialog.locator('[data-tour-action="next"]').click();
        const bounds = await dialog.evaluate(node => {
          const box = node.getBoundingClientRect();
          return { left: box.left, right: box.right, top: box.top, bottom: box.bottom,
            width: innerWidth, height: innerHeight, scroll: node.scrollWidth, client: node.clientWidth,
            controls: [...node.querySelectorAll('button')].map(button => button.getBoundingClientRect().height) };
        });
        assert(bounds.left >= 0 && bounds.right <= bounds.width + 1 && bounds.top >= 0 && bounds.bottom <= bounds.height + 1, 'tour remains in viewport');
        assert(bounds.scroll <= bounds.client + 1 && bounds.controls.every(height => height >= 44), 'tour has no horizontal overflow and usable controls');
        if (kind === 'construct') {
          assert.equal(await dialog.locator('[data-segment]').count(), 3);
          if (process.env.SECTIONS_SHOTS) await page.screenshot({ path: path.join(process.env.SECTIONS_SHOTS, 'sections-tour-section-' + width + '.png') });
        }
        await dialog.press('Escape');
        assert.equal(await trigger.evaluate(node => document.activeElement === node), true, 'tour returns keyboard focus');
        assert.deepEqual(await personal(page), beforeTour, 'watching does not change personal work');
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('[data-tour-open="construct"]').click();
    assert.equal(await page.locator('[data-tour-action="play"]').isEnabled(), false);
    await page.locator('[data-tour-action="next"]').click();
    assert.equal(await page.locator('[data-tour-frame]').getAttribute('data-tour-frame'), '1');
    await page.locator('[data-tour-action="close"]').click();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
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
    assert.equal(await page.locator('.course-main .model-svg').count(), 1, 'one active lesson model, separate from the tour example');
    await page.locator('.course-main .model-svg').press('ArrowRight');
    await delay(100);
    const saved = await page.evaluate(() => window.SECTIONS_APP.getState().tasks['starter-18']);
    const oldView = await visible(page);
    await page.reload();
    await page.locator('#lesson-title').waitFor();
    assert.deepEqual(await page.evaluate(() => window.SECTIONS_APP.getState().tasks['starter-18']), saved);
    assert.deepEqual(await visible(page), oldView);
    assert.equal(saved.independentSteps, 0, 'helped work never certifies independent mastery');
    assert.equal(saved.mistakes, 2, 'mistakes stay distinct from the hint');
    await page.locator('[data-view="map"]').click();
    await page.locator('[data-action="path-resume"]').click();
    assert.deepEqual(await page.evaluate(() => window.SECTIONS_APP.getState().tasks['starter-18']), saved, 'visible continuation preserves exact saved work');
    await page.goto(publicOrigin + COURSE + '#starter-03');
    await page.locator('[data-action="start-practice"]').click();
    await page.locator('[data-plane-choice="EFGH"]').click();
    assert.equal(await page.evaluate(() => window.SECTIONS_APP.getState().tasks['starter-03'].helpUsed), false);
    await page.locator('[data-plane-choice="DHEA"]').click(); await construct(page, 1);
    await page.locator('[data-check-option="0"]').click();
    assert.equal(await page.evaluate(() => window.SECTIONS_APP.getState().tasks['starter-03'].choiceEvidence), 'corrected');
    await page.locator('.result-details > summary').click();
    await page.waitForFunction(() => window.SECTIONS_APP.getState().tasks['starter-03'].resultSeen);
    await page.locator('[data-view="map"]').click();
    assert.equal(await page.locator('[data-path-stage="begin-01"]').evaluate(node => node.closest('li').dataset.stageProgress), 'checked', 'earned choices persist after comparison with the result');
    await page.goto(publicOrigin + COURSE + '#auth-method-04');
    assert.equal(await page.evaluate(() => window.SECTIONS_MASTER.getState().view), 'lessons');
    assert.match(await page.locator('.lesson-condition').innerText(), /BQ/);

    phase = 'all personal cards open with condition and figure in the first viewport';
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const failures = await page.evaluate(() => COURSE.lessons.flatMap(({id}) => {
        SECTIONS_MASTER.openLesson(id);
        const condition = document.querySelector('.lesson-condition').getBoundingClientRect();
        const model = document.querySelector('.course-main .model-svg').getBoundingClientRect();
        const visible = condition.top >= -1 && model.bottom <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth + 1;
        return visible ? [] : [id];
      }));
      assert.deepEqual(failures, [], width + ': condition and model fit the viewport on every card');
      for (const id of ['starter-01', 'auth-method-08', 'auth-method-14', 'auth-metric-09']) {
        await page.goto(publicOrigin + COURSE + '#' + id);
        await page.reload();
        await page.waitForFunction(() => {
          const heading = document.getElementById('lesson-title');
          return heading && Math.abs(heading.getBoundingClientRect().top) < 1;
        });
        const modelBottom = await page.locator('.course-main .model-svg').evaluate(node => node.getBoundingClientRect().bottom);
        assert(modelBottom <= 901, width + ': saved scroll cannot hide the requested lesson ' + id);
      }
    }
  } finally { await context.close(); }
}

async function run() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sections-course-gate-'));
  const store = new LearningStore({ filePath: path.join(tmp, 'learning.sqlite'), contracts });
  let publicServer, cabinetServer, roomProcess, browser, releaseSocket = () => {};
  try {
    assert(store.available, 'isolated SQLite database required');
    const password = 'Synthetic-sections-' + randomUUID();
    const pupilPassword = '0486'; // Synthetic four-digit pupil code, including its leading zero.
    const invitation = store.bootstrap({ login: 'fixture_sections_teacher', name: 'Преподаватель теста' });
    const teacher = store.activate(invitation.invitationToken, await hashPassword(password)).account;
    const pupilInvitation = store.createStudent(teacher, { login: 'fixture_sections_pupil', name: 'Ученик теста' });
    const pupil = store.activate(pupilInvitation.invitationToken, await hashPassword(pupilPassword, 'student')).account;
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
    await launch.waitFor();
    const teacherOpen = card.locator('[data-program-open][data-cabinet-practice]');
    assert.equal(await teacherOpen.count(), 1, 'teacher can choose a card in the public course before opening the board');
    assert.match(await card.locator('[data-program-public-preview]').innerText(), /работы из кабинета ученика не загружаются/);

    phase = 'assigned pupil personal course and exact cabinet return';
    const pupilBack = 'route';
    await s.goto(cabinetOrigin + '/learning/?role=student#' + pupilBack);
    await s.locator('[name=login]').fill(pupil.login); await s.locator('[name=password]').fill(pupilPassword);
    await s.locator('#auth-form [type=submit]').click(); await s.locator('#navigation').waitFor();
    await s.goto(cabinetOrigin + '/learning/#' + pupilBack);
    const pupilCard = s.locator('[data-program-course="sections-from-zero"]');
    const pupilOpen = pupilCard.locator('[data-program-open][data-cabinet-practice]');
    await pupilOpen.click();
    await s.locator('[data-cabinet-return]').waitFor();
    const personalFrameElement = s.locator('[data-public-workspace] iframe');
    const personalSource = new URL(await personalFrameElement.getAttribute('src'));
    assert.equal(personalSource.origin, publicOrigin); assert.equal(personalSource.pathname, COURSE);
    const personalFrame = await (await personalFrameElement.elementHandle()).contentFrame();
    await personalFrame.waitForFunction(() => !!window.SECTIONS_APP);
    assert.equal(await personalFrame.evaluate(() => typeof window.__sectionsBoard), 'undefined');
    assert.equal((await personalFrameElement.getAttribute('sandbox')).split(/\s+/).includes('allow-forms'), false);
    phase = 'pupil personal numeric lesson and practice use button and Enter in the cabinet';
    await personalFrame.locator('[data-view="lessons"]').click();
    await openCard(personalFrame, 'auth-method-04');
    await personalFrame.locator('[data-action="start-study"]').click();
    await construct(personalFrame, course.lessons.find(lesson => lesson.id === 'auth-method-04').steps.length);
    await checkNumericLesson(personalFrame);
    await checkPersonalNumericPractice(personalFrame);
    await s.locator('[data-cabinet-return]').click(); await pupilOpen.waitFor();
    assert.equal(new URL(s.url()).hash, '#' + pupilBack, 'personal course returns to the same pupil route');
    assert.equal(await s.evaluate(() => LearningApp.account().id), pupil.id, 'personal course retains the authenticated pupil');

    phase = 'teacher assigned board and pre-room selected card';
    await launch.click(); await t.locator('[data-cabinet-return]').waitFor(); await t.reload();
    const boardElement = t.locator('[data-public-workspace] iframe');
    const src = new URL(await boardElement.getAttribute('src'));
    assert.equal(src.origin, publicOrigin); assert.equal(src.pathname, '/trainers/trainer-board.html');
    assert.deepEqual([...src.searchParams], [['trainer', WRAPPER]]);
    await courseFrame(await (await boardElement.elementHandle()).contentFrame());
    await t.locator('[data-cabinet-return]').click(); await teacherOpen.waitFor();
    assert.equal(new URL(t.url()).hash, '#' + back, 'direct board entry retains its cabinet return');

    phase = 'teacher chooses an exact public course card and opens it on the board';
    await teacherOpen.click();
    const teacherPersonal = await (await boardElement.elementHandle()).contentFrame();
    await teacherPersonal.waitForFunction(() => !!window.SECTIONS_APP);
    await teacherPersonal.locator('[data-view="lessons"]').click();
    await openCard(teacherPersonal, 'starter-18');
    const exactEntry = new URL(await teacherPersonal.locator('[data-sections-board-open]').getAttribute('href'));
    assert.equal(exactEntry.origin, publicOrigin);
    assert.deepEqual([...exactEntry.searchParams], [['trainer', WRAPPER + '#starter-18']]);
    await teacherPersonal.locator('[data-sections-board-open]').click();
    const board = await (await boardElement.elementHandle()).contentFrame();
    await board.waitForURL(publicOrigin + '/trainers/trainer-board.html?trainer=*');
    let teacherFrame = await courseFrame(board);
    const originalPersonal = await personal(teacherFrame);
    assert.equal((await snapshot(teacherFrame)).work.draft, '', 'board does not import personal draft');
    assert.equal((await snapshot(teacherFrame)).lessonId, 'starter-18', 'course-to-board entry retains the exact selected card');
    await openCard(teacherFrame, 'starter-18');
    await waitMirror(board, 'bridge-timeout', 'pre-room selection');
    assert.equal(await board.locator('#studentLink').inputValue(), '');
    await board.locator('#openShare').click(); await board.locator('#createRoom').click();
    await board.waitForFunction(() => document.querySelector('#studentLink')?.value.includes('role=student'));
    const link = await board.locator('#studentLink').inputValue(), target = new URL(link);
    assert.equal(target.origin, publicOrigin); assert.equal(target.searchParams.get('server'), boardOrigin);
    assertTeacherRoomUrl(board, target.searchParams.get('room'), boardOrigin);
    assert(!link.includes(teacher.id) && !link.includes(pupil.id));
    teacherFrame = await courseFrame(board);
    await teacherFrame.waitForFunction(room => new URL(location.href).searchParams.get('seed') === room && location.hash === '#starter-18' && window.__sectionsBoard.getState().lessonId === 'starter-18', target.searchParams.get('room'));
    phase = 'real delayed handshake recovers an expired seeded document';
    const expiredDocument = await teacherFrame.evaluate(() => performance.timeOrigin);
    await waitMirror(board, 'bridge-timeout', 'seeded document before delayed transport');
    assert.equal(heldClients, 1);
    const beforeRecovery = documents.length; releaseSocket();
    await board.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено');
    await board.locator('#sharePanel [data-close-panel]').click(); await s.goto(link);
    await Promise.all([waitMirror(board, 'connected', 'initial teacher'), waitMirror(s, 'connected', 'initial pupil')]);
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
    await teacherFrame.locator('.course-main .model-svg').press('ArrowRight');
    await synchronized(teacherFrame, studentFrame, 'lossless text and camera');
    assert.equal(await studentFrame.locator('img[src=x]').count(), 0);
    assert.equal(await s.evaluate(() => window.__sectionsGatePublished), observerMessages, 'observer hydration does not echo');

    phase = 'observer reload, control transfer and board-host document reload';
    const beforeReload = await snapshot(teacherFrame);
    await s.reload(); await waitMirror(s, 'connected', 'pupil observer reload'); studentFrame = await courseFrame(s);
    await waitSnapshot(studentFrame, beforeReload, 'student reload');
    await synchronized(teacherFrame, studentFrame, 'reloaded observer');
    await board.locator('#openShare').click(); await board.locator('#controlToggle').click();
    await s.waitForFunction(() => document.body.classList.contains('control-owner'));
    await board.waitForFunction(() => !document.body.classList.contains('control-owner'));
    await board.locator('#sharePanel [data-close-panel]').click();
    assert.equal(await board.locator('#trainerFrame').evaluate(node => getComputedStyle(node).pointerEvents), 'none');
    await studentFrame.locator('#proof-draft').fill('Запись ученика после передачи управления');
    await studentFrame.locator('.course-main .model-svg').press('ArrowUp');
    const pupilState = await synchronized(studentFrame, teacherFrame, 'student text and camera reach teacher');
    // Reload the board host's current document, whose URL contains the room
    // marker. Reloading the outer cabinet instead remounts its original entry
    // URL; that separate platform behavior is not claimed as room recovery.
    assert.equal(new URL(board.url()).searchParams.get('room'), target.searchParams.get('room'));
    await Promise.all([board.waitForNavigation({ waitUntil: 'domcontentloaded' }), board.evaluate(() => location.reload())]);
    const reloadedBoard = board;
    await waitMirror(reloadedBoard, 'connected', 'teacher board-host document reload');
    assertTeacherRoomUrl(reloadedBoard, target.searchParams.get('room'), boardOrigin);
    teacherFrame = await courseFrame(reloadedBoard);
    await waitSnapshot(teacherFrame, pupilState, 'teacher board-host document reload');
    assert.equal(await s.evaluate(() => document.body.classList.contains('control-owner')), true);
    const beforeRetry = await teacherFrame.evaluate(() => performance.timeOrigin);
    await reloadedBoard.locator('#trainerOptions').click(); await reloadedBoard.locator('#retryOpenedTrainer').click();
    await waitMirror(reloadedBoard, 'connected', 'actual trainer retry'); await reloadedBoard.locator('#trainerPanel [data-close-panel]').click();
    teacherFrame = await courseFrame(reloadedBoard);
    await waitSnapshot(teacherFrame, pupilState, 'actual retry button restores current trainer');
    assert.notEqual(await teacherFrame.evaluate(() => performance.timeOrigin), beforeRetry);
    phase = 'pupil controller reconnect retains work and requires explicit regrant';
    // Observe the established server handback while the pupil is disconnected.
    // Holding only the new client script prevents overlap between old/new sockets;
    // fallback retains the existing request/privacy instrumentation and transport.
    const pupilClientUrl = boardOrigin + '/socket.io/socket.io.js';
    let releasePupilClient = () => {}, heldPupilClients = 0;
    const pupilClientGate = new Promise(resolve => { releasePupilClient = resolve; });
    const holdPupilClient = async route => { heldPupilClients++; await pupilClientGate; await route.fallback(); };
    await s.route(pupilClientUrl, holdPupilClient);
    try {
      const clientRequest = s.waitForRequest(pupilClientUrl, { timeout: 20000 });
      await Promise.all([s.reload({ waitUntil: 'domcontentloaded' }), clientRequest]);
      await reloadedBoard.waitForFunction(() => shared.connected && roomStateReceived &&
        shared.control === shared.me?.participantId &&
        shared.participants.some(participant => participant.role === 'student' && participant.connected === false) &&
        document.body.classList.contains('control-owner'));
      assert.equal(heldPupilClients, 1, 'pupil client waits until the server returns control to the teacher');
      releasePupilClient();
      await waitMirror(s, 'connected', 'pupil controller reload');
    } finally {
      releasePupilClient();
      await s.unroute(pupilClientUrl, holdPupilClient);
    }
    studentFrame = await courseFrame(s);
    await waitSnapshot(studentFrame, pupilState, 'student controller reload');
    await waitSnapshot(teacherFrame, pupilState, 'teacher retains work during pupil reconnect');
    assert.equal(await reloadedBoard.evaluate(() => shared.control === shared.me?.participantId && document.body.classList.contains('control-owner')), true);
    assert.equal(await s.evaluate(() => controlHolder()?.role === 'teacher' && !document.body.classList.contains('control-owner')), true);
    assert.equal(await s.locator('#trainerFrame').evaluate(node => node.inert && node.tabIndex === -1), true);
    assert.equal(await s.locator('#trainerFrame').evaluate(node => getComputedStyle(node).pointerEvents), 'none');
    await synchronized(teacherFrame, studentFrame, 'pupil reconnect restores visible work without taking control');
    await reloadedBoard.locator('#openShare').click(); await reloadedBoard.locator('#controlToggle').click();
    await s.waitForFunction(() => document.body.classList.contains('control-owner'));
    await reloadedBoard.waitForFunction(() => !document.body.classList.contains('control-owner'));
    await reloadedBoard.locator('#sharePanel [data-close-panel]').click();
    assert.equal(await s.evaluate(() => document.body.classList.contains('control-owner')), true);
    assert.equal(await s.locator('#trainerFrame').evaluate(node => node.inert), false);
    await studentFrame.locator('#proof-draft').fill('Запись ученика после повторной передачи управления');
    await synchronized(studentFrame, teacherFrame, 'explicit regrant permits synchronized pupil work');
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
    const answered = await checkNumericLesson(teacherFrame, studentFrame);
    assert.equal(answered.work.correctAnswer, true); assert.equal(answered.work.workedSeen, true);
    const svg = teacherFrame.locator('.course-main .model-svg'); await svg.scrollIntoViewIfNeeded();
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
    const inspectHeader = () => reloadedBoard.evaluate(() => {
      const status = document.querySelector('#shareStatus');
      const text = document.createRange(); text.selectNodeContents(status);
      const controls = ['#sectionsCourseToggle', '#shareStatus', '#openShare', '#workspaceModes'].map(selector => {
        const box = document.querySelector(selector).getBoundingClientRect();
        return { selector, x: box.x, y: box.y, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
      });
      return { width: innerWidth, height: innerHeight, barHeight: document.querySelector('.workspace-bar').getBoundingClientRect().height, textLines: [...text.getClientRects()].filter(box => box.width > 0).length, controls };
    });
    function assertHeader(header, state) {
      assert(header.barHeight <= 200, '320px: ' + state + ' header keeps space for the lesson');
      for (const box of header.controls) {
        assert(box.width > 0 && box.height > 0 && box.x >= -1 && box.right <= header.width + 1 && box.y >= -1 && box.bottom <= header.height + 1, '320px: ' + state + ' header control fits: ' + box.selector);
      }
      for (let i = 0; i < header.controls.length; i++) for (let j = i + 1; j < header.controls.length; j++) {
        const a = header.controls[i], b = header.controls[j];
        const overlap = Math.min(a.right, b.right) - Math.max(a.x, b.x) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > 1;
        assert(!overlap, '320px: ' + state + ' header controls do not overlap: ' + a.selector + ', ' + b.selector);
      }
    }
    const header = await inspectHeader();
    assert.equal(header.textLines, 1, '320px: the connected status is readable on one line, not one letter per row');
    assertHeader(header, 'connected');
    const savedStatus = await reloadedBoard.evaluate(() => {
      const node = document.querySelector('#shareStatus'), previous = node.textContent;
      node.textContent = 'Подключение потеряно. Проверьте соединение и попробуйте ещё раз.';
      return previous;
    });
    try { assertHeader(await inspectHeader(), 'long connection message'); }
    finally {
      await reloadedBoard.evaluate(text => { document.querySelector('#shareStatus').textContent = text; }, savedStatus);
    }
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

    phase = 'course and board round trip keeps the same live room and construction';
    await teacherFrame.locator('[data-action="start-study"]').click();
    await construct(teacherFrame, 1);
    await teacherFrame.locator('.starter-draft > summary').click();
    const sharedDraft = 'M лежит в грани ABCD. Сохраняем рассуждение при переходе к курсу.';
    await teacherFrame.locator('#proof-draft').fill(sharedDraft);
    const beforeCourseVisit = await synchronized(teacherFrame, studentFrame, 'nonempty work before course visit');
    assert.equal(beforeCourseVisit.work.revealed, 1, 'the round trip starts with a completed construction step');
    assert.equal(beforeCourseVisit.work.draft, sharedDraft);
    await reloadedBoard.locator('[data-tool="pen"]').click();
    const inkCanvas = reloadedBoard.locator('#canvas');
    await inkCanvas.scrollIntoViewIfNeeded();
    const inkBox = await inkCanvas.boundingBox();
    assert(inkBox && inkBox.width > 100 && inkBox.height > 100);
    await t.mouse.move(inkBox.x + inkBox.width * .2, inkBox.y + inkBox.height * .3);
    await t.mouse.down();
    await t.mouse.move(inkBox.x + inkBox.width * .5, inkBox.y + inkBox.height * .5, { steps: 5 });
    await t.mouse.up();
    await reloadedBoard.waitForFunction(() => state.pages[state.current].strokes.length > 0);
    // The server assigns its own createdAt to each stroke. Compare every
    // other field, including points, object ID, author and layer, as in the
    // existing real shared-writing gate; do not compare client/server clocks.
    const sharedInk = await reloadedBoard.evaluate(() => JSON.stringify(state.pages[state.current].strokes.map(({ createdAt, ...stroke }) => stroke)));
    await s.waitForFunction(expected => JSON.stringify(state.pages[state.current].strokes.map(({ createdAt, ...stroke }) => stroke)) === expected, sharedInk);
    assert.equal(await s.evaluate(() => state.pages[state.current].strokes.every(stroke => Number.isFinite(Date.parse(stroke.createdAt)))), true, 'the observer receives server-dated strokes');
    const hostDocument = await reloadedBoard.evaluate(() => performance.timeOrigin);
    const trainerDocument = await teacherFrame.evaluate(() => performance.timeOrigin);
    const roomBeforeCourse = reloadedBoard.url();
    const inkBeforeCourse = await reloadedBoard.evaluate(() => JSON.stringify(state.pages));
    const pupilInkBeforeCourse = await s.evaluate(() => JSON.stringify(state.pages));
    await reloadedBoard.locator('#sectionsCourseToggle').click();
    const coursePanel = reloadedBoard.locator('#sectionsCoursePanel');
    const courseElement = reloadedBoard.locator('#sectionsCourseFrame');
    const courseView = await (await courseElement.elementHandle()).contentFrame();
    await courseView.waitForFunction(() => !!window.SECTIONS_MASTER);
    await reloadedBoard.waitForFunction(() => !document.querySelector('#sectionsCourseFrame').inert);
    const courseUrl = new URL(courseView.url());
    assert.equal(courseUrl.origin, publicOrigin); assert.equal(courseUrl.pathname, COURSE);
    assert.equal(courseUrl.search, '', 'course receives neither room credentials nor cabinet identifiers');
    assert.equal(await courseView.evaluate(() => window.SECTIONS_APP.getState().current), beforeCourseVisit.lessonId);
    assert.equal(await courseView.evaluate(() => typeof window.__sectionsBoard), 'undefined', 'explicit course view has its own personal workspace');
    for (const width of [320, 1280]) {
      await t.setViewportSize({ width, height: 900 });
      assert.equal(await reloadedBoard.locator('[data-sections-course-close]').isVisible(), true);
      const bounds = await reloadedBoard.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
      assert(bounds.scroll <= bounds.width + 1, 'course return fits the board viewport at ' + width);
      if (process.env.SECTIONS_SHOTS) await t.screenshot({ path: path.join(process.env.SECTIONS_SHOTS, 'sections-course-return-' + width + '.png') });
    }
    await courseView.locator('[data-sections-board-open]').click();
    assert.equal(await coursePanel.evaluate(node => node.open), false);
    assert.equal(reloadedBoard.url(), roomBeforeCourse);
    assert.equal(await reloadedBoard.evaluate(() => performance.timeOrigin), hostDocument);
    assert.equal(await teacherFrame.evaluate(() => performance.timeOrigin), trainerDocument, 'returning to the same card never remounts the shared trainer');
    assert.deepEqual(await snapshot(teacherFrame), beforeCourseVisit);
    assert.deepEqual(await snapshot(studentFrame), beforeCourseVisit);
    assert.equal(await reloadedBoard.evaluate(() => JSON.stringify(state.pages)), inkBeforeCourse);
    assert.equal(await s.evaluate(() => JSON.stringify(state.pages)), pupilInkBeforeCourse);
    await waitMirror(reloadedBoard, 'connected', 'course return keeps teacher connected');

    phase = 'a pupil may browse the course but cannot replace the shared task';
    await s.locator('#sectionsCourseToggle').click();
    const pupilCourse = await (await s.locator('#sectionsCourseFrame').elementHandle()).contentFrame();
    await pupilCourse.waitForFunction(() => !!window.SECTIONS_MASTER);
    await s.waitForFunction(() => !document.querySelector('#sectionsCourseFrame').inert);
    await openCard(pupilCourse, 'starter-18');
    await pupilCourse.locator('[data-sections-board-open]').click();
    assert.equal(await s.locator('#sectionsCoursePanel').evaluate(node => node.open), true);
    assert.match(await s.locator('[data-sections-course-status]').innerText(), /преподавател|ход/i);
    assert.deepEqual(await snapshot(teacherFrame), beforeCourseVisit);
    assert.deepEqual(await snapshot(studentFrame), beforeCourseVisit);
    await s.locator('[data-sections-course-close]').click();
    await waitMirror(s, 'connected', 'pupil course return keeps observer connected');

    phase = 'teacher selects another course card for the existing room';
    await reloadedBoard.locator('#sectionsCourseToggle').click();
    await openCard(courseView, 'starter-18');
    await courseView.locator('[data-sections-board-open]').click();
    assert.equal(await coursePanel.evaluate(node => node.open), false);
    await Promise.all([waitMirror(reloadedBoard, 'connected', 'teacher course selection'), waitMirror(s, 'connected', 'pupil receives course selection')]);
    teacherFrame = await courseFrame(reloadedBoard); studentFrame = await courseFrame(s);
    await teacherFrame.waitForFunction(() => window.__sectionsBoard.getState().lessonId === 'starter-18');
    await synchronized(teacherFrame, studentFrame, 'course selection enters the existing shared lesson');
    assert.equal(reloadedBoard.url(), roomBeforeCourse, 'choosing a course card never creates another room');
    assert.equal(await reloadedBoard.evaluate(() => performance.timeOrigin), hostDocument);
    assert.equal(await reloadedBoard.evaluate(() => JSON.stringify(state.pages)), inkBeforeCourse, 'course selection preserves board sheets and drawings');
    assert.equal(await s.evaluate(() => JSON.stringify(state.pages)), pupilInkBeforeCourse, 'pupil retains the shared drawing');
    // Opening a personal course is an explicit personal action. Its route may
    // change normally, but the original private drafts remain untouched and
    // neither participant imports the room's worked solution into that course.
    const teacherAfterVisit = JSON.parse((await personal(teacherFrame))[course.storageKey]);
    const pupilAfterVisit = JSON.parse((await personal(studentFrame))[course.storageKey]);
    assert.equal(teacherAfterVisit.tasks['starter-03'].draft, JSON.parse(originalPersonal[course.storageKey]).tasks['starter-03'].draft);
    assert.equal(pupilAfterVisit.tasks['starter-03'].draft, JSON.parse(studentPersonal[course.storageKey]).tasks['starter-03'].draft);
    await t.locator('[data-cabinet-return]').click(); await launch.waitFor();
    assert.equal(new URL(t.url()).hash, '#' + back); assert.equal(await t.evaluate(() => LearningApp.account().id), teacher.id);
    assert.equal(await t.locator('[data-public-workspace] iframe').count(), 0);
    assert.deepEqual(store.studentProfile(teacher, pupil.id), initialProfile);
    assert.equal(store.row('SELECT COUNT(*) AS n FROM attempts').n, initialAttempts);
    assert.deepEqual(writes, []); assert.deepEqual(leaks, []); assert.deepEqual(external, []); assert.deepEqual(errors, []);
    console.log('SECTIONS_COURSE_BROWSER_OK: beginner start; wrong action and two-error hint; retained steps/draft/camera/deep links; 320/1280 layout; assigned cabinet course and board with exact return; teacher course preview and exact-card board entry; personal lesson/practice and shared numeric checks by button/Enter under unchanged sandbox; pre-room selection and delayed Socket.IO document recovery; two participants; lossless text and numeric feedback; bidirectional camera; student observer/controller page reload with server handback and explicit regrant; teacher board-host document reload; actual trainer retry button; transfer/revoke; no echo; isolated shared storage; course and board round trip without remounting the live room; pupil cannot replace shared task; teacher course selection preserves the room and drawings; original personal drafts retained');
  } finally {
    releaseSocket(); await browser?.close(); if (roomProcess?.exitCode === null) roomProcess.kill('SIGTERM');
    await close(cabinetServer); await close(publicServer); store.close(); fs.rmSync(tmp, { recursive: true, force: true });
  }
}

run().catch(error => {
  console.error('SECTIONS_COURSE_BROWSER_FAILED at ' + phase + ': ' + String(error.stack || error).replace(/([?&](?:room|token)=)[^\s&"'<>]+/g, '$1[redacted]'));
  process.exitCode = 1;
});
