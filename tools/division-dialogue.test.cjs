'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const {reply, preferences} = require('../assets/assistant/division-dialogue.js');
const root = path.resolve(__dirname, '..');
const base = 'trainers/oge-basics/';
const sub = base + 'multiplication-division/';
const key = 'mathExamBasics.guidedDivision.v1';
const preferenceKey = 'mathexam.divisionHelp.preference.v1';

function open(t, topic, service, options = {}) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'trainers/long-division-stepwise.html'), 'utf8'), {
    url:'https://mathexam.space/trainers/long-division-stepwise.html#' + topic,
    runScripts:'outside-only', pretendToBeVisual:true
  });
  t.after(() => dom.window.close());
  const w = dom.window, d = w.document;
  w.structuredClone = structuredClone;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  if (service) w.SiteDialogueClient = {enabled:true, ask:service};
  const load = asset => w.eval(fs.readFileSync(path.join(root, asset), 'utf8'));
  for (const file of ['division-lab-core', 'division-guided-core']) load(sub + file + '.js');
  load(base + 'arithmetic-route.js');
  load(base + 'basics-help.js');
  load(sub + 'division-guided.js');
  if (options.preference) w.localStorage.setItem(preferenceKey, options.preference);
  if (options.blockStorage) Object.defineProperty(w, 'localStorage', {get() {throw new Error('Storage unavailable');}});
  load('assets/assistant/division-dialogue.js');
  const get = id => d.getElementById(id);
  const submit = form => form.dispatchEvent(new w.Event('submit', {bubbles:true, cancelable:true}));
  return {
    w, d, get,
    openHelp: () => d.querySelector('.bh-toggle').click(),
    ask(text) {get('division-question').value = text; submit(get('division-dialogue'));},
    answer(value) {
      const action = w.__divisionGuidedDebug.plan().actions[w.__divisionGuidedDebug.state().sessions[topic].step];
      if (action?.options) d.querySelector('[data-option="' + value + '"]').click();
      else get('answer').value = value;
      submit(get('answer-form'));
    },
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
  assert.match(f.last(), /только 8 × 3/);
  assert.doesNotMatch(f.last(), /больше|меньше|24/);
  const first = f.last();
  f.ask('Объясни проще');
  assert.notEqual(f.last(), first, 'compares reply text, not the two user questions');
  assert.match(f.last(), /группа — это 3.*8 таких групп/);
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

test('a digit probe requests multiplication; a standalone zero exercise leaves the digit to the pupil', () => {
  assert.match(reply('Что дальше?', {step:'digit',divisor:6,partial:3,attempt:1}).text, /1 × 6/);
  assert.match(reply('Не понимаю', {step:'digit',divisor:3,partial:12,attempt:2}).text, /2 × 3/);
  assert.doesNotMatch(reply('Объясни проще', {step:'digit',divisor:6,partial:3}).text, /запиши 0/i);
});

test('simpler changes the reply for both high and low digit attempts while keeping the same numbers', () => {
  for (const attempt of [8, 2]) {
    const context = {step:'digit', divisor:3, partial:12, attempt};
    const first = reply('С чего начать?', context);
    const simpler = reply('Объясни проще', context, first.intent);
    assert.notEqual(simpler.text, first.text);
    assert.match(simpler.text, /таких группах/);
    assert(simpler.text.includes(String(attempt)) && simpler.text.includes('3'));
    assert.doesNotMatch(simpler.text, /(?<!\d)4(?!\d)/);
  }
});

test('three simpler follow-ups keep the reason rather than switch to a calculation', t => {
  const f = open(t, 'decimalDivisor');
  f.openHelp(); f.ask('Почему так?'); f.ask('Объясни проще');
  assert.match(f.last(), /ленту.*куск|ленту.*кусоч/u);
  f.ask('Ещё проще');
  assert.match(f.last(), /единица измерения.*столько же/u);
  assert.doesNotMatch(f.last(), /сдвинь|перенеси|посчитай/u);
  f.ask('Всё равно не поняла');
  assert.match(f.last(), /единица измерения/u);
});

test('a named digit overrides an older native attempt and an actual new submission resets it', t => {
  const f = open(t, 'quotientDigit');
  f.answer('8'); f.openHelp();
  f.ask('Пробую 3'); assert.match(f.last(), /3 × 3/);
  f.ask('Получилось 9'); assert.match(f.last(), /Сравни полученное 9 с 12/);
  f.ask('Меньше'); assert.match(f.last(), /Прибавь.*9.*3/);
  f.ask('12'); assert.match(f.last(), /Ещё одна целая группа помещается/);
  f.answer('8');
  f.ask('Что дальше?'); assert.match(f.last(), /8 × 3/);
  assert.equal(f.snapshot().sessions.quotientDigit.step, 0);
  assert.equal(f.snapshot().sessions.quotientDigit.reveals, 0);
});

test('numeric dialogue checks multiplication and comparison before allowing the next group', () => {
  const c = {step:'digit', divisor:3, partial:12, attempt:8};
  let p = reply('Пробую 3', c); p.nativeAttempt = 8;
  p = {...reply('9', c, p), nativeAttempt:8};
  assert.equal(p.intent, 'digit-compare');
  for (const falseClaim of ['равно', 'не меньше', 'больше', 'не помещается']) {
    assert.match(reply(falseClaim,c,p).text,/Перепроверь сравнение 9 и 12/);
  }
  p = {...reply('А дальше?',c,p),nativeAttempt:8};
  assert.equal(p.intent, 'digit-extra');
  assert.match(reply('13',c,p).text,/Перепроверь сложение/);
  assert.match(reply('12',c,p).text,/Ещё одна целая группа помещается/);
  assert.match(reply('Что дальше?',{...c,attempt:2},p).text,/2 × 3/);
  const correct = {step:'digit',divisor:7,partial:16};
  let q = reply('Пробую 2', correct);
  q = reply('14',correct,q); q = reply('Помещается',correct,q);
  assert.match(reply('21',correct,q).text,/Запиши в частном свою проверенную цифру/);
});

test('the zero belongs to the current trainer cycle and does not advance or reveal the full quotient', t => {
  const f = open(t, 'zero');
  const plan = f.w.__divisionGuidedDebug.plan();
  for (let guard = 0; guard < 40; guard++) {
    const s = f.snapshot().sessions.zero;
    const a = plan.actions[s.step];
    if (a.kind === 'digit' && a.cycle > 0 && plan.cycles[a.cycle].partial < plan.normalizedDivisor) break;
    f.answer(a.answer);
  }
  const before = f.snapshot().sessions.zero;
  f.openHelp(); f.ask('Можно сносить следующую цифру?');
  assert.match(f.last(), /Запиши 0 в разряде десятков\./);
  assert.doesNotMatch(f.last(), /затем|снеси|201/);
  assert.equal(f.snapshot().sessions.zero.step,before.step);
  assert.equal(f.snapshot().sessions.zero.reveals,0);
  assert.match(reply('Что дальше?',{step:'digit',divisor:8,partial:1,quotientStarted:true,placeExponent:-2}).text,/разряде сотых/);
  assert.match(reply('Что дальше?',{step:'digit',divisor:8,partial:1,quotientStarted:true}).text,/на этом месте частного/);
});

test('opt-in remembers only the explanation preference, reload uses it and reset clears it', t => {
  const f = open(t, 'decimalDivisor');
  f.openHelp();f.ask('Почему оба числа меняются?');
  assert.equal(f.w.localStorage.getItem(preferenceKey),null);
  f.get('division-remember-help').click();
  const saved = f.w.localStorage.getItem(preferenceKey);
  assert.deepEqual(JSON.parse(saved),{version:1,enabled:true,intent:'why'});
  assert.doesNotMatch(saved,/Почему|dividend|divisor|attempt|reply/);
  const g = open(t,'decimalDivisor',undefined,{preference:saved});
  assert.equal(g.get('division-remember-help').checked,true);
  g.openHelp();g.ask('Объясни проще');assert.match(g.last(),/ленту/);
  g.get('division-forget-help').click();
  assert.equal(g.w.localStorage.getItem(preferenceKey),null);
  assert.equal(g.get('division-remember-help').checked,false);
});

test('broken or denied storage cannot break local help', t => {
  for (const options of [{preference:'{'},{blockStorage:true}]) {
    const f = open(t,'start',undefined,options);
    f.openHelp();f.ask('Что делать?');assert.match(f.last(),/первую цифру/);
    f.get('division-remember-help').click();
    f.ask('Почему?');assert.match(f.last(),/разрядам/);
    if (options.blockStorage) {
      assert.equal(f.get('division-remember-help').checked,false);
      assert.match(f.get('division-memory-status').textContent,/Не удалось/);
    }
  }
  const denied=preferences({getItem(){return null},setItem(){throw Error('quota')},removeItem(){throw Error('denied')}});
  assert.equal(denied.enable(true).available,false);
  assert.equal(denied.clear().enabled,false);
});
