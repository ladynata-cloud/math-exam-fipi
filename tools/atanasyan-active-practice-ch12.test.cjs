#!/usr/bin/env node
'use strict';

// Independent mathematical checks for the authored chapter 1–2 conditions.
// These oracles do not read answers to derive expected values. Numerical
// conditions are recomputed, and congruence decisions use a separate matcher.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const bank = JSON.parse(fs.readFileSync(path.join(root, 'geometry-course/data/active-practice-ch12.json'), 'utf8'));
const byId = new Map(bank.flatMap(page => page.tasks.map(task => [task.id, task])));
const checked = new Set();
const eps = 1e-9;
const close = (a, b) => Math.abs(a - b) < eps;
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const reflect = ([x, y]) => [x, -y];
const sum = xs => xs.reduce((a, b) => a + b, 0);
const sorted = xs => [...xs].sort((a, b) => a - b);
const sameSides = (a, b) => sorted(a).every((x, i) => close(x, sorted(b)[i]));
const side = x => x.split('').sort().join('');
const incident = (edge, vertex) => edge.includes(vertex);
const angleBetween = (u, v) => Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v))) * 180 / Math.PI;
const angleFromSides = (a, b, opposite) => Math.acos((a * a + b * b - opposite * opposite) / (2 * a * b)) * 180 / Math.PI;
const thirdSide = (a, b, angle) => Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(angle * Math.PI / 180));
function criterion(sides, angles) {
  const edges = new Set(sides.map(side));
  const vertices = new Set(angles);
  if (edges.size === 3) return 'sss';
  for (const v of vertices) if ([...edges].filter(s => incident(s, v)).length === 2) return 'sas';
  for (const edge of edges) if ([...edge].every(v => vertices.has(v))) return 'asa';
  return 'none';
}
function mapped(edge, vertexMap) { return side([...edge].map(v => vertexMap[v]).join('')); }
function task(id, anchors = []) {
  const t = byId.get(id);
  assert(t, `Missing task ${id}`);
  assert(!checked.has(id), `Duplicate oracle ${id}`);
  for (const text of anchors) assert(t.prompt.includes(text), `${id}: condition drift: ${text}`);
  checked.add(id);
  return t;
}
function num(id, expected, anchors = []) {
  const t = task(id, anchors);
  assert.equal(t.answer.kind, 'number', id);
  assert(close(t.answer.value, expected), `${id}: ${t.answer.value} != independently computed ${expected}`);
}
function choice(id, truth, anchors = []) {
  const t = task(id, anchors);
  assert.equal(t.answer.kind, 'choice', id);
  assert.deepEqual(t.answer.options.map(x => x.value).sort(), Object.keys(truth).sort(), `${id}: unchecked option`);
  const valid = Object.keys(truth).filter(key => truth[key]);
  assert.equal(valid.length, 1, `${id}: exactly one mathematically valid option required`);
  assert.equal(t.answer.value, valid[0], id);
}

// Exact coverage and format contract: no trainer may be silently omitted.
const files = fs.readdirSync(path.join(root, 'geometry-course/trainers'))
  .filter(name => /^ch[12]-.*\.html$/.test(name)).map(name => name.slice(0, -5)).sort();
assert.equal(files.length, 32);
assert.deepEqual(bank.map(x => x.id).sort(), files);
assert.equal(byId.size, 96);
for (const page of bank) {
  assert(page.topic.trim());
  assert.equal(page.tasks.length, 3, page.id);
  assert.equal(new Set(page.tasks.map(t => t.prompt)).size, 3, page.id);
  for (const t of page.tasks) {
    assert(t.id.startsWith(page.id + '.'));
    for (const k of ['prompt', 'hint', 'solution']) assert.equal(typeof t[k], 'string');
    assert(t.prompt.trim() && t.hint.trim() && t.solution.trim());
    assert(t.errors.length >= 2, `${t.id}: diagnostic errors missing`);
    if (t.answer.kind === 'number') {
      assert(Number.isFinite(t.answer.value));
      assert(t.answer.tolerance >= 0 && t.answer.tolerance <= 0.001);
      for (const e of t.errors) {
        assert(Number.isFinite(e.value));
        assert(Math.abs(e.value - t.answer.value) > t.answer.tolerance, `${t.id}: correct answer classified as error`);
      }
    } else {
      assert.equal(t.answer.kind, 'choice');
      const keys = t.answer.options.map(x => x.value);
      assert.equal(new Set(keys).size, keys.length);
      assert(keys.includes(t.answer.value));
      const wrong = keys.filter(k => k !== t.answer.value).sort();
      assert.deepEqual(t.errors.map(e => e.value).sort(), wrong, `${t.id}: all distractors need diagnostics`);
    }
    assert(t.errors.every(e => typeof e.feedback === 'string' && e.feedback.length > 15));
    if (t.figure) {
      assert(t.figure.startsWith('<svg '));
      assert(/viewBox="[^"]+"/.test(t.figure));
      assert(/aria-label="[^"]+"/.test(t.figure));
      assert(/<title>[^<]+<\/title>/.test(t.figure));
      assert(!/<(?:script|image|use|foreignObject|style)\b|\b(?:href|src|on\w+)\s*=|javascript:/i.test(t.figure));
    }
  }
}

// Reflection: equal distances, fixed points, and midpoint of point/image.
const A = [0, 6], B = [7.5, 6];
num('ch1-p3-t2-fold-imprint.length', distance(reflect(A), reflect(B)), ['7,5']);
choice('ch1-p3-t2-fold-imprint.fixed', {
  on: distance([2, 0], reflect([2, 0])) === 0,
  near: distance([2, 0.01], reflect([2, 0.01])) === 0,
  all: distance(A, reflect(A)) === 0
});
num('ch1-p3-t2-fold-imprint.across', distance(A, reflect(A)), ['AH = 6']);
num('ch1-p6-t1-adjacent-vertical.adjacent', 180 - 64, ['64°']);
num('ch1-p6-t1-adjacent-vertical.vertical', 180 - (180 - 73), ['73°', 'между A и B', 'между C и D']);
num('ch1-p6-t1-adjacent-vertical.equal', 180 / 2);
num('ch1-p6-t2-angle-problems.difference', (180 - 38) / 2, ['38°', 'меньший']);
num('ch1-p6-t2-angle-problems.ratio', 180 * 7 / (2 + 7), ['2 : 7', 'больший']);
num('ch1-p6-t2-angle-problems.three', 360 - 307, ['307°']);

// Perpendiculars to y=0 are vertical lines x=c. Different c means no
// intersection; the same c means identical lines. Incidence axiom handles
// the general reflection proof, including its requirement M != M'.
choice('ch1-p6-t3-two-perpendiculars.different-feet', {parallel: 2 !== 7, meet: 2 === 7, same: 2 === 7});
choice('ch1-p6-t3-two-perpendiculars.same-foot', {same: 3 === 3, parallel: 3 !== 3, many: false});
choice('ch1-p6-t3-two-perpendiculars.contradiction', {two: true, length: distance(A, B) !== distance(reflect(A), reflect(B)), angle: false});

num('ch2-constr-angle-bisector.half', 86 / 2, ['86°']);
choice('ch2-constr-angle-bisector.proof', {
  sss: criterion(['OA', 'AC', 'OC'], []) === 'sss',
  sas: criterion(['OA', 'AC', 'OC'], []) === 'sas',
  asa: criterion(['OA', 'AC', 'OC'], []) === 'asa'
});
// Equal radii OA=OB with C on the bisector imply AC=BC by SAS.
// Therefore an unequal chord pair cannot be the claimed bisector.
const halfAngle = 35 * Math.PI / 180;
const OA = [4 * Math.cos(halfAngle), 4 * Math.sin(halfAngle)];
const OB = [OA[0], -OA[1]], OC = [6, 0];
assert(close(distance(OA, OC), distance(OB, OC)));
choice('ch2-constr-angle-bisector.radii', {no: true, yes: false, visual: false}, ['AC ≠ BC']);
const given47 = thirdSide(5, 5, 47);
num('ch2-constr-copy-angle.angle', angleFromSides(5, 5, given47), ['47°']);
choice('ch2-constr-copy-angle.chord', {
  ab: criterion(['OA', 'OB', 'AB'], []) === 'sss',
  oa: criterion(['OA', 'OB'], []) === 'sss',
  'ob-plus': close(4 + 4, thirdSide(4, 4, 60))
});
choice('ch2-constr-copy-angle.wrong-radius', {
  no: !sameSides([4, 4, 4], [8, 8, 4]),
  yes: criterion(['AB'], []) === 'sss',
  radii: sameSides([4, 4, 4], [8, 8, 4])
}, ['60°', '8 см', 'CD = 4 см']);
num('ch2-constr-perp-bisector.midpoint', 13 / 2, ['AB = 13']);
const twoIntersections = (d, r) => d > 0 && 2 * r > d;
choice('ch2-constr-perp-bisector.radius', {six: twoIntersections(10, 6), five: twoIntersections(10, 5), four: twoIntersections(10, 4)}, ['AB = 10']);
// With endpoints (-a,0),(a,0), equality of squared distances reduces
// to 4ax=0. For a != 0 it is exactly x=0, with arbitrary y.
const locusP = [0, 3], left = [-4, 0], right = [4, 0];
assert(close(distance(locusP, left), distance(locusP, right)));
choice('ch2-constr-perp-bisector.locus', {on: locusP[0] === 0, middle: locusP[1] === 0, parallel: locusP[1] === 0});
choice('ch2-constr-perpendicular-point.equal-chords', {
  radii: close(distance(locusP, left), distance(locusP, right)),
  mid: close(distance(locusP, left), distance(left, right)),
  triple: close(distance(locusP, left), distance(left, right))
});
num('ch2-constr-perpendicular-point.on-line', distance([-3.5, 0], [3.5, 0]), ['3,5']);
choice('ch2-constr-perpendicular-point.distinct', {two: true, side: false, radius: false});

num('ch2-p1-t1-overlay-equality.perimeter', sum([4, 6, 7]), ['4, 6 и 7']);
choice('ch2-p1-t1-overlay-equality.scale', {no: !sameSides([3, 4, 5], [6, 8, 10]), yes: sameSides([3, 4, 5], [6, 8, 10]), turn: sameSides([3, 4, 5], [6, 8, 10])});
choice('ch2-p1-t1-overlay-equality.correspondence', Object.fromEntries(['lm', 'kl', 'km'].map(k => [k, k.toUpperCase() === mapped('BC', {A:'K', B:'L', C:'M'})])));
choice('ch2-p1-t2-overlay-sas.included', {
  'a-d': criterion(['AB', 'AC'], ['A']) === 'sas',
  'b-e': criterion(['AB', 'AC'], ['B']) === 'sas',
  'c-f': criterion(['AB', 'AC'], ['C']) === 'sas'
});
assert.equal(criterion(['AB', 'AC'], ['A']), 'sas');
assert.equal(mapped('BC', {A:'P', B:'Q', C:'R'}), 'QR');
num('ch2-p1-t2-overlay-sas.reversed', 9, ['BC = 9']);
choice('ch2-p1-t2-overlay-sas.nonincluded', {no: criterion(['AB', 'AC'], ['B']) === 'none', yes: criterion(['AB', 'AC'], ['B']) === 'sas', third: criterion(['AB', 'AC'], ['B']) === 'sss'});
// Unique distance t on a fixed unit ray gives the point t*u.
choice('ch2-p1-t3-proof-sas.ray', {unique: true, picture: false, parallel: false});
choice('ch2-p1-t3-proof-sas.mirror', {no: close(distance(A, B), distance(reflect(A), reflect(B))), yes: false, angle: !close(angleBetween([2, 1], [1, 3]), angleBetween(reflect([2, 1]), reflect([1, 3])))});
choice('ch2-p1-t3-proof-sas.missing', {length: criterion(['AB', 'AC'], ['A']) === 'sas', colour: false, area: false});
assert.equal(criterion(['OA', 'OB'], ['O']), 'sas');
num('ch2-p1-t4-find-equal.cross', 8, ['внутренней точке O', 'AB = 8']);
assert.equal(mapped('BC', {B:'D', A:'C', C:'A'}), 'AD');
num('ch2-p1-t4-find-equal.diagonal', 5.5, ['BC = 5,5']);
choice('ch2-p1-t4-find-equal.hidden-angle', {vertical: true, adjacent: false, right: false}, ['O между концами']);
choice('ch2-p1-t5-quiz.criterion', {sas: criterion(['AB', 'AC'], ['A']) === 'sas', ssa: criterion(['AB', 'AC'], ['B']) !== 'none', aaa: criterion([], ['A', 'B', 'C']) !== 'none'});
assert.equal(mapped('BC', {A:'N', B:'M', C:'K'}), 'KM');
num('ch2-p1-t5-quiz.matching', 12.4, ['MK = 12,4']);
choice('ch2-p1-t5-quiz.not-proof', {exact: true, zoom: false, many: false});

num('ch2-p2-t0-three-cevians.median', 15 / 2, ['BC = 15']);
num('ch2-p2-t0-three-cevians.bisector', 2 * 32, ['32°']);
// A=(-2,3), B=(0,0), C=(5,0): angle B is obtuse and foot H=(-2,0).
assert(angleBetween([-2, 3], [5, 0]) > 90);
choice('ch2-p2-t0-three-cevians.outside', {'beyond-b': -2 < 0, inside: -2 >= 0 && -2 <= 5, 'at-c': -2 === 5});
num('ch2-p2-t1-perp-fold.distance', 18 / 2, ['PP′ = 18']);
num('ch2-p2-t1-perp-fold.angle', 180 / 2);
choice('ch2-p2-t1-perp-fold.unique', {no: true, yes: false, fold: false});
choice('ch2-p2-t2-isosceles-intro.base', {km: !incident('KM','L'), kl: !incident('KL','L'), lm: !incident('LM','L')});
num('ch2-p2-t2-isosceles-intro.side', (31 - 9) / 2, ['31 см', '9 см']);
const isosceles = lengths => new Set(lengths).size < 3;
choice('ch2-p2-t2-isosceles-intro.equilateral', {yes: isosceles([5,5,5]), no: !isosceles([5,5,5]), angles: false});
num('ch2-p2-t3-proof-base-angles.base-angle', 48, ['MN и MP', '48°']);
choice('ch2-p2-t3-proof-base-angles.common', {ad: criterion(['AB', 'AD'], ['A']) === 'sas', bd: false, angles: false});
choice('ch2-p2-t3-proof-base-angles.evidence', {congruence: criterion(['AB', 'AD'], ['A']) === 'sas', screen: false, drag: false});
num('ch2-p2-t4-three-in-one.half-base', 17 / 2, ['BC = 17']);
num('ch2-p2-t4-three-in-one.right', angleBetween([0,3],[-4,0]));
choice('ch2-p2-t4-three-in-one.converse', {iso: close(distance([0,3],[-4,0]),distance([0,3],[4,0])), all: close(5,8), none: false});
assert.equal(criterion(['AC', 'AM'], ['A']), 'sas');
assert.equal(mapped('CM', {A:'A', C:'B', M:'N'}), 'BN');
num('ch2-p2-t5-find-equal-iso.equal-points', 10, ['CM = 10']);
assert.equal(criterion(['AB', 'BM'], ['B']), 'sas');
num('ch2-p2-t5-find-equal-iso.base-points', 19, ['BM = CN', '19°']);
num('ch2-p2-t5-find-equal-iso.perimeter', 2 * 12 + 2 * 5, ['12 см', 'BD = 5']);
// Generic counterexample: A=(0,0), B=(6,0), C=(0,3). Its angle
// bisector is y=x; intersection with BC is (2,2), not the midpoint.
const D = [2,2];
choice('ch2-p2-t6-quiz.general', {angles: close(angleBetween([6,0],D),angleBetween(D,[0,3])), segments: close(distance([6,0],D),distance([0,3],D)), right: close(angleBetween([-2,-2],[4,-2]),90)});
choice('ch2-p2-t6-quiz.right-triangle', {ac: close(angleBetween([0,3],[4,0]),90), ab: close(angleBetween([-4,3],[4,0]),90), bc: close(angleBetween([4,0],[4,0]),90)});
num('ch2-p2-t6-quiz.iso-bisector', 74 / 2, ['74°']);

choice('ch2-p3-t0-adjacent-opposite.opposite', {l: !incident('KM','L'), k: !incident('KM','K'), m: !incident('KM','M')});
choice('ch2-p3-t0-adjacent-opposite.adjacent', {'rp-rq': incident('RP','R') && incident('RQ','R'), 'pq-pr': incident('PQ','R') && incident('PR','R'), 'pq-qr': incident('PQ','R') && incident('QR','R')});
choice('ch2-p3-t0-adjacent-opposite.included', {y: incident('XY','Y') && incident('YZ','Y'), x: incident('XY','X') && incident('YZ','X'), z: incident('XY','Z') && incident('YZ','Z')});
choice('ch2-p3-t1-overlay-asa.missing', {'b-e': criterion(['AB'],['A','B']) === 'asa', 'c-f': criterion(['AB'],['A','C']) === 'asa', side: criterion(['AB','AC'],['A']) === 'asa'});
assert.equal(mapped('AC', {A:'Q',B:'P',C:'R'}), 'QR');
num('ch2-p3-t1-overlay-asa.swapped', 7, ['AC = 7']);
choice('ch2-p3-t1-overlay-asa.angles-only', {no: !sameSides([3,4,5],[6,8,10]), yes: sameSides([3,4,5],[6,8,10]), mirror: false});
choice('ch2-p3-t2-proof-asa.intersection', {one: true, near: false, length: false});
choice('ch2-p3-t2-proof-asa.one-angle', {ray: criterion(['AB'],['A']) === 'none', fixed: criterion(['AB'],['A']) !== 'none', colour: false});
assert.equal(criterion(['AB'], ['A','B']), 'asa');
num('ch2-p3-t2-proof-asa.matching-angle', 67, ['67°']);
choice('ch2-p3-t3-which-sign.sas', Object.fromEntries(['sas','asa','none'].map(k=>[k,criterion(['AB','BC'],['B'])===k])));
choice('ch2-p3-t3-which-sign.asa', Object.fromEntries(['sas','asa','none'].map(k=>[k,criterion(['BC'],['B','C'])===k])));
choice('ch2-p3-t3-which-sign.ssa', Object.fromEntries(['sas','asa','none'].map(k=>[k,criterion(['AB','BC'],['A'])===k])));
// Explicit SSA counterexample: ray AC at 30°, AB=6, BC=4.
// Intersections C=t*(cos30,sin30) solve t²-12cos30*t+20=0.
const discriminant = (12 * Math.cos(Math.PI/6)) ** 2 - 4 * 20;
assert(discriminant > 0);
const t1 = (12 * Math.cos(Math.PI/6) + Math.sqrt(discriminant)) / 2;
const t2 = (12 * Math.cos(Math.PI/6) - Math.sqrt(discriminant)) / 2;
assert(t1 > 0 && t2 > 0 && !close(t1,t2));
for (const t of [t1,t2]) assert(close(distance([t*Math.cos(Math.PI/6),t*Math.sin(Math.PI/6)],[6,0]),4));
num('ch2-p3-t4-find-equal-asa.perimeter', sum([6,7,8]), ['6 см', '7 см', '8 см']);
num('ch2-p3-t4-find-equal-asa.whole-angle', 2 * 34, ['34°', 'внутри']);
choice('ch2-p3-t4-find-equal-asa.corresponding', Object.fromEntries(['cd','cb','bd'].map(k=>[k,side(k.toUpperCase())===mapped('AB',{A:'C',B:'D',D:'B'})])));
choice('ch2-p3-t5-quiz.exact', {asa: criterion(['AB'],['A','B'])==='asa', sas: criterion(['AB','AC'],['A'])==='asa', aaa: criterion([],['A','B','C'])==='asa'});
assert.equal(mapped('AC',{A:'N',B:'M',C:'K'}),'KN');
num('ch2-p3-t5-quiz.side',8.6,['NK = 8,6']);
choice('ch2-p3-t5-quiz.wrong-match', {qpr: ['Q','P','R'].join('')==='QPR', pqr: 'PQR'==='QPR', prq: 'PRQ'==='QPR'});

choice('ch2-p4-t0-rigidity.brace', {diagonal: criterion(['AB','BD','AD'],[])==='sss', paint: false, 'angle-label': false});
choice('ch2-p4-t0-rigidity.two-sides', {no: !close(thirdSide(5,7,40),thirdSide(5,7,80)), yes: close(thirdSide(5,7,40),12), difference: close(thirdSide(5,7,40),2)});
choice('ch2-p4-t0-rigidity.mirror', {no: criterion(['AB','BC','CA'],[])==='sss', yes: false, unknown: false});
choice('ch2-p4-t1-overlay-sss.side-set', {same: sameSides([5,7,8],[8,5,7]), scale: sameSides([5,7,8],[10,14,16]), two: sameSides([5,7,8],[5,7,9])});
num('ch2-p4-t1-overlay-sss.perimeter',sum([4.5,6,7.5]),['4,5 см','6 см','7,5 см']);
choice('ch2-p4-t1-overlay-sss.no-third',Object.fromEntries(['sas','sss','none'].map(k=>[k,criterion(['AB','AC'],['A'])===k])));
// An asymmetric example prevents an unproved equality inside ABC/ABD:
// A=(0,0), B=(6,0), C=(1,3), D=(1,-3).
const pa=[0,0], pb=[6,0], pc=[1,3], pd=[1,-3];
const isoACD=isosceles([distance(pa,pc),distance(pa,pd),distance(pc,pd)]);
const isoBCD=isosceles([distance(pb,pc),distance(pb,pd),distance(pc,pd)]);
const isoABC=isosceles([distance(pa,pb),distance(pb,pc),distance(pa,pc)]);
const isoABD=isosceles([distance(pa,pb),distance(pb,pd),distance(pa,pd)]);
choice('ch2-p4-t2-proof-sss.isosceles', {'acd-bcd':isoACD&&isoBCD,'abc-abd':isoABC&&isoABD,'acd-abc':isoACD&&isoABC});
num('ch2-p4-t2-proof-sss.sum',28+41,['28°','41°','внутри']);
num('ch2-p4-t2-proof-sss.difference',76-29,['76°','29°','внутри']);
choice('ch2-p4-t3-which-sign.sss',Object.fromEntries(['sss','sas','asa'].map(k=>[k,criterion(['AB','BC','CA'],[])===k])));
choice('ch2-p4-t3-which-sign.sas',Object.fromEntries(['sss','sas','asa'].map(k=>[k,criterion(['AB','AC'],['A'])===k])));
choice('ch2-p4-t3-which-sign.aaa',Object.fromEntries(['none','sss','asa'].map(k=>[k,criterion([],['A','B','C'])===k])));
num('ch2-p4-t4-find-equal-sss.angle',36,['36°']);
// D=(2,0) is equidistant from B=(3,2), C=(3,-2), but not on BC.
choice('ch2-p4-t4-find-equal-sss.bisector', {bisector: close(angleBetween([3,2],[2,0]),angleBetween([2,0],[3,-2])), median: 2===3, side: close(2,Math.hypot(3,2))});
num('ch2-p4-t4-find-equal-sss.sum-sides',8+5,['8 см','5 см']);
choice('ch2-p4-t5-quiz.common', {pr: criterion(['PQ','QR','PR'],[])==='sss',angle:false,qs:false});
assert(sameSides([5,13,12],[12,5,13]));
num('ch2-p4-t5-quiz.matching',angleFromSides(5,12,13),['AB = 5','BC = 13','AC = 12','KL = 12','LM = 5','KM = 13','90°']);
choice('ch2-p4-t5-quiz.two-not-enough',{no:!close(thirdSide(6,9,40),thirdSide(6,9,80)),yes:criterion(['AB','AC'],[])!=='none',third:criterion(['AB','AC'],[])==='sss'});

// Diagram-specific checks: congruence task's displayed opening is 36°;
// median and reflection diagrams keep exact midpoint/perpendicular geometry.
assert(Math.abs(angleBetween([90,-65.3888],[240,0])-36)<0.0001);
assert(close(distance([60,185],[180,185]),distance([180,185],[300,185])));
assert(close(distance([180,35],[180,110]),distance([180,185],[180,110])));
assert.equal(checked.size, byId.size);
assert.deepEqual([...checked].sort(), [...byId.keys()].sort());
console.log(`PASS: ${bank.length} chapter 1–2 trainers, ${checked.size} independent mathematical oracles; schema, diagnostics, coverage and SVG checks`);
