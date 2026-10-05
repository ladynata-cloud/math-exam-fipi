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
const PASSWORD = 'SyntheticAuthPassword2026';
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
  const pageErrors = [], mutations = [], nonlocalRequests = [];
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
    page.on('request', request => { if (request.method() === 'POST') mutations.push(new URL(request.url()).pathname); });
    page.setDefaultTimeout(10000);
    await page.goto(origin + '/learning/');
    await page.getByRole('heading', { name: 'Войти в кабинет', exact: true }).waitFor();
    const documentId = await page.evaluate(() => { window.authFixtureDocument = crypto.randomUUID(); return window.authFixtureDocument; });
    await enterInvite(page, WRONG_TOKEN);
    assert.equal(await page.evaluate(() => window.authFixtureDocument), documentId, 'Opening the invite keeps the same document');
    await setPassword(page, PASSWORD);
    assert.equal((await submit(page, 'activate')).status(), 401);
    const activationError = await waitForError(page, 'Менять пароль из-за этой ошибки не нужно');
    assert.match(activationError, /Приглашение недействительно/);
    assert.match(activationError, /перейдите ко входу/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Long invitation advice fits a phone');
    await privateState(page, [WRONG_TOKEN]);

    // Matching and password format are independent of invitation validity.
    await enterInvite(page, invitation.invitationToken);
    const beforeValidation = mutations.length;
    await setPassword(page, PASSWORD, PASSWORD + 'Different');
    await page.locator('#auth-form [type=submit]').click();
    assert.equal(await waitForError(page, 'Пароли не совпадают'), 'Пароли не совпадают.');
    assert.equal(mutations.length, beforeValidation, 'Mismatched passwords never reach the server');
    await setPassword(page, 'short123');
    await page.locator('#auth-form [type=submit]').click();
    assert.equal(await page.locator('#auth-form [name=password]').evaluate(input => input.validity.tooShort), true);
    assert.equal(mutations.length, beforeValidation, 'The native length constraint blocks a short password');

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
    await page.getByRole('button', { name: 'Не помню пароль', exact: true }).click();
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
    assert.equal((await page.locator('#recovery-codes').innerText()).split('\n').length, 8, 'First activation still presents all recovery codes if loading the cabinet fails');
    await page.locator('#done-codes').click();
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
    await context.close();
    assert.deepEqual(nonlocalRequests, []);
    assert.deepEqual(pageErrors, []);
    console.log('LEARNING_AUTH_BROWSER_OK: same-document invite, distinct safe auth errors, password validation, ordinary login, recovery, session guards, token scrubbing and mobile layout');
  } finally {
    if (browser) await browser.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
