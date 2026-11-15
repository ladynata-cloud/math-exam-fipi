'use strict';

// Independent geometry checks for the 30 approved source-expansion cards.
// During isolated authoring, TASK19_CIRCLE_CARDS_PATH may point to the complete
// staged JSON array; the ordinary repository gate reads the integrated bank.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const core = require('../trainers/task19-visual-models.js');
const ids = [
  'circle_area_less_than_diameter_squared',
  'point_inside_disk_distance_less_radius',
  'equidistant_points_lie_on_circle',
  'point_outside_disk_distance_greater_radius',
  'tangent_circles_contact_equidistant_centers',
  'square_always_cyclic',
  'chord_always_gt_radius',
  'circle_point_distance_less_radius',
  'any_two_chords_intersect',
  'any_two_diameters_perpendicular',
  'point_distance5_radius4_inside',
  'circles_r1_r6_d4_intersect',
  'line_distance3_radius5_tangent',
  'inscribed40_arc80',
  'inscribed_equals_central_same_chord',
  'circles_r3_r2_d4_disjoint',
  'line_distance10_radius7_disjoint',
  'inscribed40_arc40',
  'two_points_multiple_circles',
  'circles_distance_gt_sum_diameters_disjoint',
  'circles_r2_r5_d1_intersect',
  'arc100_inscribed50',
  'circles_distance_lt_sum_diameters_disjoint',
  'circles_r2_r5_d6_intersect',
  'arc60_inscribed30',
  'regular_heptagon_no_circumcircle',
  'regular_nonagon_no_incircle',
  'tangent_secant_power',
  'external_point_at_most_one_tangent',
  'intersecting_chords_products_equal'
];
const integrated = require('../trainers/task19-visual-data.js').cards;
const cards = process.env.TASK19_CIRCLE_CARDS_PATH
  ? JSON.parse(fs.readFileSync(process.env.TASK19_CIRCLE_CARDS_PATH, 'utf8'))
  : integrated.filter(card => ids.includes(card.id));
const byId = new Map(cards.map(card => [card.id, card]));
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (u, v) => u[0] * v[0] + u[1] * v[1];
const cross = (u, v) => u[0] * v[1] - u[1] * v[0];
const distance = (a, b) => Math.hypot(...sub(a, b));
const angle = (a, o, b) => Math.atan2(Math.abs(cross(sub(a, o), sub(b, o))), dot(sub(a, o), sub(b, o))) * 180 / Math.PI;
const area = points => Math.abs(points.reduce((sum, a, i) => sum + cross(a, points[(i + 1) % points.length]), 0)) / 2;
const lineDistance = (p, a, b) => Math.abs(cross(sub(p, a), sub(b, a))) / distance(a, b);
const near = (actual, expected, message = '') => assert.ok(Number.isFinite(actual) && Number.isFinite(expected) && Math.abs(actual - expected) <= 1e-7 * Math.max(1, Math.abs(actual), Math.abs(expected)), `${message}: ${actual} != ${expected}`);
const perpendicular = (a, b, c, d) => near(dot(sub(b, a), sub(d, c)), 0, 'perpendicular');
const collinear = (a, b, c) => near(cross(sub(b, a), sub(c, a)), 0, 'collinear');
function finiteTree(value) {
  if (typeof value === 'number') assert.ok(Number.isFinite(value));
  else if (value && typeof value === 'object') Object.values(value).forEach(finiteTree);
}
function sampled(card, params = card.hint.params) { return core.sample(card.hint.model, params); }
function states(card) {
  const start = sampled(card).values;
  const result = [start];
  const controls = core.controlsFor(card.hint.model, start);
  for (const {key, min, max} of controls) {
    for (const value of [min, (min + max) / 2, max]) {
      const params = core.updateModel(card.hint.model, start, key, value);
      result.push(params);
      result.push(core.restoreModel(card.hint, {params, measured:true}).params);
    }
  }
  // Combined end states catch interactions between two independently bounded controls.
  for (const side of ['min', 'max']) {
    let params = start;
    for (const control of controls) params = core.updateModel(card.hint.model, params, control.key, control[side]);
    result.push(params);
  }
  return result.map(params => sampled(card, params));
}
function circleIntersections(r1, r2, d) {
  if (d > r1 + r2 + 1e-7 || d < Math.abs(r1 - r2) - 1e-7) return 0;
  if (Math.abs(d - r1 - r2) < 1e-7 || Math.abs(d - Math.abs(r1 - r2)) < 1e-7) return 1;
  return 2;
}
function checkPair(s) {
  const {points:P, metrics:M, values:V} = s;
  const d = distance(P.O1, P.O2);
  const r1 = V.r1, r2 = V.mode === 'tangent' ? V.other : V.r2;
  near(M.r1, r1); near(M.r2, r2); near(M.distance, d);
  near(M.sumRadii, r1 + r2); near(M.differenceRadii, Math.abs(r1 - r2)); near(M.sumDiameters, 2 * (r1 + r2));
  const count = circleIntersections(r1, r2, d);
  assert.equal(M.intersections, count);
  assert.equal(Number(!!P.P) + Number(!!P.Q), count);
  for (const name of ['P', 'Q'].filter(name => P[name])) {
    near(distance(P.O1, P[name]), r1); near(distance(P.O2, P[name]), r2);
  }
  if (P.Q) assert.ok(distance(P.P, P.Q) > 1e-7);
  if (V.mode === 'tangent') near(d, r1 + r2);
  if (V.mode === 'greaterDiameters') assert.ok(d > 2 * (r1 + r2));
  if (V.mode === 'lessDiameters') assert.ok(d < 2 * (r1 + r2));
  if (V.mode === 'fixed') near(d, V.distance);
  // The two first SVG circles are the actual boundaries, not center markers.
  const svg = core.render('circlePairConstrained', V).svg;
  const rendered = [...svg.matchAll(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/g)].slice(0, 2).map(m => ({center:[+m[1], +m[2]], radius:+m[3]}));
  assert.equal(rendered.length, 2);
  near(rendered[0].radius / rendered[1].radius, r1 / r2, 'painted radii');
  near(distance(rendered[0].center, rendered[1].center) / rendered[0].radius, d / r1, 'painted center distance');
}
function checkLine(s) {
  const {points:P, metrics:M, values:V} = s;
  const r = distance(P.O, P.R), d = lineDistance(P.O, P.U, P.V);
  near(r, V.radius); near(d, V.distance); near(M.radius, r); near(M.distance, d);
  collinear(P.U, P.V, P.M); perpendicular(P.O, P.M, P.U, P.V);
  const count = d > r + 1e-7 ? 0 : Math.abs(d - r) <= 1e-7 ? 1 : 2;
  assert.equal(M.intersections, count); assert.equal(Number(!!P.A) + Number(!!P.B), count);
  for (const name of ['A','B'].filter(n => P[n])) { near(distance(P.O, P[name]), r); collinear(P.U, P.V, P[name]); }
}
function checkArc(s) {
  const {points:P, metrics:M, values:V} = s;
  const r = distance(P.O, P.A);
  for (const name of ['B', 'C']) near(distance(P.O, P[name]), r);
  const measuredArc = angle(P.A, P.O, P.B);
  const measuredInscribed = angle(P.A, P.C, P.B);
  near(M.arc, measuredArc); near(M.central, measuredArc); near(M.inscribed, measuredInscribed);
  near(measuredArc, V.arc); near(measuredInscribed * 2, measuredArc);
  const cAngle = (Math.atan2(P.C[1], P.C[0]) * 180 / Math.PI + 360) % 360;
  assert.ok(cAngle > measuredArc && cAngle < 360, 'C is outside the named minor arc');
}
function checkPolygon(s) {
  const {points:P, metrics:M, values:V} = s;
  const names = Array.from({length:V.n}, (_, i) => String.fromCharCode(65+i));
  assert.equal(Object.keys(P).filter(key => /^[A-I]$/.test(key)).length, V.n);
  const r = distance(P.O, P.A), side = distance(P.A, P.B);
  near(r, V.radius); assert.equal(M.n, V.n);
  let firstAngle;
  for (let i = 0; i < names.length; i++) {
    const a = P[names[i]], b = P[names[(i+1)%names.length]], prev = P[names[(i+names.length-1)%names.length]], foot = P['H'+i];
    near(distance(P.O, a), r); near(distance(a, b), side);
    const vertexAngle = angle(prev, a, b); if (i === 0) firstAngle = vertexAngle; else near(vertexAngle, firstAngle);
    collinear(a, b, foot); perpendicular(P.O, foot, a, b);
    near(distance(a, foot), distance(foot, b));
    near(M.sides[i], distance(a, b)); near(M.vertexDistances[i], distance(P.O, a)); near(M.sideDistances[i], lineDistance(P.O, a, b));
    near(lineDistance(P.O, a, b), distance(P.O, P.H0));
  }
  near(M.inradius, lineDistance(P.O, P.A, P.B)); near(M.circumradius, r);
  near(firstAngle, 180 * (V.n - 2) / V.n);
  if (V.n === 4) { near(firstAngle, 90); near(distance(P.A, P.C), distance(P.B, P.D)); }
}
function checkPower(s) {
  const {points:P, metrics:M, values:V} = s;
  const r = distance(P.O, P.A);
  near(r, V.radius); near(M.radius, r); near(M.OP, distance(P.O, P.P));
  if (V.mode === 'secant') {
    assert.ok(distance(P.O, P.P) > r); near(distance(P.O, P.T), r); near(distance(P.O, P.B), r);
    perpendicular(P.O, P.T, P.P, P.T); collinear(P.P, P.A, P.B);
    assert.ok(distance(P.P, P.A) < distance(P.P, P.B));
    near(distance(P.P, P.A) + distance(P.A, P.B), distance(P.P, P.B));
    for (const name of ['T','A','B']) near(M['P'+name], distance(P.P, P[name]));
    const tangentSquare = distance(P.P, P.T) ** 2, secantProduct = distance(P.P, P.A) * distance(P.P, P.B);
    near(tangentSquare, secantProduct); near(tangentSquare, distance(P.O, P.P) ** 2 - r*r);
    near(M.tangentSquare, tangentSquare); near(M.secantProduct, secantProduct);
  } else {
    assert.ok(distance(P.O, P.P) < r);
    for (const name of ['B','C','D']) near(distance(P.O, P[name]), r);
    for (const [a,b] of [['A','B'],['C','D']]) {
      collinear(P[a], P.P, P[b]); near(distance(P[a], P.P) + distance(P.P, P[b]), distance(P[a], P[b]));
      assert.ok(distance(P[a], P.P) > 0 && distance(P[b], P.P) > 0);
    }
    assert.ok(Math.abs(cross(sub(P.B, P.A), sub(P.D, P.C))) > 1e-7, 'two distinct chord lines');
    for (const name of ['A','B','C','D']) near(M['P'+name], distance(P.P, P[name]));
    const first = distance(P.P, P.A) * distance(P.P, P.B), second = distance(P.P, P.C) * distance(P.P, P.D);
    near(first, second); near(first, r*r - distance(P.O, P.P)**2);
    near(M.firstProduct, first); near(M.secondProduct, second);
  }
}
function checkGeometry(card, s) {
  const {points:P, metrics:M, values:V} = s;
  switch (card.hint.model) {
    case 'circleDiameterArea': {
      const r = distance(P.O, P.E), d = distance(P.E, P.F), square = area(['A','B','C','D'].map(n=>P[n]));
      near(d, 2*r); near(M.radius, r); near(M.diameter, d); near(M.squareArea, square); near(square, d*d); near(M.circleArea, Math.PI*r*r); assert.ok(M.circleArea < square); break;
    }
    case 'circlePointPosition': {
      const r = distance(P.O, P.R), d = distance(P.O, P.P);
      near(r, V.radius); near(M.radius, r); near(M.distance, d);
      if (V.mode === 'inside') assert.ok(d < r);
      else if (V.mode === 'outside') assert.ok(d > r);
      else if (V.mode === 'on') near(d, r);
      else near(d, V.givenDistance);
      break;
    }
    case 'circlePairConstrained': checkPair(s); break;
    case 'circleLineConstrained': checkLine(s); break;
    case 'circleArcConstrained': checkArc(s); break;
    case 'regularPolygonCircles': checkPolygon(s); break;
    case 'circlePowerProducts': checkPower(s); break;
    case 'circleThroughTwoPoints':
      assert.ok(distance(P.A, P.B) > 0 && distance(P.O1, P.O2) > 0);
      for (const name of ['O1','O2']) { near(distance(P[name], P.A), distance(P[name], P.B)); near(M[name+'A'], distance(P[name], P.A)); near(M[name+'B'], distance(P[name], P.B)); }
      assert.deepEqual(P.A, [-2,0]); assert.deepEqual(P.B, [2,0]); break;
    case 'circleDisjointChords':
      for (const name of ['A','B','C','D']) near(distance(P.O, P[name]), 5);
      near(cross(sub(P.B, P.A), sub(P.D, P.C)), 0); assert.ok(lineDistance(P.C, P.A, P.B) > 0);
      near(M.separation, lineDistance(P.C, P.A, P.B)); near(M.AB, distance(P.A, P.B)); near(M.CD, distance(P.C, P.D)); break;
    case 'circleDiameterAngle':
      for (const name of ['A','B','C','D']) near(distance(P.O, P[name]), 4);
      collinear(P.A, P.O, P.B); collinear(P.C, P.O, P.D); near(distance(P.A, P.O), distance(P.O, P.B)); near(M.angle, angle(P.A, P.O, P.D)); break;
    case 'circleRadii': near(distance(P.O, P.A), distance(P.O, P.B)); near(M.OA, distance(P.O, P.A)); near(M.OB, distance(P.O, P.B)); break;
    case 'circleChord': near(distance(P.O, P.A), 5); near(distance(P.O, P.B), 5); near(M.chord, distance(P.A, P.B)); break;
    case 'circleTangents':
      assert.ok(distance(P.O, P.P) > distance(P.O, P.A)); near(distance(P.O, P.A), distance(P.O, P.B));
      perpendicular(P.O, P.A, P.A, P.P); perpendicular(P.O, P.B, P.B, P.P); assert.ok(distance(P.A, P.B) > 0); break;
    default: assert.fail('Unreviewed model '+card.hint.model);
  }
}

test('the circle expansion contains exactly the 30 assigned IDs and complete hints', () => {
  assert.equal(cards.length, 30); assert.equal(byId.size, 30); assert.deepEqual([...byId.keys()].sort(), [...ids].sort());
  for (const card of cards) {
    assert.deepEqual(card.aliases, [card.id]); assert.equal(typeof card.truth, 'boolean'); assert.ok(card.text.length > 15); assert.ok(card.explanation.length > 50);
    for (const key of ['prompt','observe','preserve']) assert.ok(card.hint[key].length > 20, card.id+' '+key);
    assert.ok(core.modelNames.includes(card.hint.model)); assert.ok(core.controlsFor(card.hint.model, card.hint.params).length > 0);
  }
});

test('all circle premises and measurements survive min, midpoint, max, joint extremes and restore', () => {
  for (const card of cards) for (const s of states(card)) {
    finiteTree(s.points); finiteTree(s.metrics); checkGeometry(card, s);
    const rendered = core.render(card.hint.model, s.values);
    assert.ok(rendered.svg.length > 100); assert.ok(rendered.readout.length > 0);
    assert.doesNotMatch(rendered.svg, /NaN|Infinity|undefined/);
    assert.doesNotMatch(rendered.svg, /(?:верно|неверно|контрпример|доказано|даёт ответ)/i, card.id+' neutral drawing');
  }
});

test('every displayed control changes actual geometry and the resulting drawing', () => {
  for (const card of cards) for (const control of core.controlsFor(card.hint.model, card.hint.params)) {
    const samples = [control.min, (control.min+control.max)/2, control.max].map(value => sampled(card, core.updateModel(card.hint.model, card.hint.params, control.key, value)));
    assert.ok(new Set(samples.map(s=>JSON.stringify({points:s.points,metrics:s.metrics}))).size > 1, card.id+' '+control.key+' geometry');
    assert.ok(new Set(samples.map(s=>core.render(card.hint.model,s.values).svg)).size > 1, card.id+' '+control.key+' drawing');
  }
});

test('restore rejects forged modes, conditions, radii, counts and locking flags', () => {
  for (const card of cards) {
    const initial = sampled(card).values, editable = new Set(core.controlsFor(card.hint.model, initial).map(c=>c.key));
    const poison = Object.fromEntries(Object.entries(initial).map(([key,value])=>[key,typeof value==='number'?999:Array.isArray(value)?[]:'forged']));
    const state = core.restoreModel(card.hint, {params:poison, measured:true});
    assert.equal(state.measured, true);
    for (const key of Object.keys(initial)) if (!editable.has(key)) assert.deepEqual(state.params[key], initial[key], card.id+' immutable '+key);
    checkGeometry(card, sampled(card,state.params));
    const malformed = core.restoreModel(card.hint, {params:Object.fromEntries([...editable].map(key=>[key,NaN])), measured:'true'});
    assert.equal(malformed.measured,false); checkGeometry(card,sampled(card,malformed.params));
  }
});

test('numeric premises retain their exact radii, distances and angles throughout manipulation', () => {
  for (const [id,r1,r2,d] of [
    ['circles_r1_r6_d4_intersect',1,6,4], ['circles_r3_r2_d4_disjoint',3,2,4],
    ['circles_r2_r5_d1_intersect',2,5,1], ['circles_r2_r5_d6_intersect',2,5,6]
  ]) for (const s of states(byId.get(id))) { near(s.metrics.r1,r1); near(s.metrics.r2,r2); near(distance(s.points.O1,s.points.O2),d); }
  for (const [id,r,d] of [['line_distance3_radius5_tangent',5,3],['line_distance10_radius7_disjoint',7,10]])
    for(const {points:P} of states(byId.get(id))) { near(distance(P.O,P.R),r); near(lineDistance(P.O,P.U,P.V),d); }
  for (const {points:P} of states(byId.get('point_distance5_radius4_inside'))) { near(distance(P.O,P.R),4); near(distance(P.O,P.P),5); }
  for (const [id,inscribed,arc] of [['inscribed40_arc80',40,80],['inscribed40_arc40',40,80],['arc100_inscribed50',50,100],['arc60_inscribed30',30,60]])
    for(const {points:P} of states(byId.get(id))) { near(angle(P.A,P.C,P.B),inscribed); near(angle(P.A,P.O,P.B),arc); }
});

test('every false circle card starts with a genuine counterexample to its statement', () => {
  const witnesses = {
    tangent_circles_contact_equidistant_centers:s=>Math.abs(distance(s.points.O1,s.points.P)-distance(s.points.O2,s.points.P))>1e-7,
    chord_always_gt_radius:s=>distance(s.points.A,s.points.B)<distance(s.points.O,s.points.A),
    circle_point_distance_less_radius:s=>Math.abs(distance(s.points.O,s.points.P)-distance(s.points.O,s.points.R))<1e-7,
    any_two_chords_intersect:s=>lineDistance(s.points.C,s.points.A,s.points.B)>0&&Math.abs(cross(sub(s.points.B,s.points.A),sub(s.points.D,s.points.C)))<1e-7,
    any_two_diameters_perpendicular:s=>Math.abs(dot(sub(s.points.B,s.points.A),sub(s.points.D,s.points.C)))>1e-7,
    point_distance5_radius4_inside:s=>distance(s.points.O,s.points.P)>distance(s.points.O,s.points.R),
    circles_r1_r6_d4_intersect:s=>distance(s.points.O1,s.points.O2)<Math.abs(1-6),
    line_distance3_radius5_tangent:s=>lineDistance(s.points.O,s.points.U,s.points.V)<distance(s.points.O,s.points.R)&&!!s.points.A&&!!s.points.B,
    inscribed_equals_central_same_chord:s=>Math.abs(angle(s.points.A,s.points.C,s.points.B)-angle(s.points.A,s.points.O,s.points.B))>1e-7,
    circles_r3_r2_d4_disjoint:s=>!!s.points.P&&!!s.points.Q,
    inscribed40_arc40:s=>Math.abs(angle(s.points.A,s.points.O,s.points.B)-40)>1e-7,
    circles_r2_r5_d1_intersect:s=>distance(s.points.O1,s.points.O2)<Math.abs(2-5),
    circles_distance_lt_sum_diameters_disjoint:s=>!!s.points.P&&!!s.points.Q&&distance(s.points.O1,s.points.O2)<2*(3+2),
    regular_heptagon_no_circumcircle:s=>s.values.n===7&&Array.from({length:7},(_,i)=>distance(s.points.O,s.points[String.fromCharCode(65+i)])).every(r=>Math.abs(r-distance(s.points.O,s.points.A))<1e-7),
    regular_nonagon_no_incircle:s=>s.values.n===9&&Array.from({length:9},(_,i)=>lineDistance(s.points.O,s.points[String.fromCharCode(65+i)],s.points[String.fromCharCode(65+(i+1)%9)])).every(r=>Math.abs(r-lineDistance(s.points.O,s.points.A,s.points.B))<1e-7),
    external_point_at_most_one_tangent:s=>distance(s.points.A,s.points.B)>1e-7&&Math.abs(dot(sub(s.points.O,s.points.A),sub(s.points.P,s.points.A)))<1e-7&&Math.abs(dot(sub(s.points.O,s.points.B),sub(s.points.P,s.points.B)))<1e-7
  };
  const falseCards=cards.filter(card=>!card.truth);
  assert.deepEqual(falseCards.map(card=>card.id).sort(),Object.keys(witnesses).sort());
  for (const card of falseCards) { const s=sampled(card);checkGeometry(card,s);assert.ok(witnesses[card.id](s),card.id+' initial counterexample'); }
});

test('tangent-circle motion never separates or intersects twice, including decimal radii', () => {
  for (let i=15;i<=40;i++) for(const rotation of[-60,0,60]) {
    const s=core.sample('circlePairConstrained',{mode:'tangent',r1:1,other:i/10,rotation});
    checkPair(s); assert.equal(s.metrics.intersections,1); near(distance(s.points.O1,s.points.P),1); near(distance(s.points.O2,s.points.P),i/10);
  }
});

test('power theorems remain geometric at combined control boundaries', () => {
  for(const ratio of[1.5,2,2.5]) for(const deflection of[-.65,0,.65]) checkPower(core.sample('circlePowerProducts',{mode:'secant',ratio,deflection}));
  for(const position of[-.65,0,.65]) for(const angle of[25,87.5,150]) checkPower(core.sample('circlePowerProducts',{mode:'chords',position,angle}));
});
