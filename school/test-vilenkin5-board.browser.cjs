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
  // A native details element opens immediately. Its toggle event saves the shared scene on the next task.
  await controller.waitForFunction(() => {
    const panel = document.querySelector('#v5-quality-note')?.closest('details');
    return !panel || window.__vilenkin5Board.getState().scene?.panels.notes === panel.open;
  });
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
async function printedLabelsFit(frame, name) {
  const problems = await frame.locator('.v5q-model svg.v5q-printed-geometry').evaluateAll(figures => {
    const issues = [];
    for (const svg of figures) {
      const view = svg.viewBox.baseVal;
      const labels = Array.from(svg.querySelectorAll('text'), text => {
        const box = text.getBBox(), matrix = svg.getScreenCTM().inverse().multiply(text.getScreenCTM());
        const a = new DOMPoint(box.x, box.y).matrixTransform(matrix);
        const b = new DOMPoint(box.x + box.width, box.y + box.height).matrixTransform(matrix);
        return { left: a.x, top: a.y, right: b.x, bottom: b.y, name: text.textContent };
      });
      for (const [index, label] of labels.entries()) {
        if (label.left < -1 || label.top < -1 || label.right > view.width + 1 || label.bottom > view.height + 1) issues.push(label.name + ' clipped');
        for (const other of labels.slice(index + 1)) {
          const width = Math.min(label.right, other.right) - Math.max(label.left, other.left);
          const height = Math.min(label.bottom, other.bottom) - Math.max(label.top, other.top);
          if (width > 1.5 && height > 2) issues.push(label.name + ' overlaps ' + other.name);
        }
      }
    }
    return issues;
  });
  assert.deepEqual(problems, [], name + ': each label has its own space');
}
async function narrow(page, frame, name) {
  await page.setViewportSize({ width: 320, height: 900 });
  const size = await frame.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  assert(size.width <= 320 && size.scroll <= size.width + 1, name + ': no horizontal overflow at 320 px');
  await printedLabelsFit(frame,name);
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
  await ownership(teacher, student, true);
  await studentFrame.locator('#g5-lab-garden-2').press('ArrowRight');
  const adjusted = await same(studentFrame, teacherFrame, 'larger stove and new forecast');
  assert.equal(adjusted.scene.model.p, 3); assert.equal(adjusted.scene.model.inquiryFirst, '');
  await studentFrame.locator(forecast + ' input').fill('26');
  await studentFrame.locator(forecast + ' button[type="submit"]').click();
  await same(studentFrame, teacherFrame, 'pupil solves revised purchase');
  assert.match(await teacherFrame.locator(forecast + ' [role=status]').innerText(), /Прогноз подтвердился/);
  await ownership(teacher, student, false);

  phase = 'numbered reading survey: table, source rows, handoff and reload';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await teacherFrame.locator('.v5-hero').waitFor();
  await same(teacherFrame,studentFrame,'return to course before selecting the printed number');
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-2"]').click();
  await teacherFrame.waitForFunction(()=>window.__vilenkin5Board.getState().scene?.id==='v5f-printed-1-2');
  await studentFrame.locator('h1').filter({hasText:'№1.2'}).waitFor();
  await same(teacherFrame,studentFrame,'source exercise 1.2 opens for both participants');
  await teacherFrame.locator('#answer').fill('4;4');
  await teacherFrame.locator('#answer-form button').click();
  const frequencyError=await same(teacherFrame,studentFrame,'frequency versus books');
  assert.equal(frequencyError.scene.firstWrong.value,'4;4');
  assert.match(await studentFrame.locator('.feedback').innerText(),/умножь частоту/);
  await solve(teacherFrame);await teacherFrame.locator('[data-cmd=next]').click();
  assert.equal((await same(teacherFrame,studentFrame,'first verified table row')).scene.step,1);
  assert.match(await studentFrame.locator('#task-panel table').nth(1).locator('tbody tr').first().innerText(),/3\s+4\s+12/);
  await ownership(teacher,student,true);
  await studentFrame.locator('[data-v5-param=group]').selectOption({value:'5'});
  await studentFrame.locator('#answer').fill('7;');
  assert.equal((await same(studentFrame,teacherFrame,'student marks all eights')).scene.model.group,5);
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const printedReload=await same(studentFrame,teacherFrame,'source exercise survives teacher reload');
  assert.equal(printedReload.scene.savedInput,'7;');assert.equal(printedReload.scene.answers[0],'4;12');
  await narrow(teacher,teacherFrame,'printed-survey');
  await ownership(teacher,student,false);

  phase = 'choice of schedule and an open addition table';
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-3"]').click();
  await studentFrame.locator('h1').filter({hasText:'№1.3'}).waitFor();
  await same(teacherFrame,studentFrame,'three days and three club choices');
  await ownership(teacher,student,true);
  for(const [key,n] of [['day0',3],['day1',1],['day2',2]])await studentFrame.locator('[data-v5-param='+key+']').selectOption({value:String(n)});
  const planned=await same(studentFrame,teacherFrame,'second valid schedule is shared');
  assert.deepEqual([planned.scene.model.day0,planned.scene.model.day1,planned.scene.model.day2],[3,1,2]);
  await studentFrame.locator('[data-v5-prediction]').fill('3');await studentFrame.locator('[data-v5-predict] button').click();
  await same(studentFrame,teacherFrame,'pupil tests three different clubs');
  assert.match(await teacherFrame.locator('.v5q-model-feedback').innerText(),/подтвердился/);
  await ownership(teacher,student,false);
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-4"]').click();
  await studentFrame.locator('h1').filter({hasText:'№1.4'}).waitFor();
  for(let i=0;i<4;i++){await solve(teacherFrame);await teacherFrame.locator('[data-cmd=next]').click();await same(teacherFrame,studentFrame,'determined sum cell '+i);}
  await teacherFrame.locator('#answer').fill('50;13;63');await teacherFrame.locator('#answer-form button').click();
  const ownSum=await same(teacherFrame,studentFrame,'noncanonical valid source table row');
  assert.equal(ownSum.scene.correct,true);assert.equal(ownSum.scene.answers[4],'50;13;63');
  assert.match(await studentFrame.locator('#task-panel table tbody tr').nth(4).innerText(),/5\s+50\s+13\s+63/);

  phase = 'numbered transport table and hour-by-hour model';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await teacherFrame.locator('.v5-hero').waitFor();await same(teacherFrame,studentFrame,'course before transport');
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-7"]').click();await studentFrame.locator('h1').filter({hasText:'№1.7'}).waitFor();
  await same(teacherFrame,studentFrame,'source transport table');
  await teacherFrame.locator('#answer').fill('17');await teacherFrame.locator('#answer-form button').click();
  const transportMistake=await same(teacherFrame,studentFrame,'different units are not added');assert.equal(transportMistake.scene.firstWrong.value,'17');
  await solve(teacherFrame);await teacherFrame.locator('[data-cmd=next]').click();await same(teacherFrame,studentFrame,'bicycle distance filled');
  await ownership(teacher,student,true);
  await studentFrame.locator('[data-v5-param=vehicle]').selectOption({value:'1'});
  await studentFrame.locator('[data-v5-param=hours]').fill('5');await studentFrame.locator('[data-v5-param=hours]').press('Tab');
  await studentFrame.locator('[data-v5-param=rate]').fill('70');await studentFrame.locator('[data-v5-param=rate]').press('Tab');
  const moving=await same(studentFrame,teacherFrame,'car model travels five hours at seventy');assert.equal(moving.scene.model.hours,5);assert.equal(moving.scene.model.rate,70);
  await studentFrame.locator('[data-v5-prediction]').fill('350');await studentFrame.locator('[data-v5-predict] button').click();
  await same(studentFrame,teacherFrame,'model meets the source target');assert.match(await teacherFrame.locator('.v5q-model-why').innerText(),/совпала/);
  await narrow(student,studentFrame,'numbered-travel');await ownership(teacher,student,false);

  phase = 'own weather observations, saved draft and two roles';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-8"]').click();await studentFrame.locator('h1').filter({hasText:'№1.8'}).waitFor();
  await same(teacherFrame,studentFrame,'new empty personal weather diary');
  await teacherFrame.locator('[data-v5-weather-sky]').selectOption('2');await teacherFrame.locator('[data-v5-weather-rain]').check();
  await teacherFrame.locator('[data-v5-weather-temp]').fill('9,5');await teacherFrame.locator('[data-v5-weather-form] button').click();
  const firstDay=await same(teacherFrame,studentFrame,'rain and cold observed together');assert(firstDay.scene.model.daya>0);assert.equal(firstDay.scene.correct,false);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-weather-day]').selectOption('2');
  await studentFrame.locator('[data-v5-weather-sky]').selectOption('1');await studentFrame.locator('[data-v5-weather-temp]').fill('10');
  const newDay=await same(studentFrame,teacherFrame,'second day unsaved temperature');assert.equal(newDay.scene.model.temp,'10');assert.equal(newDay.scene.model.dayb,0);
  await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);
  await teacher.waitForFunction(()=>document.body.classList.contains('control-owner'));
  await student.waitForFunction(()=>!document.body.classList.contains('control-owner'));
  await same(teacherFrame,studentFrame,'pupil reload returns control to teacher and retains both weather entries');
  await ownership(teacher,student,true);
  await studentFrame.locator('[data-v5-weather-form] button').click();const written=await same(studentFrame,teacherFrame,'pupil saves threshold day');assert.equal(written.scene.model.dayb,6603);
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  await same(studentFrame,teacherFrame,'teacher reloads filled diary');assert.match(await teacherFrame.locator('#model').innerText(),/2 из 15/);
  await narrow(student,studentFrame,'weather-diary');await ownership(teacher,student,false);
  phase = 'printed frequency table, two counting conventions and working together';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-10"]').click();await studentFrame.locator('h1').filter({hasText:'№1.10'}).waitFor();
  await teacherFrame.locator('#answer').fill('31');await teacherFrame.locator('#answer-form button').click();
  const quote=await same(teacherFrame,studentFrame,'proper frequency from another counting convention');
  assert.match(quote.scene.message,/цитаты/);assert.equal(quote.scene.attempt,0);
  await teacherFrame.locator('#answer').fill('34');await teacherFrame.locator('#answer-form button').click();await teacherFrame.locator('[data-cmd=next]').click();
  await same(teacherFrame,studentFrame,'the first full-text frequency is recorded');await ownership(teacher,student,true);
  await studentFrame.locator('[data-v5-param=letter]').selectOption('3');
  await studentFrame.locator('[data-v5-param=parts]').fill('6');await studentFrame.locator('[data-v5-param=parts]').press('Tab');
  await studentFrame.locator('[data-v5-prediction]').fill('4');await studentFrame.locator('[data-v5-predict] button').click();
  const parts=await same(studentFrame,teacherFrame,'all six chunks for the letter sh');assert.equal(parts.scene.model.parts,6);assert.equal(parts.scene.model.letter,3);assert.equal(parts.scene.model.seen,true);
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  await same(studentFrame,teacherFrame,'letter study keeps source answer and model after reload');
  await narrow(student,studentFrame,'frequencies-six-text-parts');await ownership(teacher,student,false);

  phase = 'reading zero and seven in place value';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('.v5-unit-card[href="#v5-unit/2"]').click();await teacherFrame.locator('a[href="#lesson/v5f-printed-1-14"]').click();
  await studentFrame.locator('h1').filter({hasText:'№1.14'}).waitFor();
  await teacherFrame.locator('#answer').fill('27');await teacherFrame.locator('#answer-form button').click();
  const readFormat=await same(teacherFrame,studentFrame,'spoken form requested without an error');assert.equal(readFormat.scene.attempt,0);
  await teacherFrame.locator('#answer').fill('двадцать семь');await teacherFrame.locator('#answer-form button').click();
  await teacherFrame.locator('[data-cmd=next]').click();await same(teacherFrame,studentFrame,'spoken form accepted then digit places');
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=row]').selectOption({value:'8'});await studentFrame.locator('[data-v5-param=place]').selectOption({value:'5'});
  await studentFrame.locator('[data-v5-prediction]').fill('300000');await studentFrame.locator('[data-v5-predict] button').click();
  const digits=await same(studentFrame,teacherFrame,'three hundred thousands in printed 300007');assert.equal(digits.scene.model.row,8);assert.equal(digits.scene.model.place,5);assert(digits.scene.model.seen);
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);await same(studentFrame,teacherFrame,'printed numeral and place value restored');
  await narrow(student,studentFrame,'reading-and-place-value');await ownership(teacher,student,false);

  phase = 'preserving every digit while grouping thousands';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-17"]').click();await studentFrame.locator('h1').filter({hasText:'№1.17'}).waitFor();
  await teacherFrame.locator('#answer').fill('30 42');await teacherFrame.locator('#answer-form button').click();
  const prior=await same(teacherFrame,studentFrame,'right digits, wrong boundary');assert.match(prior.scene.message,/Цифры сохранены/);
  await ownership(teacher,student,true);await studentFrame.locator('#answer').fill('3 | 042');await studentFrame.locator('#answer-form button').click();
  const corrected=await same(studentFrame,teacherFrame,'student corrects the class after the teacher');assert(corrected.scene.correct);assert.equal(corrected.scene.answers[0],'3 | 042');
  assert.deepEqual(corrected.scene.hintLevels,{});
  await ownership(teacher,student,false);

  phase = 'strictly between two numbers on an open interval';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-22"]').click();await studentFrame.locator('h1').filter({hasText:'№1.22'}).waitFor();
  await teacherFrame.locator('#answer').fill('6');await teacherFrame.locator('#answer-form button').click();
  const offByOne=await same(teacherFrame,studentFrame,'difference counts steps rather than interior points');assert.match(offByOne.scene.message,/шаги/);
  await teacherFrame.locator('#answer').fill('5');await teacherFrame.locator('#answer-form button').click();await teacherFrame.locator('[data-cmd=next]').click();
  await same(teacherFrame,studentFrame,'first open interval solved');await ownership(teacher,student,true);
  await studentFrame.locator('[data-v5-param=row]').selectOption({value:'1'});await studentFrame.locator('[data-v5-param=position]').fill('9');await studentFrame.locator('[data-v5-param=position]').press('Tab');
  await studentFrame.locator('[data-v5-prediction]').fill('8');await studentFrame.locator('[data-v5-predict] button').click();
  const marked=await same(studentFrame,teacherFrame,'right endpoint does not add an interior point');assert.equal(marked.scene.model.position,9);assert(marked.scene.model.seen);
  await narrow(student,studentFrame,'open-interval');await ownership(teacher,student,false);

  phase = 'leading digit and binary choice tree';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-26"]').click();await studentFrame.locator('h1').filter({hasText:'№1.26'}).waitFor();
  await teacherFrame.locator('#answer').fill('2');await teacherFrame.locator('#answer-form button').click();const leading=await same(teacherFrame,studentFrame,'zero cannot begin a three-digit numeral');assert.match(leading.scene.message,/первом разряде/);
  await teacherFrame.locator('#answer').fill('1');await teacherFrame.locator('#answer-form button').click();await teacherFrame.locator('[data-cmd=next]').click();
  await same(teacherFrame,studentFrame,'first digit fixed');await ownership(teacher,student,true);
  await studentFrame.locator('[data-v5-param=prefix]').selectOption({value:'1'});await studentFrame.locator('[data-v5-prediction]').fill('4');await studentFrame.locator('[data-v5-predict] button').click();
  const tree=await same(studentFrame,teacherFrame,'four endings under prefix six');assert(tree.scene.model.seen);assert.equal(tree.scene.model.prefix,1);
  await studentFrame.locator('#answer').fill('666;606;660;600');await studentFrame.locator('#answer-form button').click();const perm=await same(studentFrame,teacherFrame,'list in a different valid order');assert(perm.scene.correct);
  await narrow(student,studentFrame,'leading-choice-tree');await ownership(teacher,student,false);

  phase = 'two legal beginnings in separate brackets';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-30"]').click();await studentFrame.locator('h1').filter({hasText:'№1.30'}).waitFor();
  for(let i=0;i<2;i++){await solve(teacherFrame);await teacherFrame.locator('[data-cmd=next]').click();await same(teacherFrame,studentFrame,'completed first expression '+i);}
  await ownership(teacher,student,true);await studentFrame.locator('#answer').fill('3');await studentFrame.locator('#answer-form button').click();
  const alternative=await same(studentFrame,teacherFrame,'right bracket is also a legal beginning');assert(alternative.scene.correct);assert.equal(alternative.scene.answers[2],'3');
  await studentFrame.locator('[data-v5-param=row]').selectOption({value:'1'});await studentFrame.locator('[data-v5-param=op]').selectOption({value:'2'});
  await studentFrame.locator('[data-v5-prediction]').fill('0');await studentFrame.locator('[data-v5-predict] button').click();
  const zero=await same(studentFrame,teacherFrame,'right difference makes the whole product zero');assert(zero.scene.model.seen);
  await ownership(teacher,student,false);

  phase = 'two herds: difference, total and selected lengths';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-39"]').click();await studentFrame.locator('h1').filter({hasText:'№1.39'}).waitFor();
  await teacherFrame.locator('#answer').fill('308');await teacherFrame.locator('#answer-form button').click();
  const horseDifference=await same(teacherFrame,studentFrame,'difference is not the second herd');assert.match(horseDifference.scene.message,/разница/);
  await ownership(teacher,student,true);await studentFrame.locator('#answer').fill('1 144');await studentFrame.locator('#answer-form button').click();
  const horseCorrection=await same(studentFrame,teacherFrame,'second herd corrected without a requested hint');assert(horseCorrection.scene.correct);assert.deepEqual(horseCorrection.scene.hintLevels,{});
  await studentFrame.locator('[data-cmd=next]').click();await studentFrame.locator('[data-v5-param=view]').selectOption({value:'3'});
  await studentFrame.locator('[data-v5-prediction]').fill('1980');await studentFrame.locator('[data-v5-predict] button').click();
  const horses=await same(studentFrame,teacherFrame,'two proportional bars counted together');assert.equal(horses.scene.model.view,3);assert(horses.scene.model.seen);
  await narrow(student,studentFrame,'two-herds');await ownership(teacher,student,false);

  phase = 'points beyond a segment and off the line';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-44"]').click();await studentFrame.locator('h1').filter({hasText:'№1.44'}).waitFor();
  await teacherFrame.locator('#answer').fill('MC');await teacherFrame.locator('#answer-form button').click();await teacherFrame.locator('[data-cmd=next]').click();
  await teacherFrame.locator('#answer').fill('D N');await teacherFrame.locator('#answer-form button').click();
  const absentEnds=await same(teacherFrame,studentFrame,'strictly between omits the two ends');assert.match(absentEnds.scene.message,/Оба конца/);
  await ownership(teacher,student,true);await studentFrame.locator('#answer').fill('MCND');await studentFrame.locator('#answer-form button').click();
  const restored=await same(studentFrame,teacherFrame,'pupil includes the endpoints');assert(restored.scene.correct);assert.deepEqual(restored.scene.hintLevels,{});
  await studentFrame.locator('[data-v5-param=mark]').selectOption({value:'4'});await studentFrame.locator('[data-v5-prediction]').fill('0');await studentFrame.locator('[data-v5-predict] button').click();
  const extension=await same(studentFrame,teacherFrame,'a point on the extension is outside');assert.equal(extension.scene.model.mark,4);assert(extension.scene.model.seen);
  await narrow(student,studentFrame,'segment-membership');await ownership(teacher,student,false);

  phase = 'relative solar distances and final units, printed exercise 1.75';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-75"]').click();await studentFrame.locator('h1').filter({hasText:'№1.75'}).waitFor();
  await teacherFrame.locator('#answer').fill('5263');await teacherFrame.locator('#answer-form button').click();
  const farther=await same(teacherFrame,studentFrame,'the nearer planet was placed farther away');assert.match(farther.scene.message,/меньше|ближе/i);
  await ownership(teacher,student,true);
  await studentFrame.locator('[data-v5-param=from]').selectOption({value:'2'});await studentFrame.locator('[data-v5-param=to]').selectOption({value:'1'});await studentFrame.locator('[data-v5-param=unit]').selectOption({value:'1'});
  await studentFrame.locator('[data-v5-prediction]').fill('1385000000');await studentFrame.locator('[data-v5-predict] button').click();
  const spaceUnits=await same(studentFrame,teacherFrame,'common scale in kilometres');assert.equal(spaceUnits.scene.model.to,1);assert.equal(spaceUnits.scene.model.unit,1);assert(spaceUnits.scene.model.seen);
  for(const [step,number] of ['207','1350','1385'].entries()){
    await studentFrame.locator('#answer').fill(number);await studentFrame.locator('#answer-form button').click();const position=await same(studentFrame,teacherFrame,'solved distance '+step);assert(position.scene.correct);assert.equal(position.scene.step,step);
    await studentFrame.locator('[data-cmd=next]').click();
  }
  await studentFrame.locator('#answer').fill('1385');await studentFrame.locator('#answer-form button').click();const millions=await same(studentFrame,teacherFrame,'pupil forgot to convert millions');assert.match(millions.scene.message,/миллион/i);
  await studentFrame.locator('#answer').fill('1 385 000 000');await studentFrame.locator('#answer-form button').click();const kilometres=await same(studentFrame,teacherFrame,'correct final kilometres with no hint');assert(kilometres.scene.correct);assert.deepEqual(kilometres.scene.hintLevels,{});
  await ownership(teacher,student,false);await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);await same(teacherFrame,studentFrame,'teacher restores converted final and model');
  await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(studentFrame,teacherFrame,'pupil restores converted final and model');assert.equal(await studentFrame.locator('#answer').inputValue(),'1 385 000 000');

  phase = 'open applications in a shop and a sports ground, printed 1.72';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-72"]').click();await studentFrame.locator('h1').filter({hasText:'№1.72'}).waitFor();
  const independentIdeas='В магазине сравню массу двух упаковок. На площадке измерю угол броска.';
  await teacherFrame.locator('#v5-quality-note').fill(independentIdeas);
  const ideas=await same(teacherFrame,studentFrame,'own applications are saved without assessment');assert.equal(ideas.scene.note,independentIdeas);assert.equal(ideas.scene.attempt,0);assert.equal(ideas.scene.firstAttempt,null);
  await ownership(teacher,student,true);
  await studentFrame.locator('[data-v5-param=context]').selectOption({value:'1'});await studentFrame.locator('[data-v5-param=count]').fill('3');await studentFrame.locator('[data-v5-param=count]').press('Tab');await studentFrame.locator('[data-v5-param=question]').selectOption({value:'1'});
  await studentFrame.locator('[data-v5-prediction]').fill('360');await studentFrame.locator('[data-v5-predict] button').click();const lapsLeft=await same(studentFrame,teacherFrame,'distance still to go');assert.equal(lapsLeft.scene.model.count,3);assert(lapsLeft.scene.model.seen);assert.equal(lapsLeft.scene.attempt,0);
  await studentFrame.locator('#answer').fill('48');await studentFrame.locator('#answer-form button').click();const mixedUnits=await same(studentFrame,teacherFrame,'price was added to quantity');assert.match(mixedUnits.scene.message,/количеств/i);
  await studentFrame.locator('#answer').fill('135');await studentFrame.locator('#answer-form button').click();const computed=await same(studentFrame,teacherFrame,'calculation corrected with both personal examples retained');assert(computed.scene.correct);assert.equal(computed.scene.note,independentIdeas);assert.deepEqual(computed.scene.hintLevels,{});
  await ownership(teacher,student,false);await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);await same(teacherFrame,studentFrame,'written applications and correction restored to teacher');
  await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'written applications restored to pupil');assert.equal(await studentFrame.locator('#v5-quality-note').inputValue(),independentIdeas);

  phase = 'five arrows, fourth chain of printed exercise 1.71';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-71"]').click();await studentFrame.locator('h1').filter({hasText:'№1.71'}).waitFor();
  await teacherFrame.locator('#answer').fill('567');await teacherFrame.locator('#answer-form button').click();
  const productInstead=await same(teacherFrame,studentFrame,'division was replaced with multiplication');assert.match(productInstead.scene.message,/Раздели/);
  await ownership(teacher,student,true);
  await studentFrame.locator('[data-v5-param=row]').selectOption({value:'3'});await studentFrame.locator('[data-v5-param=arrow]').selectOption({value:'4'});
  await studentFrame.locator('[data-v5-prediction]').fill('100');await studentFrame.locator('[data-v5-predict] button').click();
  const lastArrow=await same(studentFrame,teacherFrame,'fourth chain ends at one hundred');assert.equal(lastArrow.scene.model.row,3);assert.equal(lastArrow.scene.model.arrow,4);assert(lastArrow.scene.model.seen);
  await studentFrame.locator('#answer').fill('7');await studentFrame.locator('#answer-form button').click();const fixedArrow=await same(studentFrame,teacherFrame,'corrected first printed arrow');assert(fixedArrow.scene.correct);assert.deepEqual(fixedArrow.scene.hintLevels,{});
  await studentFrame.locator('[data-cmd=next]').click();await studentFrame.locator('#answer').fill('3');await same(studentFrame,teacherFrame,'partially entered second arrow');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'pupil restored the same arrow and draft');
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);await same(teacherFrame,studentFrame,'teacher restored the same diagram');assert.equal(await teacherFrame.locator('#answer').inputValue(),'3');

  phase = 'compensation of a rounded sum, printed part 1 page 20';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-70"]').click();await studentFrame.locator('h1').filter({hasText:'№1.70'}).waitFor();
  await teacherFrame.locator('#answer').fill('150');await teacherFrame.locator('#answer-form button').click();
  const roundedTooFar=await same(teacherFrame,studentFrame,'both added amounts still need subtraction');assert.match(roundedTooFar.scene.message,/округлённых/);
  await ownership(teacher,student,true);
  await studentFrame.locator('[data-v5-param=method]').selectOption('1');await same(studentFrame,teacherFrame,'switch to transfer on same two numbers');
  await studentFrame.locator('#answer').fill('147');await studentFrame.locator('#answer-form button').click();const sameSum=await same(studentFrame,teacherFrame,'corrected the same sum');assert(sameSum.scene.correct);assert.deepEqual(sameSum.scene.hintLevels,{});
  await studentFrame.locator('[data-cmd=next]').click();await studentFrame.locator('#answer').fill('94');await same(studentFrame,teacherFrame,'draft of the second sum');
  await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'reloaded second sum');assert.equal(await studentFrame.locator('#answer').inputValue(),'94');
  if(await student.evaluate(()=>document.body.classList.contains('control-owner')))await ownership(teacher,student,false);
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);await same(teacherFrame,studentFrame,'returned to same second sum on both screens');

  phase = 'compass opening and an equal transferred segment';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-46"]').click();await studentFrame.locator('h1').filter({hasText:'№1.46'}).waitFor();
  await teacherFrame.locator('#answer').fill('EF=MK; CD=PT');await teacherFrame.locator('#answer-form button').click();
  const equalPairs=await same(teacherFrame,studentFrame,'two geometrically equal pairs');assert(equalPairs.scene.correct);
  await teacherFrame.locator('[data-cmd=next]').click();await same(teacherFrame,studentFrame,'construction follows the comparison');
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=sample]').selectOption({value:'0'});
  await studentFrame.locator('[data-v5-param=delta]').selectOption({value:'3'});
  await studentFrame.locator('[data-v5-prediction]').fill('3');await studentFrame.locator('[data-v5-predict] button').click();
  const longer=await same(studentFrame,teacherFrame,'opening the compass too far produces a longer copy');assert.equal(longer.scene.model.delta,3);assert(longer.scene.model.seen);
  await studentFrame.locator('[data-v5-param=delta]').selectOption({value:'2'});await studentFrame.locator('[data-v5-prediction]').fill('2');await studentFrame.locator('[data-v5-predict] button').click();
  const replica=await same(studentFrame,teacherFrame,'unchanged compass opening reproduces the length');assert.equal(replica.scene.model.delta,2);assert(replica.scene.model.seen);
  await narrow(student,studentFrame,'equal-segment-with-compass');await ownership(teacher,student,false);

  phase = 'choose a three-digit number in the second printed self-check';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-check-2-2"]').click();await studentFrame.locator('[data-v5-print-number]').waitFor();
  await teacherFrame.locator('[data-v5-print-number] input').fill('707');await teacherFrame.locator('[data-v5-print-number] button').click();
  const ownNumber=await same(teacherFrame,studentFrame,'new pupil-selected number is part of the task state');assert.equal(ownNumber.scene.seed,707);
  assert.equal(await studentFrame.locator('[data-v5-print-number] input').inputValue(),'707');
  await teacherFrame.locator('#answer').fill('6');await teacherFrame.locator('#answer-form button').click();await teacherFrame.locator('[data-cmd=next]').click();
  await teacherFrame.locator('#answer').fill('7');await teacherFrame.locator('#answer-form button').click();
  const oneDigit=await same(teacherFrame,studentFrame,'the units class and units digit are distinguished');assert.match(oneDigit.scene.message,/тройку/);
  await ownership(teacher,student,true);await studentFrame.locator('#answer').fill('707');await studentFrame.locator('#answer-form button').click();
  const ownCorrection=await same(studentFrame,teacherFrame,'pupil corrects their own generated class');assert(ownCorrection.scene.correct);assert.deepEqual(ownCorrection.scene.hintLevels,{});
  await studentFrame.locator('[data-v5-param=place]').selectOption({value:'3'});await studentFrame.locator('[data-v5-prediction]').fill('7');await studentFrame.locator('[data-v5-predict] button').click();
  const ownPlace=await same(studentFrame,teacherFrame,'the fourth digit from the right belongs to the same private choice');assert.equal(ownPlace.scene.model.place,3);assert(ownPlace.scene.model.seen);
  await narrow(student,studentFrame,'self-check-with-selected-number');await ownership(teacher,student,false);

  phase = 'two positions at a fixed distance on a line';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-55"]').click();await studentFrame.locator('h1').filter({hasText:'№1.55'}).waitFor();
  await solve(teacherFrame);await teacherFrame.locator('[data-cmd=next]').click();await same(teacherFrame,studentFrame,'first centimetre to millimetre conversion');
  await ownership(teacher,student,true);await solve(studentFrame);await studentFrame.locator('[data-cmd=next]').click();
  await studentFrame.locator('[data-v5-param=side]').selectOption({value:'1'});await studentFrame.locator('[data-v5-prediction]').fill('110');await studentFrame.locator('[data-v5-predict] button').click();
  const longSide=await same(studentFrame,teacherFrame,'K on the far side of N creates the sum');assert.equal(longSide.scene.model.side,1);assert(longSide.scene.model.seen);
  await studentFrame.locator('[data-v5-param=side]').selectOption({value:'0'});await studentFrame.locator('[data-v5-prediction]').fill('42');await studentFrame.locator('[data-v5-predict] button').click();await same(studentFrame,teacherFrame,'near-side distance is a difference');
  await narrow(student,studentFrame,'two-possible-distances');await ownership(teacher,student,false);

  phase = 'freeze a pupil-built seven-link closed polyline';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-59"]').click();await studentFrame.locator('h1').filter({hasText:'№1.59'}).waitFor();
  await teacherFrame.locator('[data-v5-param=vertex]').selectOption({value:'5'});await teacherFrame.locator('[data-v5-param=p5]').selectOption({value:'3'});
  const moved=await same(teacherFrame,studentFrame,'one saved vertex of the pupil drawing moves');assert.equal(moved.scene.model.p5,3);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-apply-drawing]').click();
  const frozen=await same(studentFrame,teacherFrame,'both roles solve exactly the selected geometry');assert.equal(frozen.scene.seed,106250);assert.equal(frozen.scene.step,0);
  await studentFrame.locator('#answer').fill('AH FH EF DE CD BC AB');await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();
  await studentFrame.locator('[data-v5-param=edge]').selectOption({value:'6'});const sourceEdge=await studentFrame.evaluate(()=>{const s=Vilenkin5Quality.getState().scene;return WorkshopMath.generate(s.id,s.seed).data.fig.edges[6].length;});
  await studentFrame.locator('[data-v5-prediction]').fill(String(sourceEdge));await studentFrame.locator('[data-v5-predict] button').click();
  const last=await same(studentFrame,teacherFrame,'closing edge measured to the nearest millimetre');assert.equal(last.scene.model.edge,6);assert(last.scene.model.seen);
  await narrow(student,studentFrame,'pupil-built-seven-edges');await ownership(teacher,student,false);

  phase = 'complete a pentagon without crossing edges';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('.v5-hero').waitFor();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-1-60"]').click();await studentFrame.locator('h1').filter({hasText:'№1.60'}).waitFor();
  await teacherFrame.locator('#answer').fill('SH QO');await teacherFrame.locator('#answer-form button').click();
  const crossing=await same(teacherFrame,studentFrame,'crossed closing edges produce a specific mistake');assert.match(crossing.scene.message,/пересекутся/);
  await ownership(teacher,student,true);await studentFrame.locator('#answer').fill('OS HQ');await studentFrame.locator('#answer-form button').click();
  const closed=await same(studentFrame,teacherFrame,'order-independent correction to the two connections');assert(closed.scene.correct);assert.deepEqual(closed.scene.hintLevels,{});
  await studentFrame.locator('[data-cmd=next]').click();await studentFrame.locator('[data-v5-param=choice]').selectOption({value:'2'});
  await studentFrame.locator('[data-v5-prediction]').fill('0');await studentFrame.locator('[data-v5-predict] button').click();
  const crossed=await same(studentFrame,teacherFrame,'both ends of both new crossing edges visible');assert.equal(crossed.scene.model.choice,2);assert(crossed.scene.model.seen);
  await narrow(student,studentFrame,'pentagon-new-bridges');await ownership(teacher,student,false);

  phase = 'circle, disk and radius in the second printed volume';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-5-1"]').click();
  await studentFrame.locator('#task-panel svg').waitFor();
  await same(teacherFrame,studentFrame,'new geometric figure opens on both boards');
  await teacherFrame.locator('#answer').fill('ABDELMO');await teacherFrame.locator('#answer-form button').click();
  assert.match((await same(teacherFrame,studentFrame,'circle versus disk')).scene.message,/изнутри/);
  await ownership(teacher,student,true);
  await studentFrame.locator('[data-v5-param=region]').selectOption('3');
  await studentFrame.locator('#answer').fill('лВд');await studentFrame.locator('#answer-form button').click();
  const circleCorrection=await same(studentFrame,teacherFrame,'student identifies the circumference and shows the short arc');
  assert.equal(circleCorrection.scene.model.region,3);assert(circleCorrection.scene.correct);assert(circleCorrection.scene.assisted);assert.deepEqual(circleCorrection.scene.hintLevels,{});
  await studentFrame.locator('[data-cmd=next]').click();
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const circleReload=await same(studentFrame,teacherFrame,'printed part 2 retains model and corrected first step');
  assert.equal(circleReload.scene.step,1);assert.equal(circleReload.scene.answers[0],'лВд');
  await narrow(student,studentFrame,'circle-points');await ownership(teacher,student,false);

  phase = 'compass radius and two arcs between the same pair';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-5-2"]').click();
  await studentFrame.locator('#task-panel').getByRole('img',{name:'Циркуль с иглой в O и миллиметровая шкала',exact:true}).waitFor();
  await same(teacherFrame,studentFrame,'compass and offset ruler appear');
  await teacherFrame.locator('[data-v5-param=opening]').selectOption('2');
  await teacherFrame.locator('[data-v5-param=stage]').selectOption('3');
  await same(teacherFrame,studentFrame,'teacher draws two radii');
  await narrow(student,studentFrame,'compass-ruler-before-handoff');
  await ownership(teacher,student,true);
  await studentFrame.locator('[data-v5-prediction]').fill('36');await studentFrame.locator('[data-v5-predict] button').click();
  assert((await same(studentFrame,teacherFrame,'student doubles 18')).scene.model.seen);
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await studentFrame.locator('a[href="#lesson/v5f-printed-5-3"]').click();
  await studentFrame.locator('#answer').fill('KDB');await studentFrame.locator('#answer-form button').click();
  assert.match((await same(studentFrame,teacherFrame,'distinguishing the two paths')).scene.message,/другую дугу/);
  await studentFrame.locator('#answer').fill('BPK');await studentFrame.locator('#answer-form button').click();
  assert((await same(studentFrame,teacherFrame,'same short arc in reverse')).scene.correct);
  await studentFrame.locator('[data-v5-param=turn]').selectOption('2');
  await studentFrame.locator('[data-v5-param=side]').selectOption('1');
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const arcsAgain=await same(studentFrame,teacherFrame,'rotation, side and own correction survive');
  assert.equal(arcsAgain.scene.model.turn,2);assert.equal(arcsAgain.scene.model.side,1);assert(arcsAgain.scene.assisted);assert.deepEqual(arcsAgain.scene.hintLevels,{});
  await narrow(student,studentFrame,'compass-arcs');await ownership(teacher,student,false);

  phase = 'distances from the centre and intersections of two secants';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-5-4"]').click();
  await studentFrame.locator('#task-panel').getByRole('img',{name:'Круг, две внутренние и две наружные точки'}).waitFor();
  await teacherFrame.locator('[data-v5-param=point]').selectOption('2');
  assert.equal((await same(teacherFrame,studentFrame,'second tablet sees ruler under OK')).scene.model.point,2);
  await narrow(student,studentFrame,'distance-ruler');
  await ownership(teacher,student,true);
  await studentFrame.locator('[data-v5-param=mode]').selectOption('1');
  await studentFrame.locator('[data-v5-param=segment]').selectOption('1');
  await studentFrame.locator('[data-v5-prediction]').fill('1');
  await studentFrame.locator('[data-v5-predict] button').click();
  assert((await same(studentFrame,teacherFrame,'AB meets the edge at its endpoint')).scene.model.seen);
  await studentFrame.locator('#answer').fill('20');await studentFrame.locator('#answer-form button').click();
  assert.match((await same(studentFrame,teacherFrame,'radius confused with distance to A')).scene.message,/радиус/);
  await studentFrame.locator('#answer').fill('12');await studentFrame.locator('#answer-form button').click();
  await studentFrame.locator('[data-cmd=next]').click();
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const edgeResume=await same(studentFrame,teacherFrame,'teacher recovered selected segment and corrected first step');
  assert.equal(edgeResume.scene.model.segment,1);assert.equal(edgeResume.scene.step,1);assert.deepEqual(edgeResume.scene.hintLevels,{});
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await studentFrame.locator('a[href="#lesson/v5f-printed-5-5"]').click();
  await studentFrame.locator('[data-v5-param=point]').selectOption('3');
  await studentFrame.locator('#answer').fill('7');await studentFrame.locator('#answer-form button').click();
  assert.match((await same(studentFrame,teacherFrame,'centimetres and millimetres')).scene.message,/единиц/);
  await studentFrame.locator('#answer').fill('25');await studentFrame.locator('#answer-form button').click();
  assert((await same(studentFrame,teacherFrame,'four equal radii')).scene.correct);
  await ownership(teacher,student,false);
  await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);
  const radiusResume=await same(teacherFrame,studentFrame,'student rejoined at OK');
  assert.equal(radiusResume.scene.model.point,3);assert(radiusResume.scene.correct);
  await narrow(student,studentFrame,'four-radii');

  phase = 'two compass constructions in the second volume';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-5-6"]').click();
  await studentFrame.locator('#task-panel').getByRole('img',{name:'Построение двух окружностей с центрами H и P'}).waitFor();
  await teacherFrame.locator('[data-v5-param=stage]').selectOption('3');
  await teacherFrame.locator('[data-v5-param=leg]').selectOption('3');
  assert.equal((await same(teacherFrame,studentFrame,'both see NP on the second circle')).scene.model.leg,3);
  await ownership(teacher,student,true);
  await studentFrame.locator('#answer').fill('3');await studentFrame.locator('#answer-form button').click();
  assert.match((await same(studentFrame,teacherFrame,'wrong centre for MH')).scene.message,/другой окружности/);
  await studentFrame.locator('#answer').fill('2');await studentFrame.locator('#answer-form button').click();
  await studentFrame.locator('[data-cmd=next]').click();
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  assert.equal((await same(studentFrame,teacherFrame,'first comparison recovered after teacher reload')).scene.step,1);
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await studentFrame.locator('a[href="#lesson/v5f-printed-5-7"]').click();
  await studentFrame.locator('[data-v5-param=stage]').selectOption('3');
  await studentFrame.locator('[data-v5-param=distance]').selectOption('1');
  await studentFrame.locator('[data-v5-prediction]').fill('1');await studentFrame.locator('[data-v5-predict] button').click();
  assert((await same(studentFrame,teacherFrame,'two possible points coalesce at tangency')).scene.model.seen);
  await narrow(student,studentFrame,'tangent-circles');
  await ownership(teacher,student,false);
  await teacherFrame.locator('[data-v5-param=distance]').selectOption('4');
  await teacherFrame.locator('[data-v5-prediction]').fill('0');await teacherFrame.locator('[data-v5-predict] button').click();
  await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);
  const nested=await same(teacherFrame,studentFrame,'both see unequal concentric circles after student reload');
  assert.equal(nested.scene.model.distance,4);assert(nested.scene.model.seen);
  await narrow(student,studentFrame,'concentric-circles');

  phase = 'straight cuts across a pancake and through a cake';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-5-8"]').click();
  await studentFrame.locator('#task-panel').getByRole('img',{name:'Блин, вид сверху'}).waitFor();
  await teacherFrame.locator('[data-v5-param=stage]').selectOption('3');
  await teacherFrame.locator('[data-v5-param=labels]').selectOption('1');
  await same(teacherFrame,studentFrame,'each participant sees the same seven marked pancake pieces');
  assert.equal(await studentFrame.locator('.v5q-model .v5q-cut-label').count(),7);
  await ownership(teacher,student,true);
  await studentFrame.locator('[data-v5-param=style]').selectOption('1');
  await studentFrame.locator('[data-v5-prediction]').fill('6');await studentFrame.locator('[data-v5-predict] button').click();
  assert((await same(studentFrame,teacherFrame,'six pieces when the third line crosses the common point')).scene.model.seen);
  await studentFrame.locator('#answer').fill('2');await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();
  await studentFrame.locator('#answer').fill('4');await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();
  await studentFrame.locator('#answer').fill('2');await studentFrame.locator('#answer-form button').click();
  assert.match((await same(studentFrame,teacherFrame,'intersections and intervals have different counts')).scene.message,/промежутки/);
  await studentFrame.locator('#answer').fill('3');await studentFrame.locator('#answer-form button').click();
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const pancake=await same(studentFrame,teacherFrame,'teacher recovered corrected count and third concurrent line');
  assert(pancake.scene.correct);assert.deepEqual(pancake.scene.hintLevels,{});assert.equal(pancake.scene.model.style,1);
  await studentFrame.locator('[data-v5-param=object]').selectOption('1');await studentFrame.locator('[data-v5-param=style]').selectOption('0');
  await same(studentFrame,teacherFrame,'four pieces in each horizontal layer');
  await ownership(teacher,student,false);
  await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);
  const cake=await same(teacherFrame,studentFrame,'student rejoined two separate layers and preserved step');
  assert.equal(cake.scene.model.object,1);assert.equal(cake.scene.step,2);assert.equal(await studentFrame.locator('.v5q-model .v5q-cut-label').count(),8);
  await narrow(student,studentFrame,'two-horizontal-layers');

  phase = 'four own examples and a separate shape classification';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-5-9"]').click();
  await studentFrame.locator('#task-panel').getByRole('img',{name:'Тонкая линия с точками O, P и Q'}).waitFor();
  await teacherFrame.getByText('Мои четыре примера',{exact:true}).click();
  await teacherFrame.locator('#v5-quality-note').fill('Окружность — след края чашки.');
  const thought=await same(teacherFrame,studentFrame,'own example saved without classifying the picture');
  assert.equal(thought.scene.attempt,0);assert.equal(thought.scene.correct,false);assert.match(thought.scene.note,/чашки/);
  await teacherFrame.locator('[data-v5-param=kind]').selectOption('1');
  await ownership(teacher,student,true);
  await studentFrame.locator('#v5-quality-note').fill('Окружность — след края чашки. Круг — отпечаток дна. Цилиндр — жестяная банка. Шар — цельная бусина.');
  await studentFrame.locator('#answer').fill('круг');await studentFrame.locator('#answer-form button').click();
  assert.match((await same(studentFrame,teacherFrame,'boundary confused with the whole cover')).scene.message,/заполненную область/);
  await studentFrame.locator('#answer').fill('окружность');await studentFrame.locator('#answer-form button').click();
  await studentFrame.locator('[data-cmd=next]').click();await studentFrame.locator('[data-v5-param=kind]').selectOption('2');
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const copy=await same(studentFrame,teacherFrame,'student examples and separate check survive teacher reload');
  assert.match(copy.scene.note,/бусина/);assert.equal(copy.scene.step,1);assert.equal(copy.scene.model.kind,2);assert.deepEqual(copy.scene.hintLevels,{});
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);
  const ownAgain=await same(teacherFrame,studentFrame,'second participant recovered the same four own examples');
  assert.equal(ownAgain.scene.note,copy.scene.note);await narrow(student,studentFrame,'round-objects');

  phase = 'three measured circles in the same notebook';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-5-10"]').click();
  await studentFrame.locator('#task-panel table').getByText('Отдельный опыт для самопроверки').waitFor();
  const mfield=(f,key)=>f.locator('[data-v5-param="'+key+'"]');
  const measure=async(f,key,v)=>{const input=mfield(f,key);await input.fill(String(v));await input.press('Tab');};
  await measure(teacherFrame,'d1',32);await measure(teacherFrame,'c1',101);
  await mfield(teacherFrame,'stage').selectOption('1');
  const thread1=await same(teacherFrame,studentFrame,'diameter and string saved for the first physical disc');
  assert.equal(thread1.scene.model.c1,101);assert.equal(thread1.scene.attempt,0);
  await ownership(teacher,student,true);
  await mfield(studentFrame,'row').selectOption('2');await measure(studentFrame,'d3',73);await measure(studentFrame,'c3',230);
  await studentFrame.locator('#answer').fill('125');await studentFrame.locator('#answer-form button').click();
  assert.match((await same(studentFrame,teacherFrame,'string length confused with three diameters')).scene.message,/длину нитки/);
  await studentFrame.locator('#answer').fill('120');await studentFrame.locator('#answer-form button').click();
  await studentFrame.locator('[data-cmd=next]').click();
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const threadCopy=await same(studentFrame,teacherFrame,'first and third circles restored together on teacher reload');
  assert.equal(threadCopy.scene.step,1);assert.equal(threadCopy.scene.model.c1,101);assert.equal(threadCopy.scene.model.c3,230);
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);
  await same(teacherFrame,studentFrame,'shared table and correction survive pupil reload');await narrow(student,studentFrame,'thread-circles');

  phase = 'circumference and diameter as inverse estimates';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-5-11"]').click();
  await studentFrame.locator('h1').filter({hasText:'№5.11'}).waitFor();
  await teacherFrame.locator('#answer').fill('3');await teacherFrame.locator('#answer-form button').click();
  assert.match((await same(teacherFrame,studentFrame,'one diameter is too short for the edge')).scene.message,/одного диаметра/);
  await teacherFrame.locator('#answer').fill('9');await teacherFrame.locator('#answer-form button').click();
  await teacherFrame.locator('[data-cmd=next]').click();
  await ownership(teacher,student,true);
  await studentFrame.locator('#answer').fill('25');await studentFrame.locator('#answer-form button').click();
  await studentFrame.locator('[data-cmd=next]').click();await studentFrame.locator('#answer').fill('75');await studentFrame.locator('#answer-form button').click();
  const estimated=await same(studentFrame,teacherFrame,'two units of length converted before multiplying');
  assert.equal(estimated.scene.correct,true);assert.equal(estimated.scene.assisted,true);assert.deepEqual(estimated.scene.hintLevels,{});
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await studentFrame.locator('a[href="#lesson/v5f-printed-5-12"]').click();
  await teacherFrame.locator('h1').filter({hasText:'№5.12'}).waitFor();
  await studentFrame.locator('[data-v5-param=size]').fill('12');await studentFrame.locator('[data-v5-param=size]').press('Tab');
  await studentFrame.locator('[data-v5-param=direction]').selectOption({value:'0'});
  await studentFrame.locator('[data-v5-prediction]').fill('36');await studentFrame.locator('[data-v5-predict] button').click();
  await studentFrame.locator('#answer').fill('14');await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();
  await studentFrame.locator('#answer').fill('750');
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const partialInverse=await same(studentFrame,teacherFrame,'inverse task, new model relation and partial metres on teacher reload');
  assert.equal(partialInverse.scene.model.size,12);assert.equal(partialInverse.scene.model.prediction,'36');assert.equal(partialInverse.scene.step,1);assert.equal(partialInverse.scene.savedInput,'750');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);
  await same(teacherFrame,studentFrame,'pupil recovers same inverse estimate');await narrow(student,studentFrame,'circumference-estimates');

  phase = 'fuel-gauge intervals and a clock moving backwards';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-5-13"]').click();await studentFrame.locator('h1').filter({hasText:'№5.13'}).waitFor();
  await teacherFrame.locator('[data-v5-param=marks]').selectOption({value:'1'});
  await teacherFrame.locator('#answer').fill('20');await teacherFrame.locator('#answer-form button').click();
  assert.match((await same(teacherFrame,studentFrame,'confused adjacent labels with one interval')).scene.message,/разность между подписями/);
  await teacherFrame.locator('#answer').fill('5');await teacherFrame.locator('#answer-form button').click();await teacherFrame.locator('[data-cmd=next]').click();
  await ownership(teacher,student,true);
  await studentFrame.locator('#answer').fill('50');await studentFrame.locator('#answer-form button').click();
  await studentFrame.locator('[data-cmd=next]').click();await studentFrame.locator('#answer').fill('65');await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();
  await studentFrame.locator('#answer').fill('40');await studentFrame.locator('#answer-form button').click();
  assert.match((await same(studentFrame,teacherFrame,'each fuel change starts at the original indication')).scene.message,/от результата заправки/);
  await studentFrame.locator('#answer').fill('25');await studentFrame.locator('#answer-form button').click();
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();await studentFrame.locator('a[href="#lesson/v5f-printed-5-14"]').click();
  await teacherFrame.locator('h1').filter({hasText:'№5.14'}).waitFor();
  await studentFrame.locator('[data-v5-param=back]').selectOption({value:'1'});
  await studentFrame.locator('[data-v5-param=ticks]').fill('3');await studentFrame.locator('[data-v5-param=ticks]').press('Tab');
  await studentFrame.locator('#answer').fill('02:25');await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();
  await studentFrame.locator('#answer').fill('2:');
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const clockCopy=await same(studentFrame,teacherFrame,'backwards hour hand and unfinished minutes survive teacher reload');
  assert.equal(clockCopy.scene.savedInput,'2:');assert.equal(clockCopy.scene.step,1);assert.equal(clockCopy.scene.model.ticks,3);assert.equal(clockCopy.scene.model.back,1);
  assert.equal(await teacherFrame.locator('#model svg').getAttribute('aria-label'),'Аналоговые часы: 1:45');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);
  await same(teacherFrame,studentFrame,'both participants recover clock and separate checked task');await narrow(student,studentFrame,'scale-and-clock');

  phase = 'printed 5.15 and 5.16, five operation chains and the two meanings of decrease';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-5-15"]').click();await studentFrame.locator('h1').filter({hasText:'№5.15'}).waitFor();
  await teacherFrame.locator('#answer').fill('43');await teacherFrame.locator('#answer-form button').click();const wrongSum=await same(teacherFrame,studentFrame,'confused subtraction with addition');
  assert.match(wrongSum.scene.message,/знак −/);await ownership(teacher,student,true);
  await studentFrame.locator('#answer').fill('5');await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();
  await studentFrame.locator('[data-v5-param=column]').selectOption({value:'3'});await studentFrame.locator('[data-v5-param=operation]').selectOption({value:'4'});
  await studentFrame.locator('[data-v5-prediction]').fill('2');await studentFrame.locator('[data-v5-predict] button').click();
  const route=await same(studentFrame,teacherFrame,'fourth chain final row 34 divided by 17');assert.equal(route.scene.model.column,3);assert.equal(route.scene.model.operation,4);assert(route.scene.model.seen);assert.equal(route.scene.step,1);assert.deepEqual(route.scene.hintLevels,{});
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();await studentFrame.locator('a[href="#lesson/v5f-printed-5-16"]').click();await teacherFrame.locator('h1').filter({hasText:'№5.16'}).waitFor();
  await studentFrame.locator('[data-v5-param=groupChoice]').selectOption({value:'2'});await studentFrame.locator('[data-v5-param=hundreds]').fill('3');await studentFrame.locator('[data-v5-param=hundreds]').press('Tab');
  await studentFrame.locator('#answer').fill('100000');await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();await studentFrame.locator('#answer').fill('99');
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);const draft=await same(studentFrame,teacherFrame,'one fifth marked on the model and unfinished final answer survive');assert.equal(draft.scene.savedInput,'99');assert.equal(draft.scene.step,1);assert.equal(draft.scene.model.hundreds,3);assert.equal(draft.scene.model.groupChoice,2);
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'learner reconnects to the same chain');
  await teacherFrame.locator('#answer').fill('99900');await teacherFrame.locator('#answer-form button').click();const endDecrease=await same(teacherFrame,studentFrame,'original million independently reduced to 99900');assert(endDecrease.scene.correct);assert.deepEqual(endDecrease.scene.hintLevels,{});await narrow(student,studentFrame,'chains-and-decrease');

  phase = 'source 5.17, coordinates of both midpoints and rightward comparisons';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-5-17"]').click();await studentFrame.locator('h1').filter({hasText:'№5.17'}).waitFor();
  await teacherFrame.locator('#answer').fill('12');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'cell count differs from coordinates')).scene.message,/расстояние в клетках/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=point]').selectOption({value:'3'});await studentFrame.locator('[data-v5-param=halves]').selectOption({value:'1'});
  await studentFrame.locator('[data-v5-prediction]').fill('30');await studentFrame.locator('[data-v5-predict] button').click();
  for(const value of ['48','8','60','30','70']){await studentFrame.locator('#answer').fill(value);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('K');await studentFrame.locator('#answer-form button').click();assert.match((await same(studentFrame,teacherFrame,'lower coordinate chosen')).scene.message,/левее/);
  await studentFrame.locator('#answer').fill('с');await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const rulerHalfSteps=await same(studentFrame,teacherFrame,'draft and half-step markings restored');assert.equal(rulerHalfSteps.scene.savedInput,'с');assert.equal(rulerHalfSteps.scene.model.halves,1);assert.equal(rulerHalfSteps.scene.model.point,3);assert.equal(rulerHalfSteps.scene.step,5);
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'both sides restored at the comparison');
  await teacherFrame.locator('#answer-form button').click();const greater=await same(teacherFrame,studentFrame,'C is to the right of K');assert(greater.scene.correct);assert.deepEqual(greater.scene.hintLevels,{});await narrow(student,studentFrame,'ray-with-half-cells');

  phase = 'fractions of a centimetre and a centner, printed 5.18 and 5.19';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-18"]').click();await studentFrame.locator('h1').filter({hasText:'№5.18'}).waitFor();
  await teacherFrame.locator('#answer').fill('100');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'whole decimetre supplied instead of half')).scene.message,/величина целого/);
  await ownership(teacher,student,true);await studentFrame.locator('#answer').fill('50');await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();
  await studentFrame.locator('#answer').fill('2 1/2');await studentFrame.locator('#answer-form button').click();const quarter=await same(studentFrame,teacherFrame,'exact mixed fraction for a quarter of one centimetre');assert(quarter.scene.correct);assert.deepEqual(quarter.scene.hintLevels,{});
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();await studentFrame.locator('a[href="#lesson/v5f-printed-5-19"]').click();await teacherFrame.locator('h1').filter({hasText:'№5.19'}).waitFor();
  await studentFrame.locator('[data-v5-param=unitChoice]').selectOption({value:'1'});await studentFrame.locator('[data-v5-param=portion]').selectOption({value:'8'});
  await studentFrame.locator('[data-v5-prediction]').fill('1000');await studentFrame.locator('[data-v5-predict] button').click();
  await studentFrame.locator('#answer').fill('10');await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();await studentFrame.locator('#answer').fill('1000');
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);const partialMass=await same(studentFrame,teacherFrame,'one hundredth of a centner and unfinished answer for a tenth');assert.equal(partialMass.scene.model.unitChoice,1);assert.equal(partialMass.scene.model.portion,8);assert(partialMass.scene.model.seen);assert.equal(partialMass.scene.savedInput,'1000');
  assert.equal(await teacherFrame.locator('#model svg').count(),2);
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'both recovered unit and two magnifications');await teacherFrame.locator('#answer').fill('10000');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'one tenth of a centner in grams')).scene.correct);await narrow(student,studentFrame,'parts-of-units');

  phase = 'source 5.20, from a square layer to the length of the row';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-20"]').click();await studentFrame.locator('h1').filter({hasText:'№5.20'}).waitFor();
  await teacherFrame.locator('#answer').fill('10');await teacherFrame.locator('#answer-form button').click();await teacherFrame.locator('[data-cmd=next]').click();
  await teacherFrame.locator('#answer').fill('100');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'counted one square layer instead of the whole cube')).scene.message,/один слой/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=set]').selectOption({value:'1'});await studentFrame.locator('[data-v5-param=what]').selectOption({value:'3'});await studentFrame.locator('[data-v5-prediction]').fill('100');await studentFrame.locator('[data-v5-predict] button').click();
  const partialProjection=await same(studentFrame,teacherFrame,'wrong comparison is still editable on the original model');assert(!partialProjection.scene.model.seen);assert.equal(partialProjection.scene.model.first,'100');assert.equal(await studentFrame.locator('.v5q-model-why').count(),0);
  await studentFrame.locator('[data-v5-prediction]').fill('10 000');await studentFrame.locator('[data-v5-predict] button').click();const fixedProjection=await same(studentFrame,teacherFrame,'projection independently corrected on original cube');assert.match(fixedProjection.scene.model.notice,/исправлен самостоятельно/);assert.equal(fixedProjection.scene.model.first,'100');
  await studentFrame.locator('#answer').fill('1000');await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();await studentFrame.locator('#answer').fill('10');
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);const cubeDraft=await same(studentFrame,teacherFrame,'ten typed so far and metre projection recovered');assert.equal(cubeDraft.scene.savedInput,'10');assert.equal(cubeDraft.scene.step,2);assert.equal(cubeDraft.scene.model.set,1);assert.equal(cubeDraft.scene.model.what,3);assert(cubeDraft.scene.model.seen);
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'both see same projection and metre question');
  for(const v of ['100','1000000','10000','1']){await teacherFrame.locator('#answer').fill(v);await teacherFrame.locator('#answer-form button').click();await teacherFrame.locator('[data-cmd=next]').click();}
  await teacherFrame.locator('#answer').fill('100');await teacherFrame.locator('#answer-form button').click();const ratio=await same(teacherFrame,studentFrame,'one hundred times longer');assert(ratio.scene.correct);assert.deepEqual(ratio.scene.hintLevels,{});await narrow(student,studentFrame,'cube-row-length');

  phase = 'square layers, a rule in the pupil’s own words and seven cubes';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-21"]').click();await studentFrame.locator('h1').filter({hasText:'№5.21'}).waitFor();
  await teacherFrame.locator('summary').filter({hasText:'Моя формулировка правила'}).click();await teacherFrame.locator('#v5-quality-note').fill('Сторона большого квадрата равна сумме оснований.');
  const ownRule=await same(teacherFrame,studentFrame,'writing the rule does not mark any step complete');assert.equal(ownRule.scene.attempt,0);assert.equal(ownRule.scene.firstAttempt,null);
  await teacherFrame.locator('#answer').fill('3');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'side mistaken for area')).scene.message,/сторону квадрата/);await ownership(teacher,student,true);
  await studentFrame.locator('[data-v5-param=rank]').fill('7');await studentFrame.locator('[data-v5-param=rank]').press('Tab');await studentFrame.locator('[data-v5-param=measure]').selectOption({value:'1'});
  await studentFrame.locator('[data-v5-prediction]').fill('49');await studentFrame.locator('[data-v5-predict] button').click();const squareMistake=await same(studentFrame,teacherFrame,'one layer is still open for correction');assert(!squareMistake.scene.model.seen);assert.equal(squareMistake.scene.model.first,'49');
  await studentFrame.locator('[data-v5-prediction]').fill('343');await studentFrame.locator('[data-v5-predict] button').click();assert.match((await same(studentFrame,teacherFrame,'seventh layer independently corrected')).scene.model.notice,/самостоятельно/);
  for(const value of ['9','36','100','2','28']){await studentFrame.locator('#answer').fill(value);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('78');await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const squareDraft=await same(studentFrame,teacherFrame,'rule, geometry and unfinished final value recovered');assert.equal(squareDraft.scene.savedInput,'78');assert.equal(squareDraft.scene.step,5);assert.equal(squareDraft.scene.model.rank,7);assert(squareDraft.scene.note.includes('оснований'));
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'pupil restored original seven-cube calculation');await teacherFrame.locator('#answer').fill('784');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'seven cubes give 784')).scene.correct);await narrow(student,studentFrame,'sum-of-seven-cubes');

  phase = 'source 5.22 and 5.23, two sides of the lid and dimension of a cubical measure';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-22"]').click();await studentFrame.locator('h1').filter({hasText:'№5.22'}).waitFor();
  for(const value of ['315','504','223']){await teacherFrame.locator('#answer').fill(value);await teacherFrame.locator('#answer-form button').click();await teacherFrame.locator('[data-cmd=next]').click();}
  await teacherFrame.locator('#answer').fill('63');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'body bottom was used instead of wider lid')).scene.message,/Это дно/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=piece]').selectOption({value:'3'});await studentFrame.locator('[data-v5-param=sides]').selectOption({value:'1'});
  await studentFrame.locator('[data-v5-prediction]').fill('72');await studentFrame.locator('[data-v5-predict] button').click();await studentFrame.locator('[data-v5-prediction]').fill('144');await studentFrame.locator('[data-v5-predict] button').click();const lid=await same(studentFrame,teacherFrame,'two faces on one lid corrected from 72 to 144');assert(lid.scene.model.seen);assert.equal(lid.scene.model.first,'72');assert.equal(lid.scene.model.piece,3);
  for(const value of ['72','590','4130']){await studentFrame.locator('#answer').fill(value);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('2');await studentFrame.locator('#answer-form button').click();assert.match((await same(studentFrame,teacherFrame,'two cans are short')).scene.message,/не покроют/);await studentFrame.locator('#answer').fill('3');await studentFrame.locator('#answer-form button').click();assert((await same(studentFrame,teacherFrame,'three cans suffice')).scene.correct);
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();await studentFrame.locator('a[href="#lesson/v5f-printed-5-23"]').click();await teacherFrame.locator('h1').filter({hasText:'№5.23'}).waitFor();await studentFrame.locator('[data-v5-param=factor]').fill('3');await studentFrame.locator('[data-v5-param=factor]').press('Tab');await studentFrame.locator('[data-v5-param=view]').selectOption({value:'1'});
  await studentFrame.locator('#answer').fill('2');await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();await studentFrame.locator('#answer').fill('4');await studentFrame.locator('#answer-form button').click();
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);const layersCube=await same(studentFrame,teacherFrame,'volume step remembers area mistake and three layers');assert.equal(layersCube.scene.model.factor,3);assert.equal(layersCube.scene.model.view,1);assert.equal(layersCube.scene.savedInput,'4');assert.match(layersCube.scene.message,/одну грань/);
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'pupil reconnects to same cube');await teacherFrame.locator('#answer').fill('8');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'volume ratio corrected to eight')).scene.correct);await narrow(student,studentFrame,'paint-and-cube-comparison');

  phase = 'independent fractional mistakes and arbitrary nearby numbers on the coordinate ray';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-17"]').click();await studentFrame.locator('h1').filter({hasText:'№5.17'}).waitFor();
  for(const value of ['48','8','60']){await teacherFrame.locator('#answer').fill(value);await teacherFrame.locator('#answer-form button').click();await teacherFrame.locator('[data-cmd=next]').click();}
  await teacherFrame.locator('#answer').fill('777');await teacherFrame.locator('#answer-form button').click();const arbitrary=await same(teacherFrame,studentFrame,'arbitrary incorrect coordinate stays editable');assert(!arbitrary.scene.correct);assert.equal(arbitrary.scene.attempt,1);
  await ownership(teacher,student,true);await studentFrame.locator('#answer').fill('7,5');await studentFrame.locator('#answer-form button').click();const cells=await same(studentFrame,teacherFrame,'half-cell number is recognized by fraction value');assert.match(cells.scene.message,/расстояние в клетках/);
  await studentFrame.locator('#answer').fill('30');await studentFrame.locator('#answer-form button').click();await ownership(teacher,student,false);await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);await same(teacherFrame,studentFrame,'correct coordinate received after reload');await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);const exact=await same(teacherFrame,studentFrame,'pupil restores the correction');assert(exact.scene.correct);assert.deepEqual(exact.scene.hintLevels,{});

  phase = 'source 5.24 and 5.25, reassemble the template and separate the honey from the jar';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-24"]').click();await studentFrame.locator('h1').filter({hasText:'№5.24'}).waitFor();
  await teacherFrame.locator('#answer').fill('40');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'rectangle includes empty cells')).scene.message,/с вырезами/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=flatten]').selectOption({value:'1'});await studentFrame.locator('[data-v5-param=region]').selectOption({value:'1'});
  await studentFrame.locator('[data-v5-prediction]').fill('8');await studentFrame.locator('[data-v5-predict] button').click();await studentFrame.locator('[data-v5-prediction]').fill('6');await studentFrame.locator('[data-v5-predict] button').click();
  const middleBand=await same(studentFrame,teacherFrame,'six cells in the middle and two in the handle');assert(middleBand.scene.model.seen);assert.equal(middleBand.scene.model.first,'8');assert.equal(middleBand.scene.model.region,1);
  for(const v of ['20','8','28','4 4/5','25/4','4,8']){await studentFrame.locator('#answer').fill(v);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('1008');await studentFrame.locator('#answer-form button').click();assert((await same(studentFrame,teacherFrame,'six cm square cells')).scene.correct);
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();await studentFrame.locator('a[href="#lesson/v5f-printed-5-25"]').click();await teacherFrame.locator('h1').filter({hasText:'№5.25'}).waitFor();
  await studentFrame.locator('#answer').fill('4');await studentFrame.locator('#answer-form button').click();assert.match((await same(studentFrame,teacherFrame,'empty jar missing on the scale')).scene.message,/и стекло/);
  for(const v of ['5','300']){await studentFrame.locator('#answer').fill(v);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('[data-v5-param=target]').selectOption({value:'2'});await studentFrame.locator('#answer').fill('12');
  await same(studentFrame,teacherFrame,'unfinished answer before reload');await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const jarDraft=await same(studentFrame,teacherFrame,'jar and honey step reconnected');assert.equal(jarDraft.scene.savedInput,'12');assert.equal(jarDraft.scene.model.target,2);
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'learner rejoins with the same draft');await teacherFrame.locator('#answer').fill('1200');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'net weight excluding glass')).scene.correct);await narrow(student,studentFrame,'cutting-board-and-honey');
  phase = 'source 5.26 and 5.27, undo the last change before the first and evaluate four expressions';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-26"]').click();await studentFrame.locator('h1').filter({hasText:'№5.26'}).waitFor();
  await teacherFrame.locator('#answer').fill('3');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'subtracting twice instead of undoing')).scene.message,/верни улетевших/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=story]').selectOption({value:'1'});await studentFrame.locator('[data-v5-param=back]').selectOption({value:'1'});await studentFrame.locator('[data-v5-param=focus]').selectOption({value:'1'});
  await studentFrame.locator('[data-v5-prediction]').fill('89');await studentFrame.locator('[data-v5-predict] button').click();await studentFrame.locator('[data-v5-prediction]').fill('31');await studentFrame.locator('[data-v5-predict] button').click();
  const reverseModel=await same(studentFrame,teacherFrame,'undo the arrival of books');assert(reverseModel.scene.model.seen);assert.equal(reverseModel.scene.model.first,'89');assert.equal(reverseModel.scene.model.story,1);
  for(const v of ['35','22','31']){await studentFrame.locator('#answer').fill(v);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('47');await studentFrame.locator('#answer-form button').click();assert((await same(studentFrame,teacherFrame,'initial number on the shelf')).scene.correct);
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();await studentFrame.locator('a[href="#lesson/v5f-printed-5-27"]').click();await teacherFrame.locator('h1').filter({hasText:'№5.27'}).waitFor();
  await studentFrame.locator('[data-v5-param=row]').selectOption({value:'2'});await studentFrame.locator('[data-v5-param=operation]').selectOption({value:'1'});await studentFrame.locator('#answer').fill('80');
  await same(studentFrame,teacherFrame,'draft of first quotient');await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const quotientDraft=await same(studentFrame,teacherFrame,'both contexts recover selected expression');assert.equal(quotientDraft.scene.savedInput,'80');assert.equal(quotientDraft.scene.model.row,2);assert.equal(quotientDraft.scene.model.operation,1);
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'pupil rejoins expression');await teacherFrame.locator('#answer').fill('802');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'first quotient corrected')).scene.correct);await narrow(student,studentFrame,'reverse-events-and-four-expressions');
  phase = 'source 5.28, compare a real observation with a written judgement about a sundial';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-28"]').click();await studentFrame.locator('h1').filter({hasText:'№5.28'}).waitFor();
  await teacherFrame.locator('summary').filter({hasText:'Моё объяснение о часах'}).click();const ownClockWords='Солнечным часам не нужна батарейка. В тёмную ночь у указателя нет солнечной тени. На обоих циферблатах сверяем положение с делениями.';await teacherFrame.locator('#v5-quality-note').fill(ownClockWords);
  const authoredClock=await same(teacherFrame,studentFrame,'own words stay separate from the first observation');assert.equal(authoredClock.scene.note,ownClockWords);assert.equal(authoredClock.scene.attempt,0);assert(!authoredClock.scene.correct);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=weather]').selectOption({value:'2'});await studentFrame.locator('[data-v5-prediction]').fill('1');await studentFrame.locator('[data-v5-predict] button').click();await studentFrame.locator('[data-v5-prediction]').fill('0');await studentFrame.locator('[data-v5-predict] button').click();
  const nightDial=await same(studentFrame,teacherFrame,'night model corrected from one solar shadow to zero');assert(nightDial.scene.model.seen);assert.equal(nightDial.scene.model.first,'1');assert.equal(nightDial.scene.model.weather,2);
  await studentFrame.locator('#answer').fill('12');await studentFrame.locator('#answer-form button').click();assert.match((await same(studentFrame,teacherFrame,'midday is not the present reading')).scene.message,/Полдень/);
  for(const v of ['10','1','1']){await studentFrame.locator('#answer').fill(v);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);const savedClock=await same(studentFrame,teacherFrame,'notes and night on teacher reload');assert.equal(savedClock.scene.note,ownClockWords);assert.equal(savedClock.scene.model.weather,2);
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'learner rejoins sundial lesson');await teacherFrame.locator('#answer').fill('2');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'both dials readable in sunshine')).scene.correct);await narrow(student,studentFrame,'sundial-shadows-and-own-observations');
  phase = 'source 5.29, a point can move to the boundary without leaving the disk';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-29"]').click();await studentFrame.locator('h1').filter({hasText:'№5.29'}).waitFor();
  await teacherFrame.locator('#answer').fill('6');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'diameter is twice the compass opening')).scene.message,/диаметр/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=boundary]').selectOption({value:'1'});await studentFrame.locator('[data-v5-param=region]').selectOption({value:'0'});
  await studentFrame.locator('[data-v5-prediction]').fill('2');await studentFrame.locator('[data-v5-predict] button').click();await studentFrame.locator('[data-v5-prediction]').fill('3');await studentFrame.locator('[data-v5-predict] button').click();
  const movedPoint=await same(studentFrame,teacherFrame,'P joins M and N on the circumference');assert(movedPoint.scene.model.seen);assert.equal(movedPoint.scene.model.first,'2');assert.equal(movedPoint.scene.model.boundary,1);
  for(const v of ['3','NM','R, K','K O P Q R']){await studentFrame.locator('#answer').fill(v);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('O P Q');await studentFrame.locator('#answer-form button').click();assert.match((await same(studentFrame,teacherFrame,'disk also includes boundary')).scene.message,/границе/);
  await studentFrame.locator('#answer').fill('O P Q M');await same(studentFrame,teacherFrame,'list of points still being edited');
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);const pointList=await same(studentFrame,teacherFrame,'four labels restored while composing');assert.equal(pointList.scene.savedInput,'O P Q M');assert.equal(pointList.scene.model.boundary,1);
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'pupil rejoins the same diagram');await teacherFrame.locator('#answer').fill('O P Q M N');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'all five members of the disk')).scene.correct);await narrow(student,studentFrame,'disk-and-circumference-membership');
  phase = 'source 5.30, make and keep the learners own three compass marks';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-30"]').click();await studentFrame.locator('h1').filter({hasText:'№5.30'}).waitFor();
  await teacherFrame.locator('[data-v5-param=m]').selectOption({value:'0'});await teacherFrame.locator('[data-v5-param=n]').selectOption({value:'3'});await teacherFrame.locator('[data-v5-param=k]').selectOption({value:'3'});
  assert.equal(await teacherFrame.locator('[data-v5-apply-drawing]').count(),0);await teacherFrame.locator('[data-v5-prediction]').fill('3');await teacherFrame.locator('[data-v5-predict] button').click();await teacherFrame.locator('[data-v5-prediction]').fill('1');await teacherFrame.locator('[data-v5-predict] button').click();
  const repeatedCompass=await same(teacherFrame,studentFrame,'M on D and two marks sharing a spot yield just one new point');assert(repeatedCompass.scene.model.seen);assert.equal(repeatedCompass.scene.model.first,'3');
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=m]').selectOption({value:'1'});await studentFrame.locator('[data-v5-param=k]').selectOption({value:'8'});await studentFrame.locator('[data-v5-apply-drawing]').click();
  const ownCompass=await same(studentFrame,teacherFrame,'three distinct directions chosen by the learner');assert.equal(ownCompass.scene.seed,600000+3*1728+144+3*12+8);assert.equal(ownCompass.scene.attempt,0);assert(!ownCompass.scene.correct);
  await studentFrame.locator('#answer').fill('8');await studentFrame.locator('#answer-form button').click();assert.match((await same(studentFrame,teacherFrame,'diameter instead of compass radius')).scene.message,/диаметр/);
  for(const v of ['4','4','3']){await studentFrame.locator('#answer').fill(v);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('3');await studentFrame.locator('#answer-form button').click();assert.match((await same(studentFrame,teacherFrame,'the given D belongs to the same circle')).scene.message,/находится и D/);
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);const compassDraft=await same(studentFrame,teacherFrame,'recovered the exact three angles and final error');assert.equal(compassDraft.scene.seed,ownCompass.scene.seed);assert.equal(compassDraft.scene.savedInput,'3');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'learner returns to the same three marks');await teacherFrame.locator('#answer').fill('4');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'new points and D counted')).scene.correct);await narrow(student,studentFrame,'build-three-compass-marks');
  phase = 'source 5.31 and 5.32, two intersections, an exterior gap and both tangencies';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-31"]').click();await studentFrame.locator('h1').filter({hasText:'№5.31'}).waitFor();
  for(const v of ['11','3']){await teacherFrame.locator('#answer').fill(v);await teacherFrame.locator('#answer-form button').click();await teacherFrame.locator('[data-cmd=next]').click();}
  await teacherFrame.locator('#answer').fill('1');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'learner has found only one of two crossings')).scene.message,/обе стороны/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=stage]').selectOption({value:'3'});await studentFrame.locator('[data-v5-param=distance]').selectOption({value:'3'});
  await studentFrame.locator('[data-v5-prediction]').fill('2');await studentFrame.locator('[data-v5-predict] button').click();await studentFrame.locator('[data-v5-prediction]').fill('1');await studentFrame.locator('[data-v5-predict] button').click();
  const internalContact=await same(studentFrame,teacherFrame,'internal tangency differs from an ordinary intersection');assert(internalContact.scene.model.seen);assert.equal(internalContact.scene.model.first,'2');assert.equal(internalContact.scene.model.distance,3);
  await studentFrame.locator('#answer').fill('2');await studentFrame.locator('#answer-form button').click();assert((await same(studentFrame,teacherFrame,'two crossings of the original circles')).scene.correct);
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();await studentFrame.locator('a[href="#lesson/v5f-printed-5-32"]').click();await teacherFrame.locator('h1').filter({hasText:'№5.32'}).waitFor();
  await studentFrame.locator('[data-v5-param=stage]').selectOption({value:'3'});await studentFrame.locator('[data-v5-param=distance]').selectOption({value:'1'});
  for(const v of ['7','2']){await studentFrame.locator('#answer').fill(v);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('2');await studentFrame.locator('#answer-form button').click();assert.match((await same(studentFrame,teacherFrame,'positive gap prevents contact')).scene.message,/не дотянулись/);
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);const originalGap=await same(studentFrame,teacherFrame,'original gap and selected external contact');assert.equal(originalGap.scene.model.distance,1);assert.equal(originalGap.scene.savedInput,'2');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'learner rejoins selected circle diagram');await teacherFrame.locator('#answer').fill('0');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'original circles are disjoint')).scene.correct);await narrow(student,studentFrame,'circle-intersections-and-gap');
  phase = 'source 5.33 and 5.34, distinguish a more precise estimate and solve the division equation';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-33"]').click();await studentFrame.locator('h1').filter({hasText:'№5.33'}).waitFor();
  await teacherFrame.locator('#answer').fill('24');await teacherFrame.locator('#answer-form button').click();await teacherFrame.locator('[data-cmd=next]').click();await teacherFrame.locator('#answer').fill('75,36');await teacherFrame.locator('#answer-form button').click();
  const finerEstimate=await same(teacherFrame,studentFrame,'a more precise estimate is not counted as a mathematical mistake');assert.equal(finerEstimate.scene.attempt,0);assert.match(finerEstimate.scene.message,/3,14/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=radius]').fill('8');await studentFrame.locator('[data-v5-param=radius]').press('Tab');await studentFrame.locator('[data-v5-prediction]').fill('24');await studentFrame.locator('[data-v5-predict] button').click();await studentFrame.locator('[data-v5-prediction]').fill('48');await studentFrame.locator('[data-v5-predict] button').click();
  const sixRadii=await same(studentFrame,teacherFrame,'six radii in three diameters');assert(sixRadii.scene.model.seen);assert.equal(sixRadii.scene.model.first,'24');
  for(const v of ['72','28']){await studentFrame.locator('#answer').fill(v);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('14');await studentFrame.locator('#answer-form button').click();assert((await same(studentFrame,teacherFrame,'radius in the second part')).scene.correct);
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();await studentFrame.locator('a[href="#lesson/v5f-printed-5-34"]').click();await teacherFrame.locator('h1').filter({hasText:'№5.34'}).waitFor();
  await studentFrame.locator('[data-v5-param=row]').selectOption({value:'3'});await studentFrame.locator('[data-v5-param=phase]').selectOption({value:'1'});
  for(const v of ['202','313','13','628','30855','46','33']){await studentFrame.locator('#answer').fill(v);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('33');await studentFrame.locator('#answer-form button').click();assert.match((await same(studentFrame,teacherFrame,'the bracket is the divisor, not the variable')).scene.message,/делитель/);
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);const finalEquation=await same(studentFrame,teacherFrame,'fourth equation and open brackets on reload');assert.equal(finalEquation.scene.model.row,3);assert.equal(finalEquation.scene.model.phase,1);assert.equal(finalEquation.scene.savedInput,'33');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'learner rejoins last equation');await teacherFrame.locator('#answer').fill('926');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'actual variable after opening the brackets')).scene.correct);await narrow(student,studentFrame,'coarse-estimates-and-four-equations');
  phase = 'source 5.35 and 5.36: all divisors and hidden layers';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-35"]').click();await studentFrame.locator('h1').filter({hasText:'№5.35'}).waitFor();
  await teacherFrame.locator('#answer').fill('22');await teacherFrame.locator('#answer-form button').click();
  assert.match((await same(teacherFrame,studentFrame,'ten full boxes instead of nine')).scene.message,/№10/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=offset]').selectOption('3');await studentFrame.locator('[data-v5-param=measure]').selectOption('1');await studentFrame.locator('[data-v5-prediction]').fill('6');await studentFrame.locator('[data-v5-predict] button').click();assert((await same(studentFrame,teacherFrame,'remainder of the other divisor')).scene.model.seen);
  for(const value of ['23','24','15;6']){await studentFrame.locator('#answer').fill(value);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('23;15;24;6');await studentFrame.locator('#answer-form button').click();assert((await same(studentFrame,teacherFrame,'both complete valid divisions')).scene.correct);
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();await studentFrame.locator('a[href="#lesson/v5f-printed-5-36"]').click();await teacherFrame.locator('h1').filter({hasText:'№5.36'}).waitFor();
  await studentFrame.locator('[data-v5-param=solid]').selectOption('3');await studentFrame.locator('[data-v5-param=layer]').selectOption('2');
  for(const value of ['4','24','10','100','100','1000','70']){await studentFrame.locator('#answer').fill(value);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('70');await studentFrame.locator('#answer-form button').click();assert.match((await same(studentFrame,teacherFrame,'one layer instead of all ten')).scene.message,/один слой/);
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);const restoredLayers=await same(studentFrame,teacherFrame,'view of the highlighted upper layer after reload');assert.equal(restoredLayers.scene.model.solid,3);assert.equal(restoredLayers.scene.model.layer,2);assert.equal(restoredLayers.scene.savedInput,'70');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'student rejoins last shape');await teacherFrame.locator('#answer').fill('700');await teacherFrame.locator('#answer-form button').click();const volume=await same(teacherFrame,studentFrame,'the pupil corrected the volume without displaying a hint');assert(volume.scene.correct&&volume.scene.assisted);assert.equal(volume.scene.attempt,2);assert.equal(volume.scene.firstWrong.value,'70');assert.deepEqual(volume.scene.hintLevels,{});await narrow(student,studentFrame,'hidden-layers');

  phase = 'source 5.37 to 5.39, measure the mass, restore the dividend, apply powers';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-37"]').click();await studentFrame.locator('h1').filter({hasText:'№5.37'}).waitFor();
  await teacherFrame.locator('#answer').fill('85000');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'known mass of one litre')).scene.message,/1000 г/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=litres]').fill('8');await studentFrame.locator('[data-v5-param=litres]').press('Tab');await studentFrame.locator('[data-v5-prediction]').fill('6000');await studentFrame.locator('[data-v5-predict] button').click();assert((await same(studentFrame,teacherFrame,'eight full litre measures')).scene.model.seen);
  for(const value of ['63750','63']){await studentFrame.locator('#answer').fill(value);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('63;750');await studentFrame.locator('#answer-form button').click();assert((await same(studentFrame,teacherFrame,'mass in mixed units')).scene.correct);
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();await studentFrame.locator('a[href="#lesson/v5f-printed-5-38"]').click();await teacherFrame.locator('h1').filter({hasText:'№5.38'}).waitFor();await studentFrame.locator('#answer').fill('41478');await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();await studentFrame.locator('#answer').fill('41480');await studentFrame.locator('#answer-form button').click();assert((await same(studentFrame,teacherFrame,'dividend includes two extra units')).scene.correct);
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();await studentFrame.locator('a[href="#lesson/v5f-printed-5-39"]').click();await teacherFrame.locator('h1').filter({hasText:'№5.39'}).waitFor();await studentFrame.locator('[data-v5-param=row]').selectOption('3');await studentFrame.locator('[data-v5-param=focus]').selectOption('1');
  for(const value of ['423300','605','62920','486220','3040728','5673','3244','2744','343','3087','7','441','729','216','513']){await studentFrame.locator('#answer').fill(value);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('513');await studentFrame.locator('#answer-form button').click();assert.match((await same(studentFrame,teacherFrame,'outside power still remains')).scene.message,/квадрат/);
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);const powerState=await same(studentFrame,teacherFrame,'cube and square after teacher reload');assert.equal(powerState.scene.model.row,3);assert.equal(powerState.scene.model.focus,1);assert.equal(powerState.scene.savedInput,'513');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'learner rejoins after handoff');await teacherFrame.locator('#answer').fill('263169');await teacherFrame.locator('#answer-form button').click();const square=await same(teacherFrame,studentFrame,'square of the difference');assert(square.scene.correct);assert.equal(square.scene.attempt,2);assert.deepEqual(square.scene.hintLevels,{});await narrow(student,studentFrame,'powers-and-brackets');

  phase = 'printed check for section 25: child-selected circle and two measured circles';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-check-25-1"]').click();await studentFrame.locator('h1').filter({hasText:'радиус и диаметр'}).waitFor();
  await teacherFrame.locator('#answer').fill('13');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'diameter is twice radius')).scene.message,/известная величина/);
  await ownership(teacher,student,true);for(const val of ['26','41','98','570']){await studentFrame.locator('#answer').fill(val);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}await studentFrame.locator('#answer').fill('26;41;98;570');await studentFrame.locator('#answer-form button').click();assert((await same(studentFrame,teacherFrame,'all four columns')).scene.correct);
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();await studentFrame.locator('a[href="#lesson/v5f-printed-check-25-2"]').click();await teacherFrame.locator('h1').filter({hasText:'внутри и снаружи'}).waitFor();
  await studentFrame.locator('[data-v5-param=phase]').selectOption('1');await studentFrame.locator('[data-v5-param=r]').selectOption('10');assert.equal(await studentFrame.locator('[data-v5-apply-drawing]').count(),0);await studentFrame.locator('[data-v5-param=r]').selectOption('8');await studentFrame.locator('[data-v5-param=t]').selectOption('0');await studentFrame.locator('[data-v5-apply-drawing]').click();const own=await same(studentFrame,teacherFrame,'the student chose R outside and T at the centre');assert(own.scene.seed>=650000);
  for(const val of ['4','3;1','3;1']){await studentFrame.locator('#answer').fill(val);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}await studentFrame.locator('#answer').fill('1;1;0');await studentFrame.locator('#answer-form button').click();assert((await same(studentFrame,teacherFrame,'off-circle distances')).scene.correct);
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();await studentFrame.locator('a[href="#lesson/v5f-printed-check-25-3"]').click();await teacherFrame.locator('h1').filter({hasText:'две окружности'}).waitFor();await studentFrame.locator('[data-v5-param=trial]').selectOption('1');await studentFrame.locator('[data-v5-prediction]').fill('1');await studentFrame.locator('[data-v5-predict] button').click();
  for(const val of ['30','32;28','60;4']){await studentFrame.locator('#answer').fill(val);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('1');await studentFrame.locator('#answer-form button').click();assert.match((await same(studentFrame,teacherFrame,'tangent model compared with the printed geometry')).scene.message,/касани/);
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);const circles=await same(studentFrame,teacherFrame,'measured opening and tangent replay after reload');assert.equal(circles.scene.model.trial,1);assert.equal(circles.scene.savedInput,'1');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'learner sees the same circles again');await teacherFrame.locator('#answer').fill('2');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'two intersections in the printed task')).scene.correct);await narrow(student,studentFrame,'printed-circle-check');

  phase = 'source 5.40 to 5.42: fractions of a line and area';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-40"]').click();await studentFrame.locator('h1').filter({hasText:'№5.40'}).waitFor();
  await teacherFrame.locator('#answer').fill('1');await teacherFrame.locator('#answer-form button').click();await teacherFrame.locator('[data-cmd=next]').click();await teacherFrame.locator('#answer').fill('3');await teacherFrame.locator('#answer-form button').click();await teacherFrame.locator('[data-cmd=next]').click();
  await teacherFrame.locator('#answer').fill('3/14');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'the same divided whole')).scene.message,/Знаменатель остаётся/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=shift]').selectOption({value:'2'});await studentFrame.locator('[data-v5-param=ask]').selectOption({value:'1'});await studentFrame.locator('[data-v5-prediction]').fill('4/7');await studentFrame.locator('[data-v5-predict] button').click();assert((await same(studentFrame,teacherFrame,'moving the painted intervals preserves the free fraction')).scene.model.seen);
  for(const val of ['3/7','4']){await studentFrame.locator('#answer').fill(val);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}await studentFrame.locator('#answer').fill('4/7');await studentFrame.locator('#answer-form button').click();assert((await same(studentFrame,teacherFrame,'four sevenths free')).scene.correct);
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();await studentFrame.locator('a[href="#lesson/v5f-printed-5-41"]').click();await teacherFrame.locator('h1').filter({hasText:'№5.41'}).waitFor();for(const val of ['1','3']){await studentFrame.locator('#answer').fill(val);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}await studentFrame.locator('#answer').fill('6/16');await studentFrame.locator('#answer-form button').click();assert((await same(studentFrame,teacherFrame,'equivalent fraction')).scene.correct);
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();await studentFrame.locator('a[href="#lesson/v5f-printed-5-42"]').click();await teacherFrame.locator('h1').filter({hasText:'№5.42'}).waitFor();
  await studentFrame.locator('[data-v5-param=pattern]').selectOption({value:'3'});await studentFrame.locator('[data-v5-param=selected]').selectOption({value:'4'});for(const val of ['324','3']){await studentFrame.locator('#answer').fill(val);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('3');await studentFrame.locator('#answer-form button').click();assert.match((await same(studentFrame,teacherFrame,'strip width versus area')).scene.message,/ширина/);
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);const fractionArea=await same(studentFrame,teacherFrame,'grid restored after reload');assert.equal(fractionArea.scene.model.pattern,3);assert.equal(fractionArea.scene.model.selected,4);assert.equal(fractionArea.scene.savedInput,'3');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'student rejoined grid');await teacherFrame.locator('#answer').fill('54');await teacherFrame.locator('#answer-form button').click();const sixth=await same(teacherFrame,studentFrame,'one sixth is 54 cells');assert(sixth.scene.correct);assert.deepEqual(sixth.scene.hintLevels,{});await narrow(student,studentFrame,'equal-area-regrouping');

  phase = 'source 5.43 and 5.44: named units and rotated equal quarters';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-43"]').click();await studentFrame.locator('h1').filter({hasText:'№5.43'}).waitFor();
  await teacherFrame.locator('#answer').fill('см');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'hundred centimetres in a metre')).scene.message,/Сантиметров/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=row]').selectOption({value:'6'});await studentFrame.locator('[data-v5-prediction]').fill('1000000');await studentFrame.locator('[data-v5-predict] button').click();assert((await same(studentFrame,teacherFrame,'a million cubic centimetres')).scene.model.seen);
  for(const v of ['дм','10кг','коп.','час','сек.','мм²','мл']){await studentFrame.locator('#answer').fill(v);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('сотка');await studentFrame.locator('#answer-form button').click();assert((await same(studentFrame,teacherFrame,'one are')).scene.correct);
  await studentFrame.locator('a[href="#course/vilenkin5"]').first().click();await studentFrame.locator('a[href="#lesson/v5f-printed-5-44"]').click();await teacherFrame.locator('h1').filter({hasText:'№5.44'}).waitFor();await studentFrame.locator('[data-v5-param=angle]').fill('28');await studentFrame.locator('[data-v5-param=angle]').press('Tab');await studentFrame.locator('[data-v5-param=count]').selectOption({value:'3'});
  for(const v of ['64','16','32']){await studentFrame.locator('#answer').fill(v);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('16');await studentFrame.locator('#answer-form button').click();assert.match((await same(studentFrame,teacherFrame,'three quarters and one quarter')).scene.message,/одна четверть/);
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);const cut=await same(studentFrame,teacherFrame,'quarter turn construction restored');assert.equal(cut.scene.model.angle,28);assert.equal(cut.scene.model.count,3);assert.equal(cut.scene.savedInput,'16');await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'pupil rejoins the same rotated model');await teacherFrame.locator('#answer').fill('48');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'three quarters of 64')).scene.correct);await narrow(student,studentFrame,'quarters-of-square');

  phase = 'source 5.45: say a fraction and distinguish the number of parts';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-45"]').click();await studentFrame.locator('h1').filter({hasText:'№5.45'}).waitFor();
  await teacherFrame.locator('#answer').fill('1/8');await teacherFrame.locator('#answer-form button').click();assert.equal((await same(teacherFrame,studentFrame,'reading numeric draft uses no attempt')).scene.attempt,0);
  await teacherFrame.locator('#answer').fill('две восьмых квадрата');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'misread numerator')).scene.message,/верхнее число/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=row]').selectOption({value:'1'});await studentFrame.locator('[data-v5-param=part]').selectOption({value:'1'});await studentFrame.locator('[data-v5-prediction]').fill('1000');await studentFrame.locator('[data-v5-predict] button').click();assert((await same(studentFrame,teacherFrame,'denominator of one thousandth')).scene.model.seen);
  for(const val of ['одну восьмую часть квадрата','одна тысячная тонны','одна двадцать четвёртая суток','половина огорода','четверть арбуза']){await studentFrame.locator('#answer').fill(val);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('треть кру');await studentFrame.locator('#answer').press('End');await same(studentFrame,teacherFrame,'unfinished words');
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);const oral=await same(studentFrame,teacherFrame,'words and denominator after teacher reload');assert.equal(oral.scene.model.row,1);assert.equal(oral.scene.savedInput,'треть кру');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'same unfinished final phrase');await teacherFrame.locator('#answer').fill('треть круга');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'natural name for one third')).scene.correct);await narrow(student,studentFrame,'reading-fractions');

  phase = 'source 5.46: thirteen figures, the hundred-cell square and both fractions';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-46"]').click();await studentFrame.locator('h1').filter({hasText:'№5.46'}).waitFor();
  await teacherFrame.locator('#answer').fill('2/3');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'colour versus the free part of the disk')).scene.message,/свободную долю/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=row]').selectOption({value:'7'});await studentFrame.locator('[data-v5-param=focus]').selectOption({value:'1'});await studentFrame.locator('[data-v5-prediction]').fill('9/50');await studentFrame.locator('[data-v5-predict] button').click();await studentFrame.locator('[data-v5-prediction]').fill('41/50');await studentFrame.locator('[data-v5-predict] button').click();
  const hundred=await same(studentFrame,teacherFrame,'18 shaded and 82 free out of 100');assert(hundred.scene.model.seen);assert.equal(hundred.scene.model.first,'9/50');
  for(const val of ['1/3','5/8','1','1/2','2/5','1/2','1/2','41/50','1/8;7/8','1/4;3/4','2/3;1/3','1/3;2/3']){await studentFrame.locator('#answer').fill(val);await studentFrame.locator('#answer-form button').click();await studentFrame.locator('[data-cmd=next]').click();}
  await studentFrame.locator('#answer').fill('5/7;2/7');await studentFrame.locator('#answer-form button').click();assert.match((await same(studentFrame,teacherFrame,'both correct fractions in reverse order')).scene.message,/поменялись/);
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);const restoredAtlas=await same(studentFrame,teacherFrame,'hundred-cell investigation restored');assert.equal(restoredAtlas.scene.model.row,7);assert.equal(restoredAtlas.scene.model.first,'9/50');assert.equal(restoredAtlas.scene.savedInput,'5/7;2/7');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'learner sees the last two-fraction answer');await teacherFrame.locator('#answer').fill('2/7;5/7');await teacherFrame.locator('#answer-form button').click();const atlasComplete=await same(teacherFrame,studentFrame,'coloured and free sevenths');assert(atlasComplete.scene.correct);assert.equal(atlasComplete.scene.attempt,2);await narrow(student,studentFrame,'thirteen-shaded-figures');

  phase = 'source 5.49: two fractions use different wholes';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-5-49"]').click();
  await studentFrame.locator('h1').filter({hasText:'№5.49'}).waitFor();
  for(const value of ['80','20','60']){
    await teacherFrame.locator('#answer').fill(value);
    await teacherFrame.locator('#answer-form button').click();
    await teacherFrame.locator('[data-cmd=next]').click();
  }
  await teacherFrame.locator('#answer').fill('80/3');await teacherFrame.locator('#answer-form button').click();
  const fullWalkThird=await same(teacherFrame,studentFrame,'third of the initial walk');
  assert.match(fullWalkThird.scene.message,/треть всей прогулки/);
  await ownership(teacher,student,true);
  await studentFrame.locator('[data-v5-param=scale]').selectOption({value:'1'});
  await studentFrame.locator('[data-v5-param=ask]').selectOption({value:'1'});
  await studentFrame.locator('[data-v5-prediction]').fill('40');await studentFrame.locator('[data-v5-predict] button').click();
  await studentFrame.locator('#answer').fill('20');await teacher.reload({waitUntil:'domcontentloaded'});
  await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const restoredWalk=await same(studentFrame,teacherFrame,'changed whole and hockey draft restored');
  assert.equal(restoredWalk.scene.savedInput,'20');assert.equal(restoredWalk.scene.model.scale,1);assert(restoredWalk.scene.model.seen);
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});
  await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'both participants return to the walk');
  await teacherFrame.locator('#answer-form button').click();const finalWalk=await same(teacherFrame,studentFrame,'twenty minutes of hockey');
  assert(finalWalk.scene.correct);assert.equal(finalWalk.scene.attempt,2);assert.deepEqual(finalWalk.scene.hintLevels,{});await narrow(student,studentFrame,'fraction-of-remaining-walk');

  phase = 'source 5.52: the exact fraction heard and the reversed numbers';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();
  await teacherFrame.locator('a[href="#lesson/v5f-printed-5-52"]').click();
  await studentFrame.locator('h1').filter({hasText:'№5.52'}).waitFor();
  await teacherFrame.locator('#answer').fill('1/2');await teacherFrame.locator('#answer-form button').click();
  const equivalentDictation=await same(teacherFrame,studentFrame,'equal value but a different transcription');
  assert.equal(equivalentDictation.scene.attempt,0);assert.equal(equivalentDictation.scene.firstWrong,null);
  await teacherFrame.locator('#answer').fill('8/4');await teacherFrame.locator('#answer-form button').click();
  assert.match((await same(teacherFrame,studentFrame,'inverted dictated fraction')).scene.message,/верх и низ/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=row]').selectOption({value:'6'});
  await studentFrame.locator('[data-v5-param=part]').selectOption({value:'1'});await studentFrame.locator('[data-v5-prediction]').fill('49');await studentFrame.locator('[data-v5-predict] button').click();
  await studentFrame.locator('#answer').fill('4/8');await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const restorationDictation=await same(studentFrame,teacherFrame,'written fraction, prior error and model after reconnect');assert.equal(restorationDictation.scene.savedInput,'4/8');assert.equal(restorationDictation.scene.model.row,6);assert(restorationDictation.scene.model.seen);
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);
  await same(teacherFrame,studentFrame,'pupil has the same draft after returning');
  await teacherFrame.locator('#answer-form button').click();const correctedDictation=await same(teacherFrame,studentFrame,'exact dictation corrected independently');
  assert(correctedDictation.scene.correct);assert.equal(correctedDictation.scene.attempt,2);assert.deepEqual(correctedDictation.scene.hintLevels,{});await narrow(student,studentFrame,'dictated-fraction');

  phase = 'source 5.54: February is not one twelfth of the year in days';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-54"]').click();
  await studentFrame.locator('h1').filter({hasText:'№5.54'}).waitFor();
  await teacherFrame.locator('#answer').fill('366');await teacherFrame.locator('#answer-form button').click();await teacherFrame.locator('[data-cmd=next]').click();
  await teacherFrame.locator('#answer').fill('1/12');await teacherFrame.locator('#answer-form button').click();
  const calendarWrong=await same(teacherFrame,studentFrame,'three months use one year in days');assert.match(calendarWrong.scene.message,/разное число дней/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=pick]').selectOption({value:'1'});await studentFrame.locator('[data-v5-param=modeIndex]').selectOption({value:'1'});
  await studentFrame.locator('[data-v5-prediction]').fill('335/366');await studentFrame.locator('[data-v5-predict] button').click();
  await studentFrame.locator('#answer').fill('29/366');await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const calendarReturn=await same(studentFrame,teacherFrame,'calendar for March and February draft restored');assert.equal(calendarReturn.scene.savedInput,'29/366');assert.equal(calendarReturn.scene.model.pick,1);assert(calendarReturn.scene.model.seen);
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'pupil reloads the leap year');
  await teacherFrame.locator('#answer-form button').click();const correctedFebruary=await same(teacherFrame,studentFrame,'the learner used 29 days');assert(correctedFebruary.scene.correct);assert.equal(correctedFebruary.scene.attempt,2);assert.deepEqual(correctedFebruary.scene.hintLevels,{});await narrow(student,studentFrame,'fraction-of-leap-year');

  phase = 'source 5.59: a team and the dogs left at the base';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-59"]').click();
  await studentFrame.locator('h1').filter({hasText:'№5.59'}).waitFor();
  for(const val of ['2','12']){await teacherFrame.locator('#answer').fill(val);await teacherFrame.locator('#answer-form button').click();await teacherFrame.locator('[data-cmd=next]').click();}
  await teacherFrame.locator('#answer').fill('12');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'team count versus dogs at the base')).scene.message,/которые остались/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=groups]').selectOption({value:'8'});await studentFrame.locator('[data-v5-param=ask]').selectOption({value:'1'});
  await studentFrame.locator('[data-v5-prediction]').fill('12');await studentFrame.locator('[data-v5-predict] button').click();await studentFrame.locator('#answer').fill('16');
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);const sledReturn=await same(studentFrame,teacherFrame,'restored dog groups and pupil draft');assert.equal(sledReturn.scene.savedInput,'16');assert(sledReturn.scene.model.seen);assert.equal(sledReturn.scene.model.groups,8);
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'recovered counting model');
  await teacherFrame.locator('#answer-form button').click();const sledFixed=await same(teacherFrame,studentFrame,'sixteen remained on base');assert(sledFixed.scene.correct);assert.equal(sledFixed.scene.attempt,2);assert.deepEqual(sledFixed.scene.hintLevels,{});await narrow(student,studentFrame,'polar-dog-groups');

  phase = 'source 5.63: two kilometres represent four ninths';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-63"]').click();
  await studentFrame.locator('h1').filter({hasText:'№5.63'}).waitFor();
  await teacherFrame.locator('#answer').fill('2/9');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'divide the known section by four')).scene.message,/число закрашенных долей/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=count]').selectOption({value:'7'});await studentFrame.locator('[data-v5-prediction]').fill('3,5');await studentFrame.locator('[data-v5-predict] button').click();
  await studentFrame.locator('#answer').fill('0,5');await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const avenueDraft=await same(studentFrame,teacherFrame,'restored segment, selected seven ninths and draft');assert(avenueDraft.scene.model.seen);assert.equal(avenueDraft.scene.model.count,7);assert.equal(avenueDraft.scene.savedInput,'0,5');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);
  await same(teacherFrame,studentFrame,'two fractions of one avenue');await teacherFrame.locator('#answer-form button').click();const unitNinth=await same(teacherFrame,studentFrame,'one ninth equals half a kilometre');assert(unitNinth.scene.correct);assert.equal(unitNinth.scene.attempt,2);
  await teacherFrame.locator('[data-cmd=next]').click();await teacherFrame.locator('#answer').fill('4,5');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'four and one half kilometres as a whole')).scene.correct);await narrow(student,studentFrame,'avenue-from-four-ninths');

  phase = 'source 5.68: decrease by or divide by one hundred';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-68"]').click();
  await studentFrame.locator('h1').filter({hasText:'№5.68'}).waitFor();
  await teacherFrame.locator('#answer').fill('10000');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'one hundredth of a million')).scene.correct);
  await teacherFrame.locator('[data-cmd=next]').click();await teacherFrame.locator('#answer').fill('9000');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'subtract a thousand')).scene.correct);
  await teacherFrame.locator('[data-cmd=next]').click();await teacherFrame.locator('#answer').fill('8900');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'division error')).scene.message,/деление/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=line]').selectOption({value:'2'});await studentFrame.locator('[data-v5-prediction]').fill('90');await studentFrame.locator('[data-v5-predict] button').click();
  await studentFrame.locator('#answer').fill('90');await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const reductionDraft=await same(studentFrame,teacherFrame,'restored third operation and draft');assert(reductionDraft.scene.model.seen);assert.equal(reductionDraft.scene.model.line,2);assert.equal(reductionDraft.scene.savedInput,'90');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);
  await same(teacherFrame,studentFrame,'restore both roles after handoff');await teacherFrame.locator('#answer-form button').click();const divisionCorrected=await same(teacherFrame,studentFrame,'corrected to ninety');assert(divisionCorrected.scene.correct);assert.equal(divisionCorrected.scene.attempt,2);await narrow(student,studentFrame,'subtract-or-divide');

  phase = 'source 5.70: disk and boundary have the same maximum distance';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-70"]').click();
  await studentFrame.locator('h1').filter({hasText:'№5.70'}).waitFor();
  await teacherFrame.locator('#answer').fill('возможно');await teacherFrame.locator('#answer-form button').click();const chordDraft=await same(teacherFrame,studentFrame,'ambiguous draft');assert.equal(chordDraft.scene.attempt,0);
  await teacherFrame.locator('#answer').fill('нет');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'shorter than diameter')).scene.message,/короткого отрезка/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=choice]').selectOption({value:'6'});await studentFrame.locator('[data-v5-prediction]').fill('20');await studentFrame.locator('[data-v5-predict] button').click();
  await studentFrame.locator('#answer').fill('ДА');await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const chordLong=await same(studentFrame,teacherFrame,'restored impossible fourteen centimetres model');assert(chordLong.scene.model.seen);assert.equal(chordLong.scene.model.choice,6);assert.equal(chordLong.scene.savedInput,'ДА');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);
  await same(teacherFrame,studentFrame,'restored both chord calculations');await teacherFrame.locator('#answer-form button').click();assert.equal((await same(teacherFrame,studentFrame,'recognise the short chord')).scene.attempt,2);
  await teacherFrame.locator('[data-cmd=next]').click();await teacherFrame.locator('#answer').fill('да');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'one millimetre fits')).scene.correct);await narrow(student,studentFrame,'one-millimetre-chord');

  phase = 'source 5.74: real time from the mirrored hands';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-74"]').click();
  await studentFrame.locator('h1').filter({hasText:'№5.74'}).waitFor();
  await teacherFrame.locator('#answer').fill('7:70');await teacherFrame.locator('#answer-form button').click();assert.equal((await same(teacherFrame,studentFrame,'unfinished clock reading')).scene.attempt,0);
  await teacherFrame.locator('#answer').fill('7:00');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'read reflection as real')).scene.message,/другую сторону/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=index]').selectOption({value:'4'});await studentFrame.locator('[data-v5-param=show]').selectOption({value:'1'});
  await studentFrame.locator('[data-v5-prediction]').fill('40');await studentFrame.locator('[data-v5-predict] button').click();await studentFrame.locator('#answer').fill('5:00');
  await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const mirrorWork=await same(studentFrame,teacherFrame,'restored two dials and first attempt');assert(mirrorWork.scene.model.seen);assert.equal(mirrorWork.scene.model.index,4);assert.equal(mirrorWork.scene.model.show,1);assert.equal(mirrorWork.scene.savedInput,'5:00');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);
  await same(teacherFrame,studentFrame,'restored reflected time');await teacherFrame.locator('#answer-form button').click();const reflected=await same(teacherFrame,studentFrame,'seven and five reflected in vertical axis');assert(reflected.scene.correct);assert.equal(reflected.scene.attempt,2);await narrow(student,studentFrame,'reflected-clocks');

  phase = 'source 5.77: draw equal radii on both sides of tangency';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-77"]').click();
  await studentFrame.locator('h1').filter({hasText:'№5.77'}).waitFor();
  await teacherFrame.locator('#answer').fill('4');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'radius four for tangency')).scene.correct);
  await teacherFrame.locator('[data-cmd=next]').click();await teacherFrame.locator('#answer').fill('4');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'tangent circles are not separate')).scene.message,/касаются/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=a]').fill('39');await studentFrame.locator('[data-v5-param=a]').press('Tab');await studentFrame.locator('[data-v5-param=mark]').selectOption({value:'1'});
  await studentFrame.locator('[data-v5-prediction]').fill('0');await studentFrame.locator('[data-v5-predict] button').click();await studentFrame.locator('#answer').fill('3,9');await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const twoCircleState=await same(studentFrame,teacherFrame,'restore both student circles');assert.equal(twoCircleState.scene.model.a,39);assert(twoCircleState.scene.model.seen);assert.equal(twoCircleState.scene.savedInput,'3,9');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);
  await same(teacherFrame,studentFrame,'both radii and draft survive');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'accept any positive radius under four')).scene.correct);
  await teacherFrame.locator('[data-cmd=next]').click();await teacherFrame.locator('#answer').fill('4,01');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'accept any radius greater than four')).scene.correct);await narrow(student,studentFrame,'two-equal-circle-radii');

  phase = 'source 5.78: wall length, rows and layers';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-78"]').click();
  await studentFrame.locator('h1').filter({hasText:'№5.78'}).waitFor();
  for(const v of ['400','12','4800','10']){await teacherFrame.locator('#answer').fill(v);await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'wall unit '+v)).scene.correct);await teacherFrame.locator('[data-cmd=next]').click();}
  await teacherFrame.locator('#answer').fill('4800');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'one layer as entire wall')).scene.message,/нижний слой/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=count]').selectOption({value:'2'});await studentFrame.locator('[data-v5-prediction]').fill('9600');await studentFrame.locator('[data-v5-predict] button').click();
  await studentFrame.locator('#answer').fill('48000');await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const wallDraft=await same(studentFrame,teacherFrame,'two layers and draft restored');assert(wallDraft.scene.model.seen);assert.equal(wallDraft.scene.model.count,2);assert.equal(wallDraft.scene.savedInput,'48000');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);await same(teacherFrame,studentFrame,'both wall views restored');
  await teacherFrame.locator('#answer-form button').click();const fullWall=await same(teacherFrame,studentFrame,'all ten layers');assert(fullWall.scene.correct);assert.equal(fullWall.scene.attempt,2);await narrow(student,studentFrame,'all-wall-layers');

  phase = 'source 5.82: draw at the specified radius and shade your own sectors';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-82"]').click();await studentFrame.locator('h1').filter({hasText:'№5.82'}).waitFor();
  await teacherFrame.locator('#answer').fill('3');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'radius three')).scene.correct);await teacherFrame.locator('[data-cmd=next]').click();
  await teacherFrame.locator('#answer').fill('1');await teacherFrame.locator('#answer-form button').click();assert.equal((await same(teacherFrame,studentFrame,'number alone never completes a drawing')).scene.attempt,0);
  await teacherFrame.locator('[data-v5-param=radius]').selectOption({value:'3'});await teacherFrame.locator('[data-v5-sector="2"]').focus();await teacherFrame.locator('[data-v5-sector="2"]').press('Enter');
  await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'quarter completed by keyboard')).scene.correct);await teacherFrame.locator('[data-cmd=next]').click();
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=part]').selectOption({value:'1'});
  for(const i of [0,2,4,5,7]){const sector=studentFrame.locator('[data-v5-sector="'+i+'"]');await sector.focus();await sector.press('Space');}
  await studentFrame.locator('[data-v5-prediction]').fill('5/8');await studentFrame.locator('[data-v5-predict] button').click();await studentFrame.locator('#answer').fill('5');await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const savedSectors=await same(studentFrame,teacherFrame,'restore five nonadjacent eighths plus earlier quarter');assert(savedSectors.scene.model.seen);assert.equal(savedSectors.scene.model.bitsA,4);assert.equal(savedSectors.scene.model.bitsB,181);assert.equal(savedSectors.scene.savedInput,'5');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);
  await same(teacherFrame,studentFrame,'two shaded drawings after both reloads');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'check completed eighths drawing')).scene.correct);await narrow(student,studentFrame,'five-of-eight-sectors');

  phase = 'source 5.84: three eighths and one third of the same square';
  await teacherFrame.locator('a[href="#course/vilenkin5"]').first().click();await teacherFrame.locator('a[href="#lesson/v5f-printed-5-84"]').click();await studentFrame.locator('h1').filter({hasText:'№5.84'}).waitFor();
  await teacherFrame.locator('#answer').fill('4,5');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'one eighth of the square')).scene.correct);
  await teacherFrame.locator('[data-cmd=next]').click();await teacherFrame.locator('#answer').fill('4,5');await teacherFrame.locator('#answer-form button').click();assert.match((await same(teacherFrame,studentFrame,'one eighth used for three eighths')).scene.message,/три таких части/);
  await ownership(teacher,student,true);await studentFrame.locator('[data-v5-param=eighths]').selectOption({value:'3'});await studentFrame.locator('[data-v5-prediction]').fill('13,5');await studentFrame.locator('[data-v5-predict] button').click();
  await studentFrame.locator('#answer').fill('27/2');await teacher.reload({waitUntil:'domcontentloaded'});await waitConnected(teacher);teacherFrame=await frameFor(teacher);
  const areaDraft=await same(studentFrame,teacherFrame,'restore exact half square and three strips');assert(areaDraft.scene.model.seen);assert.equal(areaDraft.scene.model.eighths,3);assert.equal(areaDraft.scene.savedInput,'27/2');
  await ownership(teacher,student,false);await student.reload({waitUntil:'domcontentloaded'});await waitConnected(student);studentFrame=await frameFor(student);
  await same(teacherFrame,studentFrame,'keep three eighths on handoff');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'accept exact fractional area')).scene.correct);
  await teacherFrame.locator('[data-cmd=next]').click();await teacherFrame.locator('[data-v5-param=division]').selectOption({value:'1'});await teacherFrame.locator('#answer').fill('12');await teacherFrame.locator('#answer-form button').click();assert((await same(teacherFrame,studentFrame,'third of the original 36')).scene.correct);await narrow(student,studentFrame,'fractional-square-area');

  phase = 'tank dimensions and a fractional litre';
  await lesson(teacherFrame, 'v5f-volume-litres');
  await same(teacherFrame, studentFrame, 'tank diagram before predicting');
  assert.equal(await studentFrame.locator('#model .g5-lab-visual svg').count(), 2);
  await teacherFrame.locator('#g5-lab-volume-2').press('ArrowLeft');
  const lower = await same(teacherFrame, studentFrame, 'three five-centimetre layers');
  assert.equal(lower.scene.model.h, 3);
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
    await Promise.race([run(browser, origin, backend, []), new Promise((_, fail) => { watchdog = setTimeout(() => fail(new Error('Browser gate exceeded 15 minutes at ' + phase)), 15 * 60_000); })]);
  } finally {
    clearTimeout(watchdog); await browser?.close(); if (child && child.exitCode === null) child.kill('SIGTERM'); await new Promise(done => server.close(done));
  }
})().catch(error => { console.error('VILENKIN5_BOARD_BROWSER_FAILED at ' + phase + '\n' + (error.stack || error)); process.exitCode = 1; });
