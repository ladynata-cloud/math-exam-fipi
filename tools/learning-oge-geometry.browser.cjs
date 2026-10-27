'use strict';
// Real rendered cabinet -> real authenticated gateway -> separate offline helper.
// All identities, accounts, credentials and databases are synthetic and temporary.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { once } = require('node:events');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '..');
const express = createRequire(path.join(ROOT, 'board-server/package.json'))('express');
const { createLearningApi } = require('../board-server/learning-api');
const { createTeachingRouter } = require('../board-server/learning-teaching');
const { hashPassword } = require('../board-server/learning-auth');
const contracts = require('../board-server/learning-contracts');
const { chromium } = require('playwright');
const PASSWORD = 'Synthetic geometry verification password';
const condition = 'Квадрат описан около окружности радиуса 7. Найди площадь квадрата.';
const transferred = new URLSearchParams({ 'geometry-help': 'oge-circle', from: 'oge-task16-circle', question: condition }).toString();
const ids = ['oge-task15-triangles', 'oge-task16-circle', 'oge-task17-quadrilaterals', 'oge-task18-grid', 'task19-trainer'];
const closeServer = async server => {
  if (!server) return;
  server.closeAllConnections?.(); await new Promise(resolve => server.close(resolve));
};
(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'geometry-cabinet-browser-'));
  const bridgeKey = crypto.randomBytes(32).toString('base64url');
  let assistant, learning, server, browser, providerCalls = 0;
  const errors = [], asks = [], checks = [], forbidden = [];
  try {
    const { createAssistantServer } = await import(pathToFileURL(path.join(ROOT, 'assistant-service/src/server.js')));
    const { loadConfig } = await import(pathToFileURL(path.join(ROOT, 'assistant-service/src/config.js')));
    const config = { ...loadConfig({ ASSISTANT_MODE: 'offline', ASSISTANT_DB_PATH: path.join(directory, 'assistant.sqlite'), ASSISTANT_CABINET_BRIDGE_KEY: bridgeKey }), port: 0 };
    assistant = createAssistantServer({ config, fetchImpl: async () => { providerCalls++; throw Error('No provider transport allowed'); } });
    assistant.server.listen(0, '127.0.0.1'); await once(assistant.server, 'listening');
    config.publicOrigin = 'http://127.0.0.1:' + assistant.server.address().port;

    const app = express(); app.use(express.json({ limit: '128kb' }));
    server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
    const origin = 'http://127.0.0.1:' + server.address().port;
    learning = createLearningApi({ filePath: path.join(directory, 'learning.sqlite'), contracts, publicOrigin: origin, secureCookies: false,
      assistant: { env: { NODE_ENV: 'test', LEARNING_LOCAL_DEV: '1', LEARNING_ASSISTANT_ENABLED: '1',
        LEARNING_ASSISTANT_ORIGIN: config.publicOrigin, LEARNING_ASSISTANT_BRIDGE_KEY: bridgeKey } } });
    assert(learning.store.available);
    app.use('/api/learning', learning.router);
    app.use('/api/learning', createTeachingRouter(learning));
    app.use(express.static(ROOT, { dotfiles: 'deny' }));
    app.get('/favicon.ico', (_req, res) => res.status(204).end());
    const hash = await hashPassword(PASSWORD);
    const teacher = learning.store.activate(learning.store.bootstrap({ login: 'geometry_fixture_teacher', name: 'Учебный преподаватель' }).invitationToken, hash);
    const pupil = learning.store.activate(learning.store.createStudent(teacher.account, { login: 'geometry_fixture_pupil', name: 'Учебный пример' }).invitationToken, hash);
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking'] });
    async function session(role) {
      const context = await browser.newContext({ viewport: { width: 1365, height: 980 }, locale: 'ru-RU' });
      await context.route('**/*', route => {
        const target = new URL(route.request().url());
        if (target.origin === origin || ['data:', 'blob:'].includes(target.protocol)) return route.continue();
        forbidden.push(target.origin); return route.abort();
      });
      const response = await context.request.post(origin + '/api/learning/login', { headers: { Origin: origin },
        data: { login: role.account.login, password: PASSWORD, expectedRole: role.account.role } });
      assert.equal(response.status(), 200);
      const credentials = await response.json();
      const post = async (route, data) => {
        const reply = await context.request.post(origin + '/api/learning' + route, { headers: { Origin: origin,
          'X-CSRF-Token': credentials.csrfToken, 'X-Learning-Account': role.account.id }, data });
        const body = await reply.json(); assert.equal(reply.status(), 200, body.error); return body;
      };
      const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message)); page.setDefaultTimeout(15000);
      page.on('request', request => { if (request.url() === origin + '/api/learning/assistant/ask') asks.push(request.postDataJSON()); });
      return { context, page, post };
    }
    const admin = await session(teacher);
    await admin.post('/teacher/students/' + pupil.account.id + '/profile', { opId: crypto.randomUUID(), expectedVersion: 0,
      course: 'oge', goal: 'grade5', focus: 'Геометрия первой части' });
    await admin.post('/teacher/students/' + pupil.account.id + '/plan', { opId: crypto.randomUUID(), items: [],
      note: ids.map(id => 'https://mathexam.space/trainers/' + id + '.html').join('\n') });
    await admin.post('/teacher/students/' + pupil.account.id + '/assistant', { profileId: 'oge-geometry', enabled: true,
      dailyLimit: 10, version: 0, externalAllowed: false });
    await admin.context.close();

    const view = await session(pupil), page = view.page;
    await page.goto(origin + '/learning/#route');
    await page.locator('[data-geometry-collection-entry]').waitFor();
    assert.equal(await page.locator('[data-plan-course]').count(), 5);
    await page.locator('[data-geometry-collection-entry] a').click();
    await page.getByRole('heading', { name: 'Геометрия: №15–19', exact: true }).waitFor();
    assert.equal(await page.locator('[data-geometry-topic]').count(), 5);
    assert.equal(await page.locator('[data-geometry-topic] a[href*="trainer-board"]').count(), 0);
    assert.equal(asks.length, 0);
    checks.push('saved five-trainer plan opens one collection without creating an attempt or inference');
    if (process.env.BROWSER_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.BROWSER_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.BROWSER_SCREENSHOT_DIR, 'geometry-collection-desktop.png'), fullPage: true });
    }

    await page.goto(origin + '/learning/#' + transferred);
    await page.locator('[name=assistant-question]').waitFor();
    assert.equal(await page.locator('[name=assistant-question]').inputValue(), condition);
    assert.equal(await page.locator('[name=assistant-topic]').inputValue(), 'oge-circle');
    assert.equal(await page.locator('[name=assistant-attempt]').inputValue(), '');
    assert.equal(asks.length, 0);
    assert.equal(await page.locator('[name=assistant-external-consent]').count(), 0);
    await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).click();
    await page.locator('[data-assistant-answer]').waitFor();
    const first = await page.locator('[data-assistant-answer]').first().innerText();
    assert(!/\b196\b/.test(first), 'First hint must not disclose final area');
    assert.match(first, /Вычисление проверено программой/);
    assert.equal(asks.length, 1); assert.equal(asks[0].externalConsent, false);
    for (const key of ['attemptId', 'studentId', 'from', 'answerKey', 'profileId']) assert(!Object.hasOwn(asks[0], key));
    await page.getByRole('button', { name: 'Показать весь разбор', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('[data-assistant-answer]').length === 2);
    assert.equal(await page.locator('[data-assistant-answer]').first().innerText(), first);
    assert.match(await page.locator('[data-assistant-answer]').last().innerText(), /196/);
    assert.equal(await page.locator('[name=assistant-question]').inputValue(), condition);
    checks.push('explicit transferred text -> real offline calculation; final answer only on full explanation; prior hint retained');
    if (process.env.BROWSER_SCREENSHOT_DIR) {
      await page.locator('[data-geometry-assistant-host]').screenshot({ path: path.join(process.env.BROWSER_SCREENSHOT_DIR, 'geometry-helper-desktop.png') });
    }

    // Preserve mathematical notation through both real HTTP services. An
    // unsupported exponent must not be flattened into a different number.
    const powered = condition.replace('радиуса 7', 'радиуса 2²');
    await page.locator('[name=assistant-question]').fill(powered);
    await page.getByRole('button', { name: 'Показать весь разбор', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('[data-assistant-answer]').length === 3);
    const unsupported = await page.locator('[data-assistant-answer]').last().innerText();
    assert.match(unsupported, /Нужна проверка преподавателя/);
    assert.doesNotMatch(unsupported, /Вычисление проверено программой|Ответ:|1936/);
    assert.equal(asks.at(-1).question, powered);
    checks.push('2² survives both services; unsupported notation never becomes a certified calculation for 22');

    const before = asks.length;
    await page.goto(origin + '/learning/#' + transferred + '&attempt=another-account');
    await page.getByRole('heading', { name: 'Не получилось открыть условие', exact: true }).waitFor();
    assert.equal(await page.locator('[name=assistant-question]').count(), 0);
    assert.equal(asks.length, before);
    await page.goto(origin + '/learning/#geometry=oge-circle');
    await page.locator('[name=assistant-question]').waitFor();
    assert.equal(await page.locator('[name=assistant-topic]').inputValue(), 'oge-circle');
    assert.equal(await page.locator('[name=assistant-question]').inputValue(), '');
    assert.equal(await page.locator('[data-assistant-answer]').count(), 0);
    checks.push('malformed mixed routing rejected; changing topic does not reuse prior task text or answers');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(origin + '/learning/#' + transferred);
    await page.locator('[name=assistant-question]').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'No mobile horizontal overflow');
    const fieldBox = await page.locator('[name=assistant-question]').boundingBox();
    assert(fieldBox.width > 200 && fieldBox.x >= 0 && fieldBox.x + fieldBox.width <= 390);
    await page.getByRole('button', { name: 'Хочу подсказку', exact: true }).click();
    await page.locator('[data-assistant-answer]').waitFor();
    if (process.env.BROWSER_SCREENSHOT_DIR) {
      // Full-page capture avoids clipping a fixed offscreen skip-link into an
      // artificially enlarged element screenshot; do not hide product controls.
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(process.env.BROWSER_SCREENSHOT_DIR, 'geometry-helper-mobile.png'), fullPage: true });
    }
    checks.push('390px: full condition, controls and actual offline hint work without horizontal scrolling');

    // Sign-out/in must preserve a deliberate public-math handoff, not switch users.
    await page.getByRole('button', { name: 'Выйти', exact: true }).click();
    await page.goto(origin + '/learning/#' + transferred);
    await page.locator('#auth-form [name=login]').fill(pupil.account.login);
    await page.locator('#auth-form [name=password]').fill(PASSWORD);
    await page.locator('#auth-form [type=submit]').click();
    await page.locator('[name=assistant-question]').waitFor();
    assert.equal(await page.locator('[name=assistant-question]').inputValue(), condition);
    assert.equal(await page.locator('[name=assistant-topic]').inputValue(), 'oge-circle');
    checks.push('ordinary authenticated login preserves the bounded handoff');

    assert.equal(learning.store.row('SELECT COUNT(*) AS n FROM attempts').n, 0, 'Public trainer links do not forge managed progress');
    assert.equal(providerCalls, 0); assert.deepEqual(errors, []); assert.deepEqual(forbidden, []);
    console.log(JSON.stringify({ gate: 'OGE_GEOMETRY_ASSISTANT_BROWSER_OK', checks, providerCalls, errors, managedAttemptsCreated: 0 }, null, 2));
    await view.context.close();
  } finally {
    await browser?.close();
    await closeServer(server);
    learning?.close();
    await assistant?.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
