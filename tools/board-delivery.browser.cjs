'use strict';

// Native browser acceptance for durable public-room handwriting. The only
// outage is a real stop/restart of an isolated localhost backend; application
// transport, storage, handlers and browser input are not replaced by mocks.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createReadStream, mkdirSync, mkdtempSync, rmSync, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { createServer: createNetServer } = require('node:net');
const { tmpdir } = require('node:os');
const { extname, join, resolve, sep } = require('node:path');
const { chromium } = require('playwright');
const ROOT = resolve(__dirname, '..');
const ARTIFACTS = process.env.BOARD_WRITING_ARTIFACTS;
const pause = ms => new Promise(resolvePause => setTimeout(resolvePause, ms));
const sessions = [], errors = [];
let phase = 'startup';

async function freePort() {
  const server = createNetServer();
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
  const port = server.address().port;
  await new Promise(resolveClose => server.close(resolveClose));
  return port;
}
function staticServer() {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  return createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
      if (pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
      let file = resolve(ROOT, '.' + pathname);
      if (file !== ROOT && !file.startsWith(ROOT + sep)) { response.writeHead(403).end(); return; }
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
      response.setHeader('Cache-Control', 'no-store');
      createReadStream(file).pipe(response);
    } catch (_) { response.writeHead(404).end(); }
  });
}
async function health(origin, child, diagnostics) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Isolated backend exited: ' + diagnostics());
    try {
      const response = await fetch(origin + '/health', { signal: AbortSignal.timeout(1000) });
      if (response.ok) {
        const state = await response.json();
        assert.equal(state.inkDelivery?.durable, true, 'the native gate uses the real persistent backend');
        return;
      }
    } catch (error) { if (error.code === 'ERR_ASSERTION') throw error; }
    await pause(75);
  }
  throw new Error('Isolated backend health timeout: ' + diagnostics());
}
async function session(browser, siteOrigin, boardOrigin, tag) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === siteOrigin || url.origin === boardOrigin || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
    errors.push(tag + ': external request ' + url.origin + url.pathname);
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(20000);
  page.on('pageerror', error => errors.push(tag + ': ' + error.message));
  // The reload below is intentional and must accept the real pending-work
  // beforeunload guard. The other dialog is the ordinary clear-page confirmation.
  page.on('dialog', dialog => dialog.accept());
  const result = { context, page, tag };
  sessions.push(result);
  return result;
}
async function connected(page) {
  await page.waitForFunction(() => shared.connected && roomStateReceived && inkDeliveryCapability
    && !inkDeliveryUnavailable && !document.body.classList.contains('awaiting-room'));
}
async function saved(page, count) {
  await page.waitForFunction(expected => document.getElementById('inkSaveStatus').dataset.delivery === 'saved'
    && inkOutbox?.active().length === 0 && !inkOutbox.fault && !inkStructurePending
    && state.pages[state.current].strokes.length === expected, count);
  await deliveryActions(page, false);
}
async function deliveryActions(page, pending) {
  assert.equal(await page.locator('#downloadPendingInk').isVisible(), pending, 'download is visible only while this room has unsent work');
  assert.equal(await page.locator('#retryPendingInk').isVisible(), pending, 'retry is visible only while this room has unsent work');
  assert.equal(await page.locator('#archiveRejectedInk').isVisible(), false, 'archive is hidden when this room has no rejected work');
}
async function snapshot(page) { return page.evaluate(() => publicSnapshot().pages); }
async function equalBoards(source, other) {
  const expected = await snapshot(source);
  await other.waitForFunction(pages => JSON.stringify(publicSnapshot().pages) === JSON.stringify(pages), expected);
  assert.deepEqual(await snapshot(other), expected);
  return expected;
}
async function pen(page, y = 120, keepDown = false) {
  await page.locator('[data-tool="pen"]').click();
  const canvas = page.locator('#canvas');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  assert(box && box.width > 360 && box.height > y + 65, 'the real canvas can receive the gesture');
  await page.mouse.move(box.x + 100, box.y + y);
  await page.mouse.down();
  await page.mouse.move(box.x + 285, box.y + y + 45, { steps: 10 });
  if (!keepDown) await page.mouse.up();
}
async function text(page, value) {
  await page.locator('[data-tool="text"]').click();
  const canvas = page.locator('#canvas'); await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  assert(box && box.width > 360 && box.height > 290);
  await page.mouse.click(box.x + 130, box.y + 220);
  await page.locator('#editor').fill(value);
  assert.notEqual(await page.locator('#inkSaveStatus').getAttribute('data-delivery'), 'saved', 'unfinished text is not saved');
  await page.locator('#editor').press('Control+Enter');
}
async function shot(page, name) {
  if (ARTIFACTS) await page.screenshot({ path: join(ARTIFACTS, name + '.png') });
}
async function diagnostics() {
  for (const { page, tag } of sessions) {
    const detail = await page.evaluate(() => ({ status: document.getElementById('inkSaveStatus')?.textContent,
      connected: typeof shared !== 'undefined' && shared.connected,
      queued: typeof inkOutbox !== 'undefined' && inkOutbox?.list().map(record => ({ opId: record.opId, status: record.status })),
      strokes: typeof state !== 'undefined' && state.pages.map(sheet => sheet.strokes.length) })).catch(() => null);
    console.error('DELIVERY_DIAGNOSTIC ' + tag + ' ' + JSON.stringify(detail));
    if (ARTIFACTS) await page.screenshot({ path: join(ARTIFACTS, 'delivery-failure-' + tag + '.png'), timeout: 3000 }).catch(() => {});
  }
}

(async () => {
  if (ARTIFACTS) mkdirSync(ARTIFACTS, { recursive: true });
  const directory = mkdtempSync(join(tmpdir(), 'mathexam-native-delivery-'));
  const server = staticServer();
  let browser, child, watchdog, backendErrors = '';
  async function stopBackend() {
    if (!child || child.exitCode !== null || child.signalCode) return;
    const processToStop = child;
    await new Promise((resolveExit, reject) => {
      const killTimer = setTimeout(() => processToStop.kill('SIGKILL'), 3000);
      const deadline = setTimeout(() => {
        processToStop.removeListener('exit', exited);
        clearTimeout(killTimer);
        reject(new Error('Isolated backend did not stop after SIGKILL'));
      }, 6000);
      function exited() { clearTimeout(killTimer); clearTimeout(deadline); resolveExit(); }
      processToStop.once('exit', exited);
      processToStop.kill('SIGTERM');
    });
  }
  try {
    await Promise.race([
      (async () => {
        await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
        const siteOrigin = 'http://127.0.0.1:' + server.address().port;
        const boardPort = await freePort(), boardOrigin = 'http://127.0.0.1:' + boardPort;
        async function startBackend() {
          const env = { ...process.env, HOST: '127.0.0.1', PORT: String(boardPort), NODE_ENV: 'test', CORS_ALLOWED_ORIGINS: siteOrigin };
          for (const key of Object.keys(env)) if (/^(LEARNING_|PROGRESS_|GROUP_LESSON_|BOARD_ROOM_|TRAINER_REGISTRY_PATH$)/.test(key)) delete env[key];
          env.BOARD_ROOM_STORE_DIR = join(directory, 'rooms');
          child = spawn(process.execPath, ['index.js'], { cwd: join(ROOT, 'board-server'), env,
            stdio: ['ignore', 'ignore', 'pipe'] });
          child.stderr.on('data', chunk => { backendErrors = (backendErrors + String(chunk)).slice(-3000); });
          await health(boardOrigin, child, () => backendErrors);
        }
        await startBackend();
        browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.BROWSER_EXECUTABLE_PATH,
          headless: true, args: ['--no-sandbox'], timeout: 15000 });
        const teacherSession = await session(browser, siteOrigin, boardOrigin, 'teacher');
        const studentSession = await session(browser, siteOrigin, boardOrigin, 'student');
        const teacher = teacherSession.page, student = studentSession.page;
        phase = 'create real durable room and join from a second browser context';
        await teacher.goto(siteOrigin + '/trainers/trainer-board.html?server=' + encodeURIComponent(boardOrigin), { waitUntil: 'domcontentloaded' });
        await teacher.waitForFunction(() => typeof publicSnapshot === 'function' && canvas.width > 100);
        await teacher.locator('#openShare').click(); await teacher.locator('#createRoom').click();
        await connected(teacher); await saved(teacher, 0);
        const invite = await teacher.locator('#studentLink').inputValue();
        assert.equal(new URL(invite).origin, siteOrigin);
        assert.equal(new URL(invite).searchParams.get('server'), boardOrigin);
        await teacher.locator('#sharePanel [data-close-panel]').click();
        await student.goto(invite, { waitUntil: 'domcontentloaded' }); await connected(student);
        phase = 'native teacher pen, student text, and acknowledged role handoff';
        await pen(teacher); await saved(teacher, 1); await equalBoards(teacher, student);
        await teacher.locator('#boardControlToggle').click();
        await student.waitForFunction(() => canWrite() && shared.me?.role === 'student');
        await text(student, '500 − 266 = 234'); await saved(student, 2);
        let expected = await equalBoards(student, teacher);
        assert.equal(expected[0].strokes[0].authorRole, 'teacher');
        assert.equal(expected[0].strokes[1].authorRole, 'student');
        assert.equal(expected[0].strokes[1].text, '500 − 266 = 234');
        await teacher.locator('#boardControlToggle').click();
        await teacher.waitForFunction(() => canWrite() && shared.me?.role === 'teacher');
        phase = 'ordinary reload restores the exact confirmed room';
        const teacherUrl = teacher.url();
        await teacher.reload({ waitUntil: 'domcontentloaded' }); await connected(teacher); await saved(teacher, 2);
        assert.equal(teacher.url(), teacherUrl);
        assert.deepEqual(await snapshot(teacher), expected);
        phase = 'real backend outage leaves a completed teacher stroke pending and visible';
        // Begin while writing is permitted. A real connection loss finishes
        // the active gesture into the durable outbox before disabling input.
        await pen(teacher, 200, true);
        assert.notEqual(await teacher.locator('#inkSaveStatus').getAttribute('data-delivery'), 'saved');
        await stopBackend();
        await teacher.waitForFunction(() => !shared.connected);
        await student.waitForFunction(() => !shared.connected);
        await teacher.mouse.up();
        await teacher.waitForFunction(() => inkOutbox?.pending().length === 1);
        const pending = await teacher.evaluate(() => ({ record: inkOutbox.pending()[0],
          key: inkOutbox.key(inkOutbox.pending()[0].opId),
          stored: JSON.parse(localStorage.getItem(inkOutbox.key(inkOutbox.pending()[0].opId))),
          visible: strokesWithPendingInk(page()).length,
          saved: document.getElementById('inkSaveStatus').dataset.delivery === 'saved' }));
        assert.equal(pending.saved, false);
        assert.equal(pending.visible, 3);
        assert.deepEqual(pending.stored, pending.record);
        assert.equal((await snapshot(student))[0].strokes.length, 2);
        await deliveryActions(teacher, true);
        await shot(teacher, 'delivery-pending-offline');
        phase = 'reload while disconnected retains pending operation, then reconnect sends it once';
        await teacher.reload({ waitUntil: 'domcontentloaded' });
        await teacher.waitForFunction(() => typeof publicSnapshot === 'function');
        assert.equal(await teacher.evaluate(({ key, expectedId }) => {
          const record = JSON.parse(localStorage.getItem(key)); return record?.opId === expectedId && record.status === 'pending';
        }, { key: pending.key, expectedId: pending.record.opId }), true);
        assert.notEqual(await teacher.locator('#inkSaveStatus').getAttribute('data-delivery'), 'saved');
        assert.equal(await teacher.evaluate(() => canWrite()), false, 'an offline room reload cannot create local-only replacement ink');
        assert.equal(await teacher.locator('[data-tool="pen"]').isDisabled(), true);
        await startBackend();
        // A page reloaded while the socket client script was unreachable offers
        // its real reconnect control; use it instead of injecting application state.
        await teacher.locator('#openShare').click(); await teacher.locator('#connectRoom').click();
        await connected(teacher); await saved(teacher, 3);
        await teacher.locator('#sharePanel [data-close-panel]').click();
        await connected(student); expected = await equalBoards(teacher, student);
        assert.equal(expected[0].strokes.filter(stroke => stroke.objectId === pending.record.stroke.objectId).length, 1);
        assert.deepEqual(expected[0].strokes[2].points, pending.record.stroke.points);
        assert.equal(await teacher.evaluate(() => inkOutbox.pending().length), 0);
        phase = 'clear advances the page generation and a new native stroke is saved';
        const oldEpoch = await teacher.evaluate(() => page().pageEpoch);
        assert.equal(await teacher.locator('#boardPanel').isVisible(), false);
        await teacher.locator('#clear').click();
        await saved(teacher, 0); await equalBoards(teacher, student);
        assert.ok(await teacher.evaluate(previous => page().pageEpoch > previous, oldEpoch));
        await pen(teacher, 180); await saved(teacher, 1); await equalBoards(teacher, student);
        await shot(teacher, 'delivery-saved-teacher'); await shot(student, 'delivery-saved-student');
        assert.deepEqual(errors, [], 'no browser runtime errors or external requests');
        console.log('BOARD_DELIVERY_BROWSER_OK: native teacher pen/student text; durable ACK; exact reload; real backend outage; pending local queue; offline reload; restart and one delivery; clear then new ink; two browser contexts');
      })(),
      new Promise((_, reject) => { watchdog = setTimeout(() => reject(new Error('Durable board gate exceeded 150 seconds at ' + phase)), 150000); })
    ]);
  } catch (error) { await diagnostics(); throw error; }
  finally {
    clearTimeout(watchdog); await browser?.close(); await stopBackend();
    if (server.listening) {
      const closed = new Promise(resolveClose => server.close(resolveClose));
      server.closeAllConnections();
      await closed;
    }
    rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error('BOARD_DELIVERY_BROWSER_FAILED at ' + phase + '\n' + (error.stack || error)); process.exitCode = 1; });
