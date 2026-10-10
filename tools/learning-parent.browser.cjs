'use strict';

// Synthetic identities and disposable SQLite only. Spawn the real production
// index.js so middleware order, parent routes and cabinet CSP are all exercised.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createRequire } = require('node:module');
const ROOT = path.resolve(__dirname, '..');
const serverRequire = createRequire(path.join(ROOT, 'board-server/package.json'));
const express = serverRequire('express');
const { LearningStore } = require('../board-server/learning-store');
const contracts = require('../board-server/learning-contracts');
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) {
  ({ chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright')));
}
const TEACHER_PASSWORD = '0371';
const CHILD_PASSWORD = '0493';
const PARENT_PASSWORD = '0629';
const uuid = () => crypto.randomUUID();
const api = (page, route, body) => page.evaluate(async ({ route, body }) => LearningApp.api(route,
  body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }), { route, body });
const raw = (page, route, body, csrfToken) => page.evaluate(async ({ route, body, csrfToken }) => {
  const response = await fetch('/api/learning' + route, { method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json', ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, body: await response.json() };
}, { route, body, csrfToken });
async function waitUntil(read, accept, label) {
  const until = Date.now() + 20000; let value, lastError;
  while (Date.now() < until) {
    try { value = await read(); if (accept(value)) return value; } catch (error) { lastError = error; }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw Error(label + ' did not complete' + (lastError ? ': ' + lastError.message : ''));
}
async function freePort() {
  const server = net.createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port;
}
async function privateState(page, secrets, { markup = true } = {}) {
  const stored = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
  const html = markup ? await page.locator('body').innerHTML() : '';
  for (const secret of secrets) {
    assert(!page.url().includes(secret), 'Bearer invitation is scrubbed from the URL');
    assert(!stored.includes(secret), 'Credentials stay out of browser storage');
    assert(!html.includes(secret), 'Closed cards and authenticated pages contain no bearer invitation or password');
  }
}
const frame = page => page.frameLocator('#trainer-host iframe');
async function ready(page) {
  await page.locator('#trainer-host iframe').waitFor();
  await page.waitForFunction(() => document.querySelector('#trainer-host .frame-status')?.hidden);
}
const saved = page => page.waitForFunction(() => document.querySelector('#save-state')?.textContent === 'Все изменения сохранены');

async function main() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-parent-'));
  const filePath = path.join(directory, 'learning.sqlite');
  const store = new LearningStore({ filePath, contracts }); assert(store.available);
  const invitation = store.bootstrap({ name: 'Проверочный преподаватель', login: 'fixture_family_teacher' }); store.close();
  const trainer = express(); trainer.use(express.static(ROOT));
  const trainerServer = trainer.listen(0, '127.0.0.1'); await once(trainerServer, 'listening');
  const trainerOrigin = 'http://127.0.0.1:' + trainerServer.address().port;
  const port = await freePort(), origin = 'http://127.0.0.1:' + port;
  // Do not inherit any operator bootstrap secret or production storage path.
  const child = spawn(process.execPath, ['index.js'], { cwd: path.join(ROOT, 'board-server'),
    env: { PATH: process.env.PATH, NODE_ENV: 'test', HOST: '127.0.0.1', PORT: String(port),
      LEARNING_DB_PATH: filePath, LEARNING_LOCAL_DEV: '1', LEARNING_PUBLIC_ORIGIN: origin,
      LEARNING_TRAINER_ORIGIN: trainerOrigin, GROUP_LESSON_STORE_DIR: path.join(directory, 'group-lessons') },
    stdio: ['ignore', 'pipe', 'pipe'] });
  let startupLog = ''; child.stdout.on('data', value => { startupLog = (startupLog + value).slice(-5000); });
  child.stderr.on('data', value => { startupLog = (startupLog + value).slice(-5000); });
  let browser;
  const pageErrors = [], externalRequests = [], requests = [], tokens = [];
  try {
    await waitUntil(async () => {
      if (child.exitCode !== null) throw Error('Production index exited: ' + startupLog);
      const response = await fetch(origin + '/api/learning/status'); return response.ok && await response.json();
    }, value => value?.available, 'Real server startup');
    browser = await chromium.launch({ headless: true,
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM_EXECUTABLE,
      args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    async function open(viewport = { width: 1280, height: 960 }) {
      const context = await browser.newContext({ viewport, locale: 'ru-RU' });
      context.on('request', request => requests.push({ url: request.url(), referrer: request.headers().referer || '' }));
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (['127.0.0.1', 'localhost'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
        externalRequests.push(url.origin + url.pathname); return route.abort('blockedbyclient');
      });
      context.on('page', page => { page.setDefaultTimeout(15000); page.on('pageerror', error => pageErrors.push(error.message)); });
      const page = await context.newPage();
      return { context, page };
    }
    const teacher = await open(), tp = teacher.page;
    await tp.goto(origin + '/learning/#invite=' + invitation.invitationToken);
    await tp.locator('#auth-form [name=password]').fill(TEACHER_PASSWORD);
    await tp.locator('#auth-form [name=confirm]').fill(TEACHER_PASSWORD);
    await tp.locator('#auth-form [type=submit]').click();
    await tp.locator('#recovery-saved').check(); await tp.locator('#done-codes').click();
    await tp.locator('#navigation').waitFor();
    const teacherId = (await api(tp, '/session')).account.id;
    const created = await api(tp, '/teacher/students', { name: 'Проверочный ребёнок', login: 'fixture_family_child' });
    const pupil = created.student;
    const peer = (await api(tp, '/teacher/students', { name: 'PRIVATE_OTHER_CHILD', login: 'fixture_family_peer' })).student;
    await api(tp, '/teacher/students/' + pupil.id + '/profile', {
      opId: uuid(), expectedVersion: 0, course: 'oge', goal: 'pass', focus: 'PRIVATE_TEACHER_FOCUS'
    });
    const student = await open({ width: 390, height: 844 }), sp = student.page;
    await sp.goto(origin + '/learning/#invite=' + created.invitationToken);
    await sp.locator('#auth-form [name=password]').fill(CHILD_PASSWORD);
    await sp.locator('#auth-form [name=confirm]').fill(CHILD_PASSWORD);
    await sp.locator('#auth-form [type=submit]').click(); await sp.locator('#navigation').waitFor();
    assert.equal((await api(sp, '/session')).account.id, pupil.id, 'The pupil chooses their own four-digit code with the leading zero preserved');
    const fixture = await seedWork({ tp, sp, pupil, peer });
    await verifyReadyParent({ teacher, teacherId, origin, open });
    await verifyParent({ teacher, teacherId, student, pupil, peer, origin, open, tokens, fixture });
    for (const request of requests) for (const token of tokens) {
      assert(!request.url.includes(token), 'Parent invitation does not enter request URLs');
      assert(!request.referrer.includes(token), 'Parent invitation does not enter Referrer headers');
    }
    assert.deepEqual(pageErrors, []); assert.deepEqual(externalRequests, []);
    console.log('LEARNING_PARENT_BROWSER_OK: teacher-issued ready four-digit code and reset; login-prefilled entry without activation; plain Done and private clipboard fallback; lost ACK metadata-only without automatic POST; animated parent login pending through overview with duplicate guard and error retry; optional self-activation retained; production routing and read-only overview; published work and accurate progress; private data excluded; separate simultaneous cookies; two devices, password reset, logout and revocation; guarded invitations and lost ACK; 390px.');
  } finally {
    if (browser) await browser.close();
    if (child.exitCode === null && child.signalCode === null) { child.kill('SIGTERM'); await once(child, 'exit'); }
    trainerServer.closeAllConnections(); await new Promise(resolve => trainerServer.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

async function verifyReadyParent({ teacher, teacherId, origin, open }) {
  const tp = teacher.page;
  const pupil = (await api(tp, '/teacher/students', { name: 'Готовый семейный вход', login: 'fixture_ready_family' })).student;
  const metadataPath = '/teacher/students/' + pupil.id + '/parent-access';
  const passwordPath = '/api/learning' + metadataPath + '/password';
  const pin = '0752', replacement = '0836', uncertainPin = '0947';
  let passwordPosts = 0;
  tp.on('request', request => { if (request.url().endsWith(passwordPath) && request.method() === 'POST') passwordPosts++; });
  async function settings() {
    await tp.evaluate(() => LearningApp.navigate('students')); await tp.evaluate(() => LearningApp.refresh());
    await tp.locator('[data-parent-access="' + pupil.id + '"]').click();
    await tp.locator('#parent-settings').waitFor();
    assert.equal(await tp.locator('#parent-invitation-options').getAttribute('open'), null,
      'Legacy invitations are an optional closed section');
  }
  async function issue(code, expectedVersion) {
    await tp.locator('#parent-password-form [name=password]').fill(code);
    const response = tp.waitForResponse(response => response.url().endsWith(passwordPath));
    await tp.locator('#parent-password-form [type=submit]').click();
    const result = await response;
    assert.equal(result.status(), 200);
    assert.deepEqual(result.request().postDataJSON(), { name: 'Готовый родитель', password: code, expectedVersion });
    const body = await result.json(); assert.deepEqual(Object.keys(body), ['parentAccess']);
    assert.equal(body.parentAccess.active, true); assert.equal(body.parentAccess.enabled, true);
    assert.equal(body.parentAccess.invitationExpiresAt, null); assert.equal(body.parentAccess.version, expectedVersion + 1);
    assert(!JSON.stringify(body).includes(code), 'The server never echoes the chosen code');
    await tp.locator('#parent-ready-password').waitFor();
    return body.parentAccess;
  }
  async function closeReady(code, loginName) {
    const link = origin + '/learning/parent.html#login=' + loginName;
    assert.equal(await tp.locator('#parent-ready-link').inputValue(), link);
    assert.equal(await tp.locator('#parent-ready-login').inputValue(), loginName);
    assert.equal(await tp.locator('#parent-ready-password').inputValue(), code);
    assert.equal(await tp.locator('#parent-ready-done').isDisabled(), false, 'The ready card closes with plain Done');
    assert.equal(await tp.locator('#modal input[type=checkbox]').count(), 0, 'Ready access has no save-confirmation checkboxes');
    await tp.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true,
      value: { writeText: async () => { throw Error('Synthetic clipboard denied'); } } }));
    await tp.locator('#copy-parent-ready').click(); await tp.locator('#parent-ready-copy-text').waitFor({ state: 'visible' });
    const fallback = await tp.locator('#parent-ready-copy-text').inputValue();
    assert(fallback.includes(link) && fallback.includes(loginName) && fallback.includes(code));
    await tp.locator('#select-parent-ready').click();
    assert.equal(await tp.locator('#parent-ready-copy-text').evaluate(node => node === document.activeElement
      && node.selectionStart === 0 && node.selectionEnd === node.value.length), true);
    await privateState(tp, [code], { markup: false });
    const secret = await tp.locator('#parent-ready-password').elementHandle();
    const copy = await tp.locator('#parent-ready-copy-text').elementHandle();
    await tp.locator('#parent-ready-done').click();
    await tp.locator('#parent-ready-password').waitFor({ state: 'detached' });
    assert.equal(await secret.evaluate(node => node.value), ''); assert.equal(await copy.evaluate(node => node.value), '');
    await secret.dispose(); await copy.dispose(); await privateState(tp, [code]);
    return link;
  }
  await settings();
  for (const close of ['escape', 'button']) {
    await tp.locator('#parent-password-form [name=password]').fill(pin);
    const detachedPin = await tp.locator('#parent-password-form [name=password]').elementHandle();
    if (close === 'escape') await tp.keyboard.press('Escape');
    else await tp.locator('#dialog-close').click();
    await tp.waitForFunction(() => !document.querySelector('#modal').open);
    assert.equal(await detachedPin.evaluate(node => node.value), '',
      'Both native Escape and the explicit close button clear detached parent-code inputs');
    await detachedPin.dispose(); await settings();
  }
  await tp.locator('#parent-password-form').waitFor();
  assert.match(await tp.locator('#parent-password-form [name=password]').inputValue(), /^[0-9]{4}$/);
  for (const [attribute, value] of Object.entries({ minlength: '4', maxlength: '4', pattern: '[0-9]{4}', inputmode: 'numeric' })) {
    assert.equal(await tp.locator('#parent-password-form [name=password]').getAttribute(attribute), value);
  }
  await tp.locator('#parent-password-form [name=name]').fill('Готовый родитель');
  await tp.locator('#parent-password-form [name=password]').fill('075');
  await tp.locator('#parent-password-form [type=submit]').click();
  assert.equal(passwordPosts, 0, 'A short parent code is rejected before POST');
  const access = await issue(pin, 0), link = await closeReady(pin, access.login);
  assert.equal(passwordPosts, 1);
  const pp = (await open({ width: 390, height: 844 })).page;
  await pp.goto(link); await pp.locator('#parent-auth-form[data-mode=login]').waitFor();
  assert.equal(await pp.locator('#parent-login').inputValue(), access.login);
  assert.equal(await pp.locator('[name=confirm]').count(), 0, 'Ready parent entry asks only for the existing code');
  assert.equal(await pp.locator('#parent-password').inputValue(), '');

  let loginPosts = 0, heldLogin, markLogin;
  const loginHeld = new Promise(resolve => { markLogin = resolve; });
  pp.on('request', request => { if (request.url().endsWith('/api/learning/parent/login') && request.method() === 'POST') loginPosts++; });
  await pp.route('**/api/learning/parent/login', route => { heldLogin = route; markLogin(); }, { times: 1 });
  async function busy() {
    await pp.locator('#parent-auth-progress').waitFor({ state: 'visible' });
    assert.match(await pp.locator('#parent-auth-progress').innerText(), /Входим/);
    assert.equal(await pp.locator('#parent-auth-progress').getAttribute('role'), 'status');
    assert.equal(await pp.locator('#parent-auth-progress .login-dot').count(), 3);
    assert.equal(await pp.locator('#parent-auth-progress .login-dot').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).animationName !== 'none')), true);
    assert.equal(await pp.locator('#parent-auth-form').getAttribute('aria-busy'), 'true');
    assert.equal(await pp.locator('#main').getAttribute('aria-busy'), 'true');
    assert.equal(await pp.locator('#parent-auth-submit').isDisabled(), true);
  }
  await pp.locator('#parent-password').fill('9999'); await pp.locator('#parent-auth-submit').click(); await loginHeld;
  await busy();
  if (process.env.LEARNING_QA_DIR) {
    fs.mkdirSync(process.env.LEARNING_QA_DIR, { recursive: true });
    await pp.screenshot({ path: path.join(process.env.LEARNING_QA_DIR, 'parent-login-busy.png'), fullPage: true });
  }
  await pp.evaluate(() => document.querySelector('#parent-auth-form').requestSubmit());
  await pp.keyboard.press('Enter'); assert.equal(loginPosts, 1, 'Repeated submits cannot duplicate a pending parent login');
  await heldLogin.continue(); await pp.locator('#parent-auth-error').filter({ hasText: /.+/ }).waitFor();
  assert.equal(await pp.locator('#parent-auth-submit').isEnabled(), true);
  assert.notEqual(await pp.locator('#parent-auth-form').getAttribute('aria-busy'), 'true');
  assert.notEqual(await pp.locator('#main').getAttribute('aria-busy'), 'true');
  assert.equal(await pp.locator('#parent-auth-progress').isVisible(), false);
  let heldOverview, markOverview;
  const overviewHeld = new Promise(resolve => { markOverview = resolve; });
  await pp.route('**/api/learning/parent/overview', route => { heldOverview = route; markOverview(); }, { times: 1 });
  await pp.locator('#parent-password').fill(pin); await pp.locator('#parent-auth-submit').click(); await overviewHeld;
  await busy(); assert.equal(loginPosts, 2, 'Error recovery permits exactly one explicit login retry');
  await heldOverview.continue(); await pp.locator('#parent-overview').waitFor();
  assert.equal(await pp.locator('#parent-auth-form').count(), 0);
  assert.equal(await pp.locator('#parent-auth-progress').isVisible(), false);
  assert.notEqual(await pp.locator('#main').getAttribute('aria-busy'), 'true');
  assert.equal((await raw(pp, '/parent/session')).body.parent.login, access.login);
  await privateState(pp, [pin]);
  await settings();
  assert.equal(await tp.locator('#parent-password-form').count(), 0, 'Opening active parent access is read-only');
  assert.equal(await tp.locator('#parent-access-login').inputValue(), access.login);
  assert.equal(passwordPosts, 1);
  await tp.locator('#change-parent-password').click(); await tp.locator('#parent-password-form').waitFor();
  const reset = await issue(replacement, access.version); await closeReady(replacement, access.login);
  assert.equal(reset.login, access.login); assert.equal((await raw(pp, '/parent/session')).status, 401,
    'Reset revokes the old independent parent session');
  await pp.reload(); await pp.locator('#parent-auth-form[data-mode=login]').waitFor();
  await pp.locator('#parent-password').fill(pin); await pp.locator('#parent-auth-submit').click();
  await pp.locator('#parent-auth-error').filter({ hasText: /.+/ }).waitFor();
  await pp.locator('#parent-password').fill(replacement); await pp.locator('#parent-auth-submit').click();
  await pp.locator('#parent-overview').waitFor();
  assert.equal((await api(tp, '/session')).account.id, teacherId);

  // The server may commit while the response is lost. Only metadata may be
  // refreshed: no guessed ready card, automatic resubmission or PIN retention.
  await settings(); await tp.locator('#change-parent-password').click();
  await tp.locator('#parent-password-form [name=password]').fill(uncertainPin);
  await tp.route('**' + passwordPath, async route => {
    const response = await route.fetch(); assert.equal(response.status(), 200); await route.abort('failed');
  }, { times: 1 });
  const beforeLost = passwordPosts;
  await tp.locator('#parent-password-form [type=submit]').click();
  await tp.locator('[data-parent-message]').filter({ hasText: 'Ответ о сохранении не получен' }).waitFor();
  assert.equal(passwordPosts, beforeLost + 1);
  assert.equal(await tp.locator('#parent-ready-password').count(), 0);
  const afterLost = (await api(tp, metadataPath)).parentAccess;
  assert.equal(afterLost.active, true); assert.equal(afterLost.version, reset.version + 1); assert.equal(afterLost.login, access.login);
  await privateState(tp, [pin, replacement, uncertainPin]);
  await tp.locator('#dialog-close').click(); await settings();
  assert.equal(passwordPosts, beforeLost + 1, 'Reopening metadata never resubmits a lost response');
  assert.equal(await tp.locator('#parent-password-form,#parent-ready-password').count(), 0);
  await tp.locator('#dialog-close').click();
  await pp.context().close();
}

async function seedWork({ tp, sp, pupil, peer }) {
  const published = (await api(tp, '/assignments', { opId: uuid(), learnerIds: [pupil.id],
    title: 'Опубликованная домашняя работа', trainerId: 'ege-path', contentId: 'pre7-place-value' })).assignments[0];
  await api(tp, '/assignments/' + published.id + '/paper', { opId: uuid(), topic: 'fractions' });
  await api(tp, '/assignments/' + published.id + '/publish', { opId: uuid() });
  const draft = (await api(tp, '/assignments', { opId: uuid(), learnerIds: [pupil.id],
    title: 'PRIVATE_DRAFT_HOMEWORK', trainerId: 'ege-path', contentId: 'pre7-natural-compare' })).assignments[0];
  await api(tp, '/teacher/students/' + pupil.id + '/plan', {
    opId: uuid(), items: [{ catalogId: 'path:pre7-place-value', reason: 'PRIVATE_PLAN_REASON', priority: 'high' }], note: 'PRIVATE_PLAN_NOTE'
  });
  await api(tp, '/teacher/students/' + pupil.id + '/ai-drafts', {
    opId: uuid(), recommendations: [{ catalogId: 'path:pre7-place-value', reason: 'PRIVATE_AI_REASON', priority: 'normal' }],
    parentNote: 'PRIVATE_UNAPPROVED_AI_PARENT_NOTE'
  });
  await sp.goto(new URL('/learning/#attempt=' + published.attemptId, tp.url()).href); await ready(sp);
  const attempt = await api(sp, '/attempts/' + published.attemptId);
  await frame(sp).locator('#answer').fill(contracts.expectedText(attempt.taskSpec)); await saved(sp);
  await frame(sp).locator('#answerForm button.primary').click();
  await waitUntil(() => api(sp, '/attempts/' + published.attemptId), result => result.outcome === 'independent', 'Server-checked independent solution');
  const loose = (await api(sp, '/attempts', { opId: uuid(), trainerId: 'ege-path', contentId: 'pre7-add-carry' })).attempt;
  await sp.evaluate(id => LearningApp.navigate('attempt=' + id), loose.id); await ready(sp);
  await frame(sp).locator('#answer').fill('PRIVATE_CHILD_RAW_ANSWER'); await saved(sp);
  const photoData = await tp.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 100;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 160, 100); ctx.fillStyle = '#123';
    ctx.fillText('Synthetic photo', 5, 30); return canvas.toDataURL('image/png').split(',')[1];
  });
  await api(tp, '/assignments/' + draft.id + '/photos', {
    opId: uuid(), kind: 'task', filename: 'PRIVATE_PHOTO_NAME.png', mime: 'image/png', data: photoData
  });
  const draftDetails = await api(tp, '/assignments/' + draft.id);
  return { published, draft, loose, photoId: draftDetails.photos[0].id,
    hidden: ['PRIVATE_TEACHER_FOCUS', 'PRIVATE_DRAFT_HOMEWORK', 'PRIVATE_PLAN_REASON', 'PRIVATE_PLAN_NOTE',
      'PRIVATE_AI_REASON', 'PRIVATE_UNAPPROVED_AI_PARENT_NOTE', 'PRIVATE_CHILD_RAW_ANSWER', 'PRIVATE_PHOTO_NAME', peer.name] };
}

async function verifyParent({ teacher, teacherId, student, pupil, peer, origin, open, tokens, fixture }) {
  const tp = teacher.page, sp = student.page, metadataPath = '/teacher/students/' + pupil.id + '/parent-access';
  const learningCookie = async context => (await context.cookies(origin)).find(cookie => cookie.name === 'mathexam_learning_local');
  const teacherCookie = await learningCookie(teacher.context), pupilCookie = await learningCookie(student.context);
  const initial = (await api(tp, metadataPath)).parentAccess;
  assert.deepEqual(initial, { exists: false, name: '', login: '', enabled: false, active: false, version: 0, invitationExpiresAt: null });
  async function settings() {
    await tp.evaluate(() => LearningApp.navigate('students')); await tp.evaluate(() => LearningApp.refresh());
    await tp.locator('[data-parent-access="' + pupil.id + '"]').click();
    await tp.locator('#parent-settings').waitFor();
    assert.equal(await tp.locator('#parent-invitation-options').getAttribute('open'), null);
    await tp.locator('#parent-invitation-options > summary').click();
    await tp.locator('#parent-access-form').waitFor();
  }
  async function acknowledge() {
    const input = await tp.locator('#invite-link').elementHandle();
    assert.equal(await tp.locator('#invite-done').isDisabled(), true);
    await tp.locator('#invite-saved').check(); await tp.locator('#invite-done').click();
    await tp.locator('#invite-link').waitFor({ state: 'detached' });
    assert.equal(await input.evaluate(node => node.value), '', 'Closing the card clears even its detached credential input');
    await input.dispose(); await privateState(tp, tokens);
  }
  async function login(page, loginName, password = PARENT_PASSWORD) {
    await page.goto(origin + '/learning/parent.html#login=' + encodeURIComponent(loginName));
    await page.locator('#parent-auth-form[data-mode=login]').waitFor();
    // A same-page #login navigation dispatches hashchange after goto resolves.
    await page.waitForFunction(login => document.querySelector('#parent-login')?.value === login, loginName);
    assert.equal(await page.locator('[name=login]').inputValue(), loginName, 'Return links prefill only the non-secret login');
    await page.locator('[name=password]').fill(password); await page.locator('#parent-auth-submit').click();
    await page.locator('#parent-overview').waitFor();
  }
  async function projection(page) {
    const response = await raw(page, '/parent/overview'); assert.equal(response.status, 200, 'The production router accepts a separate parent session');
    const data = response.body;
    assert.deepEqual(Object.keys(data).sort(), ['fetchedAt', 'homework', 'profile', 'progress', 'student']);
    assert(Number.isSafeInteger(data.fetchedAt) && data.fetchedAt > 0 && data.fetchedAt <= Date.now());
    assert.match(await page.locator('.family-identity').textContent(), /Родитель/);
    assert((await page.locator('.family-identity').textContent()).includes(pupil.name));
    assert.match(await page.locator('#parent-updated').textContent(), /Обновлено:/);
    assert.equal(await page.locator('#parent-logout').textContent(), 'Сменить пользователя');
    assert.deepEqual(data.student, { name: pupil.name }); assert.deepEqual(data.profile, { course: 'oge', goal: 'pass' });
    assert.equal(data.progress.totalAttempts, 2); assert.equal(data.progress.startedAttempts, 1);
    assert.equal(data.progress.completedAttempts, 1); assert.equal(data.progress.independentAttempts, 1);
    assert.equal(data.progress.helpedAttempts, 0); assert.equal(data.progress.practicedAttempts, 0);
    assert.equal(data.progress.recent.length, 2); assert(data.progress.lastActivityAt > 0);
    assert.deepEqual(data.progress.recent.map(item => item.outcome).sort(), ['independent', 'started']);
    for (const item of data.progress.recent) assert.deepEqual(Object.keys(item).sort(), ['outcome', 'title', 'updatedAt']);
    assert.equal(data.homework.total, 1); assert.equal(data.homework.recent.length, 1);
    assert.equal(data.homework.recent[0].title, 'Опубликованная домашняя работа');
    assert.equal(data.homework.recent[0].outcome, 'independent'); assert.equal(data.homework.recent[0].submittedAt, null);
    assert.deepEqual(Object.keys(data.homework.recent[0]).sort(), ['dueAt', 'outcome', 'submittedAt', 'title', 'updatedAt']);
    for (const hidden of [...fixture.hidden, fixture.photoId, pupil.id, peer.id, fixture.loose.id]) {
      assert(!JSON.stringify(data).includes(hidden), 'The parent projection omits private identities, notes, photos and raw work');
      assert(!(await page.locator('body').innerHTML()).includes(hidden), 'Private work never reaches parent markup');
    }
    for (const [key, value] of Object.entries({ total: 2, independent: 1, helped: 0, practiced: 0, started: 1, homework: 1 })) {
      assert.equal(await page.locator('[data-parent-count="' + key + '"]').textContent(), String(value));
    }
    assert.equal(await page.locator('#parent-homework .work-row').count(), 1);
    assert.match(await page.locator('#parent-homework').textContent(), /ещё не отправлена/,
      'A correct digital answer is not misrepresented as a submitted paper assignment');
    assert.equal(await page.locator('#parent-overview form,#parent-overview iframe,#parent-overview input:not([readonly]),#parent-overview textarea').count(), 0,
      'The parent page contains no answer, grading or assignment controls');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(overflow, false, 'The parent page fits both a 390px phone and a laptop');
    await privateState(page, [...tokens, PARENT_PASSWORD]);
    return data;
  }

  await settings();
  assert.equal(await tp.locator('#parent-access-form input[type=password]').count(), 0,
    'The optional invitation still lets the parent choose their own code');
  await tp.locator('#parent-access-form [name=name]').fill('Проверочный родитель');
  const issuance = tp.waitForResponse(response => response.url().endsWith('/api/learning' + metadataPath) && response.request().method() === 'POST');
  const issuedAt = Date.now(); await tp.locator('[data-parent-issue]').click();
  const issued = await (await issuance).json(); tokens.push(issued.invitationToken);
  assert.match(issued.invitationToken, /^[A-Za-z0-9_-]{43}$/);
  assert(issued.parentAccess.invitationExpiresAt >= issuedAt + 7 * 86400000);
  assert(issued.parentAccess.invitationExpiresAt < Date.now() + 7 * 86400000 + 1000);
  assert.equal(issued.parentAccess.version, 1); assert.equal(issued.parentAccess.active, false);
  const loginName = issued.parentAccess.login;
  await tp.locator('#invite-link').waitFor(); const link = await tp.locator('#invite-link').inputValue();
  assert.equal(link, origin + '/learning/parent.html#invite=' + issued.invitationToken);
  assert.equal(await tp.locator('#invite-login').inputValue(), loginName);
  await tp.keyboard.press('Escape'); assert.equal(await tp.locator('#invite-link').isVisible(), true);
  await tp.evaluate(() => LearningApp.refresh()); assert.equal(await tp.locator('#invite-link').isVisible(), true);
  assert.equal(await tp.locator('#dialog-close').count(), 0, 'An unsaved invitation has no accidental close control');
  await tp.mouse.click(1, 1); assert.equal(await tp.locator('#invite-link').isVisible(), true);
  await tp.evaluate(() => document.querySelector('#logout').click());
  assert.equal((await api(tp, '/session')).account.id, teacherId, 'An unsaved invitation guards logout');
  await tp.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw Error('Synthetic clipboard denied'); } } }));
  await tp.locator('#copy-invite').click(); await tp.locator('#invite-copy-text').waitFor();
  assert((await tp.locator('#invite-copy-text').inputValue()).includes(link));
  assert.equal(await tp.locator('#invite-copy-text').evaluate(node => node.selectionEnd - node.selectionStart), (await tp.locator('#invite-copy-text').inputValue()).length,
    'Unavailable clipboard has a selected, readable manual fallback');
  await privateState(tp, tokens, { markup: false }); await acknowledge();

  // A shared family device keeps the child's existing cookie while adding a
  // distinct parent cookie. No child login or impersonation is involved.
  const pp = await student.context.newPage(); await pp.goto(link);
  await pp.locator('#parent-auth-form[data-mode=activate]').waitFor();
  assert(!pp.url().includes('invite=')); assert.equal(await pp.locator('[name=password]').getAttribute('minlength'), '4');
  for (const input of await pp.locator('[name=password],[name=confirm]').all()) {
    assert.equal(await input.getAttribute('maxlength'), '4');
    assert.equal(await input.getAttribute('pattern'), '[0-9]{4}');
    assert.equal(await input.getAttribute('inputmode'), 'numeric');
  }
  await privateState(pp, tokens);
  // A new invitation while activation is pending cannot replace the original
  // child binding or start another authentication request.
  let heldActivation, activationStarted, activationPosts = 0;
  const activationHeld = new Promise(resolve => { activationStarted = resolve; });
  await pp.route('**/api/learning/parent/activate', route => {
    activationPosts++; heldActivation = route; activationStarted();
  });
  await pp.locator('[name=password]').fill(PARENT_PASSWORD); await pp.locator('[name=confirm]').fill(PARENT_PASSWORD);
  await pp.locator('#parent-auth-submit').click(); await activationHeld;
  const unusedInvite = 'Y'.repeat(43); tokens.push(unusedInvite);
  await pp.evaluate(token => { location.hash = 'invite=' + token; }, unusedInvite);
  await pp.waitForFunction(() => !location.hash.includes('invite='));
  await heldActivation.continue(); await pp.locator('#parent-overview').waitFor();
  assert.equal(activationPosts, 1); await pp.unroute('**/api/learning/parent/activate');
  assert.equal(await pp.locator('#parent-auth-form').count(), 0,
    'Parent activation opens the overview without asking to create another code');
  assert.equal(await pp.locator('#parent-return-card').getAttribute('open'), '');
  assert.equal(await pp.locator('#parent-saved-login').inputValue(), loginName);
  assert.equal(await pp.locator('#parent-return-link').inputValue(), origin + '/learning/parent.html#login=' + loginName);
  assert.equal((await learningCookie(student.context)).value, pupilCookie.value);
  assert.equal((await api(sp, '/session')).account.id, pupil.id);
  const parentCookie = (await student.context.cookies(origin)).find(cookie => cookie.name === 'mathexam_parent_local');
  assert(parentCookie?.httpOnly && parentCookie.sameSite === 'Strict'); assert.notEqual(parentCookie.value, pupilCookie.value);
  const parentSession = await raw(pp, '/parent/session'); assert.equal(parentSession.status, 200);
  assert.deepEqual(parentSession.body.parent, { name: 'Проверочный родитель', login: loginName });
  await projection(pp);
  const active = (await api(tp, metadataPath)).parentAccess;
  assert.equal(active.active, true); assert.equal(active.version, 2); assert.equal(active.invitationExpiresAt, null);

  // The second device is genuinely parent-only: child and teacher endpoints
  // must fail even if the caller knows exact IDs or sends a parent CSRF token.
  const laptop = await open(); await login(laptop.page, loginName); await projection(laptop.page);
  assert.equal(await learningCookie(laptop.context), undefined);
  assert.notEqual((await laptop.context.cookies(origin)).find(c => c.name === 'mathexam_parent_local').value, parentCookie.value);
  const race = await open(); let heldLogin, loginStarted, loginPosts = 0, competingActivationPosts = 0;
  const loginHeld = new Promise(resolve => { loginStarted = resolve; });
  await race.page.route('**/api/learning/parent/login', route => {
    loginPosts++; heldLogin = route; loginStarted();
  });
  race.page.on('request', request => { if (request.url().endsWith('/api/learning/parent/activate')) competingActivationPosts++; });
  await race.page.goto(origin + '/learning/parent.html#login=' + loginName);
  await race.page.locator('[name=password]').fill(PARENT_PASSWORD); await race.page.locator('#parent-auth-submit').click();
  await loginHeld; await race.page.evaluate(token => { location.hash = 'invite=' + token; }, unusedInvite);
  await race.page.waitForFunction(() => !location.hash.includes('invite='));
  assert.equal(await race.page.locator('#parent-auth-form[data-mode=activate]').count(), 0);
  // The session cookie can arrive even if the response body is cut off. Keep
  // the real committed response headers but corrupt its body: recovery must
  // read /session and must never repeat the authentication POST.
  const committedLogin = await heldLogin.fetch(); assert.equal(committedLogin.status(), 200);
  await heldLogin.fulfill({ response: committedLogin, body: '{' });
  await race.page.locator('#parent-overview').waitFor();
  assert.equal(loginPosts, 1); assert.equal(competingActivationPosts, 0);
  assert.equal((await raw(race.page, '/parent/session')).body.parent.login, loginName);
  await privateState(race.page, tokens); await race.context.close();
  const childBefore = await api(tp, '/attempts/' + fixture.loose.id);
  const parentCsrf = (await raw(laptop.page, '/parent/session')).body.csrfToken;
  for (const route of ['/session', '/attempts', '/attempts/' + fixture.loose.id, '/assignments/' + fixture.published.id,
    '/assignments/' + fixture.draft.id, '/photos/' + fixture.photoId, '/teacher/students', metadataPath,
    '/teacher/students/' + pupil.id + '/ai-drafts']) {
    const denied = await raw(laptop.page, route); assert([401, 403].includes(denied.status), 'Parent-only access denied: ' + route);
    for (const marker of fixture.hidden) assert(!JSON.stringify(denied.body).includes(marker));
  }
  for (const [route, body] of [
    ['/attempts', { opId: uuid(), trainerId: 'ege-path', contentId: 'pre7-place-value' }],
    ['/teacher/students/' + pupil.id + '/password', { password: 'MustNotReplace2026' }],
    [metadataPath + '/password', { name: 'Forbidden parent reset', password: '0998', expectedVersion: active.version }],
    [metadataPath + '/revoke', { expectedVersion: active.version }]
  ]) assert([401, 403].includes((await raw(laptop.page, route, body, parentCsrf)).status));
  assert.deepEqual(await api(tp, '/attempts/' + fixture.loose.id), childBefore, 'Viewing and denied mutations leave child work intact');
  assert.equal((await raw(laptop.page, '/parent/overview?learnerId=' + peer.id)).status, 400, 'The parent cannot select another child in query parameters');

  // Teacher and parent sessions may also coexist, and a parent logout clears
  // only its own cookie. The teacher remains the same authenticated principal.
  const teacherParent = await teacher.context.newPage(); await login(teacherParent, loginName);
  assert.equal((await learningCookie(teacher.context)).value, teacherCookie.value);
  assert.equal((await api(tp, '/session')).account.id, teacherId);
  await teacherParent.locator('#parent-logout').click(); await teacherParent.locator('#parent-auth-form[data-mode=login]').waitFor();
  assert.equal((await learningCookie(teacher.context)).value, teacherCookie.value);
  assert.equal((await api(tp, '/session')).account.id, teacherId);
  assert.equal((await raw(pp, '/parent/session')).status, 200, 'Logout on one device does not sign out the other device');

  // An invitation is never permission to silently replace an existing parent.
  const peerPath = '/teacher/students/' + peer.id + '/parent-access';
  const peerIssued = await api(tp, peerPath, { name: 'Другой проверочный родитель', expectedVersion: (await api(tp, peerPath)).parentAccess.version });
  tokens.push(peerIssued.invitationToken);
  await laptop.page.goto(origin + '/learning/parent.html#invite=' + peerIssued.invitationToken);
  await laptop.page.locator('#parent-overview').waitFor();
  assert.equal((await raw(laptop.page, '/parent/session')).body.parent.login, loginName);
  assert.match(await laptop.page.locator('#parent-notice').textContent(), /уже вошли/); await projection(laptop.page);
  assert.equal((await api(tp, peerPath)).parentAccess.active, false, 'The second invitation remains unconsumed');

  // Password recovery belongs to the child, not to the independent parent.
  const replacement = '0273'; await api(tp, '/teacher/students/' + pupil.id + '/password', { password: replacement });
  assert.equal((await raw(sp, '/session')).status, 401);
  assert.equal((await raw(pp, '/parent/session')).status, 200); assert.equal((await raw(laptop.page, '/parent/session')).status, 200);
  await sp.goto(origin + '/learning/#login=' + pupil.login);
  await sp.locator('#auth-form').waitFor();
  assert.equal(await sp.locator('#auth-form [name=login]').inputValue(), pupil.login, 'The pupil return link remembers a login but never its password');
  assert.equal(await sp.locator('#auth-form [name=password]').inputValue(), '');
  await sp.locator('#auth-form [name=password]').fill(replacement); await sp.locator('#auth-form [type=submit]').click();
  await sp.locator('#navigation').waitFor(); assert.equal((await api(sp, '/session')).account.id, pupil.id);
  assert.equal((await api(tp, metadataPath)).parentAccess.version, active.version);
  await laptop.page.locator('#parent-logout').click();
  await laptop.page.locator('#parent-auth-form[data-mode=login]').waitFor();
  await login(laptop.page, loginName); await projection(laptop.page);
  await pp.reload(); await pp.locator('#parent-overview').waitFor(); await projection(pp);

  await settings(); assert.equal(await tp.locator('[data-parent-revoke]').isDisabled(), true);
  await tp.locator('#parent-settings details').filter({ has: tp.locator('#parent-revoke-confirm') }).locator('summary').click();
  await tp.locator('#parent-revoke-confirm').check();
  await tp.locator('[data-parent-revoke]').click(); await tp.locator('[data-parent-revoke]').waitFor({ state: 'detached' });
  assert.equal((await api(tp, metadataPath)).parentAccess.enabled, false);
  assert.equal((await raw(pp, '/parent/session')).status, 401); assert.equal((await raw(laptop.page, '/parent/session')).status, 401);
  assert.equal((await api(sp, '/session')).account.id, pupil.id); assert.equal((await api(tp, '/session')).account.id, teacherId);
  await pp.locator('#parent-refresh').click(); await pp.locator('#parent-auth-form[data-mode=login]').waitFor();
  assert.equal(await pp.locator('#parent-overview').count(), 0, 'Revocation removes previously displayed private progress');
  await privateState(pp, tokens); await tp.locator('#dialog-close').click();

  // A committed issue whose response is lost must not issue twice or pretend
  // the one-time secret can be fetched from metadata. Explicit reissue is needed.
  const beforeLost = (await api(tp, metadataPath)).parentAccess; await settings();
  assert.equal(await tp.locator('[data-parent-issue]').isDisabled(), true);
  await tp.locator('#parent-reissue-confirm').check(); let lostIssues = 0;
  await tp.route('**/api/learning' + metadataPath, async route => {
    if (route.request().method() === 'POST') {
      lostIssues++; const committed = await route.fetch(); assert.equal(committed.status(), 200);
      tokens.push((await committed.json()).invitationToken); await route.abort('failed');
    } else await route.continue();
  });
  await tp.locator('[data-parent-issue]').click();
  await tp.locator('[data-parent-message]').filter({ hasText: 'Ответ о сохранении не получен' }).waitFor();
  assert.equal(lostIssues, 1); assert.equal(await tp.locator('#invite-link').count(), 0);
  assert.equal(await tp.locator('[data-parent-issue]').isDisabled(), true);
  const afterLost = (await api(tp, metadataPath)).parentAccess;
  assert.equal(afterLost.login, loginName); assert.equal(afterLost.version, beforeLost.version + 1);
  assert.equal(afterLost.active, false); assert.equal(afterLost.enabled, true);
  await privateState(tp, tokens); await tp.unroute('**/api/learning' + metadataPath);
  await tp.locator('#dialog-close').click();
  assert.deepEqual(await api(tp, '/attempts/' + fixture.loose.id), childBefore);
  await tp.goto(origin + '/learning/#login=' + pupil.login); await tp.locator('#navigation').waitFor();
  assert.equal((await api(tp, '/session')).account.id, teacherId, 'A pupil login hint cannot switch an authenticated teacher');
  assert.equal((await learningCookie(teacher.context)).value, teacherCookie.value);

  // Do not let a delayed hint reconciliation reinstall a cached actor after
  // logout. While the read-only lookup is pending, logout is visibly blocked
  // and also guarded against a programmatic click; it works after completion.
  let heldSession, sessionResult, sessionStarted, logoutPosts = 0;
  const sessionHeld = new Promise(resolve => { sessionStarted = resolve; });
  await tp.route('**/api/learning/session', async route => {
    if (!heldSession) { heldSession = route; sessionResult = await route.fetch(); sessionStarted(); }
    else await route.continue();
  });
  tp.on('request', request => { if (request.url().endsWith('/api/learning/logout') && request.method() === 'POST') logoutPosts++; });
  await tp.evaluate(login => { location.hash = 'login=' + login; }, peer.login); await sessionHeld;
  assert.equal(await tp.locator('#logout').isDisabled(), true);
  await tp.evaluate(() => document.querySelector('#logout').onclick());
  assert.equal(logoutPosts, 0, 'Pending session reconciliation blocks a competing logout');
  await heldSession.fulfill({ response: sessionResult });
  await tp.waitForFunction(() => !document.querySelector('#logout')?.disabled);
  await tp.unroute('**/api/learning/session');
  await tp.locator('#logout').click(); await tp.locator('#auth-form').waitFor();
  assert.equal(logoutPosts, 1); assert.equal((await raw(tp, '/session')).status, 401);
  assert.equal(await tp.evaluate(() => LearningApp.account()), null, 'A completed logout leaves no cached authenticated actor');
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
