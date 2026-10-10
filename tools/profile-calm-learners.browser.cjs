'use strict';

// Four scripted learner profiles. The fixtures contain all responses and their
// visible-statement derivations; this runner never reads production answer keys.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const fixture = require('./fixtures/profile-calm-personas.json');
const root = path.resolve(__dirname, '..');
const KEY = 'mathexam.profileStart2027.v1';
const CHECKPOINT_KEY = 'mathexam.profileCheckpoint.v1';
const cpuThrottlingRate = Math.max(1, Number(process.env.PROFILE_CALM_CPU_RATE) || 1);
const files = fs.readdirSync(path.join(root, 'ege-profil/start')).filter(file => /\.(?:js|css|html)$/.test(file)).sort();
const hashes = () => Object.fromEntries(files.map(file => [file, fs.existsSync(path.join(root, 'ege-profil/start', file))
  ? crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'ege-profil/start', file))).digest('hex') : 'missing']));
const report = { gate: 'PROFILE_CALM_LEARNERS_BROWSER', version: 1, startedAt: new Date().toISOString(),
  scope: fixture.scope, answerPolicy: fixture.answerPolicy, cpuThrottlingRate, sourceHashes: hashes(), personas: [], protocol: [], runtimeErrors: [], failedRequests: [] };
const server = http.createServer((req, res) => {
  try {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://fixture').pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' }[path.extname(file)] || 'text/html');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404).end(); }
});
const UI = {
  practice: { form: '#answer-form', input: '#answer', submit: '#submit-answer', next: '#next', feedback: '#feedback', question: '.question' },
  // These are a small UI contract, agreed with the app owner before execution.
  checkpoint: { start: '#checkpoint-start', form: '#checkpoint-form', input: '#answer', submit: '#checkpoint-submit', next: '#checkpoint-next', result: '#checkpoint-result', condition: '.task-condition' },
  repair: { form: '#answer-form', input: '#answer', submit: '#submit-answer', next: '#next', feedback: '#feedback' }
};
function check(scenario, id, passed, observed, expected) {
  scenario.checks.push({ id, passed: Boolean(passed), ...(observed === undefined ? {} : { observed }), ...(expected === undefined ? {} : { expected }) });
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const earned = records => Object.entries(records).filter(([, r]) => r.attempts || r.guided.length || r.independent.length)
  .sort(([a], [b]) => a.localeCompare(b)).map(([id, r]) => [id, { attempts: r.attempts, guided: [...r.guided].sort(), independent: [...r.independent].sort() }]);
async function saved(page, key = KEY) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)), key); }
async function session(page, id, mode = 'guided') { return (await saved(page)).sessions[id + ':' + mode]; }
async function record(page, id) { return (await saved(page)).records[id] || { guided: [], independent: [], attempts: 0 }; }
async function noOverflow(page, scenario, label) {
  const size = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
  check(scenario, 'no-horizontal-overflow:' + label, size.content <= size.viewport + 1, size);
}
async function input(page, value, ui = UI.practice) {
  const radios = page.locator(ui.form + ' input[name="answer"][type="radio"]');
  if (await radios.count()) {
    const values = await radios.evaluateAll(elements => elements.map(element => element.value));
    const index = values.indexOf(value);
    if (index < 0) throw Error('Fixture choice absent from visible form: ' + value);
    await radios.nth(index).check();
  } else await page.locator(ui.input).fill(value);
}
async function waitForPractice(page, lesson, mode, step) {
  // A hash change is asynchronous, and guided/independent reuse the same form
  // IDs. Seeing #answer-form alone can still mean the old screen is mounted.
  await page.waitForFunction(({ lesson, mode, step }) => {
    const heading = document.querySelector('.practice-head .eyebrow')?.textContent || '';
    const current = document.getElementById('current-step')?.textContent || '';
    const expectedHeading = { guided: 'Решаем по шагам', plan: 'Решаем с коротким планом', independent: 'Решаем самостоятельно' }[mode];
    return location.hash === '#practice/' + lesson + '/' + mode && document.getElementById('answer-form') &&
      heading.includes(expectedHeading) && (mode === 'guided' ? current.startsWith('Шаг ' + (step === undefined ? '' : (step + 1) + ' ')) : current === 'Ваше решение');
  }, { lesson, mode, step });
}
async function accept(page, scenario, value, label, ui = UI.practice) {
  await input(page, value, ui);
  const radios = page.locator(ui.form + ' input[name="answer"][type="radio"]');
  const echoed = await radios.count() ? await page.locator(ui.form + ' input[name="answer"]:checked').inputValue() : await page.locator(ui.input).inputValue();
  if (echoed !== value) throw Error('Input changed before submit at ' + label + ': expected ' + value + ', visible ' + echoed);
  await page.locator(ui.submit).click();
  await page.locator(ui.feedback + '.good').waitFor();
  check(scenario, 'answer-accepted:' + label, await page.locator(ui.next).isEnabled());
  scenario.events.push({ action: 'answer', label, value });
}
async function startPage(browser, base, persona, mode = 'guided') {
  const context = await browser.newContext({ viewport: { width: persona.width, height: 900 } });
  const page = await context.newPage(); page.setDefaultTimeout(6000);
  if (cpuThrottlingRate > 1) {
    const client = await context.newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottlingRate });
  }
  page.on('pageerror', error => report.runtimeErrors.push({ persona: persona.id, message: error.message }));
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(new URL(base).origin)) report.failedRequests.push({ persona: persona.id, status: response.status(), path: new URL(response.url()).pathname }); });
  if (persona.task) await context.addInitScript(({ key, lesson, task, mode }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ version: 1, records: {}, seen: { [task]: 1 }, sessions: {
      [lesson + ':' + mode]: { taskId: task, step: 0, wrong: false, assisted: mode === 'guided', familiar: false, done: false, draft: '', answers: [], started: '2026-10-09T00:00:00.000Z', registered: false }
    } }));
  }, { key: KEY, lesson: persona.lesson, task: persona.task, mode });
  await page.goto(base + (persona.task ? '#practice/' + persona.lesson + '/' + mode : '#calm'));
  await page.locator('main h1').waitFor();
  if (persona.task) await waitForPractice(page, persona.lesson, mode, mode === 'guided' ? 0 : undefined);
  return { context, page };
}
async function scenario(browser, base, persona, mode, run) {
  const out = { id: persona.id, name: persona.name, viewport: persona.width, checks: [], events: [] }; report.personas.push(out);
  let context, page;
  try {
    ({ context, page } = await startPage(browser, base, persona, mode));
    await run(page, out, persona); await noOverflow(page, out, 'final');
  } catch (error) {
    check(out, 'scenario-completes', false, error.message);
    if (page) out.failureContext = { hash: new URL(page.url()).hash, text: await page.locator('main').innerText().catch(() => '') };
  } finally { if (context) await context.close(); }
  out.passed = out.checks.every(item => item.passed);
}
async function toggleCalm(page, out, label) {
  const toggle = page.locator('#calm-toggle'); await toggle.waitFor();
  const before = await toggle.getAttribute('aria-pressed');
  await toggle.click();
  const after = await page.locator('#calm-toggle').getAttribute('aria-pressed');
  check(out, 'calm-toggle-announces-state:' + label, ['true', 'false'].includes(after) && before !== after, { before, after });
  return after;
}

async function pauseLearner(page, out, p) {
  await accept(page, out, p.steps[0], 'first-step'); await page.locator('#next').click();
  await input(page, p.unfinishedDraft);
  const before = await session(page, p.lesson), history = await page.locator('#solution-history [data-step] strong').allInnerTexts();
  const calm = await toggleCalm(page, out, 'paused');
  check(out, 'visual-mode-does-not-change-work', same(before, await session(page, p.lesson)));
  await page.locator('#pause-practice').click(); await page.locator('main a[href="#practice/' + p.lesson + '/guided"]').waitFor();
  await page.reload(); await page.locator('main a[href="#practice/' + p.lesson + '/guided"]').click(); await waitForPractice(page, p.lesson, 'guided', before.step);
  check(out, 'reload-preserves-session', same(before, await session(page, p.lesson)));
  check(out, 'reload-restores-unfinished-draft', await page.locator('#answer').inputValue() === p.unfinishedDraft);
  check(out, 'reload-restores-calm-setting', await page.locator('#calm-toggle').getAttribute('aria-pressed') === calm);
  check(out, 'accepted-history-visible', same(await page.locator('#solution-history [data-step] strong').allInnerTexts(), history) && await page.locator('#solution-history').isVisible());
  check(out, 'unfinished-step-cannot-advance', await page.locator('#next').isDisabled());
  for (let i = 1; i < p.steps.length; i++) { await accept(page, out, p.steps[i], 'step-' + i); await noOverflow(page, out, 'step-' + i); await page.locator('#next').click(); }
  await page.locator('.result-panel').waitFor();
  check(out, 'guided-is-not-independent', (await record(page, p.lesson)).independent.length === 0);
}
async function intermediateLearner(page, out, p) {
  await toggleCalm(page, out, 'micro-support');
  for (let i = 0; i < p.steps.length; i++) {
    check(out, 'one-current-question:' + i, await page.locator('.current-question').count() === 1);
    if (i === p.errorStep) {
      await input(page, p.wrong); await page.locator('#submit-answer').click(); await page.locator('#feedback.bad').waitFor();
      check(out, 'final-value-rejected-for-intermediate-goal', await page.locator('#next').isDisabled() && (await session(page, p.lesson)).answers.length === i);
      await page.locator('#hint').click(); check(out, 'current-question-hint-visible', await page.locator('#hint-box').isVisible());
      await page.locator('#micro-start').click();
      await page.locator('#micro-answer').selectOption({ label: p.microWrong }); await page.locator('#micro-form button[type="submit"]').click();
      check(out, 'wrong-meaning-of-x-rejected', (await page.locator('#micro-feedback').innerText()).length > 0 && await page.locator('.micro-support li').count() === 0);
      for (let micro = 0; micro < p.microSteps.length; micro++) {
        check(out, 'one-visible-form-during-micro:' + micro, await page.locator('#micro-form:visible, #answer-form:visible').count() === 1);
        const control = page.locator('#micro-answer');
        if (await control.evaluate(el => el.tagName) === 'SELECT') await control.selectOption({ label: p.microSteps[micro] });
        else {
          await control.fill('43'); await page.reload(); await page.locator('#micro-form').waitFor();
          check(out, 'micro-draft-restored-after-reload', await page.locator('#micro-answer').inputValue() === '43');
          check(out, 'accepted-micro-history-restored', await page.locator('.micro-support li').count() === micro);
          await page.locator('#micro-answer').fill(p.microSteps[micro]);
        }
        await page.locator('#micro-form button[type="submit"]').click();
        check(out, 'micro-does-not-earn-main-step:' + micro, (await session(page, p.lesson)).answers.length === 0 && (await session(page, p.lesson)).step === 0);
        check(out, 'micro-retains-earlier-actions:' + micro, await page.locator('.micro-support li').count() === micro + 1);
        out.events.push({ action: 'micro-answer', micro: micro + 1, value: p.microSteps[micro] });
      }
      check(out, 'main-answer-required-after-micro', await page.locator('#answer-form').isVisible() && await page.locator('#next').isDisabled());
    }
    await accept(page, out, p.steps[i], 'step-' + i);
    check(out, 'checking-does-not-skip-step:' + i, (await session(page, p.lesson)).step === i);
    check(out, 'all-earned-history-remains:' + i, await page.locator('#solution-history [data-step]').count() === i + 1);
    await page.locator('#next').click();
  }
  await page.locator('.result-panel').waitFor();
  check(out, 'final-requested-answer-recorded', (await session(page, p.lesson)).answers.at(-1) === p.steps.at(-1));
  check(out, 'wrong-and-help-not-independent', (await record(page, p.lesson)).independent.length === 0);
}
async function exampleLearner(page, out, p) {
  await input(page, p.unfinishedDraft);
  const original = await session(page, p.lesson, 'independent');
  const beforeExampleSeen = (await saved(page)).seen, beforeExampleRecord = await record(page, p.lesson);
  await toggleCalm(page, out, 'independent');
  check(out, 'calm-setting-alone-is-not-help', !(await session(page, p.lesson, 'independent')).assisted);
  await page.locator('main a[href="#lesson/' + p.lesson + '"]').first().click();
  await page.locator('main a[href="#example/' + p.lesson + '"]').first().click(); await page.locator('#worked-example').waitFor();
  check(out, 'worked-example-opens-one-step', await page.locator('#worked-example [data-example-step]').count() === 1);
  const exampleHistory = await page.locator('#worked-example [data-example-step]').allInnerTexts();
  while (await page.locator('#example-next').count()) {
    await page.locator('#example-next').click();
    const texts = await page.locator('#worked-example [data-example-step]').allInnerTexts();
    check(out, 'worked-example-adds-one-step:' + texts.length, texts.length === exampleHistory.length + 1 && same(texts.slice(0, -1), exampleHistory));
    exampleHistory.push(texts.at(-1));
  }
  check(out, 'worked-example-retains-three-derivations-and-answer', exampleHistory.length === 4 && /Ответ:/u.test(exampleHistory.at(-1)));
  check(out, 'example-marks-independent-assisted', (await session(page, p.lesson, 'independent')).assisted);
  check(out, 'example-does-not-replace-independent-condition', (await session(page, p.lesson, 'independent')).taskId === p.task);
  check(out, 'example-does-not-add-independent-credit', (await record(page, p.lesson)).independent.length === 0);
  check(out, 'viewing-example-does-not-count-as-solved', same(beforeExampleRecord, await record(page, p.lesson)));
  const afterExampleSeen = (await saved(page)).seen;
  const exposedByExample = Object.keys(afterExampleSeen).filter(id => !beforeExampleSeen[id]);
  check(out, 'example-keeps-reserved-conditions-unseen', exposedByExample.every(id => ['trig-angle-1', 'trig-angle-2', 'trig-angle-3'].includes(id)), exposedByExample);
  out.events.push({ action: 'worked-example', text: await page.locator('main').innerText() });
  await page.locator('#example-practice').click(); await waitForPractice(page, p.lesson, 'guided', 0);
  check(out, 'sample-to-different-guided-condition', (await session(page, p.lesson)).taskId === p.stagePath.guidedTask);
  for (const [i, value] of p.stagePath.guidedSteps.entries()) { await accept(page, out, value, 'stage-guided-' + i); await page.locator('#next').click(); }
  await page.locator('.result-panel').waitFor(); await page.locator('#switch').click(); await waitForPractice(page, p.lesson, 'plan');
  check(out, 'guided-to-short-plan', new URL(page.url()).hash.endsWith('/plan') && await page.locator('.plan-support').isVisible());
  check(out, 'short-plan-uses-another-condition', (await session(page, p.lesson, 'plan')).taskId === p.stagePath.planTask);
  await accept(page, out, p.stagePath.planAnswer, 'stage-plan'); await page.locator('#next').click(); await page.locator('.result-panel').waitFor();
  check(out, 'short-plan-does-not-earn-independent', (await record(page, p.lesson)).independent.length === 0);
  await page.locator('#switch').click(); await waitForPractice(page, p.lesson, 'independent');
  check(out, 'plan-to-independent', new URL(page.url()).hash.endsWith('/independent'));
  check(out, 'example-return-restores-draft', await page.locator('#answer').inputValue() === original.draft);
  await page.locator('.support-details summary').click(); await page.locator('#repair-current').click(); await waitForPractice(page, p.lesson, 'guided', 0);
  const condition = await page.locator('main').innerText();
  check(out, 'repair-keeps-same-condition', condition.includes('210') && (await session(page, p.lesson, 'independent')).taskId === p.task);
  for (let i = 0; i < p.sameTaskSteps.length; i++) {
    if (i === 1) {
      await input(page, p.sameTaskSteps[i], UI.repair); await page.reload(); await waitForPractice(page, p.lesson, 'guided', i);
      check(out, 'repair-draft-survives-reload', await page.locator(UI.repair.input).inputValue() === p.sameTaskSteps[i]);
    }
    await accept(page, out, p.sameTaskSteps[i], 'same-condition-' + i, UI.repair); await page.locator(UI.repair.next).click();
  }
  await page.locator('main a[href="#practice/' + p.lesson + '/independent"]').first().click(); await waitForPractice(page, p.lesson, 'independent');
  check(out, 'repair-return-restores-original-draft', await page.locator('#answer').inputValue() === original.draft);
  check(out, 'repair-preserves-help-mark', (await session(page, p.lesson, 'independent')).assisted);
  await accept(page, out, p.answer, 'assisted-independent'); await page.locator('#next').click(); await page.locator('.result-panel').waitFor();
  check(out, 'assisted-completion-is-not-independent', (await record(page, p.lesson)).independent.length === 0);
  await page.locator('#another').click(); await page.locator('#answer-form').waitFor();
  check(out, 'next-condition-is-new', (await session(page, p.lesson, 'independent')).taskId === p.newTask && !(await session(page, p.lesson, 'independent')).familiar);
  await accept(page, out, p.newAnswer, 'later-new-condition'); await page.locator('#next').click(); await page.locator('.result-panel').waitFor();
  check(out, 'later-new-condition-can-earn-practice-credit', same((await record(page, p.lesson)).independent, [p.newTask]));
}

async function enterCheckpoint(page) {
  await page.goto(page.url().split('#')[0] + '#checkpoint'); await page.locator('main h1').waitFor();
  if (await page.locator(UI.checkpoint.start).count()) await page.locator(UI.checkpoint.start).click();
  await page.locator(UI.checkpoint.form).waitFor();
}
async function transferLearner(page, out, p) {
  check(out, 'thirteen-calm-cards', await page.locator('main a[href^="#calm/"]').count() === 13);
  await enterCheckpoint(page);
  const beforeRecords = (await saved(page)).records;
  for (let i = 0; i < p.items.length; i++) {
    const item = p.items[i], state = await saved(page, CHECKPOINT_KEY), current = state.round.items[state.round.index];
    check(out, 'mixed-position-and-fixture:' + i, state.round.index === i && current.number === item.number && current.taskId === item.task, { slot: state.round.index, number: current.number, task: current.taskId });
    check(out, 'no-practice-hint-or-repair:' + i, await page.locator('#hint:visible, #repair:visible, #repair-task:visible').count() === 0);
    const headings = (await page.locator('main h1, main h2, main h3, main .breadcrumb, main .eyebrow').allInnerTexts()).join(' ');
    check(out, 'neutral-heading:' + i, !/Планиметрия|Векторы|Стереометрия|Вероятность|Уравнение|Косинус|Производная|Функции|Проценты/i.test(headings), headings);
    if (i === 0) for (const invalid of ['', 'abc', '1/0']) {
      await page.locator(UI.checkpoint.input).fill(invalid); await page.locator(UI.checkpoint.submit).click();
      check(out, 'invalid-input-does-not-use-attempt:' + (invalid || 'blank'), !(await saved(page, CHECKPOINT_KEY)).round.items[0].submitted);
    }
    const value = item.firstAnswer || item.answer;
    await page.locator(UI.checkpoint.input).fill(value);
    if (i === 3) {
      const before = await saved(page, CHECKPOINT_KEY); await page.locator('#checkpoint-pause').click();
      await page.locator('main a[href="#checkpoint"]').waitFor(); await page.reload();
      await page.locator('main a[href="#checkpoint"]').click(); await page.locator(UI.checkpoint.form).waitFor();
      check(out, 'checkpoint-pause-restores-exact-state', same(before, await saved(page, CHECKPOINT_KEY)));
      check(out, 'checkpoint-pause-restores-draft', await page.locator(UI.checkpoint.input).inputValue() === value);
    }
    await page.locator(UI.checkpoint.submit).click();
    const accepted = await saved(page, CHECKPOINT_KEY);
    check(out, 'one-valid-answer-locked:' + i, accepted.round.items[i].submitted && await page.locator(UI.checkpoint.submit).isDisabled());
    await page.locator(UI.checkpoint.form).evaluate(form => form.requestSubmit());
    check(out, 'repeat-submit-cannot-change-response:' + i, same(accepted, await saved(page, CHECKPOINT_KEY)));
    out.events.push({ action: 'strict-response', slot: i + 1, task: item.task, submitted: value, derivation: item.rule });
    await noOverflow(page, out, 'checkpoint-' + i); await page.locator(UI.checkpoint.next).click();
  }
  await page.locator(UI.checkpoint.result).waitFor();
  const final = await saved(page, CHECKPOINT_KEY), entries = final.round.items;
  const summary = { attempted: entries.filter(item => item.submitted).length, independent: entries.filter(item => item.submitted && item.correct && !item.assisted && !item.unavailable).length,
    assisted: entries.filter(item => item.assisted).length, unavailable: entries.filter(item => item.unavailable).length, total: entries.length };
  check(out, 'strict-score-is-twelve-of-thirteen', same(summary, p.expectedResult), summary, p.expectedResult);
  check(out, 'strict-result-does-not-inflate-lesson-records', same(earned(beforeRecords), earned((await saved(page)).records)), earned((await saved(page)).records), earned(beforeRecords));
  await page.reload(); await page.locator(UI.checkpoint.result).waitFor();
  check(out, 'completed-checkpoint-reload-idempotent', same(final, await saved(page, CHECKPOINT_KEY)));
  out.strictSummary = summary;
}
async function checkpointHelpProtocol(browser, base) {
  const out = { checks: [], events: [] };
  let context;
  try {
    const created = await startPage(browser, base, { id: 'checkpoint-help-protocol', width: 360 }, null);
    context = created.context; const page = created.page; await enterCheckpoint(page);
    await page.locator('#checkpoint-help').click(); await waitForPractice(page, 'prob-count', 'guided', 0);
    let current = (await saved(page, CHECKPOINT_KEY)).round.items[0];
    check(out, 'checkpoint-help-marks-current-condition-assisted', current.assisted && !current.submitted);
    check(out, 'checkpoint-repair-retains-exact-task', (await session(page, 'prob-count')).taskId === 'prob-count-4');
    await page.locator('main a[href="#checkpoint"]').first().click(); await page.locator(UI.checkpoint.form).waitFor();
    await page.locator(UI.checkpoint.input).fill('2/5'); await page.locator(UI.checkpoint.submit).click();
    current = (await saved(page, CHECKPOINT_KEY)).round.items[0];
    check(out, 'correct-answer-after-checkpoint-help-is-assisted', current.submitted && current.correct && current.assisted);
    check(out, 'checkpoint-help-cannot-create-lesson-independent-credit', Object.values((await saved(page)).records).every(record => record.independent.length === 0));
  } catch (error) { check(out, 'checkpoint-help-protocol-completes', false, error.message); }
  finally { if (context) await context.close(); }
  report.protocol.push(...out.checks);
}
async function checkpointMultitabProtocol(browser, base) {
  const out = { checks: [], events: [] }; let context;
  try {
    const created = await startPage(browser, base, { id: 'checkpoint-multitab-protocol', width: 1280 }, null);
    context = created.context; const a = created.page; await enterCheckpoint(a);
    const b = await context.newPage(); b.setDefaultTimeout(6000);
    b.on('pageerror', error => report.runtimeErrors.push({ persona: 'checkpoint-multitab-protocol', message: error.message }));
    await b.goto(base + '#checkpoint'); await b.locator(UI.checkpoint.form).waitFor();
    await b.locator(UI.checkpoint.input).fill('2/5'); await b.locator(UI.checkpoint.submit).click(); await b.locator(UI.checkpoint.next).click();
    await a.locator(UI.checkpoint.input).fill('999'); await a.locator(UI.checkpoint.form).waitFor();
    let savedRound = (await saved(a, CHECKPOINT_KEY)).round, current = savedRound.items[savedRound.index];
    check(out, 'stale-tab-input-does-not-write-to-new-item', savedRound.index === 1 && current.taskId === 'eq-linear-4' && current.draft === '' && !current.submitted, current);
    check(out, 'stale-tab-input-refreshes-visible-condition', (await a.locator('.task-condition').innerText()).includes('9x'));
    const staleForm = await a.locator(UI.checkpoint.form).elementHandle();
    await b.locator(UI.checkpoint.input).fill('2'); await b.locator(UI.checkpoint.submit).click(); await b.locator(UI.checkpoint.next).click();
    await staleForm.evaluate(form => form.requestSubmit()); await a.locator(UI.checkpoint.form).waitFor();
    savedRound = (await saved(a, CHECKPOINT_KEY)).round; current = savedRound.items[savedRound.index];
    check(out, 'stale-tab-submit-does-not-submit-new-item', savedRound.index === 2 && current.taskId === 'geo-right-cosine' && current.draft === '' && !current.submitted, current);
    const displayedAfterStaleSubmit = await a.locator('.task-condition').innerText();
    check(out, 'stale-tab-submit-refreshes-visible-condition', displayedAfterStaleSubmit.includes('гипотенуз'), displayedAfterStaleSubmit);
    check(out, 'other-tab-accepted-answers-are-preserved', savedRound.items[0].draft === '2/5' && savedRound.items[0].correct && savedRound.items[1].draft === '2' && savedRound.items[1].correct);
  } catch (error) { check(out, 'checkpoint-multitab-protocol-completes', false, error.message); }
  finally { if (context) await context.close(); }
  report.protocol.push(...out.checks);
}
async function guidedMultitabProtocol(browser, base) {
  const out = { checks: [], events: [] }; let context;
  try {
    const p = { ...fixture.personas[0], id: 'guided-multitab-protocol', width: 1280 };
    const created = await startPage(browser, base, p, 'guided'); context = created.context; const a = created.page;
    await a.locator('#answer').fill('2/3'); const staleForm = await a.locator('#answer-form').elementHandle();
    const b = await context.newPage(); b.setDefaultTimeout(6000);
    b.on('pageerror', error => report.runtimeErrors.push({ persona: p.id, message: error.message }));
    await b.goto(base + '#practice/trig-angle/guided'); await b.locator('#answer-form').waitFor();
    await b.locator('#submit-answer').click(); await b.locator('#feedback.good').waitFor(); await b.locator('#next').click();
    await staleForm.evaluate(form => form.requestSubmit());
    const current = await session(a, p.lesson);
    check(out, 'guided-stale-answer-cannot-become-next-step-answer', current.step === 1 && current.answers.length === 1 && current.answers[0] === '2/3' && !current.done, current);
    await a.reload(); await a.locator('#answer-form').waitFor();
    check(out, 'guided-other-tab-step-restores-correctly', (await session(a, p.lesson)).step === 1 && await a.locator('#solution-history [data-step]').count() === 1);
  } catch (error) { check(out, 'guided-multitab-protocol-completes', false, error.message); }
  finally { if (context) await context.close(); }
  report.protocol.push(...out.checks);
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port + '/ege-profil/start/index.html';
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox'] });
  try {
    await scenario(browser, base, fixture.personas[0], 'guided', pauseLearner);
    await scenario(browser, base, fixture.personas[1], 'guided', intermediateLearner);
    await scenario(browser, base, fixture.personas[2], 'independent', exampleLearner);
    await scenario(browser, base, fixture.personas[3], null, transferLearner);
    await checkpointHelpProtocol(browser, base);
    await checkpointMultitabProtocol(browser, base);
    await guidedMultitabProtocol(browser, base);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
  const after = hashes(); report.sourceChangedDuringRun = files.filter(file => after[file] !== report.sourceHashes[file]);
  const checks = report.personas.flatMap(persona => persona.checks).concat(report.protocol);
  report.summary = { personas: report.personas.length, passedPersonas: report.personas.filter(persona => persona.passed).length, checks: checks.length,
    passedChecks: checks.filter(item => item.passed).length, failures: report.personas.flatMap(persona => persona.checks.filter(item => !item.passed).map(item => ({ persona: persona.id, ...item }))).concat(report.protocol.filter(item => !item.passed).map(item => ({ protocol: true, ...item }))),
    runtimeErrors: report.runtimeErrors.length, failedRequests: report.failedRequests.length, sourceDrift: report.sourceChangedDuringRun.length };
  report.passed = report.summary.failures.length === 0 && report.summary.runtimeErrors === 0 && report.summary.failedRequests === 0 && report.summary.sourceDrift === 0;
  report.finishedAt = new Date().toISOString();
  if (process.env.PROFILE_CALM_OUTPUT) fs.writeFileSync(process.env.PROFILE_CALM_OUTPUT, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2)); if (!report.passed) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
