'use strict';
// Disposable local identities: exercise role boundaries, preserved drafts and cross-tab cookies.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { createRequire } = require('node:module');
const ROOT = path.resolve(__dirname, '..');
const serverRequire = createRequire(path.join(ROOT, 'board-server/package.json'));
const express = serverRequire('express');
const { LearningStore } = require('../board-server/learning-store');
const { createLearningApi } = require('../board-server/learning-api');
const { createTeachingRouter } = require('../board-server/learning-teaching');
const { hashPassword } = require('../board-server/learning-auth');
const contracts = require('../board-server/learning-contracts');
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'))); }
const PASSWORD = 'SyntheticRoleFixture2026';

(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-roles-'));
  const store = new LearningStore({ filePath: path.join(directory, 'learning.sqlite'), contracts });
  const app = express(); app.use(express.json());
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  const learning = createLearningApi({ store, publicOrigin: origin, secureCookies: false });
  app.use('/api/learning', learning.router); app.use('/api/learning', createTeachingRouter(learning)); app.use(express.static(ROOT));
  const passwordHash = await hashPassword(PASSWORD);
  const teacher = store.activate(store.bootstrap({ login: 'fixture_role_teacher', name: 'Учитель проверки ролей' }).invitationToken, passwordHash);
  const pupil = store.createStudent(teacher.account, { login: 'fixture_role_pupil', name: 'Ученица проверки ролей' }, passwordHash).student;
  const peer = store.createStudent(teacher.account, { login: 'fixture_role_peer', name: 'Другой ученик' }, passwordHash).student;
  store.createAssignments(teacher.account,{opId:require('node:crypto').randomUUID(),learnerIds:[peer.id],title:'PRIVATE_OTHER_ASSIGNMENT',trainerId:'ege-path',contentId:'pre7-place-value'});
  const pupilSession = store.createSession(pupil.id);
  const errors = [], mutations = [];
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ru-RU' });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await context.addCookies([{ name: 'mathexam_learning_local', value: pupilSession.sessionToken, url: origin, httpOnly: true, sameSite: 'Strict' }]);
    const page = await context.newPage(); page.setDefaultTimeout(10000); page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.method() === 'POST') mutations.push(new URL(request.url()).pathname); });
    await page.goto(origin + '/learning/#students');
    await page.locator('.role-mismatch').waitFor();
    assert.match(await page.locator('#account').innerText(), /Ученица проверки ролей/);
    assert.equal(await page.locator('#sidebar').isVisible(), false);
    assert.equal(await page.locator('[data-reset-login]').count(), 0, 'A teacher URL never renders teacher controls under a pupil account');
    assert.equal(mutations.length, 0, 'Opening a wrong-role URL never logs out or switches identity');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

    // A saved unsent draft must require a deliberate leave, even from a role mismatch.
    const draftKey = 'mathexam.learning.outbox.' + pupil.id;
    await page.evaluate(key => sessionStorage.setItem(key, JSON.stringify({ outbox: [], rejected: [{ attemptId: 'fixture-draft', body: { opId: 'fixture-op', type: 'state' } }] })), draftKey);
    await page.reload(); await page.locator('#role-switch').click();
    await page.getByRole('heading', { name: 'Есть несохранённая работа' }).waitFor();
    assert.equal((await page.evaluate(() => LearningApp.account())).id, pupil.id, 'Switching waits for a draft decision');
    await page.locator('#leave-anyway').click();
    await page.getByRole('heading', { name: 'Войти в кабинет учителя', exact: true }).waitFor();
    assert(await page.evaluate(key => sessionStorage.getItem(key), draftKey), 'The previous pupil draft remains namespaced in this tab');

    // Role intent is also enforced before the server creates a session.
    await page.locator('#auth-form [name=login]').fill(pupil.login);
    await page.locator('#auth-form [name=password]').fill(PASSWORD);
    await page.locator('#auth-form [type=submit]').click();
    await page.waitForFunction(() => document.querySelector('#auth-form .form-error')?.textContent.includes('другому кабинету'));
    assert.equal(await page.evaluate(() => LearningApp.account()), null);
    await page.locator('#auth-form [name=login]').fill('fixture_role_teacher');
    await page.locator('#auth-form [type=submit]').click();
    await page.getByRole('heading', { name: 'Мои ученики', exact: true }).waitFor();
    assert.equal((await page.evaluate(() => LearningApp.account())).id, teacher.account.id);

    await page.locator(`[data-student-access="${pupil.id}"]`).click();
    const permanent = await page.locator('#student-entry-link').inputValue();
    assert.equal(new URL(permanent).searchParams.get('role'), 'student');
    assert.equal(new URL(permanent).hash, '#login=' + pupil.login);
    const beforeCopy = mutations.length;
    await page.locator('#copy-student-entry').click();
    assert.equal(mutations.length, beforeCopy, 'Copying existing entry information never resets access');
    await page.locator('#dialog-close').click();

    const beforePreview = mutations.length;
    await page.locator(`a[href="#preview=${pupil.id}"]`).click();
    await page.locator('.preview-banner').waitFor();
    assert.match(await page.locator('#account').innerText(), /Учитель проверки ролей/);
    assert.match(await page.locator('main').innerText(), /Ученица проверки ролей/);
    assert(!(await page.locator('main').innerText()).includes(peer.name));
    assert.equal(await page.locator('main button,input,iframe').count(), 0, 'Pupil preview has no solving or editing controls');
    assert.equal(mutations.length, beforePreview, 'Preview performs reads only');
    assert.equal((await page.evaluate(() => LearningApp.api('/session'))).account.id, teacher.account.id);
    await page.getByRole('link', { name: 'Вернуться к ученикам', exact: true }).click();
    await page.getByRole('heading', { name: 'Мои ученики', exact: true }).waitFor();

    // Simulate the browser cookie exchanged by another tab. The focused tab must
    // conceal the old view, reread identity and block the retained teacher intent.
    const replacement = store.createSession(pupil.id);
    await context.addCookies([{ name: 'mathexam_learning_local', value: replacement.sessionToken, url: origin, httpOnly: true, sameSite: 'Strict' }]);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.locator('.role-mismatch').waitFor();
    await page.locator('#identity-check').waitFor({ state: 'hidden' });
    assert.match(await page.locator('#account').innerText(), /Ученица проверки ролей/);
    assert(!(await page.locator('main').innerText()).includes(peer.name));
    assert.equal(await page.locator('[data-student-access]').count(), 0);

    // A pupil invitation opened under an active teacher cannot replace the teacher.
    const pending = store.createStudent(teacher.account, { login: 'fixture_role_pending', name: 'Ожидающий ученик' });
    const teacherSession = store.createSession(teacher.account.id);
    await context.addCookies([{ name: 'mathexam_learning_local', value: teacherSession.sessionToken, url: origin, httpOnly: true, sameSite: 'Strict' }]);
    await page.evaluate(() => LearningApp.synchronizeAccount());
    await page.getByRole('heading', { name: 'Мои ученики', exact: true }).waitFor();
    await page.goto(origin + '/learning/?role=teacher#invite=' + pending.invitationToken);
    await page.getByRole('heading', { name: 'Мои ученики', exact: true }).waitFor();
    assert.equal((await page.evaluate(() => LearningApp.account())).id, teacher.account.id);
    await page.waitForFunction(() => document.querySelector('#notice')?.textContent.includes('сначала выйдите'));
    assert(!page.url().includes(pending.invitationToken));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    // Every identity-adoption path clears the old cache even if the new account's
    // data refresh fails. No teacher assignments may reappear on a later hash route.
    for (const transition of ['login-hint', 'quick-link', 'logout-login']) {
      const ownerSession = store.createSession(teacher.account.id);
      await context.addCookies([{ name: 'mathexam_learning_local', value: ownerSession.sessionToken, url: origin, httpOnly: true, sameSite: 'Strict' }]);
      await page.goto(origin + '/learning/?role=teacher#assignments');
      await page.getByText('PRIVATE_OTHER_ASSIGNMENT', { exact: true }).waitFor();
      if (transition === 'logout-login') {
        await page.locator('#logout').click();
        await page.locator('#auth-form').waitFor();
        await page.evaluate(() => { history.replaceState(null, '', '/learning/?role=student'); });
      } else {
        const changed = store.createSession(pupil.id);
        await context.addCookies([{ name: 'mathexam_learning_local', value: changed.sessionToken, url: origin, httpOnly: true, sameSite: 'Strict' }]);
      }
      await page.route('**/api/learning/attempts', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'FIXTURE_OFFLINE' }) }));
      if (transition === 'logout-login') {
        await page.locator('#auth-form [name=login]').fill(pupil.login);
        await page.locator('#auth-form [name=password]').fill(PASSWORD);
        await page.locator('#auth-form [type=submit]').click();
      } else {
        await page.evaluate(({ transition, login }) => { location.hash = transition === 'login-hint' ? 'login=' + login : 'quick=' + 'A'.repeat(43); }, { transition, login: pupil.login });
      }
      await page.getByRole('heading', { name: 'Не удалось загрузить кабинет', exact: true }).waitFor();
      assert.equal((await page.evaluate(() => LearningApp.account())).id, pupil.id);
      await page.evaluate(() => { history.replaceState(null, '', '/learning/?role=student'); LearningApp.navigate('assignments'); });
      await page.waitForFunction(() => !document.querySelector('main')?.textContent.includes('Открываем работу'));
      assert(!(await page.locator('main').innerText()).includes('PRIVATE_OTHER_ASSIGNMENT'), transition + ' must clear another account cache before failed refresh');
      assert(!(await page.locator('main').innerText()).includes(peer.name));
      await page.unroute('**/api/learning/attempts');
    }
    assert.deepEqual(errors, []);
    console.log('LEARNING_ROLE_NAVIGATION_BROWSER_OK: wrong-role URL; explicit role login; draft-preserving switch; permanent entry copy; read-only teacher preview; cross-tab identity fence; invitation preserves account; 390px.');
  } finally {
    if (browser) await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); store.close(); fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
