const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const D = require('../trainers/oge-basics/multiplication-division/division-diagnostic-core.js');
const map = require('../learning/division-course-map.js');
const root = path.resolve(__dirname, '..');
const expected = [
  {examples: ['816:4=204', '444:12=37'], subtraction: '44 − 36 = ?', arithmetic: ['7 × 8 = ?', '70 + 14 = ?', '48 + 27 = ?']},
  {examples: ['927:3=309', '560:16=35'], subtraction: '56 − 48 = ?', arithmetic: ['8 × 6 = ?', '90 + 18 = ?', '56 + 38 = ?']}
];
const record = (q, correct = true, skipped = false) => ({id: q.id, value: skipped ? '' : correct ? q.answer : '999999', correct, skipped});
for (let variant = 0; variant < 2; variant++) {
  const {tasks, questions, autoActions, maxConfirmations} = D.build(variant);
  assert.equal(questions.length, 18, 'test stays short');
  assert.equal(maxConfirmations, 8);
  assert.equal(questions[0].kind, 'selection', 'first screen is the familiar digit selector');
  assert.deepEqual(questions.slice(-3).map(q => q.prompt), expected[variant].arithmetic, 'standalone arithmetic comes last');
  assert.deepEqual(tasks.map(p => p.task.dividend + ':' + p.task.divisor + '=' + p.quotient), expected[variant].examples);
  assert.deepEqual(new Set(questions.map(q => q.skill)), new Set(D.SKILL_ORDER), 'all eight skills have direct evidence');
  assert.equal(new Set(questions.map(q => q.id)).size, questions.length);
  assert(questions.some(q => q.prompt === expected[variant].subtraction), 'borrowing is actually assessed');
  assert.equal(questions.filter(q => q.skill === 'zero').length, 1);
  assert.equal(questions.filter(q => q.skill === 'addition').length, 2);
  assert.equal(questions.filter(q => q.skill === 'facts').length, 3);
  assert(!questions.some(q => ['bring', 'verify', 'answer'].includes(q.kind)), 'no redundant digit-copy or final-answer questions');
  for (const q of questions) {
    assert(D.isCorrect(q, q.answer), q.id);
    assert(D.isCorrect(q, Number(q.answer)), q.id + ' numeric value');
    assert(!D.isCorrect(q, String(Number(q.answer) + 1)), q.id + ' wrong answer');
    if (q.taskIndex === null) continue;
    const p = tasks[q.taskIndex], a = p.actions[q.actionIndex];
    if (q.kind === 'selection') {
      const length = Number(q.answer), partial = Number(q.selectionDigits.slice(0, length));
      assert.equal(length, q.selectionLength);
      assert(partial >= Number(q.selectionDivisor));
      if (length > 1) assert(Number(q.selectionDigits.slice(0, length - 1)) < Number(q.selectionDivisor));
    } else assert.equal(q.answer, a.answer, 'step always uses canonical correct data');
    if (q.kind === 'product') {
      const cycle = p.cycles[a.cycle];
      assert(cycle.qd > 1 && p.normalizedDivisor > 1, 'trivial products are not evidence');
      assert.equal(Number(q.answer), cycle.qd * p.normalizedDivisor);
      assert.equal(q.skill, p.normalizedDivisor < 10 ? 'facts' : 'multiplyTwo');
    }
    if (q.kind === 'subtract') {
      const cycle = p.cycles[a.cycle];
      assert(cycle.product > 0 && cycle.partial > cycle.product, 'zero difference does not prove borrowing');
      assert.equal(Number(q.answer), cycle.partial - cycle.product);
    }
    if (q.kind === 'partial') {
      assert.equal(q.skill, 'bring');
      assert(!q.prompt.includes('получилось ' + q.answer), 'new partial dividend must not be given in the prompt');
    }
  }
  tasks.forEach((p, taskIndex) => {
    const active = new Set(questions.filter(q => q.taskIndex === taskIndex).map(q => q.actionIndex));
    const automatic = new Set(autoActions[taskIndex]);
    p.actions.forEach((a, actionIndex) => {
      if (['answer', 'verify'].includes(a.kind)) {
        assert(!active.has(actionIndex) && !automatic.has(actionIndex));
      } else assert.notEqual(active.has(actionIndex), automatic.has(actionIndex), 'each action is either a question or automatic');
    });
  });
  const snapshot = JSON.stringify(tasks), success = D.report(questions.map(q => record(q)));
  assert(success.every(s => s.status === 'observed'));
  assert.equal(success.reduce((sum, s) => sum + s.counts.total, 0), questions.length);
  for (const skill of D.SKILL_ORDER) {
    const main = questions.find(q => q.skill === skill), followup = D.confirmation(skill, variant);
    assert.equal(followup.phase, 'confirmation');
    assert.equal(followup.taskIndex, null);
    assert.equal(followup.actionIndex, null);
    assert(D.isCorrect(followup, followup.answer));
    assert(!questions.some(q => q.id === followup.id || q.prompt === followup.prompt && skill !== 'first'), 'followup is a new independent question');
    let s = D.report([record(main, false)]).find(s => s.skill === skill);
    assert.equal(s.status, 'uncertain', 'one error is inconclusive');
    assert(s.needsConfirmation);
    s = D.report([record(main, false), record(followup)]).find(s => s.skill === skill);
    assert.equal(s.status, 'uncertain', 'a successful followup does not erase the first error');
    assert.equal(s.counts.correct, 1);
    assert.equal(s.needsConfirmation, false);
    s = D.report([record(main, false), record(followup, false)]).find(s => s.skill === skill);
    assert.equal(s.status, 'focus', 'two separate unsuccessful answers justify practice');
    assert.equal(s.counts.errors, 2);
    s = D.report([record(main, false, true), record(followup, false, true)]).find(s => s.skill === skill);
    assert.equal(s.status, 'focus');
    assert.equal(s.counts.skipped, 2);
    assert.equal(s.counts.errors, 0, 'not knowing is distinguished from incorrect arithmetic');
    s = D.report([record(main, false), record(main), record(main, false)]).find(s => s.skill === skill);
    assert.equal(s.status, 'uncertain', 'retries of one question are not independent evidence');
    assert.equal(s.counts.total, 1);
    // A wrong product cannot affect the canonical subtraction or any other skill.
    assert.equal(JSON.stringify(tasks), snapshot);
    const untouched = D.report([record(main, false)]).filter(s => s.skill !== skill);
    assert(untouched.every(s => s.status === 'untested'));
  }
}
const firstQuestion = D.build().questions[0];
for (const value of ['', ' ', null, undefined, true, {}, [], '01', '1e0', '1.0', '1,0', '1+0', '<script>', '-1', 'NaN', 'Infinity']) {
  assert.equal(D.isCorrect(firstQuestion, value), false, 'reject invalid input ' + String(value));
}
const zeroQuestion = D.build().questions.find(q => q.skill === 'zero');
assert(D.isCorrect(zeroQuestion, '0'));
assert(!D.isCorrect(zeroQuestion, '00'));
assert(D.report([]).every(s => s.status === 'untested'));
assert(D.report(null).every(s => s.status === 'untested'));
assert(D.report([null, {}, {id: 'forged', skill: 'facts', correct: true}]).every(s => s.status === 'untested'));
const altered = D.report([{...record(firstQuestion), skill: 'facts', phase: 'confirmation'}]);
assert.equal(altered.find(s => s.skill === 'first').counts.total, 1, 'canonical question controls attribution');
assert.equal(altered.find(s => s.skill === 'first').counts.confirmations, 0);
assert.equal(altered.find(s => s.skill === 'facts').status, 'untested');
assert.throws(() => D.confirmation('unknown'));
assert.deepEqual(D.build(2), D.build(0));
assert.deepEqual(D.build(-1), D.build(0));
for (const [skill, meta] of Object.entries(D.skills)) {
  const [urlPath, hash] = meta.recommendation.url.split('#');
  assert(fs.existsSync(path.join(root, urlPath)), skill + ' recommendation file exists');
  if (skill === 'addition' || skill === 'subtract') {
    assert.equal(hash, skill==='addition'?'add-carry':'sub-borrow');
    assert(map.foundationTracks.some(t=>t.stages.some(s=>s.url===meta.recommendation.url)));
  } else {
    const id = urlPath.replace('/trainers/oge-basics/', '').replace(/\.html$/, '');
    assert(map.tracks.some(t => t.stages.some(s => s.id === id)), skill + ' recommendation appears in the actual course map');
  }
}
console.log('Division diagnostic: two canonical variants, 18 questions, 8 independent followups, attribution, uncertainty, skips, input and actual routes: PASS');
