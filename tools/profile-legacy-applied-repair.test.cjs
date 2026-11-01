'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const KEY = 'mathExamCourseProgress.v1';
async function page(name, query = '', saved = null) {
  const html = fs.readFileSync(path.join(__dirname, '../ege-profil/trainers', name + '.html'), 'utf8');
  const dom = new JSDOM(html, {url:'https://mathexam.space/ege-profil/trainers/' + name + '.html' + query, runScripts:'outside-only'});
  const w = dom.window;
  await new Promise(resolve => w.document.addEventListener('DOMContentLoaded', resolve, {once:true}));
  if (saved) w.localStorage.setItem(KEY, JSON.stringify(saved));
  let serial = 0;
  const timers = new Map();
  w.setTimeout = fn => { timers.set(++serial, fn); return serial; };
  w.clearTimeout = id => timers.delete(id);
  w.Math.random = () => 0;
  for (const script of w.document.querySelectorAll('script:not([src])')) w.eval(script.textContent);
  if (name === 'finance') w.init();
  return {w, dom, timers, runTimer() {const [id, fn] = timers.entries().next().value || []; assert(fn, 'a pending transition'); timers.delete(id); fn();}, close:() => dom.window.close()};
}
function input(w, id, value) {const el = w.document.getElementById(id); assert(el, id); el.value = String(value); return el;}
function final(w, id, value) {w.selectTask(id); input(w, 'finalAnswerInput', value); w.handleFinalAnswer(); return !!w.document.querySelector('.final-answer-row .opt-formula');}
function progress(w, name = 'financeNonstandardTrainer') {return JSON.parse(w.localStorage.getItem(KEY) || '{}')[name];}

test('L1: an independent annual ledger closes with a=160, b=100, debt=500 and total=2580', async () => {
  const p = await page('finance'); const {w} = p;
  try {
    const solutions = [];
    for (let a = 1; a < 260; a++) {
      const b = (1300 - 5*a)/5; let debt = 1300, total = 0, midpoint;
      for (let year = 1; year <= 10; year++) {const reduction = year <= 5 ? a : b; total += debt/5 + reduction; debt -= reduction; if (year === 5) midpoint = debt;}
      if (Math.abs(total - 2580) < 1e-9 && Math.abs(debt) < 1e-9) solutions.push({a,b,midpoint});
    }
    assert.deepEqual(solutions, [{a:160,b:100,midpoint:500}]);
    assert.equal(w.getTask('L1').steps[2].answer, 160);
    assert.equal(final(w, 'L1', 300), false);
    assert.equal(final(w, 'L1', 500), true);
    assert.match(w.getTask('L1').summary, /a = 160, b = 100/);
  } finally {p.close();}
});

test('I1: payments are February–July and penalties use the February and May obligations', async () => {
  const p = await page('finance'); const {w} = p;
  try {
    let debt = 1000, total = 0; const payments = [];
    [700,500,300,200,100,0].forEach((after, i) => {const month = i + 2, payment = debt + debt/10 - after; const days = month === 2 ? 5 : month === 5 ? 9 : 0; total += payment*(1 + 0.03*days); payments.push(payment); debt = after;});
    assert.deepEqual(payments, [400,270,250,130,120,110]);
    assert.ok(Math.abs(total - 1000 - 375.1) < 1e-9);
    assert.deepEqual(Array.from(w.getTask('I1').table.rows, row => row[0]), ['Февраль','Март','Апрель','Май','Июнь','Июль']);
    assert.equal(final(w, 'I1', '352,9'), false);
    assert.equal(final(w, 'I1', '375,1'), true);
    w.selectTask('I1');
    assert.deepEqual(Array.from(w.document.querySelectorAll('.hidden-cell'), el => el.textContent), ['?','?']);
  } finally {p.close();}
});

test('numeric answers reject suffixes, expressions, infinity, malformed grouping and generous monetary tolerances', async () => {
  const p = await page('finance'); const {w} = p;
  try {
    for (const bad of ['10/2','10abc','10%','1 0','1e1','0xA','Infinity','']) assert.equal(final(w, 'A1', bad), false, bad);
    assert.equal(final(w, 'A1', '10,00'), true);
    assert.equal(final(w, 'B1', '10'), false);
    assert.equal(final(w, 'B1', '11'), true);
    assert.ok(1.13**2*1.10 < 1.12**3 && 1.13**2*1.11 > 1.12**3);
    assert.match(w.getTask('B1').finalEquation, /128028\/12769/);
    assert.equal(final(w, 'J1', '19820'), false);
    assert.equal(final(w, 'J1', '19720.01'), false);
    assert.equal(final(w, 'J1', '19 720'), true);
    assert.equal(final(w, 'K1', '4.001'), false);
    assert.equal(final(w, 'K1', '4'), true);
    w.selectTask('J1'); w.goToStep(1); input(w, 'stepInput1', '172800/2'); w.handleNumCheck(1);
    assert.equal(w.document.querySelector('#stepInput1').disabled, false);
    assert.match(w.document.querySelector('#rightCol .feedback').textContent, /число/);
  } finally {p.close();}
});

test('J1 sum and M1 scalar question, strict boundaries and rounded intermediate are coherent', async () => {
  const p = await page('finance'); const {w} = p;
  try {
    let debt = 364000, total = 0;
    for (let month = 0; month < 36; month++) {total += debt*0.02 + 364000/36; debt -= 364000/36;}
    assert.ok(Math.abs(3*172800 - total - 19720) < 1e-7);
    assert.match(w.getTask('J1').steps[4].prompt, /1\/36 \+ 2\/36/);
    const m = w.getTask('M1');
    assert.match(m.statement, /правую границу/);
    assert.equal(m.steps[5].answer, Math.round((43/441)*1000)/1000);
    for (const r of [0.098,0.1,0.102]) {
      const values = Array.from({length:25}, (_, i) => (i+1)**2 * (1+r)**(24-i));
      assert.equal(values.indexOf(Math.max(...values))+1, 21);
    }
    assert.ok(Math.abs(21**2*(1+41/400)**4 - 20**2*(1+41/400)**5) < 1e-9);
    assert.equal(final(w, 'M1', '0.102'), false);
    assert.equal(final(w, 'M1', '0.1025'), true);
    assert.equal(final(w, 'M1', ',1025'), true);
  } finally {p.close();}
});

test('finance explanations remain requested, wrong attempts never reveal the final answer, help survives retry and storage', async () => {
  const saved = {otherCourse:{value:42}, financeNonstandardTrainer:{stats:{solved:7,correct:12,attempts:14,hints:2,doneTasks:{A1:true}}, marker:'keep'}};
  const p = await page('finance', '', saved); const {w} = p;
  try {
    w.selectTask('L1');
    for (let n = 0; n < 3; n++) {input(w, 'finalAnswerInput', '123'); w.handleFinalAnswer(); assert.doesNotMatch(w.document.querySelector('.final-box>.feedback').textContent, /500|160|100/);}
    assert.equal(w.document.querySelectorAll('details[open]').length, 0);
    // Opening with a real summary click records help synchronously, even if the
    // next click submits the answer before the asynchronous toggle event.
    w.document.querySelector('.final-box summary').click();
    w.resetCurrentTask(); input(w, 'finalAnswerInput', 500); w.handleFinalAnswer();
    assert.equal(progress(w).stats.assistedTasks.L1, true);
    assert.equal(progress(w).stats.independentTasks.L1, undefined);
    assert.equal(progress(w).stats.doneTasks.A1, true);
    assert.equal(progress(w).stats.solved, 8);
    assert.equal(progress(w).marker, 'keep');
    assert.deepEqual(JSON.parse(w.localStorage.getItem(KEY)).otherCourse, saved.otherCourse);
    const attempts = progress(w).stats.attempts; w.handleFinalAnswer(); assert.equal(progress(w).stats.attempts, attempts);
    w.selectTask('A1'); w.goToStep(4);
    for (let i = 0; i < 3; i++) {input(w, 'stepInput4', 9); w.handleNumCheck(4); assert.doesNotMatch(w.document.querySelector('#rightCol .feedback').textContent, /572|5200|1,1/);}
  } finally {p.close();}
});

test('applied query routes pick the requested existing group and preserve historical results', async () => {
  for (const [query, label] of [['?topic=formulas','формулы'],['?topic=text','текстовые задачи']]) {
    const saved = {'applied-t910':{solved9:4,solved10:5,best:8,passed:true,table:true}, foreign:{value:17}};
    const p = await page('applied-t910', query, saved); const {w} = p;
    try {
      assert.equal(w.document.querySelector('#modeChips [aria-pressed=true]').textContent, label);
      assert.equal(w.document.querySelector('.view.on').id, 'view-drill');
      assert.equal(w.document.querySelectorAll('details[open]').length, 0);
      assert.equal(progress(w,'applied-t910').best, 8);
      assert.equal(progress(w,'applied-t910').passed, true);
      assert.deepEqual(JSON.parse(w.localStorage.getItem(KEY)).foreign, saved.foreign);
      assert.match(w.document.body.textContent, /Проект не является утверждёнными требованиями/);
    } finally {p.close();}
  }
});

test('applied wrong answer stays private; help and repeated click/Enter are counted honestly once', async () => {
  const p = await page('applied-t910', '?topic=formulas'); const {w} = p;
  try {
    input(w, 'dAnswer', 999); w.document.querySelector('#dCheck').click();
    assert.doesNotMatch(w.document.querySelector('#dFb').textContent, /Правильный ответ|2/);
    w.document.querySelector('#dSol').click();
    input(w, 'dAnswer', 2);
    for (let i = 0; i < 8; i++) {w.document.querySelector('#dCheck').click(); w.document.querySelector('#dAnswer').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));}
    const s = progress(w,'applied-t910');
    assert.equal(s.solved9, 1); assert.equal(s.assisted, 1); assert.equal(s.independent, 0); assert.equal(p.timers.size, 1);
    w.document.querySelector('#dNext').click(); assert.equal(p.timers.size, 0);
    input(w, 'dAnswer', 2); w.document.querySelector('#dCheck').click();
    assert.equal(progress(w,'applied-t910').independent, 1);
    w.document.querySelector('#dSol').click(); assert.equal(p.timers.size, 0, 'requested explanation remains readable');
  } finally {p.close();}
});

test('one applied exam question cannot produce eight marks; restart cancels pending transition', async () => {
  const p = await page('applied-t910'); const {w} = p;
  try {
    w.document.querySelector('#zStart').click(); input(w, 'zAnswer', 10);
    for (let i = 0; i < 8; i++) {w.document.querySelector('#zCheck').click(); w.document.querySelector('#zAnswer').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));}
    assert.equal(w.document.querySelectorAll('#zDots .ok').length, 1);
    assert.equal(progress(w,'applied-t910').passed, false);
    assert.equal(p.timers.size, 1);
    w.document.querySelector('#zStart').click(); assert.equal(p.timers.size, 0);
    assert.match(w.document.querySelector('#zTag').textContent, /1 из 8/);
    // Solve eight distinct displayed tasks; no answer is extracted from a
    // queued callback or from the result counter.
    let last; const original = w.AP.task; w.AP.task = mode => (last = original(mode));
    w.document.querySelector('#zStart').click();
    for (let i = 0; i < 8; i++) {input(w, 'zAnswer', last.answer); w.document.querySelector('#zCheck').click(); if (i < 7) p.runTimer();}
    assert.equal(w.document.querySelector('#zScore').textContent, '8 / 8');
    assert.equal(progress(w,'applied-t910').passed, true);
    assert.equal(w.document.querySelector('#zReview').open, false);
  } finally {p.close();}
});

test('applied assisted exam does not newly earn an independent pass; work stories match their objects', async () => {
  const p = await page('applied-t910'); const {w} = p;
  try {
    let last; const original = w.AP.task; w.AP.task = mode => (last = original(mode));
    w.document.querySelector('#zStart').click(); w.document.querySelector('[data-view=idea]').click();
    for (let i = 0; i < 8; i++) {input(w, 'zAnswer', last.answer); w.document.querySelector('#zCheck').click(); if (i < 7) p.runTimer();}
    assert.equal(progress(w,'applied-t910').passed, false);
    assert.equal(progress(w,'applied-t910').assistedExamBest, 8);
    for (const random of [0,0.4,0.9]) {w.Math.random = () => random; const task = w.AP.G10[2](); assert.equal(w.AP.check(String(task.answer), task), true); assert.doesNotMatch(task.text, /деталей (?:первая труба|первый насос)/); if (random !== 0.4) assert.match(task.ask, /наполнят пустой/);}
    for (const bad of ['2/1','2abc','2e0','0x2','Infinity','1 0']) assert.equal(Number.isNaN(w.AP.parse(bad)), true, bad);
    assert.equal(w.AP.parse(',5'), 0.5);
  } finally {p.close();}
});

test('requested common foundation stays assisted after closing it and preserves earlier earned results', async () => {
  const saved = {'applied-t910':{solved9:4,solved10:3,best:8,passed:true},financeNonstandardTrainer:{stats:{solved:2,correct:3,attempts:4,hints:0,doneTasks:{A1:true,B1:true}}}};
  for (const name of ['finance','applied-t910']) {
    const p = await page(name, '?topic=formulas', saved), {w} = p;
    try {
      if (name === 'finance') w.selectTask('L1');
      const help = w.document.createElement('dialog'); w.document.body.append(help); help.open = true;
      w.document.dispatchEvent(new w.CustomEvent('profile-course-help-requested', {detail:{path:w.location.pathname,lessonId:'bridge-fractions'}}));
      help.open = false;
      if (name === 'finance') {
        input(w,'finalAnswerInput',500); w.handleFinalAnswer();
        assert.equal(progress(w).stats.assistedTasks.L1,true);
        assert.equal(progress(w).stats.independentTasks.L1,undefined);
        assert.equal(progress(w).stats.doneTasks.A1,true);
      } else {
        input(w,'dAnswer',2); w.document.querySelector('#dCheck').click();
        assert.equal(progress(w,'applied-t910').assisted,1);
        assert.equal(progress(w,'applied-t910').independent,0);
      }
      assert.equal(progress(w,'applied-t910').best,8);
      assert.equal(progress(w,'applied-t910').passed,true);
    } finally {p.close();}
  }
});

test('finance keeps task choice and derived tables requested while essential given balances stay visible', async () => {
  const p=await page('finance'),{w}=p;
  try {
    assert.equal(w.document.querySelector('#taskChooser').open,false);
    w.document.querySelector('#taskChooser>summary').click();
    const type=Array.from(w.document.querySelectorAll('#taskTypes button')).find(el=>el.textContent.includes('Пени за задержку'));
    type.click();
    assert.equal(w.document.querySelector('#taskChooser').open,false);
    assert.match(w.document.querySelector('#selectedTaskType').textContent,/Пени/);
    assert.equal(w.document.querySelector('.model-details').open,false);
    assert.equal(w.document.querySelector('.stats-details').open,false);
    w.document.querySelector('.model-details>summary').click();
    assert.equal(progress(w).stats.helpedTasks.I1,true);
    input(w,'finalAnswerInput',375.1);w.handleFinalAnswer();
    assert.equal(w.document.querySelector('.model-details').open,true,'requested model remains available after checking');
    assert.equal(progress(w).stats.assistedTasks.I1,true);
    w.selectTask('D1');
    const given=w.document.querySelector('.condition-card table');
    assert(given);assert.equal(given.querySelectorAll('th').length,3);
    assert.deepEqual(Array.from(given.querySelectorAll('tbody tr'),row=>Array.from(row.cells,cell=>cell.textContent)),[['1','900','700'],['2','700','400'],['3','400','0']]);
    assert.equal(w.document.querySelector('.model-details').open,false);
    assert.match(w.document.querySelector('.task-goal').textContent,/2-й декабрь/);
    assert.equal(progress(w).stats.helpedTasks.D1,undefined);
  } finally {p.close();}
});
