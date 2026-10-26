'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM, ResourceLoader, VirtualConsole} = require('jsdom');

const root = path.resolve(__dirname, '..');
const names = {6:'fractions', 7:'number-line', 8:'powers-roots', 9:'equations'};
const settle = () => new Promise(resolve => setTimeout(resolve, 15));
const plain = value => JSON.parse(JSON.stringify(value));

class Local extends ResourceLoader {
  fetch(url) {
    const pathname = new URL(url).pathname;
    if (pathname.endsWith('/board-bridge.js')) return Promise.resolve(Buffer.from(`
      window.published = [];
      window.MathExamBoard = {register(config) {
        window.registration = config;
        config.subscribe(() => published.push(JSON.parse(JSON.stringify(config.getState()))));
      }};
    `));
    const filename = path.join(root, pathname);
    return filename.startsWith(root + path.sep) && fs.existsSync(filename) && fs.statSync(filename).isFile()
      ? Promise.resolve(fs.readFileSync(filename)) : null;
  }
}

async function fixture(t, number) {
  const captured = new Map(), errors = [];
  let skipCapture = false;
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => {
    if (!/Not implemented/.test(error.message)) errors.push(error.message);
  });
  const filename = `trainers/oge-task${number}-${names[number]}.html`;
  const dom = new JSDOM(fs.readFileSync(path.join(root, filename), 'utf8'), {
    url: `https://mathexam.space/${filename}?board=1`,
    runScripts: 'dangerously', resources: new Local(), virtualConsole, pretendToBeVisual: true,
    beforeParse(window) {
      window.scrollTo = () => {};
      window.HTMLElement.prototype.scrollIntoView = () => {};
      const add = window.EventTarget.prototype.addEventListener;
      window.EventTarget.prototype.addEventListener = function(name, listener, options) {
        if (this.id === 'oge-foundation-stage' && options === true) {
          captured.set(name, listener);
          return add.call(this, name, function(event) {
            if (!skipCapture) return listener.call(this, event);
          }, options);
        }
        return add.call(this, name, listener, options);
      };
    },
  });
  t.after(() => { dom.window.close(); assert.deepEqual(errors, []); });
  const window = dom.window, document = window.document;
  await new Promise(resolve => window.addEventListener('load', resolve, {once:true}));
  await settle();
  assert(window.OgeFoundationBoard);
  const stage = () => document.getElementById('oge-foundation-stage');
  return {
    window, document, stage, published: window.published,
    state: () => plain(window.OgeFoundationBoard.getState()),
    apply: state => window.OgeFoundationBoard.applyState(window.JSON.parse(JSON.stringify(state))),
    // Scripted jsdom dispatch keeps capture and target on one JS stack. Native
    // browser dispatch can checkpoint microtasks between those listeners. Run
    // the real capture handler, checkpoint, then dispatch the real target code.
    async capture(name, target) {
      assert(captured.has(name), 'The native adapter has a capture listener for ' + name);
      const event = new window.Event(name, {bubbles:true, cancelable:true});
      Object.defineProperty(event, 'target', {value:target});
      captured.get(name).call(stage(), event);
      await Promise.resolve();
      await Promise.resolve();
    },
    native(name, target) {
      skipCapture = true;
      try {
        if (name === 'click') target.click();
        else target.dispatchEvent(new window.Event(name, {bubbles:true}));
      } finally { skipCapture = false; }
    },
  };
}

const button = (stage, text) => {
  const found = [...stage.querySelectorAll('button')].find(node => node.textContent.trim() === text);
  assert(found, 'Native button exists: ' + text);
  return found;
};
const projection = f => ({
  text: f.stage().textContent.replace(/\s+/g, ' ').trim(),
  inputs: [...f.stage().querySelectorAll('input,textarea,select')].map(node => [node.value, node.disabled, node.readOnly]),
  details: [...f.stage().querySelectorAll('details')].map(node => node.open),
});

for (const number of [6,7,8,9]) test(`OGE${number}: native help publishes after its own target handler without another event`, async t => {
  const local = await fixture(t, number), peer = await fixture(t, number);
  const help = button(local.stage(), 'Хочешь подсказку?');
  await local.capture('click', help);
  assert.equal(local.published.length, 0, 'Capture cannot publish before the native help handler');
  local.native('click', help);
  await settle();
  assert.equal(local.published.length, 1, 'The completed click publishes exactly once without a second event');
  assert.deepEqual(plain(local.published[0]), local.state());
  peer.apply(local.published[0]);
  await settle();
  assert.deepEqual(projection(peer), projection(local));
  assert.equal(peer.published.length, 0, 'Peer replay stays silent');
});

test('OGE8: a reference zoom click publishes the auxiliary state written by its target handler', async t => {
  const local = await fixture(t, 8), peer = await fixture(t, 8);
  button(local.stage(), 'Хочешь подсказку?').click();
  for (const details of local.stage().querySelectorAll('.oca-reference details')) details.open = true;
  await settle();
  local.published.length = 0;
  const zoom = local.stage().querySelector('.oca-reference .ocr-zoom');
  assert(zoom);
  assert.notEqual(zoom.getAttribute('aria-pressed'), 'true');
  await local.capture('click', zoom);
  assert.equal(local.published.length, 0);
  local.native('click', zoom);
  await settle();
  assert.equal(zoom.getAttribute('aria-pressed'), 'true');
  assert.equal(local.published.length, 1, 'The first zoom click must not remain stranded until another event');
  assert(local.published[0].auxiliary.cards[0].reference.zoom.includes(true));
  peer.apply(local.published[0]);
  await settle();
  assert.deepEqual(projection(peer), projection(local));
  assert.equal(peer.stage().querySelector('.oca-reference .ocr-zoom').getAttribute('aria-pressed'), 'true');
  assert.equal(peer.published.length, 0);
});

test('OGE6: input, change and check coalesce to the completed native result across capture checkpoints', async t => {
  const local = await fixture(t, 6), peer = await fixture(t, 6);
  const answer = local.stage().querySelector('#ans'), check = local.stage().querySelector('#check');
  answer.value = '987654';
  await local.capture('input', answer);
  local.native('input', answer);
  await local.capture('change', answer);
  local.native('change', answer);
  await local.capture('click', check);
  local.native('click', check);
  assert.equal(local.published.length, 0, 'Intermediate capture states are not sent');
  await settle();
  assert.equal(local.published.length, 1);
  assert.deepEqual(plain(local.published[0].actions.map(action => action[0])), ['draft','check']);
  peer.apply(local.published[0]);
  await settle();
  assert.deepEqual(projection(peer), projection(local));
  assert.equal(peer.published.length, 0);
});

for (const number of [6,8]) test(`OGE${number}: remote apply replaces a queued local publication without an echo`, async t => {
  const local = await fixture(t, number), peer = await fixture(t, number);
  const remote = peer.state();
  remote.task.index = 1;
  const help = button(local.stage(), 'Хочешь подсказку?');
  await local.capture('click', help);
  local.native('click', help);
  local.apply(remote);
  await settle();
  assert.deepEqual(local.state(), remote);
  assert.equal(local.published.length, 0, 'The queued callback cannot echo or resurrect superseded local state');
});
