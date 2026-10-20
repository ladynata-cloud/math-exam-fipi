'use strict';

// Independent coordinate audit. Expected lengths, angles and areas below are
// measured from model points, rather than copied from its displayed formulas.
// Run from tools/ normally, or set TASK19_AUDIT_ROOT to a candidate checkout.
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const root = process.env.TASK19_AUDIT_ROOT || path.resolve(__dirname, '..');
const data = require(path.join(root, 'trainers/task19-visual-data.js'));
const visuals = require(path.join(root, 'trainers/task19-visual-models.js'));
const byId = new Map(data.cards.map(card => [card.id, card]));
const subtract = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const length = (a, b) => Math.hypot(...subtract(a, b));
const area = (...points) => Math.abs(points.reduce((sum, p, i) => sum + cross(p, points[(i + 1) % points.length]), 0)) / 2;
const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const lineDistance = (p, a, b) => Math.abs(cross(subtract(p, a), subtract(b, a))) / length(a, b);
const angle = (a, o, b) => Math.atan2(Math.abs(cross(subtract(a, o), subtract(b, o))), dot(subtract(a, o), subtract(b, o))) * 180 / Math.PI;
const near = (actual, expected, message) => assert(Number.isFinite(actual) && Number.isFinite(expected) && Math.abs(actual - expected) <= 1e-7 * Math.max(1, Math.abs(actual), Math.abs(expected)), `${message}: ${actual} != ${expected}`);
const pointNear = (a, b, message) => { assert(a && b, message); near(length(a, b), 0, message); };
const parallel = (a, b, c, d, message) => near(cross(subtract(b, a), subtract(d, c)), 0, message);
const perpendicular = (a, b, c, d, message) => near(dot(subtract(b, a), subtract(d, c)), 0, message);
const triangle = (P, names = ['A', 'B', 'C']) => {
  const [a, b, c] = names.map(n => P[n]);
  assert(a && b && c && area(a, b, c) > 1e-8, names.join('') + ' is a nondegenerate triangle');
  near(angle(b, a, c) + angle(a, b, c) + angle(a, c, b), 180, 'measured triangle angle sum');
};
const quadrilateral = P => {
  const names = ['A', 'B', 'C', 'D'];
  assert(names.every(n => P[n]), 'four quadrilateral vertices');
  const turns = names.map((n, i) => cross(subtract(P[names[(i + 1) % 4]], P[n]), subtract(P[names[(i + 2) % 4]], P[names[(i + 1) % 4]])));
  assert(turns.every(x => x > 1e-8) || turns.every(x => x < -1e-8), 'quadrilateral stays strictly convex');
};
function metric(M, name, expected, label) { if (name in M) near(M[name], expected, label || name); }
function finiteTree(value, label) {
  if (typeof value === 'number') assert(Number.isFinite(value), label + ' is finite');
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) finiteTree(item, label + '.' + key);
}
function ordinaryTriangle(P, M) {
  triangle(P);
  metric(M, 'area', area(P.A, P.B, P.C));
  for (const edge of ['AB', 'AC', 'BC', 'AM', 'MB', 'CM']) if (P[edge[0]] && P[edge[1]]) metric(M, edge, length(P[edge[0]], P[edge[1]]));
}
function parallelShape(P, M, kind) {
  quadrilateral(P);
  parallel(P.A, P.B, P.D, P.C, 'opposite sides parallel');
  parallel(P.A, P.D, P.B, P.C, 'second pair parallel');
  pointNear(midpoint(P.A, P.C), midpoint(P.B, P.D), 'diagonals have a common midpoint');
  if (P.O) pointNear(P.O, midpoint(P.A, P.C), 'O is the midpoint');
  if (kind === 'rhombus') {
    near(length(P.A, P.B), length(P.B, P.C), 'rhombus adjacent sides equal');
    perpendicular(P.A, P.C, P.B, P.D, 'rhombus diagonals perpendicular');
  }
  if (kind === 'rectangle') {
    perpendicular(P.A, P.B, P.A, P.D, 'rectangle angle is right');
    near(length(P.A, P.C), length(P.B, P.D), 'rectangle diagonals equal');
  }
  for (const name of ['AC', 'BD', 'AO', 'BO']) if (P[name[0]] && P[name[1]]) metric(M, name, length(P[name[0]], P[name[1]]));
  metric(M, 'area', area(P.A, P.B, P.C, P.D));
  metric(M, 'perimeter', length(P.A, P.B) + length(P.B, P.C) + length(P.C, P.D) + length(P.D, P.A));
  metric(M, 'BAC', angle(P.B, P.A, P.C));
  metric(M, 'CAD', angle(P.C, P.A, P.D));
  metric(M, 'ABD', angle(P.A, P.B, P.D));
  metric(M, 'DBC', angle(P.D, P.B, P.C));
}

const checks = {
  adjacentAngles(P, M) {
    near(M.alpha + M.beta, 180, 'supplementary angles');
    if (P.O && P.A && P.B && P.C) {
      metric(M, 'alpha', angle(P.A, P.O, P.C));
      metric(M, 'beta', angle(P.C, P.O, P.B));
      near(angle(P.A, P.O, P.B), 180, 'outer rays are opposite');
    }
  },
  triangleAngles(P, M) {
    ordinaryTriangle(P, M);
    metric(M, 'a', angle(P.B, P.A, P.C)); metric(M, 'b', angle(P.A, P.B, P.C)); metric(M, 'c', angle(P.A, P.C, P.B));
  },
  triangleMedian(P, M) {
    ordinaryTriangle(P, M);
    pointNear(P.M, midpoint(P.A, P.B), 'median ends at midpoint');
    perpendicular(P.C, P.H, P.A, P.B, 'height is perpendicular');
    metric(M, 'leftArea', area(P.A, P.M, P.C)); metric(M, 'rightArea', area(P.M, P.B, P.C));
    near(area(P.A, P.M, P.C), area(P.M, P.B, P.C), 'median areas independently measured');
  },
  areaTriangle(P, M) {
    ordinaryTriangle(P, M);
    perpendicular(P.C, P.H, P.A, P.B, 'height is perpendicular to side line');
    metric(M, 'height', lineDistance(P.C, P.A, P.B));
  },
  triangleSides(P, M, V) {
    const sides = [V.a, V.b, V.c].sort((a, b) => a - b);
    assert.equal(M.exists, sides[0] + sides[1] > sides[2], 'three rods close only under strict triangle inequality');
    if (M.exists) {
      ordinaryTriangle(P, M);
      near(length(P.B, P.C), V.a, 'a measured from points');
      near(length(P.A, P.C), V.b, 'b measured from points');
      near(length(P.A, P.B), V.c, 'c measured from points');
    }
  },
  parallelogram(P, M) { parallelShape(P, M, 'parallelogram'); },
  rhombus(P, M) { parallelShape(P, M, 'rhombus'); },
  rectangle(P, M) { parallelShape(P, M, 'rectangle'); },
  trapezoid(P, M) {
    quadrilateral(P);
    parallel(P.A, P.B, P.C, P.D, 'bases parallel');
    assert(length(P.A, P.B) > length(P.C, P.D), 'bases remain different');
    pointNear(P.E, midpoint(P.A, P.D), 'E midpoint'); pointNear(P.F, midpoint(P.B, P.C), 'F midpoint');
    metric(M, 'midline', length(P.E, P.F));
    metric(M, 'area', area(P.A, P.B, P.C, P.D));
    for (const edge of ['AD', 'BC', 'AC', 'BD', 'AO', 'OC', 'BO', 'OD']) metric(M, edge, length(P[edge[0]], P[edge[1]]));
    near(length(P.A, P.O) + length(P.O, P.C), length(P.A, P.C), 'O lies on AC');
    near(length(P.B, P.O) + length(P.O, P.D), length(P.B, P.D), 'O lies on BD');
  },
  circleChord(P, M) {
    near(length(P.O, P.A), length(P.O, P.B), 'chord endpoints share radius');
    metric(M, 'radius', length(P.O, P.A)); metric(M, 'chord', length(P.A, P.B)); metric(M, 'offset', lineDistance(P.O, P.A, P.B));
    assert(length(P.A, P.B) <= 2 * length(P.O, P.A) + 1e-7, 'chord cannot exceed diameter');
  },
  circleAngle(P, M, V) {
    triangle(P);
    for (const n of ['B', 'C', 'D']) near(length(P.O, P[n]), length(P.O, P.A), 'all points stay on one circle');
    metric(M, 'central', angle(P.A, P.O, P.B));
    metric(M, 'inscribed', angle(P.A, P.C, P.B));
    metric(M, 'secondInscribed', angle(P.A, P.D, P.B));
    near(angle(P.A, P.C, P.B), angle(P.A, P.D, P.B), 'angles on same arc agree');
    if (V.diameter) pointNear(P.O, midpoint(P.A, P.B), 'fixed chord remains a diameter');
  },
  similarity(P, M, V) {
    if (P.A && P.B && P.C && P.A2 && P.B2 && P.C2) {
      triangle(P); triangle(P, ['A2', 'B2', 'C2']);
      for (const [a, b] of [['A', 'B'], ['A', 'C'], ['B', 'C']]) near(length(P[a + '2'], P[b + '2']) / length(P[a], P[b]), V.scale, 'corresponding side ratio');
      metric(M, 'area', area(P.A, P.B, P.C)); metric(M, 'scaledArea', area(P.A2, P.B2, P.C2));
    } else {
      near(M.scaledPerimeter / M.perimeter, M.scale, 'perimeter ratio');
      near(M.scaledArea / M.area, M.scale * M.scale, 'area ratio');
    }
  }
};

function constrainedTriangle(P, M, V) {
  ordinaryTriangle(P, M);
  const angles = [angle(P.B, P.A, P.C), angle(P.A, P.B, P.C), angle(P.A, P.C, P.B)];
  metric(M, 'a', angles[0]); metric(M, 'b', angles[1]); metric(M, 'c', angles[2]);
  if (V.mode === 'right' || V.mode === 'fixed345') perpendicular(P.A, P.B, P.A, P.C, 'right-triangle hypothesis preserved');
  if (V.mode === 'acute') assert(angles.every(a => a < 90 - 1e-8), 'all angles remain acute');
  if (V.mode === 'obtuse') assert(angles.some(a => a > 90 + 1e-8), 'an obtuse angle remains');
  if (V.mode === 'iso' || V.mode === 'equilateral') near(length(P.A, P.C), length(P.B, P.C), 'equal-side hypothesis preserved');
  if (V.mode === 'equilateral') near(length(P.A, P.B), length(P.A, P.C), 'all three sides equal');
  if (V.mode === 'fixed345') {
    near(length(P.A, P.B), 4, 'fixed side 4'); near(length(P.A, P.C), 3, 'fixed side 3'); near(length(P.B, P.C), 5, 'fixed side 5');
  }
}
function pairGeometry(P, M) {
  for (const [name, suffix] of [['first', '1'], ['second', '2']]) {
    const [a, b, c] = P[name];
    assert(area(a, b, c) > 1e-8, name + ' triangle stays nondegenerate');
    [length(a, b), length(a, c), length(b, c)].forEach((v, i) => near(M['sides' + suffix][i], v, 'pair side from coordinates'));
    [angle(b, a, c), angle(a, b, c), angle(a, c, b)].forEach((v, i) => near(M['angles' + suffix][i], v, 'pair angle from coordinates'));
    metric(M, 'area' + suffix, area(a, b, c));
  }
}
Object.assign(checks, {
  triangleExplore: constrainedTriangle,
  triangleConstructions(P, M, V) {
    constrainedTriangle(P, M, V);
    const v = P[M.vertex], a = P[M.left], b = P[M.right];
    pointNear(P.M, midpoint(a, b), 'selected median reaches the midpoint');
    perpendicular(v, P.H, a, b, 'selected altitude perpendicular');
    near(lineDistance(P.H, a, b), 0, 'altitude foot lies on opposite side line');
    near(angle(a, v, P.D), angle(P.D, v, b), 'selected bisector really bisects its angle');
    near(length(a, P.D) / length(P.D, b), length(v, a) / length(v, b), 'bisector theorem checked from lengths');
    metric(M, 'medianLeft', angle(a, v, P.M)); metric(M, 'medianRight', angle(P.M, v, b));
    metric(M, 'bisectLeft', angle(a, v, P.D)); metric(M, 'bisectRight', angle(P.D, v, b));
    for (const [n, u, w] of [['A', 'B', 'C'], ['B', 'A', 'C'], ['C', 'A', 'B']]) {
      near(lineDistance(P['H' + n], P[u], P[w]), 0, 'height foot on side line');
      perpendicular(P[n], P['H' + n], P[u], P[w], 'each height perpendicular');
      metric(M, 'h' + n, length(P[n], P['H' + n]));
    }
    pointNear(P.E, midpoint(P.A, P.C), 'first middle-line endpoint');
    pointNear(P.F, midpoint(P.B, P.C), 'second middle-line endpoint');
    parallel(P.E, P.F, P.A, P.B, 'middle line parallel to third side');
    near(2 * length(P.E, P.F), length(P.A, P.B), 'middle-line length');
  },
  triangleCenters(P, M, V) {
    constrainedTriangle(P, M, V);
    const r = length(P.O, P.A);
    near(length(P.O, P.B), r, 'circumcenter equidistant from B'); near(length(P.O, P.C), r, 'circumcenter equidistant from C');
    metric(M, 'radius', r);
    const distances = [[P.A, P.B], [P.B, P.C], [P.C, P.A]].map(([a, b]) => lineDistance(P.I, a, b));
    distances.forEach(d => near(d, distances[0], 'incenter equidistant from side lines'));
    metric(M, 'inradius', distances[0]);
    for (const [name, a, b] of [['X', 'A', 'B'], ['Y', 'B', 'C'], ['Z', 'C', 'A']]) {
      near(lineDistance(P[name], P[a], P[b]), 0, 'incircle foot on side');
      perpendicular(P.I, P[name], P[a], P[b], 'incircle radius perpendicular to side');
    }
    if (V.mode === 'equilateral') pointNear(P.O, P.I, 'equilateral centers coincide');
    if (V.mode === 'right' || V.mode === 'fixed345') pointNear(P.O, midpoint(P.B, P.C), 'right-triangle circumcenter is hypotenuse midpoint');
  },
  triangleMedianCircle(P, M) {
    ordinaryTriangle(P, M);
    pointNear(P.M, midpoint(P.A, P.B), 'given median ends at midpoint');
    near(length(P.C, P.M), length(P.A, P.M), 'given half-side median condition');
    near(angle(P.A, P.C, P.B), 90, 'right angle follows from independently measured coordinates');
    metric(M, 'angle', angle(P.A, P.C, P.B));
  },
  triangleLinkage(P, M, V) {
    near(length(P.A, P.C), V.a, 'first rigid rod retains its length');
    near(length(P.B, P.D), V.b, 'second rigid rod retains its length even when C reaches B');
    near(length(P.A, P.B), V.c, 'base retains its length');
    metric(M, 'gap', length(P.C, P.D));
    const lengths = [V.a, V.b, V.c].sort((a, b) => a - b);
    assert.equal(M.possible, lengths[0] + lengths[1] > lengths[2], 'strict closure condition');
    if (M.gap < 1e-8 && !M.possible) near(area(P.A, P.B, P.C), 0, 'impossible triangle can only close degenerately');
  },
  triangleCongruence(P, M, V) {
    pairGeometry(P, M);
    near(M.sides1[0], M.sides2[0], 'first given pair of sides equal');
    if (V.kind === 'ssa') {
      near(M.sides1[2], M.sides2[2], 'second non-adjacent given side pair equal');
      near(M.angles1[0], M.angles2[0], 'given non-included angles equal');
      assert(Math.abs(M.sides1[1] - M.sides2[1]) > 1e-5, 'ambiguous side-angle-side construction really gives different third sides');
    } else {
      near(M.sides1[1], M.sides2[1], 'second given pair equal');
      if (V.kind !== 'twoSides') {
        near(M.angles1[0], M.angles2[0], 'included angles equal');
        near(M.sides1[2], M.sides2[2], 'third sides equal by rigid construction');
      }
    }
  },
  triangleAreaPair(P, M, V) {
    pairGeometry(P, M); near(M.area1, M.area2, 'equal-area hypothesis');
    near(M.sides1[0], M.sides2[0], 'equal bases');
    if (V.congruent) M.sides1.forEach((v, i) => near(v, M.sides2[i], 'congruence preserved during rotation'));
    else near(lineDistance(P.first[2], P.first[0], P.first[1]), lineDistance(P.second[2], P.second[0], P.second[1]), 'equal heights');
  },
  triangleSimilarity(P, M, V) {
    pairGeometry(P, M);
    if (V.mode === 'isoPair') {
      near(M.sides1[1], M.sides1[2], 'first isosceles triangle'); near(M.sides2[1], M.sides2[2], 'second isosceles triangle');
    } else {
      const ratio = M.sides2[0] / M.sides1[0];
      for (let i = 0; i < 3; i++) { near(M.sides2[i] / M.sides1[i], ratio, 'similarity ratios'); near(M.angles1[i], M.angles2[i], 'corresponding angles'); }
      if (V.fixedScale) near(ratio, 2, 'fixed coefficient stays 2');
      if (V.mode === 'equilateral') M.angles1.concat(M.angles2).forEach(a => near(a, 60, 'equilateral angles'));
    }
  },
  lineRelations(P, M, V) {
    near(Math.abs(P.Q[1] - P.P[1]), V.separation, 'parallel-line separation');
    const measured = angle([P.P[0] + 1, P.P[1]], P.P, P.Q);
    metric(M, 'alpha', measured); metric(M, 'beta', 180 - measured); metric(M, 'gamma', measured);
    if (V.mode === 'perpendicular') near(measured, 90, 'transversal perpendicular to both lines');
  },
  acuteAdjacent(P, M) {
    const first = angle(P.B, P.O, P.C), second = angle(P.A, P.O, P.C);
    assert(first > 0 && first < 90, 'given angle remains acute');
    near(first + second, 180, 'adjacent angle sum');
    metric(M, 'alpha', first); metric(M, 'beta', second);
  },
  lineThroughPoint(P, M) {
    assert(P.U && P.V, 'moving line endpoints exposed for independent distance audit');
    near(lineDistance(P.P, P.U, P.V), 0, 'rotating line passes through fixed point');
    metric(M, 'distance', lineDistance(P.B, P.U, P.V));
  },
  bisectorDistance(P, M, V) {
    if (V.mode === 'perpendicular') {
      pointNear(P.M, midpoint(P.A, P.B), 'perpendicular through midpoint');
      perpendicular(P.P, P.M, P.A, P.B, 'bisector is perpendicular');
      metric(M, 'PA', length(P.P, P.A)); metric(M, 'PB', length(P.P, P.B)); near(length(P.P, P.A), length(P.P, P.B), 'equidistance');
    } else {
      near(angle(P.A, P.O, P.P), angle(P.P, P.O, P.B), 'point on angle bisector');
      near(lineDistance(P.P, P.O, P.A), lineDistance(P.P, P.O, P.B), 'equal perpendicular distances');
      metric(M, 'PH', lineDistance(P.P, P.O, P.A)); metric(M, 'PK', lineDistance(P.P, P.O, P.B));
    }
  },
  detachedAngles(P, M) {
    assert(P.A && P.B && P.C && P.D, 'angle ray endpoints exposed');
    assert(length(P.O, P.P) > 1, 'vertices really distinct');
    metric(M, 'first', angle(P.A, P.O, P.B)); metric(M, 'second', angle(P.C, P.P, P.D));
    near(angle(P.A, P.O, P.B) + angle(P.C, P.P, P.D), 180, 'sum without adjacency');
  },
  squareMeasure(P, M) {
    parallelShape(P, M, 'rectangle'); near(length(P.A, P.B), length(P.A, P.D), 'square remains square');
    metric(M, 'side', length(P.A, P.B)); metric(M, 'diagonal', length(P.A, P.C)); metric(M, 'diagonalProduct', length(P.A, P.C) * length(P.B, P.D));
  },
  quadrilateralExplore(P, M, V) {
    quadrilateral(P); metric(M, 'area', area(P.A, P.B, P.C, P.D));
    ['A', 'B', 'C', 'D'].forEach((n, i, names) => {
      near(M.sides[i], length(P[n], P[names[(i + 1) % 4]]), 'measured side');
      near(M.angles[i], angle(P[names[(i + 3) % 4]], P[n], P[names[(i + 1) % 4]]), 'measured interior angle');
    });
    if (V.mode === 'orthodiagonal') { near(length(P.A, P.C), length(P.B, P.D), 'given diagonals equal'); perpendicular(P.A, P.C, P.B, P.D, 'given diagonals perpendicular'); }
    if (V.mode === 'hinge' || V.mode === 'cyclic') {
      const { O, ...vertices } = P;
      parallelShape(vertices, M, 'parallelogram');
      near(length(P.A, P.B), 6, 'hinged side stays 6'); near(length(P.A, P.D), 4, 'hinged side stays 4');
    }
    if (V.mode === 'free') perpendicular(P.A, P.B, P.A, P.D, 'one given angle remains right');
    if (V.mode === 'cyclic') {
      near(length(P.O, P.A), length(P.O, P.B), 'circle through A and B'); near(length(P.O, P.A), length(P.O, P.D), 'circle through D');
      metric(M, 'OC', length(P.O, P.C));
    }
  },
  diagonalOverlay(P, M, V) {
    parallelShape(P, {}, V.rectangle ? 'rectangle' : 'parallelogram');
    near(length(P.E, P.F), length(P.A, P.B), 'rotated first side'); near(length(P.F, P.G), length(P.B, P.C), 'rotated second side'); near(length(P.G, P.E), length(P.C, P.A), 'rotated third side');
    metric(M, 'area', area(P.E, P.F, P.G));
    metric(M, 'mismatch', length(P.E, P.C) + length(P.F, P.D) + length(P.G, P.A));
    if (V.turn === 1) { pointNear(P.E, P.C, 'half-turn first vertex'); pointNear(P.F, P.D, 'half-turn second vertex'); pointNear(P.G, P.A, 'half-turn third vertex'); }
  },
  polygonFan(P, M, V) {
    const pts = Object.values(P), n = pts.length;
    assert.equal(n, V.n, 'polygon vertex count');
    const measured = pts.map((p, i) => angle(pts[(i + n - 1) % n], p, pts[(i + 1) % n]));
    assert(measured.every(a => a > 0 && a < 180), 'polygon stays convex');
    near(measured.reduce((a, b) => a + b, 0), 180 * (n - 2), 'independent polygon sum');
    metric(M, 'sum', measured.reduce((a, b) => a + b, 0));
    measured.forEach((a, i) => near(M.angles[i], a, 'polygon angle'));
    pts.forEach((p, i) => near(M.sides[i], length(p, pts[(i + 1) % n]), 'polygon side'));
    if (V.mode === 'regular') { measured.forEach(a => near(a, measured[0], 'regular polygon angles')); M.sides.forEach(s => near(s, M.sides[0], 'regular polygon sides')); }
    if (V.fixedN) assert.equal(n, V.fixedN, 'fixed number of vertices');
  },
  coordinateMeasure(P, M, V) {
    pointNear(P.M, midpoint(P.A, P.B), 'coordinate midpoint');
    metric(M, 'length', length(P.A, P.B)); metric(M, 'AM', length(P.A, P.M)); metric(M, 'MB', length(P.M, P.B));
    if (V.mode !== 'midpoint') { near(P.A[1], P.B[1], 'points on coordinate line'); metric(M, 'difference', P.B[0] - P.A[0]); }
  },
  rhombusArea(P, M) {
    parallelShape(P, M, 'rhombus');
    metric(M, 'triangleArea', area(P.A, P.B, P.O));
    const xs = ['A', 'B', 'C', 'D'].map(n => P[n][0]), ys = ['A', 'B', 'C', 'D'].map(n => P[n][1]);
    metric(M, 'rectangleArea', (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)));
  },
  equalPerimeters(P, M) {
    parallelShape(P, M, 'rectangle');
    near(length(P.A, P.B) + length(P.B, P.C) + length(P.C, P.D) + length(P.D, P.A), 24, 'fixed perimeter hypothesis');
  }
});

function circleQuadrilateral(P, M, V, rhombus) {
  const { O, ...vertices } = P;
  parallelShape(vertices, {}, rhombus ? 'rhombus' : 'rectangle');
  for (const [foot, a, b] of [['E', 'A', 'B'], ['F', 'B', 'C'], ['G', 'C', 'D'], ['H', 'D', 'A']]) {
    near(lineDistance(P[foot], P[a], P[b]), 0, 'foot on side line');
    perpendicular(O, P[foot], P[a], P[b], 'radius to foot perpendicular');
    metric(M, 'O' + foot, lineDistance(O, P[a], P[b]));
    metric(M, a + b, length(P[a], P[b]));
  }
  for (const n of ['A', 'B', 'C', 'D']) metric(M, 'O' + n, length(O, P[n]));
  metric(M, 'angle', angle(P.B, P.A, P.D));
  metric(M, 'oppositeAngleSum', angle(P.B, P.A, P.D) + angle(P.B, P.C, P.D));
  if (V.mode === 'circumcircle') {
    for (const n of rhombus ? ['A', 'B', 'D'] : ['A', 'B', 'C', 'D']) near(length(O, P[n]), M.radius, 'constructed circle through required vertices');
  } else {
    pointNear(O, midpoint(P.A, P.C), 'inscribed-circle candidate is symmetry center');
    const distances = ['E', 'F', 'G', 'H'].map(n => length(O, P[n]));
    near(M.radius, Math.min(...distances), 'circle does not cross a side');
    if (rhombus) distances.forEach(d => near(d, M.radius, 'incircle touches every rhombus side'));
  }
}
Object.assign(checks, {
  circleRadii(P, M, V) {
    for (const n of ['A', 'B', 'C', 'D']) if (P[n]) near(length(P.O, P[n]), M.radius, 'all named endpoints on circle');
    for (const edge of ['OA', 'OB', 'AB', 'CD']) if (P[edge[0]] && P[edge[1]]) metric(M, edge, length(P[edge[0]], P[edge[1]]));
    if (V.mode !== 'radii') { pointNear(P.O, midpoint(P.A, P.B), 'diameter through center'); near(length(P.A, P.B), 2 * M.radius, 'diameter length'); }
    if (V.mode === 'twoDiameters') pointNear(P.O, midpoint(P.C, P.D), 'second diameter shares center');
  },
  circleLine(P, M, V) {
    near(lineDistance(P.M, P.U, P.V), 0, 'perpendicular foot on moving line');
    perpendicular(P.O, P.M, P.U, P.V, 'center-to-line distance perpendicular');
    metric(M, 'distance', lineDistance(P.O, P.U, P.V));
    if (V.mode === 'secant') {
      assert(M.distance < M.radius, 'secant passes through interior');
      for (const n of ['A', 'B']) { near(length(P.O, P[n]), M.radius, 'intersection lies on circle'); near(lineDistance(P[n], P.U, P.V), 0, 'intersection lies on line'); }
      assert(length(P.A, P.B) > 1e-8, 'two distinct intersections');
      metric(M, 'AB', length(P.A, P.B)); assert.equal(M.intersections, 2);
    } else {
      near(length(P.O, P.T), M.radius, 'tangency point on circle');
      near(lineDistance(P.T, P.U, P.V), 0, 'tangency point on line');
      near(M.distance, M.radius, 'line has one intersection');
      near(angle(P.O, P.T, P.V), 90, 'tangent perpendicular to radius');
      metric(M, 'angle', angle(P.O, P.T, P.V)); assert.equal(M.intersections, 1);
    }
  },
  circleTangents(P, M) {
    assert(length(P.O, P.P) > M.radius, 'given point stays outside circle');
    for (const n of ['A', 'B']) { near(length(P.O, P[n]), M.radius, 'touch point on circle'); perpendicular(P.O, P[n], P.P, P[n], 'tangent perpendicular'); metric(M, 'P' + n, length(P.P, P[n])); metric(M, 'angle' + n, angle(P.O, P[n], P.P)); }
    near(length(P.P, P.A), length(P.P, P.B), 'two tangent segments equal');
    metric(M, 'OP', length(P.O, P.P)); assert.equal(M.tangents, 2);
  },
  circlePair(P, M, V) {
    const d = length(P.O1, P.O2), low = Math.abs(M.radius - M.other), high = M.radius + M.other;
    metric(M, 'distance', d);
    const count = d > high + 1e-8 || d < low - 1e-8 ? 0 : Math.abs(d - high) < 1e-8 || Math.abs(d - low) < 1e-8 ? 1 : 2;
    assert.equal(M.intersections, count, 'circle intersections independently classified from center distance');
    if (count) { near(length(P.O1, P.P), M.radius, 'intersection on first circle'); near(length(P.O2, P.P), M.other, 'intersection on second circle'); metric(M, 'O1P', length(P.O1, P.P)); metric(M, 'O2P', length(P.O2, P.P)); }
    if (count === 2) { assert(length(P.P, P.Q) > 1e-8); near(length(P.O1, P.Q), M.radius, 'other intersection on first circle'); near(length(P.O2, P.Q), M.other, 'other intersection on second circle'); }
    if (V.mode === 'intersecting') assert.equal(count, 2, 'two-intersection premise preserved');
    if (V.mode === 'greater') assert(M.radius > M.other, 'greater-radius premise preserved');
  },
  circleCenter(P, M) {
    for (const n of ['A', 'B', 'C', 'D']) { near(length(P.O, P[n]), M.radius, 'four circumference points'); metric(M, 'P' + n, length(P.P, P[n])); }
    const distances = ['A', 'B', 'C', 'D'].map(n => length(P.P, P[n]));
    near(M.spread, Math.max(...distances) - Math.min(...distances), 'spread measured from points');
    assert.equal(M.spread < 1e-8, length(P.O, P.P) < 1e-8, 'only the actual center is equidistant');
  },
  radiusChord(P, M) {
    for (const n of ['A', 'B', 'T']) near(length(P.O, P[n]), M.radius, 'radius/chord endpoint on circle');
    near(length(P.A, P.M) + length(P.M, P.B), length(P.A, P.B), 'M lies on chord segment');
    near(length(P.O, P.M) + length(P.M, P.T), length(P.O, P.T), 'M lies on radius segment');
    for (const edge of ['AM', 'MB', 'OT']) metric(M, edge, length(P[edge[0]], P[edge[1]]));
    metric(M, 'angle', angle(P.O, P.M, P.A));
  },
  equalCircleChords(P, M) {
    for (const n of ['A', 'B', 'C', 'D']) near(length(P.O, P[n]), M.radius, 'equal chord endpoints on circle');
    near(length(P.A, P.B), length(P.C, P.D), 'equal-chord premise');
    for (const [n, a, b] of [['M', 'A', 'B'], ['N', 'C', 'D']]) {
      pointNear(P[n], midpoint(P[a], P[b]), 'perpendicular foot on chord midpoint');
      perpendicular(P.O, P[n], P[a], P[b], 'distance measured perpendicularly');
      metric(M, 'O' + n, lineDistance(P.O, P[a], P[b])); metric(M, 'angle' + n, angle(P.O, P[n], P[a]));
    }
    near(lineDistance(P.O, P.A, P.B), lineDistance(P.O, P.C, P.D), 'equal chord distances');
    metric(M, 'AB', length(P.A, P.B)); metric(M, 'CD', length(P.C, P.D));
  },
  circleRectangle(P, M, V) { circleQuadrilateral(P, M, V, false); },
  circleRhombus(P, M, V) { circleQuadrilateral(P, M, V, true); },
  circleMeasure(P, M) {
    const r = length(P.O, P.A);
    metric(M, 'radius', r); metric(M, 'diameter', 2 * r); metric(M, 'area', Math.PI * r ** 2);
    metric(M, 'length', length(P.U, P.V)); near(length(P.U, P.V), 2 * Math.PI * r, 'unrolled circumference length');
    metric(M, 'areaRatio', r ** 2);
  }
});

function variants(hint) {
  const initial = { ...(hint.params || {}) };
  const controls = visuals.controlsFor(hint.model, initial);
  const result = [initial];
  for (const c of controls) for (const value of [c.min, (c.min + c.max) / 2, c.max]) result.push({ ...initial, [c.key]: value });
  // Joint extremes find dependent-bound failures that isolated slider tests miss.
  if (controls.length <= 6) result.push(...controls.reduce((all, c) => all.flatMap(p => [{ ...p, [c.key]: c.min }, { ...p, [c.key]: c.max }]), [initial]));
  return result;
}
function verify(card, params) {
  const name = card.hint.model, s = visuals.sample(name, params);
  assert.equal(s.model, name, card.id + ': explicit model identity');
  finiteTree(s, card.id);
  assert(s.points && s.metrics && s.values, card.id + ': public geometric sample');
  for (const [n, p] of Object.entries(s.points)) {
    const ps = Array.isArray(p[0]) ? p : [p];
    assert(ps.every(q => Array.isArray(q) && q.length === 2 && q.every(Number.isFinite)), card.id + ': finite point(s) ' + n);
  }
  assert(checks[name], card.id + ': model needs an independent geometry audit: ' + name);
  checks[name](s.points, s.metrics, s.values, card);
  return s;
}

test('all 233 statements offer genuine bounded geometric manipulation', () => {
  assert.equal(data.cards.length, 233);
  for (const card of data.cards) {
    assert(card.hint.model, card.id + ': no passive SVG fallback');
    assert(visuals.modelNames.includes(card.hint.model), card.id + ': known model');
    const controls = visuals.controlsFor(card.hint.model, card.hint.params);
    assert(controls.length > 0, card.id + ': at least one meaningful action');
    for (const c of controls) {
      assert(c.key && c.label && Number.isFinite(c.min) && Number.isFinite(c.max) && c.max > c.min, card.id + ': usable control range');
      assert(Number.isFinite(c.step) && c.step > 0, card.id + ': positive keyboard step');
    }
    const samples = variants(card.hint).map(p => verify(card, p));
    const states = new Set(samples.map(s => JSON.stringify({ points: s.points, metrics: s.metrics })));
    assert(states.size > 1, card.id + ': controls change geometry or measurable quantities, not just raw parameters');
  }
});

function cardSamples(id) {
  const card = byId.get(id); assert(card, 'known statement ' + id);
  return variants(card.hint).map(p => verify(card, p));
}
const triangleSides = P => [length(P.A, P.B), length(P.A, P.C), length(P.B, P.C)];
const triangleAngles = P => [angle(P.B, P.A, P.C), angle(P.A, P.B, P.C), angle(P.A, P.C, P.B)];
const isSquare = P => Math.abs(length(P.A, P.B) - length(P.B, P.C)) < 1e-7 && Math.abs(angle(P.B, P.A, P.D) - 90) < 1e-7;

test('median converse and right-triangle median retain the same exact givens while C moves', () => {
  for (const id of ['prev-018', 'prev-019', 'prev-088']) {
    const samples = cardSamples(id);
    for (const {points: P} of samples) {
      pointNear(P.M, midpoint(P.A, P.B), id + ': midpoint');
      near(length(P.C, P.M), length(P.A, P.B) / 2, id + ': given median equals half-side');
      near(angle(P.A, P.C, P.B), 90, id + ': measured consequence');
    }
    assert(new Set(samples.map(s => s.points.C.join(','))).size > 2, id + ': C has multiple positions');
  }
});

test('isosceles bisector counterexamples keep the hypothesis and offer a base vertex', () => {
  for (const id of ['prev-024', 'isosceles_all_bisectors_are_medians', 'isosceles_all_bisectors_are_altitudes']) {
    const samples = cardSamples(id);
    let nonMedian = false, nonAltitude = false;
    for (const {points: P, metrics: M} of samples) {
      near(length(P.A, P.C), length(P.B, P.C), id + ': isosceles');
      const V = P[M.vertex], A = P[M.left], B = P[M.right];
      near(angle(A, V, P.D), angle(P.D, V, B), id + ': true angle bisector');
      if (Math.abs(length(A, P.D) - length(B, P.D)) > .01) nonMedian = true;
      if (Math.abs(angle(V, P.D, A) - 90) > .01) nonAltitude = true;
    }
    assert(nonMedian && nonAltitude, id + ': reachable valid counterexample from a base vertex');
    assert(visuals.controlsFor(byId.get(id).hint.model, byId.get(id).hint.params).some(c => c.key === 'from'), id + ': pupil can choose vertex');
  }
});

test('triangle type hypotheses survive every exposed control combination', () => {
  for (const id of ['reference-015', 'summer-052']) for (const s of cardSamples(id)) assert(triangleAngles(s.points).every(a => a < 90), id + ': remains acute');
  for (const id of ['reference-018', 'obtuse_triangle_all_obtuse']) for (const s of cardSamples(id)) {
    const angles = triangleAngles(s.points); assert(angles.filter(a => a > 90).length === 1, id + ': exactly one obtuse angle'); assert(angles.filter(a => a < 90).length === 2, id + ': two acute angles');
  }
  for (const s of cardSamples('reference-019')) near(length(s.points.A, s.points.C), length(s.points.B, s.points.C), 'isosceles premise');
  assert(cardSamples('reference-019').some(s => triangleAngles(s.points).some(a => a > 90)), 'isosceles model can refute every-isosceles-is-acute');
  for (const s of cardSamples('equilateral_altitudes_equal')) {
    const P = s.points; near(length(P.A, P.B), length(P.A, P.C), 'equilateral hypothesis'); near(length(P.A, P.B), length(P.B, P.C), 'third side');
    near(length(P.A, P.HA), length(P.B, P.HB), 'two heights'); near(length(P.A, P.HA), length(P.C, P.HC), 'third height');
  }
});

test('SSA and equal-area counterexamples are valid non-congruent triangles', () => {
  for (const id of ['prev-026', 'reference-047']) for (const {points: P} of cardSamples(id)) {
    const [a,b,c] = P.first, [d,e,f] = P.second;
    near(length(a,b), length(d,e), id + ': first side'); near(length(b,c), length(e,f), id + ': second side');
    near(angle(b,a,c), angle(e,d,f), id + ': non-included angle');
    const left = [length(a,b),length(a,c),length(b,c)].sort((x,y)=>x-y), right = [length(d,e),length(d,f),length(e,f)].sort((x,y)=>x-y);
    assert(left.some((v,i)=>Math.abs(v-right[i])>.01), id + ': cannot match by relabelling');
  }
  for (const id of ['prev-031', 'prev-094']) {
    let witness = false;
    for (const {points: P} of cardSamples(id)) {
      near(area(...P.first), area(...P.second), id + ': equal areas');
      const sides = T => [length(T[0],T[1]),length(T[1],T[2]),length(T[2],T[0])].sort((a,b)=>a-b), a=sides(P.first), b=sides(P.second);
      witness ||= a.some((v,i)=>Math.abs(v-b[i])>.01);
    }
    assert(witness, id + ': unequal shape at equal area');
  }
});

test('triangle linkage keeps rigid lengths at coincident endpoints and strict inequality', () => {
  const s = visuals.sample('triangleLinkage', {a:3,b:2,c:3,turn:0,fixedLengths:false});
  near(length(s.points.A,s.points.C),3,'first rod'); near(length(s.points.B,s.points.D),2,'second rod is not collapsed');
  for (const id of ['prev-038', 'tri_1_2_4_exists', 'tri_2_4_6_not_exist', 'reference-026']) {
    const card = byId.get(id), expected = card.hint.params;
    const controls = visuals.controlsFor(card.hint.model, expected);
    assert(controls.every(c=>c.key==='turn'), id + ': given lengths cannot be changed');
    for (const {points:P,metrics:M} of cardSamples(id)) {
      near(length(P.A,P.C),expected.a,id+': first given length'); near(length(P.B,P.D),expected.b,id+': second given length'); near(length(P.A,P.B),expected.c,id+': given base');
      assert.equal(M.possible,false,id+': no nondegenerate closure');
    }
  }
});

test('quad counterexamples retain equal perpendicular diagonals and can be non-squares', () => {
  for (const id of ['prev-071', 'equidiagonal_orthogonal_quadrilateral_square']) {
    const samples=cardSamples(id);
    for (const {points:P} of samples) { near(length(P.A,P.C),length(P.B,P.D),id+': equal diagonals'); perpendicular(P.A,P.C,P.B,P.D,id+': perpendicular diagonals'); }
    assert(samples.some(s=>!isSquare(s.points)),id+': a non-square witness exists');
  }
  for (const id of ['prev-067','prev-070']) for (const {points:P} of cardSamples(id)) near(angle(P.B,P.A,P.D),90,id+': right angle premise locked');
  for (const card of data.cards.filter(c=>c.hint.model==='squareMeasure')) for (const s of cardSamples(card.id)) assert(isSquare(s.points),card.id+': square premise');
});

test('trapezoid qualifiers preserve equal legs or both given right angles', () => {
  for(const id of ['prev-064','prev-065','summer-021','isosceles_trapezoid_bases_equal']) for(const {points:P} of cardSamples(id)) {
    near(length(P.A,P.D),length(P.B,P.C),id+': equal legs'); near(length(P.A,P.C),length(P.B,P.D),id+': equal diagonals');
  }
  for(const {points:P} of cardSamples('reference-082')) { near(angle(P.B,P.A,P.D),90,'right trapezoid at A'); near(angle(P.A,P.D,P.C),90,'right trapezoid at D'); }
});

test('circle counterexamples retain intersections, radius ordering and chord givens', () => {
  const intersections=cardSamples('circle_intersection_point_equidistant_centers');
  assert(intersections.every(s=>s.metrics.intersections===2),'actual intersection required in every configuration');
  assert(intersections.some(s=>Math.abs(length(s.points.O1,s.points.P)-length(s.points.O2,s.points.P))>.01),'intersection not equidistant when radii differ');
  const bigger=cardSamples('circles_intersect_if_radius_bigger');
  assert(bigger.every(s=>s.metrics.radius>s.metrics.other),'first radius always larger'); assert(bigger.some(s=>s.metrics.intersections===0),'valid disjoint witness');
  assert(cardSamples('summer-063').some(({points:P})=>Math.abs(length(P.A,P.M)-length(P.M,P.B))>.01),'radius crossing does not always bisect chord');
  assert(cardSamples('prev-086').some(({points:P})=>Math.abs(length(P.A,P.B)+length(P.C,P.D)-length(P.B,P.C)-length(P.D,P.A))>.01),'non-tangential quadrilateral witness by necessary opposite-side sums');
  assert(cardSamples('prev-087').some(({points:P})=>Math.abs(angle(P.B,P.A,P.D)+angle(P.B,P.C,P.D)-180)>.01),'non-cyclic quadrilateral witness by opposite angles');
});

test('circle tangencies with decimal radii are one point, not a rounding artefact', () => {
  for(let tenth=10;tenth<=30;tenth++) {
    const other=tenth/10;
    for(const distance of [4-other,4+other]) {
      const s=visuals.sample('circlePair',{mode:'free',other,distance});
      assert.equal(s.metrics.intersections,1,`tangent circles r=4, R=${other}, d=${distance}`);
      near(length(s.points.O1,s.points.P),4,'first radius at tangency'); near(length(s.points.O2,s.points.P),other,'second radius at tangency');
    }
  }
});

test('three-parallel statements expose three actual parallel lines and no transversal', () => {
  for(const id of ['two_parallel_to_third_parallel','two_parallel_to_third_perpendicular']) {
    const card=byId.get(id), controls=visuals.controlsFor(card.hint.model,card.hint.params);
    assert(!controls.some(c=>c.key==='angle'),id+': no unrelated transversal control');
    for(const {points:P} of cardSamples(id)) {
      assert(['L1','R1','L2','R2','L3','R3'].every(n=>P[n]),id+': all three lines exposed');
      parallel(P.L1,P.R1,P.L2,P.R2,id+': first and second'); parallel(P.L1,P.R1,P.L3,P.R3,id+': first and third');
      assert(lineDistance(P.L2,P.L1,P.R1)>0&&lineDistance(P.L3,P.L1,P.R1)>0&&lineDistance(P.L3,P.L2,P.R2)>0,id+': three distinct lines');
    }
  }
});

module.exports = { near, pointNear, length, area, angle, dot, cross, subtract, midpoint, lineDistance, parallel, perpendicular, checks, variants, verify, byId };
