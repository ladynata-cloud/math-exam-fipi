'use strict';

// Real local HTTP, durable SQLite and independent browser sessions. All names,
// credentials, homework and solutions below are synthetic fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { once } = require('node:events');
const { createRequire } = require('node:module');
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
const PASSWORD = 'Synthetic-oge-browser-2026';
const uuid = () => crypto.randomUUID();
const serve = async app => { const server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); return server; };
const originOf = server => 'http://127.0.0.1:' + server.address().port;
const stop = async server => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); };
const api = (page, route, body) => page.evaluate(async ({ route, body }) => LearningApp.api(route,
  body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }), { route, body });
const raw = (page, route, body) => page.evaluate(async ({ route, body }) => {
  const session = await (await fetch('/api/learning/session')).json();
  const response = await fetch('/api/learning' + route, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  return { status: response.status, body: await response.json() };
}, { route, body });
const navigate = (page, route) => page.evaluate(route => LearningApp.navigate(route), route);
const frame = page => page.frameLocator('#trainer-host iframe');
const saved = page => page.waitForFunction(() => document.querySelector('#save-state')?.textContent === 'Все изменения сохранены');
async function ready(page) {
  await page.locator('#trainer-host iframe').waitFor();
  await page.waitForFunction(() => document.querySelector('#trainer-host .frame-status')?.hidden);
}
async function poll(read, accepts, message) {
  let result;
  for (let i = 0; i < 100; i++) {
    result = await read(); if (accepts(result)) return result;
    await new Promise(resolve => setTimeout(resolve, 80));
  }
  assert(accepts(result), message + ': ' + JSON.stringify(result));
}
async function login(page, origin, login, route) {
  await page.goto(origin + '/learning/#' + route);
  await page.locator('#auth-form [name=login]').fill(login);
  await page.locator('#auth-form [name=password]').fill(PASSWORD);
  await page.locator('#auth-form [type=submit]').click();
  await page.locator('#navigation').waitFor();
}

async function main() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-oge-'));
  const store = new LearningStore({ filePath: path.join(directory, 'learning.sqlite'), contracts });
  assert(store.available, 'Use the supported Node version with SQLite');
  const trainerApp = express(), app = express();
  trainerApp.use(express.static(ROOT)); app.use(express.json({ limit: '6mb' }));
  const trainerServer = await serve(trainerApp), server = await serve(app);
  const trainerOrigin = originOf(trainerServer), origin = originOf(server);
  app.get('/api/learning/status', (_req, res) => res.json({ ...store.status(), trainerOrigin }));
  const learning = createLearningApi({ store, publicOrigin: origin, secureCookies: false });
  app.use('/api/learning', learning.router, createTeachingRouter(learning)); app.use(express.static(ROOT));
  const invitation = store.bootstrap({ name: 'Проверочный преподаватель', login: 'fixture_oge_teacher' });
  const pageErrors = [], externalRequests = [];
  let browser;
  try {
    browser = await chromium.launch({ headless: true,
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM_EXECUTABLE,
      args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    async function open(viewport = { width: 1365, height: 980 }) {
      const context = await browser.newContext({ viewport, locale: 'ru-RU' });
      await context.route('**/*', request => {
        const url = new URL(request.request().url());
        if (['127.0.0.1', 'localhost'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)) return request.continue();
        externalRequests.push(url.origin + url.pathname); return request.abort('blockedbyclient');
      });
      const page = await context.newPage(); page.setDefaultTimeout(15000);
      page.on('pageerror', error => pageErrors.push(error.message));
      return { page, context };
    }
    const teacher = await open(), tp = teacher.page;
    await tp.goto(origin + '/learning/#invite=' + invitation.invitationToken);
    await tp.locator('#auth-form [name=password]').fill(PASSWORD);
    await tp.locator('#auth-form [name=confirm]').fill(PASSWORD);
    await tp.locator('#auth-form [type=submit]').click();
    await tp.locator('#recovery-saved').check(); await tp.locator('#done-codes').click();
    await tp.locator('#navigation').waitFor();
    const pupils = [];
    for (let i = 1; i <= 4; i++) {
      const pupil = (await api(tp, '/teacher/students', {
        name: 'Проверочный ученик ' + i, login: 'fixture_oge_pupil_' + i, password: PASSWORD
      })).student;
      pupils.push({ ...pupil, goal: i <= 2 ? 'grade5' : 'pass' });
    }
    const oldPupil = (await api(tp, '/teacher/students', {
      name: 'Проверочный школьный ученик', login: 'fixture_oge_school', password: PASSWORD
    })).student;
    await tp.evaluate(() => LearningApp.refresh());
    for (const pupil of pupils) {
      await navigate(tp, 'student=' + pupil.id);
      await tp.locator('#teaching-profile').waitFor();
      await tp.locator('#teaching-profile [name=course]').selectOption('oge');
      await tp.locator('#teaching-profile [name=goal]').selectOption(pupil.goal);
      await tp.locator('#teaching-profile [name=focus]').fill('Личная цель проверочного ученика ' + pupil.login);
      await tp.locator('#teaching-profile [type=submit]').click();
      await tp.locator('[data-profile-status]').filter({ hasText: 'сохранены' }).waitFor();
      const profile = (await api(tp, '/teacher/students/' + pupil.id + '/profile')).profile;
      assert.equal(profile.course, 'oge'); assert.equal(profile.goal, pupil.goal); assert.equal(profile.version, 1);
      assert.equal(await tp.locator('[data-ege-positions]').isVisible(), false,
        'OGE report has no EGE-base results section');
    }
    const schoolProfile = (await api(tp, '/teacher/students/' + oldPupil.id + '/profile')).profile;
    assert.equal(schoolProfile.course, 'school'); assert.equal(schoolProfile.version, 0);
    await navigate(tp, 'students'); await tp.locator('.student-goal').first().waitFor();
    assert.equal(await tp.locator('.student-goal').filter({ hasText: 'Подготовка на 5' }).count(), 2);
    assert.equal(await tp.locator('.student-goal').filter({ hasText: 'Уверенно сдать' }).count(), 2);

    // A stale teacher form cannot silently replace a newer individual plan.
    const first = pupils[0]; await navigate(tp, 'student=' + first.id);
    await tp.locator('#teaching-profile').waitFor();
    await api(tp, '/teacher/students/' + first.id + '/profile', {
      opId: uuid(), expectedVersion: 1, course: 'oge', goal: 'pass', focus: 'Сохранено в другой вкладке'
    });
    await tp.locator('#teaching-profile [name=focus]').fill('Мой сохранённый черновик');
    await tp.locator('#teaching-profile [type=submit]').click();
    await tp.locator('[data-profile-refresh]').waitFor();
    assert.equal(await tp.locator('#teaching-profile [type=submit]').isDisabled(), true);
    assert.equal(await tp.locator('#teaching-profile [name=focus]').inputValue(), 'Мой сохранённый черновик');
    assert.equal((await api(tp, '/teacher/students/' + first.id + '/profile')).profile.focus, 'Сохранено в другой вкладке');
    await tp.locator('[data-profile-refresh]').click(); await tp.locator('[data-profile-conflict]').waitFor();
    assert.match(await tp.locator('[data-profile-conflict]').innerText(), /Сохранено в другой вкладке/);
    await tp.locator('#teaching-profile [type=submit]').click();
    await tp.locator('[data-profile-status]').filter({ hasText: 'сохранены' }).waitFor();
    assert.equal((await api(tp, '/teacher/students/' + first.id + '/profile')).profile.goal, 'grade5');

    // Every assignment has a different private link. Preparing an online task
    // alone must not bypass the existing written-homework publication rule.
    const works = [];
    await navigate(tp, 'students');
    await tp.locator('[data-assign-student="' + first.id + '"]').click();
    assert.equal(await tp.locator('#assignment-form [name=course]').inputValue(), 'oge');
    await tp.locator('#assignment-form [name=course]').selectOption('foundations');
    assert.equal(await tp.locator('#assignment-form [name=content] option[value="path:pre7-place-value"]').count(), 1);
    assert.equal(await tp.locator('#assignment-form [name=content] option[value="path:logarithms"]').count(), 0,
      'Foundation homework excludes unrelated advanced topics');
    await tp.locator('#assignment-form [name=title]').fill('Закрытая домашняя работа 1');
    await tp.locator('#assignment-form [name=content]').selectOption('path:pre7-place-value');
    await tp.locator('#assignment-form [type=submit]').click();
    await tp.locator('#teaching-paper').waitFor();
    works.push({ id: new URLSearchParams(new URL(tp.url()).hash.slice(1)).get('assignment') });
    assert.equal(await tp.locator('[data-publish]').isDisabled(), true);
    const blocked = await raw(tp, '/assignments/' + works[0].id + '/publish', { opId: uuid() });
    assert.notEqual(blocked.status, 200, 'Server enforces the written-homework requirement');
    await tp.locator('#teaching-paper [name=topic]').selectOption('fractions');
    await tp.locator('#teaching-paper [type=submit]').click();
    await tp.locator('[data-publish]:not([disabled])').waitFor(); await tp.locator('[data-publish]').click();
    await tp.locator('[data-copy-homework]').waitFor();
    await teacher.context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
    await tp.locator('[data-copy-homework]').click();
    const copied = await poll(() => tp.evaluate(() => navigator.clipboard.readText()),
      text => text.includes('#assignment='), 'Homework link copied');
    assert.equal(copied, origin + '/learning/#assignment=' + works[0].id);
    assert.equal(new URL(copied).search, '', 'The share link contains no credential');
    for (let i = 1; i < pupils.length; i++) {
      const assignment = (await api(tp, '/assignments', { opId: uuid(), learnerIds: [pupils[i].id],
        title: 'Закрытая домашняя работа ' + (i + 1), trainerId: 'ege-path', contentId: 'pre7-place-value' })).assignments[0];
      works.push(assignment);
      await api(tp, '/assignments/' + assignment.id + '/paper', { opId: uuid(), topic: 'fractions' });
      await api(tp, '/assignments/' + assignment.id + '/publish', { opId: uuid() });
    }
    const clients = [];
    for (let i = 0; i < pupils.length; i++) {
      const client = await open(i === 2 ? { width: 390, height: 844 } : undefined), page = client.page;
      await login(page, origin, pupils[i].login, 'assignment=' + works[i].id);
      await page.getByRole('heading', { name: 'Закрытая домашняя работа ' + (i + 1), exact: true }).waitFor();
      assert.equal(new URL(page.url()).hash, '#assignment=' + works[i].id, 'Homework destination survives login');
      assert.equal(await page.locator('[data-paper-answers]').count(), 0, 'Teacher answer keys are absent');
      assert.equal(await page.locator('[data-submit-work]').isDisabled(), true, 'Written submission still needs a photograph');
      assert.equal(await page.locator('.mw-dialog[open]').count(), 0, 'School onboarding does not interrupt OGE pupils');
      assert.equal((await api(page, '/assignments')).assignments.length, 1, 'Every pupil sees only their own assignment');
      assert.equal((await api(page, '/profile')).profile.goal, pupils[i].goal);
      assert.equal((await api(page, '/rewards')).totalPoints, 0, 'Opening homework awards no points');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      clients.push(client);
    }
    const lp = clients[0].page, peer = clients[1].page;
    await peer.goto(copied); await peer.getByRole('heading', { name: 'Не удалось открыть', exact: true }).waitFor();
    assert.equal(await peer.getByRole('heading', { name: 'Закрытая домашняя работа 1', exact: true }).count(), 0);
    assert.equal(await peer.locator('.teaching-paper-tasks').count(), 0, 'Peer link reveals no task or paper');
    assert.equal((await raw(peer, '/assignments/' + works[0].id)).status, 404);
    assert.equal((await raw(peer, '/teacher/students/' + first.id + '/report')).status, 403);
    assert.equal((await raw(peer, '/teacher/students/' + first.id + '/rewards')).status, 403);

    await lp.locator('a[href^="#attempt="]').click(); await ready(lp);
    const attemptId = new URLSearchParams(new URL(lp.url()).hash.slice(1)).get('attempt');
    await frame(lp).locator('#answer').fill('123456789'); await saved(lp);
    await lp.reload(); await ready(lp);
    assert.equal(await frame(lp).locator('#answer').inputValue(), '123456789', 'Exact unfinished draft survives refresh');
    const before = await api(lp, '/attempts/' + attemptId);
    assert.equal(before.state.work.stage, 3);
    await frame(lp).locator('#answer').fill(contracts.expectedText(before.taskSpec)); await saved(lp);
    await frame(lp).locator('#answerForm button.primary').click();
    const completed = await poll(() => api(lp, '/attempts/' + attemptId),
      a => a.outcome === 'independent', 'Server grades the synthetic answer');
    assert.equal(completed.state.work.done, true);
    const earned = await api(lp, '/rewards');
    assert.equal(earned.totalPoints, 15); assert.equal(earned.uniqueCompleted, 1);
    assert.equal(earned.independentConditions, 1);
    await lp.locator('[data-submit-attempt]').click();
    await lp.locator('#teaching-photo').waitFor();
    assert.equal((await api(lp, '/attempts/' + attemptId)).submission, null,
      'An online answer does not bypass the assigned paper-photo requirement');
    const photo = await lp.evaluate(() => {
      const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 240;
      const context = canvas.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0, 0, 400, 240);
      context.fillStyle = '#123'; context.font = '24px sans-serif'; context.fillText('Synthetic written solution', 15, 80);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    await lp.locator('#teaching-photo [name=photo]').setInputFiles({
      name: 'synthetic-solution.png', mimeType: 'image/png', buffer: Buffer.from(photo, 'base64')
    });
    await lp.locator('#teaching-photo [type=submit]').click();
    await lp.locator('[data-submit-work]:not([disabled])').waitFor();
    await lp.locator('[data-submit-work]').click();
    await poll(() => api(lp, '/attempts/' + attemptId), a => !!a.submission, 'One-click submission recorded');
    await navigate(lp, 'attempt=' + attemptId); await ready(lp); await lp.reload(); await ready(lp);
    assert.deepEqual(await api(lp, '/rewards'), earned, 'Submission and page reload cannot inflate points');
    assert.equal((await api(peer, '/rewards')).totalPoints, 0, 'Another pupil gets no reward');
    const report = await api(tp, '/teacher/students/' + first.id + '/report');
    const reported = report.attempts.find(a => a.id === attemptId);
    assert.equal(reported.outcome, 'independent'); assert.equal(reported.submission.status, 'submitted');

    await verifyPreparation({ clients, pupils, teacher: tp, open, origin, trainerOrigin, earned });
    await verifyLongHistory({ store, page: lp, teacher: tp, pupil: first, completedId: attemptId });
    const school = await open(); await login(school.page, origin, oldPupil.login, 'route');
    if (await school.page.locator('[data-mw-close]').isVisible()) await school.page.locator('[data-mw-close]').click();
    await school.page.locator('.study-route-panel').waitFor();
    assert.equal(await school.page.locator('[data-study-track=geometry]').count(), 1,
      'An existing school pupil keeps the school route');
    assert.equal((await api(school.page, '/attempts')).attempts.length, 0);
    assert.deepEqual(pageErrors, []); assert.deepEqual(externalRequests, []);
    console.log('LEARNING_OGE_BROWSER_OK: four private OGE profiles/two goals; version conflict; filtered homework and private links through login; paper gate; durable draft, solution, submission and honest rewards; task/lab routes; explicit teacher plans beyond the foundation map; completed topics and new analogues beyond 200 attempts; old school route; 390px.');
  } finally {
    if (browser) await browser.close(); await stop(server); await stop(trainerServer); store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

async function verifyPreparation({ clients, pupils, teacher, open, origin, trainerOrigin, earned }) {
  const recommendations = [];
  for (let i = 0; i < clients.length; i++) {
    const page = clients[i].page, before = (await api(page, '/attempts')).attempts;
    await navigate(page, 'route'); await page.locator('[data-prep-points]').waitFor();
    assert.equal(await page.locator('[data-prep-goal]').innerText(), i < 2 ? 'ОГЭ на 5' : 'Уверенно сдать ОГЭ');
    assert.equal(await page.locator('[data-prep-points]').innerText(), i === 0 ? '15' : '0');
    assert.equal(await page.locator('[data-prep-mode=tasks]').getAttribute('aria-pressed'), 'true');
    recommendations.push(await page.locator('.prep-next [data-prep-start]').evaluateAll(nodes => nodes.map(n => n.dataset.prepStart)));
    assert.equal(await page.locator('.prep-homework h3').count(), 1, 'The route retains private homework');
    assert.equal(await page.locator('input[name=goal],select[name=goal],[data-prep-goal-select]').count(), 0,
      'Pupils cannot overwrite the teacher goal');
    await page.locator('[data-prep-mode=lab]').click(); await page.locator('[data-prep-search]').waitFor();
    assert.equal(await page.locator('[data-prep-mode=lab]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-prep-search]').fill('деление');
    assert(await page.locator('[data-prep-item]').count() > 0, 'Division is discoverable in the laboratory');
    assert.equal(await page.locator('.prep-task').filter({ hasText: 'Разряды числа и важные нули' }).count(), 0,
      'Search narrows the visible laboratory');
    const publicCards = page.locator('.prep-task').filter({ hasText: 'Эта страница не передаёт результат в кабинет' });
    assert(await publicCards.count() > 0, 'Public-only exercises identify their progress limitation');
    for (const link of await publicCards.locator('a').all()) {
      assert.equal(await link.getAttribute('target'), '_blank');
      assert.match(await link.getAttribute('rel'), /noopener/);
    }
    assert.equal(await publicCards.locator('[data-prep-start]').count(), 0,
      'A public exercise cannot masquerade as a server-tracked task');
    await page.locator('[data-prep-mode=tasks]').click();
    assert.deepEqual((await api(page, '/attempts')).attempts, before, 'Mode changes and search neither solve nor create work');
    assert.equal((await api(page, '/rewards')).totalPoints, i === 0 ? earned.totalPoints : 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true,
      'Task and lab modes fit the 390px pupil viewport');
  }
  assert.deepEqual(recommendations[0], recommendations[1]); assert.deepEqual(recommendations[2], recommendations[3]);
  assert.notDeepEqual(recommendations[0], recommendations[2], 'The two OGE goals suggest different first tasks');

  // Existing public practice stays available without claiming a new result.
  const publicPage = await open(), previous = await api(clients[0].page, '/rewards');
  await publicPage.page.goto(trainerOrigin + '/trainers/arifmetika.html?course=preoge&level=n4d');
  await publicPage.page.locator('#multiplication-refresh-button').waitFor();
  await publicPage.page.locator('#multiplication-refresh-button').click();
  await publicPage.page.getByRole('dialog').waitFor();
  assert.deepEqual(await api(clients[0].page, '/rewards'), previous, 'Opening public division and multiplication practice adds no cabinet points');
  await publicPage.context.close();

  // One student may use the whole foundation course while others retain OGE.
  const fourth = pupils[3], profile = (await api(teacher, '/teacher/students/' + fourth.id + '/profile')).profile;
  await api(teacher, '/teacher/students/' + fourth.id + '/profile', {
    opId: uuid(), expectedVersion: profile.version, course: 'foundations', goal: null, focus: 'Повторение основ в своём темпе'
  });
  const foundationPage = clients[3].page; await foundationPage.reload();
  await foundationPage.getByRole('heading', { name: 'Математические основы', exact: true }).waitFor();
  await foundationPage.locator('[data-prep-points]').waitFor();
  assert.equal(await foundationPage.locator('[data-prep-goal]').count(), 0);
  assert.equal(await foundationPage.locator('.prep-group').count(), 12, 'A coherent full foundation route stays available');
  await foundationPage.setViewportSize({ width: 390, height: 844 });
  await foundationPage.locator('.prep-group > summary').first().click();
  await foundationPage.locator('[data-prep-start="path:pre7-place-value"]').first().click(); await ready(foundationPage);
  const id = new URLSearchParams(new URL(foundationPage.url()).hash.slice(1)).get('attempt');
  assert.equal((await api(foundationPage, '/attempts/' + id)).contentId, 'pre7-place-value');
  await frame(foundationPage).locator('#answer').fill('321'); await saved(foundationPage);
  const secondDevice = await open({ width: 390, height: 844 });
  await login(secondDevice.page, origin, fourth.login, 'attempt=' + id); await ready(secondDevice.page);
  assert.equal(await frame(secondDevice.page).locator('#answer').inputValue(), '321', 'A private direct attempt link restores exact work on a second device');
  assert.equal((await api(clients[2].page, '/profile')).profile.course, 'oge');
  assert.equal((await api(clients[2].page, '/profile')).profile.goal, 'pass');

  // A curated foundation map is a starting point, not a boundary on the
  // teacher's explicit plan. Both courses must retain other catalog topics.
  for (const [index, catalogId, title, reason] of [
    [2, 'path:triangle', 'Высота и теорема Пифагора', 'Найти высоту в индивидуальной задаче'],
    [3, 'path:quadrilateral', 'Параллелограмм и трапеция', 'Связать основание и высоту перед площадью']
  ]) {
    const page = clients[index].page;
    const plan = { opId: uuid(), items: [{ catalogId, reason, priority: 'high' }], note: 'Личный следующий шаг преподавателя' };
    await api(teacher, '/teacher/students/' + pupils[index].id + '/plan', plan);
    const beforePlan = await api(page, '/rewards');
    await navigate(page, 'route'); await page.locator('[data-prep-points]').waitFor();
    const next = page.locator('.prep-next');
    await next.getByRole('heading', { name: 'Рекомендации преподавателя', exact: true }).waitFor();
    assert.equal(await next.locator('[data-prep-item]').count(), 1, 'An explicit personal plan is not replaced by a generic goal list');
    await next.getByRole('heading', { name: title, exact: true }).waitFor();
    await next.getByText(reason, { exact: true }).waitFor();
    assert.deepEqual((await api(page, '/plan')).items, plan.items);
    assert.deepEqual(await api(page, '/rewards'), beforePlan, 'Reading a teacher recommendation awards no points');
    await next.locator('[data-prep-start="' + catalogId + '"]').click(); await ready(page);
    const plannedId = new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt');
    const planned = await api(page, '/attempts/' + plannedId);
    assert.equal(planned.trainerId, 'ege-path'); assert.equal(planned.contentId, catalogId.slice('path:'.length));
    assert.equal(planned.learnerId, pupils[index].id, 'The exact recommended task opens in the intended private workspace');
    assert.doesNotMatch(await frame(page).locator('#main > .eyebrow').innerText(), /ЕГЭ|Задание\s+12/,
      'A reused managed geometry topic does not tell an OGE or foundation pupil they are taking EGE base');
  }

  const rosterBefore = (await api(teacher, '/teacher/students')).students.map(p => ({ id: p.id, profile: p.profile }));
  await navigate(teacher, 'course=oge'); await teacher.locator('[data-prep-goal-select]').waitFor();
  await teacher.locator('[data-prep-goal-select]').selectOption('grade5');
  assert.equal(await teacher.locator('[data-prep-goal]').innerText(), 'ОГЭ на 5');
  assert.deepEqual((await api(teacher, '/teacher/students')).students.map(p => ({ id: p.id, profile: p.profile })), rosterBefore,
    'Teacher course browsing does not change individual preparation goals');
}

async function verifyLongHistory({ store, page, teacher, pupil, completedId }) {
  const original = await api(page, '/attempts/' + completedId), points = await api(page, '/rewards');
  assert.equal(original.outcome, 'independent');
  const learner = store.account(pupil.id);
  // Populate genuine valid attempts in another topic, without replaying 205
  // unnecessary browser interactions. The earlier completion was earned above
  // through the real managed frame and server checker, not inserted as a grade.
  for (let seed = 5000; seed < 5205; seed++) {
    store.newAttempt(learner.id, learner.teacher_id, 'ege-path', contracts.create('ege-path', 'pre7-natural-compare', seed));
  }
  await api(teacher, '/teacher/students/' + pupil.id + '/plan', {
    opId: uuid(), items: [{ catalogId: 'path:pre7-place-value', reason: 'Вернуться к ранее решённой теме', priority: 'high' }],
    note: 'Повторение после длительной работы по другим темам'
  });
  await page.reload(); await navigate(page, 'route'); await page.locator('[data-prep-points]').waitFor();
  const recent = (await api(page, '/attempts')).attempts;
  assert.equal(recent.length, 200); assert(!recent.some(a => a.id === completedId), 'The completed topic really lies outside the recent-work window');
  const summary = (await api(page, '/progress')).progress.find(p => p.trainerId === 'ege-path' && p.contentId === 'pre7-place-value');
  assert.equal(summary.completed, true); assert.equal(summary.latest.id, completedId);
  const card = page.locator('.prep-next [data-prep-item="path:pre7-place-value"]');
  await card.waitFor(); assert.match(await card.locator('.prep-task-status').innerText(), /Решено самостоятельно/);
  assert.match(await page.locator('.prep-next > .small').innerText(), /1 из 1 тренажёров/,
    'Long-term course progress does not forget the earlier completion');
  const again = card.locator('[data-prep-start="path:pre7-place-value"]');
  assert.equal(await again.getAttribute('data-prep-fresh'), 'true'); assert.match(await again.innerText(), /Новый пример/);
  assert.deepEqual(await api(page, '/rewards'), points, 'More unfinished work and progress reads add no points');
  await again.click(); await ready(page);
  const analogueId = new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt');
  assert.notEqual(analogueId, completedId);
  const analogue = await api(page, '/attempts/' + analogueId);
  assert.equal(analogue.sourceAttemptId, completedId, 'The omitted older source is fetched and retained for the analogue');
  assert.equal(analogue.contentId, 'pre7-place-value'); assert.equal(analogue.learnerId, pupil.id);
  assert.notEqual(contracts.questionIdentity(analogue.taskSpec), contracts.questionIdentity(original.taskSpec), 'The analogue has a genuinely new condition');
  const preserved = await api(page, '/attempts/' + completedId);
  assert.deepEqual(preserved.state, original.state); assert.deepEqual(preserved.submission, original.submission);
  assert.equal(preserved.version, original.version); assert.deepEqual(await api(page, '/rewards'), points);
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
