/* Mathematical and real-DOM regression tests for the existing workshop models. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const M = require('../school/math.js');
const C = require('../school/curriculum.js');
const dom = new JSDOM('<main><div id="model"></div><div id="other"></div></main>', {
  url: 'https://mathexam.space/school/', runScripts: 'outside-only'
});
const w = dom.window;
w.WorkshopMath = M;
w.eval(fs.readFileSync(path.join(__dirname, '../school/models.js'), 'utf8'));
const B = w.WorkshopModels;
const clone = x => JSON.parse(JSON.stringify(x));
const numeric = x => typeof x === 'number' ? x : x.n / x.d;
const kinds = new Set();
let plans = 0;

function verifyPlan(model) {
  const old = clone(model), plan = B.experiment(model);
  assert.deepEqual(clone(model), old, 'planning must not mutate the task');
  if (!plan) return;
  kinds.add(model.kind); plans++;
  const a = plan.after, actual = numeric(plan.answer);
  assert(Number.isFinite(actual));
  switch (model.kind) {
    case 'fraction':
      assert.equal(actual, a.n / a.d);
      assert(a.d >= 1 && a.d <= Math.max(24, model.d));
      if (a.d !== model.d) assert.equal(a.n * model.d, model.n * a.d, 'same marked amount');
      break;
    case 'percent':
      assert.equal(a.percent, model.percent, 'percentage fixed while whole changes');
      assert.equal(actual, a.total * a.percent / 100);
      assert(a.total > 0 && a.total <= Math.max(1000, model.total));
      break;
    case 'area':
      assert.equal(actual, a.a * a.b);
      assert(a.a >= 1 && a.a <= 12 && a.b >= 1 && a.b <= 12);
      if (model.a !== 1 || model.b !== 1) assert.equal(a.a + a.b, model.a + model.b);
      break;
    case 'array':
      assert.equal(actual, a.a * a.b);
      assert.equal(a.a, model.a);
      assert.equal(Math.abs(a.b - model.b), 1);
      assert(a.b > 0 && a.b <= 12);
      break;
    case 'line':
      assert.equal(actual, model.a - model.b);
      assert.equal(a.a, model.a); assert.equal(a.b, -model.b);
      break;
    case 'ratio': case 'bars':
      assert.equal(a.b, model.b);
      assert.equal(actual, a.a / (a.a + a.b));
      assert(a.a > 0 && a.a <= 1998);
      break;
    case 'multiples': {
      assert.equal(a.a, model.a);
      assert.equal(actual % a.a, 0); assert.equal(actual % a.b, 0);
      const stride = Math.max(a.a, a.b);
      for (let test = stride; test < actual; test += stride) {
        assert(test % a.a !== 0 || test % a.b !== 0, 'no smaller positive common multiple');
      }
      break;
    }
    case 'decimal':
      assert.equal(a.d, model.d); assert.equal(Math.abs(a.n - model.n), model.d);
      assert.equal(actual, a.n / a.d); break;
    case 'place':
      assert.equal(Math.abs(a.n - model.n), 10); assert.equal(actual, a.n); break;
    default: assert.fail('Unexpected experiment kind');
  }
}

for (const lesson of C.lessons) {
  for (let seed = 0; seed < 30; seed++) verifyPlan(M.generate(lesson.id, seed).model);
}
assert.equal(kinds.size, 10);
for (const model of [
  {kind:'fraction', n:0, d:1}, {kind:'fraction', n:1, d:1},
  {kind:'fraction', n:7, d:3}, {kind:'fraction', n:85, d:2},
  {kind:'percent', percent:0, total:80}, {kind:'percent', percent:100, total:80},
  {kind:'area', a:1, b:1}, {kind:'area', a:12, b:1},
  {kind:'array', a:95, b:12}, {kind:'line', a:0, b:0},
  {kind:'ratio', a:9, b:63}, {kind:'bars', a:800, b:900},
  {kind:'multiples', a:60, b:30}, {kind:'place', n:999990},
  {kind:'decimal', n:999900, d:100}
]) {
  let current = model;
  for (let i = 0; i < 150; i++) { verifyPlan(current); current = B.experiment(current).after; }
}

function mount(model, id='model') {
  // Replace the host to mirror app.js's lifecycle, without retaining old listeners.
  const prior = w.document.getElementById(id), el = w.document.createElement('div');
  el.id = id; prior.replaceWith(el); B.mount(el, model); return el;
}
function click(el, selector) {
  const node=el.querySelector(selector);
  if (typeof node.click==='function') node.click();
  else node.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
}
function move(el, key, value) {
  const input=el.querySelector('[data-param="'+key+'"]'); input.focus(); input.value=value;
  input.dispatchEvent(new w.Event('input', {bubbles:true}));
  assert.strictEqual(el.querySelector('[data-param="'+key+'"]'), input, 'slider node is retained');
  assert.strictEqual(w.document.activeElement, input, 'slider keyboard focus is retained');
}
w.localStorage.setItem('mathexam.workshop.v1', 'existing pupil evidence');
const saved=w.localStorage.getItem('mathexam.workshop.v1');

for (const model of [
  {kind:'fraction',n:0,d:1}, {kind:'fraction',n:7,d:3},
  {kind:'percent',percent:25,total:80}, {kind:'area',a:6,b:4},
  {kind:'array',a:8,b:3}, {kind:'line',a:-4,b:-3},
  {kind:'ratio',a:2,b:3}, {kind:'bars',a:500,b:90},
  {kind:'multiples',a:12,b:18}, {kind:'decimal',n:75,d:100},
  {kind:'place',n:990}
]) {
  const plan=B.experiment(model), el=mount(model), picture=el.querySelector('.model-visual').innerHTML;
  assert.equal(el.querySelector('[data-model-feedback]').textContent, '', 'future result hidden');
  assert.equal(el.querySelectorAll('button[type=submit]').length, 0, 'does not hijack task form selectors');
  click(el,'[data-model-check]');
  assert.equal(el.querySelector('.model-visual').innerHTML, picture, 'empty answer changes nothing');
  assert.match(el.querySelector('[data-model-feedback]').textContent,/Сначала запиши/);
  const input=el.querySelector('[data-model-prediction]'); input.value=M.fmt(plan.answer);
  input.dispatchEvent(new w.KeyboardEvent('keydown', {key:'Enter', bubbles:true, cancelable:true}));
  assert.match(el.querySelector('[data-model-feedback]').textContent,/Первый прогноз верен/);
  assert(el.querySelector('[data-model-prediction]').disabled);
  const final=el.querySelector('[data-model-feedback]').textContent;
  click(el,'[data-model-check]'); click(el,'[data-model-reveal]');
  assert.equal(el.querySelector('[data-model-feedback]').textContent,final,'one answer per experiment');
  click(el,'[data-model-again]');
  assert.match(el.querySelector('[data-model-previous]').textContent,/Первый прогноз/);
  assert.equal(el.querySelector('[data-model-feedback]').textContent,'');
  click(el,'[data-reset]');
  assert.equal(el.querySelector('.model-visual').innerHTML,picture,'explicit reset restores original task model');
}

let el=mount({kind:'percent',percent:25,total:80});
el.querySelector('[data-model-prediction]').value='18';
move(el,'total',120);
assert.match(el.querySelector('[data-model-inquiry]').textContent,/Целое было 120, станет 140/);
assert.match(el.querySelector('[data-model-previous]').textContent,/Целое было 80, станет 100/);
assert.match(el.querySelector('[data-model-previous]').textContent,/Черновик прогноза: 18/);
el.querySelector('[data-model-prediction]').value='1'; click(el,'[data-model-check]');
assert.match(el.querySelector('[data-model-feedback]').textContent,/Первый прогноз: 1/);
move(el,'percent',50);
assert.match(el.querySelector('[data-model-previous]').textContent,/Первый прогноз: 1/);
assert.match(el.querySelector('[data-model-inquiry]').textContent,/Процент остаётся 50%/);
click(el,'[data-model-reveal]');
assert.match(el.querySelector('[data-model-feedback]').textContent,/без прогноза/);

el=mount({kind:'fraction',n:1,d:4});
el.querySelector('[data-model-prediction]').value='1/4';
click(el,'[data-cell="2"]');
assert.match(el.querySelector('[data-model-inquiry]').textContent,/Сейчас закрашено 3\/4/);
assert.match(el.querySelector('[data-model-previous]').textContent,/Черновик прогноза: 1\/4/);
const other=mount({kind:'percent',percent:25,total:80},'other');
click(other,'[data-model-reveal]');
assert(!el.querySelector('[data-model-prediction]').disabled,'independent model hosts');
assert.equal(w.localStorage.getItem('mathexam.workshop.v1'),saved,'exploration never writes pupil credit');
assert.equal(w.localStorage.length,1,'no hidden new progress store');

// Every existing model still mounts, including the families without an experiment.
for (const lesson of C.lessons) {
  const host=mount(M.generate(lesson.id,0).model);
  assert(host.querySelector('svg'), lesson.id+' model remains available');
  assert(!/NaN|Infinity/.test(host.innerHTML), lesson.id+' finite drawing');
}
console.log(`${plans} mathematical experiment checks, 10 model kinds, all ${C.lessons.length} existing models, keyboard/draft/first-answer/reset/no-credit DOM flows: PASS`);
w.close();
