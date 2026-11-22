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
  const pane = element(s, '.source-pane[aria-label="Материалы к номеру"]');
  assert.equal(pane.hidden, false);
  assert.notEqual(pane.getAttribute('aria-hidden'), 'true');
  assert(pane.querySelector('[data-book-reference]'), 'Each item retains its printed reference');
  assert.equal(pane.querySelector('img, image[href]'),null);
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
  assert(element(s, '#source-large [data-book-reference]'));
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
  assert.deepEqual(metrics(restored), ['0', '0', '1', '0', '0']);
});

test('workbook separates a self-correction from using a hint across reload', async t => {
  const book = await surface(t, BOOK + '#n/181/181-1');
  input(book, '#answer', '17');
  submit(book, '#answer-form');
  input(book, '#answer', '7,6');
  submit(book, '#answer-form');
  assert.match(element(book, '#feedback').textContent, /Исправлено без подсказки/);
  assert.equal(bookWork(book).firstErrors.final, '17');
  const restored = await surface(t, BOOK + '#n/181/181-1', storage(book));
  assert.match(element(restored, 'article .badge').textContent, /Исправлено без подсказки/);
  await route(restored, '#progress');
  assert.deepEqual(metrics(restored), ['0', '1', '0', '0', '0']);
  await route(restored, '#map');
  assert.match(restored.document.body.textContent, /Подпунктов решено: 1 \//);
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
  assert.deepEqual(metrics(s), ['0', '0', '0', '1', '0']);
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
  assert.deepEqual(metrics(s), ['0 / 37', '0', '0', '0', '0']);
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
    if (i === 3) assert.match(element(s, 'article .badge').textContent, /Исправлено без подсказки/);
    if (i === 4) assert.match(element(s, 'article .badge').textContent, /Решено с помощью/);
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
  assert.deepEqual(metrics(restored), ['1 / 37', '5', '3', '1', '1']);
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
    assert.deepEqual(metrics(s), ['0 / 37', '1', '1', '0', '0']);
  }
  await route(s, '#train/meeting/1');
  assert.equal(element(s, '#answer').value, '19/7');
  assert.equal(element(s, '#note').value, 'Не удалять при повреждённом импорте.');
  assert.equal(practiceWork(s).key, current.key);
});

test('local book reference, independent figures, and printed-page numbers follow the chosen part',async t=>{
 const s=await surface(t,BOOK+'#n/240/240-1');
 assert.match(element(s,'[data-book-reference]').textContent,/№ 240/);
 assert.equal(s.document.querySelectorAll('.companion-diagram svg line').length,16);
 assert(element(s,'#personal-pdf'));
 await route(s,'#n/293/293-b');
 assert.equal(s.document.querySelectorAll('.companion-diagram svg polygon').length,2);
 assert.match(element(s,'[data-book-reference]').textContent,/№ 293/);
 await route(s,'#n/497/497-b');
 assert.match(element(s,'.source-pane .problem').textContent,/5000.*8%/);
 const s2=await surface(t,BOOK+'#n/420/420-3');
 assert.match(element(s2,'.source-pane .problem').textContent,/основаниями 8 и 13 м/);
});

test('a child solves an altered-condition example without the book, separate from the original',async t=>{
 const s=await surface(t,BOOK+'#n/497/497-b');
 const panel=element(s,'.equivalent-exercise');
 panel.open=true;
 const field=panel.querySelector('input,select');
 const source=s.w.PetersonAnalogues.create(497,{id:'497-b',skill:'compound-growth',kind:'numeric'});
 field.value=String(source.answer);
 field.dispatchEvent(new s.w.Event('input',{bubbles:true}));
 panel.querySelector('form').dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));
 assert.match(panel.querySelector('[role=status]').textContent,/самостоятельно/);
 assert.equal(bookWork(s,'497-b').correct,false);
 const back=await surface(t,BOOK+'#n/497/497-b',storage(s));
 assert.match(element(back,'.equivalent-exercise [role=status]').textContent,/самостоятельно/);
});

test('all opening negations and the Euler diagram are available without a printed copy', async t => {
  const s = await surface(t, BOOK + '#n/1/001-1');
  const bank = JSON.parse(fs.readFileSync(path.join(ROOT, 'school/peterson6/textbook/content/001-175.json'))).exercises;
  let count = 0;
  for (const exercise of bank.slice(0, 6)) {
    for (const part of exercise.parts) {
      await route(s, '#n/' + exercise.number + '/' + part.id);
      const pane = sourcePresent(s);
      assert.match(pane.textContent, /Всё условие для этого подпункта/);
      assert(pane.querySelector('.problem').textContent.length > 50, part.id);
      if (exercise.number === 6) {
        assert.equal(pane.querySelectorAll('svg ellipse').length, 3);
        assert.equal(pane.querySelectorAll('svg circle').length, 2);
        assert(pane.querySelector('.problem').textContent.includes(part.prompt));
      }
      const work = bookWork(s, part.id);
      assert(!work?.correct && !work?.independent && !work?.submitted, part.id);
      count++;
    }
  }
  assert.equal(count, 41);
});

test('page 7 runs all 13 source parts, accepts grouped dictation and keeps written work outside mastery',async t=>{
 const s=await surface(t,BOOK+'#map'),items=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises.slice(6,10);
 assert.equal(element(s,'[aria-label="Самостоятельная работа на странице 7"]').querySelectorAll('a').length,4);
 for(const item of items)for(const part of item.parts){
  await route(s,'#n/'+item.number+'/'+part.id);
  const pane=sourcePresent(s);assert.match(pane.textContent,/Всё условие/);assert(pane.querySelector('figure'));
  assert.match(element(s,'.equivalent-exercise summary').textContent,/Авторский пример/);assert(!bookWork(s,part.id)?.correct);
  const inputValue=part.id==='010-a'?'6 702 058':part.id==='010-b'?'7 4/5':part.id==='010-v'?'3,00012':part.answer.replace(/\.$/,'');
  if(item.number===7||item.number===8){input(s,'#answer',item.number===7?'0; 1':'0');submit(s,'#answer-form');assert(!bookWork(s,part.id).correct);}
  input(s,'#answer',inputValue);submit(s,'#answer-form');const work=bookWork(s,part.id);
  if(item.number===10){assert.equal(work.correct,true,part.id);assert.equal(work.independent,true,part.id);}
  else {assert.equal(work.correct,false,part.id);assert.equal(work.submitted,true,part.id);assert(!work.independent);assert(element(s,'.feedback.ok').textContent.trim());}
  const variants=new Set();
  for(let attempt=0;attempt<3;attempt++){
   const model=s.w.PetersonAnalogues.create(item.number,part,attempt);
   assert.equal(model.match,'skill');assert.equal(model.family,'page7-'+part.id);
   assert(s.w.PetersonBook.check(model,model.answer));variants.add(model.prompt);
  }
  assert.equal(variants.size,3,part.id);
 }
});
test('existing page-seven chapter attempts preserve their original prompt, draft, correction and solution when extending practice',async t=>{
 const part=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises[6].parts[0],id=part.id,key='mathexam.peterson6.analogue.v1.'+id,attempt=2;
 const s=await surface(t,BOOK+'#n/7/'+id),w=s.w;
 let hash=2166136261;for(const ch of id+'|'+attempt)hash=Math.imul(hash^ch.charCodeAt(0),16777619);hash>>>=0;
 const legacy={...w.PetersonPractice.generate('logic-negation',1+hash%3,hash),id:'analog-'+id+'-'+attempt},stored=w.PetersonBook.blank(legacy);
 stored.note='Сохранилась запись из старой тренировки.';w.PetersonBook.submit(legacy,stored,legacy.answer);
 const prior=await surface(t,BOOK+'#n/7/'+id,{[key]:JSON.stringify({attempt,work:stored})});
 assert.equal(element(prior,'.equivalent-exercise .problem').textContent,legacy.prompt);
 const answer=element(prior,'.analogue-form input,.analogue-form select');assert.equal(answer.value,String(legacy.answer));assert.match(element(prior,'.equivalent-exercise [role=status]').textContent,/самостоятельно/i);
 const old=prior.w.PetersonAnalogues.create(7,part,attempt,stored);assert.equal(old.match,'chapter');assert.equal(prior.w.PetersonBook.sanitize(old,stored).note,stored.note);
 element(prior,'.equivalent-exercise button[type=button]').click();
 const current=state(prior,key);assert.equal(current.earlier.work.note,stored.note);assert.equal(current.earlier.work.draft,stored.draft);assert(current.earlier.work.correct);assert.match(element(prior,'.earlier-practice').textContent,/Сохранилась запись/);assert.equal(current.attempt,attempt+1);assert(!current.work.correct);assert.notEqual(current.work.signature,stored.signature);assert.equal(element(prior,'.equivalent-exercise .problem').textContent,prior.w.PetersonAnalogues.create(7,part,attempt+1).prompt);
 const draft=element(prior,'.analogue-form input');draft.value='22';draft.dispatchEvent(new prior.w.Event('input',{bubbles:true}));const reload=await surface(t,BOOK+'#n/7/'+id,storage(prior));assert.equal(element(reload,'.analogue-form input').value,'22');assert(element(reload,'.earlier-practice').textContent.includes(legacy.prompt));
 const partial=w.PetersonBook.blank(legacy);partial.draft=String(legacy.choices.find(value=>value!==legacy.answer));partial.note='Мой черновик до обновления.';
 const draftOnly=await surface(t,BOOK+'#n/7/'+id,{[key]:JSON.stringify({attempt,work:partial})});
 assert.equal(element(draftOnly,'.analogue-form select').value,partial.draft);assert.equal(element(draftOnly,'.equivalent-exercise .problem').textContent,legacy.prompt);
 element(draftOnly,'.equivalent-exercise button[type=button]').click();assert.equal(state(draftOnly,key).earlier.work.note,partial.note);assert(!state(draftOnly,key).earlier.work.correct);

});
test('printed 11–13 retain exact source values, independent decimal models and different arithmetic on retry',async t=>{
 const s=await surface(t,BOOK+'#map'),bank=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises.slice(10,13);
 const expected=[['1.5','6.6','1.5','3.28','1.4','1.93','7.8','19.38','2.7','60','0.087','1.08','0.6','720','7','0.3'],['36.3636','1000','7.777','330.013','0.21714','1525.939','4.08','0.0055'],['10','9.1']];
 const plan=element(s,'[aria-label="Действия с десятичными дробями на страницах 7 и 8"]');assert.equal(plan.querySelectorAll('a').length,3);
 const independent=n=>typeof n==='object'?({add:(a,b)=>a+b,subtract:(a,b)=>a-b,multiply:(a,b)=>a*b,divide:(a,b)=>a/b})[n.op](independent(n.left),independent(n.right)):Number(String(n).replace(',','.'));
 for(const [j,item] of bank.entries())for(const [i,part] of item.parts.entries()){
  await route(s,'#n/'+item.number+'/'+part.id);assert(s.w.PetersonBook.check(part,expected[j][i]),part.id);
  const select=element(s,'[data-decimal-position]');select.value='1';select.dispatchEvent(new s.w.Event('change',{bubbles:true}));assert.equal(bookWork(s,part.id).decimalView,1);assert(!bookWork(s,part.id).assisted);assert(!bookWork(s,part.id).correct);
  const variants=new Set();
  for(let attempt=0;attempt<8;attempt++){
   const m=s.w.PetersonAnalogues.create(item.number,part,attempt),a=s.w.PetersonBook.M.parse(m.answer);
   assert.equal(m.kind,'expression');assert(Math.abs(independent(m.expression)-a.n/a.d)<1e-8,part.id);assert.notEqual(JSON.stringify(m.expression),JSON.stringify(part.expression));variants.add(JSON.stringify(m.expression));
  }
  assert.equal(variants.size,8);input(s,'#answer',expected[j][i]);submit(s,'#answer-form');assert(bookWork(s,part.id).independent,part.id);
 }
 const p=bank[0].parts[0];await route(s,'#n/11/'+p.id);
 const old=s.w.PetersonBook.blank(p);old.note='Черновик к исходному выражению.';s.w.PetersonBook.submit(p,old,'1,5');
 const stable=s.w.PetersonBook.sanitize(p,old);assert.equal(stable.note,old.note);assert(stable.independent);assert.equal(stable.decimalView,undefined);
});
test('page 8 statement endings, place-value comparisons and fraction methods agree with the issued volume',async t=>{
 const s=await surface(t,BOOK+'#map'),bank=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises.slice(13,16),answers=[['в) 79 398','б) 0','а) 8','б) 6','в) 9','б) сложения','б) 83 004 020','б) 350 807','вбабвббб.'],['>','>','<','<','>','<'],['>','<','>','<','<']];
 assert.equal(element(s,'[aria-label="Задания на странице 8"]').querySelectorAll('a').length,5);
 for(const [j,item] of bank.entries())for(const [i,p] of item.parts.entries()){
  assert.equal(p.answer,answers[j][i]);await route(s,'#n/'+item.number+'/'+p.id);
  const pane=sourcePresent(s);assert.match(pane.textContent,/Всё условие/);assert(pane.querySelector('figure'));
  assert(pane.querySelector('.problem').textContent.length>35);
  for(let n=0;n<8;n++){const model=s.w.PetersonAnalogues.create(item.number,p,n);assert.equal(model.family,'comparison-'+p.id);assert(s.w.PetersonBook.check(model,model.answer));
   if(item.number!==14){const match=model.prompt.match(/Сравни (.+?) и (.+?)\./);assert(match);
    const value=v=>{const [a,b]=v.replace(/,/g,'.').split('/');return Number(a)/(b===undefined?1:Number(b));};
    const v1=value(match[1]),v2=value(match[2]);assert.equal(model.answer,v1===v2?'=':v1<v2?'<':'>');
   }
  }
  if(item.number===16){const m=element(s,'[data-fraction-method]');m.value='2';m.dispatchEvent(new s.w.Event('change',{bubbles:true}));assert.equal(bookWork(s,p.id).fractionView,2);assert(!bookWork(s,p.id).assisted);assert.match(element(s,'[data-fraction-host]').textContent,/числитель первой/);}
  input(s,'#answer',p.id==='014-itog'?'В Б А Б В Б Б Б':p.answer);submit(s,'#answer-form');const work=bookWork(s,p.id);
  if(p.id==='014-itog'){assert(!work.independent&&!work.correct&&work.submitted);assert.match(element(s,'#feedback').textContent,/Восемь букв/);}
  else assert(work.correct&&work.independent,p.id);
 }
});
test('camp quantities and the independently built planet diagram are checked from the selected source part',async t=>{
 const s=await surface(t,BOOK+'#n/17/017-a'),bank=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises.slice(16,18);
 for(const [i,p] of bank[0].parts.entries()){
  await route(s,'#n/17/'+p.id);const text=sourcePresent(s).querySelector('.problem').textContent;assert.match(text,i?/тонна/:/1,2 раза/);
  input(s,'#answer',i?'544':'78');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,i?/оставшийся запас/:/общее число/);
  input(s,'#answer',i?'34':'39');submit(s,'#answer-form');const work=bookWork(s,p.id);assert(work.correct&&!work.assisted&&!work.independent);
  for(let n=0;n<33;n++){const model=s.w.PetersonAnalogues.create(17,p,n),nums=model.prompt.match(/\d+(?:,\d+)?/g).map(v=>Number(v.replace(',','.')));
   const result=i?(nums[0]-nums[1]*nums[2])/(nums[3]-nums[1]):(nums[0]+nums[0]*nums[1]*2-nums[2])/2;assert.equal(Number(model.answer),result);assert(Number.isInteger(result));}
 }
 await route(s,'#n/18/018-1');
 const change=(selector,v)=>{const el=element(s,selector);el.value=String(v);el.dispatchEvent(new s.w.Event('change',{bubbles:true}));};
 change('[data-planet-relation]',2);change('[data-planet-zone]',1);click(s,'[data-planet-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/в обоих списках/);assert.equal(bookWork(s,'018-1').planetRelation,2);
 change('[data-planet-relation]',1);change('[data-planet-zone]',3);click(s,'[data-planet-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/название начинается/);
 change('[data-planet-zone]',1);click(s,'[data-planet-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/совпало/);const work=bookWork(s,'018-1');assert(work.submitted&&!work.independent&&!work.correct);assert.equal(work.earthZone,1);
 const restored=await surface(t,BOOK+'#n/18/018-1',storage(s));assert.equal(element(restored,'[data-planet-zone]').value,'1');assert.equal(element(restored,'[data-planet-relation]').value,'1');assert.equal(element(restored,'#answer').value,work.draft);
 const answers=new Set();for(let n=0;n<56;n++){const model=s.w.PetersonAnalogues.create(18,bank[1].parts[0],n);assert(s.w.PetersonBook.check(model,model.answer));answers.add(model.answer);}assert.equal(answers.size,4);
});
test('source page 9 contrasts truth with exact negation, keeps reasons reviewable and remembers the chosen pair',async t=>{
 const s=await surface(t,BOOK+'#n/19/019-1'),rows=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises.slice(18,21);
 function change(key,v){const input=element(s,'[data-logic-'+key+']');input.value=String(v);input.dispatchEvent(new s.w.Event('change',{bubbles:true}));}
 for(const row of rows)for(const p of row.parts){
  await route(s,'#n/'+row.number+'/'+p.id);assert.match(sourcePresent(s).textContent,/Всё условие/);
  const correctLeft=row.number===19&&p.id!=='019-6'?2:1;assert.equal(element(s,'[data-logic-use]').disabled,true);
  change('left',correctLeft);change('right',2);click(s,'[data-logic-use]');submit(s,'#answer-form');
  assert.match(element(s,'#feedback').className,/error/);assert(bookWork(s,p.id).submitted&&!bookWork(s,p.id).correct);
  change('right',1);click(s,'[data-logic-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/Пара записей подходит/);
  const w=bookWork(s,p.id);assert.equal(w.logicLeft,correctLeft);assert.equal(w.logicRight,1);assert(w.submitted&&!w.correct&&!w.independent);
  const first=s.w.PetersonAnalogues.create(row.number,p,0),next=s.w.PetersonAnalogues.create(row.number,p,1);assert.notEqual(first.prompt,next.prompt);
  for(let attempt=0;attempt<22;attempt++){const task=s.w.PetersonAnalogues.create(row.number,p,attempt);assert.equal(new Set(task.choices).size,task.choices.length);assert(task.choices.includes(task.answer));assert(s.w.PetersonBook.check(task,task.answer));}
 }
 const p=rows[1].parts[0];await route(s,'#n/20/'+p.id);const reference=element(s,'[data-logic-reference]');reference.open=true;reference.dispatchEvent(new s.w.Event('toggle'));assert(bookWork(s,p.id).assisted);
 const restored=await surface(t,BOOK+'#n/20/'+p.id,storage(s));assert.equal(element(restored,'[data-logic-reference]').open,true);assert.equal(element(restored,'[data-logic-right]').value,'1');assert.match(element(restored,'#answer').value,/≥/);
});
test('the printed cipher checks all fifteen assertions separately and retains ordering, exact totals and earlier scenes',async t=>{
 const s=await surface(t,BOOK+'#n/22/022-r'),rows=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises.slice(21,24),truth=[];
 for(const row of rows)for(const p of row.parts){
  await route(s,'#n/'+row.number+'/'+p.id);const material=sourcePresent(s);assert.match(material.textContent,/Всё условие/);
  if(p.expression){
   const model=s.w.PetersonBook.exact(p.expression),M=s.w.PetersonBook.M;
   if(row.number===22){
    const statement=material.querySelector('.problem').textContent,claim=statement.match(/ = ([\d,]+)\./)[1];
    if(M.equal(claim,model))truth.push([p.label,M.parse(model)]);
    else{input(s,'#answer',claim);submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/проверяемой строки/);}
   }
   if(row.number===23){input(s,'#answer',p.id==='023-a'?'52,52':'117,53');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/последнего минуса|справа от знака минус/);}
   input(s,'#answer',p.answer);submit(s,'#answer-form');assert(bookWork(s,p.id).correct);
   const picker=element(s,'[data-decimal-position]');picker.value='1';picker.dispatchEvent(new s.w.Event('change',{bubbles:true}));assert.equal(bookWork(s,p.id).decimalView,1);
  }
  for(let attempt=0;attempt<26;attempt++){const task=s.w.PetersonAnalogues.create(row.number,p,attempt);assert(s.w.PetersonBook.check(task,task.answer));if(task.expression)assert(s.w.PetersonBook.M.equal(task.answer,s.w.PetersonBook.exact(task.expression)));
   if(row.number===23&&p.id==='023-a')assert(s.w.PetersonBook.M.parse(task.answer).n>0&&s.w.PetersonBook.M.parse(task.answer).n/s.w.PetersonBook.M.parse(task.answer).d<0.1);
   if(row.number===24){const [first,gap,jars]=task.prompt.match(/\d+(?:,\d+)?/g).map(v=>Number(v.replace(',','.')));assert(Math.abs((first*2-gap)*1.5/jars-Number(task.answer.replace(',','.')))<1e-9);}
  }
 }
 truth.sort((a,b)=>a[1].n/a[1].d-b[1].n/b[1].d);assert.equal(truth.map(([l])=>l).join(''),'АСТЕРОИД');
 await route(s,'#n/22/022-slovo');const tile=letter=>click(s,'[data-cipher-letter="'+letter+'"]'),use=()=>{click(s,'[data-cipher-use]');submit(s,'#answer-form');};
 tile('Б');use();assert.match(element(s,'#feedback').textContent,/Для буквы Б/);tile('Б');tile('С');tile('А');use();assert.match(element(s,'#feedback').textContent,/возрастать/);tile('С');use();assert.match(element(s,'#feedback').textContent,/ещё верная/);
 for(const c of 'СТЕРОИД')tile(c);use();assert.match(element(s,'#feedback').textContent,/астрономический термин/);let w=bookWork(s,'022-slovo');assert.equal(w.cipherLetters,'АСТЕРОИД');assert(w.submitted&&!w.correct&&!w.independent);
 const restored=await surface(t,BOOK+'#n/22/022-slovo',storage(s));assert.equal(element(restored,'[data-cipher-draft]').textContent,'АСТЕРОИД');
 await route(s,'#n/24/024-1');input(s,'#answer','64,8');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/всего мёда/);input(s,'#answer','3,6');submit(s,'#answer-form');w=bookWork(s,'024-1');assert(w.correct&&!w.independent&&!w.assisted);
});
test('both page-nine alphametics show carries, keep manual reasoning and admit all verified substitutions',async t=>{
 const s=await surface(t,BOOK+'#n/25/025-1'),rows=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises[24].parts;
 const setDigit=(letter,digit)=>{const field=element(s,'[data-puzzle-letter="'+letter+'"]');field.value=digit;field.dispatchEvent(new s.w.Event('change',{bubbles:true}));};
 const send=()=>{click(s,'[data-puzzle-use]');submit(s,'#answer-form');return element(s,'#feedback').textContent;};
 for(const [i,p] of rows.entries()){
  await route(s,'#n/25/'+p.id);const letters=i?'ПЧЁЛКАЖ':'ЛЕТОПЁ',cases=i?['1428579']:['634218','738416','842615','946813'];
  assert.match(sourcePresent(s).textContent,i?/ПЧЁЛКА/:/ПОЛЁТ/);assert(element(s,'[data-puzzle-use]').disabled);
  for(const digits of cases){
   [...letters].forEach((l,j)=>setDigit(l,digits[j]));assert.match(send(),/верное равенство/);const w=bookWork(s,p.id);assert.equal(w.puzzleDigits,digits);assert(w.submitted&&!w.correct&&!w.independent);
  }
  const correct=cases[0];[...letters].forEach((l,j)=>setDigit(l,correct[j]));setDigit(letters[0],correct[1]);assert.match(send(),/одну цифру/);setDigit(letters[0],'0');assert.match(send(),/старший разряд/);setDigit(letters[0],correct[0]);setDigit(letters.at(-1),i?'3':'7');assert.match(send(),/разряде/);
  const saved=await surface(t,BOOK+'#n/25/'+p.id,storage(s));assert.equal(element(saved,'[data-puzzle-letter="'+letters.at(-1)+'"]').value,i?'3':'7');
  let oldPrompt='';for(let attempt=0;attempt<50;attempt++){
   const task=s.w.PetersonAnalogues.create(25,p,attempt);assert.notEqual(task.prompt,oldPrompt);oldPrompt=task.prompt;assert(s.w.PetersonBook.check(task,task.answer));const m=task.prompt;
   if(i){const x=m.match(/ребусе ([АБВГ]+) × (\d+) = (Д+) буква Д означает (\d)\. Какая цифра соответствует букве ([АБВГ])/),value=Number(x[4].repeat(x[3].length))/Number(x[2]);assert.equal(String(value)[x[1].indexOf(x[5])],task.answer);}
   else{const x=m.match(/= ([АБВГД]+)\. Дано: А = (\d), Б = (\d)\. Какую цифру нужно поставить вместо ([АБВГД])/),sum=String(2*Number(x[2]+x[3]));assert.equal(sum[x[1].indexOf(x[4])],task.answer);}
  }
 }
});
test('all twelve universal statements keep the domain, reverse the predicate and retain a second formulation',async t=>{
 const s=await surface(t,BOOK+'#n/26/026-1'),row=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises[25];
 const change=(field,value)=>{const el=element(s,'[data-logic-'+field+']');el.value=String(value);el.dispatchEvent(new s.w.Event('change',{bubbles:true}));};
 const turnIn=()=>{click(s,'[data-logic-use]');submit(s,'#answer-form');return element(s,'#feedback').textContent;};
 for(const p of row.parts){
  await route(s,'#n/26/'+p.id);assert.match(sourcePresent(s).textContent,/Составь два/);change('left',2);change('right',1);assert.match(turnIn(),/Сколько объектов/);
  change('left',1);change('right',2);assert.match(element(s,'[data-logic-summary]').textContent,/Существует/);assert(!turnIn().includes('Такой объект'));
  change('right',1);assert.match(turnIn(),/Добавь вторую/);const words='Неверно, что '+sourcePresent(s).querySelector('.problem').textContent.split('Исходная фраза: ')[1];input(s,'[data-logic-other]',words);assert.match(turnIn(),/Второе отрицание сохранено/);
  const w=bookWork(s,p.id);assert.equal(w.logicOther,words);assert(w.draft.includes(words));assert(w.submitted&&!w.correct&&!w.independent);
  const answers=new Set();for(let j=0;j<36;j++){const sample=s.w.PetersonAnalogues.create(26,p,j);assert(s.w.PetersonBook.check(sample,sample.answer));answers.add(sample.answer);}assert(answers.has('Среди трёх карточек контрпримера нет')&&answers.size>=4);
 }
 const ss=await surface(t,BOOK+'#n/26/026-12',storage(s));assert.match(element(ss,'[data-logic-other]').value,/угол/);assert.equal(element(ss,'[data-logic-right]').value,'1');
});
test('the ten mathematical claims separate a proof for all values from one admissible counterexample',async t=>{
 const s=await surface(t,BOOK+'#n/27/027-1'),row=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises[26];
 const set=(key,val)=>{const f=element(s,'[data-logic-'+key+']');f.value=String(val);f.dispatchEvent(new s.w.Event('change',{bubbles:true}));};
 for(const [i,p] of row.parts.entries()){
  await route(s,'#n/27/'+p.id);const truth=[2,4,6,7].includes(i);assert.match(sourcePresent(s).textContent,/Исходная фраза/);
  set('left',truth?1:2);set('right',2);click(s,'[data-logic-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').className,/error/);
  set('right',1);input(s,'[data-logic-other]',p.explanation);click(s,'[data-logic-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/Обоснование для выбранной оценки подходит/);
  const w=bookWork(s,p.id);assert(w.submitted&&!w.correct&&!w.independent);assert.equal(w.logicOther,p.explanation);
  for(let a=0;a<32;a++){const sample=s.w.PetersonAnalogues.create(27,p,a);assert.equal(new Set(sample.choices).size,3);assert(s.w.PetersonBook.check(sample,sample.answer));const txt=sample.prompt,ans=sample.answer,x=(txt.match(/\d+(?:,\d+)?/g)||[]).map(v=>Number(v.replace(',','.')));
   if(i===0)assert(Number(ans.replace(',','.'))>x[0]&&Number(ans.replace(',','.'))<=x[1]&&!Number.isInteger(Number(ans.replace(',','.'))));
   if(i===1)assert(Number.isInteger(Number(ans))&&Number(ans)>=x[0]&&Number(ans)<x[1]);
   if(i===2){const [q,r]=ans.split('; ').map(Number);assert.equal(q*x[1]+r,x[0]);assert(r>=0&&r<x[1]);}
   if(i===3)assert([3,7,9,11,13].includes(Number(ans.split('/')[1])));
   if(i===4)assert(s.w.PetersonBook.M.equal(ans,txt.match(/числа ([\d,]+)\./)[1]));
   if(i===5){const nums=ans.split(' → ').map(v=>Number(v.replace(',','.')));assert.equal(Math.round(nums[0]),nums[1]);assert(nums[1]>nums[0]);}
   if(i===6)assert(s.w.PetersonBook.M.equal(ans,txt.match(/равно ([\d,]+)/)[1]));
   if(i===7)assert.equal(Number(ans),x[0]+1);
   if(i===8){const [left,right]=ans.split(' · ').map(v=>Number(v.replace(',','.')));assert(left*right<Math.min(left,right)&&left*right>0);}
   if(i===9){const [left,right]=ans.split(' : ').map(Number);assert.equal(right,3);assert.notEqual(left%3,0);}
  }
 }
 const r=await surface(t,BOOK+'#n/27/027-10',storage(s));assert.match(element(r,'[data-logic-other]').value,/1\/3/);
});
test('all twelve everyday statements distinguish universal, existential and individual scope, including a two-level claim',async t=>{
 const s=await surface(t,BOOK+'#n/28/028-1'),row=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises[27],types=[1,1,3,1,1,2,3,2,1,1,1,2];
 const set=(key,val)=>{const f=element(s,'[data-logic-'+key+']');f.value=String(val);f.dispatchEvent(new s.w.Event('change',{bubbles:true}));};
 for(const [i,p] of row.parts.entries()){
  await route(s,'#n/28/'+p.id);assert.match(sourcePresent(s).textContent,/Определи вид/);set('left',types[i]);set('right',2);
  click(s,'[data-logic-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').className,/error/);if(i===9)assert.match(element(s,'#feedback').textContent,/два обобщения/);
  set('right',1);input(s,'[data-logic-other]',p.answer);click(s,'[data-logic-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/Обоснование/);
  const w=bookWork(s,p.id);assert.equal(w.logicOther,p.answer);assert(w.submitted&&!w.correct&&!w.independent);const seen=new Set();
  for(let j=0;j<24;j++){const sample=s.w.PetersonAnalogues.create(28,p,j);assert(s.w.PetersonBook.check(sample,sample.answer));seen.add(sample.answer);
    if(sample.prompt.includes('точным отрицанием'))assert.equal(sample.answer,'хотя бы на одной карточке нет такой отметки');else assert.equal(sample.answer,sample.prompt.startsWith('На каждой')?'О каждом объекте':sample.prompt.startsWith('В группе')?'О существовании хотя бы одного':'Об одном указанном объекте');
  }assert(seen.size>=3);
 }
 assert.match(row.parts[0].explanation,/Onychoprion fuscatus/);await route(s,'#n/28/028-1');assert.match(element(s,'[data-logic-reference] a').href,/allaboutbirds/);
 const kept=await surface(t,BOOK+'#n/28/028-10',storage(s));assert.equal(element(kept,'[data-logic-left]').value,'1');assert.match(element(kept,'[data-logic-other]').value,/часы/);
});
test('the divisibility lab calculates all factors, shared factors and generated numeric witnesses independently',async t=>{
 const s=await surface(t,BOOK+'#n/29/029-1'),row=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises[28],types=[1,2,1,1,1,3,1,1,2,1,1,1];
 const set=(selector,value)=>{const field=element(s,selector);field.value=String(value);field.dispatchEvent(new s.w.Event('change',{bubbles:true}));};
 for(const [i,p] of row.parts.entries()){
  await route(s,'#n/29/'+p.id);const m=i===11?4:12;set('[data-divisor-m]',m);if([3,4,5].includes(i))set('[data-divisor-n]',15);
  const lab=element(s,'[data-divisor-results]').textContent;if(i===11)assert.match(lab,/Делители результата: 1, 3, 9/);else assert.match(lab,/1, 2, 3, 4, 6, 12/);if([3,4,5].includes(i))assert.match(lab,/Общие делители: 1, 3/);
  set('[data-logic-left]',types[i]);set('[data-logic-right]',1);input(s,'[data-logic-other]',p.explanation);click(s,'[data-logic-use]');submit(s,'#answer-form');const w=bookWork(s,p.id);assert.equal(w.divisorM,m);assert(w.submitted&&!w.correct&&!w.independent);
  for(let n=0;n<38;n++){const task=s.w.PetersonAnalogues.create(29,p,n);assert.equal(new Set(task.choices).size,3);assert(s.w.PetersonBook.check(task,task.answer));
    const nums=task.prompt.match(/\d+/g)?.map(Number)||[],a=Number.parseInt(task.answer,10);
    if(i===3)assert(a>=nums[0]&&Array.from({length:a-2},(_,j)=>j+2).every(x=>a%x));
    if(i===4||i===5){let [x,y]=nums;while(y){const r=x%y;x=y;y=r;}assert.equal(a,x);}
    if(i===8)assert(a%9===0&&a%10!==9);if(i===11){const value=2*nums[0]+1;assert(value%a===0&&a>1&&a<value);}
  }
 }
 const r=await surface(t,BOOK+'#n/29/029-6',storage(s));assert.equal(element(r,'[data-divisor-m]').value,'12');assert.equal(element(r,'[data-divisor-n]').value,'15');assert.match(element(r,'[data-divisor-results]').textContent,/Общие делители: 1, 3/);
});
test('both printed decision diagrams and all table rows honour equality and preserve corrected and unaided work',async t=>{
 const s=await surface(t,BOOK+'#n/30/030-1-1'),row=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises[29],a=[0.08,0.6,2.9,3,7.2,20.5];
 const setBranch=choice=>{const el=element(s,'[data-flow-branch]');el.value=choice;el.dispatchEvent(new s.w.Event('change',{bubbles:true}));};
 for(const [i,p] of row.parts.entries()){
  await route(s,'#n/30/'+p.id);const first=i<6,v=first?a[i%6]/10:a[i%6]*10,yes=first?v>=0.3:v<30,actual=first?(yes?v-.09:v+.05):(yes?v+5.4:v-7.2),wrong=first?(yes?v+.05:v-.09):(yes?v-7.2:v+5.4);
  assert.equal(element(s,'[aria-label="Таблица значений алгоритма"] tbody').children.length,6);assert.match(sourcePresent(s).textContent,/Вход a/);
  input(s,'[data-flow-value]',String(Math.round(v*1000)/1000));setBranch(yes?'no':'yes');click(s,'[data-flow-check]');assert.match(element(s,'[data-flow-feedback]').textContent,i%6===3?/равенстве порогу/:/Сравни/);
  const once=bookWork(s,p.id).errors;click(s,'[data-flow-check]');assert.equal(bookWork(s,p.id).errors,once);assert(once>0);
  setBranch(yes?'yes':'no');click(s,'[data-flow-check]');assert.match(element(s,'[data-flow-feedback]').textContent,/ветвь верны/);
  input(s,'#answer',String(Math.round(wrong*1000)/1000));submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/противоположная ветвь/);input(s,'#answer',String(Math.round(actual*1000)/1000));submit(s,'#answer-form');
  const w=bookWork(s,p.id);assert(w.correct&&!w.independent&&!w.assisted);assert.match(element(s,'[data-flow-output="'+p.id+'"]').textContent,/проверено/);
  for(let j=0;j<35;j++){const task=s.w.PetersonAnalogues.create(30,p,j),nums=task.prompt.match(/\d+(?:[,.]\d+)?/g).map(x=>Number(x.replace(',','.')));assert.equal(nums.length,5);const interim=first?nums[0]*nums[1]:nums[0]/nums[1],comp=Math.round((interim-nums[2])*1e6),cond=first?comp>=0:comp<0;
   const x=first?(cond?interim-nums[3]:interim+nums[4]):(cond?interim+nums[3]:interim-nums[4]);assert(Math.abs(x-Number(task.answer.replace(',','.')))<1e-8);assert(s.w.PetersonBook.check(task,task.answer));}
 }
 const r=await surface(t,BOOK+'#n/30/030-1-4',storage(s));assert.equal(element(r,'[data-flow-branch]').value,'yes');assert.match(element(r,'[data-flow-feedback]').textContent,/ветвь верны/);assert.equal(r.document.querySelectorAll('[data-flow-output]').length,6);for(const td of r.document.querySelectorAll('[data-flow-output]'))assert.match(td.textContent,/проверено/);
 const independent=await surface(t,BOOK+'#n/30/030-1-4');input(independent,'#answer','0,21');submit(independent,'#answer-form');assert(bookWork(independent,'030-1-4').independent);
});
test('integer endpoints, the empty set and dense decimal intervals use the selected model without grading a written explanation',async t=>{
 const s=await surface(t,BOOK+'#n/31/031-a'),rows=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises.slice(30,32),sets=[[15,16,17],[4,5,6,7],[2],[]];
 const set=(selector,value)=>{const e=element(s,selector);e.value=String(value);e.dispatchEvent(new s.w.Event('change',{bubbles:true}));};
 for(const [i,p] of rows[0].parts.entries()){
  await route(s,'#n/31/'+p.id);assert.match(sourcePresent(s).textContent,/натуральные/);if(!i){click(s,'[data-integer-value="18"]');click(s,'[data-integer-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/открытой границе/);click(s,'[data-integer-value="18"]');}
  if(sets[i].length){for(const x of sets[i])click(s,'[data-integer-value="'+x+'"]');}else click(s,'[data-integer-empty]');click(s,'[data-integer-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,sets[i].length?/точки найдены/:/натуральных чисел нет/);const w=bookWork(s,p.id);assert(w.submitted&&!w.correct&&!w.independent);
  const rr=await surface(t,BOOK+'#n/31/'+p.id,storage(s));if(sets[i].length)assert.equal(rr.document.querySelectorAll('[data-integer-value][aria-pressed="true"]').length,sets[i].length);else assert.equal(element(rr,'[data-integer-empty]').getAttribute('aria-pressed'),'true');
  for(let a=0;a<24;a++){const sample=s.w.PetersonAnalogues.create(31,p,a),m=sample.prompt.match(/([\d,]+) (≤|<) y (≤|<) ([\d,]+)/);let selected=[];for(let value=1;value<=25;value++){const lo=Number(m[1].replace(',','.')),hi=Number(m[4].replace(',','.'));if((m[2]==='≤'?lo<=value:lo<value)&&(m[3]==='≤'?value<=hi:value<hi))selected.push(value);}assert.equal(sample.answer,selected.length?selected.join('; '):'∅');}
 }
 const p=rows[1].parts[0];await route(s,'#n/32/'+p.id);const entry=(i,x)=>input(s,'[data-sequence-x="'+i+'"]',x),use=()=>{click(s,'[data-sequence-use]');submit(s,'#answer-form');return element(s,'#feedback').textContent;};
 entry(0,'0,5');entry(1,'1/2');entry(2,'0,65');set('[data-sequence-den]',100);assert.match(use(),/число 3/);entry(2,'0,6');assert.match(use(),/одно и то же/);entry(1,'0,55');assert.match(use(),/вышло за 0,6/);set('[data-sequence-den]',10000);assert.match(use(),/тоже в промежутке/);set('[data-sequence-count]',10000);assert.match(use(),/вышло за 0,6/);set('[data-sequence-den]',100000);assert.match(use(),/тоже в промежутке/);
 assert.match(element(s,'[data-sequence-tape]').textContent,/0,59999/);assert(!bookWork(s,p.id).correct);const restored=await surface(t,BOOK+'#n/32/'+p.id,storage(s));assert.equal(element(restored,'[data-sequence-den]').value,'100000');assert.equal(element(restored,'[data-sequence-x="1"]').value,'0,55');
 for(let j=0;j<37;j++){const task=s.w.PetersonAnalogues.create(32,p,j),nums=task.prompt.match(/\d+(?:,\d+)?/g).map(v=>Number(v.replace(',','.')));assert(Math.abs(nums[1]+(nums[0]-1)*nums[2]/nums[3]-Number(task.answer.replace(',','.')))<1e-9);}
});
test('six decimal scales separate enclosing bounds from rounding and keep the typed numeric result independent of the chosen side',async t=>{
 const s=await surface(t,BOOK+'#n/33/033-1-1'),row=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises[32];
 const scales=[100,10,1,.1,.01,.001],lo=[100,140,149,149.5,149.50,149.502],hi=[200,150,150,149.6,149.51,149.503],rounded=[100,150,150,149.5,149.5,149.503];
 const use=()=>{click(s,'[data-round-use]');submit(s,'#answer-form');return element(s,'#feedback').textContent;};
 for(const [i,p] of row.parts.entries()){
  const j=i%6;await route(s,'#n/33/'+p.id);assert.match(sourcePresent(s).textContent,/149,5027/);
  if(i<6){
   input(s,'[data-round-low]',String(lo[j]));input(s,'[data-round-high]',String(Math.round((hi[j]+scales[j])*1e6)/1e6));assert.match(use(),/расстояние между ними/);
   input(s,'[data-round-high]',String(hi[j]));assert.match(use(),/Обе ближайшие границы/);assert(!bookWork(s,p.id).correct);
  }else{
   const mark=element(s,'[data-round-mark]');mark.value=lo[j]===rounded[j]?'left':'right';mark.dispatchEvent(new s.w.Event('change',{bubbles:true}));assert(element(s,'[data-round-use]').disabled);
   input(s,'[data-round-single]',String(rounded[j]===lo[j]?hi[j]:lo[j]));assert.match(use(),/соседняя отметка/);input(s,'[data-round-single]',String(rounded[j]));use();const w=bookWork(s,p.id);assert(w.correct&&!w.independent&&!w.assisted);
  }
  for(let n=0;n<38;n++){const task=s.w.PetersonAnalogues.create(33,p,n),target=Number(task.prompt.match(/(?:t = |Округли )([\d,]+)/)[1].replace(',','.')),u=scales[j],ref=Math.floor(target/u+1e-7)*u;
   if(i<6){const limits=task.answer.split(' < t < ').map(x=>Number(x.replace(',','.')));assert(Math.abs(limits[0]-ref)<1e-8&&Math.abs(limits[1]-ref-u)<1e-8);}
   else assert(Math.abs(Number(task.answer.replace(',','.'))-Math.floor(target/u+.5+1e-7)*u)<1e-8);
  }
 }
 const restored=await surface(t,BOOK+'#n/33/033-2-6',storage(s));assert.equal(element(restored,'[data-round-mark]').value,'right');assert.equal(element(restored,'[data-round-single]').value,'149.503');
});
test('all sixteen printed calculations round at the requested place and independently verify their fresh variants',async t=>{
 const s=await surface(t,BOOK+'#n/34/034-a-1'),row=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises[33];
 const select=v=>{const f=element(s,'[data-calc-digit]');f.value=String(v);f.dispatchEvent(new s.w.Event('change',{bubbles:true}));},E=s.w.PetersonBook;
 for(const p of row.parts){
  await route(s,'#n/34/'+p.id);assert.match(sourcePresent(s).textContent,/только затем округли/);const exact=E.exact(p.expression),place=p.rounding.places,number=exact.n/exact.d,digit=Math.floor(number*10**(place+1)+1e-9)%10;
  input(s,'[data-calc-exact]',E.M.decimal(exact));select((digit+1)%10);click(s,'[data-calc-check]');assert.match(element(s,'[data-calc-feedback]').textContent,/на один разряд вправо/);select(digit);click(s,'[data-calc-check]');assert.match(element(s,'[data-calc-feedback]').textContent,/решающая цифра верны/);
  input(s,'#answer',p.answer);submit(s,'#answer-form');const w=bookWork(s,p.id);assert(w.correct&&!w.independent&&!w.assisted);assert.equal(w.calcDigit,String(digit));
  for(let n=0;n<31;n++){const sample=s.w.PetersonAnalogues.create(34,p,n),expr=sample.expression,l=Number(String(expr.left).replace(',','.')),r=Number(String(expr.right).replace(',','.')),value=({add:()=>l+r,subtract:()=>l-r,multiply:()=>l*r,divide:()=>l/r})[expr.op](),scale=10**place,target=Math.sign(value)*Math.floor(Math.abs(value)*scale+.5+1e-9)/scale,provided=E.M.parse(sample.answer);assert(Math.abs(provided.n/provided.d-target)<1e-7);assert(E.check(sample,sample.answer));}
 }
 const r=await surface(t,BOOK+'#n/34/034-a-1',storage(s));assert.match(element(r,'[data-calc-feedback]').textContent,/решающая цифра верны/);assert.equal(element(r,'[data-calc-exact]').value,'2995,25');assert.equal(element(r,'[data-calc-digit]').value,'5');
});
test('period detection compares exact periodic values, checks each long-division step and retains independent rule proofs',async t=>{
 const s=await surface(t,BOOK+'#n/35/035-a'),items=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises.slice(34,36);
 const fracById={'035-a':[1,3,'0,(3)','0,333'],'035-b':[2,11,'0,(18)','0,182'],'035-v':[23,90,'0,2(5)','0,256'],'035-g':[32,33,'0,(96)','0,970'],'036-a':[250,3],'036-b':[2,75]};
 const set=(selector,v)=>{const el=element(s,selector);el.value=String(v);el.dispatchEvent(new s.w.Event('change',{bubbles:true}));};
 for(const item of items)for(const p of item.parts){
  await route(s,'#n/'+item.number+'/'+p.id);assert.match(sourcePresent(s).textContent,/Всё условие/);
  if(p.id.endsWith('pravilo')){
   set('[data-logic-left]',item.number===35?2:1);set('[data-logic-right]',1);input(s,'[data-logic-other]',p.answer);click(s,'[data-logic-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/Обоснование/);assert(!bookWork(s,p.id).correct);
  }else{
   const [n,d,notation,approx]=fracById[p.id];let rem=n%d;
   for(let step=0;step<5;step++){const x=rem*10,digit=Math.floor(x/d);rem=x%d;
    input(s,'[data-period-digit]',String(digit));input(s,'[data-period-rem]',String(d));click(s,'[data-period-check]');assert.match(element(s,'[data-period-feedback]').textContent,/меньше делителя/);
    input(s,'[data-period-rem]',String(rem));click(s,'[data-period-check]');assert.equal(bookWork(s,p.id).periodStep,step+1);
   }
   if(item.number===35){
    const attempt=(f,r)=>{input(s,'[data-period-notation]',f);input(s,'[data-period-approx]',r);click(s,'[data-period-use]');submit(s,'#answer-form');return element(s,'#feedback').textContent;};
    assert.match(attempt('0,(7)',approx),/какой остаток/);assert.match(attempt(notation,'1'),/четвёртый/);assert.match(attempt(notation,approx),/запись и округление верны/);if(p.id==='035-a')assert.match(attempt('0,3(33)',approx),/запись и округление верны/);assert(!bookWork(s,p.id).correct);
   }else{input(s,'#answer',p.answer);submit(s,'#answer-form');assert(bookWork(s,p.id).correct&&!bookWork(s,p.id).independent);}
  }
  for(let a=0;a<30;a++){const sample=s.w.PetersonAnalogues.create(item.number,p,a);assert(s.w.PetersonBook.check(sample,sample.answer));const M=s.w.PetersonBook.M;
   if(sample.expression){const x=M.parse(sample.expression.left),y=M.parse(sample.expression.right),exact=x.n/x.d/(y.n/y.d),r=M.parse(sample.answer);assert(Math.abs(r.n/r.d-Math.round(exact*10000)/10000)<1e-8);}
   else if(!p.id.endsWith('pravilo')){const frac=sample.prompt.match(/(\d+)\/(\d+)/),val=Number(frac[1])/Number(frac[2]);if(a%2){const r=M.parse(sample.answer);assert(Math.abs(r.n/r.d-Math.round(val*1000)/1000)<1e-8);}else{const m=sample.answer.match(/^0,(\d*)\((\d+)\)$/),float=(Number(m[1]||0)+Number(m[2])/(10**m[2].length-1))/10**m[1].length;assert(Math.abs(float-val)<1e-9);}}
  }
 }
 const r=await surface(t,BOOK+'#n/35/035-v',storage(s));assert.equal(bookWork(r,'035-v').periodStep,5);assert.equal(element(r,'[data-period-notation]').value,'0,2(5)');assert.match(element(r,'[data-period-tape]').textContent,/0,25555/);
});
test('the rectangle and square formulas distinguish contour and area, and both corner cuts preserve perimeter',async t=>{
 const s=await surface(t,BOOK+'#n/37/037-1'),row=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises[36],set=(q,v)=>{const f=element(s,q);f.value=String(v);f.dispatchEvent(new s.w.Event('change',{bubbles:true}));},use=()=>{click(s,'[data-geo-use]');submit(s,'#answer-form');return element(s,'#feedback').textContent;};
 for(const [i,p] of row.parts.entries()){
  await route(s,'#n/37/'+p.id);assert.match(sourcePresent(s).textContent,/периметр|периметра/i);set('[data-geo-mode]',i===2?'cuts':'area');
  if(i<2){
   if(i===1)set('[data-geo-side]','x');set('[data-geo-p]',1);set('[data-geo-s]',2);assert.match(use(),/все четыре стороны/);set('[data-geo-p]',2);set('[data-geo-s]',1);assert.match(use(),/внутреннюю часть/);set('[data-geo-s]',2);assert.match(use(),/Обе формулы/);if(i===1)assert.match(element(s,'#answer').value,/4 · x; S = x²/);
  }else{
   const svg=element(s,'[data-geometry-host] svg');assert.equal(svg.querySelector('polygon').getAttribute('points').split(' ').length,8);assert.equal(svg.querySelectorAll('rect').length,3);
   const entry=(i,v)=>input(s,'[data-geo-number="'+i+'"]',v);entry(0,'42');entry(1,'112,36');entry(2,'85,8');assert.match(use(),/два внешних/);entry(0,'42,4');assert.match(use(),/полного квадрата/);entry(1,'85,88');assert.match(use(),/цифру сотых/);entry(2,'85,9');assert.match(use(),/согласуются/);set('[data-geo-mode]','area');assert.match(element(s,'[data-geometry-host]').textContent,/верхняя часть/);
  }
  const w=bookWork(s,p.id);assert(w.submitted&&!w.correct&&!w.independent);
  for(let a=0;a<36;a++){const sample=s.w.PetersonAnalogues.create(37,p,a),nums=sample.prompt.match(/\d+(?:,\d+)?/g).map(x=>Number(x.replace(',','.'))),r=s.w.PetersonBook.M.parse(sample.answer);let val;
   if(i===0)val=a%2?nums[0]*nums[1]:2*(nums[0]+nums[1]);else if(i===1)val=a%2?nums[0]*nums[0]:4*nums[0];else{const [size,top,bottom,h]=nums;val=a%2?size*size-(size-top)*(size-h)-(size-bottom)*h:4*size;}assert(Math.abs(r.n/r.d-val)<1e-8);
  }
 }
 const restored=await surface(t,BOOK+'#n/37/037-3',storage(s));assert.equal(element(restored,'[data-geo-mode]').value,'area');assert.equal(element(restored,'[data-geo-number="1"]').value,'85,88');
});
test('the twelve original assertions decode by descending value; the meaning remains separate from the checked code',async t=>{
 const s=await surface(t,BOOK+'#n/38/038-m'),row=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises[37],matches=[];
 for(const p of row.parts){
  await route(s,'#n/38/'+p.id);assert.match(sourcePresent(s).textContent,/Всё условие/);const E=s.w.PetersonBook,M=E.M;
  if(p.expression){const text=sourcePresent(s).querySelector('.problem').textContent,claim=text.match(/ = ([\d,]+)\./)[1],v=E.exact(p.expression);if(M.equal(claim,v))matches.push([p.label,v.n/v.d]);else{input(s,'#answer',claim);submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/проверяемой строки/);}
   input(s,'#answer',p.answer);submit(s,'#answer-form');assert(bookWork(s,p.id).correct);const sort=element(s,'[data-decimal-position]');sort.value='1';sort.dispatchEvent(new s.w.Event('change',{bubbles:true}));assert.equal(bookWork(s,p.id).decimalView,1);}
  for(let attempt=0;attempt<25;attempt++){const task=s.w.PetersonAnalogues.create(38,p,attempt);assert(E.check(task,task.answer));if(p.expression){const factor=M.operation('divide',E.exact(task.expression),E.exact(p.expression));assert(factor.n>factor.d);assert(M.equal(task.answer,M.operation('multiply',factor,E.exact(p.expression))));}
   else{const labels=task.prompt.match(/[А-ЯЁ] · \d+ [−+] \d+ = \d+/g).map(line=>{const [,letter,x,op,y,claim]=line.match(/([А-ЯЁ]) · (\d+) ([−+]) (\d+) = (\d+)/);return [letter,op==='+'?Number(x)+Number(y):Number(x)-Number(y),Number(claim)];});assert.equal(labels.filter(l=>l[1]===l[2]).sort((a,b)=>b[1]-a[1]).map(l=>l[0]).join(''),task.answer);}
  }
 }
 assert.equal(matches.sort((a,b)=>b[1]-a[1]).map(r=>r[0]).join(''),'ДЕЛИМОСТЬ');
 const pick=c=>click(s,'[data-cipher-letter="'+c+'"]'),send=()=>{click(s,'[data-cipher-use]');submit(s,'#answer-form');return element(s,'#feedback').textContent;};
 pick('Р');assert.match(send(),/Для буквы Р/);pick('Р');pick('Е');pick('Д');assert.match(send(),/должны убывать/);pick('Е');for(const c of 'ЕЛИМОСТЬ')pick(c);assert.match(send(),/Объясни его смысл/);input(s,'[data-cipher-meaning]','При делении одного натурального числа на другое остаток равен нулю.');assert.match(send(),/сохранено для проверки/);const w=bookWork(s,'038-termin');assert.equal(w.cipherLetters,'ДЕЛИМОСТЬ');assert(w.submitted&&!w.correct&&!w.independent);const back=await surface(t,BOOK+'#n/38/038-termin',storage(s));assert.match(element(back,'[data-cipher-meaning]').value,/остаток равен нулю/);
});
test('parameter models describe all permitted values, and the eight prime-factor subsets give exactly D(42)',async t=>{
 const s=await surface(t,BOOK+'#n/39/039-1'),rows=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises.slice(38,41),set=(q,v)=>{const el=element(s,q);el.value=String(v);el.dispatchEvent(new s.w.Event('change',{bubbles:true}));};
 for(const row of rows)for(const p of row.parts){
  await route(s,'#n/'+row.number+'/'+p.id);assert.match(sourcePresent(s).textContent,/Всё условие/);
  if(row.number<41){
   const value=row.number===39?3:0;set('[data-factor-parameter]',value);assert.equal(bookWork(s,p.id).formulaInput,value);
   if(p.id==='040-5'){set('[data-factor-remainder]',0);assert.match(element(s,'[data-factor-output]').textContent,/не подходит/);set('[data-factor-remainder]',2);assert.match(element(s,'[data-factor-output]').textContent,/не кратно 3/);}
   if(p.id==='039-2')assert.match(element(s,'[data-factor-output]').textContent,/= 14/);set('[data-logic-left]',1);set('[data-logic-right]',1);input(s,'[data-logic-other]',p.explanation);click(s,'[data-logic-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/Обоснование/);assert(!bookWork(s,p.id).correct);
  }else{
   input(s,'[data-basket-value]','41');click(s,'[data-basket-add]');click(s,'[data-basket-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/Умножь/);input(s,'[data-basket-value]','42');
   for(const bit of [0,1,0,2,0,1,0]){click(s,'[data-factor-bit="'+bit+'"]');click(s,'[data-basket-add]');}
   click(s,'[data-basket-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/восемь/);assert.deepEqual([...bookWork(s,p.id).divisorBasket],[1,2,3,6,7,14,21,42]);assert(!bookWork(s,p.id).correct);
   click(s,'[data-basket-remove]');assert.equal(bookWork(s,p.id).divisorBasket.length,7);const fresh=await surface(t,BOOK+'#n/41/041-1',storage(s));assert.equal(element(fresh,'[data-basket-value]').value,'42');assert.equal(bookWork(fresh,p.id).divisorBasket.length,7);
  }
  for(let j=0;j<36;j++){
   const sample=s.w.PetersonAnalogues.create(row.number,p,j);assert(s.w.PetersonBook.check(sample,sample.answer));if(row.number===41){const [,prime,index]=sample.prompt.match(/2 · 3 · (\d+).*назови (\d+)-й/),n=6*Number(prime),answers=Array.from({length:n},(_,k)=>k+1).filter(d=>n%d===0);assert.equal(sample.answer,String(answers[Number(index)-1]));}
  }
 }
});
test('all nineteen printed divisibility filters match exhaustive substitution, including empty solutions and zero',async t=>{
 const s=await surface(t,BOOK+'#n/42/042-a'),rows=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises.slice(41,44),factors={42:[2,5,10,100,25,4],43:[3,9,6,15,18,90],44:[2,5,10,3,9,6,15]};
 for(const row of rows)for(const [i,p] of row.parts.entries()){
  await route(s,'#n/'+row.number+'/'+p.id);assert.match(sourcePresent(s).textContent,/Всё условие/);const d=factors[row.number][i],all=row.number===44?[315,79,8181,490,102]:[0,1,2,3,4,5,6,7,8,9],from=v=>row.number===42?2730+v:row.number===43?5012+100*v:v,correct=all.filter(v=>from(v)%d===0),wrong=all.find(v=>!correct.includes(v)),probe=element(s,'[data-filter-probe]');probe.value=String(wrong);probe.dispatchEvent(new s.w.Event('change',{bubbles:true}));click(s,'[data-filter-divide]');assert.match(element(s,'[data-filter-result]').textContent,new RegExp('остаток '+from(wrong)%d));
  const pick=x=>click(s,'[data-filter-pick="'+x+'"]'),use=()=>{click(s,'[data-filter-use]');submit(s,'#answer-form');return element(s,'#feedback').textContent;};pick(wrong);assert.match(use(),new RegExp('не делится на '+d));pick(wrong);if(correct.length)correct.forEach(pick);else click(s,'[data-filter-empty]');assert.match(use(),correct.length?/все подходящие/:/действительно нет/);
  const w=bookWork(s,p.id);assert(w.assisted&&w.submitted&&!w.correct&&!w.independent);const originalNumbers=Array.from(p.answer.matchAll(/\d+/g),m=>Number(m[0]));assert.deepEqual(originalNumbers.sort((a,b)=>a-b),[...correct].sort((a,b)=>a-b));
  for(let j=0;j<32;j++){const sample=s.w.PetersonAnalogues.create(row.number,p,j);assert.equal(new Set(sample.choices).size,3);let answers;
   if(row.number===44)answers=sample.prompt.match(/B = \{([^}]+)\}/)[1].split('; ').map(Number).filter(v=>v%d===0);
   else{const pattern=sample.prompt.match(/числе ([\d□]+)/)[1];answers=Array.from({length:10},(_,x)=>x).filter(x=>Number(pattern.replace('□',x))%d===0);}
   assert.equal(sample.answer,answers.length?'{'+answers.join('; ')+'}':'∅');
  }
 }
 const x=await surface(t,BOOK+'#n/42/042-a',storage(s));assert.deepEqual([...bookWork(x,'042-a').filterItems],[0,2,4,6,8]);assert(element(x,'[data-filter-pick="0"]').getAttribute('aria-pressed')==='true');assert.match(element(x,'[data-filter-result]').textContent,/остаток/);
});
test('all nine printed common-divisor and common-multiple investigations retain the prime divisions, sets and evidence',async t=>{
 const s=await surface(t,BOOK+'#n/45/045-1'),rows=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises.slice(44,48);
 const source=[[12,15],[6,8],[90,70],[250,21],[6,420],[125,150],[210,2730],[35,72],[60,75,111]];
 const divisors=n=>Array.from({length:n},(_,j)=>j+1).filter(x=>n%x===0),intersection=ns=>divisors(ns[0]).filter(x=>ns.every(n=>n%x===0)),multiple=ns=>{let l=Math.max(...ns);while(!ns.every(n=>l%n===0))l+=Math.max(...ns);return l;};
 const set=ns=>'{'+ns.join('; ')+'}',early=n=>'{'+[n,2*n,3*n,'…'].join('; ')+'}',primes=n=>{let d=2;const a=[];while(n>1){if(n%d===0){a.push(d);n/=d;}else d++;}return a;};
 let rowIndex=0;
 for(const row of rows)for(const p of row.parts){
  await route(s,'#n/'+row.number+'/'+p.id);assert.match(sourcePresent(s).textContent,/Всё условие/);
  const ns=source[rowIndex++],g=intersection(ns).at(-1),l=multiple(ns);
  const start=ns[0],bad=[2,3,5,7,11].find(d=>start%d);click(s,'[data-prime-take="'+bad+'"]');assert.match(element(s,'[data-common-host] [role=status]').textContent,new RegExp('равен '+start%bad));
  for(const [i,n] of ns.entries()){
   const sel=element(s,'[data-prime-row]');sel.value=String(i);sel.dispatchEvent(new s.w.Event('change',{bubbles:true}));
   for(const d of primes(n))click(s,'[data-prime-take="'+d+'"]');assert.match(element(s,'[data-factor-chain="'+i+'"]').textContent,/готово/);
  }
  assert.deepEqual(bookWork(s,p.id).primePaths,ns.map(primes));click(s,'[data-prime-hint]');assert.match(element(s,'[data-common-host]').textContent,/множитель в наименьшей степени/);
  const vals=row.number===45?[...ns.map(n=>set(divisors(n))),set(intersection(ns)),String(g)]:row.number===46?[...ns.map(early),early(l),String(l)]:[String(g),String(l)];
  const send=()=>{click(s,'[data-common-use]');submit(s,'#answer-form');return element(s,'#feedback').textContent;};
  vals.forEach((v,i)=>input(s,'[data-common-entry="'+i+'"]',v));
  if(row.number===45){input(s,'[data-common-entry="2"]','{1;3;5}');assert.match(send(),/делитель обязан делить/);input(s,'[data-common-entry="2"]',vals[2]);}
  if(row.number===46){input(s,'[data-common-entry="2"]','{24;48;72}');assert.match(send(),/бесконечно/);input(s,'[data-common-entry="2"]',vals[2]);}
  if(row.number>46){input(s,'[data-common-entry="1"]',String(2*l));assert.match(send(),/есть меньшее/);input(s,'[data-common-entry="1"]',String(l));}
  assert.match(send(),/вычисления согласуются/);assert(bookWork(s,p.id).submitted&&!bookWork(s,p.id).correct&&!bookWork(s,p.id).independent);assert(bookWork(s,p.id).assisted);
  for(let j=0;j<30;j++){const sample=s.w.PetersonAnalogues.create(row.number,p,j),text=sample.prompt.split('чисел ')[1].replace(/\.$/,'');const xs=row.number===47?text.split(', ').map(line=>line.split(' = ')[1].split(' · ').map(Number).reduce((a,b)=>a*b)):text.split(', ').map(Number);
   const G=intersection(xs).at(-1),L=multiple(xs);assert.equal(sample.answer,row.number===45?String(G):row.number===46?String(L):'НОД '+G+', НОК '+L);
   if(sample.choices)assert.equal(new Set(sample.choices).size,3);
  }
 }
 const re=await surface(t,BOOK+'#n/48/048-g',storage(s));assert.match(element(re,'[data-factor-chain="2"]').textContent,/3 · 37/);assert.equal(element(re,'[data-common-entry="1"]').value,'11100');
});
test('printed cuboid dimensions support face pairs, separate units, rounding and symbolic proofs',async t=>{
 const s=await surface(t,BOOK+'#n/49/049-1-obhardyom'),ps=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises[48].parts;
 for(const [i,p] of ps.entries()){
  await route(s,'#n/49/'+p.id);assert.match(sourcePresent(s).textContent,/Всё условие/);assert.equal(element(s,'[data-box-host] svg').querySelectorAll('polygon').length,3);
  for(const [btn,cap] of [['base',/верхняя и нижняя/],['side',/левая и правая/],['front',/передняя и задняя/]]){click(s,'[data-box-face="'+btn+'"]');assert.match(element(s,'[data-box-caption]').textContent,cap);}
  let right;
  if(i<2){const exact=i?'229,26':'222,955',wrong=i?'114,63':'26,23';right=i?'229,3':'223,0';
   input(s,'[data-box-field="0"]',exact);input(s,'[data-box-field="1"]',wrong);click(s,'[data-box-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,i?/грань из каждой пары/:/площадь основания/);
   input(s,'[data-box-field="1"]',right);click(s,'[data-box-use]');submit(s,'#answer-form');assert(bookWork(s,p.id).correct&&!bookWork(s,p.id).independent&&!bookWork(s,p.id).assisted);
  }else{
   const name=element(s,'[data-box-names]');name.value='xyh';name.dispatchEvent(new s.w.Event('change',{bubbles:true}));assert.match(element(s,'[data-box-caption]').textContent,/x и h/);
   input(s,'[data-box-field="0"]',i===2?'xy':'xy+xh+yh');input(s,'[data-box-field="1"]','Учитываю три заданные длины и объясняю действия.');click(s,'[data-box-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,i===2?/Высота|высота/:/всех трёх парах/);
   right=i===2?'V=xyh':'S=2(xy+xh+yh)';input(s,'[data-box-field="0"]',right);click(s,'[data-box-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/Формула согласуется/);assert(bookWork(s,p.id).submitted&&!bookWork(s,p.id).correct);
  }
  for(let j=0;j<32;j++){const sample=s.w.PetersonAnalogues.create(49,p,j);
   if(i<2){const [a,b,c]=[...sample.prompt.matchAll(/(\d+[,\.]\d|\d+) см(?:,|\.)/g)].map(x=>Math.round(Number(x[1].replace(',','.'))*10)),n=i===0?a*b*c:2*(a*b+a*c+b*c),den=i===0?1000:100;assert.equal(s.w.PetersonBook.M.equal(sample.answer,String(Math.floor((10*n+den/2)/den)/10)),true);}
   else{const names=sample.prompt.match(/обозначены ([a-z]), ([a-z]), ([a-z])/).slice(1);const [x,y,z]=names;assert.equal(sample.answer,i===2?names.join(''):'2('+x+y+'+'+x+z+'+'+y+z+')');}
  }
 }
 const re=await surface(t,BOOK+'#n/49/049-3',storage(s));assert.equal(element(re,'[data-box-names]').value,'xyh');assert.equal(element(re,'[data-box-field="0"]').value,'S=2(xy+xh+yh)');
});
test('tiger quantifiers and six original divisibility claims separate one witness from a universal proof',async t=>{
 const s=await surface(t,BOOK+'#n/50/050-1'),ex=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises.slice(49,51),values=[0,2,9,18,6,5,1],truths=[true,false,false,true,false,true,false];
 const select=(selector,v)=>{const e=element(s,selector);e.value=String(v);e.dispatchEvent(new s.w.Event('change',{bubbles:true}));};
 let k=0;
 for(const row of ex)for(const p of row.parts){
  await route(s,'#n/'+row.number+'/'+p.id);assert.match(sourcePresent(s).textContent,/Всё условие/);select('[data-proof-probe]',values[k]);
  if(k===0){assert.match(element(s,'[data-proof-result]').textContent,/истинна/);select('[data-proof-probe]',1);assert.match(element(s,'[data-proof-result]').textContent,/ложна/);}
  else{const n=values[k],ds=Array.from({length:n},(_,i)=>i+1).filter(d=>n%d===0);assert.match(element(s,'[data-proof-result]').textContent,new RegExp('Всего '+ds.length+'\\.'));}
  const left=truths[k]?1:2;select('[data-logic-left]',left===1?2:1);select('[data-logic-right]',1);click(s,'[data-logic-use]');submit(s,'#answer-form');assert.equal(element(s,'#feedback').classList.contains('error'),true);
  select('[data-logic-left]',left);select('[data-logic-right]',1);input(s,'[data-logic-other]',p.answer);click(s,'[data-logic-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,k===0?/обе формы|Обе формы/:/Обоснование/);
  assert(bookWork(s,p.id).submitted&&!bookWork(s,p.id).correct);assert.equal(bookWork(s,p.id).proofProbe,k===0?1:values[k]);
  for(let j=0;j<36;j++){const m=s.w.PetersonAnalogues.create(row.number,p,j);assert.equal(new Set(m.choices).size,3);assert(m.choices.includes(m.answer));
   if(k===1)assert.match(m.answer,/составное/);if(k===2){const v=Number(m.answer),bound=Number(m.prompt.match(/большее (\d+)/)[1]);assert(v>bound&&v%2===1&&v%3===0);}
   if(k===4){const [d,t]=m.prompt.match(/\d+/g).map(Number);assert(Number(m.answer)%d===0&&Number(m.answer)%t!==0);}
   if(k===6)assert.equal(m.answer,'1');
  }k++;
 }
 const re=await surface(t,BOOK+'#n/51/051-6',storage(s));assert.equal(element(re,'[data-proof-probe]').value,'1');assert.match(element(re,'[data-logic-other]').value,/не простое/);
});
test('printed 52–54 distinguish accuracy, interval endpoints, prime exponents and a third operand',async t=>{
 const s=await surface(t,BOOK+'#n/52/052-a-1'),rows=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises.slice(51,54);
 const divs=n=>Array.from({length:n},(_,i)=>i+1).filter(d=>n%d===0),orig=[[105,225],[84,420],[273,110],[45,120,525]],decimal=v=>Number(String(v).replace(',','.')),op=(o,a,b)=>({add:a+b,subtract:a-b,multiply:a*b,divide:a/b})[o];
 for(const row of rows)for(const [i,p] of row.parts.entries()){
  await route(s,'#n/'+row.number+'/'+p.id);assert.match(sourcePresent(s).textContent,/Всё условие/);
  if(row.number===52){
   const x=p.expression,places=p.rounding.places,exact=op(x.op,decimal(x.left),decimal(x.right)),digit=Math.floor((exact+1e-8)*10**(places+1))%10;input(s,'[data-calc-exact]',String(Number(exact.toFixed(7))));const d=element(s,'[data-calc-digit]');d.value=String(digit);d.dispatchEvent(new s.w.Event('change',{bubbles:true}));click(s,'[data-calc-check]');assert.match(element(s,'[data-calc-feedback]').textContent,/решающая цифра верны/);
   input(s,'#answer',String(Math.round((exact+1e-8)*10**places)/10**places));submit(s,'#answer-form');assert(bookWork(s,p.id).correct);
   for(let j=0;j<32;j++){const m=s.w.PetersonAnalogues.create(52,p,j),y=m.expression,z=op(y.op,decimal(y.left),decimal(y.right));assert.equal(y.op,x.op);assert.equal(s.w.PetersonBook.M.equal(m.answer,String(Math.round((z+1e-8)*10**places)/10**places)),true);}
  }else if(row.number===53){
   const d=Number(p.id.split('-')[1]),xs=Array.from({length:15},(_,k)=>298+k).filter(v=>v%d===0);click(s,'[data-filter-pick="297"]');click(s,'[data-filter-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/297 исключена/);click(s,'[data-filter-pick="297"]');
   for(const x of xs)click(s,'[data-filter-pick="'+x+'"]');click(s,'[data-filter-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/все подходящие/);assert.deepEqual(bookWork(s,p.id).filterItems,xs);
   for(let j=0;j<32;j++){const m=s.w.PetersonAnalogues.create(53,p,j),[lo,hi]=m.prompt.match(/(\d+) < x ≤ (\d+)/).slice(1).map(Number),ys=Array.from({length:hi-lo},(_,k)=>lo+k+1).filter(v=>v%d===0);assert.equal(m.answer,ys.length?'{'+ys.join('; ')+'}':'∅');}
  }else{
   const ns=orig[i],g=divs(ns[0]).filter(x=>ns.every(n=>n%x===0)).at(-1);let l=Math.max(...ns);while(!ns.every(n=>l%n===0))l+=Math.max(...ns);
   assert.deepEqual([...s.w.PetersonBook.commonInputs[p.id]],ns);input(s,'[data-common-entry="0"]',String(g));input(s,'[data-common-entry="1"]',String(l));click(s,'[data-common-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/вычисления согласуются/);assert(bookWork(s,p.id).submitted&&!bookWork(s,p.id).correct);
   for(let j=0;j<32;j++){const m=s.w.PetersonAnalogues.create(54,p,j),xs=m.prompt.split('чисел ')[1].match(/\d+/g).map(Number),g=divs(xs[0]).filter(d=>xs.every(n=>n%d===0)).at(-1);let l=Math.max(...xs);while(!xs.every(n=>l%n===0))l+=Math.max(...xs);assert.equal(m.answer,'НОД '+g+', НОК '+l);}
  }
 }
 const re=await surface(t,BOOK+'#n/53/053-3',storage(s));assert.deepEqual(bookWork(re,'053-3').filterItems,[300,303,306,309,312]);
});
test('personal floor dimensions and the printed room distinguish area, volume and purchase rounding',async t=>{
 const s=await surface(t,BOOK+'#n/55/055-1'),rows=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises.slice(54,56);
 const fields={'055-1':['4,1','3,2','14,6','13,12','15','13'],'056-1':['15,12','52,92','53'],'056-2':['54,6','48,6','53,46','12','4,455','5']};
 for(const row of rows)for(const p of row.parts){await route(s,'#n/'+row.number+'/'+p.id);assert.match(sourcePresent(s).textContent,/Всё условие/);assert(!bookWork(s,p.id).correct);
  const vals=fields[p.id],put=(i,v)=>input(s,'[data-room-field="'+i+'"]',v);vals.forEach((v,i)=>put(i,v));const stage=p.id==='055-1'?2:p.id==='056-1'?1:5;put(stage,'4');click(s,'[data-room-check]');assert.match(element(s,'[data-room-feedback]').textContent,/Периметр|на высоту|целое/);put(stage,vals[stage]);
  const layer=p.id==='056-2'?'openings':'area';click(s,'[data-room-layer="'+layer+'"]');click(s,'[data-room-check]');assert.match(element(s,'[data-room-feedback]').textContent,/проверены|согласуются/);
  if(p.id==='055-1'){const draft=element(s,'[data-room-sketch]').textContent;assert.match(draft,/4,1 м/);assert.match(draft,/3,2 м/);}
  if(p.id==='056-2'){assert.equal(element(s,'[data-room-sketch] svg').querySelectorAll('rect').length,6);input(s,'#answer','4');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/48 м²/);}
  click(s,'[data-room-use]');submit(s,'#answer-form');const w=bookWork(s,p.id);assert.equal(w.roomLayer,layer);if(p.kind==='written')assert(w.submitted&&!w.correct);else assert(w.correct&&!w.independent);
  for(let j=0;j<45;j++){const model=s.w.PetersonAnalogues.create(row.number,p,j),[a,b]=model.prompt.match(/длину ([\d,]+) м и ширину ([\d,]+) м/).slice(1).map(x=>Math.round(10*Number(x.replace(',','.'))));
   let answer;if(row.number===55)answer=model.prompt.includes('периметр')?Math.round(2*(a+b)/10):Math.floor((a*b+50)/100);else{
    const h=Math.round(10*Number(model.prompt.match(/Высота ([\d,]+) м/)[1].replace(',','.')));
    if(p.id==='056-1')answer=Math.floor((a*b*h+500)/1000);
    else{const nums=[...model.prompt.matchAll(/(?:окно |дверь )([\d,]+) ×/g)].map(z=>Math.round(Number(z[1].replace(',','.'))*10)),r=Number(model.prompt.match(/рулонов по (\d+) м²/)[1]),net=2*(a+b)*h-nums[0]*15-nums[1]*20;answer=Math.ceil(net*11/(r*1000));}
   }assert(s.w.PetersonBook.M.equal(model.answer,String(answer)),p.id+' '+model.prompt);
  }
 }
 const re=await surface(t,BOOK+'#n/55/055-1',storage(s));assert.equal(element(re,'[data-room-field="0"]').value,'4,1');assert.match(element(re,'#answer').value,/13,12 м²/);
});
test('source 57 ranks all valid mushroom assignments, source 58 admits only compatible codes',async t=>{
 const s=await surface(t,BOOK+'#n/57/057-1'),bank=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises,keys=['АБВ','ГДЕ','ЖЗИ','ЙКЛ','МНО','ПРС','ТУФ','ХЦЧ','ШЩЪ','ЫЬЭ','ЮЯ '],code=x=>[...x].map(c=>keys.findIndex(g=>g.includes(c))).join('');
 let witness=0;for(let a=0;a<8;a++)for(let b=0;b<8;b++)for(let v=0;v<8;v++)for(let g=0;g<8;g++)if(a+b===v+g&&a+g<b+v&&g>v){assert(b>g&&g>v&&v>a);witness++;}assert(witness>0);
 for(const [i,v] of [1,4,2,3].entries())input(s,'[data-mushroom-count="'+i+'"]',String(v));assert.equal([...element(s,'[data-mushroom-results]').querySelectorAll('li')].filter(e=>!e.textContent.includes('не выполнено')).length,3);
 for(const i of [1,2,3,0])click(s,'[data-mushroom-rank="'+i+'"]');click(s,'[data-mushroom-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/Гена нашёл больше/);for(const i of [2,3,0,3,2,0])click(s,'[data-mushroom-rank="'+i+'"]');
 input(s,'[data-mushroom-proof]','Подстановка даёт Б > Г, а разности Б − Г и В − А равны.');click(s,'[data-mushroom-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/всем трём/);assert(bookWork(s,'057-1').submitted&&!bookWork(s,'057-1').correct);
 const model=s.w.PetersonAnalogues;for(let i=0;i<48;i++){const m=model.create(57,bank[56].parts[0],i),[a,b,c,d]=m.prompt.match(/\. ([А-Яа-яЁё]+) \+ ([А-Яа-яЁё]+) = ([А-Яа-яЁё]+) \+ ([А-Яа-яЁё]+)/).slice(1);assert.equal(m.answer,[b,d,c,a].join(' → '));}
 await route(s,'#n/58/058-1');assert.match(sourcePresent(s).textContent,/61551491/);const words=['ТЕРПЕНЬЕ','И','ТРУД','ВСЕ','ПЕРЕТРУТ'];assert.deepEqual(words.map(code),['61551491','2','6561','051','51516566']);
 click(s,'[data-secret-letter="Т"]');assert.match(element(s,'[data-secret-input]').value,/^Т_/);input(s,'[data-secret-input]','ТЕРПЕНЬЕ');for(const [i,w] of words.entries()){const sel=element(s,'[data-secret-word]');sel.value=String(i);sel.dispatchEvent(new s.w.Event('change',{bubbles:true}));input(s,'[data-secret-input]',w);}
 click(s,'[data-secret-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/сложилась пословица/);assert(bookWork(s,'058-1').submitted&&!bookWork(s,'058-1').correct);
 input(s,'#answer','ТЕРПЕНЬЕ И ТРУД ВСЁ ПЕРЕТРУГ');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/позиция 8/);input(s,'#answer','ТЕРПЕНЬЕ И ТРУД ВСЁ ПЕРЕТРУУ');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/Все коды совпали/);
 for(let i=0;i<48;i++){const m=model.create(58,bank[57].parts[0],i),wordCode=m.prompt.match(/записи (\d+)\?/)[1];assert.deepEqual([...m.choices].filter(w=>code(w)===wordCode),[m.answer]);}
 const re=await surface(t,BOOK+'#n/58/058-1',storage(s));assert.equal(element(re,'[data-secret-word]').value,'4');assert.equal(element(re,'[data-secret-input]').value,'ПЕРЕТРУТ');
});
test('all twelve statements of existence keep their domain and the two truth values oppose each other',async t=>{
 const s=await surface(t,BOOK+'#n/59/059-1'),rows=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises.slice(58,60);
 const select=(sel,v)=>{const f=element(s,sel);f.value=String(v);f.dispatchEvent(new s.w.Event('change',{bubbles:true}));};
 for(const row of rows)for(const [i,p] of row.parts.entries()){
  await route(s,'#n/'+row.number+'/'+p.id);assert.match(sourcePresent(s).textContent,/Всё условие/);if(row.number===59){
   if(i===5)assert.match(element(s,'.problem').textContent,/все слова/);if(i===6)assert.match(element(s,'.problem').textContent,/112/);
   assert.match(element(s,'[data-witness-result]').textContent,/— ложно.*— истинно/);click(s,'[data-witness-toggle="0"]');click(s,'[data-witness-toggle="2"]');assert.match(element(s,'[data-witness-result]').textContent,/свойством: 2.*— истинно.*— ложно/);
  }else{select('[data-reduce="reduceTop"]',15);select('[data-reduce="reduceBottom"]',20);select('[data-reduce="reduceBy"]',3);assert.match(element(s,'[data-reduction-result]').textContent,/остатки 0 и 2/);select('[data-reduce="reduceBy"]',5);assert.match(element(s,'[data-reduction-result]').textContent,/15\/20 = 3\/4/);}
  select('[data-logic-left]',1);select('[data-logic-right]',2);click(s,'[data-logic-use]');submit(s,'#answer-form');assert(element(s,'#feedback').classList.contains('error'));select('[data-logic-right]',1);input(s,'[data-logic-other]',p.answer);click(s,'[data-logic-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/Обоснование/);assert(bookWork(s,p.id).submitted&&!bookWork(s,p.id).correct);
  for(let j=0;j<32;j++){const m=s.w.PetersonAnalogues.create(row.number,p,j);assert.equal(new Set(m.choices).size,3);if(row.number===60){const [n,d,k]=m.prompt.match(/\d+/g).map(Number);assert.equal(m.answer,(n/k)+'/'+(d/k)+', значение прежнее');}else{assert.equal(m.choices.filter(x=>x===m.answer).length,1);assert(!m.prompt.includes('«'+m.answer+'»'));}}
 }
 const re=await surface(t,BOOK+'#n/59/059-6',storage(s));assert.equal(bookWork(re,'059-6').witnessMask,5);assert.match(element(re,'[data-witness-result]').textContent,/свойством: 2/);
});
test('each fraction claim distinguishes existence, a universal statement and a specified number; equivalent proofs invert truth twice',async t=>{
 const s=await surface(t,BOOK+'#n/61/061-1'),rows=JSON.parse(fs.readFileSync(path.join(ROOT,'school/peterson6/textbook/content/001-175.json'))).exercises.slice(60,62);
 const select=(sel,v)=>{const e=element(s,sel);e.value=String(v);e.dispatchEvent(new s.w.Event('change',{bubbles:true}));},scopes=[1,2,2,2,2,2,3,1];
 const cases=[[[4,4],/4\/4 = 1/],[[3,2,4,3],/17\/6/],[[3],/2\/3 > 2\/7/],[[1,4,2,5],/5\/20.*8\/20/],[[6,3],/целая часть 2, остаток 0/],[[1,2,1,4],/натуральное число 2/],[[],/7\/16.*0,4375/],[[1,4],/1250.*10000/]];
 for(const [i,p] of rows[0].parts.entries()){await route(s,'#n/61/'+p.id);assert.match(sourcePresent(s).textContent,/Всё условие/);
  cases[i][0].forEach((v,j)=>select('[data-claim-field="'+j+'"]',v));click(s,'[data-claim-check]');assert.match(element(s,'[data-claim-result]').textContent,cases[i][1]);
  select('[data-logic-left]',scopes[i]);select('[data-logic-right]',2);click(s,'[data-logic-use]');submit(s,'#answer-form');assert(element(s,'#feedback').classList.contains('error'));select('[data-logic-right]',1);input(s,'[data-logic-other]',p.answer);click(s,'[data-logic-use]');submit(s,'#answer-form');assert.match(element(s,'#feedback').textContent,/Обоснование/);assert(bookWork(s,p.id).submitted&&bookWork(s,p.id).assisted&&!bookWork(s,p.id).correct);
  for(let j=0;j<32;j++){const m=s.w.PetersonAnalogues.create(61,p,j);assert.equal(new Set(m.choices).size,3);if(i===2){const [a,b]=m.prompt.match(/больше (\d+)\/(\d+)/).slice(1).map(Number);assert.equal(m.answer,a+'/'+(b-1));}
   if(i===3){const [a,b]=m.prompt.match(/знаменателями (\d+) и (\d+)/).slice(1).map(Number);assert.equal(Number(m.answer),a*b);}
   if(i===4){const [a,b]=m.prompt.match(/дроби (\d+)\/(\d+)/).slice(1).map(Number);assert.equal(Number(m.answer),Math.floor(a/b));}
   if(i===5){const [a,b]=[...m.prompt.matchAll(/1\/(\d+)/g)].map(x=>Number(x[1]));assert.equal(Number(m.answer),b/a);}}
 }
 await route(s,'#n/62/062-1');select('[data-pair-truth]','false');assert.deepEqual([...element(s,'[data-pair-status]').children].map(e=>!e.textContent.includes('не подтверждена')),[false,true,true,false]);select('[data-pair-truth]','true');assert.deepEqual([...element(s,'[data-pair-status]').children].map(e=>!e.textContent.includes('не подтверждена')),[true,false,false,true]);
 const test=xs=>{for(const i of xs)click(s,'[data-proof-pair="'+i+'"]');click(s,'[data-pair-use]');submit(s,'#answer-form');return element(s,'#feedback').textContent;};assert.match(test([0,1,2,3]),/требуют одной истинности/);assert.match(test([0,1,2,3,3,0,1,2]),/Пары совпадают/);assert(bookWork(s,'062-1').submitted&&!bookWork(s,'062-1').correct);
 const re=await surface(t,BOOK+'#n/62/062-1',storage(s));assert.equal(element(re,'[data-pair-truth]').value,'true');assert.deepEqual(bookWork(re,'062-1').proofLinks,[3,0,1,2]);
});
