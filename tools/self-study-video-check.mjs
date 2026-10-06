import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { createRenderer, validateManifest } from '../video-worker/src/renderer.js';
import { viewportFor } from '../video-worker/src/validation.js';
import { silentDuration } from '../video-worker/src/tts.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const render = process.argv.includes('--render');
const outputIndex = process.argv.indexOf('--output');
const outputDir = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : path.resolve(repo, '..', 'self-study-deliverables');
const runtimeModules = process.env.NODE_PATH?.split(path.delimiter)[0] || process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || path.join(repo, 'video-worker', 'node_modules');
const requireRuntime = createRequire(path.join(runtimeModules, 'package.json'));
const { chromium } = requireRuntime('playwright');
const run = promisify(execFile);
const allTasks = ['homework-help', 'linear-equation', 'adjacent-angles', 'negative-numbers', 'fractions', 'brackets', 'proportions', 'percentages'];
// Independent mathematical expectations for the published examples. The checks
// use visible lines, not the studio's history-building data or implementation.
const equationExamples = [
  { condition: '6x − 4 = 4x − 11', lines: [[4, '6x − 4x − 4 = −11'], [5, '6x − 4x = −11 + 4'], [6, '2x = −7'], [10, 'x = −7 : (2) = −3,5'], [11, '−25 = −25']] },
  { condition: '7x + 5 = 3x + 17', lines: [[4, '7x − 3x + 5 = 17'], [5, '7x − 3x = 17 − 5'], [6, '4x = 12'], [10, 'x = 12 : (4) = 3'], [11, '26 = 26']] },
  { condition: '2x − 9 = 5x + 6', lines: [[4, '2x − 5x − 9 = 6'], [5, '2x − 5x = 6 + 9'], [6, '−3x = 15'], [10, 'x = 15 : (−3) = −5'], [11, '−19 = −19']] },
];
const bracketExamples = [
  { condition: '3(2x − 1) − 4(x + 3) = 5', lines: [[4, '6x − 3 − 4(x + 3) = 5'], [5, '6x − 3 − 4x − 12 = 5'], [6, '6x − 4x = 5 + 3 + 12'], [7, '2x = 20'], [10, 'x = 20 : (2) = 10'], [11, '5 = 5']] },
  { condition: '2(3x + 4) − 3(x − 2) = 20', lines: [[4, '6x + 8 − 3(x − 2) = 20'], [5, '6x + 8 − 3x + 6 = 20'], [6, '6x − 3x = 20 − 8 − 6'], [7, '3x = 6'], [10, 'x = 6 : (3) = 2'], [11, '20 = 20']] },
  { condition: '−2(4x − 3) + 5(x + 1) = 2', lines: [[4, '−8x + 6 + 5(x + 1) = 2'], [5, '−8x + 6 + 5x + 5 = 2'], [6, '−8x + 5x = 2 − 6 − 5'], [7, '−3x = −9'], [10, 'x = −9 : (−3) = 3'], [11, '2 = 2']] },
];
const percentExamples = [
  { condition: 'Найди 20% от 150.', lines: [[3, 'x/150 = 20/100'], [5, '100x = 150 · 20'], [6, '100x = 3000'], [7, 'x = 3000 : 100 = 30'], [8, '30/150 = 20/100 = 0,2']] },
  { condition: '30 — это 20% числа. Найди число.', lines: [[3, 'x/30 = 100/20'], [5, '20x = 30 · 100'], [6, '20x = 3000'], [7, 'x = 3000 : 20 = 150'], [8, '30/150 = 20/100 = 0,2']] },
  { condition: 'Сколько процентов составляет 30 от 150?', lines: [[3, '30/150 = p/100'], [5, '150p = 30 · 100'], [6, '150p = 3000'], [7, 'p = 3000 : 150 = 20'], [8, '20% от 150: 150 · 20/100 = 30']] },
];
const angleExamples = [{ given: 56, result: 124, fresh: 68 }, { given: 73, result: 107, fresh: 109 }, { given: 118, result: 62, fresh: 47 }];
const helpExamples = [
  { condition: '2(y + 1) + 3 = 11', solved: ['2y + 2 + 3 = 11', '2y = 6', 'y = 3'], fresh: '3(z − 1) + 2 = 17' },
  { condition: 'Смежные углы: 64° и β', solved: ['β = 180° − 64° = 116°'], fresh: 'Смежные углы: 71° и γ' },
  { condition: '5a + 2a − 3', solved: ['5a + 2a − 3 = 7a − 3'], fresh: '6b − 2b + 5' },
];
const normalizedMath = text => String(text).replace(/\s+/g, '').replace(/[−–]/g, '-');
const taskArgument = process.argv.find(argument => argument.startsWith('--tasks='));
const tasks = taskArgument ? taskArgument.slice('--tasks='.length).split(',') : allTasks;
assert.ok(tasks.length && tasks.every(task => allTasks.includes(task)), '--tasks must contain fixed pilot IDs');
const renderArgument = process.argv.find(argument => argument.startsWith('--render-tasks='));
const renderTasks = renderArgument ? renderArgument.slice('--render-tasks='.length).split(',') : tasks.filter(task => task !== 'homework-help');
assert.ok((!render || renderTasks.length) && renderTasks.every(task => tasks.includes(task)), '--render-tasks must name fixed IDs included in the browser checks');
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'self-study-local-check-'));
const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH || chromium.executablePath();
const report = {
  scope: 'Local authored pilot assets only. No production or external speech provider is contacted.',
  rendering: render, renderTasks: render ? renderTasks : [], views: [], samples: [], errors: [], history: [],
  naturalVoiceVerified: false, browserSandbox: 'Disabled only in this local test wrapper; production launch options are unchanged.',
};
if (render && (taskArgument || renderArgument)) {
  let previous;
  try { previous = JSON.parse(await fs.readFile(path.join(outputDir, 'render-report.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (previous) {
    report.views = previous.views.filter(view => !tasks.includes(view.task));
    report.samples = previous.samples.filter(sample => !renderTasks.includes(sample.task));
    report.preservedTaskResults = [...new Set(report.samples.map(sample => sample.task))];
  }
}
const allowed = new Map([
  ['/video-lessons/studio.html', ['studio.html', 'text/html; charset=utf-8']],
  ['/video-lessons/studio.css', ['studio.css', 'text/css; charset=utf-8']],
  ['/video-lessons/studio.js', ['studio.js', 'text/javascript; charset=utf-8']],
  ['/video-lessons/export.js', ['export.js', 'text/javascript; charset=utf-8']],
  ['/video-lessons/cheatsheet-topics.js', ['cheatsheet-topics.js', 'text/javascript; charset=utf-8']],
  ['/video-lessons/motion-topics.js', ['motion-topics.js', 'text/javascript; charset=utf-8']],
  ['/video-lessons/grade7-next-videos.js', ['grade7-next-videos.js', 'text/javascript; charset=utf-8']],
  ['/video-lessons/pre7-videos.js', ['pre7-videos.js', 'text/javascript; charset=utf-8']],
  ['/video-lessons/pre7-motion.js', ['pre7-motion.js', 'text/javascript; charset=utf-8']],
  ['/video-lessons/grade7-geometry-core-videos.js', ['grade7-geometry-core-videos.js', 'text/javascript; charset=utf-8']],
  ['/video-lessons/grade7-geometry-practice-videos.js', ['grade7-geometry-practice-videos.js', 'text/javascript; charset=utf-8']],
  ['/video-lessons/geometry-core-motion.js', ['geometry-core-motion.js', 'text/javascript; charset=utf-8']],
  ['/video-lessons/motion.js', ['motion.js', 'text/javascript; charset=utf-8']],
  ['/video-lessons/makarychev7-videos.js', ['makarychev7-videos.js', 'text/javascript; charset=utf-8']],
]);
const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    if (pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    const item = allowed.get(pathname);
    if (!item || request.method !== 'GET') { response.writeHead(404); response.end(); return; }
    const content = await fs.readFile(path.join(repo, 'video-lessons', item[0]));
    response.writeHead(200, { 'Content-Type': item[1], 'Cache-Control': 'no-store' });
    response.end(content);
  } catch { response.writeHead(500); response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

// Only the locally served, authored fixture is reachable. This dependency is
// internal to the check, never a production environment variable or API field.
const localChromium = {
  async launch(options) {
    const browser = await chromium.launch({ ...options, executablePath, chromiumSandbox: false });
    const originalNewContext = browser.newContext.bind(browser);
    browser.newContext = async contextOptions => {
      const context = await originalNewContext(contextOptions);
      await context.route('**/*', route => {
        const url = route.request().url();
        if (url.startsWith('data:') || url.startsWith('blob:') || new URL(url).origin === origin) return route.continue();
        return route.abort();
      });
      context.on('page', page => {
        page.on('pageerror', error => report.errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
      });
      return context;
    };
    return browser;
  },
};

async function putCaption(page, text, portrait) {
  await page.evaluate(({ text, portrait }) => {
    let caption = document.getElementById('check-caption');
    if (!caption) { caption = document.createElement('div'); caption.id = 'check-caption'; document.body.appendChild(caption); }
    caption.textContent = text;
    Object.assign(caption.style, {
      position: 'fixed', left: portrait ? '28px' : '40px', right: portrait ? '28px' : '40px', bottom: '20px',
      padding: '16px 22px', font: `${portrait ? 24 : 22}px/1.4 system-ui, sans-serif`, boxSizing: 'border-box',
      whiteSpace: 'normal', overflowWrap: 'anywhere', color: 'white', background: 'rgba(20,27,45,.91)', borderRadius: '18px', textAlign: 'center',
    });
  }, { text, portrait });
}

async function inspectFrame(page, portrait) {
  return page.evaluate(({ portrait }) => {
    const failures = [];
    const canvas = document.querySelector('.canvas').getBoundingClientRect();
    for (const selector of ['.lesson-frame h2', '#condition', '#step-panel', '.frame-footer']) {
      const element = document.querySelector(selector), box = element.getBoundingClientRect();
      if (box.left < -1 || box.right > innerWidth + 1 || box.top < -1 || box.bottom > canvas.bottom + 1) failures.push(`${selector} outside reserved scene area`);
      if (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1) failures.push(`${selector} content overflow`);
    }
    const caption = document.getElementById('check-caption'), box = caption.getBoundingClientRect();
    if (box.height > (portrait ? 320 : 220) || box.top < canvas.bottom - 1 || box.bottom > innerHeight) failures.push('caption outside its reserved area');
    if (document.documentElement.scrollWidth > innerWidth + 1) failures.push('horizontal page overflow');
    const history = document.querySelector('#solution-history');
    if (!history) failures.push('persistent solution history is missing');
    else if (history.getBoundingClientRect().height > 0) {
      const boundary = history.closest('.condition').getBoundingClientRect();
      if (history.scrollWidth > history.clientWidth + 1 || history.scrollHeight > history.clientHeight + 1) failures.push('solution history requires hidden scrolling');
      for (const line of history.querySelectorAll('.history-line, .history-math')) {
        const rect = line.getBoundingClientRect();
        if (rect.left < boundary.left - 1 || rect.right > boundary.right + 1 || rect.top < boundary.top - 1 || rect.bottom > boundary.bottom + 1 || rect.bottom > canvas.bottom + 1) failures.push('solution history line is clipped');
      }
    }
    return { failures, captionHeight: Math.round(box.height), canvasHeight: Math.round(canvas.height) };
  }, { portrait });
}

async function inspectHistory(page, task, preset, sceneId) {
  const number = Number(sceneId.split('-').at(-1));
  const visible = await page.locator('#solution-history .history-math').allTextContents();
  const lines = visible.map(normalizedMath), history = lines.join('\n');
  const condition = normalizedMath(await page.locator('#condition').textContent());
  const label = `${task} preset ${preset} scene ${sceneId}`;
  assert.equal(await page.locator('#solution-history').count(), 1, `${label}: persistent history exists`);
  assert.ok(await page.locator('#solution-history .history-line.is-current').count() <= 1, `${label}: at most one current history line`);
  assert.equal(await page.locator('#solution-history .history-line[data-scene-id*="wrong"]').count(), 0, `${label}: wrong example is separate from valid solution`);
  if (['linear-equation', 'brackets', 'percentages'].includes(task)) {
    const example = ({ 'linear-equation': equationExamples, brackets: bracketExamples, percentages: percentExamples })[task][preset - 1];
    assert.ok(condition.includes(normalizedMath(example.condition)), `${label}: original condition remains visible`);
    assert.deepEqual(lines, example.lines.filter(([step]) => step <= number).map(([, line]) => normalizedMath(line)),
      `${label}: exactly the already justified transformations remain visible`);
  } else if (task === 'adjacent-angles') {
    const p = angleExamples[preset - 1];
    const expected = [[3, '∠AOC + ∠COB = 180°'], [5, `${p.given}° + ∠COB = 180°`],
      [7, `∠COB = 180° − ${p.given}° = ${p.result}°`], [8, `${p.given}° + ${p.result}° = 180°`], [9, `∠BOD = ∠AOC = ${p.given}°`]];
    if (number === 10) {
      assert.deepEqual(lines, [], `${label}: the new diagram starts a new solution`);
      assert.ok(condition.includes(`${p.fresh}°`), `${label}: the new given angle is visible`);
    } else for (const [step, formula] of expected) {
      assert.equal(lines.filter(line => line === normalizedMath(formula)).length, step <= number ? 1 : 0,
        `${label}: ${formula} is retained once, only after it is shown`);
    }
    assert.equal(history.includes(normalizedMath(`∠COB = ${p.given}° — ошибка`)), false, `${label}: deliberate angle error is excluded`);
  } else if (task === 'homework-help') {
    const p = helpExamples[preset - 1];
    if (number === 6) {
      assert.ok(condition.includes(normalizedMath(p.condition)), `${label}: analogue condition is retained beside its solution`);
      for (const line of p.solved) assert.ok(history.includes(normalizedMath(line)), `${label}: worked analogue retains ${line}`);
    }
    if (number < 6 || number >= 7) for (const line of p.solved) {
      assert.equal(history.includes(normalizedMath(line)), false, `${label}: no future or previous-problem solution leaks into this work`);
    }
    if (number >= 7) assert.ok(condition.includes(normalizedMath(p.fresh)), `${label}: own fresh task remains visible`);
  } else {
    const example = await page.evaluate(({ task, preset }) => {
      const scenes = window.MathExamCheatsheets[task].scenes(preset);
      return { condition: scenes[0].math, wrong: scenes[3].math, fresh: scenes.at(-1).math,
        steps: [4, 5, 6].map(index => ({ step: index + 1, math: scenes[index].math })) };
    }, { task, preset });
    assert.ok(condition.includes(normalizedMath(example.condition)), `${label}: the original condition stays beside its solution`);
    assert.deepEqual(lines, example.steps.filter(entry => entry.step <= number).map(entry => normalizedMath(entry.math)),
      `${label}: visible solution retains the already justified scene formulas, never future answers`);
    assert.equal(lines.includes(normalizedMath(example.wrong)), false, `${label}: the illustrated wrong operation is not a solution line`);
    if (number === 1) assert.ok(normalizedMath(await page.locator('#practice-question').textContent()).includes(normalizedMath(example.fresh)),
      `${label}: independent reader practice belongs to the selected mathematical topic`);
  }
  return { sceneId, retainedLines: visible.length };
}

async function inspectHistoryNavigation(page, view) {
  const prepare = (task, preset) => page.evaluate(({ task, preset }) => MathExamVideoStudio.prepare(`t${task}`, preset), { task, preset });
  const show = (task, scene) => page.evaluate(({ task, scene }) => MathExamVideoStudio.show(`t${task}`, scene), { task, scene });
  await prepare('linear-equation', 1);
  await show('linear-equation', 'check-substitution-11');
  await inspectHistory(page, 'linear-equation', 1, 'check-substitution-11');
  // Jump backwards and forwards through the real public renderer API. A visited
  // scene cache must not reveal the later answer after returning to an earlier step.
  await show('linear-equation', 'move-numbers-5');
  await inspectHistory(page, 'linear-equation', 1, 'move-numbers-5');
  await show('linear-equation', 'recall-rule-3');
  await inspectHistory(page, 'linear-equation', 1, 'recall-rule-3');
  await show('linear-equation', 'combine-like-6');
  await inspectHistory(page, 'linear-equation', 1, 'combine-like-6');
  await prepare('linear-equation', 2);
  await inspectHistory(page, 'linear-equation', 2, 'read-condition-1');
  await show('linear-equation', 'check-substitution-11');
  await inspectHistory(page, 'linear-equation', 2, 'check-substitution-11');
  await prepare('adjacent-angles', 3);
  await inspectHistory(page, 'adjacent-angles', 3, 'read-diagram-1');
  await show('adjacent-angles', 'independent-task-10');
  await inspectHistory(page, 'adjacent-angles', 3, 'independent-task-10');
  await show('adjacent-angles', 'check-sum-8');
  await inspectHistory(page, 'adjacent-angles', 3, 'check-sum-8');
  await prepare('homework-help', 1);
  await show('homework-help', 'analogue-solution-6');
  await inspectHistory(page, 'homework-help', 1, 'analogue-solution-6');
  await show('homework-help', 'fresh-independent-7');
  await inspectHistory(page, 'homework-help', 1, 'fresh-independent-7');
  await show('homework-help', 'analogue-solution-6');
  await inspectHistory(page, 'homework-help', 1, 'analogue-solution-6');
  for (const task of ['negative-numbers', 'fractions', 'proportions']) {
    await prepare(task, 1);
    await show(task, 'check-result-7'); await inspectHistory(page, task, 1, 'check-result-7');
    await show(task, 'correct-step-5'); await inspectHistory(page, task, 1, 'correct-step-5');
    await show(task, 'wrong-operation-4'); await inspectHistory(page, task, 1, 'wrong-operation-4');
    await show(task, 'independent-task-8'); await inspectHistory(page, task, 1, 'independent-task-8');
    await prepare(task, 2); await inspectHistory(page, task, 2, 'read-condition-1');
    await show(task, 'check-result-7'); await inspectHistory(page, task, 2, 'check-result-7');
    await prepare(task, 3); await inspectHistory(page, task, 3, 'read-condition-1');
  }
  for (const [task, final, early] of [['brackets', 'check-substitution-11', 'correct-expansion-5'], ['percentages', 'check-result-8', 'correct-step-5']]) {
    await prepare(task, 1);
    for (const scene of [final, early, 'recall-rule-3', 'independent-task-12']) {
      await show(task, scene); await inspectHistory(page, task, 1, scene);
    }
    await prepare(task, 2); await inspectHistory(page, task, 2, 'read-condition-1');
    await show(task, final); await inspectHistory(page, task, 2, final);
    await prepare(task, 3); await inspectHistory(page, task, 3, 'read-condition-1');
  }
  report.history.push({ view, arbitraryNavigation: true, futureAnswersHidden: true, presetAndTopicReset: true });
}

let browser;
try {
  await fs.mkdir(path.join(outputDir, 'screenshots'), { recursive: true });
  browser = await localChromium.launch({ headless: true, chromiumSandbox: true });
  for (const format of ['16:9', '9:16']) {
    const portrait = format === '9:16';
    const context = await browser.newContext({ viewport: viewportFor(format, tasks[0]), serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.goto(`${origin}/video-lessons/studio.html?studio=1`);
    await page.waitForFunction(() => window.__MATH_EXAM_VIDEO_READY__);
    for (const task of tasks) {
      for (const preset of [1, 2, 3]) {
        const manifest = validateManifest(await page.evaluate(({ task, preset }) => window.MathExamVideoStudio.prepare(`t${task}`, preset, 'ideal-solution'), { task, preset }), task, 'ideal-solution');
        const view = { task, preset, format, scenes: [] };
        report.views.push(view);
        for (const scene of manifest.scenes) {
          await page.evaluate(({ task, id }) => window.MathExamVideoStudio.show(`t${task}`, id, 'ideal-solution'), { task, id: scene.id });
          await putCaption(page, scene.narration, portrait);
          await page.evaluate(() => document.fonts.ready);
          const history = await inspectHistory(page, task, preset, scene.id);
          const layout = await inspectFrame(page, portrait);
          view.scenes.push({ id: scene.id, action: scene.action, click: scene.click, readingSeconds: silentDuration(scene.narration, scene.duration_hint_ms), retainedLines: history.retainedLines, ...layout });
          if (layout.failures.length) {
            await page.screenshot({ path: path.join(outputDir, 'screenshots', `failure-${task}-${preset}-${portrait ? 'portrait' : 'landscape'}-${scene.id}.png`) });
            report.errors.push(`${task} preset ${preset} ${format} scene ${scene.id}: ${layout.failures.join('; ')}`);
          }
          if (preset === 1 && scene === manifest.scenes[2]) {
            await page.screenshot({ path: path.join(outputDir, 'screenshots', `${task}-${portrait ? 'portrait' : 'landscape'}.png`) });
          }
          const historyExample = { 'homework-help': 'analogue-solution-6', 'linear-equation': 'check-substitution-11', 'adjacent-angles': 'distinguish-vertical-9', brackets: 'check-substitution-11', percentages: 'check-result-8' };
          if (preset === 1 && scene.id === (historyExample[task] || 'check-result-7')) {
            await page.screenshot({ path: path.join(outputDir, 'screenshots', `history-${task}-${portrait ? 'portrait' : 'landscape'}.png`) });
          }
        }
      }
    }
    await inspectHistoryNavigation(page, format);
    await context.close();
  }
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const mobile = await mobileContext.newPage();
  await mobile.goto(`${origin}/video-lessons/studio.html`);
  await mobile.waitForFunction(() => window.__MATH_EXAM_VIDEO_READY__);
  const firstStep = mobile.locator('#transcript button').first();
  await firstStep.focus(); await mobile.keyboard.press('Enter');
  assert.equal(await mobile.locator('#scene-count').textContent(), '1 / 9');
  await mobile.locator('#next').focus(); await mobile.keyboard.press('Enter');
  assert.equal(await mobile.locator('#scene-count').textContent(), '2 / 9');
  await mobile.locator('#hint-one summary').focus(); await mobile.keyboard.press('Space');
  assert.equal(await mobile.locator('#hint-one').getAttribute('open'), '');
  await mobile.locator('#answer').fill('Сначала своя попытка'); await mobile.keyboard.press('Enter');
  assert.ok((await mobile.locator('#feedback').textContent()).length > 0);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  await mobile.locator('.reader').scrollIntoViewIfNeeded();
  await mobile.screenshot({ path: path.join(outputDir, 'screenshots', 'reader-390.png'), fullPage: true });
  report.mobile = { width: 390, keyboardStepNavigation: true, keyboardHint: true, practiceSubmit: true, horizontalOverflow: false };
  await inspectHistoryNavigation(mobile, 'reader-390');
  await mobile.evaluate(() => {
    MathExamVideoStudio.prepare('tlinear-equation', 1);
    MathExamVideoStudio.show('tlinear-equation', 'check-substitution-11');
  });
  await mobile.locator('#previous').focus(); await mobile.keyboard.press('Enter');
  await inspectHistory(mobile, 'linear-equation', 1, 'divide-both-sides-10');
  await mobile.locator('#previous').focus(); await mobile.keyboard.press('Enter');
  await inspectHistory(mobile, 'linear-equation', 1, 'combine-like-6');
  await mobile.locator('#transcript button').first().focus(); await mobile.keyboard.press('Enter');
  await inspectHistory(mobile, 'linear-equation', 1, 'read-condition-1');
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    await mobile.setViewportSize(viewport);
    await mobile.evaluate(() => MathExamVideoStudio.show('tlinear-equation', 'check-substitution-11'));
    await mobile.locator('#condition').scrollIntoViewIfNeeded();
    const clipped = await mobile.evaluate(() => {
      const history = document.querySelector('#solution-history'), boundary = history.closest('.condition').getBoundingClientRect();
      return history.scrollHeight > history.clientHeight + 1 || history.scrollWidth > history.clientWidth + 1 ||
        document.documentElement.scrollWidth > innerWidth + 1 || [...history.querySelectorAll('.history-line, .history-math')].some(line => {
          const rect = line.getBoundingClientRect();
          return rect.left < boundary.left - 1 || rect.right > boundary.right + 1 || rect.top < boundary.top - 1 || rect.bottom > boundary.bottom + 1;
        });
    });
    assert.equal(clipped, false, `${viewport.width}px reader: all previous solution lines remain available without inner scrolling`);
    await mobile.screenshot({ path: path.join(outputDir, 'screenshots', `history-reader-${viewport.width}.png`), fullPage: true });
  }
  report.mobile.keyboardHistoryBackAndJump = true;
  await mobileContext.close();
  await browser.close(); browser = null;
  assert.deepEqual(report.errors, [], 'browser layout, console or page errors');
  for (const file of await fs.readdir(path.join(outputDir, 'screenshots'))) {
    if (file.startsWith('failure-') && file.endsWith('.png')) await fs.rm(path.join(outputDir, 'screenshots', file));
  }
  console.log(`Browser checks passed: ${tasks.length * 6} task/preset/format journeys, persistent solution prefixes and 390/1440px reader with keyboard history navigation.`);

  if (render) {
    const mediaDir = path.join(temp, 'videos');
    const workDir = path.join(temp, 'work');
    await fs.mkdir(mediaDir); await fs.mkdir(workDir);
    const config = {
      ttsProvider: 'silent', studioUrl: `${origin}/video-lessons/studio.html`, mediaDir, workDir,
      ffmpegPath: 'ffmpeg', ffprobePath: '/nonexistent/no-audio-ffprobe', commandTimeoutMs: 180_000,
      maxOutputBytes: 100 * 1024 * 1024, maxWorkBytes: 1024 * 1024 * 1024,
    };
    let externalTtsCalls = 0;
    const renderer = createRenderer(config, { synthesize: () => { externalTtsCalls++; throw new Error('external speech must not be called'); } }, { chromium: localChromium });
    for (const task of renderTasks) {
      console.log(`Rendering ${task}: original reading pauses, silent animation.`);
      const updates = [];
      const job = { id: `local-${task}`, ttsProvider: 'silent', request: { task, preset: 1, format: '16:9', captions: true, videoType: 'ideal-solution', audioMode: 'silent' } };
      await renderer(job, { assertOwnership: async () => {}, update: async (_id, update) => updates.push(update) });
      assert.equal(updates.at(-1).status, 'ready');
      const destination = path.join(outputDir, `${task}.mp4`);
      await fs.copyFile(updates.at(-1).output, destination);
      const metadata = JSON.parse((await run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', destination])).stdout);
      assert.equal(metadata.streams.filter(stream => stream.codec_type === 'audio').length, 0, 'Silent school videos contain no audio stream');
      const video = metadata.streams.find(stream => stream.codec_type === 'video');
      assert.equal(video.width, 1280); assert.equal(video.height, 720);
      const expectedDuration = report.views.find(view => view.task === task && view.preset === 1 && view.format === '16:9').scenes.reduce((total, scene) => total + scene.readingSeconds, 0);
      assert.ok(Math.abs(Number(metadata.format.duration) - expectedDuration) < 2, 'reading pauses preserved in completed clip');
      const bytes = await fs.readFile(destination);
      report.samples.push({ task, file: path.basename(destination), durationSeconds: Number(metadata.format.duration), expectedReadingSeconds: expectedDuration, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), audio: 'No audio stream', states: [...new Set(updates.map(update => update.status).filter(Boolean))], temporaryWorkClean: (await fs.readdir(workDir)).length === 0 });
      assert.equal(externalTtsCalls, 0);
      console.log(`Ready ${task}: ${metadata.format.duration}s, ${bytes.length} bytes.`);
    }
    report.externalTtsCalls = externalTtsCalls;
  }
  assert.deepEqual(report.errors, [], 'complete renderer console or page errors');
  const sheetScript = 'from PIL import Image,ImageDraw\nimport math,sys\nfiles=sys.argv[2:]\ncolumns=min(3,len(files));rows=math.ceil(len(files)/columns)\nout=Image.new("RGB",(columns*360,rows*250),"#eef2f0")\nd=ImageDraw.Draw(out)\nfor i,f in enumerate(files):\n im=Image.open(f).convert("RGB"); im.thumbnail((350,210)); x=(i%columns)*360+(360-im.width)//2; y=(i//columns)*250+18; out.paste(im,(x,y)); d.text(((i%columns)*360+10,(i//columns)*250+235),f.rsplit("/",1)[-1],fill="#17302d")\nout.save(sys.argv[1])';
  await run('python3', ['-c', sheetScript, path.join(outputDir, 'contact-sheet.png'), ...['landscape', 'portrait'].flatMap(format => tasks.map(task => path.join(outputDir, 'screenshots', `${task}-${format}.png`)))]);
  await run('python3', ['-c', sheetScript, path.join(outputDir, 'history-contact-sheet.png'), ...['landscape', 'portrait'].flatMap(format => tasks.map(task => path.join(outputDir, 'screenshots', `history-${task}-${format}.png`)))]);
  report.passed = true;
} catch (error) {
  report.passed = false; report.failure = error.message;
  throw error;
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
  await fs.rm(temp, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, render ? 'render-report.json' : 'browser-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  if (render && report.passed) {
    await fs.writeFile(path.join(outputDir, 'browser-report.json'), `${JSON.stringify({
      scope: report.scope, passed: true, views: report.views, mobile: report.mobile, history: report.history, errors: report.errors,
      ...(report.preservedTaskResults ? { preservedTaskResults: report.preservedTaskResults } : {}),
    }, null, 2)}\n`);
  }
}
