import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {manifest, references, questions, rubric, offline} from '../arzhenikov/materials.mjs';

const require = createRequire(import.meta.url);
const root = new URL('../../', import.meta.url);
const names = ['arithmetic','written','fractions','decimals','algebra','geometry'];
const banks = names.map(name => require(fileURLToPath(new URL('trainers/oge-basics/multiplication-division/arzhenikov-course-' + name + '.js', root))));
const lessons = banks.flatMap(track => track.lessons);

function inspectKeys(value, inspect) {
  if (Array.isArray(value)) return value.forEach(item => inspectKeys(item, inspect));
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) { inspect(key); inspectKeys(item, inspect); }
}

test('all 76 actual lessons have references and all 24 evaluations use separate source tasks', () => {
  const training = references(), evaluation = questions();
  assert.equal(training.length, 76);
  assert.equal(evaluation.length, 24);
  assert.deepEqual(new Set(training.map(row => row.source.lessonId)), new Set(lessons.map(row => row.id)));
  const referenceIds = new Set(training.map(row => row.source.taskId));
  assert.equal(referenceIds.size, 76);
  const evalIds = evaluation.filter(row => row.source).map(row => row.source.taskId);
  assert.equal(new Set(evalIds).size, evalIds.length);
  for (const taskId of evalIds) assert(!referenceIds.has(taskId), 'reference/evaluation task overlap: ' + taskId);
  assert.deepEqual(new Set(evaluation.filter(row => row.source).map(row => row.source.trackId)), new Set(names));
  for (const row of evaluation.filter(row => row.source)) {
    const lesson = lessons.find(lesson => lesson.id === row.source.lessonId);
    assert(lesson.tasks.slice(4).some(task => task.id === row.source.taskId));
  }
});

test('model inputs omit answer keys, future steps, rubric and control targets', () => {
  const forbidden = new Set(['answer','answers','expected','criterion','scoring','criticalErrors',
    'proposedAcceptance','calculation','explanation','worked','steps','target','raw','localStorage']);
  for (const packet of [...references(), ...questions()]) {
    inspectKeys(packet, key => assert(!forbidden.has(key), 'forbidden model-input field: ' + key));
    assert(JSON.stringify(packet).length < 12000, packet.id + ': bounded single-task packet');
    assert(!JSON.stringify(packet).includes(fileURLToPath(root)), 'no machine-specific source path');
  }
  assert(rubric().every(row => row.audience.startsWith('evaluator-only') && row.criterion));
});

test('specific synthetic mistakes preserve the intended current step and checker distinction', () => {
  const cases = new Map(questions().map(row => [row.id,row]));
  const zero = cases.get('written-zero-place').context;
  assert.equal(zero.currentStep.prompt, 'Цифра частного: 0 : 3');
  assert.equal(zero.currentStep.input, '2');
  assert.equal(zero.currentStep.status, 'wrong');
  const unchanged = cases.get('fraction-unchanged-denominator').context;
  assert.equal(unchanged.currentStep.id, 'dividend');
  assert.equal(unchanged.currentStep.input, '3/5');
  assert.equal(unchanged.currentStep.status, 'correct');
  const reduction = cases.get('fraction-reduce-format').context;
  assert.equal(reduction.phase, 'answer');
  assert.equal(reduction.status, 'format');
  assert.equal(reduction.formatIssue, 'reduce');
  const decimal = cases.get('decimal-format').context;
  assert.equal(decimal.status, 'format');
  assert.equal(decimal.formatIssue, 'notation');
  assert.equal(cases.get('geometry-confirmation').context.phase, 'solved');
  assert.equal(cases.get('missing-context').context.available, false);
});

test('preparation is deterministic and leaves every authored bank unchanged', () => {
  const before = JSON.stringify(banks);
  for (const operation of [manifest, references, questions, rubric, offline]) {
    assert.deepEqual(operation(), operation());
  }
  assert.equal(JSON.stringify(banks), before);
  const metadata = manifest();
  assert.equal(metadata.trackCount, 6);
  assert.equal(metadata.lessonCount, 76);
  assert.equal(metadata.taskCount, 608);
  assert.match(metadata.sourceFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(new Set(metadata.sources.map(item => item.path)).size, metadata.sources.length);
  assert(metadata.sources.every(item => /^[a-f0-9]{64}$/.test(item.sha256)));
});

test('CLI questions contain only user turns; local reference and local replies are labelled honestly', () => {
  const cli = fileURLToPath(new URL('../arzhenikov/materials.mjs', import.meta.url));
  const output = execFileSync(process.execPath, [cli,'questions'], {encoding:'utf8'});
  const rows = output.trimEnd().split('\n').map(line => JSON.parse(line));
  assert.deepEqual(rows, questions());
  assert(rows.every(row => row.turns.length >= 1 && row.turns.length <= 2 && row.turns.every(turn => typeof turn === 'string' && turn.length <= 500)));
  assert(references().every(row => row.provenance.includes('not a model answer')));
  assert(offline().every(row => row.backend === 'local-rules' && row.evaluated === false));
  assert.equal(offline().reduce((n, row) => n + row.turns.length, 0), questions().reduce((n,row) => n + row.turns.length, 0));
});
