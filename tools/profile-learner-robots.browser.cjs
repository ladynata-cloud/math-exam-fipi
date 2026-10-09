'use strict';

// Learner simulations use only the explicit, independently calculated fixtures.
// They never load ProfileLessons, task.answer, or steps[].answer. Reading saved
// state is an observation of progress, not an answer source. A seeded session
// selects the exercise to reproduce a known misconception deterministically.
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const fixture = require(process.env.PROFILE_ROBOTS_FIXTURE || './fixtures/profile-learner-personas.json');
const root = path.resolve(__dirname, '..');
// Optional read-only source overlay reproduces the pre-fix app without changing
// the working tree. Only files present there replace repository assets.
const sourceRoot = process.env.PROFILE_ROBOTS_SOURCE_ROOT;
function sourceFile(file) {
  const relative = path.relative(root, file);
  const overlay = sourceRoot && path.join(sourceRoot, relative);
  return overlay && fs.existsSync(overlay) ? overlay : file;
}
const KEY = 'mathexam.profileStart2027.v1';
const mime = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const report = {
  gate: 'PROFILE_LEARNER_ROBOTS', version: 1,
  startedAt: new Date().toISOString(), mode: process.env.PROFILE_ROBOTS_PHASE || 'verification',
  scope: fixture.scope, answerPolicy: fixture.answerPolicy,
  caveats: [
    'Scripted mistakes and later corrections test interface support and credit rules; they do not establish human learning.',
    'Independent answers are predetermined transfer examples, not claims that a model or pupil inferred a new rule.',
    'Fresh browser contexts isolate personas; persisted sessions are inspected to verify restoration and avoid false credit.'
  ],
  sourceHashes: Object.fromEntries(['app.js', 'state.js', 'algebra-data.js', 'equations-data.js'].map(file => [file,
    crypto.createHash('sha256').update(fs.readFileSync(sourceFile(path.join(root, 'ege-profil/start', file)))).digest('hex')])),
  scenarios: [], errors: [], failedRequests: []
};
const server = http.createServer((req, res) => {
  try {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://fixture').pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] || 'text/html');
    res.end(fs.readFileSync(sourceFile(file)));
  } catch (_) { res.writeHead(404).end(); }
});
function check(scenario, id, condition, observed, expected) {
  scenario.checks.push({ id, passed: Boolean(condition), ...(observed === undefined ? {} : { observed }), ...(expected === undefined ? {} : { expected }) });
}
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
async function snapshot(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY); }
async function state(page, id, mode = 'guided') { return (await snapshot(page)).sessions[id + ':' + mode]; }
async function record(page, id) { return (await snapshot(page)).records[id] || { guided: [], independent: [], attempts: 0 }; }
async function fill(page, value) {
  const radios = page.locator('input[name="answer"][type="radio"]');
  if (await radios.count()) {
    const values = await radios.evaluateAll(nodes => nodes.map(node => node.value));
    const index = values.indexOf(value);
    if (index < 0) throw Error('Fixture choice absent from visible UI: ' + value);
    await radios.nth(index).check();
  } else await page.locator('#answer').fill(value);
}
async function overflow(page, scenario, label) {
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
  check(scenario, 'no-horizontal-overflow:' + label, dimensions.content <= dimensions.viewport + 1, dimensions);
}
async function accept(page, scenario, value, label, keyboard = false) {
  await fill(page, value);
  scenario.events.push({ action: 'answer', label, value, question: await page.locator('.question').innerText() });
  if (keyboard && await page.locator('#answer').count()) await page.locator('#answer').press('Enter');
  else await page.locator('#submit-answer').click();
  await page.locator('#feedback.good').waitFor();
  check(scenario, 'accepted:' + label, await page.locator('#next').isEnabled());
  check(scenario, 'single-acceptance:' + label, await page.locator('#submit-answer').isDisabled());
  await overflow(page, scenario, label);
}
async function advance(page, keyboard = false) {
  if (keyboard) { await page.locator('#next').focus(); await page.keyboard.press('Enter'); }
  else await page.locator('#next').click();
}
async function useHelpAndReturn(page, scenario, lesson, mode, label) {
  await page.locator('#hint').click();
  const hint = await page.locator('#hint-box').innerText();
  check(scenario, 'visible-hint:' + label, hint.length > 15, hint);
  await page.locator('.support-details summary').click();
  await page.locator('#repair').click();
  await page.locator('.repair-panel').waitFor();
  const before = await state(page, lesson, mode);
  scenario.events.push({ action: 'repair', label, explanation: await page.locator('.repair-panel .theory').innerText() });
  await page.locator('.repair-panel a[href="#practice/' + lesson + '/' + mode + '"]').click();
  await page.locator('#answer-form').waitFor();
  const after = await state(page, lesson, mode);
  check(scenario, 'return-preserves-step-and-draft:' + label,
    before.taskId === after.taskId && before.step === after.step && before.draft === after.draft && same(before.answers, after.answers), after);
  check(scenario, 'help-marked:' + label, after.assisted === true);
}
async function mistake(page, scenario, lesson, mode, value, label) {
  const before = await state(page, lesson, mode);
  await fill(page, value); await page.locator('#submit-answer').click();
  await page.locator('#feedback.bad').waitFor();
  const after = await state(page, lesson, mode);
  check(scenario, 'wrong-answer-blocks-advance:' + label, await page.locator('#next').isDisabled());
  check(scenario, 'wrong-answer-does-not-earn-step:' + label, same(after.answers, before.answers) && !after.done && after.wrong);
  scenario.events.push({ action: 'misconception', label, value, feedback: await page.locator('#feedback').innerText() });
  await useHelpAndReturn(page, scenario, lesson, mode, label);
}
async function reloadDraft(page, scenario, lesson, value, label) {
  await fill(page, value);
  const before = await state(page, lesson);
  const history = await page.locator('#solution-history').innerText();
  await page.reload(); await page.locator('#answer-form').waitFor();
  const after = await state(page, lesson);
  check(scenario, 'reload-preserves-full-session:' + label, same(before, after), after);
  const input = page.locator('#answer');
  const actual = await input.count() ? await input.inputValue() : await page.locator('input[name="answer"]:checked').inputValue();
  check(scenario, 'reload-restores-draft:' + label, actual === value, actual, value);
  check(scenario, 'reload-retains-accepted-history:' + label, history === await page.locator('#solution-history').innerText());
}
async function runPersona(browser, base, persona) {
  if (report.mode === 'baseline' && persona.baselineSteps) persona = { ...persona, steps: persona.baselineSteps };
  const scenario = { id: persona.id, name: persona.name, viewport: persona.width, misconception: persona.misconception,
    repairRule: persona.repairRule, fixture: { task: persona.task, statement: persona.statement }, checks: [], events: [] };
  report.scenarios.push(scenario);
  const context = await browser.newContext({ viewport: { width: persona.width, height: 900 } });
  const page = await context.newPage(); page.setDefaultTimeout(6500);
  page.on('pageerror', error => report.errors.push({ persona: persona.id, message: error.message }));
  page.on('response', response => {
    if (response.status() >= 400 && response.url().startsWith(new URL(base).origin)) report.failedRequests.push({ persona: persona.id, status: response.status(), url: response.url() });
  });
  try {
    await context.addInitScript(({ key, id, taskId }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ version: 1, records: {}, seen: { [taskId]: 1 }, sessions: {
        [id + ':guided']: { taskId, step: 0, wrong: false, assisted: true, familiar: false, done: false, draft: '', answers: [], started: '2026-10-09T00:00:00.000Z', registered: false }
      } }));
    }, { key: KEY, id: persona.lesson, taskId: persona.task });
    await page.goto(base + '#practice/' + persona.lesson + '/guided'); await page.locator('#answer-form').waitFor();
    check(scenario, 'fixture-is-selected', (await state(page, persona.lesson)).taskId === persona.task);
    scenario.events.push({ action: 'visible-condition', text: await page.locator('.task-condition').innerText() });
    if (persona.hasty) {
      for (const input of ['', 'abc', '1/0']) {
        await fill(page, input); await page.locator('#answer').press('Enter');
        const current = await state(page, persona.lesson);
        check(scenario, 'input-not-math-error:' + (input || 'blank'), !current.wrong && current.answers.length === 0 && !current.done, await page.locator('#feedback').innerText());
      }
    }
    for (const [index, answer] of persona.steps.entries()) {
      if (persona.errorStep === index) await mistake(page, scenario, persona.lesson, 'guided', persona.wrong, 'guided-' + index);
      if (index === (persona.resumeStep ?? 1)) await reloadDraft(page, scenario, persona.lesson, answer, 'guided-' + index);
      await accept(page, scenario, answer, 'guided-' + index, Boolean(persona.hasty));
      if (persona.hasty) {
        const before = await state(page, persona.lesson);
        // A second submit event mimics rapid Enter while the accepted input is disabled.
        await page.locator('#answer-form').evaluate(form => form.requestSubmit());
        check(scenario, 'rapid-repeat-submit-is-idempotent:' + index, same(before, await state(page, persona.lesson)));
      }
      await advance(page, Boolean(persona.hasty));
    }
    const hasFinal = await page.locator('#answer-form').count() > 0;
    check(scenario, 'guided-requires-final-answer', persona.finalIsLastListedStep ? !hasFinal && persona.steps.at(-1) === persona.final : hasFinal,
      hasFinal ? await page.locator('.question').innerText() : 'Task already completed after preparatory steps',
      'A final answer must be entered and checked before completion');
    if (hasFinal && !persona.finalIsLastListedStep) {
      check(scenario, 'not-done-before-final', !(await state(page, persona.lesson)).done);
      if (persona.errorStep === 'final') await mistake(page, scenario, persona.lesson, 'guided', persona.wrong, 'final');
      await accept(page, scenario, persona.final, 'guided-final', Boolean(persona.hasty)); await advance(page, Boolean(persona.hasty));
    }
    await page.locator('.result-panel').waitFor();
    check(scenario, 'guided-is-not-independent-credit', (await record(page, persona.lesson)).independent.length === 0);
    check(scenario, 'preparatory-history-remains', await page.locator('#solution-history [data-step]').count() >= persona.steps.length);
    await page.locator('#switch').click(); await page.locator('#answer-form').waitFor();
    for (const [index, task] of persona.independent.entries()) {
      const current = await state(page, persona.lesson, 'independent');
      check(scenario, 'new-condition:' + index, current.taskId === task.task && !current.familiar, current.taskId, task.task);
      if (current.taskId !== task.task) throw Error('Fixture has drifted: expected ' + task.task + ', got ' + current.taskId);
      scenario.events.push({ action: 'independent-condition', task: task.task, text: await page.locator('.task-condition').innerText() });
      if (index === 0) await mistake(page, scenario, persona.lesson, 'independent', task.wrong, 'independent-assisted');
      await accept(page, scenario, task.answer, 'independent-' + index, Boolean(persona.hasty)); await advance(page, Boolean(persona.hasty));
      await page.locator('.result-panel').waitFor();
      const result = await record(page, persona.lesson);
      check(scenario, 'credit-count:' + index, result.independent.length === index, result.independent, index + ' new unassisted successes');
      if (index === 0) check(scenario, 'help-or-error-never-claims-independent', !/Вы решили самостоятельно/.test(await page.locator('main h1').innerText()));
      if (index === 1) check(scenario, 'one-new-answer-does-not-claim-two', !(await page.locator('.result-panel').innerText()).includes('Две новые задачи самостоятельно'));
      const before = await record(page, persona.lesson); await page.reload(); await page.locator('.result-panel').waitFor();
      check(scenario, 'completion-reload-idempotent:' + index, same(before, await record(page, persona.lesson)));
      if (index < persona.independent.length - 1) { await page.locator('#another').click(); await page.locator('#answer-form').waitFor(); }
    }
    // The fourth attempt reuses the known first independent task; no new credit.
    const creditsBeforeRepeat = (await record(page, persona.lesson)).independent;
    await page.locator('#another').click(); await page.locator('#answer-form').waitFor();
    const repeat = await state(page, persona.lesson, 'independent');
    const known = persona.independent.find(task => task.task === repeat.taskId);
    check(scenario, 'repeat-is-labelled-familiar', Boolean(known) && repeat.familiar, repeat.taskId);
    if (!known) throw Error('Unexpected repeated task outside fixture');
    await accept(page, scenario, known.answer, 'known-repeat'); await advance(page); await page.locator('.result-panel').waitFor();
    check(scenario, 'repeat-does-not-increase-independent-credit', same(creditsBeforeRepeat, (await record(page, persona.lesson)).independent));
    check(scenario, 'repeat-is-labelled-training', (await page.locator('.result-panel').innerText()).includes('повтор знакомой задачи'));
    if (report.mode !== 'baseline') check(scenario, 'clean-repeat-has-honest-status',
      (await page.locator('.result-panel').innerText()).includes('Повтор решён без подсказок'));
    scenario.finalRecord = await record(page, persona.lesson);
    await overflow(page, scenario, 'result');
  } catch (error) {
    check(scenario, 'scenario-completes', false, error.message);
    scenario.failureContext = { url: page.url(), text: await page.locator('main').innerText().catch(() => '') };
  } finally { await context.close(); }
  scenario.passed = scenario.checks.every(item => item.passed);
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port + '/ege-profil/start/index.html';
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'] });
  try { for (const persona of fixture.personas) await runPersona(browser, base, persona); }
  finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
  report.sourceChangedDuringRun = Object.entries(report.sourceHashes).filter(([file, before]) =>
    crypto.createHash('sha256').update(fs.readFileSync(sourceFile(path.join(root, 'ege-profil/start', file)))).digest('hex') !== before
  ).map(([file]) => file);
  const checks = report.scenarios.flatMap(scenario => scenario.checks);
  report.summary = { personas: report.scenarios.length, passedPersonas: report.scenarios.filter(scenario => scenario.passed).length,
    checks: checks.length, passedChecks: checks.filter(item => item.passed).length,
    failures: report.scenarios.flatMap(scenario => scenario.checks.filter(item => !item.passed).map(item => ({ persona: scenario.id, ...item }))),
    runtimeErrors: report.errors.length, failedRequests: report.failedRequests.length, sourceDrift: report.sourceChangedDuringRun.length };
  report.passed = report.summary.failures.length === 0 && report.errors.length === 0 && report.failedRequests.length === 0 && report.sourceChangedDuringRun.length === 0;
  report.finishedAt = new Date().toISOString();
  if (process.env.PROFILE_ROBOTS_OUTPUT) fs.writeFileSync(process.env.PROFILE_ROBOTS_OUTPUT, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
