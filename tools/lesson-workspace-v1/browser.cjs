'use strict';

// Real cabinet + real managed trainer + real SQLite, in isolated role contexts.
// This must run in Chromium. DOM or source markers never count as browser evidence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { randomUUID, createHash } = require('node:crypto');
const { chromium } = require('playwright');
const { ROOT, fixture, serve, learningSnapshot, copy } = require('./fixture.cjs');
const artifactDir = path.resolve(process.env.LESSON_WORKSPACE_ARTIFACTS || fs.mkdtempSync(path.join(os.tmpdir(), 'lesson-workspace-evidence-')));
fs.mkdirSync(artifactDir, { recursive: true });
const checks = [], layout = [], layoutFailures = [], screenshots = [], errors = [], blockedExternal = [];
const observedHydrates = [];
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let phase = 'initialization';

async function until(predicate, label, timeout = 18000) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    try { const value = await predicate(); if (value) return value; } catch (error) { last = error; }
    await wait(80);
  }
  throw Error(label + ' timed out' + (last ? ': ' + last.message : ''));
}
const pass = message => { checks.push(message); console.log('PASS ' + message); };
const semantic = attempt => copy({ id: attempt.id, taskSpec: attempt.taskSpec, state: attempt.state,
  strokes: attempt.strokes, outcome: attempt.outcome, assistance: attempt.assistance });
const api = (page, endpoint, body) => page.evaluate(async ({ endpoint, body }) =>
  LearningApp.api(endpoint, body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }), { endpoint, body });
async function saved(page) {
  await page.waitForFunction(() => document.querySelector('#save-state')?.textContent === 'Все изменения сохранены');
}
async function navigate(page, route) {
  await page.evaluate(route => LearningApp.navigate(route), route);
}
async function readyFrame(page, host = '#trainer-host') {
  const holder = page.locator(host + ' iframe');
  await holder.waitFor();
  await page.waitForFunction(host => document.querySelector(host + ' .frame-status')?.hidden === true, host);
  const frame = await (await holder.elementHandle()).contentFrame();
  assert(frame, 'A real managed child frame must exist');
  await frame.locator('#main').waitFor();
  observedHydrates.push(...await frame.evaluate(() => window.__lessonGateHydrates || []));
  return frame;
}
async function readyMaterial(page, attempt) {
  return until(async () => {
    const holder = page.locator('#trainer-host iframe');
    if (!await holder.count() || !await page.locator('#trainer-host .frame-status').evaluate(node => node.hidden)) return null;
    const frame = await (await holder.elementHandle()).contentFrame();
    if (!frame) return null;
    const hydration = await frame.evaluate(() => window.__lessonGateHydrates?.at(-1));
    if (!hydration || JSON.stringify(hydration.taskSpec) !== JSON.stringify(attempt.taskSpec)) return null;
    observedHydrates.push(hydration); return frame;
  }, 'selected material rendered in the real child frame');
}
async function readonly(frame, expected) {
  await frame.waitForFunction(expected => document.querySelector('#main').inert === expected, expected);
}
async function value(frame, expected) {
  await until(async () => await frame.locator('#answer').inputValue() === expected, 'exact restored answer');
}
async function draw(page, host = '#drawing-host') {
  const canvas = page.locator(host + ' canvas');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  assert(box && box.width >= 180 && box.height >= 100, 'Visible usable writing canvas');
  const x = box.x + Math.min(32, box.width / 5), y = box.y + 30;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + Math.min(95, box.width / 3), y + 55, { steps: 8 });
  await page.mouse.up();
}
async function photograph(page, name) {
  const file = name + '.png';
  await page.screenshot({ path: path.join(artifactDir, file), fullPage: true });
  screenshots.push(file);
}
async function layoutThreshold(page, condition, message) {
  if (condition) return;
  const file = 'layout-failure-' + (layoutFailures.length + 1) + '.png';
  layoutFailures.push({ phase, viewport: page.viewportSize(), message, screenshot: file });
  console.error('LAYOUT FAIL ' + message);
  await page.screenshot({ path: path.join(artifactDir, file), fullPage: false });
  screenshots.push(file);
}
async function firstCondition(page, frame, label, width) {
  await page.setViewportSize({ width, height: width === 320 ? 900 : 960 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await frame.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const condition = frame.locator('#lesson .task').first();
  await condition.waitFor();
  const bounds = await condition.boundingBox(), viewport = page.viewportSize();
  const inner = await frame.evaluate(() => {
    const bounds = element => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
    };
    const nav = document.querySelector('#main .stage-nav');
    return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
      stageNav: bounds(nav), currentStage: bounds(nav?.querySelector('[aria-current="step"]')) };
  });
  layout.push({ label, width, viewportHeight: viewport.height, firstCondition: bounds, childLayout: inner });
  assert(bounds, label + ': real task condition exists');
  await layoutThreshold(page, bounds.width > 20 && bounds.height > 10, label + ': real task condition has usable dimensions');
  await layoutThreshold(page, bounds.x >= -1 && bounds.x + bounds.width <= width + 1, label + ': condition is horizontally clipped');
  await layoutThreshold(page, bounds.y >= -1 && bounds.y + bounds.height <= viewport.height + 1,
    label + ': the complete first condition must be visible without scrolling, ' + JSON.stringify(bounds));
  await layoutThreshold(page, inner.scrollWidth <= inner.width + 1, label + ': trainer has horizontal overflow');
  const nav = inner.stageNav, current = inner.currentStage;
  assert(nav && current, label + ': native current stage exists');
  await layoutThreshold(page, current.width > 0 && current.height >= 24, label + ': native current stage has a usable target');
  await layoutThreshold(page, current.left >= Math.max(0, nav.left) - 1 && current.right <= Math.min(inner.width, nav.right) + 1 &&
    current.top >= Math.max(0, nav.top) - 1 && current.bottom <= Math.min(inner.height, nav.bottom) + 1,
  label + ': current native stage is clipped after resize, ' + JSON.stringify({ nav, current }));
  const file = label + '-first-screen-' + width + '.png';
  await page.screenshot({ path: path.join(artifactDir, file), fullPage: false }); screenshots.push(file);
}
async function checkLayout(page, label, width) {
  await page.setViewportSize({ width, height: width === 320 ? 900 : 960 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  // A bounded horizontal queue is allowed. Each real button must still be
  // reachable by ordinary scrolling, without overflowing the whole page.
  for (const button of await page.locator('#lesson-material-queue [data-lesson-material]').all()) {
    await button.scrollIntoViewIfNeeded();
    const bounds = await button.boundingBox();
    assert(bounds, label + ': queue button exists');
    await layoutThreshold(page, bounds.x >= -1 && bounds.x + bounds.width <= width + 1, label + ': queue button is unreachable');
  }
  const result = await page.evaluate(() => {
    const visible = element => {
      const r = element.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(element).visibility !== 'hidden';
    };
    const controls = [...document.querySelectorAll('#lesson-material-queue button,[data-student-start-lesson],#lesson-join-link,#teacher-rehearse,[data-lesson-add-material]')]
      .filter(visible).map(element => {
        const r = element.getBoundingClientRect();
        return { text: element.textContent.trim(), left: r.left, right: r.right, width: r.width, height: r.height,
          inScrollableQueue: !!element.closest('.lesson-queue-items') };
      });
    return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, controls };
  });
  layout.push({ label, ...result });
  await layoutThreshold(page, result.scrollWidth <= width + 1, label + ' has horizontal overflow: ' + JSON.stringify(result));
  for (const button of result.controls) {
    if (!button.inScrollableQueue) await layoutThreshold(page, button.left >= -1 && button.right <= width + 1, label + ': control clipped ' + button.text);
    await layoutThreshold(page, button.width >= 24 && button.height >= 24, label + ': control target too small ' + button.text);
  }
  await photograph(page, label + '-' + width);
}

(async () => {
  const f = fixture();
  let service, browser;
  const clients = [];
  const tracked = ['learning/app.js', 'learning/teaching.js', 'learning/trainer-frame.js',
    'learning/teacher-rehearsal.js', 'learning/teacher-rehearsal.css', 'learning/lesson-workspace.js', 'learning/lesson-workspace.css',
    'ege-baza/path/managed.js', 'ege-baza/path/style.css', 'ege-baza/path/index.html', 'board-server/learning-store.js',
    'board-server/learning-api.js', 'tools/lesson-workspace-v1/browser.cjs'];
  const hashes = Object.fromEntries(tracked.filter(file => fs.existsSync(path.join(ROOT, file))).map(file =>
    [file, createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex')]));
  try {
    service = await serve(f);
    browser = await chromium.launch({ headless: true,
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.BROWSER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking'] });
    async function client(session, { parent = false, width = 1280, route = 'home' } = {}) {
      const context = await browser.newContext({ viewport: { width, height: 960 }, locale: 'ru-RU', serviceWorkers: 'block' });
      await context.route('**/*', request => {
        const url = new URL(request.request().url());
        if ([service.origin, service.trainerOrigin].includes(url.origin) || ['about:', 'data:', 'blob:'].includes(url.protocol)) return request.continue();
        blockedExternal.push(url.origin + url.pathname); return request.abort();
      });
      await context.addInitScript(() => {
        window.__lessonGateHydrates = [];
        window.addEventListener('message', event => {
          if (event.data?.protocol === 'mathexam-learning' && event.data.type === 'hydrate') {
            window.__lessonGateHydrates.push(JSON.parse(JSON.stringify(event.data.payload)));
          }
        });
      });
      await context.addCookies([{ name: parent ? 'mathexam_parent_local' : 'mathexam_learning_local',
        value: session.sessionToken, url: service.origin, httpOnly: true, sameSite: 'Strict' }]);
      const page = await context.newPage(); page.setDefaultTimeout(18000);
      page.on('pageerror', error => errors.push(error.message));
      clients.push({ context, page, parent });
      await page.goto(service.origin + (parent ? '/learning/parent.html' : '/learning/#' + route));
      if (!parent) {
        await page.locator('#navigation').waitFor();
        await until(async () => !(await page.locator('#main .loading-panel').count()), 'cabinet initial data');
        const welcome = page.locator('[data-mw-close]'); if (await welcome.isVisible()) await welcome.click();
      }
      return { context, page };
    }

    phase = 'private exact-task preparation';
    const teacher = await client(f.teacher, { route: 'attempt=' + f.source.id });
    const tp = teacher.page;
    await readyFrame(tp);
    const beforeRehearsal = learningSnapshot(f.store);
    const rehearsalResponse = tp.waitForResponse(response => response.url().endsWith('/api/learning/teacher/rehearsal') && response.request().method() === 'POST');
    await tp.locator('#teacher-rehearse').click();
    const response = await rehearsalResponse;
    assert(response.ok(), 'The real rehearsal endpoint must accept the teacher');
    await tp.waitForURL(/#rehearsal=/);
    const rehearsal = await readyFrame(tp, '[data-rehearsal-frame]');
    await readonly(rehearsal, false);
    const hydration = await rehearsal.evaluate(() => window.__lessonGateHydrates.at(-1));
    assert.deepEqual(hydration.taskSpec, f.source.taskSpec, 'Preparation preserves the exact selected task, not a new random task');
    for (const width of [320, 1280]) await firstCondition(tp, rehearsal, 'private-preparation', width);
    await rehearsal.locator('[data-stage="2"]').click();
    await rehearsal.locator('#hint').click();
    await rehearsal.locator('#answer').fill(String(f.source.taskSpec.task.steps[0].a));
    await rehearsal.locator('#answerForm button').click();
    await rehearsal.locator('.steps li').first().waitFor();
    const rehearsalCanvas = tp.locator('[data-rehearsal-drawing] canvas');
    const privateInkBefore = await rehearsalCanvas.screenshot();
    await draw(tp, '[data-rehearsal-drawing]');
    assert.notDeepEqual(await rehearsalCanvas.screenshot(), privateInkBefore, 'A real pointer gesture draws in the local preparation copy');
    assert.equal(learningSnapshot(f.store), beforeRehearsal, 'Private answer, hint, step and handwriting do not change any learning/attribution record');
    for (const width of [320, 1280]) await checkLayout(tp, 'private-preparation', width);
    pass('Private teacher rehearsal uses the selected task and real answer/hint/step controls without database attribution');

    phase = 'pupil-card lesson creation';
    await navigate(tp, 'student=' + f.pupil.account.id);
    await tp.locator('[data-student-start-lesson]').waitFor();
    for (const width of [320, 1280]) await checkLayout(tp, 'pupil-card', width);
    const beforeSelection = learningSnapshot(f.store);
    await tp.locator('[data-student-start-lesson]').click();
    assert.deepEqual(await tp.locator('#lesson-form [name="student"]:checked').evaluateAll(nodes => nodes.map(n => n.value)), [f.pupil.account.id], 'Only intended pupil is preselected');
    await tp.locator('#lesson-form [name="title"]').fill('Проверочный урок · две задачи');
    for (const item of f.materialItems) {
      await tp.locator('[data-lesson-material-search]').fill(item.title);
      await tp.locator('[data-lesson-material-result="' + item.id + '"]').click();
    }
    assert.equal(learningSnapshot(f.store), beforeSelection, 'Selecting materials before Start creates no pupil attempts or outcomes');
    for (const width of [320, 1280]) await checkLayout(tp, 'lesson-preparation', width);
    const createdResponse = tp.waitForResponse(response => response.url().endsWith('/api/learning/lessons') && response.request().method() === 'POST');
    await tp.locator('#lesson-form button[type="submit"]').click();
    const created = await createdResponse; assert(created.ok(), 'Lesson is created through the real UI/API');
    const body = await created.json(), lessonId = (body.lesson || body).id;
    const lesson = () => f.store.getLesson(f.teacher.account, lessonId);
    const seat = () => lesson().seats.find(s => s.learnerId === f.pupil.account.id);
    assert.deepEqual(lesson().seats.map(s => s.learnerId), [f.pupil.account.id]);
    assert.equal(seat().materials.length, 2);
    const [aId, bId] = seat().materials.map(item => item.attemptId);
    const work = id => f.store.getAttempt(f.teacher.account, id);
    assert.equal(seat().attemptId, aId);
    assert.equal(work(aId).outcome, 'started'); assert.equal(work(bId).outcome, 'started');
    await tp.waitForURL(/#lesson=/);
    await until(async () => await tp.locator('#trainer-host iframe,[data-open-seat="' + f.pupil.account.id + '"]').count(), 'created lesson UI');
    if (!await tp.locator('#trainer-host iframe').count()) await tp.locator('[data-open-seat="' + f.pupil.account.id + '"]').click();
    let tf = await readyMaterial(tp, work(aId));
    for (const width of [320, 1280]) await firstCondition(tp, tf, 'teacher-material-a', width);
    pass('Start from the pupil card creates only that pupil’s two selected material attempts');

    phase = 'pupil joins and authorization boundaries';
    const pupil = await client(f.pupil, { width: 320 });
    const sp = pupil.page;
    await sp.locator('#lesson-join-entry').waitFor();
    assert((await sp.locator('#lesson-join-link').getAttribute('href')).includes(lessonId));
    await checkLayout(sp, 'pupil-join', 320);
    await sp.locator('#lesson-join-link').click();
    let sf = await readyFrame(sp);
    await readonly(sf, false);
    for (const width of [320, 1280]) await firstCondition(sp, sf, 'pupil-material-a', width);
    await sp.setViewportSize({ width: 320, height: 900 });
    const peer = await client(f.peer);
    assert.equal(await peer.page.locator('#lesson-join-link[href*="' + lessonId + '"]').count(), 0, 'Other pupil has no join entry');
    const otherRead = await peer.context.request.get(service.origin + '/api/learning/lessons/' + lessonId);
    assert.equal(otherRead.status(), 404, 'Another pupil cannot read lesson work');
    const peerWrite = await peer.page.evaluate(async ({ id, version, state }) => {
      try { await LearningApp.api('/attempts/' + id + '/actions', { method: 'POST', body: JSON.stringify({
        opId: crypto.randomUUID(), expectedVersion: version, type: 'state', payload: { state } }) }); return 'accepted'; }
      catch (error) { return error.status; }
    }, { id: aId, version: work(aId).version, state: work(aId).state });
    assert.equal(peerWrite, 404, 'Another pupil cannot write lesson work');
    const parent = await client(f.parent, { parent: true });
    assert.equal((await parent.context.request.get(service.origin + '/api/learning/parent/session')).status(), 200);
    assert.equal((await parent.context.request.get(service.origin + '/api/learning/lessons/' + lessonId)).status(), 401, 'Parent is a separate principal');
    assert.equal((await parent.context.request.post(service.origin + '/api/learning/attempts/' + aId + '/actions', {
      headers: { Origin: service.origin }, data: { opId: randomUUID(), expectedVersion: work(aId).version, type: 'state', payload: { state: work(aId).state } }
    })).status(), 401, 'Parent cannot edit pupil work');
    pass('Pupil enters from the cabinet; another pupil and an authenticated parent cannot access or change private lesson work');

    phase = 'real guided steps, handoff and handwriting';
    await sf.locator('[data-stage="2"]').click();
    await until(() => work(aId).state.work.stage === 2, 'guided stage saved');
    await sf.locator('#hint').click();
    await sf.locator('#answer').fill(String(work(aId).taskSpec.task.steps[0].a));
    await sf.locator('#answerForm button').click();
    await until(() => work(aId).state.work.step === 1, 'completed first step saved');
    assert.equal(work(aId).state.work.answers.length, 1);
    await sf.locator('#answer').fill('314');
    await until(() => work(aId).state.work.draft === '314', 'pupil draft acknowledged before handoff'); await saved(sp);
    await tp.locator('#trainer-control').click();
    await until(() => work(aId).controller === 'teacher', 'teacher takes explicit control');
    tf = await readyFrame(tp); await readonly(tf, false); await readonly(sf, true);
    await tf.locator('#answer').fill('271');
    await until(() => work(aId).state.work.draft === '271', 'teacher draft acknowledged'); await saved(tp); await value(sf, '271');
    const deniedControl = await sp.evaluate(async ({ id, version, state }) => {
      try { await LearningApp.api('/attempts/' + id + '/actions', { method: 'POST', body: JSON.stringify({
        opId: crypto.randomUUID(), expectedVersion: version, type: 'state', payload: { state } }) }); return 'accepted'; }
      catch (error) { return error.code; }
    }, { id: aId, version: work(aId).version, state: work(aId).state });
    assert.equal(deniedControl, 'LEARNING_CONTROL_REQUIRED', 'Read-only pupil cannot bypass handoff at the API');
    await tp.locator('#trainer-control').click();
    await until(() => work(aId).controller === 'student', 'teacher returns control explicitly');
    await readonly(sf, false); await readonly(tf, true);
    await tp.locator('[data-work-view="board"]').click(); await draw(tp);
    await until(() => work(aId).strokes.length === 1, 'teacher ink acknowledged'); await saved(tp);
    await sp.locator('[data-work-view="board"]').click(); await draw(sp);
    await until(() => work(aId).strokes.length === 2, 'pupil ink acknowledged'); await saved(sp);
    assert.equal(work(aId).strokes.length, 2);
    assert.deepEqual(new Set(work(aId).strokes.map(stroke => stroke.author)), new Set([f.teacher.account.id, f.pupil.account.id]));
    const first = semantic(work(aId));
    assert.notEqual(first.outcome, 'independent', 'Guided/teacher work is never independent pupil evidence');
    pass('Real first step, answers and authored ink persist; explicit teacher/pupil control works in both directions');

    phase = 'material queue roundtrip';
    await tp.locator('#lesson-material-queue [data-lesson-material="' + bId + '"]').click();
    await until(() => seat().attemptId === bId, 'second material selected');
    tf = await readyMaterial(tp, work(bId)); sf = await readyMaterial(sp, work(bId));
    await readonly(sf, false);
    await sf.locator('#answer').fill('628');
    await until(() => work(bId).state.work.draft === '628', 'second material draft acknowledged'); await saved(sp);
    await sp.locator('[data-work-view="board"]').click(); await draw(sp);
    await until(() => work(bId).strokes.length === 1, 'second material ink acknowledged'); await saved(sp);
    const second = semantic(work(bId)); assert.equal(second.strokes.length, 1);
    assert.deepEqual(semantic(work(aId)), first, 'Changing material never rewrites previous condition, steps, answers or ink');
    await tp.locator('#lesson-material-queue [data-lesson-material="' + aId + '"]').click();
    await until(() => seat().attemptId === aId, 'first material restored');
    tf = await readyMaterial(tp, work(aId)); sf = await readyMaterial(sp, work(aId));
    await value(sf, '271'); await value(tf, '271');
    assert.equal(await sf.locator('.steps li').count(), 1, 'Completed step is visibly restored');
    assert.deepEqual(semantic(work(aId)), first); assert.deepEqual(semantic(work(bId)), second);
    pass('A → B → A restores both exact task identities, drafts, completed steps and each material’s own strokes');

    phase = 'failed material switch';
    const lessonActionURL = '**/api/learning/lessons/' + lessonId + '/actions';
    await tp.route(lessonActionURL, route => route.fulfill({ status: 503, contentType: 'application/json',
      body: JSON.stringify({ error: 'LEARNING_STORAGE_UNAVAILABLE' }) }), { times: 1 });
    const failedSwitchResponse = tp.waitForResponse(response => response.url().endsWith('/api/learning/lessons/' + lessonId + '/actions'));
    await tp.locator('#lesson-material-queue [data-lesson-material="' + bId + '"]').click();
    assert.equal((await failedSwitchResponse).status(), 503);
    await tp.locator('#notice').waitFor({ state: 'visible' });
    assert((await tp.locator('#notice').innerText()).trim(), 'Failed selection has a visible explanation');
    await until(async () => !await tp.locator('#lesson-material-queue [data-lesson-material="' + bId + '"]').isDisabled(), 'failed selection unlocked for retry');
    assert.equal(seat().attemptId, aId); assert.deepEqual(semantic(work(aId)), first); assert.deepEqual(semantic(work(bId)), second);
    pass('A failed material-selection save is visible and leaves the authoritative active task and both works intact');

    phase = 'reload and late join';
    await sp.reload(); sf = await readyFrame(sp); await value(sf, '271');
    await tp.reload(); tf = await readyFrame(tp); await value(tf, '271');
    const late = await client(f.pupil);
    await late.page.locator('#lesson-join-link').click();
    const lateFrame = await readyFrame(late.page); await value(lateFrame, '271');
    const lateHydration = await lateFrame.evaluate(() => window.__lessonGateHydrates.at(-1));
    assert.deepEqual(lateHydration.taskSpec, first.taskSpec); assert.deepEqual(lateHydration.state, first.state);
    assert.deepEqual(semantic(work(aId)), first); assert.deepEqual(semantic(work(bId)), second);
    pass('Teacher/pupil reload and a second pupil device retain the selected task, exact state and stored handwriting');

    phase = 'failed save and recovery';
    const stateURL = '**/api/learning/attempts/' + aId + '/actions';
    let failedSaves = 0;
    await sp.route(stateURL, route => { failedSaves++; return route.abort('failed'); });
    await sf.locator('#answer').fill('909');
    await until(async () => /нет связи|не подтверждено/i.test(await sp.locator('#save-state').innerText()), 'failed-save state is explicit');
    const connectivityNotice = sp.locator('#notice[data-notice-kind="save-connectivity"]');
    await connectivityNotice.waitFor({ state: 'visible' });
    const staleExport = await connectivityNotice.getByRole('button', { name: 'Скачать неподтверждённую работу', exact: true }).elementHandle();
    assert(staleExport, 'Failed saving offers an export of the unacknowledged work');
    assert(failedSaves > 0); assert.equal(work(aId).state.work.draft, '271', 'A failed save does not pretend to update the server');
    await sp.unroute(stateURL);
    await until(() => work(aId).state.work.draft === '909', 'queued input recovers after connection'); await saved(sp);
    await connectivityNotice.waitFor({ state: 'hidden' });
    assert(await staleExport.evaluate(node => !node.isConnected), 'Confirmed recovery removes the previous connectivity export, without hiding unrelated notices');
    const afterRecovery = semantic(work(aId));
    assert.deepEqual(afterRecovery.strokes, first.strokes); assert.equal(afterRecovery.state.work.step, 1);
    pass('Failed saving is visible; recovery clears its stale notice and retains the earlier steps and ink');

    phase = 'responsive lesson controls';
    for (const width of [320, 1280]) {
      await checkLayout(tp, 'teacher-workspace', width);
      await checkLayout(sp, 'pupil-workspace', width);
    }
    assert.deepEqual(semantic(work(bId)), second, 'Responsive reflow does not rewrite another material');
    assert.deepEqual(f.store.getAttempt(f.peer.account, f.peerWork.id), f.peerWork, 'Peer work is unchanged');
    assert.deepEqual(f.store.getAttempt(f.pupil.account, f.source.id), f.source, 'Original source attempt is unchanged');
    if (!layoutFailures.length) pass('Pupil card, preparation, join and lesson controls fit 320 px and 1280 px');

    phase = 'late response after leaving the pupil';
    let heldSwitch;
    await tp.route(lessonActionURL, async route => { const response = await route.fetch(); heldSwitch = { route, response }; }, { times: 1 });
    await tp.locator('#lesson-material-queue [data-lesson-material="' + bId + '"]').click();
    await until(() => heldSwitch, 'material switch response held after a real commit');
    assert.equal(seat().attemptId, bId);
    await navigate(tp, 'student=' + f.peer.account.id);
    await tp.locator('[data-student-start-lesson]').waitFor();
    const received = tp.waitForResponse(response => response.url().endsWith('/api/learning/lessons/' + lessonId + '/actions'));
    await heldSwitch.route.fulfill({ response: heldSwitch.response }); await received;
    await tp.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(new URL(tp.url()).hash, '#student=' + f.peer.account.id, 'Late lesson response cannot restore another pupil’s route');
    assert.equal(await tp.locator('#main h1').innerText(), f.peer.account.name);
    assert.equal(await tp.locator('#lesson-material-queue').count(), 0);
    assert.deepEqual(semantic(work(aId)), afterRecovery); assert.deepEqual(semantic(work(bId)), second);
    pass('A real delayed switch response cannot overwrite a newly selected pupil context');

    phase = 'credential and runtime audit';
    assert(service.trainerRequests.length > 0, 'Real public-origin trainer resources were loaded');
    for (const request of service.trainerRequests) {
      const { referer, ...credentials } = request.headers;
      assert(Object.values(credentials).every(value => value === undefined), 'Cabinet credentials leaked to trainer: ' + request.path);
      assert(!referer || !referer.startsWith(service.origin), 'Cabinet referrer leaked to trainer: ' + request.path);
    }
    const forbidden = [f.teacher.sessionToken, f.pupil.sessionToken, f.peer.sessionToken, f.parent.sessionToken,
      f.teacher.account.id, f.pupil.account.id, f.peer.account.id];
    for (const { page } of clients) {
      for (const frame of page.frames().filter(frame => frame.url().startsWith(service.trainerOrigin))) {
        const envelopes = await frame.evaluate(() => window.__lessonGateHydrates);
        observedHydrates.push(...envelopes);
      }
    }
    for (const envelope of observedHydrates) {
      assert.deepEqual(Object.keys(envelope).sort(), ['readOnly', 'state', 'taskSpec']);
      for (const secret of forbidden) assert(!JSON.stringify(envelope).includes(secret), 'Trainer hydration contains account/session data');
    }
    assert(observedHydrates.length >= 3, 'Real cross-origin hydration observed for teacher, pupil and late join');
    assert.deepEqual(errors, [], 'No browser runtime errors');
    pass('Trainer requests and semantic hydration contain no cabinet credentials or account identity');
    phase = 'final layout acceptance';
    assert.deepEqual(layoutFailures, [], 'Every recorded layout threshold must pass before browser success');
    fs.writeFileSync(path.join(artifactDir, 'result.json'), JSON.stringify({ status: 'passed', browser: 'Chromium',
      realSQLite: true, roleContexts: clients.length, checks, layout, layoutFailures, screenshots, sourceHashes: hashes,
      blockedExternal: [...new Set(blockedExternal)], runtimeErrors: errors }, null, 2) + '\n');
    console.log('LESSON_WORKSPACE_V1_BROWSER_OK');
  } catch (error) {
    for (let index = 0; index < clients.length; index++) {
      try { await photograph(clients[index].page, 'failure-' + index); } catch (_) {}
    }
    fs.writeFileSync(path.join(artifactDir, 'result.json'), JSON.stringify({ status: 'failed', phase, error: error.stack,
      checks, layout, layoutFailures, screenshots, sourceHashes: hashes, runtimeErrors: errors }, null, 2) + '\n');
    throw error;
  } finally {
    await browser?.close(); await service?.close(); f.close();
  }
})().catch(error => { console.error('FAIL during ' + phase + '\n' + error.stack); process.exitCode = 1; });
