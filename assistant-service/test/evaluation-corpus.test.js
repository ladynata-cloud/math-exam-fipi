import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseQuestion } from '../src/privacy.js';
import { buildMessages, getBuiltinKnowledge, listProviderTopics } from '../src/tutor.js';

const corpus = JSON.parse(readFileSync(new URL('../evaluation/pilot-cases.json', import.meta.url), 'utf8'));
const modelCases = corpus.cases.filter(item => item.phase === 'model');
const preflightCases = corpus.cases.filter(item => item.phase === 'preflight');
const byId = new Map(corpus.cases.map(item => [item.id, item]));
const topics = listProviderTopics().map(topic => topic.id);
const requestId = '00000000-0000-4000-8000-000000000001';
const inputForApi = item => {
  const { simpler, ...input } = item.input;
  return { ...input, externalConsent: true, requestId };
};
const rational = value => {
  if (value.includes('/')) return value.split('/').map(BigInt);
  const [whole, tail = ''] = value.replace(',', '.').split('.');
  return [BigInt(whole + tail), 10n ** BigInt(tail.length)];
};
const abs = value => value < 0n ? -value : value;
const sameValue = (id, n, d = 1n) => {
  const [actualN, actualD] = rational(byId.get(id).expectation.answer);
  assert(actualD > 0n && d !== 0n, id);
  assert.equal(actualN * d, n * actualD, `Exact reference for ${id}`);
};

test('synthetic pilot has 32 bounded model cases, 8 local rejections and all seven topics', () => {
  assert.equal(corpus.schemaVersion, 1);
  assert.equal(corpus.id, 'mathexam-synthetic-pilot-v1');
  assert.equal(corpus.cases.length, 40);
  assert.equal(byId.size, 40, 'Case IDs are unique.');
  assert.equal(modelCases.length, 32);
  assert.equal(preflightCases.length, 8);
  assert.deepEqual([...new Set(modelCases.map(item => item.input.topic))].sort(), [...topics].sort());
  for (const item of modelCases) {
    const parsed = parseQuestion(inputForApi(item), topics);
    assert.equal(parsed.topic, item.input.topic);
    assert.equal(typeof item.input.simpler, 'boolean');
    assert(item.expectation.requiredPoints.length > 0 && item.expectation.forbiddenPoints.length > 0, item.id);
    assert.equal(item.expectedError, undefined);
  }
  for (const item of preflightCases) {
    assert.equal(item.expectation.kind, 'input-rejected');
    assert.throws(() => parseQuestion(inputForApi(item), topics), error => error.code === item.expectedError, item.id);
  }
});

test('reference criteria stay outside model messages and simpler pair differs only in that flag', () => {
  for (const item of modelCases) {
    const marker = `EVALUATOR_ONLY_REFERENCE_${item.id}`;
    const input = { ...parseQuestion(inputForApi(item), topics), simpler: item.input.simpler,
      expectation: { answer: marker }, expectedError: marker, category: marker, grade: marker, pairId: marker };
    const messages = buildMessages(input, getBuiltinKnowledge());
    assert(!JSON.stringify(messages).includes(marker), item.id);
    const payload = JSON.parse(messages.find(message => message.role === 'user').content);
    assert.deepEqual(Object.keys(payload).sort(), ['attempt', 'hintLevel', 'knowledge', 'mode', 'question', 'simpler', 'topic']);
  }
  const baseline = byId.get('m11-fraction-rule-baseline');
  const simpler = byId.get('m12-fraction-rule-simpler');
  assert.equal(baseline.pairId, simpler.pairId);
  assert.equal(baseline.input.simpler, false);
  assert.equal(simpler.input.simpler, true);
  assert.deepEqual({ ...baseline.input, simpler: true }, simpler.input);
});

test('synthetic numeric references agree with independent arithmetic, signs and stated rounding', () => {
  const checked = new Set();
  for (const id of ['m01-linear-first-hint', 'm02-linear-negative', 'm03-linear-fraction', 'm04-linear-wrong-attempt']) {
    const match = /^(-?\d+)x\s*([+-])\s*(\d+)\s*=\s*(-?\d+)$/.exec(byId.get(id).input.question);
    assert(match, id);
    const a = BigInt(match[1]), b = BigInt(match[3]) * (match[2] === '-' ? -1n : 1n), c = BigInt(match[4]);
    sameValue(id, c - b, a); checked.add(id);
  }
  for (const id of ['m07-fraction-first-hint', 'm08-fraction-signed-subtraction', 'm09-fraction-wrong-attempt', 'm31-injected-system-request']) {
    const match = /^(\d+)\/(\d+)\s*([+-])\s*(\d+)\/(\d+)/.exec(byId.get(id).input.question);
    assert(match, id);
    const a = BigInt(match[1]), b = BigInt(match[2]), c = BigInt(match[4]), d = BigInt(match[5]);
    sameValue(id, a * d + (match[3] === '-' ? -1n : 1n) * c * b, b * d); checked.add(id);
  }
  const percentReferences = {
    'm13-percent-decimal': [125n * 72n, 1000n],
    'm14-percent-reduction': [200n * (100n - 15n), 100n],
    'm15-percent-reverse': [75n * 100n, 100n - 25n],
    'm16-percent-false-premise': [100n * 120n * 80n, 100n * 100n]
  };
  for (const [id, [n, d]] of Object.entries(percentReferences)) { sameValue(id, n, d); checked.add(id); }
  for (const id of ['m17-gcd', 'm19-gcd-equal-sets']) {
    const [a, b] = byId.get(id).input.question.match(/\d+/g).map(Number);
    const common = Array.from({ length: Math.min(a, b) }, (_, i) => i + 1).filter(n => a % n === 0 && b % n === 0);
    sameValue(id, BigInt(Math.max(...common))); checked.add(id);
  }
  {
    const id = 'm18-lcm-interval', [a, b] = byId.get(id).input.question.match(/\d+/g).map(Number);
    const first = Array.from({ length: a * b }, (_, i) => i + 1).find(n => n % a === 0 && n % b === 0);
    sameValue(id, BigInt(first)); checked.add(id);
  }
  for (const id of ['m20-rounding-carry', 'm21-rounding-no-chain', 'm22-rounding-negative']) {
    const match = /Округли (-?\d+,\d+)/.exec(byId.get(id).input.question);
    const [n, d] = rational(match[1]);
    // Enumerate neighbouring tenths; compare exact distances and apply the
    // explicitly stated away-from-zero tie rule. No production solver is used.
    let best = null, distance = null;
    for (let tenth = -200n; tenth <= 200n; tenth++) {
      const candidateDistance = abs(tenth * d - 10n * n);
      if (distance === null || candidateDistance < distance || (candidateDistance === distance && abs(tenth) > abs(best))) {
        best = tenth; distance = candidateDistance;
      }
    }
    sameValue(id, best, 10n); checked.add(id);
  }
  assert.equal(byId.get('m20-rounding-carry').expectation.answer, '10,0', 'Requested precision is retained.');
  for (const id of ['m23-pythagoras-hypotenuse', 'm24-pythagoras-leg-hint']) {
    const [a, b] = byId.get(id).input.question.match(/\d+/g).map(BigInt);
    const [n, d] = rational(byId.get(id).expectation.answer);
    assert(n > 0n && d > 0n);
    const square = id === 'm23-pythagoras-hypotenuse' ? a * a + b * b : a * a - b * b;
    assert.equal(n * n, square * d * d, id); checked.add(id);
  }
  assert.deepEqual([...checked].sort(), modelCases.filter(item => item.expectation.kind === 'numeric').map(item => item.id).sort());
});

test('geometric counterexamples and cube section reference do not invent conditions', () => {
  // Distinct third sides 7 and 10 both satisfy the triangle inequalities for
  // sides 6 and 8, so the missing-angle task cannot have one numeric answer.
  for (const c of [7, 10]) assert(6 + 8 > c && 6 + c > 8 && 8 + c > 6);
  assert.equal(byId.get('m25-pythagoras-missing-angle').expectation.kind, 'clarify');
  assert(5 * 5 - 7 * 7 < 0, 'A 5 cm hypotenuse cannot have a 7 cm leg.');
  assert.equal(byId.get('m26-pythagoras-impossible').expectation.kind, 'refuse');

  // For the unit cube with A=(0,0,0), the stated midpoints lie in
  // x+y+z=1/2. Intersect that plane with all 12 edges independently.
  const vertices = Array.from({ length: 8 }, (_, mask) => [mask & 1, (mask >> 1) & 1, (mask >> 2) & 1]);
  const intersections = new Set();
  let edges = 0;
  for (let i = 0; i < vertices.length; i++) for (let j = i + 1; j < vertices.length; j++) {
    const a = vertices[i], b = vertices[j];
    if (a.filter((value, coordinate) => value !== b[coordinate]).length !== 1) continue;
    edges++;
    const sumA = a.reduce((sum, value) => sum + value, 0), sumB = b.reduce((sum, value) => sum + value, 0);
    const t = (0.5 - sumA) / (sumB - sumA);
    if (t >= 0 && t <= 1) intersections.add(a.map((value, coordinate) => value + t * (b[coordinate] - value)).join(','));
  }
  assert.equal(edges, 12);
  assert.deepEqual([...intersections].sort(), ['0,0,0.5', '0,0.5,0', '0.5,0,0']);
  assert.equal(byId.get('m28-section-cube-triangle').expectation.answer, 'Сечение — треугольник MNP.');
  assert.equal(byId.get('m29-section-missing-positions').expectation.kind, 'clarify');
  assert.match(byId.get('m30-section-collinear-points').expectation.answer, /не определяют единственную плоскость/);
});
