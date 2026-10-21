'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'trainers/oge-1-5-trainers');
class Local extends ResourceLoader {
  fetch(url) {
    const parsed = new URL(url);
    if (parsed.origin !== 'https://mathexam.space') return null;
    const file = path.join(root, parsed.pathname);
    return fs.existsSync(file) ? Promise.resolve(fs.readFileSync(file)) : null;
  }
}
const tick = () => new Promise(resolve => setTimeout(resolve, 10));
async function open(slug) {
  const errors = [], vc = new VirtualConsole();
  vc.on('jsdomError', error => { if (!/scrollTo|HTMLCanvasElement.prototype.getContext/.test(error.message)) errors.push(error.message); });
  const dom = new JSDOM(fs.readFileSync(path.join(dir, 'practice-1-5-' + slug + '.html'), 'utf8'), {
    url: 'https://mathexam.space/trainers/oge-1-5-trainers/practice-1-5-' + slug + '.html',
    resources: new Local(), runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.scrollTo = () => {}; w.confirm = () => true; w.matchMedia = () => ({ matches: false, addEventListener() {} }); w.requestAnimationFrame = () => 1; w.cancelAnimationFrame = () => {}; }
  });
  await new Promise(resolve => dom.window.addEventListener('load', resolve));
  await tick();
  assert.deepEqual(errors, []);
  assert.equal(dom.window.document.documentElement.dataset.practicalVariant, 'ready');
  return { dom, w: dom.window, d: dom.window.document, errors };
}
const cards = c => Array.from(c.d.querySelectorAll('.pv-task-stream > .pv-question'));
function choose(c, value) {
  const select = c.d.querySelector('.pv-controls select');
  select.value = value;
  select.dispatchEvent(new c.w.Event('change', { bubbles: true }));
}
function fill(c, card, values) {
  for (const [name, value] of Object.entries(values)) {
    const input = card.querySelector('[data-pv-field="' + name + '"]');
    input.value = String(value);
    input.dispatchEvent(new c.w.Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  }
}
async function check(c, card, values) {
  fill(c, card, values);
  card.querySelector('form').dispatchEvent(new c.w.Event('submit', { bubbles: true, cancelable: true }));
  await tick();
  return card.dataset.result;
}

test('all twelve road-grid catalog variants expose five native questions and retain native grading/progress', async () => {
  const c = await open('roads-grid');
  try {
    const options = Array.from(c.d.querySelector('.pv-controls select').options).map(option => option.value);
    assert.equal(options.length, 12);
    let solved = 0;
    for (const value of options) {
      choose(c, value);
      const questions = cards(c);
      assert.equal(questions.length, 5);
      const answers = c.w.eval('(()=>{const s=currentScenario(),v=currentVariant(),a=computeAnswers(s,v);return [v.ident.map(r=>s.towns[r].num),a.t2,a.t3,a.t4,a.minTotal]})()');
      assert.equal(c.d.querySelectorAll('.pv-primary-visual [data-pv-given-map]').length, 1);
      assert.equal(c.d.querySelectorAll('.pv-primary-visual .pv-zoom').length, 1);
      const prices = c.d.querySelector('[data-pv-road-prices]');
      assert.doesNotMatch(prices.textContent, /ИТОГО|×|=|самый дешёвый/i);
      assert.equal(c.d.querySelectorAll('.pv-question-condition .pythagoras,.pv-question-condition .teacher-block').length, 0);
      for (let index = 0; index < 5; index++) {
        const answer = index === 0 ? Object.fromEntries(answers[0].map((n, i) => ['v' + i, n])) : { answer: String(answers[index]).replace('.', ',') };
        if (index > 0) assert.equal(await check(c, questions[index], { answer: '-999' }), 'incorrect');
        assert.equal(await check(c, questions[index], answer), 'correct', value + ' question ' + (index + 1));
        assert.equal(c.w.getBoardTrainerState().tasks[index].completed, true);
        solved++;
        assert.equal(c.w.getRoadsGridTestProbe().progress.solved, solved);
        assert.equal(await check(c, questions[index], answer), 'correct');
        assert.equal(c.w.getRoadsGridTestProbe().progress.solved, solved, 'no duplicate native credit');
      }
      assert.equal(c.d.querySelector('[data-pv-road-prices]'), prices, 'given table remains mounted through all checks');
    }
    assert.deepEqual(c.errors, []);
  } finally { c.dom.window.close(); }
});

test('road-grid draft, help, generated values and incoming Board Bridge state remain independent', async () => {
  const c = await open('roads-grid');
  try {
    let question = cards(c)[2];
    fill(c, question, { answer: '12,75' });
    const priceTable = c.d.querySelector('[data-pv-road-prices]');
    const before = c.w.localStorage.getItem('mathExamCourseProgress.v1');
    question.querySelector('.pv-help-button').click();
    assert.equal(question.querySelector('.pv-help-panel').hidden, false);
    assert.equal(c.w.localStorage.getItem('mathExamCourseProgress.v1'), before);
    assert.equal(question.querySelector('[data-pv-field]').value, '12,75');
    assert.equal(c.d.querySelector('[data-pv-road-prices]'), priceTable);
    choose(c, '1:1'); choose(c, '0:0');
    assert.equal(cards(c)[2].querySelector('[data-pv-field]').value, '12,75');
    const incoming = c.w.getBoardTrainerState();
    incoming.tasks[1].answer = '37';
    incoming.view.taskIndex = 1;
    c.w.applyBoardTrainerState(incoming);
    await tick();
    assert.equal(cards(c)[1].querySelector('[data-pv-field]').value, '37');
    const generate = Array.from(c.d.querySelectorAll('.pv-controls button')).find(button => /Новый случайный/.test(button.textContent));
    generate.click();
    assert.equal(c.w.getBoardTrainerState().selection.source, 'generated');
    assert.equal(cards(c).length, 5);
    assert.equal(c.d.querySelectorAll('[data-pv-town]').length, 4);
    const generated = c.w.eval('computeAnswers(currentScenario(),currentVariant()).t3');
    assert.equal(await check(c, cards(c)[2], { answer: generated }), 'correct');
    assert.deepEqual(c.errors, []);
  } finally { c.dom.window.close(); }
});

test('road-grid presentation keeps place names grammatical without changing the native narrative', async () => {
  const c = await open('roads-grid');
  try {
    const options = Array.from(c.d.querySelector('.pv-controls select').options).map(option => option.value);
    for (const value of options) {
      choose(c, value);
      const names = c.w.eval('JSON.parse(JSON.stringify(currentScenario().towns))');
      const condition = c.d.querySelector('.pv-condition').textContent;
      const original = c.d.getElementById('story-text').textContent;
      assert.ok(condition.includes(`через населённый пункт «${names.inter.short}»`));
      assert.ok(condition.includes(`до населённого пункта «${names.dest.short}»`));
      assert.ok(condition.includes(`в населённом пункте «${names.inter.short}»`));
      assert.ok(condition.includes(`в населённом пункте «${names.start.short}»`));
      assert.ok(condition.includes(`в населённый пункт «${names.dest.short}»`));
      assert.ok(original.includes(`через ${names.inter.short}`), 'hidden source narrative is untouched');
      assert.equal(cards(c).length, 5);
      assert.equal(c.w.getBoardTrainerState().tasks.some(task => task.completed), false);
    }
    assert.deepEqual(c.errors, []);
  } finally { c.dom.window.close(); }
});

test('schema preserves all twenty-four native identities and honest one-question extras', async () => {
  const c = await open('roads-schema');
  try {
    let solved = 0;
    for (let variant = 0; variant < 8; variant++) {
      choose(c, String(variant));
      const questions = cards(c), tasks = variant < 4 ? [1, 2, 3, 4, 5] : [5];
      assert.equal(questions.length, tasks.length);
      assert.equal(c.d.querySelectorAll('.pv-primary-visual .pv-zoom').length, 1);
      assert.equal(c.d.querySelector('.pv-primary-visual svg').querySelectorAll('circle').length, 7);
      const table = c.d.querySelector('[data-pv-road-distances]');
      for (let n = 0; n < tasks.length; n++) {
        const task = tasks[n], question = questions[n];
        const native = c.w.eval('answer(VARIANTS[' + variant + '],' + task + ')');
        const expectedKind = ['map', 'route', 'triangle', 'journey', 'fuel'][task - 1];
        assert.equal(question.querySelector('[data-discovery-model]').dataset.discoveryModel, expectedKind);
        assert.equal(await check(c, question, { answer: '-999' }), 'incorrect');
        assert.equal(await check(c, question, { answer: String(native).replace('.', ',') }), 'correct');
        solved++;
        assert.equal(c.w.eval('solvedCount()'), solved);
        await check(c, question, { answer: native });
        assert.equal(c.w.eval('solvedCount()'), solved);
        assert.equal(c.d.querySelector('[data-pv-road-distances]'), table);
      }
    }
    assert.equal(solved, 24);
    assert.deepEqual(c.errors, []);
  } finally { c.dom.window.close(); }
});

test('schema help and variant navigation preserve drafts without awarding credit', async () => {
  const c = await open('roads-schema');
  try {
    const question = cards(c)[3];
    fill(c, question, { answer: '19,5' });
    question.querySelector('.pv-help-button').click();
    const deeper = question.querySelector('.pv-native-help');
    deeper.open = true;
    deeper.dispatchEvent(new c.w.Event('toggle'));
    assert.ok(deeper.textContent.includes('Время каждого участка'));
    assert.equal(c.w.eval('solvedCount()'), 0);
    assert.equal(question.querySelector('[data-pv-field]').value, '19,5');
    choose(c, '1'); choose(c, '0');
    assert.equal(cards(c)[3].querySelector('[data-pv-field]').value, '19,5');
    const visibleIds = Array.from(c.d.querySelector('.pv-shell').querySelectorAll('[id]')).map(n => n.id);
    assert.equal(new Set(visibleIds).size, visibleIds.length);
    assert.deepEqual(c.errors, []);
  } finally { c.dom.window.close(); }
});
