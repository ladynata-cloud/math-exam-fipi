'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Browser-dispatched events may checkpoint microtasks after a capture listener,
// before the native target/bubble handlers. Scripted dispatchEvent() in jsdom
// keeps one JS stack around those handlers and does not reproduce that boundary.
function fixture(t) {
  const captured = new Map(), timers = new Set(), published = [];
  let current, registration;
  const card = {__practicalQuestion: {
    capture: () => current.questions[0],
    restore(value) { current.questions[0] = value; captured.get('toggle')({target:{}}); }
  }};
  const zoom = {getAttribute: () => String(current.zoom[0]), click() { current.zoom[0] = !current.zoom[0]; captured.get('click')({target:{}}); }};
  const context = vm.createContext({
    OgeCourseSharedMode: true,
    location: {origin: 'https://mathexam.space'},
    document: {
      addEventListener(name, callback, capture) { assert.equal(capture, true); captured.set(name, callback); },
      querySelectorAll(selector) {
        if (selector === '.pv-shell .pv-question') return [card];
        if (selector === '.pv-shell .pv-calculation') return [];
        if (selector === '.pv-reference .pv-zoom') return [zoom];
        throw new Error('Unexpected selector: ' + selector);
      }
    },
    queueMicrotask,
    setTimeout(callback, delay) {
      assert.equal(delay, 0, 'Notifications wait for the next task, without a user-visible debounce');
      const timer = setTimeout(() => { timers.delete(timer); callback(); }, delay);
      timers.add(timer); return timer;
    },
    MathExamBoard: {register(config) {
      registration = config;
      config.subscribe(() => published.push(JSON.parse(JSON.stringify(config.getState()))));
    }}
  });
  context.window = context;
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../trainers/oge-1-5-trainers/practical-board.js'), 'utf8'), context);
  current = vm.runInContext(`({descriptor:{variant:0},questions:[{
    answers:{answer:''},checked:false,helpUsed:false,helpOpen:false,details:[false,false],
    model:{kind:'route',values:[],choices:[],lastWrong:null},zoom:[]
  }],calculations:[],zoom:[false]})`, context);
  context.nativeState = current;
  vm.runInContext(`
    PracticalDiscovery = {
      validateState: (model, kind) => model.kind === kind,
      isInitialState: model => model.values.length === 0 && model.choices.length === 0 && model.lastWrong === null
    };
    PracticalBoard.register({
      id:'practice-1-5-roads-schema',
      get:()=>nativeState.descriptor,
      valid:d=>PracticalBoard.exact(d,['variant'])&&Number.isInteger(d.variant)&&d.variant>=0&&d.variant<4,
      describe:()=>[PracticalBoard.description('route',{answer:null},2,0)],
      set:d=>{nativeState.descriptor=d;}
    });
  `, context);
  t.after(() => { for (const timer of timers) clearTimeout(timer); });
  return {
    published,
    state: () => current,
    apply: value => registration.applyState(value),
    async capture(name) { captured.get(name)({target:{matches:()=>false}}); await Promise.resolve(); await Promise.resolve(); },
    settled: () => new Promise(resolve => setTimeout(resolve, 10))
  };
}

test('practical draft/check/help publish their completed native handler on the first event', async t => {
  const f = fixture(t);
  await f.capture('input');
  assert.equal(f.published.length, 0, 'Capture cannot publish a pre-handler draft');
  f.state().questions[0].answers.answer = '12,75';
  await f.settled();
  assert.equal(f.published.length, 1, 'The first input needs no follow-up event');
  assert.equal(f.published[0].questions[0].answers.answer, '12,75');

  await f.capture('submit');
  assert.equal(f.published.length, 1);
  f.state().questions[0].checked = true;
  await Promise.resolve(); // The native form checker may finish in a microtask.
  await f.settled();
  assert.equal(f.published.length, 2);
  assert.equal(f.published[1].questions[0].checked, true);

  await f.capture('click');
  f.state().questions[0].helpUsed = true;
  f.state().questions[0].helpOpen = true;
  await f.settled();
  assert.equal(f.published.length, 3);
  assert.equal(f.published[2].questions[0].helpOpen, true);
});

test('practical capture checkpoints coalesce until all native input/change handlers finish', async t => {
  const f = fixture(t);
  await f.capture('input'); f.state().questions[0].answers.answer = '12,';
  await f.capture('change'); f.state().questions[0].answers.answer = '12,75';
  await f.capture('submit'); f.state().questions[0].checked = true;
  assert.equal(f.published.length, 0, 'No intermediate native state is emitted');
  await f.settled();
  assert.equal(f.published.length, 1);
  assert.equal(f.published[0].questions[0].answers.answer, '12,75');
  assert.equal(f.published[0].questions[0].checked, true);
});

test('practical queued local notification never echoes a later remote apply', async t => {
  const f = fixture(t);
  await f.capture('click');
  const remote = f.state();
  remote.descriptor.variant = 1;
  remote.questions[0].answers.answer = '8';
  remote.questions[0].checked = true;
  remote.zoom[0] = true;
  f.apply(remote); // restore emits native toggle while apply is guarded.
  await f.settled();
  assert.equal(f.published.length, 0, 'The pending task compares against the applied snapshot');
  assert.equal(f.state().questions[0].answers.answer, '8');

  await f.capture('click');
  await f.settled();
  assert.equal(f.published.length, 0, 'An unchanged later event stays silent');

  await f.capture('input');
  f.state().questions[0].answers.answer = '9';
  f.state().questions[0].checked = false;
  await f.settled();
  assert.equal(f.published.length, 1, 'A later local edit still publishes after remote apply');
  assert.equal(f.published[0].questions[0].answers.answer, '9');
  assert.equal(f.published[0].questions[0].checked, false);
});
