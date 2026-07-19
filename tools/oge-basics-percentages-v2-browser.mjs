import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pagePaths = [
  '/trainers/oge-basics/percentages/',
  '/trainers/oge-basics/percentages/percent-meaning.html',
  '/trainers/oge-basics/percentages/percent-of-number-and-whole.html',
  '/trainers/oge-basics/percentages/percent-choose-question.html',
  '/trainers/oge-basics/percentages/percent-change.html',
  '/trainers/oge-basics/percentages/proportion.html',
  '/trainers/oge-basics/percentages/percent-final-checkpoint.html'
];
const trainerPaths = pagePaths.slice(1);
const quickSelectPaths = [
  '/trainers/oge-basics/percentages/index.html',
  ...trainerPaths
];
const viewports = {
  desktop: { width: 1280, height: 720 },
  mobile: { width: 390, height: 844 }
};

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.json')) return 'application/json; charset=utf-8';
  if (file.endsWith('.xml')) return 'application/xml; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (file.endsWith('.ico')) return 'image/x-icon';
  return 'application/octet-stream';
}

function startServer() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname === '/__iframe.html') {
      const source = url.searchParams.get('src') || '';
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}html,body,iframe{width:100%;height:100%;margin:0;border:0;overflow:hidden}</style><iframe title="Trainer smoke" src="${source.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"></iframe>`);
      return;
    }
    let file = path.resolve(repoRoot, `.${decodeURIComponent(url.pathname)}`);
    if (!file.startsWith(`${repoRoot}${path.sep}`)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }
    try {
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      response.writeHead(200, { 'Content-Type': contentType(file) });
      response.end(fs.readFileSync(file));
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function observe(page, label, failures) {
  page.on('console', message => {
    if (message.type() === 'error') failures.push(`${label}: console: ${message.text()}`);
  });
  page.on('pageerror', error => failures.push(`${label}: pageerror: ${error.message}`));
}

async function assertNoOverflow(frame, label) {
  const dimensions = await frame.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body?.scrollWidth || 0,
    viewportWidth: window.innerWidth
  }));
  assert.ok(
    Math.max(dimensions.documentWidth, dimensions.bodyWidth) <= dimensions.viewportWidth + 1,
    `${label}: horizontal overflow ${JSON.stringify(dimensions)}`
  );
}

async function answerCurrentPractice(page, answerOverride) {
  const current = await page.evaluate(() => ({
    type: task.type,
    answer: task.answer,
    skill: task.skill
  }));
  const answer = answerOverride ?? current.answer;
  if (current.type === 'choice') {
    await page.locator(`#p-q input[name="practice"][value="${answer}"]`).check();
  } else {
    await page.locator('#practice-in').fill(String(answer));
  }
  return current;
}

async function fillCheck(page) {
  await page.evaluate(() => {
    check.forEach((item, index) => {
      if (item.type === 'choice') {
        const input = document.querySelector(
          `#check-list input[name="chk${index}"][value="${item.answer}"]`
        );
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        const input = document.querySelector(`#chk${index}-in`);
        input.value = String(item.answer);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });
}

async function runBehavior(browser, origin, pathname, failures) {
  const context = await browser.newContext({ viewport: viewports.desktop });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
  const page = await context.newPage();
  observe(page, `behavior ${pathname}`, failures);
  const response = await page.goto(`${origin}${pathname}`, { waitUntil: 'load' });
  assert.equal(response?.status(), 200, pathname);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });

  await page.locator('[data-nav="practice"]').click();
  const reviewed = page.locator('#s-rev');
  assert.equal(await reviewed.textContent(), '0');
  const independentBefore = Number(await page.locator('#s-ind').textContent());
  const supportedBefore = Number(await page.locator('#s-sup').textContent());

  await page.locator('#p-sol').click();
  assert.equal(await reviewed.textContent(), '1');
  for (let index = 0; index < 9; index += 1) await page.locator('#p-sol').click();
  assert.equal(await reviewed.textContent(), '1');

  await page.locator('[data-nav="home"]').click();
  await page.locator('[data-nav="practice"]').click();
  assert.equal(await reviewed.textContent(), '1');
  assert.equal(await page.locator('#p-check').isEnabled(), true);

  const reviewedTask = await answerCurrentPractice(page);
  await page.locator('#p-check').click();
  assert.equal(await reviewed.textContent(), '1');
  assert.equal(Number(await page.locator('#s-ind').textContent()), independentBefore);
  assert.equal(Number(await page.locator('#s-sup').textContent()), supportedBefore + 1);
  assert.equal(
    await page.evaluate(skill => state.streak[skill], reviewedTask.skill),
    0
  );

  await page.locator('#p-next').click();
  await page.locator('#p-sol').click();
  for (let index = 0; index < 9; index += 1) await page.locator('#p-sol').click();
  assert.equal(await reviewed.textContent(), '2');

  await page.locator('#p-next').click();
  await page.locator('#p-h1').click();
  assert.equal(await reviewed.textContent(), '2');

  await page.reload({ waitUntil: 'load' });
  await page.locator('[data-nav="practice"]').click();
  assert.equal(await reviewed.textContent(), '2');
  assert.equal(Number(await page.locator('#s-sup').textContent()), supportedBefore + 1);

  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.locator('[data-nav="practice"]').click();
  assert.equal(await reviewed.textContent(), '0');
  await page.locator('#p-sol').click();
  assert.equal(await reviewed.textContent(), '1');

  await page.locator('#p-next').click();
  const wrongTask = await page.evaluate(() => ({ type: task.type, answer: task.answer }));
  if (wrongTask.type === 'choice') {
    const wrong = await page.locator('#p-q input[name="practice"]').evaluateAll(
      (items, right) => Number(items.find(item => Number(item.value) !== right).value),
      wrongTask.answer
    );
    await answerCurrentPractice(page, wrong);
  } else {
    await answerCurrentPractice(page, Number(wrongTask.answer) + 12345);
  }
  await page.locator('#p-check').click();
  assert.ok((await page.locator('#p-fb').getAttribute('class')).includes('bad'));
  await answerCurrentPractice(page);
  await page.locator('#p-check').click();
  assert.ok((await page.locator('#p-fb').getAttribute('class')).includes('good'));

  await page.locator('[data-nav="learn"]').click();
  assert.equal(await page.locator('#view-learn').isVisible(), true);
  assert.ok((await page.locator('#l-q').innerText()).trim().length > 0);

  await page.locator('[data-nav="check"]').click();
  await page.locator('#check-start').click();
  await fillCheck(page);
  await page.locator('#check-finish').click();
  assert.equal(await page.locator('#check-result').isVisible(), true);
  assert.match(await page.locator('#r-score').innerText(), /^\d+\s*\/\s*\d+$/);
  await page.locator('#copy-btn').click();
  await page.locator('#copy-note').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#copy-note').innerText(), 'Скопировано.');

  await context.close();
}

const server = await startServer();
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const failures = [];
const summary = {
  desktop: 0,
  mobile: 0,
  iframeDesktop: 0,
  iframeMobile: 0,
  quickSelect: 0,
  behavior: 0
};

let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });

  for (const [mode, viewport] of Object.entries(viewports)) {
    const context = await browser.newContext({ viewport });
    for (const pathname of pagePaths) {
      const page = await context.newPage();
      observe(page, `${mode} ${pathname}`, failures);
      const response = await page.goto(`${origin}${pathname}`, { waitUntil: 'load' });
      assert.equal(response?.status(), 200, `${mode}: ${pathname}`);
      assert.ok((await page.title()).trim(), `${mode}: title ${pathname}`);
      await assertNoOverflow(page, `${mode}: ${pathname}`);
      summary[mode] += 1;
      await page.close();
    }
    await context.close();
  }

  for (const [mode, viewport] of Object.entries(viewports)) {
    const context = await browser.newContext({ viewport });
    for (const pathname of pagePaths) {
      const page = await context.newPage();
      observe(page, `iframe-${mode} ${pathname}`, failures);
      const wrapper = `${origin}/__iframe.html?src=${encodeURIComponent(pathname)}`;
      const response = await page.goto(wrapper, { waitUntil: 'load' });
      assert.equal(response?.status(), 200, `iframe-${mode}: ${pathname}`);
      const frame = page.frames().find(item => new URL(item.url()).pathname === pathname);
      assert.ok(frame, `iframe-${mode}: frame ${pathname}`);
      await assertNoOverflow(frame, `iframe-${mode}: ${pathname}`);
      summary[mode === 'desktop' ? 'iframeDesktop' : 'iframeMobile'] += 1;
      await page.close();
    }
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: viewports.desktop });
    const page = await context.newPage();
    observe(page, 'quick-select', failures);
    const response = await page.goto(`${origin}/trainers/trainer-board.html`, {
      waitUntil: 'load'
    });
    assert.equal(response?.status(), 200);
    await page.waitForFunction(
      () => document.querySelectorAll('#trainerQuick option').length === 29
    );
    for (const pathname of quickSelectPaths) {
      await page.locator('#trainerQuick').selectOption(pathname);
      await page.waitForFunction(
        expected =>
          document.querySelector('#trainerFrame')?.contentWindow?.location.pathname === expected,
        pathname
      );
      const frameUrl = page.frames().find(item =>
        new URL(item.url()).pathname === pathname
      )?.url();
      assert.ok(frameUrl, `quick-select: ${pathname}`);
      assert.equal(await page.locator('#trainerQuickStatus').innerText(), 'Открывается в доске');
      summary.quickSelect += 1;
    }
    await context.close();
  }

  for (const pathname of trainerPaths) {
    await runBehavior(browser, origin, pathname, failures);
    summary.behavior += 1;
  }

  assert.deepEqual(failures, []);
  process.stdout.write(`${JSON.stringify({ ok: true, ...summary, failures }, null, 2)}\n`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
