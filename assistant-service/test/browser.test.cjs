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

async function fixture(t, options = {}) {
  const calls = [];
  const csrf = 'test-only-csrf-marker';
  const files = {
    '/': ['index.html', 'text/html; charset=utf-8'],
    '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
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
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: options.viewport || { width: 1280, height: 920 } });
  const page = await context.newPage();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const unexpectedRequests = [];
  page.on('request', req => { if (!req.url().startsWith(`${origin}/`)) unexpectedRequests.push(req.url()); });
  await page.goto(origin);
  await page.waitForFunction(() => !document.getElementById('access-button').disabled);
  if (options.key) await page.locator('#pilot-key').fill(options.key);
  await page.locator('#access-button').click();
  await page.locator('#workspace').waitFor({ state: 'visible' });
  return { page, calls, origin, unexpectedRequests };
}

const skip = !chromium ? 'Playwright is not installed; browser validation has not run.' : false;

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
  await page.waitForFunction(() => document.querySelector('.verification')?.textContent.includes('Ответ модели'));
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
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1280, height: 920 } });
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
    assert.match(await page.locator('.answer-card').last().textContent(), new RegExp(expected));
    assert.equal(await page.locator('.answer-card').first().textContent(), first);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  }
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    if (process.env.BROWSER_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.BROWSER_SCREENSHOT_DIR, `assistant-local-lcm-${width}.png`), fullPage: true });
  }
  await page.locator('#forget-button').click();
  await page.locator('#access-panel').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.answer-card').count(), 0);
  assert.equal(await page.locator('#question').inputValue(), '');
  assert.deepEqual(externalRequests, []);
});
