'use strict';

// Real local classic-board/Socket.IO journeys with synthetic participants.
// No production account, room, saved plan or pupil attempt is touched.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createReadStream, mkdirSync, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { createServer: createNetServer } = require('node:net');
const { extname, join, resolve, sep } = require('node:path');
const { chromium } = require('playwright');

const ROOT = resolve(__dirname, '..');
const SHOTS = process.env.NUMBER_THEORY_SHOTS;
const PRIME_CHOICES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
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
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  return createServer((request, response) => {
    try {
      const path = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      if (path === '/favicon.ico') { response.writeHead(204).end(); return; }
      let file = resolve(ROOT, '.' + path);
      if (file !== ROOT && !file.startsWith(ROOT + sep)) { response.writeHead(403).end(); return; }
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      response.setHeader('Content-Type', (types[extname(file)] || 'application/octet-stream') + '; charset=utf-8');
      response.setHeader('Cache-Control', 'no-store');
      createReadStream(file).pipe(response);
    } catch (_) { response.writeHead(404).end(); }
  });
}

async function healthy(url, child, logs) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Local server exited: ' + logs());
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return; } catch (_) {}
    await wait(100);
  }
  throw new Error('Local server not ready: ' + logs());
}

async function session(browser, origin, name, errors) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(({ origin, name }) => {
    if (location.origin !== origin) return;
    if (window === top) {
      localStorage.setItem('number-theory-gate.control', 'untouched:' + name);
      window.__numberTheoryMessages = 0;
      addEventListener('message', event => {
        if (event.source === document.querySelector('#trainerFrame')?.contentWindow && event.data?.type === 'mathexam:trainer-state') window.__numberTheoryMessages++;
      });
    }
    if (/\/grade6-(nok|nod)\.html$/.test(location.pathname)) {
      window.__numberTheoryStorage = [];
      for (const method of ['getItem', 'setItem', 'removeItem', 'clear']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function (...args) {
          window.__numberTheoryStorage.push(method);
          return original.apply(this, args);
        };
      }
    }
  }, { origin, name });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(20000);
  page.on('pageerror', error => errors.push(name + ': ' + error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname === '127.0.0.1' && response.status() >= 400) errors.push(name + ': HTTP ' + response.status() + ' ' + url.pathname);
  });
  return { context, page, name };
}

async function frameFor(page, kind) {
  const file = '/trainers/grade6-' + kind + '.html';
  await page.waitForFunction(file => document.querySelector('#trainerFrame')?.src.includes(file), file);
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    const frame = page.frames().find(f => new URL(f.url() || 'about:blank').pathname === file);
    if (frame) {
      await frame.waitForFunction(() => typeof window.NumberTheoryTrainer?.getState === 'function');
      return frame;
    }
    await wait(50);
  }
  throw new Error('Trainer iframe did not load: ' + kind);
}

const snapshot = frame => frame.evaluate(() => window.NumberTheoryTrainer.getState());
const messages = page => page.evaluate(() => window.__numberTheoryMessages);

async function connected(page) {
  try {
    // Revoking control leaves this instructional status on an otherwise live
    // pupil connection. The mirror handshake and subsequent state/DOM equality
    // remain required; a wording change is not a transport failure.
    await page.waitForFunction(() => ['подключено', 'Учитель забрал ход'].includes(document.querySelector('#shareStatus')?.textContent) && document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected', null, { timeout: 15000 });
  } catch (error) {
    console.error('NUMBER_THEORY_CONNECTION', JSON.stringify(await page.evaluate(() => ({
      share: document.querySelector('#shareStatus')?.textContent,
      mirror: document.querySelector('#mirrorStatus')?.textContent,
      mirrorCode: document.querySelector('#mirrorStatus')?.dataset.mirrorStatus,
      trainer: document.querySelector('#trainerFrame')?.getAttribute('src')?.split('?')[0],
      controlOwner: document.body.classList.contains('control-owner')
    }))));
    throw error;
  }
}

async function waitSnapshot(frame, expected) {
  await frame.waitForFunction(value => JSON.stringify(window.NumberTheoryTrainer.getState()) === JSON.stringify(value), expected, { polling: 50 });
}

function visible(frame) {
  return frame.evaluate(() => ({
    text: document.querySelector('main').innerText,
    inputs: [...document.querySelectorAll('input,select')].map(e => [e.id, e.value]),
    pressed: [...document.querySelectorAll('[aria-pressed]')].map(e => [e.id || e.textContent, e.getAttribute('aria-pressed')]),
    help: document.querySelector('#hint-toggle')?.getAttribute('aria-expanded')
  }));
}

async function sync(controller, observer, label) {
  const value = await snapshot(controller);
  assert.equal(await controller.evaluate(value => !!NumberTheoryTrainer.validateState(value), value), true, label + ': exported state validates');
  await waitSnapshot(observer, value);
  assert.deepEqual(await visible(observer), await visible(controller), label + ': restored visible work matches');
  return value;
}

async function quiet(pages) {
  let previous = await Promise.all(pages.map(messages)), unchanged = Date.now();
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    await wait(100);
    const current = await Promise.all(pages.map(messages));
    if (current.some((v, i) => v !== previous[i])) unchanged = Date.now();
    else if (Date.now() - unchanged >= 450) return current;
    previous = current;
  }
  throw new Error('State messages did not become quiet');
}

async function factor(frame, side, number, preferThree = false) {
  let n = number;
  while (n > 1) {
    let prime = preferThree && n % 3 === 0 ? 3 : 2;
    while (n % prime !== 0) prime++;
    await frame.locator('#divisor-' + side).fill(String(prime));
    await frame.locator('#accept-' + side).click();
    await frame.locator('#quotient-' + side).fill(String(n / prime));
    await frame.locator('#accept-' + side).click();
    n /= prime;
  }
}

async function screen(page, frame, name, width) {
  await page.setViewportSize({ width, height: 1000 });
  const size = await frame.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  assert(size.scroll <= size.width + 1, name + ': no horizontal overflow ' + JSON.stringify(size));
  const buttons = await frame.locator('[data-prime]').evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { prime: Number(element.dataset.prime), left: box.left, right: box.right, width: box.width, height: box.height, viewport: innerWidth };
  }));
  if (buttons.length) {
    assert.deepEqual(buttons.map(button => button.prime), PRIME_CHOICES, name + ': all prime choices stay available');
    assert(buttons.every(button => button.width >= 43.5 && button.height >= 43.5), name + ': prime choices retain touch targets');
    assert(buttons.every(button => button.left >= -1 && button.right <= button.viewport + 1), name + ': prime choices wrap inside the viewport');
  }
  if (SHOTS) {
    mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: join(SHOTS, name + '.png'), fullPage: true });
  }
}

async function primeChoices(frame) {
  const buttons = await frame.locator('[data-prime]').evaluateAll(elements => elements.map(element => ({
    prime: Number(element.dataset.prime), disabled: element.disabled, classes: element.className
  })));
  assert.deepEqual(buttons.map(button => button.prime), PRIME_CHOICES);
  assert(buttons.every(button => !button.disabled && button.classes === ''), 'Prime choices do not reveal the correct divisors');
}

async function openLegacyTask(teacher, student, kind) {
  await teacher.locator('#chooseTrainer').click();
  if (!await teacher.locator('#manualTrainerEntry').evaluate(element => element.open)) {
    await teacher.locator('#manualTrainerEntry summary').click();
  }
  await teacher.locator('#trainerUrl').fill('/trainers/grade6-' + kind + '.html?task=nt-1-1');
  await teacher.locator('#openTrainer').click();
  if (await teacher.locator('#pickerClose').isVisible()) await teacher.locator('#pickerClose').click();
  await Promise.all([connected(teacher), connected(student)]);
  const teacherFrame = await frameFor(teacher, kind), studentFrame = await frameFor(student, kind);
  await Promise.all([teacherFrame, studentFrame].map(frame => frame.waitForFunction(() => NumberTheoryTrainer.getState().taskId === 'nt-1-1')));
  assert.equal(new URL(teacherFrame.url()).searchParams.get('task'), 'nt-1-1');
  assert.equal(new URL(studentFrame.url()).searchParams.get('task'), 'nt-1-1');
  return { teacherFrame, studentFrame };
}

async function handoff(teacher, student, studentControls) {
  await teacher.locator('#openShare').click();
  await teacher.locator('#controlToggle').click();
  await student.waitForFunction(expected => document.body.classList.contains('control-owner') === expected, studentControls);
  await teacher.waitForFunction(expected => document.body.classList.contains('control-owner') !== expected, studentControls);
  assert.equal(await student.locator('#trainerFrame').evaluate(e => e.inert), !studentControls, 'observer keyboard control is gated');
  await teacher.locator('#sharePanel [data-close-panel]').click();
}

async function run(browser, origin, serverOrigin, errors) {
  phase = 'standalone task, help and narrow layout';
  for (const kind of ['nok', 'nod']) {
    const standalone = await session(browser, origin, 'standalone-' + kind, errors);
    const page = standalone.page;
    await page.goto(origin + '/trainers/grade6-' + kind + '.html');
    await page.waitForFunction(() => !!window.NumberTheoryTrainer);
    assert.equal((await snapshot(page)).taskId, 'nt-3-9', 'Fresh session uses the advanced default');
    assert.equal(await page.locator('.task-numbers').innerText(), '132 и 88');
    await primeChoices(page);
    await page.locator('#divisor-a').fill('2');
    const before = await snapshot(page);
    await page.locator('#hint-toggle').click();
    await page.locator('#hint-toggle').click();
    const after = await snapshot(page);
    assert.equal(after.taskId, before.taskId);
    assert.equal(after.divisorDraftA, '2');
    assert.equal(after.hintUsed, true);
    await screen(page, page, kind + '-standalone-desktop', 1100);
    await screen(page, page, kind + '-standalone-mobile', 390);
    // Preserve the original 4/6 regression as an explicit task URL. The new
    // default receives its own layout and real shared-board coverage below.
    await page.goto(origin + '/trainers/grade6-' + kind + '.html?task=nt-1-1');
    await page.waitForFunction(() => window.NumberTheoryTrainer?.getState().taskId === 'nt-1-1');
    await page.locator('#mode-independent').click();
    await page.locator('#fresh-independent').click();
    await page.locator('#answer-input').fill(kind === 'nok' ? '24' : '2');
    await page.locator('#check-answer').click();
    assert.equal((await snapshot(page)).feedback.scope, 'answer');
    assert.equal((await snapshot(page)).hintUsed, false);
    assert.equal(await page.locator('[data-feedback-scope="answer"]').evaluate(element => element.classList.contains('success')), true);
    await standalone.context.close();
  }

  phase = 'actual local room and registry';
  const teacherSession = await session(browser, origin, 'teacher', errors);
  const studentSession = await session(browser, origin, 'student', errors);
  const teacher = teacherSession.page, student = studentSession.page;
  await teacher.goto(origin + '/trainers/trainer-board.html?server=' + encodeURIComponent(serverOrigin));
  await teacher.locator('#openShare').click();
  await teacher.locator('#createRoom').click();
  await teacher.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено' && document.querySelector('#studentLink')?.value.includes('role=student'));
  const pupilLink = await teacher.locator('#studentLink').inputValue();
  await teacher.locator('#sharePanel [data-close-panel]').click();
  assert.equal(new URL(teacher.url()).searchParams.has('token'), false);
  await student.goto(pupilLink);

  for (const kind of ['nok', 'nod']) {
    phase = kind + ': select and hydrate';
    await teacher.locator('#chooseTrainer').click();
    await teacher.locator('#pickerSearch').fill('grade6-' + kind);
    await teacher.locator('#pickerResults .picker-item').click();
    await Promise.all([connected(teacher), connected(student)]);
    let teacherFrame = await frameFor(teacher, kind), studentFrame = await frameFor(student, kind);
    const advanced = await sync(teacherFrame, studentFrame, 'advanced initial task');
    assert.equal(advanced.taskId, 'nt-3-9');
    await primeChoices(teacherFrame); await primeChoices(studentFrame);
    await screen(teacher, teacherFrame, kind + '-advanced-board-split', 1440);
    await screen(teacher, teacherFrame, kind + '-advanced-board-mobile', 390);
    await teacher.setViewportSize({ width: 1440, height: 1000 });

    phase = kind + ': large-prime choice and advanced-state control handoff';
    await teacherFrame.locator('[data-prime="11"]').click();
    const chosen = await sync(teacherFrame, studentFrame, 'prime 11 chosen from the expanded list');
    assert.equal(chosen.activeA, 11);
    await teacherFrame.locator('#quotient-a').fill('12');
    const advancedDraft = await sync(teacherFrame, studentFrame, 'advanced quotient draft');
    await student.reload();
    await connected(student);
    studentFrame = await frameFor(student, kind);
    await waitSnapshot(studentFrame, advancedDraft);
    await handoff(teacher, student, true);
    await studentFrame.locator('#accept-a').click();
    const largePrimeWork = await sync(studentFrame, teacherFrame, 'pupil continues advanced factorization');
    assert.deepEqual(largePrimeWork.rowsA, [{ divisor: 11, quotient: 12 }]);
    await primeChoices(studentFrame);
    await studentFrame.locator('[data-prime="47"]').click();
    const wrongLargePrime = await sync(studentFrame, teacherFrame, 'incorrect large prime keeps accepted work');
    assert.equal(wrongLargePrime.feedback.code, 'not-divisor');
    assert.deepEqual(wrongLargePrime.rowsA, largePrimeWork.rowsA);
    await studentFrame.locator('#divisor-a').fill('3');
    await sync(studentFrame, teacherFrame, 'pupil restores a manual divisor draft');
    await handoff(teacher, student, false);
    const advancedLate = await session(browser, origin, 'advanced-late-' + kind, errors);
    await advancedLate.page.goto(pupilLink);
    await connected(advancedLate.page);
    const advancedLateFrame = await frameFor(advancedLate.page, kind);
    await sync(teacherFrame, advancedLateFrame, 'late join restores advanced work and larger prime choices');
    await primeChoices(advancedLateFrame);
    assert.deepEqual(await advancedLateFrame.evaluate(() => window.__numberTheoryStorage), []);
    await advancedLate.context.close();

    phase = kind + ': explicit legacy task and preserved regressions';
    ({ teacherFrame, studentFrame } = await openLegacyTask(teacher, student, kind));
    await sync(teacherFrame, studentFrame, 'explicit legacy initial task');
    const baseline = await quiet([teacher, student]);

    phase = kind + ': drafts, hints, accepted factors';
    await teacherFrame.locator('#divisor-a').fill('3');
    await teacherFrame.locator('#accept-a').click();
    await sync(teacherFrame, studentFrame, 'wrong divisor');
    assert.equal((await snapshot(studentFrame)).rowsA.length, 0);
    await teacherFrame.locator('#hint-toggle').click();
    await sync(teacherFrame, studentFrame, 'visible contextual help');
    await teacherFrame.locator('#hint-toggle').click();
    await teacherFrame.locator('#divisor-a').fill('2');
    await sync(teacherFrame, studentFrame, 'unfinished divisor draft');
    await factor(teacherFrame, 'a', 4);
    await factor(teacherFrame, 'b', 6, true);
    const factored = await sync(teacherFrame, studentFrame, 'accepted factorization including non-smallest prime');
    assert.equal(factored.rowsB[0].divisor, 3);
    await teacherFrame.locator('[data-factor-side="a"][data-factor-index="0"]').click();
    await sync(teacherFrame, studentFrame, 'partly selected factor pair');
    await teacherFrame.locator('[data-factor-side="b"][data-factor-index="0"]').click();
    await teacherFrame.locator('#confirm-pairs').click();
    await sync(teacherFrame, studentFrame, 'matched occurrence');
    const beforeReloadCounts = await quiet([teacher, student]);
    assert(beforeReloadCounts[0] > baseline[0], 'teacher edits publish state in the same page lifetime');
    assert.equal(beforeReloadCounts[1], baseline[1], 'pupil observer does not echo teacher edits');
    await screen(teacher, teacherFrame, kind + '-board-split', 1440);

    phase = kind + ': reload and control transfer';
    const beforeReload = await snapshot(teacherFrame);
    await student.reload();
    await connected(student);
    studentFrame = await frameFor(student, kind);
    await waitSnapshot(studentFrame, beforeReload);
    await handoff(teacher, student, true);
    await quiet([teacher, student]);
    const observerBefore = await messages(teacher);
    await studentFrame.locator('#mode-independent').click();
    await studentFrame.locator('#answer-input').fill(kind === 'nok' ? '12' : '2');
    const studentWork = await sync(studentFrame, teacherFrame, 'student drives answer');
    await quiet([teacher, student]);
    assert.equal(await messages(teacher), observerBefore, 'teacher observer does not echo');
    await teacher.reload();
    await connected(teacher);
    teacherFrame = await frameFor(teacher, kind);
    await waitSnapshot(teacherFrame, studentWork);
    await studentFrame.locator('#check-answer').click();
    await sync(studentFrame, teacherFrame, 'student check after teacher reload');
    await handoff(teacher, student, false);
    await quiet([teacher, student]);

    phase = kind + ': late join and invalid state';
    const lateSession = await session(browser, origin, 'late-' + kind, errors);
    await lateSession.page.goto(pupilLink);
    await connected(lateSession.page);
    const lateFrame = await frameFor(lateSession.page, kind);
    await sync(teacherFrame, lateFrame, 'late join restores complete work');
    const beforeBad = await snapshot(teacherFrame), beforeView = await visible(teacherFrame);
    assert.equal(await teacherFrame.evaluate(() => {
      const bad = NumberTheoryTrainer.getState();
      bad.rowsA = [{ divisor: 4, quotient: 1 }];
      try { return NumberTheoryTrainer.applyState(bad) === false; } catch (_) { return true; }
    }), true, 'composite prime factor rejected');
    assert.deepEqual(await snapshot(teacherFrame), beforeBad);
    assert.deepEqual(await visible(teacherFrame), beforeView);
    await teacherFrame.locator('#answer-input').fill(kind === 'nok' ? '1e2' : '-1');
    await teacherFrame.locator('#check-answer').click();
    await sync(teacherFrame, lateFrame, 'invalid input preserved on all clients');
    await sync(teacherFrame, studentFrame, 'original pupil follows');
    const finalCounts = await quiet([teacher, student, lateSession.page]);
    await wait(550);
    assert.deepEqual(await Promise.all([teacher, student, lateSession.page].map(messages)), finalCounts, 'no state echo loop');
    for (const [s, f] of [[teacherSession, teacherFrame], [studentSession, studentFrame], [lateSession, lateFrame]]) {
      assert.equal(await s.page.evaluate(() => localStorage.getItem('number-theory-gate.control')), 'untouched:' + s.name);
      assert.deepEqual(await f.evaluate(() => window.__numberTheoryStorage), [], 'trainer never reads or writes personal storage');
    }
    await screen(teacher, teacherFrame, kind + '-board-mobile', 390);
    await teacher.setViewportSize({ width: 1440, height: 1000 });
    await lateSession.context.close();
  }
  await teacherSession.context.close();
  await studentSession.context.close();
  assert.deepEqual(errors, [], 'no browser errors or missing local resources');
  console.log('NUMBER_THEORY_BOARD_BROWSER_OK: both trainers; advanced 132/88 default; all 15 prime buttons at desktop/mobile/split widths; actual registry/board/server; prime 11 and 47, drafts, factorization, hints and matching; advanced and legacy teacher/student transfer and reload; advanced and legacy late join; malformed-state rejection; no echo or personal storage');
}

(async () => {
  const server = staticServer();
  let browser, child, watchdog, logs = '';
  try {
    await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
    const origin = 'http://127.0.0.1:' + server.address().port;
    const port = await freePort(), serverOrigin = 'http://127.0.0.1:' + port;
    const env = { ...process.env, HOST: '127.0.0.1', PORT: String(port), NODE_ENV: 'test', CORS_ALLOWED_ORIGINS: origin };
    for (const key of Object.keys(env)) if (/^(LEARNING_|PROGRESS_|GROUP_LESSON_)/.test(key)) delete env[key];
    child = spawn(process.execPath, ['index.js'], { cwd: join(ROOT, 'board-server'), env, stdio: ['ignore', 'ignore', 'pipe'] });
    child.stderr.on('data', data => { logs = (logs + String(data)).slice(-4000); });
    await healthy(serverOrigin + '/health', child, () => logs);
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'], timeout: 20000 });
    await Promise.race([run(browser, origin, serverOrigin, []), new Promise((_, reject) => {
      watchdog = setTimeout(() => reject(new Error('Browser gate exceeded 240 seconds at ' + phase)), 240000);
    })]);
  } finally {
    clearTimeout(watchdog);
    await browser?.close();
    if (child && child.exitCode === null) child.kill('SIGTERM');
    await new Promise(done => server.close(done));
  }
})().catch(error => { console.error('NUMBER_THEORY_BOARD_BROWSER_FAILED at ' + phase + '\n' + (error.stack || error)); process.exitCode = 1; });
