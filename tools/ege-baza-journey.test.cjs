'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const files = ['ege-baza/registry.js', 'ege-baza/foundation-reference.js', 'ege-baza/data-reference.js', 'ege-baza/course-definitions.js',
  'ege-baza/course-state.js', 'ege-baza/backup.js', 'ege-baza/path/data.js', 'ege-baza/path/practice.js', 'ege-baza/path/equation-practice.js', 'ege-baza/course-journey.js'];
function runtime(minimal = false) {
  const context = vm.createContext({});
  for (const file of minimal ? ['ege-baza/course-journey.js'] : files) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  return context;
}
const plain = value => JSON.parse(JSON.stringify(value));
function storage(values = {}, blocked = []) {
  const text = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]));
  return { text, reads: [], writes: 0, getItem(key) { this.reads.push(key); if (blocked.includes(key)) throw Error('storage denied'); return text[key] ?? null; },
    setItem() { this.writes++; throw Error('must not write'); }, removeItem() { this.writes++; throw Error('must not remove'); } };
}
function pathSave(lessons = {}) { return { version: 1, serial: 30, lessons, seen: {}, runs: [], active: null }; }
function lesson(extra = {}) { return { seed: 12, stage: 3, step: 0, help: false, attempted: false, independent: 0, guided: 0, note: '', draft: '', checks: [], ...extra }; }
function ui(seed = 12, extra = {}) { return { version: 1, seed, finalDraft: '', stepDraft: '', feedback: '', stepFeedback: '', stepAnswers: [], feedbackKind: '',
  helpOpen: false, modelOpen: false, stepsOpen: false, whyOpen: false, noteOpen: false, model: null, ...extra }; }
function activeRun(ctx, kind = 'exam', count = 1) {
  const ids = Array.from({ length: 21 }, (_, i) => ctx.PathData.meta.find(item => item.pos === i + 1).id), seed = 40;
  const answers = ids.slice(0, count).map((id, index) => {
    const task = ctx.PathData.task(id, seed + index), value = ctx.PathData.answerText(task);
    return { id, seed: seed + index, value, correct: ctx.PathData.correct(task, value), previouslySeen: false };
  });
  return { kind, ids, seed, answers, i: count, start: 100, draft: '42', assisted: false };
}
function find(snapshot, id) { return snapshot.lines.flatMap(line => line.items).find(item => item.id === id); }
function actualPathValidator(ctx) {
  const source = fs.readFileSync(path.join(root, 'ege-baza/path/app.js'), 'utf8');
  const start = source.indexOf('const integer='), end = source.indexOf('try{let raw=localStorage');
  assert(start >= 0 && end > start, 'locate the existing loader validation without rewriting it');
  vm.runInContext('window = globalThis;', ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'ege-baza/path/task-first.js'), 'utf8'), ctx);
  return vm.runInContext('(function(){const D=PathData;\n' + source.slice(start, end) + '\nreturn valid;})()', ctx);
}

test('catalog contains every actual EGE family once, including focused practice, without grade 7 or duplicate exam coverage', () => {
  const ctx = runtime();
  ctx.PathData.meta.push({ id: 'grade7-fake', pos: 17, title: 'Other course', grade7: true }, { id: 'pre7-fake', pos: 1, title: 'Other course', pre7: true });
  const result = ctx.EgeBazaJourney.snapshot(storage());
  assert.equal(result.status, 'empty');
  assert.deepEqual(plain(result.lines.map(line => line.total)), [29, 13, 25, 14, 12, 18, 2]);
  const ids = result.lines.slice(0, 6).flatMap(line => line.groups[0].items.map(item => item.id));
  assert.equal(ids.length, 111); assert.equal(new Set(ids).size, 111);
  assert(ids.includes('equations-brackets')); assert(!ids.includes('grade7-fake')); assert(!ids.includes('pre7-fake'));
  assert.equal(result.lines[0].groups[1].total, 6); assert.equal(result.lines[1].groups[1].total, 4);
  assert.equal(result.lines[6].items.length, 2);
});

test('helpers are lazy, deterministic, bounded to a line and return only static site links', () => {
  const ctx = runtime(true), meta = [{ id: 'b', pos: 17, title: 'B' }, { id: 'a', pos: 4, title: 'A' }, { id: 'c', pos: 11, title: 'C' },
    { id: 'bad#javascript:1', pos: 4, title: 'Bad' }, { id: 'school', pos: 17, title: 'School', grade7: true }];
  assert.equal(ctx.EgeBazaJourney.lineForLesson('a', meta).id, 'm03');
  assert.equal(ctx.EgeBazaJourney.nextLesson('a', meta).id, 'b');
  assert.equal(ctx.EgeBazaJourney.nextLesson('b', meta), null);
  assert.equal(ctx.EgeBazaJourney.lineForLesson('school', meta), null);
  assert.equal(ctx.EgeBazaJourney.lineForLesson('bad#javascript:1', meta), null);
  assert.equal(ctx.EgeBazaJourney.lineForLesson('a', meta).href, '/ege-baza/index.html#line?line=m03');
});

test('a genuine mixed shared save retains EGE history, but resume needs the complete metadata catalog', () => {
  const ctx = runtime(), key = ctx.EgeBazaJourney.keys.path;
  const save = pathSave({ round: lesson({ independent: 35, guided: 4 }), 'grade7-a-expression-structure': lesson() });
  const store = storage({ [key]: save }), before = JSON.stringify(store.text), result = ctx.EgeBazaJourney.snapshot(store);
  assert.equal(result.status, 'partial'); assert.equal(result.lines[0].independent, 1);
  assert.equal(result.sources.path.resumeCompatible, false); assert.equal(result.sources.path.resumeStatus, 'unverified');
  assert.equal(result.recommendation.kind, 'recovery');
  assert.equal(find(result, 'round').independentCount, 35); assert.equal(find(result, 'round').confirmed, false);
  assert.equal(JSON.stringify(store.text), before); assert.equal(store.writes, 0); assert.equal(store.reads.length, 3);
  vm.runInContext(fs.readFileSync(path.join(root, 'ege-baza/path/grade7-algebra.js'), 'utf8'), ctx);
  assert.equal(actualPathValidator(ctx)(save), true, 'the genuine grade7 ID and record are supported by the actual path loader');
  const complete = ctx.EgeBazaJourney.snapshot(store);
  assert.equal(complete.status, 'saved'); assert.equal(complete.sources.path.resumeCompatible, true);
});

test('guided work and opening a lesson do not invent independent progress or a resume point', () => {
  const ctx = runtime(), store = storage({ [ctx.EgeBazaJourney.keys.path]: pathSave({ round: lesson(), units: lesson({ guided: 3 }) }) });
  const result = ctx.EgeBazaJourney.snapshot(store);
  assert.equal(find(result, 'round').status, 'unstarted'); assert.equal(find(result, 'round').resume, false);
  assert.equal(find(result, 'units').status, 'guided'); assert.equal(result.lines[0].independent, 0);
  assert.notEqual(result.recommendation.kind, 'resume');
});

test('a real saved task-first draft resumes the exact lesson without discarding either draft or changing its seed', () => {
  const ctx = runtime(), row = lesson({ taskFirst: ui(12, { finalDraft: '8', stepDraft: '3' }) }), save = pathSave({ round: row });
  const store = storage({ [ctx.EgeBazaJourney.keys.path]: save }), before = JSON.stringify(store.text), result = ctx.EgeBazaJourney.snapshot(store);
  assert.equal(result.recommendation.href, '/ege-baza/path/index.html#lesson=round'); assert.equal(result.recommendation.kind, 'resume');
  assert.equal(find(result, 'round').resume, true); assert.equal(JSON.stringify(store.text), before);
  assert(!/последн/i.test(result.recommendation.reason));
});

test('editing an answer after success preserves the valid historical independent result', () => {
  const ctx = runtime(), row = lesson({ done: true, attempted: true, independent: 1, draft: '12/',
    checks: [{ seed: 12, correct: true, independent: true }], taskFirst: ui(12, { finalDraft: '12/' }) });
  const store = storage({ [ctx.EgeBazaJourney.keys.path]: pathSave({ box: row }) }), before = JSON.stringify(store.text);
  const result = ctx.EgeBazaJourney.snapshot(store);
  assert.equal(result.status, 'saved'); assert.equal(find(result, 'box').status, 'independent');
  assert.equal(find(result, 'box').independentCount, 1); assert.equal(find(result, 'box').resume, false);
  assert.equal(result.lines[4].independent, 1); assert.equal(JSON.stringify(store.text), before);
});

test('an unfinished check takes priority over lesson drafts and returns its existing check route', () => {
  const ctx = runtime(), save = pathSave({ round: lesson({ draft: '5' }) }); save.active = activeRun(ctx);
  const result = ctx.EgeBazaJourney.snapshot(storage({ [ctx.EgeBazaJourney.keys.path]: save }));
  assert.equal(result.recommendation.kind, 'resume-check'); assert.equal(result.recommendation.href, '/ege-baza/path/index.html#exam');
  assert.equal(result.lines[6].items[1].resume, true); assert.equal(result.checks.active.reason.includes('1 из 21'), true);
});

test('legacy module results remain a separate group and incomplete legacy checks can be resumed', () => {
  const ctx = runtime(), bank = ctx.EgeBazaCourseState.forModule('m01').bank, tasks = bank.tasks.filter(task => task.phase === 'practice' && task.skill === 'decimal');
  const practice = Object.fromEntries(tasks.map(task => [task.id, { tries: 1, hints: false, solution: false, done: true, answer: String(task.answer) }]));
  const result = ctx.EgeBazaJourney.snapshot(storage({ [ctx.EgeBazaJourney.keys.m01]: { v: 1, practice, runs: { diagnostic: { answers: {}, helped: false, finishedAt: null } } } }));
  assert.equal(result.lines[0].total, 29); assert.equal(result.lines[0].independent, 0);
  assert.equal(result.lines[0].groups[1].independent, 1); assert.equal(find(result, 'm01-decimal').status, 'independent');
  assert.equal(result.recommendation.href, '/trainers/ege-baza/course/#test-diagnostic');
});

test('a failed later repeat is shown as needing review rather than preserving old confirmation', () => {
  const ctx = runtime(), bank = ctx.EgeBazaCourseState.forModule('m01').bank;
  const run = (phase, at, wrongSkill) => ({ answers: Object.fromEntries(bank.tasks.filter(task => task.phase === phase).map(task =>
    [task.id, String(task.answer + (task.skill === wrongSkill ? 1 : 0))])), helped: false, finishedAt: at });
  const saved = { v: 1, practice: {}, runs: { checkpoint: run('checkpoint', 100), repeat: run('repeat', 200, 'decimal') } };
  const result = ctx.EgeBazaJourney.snapshot(storage({ [ctx.EgeBazaJourney.keys.m01]: saved }), 300);
  assert.equal(find(result, 'm01-decimal').status, 'need-review'); assert.equal(find(result, 'm01-decimal').confirmed, false);
  assert.equal(find(result, 'm01-percent').status, 'repeated'); assert.equal(result.lines[0].groups[1].confirmed, 5);
  assert.equal(result.recommendation.kind, 'review');
});

test('corrupt, blocked and partially corrupt sources stay unknown rather than zero', () => {
  const ctx = runtime(), keys = ctx.EgeBazaJourney.keys;
  let result = ctx.EgeBazaJourney.snapshot(storage({ [keys.path]: '{bad', [keys.m01]: '{bad' }, [keys.m02]));
  assert.equal(result.lines[0].independent, null); assert.equal(find(result, 'round').status, 'unknown');
  assert.equal(result.sources.path.status, 'unreadable'); assert.equal(result.sources.m02.status, 'blocked');
  assert.equal(result.recommendation.kind, 'recovery');
  result = ctx.EgeBazaJourney.snapshot(storage({ [keys.path]: pathSave({ round: lesson({ independent: -1 }), units: lesson({ independent: 2 }) }) }));
  assert.equal(result.status, 'partial'); assert.equal(find(result, 'round').independent, null); assert.equal(result.lines[0].independent, null);
  assert.equal(result.lines[0].knownIndependent, 1); assert.equal(find(result, 'units').independent, true);
});

test('invalid legacy answers are unknown and do not silently become an empty module', () => {
  const ctx = runtime(), key = ctx.EgeBazaJourney.keys.m01;
  const result = ctx.EgeBazaJourney.snapshot(storage({ [key]: { v: 1, practice: { surprise: {} }, runs: {} } }));
  assert.equal(result.sources.m01.status, 'unreadable'); assert.equal(result.lines[0].groups[1].independent, null);
  assert.equal(result.lines[0].independent, 0); assert.equal(find(result, 'm01-decimal').status, 'unknown');
});

test('finished or interrupted checks report their actual result without implying mastery', () => {
  const ctx = runtime(), save = pathSave(), run = activeRun(ctx, 'diagnostic', 0);
  run.answers = run.ids.map((id, index) => ({ id, seed: run.seed + index, value: '', correct: false, skipped: true }));
  run.finished = 200; run.interrupted = true; run.assisted = true; save.runs = [run];
  const result = ctx.EgeBazaJourney.snapshot(storage({ [ctx.EgeBazaJourney.keys.path]: save })), item = result.lines[6].items[0];
  assert.equal(item.status, 'completed'); assert.equal(item.result.correct, 0); assert.equal(item.result.interrupted, true);
  assert.equal(item.result.assisted, true); assert.equal(item.confirmed, false); assert.equal(result.lines[6].completed, 1);
});

test('forged check correctness and unsupported versions do not produce progress', () => {
  const ctx = runtime(), save = pathSave(); save.active = activeRun(ctx); save.active.answers[0].correct = !save.active.answers[0].correct;
  let result = ctx.EgeBazaJourney.snapshot(storage({ [ctx.EgeBazaJourney.keys.path]: save }));
  assert.equal(result.status, 'partial'); assert.equal(result.lines[6].completed, null); assert.equal(result.checks.active, null);
  save.version = 2; result = ctx.EgeBazaJourney.snapshot(storage({ [ctx.EgeBazaJourney.keys.path]: save }));
  assert.equal(result.sources.path.status, 'unreadable'); assert.equal(result.lines[0].started, null);
});

test('a corrupt sibling rejected by the real all-or-nothing loader disables every path resume claim', () => {
  const ctx = runtime(), row = lesson({ seed: 123, independent: 1, draft: '12/', taskFirst: ui(123, { finalDraft: '12/' }) });
  const save = pathSave({ box: row, fractions: { broken: true } }); save.active = activeRun(ctx);
  assert.equal(actualPathValidator(ctx)(save), false, 'the actual trainer would reject the entire document');
  const store = storage({ [ctx.EgeBazaJourney.keys.path]: save }), before = JSON.stringify(store.text);
  const result = ctx.EgeBazaJourney.snapshot(store);
  assert.equal(result.status, 'partial'); assert.equal(result.sources.path.resumeCompatible, false);
  assert.equal(result.sources.path.resumeStatus, 'rejected'); assert.equal(find(result, 'box').independentCount, 1);
  assert.equal(find(result, 'box').resume, false); assert.equal(result.checks.active, null);
  assert(result.lines.flatMap(line => line.items).filter(item => item.source === 'path').every(item => !item.resume));
  assert.equal(result.recommendation.kind, 'recovery'); assert(result.recommendation.href.startsWith('/ege-baza/index.html#'));
  assert(!result.recommendation.reason.includes('сохранит текущее условие'));
  assert.equal(JSON.stringify(store.text), before); assert.equal(store.writes, 0);
});

test('an unsupported sibling ID never establishes exact resume even when its structure looks valid', () => {
  const ctx = runtime(), save = pathSave({ box: lesson({ draft: '12/' }), 'grade7-not-an-actual-lesson': lesson() });
  assert.equal(actualPathValidator(ctx)(save), false);
  const result = ctx.EgeBazaJourney.snapshot(storage({ [ctx.EgeBazaJourney.keys.path]: save }));
  assert.equal(result.sources.path.resumeStatus, 'unverified'); assert.equal(result.recommendation.kind, 'recovery');
  assert.equal(find(result, 'box').resume, false); assert.equal(result.lines[4].started, 1);
});

test('unavailable localStorage does not throw or attempt to establish another persistence channel', () => {
  const ctx = runtime();
  Object.defineProperty(ctx, 'localStorage', { get() { throw Error('blocked'); } });
  const result = ctx.EgeBazaJourney.snapshot();
  assert.equal(result.status, 'blocked'); assert.equal(result.recommendation.kind, 'recovery');
  assert.equal(result.lines[0].independent, null);
});
