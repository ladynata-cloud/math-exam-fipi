'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const pilot = path.resolve(__dirname, '../../equations/linear-pilot');
const { scenes, reviews } = require(path.join(pilot, 'basics-data.js'));
const key = 'mathexam.linearPilot.basics.v1';

// Independent arithmetic oracle: derive x from the equation, never from its key.
function value(expression, x) {
  const source = expression.replace(/−/g, '-').replace(/÷/g, '/')
    .replace(/·/g, '*').replace(/(\d)x/g, '$1*x');
  assert.match(source, /^[\d\sx.+*/()\-]+$/);
  return Function('x', `return (${source});`)(x);
}

function root(equation) {
  const sides = equation.split('=');
  assert.equal(sides.length, 2);
  const difference = x => value(sides[0], x) - value(sides[1], x);
  const constant = difference(0);
  const coefficient = (value(sides[0], 1) - value(sides[0], 0)) -
    (value(sides[1], 1) - value(sides[1], 0));
  if (coefficient === 0) {
    assert.equal(constant, 0);
    return 0; // The opening numerical equality has no unknown.
  }
  const answer = -constant / coefficient;
  assert.equal(difference(answer), 0);
  return answer;
}

function memory() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key: index => [...values.keys()][index],
    getItem: name => values.get(name) ?? null,
    setItem: (name, value) => values.set(name, value),
    removeItem: name => values.delete(name)
  };
}

function world(t, storage = memory()) {
  const dom = new JSDOM(fs.readFileSync(path.join(pilot, 'index.html'), 'utf8'), {
    runScripts: 'outside-only', url: 'https://mathexam.space/equations/linear-pilot/'
  });
  t.after(() => dom.window.close());
  const w = dom.window;
  Object.defineProperty(w, 'localStorage', { value: storage });
  w.HTMLElement.prototype.scrollIntoView = () => {};
  for (const file of ['data.js', 'store.js', 'app.js', 'basics-data.js', 'basics.js']) {
    w.eval(fs.readFileSync(path.join(pilot, file), 'utf8'));
  }
  return { w, d: w.document, storage };
}

function click(x, action, option) {
  const selector = `[data-basics="${action}"]${option === undefined ? '' : `[data-option="${option}"]`}`;
  const button = x.d.querySelector(selector);
  assert.ok(button, selector);
  assert.equal(button.disabled, false, `${selector} must be available`);
  button.click();
}

function submit(x, answer) {
  const input = x.d.querySelector('#basics-answer');
  input.value = String(answer);
  input.dispatchEvent(new x.w.Event('input', { bubbles: true }));
  x.d.querySelector('[data-basics-review]').dispatchEvent(
    new x.w.Event('submit', { bubbles: true, cancelable: true })
  );
}

function completeLesson(x) {
  click(x, 'begin');
  // Choices independently reviewed against the displayed questions.
  const choices = [1, 2, 0, null, 2, null, 2, null, 0, null, 1, null, null, 0];
  for (const [index, choice] of choices.entries()) {
    assert.equal(x.d.querySelector('#basics-screen').dataset.scene, String(index));
    if (x.d.querySelector('[data-basics="experiment"]')) click(x, 'experiment');
    if (choice !== null) click(x, 'choose', choice);
    click(x, 'next');
  }
}

test('all 23 balance states have independently calculated totals and correct tilt', () => {
  let states = 0;
  for (const scene of scenes) {
    const unknown = root(scene.math);
    for (const balance of [scene.balance, scene.experiment?.balance].filter(Boolean)) {
      const total = side => side.reduce((sum, term) => sum + value(term, unknown), 0);
      const left = total(balance.left), right = total(balance.right);
      assert.equal(balance.tilt || 0, Math.sign(right - left), `${scene.title}: ${left} vs ${right}`);
      states++;
    }
  }
  assert.equal(states, 23);
});

test('all ten assessment keys solve the equations and the second form changes every example', () => {
  assert.equal(reviews.length, 2);
  assert.equal(reviews.flat().length, 10);
  for (const form of reviews) {
    assert.deepEqual(form.map(item => item.group), [0, 1, 2, 3, 4]);
    for (const item of form) assert.equal(item.answer, root(item.math), item.math);
  }
  for (let index = 0; index < 5; index++) {
    assert.notEqual(reviews[0][index].math, reviews[1][index].math);
  }
});

test('scene 3 restores balance by removing 2 from the right after the left was changed', t => {
  const x = world(t);
  click(x, 'begin');
  for (const choice of [1, 2]) {
    click(x, 'experiment');
    click(x, 'choose', choice);
    click(x, 'next');
  }
  assert.equal(x.d.querySelector('[data-basics-balance]').dataset.tilt, '0');
  click(x, 'experiment');
  assert.equal(x.d.querySelector('[data-basics-balance]').dataset.tilt, '1');
  assert.match(x.d.querySelector('[data-basics-math]').textContent, /x \+ 2 − 2 ≠ 5/);
  // Toggling back must not make the question refer to the still-balanced picture.
  click(x, 'experiment');
  assert.equal(x.d.querySelector('[data-basics-balance]').dataset.tilt, '0');
  assert.match(x.d.querySelector('#basics-screen h3').textContent, /После того как слева сняли 2/);
  click(x, 'experiment');
  click(x, 'choose', 0);
  const feedback = x.d.querySelector('#basics-feedback').textContent;
  assert.match(feedback, /Слева мы уже сняли 2/);
  assert.match(feedback, /Теперь снимем 2 справа/);
  assert.doesNotMatch(feedback, /Снимем по 2 с обеих чаш/);
  assert.equal(x.d.querySelector('[data-basics="next"]').disabled, false);
});

test('14 completed teaching steps do not pass a 4/5 assessment; remediation resumes and 5/5 passes', t => {
  let x = world(t);
  completeLesson(x);
  assert.equal(x.d.querySelector('#basics-count').textContent, '14 из 14 шагов');
  assert.equal(x.d.querySelector('#advanced-count').textContent, '0 из 4 занятий');
  const answers = reviews[0].map(item => root(item.math));
  answers[0]++;
  for (const answer of answers) submit(x, answer);
  assert.equal(x.d.querySelector('#basics-screen').dataset.phase, 'summary');
  assert.match(x.d.querySelector('#basics-screen h2').textContent, /Верно 4 из 5/);
  assert.equal(x.d.querySelector('#basics-trainer'), null);
  const completed = JSON.parse(x.storage.getItem(key)).steps;
  click(x, 'remediate');
  assert.equal(x.d.querySelector('[data-basics="next"]').disabled, true);
  click(x, 'experiment');
  x = world(t, x.storage);
  assert.match(x.d.querySelector('[data-basics-math]').textContent, /x = 3/);
  click(x, 'next');
  click(x, 'choose', 0);
  assert.equal(x.d.querySelector('[data-basics="next"]').disabled, true);
  click(x, 'hint');
  x = world(t, x.storage);
  assert.ok(x.d.querySelector('#basics-hint'));
  assert.match(x.d.querySelector('#basics-feedback').textContent, /Равновесие нарушится/);
  click(x, 'choose', 2);
  click(x, 'next');
  assert.equal(x.d.querySelector('#basics-screen').dataset.phase, 'summary');
  assert.deepEqual(JSON.parse(x.storage.getItem(key)).steps, completed);
  click(x, 'retry');
  for (const item of reviews[1]) submit(x, root(item.math));
  assert.equal(x.d.querySelector('#basics-screen').dataset.phase, 'complete');
  assert.match(x.d.querySelector('#basics-screen h2').textContent, /Верно 5 из 5/);
  assert.ok(x.d.querySelector('#basics-trainer'));
  x = world(t, x.storage);
  assert.equal(x.d.querySelector('#basics-screen').dataset.phase, 'complete');
  assert.equal(x.d.querySelector('#advanced-count').textContent, '0 из 4 занятий');
});
