'use strict';
// Real local HTTP, password hashing, isolated SQLite, trainer frames and photo codec.
// Every identity and password below is a synthetic fixture, never a live account.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const { once } = require('node:events');
const ROOT = path.resolve(__dirname, '..');
const serverRequire = createRequire(path.join(ROOT, 'board-server/package.json'));
const express = serverRequire('express');
const { LearningStore } = require('../board-server/learning-store');
const { createLearningApi } = require('../board-server/learning-api');
const { createTeachingRouter } = require('../board-server/learning-teaching');
const contracts = require('../board-server/learning-contracts');
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) {
  ({ chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright')));
}
const PASSWORD = 'Synthetic-only-free-route-2026';
const PUPIL_LOGIN = 'fixture_free_pupil';
const PUPIL_PASSWORD = 'Synthetic-only-pupil-2026';
const uuid = () => crypto.randomUUID();
const serve = async app => { const server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); return server; };
const originOf = server => 'http://127.0.0.1:' + server.address().port;
const stop = async server => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); };
const api = (page, route, body) => page.evaluate(async ({ route, body }) => LearningApp.api(route,
  body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }), { route, body });
const raw = (page, route, body) => page.evaluate(async ({ route, body }) => {
  const session = await (await fetch('/api/learning/session')).json();
  const response = await fetch('/api/learning' + route, { method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, data: await response.json() };
}, { route, body });
const frame = page => page.frameLocator('#trainer-host iframe');
async function readyFrame(page) {
  await page.locator('#trainer-host iframe').waitFor();
  try { await page.waitForFunction(() => document.querySelector('#trainer-host .frame-status')?.hidden, null, { timeout: 15000 }); }
  catch (error) { const details = await page.evaluate(() => ({ hash: location.hash,
    source: document.querySelector('#trainer-host iframe')?.src, status: document.querySelector('#trainer-host .frame-status')?.textContent,
    notice: document.querySelector('#notice')?.textContent }));
    const source = page.frames().find(frame => frame.url() === details.source);
    if (source && details.source.includes('/oge-basics/')) {
      const attempt = await api(page, '/attempts/' + new URLSearchParams(details.hash.slice(1)).get('attempt'));
      details.remediation = await source.evaluate(attempt => {
        try { const canonical = MathExamRemediation.create(attempt.taskSpec.contentId, attempt.taskSpec.seed).taskSpec;
          const differences = [];
          function compare(a, b, at) { if (JSON.stringify(a) === JSON.stringify(b)) return;
            if (a && b && typeof a === 'object' && typeof b === 'object') for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) compare(a[key], b[key], at + '.' + key);
            else differences.push({ at, expected: a, received: b }); }
          compare(canonical, attempt.taskSpec, 'task');
          MathExamRemediation.normalize(canonical, attempt.state);
          return { differences: differences.slice(0, 8) };
        } catch (error) { return { error: error.message }; }
      }, attempt);
    }
    throw Error(error.message + '\n' + JSON.stringify(details)); }
}
async function saved(page) {
  await page.waitForFunction(() => document.querySelector('#save-state')?.textContent === 'Все изменения сохранены');
}
async function navigate(page, route) {
  await page.evaluate(route => LearningApp.navigate(route), route);
  if (route === 'route') {
    await page.locator('[data-route-library]').waitFor();
    if (await page.locator('.mw-dialog[open]').count()) await page.locator('[data-mw-close]').click();
    await page.locator('[data-route-library] > summary').click();
  }
}
async function storage(page) {
  return page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
}
async function assertPrivate(page, secrets) {
  const contents = await storage(page);
  for (const secret of secrets) {
    assert.equal(contents.includes(secret), false, 'Credentials are absent from persistent browser storage');
    assert.equal(page.url().includes(secret), false, 'Credentials are absent from URLs');
  }
}
async function login(page, origin, login, password) {
  await page.goto(origin + '/learning/#route');
  await page.locator('#auth-form [name=login]').fill(login);
  await page.locator('#auth-form [name=password]').fill(password);
  await page.locator('#auth-form [type=submit]').click();
  await page.locator('#navigation').waitFor();
}

async function main() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-free-route-'));
  const store = new LearningStore({ filePath: path.join(directory, 'learning.sqlite'), contracts });
  assert.equal(store.available, true, 'Use the supported Node version with SQLite');
  const app = express(), trainerApp = express();
  app.use(express.json({ limit: '6mb' }));
  trainerApp.use(express.static(ROOT));
  const trainerServer = await serve(trainerApp), server = await serve(app);
  const origin = originOf(server), trainerOrigin = originOf(trainerServer);
  app.get('/api/learning/status', (_req, res) => res.json({ ...store.status(), trainerOrigin }));
  const learning = createLearningApi({ store, publicOrigin: origin, secureCookies: false });
  app.use('/api/learning', learning.router);
  app.use('/api/learning', createTeachingRouter(learning));
  app.use(express.static(ROOT));
  const invitation = store.bootstrap({ name: 'Учитель проверки', login: 'fixture_free_teacher' });
  let browser;
  const pageErrors = [], nonlocalRequests = [];
  try {
    browser = await chromium.launch({ headless: true,
      ...(process.env.CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
      args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    async function open(viewport = { width: 1440, height: 1000 }) {
      const context = await browser.newContext({ viewport, locale: 'ru-RU' });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (!['127.0.0.1', 'localhost'].includes(url.hostname) && /^https?:/.test(url.protocol)) {
          nonlocalRequests.push(url.origin + url.pathname); return route.abort('blockedbyclient');
        }
        return route.continue();
      });
      const page = await context.newPage(); page.on('pageerror', error => pageErrors.push(error.message));
      page.setDefaultTimeout(15000);
      return { context, page };
    }
    const teacher = await open();
    await teacher.page.goto(origin + '/learning/#invite=' + invitation.invitationToken);
    await teacher.page.locator('#auth-form [name=password]').fill(PASSWORD);
    await teacher.page.locator('#auth-form [name=confirm]').fill(PASSWORD);
    await teacher.page.locator('#auth-form [type=submit]').click();
    await teacher.page.locator('#recovery-saved').check();
    await teacher.page.locator('#done-codes').click();
    await teacher.page.locator('#navigation').waitFor();
    const teacherSession = await api(teacher.page, '/session');
    const teacherCookie = (await teacher.context.cookies(origin)).find(cookie => cookie.name === 'mathexam_learning_local');
    assert.equal(teacherCookie.httpOnly, true);
    await teacher.page.locator('[data-nav=students]').click();
    await teacher.page.locator('#add-student').click();
    await teacher.page.locator('#student-form [name=name]').fill('Ученица проверки');
    await teacher.page.locator('#student-form [name=login]').fill(PUPIL_LOGIN);
    await teacher.page.locator('#student-form [name=password]').fill(PUPIL_PASSWORD);
    await teacher.page.locator('#student-form [type=submit]').click();
    await teacher.page.locator('#access-password').waitFor();
    assert.equal(await teacher.page.locator('#access-login').inputValue(), PUPIL_LOGIN);
    assert.equal(await teacher.page.locator('#access-password').inputValue(), PUPIL_PASSWORD);
    const accessURL = new URL(await teacher.page.locator('#access-link').inputValue());
    assert.equal(accessURL.hash, '#login=' + PUPIL_LOGIN); assert.equal(accessURL.searchParams.get('role'), 'student');
    assert.equal((await api(teacher.page, '/session')).account.id, teacherSession.account.id);
    assert.equal((await teacher.context.cookies(origin)).find(cookie => cookie.name === teacherCookie.name).value, teacherCookie.value,
      'Creating a pupil does not replace the teacher session');
    assert.equal(await teacher.page.locator('#access-saved').count(), 0);
    assert.equal(await teacher.page.locator('#close-access').isDisabled(), false);
    await teacher.page.locator('#close-access').click();
    assert.equal(await teacher.page.locator('#access-password').count(), 0, 'Closing removes plaintext credential card');
    const roster = await api(teacher.page, '/teacher/students'), pupil = roster.students.find(student => student.login === PUPIL_LOGIN);
    assert.equal(pupil.active, true); assert.equal(JSON.stringify(roster).includes(PUPIL_PASSWORD), false);
    const peer = (await api(teacher.page, '/teacher/students', { name: 'Другой ученик', login: 'fixture_route_peer', password: PASSWORD })).student;
    const existing = await raw(teacher.page, '/teacher/students', { name: 'Не менять', login: PUPIL_LOGIN, password: PASSWORD });
    assert.equal(existing.status, 409, 'Duplicate login cannot overwrite credentials');
    const plan = { opId: uuid(), items: [{ catalogId: 'path:equations-signs', reason: 'Рекомендация только этой ученице', priority: 'high' }], note: 'Выбирайте порядок самостоятельно.' };
    await api(teacher.page, '/teacher/students/' + pupil.id + '/plan', plan);
    await api(teacher.page, '/teacher/students/' + peer.id + '/plan', { opId: uuid(), items: [], note: 'Закрытый план другого ученика' });
    const student = await open({ width: 390, height: 844 });
    await login(student.page, origin, PUPIL_LOGIN, PUPIL_PASSWORD);
    assert.equal((await api(student.page, '/session')).account.id, pupil.id);
    // Welcome and video assertions are added below once the module is mounted.
    await verifyWelcome(student.page, store, pupil.id);
    await navigate(student.page, 'route');
    await student.page.locator('[data-route-item="path:practice-temperature"]').waitFor();
    await student.page.getByText('Рекомендация только этой ученице', { exact: true }).waitFor();
    assert.equal(await student.page.getByText('Закрытый план другого ученика', { exact: true }).count(), 0);
    assert.deepEqual((await api(student.page, '/plan')).items, plan.items);
    assert.notEqual((await raw(student.page, '/plan?learnerId=' + peer.id)).status, 200);
    assert.equal((await raw(student.page, '/teacher/students/' + peer.id + '/plan')).status, 403);
    assert.equal((await raw(student.page, '/teacher/students/' + pupil.id + '/plan', { ...plan, opId: uuid() })).status, 403);
    assert.equal(await student.page.locator('[data-route-item]:disabled').count(), 0, 'All route topics start unlocked');
    assert.equal(await student.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Route fits a 390px screen');
    // Deliberately begin in the last group, then return to an earlier topic.
    await student.page.locator('[data-route-item="path:practice-temperature"]').click();
    await readyFrame(student.page);
    const lastTopicId = new URLSearchParams(new URL(student.page.url()).hash.slice(1)).get('attempt');
    assert.equal((await api(student.page, '/attempts/' + lastTopicId)).contentId, 'practice-temperature');
    await navigate(student.page, 'route');
    await student.page.locator('#route-equations [data-route-item="path:equations-signs"]').click();
    await readyFrame(student.page);
    const attemptId = new URLSearchParams(new URL(student.page.url()).hash.slice(1)).get('attempt');
    await frame(student.page).locator('#answer').fill('777'); await saved(student.page);
    const original = await api(student.page, '/attempts/' + attemptId);
    assert.equal(original.state.work.draft, '777');
    await student.page.locator('#route-support .route-foundations summary').click();
    await student.page.locator('[data-support-basis="oge-basics:negative-add-subtract"]').click();
    await student.page.waitForFunction(id => new URLSearchParams(location.hash.slice(1)).get('attempt') !== id, attemptId);
    await readyFrame(student.page);
    const firstBasisId = new URLSearchParams(new URL(student.page.url()).hash.slice(1)).get('attempt');
    assert.notEqual(firstBasisId, attemptId);
    assert.equal(new URLSearchParams(new URL(student.page.url()).hash.slice(1)).get('returnTo'), attemptId);
    await student.page.locator('#route-support .route-foundations summary').click();
    await student.page.locator('[data-support-basis="oge-basics:negative-number-line"]').click();
    await student.page.waitForFunction(id => new URLSearchParams(location.hash.slice(1)).get('attempt') !== id, firstBasisId);
    await readyFrame(student.page);
    assert.equal(new URLSearchParams(new URL(student.page.url()).hash.slice(1)).get('returnTo'), attemptId,
      'A deeper prerequisite retains the original task destination');
    await student.page.reload(); await readyFrame(student.page);
    await student.page.locator('.route-return a').click(); await readyFrame(student.page);
    assert.equal(new URLSearchParams(new URL(student.page.url()).hash.slice(1)).get('attempt'), attemptId);
    assert.equal(await frame(student.page).locator('#answer').inputValue(), '777');
    const returned = await api(student.page, '/attempts/' + attemptId);
    assert.ok(original.taskSpec && typeof original.taskSpec === 'object');
    assert.deepEqual(returned.taskSpec, original.taskSpec, 'Returning restores the exact generated problem');
    assert.deepEqual(returned.state, original.state, 'Returning preserves draft and step');
    assert.deepEqual(returned.assistance, original.assistance);
    assert.equal(returned.version, original.version, 'Reading prerequisites does not mutate the original attempt');
    await student.page.locator('[data-submit-attempt]').click();
    await student.page.waitForFunction(() => document.querySelector('[data-submit-status]')?.textContent.includes('Сдано на проверку'));
    const submitted = await api(student.page, '/attempts/' + attemptId);
    assert.equal(submitted.submission.attemptVersion, original.version);
    assert.equal(submitted.submission.stale, false); assert.equal(submitted.outcome, original.outcome);
    await teacher.page.evaluate(() => LearningApp.refresh()); await navigate(teacher.page, 'home');
    await teacher.page.getByRole('heading', { name: 'Сдано на проверку', exact: true }).waitFor();
    const report = await api(teacher.page, '/teacher/students/' + pupil.id + '/report');
    assert.equal(report.attempts.find(attempt => attempt.id === attemptId).submission.status, 'submitted');
    await frame(student.page).locator('#answer').fill('778'); await saved(student.page);
    assert.equal((await api(student.page, '/attempts/' + attemptId)).submission.stale, true);
    await student.page.getByRole('button', { name: 'Сдать обновлённую работу' }).click();
    await student.page.waitForFunction(() => document.querySelector('[data-submit-attempt]')?.disabled);
    assert.equal((await api(student.page, '/attempts/' + attemptId)).submission.stale, false);
    await navigate(student.page, 'route');
    await student.page.locator('.route-progress').waitFor();
    assert.match(await student.page.locator('.route-progress').innerText(), /0\s*\/\s*62/);
    assert.match(await student.page.locator('#route-equations .route-count').innerText(), /самостоятельно решено попыток: 0/);
    await verifyPaperHomework({ teacher, student, pupil, peer, store, origin });
    await verifyTopicGuideEntry({ teacher, open, store, origin });
    const pupilCookie = (await student.context.cookies(origin)).find(cookie => cookie.name === 'mathexam_learning_local');
    assert.equal(pupilCookie.httpOnly, true);
    const secrets = [PASSWORD, PUPIL_PASSWORD, teacherCookie.value, pupilCookie.value,
      teacherSession.csrfToken, (await api(student.page, '/session')).csrfToken];
    await assertPrivate(teacher.page, secrets); await assertPrivate(student.page, secrets);
    assert.equal(store.db.prepare('SELECT name FROM sqlite_master WHERE type=?').all('table').length > 0, true);
    for (const row of store.rows('SELECT * FROM operations')) assert.equal(JSON.stringify(row).includes(PUPIL_PASSWORD), false);
    if (process.env.LEARNING_ARTIFACT_DIR) {
      fs.mkdirSync(process.env.LEARNING_ARTIFACT_DIR, { recursive: true });
      await navigate(student.page, 'route'); await student.page.locator('.route-grid').waitFor();
      await student.page.screenshot({ path: path.join(process.env.LEARNING_ARTIFACT_DIR, 'free-route-mobile.png'), fullPage: true });
      await student.page.setViewportSize({ width: 1440, height: 1000 });
      await student.page.screenshot({ path: path.join(process.env.LEARNING_ARTIFACT_DIR, 'free-route-desktop.png'), fullPage: true });
    }
    assert.deepEqual(pageErrors, [], 'Browser has no uncaught script errors');
    assert.deepEqual(nonlocalRequests, [], 'The test uses local assets and performs no external requests');
    console.log('LEARNING_FREE_ROUTE_BROWSER_OK: teacher-created credentials, isolated own plan, unordered route, nested prerequisite return after reload, unchanged task and draft, submission without false success, welcome, paper homework and exact topic-guide entry without accidental attempts');
  } finally {
    if (browser) await browser.close();
    await stop(server); await stop(trainerServer); learning.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

async function verifyTopicGuideEntry({ teacher, open, store, origin }) {
  const loginName = 'fixture_topic_guide';
  const learner = (await api(teacher.page, '/teacher/students', {
    name: 'Проверка перехода из шпаргалки', login: loginName, password: PUPIL_PASSWORD
  })).student;
  const student = await open({ width: 390, height: 844 }), page = student.page;
  const creations = [];
  page.on('request', request => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/learning/attempts') creations.push(request.postDataJSON());
  });
  const count = () => store.row('SELECT COUNT(*) AS n FROM attempts WHERE learner_id=?', learner.id).n;
  const currentId = () => new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt');
  async function preflight(topic) {
    const before = count(), requests = creations.length;
    await navigate(page, 'learn=' + topic);
    await page.locator('[data-lesson-video]').waitFor();
    await page.locator('[data-lesson-trainer-video]').click();
    await page.locator('.mw-video').waitFor();
    assert.match(await page.locator('.mw-video').getAttribute('src'), new RegExp('/using-' + topic + '\\.mp4'));
    await page.keyboard.press('Escape');
    assert.equal(count(), before, 'Reading a topic guide creates no real work');
    assert.equal(creations.length, requests, 'Topic preflight does not POST an attempt');
    assert.equal(await page.locator('.lesson-steps li').count(), 3);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true,
      'Topic instructions fit a 390px screen');
  }
  async function checkSupport(topic) {
    await page.locator('#route-support .lesson-instructions').waitFor();
    assert.equal(await page.locator('[data-support-video]').getAttribute('data-support-video'), topic);
    assert.equal(await page.locator('#route-support a[href$="cheatsheets.html#' + topic + '"]').count(), 1,
      'The reminder link identifies this exact skill');
  }
  try {
    await page.goto(origin + '/learning/#learn=brackets');
    await page.locator('#auth-form [name=login]').fill(loginName);
    await page.locator('#auth-form [name=password]').fill(PUPIL_PASSWORD);
    await page.locator('#auth-form [type=submit]').click();
    await page.locator('[data-lesson-start]').waitFor();
    assert.equal(new URL(page.url()).hash, '#learn=brackets', 'Valid deep entry survives login');
    assert.equal(count(), 0); assert.equal(creations.length, 0);
    assert.equal(await page.locator('#trainer-host iframe').count(), 0, 'Instructions are shown before the first trainer starts');
    await page.reload(); await page.locator('[data-lesson-start]').waitFor();
    assert.equal(count(), 0, 'Reloading preflight remains read-only');
    await page.locator('[data-lesson-start]').click(); await readyFrame(page);
    const bracketsId = currentId(), brackets = await api(page, '/attempts/' + bracketsId);
    assert.equal(brackets.trainerId, 'ege-path'); assert.equal(brackets.contentId, 'equations-brackets');
    assert.equal(count(), 1); await checkSupport('brackets');
    assert.match(await page.locator('.lesson-instructions').innerText(), /свободное слагаемое/,
      'Bracket instructions explain the actual first question, not a generic equation');
    await frame(page).locator('#answer').fill('731'); await saved(page);
    const written = await api(page, '/attempts/' + bracketsId);
    await preflight('brackets');
    await page.evaluate(() => window.scrollTo(0, 0));
    if (process.env.LEARNING_ARTIFACT_DIR) await page.screenshot({
      path: path.join(process.env.LEARNING_ARTIFACT_DIR, 'topic-guide-brackets-mobile.png'), fullPage: true
    });
    await page.locator('[data-lesson-start]').click(); await readyFrame(page);
    assert.equal(currentId(), bracketsId, 'Returning from the reminder resumes the same attempt');
    assert.equal(count(), 1, 'Returning does not create an extra attempt');
    const resumed = await api(page, '/attempts/' + bracketsId);
    assert.deepEqual(resumed.taskSpec, written.taskSpec); assert.deepEqual(resumed.state, written.state);
    assert.equal(resumed.version, written.version); assert.equal(await frame(page).locator('#answer').inputValue(), '731');

    // These expectations are intentionally independent of the guide registry:
    // adjacent catalogue rows must not silently become the advertised practice.
    const targets = [
      ['negative-numbers', 'oge-basics', 'negative-add-subtract'],
      ['fractions', 'oge-basics', 'fraction-common-denominator'],
      ['linear-equation', 'ege-path', 'equations-linear'],
      ['proportions', 'oge-basics', 'percentages/proportion'],
      ['percentages', 'oge-basics', 'percentages/percent-of-number-and-whole']
    ];
    for (const [topic, trainerId, contentId] of targets) {
      const before = count(); await preflight(topic);
      await page.locator('[data-lesson-start]').click(); await readyFrame(page);
      const attempt = await api(page, '/attempts/' + currentId());
      assert.equal(attempt.trainerId, trainerId); assert.equal(attempt.contentId, contentId);
      assert.equal(count(), before + 1); await checkSupport(topic);
    }
    for (const contentId of ['practice-percent-part', 'practice-percent-whole', 'practice-percent-rate']) {
      await navigate(page, 'route'); await page.locator('[data-route-item="path:' + contentId + '"]').waitFor();
      if (await page.locator('.mw-dialog[open]').count()) await page.keyboard.press('Escape');
      await page.locator('[data-route-item="path:' + contentId + '"]').click(); await readyFrame(page);
      await checkSupport('percentages');
      assert.equal(await page.locator('[data-support-trainer-video]').count(), 0, 'A different Path interface does not receive an unrelated basic-HTML instruction video');
      const instructions = await page.locator('.lesson-instructions').innerText();
      assert.match(instructions, /Решить по шагам|Самостоятельно/,
        'Path percentage work has its own actual-mode instructions, not standalone remediation controls');
      assert.match(instructions, /Твой ответ/, 'Instructions identify the actual answer field');
      assert.equal((await api(page, '/attempts/' + currentId())).contentId, contentId);
      await frame(page).locator('[data-stage="2"]').click(); await saved(page);
      const firstQuestion = await frame(page).locator('#lesson .callout p').innerText();
      assert.ok(instructions.includes(firstQuestion.replace(/[.!?]+$/, '')),
        contentId + ': the guide quotes the real first question of this specific percentage activity');
    }
    const beforeAngles = count(), requestsBeforeAngles = creations.length;
    await preflight('adjacent-angles');
    assert.equal(await page.locator('[data-lesson-start]').count(), 0, 'Unmanaged angles never creates a different managed geometry attempt');
    assert.equal(await page.locator('[data-lesson-practice]').getAttribute('href'),
      'https://mathexam.space/geometry-course/trainers/ch1-p6-t2-angle-problems.html');
    assert.match(await page.locator('#main').innerText(), /не (?:добавляют|попадает|сохраняется)/,
      'Unmanaged geometry clearly explains its progress limit');
    assert.match(await page.locator('#main').innerText(), /MAX/);
    assert.equal(await page.locator('[data-route-item="path:practice-spokes"]').count(), 0);
    await page.reload(); await page.locator('[data-lesson-practice]').waitFor();
    assert.equal(count(), beforeAngles); assert.equal(creations.length, requestsBeforeAngles);
    await page.evaluate(() => window.scrollTo(0, 0));
    if (process.env.LEARNING_ARTIFACT_DIR) await page.screenshot({
      path: path.join(process.env.LEARNING_ARTIFACT_DIR, 'topic-guide-angles-mobile.png'), fullPage: true
    });
    const publicOnly = [
      ['numeric-expressions', 'calculation-plan'], ['variable-expressions', 'expression-language'],
      ['compare-expressions', 'compare-difference'], ['arithmetic-properties', 'convenient-calculation'],
      ['identities', 'identity-check'], ['equation-roots', 'equation-root'],
      ['linear-cases', 'equation-cases'], ['equation-word-problems', 'word-parts']
    ];
    for (const [topic, unit] of publicOnly) {
      const before = count(), requests = creations.length;
      await preflight(topic);
      assert.equal(await page.locator('[data-lesson-start]').count(), 0, 'Public-only course guides never create an unrelated managed attempt');
      const href = await page.locator('[data-lesson-practice]').getAttribute('href');
      assert.ok(href.startsWith('https://mathexam.space/school/'), topic + ': fixed public school workshop');
      assert.ok(href.includes('m7f-' + unit), topic + ': exact matching authored exercise');
      assert.match(await page.locator('#main').innerText(), /браузер/i, 'The public course progress limitation is visible');
      await page.reload(); await page.locator('[data-lesson-practice]').waitFor();
      assert.equal(count(), before); assert.equal(creations.length, requests);
    }
    for (const route of ['learn=unknown-topic', 'learn=%3Cimg%20src=x%20onerror=alert(1)%3E', 'learn=brackets&learn=fractions']) {
      const before = count(), requests = creations.length;
      await navigate(page, route); await page.getByRole('heading', { name: 'Эта тема пока недоступна' }).waitFor();
      assert.equal(await page.locator('[data-lesson-start]').count(), 0);
      assert.equal(count(), before); assert.equal(creations.length, requests);
      assert.equal(await page.locator('#main img').count(), 0, 'Invalid hash content is not inserted as markup');
    }
    // Merely sharing a catalogue category cannot attach the angles tutorial to
    // an unrelated question about equally spaced spokes.
    await navigate(page, 'route'); await page.locator('[data-route-item="path:practice-spokes"]').click();
    await readyFrame(page);
    assert.equal(await page.locator('[data-support-video]').count(), 0);
    assert.equal(await page.locator('.lesson-instructions').count(), 0);
    await assertPrivate(page, [PUPIL_PASSWORD]);
  } finally { await student.context.close(); }
}

async function verifyWelcome(page, store, learnerId) {
  const before = store.row('SELECT COUNT(*) AS n FROM attempts WHERE learner_id=?', learnerId).n;
  await page.locator('.mw-dialog[open]').waitFor();
  assert.ok(await page.locator('#mw-title').evaluate(node => parseFloat(getComputedStyle(node).fontSize)) >= 28,
    'The first instruction uses large, readable text');
  assert.equal(await page.locator('[data-mw-voice], [data-mw-clicks]').count(), 0, 'The silent welcome offers no narration or click playback');
  assert.match(await page.locator('.mw-silent-note').innerText(), /без звука/i);
  assert.equal(await page.locator('.mw-dialog').evaluate(node => node.scrollWidth <= node.clientWidth), true);
  if (process.env.LEARNING_ARTIFACT_DIR) {
    fs.mkdirSync(process.env.LEARNING_ARTIFACT_DIR, { recursive: true });
    await page.screenshot({ path: path.join(process.env.LEARNING_ARTIFACT_DIR, 'welcome-mobile.png'), fullPage: true });
  }
  await page.keyboard.press('Escape');
  await page.locator('.mw-dialog').waitFor({ state: 'detached' });
  await page.reload(); await page.locator('[data-route-welcome]').waitFor();
  assert.equal(await page.locator('.mw-dialog').count(), 0, 'A skipped welcome stays skipped after reload');
  await page.locator('[data-route-welcome]').focus(); await page.keyboard.press('Enter');
  await page.locator('.mw-dialog[open]').waitFor();
  await page.locator('[data-mw-next]').focus(); await page.keyboard.press('Enter');
  await page.locator('[data-mw-answer="4"]').click();
  assert.match(await page.locator('[data-mw-feedback]').innerText(), /4 \+ 3 = 7/);
  await page.locator('[data-mw-hint]').click();
  await page.locator('[data-mw-answer="5"]').focus(); await page.keyboard.press('Enter');
  assert.match(await page.locator('[data-mw-feedback]').innerText(), /5 \+ 3 = 8/);
  await page.locator('[data-mw-next]').click();
  assert.match(await page.locator('.mw-example-status').innerText(), /с подсказкой/);
  await page.locator('[data-mw-next]').click();
  await page.locator('[data-mw-submit]').click();
  assert.match(await page.locator('[data-mw-feedback]').innerText(), /не отправлялась/);
  for (let i = 0; i < 3; i++) await page.locator('[data-mw-next]').click();
  await page.locator('.mw-dialog').waitFor({ state: 'detached' });
  assert.equal(await page.locator('[data-route-welcome]').evaluate(node => node === document.activeElement), true,
    'Closing restores keyboard focus');
  assert.equal(await page.evaluate(() => MathExamWelcome.openVideo('homework-help')), false, 'Deferred how-to video is not offered to learners');
  for (const key of ['negative-numbers', 'fractions', 'brackets', 'linear-equation', 'proportions', 'percentages', 'adjacent-angles',
    'numeric-expressions', 'variable-expressions', 'compare-expressions', 'arithmetic-properties', 'identities', 'equation-roots', 'linear-cases', 'equation-word-problems']) {
    await page.evaluate(key => MathExamWelcome.openVideo(key, 'trainer'), key);
    assert.match(await page.locator('.mw-video').getAttribute('src'), /\/using-/);
    const identity = await page.locator('.mw-video').elementHandle();
    for (const kind of ['math', 'trainer']) {
      await page.locator('[data-mw-video-kind="' + kind + '"]').click();
      assert.equal(await page.locator('.mw-video').evaluate((node, original) => node === original, identity), true, 'The paired switch reuses one player');
      assert.equal(await page.locator('[data-mw-video-kind="' + kind + '"]').getAttribute('aria-pressed'), 'true');
      const fileName = (kind === 'trainer' ? 'using-' : '') + key;
      const player = page.locator('.mw-video');
      const attributes = await player.evaluate(node => ({ src: node.src, controls: node.controls,
        autoplay: node.autoplay, paused: node.paused, preload: node.preload }));
      assert.equal(attributes.src, 'https://mathexam.space/video-lessons/media/' + fileName + '.mp4?v=pre7-20261006');
      assert.equal(attributes.controls, true); assert.equal(attributes.autoplay, false);
      assert.equal(attributes.paused, true); assert.equal(attributes.preload, 'none');
      const localFile = path.join(ROOT, 'video-lessons/media', fileName + '.mp4');
      const bytes = fs.readFileSync(localFile);
      assert.ok(bytes.length > 100000 && bytes.length < 1500000, 'Download is a compact real media file');
      assert.equal(bytes.toString('ascii', 4, 8), 'ftyp', 'The video source is an MP4');
      assert.equal(await page.locator('[data-mw-download]').getAttribute('href'), attributes.src);
      assert.match(await page.locator('[data-mw-text]').getAttribute('href'), kind === 'trainer' ? new RegExp('type=trainer#' + key) : new RegExp('task=' + key));
      assert.equal(await page.locator('.mw-dialog').evaluate(node => node.scrollWidth <= node.clientWidth), true);
    }
    await identity.dispose();
    await page.keyboard.press('Escape');
  }
  assert.equal(store.row('SELECT COUNT(*) AS n FROM attempts WHERE learner_id=?', learnerId).n, before,
    'Welcome practice and video views create no real attempts or success records');
  assert.equal(store.row('SELECT COUNT(*) AS n FROM learning_submissions WHERE learner_id=?', learnerId).n, 0);
}
async function verifyPaperHomework({ teacher, student, pupil, peer, store, origin }) {
  const created = await api(teacher.page, '/assignments', { opId: uuid(), title: 'Авторская работа для проверки',
    learnerIds: [pupil.id], trainerId: 'ege-path', contentId: 'equations-signs' });
  const assignment = created.assignments[0];
  assert.equal((await raw(student.page, '/assignments/' + assignment.id)).status, 404, 'Unpublished work is private');
  await navigate(teacher.page, 'assignment=' + assignment.id);
  await teacher.page.locator('#teaching-paper').waitFor();
  assert.equal(await teacher.page.locator('[data-publish]').isDisabled(), true);
  await teacher.page.locator('#teaching-paper [name=topic]').selectOption('linear-equations');
  await teacher.page.locator('#teaching-paper [type=submit]').click();
  await teacher.page.locator('[data-paper-answers]').waitFor();
  const prepared = await api(teacher.page, '/assignments/' + assignment.id);
  assert.equal(prepared.paper.tasks.length, 6); assert.equal(prepared.paper.answerKeys.length, 6);
  assert.equal(await teacher.page.locator('.teaching-paper-tasks li').count(), 6);
  assert.equal(store.row("SELECT COUNT(*) AS n FROM learning_photos WHERE assignment_id=? AND kind='task'", assignment.id).n, 0,
    'Authored paper tasks can be published without a textbook photo');
  const downloaded = teacher.page.waitForEvent('download');
  await teacher.page.locator('[data-paper-download]').click();
  const text = fs.readFileSync(await (await downloaded).path(), 'utf8');
  for (const task of prepared.paper.tasks) assert.ok(text.includes(task.prompt));
  for (const key of prepared.paper.answerKeys) assert.equal(text.includes(key.explanation), false, 'Downloaded conditions omit answer explanations');
  assert.equal(text.includes('Ответы для преподавателя'), false);
  await teacher.page.locator('[data-publish]').click();
  await teacher.page.locator('#teaching-paper').waitFor({ state: 'detached' });
  const forbiddenEdit = await raw(teacher.page, '/assignments/' + assignment.id + '/paper', { opId: uuid(), topic: 'fractions' });
  assert.equal(forbiddenEdit.status, 409, 'Published conditions cannot be silently regenerated');
  await student.page.evaluate(() => LearningApp.refresh());
  await navigate(student.page, 'assignment=' + assignment.id);
  await student.page.locator('.teaching-paper-tasks').waitFor();
  assert.equal(await student.page.locator('.teaching-paper-tasks li').count(), 6);
  assert.equal(await student.page.locator('[data-paper-answers]').count(), 0);
  const pupilDTO = await api(student.page, '/assignments/' + assignment.id);
  assert.deepEqual(pupilDTO.paper.tasks, prepared.paper.tasks, 'Teacher and pupil receive identical frozen conditions');
  assert.equal(Object.hasOwn(pupilDTO.paper, 'answerKeys'), false, 'Private answer keys never cross the pupil API boundary');
  assert.equal(JSON.stringify(pupilDTO.paper).includes('explanation'), false);
  assert.equal(await student.page.locator('[data-submit-work]').isDisabled(), true, 'Paper hand-in requires a photo');
  const noPhoto = await raw(student.page, '/attempts/' + assignment.attemptId + '/submit', { opId: uuid(), expectedVersion: pupilDTO.attempt.version });
  assert.equal(noPhoto.status, 409); assert.equal(noPhoto.data.error, 'LEARNING_SOLUTION_PHOTO_REQUIRED');
  const sourcePhoto = path.join(ROOT, 'learning/reference-assets/fipi-2027-areas-solids.png');
  async function upload() {
    await student.page.locator('#teaching-photo [type=file]').setInputFiles(sourcePhoto);
    await student.page.waitForFunction(() => !document.querySelector('#teaching-photo [type=submit]')?.disabled);
    assert.equal(await student.page.locator('[data-submit-work]').isDisabled(), true,
      'Selecting a new photograph blocks hand-in of the previously saved photograph set');
    await student.page.locator('#teaching-photo [type=submit]').click();
  }
  await upload();
  await student.page.waitForFunction(() => !document.querySelector('[data-submit-work]')?.disabled);
  assert.equal(store.row("SELECT COUNT(*) AS n FROM learning_photos WHERE assignment_id=? AND kind='solution'", assignment.id).n, 1);
  // A photograph alone must not allow hand-in while a newer trainer draft is
  // still travelling to the server. Delay an actual authenticated action.
  await navigate(student.page, 'attempt=' + assignment.attemptId); await readyFrame(student.page);
  let heldAction, announceHeld;
  const actionHeld = new Promise(resolve => { announceHeld = resolve; });
  const actionURL = '**/api/learning/attempts/' + assignment.attemptId + '/actions';
  await student.page.route(actionURL, route => {
    if (!heldAction && route.request().postDataJSON().type === 'state') { heldAction = route; announceHeld(); }
    else return route.continue();
  });
  await frame(student.page).locator('#answer').fill('321'); await actionHeld;
  await navigate(student.page, 'assignment=' + assignment.id);
  await student.page.locator('[data-submit-work]').waitFor();
  assert.equal(await student.page.locator('[data-submit-work]').isDisabled(), true,
    'Pending trainer actions block hand-in of an older saved version');
  await heldAction.continue(); await student.page.unroute(actionURL);
  await student.page.waitForFunction(async id => (await LearningApp.api('/attempts/' + id)).state.work.draft === '321', assignment.attemptId);
  await student.page.waitForFunction(() => !document.querySelector('[data-submit-work]')?.disabled);
  await student.page.locator('[data-submit-work]').click();
  await student.page.waitForFunction(() => document.querySelector('[data-work-status]')?.textContent.includes('Отправлено'));
  const sent = await api(student.page, '/assignments/' + assignment.id);
  assert.equal(sent.attempt.submission.photoIds.length, 1); assert.equal(sent.attempt.submission.stale, false);
  assert.equal(sent.attempt.outcome, 'started', 'Hand-in does not claim independent solving');
  const peerSession = store.createSession(peer.id);
  const denied = await student.context.request.get(origin + '/api/learning/assignments/' + assignment.id,
    { headers: { Cookie: 'mathexam_learning_local=' + peerSession.sessionToken } });
  assert.equal(denied.status(), 404, 'A classmate cannot read this assignment');
  const deniedPhoto = await student.context.request.get(origin + '/api/learning/photos/' + sent.photos[0].id,
    { headers: { Cookie: 'mathexam_learning_local=' + peerSession.sessionToken } });
  assert.equal(deniedPhoto.status(), 404, 'A classmate cannot read the solution photograph');
  await navigate(teacher.page, 'assignment=' + assignment.id);
  await teacher.page.locator('#teaching-feedback [name=text]').fill('Исправьте знак во второй строке и пришлите обновлённую фотографию.');
  await teacher.page.locator('#teaching-feedback [name=status]').selectOption('revise');
  await teacher.page.locator('#teaching-feedback [type=submit]').click();
  await teacher.page.getByText('Исправьте знак во второй строке и пришлите обновлённую фотографию.', { exact: true }).waitFor();
  // Leave the teacher's review form open while the learner supplies a newer
  // submission; accepting that stale view must not accept unseen corrections.
  await teacher.page.locator('#teaching-feedback [name=text]').fill('Старая открытая проверка');
  await teacher.page.locator('#teaching-feedback [name=status]').selectOption('accepted');
  await student.page.reload();
  await student.page.getByText('Исправьте знак во второй строке и пришлите обновлённую фотографию.', { exact: true }).waitFor();
  assert.match(await student.page.locator('[data-work-status]').innerText(), /Нужно исправить/);
  assert.equal(await student.page.locator('[data-submit-work]').isDisabled(), true, 'Unchanged corrected-work resubmission is not offered');
  await upload();
  await student.page.waitForFunction(() => !document.querySelector('[data-submit-work]')?.disabled);
  assert.equal((await api(student.page, '/assignments/' + assignment.id)).attempt.submission.stale, true);
  await student.page.locator('[data-submit-work]').click();
  await student.page.waitForFunction(() => document.querySelector('[data-work-status]')?.textContent.includes('Отправлено'));
  const revised = await api(student.page, '/assignments/' + assignment.id);
  assert.equal(revised.attempt.submission.photoIds.length, 2); assert.equal(revised.attempt.submission.stale, false);
  assert.equal(revised.attempt.submission.status, 'submitted');
  const feedbackCount = store.row('SELECT COUNT(*) AS n FROM learning_feedback WHERE assignment_id=?', assignment.id).n;
  const staleRequest = teacher.page.waitForResponse(response => response.url().endsWith('/assignments/' + assignment.id + '/feedback') && response.request().method() === 'POST');
  await teacher.page.locator('#teaching-feedback [type=submit]').click();
  assert.equal((await staleRequest).status(), 409, 'A stale teacher review cannot approve a newer submission');
  assert.equal(store.row('SELECT COUNT(*) AS n FROM learning_feedback WHERE assignment_id=?', assignment.id).n, feedbackCount);
  assert.equal((await api(student.page, '/assignments/' + assignment.id)).attempt.submission.status, 'submitted');
  await navigate(teacher.page, 'assignment=' + assignment.id);
  await teacher.page.locator('#teaching-feedback [name=text]').fill('Исправление проверено, письменная работа принята.');
  await teacher.page.locator('#teaching-feedback [name=status]').selectOption('accepted');
  await teacher.page.locator('#teaching-feedback [type=submit]').click();
  await teacher.page.getByText('Исправление проверено, письменная работа принята.', { exact: true }).waitFor();
  await student.page.reload();
  await student.page.getByText('Исправление проверено, письменная работа принята.', { exact: true }).waitFor();
  assert.match(await student.page.locator('[data-work-status]').innerText(), /Проверено/);
  assert.equal((await api(student.page, '/assignments/' + assignment.id)).attempt.outcome, 'started',
    'Teacher photo acceptance remains separate from trainer independence');
  assert.equal(await student.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Photo homework fits a 390px screen');
  if (process.env.LEARNING_ARTIFACT_DIR) {
    fs.mkdirSync(process.env.LEARNING_ARTIFACT_DIR, { recursive: true });
    await student.page.screenshot({ path: path.join(process.env.LEARNING_ARTIFACT_DIR, 'paper-homework-mobile.png'), fullPage: true });
    await teacher.page.screenshot({ path: path.join(process.env.LEARNING_ARTIFACT_DIR, 'paper-homework-teacher-desktop.png'), fullPage: true });
  }
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
