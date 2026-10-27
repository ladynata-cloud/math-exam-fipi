'use strict';

// In-memory DOM regressions. This suite does not launch a browser or load the network.
// Install/provide jsdom externally, then run: node --test tools/peterson6-complete.dom.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://mathexam.test';
const BOOK = '/school/peterson6/textbook/';
const PRACTICE = '/trainers/peterson6-workshop/';
const BOOK_KEY = 'mathexam.peterson6.textbook.v1';
const PRACTICE_KEY = 'mathexam.peterson6.workshop.v1';

function localFile(url) {
  const target = new URL(url, ORIGIN);
  assert.equal(target.origin, ORIGIN, 'The DOM harness must not request external resources');
  const file = path.resolve(ROOT, '.' + decodeURIComponent(target.pathname));
  assert(!path.relative(ROOT, file).startsWith('..'), 'Resource must stay within the repository');
  return file;
}

async function until(predicate, message) {
  const deadline = Date.now() + 4000;
  while (!predicate()) {
    if (Date.now() > deadline) assert.fail(message);
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}

async function surface(t, pathname, stored = {}) {
  const url = new URL(pathname, ORIGIN);
  const base = url.pathname === BOOK ? BOOK : PRACTICE;
  assert.equal(url.pathname, base, 'Expected an application directory URL');
  const html = fs.readFileSync(localFile(base + 'index.html'), 'utf8');
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(html, {
    url: url.href,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole: console
  });
  const w = dom.window;
  const requests = [];
  for (const [key, value] of Object.entries(stored)) w.localStorage.setItem(key, value);
  // Fixed time keeps newly generated practice variants reproducible between runs.
  w.Date.now = () => 1793100000000;
  w.fetch = async input => {
    assert.equal(base, BOOK, 'Practice must work without a fetch request');
    const requested = new URL(String(input), w.location.href);
    requests.push(requested.pathname);
    assert.equal(path.extname(requested.pathname), '.json');
    const text = fs.readFileSync(localFile(requested.href), 'utf8');
    return { ok: true, json: async () => JSON.parse(text) };
  };
  // jsdom has no modal top layer. Preserve the browser's open/close DOM contract.
  w.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  w.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  // Full-page navigation is deliberately represented by opening a second DOM below.
  // The application's own click listener still runs and persists its origin/help state.
  w.document.addEventListener('click', event => {
    if (event.target.closest('a[href]')) event.preventDefault();
  });
  t.after(() => {
    w.close();
    assert.deepEqual(errors, [], 'Application must not throw DOM/runtime errors');
  });
  for (const script of w.document.querySelectorAll('script[src]')) {
    const scriptURL = new URL(script.getAttribute('src'), w.location.href);
    w.eval(fs.readFileSync(localFile(scriptURL.href), 'utf8') + '\n//# sourceURL=' + scriptURL.pathname);
  }
  await until(() => base === BOOK ? w.PetersonTextbookReady : w.PetersonPracticeReady,
    'Application did not become ready: ' + w.document.querySelector('main').textContent);
  assert.equal(requests.length, base === BOOK ? 4 : 0);
  return { w, document: w.document, requests };
}

function element(s, selector) {
  const node = s.document.querySelector(selector);
  assert(node, 'Missing UI element: ' + selector);
  return node;
}
function click(s, selector) {
  element(s, selector).dispatchEvent(new s.w.MouseEvent('click', { bubbles: true, cancelable: true }));
}
function input(s, selector, value) {
  const node = element(s, selector);
  node.value = value;
  node.dispatchEvent(new s.w.Event('input', { bubbles: true }));
}
function submit(s, selector) {
  element(s, selector).dispatchEvent(new s.w.Event('submit', { bubbles: true, cancelable: true }));
}
function storage(s) {
  return Object.fromEntries(Array.from({ length: s.w.localStorage.length }, (_, i) => {
    const key = s.w.localStorage.key(i);
    return [key, s.w.localStorage.getItem(key)];
  }));
}
function state(s, key) { return JSON.parse(s.w.localStorage.getItem(key)); }
function bookWork(s, id = '181-1') { return state(s, BOOK_KEY).parts[id]; }
function practiceWork(s) {
  const data = state(s, PRACTICE_KEY);
  const { skill, level } = data.last;
  const key = data.current[skill + '/' + level];
  return { data, key, record: data.records[key] };
}
async function route(s, hash) {
  if (s.w.location.hash === hash) return;
  let changed = false;
  s.w.addEventListener('hashchange', () => { changed = true; }, { once: true });
  s.w.location.hash = hash;
  await until(() => changed, 'Hash route did not finish: ' + hash);
}
function sourcePresent(s) {
  const pane = element(s, '.source-pane[aria-label="Полное условие и исходный рисунок"]');
  assert.equal(pane.hidden, false);
  assert.notEqual(pane.getAttribute('aria-hidden'), 'true');
  assert(pane.querySelector('svg[role="img"] image[href]'), 'Original source crop is always present');
  return pane;
}
function metrics(s) {
  return [...s.document.querySelectorAll('.metric-row .metric strong')].map(x => x.textContent.trim());
}
async function importFile(s, text) {
  const node = element(s, '#import-file');
  Object.defineProperty(node, 'files', {
    configurable: true,
    value: [{ size: Buffer.byteLength(text), text: async () => text }]
  });
  element(s, '#import-message').textContent = '';
  node.dispatchEvent(new s.w.Event('change', { bubbles: true }));
  await until(() => element(s, '#import-message').textContent.length > 0, 'Import did not finish');
}

test('textbook 181 keeps source, drafts, history and microsteps through help and reload', async t => {
  const s = await surface(t, BOOK + '#n/181/181-1');
  sourcePresent(s);
  assert.equal(bookWork(s).assisted, false);
  click(s, '[data-action="zoom"]');
  assert(element(s, '#source-dialog').open);
  assert(element(s, '#source-large svg image[href]'));
  assert.equal(bookWork(s).assisted, false, 'Reading or enlarging the condition is not help');
  click(s, '#close-source');
  assert.equal(element(s, '#source-dialog').open, false);

  input(s, '#answer', '7,6');
  element(s, '#note-details').open = true;
  element(s, '#note-details').dispatchEvent(new s.w.Event('toggle'));
  input(s, '#note', 'Сначала делю 1,5 на 1/3. Черновик не удалять.');
  click(s, '[data-action="guided"]');
  input(s, '#step-answer', '2');
  submit(s, '#step-form');
  assert.equal(bookWork(s).errors, 1);
  assert.equal(bookWork(s).step, 0);
  assert.equal(element(s, '#step-answer').value, '2');
  click(s, '[data-action="step-help"]');
  assert.equal(element(s, '#answer').value, '7,6');
  assert.equal(element(s, '#step-answer').value, '2');
  assert.match(element(s, '#note').value, /Черновик не удалять/);

  click(s, '[data-action="micro"]');
  input(s, '#micro-answer', '3/2'); // First convert 1.5 to an ordinary fraction.
  submit(s, '#micro-form');
  assert.equal(bookWork(s).micro[0].checked[0], true);
  assert.equal(bookWork(s).micro[0].drafts[0], '3/2');
  input(s, '#micro-answer', '3'); // Then take the reciprocal of the divisor 1/3.
  submit(s, '#micro-form');
  assert.equal(bookWork(s).micro[0].checked[1], true);
  assert.equal(bookWork(s).micro[0].drafts[1], '3');
  assert.equal(bookWork(s).correct, false, 'A microstep never completes the main task');
  assert.equal(element(s, '#answer').value, '7,6');
  click(s, '[data-action="micro-close"]');
  input(s, '#step-answer', '4,5');
  submit(s, '#step-form');
  assert.equal(bookWork(s).step, 1);
  assert.equal(bookWork(s).checked[0], true);
  assert.match(element(s, '.step-history').textContent, /4,5/);
  input(s, '#step-answer', '1,5');
  click(s, '[data-action="micro"]');
  input(s, '#micro-answer', '4');
  click(s, '[data-action="solution"]');
  click(s, '[data-action="solution"]');
  assert.equal(element(s, '#step-answer').value, '1,5');
  assert.equal(element(s, '#micro-answer').value, '4');
  sourcePresent(s);

  const restored = await surface(t, BOOK + '#n/181/181-1', storage(s));
  assert.equal(element(restored, '#answer').value, '7,6');
  assert.equal(element(restored, '#step-answer').value, '1,5');
  assert.equal(element(restored, '#micro-answer').value, '4');
  assert.equal(element(restored, '#note-details').open, true);
  assert.match(element(restored, '#note').value, /Черновик не удалять/);
  assert.match(element(restored, '.step-history').textContent, /4,5/);
  assert.equal(bookWork(restored).micro[0].checked[0], true);
  assert.equal(bookWork(restored).micro[0].checked[1], true);
  assert.equal(bookWork(restored).errors, 1);
  assert.equal(bookWork(restored).assisted, true);
  sourcePresent(restored);
  submit(restored, '#answer-form');
  assert.equal(bookWork(restored).correct, true);
  assert.equal(bookWork(restored).independent, false);
  await route(restored, '#progress');
  assert.deepEqual(metrics(restored).slice(0, 3), ['0', '1', '0']);
});

test('practice detour carries the exact source origin and returns to retained source inputs', async t => {
  const source = await surface(t, BOOK + '#n/181/181-1');
  input(source, '#answer', '7,6');
  input(source, '#note', 'Вернуться к этому ходу решения.');
  click(source, '[data-action="guided"]');
  input(source, '#step-answer', '4,5');
  const target = element(source, 'a[data-action="practice"]').getAttribute('href');
  const url = new URL(target, ORIGIN);
  assert.equal(url.searchParams.get('from'), '181');
  assert.equal(url.searchParams.get('part'), '181-1');
  assert.equal(url.hash, '#train/order-operations/1');
  click(source, 'a[data-action="practice"]');
  assert.equal(bookWork(source).assisted, true);

  const practice = await surface(t, target, storage(source));
  const back = element(practice, '.return-bar a').getAttribute('href');
  assert.equal(back, BOOK + '#n/181/181-1');
  assert.deepEqual(state(practice, PRACTICE_KEY).origin, { number: 181, part: '181-1' });
  input(practice, '#answer', '123');
  input(practice, '#note', 'Тренировочный черновик.');
  click(practice, '.return-bar a');
  const returned = await surface(t, back, storage(practice));
  assert.equal(element(returned, '#answer').value, '7,6');
  assert.equal(element(returned, '#step-answer').value, '4,5');
  assert.equal(element(returned, '#note').value, 'Вернуться к этому ходу решения.');
  assert(returned.w.localStorage.getItem(PRACTICE_KEY), 'Practice uses its own retained storage');
  sourcePresent(returned);
});

test('written source task 1 remains for human review even when its sample answer is entered', async t => {
  const s = await surface(t, BOOK + '#n/1/001-1');
  assert.equal(element(s, '#answer').tagName, 'TEXTAREA');
  input(s, '#answer', 'Луна не является спутником Земли.');
  submit(s, '#answer-form');
  const work = bookWork(s, '001-1');
  assert.equal(work.submitted, true);
  assert.equal(work.correct, false);
  assert.equal(work.independent, false);
  assert.match(element(s, '#feedback').textContent, /ждёт проверки учителем/);
  sourcePresent(s);
  await route(s, '#progress');
  assert.deepEqual(metrics(s).slice(0, 3), ['0', '0', '1']);
});

test('unreadable stored JSON is preserved while both apps allow temporary work', async t => {
  for (const [url, key] of [[BOOK + '#n/181/181-1', BOOK_KEY], [PRACTICE + '#train/meeting/1', PRACTICE_KEY]]) {
    const corrupt = '{broken: keep the original bytes';
    const s = await surface(t, url, { [key]: corrupt, unrelated: 'leave me alone' });
    assert.match(element(s, '#storage-warning').textContent, /не удалось прочитать/);
    input(s, '#answer', '15');
    input(s, '#note', 'Новая работа до восстановления старой.');
    click(s, '[data-action="guided"]');
    assert.equal(element(s, '#answer').value, '15');
    assert.match(element(s, '#note').value, /восстановления/);
    assert.equal(s.w.localStorage.getItem(key), corrupt, 'Do not replace unreadable original data');
    assert.equal(s.w.localStorage.getItem('unrelated'), 'leave me alone');
    assert.match(element(s, '#storage-warning').textContent, /без изменений/);
  }
});

test('all 37 practice skills render and a new variant retains the previous draft and notes', async t => {
  const s = await surface(t, PRACTICE + '#map');
  const skills = [...s.w.PetersonPractice.skills];
  assert.equal(skills.length, 37);
  assert.equal(s.document.querySelectorAll('.practice-map article').length, 37);
  for (const skill of skills) {
    await route(s, '#train/' + skill.id + '/1');
    assert.equal(element(s, 'h1').textContent, skill.title);
    assert(element(s, '.source-pane .problem').textContent.trim());
    const answer = element(s, '#answer');
    const draft = answer.tagName === 'SELECT' ? answer.options[1].value : '123/100';
    input(s, '#answer', draft);
    input(s, '#note', 'Сохранить предыдущий вариант: ' + skill.id);
    click(s, '[data-action="guided"]');
    assert(element(s, '.step-card'));
    const before = practiceWork(s);
    click(s, '[data-action="new"]');
    const after = practiceWork(s);
    assert.notEqual(after.key, before.key, skill.id + ' must provide a different condition');
    const previous = after.data.records[before.key];
    assert.equal(previous.work.draft, draft, skill.id + ' lost its previous answer');
    assert.equal(previous.work.note, 'Сохранить предыдущий вариант: ' + skill.id);
    assert.equal(previous.work.guided, true);
    assert.equal(previous.work.assisted, true);
    assert.equal(previous.completion, null);
    assert.equal(element(s, '#answer').value, '', 'A new condition must not inherit the old answer');
  }
  await route(s, '#progress');
  assert.deepEqual(metrics(s), ['0 / 37', '0', '0', '0']);
  assert.equal(s.requests.length, 0);
});

test('practice credits five distinct solutions, three independent, and never credits a repeat', async t => {
  const s = await surface(t, PRACTICE + '#train/meeting/1');
  const seen = new Set();
  for (let i = 0; i < 5; i++) {
    const current = practiceWork(s);
    assert(!seen.has(current.key));
    seen.add(current.key);
    const p = s.w.PetersonPractice.generate(current.record.skill, current.record.level, current.record.seed);
    if (i === 3) {
      const wrong = s.w.PetersonBook.M.answer(s.w.PetersonBook.M.operation('add', p.answer, 1));
      input(s, '#answer', wrong);
      submit(s, '#answer-form');
      assert.equal(practiceWork(s).record.work.errors, 1);
    }
    if (i === 4) click(s, '[data-action="rule"]');
    input(s, '#answer', p.answer);
    submit(s, '#answer-form');
    assert.match(element(s, '.practice-count').textContent,
      new RegExp('Разных решений: ' + (i + 1) + ' · самостоятельно: ' + Math.min(i + 1, 3)));
    const beforeRepeat = state(s, PRACTICE_KEY);
    submit(s, '#answer-form');
    assert.deepEqual(state(s, PRACTICE_KEY).records[current.key].completion,
      beforeRepeat.records[current.key].completion, 'A repeat must retain its first completion');
    assert.match(element(s, '#feedback').textContent, /Повтор не добавляет/);
    if (i === 0) {
      click(s, '[data-action="rule"]');
      assert.match(element(s, '.practice-count').textContent, /самостоятельно: 1/,
        'Reviewing help after completion does not erase the recorded first independent solution');
    }
    if (i < 4) click(s, '[data-action="new"]');
  }
  assert.match(element(s, '.practice-count').textContent, /тема готова/);
  const restored = await surface(t, PRACTICE + '#progress', storage(s));
  assert.deepEqual(metrics(restored), ['1 / 37', '5', '3', '2']);
});

test('corrupt practice imports leave the current progress and unsolved draft untouched', async t => {
  const s = await surface(t, PRACTICE + '#train/meeting/1');
  const first = practiceWork(s);
  const p = s.w.PetersonPractice.generate(first.record.skill, first.record.level, first.record.seed);
  input(s, '#answer', p.answer);
  submit(s, '#answer-form');
  click(s, '[data-action="new"]');
  input(s, '#answer', '19/7');
  input(s, '#note', 'Не удалять при повреждённом импорте.');
  const current = practiceWork(s);
  await route(s, '#progress');
  const raw = s.w.localStorage.getItem(PRACTICE_KEY);
  const altered = JSON.parse(raw);
  altered.records[current.key].seed = -1;
  for (const incoming of ['{not-json', JSON.stringify({ schema: 1, version: 'foreign', records: {} }), JSON.stringify(altered)]) {
    await importFile(s, incoming);
    assert.match(element(s, '#import-message').textContent, /Не удалось загрузить/);
    assert.equal(s.w.localStorage.getItem(PRACTICE_KEY), raw, 'Rejected import must not write anything');
    assert.deepEqual(metrics(s), ['0 / 37', '1', '1', '0']);
  }
  await route(s, '#train/meeting/1');
  assert.equal(element(s, '#answer').value, '19/7');
  assert.equal(element(s, '#note').value, 'Не удалять при повреждённом импорте.');
  assert.equal(practiceWork(s).key, current.key);
});
