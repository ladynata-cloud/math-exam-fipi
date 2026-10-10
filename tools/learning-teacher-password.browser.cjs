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
    const passwordPosts = () => requests.filter(request => request.method() === 'POST'
      && request.url().endsWith('/api/learning/teacher/password')).length;
    async function outcome(kind) {
      const panel = page.locator('#teacher-password-' + kind);
      await panel.waitFor();
      assert.equal(await page.locator('#teacher-password-form,#recovery-rotate-form').count(), 0,
        'A summary or outcome never asks for another code implicitly');
      assert.equal(await page.locator('#main input,#main textarea').count(), 0, 'Outcome views contain no credential inputs');
      assert.equal(await page.locator('#teacher-password-students').getAttribute('href'), '#students');
      if (kind !== 'success') assert.equal(await page.locator('#teacher-password-success').count(), 0,
        'A neutral or unknown outcome cannot claim successful saving');
      await privatePage(page, [OLD_PASSWORD, NEW_PASSWORD]);
      return panel.innerText();
    }
    async function editor(action = 'change') {
      const before = passwordPosts();
      await page.locator('#teacher-password-' + action).click();
      await page.locator('#teacher-password-form').waitFor();
      assert.equal(passwordPosts(), before, 'Opening an explicit editor does not send a credential request');
      for (const input of await page.locator('#teacher-password-form input').all()) {
        assert.equal(await input.inputValue(), '', 'A retry requires re-entering the code; no PIN is retained');
      }
    }
    async function failedLogout() {
      const before = passwordPosts();
      await page.route('**/api/learning/logout', route => route.fulfill({ status: 503,
        contentType: 'application/json', body: JSON.stringify({ error: 'LEARNING_STORAGE_UNAVAILABLE' }) }), { times: 1 });
      const response = page.waitForResponse(response => response.url().endsWith('/api/learning/logout'));
      await page.locator('#logout').click();
      assert.equal((await response).status(), 503);
      await page.waitForFunction(() => document.querySelector('#logout')?.disabled === false);
      assert.equal((await sessionResult(context)).data.account.id, teacher.account.id,
        'A failed logout keeps the same authenticated teacher');
      assert.equal(passwordPosts(), before, 'A failed logout never changes the code');
    }
    async function stableOutcome(kind) {
      const before = passwordPosts(), text = await outcome(kind);
      await page.evaluate(() => LearningApp.refresh());
      assert.equal(await outcome(kind), text, 'Rerender preserves the known outcome');
      await page.keyboard.press('Enter');
      await page.locator('#teacher-password-students').click();
      await page.getByRole('heading', { name: 'Мои ученики', exact: true }).waitFor();
      await page.locator('[data-nav=security]').click();
      assert.equal(await outcome(kind), text, 'Returning from pupils preserves the outcome, without reopening code setup');
      const restored = page.waitForResponse(response => response.url().endsWith('/api/learning/session'));
      await page.evaluate(() => {
        dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
        dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
      });
      await restored;
      assert.equal(await outcome(kind), text, 'Same-account bfcache restoration preserves nonsecret feedback');
      assert.equal(passwordPosts(), before, 'Rerender, Enter, revisit and bfcache never repeat a credential POST');
      return text;
    }

    await page.goto(origin + '/learning/?role=teacher#security');
    await outcome('summary');
    const beforeNeutralReload = passwordPosts();
    await page.reload(); await outcome('summary');
    assert.equal(passwordPosts(), beforeNeutralReload, 'Reload is neutral and never changes a code');
    await failedLogout();
    await outcome('summary');
    await editor();
    await fillPassword(page, '#teacher-password-form', '0381');
    await failedLogout();
    await page.locator('#teacher-password-cancel').click();
    await outcome('summary');
    await editor();
    assert.equal(await page.locator('#teacher-password-form input').count(), 2);
    assert.equal(await page.locator('#teacher-password-form [autocomplete=current-password]').count(), 0);
    assert.equal(await page.locator('#recovery-options').getAttribute('open'), null);
    for (const input of await page.locator('#teacher-password-form input').all()) {
      assert.equal(await input.getAttribute('minlength'), '4');
      assert.equal(await input.getAttribute('maxlength'), '4');
      assert.equal(await input.getAttribute('pattern'), '[0-9]{4}');
      assert.equal(await input.getAttribute('inputmode'), 'numeric');
    }
    if (process.env.LEARNING_QA_DIR) {
      fs.mkdirSync(process.env.LEARNING_QA_DIR, { recursive: true });
      await page.evaluate(() => document.activeElement?.blur());
      await page.screenshot({ path: path.join(process.env.LEARNING_QA_DIR, 'simple-teacher-password.png'), fullPage: true });
    }
    const originalAccount = store.account(teacher.account.id), countBeforeMismatch = passwordPosts();
    await fillPassword(page, '#teacher-password-form', NEW_PASSWORD, '0284');
    await page.locator('#teacher-password-form [type=submit]').click();
    await page.locator('#teacher-password-form .form-error').filter({ hasText: 'Коды не совпадают' }).waitFor();
    assert.equal(passwordPosts(), countBeforeMismatch); assert.deepEqual(store.account(teacher.account.id), originalAccount);
    await fillPassword(page, '#teacher-password-form', '017');
    await page.locator('#teacher-password-form [type=submit]').click();
    assert.equal(await page.locator('#teacher-password-form [name=password]').evaluate(input => input.validity.valid), false);
    assert.equal(passwordPosts(), countBeforeMismatch, 'A three-digit code is rejected before any request');

    // A known server validation rejection is editable, and is never described
    // as saved or uncertain. No database mutation occurred.
    await page.route('**/api/learning/teacher/password', route => route.fulfill({ status: 400,
      contentType: 'application/json', body: JSON.stringify({ error: 'LEARNING_PASSWORD_INVALID' }) }));
    await fillPassword(page, '#teacher-password-form', NEW_PASSWORD);
    await page.locator('#teacher-password-form [type=submit]').click();
    await page.locator('#teacher-password-form .form-error').filter({ hasText: 'ровно 4 цифры' }).waitFor();
    await page.waitForFunction(() => document.querySelector('#teacher-password-form [type=submit]')?.disabled === false);
    assert.equal(await page.locator('#teacher-password-success,#teacher-password-uncertain').count(), 0);
    assert.deepEqual(store.account(teacher.account.id), originalAccount);
    await page.unroute('**/api/learning/teacher/password');

    // The browser cannot distinguish a request that never reached the server
    // from a committed request whose acknowledgement was lost.
    const originalCookie = await cookie(context);
    const originalSession = store.row('SELECT * FROM sessions WHERE hash=?', tokenHash(teacher.sessionToken));
    await page.route('**/api/learning/teacher/password', route => route.abort('failed'));
    await fillPassword(page, '#teacher-password-form', NEW_PASSWORD);
    await page.locator('#teacher-password-form [type=submit]').click();
    const uncommittedText = await stableOutcome('uncertain');
    assert.match(uncommittedText, /Сохранение не подтверждено/);
    assert.match(uncommittedText, /неизвестно, сохранился ли код/);
    if (process.env.LEARNING_QA_DIR) await page.screenshot({
      path: path.join(process.env.LEARNING_QA_DIR, 'teacher-code-unknown-result.png'), fullPage: true });
    assert.deepEqual(store.account(teacher.account.id), originalAccount, 'An aborted request before fetch has not changed the database');
    assert.deepEqual(await cookie(context), originalCookie);
    await page.unroute('**/api/learning/teacher/password');
    await editor('retry');
    assert.match(await page.locator('#main').innerText(), /тот же|этот же/i, 'Retry explicitly asks for the same code');
    await page.locator('#teacher-password-cancel').click();
    assert.equal(await outcome('uncertain'), uncommittedText, 'Cancelling retry returns to the honest previous outcome');
    await editor('retry');

    // Rejecting this retry does not establish whether the earlier request
    // committed. Cancelling must preserve that original unknown outcome.
    const beforeRejectedRetry = passwordPosts();
    await page.route('**/api/learning/teacher/password', route => route.fulfill({ status: 400,
      contentType: 'application/json', body: JSON.stringify({ error: 'LEARNING_PASSWORD_INVALID' }) }));
    await fillPassword(page, '#teacher-password-form', NEW_PASSWORD);
    await page.locator('#teacher-password-form [type=submit]').click();
    await page.locator('#teacher-password-form .form-error').filter({ hasText: 'ровно 4 цифры' }).waitFor();
    assert.equal(passwordPosts(), beforeRejectedRetry + 1);
    assert.deepEqual(store.account(teacher.account.id), originalAccount);
    await page.locator('#teacher-password-cancel').click();
    assert.equal(await outcome('uncertain'), uncommittedText, 'A rejected retry cannot resolve the earlier unknown result');
    assert.equal(passwordPosts(), beforeRejectedRetry + 1, 'Cancel never retries the rejected request');
    await page.unroute('**/api/learning/teacher/password');
    await editor('retry');

    let committed = false;
    await page.route('**/api/learning/teacher/password', async route => {
      assert.deepEqual(route.request().postDataJSON(), { password: NEW_PASSWORD });
      const response = await route.fetch(); assert.equal(response.status(), 200);
      assert.equal(response.headers()['set-cookie'], undefined); committed = true; await route.abort('failed');
    });
    await fillPassword(page, '#teacher-password-form', NEW_PASSWORD);
    await page.locator('#teacher-password-form [type=submit]').click();
    assert.equal(await stableOutcome('uncertain'), uncommittedText,
      'Committed and uncommitted network failures show the same honest unknown outcome');
    assert(committed); assert.notDeepEqual(store.account(teacher.account.id), originalAccount);
    assert.deepEqual(await cookie(context), originalCookie);
    const surviving = store.row('SELECT * FROM sessions WHERE hash=?', tokenHash(teacher.sessionToken));
    assert.equal(surviving.expires_at, originalSession.expires_at);
    assert.equal(surviving.epoch, originalSession.epoch + 1);
    assert.equal((await sessionResult(other.context)).status, 401);
    assert.equal((await sessionResult(child.context)).data.account.id, pupil.student.id);
    assert.deepEqual(pupilSnapshot(), preservedPupil);
    await page.unroute('**/api/learning/teacher/password');
    const beforeUnknownReload = passwordPosts();
    await page.reload(); await outcome('summary');
    assert.equal(passwordPosts(), beforeUnknownReload, 'A fresh document opens a neutral summary, not an automatic retry');
    assert.equal((await sessionResult(context)).data.account.id, teacher.account.id);
    assert.deepEqual(await cookie(context), originalCookie);
    await editor();

    // Server failures and both kinds of malformed successful response also
    // close the editor without claiming that the new code was saved.
    for (const responseBody of [null, 'unreadable acknowledgement', '{}']) {
      await page.route('**/api/learning/teacher/password', async route => {
        if (responseBody === null) return route.fulfill({ status: 503, contentType: 'application/json',
          body: JSON.stringify({ error: 'LEARNING_STORAGE_UNAVAILABLE' }) });
        const response = await route.fetch(); assert.equal(response.status(), 200);
        await route.fulfill({ status: 200, contentType: 'application/json', body: responseBody });
      });
      await fillPassword(page, '#teacher-password-form', NEW_PASSWORD);
      await page.locator('#teacher-password-form [type=submit]').click();
      assert.equal(await outcome('uncertain'), uncommittedText);
      assert.deepEqual(await cookie(context), originalCookie);
      assert.equal(store.row('SELECT * FROM sessions WHERE hash=?', tokenHash(teacher.sessionToken)).expires_at, originalSession.expires_at);
      await page.unroute('**/api/learning/teacher/password');
      await editor('retry');
    }

    // An explicit retry with a valid acknowledgement completes exactly once.
    // A failed logout may advance auth bookkeeping without replacing the
    // editor; its current teacher must still be able to submit that editor.
    await failedLogout();
    const beforeSuccess = passwordPosts();
    await fillPassword(page, '#teacher-password-form', NEW_PASSWORD);
    await page.locator('#teacher-password-form [type=submit]').click();
    await page.locator('#teacher-password-success').filter({ hasText: 'Код входа сохранён' }).waitFor();
    assert.equal(await page.locator('#teacher-password-success').getAttribute('role'), 'status');
    assert.equal(passwordPosts(), beforeSuccess + 1);
    await stableOutcome('success');
    assert.equal(passwordPosts(), beforeSuccess + 1, 'Confirmed completion never repeats the POST on return to settings');
    assert.deepEqual(await cookie(context), originalCookie);
    await page.reload(); await outcome('summary');
    assert.equal(passwordPosts(), beforeSuccess + 1, 'Reload shows neutral entry information, without a forced reset');

    // Typed values are cleared for bfcache, and another identity cannot see
    // the previous teacher's editor or outcome while session checking resumes.
    await editor();
    const countBeforeHide = passwordPosts();
    await fillPassword(page, '#teacher-password-form', '0381');
    const passwordInput = await page.locator('#teacher-password-form [name=password]').elementHandle();
    const confirmInput = await page.locator('#teacher-password-form [name=confirm]').elementHandle();
    await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    assert.equal(await passwordInput.evaluate(node => node.value), '');
    assert.equal(await confirmInput.evaluate(node => node.value), '');
    await passwordInput.dispose(); await confirmInput.dispose();
    assert.equal(passwordPosts(), countBeforeHide);
    for (const replacement of [pupilSession, null]) {
      if (replacement) await context.addCookies([{ name: COOKIE, value: replacement.sessionToken, url: origin,
        httpOnly: true, sameSite: 'Strict', expires: Math.floor(replacement.expiresAt / 1000) }]);
      else await context.clearCookies();
      const staleViews = await page.evaluate(() => {
        dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
        return document.querySelectorAll('#teacher-password-form,#teacher-password-success,#teacher-password-uncertain').length;
      });
      assert.equal(staleViews, 0, 'Persisted restore clears the old private view before checking the new cookie');
      await page.locator('#auth-form').waitFor();
      assert.equal(await page.locator('#teacher-password-form,#teacher-password-success,#teacher-password-uncertain,#add-student').count(), 0);
      if (replacement) assert.equal((await sessionResult(context)).data.account.id, pupil.student.id);
      else assert.equal((await sessionResult(context)).status, 401);
      await context.addCookies([originalCookie]);
      assert.equal((await sessionResult(context)).data.account.id, teacher.account.id);
      await page.reload(); await outcome('summary');
      await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    }

    // A response committed for the teacher cannot paint saved success after
    // another tab has switched this browser's authenticated identity.
    await page.reload(); await outcome('summary'); await editor();
    let releaseLate, markLate;
    const lateGate = new Promise(resolve => { releaseLate = resolve; });
    const lateCommitted = new Promise(resolve => { markLate = resolve; });
    await page.route('**/api/learning/teacher/password', async route => {
      const response = await route.fetch(); assert.equal(response.status(), 200);
      markLate(); await lateGate; await route.fulfill({ response });
    });
    await fillPassword(page, '#teacher-password-form', NEW_PASSWORD);
    await page.locator('#teacher-password-form [type=submit]').click();
    await lateCommitted;
    await context.addCookies([{ name: COOKIE, value: pupilSession.sessionToken, url: origin,
      httpOnly: true, sameSite: 'Strict', expires: Math.floor(pupilSession.expiresAt / 1000) }]);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.locator('#auth-form').waitFor();
    const lateResponse = page.waitForResponse(response => response.url().endsWith('/api/learning/teacher/password'));
    releaseLate(); await lateResponse;
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.locator('#teacher-password-success,#teacher-password-uncertain,#teacher-password-form').count(), 0,
      'A stale teacher acknowledgement cannot leak an outcome to the new identity');
    assert.equal((await sessionResult(context)).data.account.id, pupil.student.id);
    assert.deepEqual(pupilSnapshot(), preservedPupil);
    await page.unroute('**/api/learning/teacher/password');
    await context.addCookies([originalCookie]);
    await page.reload(); await outcome('summary');

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
    console.log('LEARNING_TEACHER_PASSWORD_BROWSER_OK: neutral default and reload; explicit four-digit editor; known4xx stays editable; uncommitted/committed aborts show identical unknown without inputs; 503/malformed200 unknown; explicit same-code retry and cancel; no automatic POST on rerender/revisit/Enter/bfcache; confirmed completion persists across navigation; stale ACK fenced after identity switch; legacy long login; My pupils next step; committed response loss retains cookie and expiry after reload; old password rejected/new works; other teacher sessions revoked; pupil session and work preserved; pagehide clears inputs; recovery proof scrubbed and inert on GET; invalid/expired/reused proofs rejected; recovery enters cabinet without reset; no URL/storage leaks; 390px.');
  } finally {
    if (browser) await browser.close(); server.closeAllConnections();
    await new Promise(resolve => server.close(resolve)); store.close(); fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
