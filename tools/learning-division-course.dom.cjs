'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const division = require('../trainers/oge-basics/multiplication-division/division-lab-core');
const course = require('../trainers/oge-basics/multiplication-division/division-course-core');
const remediation = require('../trainers/oge-basics/learning-contracts');
const contracts = require('../board-server/learning-contracts');
const scaffolds = require('../trainers/oge-basics/learning-scaffolds');
const managedSource = fs.readFileSync(require.resolve('../trainers/oge-basics/learning-managed'), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));

// Captured from the 36 pre-existing topics at base 7b80a1be82888fe46ebd6f3ded78453bb52a44cb.
// Existing saved tasks include exact authored fields, their order and the fresh state.
const column = require('../trainers/oge-basics/multiplication-division/multiplication-column-core.js');
const oldItems = remediation.list().filter(item => !column.has(item.contentId) && !course.has(item.contentId) && item.contentId !== 'multiplication-division/quotient-estimate');
assert.equal(oldItems.length, 36);
const oldTasks = oldItems.flatMap(({ contentId }) => [0, 1, 17, 12345, 4294967295].map(seed => [contentId, seed, remediation.create(contentId, seed)]));
assert.equal(crypto.createHash('sha256').update(JSON.stringify(oldTasks)).digest('hex'), '04ea262f68c4ebcf8d7d55e168871283885c3ca5f21af3601f26f5505a21c5df', 'The 180 old saved-task identities must remain byte-for-byte unchanged');

function mount(envelope, readOnly = false) {
  const dom = new JSDOM('<main id="learning-remediation-root"></main>', { url: 'https://example.test/?learning=1', runScripts: 'outside-only' });
  const { window } = dom;
  const calls = [];
  let bridge;
  window.MathExamRemediationManaged = true;
  window.DivisionLab = division;
  window.DivisionCourse = course;
  window.MathExamRemediation = remediation;
  window.LearningScaffolds = scaffolds;
  window.MathExamLearning = { register: value => { bridge = value; } };
  window.eval(managedSource);
  bridge.subscribe(event => calls.push(clone(event)));
  const before = JSON.stringify(envelope);
  bridge.applyState({ ...clone(envelope), readOnly });
  assert.equal(JSON.stringify(envelope), before);
  const host = window.document.querySelector('main');
  const state = () => clone(bridge.getState());
  const type = value => {
    const input = host.querySelector('#lm-answer');
    assert(input, envelope.taskSpec.contentId + ': one current answer field');
    input.value = value;
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  };
  const check = value => {
    type(value); host.querySelector('#lm-check').click();
    const event = calls.at(-1);
    assert.equal(event.kind, 'check');
    const normalized = contracts.normalize('oge-basics', envelope.taskSpec, event.state);
    const result = contracts.evaluate('oge-basics', envelope.taskSpec, event.details, normalized);
    assert.equal(event.state.feedback.kind, result.correct ? 'correct' : 'incorrect');
    return result;
  };
  return { dom, window, host, calls, bridge, state, type, check };
}

function visibleHistory(t, spec) {
  const count = t.state().answers.length;
  if (spec.divisionTask) {
    const group = spec.divisionTasks.find(item => count < item.endIndex) || spec.divisionTasks.at(-1);
    const plan = division.plan(group ? group.task : spec.divisionTask);
    const step = count - (group ? group.startIndex : 0);
    if (step < plan.normalizationEnd) {
      assert(t.host.querySelector('.lm-normalize'), 'Changing the comma is shown before the corner');
      return;
    }
    const board = t.host.querySelector('.lm-division');
    assert(board, spec.contentId + ': the corner stays on screen');
    assert(!board.closest('[hidden], details:not([open])'));
    const values = selector => [...board.querySelectorAll(selector)].map(row => row.textContent);
    assert.deepEqual(values('.lm-working .product'), plan.cycles.filter(cycle => step > cycle.productAction).map(cycle => String(cycle.product)), 'Previously accepted multiplication rows remain visible');
    assert.deepEqual(values('.lm-working .remainder'), plan.cycles.filter(cycle => step > cycle.subtractAction).map(cycle => String(cycle.remainder)), 'Previously accepted subtraction rows remain visible');
    const action = plan.actions[step];
    if (action?.kind === 'start') assert.equal(board.querySelectorAll('.lm-working > .lm-number:first-child .active').length, action.sourceIndex + 1, 'Highlight the complete starting number');
    if (action?.cycle === 0 && ['digit', 'product', 'subtract'].includes(action.kind)) {
      const highlighted = [...board.querySelectorAll('.lm-working > .lm-number:first-child .active')];
      assert.equal(highlighted.length, plan.cycles[0].sourceIndex + 1, 'Keep the complete first number highlighted after choosing the start, including brief prompts');
      assert.equal(highlighted.map(cell => cell.textContent).join(''), plan.digits.slice(0, plan.cycles[0].sourceIndex + 1).join(''));
    }
    if (action?.kind === 'subtract') assert(board.querySelector('.product.lm-current-row'), 'Highlight the multiplication row being subtracted');
    if (action?.kind === 'bring') assert(board.querySelector('.remainder.lm-current-row'), 'Highlight the remainder receiving the next digit');
    if (action?.kind === 'partial') {
      const previous = plan.cycles.find(cycle => cycle.sourceIndex + 1 === action.sourceIndex);
      const row = board.querySelector('.remainder.lm-current-row');
      assert(row, 'Keep the previous remainder highlighted while reading the new number');
      assert.equal(row.textContent, String(previous.remainder));
    }
    return;
  }
  if (!count) return;
  const trail = t.host.querySelector('.lm-estimate-trail');
  assert(trail, spec.contentId + ': accepted actions must stay on screen');
  assert.equal(trail.querySelectorAll('p').length, count);
  assert(!trail.closest('[hidden]'));
  const details = trail.closest('details');
  assert(!details || details.open, 'Accepted actions cannot be hidden in collapsed history');
}

function noCheckpointReveal(t, spec) {
  assert.equal(spec.divisionTask, null);
  assert.equal(t.host.querySelectorAll('.lm-division, .lm-normalize, .lm-scaffold').length, 0, 'Independent questions cannot prefill an answer board or a worked scaffold');
  const feedback = t.host.querySelector('.lm-feedback.incorrect');
  if (feedback) {
    const current = spec.steps[t.state().step];
    const numbers = feedback.textContent.match(/\d+(?:[.,]\d+)?/g) || [];
    assert(!numbers.includes(String(current.answer).replace('.', ',')), 'Wrong feedback must not disclose the final answer');
  }
}

function microVisual(t, spec, helped = false) {
  const visual = spec.steps[t.state().step]?.visual;
  if (!visual) return;
  const active = [...t.host.querySelectorAll('.lm-course-digits > .active')];
  if (visual.kind === 'first') {
    assert.equal(active.length, helped ? visual.sourceIndex + 1 : 1, 'The entire starting number is revealed only after explicit help');
    assert.equal(active.map(node => node.textContent).join(''), String(visual.digits).slice(0, active.length));
  } else if (visual.kind === 'bring') {
    assert.equal(active.length, 1, 'Transfer exactly one highlighted digit');
    assert.equal(active[0].textContent, String(visual.digits)[visual.sourceIndex]);
  }
}

assert.equal(course.stages.length, 17);
assert.equal(new Set(course.stages.map(stage => stage.id)).size, 17);
let actions = 0, restores = 0, checks = 0;
for (const stage of course.stages) {
  const envelope = contracts.create('oge-basics', stage.id, 17);
  const { taskSpec: spec } = envelope;
  const checkpoint = stage.guidance === 'check';
  assert.equal(spec.title, stage.title);
  assert(spec.steps.length, stage.id + ': action sequence');
  assert.deepEqual(contracts.create('oge-basics', stage.id, 17), envelope, 'Canonical creation must be deterministic');
  assert.deepEqual(contracts.normalize('oge-basics', spec, envelope.state), envelope.state);
  if (checkpoint) {
    checks++;
    assert.equal(spec.divisionTasks.length, 3, 'A checkpoint contains three complete questions');
    assert.equal(new Set(spec.divisionTasks.map(item => item.prompt)).size, 3, 'The three questions must be different');
  }
  let t = mount(envelope);
  assert.equal(t.host.querySelector('h1').textContent, stage.title);
  assert.equal(t.calls.length, 0);
  assert.equal(t.state().step, 0);
  if (checkpoint) noCheckpointReveal(t, spec);
  const resumeAt = new Set([0, Math.floor(spec.steps.length / 2), spec.steps.length - 1]);
  for (let step = 0; step < spec.steps.length; step++) {
    assert.equal(t.state().step, step);
    assert.equal(t.host.querySelectorAll('#lm-answer').length, 1);
    assert.equal(t.host.querySelector('#lm-answer').value, '');
    visibleHistory(t, spec);
    microVisual(t, spec);
    if (stage.slug === 'digit-choice') assert.equal(t.host.querySelectorAll('.lm-digit-table').length, 0, 'The answer table is revealed only on explicit help');
    if (resumeAt.has(step)) {
      assert.equal(t.check('99999999').correct, false);
      assert.equal(t.state().step, step);
      assert.equal(t.state().completed, false);
      if (checkpoint) noCheckpointReveal(t, spec);
      const saved = { taskSpec: spec, state: t.state() };
      t.dom.window.close();
      t = mount(JSON.parse(JSON.stringify(saved)));
      restores++;
      assert.deepEqual(t.state(), saved.state);
      assert.equal(t.host.querySelector('#lm-answer').value, '99999999');
      assert.equal(t.host.querySelectorAll('.lm-feedback.incorrect').length, 1);
      assert.equal(t.calls.length, 0);
      visibleHistory(t, spec);

      const observer = mount(saved, true);
      const observed = observer.state();
      assert(observer.host.querySelector('#lm-answer').disabled);
      assert(observer.host.querySelector('#lm-check').disabled);
      assert(observer.host.querySelector('#lm-hint').disabled);
      assert(observer.host.querySelector('#lm-note').readOnly);
      observer.host.querySelector('#lm-check').click();
      observer.host.querySelector('#lm-hint').click();
      assert.equal(observer.calls.length, 0);
      assert.deepEqual(observer.state(), observed);
      visibleHistory(observer, spec);
      observer.dom.window.close();

      const beforeHint = t.state();
      t.host.querySelector('#lm-hint').click();
      assert.equal(t.calls.at(-1).kind, 'hint');
      assert.equal(t.calls.at(-1).details.level, 2);
      assert.equal(t.state().hint, Math.max(beforeHint.hint, 2), 'A first hint must not erase previously recorded full help');
      assert.equal(t.state().step, step);
      assert.equal(t.state().answer, '99999999');
      assert.deepEqual(t.state().answers, beforeHint.answers);
      assert.equal(t.state().completed, false);
      assert.equal(contracts.assistance('oge-basics', spec, t.state()), true);
      microVisual(t, spec, true);
      if (stage.slug === 'digit-choice' && spec.steps[step].kind === 'digit') {
        assert.equal(t.host.querySelectorAll('.lm-digit-table .lm-scaffold-selected').length, 0, 'The first hint leaves the digit choice to the learner');
        assert.equal(t.host.querySelectorAll('[data-scaffold-result]').length, 0, 'The first hint must not expose the final answer');
        assert(t.host.querySelectorAll('[data-help-number]').length > 0, 'The first hint highlights the numbers used now');
        assert.doesNotMatch(t.host.querySelector('.lm-feedback').textContent, /✓ Берём|На этом шаге запиши/);
        t.host.querySelector('#lm-solution').click();
        assert.equal(t.calls.at(-1).kind, 'hint');
        assert.equal(t.calls.at(-1).details.level, 3);
        assert.equal(t.state().hint, 3);
        assert.equal(t.state().step, step);
        assert.deepEqual(t.state().answers, beforeHint.answers);
        assert.equal(t.state().completed, false);
        const selected = t.host.querySelectorAll('.lm-digit-table .lm-scaffold-selected');
        assert.equal(selected.length, 1, 'The explicitly requested solution highlights one complete correct row');
        const digit = Number(spec.steps[step].answer);
        const group = spec.divisionTasks[spec.steps[step].taskIndex];
        const base = Number(group.prompt.split(':')[1].trim());
        assert.deepEqual([...selected[0].children].map(cell => cell.textContent), [String(digit), digit + ' × ' + base, digit * base + '✓ Берём ' + digit]);
        assert.equal(t.host.querySelector('#lm-answer').value, '99999999', 'Highlighted help does not fill the answer');
      }
      contracts.normalize('oge-basics', spec, t.state());
    }
    const result = t.check(String(spec.steps[step].answer));
    assert.equal(result.correct, true, stage.id + ': action ' + step);
    assert.equal(result.complete, step === spec.steps.length - 1);
    if (!checkpoint) assert.equal(result.assisted, true, 'Guided actions must not receive independent-work credit');
    else assert(!result.assisted, 'A checkpoint answer itself is not guided; any separately requested help is recorded in state');
    assert.equal(t.state().step, step + 1);
    assert.equal(t.state().completed, step === spec.steps.length - 1);
    visibleHistory(t, spec);
    actions++;
  }
  const completed = { taskSpec: spec, state: t.state() };
  t.dom.window.close();
  const restoredComplete = mount(completed);
  assert.equal(restoredComplete.state().completed, true);
  assert.equal(restoredComplete.host.querySelector('#lm-answer'), null);
  visibleHistory(restoredComplete, spec);
  restoredComplete.dom.window.close();
}
assert.equal(checks, 2);

function trustedOutcomes() {
  for (const stage of course.stages.filter(stage => stage.order <= 6 || stage.guidance === 'check')) {
    const first = contracts.create('oge-basics', stage.id, 1).taskSpec;
    const second = contracts.create('oge-basics', stage.id, 2).taskSpec;
    assert.notEqual(contracts.questionIdentity(first), contracts.questionIdentity(second), stage.id + ': new actual questions require a new server fingerprint');
  }
  const { LearningStore } = require('../board-server/learning-store');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'division-course-gate-'));
  let nextSeed = 0;
  const controlled = { ...contracts, create(trainerId, id, seed) { return contracts.create(trainerId, id, seed === undefined ? ++nextSeed : seed); } };
  const store = new LearningStore({ filePath: path.join(directory, 'learning.sqlite'), contracts: controlled });
  try {
    assert.equal(store.available, true);
    const hash = 'scrypt1:' + '01'.repeat(16) + ':' + '02'.repeat(32);
    const teacher = store.activate(store.bootstrap({ name: 'Fixture teacher', login: 'division_teacher' }).invitationToken, hash).account;
    const student = store.activate(store.createStudent(teacher, { name: 'Fixture pupil', login: 'division_pupil' }).invitationToken, hash).account;
    const complete = initial => {
      let attempt = initial;
      for (let step = 0; step < attempt.taskSpec.steps.length; step++) {
        const answer = String(attempt.taskSpec.steps[step].answer), state = clone(attempt.state), answers = state.answers.slice();
        state.answers.push(answer); state.step = state.answers.length; state.answer = '';
        state.completed = state.step === attempt.taskSpec.steps.length;
        state.feedback = { kind: 'correct', scope: 'step', step, answer };
        attempt = store.action(student, attempt.id, { opId: crypto.randomUUID(), expectedVersion: attempt.version, type: 'check', payload: { state, details: { scope: 'step', step, answer, answers } } }).attempt;
      }
      return attempt;
    };
    const id = course.stages.find(stage => stage.slug === 'independent-check').id;
    const first = complete(store.createAttempt(student, { opId: crypto.randomUUID(), trainerId: 'oge-basics', contentId: id }).attempt);
    assert.equal(first.outcome, 'independent');
    const fresh = store.createAttempt(student, { opId: crypto.randomUUID(), trainerId: 'oge-basics', contentId: id, fresh: true, sourceAttemptId: first.id }).attempt;
    assert.notEqual(store.taskFingerprint(fresh.taskSpec), store.taskFingerprint(first.taskSpec));
    const repeated = complete(fresh);
    assert.equal(repeated.outcome, 'repeated', 'A fresh independent three-question check is a successful repeat, not familiar-question practice');
    const familiar = complete(store.newAttempt(student.id, teacher.id, 'oge-basics', contracts.create('oge-basics', id, repeated.taskSpec.seed), repeated.id));
    assert.equal(familiar.outcome, 'practiced', 'The identical questions cannot become a new independent repeat');
    const guided = course.stages.find(stage => stage.slug === 'whole-simple').id;
    const worked = complete(store.newAttempt(student.id, teacher.id, 'oge-basics', contracts.create('oge-basics', guided, 1)));
    assert.equal(worked.outcome, 'hinted', 'Guided corner actions are recorded as assisted work');
    let helped = store.newAttempt(student.id, teacher.id, 'oge-basics', contracts.create('oge-basics', id, 3));
    helped = store.action(student, helped.id, { opId: crypto.randomUUID(), expectedVersion: helped.version, type: 'hint', payload: { step: 0 } }).attempt;
    assert.equal(complete(helped).outcome, 'hinted', 'A requested checkpoint hint cannot receive independent credit');
  } finally { store.close(); fs.rmSync(directory, { recursive: true, force: true }); }
}

const localSource = fs.readFileSync(require.resolve('../trainers/oge-basics/multiplication-division/division-course-practice'), 'utf8');
function publicMount(stage, saved) {
  const file = stage.id.split('/').at(-1) + '.html';
  const html = fs.readFileSync(require.resolve('../trainers/oge-basics/multiplication-division/' + file), 'utf8');
  const dom = new JSDOM(html, { url: 'https://example.test/' + file, runScripts: 'outside-only' });
  const { window } = dom;
  const key = 'mathExamBasics.divisionCourse.v1.' + stage.id;
  if (saved !== undefined) window.localStorage.setItem(key, saved);
  window.MathExamRemediationManaged = false;
  window.DivisionLab = division;
  window.DivisionCourse = course;
  window.MathExamRemediation = remediation;
  window.LearningScaffolds = scaffolds;
  window.eval(localSource);
  let bridge;
  const register = window.MathExamLearning.register;
  window.MathExamLearning.register = value => { bridge = value; register(value); };
  window.eval(managedSource);
  const host = window.document.getElementById('learning-remediation-root');
  assert.equal(window.MathExamRemediationManaged, true);
  assert.equal(window.MathExamDivisionCourseLocal, true);
  window.document.getElementById('practice').click();
  assert.equal(window.document.getElementById('view-practice').hidden, false);
  const savedText = () => window.localStorage.getItem(key);
  const state = () => clone(bridge.getState());
  const type = value => {
    host.querySelector('#lm-answer').value = value;
    host.querySelector('#lm-answer').dispatchEvent(new window.Event('input', { bubbles: true }));
  };
  const check = value => { type(value); host.querySelector('#lm-check').click(); };
  return { dom, window, host, state, savedText, type, check };
}

async function publicChecks() {
  const selected = ['whole-simple', 'decimal-divisor', 'independent-check'].map(slug => course.stages.find(stage => stage.slug === slug));
  assert(selected.every(Boolean));
  for (const stage of selected) {
    const spec = remediation.create(stage.id, 1).taskSpec;
    let t = publicMount(stage);
    t.check('99999999');
    assert.equal(t.state().step, 0);
    t.host.querySelector('#lm-hint').click();
    assert.equal(t.state().hint, 2);
    assert.equal(t.state().answer, '99999999');
    let saved = t.savedText();
    assert.equal(JSON.parse(saved).errors, 1);
    assert.equal(JSON.parse(saved).assisted, true);
    t.dom.window.close();
    t = publicMount(stage, saved);
    assert.equal(t.host.querySelector('#lm-answer').value, '99999999');
    assert.equal(t.host.querySelectorAll('.lm-feedback.hint').length, 1);
    assert.equal(t.state().step, 0);
    for (let step = 0; step < spec.steps.length; step++) {
      if (step === Math.floor(spec.steps.length / 2)) {
        t.type('99999999');
        saved = t.savedText();
        t.dom.window.close();
        t = publicMount(stage, saved);
        assert.equal(t.state().step, step);
        assert.equal(t.host.querySelector('#lm-answer').value, '99999999');
        visibleHistory(t, spec);
      }
      t.check(String(spec.steps[step].answer));
      assert.equal(t.state().step, step + 1);
      visibleHistory(t, spec);
    }
    assert.equal(t.state().completed, true);
    saved = t.savedText();
    assert.equal(JSON.parse(saved).errors, 1);
    assert.equal(JSON.parse(saved).assisted, true);
    t.dom.window.close();
    t = publicMount(stage, saved);
    assert.equal(t.state().completed, true);
    assert.equal(t.host.querySelector('#lm-answer'), null);
    assert.doesNotMatch(t.window.document.querySelector('.course-local-notice').textContent, /без подсказок и ошибок/);
    t.host.querySelector('#lm-new').click();
    await Promise.resolve();
    const next = JSON.parse(t.savedText());
    assert.equal(next.seed, 2);
    assert.equal(next.errors, 0);
    assert.equal(next.assisted, false);
    assert.equal(t.state().step, 0);
    assert.equal(t.state().completed, false);
    t.dom.window.close();
  }

  const checkpoint = selected.at(-1), spec = remediation.create(checkpoint.id, 1).taskSpec;
  const independent = publicMount(checkpoint);
  for (const step of spec.steps) independent.check(String(step.answer));
  const result = JSON.parse(independent.savedText());
  assert.equal(result.assisted, false);
  assert.equal(result.errors, 0);
  assert.match(independent.window.document.querySelector('.course-local-notice').textContent, /Три примера решены без подсказок и ошибок/);
  independent.dom.window.close();

  const corrupt = '{broken saved progress';
  const recovery = publicMount(selected[0], corrupt);
  assert.match(recovery.window.document.querySelector('.course-local-notice').textContent, /оставлена без изменений/);
  recovery.type('99999999');
  assert.equal(recovery.savedText(), corrupt, 'Corrupted prior progress must not be overwritten');
  recovery.dom.window.close();
  return selected.length;
}

// Execute an actual wrapper in an iframe, including its deferred scripts,
// managed loader and real message bridge. Resources come only from this checkout.
async function managedHtmlChecks() {
  const root = path.resolve(__dirname, '..');
  class CheckoutResources extends ResourceLoader {
    fetch(url) {
      const parsed = new URL(url), file = path.resolve(root, '.' + parsed.pathname);
      assert.equal(parsed.origin, 'http://127.0.0.1');
      assert(file.startsWith(root + path.sep));
      return Promise.resolve(fs.readFileSync(file));
    }
  }
  const selected = ['whole-simple', 'independent-check'].map(slug => course.stages.find(stage => stage.slug === slug));
  for (const stage of selected) {
    const errors = [], virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', error => errors.push(error.message));
    const channel = 'divisionCourseABCDEFGHIJKLMNOPQRST';
    const url = '/trainers/oge-basics/' + stage.id + '.html?learning=1&parentOrigin=http%3A%2F%2F127.0.0.1&channel=' + channel;
    const dom = new JSDOM('<!doctype html><iframe src="' + url + '"></iframe>', { url: 'http://127.0.0.1/harness', runScripts: 'dangerously', resources: new CheckoutResources(), virtualConsole });
    const waitMessage = type => new Promise((resolve, reject) => {
      const timer = setTimeout(() => { dom.window.removeEventListener('message', receive); reject(Error('Managed HTML did not send ' + type + ': ' + errors.join('; '))); }, 5000);
      function receive(event) {
        if (event.data?.protocol !== 'mathexam-learning' || event.data?.type !== type) return;
        clearTimeout(timer); dom.window.removeEventListener('message', receive); resolve(event.data);
      }
      dom.window.addEventListener('message', receive);
    });
    try {
      const ready = await waitMessage('ready');
      const frame = dom.window.document.querySelector('iframe').contentWindow;
      frame.TextEncoder = TextEncoder;
      const envelope = contracts.create('oge-basics', stage.id, 17);
      const applied = waitMessage('applied');
      frame.dispatchEvent(new frame.MessageEvent('message', { source: dom.window, origin: 'http://127.0.0.1', data: {
        protocol: 'mathexam-learning', version: 1, channel, instance: ready.instance, type: 'hydrate', payload: { ...envelope, readOnly: false }
      } }));
      assert.equal((await applied).payload.error, undefined);
      assert.equal(frame.document.querySelectorAll('#learning-remediation-root').length, 1, 'Managed wrappers must have exactly one active root');
      const host = frame.document.getElementById('learning-remediation-root');
      assert.equal(host.parentElement, frame.document.body, 'The managed root must not remain inside the hidden standalone section');
      assert(!host.hasAttribute('data-remediation-standalone'));
      assert.equal(host.querySelector('h1').textContent, stage.title);
      assert.equal(host.querySelector('#lm-answer').disabled, false);
      assert.equal(frame.MathExamDivisionCourseLocal, undefined, 'A cabinet iframe must not activate local persistence');
      assert.equal(frame.localStorage.length, 0);
      assert.deepEqual(errors, [], 'Deferred standalone scripts must not race the managed bridge');
    } finally { dom.window.close(); }
  }
  return selected.length;
}

(async () => {
  const publicStages = await publicChecks();
  const managedHtmlStages = await managedHtmlChecks();
  trustedOutcomes();
  console.log(JSON.stringify({ result: 'LEARNING_DIVISION_COURSE_DOM_OK', stages: course.stages.length, actions, restores, checkpoints: checks, preservedOldTasks: oldTasks.length, publicStages, managedHtmlStages, publicDraftAndCompleteReload: true, independentCredit: true, trustedFreshRetest: true, corruptSavedWorkPreserved: true }));
})().catch(error => { console.error(error); process.exitCode = 1; });
