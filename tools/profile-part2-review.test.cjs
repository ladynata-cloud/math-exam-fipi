'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const { collectErrors } = require('../ege-profil/review-part-two.js');
const state = require('../ege-profil/part-two/state.js');
const map = require('../ege-profil/exam-map.js');
const lessons = ['algebra', 'geometry', 'models'].flatMap(name =>
  require('../ege-profil/part-two/content-' + name + '.js'));
const catalog = lessons.map(lesson => ({ lesson, label: map.label(map.fromLegacyPartTwo(lesson.exam)) }));
const projection = lessons.find(lesson => lesson.id === 'p2-15-projection');
const guided = projection.tasks[0];
const firstFinal = projection.tasks[1];
const independent = projection.tasks[3];
const model = lessons.find(lesson => lesson.id === 'model-fence').tasks[3];
const legacyKey = 'mathExamCourseProgress.v1';
const startKey = 'mathexam.profileStart2027.v1';

function records() {
  const saved = new Map();
  const storage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
  const writer = state.create(storage);
  let date = 1795000000000;
  async function attempt(task, kind, correct, answers = ['99']) {
    await writer.attempt(task.id, { kind, answers, correct, mode: 'guided' });
    const record = writer.read(task.id);
    record.attempts.at(-1).at = ++date;
    storage.setItem(writer.key(task.id), JSON.stringify(record));
  }
  function readOnly() {
    const writes = [];
    const rows = collectErrors({ getItem: storage.getItem, setItem: key => writes.push(key) }, catalog, state);
    assert.deepEqual(writes, []);
    return rows;
  }
  return { saved, storage, writer, attempt, readOnly };
}

test('Part Two journal classifies each trusted condition, clears assessed stages and can reopen', async () => {
  const { attempt, readOnly } = records();
  await attempt(guided, 'step-0', false);
  await attempt(guided, 'step-1', false);
  await attempt(guided, 'step-1', true);
  await attempt(independent, 'final', false);
  let rows = readOnly();
  assert.deepEqual(rows.map(row => [row.label, row.index, row.stage, row.mistakes, row.corrected, row.href]), [
    ['№ 14', 4, 'Итоговый ответ', 1, false, 'part-two/#task/' + independent.id + '/independent'],
    ['№ 14', 1, 'Шаг 1', 2, false, 'part-two/#task/' + guided.id + '/guided'],
  ]);
  await attempt(guided, 'final', true);
  await attempt(independent, 'final', true);
  assert(readOnly().every(row => row.corrected));
  await attempt(independent, 'final', false);
  await attempt(model, 'final', false, model.final.map(() => '99'));
  rows = readOnly();
  assert.equal(rows[0].label, 'Дополнительная тема');
  assert.equal(rows[1].corrected, false);
  assert.equal(rows[1].mistakes, 2);
  assert.equal(rows[2].corrected, true);
  await attempt(firstFinal, 'final', false);
  assert.equal(readOnly()[0].href, 'part-two/#task/' + firstFinal.id + '/independent',
    'the final form is available even on an early guided condition without independent credit');
});

test('Part Two journal isolates malformed records and skips proof, incomplete or unknown attempts', async () => {
  const { attempt, readOnly, saved, storage, writer } = records();
  await attempt(guided, 'step-0', false);
  await attempt(guided, 'proof', false);
  await attempt(guided, 'step-0', true, [' ']);
  await attempt(guided, 'step-500', false);
  await attempt(guided, 'final', false, []);
  await attempt(independent, 'final', false);
  await attempt({ id: 'unpublished-example' }, 'final', false);
  storage.setItem(writer.key(independent.id), '{bad');
  storage.setItem(writer.key(projection.tasks[1].id), storage.getItem(writer.key(guided.id)));
  storage.setItem(legacyKey, '{"student":"older result"}');
  storage.setItem('mathexam.unrelated-probe', 'legacy');
  const before = [...saved];
  const rows = readOnly();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].mistakes, 1);
  assert.equal(rows[0].stage, 'Шаг 1');
  assert.equal(rows[0].corrected, false);
  assert.deepEqual([...saved], before);
});

const browserEnabled = Boolean(process.env.CI || process.env.H02_NATIVE_BROWSER);

test('Chromium: course submission, journal return, correction and preserved storage at 320, 390 and 1280 px',
  { skip: !browserEnabled, timeout: 90000 }, async () => {
    const { chromium } = require('playwright');
    const root = path.resolve(__dirname, '..');
    const server = http.createServer((req, res) => {
      try {
        let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
        if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
        if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        const mime = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
        res.setHeader('Content-Type', mime[path.extname(file)] || 'text/html');
        res.end(fs.readFileSync(file));
      } catch (_) {
        res.writeHead(404).end();
      }
    });
    const shots = '/tmp/profile-part2-shots/part-two-review';
    fs.mkdirSync(shots, { recursive: true });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port + '/ege-profil/';
    const taskPath = 'part-two/#task/' + independent.id + '/independent';
    const taskKey = state.PREFIX + independent.id;
    let browser;
    try {
      browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] });
      for (const width of [320, 390, 1280]) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        const journal = await context.newPage();
        const errors = [];
        const catalogRequests = [];
        journal.on('pageerror', error => errors.push(error.message));
        journal.on('request', request => {
          if (request.url().includes('/part-two/content-')) catalogRequests.push(request.url());
        });
        const section = journal.locator('#partTwoMistakes');
        const snapshot = page => page.evaluate(() => Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]));
        const stable = async (expected, label) => {
          assert.deepEqual(await snapshot(journal), expected, label + ' at viewport ' + width);
          assert(await journal.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'journal overflows at ' + width);
          assert.deepEqual(errors, []);
        };
        await journal.goto(base + 'review.html');
        await section.getByText(/ещё нет сохранённых ошибок второй части/).waitFor();
        assert.deepEqual(catalogRequests, []);
        assert.equal(await journal.locator('#summaryCard h2').textContent(), 'Журнал пока пуст');
        await stable([], 'empty view preserves storage');

        const learner = await context.newPage();
        learner.on('pageerror', error => errors.push(error.message));
        await learner.goto(base + taskPath);
        await learner.evaluate(([legacyKey, startKey, invalidKey]) => {
          localStorage.setItem(legacyKey, JSON.stringify({ 'full-exam': { attempts: [
            { ts: 1795000000000, primary: 12, test: 54, lines: { 1: 1 } },
          ] } }));
          localStorage.setItem(startKey, '{"version":1,"records":{},"seen":{},"sessions":{}}');
          localStorage.setItem(invalidKey, '{unreadable');
        }, [legacyKey, startKey, state.PREFIX + guided.id]);
        await learner.locator('#final-0').fill('99');
        await learner.locator('#final-form button[type=submit]').click();
        await learner.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}').wrong === 1, taskKey);
        const wrong = await snapshot(learner);
        const remaining = section.locator('details', { hasText: 'К повтору' });
        await remaining.getByText('Итоговый ответ', { exact: false }).waitFor();
        assert.equal(await section.locator('.row').count(), 1);
        assert.match(await remaining.innerText(), /№ 14/);
        assert.equal(await journal.locator('#summaryCard h2').textContent(), 'В прежних подборках ошибок пока нет');
        assert.equal(new Set(catalogRequests).size, 3);
        await journal.reload();
        await remaining.getByText('Итоговый ответ', { exact: false }).waitFor();
        const link = remaining.getByRole('link', { name: /Вернуться к условию 4/ });
        assert.equal(await link.getAttribute('href'), taskPath);
        assert.match(await journal.locator('#examMeta').innerText(), /12 перв\. · 54 тест\./);
        await stable(wrong, 'unresolved visit preserves all records');
        await section.screenshot({ path: path.join(shots, 'retry-' + width + '.png') });

        await link.click();
        await journal.locator('#final-0').waitFor();
        assert.equal(new URL(journal.url()).hash, '#task/' + independent.id + '/independent');
        assert.equal(await journal.locator('#final-0').inputValue(), '99');
        await journal.locator('#final-0').fill(String(independent.final[0].answers[0]));
        await journal.locator('#final-form button[type=submit]').click();
        await journal.locator('#completion').waitFor();
        const solved = await snapshot(journal);
        await journal.goBack();
        const corrected = section.locator('details', { hasText: 'Исправлено' });
        await corrected.waitFor();
        assert.equal(await corrected.getAttribute('open'), null);
        assert.equal(await remaining.count(), 0);
        await corrected.locator('summary').click();
        assert.equal(await corrected.getByRole('link').getAttribute('href'), taskPath);
        await stable(solved, 'corrected visit preserves all records');
        await section.screenshot({ path: path.join(shots, 'corrected-' + width + '.png') });

        if (width === 390) {
          const stepTask = projection.tasks[2];
          const stepPath = 'part-two/#task/' + stepTask.id + '/guided';
          await learner.goto(base + stepPath);
          await learner.locator('#step-answer').fill('99');
          await learner.locator('#step-form button[type=submit]').click();
          await remaining.getByText('Шаг 1', { exact: false }).waitFor();
          const stepLink = remaining.getByRole('link', { name: /Вернуться к условию 3/ });
          assert.equal(await stepLink.getAttribute('href'), stepPath);
          await stepLink.click();
          assert.equal(await journal.locator('#step-answer').inputValue(), '99');
          await journal.locator('#step-answer').fill(String(stepTask.steps[0].answers[0]));
          await journal.locator('#step-form button[type=submit]').click();
          await journal.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '{}').solvedSteps.length === 1,
            state.PREFIX + stepTask.id);
          await journal.goBack();
          await corrected.waitFor();
          await corrected.locator('summary').click();
          assert.equal(await corrected.getByRole('link', { name: /Вернуться к условию 3/ }).getAttribute('href'), stepPath);

          const firstFinalPath = 'part-two/#task/' + firstFinal.id + '/independent';
          await learner.goto(base + firstFinalPath);
          await learner.locator('#final-0').fill('99');
          await learner.locator('#final-form button[type=submit]').click();
          const firstFinalLink = remaining.getByRole('link', { name: /Вернуться к условию 2/ });
          await firstFinalLink.waitFor();
          assert.equal(await firstFinalLink.getAttribute('href'), firstFinalPath);
          await firstFinalLink.click();
          assert.equal(await journal.locator('#final-0').inputValue(), '99');
          assert.match(await journal.locator('#main').innerText(), /повтор не считается новой самостоятельной проверкой/);
        }
        await context.close();
      }
    } finally {
      await browser?.close();
      await new Promise(resolve => server.close(resolve));
    }
  });
