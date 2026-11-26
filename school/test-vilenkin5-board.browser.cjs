'use strict';

// Actual classic-board acceptance: isolated localhost teacher/student/late-join
// browser contexts, the repository registry and the unmodified Socket.IO server.
// Follows tools/peterson6-board.browser.cjs and tools/board-writing.browser.cjs.
// No production room, mocked registry, simulated relay or personal account.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createReadStream, mkdirSync, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { createServer: createNetServer } = require('node:net');
const { extname, join, resolve, sep } = require('node:path');
const { chromium } = require('playwright');
const ROOT = resolve(__dirname, '..'), WRAPPER = '/trainers/vilenkin5.html';
const PERSONAL_KEYS = [require('./state.js').KEY, require('./state.js').TEACHER, require('./vilenkin5-quality.js').KEY];
const SENTINEL = 'vilenkin5-board-gate.unrelated';
const wait = ms => new Promise(done => setTimeout(done, ms));
let phase = 'startup';

async function freePort() {
  const server = createNetServer();
  await new Promise((done, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', done); });
  const port = server.address().port; await new Promise(done => server.close(done)); return port;
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
      response.setHeader('Cache-Control', 'no-store'); createReadStream(file).pipe(response);
    } catch (_) { response.writeHead(404).end(); }
  });
}
async function waitForHealth(origin, child, diagnostics) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Board server exited: ' + diagnostics());
    try { if ((await fetch(origin + '/health', { signal: AbortSignal.timeout(1000) })).ok) return; } catch (_) {}
    await wait(100);
  }
  throw new Error('Board server health timed out: ' + diagnostics());
}
async function newSession(browser, origin, backend, tag, failures) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const values = Object.fromEntries([...PERSONAL_KEYS.map(key => [key, JSON.stringify({ privateFixture: tag + ':' + key })]), [SENTINEL, 'untouched:' + tag]]);
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if ([origin, backend].includes(url.origin) || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
    failures.push(tag + ': external request ' + url.origin + url.pathname); return route.abort();
  });
  await context.addInitScript(({ origin, values, keys, sentinel, wrapper }) => {
    if (location.origin !== origin) return;
    if (!localStorage.getItem(sentinel + '.seeded')) {
      for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
      localStorage.setItem(sentinel + '.seeded', '1');
    }
    if (location.pathname === wrapper) {
      window.__v5StorageReads = 0; window.__v5StorageWrites = 0;
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
      Storage.prototype.getItem = function (key) {
        if (keys.includes(key)) { window.__v5StorageReads++; throw new Error('Shared Vilenkin frame read personal storage'); }
        return get.call(this, key);
      };
      Storage.prototype.setItem = function (key, value) {
        if (keys.includes(key)) { window.__v5StorageWrites++; throw new Error('Shared Vilenkin frame wrote personal storage'); }
        return set.call(this, key, value);
      };
    }
    if (window === window.top) {
      window.__v5Publications = 0;
      addEventListener('message', event => {
        if (event.source === document.querySelector('#trainerFrame')?.contentWindow && event.data?.type === 'mathexam:trainer-state') window.__v5Publications++;
      });
    }
  }, { origin, values, keys: PERSONAL_KEYS, sentinel: SENTINEL, wrapper: WRAPPER });
  const page = await context.newPage(); page.setDefaultTimeout(10000); page.setDefaultNavigationTimeout(20000);
  page.on('pageerror', error => failures.push(tag + ': ' + error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname === '127.0.0.1' && response.status() >= 400) failures.push(tag + ': HTTP ' + response.status() + ' ' + url.pathname);
  });
  return { context, page, tag, values };
}
async function waitConnected(page) {
  await page.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено' &&
    document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected', null, { polling: 50, timeout: 15000 });
}
async function frameFor(page) {
  await page.waitForFunction(wrapper => document.querySelector('#trainerFrame')?.src.includes(wrapper), WRAPPER);
  let frame; const deadline = Date.now() + 10000;
  while (!frame && Date.now() < deadline) { frame = page.frames().find(item => item.url().includes(WRAPPER)); if (!frame) await wait(25); }
  assert(frame, 'the actual registered wrapper is loaded');
  await frame.waitForFunction(() => ['getState', 'applyState', 'validateState'].every(key => typeof window.__vilenkin5Board?.[key] === 'function'));
  await frame.evaluate(() => {
    if (window.__v5Applied !== undefined) return; window.__v5Applied = 0;
    addEventListener('message', event => { if (event.source === parent && ['mathexam:hydrate', 'mathexam:apply-trainer-state'].includes(event.data?.type)) window.__v5Applied++; });
  });
  return frame;
}
const snapshot = frame => frame.evaluate(() => window.__vilenkin5Board.getState());
const publications = page => page.evaluate(() => window.__v5Publications);
function rendered(frame) {
  return frame.evaluate(() => {
    const one = selector => document.querySelector(selector), text = selector => one(selector)?.textContent.replace(/\s+/g, ' ').trim() || '';
    return {
      route: location.hash, title: text('#main h1'), question: text('#task-panel .question'),
      fields: [...document.querySelectorAll('#main input,#main select,#main textarea')].map(element => ({
        tag: element.tagName, type: element.type, value: element.value, checked: element.type === 'radio' || element.type === 'checkbox' ? element.checked : null
      })),
      task: text('#task-panel'), model: text('#model'), notes: text('.v5q-notes'),
      details: [...document.querySelectorAll('#main details')].map(element => element.open),
      modelSVG: [...document.querySelectorAll('#model svg')].map(element => element.outerHTML),
      currentMode: [...document.querySelectorAll('.v5q-mode')].map(element => element.getAttribute('aria-pressed')),
      claim: text('#claim-feedback'), course: !one('#answer-form') ? text('#main') : ''
    };
  });
}
async function same(controller, observer, label) {
  const expected = await snapshot(controller);
  assert.equal(await controller.evaluate(value => window.__vilenkin5Board.validateState(value), expected), true, label + ': semantic validation');
  assert(Buffer.byteLength(JSON.stringify(expected)) <= 60 * 1024);
  try {
    await observer.waitForFunction(value => {
      const stable = item => Array.isArray(item) ? item.map(stable) : item && typeof item === 'object' ? Object.fromEntries(Object.keys(item).sort().map(key => [key, stable(item[key])])) : item;
      return JSON.stringify(stable(window.__vilenkin5Board.getState())) === JSON.stringify(stable(value));
    }, expected, { polling: 50 });
  } catch (error) { assert.deepEqual(await snapshot(observer), expected, label + ': remote state'); throw error; }
  assert.deepEqual(await rendered(observer), await rendered(controller), label + ': independent DOM');
  return expected;
}
async function quiet(pages, label) {
  let previous = await Promise.all(pages.map(publications)), changed = Date.now(); const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    await wait(100); const current = await Promise.all(pages.map(publications));
    if (current.some((n, i) => n !== previous[i])) changed = Date.now();
    else if (Date.now() - changed >= 400) return current;
    previous = current;
  }
  throw new Error(label + ': bridge publications did not settle');
}
async function ownership(teacher, student, studentControls) {
  const previous = studentControls ? teacher : student, next = studentControls ? student : teacher;
  const oldFrame = await frameFor(previous), nextFrame = await frameFor(next), before = await snapshot(oldFrame);
  const sent = await publications(next), applied = await oldFrame.evaluate(() => window.__v5Applied);
  await teacher.locator('#openShare').click(); await teacher.locator('#controlToggle').click();
  await student.waitForFunction(expected => document.body.classList.contains('control-owner') === expected, studentControls);
  await teacher.waitForFunction(expected => document.body.classList.contains('control-owner') !== expected, studentControls);
  assert.equal(await student.locator('#trainerFrame').evaluate(element => getComputedStyle(element).pointerEvents === 'none'), !studentControls);
  await next.waitForFunction(count => window.__v5Publications > count, sent);
  await oldFrame.waitForFunction(count => window.__v5Applied > count, applied);
  assert.deepEqual(await snapshot(nextFrame), before, 'control handoff retains current work');
  await same(nextFrame, oldFrame, 'control handoff');
  await teacher.locator('#sharePanel [data-close-panel]').click();
}
async function lesson(frame, id) {
  const point = await frame.evaluate(id => WorkshopCurriculum.byId[id].point, id);
  await frame.locator('a[href="#course/vilenkin5"]').first().click();
  await frame.locator('.v5-unit-card[href="#v5-unit/' + point + '"]').click();
  await frame.locator('[data-cmd="learn"][data-value="' + id + '"]').click();
  await frame.locator('#answer-form').waitFor();
}
async function expectedAnswer(frame) {
  return frame.evaluate(() => {
    const scene = __vilenkin5Board.getState().scene, task = WorkshopMath.generate(scene.id, scene.seed);
    const q = scene.mode === 'learn' ? [...task.steps, task][scene.step] : task;
    const fmt = x => Array.isArray(x) ? x.map(fmt).join(';') : typeof x === 'object' ? WorkshopMath.fmt(x) : String(x);
    if (q.answerFormat === 'decimal') return String(typeof q.answer === 'object' ? q.answer.n / q.answer.d : q.answer).replace('.', ',');
    if (q.answerFormat === 'prime-factors') return q.answer.join(' · ');
    return fmt(q.answer);
  });
}
async function solve(frame) { await frame.locator('#answer').fill(await expectedAnswer(frame)); await frame.locator('#answer-form button[type="submit"]').click(); }
const inkState = page => page.evaluate(() => {
  const value = publicSnapshot();
  for (const sheet of value.pages) sheet.strokes = sheet.strokes.map(stroke => { const copy = { ...stroke }; delete copy.createdAt; return copy; });
  return value;
});
async function sameInk(source, observer) {
  const expected = await inkState(source);
  await observer.waitForFunction(value => {
    const actual = publicSnapshot();
    for (const sheet of actual.pages) sheet.strokes = sheet.strokes.map(stroke => { const copy = { ...stroke }; delete copy.createdAt; return copy; });
    return JSON.stringify(actual) === JSON.stringify(value);
  }, expected, { polling: 25 });
  assert.deepEqual(await inkState(observer), expected, 'actual handwritten geometry and authors synchronize');
}
async function draw(page, observer, offset = 0) {
  const before = await inkState(page), index = before.currentPage, count = before.pages[index].strokes.length;
  await page.locator('[data-tool="pen"]').click(); await page.locator('#canvas').scrollIntoViewIfNeeded();
  const box = await page.locator('#canvas').boundingBox(); assert(box && box.width > 200 && box.height > 180);
  await page.mouse.move(box.x + 35, box.y + 45 + offset); await page.mouse.down();
  await page.mouse.move(box.x + 170, box.y + 80 + offset, { steps: 8 }); await page.mouse.up();
  await page.waitForFunction(({ index, count }) => publicSnapshot().pages[index].strokes.length === count + 1, { index, count });
  assert((await inkState(page)).pages[index].strokes.at(-1).objectId); await sameInk(page, observer);
}
async function narrow(page, frame, name) {
  await page.setViewportSize({ width: 320, height: 900 });
  const size = await frame.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  assert(size.width <= 320 && size.scroll <= size.width + 1, name + ': no horizontal overflow at 320 px');
  if (process.env.VILENKIN5_BOARD_SHOTS) { mkdirSync(process.env.VILENKIN5_BOARD_SHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.VILENKIN5_BOARD_SHOTS, name + '.png'), fullPage: true }); }
  await page.setViewportSize({ width: 1440, height: 1000 });
}

async function run(browser, origin, backend, failures) {
  phase = 'registered trainer, real room and hydration';
  const teacherSession = await newSession(browser, origin, backend, 'teacher', failures), studentSession = await newSession(browser, origin, backend, 'student', failures);
  const teacher = teacherSession.page, student = studentSession.page;
  await teacher.goto(origin + '/trainers/trainer-board.html?server=' + encodeURIComponent(backend), { waitUntil: 'domcontentloaded' });
  await teacher.locator('#openShare').click(); await teacher.locator('#createRoom').click();
  await teacher.waitForFunction(() => document.querySelector('#shareStatus')?.textContent === 'подключено' && document.querySelector('#studentLink')?.value.includes('role=student'));
  const studentLink = await teacher.locator('#studentLink').inputValue(); await teacher.locator('#sharePanel [data-close-panel]').click();
  await student.goto(studentLink, { waitUntil: 'domcontentloaded' });
  await teacher.locator('#chooseTrainer').click(); await teacher.locator('#pickerSearch').fill('vilenkin5');
  await teacher.locator('#pickerResults .picker-item').filter({ hasText: 'Виленкин · 5 класс · весь курс и общая доска' }).click();
  await Promise.all([waitConnected(teacher), waitConnected(student)]);
  let teacherFrame = await frameFor(teacher), studentFrame = await frameFor(student);
  const initial = await same(teacherFrame, studentFrame, 'neutral shared course'); assert.equal(initial.scene, null);
  assert.equal(await teacherFrame.locator('.v5-unit-card').count(), 53); await narrow(teacher, teacherFrame, 'course');
  const baseline = await quiet([teacher, student], 'initial quiet');

  phase = 'long-division task, incomplete drafts, hints, accepted steps and notes';
  await lesson(teacherFrame, 'v5f-division-column');
  await teacherFrame.locator('#answer-form button[type="submit"]').click(); await same(teacherFrame, studentFrame, 'empty answer explanation');
  await teacherFrame.locator('#answer').fill('1/'); await teacherFrame.locator('#answer-form button[type="submit"]').click();
  await same(teacherFrame, studentFrame, 'unfinished numeric draft');
  await teacherFrame.locator('#answer').fill('999999'); await teacherFrame.locator('#answer-form button[type="submit"]').click();
  await teacherFrame.locator('[data-cmd="hint"]').click(); await same(teacherFrame, studentFrame, 'first mathematical mistake and requested hint');
  await solve(teacherFrame); const accepted = await same(teacherFrame, studentFrame, 'accepted shared intermediate answer');
  assert.equal(accepted.scene.assisted, true); assert.equal(accepted.scene.firstAttempt.assisted, true);
  await teacherFrame.locator('[data-cmd="next"]').click(); await same(teacherFrame, studentFrame, 'next step retains prior answer');
  await teacherFrame.locator('.v5q-notes > details > summary').click();
  await teacherFrame.waitForFunction(() => document.querySelector('.v5q-notes > details')?.open && window.__vilenkin5Board.getState().scene?.panels.notes === true);
  await teacherFrame.locator('#v5-quality-note').fill('Нуль в частном сохраняет разряд. Проверим умножением.');
  const beforeMedia = await same(teacherFrame, studentFrame, 'open notebook and reasoning');
  await teacherFrame.locator('.v5-media > summary').click();
  await teacherFrame.waitForFunction(() => document.querySelector('.v5-media')?.open && window.__vilenkin5Board.getState().scene?.media.open === true);
  const gif = teacherFrame.locator('[data-v5-gif-toggle]'); await gif.click();
  await teacherFrame.waitForFunction(() => window.__vilenkin5Board.getState().scene?.media.playing === true);
  const playing = await same(teacherFrame, studentFrame, 'shared GIF playing');
  assert.equal(playing.scene.media.id, 'u13'); assert.equal(playing.scene.media.open, true); assert.equal(playing.scene.media.playing, true);
  assert.deepEqual(playing.scene.model, beforeMedia.scene.model); assert.equal(playing.scene.savedInput, beforeMedia.scene.savedInput);
  assert.equal(playing.scene.note, beforeMedia.scene.note, 'opening the animation preserves written reasoning');
  await gif.click();
  await teacherFrame.waitForFunction(() => window.__vilenkin5Board.getState().scene?.media.playing === false);
  assert.equal((await same(teacherFrame, studentFrame, 'shared GIF stopped')).scene.media.playing, false);
  const modelAnswer = await teacherFrame.evaluate(() => {
    const scene = __vilenkin5Board.getState().scene, d = Vilenkin5QualityModels.descriptor(WorkshopCurriculum.byId[scene.id]);
    return ArithmeticPractice.generate(d.skill, scene.model.level, scene.model.seed).steps[scene.model.step].answer;
  });
  await teacherFrame.locator('[data-v5-prediction]').fill(modelAnswer); await teacherFrame.locator('[data-v5-predict] button').click();
  const division = await same(teacherFrame, studentFrame, 'long-division investigation writes a real digit'); assert.equal(division.scene.model.step, 1);
  await narrow(teacher, teacherFrame, 'division'); await draw(teacher, student);
  const teacherWork = await quiet([teacher, student], 'teacher work quiet'); assert(teacherWork[0] > baseline[0]); assert.equal(teacherWork[1], baseline[1], 'observer does not echo');

  phase = 'model hydration, control handoff and reload';
  await student.reload({ waitUntil: 'domcontentloaded' }); await waitConnected(student); studentFrame = await frameFor(student);
  await same(teacherFrame, studentFrame, 'student reload'); await sameInk(teacher, student);
  await ownership(teacher, student, true); await quiet([teacher, student], 'student owns control'); const observerCount = await publications(teacher);
  const nextModelAnswer = await studentFrame.evaluate(() => {
    const scene = __vilenkin5Board.getState().scene, d = Vilenkin5QualityModels.descriptor(WorkshopCurriculum.byId[scene.id]);
    return ArithmeticPractice.generate(d.skill, scene.model.level, scene.model.seed).steps[scene.model.step].answer;
  });
  await studentFrame.locator('[data-v5-prediction]').fill(nextModelAnswer); await studentFrame.locator('[data-v5-predict] button').click();
  const continued = await same(studentFrame, teacherFrame, 'student continues restored model closure'); assert.equal(continued.scene.model.step, 2);
  await studentFrame.locator('#answer').fill('7/'); await same(studentFrame, teacherFrame, 'student edits current answer'); await draw(student, teacher, 50);
  await quiet([teacher, student], 'student work quiet'); assert.equal(await publications(teacher), observerCount, 'teacher observer does not echo');
  await teacher.reload({ waitUntil: 'domcontentloaded' }); await waitConnected(teacher); teacherFrame = await frameFor(teacher);
  await same(studentFrame, teacherFrame, 'teacher reload while student controls'); await sameInk(student, teacher); await ownership(teacher, student, false);

  phase = 'second-part fraction model and fresh practice/check scenes';
  await lesson(teacherFrame, 'v5f-fraction-add');
  await teacherFrame.locator('[data-v5-param="an"]').fill('3'); await teacherFrame.locator('[data-v5-param="an"]').press('Tab');
  const fraction = await same(teacherFrame, studentFrame, 'fraction strip control'); assert.equal(fraction.scene.model.an, 3);
  await teacherFrame.locator('[data-v5-prediction]').fill('1/'); await same(teacherFrame, studentFrame, 'fraction model prediction draft');
  await teacherFrame.locator('[data-cmd="mode"][data-value="practice"]').click(); await same(teacherFrame, studentFrame, 'fresh practice mode');
  await solve(teacherFrame); const practiced = await same(teacherFrame, studentFrame, 'joint practice completion'); assert.equal(practiced.scene.assisted, true);
  await teacherFrame.locator('[data-cmd="mode"][data-value="check"]').click();
  const check = await same(teacherFrame, studentFrame, 'new shared check condition'); assert.notEqual(check.scene.seed, practiced.scene.seed);
  for (let i = 0; i < 2; i++) {
    await solve(teacherFrame); const current = await same(teacherFrame, studentFrame, 'shared check answer ' + i);
    assert.equal(current.scene.checkIndex, i); assert.equal(current.scene.assisted, true);
    await teacherFrame.locator('[data-cmd="next"]').click(); await same(teacherFrame, studentFrame, 'shared check next ' + i);
  }

  phase = 'final project, floor cutout and whole packages';
  await lesson(teacherFrame, 'v5f-project-room');
  await same(teacherFrame, studentFrame, 'floor plan before making a prediction');
  const forecast = '#model .g5-lab-inquiry';
  assert(await studentFrame.locator('#model .g5-lab-visual').isVisible());
  await teacherFrame.locator(forecast + ' input').fill('27');
  await teacherFrame.locator(forecast + ' button[type="submit"]').click();
  const tooFew = await same(teacherFrame, studentFrame, 'insufficient coverage explained');
  assert.equal(tooFew.scene.model.inquiryFirst, '27'); assert.equal(tooFew.scene.attempt, 0);
  assert.match(await studentFrame.locator(forecast + ' [role=status]').innerText(), /не хватит/);
  assert(!/28 уп\./.test(await studentFrame.locator(forecast+' [role=status]').innerText()));assert.equal(tooFew.scene.model.inquirySeen,0);
  await ownership(teacher, student, true);
  assert.equal(await studentFrame.locator(forecast+' input').isEnabled(),true);
  await studentFrame.locator(forecast+' input').fill('28');await studentFrame.locator(forecast+' button[type=submit]').click();
  const sameFloor=await same(studentFrame,teacherFrame,'independent correction of the same floor');assert.equal(sameFloor.scene.model.inquiryFirst,'27');assert.equal(sameFloor.scene.model.inquiryDraft,'28');assert.equal(sameFloor.scene.attempt,0);
  assert.match(await teacherFrame.locator(forecast+' [role=status]').innerText(),/сам исправил/);
  await studentFrame.locator('#g5-lab-garden-2').press('ArrowRight');
  const adjusted = await same(studentFrame, teacherFrame, 'larger stove and new forecast');
  assert.equal(adjusted.scene.model.p, 3); assert.equal(adjusted.scene.model.inquiryFirst, '');
  await studentFrame.locator(forecast + ' input').fill('26');
  await studentFrame.locator(forecast + ' button[type="submit"]').click();
  await same(studentFrame, teacherFrame, 'pupil solves revised purchase');
  assert.match(await teacherFrame.locator(forecast + ' [role=status]').innerText(), /Прогноз подтвердился/);
  await ownership(teacher, student, false);

  phase = 'tank dimensions and a fractional litre';
  await lesson(teacherFrame, 'v5f-volume-litres');
  await same(teacherFrame, studentFrame, 'tank diagram before predicting');
  assert.equal(await studentFrame.locator('#model .g5-lab-visual svg').count(), 2);
  await teacherFrame.locator('#g5-lab-volume-2').press('ArrowLeft');
  const lower = await same(teacherFrame, studentFrame, 'three five-centimetre layers');
  assert.equal(lower.scene.model.h, 3);
  await teacherFrame.locator(forecast+' input').fill('22500');await teacherFrame.locator(forecast+' button[type=submit]').click();
  const cubicOnly=await same(teacherFrame,studentFrame,'cubic centimetres remain editable');
  assert.equal(cubicOnly.scene.model.inquirySeen,0);assert.match(await studentFrame.locator(forecast+' [role=status]').innerText(),/кубических сантиметрах/);
  assert(!/22,5 л/.test(await studentFrame.locator(forecast+' [role=status]').innerText()));
  await teacherFrame.locator(forecast + ' input').fill('22,5');
  await teacherFrame.locator(forecast + ' button[type="submit"]').click();
  await same(teacherFrame, studentFrame, 'fractional capacity checked in litres');
  assert.match(await studentFrame.locator(forecast + ' [role=status]').innerText(), /22,5 л/);

  phase = 'both-part route coverage, late join and shared handwritten board';
  for (const id of ['v5f-table-read', 'v5f-place-build', 'v5f-remainder-find', 'v5f-area-grid', 'v5f-fraction-parts', 'v5f-decimal-divide', 'v5f-angle-build']) {
    await lesson(teacherFrame, id); await same(teacherFrame, studentFrame, id);
  }
  await teacherFrame.locator('[data-v5-param="angle"]').fill('65'); await teacherFrame.locator('[data-v5-param="angle"]').press('Tab');
  const angle = await same(teacherFrame, studentFrame, 'protractor control'); assert.equal(angle.scene.model.angle, 65); await narrow(teacher, teacherFrame, 'angle');
  const lateSession = await newSession(browser, origin, backend, 'late', failures); await lateSession.page.goto(studentLink, { waitUntil: 'domcontentloaded' });
  await waitConnected(lateSession.page); const lateFrame = await frameFor(lateSession.page);
  await same(teacherFrame, lateFrame, 'late join current scene'); await sameInk(teacher, lateSession.page);
  await teacherFrame.locator('[data-v5-param="angle"]').fill('80'); await teacherFrame.locator('[data-v5-param="angle"]').press('Tab');
  await same(teacherFrame, lateFrame, 'late participant follows model'); await same(teacherFrame, studentFrame, 'existing participant follows model');
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click(); await same(teacherFrame, studentFrame, 'neutral course after solved scenes'); await same(teacherFrame, lateFrame, 'late neutral course');

  phase = 'atomic rejection, quiet state and private storage invariants';
  const before = await snapshot(teacherFrame), beforeDOM = await rendered(teacherFrame);
  assert.equal(await teacherFrame.evaluate(() => {
    const bad = structuredClone(__vilenkin5Board.getState()); bad.route = '#lesson/v6f-fraction-add';
    try { return __vilenkin5Board.applyState(bad) === false; } catch (_) { return true; }
  }), true);
  assert.deepEqual(await snapshot(teacherFrame), before); assert.deepEqual(await rendered(teacherFrame), beforeDOM);
  const counts = await quiet([teacher, student, lateSession.page], 'final quiet'); await wait(500);
  assert.deepEqual(await Promise.all([teacher, student, lateSession.page].map(publications)), counts);
  for (const [session, frame] of [[teacherSession, teacherFrame], [studentSession, studentFrame], [lateSession, lateFrame]]) {
    assert.deepEqual(await session.page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), [...PERSONAL_KEYS, SENTINEL]), session.values);
    assert.deepEqual(await frame.evaluate(() => [window.__v5StorageReads, window.__v5StorageWrites]), [0, 0]);
  }
  assert.deepEqual(failures, [], 'no browser errors, external traffic or failed local resources');
  console.log('VILENKIN5_BOARD_BROWSER_OK: real registry/bridge/server; long division, drafts, mistakes, steps, notebook, GIF, fractions, angles; fresh practice/shared check; teacher/student reload; ownership; late join; handwritten strokes; neutral course; no echo; private storage untouched; 320px layouts');
}

(async () => {
  const server = staticServer(); let browser, child, watchdog, serverErrors = '';
  try {
    await new Promise((done, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', done); });
    const origin = 'http://127.0.0.1:' + server.address().port, port = await freePort(), backend = 'http://127.0.0.1:' + port;
    const env = { ...process.env, HOST: '127.0.0.1', PORT: String(port), NODE_ENV: 'test', CORS_ALLOWED_ORIGINS: origin };
    for (const key of Object.keys(env)) if (/^(LEARNING_|PROGRESS_|GROUP_LESSON_)/.test(key)) delete env[key]; delete env.TRAINER_REGISTRY_PATH;
    child = spawn(process.execPath, ['index.js'], { cwd: join(ROOT, 'board-server'), env, stdio: ['ignore', 'ignore', 'pipe'] });
    child.stderr.on('data', chunk => { serverErrors = (serverErrors + String(chunk)).slice(-4000); }); await waitForHealth(backend, child, () => serverErrors);
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'], timeout: 15000 });
    await Promise.race([run(browser, origin, backend, []), new Promise((_, fail) => { watchdog = setTimeout(() => fail(new Error('Browser gate exceeded 240 seconds at ' + phase)), 240000); })]);
  } finally {
    clearTimeout(watchdog); await browser?.close(); if (child && child.exitCode === null) child.kill('SIGTERM'); await new Promise(done => server.close(done));
  }
})().catch(error => { console.error('VILENKIN5_BOARD_BROWSER_FAILED at ' + phase + '\n' + (error.stack || error)); process.exitCode = 1; });
