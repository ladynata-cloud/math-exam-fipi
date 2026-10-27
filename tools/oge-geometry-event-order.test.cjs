'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const adapter = fs.readFileSync(path.join(root, 'trainers/oge-geometry-board.js'), 'utf8');
const copy = value => JSON.parse(JSON.stringify(value));
const settle = () => new Promise(resolve => setTimeout(resolve, 15));
class Local extends ResourceLoader {
  fetch(value) {
    const url = new URL(value);
    if (url.origin !== 'https://mathexam.space') return null;
    if (/\/(?:board-bridge|oge-geometry-board)\.js$/.test(url.pathname)) return Promise.resolve(Buffer.from(''));
    const filename = path.join(root, url.pathname);
    return fs.existsSync(filename) ? Promise.resolve(fs.readFileSync(filename)) : null;
  }
}
async function fixture(t, n) {
  const route = `trainers/oge-task${n}-${{ 16: 'circle', 17: 'quadrilaterals', 18: 'grid' }[n]}.html`;
  const published = [], captured = new Map(), errors = [], console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  let registration;
  const dom = new JSDOM(fs.readFileSync(path.join(root, route), 'utf8'), {
    url: 'https://mathexam.space/' + route + '?board=1', runScripts: 'dangerously', resources: new Local(),
    pretendToBeVisual: true, virtualConsole: console,
    beforeParse(window) {
      window.MathExamBoard = { register(value) {
        registration = value; value.subscribe(() => published.push(copy(value.getState())));
      } };
    }
  });
  t.after(() => dom.window.close());
  await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
  const w = dom.window, d = w.document, add = d.addEventListener.bind(d);
  d.addEventListener = function (name, listener, options) {
    if (options === true) captured.set(name, listener);
    add(name, listener, options);
  };
  try { w.eval(adapter); } finally { d.addEventListener = add; }
  await settle(); assert.deepEqual(errors, []); assert.equal(published.length, 0);
  return {
    w, d, published, errors, state: () => copy(registration.getState()),
    apply(value) { registration.applyState(w.JSON.parse(JSON.stringify(value))); },
    // Native dispatch can checkpoint microtasks after capture, unlike jsdom's
    // single scripted click stack. Run the real listener before that checkpoint.
    async capture(name, target) {
      captured.get(name)({ target }); await Promise.resolve(); await Promise.resolve();
    },
    target(name, target) {
      const listener = captured.get(name); d.removeEventListener(name, listener, true);
      try { if (name === 'click') target.click(); else target.dispatchEvent(new w.Event(name, { bubbles: true })); }
      finally { add(name, listener, true); }
    }
  };
}

for (const n of [16, 17, 18]) {
  test(`OGE${n}: native capture waits for the task listener and coalesces the completed dispatch`, async t => {
    const f = await fixture(t, n), input = f.d.getElementById(n === 18 ? 'ansIn' : 'ans');
    input.value = '123,45'; await f.capture('input', input);
    assert.equal(f.published.length, 0, 'the input capture must not publish an intermediate state');
    f.target('input', input); await settle();
    assert.equal(f.published.length, 1); assert.equal(f.published[0].answer, '123,45');

    const button = f.d.getElementById('courseHintToggle');
    await f.capture('click', button);
    assert.equal(f.published.length, 1, 'the capture must wait for the native help listener');
    f.target('click', button);
    input.value = '7/2'; await f.capture('input', input); f.target('input', input);
    await f.capture('change', input); f.target('change', input);
    assert.equal(f.published.length, 1, 'nested dispatches coalesce before the timer');
    await settle();
    assert.equal(f.published.length, 2);
    assert.equal(f.published[1].helpOpen, true); assert.equal(f.published[1].helpUsed, true);
    assert.equal(f.published[1].answer, '7/2'); assert.deepEqual(f.published[1], f.state());
    assert.deepEqual(f.errors, []);
  });

  test(`OGE${n}: remote state arriving before a queued local notification is applied without an echo`, async t => {
    const f = await fixture(t, n), remote = f.state(); remote.answer = '23';
    const input = f.d.getElementById(n === 18 ? 'ansIn' : 'ans'); input.value = '12';
    await f.capture('input', input);
    assert.equal(f.published.length, 0);
    f.apply(remote); await settle();
    assert.deepEqual(f.state(), remote);
    assert.equal(f.published.length, 0, 'neither the queued notification nor deferred toggles echo remote state');
    assert.deepEqual(f.errors, []);
  });
}
