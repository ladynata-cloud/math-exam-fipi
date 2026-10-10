'use strict';
// Synthetic credentials, local HTTP and an isolated SQLite database only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { createRequire } = require('node:module');
const ROOT = path.resolve(__dirname, '..');
const express = createRequire(path.join(ROOT, 'board-server/package.json'))('express');
const { LearningStore } = require('../board-server/learning-store');
const { createLearningApi } = require('../board-server/learning-api');
const { hashPassword, tokenHash } = require('../board-server/learning-auth');
const contracts = require('../board-server/learning-contracts');
const { chromium } = require('playwright');
const OLD_PASSWORD = 'Synthetic original teacher password';
const NEW_PASSWORD = 'Synthetic replacement teacher password';
const RECOVERED_PASSWORD = 'Synthetic recovered teacher password';
const COOKIE = 'mathexam_learning_local';

(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-teacher-browser-'));
  const store = new LearningStore({ filePath: path.join(directory, 'learning.sqlite'), contracts });
  assert(store.available);
  const teacher = store.activate(store.bootstrap({ login: 'fixture_password_teacher', name: 'Тестовый преподаватель' }).invitationToken,
    await hashPassword(OLD_PASSWORD));
  const otherTeacher = store.createSession(teacher.account.id);
  const pupil = store.createStudent(teacher.account, { login: 'fixture_password_pupil', name: 'Тестовый ученик' },
    await hashPassword('Synthetic pupil password', 'student'));
  const pupilSession = store.createSession(pupil.student.id);
  const attempt = store.newAttempt(pupil.student.id, teacher.account.id, 'fixture-trainer',
    { taskSpec: { question: 'Synthetic exercise' }, state: { answer: 'Saved pupil response' } });
  store.run('INSERT INTO events(attempt_id,actor_id,actor_role,op_id,fingerprint,revision,type,payload_json,at) VALUES(?,?,?,?,?,?,?,?,?)',
    attempt.id, pupil.student.id, 'student', 'fixture-password-event', tokenHash('fixture-password-event'), 1, 'state', '{"answer":"Saved pupil response"}', Date.now());
  const pupilSnapshot = () => ({
    account: store.account(pupil.student.id),
    sessions: store.rows('SELECT * FROM sessions WHERE account_id=? ORDER BY hash', pupil.student.id),
    attempts: store.rows('SELECT * FROM attempts ORDER BY rowid'),
    events: store.rows('SELECT * FROM events ORDER BY rowid')
  });
  const preservedPupil = pupilSnapshot();
  const app = express(); app.use(express.json({ limit: '200kb' }));
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  app.get('/api/learning/status', (_req, res) => res.json({ ...store.status(), trainerOrigin: origin }));
  const learning = createLearningApi({ store, publicOrigin: origin, secureCookies: false });
  app.use('/api/learning', learning.router); app.use(express.static(ROOT));
  const errors = [], requests = [];
  let browser;
  try {
    browser = await chromium.launch({ headless: true,
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    async function open(session) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ru-RU' });
      await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      if (session) await context.addCookies([{ name: COOKIE, value: session.sessionToken, url: origin,
        httpOnly: true, sameSite: 'Strict', expires: Math.floor(session.expiresAt / 1000) }]);
      const page = await context.newPage(); page.setDefaultTimeout(15000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => requests.push(request));
      return { context, page };
    }
    async function sessionResult(context) {
      const response = await context.request.get(origin + '/api/learning/session');
      return { status: response.status(), data: await response.json() };
    }
    const cookie = async context => (await context.cookies(origin)).find(value => value.name === COOKIE);
    const postCount = () => requests.filter(request => request.method() === 'POST').length;
    async function privatePage(page, secrets) {
      const state = await page.evaluate(() => JSON.stringify({ href: location.href, local: { ...localStorage },
        session: { ...sessionStorage }, html: document.documentElement.outerHTML }));
      for (const secret of secrets) assert(!state.includes(secret), 'Credentials must not remain in page markup, URL or browser storage');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, '390px layout fits');
    }
    async function fillPassword(page, selector, password, confirmation = password) {
      await page.locator(selector + ' [name=password]').fill(password);
      await page.locator(selector + ' [name=confirm]').fill(confirmation);
    }
    async function submitRecovery(page, password = RECOVERED_PASSWORD) {
      await fillPassword(page, '#teacher-recovery-form', password);
      const response = page.waitForResponse(response => response.url().endsWith('/teacher/password-recovery'));
      await page.locator('#teacher-recovery-form [type=submit]').click();
      return response;
    }

    const current = await open(teacher), other = await open(otherTeacher), child = await open(pupilSession);
    const { page, context } = current;
    await page.goto(origin + '/learning/?role=teacher#security'); await page.locator('#teacher-password-form').waitFor();
    assert.equal(await page.locator('#teacher-password-form input').count(), 2);
    assert.equal(await page.locator('#teacher-password-form [autocomplete=current-password]').count(), 0);
    assert.equal(await page.locator('#recovery-options').getAttribute('open'), null);
    assert.equal(await page.locator('#teacher-password-form [name=password]').getAttribute('minlength'), '12');
    await privatePage(page, [OLD_PASSWORD]);
    if (process.env.LEARNING_QA_DIR) {
      fs.mkdirSync(process.env.LEARNING_QA_DIR, { recursive: true });
      await page.evaluate(() => document.activeElement?.blur());
      await page.screenshot({ path: path.join(process.env.LEARNING_QA_DIR, 'simple-teacher-password.png'), fullPage: true });
    }
    const originalAccount = store.account(teacher.account.id), countBeforeMismatch = postCount();
    await fillPassword(page, '#teacher-password-form', NEW_PASSWORD, NEW_PASSWORD + ' mismatch');
    await page.locator('#teacher-password-form [type=submit]').click();
    await page.locator('#teacher-password-form .form-error').filter({ hasText: 'Пароли не совпадают' }).waitFor();
    assert.equal(postCount(), countBeforeMismatch); assert.deepEqual(store.account(teacher.account.id), originalAccount);

    // Commit the actual HTTP request, then lose its response. A teacher must
    // remain signed in with exactly the original cookie and expiry after reload.
    const originalCookie = await cookie(context);
    const originalSession = store.row('SELECT * FROM sessions WHERE hash=?', tokenHash(teacher.sessionToken));
    let committed = false;
    await page.route('**/api/learning/teacher/password', async route => {
      assert.deepEqual(route.request().postDataJSON(), { password: NEW_PASSWORD });
      const response = await route.fetch(); assert.equal(response.status(), 200);
      assert.equal(response.headers()['set-cookie'], undefined); committed = true; await route.abort('failed');
    });
    await fillPassword(page, '#teacher-password-form', NEW_PASSWORD);
    await page.locator('#teacher-password-form [type=submit]').click();
    await page.locator('#teacher-password-status').filter({ hasText: 'Не удалось получить подтверждение' }).waitFor();
    assert(committed); assert.equal(await page.locator('#teacher-password-form [name=password]').inputValue(), '');
    assert.equal(await page.locator('#teacher-password-form [name=confirm]').inputValue(), '');
    assert.deepEqual(await cookie(context), originalCookie);
    const surviving = store.row('SELECT * FROM sessions WHERE hash=?', tokenHash(teacher.sessionToken));
    assert.equal(surviving.expires_at, originalSession.expires_at);
    assert.equal(surviving.epoch, originalSession.epoch + 1);
    assert.equal((await sessionResult(other.context)).status, 401);
    assert.equal((await sessionResult(child.context)).data.account.id, pupil.student.id);
    assert.deepEqual(pupilSnapshot(), preservedPupil);
    await page.unroute('**/api/learning/teacher/password');
    await page.reload(); await page.locator('#teacher-password-form').waitFor();
    assert.equal((await sessionResult(context)).data.account.id, teacher.account.id);
    assert.deepEqual(await cookie(context), originalCookie); await privatePage(page, [OLD_PASSWORD, NEW_PASSWORD]);

    // A malformed successful response is also uncertain: the database commit
    // happened, although the browser cannot interpret its acknowledgement.
    await page.route('**/api/learning/teacher/password', async route => {
      const response = await route.fetch(); assert.equal(response.status(), 200);
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'unreadable acknowledgement' });
    });
    await fillPassword(page, '#teacher-password-form', NEW_PASSWORD);
    await page.locator('#teacher-password-form [type=submit]').click();
    await page.locator('#teacher-password-status').filter({ hasText: 'Не удалось получить подтверждение' }).waitFor();
    assert.equal(await page.locator('#teacher-password-form [name=password]').inputValue(), '');
    assert.deepEqual(await cookie(context), originalCookie);
    assert.equal(store.row('SELECT * FROM sessions WHERE hash=?', tokenHash(teacher.sessionToken)).expires_at, originalSession.expires_at);
    await page.unroute('**/api/learning/teacher/password');

    // The same cabinet can deliberately retry after an uncertain response.
    await fillPassword(page, '#teacher-password-form', NEW_PASSWORD);
    await page.locator('#teacher-password-form [type=submit]').click();
    await page.locator('#teacher-password-status').filter({ hasText: 'Новый пароль сохранён' }).waitFor();
    assert.deepEqual(await cookie(context), originalCookie);
    const countBeforeHide = postCount();
    await fillPassword(page, '#teacher-password-form', 'Synthetic unsaved private password');
    await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    assert.equal(await page.locator('#teacher-password-form [name=password]').inputValue(), '');
    assert.equal(await page.locator('#teacher-password-form [name=confirm]').inputValue(), '');
    assert.equal(postCount(), countBeforeHide);

    // A restored page cannot paint the old teacher cabinet while its cookie
    // now belongs to a pupil, or after another tab signed out.
    for (const replacement of [pupilSession, null]) {
      if (replacement) await context.addCookies([{ name: COOKIE, value: replacement.sessionToken, url: origin,
        httpOnly: true, sameSite: 'Strict', expires: Math.floor(replacement.expiresAt / 1000) }]);
      else await context.clearCookies();
      const staleForms = await page.evaluate(() => {
        dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
        return document.querySelectorAll('#teacher-password-form').length;
      });
      assert.equal(staleForms, 0, 'Persisted restore clears the private teacher view before checking the cookie');
      await page.locator('#auth-form').waitFor();
      assert.equal(await page.locator('#teacher-password-form,#add-student').count(), 0);
      if (replacement) assert.equal((await sessionResult(context)).data.account.id, pupil.student.id);
      else assert.equal((await sessionResult(context)).status, 401);
      await context.addCookies([originalCookie]);
      assert.deepEqual(await cookie(context), originalCookie);
      assert.equal((await sessionResult(context)).data.account.id, teacher.account.id);
      // goto the identical URL with a fragment may be a same-document visit;
      // reload explicitly to start each restored-cookie fixture from a new app.
      await page.reload(); await page.locator('#teacher-password-form').waitFor();
      await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    }

    const login = await open();
    await login.page.goto(origin + '/learning/?role=teacher'); await login.page.locator('#auth-form').waitFor();
    await login.page.getByRole('button', { name: 'Не помню пароль', exact: true }).click();
    await login.page.waitForURL(origin + '/learning/teacher-recovery.html');
    await login.page.locator('#recovery-help').waitFor({ state: 'visible' });
    await login.page.goto(origin + '/learning/?role=teacher'); await login.page.locator('#auth-form').waitFor();
    await login.page.locator('#auth-form [name=login]').fill(teacher.account.login);
    await login.page.locator('#auth-form [name=password]').fill(OLD_PASSWORD);
    const rejectedLogin = login.page.waitForResponse(response => response.url().endsWith('/api/learning/login'));
    await login.page.locator('#auth-form [type=submit]').click(); assert.equal((await rejectedLogin).status(), 401);
    await login.page.locator('#auth-form .form-error').filter({ hasText: /.+/ }).waitFor();
    await login.page.locator('#auth-form [name=password]').fill(NEW_PASSWORD);
    await login.page.locator('#auth-form [type=submit]').click(); await login.page.locator('#add-student').waitFor();
    assert.equal((await sessionResult(login.context)).data.account.id, teacher.account.id);

    // Merely opening recovery, even with a valid proof, never signs the pupil
    // out or changes credentials. Only a submitted owner-issued proof can do it.
    await child.page.goto(origin + '/learning/teacher-recovery.html');
    await child.page.locator('#recovery-help').waitFor({ state: 'visible' });
    assert.equal(await child.page.locator('#teacher-recovery-form').isVisible(), false);
    const pupilCookie = await cookie(child.context);
    async function recoveryEntry(secret) {
      const count = postCount(), before = store.account(teacher.account.id);
      await child.page.goto(origin + '/learning/teacher-recovery.html#token=' + secret);
      await child.page.locator('#teacher-recovery-form').waitFor({ state: 'visible' });
      assert.equal(new URL(child.page.url()).hash, ''); assert.equal(postCount(), count);
      assert.deepEqual(await cookie(child.context), pupilCookie); assert.deepEqual(store.account(teacher.account.id), before);
      assert.equal((await sessionResult(child.context)).data.account.id, pupil.student.id);
      await privatePage(child.page, [secret, OLD_PASSWORD, NEW_PASSWORD, RECOVERED_PASSWORD]);
    }
    const invalid = 'Z'.repeat(43);
    await recoveryEntry(invalid);
    assert.equal((await submitRecovery(child.page)).status(), 401);
    await child.page.locator('#recovery-error').filter({ hasText: 'Ссылка истекла' }).waitFor();
    assert.deepEqual(await cookie(child.context), pupilCookie);
    const expired = store.issueTeacherRecovery(teacher.account.login).invitationToken;
    store.run('UPDATE invitations SET expires_at=? WHERE hash=?', Date.now() - 1000, tokenHash(expired));
    await recoveryEntry(expired);
    assert.equal((await submitRecovery(child.page)).status(), 401);
    await child.page.locator('#recovery-error').filter({ hasText: 'Ссылка истекла' }).waitFor();
    assert.deepEqual(await cookie(child.context), pupilCookie);
    const proof = store.issueTeacherRecovery(teacher.account.login).invitationToken;
    await recoveryEntry(proof);
    await fillPassword(child.page, '#teacher-recovery-form', RECOVERED_PASSWORD, RECOVERED_PASSWORD + ' mismatch');
    const beforeRecoveryMismatch = postCount();
    await child.page.locator('#teacher-recovery-form [type=submit]').click();
    await child.page.locator('#recovery-error').filter({ hasText: 'Пароли не совпадают' }).waitFor();
    assert.equal(postCount(), beforeRecoveryMismatch);
    assert.equal((await submitRecovery(child.page)).status(), 200);
    await child.page.waitForURL(origin + '/learning/?role=teacher#students');
    await child.page.locator('#add-student').waitFor();
    const recoveredSession = await sessionResult(child.context);
    assert.equal(recoveredSession.data.account.id, teacher.account.id); assert(recoveredSession.data.csrfToken);
    assert.notEqual((await cookie(child.context)).value, pupilCookie.value);
    assert.equal((await sessionResult(context)).status, 401);
    assert.equal((await sessionResult(login.context)).status, 401);
    assert.deepEqual(pupilSnapshot(), preservedPupil);
    await privatePage(child.page, [proof, RECOVERED_PASSWORD]);

    // Reusing the consumed proof must leave a separately opened pupil cabinet
    // intact. Its saved work and original pupil session still work normally.
    const reuse = await open(pupilSession);
    await reuse.page.goto(origin + '/learning/teacher-recovery.html#token=' + proof);
    await reuse.page.locator('#teacher-recovery-form').waitFor();
    assert.equal((await submitRecovery(reuse.page)).status(), 401);
    await reuse.page.locator('#recovery-error').filter({ hasText: 'Ссылка истекла' }).waitFor();
    assert.equal((await sessionResult(reuse.context)).data.account.id, pupil.student.id);
    assert.deepEqual(pupilSnapshot(), preservedPupil);
    await privatePage(reuse.page, [proof, RECOVERED_PASSWORD]);
    for (const request of requests) {
      assert(!request.url().includes(proof)); assert(!(request.headers().referer || '').includes(proof));
      if (request.url().endsWith('/teacher/password-recovery') && request.method() === 'POST') {
        assert.equal(request.headers().referer, undefined, 'Recovery sends no Referer');
        assert.deepEqual(Object.keys(request.postDataJSON()).sort(), ['password', 'token']);
      }
    }
    assert.deepEqual(errors, []);
    console.log('LEARNING_TEACHER_PASSWORD_BROWSER_OK: simple teacher form; mismatch; real committed response loss retains cookie and expiry after reload; old password rejected/new works; other teacher sessions revoked; pupil session and work preserved; pagehide clears inputs; recovery proof scrubbed and inert on GET; invalid/expired/reused proofs rejected; submitted recovery enters teacher; no URL/storage leaks; 390px.');
  } finally {
    if (browser) await browser.close(); server.closeAllConnections();
    await new Promise(resolve => server.close(resolve)); store.close(); fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
