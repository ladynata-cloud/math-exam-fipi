'use strict';

// Uses the real classic board, registry, bridge and Socket.IO server, following
// tools/peterson6-board.browser.cjs and tools/board-writing.browser.cjs. These
// localhost rooms and browser profiles contain synthetic data only. No relay
// substitutes for the server and no successful scene is injected through apply.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createReadStream, mkdirSync, readFileSync, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { createServer: createNetServer } = require('node:net');
const { extname, join, resolve, sep } = require('node:path');
const vm = require('node:vm');
const { chromium } = require('playwright');

const ROOT = resolve(__dirname, '../..');
const WRAPPER = '/trainers/peterson5.html';
const PERSONAL_KEYS = ['mathexam.peterson5.v1', 'mathexam.peterson5.workshop.v1'];
const CONTROL_KEY = 'peterson5-board-gate.unrelated';
const wait = ms => new Promise(done => setTimeout(done, ms));
const readData = (file, key) => {
  const context = { window: {} };
  vm.runInNewContext(readFileSync(join(__dirname, file), 'utf8'), context);
  return JSON.parse(JSON.stringify(context.window[key]));
};
const course = readData('data.js', 'PetersonCourse');
const topics = readData('workshop-data.js', 'PetersonWorkshopData').topics;
const topic = id => topics.find(item => item.id === id);
let phase = 'startup';

async function freePort() {
  const server = createNetServer();
  await new Promise((done, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', done); });
  const port = server.address().port;
  await new Promise(done => server.close(done));
  return port;
}

function staticServer() {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.woff2': 'font/woff2' };
  return createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      if (pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
      let file = resolve(ROOT, '.' + pathname);
      if (file !== ROOT && !file.startsWith(ROOT + sep)) { response.writeHead(403).end(); return; }
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      response.setHeader('Content-Type', (mime[extname(file)] || 'application/octet-stream') + (/\.(html|js|css|json|svg)$/.test(file) ? '; charset=utf-8' : ''));
      response.setHeader('Cache-Control', 'no-store');
      createReadStream(file).pipe(response);
    } catch (_) { response.writeHead(404).end(); }
  });
}

async function waitForHealth(origin, child, diagnostics) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Local board server exited: ' + diagnostics());
    try { if ((await fetch(origin + '/health', { signal: AbortSignal.timeout(1000) })).ok) return; } catch (_) {}
    await wait(100);
  }
  throw new Error('Local board server did not become healthy: ' + diagnostics());
}

async function newSession(browser, siteOrigin, boardOrigin, tag, failures) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const q = topic('p01').discovery;
  const values = {
    [PERSONAL_KEYS[0]]: JSON.stringify({ version: 1, tasks: {}, practice: {}, last: { hash: '#lesson/p02/0' }, origin: null }),
    [PERSONAL_KEYS[1]]: JSON.stringify({ version: 1, revision: 7, entries: { [q.id]: {
      value: q.answer, note: 'Личная запись ' + tag, attempts: 1, first: q.answer, firstWrong: '', accepted: true, aided: false,
      hints: 0, solution: false, showSteps: false, step: 0, stepValues: [], modelOpen: false,
      completion: { aided: false, attempts: 1, first: q.answer }
    } }, checks: { p02: { answers: Object.fromEntries(topic('p02').check.map(item => [item.id, item.answer])), drafts: {}, aided: false } }, models: {}, last: '#topic/p02/check' }),
    [CONTROL_KEY]: 'untouched:' + tag
  };
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if ([siteOrigin, boardOrigin].includes(url.origin) || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
    failures.push(tag + ': unexpected external request ' + url.origin + url.pathname);
    return route.abort();
  });
  await context.addInitScript(({ origin, values, personalKeys, controlKey, wrapper }) => {
    if (location.origin !== origin) return;
    if (!localStorage.getItem(controlKey + '.seeded')) {
      for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
      localStorage.setItem(controlKey + '.seeded', '1');
    }
    if (location.pathname === wrapper) {
      window.__p5StorageReads = 0; window.__p5StorageWrites = 0;
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      Storage.prototype.getItem = function (key) {
        if (personalKeys.includes(key)) { window.__p5StorageReads++; throw new Error('Shared wrapper read personal course progress'); }
        return get.call(this, key);
      };
      Storage.prototype.setItem = function (key, value) {
        if (personalKeys.includes(key)) { window.__p5StorageWrites++; throw new Error('Shared wrapper wrote personal course progress'); }
        return set.call(this, key, value);
      };
    }
    if (window === window.top) {
      window.__p5Publications = 0;
      addEventListener('message', event => {
        if (event.source === document.querySelector('#trainerFrame')?.contentWindow && event.data?.type === 'mathexam:trainer-state') window.__p5Publications++;
      });
    }
  }, { origin: siteOrigin, values, personalKeys: PERSONAL_KEYS, controlKey: CONTROL_KEY, wrapper: WRAPPER });
  const page = await context.newPage();
  page.setDefaultTimeout(10000); page.setDefaultNavigationTimeout(20000);
  page.on('pageerror', error => failures.push(tag + ': ' + error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname === '127.0.0.1' && response.status() >= 400) failures.push(tag + ': HTTP ' + response.status() + ' ' + url.pathname);
  });
  return { context, page, tag, values };
}

async function assertPersonalStorage(session, frame) {
  const current = await session.page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), [...PERSONAL_KEYS, CONTROL_KEY]);
  assert.deepEqual(current, session.values, session.tag + ': both personal courses and unrelated storage remain byte-identical');
  assert.deepEqual(await frame.evaluate(() => [window.__p5StorageReads, window.__p5StorageWrites]), [0, 0], session.tag + ': no personal storage access in the shared wrapper');
}

async function waitConnected(page) {
  await page.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено' &&
    document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected', null, { polling: 50, timeout: 15000 });
}

async function courseFrame(page) {
  await page.waitForFunction(wrapper => document.querySelector('#trainerFrame')?.src.includes(wrapper), WRAPPER, { polling: 50 });
  let frame;
  const deadline = Date.now() + 10000;
  while (!frame && Date.now() < deadline) {
    frame = page.frames().find(item => item.url().includes(WRAPPER));
    if (!frame) await wait(25);
  }
  assert(frame, 'registered Peterson 5 wrapper exists');
  await frame.waitForFunction(() => ['getState', 'applyState', 'validateState'].every(key => typeof window.__peterson5Board?.[key] === 'function'));
  await frame.evaluate(() => {
    if (window.__p5Applied !== undefined) return;
    window.__p5Applied = 0;
    addEventListener('message', event => {
      if (event.source === parent && ['mathexam:hydrate', 'mathexam:apply-trainer-state'].includes(event.data?.type)) window.__p5Applied++;
    });
  });
  return frame;
}

async function snapshot(frame) {
  await frame.evaluate(() => window.PetersonWorkshop.whenIdle());
  return frame.evaluate(() => window.__peterson5Board.getState());
}

// DOM is checked separately from the wire state: equal snapshots alone cannot
// establish that step feedback, model closures or checked answers were restored.
function rendered(frame) {
  return frame.evaluate(() => {
    const one = selector => document.querySelector(selector), text = selector => one(selector)?.textContent.trim() || '';
    return {
      route: location.hash, title: text('#main h1'), question: text('#workshop-question'), legacyPrompt: text('.prompt'),
      fields: [...document.querySelectorAll('#main [data-w-value],#final-answer,[data-step-input],#notebook,#workshop-notes')].map(element => ({
        type: element.type, value: element.value, checked: element.type === 'radio' ? element.checked : null, disabled: element.disabled
      })),
      details: [...document.querySelectorAll('#main details')].map(element => element.open),
      feedback: [...document.querySelectorAll('[data-w-status],[data-w-step-status],.feedback,[id^="step-feedback-"]')].map(element => element.textContent.trim()),
      acceptedSteps: [...document.querySelectorAll('.workshop-step.is-done,.step.completed')].map(element => element.textContent.trim()),
      helpers: [...document.querySelectorAll('.workshop-hint,.help')].map(element => element.textContent.trim()),
      modelControls: [...document.querySelectorAll('[data-p5]')].map(element => ({ name: element.dataset.p5, value: element.value })),
      modelText: text('[data-w-model-host]') || text('#model'),
      modelPicture: one('[data-w-model-host] .p5-math')?.innerHTML || '',
      gif: [...document.querySelectorAll('[data-p5-gif-toggle]')].map(element => element.getAttribute('aria-pressed')),
      visibleTopics: [...document.querySelectorAll('[data-w-topic]:not([hidden])')].map(element => element.dataset.wTopic),
      number: one('#exercise-number')?.value ?? null, numberResult: text('#number-result'),
      result: text('.workshop-result'), returnBanner: text('.return-banner')
    };
  });
}

async function waitSnapshot(frame, expected, label) {
  try {
    await frame.waitForFunction(value => {
      const stable = item => Array.isArray(item) ? item.map(stable) : item && typeof item === 'object' ? Object.fromEntries(Object.keys(item).sort().map(key => [key, stable(item[key])])) : item;
      return JSON.stringify(stable(window.__peterson5Board.getState())) === JSON.stringify(stable(value));
    }, expected, { polling: 50, timeout: 10000 });
  } catch (error) {
    assert.deepEqual(await snapshot(frame), expected, label + ': remote snapshot converges');
    throw error;
  }
}

async function synchronized(controller, observer, label) {
  const expected = await snapshot(controller);
  assert.equal(await controller.evaluate(value => window.__peterson5Board.validateState(value), expected), true, label + ': exported state validates');
  assert(Buffer.byteLength(JSON.stringify(expected)) < 64 * 1024, label + ': bridge payload stays within 64 KiB');
  await waitSnapshot(observer, expected, label);
  assert.deepEqual(await rendered(observer), await rendered(controller), label + ': independent DOM matches');
  return expected;
}

const publications = page => page.evaluate(() => window.__p5Publications);
async function quiet(pages, label) {
  let prior = await Promise.all(pages.map(publications)), unchanged = Date.now();
  const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    await wait(100);
    const current = await Promise.all(pages.map(publications));
    if (current.some((value, i) => value !== prior[i])) unchanged = Date.now();
    else if (Date.now() - unchanged >= 400) return current;
    prior = current;
  }
  throw new Error(label + ': state publications did not settle');
}

async function ownership(teacher, student, studentControls) {
  const previous = studentControls ? teacher : student, next = studentControls ? student : teacher;
  const previousFrame = await courseFrame(previous), nextFrame = await courseFrame(next);
  const before = await snapshot(previousFrame), sent = await publications(next), applied = await previousFrame.evaluate(() => window.__p5Applied);
  await teacher.locator('#openShare').click();
  await teacher.locator('#controlToggle').click();
  await student.waitForFunction(expected => document.body.classList.contains('control-owner') === expected, studentControls);
  await teacher.waitForFunction(expected => document.body.classList.contains('control-owner') !== expected, studentControls);
  assert.equal(await student.locator('#trainerFrame').evaluate(element => getComputedStyle(element).pointerEvents === 'none'), !studentControls);
  await next.waitForFunction(count => window.__p5Publications > count, sent);
  await previousFrame.waitForFunction(count => window.__p5Applied > count, applied);
  assert.deepEqual(await snapshot(nextFrame), before, 'grant/revoke preserves the shared scene');
  await synchronized(nextFrame, previousFrame, 'handoff acknowledgment');
  await teacher.locator('#sharePanel [data-close-panel]').click();
}

async function openTopic(frame, id) {
  await frame.locator('header nav a[href="#home"]').click();
  await frame.locator('[data-w-topic="' + id + '"]').click();
  await frame.locator('[data-w-form]').waitFor();
}

async function answer(frame, formSelector, question, value = question.answer) {
  const form = frame.locator(formSelector);
  if (question.kind === 'choice') {
    const index = await form.locator('[data-w-value]').evaluateAll((elements, expected) => elements.findIndex(element => element.value === expected), value);
    assert(index >= 0, 'the authored choice is rendered');
    await form.locator('[data-w-value]').nth(index).check();
  } else await form.locator('[data-w-value]').fill(value);
}

const inkState = page => page.evaluate(() => {
  const value = publicSnapshot();
  for (const sheet of value.pages) sheet.strokes = sheet.strokes.map(stroke => { const copy = { ...stroke }; delete copy.createdAt; return copy; });
  return value;
});
async function sameInk(source, observer, label) {
  const expected = await inkState(source);
  await observer.waitForFunction(value => {
    const actual = publicSnapshot();
    for (const sheet of actual.pages) sheet.strokes = sheet.strokes.map(stroke => { const copy = { ...stroke }; delete copy.createdAt; return copy; });
    return JSON.stringify(actual) === JSON.stringify(value);
  }, expected, { polling: 25 });
  assert.deepEqual(await inkState(observer), expected, label);
}
async function drawInk(page, observer, offset) {
  const before = await inkState(page), index = before.currentPage, count = before.pages[index].strokes.length;
  await page.locator('[data-tool="pen"]').click();
  await page.locator('#canvas').scrollIntoViewIfNeeded();
  const box = await page.locator('#canvas').boundingBox();
  assert(box && box.width > 200 && box.height > 150);
  await page.mouse.move(box.x + 35, box.y + 40 + offset);
  await page.mouse.down();
  await page.mouse.move(box.x + 170, box.y + 75 + offset, { steps: 8 });
  await page.mouse.up();
  await page.waitForFunction(({ index, count }) => publicSnapshot().pages[index].strokes.length === count + 1, { index, count });
  assert((await inkState(page)).pages[index].strokes.at(-1).objectId, 'a real pointer gesture creates an ink object');
  await sameInk(page, observer, 'handwritten board is shared with the exercise');
}

async function narrowShot(page, frame, name) {
  await page.setViewportSize({ width: 320, height: 900 });
  const layout = await frame.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  assert(layout.width <= 320 && layout.scroll <= layout.width + 1, name + ': no horizontal overflow at 320 px');
  if (process.env.PETERSON5_BOARD_SHOTS) {
    mkdirSync(process.env.PETERSON5_BOARD_SHOTS, { recursive: true });
    await page.screenshot({ path: join(process.env.PETERSON5_BOARD_SHOTS, name + '.png'), fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}

async function run(browser, siteOrigin, boardOrigin, failures) {
  phase = 'canonical entry and current server registry';
  const entry = await newSession(browser, siteOrigin, boardOrigin, 'entry', failures);
  await entry.page.goto(siteOrigin + '/school/peterson5/', { waitUntil: 'domcontentloaded' });
  await entry.page.locator('[data-p5-board-link]').waitFor();
  assert.equal(await entry.page.evaluate(() => typeof window.__peterson5Board), 'undefined', 'ordinary course remains personal');
  const link = new URL(await entry.page.locator('[data-p5-board-link]').getAttribute('href'), siteOrigin);
  const target = new URL(link.searchParams.get('trainer'), siteOrigin);
  assert(['/school/peterson5/', '/school/peterson5/index.html', WRAPPER].includes(target.pathname), 'visible entry uses the canonical course or registered wrapper');
  link.searchParams.set('server', boardOrigin);
  await entry.page.goto(link.href, { waitUntil: 'domcontentloaded' });
  const entryFrame = await courseFrame(entry.page), initial = await snapshot(entryFrame);
  assert.equal(initial.route, '#home'); assert.equal(initial.legacy, null); assert.equal(initial.workshop, null);
  await assertPersonalStorage(entry, entryFrame); await entry.context.close();

  phase = 'real room, registered picker and initial hydration';
  const teacherSession = await newSession(browser, siteOrigin, boardOrigin, 'teacher', failures);
  const studentSession = await newSession(browser, siteOrigin, boardOrigin, 'student', failures);
  const teacher = teacherSession.page, student = studentSession.page;
  await teacher.goto(siteOrigin + '/trainers/trainer-board.html?server=' + encodeURIComponent(boardOrigin), { waitUntil: 'domcontentloaded' });
  await teacher.locator('#openShare').click(); await teacher.locator('#createRoom').click();
  await teacher.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено' && document.querySelector('#studentLink')?.value.includes('role=student'));
  const studentLink = await teacher.locator('#studentLink').inputValue();
  await teacher.locator('#sharePanel [data-close-panel]').click();
  assert.equal(new URL(teacher.url()).searchParams.has('token'), false);
  await student.goto(studentLink, { waitUntil: 'domcontentloaded' });
  await teacher.locator('#chooseTrainer').click(); await teacher.locator('#pickerSearch').fill('peterson5');
  await teacher.locator('#pickerResults .picker-item').filter({ hasText: /Петерсон/ }).click();
  await Promise.all([waitConnected(teacher), waitConnected(student)]);
  let teacherFrame = await courseFrame(teacher), studentFrame = await courseFrame(student);
  await synchronized(teacherFrame, studentFrame, 'initial shared home');
  assert.equal(await teacherFrame.locator('[data-w-topic]').count(), 43);
  await narrowShot(teacher, teacherFrame, 'home');
  const baseline = await quiet([teacher, student], 'initial quiet');

  phase = 'language choice, hints, steps and notebook';
  await openTopic(teacherFrame, 'p01');
  await teacherFrame.locator('[data-w-form] button[type="submit"]').click();
  await synchronized(teacherFrame, studentFrame, 'empty choice feedback');
  await answer(teacherFrame, '[data-w-form]', topic('p01').discovery, topic('p01').discovery.choices.find(value => value !== topic('p01').discovery.answer));
  await teacherFrame.locator('[data-w-form] button[type="submit"]').click();
  await synchronized(teacherFrame, studentFrame, 'first wrong reasoning choice');
  await teacherFrame.locator('[data-w-hint]').click(); await teacherFrame.locator('[data-w-steps]').click();
  await teacherFrame.locator('[data-w-step-form] button[type="submit"]').click();
  await synchronized(teacherFrame, studentFrame, 'empty intermediate step feedback');
  await answer(teacherFrame, '[data-w-step-form]', topic('p01').discovery.steps[0]);
  await teacherFrame.locator('[data-w-step-form] button[type="submit"]').click();
  await teacherFrame.locator('.workshop-notes > summary').click();
  await teacherFrame.locator('#workshop-notes').fill('Сначала находим произведение, затем разность.');
  await synchronized(teacherFrame, studentFrame, 'accepted intermediate step and shared note');
  await answer(teacherFrame, '[data-w-form]', topic('p01').discovery);
  await teacherFrame.locator('[data-w-form] button[type="submit"]').click();
  const solved = await synchronized(teacherFrame, studentFrame, 'guided choice completion');
  const solvedEntry = solved.workshop.entries[topic('p01').discovery.id];
  assert.equal(solvedEntry.accepted, true); assert.equal(solvedEntry.completion.aided, true);
  const teacherWork = await quiet([teacher, student], 'teacher work settled');
  assert(teacherWork[0] > baseline[0]);
  assert.equal(teacherWork[1], baseline[1], 'student observer does not echo incoming teacher work');

  phase = 'enumeration model, student reload and real control transfer';
  await openTopic(teacherFrame, 'p06');
  await answer(teacherFrame, '[data-w-form]', topic('p06').discovery, '22 27');
  await teacherFrame.locator('[data-w-model]').click();
  await teacherFrame.locator('[data-p5-action="enumerate"]').click();
  await teacherFrame.locator('[data-p5-action="enumerate"]').click();
  const enumeration = await synchronized(teacherFrame, studentFrame, 'partial set and enumeration model');
  assert.deepEqual(Object.keys(enumeration.workshop.entries), [topic('p06').discovery.id]);
  assert.equal(enumeration.workshop.models.p06.shown, 2);
  await narrowShot(teacher, teacherFrame, 'enumeration');
  await drawInk(teacher, student, 0);
  await student.reload({ waitUntil: 'domcontentloaded' }); await waitConnected(student);
  studentFrame = await courseFrame(student); await waitSnapshot(studentFrame, enumeration, 'student reload');
  assert.deepEqual(await rendered(studentFrame), await rendered(teacherFrame));
  await sameInk(teacher, student, 'reload restores handwriting');
  await ownership(teacher, student, true);
  await quiet([teacher, student], 'student handoff settled');
  const teacherObserverCount = await publications(teacher);
  await studentFrame.locator('[data-p5-action="enumerate"]').click();
  const resumed = await synchronized(studentFrame, teacherFrame, 'restored model closure advances');
  assert.equal(resumed.workshop.models.p06.shown, 3);
  await answer(studentFrame, '[data-w-form]', topic('p06').discovery, '77 22 72 27');
  await studentFrame.locator('[data-w-form] button[type="submit"]').click();
  const setSolved = await synchronized(studentFrame, teacherFrame, 'student completes an unordered set');
  assert.equal(setSolved.workshop.entries[topic('p06').discovery.id].accepted, true);
  await quiet([teacher, student], 'student work settled');
  assert.equal(await publications(teacher), teacherObserverCount, 'teacher observer does not echo incoming student work');
  await drawInk(student, teacher, 50);
  await teacher.reload({ waitUntil: 'domcontentloaded' }); await waitConnected(teacher);
  teacherFrame = await courseFrame(teacher); await waitSnapshot(teacherFrame, setSolved, 'teacher reload while student controls');
  await sameInk(student, teacher, 'teacher reload restores both authors strokes');
  await ownership(teacher, student, false);

  phase = 'fraction drafts, GIF playback and assisted group check';
  await openTopic(teacherFrame, 'p28');
  await answer(teacherFrame, '[data-w-form]', topic('p28').discovery, '1/');
  await synchronized(teacherFrame, studentFrame, 'unfinished fraction draft');
  await teacherFrame.locator('[data-w-form] button[type="submit"]').click();
  await synchronized(teacherFrame, studentFrame, 'incomplete fraction explanation');
  await teacherFrame.locator('.p5-media > summary').click();
  const gifToggle = teacherFrame.locator('[data-p5-gif-toggle]');
  await gifToggle.waitFor(); await gifToggle.click();
  const playing = await synchronized(teacherFrame, studentFrame, 'shared GIF playing flag');
  assert.equal(playing.view.media.gifPlaying, true);
  await gifToggle.click();
  assert.equal((await synchronized(teacherFrame, studentFrame, 'shared GIF stopped flag')).view.media.gifPlaying, false);
  await teacherFrame.locator('a[href="#topic/p28/check"]').click();
  for (let i = 0; i < 3; i++) {
    await answer(teacherFrame, '[data-w-check-form]', topic('p28').check[i]);
    await synchronized(teacherFrame, studentFrame, 'current checkpoint draft ' + i);
    await teacherFrame.locator('[data-w-check-form] button[type="submit"]').click();
    const result = await synchronized(teacherFrame, studentFrame, 'current checkpoint response ' + i);
    assert.deepEqual(Object.keys(result.workshop.checks), ['p28']);
    assert.equal(Object.keys(result.workshop.checks.p28.answers).length, i + 1);
    assert.equal(result.workshop.checks.p28.aided, true);
  }
  await teacherFrame.locator('.workshop-result').waitFor();

  phase = 'source lookup, existing task and generated arithmetic';
  await teacherFrame.locator('header nav a[href="#home"]').click();
  await teacherFrame.locator('.workshop-book > summary').click();
  await teacherFrame.locator('#exercise-number').fill('34');
  await teacherFrame.locator('#number-form button').click();
  await synchronized(teacherFrame, studentFrame, 'textbook number lookup');
  await teacherFrame.locator('#number-result a[href="#lesson/p02/0"]').click();
  await teacherFrame.locator('#final-answer').fill('1/');
  await teacherFrame.locator('[data-action="guided"]').click();
  const legacyTask = course.lessons.find(item => item.id === 'p02').tasks[0];
  await teacherFrame.locator('[data-step-input="0"]').fill(legacyTask.steps[0].answer);
  await teacherFrame.locator('[data-step-form="0"] button').click();
  const legacy = await synchronized(teacherFrame, studentFrame, 'existing authored steps and draft');
  assert.deepEqual(Object.keys(legacy.legacy.tasks), [legacyTask.id]); assert.equal(legacy.workshop, null);
  await teacherFrame.locator('header nav a[href="#skills"]').click();
  await teacherFrame.locator('a[href="#practice/fraction-add/1"]').click();
  await teacherFrame.locator('#level').selectOption('3');
  await teacherFrame.locator('[data-action="new"]').click();
  const generated = await synchronized(teacherFrame, studentFrame, 'actual generated arithmetic seed and level');
  assert.equal(Object.keys(generated.legacy.tasks).length, 1); assert.equal(Object.keys(generated.legacy.practice).length, 1);

  phase = 'all 43 topics and late join';
  for (const item of topics) {
    await openTopic(teacherFrame, item.id);
    const current = await synchronized(teacherFrame, studentFrame, 'topic ' + item.id);
    assert.deepEqual(Object.keys(current.workshop.entries), [item.discovery.id]);
  }
  const lateSession = await newSession(browser, siteOrigin, boardOrigin, 'late', failures);
  await lateSession.page.goto(studentLink, { waitUntil: 'domcontentloaded' }); await waitConnected(lateSession.page);
  const lateFrame = await courseFrame(lateSession.page);
  await synchronized(teacherFrame, lateFrame, 'late join hydrates the current scene only');
  await sameInk(teacher, lateSession.page, 'late join receives the same handwritten board');
  await answer(teacherFrame, '[data-w-form]', topic('p43').discovery, '4,');
  await synchronized(teacherFrame, lateFrame, 'late participant receives a new draft');
  await synchronized(teacherFrame, studentFrame, 'original student receives the same draft');

  phase = 'atomic rejection, no echo and personal-result isolation';
  const before = await snapshot(teacherFrame), beforeDOM = await rendered(teacherFrame);
  assert.equal(await teacherFrame.evaluate(() => {
    const bad = structuredClone(window.__peterson5Board.getState()); bad.route = '#topic/p99/check';
    try { return window.__peterson5Board.applyState(bad) === false; } catch (_) { return true; }
  }), true);
  assert.deepEqual(await snapshot(teacherFrame), before); assert.deepEqual(await rendered(teacherFrame), beforeDOM);
  const counts = await quiet([teacher, student, lateSession.page], 'final no echo');
  await wait(500); assert.deepEqual(await Promise.all([teacher, student, lateSession.page].map(publications)), counts);
  assert(counts[0] > baseline[0], 'controller edits publish real bridge messages');
  await Promise.all([[teacherSession, teacherFrame], [studentSession, studentFrame], [lateSession, lateFrame]].map(([session, frame]) => assertPersonalStorage(session, frame)));
  assert.deepEqual(failures, [], 'no browser errors, unexpected external traffic or failed local resources');
  console.log('PETERSON5_BOARD_BROWSER_OK: real registry/bridge/Socket.IO; all 43 topics; choices, sets, fractions, steps, hints, notebook, models, GIF; assisted group check; legacy and generated task; grant/revoke; reload; late join; real shared handwriting; no echo; personal progress untouched; 320px layouts');
}

(async () => {
  const server = staticServer();
  let browser, child, watchdog, serverErrors = '';
  try {
    await new Promise((done, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', done); });
    const siteOrigin = 'http://127.0.0.1:' + server.address().port;
    const port = await freePort(), boardOrigin = 'http://127.0.0.1:' + port;
    const env = { ...process.env, HOST: '127.0.0.1', PORT: String(port), NODE_ENV: 'test', CORS_ALLOWED_ORIGINS: siteOrigin };
    for (const key of Object.keys(env)) if (/^(LEARNING_|PROGRESS_|GROUP_LESSON_)/.test(key)) delete env[key];
    delete env.TRAINER_REGISTRY_PATH; // Read the actual repository registry.
    child = spawn(process.execPath, ['index.js'], { cwd: join(ROOT, 'board-server'), env, stdio: ['ignore', 'ignore', 'pipe'] });
    child.stderr.on('data', chunk => { serverErrors = (serverErrors + String(chunk)).slice(-4000); });
    await waitForHealth(boardOrigin, child, () => serverErrors);
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'], timeout: 15000 });
    await Promise.race([run(browser, siteOrigin, boardOrigin, []), new Promise((_, fail) => {
      watchdog = setTimeout(() => fail(new Error('Browser gate exceeded 240 seconds at ' + phase)), 240000);
    })]);
  } finally {
    clearTimeout(watchdog); await browser?.close();
    if (child && child.exitCode === null) child.kill('SIGTERM');
    await new Promise(done => server.close(done));
  }
})().catch(error => { console.error('PETERSON5_BOARD_BROWSER_FAILED at ' + phase + '\n' + (error.stack || error)); process.exitCode = 1; });
