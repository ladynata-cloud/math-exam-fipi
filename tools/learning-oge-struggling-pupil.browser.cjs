'use strict';
// Synthetic qualitative pupil simulation, never evidence about a real learner.
// Fixture generation is isolated from robot actions: the robot sees only DOM.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createRequire } = require('node:module');
const ROOT = path.resolve(__dirname, '..');
const express = createRequire(path.join(ROOT, 'board-server/package.json'))('express');
const { LearningStore } = require('../board-server/learning-store');
const { hashPassword } = require('../board-server/learning-auth');
const contracts = require('../board-server/learning-contracts');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright') : 'playwright');
const PASSWORD = '0481', SEED = 1;
const TOPICS = [
  'multiplication-division/long-division-from-simple-to-decimals',
  'multiplication-division/long-division-quotient-digit',
  'multiplication-division/long-division-one-digit',
  'decimal-add-subtract',
  'multiplication-division/multiplication-mixed'
];
const artifacts = process.env.LEARNING_STRUGGLING_ARTIFACTS || path.join(os.tmpdir(), 'learning-struggling-pupil-artifacts');
const expectScaffolds = process.env.LEARNING_ROBOT_BASELINE !== '1';
const reportName = expectScaffolds ? 'regression.json' : 'baseline.json';
const api = (page, route, body) => page.evaluate(async ({ route, body }) => LearningApp.api(route, body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }), { route, body });
const frame = page => page.frameLocator('#trainer-host iframe');
async function ready(page) { await page.locator('#trainer-host iframe').waitFor(); await page.waitForFunction(() => document.querySelector('#trainer-host .frame-status')?.hidden); }
async function saved(page) {
  try { await page.waitForFunction(() => /^(Все изменения сохранены|Сохранено в кабинете)/.test(document.querySelector('#save-state')?.textContent || '')); }
  catch (error) { console.error('SAVE DIAGNOSTIC', await page.locator('#save-state').innerText()); throw error; }
}
async function until(read, predicate, label) {
  const deadline = Date.now() + 20000; let value;
  while (Date.now() < deadline) { value = await read(); if (predicate(value)) return value; await new Promise(resolve => setTimeout(resolve, 80)); }
  throw Error(label + ': ' + JSON.stringify(value));
}
async function visible(page) {
  const f = frame(page);
  return {
    title: await f.locator('.lm-header h1').innerText(),
    labels: await f.locator('.lm-label').allTextContents(),
    prompts: await f.locator('.lm-prompt').allTextContents(),
    feedback: await f.locator('.lm-feedback').allTextContents(),
    controls: await f.locator('button:visible').allTextContents(),
    board: await f.locator('.lm-division,.lm-normalize').allTextContents(),
    scaffolds: await f.locator('.lm-scaffold').allTextContents(),
    basis: await page.locator('[data-support-basis]').allTextContents()
  };
}
// A deliberately fallible policy based only on displayed arithmetic. It never
// receives the generated spec, answer key, API attempt state or database handle.
function mistake(prompts) {
  const text = prompts.join(' ').replace(/\s+/g, ' ');
  if (/первое неполное делимое/.test(text)) return { value: text.match(/\d/)[0], model: 'take-first-digit-even-when-too-small' };
  const current = prompts.at(-1) || prompts[0];
  const subtraction = current.match(/(\d+)\s*[−–-]\s*(\d+)/);
  if (subtraction) return { value: String(Number(subtraction[1]) - Number(subtraction[2]) + 1), model: 'remainder-subtraction-off-by-one' };
  if (/снесём/.test(current)) return { value: '1', model: 'misread-next-digit-including-zero' };
  if (/после сноса/.test(current)) return { value: '0', model: 'forget-remainder-place-shift' };
  const decimal = text.match(/(\d+[,.]\d+)\s*([+−–-])\s*(\d+[,.]\d+)/);
  if (decimal) {
    const left = Number(decimal[1].replace(/[,.]/, '')), right = Number(decimal[3].replace(/[,.]/, ''));
    return { value: String((decimal[2] === '+' ? left + right : left - right) / 10).replace('.', ','), model: 'decimal-place-count-confusion' };
  }
  const fact = text.match(/(\d+)\s*[·×]\s*(\d+)/);
  if (fact) return { value: String(Number(fact[1]) * Number(fact[2]) + Number(fact[1])), model: 'adjacent-multiplication-fact' };
  const division = current.match(/(\d+)\s*[:÷]\s*(\d+)/) || text.match(/(\d+)\s*[:÷]\s*(\d+)/);
  if (division) return { value: String(Math.min(9, Math.floor(Number(division[1]) / Number(division[2])) + 1)), model: 'quotient-digit-one-too-high' };
  return { value: '1', model: 'uncertain-first-step-guess' };
}
async function visibleWorkedAnswer(f) {
  // The result is printed to the learner after an explicit request for help.
  // In particular, this is never spec.answer or a hidden answer attribute.
  const result = (await f.locator('[data-scaffold-result]').allTextContents()).at(-1) || '';
  let match;
  if ((match = result.match(/Цифра частного:\s*(\d+)/))) return { value: match[1], method: 'visible-multiples-comparison' };
  if ((match = result.match(/Запись сейчас:\s*(\d+,?)/))) return { value: match[1], method: 'visible-decimal-boundary' };
  if ((match = result.match(/(?:Первое неполное делимое|Сносим цифру)[: ]+\s*(\d+)/))) return { value: match[1], method: 'visible-current-division-step' };
  if ((match = result.match(/^\d+\s*:\s*\d+\s*=\s*(\d+)/))) return { value: match[1], method: 'visible-group-count' };
  if ((match = result.match(/=\s*(-?\d+(?:[,.]\d+)?)(?:\.|$)/))) return { value: match[1], method: 'visible-worked-arithmetic' };
  if (result && (match = result.match(/\?\s*(\d+(?:[,.]\d+)?)$/))) return { value: match[1], method: 'visible-normalization-step' };
  const feedback = (await f.locator('.lm-feedback.solution').allTextContents()).join(' ');
  if ((match = feedback.match(/Ответ к действию:\s*(\d+(?:[,.]\d+)?[,]?)/))) return { value: match[1], method: 'visible-answer-only-fallback' };
  if ((match = feedback.match(/получаем\s*(\d+(?:[,.]\d+)?)/))) return { value: match[1], method: 'visible-answer-only-fallback' };
  if ((match = feedback.match(/=\s*(\d+(?:[,.]\d+)?)\./))) return { value: match[1], method: 'visible-equation-fallback' };
  return null;
}
async function continueDivision(page, entry) {
  const f = frame(page); entry.continuation = [];
  // Complete every action in the condition actually shown to the learner,
  // including remainder and zero quotient digit when presented.
  for (let index = 0; index < 160 && await f.locator('#lm-answer').count(); index++) {
    const before = await visible(page), record = { before };
    if (index > 0) {
      const wrong = mistake(before.prompts); record.mistake = wrong;
      await f.locator('#lm-answer').fill(wrong.value); await saved(page); await f.locator('#lm-check').click(); await saved(page);
      record.afterMistake = await visible(page);
      if (record.afterMistake.labels.join('|') !== before.labels.join('|')) { record.accidentalCorrect = true; entry.continuation.push(record); continue; }
    }
    await f.locator('#lm-hint').click(); await saved(page); record.hint = await visible(page);
    await f.locator('#lm-solution').click(); await saved(page); record.solution = await visible(page);
    if (expectScaffolds) assert.equal(await f.locator('[data-scaffold="division"]').count(), 1, 'Current division action has concrete optional support: ' + before.prompts.join(' / '));
    const answer = await visibleWorkedAnswer(f); record.readFromVisibleHelp = answer;
    if (!answer) { record.blocked = 'No interpretable answer in visible worked help'; entry.continuation.push(record); break; }
    await f.locator('#lm-answer').fill(answer.value); await saved(page); await f.locator('#lm-check').click(); await saved(page);
    record.afterRecovery = await visible(page); entry.continuation.push(record);
    assert(!record.afterRecovery.feedback.join(' ').includes('Пока не совпало'), 'Answer from the visible worked help must advance the current step');
  }
  entry.completedInVisibleUI = await f.getByRole('heading', { name: /Задание завершено|Все \d+ примера завершены/ }).count() === 1;
  assert(entry.completedInVisibleUI, 'Every action of the displayed division condition was actually completed with visible help');
}
async function main() {
  fs.mkdirSync(artifacts, { recursive: true });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-struggling-pupil-'));
  const filePath = path.join(directory, 'learning.sqlite');
  const store = new LearningStore({ filePath, contracts }); assert(store.available);
  const invitation = store.bootstrap({ name: 'Синтетический преподаватель', login: 'fixture_struggling_teacher' });
  const pupil = store.createStudent(invitation.account, { name: 'Синтетический ученик ОГЭ', login: 'fixture_struggling_pupil' }, await hashPassword(PASSWORD, 'student')).student;
  // Deterministic fixtures are built before the server acquires its exclusive
  // SQLite lock. Answer keys never cross into the DOM-only robot policy.
  for (const contentId of TOPICS) store.newAttempt(pupil.id, invitation.account.id, 'oge-basics', contracts.create('oge-basics', contentId, SEED));
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
  const report = { synthetic: true, realStudentData: false, seed: SEED, profile: { course: 'oge', goal: 'pass' }, viewport: '390x844', policy: 'visible-DOM-only; plausible arithmetic errors, then visible hint and worked help', topics: [] };
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
    await tp.locator('#auth-form [type=submit]').click(); await tp.locator('#recovery-saved').check(); await tp.locator('#done-codes').click(); await tp.locator('#navigation').waitFor();
    await api(tp, '/teacher/students/' + pupil.id + '/profile', { opId: crypto.randomUUID(), expectedVersion: 0, course: 'oge', goal: 'pass', focus: '' });
    await api(tp, '/teacher/students/' + pupil.id + '/plan', { opId: crypto.randomUUID(), items: TOPICS.map((contentId, i) => ({ catalogId: 'oge-basics:' + contentId, reason: 'Синтетический маршрут арифметических основ', priority: i === 0 ? 'high' : 'normal' })), note: 'Роботная проверка, не данные реального ученика' });
    const sp = await open(390);
    await sp.goto(origin + '/learning/#login=' + pupil.login); await sp.locator('#auth-form [name=password]').fill(PASSWORD); await sp.locator('#auth-form [type=submit]').click();
    await sp.locator('#navigation').waitFor();
    for (let i = 0; i < TOPICS.length; i++) {
      await sp.goto(origin + '/learning/#route');
      await sp.getByText('Роботная проверка, не данные реального ученика', { exact: true }).waitFor();
      const routeButton = sp.locator('[data-prep-start="oge-basics:' + TOPICS[i] + '"],[data-route-item="oge-basics:' + TOPICS[i] + '"]').first();
      if (!(await routeButton.isVisible())) await routeButton.locator('xpath=ancestor::details[1]').locator('summary').first().click();
      await sp.locator('[data-prep-start="oge-basics:' + TOPICS[i] + '"]:visible,[data-route-item="oge-basics:' + TOPICS[i] + '"]:visible').first().click();
      try { await ready(sp); } catch (error) { console.error('FRAME DIAGNOSTIC', await sp.locator('#trainer-host').innerText(), pageErrors, await sp.locator('#trainer-host iframe').getAttribute('src')); throw error; } const f = frame(sp);
      const entry = { contentId: TOPICS[i], path: '/learning/#route → managed ' + TOPICS[i], seed: SEED, before: await visible(sp), observations: [] };
      report.topics.push(entry);
      if (i === 0 && expectScaffolds) {
        await f.locator('#lm-answer').fill('2'); await saved(sp);
        await sp.route('**/learning-scaffolds.js*', route => route.abort('failed'));
        await sp.reload(); await ready(sp);
        assert.equal(await f.locator('#lm-answer').inputValue(), '2', 'Optional helper failure preserves the saved draft');
        assert.equal(await f.locator('#lm-answer').isEnabled(), true);
        await f.locator('#lm-check').click(); await saved(sp);
        assert((await f.locator('.lm-feedback').innerText()).includes('Пока не совпало'), 'The original question still accepts an answer without optional help');
        await f.locator('#lm-hint').click(); await saved(sp);
        assert.equal(await f.locator('.lm-scaffold').count(), 0);
        await sp.unroute('**/learning-scaffolds.js*'); await sp.reload(); await ready(sp);
        assert.equal(await f.locator('.lm-scaffold').count(), 1, 'Restoring the helper restores the already saved hint');
        entry.optionalHelperFailure = 'saved draft, enabled input, accepted check, saved hint and normal recovery';
      }
      const wrong = mistake(entry.before.prompts); entry.mistake = wrong;
      if (await f.locator('#lm-answer').count()) await f.locator('#lm-answer').fill(wrong.value);
      else await f.locator('[data-choice]').last().click();
      await saved(sp);
      await f.locator('#lm-check').click(); await saved(sp); entry.afterMistake = await visible(sp);
      await f.locator('#lm-hint').click(); await saved(sp); entry.hint = await visible(sp);
      if (expectScaffolds) assert.equal(await f.locator('.lm-scaffold').count(), 1, 'A hint explains the current arithmetic, not just its answer');
      if (i === 0) {
        const beforeReload = entry.hint;
        await sp.reload(); await ready(sp); await saved(sp);
        const restored = await visible(sp);
        assert.deepEqual(restored.feedback, beforeReload.feedback, 'Reload restores the same optional help and current question');
        assert.deepEqual(restored.prompts, beforeReload.prompts);
        const mirrorAttemptId = new URLSearchParams(new URL(sp.url()).hash.slice(1)).get('attempt');
        const beforeMirror = await api(sp, '/attempts/' + mirrorAttemptId);
        const mirrorWrites = [];
        const watch = request => { if (request.method() === 'POST' && request.url().includes('/attempts/')) mirrorWrites.push(request.url()); };
        tp.on('request', watch); await tp.goto(sp.url()); await ready(tp);
        assert.deepEqual((await visible(tp)).feedback, restored.feedback, 'Teacher sees the same saved help');
        assert.equal(await frame(tp).locator('#lm-answer').isDisabled(), true, 'Teacher mirror is read-only');
        assert.deepEqual(mirrorWrites, [], 'Read-only hydration sends no mutation events'); tp.off('request', watch);
        assert.equal((await api(sp, '/attempts/' + mirrorAttemptId)).version, beforeMirror.version, 'Read-only hydration does not change saved help accounting');
        entry.restorationAndMirror = true;
      }
      await f.locator('#lm-solution').click(); await saved(sp); entry.solution = await visible(sp);
      await sp.screenshot({ path: path.join(artifacts, 'baseline-' + i + '-390.png'), fullPage: true });
      if (TOPICS[i] === 'decimal-add-subtract' && expectScaffolds) {
        assert(entry.solution.scaffolds.join(' ').includes('8 + 4 = 12. Пишем 2, переносим 1'), 'Worked decimal help explains carrying rather than only printing the result');
        await f.locator('.lm-scaffold').screenshot({ path: path.join(artifacts, 'decimal-scaffold-390.png') });
        await sp.setViewportSize({ width: 320, height: 844 });
        await f.locator('.lm-scaffold').screenshot({ path: path.join(artifacts, 'decimal-scaffold-320.png') });
        assert(await f.locator('body').evaluate(node => node.scrollWidth <= innerWidth + 1), 'Help fits the narrow frame; wide tables scroll inside their own wrapper');
        await sp.setViewportSize({ width: 390, height: 844 });
      }
      if (await f.locator('#lm-learn').count()) {
        await f.locator('#lm-learn').click(); await saved(sp);
        entry.lesson = { ...await visible(sp), explanation: await f.locator('.lm-lesson').innerText() };
        await f.locator('#lm-practice').click(); await saved(sp);
      }
      if (i === 0) await continueDivision(sp, entry);
      else {
        await f.locator('#lm-solution').click(); await saved(sp);
        const answer = await visibleWorkedAnswer(f); assert(answer, 'Worked help offers an interpretable next action');
        entry.recoveryFromVisibleHelp = answer;
        await f.locator('#lm-answer').fill(answer.value); await saved(sp); await f.locator('#lm-check').click(); await saved(sp);
        entry.afterRecovery = await visible(sp);
        assert(!entry.afterRecovery.feedback.join(' ').includes('Пока не совпало'), 'Using visible help advances this arithmetic topic');
      }
      const attemptId = new URLSearchParams(new URL(sp.url()).hash.slice(1)).get('attempt');
      const assessment = await api(sp, '/attempts/' + attemptId);
      entry.saved = { seed: assessment.taskSpec.seed, step: assessment.state.step, completed: assessment.state.completed, outcome: assessment.outcome, assistance: assessment.assistance };
      assert(assessment.state.step > 0, 'The pupil actually continued after help');
      if (i === 0) { assert.equal(assessment.state.completed, true); assert.equal(assessment.outcome, 'hinted'); assert(assessment.assistance.hints > 0); }
      console.log(JSON.stringify({ contentId: entry.contentId, seed: SEED, recoveredStep: entry.saved.step, outcome: entry.saved.outcome, restoredAndMirrored: !!entry.restorationAndMirror }));
      fs.writeFileSync(path.join(artifacts, reportName), JSON.stringify(report, null, 2));
    }
    assert.deepEqual(pageErrors, []); report.pageErrors = pageErrors; report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(artifacts, reportName), JSON.stringify(report, null, 2));
    console.log('LEARNING_OGE_STRUGGLING_PUPIL_PASS: ' + report.topics.length + ' topics recovered with visible help; ' + report.topics[0].saved.step + ' division actions completed; synthetic seed ' + SEED + (expectScaffolds ? '; helper fallback, saved help and read-only mirror verified' : '; baseline without scaffolds'));
  } finally {
    fs.writeFileSync(path.join(artifacts, reportName), JSON.stringify(report, null, 2));
    if (browser) await browser.close(); child.kill('SIGTERM'); await new Promise(resolve => trainerServer.close(resolve)); fs.rmSync(directory, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
