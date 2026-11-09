'use strict';

// CI regression for the published learner entry points and changed similarity
// lessons. Screenshots are review evidence, not a mathematical-content verdict.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'artifacts/merzlyak-learning-path');
const viewports = [{ width: 320, height: 900 }, { width: 1280, height: 900 }];
const lessons = [
  ['merzlyak-base-8-12', 'Подобные треугольники'],
  ['merzlyak-base-8-13', 'Первый признак подобия треугольников'],
  ['merzlyak-base-8-14', 'Второй и третий признаки подобия треугольников'],
];
const stages = ['Понять', 'Исследовать', 'Доказать', 'Решить с опорой', 'Самостоятельно', 'Своими словами'];
const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};
const evidence = { commit: process.env.GITHUB_SHA || null, viewports, states: [], errors: [], completed: false };
fs.mkdirSync(output, { recursive: true });

const server = http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    response.setHeader('Content-Type', mimeTypes[path.extname(file)] || 'application/octet-stream');
    response.end(fs.readFileSync(file));
  } catch {
    response.writeHead(404).end();
  }
});

async function visible(locator, message) {
  await locator.waitFor({ state: 'visible' });
  assert(await locator.isVisible(), message);
}

async function recordLayout(page, name, viewport) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const layout = await page.evaluate(() => {
    const width = window.innerWidth;
    return {
      width,
      scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      overflowing: [...document.body.querySelectorAll('*')].filter(node => {
        const box = node.getBoundingClientRect();
        return box.width && (box.right > width + 1 || box.left < -1) && getComputedStyle(node).position !== 'fixed';
      }).slice(0, 8).map(node => ({ tag: node.tagName, id: node.id, class: node.className?.baseVal ?? node.className })),
    };
  });
  const screenshot = `${name}-${viewport.width}.png`;
  await page.screenshot({ path: path.join(output, screenshot), fullPage: false });
  evidence.states.push({ name, viewport, ...layout, screenshot });
  assert(layout.scrollWidth <= viewport.width + 1, `${name} overflows at ${viewport.width}px: ${JSON.stringify(layout)}`);
}

async function openPage(page, url) {
  const response = await page.goto(url, { waitUntil: 'load' });
  assert(response?.ok(), `Cannot open ${url}: ${response?.status()}`);
}

async function checkHomes(page, base, viewport) {
  await openPage(page, base + '/geometry-merzlyak/');
  await visible(page.getByRole('heading', { level: 1, name: 'Мой путь по геометрии', exact: true }), '7–9 course heading');
  let journey = page.getByRole('region', { name: 'Мой путь по курсу', exact: true });
  await visible(journey, '7–9 learning path');
  await visible(journey.getByRole('link', { name: /Начать урок/ }), '7–9 start action');
  await recordLayout(page, 'geometry-home', viewport);
  for (const summary of await journey.locator('summary').all()) {
    if (!(await summary.evaluate(node => node.parentElement.open))) await summary.click();
  }
  assert.equal(await journey.getByRole('progressbar').count() > 0, true, '7–9 path includes chapter progress');
  await recordLayout(page, 'geometry-home-expanded', viewport);

  await openPage(page, base + '/stereo-course/merzlyak-10-base/');
  journey = page.getByRole('region', { name: 'Мой путь по курсу', exact: true });
  await visible(journey, '10th-grade learning path loaded');
  await visible(journey.getByRole('heading', { level: 2, name: 'Мой путь по курсу', exact: true }), '10th-grade path heading');
  await recordLayout(page, 'stereo-home', viewport);
  for (const summary of await journey.locator('summary').all()) {
    if (!(await summary.evaluate(node => node.parentElement.open))) await summary.click();
  }
  await recordLayout(page, 'stereo-home-expanded', viewport);
  await journey.getByRole('button', { name: 'Начать с первой темы', exact: true }).click();
  await visible(page.getByRole('navigation', { name: 'Дальше по теме', exact: true }), 'Theory offers a next learning step');
  await recordLayout(page, 'stereo-first-topic', viewport);
  await page.getByRole('button', { name: /^Перейти к практике:/ }).click();
  const title = await page.getByRole('heading', { level: 1 }).innerText();
  await recordLayout(page, 'stereo-first-practice', viewport);
  await page.reload({ waitUntil: 'load' });
  await visible(page.getByRole('heading', { level: 1, name: title, exact: true }), 'A practice card survives reload');
  await openPage(page, base + '/stereo-course/merzlyak-10-base/');
  await page.getByRole('region', { name: 'Мой путь по курсу', exact: true }).getByRole('button', { name: /^Продолжить:/ }).click();
  await visible(page.getByRole('heading', { level: 1, name: title, exact: true }), 'Continue returns to the same practice card');
}

async function checkSimilarity(page, base, viewport) {
  for (const [id, title] of lessons) {
    await openPage(page, `${base}/geometry-merzlyak/atlas/${id}.html`);
    await visible(page.getByRole('heading', { level: 1, name: title, exact: true }), id + ' heading');
    for (const [index, stage] of stages.entries()) {
      await page.getByRole('button', { name: `${String(index + 1).padStart(2, '0')} ${stage}`, exact: true }).click();
      await visible(page.locator('#lesson').getByRole('heading', { level: 2 }), id + ' stage ' + stage);
      if (index === 1) await visible(page.locator('#geo-board canvas'), 'Investigation has a working drawing surface');
      if (index === 3) await page.getByRole('button', { name: 'Показать смысл шага', exact: true }).click();
      if (index === 4) await page.getByRole('button', { name: 'Нужен разбор', exact: true }).click();
      await recordLayout(page, `${id}-stage-${index + 1}`, viewport);
    }
    const draft = 'Если соответствующие углы равны, нужно указать соответствие вершин и основание подобия.';
    await page.getByRole('textbox', { name: 'Моё доказательство', exact: true }).fill(draft);
    // Leave by a learner control so this also exercises saving a manual draft.
    await page.getByRole('button', { name: 'Завершить занятие', exact: true }).click();
    await page.reload({ waitUntil: 'load' });
    assert.equal(await page.getByRole('textbox', { name: 'Моё доказательство', exact: true }).inputValue(), draft, id + ' preserves written work');
  }
}

let browser;
(async () => {
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const base = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({ headless: true, ...(process.env.GEOMETRY_CHROMIUM ? { executablePath: process.env.GEOMETRY_CHROMIUM } : {}) });
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      page.on('pageerror', error => evidence.errors.push({ viewport, url: page.url(), kind: 'pageerror', message: error.message }));
      page.on('console', message => {
        if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) evidence.errors.push({ viewport, url: page.url(), kind: 'console', message: message.text() });
      });
      await checkHomes(page, base, viewport);
      await checkSimilarity(page, base, viewport);
      await context.close();
    }
    assert.deepEqual(evidence.errors, [], 'No browser JavaScript errors');
    evidence.completed = true;
    console.log(`MERZLYAK_LEARNING_PATH_BROWSER_OK: ${evidence.states.length} layout states; 320×900 and 1280×900`);
  } catch (error) {
    evidence.failure = error.stack;
    console.error(error);
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(path.join(output, 'browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
    await browser?.close();
    server.closeAllConnections?.();
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
})();
