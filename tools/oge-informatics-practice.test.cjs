'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {JSDOM} = require('jsdom');

const source = fs.readFileSync(path.join(__dirname, '../trainers/oge-informatics-1-10-tutor.html'), 'utf8');

function mount(t, savedMode) {
  const dom = new JSDOM(source, {url:'https://example.test/trainers/informatics', runScripts:'outside-only'});
  const {window} = dom;
  t.after(() => window.close());
  window.HTMLElement.prototype.scrollIntoView = () => {};
  let seed = 15049;
  window.Math.random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  if (savedMode) window.localStorage.setItem('ogeInfoTrainerMode', savedMode);
  const find = selector => window.document.querySelector(selector);
  window.eval(find('script:not([src])').textContent);
  return {find, attempts:() => JSON.parse(window.localStorage.getItem('ogeInfoTrainerStats') || '{}').attempts || 0};
}

test('checking, requesting help and switching modes preserve the pupil’s answer', t => {
  const {find, attempts} = mount(t, 'exam');
  const click = selector => find(selector).click();
  assert.equal(find('[data-mode="exam"]').classList.contains('active'), true);
  click('#checkBtn');
  assert.equal(attempts(), 0);
  assert.equal(find('#hintBtn').disabled, true);
  find('#answerInput').value = 'ошибка';
  click('#checkBtn');
  click('#checkBtn');
  assert.equal(attempts(), 1);
  assert.equal(find('#solutionBtn').disabled, false);
  assert.equal(find('#solutionBox').classList.contains('show'), false);
  assert.doesNotMatch(find('#feedback').textContent, /правильный ответ/i);

  click('#variantBtn');
  find('#miniAnswer0').value = 'черновик';
  click('[data-mode="learn"]');
  click('[data-mini-hint="0"]');
  click('[data-mode="exam"]');
  assert.equal(find('#miniAnswer0').value, 'черновик');
  assert.equal(find('#miniHint0').classList.contains('show'), false);
  click('[data-mini-check="1"]');
  assert.equal(attempts(), 1);
  click('[data-mini-check="0"]');
  assert.equal(attempts(), 2);
  assert.equal(find('#miniSolution0').classList.contains('show'), false);
  click('#checkVariantBtn');
  assert.equal(attempts(), 2);
  assert.equal(find('#miniResult1').textContent, 'пропущено');
  assert.equal(find('#miniAnswer0').readOnly, true);
  assert.equal(find('#miniSolution0').classList.contains('show'), true);
  click('#newVariantBtn');
  assert.equal(find('#variantScore').textContent, 'ещё не проверено');
  assert.equal(find('#checkVariantBtn').disabled, false);
});

test('the parameter threshold counts each displayed run, including equal s values', t => {
  const {find} = mount(t);
  find('[data-topic="6"]').click();
  let withDuplicates = 0;
  for (let i = 0; i < 40; i++) {
    const prompt = find('#taskText').textContent;
    const k = Number(prompt.match(/t > (\d+)/)[1]);
    const m = Number(prompt.match(/NO ровно (\d+)/)[1]);
    const pairs = Array.from(prompt.matchAll(/\((-?\d+), (-?\d+)\)/g), ([,s,t]) => [Number(s), Number(t)]);
    assert.equal(pairs.length, 9);
    const retained = pairs.filter(([,t]) => t <= k).map(([s]) => s).sort((a,b) => a-b);
    const thresholds = [];
    for (let a = Math.min(...retained)-1; a <= Math.max(...retained); a++) {
      if (pairs.filter(([s,t]) => !(s > a || t > k)).length === m) thresholds.push(a);
    }
    assert.ok(thresholds.length > 0);
    find('#answerInput').value = String(Math.max(...thresholds));
    find('#checkBtn').click();
    assert.ok(find('#feedback').classList.contains('good'));
    if (new Set(retained).size < retained.length && ++withDuplicates === 1) {
      find('#tutorOpenBtn').click();
      find('[data-tutor-next]').click();
      find('[data-tutor-next]').click();
      find('#s_tutorInput').value = [...new Set(retained)].join(',');
      find('[data-tutor-check]').click();
      assert.ok(find('[data-tutor-fb]').classList.contains('bad'));
      find('#s_tutorInput').value = retained.join(',');
      find('[data-tutor-check]').click();
      assert.ok(find('[data-tutor-fb]').classList.contains('good'));
    }
    find('#newTaskBtn').click();
  }
  assert.ok(withDuplicates > 0);
});
