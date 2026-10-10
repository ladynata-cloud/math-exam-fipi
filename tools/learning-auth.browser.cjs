'use strict';
// Real local HTTP and SQLite. These credentials and invitations are synthetic.
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
const contracts = require('../board-server/learning-contracts');
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) {
  ({ chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright')));
}
const LOGIN = 'fixture_auth_teacher';
const PASSWORD = '0481';
const WRONG_TOKEN = 'SyntheticInvalidInvitation2026abcdefgh';

async function privateState(page, tokens) {
  const persisted = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
  const markup = await page.locator('body').innerHTML();
  for (const token of [PASSWORD, ...tokens]) {
    assert.equal(page.url().includes(token), false, 'Credentials are scrubbed from the URL');
    assert.equal(persisted.includes(token), false, 'Credentials are never put into browser storage');
    assert.equal(markup.includes(token), false, 'Credentials are not inserted into page markup');
  }
}
async function enterInvite(page, token) {
  await page.evaluate(token => { location.hash = 'invite=' + token; }, token);
  await page.getByRole('heading', { name: 'Добро пожаловать', exact: true }).waitFor();
  assert.equal(new URL(page.url()).hash, '', 'Same-document invitation is consumed without a reload');
}
async function setPassword(page, password, confirmation = password) {
  await page.locator('#auth-form [name=password]').fill(password);
  await page.locator('#auth-form [name=confirm]').fill(confirmation);
}
async function submit(page, operation) {
  const response = page.waitForResponse(response => response.url().endsWith('/api/learning/' + operation)
    && response.request().method() === 'POST');
  await page.locator('#auth-form [type=submit]').click();
  return response;
}
async function waitForError(page, text) {
  await page.waitForFunction(text => document.querySelector('#auth-form .form-error')?.textContent.includes(text), text);
  return page.locator('#auth-form .form-error').innerText();
}
async function codeStorageIsPrivate(page, codes) {
  const persisted = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
  for (const code of codes) {
    assert.equal(page.url().includes(code), false, 'Recovery codes never enter the URL');
    assert.equal(persisted.includes(code), false, 'Recovery codes are not persisted in browser storage');
  }
}
async function acknowledgeCodes(page) {
  assert.equal(await page.locator('#done-codes').isDisabled(), true, 'Closing requires a deliberate saved-codes confirmation');
  await page.locator('#recovery-saved').check();
  await page.locator('#done-codes').click();
  await page.locator('#recovery-codes').waitFor({ state: 'detached' });
}
async function assertCodesRemain(page, expected) {
  assert.equal(await page.locator('#modal').evaluate(dialog => dialog.open), true);
  assert.deepEqual((await page.locator('#recovery-codes').innerText()).split('\n'), expected);
}
async function openRecoveryOptions(page) {
  if (!await page.locator('#recovery-options').count()) {
    await page.locator('#teacher-password-change').click();
  }
  const options = page.locator('#recovery-options');
  await options.waitFor({ state: 'attached' });
  if (await options.getAttribute('open') === null) await options.locator('summary').click();
  await page.locator('#recovery-rotate-form').waitFor();
}
async function rotateCodes(page, password) {
  await openRecoveryOptions(page);
  await page.locator('#recovery-rotate-form [name=password]').fill(password);
  const response = page.waitForResponse(response => response.url().endsWith('/api/learning/teacher/recovery-codes')
    && response.request().method() === 'POST');
  await page.locator('#recovery-rotate-form [type=submit]').click();
  return response;
}


async function acknowledgeAccess(page) {
  assert.equal(await page.locator('#close-access').isDisabled(), false, 'Ready pupil access closes without a save-confirmation ceremony');
  assert.equal(await page.locator('#access-saved,#access-discard-confirm,#discard-access').count(), 0);
  const passwordInput = await page.locator('#access-password').elementHandle();
  const fallback = await page.locator('#access-copy-text').elementHandle();
  await page.locator('#close-access').click();
  await page.locator('#access-password').waitFor({ state: 'detached' });
  assert.equal(await passwordInput.evaluate(node => node.value), '', 'The detached password field is explicitly cleared');
  assert.equal(await fallback.evaluate(node => node.value), '', 'The detached manual-copy field is explicitly cleared');
  await passwordInput.dispose(); await fallback.dispose();
  assert.equal(await page.locator('#access-copy-text').count(), 0, 'Closing removes the combined plaintext copy fallback');
}
async function assertAccessRemains(page, login, password) {
  assert.equal(await page.locator('#modal').evaluate(dialog => dialog.open), true);
  assert.equal(await page.locator('#access-login').inputValue(), login);
  assert.equal(await page.locator('#access-password').inputValue(), password);
}
async function accessCardGuards(page, login, password) {
  assert.equal(await page.locator('#dialog-close').count(), 0, 'The one-time pupil card has no accidental close icon');
  await page.keyboard.press('Escape');
  await assertAccessRemains(page, login, password);
  await page.mouse.click(1, 1);
  await assertAccessRemains(page, login, password);
  await page.evaluate(() => LearningApp.navigate('security'));
  await page.waitForFunction(() => location.hash === '#security');
  await page.evaluate(() => LearningApp.refresh());
  await assertAccessRemains(page, login, password);
  assert.equal(await page.locator('#recovery-rotate-form').count(), 0, 'Route/refresh cannot replace pupil credentials with another credential form');
  await page.evaluate(() => document.querySelector('#logout').click());
  await assertAccessRemains(page, login, password);
  assert.equal(await page.evaluate(() => LearningApp.account().role), 'teacher');
  assert.equal(await page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented;
  }), true, 'Reload/navigation warns while pupil credentials have not been saved');
  await page.evaluate(() => LearningApp.navigate('students'));
  await codeStorageIsPrivate(page, [password]);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'The access card fits a 390px phone');
}
async function pupilCopyChecks(page, context, origin, login, password) {
  const expected = 'Твой кабинет MathExam:\n' + origin + '/learning/?role=student#login=' + login + '\nЛогин: ' + login + '\nКод входа: ' + password + '\n\nОткрой ссылку, введи код и нажми «Войти». Затем открой задание или свой маршрут. Заново задавать код не нужно.';
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
  await page.locator('#copy-access').click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected, 'The green button copies the exact URL, login and password');
  await page.waitForFunction(() => document.querySelector('#access-copy-status')?.textContent.includes('скопирован'));
  assert.equal(await page.locator('#access-copy-status').evaluate(node => !!node.closest('dialog[open]')), true,
    'Success feedback is inside the modal top layer');
  await assertAccessRemains(page, login, password);
  await context.clearPermissions();
  const client = await context.newCDPSession(page);
  await client.send('Browser.setPermission', { permission: { name: 'clipboard-write' }, setting: 'denied', origin });
  await page.locator('#copy-access').click();
  await page.locator('#access-copy-text').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#access-copy-text').inputValue(), expected);
  assert.equal(await page.locator('#access-copy-text').evaluate(node => node.selectionStart === 0 && node.selectionEnd === node.value.length), true,
    'Denied clipboard access selects the complete manual fallback');
  await page.locator('#access-copy-status').scrollIntoViewIfNeeded();
  const status = await page.locator('#access-copy-status').innerText();
  assert.match(status, /копир|буфер/i);
  assert.equal(await page.locator('#access-copy-status').evaluate(node => {
    const r = node.getBoundingClientRect(), top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return top === node || node.contains(top);
  }), true, 'Clipboard error is visibly above the backdrop, not hidden under the card');
  await page.locator('#select-access').click();
  assert.equal(await page.locator('#access-copy-text').evaluate(node => node === document.activeElement && node.selectionStart === 0 && node.selectionEnd === node.value.length), true,
    'Manual selection remains available without clipboard permission');
  await assertAccessRemains(page, login, password);
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
  await client.detach();
}

(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-auth-'));
  const store = new LearningStore({ filePath: path.join(directory, 'learning.sqlite'), contracts });
  assert.equal(store.available, true, 'A supported Node version with SQLite is required');
  const app = express();
  app.use(express.json({ limit: '200kb' }));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  app.get('/api/learning/status', (_req, res) => res.json({ ...store.status(), trainerOrigin: origin }));
  const learning = createLearningApi({ store, publicOrigin: origin, secureCookies: false });
  app.use('/api/learning', learning.router);
  app.use(express.static(ROOT));
  const invitation = store.bootstrap({ login: LOGIN, name: 'Учитель проверки входа' });
  const pageErrors = [], mutations = [], requestBodies = [], credentialRequests = [], nonlocalRequests = [];
  let browser;
  try {
    browser = await chromium.launch({ headless: true,
      ...(process.env.CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
      args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ru-RU' });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (/^https?:/.test(url.protocol) && url.origin !== origin) {
        nonlocalRequests.push(url.origin + url.pathname); return route.abort('blockedbyclient');
      }
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('request', request => {
      if (request.method() === 'POST') mutations.push(new URL(request.url()).pathname);
      if (request.postData()) { requestBodies.push(request.postData()); credentialRequests.push({ path: new URL(request.url()).pathname, body: request.postData() }); }
    });
    page.setDefaultTimeout(10000);
    await page.goto(origin + '/learning/');
    await page.getByRole('heading', { name: 'Войти в кабинет', exact: true }).waitFor();
    const documentId = await page.evaluate(() => { window.authFixtureDocument = crypto.randomUUID(); return window.authFixtureDocument; });
    await enterInvite(page, WRONG_TOKEN);
    assert.equal(await page.evaluate(() => window.authFixtureDocument), documentId, 'Opening the invite keeps the same document');
    await setPassword(page, PASSWORD);
    assert.equal((await submit(page, 'activate')).status(), 401);
    const activationError = await waitForError(page, 'Менять код из-за этой ошибки не нужно');
    assert.match(activationError, /Приглашение недействительно/);
    assert.match(activationError, /перейдите ко входу/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Long invitation advice fits a phone');
    await privateState(page, [WRONG_TOKEN]);

    // Matching and password format are independent of invitation validity.
    await enterInvite(page, invitation.invitationToken);
    const beforeValidation = mutations.length;
    await setPassword(page, PASSWORD, '0392');
    await page.locator('#auth-form [type=submit]').click();
    assert.equal(await waitForError(page, 'Коды не совпадают'), 'Коды не совпадают.');
    assert.equal(mutations.length, beforeValidation, 'Mismatched passwords never reach the server');
    for (const invalid of ['048', '04a1']) {
      await setPassword(page, invalid);
      await page.locator('#auth-form [type=submit]').click();
      assert.equal(await page.locator('#auth-form [name=password]').evaluate(input => input.validity.valid), false);
      assert.equal(mutations.length, beforeValidation, 'Only four ASCII digits can be submitted as a new code');
    }
    for (const input of await page.locator('#auth-form [name=password],#auth-form [name=confirm]').all()) {
      assert.equal(await input.getAttribute('minlength'), '4');
      assert.equal(await input.getAttribute('maxlength'), '4');
      assert.equal(await input.getAttribute('pattern'), '[0-9]{4}');
      assert.equal(await input.getAttribute('inputmode'), 'numeric');
    }
    await page.locator('#auth-form').evaluate(form => { form.noValidate = true; });
    await page.locator('#auth-form [type=submit]').click();
    assert.match(await waitForError(page, 'ровно 4 цифры'), /Код входа/);
    assert.equal(mutations.length, beforeValidation, 'The local guard also rejects invalid codes when native validation is bypassed');
    await page.locator('#auth-form').evaluate(form => { form.noValidate = false; });
    assert.equal(store.invitation(invitation.invitationToken).account_id, invitation.account.id,
      'Invalid codes leave the invitation unused');

    // Leaving activation discards the in-memory invitation, including on a later hashchange.
    await page.getByRole('button', { name: 'Перейти ко входу', exact: true }).click();
    await page.evaluate(() => { location.hash = 'home'; });
    await page.getByRole('heading', { name: 'Войти в кабинет', exact: true }).waitFor();
    assert.equal(await page.locator('#auth-form [name=confirm]').count(), 0);
    await page.locator('#auth-form [name=login]').fill(LOGIN);
    await page.locator('#auth-form [name=password]').fill(PASSWORD);
    assert.equal((await submit(page, 'login')).status(), 401);
    const loginError = await waitForError(page, 'Проверьте логин и пароль');
    assert.doesNotMatch(loginError, /приглашен|ссылк|уже использован/i);
    assert.equal(mutations.at(-1), '/api/learning/login', 'Ordinary login cannot accidentally reuse the invite');
    await page.getByRole('button', { name: 'Не помню код входа', exact: true }).click();
    await page.locator('#auth-form [name=login]').fill(LOGIN);
    await page.locator('#auth-form [name=code]').fill(WRONG_TOKEN);
    await setPassword(page, PASSWORD);
    assert.equal((await submit(page, 'recover')).status(), 401);
    assert.match(await waitForError(page, 'код восстановления'), /Каждый код можно использовать только один раз/);

    await page.route('**/api/learning/attempts', route => route.fulfill({ status: 503,
      contentType: 'application/json', body: JSON.stringify({ error: 'LEARNING_STORAGE_UNAVAILABLE' }) }));
    await enterInvite(page, invitation.invitationToken);
    await setPassword(page, PASSWORD);
    assert.equal((await submit(page, 'activate')).status(), 200, 'Matching valid credentials complete activation');
    await page.locator('#done-codes').waitFor();
    const initialCodes = (await page.locator('#recovery-codes').innerText()).split('\n');
    assert.equal(initialCodes.length, 8, 'First activation still presents all recovery codes if loading the cabinet fails');
    assert.equal(await page.locator('#dialog-close').count(), 0, 'There is no easy-to-miss close icon on the recovery-code card');
    await page.keyboard.press('Escape');
    await assertCodesRemain(page, initialCodes);
    await page.mouse.click(1, 1);
    await assertCodesRemain(page, initialCodes);
    await codeStorageIsPrivate(page, initialCodes);
    await acknowledgeCodes(page);
    await page.getByRole('heading', { name: 'Не удалось загрузить кабинет', exact: true }).waitFor();
    assert.equal(await page.locator('#auth-form').count(), 0, 'Successful activation never falls back to the activation form on a data error');
    const afterActivation = mutations.length;
    await page.unroute('**/api/learning/attempts');
    await page.locator('#retry-cabinet').click();
    await page.locator('#retry-cabinet').waitFor({ state: 'detached' });
    assert.equal(mutations.length, afterActivation, 'Retry after activation loads data without resubmitting credentials');
    await page.locator('#logout').waitFor();
    assert.equal(await page.evaluate(() => LearningApp.account().id), invitation.account.id);
    await privateState(page, [WRONG_TOKEN, invitation.invitationToken]);

    // An invitation does not replace an already authenticated teacher or discard the current view.
    const pupil = store.createStudent(invitation.account, { name: 'Ученик проверки', login: 'fixture_auth_pupil' });
    await page.locator('[data-nav=students]').click();
    await page.locator('#add-student').waitFor();
    const roster = await page.locator('#add-student').elementHandle();
    const beforeGuard = mutations.length;
    await page.evaluate(token => { location.hash = 'invite=' + token; }, pupil.invitationToken);
    await page.waitForFunction(() => document.querySelector('#notice')?.textContent.includes('сначала выйдите'));
    assert.equal(new URL(page.url()).hash, '#students', 'Authenticated hash invitation restores the current route');
    assert.equal(await page.locator('#add-student').evaluate((node, original) => node === original, roster), true);
    assert.equal(await page.locator('#auth-form').count(), 0);
    assert.equal(await page.evaluate(() => LearningApp.account().id), invitation.account.id);
    assert.equal(mutations.length, beforeGuard, 'An authenticated invite makes no authentication mutation');
    await privateState(page, [pupil.invitationToken]);
    await roster.dispose();

    await page.goto(origin + '/learning/?auth-fixture=reload#invite=' + pupil.invitationToken);
    await page.locator('#logout').waitFor();
    assert.equal(await page.locator('#auth-form').count(), 0, 'Initial-load invite also checks the existing session');
    assert.equal(await page.evaluate(() => LearningApp.account().id), invitation.account.id);
    await page.waitForFunction(() => document.querySelector('#notice')?.textContent.includes('сначала выйдите'));
    assert.match(await page.locator('#notice').innerText(), /сначала выйдите/);
    assert.equal(mutations.length, beforeGuard);
    await privateState(page, [pupil.invitationToken]);
    await page.locator('#logout').click();
    await page.getByRole('heading', { name: 'Войти в кабинет', exact: true }).waitFor();
    assert.equal(await page.locator('#auth-login').count(), 0, 'Rejected authenticated invite is not retained for logout');
    await page.locator('#auth-form [name=login]').fill(LOGIN);
    await page.locator('#auth-form [name=password]').fill(PASSWORD);
    assert.equal((await submit(page, 'login')).status(), 200);
    await page.locator('#logout').waitFor();

    // A working session with a temporarily failing list API keeps the authenticated shell and a usable retry.
    await page.route('**/api/learning/attempts', route => route.fulfill({ status: 503,
      contentType: 'application/json', body: JSON.stringify({ error: 'LEARNING_STORAGE_UNAVAILABLE' }) }));
    await page.goto(origin + '/learning/?auth-fixture=data-unavailable');
    await page.getByRole('heading', { name: 'Не удалось загрузить кабинет', exact: true }).waitFor();
    assert.equal(await page.locator('#auth-form').count(), 0);
    assert.equal(await page.evaluate(() => LearningApp.account().id), invitation.account.id);
    const beforeDataRetry = mutations.length;
    await page.unroute('**/api/learning/attempts');
    await page.locator('#retry-cabinet').click();
    await page.locator('#retry-cabinet').waitFor({ state: 'detached' });
    assert.equal(mutations.length, beforeDataRetry);
    await page.locator('[data-nav=students]').click();
    await page.locator('#add-student').waitFor();

    // If the session cannot be checked, activation stays closed instead of replacing an unknown session.
    await page.route('**/api/learning/session', route => route.fulfill({ status: 503,
      contentType: 'application/json', body: JSON.stringify({ error: 'LEARNING_STORAGE_UNAVAILABLE' }) }));
    await page.goto(origin + '/learning/?auth-fixture=unavailable#invite=' + pupil.invitationToken);
    await page.getByRole('heading', { name: 'Добро пожаловать', exact: true }).waitFor();
    const beforeUnknownSession = mutations.length;
    await setPassword(page, PASSWORD);
    await page.locator('#auth-form [type=submit]').click();
    await waitForError(page, 'Кабинет временно недоступен');
    assert.equal(mutations.length, beforeUnknownSession, 'An unknown existing session cannot be overwritten by activation');
    await privateState(page, [pupil.invitationToken]);
    await page.unroute('**/api/learning/session');
    await page.locator('#auth-form [type=submit]').click();
    await page.locator('#logout').waitFor();
    assert.equal(await page.evaluate(() => LearningApp.account().id), invitation.account.id, 'Retry after server recovery restores the existing session');
    assert.equal(mutations.length, beforeUnknownSession, 'Retry does not activate over the restored session');
    await page.locator('[data-nav=students]').click();
    await page.locator('#add-student').waitFor();
    assert.equal(new URL(page.url()).hash, '#students', 'Routes remain usable after session recovery');
    // Recovery also works when the failed initial session check belonged to an anonymous browser.
    await context.clearCookies();
    await page.route('**/api/learning/session', route => route.fulfill({ status: 503,
      contentType: 'application/json', body: JSON.stringify({ error: 'LEARNING_STORAGE_UNAVAILABLE' }) }));
    await page.goto(origin + '/learning/?auth-fixture=anonymous-retry');
    await page.getByRole('heading', { name: 'Войти в кабинет', exact: true }).waitFor();
    await page.locator('#auth-form [name=login]').fill(LOGIN);
    await page.locator('#auth-form [name=password]').fill(PASSWORD);
    await page.unroute('**/api/learning/session');
    assert.equal((await submit(page, 'login')).status(), 200);
    await page.locator('#logout').waitFor();
    await page.locator('[data-nav=students]').click();
    await page.locator('#add-student').waitFor();
    assert.equal(new URL(page.url()).hash, '#students');

    // A teacher who lost the first card can issue a replacement after an ordinary login.
    await page.locator('[data-nav=security]').click();
    await openRecoveryOptions(page);
    await page.locator('#recovery-rotate-form').waitFor();
    assert.equal(new URL(page.url()).hash, '#security');
    assert.equal(await page.locator('#recovery-rotate-form [name=password]').getAttribute('autocomplete'), 'current-password');
    assert.equal(await page.locator('iframe').count(), 0, 'The password form does not mount a trainer');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Security settings fit a 390px phone');
    const beforeCodes = store.rows('SELECT * FROM recovery_codes WHERE account_id=? ORDER BY hash', invitation.account.id);
    const beforeAccount = store.account(invitation.account.id);
    const beforeSessions = store.rows('SELECT * FROM sessions WHERE account_id=? ORDER BY hash', invitation.account.id);
    assert.equal((await rotateCodes(page, PASSWORD + 'Wrong')).status(), 401);
    await page.waitForFunction(() => document.querySelector('#recovery-rotate-form .form-error')?.textContent.includes('пароль'));
    assert.deepEqual(store.rows('SELECT * FROM recovery_codes WHERE account_id=? ORDER BY hash', invitation.account.id), beforeCodes,
      'An incorrect current password does not invalidate the existing codes');
    assert.equal(await page.locator('#recovery-codes').count(), 0);
    assert.equal(await page.evaluate(() => LearningApp.account().id), invitation.account.id, 'A failed confirmation does not log out the teacher');
    // A slow committed rotation must not let navigation open a second credentials dialog.
    const securityForm = await page.locator('#recovery-rotate-form').elementHandle();
    let releaseRotation, markRotationCommitted;
    const rotationCommitted = new Promise(resolve => { markRotationCommitted = resolve; });
    const rotationGate = new Promise(resolve => { releaseRotation = resolve; });
    await page.route('**/api/learning/teacher/recovery-codes', async route => {
      const response = await route.fetch();
      assert.equal(response.status(), 200);
      markRotationCommitted();
      await rotationGate;
      await route.fulfill({ response });
    }, { times: 1 });
    const rotationResult = rotateCodes(page, PASSWORD);
    await rotationCommitted;
    try {
      await page.locator('[data-nav=students]').click();
      await page.waitForFunction(() => location.hash === '#students');
      await page.evaluate(() => LearningApp.refresh());
      assert.equal(await page.locator('#recovery-rotate-form').evaluate((node, original) => node === original, securityForm), true,
        'A pending code request defers route rendering instead of exposing another credential form');
      assert.equal(await page.locator('#recovery-rotate-form [type=submit]').isDisabled(), true);
      assert.equal(await page.locator('#add-student,#student-form,#access-password').count(), 0,
        'Creating pupil credentials cannot overlap an outstanding recovery-code response');
      await page.locator('#logout').click();
      assert.equal(await page.evaluate(() => LearningApp.account().id), invitation.account.id, 'Logout also waits for code issuance');
      await page.locator('[data-nav=home]').click();
      await page.waitForFunction(() => location.hash === '#home');
    } finally {
      releaseRotation();
      await securityForm.dispose();
    }
    const rotationResponse = await rotationResult;
    assert.equal(rotationResponse.status(), 200);
    assert.equal(rotationResponse.headers()['cache-control'], 'no-store');
    assert.deepEqual(Object.keys(rotationResponse.request().postDataJSON()), ['password']);
    const newCodes = (await rotationResponse.json()).recoveryCodes;
    assert.equal(new Set(newCodes).size, 8);
    await page.locator('#recovery-codes').waitFor();
    await assertCodesRemain(page, newCodes);
    assert.deepEqual(store.account(invitation.account.id), beforeAccount, 'Issuing codes keeps the login, password and account intact');
    assert.deepEqual(store.rows('SELECT * FROM sessions WHERE account_id=? ORDER BY hash', invitation.account.id), beforeSessions,
      'Issuing backup codes keeps existing sessions');
    for (const code of initialCodes) assert.throws(() => store.recovery(LOGIN, code), /LEARNING_ACCESS_INVALID/);
    for (const code of newCodes) assert.equal(store.recovery(LOGIN, code).account.id, invitation.account.id);

    // Escape, backdrop clicks, route changes and list rerenders cannot erase the one-time card.
    await page.keyboard.press('Escape');
    await assertCodesRemain(page, newCodes);
    await page.mouse.click(1, 1);
    await assertCodesRemain(page, newCodes);
    await page.evaluate(() => new Promise(resolve => {
      window.addEventListener('hashchange', resolve, { once: true }); location.hash = 'students';
    }));
    await page.evaluate(() => LearningApp.refresh());
    await assertCodesRemain(page, newCodes);
    assert.equal(await page.evaluate(() => {
      const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented;
    }), true, 'Leaving the document warns about unsaved recovery codes');
    await codeStorageIsPrivate(page, newCodes);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'The code card fits a phone');
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#save-codes').click();
    const download = await downloadEvent;
    assert.equal(download.suggestedFilename(), 'mathexam-recovery-codes.json');
    const downloaded = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.equal(downloaded.login, LOGIN);
    assert.deepEqual(downloaded.codes, newCodes, 'The private download contains the exact issued codes');
    await assertCodesRemain(page, newCodes);
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
    await page.locator('#copy-codes').click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    for (const code of newCodes) assert.equal(copied.includes(code), true, 'Copy captures each recovery code');
    await assertCodesRemain(page, newCodes);
    await acknowledgeCodes(page);
    await page.locator('#add-student').waitFor();
    await privateState(page, [...initialCodes, ...newCodes]);

    // If the server rotates codes but the response is lost, the authenticated teacher can retry.
    await page.locator('[data-nav=security]').click();
    await openRecoveryOptions(page);
    let lostCodes, releaseLostResponse, markLostCommitted;
    const lostCommitted = new Promise(resolve => { markLostCommitted = resolve; });
    const lostResponseGate = new Promise(resolve => { releaseLostResponse = resolve; });
    await page.route('**/api/learning/teacher/recovery-codes', async route => {
      const response = await route.fetch();
      assert.equal(response.status(), 200);
      lostCodes = (await response.json()).recoveryCodes;
      markLostCommitted();
      await lostResponseGate;
      await route.abort('failed');
    }, { times: 1 });
    await page.locator('#recovery-rotate-form [name=password]').fill(PASSWORD);
    await page.locator('#recovery-rotate-form [type=submit]').click();
    await lostCommitted;
    try {
      await page.locator('[data-nav=students]').click();
      await page.waitForFunction(() => location.hash === '#students');
      assert.equal(await page.locator('#add-student').count(), 0, 'Navigation also waits while a response is about to fail');
    } finally { releaseLostResponse(); }
    await page.locator('#add-student').waitFor();
    await page.waitForFunction(() => !document.querySelector('#notice').hidden && !!document.querySelector('#notice').textContent);
    assert.equal(await page.locator('#recovery-codes').count(), 0, 'A lost response does not fabricate a code card');
    assert.equal(lostCodes.length, 8, 'The simulated lost response follows a real committed rotation');
    for (const code of lostCodes) assert.equal(store.recovery(LOGIN, code).account.id, invitation.account.id);
    await page.reload();
    await page.locator('[data-nav=security]').click();
    await openRecoveryOptions(page);
    await page.locator('#recovery-rotate-form').waitFor();
    assert.equal(await page.evaluate(() => LearningApp.account().id), invitation.account.id);
    const retryResponse = await rotateCodes(page, PASSWORD);
    assert.equal(retryResponse.status(), 200);
    const retryCodes = (await retryResponse.json()).recoveryCodes;
    await page.locator('#recovery-codes').waitFor();
    await assertCodesRemain(page, retryCodes);
    for (const code of lostCodes) assert.throws(() => store.recovery(LOGIN, code), /LEARNING_ACCESS_INVALID/);
    await codeStorageIsPrivate(page, [...initialCodes, ...newCodes, ...lostCodes, ...retryCodes]);
    await page.locator('.recovery-discard summary').click();
    assert.equal(await page.locator('#discard-codes').isDisabled(), true, 'Closing without saving also requires an explicit confirmation');
    await page.locator('#recovery-discard-confirm').check();
    await page.locator('#discard-codes').click();
    await page.locator('#recovery-codes').waitFor({ state: 'detached' });
    await privateState(page, [...initialCodes, ...newCodes, ...lostCodes, ...retryCodes]);
    for (const code of [...initialCodes, ...newCodes, ...lostCodes, ...retryCodes]) {
      assert.equal(requestBodies.some(body => body.includes(code)), false, 'Backup codes never leak into trainer or other outgoing request bodies');
    }
    // A teacher can issue a pupil an four-digit password; the exact string survives creation and login.
    const pupilPasswords = [], pupilCredentialRequestStart = credentialRequests.length;
    for (const [index, chosenPassword] of [null, '0364'].entries()) {
      await page.locator('[data-nav=students]').click();
      await page.locator('#add-student').click();
      assert.equal(await page.locator('#student-form [name=access],#student-form [name=confirm]').count(), 0, 'Creation directly issues a ready password without a mode or activation step');
      const input = page.locator('#student-form [name=password]');
      assert.equal(await input.getAttribute('minlength'), '4');
      assert.match(await input.inputValue(), /^\d{4}$/, 'The suggested pupil password is exactly four digits');
      await page.locator('#generate-password').click();
      const generatedPassword = await input.inputValue();
      assert.match(generatedPassword, /^\d{4}$/, 'Regeneration also returns four digits');
      const password = chosenPassword || generatedPassword, login = 'fixture_short_pupil_' + index;
      await page.locator('#student-form [name=name]').fill('Ученик короткого пароля ' + index);
      await page.locator('#student-form [name=login]').fill(login);
      if (index === 0) {
        const beforeShortStudent = mutations.length;
        await input.fill('042');
        await page.locator('#student-form [type=submit]').click();
        assert.equal(await input.evaluate(node => node.validity.valid), false);
        assert.equal(mutations.length, beforeShortStudent, 'The student form blocks a three-digit code');
        await page.locator('#student-form').evaluate(form => { form.noValidate = true; });
        await page.locator('#student-form [type=submit]').click();
        await page.waitForFunction(() => document.querySelector('#student-form .form-error')?.textContent.includes('ровно 4 цифры'));
        assert.equal(mutations.length, beforeShortStudent, 'The local code guard also works without native validation');
        assert.equal(!!store.accountByLogin(login), false, 'Invalid input leaves no partial pupil account');
        await page.locator('#student-form').evaluate(form => { form.noValidate = false; });
      }
      await input.fill(password);
      const created = page.waitForResponse(response => response.url().endsWith('/api/learning/teacher/students')
        && response.request().method() === 'POST');
      await page.locator('#student-form [type=submit]').click();
      assert.equal((await created).status(), 201);
      await page.locator('#access-password').waitFor();
      assert.equal(await page.locator('#access-password').inputValue(), password);
      assert.equal(await page.locator('#access-login').inputValue(), login);
      const readyLink = new URL(await page.locator('#access-link').inputValue());
      assert.equal(readyLink.hash, '#login=' + login); assert.equal(readyLink.searchParams.get('role'), 'student');
      await codeStorageIsPrivate(page, [password]);
      if (index === 0) {
        await pupilCopyChecks(page, context, origin, login, password);
        await accessCardGuards(page, login, password);
      }
      await acknowledgeAccess(page);
      await privateState(page, [password]);
      pupilPasswords.push({ login, password });
    }

    // Reissuing a lost pupil password changes access, not the pupil or their educational history.
    const issued = pupilPasswords[0], originalPupilPasswords = pupilPasswords.map(item => item.password), studentRecord = store.accountByLogin(issued.login);
    const studentAuth = { id: studentRecord.id, role: 'student', teacherId: invitation.account.id };
    const seeded = store.createAttempt(studentAuth, { opId: require('node:crypto').randomUUID(), trainerId: 'ege-path', contentId: 'equations-linear' }).attempt;
    store.action(studentAuth, seeded.id, { opId: require('node:crypto').randomUUID(), expectedVersion: seeded.version,
      type: 'hint', payload: { step: 0 } });
    const educationalBefore = { attempt: store.row('SELECT * FROM attempts WHERE id=?', seeded.id), history: store.history(invitation.account, seeded.id) };
    const teacherBeforeReset = store.account(invitation.account.id);
    const teacherSessionsBeforeReset = store.rows('SELECT * FROM sessions WHERE account_id=? ORDER BY hash', invitation.account.id);
    const pupilCountBeforeReset = store.rows("SELECT id FROM accounts WHERE role='student' ORDER BY id");
    const pupilContext = await browser.newContext({ locale: 'ru-RU' });
    const pupilPage = await pupilContext.newPage();
    await pupilPage.goto(origin + '/learning/#route');
    await pupilPage.locator('#auth-form [name=login]').fill(issued.login);
    await pupilPage.locator('#auth-form [name=password]').fill(issued.password);
    assert.equal((await submit(pupilPage, 'login')).status(), 200);
    await pupilPage.locator('#logout').waitFor();
    await page.locator('[data-nav=students]').click();
    await page.locator('[data-reset-login="' + studentRecord.id + '"]').click();
    await page.locator('#student-password-form').waitFor();
    assert.match(await page.locator('#student-password-form [name=password]').inputValue(), /^\d{4}$/);
    const resetPassword = '0173', lostPassword = '0284', finalPassword = '0395';
    const resetURL = '**/api/learning/teacher/students/' + studentRecord.id + '/password';
    let releasePupilReset, markPupilResetCommitted;
    const pupilResetCommitted = new Promise(resolve => { markPupilResetCommitted = resolve; });
    const pupilResetGate = new Promise(resolve => { releasePupilReset = resolve; });
    await page.route(resetURL, async route => {
      const response = await route.fetch();
      assert.equal(response.status(), 200);
      markPupilResetCommitted();
      await pupilResetGate;
      await route.fulfill({ response });
    }, { times: 1 });
    await page.locator('#student-password-form [name=password]').fill(resetPassword);
    const resetResponsePromise = page.waitForResponse(response => response.url().endsWith('/teacher/students/' + studentRecord.id + '/password')
      && response.request().method() === 'POST');
    await page.locator('#student-password-form [type=submit]').click();
    await pupilResetCommitted;
    try {
      assert.equal(await page.locator('#student-password-form [name=password]').inputValue(), '', 'The password input clears immediately after submission');
      assert.equal(await page.locator('#student-password-form [type=submit]').isDisabled(), true);
      if (await page.locator('#dialog-close').count()) assert.equal(await page.locator('#dialog-close').isDisabled(), true);
      await page.keyboard.press('Escape');
      await page.mouse.click(1, 1);
      await page.evaluate(() => LearningApp.navigate('security'));
      await page.waitForFunction(() => location.hash === '#security');
      await page.evaluate(() => LearningApp.refresh());
      await page.evaluate(() => document.querySelector('#logout').click());
      assert.equal(await page.locator('#modal').evaluate(node => node.open), true, 'Pending password replacement cannot be accidentally dismissed');
      assert.equal(await page.locator('#student-password-form').count(), 1);
      assert.equal(await page.locator('#recovery-rotate-form,#student-form,#access-password').count(), 0,
        'Navigation cannot open another credential form before the password response');
      assert.equal(await page.evaluate(() => LearningApp.account().id), invitation.account.id);
      assert.equal(await page.evaluate(() => {
        const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented;
      }), true, 'Reload warns while a pupil password is being issued');
    } finally { releasePupilReset(); }
    const resetResponse = await resetResponsePromise;
    assert.equal(resetResponse.status(), 200);
    assert.deepEqual(resetResponse.request().postDataJSON(), { password: resetPassword });
    const resetBody = await resetResponse.json();
    assert.deepEqual(Object.keys(resetBody), ['student']);
    assert.equal(resetBody.student.id, studentRecord.id);
    assert.equal(JSON.stringify(resetBody).includes(resetPassword), false);
    await page.locator('#access-password').waitFor();
    await assertAccessRemains(page, issued.login, resetPassword);
    assert.equal((await pupilContext.request.get(origin + '/api/learning/session')).status(), 401, 'The old pupil session is revoked');
    assert.deepEqual(store.account(invitation.account.id), teacherBeforeReset, 'Pupil reset does not modify the teacher account');
    assert.deepEqual(store.rows('SELECT * FROM sessions WHERE account_id=? ORDER BY hash', invitation.account.id), teacherSessionsBeforeReset,
      'Pupil reset preserves the teacher session');
    await accessCardGuards(page, issued.login, resetPassword);
    await acknowledgeAccess(page);
    await privateState(page, [resetPassword]);
    await pupilPage.goto(origin + '/learning/');
    await pupilPage.locator('#auth-form [name=login]').fill(issued.login);
    await pupilPage.locator('#auth-form [name=password]').fill(issued.password);
    assert.equal((await submit(pupilPage, 'login')).status(), 401, 'The replaced password no longer logs in');
    await pupilPage.locator('#auth-form [name=password]').fill(resetPassword);
    assert.equal((await submit(pupilPage, 'login')).status(), 200, 'The newly issued password logs into the same account');
    await pupilPage.locator('#logout').waitFor();
    assert.equal(await pupilPage.evaluate(() => LearningApp.account().id), studentRecord.id);
    await pupilContext.close();

    // A committed reset whose HTTP response is lost can be repeated on that same pupil without duplication.
    await page.locator('[data-reset-login="' + studentRecord.id + '"]').click();
    let markLostPupilCommitted;
    const lostPupilCommitted = new Promise(resolve => { markLostPupilCommitted = resolve; });
    await page.route(resetURL, async route => {
      const response = await route.fetch();
      assert.equal(response.status(), 200);
      markLostPupilCommitted();
      await route.abort('failed');
    }, { times: 1 });
    await page.locator('#student-password-form [name=password]').fill(lostPassword);
    await page.locator('#student-password-form [type=submit]').click();
    await lostPupilCommitted;
    await page.waitForFunction(() => !document.querySelector('#student-password-form [type=submit]')?.disabled);
    assert.equal(await page.locator('#access-password').count(), 0, 'A lost response does not fabricate an access card');
    assert.equal(await page.locator('#student-password-form [name=password]').inputValue(), '');
    assert.match(await page.locator('#student-password-form .form-error').innerText(), /связ|ответ|повтор/i);
    assert.deepEqual(store.rows("SELECT id FROM accounts WHERE role='student' ORDER BY id"), pupilCountBeforeReset);
    await page.locator('#dialog-close').click();
    await page.reload();
    await page.locator('[data-reset-login="' + studentRecord.id + '"]').click();
    await page.locator('#student-password-form [name=password]').fill(finalPassword);
    const retryPupilResponse = page.waitForResponse(response => response.url().endsWith('/teacher/students/' + studentRecord.id + '/password')
      && response.request().method() === 'POST');
    await page.locator('#student-password-form [type=submit]').click();
    assert.equal((await retryPupilResponse).status(), 200);
    await page.locator('#access-password').waitFor();
    await assertAccessRemains(page, issued.login, finalPassword);
    assert.deepEqual(store.rows("SELECT id FROM accounts WHERE role='student' ORDER BY id"), pupilCountBeforeReset, 'Retry keeps one cabinet per pupil');
    assert.deepEqual({ attempt: store.row('SELECT * FROM attempts WHERE id=?', seeded.id), history: store.history(invitation.account, seeded.id) }, educationalBefore,
      'All password reissues preserve the exact attempt and event history');
    assert.equal(await page.locator('#access-discard-confirm,#discard-access').count(), 0);
    assert.equal(await page.locator('#close-access').isDisabled(), false);
    await page.locator('#close-access').click();
    await page.locator('#access-password').waitFor({ state: 'detached' });
    await privateState(page, [resetPassword, lostPassword, finalPassword]);
    issued.password = finalPassword;
    for (const secret of [resetPassword, lostPassword, finalPassword, ...originalPupilPasswords]) {
      for (const request of credentialRequests.slice(pupilCredentialRequestStart).filter(request => request.body.includes(secret))) {
        assert.match(request.path, /^\/api\/learning\/(teacher\/students(?:\/[A-Za-z0-9_-]+\/password)?|login)$/,
          'Raw pupil passwords appear only in their designated credential mutation, never trainer/history requests');
      }
    }
    await page.locator('#logout').click();
    for (const pupilCredentials of pupilPasswords) {
      await page.goto(origin + '/learning/#route');
      await page.getByRole('heading', { name: 'Войти в кабинет', exact: true }).waitFor();
      await page.locator('#auth-form [name=login]').fill(pupilCredentials.login);
      await page.locator('#auth-form [name=password]').fill(pupilCredentials.password);
      assert.equal((await submit(page, 'login')).status(), 200, 'The issued four-digit password can log in');
      await page.getByRole('heading', { name: 'Мой маршрут', exact: true }).waitFor();
      assert.equal(await page.evaluate(() => LearningApp.account().login), pupilCredentials.login);
      assert.equal(await page.evaluate(() => LearningApp.account().role), 'student');
      assert.equal(await page.locator('[data-nav=security]').count(), 0, 'A pupil never receives the teacher security page');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await privateState(page, [pupilCredentials.password]);
      if (await page.locator('[data-mw-close]').count()) await page.locator('[data-mw-close]').click();
      await page.locator('#logout').click();
      await page.getByRole('heading', { name: 'Войти в кабинет', exact: true }).waitFor();
    }

    // Student invitation activation preserves a leading zero and the confirmation follows the same minimum.
    const invitedPassword = '0257';
    await enterInvite(page, pupil.invitationToken);
    assert.equal(await page.locator('#auth-form [name=password]').getAttribute('minlength'), '4');
    assert.equal(await page.locator('#auth-form [name=confirm]').getAttribute('minlength'), '4');
    await setPassword(page, invitedPassword);
    assert.equal((await submit(page, 'activate')).status(), 200);
    await page.locator('#logout').waitFor();
    assert.equal(await page.evaluate(() => LearningApp.account().id), pupil.student.id);
    assert.equal(await page.locator('#recovery-codes').count(), 0, 'Pupil activation does not issue teacher recovery codes');
    await privateState(page, [pupil.invitationToken, invitedPassword]);
    if (await page.locator('[data-mw-close]').count()) await page.locator('[data-mw-close]').click();
    await page.locator('#logout').click();
    await page.getByRole('heading', { name: 'Войти в кабинет', exact: true }).waitFor();
    await page.locator('#auth-form [name=login]').fill('fixture_auth_pupil');
    await page.locator('#auth-form [name=password]').fill(invitedPassword);
    assert.equal((await submit(page, 'login')).status(), 200);
    await page.locator('#logout').waitFor();
    assert.equal(await page.evaluate(() => LearningApp.account().id), pupil.student.id);
    if (await page.locator('[data-mw-close]').count()) await page.locator('[data-mw-close]').click();
    await page.locator('#logout').click();
    await page.getByRole('heading', { name: 'Войти в кабинет', exact: true }).waitFor();

    // Teacher recovery accepts a four-digit string, preserves its leading zero,
    // and finishes in the cabinet without opening another code-setting form.
    await page.getByRole('button', { name: 'Не помню код входа', exact: true }).click();
    assert.equal(await page.locator('#auth-form [name=password]').getAttribute('minlength'), '4');
    assert.equal(await page.locator('#auth-form [name=confirm]').getAttribute('maxlength'), '4');
    await page.locator('#auth-form [name=login]').fill(LOGIN);
    await page.locator('#auth-form [name=code]').fill(retryCodes[0]);
    await setPassword(page, '048');
    const beforeRecoveryMinimum = mutations.length;
    await page.locator('#auth-form [type=submit]').click();
    assert.equal(await page.locator('#auth-form [name=password]').evaluate(node => node.validity.valid), false);
    assert.equal(mutations.length, beforeRecoveryMinimum);
    assert.equal(store.recovery(LOGIN, retryCodes[0]).account.id, invitation.account.id,
      'A rejected code leaves the recovery proof unused');
    await setPassword(page, PASSWORD);
    assert.equal((await submit(page, 'recover')).status(), 200);
    await page.locator('#logout').waitFor();
    assert.equal(await page.evaluate(() => LearningApp.account().id), invitation.account.id);
    assert.equal(await page.locator('#auth-form,#teacher-password-form').count(), 0,
      'Successful recovery immediately enters the cabinet, without mandatory reset');
    assert.equal(mutations.length, beforeRecoveryMinimum + 1, 'Recovery sends exactly one credential request');

    // A persisted page lifecycle during a real pending request must restore usable controls and ignore its stale response.
    await page.locator('[data-nav=security]').click();
    await openRecoveryOptions(page);
    const frozenRecoveryForm = await page.locator('#recovery-rotate-form').elementHandle();
    let releaseLifecycleResponse, markLifecycleCommitted;
    const lifecycleCommitted = new Promise(resolve => { markLifecycleCommitted = resolve; });
    const lifecycleResponseGate = new Promise(resolve => { releaseLifecycleResponse = resolve; });
    await page.route('**/api/learning/teacher/recovery-codes', async route => {
      const response = await route.fetch();
      assert.equal(response.status(), 200);
      markLifecycleCommitted();
      await lifecycleResponseGate;
      await route.fulfill({ response });
    }, { times: 1 });
    const lifecycleResponse = rotateCodes(page, PASSWORD);
    await lifecycleCommitted;
    try {
      await page.evaluate(() => {
        window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
      });
      await page.waitForFunction(() => {
        const form = document.querySelector('#recovery-rotate-form');
        return form && !form.querySelector('[type=submit]').disabled && form.elements.password.value === '';
      });
      assert.equal(await page.locator('#recovery-rotate-form').evaluate((node, old) => node !== old, frozenRecoveryForm), true,
        'A persisted return replaces the stale disabled credential form');
      assert.equal(await page.locator('#modal').evaluate(node => node.open), false);
    } finally { releaseLifecycleResponse(); await frozenRecoveryForm.dispose(); }
    const staleLifecycleResponse = await lifecycleResponse;
    await staleLifecycleResponse.finished();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.locator('#recovery-codes').count(), 0, 'A response from before pagehide cannot resurrect private codes');
    const lifecycleRetry = await rotateCodes(page, PASSWORD);
    assert.equal(lifecycleRetry.status(), 200, 'Restored recovery controls permit a new issuance');
    const lifecycleCodes = (await lifecycleRetry.json()).recoveryCodes;
    await page.locator('#recovery-codes').waitFor();
    await assertCodesRemain(page, lifecycleCodes);
    await acknowledgeCodes(page);
    await privateState(page, lifecycleCodes);
    await context.close();
    assert.deepEqual(nonlocalRequests, []);
    assert.deepEqual(pageErrors, []);
    console.log('LEARNING_AUTH_BROWSER_OK: real HTTP/SQLite activation, login, session guards, safe recovery-code reissue, guarded one-time card, private download/copy, lost-response retry, guarded pupil copy with denied-clipboard selection fallback, password reissue with preserved history, four-digit pupil creation/login/invitation with leading zeros, teacher four-digit activation/recovery guards and 390px layout');
  } finally {
    if (browser) await browser.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
