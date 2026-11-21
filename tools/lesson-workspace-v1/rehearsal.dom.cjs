'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync(path.resolve(__dirname, '../../learning/teacher-rehearsal.js'), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setImmediate(resolve));
const item = { id: 'fixture:fractions', trainerId: 'fixture', contentId: 'fractions', contentVersion: 1, title: 'Сложение дробей', url: '/fixture.html' };
const sourceState = { answer: '', checks: 0, hints: 0, step: 0 };
function preview(body, seed = 7) {
  return { attempt: { id: 'private-preview', trainerId: item.trainerId, contentId: item.contentId,
    learnerId: 'teacher-secret', sourceAttemptId: body.attemptId || null,
    taskSpec: { trainerId: item.trainerId, contentId: item.contentId, seed: body.seed ?? seed, task: { prompt: '1/3 + 1/6' } },
    state: clone(sourceState), strokes: [], version: 0 } };
}
function fixture(t) {
  const dom = new JSDOM('<main></main>', { url: 'https://cabinet.example/learning/', runScripts: 'outside-only' });
  const w = dom.window, host = w.document.querySelector('main'), calls = [], frames = [], drawings = [], lessons = [], assignments = [], returns = [];
  let current = true, interactive = true, respond = async body => preview(body, body.attemptId ? 7 : 19), account = { id: 'teacher-one', role: 'teacher' };
  w.fetch = () => { throw Error('Rehearsal may only use its supplied read endpoint'); };
  w.LearningTrainerFrame = class {
    constructor(element, options) {
      this.options = options; this.attempt = clone(options.attempt); this.readOnly = options.readOnly;
      this.element = w.document.createElement('div'); element.append(this.element); frames.push(this);
    }
    update(attempt, options) { this.attempt = clone(attempt); this.readOnly = options.readOnly; }
    destroy() { this.destroyed = true; this.element.remove(); }
  };
  w.LearningDrawing = class {
    constructor(element, options) { this.options = options; this.canvas = w.document.createElement('canvas'); element.append(this.canvas); drawings.push(this); }
    update(strokes) { this.strokes = clone(strokes); }
    destroy() { this.destroyed = true; this.canvas.remove(); }
  };
  w.eval(source);
  t.after(() => { w.LearningTeacherRehearsal.clear(); w.close(); });
  const context = input => ({ account, catalog: { items: [item] }, source: input, isCurrent: () => current, canInteract: () => interactive,
    post: async (route, body) => { calls.push({ route, body: clone(body) }); return respond(body); },
    onLesson: material => lessons.push(clone(material)), onAssign: id => assignments.push(id), onBack: () => returns.push(true) });
  return { w, host, calls, frames, drawings, lessons, assignments, returns,
    mount: input => w.LearningTeacherRehearsal.mount(host, context(input || { attemptId: 'pupil-work' })),
    respond: callback => { respond = callback; }, current: value => { current = value; }, interact: value => { interactive = value; }, account: value => { account = value; },
    button: selector => host.querySelector(selector), change: change => frames.at(-1).options.onChange(change),
    stroke: (id = 'my-stroke') => drawings.at(-1).options.onStroke({ id, points: [{ x: .2, y: .3 }, { x: .5, y: .6 }] }) };
}

test('private native edits, hint, check and ink never write pupil work and resume their exact local state', async t => {
  const f = fixture(t), original = preview({ attemptId: 'pupil-work' });
  original.attempt.state.answer = '';
  f.respond(async () => original);
  const close = await f.mount();
  assert.equal(f.frames.at(-1).readOnly, false);
  assert.deepEqual(clone(f.frames.at(-1).attempt.taskSpec), original.attempt.taskSpec);
  assert.equal(f.frames.at(-1).attempt.learnerId, undefined, 'Only task data crosses into the trainer frame');
  f.change({ kind: 'state', state: { ...sourceState, answer: '1/2' } });
  f.change({ kind: 'hint', state: { ...sourceState, answer: '1/2', hints: 1 }, details: { step: 0 } });
  f.change({ kind: 'check', state: { ...sourceState, answer: '1/2', hints: 1, checks: 1 } });
  f.stroke();
  assert.equal(f.drawings.at(-1).strokes[0].author, 'teacher-one');
  assert.deepEqual(original.attempt.state, sourceState, 'The API result and pupil source are not aliased');
  assert.equal(original.attempt.strokes.length, 0);
  assert.equal(f.calls.length, 1, 'Native checks, hints, drawing and edits cause no requests');
  close(); await f.mount();
  assert.equal(f.frames.at(-1).attempt.state.answer, '1/2');
  assert.equal(f.frames.at(-1).attempt.state.hints, 1);
  assert.equal(f.frames.at(-1).attempt.state.checks, 1);
  assert.equal(f.drawings.at(-1).strokes.length, 1);
  assert(f.calls.every(call => call.route === '/teacher/rehearsal'));
  assert.match(f.host.querySelector('[data-rehearsal-private]').textContent, /в этой вкладке/);
  assert.match(f.host.querySelector('.rehearsal-details').textContent, /до обновления страницы/);
  assert.equal(f.host.querySelector('.rehearsal-details').open, false);
});

test('explicit reset clears only the current private answer and sheet; lesson handoff keeps the exact source', async t => {
  const f = fixture(t); await f.mount();
  f.change({ kind: 'check', state: { ...sourceState, answer: 'wrong', checks: 2 } }); f.stroke('a'); f.stroke('b');
  f.button('[data-rehearsal-undo]').click(); assert.equal(f.drawings.at(-1).strokes.length, 1);
  f.button('[data-rehearsal-tool="eraser"]').click(); assert.equal(f.drawings.at(-1).tool, 'eraser');
  f.drawings.at(-1).options.onErase('a'); assert.equal(f.drawings.at(-1).strokes.length, 0);
  f.stroke('c'); f.button('[data-rehearsal-reset]').click();
  assert.deepEqual(clone(f.frames.at(-1).attempt.state), sourceState);
  assert.equal(f.drawings.at(-1).strokes.length, 0); assert.equal(f.calls.length, 1);
  f.button('[data-rehearsal-lesson]').click(); f.button('[data-rehearsal-assign]').click();
  assert.deepEqual(f.lessons, [{ trainerId: 'fixture', contentId: 'fractions', title: item.title, sourceAttemptId: 'pupil-work' }]);
  assert.deepEqual(f.assignments, ['fixture:fractions']);
});

test('native lesson, solution and independent-stage navigation remains usable and private', async t => {
  const f = fixture(t), close = await f.mount();
  const state = { ...sourceState, answer: 'partial solution', view: { stage: 4, gapOpen: true } };
  f.change({ kind: 'navigate', state, details: { stage: 4 } });
  assert.deepEqual(clone(f.frames.at(-1).attempt.state), state, 'Native stage navigation is semantic state, not a cabinet route');
  f.change({ kind: 'navigate', state: { ...sourceState, answer: 'discard this external navigation' }, details: { target: 'vilenkin-textbook-catalog' } });
  assert.deepEqual(clone(f.frames.at(-1).attempt.state), state);
  assert.equal(f.calls.length, 1); close(); await f.mount();
  assert.deepEqual(clone(f.frames.at(-1).attempt.state), state);
});

test('new variants have their own condition and cannot replace the draft keyed by the pupil source', async t => {
  const f = fixture(t); await f.mount();
  f.change({ kind: 'state', state: { ...sourceState, answer: 'original draft' } }); f.stroke();
  const oldFrame = f.frames.at(-1);
  f.change({ kind: 'newtask', state: { ...sourceState, answer: 'native temporary reset' } }); await tick();
  assert.equal(oldFrame.destroyed, true); assert.equal(f.calls.length, 2);
  assert.deepEqual(f.calls[1].body, { trainerId: 'fixture', contentId: 'fractions' });
  assert.equal(f.frames.at(-1).attempt.taskSpec.seed, 19);
  assert.match(f.host.querySelector('[data-rehearsal-source]').textContent, /Новый вариант/);
  f.button('[data-rehearsal-lesson]').click();
  assert.deepEqual(f.lessons.at(-1), { trainerId: 'fixture', contentId: 'fractions', title: item.title, seed: 19 });
  f.change({ kind: 'state', state: { ...sourceState, answer: 'new draft' } });
  oldFrame.options.onChange({ kind: 'state', state: { ...sourceState, answer: 'late old frame' } });
  f.button('[data-rehearsal-original]').click();
  assert.equal(f.frames.at(-1).attempt.state.answer, 'original draft');
  assert.equal(f.frames.at(-1).attempt.taskSpec.seed, 7); assert.equal(f.drawings.at(-1).strokes.length, 1);
  f.button('[data-rehearsal-lesson]').click(); assert.equal(f.lessons.at(-1).sourceAttemptId, 'pupil-work');
  f.change({ kind: 'new-task', state: sourceState }); await tick();
  await f.mount();
  assert.equal(f.frames.at(-1).attempt.state.answer, 'original draft', 'Reopening the source route restores its exact original copy');
});

test('account and route fences reject retained callbacks, and clear removes drafts and pending responses', async t => {
  const f = fixture(t); await f.mount();
  const frame = f.frames.at(-1), drawing = f.drawings.at(-1), lesson = f.button('[data-rehearsal-lesson]');
  f.current(false); frame.options.onChange({ kind: 'state', state: { ...sourceState, answer: 'stale' } });
  drawing.options.onStroke({ id: 'stale-ink', points: [{ x: .2, y: .2 }] }); lesson.onclick();
  assert.equal(f.lessons.length, 0); assert.equal(drawing.strokes.length, 0);
  f.current(true); let complete;
  f.respond(body => new Promise(resolve => { complete = () => resolve(preview(body, 25)); }));
  f.change({ kind: 'newtask', state: sourceState });
  f.w.LearningTeacherRehearsal.clear(); complete(); await tick();
  assert.equal(frame.destroyed, true); assert.equal(f.host.children.length, 0);
  f.respond(async body => preview(body)); await f.mount();
  assert.deepEqual(clone(f.frames.at(-1).attempt.state), sourceState);
  assert.equal(f.drawings.at(-1).strokes.length, 0);
  const count = f.frames.length;
  f.w.LearningTeacherRehearsal.clear();
  f.respond(body => new Promise(resolve => { complete = () => resolve(preview(body)); }));
  const pending = f.mount(); f.w.LearningTeacherRehearsal.clear(); complete(); await pending;
  assert.equal(f.frames.length, count, 'A read that finishes after account clearing cannot mount a frame');
});

test('initial and new-variant reads settle under a temporary identity shield without stranding the workspace', async t => {
  const f = fixture(t); let complete;
  f.respond(body => new Promise(resolve => { complete = () => resolve(preview(body, body.attemptId ? 7 : 23)); }));
  const pending = f.mount(); f.interact(false); complete(); await pending;
  assert.equal(f.frames.length, 1, 'The same route may adopt its authorized initial response while interaction is temporarily blocked');
  assert(f.button('[data-rehearsal-reset]'));
  f.change({ kind: 'state', state: { ...sourceState, answer: 'blocked initial input' } });
  f.stroke(); f.button('[data-rehearsal-lesson]').onclick(); f.button('[data-rehearsal-assign]').onclick();
  f.button('[data-rehearsal-back]').onclick();
  assert.deepEqual(clone(f.frames.at(-1).attempt.state), sourceState);
  assert.equal(f.drawings.at(-1).strokes.length, 0);
  assert.equal(f.lessons.length + f.assignments.length + f.returns.length, 0);
  f.interact(true); f.change({ kind: 'state', state: { ...sourceState, answer: 'source survives shield' } });
  assert.equal(f.frames.at(-1).attempt.state.answer, 'source survives shield');
  f.button('[data-rehearsal-lesson]').click(); assert.equal(f.lessons.length, 1);
  f.change({ kind: 'newtask', state: sourceState });
  f.interact(false); complete(); await tick();
  assert.equal(f.frames.at(-1).attempt.taskSpec.seed, 23);
  assert.equal(f.frames.at(-1).readOnly, false, 'Settled response must not leave the temporary new-variant lock behind');
  f.change({ kind: 'check', state: { ...sourceState, answer: 'blocked variant input', checks: 1 } });
  f.stroke('blocked-variant'); f.button('[data-rehearsal-lesson]').onclick(); f.button('[data-rehearsal-original]').click();
  assert.deepEqual(clone(f.frames.at(-1).attempt.state), sourceState);
  assert.equal(f.drawings.at(-1).strokes.length, 0); assert.equal(f.lessons.length, 1);
  assert.equal(f.frames.at(-1).attempt.taskSpec.seed, 23, 'Retained controls cannot switch the private task during the shield');
  f.interact(true); f.change({ kind: 'state', state: { ...sourceState, answer: 'variant after shield' } });
  f.stroke('allowed-variant'); f.button('[data-rehearsal-lesson]').click();
  assert.equal(f.frames.at(-1).attempt.state.answer, 'variant after shield');
  assert.equal(f.drawings.at(-1).strokes.length, 1); assert.equal(f.lessons.at(-1).seed, 23);
  f.button('[data-rehearsal-original]').click();
  assert.equal(f.frames.at(-1).attempt.state.answer, 'source survives shield');
  assert.equal(f.calls.length, 2);
});

test('failed-read retry and back remain inert during the shield and resume afterward', async t => {
  const f = fixture(t); f.respond(async () => { throw Error('offline'); }); await f.mount();
  const retry = f.button('[data-rehearsal-retry]'), back = f.button('[data-rehearsal-back]');
  f.interact(false); retry.onclick(); back.onclick(); await tick();
  assert.equal(f.calls.length, 1); assert.equal(f.returns.length, 0);
  f.interact(true); back.click(); assert.equal(f.returns.length, 1);
  f.respond(async body => preview(body)); retry.click(); await tick();
  assert.equal(f.calls.length, 2); assert.equal(f.frames.length, 1);
});

test('a permanently stale lifetime still rejects its pending response and disposes cleanly', async t => {
  const f = fixture(t); let complete;
  f.respond(body => new Promise(resolve => { complete = () => resolve(preview(body)); }));
  const pending = f.mount(); f.current(false); complete(); const cleanup = await pending;
  assert.equal(f.frames.length, 0, 'A different account or route never adopts the old result');
  cleanup(); assert.equal(f.host.children.length, 0);
  f.current(true); f.respond(async body => preview(body)); await f.mount();
  assert.equal(f.frames.length, 1); assert.deepEqual(clone(f.frames.at(-1).attempt.state), sourceState);
});

test('drafts are account scoped, bounded to twelve copies, and preserve a catalog seed during revalidation', async t => {
  const f = fixture(t); await f.mount();
  f.change({ kind: 'state', state: { ...sourceState, answer: 'teacher one' } });
  f.account({ id: 'teacher-two', role: 'teacher' }); await f.mount();
  assert.equal(f.frames.at(-1).attempt.state.answer, '');
  f.account({ id: 'teacher-one', role: 'teacher' }); await f.mount();
  assert.equal(f.frames.at(-1).attempt.state.answer, 'teacher one');
  for (let index = 0; index < 12; index++) await f.mount({ attemptId: 'different-' + index });
  await f.mount(); assert.equal(f.frames.at(-1).attempt.state.answer, '', 'The oldest copy is evicted at the documented bound');
  await f.mount({ trainerId: 'fixture', contentId: 'fractions' });
  f.change({ kind: 'state', state: { ...sourceState, answer: 'catalog draft' } });
  await f.mount({ trainerId: 'fixture', contentId: 'fractions' });
  assert.equal(f.calls.at(-1).body.seed, 19); assert.equal(f.frames.at(-1).attempt.state.answer, 'catalog draft');
});

test('rejected or stale reads cannot replace the visible work; untrusted titles stay text', async t => {
  const f = fixture(t);
  f.respond(async body => { const result = preview(body); result.attempt.title = '<img src=x onerror=alert(1)>'; return result; });
  await f.mount(); assert.equal(f.host.querySelector('img'), null);
  assert.equal(f.host.querySelector('[data-rehearsal-title]').textContent, '<img src=x onerror=alert(1)>');
  f.change({ kind: 'state', state: { ...sourceState, answer: 'retained' } });
  f.change({ kind: 'state', state: { answer: 'x'.repeat(150000) } });
  assert.equal(f.frames.at(-1).attempt.state.answer, 'retained');
  f.respond(async () => { throw Error('offline'); }); f.change({ kind: 'newtask', state: sourceState }); await tick();
  assert.equal(f.frames.at(-1).attempt.state.answer, 'retained');
  assert.equal(f.frames.at(-1).readOnly, false);
  assert.match(f.host.querySelector('[data-rehearsal-status]').textContent, /Не удалось/);
  f.account({ id: 'pupil', role: 'student' });
  const count = f.calls.length; await assert.rejects(f.mount(), /LEARNING_FORBIDDEN/); assert.equal(f.calls.length, count);
});
