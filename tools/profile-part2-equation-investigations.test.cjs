'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const parser = require('../ege-profil/part-two/equation-answers.js');
const { create } = require('../ege-profil/part-two/equation-investigations.js');
const investigations = require('../ege-profil/part-two/equation-investigations-data.js');
const research = {
  "p14-circle-selection": [
    {
      "rightPi": "1/6",
      "closed": true,
      "count": 1
    },
    {
      "rightPi": "1/6",
      "closed": false,
      "count": 0
    },
    {
      "rightPi": "5/6",
      "closed": true,
      "count": 2
    },
    {
      "rightPi": "5/6",
      "closed": false,
      "count": 1
    },
    {
      "rightPi": "13/6",
      "closed": true,
      "count": 3
    },
    {
      "rightPi": "13/6",
      "closed": false,
      "count": 2
    },
    {
      "rightPi": "17/6",
      "closed": true,
      "count": 4
    },
    {
      "rightPi": "17/6",
      "closed": false,
      "count": 3
    },
    {
      "rightPi": "3",
      "closed": true,
      "count": 4
    },
    {
      "rightPi": "3",
      "closed": false,
      "count": 4
    }
  ],
  "p14-trig-factors": {
    "beforePi": [
      "0",
      "2/3",
      "1",
      "4/3",
      "2"
    ],
    "afterPi": [
      "2/3",
      "4/3"
    ],
    "lostPi": [
      "0",
      "1",
      "2"
    ],
    "transferLost": "2"
  },
  "p14-exponential-substitution": {
    "points": [
      [
        -2,
        "1/4"
      ],
      [
        0,
        "1"
      ],
      [
        2,
        "4"
      ]
    ],
    "transferAllowed": "1/3",
    "transferX": "1"
  },
  "p14-log-domain": {
    "bothPositiveAt": [
      4
    ],
    "undefinedAt": [
      0,
      1,
      2,
      3
    ],
    "equalProductAt": [
      0,
      4
    ],
    "transferDomain": [
      "-1",
      "5",
      false,
      false
    ]
  },
  "p14-radical-check": {
    "candidateRejected": "-1",
    "candidateAccepted": "2",
    "rejectWithinRadicandDomain": true
  },
  "p14-rational-hole": {
    "points": [
      [
        -3,
        "0"
      ],
      [
        2,
        "5"
      ],
      [
        3,
        null
      ],
      [
        4,
        "7"
      ]
    ],
    "hole": [
      3,
      6
    ],
    "transferExcluded": "-1"
  }
};
const moduleUnderTest = create(investigations, parser);
const prefix = 'mathexam.profilePartTwoLab.v1.';
const legacyKey = prefix + '14';
const creditKey = 'mathExam.profile.partTwo.v1.p14-circle-selection-4';
const keys = Object.keys(research);
const allowed = {
  'p14-circle-selection': [[{ closed: false }, { rightPi: '3' }, { closed: true }], {}, { answer: 'π/2' }, { answer: '0π' }],
  'p14-trig-factors': [[{ operation: 'divide' }], {}, { answer: '3' }, { answer: '4/2' }],
  'p14-exponential-substitution': [[{ x: '-2' }, { x: '2' }],
    { 'positive-t': 'yes', 'negative-t': 'no', 'inverse-x': '2/2' }, { t: '1/3', x: '2' }, { t: '2/6', x: '1,0' }],
  'p14-log-domain': [[{ x: '0' }, { x: '4' }], { 'log-domain': 'right' }, { answer: 'closed' }, { answer: 'inside' }],
  'p14-radical-check': [[{ x: '-1' }, { equation: 'original' }, { x: '2' }], {}, { answer: '-2' }, { answer: 'нет корней' }],
  'p14-rational-hole': [[{ x: '3' }, { x: '4' }], {}, { answer: '1' }, { answer: '-2/2' }]
};

function storage(records = {}) {
  const values = new Map(Object.entries(records)), reads = [], writes = [];
  return { values, reads, writes, getItem(key) { reads.push(key); return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { writes.push(key); values.set(key, value); } };
}

test('exact outcomes for all six models and all open and closed interval checkpoints', () => {
  const [circle, factors, exp, log, radical, hole] = keys;
  assert.equal(moduleUnderTest.has('p16-fixed-log'), false);
  for (const { rightPi, closed, count } of research[circle]) {
    const s = moduleUnderTest.scene(circle, { rightPi, closed });
    assert.equal(s.included.length, count);
    assert.equal(s.boundaryRoot, rightPi !== '3');
    assert.match(s.html, /data-unit-circle/);
    assert.match(s.html, /data-angle-line/);
    assert.match(s.html, new RegExp('data-boundary="' + (closed ? 'closed' : 'open') + '"'));
    assert.match(s.summary, /π\/6 и 13π\/6 задают один луч/);
  }
  const before = moduleUnderTest.scene(factors, { operation: 'factor' });
  const after = moduleUnderTest.scene(factors, { operation: 'divide' });
  assert.deepEqual(before.included, research[factors].beforePi);
  assert.deepEqual(after.included, research[factors].afterPi);
  assert.deepEqual(after.excluded, research[factors].lostPi);
  assert.match(after.summary, /0, π, 2π даёт sin x = 0/);
  for (const [index, answer] of ['1/4', '1/2', '1', '2', '4'].entries()) {
    const x = String(index - 2), s = moduleUnderTest.scene(exp, { x });
    assert.deepEqual(s.point, [x, answer]);
    assert.match(s.html, /t = 0/);
  }
  assert.deepEqual(moduleUnderTest.scene(log, { x: '0' }).nonpositive, ['x − 1', 'x − 3']);
  assert.deepEqual(moduleUnderTest.scene(log, { x: '1' }).nonpositive, ['x − 1', 'x − 3']);
  for (const x of ['2', '3']) assert.deepEqual(moduleUnderTest.scene(log, { x }).nonpositive, ['x − 3']);
  assert.match(moduleUnderTest.scene(log, { x: '4' }).summary, /log₂ 3 \+ log₂ 1/);
  assert.deepEqual(moduleUnderTest.scene(radical, { x: '-1', equation: 'squared' }).equality, ['1', '1', true]);
  assert.deepEqual(moduleUnderTest.scene(radical, { x: '-1', equation: 'original' }).equality, ['1', '-1', false]);
  assert.deepEqual(moduleUnderTest.scene(radical, { x: '2', equation: 'original' }).equality, ['2', '2', true]);
  assert.match(moduleUnderTest.scene(radical).summary, /x ≥ −2.*x ≥ 0/);
  for (const [x, y] of research[hole].points) assert.deepEqual(moduleUnderTest.scene(hole, { x: String(x) }).point, [String(x), y]);
  const gap = moduleUnderTest.scene(hole, { x: '3' });
  assert.match(gap.html, /data-excluded-point.*fill="#fff"/);
  assert.match(gap.summary, /исходная дробь не определена/i);
});

test('transfer accepts rational equivalence, zeros and empty sets and distinguishes syntax from a wrong result', () => {
  for (const [id, [, , wrong, correct]] of Object.entries(allowed)) {
    assert.deepEqual(moduleUnderTest.evaluateTransfer(id, wrong), { recognized: true, correct: false, invalid: [] }, id);
    assert.deepEqual(moduleUnderTest.evaluateTransfer(id, correct), { recognized: true, correct: true, invalid: [] }, id);
  }
  const exp = keys[2];
  assert.equal(moduleUnderTest.evaluateTransfer(exp, { t: '0,333333333333', x: '1' }).correct, false);
  assert.deepEqual(moduleUnderTest.evaluateTransfer(exp, { t: '1/0', x: '' }).invalid, ['t', 'x']);
  assert.deepEqual(moduleUnderTest.evaluateTransfer(exp, { t: '1/3;1/3', x: '1' }).invalid, ['t']);
  assert.equal(moduleUnderTest.evaluateTransfer(keys[4], { answer: '{}' }).correct, true);
});

async function settle() { await new Promise(resolve => setImmediate(resolve)); }
function htmlFixture() {
  const dom = new JSDOM('<main></main>', { url: 'https://mathexam.space/ege-profil/part-two/' });
  const { window } = dom, host = window.document.querySelector('main');
  const $ = selector => host.querySelector(selector);
  function emit(input, type) { input.dispatchEvent(new window.Event(type, { bubbles: true, cancelable: true })); }
  function set(input, value, eventType = 'input') {
    if (input.type === 'checkbox') input.checked = value;
    else input.value = value;
    emit(input, eventType);
  }
  return { window, host, $, set, emit };
}

for (const lab of investigations) test('complete keyboard-compatible investigation and reload: ' + lab.lessonId, async () => {
  const [changes, checks, wrong, correct] = allowed[lab.lessonId];
  const s = storage({ [legacyKey]: '{"legacy":"historical forecast"}', [creditKey]: '{"independent":true}' });
  const key = prefix + lab.lessonId;
  const f = htmlFixture();
  const { host, window, $, set, emit } = f;
  let dispose = moduleUnderTest.mount(host, lab.lessonId, { storage: s });
  const read = () => JSON.parse(s.values.get(key));
  try {
    assert($('[data-lab-observation]').hidden);
    assert($('[data-lab-comparison]').hidden);
    assert($('[data-lab-transfer]').hidden);
    emit($('[data-lab-prediction]'), 'submit');
    await settle();
    assert.equal(s.writes.length, 0);
    const prediction = $('[data-lab-prediction] select');
    prediction.value = lab.prediction.choices.find(choice => choice.id !== lab.prediction.correct).id;
    emit(prediction.form, 'submit');
    await settle();
    assert.equal(window.document.activeElement, $('[data-control]'));
    assert(prediction.disabled);
    assert(!$('[data-lab-observation]').hidden);
    assert($('[data-lab-compare]').disabled);
    const recordedPrediction = read().prediction;
    const firstControl = $('[data-control]');
    for (const settings of changes) {
      for (const [id, value] of Object.entries(settings)) set($(`[data-control="${id}"]`), value, 'change');
      await settle();
      assert.equal($('[data-control]'), firstControl, 'control remains mounted across model changes');
      assert($('[data-lab-rule]').hidden);
    }
    const forms = [...host.querySelectorAll('[data-lab-verification]')];
    if (forms.length) assert($('[data-lab-compare]').disabled);
    for (const form of forms) {
      assert(!form.hidden);
      emit(form, 'submit');
      await settle();
      assert.match(form.textContent, /Заполните каждое поле/);
      for (const field of form.querySelectorAll('[data-response]')) set(field, checks[field.dataset.response]);
      emit(form, 'submit');
      await settle();
      assert.match(form.textContent, /Верно/);
      assert(form.querySelector('button').disabled);
    }
    assert(!$('[data-lab-compare]').disabled);
    if (lab.view.kind === 'argument-table') assert.match($('[data-lab-summary]').textContent, /log₂ 3 \+ log₂ 1/);
    $('[data-lab-compare]').click();
    await settle();
    assert(!$('[data-lab-rule]').hidden);
    assert(!$('[data-lab-transfer]').hidden);
    assert.match($('[data-lab-prediction-result]').textContent, /другой результат/);
    const transfer = $('[data-lab-transfer]');
    const last = setting => {
      for (const field of transfer.querySelectorAll('[data-response]')) set(field, setting[field.dataset.response]);
      emit(transfer, 'submit');
    };
    assert.equal(window.document.activeElement, transfer.querySelector('[data-response]'));
    emit(transfer, 'submit');
    await settle();
    assert.equal(read().last, null);
    assert.equal(transfer.querySelector('[data-response]').getAttribute('aria-invalid'), 'true');
    last(wrong);await settle();
    assert.equal(read().first.correct, false);
    last(correct);await settle();
    assert.equal(read().last.correct, true);
    assert.equal(read().first.correct, false);
    assert.equal(read().prediction, recordedPrediction);
    assert.match(transfer.textContent, /Верно/);
    dispose();
    assert.equal(host.childElementCount, 0);
    dispose = moduleUnderTest.mount(host, lab.lessonId, { storage: s });
    assert(!$('[data-lab-transfer]').hidden);
    assert.deepEqual(Object.fromEntries([...$('[data-lab-transfer]').querySelectorAll('[data-response]')].map(input =>
      [input.dataset.response, input.value])), correct);
    assert(s.reads.every(item => item === key));
    assert(s.writes.every(item => item === key));
    assert.equal(s.values.get(legacyKey), '{"legacy":"historical forecast"}');
    assert.equal(s.values.get(creditKey), '{"independent":true}');
  } finally { dispose();window.close(); }
});

test('missing or corrupt local storage keeps the lesson usable and protects stored bytes', async () => {
  const id = keys[0], key = prefix + id;
  for (const data of ['{', 'null', '{"version":2}']) {
    const s = storage({ [key]: data });
    const a = moduleUnderTest.createStore(id, s);
    assert.equal(a.read().prediction, null);
    assert.match(a.warning, /не читается/);
    const saved = await a.update(record => { record.values.rightPi = '3';return true; });
    assert.equal(saved.values.rightPi, '3');
    assert.equal(s.values.get(key), data);
    assert.equal(s.writes.length, 0);
  }
  const a = moduleUnderTest.createStore(id, { getItem() { return null; }, setItem() { throw new Error('quota'); } });
  await a.update(record => { record.values.rightPi = '3';return true; });
  assert.match(a.warning, /Не удалось сохранить/);
  assert.equal(a.read().values.rightPi, '3');
});
