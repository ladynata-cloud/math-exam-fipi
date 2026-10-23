'use strict';

// Real classic-board Socket.IO and real LearningStore/API/TrainerFrame sessions.
// All rooms, accounts, cookies and SQLite data are disposable local fixtures.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { createServer } = require('node:http');
const { createServer: createNetServer } = require('node:net');
const { createRequire } = require('node:module');
const { once } = require('node:events');
const ROOT = path.resolve(__dirname, '..');
const serverRequire = createRequire(path.join(ROOT, 'board-server/package.json'));
const express = serverRequire('express');
const { LearningStore } = require('../board-server/learning-store');
const { createLearningApi } = require('../board-server/learning-api');
const { createTeachingRouter } = require('../board-server/learning-teaching');
const contracts = require('../board-server/learning-contracts');
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw Error('Playwright is required. Install playwright or set NODE_PATH.');
  ({ chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright')));
}
const WRAPPER = 'atanasyan-7-9.html';
const TRAINER = 'atanasyan-7-9';
const LESSON = 'atanasyan-7-9-main-92-part-1';
const PREFIX = 'mathExamTextbook.v1:';
const PERSONAL_KEY = PREFIX + 'atanasyan-2023-7-9:' + LESSON + ':r1';
const CONTROL_KEY = 'atanasyan-browser-gate.unrelated';
const RETURN_KEY = 'atanasyan-browser-gate.return';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let phase = 'startup';

async function serve(server) {
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  return 'http://127.0.0.1:' + server.address().port;
}
async function close(server) {
  server.closeAllConnections?.(); await new Promise(resolve => server.close(resolve));
}
async function freePort() {
  const server = createNetServer(); await serve(server);
  const port = server.address().port; await close(server); return port;
}
function staticServer() {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  return createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      if (pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
      let file = path.resolve(ROOT, '.' + pathname);
      if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { response.writeHead(403).end(); return; }
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
      response.setHeader('Cache-Control', 'no-store'); fs.createReadStream(file).pipe(response);
    } catch (_) { response.writeHead(404).end(); }
  });
}
async function poll(check, label, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { if (await check()) return; await wait(50); }
  throw Error(label + ': timed out');
}

async function sessionFor(browser, trainerOrigin, tag, failures) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'ru-RU' });
  const personal = JSON.stringify({ draft: 'Private draft ' + tag, stepDrafts: {}, revealed: 2, assisted: true, checked: false, camera: { viewId: 'step-2', zoom: 2, maxStep: 2 } });
  const values = { [PERSONAL_KEY]: personal, [PREFIX + 'unrelated-lesson']: 'private-other-' + tag, [CONTROL_KEY]: 'unrelated-' + tag };
  const returned = 'return-' + tag;
  await context.addInitScript(({ origin, values, controlKey, returnKey, returned, prefix }) => {
    // Count only messages from the actual trainer iframe, in either real host.
    window.__atanasyanGateMessages = 0;
    window.__atanasyanGateKinds = [];
    if (window === top) addEventListener('message', event => {
      const frame = document.querySelector('#trainerFrame, #trainer-host iframe');
      if (event.source !== frame?.contentWindow) return;
      if (event.data?.type === 'mathexam:trainer-state' || (event.data?.protocol === 'mathexam-learning' && event.data?.type === 'change')) {
        window.__atanasyanGateMessages++;
        window.__atanasyanGateKinds.push(event.data.payload?.kind || event.data.type);
      }
    });
    if (location.origin !== origin) return;
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
    if (!get.call(localStorage, controlKey + '.seeded')) {
      for (const [key, value] of Object.entries(values)) set.call(localStorage, key, value);
      set.call(localStorage, controlKey + '.seeded', '1');
    }
    if (!get.call(sessionStorage, controlKey + '.seeded')) {
      set.call(sessionStorage, returnKey, returned); set.call(sessionStorage, controlKey + '.seeded', '1');
    }
    window.__atanasyanStorageAudit = [];
    window.__atanasyanReadStorage = () => ({ local: Object.fromEntries(Object.keys(values).map(key => [key, get.call(localStorage, key)])), returned: get.call(sessionStorage, returnKey) });
    for (const name of ['getItem', 'setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[name];
      Storage.prototype[name] = function (...args) {
        if (name === 'clear' || String(args[0]).startsWith(prefix)) window.__atanasyanStorageAudit.push({ name, key: args[0] || '' });
        return original.apply(this, args);
      };
    }
  }, { origin: trainerOrigin, values, controlKey: CONTROL_KEY, returnKey: RETURN_KEY, returned, prefix: PREFIX });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (['127.0.0.1', 'localhost'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
    failures.push(tag + ': unexpected external request ' + url.origin + url.pathname); return route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(20000);
  page.on('pageerror', error => failures.push(tag + ': ' + error.message));
  page.on('response', response => {
    if (response.status() >= 400) failures.push(tag + ': HTTP ' + response.status() + ' ' + new URL(response.url()).pathname);
  });
  return { context, page, values, returned, tag };
}

async function adapterFrame(page, managed = false) {
  await page.locator(managed ? '#trainer-host iframe' : '#trainerFrame').waitFor();
  let frame;
  await poll(() => (frame = page.frames().find(item => item.url().includes('/trainers/' + WRAPPER))), 'wrapper frame');
  await frame.waitForFunction(() => typeof window.__atanasyanBoard?.getState === 'function');
  await frame.evaluate(() => window.__atanasyanReady);
  if (managed) await page.waitForFunction(() => document.querySelector('#trainer-host .frame-status')?.hidden);
  await frame.evaluate(() => {
    if (window.__atanasyanGateInstrumented) return;
    window.__atanasyanGateInstrumented = true; window.__atanasyanGateApplied = 0;
    addEventListener('message', event => {
      if (event.source === parent && ['mathexam:hydrate', 'mathexam:apply-trainer-state'].includes(event.data?.type)) window.__atanasyanGateApplied++;
    });
  });
  return frame;
}
const snapshot = frame => frame.evaluate(() => window.__atanasyanBoard.getState());
async function waitSnapshot(frame, expected, label) {
  try {
    await frame.waitForFunction(expected => {
      const sorted = x => Array.isArray(x) ? x.map(sorted) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map(key => [key, sorted(x[key])])) : x;
      return JSON.stringify(sorted(window.__atanasyanBoard.getState())) === JSON.stringify(sorted(expected));
    }, expected, { polling: 50 });
  } catch (error) { assert.deepEqual(await snapshot(frame), expected, label + ': complete snapshot'); throw error; }
}
function rendered(frame) {
  return frame.evaluate(() => ({
    title: document.querySelector('h1')?.textContent,
    draft: document.querySelector('#final-answer')?.value,
    feedback: document.querySelector('[data-final-feedback]')?.textContent.trim(),
    steps: [...document.querySelectorAll('[data-step]')].map(node => node.dataset.step),
    details: [...document.querySelectorAll('.textbook-layout details')].map(node => node.open),
    main: [...document.querySelectorAll('[data-main-model] svg')].map(svg => ({ view: svg.dataset.view, html: svg.innerHTML })),
    theory: [...document.querySelectorAll('.theory-dialog[open]')].map(dialog => ({ id: dialog.dataset.theory, text: dialog.textContent, details: [...dialog.querySelectorAll('details')].map(node => node.open), model: [...dialog.querySelectorAll('svg')].map(svg => ({ view: svg.dataset.view, html: svg.innerHTML })) }))
  }));
}
async function synced(controller, observer, label) {
  const state = await snapshot(controller);
  assert.equal(await controller.evaluate(value => window.__atanasyanBoard.validateState(value), state), true, label + ': exported state is valid');
  await waitSnapshot(observer, state, label);
  // A hydrated modal becomes measurable only after showModal and its queued
  // ResizeObserver redraw. Wait for real rendered convergence, not a fixed delay.
  try { await poll(async () => JSON.stringify(await rendered(observer)) === JSON.stringify(await rendered(controller)), label + ': rendered convergence', 5000); } catch (_) {}
  assert.deepEqual(await rendered(observer), await rendered(controller), label + ': rendered work follows snapshot');
  return state;
}
const messages = page => page.evaluate(() => window.__atanasyanGateMessages);
async function quiet(pages, label) {
  let previous = await Promise.all(pages.map(messages)), since = Date.now();
  await poll(async () => {
    const current = await Promise.all(pages.map(messages));
    if (JSON.stringify(current) !== JSON.stringify(previous)) since = Date.now();
    previous = current; return Date.now() - since > 450;
  }, label + ' settles', 5000);
  await wait(550); assert.deepEqual(await Promise.all(pages.map(messages)), previous, label + ': no hydration echo or idle publication');
}
async function assertStorage(session, frame) {
  assert.deepEqual(await frame.evaluate(() => window.__atanasyanReadStorage()), { local: session.values, returned: session.returned }, session.tag + ': personal storage remains byte-identical');
  assert.deepEqual(await frame.evaluate(() => window.__atanasyanStorageAudit), [], session.tag + ': adapter never reads or writes personal textbook storage');
}
async function fresh(frame) {
  const state = await snapshot(frame);
  assert.equal(state.lessonId, LESSON); assert.equal(state.draft, ''); assert.equal(state.revealed, 0);
  assert.equal(state.checked, false); assert.equal(state.submitted, false);
  assert.deepEqual(state.mainView, { viewId: 'neutral', zoom: 1, maxStep: 0 });
  assert.deepEqual(state.theory, []); assert.deepEqual(state.openDetails, []);
  assert.equal(await frame.locator('[data-step]').count(), 0, 'unrequested solution is hidden');
}
async function writeAndSubmit(frame, text) {
  await frame.locator('#final-answer').fill(text);
  await frame.locator('[data-manual-save]').click();
  try { await frame.waitForFunction(() => window.__atanasyanBoard.getState().submitted, null, { timeout: 3000 }); } catch (_) {
    throw Error('Manual submission did not persist: ' + JSON.stringify(await frame.evaluate(() => ({ state: window.__atanasyanBoard.getState(), readonly: document.documentElement.dataset.boardReadonly, feedback: document.querySelector('[data-final-feedback]')?.textContent }))));
  }
  assert.equal((await snapshot(frame)).submitted, true);
  assert.equal((await snapshot(frame)).checked, false, 'manual reasoning is never automatically marked correct');
  assert.match(await frame.locator('[data-final-feedback]').innerText(), /учител|преподавател|провер|обсуд/i, 'manual submission explains the need for human review');
}
async function reveal(frame) {
  await frame.locator('[data-main-help] > summary').click();
  await frame.getByRole('button', { name: 'Разобрать по шагам', exact: true }).click();
  assert.equal((await snapshot(frame)).revealed, 1);
  await frame.locator('[data-step="step-1"] details > summary').first().click();
  await frame.locator('[data-main-model] button[aria-label="Увеличить чертёж"]').click();
  assert((await snapshot(frame)).mainView.zoom > 1);
}
async function openTheory(frame) {
  const recall = frame.locator('[data-help="recall-theory"]');
  if (!await recall.evaluate(node => node.open)) await recall.locator(':scope > summary').click();
  await frame.locator('[data-theory-link="atanasyan-7-9-theory-14-part-1"]').first().click();
  await frame.locator('.theory-dialog[open]').waitFor();
  const dialog = frame.locator('.theory-dialog[open]').last();
  await dialog.locator('details > summary').first().click();
  await dialog.locator('button[aria-label="Увеличить чертёж"]').first().click();
  assert.equal((await snapshot(frame)).theory.length, 1);
  const firstStep = dialog.locator('[data-theory-step="step-1"]');
  await firstStep.locator(':scope > summary').click();
  await firstStep.locator('details > summary').click();
  await firstStep.locator('[data-theory-link="atanasyan-7-9-theory-1-part-1"]').click();
  const nested = frame.locator('.theory-dialog[open]').last();
  await nested.locator('[data-theory-step="step-1"] > summary').click();
  await nested.locator('button[aria-label="Увеличить чертёж"]').first().click();
  assert.equal((await snapshot(frame)).theory.length, 2, 'reference navigation keeps the previous theory frame');
}
async function narrow(page, frame, label) {
  const shots = process.env.ATANASYAN_BOARD_SHOTS;
  if (shots) {
    fs.mkdirSync(shots, { recursive: true });
    await page.setViewportSize({ width: 1280, height: 1000 });
    await frame.locator('[data-main-model]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, label + '-1280.png'), fullPage: true });
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await frame.waitForFunction(() => innerWidth <= 320);
  const dimensions = await frame.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert(dimensions.document <= dimensions.viewport + 1, label + ': no horizontal page overflow at 320px');
  if (shots) {
    await frame.locator('[data-main-model]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shots, label + '-320.png'), fullPage: true });
  }
  for (const selector of ['#final-answer', '[data-manual-save]', '[data-main-help] > summary']) {
    await frame.locator(selector).scrollIntoViewIfNeeded();
    const box = await frame.locator(selector).evaluate(node => { const b = node.getBoundingClientRect(); return { x: b.x, right: b.right, width: innerWidth }; });
    assert(box.x >= -1 && box.right <= box.width + 1, label + ': control fits at 320px: ' + selector);
  }
  if (shots) await page.screenshot({ path: path.join(shots, label + '-320-manual.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
}

async function classic(browser, siteOrigin, boardOrigin, failures) {
  phase = 'classic room and canonical picker';
  const teacher = await sessionFor(browser, siteOrigin, 'classic-teacher', failures);
  const student = await sessionFor(browser, siteOrigin, 'classic-student', failures);
  const tp = teacher.page, sp = student.page;
  await tp.goto(siteOrigin + '/trainers/trainer-board.html?server=' + encodeURIComponent(boardOrigin));
  await tp.locator('#openShare').click(); await tp.locator('#createRoom').click();
  await tp.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено' && document.querySelector('#studentLink')?.value.includes('role=student'));
  const link = await tp.locator('#studentLink').inputValue();
  assert(!new URL(tp.url()).searchParams.has('token'), 'teacher control token stays out of URL');
  await tp.locator('#sharePanel [data-close-panel]').click();
  await sp.goto(link);
  await tp.locator('#chooseTrainer').click();
  await tp.locator('#pickerSearch').fill(TRAINER);
  await tp.locator('#pickerResults .picker-item').filter({ hasText: 'Атанасян 7–9' }).first().click();
  let tf = await adapterFrame(tp), sf = await adapterFrame(sp);
  await fresh(tf); await synced(tf, sf, 'fresh classic room');
  assert.equal(await sp.locator('#trainerFrame').evaluate(node => getComputedStyle(node).pointerEvents), 'none', 'observer cannot operate trainer pointer UI');

  phase = 'classic draft, manual submission, solution and theory';
  await tf.locator('#final-answer').fill('Незавершённый черновик без отправки');
  const draft = await synced(tf, sf, 'unsubmitted draft');
  assert.equal(draft.submitted, false);
  await writeAndSubmit(tf, 'Стороны MN, NP, PM. Углы NMP, MNP, MPN.');
  await synced(tf, sf, 'manual reasoning');
  await reveal(tf); await synced(tf, sf, 'first step, explanation and zoom');
  await openTheory(tf); const theoryState = await synced(tf, sf, 'theory disclosure and camera');
  assert.equal(theoryState.revealed, 1); assert.equal(theoryState.assisted, true);
  await quiet([tp, sp], 'theory hydration');

  phase = 'classic reload, handoff and late join';
  await sp.reload(); sf = await adapterFrame(sp); await waitSnapshot(sf, theoryState, 'observer reload');
  assert.deepEqual(await rendered(sf), await rendered(tf), 'observer reload restores theory and draft');
  async function handoff(studentControls) {
    const from = studentControls ? tf : sf, to = studentControls ? sf : tf;
    const before = await snapshot(from), targetPage = studentControls ? sp : tp, sent = await messages(targetPage);
    await tp.locator('#openShare').click(); await tp.locator('#controlToggle').click();
    await sp.waitForFunction(owns => document.body.classList.contains('control-owner') === owns, studentControls);
    await targetPage.waitForFunction(count => window.__atanasyanGateMessages > count, sent);
    await waitSnapshot(to, before, 'handoff preserves all work'); await synced(to, from, 'handoff');
    await tp.locator('#sharePanel [data-close-panel]').click();
  }
  await handoff(true);
  await sf.locator('.theory-dialog[open] [data-theory-back]').last().click();
  const parentTheory = await synced(sf, tf, 'back from nested reference');
  assert.deepEqual(parentTheory.theory, [theoryState.theory[0]], 'back restores previous theory camera and disclosures');
  await sf.locator('.theory-dialog[open] [data-theory-close]').last().click();
  await sf.getByRole('button', { name: 'Следующий шаг', exact: true }).click();
  await sf.locator('[data-main-model]').getByRole('button', { name: 'Условие', exact: true }).click();
  await writeAndSubmit(sf, 'Ученик дополнил рассуждение после передачи управления.');
  const studentState = await synced(sf, tf, 'student continues after handoff');
  assert.equal(studentState.revealed, 2); assert.equal(studentState.mainView.viewId, 'neutral');
  await tp.reload(); tf = await adapterFrame(tp); await waitSnapshot(tf, studentState, 'teacher reload while observer');
  await sf.locator('#final-answer').click();
  assert.equal(await sp.evaluate(() => document.activeElement === document.querySelector('#trainerFrame')), true, 'student textbox really has iframe keyboard focus before revoke');
  await handoff(false);
  assert.equal(await sp.locator('#trainerFrame').evaluate(node => node.inert && node.tabIndex === -1), true, 'revoked iframe leaves sequential keyboard navigation');
  await sp.keyboard.type(' This must not change the shared proof.');
  for (let index = 0; index < 12; index++) {
    await sp.keyboard.press('Tab');
    assert.equal(await sp.evaluate(() => document.activeElement === document.querySelector('#trainerFrame')), false, 'Tab cannot enter the observer iframe after revoke');
  }
  assert.equal(await sf.locator('#final-answer').inputValue(), studentState.draft, 'typing after revoke cannot alter a previously focused textbox');
  assert.deepEqual(await snapshot(sf), studentState, 'revoked keyboard input cannot alter adapter state');
  const late = await sessionFor(browser, siteOrigin, 'classic-late', failures);
  await late.page.goto(link); const lf = await adapterFrame(late.page); await waitSnapshot(lf, studentState, 'late join');
  await tf.locator('[data-step="step-2"]').getByRole('button', { name: 'Показать на рисунке', exact: true }).click();
  await synced(tf, sf, 'teacher resumes selected model view'); await synced(tf, lf, 'late join follows subsequent changes');
  await narrow(tp, tf, 'classic'); await synced(tf, sf, 'resize preserves work');
  await quiet([tp, sp, late.page], 'classic final');
  await assertStorage(teacher, tf); await assertStorage(student, sf); await assertStorage(late, lf);
  await Promise.all([teacher, student, late].map(item => item.context.close()));
}

async function managed(browser, trainerOrigin, failures) {
  phase = 'managed isolated accounts and durable attempt';
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'atanasyan-managed-browser-'));
  const store = new LearningStore({ filePath: path.join(directory, 'learning.sqlite'), contracts });
  assert(store.available, 'Node 24 SQLite is required');
  const hash = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
  const teacherAccount = store.activate(store.bootstrap({ login: 'fixture_atanasyan_teacher', name: 'Проверочный преподаватель' }).invitationToken, hash);
  const studentAccount = store.activate(store.createStudent(teacherAccount.account, { login: 'fixture_atanasyan_student', name: 'Проверочный ученик' }).invitationToken, hash);
  const created = store.createAttempt(studentAccount.account, { opId: crypto.randomUUID(), trainerId: TRAINER, contentId: LESSON });
  const attemptId = created.attempt.id;
  const app = express(); app.use(express.json({ limit: '6mb' }));
  const server = createServer(app), origin = await serve(server);
  app.get('/api/learning/status', (_req, res) => res.json({ ...store.status(), trainerOrigin }));
  const learning = createLearningApi({ store, publicOrigin: origin, secureCookies: false });
  app.use('/api/learning', learning.router, createTeachingRouter(learning)); app.use(express.static(ROOT));
  const sessions = [];
  async function open(account, tag) {
    const session = await sessionFor(browser, trainerOrigin, tag, failures); sessions.push(session);
    await session.context.addCookies([{ name: 'mathexam_learning_local', value: account.sessionToken, url: origin, httpOnly: true, sameSite: 'Strict' }]);
    await session.page.goto(origin + '/learning/#attempt=' + attemptId);
    return session;
  }
  const attempt = () => store.getAttempt(teacherAccount.account, attemptId);
  async function durable(frame, label) {
    const expected = await snapshot(frame);
    await poll(() => JSON.stringify(attempt().state) === JSON.stringify(expected), label + ': durable state');
    assert.equal(attempt().outcome, 'started', label + ': no automatic completion or credit');
    assert.equal(attempt().state.checked, false);
    return expected;
  }
  try {
    const teacher = await open(teacherAccount, 'managed-teacher'), student = await open(studentAccount, 'managed-student');
    const tp = teacher.page, sp = student.page;
    let tf = await adapterFrame(tp, true), sf = await adapterFrame(sp, true);
    await fresh(sf); await synced(sf, tf, 'managed fresh attempt');
    assert.notEqual(new URL(tf.url()).origin, origin, 'managed trainer runs in a separate origin');
    assert.equal(await tf.locator('#final-answer').isEditable(), false, 'teacher starts as readonly observer');
    await writeAndSubmit(sf, 'Рассуждение ученика из кабинета.');
    await durable(sf, 'manual cabinet submission'); await synced(sf, tf, 'managed manual draft');
    await sp.waitForFunction(() => document.querySelector('#save-state')?.textContent === 'Все изменения сохранены');
    await reveal(sf); await openTheory(sf); const rich = await durable(sf, 'managed help and theory');
    await synced(sf, tf, 'managed help and theory'); await quiet([tp, sp], 'managed hydration');
    await tp.reload(); tf = await adapterFrame(tp, true);
    await waitSnapshot(tf, rich, 'managed persisted nested theory reload');
    await synced(sf, tf, 'managed theory after observer reload');
    const kinds = await sp.evaluate(() => window.__atanasyanGateKinds);
    assert(kinds.length > 0 && !kinds.includes('check'), 'manual submission emits state updates, never an automatic check');

    phase = 'managed controller transfer and reload';
    await tp.locator('#trainer-control').click();
    await poll(() => attempt().controller === 'teacher', 'teacher acquires control');
    await poll(async () => await tf.locator('#final-answer').isEditable(), 'teacher UI becomes editable');
    await poll(async () => !await sf.locator('#final-answer').isEditable(), 'student receives control revocation');
    assert.equal(await sf.locator('#final-answer').isEditable(), false, 'student becomes readonly');
    await waitSnapshot(tf, rich, 'managed handoff restores full theory stack');
    const observerClose = sf.locator('.theory-dialog[open] [data-theory-close]').last();
    assert.equal(await observerClose.isDisabled(), true, 'observer controls expose disabled semantics');
    await observerClose.scrollIntoViewIfNeeded();
    const closeBox = await observerClose.boundingBox();
    assert(closeBox, 'readonly dialog button is visible');
    // Send a real pointer gesture to the disabled surface. Locator.click would
    // correctly refuse aria-disabled controls before the browser sees a click.
    await sp.mouse.click(closeBox.x + closeBox.width / 2, closeBox.y + closeBox.height / 2);
    await sp.keyboard.press('Escape');
    assert.deepEqual(await snapshot(sf), rich, 'readonly observer clicks and Escape cannot close shared theory');
    await quiet([tp, sp], 'readonly observer interactions');
    await tf.locator('.theory-dialog[open] [data-theory-close]').last().click();
    await tf.getByRole('button', { name: 'Следующий шаг', exact: true }).click();
    await writeAndSubmit(tf, 'Преподаватель продолжил общее рассуждение.');
    const edited = await durable(tf, 'teacher continuation'); await synced(tf, sf, 'managed teacher continuation');
    await sp.reload(); sf = await adapterFrame(sp, true); await waitSnapshot(sf, edited, 'managed student reload');
    await tp.reload(); tf = await adapterFrame(tp, true); await waitSnapshot(tf, edited, 'managed controller reload');
    assert.equal(await tf.locator('#final-answer').isEditable(), true, 'controller survives reload');
    const late = await open(studentAccount, 'managed-late'), lf = await adapterFrame(late.page, true);
    await waitSnapshot(lf, edited, 'managed late join');
    await tp.locator('#trainer-control').click(); await poll(() => attempt().controller === 'student', 'return control');
    await poll(async () => await sf.locator('#final-answer').isEditable(), 'student regains input');
    await writeAndSubmit(sf, 'Ученик продолжил после возврата управления.');
    await durable(sf, 'student resumes'); await synced(sf, tf, 'teacher follows returned control'); await synced(sf, lf, 'second device follows saved state');
    await narrow(sp, sf, 'managed');
    await quiet([tp, sp, late.page], 'managed final');
    for (const [session, frame] of [[teacher, tf], [student, sf], [late, lf]]) await assertStorage(session, frame);
    const history = store.rows('SELECT * FROM events WHERE attempt_id = ?', attemptId);
    assert(history.length > 0, 'durable attempt has actual action history');
    assert(history.every(event => event.type !== 'check'), 'durable history contains no automatic grading action');
    const progress = store.progress(studentAccount.account).find(item => item.trainerId === TRAINER);
    assert(progress && progress.completed === false, 'manual reasoning earns no automatic completed progress');
  } finally {
    await Promise.all(sessions.map(session => session.context.close()));
    await close(server); learning.close(); fs.rmSync(directory, { recursive: true, force: true });
  }
}

(async () => {
  const staticHost = staticServer(); let browser, child, watchdog, diagnostics = '';
  try {
    const siteOrigin = await serve(staticHost), port = await freePort(), boardOrigin = 'http://127.0.0.1:' + port;
    const env = { ...process.env, HOST: '127.0.0.1', PORT: String(port), NODE_ENV: 'test', CORS_ALLOWED_ORIGINS: siteOrigin };
    for (const key of Object.keys(env)) if (/^(LEARNING_|PROGRESS_|GROUP_LESSON_)/.test(key)) delete env[key];
    child = spawn(process.execPath, ['index.js'], { cwd: path.join(ROOT, 'board-server'), env, stdio: ['ignore', 'ignore', 'pipe'] });
    child.stderr.on('data', chunk => { diagnostics = (diagnostics + String(chunk)).slice(-4000); });
    await poll(async () => {
      if (child.exitCode !== null) throw Error('Board server exited: ' + diagnostics);
      try { return (await fetch(boardOrigin + '/health', { signal: AbortSignal.timeout(1000) })).ok; } catch (_) { return false; }
    }, 'board server health');
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM_EXECUTABLE, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'], timeout: 15000 });
    const failures = [];
    await Promise.race([
      (async () => { await classic(browser, siteOrigin, boardOrigin, failures); await managed(browser, siteOrigin, failures); })(),
      new Promise((_, reject) => { watchdog = setTimeout(() => reject(Error('Browser gate exceeded 180 seconds at ' + phase)), 180000); })
    ]);
    assert.deepEqual(failures, [], 'no browser errors, failed resources or external requests');
    console.log('ATANASYAN_BOARD_BROWSER_OK: real classic board and managed cabinet; fixed 92a; draft/manual submission/steps/model/theory; durable API history; grant/revoke; controller and observer reload; late join; 320px layout; no automatic grade, hydration echo or personal-storage access.');
  } finally {
    clearTimeout(watchdog); await browser?.close();
    if (child && child.exitCode === null) child.kill('SIGTERM');
    await close(staticHost);
  }
})().catch(error => { console.error('ATANASYAN_BOARD_BROWSER_FAILED at ' + phase + '\n' + (error.stack || error)); process.exitCode = 1; });
