'use strict';
// Engine integration checks. Browser pupil journeys and visual checks are separate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const html = fs.readFileSync(path.join(__dirname, '../trainers/arifmetika.html'), 'utf8');

function page(query = '?course=preoge&level=n3e', options = {}) {
  const records = [], faults = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => faults.push(error.message));
  let seed = 1907;
  const dom = new JSDOM(html, {
    url: 'https://example.test/trainers/arifmetika.html' + query,
    runScripts: 'dangerously', virtualConsole: console,
    beforeParse(w) {
      w.Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
      if (Object.prototype.hasOwnProperty.call(options, 'legacyRaw')) w.localStorage.setItem('mathExamCourseProgress.v1', options.legacyRaw);
      if (options.storageBlocked) w.Storage.prototype.setItem = () => { throw Error('Storage disabled'); };
      if (!options.missingModule) w.PreOgeArithmetic = {
        routeURL: level => '/trainers/oge-basics/arithmetic.html#' + level,
        guidedURL: level => /^n[345][cdef]$/.test(level) ? '/trainers/oge-basics/multiplication-division/long-division-from-simple-to-decimals.html' : null,
        summaryForLevel: level => {
          const solved = records.filter(r => r.level === level && !r.revealed);
          return { solved: solved.length, independent: solved.filter(r => !r.hints && !r.errors).length };
        },
        recordAttempt: record => { records.push(JSON.parse(JSON.stringify(record))); return !options.storageBlocked; }
      };
    }
  });
  return { dom, w: dom.window, records, faults };
}

function choose(w, level) {
  w.document.getElementById('level').value = level;
  w.document.getElementById('level').dispatchEvent(new w.Event('change', { bubbles: true }));
}
function answer(w, value) {
  w.document.getElementById('ans').value = String(value);
  w.document.getElementById('check').click();
}
function button(w, text) {
  const found = [...w.document.querySelectorAll('#btnrow button')].find(b => b.textContent === text);
  assert(found, 'Answer button: ' + text); found.click();
}
function partial(w) {
  const needed = w.task.steps[0].end + 1;
  while (w.selLen < needed) w.document.getElementById('more').click();
  while (w.selLen > needed) w.document.getElementById('less').click();
  w.document.getElementById('selok').click();
}

// These answers drive every engine through actual controls. Assertions below
// check the integration contract and ensure hints never perform a hidden step.
function nextAnswer(w) {
  const t = w.task, p = w.phase;
  switch (p) {
    case 'select': partial(w); return;
    case 'simple': answer(w, t.ansv); return;
    case 'vis': case 'pyth': answer(w, t.a * t.b); return;
    case 'seq': answer(w, t.N * (w.seqIdx + 1)); return;
    case 'fshadeq': answer(w, t.k + '/' + t.n); return;
    case 'fsame': answer(w, t.r + '/' + t.d); return;
    case 'cmp': button(w, t.sym); return;
    case 'yn': button(w, (t.D * t.mIdx) % t.dm === 0 ? 'Да' : 'Нет'); return;
    case 'noz': answer(w, t.N); return;
    case 'm1': answer(w, t.N / t.d1); return;
    case 'm2': answer(w, t.N / t.d2); return;
    case 'a1n': answer(w, t.a1 * (t.N / t.d1)); return;
    case 'a2n': answer(w, t.a2 * (t.N / t.d2)); return;
    case 'rsum': answer(w, t.op === '+' ? t.A1 + t.A2 : t.A1 - t.A2); return;
    case 'red': { let divisor = 2; while (t.ca % divisor || t.cb % divisor) divisor++; answer(w, divisor); return; }
    case 'comp': answer(w, t.N - w.seqIdx - 1); return;
    case 'c1': answer(w, Math.abs(10 - t.a)); return;
    case 'c2': answer(w, t.b - Math.abs(10 - t.a)); return;
    case 'c3': answer(w, t.op === '+' ? t.a + t.b : t.a - t.b); return;
    case 'pr': { let prime = true; for (let d = 2; d * d <= t.n; d++) if (t.n % d === 0) prime = false; button(w, prime ? 'Простое' : 'Составное'); return; }
    case 'fp': { let divisor = 2; while (t.cur % divisor) divisor++; answer(w, divisor); return; }
    case 'fq': answer(w, t.cur / t.pp); return;
    case 'cnt': answer(w, Math.max(t.un[t.ci].ea, t.un[t.ci].eb)); return;
    case 'prod': answer(w, t.pick.reduce((a, b) => a * b, 1)); return;
    case 'col': answer(w, t.csteps[w.cIdx].a); return;
    case 'comma': answer(w, t.decCount); return;
    case 'table': answer(w, t.N / t.d); return;
    case 'remq': answer(w, Math.floor(t.N / t.d)); return;
    case 'remr': answer(w, t.N % t.d); return;
    case 'shiftM': answer(w, String(t.origB).split(',')[1].length); return;
    case 'shiftA': answer(w, Number(t.origA.replace(',', '.')) * 10 ** t.m); return;
    case 'shiftB': answer(w, Number(t.origB.replace(',', '.')) * 10 ** t.m); return;
    case 'digit': answer(w, Math.floor(t.steps[w.stepIdx].partial / t.d)); return;
    case 'mult': answer(w, (w.trialDigit === null ? Math.floor(t.steps[w.stepIdx].partial / t.d) : w.trialDigit) * t.d); return;
    case 'sub': answer(w, t.steps[w.stepIdx].partial % t.d); return;
    default: throw Error('Uncovered phase: ' + p);
  }
}
let checkedPhases = 0;
function finish(w, hints = false) {
  for (let n = 0; n < 150 && !w.finished; n++) {
    const snapshot = JSON.stringify({ task: w.task, phase: w.phase, step: w.stepIdx, column: w.cIdx, sequence: w.seqIdx, errors: w.errors });
    if (hints) {
      w.document.getElementById('hint').click();
      assert.equal(JSON.stringify({ task: w.task, phase: w.phase, step: w.stepIdx, column: w.cIdx, sequence: w.seqIdx, errors: w.errors }), snapshot, 'A hint explains without changing work: ' + w.levelId + '/' + w.phase);
    }
    nextAnswer(w); checkedPhases++;
  }
  assert.equal(w.finished, true, 'Completes level ' + w.levelId + ', phase ' + w.phase);
}

const p = page(), { w, records } = p;
assert.equal(w.levelId, 'n3e');
assert.equal(w.document.getElementById('arithmetic-choices').open, false);
assert.equal(w.document.getElementById('arithmetic-rules').open, false);
assert.equal(w.document.getElementById('course-context').hidden, false);
const levels = Object.keys(w.LEVELS);
assert.equal(levels.length, 43);
for (const level of levels) {
  choose(w, level);
  const before = records.length, fingerprint = w.attemptFingerprint;
  finish(w);
  assert.equal(records.length, before + 1, 'Exactly one completed record: ' + level);
  assert.equal(records.at(-1).level, level);
  assert.equal(records.at(-1).fingerprint, fingerprint);
  assert.equal(records.at(-1).errors, 0);
  assert.equal(records.at(-1).hints, 0);
  assert.equal(records.at(-1).revealed, false);
  w.document.getElementById('check').click();
  w.document.getElementById('solution').click();
  w.finish();
  assert.equal(records.length, before + 1, 'Repeated completion never duplicates a result');
  choose(w, level);
  finish(w, true);
  assert.equal(records.at(-1).errors, 0, 'Hints do not create mistakes');
  assert(records.at(-1).hints > 0, 'Assistance recorded: ' + level);
  choose(w, level);
  const total = w.stats.total;
  w.document.getElementById('solution').click();
  assert.equal(w.finished, true);
  assert.equal(w.stats.total, total, 'Revealed work is not solved');
  assert.equal(records.at(-1).revealed, true);
  assert.equal(records.at(-1).level, level);
}
// Wrong first partial dividend has a meaningful error record.
choose(w, 'n4d');
w.selLen = 1; w.refresh(); w.document.getElementById('selok').click();
assert.equal(w.errors, 1);
finish(w);
assert.equal(records.at(-1).errors, 1);
// Blank and non-decimal values cannot silently become an accepted zero.
choose(w, 'n3e');
while (!(w.phase === 'sub' && w.task.steps[w.stepIdx].rem === 0)) nextAnswer(w);
for (const invalid of ['', '   ', 'Infinity', '0x0', '0e0', '.']) {
  const before = w.stepIdx;
  answer(w, invalid);
  assert.equal(w.finished, false, 'Invalid input is not a zero: ' + invalid);
  assert.equal(w.stepIdx, before);
}
finish(w);
// Selecting other exercises must not also select a partial dividend.
choose(w, 'n4d');
const length = w.selLen;
w.document.getElementById('level').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
assert.equal(w.selLen, length);
// The button keeps its native Enter behavior; the document shortcut stays out.
const firstPhase = w.phase;
w.document.getElementById('solution').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
assert.equal(w.phase, firstPhase);
assert.equal(w.errors, 0);
assert.deepEqual(p.faults, []);
p.dom.window.close();

for (const invalid of ['__proto__', 'constructor', 'n999', '%3Cscript%3E']) {
  const bad = page('?course=preoge&level=' + invalid);
  assert.equal(bad.w.levelId, 'n1a'); assert.deepEqual(bad.faults, []); bad.w.close();
}
const old = page('');
assert.equal(old.w.courseMode, false);
assert.equal(old.w.document.getElementById('arithmetic-title').textContent, 'Арифметика: 1–5 класс');
assert.equal(old.w.document.getElementById('arithmetic-rules').open, true);
assert(!old.w.document.getElementById('arithmetic-choices'));
old.w.close();
for (const options of [{ storageBlocked: true }, { missingModule: true }]) {
  const blocked = page('?course=preoge&level=n1a', options);
  finish(blocked.w);
  assert.equal(blocked.w.document.getElementById('course-save-warning').hidden, false);
  assert.deepEqual(blocked.faults, []);
  blocked.w.close();
}
// A broken shared store is not a reason to destroy its unrelated course data.
for (const legacyRaw of ['{broken', 'null', '[]', '{"topics":[]}', '{"topics":null}', '{"topics":{"arithmeticCourse":{"total":3,"right":2,"streak":1,"history":"bad shape"}}}', '{"topics":{"arithmeticCourse":{"total":"3","right":2,"streak":1}}}']) {
  const broken = page('?course=preoge&level=n1a', { legacyRaw });
  finish(broken.w);
  assert.equal(broken.w.localStorage.getItem('mathExamCourseProgress.v1'), legacyRaw, 'Malformed shared data stays byte-identical');
  assert.equal(broken.w.document.getElementById('legacy-save-warning').hidden, false);
  assert.equal(broken.records.length, 1, 'The new course can still record this exercise');
  assert.deepEqual(broken.faults, []);
  broken.w.close();
}
const preserved = page('?course=preoge&level=n1a', { legacyRaw: JSON.stringify({ marker: 'keep', topics: { otherTopic: { solved: 17 }, arithmeticCourse: { total: 3, right: 2, streak: 1, history: [] } } }) });
finish(preserved.w);
const legacy = JSON.parse(preserved.w.localStorage.getItem('mathExamCourseProgress.v1'));
assert.equal(legacy.marker, 'keep');
assert.deepEqual(legacy.topics.otherTopic, { solved: 17 });
assert.equal(legacy.topics.arithmeticCourse.total, 4);
preserved.w.close();
const otherRoot = page('?course=preoge&level=n1a', { legacyRaw: '{"ogeBasicsOrder":{"solved":7}}' });
finish(otherRoot.w);
const rootProgress = JSON.parse(otherRoot.w.localStorage.getItem('mathExamCourseProgress.v1'));
assert.deepEqual(rootProgress.ogeBasicsOrder, { solved: 7 });
assert.equal(rootProgress.topics.arithmeticCourse.total, 1);
assert.equal(otherRoot.w.document.getElementById('legacy-save-warning').hidden, true);
otherRoot.w.close();
console.log('PASS arithmetic integration: 43 levels; ' + checkedPhases + ' phase actions; hints, reveals, duplicate finish, invalid input, course/legacy navigation and unavailable storage.');
