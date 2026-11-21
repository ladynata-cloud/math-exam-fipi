'use strict';

// Independent section oracle: intersect the cutting plane with pairs of solid
// face planes, then retain points satisfying every solid half-space. This does
// not import the renderer's finite-edge intersection or its polygon ordering.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../stereo-course/sections/assets/app.js'), 'utf8');
const marker = '/* Pure data and exact-coordinate activities. No network, eval or dependencies. */';
const start = source.indexOf(marker);
const terminator = "})(typeof window!=='undefined'?window:globalThis);";
const end = source.indexOf(terminator, start);
assert(start >= 0 && end > start, 'canonical pure laboratory module exists');
const context = vm.createContext({ module: { exports: {} } });
vm.runInContext(source.slice(start, end + terminator.length), context, { timeout: 1000 });
const activities = context.module.exports;
const plain = value => JSON.parse(JSON.stringify(value));
const EPS = 2e-9;
const near = (a, b, message, tolerance = EPS) => assert(Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b)), `${message}: ${a} != ${b}`);
const minus = (a, b) => a.map((value, i) => value - b[i]);
const sum = (a, b) => a.map((value, i) => value + b[i]);
const times = (a, value) => a.map(component => component * value);
const scalar = (a, b) => a.reduce((value, component, i) => value + component * b[i], 0);
const vector = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const length = a => Math.hypot(...a);
const distance = (a, b) => length(minus(a, b));
const determinant = rows => scalar(rows[0], vector(rows[1], rows[2]));
const samePoint = (a, b) => distance(a, b) <= EPS;
const edgeKey = (a, b) => [a, b].sort().join('|');

function solid(kind, height = 1) {
  if (kind === 'tetra') return {
    points: { A: [0, 0, 0], B: [1, 0, 0], C: [0, 1, 0], S: [0, 0, 1] },
    faces: [['A', 'B', 'C'], ['A', 'B', 'S'], ['B', 'C', 'S'], ['A', 'C', 'S']],
    edges: [['A', 'B'], ['A', 'C'], ['B', 'C'], ['A', 'S'], ['B', 'S'], ['C', 'S']]
  };
  if (kind === 'pyramid') return {
    points: { A: [-1, -1, 0], B: [-1, 1, 0], C: [1, 1, 0], D: [1, -1, 0], S: [0, 0, 2] },
    faces: [['A', 'B', 'C', 'D'], ['A', 'B', 'S'], ['B', 'C', 'S'], ['C', 'D', 'S'], ['D', 'A', 'S']],
    edges: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A', 'S'], ['B', 'S'], ['C', 'S'], ['D', 'S']]
  };
  const shift = kind === 'oblique' ? 0.5 : 0;
  return {
    points: { A: [0, 0, 0], B: [0, 1, 0], C: [1, 1, 0], D: [1, 0, 0],
      A1: [shift, 0, height], B1: [shift, 1, height], C1: [1 + shift, 1, height], D1: [1 + shift, 0, height] },
    faces: [['A', 'B', 'C', 'D'], ['A1', 'B1', 'C1', 'D1'], ['A', 'B', 'B1', 'A1'],
      ['B', 'C', 'C1', 'B1'], ['C', 'D', 'D1', 'C1'], ['D', 'A', 'A1', 'D1']],
    edges: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A1', 'B1'], ['B1', 'C1'],
      ['C1', 'D1'], ['D1', 'A1'], ['A', 'A1'], ['B', 'B1'], ['C', 'C1'], ['D', 'D1']]
  };
}

const families = [
  { id: 'cube-sum', kind: 'cube', normal: [1, 1, 1] },
  { id: 'cube-weighted', kind: 'cube', normal: [2, 3, 4] },
  { id: 'cube-horizontal', kind: 'cube', normal: [0, 0, 1] },
  { id: 'tetra-parallel', kind: 'tetra', normal: [0, 0, 1] },
  { id: 'tetra-oblique', kind: 'tetra', normal: [1, -1, 1] },
  { id: 'pyramid-parallel', kind: 'pyramid', normal: [0, 0, 1] },
  { id: 'pyramid-vertical', kind: 'pyramid', normal: [1, 0, 0] },
  { id: 'oblique-normal', kind: 'oblique', normal: [0.5, 0, 1], heights: [0.2, 0.49, 0.5, 0.51, 0.8, 1, 1.5] }
];

function halfspaces(body) {
  const vertices = Object.values(body.points);
  const center = times(vertices.reduce(sum, [0, 0, 0]), 1 / vertices.length);
  return body.faces.map(names => {
    const [a, b, c] = names.map(name => body.points[name]);
    let normal = vector(minus(b, a), minus(c, a));
    normal = times(normal, 1 / length(normal));
    if (scalar(normal, minus(center, a)) > 0) normal = times(normal, -1);
    return { names, normal, bound: scalar(normal, a) };
  });
}

function solve(rows, values) {
  const det = determinant(rows);
  if (Math.abs(det) < 1e-12) return null;
  return [0, 1, 2].map(column => determinant(rows.map((row, i) => row.map((value, j) => j === column ? values[i] : value))) / det);
}

function oracle(body, normal, level) {
  const planes = halfspaces(body), points = [];
  for (let i = 0; i < planes.length; i++) for (let j = i + 1; j < planes.length; j++) {
    const candidate = solve([normal, planes[i].normal, planes[j].normal], [level, planes[i].bound, planes[j].bound]);
    if (candidate && planes.every(face => scalar(face.normal, candidate) <= face.bound + EPS) &&
        !points.some(point => samePoint(point, candidate))) points.push(candidate);
  }
  let dimension = points.length ? 0 : -1;
  if (points.length > 1) dimension = 1;
  if (points.length > 2) {
    const a = minus(points[1], points[0]);
    if (points.slice(2).some(point => {
      const b = minus(point, points[0]);
      return length(vector(a, b)) > 1e-8 * length(a) * length(b);
    })) dimension = 2;
  }
  // Independent monotone-chain hull in a projection with nonzero area.
  const omitted = normal.reduce((best, value, i) => Math.abs(value) > Math.abs(normal[best]) ? i : best, 0);
  const axes = [0, 1, 2].filter(axis => axis !== omitted);
  const ordered = points.slice().sort((a, b) => a[axes[0]] - b[axes[0]] || a[axes[1]] - b[axes[1]]);
  const turn = (a, b, c) => (b[axes[0]] - a[axes[0]]) * (c[axes[1]] - a[axes[1]]) - (b[axes[1]] - a[axes[1]]) * (c[axes[0]] - a[axes[0]]);
  const chain = input => {
    const out = [];
    for (const point of input) {
      while (out.length > 1 && turn(out.at(-2), out.at(-1), point) <= 0) out.pop();
      out.push(point);
    }
    return out;
  };
  const polygon = dimension === 2 ? chain(ordered).slice(0, -1).concat(chain(ordered.slice().reverse()).slice(0, -1)) : points;
  let area = 0, perimeter = 0;
  if (dimension === 2) {
    const vectorArea = polygon.reduce((total, point, i) => sum(total, vector(point, polygon[(i + 1) % polygon.length])), [0, 0, 0]);
    area = length(vectorArea) / 2;
    perimeter = polygon.reduce((total, point, i) => total + distance(point, polygon[(i + 1) % polygon.length]), 0);
  }
  const extrema = Object.values(body.points).map(point => scalar(normal, point));
  const inside = Math.min(...extrema) < level - EPS && level < Math.max(...extrema) - EPS;
  return { points, polygon, dimension, inside, area, perimeter, planes };
}

function assertLab(family, height, level) {
  const label = `${family.id}, h=${height}, level=${level}`;
  const normal = family.kind === 'oblique' ? [0.5, 0, height] : family.normal;
  const body = solid(family.kind, height), expected = oracle(body, normal, level);
  const actual = plain(activities.makeLab(family.id, level, height));
  assert.deepEqual(actual.normal, normal, label + ': authored plane');
  for (const [name, point] of Object.entries(body.points)) assert.deepEqual(actual.model.points[name], point, label + ': vertex ' + name);
  assert.deepEqual(actual.model.edges.map(edge => edgeKey(...edge)).sort(), body.edges.map(edge => edgeKey(...edge)).sort(), label + ': exact finite edges');
  const points = actual.polygon.map(name => actual.model.points[name]);
  assert.equal(new Set(actual.polygon).size, points.length, label + ': no repeated vertex name');
  assert.equal(points.length, expected.points.length, label + ': complete finite intersection');
  for (const point of points) {
    assert(point.every(Number.isFinite), label + ': finite coordinates');
    assert(expected.points.some(candidate => samePoint(point, candidate)), label + ': section point inside all half-spaces');
    near(scalar(normal, point), level, label + ': section plane');
  }
  assert.equal(actual.dimension, expected.dimension, label + ': affine dimension');
  assert.equal(actual.inside, expected.inside, label + ': proper cut versus supporting plane');
  near(actual.area, expected.area, label + ': area');
  near(actual.perimeter, expected.perimeter, label + ': perimeter');
  const classification = expected.dimension < 0 ? 'Пустое пересечение' : expected.dimension === 0 ? 'Касание в точке' :
    expected.dimension === 1 ? 'Касание по отрезку' : expected.inside ? 'Внутреннее сечение · сторон: ' + expected.polygon.length : 'Опорное пересечение: совпадение с гранью';
  assert.equal(actual.classification, classification, label + ': visible classification');
  assert.equal(actual.steps.length, body.faces.length, label + ': every face is inspected');
  const polygonIndex = point => expected.polygon.findIndex(candidate => samePoint(point, candidate));
  const visibleSides = new Set();
  for (const step of actual.steps) {
    const plane = actual.model.faces.find(face => face.id === step.plane);
    assert(plane, label + ': named working face');
    const expectedFace = expected.planes.find(face => [...face.names].sort().join('|') === [...plane.vertices].sort().join('|'));
    assert(expectedFace, label + ': actual face is canonical');
    for (const name of step.points) {
      near(scalar(expectedFace.normal, actual.model.points[name]), expectedFace.bound, label + ': step point in working face');
      near(scalar(normal, actual.model.points[name]), level, label + ': step point in cutting plane');
    }
    for (const segment of step.segments) {
      const a = actual.model.points[segment.a], b = actual.model.points[segment.b];
      assert(distance(a, b) > EPS, label + ': no zero-length edge');
      for (const point of [a, b]) {
        near(scalar(expectedFace.normal, point), expectedFace.bound, label + ': segment in its working face');
        near(scalar(normal, point), level, label + ': segment in cutting plane');
        assert(expected.planes.every(face => scalar(face.normal, point) <= face.bound + EPS), label + ': segment endpoints are finite');
      }
      assert.equal(segment.kind, 'section', label + ': lab boundary role');
      if (expected.dimension === 2) visibleSides.add(edgeKey(polygonIndex(a), polygonIndex(b)));
    }
  }
  if (expected.dimension === 2) {
    const boundary = new Set(expected.polygon.map((_, i) => edgeKey(i, (i + 1) % expected.polygon.length)));
    assert.deepEqual([...visibleSides].sort(), [...boundary].sort(), label + ': exact closed boundary, no missing side or diagonal');
  }
  assert.equal(actual.edgeRows.length, body.edges.length, label + ': table covers every edge');
  const display = name => name.replace(/\d/g, digit => '₀₁₂₃₄₅₆₇₈₉'[Number(digit)]);
  for (const [a, b] of body.edges) {
    const direct = actual.edgeRows.find(row => row.edge === display(a + b));
    const row = direct || actual.edgeRows.find(row => row.edge === display(b + a));
    assert(row, label + ': edge-table row ' + a + b);
    const va = scalar(normal, body.points[direct ? a : b]), vb = scalar(normal, body.points[direct ? b : a]);
    near(row.from, va, label + ': table start'); near(row.to, vb, label + ': table end');
    if (Math.abs(vb - va) < EPS) {
      assert.equal(row.parameter, null, label + ': parallel edge has no division by zero');
      assert.equal(row.coplanar, Math.abs(level - va) < EPS, label + ': whole edge or no edge');
    } else near(row.parameter, (level - va) / (vb - va), label + ': edge parameter');
  }
  if (family.kind === 'oblique') {
    near(actual.normalInfo.low, 0.5, label + ': lower normal-section threshold');
    near(actual.normalInfo.high, 0.25 + height ** 2, label + ': upper normal-section threshold');
    assert.equal(actual.normalInfo.exists, height >= 0.5, label + ': normal-section feasibility');
    const parameters = ['A', 'B', 'C', 'D'].map(name => (level - 0.5 * body.points[name][0]) / (0.25 + height ** 2));
    actual.normalInfo.parameters.forEach((value, i) => near(value, parameters[i], label + ': lateral edge parameter'));
    assert.equal(actual.normalInfo.full, parameters.every(value => value >= -EPS && value <= 1 + EPS), label + ': all four finite lateral edges');
  }
  if (family.id === 'tetra-parallel' && level >= 0 && level <= 1) {
    const k = 1 - level;
    actual.extra.forEach((row, i) => near(row.value, [k, 0.5 * k ** 2, k ** 3 / 6][i], label + ': similarity quantity'));
    assert.equal(actual.extra.length, 3, label + ': length, area and volume');
  }
  if (family.id === 'pyramid-parallel' && level >= 0 && level <= 2) {
    const k = (2 - level) / 2;
    actual.extra.forEach((row, i) => near(row.value, [k, 4 * k ** 2, 8 * k ** 3 / 3][i], label + ': similarity quantity'));
    assert.equal(actual.extra.length, 3, label + ': length, area and volume');
  }
  return expected;
}

test('all eight published laboratory families retain their intended solids and normals', () => {
  assert.deepEqual(plain(activities.labFamilies).map(family => family.id), families.map(family => family.id));
  for (const family of families) assert.equal(activities.labFamilies.find(item => item.id === family.id).kind, family.kind);
});

for (const family of families) test(family.id + ': independent half-space intersections at every critical level, either side and interval', () => {
  const seen = new Set(); let samples = 0;
  for (const height of family.heights || [1]) {
    const body = solid(family.kind, height), normal = family.kind === 'oblique' ? [0.5, 0, height] : family.normal;
    const critical = [...new Set(Object.values(body.points).map(point => Number(scalar(normal, point).toFixed(10))))].sort((a, b) => a - b);
    const bounds = plain(activities.labBounds(family.id, height));
    assert.deepEqual(bounds.critical, critical, `${family.id}, h=${height}: exact vertex levels`);
    assert(bounds.min < critical[0] && bounds.max > critical.at(-1), family.id + ': both empty exterior regions are reachable');
    const delta = 1e-6 * Math.max(1, critical.at(-1) - critical[0]);
    const levels = new Set([bounds.min, bounds.max, ...critical.flatMap(level => [level - delta, level, level + delta]),
      ...critical.slice(1).map((level, i) => (level + critical[i]) / 2)]);
    for (const level of levels) {
      const result = assertLab(family, height, level);
      seen.add(result.dimension === 2 ? String(result.polygon.length) : String(result.dimension));
      samples++;
    }
  }
  assert(samples >= 9, family.id + ': boundary samples cannot be silently skipped');
  assert(seen.has('-1') && [...seen].some(value => Number(value) >= 3), family.id + ': empty and polygon cases exercised');
  if (family.id === 'cube-weighted') for (const count of ['3', '4', '5', '6']) assert(seen.has(count), 'weighted cube exercises ' + count + ' sides');
});

test('known degenerate and metric examples independently anchor the procedural checks', () => {
  const checks = [
    ['cube-sum', 0, 0, 1], ['cube-sum', 1, 2, 3], ['cube-sum', 1.5, 2, 6], ['cube-sum', 3, 0, 1],
    ['cube-horizontal', 0, 2, 4], ['cube-horizontal', 1, 2, 4],
    ['tetra-oblique', 1, 1, 2], ['tetra-oblique', -1, 0, 1],
    ['pyramid-vertical', -1, 1, 2], ['pyramid-vertical', 0, 2, 3], ['pyramid-vertical', 0.3, 2, 4], ['pyramid-vertical', 1, 1, 2]
  ];
  for (const [id, level, dimension, count] of checks) {
    const result = activities.makeLab(id, level);
    assert.equal(result.dimension, dimension, id + ': known dimension at ' + level);
    assert.equal(result.polygon.length, count, id + ': known vertex count at ' + level);
  }
  near(activities.makeLab('cube-sum', 1.5).area, 3 * Math.sqrt(3) / 4, 'central regular hexagon area');
  near(activities.makeLab('cube-sum', 1).perimeter, 3 * Math.sqrt(2), 'unit intercept triangle perimeter');
  near(activities.makeLab('pyramid-vertical', 0.3).area, 2 * (1 - 0.3 ** 2), 'vertical trapezoid area');
});
