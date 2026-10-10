'use strict';
// Qualitative synthetic pupil, not evidence about a real learner. Decisions use
// visible DOM only. The post-topic audit is never passed to the robot policy.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createRequire } = require('node:module');
const ROOT = path.resolve(process.env.LEARNING_ROBOT_ROOT || path.join(__dirname, '..'));
const serverRequire = createRequire(path.join(ROOT, 'board-server/package.json'));
const express = serverRequire('express');
const { LearningStore } = require(path.join(ROOT, 'board-server/learning-store'));
const { hashPassword } = require(path.join(ROOT, 'board-server/learning-auth'));
const contracts = require(path.join(ROOT, 'board-server/learning-contracts'));
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright') : 'playwright');
const PASSWORD = '0481';
const STANDARD = ['oge-basics:order-of-operations', 'oge-basics:fraction-common-denominator',
  'oge-basics:decimal-add-subtract', 'oge-basics:negative-add-subtract', 'oge-basics:percentages/proportion',
  'path:equations-linear', 'path:pre7-grid-area', 'path:grade7-g-angle-addition'];
const artifacts = process.env.LEARNING_STANDARD_ARTIFACTS || path.join(os.tmpdir(), 'learning-standard-route-robot');
const api = (page, route, body) => page.evaluate(async ({ route, body }) => LearningApp.api(route,
  body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }), { route, body });
const frame = page => page.frameLocator('#trainer-host iframe');
async function ready(page) { await page.locator('#trainer-host iframe').waitFor(); await page.waitForFunction(() => document.querySelector('#trainer-host .frame-status')?.hidden); }
async function saved(page) { await page.waitForFunction(() => /^(Все изменения сохранены|Сохранено в кабинете)/.test(document.querySelector('#save-state')?.textContent || '')); }
async function until(read, predicate, label) {
  const deadline = Date.now() + 20000; let value;
  while (Date.now() < deadline) { value = await read(); if (predicate(value)) return value; await new Promise(resolve => setTimeout(resolve, 80)); }
  throw Error(label + ': ' + JSON.stringify(value));
}
async function visible(page) {
  const f = frame(page), managed = await f.locator('.lm-header').count();
  const texts = async selector => f.locator(selector).allTextContents();
  return {
    kind: managed ? 'oge-basics' : 'ege-path',
    title: await f.locator(managed ? '.lm-header h1' : '#main h1').innerText(),
    labels: await texts(managed ? '.lm-label:visible' : '.stage-nav [aria-current]:visible,.callout:visible,.badge:visible'),
    prompts: await texts(managed ? '.lm-prompt:visible' : '.task:visible,#lesson .callout:visible'),
    feedback: await texts(managed ? '.lm-feedback:visible' : '#feedback:visible,#hintText:visible'),
    headings: await texts(managed ? '.lm-card h2:visible' : '#lesson h2:visible'),
    lesson: await texts(managed ? '.lm-lesson:visible,.lm-reference:visible' : '#lesson .lead:visible'),
    support: await texts(managed ? '.lm-scaffold:visible,.lm-division:visible,.lm-normalize:visible' : '.task-support:visible'),
    choices: await texts(managed ? '[data-choice]:visible' : '[data-answer-choice]:visible'),
    controls: await texts('button:visible'),
    fits: await f.locator('body').evaluate(node => node.scrollWidth <= innerWidth + 1)
  };
}
function normalize(text) { return String(text).replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/[÷:]/g, '/').replace(/,/g, '.').replace(/\s+/g, ' ').trim(); }
// A small arithmetic reader, restricted to characters printed in the task. It
// does not execute generated code and cannot access the trainer's answer key.
function arithmetic(text, leftToRight = false) {
  const clean = normalize(text).replace(/\s/g, '');
  if (!clean || !/^[\d.()+*/-]+$/.test(clean)) return null;
  const tokens = clean.match(/\d+(?:\.\d+)?|[()+*/-]/g) || []; let at = 0;
  function atom() { const token = tokens[at++]; if (token === '-') return -atom(); if (token === '+') return atom(); if (token === '(') { const value = expression(); if (tokens[at++] !== ')') throw Error('Unclosed expression'); return value; } if (!/^\d/.test(token || '')) throw Error('Expected number'); return Number(token); }
  function product() { let value = atom(); while (['*', '/'].includes(tokens[at])) { const operator = tokens[at++], next = atom(); value = operator === '*' ? value * next : value / next; } return value; }
  function expression() { let value = leftToRight ? atom() : product(); while ((leftToRight ? ['+', '-', '*', '/'] : ['+', '-']).includes(tokens[at])) { const operator = tokens[at++], next = leftToRight ? atom() : product(); value = operator === '+' ? value + next : operator === '-' ? value - next : operator === '*' ? value * next : value / next; } return value; }
  try { const value = expression(); return at === tokens.length && Number.isFinite(value) ? value : null; } catch (_) { return null; }
}
function numberText(value) { return String(Math.round(value * 1e8) / 1e8).replace('.', ','); }
function wrongAnswer(view) {
  const text = normalize(view.prompts.join(' '));
  const denominators = [...text.matchAll(/\d+\s*\/\s*(\d+)/g)];
  if (/знаменател/.test(text) && denominators.length > 1) return { value: String(Number(denominators[0][1]) + Number(denominators[1][1])), reason: 'Add denominators instead of finding a common multiple' };
  const doubleMinus = text.match(/(\d+)\s*-\s*\(-\s*(\d+)\)/);
  if (doubleMinus) return { value: String(Number(doubleMinus[1]) - Number(doubleMinus[2])), reason: 'Subtract the magnitude and miss the double negative' };
  const percent = text.match(/(\d+)%.*равны\s*(\d+)/);
  if (percent) return { value: numberText(Number(percent[1]) * Number(percent[2]) / 100), reason: 'Take the percentage of the given part instead of recovering the whole' };
  const decimal = text.match(/(\d+\.\d+)\s*([+-])\s*(\d+\.\d+)/);
  if (decimal) return { value: numberText((Number(decimal[1].replace('.', '')) + (decimal[2] === '+' ? 1 : -1) * Number(decimal[3].replace('.', ''))) / 10), reason: 'Unequal decimal places treated as one decimal place' };
  const earlyProduct = text.match(/(\d+)\s*\*\s*(\d+)\s*([+-])\s*(\d+)/);
  if (earlyProduct) return { value: numberText(Number(earlyProduct[1]) * (Number(earlyProduct[2]) + (earlyProduct[3] === '+' ? 1 : -1) * Number(earlyProduct[4]))), reason: 'Do addition or subtraction before an earlier multiplication' };
  const expression = view.prompts.map(p => normalize(p).replace(/^[^\d(+-]*/, '').replace(/[=?.].*$/, '')).find(p => /\d.*[+*-].*\d/.test(p));
  const mistaken = expression ? arithmetic(expression, true) : null;
  if (mistaken !== null) return { value: numberText(mistaken), reason: 'All operations evaluated from left to right' };
  return { value: '1', reason: 'Uncertain first-step guess' };
}
function fromVisibleHelp(view) {
  const help = view.feedback.join(' '), prompts = view.prompts.join(' ');
  const denominator = help.match(/общий знаменатель\s*[—–:=]\s*(\d+)/i);
  if (denominator) return { value: denominator[1], reason: 'Read the common denominator explicitly displayed in the worked help' };
  const shownCalculations = [...help.matchAll(/([−-]?\d+(?:[,.]\d+)?\s*[+−*/·×:]\s*\(?[−-]?\d+(?:[,.]\d+)?\)?)\s*=\s*([−-]?\d+(?:[,.]\d+)?)(?!\d|[xх])/g)]
    .filter(match => arithmetic(match[1]) !== null && Math.abs(arithmetic(match[1]) - Number(match[2].replace(',', '.').replace('−', '-'))) < 1e-7);
  if (view.kind === 'ege-path' && shownCalculations.length) return { value: shownCalculations.at(-1)[2], reason: 'Follow the numeric calculation printed in this step hint' };
  const rectanglePairs = [...normalize(view.prompts[0] || '').matchAll(/(\d+)\s*\*\s*(\d+)\s*клет/g)];
  const question = view.prompts.at(-1) || '';
  if (rectanglePairs.length >= 2 && /площад/.test(question)) {
    const outer = Number(rectanglePairs[0][1]) * Number(rectanglePairs[0][2]), cut = Number(rectanglePairs[1][1]) * Number(rectanglePairs[1][2]);
    if (/целого|большого|до вырезания/.test(question)) return { value: String(outer), reason: 'Use the visible large rectangle dimensions and the step hint' };
    if (/вырезан/.test(question)) return { value: String(cut), reason: 'Use the visible cut-out rectangle dimensions' };
    if (/оставш/.test(question)) return { value: String(outer - cut), reason: 'Subtract the two rectangle areas shown in the task' };
  }
  const literal = help.match(/(?:Ответ к действию|Ответ|Искомое число|Получаем)\s*[:=]\s*([−-]?\d+(?:[,.]\d+)?(?:\s*\/\s*\d+)?)/i);
  if (literal) return { value: literal[1].replace(/\s/g, ''), reason: 'Read explicitly displayed worked answer' };
  const equalities = [...help.matchAll(/=\s*([−-]?\d+(?:[,.]\d+)?(?:\s*\/\s*\d+)?)/g)];
  if (equalities.length) return { value: equalities.at(-1)[1].replace(/\s/g, ''), reason: 'Read the final equality in visible worked help' };
  for (const text of view.prompts.slice().reverse()) {
    const expression = normalize(text).replace(/^[^\d(+-]*/, '').replace(/\s*[=?].*$/, '').replace(/\.$/, '').trim();
    const value = arithmetic(expression);
    if (value !== null) return { value: numberText(value), reason: 'Calculate the arithmetic expression visible in the prompt' };
  }
  const equation = normalize(prompts).match(/([+-]?\d+(?:\.\d+)?)?\s*[xх]\s*([+-])\s*(\d+(?:\.\d+)?)\s*=\s*([+-]?\d+(?:\.\d+)?)/);
  if (equation) return { value: numberText((Number(equation[4]) - (equation[2] === '+' ? 1 : -1) * Number(equation[3])) / Number(equation[1] || 1)), reason: 'Solve the linear equation printed in the prompt' };
  return null;
}
async function answer(page, decision) {
  const f = frame(page), input = f.locator('#lm-answer:visible,#answer:not([type=hidden]):visible');
  if (await input.count()) await input.fill(decision.value);
  else {
    const choices = f.locator('[data-choice]:visible,[data-answer-choice]:visible');
    const labels = await choices.allTextContents();
    const index = labels.findIndex(label => normalize(label) === normalize(decision.value));
    if (index < 0) return false;
    await choices.nth(index).click();
  }
  await saved(page);
  const response = page.waitForResponse(r => /\/api\/learning\/attempts\/[^/]+\/actions$/.test(r.url()) && r.request().method() === 'POST');
  await f.locator('#lm-check:visible,#answerForm button.primary:visible').click();
  assert.equal((await response).status(), 200); await saved(page); return true;
}
function completed(view) { return view.headings.some(text => /(?:Задание завершено|Все \d+ .*проверены|Разбор завершён)/.test(text)) || view.feedback.some(text => /^Верно[!.].*(?:вариант решён|Результат будет сохранён)/.test(text)); }
function signature(view) { return JSON.stringify([view.labels, view.prompts, view.headings]); }
async function attemptTopic(page, entry) {
  const f = frame(page); entry.before = await visible(page); entry.steps = [];
  if (entry.before.kind === 'ege-path' && !(await f.locator('#answerForm').count())) {
    await f.locator('[data-stage="3"]').click(); await saved(page);
  }
  let view = await visible(page), wrong = wrongAnswer(view);
  if (view.choices.length) wrong = { value: view.choices.at(-1), reason: 'Uncertain choice without completing the calculation' };
  entry.mistake = wrong; entry.mistakeSubmitted = await answer(page, wrong); entry.afterMistake = await visible(page);
  if (completed(entry.afterMistake)) { entry.visibleComplete = true; entry.mistakeWasAccepted = true; return; }
  if (entry.before.kind === 'ege-path') {
    if (await f.locator('#explain').count()) await f.locator('#explain').click();
    else await f.locator('[data-stage="2"]').click();
    await saved(page);
  }
  for (let step = 0; step < 24; step++) {
    view = await visible(page);
    if (completed(view)) { entry.visibleComplete = true; return; }
    const observation = { before: view }; entry.steps.push(observation);
    if (await f.locator('#lm-hint:visible,#hint:visible').count()) { await f.locator('#lm-hint:visible,#hint:visible').click(); await saved(page); observation.hint = await visible(page); }
    if (await f.locator('#lm-solution:visible').count()) { await f.locator('#lm-solution').click(); await saved(page); }
    observation.help = await visible(page);
    const decision = fromVisibleHelp(observation.help); observation.decision = decision;
    if (!decision) {
      if (await f.locator('#lm-learn').count()) { await f.locator('#lm-learn').click(); await saved(page); observation.lesson = await visible(page); }
      entry.blocker = 'Visible help did not give this policy a usable next arithmetic step'; return;
    }
    if (!await answer(page, decision)) { entry.blocker = 'Visible answer could not be matched to an available choice'; return; }
    observation.after = await visible(page);
    if (completed(observation.after)) { entry.visibleComplete = true; return; }
    if (signature(observation.after) === signature(view)) { entry.blocker = 'The answer derived from visible help was rejected; no hidden-answer retry'; return; }
  }
  entry.blocker = 'Reached the 24 visible-step observation limit';
}
async function auditAfterTopic(page, entry) {
  // Only called after this example's policy has stopped. The returned metadata
  // is recorded, never read to decide the next answer or whether to retry.
  const attemptId = new URLSearchParams(new URL(page.url()).hash.slice(1)).get('attempt');
  const assessment = await api(page, '/attempts/' + attemptId);
  entry.assessment = { attemptId, seed: assessment.taskSpec.seed, trainerId: assessment.trainerId, contentId: assessment.contentId,
    outcome: assessment.outcome, assistance: assessment.assistance, step: assessment.state.step ?? assessment.state.work?.step,
    completed: assessment.state.completed ?? assessment.state.work?.done };
}
async function main() {
  fs.mkdirSync(artifacts, { recursive: true });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-standard-robot-')), filePath = path.join(directory, 'learning.sqlite');
  const store = new LearningStore({ filePath, contracts }); assert(store.available);
  const invitation = store.bootstrap({ name: 'Синтетический преподаватель', login: 'fixture_standard_teacher' });
  const pupil = store.createStudent(invitation.account, { name: 'Синтетический ученик ОГЭ', login: 'fixture_standard_pupil' }, await hashPassword(PASSWORD, 'student')).student;
  // There are deliberately no attempts and no teacher plan in this fixture.
  store.close();
  const trainer = express(); trainer.use(express.static(ROOT));
  const trainerServer = trainer.listen(0, '127.0.0.1'); await once(trainerServer, 'listening');
  const trainerOrigin = 'http://127.0.0.1:' + trainerServer.address().port;
  const socket = net.createServer(); socket.listen(0, '127.0.0.1'); await once(socket, 'listening');
  const port = socket.address().port; await new Promise(resolve => socket.close(resolve));
  const origin = 'http://127.0.0.1:' + port;
  const child = spawn(process.execPath, ['index.js'], { cwd: path.join(ROOT, 'board-server'), env: {
    PATH: process.env.PATH, NODE_ENV: 'test', HOST: '127.0.0.1', PORT: String(port), LEARNING_DB_PATH: filePath,
    LEARNING_LOCAL_DEV: '1', LEARNING_PUBLIC_ORIGIN: origin, LEARNING_TRAINER_ORIGIN: trainerOrigin,
    GROUP_LESSON_STORE_DIR: path.join(directory, 'group-lessons')
  }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '', browser; const pageErrors = [];
  child.stdout.on('data', value => { log = (log + value).slice(-4000); }); child.stderr.on('data', value => { log = (log + value).slice(-4000); });
  const report = { synthetic: true, realStudentData: false, root: ROOT, profile: { course: 'oge', goal: 'pass' }, customPlan: false,
    seededAttempts: false, viewport: '390x844', policy: 'DOM-only fallible calculation, visible hint/worked-help, bounded continuation; audit never passed to decisions', topics: [] };
  const persist = () => fs.writeFileSync(path.join(artifacts, 'standard-route.json'), JSON.stringify(report, null, 2));
  try {
    await until(async () => { try { return (await fetch(origin + '/api/learning/status')).ok; } catch (_) { if (child.exitCode !== null) throw Error(log); return false; } }, Boolean, 'Server ready');
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    async function open(width) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, locale: 'ru-RU' });
      await context.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort('blockedbyclient'));
      const page = await context.newPage(); page.setDefaultTimeout(15000); page.on('pageerror', error => pageErrors.push(error.message)); return page;
    }
    const tp = await open(1280);
    await tp.goto(origin + '/learning/#invite=' + invitation.invitationToken);
    await tp.locator('#auth-form [name=password]').fill(PASSWORD); await tp.locator('#auth-form [name=confirm]').fill(PASSWORD);
    await tp.locator('#auth-form [type=submit]').click(); await tp.locator('#recovery-saved').check(); await tp.locator('#done-codes').click();
    await tp.locator('#navigation').waitFor();
    await api(tp, '/teacher/students/' + pupil.id + '/profile', { opId: crypto.randomUUID(), expectedVersion: 0, course: 'oge', goal: 'pass', focus: '' });
    const sp = await open(390);
    await sp.goto(origin + '/learning/#login=' + pupil.login); await sp.locator('#auth-form [name=password]').fill(PASSWORD); await sp.locator('#auth-form [type=submit]').click();
    await sp.locator('[data-prep-next] [data-prep-start]').waitFor();
    report.start = { title: await sp.locator('#prep-next-title').innerText(), catalogId: await sp.locator('[data-prep-next] [data-prep-start]').getAttribute('data-prep-start') };
    assert.equal(report.start.catalogId, STANDARD[0], 'The normal home starts the actual default OGE/pass route');
    const initialPlan = await api(sp, '/plan'); assert.deepEqual((initialPlan.plan || initialPlan).items, []);
    assert.equal((await api(sp, '/attempts')).attempts.length, 0);
    for (let index = 0; index < STANDARD.length; index++) {
      const catalogId = STANDARD[index], entry = { catalogId, routeIndex: index + 1 }; report.topics.push(entry);
      if (index === 0) await sp.locator('[data-prep-next] [data-prep-start]').click();
      else {
        await sp.goto(origin + '/learning/#route'); await sp.locator('[data-prep-goal]').waitFor();
        entry.nextSuggested = await sp.locator('[data-prep-next]').innerText();
        let button = sp.locator('[data-prep-start="' + catalogId + '"]:visible').first();
        if (!await button.count()) {
          const hidden = sp.locator('[data-prep-start="' + catalogId + '"]').first();
          if (await hidden.count()) await hidden.locator('xpath=ancestor::details[1]').locator('summary').first().click();
          else {
            await sp.locator('[data-prep-mode="lab"]').click();
            const laboratoryButton = sp.locator('[data-prep-start="' + catalogId + '"]').first();
            if (await laboratoryButton.count()) await laboratoryButton.locator('xpath=ancestor::details[1]').locator('summary').first().click();
          }
          button = sp.locator('[data-prep-start="' + catalogId + '"]:visible').first();
        }
        await button.click();
      }
      await ready(sp); await attemptTopic(sp, entry); await saved(sp);
      await auditAfterTopic(sp, entry);
      await sp.screenshot({ path: path.join(artifacts, 'standard-' + (index + 1) + '-390.png'), fullPage: true });
      if (index === 0 && entry.visibleComplete) {
        entry.freshExamples = [];
        for (let example = 2; example <= 3; example++) {
          const previousHash = new URL(sp.url()).hash;
          await frame(sp).locator('#lm-new').click();
          await sp.waitForFunction(previous => location.hash !== previous, previousHash); await ready(sp);
          const fresh = { example }; entry.freshExamples.push(fresh);
          await attemptTopic(sp, fresh); await saved(sp); await auditAfterTopic(sp, fresh);
          await sp.screenshot({ path: path.join(artifacts, 'standard-1-example-' + example + '-390.png'), fullPage: true });
          if (!fresh.visibleComplete) break;
        }
      }
      console.log(JSON.stringify({ topic: catalogId, seed: entry.assessment.seed, outcome: entry.assessment.outcome, stepsObserved: entry.steps.length, completed: !!entry.visibleComplete, blocker: entry.blocker || null })); persist();
    }
    assert.equal(report.topics.length, 8); assert.deepEqual(pageErrors, []);
    report.pageErrors = pageErrors; report.completedTopics = report.topics.filter(x => x.visibleComplete).length;
    report.blockedTopics = report.topics.filter(x => x.blocker).map(x => ({ catalogId: x.catalogId, blocker: x.blocker }));
    report.finishedAt = new Date().toISOString(); persist();
    console.log('LEARNING_OGE_STANDARD_ROUTE_ROBOT_OBSERVED: all 8 default topics visited; ' + report.completedTopics + ' visibly completed; ' + report.blockedTopics.length + ' blocked; no custom plan or seeded attempts');
  } catch (error) { report.error = error.stack || String(error); persist(); throw error; }
  finally {
    if (browser) await browser.close();
    if (child.exitCode === null && child.signalCode === null) { child.kill('SIGTERM'); await once(child, 'exit'); }
    trainerServer.closeAllConnections(); await new Promise(resolve => trainerServer.close(resolve)); fs.rmSync(directory, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
