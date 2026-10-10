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
  const errors = [], mutations = [], reads = [];
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ru-RU' });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await context.addCookies([{ name: 'mathexam_learning_local', value: pupilSession.sessionToken, url: origin, httpOnly: true, sameSite: 'Strict' }]);
    const page = await context.newPage(); page.setDefaultTimeout(10000); page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { const pathname = new URL(request.url()).pathname; if (request.method() === 'POST') mutations.push(pathname); else if (pathname.startsWith('/api/learning/')) reads.push(pathname); });
    // Record even a transient identity render before the final form settles.
    await page.addInitScript(({ name, login }) => {
      window.pupilIdentityRendered = false;
      new MutationObserver(() => {
        const text = document.body?.textContent || '';
        if (text.includes(name) || text.includes(login) || Array.from(document.querySelectorAll('input')).some(input => input.value === login)) window.pupilIdentityRendered = true;
      }).observe(document, { childList: true, subtree: true, attributes: true });
    }, { name: pupil.name, login: pupil.login });
    const sessionAccount = async () => (await (await context.request.get(origin + '/api/learning/session')).json()).account;
    const cleanTeacherForm = async (hint = '') => {
      await page.getByRole('heading', { name: 'Войти в кабинет учителя', exact: true }).waitFor();
      assert.equal(await page.locator('#account').innerText(), '');
      assert.equal(await page.locator('#sidebar').isVisible(), false);
      assert.equal(await page.locator('.role-mismatch').count(), 0);
      assert.equal(await page.locator('#auth-form [name=login]').inputValue(), hint);
      assert.equal(await page.evaluate(() => LearningApp.account()), null);
      const text = await page.locator('body').innerText();
      assert(!text.includes(pupil.name) && !text.includes(pupil.login), 'Teacher entry never displays pupil identity');
      assert.match(await page.title(), /Вход учителя/);
      assert(text.includes('Используйте логин и код входа своего учительского аккаунта. Прежний пароль тоже работает.'));
    };
    await page.goto(origin + '/learning/#students');
    await cleanTeacherForm();
    assert.equal(await page.evaluate(() => window.pupilIdentityRendered), false, 'No pupil identity flashes before the teacher form');
    assert.deepEqual(reads, ['/api/learning/status', '/api/learning/session'], 'Teacher entry stops before pupil data loading');
    assert.equal(mutations.length, 0, 'Opening teacher entry never logs out or switches identity');
    assert.equal((await sessionAccount()).id, pupil.id, 'The pupil cookie stays valid until teacher authentication');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    if (process.env.TEACHER_ENTRY_SCREENSHOT) await page.screenshot({ path: process.env.TEACHER_ENTRY_SCREENSHOT, fullPage: true });

    // Unsent pupil work remains under the original identity even when the view
    // immediately becomes a teacher password form; no logout or submission occurs.
    const draftKey = 'mathexam.learning.outbox.' + pupil.id;
    const draft = { outbox: [], rejected: [{ attemptId: 'fixture-draft', body: { opId: 'fixture-op', type: 'state' } }] };
    await page.evaluate(({ key, value }) => sessionStorage.setItem(key, JSON.stringify(value)), { key: draftKey, value: draft });
    await page.reload(); await cleanTeacherForm();
    assert.deepEqual(await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), draftKey), draft);
    assert.equal(mutations.length, 0);

    // A private teacher link may prefill only its explicit, validated hint.
    await page.goto(origin + '/learning/?role=teacher#login=fixture_role_teacher');
    await cleanTeacherForm('fixture_role_teacher');
    assert(!page.url().includes('#login='), 'The private hint is consumed from the visible URL');
    assert.equal(await page.evaluate(() => window.pupilIdentityRendered), false);
    assert.equal((await sessionAccount()).id, pupil.id);

    // Role intent is also enforced before the server creates a session.
    await page.locator('#auth-form [name=login]').fill(pupil.login);
    await page.locator('#auth-form [name=password]').fill(PASSWORD);
    await page.locator('#auth-form [type=submit]').click();
    await page.waitForFunction(() => document.querySelector('#auth-form .form-error')?.textContent.includes('другому кабинету'));
    assert.equal(await page.evaluate(() => LearningApp.account()), null);
    assert.equal((await sessionAccount()).id, pupil.id, 'Wrong-role credentials do not replace the pupil cookie');
    await page.locator('#auth-form [name=login]').fill('fixture_role_teacher');
    await page.locator('#auth-form [type=submit]').click();
    await page.getByRole('heading', { name: 'Мои ученики', exact: true }).waitFor();
    assert.equal((await page.evaluate(() => LearningApp.account())).id, teacher.account.id);
    assert.deepEqual(await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), draftKey), draft, 'Teacher login preserves the pupil queue');
    assert(!mutations.some(pathname => pathname.includes('fixture-draft')), 'The teacher cannot send the pupil queue');

    // The inverse boundary remains deliberate: teacher credentials do not grant
    // a pupil cabinet just because a pupil link was opened.
    await page.goto(origin + '/learning/?role=student');
    await page.locator('.role-mismatch').waitFor();
    assert.equal((await page.evaluate(() => LearningApp.account())).id, teacher.account.id);
    await page.goto(origin + '/learning/?role=teacher');
    await page.getByRole('heading', { name: 'Мои ученики', exact: true }).waitFor();

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
    await cleanTeacherForm();
    await page.locator('#identity-check').waitFor({ state: 'hidden' });
    assert.equal((await sessionAccount()).id, pupil.id);
    assert(!(await page.locator('main').innerText()).includes(peer.name));
    assert.equal(await page.locator('[data-student-access]').count(), 0);

    // A pupil invitation opened under an active teacher cannot replace the teacher.
    const pending = store.createStudent(teacher.account, { login: 'fixture_role_pending', name: 'Ожидающий ученик' });
    const teacherSession = store.createSession(teacher.account.id);
    await context.addCookies([{ name: 'mathexam_learning_local', value: teacherSession.sessionToken, url: origin, httpOnly: true, sameSite: 'Strict' }]);
    await page.reload();
    await page.getByRole('heading', { name: 'Мои ученики', exact: true }).waitFor();
    await page.goto(origin + '/learning/?role=teacher#invite=' + pending.invitationToken);
    await page.getByRole('heading', { name: 'Мои ученики', exact: true }).waitFor();
    assert.equal((await page.evaluate(() => LearningApp.account())).id, teacher.account.id);
    await page.waitForFunction(() => document.querySelector('#notice')?.textContent.includes('сначала выйдите'));
    assert(!page.url().includes(pending.invitationToken));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    // Teacher-intent login-hint and quick-link reconciliation also stop before
    // pupil data loading, even if the cookie changed while the teacher UI was open.
    for (const transition of ['login-hint', 'quick-link']) {
      const ownerSession = store.createSession(teacher.account.id);
      await context.addCookies([{ name: 'mathexam_learning_local', value: ownerSession.sessionToken, url: origin, httpOnly: true, sameSite: 'Strict' }]);
      await page.goto(origin + '/learning/?role=teacher#assignments');
      await page.reload();
      await page.getByText('PRIVATE_OTHER_ASSIGNMENT', { exact: true }).waitFor();
      const changed = store.createSession(pupil.id);
      await context.addCookies([{ name: 'mathexam_learning_local', value: changed.sessionToken, url: origin, httpOnly: true, sameSite: 'Strict' }]);
      const beforeReads = reads.length, beforeMutations = mutations.length;
      await page.evaluate(transition => { location.hash = transition === 'login-hint' ? 'login=fixture_role_teacher' : 'quick=' + 'A'.repeat(43); }, transition);
      await cleanTeacherForm(transition === 'login-hint' ? 'fixture_role_teacher' : '');
      assert.deepEqual(reads.slice(beforeReads), ['/api/learning/session']);
      assert.equal(mutations.length, beforeMutations);
      assert.equal((await sessionAccount()).id, pupil.id);
      assert(!(await page.locator('body').innerText()).includes('PRIVATE_OTHER_ASSIGNMENT'));
    }

    // Same-document hash-only teacher entry parks loaded pupil drafts and clears
    // pupil-specific notices and modal content as well as the account header.
    await page.goto(origin + '/learning/?role=student');
    await page.waitForFunction(() => window.LearningApp?.account()?.role === 'student');
    await page.evaluate(name => {
      document.querySelector('#notice').textContent = name;
      document.querySelector('#toast').textContent = name;
      document.querySelector('#modal-content').textContent = name;
      location.hash = 'students';
    }, pupil.name);
    await cleanTeacherForm();
    assert.equal(await page.locator('#modal-content').innerText(), '');
    assert.deepEqual(await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), draftKey), draft);

    // Every identity-adoption path clears the old cache even if the new account's
    // data refresh fails. No teacher assignments may reappear on a later hash route.
    for (const transition of ['login-hint', 'quick-link', 'logout-login']) {
      const ownerSession = store.createSession(teacher.account.id);
      await context.addCookies([{ name: 'mathexam_learning_local', value: ownerSession.sessionToken, url: origin, httpOnly: true, sameSite: 'Strict' }]);
      await page.goto(origin + '/learning/#assignments');
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
    // A completed pupil authentication must not overwrite a teacher destination
    // chosen while the server response was in flight. The credential operation
    // itself remains valid; only its pupil UI is parked behind the teacher form.
    for (const operation of ['activate', 'quick-login']) {
      await page.goto('about:blank');
      await context.clearCookies();
      let releaseResponse, responseHeld;
      const release = new Promise(resolve => { releaseResponse = resolve; });
      const held = new Promise(resolve => { responseHeld = resolve; });
      await page.route('**/api/learning/' + operation, async route => {
        const response = await route.fetch();
        responseHeld(); await release; await route.fulfill({ response });
      });
      if (operation === 'activate') {
        await page.goto(origin + '/learning/#invite=' + pending.invitationToken);
        await page.locator('#auth-form [name=password]').fill('0379');
        await page.locator('#auth-form [name=confirm]').fill('0379');
        await page.locator('#auth-form [type=submit]').click();
      } else {
        const ownerSession = store.createSession(teacher.account.id);
        const grant = store.writeStudentQuickAccess(ownerSession.sessionToken, pupil.id, { expectedVersion: 0 });
        await page.goto(origin + '/learning/#quick=' + grant.quickToken);
      }
      await Promise.race([held, new Promise((_, reject) => { const timer = setTimeout(() => reject(Error(operation + ' request was not reached')), 10000); timer.unref(); })]);
      await page.evaluate(() => { location.hash = 'students'; });
      releaseResponse();
      await cleanTeacherForm();
      assert.equal(new URL(page.url()).hash, '#students', operation + ' completion keeps the explicit teacher destination');
      assert.equal((await sessionAccount()).id, operation === 'activate' ? pending.student.id : pupil.id);
      assert(!(await page.locator('body').innerText()).includes(pending.student.name));
      await page.unroute('**/api/learning/' + operation);
      await page.reload(); await cleanTeacherForm();
      const beforeRestoreReads = reads.length;
      const restoredSession = page.waitForResponse(response => new URL(response.url()).pathname === '/api/learning/session');
      await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
      await restoredSession;
      await cleanTeacherForm();
      assert.deepEqual(reads.slice(beforeRestoreReads), ['/api/learning/session'], 'Restored teacher entry does not load pupil data');
    }
    assert.deepEqual(errors, []);
    console.log('LEARNING_ROLE_NAVIGATION_BROWSER_OK: direct teacher form without identity flash; explicit teacher hint; role-authenticated login; preserved pupil cookie and draft; inverse role guard; permanent entry copy; read-only teacher preview; cross-tab identity fence; invitation preserves account; 390px.');
  } finally {
    if (browser) await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); store.close(); fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
