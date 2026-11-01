'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.resolve(__dirname, '..');
function page(t, file, { query = '', saved = {} } = {}) {
  const errors = [], logs = [], timers = new Map();
  let timerId = 0;
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error.message));
  vc.on('log', (...args) => logs.push(args.join(' ')));
  const html = fs.readFileSync(path.join(root, 'ege-profil/trainers', file), 'utf8');
  const dom = new JSDOM(html, {
    url: 'https://mathexam.space/ege-profil/trainers/' + file + query,
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      for (const [key, value] of Object.entries(saved)) w.localStorage.setItem(key, JSON.stringify(value));
      w.setTimeout = fn => { const id = ++timerId; timers.set(id, fn); return id; };
      w.clearTimeout = id => timers.delete(id);
      w.setInterval = () => 0;
      w.clearInterval = () => {};
    }
  });
  t.after(() => { assert.deepEqual(errors, []); dom.window.close(); });
  return { w: dom.window, d: dom.window.document, timers, logs, html };
}
function click(d, selector) { const node = d.querySelector(selector); assert.ok(node, selector); node.click(); return node; }
function read(w, key) { return JSON.parse(w.localStorage.getItem(key)); }
function requestCourseHelp(w) {
  w.document.dispatchEvent(new w.CustomEvent('profile-course-help-requested', {
    detail: { path: w.location.pathname, lessonId: 'bridge-signs' }
  }));
}

test('derivative reference preserves the visible model and states the x³ exception correctly', t => {
  const { w, d, html } = page(t, 'derivative-t8.html');
  assert.match(d.title, /Задание 9/);
  assert.equal(d.querySelector('#derivativeReference').open, false);
  assert.equal(d.querySelector('#heroFig').closest('details'), null);
  assert.equal(d.querySelector('#heroX').closest('details'), null);
  assert.equal(d.querySelectorAll('#heroFig svg').length, 2);
  const note = d.querySelector('#derivativeReference').textContent;
  assert.match(note, /x³ возрастает/);
  assert.match(note, /f′\(0\) = 0/);
  assert.doesNotMatch(note, /возрастает ⇔/);
  assert.doesNotMatch(html, /нули f — это вершины|Нули производной — это вершины|x — расстояние/);
  assert.match(html, /x — координата в метрах/);
  const slider = d.querySelector('#heroX'); slider.value = '1'; slider.dispatchEvent(new w.Event('input'));
  assert.match(d.querySelector('#heroInfo').textContent, /касательная горизонтальна/);
  assert.equal(d.querySelector('#trackRule').closest('details').open, false);
});

test('derivative keeps its 2400-case independent mathematical selftest passing', t => {
  const { logs } = page(t, 'derivative-t8.html', { query: '?selftest=1' });
  assert.ok(logs.some(line => /DERIVATIVE_T8_SELFTEST_OK · задач: 2400 · ошибок: 0/.test(line)), logs.join('\n'));
});

test('derivative wrong answer does not reveal the answer and a restart cancels stale transitions', t => {
  const saved = { 'derivative-t8': { runs: 3, best: 9, passed: true, solvedByType: { tangent: 4 } }, other: { best: 8 } };
  const { w, d, timers } = page(t, 'derivative-t8.html', { saved: { 'mathExamCourseProgress.v1': saved } });
  d.querySelector('#taskAnswer').value = '-999999'; click(d, '#taskCheck');
  assert.doesNotMatch(d.querySelector('#taskFb').textContent, /Правильный ответ|Ответ:/);
  assert.equal(d.querySelector('#taskSolBox').textContent, '');
  click(d, '#examStart');
  d.querySelector('#examAnswer').value = '-999999';
  for (let i = 0; i < 6; i++) click(d, '#examCheck');
  assert.doesNotMatch(d.querySelector('#examFb').textContent, /Правильный ответ|Ответ:/);
  assert.equal(timers.size, 1, 'one transition for one answer');
  click(d, '#examStart');
  assert.equal(timers.size, 0, 'old task cannot replace the restarted task');
  assert.match(d.querySelector('#examText').textContent, /^1 из 10\./);
  const result = read(w, 'mathExamCourseProgress.v1');
  assert.equal(result['derivative-t8'].passed, true);
  assert.equal(result['derivative-t8'].best, 9);
  assert.deepEqual(result['derivative-t8'].solvedByType, { tangent: 4 });
  assert.deepEqual(result.other, saved.other);
});

test('trigonometry course links open the requested existing track without changing progress', t => {
  for (const [topic, track] of [['equations', 'eq'], ['values', 'table']]) {
    const saved = { xp: { eq: 4, table: 3 }, exam: { n: 8, ok: 6, streak: 1, best: 5 }, byTrack: {}, level: 'pro' };
    const { w, d } = page(t, 'trigonometry.html', { query: '?topic=' + topic, saved: { ep_progress_v1: saved } });
    assert.equal(d.querySelector('.panel.on').id, 'ege');
    assert.equal(d.querySelector('#ege .ep-view.on').dataset.view, track);
    assert.equal(d.querySelectorAll('#ege .ep-view.on .ep-step').length, 1);
    assert.deepEqual(read(w, 'ep_progress_v1'), saved);
    assert.equal(d.querySelector('.kim-ref').open, false);
    assert.doesNotMatch(d.querySelector('.kim-ref summary').textContent, /выдают на экзамене/);
  }
});

test('a completed derivative result is saved before its delayed result screen', t => {
  const { w, d, timers } = page(t, 'derivative-t8.html');
  // This test isolates the exam state machine; the independent generator
  // selftest above supplies the mathematical-answer coverage.
  w.T8.eq = () => true;
  click(d, '#examStart');
  for (let i = 0; i < 10; i++) {
    d.querySelector('#examAnswer').value = '1'; click(d, '#examCheck');
    if (i < 9) {
      const [id, callback] = [...timers][0]; timers.delete(id); callback();
    }
  }
  assert.equal(read(w, 'mathExamCourseProgress.v1')['derivative-t8'].best, 10);
  click(d, '#examStart');
  assert.equal(timers.size, 0);
  assert.equal(read(w, 'mathExamCourseProgress.v1')['derivative-t8'].passed, true);
  assert.equal(read(w, 'mathExamCourseProgress.v1')['derivative-t8'].best, 10);
});

test('a wrong introductory quiz answer reveals its explanation only on request', t => {
  const { w, d } = page(t, 'trigonometry.html');
  w.Math.random = () => 0.01;
  click(d, '#qFilter [data-f="8"]');
  const wrong = [...d.querySelectorAll('#qAnswers button')].find(button => button.textContent.trim() === 'прилежащий / гипотенуза');
  assert.ok(wrong); wrong.click();
  assert.equal(d.querySelectorAll('#qAnswers .correct').length, 0);
  assert.doesNotMatch(d.querySelector('#qFeedback').textContent, /Синус =/);
  assert.equal(d.querySelector('#qSolution').hidden, false);
  click(d, '#qSolution');
  assert.equal(d.querySelectorAll('#qAnswers .correct').length, 1);
  assert.match(d.querySelector('#qFeedback').textContent, /Синус =/);
});

test('guided trigonometry gives hints and step answers only after a request', t => {
  const { w, d } = page(t, 'trigonometry.html', { query: '?topic=values' });
  w.eval(`EPCore.GEN.rad = () => ({track:'rad',cond:'Выберите число один.',ans:'1',num:1,
    steps:[{q:'Число один?',type:'choice',opts:['1','2','3','4'],ok:'1',hint:'Начало натурального ряда.'}]});`);
  click(d, '#ege [data-v="rad"]');
  const step = d.querySelector('#ege .ep-view.on .ep-step');
  [...step.querySelectorAll('.ep-opt')].find(option => option.textContent === '2').click();
  [...step.querySelectorAll('.ep-opt')].find(option => option.textContent === '3').click();
  assert.equal(step.querySelector('.ep-hint').classList.contains('on'), false);
  assert.equal(step.querySelector('.ep-reveal'), null);
  const show = [...step.querySelectorAll('button')].find(button => button.textContent === 'Показать ответ шага');
  assert.ok(show); show.click();
  assert.ok(step.querySelector('.ep-reveal'));
});

test('exam answers revealed on request do not become independent successes', t => {
  const saved = { xp: { table: 4 }, exam: { n: 8, ok: 6, streak: 2, best: 5 }, byTrack: {}, level: 'base' };
  const { w, d } = page(t, 'trigonometry.html', { saved: { ep_progress_v1: saved } });
  w.eval(`EP_ARCHIVE.length = 0; Object.keys(EPCore.GEN).forEach(key => {
    EPCore.GEN[key] = () => ({ track: 'table', cond: 'Найдите 5 + 2.', ans: '7', num: 7,
      sol: '5 + 2 = 7. Ответ: 7.', steps: [{ q: 'Сколько будет 5 + 2?', type: 'input', val: 7, canon: '7', hint: 'Сложите числа.' }] });
  });`);
  click(d, '#ege [data-v="exam"]');
  d.querySelector('#epExInput').value = '-999999'; click(d, '#epExCheck');
  assert.doesNotMatch(d.querySelector('#epExFb').textContent, /7|Правильный ответ/);
  assert.equal(d.querySelector('#epExSolBox').textContent, '');
  click(d, '#epExNext'); click(d, '#epExSol');
  assert.match(d.querySelector('#epExSolBox').textContent, /Ответ: 7/);
  d.querySelector('#epExInput').value = '7'; click(d, '#epExCheck');
  assert.match(d.querySelector('#epExFb').textContent, /с помощью/);
  let result = read(w, 'ep_progress_v1');
  assert.equal(result.exam.ok, 6); assert.equal(result.exam.best, 5); assert.equal(result.xp.table, 4);
  click(d, '#epExNext'); d.querySelector('#epExInput').value = '7';
  for (let i = 0; i < 4; i++) click(d, '#epExCheck');
  result = read(w, 'ep_progress_v1');
  assert.equal(result.exam.ok, 7); assert.equal(result.exam.n, 11);
});

test('selected course help marks only the current derivative tasks as assisted', t => {
  const saved = { 'derivative-t8': { runs: 3, best: 10, passed: true, solvedByType: { tangent: 4 } }, other: { best: 8 } };
  const { w, d, timers } = page(t, 'derivative-t8.html', { saved: { 'mathExamCourseProgress.v1': saved } });
  w.T8.eq = () => true;
  click(d, '#examStart'); requestCourseHelp(w);
  d.querySelector('#taskAnswer').value = '1'; click(d, '#taskCheck');
  assert.match(d.querySelector('#taskFb').textContent, /с помощью повторения/);
  assert.deepEqual(read(w, 'mathExamCourseProgress.v1')['derivative-t8'].solvedByType, { tangent: 4 });
  d.querySelector('#examAnswer').value = '1'; click(d, '#examCheck');
  assert.match(d.querySelector('#examFb').textContent, /не добавляет балл/);
  assert.equal(d.querySelectorAll('#examDots .ok').length, 0);
  const [id, callback] = [...timers][0]; timers.delete(id); callback();
  d.querySelector('#examAnswer').value = '1'; click(d, '#examCheck');
  assert.equal(d.querySelectorAll('#examDots .ok').length, 1, 'next exam task is independent again');
  click(d, '#taskNext'); d.querySelector('#taskAnswer').value = '1'; click(d, '#taskCheck');
  const result = read(w, 'mathExamCourseProgress.v1');
  assert.equal(Object.values(result['derivative-t8'].solvedByType).reduce((sum, n) => sum + n, 0), 5);
  assert.equal(result['derivative-t8'].best, 10); assert.equal(result['derivative-t8'].passed, true);
  assert.deepEqual(result.other, saved.other);
});

test('selected course help excludes only the current trig practice and exam successes', t => {
  const saved = { xp: { rad: 2 }, exam: { n: 8, ok: 6, streak: 2, best: 5 }, byTrack: {}, level: 'base' };
  const { w, d } = page(t, 'trigonometry.html', { saved: { ep_progress_v1: saved } });
  w.eval(`EP_ARCHIVE.length = 0; Object.keys(EPCore.GEN).forEach(key => {
    EPCore.GEN[key] = () => ({ track: 'rad', cond: 'Найдите 5 + 2.', ans: '7', num: 7,
      sol: '5 + 2 = 7.', steps: [{ q: 'Сколько будет 5 + 2?', type: 'input', val: 7, canon: '7', hint: 'Сложите числа.' }] });
  });`);
  click(d, '#ege [data-v="rad"]'); requestCourseHelp(w);
  let host = d.querySelector('#ege .ep-view.on .ep-ghost');
  host.querySelector('input').value = '7';
  [...host.querySelectorAll('button')].find(button => button.textContent === 'Проверить').click();
  assert.match(host.querySelector('.ep-done').textContent, /с помощью/);
  assert.equal(read(w, 'ep_progress_v1').xp.rad, 2);
  [...host.querySelectorAll('button')].find(button => button.textContent === 'Новая задача').click();
  host.querySelector('input').value = '7';
  [...host.querySelectorAll('button')].find(button => button.textContent === 'Проверить').click();
  assert.equal(read(w, 'ep_progress_v1').xp.rad, 3, 'new guided task gets a fresh help token');
  click(d, '#ege [data-v="exam"]'); requestCourseHelp(w);
  d.querySelector('#epExInput').value = '7'; click(d, '#epExCheck');
  assert.match(d.querySelector('#epExFb').textContent, /с помощью/);
  assert.equal(read(w, 'ep_progress_v1').exam.ok, 6);
  click(d, '#epExNext'); d.querySelector('#epExInput').value = '7'; click(d, '#epExCheck');
  const result = read(w, 'ep_progress_v1');
  assert.equal(result.exam.ok, 7); assert.equal(result.exam.best, 5); assert.equal(result.xp.rad, 3);
});
