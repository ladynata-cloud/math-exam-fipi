/* Independent numerical checks for the matching exercise and its optional lab.
 * The existing formula parser checks what the learner sees against SVG paths;
 * lab expectations below are calculated separately from the application model.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '../trainers/oge-task11-graphs-trainer.html'), 'utf8');
const scriptErrors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', e => scriptErrors.push(e.message));
const dom = new JSDOM(html, {
  url: 'https://mathexam.space/trainers/oge-task11-graphs-trainer.html',
  runScripts: 'dangerously', virtualConsole,
  beforeParse(window) {
    window.scrollTo = () => {};
    let seed = 19932026;
    window.Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  }
});
test.after(() => dom.window.close());
const lab = dom.window.Task11Lab;
const js = source => dom.window.eval(source);
const plain = value => JSON.parse(JSON.stringify(value));
const integers = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-10, label + ': ' + actual + ' versus ' + expected);

test('500 generated matching tasks: displayed formulas, keys and SVG agree independently', async () => {
  assert.deepEqual(scriptErrors, []);
  const checker = await import('./oge-algebra-contract.t11.mjs');
  const observedMixedFamilies = new Set();
  for (const type of ['t41', 't42', 't43', 't44', 't45']) {
    const tasks = JSON.parse(js(`JSON.stringify(Array.from({length:100},()=>{
      const T=m4Make('${type}');
      return {type:T.type,items:T.items.map(it=>({desc:it.desc})),key:T.key,order:T.order,
        svgs:T.order.map(ix=>svgGraph([T.items[ix].plot],[],{size:300}))};
    }))`));
    tasks.forEach((task, i) => {
      assert.deepEqual(checker.check(task), [], type + ' task ' + i);
      if (type === 't45') task.items.forEach(item => observedMixedFamilies.add(checker.parseItem(item.desc).fam));
    });
  }
  assert.deepEqual([...observedMixedFamilies].sort(), ['const', 'hyp', 'lin', 'par', 'root']);
});

test('lab coefficients cover valid families, including horizontal lines and both signs', () => {
  assert.deepEqual(Object.keys(lab.families).sort(), ['constant', 'hyp', 'lin', 'par', 'root']);
  for (const kind of ['par', 'hyp']) {
    const coefficients = plain(lab.families[kind].params[0][2]);
    assert.ok(coefficients.some(n => n < 0) && coefficients.some(n => n > 0));
    assert.ok(!coefficients.includes(0), kind + ' must keep its defining nonzero coefficient');
  }
  const horizontal = lab.model('lin', { k: 0, b: -3 }, 5);
  assert.equal(horizontal.y, -3);
  assert.match(horizontal.insight, /горизонтальна/);
  assert.doesNotMatch(horizontal.formula, /<i>x<\/i>/);
  assert.match(horizontal.formula, /−3/);
});

test('all selectable lab values obey independently computed functions and domain boundaries', async () => {
  const { parseItem } = await import('./oge-algebra-contract.t11.mjs');
  let cases = 0;
  const grid = [];
  for (const k of integers(-4, 4)) for (const b of integers(-4, 4)) grid.push(['lin', { k, b }, x => k * x + b]);
  for (const a of [-4, -3, -2, -1, 1, 2, 3, 4]) for (const b of integers(-4, 4)) for (const c of integers(-4, 4)) grid.push(['par', { a, b, c }, x => a * x ** 2 + b * x + c]);
  for (const k of [-8, -6, -4, -3, -2, -1, 1, 2, 3, 4, 6, 8]) grid.push(['hyp', { k }, x => x === 0 ? NaN : k / x]);
  for (const c of integers(-4, 4)) for (const d of integers(-4, 4)) grid.push(['root', { c, d }, x => x < c ? NaN : Math.sqrt(x - c) + d]);
  for (const b of integers(-4, 4)) grid.push(['constant', { b }, () => b]);
  for (const [kind, values, expectedFn] of grid) {
    for (const x of integers(-5, 5)) {
      const expected = expectedFn(x), m = lab.model(kind, values, x), label = kind + ' ' + JSON.stringify(values) + ' x=' + x;
      assert.equal(m.defined, Number.isFinite(expected), label + ' domain');
      assert.equal(m.pointVisible, Number.isFinite(expected) && Math.abs(expected) <= 6, label + ' visible point');
      assert.equal(m.marks.filter(mark => mark.type === 'point' && mark.color === '#176c52').length, m.pointVisible ? 1 : 0, label + ' probe marker');
      assert.doesNotMatch(m.formula + m.insight + m.pointText, /NaN|Infinity|undefined/, label + ' learner text');
      if (m.defined) {
        close(m.y, expected, label);
        close(parseItem(m.formula).f(x), expected, label + ' visible formula');
        const rounded = Math.round(expected * 100) / 100;
        if (Math.abs(expected - rounded) > 1e-9) assert.match(m.pointText, /y ≈/, label + ' approximation');
      } else assert.ok(!m.marks.some(mark => mark.color === '#176c52'), label + ' no invented domain point');
      for (const mark of m.marks) {
        if (mark.type === 'point') assert.ok(Number.isFinite(mark.x) && Number.isFinite(mark.y) && Math.abs(mark.x) <= 6 && Math.abs(mark.y) <= 6, label + ' finite in-frame marker');
      }
      cases++;
    }
  }
  assert.equal(cases, 9141);
});

test('singularities, approximate values and clipped points have honest explanations', () => {
  const zero = lab.model('hyp', { k: 3 }, 0);
  assert.equal(zero.defined, false);
  assert.match(zero.pointText, /на ноль делить нельзя/);
  const third = lab.model('hyp', { k: 1 }, 3);
  assert.match(third.pointText, /y ≈ 0,33/);
  const radical = lab.model('root', { c: 0, d: 0 }, 2);
  assert.match(radical.pointText, /y ≈ 1,41/);
  const beginning = lab.model('root', { c: 4, d: -2 }, 4);
  assert.equal(beginning.y, -2);
  const outsideDomain = lab.model('root', { c: 4, d: -2 }, 3);
  assert.equal(outsideDomain.defined, false);
  assert.match(outsideDomain.pointText, /Такой точки на графике нет/);
  const outsideFrame = lab.model('par', { a: 4, b: 4, c: 4 }, 5);
  assert.equal(outsideFrame.y, 124);
  assert.equal(outsideFrame.pointVisible, false);
  assert.match(outsideFrame.pointText, /за краем рисунка/);
});

test('lab SVG paths are finite and hyperbola branches do not cross the undefined point', async () => {
  const { graphPoints, parseItem } = await import('./oge-algebra-contract.t11.mjs');
  const examples = [
    ['lin', { k: 0, b: -4 }, 2], ['lin', { k: -4, b: 4 }, 2],
    ['par', { a: -4, b: 3, c: -2 }, -1], ['par', { a: 1, b: 4, c: 4 }, -2],
    ['hyp', { k: -8 }, 0], ['hyp', { k: 1 }, 3],
    ['root', { c: -4, d: 4 }, -5], ['root', { c: 4, d: -4 }, 4],
    ['constant', { b: 4 }, 5]
  ];
  for (const [kind, values, x] of examples) {
    const m = lab.model(kind, values, x);
    dom.window.__reviewModel = m;
    const svg = js('svgGraph([window.__reviewModel.plot], window.__reviewModel.marks, {size:360})');
    assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
    const { lines, sc } = graphPoints(svg);
    assert.ok(lines.length > 0, kind + ' curve exists');
    const fn = parseItem(m.formula).f;
    for (const line of lines) {
      if (kind === 'hyp') assert.ok(line.every(p => p.x < 0) || line.every(p => p.x > 0), 'a hyperbola path must stay on one side of x=0');
      for (const point of line) {
        assert.ok(Math.abs(point.x) <= 6.801 && Math.abs(point.y) <= 6.801, kind + ' path clipped to SVG');
        const dx = 0.08 / sc, dy = 0.08 / sc;
        const probes = integers(-10, 10).map(j => point.x + j * dx / 10);
        // The square-root endpoint has an infinite slope. Include its exact
        // domain boundary rather than relying on an evenly sampled tolerance.
        if (kind === 'root' && Math.abs(point.x - values.c) <= dx) probes.push(values.c);
        const residuals = probes.map(px => fn(px) - point.y).filter(Number.isFinite);
        assert.ok(residuals.some(r => Math.abs(r) <= dy) || Math.min(...residuals) < 0 && Math.max(...residuals) > 0, kind + ' drawn point belongs to displayed formula');
      }
    }
  }
  delete dom.window.__reviewModel;
});
