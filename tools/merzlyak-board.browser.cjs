'use strict';

// Synthetic teacher/observer sessions against the actual classic board and
// Socket.IO server. No production rooms, learner accounts or pupil records.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createReadStream, mkdirSync, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { createServer: createNetServer } = require('node:net');
const { extname, join, resolve, sep } = require('node:path');
const { chromium } = require('playwright');

const ROOT = resolve(__dirname, '..');
const WRAPPER = 'merzlyak-10-base.html';
const COURSE = '/stereo-course/merzlyak-10-base/';
const BOOK = 'merzlyak-2022-10-base';
const PERSONAL_KEY = 'mathExamTextbook.v1:' + BOOK + ':ex-16-010:r1';
const CONTROL_KEY = 'merzlyak-board-gate.unrelated';
const SESSION_KEY = 'mathexam.profileReturn';
const wait = ms => new Promise(done => setTimeout(done, ms));
let phase = 'startup';

async function freePort() {
  const server = createNetServer();
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  const port = server.address().port;
  await new Promise(done => server.close(done));
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
    if (child.exitCode !== null) throw Error('Local board-server exited: ' + diagnostics());
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return; } catch (_) {}
    await wait(100);
  }
  throw Error('Local board-server did not become healthy: ' + diagnostics());
}

async function contextFor(browser, siteOrigin, tag, failures) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const values = {
    [PERSONAL_KEY]: JSON.stringify({ draft: 'personal-' + tag, stepDrafts: {}, revealed: 1, assisted: true, checked: false, camera: { yaw: 1.9, pitch: 0.4 } }),
    [CONTROL_KEY]: 'unrelated:' + tag
  };
  const sessionValue = '#practice/synthetic-' + tag + '/independent';
  await context.addInitScript(({ origin, values, sessionKey, sessionValue, controlKey }) => {
    if (location.origin !== origin) return;
    // Seed only once: a reload must not conceal an erroneous adapter write.
    if (!localStorage.getItem(controlKey + '.seeded')) {
      for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
      localStorage.setItem(controlKey + '.seeded', '1');
    }
    if (!sessionStorage.getItem(controlKey + '.seeded')) {
      sessionStorage.setItem(sessionKey, sessionValue);
      sessionStorage.setItem(controlKey + '.seeded', '1');
    }
    if (window === window.top) {
      window.__merzlyakGateMessages = 0;
      addEventListener('message', event => {
        if (event.source === document.querySelector('#trainerFrame')?.contentWindow && event.data?.type === 'mathexam:trainer-state') window.__merzlyakGateMessages++;
      });
    }
  }, { origin: siteOrigin, values, sessionKey: SESSION_KEY, sessionValue, controlKey: CONTROL_KEY });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(20000);
  page.on('pageerror', error => failures.push(tag + ': ' + error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname === '127.0.0.1' && response.status() >= 400) failures.push(tag + ': HTTP ' + response.status() + ' ' + url.pathname);
  });
  return { context, page, values, sessionValue, tag };
}

async function assertPersonalStorage(session) {
  const current = await session.page.evaluate(({ keys, sessionKey }) => ({ local: Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), session: sessionStorage.getItem(sessionKey) }), { keys: Object.keys(session.values), sessionKey: SESSION_KEY });
  assert.deepEqual(current.local, session.values, session.tag + ': personal course and unrelated localStorage are byte-identical');
  assert.equal(current.session, session.sessionValue, session.tag + ': unrelated sessionStorage is byte-identical');
}

async function waitConnected(page) {
  await page.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено' && document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected', null, { polling: 50, timeout: 20000 });
}

async function courseFrame(page) {
  await page.waitForFunction(file => document.querySelector('#trainerFrame')?.src.includes(file), WRAPPER, { polling: 50 });
  const deadline = Date.now() + 15000;
  let frame;
  while (!frame && Date.now() < deadline) {
    frame = page.frames().find(item => item.url().includes('/trainers/' + WRAPPER));
    if (!frame) await wait(50);
  }
  assert(frame, 'registered course wrapper iframe exists');
  await frame.waitForFunction(() => typeof window.__merzlyakBoard?.getState === 'function' && typeof window.__merzlyakBoard?.applyState === 'function' && typeof window.__merzlyakBoard?.validateState === 'function', null, { polling: 50 });
  await frame.evaluate(() => {
    if (window.__merzlyakGateInstrumented) return;
    window.__merzlyakGateInstrumented = true;
    window.__merzlyakGateApplied = 0;
    // SDK registered before this listener, so it acknowledges completed apply.
    addEventListener('message', event => {
      if (event.source === parent && ['mathexam:hydrate', 'mathexam:apply-trainer-state'].includes(event.data?.type)) window.__merzlyakGateApplied++;
    });
  });
  return frame;
}

const snapshot = frame => frame.evaluate(() => window.__merzlyakBoard.getState());
async function waitSnapshot(frame, expected, label) {
  try {
    await frame.waitForFunction(value => {
      const stable = item => Array.isArray(item) ? item.map(stable) : item && typeof item === 'object' ? Object.fromEntries(Object.keys(item).sort().map(key => [key, stable(item[key])])) : item;
      return JSON.stringify(stable(window.__merzlyakBoard.getState())) === JSON.stringify(stable(value));
    }, expected, { polling: 50, timeout: 15000 });
  } catch (error) {
    assert.deepEqual(await snapshot(frame), expected, label + ': remote snapshot converges');
    throw error;
  }
}

// Independent visible-state oracle: model instance IDs differ after hydration,
// so compare rendered geometry and labels, never incidental generated IDs.
function view(frame) {
  return frame.evaluate(() => {
    const text = selector => document.querySelector(selector)?.textContent.trim() || '';
    const model = root => {
      const svg = root?.querySelector('.am-svg');
      if (!svg) return null;
      return {
        selected: svg.dataset.view, yaw: svg.dataset.yaw, pitch: svg.dataset.pitch,
        note: root.querySelector('.am-focus')?.textContent.trim(),
        announcement: root.querySelector('.am-sr-only')?.textContent.trim(),
        geometry: [...svg.querySelectorAll('path,circle,line,text')].map(node => [node.tagName, node.textContent, ...['d', 'x', 'y', 'cx', 'cy', 'x1', 'y1', 'x2', 'y2', 'class', 'data-label', 'data-edge'].map(key => node.getAttribute(key))])
      };
    };
    const main = document.querySelector('#textbook-app main'), dialog = document.querySelector('.theory-dialog');
    return {
      route: location.hash, title: text('#textbook-app h1'), condition: text('.textbook-condition'), goal: text('.textbook-goal'),
      draft: document.querySelector('#final-answer')?.value ?? null,
      feedback: text('[data-final-feedback]'), steps: [...document.querySelectorAll('[data-steps] .textbook-step')].map(node => node.textContent.trim()),
      opened: [...(main?.querySelectorAll('details') || [])].map(node => node.open),
      model: model(document.querySelector('[data-main-model]')),
      catalog: document.querySelector('#catalog-search') ? {
        search: document.querySelector('#catalog-search').value,
        kind: document.querySelector('#catalog-kind').value,
        collection: document.querySelector('#catalog-collection').value,
        chapter: document.querySelector('#catalog-chapter').value,
        results: text('.catalog-results')
      } : null,
      theory: dialog ? { id: dialog.dataset.theory, title: text('#theory-dialog-title'), text: dialog.textContent.trim(), opened: [...dialog.querySelectorAll('details')].map(node => node.open), model: model(dialog) } : null
    };
  });
}

async function synchronized(controller, observer, label) {
  // Native disclosure toggles are queued; wait until local view hooks settle.
  await controller.waitForFunction(() => !window.__merzlyakBoard.isApplying?.(), null, { polling: 25 });
  await wait(100);
  const expected = await snapshot(controller);
  assert.equal(await controller.evaluate(value => window.__merzlyakBoard.validateState(value), expected), true, label + ': exported state passes contract');
  await waitSnapshot(observer, expected, label);
  assert.deepEqual(await view(observer), await view(controller), label + ': rendered work matches');
  return expected;
}

const messages = page => page.evaluate(() => window.__merzlyakGateMessages);
async function quietMessages(pages, label) {
  let previous = await Promise.all(pages.map(messages)), unchangedSince = Date.now();
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    await wait(100);
    const current = await Promise.all(pages.map(messages));
    if (current.some((value, index) => value !== previous[index])) unchangedSince = Date.now();
    else if (Date.now() - unchangedSince >= 500) return current;
    previous = current;
  }
  throw Error(label + ': state messages do not become quiet (possible echo loop)');
}

async function ownership(teacher, student, studentControls) {
  const previousController = studentControls ? teacher : student, nextController = studentControls ? student : teacher;
  const previousFrame = await courseFrame(previousController), nextFrame = await courseFrame(nextController);
  const before = await snapshot(previousFrame), publishedBefore = await messages(nextController);
  const appliedBefore = await previousFrame.evaluate(() => window.__merzlyakGateApplied);
  await teacher.locator('#openShare').click();
  await teacher.locator('#controlToggle').click();
  await student.waitForFunction(expected => document.body.classList.contains('control-owner') === expected, studentControls, { polling: 50 });
  await teacher.waitForFunction(expected => document.body.classList.contains('control-owner') !== expected, studentControls, { polling: 50 });
  assert.equal(await student.locator('#trainerFrame').evaluate(element => getComputedStyle(element).pointerEvents === 'none'), !studentControls, 'board grant/revoke gates real iframe input');
  await nextController.waitForFunction(count => window.__merzlyakGateMessages > count, publishedBefore, { polling: 50 });
  await previousFrame.waitForFunction(count => window.__merzlyakGateApplied > count, appliedBefore, { polling: 50 });
  assert.deepEqual(await snapshot(nextFrame), before, 'handoff preserves current work');
  await synchronized(nextFrame, previousFrame, 'control handoff');
  await teacher.locator('#sharePanel [data-close-panel]').click();
}

async function openCard(frame, id) {
  const back = frame.getByRole('button', { name: '← Все материалы курса', exact: true });
  if (await back.count()) await back.click();
  await frame.locator('#catalog-search').fill('');
  await frame.locator('#catalog-kind').selectOption('');
  await frame.locator('#catalog-collection').selectOption('');
  await frame.locator('#catalog-chapter').selectOption('');
  const number = id === 'ex-16-010' ? '16.10' : id === 'merz-ex-10-001' ? '10.1' : null;
  assert(number, 'test uses known authored exercise');
  await frame.locator('#catalog-search').fill(number);
  await frame.locator('[data-lesson="' + id + '"]').click();
  await frame.locator('#final-answer').waitFor();
}

async function dragModel(page, frame, dx, dy) {
  const svg = frame.locator('[data-main-model] .am-svg');
  await svg.scrollIntoViewIfNeeded();
  const bounds = await svg.boundingBox();
  assert(bounds && bounds.width > 0 && bounds.height > 0, 'pointer starts on visible model');
  const x = bounds.x + bounds.width / 2, y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 4 }); await page.mouse.up();
}

async function run(browser, siteOrigin, boardOrigin, failures) {
  phase = 'ordinary course and exact canonical alias';
  const entry = await contextFor(browser, siteOrigin, 'entry', failures);
  await entry.page.goto(siteOrigin + COURSE + '#ex-16-010', { waitUntil: 'domcontentloaded' });
  await entry.page.locator('#final-answer').waitFor();
  assert.equal(await entry.page.locator('#final-answer').inputValue(), 'personal-entry', 'standalone course still restores personal work');
  assert.equal(await entry.page.evaluate(() => typeof window.__merzlyakBoard), 'undefined', 'ordinary course does not activate shared adapter');
  const boardLink = entry.page.locator('a[href*="trainer-board.html"]').first();
  await boardLink.waitFor();
  const boardUrl = new URL(await boardLink.getAttribute('href'), siteOrigin);
  assert.equal(boardUrl.searchParams.get('trainer'), COURSE + '#ex-16-010', 'course button carries the canonical course URL and selected card');
  boardUrl.searchParams.set('server', boardOrigin);
  await entry.page.goto(boardUrl.href, { waitUntil: 'domcontentloaded' });
  const entryFrame = await courseFrame(entry.page);
  assert.equal(new URL(entryFrame.url()).pathname, '/trainers/' + WRAPPER, 'canonical alias opens the registered wrapper');
  assert.equal((await snapshot(entryFrame)).lessonId, 'ex-16-010', 'shared course opens the selected card');
  assert.equal(await entryFrame.locator('#final-answer').inputValue(), '', 'deep link carries card identity without importing personal work');
  await assertPersonalStorage(entry); await entry.context.close();

  phase = 'room and registry picker';
  const teacherSession = await contextFor(browser, siteOrigin, 'teacher', failures), studentSession = await contextFor(browser, siteOrigin, 'student', failures);
  const teacher = teacherSession.page, student = studentSession.page;
  await teacher.goto(siteOrigin + '/trainers/trainer-board.html?server=' + encodeURIComponent(boardOrigin), { waitUntil: 'domcontentloaded' });
  await teacher.locator('#openShare').click(); await teacher.locator('#createRoom').click();
  await teacher.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено' && document.querySelector('#studentLink')?.value.includes('role=student'), null, { polling: 50 });
  const studentLink = await teacher.locator('#studentLink').inputValue();
  await teacher.locator('#sharePanel [data-close-panel]').click();
  assert.equal(new URL(teacher.url()).searchParams.has('token'), false, 'teacher address has no room credentials');
  await student.goto(studentLink, { waitUntil: 'domcontentloaded' });
  await teacher.locator('#trainerQuick option[value="' + WRAPPER + '"]').waitFor({ state: 'attached' });
  await teacher.locator('#chooseTrainer').click(); await teacher.locator('#pickerSearch').fill('merzlyak-10-base');
  await teacher.locator('#pickerResults .picker-item').filter({ hasText: /Мерзляк/ }).click();
  await Promise.all([waitConnected(teacher), waitConnected(student)]);
  let teacherFrame = await courseFrame(teacher), studentFrame = await courseFrame(student);
  await synchronized(teacherFrame, studentFrame, 'initial catalog');
  assert.match(await teacherFrame.locator('main').innerText(), /Доступно разборов и частей задач: 989/);
  const initialCounts = await quietMessages([teacher, student], 'initial hydration');

  phase = 'shared catalog filters and pagination';
  await teacherFrame.locator('#catalog-kind').selectOption('exercise');
  await teacherFrame.locator('#catalog-collection').selectOption('main');
  await teacherFrame.locator('#catalog-chapter').selectOption('Глава 4. Многогранники');
  await teacherFrame.getByRole('button', { name: 'Далее →', exact: true }).click();
  const filtered = await synchronized(teacherFrame, studentFrame, 'chapter, kind, collection and second page');
  assert.equal(filtered.catalog.readyPage, 1);
  await teacherFrame.locator('#catalog-search').fill('16.10');
  await synchronized(teacherFrame, studentFrame, 'exact dotted number search');
  assert.equal(await studentFrame.locator('[data-lesson]').count(), 1, 'main-only dotted search finds exact exercise');
  await teacherFrame.locator('[data-lesson="ex-16-010"]').click();
  const opened = await synchronized(teacherFrame, studentFrame, 'current task identity');
  assert.equal(opened.lessonId, 'ex-16-010');
  assert.equal(await teacherFrame.locator('#final-answer').inputValue(), '', 'shared session did not import either personal draft');

  phase = 'model buttons, keyboard and pointer';
  await teacherFrame.getByRole('button', { name: 'Повернуть вправо', exact: true }).click();
  await teacherFrame.locator('[data-main-model] .am-svg').press('ArrowDown');
  const beforeDrag = await synchronized(teacherFrame, studentFrame, 'free camera');
  await dragModel(teacher, teacherFrame, 36, -18);
  const dragged = await synchronized(teacherFrame, studentFrame, 'real pointer model gesture');
  assert(Math.abs(dragged.view.model.camera.yaw - beforeDrag.view.model.camera.yaw - 36 * 0.009) < 1e-8);
  assert(Math.abs(dragged.view.model.camera.pitch - beforeDrag.view.model.camera.pitch - 18 * 0.007) < 1e-8);
  assert.equal(dragged.work.assisted, false, 'free model exploration does not count as mathematical help');

  phase = 'answer draft, feedback, hints and retained explanations';
  await teacherFrame.locator('#final-answer').fill('1/');
  await synchronized(teacherFrame, studentFrame, 'unfinished fraction draft');
  await teacherFrame.locator('[data-final-form] button[type="submit"]').click();
  await synchronized(teacherFrame, studentFrame, 'wrong-answer feedback');
  assert.match(await studentFrame.locator('[data-final-feedback]').innerText(), /Проверь/);
  await teacherFrame.locator('#final-answer').fill('7/11');
  await teacherFrame.locator('[data-main-help] > summary').click();
  await teacherFrame.locator('[data-help="help-1"] > summary').click();
  await teacherFrame.getByRole('button', { name: 'Разобрать по шагам', exact: true }).click();
  await teacherFrame.locator('[data-step="step-1"] > details > summary').click();
  await teacherFrame.locator('[data-step="step-1"] details details > summary').click();
  await teacherFrame.getByRole('button', { name: 'Следующий шаг', exact: true }).click();
  const helped = await synchronized(teacherFrame, studentFrame, 'two revealed steps and justification');
  assert.equal(helped.work.revealed, 2); assert.equal(helped.work.assisted, true);
  assert.equal(await studentFrame.locator('[data-step="step-1"] > details').getAttribute('open'), '', 'previous explanation remains open');
  await teacherFrame.locator('[data-main-help] > summary').click();
  await synchronized(teacherFrame, studentFrame, 'closing help retains current draft and revealed steps');
  await teacherFrame.locator('[data-main-help] > summary').click();
  await teacherFrame.getByRole('button', { name: 'Следующий шаг', exact: true }).click();
  const helpedState = await synchronized(teacherFrame, studentFrame, 'final section view');
  assert.equal(helpedState.view.model.view, 'section');
  const helpedView = await view(teacherFrame), afterHelp = await quietMessages([teacher, student], 'help synchronization');
  assert(afterHelp[0] > initialCounts[0], 'teacher interactions emitted shared state');
  assert.equal(afterHelp[1], initialCounts[1], 'observer apply does not echo');

  phase = 'observer reload';
  await student.reload({ waitUntil: 'domcontentloaded' }); await waitConnected(student); studentFrame = await courseFrame(student);
  await waitSnapshot(studentFrame, helpedState, 'observer reload');
  assert.deepEqual(await view(studentFrame), helpedView, 'reload restores draft, feedback, disclosures and selected section');

  phase = 'student control, teacher reload and revocation';
  await ownership(teacher, student, true);
  await quietMessages([teacher, student], 'handoff settles');
  const teacherMessages = await messages(teacher);
  await studentFrame.locator('#final-answer').fill('9/13');
  await studentFrame.getByRole('button', { name: 'Повернуть влево', exact: true }).click();
  const pupilState = await synchronized(studentFrame, teacherFrame, 'student draft and camera reach teacher');
  await quietMessages([teacher, student], 'student work');
  assert.equal(await messages(teacher), teacherMessages, 'teacher observer does not echo student work');
  await teacher.reload({ waitUntil: 'domcontentloaded' }); await waitConnected(teacher); teacherFrame = await courseFrame(teacher);
  await waitSnapshot(teacherFrame, pupilState, 'teacher reload');
  assert.equal(await student.evaluate(() => document.body.classList.contains('control-owner')), true);
  await studentFrame.locator('#final-answer').fill('18');
  await studentFrame.locator('[data-final-form] button[type="submit"]').click();
  const checked = await synchronized(studentFrame, teacherFrame, 'accepted answer remains in the shared room');
  assert.equal(checked.work.checked, true);
  assert.match(await teacherFrame.locator('[data-final-feedback]').innerText(), /после обращения к помощи/);
  await ownership(teacher, student, false);
  await teacherFrame.locator('#final-answer').fill('saved shared draft');
  await synchronized(teacherFrame, studentFrame, 'authoritative teacher after revocation');

  phase = 'theory overlay, model and return';
  await openCard(teacherFrame, 'merz-ex-10-001');
  await teacherFrame.locator('#final-answer').fill('reasoning remains here');
  await teacherFrame.locator('[data-main-help] > summary').click();
  await teacherFrame.locator('[data-help="help-1"] > summary').click();
  await teacherFrame.locator('[data-help="help-1"] button').first().click();
  await teacherFrame.locator('.theory-dialog').waitFor();
  await teacherFrame.locator('.theory-dialog .am-controls button[aria-label="Повернуть вправо"]').click();
  await teacherFrame.locator('.theory-dialog summary').filter({ hasText: /^Ортогональная проекция$/ }).click();
  const theoryState = await synchronized(teacherFrame, studentFrame, 'theory overlay and chosen model view');
  assert.equal(theoryState.view.theory.active.id, 'merz-theory-10');
  assert.equal(theoryState.view.theory.active.view, 'incline', 'theory step selects its authored model view');
  const late = await contextFor(browser, siteOrigin, 'late', failures);
  await late.page.goto(studentLink, { waitUntil: 'domcontentloaded' }); await waitConnected(late.page);
  const lateFrame = await courseFrame(late.page);
  await waitSnapshot(lateFrame, theoryState, 'late join during theory');
  assert.deepEqual(await view(lateFrame), await view(teacherFrame), 'late join restores open theory and current exercise');
  await teacherFrame.locator('.theory-dialog').getByRole('button', { name: 'Вернуться к задаче', exact: true }).click();
  const returned = await synchronized(teacherFrame, studentFrame, 'return from theory');
  await synchronized(teacherFrame, lateFrame, 'late observer follows theory return');
  assert.equal(returned.view.theory.active, null);
  assert.equal(await teacherFrame.locator('#final-answer').inputValue(), 'reasoning remains here');

  phase = 'narrow layout and evidence';
  const shots = process.env.MERZLYAK_BOARD_SHOTS;
  await teacher.setViewportSize({ width: 320, height: 900 });
  const narrow = await teacherFrame.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  assert(narrow.width <= 320 && narrow.scroll <= narrow.width + 1, 'course fits a 320px board iframe');
  if (shots) { mkdirSync(shots, { recursive: true }); await teacher.screenshot({ path: join(shots, 'merzlyak-board-320.png') }); }
  await teacher.setViewportSize({ width: 1440, height: 1000 });
  await synchronized(teacherFrame, studentFrame, 'viewport change retains shared semantic state');
  if (shots) await teacher.screenshot({ path: join(shots, 'merzlyak-board-desktop.png') });

  phase = 'invalid state and idle quiescence';
  const beforeMalformed = await snapshot(teacherFrame), beforeMalformedView = await view(teacherFrame);
  const rejected = await teacherFrame.evaluate(() => {
    const bad = structuredClone(window.__merzlyakBoard.getState()); bad.lessonId = 'unknown-lesson';
    try { return window.__merzlyakBoard.applyState(bad) === false; } catch (_) { return true; }
  });
  assert.equal(rejected, true, 'unknown lesson is rejected');
  assert.deepEqual(await snapshot(teacherFrame), beforeMalformed, 'invalid state leaves semantic work unchanged');
  assert.deepEqual(await view(teacherFrame), beforeMalformedView, 'invalid state leaves rendered work unchanged');
  const stable = await quietMessages([teacher, student, late.page], 'final quiescence');
  await wait(500); assert.deepEqual(await Promise.all([teacher, student, late.page].map(messages)), stable, 'idle rooms do not repeatedly publish');
  await Promise.all([teacherSession, studentSession, late].map(assertPersonalStorage));
  assert.deepEqual(failures, [], 'no page errors or failed local resources');
  console.log('MERZLYAK_BOARD_BROWSER_OK: canonical alias; actual board/registry/Socket.IO; 989-card catalog; exact search/filters/pagination; selected task/draft/feedback/hints/retained explanations; camera/buttons/keyboard/pointer; theory return; control handoff/revoke; both-role reload; late join; no echo; invalid-state rejection; personal stores isolated; 320px layout');
}

(async () => {
  const server = staticServer(); let browser, child, watchdog, serverErrors = '';
  try {
    await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
    const siteOrigin = 'http://127.0.0.1:' + server.address().port;
    const boardPort = await freePort(), boardOrigin = 'http://127.0.0.1:' + boardPort;
    const env = { ...process.env, HOST: '127.0.0.1', PORT: String(boardPort), NODE_ENV: 'test', CORS_ALLOWED_ORIGINS: siteOrigin };
    for (const key of Object.keys(env)) if (/^(LEARNING_|PROGRESS_|GROUP_LESSON_)/.test(key)) delete env[key];
    child = spawn(process.execPath, ['index.js'], { cwd: join(ROOT, 'board-server'), env, stdio: ['ignore', 'ignore', 'pipe'] });
    child.stderr.on('data', chunk => { serverErrors = (serverErrors + String(chunk)).slice(-4000); });
    await waitForHttp(boardOrigin + '/health', child, () => serverErrors);
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'], timeout: 15000 });
    await Promise.race([run(browser, siteOrigin, boardOrigin, []), new Promise((_, reject) => { watchdog = setTimeout(() => reject(Error('Browser gate exceeded 180 seconds at ' + phase)), 180000); })]);
  } finally {
    clearTimeout(watchdog); await browser?.close();
    if (child && child.exitCode === null) child.kill('SIGTERM');
    await new Promise(done => server.close(done));
  }
})().catch(error => { console.error('MERZLYAK_BOARD_BROWSER_FAILED at ' + phase + '\n' + (error.stack || error)); process.exitCode = 1; });
