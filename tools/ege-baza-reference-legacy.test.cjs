'use strict';
// Real local controllers and reference UI; no network and no production storage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const tick = () => new Promise(resolve => setTimeout(resolve, 5));
let checks = 0;
function ok(value, message) { assert.ok(value, message); checks++; }
function equal(actual, expected, message) {
 if (expected?.nodeType) assert.equal(actual, expected, message);
 else assert.equal(JSON.stringify(actual), JSON.stringify(expected), message);
 checks++;
}
function boot(file, hash = '', saved = {}, search = '') {
 const errors = [], console = new VirtualConsole();
 console.on('jsdomError', error => errors.push(error.message));
 const dom = new JSDOM(fs.readFileSync(path.join(root, file), 'utf8'), {
  url: 'https://course.test/' + file + search + hash, runScripts: 'outside-only', virtualConsole: console
 });
 const w = dom.window;
 w.scrollTo = () => {};
 w.HTMLElement.prototype.scrollIntoView = () => {};
 w.URL.createObjectURL = () => 'blob:test';
 w.URL.revokeObjectURL = () => {};
 for (const [key, value] of Object.entries(saved)) w.localStorage.setItem(key, value);
 for (const script of w.document.querySelectorAll('script')) {
  const source = script.src ? fs.readFileSync(path.join(root, new URL(script.src).pathname), 'utf8') : script.textContent;
  w.eval(source);
 }
 return { w, d: w.document, errors };
}
async function reveal(b) {
 const help = b.d.querySelector('.ref-help');
 ok(help && !help.open, 'Reference starts closed');
 help.open = true;
 await tick();
 const rule = help.querySelector('.ref-rule');
 ok(rule && !rule.open, 'Rule requires its own request');
 rule.open = true;
 await tick();
 ok(rule.querySelector('.ref-sheet'), 'Real reference card rendered');
 const link = rule.querySelector('.ref-full-link a');
 equal(new URL(link.href).pathname, '/ege-baza/reference/index.html', 'Relative full-reference destination');
 equal(link.target, '_blank', 'Full sheet leaves current task open');
}
(async () => {
 const file = 'trainers/ege-baza/index.html', key = 'ege-baza-21-v1';
 const b = boot(file), tasks = [...b.w.TrainerDebug.tasks];
 equal(tasks.length, 68, 'Legacy task inventory');
 for (const [id, sheets] of [
  ['choice-practice-1', ['tables-choice']],
  ['choice-practice-2', ['tables-choice']],
  ['choice-practice-3', ['decimals', 'ratio']],
  ['choice-practice-4', ['arithmetic']],
  ['rounding-practice-3', ['units', 'decimals']],
  ['rounding-practice-4', ['units', 'decimals']],
  ['percent-practice-4', ['fractions']],
  ['data-practice-3', ['graphs', 'arithmetic']]
 ]) {
  equal(b.w.EgeReferenceLegacy.taskSheets[id], sheets, id + ': rules match the exact condition');
  const pin = b.w.EgeReferenceLegacy.pins.find(item => item.id.endsWith('-' + id));
  equal(pin.sheetIds, sheets, id + ': reverse links use the same exact rules');
 }
 for (const task of tasks) {
  const pin = b.w.EgeReferenceLegacy.pins.find(item => item.id === 'legacy-' + task.id);
  const target = new URL(pin.href, 'https://course.test/ege-baza/reference/');
  equal(target.pathname, '/' + file, task.id + ': pin targets legacy trainer');
  b.w.location.hash = target.hash;
  await tick();
  equal(b.d.querySelector('.qtext').textContent, task.text, task.id + ': exact pin route opens its condition');
  const elements = [...b.d.querySelectorAll('#host .right input, #host .right select')];
  for (const input of elements) {
   if (input.type === 'checkbox') input.checked = true;
   else input.value = input.tagName === 'SELECT' ? '1' : '7/';
   input.dispatchEvent(new b.w.Event('input', { bubbles: true }));
  }
  const values = elements.map(input => [input.value, input.checked]);
  equal(b.w.TrainerDebug.getState().recs[task.id].hints, 0, task.id + ': no automatic help');
  await reveal(b);
  equal(b.w.TrainerDebug.getState().recs[task.id].hints, 1, task.id + ': reference uses normal assistance');
  ok(elements.every(input => input.isConnected), task.id + ': answer controls retained');
  equal(elements.map(input => [input.value, input.checked]), values, task.id + ': drafts retained');
  ok(!b.w.TrainerDebug.getState().recs[task.id].done, task.id + ': no fabricated completion');
 }
 equal(b.errors, [], 'No legacy controller errors');
 b.w.close();

 const direct = boot(file, '#task=p12a');
 ok(direct.d.querySelector('.qtext').textContent.includes('медианы'), 'Exact task pin opens p12a');
 const draft = direct.d.querySelector('#ans');
 draft.value = '7/';
 draft.dispatchEvent(new direct.w.Event('input', { bubbles: true }));
 direct.d.querySelector('[data-a="next"]').click();
 equal(direct.w.location.hash, '#task=p12b', 'Next updates an existing exact-task URL');
 const reloadNext = boot(file, direct.w.location.hash, { [key]: direct.w.localStorage.getItem(key) });
 equal(reloadNext.d.querySelector('.qtext').textContent, tasks.find(task => task.id === 'p12b').text, 'Reload stays on the next task');
 equal(reloadNext.w.TrainerDebug.getState().recs.p12a.ans, '7/', 'Previous draft survives next task and reload');
 reloadNext.w.close();
 direct.d.querySelector('[data-a="prev"]').click();
 equal(direct.w.location.hash, '#task=p12a', 'Back updates the exact-task URL');
 direct.d.querySelector('[data-go="2"]').click();
 equal(direct.w.location.hash, '#task=p12c', 'Task dot updates the exact-task URL');
 direct.d.querySelector('[data-pos="15"]').click();
 equal(direct.w.location.hash, '#task=p15a', 'Changing position updates the exact-task URL');
 direct.d.querySelector('#btnVariant').click();
 equal(direct.w.location.hash, '', 'Assembling a variant clears only the obsolete task fragment');
 const variantText = direct.d.querySelector('.qtext').textContent;
 const reloadVariant = boot(file, '', { [key]: direct.w.localStorage.getItem(key) });
 equal(reloadVariant.w.TrainerDebug.getState().mode, 'variant', 'Reload resumes the assembled variant');
 equal(reloadVariant.d.querySelector('.qtext').textContent, variantText, 'Reload retains the selected variant task');
 equal(reloadVariant.w.TrainerDebug.getState().recs.p12a.ans, '7/', 'Starting a variant retains previous draft records');
 ok(!reloadVariant.d.querySelector('#reference-resume'), 'Reloading own variant needs no task-link guard');
 ok(!reloadVariant.d.querySelector('.ref-help'), 'Reloaded variant still hides learning references');
 reloadVariant.w.close();
 direct.w.close();
 const scoped = boot(file, '#task=p12a', {}, '?lesson=1');
 ok(scoped.w.TrainerDebug.getState().lesson === 1, 'Explicit lesson scope retained');
 ok(scoped.w.TrainerDebug.getState().pos !== 12, 'Task pin cannot escape explicit lesson scope');
 scoped.w.close();

 const built = tasks.filter((t, index) => tasks.findIndex(x => x.pos === t.pos) === index).map(t => t.id);
 const saved = { v: 1, s: { mode: 'variant', pos: 1, cur: { variant: 0 }, built, lesson: null,
  recs: { p1a: { done: false, hints: 0, sol: false, rev: 0, errs: 0, ans: '7/' } } } };
 const protectedRun = boot(file, '#task=p12a', { [key]: JSON.stringify(saved) });
 ok(protectedRun.d.querySelector('#reference-resume'), 'Unfinished variant has a return screen');
 equal(protectedRun.w.TrainerDebug.getState().built, built, 'Variant selection untouched');
 equal(protectedRun.w.TrainerDebug.getState().recs, saved.s.recs, 'Variant work untouched');
 ok(!protectedRun.d.querySelector('.ref-help'), 'No reference in protected variant');
 protectedRun.d.querySelector('#reference-resume').click();
 equal(protectedRun.w.TrainerDebug.getState().mode, 'variant', 'Return resumes variant');
 equal(protectedRun.w.TrainerDebug.getState().recs.p1a.ans, '7/', 'Variant draft survives return');
 ok(!protectedRun.d.querySelector('.ref-help'), 'No reference in assembled variant');
 protectedRun.w.close();

 let practiceCount = 0;
 for (const [directory, apiName, storageKey] of [
  ['course', 'MathExamFoundation', 'mathexam.ege-baza.foundation.v1'],
  ['data-course', 'MathExamData', 'mathexam.ege-baza.data.v1']
 ]) {
  const file = 'trainers/ege-baza/' + directory + '/index.html';
  const start = boot(file), skills = start.w[apiName].SKILLS.map(skill => skill.id);
  const taskData = JSON.parse(JSON.stringify(start.w[apiName].TASKS));
  start.w.close();
  for (const id of skills) {
   const learn = boot(file, '#learn-' + id);
   await reveal(learn);
   equal(learn.errors, [], id + ': learning reference has no errors');
   learn.w.close();
   for (let index = 0; index < 4; index++) {
    const b = boot(file, '#practice-' + id + '-' + index), taskId = id + '-practice-' + (index + 1);
    const input = b.d.querySelector('#answer');
    input.value = '7/';
    await reveal(b);
    equal(b.d.querySelector('#answer'), input, 'Practice input node retained');
    equal(input.value, '7/', 'Incomplete practice draft retained');
    let record = JSON.parse(b.w.localStorage.getItem(storageKey)).practice[taskId];
    equal(record.answer, '7/', 'Draft persisted with assistance');
    ok(record.hints && record.tries === 0 && !record.done, 'Only assistance changes before answer');
    input.value = String(taskData.find(task => task.id === taskId).answer);
    b.d.querySelector('#answer-form').dispatchEvent(new b.w.Event('submit', { bubbles: true, cancelable: true }));
    record = JSON.parse(b.w.localStorage.getItem(storageKey)).practice[taskId];
    ok(record.done && record.hints, 'Correct answer remains assisted');
    ok(b.d.querySelector('.feedback').textContent.includes('с поддержкой'), 'Student sees assisted result');
    equal(b.errors, [], 'No practice runtime errors');
    b.w.close();
    practiceCount++;
   }
  }
  for (const phase of ['diagnostic', 'checkpoint', 'repeat']) {
   const state = { v: 1, practice: {}, runs: { [phase]: { answers: {}, finishedAt: null, helped: false } } };
   if (phase === 'repeat') state.runs.checkpoint = {
    answers: Object.fromEntries(taskData.filter(task => task.phase === 'checkpoint').map(task => [task.id, String(task.answer)])),
    finishedAt: Date.now() - 86400001, helped: false
   };
   const test = boot(file, '#test-' + phase, { [storageKey]: JSON.stringify(state) });
   ok(test.d.querySelector('#answer-form'), 'Checking phase is actually open: ' + phase);
   ok(!test.d.querySelector('.ref-help'), 'Reference absent from checking phase: ' + phase);
   test.w.close();
  }
 }
 equal(practiceCount, 40, 'All legacy practice items checked');
 console.log('EGE_BAZA_REFERENCE_LEGACY_OK: ' + checks + ' assertions; 68 task paths, 10 lessons, 40 practice paths, test isolation and variant preservation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
