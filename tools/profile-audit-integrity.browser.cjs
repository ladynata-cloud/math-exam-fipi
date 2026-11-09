'use strict';

// Public learner acceptance for the audit follow-up. Mathematical expectations
// below are derived independently of the rendered labels and trainer keys.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.env.PROFILE_AUDIT_INTEGRITY_SHOTS || '/tmp/profile-audit-integrity-shots';
const KEY = 'mathexam.profileStart2027.v1';
const COACH_KEY = 'mathexam.profilePracticeCoach.v1';
const WIDTHS = [320, 1280];
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
  let journeys = 0;
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const origin = 'http://127.0.0.1:' + server.address().port;
    const course = origin + '/ege-profil/start/index.html';
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'] });
    fs.mkdirSync(SHOTS, { recursive: true });

    async function learner(width, run, seedNumbers = false) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      try {
        // The number trainer then asks about 1..6 with five operations a+b−1:
        // sum 21 minus 5 gives 16. This is an independent deterministic fixture.
        if (seedNumbers) await context.addInitScript(() => { Math.random = () => 0; });
        const page = await context.newPage();
        page.setDefaultTimeout(12000);
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(origin)) failedRequests.push(response.status() + ' ' + response.url()); });
        await run(page, context);
        journeys++;
      } finally { await context.close(); }
    }
    async function noOverflow(page, label) {
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ': no horizontal overflow');
    }
    const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
    const rows = coach => coach.locator('.coach-scene tbody tr').evaluateAll(nodes => nodes.map(row => [...row.cells].map(cell => cell.textContent.trim())));
    async function range(page, value) {
      await page.locator('#tSlider').evaluate((node, next) => { node.value = String(next); node.dispatchEvent(new Event('input', { bubbles: true })); }, value);
    }
    async function burst(page) {
      return page.locator('#dCheck').evaluate(node => {
        for (let i = 0; i < 8; i++) node.click();
        // Observe in the same event turn, before a legitimate next-item timer.
        return {
          right: document.querySelectorAll('#zDots .ok').length,
          wrong: document.querySelectorAll('#zDots .bad').length,
          locked: node.disabled && document.querySelector('#dAnswer').disabled,
          finished: document.querySelector('#zDone').getClientRects().length > 0,
        };
      });
    }

    for (const width of WIDTHS) {
      await learner(width, async page => {
        await page.goto(origin + '/ege-profil/trainers/parameters-t18.html');
        await page.locator('[data-view="tasks"]').click();
        await page.locator('#taskList button').filter({ hasText: 'Касание прямой и окружности' }).click();
        await range(page, 4.2);
        assert(72 - 4 * 4.2 ** 2 > 0, 'Discriminant is positive at a=4.2');
        assert.match(await page.locator('#tLive').innerText(), /2 решений$/);
        await page.screenshot({ path: path.join(SHOTS, 'circle-two-points-' + width + '.png'), fullPage: true });
        for (const id of ['tExactMinus', 'tExactPlus']) {
          await page.locator('#' + id).focus();
          await page.locator('#' + id).press(id === 'tExactMinus' ? 'Enter' : 'Space');
          assert.match(await page.locator('#tLive').innerText(), /= 3 → касание, 1 решение$/);
          assert.equal(await page.locator('#' + id).getAttribute('aria-pressed'), 'true');
          assert.match(await page.locator('#tSlider').getAttribute('aria-valuetext'), /точное значение/);
        }
        await noOverflow(page, 'Exact tangency/' + width);
        await page.screenshot({ path: path.join(SHOTS, 'circle-exact-tangent-' + width + '.png'), fullPage: true });
        await range(page, 4.3);
        assert(72 - 4 * 4.3 ** 2 < 0, 'Discriminant is negative at a=4.3');
        assert.match(await page.locator('#tLive').innerText(), /0 решений$/);
        assert.equal(await page.locator('#tExactPlus').getAttribute('aria-pressed'), 'false');
        await page.locator('#backToList').click();
        await page.locator('#taskList button').nth(4).click();
        assert.match(await page.locator('#tKeyQ').innerText(), /положительное целое/);
        await range(page, 4);
        assert.match(await page.locator('#tLive').innerText(), /^решений: 1$/);
        await noOverflow(page, 'Cubic outer root/' + width);
        await page.screenshot({ path: path.join(SHOTS, 'cubic-outer-root-' + width + '.png'), fullPage: true });

        await page.locator('[data-view="drill"]').click();
        await page.locator('#zStart').click();
        // Negative solution counts are impossible. Eight rapid sends must be
        // one wrong condition, never eight completed conditions or a pass.
        await page.locator('#dAnswer').fill('-999');
        assert.deepEqual(await burst(page), { right: 0, wrong: 1, locked: true, finished: false });
        await page.locator('#zStart').click();
        const restartedPlot = await page.locator('#dFig').innerHTML();
        await page.waitForTimeout(900); // Cross the old condition's transition deadline.
        assert.match(await page.locator('#dText').innerText(), /^1 из 8\./);
        assert.equal(await page.locator('#zDots .bad').count(), 0);
        assert.equal(await page.locator('#dFig').innerHTML(), restartedPlot, 'Old timer cannot replace restarted condition');
        await page.screenshot({ path: path.join(SHOTS, 'parameters-restarted-test-' + width + '.png'), fullPage: true });
      });

      await learner(width, async page => {
        await page.goto(origin + '/ege-profil/trainers/numbers-t19.html');
        await page.locator('[data-view="drill"]').click();
        await page.locator('#zStart').click();
        assert.match(await page.locator('#dText').innerText(), /1, 2, 3, …, 6/);
        await page.locator('#dAnswer').fill('16');
        assert.deepEqual(await burst(page), { right: 1, wrong: 0, locked: true, finished: false });
        await page.locator('#zStart').click();
        await page.waitForTimeout(1000);
        assert.match(await page.locator('#dText').innerText(), /^1 из 8\./);
        assert.equal(await page.locator('#zDots .ok').count(), 0);
        await noOverflow(page, 'Number test/' + width);
        await page.screenshot({ path: path.join(SHOTS, 'numbers-restarted-test-' + width + '.png'), fullPage: true });
      }, true);

      await learner(width, async page => {
        await page.goto(course + '#practice/fn-hyperbola/guided');
        await page.locator('#answer-form').waitFor();
        await page.locator('#answer').fill('19/7');
        const recordsBefore = (await saved(page)).records;
        const coach = page.locator('.profile-practice-coach');
        assert.equal(await coach.getAttribute('data-coach-kind'), 'hyperbola');
        await coach.locator('summary').click();
        assert.deepEqual(await rows(coach), [['0', '0'], ['1', 'Не определено'], ['2', '4']]);
        assert.equal(await coach.locator('[data-graph-role="vertical-asymptote"]').count(), 1);
        await coach.locator('select[aria-label="Мой прогноз"]').selectOption('1');
        await coach.locator('[data-coach-action="reveal"]').click();
        assert.deepEqual(await rows(coach), [['0', '2'], ['1', 'Не определено'], ['2', '2']]);
        assert.equal(await coach.locator('circle[data-graph-role="excluded-point"]').count(), 1);
        assert.equal(await coach.locator('[data-graph-role="vertical-asymptote"]').count(), 0);
        assert.match(await coach.locator('.coach-first').innerText(), /вся прямая/);
        await coach.locator('[data-coach-answer]').selectOption({ label: '(2; −1)' });
        await coach.locator('[data-coach-transfer]').evaluate(node => node.requestSubmit());
        assert.equal(await coach.locator('[data-coach-transfer] .coach-feedback').getAttribute('data-correct'), 'false');
        await coach.locator('[data-coach-answer]').selectOption({ label: '(−2; −1)' });
        await coach.locator('[data-coach-transfer]').evaluate(node => node.requestSubmit());
        assert.equal(await coach.locator('[data-coach-transfer] .coach-feedback').getAttribute('data-correct'), 'true');
        await page.reload();
        await page.locator('#answer-form').waitFor();
        assert.equal(await page.locator('#answer').inputValue(), '19/7');
        assert.match(await coach.locator('.coach-first').innerText(), /вся прямая/);
        assert.equal(await coach.locator('circle[data-graph-role="excluded-point"]').count(), 1);
        assert.equal(await coach.locator('[data-coach-transfer] .coach-feedback').getAttribute('data-correct'), 'true');
        assert.deepEqual((await saved(page)).records, recordsBefore, 'Exploration grants no mastery');
        await noOverflow(page, 'Zero numerator/' + width);
        await page.screenshot({ path: path.join(SHOTS, 'hyperbola-zero-hole-' + width + '.png'), fullPage: true });
        await page.goto(course + '#practice/fn-hyperbola/independent');
        await page.locator('#answer-form').waitFor();
        assert.equal(await page.locator('.profile-practice-coach').count(), 0);
      });

      await learner(width, async page => {
        await page.goto(course + '#practice/eq-linear/independent');
        await page.locator('#answer-form').waitFor();
        const session = () => saved(page).then(value => value.sessions['eq-linear:independent']);
        assert.equal((await session()).taskId, 'eq-linear-4');
        // 9x+4=5x+12 gives x=2. Keep the learner's wrong raw submission,
        // then accept an equivalent fraction after explicitly requested help.
        await page.locator('#answer').fill('999999');
        await page.locator('#submit-answer').click();
        await page.locator('#feedback.bad').waitFor();
        await page.locator('#submission-history summary').click();
        assert.match(await page.locator('[data-submission-first]').innerText(), /999999/);
        await page.locator('#hint').click();
        await page.locator('#answer').fill('4/2');
        await page.locator('#submit-answer').click();
        await page.locator('#feedback.good').waitFor();
        await page.reload();
        await page.locator('#answer-form').waitFor();
        if (!(await page.locator('#submission-history').evaluate(node => node.open))) await page.locator('#submission-history summary').click();
        assert.match(await page.locator('[data-submission-first]').innerText(), /999999/);
        assert.match(await page.locator('[data-submission-latest]').innerText(), /4\/2/);
        const trace = (await session()).submissions.steps[0];
        assert.equal(trace.first.answer, '999999');
        assert.equal(trace.first.correct, false);
        assert.equal(trace.first.help, 'none');
        assert.equal(trace.last.answer, '4/2');
        assert.equal(trace.last.correct, true);
        assert.equal(trace.last.help, 'support');
        assert.equal((await session()).wrong, true);
        await noOverflow(page, 'First submission retained/' + width);
        await page.screenshot({ path: path.join(SHOTS, 'first-attempt-retained-' + width + '.png'), fullPage: true });
        await page.locator('#next').click();
        await page.locator('.result-panel').waitFor();
        assert.deepEqual((await saved(page)).records['eq-linear'].independent, [], 'Corrected assisted answer is not independent mastery');
      });
    }

    // Board wrappers must not acquire the optional public experiment.
    await learner(320, async (page, context) => {
      await context.addInitScript(key => localStorage.setItem(key, 'board-sentinel'), COACH_KEY);
      await page.goto(origin + '/trainers/ege-profile-probability.html#practice/prob-count/guided');
      await page.locator('#answer-form').waitFor();
      assert.equal(await page.locator('.profile-practice-coach').count(), 0);
      assert.equal(await page.locator('script[src*="practice-coach"]').count(), 0);
      assert.equal(await page.evaluate(key => localStorage.getItem(key), COACH_KEY), 'board-sentinel');
      assert.equal(await page.locator('#submission-history').count(), 0, 'Public submission history does not change the board');
    });
    assert.deepEqual(failedRequests, [], 'All local assets load');
    assert.deepEqual(errors, [], 'No browser errors');
    console.log('PROFILE_AUDIT_INTEGRITY_BROWSER_OK ' + JSON.stringify({ journeys, widths: WIDTHS, screenshots: SHOTS }));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
