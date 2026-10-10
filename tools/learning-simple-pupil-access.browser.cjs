'use strict';
// Synthetic accounts, local HTTP and isolated SQLite; no production mutations.
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
const { hashPassword } = require('../board-server/learning-auth');
const contracts = require('../board-server/learning-contracts');
const { chromium } = require('playwright');
const PASSWORD = '0417', REPLACEMENT = '0257';
const api = (page, route) => page.evaluate(route => LearningApp.api(route), route);

(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-simple-pupil-'));
  const store = new LearningStore({ filePath: path.join(directory, 'learning.sqlite'), contracts });
  assert(store.available);
  const teacher = store.activate(store.bootstrap({ name: 'Тестовый преподаватель', login: 'fixture_simple_teacher' }).invitationToken,
    await hashPassword('Synthetic-teacher-password-2026')).account;
  const pending = store.createStudent(teacher, { name: 'Ожидающий ученик', login: 'fixture_simple_pending' });
  const legacy = store.createStudent(teacher, { name: 'Ученица со старым приглашением', login: 'fixture_simple_invited' });
  const serverApp = express(); serverApp.use(express.json({ limit: '200kb' }));
  const server = serverApp.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  serverApp.get('/api/learning/status', (_req, res) => res.json({ ...store.status(), trainerOrigin: origin }));
  const learning = createLearningApi({ store, publicOrigin: origin, secureCookies: false });
  serverApp.use('/api/learning', learning.router); serverApp.use(express.static(ROOT));
  const errors = [], posts = [];
  let browser;
  try {
    browser = await chromium.launch({ headless: true,
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    async function open() {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ru-RU' });
      await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      const page = await context.newPage(); page.setDefaultTimeout(15000);
      page.on('pageerror', error => errors.push(error.message));
      return { context, page };
    }
    const { context, page } = await open();
    await context.addCookies([{ name: 'mathexam_learning_local', value: store.createSession(teacher.id).sessionToken,
      url: origin, httpOnly: true, sameSite: 'Strict' }]);
    page.on('request', request => { if (request.method() === 'POST') posts.push(new URL(request.url()).pathname); });
    await page.goto(origin + '/learning/?role=teacher'); await page.locator('#add-student').waitFor();
    await page.locator('#add-student').click();
    assert.equal(await page.locator('#student-form select,#student-form [name=confirm]').count(), 0);
    assert.match(await page.locator('#student-form [name=password]').inputValue(), /^\d{4}$/);
    await page.locator('#student-form [name=name]').fill('Готовый вход');
    await page.locator('#student-form [name=login]').fill('fixture_simple_ready');
    await page.locator('#student-form [name=password]').fill(PASSWORD);
    await page.locator('#student-form [type=submit]').click(); await page.locator('#access-password').waitFor();
    const created = store.accountByLogin('fixture_simple_ready');
    assert(created.password_hash); assert(!created.password_hash.includes(PASSWORD));
    const link = await page.locator('#access-link').inputValue();
    assert.equal(link, origin + '/learning/?role=student#login=fixture_simple_ready');
    assert.equal(await page.locator('#access-saved,#access-discard-confirm,#discard-access').count(), 0);
    assert.equal(await page.locator('#close-access').isDisabled(), false);
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true,
      value: { writeText: async text => { window.syntheticCopiedMessage = text; } } }));
    await page.locator('#copy-access').click();
    const message = await page.evaluate(() => { const value = window.syntheticCopiedMessage; window.syntheticCopiedMessage = ''; return value; });
    assert(message.includes(link)); assert(message.includes('Логин: fixture_simple_ready'));
    assert(message.includes('Код входа: ' + PASSWORD)); assert(message.includes('нажми «Войти»'));
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true,
      value: { writeText: async () => { throw Error('Synthetic clipboard denial'); } } }));
    await page.locator('#copy-access').click(); await page.locator('#access-copy-text').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#access-copy-text').inputValue(), message);
    assert.equal(await page.locator('#access-copy-text').evaluate(n => n.selectionEnd - n.selectionStart), message.length);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    const input = await page.locator('#access-password').elementHandle(), fallback = await page.locator('#access-copy-text').elementHandle();
    await page.locator('#close-access').click(); await page.locator('#access-password').waitFor({ state: 'detached' });
    assert.equal(await input.evaluate(n => n.value), ''); assert.equal(await fallback.evaluate(n => n.value), '');
    await input.dispose(); await fallback.dispose();
    const persisted = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
    assert(!persisted.includes(PASSWORD)); assert(!(await page.locator('body').innerHTML()).includes(PASSWORD));
    assert(!JSON.stringify(await api(page, '/teacher/students')).includes(PASSWORD));
    assert.equal((await api(page, '/session')).account.id, teacher.id);
    const child = await open(); await child.page.goto(link);
    await child.page.locator('#auth-form').waitFor();
    assert.equal(await child.page.locator('[name=login]').inputValue(), created.login);
    assert.equal(await child.page.locator('[name=confirm]').count(), 0);
    await child.page.locator('[name=password]').fill(PASSWORD); await child.page.locator('#auth-form [type=submit]').click();
    await child.page.locator('#navigation').waitFor(); assert.equal((await api(child.page, '/session')).account.id, created.id);
    assert(!posts.some(route => route.endsWith('/activate')), 'Ready pupil creation never asks the teacher to activate the pupil');

    // A pending account goes straight to the ready-password form. Merely
    // opening it cannot consume an invitation or change account authority.
    await page.evaluate(() => LearningApp.refresh()); const before = store.account(pending.student.id);
    const postCount = posts.length;
    await page.locator('[data-student-access="' + pending.student.id + '"]').click();
    await page.locator('#student-password-form').waitFor();
    assert.equal(await page.locator('#issue-recovery,#recovery-invite-options').count(), 0);
    assert.deepEqual(store.account(pending.student.id), before); assert.equal(posts.length, postCount);
    await page.locator('#student-password-form [name=password]').fill(REPLACEMENT);
    await page.locator('#student-password-form [type=submit]').click(); await page.locator('#access-password').waitFor();
    assert.equal(await page.locator('#access-login').inputValue(), pending.student.login);
    assert.equal(await page.locator('#access-password').inputValue(), REPLACEMENT);
    await page.locator('#close-access').click();
    assert.equal(store.account(pending.student.id).id, before.id, 'Preparing access retains the original account identity');

    // An already ready account offers copying first and changes its password
    // only after an explicit submission, never because its card was opened.
    await page.evaluate(() => LearningApp.refresh());
    const readyBefore = store.account(created.id), countBefore = posts.length;
    await page.locator('[data-student-access="' + created.id + '"]').click(); await page.locator('#copy-student-entry').waitFor();
    assert.equal(await page.locator('#student-password-form').count(), 0);
    assert.deepEqual(store.account(created.id), readyBefore); assert.equal(posts.length, countBefore);
    await page.locator('#change-student-password').click(); await page.locator('#student-password-form').waitFor();
    assert.deepEqual(store.account(created.id), readyBefore); assert.equal(posts.length, countBefore);
    await page.locator('#dialog-close').click();

    // Old issued invitations are still functional; the simpler teacher UI
    // does not invalidate or remove the existing activation API.
    const invited = await open(); await invited.page.goto(origin + '/learning/#invite=' + legacy.invitationToken);
    await invited.page.locator('#auth-form [name=password]').fill(PASSWORD);
    await invited.page.locator('#auth-form [name=confirm]').fill(PASSWORD);
    await invited.page.locator('#auth-form [type=submit]').click(); await invited.page.locator('#navigation').waitFor();
    assert.equal((await api(invited.page, '/session')).account.id, legacy.student.id);
    assert.deepEqual(errors, []);
    console.log('LEARNING_SIMPLE_PUPIL_ACCESS_OK: ready creation and immediate login; complete message and clipboard fallback; no save checkboxes; cleared plaintext; pending access prepared without duplicate account; existing access read-only until explicit save; legacy invitations preserved; 390px.');
  } finally {
    if (browser) await browser.close(); server.closeAllConnections();
    await new Promise(resolve => server.close(resolve)); store.close(); fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
