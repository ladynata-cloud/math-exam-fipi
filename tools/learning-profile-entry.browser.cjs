'use strict';

// Synthetic accounts, real local HTTP routes and disposable SQLite only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const ROOT = path.resolve(__dirname, '..');
const serverRequire = createRequire(path.join(ROOT, 'board-server/package.json'));
const express = serverRequire('express');
const { LearningStore } = require('../board-server/learning-store');
const { createLearningApi } = require('../board-server/learning-api');
const { createTeachingRouter } = require('../board-server/learning-teaching');
const { createFamilyRouter } = require('../board-server/learning-family');
const { hashPassword } = require('../board-server/learning-auth');
const contracts = require('../board-server/learning-contracts');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (_) { ({ chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'))); }
const PASSWORD = 'Synthetic-profile-entry-2026';
const COURSE = 'https://mathexam.space/ege-profil/start/index.html';
const FOCUS = 'Начни с дробей. Затем повтори тригонометрический круг. <b>Это текст</b>';
const listen = app => new Promise(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
const close = server => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); });
const api = (page, route, body) => page.evaluate(({ route, body }) => LearningApp.api(route,
  body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }), { route, body });
const navigate = (page, route) => page.evaluate(route => LearningApp.navigate(route), route);

(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-profile-entry-'));
  const store = new LearningStore({ filePath: path.join(directory, 'learning.sqlite'), contracts });
  assert(store.available, 'Requires the supported Node runtime with SQLite');
  const invitation = store.bootstrap({ login: 'fixture_profile_teacher', name: 'Проверочный преподаватель' });
  const teacher = store.activate(invitation.invitationToken, await hashPassword(PASSWORD)).account;
  async function pupil(login) {
    const created = store.createStudent(teacher, { login, name: 'Проверочный ученик' });
    return store.activate(created.invitationToken, await hashPassword(PASSWORD, 'student')).account;
  }
  const learner = await pupil('fixture_profile_pupil'), peer = await pupil('fixture_unchanged_pupil'), returning = await pupil('fixture_returning_pupil');
  const trainer = express(); trainer.use(express.static(ROOT));
  const trainerServer = await listen(trainer), trainerOrigin = 'http://127.0.0.1:' + trainerServer.address().port;
  const app = express(); app.use(express.json({ limit: '200kb' }));
  const server = await listen(app), origin = 'http://127.0.0.1:' + server.address().port;
  app.get('/api/learning/status', (_req, res) => res.json({ ...store.status(), trainerOrigin }));
  const learning = createLearningApi({ store, publicOrigin: origin, secureCookies: false });
  app.use('/api/learning', createFamilyRouter({ ...learning, publicOrigin: origin, secureCookies: false }), learning.router, createTeachingRouter(learning));
  app.use(express.static(ROOT));
  const errors = [], external = [];
  let browser;
  try {
    browser = await chromium.launch({ headless: true,
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM_EXECUTABLE,
      args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    async function open() {
      const context = await browser.newContext({ viewport: { width: 1365, height: 980 }, locale: 'ru-RU' });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (['127.0.0.1', 'localhost'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
        external.push(url.origin + url.pathname); return route.abort();
      });
      const page = await context.newPage(); page.setDefaultTimeout(15000);
      page.on('pageerror', error => errors.push(error.message));
      return page;
    }
    async function login(person) {
      const page = await open();
      await page.goto(origin + '/learning/');
      await page.locator('#auth-form [name=login]').fill(person.login);
      await page.locator('#auth-form [name=password]').fill(PASSWORD);
      await page.locator('#auth-form [type=submit]').click();
      await page.locator('#navigation').waitFor();
      if (await page.locator('[data-mw-close]').isVisible()) await page.locator('[data-mw-close]').click();
      return page;
    }
    const tp = await login(teacher);
    await navigate(tp, 'student=' + learner.id);
    await tp.locator('#teaching-profile').waitFor();
    await tp.locator('#teaching-profile [name=course]').selectOption('ege-profile');
    assert.equal(await tp.locator('[data-profile-goal]').isVisible(), false);
    assert.equal(await tp.locator('[data-profile-entry-note]').isVisible(), true);
    await tp.locator('#teaching-profile [name=focus]').fill(FOCUS);
    await tp.locator('#teaching-profile [type=submit]').click();
    await tp.waitForFunction(() => document.querySelector('[data-profile-status]')?.textContent.includes('сохранены'));
    assert.equal(await tp.locator('[data-ege-positions]').isVisible(), false);
    const stored = (await api(tp, '/teacher/students/' + learner.id + '/profile')).profile;
    assert.equal(stored.course, 'ege-profile'); assert.equal(stored.goal, null); assert.equal(stored.focus, FOCUS);
    assert.equal((await api(tp, '/teacher/students/' + peer.id + '/profile')).profile.course, 'school');

    const sp = await login(learner);
    async function entry(page, personal = true) {
      await page.locator('[data-profile-course]').waitFor();
      assert.equal(await page.locator('#main h1').innerText(), 'ЕГЭ · профильная математика');
      assert.equal(await page.getByRole('link', { name: 'Начать подготовку →', exact: true }).getAttribute('href'), COURSE + '#calm');
      assert.equal(await page.getByRole('link', { name: 'Проверить, что повторить', exact: true }).getAttribute('href'), COURSE + '#readiness');
      const text = await page.locator('#main').innerText();
      assert.match(text, /самостоятельно решать все 13 заданий/);
      assert.match(text, /Просто бери и решай! Всё получится\)/);
      assert.match(text, /Решения в этом курсе пока сохраняются в браузере\./);
      assert(!/№1–21|Задания 1–21|Вариант из 21|Мой курс · 7 класс|на другом устройстве/.test(text));
      assert.equal(await page.locator('#main a[href="#exam"]').count(), 0);
      assert.equal(await page.locator('#main a[href="#diagnostic"]').count(), 0);
      if (personal) {
        assert.equal(await page.locator('.profile-focus p').innerText(), FOCUS);
        assert.equal(await page.locator('.profile-focus b').count(), 0, 'The teacher comment remains escaped text');
      }
    }
    await entry(sp);
    for (const route of ['route', 'course', 'home']) { await navigate(sp, route); await entry(sp); }
    await sp.reload(); await entry(sp);
    await sp.setViewportSize({ width: 390, height: 844 });
    assert(await sp.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Profile entry fits a phone');
    await entry(sp);
    const secondDevice = await login(learner); await entry(secondDevice);
    assert.equal((await api(sp, '/attempts')).attempts.length, 0, 'Opening the external course entry fabricates no cabinet result');

    await navigate(tp, 'students');
    await tp.locator('[data-assign-student="' + learner.id + '"]').click();
    await tp.locator('#assignment-form').waitFor();
    assert.equal(await tp.locator('#assignment-form [name=course]').inputValue(), 'all', 'Profile pupil must not fall back to the OGE/foundation assignment catalogue');
    assert.equal(await tp.locator('#assignment-form [name=course] option[value="ege-profile"]').count(), 0, 'External profile course is not presented as cabinet-saved assignments');
    assert.equal(await tp.locator('#assignment-form [name=content] option').count(), await tp.evaluate(() => LearningCatalog.items.length));
    await tp.locator('#dialog-close').click();
    await navigate(tp, 'course'); await tp.locator('#catalog-grid').waitFor();
    await tp.locator('a[href="#course=ege-profile"]').click(); await entry(tp, false);

    const metadata = '/teacher/students/' + learner.id + '/parent-access';
    const parentInvite = await api(tp, metadata, { name: 'Проверочный родитель', expectedVersion: (await api(tp, metadata)).parentAccess.version });
    const pp = await open();
    await pp.goto(origin + '/learning/parent.html#invite=' + parentInvite.invitationToken);
    await pp.locator('#parent-auth-form [name=password]').fill(PASSWORD);
    await pp.locator('#parent-auth-form [name=confirm]').fill(PASSWORD);
    await pp.locator('#parent-auth-form [type=submit]').click(); await pp.locator('#parent-overview').waitFor();
    assert.match(await pp.locator('#parent-overview').innerText(), /ЕГЭ · профильная математика/);
    assert.match(await pp.locator('[data-profile-storage]').innerText(), /не входят в итоги ниже/);
    assert.equal(await pp.locator('[data-parent-count=total]').innerText(), '0');

    // A free started task stays reachable after the teacher changes direction.
    // It has neither a homework assignment nor a lesson link to fall back to.
    const rp = await login(returning);
    await navigate(rp, 'course'); await rp.locator('#catalog-grid[data-course-scope=school]').waitFor();
    await rp.locator('#course-search').fill('Минус перед выражением');
    await rp.locator('[data-content="path:grade7-a-opposite-expression"]').click();
    await rp.waitForFunction(() => document.querySelector('#trainer-host .frame-status')?.hidden);
    const oldAttemptId = new URLSearchParams(new URL(rp.url()).hash.slice(1)).get('attempt');
    const frame = rp.frameLocator('#trainer-host iframe');
    await frame.locator('#answer').fill('12');
    await rp.waitForFunction(async id => (await LearningApp.api('/attempts/' + id)).state.work.draft === '12', oldAttemptId);
    const oldWork = await api(rp, '/attempts/' + oldAttemptId);
    assert.equal(oldWork.outcome, 'started');
    assert.equal((await api(rp, '/assignments')).assignments.length, 0);
    assert.equal((await api(rp, '/lessons')).lessons.length, 0);
    await api(tp, '/teacher/students/' + returning.id + '/profile', { opId: crypto.randomUUID(), expectedVersion: 0,
      course: 'ege-profile', goal: null, focus: '' });
    await navigate(rp, 'home'); await rp.reload(); await entry(rp, false);
    const oldLink = rp.locator('[data-profile-prior-work] a[href="#attempt=' + oldAttemptId + '"]');
    assert.equal(await oldLink.isVisible(), true, 'The old free task remains discoverable on the profile home');
    assert.match(await oldLink.innerText(), /Продолжить/);
    await oldLink.click();
    await rp.waitForFunction(() => document.querySelector('#trainer-host .frame-status')?.hidden);
    assert.equal(await frame.locator('#answer').inputValue(), '12', 'The previous draft is restored');
    assert.deepEqual((await api(rp, '/attempts/' + oldAttemptId)).state, oldWork.state);
    await frame.locator('#answer').fill('13');
    await rp.waitForFunction(async id => (await LearningApp.api('/attempts/' + id)).state.work.draft === '13', oldAttemptId);
    assert.equal((await api(rp, '/attempts')).attempts.length, 1, 'Continuing edits the same work, not a fresh task');

    // The existing four directions keep their own views when selected explicitly.
    const unchanged = await login(peer);
    const cases = [
      ['school', '#catalog-grid[data-course-scope=school]', /Мой курс · 7 класс/],
      ['ege', '#catalog-grid[data-course-scope=ege]', /ЕГЭ · базовая математика/],
      ['oge', '.preparation', /ОГЭ/],
      ['foundations', '.preparation', /Математические основы/]
    ];
    for (const [course, selector, heading] of cases) {
      const before = (await api(tp, '/teacher/students/' + peer.id + '/profile')).profile;
      await api(tp, '/teacher/students/' + peer.id + '/profile', { opId: crypto.randomUUID(), expectedVersion: before.version,
        course, goal: course === 'oge' ? 'pass' : null, focus: '' });
      await unchanged.goto(origin + '/learning/#course'); await unchanged.reload(); await unchanged.locator(selector).waitFor();
      assert.match(await unchanged.locator('#main h1').innerText(), heading);
      assert.equal(await unchanged.locator('[data-profile-course]').count(), 0);
    }
    assert.deepEqual(errors, []); assert.deepEqual(external, []);
    console.log('LEARNING_PROFILE_ENTRY_OK: real profile save, separate pupils, 13-task home/course/route, focus escaping, phone/reload/second device, honest local progress, teacher assignment fallback, parent view, free started work survives course change, four existing directions');
  } finally {
    await browser?.close(); await close(server); await close(trainerServer); store.close(); fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
