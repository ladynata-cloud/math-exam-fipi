'use strict';
// Independent checks for the authored course bank and the public workshop API.
// Browser layout and real multi-tab locking are verified separately in Chromium.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = __dirname;
const KEY = 'mathexam.peterson5.workshop.v1';
const LEGACY_KEY = 'mathexam.peterson5.v1';
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const scripts = ['math.js', 'models.js', 'data.js', 'workshop-data.js', 'workshop.js', 'app.js'];

function runtime(options = {}) {
  const dom = new JSDOM(read('index.html'), {
    url: 'https://mathexam.test/school/peterson5/' + (options.hash || '#home'),
    runScripts: 'outside-only', pretendToBeVisual: true
  });
  const w = dom.window;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  if (options.raw !== undefined) w.localStorage.setItem(KEY, options.raw);
  else if (options.saved) w.localStorage.setItem(KEY, JSON.stringify(options.saved));
  if (options.legacy) w.localStorage.setItem(LEGACY_KEY, JSON.stringify(options.legacy));
  for (const file of scripts) w.eval(read(file));
  assert(w.PetersonWorkshop, 'The workshop public API is available');
  return {
    dom, w, d: w.document, api: w.PetersonWorkshop,
    close() { w.close(); },
    state() { return clone(w.PetersonWorkshop.getState()); }
  };
}

function emptyState() {
  return { version: 1, entries: {}, checks: {}, models: {}, last: null };
}

let assertions = 0;
function ok(value, label) { assertions++; assert(value, label); }
function equal(actual, expected, label) { assertions++; assert.deepEqual(clone(actual), clone(expected), label); }

function checkContent(r) {
  const topics = r.w.PetersonWorkshopData.topics;
  const original = r.w.PetersonCourse.lessons;
  equal(topics.length, 43, 'All 43 existing topics receive an authored learning path');
  equal(topics.map(t => t.id), original.map(t => t.id), 'The original topic order and IDs remain authoritative');
  equal(original.reduce((n, t) => n + t.tasks.length, 0), 131, 'The original 131 textbook tasks remain separate');
  const originalIds = new Set(original.flatMap(t => t.tasks.map(q => q.id)));
  const ids = new Set();
  let steps = 0, choices = 0, sets = 0;
  function task(q, id, needsSteps) {
    equal(q.id, id, 'Stable authored task ID: ' + id);
    ok(!originalIds.has(id) && !ids.has(id), 'No ID collisions: ' + id);
    ids.add(id);
    // A complete mathematical question such as "Вычисли 3⁴." can be short.
    ok(typeof q.prompt === 'string' && q.prompt.trim().length >= 8, 'An explicit prompt exists: ' + id);
    ok(typeof q.answer === 'string' && q.answer.trim().length > 0, 'Answer is explicit: ' + id);
    ok(['number', 'choice', 'set'].includes(q.kind), 'Supported answer kind: ' + id);
    ok(typeof q.explanation === 'string' && q.explanation.trim().length >= 12, 'A mathematical explanation exists: ' + id);
    ok(typeof q.hint === 'string' && q.hint.trim().length >= 6, 'A usable requested hint exists: ' + id);
    ok(Array.isArray(q.steps), 'Steps are explicitly declared: ' + id);
    if (needsSteps) ok(q.steps.length >= 2, 'Learning questions have checked intermediate work: ' + id);
    ok(r.api.check(q.answer, q), 'The published answer is accepted: ' + id);
    ok(!r.api.check('', q), 'An empty answer cannot succeed: ' + id);
    if (q.kind === 'choice') {
      choices++;
      ok(Array.isArray(q.choices) && q.choices.length >= 2, 'A meaningful choice: ' + id);
      equal(new Set(q.choices).size, q.choices.length, 'Choice labels are distinct: ' + id);
      ok(q.choices.includes(q.answer), 'The right choice is present: ' + id);
      for (const value of q.choices) if (value !== q.answer) ok(!r.api.check(value, q), 'A distractor is not accepted: ' + id);
    }
    if (q.kind === 'set') {
      sets++;
      const values = q.answer.trim().split(/\s+/);
      equal(new Set(values).size, values.length, 'Published sets do not contain duplicates: ' + id);
      ok(values.every(x => /^\d+$/.test(x)), 'Set items are nonnegative integers: ' + id);
      ok(r.api.check([...values].reverse().join(' '), q), 'Set order does not matter: ' + id);
      ok(!r.api.check(q.answer + ' ' + values[0], q), 'Repeated entries do not prove completeness: ' + id);
      if (values.length > 1) ok(!r.api.check(values.slice(1).join(' '), q), 'A partial enumeration is not complete: ' + id);
    }
    q.steps.forEach((step, i) => {
      steps++;
      ok(['number', 'choice'].includes(step.kind), 'Intermediate answer kind: ' + id + '/' + i);
      ok(typeof step.prompt === 'string' && step.prompt.trim().length > 0, 'A step asks the learner to act: ' + id + '/' + i);
      ok(typeof step.explanation === 'string' && step.explanation.trim().length > 0, 'Step explains its result: ' + id + '/' + i);
      ok(r.api.check(step.answer, step), 'Intermediate answer is accepted: ' + id + '/' + i);
      if (step.kind === 'choice') {
        ok(step.choices.includes(step.answer), 'Correct intermediate choice exists: ' + id + '/' + i);
        equal(new Set(step.choices).size, step.choices.length, 'Intermediate choices are distinct: ' + id + '/' + i);
      }
    });
  }
  for (const t of topics) {
    ok(typeof t.goal === 'string' && t.goal.length >= 12, 'A concrete learning goal: ' + t.id);
    ok(typeof t.why === 'string' && t.why.length >= 12, 'A reason to learn the topic: ' + t.id);
    equal(t.practice.length, 2, 'Two practice questions: ' + t.id);
    equal(t.check.length, 3, 'Three independent check questions: ' + t.id);
    const all = [t.discovery, ...t.practice, ...t.check];
    equal(new Set(all.map(q => q.prompt.trim())).size, 6, 'Check questions do not repeat the learning prompt: ' + t.id);
    task(t.discovery, t.id + '-discover', true);
    t.practice.forEach((q, i) => task(q, t.id + '-practice-' + (i + 1), true));
    t.check.forEach((q, i) => task(q, t.id + '-check-' + (i + 1), false));
  }
  equal(ids.size, 258, 'Exactly 258 separate authored questions');
  return { topics: topics.length, questions: ids.size, steps, choices, sets };
}

function checkAnswerBoundaries(r) {
  const check = r.api.check;
  const number = (answer, answerFormat) => ({ kind: 'number', answer, answerFormat });
  ok(check('0,75', number('3/4')), 'Decimal and ordinary fractions can be mathematically equivalent');
  ok(check('1 1/2', number('3/2')), 'Mixed and improper fractions can be equivalent');
  ok(check('6/8', number('3/4')), 'Equivalent unreduced fraction is allowed when reduction was not requested');
  ok(!check('6/8', number('3/4', 'reduced-fraction')), 'Requested reduction is enforced');
  ok(!check('3.0', number('3', 'integer')), 'Requested integer notation remains explicit');
  ok(check('2.5', number('2,5', 'decimal')), 'Both decimal separators are accepted');
  for (const value of ['', ' ', 'NaN', 'Infinity', '1/0', '2+3', '<img src=x>', '0,5,5']) {
    ok(!check(value, number('5')), 'Malformed numeric input is not a successful answer: ' + value);
  }
  const choice = { kind: 'choice', answer: '(a + b) · c', choices: ['a + b · c', '(a + b) · c'] };
  ok(check('(a + b) · c', choice), 'A structural expression choice is accepted exactly');
  ok(!check('a + b · c', choice), 'Losing parentheses is a mathematical error');
  const set = { kind: 'set', answer: '12 13 21 23 31 32' };
  ok(check('32 31 23 21 13 12', set), 'Complete reversed enumeration is correct');
  ok(!check('12 13 21 23 31 32 12', set), 'Duplicate enumeration is rejected');
  ok(!check('12 13 21 23 31 032 32', set), 'Different notation for a duplicate still repeats the same number');
  ok(!check('12 13 21 23 31', set), 'Missing one case is rejected');
  ok(!check('12 13 21 23 31 32 33', set), 'An extra inadmissible case is rejected');
  ok(!check('12 13 x 23 31 32', set), 'Non-numeric set element is rejected');
}

function checkStateBoundaries(r) {
  const topics = r.w.PetersonWorkshopData.topics;
  const t = topics[0], q = t.check[0];
  const state = emptyState();
  state.checks[t.id] = {
    answers: { [q.id]: q.answer }, drafts: {}, aided: false,
    score: 999, independent: true, complete: true
  };
  state.checks.unknown = { answers: { fake: '1' }, aided: false };
  state.entries.unknown = { correct: true, independent: true, value: '1' };
  const cleaned = clone(r.api.validateState(state));
  equal(cleaned.checks[t.id].answers[q.id], q.answer, 'A recognised first answer survives reload');
  ok(!Object.hasOwn(cleaned.checks, 'unknown'), 'Unknown topic cannot claim a check');
  ok(!Object.hasOwn(cleaned.entries, 'unknown'), 'Unknown task cannot claim mastery');
  ok(cleaned.checks[t.id].score !== 999, 'Imported scores are never authoritative');
  ok(!cleaned.checks[t.id].complete, 'One submitted answer cannot fabricate a completed three-question check');

  const invalid = emptyState();
  invalid.checks[t.id] = { answers: { [q.id]: '' }, drafts: {}, aided: 'false' };
  const badAnswer = clone(r.api.validateState(invalid));
  ok(!Object.hasOwn(badAnswer.checks[t.id]?.answers || {}, q.id), 'An empty saved answer is not a completed attempt');
  ok(badAnswer.checks[t.id]?.aided !== 'false', 'Assistance state cannot remain a truthy string');

  const poison = JSON.parse('{"version":1,"entries":{"__proto__":{"polluted":true},"constructor":{}},"checks":{"__proto__":{"polluted":true},"constructor":{}},"models":{"__proto__":{"polluted":true}},"last":null}');
  const safe = r.api.validateState(poison);
  ok(!Object.hasOwn(safe.entries, '__proto__'), 'Imported entry keys cannot set a prototype');
  ok(!Object.hasOwn(safe.checks, '__proto__'), 'Imported check keys cannot set a prototype');
  ok(!Object.prototype.polluted, 'No prototype pollution');
  assert.throws(() => r.api.validateState(null), 'Malformed root state is rejected');
  assert.throws(() => r.api.validateState({ ...emptyState(), version: 999 }), 'Unknown versions are not interpreted as version one');
  assertions += 2;
}

async function settled(r) {
  await r.api.whenIdle();
  await new Promise(resolve => setImmediate(resolve));
}

async function navigate(r, hash) {
  r.w.history.replaceState(null, '', hash);
  r.w.PetersonApp.route();
  await settled(r);
}

function enter(r, formSelector, q, value) {
  const form = r.d.querySelector(formSelector);
  assert(form, 'Expected form ' + formSelector);
  if (q.kind === 'choice') {
    const input = [...form.querySelectorAll('[data-w-value]')].find(node => node.value === value);
    assert(input, 'Expected choice ' + value);
    input.checked = true;
    input.dispatchEvent(new r.w.Event('change', { bubbles: true }));
  } else {
    const input = form.querySelector('[data-w-value]');
    input.value = value;
    input.dispatchEvent(new r.w.Event('input', { bubbles: true }));
  }
  return form;
}

async function submit(r, formSelector, q, value) {
  const form = enter(r, formSelector, q, value);
  form.dispatchEvent(new r.w.Event('submit', { bubbles: true, cancelable: true }));
  await settled(r);
}

async function click(r, selector) {
  const button = r.d.querySelector(selector);
  assert(button, 'Expected control ' + selector);
  button.click();
  await settled(r);
}

function topic(r, id) { return r.w.PetersonWorkshopData.topics.find(t => t.id === id); }

async function checkDOMJourneys() {
  let r = runtime({ hash: '#topic/p25/check' });
  try {
    await settled(r);
    const t = topic(r, 'p25');
    await submit(r, '[data-w-check-form]', t.check[0], 'NaN');
    equal(Object.keys(r.state().checks.p25.answers).length, 0, 'Malformed input does not use a check attempt');
    ok(r.d.querySelector('[data-w-status]').textContent.includes('не распознана'), 'Invalid format is explained');

    await submit(r, '[data-w-check-form]', t.check[0], '0');
    equal(r.state().checks.p25.answers[t.check[0].id], '0', 'The first wrong answer is saved immediately');
    ok(!r.d.querySelector('.workshop-check-review,[data-w-hint],[data-w-steps],[data-w-solution]'), 'No review or help controls during an unfinished check');
    ok(!r.d.querySelector('[data-w-body]').textContent.includes(t.check[0].explanation), 'The first answer explanation is withheld until the check ends');
    enter(r, '[data-w-check-form]', t.check[1], '17');
    await settled(r);
    const saved = r.state();
    r.close();
    r = runtime({ hash: '#topic/p25/check', saved });
    await settled(r);
    equal(r.d.querySelector('[data-w-check-form] [data-w-value]').value, '17', 'An unfinished check draft survives reload');
    equal(r.state().checks.p25.answers[t.check[0].id], '0', 'Reload does not replace the first response');

    await navigate(r, '#topic/p26/discover');
    equal(r.state().checks.p25.aided, false, 'Learning a different topic does not mark this check aided');
    await navigate(r, '#lesson/p25/0');
    equal(r.state().checks.p25.aided, true, 'Legacy learning in the same topic counts as repetition');
    await navigate(r, '#topic/p25/check');
    await submit(r, '[data-w-check-form]', t.check[1], t.check[1].answer);
    ok(!r.d.querySelector('.workshop-check-review'), 'Review remains hidden after two responses');
    await submit(r, '[data-w-check-form]', t.check[2], t.check[2].answer);
    equal(r.d.querySelectorAll('.workshop-check-review').length, 3, 'All explanations appear only after the third response');
    equal(r.d.querySelector('.workshop-score strong').textContent, '2', 'The score uses saved first responses');
    ok(r.d.querySelector('.workshop-result').textContent.includes('с повторением'), 'Aided assessment is labelled honestly');
    const finished = r.state().checks.p25;
    await navigate(r, '#topic/p25/check');
    equal(r.state().checks.p25, finished, 'Reopening a completed check cannot improve its score');
    ok(!r.d.querySelector('[data-w-check-form]'), 'There is no form to overwrite a completed first result');

    const incoming = emptyState();
    incoming.checks.p25 = { answers: Object.fromEntries(t.check.map(q => [q.id, q.answer])), drafts: {}, aided: false };
    const other = topic(r, 'p27');
    incoming.checks.p27 = { answers: { [other.check[0].id]: other.check[0].answer }, drafts: {}, aided: false };
    await r.api.importState(incoming);
    equal(r.state().checks.p25, finished, 'An import cannot replace the existing first check with a better result');
    equal(r.state().checks.p27.answers[other.check[0].id], other.check[0].answer, 'Untouched check work can be imported');
  } finally { r.close(); }

  r = runtime({ hash: '#topic/p26/check' });
  try {
    await settled(r);
    const t = topic(r, 'p26');
    for (const q of t.check) await submit(r, '[data-w-check-form]', q, q.answer);
    equal(r.d.querySelector('.workshop-score strong').textContent, '3', 'Independent correct check scores three');
    equal(r.state().checks.p26.aided, false, 'Independent check stays distinct from supported learning');
    const finished = r.state().checks.p26;
    await navigate(r, '#topic/p26/discover');
    await click(r, '[data-w-hint]');
    equal(r.state().checks.p26, finished, 'Help after completion does not rewrite historical provenance');
  } finally { r.close(); }

  r = runtime({ hash: '#topic/p25/practice/0' });
  try {
    await settled(r);
    const t = topic(r, 'p25'), q = t.practice[0];
    enter(r, '[data-w-form]', q, '16');
    const note = r.d.querySelector('#workshop-notes');
    note.value = 'Две целые содержат четырнадцать седьмых.';
    note.dispatchEvent(new r.w.Event('input', { bubbles: true }));
    await settled(r);
    await submit(r, '[data-w-form]', q, '16');
    equal(r.state().entries[q.id].firstWrong, '16', 'The first mathematical error is retained');
    await click(r, '[data-w-steps]');
    for (const step of q.steps) await submit(r, '[data-w-step-form]', step, step.answer);
    equal(r.d.querySelectorAll('.workshop-step.is-done').length, q.steps.length, 'All completed intermediate actions stay visible');
    await submit(r, '[data-w-form]', q, q.answer);
    const work = r.state().entries[q.id];
    equal(work.first, '16', 'A corrected result does not overwrite the first answer');
    equal(work.firstWrong, '16', 'A corrected result does not erase its first error');
    ok(work.accepted && work.aided, 'Assisted correct work is accepted without calling it independent');
    const saved = r.state();
    r.close();
    r = runtime({ hash: '#topic/p25/practice/0', saved });
    await settled(r);
    equal(r.state().entries[q.id], work, 'The entire learning record survives reload');
    equal(r.d.querySelector('#workshop-notes').value, note.value, 'The learner note survives reload');
    equal(r.d.querySelectorAll('.workshop-step.is-done').length, q.steps.length, 'Accepted intermediate steps survive reload');
  } finally { r.close(); }

  r = runtime({ hash: '#topic/p06/discover' });
  try {
    await settled(r);
    const q = topic(r, 'p06').discovery, values = q.answer.split(' ');
    const add = async value => {
      r.d.querySelector('#set-one').value = value;
      await click(r, '[data-w-add]');
    };
    await add(values[0]);
    await add('0' + values[0]);
    equal(r.d.querySelector('[data-w-form] [data-w-value]').value, values[0], 'The set builder rejects the same number with a leading zero');
    for (const value of values.slice(1)) await add(value);
    equal(r.d.querySelectorAll('[data-w-remove]').length, values.length, 'Each found case is visible as a removable chip');
    await click(r, '[data-w-remove="1"]');
    equal(r.d.querySelectorAll('[data-w-remove]').length, values.length - 1, 'A mistaken case can be removed before checking');
    await add(values[1]);
    const reordered = r.d.querySelector('[data-w-form] [data-w-value]').value;
    await submit(r, '[data-w-form]', q, reordered);
    ok(r.state().entries[q.id].accepted, 'An actively assembled set is accepted independent of entry order');
  } finally { r.close(); }

  r = runtime({ hash: '#topic/p25/practice/0' });
  try {
    await settled(r);
    const q = topic(r, 'p25').practice[0];
    enter(r, '[data-w-form]', q, '1');
    enter(r, '[data-w-form]', q, '17');
    const note = r.d.querySelector('#workshop-notes');
    note.value = 'Быстро записанный черновик';
    note.dispatchEvent(new r.w.Event('input', { bubbles: true }));
    r.w.history.replaceState(null, '', '#topic/p26/discover');
    r.w.PetersonApp.route();
    await settled(r);
    equal(r.state().entries[q.id].value, '17', 'Rapid input followed by navigation retains the latest characters');
    equal(r.state().entries[q.id].note, 'Быстро записанный черновик', 'A pending note save is not lost during navigation');
    const before = r.state().entries[q.id], incoming = emptyState();
    incoming.entries[q.id] = { value: q.answer, first: q.answer, accepted: true, attempts: 1, note: 'Другая версия' };
    const untouched = topic(r, 'p26').practice[0];
    incoming.entries[untouched.id] = { value: untouched.answer, first: untouched.answer, accepted: true, attempts: 1 };
    await r.api.importState(incoming);
    equal(r.state().entries[q.id], before, 'Import preserves unfinished local answers and notes');
    ok(r.state().entries[untouched.id].accepted, 'Import adds a genuinely untouched learning question');

    // A stale in-memory view must merge a later unrelated disk record before writing.
    const external = r.state(), later = topic(r, 'p28').practice[0];
    external.entries[later.id] = { value: '19/12', note: 'Работа из другой вкладки' };
    r.w.localStorage.setItem(KEY, JSON.stringify(external));
    await navigate(r, '#topic/p25/practice/0');
    enter(r, '[data-w-form]', q, '18');
    await settled(r);
    equal(r.state().entries[later.id].note, 'Работа из другой вкладки', 'Fresh disk reads preserve an unrelated concurrent draft');
  } finally { r.close(); }

  // A pending learning action must not redraw a learning form over a check.
  r = runtime({ hash: '#topic/p25/practice/0' });
  try {
    await settled(r);
    r.d.querySelector('[data-w-hint]').click();
    r.w.history.replaceState(null, '', '#topic/p25/check');
    r.w.PetersonApp.route();
    await settled(r);
    ok(r.d.querySelector('[data-w-check-form]'), 'An async learning action cannot replace the newly opened check');
    ok(!r.d.querySelector('[data-w-form],[data-w-hint]'), 'Learning help does not leak into the check after a route race');
  } finally { r.close(); }

  r = runtime({ hash: '#topic/p25/practice/0', raw: '{broken JSON' });
  try {
    await settled(r);
    const q = topic(r, 'p25').practice[0];
    enter(r, '[data-w-form]', q, '17');
    await settled(r);
    equal(r.w.localStorage.getItem(KEY), '{broken JSON', 'Unreadable persisted work is never overwritten');
    equal(r.state().entries[q.id].value, '17', 'New work remains available in memory when persistence is blocked');
    equal(r.api.exportState().entries[q.id].value, '17', 'The in-memory work can still be exported');
    ok(!r.d.querySelector('#storage-warning').hidden, 'Storage failure has a visible explanation');
  } finally { r.close(); }
}

async function main() {
  const r = runtime();
  try {
    const content = checkContent(r);
    checkAnswerBoundaries(r);
    checkStateBoundaries(r);
    await checkDOMJourneys();
    console.log(JSON.stringify({ gate: 'PETERSON5_WORKSHOP_API_OK', assertions, ...content }));
  } finally { r.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
