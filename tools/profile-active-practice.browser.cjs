'use strict';

// Exercise the public course, its real scripts and browser persistence. These
// authored mathematical fixtures are deliberately independent of coach config.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const KEY = 'mathexam.profileStart2027.v1';
const COACH_KEY = 'mathexam.profilePracticeCoach.v1';
const SHOTS = process.env.PROFILE_ACTIVE_PRACTICE_SHOTS || '/tmp/profile-active-practice-shots';
const WIDTHS = [320, 390, 1280];
const tokenFixture = {
  kind: 'tokens', wrongChoice: '0', rightChoice: '1', first: 'Увеличится',
  before: [['Вначале', '3', '6']], after: [['Осталось', '2', '5']],
  wrongAnswer: '1/2', rightAnswer: '1/3',
};
const FIXTURES = {
  'fn-line': {
    kind: 'line', wrongChoice: '1', rightChoice: '0', first: 'Увеличится на 6',
    before: [['0', '1'], ['1', '3'], ['2', '5']],
    after: [['0', '4'], ['1', '6'], ['2', '8']], wrongAnswer: '1', rightAnswer: '0',
  },
  'calc-sign': {
    kind: 'derivative', wrongChoice: '0', rightChoice: '2', first: 'Максимум',
    before: [], after: [['0', '1'], ['1', '0'], ['2', '1']],
    wrongAnswer: 'Минимум', rightAnswer: 'Максимум',
  },
  'prob-count': tokenFixture,
  'prob-conditional': tokenFixture,
  'prob-distribution': {
    kind: 'expectation', wrongChoice: '0', rightChoice: '1', first: 'На 5',
    before: [['0', '0,5'], ['2', '0,3'], ['5', '0,2']],
    after: [['0', '0,5'], ['2', '0,3'], ['10', '0,2']], wrongAnswer: '1,6', rightAnswer: '0,6',
  },
  'eq-linear': {
    kind: 'equation', wrongChoice: '1', rightChoice: '2', first: 'Только из правой',
    before: [], after: [['5x + 2 − 2x', '2x + 14 − 2x'], ['3x + 2', '14']],
    wrongAnswer: '14', rightAnswer: '12',
  },
  'finance-lesson-01-ledger': {
    kind: 'finance', wrongChoice: '0', rightChoice: '1', first: 'На 10 тыс. руб.',
    before: [['Долг в начале', '100'], ['После первых 10%', '110'], ['Первый платёж', '30'], ['Остаток', '80'], ['Следующие 10%', '8'], ['Долг до второго платежа', '88']],
    after: [['Долг в начале', '100'], ['После первых 10%', '110'], ['Первый платёж', '40'], ['Остаток', '70'], ['Следующие 10%', '7'], ['Долг до второго платежа', '77']],
    wrongAnswer: '60', rightAnswer: '66',
  },
};

const mime = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://fixture').pathname);
    if (pathname === '/favicon.ico') return res.writeHead(204).end();
    let file = path.resolve(ROOT, '.' + pathname);
    if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', (mime[path.extname(file)] || 'text/html') + '; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});

(async () => {
  let browser;
  const errors = [], failedRequests = [];
  let coachJourneys = 0, handoffs = 0;
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const origin = 'http://127.0.0.1:' + server.address().port;
    const base = origin + '/ege-profil/start/index.html';
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'] });
    fs.mkdirSync(SHOTS, { recursive: true });

    async function withLearner(width, run) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(12000);
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        page.on('response', response => {
          if (response.status() >= 400 && response.url().startsWith(origin)) failedRequests.push(response.status() + ' ' + response.url());
        });
        await run(page, context);
      } finally { await context.close(); }
    }
    async function open(page, id, mode) {
      await page.goto(base + '#practice/' + id + '/' + mode);
      await page.locator('#answer-form').waitFor();
    }
    const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
    const session = async (page, id, mode) => (await saved(page)).sessions[id + ':' + mode];
    async function coachRecord(page, id, source) {
      const record = await page.evaluate(({ key, id, taskId, started }) => JSON.parse(localStorage.getItem(key)).records.find(r => r.lessonId === id && r.taskId === taskId && r.started === started), { key: COACH_KEY, id, taskId: source.taskId, started: source.started });
      assert(record, 'Experiment is saved against the actual task attempt');
      assert.equal(record.key, JSON.stringify([id, source.taskId, source.started]));
      return record;
    }
    async function usable(page, scope, label) {
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ': no horizontal overflow');
      const controls = await scope.locator('summary,button,input,select').evaluateAll(nodes => nodes.filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden').map(node => ({
        name: node.textContent.trim() || node.getAttribute('aria-label') || node.tagName,
        font: parseFloat(getComputedStyle(node).fontSize), height: node.getBoundingClientRect().height,
      })));
      assert(controls.length, label + ': visible controls exist');
      for (const control of controls) {
        assert(control.font >= 16, label + ': readable control ' + JSON.stringify(control));
        assert(control.height >= 44, label + ': touch target ' + JSON.stringify(control));
      }
    }
    async function tableRows(coach) {
      return coach.locator('.coach-scene tbody tr').evaluateAll(rows => rows.map(row => [...row.cells].map(cell => cell.textContent.trim())));
    }
    async function transferAnswer(coach, value) {
      const control = coach.locator('[data-coach-answer]');
      if (await control.evaluate(node => node.tagName === 'SELECT')) await control.selectOption(value);
      else await control.fill(value);
    }

    // Every supported lesson and mode reflows, shows a real before/after change,
    // retains the first attempt, and accepts a new mathematical transfer item.
    for (const width of WIDTHS) for (const mode of ['guided', 'plan']) {
      await withLearner(width, async page => {
        for (const [id, fixture] of Object.entries(FIXTURES)) {
          const label = id + '/' + mode + '/' + width;
          await open(page, id, mode);
          await page.locator('#answer').fill('19/7');
          const source = await session(page, id, mode), courseBefore = await saved(page);
          const coach = page.locator('.profile-practice-coach');
          assert.equal(await coach.count(), 1, label + ': one optional experiment');
          assert.equal(await coach.getAttribute('data-coach-kind'), fixture.kind);
          assert.equal(await coach.getAttribute('open'), null, label + ': starts folded');
          await usable(page, coach, label + '/folded');
          await coach.locator('summary').click();
          assert(await coach.locator('[data-coach-action="reveal"]').isDisabled(), label + ': prediction precedes reveal');
          assert.equal(await coach.locator('.coach-scene').getAttribute('data-stage'), 'before');
          assert.deepEqual(await tableRows(coach), fixture.before, label + ': original mathematical values');
          assert.equal(await coach.locator('[data-coach-transfer]').isVisible(), false);
          await coach.locator('select[aria-label="Мой прогноз"]').selectOption(fixture.wrongChoice);
          await coach.locator('[data-coach-action="reveal"]').click();
          assert.equal(await coach.locator('.coach-scene').getAttribute('data-stage'), 'after');
          assert.deepEqual(await tableRows(coach), fixture.after, label + ': changed mathematical values');
          assert.equal(await coach.locator('.coach-body > .coach-feedback').getAttribute('data-correct'), 'false');
          assert((await coach.locator('.coach-first').innerText()).includes(fixture.first), label + ': original forecast is visible');
          if (fixture.kind === 'tokens') {
            assert.equal(await coach.locator('.coach-token.red').count(), 2);
            assert.equal(await coach.locator('.coach-token.blue').count(), 3);
          }
          if (fixture.kind === 'expectation') assert.deepEqual(await coach.locator('.coach-bar-row strong').allTextContents(), ['0', '0,6', '2']);
          await usable(page, coach, label + '/expanded');

          // Correcting a prediction does not rewrite the first prediction.
          await coach.locator('select[aria-label="Мой прогноз"]').selectOption(fixture.rightChoice);
          await transferAnswer(coach, fixture.wrongAnswer);
          await page.reload();
          await page.locator('.profile-practice-coach[open]').waitFor();
          assert.equal(await coach.locator('select[aria-label="Мой прогноз"]').inputValue(), fixture.rightChoice);
          assert.equal(await coach.locator('[data-coach-answer]').inputValue(), fixture.wrongAnswer, label + ': transfer draft survives reload');
          assert.deepEqual(await tableRows(coach), fixture.after);
          assert((await coach.locator('.coach-first').innerText()).includes(fixture.first));
          await coach.locator('[data-coach-transfer] button[type="submit"]').click();
          assert.equal(await coach.locator('[data-coach-transfer] .coach-feedback').getAttribute('data-correct'), 'false', label + ': plausible wrong transfer is rejected');
          await transferAnswer(coach, fixture.rightAnswer);
          await coach.locator('[data-coach-transfer] button[type="submit"]').click();
          assert.equal(await coach.locator('[data-coach-transfer] .coach-feedback').getAttribute('data-correct'), 'true', label + ': independently calculated transfer is accepted');
          await page.reload();
          await page.locator('.profile-practice-coach[open]').waitFor();
          const record = await coachRecord(page, id, source);
          assert.deepEqual({ choice: record.choice, first: record.firstPrediction, revealed: record.revealed, open: record.open, draft: record.transferDraft, transferFirst: record.transferFirst, transferLast: record.transferLast }, {
            choice: Number(fixture.rightChoice), first: Number(fixture.wrongChoice), revealed: true, open: true,
            draft: fixture.rightAnswer, transferFirst: fixture.wrongAnswer, transferLast: fixture.rightAnswer,
          }, label + ': first evidence and latest state survive reload');
          assert.deepEqual(await session(page, id, mode), source, label + ': experiment does not submit or overwrite the main attempt');
          assert.deepEqual((await saved(page)).records, courseBefore.records, label + ': experiment does not grant course credit');
          assert.equal(await page.locator('#answer').inputValue(), '19/7');
          assert.equal(await coach.locator('[data-coach-transfer] .coach-feedback').getAttribute('data-correct'), 'true');
          await usable(page, coach, label + '/restored');
          if (['fn-line', 'finance-lesson-01-ledger'].includes(id)) await page.screenshot({ path: path.join(SHOTS, id + '-' + mode + '-' + width + '.png'), fullPage: true });
          coachJourneys++;
        }
      });
    }

    async function acceptNumber(page, answer) {
      await page.locator('#answer').fill(String(answer));
      await page.locator('#submit-answer').click();
      await page.locator('#feedback.good').waitFor();
      await page.locator('#next').click();
    }
    async function finishFirstLineTask(page) {
      assert.equal((await session(page, 'fn-line', 'guided')).taskId, 'fn-line-1');
      // Points (0,1), (2,5) give k=2, b=1, then y(3)=7.
      for (const answer of [2, 4, 2, 1, 7]) await acceptNumber(page, answer);
      await page.locator('.result-panel').waitFor();
    }

    for (const width of WIDTHS) {
      await withLearner(width, async page => {
        await open(page, 'fn-line', 'guided');
        await finishFirstLineTask(page);
        assert.equal(await page.locator('#independent-check').innerText(), 'Проверить себя на другом условии');
        await usable(page, page.locator('.result-handoff'), 'new handoff/' + width);
        await page.locator('#independent-check').click();
        await page.waitForURL(/#practice\/fn-line\/independent$/);
        await page.locator('#answer-form').waitFor();
        const independent = await session(page, 'fn-line', 'independent');
        assert.equal(independent.taskId, 'fn-line-4', 'Guided completion selects a different, unseen condition');
        assert.equal(independent.assisted, false);
        assert.equal(independent.familiar, false);
        await usable(page, page.locator('.current-question'), 'independent answer/' + width);
        assert.equal(await page.locator('.profile-practice-coach').count(), 0, 'Independent practice has no experiment');
        assert.equal(await page.evaluate(key => localStorage.getItem(key), COACH_KEY), null, 'No experiment storage is created during ordinary practice');

        // The actual independent question is y=3x+1 at x=2. Six omits b.
        await page.locator('#answer').fill('6');
        await page.locator('#submit-answer').click();
        await page.locator('#feedback.bad').waitFor();
        assert.match(await page.locator('#feedback').innerText(), /не потерялось ли свободное слагаемое/);
        assert.equal((await session(page, 'fn-line', 'independent')).answers.length, 0);
        assert.equal(await page.locator('#next').isVisible(), false);
        await acceptNumber(page, 7);
        assert.deepEqual((await saved(page)).records['fn-line'].independent, [], 'Correction after an error is practice, not a first-try success');
        await page.locator('#independent-check').click();
        await page.locator('#answer-form').waitFor();
        assert.equal((await session(page, 'fn-line', 'independent')).taskId, 'fn-line-5');
        handoffs++;
      });

      // A different unfinished task must win over creating another task. It is
      // entered through the UI, including the help flag when guided work opens.
      await withLearner(width, async page => {
        await open(page, 'fn-line', 'independent');
        await page.locator('#answer').fill('3/5');
        await open(page, 'fn-line', 'guided');
        const draftBefore = await session(page, 'fn-line', 'independent');
        await finishFirstLineTask(page);
        assert.equal(await page.locator('#independent-check').innerText(), 'Продолжить начатую задачу');
        await page.locator('#independent-check').click();
        await page.locator('#answer-form').waitFor();
        assert.equal(await page.locator('#answer').inputValue(), '3/5');
        assert.deepEqual(await session(page, 'fn-line', 'independent'), draftBefore, 'Handoff preserves the existing attempt, assistance flag and draft');
        await usable(page, page.locator('.current-question'), 'resumed answer/' + width);
        await page.reload();
        await page.locator('#answer-form').waitFor();
        assert.equal(await page.locator('#answer').inputValue(), '3/5');
        assert.equal(await page.locator('.profile-practice-coach').count(), 0);
        handoffs++;
      });

      await withLearner(width, async page => {
        await open(page, 'geo-right', 'guided');
        assert.equal(await page.locator('.profile-practice-coach').count(), 0, 'Unsupported geometry lesson keeps its normal workflow');
        assert.equal(await page.evaluate(key => localStorage.getItem(key), COACH_KEY), null);
        await usable(page, page.locator('.current-question'), 'ordinary geometry answer/' + width);
        await acceptNumber(page, 225);
        await acceptNumber(page, 15);
        await page.locator('.result-panel').waitFor();
      });
    }

    // The real board wrapper remains outside personal coaching. Existing board
    // protocol gates separately cover live teacher/student synchronization.
    await withLearner(390, async (page, context) => {
      await context.addInitScript(({ key }) => localStorage.setItem(key, 'board-sentinel'), { key: COACH_KEY });
      await page.goto(origin + '/trainers/ege-profile-probability.html#practice/prob-count/guided');
      await page.locator('#answer-form').waitFor();
      assert.equal(await page.locator('body').getAttribute('data-profile-board'), 'probability');
      assert.equal(await page.locator('.profile-practice-coach').count(), 0);
      assert.equal(await page.locator('script[src*="practice-coach"]').count(), 0);
      await acceptNumber(page, 10);
      assert.equal(await page.evaluate(key => localStorage.getItem(key), COACH_KEY), 'board-sentinel');
    });

    assert.deepEqual(failedRequests, [], 'All local scripts and styles load');
    assert.deepEqual(errors, [], 'No browser or page errors');
    console.log(JSON.stringify({ gate: 'PROFILE_ACTIVE_PRACTICE_BROWSER_OK', coachJourneys, supportedLessons: Object.keys(FIXTURES).length, experimentKinds: 6, responsive: WIDTHS, handoffs, independentFeedback: true, boardExcluded: true, screenshots: SHOTS }));
  } finally {
    // Also close the listener when Chromium cannot launch in a restricted host.
    if (browser) await browser.close();
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
