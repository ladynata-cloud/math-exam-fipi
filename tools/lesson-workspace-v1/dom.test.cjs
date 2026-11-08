'use strict';

// Pure UI-state tests complement, and never replace, the real browser gate.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync(path.resolve(__dirname, '../../learning/lesson-workspace.js'), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
function setup(t, options = {}) {
  const dom = new JSDOM('<main id="main"><section id="picker"></section></main>', { url: 'https://cabinet.example.test/learning/', runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  let network = 0;
  dom.window.fetch = () => { network++; throw Error('The selection UI must not write pupil work'); };
  dom.window.eval(source);
  const rows = Array.from({ length: 15 }, (_, index) => ({ id: 'fixture:' + index, trainerId: 'ege-path',
    contentId: 'fixture-' + index, title: 'Учебная задача ' + index, url: '/ege-baza/path/' }));
  rows.push({ id: 'unsupported', trainerId: 'external', contentId: 'external', title: 'Неподключённый материал' });
  rows.push({ id: 'board', trainerId: 'board', contentId: 'board', title: 'Доска', url: '/trainers/trainer-board.html' });
  const catalog = { items: rows, get: id => rows.find(row => row.id === id) };
  const ui = dom.window.LearningLessonWorkspace;
  const host = dom.window.document.querySelector('#picker');
  const picker = ui.materialPicker(host, { catalog, ...options });
  const search = query => {
    const input = host.querySelector('[data-lesson-material-search]');
    input.value = query; input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  };
  const choose = index => {
    search('fixture-' + index);
    const button = host.querySelector('[data-lesson-material-result="fixture:' + index + '"]');
    assert(button, 'Search must expose the exact selected catalogue identity'); button.click();
  };
  return { window: dom.window, host, ui, picker, catalog, search, choose, network: () => network };
}

test('search and selection keep exact descriptors locally, with no pupil writes', t => {
  const f = setup(t);
  f.choose(1); f.choose(10);
  assert.deepEqual(clone(f.picker.value()), [{ trainerId: 'ege-path', contentId: 'fixture-1' }, { trainerId: 'ege-path', contentId: 'fixture-10' }]);
  assert.equal(f.host.querySelectorAll('[data-lesson-materials] li').length, 2);
  assert.equal(f.network(), 0);
  f.search('Неподключённый материал');
  assert.equal(f.host.querySelectorAll('[data-lesson-material-result]').length, 0, 'Unsupported external material is not silently treated as managed');
  assert.match(f.host.querySelector('[data-lesson-material-message]').textContent, /Ничего не найдено/);
  f.search('Доска'); assert.equal(f.host.querySelectorAll('[data-lesson-material-result]').length, 0);
});

test('order and removal preserve the remaining material identities', t => {
  const f = setup(t); f.choose(2); f.choose(7); f.choose(11);
  f.host.querySelector('[data-lesson-material-move="2"]').click();
  assert.deepEqual(clone(f.picker.value()).map(item => item.contentId), ['fixture-2', 'fixture-11', 'fixture-7']);
  f.host.querySelector('[data-lesson-material-remove="0"]').click();
  assert.deepEqual(clone(f.picker.value()).map(item => item.contentId), ['fixture-11', 'fixture-7']);
  assert.equal(f.host.querySelector('[data-lesson-material-move="0"]').disabled, true);
});

test('the twelve-material limit is enforced by UI and retained handlers', t => {
  const f = setup(t);
  for (let index = 0; index < 12; index++) f.choose(index);
  f.search('fixture-14'); const thirteenth = f.host.querySelector('[data-lesson-material-result="fixture:14"]');
  assert.equal(thirteenth.disabled, true); thirteenth.onclick();
  assert.equal(f.picker.value().length, 12, 'Calling a retained handler cannot bypass the bound');
  assert.match(f.host.querySelector('[data-lesson-material-message]').textContent, /12 заданий/);
  f.host.querySelector('[data-lesson-material-remove="1"]').click(); f.choose(14);
  assert.equal(f.picker.value().length, 12);
});

test('exact source and seed descriptors are copied without credentials or UI labels', t => {
  const initial = [{ sourceAttemptId: 'exact-source', trainerId: 'ege-path', contentId: 'fixture-1', title: 'Точное условие' },
    { trainerId: 'ege-path', contentId: 'fixture-2', seed: 42, title: 'Вариант' }];
  const before = clone(initial), f = setup(t, { initial });
  initial[0].sourceAttemptId = 'changed-outside';
  const descriptors = clone(f.picker.value());
  assert.deepEqual(descriptors, [{ sourceAttemptId: before[0].sourceAttemptId }, { trainerId: 'ege-path', contentId: 'fixture-2', seed: 42 }]);
  descriptors[1].seed = 13;
  assert.equal(f.picker.value()[1].seed, 42, 'Returned mutable value cannot corrupt the picker');
});

test('detached, disposed and stale picker handlers cannot change another pupil context', t => {
  let current = true;
  const f = setup(t, { isCurrent: () => current }); f.choose(1); f.search('fixture-2');
  const retained = f.host.querySelector('[data-lesson-material-result="fixture:2"]').onclick;
  current = false; retained(); assert.equal(f.picker.value().length, 1);
  current = true; f.host.remove(); retained(); assert.equal(f.picker.value().length, 1);
  f.window.document.querySelector('#main').append(f.host);
  f.picker.destroy(); retained(); assert.equal(f.picker.value().length, 1);
});

test('queue controls show the authoritative active material and lock while busy', t => {
  const f = setup(t), seat = { attemptId: 'attempt-a', materials: [
    { attemptId: 'attempt-a', title: '<script>wrong()</script>' }, { attemptId: 'attempt-b', title: 'Проценты' }
  ] };
  f.host.innerHTML = f.ui.queueMarkup(seat, { teacher: true });
  assert.equal(f.host.querySelector('script'), null, 'Material labels are text, never executable HTML');
  assert.equal(f.host.querySelector('[data-lesson-material="attempt-a"]').getAttribute('aria-current'), 'step');
  assert.equal(f.host.querySelector('[data-lesson-material="attempt-a"]').disabled, true);
  assert.equal(f.host.querySelector('[data-lesson-material="attempt-b"]').disabled, false);
  f.host.innerHTML = f.ui.queueMarkup(seat, { teacher: true, busy: true });
  assert([...f.host.querySelectorAll('button')].every(button => button.disabled));
  f.host.innerHTML = f.ui.queueMarkup(seat, { teacher: false });
  assert.equal(f.host.querySelector('button'), null, 'Pupil progress copy cannot acquire teacher switching controls');
  assert.match(f.host.textContent, /1 из 2/);
});

test('the join entry uses the latest permitted lesson and stays unique', t => {
  const f = setup(t), host = f.window.document.querySelector('#main');
  const old = { id: 'old-lesson', title: 'Прошлый урок', createdAt: 1000000000000 };
  const latest = { id: 'latest-lesson', title: '<img src=x onerror=wrong()>', createdAt: 1800000000000 };
  f.ui.joinEntry(host, [latest, old]);
  assert.equal(host.querySelector('#lesson-join-link').getAttribute('href'), '#lesson=latest-lesson');
  assert.equal(host.querySelector('#lesson-join-entry img'), null);
  f.ui.joinEntry(host, [old, latest]); assert.equal(host.querySelectorAll('#lesson-join-entry').length, 1);
  f.ui.joinEntry(host, []); assert.equal(host.querySelector('#lesson-join-entry'), null, 'A new pupil context does not retain another pupil’s join link');
});
