'use strict';
const assert = require('node:assert/strict');
const C = require('../soviet-math/course.js');
const motion = require('../soviet-math/extension-motion.js');
const source = require('../soviet-math/sources.js').forTopic('motion-time');
const speech = require('../soviet-math/narration.json').find(item => item.id === 'motion-time');
const board = require('../soviet-math/board.js');

assert.equal(motion.examplesPerTopic, 12);
assert.equal(C.topics.at(-1).id, 'motion-time');
assert.equal(C.topics.length, 61);
assert.equal(C.revision, 2, 'additive topic does not rewrite previous attempts');
assert.equal(source.task, null, 'authored exercises are not textbook exercise quotations');
assert.equal(source.year, 1966);
assert.equal(source.pages, '51, 284');
const identities = new Set();
const seconds = (text, minimum) => Math.max(minimum, Math.ceil(((text.match(/[А-Яа-яЁёA-Za-z0-9]+(?:-[А-Яа-яЁёA-Za-z0-9]+)*/g) || []).length / 2 + 1.5) * 10) / 10);
for (let i = 0; i < 12; i++) {
  const plan = C.make('motion-time', i);
  // Read quantities from the published condition, not generator-private data.
  const distance = Number(plan.prompt.match(/(\d+) км[. ]/)?.[1]);
  const speed = Number(plan.prompt.match(/(\d+) км\/ч/)?.[1]);
  assert.ok(distance > 0 && speed > 0, plan.prompt);
  assert.equal(distance % speed, 0);
  const time = distance / speed;
  assert.equal(plan.answer, String(time));
  assert.deepEqual(plan.steps.map(item => item.answer), [String(time), String(distance)]);
  assert.equal(plan.visual.distance, distance);
  assert.equal(plan.visual.speed, speed);
  assert.equal(plan.visual.time, time);
  assert.equal(plan.visual.unknown, 'time');
  assert.match(plan.prompt, /скорость не меняется и остановок нет/);
  identities.add(plan.prompt);
  for (const step of plan.steps) {
    assert.equal(C.check(step.answer, step), true);
    assert.equal(C.check(String(Number(step.answer) + 1), step), false);
    assert.equal(C.check('', step), false);
    assert.ok(step.record.length < 45);
    assert.ok(step.beforeHelper.length && step.helper.length);
  }
  const s = plan.narration;
  const segments = [{text:s.intro,min:8}, ...s.steps.flatMap(step=>[{text:step.question,min:3.5},{text:step.explanation,min:8}]), {text:s.final,min:8}];
  const durations = segments.map(item => seconds(item.text, item.min));
  assert.ok(durations.every(value => value <= 30), 'cloud scene duration: ' + i);
  const duration = durations.reduce((a,b)=>a+b,0);
  assert.ok(duration >= 90 && duration <= 150, 'reading time: ' + duration);
  assert.deepEqual({...C.make('motion-time', i+12), index:i}, plan);
}
assert.equal(identities.size, 12);
assert.equal(C.make('motion-time', 0).answer, '3');
assert.deepEqual(speech, {id:'motion-time', ...C.make('motion-time',0).narration});
assert.throws(() => motion.make('motion-speed', 0));
assert.throws(() => motion.make('motion-time', -1));

// Record the actual text drawn by the shared canvas renderer. No hidden-time
// answer may leak through segment labels before a correct answer or reveal.
function drawnText(plan, completed, options = {}) {
  const labels = [];
  const context = new Proxy({ measureText: value => ({width:String(value).length*14}),
    fillText: value => labels.push(String(value)) }, {get:(target,key)=>key in target?target[key]:()=>{}});
  board.draw({width:1280,height:800,getContext:()=>context}, plan, completed, {activeStep:0,reveal:false,...options});
  return labels;
}
const plan = C.make('motion-time',0);
const hidden = drawnText(plan,0).join('\n');
assert.match(hidden,/Время всего пути: \? ч/);
assert.doesNotMatch(hidden,/3 ч|2 ч|12 : 4 = 3|4 × 3/);
assert.equal(drawnText(plan,0).filter(value=>/^\d+ ч$/.test(value)).length,0,'no completed time scale before answer');
for (const shown of [drawnText(plan,1),drawnText(plan,0,{reveal:true})]) {
  assert.ok(shown.includes('3 ч'));
  assert.ok(shown.includes('Время: 12 : 4 = 3 ч'));
}
assert.ok(drawnText(plan,2).includes('Проверка: 4 × 3 = 12 км'));
// Existing known-time diagrams retain all labels and accepted mathematics.
assert.ok(drawnText(C.make('motion-distance',0),0).includes('3 ч'));
assert.ok(drawnText(C.make('motion-speed',0),0).includes('3 ч'));
console.log('SOVIET_MATH_MOTION_OK: 12 independent story calculations, reading times, answer secrecy and shared-board reveal');
