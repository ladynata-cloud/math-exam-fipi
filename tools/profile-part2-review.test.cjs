'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const test = require('node:test');
const { collectErrors } = require('../ege-profil/review-part-two.js');
const { latestAttempt } = require('../ege-profil/review-probe-2027.js');
const state = require('../ege-profil/part-two/state.js');
const map = require('../ege-profil/exam-map.js');
const lessons = ['algebra', 'geometry', 'models'].flatMap(name =>
  require('../ege-profil/part-two/content-' + name + '.js'));
const financeLessons = require('../ege-profil/part-two/content-finance.js');
const catalog = lessons.map(lesson => ({ lesson, label: map.label(map.fromLegacyPartTwo(lesson.exam)) }))
  .concat(financeLessons.map(lesson => ({ lesson, label: map.label(16) })));
const projection = lessons.find(lesson => lesson.id === 'p2-15-projection');
const guided = projection.tasks[0];
const firstFinal = projection.tasks[1];
const independent = projection.tasks[3];
const model = lessons.find(lesson => lesson.id === 'model-fence').tasks[3];
const finance = financeLessons[0].tasks[4];
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

test('the written finance bank and older inequalities have different official numbers', async () => {
  const { attempt, readOnly } = records();
  const inequality = lessons.find(lesson => lesson.exam === 16).tasks[0];
  await attempt(inequality, 'step-0', false);
  await attempt(finance, 'final', false);
  const rows = readOnly();
  assert.deepEqual(rows.map(row => row.label), ['№ 16', '№ 15']);
  assert.equal(rows[0].href, 'part-two/#task/' + finance.id + '/independent');
});

const browserEnabled = Boolean(process.env.CI || process.env.H02_NATIVE_BROWSER);

test('2027 probe history recognises a completed score and keeps unverified writing separate', () => {
  const lines = Object.fromEntries(map.entries.map(entry => [entry.number, entry.part === 1 ? 1 : 0]));
  lines[2] = 0;
  lines[13] = 1;
  lines[18] = 4;
  const valid = { ts: 1795000000000, seed: 7, spent: 900, primary: 16, test: null, lines };
  const oldEdition = { ...valid, ts: valid.ts + 1, test: 72 };
  const incomplete = { ...valid, ts: valid.ts + 2, primary: 0, lines: {} };
  const outOfRange = { ...valid, ts: valid.ts + 3, lines: { ...lines, 18: 8 } };
  const inconsistent = { ...valid, ts: valid.ts + 4, primary: 17 };
  const invalidDate = { ...valid, ts: 8.64e15 + 1 };
  const saved = [valid, oldEdition, incomplete, outOfRange, inconsistent, invalidDate];
  const before = JSON.stringify(saved);
  const journal = latestAttempt(saved, map.entries);
  assert.equal(journal.date, valid.ts);
  assert.equal(journal.shortPoints, 11);
  assert.deepEqual(journal.losses.map(result => result.entry.number), [2]);
  assert.deepEqual(journal.written.filter(result => result.points > 0).map(result => [result.entry.number, result.points]), [[13, 1], [18, 4]]);
  assert.deepEqual(journal.written.filter(result => result.points === 0).map(result => result.entry.number), [14, 15, 16, 17, 19]);
  assert.equal(latestAttempt(saved.slice(1), map.entries), null);
  assert.equal(JSON.stringify(saved), before);
});

test('Chromium: course and 2027 probe journal, correction and preserved storage at 320, 390 and 1280 px',
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
        assert.equal(new Set(catalogRequests).size, 4);
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

        await journal.goto(base + 'review.html');
        const probe = journal.locator('#probe2027');
        await probe.getByText(/Разбор появится после завершения пробника/).waitFor();
        assert.equal(await probe.getByRole('link', { name: /Открыть пробник 2027/ }).getAttribute('href'),
          'exam/full-exam.html?edition=2027');
        await learner.goto(base + 'exam/full-exam.html?edition=2027');
        await learner.locator('#startBtn').click();
        const keys = await learner.evaluate(() => ProfilePractice2027.slice(0, 12).map(task => task.t.answer));
        for (let i = 0; i < keys.length; i++) {
          await learner.locator('#task-' + (i + 1) + ' input').fill(String(i === 1 ? 99 : keys[i]));
        }
        await learner.locator('#finishBtn2').click();
        await learner.locator('.chips[data-line="13"] button').nth(1).click();
        await learner.locator('.chips[data-line="14"] button').first().click();
        const shortLink = probe.getByRole('link', { name: /Отработать задание № 2 · Векторы/ });
        const actual = await snapshot(learner);
        await probe.getByText(/Краткие ответы: 11 из 12/).waitFor();
        await probe.getByText('Письменные задания · к проверке 6 · самооценка 1').waitFor();
        assert.equal(await probe.locator('#probe2027Result > div .row').count(), 1);
        assert.equal(await shortLink.getAttribute('href'), map.href(2));
        const written = probe.locator('details');
        await written.locator('summary').click();
        const writing13 = written.locator('.row').filter({ hasText: '№ 13' });
        assert.match(await writing13.innerText(), /Самооценка · 1 из 2/);
        assert.equal(await writing13.getByRole('link').getAttribute('href'), map.href(13));
        for (const number of [14, 15, 16, 17, 18, 19]) {
          const line = written.locator('.row').filter({ hasText: '№ ' + number });
          assert.match(await line.innerText(), /К проверке/);
          assert.equal(await line.getByRole('link').getAttribute('href'), '/ege-profil/part-two/' + map.hash(number));
        }
        assert.match(await journal.locator('#examMeta').innerText(), /12 перв\. · 54 тест\./);
        await stable(actual, 'timed probe read preserves both editions and course');
        await probe.screenshot({ path: path.join(shots, 'probe-2027-' + width + '.png') });
        await journal.reload();
        await probe.getByText('Письменные задания · к проверке 6 · самооценка 1').waitFor();
        await stable(actual, 'timed probe reload preserves both editions and course');

        const financePath = 'part-two/#task/' + finance.id + '/independent';
        await learner.goto(base + financePath);
        await learner.locator('#final-0').fill('99');
        await learner.locator('#final-form button[type=submit]').click();
        const financeLink = remaining.locator('a[href="' + financePath + '"]');
        await financeLink.waitFor();
        assert.match(await financeLink.locator('..').innerText(), /№ 16/);
        await stable(await snapshot(learner), 'finance journal preserves saved work');
        await financeLink.click();
        assert.equal(await journal.locator('#final-0').inputValue(), '99');
        await journal.locator('#final-0').fill(String(finance.final[0].answers[0]));
        await journal.locator('#final-form button[type=submit]').click();
        await journal.locator('#completion').waitFor();
        const financeSolved = await snapshot(journal);
        await journal.goBack();
        await corrected.locator('a[href="' + financePath + '"]').waitFor({ state: 'attached' });
        assert.equal(await financeLink.count(), 0);
        await stable(financeSolved, 'finance correction preserves probe and original conditions');
        await context.close();
      }
    } finally {
      await browser?.close();
      await new Promise(resolve => server.close(resolve));
    }
  });
