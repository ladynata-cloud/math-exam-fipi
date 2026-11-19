/** Offline evaluation only. This module has no provider, fetch, or network dependency. */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const EVALUATION_DIRECTORY = fileURLToPath(new URL('../training/evaluation/', import.meta.url));
const SITES = ['math', 'reader', 'tarot'];
const RUNTIME_SITES = { math: 'mathexam', reader: 'uzel', tarot: 'tarot' };
const KINDS = ['model', 'runtime', 'reference'];
const CRITERIA = ['subject_correctness', 'uses_available_context', 'learning_support', 'source_integrity', 'spoiler_control', 'uncertainty', 'role_boundary'];
const ID = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const HASH = /^[a-f0-9]{64}$/;

export class EvaluationValidationError extends Error {
  constructor(message) { super(message); this.name = 'EvaluationValidationError'; }
}
function requireThat(condition, message) { if (!condition) throw new EvaluationValidationError(message); }
function object(value, label) {
  requireThat(value !== null && typeof value === 'object' && !Array.isArray(value), `${label}: object required`);
}
function keys(value, required, optional, label) {
  object(value, label);
  for (const key of required) requireThat(Object.hasOwn(value, key), `${label}: missing ${key}`);
  for (const key of Object.keys(value)) requireThat([...required, ...optional].includes(key), `${label}: unknown field ${key}`);
}
function string(value, label, max = 32000) {
  requireThat(typeof value === 'string' && value.trim() && value.length <= max, `${label}: nonempty string up to ${max} characters required`);
}
function identifier(value, label) { string(value, label, 160); requireThat(ID.test(value), `${label}: invalid identifier`); }
function url(value, label) {
  string(value, label, 2048);
  let parsed;
  try { parsed = new URL(value); } catch { throw new EvaluationValidationError(`${label}: invalid URL`); }
  requireThat(['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password, `${label}: public HTTP(S) URL required`);
  return parsed.href;
}
function uniqueStrings(value, label, { allowEmpty = false, urls = false } = {}) {
  requireThat(Array.isArray(value) && (allowEmpty || value.length > 0), `${label}: nonempty array required`);
  for (const item of value) { string(item, label); if (urls) url(item, label); }
  requireThat(new Set(value).size === value.length, `${label}: duplicate value`);
}
function sameStrings(left, right) { return left.length === right.length && left.every(value => right.includes(value)); }

export function stableStringify(value) {
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
export function sha256(value) { return createHash('sha256').update(typeof value === 'string' ? value : stableStringify(value)).digest('hex'); }
export function parseJsonl(text, label = 'JSONL') {
  requireThat(typeof text === 'string', `${label}: text required`);
  const rows = [];
  for (const [index, line] of text.replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try { rows.push(JSON.parse(line)); }
    catch { throw new EvaluationValidationError(`${label}:${index + 1}: invalid JSON`); }
  }
  return rows;
}
async function readJsonl(filename) { return parseJsonl(await readFile(filename, 'utf8'), path.basename(filename)); }

export function validateInput(input) {
  keys(input, ['id', 'site', 'context', 'messages'], [], 'input');
  identifier(input.id, 'input.id');
  requireThat(SITES.includes(input.site), `${input.id}: invalid site`);
  keys(input.context, ['mode', 'source_urls'], [], `${input.id}.context`);
  identifier(input.context.mode, `${input.id}.mode`);
  uniqueStrings(input.context.source_urls, `${input.id}.source_urls`, { urls: true });
  requireThat(Array.isArray(input.messages) && input.messages.length >= 2 && input.messages.length % 2 === 0, `${input.id}: messages must start with system and end with user`);
  input.messages.forEach((message, index) => {
    keys(message, ['role', 'content'], [], `${input.id}.messages[${index}]`);
    const expectedRole = index === 0 ? 'system' : index % 2 === 1 ? 'user' : 'assistant';
    requireThat(message.role === expectedRole, `${input.id}: invalid message order at ${index}`);
    string(message.content, `${input.id}.message`);
  });
  const suppliedText = input.messages.map(message => message.content).join('\n');
  requireThat(input.context.source_urls.every(value => suppliedText.includes(value)), `${input.id}: a source URL is metadata only and absent from model messages`);
  return input;
}

function rational(value) {
  if (typeof value !== 'string' || value.length > 96) return null;
  const text = value.trim().replace(/−/g, '-').replace(',', '.');
  let n, d;
  if (/^[+-]?\d+\s*\/\s*[+-]?\d+$/.test(text)) {
    const pair = text.split('/').map(part => BigInt(part.trim()));
    [n, d] = pair;
    if (!d) return null;
  } else if (/^[+-]?\d+(?:\.\d+)?$/.test(text)) {
    const negative = text.startsWith('-');
    const unsigned = text.replace(/^[+-]/, '');
    const [whole, decimal = ''] = unsigned.split('.');
    n = BigInt(whole + decimal) * (negative ? -1n : 1n);
    d = 10n ** BigInt(decimal.length);
  } else return null;
  if (d < 0n) { n = -n; d = -d; }
  return { n, d };
}

function validateCheck(check, label, input) {
  object(check, label);
  const fields = {
    no_html: [], allowed_urls: ['allowed'], requires_any_url: ['urls'],
    exact_numeric: ['value'], private_action_phrase_flag: [],
  };
  requireThat(Object.hasOwn(fields, check.type), `${label}: unknown check type`);
  keys(check, ['id', 'type', ...fields[check.type]], [], label);
  identifier(check.id, `${label}.id`);
  if (check.type === 'allowed_urls') {
    uniqueStrings(check.allowed, `${label}.allowed`, { urls: true });
    requireThat(sameStrings(check.allowed, input.context.source_urls), `${label}: allowed URLs must equal supplied source URLs`);
  }
  if (check.type === 'requires_any_url') {
    uniqueStrings(check.urls, `${label}.urls`, { urls: true });
    requireThat(check.urls.every(value => input.context.source_urls.includes(value)), `${label}: required URL absent from model input context`);
  }
  if (check.type === 'exact_numeric') requireThat(rational(check.value) !== null, `${label}: invalid exact rational value`);
}

export function validateRubric(rubric, input) {
  keys(rubric, ['id', 'site', 'family', 'source_refs', 'expected_behavior', 'automatic_checks', 'manual_rubric'], [], 'rubric');
  requireThat(rubric.id === input.id && rubric.site === input.site, `${input.id}: rubric identity mismatch`);
  identifier(rubric.family, `${input.id}.family`);
  uniqueStrings(rubric.source_refs, `${input.id}.source_refs`);
  string(rubric.expected_behavior, `${input.id}.expected_behavior`);
  requireThat(Array.isArray(rubric.automatic_checks) && rubric.automatic_checks.length > 0, `${input.id}: automatic checks required`);
  const checkIds = new Set();
  for (const check of rubric.automatic_checks) {
    validateCheck(check, `${input.id}.check`, input);
    requireThat(!checkIds.has(check.id), `${input.id}: duplicate check id`);
    checkIds.add(check.id);
  }
  requireThat(['no_html', 'allowed_urls'].every(type => rubric.automatic_checks.some(check => check.type === type)), `${input.id}: format and URL boundary checks required`);
  requireThat(Array.isArray(rubric.manual_rubric) && rubric.manual_rubric.length >= 2, `${input.id}: manual rubric required`);
  const criteria = new Set();
  for (const item of rubric.manual_rubric) {
    keys(item, ['criterion', 'requirement', 'critical'], [], `${input.id}.manual`);
    requireThat(CRITERIA.includes(item.criterion), `${input.id}: unknown manual criterion`);
    requireThat(!criteria.has(item.criterion), `${input.id}: duplicate manual criterion`);
    criteria.add(item.criterion);
    string(item.requirement, `${input.id}.manual.requirement`);
    requireThat(typeof item.critical === 'boolean', `${input.id}: manual critical must be boolean`);
  }
  return rubric;
}

function validateRuntime(runtime, input) {
  object(runtime, 'runtime case');
  requireThat(runtime.id === input.id, `${input.id}: runtime identity mismatch`);
  if (Object.hasOwn(runtime, 'unsupportedReason')) {
    keys(runtime, ['id', 'unsupportedReason'], [], `${input.id}.runtime`);
    string(runtime.unsupportedReason, `${input.id}.unsupportedReason`);
    return runtime;
  }
  keys(runtime, ['id', 'requests'], [], `${input.id}.runtime`);
  requireThat(Array.isArray(runtime.requests) && runtime.requests.length > 0, `${input.id}: runtime requests required`);
  const userMessages = input.messages.filter(message => message.role === 'user').map(message => message.content);
  requireThat(runtime.requests.length === userMessages.length, `${input.id}: runtime must preserve every user turn`);
  runtime.requests.forEach((request, index) => {
    keys(request, ['site', 'message', 'context'], [], `${input.id}.runtime.request`);
    requireThat(request.site === RUNTIME_SITES[input.site], `${input.id}: wrong runtime site`);
    requireThat(request.message === userMessages[index], `${input.id}: runtime question differs from model question`);
    requireThat(request.message.length <= 500, `${input.id}: runtime message exceeds API limit`);
    object(request.context, `${input.id}.runtime.context`);
    const allowed = {
      mathexam: { navigator: ['surface', 'pathname'], division: ['surface', 'step', 'divisor', 'partial', 'attempt', 'dividend', 'originalDivisor'] },
      uzel: { reader: ['surface', 'mode', 'workId'] },
      tarot: { symbols: ['surface', 'entityId', 'aspect'] },
    }[request.site][request.context.surface];
    requireThat(allowed, `${input.id}: unsupported runtime surface`);
    keys(request.context, ['surface'], allowed.filter(key => key !== 'surface'), `${input.id}.runtime.context`);
    for (const value of Object.values(request.context)) requireThat(['string', 'number', 'boolean'].includes(typeof value), `${input.id}: non-scalar runtime context`);
    const context = request.context;
    if (context.surface === 'navigator' && Object.hasOwn(context, 'pathname')) {
      requireThat(typeof context.pathname === 'string' && context.pathname.length <= 500 && /^\/(?!\/)[\w./-]*$/.test(context.pathname), `${input.id}: invalid navigator pathname`);
    }
    if (context.surface === 'division') {
      requireThat(['start', 'count', 'digit', 'product', 'subtract', 'remainder-check', 'bring', 'partial', 'comma', 'answer', 'final-remainder', 'verify', 'shift-count', 'shift-factor', 'shift-divisor', 'shift-dividend'].includes(context.step), `${input.id}: invalid division step`);
      requireThat(Number.isSafeInteger(context.divisor) && context.divisor > 0 && context.divisor <= 1e9, `${input.id}: invalid divisor`);
      if (Object.hasOwn(context, 'partial')) requireThat(Number.isSafeInteger(context.partial) && context.partial >= 0 && context.partial <= 1e12, `${input.id}: invalid partial dividend`);
      if (Object.hasOwn(context, 'attempt')) requireThat(Number.isInteger(context.attempt) && context.attempt >= 0 && context.attempt <= 9, `${input.id}: invalid quotient digit`);
      for (const key of ['dividend', 'originalDivisor']) if (Object.hasOwn(context, key)) requireThat(typeof context[key] === 'string' && /^\d{1,12}(?:[.,]\d{1,6})?$/.test(context[key]), `${input.id}: invalid ${key}`);
    }
    if (context.surface === 'reader') {
      requireThat(['before_reading', 'after_reading'].includes(context.mode), `${input.id}: invalid reader mode`);
      if (context.mode === 'after_reading' || Object.hasOwn(context, 'workId')) identifier(context.workId, `${input.id}.workId`);
    }
    if (context.surface === 'symbols') {
      if (Object.hasOwn(context, 'entityId')) identifier(context.entityId, `${input.id}.entityId`);
      if (Object.hasOwn(context, 'aspect')) requireThat(['observation', 'commentary', 'source', 'practice', 'tradition'].includes(context.aspect), `${input.id}: invalid tarot aspect`);
    }
  });
  return runtime;
}

function keyedRows(rows, label) {
  requireThat(Array.isArray(rows) && rows.length > 0, `${label}: empty set`);
  const result = new Map();
  for (const row of rows) {
    object(row, label); identifier(row.id, `${label}.id`);
    requireThat(!result.has(row.id), `${label}: duplicate id ${row.id}`);
    result.set(row.id, row);
  }
  return result;
}

export function validateEvaluation(inputs, rubrics, runtimeCases) {
  const inputMap = keyedRows(inputs, 'inputs');
  const rubricMap = keyedRows(rubrics, 'rubrics');
  const runtimeMap = keyedRows(runtimeCases, 'runtime cases');
  for (const [label, mapping] of [['rubrics', rubricMap], ['runtime cases', runtimeMap]]) {
    requireThat(mapping.size === inputMap.size && [...mapping.keys()].every(id => inputMap.has(id)), `${label}: missing or unknown case IDs`);
  }
  for (const input of inputs) {
    validateInput(input); validateRubric(rubricMap.get(input.id), input); validateRuntime(runtimeMap.get(input.id), input);
  }
  const sorted = rows => [...rows].sort((a, b) => a.id.localeCompare(b.id, 'en'));
  const inputHash = sha256(sorted(inputs));
  const rubricHash = sha256(sorted(rubrics));
  return {
    inputs, rubrics, runtimeCases,
    inputHash, rubricHash, runtimeSetHash: sha256(sorted(runtimeCases)),
    evalSetHash: sha256({ schemaVersion: 1, inputs: sorted(inputs), rubrics: sorted(rubrics) }),
    counts: Object.fromEntries(SITES.map(site => [site, inputs.filter(input => input.site === site).length])),
  };
}

export async function loadEvaluation(directory = EVALUATION_DIRECTORY) {
  const [inputs, rubrics, runtimeCases] = await Promise.all([
    readJsonl(path.join(directory, 'inputs.jsonl')),
    readJsonl(path.join(directory, 'rubrics.jsonl')),
    readJsonl(path.join(directory, 'runtime-cases.jsonl')),
  ]);
  return validateEvaluation(inputs, rubrics, runtimeCases);
}

export function validateResponse(prediction, knownIds) {
  object(prediction, 'prediction'); identifier(prediction.id, 'prediction.id');
  requireThat(knownIds.has(prediction.id), `predictions: unknown id ${prediction.id}`);
  if (Object.hasOwn(prediction, 'status')) {
    keys(prediction, ['id', 'status', 'reason'], [], prediction.id);
    requireThat(prediction.status === 'unsupported', `${prediction.id}: only unsupported may omit a response`);
    string(prediction.reason, `${prediction.id}.reason`, 2000);
  } else {
    keys(prediction, ['id', 'response'], [], prediction.id);
    string(prediction.response, `${prediction.id}.response`, 32000);
  }
  return prediction;
}

export function validatePredictions(predictions, inputs) {
  const knownIds = new Set(inputs.map(input => input.id));
  const byId = new Map();
  requireThat(Array.isArray(predictions), 'predictions: array required');
  for (const prediction of predictions) {
    validateResponse(prediction, knownIds);
    requireThat(!byId.has(prediction.id), `predictions: duplicate id ${prediction.id}`);
    byId.set(prediction.id, prediction);
  }
  const missing = [...knownIds].filter(id => !byId.has(id));
  requireThat(!missing.length, `predictions: missing ids ${missing.join(', ')}`);
  return byId;
}

function linksIn(text) {
  const links = new Set();
  for (const match of text.matchAll(/https?:\/\/[^\s<>"\]\)\}]+/gu)) links.add(match[0].replace(/[.,;!?]+$/u, ''));
  for (const match of text.matchAll(/\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/gu)) links.add(match[1]);
  return [...links];
}
export function runAutomaticChecks(response, checks) {
  const foundUrls = linksIn(response);
  return checks.map(check => {
    let passed = true, detail = '';
    if (check.type === 'no_html') {
      passed = !/<\s*(?:!?doctype\b|!--|\/?[a-z][a-z0-9-]*(?:\s[^<>]*|\/?)>)/iu.test(response);
      detail = passed ? 'No HTML tag syntax detected.' : 'HTML tag syntax detected.';
    } else if (check.type === 'allowed_urls') {
      const allowed = new Set(check.allowed.map(value => new URL(value).href));
      const unexpected = foundUrls.filter(value => { try { return !allowed.has(new URL(value).href); } catch { return true; } });
      passed = !unexpected.length;
      detail = passed ? `All ${foundUrls.length} detected links are supplied sources; absence of links is allowed.` : `Unexpected links: ${unexpected.join(' ')}`;
    } else if (check.type === 'requires_any_url') {
      passed = foundUrls.some(value => { try { return check.urls.some(expected => new URL(expected).href === new URL(value).href); } catch { return false; } });
      detail = passed ? 'A requested source URL is present.' : 'None of the requested source URLs is present.';
    } else if (check.type === 'exact_numeric') {
      const actual = rational(response), expected = rational(check.value);
      passed = Boolean(actual && expected && actual.n * expected.d === expected.n * actual.d);
      detail = passed ? 'The numeric-only response equals the specified rational exactly.' : 'Numeric-only format or exact rational value does not match.';
    } else if (check.type === 'private_action_phrase_flag') {
      const flagged = /(?:^|[^\p{L}])я\s+(?:уже\s+)?(?:прочитал[а]?|открыл[а]?|сохранил[а]?|отправил[а]?|изменил[а]?|записал[а]?)(?!\p{L})[^.!?\n]{0,140}(?:тетрад|кабинет|дневник|личн|учител)/iu.test(response);
      return { id: check.id, type: check.type, status: flagged ? 'review' : 'passed', detail: flagged ? 'Possible claim of a private action; inspect wording and negation manually.' : 'No listed private-action phrase detected; this does not establish semantic compliance.' };
    } else throw new EvaluationValidationError(`Unknown check type ${check.type}`);
    return { id: check.id, type: check.type, status: passed ? 'passed' : 'failed', detail };
  });
}

export function evaluatePredictions(evaluation, predictions, { label, kind } = {}) {
  string(label, 'run label', 160); requireThat(KINDS.includes(kind), 'kind must be model, runtime, or reference');
  const byId = validatePredictions(predictions, evaluation.inputs);
  const rubrics = new Map(evaluation.rubrics.map(rubric => [rubric.id, rubric]));
  const cases = evaluation.inputs.map(input => {
    const prediction = byId.get(input.id), rubric = rubrics.get(input.id);
    const answered = Object.hasOwn(prediction, 'response');
    const checks = answered ? runAutomaticChecks(prediction.response, rubric.automatic_checks) :
      rubric.automatic_checks.map(check => ({ id: check.id, type: check.type, status: 'not_run', detail: prediction.reason }));
    return {
      id: input.id, site: input.site, family: rubric.family,
      status: answered ? 'answered' : 'unsupported',
      ...(answered ? { response: prediction.response } : { reason: prediction.reason }),
      automaticChecks: checks,
      manualAssessment: { status: 'not_assessed', criteria: rubric.manual_rubric.map(item => ({ ...item, score: null, evidence: null })) },
    };
  });
  const statuses = ['passed', 'failed', 'review', 'not_run'];
  const aggregate = subset => Object.fromEntries(statuses.map(status => [status, subset.flatMap(item => item.automaticChecks).filter(check => check.status === status).length]));
  return {
    schemaVersion: 1, reportType: 'offline-predictions-evaluation',
    evalSetHash: evaluation.evalSetHash, inputHash: evaluation.inputHash, rubricHash: evaluation.rubricHash,
    run: { label, kind, predictionsHash: sha256([...predictions].sort((a, b) => a.id.localeCompare(b.id, 'en'))) },
    coverage: {
      total: cases.length, answered: cases.filter(item => item.status === 'answered').length,
      unsupported: cases.filter(item => item.status === 'unsupported').length,
      bySite: Object.fromEntries(SITES.map(site => [site, {
        total: cases.filter(item => item.site === site).length,
        answered: cases.filter(item => item.site === site && item.status === 'answered').length,
        unsupported: cases.filter(item => item.site === site && item.status === 'unsupported').length,
      }])),
    },
    automaticChecks: aggregate(cases), manualAssessment: 'not_assessed', qualityVerdict: 'not_established',
    limitations: [
      'Format, exact arithmetic and URL checks do not measure teaching quality or learning outcomes.',
      'An explicit unsupported record is coverage information, not a correct answer.',
      'A reference or deterministic runtime run is not evidence of trained-model quality.',
      'Pedagogy, meaning, citations, spoiler boundaries and harmful certainty require human assessment.',
    ], cases,
  };
}

export function compareReports(baseline, candidate, evaluation) {
  object(evaluation, 'canonical evaluation');
  const canonical = validateEvaluation(evaluation.inputs, evaluation.rubrics, evaluation.runtimeCases);
  for (const [name, report] of [['baseline', baseline], ['candidate', candidate]]) {
    keys(report, ['schemaVersion', 'reportType', 'evalSetHash', 'inputHash', 'rubricHash', 'run', 'coverage', 'automaticChecks', 'manualAssessment', 'qualityVerdict', 'limitations', 'cases'], [], name);
    requireThat(report.schemaVersion === 1 && report.reportType === 'offline-predictions-evaluation', `${name}: unsupported report schema`);
    requireThat(HASH.test(report.evalSetHash) && HASH.test(report.inputHash) && HASH.test(report.rubricHash), `${name}: invalid set hash`);
    requireThat(report.evalSetHash === canonical.evalSetHash && report.inputHash === canonical.inputHash && report.rubricHash === canonical.rubricHash, `${name}: different evaluation sets or rubrics; load the original canonical evaluation directory`);
    keys(report.run, ['label', 'kind', 'predictionsHash'], [], `${name}.run`);
    string(report.run.label, `${name}.run.label`, 160);
    requireThat(KINDS.includes(report.run.kind) && HASH.test(report.run.predictionsHash), `${name}: missing run identity`);
    requireThat(report.qualityVerdict === 'not_established' && report.manualAssessment === 'not_assessed', `${name}: automatic report cannot assert assessed model quality`);
    uniqueStrings(report.limitations, `${name}.limitations`);
    requireThat(Array.isArray(report.cases) && report.cases.length > 0, `${name}: missing cases`);
    const predictions = [];
    for (const item of report.cases) {
      requireThat(['answered', 'unsupported'].includes(item.status), `${name}: invalid case status`);
      keys(item, ['id', 'site', 'family', 'status', 'automaticChecks', 'manualAssessment', item.status === 'answered' ? 'response' : 'reason'], [], `${name}.case`);
      identifier(item.id, `${name}.case.id`); identifier(item.family, `${name}.case.family`);
      requireThat(SITES.includes(item.site), `${name}: invalid case site`);
      string(item.status === 'answered' ? item.response : item.reason, `${name}.case.content`);
      predictions.push(item.status === 'answered' ? { id: item.id, response: item.response } : { id: item.id, status: 'unsupported', reason: item.reason });
      requireThat(Array.isArray(item.automaticChecks) && item.automaticChecks.length > 0, `${name}: missing automatic checks`);
      const checkIds = new Set();
      for (const check of item.automaticChecks) {
        keys(check, ['id', 'type', 'status', 'detail'], [], `${name}.check`);
        identifier(check.id, `${name}.check.id`); string(check.detail, `${name}.check.detail`);
        requireThat(!checkIds.has(check.id), `${name}: duplicate check id`); checkIds.add(check.id);
        requireThat(['no_html', 'allowed_urls', 'requires_any_url', 'exact_numeric', 'private_action_phrase_flag'].includes(check.type), `${name}: unknown check type`);
        requireThat(item.status === 'unsupported' ? check.status === 'not_run' : ['passed', 'failed', 'review'].includes(check.status), `${name}: invalid check status for coverage`);
      }
      keys(item.manualAssessment, ['status', 'criteria'], [], `${name}.manualAssessment`);
      requireThat(item.manualAssessment.status === 'not_assessed' && Array.isArray(item.manualAssessment.criteria) && item.manualAssessment.criteria.length >= 2, `${name}: invalid manual status`);
      const criteria = new Set();
      for (const criterion of item.manualAssessment.criteria) {
        keys(criterion, ['criterion', 'requirement', 'critical', 'score', 'evidence'], [], `${name}.criterion`);
        requireThat(CRITERIA.includes(criterion.criterion) && !criteria.has(criterion.criterion), `${name}: unknown or duplicate manual criterion`);
        criteria.add(criterion.criterion); string(criterion.requirement, `${name}.criterion.requirement`);
        requireThat(typeof criterion.critical === 'boolean' && criterion.score === null && criterion.evidence === null, `${name}: automatic report contains a manual score`);
      }
    }
    const counts = cases => ({ total: cases.length, answered: cases.filter(item => item.status === 'answered').length, unsupported: cases.filter(item => item.status === 'unsupported').length });
    const expectedCoverage = { ...counts(report.cases), bySite: Object.fromEntries(SITES.map(site => [site, counts(report.cases.filter(item => item.site === site))])) };
    const expectedAutomatic = Object.fromEntries(['passed', 'failed', 'review', 'not_run'].map(status => [status, report.cases.flatMap(item => item.automaticChecks).filter(check => check.status === status).length]));
    requireThat(stableStringify(report.coverage) === stableStringify(expectedCoverage), `${name}: coverage counts do not match cases`);
    requireThat(stableStringify(report.automaticChecks) === stableStringify(expectedAutomatic), `${name}: automatic counts do not match cases`);
    requireThat(report.run.predictionsHash === sha256(predictions.sort((a, b) => a.id.localeCompare(b.id, 'en'))), `${name}: predictions hash does not match responses`);
    // Hash labels and self-consistent counters do not establish that the checks were run.
    // Replay from actual responses and the canonical rubric, including all case metadata.
    const replayed = evaluatePredictions(canonical, predictions, { label: report.run.label, kind: report.run.kind });
    const sortedCases = value => ({ ...value, cases: [...value.cases].sort((a, b) => a.id.localeCompare(b.id, 'en')) });
    requireThat(stableStringify(sortedCases(report)) === stableStringify(sortedCases(replayed)), `${name}: report differs from canonical re-evaluation of the supplied responses`);
  }
  requireThat(baseline.evalSetHash === candidate.evalSetHash && baseline.inputHash === candidate.inputHash && baseline.rubricHash === candidate.rubricHash, 'Cannot compare reports from different evaluation sets or rubrics');
  const baselineIds = baseline.cases.map(item => item.id), candidateIds = candidate.cases.map(item => item.id);
  requireThat(new Set(baselineIds).size === baselineIds.length && new Set(candidateIds).size === candidateIds.length && sameStrings(baselineIds, candidateIds), 'Comparison case IDs differ or contain duplicates');
  return {
    schemaVersion: 1, reportType: 'offline-predictions-comparison', evalSetHash: baseline.evalSetHash,
    baseline: { run: baseline.run, coverage: baseline.coverage, automaticChecks: baseline.automaticChecks },
    candidate: { run: candidate.run, coverage: candidate.coverage, automaticChecks: candidate.automaticChecks },
    caseComparisons: baseline.cases.map(first => {
      const second = candidate.cases.find(item => item.id === first.id);
      return { id: first.id, site: first.site, baselineStatus: first.status, candidateStatus: second.status,
        baselineChecks: first.automaticChecks, candidateChecks: second.automaticChecks, manualAssessment: 'not_assessed' };
    }),
    manualAssessment: 'not_assessed', qualityVerdict: 'not_established', winner: null,
    note: 'Both reports were replayed against the same canonical inputs and rubric. Automatic differences are not a verdict on model quality. Blind human review has not been performed.',
  };
}

async function writeReport(filename, report) {
  await mkdir(path.dirname(path.resolve(filename)), { recursive: true });
  await writeFile(filename, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
}
async function cli(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i];
    requireThat(['--predictions', '--label', '--model', '--kind', '--output', '--evaluation', '--baseline-report', '--candidate-report'].includes(name), `Unknown argument ${name}`);
    requireThat(args[i + 1] && !args[i + 1].startsWith('--'), `Missing value for ${name}`);
    requireThat(!Object.hasOwn(options, name), `Duplicate argument ${name}`);
    options[name] = args[i + 1];
  }
  string(options['--output'], '--output');
  let report;
  if (options['--baseline-report'] || options['--candidate-report']) {
    requireThat(options['--baseline-report'] && options['--candidate-report'], 'Both comparison reports are required');
    requireThat(!['--predictions', '--label', '--model', '--kind'].some(name => options[name]), 'Comparison and prediction options cannot be mixed');
    const evaluation = await loadEvaluation(options['--evaluation']);
    report = compareReports(JSON.parse(await readFile(options['--baseline-report'], 'utf8')), JSON.parse(await readFile(options['--candidate-report'], 'utf8')), evaluation);
  } else {
    requireThat(!(options['--label'] && options['--model']), 'Use --label or --model, not both');
    string(options['--predictions'], '--predictions');
    const evaluation = await loadEvaluation(options['--evaluation']);
    report = evaluatePredictions(evaluation, await readJsonl(options['--predictions']), { label: options['--label'] || options['--model'], kind: options['--kind'] });
  }
  await writeReport(options['--output'], report);
  process.stdout.write(JSON.stringify({ evalSetHash: report.evalSetHash, qualityVerdict: report.qualityVerdict, output: options['--output'] }) + '\n');
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  cli(process.argv.slice(2)).catch(error => { process.stderr.write(`${error.name}: ${error.message}\n`); process.exitCode = 1; });
}
