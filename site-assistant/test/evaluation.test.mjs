import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  EVALUATION_DIRECTORY, EvaluationValidationError, loadEvaluation, parseJsonl,
  validateInput, validateEvaluation, validatePredictions, runAutomaticChecks,
  evaluatePredictions, compareReports,
} from '../scripts/evaluate-predictions.mjs';
import { prepareEvaluation } from '../scripts/prepare-evaluation.mjs';

const evaluation = await loadEvaluation();
const copy = value => structuredClone(value);
const predictions = () => evaluation.inputs.map(input => ({ id: input.id, response: 'Ответ для проверки самого инструмента; смысловая оценка не проведена.' }));
const check = (response, rule) => runAutomaticChecks(response, [{ id: 'test', ...rule }])[0];
const validate = ({ inputs = evaluation.inputs, rubrics = evaluation.rubrics, runtimeCases = evaluation.runtimeCases } = {}) => validateEvaluation(inputs, rubrics, runtimeCases);

test('subject holdout is separate, has the declared role balance and honest runtime scope', async () => {
  assert.equal(evaluation.inputs.length, 42);
  assert.deepEqual(evaluation.counts, { math: 20, reader: 12, tarot: 10 });
  assert.equal(evaluation.runtimeCases.filter(row => row.requests).length, 27);
  assert.equal(evaluation.runtimeCases.filter(row => row.unsupportedReason).length, 15);
  assert.equal(evaluation.rubrics.flatMap(row => row.automatic_checks).filter(rule => rule.type === 'exact_numeric').length, 2);
  const trainingDirectory = path.dirname(EVALUATION_DIRECTORY.replace(/\/$/, ''));
  const trainingQuestions = new Set();
  for (const filename of ['train-math.jsonl', 'train-reader.jsonl', 'train-tarot.jsonl', 'routing-holdout.jsonl']) {
    const rows = parseJsonl(await readFile(path.join(trainingDirectory, filename), 'utf8'));
    for (const row of rows) for (const message of row.messages ?? []) {
      if (message.role === 'user') trainingQuestions.add(message.content.normalize('NFKC').toLocaleLowerCase('ru').trim());
    }
  }
  for (const input of evaluation.inputs) {
    assert.equal(input.messages.at(-1).role, 'user');
    for (const message of input.messages.filter(item => item.role === 'user')) {
      assert.equal(trainingQuestions.has(message.content.normalize('NFKC').toLocaleLowerCase('ru').trim()), false, input.id);
    }
  }
});

test('model input schema rejects hidden answer and rubric fields at each level', () => {
  for (const field of ['expected_behavior', 'manual_rubric', 'reference_response']) {
    const input = copy(evaluation.inputs[0]); input[field] = 'leaked answer';
    assert.throws(() => validateInput(input), /unknown field/);
  }
  const contextLeak = copy(evaluation.inputs[0]); contextLeak.context.answer = '6';
  assert.throws(() => validateInput(contextLeak), /unknown field answer/);
  const messageLeak = copy(evaluation.inputs[0]); messageLeak.messages.at(-1).expected = '6';
  assert.throws(() => validateInput(messageLeak), /unknown field expected/);
  const appendedAnswer = copy(evaluation.inputs[0]); appendedAnswer.messages.push({ role: 'assistant', content: '6' });
  assert.throws(() => validateInput(appendedAnswer), /end with user/);
  const missingSource = copy(evaluation.inputs[0]); missingSource.context.source_urls.push('https://example.org/not-supplied');
  assert.throws(() => validateInput(missingSource), /absent from model messages/);
});

test('set validation rejects missing, unknown and duplicate rubric/runtime IDs', () => {
  assert.throws(() => validate({ rubrics: evaluation.rubrics.slice(1) }), /missing or unknown case IDs/);
  const rubrics = copy(evaluation.rubrics); rubrics[0].id = 'eval-unknown';
  assert.throws(() => validate({ rubrics }), /missing or unknown case IDs/);
  assert.throws(() => validate({ inputs: [...evaluation.inputs, evaluation.inputs[0]] }), /duplicate id/);
  assert.throws(() => validate({ runtimeCases: [...evaluation.runtimeCases, evaluation.runtimeCases[0]] }), /duplicate id/);
  assert.throws(() => validate({ runtimeCases: evaluation.runtimeCases.slice(1) }), /missing or unknown case IDs/);
});

test('runtime must preserve user turns and cannot receive a fabricated prior state', () => {
  const changed = copy(evaluation.runtimeCases); changed[0].requests[0].message = 'Другой вопрос';
  assert.throws(() => validate({ runtimeCases: changed }), /question differs/);
  const seeded = copy(evaluation.runtimeCases); seeded[0].requests[0].state = { correctAnswer: '6' };
  assert.throws(() => validate({ runtimeCases: seeded }), /unknown field state/);
  const invalidStep = copy(evaluation.runtimeCases); invalidStep[0].requests[0].context.step = 'unknown';
  assert.throws(() => validate({ runtimeCases: invalidStep }), /invalid division step/);
  const invalidDivisor = copy(evaluation.runtimeCases); invalidDivisor[0].requests[0].context.divisor = 0;
  assert.throws(() => validate({ runtimeCases: invalidDivisor }), /invalid divisor/);
  const missingTurn = copy(evaluation.runtimeCases); const multi = missingTurn.find(row => row.requests?.length > 1); multi.requests.pop();
  assert.throws(() => validate({ runtimeCases: missingTurn }), /preserve every user turn/);
});

test('prediction import rejects unknown, duplicate and missing IDs instead of silently changing denominator', () => {
  const unknown = predictions(); unknown[0].id = 'eval-nonexistent';
  assert.throws(() => validatePredictions(unknown, evaluation.inputs), /unknown id/);
  assert.throws(() => validatePredictions([...predictions(), predictions()[0]], evaluation.inputs), /duplicate id/);
  assert.throws(() => validatePredictions(predictions().slice(1), evaluation.inputs), /missing ids/);
  assert.throws(() => validatePredictions([], evaluation.inputs), /missing ids/);
});

test('prediction schema accepts only a nonempty response or explicit unsupported reason', () => {
  for (const extra of [{ model: 'secret-label' }, { expected_behavior: 'answer' }, { score: 1 }]) {
    const rows = predictions(); Object.assign(rows[0], extra);
    assert.throws(() => validatePredictions(rows, evaluation.inputs), /unknown field/);
  }
  const blank = predictions(); blank[0].response = ' ';
  assert.throws(() => validatePredictions(blank, evaluation.inputs), /nonempty string/);
  const falseSuccess = predictions(); falseSuccess[0] = { id: falseSuccess[0].id, status: 'passed', reason: 'success' };
  assert.throws(() => validatePredictions(falseSuccess, evaluation.inputs), /only unsupported/);
  const both = predictions(); both[0] = { ...both[0], status: 'unsupported', reason: 'none' };
  assert.throws(() => validatePredictions(both, evaluation.inputs), /unknown field response/);
});

test('unsupported coverage is separate and never treated as an automatic pass', () => {
  const rows = predictions(); rows[0] = { id: rows[0].id, status: 'unsupported', reason: 'No handler.' };
  const report = evaluatePredictions(evaluation, rows, { label: 'rules', kind: 'runtime' });
  assert.deepEqual({ total: report.coverage.total, answered: report.coverage.answered, unsupported: report.coverage.unsupported }, { total: 42, answered: 41, unsupported: 1 });
  assert.equal(report.coverage.bySite.math.unsupported, 1);
  assert.ok(report.cases[0].automaticChecks.every(result => result.status === 'not_run'));
  assert.equal(report.manualAssessment, 'not_assessed');
  assert.equal(report.qualityVerdict, 'not_established');
  for (const item of report.cases) for (const criterion of item.manualAssessment.criteria) {
    assert.equal(criterion.score, null); assert.equal(criterion.evidence, null);
  }
});

test('exact arithmetic compares rational values without float rounding or explanatory text', () => {
  for (const response of ['1/2', '4/8', '0.5', '0,50', '  +10/20  ', '-1/-2']) {
    assert.equal(check(response, { type: 'exact_numeric', value: '1/2' }).status, 'passed', response);
  }
  for (const response of ['1/3', '0.5000000000000001', '1/0', 'Ответ: 1/2', '0.5\nОбъяснение', '<b>0.5</b>']) {
    assert.equal(check(response, { type: 'exact_numeric', value: '1/2' }).status, 'failed', response);
  }
  assert.equal(check('0,55', { type: 'exact_numeric', value: '11/20' }).status, 'passed');
});

test('link checks accept supplied URLs, reject unlisted and non-HTTP markdown destinations, and detect required omission', () => {
  const url = 'https://example.org/source/#fragment';
  const allowed = { type: 'allowed_urls', allowed: [url] };
  assert.equal(check(`[Источник](${url})`, allowed).status, 'passed');
  assert.equal(check(`Источник: ${url}.`, allowed).status, 'passed');
  assert.equal(check('Без ссылки', allowed).status, 'passed');
  assert.equal(check('[Ссылка](https://example.org/invented)', allowed).status, 'failed');
  assert.equal(check('[Ссылка](javascript:alert)', allowed).status, 'failed');
  assert.equal(check('https://example.org/source/#other', allowed).status, 'failed');
  assert.equal(check('Нет ссылки', { type: 'requires_any_url', urls: [url] }).status, 'failed');
  assert.equal(check(url, { type: 'requires_any_url', urls: [url] }).status, 'passed');
});

test('HTML syntax is detected without rejecting ordinary inequalities', () => {
  for (const response of ['<p>Ответ</p>', '<img src=x>', '<!-- скрыто -->', '<!DOCTYPE html>']) {
    assert.equal(check(response, { type: 'no_html' }).status, 'failed', response);
  }
  assert.equal(check('При x < 3 и y > 2 проверь условие.', { type: 'no_html' }).status, 'passed');
  assert.equal(check('**Ответ**: 1/2', { type: 'no_html' }).status, 'passed');
});

test('private action phrase flag requests review and never establishes semantic safety', () => {
  assert.equal(check('Я сохранила запись в твою личную тетрадь.', { type: 'private_action_phrase_flag' }).status, 'review');
  const unflagged = check('Я не могу читать личную тетрадь; могу предложить текст.', { type: 'private_action_phrase_flag' });
  assert.equal(unflagged.status, 'passed');
  assert.match(unflagged.detail, /does not establish semantic compliance/);
});

test('set identity is order-stable and sensitive to input/rubric changes, with a separate runtime hash', () => {
  const reversed = validate({ inputs: [...evaluation.inputs].reverse(), rubrics: [...evaluation.rubrics].reverse(), runtimeCases: [...evaluation.runtimeCases].reverse() });
  assert.equal(reversed.evalSetHash, evaluation.evalSetHash);
  const inputs = copy(evaluation.inputs); inputs[0].messages[0].content += '\nНовое ограничение контекста.';
  const changedInputs = validate({ inputs });
  assert.notEqual(changedInputs.evalSetHash, evaluation.evalSetHash);
  assert.equal(changedInputs.rubricHash, evaluation.rubricHash);
  const rubrics = copy(evaluation.rubrics); rubrics[0].manual_rubric[0].requirement += ' Дополнительный критерий.';
  assert.notEqual(validate({ rubrics }).evalSetHash, evaluation.evalSetHash);
  const runtimeCases = copy(evaluation.runtimeCases); runtimeCases.find(row => row.unsupportedReason).unsupportedReason += ' Уточнение реализации.';
  const changedRuntime = validate({ runtimeCases });
  assert.equal(changedRuntime.evalSetHash, evaluation.evalSetHash);
  assert.notEqual(changedRuntime.runtimeSetHash, evaluation.runtimeSetHash);
});

test('model export contains input files and hashes, never evaluation answers or rubrics', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'assistant-eval-inputs-'));
  try {
    const manifest = await prepareEvaluation(directory);
    assert.deepEqual((await readdir(directory)).sort(), ['inputs.jsonl', 'manifest.json']);
    assert.equal(manifest.evalSetHash, evaluation.evalSetHash);
    assert.equal(manifest.referenceDataIncluded, false);
    const text = await readFile(path.join(directory, 'inputs.jsonl'), 'utf8');
    const exported = parseJsonl(text);
    assert.deepEqual(exported, evaluation.inputs);
    for (const rubric of evaluation.rubrics) assert.equal(text.includes(rubric.expected_behavior), false, rubric.id);
    for (const forbidden of ['"expected_behavior"', '"manual_rubric"', '"automatic_checks"', '"source_refs"']) assert.equal(text.includes(forbidden), false);
    await assert.rejects(() => prepareEvaluation(directory), /EEXIST/);
    await assert.rejects(() => prepareEvaluation(EVALUATION_DIRECTORY), /separate/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('reference and model comparison preserves provenance without inventing a winner', () => {
  const baseline = evaluatePredictions(evaluation, predictions(), { label: 'human-reference', kind: 'reference' });
  const candidate = evaluatePredictions(evaluation, predictions(), { label: 'unassessed-candidate', kind: 'model' });
  const result = compareReports(baseline, candidate, evaluation);
  assert.equal(result.baseline.run.kind, 'reference');
  assert.equal(result.candidate.run.kind, 'model');
  assert.equal(result.winner, null);
  assert.equal(result.manualAssessment, 'not_assessed');
  assert.equal(result.qualityVerdict, 'not_established');
  assert.equal(result.caseComparisons.length, 42);
});

test('comparison rejects another set, duplicate IDs, false quality claims and altered report evidence', () => {
  const baseline = evaluatePredictions(evaluation, predictions(), { label: 'baseline', kind: 'model' });
  const otherSet = copy(baseline); otherSet.evalSetHash = '0'.repeat(64);
  assert.throws(() => compareReports(baseline, otherSet, evaluation), /different evaluation sets/);
  const duplicated = copy(baseline); duplicated.cases[1].id = duplicated.cases[0].id;
  assert.throws(() => compareReports(baseline, duplicated, evaluation), /hash|duplicates/);
  const inflated = copy(baseline); inflated.coverage.answered += 1;
  assert.throws(() => compareReports(baseline, inflated, evaluation), /coverage counts/);
  const altered = copy(baseline); altered.cases[0].response = 'Изменённый ответ';
  assert.throws(() => compareReports(baseline, altered, evaluation), /predictions hash/);
  const assessed = copy(baseline); assessed.qualityVerdict = 'proven';
  assert.throws(() => compareReports(baseline, assessed, evaluation), /cannot assert assessed/);
  const manualScore = copy(baseline); manualScore.cases[0].manualAssessment.criteria[0].score = 2;
  assert.throws(() => compareReports(baseline, manualScore, evaluation), /manual score/);
  const extra = copy(baseline); extra.winner = 'candidate';
  assert.throws(() => compareReports(baseline, extra, evaluation), /unknown field/);
  assert.throws(() => compareReports(baseline, baseline), /canonical evaluation/);
});

test('comparison replays canonical checks rather than trusting manipulated statuses or rubric labels', () => {
  const baseline = evaluatePredictions(evaluation, predictions(), { label: 'reference-for-test', kind: 'reference' });
  assert.ok(baseline.automaticChecks.failed > 0);
  const forged = copy(baseline);
  for (const item of forged.cases) for (const result of item.automaticChecks) if (result.status === 'failed') result.status = 'passed';
  forged.automaticChecks.passed += forged.automaticChecks.failed;
  forged.automaticChecks.failed = 0;
  assert.throws(() => compareReports(baseline, forged, evaluation), /canonical re-evaluation/);
  const family = copy(baseline); family.cases[0].family = 'math.relabelled';
  assert.throws(() => compareReports(baseline, family, evaluation), /canonical re-evaluation/);
  const checkId = copy(baseline); checkId.cases[0].automaticChecks[0].id = 'substituted-check';
  assert.throws(() => compareReports(baseline, checkId, evaluation), /canonical re-evaluation/);
  const criterion = copy(baseline); criterion.cases[0].manualAssessment.criteria[0].requirement = 'Не проверять арифметику.';
  assert.throws(() => compareReports(baseline, criterion, evaluation), /canonical re-evaluation/);
});

test('malformed JSONL and unknown checks fail explicitly', () => {
  assert.throws(() => parseJsonl('{"id":'), EvaluationValidationError);
  const rubrics = copy(evaluation.rubrics); rubrics[0].automatic_checks.push({ id: 'fake-score', type: 'ai_judge' });
  assert.throws(() => validate({ rubrics }), /unknown check type/);
  const inventedUrl = copy(evaluation.rubrics); inventedUrl[0].automatic_checks.push({ id: 'invented-source', type: 'requires_any_url', urls: ['https://example.org/not-given'] });
  assert.throws(() => validate({ rubrics: inventedUrl }), /absent from model input context/);
});

test('CLI rejects incomplete predictions before writing a report and requires explicit run kind', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'assistant-eval-cli-'));
  try {
    const input = path.join(directory, 'incomplete.jsonl');
    const output = path.join(directory, 'report.json');
    await writeFile(input, JSON.stringify(predictions()[0]) + '\n');
    const script = fileURLToPath(new URL('../scripts/evaluate-predictions.mjs', import.meta.url));
    const result = spawnSync(process.execPath, [script, '--predictions', input, '--label', 'candidate', '--kind', 'model', '--output', output], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing ids/);
    await assert.rejects(() => access(output), /ENOENT/);
    const noKind = spawnSync(process.execPath, [script, '--predictions', input, '--label', 'candidate', '--output', output], { encoding: 'utf8' });
    assert.notEqual(noKind.status, 0);
    assert.match(noKind.stderr, /kind must be/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
