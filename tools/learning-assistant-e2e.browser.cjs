'use strict';

// Real browser -> authenticated cabinet HTTP -> separate assistant HTTP.
// Every account, credential and database is synthetic and temporary. External
// model transport is forbidden; this gate verifies integration, not model quality.
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
const { hashPassword } = require('../board-server/learning-auth');
const contracts = require('../board-server/learning-contracts');
const catalog = require('../board-server/assistant-profile-catalog.json');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (error) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw error;
  ({ chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright')));
}
const PASSWORD = 'Synthetic cabinet integration password';
const COOKIE = 'mathexam_learning_local';
const secrets = [PASSWORD];
const cases = [
  { profile: 'oge-geometry', topic: 'oge-triangles', question: 'Как выбрать правило для задачи о треугольнике?',
    verification: 'curated-guidance', expected: /180°/u },
  { profile: 'peterson-decimals', topic: 'decimal-add-subtract', question: '0,1 + 0,2',
    verification: 'deterministic', expected: /0,3/u },
  { profile: 'triangle-congruence', topic: 'congruence-sas', question: 'Почему в первом признаке важен угол между сторонами?',
    verification: 'curated-guidance', expected: /между/u }
];
const fixtureHTML = '<!doctype html><html lang="ru"><head><meta charset="utf-8">'
  + '<meta name="viewport" content="width=device-width,initial-scale=1">'
  + '<link rel="stylesheet" href="/learning/style.css"><link rel="stylesheet" href="/learning/assistant.css">'
  + '<title>Synthetic cabinet assistant integration</title></head><body>'
  + '<main style="max-width:1000px;margin:24px auto;padding:16px"><h1>Synthetic cabinet</h1>'
  + '<div id="assistant-host" hidden></div></main><script src="/learning/assistant.js"></script></body></html>';

(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-assistant-e2e-'));
  const bridgeKey = crypto.randomBytes(32).toString('base64url'); secrets.push(bridgeKey);
  let assistant, learning, cabinetServer, browser, providerCalls = 0;
  const pageErrors = [], unexpectedRequests = [], checks = [];
  try {
    const { createAssistantServer } = await import(pathToFileURL(path.join(ROOT, 'assistant-service/src/server.js')));
    const { loadConfig } = await import(pathToFileURL(path.join(ROOT, 'assistant-service/src/config.js')));
    const assistantConfig = { ...loadConfig({ ASSISTANT_MODE: 'offline',
      ASSISTANT_DB_PATH: path.join(directory, 'assistant.sqlite'), ASSISTANT_CABINET_BRIDGE_KEY: bridgeKey }), port: 0 };
    assistant = createAssistantServer({ config: assistantConfig, fetchImpl: async () => {
      providerCalls++; throw Error('External model transport is forbidden in the cabinet integration gate');
    } });
    assistant.server.listen(0, '127.0.0.1'); await once(assistant.server, 'listening');
    assistantConfig.publicOrigin = 'http://127.0.0.1:' + assistant.server.address().port;

    const app = express(); app.use(express.json({ limit: '128kb' }));
    cabinetServer = app.listen(0, '127.0.0.1'); await once(cabinetServer, 'listening');
    const origin = 'http://127.0.0.1:' + cabinetServer.address().port;
    assert.notEqual(origin, assistantConfig.publicOrigin, 'The cabinet and assistant must use separate HTTP listeners');
    learning = createLearningApi({ filePath: path.join(directory, 'learning.sqlite'), contracts,
      publicOrigin: origin, secureCookies: false,
      assistant: { env: { NODE_ENV: 'test', LEARNING_LOCAL_DEV: '1', LEARNING_ASSISTANT_ENABLED: '1',
        LEARNING_ASSISTANT_ORIGIN: assistantConfig.publicOrigin, LEARNING_ASSISTANT_BRIDGE_KEY: bridgeKey } } });
    assert.equal(learning.store.available, true, 'SQLite must be available; the gate never skips integration');
    app.use('/api/learning', learning.router);
    app.get('/fixture', (_req, res) => res.type('html').send(fixtureHTML));
    for (const filename of ['assistant.js', 'assistant.css', 'style.css']) {
      app.get('/learning/' + filename, (_req, res) => res.sendFile(path.join(ROOT, 'learning', filename)));
    }
    app.get('/favicon.ico', (_req, res) => res.status(204).end());

    const passwordHash = await hashPassword(PASSWORD);
    const teacher = learning.store.activate(learning.store.bootstrap({ login: 'synthetic_assistant_teacher', name: 'Synthetic teacher' }).invitationToken, passwordHash);
    const students = [];
    for (let index = 0; index < 4; index++) students.push(learning.store.activate(learning.store.createStudent(teacher.account,
      { login: 'synthetic_assistant_student_' + index, name: 'Synthetic student ' + index }).invitationToken, passwordHash));
    for (const account of [teacher, ...students]) secrets.push(account.sessionToken);

    browser = await chromium.launch({ headless: true,
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking'] });

    async function open(account) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, locale: 'ru-RU' });
      await context.route('**/*', route => {
        const target = new URL(route.request().url());
        if (target.origin === origin) return route.continue();
        unexpectedRequests.push(target.origin); return route.abort();
      });
      // The actual login handler supplies the HttpOnly cookie; no test-only auth
      // endpoint, query token or injected authorization shortcut is used.
      const response = await context.request.post(origin + '/api/learning/login', {
        headers: { Origin: origin }, data: { login: account.account.login, password: PASSWORD, expectedRole: account.account.role }
      });
      assert.equal(response.status(), 200, 'Synthetic account must authenticate through the real login endpoint');
      const signedIn = await response.json(); secrets.push(signedIn.csrfToken);
      assert.equal(signedIn.account.id, account.account.id);
      const cookie = (await context.cookies(origin)).find(item => item.name === COOKIE);
      assert(cookie?.httpOnly && cookie.sameSite === 'Strict', 'The real login cookie must be HttpOnly and SameSite Strict');
      secrets.push(cookie.value);
      const page = await context.newPage(); page.setDefaultTimeout(12000);
      page.on('pageerror', error => pageErrors.push(error.message));
      return { context, page };
    }
    async function mount(page, studentId, courseContext) {
      await page.goto(origin + '/fixture');
      const statusPath = studentId ? '/teacher/students/' + studentId + '/assistant' : '/assistant';
      const loaded = page.waitForResponse(response => response.url() === origin + '/api/learning' + statusPath && response.request().method() === 'GET');
      await page.evaluate(async ({ selectedStudent, courseContext }) => {
        const response = await fetch('/api/learning/session', { credentials: 'same-origin' });
        if (!response.ok) throw Error('Synthetic session unavailable');
        const session = await response.json();
        const api = async (route, options = {}) => {
          const answer = await fetch('/api/learning' + route, { ...options, credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken, 'X-Learning-Account': session.account.id } });
          const body = await answer.json();
          if (!answer.ok) throw Object.assign(Error(body.error), { code: body.error, status: answer.status });
          return body;
        };
        window.courseAssisted = false;
        window.LearningAssistant.mount(document.querySelector('#assistant-host'), {
          api, role: session.account.role, ...(selectedStudent ? { studentId: selectedStudent } : {}), isCurrent: () => true,
          ...(courseContext ? { courseContext, courseTaskLabel: 'Задача 153',
            onBeforeAsk: () => { window.courseAssisted = true; return true; } } : {})
        });
      }, { selectedStudent: studentId || null, courseContext: courseContext || null });
      const response = await loaded;
      assert.equal(response.status(), 200, 'The real cabinet must authorize the status request');
      return response.json();
    }
    async function privateBrowserState(page) {
      const state = await page.evaluate(() => ({ cookie: document.cookie, url: location.href,
        local: { ...localStorage }, session: { ...sessionStorage }, html: document.documentElement.outerHTML }));
      assert.equal(state.cookie, '', 'JavaScript must not read the authentication cookie');
      assert.deepEqual(state.local, {}); assert.deepEqual(state.session, {});
      const serialized = JSON.stringify(state);
      for (const secret of secrets) assert(!serialized.includes(secret), 'Credentials must not reach browser markup, URL or persistent storage');
    }

    const teacherView = await open(teacher);
    for (let index = 0; index < students.length; index++) {
      const initial = await mount(teacherView.page, students[index].account.id);
      assert.equal(initial.configuredEnabled, false);
      await teacherView.page.locator('[name=assistant-profile]').selectOption(cases[index % cases.length].profile);
      await teacherView.page.locator('[name=assistant-limit]').fill('6');
      await teacherView.page.locator('[name=assistant-enabled]').check();
      assert.equal(await teacherView.page.locator('[name=assistant-external]').count(), 0);
      const saved = teacherView.page.waitForResponse(response => response.url().endsWith('/assistant') && response.request().method() === 'POST');
      await teacherView.page.getByRole('button', { name: 'Сохранить настройки помощника', exact: true }).click();
      const response = await saved, body = await response.json();
      if (index < 3) {
        assert.equal(response.status(), 200); assert.equal(body.enabled, true); assert.equal(body.mode, 'offline');
        assert.equal(body.profile.id, cases[index].profile); assert.equal(body.externalEnabled, false);
        await teacherView.page.getByText('Настройки помощника сохранены.', { exact: true }).waitFor();
      } else {
        assert.equal(response.status(), 409); assert.equal(body.error, 'LEARNING_ASSISTANT_PILOT_FULL');
        await teacherView.page.getByText('В испытании уже участвуют три кабинета.', { exact: false }).waitFor();
      }
    }
    assert.equal(learning.store.row('SELECT COUNT(*) AS n FROM learning_assistant_settings WHERE enabled=1').n, 3);
    await privateBrowserState(teacherView.page); await teacherView.context.close();
    checks.push('real teacher authorization enables three private profiles and rejects a fourth');

    for (let index = 0; index < cases.length; index++) {
      const scenario = cases[index], view = await open(students[index]), page = view.page;
      const status = await mount(page);
      assert.equal(status.profile.id, scenario.profile); assert.equal(status.remaining, 6); assert.equal(status.externalEnabled, false);
      await page.locator('[name=assistant-topic]').selectOption(scenario.topic);
      await page.locator('[name=assistant-question]').fill(scenario.question);
      assert.equal(await page.locator('[name=assistant-external-consent]').count(), 0);
      const articles = page.locator('[data-assistant-answer]');
      let firstText;
      for (let step = 0; step < 3; step++) {
        const label = step === 0 ? 'Хочу подсказку' : step === 1 ? 'Следующая подсказка' : 'Показать весь разбор';
        const received = page.waitForResponse(response => response.url() === origin + '/api/learning/assistant/ask');
        await page.getByRole('button', { name: label, exact: true }).click();
        const response = await received, result = await response.json(), request = response.request().postDataJSON();
        assert.equal(response.status(), 200, 'The complete HTTP path must answer the synthetic mathematics question');
        assert.equal(result.answer.topic, scenario.topic); assert.equal(result.answer.verification, scenario.verification);
        assert.equal(result.mode, 'offline'); assert.equal(result.remaining, 5 - step);
        assert.equal(request.externalConsent, false); assert.equal(request.hintLevel, step + 1);
        assert.equal(request.mode, step === 2 ? 'full' : 'hint');
        assert.equal(Object.hasOwn(request, 'subject'), false, 'The browser must not receive or choose the service pseudonym');
        assert.equal(Object.hasOwn(request, 'profileId'), false, 'The private cabinet setting determines the profile');
        await page.waitForFunction(count => document.querySelectorAll('[data-assistant-answer]').length === count, step + 1);
        assert.equal(await page.locator('[name=assistant-question]').inputValue(), scenario.question);
        if (step === 0) firstText = await articles.first().innerText();
        else assert.equal(await articles.first().innerText(), firstText, 'Earlier hints remain visible and unchanged');
        if (step < 2) { assert.equal(result.answer.complete, false); assert.equal(result.answer.steps.length, 1); }
        else {
          assert.equal(result.answer.complete, true); assert(result.answer.steps.length > 1);
          assert.match(await articles.last().innerText(), scenario.expected);
        }
      }
      await page.getByText('Осталось подсказок сегодня: 3 из 6.', { exact: true }).waitFor();
      if (scenario.profile === 'peterson-decimals') {
        const received = page.waitForResponse(response => response.url() === origin + '/api/learning/assistant/feedback');
        await articles.first().getByRole('button', { name: 'Стало понятно', exact: true }).click();
        assert.equal((await received).status(), 200);
        await articles.first().getByText('Отметка сохранена.', { exact: true }).waitFor();
        assert.equal(assistant.store.db.prepare("SELECT SUM(count) AS n FROM feedback_totals WHERE rating='helpful'").get().n, 1);
        assert.equal(learning.store.row("SELECT COUNT(*) AS n FROM learning_assistant_requests WHERE feedback='helpful'").n, 1);
      }
      await privateBrowserState(page); await view.context.close();
      checks.push(scenario.profile + ': two retained hints, complete answer and truthful offline provenance');
    }

    const disabled = await open(students[3]);
    const unavailable = await mount(disabled.page);
    assert.equal(unavailable.enabled, false); assert.equal(unavailable.profile, null);
    assert.equal(await disabled.page.locator('#assistant-host').isHidden(), true);
    assert.equal(await disabled.page.locator('[name=assistant-question]').count(), 0);
    const rejected = await disabled.page.evaluate(async () => {
      const session = await (await fetch('/api/learning/session')).json();
      const response = await fetch('/api/learning/assistant/ask', { method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken, 'X-Learning-Account': session.account.id },
        body: JSON.stringify({ requestId: crypto.randomUUID(), topic: 'decimal-add-subtract', question: '0,1 + 0,2',
          attempt: '', mode: 'hint', hintLevel: 1, simpler: false, externalConsent: false }) });
      return { status: response.status, body: await response.json() };
    });
    assert.equal(rejected.status, 403); assert.equal(rejected.body.error, 'LEARNING_ASSISTANT_DISABLED');
    await privateBrowserState(disabled.page); await disabled.context.close();
    checks.push('a nonparticipant has no helper and cannot bypass server admission');

    // Reconfigure the existing third participant, preserving the original three
    // requests and its quota. A fourth helper profile is not a fourth pupil.
    const courseTeacher = await open(teacher);
    const prior = await mount(courseTeacher.page, students[2].account.id);
    assert.equal(prior.used, 3);
    await courseTeacher.page.locator('[name=assistant-profile]').selectOption('atanasyan-first-steps');
    const courseSaved = courseTeacher.page.waitForResponse(response => response.url().endsWith('/assistant') && response.request().method() === 'POST');
    await courseTeacher.page.getByRole('button', { name: 'Сохранить настройки помощника', exact: true }).click();
    const courseSettingResponse = await courseSaved;
    assert.equal(courseSettingResponse.status(), 200);
    const configuredCourse = await courseSettingResponse.json();
    assert.equal(configuredCourse.used, 3); assert.equal(configuredCourse.remaining, 3);
    await courseTeacher.context.close();

    const courseView = await open(students[2]), coursePage = courseView.page;
    const courseContext = { courseId: 'atanasyan-first-steps', lessonId: 'atanasyan-7-9-main-153-part-1', stepIndex: 1 };
    const courseStatus = await mount(coursePage, null, courseContext);
    assert.equal(courseStatus.profile.id, 'atanasyan-first-steps');
    await coursePage.locator('[data-assistant-course-task]').waitFor();
    assert.equal(await coursePage.locator('[name=assistant-question]').count(), 0);
    const expectedSteps = ['Как перенести длину AB циркулем?', 'Построение отрезка, равного данному.'];
    for (let index = 0; index < 3; index++) {
      const received = coursePage.waitForResponse(response => response.url() === origin + '/api/learning/assistant/ask');
      const label = index === 0 ? 'Хочу подсказку' : index === 1 ? 'Ещё подсказка к шагу' : 'Показать весь разбор';
      await coursePage.getByRole('button', { name: label, exact: true }).click();
      const response = await received, result = await response.json(), request = response.request().postDataJSON();
      assert.equal(response.status(), 200, JSON.stringify(result));
      assert.equal(result.contextMode, 'course-task'); assert.deepEqual(result.courseContext, courseContext);
      assert.equal(result.answer.verification, 'curated-guidance'); assert.equal(result.mode, 'offline');
      assert.equal(result.remaining, 2 - index);
      assert.equal(await coursePage.evaluate(() => window.courseAssisted), true);
      for (const field of ['question', 'topic', 'profileId', 'subject', 'courseRevision']) assert.equal(Object.hasOwn(request, field), false);
      if (index < 2) assert.deepEqual(result.answer.steps, [expectedSteps[index]]);
      else { assert.equal(result.answer.complete, true); assert.equal(result.answer.steps.length, 3); assert.match(result.answer.steps.join(' '), /BC = BA \+ AC/); }
      await coursePage.waitForFunction(count => document.querySelectorAll('[data-assistant-answer]').length === count, index + 1);
      assert.equal(await coursePage.locator('.cabinet-assistant-question').last().textContent(), 'Задача 153 · шаг 2');
    }
    await privateBrowserState(coursePage); await courseView.context.close();
    checks.push('source course: exact construction hints through both real services, local assistance before request, no condition retyping, full proof only on request and preserved quota');

    const serviceRows = JSON.stringify({ requests: assistant.store.db.prepare('SELECT * FROM requests').all(),
      answers: assistant.store.db.prepare('SELECT * FROM answers').all(), sessions: assistant.store.db.prepare('SELECT * FROM sessions').all() });
    for (const student of students) assert(!serviceRows.includes(student.account.id), 'Real account identifiers must stay in the cabinet');
    for (const scenario of cases) assert(!serviceRows.includes(scenario.question), 'The assistant must not retain question bodies');
    assert.equal(assistant.store.db.prepare('SELECT COUNT(*) AS n FROM requests').get().n, 12);
    assert.equal(learning.store.row("SELECT COUNT(*) AS n FROM learning_assistant_requests WHERE status='done'").n, 12);
    assert.equal(providerCalls, 0, 'This gate must never invoke a model provider');
    assert.deepEqual(unexpectedRequests, [], 'The browser must never request a production or other external origin');
    assert.deepEqual(pageErrors, [], 'No uncaught browser errors');
    checks.push('real feedback persists as categories; no provider calls, external browser requests or stored questions');
    console.log(JSON.stringify({ checks, modelProviderCalls: providerCalls, completedRequests: 12 }));
    console.log('MATHEXAM_ASSISTANT_CABINET_E2E_OK');
  } finally {
    if (browser) await browser.close();
    if (cabinetServer) { cabinetServer.closeAllConnections(); await new Promise(resolve => cabinetServer.close(resolve)); }
    if (learning) learning.close();
    if (assistant) await assistant.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => {
  let detail = error.stack || String(error);
  for (const secret of secrets) if (secret) detail = detail.replaceAll(secret, '[redacted]');
  console.error('MATHEXAM_ASSISTANT_CABINET_E2E_FAILED\n' + detail);
  process.exitCode = 1;
});
