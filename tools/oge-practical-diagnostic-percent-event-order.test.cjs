'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const adapters = [
  ['practical diagnostic', 'practical-diagnostic-board.js', 'PracticalDiagnosticBridge'],
  ['percent', 'percent-board.js', 'PercentBoardBridge']
];

// A real browser can checkpoint microtasks between a capture callback and the
// native app's target/bubble listeners. jsdom dispatchEvent keeps one JS stack,
// so model that browser ordering explicitly instead of hiding it in dispatch.
async function fixture(t, filename, bridge) {
  const captured = new Map(), timers = new Set(), published = [];
  const main = {prepend() {}};
  let current, registration;
  const context = vm.createContext({
    OgeCourseSharedMode: true,
    location: {origin: 'https://mathexam.space'},
    document: {
      readyState: 'complete', body: main,
      addEventListener(name, callback, capture) {
        assert.equal(capture, true);
        captured.set(name, callback);
      },
      querySelector: () => main,
      querySelectorAll: () => [],
      createElement: () => ({setAttribute() {}, style: {}})
    },
    setTimeout(callback, delay) {
      const timer = setTimeout(() => { timers.delete(timer); callback(); }, delay);
      timers.add(timer);
      return timer;
    },
    MathExamBoard: {register(config) {
      registration = config;
      config.subscribe(() => published.push(JSON.parse(JSON.stringify(config.getState()))));
    }}
  });
  context.window = context;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../trainers/oge-1-5-trainers', filename), 'utf8'), context, {filename});
  current = vm.runInContext("({draft:'',stage:0,feedback:'none'})", context);
  context[bridge].connect({
    id: 'event-order-fixture',
    getState: () => current,
    validateState: state => typeof state.draft === 'string' && Number.isInteger(state.stage) && typeof state.feedback === 'string',
    applyState(state) {
      current = state;
      captured.get('toggle')(); // Native render events must remain guarded.
    }
  });
  t.after(() => { for (const timer of timers) clearTimeout(timer); });
  const settled = () => new Promise(resolve => setTimeout(resolve, 10));
  await settled();
  assert.ok(registration, 'Adapter registered after native initialization');
  const event = (name, value = '') => captured.get(name)({target: {matches: () => true, value}});
  return {
    published, event, settled,
    state: () => current,
    apply(state) {
      context.incoming = JSON.stringify({native: state, disclosures: []});
      registration.applyState(vm.runInContext('JSON.parse(incoming)', context));
    },
    async capture(name, value) {
      event(name, value);
      await Promise.resolve();
      await Promise.resolve();
    }
  };
}

for (const [label, filename, bridge] of adapters) {
  test(`${label}: first input and check publish their completed native handlers without another event`, async t => {
    const f = await fixture(t, filename, bridge);
    await f.capture('input', '12,5');
    assert.equal(f.published.length, 0, 'Capture must wait for the native input handler');
    f.state().draft = '12,5';
    await f.settled();
    assert.equal(f.published.length, 1, 'The first draft must publish without a second event');
    assert.equal(f.published[0].native.draft, '12,5');

    await f.capture('click');
    assert.equal(f.published.length, 1, 'Capture must wait for the native check handler');
    f.state().stage = 1;
    f.state().feedback = 'correct';
    await f.settled();
    assert.equal(f.published.length, 2, 'One check publishes its completed result');
    assert.equal(f.published[1].native.stage, 1);
    assert.equal(f.published[1].native.feedback, 'correct');
  });

  test(`${label}: nested input/change/click coalesce to the final native state`, async t => {
    const f = await fixture(t, filename, bridge);
    await f.capture('input', '12'); f.state().draft = '12';
    await f.capture('change', '12,5'); f.state().draft = '12,5';
    await f.capture('click'); f.state().stage = 1; f.state().feedback = 'correct';
    assert.equal(f.published.length, 0, 'Do not publish intermediate listener state');
    await f.settled();
    assert.deepEqual(f.published, [{native: {draft: '12,5', stage: 1, feedback: 'correct'}, disclosures: []}]);
  });

  test(`${label}: remote apply with a queued local notification never echoes`, async t => {
    const f = await fixture(t, filename, bridge);
    f.event('click');
    f.state().draft = 'local';
    f.apply({draft: 'remote', stage: 1, feedback: 'correct'});
    await f.settled();
    assert.equal(f.state().draft, 'remote');
    assert.equal(f.published.length, 0, 'The queued task must not echo an applied state');
    await f.capture('toggle');
    await f.settled();
    assert.equal(f.published.length, 0, 'A delayed disclosure event must not echo an applied state');
  });

  test(`${label}: a local edit after remote apply still publishes once`, async t => {
    const f = await fixture(t, filename, bridge);
    f.event('click');
    f.apply({draft: 'remote', stage: 0, feedback: 'none'});
    await f.capture('input', '14');
    assert.equal(f.published.length, 0);
    f.state().draft = '14';
    await f.settled();
    assert.deepEqual(f.published, [{native: {draft: '14', stage: 0, feedback: 'none'}, disclosures: []}]);
  });
}
