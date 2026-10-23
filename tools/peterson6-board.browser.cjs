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
const WRAPPER = 'peterson6.html';
const PERSONAL_KEY = 'mathexam.peterson6.part1.v1';
const CONTROL_KEY = 'peterson-board-gate.unrelated';
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
  const personal = JSON.stringify({
    version: 1,
    tasks: { 'p08-t01': { value: '0,86', values: ['0,5'], step: 1, guided: true, assisted: true, hint: false,
      stepHints: {}, reveals: {}, attempts: 1, correct: true, independent: false, note: 'Личная запись ' + tag,
      feedback: '', signature: '', repeated: false, completion: { attempts: 1, assisted: true, independent: false } } },
    practice: { 'fraction-multiply:1': { seed: 11 } }, last: { hash: '#lesson/p09/2' }, origin: null
  });
  const values = { [PERSONAL_KEY]: personal, [CONTROL_KEY]: 'unrelated:' + tag };
  await context.addInitScript(({ origin, values, personalKey, controlKey, wrapper }) => {
    if (location.origin !== origin) return;
    if (!localStorage.getItem(controlKey + '.seeded')) {
      for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
      localStorage.setItem(controlKey + '.seeded', '1');
    }
    if (location.pathname === '/trainers/' + wrapper) {
      window.__petersonGateStorageReads = 0;
      window.__petersonGateStorageWrites = 0;
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      Storage.prototype.getItem = function (key) {
        if (key === personalKey) { window.__petersonGateStorageReads++; throw new Error('Board must not read personal progress'); }
        return get.call(this, key);
      };
      Storage.prototype.setItem = function (key, value) {
        if (key === personalKey) { window.__petersonGateStorageWrites++; throw new Error('Board must not write personal progress'); }
        return set.call(this, key, value);
      };
    }
    if (window === window.top) {
      window.__petersonGateMessages = 0;
      addEventListener('message', event => {
        if (event.source === document.querySelector('#trainerFrame')?.contentWindow && event.data?.type === 'mathexam:trainer-state') window.__petersonGateMessages++;
      });
    }
  }, { origin: siteOrigin, values, personalKey: PERSONAL_KEY, controlKey: CONTROL_KEY, wrapper: WRAPPER });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(20000);
  page.on('pageerror', error => failures.push(tag + ': ' + error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname === '127.0.0.1' && response.status() >= 400) failures.push(tag + ': HTTP ' + response.status() + ' ' + url.pathname);
  });
  return { context, page, values, tag };
}

async function assertPersonalStorage(session, frame) {
  const current = await session.page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), [PERSONAL_KEY, CONTROL_KEY]);
  assert.deepEqual(current, session.values, session.tag + ': personal and unrelated storage remain byte-identical');
  if (frame) assert.deepEqual(await frame.evaluate(() => [window.__petersonGateStorageReads, window.__petersonGateStorageWrites]), [0, 0], session.tag + ': board never accesses personal progress');
}

async function waitConnected(page) {
  await page.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено' && document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected', null, { polling: 50, timeout: 15000 });
}

async function courseFrame(page) {
  await page.waitForFunction(file => document.querySelector('#trainerFrame')?.src.includes(file), WRAPPER, { polling: 50 });
  const deadline = Date.now() + 10000;
  let frame;
  while (!frame && Date.now() < deadline) {
    frame = page.frames().find(item => item.url().includes('/trainers/' + WRAPPER));
    if (!frame) await wait(50);
  }
  assert(frame, 'registered Peterson wrapper iframe exists');
  await frame.waitForFunction(() => typeof window.__peterson6Board?.getState === 'function' && typeof window.__peterson6Board?.applyState === 'function' && typeof window.__peterson6Board?.validateState === 'function', null, { polling: 50 });
  await frame.evaluate(() => {
    if (window.__petersonGateInstrumented) return;
    window.__petersonGateInstrumented = true;
    window.__petersonGateApplied = 0;
    addEventListener('message', event => {
      if (event.source === parent && ['mathexam:hydrate', 'mathexam:apply-trainer-state'].includes(event.data?.type)) window.__petersonGateApplied++;
    });
  });
  return frame;
}

const snapshot = frame => frame.evaluate(() => window.__peterson6Board.getState());
const messages = page => page.evaluate(() => window.__petersonGateMessages);

async function waitSnapshot(frame, expected, label) {
  try {
    await frame.waitForFunction(value => {
      const stable = item => Array.isArray(item) ? item.map(stable) : item && typeof item === 'object' ? Object.fromEntries(Object.keys(item).sort().map(key => [key, stable(item[key])])) : item;
      return JSON.stringify(stable(window.__peterson6Board.getState())) === JSON.stringify(stable(value));
    }, expected, { polling: 50, timeout: 10000 });
  } catch (error) {
    assert.deepEqual(await snapshot(frame), expected, label + ': remote snapshot converges');
    throw error;
  }
}

// These independent rendered values detect a matching wire snapshot whose DOM
// or model closure was not restored. Generated element IDs are not state.
function view(frame) {
  return frame.evaluate(() => {
    const one = selector => document.querySelector(selector);
    const text = selector => one(selector)?.textContent.trim() || '';
    return {
      route: location.hash, title: text('#main h1'), problem: text('.prompt'),
      final: one('#final-answer')?.value ?? null,
      note: one('#notebook')?.value ?? null,
      steps: [...document.querySelectorAll('[data-step-input]')].map(element => element.value),
      accepted: [...document.querySelectorAll('.step.completed')].map(element => element.textContent.trim()),
      feedback: [...document.querySelectorAll('.feedback')].map(element => element.textContent.trim()),
      hints: [...document.querySelectorAll('.help')].map(element => element.textContent.trim()),
      choice: [...document.querySelectorAll('[data-choice]')].map(element => element.getAttribute('aria-pressed')),
      details: [...document.querySelectorAll('#main details')].map(element => element.open),
      controls: [...document.querySelectorAll('#model input,#model select')].map(element => element.value),
      pressed: [...document.querySelectorAll('#model [aria-pressed]')].map(element => element.getAttribute('aria-pressed')),
      modelText: text('#model'), geometry: one('#model .pm-visual')?.innerHTML || '',
      number: one('#exercise-number')?.value ?? null, numberResult: text('#number-result'),
      returnBanner: text('.return-banner')
    };
  });
}

async function synchronized(controller, observer, label) {
  const expected = await snapshot(controller);
  assert.equal(await controller.evaluate(value => window.__peterson6Board.validateState(value), expected), true, label + ': valid exported snapshot');
  await waitSnapshot(observer, expected, label);
  assert.deepEqual(await snapshot(observer), expected, label + ': complete semantic state');
  assert.deepEqual(await view(observer), await view(controller), label + ': independently rendered work');
  return expected;
}

async function quietMessages(pages, label) {
  let previous = await Promise.all(pages.map(messages)), unchangedSince = Date.now();
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
  const previousFrame = await courseFrame(previousController), nextFrame = await courseFrame(nextController);
  const before = await snapshot(previousFrame), publishedBefore = await messages(nextController);
  const appliedBefore = await previousFrame.evaluate(() => window.__petersonGateApplied);
  await teacher.locator('#openShare').click();
  await teacher.locator('#controlToggle').click();
  await student.waitForFunction(expected => document.body.classList.contains('control-owner') === expected, studentControls, { polling: 50 });
  await teacher.waitForFunction(expected => document.body.classList.contains('control-owner') !== expected, studentControls, { polling: 50 });
  const pointerEvents = await student.locator('#trainerFrame').evaluate(element => getComputedStyle(element).pointerEvents);
  assert.equal(pointerEvents === 'none', !studentControls, 'actual board grant/revoke gates iframe input');
  // CSS changes first. Wait for controller publication and observer apply to
  // acknowledge the complete handoff rather than relying on a fixed sleep.
  await nextController.waitForFunction(count => window.__petersonGateMessages > count, publishedBefore, { polling: 50 });
  await previousFrame.waitForFunction(count => window.__petersonGateApplied > count, appliedBefore, { polling: 50 });
  assert.deepEqual(await snapshot(nextFrame), before, 'handoff preserves current work');
  await synchronized(nextFrame, previousFrame, 'handoff publication');
  await teacher.locator('#sharePanel [data-close-panel]').click();
}

async function lesson(frame, id, index = 0) {
  await frame.locator('header nav a[href="#home"]').click();
  await frame.locator('.lesson-card[href="#lesson/' + id + '"]').click();
  if (index) await frame.locator('.side-list [data-index="' + index + '"]').click();
  await frame.locator('#answer-form').waitFor();
}

async function narrowShot(page, frame, name, selector) {
  await page.setViewportSize({ width: 320, height: 900 });
  await frame.locator(selector).scrollIntoViewIfNeeded();
  const shots = process.env.PETERSON6_BOARD_SHOTS;
  if (shots) { mkdirSync(shots, { recursive: true }); await page.screenshot({ path: join(shots, name + '.png') }); }
  const layout = await frame.evaluate(() => ({
    width: innerWidth, scroll: document.documentElement.scrollWidth,
    offenders: [...document.querySelectorAll('#main, #main *, .topbar, .topbar *, footer, footer *')].flatMap(element => {
      const box = element.getBoundingClientRect();
      if (!box.width || !box.height || (box.left >= -1 && box.right <= innerWidth + 1)) return [];
      return [{ tag: element.tagName, id: element.id, className: element.getAttribute('class') || '',
        left: Math.round(box.left * 100) / 100, right: Math.round(box.right * 100) / 100,
        width: Math.round(box.width * 100) / 100, scroll: element.scrollWidth,
        minWidth: getComputedStyle(element).minWidth, overflow: getComputedStyle(element).overflowX,
        text: (element.textContent || '').trim().slice(0, 120) }];
    }).slice(0, 24)
  }));
  if (layout.width > 320 || layout.scroll > layout.width + 1) console.error('PETERSON6_NARROW_LAYOUT', JSON.stringify({ name, ...layout }));
  assert(layout.width <= 320, name + ': iframe is narrow');
  assert(layout.scroll <= layout.width + 1, name + ': no horizontal document overflow');
  await page.setViewportSize({ width: 1440, height: 1000 });
}

async function run(browser, siteOrigin, boardOrigin, failures) {
  phase = 'canonical course and visible board entry';
  const entry = await contextFor(browser, siteOrigin, 'entry', failures);
  await entry.page.goto(siteOrigin + '/school/peterson6/', { waitUntil: 'domcontentloaded' });
  await entry.page.locator('.board-link').waitFor();
  assert.equal(await entry.page.evaluate(() => typeof window.__peterson6Board), 'undefined', 'ordinary course does not activate board mode');
  assert.equal(await entry.page.locator('.hero a.button').first().getAttribute('href'), '#lesson/p09/2', 'ordinary course still reads its existing personal continuation');
  const boardLink = new URL(await entry.page.locator('.board-link').getAttribute('href'), siteOrigin);
  const canonical = boardLink.searchParams.get('trainer');
  assert(['/school/peterson6/', '/school/peterson6/#home', '/school/peterson6/index.html#home'].includes(canonical), 'board link carries the canonical course entry');
  boardLink.searchParams.set('server', boardOrigin);
  await entry.page.goto(boardLink.href, { waitUntil: 'domcontentloaded' });
  const entryFrame = await courseFrame(entry.page);
  assert.equal(new URL(entryFrame.url()).pathname, '/trainers/' + WRAPPER);
  assert.equal(await entryFrame.locator('.lesson-card').count(), 14);
  assert.equal((await snapshot(entryFrame)).route, '#home');
  assert.equal(Object.keys((await snapshot(entryFrame)).work.tasks).length, 0, 'shared course does not import personal solved tasks');
  await assertPersonalStorage(entry, entryFrame);
  await entry.context.close();

  phase = 'actual room, registered picker and initial hydration';
  const teacherSession = await contextFor(browser, siteOrigin, 'teacher', failures);
  const studentSession = await contextFor(browser, siteOrigin, 'student', failures);
  const teacher = teacherSession.page, student = studentSession.page;
  await teacher.goto(siteOrigin + '/trainers/trainer-board.html?server=' + encodeURIComponent(boardOrigin), { waitUntil: 'domcontentloaded' });
  await teacher.locator('#openShare').click();
  await teacher.locator('#createRoom').click();
  await teacher.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено' && document.querySelector('#studentLink')?.value.includes('role=student'), null, { polling: 50 });
  const studentLink = await teacher.locator('#studentLink').inputValue();
  await teacher.locator('#sharePanel [data-close-panel]').click();
  assert.equal(new URL(teacher.url()).searchParams.has('token'), false, 'teacher credentials are not exposed in address');
  await student.goto(studentLink, { waitUntil: 'domcontentloaded' });
  await teacher.locator('#chooseTrainer').click();
  await teacher.locator('#pickerSearch').fill('peterson6');
  await teacher.locator('#pickerResults .picker-item').filter({ hasText: /Петерсон/ }).click();
  await Promise.all([waitConnected(teacher), waitConnected(student)]);
  let teacherFrame = await courseFrame(teacher), studentFrame = await courseFrame(student);
  await synchronized(teacherFrame, studentFrame, 'initial home');
  assert.equal((await snapshot(teacherFrame)).route, '#home');
  assert.equal(await teacherFrame.locator('.lesson-card').count(), 14);
  await narrowShot(teacher, teacherFrame, 'peterson-board-320-home', '.topbar');
  assert.match(await teacherFrame.locator('footer').innerText(), /без зачёта в личный прогресс/);
  const baselineCounts = await quietMessages([teacher, student], 'initial quiet');

  phase = 'textbook lookup, partial drafts and saved disclosures';
  await teacherFrame.locator('#exercise-number').fill('177');
  await teacherFrame.locator('#number-form button').click();
  await synchronized(teacherFrame, studentFrame, 'source-number lookup');
  assert.match(await studentFrame.locator('#number-result').innerText(), /страница 47/);
  await teacherFrame.locator('#number-result a[href="#lesson/p08/0"]').click();
  await teacherFrame.locator('#answer-form button[type="submit"]').click();
  await synchronized(teacherFrame, studentFrame, 'empty final answer feedback');
  await teacherFrame.locator('#final-answer').fill('1/');
  await synchronized(teacherFrame, studentFrame, 'unfinished fraction draft');
  await teacherFrame.locator('#answer-form button[type="submit"]').click();
  await synchronized(teacherFrame, studentFrame, 'incorrect final answer feedback');
  await teacherFrame.locator('[data-action="guided"]').click();
  await teacherFrame.locator('[data-step-form="0"] button').click();
  await synchronized(teacherFrame, studentFrame, 'empty guided-step feedback');
  await teacherFrame.locator('[data-step-input="0"]').fill('1/2');
  await teacherFrame.locator('[data-step-form="0"] button').click();
  await synchronized(teacherFrame, studentFrame, 'decimal format requirement feedback');
  assert.match(await studentFrame.locator('#step-feedback-0').innerText(), /Проверь вычисление/);
  await teacherFrame.locator('[data-action="step-hint"]').click();
  await teacherFrame.locator('[data-action="reveal"]').click();
  await synchronized(teacherFrame, studentFrame, 'opt-in revealed first step');
  await teacherFrame.locator('[data-step-input="0"]').fill('0,5');
  await teacherFrame.locator('[data-step-form="0"] button').click();
  await synchronized(teacherFrame, studentFrame, 'accepted decimal step remains visible');
  assert.match(await studentFrame.locator('.step.completed').innerText(), /0,5/);
  await teacherFrame.locator('#final-answer').fill('0,86');
  await teacherFrame.locator('.problem > details > summary').click();
  await teacherFrame.locator('#notebook').fill('Сначала 0,36 + 0,5. Вернусь после тренировки.');
  await teacherFrame.locator('#main > details > summary').click();
  await synchronized(teacherFrame, studentFrame, 'draft, notebook and theory disclosure');
  await narrowShot(teacher, teacherFrame, 'peterson-board-320-task', '#problem');

  phase = 'separate multiplication practice and return to original work';
  const sourceDraft = await teacherFrame.locator('#final-answer').inputValue();
  const sourceNote = await teacherFrame.locator('#notebook').inputValue();
  const sourceStep = await teacherFrame.locator('.step.completed').innerText();
  const detour = teacherFrame.locator('[data-action="detour"][data-skill="fraction-multiply"]');
  if (await detour.count()) await detour.click();
  else {
    // Any authored detour first records the original task. Changing the skill
    // through the actual skills page must retain that same return target.
    await teacherFrame.locator('[data-action="detour"]').first().click();
    await teacherFrame.locator('header nav a[href="#skills"]').click();
    await teacherFrame.locator('a[href="#practice/fraction-multiply/1"]').click();
  }
  await teacherFrame.locator('#level').waitFor();
  await synchronized(teacherFrame, studentFrame, 'focused fraction multiplication');
  assert.equal((await snapshot(teacherFrame)).route, '#practice/fraction-multiply/1');
  const firstCondition = await teacherFrame.locator('.prompt').innerText();
  await teacherFrame.locator('#level').selectOption('3');
  await synchronized(teacherFrame, studentFrame, 'practice difficulty');
  await teacherFrame.locator('[data-action="new"]').click();
  await synchronized(teacherFrame, studentFrame, 'new generated example');
  assert.notEqual(await teacherFrame.locator('.prompt').innerText(), firstCondition);
  await teacherFrame.locator('.return-banner [data-action="return"]').click();
  await synchronized(teacherFrame, studentFrame, 'return restores original computation');
  assert.equal((await snapshot(teacherFrame)).route, '#lesson/p08/0');
  assert.equal(await studentFrame.locator('#final-answer').inputValue(), sourceDraft);
  assert.equal(await studentFrame.locator('#notebook').inputValue(), sourceNote);
  assert.equal(await studentFrame.locator('.step.completed').innerText(), sourceStep);
  await teacherFrame.locator('#answer-form button[type="submit"]').click();
  await synchronized(teacherFrame, studentFrame, 'accepted final result');
  assert.equal(await studentFrame.locator('#answer-form button[type="submit"]').isDisabled(), true);
  const afterTeacherCounts = await quietMessages([teacher, student], 'teacher work quiet');
  assert(afterTeacherCounts[0] > baselineCounts[0], 'teacher edits publish state');
  assert.equal(afterTeacherCounts[1], baselineCounts[1], 'observer applies do not echo teacher state');

  phase = 'river model, student reload and continued slider closure';
  await lesson(teacherFrame, 'p09');
  await teacherFrame.getByLabel('Собственная скорость лодки, км/ч', { exact: true }).press('End');
  await teacherFrame.getByLabel('Скорость течения, км/ч', { exact: true }).press('End');
  await teacherFrame.getByLabel('Скорость течения, км/ч', { exact: true }).press('ArrowLeft');
  const river = await synchronized(teacherFrame, studentFrame, 'river model at 20 and 4.5');
  assert.equal(river.view.model.own, 20);
  assert.equal(river.view.model.current, 4.5);
  await narrowShot(teacher, teacherFrame, 'peterson-board-320-model', '#model');
  await student.reload({ waitUntil: 'domcontentloaded' });
  await waitConnected(student);
  studentFrame = await courseFrame(student);
  await waitSnapshot(studentFrame, river, 'student reload');
  assert.deepEqual(await view(studentFrame), await view(teacherFrame), 'reload restores model and controls');
  await ownership(teacher, student, true);
  await quietMessages([teacher, student], 'student handoff quiet');
  const teacherCount = await messages(teacher);
  await studentFrame.getByLabel('Собственная скорость лодки, км/ч', { exact: true }).press('ArrowLeft');
  const studentRiver = await synchronized(studentFrame, teacherFrame, 'hydrated slider closure');
  assert.equal(studentRiver.view.model.own, 19, 'next key operates on the restored value');
  await studentFrame.locator('#final-answer').fill('7/11');
  await synchronized(studentFrame, teacherFrame, 'student draft');
  await quietMessages([teacher, student], 'student work quiet');
  assert.equal(await messages(teacher), teacherCount, 'teacher as observer does not echo');
  const studentWork = await snapshot(studentFrame);
  await teacher.reload({ waitUntil: 'domcontentloaded' });
  await waitConnected(teacher);
  teacherFrame = await courseFrame(teacher);
  await waitSnapshot(teacherFrame, studentWork, 'teacher reload while student controls');
  assert.equal(await student.evaluate(() => document.body.classList.contains('control-owner')), true);
  await studentFrame.locator('#final-answer').fill('9/13');
  await synchronized(studentFrame, teacherFrame, 'student continues after teacher reload');
  await ownership(teacher, student, false);

  phase = 'mean-model transfer and late join';
  await lesson(teacherFrame, 'p10');
  await teacherFrame.getByLabel('Из какой коробки?', { exact: true }).selectOption('1');
  await teacherFrame.getByLabel('В какую коробку?', { exact: true }).selectOption('0');
  await teacherFrame.getByRole('button', { name: 'Переложить 1 кружок', exact: true }).click();
  const mean = await synchronized(teacherFrame, studentFrame, 'mean model transfer');
  assert.deepEqual(mean.view.model.piles, [3, 7, 5]);
  await ownership(teacher, student, true);
  await studentFrame.getByRole('button', { name: 'Переложить 1 кружок', exact: true }).click();
  const studentMean = await synchronized(studentFrame, teacherFrame, 'hydrated pile closure');
  assert.deepEqual(studentMean.view.model.piles, [4, 6, 5]);
  await ownership(teacher, student, false);
  const lateSession = await contextFor(browser, siteOrigin, 'late', failures);
  await lateSession.page.goto(studentLink, { waitUntil: 'domcontentloaded' });
  await waitConnected(lateSession.page);
  const lateFrame = await courseFrame(lateSession.page);
  await waitSnapshot(lateFrame, studentMean, 'late join');
  assert.deepEqual(await view(lateFrame), await view(teacherFrame), 'late join restores complete visible model');
  await teacherFrame.getByRole('button', { name: 'Переложить 1 кружок', exact: true }).click();
  const afterLate = await synchronized(teacherFrame, lateFrame, 'late participant follows teacher');
  await synchronized(teacherFrame, studentFrame, 'original participant follows teacher');
  assert.deepEqual(afterLate.view.model.piles, [5, 5, 5]);

  phase = 'choice tasks and all route families';
  await lesson(teacherFrame, 'p01');
  const correctChoice = await teacherFrame.evaluate(() => { const t = PetersonCourse.lessons[0].tasks[0]; return t.choices.indexOf(t.answer); });
  await teacherFrame.locator('[data-choice="' + correctChoice + '"]').click();
  await teacherFrame.locator('#answer-form button[type="submit"]').click();
  await synchronized(teacherFrame, studentFrame, 'multiple-choice solution');
  assert.equal(await studentFrame.locator('#answer-form button[type="submit"]').isDisabled(), true);
  for (let n = 1; n <= 14; n++) {
    const id = 'p' + String(n).padStart(2, '0');
    await lesson(teacherFrame, id);
    await synchronized(teacherFrame, studentFrame, 'lesson ' + id);
    assert.equal(await studentFrame.locator('#model .pm-model').count(), 1);
  }
  const skills = await teacherFrame.evaluate(() => PetersonMath.skills.map(skill => skill.id));
  assert.equal(skills.length, 20);
  let practiceScreens = 0;
  for (const skill of skills) {
    await teacherFrame.locator('header nav a[href="#skills"]').click();
    await teacherFrame.locator('a[href="#practice/' + skill + '/1"]').click();
    for (const level of ['1', '2', '3']) {
      if (level !== '1') await teacherFrame.locator('#level').selectOption(level);
      const current = await synchronized(teacherFrame, studentFrame, skill + ' level ' + level);
      assert.equal(current.route, '#practice/' + skill + '/' + level);
      assert.equal(await studentFrame.locator('#final-answer').count(), 1);
      practiceScreens++;
    }
  }
  assert.equal(practiceScreens, 60);
  await teacherFrame.locator('header nav a[href="#progress"]').click();
  await synchronized(teacherFrame, studentFrame, 'shared lesson results');
  assert.equal(await teacherFrame.locator('#import-file').count(), 0, 'shared mode cannot import personal results');
  assert.equal(await teacherFrame.locator('[data-action="export"]').count(), 0, 'shared mode does not export work as personal progress');

  phase = 'reject malformed state atomically and stop echoes';
  const beforeBad = await snapshot(teacherFrame), beforeBadView = await view(teacherFrame);
  const rejected = await teacherFrame.evaluate(() => {
    const bad = structuredClone(window.__peterson6Board.getState());
    bad.route = '#lesson/p99/0';
    try { return window.__peterson6Board.applyState(bad) === false; } catch (_) { return true; }
  });
  assert.equal(rejected, true);
  assert.deepEqual(await snapshot(teacherFrame), beforeBad);
  assert.deepEqual(await view(teacherFrame), beforeBadView);
  const stable = await quietMessages([teacher, student, lateSession.page], 'final quiescence');
  await wait(500);
  assert.deepEqual(await Promise.all([teacher, student, lateSession.page].map(messages)), stable);
  await Promise.all([[teacherSession, teacherFrame], [studentSession, studentFrame], [lateSession, lateFrame]].map(([session, frame]) => assertPersonalStorage(session, frame)));
  assert.deepEqual(failures, [], 'no browser errors or failed local resources');
  console.log('PETERSON6_BOARD_BROWSER_OK: canonical link/alias; real registry/board/server; 14 lessons and 60 practice screens; drafts, guided steps, hints, notebook, detour/return, source lookup, choice; river/mean closure restore; teacher/student reload; grant/revoke; late join; no echo; personal progress isolated; 320px home/task/model');
}

(async () => {
  const server = staticServer();
  let browser, child, watchdog, serverErrors = '';
  try {
    await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
    const siteOrigin = 'http://127.0.0.1:' + server.address().port;
    const boardPort = await freePort(), boardOrigin = 'http://127.0.0.1:' + boardPort;
    const env = { ...process.env, HOST: '127.0.0.1', PORT: String(boardPort), NODE_ENV: 'test', CORS_ALLOWED_ORIGINS: siteOrigin };
    for (const key of Object.keys(env)) if (/^(LEARNING_|PROGRESS_|GROUP_LESSON_)/.test(key)) delete env[key];
    child = spawn(process.execPath, ['index.js'], { cwd: join(ROOT, 'board-server'), env, stdio: ['ignore', 'ignore', 'pipe'] });
    child.stderr.on('data', chunk => { serverErrors = (serverErrors + String(chunk)).slice(-4000); });
    await waitForHttp(boardOrigin + '/health', child, () => serverErrors);
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'], timeout: 15000 });
    await Promise.race([
      run(browser, siteOrigin, boardOrigin, []),
      new Promise((_, reject) => { watchdog = setTimeout(() => reject(new Error('Browser gate exceeded 240 seconds at ' + phase)), 240000); })
    ]);
  } finally {
    clearTimeout(watchdog);
    await browser?.close();
    if (child && child.exitCode === null) child.kill('SIGTERM');
    await new Promise(resolveClose => server.close(resolveClose));
  }
})().catch(error => { console.error('PETERSON6_BOARD_BROWSER_FAILED at ' + phase + '\n' + (error.stack || error)); process.exitCode = 1; });
