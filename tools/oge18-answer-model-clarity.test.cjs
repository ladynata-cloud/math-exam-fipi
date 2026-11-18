'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const BASE = '35e718ca74852857a86dfe9dcc68d091ce165308';
const ROUTE = 'trainers/oge-task18-grid.html';
const KEY = 'mathExamCourseProgress.v1';
const TARGETS = ['segCmp', 'areaPar', 'circRatio'];
const baseline = (file, ref = BASE) => execFileSync('git', ['show', `${ref}:${file}`], { cwd: ROOT });
const thematicGeometry = require('./fixtures/oge-source-alignment-geometry-bytes.json');
const modules = Promise.all([
  import(pathToFileURL(path.join(__dirname, 'oge-geometry-contract.lib.mjs')).href),
  import(pathToFileURL(path.join(__dirname, 'oge-geometry-contract.t18.mjs')).href),
]);
const plain = value => JSON.parse(JSON.stringify(value));

class LocalResources extends ResourceLoader {
  fetch(url) {
    const parsed = new URL(url);
    if (parsed.origin !== 'https://mathexam.space') return null;
    const file = path.resolve(ROOT, '.' + parsed.pathname);
    if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file)) return null;
    return Promise.resolve(fs.readFileSync(file));
  }
}

async function load(number = 18, search = '') {
  const route = `trainers/oge-task${number}-${{16:'circle',17:'quadrilaterals',18:'grid'}[number]}.html`;
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, route), 'utf8'), {
    url: 'https://mathexam.space/' + route + search,
    runScripts: 'dangerously', resources: new LocalResources(), pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      window.localStorage.setItem(KEY, JSON.stringify({
        'unrelated-trainer': { solvedByType: { keep: 17 }, note: 'synthetic sentinel' },
      }));
      window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    },
  });
  await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
  assert.deepEqual(errors, [], 'page loads without uncaught errors');
  return { dom, w: dom.window, d: dom.window.document, errors };
}

function choose(window, fixture) {
  const expression = fixture.id != null
    ? `archTask(ARCHIVE.find(record=>record.id===${fixture.id}))`
    : `build(${JSON.stringify(fixture.sub)},${JSON.stringify(fixture.p)},{})`;
  window.eval(`TR.task=${expression}; TR.done=false; TR.shown=false; TR.hintUsed=false; TR.missed=false; drawTrain();`);
  return plain(window.eval('({sub:TR.task.sub,p:TR.task.p,answer:TR.task.ans,text:TR.task.text,steps:TR.task.sol.length})'));
}

function type(window, document, value) {
  const input = document.querySelector('#ansIn');
  input.value = value;
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  return input;
}
const progress = window => JSON.parse(window.localStorage.getItem(KEY) || '{}');
const successes = (window, family) => progress(window)['oge18-kletki']?.solvedByType?.[family] || 0;
const mistaken = (window, family) => progress(window).mistakes?.['oge18-kletki|' + family]?.w || 0;
const polygonPoints = element => element.getAttribute('points').trim().split(/\s+/).map(point => point.split(',').map(Number));
function polygonArea(points) {
  return Math.abs(points.reduce((area, p, i) => {
    const next = points[(i + 1) % points.length];
    return area + (next[0] - p[0]) * (next[1] + p[1]) / 2;
  }, 0));
}
const lineVector = line => ['x','y'].map(axis => +line.getAttribute(axis+'2') - +line.getAttribute(axis+'1'));
const length = line => Math.hypot(...lineVector(line));
function close(actual, expected, message) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= 1e-6 * Math.max(1, Math.abs(expected)), `${message}: ${actual} != ${expected}`);
}

test('all 123 archived tasks, 15 generators, numerical answers and conditions retain the approved base', async () => {
  const [{ loadTrainer, mulberry32 }, { solve, validity }] = await modules;
  const current = loadTrainer(ROUTE);
  const original = loadTrainer(ROUTE, { html: baseline(ROUTE).toString('utf8') });
  const snapshot = '({ids:TYPE_IDS,archive:ARCHIVE,functions:SUBKEYS.map(key=>({key,text:SUBS[key].text.toString(),calc:SUBS[key].calc.toString(),gen:SUBS[key].gen.toString()}))})';
  assert.deepEqual(plain(current.run(snapshot)), plain(original.run(snapshot)));
  const records = plain(current.run('ARCHIVE'));
  const keys = plain(current.run('SUBKEYS'));
  assert.equal(records.length, 123);
  assert.equal(keys.length, 15);
  for (const record of records) {
    assert.equal(validity(record.sub, record.p), '', `archive ${record.id}`);
    close(solve[record.sub](record.p), record.exp, `independent archive ${record.id}`);
  }
  for (const [index, key] of keys.entries()) {
    current.ctx.Math.random = mulberry32(7000 + index);
    original.ctx.Math.random = mulberry32(7000 + index);
    for (let trial = 0; trial < 32; trial++) {
      const expression = `SUBS[${JSON.stringify(key)}].gen()`;
      const p = plain(current.run(expression));
      assert.deepEqual(p, plain(original.run(expression)), `${key}, trial ${trial}`);
      assert.equal(validity(key, p), '', `${key}, trial ${trial}`);
      current.ctx.testParams = p;
      close(current.run(`SUBS[${JSON.stringify(key)}].calc(testParams)`), solve[key](p), `${key}, trial ${trial}`);
    }
  }
});

test('new task diagrams measure the same segments, perpendicular height and circles at narrow and wide widths', async () => {
  const [{ loadTrainer, mulberry32 }, { solve }] = await modules;
  const vm = loadTrainer(ROUTE);
  const records = plain(vm.run('ARCHIVE.filter(record=>["segCmp","areaPar","circRatio"].includes(record.sub))'));
  vm.ctx.Math.random = mulberry32(180016);
  for (const family of TARGETS) for (let i = 0; i < 24; i++) {
    records.push({ sub: family, p: plain(vm.run(`SUBS[${JSON.stringify(family)}].gen()`)) });
  }
  const parsing = new JSDOM('');
  const container = parsing.window.document.createElement('div');
  try {
    for (const record of records) {
      vm.ctx.testParams = record.p;
      vm.ctx.testTask = vm.run(`build(${JSON.stringify(record.sub)},testParams,{})`);
      assert.equal(vm.run('Oge18TaskDiagram.supports(testTask)'), true);
      assert.equal(vm.run('Oge18TaskDiagram.steps(testTask).length'), record.sub === 'circRatio' ? 3 : 2);
      for (const width of [240, 280, 640]) for (const step of [0, 1, 2, 3]) {
        const output = vm.run(`Oge18TaskDiagram.render(testTask,${step},${width})`);
        assert.doesNotMatch(output, /NaN|undefined|Infinity/, `${record.sub} ${record.p}`);
        container.innerHTML = output;
        const svg = container.querySelector('svg');
        assert.ok(svg, record.sub);
        assert.equal(svg.getAttribute('data-task-kind'), record.sub);
        const unit = +svg.getAttribute('data-unit');
        assert.ok(Number.isFinite(unit) && unit > 0);
        const role = name => svg.querySelector(`[data-oge18-role="${name}"]`);
        if (record.sub === 'areaPar') {
          close(polygonArea(polygonPoints(role('shape'))) / unit ** 2, solve.areaPar(record.p), 'drawn parallelogram area');
          if (step >= 1) {
            close(length(role('base')) / unit, record.p[0], 'base uses task cells');
            close(length(role('height')) / unit, record.p[1], 'height uses task cells');
            const baseVector = lineVector(role('base')), heightVector = lineVector(role('height'));
            close(baseVector[0]*heightVector[0]+baseVector[1]*heightVector[1], 0, 'height is perpendicular');
          }
          if (step >= 2) {
            const rectangle = role('area-rectangle');
            assert.ok(rectangle, 'the transformed rectangle is shown');
            close(+rectangle.getAttribute('width') * +rectangle.getAttribute('height') / unit ** 2,
              solve.areaPar(record.p), 'rearranging preserves area');
          }
        } else if (record.sub === 'segCmp' && step >= 1) {
          close(length(role('seg-am')) / unit, record.p[0], 'AM length');
          close(length(role('seg-mc')) / unit, record.p[1], 'MC length');
          close(length(role('seg-mc')) / length(role('seg-am')), solve.segCmp(record.p), 'drawn length ratio');
        } else if (record.sub === 'circRatio') {
          const smallRadius = +role('small-circle').getAttribute('r');
          const largeRadius = +role('large-circle').getAttribute('r');
          close(smallRadius ** 2 / unit ** 2, record.p[0], 'small squared radius');
          close(largeRadius ** 2 / unit ** 2, record.p[1], 'large squared radius');
          close(Math.PI * largeRadius ** 2 / (Math.PI * smallRadius ** 2), solve.circRatio(record.p), 'drawn circle area ratio');
          if (step >= 1) {
            close(length(role('small-radius')), smallRadius, 'small drawn radius reaches its circle');
            close(length(role('large-radius')), largeRadius, 'large drawn radius reaches its circle');
          }
        }
      }
    }
  } finally { parsing.window.close(); }
});

test('parallelogram 7 by 3 rejects 35 and accepts 21; foreign model is hidden and entered answer survives help', async () => {
  const { dom, w, d } = await load();
  try {
    const task = choose(w, { id: 76 });
    assert.deepEqual(task.p, [7, 3, 4]);
    assert.equal(task.answer, 21);
    const input = type(w, d, '35');
    d.querySelector('#chkBtn').click();
    assert.ok(d.querySelector('#fb').classList.contains('err'));
    assert.equal(mistaken(w, 'areaPar'), 1);
    d.querySelector('#courseHintToggle').click();
    const legacyModel = d.querySelector('[data-geometry-model]');
    assert.ok(legacyModel.closest('[hidden][aria-hidden="true"]'), 'legacy board model is absent from the visible UI and accessibility tree');
    assert.ok(d.querySelector('.figwrap[data-oge18-task-diagram]'));
    const before = d.querySelector('.figwrap svg').outerHTML;
    d.querySelector('#hintBtn').click();
    assert.notEqual(d.querySelector('.figwrap svg').outerHTML, before, 'actual task figure changes');
    assert.equal(input.value, '35');
    assert.match(d.querySelector('#task18Steps').textContent, /7/);
    assert.match(d.querySelector('#task18Steps').textContent, /3/);
    type(w, d, '21');
    d.querySelector('#chkBtn').click();
    assert.match(d.querySelector('#fb').textContent, /Верно/);
    assert.equal(successes(w, 'areaPar'), 0, 'helped answer is not independent credit');
    assert.ok(input.disabled);
    assert.match(d.querySelector('#answerState').textContent, /Ответ принят/);
    assert.ok((input.getAttribute('aria-describedby') || '').split(/\s+/).includes('answerState'));
    d.querySelector('#chkBtn').click();
    assert.equal(successes(w, 'areaPar'), 0);
    assert.deepEqual(progress(w)['unrelated-trainer'], { solvedByType: { keep: 17 }, note: 'synthetic sentinel' });
  } finally { dom.window.close(); }
});

for (const fixture of [
  { id: 91, answer: '3', family: 'segCmp', stepCount: 2 },
  { sub: 'circRatio', p: [1,16], answer: '16', family: 'circRatio', stepCount: 3 },
  { sub: 'circRatio', p: [2,5], answer: '2,5', family: 'circRatio', stepCount: 3 },
]) test(`same-task steps retain work and do not close or independently credit ${fixture.family} ${fixture.id || fixture.p}`, async () => {
  const { dom, w, d } = await load();
  try {
    choose(w, fixture);
    const input = type(w, d, '123,45');
    const prompt = d.querySelector('label[for="ansIn"]');
    assert.match(prompt.textContent, /[Вв]о сколько раз/);
    assert.doesNotMatch(prompt.textContent, /в единицах условия/);
    assert.match(d.querySelector('.oge18-source-note').textContent, /аналог|подготовительн/i);
    d.querySelector('#courseHintToggle').click();
    for (let step = 1; step <= fixture.stepCount; step++) {
      d.querySelector('#hintBtn').click();
      assert.equal(d.querySelectorAll('#task18Steps .step').length, step);
      assert.equal(input.value, '123,45');
      assert.equal(input.disabled, false, 'reading steps leaves answer entry available');
    }
    assert.equal(d.querySelector('#hintBtn').disabled, true);
    d.querySelector('#courseHintToggle').click();
    d.querySelector('#courseHintToggle').click();
    assert.equal(d.querySelectorAll('#task18Steps .step').length, fixture.stepCount);
    assert.equal(input.value, '123,45');
    type(w, d, fixture.answer);
    d.querySelector('#chkBtn').click();
    assert.match(d.querySelector('#fb').textContent, /Верно/);
    assert.equal(successes(w, fixture.family), 0);
  } finally { dom.window.close(); }
});

test('segment settings shortcut opens its own division rule without replacing the task or losing assistance', async () => {
  const { dom, w, d, errors } = await load();
  try {
    choose(w, { id: 91 });
    const task = w.eval('TR.task');
    const input = type(w, d, '1,5');
    const before = progress(w);
    const shortcut = d.querySelector('#courseSettings [data-act="ref"]');
    assert.ok(shortcut, 'the settings shortcut remains available');
    assert.equal(d.querySelector('#main').contains(shortcut), false, 'exercise the shortcut outside the main click handler');
    assert.match(shortcut.textContent, /Правило для этой задачи/);
    shortcut.click();
    assert.equal(w.eval('TR.task'), task, 'opening the rule keeps the actual task');
    assert.equal(d.querySelector('#ansIn'), input, 'the task form is retained');
    assert.equal(input.value, '1,5');
    const panel = d.querySelector('#courseHintPanel');
    assert.equal(panel.hidden, false);
    const rule = [...panel.querySelectorAll('details')].find(node =>
      /Правило для этой задачи/.test(node.querySelector('summary')?.textContent || ''));
    assert.ok(rule?.open, 'the task rule opens directly');
    assert.match(rule.textContent, /отношение длин/);
    assert.match(rule.textContent, /отрезка.*клетками.*одной линии/);
    assert.doesNotMatch(rule.textContent, /Пифагор/i);
    assert.equal(d.activeElement, rule.querySelector('summary'), 'keyboard focus follows the opened rule');
    assert.equal(w.OgeGeometryHelpUsed, true);
    assert.deepEqual(progress(w), before, 'opening the rule does not grade');
    d.querySelector('#courseHintToggle').click();
    assert.equal(panel.hidden, true);
    assert.equal(w.OgeGeometryHelpUsed, true, 'closing the rule does not erase assistance');
    assert.equal(input.value, '1,5');
    type(w, d, '3');
    d.querySelector('#chkBtn').click();
    assert.match(d.querySelector('#fb').textContent, /Верно.*подсказк/);
    assert.equal(successes(w, 'segCmp'), 0, 'the assisted answer is not independent credit');
    assert.equal(mistaken(w, 'segCmp'), 0);
    assert.deepEqual(errors, []);
  } finally { dom.window.close(); }
});

test('empty or malformed input is not a mathematics failure; comma and fractional answers remain accepted once', async () => {
  const { dom, w, d } = await load();
  try {
    choose(w, { id: 97 });
    for (const value of ['', 'abc', '1/0', '1,2,3']) {
      type(w, d, value);
      d.querySelector('#chkBtn').click();
      assert.ok(d.querySelector('#fb').classList.contains('warn'), value);
      assert.equal(mistaken(w, 'segCmp'), 0);
      assert.equal(successes(w, 'segCmp'), 0);
      assert.equal(d.querySelector('#ansIn').disabled, false);
    }
    type(w, d, '3/2');
    d.querySelector('#ansIn').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    assert.match(d.querySelector('#fb').textContent, /Верно/);
    assert.equal(successes(w, 'segCmp'), 1);
    d.querySelector('#chkBtn').click();
    assert.equal(successes(w, 'segCmp'), 1, 'duplicate completion is inert');
    choose(w, { id: 98 });
    type(w, d, '1,5');
    d.querySelector('#chkBtn').click();
    assert.match(d.querySelector('#fb').textContent, /Верно/);
    assert.equal(successes(w, 'segCmp'), 2);
  } finally { dom.window.close(); }
});

test('opening the full solution explains the disabled answer and changing numbers does not copy an old draft', async () => {
  const { dom, w, d } = await load();
  try {
    choose(w, { id: 76 });
    type(w, d, '35');
    d.querySelector('#courseHintToggle').click();
    d.querySelector('#giveBtn').click();
    assert.ok(d.querySelector('#ansIn').disabled);
    assert.ok(d.querySelector('#chkBtn').disabled);
    assert.match(d.querySelector('#answerState').textContent, /Решение открыто/);
    assert.equal(successes(w, 'areaPar'), 0);
    choose(w, { id: 77 });
    assert.equal(d.querySelector('#ansIn').value, '', 'same wording with different parameters is a different task');
    assert.equal(d.querySelector('#ansIn').disabled, false);
    assert.equal(d.querySelector('#chkBtn').disabled, false);
    assert.equal(d.querySelectorAll('#task18Steps .step').length, 0);
    assert.equal(d.querySelector('#courseHintPanel').hidden, true);
    assert.deepEqual(progress(w)['unrelated-trainer'], { solvedByType: { keep: 17 }, note: 'synthetic sentinel' });
  } finally { dom.window.close(); }
});

for (const fixture of [
  { id: 91, family: 'segCmp', steps: 2 },
  { id: 76, family: 'areaPar', steps: 2 },
  { id: 103, family: 'circRatio', steps: 3 },
]) test(`board peers replay full solution followed by post-completion hints for ${fixture.family}`, async () => {
  const source = await load(18, '?board=1');
  const peer = await load(18, '?board=1');
  const tick = () => new Promise(resolve => setTimeout(resolve, 0));
  try {
    const sourceProgress = progress(source.w), peerProgress = progress(peer.w);
    source.w.OgeLearningNative.start({
      key: fixture.family, source: 'archive',
      value: source.w.eval(`ARCHIVE.findIndex(record=>record.id===${fixture.id})`),
    });
    type(source.w, source.d, '777');
    source.d.querySelector('#courseHintToggle').click();
    source.d.querySelector('#giveBtn').click();
    await tick();

    async function restoreAndCompare(revealed) {
      const packet = source.w.OgeGeometryBoard.getState();
      assert.deepEqual(plain(packet.actions.map(action => action[0])), ['give', ...Array(revealed).fill('first')]);
      assert.equal(packet.answer, '777');
      assert.equal(packet.helpUsed, true);
      const incoming = peer.w.JSON.parse(JSON.stringify(packet));
      assert.equal(peer.w.OgeGeometryBoard.validateState(incoming), true, 'native post-completion hint history remains valid');
      peer.w.OgeGeometryBoard.applyState(incoming);
      await tick();
      assert.deepEqual(plain(peer.w.OgeGeometryBoard.getState()), plain(packet), 'wire state round-trips unchanged');
      for (const view of [source, peer]) {
        assert.equal(view.d.querySelector('#ansIn').value, '777');
        assert.equal(view.d.querySelector('#ansIn').disabled, true);
        assert.equal(view.d.querySelector('#chkBtn').disabled, true);
        assert.match(view.d.querySelector('#answerState').textContent, /Решение открыто/);
        assert.equal(view.d.querySelectorAll('#task18Steps .step').length, revealed);
        assert.equal(view.d.querySelectorAll('#solBox .step').length, fixture.steps);
        assert.equal(view.d.querySelector('.figwrap svg').getAttribute('data-task-kind'), fixture.family);
      }
      assert.equal(peer.d.querySelector('.figwrap svg').outerHTML, source.d.querySelector('.figwrap svg').outerHTML, 'both peers show the same task drawing');
      assert.equal(peer.d.querySelector('#solBox').textContent, source.d.querySelector('#solBox').textContent);
      assert.equal(peer.d.querySelector('#task18Steps').textContent, source.d.querySelector('#task18Steps').textContent);
      return packet;
    }

    const completed = await restoreAndCompare(0);
    source.d.querySelector('#giveBtn').click();
    source.d.querySelector('#chkBtn').click();
    await tick();
    assert.deepEqual(plain(source.w.OgeGeometryBoard.getState()), plain(completed), 'disabled completion controls do not append actions');
    for (let revealed = 1; revealed <= fixture.steps; revealed++) {
      source.d.querySelector('#hintBtn').click();
      await tick();
      await restoreAndCompare(revealed);
    }
    assert.equal(source.d.querySelector('#hintBtn').disabled, true);
    assert.equal(peer.d.querySelector('#hintBtn').disabled, true);
    assert.deepEqual(progress(source.w), sourceProgress, 'room replay does not write personal progress');
    assert.deepEqual(progress(peer.w), peerProgress);
    assert.deepEqual(source.errors, []);
    assert.deepEqual(peer.errors, []);
  } finally { source.dom.window.close(); peer.dom.window.close(); }
});

test('task16/17 retain exact reviewed thematic HTML and visible independent discoveries', async () => {
  for (const number of [16,17]) {
    const route = `trainers/oge-task${number}-${number === 16 ? 'circle' : 'quadrilaterals'}.html`;
    assert.deepEqual(fs.readFileSync(path.join(ROOT, route)), baseline(route, thematicGeometry.sourceCommit));
    const { dom, d } = await load(number);
    try {
      d.querySelector('#courseHintToggle').click();
      const model = d.querySelector('[data-geometry-model]');
      assert.ok(model && !model.hidden);
      assert.notEqual(model.getAttribute('aria-hidden'), 'true');
      assert.ok(model.querySelector('input[type="range"]'));
    } finally { dom.window.close(); }
  }
});
