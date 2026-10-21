'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'trainers/oge-1-5-trainers');
class Local extends ResourceLoader {
  fetch(url) {
    const parsed = new URL(url);
    if (parsed.origin !== 'https://mathexam.space') return null;
    const file = path.join(root, parsed.pathname);
    return fs.existsSync(file) && fs.statSync(file).isFile() ? Promise.resolve(fs.readFileSync(file)) : null;
  }
}
const tick = () => new Promise(resolve => setTimeout(resolve, 25));
async function open(slug) {
  const errors = [], console = new VirtualConsole();
  console.on('jsdomError', error => { if (!/scrollTo|navigation|HTMLCanvasElement.prototype.getContext/.test(error.message)) errors.push(error.message); });
  let html = fs.readFileSync(path.join(dir, 'practice-1-5-' + slug + '.html'), 'utf8');
  if (!html.includes('data-practical-variant="1"')) html = html.replace('<body ', '<body data-practical-variant="1" ');
  if (!html.includes('src="practical-variant.js"')) html = html.replace('</body>', '<script src="practical-variant.js"></script><script src="practical-variant-buildings.js"></script></body>');
  // Expose the unchanged closure's generated expected values only in this test.
  // Production keeps native plot grading private and invokes it through its controls.
  if (slug === 'land-plots') html = html.replace('drawPlan();drawLegend();load();', 'window.__plotAnswer=i=>state.tasks[i].answer;window.__plotType=i=>state.tasks[i].type;drawPlan();drawLegend();load();');
  const dom = new JSDOM(html, {
    url: 'https://mathexam.space/trainers/oge-1-5-trainers/practice-1-5-' + slug + '.html',
    resources: new Local(), runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: console,
    beforeParse(window) { window.scrollTo = () => {}; window.confirm = () => true; window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} }); window.requestAnimationFrame = () => 1; window.cancelAnimationFrame = () => {}; }
  });
  await new Promise(resolve => dom.window.addEventListener('load', resolve));
  await tick();
  assert.deepEqual(errors, []);
  return { dom, window: dom.window, doc: dom.window.document, errors };
}
function card(ctx, number) { return ctx.doc.querySelector('.pv-question[data-question="' + number + '"]'); }
function set(ctx, node, value) { node.value = String(value); node.dispatchEvent(new ctx.window.Event('input', { bubbles: true })); }
async function submit(ctx, number, value) {
  const host = card(ctx, number);
  set(ctx, host.querySelector('[data-pv-field="answer"]'), value);
  host.querySelector('form').dispatchEvent(new ctx.window.Event('submit', { bubbles: true, cancelable: true }));
  await tick();
  return host;
}
function choose(ctx, label, value) {
  const select = ctx.doc.querySelector('select[aria-label="' + label + '"]');
  assert.ok(select, label);
  select.value = String(value); select.dispatchEvent(new ctx.window.Event('change', { bubbles: true }));
}
function progress(ctx) { return JSON.stringify(Object.keys(ctx.window.localStorage).sort().map(key => [key, ctx.window.localStorage.getItem(key)])); }
function nativeAnswer(ctx, key) {
  const expr = {
    '1': 't1objs.map(objNum).join("")', '2.1': 'Math.ceil(roleCells("gost")/14)',
    '2.2': 'Math.ceil((roleCells("logK")+roleCells("logB"))/12)',
    '3.1': 'roleM2("kor")', '3.2': 'roleM2(biggerLoggia())', '3.x': 'm2Of(state.t3room)',
    '4.1': '(roleCells("logK")-roleCells("klad"))/roleCells("klad")*100',
    '4.2': '(roleCells("kuh")-roleCells("san"))/roleCells("san")*100',
    '4.x': '(cellsOf(state.t4A)-cellsOf(state.t4B))/cellsOf(state.t4B)*100',
    '5.1': 'Math.min(...WASH.filter(washPass).map(x=>total5(x.p,x.c,x.d)))',
    '5.2': 'Math.min(...NET.map(x=>netCost(1000,x)))',
    '5.3': 'Math.min(...STOVE.filter(stovePass).map(x=>total5(x.p,x.c,x.d)))'
  }[key];
  return ctx.window.eval(expr);
}

test('apartments: all 10 canonical and both generated types retain native grading on all three plans', async () => {
  const ctx = await open('apartments');
  try {
    assert.equal(ctx.doc.querySelectorAll('.pv-question').length, 5);
    assert.equal(ctx.doc.querySelector('body>.wrap').hidden, true);
    const counts = [10, 10, 10];
    for (let plan = 0; plan < 3; plan++) {
      if (plan) choose(ctx, 'План квартиры', plan);
      const figure = ctx.doc.querySelector('[data-pv-apartment-plan]');
      assert.equal(figure.dataset.pvApartmentPlan, String(plan));
      assert.doesNotMatch(figure.textContent, /санузел|коридор|кладовая|лоджия|гостиная|кухня|м²/);
      const figureBefore = figure.outerHTML;
      const groups = { 1: ['1'], 2: ['2.1', '2.2'], 3: ['3.1', '3.2'], 4: ['4.1', '4.2'], 5: ['5.1', '5.2', '5.3'] };
      for (const [group, keys] of Object.entries(groups)) for (const key of keys) {
        if (group !== '1') choose(ctx, 'Вариант задания ' + group, key);
        const host = await submit(ctx, group, nativeAnswer(ctx, key));
        assert.equal(host.dataset.result, 'correct', plan + ' ' + key + ': ' + host.querySelector('.pv-feedback').textContent);
        assert.doesNotMatch(host.querySelector('.pv-feedback').textContent, /<b>|<div/);
        assert.equal(figure.outerHTML, figureBefore, 'native check cannot overwrite persistent primary plan');
      }
      assert.equal(ctx.window.eval('CANON.filter(k=>state.solved.has(sk(k))).length'), counts[plan]);
      for (const group of [3, 4]) {
        const button = Array.from(card(ctx, group).querySelectorAll('button')).find(node => node.textContent === (group === 3 ? 'Другое помещение' : 'Другая пара помещений'));
        button.click();
        const key = group + '.x';
        assert.equal(card(ctx, group).dataset.pvBuildingType, key);
        assert.equal((await submit(ctx, group, nativeAnswer(ctx, key))).dataset.result, 'correct');
      }
    }
    assert.deepEqual(ctx.errors, []);
  } finally { ctx.dom.window.close(); }
});

test('apartments: persistent drafts, tables and help survive unrelated checks and subtype choices', async () => {
  const ctx = await open('apartments');
  try {
    const first = card(ctx, 1), third = card(ctx, 3), fifth = card(ctx, 5);
    set(ctx, third.querySelector('input'), '17,5');
    const table = fifth.querySelector('table');
    const before = progress(ctx);
    const toggle = third.querySelector('.pv-help-button'); toggle.click();
    const panel = third.querySelector('.pv-help-panel');
    const nested = panel.querySelector('details'); nested.open = true;
    panel.querySelector('.pd-return').click(); toggle.click();
    assert.equal(third.querySelector('input').value, '17,5');
    assert.equal(progress(ctx), before, 'help awards no credit');
    choose(ctx, 'Вариант задания 2', '2.2');
    assert.equal(card(ctx, 1), first);
    assert.equal(card(ctx, 3), third);
    assert.equal(card(ctx, 5).querySelector('table'), table);
    await submit(ctx, 1, nativeAnswer(ctx, '1'));
    assert.equal(third.querySelector('input').value, '17,5');
    assert.equal(panel.hidden, false);
    choose(ctx, 'Вариант задания 3', '3.2');
    choose(ctx, 'Вариант задания 3', '3.1');
    assert.equal(card(ctx, 3).querySelector('input').value, '17,5');
    assert.deepEqual(ctx.errors, []);
  } finally { ctx.dom.window.close(); }
});

test('land plots: seeded variants expose all five conditions and retain original first-attempt grading', async () => {
  const ctx = await open('land-plots');
  try {
    const seen = new Set();
    for (let variant = 0; variant < 18; variant++) {
      if (variant) Array.from(ctx.doc.querySelectorAll('.pv-controls button')).find(node => node.textContent === 'Новый вариант').click();
      assert.equal(ctx.doc.querySelectorAll('.pv-question').length, 5);
      const beforeFigure = ctx.doc.querySelector('[data-pv-plot-plan]').outerHTML;
      for (let number = 1; number <= 5; number++) {
        const host = card(ctx, number);
        seen.add(host.dataset.pvBuildingType + ':' + (number === 5 ? /краск|покрас/.test(host.textContent) ? 'paint' : 'heat' : number === 3 ? /площадка/.test(host.textContent) ? 'platform' : 'paths' : ''));
        const expected = ctx.window.__plotAnswer(number - 1);
        const checked = await submit(ctx, number, expected);
        assert.equal(checked.dataset.result, 'correct', 'variant ' + variant + ', question ' + number);
        assert.equal(checked.querySelector('input').disabled, true, 'native first-attempt answer is final');
        assert.equal(ctx.doc.querySelector('[data-pv-plot-plan]').outerHTML, beforeFigure);
      }
      const inset = card(ctx, 3).querySelector('.pv-platform-inset');
      if (inset) {
        assert.equal(inset.querySelectorAll('svg rect').length, 10);
        assert.match(inset.textContent, /отдельная схема/);
      }
    }
    for (const key of ['econ:paint', 'econ:heat', 'tiles:platform', 'tiles:paths']) assert.ok(seen.has(key), key);
    assert.deepEqual(ctx.errors, []);
  } finally { ctx.dom.window.close(); }
});

test('land plots: matching has descriptive givens, no visible answer legend and independent drafts', async () => {
  const ctx = await open('land-plots');
  try {
    assert.ok(ctx.doc.querySelector('.pv-condition .pv-land-description'));
    assert.doesNotMatch(ctx.doc.querySelector('.pv-condition').textContent, /дом\s*[→=]\s*1/);
    assert.equal(ctx.doc.querySelector('.pv-shell #legend'), null);
    const first = card(ctx, 1), second = card(ctx, 2);
    set(ctx, first.querySelector('input'), '1234');
    set(ctx, second.querySelector('input'), '7,5');
    const before = progress(ctx);
    first.querySelector('.pv-help-button').click();
    first.querySelector('.pd-return').click();
    assert.equal(first.querySelector('input').value, '1234');
    assert.equal(second.querySelector('input').value, '7,5');
    assert.equal(progress(ctx), before);
    await submit(ctx, 3, ctx.window.__plotAnswer(2));
    assert.equal(first.querySelector('input').value, '1234');
    assert.equal(second.querySelector('input').value, '7,5');
    const wrong = await submit(ctx, 1, '0000');
    assert.equal(wrong.dataset.result, 'incorrect');
    assert.equal(wrong.querySelector('input').disabled, true);
    assert.deepEqual(ctx.errors, []);
  } finally { ctx.dom.window.close(); }
});

test('building exact help stays optional, uses readable legend and fraction bars without filling answers', async () => {
  for (const slug of ['apartments', 'land-plots']) {
    const ctx = await open(slug);
    try {
      const host = card(ctx, slug === 'apartments' ? 4 : 1);
      const input = host.querySelector('input'); set(ctx, input, '17');
      const before = progress(ctx);
      host.querySelector('.pv-help-button').click();
      const exact = host.querySelector('.pv-native-help'); exact.open = true;
      await tick();
      if (slug === 'apartments') {
        const fraction = exact.querySelector('.pm-fraction'); assert.ok(fraction);
        assert.equal(fraction.children.length, 2);
      } else {
        assert.equal(exact.querySelectorAll('table tbody tr').length, 7);
        assert.equal(exact.querySelector('.legend'), null);
      }
      assert.equal(input.value, '17'); assert.equal(progress(ctx), before);
      assert.deepEqual(ctx.errors, []);
    } finally { ctx.dom.window.close(); }
  }
});
