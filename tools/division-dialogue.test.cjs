'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const {reply} = require('../assets/assistant/division-dialogue.js');
const root = path.resolve(__dirname, '..');
const base = 'trainers/oge-basics/';
const sub = base + 'multiplication-division/';
const key = 'mathExamBasics.guidedDivision.v1';

function open(t, topic, service) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'trainers/long-division-stepwise.html'), 'utf8'), {
    url:'https://mathexam.space/trainers/long-division-stepwise.html#' + topic,
    runScripts:'outside-only', pretendToBeVisual:true
  });
  t.after(() => dom.window.close());
  const w = dom.window, d = w.document;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  if (service) w.SiteDialogueClient = {enabled:true, ask:service};
  const load = asset => w.eval(fs.readFileSync(path.join(root, asset), 'utf8'));
  for (const file of ['division-lab-core', 'division-guided-core']) load(sub + file + '.js');
  load(base + 'arithmetic-route.js');
  load(base + 'basics-help.js');
  load(sub + 'division-guided.js');
  load('assets/assistant/division-dialogue.js');
  const get = id => d.getElementById(id);
  const submit = form => form.dispatchEvent(new w.Event('submit', {bubbles:true, cancelable:true}));
  return {
    w, d, get,
    openHelp: () => d.querySelector('.bh-toggle').click(),
    ask(text) {get('division-question').value = text; submit(get('division-dialogue'));},
    answer(value) {get('answer').value = value; submit(get('answer-form'));},
    last: () => get('division-conversation').lastElementChild.querySelector('span').textContent,
    snapshot: () => JSON.parse(w.localStorage.getItem(key))
  };
}

test('current attempted digit earns native assistance, two turns preserve the task and do not reveal or advance', t => {
  const f = open(t, 'quotientDigit');
  f.answer('8');
  f.openHelp();
  f.ask('Какую цифру выбрать?');
  assert.match(f.last(), /пробуешь 8/);
  assert.match(f.last(), /больше 12/);
  const first = f.last();
  f.ask('Объясни проще');
  assert.notEqual(f.last(), first, 'compares reply text, not the two user questions');
  assert.match(f.last(), /8 групп по 3/);
  f.ask('Почему так?');
  assert.match(f.last(), /целых групп/);
  assert.doesNotMatch(f.get('division-conversation').textContent, /(?<!\d)4(?!\d)/);
  const session = f.snapshot().sessions.quotientDigit;
  assert.equal(session.hints, 1);
  assert.equal(session.reveals, 0);
  assert.equal(session.step, 0);
  assert.equal(session.draft, '8');
  assert.equal(JSON.stringify(f.snapshot()).includes('Какую цифру выбрать'), false);
  f.answer('4');
  assert.equal(f.get('division-conversation').children.length, 0);
  assert.equal(f.snapshot().sessions.quotientDigit.done, true);
});

test('a follow-up about scaling both numbers explains the same idea more simply', t => {
  const f = open(t, 'decimalDivisor');
  f.openHelp();
  f.ask('Почему можно менять оба числа?');
  assert.match(f.last(), /Число групп сохранится/);
  f.ask('А ещё проще?');
  assert.match(f.last(), /ленту/);
  f.ask('Что будет завтра с погодой?');
  assert.match(f.last(), /действие в этом шаге/);
  assert.equal(f.get('division-service-option').hidden, true);
});

test('service gets only the allowed step context, stale replies cannot populate the next step', async t => {
  const calls = [];
  const f = open(t, 'start', (request, options) => new Promise(resolve => calls.push({request, options, resolve})));
  f.openHelp();
  f.ask('Что дальше?');
  assert.equal(calls.length, 0);
  f.get('division-use-service').click();
  f.ask('Почему так?');
  assert.equal(calls.length, 1);
  assert.deepEqual(Object.keys(calls[0].request.context).sort(), ['dividend','divisor','originalDivisor','step','surface']);
  assert.equal(calls[0].request.context.step, 'start');
  f.answer('4');
  assert.equal(calls[0].options.signal.aborted, true);
  calls[0].resolve({site:'mathexam', reply:'Запоздалая реплика', state:{intent:'why'}});
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.get('division-conversation').textContent, '');
  f.openHelp();
  f.ask('Объясни проще');
  assert.equal(calls[1].request.context.step, 'count');
  assert.equal(calls[1].request.state, undefined);
});

test('digit at zero and too-small attempts leave the digit to the pupil', () => {
  assert.match(reply('Что дальше?', {step:'digit',divisor:6,partial:3,attempt:1}).text, /меньшую/);
  assert.match(reply('Не понимаю', {step:'digit',divisor:3,partial:12,attempt:2}).text, /ещё для целой группы/);
  assert.doesNotMatch(reply('Объясни проще', {step:'digit',divisor:6,partial:3}).text, /запиши 0/i);
});

test('simpler changes the reply for both high and low digit attempts while keeping the same numbers', () => {
  for (const [attempt, cue] of [[8, /на одну группу меньше/], [2, /ещё одну такую группу/]]) {
    const context = {step:'digit', divisor:3, partial:12, attempt};
    const first = reply('С чего начать?', context);
    const simpler = reply('Объясни проще', context, first.intent);
    assert.notEqual(simpler.text, first.text);
    assert.match(simpler.text, cue);
    assert(simpler.text.includes(String(attempt)) && simpler.text.includes('12'));
    assert.doesNotMatch(simpler.text, /(?<!\d)4(?!\d)/);
  }
});
