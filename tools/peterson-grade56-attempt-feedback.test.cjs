'use strict';
// Exercise real course handlers and storage; expected arithmetic is independent
// of the task keys. Browser layout and keyboard acceptance run separately.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const plain = value => JSON.parse(JSON.stringify(value));

function page(grade, hash, saved) {
  const dir = path.join(root, 'school', 'peterson' + grade);
  const dom = new JSDOM(fs.readFileSync(path.join(dir, 'index.html'), 'utf8'), {
    url: 'https://mathexam.test/school/peterson' + grade + '/' + hash,
    runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window;
  w.scrollTo = () => {};
  const key = grade === 5 ? 'mathexam.peterson5.v1' : 'mathexam.peterson6.part1.v1';
  if (saved) w.localStorage.setItem(key, JSON.stringify(saved));
  for (const file of ['math.js', 'models.js', 'data.js', 'app.js']) {
    w.eval(fs.readFileSync(path.join(dir, file), 'utf8'));
  }
  const d = w.document, api = { ...w.PetersonApp, validateState: raw => plain(w.PetersonApp.validateState(raw)) };
  return {
    w, d, api, key, close: () => w.close(),
    go(hash) { w.history.replaceState(null, '', hash); api.route(); },
    input(selector, value) {
      const field = d.querySelector(selector); assert(field, selector);
      field.value = value; field.dispatchEvent(new w.Event('input', { bubbles: true }));
    },
    submit(selector = '#answer-form') {
      const form = d.querySelector(selector); assert(form, selector);
      form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    },
    click(selector) { const button = d.querySelector(selector); assert(button, selector); button.click(); },
    state() { return plain(api.getState()); },
    stored() { return JSON.parse(w.localStorage.getItem(key)); }
  };
}

for (const grade of [5, 6]) {
  const route = grade === 5 ? '#lesson/p02/0' : '#lesson/p04/0';
  const id = grade === 5 ? 'p02-t01' : 'p04-t01';
  const answer = grade === 5 ? '15' : '14';

  test('Peterson ' + grade + ': invalid numeric format is a retained draft, then a first independent success', t => {
    const r = page(grade, route); t.after(r.close);
    for (const value of ['', 'слово', '2/', '<img src=x onerror=alert(1)>']) {
      r.input('#final-answer', value); r.submit();
      const s = r.state().tasks[id];
      assert.equal(s.attempts, 0);
      assert.equal(s.correct, false);
      assert.deepEqual(s.firstErrors, { steps: {} });
      assert.equal(r.d.querySelector('.first-errors'), null);
      assert.equal(r.stored().tasks[id].value, value);
      if (value) assert.match(s.feedback, /пока не распознана/);
    }
    r.input('#final-answer', answer); r.submit();
    let s = r.state().tasks[id];
    assert.equal(s.correct, true); assert.equal(s.independent, true); assert.equal(s.attempts, 1);
    const completion = plain(s.completion);
    // Old completed records and later help must preserve the real completion.
    r.input('#final-answer', '999'); r.submit();
    r.click('[data-action="hint"]');
    assert.deepEqual(r.state().tasks[id].completion, completion);
    const reload = page(grade, route, r.state()); t.after(reload.close);
    assert.deepEqual(reload.state().tasks[id].completion, completion);
    assert.equal(reload.d.querySelector('.first-errors'), null);
  });

  test('Peterson ' + grade + ': first meaningful final error survives correction, help and reload', t => {
    let r = page(grade, route); t.after(() => r.close());
    r.input('#notebook', 'Мои вычисления сохранены.');
    r.input('#final-answer', '999'); r.submit();
    const first = plain(r.state().tasks[id].firstErrors.final);
    assert.deepEqual(first, { value: '999', assisted: false });
    r.submit();
    r.click('[data-action="hint"]'); r.click('[data-action="hint"]');
    r.input('#final-answer', '998'); r.submit();
    assert.deepEqual(r.state().tasks[id].firstErrors.final, first);
    r.input('#final-answer', answer); r.submit();
    assert.equal(r.state().tasks[id].correct, true);
    assert.equal(r.state().tasks[id].independent, false);
    const saved = r.state(); r.close(); r = page(grade, route, saved);
    assert.deepEqual(r.state().tasks[id].firstErrors.final, first);
    assert.equal(r.d.querySelector('#notebook').value, 'Мои вычисления сохранены.');
    const history = r.d.querySelector('.first-errors'); assert(history);
    assert.match(history.textContent, /999/); assert.match(history.textContent, /без подсказки/);
    assert.match(history.textContent, new RegExp('Исправлено: ' + answer));
    r.click('[data-action="independent-check"]'); r.go(r.w.location.hash);
    const prefix = grade === 6 ? 'check:' : 'practice:';
    assert(r.w.location.hash.startsWith('#' + prefix.slice(0, -1) + '/'));
    const practice = Object.entries(r.state().tasks).find(([key]) => key.startsWith(prefix));
    assert(practice); assert.equal(practice[1].attempts, 0);
    assert.deepEqual(practice[1].firstErrors, { steps: {} });
  });

  test('Peterson ' + grade + ': first step error is retained, invalid format is not, and zero is meaningful', t => {
    const r = page(grade, '#practice/fraction-add/1'); t.after(r.close);
    const id = Object.keys(r.state().tasks).find(id => id.startsWith('practice:'));
    r.click('[data-action="guided"]');
    r.input('[data-step-input="0"]', '2/'); r.submit('[data-step-form="0"]');
    assert.deepEqual(r.state().tasks[id].firstErrors, { steps: {} });
    assert.match(r.d.querySelector('#step-feedback-0').textContent, /пока не распознана/);
    r.input('[data-step-input="0"]', '0'); r.submit('[data-step-form="0"]');
    const first = plain(r.state().tasks[id].firstErrors.steps[0]);
    assert.deepEqual(first, { value: '0', assisted: true });
    r.input('[data-step-input="0"]', '1'); r.submit('[data-step-form="0"]');
    assert.deepEqual(r.state().tasks[id].firstErrors.steps[0], first);
    const task = r.w.PetersonMath.generate('fraction-add', 1, 1);
    r.input('[data-step-input="0"]', task.steps[0].answer); r.submit('[data-step-form="0"]');
    assert.equal(r.state().tasks[id].step, 1);
    assert.deepEqual(r.stored().tasks[id].firstErrors.steps[0], first);
    const reload = page(grade, '#practice/fraction-add/1', r.state()); t.after(reload.close);
    assert.deepEqual(reload.state().tasks[id].firstErrors.steps[0], first);
    assert.match(reload.d.querySelector('.first-errors').textContent, /Исправлено:/);
  });

  test('Peterson ' + grade + ': recognised but wrong required representation remains an attempt', t => {
    const r = page(grade, '#practice/fraction-reduce/1'); t.after(r.close);
    const id = Object.keys(r.state().tasks).find(id => id.startsWith('practice:'));
    const task = r.w.PetersonMath.generate('fraction-reduce', 1, 1);
    const [n, d] = task.answer.split('/').map(Number), unreduced = (2 * n) + '/' + (2 * d);
    r.input('#final-answer', unreduced); r.submit();
    assert.equal(r.state().tasks[id].attempts, 1);
    assert.equal(r.state().tasks[id].correct, false);
    assert.equal(r.state().tasks[id].firstErrors.final.value, unreduced);
    r.input('#final-answer', task.answer); r.submit();
    assert.equal(r.state().tasks[id].correct, true);
    assert.equal(r.state().tasks[id].independent, false);
  });

  test('Peterson ' + grade + ': choices still count as mathematical answers and retain the first wrong choice', t => {
    const r = page(grade, '#home'); t.after(r.close);
    const lesson = r.w.PetersonCourse.lessons.find(l => l.tasks.some(t => t.kind === 'choice'));
    const index = lesson.tasks.findIndex(t => t.kind === 'choice'), task = lesson.tasks[index];
    r.go('#lesson/' + lesson.id + '/' + index);
    const wrongIndex = task.choices.findIndex(value => value !== task.answer);
    r.click('[data-choice="' + wrongIndex + '"]'); r.submit();
    assert.equal(r.state().tasks[task.id].attempts, 1);
    assert.equal(r.state().tasks[task.id].firstErrors.final.value, task.choices[wrongIndex]);
    r.click('[data-choice="' + task.choices.indexOf(task.answer) + '"]'); r.submit();
    assert.equal(r.state().tasks[task.id].correct, true);
    assert.equal(r.state().tasks[task.id].independent, false);
    const reload = page(grade, '#lesson/' + lesson.id + '/' + index, r.state()); t.after(reload.close);
    assert.equal(reload.state().tasks[task.id].firstErrors.final.value, task.choices[wrongIndex]);
  });

  test('Peterson ' + grade + ': legacy and malformed history are safe and no history is invented', t => {
    const r = page(grade, route); t.after(r.close);
    const raw = r.state(), task = raw.tasks[id];
    delete task.firstErrors; task.note = 'Старая запись'; task.attempts = 2;
    const clean = r.api.validateState(raw);
    assert.deepEqual(clean.tasks[id].firstErrors, { steps: {} });
    assert.equal(clean.tasks[id].note, 'Старая запись'); assert.equal(clean.tasks[id].attempts, 2);
    task.firstErrors = { final: { value: answer, assisted: true }, steps: { '99': { value: '1' }, '00': { value: '999' }, '01': { value: '999' }, '__proto__': { value: '2' } } };
    assert.deepEqual(r.api.validateState(raw).tasks[id].firstErrors, { steps: {} });
    for (const value of ['<svg onload=alert(1)>', '2/', '9'.repeat(201)]) {
      task.firstErrors.final = { value, assisted: false };
      assert.deepEqual(r.api.validateState(raw).tasks[id].firstErrors, { steps: {} });
    }
    if (grade === 6) {
      task.methodVersion = 99;
      assert.throws(() => r.api.validateState(raw), /более новую редакцию/);
    } else {
      const lesson = r.w.PetersonCourse.lessons.find(l => l.tasks.some(t => t.kind === 'manual'));
      const index = lesson.tasks.findIndex(t => t.kind === 'manual');
      r.go('#lesson/' + lesson.id + '/' + index);
      assert.equal(r.d.querySelector('#answer-form'), null);
      r.input('#notebook', 'Моё доказательство в тетради.');
      r.click('[data-action="reviewed"]');
      const manual = r.state().tasks[lesson.tasks[index].id];
      assert.equal(manual.reviewed, true); assert.equal(manual.correct, false);
      assert.deepEqual(manual.firstErrors, { steps: {} });
    }
  });
}

test('Peterson 6: first errors remain visible when earlier work is archived for the current method', t => {
  const route = '#lesson/p09/0', id = 'p09-t01';
  let r = page(6, route); t.after(() => r.close());
  const saved = r.state();
  saved.tasks[id] = {
    methodVersion: 1, value: '999', attempts: 1, note: 'Прежний ход решения',
    firstErrors: { steps: {}, final: { value: '999', assisted: false } }
  };
  r.close(); r = page(6, route, saved);
  assert.equal(r.state().tasks[id].methodVersion, 1);
  assert.equal(r.state().tasks[id].firstErrors.final.value, '999');
  r.click('[data-action="current-method"]');
  assert.equal(r.state().tasks[id].methodVersion, 2);
  assert.equal(r.state().history[id][0].firstErrors.final.value, '999');
  assert.match(r.d.querySelector('.earlier-work .first-errors').textContent, /999/);
  const current = r.state(); r.close(); r = page(6, route, current);
  assert.match(r.d.querySelector('.earlier-work .first-errors').textContent, /999/);
  assert.match(r.d.querySelector('.earlier-work').textContent, /Прежний ход решения/);
  assert.equal(r.state().tasks[id].independent, false);
});
