'use strict';

// Local synthetic learners check navigation and legibility, not cognitive or
// educational efficacy. No real learner state or cloud account is accessed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const KEY = 'mathexam.profileStart2027.v1';
const PREFS = 'mathexam.profileCalmPreferences.v1';
const lessons = ['geometry', 'stereo', 'algebra', 'probability', 'equations', 'functions', 'applied', 'readiness']
  .flatMap(name => require('../ege-profil/start/' + name + '-data.js'));
const itemFor = (lessonId, taskId, mode = 'independent') => {
  const lesson = lessons.find(item => item.id === lessonId);
  return { lesson, task: lesson.tasks.find(item => item.id === taskId), mode };
};
const genericCases = Array.from({ length: 13 }, (_, index) => {
  const lesson = lessons.find(item => item.position === index + 1);
  return { lesson, task: lesson.tasks[3], mode: 'independent' };
});
const probability = itemFor('prob-independent', 'prob-both-4');
const richCases = [itemFor('geo-right', 'geo-right-cosine'), itemFor('geo-right', 'geo-right-sine', 'guided')];
const server = http.createServer((req, res) => {
  try {
    let file = path.resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://fixture').pathname));
    if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' }[path.extname(file)] || 'text/html');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});
const stored = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
const session = async (page, item) => (await stored(page)).sessions[item.lesson.id + ':' + item.mode];
const progress = value => ({ taskId: value.taskId, step: value.step, draft: value.draft, answers: value.answers, started: value.started });
const noOverflow = async (page, label) => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ': fits viewport');
async function fill(page, value) {
  if (await page.locator('#answer').count()) await page.locator('#answer').fill(String(value));
  else {
    const choices = page.locator('#answer-form input[type="radio"]');
    const values = await choices.evaluateAll(nodes => nodes.map(node => node.value));
    await choices.nth(values.indexOf(String(value))).check();
  }
}
async function readable(page, label) {
  const fonts = await page.locator('.small, .breadcrumb, .eyebrow, #calm-toggle, .brand small, .profile-model-note, #input-note, .number-help summary, .task-help-link, .profile-solution-title').evaluateAll(nodes => nodes
    .filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden')
    .map(node => ({ text: node.textContent.trim().slice(0, 65), size: parseFloat(getComputedStyle(node).fontSize), note: node.matches('.task-kind, .task-help-link, .profile-model-note, #input-note') })));
  assert(fonts.length, label + ': visible typography samples');
  for (const font of fonts) assert(font.size >= (font.note ? 18 : 16), label + ': readable label ' + JSON.stringify(font));
  await noOverflow(page, label);
}
async function followHelp(page, target, label) {
  const link = page.locator('.task-kind a.task-help-link');
  assert.equal(await link.count(), 1, label + ': help status is a link');
  const href = await link.getAttribute('href');
  assert(href && href.startsWith('#') && href.length > 1, label + ': real local destination');
  const url = page.url();
  await link.focus(); await page.keyboard.press('Enter');
  assert.equal(page.url(), url, label + ': link does not alter hash routing');
  assert.equal(await target.evaluate(node => document.activeElement === node), true, label + ': keyboard focus reaches explanation');
  const box = await target.boundingBox();
  assert(box && box.y >= -1 && box.y + box.height <= 901, label + ': explanation heading is within viewport');
  assert.equal(await page.evaluate(id => !!document.getElementById(id), href.slice(1)), true, label + ': href resolves');
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port, base = origin + '/ege-profil/start/index.html';
  const errors = [], failedRequests = [];
  let browser, journeys = 0;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'] });
    for (const width of [1280, 360]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage(); page.setDefaultTimeout(12000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(origin)) failedRequests.push(response.status() + ' ' + response.url()); });
      await page.goto(base); await page.locator('[data-calm-exam="13"]').waitFor();
      async function seed(item, calm, suffix = '') {
        await page.evaluate(({ key, prefsKey, lessonId, taskId, mode, calm }) => {
          localStorage.clear();
          localStorage.setItem(prefsKey, JSON.stringify({ version: 1, enabled: calm, examples: {}, micro: {} }));
          localStorage.setItem(key, JSON.stringify({ version: 1, records: {}, seen: { [taskId]: 1 }, sessions: {
            [lessonId + ':' + mode]: { taskId, step: 0, wrong: false, assisted: mode !== 'independent', familiar: false,
              done: false, draft: '', answers: [], started: '2026-10-10T00:00:00.000Z', registered: false }
          } }));
        }, { key: KEY, prefsKey: PREFS, lessonId: item.lesson.id, taskId: item.task.id, mode: item.mode, calm });
        await page.goto(base + '?readable=' + encodeURIComponent(item.task.id + '-' + item.mode + '-' + width + '-' + calm + suffix) + '#practice/' + item.lesson.id + '/' + item.mode);
        await page.locator('#answer-form').waitFor();
        assert.equal(await page.locator('body').evaluate(node => node.classList.contains('calm-view')), calm);
      }
      async function solutionJourney(item, calm, rich = false) {
        const label = item.task.id + ':' + item.mode + ':' + width + ':' + calm;
        await seed(item, calm);
        const draft = item.mode === 'guided' && item.task.steps[0].choices ? item.task.steps[0].choices[0] : '1/7';
        await fill(page, draft); const before = progress(await session(page, item));
        const open = page.locator(rich ? '[data-trig-open]' : '#task-solution [data-solution-open]');
        const panel = page.locator(rich ? '[data-trig-explanation]' : '#task-solution [data-solution-panel]');
        const steps = panel.locator(rich ? '[data-trig-step]' : '[data-solution-step]');
        await open.click(); await panel.waitFor();
        assert.equal(await steps.count(), 1, label + ': only first worked step shown');
        await panel.locator(rich ? '[data-trig-next]' : '[data-solution-next]').click();
        const shown = await steps.allInnerTexts(); assert.equal(shown.length, 2);
        await followHelp(page, panel.locator('.profile-solution-title'), label + ': open explanation');
        assert.deepEqual(await steps.allInnerTexts(), shown, label + ': following link preserves steps');
        await open.click(); assert.equal(await panel.isVisible(), false, label + ': can collapse');
        await followHelp(page, panel.locator('.profile-solution-title'), label + ': reopen explanation');
        assert.equal(await panel.isVisible(), true);
        assert.deepEqual(await steps.allInnerTexts(), shown, label + ': reopen preserves steps');
        assert.deepEqual(progress(await session(page, item)), before, label + ': route, task, draft and accepted work unchanged');
        assert.equal((await session(page, item)).assisted, true, label + ': viewed solution remains assistance');
        await readable(page, label);
        journeys++;
      }
      for (const calm of [false, true]) {
        for (const item of genericCases) await solutionJourney(item, calm);
        await solutionJourney(itemFor('prob-independent', 'prob-both-1', 'guided'), calm);
        await solutionJourney({ ...probability, mode: 'plan' }, calm);
        for (const item of richCases) await solutionJourney(item, calm, true);
      }

      // An ordinary drawing hint has its own explanation rather than a generic
      // worked-solution destination, and a hidden hint can be reopened.
      const diagram = itemFor('geo-angles', 'geo-angles-ratio');
      for (const calm of [false, true]) {
        await seed(diagram, calm, '-diagram'); await fill(page, '1/7');
        const before = progress(await session(page, diagram));
        const toggle = page.locator('#task-model .profile-model-controls button').first();
        await toggle.click(); const explanation = await page.locator('#task-model .profile-model-note').innerText();
        await followHelp(page, page.locator('#task-model .profile-model-note'), 'ordinary diagram:' + width + ':' + calm);
        await toggle.click(); assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
        await followHelp(page, page.locator('#task-model .profile-model-note'), 'reopen diagram:' + width + ':' + calm);
        assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('#task-model .profile-model-note').innerText(), explanation);
        assert.deepEqual(progress(await session(page, diagram)), before);
        await readable(page, 'diagram typography:' + width + ':' + calm); journeys++;
      }

      // Equation explanations have a dedicated parts region rather than a
      // live note. The link must reach those parts and restore a hidden region.
      const equation = itemFor('eq-linear', 'eq-linear-4');
      await seed(equation, true, '-parts'); await fill(page, '1/7');
      const equationBefore = progress(await session(page, equation));
      const equationToggle = page.locator('#task-model .model-toggle');
      const parts = page.locator('#task-model [data-expression-parts]');
      await equationToggle.click(); const partsText = await parts.innerText();
      await followHelp(page, parts, 'equation parts:' + width);
      await equationToggle.click(); assert.equal(await parts.isVisible(), false);
      await followHelp(page, parts, 'reopen equation parts:' + width);
      assert.equal(await equationToggle.getAttribute('aria-pressed'), 'true');
      assert.equal(await parts.innerText(), partsText);
      assert.deepEqual(progress(await session(page, equation)), equationBefore);
      journeys++;

      // The graph can have two helpers open at once. After opening the explorer,
      // the status must target that explorer, not the earlier live helper note.
      const graph = itemFor('calc-tangent', 'calc-tangent-4');
      await seed(graph, true, '-explorer'); await fill(page, '1/7');
      const graphBefore = progress(await session(page, graph));
      const graphHelp = page.locator('#task-model [data-model-action="function-help"]');
      const explorer = page.locator('#task-model details.extra-help');
      const explorerSummary = explorer.locator('summary');
      await graphHelp.click(); await explorerSummary.click();
      await explorer.locator('[data-revealed-value="true"]').waitFor();
      const explorerText = await explorer.locator('[aria-live]').innerText();
      await followHelp(page, explorer, 'graph explorer with other help open:' + width);
      await explorerSummary.click();
      await explorer.locator('[data-revealed-value]').waitFor({ state: 'detached' });
      await followHelp(page, explorer, 'reopen graph explorer:' + width);
      await explorer.locator('[data-revealed-value="true"]').waitFor();
      assert.equal(await explorer.evaluate(node => node.open), true);
      assert.equal(await explorer.locator('[aria-live]').innerText(), explorerText);
      assert.equal(await graphHelp.getAttribute('aria-pressed'), 'true', 'The other graph helper remains open');
      assert.deepEqual(progress(await session(page, graph)), graphBefore);
      journeys++;

      // A stale link cannot reveal an old answer or mark a replacement task as
      // assisted when another tab has started a new condition.
      for (const item of [probability, richCases[0], diagram]) {
        const rich = item.lesson.id === 'geo-right', drawing = item === diagram;
        await seed(item, true, '-stale');
        await page.locator(drawing ? '#task-model .profile-model-controls button' : rich ? '[data-trig-open]' : '#task-solution [data-solution-open]').first().click();
        const other = await context.newPage(); await other.goto(base);
        const nextTask = item.lesson.tasks[4];
        await other.evaluate(({ key, lessonId, taskId }) => {
          const data = JSON.parse(localStorage.getItem(key));
          data.sessions[lessonId + ':independent'] = { taskId, step: 0, wrong: false, assisted: false, familiar: false,
            done: false, draft: '7/9', answers: [], started: '2099-01-01T00:00:00.000Z', registered: false };
          data.seen[taskId] = 1; localStorage.setItem(key, JSON.stringify(data));
        }, { key: KEY, lessonId: item.lesson.id, taskId: nextTask.id });
        const url = page.url(); await page.locator('.task-kind a.task-help-link').click();
        assert.equal(page.url(), url);
        assert.equal((await session(page, item)).taskId, nextTask.id);
        assert.equal((await session(page, item)).assisted, false);
        assert.equal(await page.locator('#answer').inputValue(), '7/9');
        assert.equal(await page.locator('[data-solution-panel], [data-trig-explanation]').count(), 0, 'Stale link reveals no answer');
        assert.equal(await page.locator('.task-kind a.task-help-link').count(), 0, 'Stale status does not survive task replacement');
        await other.close(); journeys++;
      }

      await seed(probability, true, '-credit');
      await page.locator('#task-solution [data-solution-open]').click();
      await followHelp(page, page.locator('#task-solution .profile-solution-title'), 'assistance credit:' + width);
      await fill(page, probability.task.answer); await page.locator('#submit-answer').click();
      await page.locator('#feedback.good').waitFor(); await page.locator('#next').click();
      await page.locator('.result-panel').waitFor();
      assert.equal((await stored(page)).records[probability.lesson.id].independent.length, 0, 'Help link does not grant independent credit');
      await readable(page, 'result typography:' + width); journeys++;
      await page.goto(base + '#calm'); await page.locator('[data-calm-exam="13"]').waitFor();
      await readable(page, 'catalogue typography:' + width);
      await page.goto(base + '#exam/16'); await page.getByRole('heading', { name: 'Неравенства.', exact: true }).waitFor();
      await readable(page, 'task 16 typography:' + width);
      await context.close();
    }
    assert.deepEqual(errors, [], 'No uncaught browser errors');
    assert.deepEqual(failedRequests, [], 'No failed course requests');
    console.log('PROFILE_READABLE_HELP_BROWSER_OK ' + journeys + ' synthetic journeys at 360/1280 px; normal/calm typography, keyboard help links, retained work, stale-tab guards and honest credit.');
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
