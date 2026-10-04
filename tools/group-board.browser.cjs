'use strict';

// End-to-end pilot gate: the real board, real trainer bridge and eight isolated
// student browsers. Install board-server dependencies and Playwright before use.
// A system browser can be supplied with GROUP_BOARD_CHROMIUM or BROWSER_EXECUTABLE_PATH.
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
const ARTIFACTS = process.env.GROUP_BOARD_ARTIFACTS || fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-group-browser-'));
fs.mkdirSync(ARTIFACTS, { recursive: true });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function poll(check, label, timeout = 15000) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try { const result = await check(); if (result) return result; } catch (error) { lastError = error; }
    await delay(100);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError.message}` : ''}`);
}

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function staticServer() {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
  const server = http.createServer((req, res) => {
    let file;
    try { file = path.resolve(ROOT, `.${decodeURIComponent(new URL(req.url, 'http://localhost').pathname)}`); } catch { res.writeHead(400).end(); return; }
    if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(resolve => server.close(resolve)) };
}

async function backend(port, store) {
  let stderr = '';
  const child = spawn(process.execPath, ['index.js'], {
    cwd: path.join(ROOT, 'board-server'),
    env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), GROUP_LESSON_STORE_DIR: store },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stderr.on('data', value => { stderr += value; });
  child.stdout.resume();
  const origin = `http://127.0.0.1:${port}`;
  try {
    await poll(async () => {
      if (child.exitCode !== null) throw new Error(`backend exited ${child.exitCode}: ${stderr}`);
      return (await fetch(`${origin}/health`)).ok;
    }, 'backend startup');
  } catch (error) { child.kill(); throw error; }
  return { origin, async stop() { if (child.exitCode !== null) return; child.kill(); await new Promise(resolve => child.once('exit', resolve)); } };
}

async function json(url, token, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const body = await response.json();
  assert.ok(response.ok, `request failed ${response.status}: ${body.error || 'unknown error'}`);
  return body;
}

function trainerFrame(page, trainerId) {
  return page.frames().find(frame => frame.url().includes(`/trainers/${trainerId}.html`));
}

async function frameReady(page, trainerId) {
  return poll(async () => {
    const frame = trainerFrame(page, trainerId);
    if (!frame) return null;
    return await frame.evaluate(() => typeof window.getBoardTrainerState === 'function') ? frame : null;
  }, `${trainerId} frame ready`);
}

async function snapshotState(frame) { return frame.evaluate(() => window.getBoardTrainerState()); }

async function assign(page, target, trainerId) {
  await page.locator('#assignButton').click();
  await page.locator('#assignTarget').selectOption(target);
  await page.locator('#assignTrainer').selectOption(trainerId);
  await page.locator('#assignSubmit').click();
  await page.locator('#assignDialog').waitFor({ state: 'hidden' });
}

async function visibleFrame(page, assignmentId) {
  return poll(async () => {
    const locator = page.locator(`.group-trainer-frame[data-assignment-id="${assignmentId}"][data-status="ready"] iframe`).first();
    if (!await locator.count()) return null;
    return (await locator.elementHandle()).contentFrame();
  }, 'visible trainer mirror');
}

async function watchFrame(page, assignmentId) {
  return poll(async () => {
    const locator = page.locator(`#teacherWatchTrainer .group-trainer-frame[data-assignment-id="${assignmentId}"][data-status="ready"] iframe`);
    if (!await locator.count()) return null;
    return (await locator.elementHandle()).contentFrame();
  }, 'student explanation mirror');
}

async function drawStroke(page, dx = 100) {
  const canvas = page.locator('#boardCanvas');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  assert.ok(box && box.width > 100 && box.height > 100, 'usable drawing surface');
  await page.mouse.move(box.x + 30, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + Math.min(dx, box.width - 20), box.y + 90, { steps: 8 });
  await page.mouse.up();
}

async function main() {
  const site = await staticServer();
  const backendPort = await freePort();
  const store = fs.mkdtempSync(path.join(ARTIFACTS, 'store-'));
  let api = await backend(backendPort, store);
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.GROUP_BOARD_CHROMIUM || process.env.BROWSER_EXECUTABLE_PATH
      ? { executablePath: process.env.GROUP_BOARD_CHROMIUM || process.env.BROWSER_EXECUTABLE_PATH } : {})
  });
  const errors = [];
  const requests = [];
  const contexts = [];
  let teacher;
  async function pageFor(viewport = { width: 1280, height: 800 }) {
    const context = await browser.newContext({ viewport });
    contexts.push(context);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => requests.push(request.url()));
    return page;
  }
  try {
    const status = await json(`${api.origin}/api/group-lessons/status`);
    assert.equal(status.available, true);
    assert.equal(status.durable, true);
    teacher = await pageFor();
    await teacher.goto(`${site.origin}/trainers/group-board.html`);
    await teacher.locator('#lessonTitle').fill('Проверка группового урока');
    await teacher.locator('#studentNames').fill(Array.from({ length: 8 }, (_, i) => `Ученик ${i + 1}`).join('\n'));
    await teacher.locator('.connection-settings summary').click();
    await teacher.locator('#serverUrl').fill(api.origin);
    await teacher.locator('#serverUrl').press('Tab');
    const [response] = await Promise.all([
      teacher.waitForResponse(response => response.url() === `${api.origin}/api/group-lessons` && response.request().method() === 'POST'),
      teacher.locator('#createButton').click()
    ]);
    assert.equal(response.status(), 201, 'lesson created through UI');
    const created = await response.json();
    const { id, teacherToken } = created;
    const read = () => json(`${api.origin}/api/group-lessons/${id}`, teacherToken);
    const work = async seat => (await read()).students.find(student => student.id === seat).workspace;
    await teacher.locator('#app').waitFor({ state: 'visible' });
    if (await teacher.locator('#inviteDialog').isVisible()) await teacher.locator('#inviteDialog [data-close-dialog]').first().click();
    assert.equal((await read()).students.length, 8);
    assert.equal(await teacher.locator('#studentGrid [data-seat]').count(), 4, 'four cards per sheet');
    console.log('PASS create teacher lesson with eight seats');

    const students = await Promise.all(created.invites.map(async invite => {
      const page = await pageFor();
      await page.goto(`${site.origin}/trainers/group-board.html#lesson=${id}&token=${invite.studentToken}&server=${encodeURIComponent(api.origin)}`);
      await page.locator('#focus').waitFor({ state: 'visible' });
      assert.equal(new URL(page.url()).hash, '', 'invitation credentials removed from address bar');
      assert.equal(await page.locator('#assignButton').isVisible(), false, 'student has no assignment controls');
      const own = await json(`${api.origin}/api/group-lessons/${id}`, invite.studentToken);
      assert.equal(own.students.length, 1, 'student snapshot contains only personal work');
      assert.equal(own.students[0].id, invite.id);
      assert.equal(own.invites, undefined, 'student never receives other invitations');
      assert.deepEqual(own.presentation, { target: null }, 'peer work is not disclosed before the teacher starts presenting');
      return page;
    }));
    await poll(async () => (await read()).students.every(student => student.online), 'all eight students online');
    const soloProgress = JSON.stringify({ marker: 'existing-solo-progress', topics: {
      linearInequalitiesStepwise: { total: 23, right: 17, streak: 5, best: 8, date: null, history: [{ text: 'Самостоятельная работа' }] },
      negativeNumbersAlternative: { total: 31, right: 20, streak: 4, best: 9, date: null, history: [{ text: 'Самостоятельная работа', ok: true }] }
    } });
    await Promise.all([teacher, ...students].map(page => page.evaluate(value => localStorage.setItem('mathExamCourseProgress.v1', value), soloProgress)));
    console.log('PASS eight isolated student browsers joined');

    await assign(teacher, 'all', 'linear-inequalities-stepwise');
    await poll(async () => (await read()).students.every(student => student.workspace.trainerId === 'linear-inequalities-stepwise'), 'assignment for all students');
    const initial = await read();
    assert.equal(new Set(initial.students.map(student => student.workspace.assignmentId)).size, 8, 'independent assignment IDs');
    assert.ok(initial.students.every(student => JSON.stringify(student.workspace.trainerState) === JSON.stringify(initial.students[0].workspace.trainerState)), 'same starting task for everyone');
    const studentFrames = await Promise.all(students.map(page => frameReady(page, 'linear-inequalities-stepwise')));
    for (const frame of studentFrames) assert.equal(await frame.locator('#total').textContent(), '0', 'group inequality session does not read prior solo statistics');
    await Promise.all(studentFrames.map(async (frame, index) => {
      await frame.locator('#val').fill(String(index + 11));
    }));
    await poll(async () => (await read()).students.every((student, index) => student.workspace.trainerState.answerValue === String(index + 11)), 'independent answers from all students');
    const s1 = await work('s1');
    const mirror1 = await visibleFrame(teacher, s1.assignmentId);
    await poll(async () => (await snapshotState(mirror1)).answerValue === '11', 'live mirror answer');
    console.log('PASS same assignment, eight independent trainer inputs and teacher mirror');

    await teacher.locator('#sheetTabs [data-sheet="1"]').click();
    await poll(async () => await teacher.locator('#studentGrid [data-seat="s5"]').count(), 'second sheet');
    await studentFrames[0].locator('#val').fill('101');
    await studentFrames[7].locator('#val').fill('808');
    await poll(async () => (await work('s1')).trainerState.answerValue === '101' && (await work('s8')).trainerState.answerValue === '808', 'updates across hidden sheet');
    const mirror8 = await visibleFrame(teacher, (await work('s8')).assignmentId);
    await poll(async () => (await snapshotState(mirror8)).answerValue === '808', 'second sheet live mirror');
    await students[0].locator('#helpButton').click();
    await poll(async () => (await read()).students[0].help, 'help request from hidden sheet');
    await poll(async () => /помощ/i.test(await teacher.locator('#roster button').first().innerText()), 'hidden sheet help visible in roster');
    await teacher.screenshot({ path: path.join(ARTIFACTS, 'group-overview.png'), fullPage: true });
    console.log('PASS two sheets, background updates and help signal');

    await teacher.locator('#roster button').first().click();
    await teacher.locator('#focus').waitFor({ state: 'visible' });
    await teacher.locator('#trainerControlButton').click();
    await poll(async () => (await work('s1')).controller === 'teacher', 'teacher takes trainer control');
    const teacherFrame = await visibleFrame(teacher, (await work('s1')).assignmentId);
    await poll(async () => await students[0].locator('#trainerHost .group-trainer-frame').getAttribute('data-read-only') === 'true', 'student input locks during teacher control');
    await teacherFrame.locator('#val').fill('-2');
    await teacherFrame.locator('#sg').selectOption('lt');
    await teacherFrame.locator('#check').click();
    await poll(async () => (await work('s1')).trainerState.done === true, 'teacher assistance delivered');
    await poll(async () => (await snapshotState(studentFrames[0])).done === true, 'student sees teacher assistance');
    await teacher.locator('#trainerControlButton').click();
    await poll(async () => (await work('s1')).controller === 'student', 'teacher releases trainer');
    await drawStroke(teacher);
    await poll(async () => (await work('s1')).strokes.length === 1, 'teacher stroke saved');
    const beforeStudentStroke = await teacher.locator('#boardCanvas').evaluate(canvas => canvas.toDataURL());
    await drawStroke(students[0], 150);
    await poll(async () => (await work('s1')).strokes.length === 2, 'teacher and student handwritten strokes');
    await poll(async () => await teacher.locator('#boardCanvas').evaluate(canvas => canvas.toDataURL()) !== beforeStudentStroke, 'student handwriting visible on teacher canvas');
    assert.equal((await work('s2')).strokes.length, 0, 'drawing stays private to selected student');
    await teacher.screenshot({ path: path.join(ARTIFACTS, 'group-focus.png'), fullPage: true });
    console.log('PASS teacher control handoff and independent handwritten work');

    const beforeHistory = await work('s1');
    await teacher.locator('#historyButton').click();
    await teacher.locator('#historyPanel').waitFor({ state: 'visible' });
    await poll(async () => Number(await teacher.locator('#historyRange').getAttribute('max')) > 0, 'history timeline populated');
    await teacher.locator('#historyRange').focus();
    await teacher.locator('#historyRange').press('Home');
    await poll(async () => {
      const frame = trainerFrame(teacher, 'linear-inequalities-stepwise');
      if (!frame) return false;
      const historical = await snapshotState(frame);
      return historical.answerValue === '' && historical.done === false;
    }, 'replay visibly restores the original unsolved task');
    assert.deepEqual(await work('s1'), beforeHistory, 'replay does not mutate live work');
    await teacher.locator('#historyExit').click();
    await teacher.locator('#historyPanel').waitFor({ state: 'hidden' });
    await poll(async () => (await snapshotState(await frameReady(teacher, 'linear-inequalities-stepwise'))).done === true, 'exit replay returns to latest solution');
    await teacher.locator('#undoButton').click();
    await poll(async () => (await work('s1')).strokes.length === 1, 'teacher undoes own stroke');
    assert.equal((await work('s1')).strokes[0].author, 's1', 'teacher undo preserves student stroke');
    console.log('PASS recorded history is replayed without changing live work');

    await teacher.locator('#backButton').click();
    await assign(teacher, 's2', 'negative-numbers-line');
    const negative = await frameReady(students[1], 'negative-numbers-line');
    assert.equal(await negative.locator('#sTotal').textContent(), '0', 'group negative-number session does not read prior solo statistics');
    await teacher.locator('#sheetTabs [data-sheet="0"]').click();
    const negativeMirror = await visibleFrame(teacher, (await work('s2')).assignmentId);
    await negative.locator('#hint').click();
    await poll(async () => (await snapshotState(negativeMirror)).hintVisible === true, 'negative-number hint appears in teacher mirror');
    await poll(async () => (await work('s2')).trainerState.hintVisible === false && (await snapshotState(negativeMirror)).hintVisible === false, 'hint auto-hide reaches server and teacher mirror');
    const problem = await snapshotState(negative);
    await negative.locator('#svg g.pt').nth(problem.task.a + 10).click();
    await negative.locator('#svg g.pt').nth(problem.task.res + 10).click();
    await negative.locator('#ans').fill(String(problem.task.res));
    await negative.locator('#check').click();
    await poll(async () => (await work('s2')).trainerState.phase === 'done', 'negative number trainer completed');
    assert.equal((await work('s1')).assignmentId, beforeHistory.assignmentId, 'individual reassignment keeps other work');
    await students[1].reload();
    const reloadedNegative = await frameReady(students[1], 'negative-numbers-line');
    await poll(async () => (await snapshotState(reloadedNegative)).phase === 'done', 'student reload restores completed trainer');
    console.log('PASS individual trainer assignment and restored student state');

    await assign(teacher, 'common', 'linear-inequalities-stepwise');
    await teacher.locator('#sheetTabs [data-sheet="common"]').click();
    await teacher.locator('#presentButton').click();
    await poll(async () => (await read()).presentation.target === 'common', 'teacher explicitly starts common-board presentation');
    await students[4].locator('#sheetTabs [data-sheet="presentation"]').click();
    await poll(async () => await students[4].locator('#trainerHost .group-trainer-frame').getAttribute('data-read-only') === 'true', 'common trainer is read only for student');
    const commonFrame = await visibleFrame(teacher, (await read()).common.assignmentId);
    await commonFrame.locator('[data-act="move"]').click();
    await poll(async () => (await read()).common.trainerState.currentStep === 1, 'teacher common-board trainer action');
    const studentCommon = await frameReady(students[4], 'linear-inequalities-stepwise');
    await poll(async () => (await snapshotState(studentCommon)).currentStep === 1, 'student sees shared demonstration');
    const commonCanvasBefore = await students[4].locator('#boardCanvas').evaluate(canvas => canvas.toDataURL());
    await drawStroke(teacher);
    await poll(async () => (await read()).common.strokes.length === 1, 'teacher writes on common board');
    await poll(async () => await students[4].locator('#boardCanvas').evaluate(canvas => canvas.toDataURL()) !== commonCanvasBefore, 'student sees common-board handwriting');
    assert.equal((await work('s5')).strokes.length, 0, 'shared board keeps personal workspace independent');
    await students[4].locator('#sheetTabs [data-sheet="mine"]').click();
    await teacher.locator('#backButton').click();
    console.log('PASS shared demonstration and common drawing keep personal work separate');

    // Lose the acknowledgement after A is durably accepted, then queue B while
    // the pupil still has the old version. Teacher intervention must invalidate B;
    // retrying acknowledged A must not silently rebase B onto the teacher's work.
    const interrupted = students[2];
    let acceptedWithoutAck = false, injectionError = null, releaseRetry, releaseAckLoss;
    const retryBarrier = new Promise(resolve => { releaseRetry = resolve; });
    const ackLossBarrier = new Promise(resolve => { releaseAckLoss = resolve; });
    const actionURL = `${api.origin}/api/group-lessons/${id}/actions`;
    const routeHandler = async route => {
      const action = route.request().postDataJSON();
      if (action.type !== 'trainer') { await route.continue(); return; }
      if (!acceptedWithoutAck && action.payload.state.answerValue === '303') {
        try {
          const result = await route.fetch();
          if (!result.ok()) injectionError = new Error(`fault injection action rejected: ${result.status()}`);
          acceptedWithoutAck = true;
          await ackLossBarrier;
          await route.abort('failed');
        } catch (error) { injectionError = error; await route.abort().catch(() => {}); }
        return;
      }
      if (acceptedWithoutAck) await retryBarrier;
      await route.continue().catch(() => {});
    };
    await interrupted.route(actionURL, routeHandler);
    try {
      const interruptedFrame = await frameReady(interrupted, 'linear-inequalities-stepwise');
      await interruptedFrame.locator('#val').fill('303');
      await poll(() => { if (injectionError) throw injectionError; return acceptedWithoutAck; }, 'accepted action with lost acknowledgement');
      assert.equal((await work('s3')).trainerState.answerValue, '303', 'A is durably accepted before its response is lost');
      const queuedAnswers = ['304', '305', '306', '307', '308'];
      for (let index = 0; index < queuedAnswers.length; index++) {
        await interruptedFrame.locator('#val').fill(queuedAnswers[index]);
        await poll(async () => interrupted.evaluate(({ key, count }) => JSON.parse(sessionStorage.getItem(key) || '{}').outbox?.length >= count,
          { key: `mathexam.group.outbox.${id}`, count: index + 2 }), 'later student states queued behind unacknowledged action');
      }
      releaseAckLoss();
      await teacher.locator('#roster button').nth(2).click();
      await teacher.locator('#trainerControlButton').click();
      await poll(async () => (await work('s3')).controller === 'teacher', 'teacher takes control while student acknowledgement is lost');
      const correction = await visibleFrame(teacher, (await work('s3')).assignmentId);
      await correction.locator('#val').fill('-2');
      await correction.locator('#check').click();
      await poll(async () => (await work('s3')).trainerState.done, 'teacher correction saved before old retry');
      await teacher.locator('#trainerControlButton').click();
      await poll(async () => (await work('s3')).controller === 'student', 'teacher returns control before old retry');
      const corrected = await work('s3');
      releaseRetry();
      await poll(async () => interrupted.evaluate(({ key, answers }) => {
        const queue = JSON.parse(sessionStorage.getItem(key) || '{}');
        return queue.outbox?.length === 0 && answers.every(answer => queue.rejected?.some(item => item.action?.payload?.state?.answerValue === answer));
      }, { key: `mathexam.group.outbox.${id}`, answers: queuedAnswers }), 'all dependent queued edits rejected after deduplicated A');
      assert.deepEqual(await work('s3'), corrected, 'stale queued state never overwrites teacher correction');
      await poll(async () => (await snapshotState(interruptedFrame)).answerValue === '-2', 'student sees preserved teacher correction after reconnect');
      console.log('PASS lost acknowledgement, deduplicated retry and stale queued update preserve teacher correction');
    } finally {
      releaseAckLoss();
      releaseRetry();
      await interrupted.unroute(actionURL, routeHandler);
    }
    await teacher.locator('#backButton').click();

    // Presenting a selected pupil's example is a separate, explicit permission.
    // Each listener continues their own assignment beside the readonly example.
    const ownBeforeExplanation = await work('s1');
    const negativeAssignment = (await work('s2')).assignmentId;
    await teacher.locator('#roster button').nth(2).click();
    await teacher.locator('#presentButton').click();
    await poll(async () => (await read()).presentation.target === 's3', 'teacher presents a selected pupil example');
    const presentedId = (await work('s3')).assignmentId;
    const explanation1 = await watchFrame(students[0], presentedId);
    const explanation2 = await watchFrame(students[1], presentedId);
    for (const page of [students[0], students[1]]) {
      await page.locator('#teacherWatch').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#teacherWatchTrainer .group-trainer-frame').getAttribute('data-read-only'), 'true', 'teacher explanation is readonly');
    }
    const ownBox = await students[1].locator('#focus').boundingBox();
    const explanationBox = await students[1].locator('#teacherWatch').boundingBox();
    assert.ok(ownBox && explanationBox && ownBox.x + ownBox.width <= explanationBox.x + 2, 'personal work and explanation are side by side on desktop');
    const personalNegative = await frameReady(students[1], 'negative-numbers-line');
    await personalNegative.locator('#next').click();
    const nextNegative = await snapshotState(personalNegative);
    await personalNegative.locator('#svg g.pt').nth(nextNegative.task.a + 10).click();
    await poll(async () => (await work('s2')).trainerState.phase === 'end', 'student continues their own task while watching the explanation');
    const personalAfterOwnEdit = await work('s2');
    assert.equal(personalAfterOwnEdit.assignmentId, negativeAssignment);

    await teacher.locator('#trainerControlButton').click();
    await poll(async () => (await work('s3')).controller === 'teacher', 'teacher controls the presented example');
    const presentedTrainer = await visibleFrame(teacher, presentedId);
    await presentedTrainer.locator('#solution').click();
    await poll(async () => (await snapshotState(explanation1)).currentStep === 3
      && (await snapshotState(explanation2)).currentStep === 3, 'both listeners see the live presented solution');
    await drawStroke(teacher, 160);
    await poll(async () => (await work('s3')).strokes.length > 0, 'teacher annotation saved on the presented example');
    await personalNegative.evaluate(() => window.scrollTo(0, 0));
    await students[1].screenshot({ path: path.join(ARTIFACTS, 'student-two-windows.png'), fullPage: true });
    await students[1].locator('#teacherWatchToggle').click();
    await students[1].locator('#teacherWatchCanvas').waitFor({ state: 'visible' });
    await poll(() => students[1].locator('#teacherWatchCanvas').evaluate(canvas => {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 0) return true;
      return false;
    }), 'teacher handwriting reaches the listener explanation window');
    await students[1].screenshot({ path: path.join(ARTIFACTS, 'student-two-windows-drawing.png'), fullPage: true });
    await students[1].locator('#teacherWatchToggle').click();

    const studentToken = created.invites[0].studentToken;
    const peerWrite = await fetch(actionURL, { method: 'POST', headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ opId: randomUUID(), type: 'stroke', target: 's3', assignmentId: presentedId,
        payload: { id: randomUUID(), points: [{ x: 0.1, y: 0.2 }], color: '#123456', width: 3 } }) });
    assert.equal(peerWrite.status, 403, 'watching a presented peer never grants write access');
    const studentPresent = await fetch(actionURL, { method: 'POST', headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ opId: randomUUID(), type: 'present', target: 'common', payload: { target: 's4' } }) });
    assert.equal(studentPresent.status, 403, 'student cannot choose a peer presentation');
    const peerHistory = await fetch(`${api.origin}/api/group-lessons/${id}/history?target=s3`, { headers: { Authorization: `Bearer ${studentToken}` } });
    assert.equal(peerHistory.status, 403, 'live presentation does not reveal a peer private history');
    const listenerSnapshot = await json(`${api.origin}/api/group-lessons/${id}`, studentToken);
    assert.equal(listenerSnapshot.students.length, 1);
    assert.equal(listenerSnapshot.presentation.target, 's3');
    assert.equal(listenerSnapshot.presentation.workspace.assignmentId, presentedId);
    assert.equal(listenerSnapshot.invites, undefined);

    await students[0].setViewportSize({ width: 390, height: 844 });
    await students[0].locator('#sheetTabs [data-sheet="presentation"]').click();
    const mobileExplanation = await visibleFrame(students[0], presentedId);
    await poll(async () => (await snapshotState(mobileExplanation)).currentStep === 3, 'mobile explanation tab shows the selected example');
    assert.equal(await students[0].locator('#trainerHost .group-trainer-frame').getAttribute('data-read-only'), 'true');
    assert.equal(await students[0].locator('#historyButton').isVisible(), false, 'peer history stays unavailable in enlarged explanation');
    await students[0].screenshot({ path: path.join(ARTIFACTS, 'student-mobile-explanation.png'), fullPage: true });
    await students[0].locator('#sheetTabs [data-sheet="mine"]').click();
    const mobileOwn = await visibleFrame(students[0], ownBeforeExplanation.assignmentId);
    assert.deepEqual(await snapshotState(mobileOwn), ownBeforeExplanation.trainerState, 'mobile own tab restores the unchanged assignment');
    assert.ok(await students[0].evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'student mobile workspace fits viewport');
    await students[0].setViewportSize({ width: 1280, height: 800 });

    // Keep an accepted input's acknowledgement in flight while the pupil changes
    // mobile tabs. The rebuilt own frame must use the latest pending input.
    const pendingPupil = students[5];
    let delayedInputAccepted = false, releaseInputAck;
    const delayedInputBarrier = new Promise(resolve => { releaseInputAck = resolve; });
    const pendingInputRoute = async route => {
      const action = route.request().postDataJSON();
      if (!delayedInputAccepted && action.type === 'trainer' && action.payload.state.answerValue === '616') {
        const accepted = await route.fetch();
        delayedInputAccepted = accepted.ok();
        await delayedInputBarrier;
        await route.fulfill({ response: accepted }).catch(() => {});
      } else await route.continue();
    };
    await pendingPupil.setViewportSize({ width: 390, height: 844 });
    await pendingPupil.route(actionURL, pendingInputRoute);
    try {
      const ownPendingFrame = await visibleFrame(pendingPupil, (await work('s6')).assignmentId);
      await ownPendingFrame.locator('#val').fill('616');
      await poll(() => delayedInputAccepted, 'student input accepted with acknowledgement delayed');
      await pendingPupil.locator('#sheetTabs [data-sheet="presentation"]').click();
      await pendingPupil.locator('#sheetTabs [data-sheet="mine"]').click();
      const restoredPendingFrame = await visibleFrame(pendingPupil, (await work('s6')).assignmentId);
      assert.equal(await restoredPendingFrame.locator('#val').inputValue(), '616', 'tab roundtrip preserves pending input before its acknowledgement');
      await restoredPendingFrame.locator('#val').fill('617');
      await poll(async () => pendingPupil.evaluate(key => JSON.parse(sessionStorage.getItem(key) || '{}').outbox?.length >= 2,
        `mathexam.group.outbox.${id}`), 'new input queues behind the preserved pending edit');
      releaseInputAck();
      await poll(async () => (await work('s6')).trainerState.answerValue === '617', 'continued input survives acknowledgement and tab switching');
      assert.equal(await restoredPendingFrame.locator('#val').inputValue(), '617');
    } finally {
      releaseInputAck();
      await pendingPupil.unroute(actionURL, pendingInputRoute);
      await pendingPupil.setViewportSize({ width: 1280, height: 800 });
    }

    await teacher.locator('#trainerControlButton').click();
    await poll(async () => (await work('s3')).controller === 'student', 'teacher returns control of the demonstrated example');
    await teacher.locator('#roster button').nth(3).click();
    await poll(async () => (await read()).presentation.target === 's4', 'active presentation follows the next teacher-selected workspace');
    await watchFrame(students[1], (await work('s4')).assignmentId);
    assert.deepEqual(await work('s1'), ownBeforeExplanation, 'teacher presentation does not change listener one work');
    assert.deepEqual(await work('s2'), personalAfterOwnEdit, 'switching teacher explanation preserves listener two work');
    await students[0].locator('#sheetTabs [data-sheet="presentation"]').click();
    const lastPresentedId = (await work('s4')).assignmentId;
    await visibleFrame(students[0], lastPresentedId);
    await teacher.locator('#presentButton').click();
    await poll(async () => (await json(`${api.origin}/api/group-lessons/${id}`, studentToken)).presentation.target === null, 'stop removes the peer projection from student responses');
    await poll(async () => await students[1].locator('#teacherWatchTrainer iframe').count() === 0, 'stopped explanation removes the peer iframe');
    await poll(async () => await students[0].locator(`.group-trainer-frame[data-assignment-id="${lastPresentedId}"]`).count() === 0, 'stopped explanation removes enlarged peer view too');
    await students[0].locator('#sheetTabs [data-sheet="mine"]').click();
    await teacher.locator('#roster button').nth(4).click();
    assert.equal((await json(`${api.origin}/api/group-lessons/${id}`, studentToken)).presentation.target, null, 'ordinary teacher browsing remains private after presentation stops');
    await teacher.locator('#backButton').click();
    console.log('PASS personal work plus explicit live teacher explanation, readonly peer privacy and mobile tabs');

    // Exercise a real second history page plus retrying a temporary rate limit.
    // Spacing stays within the production API's per-actor write rate.
    const paginatedAssignment = (await work('s4')).assignmentId;
    let lastHistoryWrite;
    for (let index = 0; index < 105; index++) {
      lastHistoryWrite = await json(actionURL, teacherToken, {
        method: 'POST', body: JSON.stringify({ opId: randomUUID(), type: 'help', target: 's4',
          assignmentId: paginatedAssignment, payload: { active: index % 2 === 0 } })
      });
      await delay(105);
    }
    await teacher.waitForResponse(async response => response.request().method() === 'GET'
      && response.url().startsWith(`${api.origin}/api/group-lessons/${id}`)
      && !response.url().includes('/history') && (await response.json()).revision >= lastHistoryWrite.revision);
    let rateLimitInjected = false, secondHistoryPageSeen = false;
    const historyPattern = new RegExp(`/api/group-lessons/${id}/history\\?`);
    const historyRoute = async route => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('target') === 's4' && Number(url.searchParams.get('after')) > 0) secondHistoryPageSeen = true;
      if (!rateLimitInjected) {
        rateLimitInjected = true;
        await route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'GROUP_RATE_LIMITED' }) });
      } else await route.continue();
    };
    await teacher.route(historyPattern, historyRoute);
    try {
      const [download] = await Promise.all([teacher.waitForEvent('download'), teacher.locator('#exportButton').click()]);
      const exportPath = path.join(ARTIFACTS, 'recording.json');
      await download.saveAs(exportPath);
      const exportedText = fs.readFileSync(exportPath, 'utf8');
      const exported = JSON.parse(exportedText);
      assert.equal(exported.format, 'mathexam-group-lesson', 'full recording export succeeds after a rate-limit retry');
      assert.equal(exported.history.s4.events.filter(event => event.type === 'help').length, 105, 'export includes every paginated event');
      assert.ok(rateLimitInjected && secondHistoryPageSeen, 'temporary 429 and second history page exercised');
      assert.ok(Object.values(exported.history).every(record => record.events.every(event => event.revision <= exported.revision)), 'export uses one consistent revision cutoff');
      for (const token of [teacherToken, ...created.invites.map(invite => invite.studentToken)]) {
        assert.ok(!exportedText.includes(token), 'recording contains no access credentials');
      }
      console.log('PASS recording export includes paginated history, retries 429 and omits access credentials');
    } finally { await teacher.unroute(historyPattern, historyRoute); }

    // Review screenshot uses the actual work just performed in this gate:
    // handwriting, a completed number-line task, corrected and intermediate work.
    const intermediate = await frameReady(students[3], 'linear-inequalities-stepwise');
    await intermediate.locator('[data-act="move"]').click();
    await intermediate.locator('[data-act="combine"]').click();
    await poll(async () => (await work('s4')).trainerState.currentStep === 2, 'intermediate pupil work for overview');
    await teacher.locator('#sheetTabs [data-sheet="0"]').click();
    await teacher.locator('#studentGrid [data-seat="s1"]').getByRole('button', { name: 'Показать доску', exact: true }).click();
    await teacher.locator('#studentGrid [data-seat="s1"] .preview-board').waitFor({ state: 'visible' });
    for (const seatId of ['s2', 's3', 's4']) await visibleFrame(teacher, (await work(seatId)).assignmentId);
    const intermediateMirror = await visibleFrame(teacher, (await work('s4')).assignmentId);
    await poll(async () => (await snapshotState(intermediateMirror)).currentStep === 2, 'intermediate steps visible in preview');
    assert.equal(await intermediateMirror.locator('aside').isVisible(), false, 'compact trainer preview keeps standalone statistics hidden');
    assert.match(await teacher.locator('#studentGrid [data-seat="s4"] .preview-summary').innerText(), /ответ не проверен/, 'a correct intermediate step does not certify an unchecked answer');
    await teacher.screenshot({ path: path.join(ARTIFACTS, 'group-overview-varied.png'), fullPage: true });

    const stored = await read();
    await api.stop();
    api = await backend(backendPort, store);
    await teacher.reload();
    await teacher.locator('#app').waitFor({ state: 'visible' });
    const restored = await read();
    assert.equal(restored.revision, stored.revision, 'server restart keeps accepted history revision');
    assert.deepEqual(restored.students.map(student => student.workspace), stored.students.map(student => student.workspace), 'server restart keeps all trainer states and drawings');
    await students[0].reload();
    const restartedFrame = await frameReady(students[0], 'linear-inequalities-stepwise');
    await poll(async () => (await snapshotState(restartedFrame)).done === true, 'student resumes after backend restart');
    console.log('PASS durable state survives server restart and browser reload');

    const mobile = await pageFor({ width: 390, height: 844 });
    await mobile.goto(`${site.origin}/trainers/group-board.html`);
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'setup fits mobile viewport');
    await mobile.screenshot({ path: path.join(ARTIFACTS, 'group-mobile.png'), fullPage: true });
    for (const token of [teacherToken, ...created.invites.map(invite => invite.studentToken)]) {
      assert.ok(requests.every(url => !url.includes(token)), 'credentials never transmitted in request URLs');
    }
    assert.deepEqual(errors, [], 'no uncaught browser errors');
    for (const page of [teacher, ...students]) {
      assert.equal(await page.evaluate(() => localStorage.getItem('mathExamCourseProgress.v1')), soloProgress, 'group work and replay never alter independent solo statistics');
    }
    console.log(JSON.stringify({ gate: 'GROUP_BOARD_BROWSER_OK', students: 8, browser: browser.version(), durableRestart: true, screenshots: ARTIFACTS }));
  } catch (error) {
    if (teacher) await teacher.screenshot({ path: path.join(ARTIFACTS, 'failure.png'), fullPage: true }).catch(() => {});
    console.error(`Browser artifacts: ${ARTIFACTS}`);
    throw error;
  } finally {
    await browser.close();
    await api.stop();
    await site.close();
  }
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
