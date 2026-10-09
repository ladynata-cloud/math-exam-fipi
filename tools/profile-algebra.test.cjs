'use strict';

// Arithmetic oracles deliberately use only authored task parameters, never
// stored answers, to check both the guided path and the independent result.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const repo = path.resolve(__dirname, '..');
const dataFile = path.join(repo, 'ege-profil/start/algebra-data.js');

function numeric(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;
  const text = value.trim().replace(',', '.');
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return Number(text);
  const fraction = text.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
  return fraction && Number(fraction[2]) !== 0 ? Number(fraction[1]) / Number(fraction[2]) : NaN;
}

function same(actual, expected, label) {
  if (typeof expected === 'string' && !Number.isFinite(numeric(expected))) {
    assert.equal(actual, expected, label);
    return;
  }
  const a = numeric(actual), e = numeric(expected);
  assert(Number.isFinite(a), `${label}: answer must be finite numeric, got ${actual}`);
  assert(Number.isFinite(e), `${label}: oracle must be finite numeric, got ${expected}`);
  assert(Math.abs(a - e) <= 1e-9 * Math.max(1, Math.abs(e)), `${label}: ${actual} != ${expected}`);
}

function localTarget(href, label) {
  assert.equal(typeof href, 'string', `${label}: href`);
  assert(!/^(?:https?:|javascript:|data:)/i.test(href), `${label}: remediation must be local`);
  const relative = decodeURIComponent(href.split(/[?#]/)[0]);
  const filename = relative.startsWith('/')
    ? path.join(repo, relative.slice(1))
    : path.resolve(path.dirname(dataFile), relative);
  assert(filename.startsWith(repo + path.sep), `${label}: must resolve inside repository`);
  assert(fs.existsSync(filename), `${label}: missing ${filename}`);
}

const normalize = degrees => ((degrees % 360) + 360) % 360;
const radians = degrees => degrees * Math.PI / 180;
const sinExact = new Map([
  [0, 0], [30, 1 / 2], [45, Math.SQRT1_2], [60, Math.sqrt(3) / 2], [90, 1],
  [120, Math.sqrt(3) / 2], [135, Math.SQRT1_2], [150, 1 / 2], [180, 0],
  [210, -1 / 2], [225, -Math.SQRT1_2], [240, -Math.sqrt(3) / 2], [270, -1],
  [300, -Math.sqrt(3) / 2], [315, -Math.SQRT1_2], [330, -1 / 2],
]);
function exactTrig(fn, degrees, label) {
  assert(['sin', 'cos'].includes(fn), `${label}: supported trigonometric function`);
  const angle = normalize(degrees + (fn === 'cos' ? 90 : 0));
  assert(sinExact.has(angle), `${label}: ${degrees}° must be a tabulated special angle`);
  return sinExact.get(angle);
}
function quadrantOf(x, y) {
  assert(x !== 0 && y !== 0, 'A point on an axis has no quadrant');
  return x > 0 ? (y > 0 ? 1 : 4) : (y > 0 ? 2 : 3);
}
function validBase(base, label) {
  assert(Number.isFinite(base) && base > 0 && base !== 1, `${label}: valid exponential/log base`);
}

const expectedKinds = {
  'trig-angle': 'angle',
  'trig-coordinates': 'coordinates',
  'trig-special': 'special',
  'trig-tangent': 'tangent',
  'algebra-exponential': 'exponential',
  'algebra-logarithmic': 'logarithmic',
  'algebra-cosine': 'recover-cosine',
  'algebra-double-angle': 'double-angle',
};
const parameterKeys = {
  angle: ['degrees'], coordinates: ['xNum', 'yNum', 'den', 'fn'],
  special: ['degrees', 'fn', 'scale'], tangent: ['xNum', 'yNum', 'den'],
  exponential: ['base', 'a', 'b', 'power'], logarithmic: ['base', 'a', 'b', 'power'],
  'recover-cosine': ['sinNum', 'den', 'quadrant'], 'double-angle': ['angle', 'coefficient'],
};

function oracle(meta, label) {
  switch (meta.kind) {
    case 'angle': {
      assert(Number.isFinite(meta.degrees), `${label}: finite angle`);
      return { steps: [meta.degrees / 90, normalize(meta.degrees), meta.degrees / 180], final: meta.degrees / 180 };
    }
    case 'coordinates': {
      const {xNum, yNum, den, fn} = meta;
      assert(den > 0, `${label}: positive denominator`);
      same(xNum * xNum + yNum * yNum, den * den, `${label}: point on unit circle`);
      assert(['sin', 'cos'].includes(fn), `${label}: valid function`);
      return {
        steps: [quadrantOf(xNum, yNum), fn === 'cos' ? 'Абсцисса x' : 'Ордината y', (fn === 'cos' ? xNum : yNum) / den],
        final: (fn === 'cos' ? xNum : yNum) / den,
      };
    }
    case 'special': {
      const angle = normalize(meta.degrees);
      const reference = angle <= 90 ? angle : angle <= 180 ? 180 - angle : angle <= 270 ? angle - 180 : 360 - angle;
      const value = exactTrig(meta.fn, meta.degrees, label);
      assert(Number.isFinite(meta.scale), `${label}: finite scale`);
      same(value, Math[meta.fn](radians(meta.degrees)), `${label}: exact special-angle identity`);
      return {steps: [angle, reference, Math.sign(value), Math.abs(value), meta.scale * value], final: meta.scale * value};
    }
    case 'tangent': {
      const {xNum, yNum, den} = meta;
      assert(den > 0 && xNum !== 0, `${label}: tangent domain cos ≠ 0`);
      same(xNum * xNum + yNum * yNum, den * den, `${label}: point on unit circle`);
      return {steps: [xNum / den, yNum / den, Math.sign(xNum * yNum), yNum / xNum], final: yNum / xNum};
    }
    case 'exponential': {
      const {base, a, b, power} = meta;
      validBase(base, label);
      assert(Number.isFinite(a) && a !== 0, `${label}: unique linear exponent solution`);
      const result = (power - b) / a;
      same(base ** (a * result + b), base ** power, `${label}: exponential equation residual`);
      return {steps: [power, power - b, result], final: result};
    }
    case 'logarithmic': {
      const {base, a, b, power} = meta;
      validBase(base, label);
      assert(Number.isFinite(a) && a !== 0, `${label}: unique linear argument solution`);
      const boundary = -b / a, rhs = base ** power, result = (rhs - b) / a;
      assert(rhs > 0 && Number.isFinite(rhs), `${label}: positive log argument`);
      assert(a * result + b > 0, `${label}: answer in logarithm domain`);
      assert(a > 0 ? result > boundary : result < boundary, `${label}: exact domain side`);
      for (const offset of [-2, -1, 0, 1, 2]) {
        const x = boundary + offset;
        assert.equal(a * x + b > 1e-12, a > 0 ? offset > 0 : offset < 0, `${label}: domain near boundary ${offset}`);
      }
      same(Math.log(a * result + b) / Math.log(base), power, `${label}: logarithmic equation residual`);
      return {steps: [boundary, a > 0 ? '>' : '<', rhs, rhs - b, result, a * result + b, result], final: result};
    }
    case 'recover-cosine': {
      const {sinNum, den, quadrant} = meta;
      assert(den > 0 && Math.abs(sinNum) < den && sinNum !== 0, `${label}: non-axis sine inside unit interval`);
      assert([1, 2, 3, 4].includes(quadrant), `${label}: valid quadrant`);
      assert.equal(Math.sign(sinNum), quadrant < 3 ? 1 : -1, `${label}: sine agrees with quadrant`);
      const sin = sinNum / den, cosSign = quadrant === 1 || quadrant === 4 ? 1 : -1;
      const cos = cosSign * Math.sqrt(1 - sin * sin);
      same(sin * sin + cos * cos, 1, `${label}: Pythagorean identity`);
      assert.equal(quadrantOf(cos, sin), quadrant, `${label}: recovered point quadrant`);
      return {steps: [sin * sin, 1 - sin * sin, cosSign, Math.abs(cos), cos], final: cos};
    }
    case 'double-angle': {
      const {angle, coefficient} = meta;
      assert(Number.isFinite(angle) && angle > 0 && angle < 90, `${label}: acute angle and nonzero denominator`);
      assert(Number.isFinite(coefficient), `${label}: finite coefficient`);
      const sin = Math.sin(radians(angle)), complementarySin = Math.sin(radians(90 - angle));
      const value = coefficient * Math.sin(radians(2 * angle)) / (sin * complementarySin);
      same(value, 2 * coefficient, `${label}: independently evaluated double-angle expression`);
      return {steps: [90 - angle, 2, 1, value], final: value};
    }
    default: assert.fail(`${label}: unrecognized oracle kind ${meta.kind}`);
  }
}

const oldLessons = globalThis.ProfileLessons;
const lessons = require(dataFile);
if (oldLessons === undefined) delete globalThis.ProfileLessons;
else globalThis.ProfileLessons = oldLessons;
assert(Array.isArray(lessons), 'CommonJS exports the lesson array');
assert.equal(lessons.length, 8, 'Exactly eight approved algebra and introductory-trig lessons');
assert.deepEqual(lessons.map(l => l.id).sort(), Object.keys(expectedKinds).sort(), 'Approved coverage only');
const sentinel = {id: 'existing-lesson'}, browser = {ProfileLessons: [sentinel]};
vm.runInNewContext(fs.readFileSync(dataFile, 'utf8'), browser, {filename: dataFile});
assert.equal(browser.ProfileLessons[0], sentinel, 'Browser loader preserves existing lessons');
assert.deepEqual(Array.from(browser.ProfileLessons.slice(1), lesson => lesson.id), lessons.map(lesson => lesson.id), 'Browser loader appends the same lessons without CommonJS');
const lessonIds = new Set(), taskIds = new Set();
let taskCount = 0, stepCount = 0;
for (const lesson of lessons) {
  assert(!lessonIds.has(lesson.id), `Duplicate lesson ID ${lesson.id}`);
  lessonIds.add(lesson.id);
  for (const field of ['title', 'summary', 'intro', 'why']) assert(lesson[field]?.trim(), `${lesson.id}: ${field}`);
  assert(lesson.prereq?.title?.trim() && lesson.prereq?.text?.trim(), `${lesson.id}: usable remediation`);
  localTarget(lesson.prereq.href, `${lesson.id} prerequisite`);
  assert(Array.isArray(lesson.links) && lesson.links.length > 0, `${lesson.id}: related learning links`);
  for (const link of lesson.links) localTarget(link.href, `${lesson.id} link ${link.title}`);
  assert.equal(lesson.tasks.length, 6, `${lesson.id}: six variants`);
  const prompts = new Set(), parameters = new Set();
  for (const task of lesson.tasks) {
    const label = `${lesson.id}/${task.id}`;
    assert(task.id && !taskIds.has(task.id), `${label}: globally unique stable task ID`);
    taskIds.add(task.id);
    assert(task.prompt?.trim() && task.explanation?.trim(), `${label}: prompt and explanation`);
    assert(!prompts.has(task.prompt), `${label}: genuinely distinct statement`);
    prompts.add(task.prompt);
    assert(task.meta && task.meta.kind === expectedKinds[lesson.id], `${label}: oracle metadata`);
    if (task.meta.kind === 'logarithmic') {
      const explanationText = [task.prompt, task.explanation, ...task.steps.map(step => step.prompt)].join(' ');
      assert(!/\d\.\d{12,}/.test(explanationText), `${label}: exact domain and solution must not be rendered as rounded recurring decimals`);
    }
    const signature = JSON.stringify(parameterKeys[task.meta.kind].map(key => task.meta[key]));
    assert(!parameters.has(signature), `${label}: genuinely distinct raw parameters`);
    parameters.add(signature);
    assert(!task.choices, `${label}: independent final answer remains numeric`);
    assert(Number.isFinite(numeric(task.answer)), `${label}: final numeric answer`);
    const expected = oracle(task.meta, label);
    assert.equal(task.steps.length, expected.steps.length, `${label}: complete guided steps`);
    task.steps.forEach((step, index) => {
      assert(step.prompt?.trim() && step.hint?.trim() && step.why?.trim(), `${label} step ${index + 1}: meaningful guidance`);
      same(step.answer, expected.steps[index], `${label} step ${index + 1}`);
      if (step.choices) {
        assert(step.choices.length >= 2, `${label} step ${index + 1}: at least two choices`);
        assert.equal(new Set(step.choices).size, step.choices.length, `${label} step ${index + 1}: distinct choices`);
        assert(step.choices.includes(step.answer), `${label} step ${index + 1}: answer belongs to choices`);
      }
      stepCount++;
    });
    same(task.answer, expected.final, `${label} final`);
    taskCount++;
  }
}

console.log(`PASS: ${lessons.length} lessons, ${taskCount} independent numeric answers, ${stepCount} guided step answers; valid equation domains, special angles, quadrants, double-angle identities and local remediation links.`);
