'use strict';

// Launch via `node --test tools/motion-model.browser.cjs` with Playwright and Chromium.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const http = require('node:http');
const { once } = require('node:events');
let chromium;
try {
  ({chromium} = require('playwright'));
} catch (error) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw error;
  ({chromium} = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright')));
}

const root = path.resolve(__dirname, '..');
const coursePath = '/trainers/motion-grade6/index.html';
const legacyKey = 'maxim-motion-v1';
const draftKey = 'motion-model-lab-v1';
const oldProgress = JSON.stringify({'8-0': 'assisted', '4-7': 'alone'});
const ids = {
  meet: {unknown: 'time', reason: 'both', sense: [6,6], question: 'Через сколько часов они встретятся?', convert: '12', start: [0,10], v: [12,-8], prediction: 'sum', equation: '10-8x=12x', answer: '0,5'},
  chase: {unknown: 'time', reason: 'gain', sense: [30,30], question: 'Через сколько часов Аня догонит Борю?', convert: '12', start: [0,10], v: [12,8], prediction: 'difference', equation: '10/(12-8)', answer: '2,5'},
  delay: {unknown: 'late', reason: 'headstart', sense: [18,18], question: 'Через сколько часов после своего выезда Маша догонит Лену?', convert: '0,75', start: [0,6], v: [12,8], prediction: 'difference', equation: '12x=8(x+0,75)', answer: '1,5'},
  signal: {unknown: 'contact', reason: 'threshold', sense: [9,14], question: 'Через сколько часов связь впервые станет возможна?', convert: '5', start: [0,20], v: [6,-4], prediction: 'sum', equation: '6x+5=20-4x', answer: '1.5'},
};
const types = {'.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json'};
let browser, server, origin;

before(async () => {
  server = http.createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/embedded') {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.end('<iframe src="' + coursePath + '#model"></iframe>');
      return;
    }
    const filename = path.resolve(root, '.' + pathname);
    if (!filename.startsWith(root + path.sep)) return response.writeHead(404).end();
    try {
      const body = await fs.readFile(filename);
      response.writeHead(200, {'Content-Type': (types[path.extname(filename)] || 'application/octet-stream') + '; charset=utf-8'});
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  origin = 'http://127.0.0.1:' + server.address().port;
  const executablePath = process.env.CHROMIUM_EXECUTABLE || process.env.CHROMIUM_EXECUTABLE_PATH;
  browser = await chromium.launch({headless: true, ...(executablePath ? {executablePath} : {}), args: ['--no-sandbox']});
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

async function openPage(t, width, offline = false) {
  const context = await browser.newContext({locale: 'ru-RU', viewport: {width, height: 860}, reducedMotion: 'reduce', offline});
  t.after(() => context.close());
  const errors = [];
  const page = await context.newPage();
  page.setDefaultTimeout(4500);
  page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto(offline ? pathToFileURL(path.join(root, coursePath)).href : origin + coursePath);
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [legacyKey, oldProgress]);
  await page.reload();
  return page;
}

async function stage(page, name) {
  await page.locator('#mm-stage[data-step="' + name + '"]').waitFor();
  const overflow = await page.evaluate(() => {
    if (document.documentElement.scrollWidth <= innerWidth + 1) return [];
    const elements = [...document.querySelectorAll('#motion-model-lab *')]
      .filter(el => el.getBoundingClientRect().right > innerWidth + 1 && !el.closest('.mb-table'))
      .map(el => el.tagName + '.' + el.className + ': ' + Math.round(el.getBoundingClientRect().right))
      .slice(0, 12);
    return ['viewport=' + innerWidth + ', page=' + document.documentElement.scrollWidth, ...elements];
  });
  assert.deepEqual(overflow, [], 'horizontal scroll at ' + name + ': ' + overflow.join(', '));
}

async function next(page) {
  await page.locator('#mm-next').click();
}

async function builder(page, spec, kind, challenge) {
  const host = page.locator('#model-builder');
  const action = name => host.locator('[data-mb-action="' + name + '"]');
  await action(kind === 'diagram' ? kind : 'table').click();
  if (kind === 'diagram') {
    for (let i = 0; i < 2; i++) {
      const start = host.locator('[data-mb-start="' + i + '"]');
      assert.equal(await start.inputValue(), '', 'pupil supplies starting point');
      await start.fill(String(spec.start[i]));
      await host.locator('[data-mb-dir="' + i + '"]').selectOption(String(Math.sign(spec.v[i])));
      await host.locator('[data-mb-speed="' + i + '"]').fill(String(Math.abs(spec.v[i])));
    }
  } else {
    assert.equal(await host.locator('[data-mb-actor]').count(), 0, 'pupil chooses rows');
    const columns = kind === 'signed-table' ? ['rate', 'start'] : ['dir', 'start', 'speed'];
    for (const field of columns) {
      await host.locator('[data-mb-col-picker]').selectOption(field);
      await action('add-col').click();
    }
    // Build the table in a different row order from the text.
    for (const i of [1, 0]) {
      await action('add-row').click();
      const row = 1 - i;
      await host.locator('[data-mb-actor="' + row + '"]').selectOption(String(i));
      const cell = field => host.locator('[data-mb-cell="' + row + '-' + field + '"]');
      await cell('start').fill(String(spec.start[i]));
      if (kind === 'signed-table') {
        await cell('rate').fill(String(spec.v[i]));
      } else {
        await cell('dir').selectOption(String(Math.sign(spec.v[i])));
        await cell('speed').fill(String(Math.abs(spec.v[i])));
      }
    }
  }
  const prediction = host.locator('[data-mb-prediction]');
  if (challenge) {
    await prediction.selectOption(spec.prediction === 'sum' ? 'difference' : 'sum');
    await action('experiment').click();
    if (await action('tick').isVisible()) await action('tick').click();
    await next(page);
    await stage(page, 'build');
  }
  await prediction.selectOption(spec.prediction);
  await action('experiment').click();
  // A keyboard step on the range is a real experiment, with a text equivalent to the moving markers.
  const slider = host.locator('[data-mb-time]');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await slider.inputValue(), '1');
  assert.match(await slider.getAttribute('aria-valuetext'), /1 мин/);
  if (challenge) {
    await action('play').click();
    await page.waitForFunction(() => Number(document.querySelector('[data-mb-time]').value) > 1);
    await action('play').click();
    assert.match(await action('play').innerText(), /Пуск/);
  }
  await action('rewind').click();
  await action('tick').click();
  assert.equal(await slider.inputValue(), '6');
  const observedGap = Math.abs(spec.start[1] - spec.start[0] + (spec.v[1]-spec.v[0]) / 10);
  const gapText = await slider.getAttribute('aria-valuetext');
  assert.ok(gapText.replace(',', '.').includes(Number(observedGap.toFixed(2)) + ' км'), gapText);
  await next(page);
  await stage(page, 'model');
}

async function complete(page, id, kind, challenge = false) {
  const spec = ids[id];
  await page.locator('#mm-case').selectOption(id);
  await stage(page, 'read');
  assert.ok(await page.getByText(spec.question, {exact: true}).isVisible());
  assert.equal(await page.locator('#mm-answer:visible').count(), 0);
  await page.locator('#mm-question').selectOption(spec.unknown);
  if (challenge) {
    await page.locator('#mm-convert').fill('999');
    await next(page);
    await stage(page, 'read');
    await page.locator('#mm-hint').click();
  }
  await page.locator('#mm-convert').fill(spec.convert);
  await next(page);
  await stage(page, 'build');
  await next(page);
  await stage(page, 'build');
  await builder(page, spec, kind, challenge);

  await page.locator('#mm-reason').selectOption(spec.reason);
  if (challenge) {
    await page.locator('#mm-equation').fill('x=' + spec.answer);
    await next(page);
    await stage(page, 'model');
  }
  await page.locator('#mm-equation').fill(spec.equation);
  if (challenge) {
    await page.reload();
    await stage(page, 'model');
    assert.equal(await page.locator('#mm-equation').inputValue(), spec.equation);
  }
  await next(page);
  await stage(page, 'solve');
  await page.locator('#mm-answer').fill(spec.answer);
  if (challenge) {
    await page.locator('#mm-answer-unit').selectOption('км');
    await next(page);
    await stage(page, 'solve');
    assert.equal(await page.locator('#mm-answer-unit').getAttribute('aria-invalid'), 'true');
  }
  await page.locator('#mm-answer-unit').selectOption('ч');
  if (challenge) {
    await page.locator('#mm-answer').fill('999');
    await next(page);
    await stage(page, 'solve');
    await page.locator('#mm-answer').fill(spec.answer);
  }
  await next(page);
  await stage(page, 'verify');
  await page.locator('#mm-verify-a').fill(String(spec.sense[0]));
  if (challenge) {
    await page.locator('#mm-verify-b').fill('999');
    await next(page);
    await stage(page, 'verify');
  }
  await page.locator('#mm-verify-b').fill(String(spec.sense[1]));
  await next(page);
  await stage(page, 'done');
  const result = await page.locator('#mm-stage').innerText();
  assert.match(result, challenge ? /с подсказк|с помощью/i : /самостоятельн|без подсказ/i);
}

test('desktop conducts a contrast experiment and solves two transfers from the same course', async t => {
  const page = await openPage(t, 1280);
  const entry = page.locator('#motion-model-entry');
  await entry.focus();
  await page.keyboard.press('Enter');
  await complete(page, 'meet', 'diagram', true);
  await page.locator('#mm-transfer').click();
  assert.equal(await page.locator('#mm-case').inputValue(), 'chase');
  await complete(page, 'chase', 'table');
  await complete(page, 'delay', 'diagram');
  await complete(page, 'signal', 'signed-table');
  const route = page.locator('#motion-model-route');
  await route.locator(':scope > summary').click();
  assert.equal(await route.locator(':scope > ol > li').count(), 9);
  const grades = route.locator(':scope > details');
  const independentResults = ['300', '50%', '2,5', '2,4', '10 м', '5 800', '40,5'];
  assert.equal(await grades.count(), 7);
  for (let i = 0; i < 7; i++) {
    const example = grades.nth(i);
    await example.locator(':scope > summary').click();
    await example.locator('details > summary').click();
    const solution = example.locator('details > p');
    assert.ok(await solution.isVisible());
    assert.ok((await solution.innerText()).includes(independentResults[i]));
  }
  await page.locator('#mm-course').click();
  await entry.waitFor();
  assert.equal(await page.evaluate(key => localStorage.getItem(key), legacyKey), oldProgress);
  await entry.click();
  await stage(page, 'done');
});

test('320 px offline learner can build a reversed-row table, reload and finish', async t => {
  const page = await openPage(t, 320, true);
  await page.locator('#motion-model-entry').click();
  await complete(page, 'signal', 'table', true);
  await page.reload();
  await stage(page, 'done');
  assert.equal(await page.evaluate(key => localStorage.getItem(key), legacyKey), oldProgress);
});

test('managed or embedded entry cannot mutate standalone modeling progress', async t => {
  const page = await openPage(t, 390);
  await page.goto(origin + coursePath + '?learning=1#model');
  assert.equal(await page.locator('#motion-model-entry').isVisible(), false);
  assert.equal(await page.locator('#motion-model-lab').isVisible(), false);
  await page.goto(origin + '/embedded');
  const frame = page.frameLocator('iframe');
  await frame.locator('#main h1').waitFor();
  assert.equal(await frame.locator('#motion-model-entry').isVisible(), false);
  assert.equal(await frame.locator('#motion-model-lab').isVisible(), false);
  assert.equal(await page.evaluate(key => localStorage.getItem(key), draftKey), null);
  assert.equal(await page.evaluate(key => localStorage.getItem(key), legacyKey), oldProgress);
});
