#!/usr/bin/env node
/** Regressions for the mathematical findings in the OGE book v3 audit.
 *  Run: node --test tools/oge-book-v3-geometry.test.mjs
 *  Frozen v3: BOOK_PREFIX=book/oge/2026-11-16/v3/ node --test tools/oge-book-v3-geometry.test.mjs
 *  Requires jsdom (same dependency as oge-course-proof.test.cjs).
 *  No browser/network; VM checks math and JSDOM checks the decorated UI.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import { loadTrainer as loadTrainerAt, ROOT } from './oge-geometry-contract.lib.mjs';
import * as independent25 from './oge-geometry-contract.t25.mjs';

const { JSDOM, VirtualConsole } = createRequire(import.meta.url)('jsdom');
const BOOK_PREFIX = process.env.BOOK_PREFIX ?? '';
assert.ok(['', 'book/oge/2026-11-16/v3/'].includes(BOOK_PREFIX),
  'BOOK_PREFIX must be empty or exactly book/oge/2026-11-16/v3/');
const loadTrainer = relative => loadTrainerAt(BOOK_PREFIX + relative);

const json = (trainer, expression) => JSON.parse(trainer.run(`JSON.stringify(${expression})`));
const plain = value => String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const close = (actual, expected, message, tolerance = 1e-7) =>
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
    `${message}: ${actual} != ${expected}`);

test('16: the height diagnostic recognises 3r, including the radical', () => {
  const trainer = loadTrainer('trainers/oge-task16-circle.html');
  for (let k = 1; k <= 6; k++) {
    const task = json(trainer, `({answer:SUBS.eqR2aIn.calc({k:${k}}),diagnostics:SUBS.eqR2aIn.diag({k:${k}})})`);
    const radius = k * Math.sqrt(3);
    const height = 3 * radius; // centroid divides an equilateral altitude in ratio 2:1
    const side = height * 2 / Math.sqrt(3);
    close(task.answer, side, `k=${k}: side`);
    const heightHint = task.diagnostics.find(hint => /Это высота/.test(hint.m));
    assert.ok(heightHint, `k=${k}: height feedback is available`);
    close(heightHint.v, height, `k=${k}: the number labelled as height`);
    assert.ok(Math.abs(heightHint.v - 3 * k) > 1, 'a missing radical is not called the height');
  }
});

test('24: each t20 highlighted angle has the vertex and size named in the proof', () => {
  const trainer = loadTrainer('trainers/oge-task24-proofs.html');
  const { task, figure } = json(trainer, '({task:byId.t20,figure:FIGS.f20})');
  const namedAngles = [
    { vertex:'B', ends:['A','C'], degrees:120 },
    { vertex:'C', ends:['B','A'], degrees:30 },
    { vertex:'C', ends:['B','D'], degrees:120 },
    { vertex:'C', ends:['A','D'], degrees:90 },
  ];
  task.steps.forEach((step, index) => {
    const [vertex, a, b] = step.lit.ang[0];
    const expected = namedAngles[index];
    assert.equal(vertex, expected.vertex, `step ${index + 1}: vertex`);
    assert.deepEqual([a,b].sort(), expected.ends.slice().sort(), `step ${index + 1}: rays`);
    const [vx,vy] = figure.pts[vertex], [ax,ay] = figure.pts[a], [bx,by] = figure.pts[b];
    const u = [ax-vx,ay-vy], v = [bx-vx,by-vy];
    const angle = Math.atan2(Math.abs(u[0]*v[1]-u[1]*v[0]),u[0]*v[0]+u[1]*v[1])*180/Math.PI;
    assert.ok(Math.abs(angle - expected.degrees) < 0.01,
      `step ${index + 1}: highlighted ${angle}°, expected ${expected.degrees}°`);
  });
});

test('25 type15: all ten tasks have exact school arithmetic and preserve their answer contract', () => {
  const trainer = loadTrainer('trainers/oge-task25-geometry.html');
  const cases = json(trainer, 'byId(15).pool.map(p=>({p,b:byId(15).build(p)}))');
  const expectedAreas = [168,1008,924,720,420,1120,1320,728,806.4,520];
  assert.equal(cases.length, expectedAreas.length);
  cases.forEach(({p,b}, index) => {
    // The existing independent solver constructs a circle and both parallel
    // lines from distances, then measures the polygon area by coordinates.
    const measured = independent25.solve[15](p).S;
    close(measured, expectedAreas[index], `case ${p}: independent geometry`);
    close(b.ans[0].v, measured, `case ${p}: final answer`);
    assert.equal(b.ans[0].label, 'S');
    assert.deepEqual(b.geo, {dA:p[0],dAD:p[1],r:p[2]});
    assert.equal(b.steps.length, 4, 'saved step indices remain stable');
    assert.deepEqual(b.steps.map((step,i) => step.ask ? i : null).filter(i => i !== null), [3]);
    const explanation = plain(b.steps.map(step => step.h+' '+step.why+' '+(step.ask?.q || '')).join(' '));
    assert.doesNotMatch(explanation, /ctg|котангенс|arcsin|∠[A-Z]+\s*≈/i,
      'student does not calculate arbitrary angles or cotangents');
    assert.match(explanation, /касани|касательн/);
    assert.match(explanation, /полупериметр/);
    assert.match(explanation, /BC/);
    const typed = String(expectedAreas[index]).replace('.', ',');
    assert.equal(trainer.run(`finalAnswerEq(parseNum(${JSON.stringify(typed)}),byId(15).build(${JSON.stringify(p)}).ans[0].v)`), true);
    assert.equal(trainer.run(`finalAnswerEq(parseNum(${JSON.stringify(typed)}),byId(15).build(${JSON.stringify(p)}).steps[3].ask.v)`), true);
  });
  assert.equal(trainer.run('finalAnswerEq(167.71,byId(15).build([5,4,3]).ans[0].v)'), false);
  assert.equal(trainer.run('finalAnswerEq(1312.07,byId(15).build([13,6,5]).ans[0].v)'), false);
  const reference = json(trainer, '({key:byId(15).refKey,why:byId(15).refWhy,notSheet:byId(15).notSheet})');
  assert.doesNotMatch(plain(Object.values(reference).join(' ')), /ctg|котангенс|arcsin/i);
});

test('25 type13: angle-bisector theorem supplies the previously missing inference', () => {
  const trainer = loadTrainer('trainers/oge-task25-geometry.html');
  const cases = json(trainer, 'byId(13).pool.map(p=>({p,b:byId(13).build(p)}))');
  for (const {p,b} of cases) {
    close(b.ans[0].v, independent25.solve[13](p).R, `case ${p}: circumradius`);
    assert.equal(b.steps.length, 4);
    const reason = plain(b.steps[0].h+' '+b.steps[1].h+' '+b.steps[1].why);
    assert.match(reason, /теорем[аеыу] о биссектрисе/i);
    assert.match(reason, /BK/);
    assert.match(reason, /KH/);
    assert.match(reason, /AB/);
    assert.match(reason, /AH/);
    assert.doesNotMatch(reason, /после упрощения/);
    close(b.steps[1].ask.v, p[1]/p[0], `case ${p}: cosine`);
  }
});

test('25: the actual proof wrapper keeps the new explanation and its relevant theory', async () => {
  const errors = [], console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  const html = fs.readFileSync(path.join(ROOT, BOOK_PREFIX, 'trainers/oge-task25-geometry.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true,
    url:'https://mathexam.space/' + BOOK_PREFIX + 'trainers/oge-task25-geometry.html', virtualConsole:console });
  const window = dom.window;
  try {
    await new Promise(resolve => window.addEventListener('load', resolve, {once:true}));
    for (const file of ['task19-textbook-data.js','task19-reference.js','oge-course-reference.js','oge-course-proof.js']) {
      window.eval(fs.readFileSync(path.join(ROOT, BOOK_PREFIX, 'trainers', file), 'utf8'));
    }
    for (const p of window.eval('byId(15).pool')) {
      window.eval(`newTrainTask(15);trS.p=${JSON.stringify(p)};trS.b=byId(15).build(trS.p);
        trS.gmode=true;trS.gstep=3;trS.gres[3]='ok';renderTrain();`);
      window.OgeCourseProof.decorate();
      const guide = window.document.querySelector('.gsteps');
      assert.ok(guide);
      assert.doesNotMatch(guide.textContent, /ctg|котангенс|arcsin/i,
        'an additive wrapper must not restore the obsolete cotangent explanation');
      const reasons = [...guide.querySelectorAll('.ocp-step-reason > p')].map(node => node.textContent);
      assert.equal(reasons.length, 4);
      assert.match(reasons[3], /BC/);
      assert.match(reasons[3], /высот/);
      assert.ok(guide.querySelector('[data-topic="tangent"]'));
      assert.ok(guide.querySelector('[data-topic="incircle_area"]'));
      assert.ok(guide.querySelector('[data-topic="parallelogram_area"]'));
      assert.equal(guide.querySelector('[data-topic="trigonometry"]'), null);
    }
    window.eval("newTrainTask(13);trS.gmode=true;trS.gstep=1;trS.gres[1]='ok';renderTrain();");
    window.OgeCourseProof.decorate();
    const guide = window.document.querySelector('.gsteps');
    assert.equal(guide.querySelector('[data-topic="angle_bisector_locus"]'), null);
    assert.ok(guide.querySelector('[data-topic="bisector_length"]'),
      'the existing derived reference explains the angle-bisector side ratio');
    assert.deepEqual(errors, []);
  } finally {
    window.OgeCourseProof?.dispose();
    window.close();
  }
});
