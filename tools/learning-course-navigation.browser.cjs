'use strict';
// Local HTTP and isolated SQLite only; never uses a production pupil account.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
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
const catalog = require('../learning/catalog');
const password = 'Synthetic-course-navigation-2026';
const listen = app => new Promise(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
const close = server => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); });
const api = (page, route) => page.evaluate(route => LearningApp.api(route), route);
const courseItems = catalog.items.filter(item => item.grade7 || item.family === 'remediation');
async function navigate(page, route) {
  await page.evaluate(route => LearningApp.navigate(route), route);
  if (route.startsWith('course')) await page.locator('#catalog-grid').waitFor();
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-course-navigation-'));
  const store = new LearningStore({ filePath: path.join(tmp, 'learning.sqlite'), contracts });
  assert(store.available, 'Requires supported Node with SQLite');
  const invitedTeacher = store.bootstrap({ login: 'fixture_course_teacher', name: 'Course fixture teacher' });
  const teacher = store.activate(invitedTeacher.invitationToken, await hashPassword(password)).account;
  const invitedPupil = store.createStudent(teacher, { login: 'fixture_course_pupil', name: 'Course fixture pupil' });
  const pupil = store.activate(invitedPupil.invitationToken, await hashPassword(password, 'student')).account;
  const trainer = express(); trainer.use(express.static(ROOT));
  const trainerServer = await listen(trainer), trainerOrigin = 'http://127.0.0.1:' + trainerServer.address().port;
  const app = express(); app.use(express.json({ limit: '200kb' }));
  const server = await listen(app), origin = 'http://127.0.0.1:' + server.address().port;
  app.get('/api/learning/status', (_req, res) => res.json({ ...store.status(), trainerOrigin }));
  const learning = createLearningApi({ store, publicOrigin: origin, secureCookies: false });
  app.use('/api/learning', learning.router, createTeachingRouter(learning)); app.use(express.static(ROOT));
  let browser;
  const errors = [];
  try {
    browser = await chromium.launch({ headless: true,
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    async function login(login) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'ru-RU' });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        return ['127.0.0.1', 'localhost'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)
          ? route.continue() : route.abort();
      });
      const page = await context.newPage(); page.setDefaultTimeout(15000);
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin + '/learning/#route');
      await page.locator('[name=login]').fill(login); await page.locator('[name=password]').fill(password);
      await page.locator('#auth-form [type=submit]').click(); await page.locator('#navigation').waitFor();
      if (await page.locator('[data-mw-close]').isVisible()) await page.locator('[data-mw-close]').click();
      return page;
    }
    const page = await login(pupil.login);
    assert.equal(await page.locator('[data-nav=course]').innerText(), 'Мой курс');
    assert.equal(await page.locator('.site-link').getAttribute('href'), 'https://mathexam.space/');
    await page.locator('[data-nav=course]').click(); await page.locator('#catalog-grid').waitFor();
    async function schoolView() {
      await page.locator('#catalog-grid[data-course-scope=school]').waitFor();
      assert.equal(await page.locator('#catalog-grid').getAttribute('data-course-scope'), 'school');
      assert.equal(await page.locator('#main h1').innerText(), 'Мой курс · 7 класс');
      assert.deepEqual(await page.locator('.catalog-group h2').allTextContents(),
        ['Алгебра · Макарычев', 'Геометрия · Атанасян', 'Повторить основы']);
      assert.deepEqual(await page.locator('[data-content]').evaluateAll(nodes => nodes.map(n => n.dataset.content).sort()),
        courseItems.map(item => item.id).sort());
      assert.equal(await page.locator('[data-course-mode=exam]').count(), 0);
      assert.equal(await page.locator('#main a[href="#exam"]').count(), 0);
      assert.equal(await page.locator('[data-content="path:functions"]').count(), 0);
      assert.equal(await page.locator('#other-courses').evaluate(n => n.open), false);
      assert(!/всего номера|Задания 1–21|ЕГЭ/.test(await page.locator('#main').innerText()));
    }
    await schoolView();
    assert.equal((await api(page, '/attempts')).attempts.length, 0);
    await page.locator('#course-search').fill('биссектриса');
    assert((await page.locator('[data-content]').count()) > 0);
    for (const title of await page.locator('[data-content]').allTextContents()) assert.match(title, /биссектрис/i);
    await page.locator('#course-search').fill('логарифмы');
    assert.equal(await page.locator('[data-content]').count(), 0);
    assert.match(await page.locator('#catalog-grid').innerText(), /не найдено/);
    await page.locator('#course-search').fill('');
    await page.locator('#other-courses > summary').click();
    await page.locator('a[href="#course=ege"]').click();
    await page.locator('#catalog-grid[data-course-scope=ege]').waitFor();
    assert.equal(await page.locator('#main h1').innerText(), 'ЕГЭ · базовая математика');
    assert.equal(await page.locator('[data-content="path:functions"]').count(), 1);
    assert.equal(await page.locator('[data-content^="path:grade7-"]').count(), 0);
    await page.locator('[data-course-mode=exam]').click();
    assert.equal(await page.locator('.catalog-group').count(), 21);
    assert.equal(await page.locator('a[href="#exam"]').count(), 1);
    await page.locator('#main a[href="#course"]').click(); await schoolView();
    assert.equal((await api(page, '/attempts')).attempts.length, 0, 'Navigation and search do not create work');

    await page.locator('#course-search').fill('Минус перед выражением');
    await page.locator('[data-content="path:grade7-a-opposite-expression"]').click();
    await page.locator('#trainer-host iframe').waitFor();
    await page.waitForFunction(() => document.querySelector('#trainer-host .frame-status')?.hidden);
    const attemptId = new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt');
    await page.frameLocator('#trainer-host iframe').locator('#answer').fill('12');
    await page.waitForFunction(() => document.querySelector('#save-state')?.textContent === 'Все изменения сохранены');
    await navigate(page, 'course');
    assert.equal(await page.locator('[data-content="path:grade7-a-opposite-expression"] + small').textContent(), 'Начато');
    await page.reload(); await page.locator('#catalog-grid').waitFor(); await schoolView();
    assert.equal((await api(page, '/attempts/' + attemptId)).state.work.draft, '12');
    assert.equal((await api(page, '/attempts')).attempts.length, 1);
    const artifacts = process.env.LEARNING_BROWSER_ARTIFACTS;
    if (artifacts) { fs.mkdirSync(artifacts, { recursive: true }); await page.screenshot({ path: path.join(artifacts, 'school-course-desktop.png'), fullPage: true }); }
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    if (artifacts) { fs.mkdirSync(artifacts, { recursive: true }); await page.screenshot({ path: path.join(artifacts, 'school-course-mobile.png'), fullPage: true }); }
    await page.locator('#main a[href="#route"]').click();
    await page.locator('.study-route-panel').waitFor();

    const teacherPage = await login(teacher.login);
    await navigate(teacherPage, 'course');
    assert.equal(await teacherPage.locator('#catalog-grid').getAttribute('data-course-scope'), 'all');
    assert.equal(await teacherPage.locator('[data-content]').count(), catalog.items.length);
    assert.equal(await teacherPage.getByRole('link', { name: 'Маршрут 7 класса и повторение основ →' }).getAttribute('href'), '/grade7/');
    await teacherPage.locator('[data-course-mode=exam]').click();
    assert.equal(await teacherPage.locator('.catalog-group').count(), 21);
    await teacherPage.locator('#course-search').fill('Уравнения: сохранить');
    await teacherPage.locator('[data-content="path:equations"]').click();
    await teacherPage.locator('#assignment-form').waitFor();
    assert.equal(await teacherPage.locator('#assignment-form [name=content]').inputValue(), 'path:equations');
    await teacherPage.locator('#dialog-close').click();
    assert.equal((await api(page, '/attempts')).attempts.length, 1, 'Teacher browsing does not change pupil work');
    assert.deepEqual(errors, []);
    console.log('LEARNING_COURSE_NAVIGATION_OK: generic pupil school default, 98 school/foundation entries, explicit EGE switch, search, saved work, reload, mobile, teacher full catalogue and assignment selection');
  } finally {
    await browser?.close(); await close(server); await close(trainerServer); store.close(); fs.rmSync(tmp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
