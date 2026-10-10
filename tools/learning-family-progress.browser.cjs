'use strict';
// Real production router, isolated SQLite and real managed trainer frames.
// Synthetic accounts only: no production writes, pasted grades or real names.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createRequire } = require('node:module');
const ROOT = path.resolve(__dirname, '..');
const serverRequire = createRequire(path.join(ROOT, 'board-server/package.json'));
const express = serverRequire('express');
const { LearningStore } = require('../board-server/learning-store');
const contracts = require('../board-server/learning-contracts');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright') : 'playwright');
const PASSWORD = 'Synthetic-family-progress-2026';
const CONTENT = 'multiplication-division/long-division-from-simple-to-decimals';
const uuid = () => crypto.randomUUID();
async function artifact(page, name) {
  if (!process.env.LEARNING_FAMILY_ARTIFACTS) return;
  fs.mkdirSync(process.env.LEARNING_FAMILY_ARTIFACTS, { recursive: true });
  await page.screenshot({ path: path.join(process.env.LEARNING_FAMILY_ARTIFACTS, name + '.png'), fullPage: false });
}
async function until(read, accepts, label) {
  const end = Date.now() + 20000; let value;
  while (Date.now() < end) { value = await read(); if (accepts(value)) return value; await new Promise(resolve => setTimeout(resolve, 80)); }
  throw Error(label + ': ' + JSON.stringify(value));
}
const api = (page, route, body) => page.evaluate(async ({ route, body }) => LearningApp.api(route,
  body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }), { route, body });
const parentOverview = page => page.evaluate(async () => { const r = await fetch('/api/learning/parent/overview'); if (!r.ok) throw Error('Parent overview: ' + r.status); return r.json(); });
const trainerFrame = page => page.frameLocator('#trainer-host iframe');
async function frameReady(page) { await page.locator('#trainer-host iframe').waitFor(); await page.waitForFunction(() => document.querySelector('#trainer-host .frame-status')?.hidden); }
const saved = page => page.waitForFunction(() => /^(Все изменения сохранены|Сохранено в кабинете)/.test(document.querySelector('#save-state')?.textContent || ''));
const pending = page => page.waitForFunction(() => /Ожидает отправки|Нет связи/.test(document.querySelector('#save-state')?.textContent || ''));
async function main() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-family-progress-'));
  const filePath = path.join(directory, 'learning.sqlite');
  const store = new LearningStore({ filePath, contracts }); assert(store.available);
  const invitation = store.bootstrap({ name: 'Тестовый преподаватель', login: 'fixture_progress_teacher' }); store.close();
  const trainer = express(); trainer.use(express.static(ROOT));
  const trainerServer = trainer.listen(0, '127.0.0.1'); await once(trainerServer, 'listening');
  const trainerOrigin = 'http://127.0.0.1:' + trainerServer.address().port;
  const socket = net.createServer(); socket.listen(0, '127.0.0.1'); await once(socket, 'listening');
  const port = socket.address().port; await new Promise(resolve => socket.close(resolve));
  const origin = 'http://127.0.0.1:' + port;
  const child = spawn(process.execPath, ['index.js'], { cwd: path.join(ROOT, 'board-server'),
    env: { PATH: process.env.PATH, NODE_ENV: 'test', HOST: '127.0.0.1', PORT: String(port),
      LEARNING_DB_PATH: filePath, LEARNING_LOCAL_DEV: '1', LEARNING_PUBLIC_ORIGIN: origin,
      LEARNING_TRAINER_ORIGIN: trainerOrigin, GROUP_LESSON_STORE_DIR: path.join(directory, 'group-lessons') },
    stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; child.stdout.on('data', value => { log = (log + value).slice(-4000); }); child.stderr.on('data', value => { log = (log + value).slice(-4000); });
  let browser; const pageErrors = [];
  try {
    await until(async () => { try { return (await fetch(origin + '/api/learning/status')).ok; } catch (_) { if (child.exitCode !== null) throw Error(log); return false; } }, Boolean, 'Server ready');
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    async function open(width = 1280) {
      const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 960 }, locale: 'ru-RU' });
      await context.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort('blockedbyclient'));
      const page = await context.newPage(); page.setDefaultTimeout(15000); page.on('pageerror', error => pageErrors.push(error.message));
      return { page, context };
    }
    const teacher = await open(), tp = teacher.page;
    await tp.goto(origin + '/learning/#invite=' + invitation.invitationToken);
    await tp.locator('#auth-form [name=password]').fill(PASSWORD); await tp.locator('#auth-form [name=confirm]').fill(PASSWORD);
    await tp.locator('#auth-form [type=submit]').click(); await tp.locator('#recovery-saved').check(); await tp.locator('#done-codes').click();
    await tp.locator('#navigation').waitFor();
    const pupil = (await api(tp, '/teacher/students', { name: 'Тестовая ученица', login: 'fixture_progress_pupil', password: PASSWORD })).student;
    const peer = (await api(tp, '/teacher/students', { name: 'Другой тестовый ученик', login: 'fixture_progress_peer', password: PASSWORD })).student;
    for (const person of [pupil, peer]) await api(tp, '/teacher/students/' + person.id + '/profile', { opId: uuid(), expectedVersion: 0, course: 'oge', goal: 'pass', focus: '' });
    await api(tp, '/teacher/students/' + pupil.id + '/plan', { opId: uuid(), items: [{ catalogId: 'oge-basics:' + CONTENT, reason: 'Деление: один шаг за другим', priority: 'high' }, { catalogId: 'path:practice-fraction-divide', reason: 'Затем деление дробей', priority: 'normal' }], note: 'Тестовый маршрут' });
    const issued = await api(tp, '/teacher/students/' + pupil.id + '/parent-access', { name: 'Тестовый родитель', expectedVersion: 0 });
    const parent = await open(), pp = parent.page;
    await pp.goto(origin + '/learning/parent.html#invite=' + issued.invitationToken);
    await pp.locator('#parent-auth-form [name=password]').fill(PASSWORD); await pp.locator('#parent-auth-form [name=confirm]').fill(PASSWORD); await pp.locator('#parent-auth-submit').click();
    await pp.locator('#parent-overview').waitFor();
    // Consolidated teacher card copies existing access information. Viewing
    // either entry must not issue invitations, rotate passwords or switch roles.
    await tp.evaluate(() => LearningApp.refresh());
    await tp.evaluate(id => LearningApp.navigate('student=' + id), pupil.id);
    await tp.locator('[data-family-parent-state]').filter({ hasText: 'Кабинет активирован' }).waitFor();
    const familyBefore = await api(tp, '/teacher/students/' + pupil.id + '/parent-access');
    const teacherBefore = (await api(tp, '/session')).account.id;
    const accessWrites = [];
    const watchAccess = request => { if (request.method() === 'POST' && request.url().includes('/api/learning/teacher/students/' + pupil.id)) accessWrites.push(request.url()); };
    tp.on('request', watchAccess);
    await artifact(tp, 'family-teacher-card-1280');
    await tp.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copiedFamilyEntry = value; } } }));
    await tp.locator('[data-student-entry]').click();
    const copied = await tp.evaluate(() => window.copiedFamilyEntry);
    assert(copied.includes(pupil.login)); assert(copied.includes(origin + '/learning/?role=student#login='));
    assert(!copied.includes(PASSWORD), 'Copy contains a login and a non-secret permanent address only');
    await tp.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw Error('Synthetic clipboard denial'); } } }));
    await tp.locator('[data-student-entry]').click();
    await tp.locator('#student-entry-link').waitFor();
    assert.equal(await tp.locator('#student-entry-link').getAttribute('readonly'), '');
    assert.equal(await tp.locator('#student-entry-link').evaluate(node => node.selectionEnd - node.selectionStart), (await tp.locator('#student-entry-link').inputValue()).length);
    assert.equal(await tp.locator('#modal input[type=password]').count(), 0);
    await tp.locator('#dialog-close').click();
    await tp.locator('[data-family-parent]').click(); await tp.locator('#parent-access-login').waitFor();
    assert.equal(await tp.locator('#parent-access-login').inputValue(), familyBefore.parentAccess.login);
    assert.equal(await tp.locator('[data-parent-issue]').isDisabled(), true, 'Existing family access cannot be replaced by opening its settings');
    assert.equal(await tp.locator('#parent-reissue-confirm').isChecked(), false);
    assert.equal(await tp.locator('#modal input[type=password]').count(), 0);
    await tp.locator('[data-parent-copy-login]').click();
    assert.equal(await tp.locator('#parent-return-link').evaluate(node => node.selectionEnd - node.selectionStart), (await tp.locator('#parent-return-link').inputValue()).length);
    await tp.locator('#dialog-close').click();
    assert.deepEqual(await api(tp, '/teacher/students/' + pupil.id + '/parent-access'), familyBefore);
    assert.equal((await api(tp, '/session')).account.id, teacherBefore);
    assert.deepEqual(accessWrites, [], 'Copying and opening metadata never mutate either account');
    tp.off('request', watchAccess);
    const student = await open(390), sp = student.page;
    await sp.goto(origin + '/learning/#login=' + pupil.login);
    await sp.locator('#auth-form [name=password]').fill(PASSWORD); await sp.locator('#auth-form [type=submit]').click();
    await sp.locator('[data-prep-next] [data-prep-start]').waitFor();
    assert.equal(await sp.locator('[data-prep-next] [data-prep-start]').getAttribute('data-prep-start'), 'oge-basics:' + CONTENT, 'First action follows teacher plan, never an unrelated school course');
    assert.equal(await sp.locator('#main .primary:visible').count(), 1, 'Home has one primary starting action');
    assert.equal(await sp.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'Home fits a phone');
    await artifact(sp, 'family-student-start-390');
    await sp.locator('[data-prep-next] [data-prep-start]').click(); await frameReady(sp);
    const attemptId = new URLSearchParams(new URL(sp.url()).hash.slice(1)).get('attempt');
    const initial = await api(sp, '/attempts/' + attemptId); assert.equal(initial.contentId, CONTENT);
    assert.equal((await parentOverview(pp)).progress.totalAttempts, 1);
    assert.equal((await parentOverview(pp)).progress.completedAttempts, 0, 'Opening a task does not complete it');

    // No ACK: preserve exact draft, task and attempt through reload.
    await sp.route('**/api/learning/attempts/*/actions', route => route.abort('failed'));
    await trainerFrame(sp).locator('#lm-answer').fill('123456789'); await pending(sp);
    assert.equal((await api(tp, '/attempts/' + attemptId)).state.answer, '', 'Unsent draft never appears as saved');
    await sp.reload(); await frameReady(sp); await pending(sp);
    assert.equal(await trainerFrame(sp).locator('#lm-answer').inputValue(), '123456789', 'Unsent input survives reload on the same tab');
    assert.equal((await api(sp, '/attempts/' + attemptId)).taskSpec.seed, initial.taskSpec.seed);
    const learnerCookie = (await student.context.cookies(origin)).find(cookie => cookie.name === 'mathexam_learning_local');
    assert(learnerCookie);

    // Simulate a same-browser account switch in another tab. Its queue must
    // remain isolated and must resume only after the original principal returns.
    const peerContext = await open(); const peerPage = peerContext.page;
    await peerPage.goto(origin + '/learning/#login=' + peer.login); await peerPage.locator('#auth-form [name=password]').fill(PASSWORD); await peerPage.locator('#auth-form [type=submit]').click(); await peerPage.locator('#navigation').waitFor();
    const peerCookie = (await peerContext.context.cookies(origin)).find(cookie => cookie.name === 'mathexam_learning_local');
    await student.context.addCookies([peerCookie]); await sp.goto(origin + '/learning/');
    await sp.locator('[data-prep-next]').waitFor();
    assert.equal((await api(sp, '/session')).account.id, peer.id);
    assert.equal((await api(sp, '/attempts')).attempts.length, 0);
    assert(!(await sp.locator('#main').innerText()).includes('123456789'), 'Other learner never sees queued draft');
    await student.context.addCookies([learnerCookie]); await sp.goto(origin + '/learning/#attempt=' + attemptId); await frameReady(sp);
    assert.equal(await trainerFrame(sp).locator('#lm-answer').inputValue(), '123456789');
    await sp.unroute('**/api/learning/attempts/*/actions'); await sp.evaluate(() => window.dispatchEvent(new Event('online'))); await saved(sp);
    assert.equal((await api(tp, '/attempts/' + attemptId)).state.answer, '123456789');

    // The real managed long-division frame sends every mathematical step.
    // Cut the last acknowledgement after commit, then prove idempotent replay.
    let lost = false; const finalOps = [];
    await sp.route('**/api/learning/attempts/*/actions', async route => {
      const body = route.request().postDataJSON();
      if (body.type === 'check' && body.payload?.state?.completed) {
        finalOps.push(body.opId); const response = await route.fetch(); assert.equal(response.status(), 200);
        if (!lost) { lost = true; await route.abort('failed'); } else await route.fulfill({ response });
      } else await route.continue();
    });
    let current = await api(sp, '/attempts/' + attemptId);
    while (!current.state.completed) {
      const step = current.taskSpec.steps[current.state.step], answer = step.answer;
      if (step.kind === 'choice') await trainerFrame(sp).locator('[data-choice="' + answer + '"]').click();
      else await trainerFrame(sp).locator('#lm-answer').fill(typeof answer === 'object' ? answer.n + '/' + answer.d : String(answer));
      await saved(sp); const beforeStep = current.state.step;
      await trainerFrame(sp).locator('#lm-check').click();
      current = await until(() => api(sp, '/attempts/' + attemptId), value => value.state.step > beforeStep, 'Division step committed');
      if (!current.state.completed) await saved(sp);
    }
    assert(lost, 'Final acknowledgement was intentionally lost');
    const committed = await api(tp, '/attempts/' + attemptId);
    assert.equal(committed.outcome, 'independent');
    const overview = await parentOverview(pp);
    assert.equal(overview.progress.completedAttempts, 1); assert.equal(overview.progress.independentAttempts, 1);
    assert.equal(overview.progress.totalAttempts, 1, 'One continuous attempt across reload and recovery');
    assert(!JSON.stringify(overview).includes('123456789'), 'Parent receives summary, not raw learner input');
    await saved(sp); assert(finalOps.length >= 2); assert.equal(new Set(finalOps).size, 1, 'Lost ACK retries the same operation');
    const report = await api(tp, '/teacher/students/' + pupil.id + '/report');
    assert.equal(report.attempts.find(a => a.id === attemptId).outcome, overview.progress.recent[0].outcome);
    await pp.locator('#parent-refresh').click(); await pp.locator('[data-parent-count="independent"]').filter({ hasText: '1' }).waitFor();
    await sp.reload(); await frameReady(sp);
    assert.equal((await api(sp, '/attempts')).attempts.length, 1); assert.equal((await api(sp, '/attempts/' + attemptId)).state.completed, true);

    // A published assignment outranks free practice on the next home visit.
    const assignment = (await api(tp, '/assignments', { opId: uuid(), learnerIds: [pupil.id], title: 'Тестовая домашняя работа по дробям', trainerId: 'ege-path', contentId: 'practice-fraction-divide' })).assignments[0];
    await api(tp, '/assignments/' + assignment.id + '/paper', { opId: uuid(), topic: 'fractions' });
    await api(tp, '/assignments/' + assignment.id + '/publish', { opId: uuid() });
    await sp.goto(origin + '/learning/'); await sp.locator('[data-prep-next] a').waitFor();
    assert.equal(await sp.locator('[data-prep-next] a.primary').getAttribute('href'), '#assignment=' + assignment.id);
    assert.equal((await parentOverview(pp)).homework.recent[0].title, assignment.title);
    assert.equal(await sp.locator('#main .primary:visible').count(), 1);
    const denied = await peerPage.evaluate(async id => (await fetch('/api/learning/attempts/' + id)).status, attemptId); assert.equal(denied, 404);
    assert.deepEqual(pageErrors, []);
    console.log('LEARNING_FAMILY_PROGRESS_BROWSER_OK (safe teacher access cards + clipboard fallback, plan first, one primary action, real division frame, offline reload, account isolation, lost-ACK idempotency, teacher-parent same result, assignment priority, mobile fit)');
  } finally {
    if (browser) await browser.close();
    if (child.exitCode === null && child.signalCode === null) { child.kill('SIGTERM'); await once(child, 'exit'); }
    trainerServer.closeAllConnections(); await new Promise(resolve => trainerServer.close(resolve)); fs.rmSync(directory, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
