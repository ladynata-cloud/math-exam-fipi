'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const coverage = require('../trainers/oge-sources/coverage-23-25.json');
const { loadTrainer, makeStorage, KEY, ROOT } = require('./oge-geometry-contract.lib.mjs');
const slugs = {
  23: 'oge-task23-geometry-calculations',
  24: 'oge-task24-proofs',
  25: 'oge-task25-geometry',
};

function trainer(number, settings) {
  return loadTrainer('trainers/' + slugs[number] + '.html', settings);
}

function get(engine, expression) {
  return JSON.parse(engine.run('JSON.stringify(' + expression + ')'));
}

test('source comparison names the read corpus and distinguishes exact gaps', () => {
  assert.equal(coverage.checkedOn, '2026-11-17');
  assert.deepEqual(coverage.comparison.filter(row => row.result === 'authored').map(row => row.number), [23, 24, 25]);
  assert.ok(coverage.comparison.some(row => row.result === 'gap' && row.source === 'yashchenko2027v17'));
  for (const row of coverage.comparison) {
    const source = coverage.sources[row.source];
    assert.match(source.url, /^https:\/\//);
    assert.ok(source.access && row.skill && source.locator && row.format);
  }
});

test('№23: new fixed card and original generator avoid the official numerical example', () => {
  const engine = trainer(23, {seed: 20261117});
  const bank = get(engine, 'ARCHIVE');
  assert.equal(bank.length, 150);
  assert.equal(bank[20].id, 'q021');
  assert.equal(bank[21].id, 'q022-v2');
  assert.equal(bank[22].id, 'q023');
  assert.deepEqual(bank[21].p, {AF: 36, BF: 27});
  assert.equal(36 ** 2 + 27 ** 2, 45 ** 2);
  assert.equal(bank[21].exp, 45);
  const candidates = bank.filter(row => row.sub === 'trapBis').map(row => row.p)
    .concat(get(engine, 'Array.from({length:800},()=>SUBS.trapBis.gen())'));
  for (const {AF, BF} of candidates) {
    assert.notDeepEqual([AF, BF].sort((a, b) => a - b), [5, 12]);
    assert.equal(engine.run('SUBS.trapBis.fig({AF:' + AF + ',BF:' + BF + '}).chk.every(row=>row.ok)'), true);
  }
});

test('№24: real secants, correct correspondence and independent completion for the new statement', () => {
  const record = {'oge24-dokazatelstva':{updatedAt:1, solved:{t10:true}, solvedByType:{t10:7}}};
  const storage = makeStorage(new Map([[KEY, JSON.stringify(record)]]));
  const engine = trainer(24, {storage});
  const task = get(engine, 'byId.t10');
  const { pts, circ } = get(engine, 'FIGS.f10');
  assert.equal(task.revision, 'v2');
  assert.match(task.prove, /KA · KD = KB · KC/);
  assert.match(task.steps.at(-1).t, /KA\/KC = KB\/KD/);

  const dist = (a, b) => Math.hypot(a[0]-b[0], a[1]-b[1]);
  const cross = (o, a, b) => (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const close = (x, y) => assert.ok(Math.abs(x-y)<1e-6, x + ' ≠ ' + y);
  const {A, B, C, D, K} = pts;
  for (const p of [A, B, C, D]) close(dist(circ[0].c, p), circ[0].r);
  close(cross(K, A, D), 0);
  close(cross(K, B, C), 0);
  assert.ok(dist(K,A)<dist(K,D) && dist(K,B)<dist(K,C));
  close(dist(K,A)/dist(K,C), dist(K,B)/dist(K,D));
  close(dist(K,A)*dist(K,D), dist(K,B)*dist(K,C));
  assert.equal(engine.run('proofInstanceId(byId.t10)'), 't10-v2');
  assert.equal(engine.run('STORE[TID].solved[proofInstanceId(byId.t10)]'), undefined);
  engine.run('startStudy("t10"); for(let i=0;i<curTask().steps.length;i++)pickCard({type:"s",i});');
  assert.deepEqual(get(engine, 'STORE[TID].solved'), {t10:true, 't10-v2':true});
  assert.equal(get(engine, 'CP.readAll()[TID].solvedByType.t10'), 8);
});

test('№25: oblique trapezoid gives height 24 and area 360 with consistent labels', () => {
  const engine = trainer(25);
  const pool = get(engine, 'byId(3).pool');
  assert.ok(!pool.some(row => String(row) === '16,34,2'));
  assert.ok(pool.some(row => String(row) === '26,30,1'));
  const {ans, geo} = get(engine, 'byId(3).build([26,30,1])');
  assert.equal(26**2, 10**2+24**2);
  assert.equal(30**2, 18**2+24**2);
  assert.equal(geo.AD, 29);
  assert.equal(geo.h, 24);
  assert.equal(ans[0].v, (29+1)*24/2);
  const drawing = engine.run('byId(3).draw([26,30,1])');
  for (const label of ['M', 'N', 'H₁', 'H₂', '26', '30']) assert.ok(drawing.includes('>'+label+'</text>'), label);
});

test('all three existing downloadable ZIPs contain the matching standalone HTML', () => {
  const originalEvidence = {
    23: 'rows:[[24,10,26],[36,27,45,\'v2\']',
    24: 'KA · KD = KB · KC',
    25: '[26,30,1]',
  };
  for (const [number, slug] of Object.entries(slugs)) {
    const home = path.join(ROOT, 'downloads', 'trainers', slug);
    const html = readFileSync(path.join(home, slug+'.html'));
    const packed = execFileSync('unzip', ['-p', path.join(home, slug+'-package.zip'), slug+'.html'], {maxBuffer:html.length + 1024});
    assert.deepEqual(packed, html);
    assert.ok(html.includes(originalEvidence[number]));
  }
});
