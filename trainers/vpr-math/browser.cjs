'use strict';

// Real production board host + SDK, two isolated Chromium contexts and the
// actual local room service. Course actions use native UI events. No production
// rooms, pupils, credentials, or personal-service endpoints are used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const Data = require('./data.js');
const Core = require('./core.js');
const ROOT = path.resolve(__dirname, '../..');
const URL_PATH = '/trainers/vpr-math/index.html';
const STORE = 'mathexam.vpr2027.offline.v1';
const SCREENSHOTS = process.env.VPR_SCREENSHOT_DIR;
const errors = [], pages = [];
let browser, child;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const site = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let file = path.resolve(ROOT, '.' + decodeURIComponent(url.pathname));
    if (!file.startsWith(ROOT + path.sep)) throw new Error('Outside test site');
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});

async function freePort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve); });
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve)); return port;
}

async function shot(page, name) {
  if (!SCREENSHOTS || page.isClosed()) return;
  fs.mkdirSync(SCREENSHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SCREENSHOTS, name + '.png'), fullPage: false });
}

async function pageFor(context, name) {
  const page = await context.newPage();
  page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(name + ': ' + error.message));
  pages.push({ page, name }); return page;
}

async function trainerFrame(page, connected = true) {
  if (connected) await page.waitForFunction(() => document.querySelector('#mirrorStatus')?.dataset.mirrorStatus === 'connected');
  await page.waitForFunction(() => document.querySelector('#frame')?.contentWindow?.VPRBoard ||
    [...document.querySelectorAll('iframe')].some(frame => { try { return !!frame.contentWindow.VPRBoard; } catch (_) { return false; } }));
  const frame = page.frames().find(candidate => candidate.url().includes('/vpr-math/'));
  assert.ok(frame, 'The production host contains the VPR trainer');
  await frame.waitForFunction(() => typeof getBoardTrainerState === 'function');
  return frame;
}

const state = frame => frame.evaluate(() => getBoardTrainerState());
const visible = frame => frame.evaluate(() => {
  const q = selector => document.querySelector(selector);
  return { condition: q('.task-prompt')?.textContent, current: q('.step.current h3')?.textContent,
    answers: [...document.querySelectorAll('[data-answer]')].map(el => el.value),
    choices: [...document.querySelectorAll('[role=radio][aria-checked=true]')].map(el => el.textContent),
    feedback: [...document.querySelectorAll('.feedback')].map(el => el.textContent),
    solved: [...document.querySelectorAll('.step.done')].map(el => el.textContent),
    notes: q('#task-notes')?.value, graph: q('#interactive-plot')?.outerHTML,
    details: [...document.querySelectorAll('details')].map(el => ({ className: el.className, open: el.open })) };
});

async function same(a, b) {
  const expected = await state(a);
  await b.waitForFunction(value => JSON.stringify(getBoardTrainerState()) === JSON.stringify(value), expected);
  assert.deepEqual(await visible(b), await visible(a), 'The peer renders the same condition, steps, work and panels');
}

async function action(a, b, perform) {
  const before = JSON.stringify(await state(a));
  await perform();
  await a.waitForFunction(value => JSON.stringify(getBoardTrainerState()) !== value, before);
  await same(a, b);
}

async function selectTask(frame, route, lesson, task, mode = 'learn') {
  await frame.locator('[data-action=home]').first().click();
  await frame.locator('.course [data-action=route][data-route="' + route + '"]').click();
  await frame.locator('.lesson-card[data-lesson="' + lesson + '"]').click();
  await frame.locator('.task-tabs [data-task="' + task + '"]').click();
  if (mode === 'solo') await frame.locator('[data-action=mode][data-mode=solo]').click();
  await frame.waitForFunction(({ task, mode }) => VPRApp.getView().task === task && VPRApp.getView().mode === mode, { task, mode });
}

async function answer(frame, step) {
  if (step.answer.kind === 'choice') await frame.locator('.step.current [data-action=choice][data-choice="' + step.answer.value + '"]').click();
  else await frame.locator('.step.current [data-answer]').fill(Core.format(step.answer, step.options));
  await frame.locator('.step.current [data-action=check]').click();
}

async function privateAudit(frame, expected) {
  const audit = await frame.evaluate(key => ({ reads: __vprStorageAudit.reads, writes: __vprStorageAudit.writes,
    saved: __vprReadSaved(key), state: getBoardTrainerState(), personal: VPRApp.snapshot() }), STORE);
  assert.equal(audit.reads, 0, 'Shared trainer does not read browser storage');
  assert.equal(audit.writes, 0, 'Shared trainer does not write browser storage');
  assert.equal(audit.saved, expected, 'Personal practice remains byte-for-byte unchanged');
  assert.equal(JSON.stringify(audit.state).includes('PRIVATE-ONLY'), false, 'Private sentinel never enters the shared snapshot');
  assert.deepEqual(audit.personal.achievements, {}); assert.deepEqual(audit.personal.diagnostics, {}); assert.equal(audit.personal.session, null);
}

async function layout(page, label, illustration = false) {
  const geometry = await page.evaluate(() => {
    const rect = selector => { const box = document.querySelector(selector)?.getBoundingClientRect(); return box ? { top: box.top, bottom: box.bottom, width: box.width, height: box.height } : null; };
    return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
      condition: rect('.task-prompt'), illustration: rect('.diagram svg') };
  });
  assert.ok(geometry.scrollWidth <= geometry.width, label + ': no horizontal overflow ' + JSON.stringify(geometry));
  assert.ok(geometry.condition && geometry.condition.bottom <= geometry.height, label + ': complete condition in the first viewport ' + JSON.stringify(geometry));
  if (illustration) assert.ok(geometry.illustration && geometry.illustration.bottom <= geometry.height, label + ': complete required illustration in the first viewport ' + JSON.stringify(geometry));
}

(async () => {
  try {
    await new Promise((resolve, reject) => { site.once('error', reject); site.listen(0, '127.0.0.1', resolve); });
    const origin = 'http://127.0.0.1:' + site.address().port, port = await freePort();
    const env = { ...process.env, HOST: '127.0.0.1', PORT: String(port) };
    delete env.TRAINER_REGISTRY_PATH; delete env.PROGRESS_STORE_PATH; delete env.PROGRESS_PERSISTENCE_CONFIRMED;
    child = spawn(process.execPath, ['index.js'], { cwd: path.join(ROOT, 'board-server'), env, stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = ''; child.stderr.on('data', chunk => { stderr += chunk; });
    const backend = 'http://127.0.0.1:' + port;
    let ready = false;
    for (let i = 0; i < 150; i++) { try { if ((await fetch(backend + '/health')).ok) { ready = true; break; } } catch (_) {} await pause(50); }
    assert.ok(ready, 'Local room service starts: ' + stderr);
    browser = await chromium.launch({ headless: true });
    const teacherContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const studentContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const privateTask = Data.lessons.find(lesson => lesson.id === 'g6-geometry').tasks[0];
    const privateAttempt = Core.blank(privateTask, 'learn'); privateAttempt.notes = 'PRIVATE-ONLY independent work';
    const seed = JSON.stringify({ version: 1, attempts: { ['learn:' + privateTask.id]: privateAttempt } });
    for (const context of [teacherContext, studentContext]) await context.addInitScript(({ origin, key, seed }) => {
      if (location.origin !== origin) return;
      const originalGet = Storage.prototype.getItem, originalSet = Storage.prototype.setItem;
      if (originalGet.call(localStorage, key) === null) originalSet.call(localStorage, key, seed);
      const audit = window.__vprStorageAudit = { reads: 0, writes: 0 };
      window.__vprReadSaved = name => originalGet.call(localStorage, name);
      Storage.prototype.getItem = function (...args) { audit.reads++; return originalGet.apply(this, args); };
      Storage.prototype.setItem = function (...args) { audit.writes++; return originalSet.apply(this, args); };
      for (const name of ['removeItem', 'clear']) { const original = Storage.prototype[name]; Storage.prototype[name] = function (...args) { audit.writes++; return original.apply(this, args); }; }
    }, { origin, key: STORE, seed });

    const teacher = await pageFor(teacherContext, 'teacher'), student = await pageFor(studentContext, 'pupil');
    await teacher.goto(origin + URL_PATH + '?route=g5&lesson=g5-natural&task=g5-natural-3&mode=learn');
    await teacher.waitForFunction(() => VPRApp.getView().task === 'g5-natural-3');
    const boardURL = new URL(await teacher.locator('#open-board').getAttribute('href'), teacher.url());
    assert.equal(boardURL.searchParams.get('trainer'), URL_PATH + '?route=g5&lesson=g5-natural&task=g5-natural-3&mode=learn');
    const teacherPersonal = await teacher.evaluate(key => localStorage.getItem(key), STORE);
    // Only choose the local test backend; keep the actual public navigation link.
    await teacher.locator('#open-board').evaluate((link, server) => { const url = new URL(link.href); url.searchParams.set('server', server); link.href = url.href; }, backend);
    await teacher.locator('#open-board').click();
    let a = await trainerFrame(teacher, false);
    assert.equal((await state(a)).view.task, 'g5-natural-3');

    // The shared SDK has not hydrated yet. Room creation seeds/reloads this
    // iframe, so the existing host preparation must retain this changed task.
    await a.locator('.task-tabs [data-task=g5-natural-4]').click();
    await a.locator('.step.current [data-answer]').fill('17/');
    await a.locator('.notes > summary').click();
    await a.locator('#task-notes').fill('Черновик до создания комнаты');
    // Native details dispatches its toggle in a later task. Observe that event
    // boundary before using the pre-room snapshot as the exact restore oracle.
    await a.waitForFunction(() => {
      const current = getBoardTrainerState();
      return current.panels.notes === true && current.attempt.answers[0] === '17/' &&
        current.attempt.notes === 'Черновик до создания комнаты';
    });
    const prepared = await state(a);
    await privateAudit(a, teacherPersonal);
    await teacher.locator('#openShare').click();
    await teacher.locator('#createRoom').click();
    await teacher.waitForFunction(() => document.querySelector('#studentLink').value.includes('room='));
    const studentURL = await teacher.locator('#studentLink').inputValue();
    await teacher.keyboard.press('Escape');
    await student.goto(studentURL);
    a = await trainerFrame(teacher); let b = await trainerFrame(student);
    await same(a, b); assert.deepEqual(await state(a), prepared, 'Changed task, draft and notes survive room creation');
    const studentPersonal = await student.evaluate(key => __vprReadSaved(key), STORE);
    assert.equal((await state(a)).view.task, 'g5-natural-4');
    assert.equal(new URL(a.url()).searchParams.get('task'), 'g5-natural-4');
    assert.equal(a.url().includes('Черновик'), false);
    await action(a, b, () => a.locator('.step.current [data-action=check]').click());
    assert.ok((await state(b)).feedback.text.includes('Введи число'));
    await action(a, b, async () => { await a.locator('.step.current [data-answer]').fill('-1'); await a.locator('.step.current [data-action=check]').click(); });
    await action(a, b, () => a.locator('.step.current [data-action=check]').click());
    await action(a, b, () => a.locator('[data-action=hint]').click());
    await action(a, b, () => a.locator('[data-action=solution]').click());
    await action(a, b, () => a.locator('.theory > summary').click());
    const observerState = await state(b);
    await assert.rejects(() => b.locator('[data-action=restart]').click({ timeout: 400 }), /Timeout/);
    assert.deepEqual(await state(b), observerState, 'The actual host inert lock blocks observer clicks');

    await action(a, b, () => selectTask(a, 'g10', 'g10-graphs-build', 'g10-graphs-build-1'));
    await action(a, b, () => a.locator('.plot-lab > summary').click());
    for (const [x, y] of [[1, -3], [0, -2], [2, -2]]) await action(a, b, async () => {
      await a.locator('#plot-x').fill(String(x)); await a.locator('#plot-y').fill(String(y)); await a.locator('[data-action=plot-add]').click();
    });
    assert.equal(await b.locator('[data-user-curve]').count(), 1);
    const graphTask = Data.lessons.find(lesson => lesson.id === 'g10-graphs-build').tasks[0];
    for (const step of graphTask.steps) await action(a, b, () => answer(a, step));
    await shot(teacher, 'shared-teacher'); await shot(student, 'shared-pupil');

    await teacher.locator('#boardControlToggle').click();
    await student.waitForFunction(() => canWrite());
    await action(b, a, () => selectTask(b, 'g6', 'g6-geometry', 'g6-geometry-3', 'solo'));
    await action(b, a, () => b.locator('.step.current [data-answer]').fill('-3;'));
    await action(b, a, () => b.locator('.notes > summary').click());
    await action(b, a, () => b.locator('#task-notes').fill('Общая симметрия: x → −x, y → −y'));
    const reconnectState = await state(b);
    await privateAudit(a, teacherPersonal); await privateAudit(b, studentPersonal);

    // Shared board ink remains independent of the trainer's semantic snapshot.
    const canvas = student.locator('#canvas'); await canvas.scrollIntoViewIfNeeded(); const box = await canvas.boundingBox();
    await student.mouse.move(box.x + 70, box.y + 80); await student.mouse.down();
    await student.mouse.move(box.x + 190, box.y + 120, { steps: 8 }); await student.mouse.up();
    await teacher.waitForFunction(() => publicSnapshot().pages[0].strokes.length > 0);
    const strokes = page => page.evaluate(() => publicSnapshot().pages[0].strokes.map(({ createdAt, ...value }) => value));
    assert.deepEqual(await strokes(teacher), await strokes(student));
    await student.reload(); b = await trainerFrame(student);
    await same(a, b); assert.deepEqual(await state(b), reconnectState); assert.deepEqual(await strokes(teacher), await strokes(student));
    await privateAudit(b, studentPersonal);
    await teacher.reload(); a = await trainerFrame(teacher); await same(a, b);
    await privateAudit(a, teacherPersonal);
    await teacher.locator('#boardControlToggle').click(); await student.waitForFunction(() => canWrite());
    await action(b, a, async () => { await b.locator('.step.current [data-answer]').fill('-3; 2'); await b.locator('.step.current [data-action=check]').click(); });
    assert.equal((await state(a)).attempt.solved.at(-1), true);
    await shot(teacher, 'shared-reconnected-teacher'); await shot(student, 'shared-reconnected-pupil');

    const mobile = await pageFor(teacherContext, 'practice');
    for (const [width, height] of [[320, 900], [390, 844], [1280, 900]]) {
      await mobile.setViewportSize({ width, height });
      await mobile.goto(origin + '/vpr/');
      assert.equal(await mobile.locator('[data-vpr-route]').count(), 7, 'The public catalogue contains all seven routes');
      for (const route of Data.routes) assert.equal(await mobile.locator('[data-vpr-route="' + route.id + '"] .vpr-open').getAttribute('href'), URL_PATH + '?route=' + route.id);
      assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'VPR catalogue has no horizontal overflow at ' + width);
      await shot(mobile, 'vpr-catalog-' + width + 'x' + height);
      for (const route of Data.routes) {
        const lesson = Data.lessons.find(item => item.id === route.lessonIds[0]), task = lesson.tasks[0];
        const query = new URLSearchParams({ route: route.id, lesson: lesson.id, task: task.id, mode: 'learn' });
        await mobile.goto(origin + URL_PATH + '?' + query);
        await mobile.waitForFunction(taskId => VPRApp.getView().task === taskId, task.id);
        assert.equal(await mobile.evaluate(() => VPRApp.getView().route), route.id, 'Every public course query selects the requested route');
        await layout(mobile, route.id + ' at ' + width, !!task.svg);
      }
      await mobile.goto(origin + URL_PATH + '?route=g6&lesson=g6-geometry&task=g6-geometry-2&mode=learn');
      await mobile.waitForFunction(() => VPRApp.getView().task === 'g6-geometry-2');
      await layout(mobile, 'symmetry at ' + width, true);
      await shot(mobile, 'vpr-' + width + 'x' + height);
      await mobile.locator('[data-action=mode][data-mode=solo]').click();
      assert.equal(await mobile.locator('[data-action=hint]').count(), 0);
      assert.equal(await mobile.locator('.theory').count(), 0);
      await mobile.locator('.notes > summary').click();
      await mobile.locator('#task-notes').fill('Самостоятельное решение ' + width);
      await mobile.reload(); await mobile.locator('.notes > summary').click();
      assert.equal(await mobile.locator('#task-notes').inputValue(), 'Самостоятельное решение ' + width);
    }
    assert.deepEqual(errors, [], 'No browser runtime exceptions');
    console.log('VPR_BROWSER_OK: seven routes, public selected-task link, pre-room draft, full host/SDK/Socket.IO, roles, graph, tuple, notes, ink, both reloads, private isolation, and 320/390/1280 layout');
  } catch (error) {
    for (const { page, name } of pages) { try { await shot(page, 'failure-' + name); } catch (_) {} }
    throw error;
  } finally {
    if (browser) await browser.close();
    if (child && child.exitCode === null) child.kill();
    if (site.listening) await new Promise(resolve => site.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
