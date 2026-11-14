'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {JSDOM, VirtualConsole} = require('jsdom');
const contracts = require('../board-server/learning-contracts');
const remediation = require('../trainers/oge-basics/learning-contracts');
const base = path.join(__dirname, '../trainers/oge-basics');
const source = name => fs.readFileSync(path.join(base, name), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const own = 'mathExamBasics.fraction-meaning.v1';
const tick = () => new Promise(resolve => setImmediate(resolve));

function mount(t, storage = {}, enhanced = true) {
  const errors = [], vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(String(error)));
  const dom = new JSDOM(source('fraction-meaning.html'), {
    url:'https://mathexam.space/trainers/oge-basics/fraction-meaning.html',
    runScripts:'outside-only', virtualConsole:vc
  });
  const w = dom.window, d = w.document;
  w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
  w.confirm = () => false;
  let seed = 17;
  w.Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (const [key, value] of Object.entries(storage)) w.localStorage.setItem(key, value);
  w.eval(source('fraction-meaning-view.js'));
  for (const script of d.scripts) if (!script.src && script.textContent.trim()) w.eval(script.textContent);
  if (enhanced) {
    w.eval(source('basics-help.js'));
    w.eval(source('basics-standalone.js'));
    const style = d.createElement('style'); style.textContent = source('basics-standalone.css'); d.head.append(style);
  }
  t.after(() => { assert.deepEqual(errors, [], 'No runtime errors'); w.close(); });
  return {w, d, state:() => w.__trainerDebug.state(), $:selector => d.querySelector(selector)};
}
function style(f, node) {
  const css = f.w.getComputedStyle(node);
  return {background:css.backgroundColor, border:css.borderTopColor, color:css.color};
}
function pointerClick(f, node) {
  for (const type of ['pointerdown','pointerup','click']) node.dispatchEvent(new f.w.MouseEvent(type, {bubbles:true, cancelable:true}));
}
function answer(f, task, box) {
  if (task.kind === 'choice') pointerClick(f, box.querySelector('[data-id="' + task.answer + '"]'));
  else box.querySelector('input').value = f.w.__trainerDebug.fmtAnswer(task.answer);
}
function enter(f, input, options = {}) {
  input.dispatchEvent(new f.w.KeyboardEvent('keydown', {key:'Enter', bubbles:true, cancelable:true, ...options}));
}

test('real choice clicks visibly select, reject and accept after shared styling loads', t => {
  const f = mount(t), task = f.state().current;
  assert.equal(task.kind, 'choice');
  const choices = [...f.d.querySelectorAll('#practiceAnswer .choice')];
  const right = choices.find(button => button.dataset.id === task.answer);
  const wrong = choices.find(button => button !== right);
  const initial = style(f, wrong);
  pointerClick(f, wrong);
  assert(wrong.classList.contains('selected'));
  assert.equal(wrong.getAttribute('aria-pressed'), 'true');
  assert.equal(right.getAttribute('aria-pressed'), 'false');
  assert.notDeepEqual(style(f, wrong), initial, 'The selected button must not look unselected');
  f.$('#checkTask').click();
  assert(wrong.classList.contains('wrong'));
  const rejected = style(f, wrong);
  assert.notDeepEqual(rejected, initial);
  pointerClick(f, right);
  assert.equal(wrong.getAttribute('aria-pressed'), 'false');
  assert.equal(right.getAttribute('aria-pressed'), 'true');
  f.$('#checkTask').click();
  assert(right.classList.contains('correct'));
  assert.notDeepEqual(style(f, right), rejected);
  assert.equal(f.state().supported, 1);
  assert.equal(f.state().independent, 0);
  assert.equal(f.$('#nextTask').hidden, false);
});

test('empty answer focuses a usable control and does not consume an attempt', t => {
  const f = mount(t);
  f.$('#checkTask').click();
  assert.match(f.$('#practiceFeedback').textContent, /Сначала выберите/);
  assert.equal(f.d.activeElement, f.$('#practiceAnswer .choice'));
  assert.equal(f.state().attempts, 0);
  answer(f, f.state().current, f.$('#practiceAnswer'));
  f.$('#checkTask').click();
  assert.equal(f.state().independent, 1, 'An empty submission must not turn a first correct answer into supported work');
  assert.equal(f.state().attempts, 1);
  f.$('#checkTask').click();
  assert.equal(f.state().independent, 1, 'A completed answer cannot be counted twice');
});

test('all five public lessons accept actual controls with clear fraction wording', t => {
  const f = mount(t);
  f.$('[data-route="learn"]').click();
  assert.match(f.$('#lessonQuestion').textContent, /на сколько равных частей разделили целое/);
  assert.doesNotMatch(f.$('#view-learn').textContent, /количество всех равных частей|сколько равных частей всего/);
  for (let index = 0; index < 5; index++) {
    const q = f.w.__trainerDebug.SPEC.lessons[index].question;
    if (q.kind === 'choice') {
      const options = [...f.d.querySelectorAll('#lessonQuestion .choice')];
      pointerClick(f, options[q.answer === '0' ? 1 : 0]);
      assert(f.$('#lessonFeedback').classList.contains('bad'));
      pointerClick(f, options[Number(q.answer)]);
      assert.equal(options[Number(q.answer)].getAttribute('aria-pressed'), 'true');
    } else {
      const input = f.$('#lessonQuestion input');
      enter(f, input);
      assert.match(f.$('#lessonQuestion .feedback').textContent, /Пустое поле не считается ошибкой/);
      input.value = f.w.__trainerDebug.fmtAnswer(q.answer);
      enter(f, input);
    }
    assert(f.$('#lessonFeedback').classList.contains('good'));
    assert.equal(f.$('#lessonNext').disabled, false);
    assert.equal(f.state().learnDone[index], true);
    f.$('#lessonNext').click();
  }
  assert.equal(f.$('#view-practice').hidden, false);
  const saved = f.w.localStorage.getItem(own);
  const restored = mount(t, {[own]:saved});
  assert.deepEqual([...restored.state().learnDone], [true,true,true,true,true]);
  restored.$('[data-route="learn"]').click();
  assert.equal(restored.state().learnIndex, 4);
  assert.equal(restored.$('#lessonNext').disabled, false);
});

test('practice and checkpoint Enter submissions run once, including composition and blank input', t => {
  const f = mount(t);
  while (f.state().current.kind !== 'input') {
    answer(f, f.state().current, f.$('#practiceAnswer')); f.$('#checkTask').click(); f.$('#nextTask').click();
  }
  const input = f.$('#practiceAnswer input');
  input.value = '   '; enter(f, input);
  assert.equal(f.state().attempts, 0);
  assert.match(f.$('#practiceFeedback').textContent, /Пустое поле/);
  input.value = f.w.__trainerDebug.fmtAnswer(f.state().current.answer);
  enter(f, input, {isComposing:true}); assert.equal(f.state().attempts, 0);
  const before = f.state().independent;
  enter(f, input); assert.equal(f.state().independent, before + 1);
  enter(f, input); assert.equal(f.state().independent, before + 1);
  f.$('[data-route="check"]').click();
  f.$('#checkNext').click(); assert.equal(f.state().check.i, 0);
  for (let index = 0; index < 5; index++) {
    const task = f.state().check.tasks[index]; answer(f, task, f.$('#checkAnswer'));
    if (task.kind === 'choice') f.$('#checkNext').click(); else enter(f, f.$('#checkAnswer input'));
    assert.equal(f.state().check.answers.length, index + 1);
  }
  assert.equal(f.$('#resultScore').textContent, '5/5');
  assert.equal(f.state().best, 5);
  const saved = f.w.localStorage.getItem(own);
  const restored = mount(t, {[own]:saved});
  assert.equal(restored.state().best, 5);
  assert.equal(restored.state().independent, before + 1);
});

test('native lesson and practice controls work if optional enhancement fails to load', t => {
  const f = mount(t, {}, false);
  f.$('[data-route="learn"]').click();
  f.d.querySelectorAll('#lessonQuestion .choice')[1].click();
  assert.equal(f.$('#lessonNext').disabled, false);
  assert.match(f.$('#lessonQuestion').textContent, /на сколько равных частей разделили целое/);
  f.$('[data-route="practice"]').click();
  answer(f, f.state().current, f.$('#practiceAnswer')); f.$('#checkTask').click();
  assert.equal(f.state().independent, 1);
});

test('128 original cabinet specs and question identities remain byte-for-byte compatible', () => {
  const samples = Array.from({length:128}, (_,seed) => contracts.create('oge-basics','fraction-meaning',seed));
  const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
  // Recorded from main add234c3 before changing the display code.
  assert.equal(hash(samples), 'a6dbbc33277fc7e9c289b288164e5e0e8e88cf13a8514d3d4809d1ef8033eb17');
  assert.equal(hash(samples.map(row => contracts.questionIdentity(row.taskSpec))),
    '0ce9eae7a8001c926e2a920da7b20d8dddea0808bc6ad760702d97f7a35efae7');
});

test('cabinet renders new wording while restoring exact old state and observer controls', async t => {
  const dom = new JSDOM('<main id="learning-remediation-root"></main>', {
    url:'https://mathexam.space/trainers/oge-basics/fraction-meaning.html?learning=1', runScripts:'outside-only'
  });
  const w = dom.window, d = w.document;
  t.after(() => w.close());
  const envelope = contracts.create('oge-basics','fraction-meaning',17);
  envelope.state.note = 'Мой вопрос: какое число показывает количество всех равных частей?';
  const original = JSON.stringify(envelope.taskSpec), events = [];
  Object.assign(w, {MathExamRemediationManaged:true, MathExamRemediation:remediation,
    DivisionLab:require('../trainers/oge-basics/multiplication-division/division-lab-core')});
  let bridge;
  w.MathExamLearning = {register(value) { bridge = value; }};
  w.eval(source('fraction-meaning-view.js')); w.eval(source('basics-help.js')); w.eval(source('learning-managed.js'));
  bridge.subscribe(event => events.push(clone(event)));
  bridge.applyState({...clone(envelope), readOnly:false});
  assert.equal(d.querySelector('#lm-note').value, envelope.state.note, 'Authored copy changes must never rewrite a learner note');
  d.querySelector('#lm-learn').click();
  assert.match(d.querySelector('.lm-card').textContent, /на сколько равных частей разделили целое/);
  assert.doesNotMatch(d.querySelector('.lm-card').textContent, /количество всех равных частей/);
  d.querySelector('[data-choice="1"]').click();
  const draft = clone(bridge.getState());
  bridge.applyState({taskSpec:clone(envelope.taskSpec), state:draft, readOnly:false});
  assert.deepEqual(clone(bridge.getState()), draft);
  assert.equal(d.querySelector('[data-choice="1"]').getAttribute('aria-pressed'), 'true');
  d.querySelector('#lm-check').click();
  assert.equal(bridge.getState().lessonChecked[0], true);
  const checked = clone(bridge.getState()), eventCount = events.length;
  bridge.applyState({taskSpec:clone(envelope.taskSpec), state:checked, readOnly:true});
  await tick();
  assert.deepEqual(clone(bridge.getState()), checked);
  assert.equal(events.length, eventCount);
  assert.equal(d.querySelector('#lm-check').disabled, true);
  assert.equal(d.querySelector('#lm-note').value, envelope.state.note);
  assert.equal(JSON.stringify(envelope.taskSpec), original);
});
