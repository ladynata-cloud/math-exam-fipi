'use strict';

// Two real account contexts, isolated trainer origin, actual SQLite and native
// pointer/form controls. All identities are disposable fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');
const { fixture, serve, copy } = require('../lesson-workspace-v1/fixture.cjs');
const artifactDir = path.resolve(process.env.SPACEMATH_ARTIFACTS || fs.mkdtempSync(path.join(os.tmpdir(), 'spacemath-evidence-')));
fs.mkdirSync(artifactDir, { recursive: true });
const checks = [], errors = [], external = [], screenshots = [], layouts = [], sandboxErrors = [];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate, label, timeout = 20000) {
  const end = Date.now() + timeout; let last;
  while (Date.now() < end) {
    try { const result = await predicate(); if (result) return result; } catch (error) { last = error; }
    await delay(70);
  }
  throw Error(label + ' timed out' + (last ? ': ' + last.message : ''));
}
function pass(message) { checks.push(message); console.log('PASS ' + message); }
const api = (page, endpoint) => page.evaluate(endpoint => LearningApp.api(endpoint), endpoint);
const navigate = (page, route) => page.evaluate(route => LearningApp.navigate(route), route);
const model = frame => frame.evaluate(() => SpaceMathApp.getState());
async function saved(page) { await page.waitForFunction(() => document.querySelector('#save-state')?.textContent === 'Все изменения сохранены'); }
async function readyFrame(page, expectedState) {
  return until(async () => {
    const holder = page.locator('#trainer-host iframe');
    if (!await holder.count()) return null;
    const frame = await (await holder.elementHandle()).contentFrame();
    if (!frame || !await frame.evaluate(() => !!window.SpaceMathApp)) return null;
    if (!await page.locator('#trainer-host .frame-status').evaluate(node => node.hidden)) return null;
    if (expectedState && JSON.stringify(await model(frame)) !== JSON.stringify(expectedState)) return null;
    return frame;
  }, 'real hydrated SpaceMath frame');
}
async function readOnly(frame, expected) { await frame.waitForFunction(value => SpaceMathApp.getReadOnly() === value, expected); }
async function sameState(frame, expected) {
  await until(async () => JSON.stringify(await model(frame)) === JSON.stringify(expected), 'exact mirrored canonical construction');
}
async function dragPoint(page, frame, name, dx, dy, long = false) {
  await frame.locator('#geometry-board').scrollIntoViewIfNeeded();
  const location = await frame.evaluate(name => {
    const board = Object.values(JXG.boards).find(board => board.container === 'geometry-board' || board.containerObj?.id === 'geometry-board');
    const point = board.objectsList.find(item => item.elType === 'point' && item.name === name);
    if (!point) throw Error('Visible named free point is missing');
    return { x: point.coords.scrCoords[1], y: point.coords.scrCoords[2], userX: point.X(), userY: point.Y(), unitX: board.unitX, unitY: board.unitY };
  }, name);
  const rect = await frame.locator('#geometry-board').boundingBox();
  assert(rect && rect.width >= 200 && rect.height >= 200);
  const x = rect.x + location.x, y = rect.y + location.y;
  await page.mouse.move(x, y); await page.mouse.down();
  if (long) for (let i = 1; i <= 10; i++) { await page.mouse.move(x + dx * i / 10, y + dy * i / 10); await delay(300); }
  else await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
  return { x: location.userX + dx / location.unitX, y: location.userY - dy / location.unitY };
}
async function layout(page, frame, label, width) {
  await page.setViewportSize({ width, height: 900 });
  await frame.locator('#geometry-board').scrollIntoViewIfNeeded();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const parent = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  const child = await frame.evaluate(() => {
    const canvas = document.getElementById('geometry-board').getBoundingClientRect();
    const controls = [...document.querySelectorAll('[data-tool]')].map(button => {
      const r = button.getBoundingClientRect(); return { width: r.width, height: r.height, left: r.left, right: r.right };
    });
    return { width: innerWidth, scroll: document.documentElement.scrollWidth,
      canvas: { width: canvas.width, height: canvas.height, left: canvas.left, right: canvas.right }, controls };
  });
  layouts.push({ label, width, parent, child });
  assert(parent.scroll <= parent.width + 1, label + ': cabinet has no horizontal overflow');
  assert(child.scroll <= child.width + 1, label + ': editor has no horizontal overflow');
  assert(child.canvas.width >= 200 && child.canvas.height >= 300, label + ': usable construction canvas');
  for (const button of child.controls) {
    assert(button.width >= 24 && button.height >= 36, label + ': reachable tool target');
    assert(button.left >= -1 && button.right <= child.width + 1, label + ': no clipped tool');
  }
  const file = label + '-' + width + '.png';
  await page.screenshot({ path: path.join(artifactDir, file), fullPage: true }); screenshots.push(file);
}

(async () => {
  const f = fixture(); let service, browser, phase = 'initialization';
  const contexts = [];
  try {
    service = await serve(f);
    browser = await chromium.launch({ headless: true,
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.BROWSER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking'] });
    async function client(session, route = 'spacemath') {
      const context = await browser.newContext({ locale: 'ru-RU', viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
      contexts.push(context);
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if ([service.origin, service.trainerOrigin].includes(url.origin) || ['about:', 'data:', 'blob:'].includes(url.protocol)) return route.continue();
        external.push(url.origin + url.pathname); return route.abort();
      });
      await context.addCookies([{ name: 'mathexam_learning_local', value: session.sessionToken, url: service.origin, httpOnly: true, sameSite: 'Strict' }]);
      const page = await context.newPage(); page.setDefaultTimeout(20000); page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error' && /Blocked form submission|sandboxed.*allow-forms/.test(message.text())) sandboxErrors.push(message.text().replace(/https?:\/\/[^\s']+/g, '[fixture origin]')); });
      await page.goto(service.origin + '/learning/#' + route);
      await page.locator('#navigation').waitFor();
      const welcome = page.locator('[data-mw-close]'); if (await welcome.isVisible()) await welcome.click();
      return { context, page };
    }

    phase = 'private teacher model through the cabinet';
    const teacher = await client(f.teacher), tp = teacher.page;
    await tp.locator('[data-spacemath-create]').waitFor();
    await tp.locator('[data-spacemath-create] [name=title]').fill('Личная модель треугольника');
    await tp.locator('[data-spacemath-create] button').click();
    await tp.waitForURL(/#attempt=/);
    let tf = await readyFrame(tp); await readOnly(tf, false);
    const privateId = new URLSearchParams(new URL(tp.url()).hash.slice(1)).get('attempt');
    const work = id => f.store.getAttempt(f.teacher.account, id);
    assert.equal(work(privateId).learnerId, f.teacher.account.id);
    assert(await tp.locator('#trainer-control').isHidden(), 'A private model has no nonexistent pupil controller');
    await tf.locator('#example').click();
    await until(() => work(privateId).state.objects.length === 11, 'example saved in teacher SQLite document');
    await saved(tp); const prepared = copy(work(privateId).state);
    assert.deepEqual(await model(tf), prepared);
    const downloading = tp.waitForEvent('download'); await tp.locator('#spacemath-download').click();
    const downloaded = await downloading;
    assert.deepEqual(JSON.parse(fs.readFileSync(await downloaded.path(), 'utf8')), prepared, 'The cabinet exports canonical JSON outside its sandboxed frame');
    assert(await tf.locator('#export-json').isHidden(), 'The managed editor directs export to the cabinet');
    assert.equal(work(privateId).outcome, 'started');
    pass('Teacher creates a private cabinet model and edits it through the actual JSXGraph editor');

    phase = 'saved current construction becomes a lesson';
    await tp.locator('[data-spacemath-to-lesson]').click();
    await tp.locator('#lesson-form [name=student][value="' + f.pupil.account.id + '"]').check();
    await tp.locator('#lesson-form [name=title]').fill('SpaceMath · совместная проверка');
    const creation = tp.waitForResponse(response => response.url().endsWith('/api/learning/lessons') && response.request().method() === 'POST');
    await tp.locator('#lesson-form button[type=submit]').click();
    const created = await creation; assert(created.ok()); const result = await created.json();
    const lessonId = (result.lesson || result).id;
    const lesson = () => f.store.getLesson(f.teacher.account, lessonId);
    const seat = () => lesson().seats.find(item => item.learnerId === f.pupil.account.id);
    const sharedId = seat().attemptId;
    assert(sharedId && sharedId !== privateId);
    assert.deepEqual(work(sharedId).state, prepared, 'A lesson copies the current prepared geometry');
    await tp.waitForURL(/#lesson=/);
    await until(async () => await tp.locator('#trainer-host iframe,[data-open-seat]').count(), 'lesson entry');
    if (!await tp.locator('#trainer-host iframe').count()) await tp.locator('[data-open-seat="' + f.pupil.account.id + '"]').click();
    tf = await readyFrame(tp);
    const pupil = await client(f.pupil, 'lesson=' + lessonId), sp = pupil.page;
    let sf = await readyFrame(sp); await sameState(sf, prepared);
    if (work(sharedId).controller !== 'teacher') await tp.locator('#trainer-control').click();
    await until(() => work(sharedId).controller === 'teacher', 'explicit teacher control');
    await readOnly(tf, false); await readOnly(sf, true);
    pass('The saved current model opens in the intended pupil lesson; a later joining pupil receives the exact graph');

    phase = 'native drag, dependent geometry, authority and no echo';
    const before = copy(work(sharedId).state);
    const expectedDrag = await dragPoint(tp, tf, 'C', 40, 32, true);
    const finalDrag = await model(tf);
    assert.notEqual(finalDrag.objects.find(item => item.id === 'c').x, before.objects.find(item => item.id === 'c').x);
    assert(Math.abs(finalDrag.objects.find(item => item.id === 'c').x - expectedDrag.x) < .03, 'A long drag reaches its final coordinates across intermediate acknowledgements');
    assert(Math.abs(finalDrag.objects.find(item => item.id === 'c').y - expectedDrag.y) < .03);
    await until(() => JSON.stringify(work(sharedId).state) === JSON.stringify(finalDrag), 'final native drag coordinates committed');
    await saved(tp); const moved = copy(work(sharedId).state);
    await sameState(sf, moved);
    const mathematical = await tf.evaluate(() => SpaceMathModel.evaluate(SpaceMathApp.getState()));
    assert(Math.abs(mathematical.m.x - (mathematical.a.x + mathematical.b.x) / 2) < 1e-9);
    assert(Math.abs(mathematical.m.y - (mathematical.a.y + mathematical.b.y) / 2) < 1e-9);
    assert(Math.abs(mathematical.h.x - mathematical.c.x) < 1e-9);
    assert(Math.abs(mathematical.h.y + 2) < 1e-9);
    assert(Math.abs(mathematical.reading.value - 90) < 1e-9);
    assert.deepEqual(work(privateId).state, prepared, 'Lesson changes never mutate the private source');
    const version = work(sharedId).version;
    assert(await sf.locator('#add-point-form button').isDisabled());
    await dragPoint(sp, sf, 'C', -30, 20); await delay(1800);
    assert.equal(work(sharedId).version, version, 'A viewer and remote hydration create no edit echo');
    assert.deepEqual(await model(sf), moved);
    const denied = await sp.evaluate(async ({ id, version, state }) => {
      try { await LearningApp.api('/attempts/' + id + '/actions', { method: 'POST', body: JSON.stringify({ opId: crypto.randomUUID(), expectedVersion: version, type: 'state', payload: { state } }) }); return 'accepted'; }
      catch (error) { return error.code; }
    }, { id: sharedId, version, state: moved });
    assert.equal(denied, 'LEARNING_CONTROL_REQUIRED');
    pass('Real vertex drag preserves midpoint and perpendicular relations, mirrors once, and blocks viewer writes at UI and API');

    phase = 'handoff and responsive pupil editing';
    await tp.locator('#trainer-control').click();
    await until(() => work(sharedId).controller === 'student', 'control returned to pupil');
    await readOnly(sf, false); await readOnly(tf, true);
    await sf.locator('#point-x').fill('2.5'); await sf.locator('#point-y').fill('1.5');
    await sf.locator('#add-point-form button').click();
    await until(() => work(sharedId).state.objects.length === moved.objects.length + 1, 'pupil point saved');
    await saved(sp); const continued = copy(work(sharedId).state); await sameState(tf, continued);
    for (const width of [320, 1280]) await layout(sp, sf, 'pupil-construction', width);
    pass('Pupil continues after explicit handoff; the editor and cabinet are usable at 320 and 1280 pixels');

    phase = 'material switch and saved-model picker';
    await tp.locator('[data-lesson-spacemath]').click();
    await tp.locator('[data-spacemath-new]').click();
    await until(() => seat().attemptId !== sharedId, 'blank geometry inserted');
    const blankId = seat().attemptId;
    assert.equal(work(blankId).state.objects.length, 0);
    tf = await readyFrame(tp, work(blankId).state); sf = await readyFrame(sp, work(blankId).state);
    await tp.locator('[data-lesson-spacemath]').click();
    await tp.locator('[data-spacemath-saved="' + sharedId + '"]').click();
    await until(() => seat().attemptId === sharedId, 'existing pupil model attached');
    assert.equal(seat().materials.length, 2, 'Continuing an existing model creates no duplicate attempt');
    tf = await readyFrame(tp, continued); sf = await readyFrame(sp, continued);
    await sameState(tf, continued); await sameState(sf, continued);
    const reloadedVersion = work(sharedId).version;
    await sp.reload(); sf = await readyFrame(sp); await sameState(sf, continued);
    assert.equal(work(sharedId).version, reloadedVersion, 'Reload is observation, not a new edit');
    pass('Switching away, continuing from the saved picker and reloading preserve the exact model and document identity');

    phase = 'library reopen and cross-account boundary';
    await navigate(sp, 'spacemath');
    await sp.locator('[data-spacemath-open="' + sharedId + '"]').waitFor();
    assert.equal(await sp.locator('[data-spacemath-open="' + privateId + '"]').count(), 0);
    await sp.locator('[data-spacemath-open="' + sharedId + '"]').click();
    sf = await readyFrame(sp); await sameState(sf, continued);
    const peer = await client(f.peer);
    assert.equal((await peer.context.request.get(service.origin + '/api/learning/attempts/' + sharedId)).status(), 404);
    assert.equal((await pupil.context.request.get(service.origin + '/api/learning/attempts/' + privateId)).status(), 404);
    assert.deepEqual((await api(peer.page, '/spacemath/models')).models, []);
    const noCredentials = service.trainerRequests.every(request => !request.headers.cookie && !request.headers.authorization && !request.headers.account && !request.headers.csrf);
    assert(noCredentials, 'Cabinet credentials never reach the separate trainer host');
    assert.equal(external.length, 0, 'SpaceMath requests no third-party runtime resources');
    assert.equal(errors.length, 0, 'No browser page errors: ' + errors.join('; '));
    assert.deepEqual(sandboxErrors, [], 'Editor interactions never depend on a prohibited sandboxed form navigation');
    assert.equal(work(sharedId).outcome, 'started', 'Free construction is not an exercise completion');
    pass('Cabinet reopening and ownership work; no cross-account reads, trainer credentials, third-party requests or fabricated completion');
    fs.writeFileSync(path.join(artifactDir, 'managed-browser.json'), JSON.stringify({ result: 'PASS', browser: browser.version(), checks, layouts, screenshots, errors, external, sandboxErrors }, null, 2));
    console.log('SPACEMATH_MANAGED_BROWSER_OK');
  } catch (error) {
    const diagnostics = [];
    for (const context of contexts) for (const page of context.pages()) {
      const parent = await page.evaluate(() => ({ save: document.getElementById('save-state')?.textContent, notice: document.getElementById('notice')?.textContent })).catch(() => ({}));
      for (const frame of page.frames().slice(1)) {
        const editor = await frame.evaluate(() => window.SpaceMathApp ? ({ state: SpaceMathApp.getState(), readOnly: SpaceMathApp.getReadOnly(), feedback: document.getElementById('feedback')?.textContent,
          pointX: document.getElementById('point-x')?.value, pointY: document.getElementById('point-y')?.value }) : null).catch(() => null);
        if (editor) diagnostics.push({ parent, editor });
      }
    }
    fs.writeFileSync(path.join(artifactDir, 'managed-browser.json'), JSON.stringify({ result: 'FAIL', phase, error: error.stack, checks, layouts, screenshots, errors, external, sandboxErrors, diagnostics }, null, 2));
    throw error;
  } finally {
    for (const context of contexts) await context.close().catch(() => {});
    if (browser) await browser.close(); if (service) await service.close(); f.close();
  }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
