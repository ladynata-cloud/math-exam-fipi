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
// Execute the exact synchronous adapter from the existing loader. Browser gates
// separately cover its complete loading sequence and optional enhancements.
const displayAdapter = () => source('learning-loader.js').split('/* Remediation loader:')[0];
const clone = value => JSON.parse(JSON.stringify(value));
const own = 'mathExamBasics.fraction-meaning.v1';
const tick = () => new Promise(resolve => setImmediate(resolve));

function mount(t, storage = {}, enhanced = true, filename = 'fraction-meaning.html') {
  const errors = [], vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(String(error)));
  const dom = new JSDOM(source(filename), {
    url:'https://mathexam.space/trainers/oge-basics/' + filename,
    runScripts:'outside-only', virtualConsole:vc
  });
  const w = dom.window, d = w.document;
  w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
  w.confirm = () => false;
  let seed = 17;
  w.Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (const [key, value] of Object.entries(storage)) w.localStorage.setItem(key, value);
  w.eval(displayAdapter());
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

const common = 'fraction-common-denominator.html';
const meaning = 'fraction-meaning.html';

test('a zero checkpoint remains a recorded score alongside past best and independent practice', t => {
  for (const filename of [meaning, common]) {
    const key = 'mathExamBasics.' + filename.replace('.html', '.v1');
    const old = JSON.stringify({best:4, independent:3, learnDone:[true]});
    const f = mount(t, {[key]:old}, true, filename);
    f.$('[data-route="home"]').click();
    assert.equal(f.$('#homePct').textContent, '—', 'Old best alone gives no most recent score');
    assert.equal(f.$('#statBest').textContent, '4/5');
    f.$('[data-route="check"]').click();
    for (const task of f.state().check.tasks) {
      const box = f.$('#checkAnswer');
      if (task.kind === 'choice') {
        pointerClick(f, [...box.querySelectorAll('.choice')].find(button => button.dataset.id !== task.answer));
      } else box.querySelector('input').value = '9999';
      f.$('#checkNext').click();
    }
    assert.equal(f.$('#resultScore').textContent, '0/5');
    const saved = f.w.localStorage.getItem(key);
    const reloaded = mount(t, {[key]:saved}, true, filename);
    reloaded.$('[data-route="home"]').click();
    assert.equal(reloaded.$('#homePct').textContent, '0/5');
    assert.equal(reloaded.$('#statBest').textContent, '4/5');
    assert.equal(reloaded.$('#statIndependent').textContent, '3');
    assert.match(reloaded.$('#homeRec').textContent, /Повторите действия/);
  }
});

test('choice review shows fractions and numbers rather than internal option ids', t => {
  const f = mount(t);
  f.$('[data-route="check"]').click();
  const choices = [];
  for (const task of f.state().check.tasks) {
    if (task.kind === 'choice') {
      const wrong = task.options.find(option => option.id !== task.answer);
      pointerClick(f, f.$('#checkAnswer [data-id="' + wrong.id + '"]'));
      choices.push({
        prompt:task.prompt.replace(/<[^>]+>/g, ''),
        answer:task.options.find(option => option.id === task.answer).html,
        wrong:wrong.html,
      });
    } else answer(f, task, f.$('#checkAnswer'));
    f.$('#checkNext').click();
  }
  const wrongItems = [...f.d.querySelectorAll('#reviewList .bad')];
  assert.equal(wrongItems.length, 3);
  for (const [index, item] of wrongItems.entries()) {
    const expected = choices[index];
    assert.equal(item.querySelector('p').textContent, expected.prompt);
    assert.equal(item.querySelector('p:nth-of-type(2)').textContent,
      'Ваш ответ ' + expected.wrong + '. Верный ответ ' + expected.answer + '.');
  }
});

test('every fraction checkpoint covers its actions and the reduction exercise needs reduction', t => {
  const basic = mount(t, {}, false, meaning).w.__trainerDebug;
  const denominator = mount(t, {}, false, common).w.__trainerDebug;
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const positions = new Set();
  for (let sample = 0; sample < 100; sample++) {
    const meaningTasks = Array.from(basic.makeCheckSet());
    assert.deepEqual(meaningTasks.map(task => task.skill), ['parts','parts','equal','simplify','compare']);
    const parts = meaningTasks.slice(0, 2);
    for (const task of parts) {
      assert.deepEqual(task.options.map(o => o.id).sort(), ['d','n']);
      const [n,d] = task.prompt.match(/(\d+)\/(\d+)/).slice(1).map(Number);
      assert(n > 0 && n < d);
      assert.equal(task.options.find(o => o.id === 'n').html, String(n));
      assert.equal(task.options.find(o => o.id === 'd').html, String(d));
    }
    assert.notEqual(parts[0].options.find(o => o.id === 'd').html, parts[1].options.find(o => o.id === 'd').html);
    positions.add(parts.map(task => task.options.findIndex(o => o.id === task.answer)).join(''));
    assert.equal(meaningTasks[0].answer, 'd');
    assert.equal(meaningTasks[1].answer, 'n');
    const commonTasks = Array.from(denominator.makeCheckSet());
    assert.deepEqual(commonTasks.map(task => task.skill), ['lcm','expand','add','reduce-sum','subtract']);
    for (const task of commonTasks.slice(2)) {
      const [[a,b],[c,d]] = [...task.prompt.matchAll(/(\d+)\/(\d+)/g)].map(match => match.slice(1).map(Number));
      const lcm = b / gcd(b, d) * d;
      const numerator = a * (lcm / b) + (task.skill === 'subtract' ? -c : c) * (lcm / d);
      assert.equal(task.answer.n * lcm, task.answer.d * numerator);
      assert.equal(gcd(task.answer.n, task.answer.d), 1);
      if (task.skill === 'reduce-sum') assert(gcd(numerator, lcm) > 1);
      if (task.skill === 'add') assert.equal(gcd(numerator, lcm), 1);
    }
  }
  assert.deepEqual([...positions].sort(), ['00','01','10','11']);
});

test('least common denominator help also works when the product is the answer', t => {
  const f = mount(t, {}, false, common);
  f.w.Math.random = () => 0.16;
  f.$('[data-route="practice"]').click();
  const task = f.state().current;
  assert.equal(task.answer, 10);
  assert.match(task.prompt, /1\/2.*1\/5/);
  const entry = f.$('#practiceAnswer input');
  entry.value = '11';
  f.$('#checkTask').click();
  assert.match(f.$('#practiceFeedback').textContent, /кратные 5.*делится и на 2/);
  entry.value = '10';
  f.$('#checkTask').click();
  assert.match(f.$('#practiceFeedback').textContent, /Получилось с поддержкой/);
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
  // Pin the corrected full envelopes AND the original published bytes after
  // reversing exactly the three intentional lesson-only changes.
  const legacyEnvelope = envelope => {
    const old = clone(envelope);
    assert.equal(old.taskSpec.contentId, 'fraction-meaning');
    const lessons = old.taskSpec.lessons;
    assert.equal(lessons.length, 5);
    assert.equal(lessons[2].lead, "Если умножить числитель и знаменатель на одно и то же натуральное число, значение дроби не изменится. На ноль умножать нельзя: знаменатель станет нулём.");
    assert.equal(lessons[3].question.prompt, "Сократите дробь <strong>4/10</strong> до несократимой. Ответ запишите через /.");
    assert.equal(lessons[3].question.strict, true);
    lessons[2].lead = "Если умножить числитель и знаменатель на одно и то же число, значение не изменится.";
    lessons[3].question.prompt = "Сократите дробь <strong>4/10</strong>. Ответ запишите через /.";
    delete lessons[3].question.strict;
    return old;
  };
  assert.equal(hash(samples), '221bec12dd1dbca470f7dc0b2a8eadbec7356abe81d48289f74f4b20f70f66c2');
  const legacy = samples.map(legacyEnvelope);
  assert.equal(hash(legacy), 'a6dbbc33277fc7e9c289b288164e5e0e8e88cf13a8514d3d4809d1ef8033eb17');
  for (const mutate of [
    x => { x.taskSpec.lessons[2].lead += '!'; },
    x => { x.taskSpec.lessons[3].question.prompt += '!'; },
    x => { x.taskSpec.lessons[3].question.strict = false; }
  ]) {
    const wrong = clone(samples[0]); mutate(wrong);
    assert.throws(() => legacyEnvelope(wrong));
  }
  const unrelated = clone(samples);
  unrelated[0].state.note = 'synthetic changed state';
  assert.notEqual(hash(unrelated.map(legacyEnvelope)), hash(legacy));
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
  w.eval(displayAdapter()); w.eval(source('basics-help.js')); w.eval(source('learning-managed.js'));
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
