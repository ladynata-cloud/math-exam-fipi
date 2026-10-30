'use strict';
// Real browser -> authenticated cabinet HTTP -> separate assistant HTTP.
// All accounts and databases are synthetic. Provider transport is replaced with
// an in-process function; this checks the boundary, never a live model.
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
const { chromium } = require('playwright');
const PASSWORD = 'Synthetic-dialogue-fixture-password';
const copy = value => JSON.parse(JSON.stringify(value));

(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'assistant-dialogue-e2e-'));
  const cleanups = [], payloads = [], errors = [], blocked = [], checks = [];
  let helper, learning, server, browser, holdProvider = false, releaseProvider;
  try {
    const { createAssistantServer } = await import(pathToFileURL(path.join(ROOT, 'assistant-service/src/server.js')));
    const { fixture, modelResponse, NOW } = await import(pathToFileURL(path.join(ROOT, 'assistant-service/test/helpers.js')));
    const bridgeKey = crypto.randomBytes(32).toString('base64url');
    const fx = fixture({ after: fn => cleanups.push(fn) }, { api: true,
      env: { ASSISTANT_CABINET_BRIDGE_KEY: bridgeKey, ASSISTANT_CABINET_EXTERNAL_ENABLED: '1' } });
    const config = { ...fx.config, port: 0 };
    helper = createAssistantServer({ config, clock: () => NOW, fetchImpl: async (url, options) => {
      assert.equal(url, config.providerUrl); assert.equal(options.redirect, 'error');
      // No fetch occurs here: the only provider response is this fixture.
      const payload = JSON.parse(options.body); payloads.push(copy(payload));
      assert.deepEqual(payload.messages.map(item => item.role), ['system', 'user', 'user']);
      assert(helper.store.summary().day.reserved_micros > 0, 'Reservation precedes mocked transport');
      if (holdProvider) { holdProvider = false; await new Promise(resolve => { releaseProvider = resolve; }); }
      const numberTheory = JSON.parse(payload.messages[1].content).topic === 'divisibility-gcd';
      const text = numberTheory
        ? 'Общий делитель должен делить оба числа без остатка.'
        : 'Угол между сторонами имеет вершину в их общей точке.';
      return modelResponse({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
        title: 'Уточним шаг', text, steps: [numberTheory ? 'Проверь, делится ли каждое исходное число на выбранное число без остатка.' : 'Проверь это по условию открытой задачи.'],
        check: numberTheory ? 'Твой делитель подходит к обоим числам?' : 'Какой признак можно использовать?'
      }) } }] });
    } });
    helper.server.listen(0, '127.0.0.1'); await once(helper.server, 'listening');
    config.publicOrigin = 'http://127.0.0.1:' + helper.server.address().port;
    const app = express(); app.use(express.json({ limit: '128kb' }));
    server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
    const origin = 'http://127.0.0.1:' + server.address().port;
    learning = createLearningApi({ filePath: path.join(directory, 'cabinet.sqlite'), contracts,
      publicOrigin: origin, secureCookies: false, clock: () => NOW,
      assistant: { config: { enabled: true, external: true, origin: config.publicOrigin, key: bridgeKey, timeoutMs: 1500 } } });
    app.use('/api/learning', learning.router);
    app.get('/fixture', (_req, res) => res.type('html').send('<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/learning/style.css"><link rel="stylesheet" href="/learning/assistant.css"><title>Synthetic dialogue integration</title></head><body><main style="max-width:1000px;margin:24px auto;padding:16px"><div id="host"></div></main><script src="/learning/assistant.js"></script></body></html>'));
    app.use('/learning', express.static(path.join(ROOT, 'learning')));
    app.get('/favicon.ico', (_req, res) => res.status(204).end());
    const passwordHash = await hashPassword(PASSWORD);
    const teacher = learning.store.activate(learning.store.bootstrap({ login: 'dialogue_teacher', name: 'Synthetic teacher' }).invitationToken, passwordHash);
    const students = ['a', 'b'].map(id => learning.store.activate(learning.store.createStudent(teacher.account,
      { login: 'dialogue_pupil_' + id, name: 'Synthetic pupil ' + id }).invitationToken, passwordHash));
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking'] });
    async function open(account) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
      await context.route('**/*', route => {
        if (new URL(route.request().url()).origin === origin) return route.continue();
        blocked.push(route.request().url()); return route.abort();
      });
      const login = await context.request.post(origin + '/api/learning/login', { headers: { Origin: origin },
        data: { login: account.account.login, password: PASSWORD, expectedRole: account.account.role } });
      assert.equal(login.status(), 200);
      const page = await context.newPage(); page.setDefaultTimeout(12000); page.on('pageerror', e => errors.push(e.message));
      await page.goto(origin + '/fixture');
      await page.evaluate(async () => {
        const session = await (await fetch('/api/learning/session')).json();
        window.requestFixture = async (route, body) => {
          const response = await fetch('/api/learning' + route, { credentials: 'same-origin',
            ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }),
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken, 'X-Learning-Account': session.account.id } });
          return { status: response.status, body: await response.json() };
        };
      });
      return { context, page };
    }
    const teacherView = await open(teacher), pupil = await open(students[0]), peer = await open(students[1]);
    const request = (page, route, body) => page.evaluate(({ route, body }) => requestFixture(route, body), { route, body });
    async function configure(index, profileId, version = 0) {
      const result = await request(teacherView.page, '/teacher/students/' + students[index].account.id + '/assistant',
        { version, enabled: true, profileId, dailyLimit: 20, externalAllowed: true });
      assert.equal(result.status, 200, JSON.stringify(result.body));
      return result.body;
    }
    await configure(0, 'triangle-congruence'); await configure(1, 'triangle-congruence');
    const generated = contracts.create('atanasyan-7-9', 'atanasyan-7-9-main-92-part-1', 123);
    const attempt = learning.store.newAttempt(students[0].account.id, teacher.account.id, 'atanasyan-7-9', generated);
    const another = learning.store.newAttempt(students[0].account.id, teacher.account.id, 'atanasyan-7-9', generated);
    async function mount(attemptId) {
      await pupil.page.evaluate(attemptId => {
        window.disposeFixture?.();
        window.disposeFixture = LearningAssistant.mount(document.querySelector('#host'), { role: 'student', floating: false,
          ...(attemptId ? { attemptId } : {}), isCurrent: () => true, api: async (route, options = {}) => {
            const result = await requestFixture(route, options.body ? JSON.parse(options.body) : undefined);
            if (result.status !== 200) throw Object.assign(Error(result.body.error), { code: result.body.error, status: result.status });
            return result.body;
          } });
      }, attemptId || null);
      await pupil.page.locator('[name=assistant-question]').waitFor();
    }
    async function clickAnswer(label) {
      const received = pupil.page.waitForResponse(response => response.url().endsWith('/assistant/ask'));
      await pupil.page.getByRole('button', { name: label, exact: true }).click();
      const response = await received, body = await response.json();
      assert.equal(response.status(), 200, JSON.stringify(body));
      await pupil.page.waitForFunction(() => !document.querySelector('[name=assistant-follow-up]')?.readOnly);
      return { body, sent: response.request().postDataJSON() };
    }
    await mount(attempt.id);
    await pupil.page.locator('[name=assistant-question]').fill('Почему равны треугольники?');
    const initial = await clickAnswer('Хочу подсказку');
    assert.equal(initial.body.contextMode, 'current-task'); assert.equal(initial.body.answer.complete, false);
    assert.equal(initial.body.answer.steps.length, 1); assert.equal(payloads.length, 0);
    assert.equal(initial.body.followUpAvailable, true);
    const initialText = await pupil.page.locator('[data-assistant-answer]').first().innerText();
    const followQuestion = 'Почему здесь нужен угол между сторонами?';
    await pupil.page.locator('[name=assistant-follow-up]').fill(followQuestion);
    await pupil.page.getByRole('button', { name: 'Задать вопрос', exact: true }).click();
    await pupil.page.getByText('Для уточнения отметь согласие', { exact: false }).waitFor();
    assert.equal(payloads.length, 0, 'A follow-up requires a fresh explicit acknowledgement');
    await pupil.page.locator('[name=assistant-follow-up-consent]').check();
    const follow = await clickAnswer('Задать вопрос');
    assert.equal(payloads.length, 1); assert.equal(follow.body.answer.complete, false);
    const root = JSON.parse(payloads[0].messages[1].content), dialogue = JSON.parse(payloads[0].messages[2].content);
    assert.notEqual(root.question, initial.sent.question, 'The owned task replaces the manually entered question');
    assert.match(root.question, /треугольник/i);
    assert.equal(dialogue.followUpQuestion, followQuestion); assert.equal(dialogue.previousTurns.length, 1);
    assert.equal(dialogue.previousTurns[0].question, root.question);
    assert.equal(dialogue.previousTurns[0].answer.text, initial.body.answer.text);
    assert.equal(await pupil.page.locator('[data-assistant-answer]').first().innerText(), initialText);
    assert.equal(await pupil.page.locator('[name=assistant-follow-up-consent]').isChecked(), false);
    checks.push('Owned open task, prior explanation, fresh acknowledgement and retained visible steps cross both real services');

    const replay = { ...follow.sent, requestId: crypto.randomUUID(), followUp: { answerId: follow.body.answer.answerId, question: 'Почему?' } };
    for (const [page, changes, code] of [
      [peer.page, { attemptId: undefined }, 'LEARNING_ASSISTANT_DIALOGUE_CONTEXT'],
      [pupil.page, { attemptId: another.id }, 'LEARNING_ASSISTANT_DIALOGUE_CONTEXT'],
      [pupil.page, { externalConsent: false }, 'LEARNING_ASSISTANT_EXTERNAL_UNAVAILABLE'],
      [pupil.page, { followUp: { answerId: initial.body.answer.answerId, question: 'Почему?' } }, 'LEARNING_ASSISTANT_DIALOGUE_EXPIRED']
    ]) {
      const denied = await request(page, '/assistant/ask', { ...replay, ...changes, requestId: crypto.randomUUID() });
      assert.notEqual(denied.status, 200); assert.equal(denied.body.error, code);
    }
    assert.equal(payloads.length, 1, 'Rejected account, task, consent and parent requests never reach provider transport');
    checks.push('Cross-account, another owned task, missing consent and superseded parent fail before provider transport');

    await pupil.page.locator('[name=assistant-follow-up]').fill('Объясни проще');
    await pupil.page.locator('[name=assistant-follow-up-consent]').check();
    const second = await clickAnswer('Задать вопрос');
    const nextDialogue = JSON.parse(payloads[1].messages[2].content);
    assert.equal(nextDialogue.previousTurns.length, 2); assert.equal(nextDialogue.previousTurns[1].question, followQuestion);
    assert.equal(nextDialogue.previousTurns[1].answer.text, follow.body.answer.text);
    assert.equal(JSON.parse(payloads[1].messages[1].content).question, root.question);
    const count = await pupil.page.locator('[data-assistant-answer]').count();
    holdProvider = true;
    await pupil.page.locator('[name=assistant-follow-up]').fill('Поясни ещё этот шаг');
    await pupil.page.locator('[name=assistant-follow-up-consent]').check();
    const heldResponse = pupil.page.waitForResponse(response => response.url().endsWith('/assistant/ask'));
    await pupil.page.getByRole('button', { name: 'Задать вопрос', exact: true }).click();
    for (let index = 0; !releaseProvider && index < 100; index++) await new Promise(resolve => setTimeout(resolve, 10));
    assert(releaseProvider, 'The mocked provider is deterministically held before delivery');
    const currentAttempt = learning.store.getAttempt(teacher.account, attempt.id);
    learning.store.action(teacher.account, attempt.id, { opId: crypto.randomUUID(), expectedVersion: currentAttempt.version,
      type: 'control', payload: { controller: 'teacher' } });
    releaseProvider();
    const revoked = await heldResponse;
    assert.equal(revoked.status(), 409); assert.equal((await revoked.json()).error, 'LEARNING_CONTROL_REQUIRED');
    await pupil.page.waitForFunction(() => !document.querySelector('[name=assistant-follow-up]')?.readOnly);
    assert.equal(await pupil.page.locator('[data-assistant-answer]').count(), count);
    assert.equal((await request(pupil.page, '/assistant')).body.used, 4, 'Control change never refunds or retries the spent request');
    checks.push('Teacher takes control during an actual pending follow-up: no new explanation is displayed and accounting is retained');
    await mount(another.id);
    assert.equal(await pupil.page.locator('[data-assistant-follow-up]').isHidden(), true);
    assert.equal(await pupil.page.locator('[data-assistant-answer]').count(), 0);
    assert.equal(count, 3); assert.equal(payloads.length, 3);
    checks.push('Second clarification retains the original task and both explanations; navigating to another task clears the dialogue');

    await configure(0, 'vilenkin-grade6', 1); await mount();
    await pupil.page.locator('[name=assistant-topic]').selectOption('divisibility-gcd');
    await pupil.page.locator('[name=assistant-question]').fill('НОД 12 и 18');
    const nod = await clickAnswer('Хочу подсказку');
    assert.equal(nod.body.answer.complete, false); assert.equal(nod.body.answer.verification, 'deterministic');
    assert.equal(payloads.length, 3);
    assert.doesNotMatch([nod.body.answer.text, ...nod.body.answer.steps, nod.body.answer.check].join(' '), /(?:^|\D)6(?:\D|$)/,
      'The first NOD hint does not disclose the computed final answer');
    await pupil.page.locator('[name=assistant-follow-up]').fill('Что значит общий делитель?');
    await pupil.page.locator('[name=assistant-follow-up-consent]').check();
    const nodFollow = await clickAnswer('Задать вопрос');
    assert.equal(payloads.length, 4); assert.equal(JSON.parse(payloads[3].messages[1].content).question, 'НОД 12 и 18');
    assert.equal(JSON.parse(payloads[3].messages[2].content).previousTurns[0].answer.text, nod.body.answer.text);
    assert.match(nodFollow.body.answer.text, /оба числа без остатка/);
    assert.doesNotMatch([nodFollow.body.answer.text, ...nodFollow.body.answer.steps, nodFollow.body.answer.check].join(' '), /(?:^|\D)6(?:\D|$)/);
    await pupil.page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await pupil.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    if (process.env.LEARNING_ASSISTANT_DIALOGUE_EVIDENCE) {
      const dir = path.resolve(process.env.LEARNING_ASSISTANT_DIALOGUE_EVIDENCE); assert(dir.startsWith(os.tmpdir() + path.sep));
      fs.mkdirSync(dir, { recursive: true }); await pupil.page.screenshot({ path: path.join(dir, 'dialogue-mobile.png'), fullPage: true });
    }
    checks.push('Vilenkin NOD hint stays partial and free; clarification carries that exact root and fits mobile');

    const allPayloads = JSON.stringify(payloads);
    for (const value of [PASSWORD, bridgeKey, config.apiKey, config.pilotKey, ...students.map(item => item.account.id), second.body.answer.answerId]) assert(!allPayloads.includes(value));
    for (const text of [followQuestion, 'Объясни проще', 'Что значит общий делитель?']) {
      assert(!fs.readFileSync(config.dbPath).includes(Buffer.from(text)), 'No raw dialogue is stored in helper SQLite');
      assert(!JSON.stringify(learning.store.rows('SELECT * FROM learning_assistant_requests')).includes(text));
    }
    assert.deepEqual(await pupil.page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })), { local: {}, session: {} });
    assert.deepEqual(errors, []); assert.deepEqual(blocked, []);
    console.log(JSON.stringify({ checks, mockedProviderCalls: payloads.length, externalNetworkCalls: 0 }));
    console.log('MATHEXAM_ASSISTANT_DIALOGUE_E2E_OK');
  } finally {
    await browser?.close();
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    learning?.close(); await helper?.close();
    for (const cleanup of cleanups) cleanup();
    fs.rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
