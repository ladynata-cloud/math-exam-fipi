'use strict';
// Real local API, separate trainer origin and temporary SQLite. All accounts,
// credentials and work are synthetic; requests to public services are blocked.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const ROOT = path.resolve(__dirname, '..');
const express = createRequire(path.join(ROOT, 'board-server/package.json'))('express');
const { chromium } = require('playwright');
const { LearningStore } = require('../board-server/learning-store');
const { createLearningApi } = require('../board-server/learning-api');
const { createTeachingRouter } = require('../board-server/learning-teaching');
const { hashPassword } = require('../board-server/learning-auth');
const contracts = require('../board-server/learning-contracts');
const units = ['A', 'B', 'C', 'D'].flatMap(part =>
  require('../courses/vilenkin-6-part-1/textbook-data/units-' + part + '.json'));
const textbookTask = units.find(unit => unit.id === 6).tasks.find(task => task.role === 'practice');
const TEACHER_LOGIN = 'fixture_onboarding_teacher';
const TEACHER_PASSWORD = 'Synthetic-Onboarding-Teacher-2026';
const PUPIL_LOGIN = 'fixture_onboarding_pupil';
const PUPIL_PASSWORD = '0471';
const WIDTHS = [320, 390, 1280];
const uuid = () => crypto.randomUUID();
const copy = value => JSON.parse(JSON.stringify(value));
const serve = (app, port = 0) => new Promise((resolve, reject) => {
  const server = app.listen(port, '127.0.0.1', () => resolve(server));
  server.once('error', reject);
});
const stop = server => server ? new Promise(resolve => {
  server.closeAllConnections(); server.close(resolve);
}) : Promise.resolve();
const api = (page, route) => page.evaluate(route => LearningApp.api(route), route);
const navigate = (page, route) => page.evaluate(route => LearningApp.navigate(route), route);
const attemptId = page => new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt');
async function until(read, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await read()) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw Error('Timed out: ' + message);
}
async function dismissWelcome(page) {
  const close = page.locator('[data-mw-close]');
  if (await close.isVisible()) await close.click();
}
async function readyFrame(page, selector = '#answer') {
  await page.locator('#trainer-host iframe').waitFor();
  await page.waitForFunction(() => document.querySelector('#trainer-host .frame-status')?.hidden);
  const frame = page.frameLocator('#trainer-host iframe');
  await frame.locator(selector).first().waitFor();
  if (selector === '#answer') assert(await frame.locator(selector).isEnabled(), 'Actual trainer is hydrated for the pupil');
  return frame;
}
async function currentStep(page, form, step) {
  await page.locator(form + ' [data-onboarding-step="' + step + '"]').waitFor({ state: 'visible' });
  assert.equal(await page.locator(form + ' [data-onboarding-step]:visible').count(), 1,
    'Exactly one setup step is visible');
}
async function next(page, form, step) {
  await page.locator(form + ' [data-onboarding-next]').click();
  await currentStep(page, form, step);
}
async function selectedCourses(page, ids) {
  await page.locator('[data-program-courses]').waitFor();
  const actual = await page.locator('[data-program-courses] [data-program-course]')
    .evaluateAll(nodes => nodes.map(node => node.dataset.programCourse));
  assert.deepEqual(actual.sort(), [...ids].sort(), 'All and only selected courses are shown');
}

(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-onboarding-'));
  const databasePath = path.join(directory, 'learning.sqlite');
  const evidence = process.env.LEARNING_ONBOARDING_OUTPUT_DIR || path.join(directory, 'evidence');
  const errors = [], checks = [], images = [], blockedExternal = [], requests = [];
  let store, server, trainerServer, browser, teacherPage, pupilPage, origin, trainerOrigin;
  try {
    store = new LearningStore({ filePath: databasePath, contracts });
    assert(store.available, 'Use the supported Node runtime with SQLite');
    const teacher = store.activate(store.bootstrap({ login: TEACHER_LOGIN, name: 'Преподаватель проверки' }).invitationToken,
      await hashPassword(TEACHER_PASSWORD)).account;
    const peer = store.createStudent(teacher, { login: 'fixture_onboarding_peer', name: 'Другой проверочный ученик' },
      await hashPassword('0826', 'student')).student;
    const peerWork = store.createAttempt(peer, {
      opId: uuid(), trainerId: 'vilenkin6-part1', contentId: 'lesson-1'
    }).attempt;
    const peerBefore = {
      account: copy(store.account(peer.id)), profile: copy(store.studentProfile(teacher, peer.id)),
      work: copy(store.getAttempt(peer, peerWork.id)), history: copy(store.history(peer, peerWork.id))
    };
    const trainer = express(); trainer.use(express.static(ROOT));
    trainerServer = await serve(trainer);
    trainerOrigin = 'http://127.0.0.1:' + trainerServer.address().port;
    async function startCabinet(port = 0) {
      const app = express(); app.use(express.json({ limit: '200kb' }));
      const nextServer = await serve(app, port);
      origin = 'http://127.0.0.1:' + nextServer.address().port;
      app.get('/api/learning/status', (_request, response) => response.json({ ...store.status(), trainerOrigin }));
      const learning = createLearningApi({ store, publicOrigin: origin, secureCookies: false });
      app.use('/api/learning', learning.router, createTeachingRouter(learning));
      app.use(express.static(ROOT));
      return nextServer;
    }
    server = await startCabinet();
    browser = await chromium.launch({ headless: true,
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking'] });
    async function open() {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ru-RU' });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if ([origin, trainerOrigin].includes(url.origin) || ['data:', 'blob:', 'about:'].includes(url.protocol)) return route.continue();
        blockedExternal.push(url.origin + url.pathname); return route.abort('blockedbyclient');
      });
      const page = await context.newPage(); page.setDefaultTimeout(15000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        const url = new URL(request.url());
        if (url.origin === origin && url.pathname.startsWith('/api/learning/')) {
          // Retain only the nonsecret operation identity, never form contents.
          const operationId = request.method() === 'POST' && url.pathname === '/api/learning/teacher/students'
            ? request.postDataJSON()?.opId : undefined;
          requests.push({ page, method: request.method(), path: url.pathname, operationId });
        }
      });
      return page;
    }
    async function login(page, loginName, password, link = '') {
      await page.goto(link || origin + '/learning/?role=' + (loginName === TEACHER_LOGIN ? 'teacher' : 'student'));
      await page.locator('#auth-form [name=login]').fill(loginName);
      await page.locator('#auth-form [name=password]').fill(password);
      await page.locator('#auth-form [type=submit]').click();
      await page.locator('#navigation').waitFor(); await dismissWelcome(page);
    }
    async function layouts(page, name) {
      fs.mkdirSync(evidence, { recursive: true });
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth,
          overflowing: [...document.querySelectorAll('body *')].flatMap(node => {
            const box = node.getBoundingClientRect();
            return box.width > 0 && (box.right > innerWidth + 1 || box.left < -1)
              ? [{ tag: node.tagName, id: node.id, className: typeof node.className === 'string' ? node.className : '',
                left: box.left, right: box.right, width: box.width }] : [];
          }).slice(0, 16) }));
        if (dimensions.document > dimensions.viewport + 1) {
          await page.screenshot({ path: path.join(evidence, name + '-overflow-' + width + '.png'), fullPage: true,
            mask: [page.locator('[name=password]'), page.locator('#access-password'), page.locator('#access-copy-text')] });
        }
        assert(dimensions.document <= dimensions.viewport + 1,
          name + ': document fits ' + width + 'px: ' + JSON.stringify(dimensions));
        const clippedActions = await page.locator('.onboarding-actions button:visible').evaluateAll(buttons =>
          buttons.flatMap(button => {
            const box = button.getBoundingClientRect(), range = document.createRange(); range.selectNodeContents(button);
            const clipped = [...range.getClientRects()].some(rect => rect.width > 0
              && (rect.left < box.left - 1 || rect.right > box.right + 1 || rect.top < box.top - 1 || rect.bottom > box.bottom + 1));
            return clipped ? [{ label: button.textContent.trim(), width: box.width, scroll: button.scrollWidth,
              left: box.left, right: box.right }] : [];
          }));
        if (clippedActions.length) await page.screenshot({ path: path.join(evidence, name + '-actions-overflow-' + width + '.png'),
          fullPage: true, mask: [page.locator('[name=password]'), page.locator('#access-password'), page.locator('#access-copy-text')] });
        assert.deepEqual(clippedActions, [], name + ': action labels fit at ' + width + 'px');
        const coveredActions = await page.locator('.onboarding-actions button:visible').evaluateAll(buttons =>
          buttons.flatMap(button => {
            const box = button.getBoundingClientRect();
            const center = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
            return center && button.contains(center) ? [] : [{ label: button.textContent.trim(),
              left: box.left, top: box.top, width: box.width, height: box.height }];
          }));
        assert.deepEqual(coveredActions, [], name + ': every visible action remains reachable at ' + width + 'px');
        const dialog = page.locator('#modal[open]');
        if (await dialog.count()) assert(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth + 1),
          name + ': dialog fits ' + width + 'px');
        const filename = name + '-' + width + '.png';
        // Keep the viewport stable while capturing a native modal. Full-page
        // capture can expand it to the underlying roster's height and repaint
        // sticky actions differently from the viewport that was just checked.
        await page.screenshot({ path: path.join(evidence, filename), fullPage: !(await dialog.count()),
          mask: [page.locator('[name=password]'), page.locator('#access-password'), page.locator('#access-copy-text')] });
        images.push(filename);
      }
    }
    const mutations = (page, after) => requests.slice(after).filter(request => request.page === page && request.method !== 'GET');

    teacherPage = await open(); await login(teacherPage, TEACHER_LOGIN, TEACHER_PASSWORD);
    await teacherPage.locator('#add-student').click(); await currentStep(teacherPage, '#student-form', 1);
    const beforeSetup = requests.length;
    await teacherPage.locator('#student-form [data-onboarding-next]').click();
    await currentStep(teacherPage, '#student-form', 1);
    assert.equal(mutations(teacherPage, beforeSetup).length, 0, 'Invalid setup cannot create an account');
    await teacherPage.locator('#student-form [name=name]').fill('Проверка подключения');
    await teacherPage.locator('#student-form [name=login]').fill(PUPIL_LOGIN);
    await teacherPage.locator('#student-form [name=password]').fill(PUPIL_PASSWORD);
    await teacherPage.locator('#student-form [name=grade]').selectOption('6');
    await teacherPage.locator('#student-form [name=course]').selectOption('vilenkin6');
    await layouts(teacherPage, 'setup-details');
    await teacherPage.locator('#student-form [data-onboarding-next]').focus();
    await teacherPage.keyboard.press('Enter'); await currentStep(teacherPage, '#student-form', 2);
    await teacherPage.locator('#student-form [data-onboarding-next]').click();
    await currentStep(teacherPage, '#student-form', 2);
    assert((await teacherPage.locator('#student-form [data-onboarding-error]').innerText()).trim(),
      'An empty course selection has an actionable error');
    const firstCourse = teacherPage.locator('#student-form [name=courseIds][value="vilenkin6-textbook"]');
    await firstCourse.focus(); await teacherPage.keyboard.press('Space');
    assert(await firstCourse.isChecked(), 'Course choice works with the keyboard');
    await teacherPage.locator('#student-form [name=courseIds][value="foundations"]').check();
    await layouts(teacherPage, 'setup-courses');
    await teacherPage.locator('#student-form [data-onboarding-back]').click();
    await currentStep(teacherPage, '#student-form', 1);
    assert.equal(await teacherPage.locator('#student-form [name=name]').inputValue(), 'Проверка подключения');
    assert.equal(await teacherPage.locator('#student-form [name=grade]').inputValue(), '6');
    await next(teacherPage, '#student-form', 2);
    assert(await teacherPage.locator('#student-form [name=courseIds][value="foundations"]').isChecked());
    await next(teacherPage, '#student-form', 3);
    const summary = await teacherPage.locator('#student-form [data-onboarding-summary]').innerText();
    assert.match(summary, /Виленкин/); assert.match(summary, /основ/i); assert.match(summary, /6/);
    assert.equal(mutations(teacherPage, beforeSetup).length, 0, 'Reviewing choices has no account or program writes');
    await layouts(teacherPage, 'setup-confirmation');

    // Hold the real request to check double-submit protection, then drop only
    // the acknowledgement after a real commit. Explicit retry must acknowledge
    // the original operation without creating another account or new program.
    let pendingCreation = false, releaseCreation, creationStatus;
    const creationGate = new Promise(resolve => { releaseCreation = resolve; });
    const loseAcknowledgement = async route => {
      if (route.request().method() !== 'POST' || pendingCreation) return route.continue();
      pendingCreation = true; await creationGate;
      const response = await route.fetch(); creationStatus = response.status();
      await route.abort('failed');
    };
    await teacherPage.route('**/api/learning/teacher/students', loseAcknowledgement);
    try {
      await teacherPage.locator('#student-form [type=submit]').click();
      await until(() => pendingCreation, 'pending pupil creation');
      assert(await teacherPage.locator('#student-form [type=submit]').isDisabled());
      await teacherPage.locator('#student-form [type=submit]').evaluate(node => node.click());
      assert.equal(mutations(teacherPage, beforeSetup).filter(request => request.path.endsWith('/teacher/students')).length, 1);
    } finally { releaseCreation(); }
    await until(() => creationStatus === 201 || creationStatus === 200, 'server committed the first request');
    await until(async () => !(await teacherPage.locator('#student-form [type=submit]').isDisabled()), 'explicit retry available');
    assert.equal(await teacherPage.locator('#access-password').count(), 0, 'Unknown acknowledgement does not show a ready card');
    assert((await teacherPage.locator('#student-form [data-onboarding-error]').innerText()).trim());
    assert.equal(await teacherPage.locator('#student-form [name=password]').inputValue(), PUPIL_PASSWORD,
      'Acknowledge the same credential; do not silently regenerate it');
    assert(store.accountByLogin(PUPIL_LOGIN), 'The interrupted response follows an actual durable account creation');
    await teacherPage.unroute('**/api/learning/teacher/students', loseAcknowledgement);
    const retryResponse = teacherPage.waitForResponse(response =>
      response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/learning/teacher/students');
    await teacherPage.locator('#student-form [type=submit]').click();
    assert.equal((await (await retryResponse).json()).duplicate, true, 'Server returns the original operation receipt');
    await teacherPage.locator('#access-password').waitFor();
    const createRequests = mutations(teacherPage, beforeSetup).filter(request => request.path.endsWith('/teacher/students'));
    assert.equal(createRequests.length, 2); assert(createRequests[0].operationId);
    assert.equal(createRequests[0].operationId, createRequests[1].operationId, 'Explicit retry retains its operation identity');
    const created = store.accountByLogin(PUPIL_LOGIN);
    assert(created?.password_hash && !created.password_hash.includes(PUPIL_PASSWORD));
    const pupil = store.account(created.id);
    assert.deepEqual(store.studentProfile(teacher, pupil.id).program,
      { grade: 6, courseIds: ['vilenkin6-textbook', 'foundations'] });
    const entryLink = await teacherPage.locator('#access-link').inputValue();
    assert.equal(entryLink, origin + '/learning/?role=student#login=' + PUPIL_LOGIN);
    assert.equal(await teacherPage.locator('#access-login').inputValue(), PUPIL_LOGIN);
    assert.equal(await teacherPage.locator('#access-password').inputValue(), PUPIL_PASSWORD);
    assert.equal((await api(teacherPage, '/session')).account.id, teacher.id);
    assert.equal((await api(teacherPage, '/teacher/students')).students.filter(student => student.login === PUPIL_LOGIN).length, 1);
    checks.push('Three-step keyboard-accessible setup, input errors and back navigation; atomic two-course save; double-submit and lost-acknowledgement retry create exactly one pupil');

    const beforePreview = requests.length;
    const previewWork = copy(store.listAttempts(pupil));
    await teacherPage.locator('#preview-created-student').click();
    await teacherPage.locator('.preview-banner').waitFor();
    await selectedCourses(teacherPage, ['vilenkin6-textbook', 'foundations']);
    assert.equal(await teacherPage.locator('[data-vilenkin6-preview]').count(), 0,
      'The selected textbook preview must not add the unselected legacy 27-topic course');
    assert.equal(await teacherPage.locator('[data-program-courses] [data-program-open]').count(), 0,
      'Teacher preview never launches public courses that can share browser-local pupil progress');
    assert.equal(mutations(teacherPage, beforePreview).length, 0, 'Ready preview performs reads only');
    assert.equal((await api(teacherPage, '/session')).account.id, teacher.id);
    assert.deepEqual(store.listAttempts(pupil), previewWork);
    assert.equal(await teacherPage.locator('#access-password').count(), 0, 'Preview clears the one-time credential card');
    await layouts(teacherPage, 'teacher-preview');
    checks.push('Ready link/login/PIN use the existing account; preview retains teacher session and creates no pupil work');

    pupilPage = await open(); await login(pupilPage, PUPIL_LOGIN, PUPIL_PASSWORD, entryLink);
    assert.equal((await api(pupilPage, '/session')).account.id, pupil.id);
    await selectedCourses(pupilPage, ['vilenkin6-textbook', 'foundations']);
    await layouts(pupilPage, 'pupil-courses');
    await pupilPage.locator('[data-program-course="vilenkin6-textbook"] [data-program-open]').click();
    await pupilPage.locator('[data-vilenkin-textbook-unit="6"] summary').click();
    await pupilPage.locator('[data-vilenkin-textbook-open="vilenkin6-textbook:' + textbookTask.id + '"]').click();
    let frame = await readyFrame(pupilPage);
    const textbookId = attemptId(pupilPage); assert(textbookId);
    await frame.locator('#answer').fill('2 · 3');
    await until(() => store.getAttempt(pupil, textbookId).state.task.draft === '2 · 3', 'textbook draft durable commit');
    await pupilPage.reload(); frame = await readyFrame(pupilPage);
    assert.equal(await frame.locator('#answer').inputValue(), '2 · 3');
    await frame.locator('#answer').fill(String(Array.isArray(textbookTask.answer) ? textbookTask.answer[0] : textbookTask.answer));
    await frame.locator('#answer-form [type=submit]').click();
    await until(() => store.getAttempt(pupil, textbookId).outcome === 'independent', 'server-graded textbook result');
    const textbookBefore = copy(store.getAttempt(pupil, textbookId));
    const textbookHistory = copy(store.history(pupil, textbookId));

    await navigate(pupilPage, 'home'); await selectedCourses(pupilPage, ['vilenkin6-textbook', 'foundations']);
    await pupilPage.locator('[data-program-course="foundations"] [data-program-open]').click();
    await pupilPage.locator('[data-prep-start="path:pre7-place-value"]:visible').first().click();
    frame = await readyFrame(pupilPage);
    const foundationsId = attemptId(pupilPage); assert(foundationsId && foundationsId !== textbookId);
    assert.equal(store.getAttempt(pupil, foundationsId).contentId, 'pre7-place-value');
    await frame.locator('#answer').fill('314');
    await until(() => store.getAttempt(pupil, foundationsId).state.work.draft === '314', 'foundations draft durable commit');
    const foundationsBefore = copy(store.getAttempt(pupil, foundationsId));
    const foundationsHistory = copy(store.history(pupil, foundationsId));
    checks.push('Both selected course destinations work; textbook draft reloads and actual answer is server-graded; foundations keeps a separate saved draft');

    // A preexisting unpublished assignment is a separate preservation fixture;
    // changing the course program must not publish, archive or replace it.
    store.createAssignments(teacher, { opId: uuid(), learnerIds: [pupil.id], title: 'Прежнее проверочное домашнее задание',
      trainerId: 'ege-path', contentId: 'practice-temperature' });

    await navigate(teacherPage, 'students');
    await teacherPage.locator('[data-edit-program="' + pupil.id + '"]').click();
    await currentStep(teacherPage, '#student-program-form', 1);
    assert.equal(await teacherPage.locator('#student-program-form [name=password]').count(), 0);
    assert.equal(await teacherPage.locator('#student-program-form [name=grade]').inputValue(), '6');
    await teacherPage.locator('#student-program-form [name=grade]').selectOption('7');
    await next(teacherPage, '#student-program-form', 2);
    assert(await teacherPage.locator('#student-program-form [name=courseIds][value="vilenkin6-textbook"]').isChecked());
    assert(await teacherPage.locator('#student-program-form [name=courseIds][value="foundations"]').isChecked());
    await teacherPage.locator('#student-program-form [name=courseIds][value="foundations"]').uncheck();
    await teacherPage.locator('#student-program-form [name=courseIds][value="school7"]').check();
    await next(teacherPage, '#student-program-form', 3);
    const beforeEditAccount = copy(store.account(pupil.id));
    const beforeEditAssignments = copy(store.listAssignments(teacher));
    assert.equal(beforeEditAssignments.length, 1); assert.equal(beforeEditAssignments[0].status, 'draft');
    // A separate authenticated teacher session writes after the first wizard
    // loaded its version. The visible conflict flow must retain the first draft
    // and require explicit comparison before replacing the newer program.
    const competingTeacher = await open(); await login(competingTeacher, TEACHER_LOGIN, TEACHER_PASSWORD);
    const competingProfile = copy(store.studentProfile(teacher, pupil.id));
    const concurrentFocus = 'Комментарий второго проверочного окна';
    await competingTeacher.evaluate(async ({ id, profile, focus }) => LearningApp.api('/teacher/students/' + id + '/profile', {
      method: 'POST', body: JSON.stringify({ opId: crypto.randomUUID(), expectedVersion: profile.version,
        course: profile.course, goal: profile.goal, focus, program: { ...profile.program, grade: 8 } })
    }), { id: pupil.id, profile: competingProfile, focus: concurrentFocus });
    await competingTeacher.context().close();
    await teacherPage.locator('#student-program-form [type=submit]').click();
    await teacherPage.locator('#student-program-form [data-onboarding-reload]').waitFor({ state: 'visible' });
    assert.match(await teacherPage.locator('#student-program-form [data-onboarding-error]').innerText(), /другом окне/);
    assert(await teacherPage.locator('#student-program-form [type=submit]').isDisabled());
    assert.equal(store.studentProfile(teacher, pupil.id).program.grade, 8, 'A stale save cannot overwrite the concurrent program');
    assert.equal(await teacherPage.locator('#student-program-form [name=grade]').inputValue(), '7');
    assert(await teacherPage.locator('#student-program-form [name=courseIds][value="school7"]').isChecked(),
      'The rejected local course choice stays available for comparison');
    await teacherPage.locator('#student-program-form [data-onboarding-reload]').click();
    await until(async () => !(await teacherPage.locator('#student-program-form [type=submit]').isDisabled()), 'explicit save after conflict reload');
    assert.match(await teacherPage.locator('#student-program-form [data-onboarding-current]').innerText(), /8 класс/);
    assert.equal(await teacherPage.locator('#student-program-form [name=grade]').inputValue(), '7',
      'Reloading current server values does not silently discard the proposed change');
    await teacherPage.locator('#student-program-form [type=submit]').click();
    await until(() => store.studentProfile(teacher, pupil.id).program.grade === 7, 'program edit commit');
    assert.deepEqual(store.studentProfile(teacher, pupil.id).program,
      { grade: 7, courseIds: ['vilenkin6-textbook', 'school7'] });
    assert.equal(store.studentProfile(teacher, pupil.id).focus, concurrentFocus,
      'The existing focus note from the concurrent change survives the explicit program save');
    assert.deepEqual(copy(store.account(pupil.id)), beforeEditAccount, 'Program edits preserve account and credentials');
    assert.deepEqual(store.listAssignments(teacher), beforeEditAssignments);
    assert.deepEqual(store.getAttempt(pupil, textbookId), textbookBefore);
    assert.deepEqual(store.history(pupil, textbookId), textbookHistory);
    assert.deepEqual(store.getAttempt(pupil, foundationsId), foundationsBefore);
    assert.deepEqual(store.history(pupil, foundationsId), foundationsHistory);
    checks.push('Concurrent program edit is rejected; comparison/reload preserves the draft and current focus; explicit save retains account, credentials, assignments and all earlier work/history');

    await pupilPage.context().close(); pupilPage = await open();
    await login(pupilPage, PUPIL_LOGIN, PUPIL_PASSWORD, entryLink);
    await selectedCourses(pupilPage, ['vilenkin6-textbook', 'school7']);
    await navigate(pupilPage, 'attempt=' + foundationsId); frame = await readyFrame(pupilPage);
    assert.equal(await frame.locator('#answer').inputValue(), '314');
    await navigate(pupilPage, 'attempt=' + textbookId); await readyFrame(pupilPage, '.condition');
    assert.equal(store.getAttempt(pupil, textbookId).outcome, 'independent');
    checks.push('Fresh login with unchanged code restores the edited program, completed result and removed-course saved work');

    const port = server.address().port;
    await Promise.all(browser.contexts().map(context => context.close()));
    await stop(server); server = null; store.close();
    store = new LearningStore({ filePath: databasePath, contracts }); assert(store.available);
    server = await startCabinet(port);
    pupilPage = await open(); await login(pupilPage, PUPIL_LOGIN, PUPIL_PASSWORD, entryLink);
    await selectedCourses(pupilPage, ['vilenkin6-textbook', 'school7']);
    await navigate(pupilPage, 'attempt=' + foundationsId); frame = await readyFrame(pupilPage);
    assert.equal(await frame.locator('#answer').inputValue(), '314');
    assert.deepEqual(store.getAttempt(pupil, textbookId), textbookBefore);
    assert.deepEqual(store.history(pupil, textbookId), textbookHistory);
    assert.deepEqual(store.getAttempt(pupil, foundationsId), foundationsBefore);
    assert.deepEqual(store.history(pupil, foundationsId), foundationsHistory);
    assert.deepEqual(store.listAssignments(teacher), beforeEditAssignments);
    assert.deepEqual(copy(store.account(peer.id)), peerBefore.account);
    assert.deepEqual(store.studentProfile(teacher, peer.id), peerBefore.profile);
    assert.deepEqual(store.getAttempt(peer, peerWork.id), peerBefore.work);
    assert.deepEqual(store.history(peer, peerWork.id), peerBefore.history);
    checks.push('Real HTTP server and SQLite restart preserve program/work; the second synthetic pupil remains byte-for-byte unchanged');

    // Synthetic pagehide/pageshow dispatch exercises the real BFCache cleanup
    // handlers while retaining this document to deliver a deliberately late
    // response. This is lifecycle-race coverage, not a claim of real BFCache.
    teacherPage = await open(); await login(teacherPage, TEACHER_LOGIN, TEACHER_PASSWORD);
    await teacherPage.locator('#add-student').click();
    await teacherPage.locator('#student-form [name=name]').fill('Проверка ухода со страницы');
    await teacherPage.locator('#student-form [name=login]').fill('fixture_onboarding_departed');
    await teacherPage.locator('#student-form [name=password]').fill('0593');
    await teacherPage.locator('#student-form [name=grade]').selectOption('6');
    await teacherPage.locator('#student-form [name=course]').selectOption('vilenkin6');
    await next(teacherPage, '#student-form', 2);
    await teacherPage.locator('#student-form [name=courseIds][value="vilenkin6-textbook"]').check();
    await next(teacherPage, '#student-form', 3);
    const oldPasswordInput = await teacherPage.locator('#student-form [name=password]').elementHandle();
    let lateCommitted = false, lateDelivered = false, releaseLateResponse;
    const lateGate = new Promise(resolve => { releaseLateResponse = resolve; });
    const lateHandler = async route => {
      if (route.request().method() !== 'POST') return route.continue();
      const response = await route.fetch(); assert.equal(response.status(), 201);
      lateCommitted = true; await lateGate;
      await route.fulfill({ response }); lateDelivered = true;
    };
    await teacherPage.route('**/api/learning/teacher/students', lateHandler);
    try {
      await teacherPage.locator('#student-form [type=submit]').click();
      await until(() => lateCommitted, 'late-response synthetic account commit');
      await teacherPage.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
      assert.equal(await oldPasswordInput.evaluate(node => node.value), '', 'pagehide scrubs even detached password inputs');
      assert.equal(await teacherPage.locator('#student-form').count(), 0, 'pagehide closes and destroys pending onboarding');
      assert.equal(await teacherPage.locator('#access-password').count(), 0);
    } finally { releaseLateResponse(); }
    await until(() => lateDelivered, 'late acknowledgement delivered');
    await teacherPage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await teacherPage.locator('#access-password').count(), 0, 'A stale completion cannot restore the secret card');
    await teacherPage.unroute('**/api/learning/teacher/students', lateHandler);
    await oldPasswordInput.dispose();
    await teacherPage.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await teacherPage.locator('#identity-check').waitFor({ state: 'hidden' });
    await teacherPage.locator('#add-student').waitFor();
    assert.equal((await api(teacherPage, '/session')).account.id, teacher.id);
    assert.equal((await api(teacherPage, '/teacher/students')).students.filter(student => student.login === 'fixture_onboarding_departed').length, 1);
    assert.equal(await teacherPage.locator('#access-password').count(), 0);
    checks.push('Synthetic persisted pagehide clears a pending PIN/form; late committed response cannot reopen credentials; pageshow revalidates the teacher and finds one account');

    assert.deepEqual(errors, [], 'No browser JavaScript errors');
    const result = { result: 'LEARNING_ONBOARDING_BROWSER_OK', checks, images, viewportWidths: WIDTHS, browserVersion: browser.version(),
      syntheticOnly: true, publicRequestsAllowed: 0, blockedExternalRequests: blockedExternal.length, errors };
    fs.mkdirSync(evidence, { recursive: true });
    fs.writeFileSync(path.join(evidence, 'browser-result.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    // Do not dump form bodies, credential DOM, cookies or database contents.
    console.error(error.stack || error); process.exitCode = 1;
  } finally {
    await browser?.close(); await stop(server); await stop(trainerServer); store?.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
})();
