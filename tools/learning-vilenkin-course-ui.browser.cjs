'use strict';
// Course navigation and the visible helper, using only synthetic pupils and
// two local origins. No real cabinet, provider, or production URL is contacted.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const express = require('node:module').createRequire(path.resolve(__dirname, '../board-server/package.json'))('express');
const {chromium} = require('playwright');
const {LearningStore} = require('../board-server/learning-store');
const {createLearningApi} = require('../board-server/learning-api');
const {hashPassword} = require('../board-server/learning-auth');
const contracts = require('../board-server/learning-contracts');
const catalog = require('../learning/vilenkin6-textbook-catalog');
const root = path.resolve(__dirname, '..');
const sourcePaths = [
  'learning/app.js', 'learning/index.html', 'learning/assistant.css',
  'learning/vilenkin6-textbook-course.js', 'learning/vilenkin6-textbook-course.css',
  'learning/vilenkin6-textbook-helper.js', 'learning/trainer-frame.js',
  'courses/vilenkin-6-part-1/textbook-course.js', 'courses/vilenkin-6-part-1/textbook-course.css',
  'courses/vilenkin-6-part-1/textbook.html',
  'courses/vilenkin-6-part-1/textbook-support.js',
  'courses/vilenkin-6-part-1/textbook-support.css'
];
const sourceHashes = () => Object.fromEntries(sourcePaths.filter(file => fs.existsSync(path.join(root, file)))
  .map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));
const listen = app => new Promise(resolve => {const server = app.listen(0, '127.0.0.1', () => resolve(server));});
const close = server => server ? new Promise(resolve => {server.closeAllConnections();server.close(resolve);}) : Promise.resolve();
async function until(predicate, label) {
  const end = Date.now() + 15000;
  while (Date.now() < end) {
    if (await predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 40));
  }
  throw Error('Timed out: ' + label);
}
async function insideViewport(locator, viewport, label) {
  const box = await locator.boundingBox();
  assert(box, label + ' is visible');
  assert(box.x >= -1 && box.y >= -1 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1,
    label + ' must fit the first viewport: ' + JSON.stringify(box));
  return box;
}

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vilenkin-course-ui-'));
  const evidence = path.resolve(process.env.VILENKIN_UI_EVIDENCE_DIR || path.join(os.tmpdir(), 'mathexam-vilenkin-ui-evidence'));
  fs.mkdirSync(evidence, {recursive: true});
  const initialHashes = sourceHashes(), errors = [], requests = [], blockedExternal = [], checks = [], images = [];
  let store, server, trainerServer, browser, page;
  try {
    store = new LearningStore({filePath: path.join(dir, 'learning.sqlite'), contracts});
    assert(store.available, 'Synthetic SQLite is available');
    const password = 'Synthetic-Course-Navigation-2026';
    const teacher = store.activate(store.bootstrap({login: 'course_ui_teacher', name: 'Преподаватель проверки'}).invitationToken,
      await hashPassword(password)).account;
    const pupil = async login => store.activate(store.createStudent(teacher, {login, name: 'Учебный профиль проверки'}).invitationToken,
      await hashPassword(password, 'student')).account;
    const student = await pupil('course_ui_pupil'), peer = await pupil('course_ui_peer');
    store.saveStudentProfile(teacher, student.id, {
      opId: crypto.randomUUID(), expectedVersion: 0, course: 'vilenkin6', goal: null,
      focus: 'Учебный профиль для проверки интерфейса.\nКурс в кабинете: Виленкин, 6 класс, часть 1 — задания учебника.'
    });
    const legacy = store.createAttempt(student, {opId: crypto.randomUUID(), trainerId: 'vilenkin6-part1', contentId: 'lesson-1'}).attempt;
    const peerAttempt = store.createAttempt(peer, {opId: crypto.randomUUID(), trainerId: 'vilenkin6-part1', contentId: 'lesson-1'}).attempt;
    const before = {
      profile: JSON.stringify(store.studentProfile(teacher, student.id)),
      legacy: JSON.stringify(store.getAttempt(student, legacy.id)),
      peer: JSON.stringify(store.getAttempt(peer, peerAttempt.id)),
      attempts: store.listAttempts(student).length
    };
    const trainer = express(); trainer.use(express.static(root)); trainerServer = await listen(trainer);
    const trainerOrigin = 'http://127.0.0.1:' + trainerServer.address().port;
    const app = express(); app.use(express.json({limit: '200kb'})); server = await listen(app);
    const origin = 'http://127.0.0.1:' + server.address().port;
    app.get('/api/learning/status', (_req, res) => res.json({...store.status(), trainerOrigin}));
    const learning = createLearningApi({store, publicOrigin: origin, secureCookies: false});
    app.use('/api/learning', learning.router); app.use(express.static(root));
    browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking']});
    const context = await browser.newContext({viewport: {width: 1280, height: 900}, locale: 'ru-RU'});
    const localOnly = route => {
      const url = new URL(route.request().url());
      if ([origin, trainerOrigin].includes(url.origin) || ['data:', 'blob:', 'about:'].includes(url.protocol)) return route.continue();
      blockedExternal.push(url.origin + url.pathname); return route.abort();
    };
    await context.route('**/*', localOnly);
    page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => requests.push({url: request.url(), method: request.method()}));
    await page.goto(origin + '/learning/?role=student#home');
    await page.locator('#auth-form [name=login]').fill(student.login);
    await page.locator('#auth-form [name=password]').fill(password);
    await page.locator('#auth-form [type=submit]').click();
    await page.locator('[data-attached-course-open]').waitFor();
    await page.locator('#auth-progress').waitFor({state: 'hidden'});
    await page.locator('.cabinet-assistant-launcher').waitFor();
    const browsingStart = requests.length;
    const mutations = since => requests.slice(since).filter(request => new URL(request.url).pathname.startsWith('/api/learning/')
      && !['GET', 'HEAD', 'OPTIONS'].includes(request.method));
    const take = async (name, targetPage = page) => {
      const file = name + '.png'; await targetPage.screenshot({path: path.join(evidence, file), fullPage: false});
      images.push({file, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(evidence, file))).digest('hex')});
    };
    const openCourse = async () => {
      await page.evaluate(() => LearningApp.navigate('vilenkin-textbook'));
      await page.locator('[data-vilenkin-textbook-course]').waitFor();
      await until(() => page.locator('[data-vilenkin-textbook-start]').isEnabled(), 'course progress and primary action');
      await page.evaluate(() => scrollTo(0, 0));
    };

    for (const width of [1280, 390, 320]) {
      const viewport = {width, height: 900}; await page.setViewportSize(viewport); await openCourse();
      const course = page.locator('[data-vilenkin-textbook-course]');
      await insideViewport(course.locator('h1'), viewport, 'Course heading at ' + width);
      const primary = await insideViewport(page.locator('[data-vilenkin-textbook-start]'), viewport, 'Start action at ' + width);
      assert(primary.height >= 44, 'Primary start target is at least 44px');
      const launcher = page.locator('.cabinet-assistant-launcher');
      const dock = await insideViewport(launcher, viewport, 'Helper launcher at ' + width);
      assert(dock.x + dock.width >= width - 40 && dock.y + dock.height >= viewport.height - 40, 'Helper is anchored at bottom-right');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'No horizontal page overflow at ' + width);
      assert.equal(await course.locator('[data-vilenkin-textbook-open]').count(), catalog.length, 'Every existing task remains available');
      await take('course-' + width);
      await launcher.click();
      const panel = page.locator('#cabinet-assistant-host [role=dialog]'); await panel.waitFor();
      assert.equal(await launcher.getAttribute('aria-expanded'), 'true');
      await insideViewport(panel, viewport, 'Navigation helper panel at ' + width);
      assert.equal(await panel.locator('[data-source-help-answer]').count(), 0, 'No mathematical answer for an unselected task');
      await take('course-helper-' + width);
      await page.keyboard.press('Escape');
      assert(await panel.isHidden(), 'Escape closes helper');
      assert.equal(await launcher.evaluate(node => document.activeElement === node), true, 'Closing returns focus to launcher');
      await launcher.click();
      await panel.locator('[data-course-help-action="start"]').click();
      assert(await panel.isHidden(), 'Navigation guidance closes its panel');
      assert.equal(await page.locator('[data-vilenkin-textbook-start]').evaluate(node => document.activeElement === node), true,
        'Navigation helper points focus to the real primary action without starting it');
      await launcher.click(); await panel.locator('[data-course-help-action="topics"]').click();
      assert.equal(await course.locator('[data-v6-topics-heading]')
        .evaluate(node => document.activeElement === node), true, 'Choose a topic focuses the shared heading before author and source topics');

      const unit = course.locator('[data-vilenkin-textbook-unit="6"]'), summary = unit.locator('summary');
      await summary.focus(); await page.keyboard.press('Enter');
      assert.equal(await unit.getAttribute('open'), '', 'Topic opens with keyboard');
      const taskButton = unit.locator('[data-vilenkin-textbook-open]').first();
      await taskButton.scrollIntoViewIfNeeded();
      const buttonBox = await taskButton.boundingBox();
      assert(buttonBox.height >= 44, 'Task has a visible accessible action target');
      const dockBox = await launcher.boundingBox();
      const overlapWidth = Math.min(buttonBox.x + buttonBox.width, dockBox.x + dockBox.width) - Math.max(buttonBox.x, dockBox.x);
      const overlapHeight = Math.min(buttonBox.y + buttonBox.height, dockBox.y + dockBox.height) - Math.max(buttonBox.y, dockBox.y);
      assert(overlapWidth <= 0 || overlapHeight <= 0, 'The whole selected task action must clear the fixed helper at ' + width + 'px');
      assert(await taskButton.evaluate(node => {
        const box = node.getBoundingClientRect();
        const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        return hit === node || node.contains(hit);
      }), 'The selected task action has an uncovered pointer target');
      assert.match(await taskButton.innerText(), /Начать|Разобрать|Открыть|Решать/, 'Task action names the next action');
      await take('topic-' + width);
      assert.equal(store.listAttempts(student).length, before.attempts, 'Browsing topics cannot create attempts');
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      const possibleActions = await course.locator('button:not([disabled]), a[href], summary').all();
      let lastAction;
      for (const action of possibleActions.reverse()) {if (await action.isVisible()) {lastAction = action;break;}}
      assert(lastAction, 'Course has a final visible action'); await lastAction.scrollIntoViewIfNeeded();
      const finalAction = await lastAction.evaluate(last => {
        const box = last.getBoundingClientRect();
        const center = {x: box.x + box.width / 2, y: box.y + box.height / 2};
        const hit = document.elementFromPoint(center.x, center.y);
        return {label: last.textContent, visible: box.y >= 0 && box.bottom <= innerHeight, uncovered: last === hit || last.contains(hit)};
      });
      assert(finalAction?.visible && finalAction.uncovered, 'The last course action can be reached above the fixed helper: ' + JSON.stringify(finalAction));
      checks.push('At ' + width + 'px: first-screen course/start; bottom-right helper; keyboard topic entry; no overflow or writes');
    }
    assert.deepEqual(mutations(browsingStart), [], 'Course and navigation helper are read-only until an explicit task start');
    assert.equal(requests.filter(request => /\/(?:assistant|textbook-help-context)(?:\/|\?|$)/.test(new URL(request.url).pathname)).length, 0,
      'Catalog helper must not call a provider or source-answer endpoint');

    await page.setViewportSize({width: 1280, height: 900}); await openCourse();
    const beforeStartRequests = requests.length;
    await page.locator('[data-vilenkin-textbook-start]').click();
    let frame;
    const ready = async () => {
      const child = page.frameLocator('#trainer-host iframe');
      await child.locator('body[data-managed-readonly="false"]').waitFor();
      await child.locator('#answer').waitFor();
      frame = page.frames().find(candidate => candidate.url().startsWith(trainerOrigin));
      assert(frame, 'Actual local trainer frame is ready');
      await page.locator('[data-source-help-launcher]').waitFor();
    };
    await ready();
    const attemptId = new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt');
    assert(attemptId, 'Start opens a saved task');
    assert.equal(store.listAttempts(student).length, before.attempts + 1, 'Start creates one attempt');
    const creationRequests = mutations(beforeStartRequests).filter(request => new URL(request.url).pathname === '/api/learning/attempts');
    assert.equal(creationRequests.length, 1, 'One explicit start makes one creation request');
    assert.equal(store.getAttempt(student, attemptId).trainerId, 'vilenkin6-textbook');
    await frame.locator('#answer').fill('37');
    const currentDraft = () => {
      const task = store.getAttempt(student, attemptId).state.task;
      return task.mode === 'guided' ? task.stepDrafts[task.step] : task.draft;
    };
    await until(() => currentDraft() === '37', 'draft is durably saved');
    await until(async () => await page.locator('#save-state').textContent() === 'Все изменения сохранены', 'draft acknowledgement reaches the cabinet');
    await page.locator('[data-source-help-launcher]').click();
    await page.locator('[data-source-help="hint"]').waitFor();
    await until(async () => !(await page.locator('[data-source-help="hint"]').isDisabled()), 'saved task help is ready');
    assert.doesNotMatch(await page.locator('.vilenkin-source-helper [role=status]').innerText(), /Подсказки доступны после сохранения/,
      'Ready helper does not retain a stale blocked-save message');
    const versionBeforeOpen = store.getAttempt(student, attemptId).version;
    await take('task-helper-1280');
    await page.locator('[data-source-help-close]').click();
    assert.equal(store.getAttempt(student, attemptId).version, versionBeforeOpen, 'Opening and closing task helper does not mark help');
    const attemptBeforeResume = JSON.stringify(store.getAttempt(student, attemptId));
    const beforeTopicsRequests = requests.length;
    await frame.locator('[data-managed-course-catalog]').click();
    await page.locator('[data-vilenkin-textbook-course]').waitFor();
    await until(() => page.locator('[data-vilenkin-textbook-start]').isEnabled(), 'course returns from the managed breadcrumb');
    assert.equal(new URL(page.url()).hash, '#vilenkin-textbook', 'All topics leaves the managed task and opens the real cabinet catalog');
    assert.deepEqual(mutations(beforeTopicsRequests), [], 'All topics is navigation, not a saved-work write');
    assert.equal(JSON.stringify(store.getAttempt(student, attemptId)), attemptBeforeResume, 'All topics preserves the saved task byte-for-byte');
    assert.match(await page.locator('[data-vilenkin-textbook-start]').innerText(), /Продолжить/, 'Primary action now offers resume');
    await page.locator('[data-vilenkin-textbook-start]').click(); await ready();
    assert.equal(new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt'), attemptId);
    assert.equal(await frame.locator('#answer').inputValue(), '37');
    assert.equal(JSON.stringify(store.getAttempt(student, attemptId)), attemptBeforeResume, 'Resuming leaves all saved task fields intact');
    await page.reload(); await ready();
    assert.equal(await frame.locator('#answer').inputValue(), '37');
    assert.equal(store.listAttempts(student).length, before.attempts + 1, 'Resume and reload create no duplicate');
    checks.push('Primary start creates exactly one owned task; All topics returns to the cabinet; Continue and reload keep its id, draft, version and history');

    await page.locator('[data-source-help-launcher]').click();
    await page.locator('[data-source-help="hint"]').click();
    await page.locator('[data-source-help-answer]').waitFor();
    assert.equal(store.getAttempt(student, attemptId).state.task.helped, true, 'Real task hint is saved through the existing source-help action');
    assert.equal(await frame.locator('#answer').inputValue(), '37', 'Task help preserves the draft');
    await page.setViewportSize({width: 320, height: 900});
    await insideViewport(page.locator('#cabinet-assistant-host [role=dialog]'), {width: 320, height: 900}, 'Saved-task helper panel at 320');
    await take('task-helper-320');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-source-help-launcher]').getAttribute('aria-expanded'), 'false');
    checks.push('Catalog navigation switches to source-bound task help; acknowledged hint saves provenance and preserves draft');

    let inputHeld = false, releaseInput;
    const pendingInput = new Promise(resolve => {releaseInput = resolve;});
    const actionURL = origin + '/api/learning/attempts/' + attemptId + '/actions';
    await page.route(actionURL, async route => {inputHeld = true;await pendingInput;await route.continue();}, {times: 1});
    try {
      await frame.locator('#answer').fill('41');
      await until(() => inputHeld, 'held input save');
      await frame.locator('[data-managed-course-catalog]').click();
      await page.locator('#toast').waitFor();
      assert.match(await page.locator('#toast').innerText(), /дождитесь сохранения/);
      assert.equal(new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt'), attemptId,
        'All topics cannot leave while a draft is still pending');
      await page.locator('#workspace-vilenkin-catalog').click();
      assert.equal(new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt'), attemptId,
        'The cabinet catalogue link keeps the same pending-save guard');
      assert.equal(currentDraft(), '37', 'The held input has not yet reached the server');
    } finally {
      releaseInput();
    }
    await until(() => currentDraft() === '41', 'held draft is saved after release');
    await until(async () => await page.locator('#save-state').textContent() === 'Все изменения сохранены', 'held draft acknowledgement');
    await page.locator('#workspace-vilenkin-catalog').click();
    await page.locator('[data-vilenkin-textbook-course]').waitFor();
    assert.equal(new URL(page.url()).hash, '#vilenkin-textbook');
    checks.push('Both catalogue links wait for a held draft save; the shell return preserves the newly saved input');

    await until(() => page.locator('[data-vilenkin-textbook-start]').isEnabled(), 'resume before history navigation');
    await page.locator('[data-vilenkin-textbook-start]').click(); await ready();
    const beforeHistoryReturn = JSON.stringify(store.getAttempt(student, attemptId));
    const historyBeforeReturn = JSON.stringify(store.history(student, attemptId));
    await page.locator('#show-history').click();
    await page.locator('#history-bar').waitFor();
    await frame.locator('body[data-managed-readonly="true"]').waitFor();
    assert.equal(await frame.locator('#main').evaluate(node => node.inert), true, 'History keeps the trainer inert');
    const catalogueReturn = page.locator('#workspace-vilenkin-catalog');
    assert.equal(await catalogueReturn.getAttribute('href'), '#vilenkin-textbook', 'The shell has a real course link');
    await page.locator('#toast').waitFor({state: 'hidden'});
    await page.evaluate(() => scrollTo(0, 0));
    await insideViewport(catalogueReturn, {width: 320, height: 900}, 'Catalogue return outside the read-only history');
    await take('history-catalog-return-320');
    const staleCatalogueLink = await catalogueReturn.elementHandle();
    const historyReturnRequests = requests.length;
    await catalogueReturn.click();
    await page.locator('[data-vilenkin-textbook-course]').waitFor();
    await until(() => page.locator('[data-vilenkin-textbook-start]').isEnabled(), 'course returned from history');
    assert.deepEqual(mutations(historyReturnRequests), [], 'Leaving history only browses the catalogue');
    assert.equal(JSON.stringify(store.getAttempt(student, attemptId)), beforeHistoryReturn, 'History return preserves the exact saved attempt');
    assert.equal(JSON.stringify(store.history(student, attemptId)), historyBeforeReturn, 'History return adds no saved event');
    await page.locator('[data-vilenkin-textbook-start]').click(); await ready();
    assert.equal(new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt'), attemptId);
    assert.equal(await frame.locator('#answer').inputValue(), '41');
    assert.equal(store.listAttempts(student).length, before.attempts + 1, 'History return and resume create no duplicate work');
    checks.push('Pupil history remains read-only; its visible 320px shell link returns to the course and resumes the exact saved attempt without writes');

    await page.setViewportSize({width: 1280, height: 900}); await openCourse();
    const fraction = catalog.find(row => row.contentId === 'v6-book-2-134-в');
    assert(fraction, 'The concrete fraction task is part of the existing source');
    const fractionUnit = page.locator('[data-vilenkin-textbook-unit="' + fraction.unitId + '"]');
    await fractionUnit.locator('summary').click();
    await fractionUnit.locator('[data-vilenkin-textbook-open="' + fraction.id + '"]').click(); await ready();
    const fractionId = new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt');
    const staleRequests = requests.length;
    await staleCatalogueLink.evaluate(link => link.click());
    assert.equal(new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt'), fractionId,
      'A detached catalogue control cannot leave a later task');
    assert.deepEqual(mutations(staleRequests), [], 'A stale navigation control never writes work');
    await staleCatalogueLink.dispose();
    const fractionBefore = store.getAttempt(student, fractionId);
    const practice = frame.locator('.work .help-actions [data-v6-practice="lcm"]');
    await practice.waitFor();
    assert.equal(await practice.getAttribute('href'), 'https://mathexam.space/trainers/grade6-nok.html?task=nt-1-5');
    assert.equal(await practice.getAttribute('target'), '_blank');
    assert.match(await practice.getAttribute('rel'), /noopener/);
    assert.match(await practice.innerText(), /Потренировать поиск НОК по шагам/);
    await page.locator('#toast').waitFor({state: 'hidden'});
    await page.locator('#trainer-host').evaluate(node => node.scrollIntoView({block: 'start'}));
    await practice.scrollIntoViewIfNeeded(); await take('fraction-practice-1280');
    // Keep the real popup/sandbox behavior, mapping only this known reference
    // to the byte-identical local trainer for a zero-production-traffic test.
    await practice.evaluate((link, localOrigin) => {const original = new URL(link.href);link.href = localOrigin + original.pathname + original.search;}, trainerOrigin);
    const popupPromise = context.waitForEvent('page'); await practice.click(); const popup = await popupPromise;
    await popup.locator('#trainer h1').waitFor();
    assert.equal(await popup.evaluate(() => opener), null, 'Separate practice has no opener access');
    await until(() => store.getAttempt(student, fractionId).state.task.helped, 'practice visit records assistance');
    const fractionAfter = store.getAttempt(student, fractionId);
    assert.deepEqual(fractionAfter.taskSpec, fractionBefore.taskSpec, 'Separate practice never changes the original fractions');
    assert.equal(fractionAfter.state.task.status, fractionBefore.state.task.status, 'Practice visit does not award completion');
    assert.equal(fractionAfter.state.task.draft, fractionBefore.state.task.draft, 'Practice visit does not fill the answer');
    await popup.close();
    assert.equal(new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt'), fractionId);
    checks.push('The concrete fraction task offers a separate LCM trainer; popup is noopener, help is recorded, original condition/answer/status stay intact');

    const teacherContext = await browser.newContext({viewport: {width: 1280, height: 900}, locale: 'ru-RU'});
    await teacherContext.route('**/*', localOnly);
    const teacherPage = await teacherContext.newPage(); teacherPage.setDefaultTimeout(15000);
    teacherPage.on('pageerror', error => errors.push(error.message));
    teacherPage.on('request', request => requests.push({url: request.url(), method: request.method()}));
    await teacherPage.goto(origin + '/learning/?role=teacher#home');
    await teacherPage.locator('#auth-form [name=login]').fill(teacher.login);
    await teacherPage.locator('#auth-form [name=password]').fill(password);
    await teacherPage.locator('#auth-form [type=submit]').click();
    await until(() => teacherPage.evaluate(() => window.LearningApp?.account()?.role === 'teacher'), 'synthetic teacher login');
    await teacherPage.locator('#auth-progress').waitFor({state: 'hidden'});
    await teacherPage.evaluate(id => LearningApp.navigate('attempt=' + id), attemptId);
    let teacherFrame = teacherPage.frameLocator('#trainer-host iframe');
    await teacherFrame.locator('body[data-managed-readonly="true"]').waitFor();
    assert.equal(await teacherFrame.locator('#main').evaluate(node => node.inert), true, 'Teacher viewing retains the inert pupil work');
    assert.equal(await teacherPage.locator('#workspace-vilenkin-catalog').getAttribute('href'), '#vilenkin-textbook');
    await teacherPage.evaluate(() => scrollTo(0, 0));
    await insideViewport(teacherPage.locator('#workspace-vilenkin-catalog'), {width: 1280, height: 900}, 'Teacher catalogue return');
    await take('teacher-catalog-return-1280', teacherPage);
    const teacherViewAttempt = JSON.stringify(store.getAttempt(student, attemptId));
    const teacherViewHistory = JSON.stringify(store.history(student, attemptId));
    const teacherReturnRequests = requests.length;
    await teacherPage.locator('#workspace-vilenkin-catalog').click();
    await teacherPage.locator('[data-vilenkin-textbook-course]').waitFor();
    assert.equal(await teacherPage.locator('[data-vilenkin-textbook-open]').count(), catalog.length, 'Teacher reaches the actual textbook catalogue');
    assert.deepEqual(mutations(teacherReturnRequests), [], 'Teacher catalogue navigation never transfers control or creates work');
    assert.equal(JSON.stringify(store.getAttempt(student, attemptId)), teacherViewAttempt);
    assert.equal(JSON.stringify(store.history(student, attemptId)), teacherViewHistory);
    await teacherPage.goBack();
    teacherFrame = teacherPage.frameLocator('#trainer-host iframe');
    await teacherFrame.locator('body[data-managed-readonly="true"]').waitFor();
    assert.equal(await teacherFrame.locator('#answer').inputValue(), '41', 'Teacher returns to the same saved draft');
    // Taking control is an explicit fixture action. Navigation is measured only
    // after that acknowledgement and must not cause any further write.
    await teacherPage.locator('#trainer-control').click();
    await teacherFrame.locator('body[data-managed-readonly="false"]').waitFor();
    await until(() => store.getAttempt(student, attemptId).controller === 'teacher', 'teacher control acknowledged');
    const teacherControlledAttempt = JSON.stringify(store.getAttempt(student, attemptId));
    const teacherControlledHistory = JSON.stringify(store.history(student, attemptId));
    const teacherControlledRequests = requests.length;
    await teacherFrame.locator('[data-managed-course-catalog]').click();
    await teacherPage.locator('[data-vilenkin-textbook-course]').waitFor();
    assert.deepEqual(mutations(teacherControlledRequests), [], 'Editable teacher breadcrumb is also only navigation');
    assert.equal(JSON.stringify(store.getAttempt(student, attemptId)), teacherControlledAttempt);
    assert.equal(JSON.stringify(store.history(student, attemptId)), teacherControlledHistory);
    assert.equal(store.listAttempts(student).length, before.attempts + 2, 'Teacher browsing does not create another attempt');
    await teacherContext.close();
    checks.push('Teacher read-only shell return and controlled-task breadcrumb open the real catalogue without changing work, control, history or attempt count');

    assert.equal(JSON.stringify(store.studentProfile(teacher, student.id)), before.profile);
    assert.equal(JSON.stringify(store.getAttempt(student, legacy.id)), before.legacy);
    assert.equal(JSON.stringify(store.getAttempt(peer, peerAttempt.id)), before.peer);
    assert.equal(requests.filter(request => request.url.includes('/assistant/ask')).length, 0);
    assert.deepEqual(errors, [], 'No browser JavaScript errors');
    assert.deepEqual(sourceHashes(), initialHashes, 'Source files stayed unchanged throughout the verification');
    checks.push('Profile, legacy work, and other pupil work unchanged; no external provider calls or browser errors');
    const result = {result: 'VILENKIN_COURSE_UI_BROWSER_OK', tasks: catalog.length, checks, images,
      sourceSha256: initialHashes, viewportWidths: [320, 390, 1280], errors, externalRequestsAllowed: 0,
      blockedExternalRequests: blockedExternal.length, providerCalls: 0};
    fs.writeFileSync(path.join(evidence, 'browser-result.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (page) {
      await page.screenshot({path: path.join(evidence, 'failure.png'), fullPage: true}).catch(() => {});
      console.error((await page.locator('body').innerText()).slice(-5000));
    }
    throw error;
  } finally {
    await browser?.close(); await close(server); await close(trainerServer); store?.close();
    fs.rmSync(dir, {recursive: true, force: true});
  }
})().catch(error => {console.error(error);process.exitCode = 1;});
