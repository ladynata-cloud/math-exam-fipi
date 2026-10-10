'use strict';

// Synthetic localhost learners check disclosure and progress semantics. They
// intentionally use the bank's answers to exercise the UI, not to assess pupils.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const KEY = 'mathexam.profileStart2027.v1';
const CHECKPOINT_KEY = 'mathexam.profileCheckpoint.v1';
const lessons = ['geometry', 'stereo', 'algebra', 'probability', 'equations', 'functions', 'applied', 'readiness']
  .flatMap(name => require('../ege-profil/start/' + name + '-data.js'));
const cases = Array.from({ length: 13 }, (_, i) => {
  const lesson = lessons.find(lesson => lesson.position === i + 1);
  return { lesson, task: lesson.tasks[3], mode: 'independent' };
});
const similar = lessons.find(lesson => lesson.id === 'geo-similarity');
cases.push(...similar.tasks.map((task, index) => ({ lesson: similar, task, mode: index < 3 ? 'guided' : 'independent' })));
cases.push({ lesson: similar, task: similar.tasks[3], mode: 'plan' });
const bridge = lessons.find(lesson => lesson.id === 'bridge-equations');
cases.push({ lesson: bridge, task: bridge.tasks[3], mode: 'independent' });

const server = http.createServer((req, res) => {
  try {
    let file = path.resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://fixture').pathname));
    if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' }[path.extname(file)] || 'text/html');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});
const saved = (page, key = KEY) => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const session = async (page, item) => (await saved(page)).sessions[item.lesson.id + ':' + item.mode];
const retained = value => ({ taskId: value.taskId, step: value.step, draft: value.draft, answers: value.answers, started: value.started });
async function noOverflow(page, label) {
  const size = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
  assert(size.content <= size.viewport + 1, label + ': viewport overflow ' + JSON.stringify(size));
}
async function fill(page, value) {
  if (await page.locator('#answer').count()) await page.locator('#answer').fill(String(value));
  else {
    const radios = page.locator('#answer-form input[type="radio"]');
    const values = await radios.evaluateAll(nodes => nodes.map(node => node.value));
    assert(values.includes(String(value)), 'The requested answer must be an actual choice');
    await radios.nth(values.indexOf(String(value))).check();
  }
}
async function accept(page, value) {
  await fill(page, value); await page.locator('#submit-answer').click();
  await page.locator('#feedback.good').waitFor(); await page.locator('#next').click();
}
async function validateCross(row) {
  assert.equal(await row.getAttribute('role'), 'math');
  assert.match(await row.getAttribute('aria-label'), /рав/iu);
  const figures = await row.evaluate(node => {
    const fractions = [...node.querySelectorAll('.profile-solution-fraction')];
    return {
      pairs: fractions.map(fraction => ['.profile-solution-numerator', '.profile-solution-denominator'].map(selector => fraction.querySelector(selector).textContent)),
      colors: fractions.flatMap(fraction => ['.profile-solution-numerator', '.profile-solution-denominator'].map(selector => getComputedStyle(fraction.querySelector(selector)).color)),
      stacked: fractions.every(fraction => {
        const numerator = fraction.querySelector('.profile-solution-numerator').getBoundingClientRect();
        const denominator = fraction.querySelector('.profile-solution-denominator');
        return numerator.bottom <= denominator.getBoundingClientRect().top + 1 && parseFloat(getComputedStyle(denominator).borderTopWidth) >= 1;
      }),
      lines: [...node.querySelectorAll('svg line')].map(line => ({ color: getComputedStyle(line).stroke,
        direction: (line.x2.baseVal.value - line.x1.baseVal.value) * (line.y2.baseVal.value - line.y1.baseVal.value) }))
    };
  });
  assert.deepEqual(figures.pairs[0], ['4', '25']); assert.equal(figures.pairs[1][0], '12');
  assert(figures.stacked, 'Both sides use real fraction bars');
  assert.deepEqual(figures.colors, ['rgb(180, 35, 24)', 'rgb(95, 99, 104)', 'rgb(95, 99, 104)', 'rgb(180, 35, 24)']);
  assert.equal(figures.lines.length, 2); assert(figures.lines[0].direction * figures.lines[1].direction < 0);
  assert.deepEqual(figures.lines.map(line => line.color).sort(), ['rgb(180, 35, 24)', 'rgb(95, 99, 104)'].sort());
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port, base = origin + '/ege-profil/start/index.html';
  const errors = [], failedRequests = [], shots = process.env.PROFILE_STEP_SHOTS;
  let browser, journeys = 0;
  try {
    if (shots) fs.mkdirSync(shots, { recursive: true });
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'] });
    for (const width of [1280, 360]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage(); page.setDefaultTimeout(12000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(origin)) failedRequests.push(response.status() + ' ' + response.url()); });
      await page.goto(base); await page.locator('[data-calm-exam="13"]').waitFor();
      assert.equal(await page.locator('[data-calm-exam]').count(), 13, 'Exam catalogue remains the entry point');
      async function seed(item, suffix = '') {
        await page.evaluate(({ key, lessonId, taskId, mode }) => {
          localStorage.clear();
          localStorage.setItem(key, JSON.stringify({ version: 1, records: {}, seen: { [taskId]: 1 }, sessions: {
            [lessonId + ':' + mode]: { taskId, step: 0, wrong: false, assisted: mode !== 'independent', familiar: false,
              done: false, draft: '', answers: [], started: '2026-10-10T00:00:00.000Z', registered: false }
          } }));
        }, { key: KEY, lessonId: item.lesson.id, taskId: item.task.id, mode: item.mode });
        await page.goto(base + '?robot=' + encodeURIComponent(item.task.id + '-' + item.mode + '-' + width + suffix) + '#practice/' + item.lesson.id + '/' + item.mode);
        await page.locator('#answer-form').waitFor();
      }
      for (const item of cases) {
        const label = item.task.id + ':' + item.mode + ':' + width;
        await seed(item);
        assert.equal((await session(page, item)).taskId, item.task.id);
        const container = page.locator('#task-solution'), open = container.locator('[data-solution-open]');
        await open.waitFor();
        assert.equal(await container.locator('[data-solution-panel]').count(), 0, label + ': future worked answer absent from DOM');
        const draft = item.mode === 'guided' && item.task.steps[0].choices ? item.task.steps[0].choices[0] : '1/7';
        await fill(page, draft); const before = retained(await session(page, item));
        await noOverflow(page, label + ': before explanation');
        await open.focus(); await page.keyboard.press('Enter');
        const panel = container.locator('[data-solution-panel]'); await panel.waitFor();
        assert.equal(await open.evaluate(node => document.activeElement === node), true, label + ': focus remains on opening control');
        assert.equal((await session(page, item)).assisted, true, label + ': explanation counts as help');
        const expectedCount = await page.evaluate(taskId => ProfileSolutions.steps(ProfileLessons.flatMap(lesson => lesson.tasks).find(task => task.id === taskId)).length, item.task.id);
        assert(expectedCount >= 2);
        const next = panel.locator('[data-solution-next]'), list = panel.locator('[data-solution-step]'), history = [];
        for (let n = 1; n <= expectedCount; n++) {
          assert.equal(await list.count(), n, label + ': exactly one new step per click');
          const texts = await list.allInnerTexts(); assert.deepEqual(texts.slice(0, -1), history, label + ': retained history');
          history.push(texts.at(-1)); await noOverflow(page, label + ': step ' + n);
          if (n < expectedCount) { await next.focus(); await page.keyboard.press('Enter'); }
        }
        assert.equal(await next.getAttribute('aria-disabled'), 'true');
        assert.equal(await next.evaluate(node => document.activeElement === node), true, label + ': focus survives the last step');
        assert.match(history.at(-1), /Ответ:/u, label + ': final answer is explicit');
        if (item.task.id === 'geo-similarity-area') {
          const text = await panel.innerText();
          assert.match(text, /основан/iu); assert.match(text, /высот/iu);
          assert.match(text, /300\s*[:/÷]\s*4\s*=\s*75/u);
          await validateCross(panel.locator('.profile-solution-proportion').filter({ hasText: '12' }).last());
          if (shots && item.mode === 'independent') await page.screenshot({ path: path.join(shots, 'similarity-area-' + width + '.png'), fullPage: true });
        }
        await open.click(); assert.equal(await panel.isVisible(), false);
        await open.click(); assert.equal(await list.count(), expectedCount);
        assert.deepEqual(retained(await session(page, item)), before, label + ': help changes no task, draft or accepted step');
        await page.reload(); await page.locator('#answer-form').waitFor();
        assert.deepEqual(retained(await session(page, item)), before, label + ': same condition and draft after reload');
        assert.equal((await session(page, item)).assisted, true, label + ': help cannot be erased by reload');
        if (item.mode === 'guided') for (const step of item.task.steps) await accept(page, step.answer);
        else await accept(page, item.task.answer);
        await page.locator('.result-panel').waitFor();
        assert.equal((await saved(page)).records[item.lesson.id].independent.length, 0, label + ': helped answer is never independent credit');
        assert.equal(await page.locator('#result-solution [data-solution-step]').count(), 1, label + ': result also unfolds one step at a time');
        journeys++;
      }

      // A new attempt in another tab invalidates controls still shown in the
      // first tab. No answer from the old condition may be appended afterward.
      const staleItem = cases[0];
      for (const action of ['open', 'next', 'reopen']) {
        await seed(staleItem, '-stale-' + action);
        if (action !== 'open') await page.locator('#task-solution [data-solution-open]').click();
        if (action === 'reopen') await page.locator('#task-solution [data-solution-open]').click();
        const other = await context.newPage(); await other.goto(base);
        const nextTask = staleItem.lesson.tasks[4];
        await other.evaluate(({ key, lessonId, taskId }) => {
          const data = JSON.parse(localStorage.getItem(key));
          data.sessions[lessonId + ':independent'] = { taskId, step: 0, wrong: false, assisted: false, familiar: false,
            done: false, draft: '7/9', answers: [], started: '2099-01-01T00:00:00.000Z', registered: false };
          data.seen[taskId] = 1; localStorage.setItem(key, JSON.stringify(data));
        }, { key: KEY, lessonId: staleItem.lesson.id, taskId: nextTask.id });
        await page.locator('#task-solution ' + (action === 'next' ? '[data-solution-next]' : '[data-solution-open]')).click();
        assert.equal((await session(page, staleItem)).taskId, nextTask.id);
        assert.equal((await session(page, staleItem)).assisted, false, 'Stale ' + action + ' does not mark a different task assisted');
        assert.equal(await page.locator('#task-solution [data-solution-panel]').count(), 0, 'Stale ' + action + ' shows no worked content for the new task');
        assert.equal(await page.locator('#answer').inputValue(), '7/9'); await other.close();
      }

      await page.evaluate(() => localStorage.clear()); await page.goto(base + '?checkpoint-' + width + '#checkpoint');
      await page.locator('#checkpoint-form').waitFor();
      const checkpointBefore = await saved(page, CHECKPOINT_KEY), item = checkpointBefore.round.items[0];
      const task = lessons.flatMap(lesson => lesson.tasks).find(task => task.id === item.taskId); assert(task);
      await page.locator('#answer').fill('2/7');
      assert.equal(await page.locator('#checkpoint-solution [data-solution-step]').count(), 0);
      await page.locator('#checkpoint-solution [data-solution-open]').click();
      assert.equal(await page.locator('#checkpoint-solution [data-solution-step]').count(), 1);
      assert.equal((await saved(page, CHECKPOINT_KEY)).round.items[0].assisted, true);
      assert.equal(await page.locator('#answer').inputValue(), '2/7');
      const checkpointOther = await context.newPage(); await checkpointOther.goto(base + '#checkpoint');
      await checkpointOther.locator('#answer').fill(String(task.answer)); await checkpointOther.locator('#checkpoint-submit').click();
      await checkpointOther.locator('#checkpoint-next').waitFor();
      await page.locator('#checkpoint-solution [data-solution-next]').click();
      assert.equal(await page.locator('#checkpoint-solution [data-solution-step]').count(), 0, 'A changed submitted flag cancels old next-step disclosure');
      assert.equal((await saved(page, CHECKPOINT_KEY)).round.items[0].correct, true);
      assert.equal((await saved(page, CHECKPOINT_KEY)).round.items[0].assisted, true);
      await page.locator('#checkpoint-solution [data-solution-open]').click();
      await checkpointOther.locator('#checkpoint-next').click();
      await checkpointOther.locator('#checkpoint-form').waitFor();
      await page.locator('#checkpoint-solution [data-solution-next]').click();
      const advanced = await saved(page, CHECKPOINT_KEY);
      assert.equal(advanced.round.index, 1);
      assert.notEqual(advanced.round.items[1].taskId, task.id);
      assert.equal(advanced.round.items[1].assisted, false, 'Old next-step controls never add help to the new checkpoint condition');
      assert.equal(await page.locator('#checkpoint-solution [data-solution-step]').count(), 0, 'A changed checkpoint token cancels old disclosure');
      await checkpointOther.close();
      const secondTask = lessons.flatMap(lesson => lesson.tasks).find(task => task.id === advanced.round.items[1].taskId);
      await page.locator('#answer').fill(String(secondTask.answer)); await page.locator('#checkpoint-submit').click();
      await page.locator('#checkpoint-next').waitFor();
      const beforePostAnswerHelp = (await saved(page, CHECKPOINT_KEY)).round.items[1];
      assert.equal(beforePostAnswerHelp.correct, true); assert.equal(beforePostAnswerHelp.assisted, false);
      await page.locator('#checkpoint-solution [data-solution-open]').click();
      assert.deepEqual((await saved(page, CHECKPOINT_KEY)).round.items[1], beforePostAnswerHelp, 'An explanation after accepted independent work preserves its earned result');
      await noOverflow(page, 'checkpoint ' + width);
      await context.close();
    }
    assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []);
    console.log('PROFILE_STEP_SOLUTIONS_BROWSER_OK ' + JSON.stringify({ journeys, positions: 13, similarityTypes: 6,
      widths: [360, 1280], oneStep: true, retainedHistory: true, draftReload: true, helpCredit: true,
      staleActions: ['open', 'next', 'reopen'], checkpoint: true, keyboard: true, errors, failedRequests }));
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
