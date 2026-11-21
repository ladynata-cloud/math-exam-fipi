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
  const errors = [];
  async function freshPage() {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(url);
    return page;
  }
  let page = await freshPage();
  const cases = await page.evaluate(() => window.MakarychevCourse.lessons
    .filter(lesson => lesson.order >= 5 && lesson.order <= 8)
    .flatMap(lesson => lesson.studyOrder
      .filter(index => lesson.tasks[index].source.type === 'textbook')
      .map(index => ({ lessonId: lesson.id, index }))));
  const stats = { cards: cases.length, figures: 0, errors: [] };
  // A separate browser turn for each card lets Chromium release the preceding
  // diagram and DOM, as it does when a pupil navigates between exercises.
  for (const [position, entry] of cases.entries()) {
    // Independent inventory samples share neither a student nor saved work.
    if (position && position % 24 === 0) {
      await page.close();
      page = await freshPage();
    }
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
    }, entry).catch(error => {
      throw new Error('Could not render ' + entry.lessonId + ' card ' + entry.index + ' at ' + width + 'px', { cause: error });
    });
    stats.figures += sample.figures;
    stats.errors.push(...sample.errors);
  }
  assert.deepEqual(stats.errors, []);
  assert.equal(stats.cards, 286);
  for (let n = 110; n <= 220; n++) {
    if ((n - 110) % 24 === 0) {
      await page.close();
      page = await freshPage();
    }
    await openNumber(page, n);
    assert(await page.locator('#number-result a.button:not(.quiet)').count() > 0, 'source number ' + n);
  }
  await openNumber(page, 215, '№ 215в');
  assert.match(await page.locator('main > .eyebrow').innerText(), /Дополнительно к §1 · с. 56/i);
  assert.equal(await page.locator('.exclusion-model li').count(), 0);
  await submit(page, '1/(x-3)');
  assert.match(await page.locator('.exclusion-model').innerText(), /x = -3: знаменатель отличен от нуля/);
  assert.match(await page.locator('#problem').innerText(), /Подставь x = -3/);
  await submit(page, '1/((x^2-9)*(x^2-2))');
  assert.match(await page.locator('#problem').innerText(), /дополнительные действительные нули/);
  await page.reload();
  assert.match(await page.locator('.exclusion-model').innerText(), /нулей у твоего знаменателя: 4/);
  await submit(page, '(x+1)/((x^2-9)^2*(x^2+1))');
  const domainState = await page.evaluate(() => MakarychevApp.getState().tasks['ch1-extra-215-c']);
  assert.equal(domainState.correct, true);
  assert.equal(domainState.assisted, false);
  assert.equal(domainState.independent, false);
  await openNumber(page, 220, '№ 220в');
  assert.match(await page.locator('main > .eyebrow').innerText(), /Дополнительно к §1 · с. 57/i);
  await submit(page, 'z/(z^2-xy)');
  await submit(page, '-z/(z^2-xy)');
  assert.equal(await page.evaluate(() => MakarychevApp.getState().tasks['ch1-extra-220-c'].correct), true);
  await openNumber(page, 213, '№ 213, скорости');
  assert.equal(await page.locator('.train-model svg').count(), 2);
  assert.equal(await page.locator('.train-model circle').count(), 0);
  await submit(page, '45;40');
  assert.match(await page.locator('.train-model figcaption').last().innerText(), /Вместе 480 км/);
  assert.match(await page.locator('#problem').innerText(), /Проверь случай t = 6/);
  await page.reload();
  assert.equal(await page.locator('#final-answer').inputValue(), '45;40');
  await submit(page, '45;80');
  assert.match(await page.locator('.train-model figcaption').last().innerText(), /Вместе 600 км/);
  const solvedTrain = await page.evaluate(() => MakarychevApp.getState().tasks['ch1-extra-213-speeds']);
  assert.equal(solvedTrain.correct, true);
  assert.equal(solvedTrain.assisted, false);
  assert.equal(solvedTrain.independent, false);
  await openNumber(page, 214, '№ 214д');
  await submit(page, '3');
  assert.match(await page.locator('#problem').innerText(), /Это значение действительно нужно исключить/);
  await submit(page, '±3');
  assert.equal(await page.evaluate(() => MakarychevApp.getState().tasks['ch1-extra-214-e'].correct), true);
  await openNumber(page, 206, '№ 206а');
  const pairRows = page.locator('#task-graph li');
  const pairState = () => page.evaluate(() => MakarychevApp.getState().tasks['p09-source-206-a']);
  assert.equal((await pairState()).correct, false);
  await page.locator('#final-answer').fill('(-2;4)');
  assert.equal(await pairRows.count(), 0);
  await submit(page, '(-2;4)');
  assert.match(await page.locator('#problem').innerText(), /Все указанные пары подходят/);
  assert.match(await pairRows.first().innerText(), /Слева 2, справа 2/);
  await submit(page, '(-2;4),(-2;4)');
  assert.match(await page.locator('#problem').innerText(), /пара указана дважды/);
  await submit(page, '(1;2)');
  assert.match(await pairRows.first().innerText(), /Слева 5, справа 2/);
  await page.reload();
  assert.equal(await page.locator('#final-answer').inputValue(), '(1;2)');
  assert.match(await pairRows.first().innerText(), /значения различаются/);
  await submit(page, '(4;6), (2;8), (0;2), (−2;4)');
  assert.equal((await pairState()).correct, true);
  assert.equal((await pairState()).assisted, false);
  assert.equal((await pairState()).independent, false);
  assert.equal(await pairRows.count(), 4);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
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
  await submit(page, '1,27');
  assert.match(await page.locator('#problem').innerText(), /Одна абсцисса подходит/);
  await submit(page, '4,73;1,27');
  assert.equal(await page.evaluate(() => MakarychevApp.getState().tasks['p08-source-189-б'].correct), true);
  assert.equal(await page.evaluate(() => MakarychevApp.getState().tasks['p08-source-189-б'].assisted), false);
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
  return { width, cards: stats.cards, figures: stats.figures, searches: 111 };
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
