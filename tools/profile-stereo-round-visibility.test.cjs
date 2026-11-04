'use strict';

// Independently exercise the round-body interval helper with arbitrary straight
// segments. Expected visibility comes from ray/volume intervals in the original
// coordinates, not from the production helper's parameter cuts or polygons.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourceFile = path.resolve(__dirname, '../ege-profil/start/stereo-tasks.js');
const source = fs.readFileSync(sourceFile, 'utf8');
const begin = source.indexOf('    function roundVisibilityParts(');
const end = source.indexOf('    function renderStrokes()', begin);
assert(begin >= 0 && end > begin, 'production round-body interval helper exists');

// Expose the existing closure helper only in this test's in-memory copy.
// No public hook or production geometry is added or changed.
const context = {};
vm.createContext(context);
vm.runInContext(`
  const tolerance = 1e-7;
  const sub = (a, b) => a.map((value, index) => value - b[index]);
  const add = (a, b) => a.map((value, index) => value + b[index]);
  const mul = (a, factor) => a.map(value => value * factor);
  ${source.slice(begin, end)}
  globalThis.parts = roundVisibilityParts;
`, context);

function rayRoots(a, b, c) {
  if (Math.abs(a) < 1e-12) return Math.abs(b) < 1e-12 ? [] : [-c / b];
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];
  const root = Math.sqrt(discriminant);
  return [(-b - root) / (2 * a), (-b + root) / (2 * a)];
}

// Find intervals along the viewing ray in which material occupies space.
// Outer/inner circular walls and horizontal ends provide possible boundaries;
// the inequality check between boundaries decides whether there is material.
function independentOcclusion(point, direction, body) {
  const cuts = [0, 20];
  for (const height of [body.low, body.high]) {
    if (Math.abs(direction[1]) > 1e-12) {
      cuts.push((height - point[1]) / direction[1]);
    }
  }
  const cylinder = radius => cuts.push(...rayRoots(
    direction[0] ** 2 + direction[2] ** 2,
    2 * (point[0] * direction[0] + point[2] * direction[2]),
    point[0] ** 2 + point[2] ** 2 - radius ** 2
  ));
  if (body.isCone) {
    const k = body.radius ** 2 / body.height ** 2;
    cuts.push(...rayRoots(
      direction[0] ** 2 + direction[2] ** 2 - k * direction[1] ** 2,
      2 * (point[0] * direction[0] + point[2] * direction[2]
        + k * (body.high - point[1]) * direction[1]),
      point[0] ** 2 + point[2] ** 2 - k * (body.high - point[1]) ** 2
    ));
  } else {
    cylinder(body.radius);
  }
  if (body.inner) cylinder(body.inner);

  const epsilon = 1e-9;
  const insideMaterial = p => {
    const radius = body.radius * (body.isCone ? (body.high - p[1]) / body.height : 1);
    const radialSquared = p[0] ** 2 + p[2] ** 2;
    return p[1] > body.low + epsilon && p[1] < body.high - epsilon
      && radialSquared < radius ** 2 - epsilon
      && (!body.inner || radialSquared > body.inner ** 2 + epsilon);
  };
  const sorted = cuts.filter(t => t >= 0 && t <= 20).sort((a, b) => a - b);
  for (let index = 1; index < sorted.length; index++) {
    if (sorted[index] - sorted[index - 1] <= 1e-8) continue;
    const distance = (sorted[index] + sorted[index - 1]) / 2;
    const hit = point.map((value, axis) => value + direction[axis] * distance);
    if (insideMaterial(hit)) return true;
  }
  return false;
}

function validateParts(p, q, body, direction, parts, label) {
  assert(parts.length > 0, label + ': nonempty partition');
  assert.equal(parts[0].start, 0, label + ': partition starts at zero');
  assert.equal(parts.at(-1).end, 1, label + ': partition ends at one');
  let samples = 0;
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    assert(Number.isFinite(part.start) && Number.isFinite(part.end), label + ': finite endpoints');
    assert(part.start >= 0 && part.end <= 1 && part.start < part.end, label + ': positive interval within [0,1]');
    assert.equal(typeof part.hidden, 'boolean', label + ': explicit visibility');
    if (index) assert.equal(part.start, parts[index - 1].end, label + ': no gap or overlap');
    for (const fraction of [.13, .37, .67, .91]) {
      const t = part.start + (part.end - part.start) * fraction;
      const point = p.map((value, axis) => value + (q[axis] - value) * t);
      const expected = independentOcclusion(point, direction, body);
      assert.equal(part.hidden, expected, `${label}: independent ray at t=${t}, interval=[${part.start},${part.end}]`);
      samples++;
    }
  }
  return samples;
}

const bodies = [
  { name: 'cylinder', radius: 1, height: 2 },
  { name: 'wide-cone', radius: 1, height: .4, isCone: true },
  { name: 'narrow-cone', radius: .18, height: 2, isCone: true },
  { name: 'cone', radius: 1, height: 2, isCone: true },
  { name: 'tube', radius: 1, height: 1, inner: .8 }
].map(body => ({
  ...body,
  low: -body.height / 2,
  high: body.height / 2,
  top: true,
  bottom: true,
  inner: body.inner || 0,
  isCone: !!body.isCone
}));
const initialSeed = 246813579;
let seed = initialSeed;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
let segments = 0, samples = 0, partialSegments = 0;
for (const body of bodies) {
  for (const yaw of [-2.8, -1.9, -.65, .35, 1.2, 2.4]) {
    for (const pitch of [.14, .4, 1.04, 1.25]) {
      const direction = [-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
      for (let index = 0; index < 60; index++) {
        const point = () => [
          (random() * 3 - 1.5) * body.radius,
          (random() * 2 - 1) * body.height,
          (random() * 3 - 1.5) * body.radius
        ];
        const p = point(), q = point();
        const parts = context.parts(p, q, body, direction);
        if (new Set(parts.map(part => part.hidden)).size > 1) partialSegments++;
        const label = `${body.name}, yaw=${yaw}, pitch=${pitch}, segment=${index}`;
        samples += validateParts(p, q, body, direction, parts, label);
        segments++;
      }
    }
  }
}
assert.equal(segments, 7200, 'complete deterministic fixture');
assert(partialSegments > 3000, 'substantial partial-visibility coverage');

// The same validator must reject an intentionally exposed interior segment.
const p = [0, 0, 0], q = [.5, 0, 0], direction = [.6, .4, Math.sqrt(.48)];
const control = context.parts(p, q, bodies[0], direction);
validateParts(p, q, bodies[0], direction, control, 'interior positive control');
assert(control.some(part => part.hidden), 'control contains hidden material');
assert.throws(() => validateParts(p, q, bodies[0], direction,
  control.map(part => ({ ...part, hidden: false })), 'solidified negative control'), /independent ray/);
assert.throws(() => validateParts(p, q, bodies[0], direction,
  control.map((part, index) => index ? part : { ...part, start: .01 }), 'missing-start negative control'), /partition starts at zero/);

assert.equal(fs.readFileSync(sourceFile, 'utf8'), source, 'tested source bytes unchanged');
console.log(JSON.stringify({
  status: 'PASS',
  source: 'ege-profil/start/stereo-tasks.js',
  sourceSHA256: crypto.createHash('sha256').update(source).digest('hex'),
  seed: initialSeed,
  segments,
  samples,
  partialSegments,
  negativeControls: 2
}, null, 2));
