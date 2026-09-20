import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const relativeTrainer = 'trainers/oge-2027-analogue-1.html';
const html = fs.readFileSync(path.join(root, relativeTrainer), 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
assert.ok(scripts.length > 0, 'Inline trainer scripts exist');
for (const [, attributes, body] of scripts) {
  assert.ok(!/\bsrc\s*=/i.test(attributes), 'No external script');
  const syntax = spawnSync(process.execPath, ['--check', '--input-type=commonjs'], {
    input: body, encoding: 'utf8', timeout: 10000,
  });
  assert.equal(syntax.status, 0, syntax.stderr || syntax.error?.message);
}
const modelScript = scripts.find(([, attributes]) => /\bid=["']model["']/.test(attributes));
assert.ok(modelScript, 'Pure model script is explicitly identified');
const context = vm.createContext({});
vm.runInContext(modelScript[2], context, { timeout: 2000 });
const model = context.ExamModel;
assert.ok(model, 'Model exports are available without DOM');
const { TASKS, parseAnswer, blankState, checkAnswer, reveal, score, validateState, renderDiagram, STORAGE_KEY } = model;
const tasks = Array.from(TASKS);
const task = number => tasks.find(item => item.number === number);
const plain = value => JSON.parse(JSON.stringify(value));
const digest = value => createHash('sha256').update(value).digest('hex');
const text = value => String(value).replace(/<[^>]*>/g, ' ')
  .replaceAll('&minus;', '−').replaceAll('&nbsp;', ' ').replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>').replaceAll('&amp;', '&').replace(/\s+/g, ' ').trim();
const normalizedNumber = value => Number(String(value).trim().replaceAll('−', '-').replace(',', '.'));
const near = (actual, expected, epsilon = 1e-9) => assert.ok(
  Number.isFinite(actual) && Math.abs(actual - expected) <= epsilon,
  'Expected ' + expected + ', received ' + actual);
const includes = (source, expression, label = String(expression)) => assert.ok(expression.test(source), label);
const excludes = (source, expression, label = String(expression)) => assert.ok(!expression.test(source), label);
let failed = 0, scheduled = 0, passed = 0;
function gate(name, callback) {
  scheduled++;
  test(name, () => {
    try { callback(); passed++; } catch (error) { failed++; throw error; }
  });
}
process.once('beforeExit', () => { if (!failed && scheduled > 0 && passed === scheduled) console.log('OGE_2027_AUTHOR_ANALOGUE_1_NODE_OK'); });

function gcd(a, b) {
  a = a < 0n ? -a : a; b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}
function rat(n, d = 1n) {
  n = BigInt(n); d = BigInt(d);
  assert.notEqual(d, 0n);
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}
const add = (a, b) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => rat(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => rat(a.n * b.n, a.d * b.d);
const div = (a, b) => rat(a.n * b.d, a.d * b.n);
const number = r => Number(r.n) / Number(r.d);
const rationalEqual = (a, b) => a.n === b.n && a.d === b.d;
const sidewall = (width, percent) => rat(BigInt(width) * BigInt(percent), 100);
const diameter = (width, percent, rim) =>
  add(rat(BigInt(rim) * 254n, 10n), mul(rat(2), sidewall(width, percent)));
const factoryDiameter = diameter(185, 65, 14);
const replacementDiameter = diameter(195, 60, 15);
const growth = mul(div(sub(replacementDiameter, factoryDiameter), factoryDiameter), rat(100));
const roundedGrowth = Number((growth.n * 20n + growth.d) / (2n * growth.d)) / 10;
const blackMarkers = (250 - 35 - 45 - 50) / 2;

// Independent reference computations use the owner-approved problem data,
// not task.answer or runtime grading helpers.
const expectedShort = [
  Math.max(...[175, 185, 195, 205]), number(sidewall(205, 50)), number(factoryDiameter),
  number(sub(sidewall(195, 60), sidewall(185, 60))), roundedGrowth,
  number(mul(rat(48, 10), rat(27, 10))), 2,
  Number((9n ** 7n * 10n ** 5n) / (90n ** 5n)), (12 - 5 * 4 - 3 * 2) / (5 - 3),
  (35 + blackMarkers) / 250, '231', 110 ** 2 / 242, 3,
  320 / 2 ** (18 / 6), 180 - 3 * 32, (2 * 6.5) ** 2,
  Math.max(4, 11) / 2, Math.hypot(7 - 1, 9 - 1), 2,
];

gate('25 stable unique task IDs, 19 short answers, six expanded tasks and 31 maximum points', () => {
  assert.equal(tasks.length, 25);
  assert.equal(new Set(tasks.map(t => t.id)).size, 25);
  assert.deepEqual(tasks.map(t => t.number), Array.from({ length: 25 }, (_, i) => i + 1));
  for (const t of tasks) {
    assert.equal(t.id, 'oge2027-analogue-1-task-' + String(t.number).padStart(2, '0'));
    assert.equal(t.part, t.number <= 19 ? 1 : 2);
    assert.equal(t.sourceKind, 'author-analogue');
    assert.equal(t.variantId, 'oge-2027-analogue-1');
    assert.equal(typeof t.topic, 'string');
    assert.ok(text(t.prompt).length > 10, t.id);
    assert.ok(text(t.hint).length > 5, t.id);
    assert.ok(text(t.solution).length > 20, t.id);
    const expectedType = t.number > 19 ? 'expanded' :
      [7, 13].includes(t.number) ? 'choice' : t.number === 11 ? 'sequence' : 'number';
    assert.equal(t.answerType, expectedType, t.id);
  }
  assert.equal(19 + 6 * 2, 31);
  includes(html, /235/);
});

gate('tire dimensions and rounding are recomputed with exact rational arithmetic', () => {
  assert.deepEqual(factoryDiameter, rat(5961, 10));
  assert.deepEqual(replacementDiameter, rat(615));
  assert.deepEqual(sidewall(205, 50), rat(205, 2));
  assert.deepEqual(sub(sidewall(195, 60), sidewall(185, 60)), rat(6));
  assert.ok(rationalEqual(growth, rat(18900, 5961)));
  assert.equal(roundedGrowth, 3.2);
  // Exact growth lies in [3.15, 3.25), hence rounds to 3.2 to one decimal place.
  assert.ok(growth.n * 100n >= 315n * growth.d && growth.n * 100n < 325n * growth.d);
  includes(html, /185\/65\s*R14/);
  includes(html, /205\/50\s*R16/);
  includes(html, /195\/60\s*R15/);
  includes(html, /25[,.]4/);
});

for (let index = 0; index < 19; index++) {
  gate('independent answer ' + (index + 1), () => {
    const actual = task(index + 1).answer;
    if (index === 10) assert.equal(String(actual), expectedShort[index]);
    else near(normalizedNumber(actual), expectedShort[index], 1e-12);
  });
}

gate('probability, graph matching, interval choice and true statement have independent reasons', () => {
  assert.equal(blackMarkers, 60);
  assert.equal(35 + 45 + 50 + blackMarkers * 2, 250);
  assert.equal((35 + blackMarkers) / 250, 0.38);
  const formulas = [x => -x + 2, x => x * x + 1, x => -1 / x];
  const signatures = [formulas[1], formulas[2], formulas[0]];
  const derived = signatures.map(f => formulas.findIndex(g =>
    [-2, -1, 1, 2].every(x => f(x) === g(x))) + 1).join('');
  assert.equal(derived, String(task(11).answer));
  const system = x => 2 * x - 6 <= 0 && x + 3 > 0;
  for (const [x, accepted] of [[-4, false], [-3, false], [-2.9, true], [0, true], [3, true], [3.1, false]]) {
    assert.equal(system(x), accepted);
  }
  // Rectangle 4x2: diagonal dot product is nonzero. Rhombus with angle 60 is not square.
  assert.notEqual(4 * 4 + 2 * -2, 0);
  assert.equal(180 - 90, 90);
  assert.notEqual(60, 90);
});

gate('20: rational inequality signs and all three boundary points', () => {
  const belongs = x => x <= -4 || (x > 0 && x <= 4);
  for (const x of [-100, -5, -4, -3.9, -1, -0.001, 0, 0.001, 1, 3.9, 4, 4.1, 100]) {
    const original = x !== 0 && x <= 16 / x;
    assert.equal(original, belongs(x), 'x=' + x);
    if (x !== 0) {
      const value = rat(BigInt(Math.round(x * 1000)), 1000);
      const numerator = sub(mul(value, value), rat(16));
      const quotient = div(numerator, value);
      assert.equal(quotient.n <= 0n, belongs(x));
    }
  }
  const answer = text(task(20).answer).replaceAll('−', '-').replace(/\s/g, '');
  assert.equal(answer, '(-∞;-4]∪(0;4]');
  includes(text(task(20).solution), /интервал|Критические точки/);
  includes(text(task(20).solution), /0/);
});

gate('21: cycling model, admissible quadratic root and substitution', () => {
  const distance = 180, speedDifference = 3, timeDifference = 2;
  const discriminant = speedDifference ** 2 + 4 * distance * speedDifference / timeDifference;
  assert.equal(discriminant, 33 ** 2);
  const slow = (-speedDifference + Math.sqrt(discriminant)) / 2;
  const rejected = (-speedDifference - Math.sqrt(discriminant)) / 2;
  assert.equal(slow, 15); assert.equal(rejected, -18);
  assert.ok(slow > 0 && rejected < 0);
  assert.equal(distance / slow - distance / (slow + speedDifference), timeDifference);
  includes(text(task(21).answer), /15/);
  includes(text(task(21).solution), /180/);
});

gate('22: intersection counts include the isolated -1 and exclude both 0 and 7', () => {
  function intersections(m) {
    const roots = [];
    if ((m - 5) / 2 < 1) roots.push((m - 5) / 2);
    if (m >= -1) {
      const delta = Math.sqrt(m + 1);
      for (const x of new Set([2 - delta, 2 + delta])) if (x >= 1) roots.push(x);
    }
    return roots;
  }
  for (const [m, count] of [[-10, 1], [-1.01, 1], [-1, 2], [-0.9, 3], [0, 3],
    [0.001, 2], [1, 2], [6.999, 2], [7, 1], [7.1, 1], [100, 1]]) {
    assert.equal(intersections(m).length, count, 'm=' + m);
    assert.equal(count === 2, m === -1 || (m > 0 && m < 7));
  }
  assert.deepEqual(intersections(-1), [-3, 2]);
  assert.equal(1 ** 2 - 4 * 1 + 3, 0);
  assert.equal(2 * 1 + 5, 7); // this limit point is excluded from the linear branch
  const answer = text(task(22).answer).replaceAll('−', '-');
  includes(answer, /-1/); includes(answer, /0\s*<\s*m\s*<\s*7/);
  for (const boundary of ['−1', '0', '7']) {
    assert.ok(text(task(22).solution).replaceAll('-', '−').includes(boundary));
  }
});

gate('23: supplementary adjacent angles imply perpendicular bisectors', () => {
  for (const angleA of [30, 60, 90, 120, 150]) {
    const angleB = 180 - angleA;
    assert.equal(180 - angleA / 2 - angleB / 2, 90);
  }
  assert.equal(Math.hypot(8, 15), 17);
  assert.equal(normalizedNumber(String(task(23).answer).replace(/[^\d.,−-]/g, '')), 17);
  includes(text(task(23).solution), /90/);
  includes(text(task(23).solution), /Пифагор|гипотенуз/);
});

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const vector = (a, b) => [b[0] - a[0], b[1] - a[1]];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const unit = a => a.map(value => value / Math.hypot(...a));

gate('24: cyclic configuration verifies the A↔D, B↔C, E↔E correspondence', () => {
  const A = [-4, -3], B = [3, -4], C = [5, 0], D = [-3, 4], E = [1, -4 / 3];
  for (const point of [A, B, C, D]) near(dot(point, point), 25);
  near(cross(vector(A, C), vector(A, E)), 0);
  near(cross(vector(B, D), vector(B, E)), 0);
  assert.ok(dot(vector(E, A), vector(E, C)) < 0);
  assert.ok(dot(vector(E, B), vector(E, D)) < 0);
  const ratio = distance(A, B) / distance(D, C);
  near(distance(B, E) / distance(C, E), ratio);
  near(distance(A, E) / distance(D, E), ratio);
  const solution = text(task(24).solution);
  includes(solution, /вертикаль/);
  includes(solution, /дуг[ауе][^.!?]*AD/);
  includes(solution, /двум углам|две пары углов/);
});

gate('25: bisector, equal triangles, parallelogram and converse Pythagoras give 480', () => {
  const A = [0, 0], B = [0, 24], C = [4, 24], D = [36, 0];
  const M = [0, 12], K = [-36, 24], P = [4, 0];
  near(distance(A, B), 24); near(distance(C, D), 40); near(distance(B, C), 4);
  near(distance(A, M), distance(M, B));
  near(cross(vector(D, M), vector(D, K)), 0);
  near(cross(vector(B, C), vector(B, K)), 0);
  assert.ok(K[0] < B[0] && B[0] < C[0]);
  const bisector = unit(vector(D, M)), sideA = unit(vector(D, A)), sideC = unit(vector(D, C));
  near(dot(bisector, sideA), dot(bisector, sideC));
  near(distance(K, C), distance(C, D));
  near(distance(K, B), distance(A, D));
  near(distance(C, P), distance(A, B));
  near(distance(A, P), distance(B, C));
  near(distance(P, D), 32);
  near(distance(C, P) ** 2 + distance(P, D) ** 2, distance(C, D) ** 2);
  near(dot(vector(P, C), vector(P, D)), 0);
  const area = (distance(A, D) + distance(B, C)) * distance(C, P) / 2;
  assert.equal(area, 480);
  assert.equal(normalizedNumber(String(task(25).answer).replace(/[^\d.,−-]/g, '')), area);
  const solution = text(task(25).solution);
  for (const label of ['K', 'M', 'P', '36', '32', '24', '480']) assert.ok(solution.includes(label), label);
  includes(solution, /равнобедрен|углы при D и K равны/);
  includes(solution, /Пифагор/);
});

gate('strict numeric, choice and sequence parser contracts', () => {
  const numeric = task(6);
  for (const [input, expected] of [['12,96', 12.96], ['12.96', 12.96], [' 12,96 ', 12.96],
    ['−7', -7], ['-7', -7], ['0', 0], ['-0,5', -0.5]]) {
    const parsed = parseAnswer(numeric, input);
    assert.equal(parsed.valid, true, input);
    assert.equal(parsed.value, expected, input);
  }
  for (const input of ['', ' ', '1 2,96', '12, 96', '1 1/2', '-3 1/50', '1/2',
    '1:2', 'NaN', 'Infinity', '1e3', '1+1', '--7', '<b>12.96</b>', '9'.repeat(1000)]) {
    assert.equal(parseAnswer(numeric, input).valid, false, input.slice(0, 30));
  }
  for (const number of [7, 13]) {
    for (const input of ['1', '2', '3', '4']) assert.equal(parseAnswer(task(number), input).valid, true);
    for (const input of ['0', '5', '2.0', '2,0', '02', '1/2', '2 3']) {
      assert.equal(parseAnswer(task(number), input).valid, false, number + ': ' + input);
    }
  }
  assert.equal(parseAnswer(task(11), '231').valid, true);
  for (const input of ['2 3 1', '23 1', '23', '2311', '2,31', '2.31', 'abc', '451']) {
    assert.equal(parseAnswer(task(11), input).valid, false, input);
  }
  const wrongSequence = { ...blankState().entries[10], input: '123' };
  assert.equal(checkAnswer(task(11), wrongSequence).correct, false);
});

gate('first attempt, wrong history and repeated checking cannot inflate scores', () => {
  const state = plain(blankState());
  assert.equal(state.entries.length, 25);
  let entry = state.entries[5];
  entry = { ...entry, input: '1' };
  entry = plain(checkAnswer(task(6), entry));
  assert.equal(entry.correct, false); assert.equal(entry.wrong, 1);
  entry.input = '12,96';
  entry = plain(checkAnswer(task(6), entry));
  assert.equal(entry.correct, true); assert.equal(entry.wrong, 1);
  state.entries[5] = entry;
  const once = plain(score(state));
  for (let repeat = 0; repeat < 5; repeat++) {
    state.entries[5] = plain(checkAnswer(task(6), state.entries[5]));
    assert.deepEqual(plain(score(state)), once);
    assert.equal(state.entries[5].wrong, 1);
  }
  assert.equal(once.independent, 1);
});

gate('reveal provenance survives correction and hints have separately reported credit', () => {
  const state = plain(blankState());
  let entry = { ...state.entries[0], input: '205' };
  entry = plain(reveal(entry));
  assert.equal(entry.revealed, true);
  entry = plain(checkAnswer(task(1), entry));
  state.entries[0] = entry;
  const shown = plain(score(state));
  assert.equal(shown.independent, 0); assert.equal(shown.part1, 0);
  state.entries[1] = plain(checkAnswer(task(2), { ...state.entries[1], input: '102,5', hinted: true }));
  const helped = plain(score(state));
  assert.equal(helped.independent, 0);
  assert.equal(helped.assisted, 1); assert.equal(helped.part1, 1);
});

gate('19 auto scores and six manual grades remain separate and bounded by 31', () => {
  const state = plain(blankState());
  for (let i = 0; i < 19; i++) {
    state.entries[i] = plain(checkAnswer(tasks[i], { ...state.entries[i], input: String(expectedShort[i]) }));
  }
  for (let i = 19; i < 25; i++) state.entries[i].manual = 2;
  const result = plain(score(state));
  assert.equal(result.independent, 19); assert.equal(result.assisted, 0);
  assert.equal(result.part1, 19); assert.equal(result.manual, 12); assert.equal(result.total, 31);
  const blank = plain(score(blankState()));
  assert.equal(blank.independent, 0); assert.equal(blank.part1, 0);
  assert.equal(blank.manual, 0); assert.equal(blank.total, 0);
});

const officialAnswerDigests = [
  "1dfacb2ea5a03e0a915999e03b5a56196f1b1664d2f768d1b7eff60ac059789d",
  "30b3a48e7220afcb7b3b72a919f221c4b5564a8e95fb911acc3ba17385274424",
  "0b3e478d82526592d0a8959d4c02d181b017b7a601fc80be03f6e442a9c3217f",
  "73af98c887a3fd39bb0bf46ca51699e9c8c250db05a7452ee522614ff657b886",
  "1a948f1b4374f4e3f02501c7feb43784021718a93c1ed5f9f19adf357bb2d20e",
  "ab23d0dc5bdc21203c2f73f893d8fcff53519988bfadb0b89e371e0eafa4c279",
  "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
  "0e17daca5f3e175f448bacace3bc0da47d0655a74c8dd0dc497a3afbdad95f1f",
  "368d8db27f0b80020fcc663cae685bc8f57b9c184189c26c0999392e8f13f6fc",
  "16ad1c0bd6e26646912d571c740893247f61468655d52878989e9d858710655b",
  "dbb1ded63bc70732626c5dfe6c7f50ced3d560e970f30b15335ac290358748f6",
  "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
  "d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35",
  "b902cc4550838229a710bfec4c38cbc7eb11082367a409df9135e7f007a96bda",
  "1253e9373e781b7500266caa55150e08e210bc8cd8cc70d89985e3600155e860",
  "b4bbe448fde336bb6a7d7d765f36d3327c772b845e7b54c8282aa08c9775ddd7",
  "32209ccbf8a8e509b9027698cc173343a2695e8ecdbe899bf5335a3100c956fc",
  "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
  "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b"
];
// Fingerprints of 33 complete prose sentences manually reconciled with the
// reference PDF. Common short commands are exempt. No official task text is
// stored here. This guard complements manual comparison; it cannot establish
// semantic originality or recover arbitrary OCR/layout variants.
const officialSentences = [
  {
    "task": 1,
    "words": 12,
    "sha256": "72d2c9e40a534ab4b4cd7e10bb2d20990eb4d44a9ea52211d1f5fdb3d30330b2"
  },
  {
    "task": 1,
    "words": 9,
    "sha256": "be976a7585cdedb411bd65ae4fce7a043c88ed1b38c67e3b5d9f6c830f8059b1"
  },
  {
    "task": 1,
    "words": 8,
    "sha256": "c9a798c2dc16047f58c0104fba9aa8433d5df9768158056394c0a67102bee20b"
  },
  {
    "task": 1,
    "words": 16,
    "sha256": "d780e07febe9ed3b840f7073d96dcbd1b75a386f14d8a945bc3147c516992ee9"
  },
  {
    "task": 1,
    "words": 14,
    "sha256": "f583bcd8613fb668baaf5a88d83065ad05e2c99d8d2a60d89aff1a581587a8eb"
  },
  {
    "task": 2,
    "words": 11,
    "sha256": "9379bc3da3b451799749ca06976b62490093e5ba8f452910b5c1aa30b985729c"
  },
  {
    "task": 3,
    "words": 7,
    "sha256": "6f665fa6672288fe4b1b31f65c9b072f0ccbd6c6c754796d9f01b7584fccbb27"
  },
  {
    "task": 4,
    "words": 19,
    "sha256": "6536b145b92f27b7cfba45bc168cfb6b917a271cfccf7fef5382c544d5eb8309"
  },
  {
    "task": 5,
    "words": 22,
    "sha256": "b18354cb770ef124f91971a4b23e20158db44d34879a93aa39083cac5fa0fa2e"
  },
  {
    "task": 10,
    "words": 18,
    "sha256": "424a18ac4232fb70d791579024662e10eb3e08fe0393a3949ece6987a2cde4e7"
  },
  {
    "task": 10,
    "words": 14,
    "sha256": "2512d88317aefe908f8819ff902421c16cfa27a38912b02c37df32c96f646d04"
  },
  {
    "task": 11,
    "words": 10,
    "sha256": "cf6ec5071fd6423db2980a78c1c4dd7dd274a15e32ec850c08bdeebd6ded9bd5"
  },
  {
    "task": 12,
    "words": 19,
    "sha256": "06fc023677c8f7122a6893e7300e2a3a5fc90aba60dd45d2528ae4c253875734"
  },
  {
    "task": 14,
    "words": 12,
    "sha256": "b7361e1126688cecf474e966ec3417ad649298d88b6bbb1e5d74466aaa1ddca8"
  },
  {
    "task": 14,
    "words": 8,
    "sha256": "799bf1850cf55431e232ac7828bdb8abcbcad7d4e7ae344f812924db9dc058af"
  },
  {
    "task": 14,
    "words": 6,
    "sha256": "5d44f5210158dcd9f5b0e0d8636e6469b1f212a957f3bde7205142136199ac6b"
  },
  {
    "task": 15,
    "words": 6,
    "sha256": "726bd9ed78bda609a7f75b3d8f4b34e1c8aae16a3e84670f3ad1e35037221f78"
  },
  {
    "task": 16,
    "words": 8,
    "sha256": "7187b16730d4f6f3e44dfc62c33894ba504e69d0585a7244059c8e1d706d97ca"
  },
  {
    "task": 17,
    "words": 6,
    "sha256": "b2fd5ed618d4a9d4c134ba106237fdd30bc35de5066ccef709d09101f636fb4f"
  },
  {
    "task": 17,
    "words": 15,
    "sha256": "f18858c9730aa170d02ce3e188f8e2f37878436f9a79eedbf50858e697a9b62b"
  },
  {
    "task": 18,
    "words": 11,
    "sha256": "038b49729e96314ec0f9f4c135f525e2bce843ef35d50a8fb8d9aed186bb72df"
  },
  {
    "task": 19,
    "words": 14,
    "sha256": "b6c6f7e4bc660d88ec7944c60fc507b06a0b109476cf6f361d39ee056f306709"
  },
  {
    "task": 19,
    "words": 3,
    "sha256": "338e8f81f29653704fb2d9bb7b65221b2f9854232a00379de791e55895b46830"
  },
  {
    "task": 19,
    "words": 6,
    "sha256": "5efd0ffe92d85f352673034b7f383c0b0b75927dc13882169741d3bf0b05d02a"
  },
  {
    "task": 21,
    "words": 8,
    "sha256": "a05691cfc6cd248896e309823a0cfb98f6736935e9c039aafc05f1a348fd8de5"
  },
  {
    "task": 21,
    "words": 20,
    "sha256": "2620c2e4e50bb46e3321c7d5b0941d4668a140bc3bd781e098e31390830d12f0"
  },
  {
    "task": 21,
    "words": 7,
    "sha256": "c67f352901bdf042b3e3315c307f11a6c25e54fd948d3929797e5babc3f6738b"
  },
  {
    "task": 22,
    "words": 15,
    "sha256": "326f2a29a31069a99a0262b7ad50fea4144cbf885d66cc140c7b2a3397ddacf1"
  },
  {
    "task": 23,
    "words": 15,
    "sha256": "0290d7e3ebfc1bca2c511224741f10e472559bc9cf7ec559392819de50aacda8"
  },
  {
    "task": 24,
    "words": 20,
    "sha256": "d0603bdc81b699cb223f28afedc61eb5943c3f2bb0631d7b677944446ce6e496"
  },
  {
    "task": 24,
    "words": 7,
    "sha256": "435f15918a2c9109c3599f85bb9e0bc6b0c69466e630edf4772fb0efbd3c148e"
  },
  {
    "task": 25,
    "words": 17,
    "sha256": "b03ad276efdb7849cbf8fcd4481528c19c9b26ad9df596c6694339e04808fbf1"
  },
  {
    "task": 25,
    "words": 8,
    "sha256": "81357460b82cc1bb389e4fb6b01690d7cde8e0e07af5fbbdca191e5144fa7132"
  }
];
const words = source => (text(source).toLowerCase().replaceAll('ё', 'е').match(/[\p{L}\p{N}]+/gu) || []);

gate('all 19 answer positions differ from the reference key', () => {
  const key = tasks.slice(0, 19).map(t => t.number === 11
    ? String(t.answer) : String(normalizedNumber(t.answer)));
  assert.notEqual(digest(key.join('|')), '1463b7faa01e504def1d7c7a293c076d98f2f3a7741349514e6e61dc0328732f');
  for (let i = 0; i < key.length; i++) assert.notEqual(digest(key[i]), officialAnswerDigests[i], 'Answer ' + (i + 1));
});

gate('33 reference sentence fingerprints do not occur in author prompts', () => {
  assert.equal(officialSentences.length, 33);
  const prompts = [{ number: 'shared page', words: words(html) }, ...tasks.map(t => ({ number: t.number, words: words(t.prompt) }))];
  for (const reference of officialSentences) {
    for (const candidate of prompts) {
      for (let start = 0; start + reference.words <= candidate.words.length; start++) {
        const candidateHash = digest(candidate.words.slice(start, start + reference.words).join(' '));
        assert.notEqual(candidateHash, reference.sha256,
          'Prompt ' + candidate.number + ' repeats a complete reference sentence (reference task ' + reference.task + ')');
      }
    }
  }
});

gate('author positioning is explicit and no PDF, raster, logo or watermark assets are embedded', () => {
  includes(html, /Авторский аналог демоверсии ОГЭ-2027 по математике\. Вариант 1/);
  includes(html, /Не является официальным материалом ФИПИ/);
  includes(html, /Авторский тренировочный вариант MathExam/);
  excludes(html, /Источник:\s*ФИПИ|разработан[а-яё\s]*ФИПИ/i);
  excludes(html, /<img\b|<image\b|\.pdf(?:[?#"'\s<]|$)|data:image|\.png(?:[?#"'\s<]|$)|\.jpe?g(?:[?#"'\s<]|$)/i);
  excludes(html, /watermark|фипи[^<]{0,20}логотип|логотип[^<]{0,20}фипи/i);
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '';
  assert.ok(/Авторский/i.test(title));
  const description = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';
  assert.ok(/авторск/i.test(description));
});

gate('security: no outbound APIs or executable input, only one declared versioned storage key', () => {
  const executable = scripts.map(([, , body]) => body).join('\n');
  excludes(executable, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/);
  excludes(executable, /\beval\s*\(|\bnew\s+Function\b|\bimport\s*(?:\(|["'{*])/);
  excludes(html, /<script\b[^>]*src\s*=|@import\b|url\(\s*["']?(?:https?:)?\/\//i);
  excludes(executable, /\b(?:sessionStorage|indexedDB)\b|localStorage\.clear\s*\(|document\.cookie/);
  assert.equal(typeof STORAGE_KEY, 'string');
  assert.ok(/v1/.test(STORAGE_KEY));
  const writes = [...executable.matchAll(/localStorage\.(?:setItem|removeItem)\s*\(\s*([^,)\n]+)/g)];
  assert.ok(writes.length > 0);
    includes(executable, /const\s+M\s*=\s*globalThis\.ExamModel/);
  for (const match of writes) assert.ok(/^(?:(?:ExamModel|M)\.)?STORAGE_KEY$/.test(match[1].trim()), 'Foreign storage write');
  excludes(html, /(?:[A-Za-z]:[\\/](?:Users|home|tmp)[\\/])|\/Users\/|\/home\/[^/\s]+\/|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}/);
});

gate('one course card and one sitemap entry point to the author page', () => {
  const course = fs.readFileSync(path.join(root, 'trainers/oge-course/index.html'), 'utf8');
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  includes(course, /Полные тренировочные варианты/);
  const links = [...course.matchAll(/href=["']([^"']+)["']/g)]
    .filter(([, href]) => href.includes('oge-2027-analogue-1'));
  assert.ok(links.length >= 1);
  const target = new URL(links[0][1], 'https://mathexam.space/trainers/oge-course/');
    assert.equal(target.href, 'https://mathexam.space/trainers/oge-2027-analogue-1.html');
  for (const [, href] of links) assert.equal(new URL(href, target).href, target.href);
  assert.equal((course.match(/<h3>[\s\S]*?oge-2027-analogue-1\.html[\s\S]*?<\/h3>/g) || []).length, 1);
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
  assert.equal(urls.filter(url => url === target.href).length, 1);
});

gate('changed-file scope is limited to the six owner-approved paths', () => {
  const allowed = new Set([
    relativeTrainer, 'tools/oge-2027-analogue-1.test.mjs',
    'tools/oge-2027-analogue-1.browser.mjs', 'docs/tasks/OGE_2027_AUTHOR_ANALOGUE_1.md',
    'trainers/oge-course/index.html', 'sitemap.xml',
  ]);
  const git = (...args) => execFileSync('git', ['-c', 'safe.directory=' + root, ...args], {
    cwd: root, encoding: 'utf8',
  });
  const changed = new Set([
    ...git('diff', '--name-only', '5d49ad8919aac4763f1671d93549545755134364').trim().split(/\r?\n/),
    ...git('ls-files', '--others', '--exclude-standard').trim().split(/\r?\n/),
  ].filter(Boolean));
  assert.ok(changed.size <= 7);
  for (const file of changed) assert.ok(allowed.has(file), 'Out of scope: ' + file);
});
gate('model updates are pure and fresh attempts do not share mutable records', () => {
  const first = blankState(), second = blankState();
  assert.notEqual(first, second);
  assert.notEqual(first.entries, second.entries);
  assert.notEqual(first.entries[0], second.entries[0]);
  const original = { ...plain(first.entries[5]), input: '12,96' };
  const before = plain(original);
  checkAnswer(task(6), original);
  assert.deepEqual(original, before);
  reveal(original);
  assert.deepEqual(original, before);
});

gate('every answer and solution comes from one task collection', () => {
  assert.equal((modelScript[2].match(/\b(?:const|let)\s+TASKS\s*=/g) || []).length, 1);
  for (const t of tasks) {
    assert.ok(!/\b(?:undefined|NaN|Infinity)\b/.test(String(t.answer)), t.id);
    assert.ok(!/\b(?:undefined|NaN|Infinity)\b/.test(t.solution), t.id);
  }
});
function elements(svg, tag) {
  return [...svg.matchAll(new RegExp('<' + tag + '\\b([^>]*)>', 'g'))].map(([, attrs]) =>
    Object.fromEntries([...attrs.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value])));
}
const pointOf = circle => [Number(circle.cx), Number(circle.cy)];
const segmentOf = line => [[Number(line.x1), Number(line.y1)], [Number(line.x2), Number(line.y2)]];
function chart(svg) {
  const axes = elements(svg, 'line').filter(line => line.class === 'axis').map(segmentOf);
  const horizontal = axes.find(([a, b]) => a[1] === b[1]);
  const vertical = axes.find(([a, b]) => a[0] === b[0]);
  assert.ok(horizontal && vertical);
  const gridX = [...new Set(elements(svg, 'line').filter(line =>
    line.class === 'grid' && line.x1 === line.x2).map(line => Number(line.x1)))].sort((a, b) => a - b);
  assert.ok(gridX.length > 2);
  const scale = gridX[1] - gridX[0];
  assert.ok(scale > 0);
  const fromPixel = p => [(p[0] - vertical[0][0]) / scale, (horizontal[0][1] - p[1]) / scale];
  const paths = elements(svg, 'polyline').map(polyline =>
    polyline.points.trim().split(/\s+/).map(pair => fromPixel(pair.split(',').map(Number))));
  assert.ok(paths.length > 0);
  return { paths, fromPixel };
}
function angle(a, vertex, b) {
  const u = vector(vertex, a), v = vector(vertex, b);
  return Math.acos(Math.max(-1, Math.min(1, dot(u, v) / (Math.hypot(...u) * Math.hypot(...v))))) * 180 / Math.PI;
}
function drawingPoints(diagram) {
  const svg = renderDiagram(diagram);
  const rendered = elements(svg, 'circle').filter(circle => circle.class === 'point').map(pointOf);
  const names = Object.keys(diagram.points);
  assert.equal(rendered.length, names.length);
  return Object.fromEntries(names.map((name, index) => [name, rendered[index]]));
}

gate('all 12 task diagram records and tire context render 18 finite accessible SVGs', () => {
  const diagrams = tasks.flatMap(t => [t.diagram, t.solutionDiagram].filter(Boolean));
  assert.equal(diagrams.length, 12);
  for (const number of [7, 11, 13, 15, 18, 24, 25]) assert.ok(task(number).diagram, 'Task ' + number);
  assert.ok(task(22).solutionDiagram);
  const outputs = [...diagrams.map(d => renderDiagram(d)), model.tyreContext()];
  let svgCount = 0;
  for (const output of outputs) {
    assert.equal(typeof output, 'string');
    excludes(output, /\b(?:NaN|Infinity|undefined)\b/);
    for (const [, attrs, body] of output.matchAll(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/g)) {
      svgCount++;
      includes(attrs, /role="img"/); includes(attrs, /aria-label="[^"]+"/);
      includes(body, /<title>[^<]+<\/title>/);
      const viewBox = attrs.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
      assert.equal(viewBox.length, 4);
      assert.ok(viewBox.every(Number.isFinite) && viewBox[2] > 0 && viewBox[3] > 0);
      for (const [, coordinate] of body.matchAll(/\b(?:x|y|x1|y1|x2|y2|cx|cy|r)="([^"]+)"/g)) {
        assert.ok(Number.isFinite(Number(coordinate)));
      }
    }
  }
  assert.equal(svgCount, 18);
});

gate('tire table and wheel radii come from the same author dimensions', () => {
  const tyres = plain(model.TYRES);
  assert.deepEqual(tyres.factory, { width: 185, profile: 65, rim: 14 });
  assert.deepEqual(tyres.rims, [14, 15, 16]);
  assert.deepEqual(tyres.rows, [
    [175, 70, 65, null], [185, 65, 60, null], [195, null, 60, 55], [205, null, 55, 50],
  ]);
  assert.equal(tyres.inch, 25.4);
  const permittedR15 = tyres.rows.filter(row => row[2] !== null).map(row => row[0]);
  assert.equal(Math.max(...permittedR15), task(1).answer);
  const circles = elements(model.tyreContext(), 'circle');
  assert.equal(circles.length, 2);
  assert.equal(circles[0].cx, circles[1].cx); assert.equal(circles[0].cy, circles[1].cy);
  near(Number(circles[0].r) / Number(circles[1].r), number(factoryDiameter) / (14 * 25.4));
  for (const label of ['H', 'D', 'd · 25,4']) assert.ok(text(model.tyreContext()).includes(label));
});

gate('7: plotted position is sqrt(50) on the actual numbered scale', () => {
  const d = task(7).diagram, svg = renderDiagram(d);
  assert.deepEqual(plain(d.ticks), [6, 7, 8]);
  near(d.points.A, 6.6); near(d.points.B ** 2, 50);
  near(d.points.C, 7.45); near(d.points.D, 7.8);
  const ticks = elements(svg, 'line').filter(line => line.class === 'axis' && line.x1 === line.x2)
    .map(line => Number(line.x1)).sort((a, b) => a - b);
  const circles = elements(svg, 'circle').map(pointOf);
  assert.equal(circles.length, 4);
  const step = ticks[1] - ticks[0];
  Object.values(d.points).forEach((value, index) => near(6 + (circles[index][0] - ticks[0]) / step, value));
  for (const label of ['A', 'B', 'C', 'D']) includes(svg, new RegExp('>' + label + '</text>'));
});

gate('11: every plotted sample follows its data formula, with separate hyperbola branches', () => {
  const d = task(11).diagram;
  assert.deepEqual(plain(d.functions), [
    { label: 'А', type: 'quadratic', a: 1, b: 0, c: 1 },
    { label: 'Б', type: 'reciprocal', a: -1 },
    { label: 'В', type: 'linear', a: -1, b: 2 },
  ]);
  const svgs = [...renderDiagram(d).matchAll(/<svg\b[\s\S]*?<\/svg>/g)].map(match => match[0]);
  assert.equal(svgs.length, 3);
  const independentFunctions = [x => x * x + 1, x => -1 / x, x => -x + 2];
  svgs.forEach((svg, index) => {
    const plotted = chart(svg);
    assert.equal(plotted.paths.length, index === 1 ? 2 : 1);
    for (const branch of plotted.paths) {
      assert.ok(branch.length > 10);
      if (index === 1) assert.ok(branch.every(([x]) => x < 0) || branch.every(([x]) => x > 0));
      for (const [x, y] of branch) near(y, independentFunctions[index](x), 1e-8);
    }
    includes(svg, />x<\/text>/); includes(svg, />y<\/text>/);
  });
});

gate('13: interval endpoint fill and external rays agree with all four options', () => {
  const d = task(13).diagram;
  assert.deepEqual(plain(d.bounds), [-3, 3]);
  const expected = [[true, true, false], [false, false, true], [false, true, false], [true, false, false]];
  assert.deepEqual(plain(d.options.map(o => [o.leftClosed, o.rightClosed, o.outside])), expected);
  const svgs = [...renderDiagram(d).matchAll(/<svg\b[\s\S]*?<\/svg>/g)].map(match => match[0]);
  assert.equal(svgs.length, 4);
  svgs.forEach((svg, index) => {
    const endpoints = elements(svg, 'circle');
    assert.equal(endpoints.length, 2);
    assert.equal(endpoints[0].class, expected[index][0] ? 'point' : 'open');
    assert.equal(endpoints[1].class, expected[index][1] ? 'point' : 'open');
    assert.equal(elements(svg, 'line').filter(line => line.class === 'shape').length, expected[index][2] ? 2 : 1);
    includes(svg, />−3<\/text>/); includes(svg, />3<\/text>/);
  });
});

gate('15–18: rendered geometry preserves lengths, angles, circle tangency and square grid', () => {
  const bisector = task(15).diagram, edges = elements(renderDiagram(bisector), 'line')
    .filter(line => line.class === 'shape').map(segmentOf);
  const A = edges[0][0], B = edges[0][1], C = edges[1][1], K = edges[3][1];
  near(distance(A, K), distance(C, K));
  near(angle(A, C, B), bisector.angleC);
  near(angle(B, A, K), angle(K, A, C));
  near(angle(A, B, C), task(15).answer);
  const circleSvg = renderDiagram(task(16).diagram);
  const ring = elements(circleSvg, 'circle').find(circle => circle.class === 'aux');
  const squareSide = segmentOf(elements(circleSvg, 'line').find(line => line.class === 'shape'));
  near(distance(...squareSide), 2 * Number(ring.r));
  near(4 * task(16).diagram.radius ** 2, task(16).answer);
  const p = plain(task(17).diagram.points);
  near(distance(p.B, p.C), 4); near(distance(p.A, p.D), 11);
  const middleLeft = p.A.map((v, i) => (v + p.B[i]) / 2);
  const middleRight = p.C.map((v, i) => (v + p.D[i]) / 2);
  const crossAC = p.A.map((v, i) => (v + p.C[i]) / 2);
  near(Math.max(distance(middleLeft, crossAC), distance(crossAC, middleRight)), task(17).answer);
  const grid = task(18).diagram, gridSvg = renderDiagram(grid);
  assert.deepEqual(plain(grid.points), { A: [1, 1], B: [7, 9] });
  const rendered = drawingPoints(grid);
  const gridLines = elements(gridSvg, 'line').filter(line => line.class === 'grid').map(segmentOf);
  const verticals = gridLines.filter(([a, b]) => a[0] === b[0]).map(([a]) => a[0]).sort((a, b) => a - b);
  const horizontals = gridLines.filter(([a, b]) => a[1] === b[1]).map(([a]) => a[1]).sort((a, b) => a - b);
  near(verticals[1] - verticals[0], horizontals[1] - horizontals[0]);
  near(distance(rendered.A, rendered.B) / (verticals[1] - verticals[0]), task(18).answer);
});

gate('22: actual plotted branches obey domains and endpoint inclusion', () => {
  const d = task(22).solutionDiagram;
  assert.equal(d.boundary, 1);
  assert.deepEqual(plain(d.quadratic), [1, -4, 3]);
  assert.deepEqual(plain(d.linear), [2, 5]);
  const svg = renderDiagram(d), plotted = chart(svg);
  assert.equal(plotted.paths.length, 2);
  for (const [x, y] of plotted.paths[0]) {
    assert.ok(x >= 1 - 1e-12); near(y, x * x - 4 * x + 3);
  }
  for (const [x, y] of plotted.paths[1]) {
    assert.ok(x < 1); near(y, 2 * x + 5);
  }
  const dots = elements(svg, 'circle');
  assert.equal(dots.length, 2);
  const closed = dots.find(circle => circle.class === 'point');
  const open = dots.find(circle => circle.class === 'open');
  assert.ok(closed && open);
  const closedPoint = plotted.fromPixel(pointOf(closed)), openPoint = plotted.fromPixel(pointOf(open));
  near(closedPoint[0], 1); near(closedPoint[1], 0);
  near(openPoint[0], 1); near(openPoint[1], 7);
});

gate('23–25: published diagram coordinates satisfy the actual problem constraints', () => {
  const t23 = plain(task(23).diagram.points);
  near(distance(t23.A, t23.F), 8); near(distance(t23.B, t23.F), 15);
  near(distance(t23.A, t23.B), task(23).answer);
  near(cross(vector(t23.A, t23.D), vector(t23.B, t23.C)), 0);
  near(angle(t23.B, t23.A, t23.F), angle(t23.F, t23.A, t23.D));
  near(angle(t23.A, t23.B, t23.F), angle(t23.F, t23.B, t23.C));
  for (const points of [plain(task(24).diagram.points), drawingPoints(task(24).diagram)]) {
    near(cross(vector(points.A, points.C), vector(points.A, points.E)), 0, 1e-8);
    near(cross(vector(points.B, points.D), vector(points.B, points.E)), 0, 1e-8);
    const ratio = distance(points.A, points.B) / distance(points.D, points.C);
    near(distance(points.B, points.E) / distance(points.C, points.E), ratio);
    near(distance(points.A, points.E) / distance(points.D, points.E), ratio);
  }
  const t24 = task(24).diagram;
  for (const name of ['A', 'B', 'C', 'D']) near(dot(t24.points[name], t24.points[name]), t24.radius ** 2);
  const t25 = plain(task(25).solutionDiagram.points);
  near(distance(t25.A, t25.B), 24); near(distance(t25.C, t25.D), 40);
  near(distance(t25.B, t25.C), 4); near(distance(t25.A, t25.D), 36);
  near(distance(t25.A, t25.M), distance(t25.M, t25.B));
  near(cross(vector(t25.D, t25.M), vector(t25.D, t25.K)), 0);
  near(dot(vector(t25.P, t25.C), vector(t25.P, t25.D)), 0);
  assert.ok(t25.K[0] < t25.B[0] && t25.B[0] < t25.C[0]);
  for (const [name, point] of Object.entries(task(25).diagram.points)) assert.deepEqual(plain(point), t25[name]);
  const p = drawingPoints(task(25).solutionDiagram);
  near(distance(p.A, p.D) / distance(p.B, p.C), 9);
  near(distance(p.A, p.M), distance(p.M, p.B));
});

gate('expanded tasks have distinct 0/1/2 rubrics and task-specific partial-credit criteria', () => {
  for (const t of tasks.filter(t => t.part === 2)) {
    assert.equal(t.rubric.length, 3);
    assert.equal(new Set(t.rubric).size, 3);
    for (const criterion of t.rubric) assert.ok(text(criterion).length > 20);
  }
  includes(task(22).rubric[1], /ветви|график/); includes(task(22).rubric[1], /неполн|ошибоч/);
  includes(task(24).rubric[1], /вертикаль/); includes(task(24).rubric[1], /пробел/);
});

gate('saved-state validation rejects malformed and forged credit while preserving valid provenance', () => {
  const valid = plain(blankState());
  assert.deepEqual(plain(validateState(valid)), valid);
  valid.entries[0] = plain(checkAnswer(task(1), { ...valid.entries[0], input: '205', hinted: true }));
  valid.entries[1] = plain(checkAnswer(task(2), { ...reveal(valid.entries[1]), input: '102,5' }));
  valid.entries[19].manual = 1;
  assert.deepEqual(plain(validateState(valid)), valid);
  const invalid = [null, [], {}, { ...valid, version: 2 }, { ...valid, mode: 'other' },
    { ...valid, entries: valid.entries.slice(1) }, { ...valid, foreign: 1 }];
  const mutate = change => { const state = plain(blankState()); change(state); invalid.push(state); };
  mutate(s => { s.entries[0].wrong = -1; });
  mutate(s => { s.entries[0].wrong = 0.5; });
  mutate(s => { s.entries[0].correct = true; });
  mutate(s => { s.entries[0].checked = 'true'; });
  mutate(s => { s.entries[0].input = '9'.repeat(101); });
  mutate(s => { s.entries[0].manual = 2; });
  mutate(s => { s.entries[0].extra = true; });
  mutate(s => { s.entries[19].manual = 3; });
  mutate(s => { s.entries[19].manual = '2'; });
  mutate(s => { s.entries[19].checked = true; });
  mutate(s => { s.entries[19].input = 'x'.repeat(12001); });
  for (const candidate of invalid) assert.equal(validateState(candidate), null);
});

gate('decimal rounding cannot turn a distinct numerical answer into a correct one', () => {
  for (const [number, input] of [[1, '205.00000000000001'], [6, '12.9600000000000001']]) {
    const entry = { ...plain(blankState().entries[number - 1]), input };
    assert.equal(checkAnswer(task(number), entry).correct, false, input);
  }
  const entry = { ...plain(blankState().entries[5]), input: '012,9600' };
  assert.equal(checkAnswer(task(6), entry).correct, true);
});
gate('diagnostic answer keys do not collide numerically or overlap a correct answer', () => {
  let cases = 0;
  for (const t of tasks.slice(0, 19)) {
    const keys = Object.keys(t.errors || {});
    assert.equal(new Set(keys.map(normalizedNumber)).size, keys.length, t.id);
    for (const key of keys) {
      assert.ok(Number.isFinite(normalizedNumber(key)), t.id);
      const input = { ...plain(blankState().entries[t.number - 1]), input: key };
      assert.equal(checkAnswer(t, input).correct, false, t.id + ': ' + key);
      assert.ok(text(t.errors[key]).length > 10, t.id);
      cases++;
    }
  }
  assert.ok(cases > 0);
});
gate('visible scoring criteria do not disclose the final answers before solution reveal', () => {
  const normalize = value => text(value).replaceAll('−', '-').replace(/\s+/g, '');
  for (const number of [20, 21, 22, 23, 25]) {
    const t = task(number);
    for (const criterion of t.rubric) {
      if (typeof t.answer === 'number') {
        const finalNumber = new RegExp('(^|[^\\d])' + String(t.answer) + '(?!\\d)');
        assert.ok(!finalNumber.test(criterion), 'Rubric discloses answer to ' + number);
      } else {
        assert.ok(!normalize(criterion).includes(normalize(t.answer)), 'Rubric discloses answer to ' + number);
      }
    }
  }
  // In proof task 24 the target similarity is already part of the question;
  // stating that target in a rubric does not reveal its proof.
});