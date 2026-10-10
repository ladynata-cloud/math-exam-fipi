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
const NEW_PASSWORD = '0173';
const RECOVERED_PASSWORD = '0269';
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
    // Existing accounts keep their previous long passwords until explicitly changed.
    const legacyLogin = await open();
    await legacyLogin.page.goto(origin + '/learning/?role=teacher');
    await legacyLogin.page.locator('#auth-form [name=login]').fill(teacher.account.login);
    await legacyLogin.page.locator('#auth-form [name=password]').fill(OLD_PASSWORD);
    await legacyLogin.page.locator('#auth-form [type=submit]').click();
    await legacyLogin.page.locator('#add-student').waitFor();
    assert.equal((await sessionResult(legacyLogin.context)).data.account.id, teacher.account.id);
    assert.equal(await legacyLogin.page.locator('#teacher-password-form').count(), 0,
      'Legacy login opens the cabinet without forcing a code change');
    await legacyLogin.context.close();
    const { page, context } = current;
    await page.goto(origin + '/learning/?role=teacher#security'); await page.locator('#teacher-password-form').waitFor();
    assert.equal(await page.locator('#teacher-password-form input').count(), 2);
    assert.equal(await page.locator('#teacher-password-form [autocomplete=current-password]').count(), 0);
    assert.equal(await page.locator('#recovery-options').getAttribute('open'), null);
    for (const input of await page.locator('#teacher-password-form input').all()) {
      assert.equal(await input.getAttribute('minlength'), '4');
      assert.equal(await input.getAttribute('maxlength'), '4');
      assert.equal(await input.getAttribute('pattern'), '[0-9]{4}');
      assert.equal(await input.getAttribute('inputmode'), 'numeric');
    }
    await privatePage(page, [OLD_PASSWORD]);
    if (process.env.LEARNING_QA_DIR) {
      fs.mkdirSync(process.env.LEARNING_QA_DIR, { recursive: true });
      await page.evaluate(() => document.activeElement?.blur());
      await page.screenshot({ path: path.join(process.env.LEARNING_QA_DIR, 'simple-teacher-password.png'), fullPage: true });
    }
    const originalAccount = store.account(teacher.account.id), countBeforeMismatch = postCount();
    await fillPassword(page, '#teacher-password-form', NEW_PASSWORD, '0284');
    await page.locator('#teacher-password-form [type=submit]').click();
    await page.locator('#teacher-password-form .form-error').filter({ hasText: 'Коды не совпадают' }).waitFor();
    assert.equal(postCount(), countBeforeMismatch); assert.deepEqual(store.account(teacher.account.id), originalAccount);
    await fillPassword(page, '#teacher-password-form', '017');
    await page.locator('#teacher-password-form [type=submit]').click();
    assert.equal(await page.locator('#teacher-password-form [name=password]').evaluate(input => input.validity.valid), false);
    assert.equal(postCount(), countBeforeMismatch, 'A three-digit code is rejected before any request');
    await page.route('**/api/learning/teacher/password', route => route.fulfill({ status: 503,
      contentType: 'application/json', body: JSON.stringify({ error: 'LEARNING_STORAGE_UNAVAILABLE' }) }));
    await fillPassword(page, '#teacher-password-form', NEW_PASSWORD);
    await page.locator('#teacher-password-form [type=submit]').click();
    await page.locator('#teacher-password-status').filter({ hasText: 'Не удалось получить подтверждение' }).waitFor();
    await page.waitForFunction(() => document.querySelector('#teacher-password-form [type=submit]')?.disabled === false);
    assert.equal(await page.locator('#teacher-password-form [type=submit]').isDisabled(), false);
    assert.equal(await page.locator('#teacher-password-success').count(), 0, 'A rejected request cannot show saved success');
    assert.deepEqual(store.account(teacher.account.id), originalAccount);
    await page.unroute('**/api/learning/teacher/password');

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
    assert.equal(await page.locator('#teacher-password-success').count(), 0, 'A lost acknowledgement remains retryable, not successful');
    assert.equal(await page.locator('#teacher-password-form [type=submit]').isDisabled(), false);
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
    for (const responseBody of ['unreadable acknowledgement', '{}']) {
      await page.route('**/api/learning/teacher/password', async route => {
        const response = await route.fetch(); assert.equal(response.status(), 200);
        await route.fulfill({ status: 200, contentType: 'application/json', body: responseBody });
      });
      await fillPassword(page, '#teacher-password-form', NEW_PASSWORD);
      await page.locator('#teacher-password-form [type=submit]').click();
      await page.locator('#teacher-password-status').filter({ hasText: 'Не удалось получить подтверждение' }).waitFor();
      assert.equal(await page.locator('#teacher-password-success').count(), 0, 'Malformed acknowledgement cannot dismiss the form');
      assert.equal(await page.locator('#teacher-password-form [name=password]').inputValue(), '');
      assert.equal(await page.locator('#teacher-password-form [type=submit]').isDisabled(), false);
      assert.deepEqual(await cookie(context), originalCookie);
      assert.equal(store.row('SELECT * FROM sessions WHERE hash=?', tokenHash(teacher.sessionToken)).expires_at, originalSession.expires_at);
      await page.unroute('**/api/learning/teacher/password');
    }

    // The same cabinet can deliberately retry after an uncertain response.
    const beforeSuccess = postCount();
    await fillPassword(page, '#teacher-password-form', NEW_PASSWORD);
    await page.locator('#teacher-password-form [type=submit]').click();
    await page.locator('#teacher-password-success').filter({ hasText: 'Код входа сохранён' }).waitFor();
    assert.equal(await page.locator('#teacher-password-form').count(), 0, 'Saving removes the completed form');
    assert.equal(await page.getByRole('heading', { name: /Задать новый/ }).count(), 0,
      'Saving never leaves an instruction to set the code again');
    assert.equal(await page.locator('#teacher-password-success').getAttribute('role'), 'status');
    assert.equal(await page.locator('#teacher-password-students').getAttribute('href'), '#students');
    assert.match(await page.locator('#teacher-password-students').innerText(), /^Мои ученики/);
    assert.equal(postCount(), beforeSuccess + 1, 'A successful save sends one POST');
    await page.evaluate(() => LearningApp.refresh());
    await page.locator('#teacher-password-success').waitFor();
    assert.equal(await page.locator('#teacher-password-form').count(), 0, 'Rerender preserves completion');
    await page.keyboard.press('Enter');
    assert.equal(postCount(), beforeSuccess + 1, 'Rerender and Enter do not resubmit the saved code');
    assert.deepEqual(await cookie(context), originalCookie);
    await privatePage(page, [OLD_PASSWORD, NEW_PASSWORD]);
    await page.locator('#teacher-password-students').click();
    await page.getByRole('heading', { name: 'Мои ученики', exact: true }).waitFor();
    assert.equal(await page.locator('#teacher-password-form').count(), 0);
    await page.locator('[data-nav=security]').click();
    await page.locator('#teacher-password-form').waitFor();
    assert.equal(await page.locator('#teacher-password-success').count(), 0,
      'Only an explicit return to code settings offers another change');
    const countBeforeHide = postCount();
    await fillPassword(page, '#teacher-password-form', '0381');
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
    await login.page.getByRole('button', { name: 'Не помню код входа', exact: true }).click();
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
    await fillPassword(child.page, '#teacher-recovery-form', RECOVERED_PASSWORD, '0395');
    const beforeRecoveryMismatch = postCount();
    await child.page.locator('#teacher-recovery-form [type=submit]').click();
    await child.page.locator('#recovery-error').filter({ hasText: 'Коды не совпадают' }).waitFor();
    assert.equal(postCount(), beforeRecoveryMismatch);
    assert.equal((await submitRecovery(child.page)).status(), 200);
    await child.page.waitForURL(origin + '/learning/?role=teacher#students');
    await child.page.locator('#add-student').waitFor();
    assert.equal(await child.page.locator('#teacher-password-form,#teacher-recovery-form').count(), 0,
      'Completed recovery enters the cabinet without asking for another code');
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
    console.log('LEARNING_TEACHER_PASSWORD_BROWSER_OK: four-digit leading-zero setup; legacy long login; mismatch/short/rejected/lost/malformed retries; saved success removes form, survives rerender and sends one POST; My pupils next step; committed response loss retains cookie and expiry after reload; old password rejected/new works; other teacher sessions revoked; pupil session and work preserved; pagehide clears inputs; recovery proof scrubbed and inert on GET; invalid/expired/reused proofs rejected; recovery enters cabinet without reset; no URL/storage leaks; 390px.');
  } finally {
    if (browser) await browser.close(); server.closeAllConnections();
    await new Promise(resolve => server.close(resolve)); store.close(); fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
