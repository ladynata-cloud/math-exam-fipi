'use strict';
// Local, isolated SQLite + real HTTP auth + real sharp photo codec + Chromium.
// All eight pupils, passwords, uploads and cookies are synthetic test fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const { once } = require('node:events');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const serverRequire = createRequire(path.join(root, 'board-server/package.json'));
const express = serverRequire('express'), sharp = serverRequire('sharp');
const { LearningStore } = require('../board-server/learning-store');
const { createLearningApi } = require('../board-server/learning-api');
const { createTeachingRouter } = require('../board-server/learning-teaching');
const contracts = require('../board-server/learning-contracts');
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw Error('Playwright is required. Install playwright, set NODE_PATH, or set CODEX_PRIMARY_RUNTIME_NODE_MODULES to its node_modules directory.');
  ({ chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright')));
}

async function main() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-teaching-browser-'));
  const store = new LearningStore({ filePath: path.join(directory, 'learning.sqlite'), contracts });
  assert.equal(store.available, true);
  const placeholderHash = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
  const teacherInvite = store.bootstrap({ login: 'fixture_teacher', name: 'Учитель' });
  const teacher = store.activate(teacherInvite.invitationToken, placeholderHash);
  const students = Array.from({ length: 8 }, (_, index) => {
    const invite = store.createStudent(teacher.account, { login: 'fixture_pupil_' + (index + 1), name: 'Ученик ' + (index + 1) });
    return store.activate(invite.invitationToken, placeholderHash);
  });
  const created = store.createAssignments(teacher.account, { opId: crypto.randomUUID(), title: 'Геометрия для восьми учеников', learnerIds: students.map(student => student.account.id), trainerId: 'ege-path', contentId: 'triangle', dueAt: '2026-10-12' });
  assert.equal(created.assignments.length, 8);
  assert.equal(new Set(created.assignments.map(assignment => assignment.batchId)).size, 1);
  const assignmentId = created.assignments[0].id;
  const app = express(); app.use(express.json({ limit: '6mb' }));
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  const learning = createLearningApi({ store, publicOrigin: origin, secureCookies: false });
  app.use('/api/learning', learning.router); app.use('/api/learning', createTeachingRouter(learning));
  app.use('/learning', express.static(path.join(root, 'learning')));
  app.get('/fixture', (_request, response) => response.type('html').send('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/learning/style.css"><link rel="stylesheet" href="/learning/teaching.css"><body><div class="content-column"><main id="host" style="max-width:1160px;margin:auto"></main></div><script src="/learning/catalog.js"></script><script src="/learning/outcomes.js"></script><script src="/learning/teaching.js"></script></body></html>'));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), args: ['--no-sandbox'] });
    async function open(session, viewport) {
      const context = await browser.newContext({ viewport: viewport || { width: 1440, height: 1000 }, locale: 'ru-RU' });
      await context.addCookies([{ name: 'mathexam_learning_local', value: session.sessionToken, url: origin, httpOnly: true, sameSite: 'Strict' }]);
      const page = await context.newPage();
      await page.goto(origin + '/fixture');
      await page.evaluate(async id => {
        const session = await (await fetch('/api/learning/session', { credentials: 'same-origin' })).json();
        window.notices = [];
        const api = async (route, options = {}) => {
          const response = await fetch('/api/learning' + route, { ...options, credentials: 'same-origin', headers: { ...(options.body ? { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken } : {}), ...options.headers } });
          const data = await response.json();
          if (!response.ok) throw Object.assign(Error(data.error), { code: data.error, status: response.status });
          return data;
        };
        const list = session.account.role === 'teacher' ? await api('/teacher/students') : { students: [] };
        window.teachingContext = { id, account: session.account, api, catalog: LearningCatalog, students: Array.isArray(list) ? list : list.students, notice: (message, error) => notices.push({ message, error }), navigate: route => { window.navigated = route; } };
        window.cleanup = LearningTeaching.mount(document.querySelector('#host'), { ...teachingContext, page: 'assignment' });
      }, assignmentId);
      return { page, context };
    }
    const { page: teacherPage, context: teacherContext } = await open(teacher);
    await teacherPage.getByRole('heading', { name: 'Общее задание для группы' }).waitFor();
    assert.equal(await teacherPage.locator('[data-batch-target]:checked').count(), 8);
    assert.equal(await teacherPage.locator('[data-publish-batch]').isDisabled(), true);
    const sourcePhoto = path.join(root, 'learning/reference-assets/fipi-2027-areas-solids.png');
    await teacherPage.locator('#teaching-photo [type=file]').setInputFiles(sourcePhoto);
    await teacherPage.waitForFunction(() => !document.querySelector('#teaching-photo [type=submit]').disabled);
    assert.equal(store.row('SELECT COUNT(*) AS n FROM learning_photos').n, 0, 'Preview must not upload');
    const uploadRequests = [];
    await teacherPage.route('**/api/learning/assignments/*/photos', async route => {
      uploadRequests.push(route.request().postDataJSON());
      const response = await route.fetch();
      if (uploadRequests.length === 4) await route.abort('failed'); // committed fourth photo, lost ACK
      else await route.fulfill({ response });
    });
    await teacherPage.locator('#teaching-photo [type=submit]').click();
    await teacherPage.waitForFunction(() => notices.some(notice => notice.error));
    assert.equal(store.row("SELECT COUNT(*) AS n FROM learning_photos WHERE kind='task'").n, 4);
    await teacherPage.evaluate(() => { notices = []; });
    await teacherPage.locator('#teaching-photo [type=submit]').click();
    await teacherPage.waitForFunction(() => document.querySelector('[data-publish-batch]') && !document.querySelector('[data-publish-batch]').disabled, { timeout: 30000 });
    assert.equal(uploadRequests.length, 9, 'Retry skips three acknowledged uploads and retries the fourth');
    assert.equal(uploadRequests[3].opId, uploadRequests[4].opId, 'Lost ACK retains operation identity');
    assert.equal(store.row("SELECT COUNT(*) AS n FROM learning_photos WHERE kind='task'").n, 8);
    assert.equal(store.row('SELECT COUNT(*) AS n FROM learning_photo_files').n, 1, 'Eight references share one decoded image');
    const photoRows = store.rows('SELECT * FROM learning_photos');
    const clean = store.row('SELECT data FROM learning_photo_files').data;
    const meta = await sharp(Buffer.from(clean)).metadata();
    assert.equal(meta.format, 'jpeg'); assert.ok(meta.width > 800 && meta.height > 1000); assert.equal(meta.exif, undefined);
    await teacherPage.locator('[data-publish-batch]').click();
    await teacherPage.waitForFunction(() => document.querySelectorAll('[data-batch-target]:disabled').length === 8, { timeout: 30000 });
    assert.equal(store.row("SELECT COUNT(*) AS n FROM assignments WHERE status='published'").n, 8);
    const studentSession = students.find(student => student.account.id === created.assignments[0].learnerId);
    const { page: studentPage, context: studentContext } = await open(studentSession, { width: 375, height: 812 });
    await studentPage.getByRole('heading', { name: 'Копии решений в кабинете' }).waitFor();
    assert.equal(await studentPage.locator('[data-batch-target]').count(), 0, 'Pupil sees no peer roster');
    await studentPage.locator('.teaching-photo-grid img').first().evaluate(image => image.decode());
    assert.ok(await studentPage.locator('.teaching-photo-grid img').first().evaluate(image => image.naturalWidth > 800));
    const ownPhoto = photoRows.find(photo => photo.assignment_id === assignmentId);
    const peerPhoto = photoRows.find(photo => photo.assignment_id !== assignmentId);
    assert.equal((await studentContext.request.get(origin + '/api/learning/photos/' + ownPhoto.id)).status(), 200);
    assert.equal((await studentContext.request.get(origin + '/api/learning/photos/' + peerPhoto.id)).status(), 404);
    await studentPage.locator('#teaching-photo [type=file]').setInputFiles(sourcePhoto);
    await studentPage.waitForFunction(() => !document.querySelector('#teaching-photo [type=submit]').disabled);
    await studentPage.locator('#teaching-photo [type=submit]').click();
    await studentPage.waitForFunction(() => document.querySelectorAll('.teaching-photo-grid img').length === 2);
    assert.equal(store.row("SELECT COUNT(*) AS n FROM learning_photos WHERE kind='solution'").n, 1);
    await teacherPage.evaluate(() => { cleanup(); cleanup = LearningTeaching.mount(document.querySelector('#host'), { ...teachingContext, page: 'assignment' }); });
    await teacherPage.locator('#teaching-feedback [name=text]').fill('Ход решения проверен. Высота соответствует основанию.');
    await teacherPage.locator('#teaching-feedback [name=status]').selectOption('accepted');
    await teacherPage.locator('#teaching-feedback [type=submit]').click();
    await teacherPage.getByText('Ход решения проверен. Высота соответствует основанию.', { exact: true }).waitFor();
    assert.equal(store.row('SELECT outcome FROM attempts WHERE id=?', created.assignments[0].attemptId).outcome, 'started', 'Photo acceptance is separate from trainer independence');
    await studentPage.evaluate(() => { cleanup(); cleanup = LearningTeaching.mount(document.querySelector('#host'), { ...teachingContext, page: 'assignment' }); });
    await studentPage.getByText('Ход решения проверен. Высота соответствует основанию.', { exact: true }).waitFor();
    assert.equal(await studentPage.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const imageLocator = studentPage.locator('.teaching-photo-grid img');
    for (let i = 0; i < await imageLocator.count(); i++) await imageLocator.nth(i).evaluate(image => image.decode());
    if (process.env.LEARNING_ARTIFACT_DIR) {
      fs.mkdirSync(process.env.LEARNING_ARTIFACT_DIR, { recursive: true });
      await studentPage.screenshot({ path: path.join(process.env.LEARNING_ARTIFACT_DIR, 'homework-real-student-mobile.png'), fullPage: true });
      await teacherPage.screenshot({ path: path.join(process.env.LEARNING_ARTIFACT_DIR, 'homework-real-eight-desktop.png'), fullPage: true });
    }
    assert.deepEqual(await teacherPage.evaluate(() => notices.filter(notice => notice.error)), []);
    assert.deepEqual(await studentPage.evaluate(() => notices.filter(notice => notice.error)), []);
    await teacherContext.close(); await studentContext.close();
    console.log('LEARNING_TEACHING_LIVE_BROWSER_OK (8 authenticated drafts, one photo for all, partial lost-ACK retry, sharp decode + shared storage, publication, private mobile gallery, student upload, manual feedback)');
  } finally {
    if (browser) await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); learning.close(); fs.rmSync(directory, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
