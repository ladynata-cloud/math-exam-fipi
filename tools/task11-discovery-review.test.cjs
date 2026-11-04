'use strict';

// Independent regression for a real exploratory failure: reducing |x| moves
// a clipped hyperbola point farther out, rather than bringing it into view.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const html = fs.readFileSync(path.join(__dirname, '../trainers/oge-task11-graphs-trainer.html'), 'utf8');
const KEY = 'mathExamCourseProgress.v1';

function boot(t) {
  const errors = [], console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(html, {
    url: 'https://example.test/trainers/oge-task11-graphs-trainer.html',
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: console,
    beforeParse(window) {
      window.scrollTo = () => {};
      let seed = 20261021;
      window.Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    }
  });
  t.after(() => dom.window.close());
  const w = dom.window, el = id => w.document.getElementById(id);
  return {
    w, el, errors,
    set(id, value) { const control = el(id); control.value = String(value); control.dispatchEvent(new w.Event('input', { bubbles: true })); },
    open(index) {
      w.document.querySelector('.function-help[data-i="' + index + '"]').click();
      el('t11-help-start').click(); el('t11-help-highlight').click();
    },
    points() { return [...el('t11-help-graph').querySelectorAll('[data-discovery-highlight] circle')].map(n => ({color:n.getAttribute('fill'),x:Number(n.getAttribute('cx')),y:Number(n.getAttribute('cy'))})); }
  };
}

test('clipped experimental hyperbola points receive a useful direction and honest comparison', t => {
  const f = boot(t), { w, el } = f;
  el('m4-answer').value = '23'; el('m4-answer').dispatchEvent(new w.Event('input'));
  const progress = w.localStorage.getItem(KEY);
  f.open(2); // First ordinary exercise: y = 1/x.
  f.set('t11-help-param-k', 8); f.set('t11-help-x', 0.5);
  assert.equal(w.Task11Discovery.getState().values.k / w.Task11Discovery.getState().pointX, 16);
  assert.deepEqual(f.points().map(p => p.color), ['#8a948d'], 'only original y=2 is in view');
  assert.match(el('t11-help-readout').textContent, /за кра|вне|не вид/i);
  assert.doesNotMatch(el('t11-help-readout').textContent, /ближе к нулю/i, 'moving toward zero worsens hyperbola clipping');
  assert.match(el('t11-help-readout').textContent, /дальше.{0,60}(нул|оси)|увелич.{0,60}(модул|расстоя)/i, 'action increases distance from the vertical axis');
  assert.match(el('t11-help-look').textContent, /за кра|вне|не вид/i, 'nested help acknowledges missing comparison point');
  assert.match(el('t11-help-look').textContent, /зелён|изменён|новая/i, 'identifies the changed point');
  f.set('t11-help-x', 2);
  assert.deepEqual(f.points().map(p => p.color), ['#8a948d', '#176c52'], 'moving away from zero restores both points');
  const changed = f.points().find(p => p.color === '#176c52');
  assert(Math.abs(changed.y - (6.8 - 4) * 360 / 13.6) < 1e-8, 'new point represents y=8/2 independently');
  assert.equal(el('m4-answer').value, '23'); assert.equal(w.localStorage.getItem(KEY), progress);
  assert.equal(w.eval('M4.attempts'), 0); assert.equal(w.eval('M4.done'), false);
  assert.deepEqual(f.errors, []);
});

test('nested comparison also identifies a clipped original hyperbola point', t => {
  const f = boot(t), { w, el } = f;
  let index = -1;
  for (let trial = 0; trial < 30 && index < 0; trial++) {
    w.eval('M4.type="t44";m4New()');
    index = w.eval('M4.task.items.findIndex(item=>Math.abs(item.m)===9)');
  }
  assert(index >= 0, 'real task generator supplies an original coefficient of magnitude 9');
  f.open(index); f.set('t11-help-param-k', 1); f.set('t11-help-x', 0.5);
  assert.deepEqual(f.points().map(p => p.color), ['#176c52'], 'original y=±18 is clipped; new y=2 is visible');
  assert.match(el('t11-help-look').textContent, /за кра|вне|не вид/i, 'does not claim the original marker is present');
  assert.match(el('t11-help-look').textContent, /сер|исход|задани/i, 'identifies the original point');
  assert.doesNotMatch(el('t11-help-graph').innerHTML, /NaN|Infinity|undefined/);
  assert.deepEqual(f.errors, []);
});
