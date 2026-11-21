'use strict';
// Run the numbered exercises after 109 on mobile and desktop, using the actual course entry point.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://local.test');
  if (url.pathname === '/favicon.ico') return res.writeHead(204).end();
  let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
  res.setHeader('content-type', types[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
let browser;

async function openNumber(page, n, ref) {
  await page.evaluate(() => {
    history.replaceState(null, '', '#home');
    window.MakarychevApp.route();
  });
  await page.locator('#exercise-number').fill(String(n));
  await page.locator('#number-form button').click();
  if (ref) {
    await page.getByRole('link', { name: ref, exact: true }).click();
    await page.waitForFunction(label => document.querySelector('.task-heading h2')?.textContent === label, ref);
  }
}

async function submit(page, value) {
  await page.locator('#final-answer').fill(value);
  await page.locator('#answer-form button[type=submit]').click();
}

async function verify(width, url) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(url);
  const cases = await page.evaluate(() => window.MakarychevCourse.lessons
    .filter(lesson => lesson.order >= 5 && lesson.order <= 8)
    .flatMap(lesson => lesson.studyOrder
      .filter(index => lesson.tasks[index].source.type === 'textbook')
      .map(index => ({ lessonId: lesson.id, index }))));
  const stats = { cards: cases.length, figures: 0, errors: [] };
  // A separate browser turn for each card lets Chromium release the preceding
  // diagram and DOM, as it does when a pupil navigates between exercises.
  for (const entry of cases) {
    const sample = await page.evaluate(({lessonId, index}) => {
      const lesson = window.MakarychevCourse.lessons.find(item => item.id === lessonId);
      const task = lesson.tasks[index];
      history.replaceState(null, '', '#lesson/' + lessonId + '/' + index);
      window.MakarychevApp.route();
      const rect = document.querySelector('.prompt')?.getBoundingClientRect();
      const errors = [];
      if (document.querySelector('.task-heading h2')?.textContent !== task.title || !rect) errors.push(task.id + ' entry');
      if (document.documentElement.scrollWidth > innerWidth + 1 || rect?.left < 0 || rect?.right > innerWidth + 1) errors.push(task.id + ' overflow');
      const figures = task.graph ? document.querySelectorAll('#task-graph svg').length : 0;
      if (task.graph && !figures) errors.push(task.id + ' missing graph');
      return { figures, errors };
    }, entry);
    stats.figures += sample.figures;
    stats.errors.push(...sample.errors);
  }
  assert.deepEqual(stats.errors, []);
  assert.equal(stats.cards, 286);
  for (let n = 110; n <= 200; n++) {
    await openNumber(page, n);
    assert(await page.locator('#number-result a.button:not(.quiet)').count() > 0, 'source number ' + n);
  }
  await openNumber(page, 178, '№ 178в');
  assert.equal(await page.locator('#task-graph [data-root-curve]').count(), 0);
  await submit(page, '2;-3');
  assert.equal(await page.evaluate(() => MakarychevApp.getState().tasks['p07-source-178-в'].correct), false);
  await submit(page, '-2/3;-5');
  assert.equal(await page.evaluate(() => MakarychevApp.getState().tasks['p07-source-178-в'].correct), true);
  await openNumber(page, 197, '№ 197б');
  assert.equal(await page.locator('#task-graph svg').count(), 4);
  await page.getByRole('button', { name: 'Увеличить график 3', exact: true }).click();
  await page.locator('dialog[open] svg').waitFor();
  await page.getByRole('button', { name: 'Вернуться к выбору' }).click();
  await openNumber(page, 189, '№ 189б');
  await submit(page, '4,73;1,27');
  assert.equal(await page.evaluate(() => MakarychevApp.getState().tasks['p08-source-189-б'].correct), true);
  await openNumber(page, 188, '№ 188а');
  assert.equal(await page.locator('#task-graph [data-root-curve]').count(), 0);
  await submit(page, '-1;-2;2;1');
  await page.locator('#task-graph [data-root-curve="hyperbola"]').waitFor();
  const note = page.locator('#notebook');
  await note.locator('xpath=ancestor::details[1]/summary').click();
  await note.fill('Проверка своих точек');
  await page.reload();
  assert.equal(await page.locator('#notebook').inputValue(), 'Проверка своих точек');
  assert.deepEqual(errors, []);
  await page.close();
  return { width, cards: stats.cards, figures: stats.figures, searches: 91 };
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/school/makarychev8/';
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  const views = [];
  for (const width of [320, 390, 1024]) views.push(await verify(width, url));
  console.log(JSON.stringify({ status: 'PASS', views }));
})().catch(err => { console.error(err); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  server.close();
});
