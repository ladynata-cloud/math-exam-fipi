'use strict';

// Synthetic DOM only: no accounts, server requests, navigation or pupil data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { TextEncoder } = require('node:util');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const typeValue = (window, input, value) => {
  input.value = String(value);
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
};
const enter = (window, input, properties = {}) => {
  const event = new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...properties });
  input.dispatchEvent(event);
  return event;
};
const submitButton = form => [...form.elements].find(element => element.type === 'submit');
function openTask(window, lesson, index) {
  window.history.replaceState(null, '', '#lesson/' + lesson + '/' + index);
  window.PetersonApp.route();
  return window.PetersonCourse.lessons.find(item => item.id === lesson).tasks[index];
}

function fixture({ board = false, query = '', url } = {}) {
  const page = board ? 'trainers/peterson6.html' : 'school/peterson6/index.html';
  const dom = new JSDOM(read(page), {
    url: url || 'https://mathexam.space/' + page + query + '#home',
    runScripts: 'outside-only'
  });
  const { window } = dom;
  window.scrollTo = () => {};
  window.TextEncoder = TextEncoder;
  window.fetch = () => { throw new Error('Number search must not make a network request'); };
  if (board) window.MathExamBoard = { register() {} };
  for (const file of ['math.js', 'models.js', 'data.js', ...(board ? ['board-session.js'] : []), 'app.js']) {
    window.eval(read('school/peterson6/' + file));
  }
  return {
    window,
    search(value) {
      const input = window.document.getElementById('exercise-number');
      input.value = String(value);
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
      window.document.getElementById('number-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
      return window.document.getElementById('number-result');
    },
    close() { window.close(); }
  };
}

const exact = [
  { number: 303, topic: /Движение навстречу/, href: '/trainers/maxim-peterson6/#meeting?example=303', cabinetHref: '/trainers/maxim-peterson6/?cabinet=peterson-helper#meeting?example=303' },
  { number: 305, topic: /Движение в противоположных направлениях/, href: '/trainers/maxim-peterson6/#ratio?example=305', cabinetHref: '/trainers/maxim-peterson6/?cabinet=peterson-helper#ratio?example=305' }
];

test('303 and 305 offer their exact equation lesson from personal and cabinet course entry', () => {
  for (const [query, inCabinet] of [['', false], ['?cabinet=peterson-helper&room=synthetic-room&return=unrelated', true]]) {
    const f = fixture({ query });
    try {
      const before = plain(f.window.PetersonApp.getState());
      for (const expected of exact) {
        const result = f.search(expected.number), links = [...result.querySelectorAll('a')];
        assert.match(result.textContent, new RegExp('№ ' + expected.number + ' · страница 73'));
        assert.match(result.textContent, expected.topic);
        assert.equal(links.length, 1);
        assert.equal(links[0].getAttribute('href'), inCabinet ? expected.cabinetHref : expected.href);
        assert.match(links[0].textContent, /через неизвестную/);
        assert.equal(links[0].target, inCabinet ? '_self' : '_blank');
        assert.equal(links[0].rel, 'noopener noreferrer');
        assert.equal(new URL(links[0].href).search, inCabinet ? '?cabinet=peterson-helper' : '', 'only the public helper flag may be forwarded');
        assert.match(links[0].textContent, inCabinet ? /→$/ : /↗$/);
        assert.match(result.textContent, inCabinet ? /Разбор откроется здесь.*Мои материалы/ : /отдельной вкладке/);
        if (inCabinet) assert.doesNotMatch(result.textContent, /отдельной вкладке/);
        assert.doesNotMatch(result.textContent, /Индивидуальный разбор этого номера ещё не включён|Среднее арифметическое/);
        assert.equal(result.querySelector('a[href="#lesson/p10"]'), null);
        assert.deepEqual(plain(f.window.PetersonCourse.exerciseIndex[expected.number]), { page: 73, lesson: 'p10', review: true }, 'source review provenance stays unchanged');
        assert.deepEqual(plain(f.window.PetersonApp.getState()), before, 'search does not alter saved work');
        assert.equal(f.window.location.hash, '#home');
      }
    } finally { f.close(); }
  }
});

test('offline course links to the published exact lessons instead of the local filesystem', () => {
  const f = fixture({ url: 'file:///downloaded-course/peterson6/index.html#home' });
  try {
    for (const expected of exact) {
      const link = f.search(expected.number).querySelector('a');
      assert.equal(link.getAttribute('href'), 'https://mathexam.space' + expected.href);
      assert.equal(link.target, '_blank');
      assert.equal(link.rel, 'noopener noreferrer');
      assert.equal(new URL(link.href).protocol, 'https:');
    }
  } finally { f.close(); }
});

test('ordinary topic lookup and existing textbook subparts retain their links', () => {
  const f = fixture();
  try {
    const topic = f.search(221);
    assert.match(topic.textContent, /№ 221 · страница 58/);
    assert.match(topic.textContent, /Задачи на движение по реке/);
    assert(topic.querySelector('a[href="#lesson/p09"]'));
    assert.match(topic.textContent, /Индивидуальный разбор этого номера ещё не включён/);
    assert.equal(topic.querySelector('[target="_blank"]'), null);

    const textbook = f.search(177);
    assert.match(textbook.textContent, /№ 177 · страница 47/);
    assert.deepEqual([...textbook.querySelectorAll('a')].map(a => a.getAttribute('href')), [
      '#lesson/p08', '#lesson/p08/0', '#lesson/p08/1', '#lesson/p08/2', '#lesson/p08/3'
    ]);
    assert.doesNotMatch(textbook.textContent, /Индивидуальный разбор этого номера ещё не включён/);
    assert.equal(textbook.querySelector('[target="_blank"]'), null);

    const review = f.search(297);
    assert.match(review.textContent, /Блок самопроверки/);
    assert(review.querySelector('a[href="#lesson/p10"]'));
  } finally { f.close(); }
});

test('invalid number replaces an earlier exact result without leaving a stale link', () => {
  const f = fixture();
  try {
    for (const value of [0, -1, 498, 303.5, '']) {
      f.search(303);
      const result = f.search(value);
      assert.equal(result.textContent, 'Введи целый номер от 1 до 497.');
      assert.equal(result.querySelector('a'), null);
      assert.equal(f.window.location.hash, '#home');
    }
  } finally { f.close(); }
});

test('board number search round-trips the existing state format and keeps exact links separate', () => {
  const f = fixture({ board: true, query: '?room=synthetic-room&cabinet=peterson-helper' });
  try {
    const api = f.window.__peterson6Board, initial = plain(api.getState());
    for (const expected of exact) {
      f.search(expected.number);
      const snapshot = api.getState(), state = plain(snapshot);
      assert.equal(api.validateState(snapshot), true);
      assert.deepEqual(state.work, initial.work);
      assert.equal(state.route, '#home');
      assert.deepEqual(state.view.number, { draft: String(expected.number), submitted: expected.number });
      assert.deepEqual(Object.keys(state), Object.keys(initial));
      assert.deepEqual(Object.keys(state.view), Object.keys(initial.view));
      api.applyState(f.window.JSON.parse(JSON.stringify(state)));
      const link = f.window.document.querySelector('#number-result a');
      assert.equal(link.getAttribute('href'), expected.href);
      assert.equal(link.target, '_blank');
      assert.equal(link.rel, 'noopener noreferrer');
      assert.equal(new URL(link.href).search, '', 'room parameters must not be forwarded');
      assert.deepEqual(plain(api.getState()), state);
    }
  } finally { f.close(); }
});

test('number search handles click and Enter once without native submission or saved-work changes', () => {
  const f = fixture({ query: '?cabinet=peterson-helper' }), w = f.window;
  try {
    const form = w.document.getElementById('number-form'), input = form.querySelector('input'), button = submitButton(form);
    const result = w.document.getElementById('number-result'), before = plain(w.PetersonApp.getState());
    const observer = new w.MutationObserver(() => {});
    observer.observe(result, { childList: true });
    let nativeSubmits = 0;
    form.addEventListener('submit', () => nativeSubmits++);
    typeValue(w, input, 303); button.click();
    assert.equal(result.querySelector('a').getAttribute('href'), exact[0].cabinetHref);
    assert.equal(observer.takeRecords().length, 1, 'one search per click');
    assert.equal(nativeSubmits, 0);

    typeValue(w, input, 305);
    assert.equal(enter(w, input).defaultPrevented, true);
    assert.equal(result.querySelector('a').getAttribute('href'), exact[1].cabinetHref);
    assert.equal(observer.takeRecords().length, 1, 'one search per Enter');
    assert.equal(nativeSubmits, 0);
    for (const properties of [{ key: 'Escape' }, { key: 'ArrowUp' }, { isComposing: true }, { keyCode: 229 }, { repeat: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true }, { shiftKey: true }]) {
      enter(w, input, properties);
      assert.equal(observer.takeRecords().length, 0, JSON.stringify(properties));
    }
    button.disabled = true;
    assert.equal(enter(w, input).defaultPrevented, true);
    assert.equal(observer.takeRecords().length, 0);
    assert.deepEqual(plain(w.PetersonApp.getState()), before);
    observer.disconnect();

    button.disabled = false;
    w.PetersonApp.route();
    button.click();
    form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    assert.equal(w.document.getElementById('number-result').textContent, '', 'detached search controls cannot run on the new page');
    assert.deepEqual(plain(w.PetersonApp.getState()), before);
  } finally { f.close(); }
});

test('final-answer click and Enter use existing checks and ignore disabled or stale forms', () => {
  const f = fixture({ query: '?cabinet=peterson-helper' }), w = f.window;
  try {
    const task = openTask(w, 'p10', 0), state = () => plain(w.PetersonApp.getState().tasks[task.id]);
    const staleForm = w.document.getElementById('answer-form'), staleButton = submitButton(staleForm), staleInput = w.document.getElementById('final-answer');
    let nativeSubmits = 0;
    staleForm.addEventListener('submit', () => nativeSubmits++);
    typeValue(w, staleInput, 0); staleButton.click();
    assert.equal(nativeSubmits, 0);
    assert.equal(state().attempts, 1);
    assert.equal(state().correct, false);
    const afterWrong = state();
    staleButton.click();
    staleForm.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    enter(w, staleInput);
    assert.deepEqual(state(), afterWrong, 'old controls must not add attempts');

    const input = w.document.getElementById('final-answer');
    typeValue(w, input, 7);
    for (const properties of [{ isComposing: true }, { keyCode: 229 }, { repeat: true }]) enter(w, input, properties);
    assert.equal(state().attempts, 1);
    assert.equal(enter(w, input).defaultPrevented, true);
    assert.equal(state().correct, true);
    assert.equal(state().attempts, 2);
    const completed = state(), completedForm = w.document.getElementById('answer-form');
    assert.equal(submitButton(completedForm).disabled, true);
    enter(w, w.document.getElementById('final-answer'));
    completedForm.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    assert.deepEqual(state(), completed);

    const next = openTask(w, 'p10', 4);
    typeValue(w, w.document.getElementById('final-answer'), 60);
    const untouched = plain(w.PetersonApp.getState().tasks[next.id]);
    staleButton.click();
    staleForm.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    assert.deepEqual(plain(w.PetersonApp.getState().tasks[next.id]), untouched, 'old form cannot check a different active task');
  } finally { f.close(); }
});

test('guided choices and numeric Enter advance once and stale forms cannot act on another task', () => {
  const f = fixture({ query: '?cabinet=peterson-helper' }), w = f.window;
  try {
    const task = openTask(w, 'p10', 0), state = () => plain(w.PetersonApp.getState().tasks[task.id]);
    w.document.querySelector('[data-action="guided"]').click();
    let oldFirstForm, oldFirstButton;
    for (const index of [0, 1]) {
      const step = task.steps[index];
      assert.equal(step.kind, 'choice');
      w.document.querySelector('[data-step-form="' + index + '"] [data-choice="' + step.choices.indexOf(step.answer) + '"]').click();
      const form = w.document.querySelector('[data-step-form="' + index + '"]'), button = submitButton(form);
      if (index === 0) { oldFirstForm = form; oldFirstButton = button; }
      let nativeSubmits = 0;
      form.addEventListener('submit', () => nativeSubmits++);
      button.click();
      assert.equal(nativeSubmits, 0);
      assert.equal(state().step, index + 1);
      button.click();
      assert.equal(state().step, index + 1);
    }
    const input = w.document.querySelector('[data-step-input="2"]');
    assert(input);
    typeValue(w, input, task.steps[2].answer);
    assert.equal(enter(w, input).defaultPrevented, true);
    assert.equal(state().step, 3);
    enter(w, input);
    assert.equal(state().step, 3);
    assert.equal(state().correct, false, 'step work does not submit the final answer');

    const next = openTask(w, 'p10', 4), step = next.steps[0];
    w.document.querySelector('[data-action="guided"]').click();
    w.document.querySelector('[data-step-form="0"] [data-choice="' + step.choices.indexOf(step.answer) + '"]').click();
    const untouched = plain(w.PetersonApp.getState().tasks[next.id]);
    oldFirstButton.click();
    oldFirstForm.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    assert.deepEqual(plain(w.PetersonApp.getState().tasks[next.id]), untouched, 'same step index in a different task must not accept a stale callback');
    submitButton(w.document.querySelector('[data-step-form="0"]')).click();
    assert.equal(w.PetersonApp.getState().tasks[next.id].step, 1);
  } finally { f.close(); }
});
