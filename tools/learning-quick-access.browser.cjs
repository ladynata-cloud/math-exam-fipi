'use strict';

// Disposable synthetic local accounts only. The actual rendered and downloaded
// QR images are decoded by jsQR, independent of the site's encoder.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { once } = require('node:events');
const { createRequire } = require('node:module');
const ROOT = path.resolve(__dirname, '..');
const serverRequire = createRequire(path.join(ROOT, 'board-server/package.json'));
const express = serverRequire('express');
const { LearningStore } = require('../board-server/learning-store');
const { createLearningApi } = require('../board-server/learning-api');
const { createTeachingRouter } = require('../board-server/learning-teaching');
const contracts = require('../board-server/learning-contracts');
const jsQR = require('jsqr');
const { PNG } = require('pngjs');
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) {
  ({ chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright')));
}
const PASSWORD = '0269';
const DAY = 24 * 60 * 60 * 1000;
const serve = async app => { const server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); return server; };
const stop = async server => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); };
const originOf = server => 'http://127.0.0.1:' + server.address().port;
const api = (page, route, body) => page.evaluate(async ({ route, body }) => LearningApp.api(route,
  body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }), { route, body });
const raw = (page, route, body) => page.evaluate(async ({ route, body }) => {
  const response = await fetch('/api/learning' + route, { method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, body: await response.json() };
}, { route, body });
const frame = page => page.frameLocator('#trainer-host iframe');
async function ready(page) {
  await page.locator('#trainer-host iframe').waitFor();
  await page.waitForFunction(() => document.querySelector('#trainer-host .frame-status')?.hidden);
}
const saved = page => page.waitForFunction(() => document.querySelector('#save-state')?.textContent === 'Все изменения сохранены');
async function privacy(page, tokens, { markup = true } = {}) {
  const persisted = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
  const contents = markup ? await page.locator('body').innerHTML() : '';
  for (const token of tokens) {
    assert(!page.url().includes(token), 'The QR token is scrubbed from the address');
    assert(!persisted.includes(token), 'The QR token stays out of local storage, session storage and the saved action queue');
    assert(!contents.includes(token), 'After entry or closing the card the QR token is absent from markup');
  }
}
function decode(buffer) {
  const png = PNG.sync.read(buffer);
  const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height, { inversionAttempts: 'dontInvert' });
  assert(result, 'An independent decoder must recognize the actual QR image');
  return result.data;
}
async function downloadBytes(download) {
  const stream = await download.createReadStream(); assert(stream, 'The download is readable');
  const chunks = []; for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function main() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-quick-access-'));
  let now = Date.now();
  const clock = () => now;
  const store = new LearningStore({ filePath: path.join(directory, 'learning.sqlite'), contracts, clock });
  assert(store.available, 'Use Node 24 with SQLite');
  const app = express(), trainerApp = express(); app.use(express.json({ limit: '6mb' })); trainerApp.use(express.static(ROOT));
  const server = await serve(app), trainerServer = await serve(trainerApp);
  const origin = originOf(server), trainerOrigin = originOf(trainerServer);
  const requests = [], pageErrors = [], external = [], tokens = [];
  app.use((request, _response, next) => { requests.push({ url: request.originalUrl, referrer: request.headers.referer || '' }); next(); });
  trainerApp.use((request, _response, next) => { requests.push({ url: request.originalUrl, referrer: request.headers.referer || '' }); next(); });
  app.get('/api/learning/status', (_req, res) => res.json({ ...store.status(), trainerOrigin }));
  const learning = createLearningApi({ store, publicOrigin: origin, secureCookies: false, clock });
  app.use('/api/learning', learning.router, createTeachingRouter(learning)); app.use(express.static(ROOT));
  const invitation = store.bootstrap({ name: 'Преподаватель проверки', login: 'fixture_quick_teacher' });
  let browser;
  try {
    browser = await chromium.launch({ headless: true,
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM_EXECUTABLE,
      args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    async function open(viewport = { width: 1280, height: 960 }) {
      const context = await browser.newContext({ viewport, locale: 'ru-RU', acceptDownloads: true });
      context.on('request', request => requests.push({ url: request.url(), referrer: request.headers().referer || '' }));
      await context.route('**/*', request => {
        const url = new URL(request.request().url());
        if (['127.0.0.1', 'localhost'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)) return request.continue();
        external.push(url.origin + url.pathname); return request.abort('blockedbyclient');
      });
      const page = await context.newPage(); page.setDefaultTimeout(15000);
      page.on('pageerror', error => pageErrors.push(error.message));
      return { page, context };
    }
    const teacher = await open(), tp = teacher.page;
    await tp.goto(origin + '/learning/#invite=' + invitation.invitationToken);
    await tp.locator('#auth-form [name=password]').fill(PASSWORD);
    await tp.locator('#auth-form [name=confirm]').fill(PASSWORD);
    await tp.locator('#auth-form [type=submit]').click();
    await tp.locator('#recovery-saved').check(); await tp.locator('#done-codes').click();
    await tp.locator('#navigation').waitFor();
    const teacherId = (await api(tp, '/session')).account.id;
    const pupil = (await api(tp, '/teacher/students', {
      name: 'Проверочный ученик QR', login: 'fixture_quick_pupil'
    })).student;
    await api(tp, '/teacher/students/' + pupil.id + '/profile', {
      opId: crypto.randomUUID(), expectedVersion: 0, course: 'oge', goal: 'pass', focus: 'Проверочный маршрут'
    });
    const pending = (await api(tp, '/teacher/students')).students.find(student => student.id === pupil.id);
    assert.equal(pending.active, false); assert.equal(pending.passwordReady, false);
    const metadataPath = '/teacher/students/' + pupil.id + '/quick-access';
    const initial = (await api(tp, metadataPath)).quickAccess;
    assert.equal(initial.active, false); assert.equal(initial.expiresAt, null);

    await checkQuickAccess({ teacher, teacherId, pupil, metadataPath, initial, origin, open, tokens, api, raw, clock,
      expire: timestamp => { now = timestamp; }, requests });
    for (const request of requests) for (const token of tokens) {
      assert(!request.url.includes(token), 'QR bearer material must not reach a request URL');
      assert(!request.referrer.includes(token), 'QR bearer material must not reach the Referrer header');
    }
    assert.deepEqual(pageErrors, []); assert.deepEqual(external, []);
    console.log('LEARNING_QUICK_ACCESS_BROWSER_OK: independent QR decoding; guarded saved card; pending pupil; reusable phone/laptop entry and same durable work; no token persistence or referrer leaks; teacher session preserved; rotation, revocation and expiry.');
  } finally {
    if (browser) await browser.close(); await stop(server); await stop(trainerServer); store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

async function checkQuickAccess({ teacher, teacherId, pupil, metadataPath, initial, origin, open, tokens, clock, expire, requests }) {
  const tp = teacher.page;
  async function settings() {
    await tp.evaluate(() => LearningApp.navigate('students')); await tp.evaluate(() => LearningApp.refresh());
    await tp.locator('[data-quick-access="' + pupil.id + '"]').click();
    await tp.locator('#quick-settings').waitFor();
  }
  async function issue({ rotate = false } = {}) {
    await settings();
    if (rotate) {
      assert.equal(await tp.locator('[data-quick-issue]').isDisabled(), true, 'Replacing a reusable QR requires deliberate confirmation');
      await tp.locator('#quick-rotate-confirm').check();
    }
    const response = tp.waitForResponse(response => response.url().endsWith('/api/learning' + metadataPath)
      && response.request().method() === 'POST');
    await tp.locator('[data-quick-issue]').click();
    const result = await (await response).json();
    await tp.locator('#quick-access-link').waitFor();
    tokens.push(result.quickToken);
    assert.match(result.quickToken, /^[a-zA-Z0-9_-]{43}$/);
    assert.equal(result.quickAccess.expiresAt, clock() + 30 * DAY);
    const link = await tp.locator('#quick-access-link').inputValue();
    assert.equal(link, origin + '/learning/#quick=' + result.quickToken);
    return { ...result, link };
  }
  async function acknowledge() {
    const input = await tp.locator('#quick-access-link').elementHandle();
    assert.equal(await tp.locator('#quick-done').isDisabled(), true);
    await tp.locator('#quick-saved').check(); await tp.locator('#quick-done').click();
    await tp.locator('#quick-access-link').waitFor({ state: 'detached' });
    assert.equal(await input.evaluate(node => node.value), '', 'The detached QR-link field is explicitly cleared');
    await input.dispose(); assert.equal(await tp.locator('#quick-qr-svg').count(), 0);
    await privacy(tp, tokens);
  }
  async function enter(client, link) {
    await client.page.goto(link); await client.page.locator('#navigation').waitFor();
    await client.page.waitForFunction(() => LearningApp.account()?.role === 'student');
    assert.equal((await api(client.page, '/session')).account.id, pupil.id);
    assert.equal(await client.page.locator('#auth-form').count(), 0, 'QR entry asks for no login or password');
    assert.equal(await client.page.locator('.mw-dialog[open]').count(), 0);
    await privacy(client.page, tokens);
    const cookie = (await client.context.cookies(origin)).find(cookie => cookie.name === 'mathexam_learning_local');
    assert(cookie && cookie.httpOnly && cookie.sameSite === 'Strict', 'Each device receives its own HttpOnly session');
    assert(tokens.every(token => !cookie.value.includes(token)), 'The session cookie is not the reusable QR secret');
    return cookie.value;
  }
  async function reject(link) {
    const client = await open({ width: 390, height: 844 });
    await client.page.goto(link); await client.page.locator('#quick-login-panel').waitFor();
    await client.page.locator('#quick-standard-login').waitFor();
    assert.equal((await raw(client.page, '/session')).status, 401);
    assert.equal(await client.page.getByText(pupil.name, { exact: true }).count(), 0, 'An invalid QR discloses no pupil name');
    await privacy(client.page, tokens); await client.context.close();
  }

  const first = await issue();
  assert.equal(first.quickAccess.version, initial.version + 1);
  await tp.setViewportSize({ width: 390, height: 844 });
  assert.equal(decode(await tp.locator('#quick-qr-svg').screenshot()), first.link,
    'The displayed mobile QR decodes independently to the exact private URL');
  const downloadEvent = tp.waitForEvent('download'); await tp.locator('#quick-download-png').click();
  const download = await downloadEvent; assert.match(download.suggestedFilename(), /\.png$/i);
  assert.equal(decode(await downloadBytes(download)), first.link, 'The downloaded PNG encodes the same private entry');
  await teacher.context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
  await tp.locator('#quick-copy-link').click();
  assert.equal(await tp.evaluate(() => navigator.clipboard.readText()), first.link);
  assert.equal(await tp.locator('#quick-copy-status').evaluate(node => !!node.closest('dialog[open]')), true);
  await teacher.context.clearPermissions();
  const clipboard = await teacher.context.newCDPSession(tp);
  await clipboard.send('Browser.setPermission', { permission: { name: 'clipboard-write' }, setting: 'denied', origin });
  await tp.locator('#quick-copy-link').click();
  await tp.waitForFunction(() => {
    const link = document.querySelector('#quick-access-link');
    return link === document.activeElement && link.selectionStart === 0 && link.selectionEnd === link.value.length;
  });
  assert.match(await tp.locator('#quick-copy-status').innerText(), /вручную|не разрешил/,
    'Clipboard denial leaves a selected manual-copy fallback inside the card');
  await clipboard.detach();
  assert.equal(await tp.locator('#dialog-close').count(), 0, 'The unsaved QR card has no accidental close control');
  await tp.keyboard.press('Escape'); await tp.mouse.click(1, 1);
  assert.equal(await tp.locator('#quick-access-link').inputValue(), first.link);
  await tp.evaluate(() => LearningApp.navigate('security')); await tp.evaluate(() => LearningApp.refresh());
  assert.equal(await tp.locator('#quick-access-link').inputValue(), first.link, 'Navigation and refresh cannot discard an unsaved QR');
  await tp.evaluate(() => document.querySelector('#logout').click());
  assert.equal((await api(tp, '/session')).account.id, teacherId, 'Credential-card logout is guarded');
  assert.equal(await tp.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented;
  }), true);
  assert.equal(await tp.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'QR card fits a 390px screen');
  await privacy(tp, tokens, { markup: false }); await acknowledge();
  const activePupil = (await api(tp, '/teacher/students')).students.find(student => student.id === pupil.id);
  assert.equal(activePupil.active, true); assert.equal(activePupil.passwordReady, false, 'QR supports a pupil who never chose a password');
  const metadata = await api(tp, metadataPath);
  assert.equal(metadata.quickAccess.active, true); assert(!JSON.stringify(metadata).includes(first.quickToken), 'Metadata never returns the bearer secret');

  const phone = await open({ width: 390, height: 844 }), laptop = await open({ width: 1280, height: 960 });
  const phoneCookie = await enter(phone, first.link), laptopCookie = await enter(laptop, first.link);
  assert.notEqual(phoneCookie, laptopCookie, 'The reusable QR creates independent device sessions');
  await phone.page.evaluate(() => LearningApp.navigate('practice=path%3Apre7-place-value'));
  await phone.page.locator('[data-practice-start]').click(); await ready(phone.page);
  const attemptId = new URLSearchParams(new URL(phone.page.url()).hash.slice(1)).get('attempt');
  await frame(phone.page).locator('#answer').fill('12345'); await saved(phone.page);
  await laptop.page.goto(origin + '/learning/#attempt=' + attemptId); await ready(laptop.page);
  assert.equal(await frame(laptop.page).locator('#answer').inputValue(), '12345', 'A second QR device resumes the same server history');
  await frame(laptop.page).locator('#answer').fill('24680'); await saved(laptop.page);
  await phone.page.reload(); await ready(phone.page);
  assert.equal(await frame(phone.page).locator('#answer').inputValue(), '24680');
  await privacy(phone.page, tokens); await privacy(laptop.page, tokens);
  assert.equal((await api(phone.page, '/attempts')).attempts.length, 1, 'QR reuse never creates another pupil or a duplicate task');
  await phone.page.locator('#logout').click(); await phone.page.locator('#auth-form').waitFor();
  await enter(phone, first.link);
  await phone.page.goto(origin + '/learning/#attempt=' + attemptId); await ready(phone.page);
  assert.equal(await frame(phone.page).locator('#answer').inputValue(), '24680', 'The same QR still works after explicit logout');

  // A teacher following the pupil link must retain her own session, even when
  // the link arrives as a same-document hash rather than a full navigation.
  const beforeQuickPosts = requests.filter(request => request.url.endsWith('/api/learning/quick-login')).length;
  await tp.goto(first.link); await tp.locator('#navigation').waitFor();
  await tp.waitForFunction(() => LearningApp.account()?.role === 'teacher');
  assert.equal((await api(tp, '/session')).account.id, teacherId);
  await tp.evaluate(token => { location.hash = 'quick=' + token; }, first.quickToken);
  await tp.waitForFunction(() => !location.hash.includes('quick='));
  assert.equal((await api(tp, '/session')).account.id, teacherId);
  assert.equal(requests.filter(request => request.url.endsWith('/api/learning/quick-login')).length, beforeQuickPosts,
    'A signed-in teacher never submits the pupil QR login');
  await privacy(tp, tokens);

  // A QR pasted while an ordinary login is waiting must not race two different
  // accounts. Hold the actual password request before sending it to the server.
  const race = await open(); let heldLogin, loginStarted;
  const loginHeld = new Promise(resolve => { loginStarted = resolve; });
  await race.page.route('**/api/learning/login', route => { heldLogin = route; loginStarted(); });
  await race.page.goto(origin + '/learning/');
  await race.page.locator('#auth-form [name=login]').fill('fixture_quick_teacher');
  await race.page.locator('#auth-form [name=password]').fill(PASSWORD);
  await race.page.locator('#auth-form [type=submit]').click(); await loginHeld;
  let raceQuickRequests = 0;
  race.page.on('request', request => { if (request.url().endsWith('/api/learning/quick-login')) raceQuickRequests++; });
  await race.page.evaluate(token => { location.hash = 'quick=' + token; }, first.quickToken);
  await race.page.waitForFunction(() => !location.hash.includes('quick='));
  await heldLogin.continue();
  await race.page.locator('#navigation').waitFor();
  assert.equal((await api(race.page, '/session')).account.id, teacherId, 'The original password login keeps its intended teacher account');
  assert.equal(raceQuickRequests, 0, 'A QR hash cannot start a competing login while password authentication is pending');
  await privacy(race.page, tokens); await race.context.close();

  // A second credential fragment during QR login must not race a second POST
  // or replace the pending screen with a password-activation form.
  const quickRace = await open(); let heldQuick, quickStarted, quickRequests = 0;
  const quickHeld = new Promise(resolve => { quickStarted = resolve; });
  await quickRace.page.route('**/api/learning/quick-login', route => {
    quickRequests++; if (!heldQuick) { heldQuick = route; quickStarted(); } else route.continue();
  });
  await quickRace.page.goto(first.link); await quickHeld;
  const unusedQuick = 'Z'.repeat(43), unusedInvite = 'Synthetic-unused-invitation-2026';
  tokens.push(unusedQuick, unusedInvite);
  for (const fragment of ['quick=' + unusedQuick, 'invite=' + unusedInvite]) {
    await quickRace.page.evaluate(fragment => { location.hash = fragment; }, fragment);
    await quickRace.page.waitForFunction(() => !/quick=|invite=/.test(location.hash));
    assert.equal(await quickRace.page.locator('#auth-form').count(), 0);
  }
  await heldQuick.continue(); await quickRace.page.locator('#navigation').waitFor();
  assert.equal((await api(quickRace.page, '/session')).account.id, pupil.id);
  assert.equal(quickRequests, 1, 'Only the original pending QR enters the account');
  await privacy(quickRace.page, tokens); await quickRace.context.close();

  // A startup request may finish after a newer hash-based login has succeeded.
  // Its stale 401 must not erase the new cabin or re-open password entry.
  const restoreRace = await open(); let heldRestore, restoreResponse, restoreStarted, restoreRequests = 0;
  const restoreHeld = new Promise(resolve => { restoreStarted = resolve; });
  await restoreRace.page.route('**/api/learning/session', async route => {
    if (++restoreRequests === 1) {
      restoreResponse = await route.fetch(); assert.equal(restoreResponse.status(), 401);
      heldRestore = route; restoreStarted();
    } else await route.continue();
  });
  await restoreRace.page.goto(origin + '/learning/'); await restoreHeld;
  await restoreRace.page.evaluate(token => { location.hash = 'quick=' + token; }, first.quickToken);
  await restoreRace.page.locator('#navigation').waitFor();
  assert.equal((await api(restoreRace.page, '/session')).account.id, pupil.id);
  await heldRestore.fulfill({ response: restoreResponse });
  await restoreRace.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await restoreRace.page.locator('#auth-form').count(), 0);
  assert.equal(await restoreRace.page.locator('#navigation').isVisible(), true);
  assert.equal((await api(restoreRace.page, '/session')).account.id, pupil.id);
  await privacy(restoreRace.page, tokens); await restoreRace.context.close();

  const second = await issue({ rotate: true }); await acknowledge();
  assert.notEqual(second.quickToken, first.quickToken); assert.equal(second.quickAccess.version, first.quickAccess.version + 1);
  assert.equal((await raw(phone.page, '/session')).status, 401);
  assert.equal((await raw(laptop.page, '/session')).status, 401, 'Replacing the QR revokes both former QR sessions');
  await reject(first.link); await enter(phone, second.link);
  await phone.page.goto(origin + '/learning/#attempt=' + attemptId); await ready(phone.page);
  assert.equal(await frame(phone.page).locator('#answer').inputValue(), '24680', 'Replacing access leaves pupil work unchanged');
  await settings(); assert.equal(await tp.locator('[data-quick-revoke]').isDisabled(), true);
  await tp.locator('#quick-settings details > summary').click();
  await tp.locator('#quick-revoke-confirm').check(); await tp.locator('[data-quick-revoke]').click();
  await tp.waitForFunction(() => !document.querySelector('[data-quick-revoke]'));
  assert.equal((await api(tp, metadataPath)).quickAccess.active, false);
  assert.equal((await raw(phone.page, '/session')).status, 401);
  await reject(second.link);
  if (await tp.locator('#dialog-close').count()) await tp.locator('#dialog-close').click();

  // The server can commit a new QR just before a connection fails. The UI must
  // discover its active metadata, never mint another grant automatically, and
  // require a deliberate replacement because the secret was not received.
  const beforeLost = (await api(tp, metadataPath)).quickAccess;
  await settings(); let lostIssues = 0;
  await tp.route('**/api/learning' + metadataPath, async route => {
    if (route.request().method() === 'POST') {
      lostIssues++; const committed = await route.fetch();
      assert.equal(committed.status(), 200); tokens.push((await committed.json()).quickToken);
      await route.abort('failed');
    } else await route.continue();
  });
  await tp.locator('[data-quick-issue]').click();
  await tp.locator('#quick-rotate-confirm').waitFor();
  assert.equal(lostIssues, 1); assert.equal(await tp.locator('#quick-access-link').count(), 0);
  assert.equal(await tp.locator('[data-quick-issue]').isDisabled(), true);
  const afterLost = (await api(tp, metadataPath)).quickAccess;
  assert.equal(afterLost.active, true); assert.equal(afterLost.version, beforeLost.version + 1);
  await privacy(tp, tokens); await tp.unroute('**/api/learning' + metadataPath);
  await tp.locator('#dialog-close').click();

  const third = await issue({ rotate: true }); await acknowledge();
  expire(third.quickAccess.expiresAt - 1);
  await enter(laptop, third.link);
  assert.equal((await raw(laptop.page, '/session')).status, 200);
  expire(third.quickAccess.expiresAt);
  assert.equal((await raw(laptop.page, '/session')).status, 401,
    'Logging in on the final day cannot extend the QR beyond its 30-day grant');
  await reject(third.link);
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
