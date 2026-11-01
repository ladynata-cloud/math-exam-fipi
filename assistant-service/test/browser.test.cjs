'use strict';

// Browser contract tests use a local mock API and never contact a model provider.
// Run separately: node --test test/browser.test.cjs
// Install Playwright in the test environment; no runtime dependency is needed.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  if (process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) {
    try { ({ chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'))); } catch { /* Explicit test skip below. */ }
  }
}

// Capture only synthetic localhost tests. Closing context flushes videos even
// when an assertion fails. No production cookies, prompts or keys are recorded.
let evidenceIndex = 0;
async function evidencePage(t, browser, options) {
  const root = process.env.BROWSER_ARTIFACT_DIR;
  assert.ok(!root || !process.env.LIVE_ASSISTANT_PILOT_KEY, 'Evidence may contain only synthetic local-demo data.');
  const dir = root ? path.join(root, String(++evidenceIndex)) : null;
  if (dir) fs.mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({ ...options, ...(dir ? { recordVideo: { dir } } : {}) });
  if (dir) await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
  const page = await context.newPage();
  t.after(async () => {
    try {
      if (dir) {
        await page.screenshot({ path: path.join(dir, 'final.png'), fullPage: true }).catch(() => {});
        await context.tracing.stop({ path: path.join(dir, 'trace.zip') });
      }
    } finally { await context.close(); await browser.close(); }
  });
  return page;
}

async function fixture(t, options = {}) {
  const calls = [];
  const csrf = 'test-only-csrf-marker';
  const files = {
    '/': ['index.html', 'text/html; charset=utf-8'],
    '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
    '/study-tools.js': ['study-tools.js', 'text/javascript; charset=utf-8'],
    '/study-ui.js': ['study-ui.js', 'text/javascript; charset=utf-8'],
    '/learning-aids.js': ['learning-aids.js', 'text/javascript; charset=utf-8'],
    '/style.css': ['style.css', 'text/css; charset=utf-8'],
  };
  const server = http.createServer(async (req, res) => {
    if (files[req.url]) {
      const [name, type] = files[req.url];
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      res.end(fs.readFileSync(path.join(__dirname, '../public', name)));
      return;
    }
    let raw = '';
    for await (const part of req) raw += part;
    const body = raw ? JSON.parse(raw) : null;
    calls.push({ path: req.url, method: req.method, body, csrf: req.headers['x-assistant-csrf'], origin: req.headers.origin });
    const send = (code, data, headers = {}) => {
      res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers });
      res.end(JSON.stringify(data));
    };
    if (req.url === '/api/version') return send(200, { ok: true, sourceCommit: 'a'.repeat(40), changes: ['<img src=x onerror=window.injected=1>'] });
    if (req.url === '/api/status') return send(200, {
      ok: true, mode: options.api ? 'api' : 'offline', externalEnabled: Boolean(options.api),
      providerLabel: 'Тестовый провайдер', localDemo: !options.key,
    });
    if (req.url === '/api/session' && req.method === 'POST') return send(200, { ok: true, csrf }, {
      'Set-Cookie': 'assistant_session=test-only; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600',
    });
    if (req.url === '/api/topics') return send(200, { topics: [
      { id: 'linear-equations', title: 'Линейные уравнения', sample: '3x + 5 = 20' },
      { id: 'fractions', title: 'Сложение дробей', sample: '1/2 + 1/3' },
    ] });
    if (['POST', 'DELETE'].includes(req.method) && req.headers['x-assistant-csrf'] !== csrf) return send(403, { ok: false });
    if (req.url === '/api/session' && req.method === 'DELETE') return send(200, { ok: true }, {
      'Set-Cookie': 'assistant_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0',
    });
    if (req.url === '/api/feedback') return send(200, { ok: true });
    if (req.url === '/api/ask') {
      if (options.practiceError && body.question === '4x + 3 = 19') return send(options.practiceError, { ok: false, error: 'PRIVATE_SERVER_DETAIL_DO_NOT_RENDER' });
      if (options.askError) return send(options.askError, { ok: false, error: 'PRIVATE_SERVER_DETAIL_DO_NOT_RENDER' });
      return send(200, { ok: true, answer: {
        id: `answer-${calls.filter(call => call.path === '/api/ask').length}`,
        title: 'Решаем уравнение',
        text: options.malicious ? '<img src=x onerror="window.injected=1">' : `Ищем следующий шаг ${body.hintLevel}.`,
        steps: body.mode === 'explain' ? ['Вычитаем 5 из обеих частей.', 'Делим обе части на 3.', 'x = 5.'] : ['В обеих частях нужно выполнить одинаковое действие.'],
        check: body.mode === 'explain' ? '3 · 5 + 5 = 20.' : 'Что получится, если вычесть 5?',
        sources: options.malicious ? [{ id: 'unsafe', title: '<script>unsafe</script>', url: 'javascript:window.injected=2' }] : [
          { id: 'linear', title: 'Материалы MathExam', url: 'https://mathexam.space/' },
        ],
        verification: body.externalConsent ? 'model-unverified' : 'deterministic',
        topic: body.topic, complete: body.mode === 'explain',
      } });
    }
    return send(404, { ok: false });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
  const page = await evidencePage(t, browser, { viewport: options.viewport || { width: 1280, height: 920 } });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const unexpectedRequests = [];
  page.on('request', req => { if (!req.url().startsWith(`${origin}/`)) unexpectedRequests.push(req.url()); });
  await page.goto(origin);
  await page.waitForFunction(() => !document.getElementById('access-button').disabled);
  if (options.key) await page.locator('#pilot-key').fill(options.key);
  await page.locator('#access-button').click();
  await page.locator('#workspace').waitFor({ state: 'visible' });
  assert.match(await page.locator('#release-label').textContent(), /aaaaaaa/);
  assert.equal(await page.locator('#release-changes img').count(), 0);
  return { page, calls, origin, unexpectedRequests };
}

const skip = !chromium ? 'Playwright is not installed; browser validation has not run.' : false;

test('practice is optional, never inherits provider consent, and safely handles limit/session failures', { skip }, async t => {
  for (const status of [429, 401]) await t.test(String(status), async t => {
    const { page, calls } = await fixture(t, { api: true, practiceError: status });
    await page.locator('#sample-button').click();
    await page.locator('#ask-button').click();
    await page.locator('.answer-card').waitFor();
    assert.equal(await page.locator('.practice-toggle').count(), 0);
    await page.locator('#explain-button').click();
    await page.locator('.practice-toggle').waitFor();
    const previous = await page.locator('.answer-card').first().textContent();
    const before = calls.filter(c => c.path === '/api/ask').length;
    await page.locator('.practice-toggle').click();
    assert.equal(calls.filter(c => c.path === '/api/ask').length, before);
    await page.locator('#external-consent').check();
    await page.locator('.practice-form input').fill('4');
    await page.getByRole('button', { name: 'Проверить пример', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.practice-result').textContent !== 'Проверяем пример…');
    assert.equal(calls.filter(c => c.path === '/api/ask').at(-1).body.externalConsent, false);
    assert.match(await page.locator('.practice-result').textContent(), status === 429 ? /лимит/ : /сеанс/);
    assert.doesNotMatch(await page.locator('.practice-result').textContent(), /PRIVATE_SERVER/);
    assert.equal(await page.locator('.answer-card').first().textContent(), previous);
    assert.equal(await page.locator('.answer-card').count(), 2);
    if (status === 401) assert.equal(await page.locator('#access-panel').isVisible(), true);
  });
});

test('learner opens one hint, gives feedback, preserves earlier steps, explicitly requests full answer, and deletes session', { skip }, async t => {
  const { page, calls, origin, unexpectedRequests } = await fixture(t);
  assert.match(await page.locator('#mode-badge').textContent(), /без внешней модели/);
  assert.equal(await page.locator('#external-choice').isVisible(), false);
  await page.locator('#sample-button').click();
  await page.locator('#ask-button').click();
  await page.locator('.answer-card').waitFor();
  assert.equal(await page.locator('.answer-card').count(), 1);
  assert.equal(await page.locator('.answer-steps li').count(), 1);
  assert.doesNotMatch(await page.locator('#answer-list').textContent(), /x = 5/);
  await page.getByRole('button', { name: 'Объясни проще', exact: true }).click();
  await page.getByText('Учтено. Следующая подсказка будет проще.', { exact: true }).waitFor();
  // A new attempt belongs to the same mathematical problem: keep previous hints.
  await page.locator('#attempt').fill('x = 5');
  await page.locator('#next-button').click();
  await page.waitForFunction(() => document.querySelectorAll('.answer-card').length === 2);
  assert.match(await page.locator('.answer-card').first().textContent(), /Подсказка 1/);
  assert.match(await page.locator('.answer-card').nth(1).textContent(), /Подсказка 2/);
  await page.locator('#explain-button').click();
  await page.waitForFunction(() => document.querySelectorAll('.answer-card').length === 3);
  assert.match(await page.locator('.answer-card').last().textContent(), /x = 5/);
  const asks = calls.filter(call => call.path === '/api/ask');
  assert.deepEqual(asks.map(call => call.body.hintLevel), [1, 2, 5]);
  assert.deepEqual(asks.map(call => call.body.mode), ['hint', 'hint', 'explain']);
  assert.equal(asks[1].body.attempt, 'x = 5');
  assert.ok(asks.every(call => call.body.externalConsent === false && call.csrf && call.origin === origin));
  assert.equal(new Set(asks.map(call => call.body.requestId)).size, 3);
  assert.equal(calls.find(call => call.path === '/api/feedback').body.rating, 'unclear');
  assert.deepEqual(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookie: document.cookie })), { local: 0, session: 0, cookie: '' });
  await page.locator('#forget-button').click();
  await page.locator('#access-panel').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.answer-card').count(), 0);
  assert.equal(await page.locator('#question').inputValue(), '');
  assert.ok(calls.some(call => call.path === '/api/session' && call.method === 'DELETE' && call.csrf));
  assert.deepEqual(unexpectedRequests, []);
});

test('external consent is explicit and resets on a new question; private key and unsafe model markup are not exposed', { skip }, async t => {
  const key = 'test-key-never-use-in-production-0123456789';
  const { page, calls, unexpectedRequests } = await fixture(t, { key, api: true, malicious: true });
  assert.equal(await page.locator('#pilot-key').inputValue(), '');
  assert.ok(!page.url().includes(key));
  assert.equal(await page.locator('#external-consent').isChecked(), false);
  await page.locator('#sample-button').click();
  await page.locator('#ask-button').click();
  await page.locator('.answer-card').waitFor();
  assert.equal(calls.filter(call => call.path === '/api/ask')[0].body.externalConsent, false);
  assert.equal(await page.locator('.answer-card img').count(), 0);
  assert.equal(await page.locator('.answer-card script').count(), 0);
  assert.equal(await page.locator('.answer-sources a').count(), 0);
  assert.match(await page.locator('.answer-text').textContent(), /<img/);
  assert.equal(await page.evaluate(() => window.injected), undefined);
  await page.locator('#external-consent').check();
  await page.locator('#ask-button').click();
  await page.waitForFunction(() => [...document.querySelectorAll('.verification')].at(-1)?.textContent.includes('Ответ модели'));
  assert.equal(calls.filter(call => call.path === '/api/ask')[1].body.externalConsent, true);
  await page.locator('#question').fill('1/2 + 1/3');
  assert.equal(await page.locator('#external-consent').isChecked(), false);
  assert.deepEqual(unexpectedRequests, []);
});

test('mobile viewport has no horizontal overflow and failed API calls show a safe message', { skip }, async t => {
  const { page } = await fixture(t, { viewport: { width: 390, height: 844 }, askError: 429 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.locator('#sample-button').click();
  await page.locator('#ask-button').click();
  await page.getByText(/Достигнут лимит запросов/).waitFor();
  assert.doesNotMatch(await page.locator('body').textContent(), /PRIVATE_SERVER_DETAIL/);
  assert.equal(await page.locator('#ask-button').isEnabled(), true);
});

test('live isolated service: offline mathematical learner flow on desktop and mobile', {
  skip: skip || (!process.env.LIVE_ASSISTANT_URL && 'Set LIVE_ASSISTANT_URL to run against the real local service.'),
}, async t => {
  const url = new URL(process.env.LIVE_ASSISTANT_URL);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname), 'Live checks run only against a local test service.');
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
  const page = await evidencePage(t, browser, { viewport: { width: 1280, height: 920 } });
  const externalRequests = [];
  page.on('request', req => { if (!req.url().startsWith(`${url.origin}/`)) externalRequests.push(req.url()); });
  await page.goto(url.href);
  await page.waitForFunction(() => !document.getElementById('access-button').disabled);
  assert.match(await page.locator('#mode-badge').textContent(), /без внешней модели/);
  if (await page.locator('#pilot-key-field').isVisible()) {
    assert.ok(process.env.LIVE_ASSISTANT_PILOT_KEY, 'The private live fixture needs a pilot key.');
    await page.locator('#pilot-key').fill(process.env.LIVE_ASSISTANT_PILOT_KEY);
  }
  await page.locator('#access-button').click();
  await page.locator('#workspace').waitFor({ state: 'visible' });
  await page.locator('#topic').selectOption('linear-equations');
  await page.locator('#sample-button').click();
  await page.locator('#ask-button').click();
  await page.locator('.answer-card').waitFor();
  assert.equal(await page.locator('.answer-card').count(), 1);
  assert.equal(await page.locator('.answer-steps li').count(), 1);
  assert.doesNotMatch(await page.locator('#answer-list').textContent(), /x = 5/);
  await page.getByRole('button', { name: 'Объясни проще', exact: true }).click();
  await page.getByText('Учтено. Следующая подсказка будет проще.', { exact: true }).waitFor();
  await page.locator('#next-button').click();
  await page.waitForFunction(() => document.querySelectorAll('.answer-card').length === 2);
  await page.locator('#explain-button').click();
  await page.waitForFunction(() => document.querySelectorAll('.answer-card').length === 3);
  assert.match(await page.locator('.answer-card').last().textContent(), /x = 5/);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  if (process.env.BROWSER_SCREENSHOT_DIR) {
    fs.mkdirSync(process.env.BROWSER_SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: path.join(process.env.BROWSER_SCREENSHOT_DIR, 'assistant-desktop.png'), fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  if (process.env.BROWSER_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.BROWSER_SCREENSHOT_DIR, 'assistant-mobile.png'), fullPage: true });
  // Exercise the actual local solver through the unchanged browser/API contract.
  // A fresh synthetic session keeps each journey within the existing rate limit.
  await page.locator('#forget-button').click();
  await page.locator('#access-panel').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.answer-card').count(), 0);
  await page.locator('#access-button').click();
  await page.locator('#workspace').waitFor({ state: 'visible' });
  for (const [topic, question, attempt, reason, expected] of [
    ['fractions', '1/2 + 1/3', '2/5', /знаменател/, '5/6'],
    ['gcd-lcm', 'НОК 12, 18 и 30', '6', /Похоже/, '180'],
    ['gcd-lcm', 'НОК 12, 18, 30 и 42', '6', /Похоже/, '1260'],
    ['gcd-lcm', 'НОК 12, 18, 30, 42 и 60', '6', /Похоже/, '1260']
  ]) {
    await page.locator('#topic').selectOption(topic);
    await page.locator('#question').fill(question);
    await page.locator('#attempt').fill(attempt);
    await page.locator('#ask-button').click();
    await page.waitForFunction(() => document.querySelectorAll('.answer-card').length === 1);
    const first = await page.locator('.answer-card').textContent();
    assert.match(first, reason); assert(!first.includes(expected));
    assert.equal(await page.locator('.answer-steps li').count(), 1);
    await page.locator('#explain-button').click();
    await page.waitForFunction(() => document.querySelectorAll('.answer-card').length === 2);
    assert.match(await page.locator('.answer-card').last().evaluate(el => { const copy = el.cloneNode(true); copy.querySelectorAll('math').forEach(m => m.replaceWith(m.getAttribute('data-plain'))); return copy.textContent; }), new RegExp(expected));
    assert.equal(await page.locator('.answer-card').first().textContent(), first);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  }
  // A separate synthetic learner keeps this independent journey below the
  // unchanged ten-requests-per-minute session limit.
  await page.locator('#forget-button').click();
  await page.locator('#access-panel').waitFor({ state: 'visible' });
  await page.locator('#access-button').click();
  await page.locator('#workspace').waitFor({ state: 'visible' });
  for (const [question, attempt, expected, forbidden] of [
    ['1/2 + 1/1', '1 1/2', /Твоё число подходит/, /Похоже/],
    ['-1/2 - 1/1', '-1\u00a01/2', /Твоё число подходит/, /Похоже/],
    ['7/2 + 2/1', '1 1/2', /другое число/, /Твоё число подходит/],
    ['10/1 + 2/1', '1 2', /Такую запись ответа здесь не проверяю/, /Твоё число подходит|Похоже/],
    ['1/2 + 1/1', '1, 5', /Такую запись ответа здесь не проверяю/, /Твоё число подходит|Похоже/]
  ]) {
    await page.locator('#topic').selectOption('fractions');
    await page.locator('#question').fill(question);
    await page.locator('#attempt').fill(attempt);
    const responsePromise = page.waitForResponse(r => r.url().endsWith('/api/ask') && r.request().method() === 'POST');
    await page.locator('#ask-button').click();
    assert.equal((await responsePromise).status(), 200);
    // The previous answer remains visible while a new response is in flight.
    // One card alone cannot distinguish that old response from this new one.
    await page.waitForFunction(() => document.getElementById('workspace').getAttribute('aria-busy') === 'false'
      && document.querySelectorAll('.answer-card').length === 1);
    const answer = await page.locator('.answer-card').textContent();
    assert.match(answer, expected); assert.doesNotMatch(answer, forbidden);
    assert.equal(await page.locator('.answer-steps li').count(), 1);
    assert.equal(await page.locator('#attempt').inputValue(), attempt);
  }
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    if (process.env.BROWSER_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.BROWSER_SCREENSHOT_DIR, `assistant-answer-input-${width}.png`), fullPage: true });
  }
  await page.locator('#forget-button').click();
  await page.locator('#access-panel').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.answer-card').count(), 0);
  assert.equal(await page.locator('#question').inputValue(), '');
  assert.deepEqual(externalRequests, []);
});

test('live numeric notation: mixed operands, equation correction and repeating answer', {
  skip: skip || (!process.env.LIVE_ASSISTANT_URL && 'Set LIVE_ASSISTANT_URL to run against the real local service.'),
}, async t => {
  const url = new URL(process.env.LIVE_ASSISTANT_URL);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname));
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
  const page = await evidencePage(t, browser, { viewport: { width: 390, height: 900 } });
  await page.goto(url.href);
  await page.waitForFunction(() => !document.getElementById('access-button').disabled);
  if (await page.locator('#pilot-key-field').isVisible()) {
    assert.ok(process.env.LIVE_ASSISTANT_PILOT_KEY);
    await page.locator('#pilot-key').fill(process.env.LIVE_ASSISTANT_PILOT_KEY);
  }
  await page.locator('#access-button').click();
  await page.locator('#workspace').waitFor({ state: 'visible' });
  const ask = async (topic, question, attempt) => {
    await page.locator('#topic').selectOption(topic);
    await page.locator('#question').fill(question);
    await page.locator('#attempt').fill(attempt);
    const response = page.waitForResponse(r => r.url().endsWith('/api/ask') && r.request().method() === 'POST');
    await page.locator('#ask-button').click();
    assert.equal((await response).status(), 200);
    await page.waitForFunction(() => document.getElementById('workspace').getAttribute('aria-busy') === 'false');
    assert.equal(await page.locator('#question').inputValue(), question);
    assert.equal(await page.locator('#attempt').inputValue(), attempt);
    assert.equal(await page.locator('.answer-card').last().locator('.answer-steps li').count(), 1);
    return page.locator('.answer-card').last().textContent();
  };
  const mixedHint = await ask('fractions', '1 1/2 + 1/2', '6');
  assert.doesNotMatch(mixedHint, /Твоё число подходит|Ответ:/);
  assert.match(mixedHint, /смешанн|целую часть/);
  const fullResponse = page.waitForResponse(r => r.url().endsWith('/api/ask') && r.request().method() === 'POST');
  await page.locator('#explain-button').click();
  assert.equal((await fullResponse).status(), 200);
  await page.waitForFunction(() => document.querySelectorAll('.answer-card').length === 2);
  assert.equal(await page.locator('.answer-card').first().textContent(), mixedHint);
  assert.match(await page.locator('.answer-card').last().textContent(), /Ответ: 2\./);
  assert.match(await ask('fractions', '1 1/2 + 1/2', '2'), /Твоё число подходит/);
  const ambiguous = await ask('linear-equations', '1 2x + 5 = 29', '2');
  assert.match(ambiguous, /цифры одного числа пиши подряд/);
  assert.doesNotMatch(ambiguous, /Твоё число подходит|Ответ:/);
  assert.match(await ask('linear-equations', '12x + 5 = 29', '2'), /Твоё число подходит/);
  assert.match(await ask('fractions', '1/3 + 0/1', '0,(3)'), /Твоё число подходит/);
  assert.match(await ask('fractions', '-1 1/2 + 1/2', '-1'), /Твоё число подходит/);
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    if (process.env.BROWSER_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.BROWSER_SCREENSHOT_DIR, `assistant-notation-${width}.png`), fullPage: true });
  }
  await page.locator('#forget-button').click();
  await page.locator('#access-panel').waitFor({ state: 'visible' });
});

test('live extended mathematics: intermediate equality and percentage meanings', {
  skip: skip || (!process.env.LIVE_ASSISTANT_URL && 'Set LIVE_ASSISTANT_URL to run against the real local service.'),
}, async t => {
  const url = new URL(process.env.LIVE_ASSISTANT_URL);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname));
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
  const page = await evidencePage(t, browser, { viewport: { width: 390, height: 900 } });
  await page.goto(url.href);
  await page.waitForFunction(() => !document.getElementById('access-button').disabled);
  if (await page.locator('#pilot-key-field').isVisible()) {
    assert.ok(process.env.LIVE_ASSISTANT_PILOT_KEY);
    await page.locator('#pilot-key').fill(process.env.LIVE_ASSISTANT_PILOT_KEY);
  }
  await page.locator('#access-button').click(); await page.locator('#workspace').waitFor({ state: 'visible' });
  for (const [topic, question, attempt, expected] of [
    ['linear-equations', '2(x+3)=x+9', '2x+3=x+9', /изменил решения/],
    ['linear-equations', '2(x+3)=x+9', '2x+6=x+9', /сохраняет решения/],
    ['linear-equations', '0,5x+2=0,25x+5', '12', /Твоё число подходит/],
    ['percentages', '15% числа равны 36', '240', /Твоё число подходит/],
    ['percentages', '30 от 120 в процентах', '25%', /Твоё число подходит/],
    ['percentages', 'Уменьши 240 на 15%', '204', /Твоё число подходит/],
    ['percentages', 'Увеличь 240 на 15%', '276', /Твоё число подходит/]
  ]) {
    await page.locator('#topic').selectOption(topic); await page.locator('#question').fill(question);
    await page.locator('#attempt').fill(attempt);
    const response = page.waitForResponse(r => r.url().endsWith('/api/ask') && r.request().method() === 'POST');
    await page.locator('#ask-button').click(); assert.equal((await response).status(), 200);
    await page.waitForFunction(() => document.getElementById('workspace').getAttribute('aria-busy') === 'false');
    assert.match(await page.locator('.answer-card').last().textContent(), expected);
    assert.equal(await page.locator('.answer-card').last().locator('.answer-steps li').count(), 1);
    assert.equal(await page.locator('#attempt').inputValue(), attempt);
  }
  await page.locator('#explain-button').click();
  await page.waitForFunction(() => document.querySelectorAll('.answer-card').length === 2);
  assert.match(await page.locator('.answer-card').last().textContent(), /Ответ: 276\./);
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    if (process.env.BROWSER_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.BROWSER_SCREENSHOT_DIR, `assistant-extended-${width}.png`), fullPage: true });
  }
  await page.locator('#forget-button').click(); await page.locator('#access-panel').waitFor({ state: 'visible' });
});

test('live clarification, original-operand visuals and optional reinforcement preserve the dialogue', {
  skip: skip || (!process.env.LIVE_ASSISTANT_URL && 'Set LIVE_ASSISTANT_URL for the real local service.'),
}, async t => {
  const url = new URL(process.env.LIVE_ASSISTANT_URL);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname));
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
  const page = await evidencePage(t, browser, { viewport: { width: 390, height: 900 } });
  const external = [], errors = [], asks = [];
  page.on('request', req => {
    if (!req.url().startsWith(`${url.origin}/`)) external.push(req.url());
    if (req.url().endsWith('/api/ask')) asks.push(req.postDataJSON());
  });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url.href);
  await page.waitForFunction(() => !document.getElementById('access-button').disabled);
  if (await page.locator('#pilot-key-field').isVisible()) await page.locator('#pilot-key').fill(process.env.LIVE_ASSISTANT_PILOT_KEY);
  await page.locator('#access-button').click();
  await page.locator('#workspace').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#task-help').getAttribute('open'), null);
  const send = async button => {
    const response = page.waitForResponse(r => r.url().endsWith('/api/ask') && r.request().method() === 'POST');
    await button.click(); assert.equal((await response).status(), 200);
    await page.waitForFunction(() => document.getElementById('workspace').getAttribute('aria-busy') === 'false');
  };
  await page.locator('#topic').selectOption('fractions');
  await page.locator('#question').fill('1 1/2 +');
  await send(page.locator('#ask-button'));
  assert.match(await page.locator('.answer-text').textContent(), /второе число/);
  assert.equal(await page.locator('.learning-visual').count(), 0);
  await page.locator('#question').fill('1 1/2 + 1/2');
  await send(page.locator('#ask-button'));
  assert.equal(await page.locator('.learning-visual').isVisible(), false);
  assert.equal(await page.locator('.practice-toggle').count(), 0);
  const beforePicture = asks.length;
  await page.getByRole('button', { name: 'Показать наглядно', exact: true }).click();
  assert.equal(asks.length, beforePicture);
  assert.equal(await page.locator('.learning-visual svg').count(), 2);
  assert.equal(await page.locator('.learning-visual svg').first().locator('.visual-filled').count(), 3);
  assert.equal(await page.locator('.learning-visual svg').last().locator('.visual-filled').count(), 1);
  assert.doesNotMatch(await page.locator('.answer-steps').textContent(), /Ответ: 2/);
  const originalHint = await page.locator('.answer-card').first().textContent();
  await send(page.locator('#explain-button'));
  assert.equal(await page.locator('.practice-form').isVisible(), false);
  const beforePractice = asks.length;
  await page.locator('.practice-toggle').click();
  assert.equal(asks.length, beforePractice);
  assert.match(await page.locator('.practice-question').textContent(), /1 1\/3 \+ 1\/6/);
  await page.locator('.practice-form input').fill('1/2');
  await send(page.getByRole('button', { name: 'Проверить пример', exact: true }));
  assert.match(await page.locator('.practice-result').textContent(), /другое число/);
  await page.locator('.practice-form input').fill('1 1/2');
  await send(page.getByRole('button', { name: 'Проверить пример', exact: true }));
  assert.match(await page.locator('.practice-result').textContent(), /Твоё число подходит/);
  assert.equal(await page.locator('.answer-card').count(), 2);
  assert.equal(await page.locator('.answer-card').first().textContent(), originalHint);
  assert.equal(await page.locator('#question').inputValue(), '1 1/2 + 1/2');
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    if (process.env.BROWSER_SCREENSHOT_DIR) await page.locator('.answer-panel').screenshot({ path: path.join(process.env.BROWSER_SCREENSHOT_DIR, `assistant-learning-support-${width}.png`) });
  }
  // An already rendered visual remains bound to its original question snapshot.
  await page.locator('#question').fill('-1 1/2 + 1/2');
  assert.equal(await page.locator('.learning-visual svg').first().locator('.visual-filled').count(), 3);
  await send(page.locator('#ask-button'));
  await page.getByRole('button', { name: 'Показать наглядно', exact: true }).click();
  assert.equal(await page.locator('.visual-point').first().getAttribute('cx'), '102');
  await page.locator('#topic').selectOption('percentages');
  await page.locator('#question').fill('Уменьши 240 на 15%');
  await send(page.locator('#ask-button'));
  await page.getByRole('button', { name: 'Показать наглядно', exact: true }).click();
  assert.equal(await page.locator('.learning-visual .visual-filled').getAttribute('width'), '52.8');
  assert.doesNotMatch(await page.locator('.learning-visual').textContent(), /204/);
  await page.locator('#question').fill('Реши задачу про проценты и покупку');
  await send(page.locator('#ask-button'));
  await page.locator('.answer-card').getByText('Выбрать пример записи или материал', { exact: true }).click();
  assert.equal(await page.locator('.answer-card .learning-resource').getAttribute('href'), 'https://mathexam.space/trainers/oge-basics/percentages/index.html');
  await page.locator('.answer-card').getByRole('button', { name: '15% от 240', exact: true }).click();
  assert.equal(await page.locator('#question').inputValue(), '15% от 240');
  assert.equal(await page.locator('#attempt').inputValue(), '');
  assert.equal(await page.locator('#external-consent').isChecked(), false);
  await send(page.locator('#ask-button'));
  assert.match(await page.locator('.verification').textContent(), /Вычисления проверены/);
  assert(asks.every(body => body.externalConsent === false));
  assert.equal(new Set(asks.map(body => body.requestId)).size, asks.length);
  assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
  await page.locator('#forget-button').click();
  await page.locator('#access-panel').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.practice-form').count(), 0);
  assert.equal(await page.locator('.learning-visual').count(), 0);
  assert.equal(await page.locator('#topic-help').textContent(), '');
  assert.deepEqual(external, []); assert.deepEqual(errors, []);
});

test('live study tools: topic override, formatted preview, editable lines, two-error hint, print and accessibility', {
  skip: skip || (!process.env.LIVE_ASSISTANT_URL && 'Set LIVE_ASSISTANT_URL for local-only checks.'),
}, async t => {
  const url = new URL(process.env.LIVE_ASSISTANT_URL);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname));
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
  const page = await evidencePage(t, browser, { viewport: { width: 390, height: 900 } });
  await page.addInitScript(() => {
    window.print = () => { window.printed = document.getElementById('print-selection').textContent; };
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.copied = text; } } });
  });
  await page.goto(url.href); await page.waitForFunction(() => !document.getElementById('access-button').disabled);
  await page.locator('#access-button').click(); await page.locator('#workspace').waitFor({ state: 'visible' });
  await page.locator('#question').fill('Вычисли: 1/2 + 1/3'); assert.equal(await page.locator('#topic').inputValue(), 'fractions');
  await page.locator('#condition-preview summary').click();
  assert.equal(await page.locator('#condition-preview mfrac').count(), 2);
  await page.getByRole('button', { name: 'Подтвердить эту запись', exact: true }).click();
  assert.equal(await page.locator('#question').inputValue(), '1/2 + 1/3');
  await page.getByRole('button', { name: 'Скопировать условие', exact: true }).click();
  assert.equal(await page.evaluate(() => window.copied), '1/2 + 1/3');
  await page.locator('#topic').selectOption('linear-equations'); await page.locator('#question').fill('1/2 + 1/3');
  assert.equal(await page.locator('#topic').inputValue(), 'linear-equations');
  await page.locator('#question').fill('3x+5=20');
  const submit = async attempt => {
    await page.locator('#attempt').fill(attempt);
    const response = page.waitForResponse(r => r.url().endsWith('/api/ask'));
    await page.locator('#ask-button').click(); assert.equal((await response).status(), 200);
    await page.waitForFunction(() => document.getElementById('workspace').getAttribute('aria-busy') === 'false');
  };
  await submit('3x=15\nx=15'); const first = await page.locator('.answer-card').first().textContent();
  assert.equal(await page.locator('.two-errors').isVisible(), false);
  await submit('3x=15\nx=4');
  assert.equal(await page.locator('.answer-card').count(), 2);
  assert.equal(await page.locator('.answer-card').first().textContent(), first);
  assert.equal(await page.locator('.two-errors').isVisible(), true);
  assert.equal(await page.locator('.answer-card').filter({ hasText: 'Полный разбор' }).count(), 0);
  await page.getByRole('button', { name: 'Попробую сам', exact: true }).click();
  await page.locator('.answer-card').first().getByRole('button', { name: 'Изменить эту попытку', exact: true }).click();
  assert.equal(await page.locator('#attempt').inputValue(), '3x=15\nx=15');
  await submit('3x=15\nx=5'); assert.equal(await page.locator('.answer-card').count(), 3);
  assert.match(await page.locator('.answer-card').last().textContent(), /сохраняют решения/);
  await page.locator('.answer-card').last().getByText('Почему?', { exact: true }).click();
  await page.locator('.answer-card').last().getByRole('button', { name: 'Отметить трудный шаг', exact: true }).click();
  await page.getByText('Мои трудные шаги в этой вкладке', { exact: true }).click();
  await page.getByRole('button', { name: /^Шаг 3:/ }).click();
  assert.equal(await page.locator('.answer-card').last().evaluate(el => el === document.activeElement), true);
  await page.locator('.answer-card').last().getByRole('button', { name: 'Напечатать этот разбор', exact: true }).click();
  assert.match(await page.evaluate(() => window.printed), /3x\+5=20/);
  assert.doesNotMatch(await page.evaluate(() => window.printed), /Удалить мой сеанс|Отметить трудный шаг/);
  await page.getByText('Удобный вид и навигация', { exact: true }).click();
  await page.getByLabel('Размер текста', { exact: true }).selectOption('largest');
  await page.getByRole('button', { name: 'Высокий контраст', exact: true }).click();
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  }
  await page.getByRole('button', { name: 'К условию', exact: true }).click();
  assert.equal(await page.locator('#question').evaluate(el => el === document.activeElement), true);
  await page.getByText('Математическая клавиатура', { exact: true }).click();
  await page.locator('#attempt').focus(); await page.getByRole('button', { name: 'Степень ^', exact: true }).click();
  assert.match(await page.locator('#attempt').inputValue(), /\^$/);
  assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
  await page.locator('#forget-button').click(); await page.locator('#access-panel').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#print-selection').count(), 0);
  assert.equal(await page.locator('.answer-card').count(), 0);
});

test('live exact math foundations: new topics, fractions, units and polynomial reconstruction', {
  skip: skip || (!process.env.LIVE_ASSISTANT_URL && 'Set LIVE_ASSISTANT_URL for local-only checks.'),
}, async t => {
  const url=new URL(process.env.LIVE_ASSISTANT_URL);assert.ok(['127.0.0.1','localhost'].includes(url.hostname));
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
  const page=await evidencePage(t,browser,{viewport:{width:390,height:900}});
  await page.goto(url.href);await page.waitForFunction(()=>!document.getElementById('access-button').disabled);
  await page.locator('#access-button').click();await page.locator('#workspace').waitFor({state:'visible'});
  for(const [topic,q,a] of [
    ['arithmetic','(1/2+1/3)*6','5'],['arithmetic','(-2)^-3','-1/8'],['arithmetic','√72','6√2'],
    ['fractions','1/2 : 3/4','2/3'],['comparison','Сравни 1 1/2 и 7/4','<'],
    ['proportions','x/3=4/6','2'],['conversions','250 см в м','2500 мм'],
    ['polynomials','Разложи: x^3+2x^2+3x+6','(x+2)*(x^2+3)'],
    ['arithmetic','1/3; округли до 2 знаков','0,33']
  ]){
    await page.locator('#topic').selectOption(topic);await page.locator('#question').fill(q);await page.locator('#attempt').fill(a);
    const response=page.waitForResponse(r=>r.url().endsWith('/api/ask'));await page.locator('#ask-button').click();
    const r=await response;assert.equal(r.status(),200,q);const body=await r.json();assert.equal(body.answer.attemptStatus,'correct',q);
    await page.waitForFunction(()=>document.getElementById('workspace').getAttribute('aria-busy')==='false');
    assert.equal(await page.locator('.answer-card').count(),1);assert.match(await page.locator('.verification').textContent(),/Вычисления проверены/);
    assert.equal(await page.locator('#attempt').inputValue(),a);assert.equal(await page.locator('.answer-steps li').count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  }
  await page.locator('#explain-button').click();await page.waitForFunction(()=>document.querySelectorAll('.answer-card').length===2);
  assert.match(await page.locator('.answer-card').last().textContent(),/0,33 \(приближённо\)/);
  for(const width of [320,390,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
  if(process.env.BROWSER_SCREENSHOT_DIR){fs.mkdirSync(process.env.BROWSER_SCREENSHOT_DIR,{recursive:true});await page.locator('.answer-panel').screenshot({path:path.join(process.env.BROWSER_SCREENSHOT_DIR,'math-foundations.png')});}
});
