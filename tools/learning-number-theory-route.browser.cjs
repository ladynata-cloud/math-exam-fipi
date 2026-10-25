'use strict';

// Actual teacher forms, local HTTP and an isolated SQLite database. All accounts
// and saved work are synthetic; browser traffic cannot reach a public service.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { createRequire } = require('node:module');
const ROOT = path.resolve(__dirname, '..');
const serverRequire = createRequire(path.join(ROOT, 'board-server/package.json'));
const express = serverRequire('express');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'))); }
const { LearningStore } = require('../board-server/learning-store');
const { createLearningApi } = require('../board-server/learning-api');
const { createTeachingRouter } = require('../board-server/learning-teaching');
const { hashPassword } = require('../board-server/learning-auth');
const contracts = require('../board-server/learning-contracts');

const MARKER = 'Индивидуальный маршрут: только НОК и НОД.';
const COMMENT = 'Сначала разложи числа на простые множители.\nПредыдущие записи сохраняем; <b>это обычный текст</b>.';
const PEER_COMMENT = 'Другой учебный маршрут.\nhttps://mathexam.space/trainers/grade6-nok.html\nhttps://mathexam.space/trainers/grade6-nod.html';
const PASSWORD = 'Synthetic-number-theory-route-2026';
const IDS = ['grade6-nok', 'grade6-nod'];
const URLS = IDS.map(id => 'https://mathexam.space/trainers/' + id + '.html');
const PROFILE_FIELDS = ['course', 'expectedVersion', 'focus', 'goal', 'opId'];
const artifacts = process.env.NUMBER_THEORY_ROUTE_ARTIFACTS ? path.resolve(process.env.NUMBER_THEORY_ROUTE_ARTIFACTS) : null;
const descendant = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative !== '' && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
};
function canonicalPath(value) {
  let current = path.resolve(value);
  const missing = [];
  while (!fs.existsSync(current)) {
    missing.unshift(path.basename(current));
    current = path.dirname(current);
  }
  return path.join(fs.realpathSync(current), ...missing);
}
if (artifacts) {
  const target = canonicalPath(artifacts);
  const tempRoots = [os.tmpdir(), process.env.RUNNER_TEMP].filter(value => value && path.isAbsolute(value)).map(canonicalPath);
  const repository = fs.realpathSync(ROOT);
  assert.ok(tempRoots.some(parent => descendant(parent, target)), 'NUMBER_THEORY_ROUTE_ARTIFACTS must be beneath a temporary directory');
  assert.ok(target !== repository && !descendant(repository, target), 'Browser artifacts must remain outside the repository');
  fs.mkdirSync(artifacts, { recursive: true });
}
const report = { status: 'RUNNING', startedAt: new Date().toISOString(), checks: [], screenshots: [], viewports: [], publicRequestsAllowed: 0 };
const plain = value => JSON.parse(JSON.stringify(value));
const listen = app => new Promise((resolve, reject) => {
  const server = app.listen(0, '127.0.0.1', () => resolve(server));
  server.once('error', reject);
});
const close = server => !server ? Promise.resolve() : new Promise(resolve => {
  server.closeAllConnections(); server.close(resolve);
});
const api = (page, route) => page.evaluate(route => LearningApp.api(route), route);
async function go(page, route, selector) {
  await page.evaluate(route => LearningApp.navigate(route), route);
  if (selector) await page.locator(selector).first().waitFor();
}
async function screenshot(page, filename) {
  if (!artifacts) return;
  await page.screenshot({ path: path.join(artifacts, filename), fullPage: true });
  report.screenshots.push(filename);
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-number-theory-route-'));
  const filePath = path.join(tmp, 'learning.sqlite');
  let store, server, trainerServer, browser, lastPage;
  const errors = [], mutations = [], profilePosts = [], blockedExternal = [];
  try {
    const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
    if (executablePath) {
      assert.ok(fs.statSync(executablePath).size > 1024, 'Chromium executable must not be an empty placeholder');
      fs.accessSync(executablePath, fs.constants.X_OK);
    }
    store = new LearningStore({ filePath, contracts });
    assert.ok(store.available, 'Requires supported Node with SQLite');
    const invitedTeacher = store.bootstrap({ login: 'fixture_nt_route_teacher', name: 'Преподаватель проверки' });
    const teacher = store.activate(invitedTeacher.invitationToken, await hashPassword(PASSWORD)).account;
    async function createPupil(login, name) {
      const invitation = store.createStudent(teacher, { login, name });
      return store.activate(invitation.invitationToken, await hashPassword(PASSWORD, 'student')).account;
    }
    const pupil = await createPupil('fixture_nt_route_pupil', 'Учебный профиль проверки');
    const peer = await createPupil('fixture_nt_route_peer', 'Другой учебный профиль');
    for (const [person, focus] of [[pupil, COMMENT], [peer, PEER_COMMENT]]) {
      store.saveStudentProfile(teacher, person.id, {
        opId: crypto.randomUUID(), expectedVersion: 0, course: 'vilenkin6', goal: null, focus
      });
    }
    // Use the real contract for the old unfinished work, then seed it as the
    // existing newAttempt fixture used by the profile persistence tests does.
    const generated = contracts.create('ege-path', 'fractions', 4126);
    generated.state.work.draft = '3/';
    contracts.normalize('ege-path', generated.taskSpec, generated.state);
    const attempt = store.newAttempt(pupil.id, teacher.id, 'ege-path', generated);
    const assigned = store.createAssignments(teacher, {
      opId: crypto.randomUUID(), learnerIds: [pupil.id], title: 'Ранее выданное учебное задание',
      trainerId: 'vilenkin6-part1', contentId: 'lesson-1'
    }).assignments[0];
    // Fixture publication only, before any browser action. No live data exists.
    store.run("UPDATE assignments SET status='published' WHERE id=?", assigned.id);
    const lesson = store.createLesson(teacher, {
      opId: crypto.randomUUID(), title: 'Ранее созданный учебный урок', learnerIds: [pupil.id]
    }).lesson;
    const trainer = express(); trainer.use(express.static(ROOT));
    trainerServer = await listen(trainer);
    const trainerOrigin = 'http://127.0.0.1:' + trainerServer.address().port;
    const app = express(); app.use(express.json({ limit: '200kb' }));
    server = await listen(app);
    const origin = 'http://127.0.0.1:' + server.address().port;
    const profilePath = '/api/learning/teacher/students/' + pupil.id + '/profile';
    app.use('/api/learning', (req, _res, next) => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        mutations.push({ method: req.method, path: req.originalUrl });
        if (req.method === 'POST' && req.originalUrl === profilePath) profilePosts.push(plain(req.body));
      }
      next();
    });
    app.get('/api/learning/status', (_req, res) => res.json({ ...store.status(), trainerOrigin }));
    const learning = createLearningApi({ store, publicOrigin: origin, secureCookies: false });
    app.use('/api/learning', learning.router, createTeachingRouter(learning));
    app.use(express.static(ROOT));
    const planNote = 'Прежний план сохраняется.\nhttps://mathexam.space/school/peterson6/\n' + URLS.join('\n');
    store.run('INSERT INTO learning_plans(learner_id,teacher_id,items_json,note,updated_at) VALUES(?,?,?,?,?)',
      pupil.id, teacher.id, JSON.stringify([{ catalogId: 'vilenkin6-part1:lesson-2', reason: 'Прежняя рекомендация.', priority: 'normal' }]), planNote, Date.now());

    browser = await chromium.launch({ headless: true, executablePath,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking', '--disable-component-update', '--disable-sync'] });
    const localOrigins = new Set([origin, trainerOrigin]);
    async function login(person) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'ru-RU' });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (localOrigins.has(url.origin) || ['data:', 'blob:', 'about:'].includes(url.protocol)) return route.continue();
        blockedExternal.push(url.origin);
        return route.abort();
      });
      const page = await context.newPage(); lastPage = page;
      page.setDefaultTimeout(15000);
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin + '/learning/#home');
      await page.locator('#auth-form [name=login]').fill(person.login);
      await page.locator('#auth-form [name=password]').fill(PASSWORD);
      await page.locator('#auth-form [type=submit]').click();
      await page.locator('#navigation').waitFor();
      if (await page.locator('[data-mw-close]').isVisible()) await page.locator('[data-mw-close]').click();
      return page;
    }
    const pupilPage = await login(pupil);
    const peerPage = await login(peer);
    const teacherPage = await login(teacher);

    const snapshotTables = tables => Object.fromEntries(tables.map(table => [table, plain(store.rows('SELECT * FROM "' + table + '" ORDER BY rowid'))]));
    const protectedTables = ['accounts', 'attempts', 'events', 'assignments', 'lessons', 'learning_plans', 'learning_submissions', 'learning_feedback'];
    const protectedBefore = snapshotTables(protectedTables);
    const peerBefore = plain(store.studentProfile(teacher, peer.id));
    const savedWorkBefore = plain(store.getAttempt(pupil, attempt.id));
    const schema = () => plain(store.rows("SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name"));
    const schemaBefore = schema();
    const schemaVersion = store.row('PRAGMA user_version').user_version;
    const attemptCount = store.row('SELECT COUNT(*) AS n FROM attempts').n;
    const operationCount = store.row('SELECT COUNT(*) AS n FROM operations').n;
    function unchanged() {
      assert.deepEqual(snapshotTables(protectedTables), protectedBefore, 'Profile presentation must not mutate accounts or saved work');
      assert.deepEqual(store.studentProfile(teacher, peer.id), peerBefore, 'The other pupil profile is unchanged');
      assert.deepEqual(store.getAttempt(pupil, attempt.id), savedWorkBefore, 'The unfinished answer and complete attempt are unchanged');
      assert.equal(store.row('SELECT COUNT(*) AS n FROM attempts').n, attemptCount, 'Read-only navigation creates no attempts');
      assert.deepEqual(schema(), schemaBefore, 'No schema or trigger changes');
      assert.equal(store.row('PRAGMA user_version').user_version, schemaVersion);
    }
    async function vilenkin(page) {
      await page.locator('[data-vilenkin6-course]').waitFor();
      assert.equal(await page.locator('[data-number-theory-only]').count(), 0);
      assert.equal(await page.locator('[data-vilenkin6-open]').evaluateAll(nodes => new Set(nodes.map(node => node.dataset.vilenkin6Open)).size), 27);
    }
    await vilenkin(pupilPage); await vilenkin(peerPage);
    await go(teacherPage, 'student=' + pupil.id, '#teaching-profile select[name=routeMode]');
    assert.equal(await teacherPage.locator('#teaching-profile [name=routeMode]').inputValue(), 'ordinary');
    assert.equal(await teacherPage.locator('#teaching-profile [name=course]').inputValue(), 'vilenkin6');
    assert.equal(await teacherPage.locator('#teaching-profile [name=focus]').inputValue(), COMMENT);

    // An overlong comment plus the new marker must be rejected visibly, never
    // silently shortened or sent through a new persistence contract.
    await teacherPage.locator('#teaching-profile [name=routeMode]').selectOption('number-theory-only');
    const longComment = 'я'.repeat(1190);
    await teacherPage.locator('#teaching-profile [name=focus]').fill(longComment);
    await teacherPage.locator('#teaching-profile [type=submit]').click();
    await teacherPage.waitForFunction(() => document.querySelector('#teaching-profile .form-error')?.textContent.includes('1200'));
    assert.equal(await teacherPage.locator('#teaching-profile [name=focus]').inputValue(), longComment);
    assert.equal(profilePosts.length, 0);
    assert.equal(store.studentProfile(teacher, pupil.id).version, 1);
    await teacherPage.locator('#teaching-profile [name=focus]').fill(COMMENT);
    report.checks.push('Overlong comment is retained and rejected before any HTTP mutation');

    async function saveMode(mode, expectedVersion) {
      await teacherPage.locator('#teaching-profile [name=routeMode]').selectOption(mode);
      const responsePromise = teacherPage.waitForResponse(response => response.url() === origin + profilePath && response.request().method() === 'POST');
      await teacherPage.locator('#teaching-profile [type=submit]').click();
      const response = await responsePromise;
      assert.equal(response.status(), 200);
      const result = await response.json();
      await teacherPage.waitForFunction(() => document.querySelector('[data-profile-status]')?.textContent.includes('сохранены'));
      assert.equal(result.profile.course, 'vilenkin6');
      assert.equal(result.profile.goal, null);
      assert.equal(result.profile.version, expectedVersion + 1);
      assert.equal(result.profile.focus, mode === 'ordinary' ? COMMENT : COMMENT + '\n' + MARKER);
      assert.equal(await teacherPage.locator('#teaching-profile [name=focus]').inputValue(), COMMENT, 'The marker is not mixed into the editable comment');
      assert.deepEqual(Object.keys(profilePosts.at(-1)).sort(), PROFILE_FIELDS);
      assert.equal(profilePosts.at(-1).expectedVersion, expectedVersion);
      assert.ok(typeof profilePosts.at(-1).opId === 'string' && profilePosts.at(-1).opId.length > 10);
      assert.deepEqual(store.studentProfile(teacher, pupil.id), result.profile);
      return result.profile;
    }
    const exclusive = await saveMode('number-theory-only', 1);
    assert.equal(exclusive.focus.split('\n').filter(line => line === MARKER).length, 1);
    assert.equal(await teacherPage.locator('[data-plan-course]').count(), 2, 'The old plan links are not duplicated into the exclusive preview');
    assert.equal(await teacherPage.locator('[data-plan-course-board]').count(), 2);
    assert.equal(await teacherPage.locator('#teaching-plan [name=note]').inputValue(), planNote);
    await screenshot(teacherPage, 'teacher-selected-profile-desktop.png');
    await teacherPage.reload();
    await teacherPage.locator('#teaching-profile [name=routeMode]').waitFor();
    assert.equal(await teacherPage.locator('#teaching-profile [name=routeMode]').inputValue(), 'number-theory-only');
    assert.equal(await teacherPage.locator('#teaching-profile [name=focus]').inputValue(), COMMENT);
    report.checks.push('Actual teacher form writes and reloads the existing versioned profile API and durable SQLite row');

    async function onlyPair(page, { student = true } = {}) {
      await page.locator('[data-number-theory-only]').waitFor();
      assert.deepEqual(await page.locator('#main [data-plan-course]').evaluateAll(nodes => nodes.map(node => node.dataset.planCourse).sort()), IDS.slice().sort());
      assert.deepEqual(await page.locator('#main [data-plan-course-open]').evaluateAll(nodes => nodes.map(node => node.href).sort()), URLS.slice().sort());
      assert.equal(await page.locator('#catalog-grid, #other-courses, [data-vilenkin6-course], [data-vilenkin6-preview]').count(), 0);
      assert.equal(await page.locator('#main .prep-focus').textContent(), COMMENT);
      assert.equal(await page.locator('#main .prep-focus b').count(), 0, 'Teacher comments remain plain text');
      assert.ok(!(await page.locator('#main').innerText()).includes(MARKER), 'The presentation marker is not a pupil instruction');
      if (student) {
        assert.deepEqual(await page.locator('#navigation [data-nav]').evaluateAll(nodes => nodes.map(node => node.dataset.nav)), ['home', 'assignments', 'history', 'lessons']);
        assert.equal(await page.locator('.site-link').isVisible(), false);
        assert.equal(await page.locator('[data-plan-course-board]').count(), 0, 'The pupil uses the existing teacher room link');
      }
    }
    await pupilPage.reload(); await onlyPair(pupilPage);
    assert.deepEqual((await api(pupilPage, '/profile')).profile, exclusive);
    for (const route of ['home', 'route', 'course']) {
      await go(pupilPage, route, '[data-number-theory-only]'); await onlyPair(pupilPage);
    }
    const staleRoutes = ['course=ege', 'course=school', 'course=ege-profile', 'exam', 'diagnostic', 'practice', 'learn', 'repeat', 'division-course'];
    for (const route of staleRoutes) {
      await go(pupilPage, route, '[data-number-theory-only]');
      await pupilPage.waitForURL(url => url.hash === '#home');
      await onlyPair(pupilPage);
    }
    await pupilPage.reload(); await onlyPair(pupilPage);
    unchanged();
    report.checks.push('Pupil home/route/course, reload and nine stale routes show exactly the allowlisted pair');

    for (const width of [1440, 390, 320]) {
      await pupilPage.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await onlyPair(pupilPage);
      const dimensions = await pupilPage.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
      assert.ok(dimensions.document <= width + 1 && dimensions.body <= width + 1, 'No horizontal overflow at ' + width + ': ' + JSON.stringify(dimensions));
      report.viewports.push(dimensions);
      await screenshot(pupilPage, 'pupil-pair-' + width + '.png');
    }
    report.checks.push('Actual cabinet CSS fits desktop, 390px and 320px screens');
    await pupilPage.setViewportSize({ width: 1440, height: 1000 });

    await go(teacherPage, 'preview=' + pupil.id, '.preview-banner');
    await onlyPair(teacherPage, { student: false });
    assert.equal(await teacherPage.locator('[data-plan-course-board]').count(), 0, 'Teacher preview must match the pupil view');
    await screenshot(teacherPage, 'teacher-pupil-preview.png');
    await peerPage.reload(); await vilenkin(peerPage);
    assert.deepEqual((await api(peerPage, '/profile')).profile, peerBefore);
    assert.equal(await peerPage.locator('[data-nav=course]').count(), 1);
    report.checks.push('Teacher preview matches the selected pair and the other pupil keeps all 27 Vilenkin topics');

    // Existing work remains directly accessible. These routes must not be sent
    // back to the new pair, nor create another attempt while merely reading.
    await go(pupilPage, 'assignments', 'a[href="#assignment=' + assigned.id + '"]');
    assert.equal(await pupilPage.locator('[data-number-theory-only]').count(), 0);
    await pupilPage.locator('a[href="#assignment=' + assigned.id + '"]').click();
    await pupilPage.getByRole('heading', { name: assigned.title, exact: true }).waitFor();
    await go(pupilPage, 'lessons', 'a[href="#lesson=' + lesson.id + '"]');
    assert.equal(await pupilPage.locator('[data-number-theory-only]').count(), 0);
    await pupilPage.locator('a[href="#lesson=' + lesson.id + '"]').click();
    await pupilPage.waitForFunction(id => location.hash.includes('lesson=' + id) && !document.querySelector('.loading-panel'), lesson.id);
    assert.ok((await pupilPage.locator('#main').innerText()).includes(lesson.title));
    await go(pupilPage, 'history', '[data-saved-work]');
    assert.equal(await pupilPage.locator('[data-number-theory-only]').count(), 0);
    const existingIds = store.listAttempts(pupil).map(row => row.id).sort();
    assert.deepEqual(await pupilPage.locator('[data-saved-work] a[href^="#attempt="]').evaluateAll(nodes =>
      nodes.map(node => new URLSearchParams(node.hash.slice(1)).get('attempt')).sort()), existingIds);
    await pupilPage.locator('[data-saved-work] a[href="#attempt=' + attempt.id + '"]').click();
    await pupilPage.locator('#show-history').waitFor();
    await pupilPage.locator('#show-history').click();
    await pupilPage.locator('#history-bar').waitFor();
    assert.match(await pupilPage.locator('#history-bar').innerText(), /История решения/);
    assert.deepEqual((await api(pupilPage, '/attempts/' + attempt.id)).state, savedWorkBefore.state);
    await go(pupilPage, 'home', '[data-number-theory-only]');
    await onlyPair(pupilPage);
    unchanged();
    report.checks.push('Existing assignment, lesson, saved attempt and its history remain accessible without new work');

    await go(teacherPage, 'student=' + pupil.id, '#teaching-profile [name=routeMode]');
    const restored = await saveMode('ordinary', 2);
    assert.equal(restored.focus, COMMENT);
    assert.equal(restored.course, 'vilenkin6');
    assert.equal(profilePosts.length, 2);
    assert.notEqual(profilePosts[0].opId, profilePosts[1].opId);
    await pupilPage.reload(); await vilenkin(pupilPage);
    assert.deepEqual((await api(pupilPage, '/profile')).profile, restored);
    assert.equal(await pupilPage.locator('[data-nav=course]').count(), 1);
    assert.equal(await pupilPage.locator('.site-link').isVisible(), true);
    await screenshot(pupilPage, 'restored-vilenkin-desktop.png');
    await go(teacherPage, 'preview=' + pupil.id, '[data-vilenkin6-preview]');
    assert.equal(await teacherPage.locator('[data-vilenkin6-preview] ol li').count(), 27);
    await peerPage.reload(); await vilenkin(peerPage);
    unchanged();
    assert.equal(store.row('SELECT COUNT(*) AS n FROM operations').n, operationCount + 2, 'Only the two profile saves add operation receipts');
    assert.ok(mutations.every(request => request.method === 'POST' &&
      (request.path === '/api/learning/login' || request.path === profilePath)), 'Only login and the selected profile may be written');
    assert.deepEqual(errors, [], 'No unhandled browser errors');
    report.checks.push('Ordinary mode restores Vilenkin through the same form, preserving comments, accounts, all old work, peer profile and schema');
    report.status = 'PASS';
    report.profileSaves = profilePosts.length;
    report.attemptCountBefore = attemptCount;
    report.attemptCountAfter = store.row('SELECT COUNT(*) AS n FROM attempts').n;
    report.blockedExternalOrigins = [...new Set(blockedExternal)].sort();
    // LearningStore owns an exclusive SQLite connection. Release it before
    // independently opening the durable file; never weaken its locking mode.
    await browser.close(); browser = null;
    await close(server); server = null;
    await close(trainerServer); trainerServer = null;
    store.close(); store = null;
    const durable = new DatabaseSync(filePath, { readOnly: true });
    try {
      const readProfile = id => plain(durable.prepare('SELECT course,goal,focus,version,updated_at AS updatedAt FROM learning_profiles WHERE learner_id=?').get(id));
      assert.deepEqual(readProfile(pupil.id), restored);
      assert.deepEqual(readProfile(peer.id), peerBefore);
      for (const table of protectedTables) {
        assert.deepEqual(plain(durable.prepare('SELECT * FROM "' + table + '" ORDER BY rowid').all()), protectedBefore[table], 'Durable old data: ' + table);
      }
      assert.deepEqual(plain(durable.prepare("SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all()), schemaBefore);
      assert.equal(durable.prepare('PRAGMA user_version').get().user_version, schemaVersion);
    } finally { durable.close(); }
    report.checks.push('After all clients and the store close, an independent read-only SQLite connection confirms persisted profiles and unchanged old data');
    console.log('LEARNING_NUMBER_THEORY_ROUTE_BROWSER_OK: real teacher form, versioned SQLite persistence, exclusive pair, old work access, 1440/390/320px, preview, other pupil and reversible Vilenkin route');
  } catch (error) {
    report.status = 'FAIL';
    report.error = error.stack || String(error);
    if (artifacts && lastPage && !lastPage.isClosed()) {
      try { await screenshot(lastPage, 'failure.png'); } catch (_) {}
    }
    throw error;
  } finally {
    report.finishedAt = new Date().toISOString();
    if (artifacts) fs.writeFileSync(path.join(artifacts, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    await browser?.close(); await close(server); await close(trainerServer);
    store?.close(); fs.rmSync(tmp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
