'use strict';

// Synthetic teacher/student sessions against the actual classic board and its
// Socket.IO server. This gate never opens a production room or a user profile.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createReadStream, mkdirSync, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { createServer: createNetServer } = require('node:net');
const { extname, join, resolve, sep } = require('node:path');
const { chromium } = require('playwright');

const ROOT = resolve(__dirname, '..');
const WRAPPER = 'ege-profile-expressions.html';
const LESSONS = ['expr-powers', 'expr-roots', 'expr-fractions', 'expr-logarithms', 'algebra-cosine', 'algebra-double-angle'];
const PERSONAL_KEYS = ['mathexam.profileStart2027.v1', 'mathexam.profileCalmPreferences.v1', 'mathexam.profileCheckpoint.v1'];
const RETURN_KEY = 'mathexam.profileReturn';
const CONTROL_KEY = 'profile-board-gate.unrelated';
const wait = ms => new Promise(resolveWait => setTimeout(resolveWait, ms));
let phase = 'startup';

async function freePort() {
  const server = createNetServer();
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
  const port = server.address().port;
  await new Promise(resolveClose => server.close(resolveClose));
  return port;
}

function staticServer() {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  return createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      if (pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
      let file = resolve(ROOT, '.' + pathname);
      if (file !== ROOT && !file.startsWith(ROOT + sep)) { response.writeHead(403).end(); return; }
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      response.setHeader('Content-Type', (mime[extname(file)] || 'application/octet-stream') + (['.html', '.js', '.css', '.json', '.svg'].includes(extname(file)) ? '; charset=utf-8' : ''));
      response.setHeader('Cache-Control', 'no-store');
      createReadStream(file).pipe(response);
    } catch (_) { response.writeHead(404).end(); }
  });
}

async function waitForHttp(url, child, diagnostics) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Local board-server exited: ' + diagnostics());
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return; } catch (_) {}
    await wait(100);
  }
  throw new Error('Local board-server did not become healthy: ' + diagnostics());
}

async function contextFor(browser, siteOrigin, tag, failures) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const values = Object.fromEntries(PERSONAL_KEYS.map((key, index) => [key, JSON.stringify({ version: 1, sentinel: tag + ':' + index, records: {}, seen: {}, sessions: {}, enabled: true, examples: {}, micro: {} })]));
  // A valid, unfinished personal attempt would alter the initial course route
  // if the adapter accidentally read it, even without writing anything back.
  values[PERSONAL_KEYS[0]] = JSON.stringify({
    version: 1, sentinel: 'personal:' + tag,
    records: { 'expr-powers': { guided: ['expr-powers-1'], independent: ['expr-powers-6'], attempts: 7 } },
    seen: { 'expr-powers-1': 2, 'expr-powers-6': 1 },
    sessions: { 'expr-powers:guided': { taskId: 'expr-powers-1', step: 1, wrong: false, assisted: true, familiar: true, done: false, draft: 'personal-' + tag, answers: ['2'], started: '2025-01-01T00:00:00.000Z', registered: false } }
  });
  values[CONTROL_KEY] = 'unrelated:' + tag;
  const returnValue = '#practice/synthetic-' + tag + '/independent';
  await context.addInitScript(({ origin, values, returnKey, returnValue, controlKey }) => {
    if (location.origin !== origin) return;
    // Seed once, rather than on every navigation: reload must not conceal writes.
    if (!localStorage.getItem(controlKey + '.seeded')) {
      for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
      localStorage.setItem(controlKey + '.seeded', '1');
    }
    if (!sessionStorage.getItem(controlKey + '.seeded')) {
      sessionStorage.setItem(returnKey, returnValue);
      sessionStorage.setItem(controlKey + '.seeded', '1');
    }
    if (window === window.top) {
      window.__profileGateMessages = 0;
      addEventListener('message', event => {
        if (event.source === document.querySelector('#trainerFrame')?.contentWindow && event.data?.type === 'mathexam:trainer-state') window.__profileGateMessages++;
      });
    }
  }, { origin: siteOrigin, values, returnKey: RETURN_KEY, returnValue, controlKey: CONTROL_KEY });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(20000);
  page.on('pageerror', error => failures.push(tag + ': ' + error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname === '127.0.0.1' && response.status() >= 400) failures.push(tag + ': HTTP ' + response.status() + ' ' + url.pathname);
  });
  return { context, page, values, returnValue, tag };
}

async function assertPersonalStorage(session) {
  const current = await session.page.evaluate(({ keys, returnKey, controlKey }) => ({
    local: Object.fromEntries([...keys, controlKey].map(key => [key, localStorage.getItem(key)])),
    returned: sessionStorage.getItem(returnKey)
  }), { keys: PERSONAL_KEYS, returnKey: RETURN_KEY, controlKey: CONTROL_KEY });
  assert.deepEqual(current.local, session.values, session.tag + ': personal and unrelated localStorage remain byte-identical');
  assert.equal(current.returned, session.returnValue, session.tag + ': personal sessionStorage remains byte-identical');
}

async function waitConnected(page) {
  await page.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено' && document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected', null, { polling: 50, timeout: 15000 });
}

async function profileFrame(page) {
  await page.waitForFunction(file => document.querySelector('#trainerFrame')?.src.includes(file), WRAPPER, { polling: 50 });
  const deadline = Date.now() + 10000;
  let frame;
  while (!frame && Date.now() < deadline) {
    frame = page.frames().find(item => item.url().includes('/trainers/' + WRAPPER));
    if (!frame) await wait(50);
  }
  assert(frame, 'registered wrapper iframe exists');
  await frame.waitForFunction(() => typeof window.__profileExpressionsBoard?.getState === 'function' && typeof window.__profileExpressionsBoard?.applyState === 'function' && typeof window.__profileExpressionsBoard?.validateState === 'function', null, { polling: 50 });
  await frame.evaluate(() => {
    if (window.__profileGateInstrumented) return;
    window.__profileGateInstrumented = true;
    window.__profileGateApplied = 0;
    window.__profileGateTrace = [];
    const record = (kind, value) => {
      window.__profileGateTrace.push({ kind, time: Math.round(performance.now()), ...value });
      if (window.__profileGateTrace.length > 24) window.__profileGateTrace.shift();
    };
    // Installed after SDK registration: its synchronous apply handler runs
    // before this listener, so the counter acknowledges completed DOM hydration.
    addEventListener('message', event => {
      if (event.source !== parent || !['mathexam:hydrate', 'mathexam:apply-trainer-state'].includes(event.data?.type)) return;
      window.__profileGateApplied++;
      record('remote-apply', { model: window.__profileExpressionsBoard.getState().view.model });
    });
    document.addEventListener('input', event => {
      if (!event.target.matches?.('[data-angle-number]')) return;
      record('angle-input', { value: event.target.value, connected: event.target.isConnected, error: document.querySelector('[data-input-error]')?.textContent || '' });
    });
  });
  return frame;
}

const snapshot = frame => frame.evaluate(() => window.__profileExpressionsBoard.getState());

async function waitSnapshot(frame, expected, label) {
  try {
    await frame.waitForFunction(value => {
      const stable = item => Array.isArray(item) ? item.map(stable) : item && typeof item === 'object' ? Object.fromEntries(Object.keys(item).sort().map(key => [key, stable(item[key])])) : item;
      return JSON.stringify(stable(window.__profileExpressionsBoard.getState())) === JSON.stringify(stable(value));
    }, expected, { polling: 50, timeout: 10000 });
  } catch (error) {
    assert.deepEqual(await snapshot(frame), expected, label + ': remote snapshot converges');
    throw error;
  }
}

// Compare visible work as well as the adapter snapshot. A matching JSON object
// alone would miss a stale model closure, hidden hint, or lost input/feedback.
function view(frame) {
  return frame.evaluate(() => {
    const one = selector => document.querySelector(selector);
    const text = selector => one(selector)?.textContent.trim() || '';
    const shown = selector => { const element = one(selector); return !!element && !element.hidden && !element.closest('[hidden]'); };
    return {
      route: location.hash,
      title: text('#main h1'),
      condition: text('.condition-panel .task-condition'),
      taskId: one('[data-equation-view]')?.getAttribute('data-equation-view') || '',
      step: text('#current-step'),
      draft: one('#answer')?.value ?? null,
      answerDisabled: one('#answer')?.disabled ?? null,
      feedback: text('#feedback'),
      feedbackClass: one('#feedback')?.className || '',
      nextShown: shown('#next'),
      hintShown: shown('#hint-box'),
      hintExpanded: one('#hint')?.getAttribute('aria-expanded') || '',
      solutionSteps: document.querySelectorAll('[data-solution-step]').length,
      solutionExpanded: one('[data-solution-open]')?.getAttribute('aria-expanded') || '',
      history: text('#solution-history'),
      modelParts: shown('[data-expression-parts]'),
      details: [...document.querySelectorAll('#main details')].map(element => element.open),
      angle: one('[data-angle-number]')?.value ?? null,
      range: one('[data-angle-range]')?.value ?? null,
      point: one('[data-point]') ? ['cx', 'cy'].map(name => one('[data-point]').getAttribute(name)) : null,
      modelReadout: text('[data-readout]'),
      modelFeedback: text('[data-feedback]'),
      modelError: text('[data-input-error]')
    };
  });
}

async function synchronized(controller, observer, label) {
  const expected = await snapshot(controller);
  assert.equal(await controller.evaluate(value => window.__profileExpressionsBoard.validateState(value), expected), true, label + ': locally exported snapshot satisfies the bridge contract');
  await waitSnapshot(observer, expected, label);
  assert.deepEqual(await snapshot(observer), expected, label + ': complete state');
  assert.deepEqual(await view(observer), await view(controller), label + ': rendered work');
  return expected;
}

const messages = page => page.evaluate(() => window.__profileGateMessages);

async function quietMessages(pages, label) {
  let previous = await Promise.all(pages.map(messages));
  let unchangedSince = Date.now();
  const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    await wait(100);
    const current = await Promise.all(pages.map(messages));
    if (current.some((value, index) => value !== previous[index])) unchangedSince = Date.now();
    else if (Date.now() - unchangedSince >= 400) return current;
    previous = current;
  }
  throw new Error(label + ': state messages do not become quiet (possible echo loop)');
}

async function ownership(teacher, student, studentControls) {
  const previousController = studentControls ? teacher : student;
  const nextController = studentControls ? student : teacher;
  const previousFrame = await profileFrame(previousController), nextFrame = await profileFrame(nextController);
  const before = await snapshot(previousFrame);
  const publishedBefore = await messages(nextController);
  const appliedBefore = await previousFrame.evaluate(() => window.__profileGateApplied);
  await teacher.locator('#openShare').click();
  await teacher.locator('#controlToggle').click();
  await student.waitForFunction(expected => document.body.classList.contains('control-owner') === expected, studentControls, { polling: 50 });
  await teacher.waitForFunction(expected => document.body.classList.contains('control-owner') !== expected, studentControls, { polling: 50 });
  const pointerEvents = await student.locator('#trainerFrame').evaluate(element => getComputedStyle(element).pointerEvents);
  assert.equal(pointerEvents === 'none', !studentControls, 'real board grant/revoke gates iframe pointer input');
  // CSS ownership changes before the bridge finishes its control handoff.
  // The forced publication acknowledges all earlier parent messages (FIFO),
  // and the observer's apply acknowledges the resulting server round-trip.
  await nextController.waitForFunction(count => window.__profileGateMessages > count, publishedBefore, { polling: 50 });
  await previousFrame.waitForFunction(count => window.__profileGateApplied > count, appliedBefore, { polling: 50 });
  assert.deepEqual(await snapshot(nextFrame), before, 'control handoff preserves current work');
  await synchronized(nextFrame, previousFrame, 'control handoff publication and observer apply');
  await teacher.locator('#sharePanel [data-close-panel]').click();
}

async function run(browser, siteOrigin, boardOrigin, failures) {
  phase = 'canonical course URL resolves to registered wrapper';
  const entrySession = await contextFor(browser, siteOrigin, 'entry', failures);
  const canonicalTrainer = '/ege-profil/start/index.html#exam/8';
  await entrySession.page.goto(siteOrigin + '/trainers/trainer-board.html?trainer=' + encodeURIComponent(canonicalTrainer) + '&server=' + encodeURIComponent(boardOrigin), { waitUntil: 'domcontentloaded' });
  const entryFrame = await profileFrame(entrySession.page);
  const entryUrl = new URL(entryFrame.url());
  assert.equal(entryUrl.origin, siteOrigin, 'canonical entry remains on the synthetic local origin');
  assert.equal(entryUrl.pathname, '/trainers/' + WRAPPER, 'original course URL uses the registered board alias');
  assert.equal(entryUrl.hash, '#exam/8', 'canonical entry preserves the requested number');
  assert.equal(await entryFrame.locator('.exam-topic').count(), 6, 'canonical entry renders all six №8 topics');
  await assertPersonalStorage(entrySession);
  await entrySession.context.close();

  phase = 'real room and registered picker';
  const teacherSession = await contextFor(browser, siteOrigin, 'teacher', failures);
  const studentSession = await contextFor(browser, siteOrigin, 'student', failures);
  const teacher = teacherSession.page, student = studentSession.page;
  await teacher.goto(siteOrigin + '/trainers/trainer-board.html?server=' + encodeURIComponent(boardOrigin), { waitUntil: 'domcontentloaded' });
  await teacher.locator('#openShare').click();
  await teacher.locator('#createRoom').click();
  await teacher.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено' && document.querySelector('#studentLink')?.value.includes('role=student'), null, { polling: 50 });
  const studentLink = await teacher.locator('#studentLink').inputValue();
  await teacher.locator('#sharePanel [data-close-panel]').click();
  assert.equal(new URL(teacher.url()).searchParams.has('token'), false, 'teacher URL keeps room credentials out of the address');
  await student.goto(studentLink, { waitUntil: 'domcontentloaded' });
  await teacher.locator('#trainerQuick option[value="' + WRAPPER + '"]').waitFor({ state: 'attached' });
  await teacher.locator('#chooseTrainer').click();
  await teacher.locator('#pickerSearch').fill('ege-profile-expressions');
  await teacher.locator('#pickerResults .picker-item').click();
  await Promise.all([waitConnected(teacher), waitConnected(student)]);
  let teacherFrame = await profileFrame(teacher), studentFrame = await profileFrame(student);
  await synchronized(teacherFrame, studentFrame, 'initial registered route');
  assert.equal(await teacherFrame.evaluate(() => location.hash), '#exam/8');
  assert.equal(await teacherFrame.locator('.exam-topic').count(), 6);
  assert.equal(await teacherFrame.locator('.return-to-task').count(), 0, 'personal return target is not read into the board session');
  assert.deepEqual(await teacherFrame.locator('.exam-topic a[href$="/independent"]').evaluateAll(links => links.map(link => link.hash.split('/')[1]).sort()), LESSONS.slice().sort());

  phase = '320px overview, header and footer';
  await teacher.setViewportSize({ width: 320, height: 900 });
  const narrowLayout = await teacherFrame.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  assert(narrowLayout.width <= 320, 'trainer is actually displayed in a narrow iframe');
  assert(narrowLayout.scroll <= narrowLayout.width + 1, '320px overview has no horizontal document overflow');
  for (const selector of ['.topbar', '.topbar .brand', '#calm-toggle', 'footer']) {
    const bounds = await teacherFrame.locator(selector).evaluate(element => { const box = element.getBoundingClientRect(); return { left: box.left, right: box.right, height: box.height, width: innerWidth }; });
    assert(bounds.height > 0 && bounds.left >= -1 && bounds.right <= bounds.width + 1, selector + ' remains visible and within the narrow iframe');
  }
  await teacherFrame.locator('.topbar .brand').click({ trial: true });
  await teacherFrame.locator('#calm-toggle').click({ trial: true });
  const shots = process.env.PROFILE_EXPRESSIONS_BOARD_SHOTS;
  if (shots) { mkdirSync(shots, { recursive: true }); await teacher.screenshot({ path: join(shots, 'profile-expressions-board-320-header.png') }); }
  await teacherFrame.locator('footer').scrollIntoViewIfNeeded();
  assert.match(await teacherFrame.locator('footer').innerText(), /без зачёта в личный прогресс/);
  if (shots) await teacher.screenshot({ path: join(shots, 'profile-expressions-board-320-footer.png') });
  await teacher.setViewportSize({ width: 1440, height: 1000 });
  const initialCounts = await quietMessages([teacher, student], 'initial hydration');

  phase = 'independent task, draft, feedback and layered help';
  await teacherFrame.locator('#exam-start').click();
  await teacherFrame.locator('#answer-form').waitFor();
  await synchronized(teacherFrame, studentFrame, 'task identity');
  assert.match(await teacherFrame.locator('[data-equation-view]').getAttribute('data-equation-view'), /^expr-powers-/);
  assert.equal(await teacherFrame.locator('#micro-start').count(), 0, 'current six №8 families do not author micro-step content');
  await teacherFrame.locator('#answer').fill('1/');
  await synchronized(teacherFrame, studentFrame, 'unfinished fraction draft');
  await teacherFrame.locator('#submit-answer').click();
  await synchronized(teacherFrame, studentFrame, 'unreadable answer feedback');
  assert.match(await studentFrame.locator('#feedback').innerText(), /Не удалось прочитать число/);
  await teacherFrame.locator('#answer').fill('-987654321');
  await teacherFrame.locator('#submit-answer').click();
  await synchronized(teacherFrame, studentFrame, 'wrong answer feedback');
  assert.match(await studentFrame.locator('#feedback').getAttribute('class'), /bad/);
  await teacherFrame.locator('#answer').fill('1/7');
  await teacherFrame.locator('#hint').click();
  await teacherFrame.locator('#task-solution [data-solution-open]').click();
  await teacherFrame.locator('#task-solution [data-solution-next]').click();
  await teacherFrame.locator('#hint-box .task-foundation > summary').click();
  await teacherFrame.locator('#task-model .model-toggle').click();
  await synchronized(teacherFrame, studentFrame, 'open hint, two solution steps, rule and expression parts');
  assert.equal(await studentFrame.locator('[data-solution-step]').count(), 2);
  assert.equal(await studentFrame.locator('[data-expression-parts]').isVisible(), true);
  await teacherFrame.locator('#hint').click();
  await synchronized(teacherFrame, studentFrame, 'closed help retains draft and revealed steps');
  await teacherFrame.locator('#hint').click();
  const helpedState = await synchronized(teacherFrame, studentFrame, 'reopened help');
  const helpedView = await view(teacherFrame);
  const afterHelpCounts = await quietMessages([teacher, student], 'help synchronization');
  assert(afterHelpCounts[0] > initialCounts[0], 'teacher interactions emitted state');
  assert.equal(afterHelpCounts[1], initialCounts[1], 'observer apply does not echo state');

  phase = 'student reload hydrates existing work';
  await student.reload({ waitUntil: 'domcontentloaded' });
  await waitConnected(student);
  studentFrame = await profileFrame(student);
  await waitSnapshot(studentFrame, helpedState, 'student reload');
  assert.deepEqual(await view(studentFrame), helpedView, 'reload restores draft, feedback, help and disclosure counts');

  phase = 'accepted guided step and history';
  const taskId = await teacherFrame.locator('[data-equation-view]').getAttribute('data-equation-view');
  await teacherFrame.locator('.support-details > summary').click();
  const independentForm = await teacherFrame.locator('#answer-form').elementHandle();
  await teacherFrame.locator('#repair-current').click();
  await teacherFrame.waitForFunction(() => location.hash === '#practice/expr-powers/guided', null, { polling: 50 });
  // The hash changes before its route handler replaces the independent form.
  // Wait for the new guided DOM, then let both participants receive that view
  // before typing an answer into its attempt.
  await teacherFrame.waitForFunction(form => !form.isConnected &&
    /^Шаг 1 из \d+$/.test(document.querySelector('#current-step')?.textContent.trim() || '') &&
    document.querySelector('#answer')?.disabled === false, independentForm, { polling: 50 });
  await independentForm.dispose();
  await teacherFrame.locator('#answer-form').waitFor();
  assert.equal(await teacherFrame.locator('[data-equation-view]').getAttribute('data-equation-view'), taskId, 'remediation retains the current task');
  await synchronized(teacherFrame, studentFrame, 'guided remediation is rendered before input');
  const acceptedAnswer = await teacherFrame.evaluate(id => {
    const task = ProfileLessons.find(lesson => lesson.id === 'expr-powers').tasks.find(task => task.id === id);
    return String(task.steps[0].answer);
  }, taskId);
  await teacherFrame.locator('#answer').fill(acceptedAnswer);
  assert.equal(await teacherFrame.locator('#answer').inputValue(), acceptedAnswer, 'controller retains the guided answer before submission');
  assert.equal((await snapshot(teacherFrame)).progress.sessions['expr-powers:guided'].draft, acceptedAnswer, 'input updates the guided attempt');
  await teacherFrame.locator('#submit-answer').click();
  await teacherFrame.locator('#answer:disabled').waitFor();
  assert.equal(await teacherFrame.locator('#answer').isDisabled(), true, 'controller accepted the guided step');
  assert.deepEqual((await snapshot(teacherFrame)).progress.sessions['expr-powers:guided'].answers, [acceptedAnswer], 'controller recorded the expected guided answer');
  await synchronized(teacherFrame, studentFrame, 'accepted guided step before advancing');
  assert.equal(await studentFrame.locator('#answer').isDisabled(), true);
  assert.equal(await studentFrame.locator('#next').isVisible(), true);
  await teacherFrame.locator('#next').click();
  await synchronized(teacherFrame, studentFrame, 'next guided step and accepted history');
  assert.match(await studentFrame.locator('#current-step').innerText(), /Шаг 2/);
  assert((await studentFrame.locator('#solution-history').innerText()).trim().length > 0, 'accepted history is rendered');

  phase = 'student control and teacher reload';
  await ownership(teacher, student, true);
  await quietMessages([teacher, student], 'control transfer');
  const teacherBeforeStudent = await messages(teacher);
  await studentFrame.locator('#answer').fill('7/11');
  await synchronized(studentFrame, teacherFrame, 'student draft reaches teacher');
  await quietMessages([teacher, student], 'student draft');
  assert.equal(await messages(teacher), teacherBeforeStudent, 'teacher observer does not echo student draft');
  const beforeTeacherReload = await snapshot(studentFrame);
  await teacher.reload({ waitUntil: 'domcontentloaded' });
  await waitConnected(teacher);
  teacherFrame = await profileFrame(teacher);
  await waitSnapshot(teacherFrame, beforeTeacherReload, 'teacher reload while student controls');
  assert.equal(await student.evaluate(() => document.body.classList.contains('control-owner')), true, 'student keeps control through teacher reload');
  await studentFrame.locator('#answer').fill('9/13');
  await synchronized(studentFrame, teacherFrame, 'student still edits after teacher reload');
  await ownership(teacher, student, false);
  await teacherFrame.locator('#answer').fill('3/17');
  await synchronized(teacherFrame, studentFrame, 'revoked student follows authoritative teacher work');

  phase = 'dynamic circle and late join';
  await teacherFrame.locator('a[href="#exam/8"]').first().click();
  await teacherFrame.locator('a[href="#lesson/algebra-cosine"]').click();
  await teacherFrame.locator('#explore-lab > summary').click();
  await teacherFrame.locator('[data-angle-number]').fill('135');
  await teacherFrame.locator('[data-check]').click();
  await synchronized(teacherFrame, studentFrame, 'circle angle, geometry and checked feedback');
  assert.equal(await studentFrame.locator('[data-angle-number]').inputValue(), '135');
  await ownership(teacher, student, true);
  await studentFrame.locator('[data-delta="15"]').click();
  await synchronized(studentFrame, teacherFrame, 'hydrated model closure advances from restored angle');
  assert.equal(await teacherFrame.locator('[data-angle-number]').inputValue(), '150', 'local model event uses hydrated closure, not its initial 20 degrees');
  await ownership(teacher, student, false);
  await teacherFrame.evaluate(() => { window.__profileGateAngleNode = document.querySelector('[data-angle-number]'); });
  await teacherFrame.locator('[data-angle-number]').fill('');
  const clearedInput = await teacherFrame.evaluate(() => ({
    value: document.querySelector('[data-angle-number]').value,
    error: document.querySelector('[data-input-error]').textContent,
    sameNode: window.__profileGateAngleNode === document.querySelector('[data-angle-number]'),
    model: window.__profileExpressionsBoard.getState().view.model,
    trace: window.__profileGateTrace
  }));
  assert(clearedInput.value === '' && /Введите угол/.test(clearedInput.error) && clearedInput.sameNode, 'controller retains cleared input and local validation on the active node: ' + JSON.stringify(clearedInput));
  await synchronized(teacherFrame, studentFrame, 'empty model input and validation feedback');
  const observedInput = await studentFrame.evaluate(() => ({ value: document.querySelector('[data-angle-number]').value, error: document.querySelector('[data-input-error]').textContent, model: window.__profileExpressionsBoard.getState().view.model, trace: window.__profileGateTrace }));
  assert(observedInput.value === '' && /Введите угол/.test(observedInput.error), 'observer retains cleared input and validation: ' + JSON.stringify(observedInput));
  await teacherFrame.locator('[data-angle-number]').fill('225');
  const circleState = await synchronized(teacherFrame, studentFrame, 'model recovers after incomplete input');
  // A second tab using the same classic-board student token is the same logical
  // participant. Join after revocation so both tabs are observers, not concurrent
  // controllers whose own state the board intentionally does not overwrite.
  const lateSession = await contextFor(browser, siteOrigin, 'late', failures);
  await lateSession.page.goto(studentLink, { waitUntil: 'domcontentloaded' });
  await waitConnected(lateSession.page);
  const lateFrame = await profileFrame(lateSession.page);
  await waitSnapshot(lateFrame, circleState, 'late join');
  assert.deepEqual(await view(lateFrame), await view(teacherFrame), 'late join restores model state and opened lab');
  await teacherFrame.locator('[data-delta="15"]').click();
  await synchronized(teacherFrame, studentFrame, 'teacher continues after late join');
  await synchronized(teacherFrame, lateFrame, 'late participant follows subsequent teacher changes');

  phase = 'malformed state rejection and stable messages';
  const beforeMalformed = await snapshot(teacherFrame), beforeMalformedView = await view(teacherFrame);
  const rejected = await teacherFrame.evaluate(() => {
    const bad = structuredClone(window.__profileExpressionsBoard.getState());
    bad.route = '#exam/7';
    try { return window.__profileExpressionsBoard.applyState(bad) === false; } catch (_) { return true; }
  });
  assert.equal(rejected, true, 'unsupported route is rejected');
  assert.deepEqual(await snapshot(teacherFrame), beforeMalformed, 'malformed apply leaves state unchanged');
  assert.deepEqual(await view(teacherFrame), beforeMalformedView, 'malformed apply leaves rendered work unchanged');
  const stable = await quietMessages([teacher, student, lateSession.page], 'final quiescence');
  await wait(500);
  assert.deepEqual(await Promise.all([teacher, student, lateSession.page].map(messages)), stable, 'idle sessions do not publish repeated state');
  await Promise.all([teacherSession, studentSession, lateSession].map(assertPersonalStorage));
  assert.deepEqual(failures, [], 'no browser errors or failed local resources');
  console.log('PROFILE_EXPRESSIONS_BOARD_BROWSER_OK: canonical URL alias; 320px overview/header/footer; real board/registry/server; six №8 topics; task/draft/feedback/help/solution/history; grant/revoke; teacher/student reload; late join; circle closure; no echo; personal storage isolation');
}

(async () => {
  const server = staticServer();
  let browser, child, watchdog;
  let serverErrors = '';
  try {
    await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
    const siteOrigin = 'http://127.0.0.1:' + server.address().port;
    const boardPort = await freePort(), boardOrigin = 'http://127.0.0.1:' + boardPort;
    const env = { ...process.env, HOST: '127.0.0.1', PORT: String(boardPort), NODE_ENV: 'test', CORS_ALLOWED_ORIGINS: siteOrigin };
    // Do not inherit any configured account/progress stores or bootstrap inputs.
    for (const key of Object.keys(env)) if (/^(LEARNING_|PROGRESS_|GROUP_LESSON_)/.test(key)) delete env[key];
    child = spawn(process.execPath, ['index.js'], { cwd: join(ROOT, 'board-server'), env, stdio: ['ignore', 'ignore', 'pipe'] });
    child.stderr.on('data', chunk => { serverErrors = (serverErrors + String(chunk)).slice(-4000); });
    await waitForHttp(boardOrigin + '/health', child, () => serverErrors);
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'], timeout: 15000 });
    await Promise.race([
      run(browser, siteOrigin, boardOrigin, []),
      new Promise((_, reject) => { watchdog = setTimeout(() => reject(new Error('Browser gate exceeded 120 seconds at ' + phase)), 120000); })
    ]);
  } finally {
    clearTimeout(watchdog);
    await browser?.close();
    if (child && child.exitCode === null) child.kill('SIGTERM');
    await new Promise(resolveClose => server.close(resolveClose));
  }
})().catch(error => { console.error('PROFILE_EXPRESSIONS_BOARD_BROWSER_FAILED at ' + phase + '\n' + (error.stack || error)); process.exitCode = 1; });
