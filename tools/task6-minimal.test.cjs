'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'trainers/oge-task6-fractions.html'), 'utf8');

function boot(t) {
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://mathexam.space/trainers/oge-task6-fractions.html',
    pretendToBeVisual: true,
    virtualConsole: console,
  });
  t.after(() => { dom.window.close(); assert.deepEqual(errors, [], 'No runtime errors'); });
  const document = dom.window.document;
  const get = id => {
    const element = document.getElementById(id);
    assert.ok(element, '#' + id + ' exists');
    return element;
  };
  const evaluate = expression => dom.window.eval(expression);
  const snapshot = () => evaluate('JSON.stringify({records,streak,answeredCur,pos,order})');
  const enter = (id, text) => {
    get(id).value = text;
    get(id).dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  };
  const key = (id, options = {}) => get(id).dispatchEvent(new dom.window.KeyboardEvent('keydown', {
    key: 'Enter', bubbles: true, cancelable: true, ...options,
  }));
  const showTask = index => evaluate(`cat='all';startSet();pos=${index};renderTask();`);
  return { window: dom.window, document, get, evaluate, snapshot, enter, key, showTask };
}

// jsdom has no layout. Follow the same semantic concealment used by a browser:
// hidden nodes, display:none and descendants of closed details except summary.
function visible(element) {
  if (!element) return false;
  for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
    if (node.hidden || node.style.display === 'none' || node.classList.contains('sr-only')) return false;
    if (node.tagName === 'DETAILS' && !node.open) {
      const summary = Array.from(node.children).find(child => child.tagName === 'SUMMARY');
      if (!summary || (element !== summary && !summary.contains(element))) return false;
    }
  }
  return true;
}

function rationalText(pair) { return pair.map(String).join('/'); }
function currentPlan(ui) { return ui.evaluate('Task6Hints.plan(TASKS[order[pos]])'); }
function answerStep(ui, step) {
  ui.enter('stepAnswer', rationalText(step.expected));
  ui.get('stepCheck').click();
}

test('first screen presents one problem and keeps optional tools behind disclosures', t => {
  const ui = boot(t);
  assert.equal(ui.get('settings').tagName, 'DETAILS');
  assert.equal(ui.get('settings').open, false);
  assert.equal(ui.document.querySelectorAll('#card > .expr, #card .task-expression').length, 1);
  assert.ok(visible(ui.get('taskHeading')));
  assert.match(ui.get('taskHeading').textContent, /Вычисл/);
  for (const id of ['ans', 'check', 'skip', 'hintToggle']) assert.ok(visible(ui.get(id)), id);
  assert.equal(ui.get('hintToggle').getAttribute('aria-expanded'), 'false');
  assert.equal(visible(ui.get('hintPanel')), false);
  for (const id of ['chips', 'shuffle', 'stats', 'taskJump']) {
    assert.ok(ui.get('settings').contains(ui.get(id)), id + ' is inside settings');
    assert.equal(visible(ui.get(id)), false, id + ' is hidden initially');
  }
  assert.equal(visible(ui.get('formatHint')), false, 'Routine format guidance is not repeated on the first screen');
  assert.match(ui.get('settings').textContent, /через \/|через запятую/);
  assert.ok(ui.get('solutionDetails').contains(ui.get('reveal')));
  assert.equal(visible(ui.get('reveal')), false);
  assert.equal(ui.get('ans').value, '');
  assert.equal(ui.evaluate('Object.keys(records).length'), 0);
});

test('opening, closing and reopening a hint is optional and cannot score or reveal', t => {
  const ui = boot(t);
  const before = ui.snapshot();
  ui.get('hintToggle').click();
  assert.ok(visible(ui.get('hintPanel')));
  assert.equal(ui.get('hintToggle').getAttribute('aria-expanded'), 'true');
  assert.ok(ui.get('stepPrompt').textContent.trim());
  assert.ok(ui.get('stepExpression').textContent.trim());
  assert.equal(ui.get('solutionDetails').open, false);
  assert.equal(visible(ui.get('reveal')), false);
  assert.equal(ui.snapshot(), before);
  ui.get('hintToggle').click();
  assert.equal(visible(ui.get('hintPanel')), false);
  ui.get('hintToggle').click();
  assert.equal(ui.snapshot(), before);
  assert.equal(ui.get('ans').value, '');
});

test('an incorrect intermediate answer keeps the same step and main provenance', t => {
  const ui = boot(t);
  ui.get('hintToggle').click();
  const before = ui.snapshot();
  const prompt = ui.get('stepPrompt').textContent;
  const accepted = ui.get('hintSteps').textContent;
  const expected = currentPlan(ui).steps[0].expected;
  ui.enter('stepAnswer', rationalText([expected[0] + expected[1], expected[1]]));
  ui.get('stepCheck').click();
  assert.equal(ui.get('stepPrompt').textContent, prompt);
  assert.equal(ui.get('hintSteps').textContent, accepted);
  assert.ok(ui.get('stepFeedback').textContent.trim());
  assert.equal(ui.get('stepAnswer').getAttribute('aria-invalid'), 'true');
  assert.equal(ui.snapshot(), before);
  assert.equal(ui.get('ans').value, '');
});

test('intermediate inputs retain strict exact-number grammar and can recover', t => {
  const ui = boot(t);
  ui.get('hintToggle').click();
  const prompt = ui.get('stepPrompt').textContent;
  for (const text of ['1/0', '1 1/2', '2abc', '9'.repeat(129)]) {
    ui.enter('stepAnswer', text);
    ui.get('stepCheck').click();
    assert.equal(ui.get('stepPrompt').textContent, prompt);
    assert.ok(ui.get('stepFeedback').textContent.trim(), text);
  }
  answerStep(ui, currentPlan(ui).steps[0]);
  assert.ok(ui.get('hintSteps').textContent.trim());
  assert.equal(ui.evaluate('currentRecord().wrongAttempts'), 0);
});

test('accepted steps accumulate without filling or checking the main answer', t => {
  const ui = boot(t);
  ui.get('hintToggle').click();
  const plan = currentPlan(ui);
  assert.ok(plan.steps.length >= 2, 'First task has a useful chain of reasoning');
  const before = ui.snapshot();
  let previous = '';
  for (const step of plan.steps) {
    answerStep(ui, step);
    const accepted = ui.get('hintSteps').textContent;
    assert.ok(accepted.length > previous.length, 'Each completed step remains visible');
    assert.ok(accepted.startsWith(previous), 'Previous reasoning is preserved');
    previous = accepted;
    assert.equal(ui.get('ans').value, '', 'The learner writes the final answer');
    assert.equal(ui.snapshot(), before, 'Guidance is separate from the result record');
  }
  ui.enter('ans', rationalText(plan.answer || plan.final));
  ui.get('check').click();
  assert.equal(ui.evaluate('currentRecord().status'), 'solved-first');
  assert.equal(ui.evaluate('streak'), 1);
});

test('accepted hint reasoning survives closing and reopening the panel', t => {
  const ui = boot(t);
  ui.get('hintToggle').click();
  answerStep(ui, currentPlan(ui).steps[0]);
  const accepted = ui.get('hintSteps').textContent;
  const prompt = ui.get('stepPrompt').textContent;
  ui.get('hintToggle').click();
  ui.get('hintToggle').click();
  assert.equal(ui.get('hintSteps').textContent, accepted);
  assert.equal(ui.get('stepPrompt').textContent, prompt);
});

test('the next problem closes and clears hints while keeping earlier result history', t => {
  const ui = boot(t);
  ui.get('hintToggle').click();
  answerStep(ui, currentPlan(ui).steps[0]);
  ui.enter('ans', '-31/50');
  ui.get('check').click();
  ui.get('check').click();
  assert.equal(ui.evaluate('pos'), 1);
  assert.equal(visible(ui.get('hintPanel')), false);
  assert.equal(ui.get('hintSteps').textContent.trim(), '');
  assert.equal(ui.get('hintToggle').getAttribute('aria-expanded'), 'false');
  assert.equal(ui.get('ans').value, '');
  assert.equal(ui.evaluate('records[order[0]].status'), 'solved-first');
  assert.equal(ui.evaluate('streak'), 1);
});

test('all numerator-only tasks keep the required condition visible before help', t => {
  const ui = boot(t);
  const indices = ui.evaluate('TASKS.map((task,index)=>task.mode==="numerator"?index:-1).filter(index=>index>=0)');
  assert.equal(indices.length, 3);
  for (const index of indices) {
    ui.showTask(index);
    const condition = ui.document.querySelector('#card .prompt');
    assert.ok(visible(condition));
    assert.match(condition.textContent, /несократимой/);
    assert.match(condition.textContent, /числитель/);
    const plan = currentPlan(ui);
    ui.enter('ans', rationalText(plan.final));
    ui.get('check').click();
    assert.equal(ui.evaluate('answeredCur'), false, 'The whole fractional value is not the requested numerator');
    ui.enter('ans', rationalText(plan.answer));
    ui.get('check').click();
    assert.equal(ui.evaluate('currentRecord().status'), 'solved-retry');
  }
});

test('explicitly showing a fractional answer uses a fraction bar and preserves reveal provenance', t => {
  const ui = boot(t);
  const index = ui.evaluate('TASKS.findIndex(task=>task.mode!=="numerator"&&!task.term)');
  assert.ok(index >= 0);
  ui.showTask(index);
  ui.get('hintToggle').click();
  ui.get('solutionDetails').open = true;
  ui.get('reveal').click();
  assert.equal(ui.evaluate('currentRecord().status'), 'revealed');
  assert.equal(ui.evaluate('currentRecord().answerWasRevealed'), true);
  assert.ok(ui.get('mark').querySelector('.f .fn'));
  assert.ok(ui.get('mark').querySelector('.f .fd'));
  assert.doesNotMatch(ui.get('mark').textContent, /\d\s*\/\s*\d/);
  ui.evaluate('renderTask()');
  ui.enter('ans', rationalText(currentPlan(ui).answer));
  ui.get('check').click();
  assert.equal(ui.evaluate('currentRecord().status'), 'revealed');
  assert.equal(ui.evaluate('streak'), 0);
});

test('keyboard checks one step per press and ignores held or composing Enter', t => {
  const ui = boot(t);
  ui.get('hintToggle').click();
  const step = currentPlan(ui).steps[0];
  ui.enter('stepAnswer', rationalText(step.expected));
  const before = ui.get('hintSteps').textContent;
  ui.key('stepAnswer', { repeat: true });
  ui.key('stepAnswer', { isComposing: true });
  assert.equal(ui.get('hintSteps').textContent, before);
  ui.key('stepAnswer');
  assert.ok(ui.get('hintSteps').textContent.length > before.length);
  assert.equal(ui.get('stepAnswer').value, '');
  ui.enter('ans', '-0,62');
  ui.key('ans');
  assert.equal(ui.evaluate('pos'), 0);
  assert.equal(ui.evaluate('answeredCur'), true);
  ui.key('ans', { repeat: true });
  assert.equal(ui.evaluate('pos'), 0);
  ui.key('ans');
  assert.equal(ui.evaluate('pos'), 1);
});

test('all 174 tasks render and open a nonempty first hint without runtime errors', t => {
  const ui = boot(t);
  ui.evaluate("cat='all';startSet()");
  const count = ui.evaluate('TASKS.length');
  assert.equal(count, 174);
  for (let index = 0; index < count; index++) {
    ui.evaluate(`pos=${index};renderTask()`);
    assert.equal(ui.document.querySelectorAll('#card > .expr, #card .task-expression').length, 1);
    ui.get('hintToggle').click();
    assert.ok(visible(ui.get('hintPanel')), 'Task ' + index);
    assert.ok(ui.get('stepPrompt').textContent.trim(), 'Task ' + index + ' has a prompt');
    assert.ok(ui.get('stepExpression').textContent.trim(), 'Task ' + index + ' has an expression');
    assert.equal(ui.get('ans').value, '');
  }
  assert.equal(ui.evaluate('Object.keys(records).length'), 0);
});
