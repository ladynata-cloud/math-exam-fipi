'use strict';

// CI acceptance: three isolated browsers exercise the actual UI, bridge and
// durable group API. No private account, production lesson or synthetic pass.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ARTIFACTS = process.env.UNIFIED_BOARD_ARTIFACTS || fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-unified-board-'));
fs.mkdirSync(ARTIFACTS, { recursive: true });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function poll(check, label, timeout = 20000) {
  const until = Date.now() + timeout;
  let last;
  while (Date.now() < until) {
    try { const result = await check(); if (result) return result; } catch (error) { last = error; }
    await delay(150);
  }
  throw new Error(`${label} timed out${last ? ': ' + last.message : ''}`);
}
async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function staticServer() {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
  const server = http.createServer((req, res) => {
    let file;
    try { file = path.resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
    catch (_) { res.writeHead(400).end(); return; }
    if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { origin: 'http://127.0.0.1:' + server.address().port, close: () => new Promise(resolve => server.close(resolve)) };
}
async function backend(port, directory) {
  let stderr = '';
  const child = spawn(process.execPath, ['index.js'], {
    cwd: path.join(ROOT, 'board-server'),
    env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), GROUP_LESSON_STORE_DIR: directory },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stdout.resume(); child.stderr.on('data', data => { stderr += data; });
  const origin = 'http://127.0.0.1:' + port;
  try {
    await poll(async () => {
      if (child.exitCode !== null) throw Error('Backend exited: ' + stderr);
      return (await fetch(origin + '/health')).ok;
    }, 'backend startup');
  } catch (error) { child.kill(); throw error; }
  return { origin, async stop() { if (child.exitCode !== null) return; child.kill(); await new Promise(resolve => child.once('exit', resolve)); } };
}
async function json(url, token) {
  const response = await fetch(url, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
  const body = await response.json();
  assert.ok(response.ok, `API read ${response.status}: ${body.error || 'unknown'}`);
  return body;
}
async function mode(page, surface) {
  const button = page.locator(`#materialTabs [data-surface="${surface}"]`);
  if (await button.getAttribute('aria-pressed') === 'true') return;
  await button.click();
  await poll(async () => await button.getAttribute('aria-pressed') === 'true', 'material selected: ' + surface);
}
async function geometryFrame(page, host = '#geometryHost') {
  return poll(async () => {
    const locator = page.locator(`${host} .group-trainer-frame[data-trainer-id="spacemath"][data-status="ready"] iframe`);
    if (!await locator.count()) return null;
    const frame = await (await locator.elementHandle()).contentFrame();
    return frame && await frame.evaluate(() => !!window.SpaceMathApp) ? frame : null;
  }, 'geometry bridge ready');
}
const geometry = frame => frame.evaluate(() => window.SpaceMathApp.getState());
async function addPoint(frame, x, y) {
  await frame.locator('#point-x').fill(String(x));
  await frame.locator('#point-y').fill(String(y));
  await frame.locator('#add-point-form button[type="submit"]').click();
}
async function draw(page) {
  await mode(page, 'board');
  const canvas = page.locator('#boardCanvas');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  assert.ok(box && box.width > 120 && box.height > 120, 'usable handwriting canvas');
  await page.mouse.move(box.x + 30, box.y + 40); await page.mouse.down();
  await page.mouse.move(box.x + 105, box.y + 100, { steps: 8 }); await page.mouse.up();
}
async function negativeFrame(page) {
  return poll(async () => {
    const locator = page.locator('#trainerHost .group-trainer-frame[data-trainer-id="negative-numbers-line"][data-status="ready"] iframe');
    if (!await locator.count()) return null;
    return (await locator.elementHandle()).contentFrame();
  }, 'inserted trainer ready');
}
async function assertFits(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow at ' + width);
  const selected = page.locator('#materialTabs [data-surface][aria-pressed="true"]');
  assert.equal(await selected.count(), 1, 'one accessible active material tab');
}

async function main() {
  const site = await staticServer();
  const port = await freePort();
  const store = fs.mkdtempSync(path.join(ARTIFACTS, 'store-'));
  let api, browser;
  const contexts = [], errors = [], requests = [];
  try {
    api = await backend(port, store);
    const executablePath = process.env.GROUP_BOARD_CHROMIUM || process.env.BROWSER_EXECUTABLE_PATH;
    browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
    async function pageFor() {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      contexts.push(context);
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => requests.push(request.url()));
      // No external editor/runtime is needed. Abort any unexpected outbound call
      // instead of contacting another service during a test.
      await page.route('**/*', route => {
        const url = new URL(route.request().url());
        return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort();
      });
      return page;
    }
    const teacher = await pageFor();
    await teacher.goto(site.origin + '/trainers/group-board.html');
    await teacher.locator('#lessonTitle').fill('Проверка единой доски');
    await teacher.locator('#studentNames').fill('Ученик А\nУченик Б');
    await teacher.locator('.connection-settings summary').click();
    await teacher.locator('#serverUrl').fill(api.origin); await teacher.locator('#serverUrl').press('Tab');
    const [response] = await Promise.all([
      teacher.waitForResponse(r => r.url() === api.origin + '/api/group-lessons' && r.request().method() === 'POST'),
      teacher.locator('#createButton').click()
    ]);
    assert.equal(response.status(), 201);
    const created = await response.json(), { id, teacherToken } = created;
    const lessonURL = api.origin + '/api/group-lessons/' + id;
    const read = () => json(lessonURL, teacherToken);
    const work = async seatId => (await read()).students.find(s => s.id === seatId).workspace;
    const [first, second] = created.invites;
    await teacher.locator('#app').waitFor({ state: 'visible' });
    if (await teacher.locator('#inviteDialog').isVisible()) await teacher.locator('#inviteDialog [data-close-dialog]').first().click();
    const pupils = [];
    for (const invite of created.invites) {
      const page = await pageFor();
      await page.goto(`${site.origin}/trainers/group-board.html#lesson=${id}&token=${invite.studentToken}&server=${encodeURIComponent(api.origin)}`);
      await page.locator('#focus').waitFor({ state: 'visible' });
      assert.equal(new URL(page.url()).hash, '', 'invitation removed from address bar');
      pupils.push(page);
    }
    const [pupil, observer] = pupils;
    await draw(pupil);
    await poll(async () => (await work(first.id)).strokes.length === 1, 'pupil ink saved');
    await mode(pupil, 'geometry');
    let pupilGeometry = await geometryFrame(pupil);
    const preciseX = 1.234567890123456;
    await addPoint(pupilGeometry, preciseX, 2.5);
    // Switch immediately: a debounced geometry update must survive this action.
    await mode(pupil, 'board');
    await poll(async () => (await work(first.id)).geometryState.objects.length === 1, 'geometry flushed before material switch');
    await mode(pupil, 'geometry'); pupilGeometry = await geometryFrame(pupil);
    await poll(async () => (await geometry(pupilGeometry)).objects[0]?.x === preciseX, 'precise point restores on return');
    const firstGeometry = (await work(first.id)).geometryState;
    assert.equal((await work(second.id)).geometryState.objects.length, 0, 'other pupil construction remains independent');
    console.log('PASS independent handwriting, geometry and immediate tab switch');

    await teacher.locator('#roster button').first().click();
    await mode(teacher, 'geometry');
    let teacherGeometry = await geometryFrame(teacher);
    await poll(async () => JSON.stringify(await geometry(teacherGeometry)) === JSON.stringify(firstGeometry), 'teacher observes canonical geometry');
    assert.equal(await teacherGeometry.locator('#add-point-form button').isDisabled(), true, 'observation does not take control');
    await teacher.locator('#geometryControlButton').click();
    await poll(async () => (await work(first.id)).geometryController === 'teacher', 'teacher takes geometry control');
    await poll(async () => await pupilGeometry.locator('#add-point-form button').isDisabled(), 'pupil geometry locked');
    await addPoint(teacherGeometry, 4, -1);
    await poll(async () => (await work(first.id)).geometryState.objects.length === 2, 'teacher geometry saved');
    await poll(async () => (await geometry(pupilGeometry)).objects.length === 2, 'teacher geometry reaches pupil');
    await teacher.locator('#geometryControlButton').click();
    await poll(async () => (await work(first.id)).geometryController === 'student', 'geometry control returned');
    await poll(async () => !await pupilGeometry.locator('#add-point-form button').isDisabled(), 'pupil geometry enabled after handoff');
    console.log('PASS geometry observation, teacher takeover and return');

    const beforeInsert = await work(first.id);
    await teacher.locator('#assignButton').click();
    await teacher.locator('#assignTarget').selectOption(first.id);
    await teacher.locator('#assignTrainer').selectOption('negative-numbers-line');
    await teacher.locator('#assignSubmit').click();
    await teacher.locator('#assignDialog').waitFor({ state: 'hidden' });
    await poll(async () => (await work(first.id)).trainerId === 'negative-numbers-line', 'trainer inserted');
    const inserted = await work(first.id);
    assert.notEqual(inserted.assignmentId, beforeInsert.assignmentId, 'new trainer has a fresh assignment fence');
    assert.equal(inserted.geometryAssignmentId, beforeInsert.geometryAssignmentId, 'insertion preserves geometry generation');
    assert.equal(inserted.boardAssignmentId, beforeInsert.boardAssignmentId, 'insertion preserves handwriting generation');
    assert.deepEqual(inserted.strokes, beforeInsert.strokes, 'inserting trainer preserves handwriting');
    assert.deepEqual(inserted.geometryState, beforeInsert.geometryState, 'inserting trainer preserves construction');
    await mode(pupil, 'trainer');
    const trainer = await negativeFrame(pupil);
    const problem = await trainer.evaluate(() => window.getBoardTrainerState());
    await trainer.locator('#svg g.pt').nth(problem.task.a + 10).click();
    await trainer.locator('#svg g.pt').nth(problem.task.res + 10).click();
    await trainer.locator('#ans').fill(String(problem.task.res));
    await trainer.locator('#check').click();
    await poll(async () => (await work(first.id)).trainerState.phase === 'done', 'inserted trainer completed through UI');
    const allMaterials = await work(first.id);
    for (const surface of ['geometry', 'board', 'split', 'trainer']) await mode(pupil, surface);
    assert.deepEqual(await work(first.id), allMaterials, 'material switching changes no saved work');
    await pupil.reload();
    await pupil.locator('#focus').waitFor({ state: 'visible' });
    await mode(pupil, 'geometry'); pupilGeometry = await geometryFrame(pupil);
    await poll(async () => JSON.stringify(await geometry(pupilGeometry)) === JSON.stringify(allMaterials.geometryState), 'reload restores geometry');
    await mode(pupil, 'trainer');
    const restoredTrainer = await negativeFrame(pupil);
    assert.equal(await restoredTrainer.evaluate(() => window.getBoardTrainerState().phase), 'done');
    assert.deepEqual((await work(first.id)).strokes, allMaterials.strokes);
    console.log('PASS trainer insertion, all three materials and reload');

    await mode(teacher, 'geometry'); teacherGeometry = await geometryFrame(teacher);
    await teacher.locator('#presentButton').click();
    await poll(async () => { const p = (await read()).presentation; return p.target === first.id && p.surface === 'geometry'; }, 'teacher presents geometry surface');
    await observer.locator('#sheetTabs [data-sheet="presentation"]').click();
    const presentedGeometry = await geometryFrame(observer);
    await poll(async () => JSON.stringify(await geometry(presentedGeometry)) === JSON.stringify(allMaterials.geometryState), 'peer observes presented construction');
    assert.equal(await presentedGeometry.locator('#add-point-form button').isDisabled(), true, 'presented construction read only');
    const observerView = await json(lessonURL, second.studentToken);
    assert.equal(observerView.students.length, 1); assert.equal(observerView.students[0].id, second.id);
    assert.equal(observerView.invites, undefined);
    const denied = await fetch(lessonURL + '/actions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + second.studentToken },
      body: JSON.stringify({ opId: randomUUID(), type: 'geometry', target: first.id, assignmentId: allMaterials.geometryAssignmentId,
        expectedVersion: allMaterials.geometryVersion, payload: { state: allMaterials.geometryState } })
    });
    assert.equal(denied.status, 403, 'observer cannot write presented peer construction');
    const stale = await fetch(lessonURL + '/actions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + first.studentToken },
      body: JSON.stringify({ opId: randomUUID(), type: 'geometry', target: first.id, assignmentId: allMaterials.geometryAssignmentId,
        expectedVersion: allMaterials.geometryVersion - 1, payload: { state: allMaterials.geometryState } })
    });
    assert.equal(stale.status, 409, 'stale geometry version is rejected even for the current controller');
    assert.equal((await stale.json()).error, 'GROUP_STATE_CONFLICT', 'geometry version, rather than assignment generation, fences stale writes');
    assert.deepEqual(await work(first.id), allMaterials, 'denied and stale geometry writes do not alter state');
    assert.deepEqual((await work(second.id)).geometryState.objects, [], 'explanation never replaces observer personal construction');
    await teacher.locator('#presentButton').click();
    await poll(async () => (await read()).presentation.target === null, 'presentation explicitly stopped');
    console.log('PASS presented geometry, pupil isolation and denied peer mutation');

    await teacher.locator('#historyButton').click();
    await teacher.locator('#historyPanel').waitFor({ state: 'visible' });
    await mode(teacher, 'geometry');
    const historyGeometry = await geometryFrame(teacher);
    assert.equal(await historyGeometry.locator('#add-point-form button').isDisabled(), true, 'history geometry read only');
    assert.deepEqual(await work(first.id), allMaterials, 'history never mutates saved materials');
    await teacher.locator('#historyExit').click();

    await observer.locator('#sheetTabs [data-sheet="mine"]').click();
    for (const page of [teacher, pupil]) {
      await mode(page, 'geometry');
      for (const width of [320, 1280]) {
        await assertFits(page, width);
        const child = await geometryFrame(page);
        await poll(() => child.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'geometry frame fits at ' + width);
        const field = await child.locator('#geometry-board').boundingBox();
        assert.ok(field && field.width >= 240 && field.height >= 280, 'usable geometry at ' + width);
      }
    }
    await teacher.screenshot({ path: path.join(ARTIFACTS, 'unified-geometry-desktop.png'), fullPage: true });
    await pupil.setViewportSize({ width: 320, height: 900 });
    await pupil.screenshot({ path: path.join(ARTIFACTS, 'unified-geometry-mobile.png'), fullPage: true });
    console.log('PASS read-only history and 320/1280 layouts');

    await api.stop(); api = await backend(port, store);
    assert.deepEqual(await work(first.id), allMaterials, 'server restart restores all materials and version fences');
    await pupil.reload(); await pupil.locator('#focus').waitFor({ state: 'visible' });
    await mode(pupil, 'geometry');
    const afterRestart = await geometryFrame(pupil);
    assert.deepEqual(await geometry(afterRestart), allMaterials.geometryState);
    for (const page of [teacher, ...pupils]) {
      for (const frame of page.frames().slice(1)) {
        const url = new URL(frame.url());
        assert.equal(url.searchParams.has('token'), false); assert.equal(url.hash, '');
        assert.ok(!created.invites.some(i => frame.url().includes(i.studentToken)) && !frame.url().includes(teacherToken), 'credentials never enter iframe URL');
      }
    }
    // Setup checks the configured default before the test fills its local API.
    // That capability-only probe was aborted above; it is not a runtime asset.
    const defaultProbe = 'https://mathexam-board-ladynata.msk1.amvera.tech/api/group-lessons/status';
    const outside = requests.filter(raw => raw !== defaultProbe && !['127.0.0.1', 'localhost'].includes(new URL(raw).hostname));
    assert.deepEqual(outside, [], 'no external editor or runtime requests');
    assert.deepEqual(errors, [], 'no page errors');
    console.log('PASS server restart, credential-free frames and local runtime assets');
    console.log('UNIFIED_BOARD_BROWSER_READY');
  } finally {
    for (const context of contexts) await context.close().catch(() => {});
    if (browser) await browser.close();
    if (api) await api.stop();
    await site.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
