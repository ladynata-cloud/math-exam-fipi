import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { loadConfig, PROVIDERS, pricesFresh } from '../src/config.js';
import { requireValue, AssistantError } from '../src/errors.js';
import { parseQuestion, containsSensitiveText } from '../src/privacy.js';
import { listTopics, getBuiltinKnowledge } from '../src/tutor.js';
import { prepareRequest, callProvider } from '../src/provider.js';
import { CampaignLedger } from './ledger.js';

export const SERVICE_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const LIVE_LEDGER_PATH = path.join(SERVICE_ROOT, 'data', 'evaluation', 'pilot.sqlite');
export const ARTIFACT_PATH = path.join(SERVICE_ROOT, 'artifacts', 'evaluation');
const FIXED_REQUEST_ID = '00000000-0000-4000-8000-000000000001';
const SAFE_CODE = /^(?:CONFIG_|PROVIDER_|EVAL_|EVALUATION_|CAMPAIGN_|LEDGER_|TASK_|TOPIC_|PERSONAL_|REQUEST_)[A-Z0-9_]{1,100}$/;
const PHASES = ['model', 'preflight'];
export const DIMENSIONS = ['math', 'nextStep', 'clarity', 'feedback', 'honesty'];

export function digest(value) { return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex'); }
export function safeError(error) { return error instanceof AssistantError && SAFE_CODE.test(error.code) ? error.code : 'EVAL_INTERNAL_ERROR'; }
function check(value, code = 'EVAL_INVALID') { requireValue(value, code); }
function keys(value, required, optional = []) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => [...required, ...optional].includes(key));
}
function text(value, max = 1800) { return typeof value === 'string' && value.length > 0 && value.length <= max; }
function readJson(filename) {
  try { return JSON.parse(fs.readFileSync(filename, 'utf8')); }
  catch { throw new AssistantError('EVAL_FILE_INVALID'); }
}

export function readMaterials() {
  return { specification: readJson(path.join(SERVICE_ROOT, 'evaluation', 'pilot-plan.json')),
    corpus: readJson(path.join(SERVICE_ROOT, 'evaluation', 'pilot-cases.json')) };
}
export function validateSpecification(spec) {
  check(keys(spec, ['schemaVersion', 'id', 'provider', 'model', 'currency', 'inputPriceMicros', 'outputPriceMicros',
    'priceReviewedOn', 'priceSource', 'maxRequests', 'preflightCount', 'totalBudgetMicros', 'maxInputTokens',
    'maxOutputTokens', 'timeoutMs', 'maxDurationMs', 'concurrency', 'retries']), 'EVAL_PLAN_INVALID');
  check(spec.schemaVersion === 1 && spec.id === 'mathexam-synthetic-pilot-v1'
    && spec.provider === 'deepseek' && spec.model === 'deepseek-flash' && spec.currency === 'USD', 'EVAL_PLAN_INVALID');
  check(spec.maxRequests === 32 && spec.preflightCount === 8 && spec.concurrency === 1 && spec.retries === 0
    && spec.totalBudgetMicros === 200000 && spec.maxInputTokens === 16000 && spec.maxOutputTokens === 500
    && spec.timeoutMs === 15000 && spec.maxDurationMs === 600000, 'EVAL_LIMIT_INVALID');
  check(Number.isSafeInteger(spec.inputPriceMicros) && spec.inputPriceMicros >= 300000 && spec.inputPriceMicros <= 10000000
    && Number.isSafeInteger(spec.outputPriceMicros) && spec.outputPriceMicros >= 1200000 && spec.outputPriceMicros <= 10000000,
  'EVAL_PRICE_INVALID');
  const date = Date.parse(`${spec.priceReviewedOn}T00:00:00Z`);
  check(/^\d{4}-\d{2}-\d{2}$/.test(spec.priceReviewedOn) && Number.isFinite(date)
    && new Date(date).toISOString().slice(0, 10) === spec.priceReviewedOn
    && spec.priceSource === 'https://api-docs.deepseek.com/quick_start/pricing/', 'EVAL_PRICE_INVALID');
  return spec;
}
export function validateCorpus(corpus, spec) {
  check(keys(corpus, ['schemaVersion', 'id', 'cases']) && corpus.schemaVersion === 1 && corpus.id === spec.id
    && Array.isArray(corpus.cases) && corpus.cases.length === spec.maxRequests + spec.preflightCount, 'EVAL_CORPUS_INVALID');
  const ids = new Set(), topics = new Set(listTopics().map(topic => topic.id));
  for (const row of corpus.cases) {
    check(keys(row, ['id', 'phase', 'category', 'grade', 'input', 'expectation'], ['pairId', 'expectedError'])
      && /^[a-z0-9][a-z0-9-]{2,79}$/.test(row.id) && !ids.has(row.id) && PHASES.includes(row.phase)
      && text(row.category, 80) && text(row.grade, 40), 'EVAL_CORPUS_INVALID');
    ids.add(row.id);
    check(keys(row.input, ['topic', 'question', 'attempt', 'mode', 'hintLevel', 'simpler']) && topics.has(row.input.topic)
      && typeof row.input.question === 'string' && row.input.question.length <= 2000
      && typeof row.input.attempt === 'string' && row.input.attempt.length <= 800
      && ['hint', 'explain'].includes(row.input.mode) && Number.isInteger(row.input.hintLevel)
      && row.input.hintLevel >= 1 && row.input.hintLevel <= 5 && typeof row.input.simpler === 'boolean', 'EVAL_CORPUS_INVALID');
    const e = row.expectation;
    check(keys(e, ['kind', 'answer', 'requiredPoints', 'forbiddenPoints', 'critical'])
      && ['numeric', 'conceptual', 'clarify', 'refuse', 'input-rejected'].includes(e.kind)
      && text(e.answer, 2400) && typeof e.critical === 'boolean'
      && [e.requiredPoints, e.forbiddenPoints].every(list => Array.isArray(list) && list.length <= 12
        && list.every(item => text(item, 1000))), 'EVAL_CORPUS_INVALID');
    if (row.pairId !== undefined) check(/^[a-z0-9-]{3,80}$/.test(row.pairId), 'EVAL_CORPUS_INVALID');
    if (row.phase === 'preflight') check(e.kind === 'input-rejected'
      && ['PERSONAL_DATA_REJECTED', 'TASK_INVALID', 'TOPIC_INVALID'].includes(row.expectedError), 'EVAL_CORPUS_INVALID');
    else check(row.expectedError === undefined && e.kind !== 'input-rejected', 'EVAL_CORPUS_INVALID');
  }
  check(corpus.cases.filter(row => row.phase === 'model').length === spec.maxRequests
    && corpus.cases.filter(row => row.phase === 'preflight').length === spec.preflightCount, 'EVAL_CORPUS_INVALID');
  check(new Set(corpus.cases.filter(row => row.phase === 'model').map(row => row.input.topic)).size === topics.size,
    'EVAL_TOPIC_COVERAGE');
  return corpus;
}
export function parseCase(row, requestId = FIXED_REQUEST_ID) {
  const { simpler, ...body } = row.input;
  return { ...parseQuestion({ ...body, requestId, externalConsent: true }, listTopics().map(topic => topic.id)), simpler };
}
export function planningConfig(spec) {
  validateSpecification(spec);
  const priceReviewedAt = Date.parse(`${spec.priceReviewedOn}T00:00:00Z`);
  // This configuration can only prepare a payload. It contains no key and does
  // not record that provider terms were accepted. Live configuration is separate.
  return Object.freeze({ mode: 'api', provider: spec.provider, providerUrl: PROVIDERS[spec.provider].url,
    model: spec.model, currency: spec.currency, apiKey: '', maxInputTokens: spec.maxInputTokens,
    maxOutputTokens: spec.maxOutputTokens, inputPriceMicros: spec.inputPriceMicros,
    outputPriceMicros: spec.outputPriceMicros, timeoutMs: spec.timeoutMs, maxResponseBytes: 65536,
    priceReviewedAt, priceValidUntil: priceReviewedAt + 7 * 86400000 });
}
function sourceManifest() {
  const paths = ['src/config.js', 'src/errors.js', 'src/privacy.js', 'src/provider.js', 'src/tutor.js',
    'knowledge/core.json', 'evaluation/pilot-plan.json', 'evaluation/pilot-cases.json',
    'evaluation/pilot.js', 'evaluation/ledger.js', 'evaluation/cli.js'];
  return Object.fromEntries(paths.map(name => [name, digest(fs.readFileSync(path.join(SERVICE_ROOT, name), 'utf8'))]));
}
function sourceRevision() {
  try {
    const head = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: SERVICE_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    const dirty = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'],
      { cwd: SERVICE_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim().length > 0;
    return { head: /^[a-f0-9]{40}$/.test(head) ? head : null, clean: !dirty };
  } catch { return { head: null, clean: false }; }
}
export function preparePilot({ specification, corpus, now = Date.now() } = { ...readMaterials() }) {
  const spec = validateSpecification(specification); validateCorpus(corpus, spec);
  const config = planningConfig(spec), cards = getBuiltinKnowledge(), requests = [], preflight = [];
  // Planning remains possible after price expiry, but the artifact states that
  // renewal is required and live execution rejects it. No network is used here.
  for (const row of corpus.cases) {
    if (row.phase === 'preflight') {
      let code = null;
      try { parseCase(row); } catch (error) { code = safeError(error); }
      preflight.push({ caseId: row.id, expectedError: row.expectedError, actualError: code, passed: code === row.expectedError });
    } else {
      const input = parseCase(row), selected = cards.filter(card => card.topic === input.topic).slice(0, 3);
      const prepared = prepareRequest(config, input, selected, config.priceReviewedAt);
      requests.push({ caseId: row.id, input, cards: selected, prepared, requestDigest: digest(prepared.body) });
    }
  }
  check(preflight.every(row => row.passed), 'EVAL_PREFLIGHT_FAILED');
  check(new Set(requests.map(row => row.requestDigest)).size === requests.length, 'EVAL_DUPLICATE_PAYLOAD');
  const totalReservedMicros = requests.reduce((sum, row) => sum + row.prepared.reservedMicros, 0);
  check(totalReservedMicros <= spec.totalBudgetMicros, 'EVAL_CORPUS_OVER_BUDGET');
  const manifest = { specification: spec, corpusDigest: digest(corpus), sources: sourceManifest(), revision: sourceRevision(),
    requestDigests: requests.map(row => ({ caseId: row.caseId, digest: row.requestDigest })) };
  const plan = { schemaVersion: 1, kind: 'preparation-only', id: spec.id, planDigest: digest(manifest), manifest,
    provider: spec.provider, model: spec.model, currency: spec.currency, modelCases: requests.length,
    preflight, proposedBudgetMicros: spec.totalBudgetMicros, totalReservedMicros,
    maxSingleReservationMicros: Math.max(...requests.map(row => row.prepared.reservedMicros)),
    inputBounds: requests.map(row => ({ caseId: row.caseId, tokens: row.prepared.inputBound })),
    pricesFresh: pricesFresh(config, now), priceValidUntil: new Date(config.priceValidUntil).toISOString(),
    approvalStatus: 'PENDING_OWNER_BUDGET_AND_PROVIDER_REVIEW', liveRequests: 0, modelQuality: 'NOT_MEASURED' };
  return { plan, requests, corpus, config };
}
export function approvalTemplate(plan) {
  return { schemaVersion: 1, status: 'pending', campaignId: plan.id, planDigest: plan.planDigest,
    provider: plan.provider, model: plan.model, currency: plan.currency,
    totalBudgetMicros: plan.proposedBudgetMicros, maxRequests: plan.modelCases,
    ownerDecisionReference: null, approvedAt: null, expiresAt: null,
    providerDataTermsReviewed: false, providerSpendingControlsReviewed: false };
}
export function validateApproval(approval, plan, now = Date.now()) {
  check(keys(approval, ['schemaVersion', 'status', 'campaignId', 'planDigest', 'provider', 'model', 'currency',
    'totalBudgetMicros', 'maxRequests', 'ownerDecisionReference', 'approvedAt', 'expiresAt',
    'providerDataTermsReviewed', 'providerSpendingControlsReviewed']), 'EVAL_APPROVAL_INVALID');
  check(approval.schemaVersion === 1 && approval.status === 'approved' && approval.campaignId === plan.id
    && approval.planDigest === plan.planDigest && approval.provider === plan.provider && approval.model === plan.model
    && approval.currency === 'USD' && approval.totalBudgetMicros === plan.proposedBudgetMicros
    && approval.maxRequests === plan.modelCases, 'EVAL_APPROVAL_MISMATCH');
  check(text(approval.ownerDecisionReference, 200) && !containsSensitiveText(approval.ownerDecisionReference)
    && approval.providerDataTermsReviewed === true && approval.providerSpendingControlsReviewed === true, 'EVAL_APPROVAL_REQUIRED');
  const approvedAt = Date.parse(approval.approvedAt), expiresAt = Date.parse(approval.expiresAt);
  check(Number.isFinite(approvedAt) && Number.isFinite(expiresAt) && approvedAt <= now && now < expiresAt
    && expiresAt <= approvedAt + 86400000 && expiresAt <= Date.parse(plan.priceValidUntil), 'EVAL_APPROVAL_EXPIRED');
  return approval;
}
export function liveConfig(plan, approval, env = process.env, now = Date.now()) {
  validateApproval(approval, plan, now);
  check(env.ASSISTANT_EVAL_ALLOW_PAID === '1' && env.ASSISTANT_EXTERNAL_ENABLED === '1'
    && env.ASSISTANT_PROVIDER_DATA_REVIEWED === '1', 'EVAL_PAID_NOT_ENABLED');
  const spec = plan.manifest.specification;
  return loadConfig({ ASSISTANT_MODE: 'api', ASSISTANT_EXTERNAL_ENABLED: env.ASSISTANT_EXTERNAL_ENABLED,
    ASSISTANT_PROVIDER_DATA_REVIEWED: env.ASSISTANT_PROVIDER_DATA_REVIEWED,
    ASSISTANT_PILOT_KEY: randomBytes(32).toString('base64url'), ASSISTANT_PROVIDER: spec.provider,
    ASSISTANT_MODEL: spec.model, ASSISTANT_API_KEY: env.ASSISTANT_API_KEY, ASSISTANT_CURRENCY: spec.currency,
    ASSISTANT_INPUT_PER_MILLION: String(spec.inputPriceMicros / 1000000),
    ASSISTANT_OUTPUT_PER_MILLION: String(spec.outputPriceMicros / 1000000),
    ASSISTANT_DAILY_BUDGET: '0.20', ASSISTANT_MONTHLY_BUDGET: '0.20',
    ASSISTANT_PRICE_REVIEWED_ON: spec.priceReviewedOn, ASSISTANT_CONCURRENCY: '1',
    ASSISTANT_MAX_OUTPUT_TOKENS: String(spec.maxOutputTokens), ASSISTANT_TIMEOUT_MS: String(spec.timeoutMs),
    ASSISTANT_DB_PATH: LIVE_LEDGER_PATH }, now);
}

export function privateDirectory(directory) {
  check(path.isAbsolute(directory) && path.normalize(directory) === directory, 'EVAL_STORAGE_INVALID');
  const root = path.parse(directory).root;
  let current = root;
  for (const part of directory.slice(root.length).split(path.sep)) {
    current = path.join(current, part);
    try { check(fs.lstatSync(current).isDirectory() && !fs.lstatSync(current).isSymbolicLink(), 'EVAL_STORAGE_INVALID'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  check(fs.realpathSync(directory) === directory, 'EVAL_STORAGE_INVALID');
  fs.chmodSync(directory, 0o700);
}
export function writePrivate(filename, value) {
  privateDirectory(path.dirname(filename));
  if (fs.existsSync(filename)) check(fs.lstatSync(filename).isFile() && !fs.lstatSync(filename).isSymbolicLink(), 'EVAL_STORAGE_INVALID');
  const temporary = `${filename}.${randomUUID()}.tmp`;
  let fd;
  try {
    fd = fs.openSync(temporary, 'wx', 0o600);
    fs.writeFileSync(fd, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
    fs.fsyncSync(fd); fs.closeSync(fd); fd = undefined; fs.renameSync(temporary, filename);
  } finally { if (fd !== undefined) fs.closeSync(fd); if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
export function readPrivateJson(filename) {
  check(path.isAbsolute(filename) && path.normalize(filename) === filename
    && fs.realpathSync(path.dirname(filename)) === path.dirname(filename), 'EVAL_APPROVAL_FILE_INVALID');
  const stat = fs.lstatSync(filename);
  check(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 && (stat.mode & 0o077) === 0 && stat.size <= 1000000,
    'EVAL_APPROVAL_FILE_INVALID');
  return readJson(filename);
}
function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b); return sorted[Math.ceil(sorted.length * fraction) - 1];
}
export function makeReport(bundle, snapshot, mode) {
  const rows = snapshot.rows || [], spec = bundle.plan.manifest.specification;
  const accepted = rows.filter(row => row.status === 'completed');
  const results = bundle.corpus.cases.filter(row => row.phase === 'model').map(row => {
    const actual = rows.find(item => item.caseId === row.id);
    return { caseId: row.id, category: row.category, grade: row.grade, pairId: row.pairId || null,
      input: row.input, expectation: row.expectation, status: actual?.status || 'not-attempted',
      answer: actual?.answer || null, usage: actual?.usage || null, reportedModel: actual?.reportedModel || null,
      latencyMs: actual?.latencyMs ?? null, reservedMicros: actual?.reservedMicros || 0,
      errorCode: actual?.errorCode || null, humanReview: 'PENDING' };
  });
  const reservedMicros = rows.reduce((sum, row) => sum + row.reservedMicros, 0);
  const reportedUsageCostMicros = accepted.reduce((sum, row) => sum + Math.ceil(
    (row.usage.prompt_tokens * spec.inputPriceMicros + row.usage.completion_tokens * spec.outputPriceMicros) / 1000000), 0);
  const report = { schemaVersion: 1, kind: mode === 'live' ? 'live-synthetic-evaluation' : 'simulated-transport-only',
    campaignId: bundle.plan.id, planDigest: bundle.plan.planDigest, sourceRevision: bundle.plan.manifest.revision,
    provider: spec.provider, requestedModel: spec.model,
    currency: spec.currency, campaign: snapshot.campaign, preflight: bundle.plan.preflight,
    counts: { planned: spec.maxRequests, attempted: rows.length, accepted: accepted.length,
      failed: rows.filter(row => row.status === 'failed').length, pending: rows.filter(row => row.status === 'pending').length,
      rejected: rows.filter(row => row.status === 'failed' && /PROVIDER_(?:RESPONSE|HINT|USAGE)/.test(row.errorCode || '')).length,
      errored: rows.filter(row => row.status === 'failed' && !/PROVIDER_(?:RESPONSE|HINT|USAGE)/.test(row.errorCode || '')).length,
      notAttempted: spec.maxRequests - rows.length, liveRequests: mode === 'live' ? rows.length : 0,
      simulatedRequests: mode === 'dry-run' ? rows.length : 0 },
    attemptMeaning: 'Reserved attempts may have reached the provider; an uncertain outcome is never counted as free or retried.',
    reservedMicros: mode === 'live' ? reservedMicros : 0, simulatedReservedMicros: mode === 'dry-run' ? reservedMicros : 0,
    reportedUsageCostMicros: mode === 'live' ? reportedUsageCostMicros : null,
    costMeaning: 'Configured peak-rate estimate for accepted usage only, not an invoice. Failed and pending calls may be billed; their reserves remain held.',
    latency: mode === 'live' ? { p50Ms: percentile(accepted.map(row => row.latencyMs), 0.5),
      p95Ms: percentile(accepted.map(row => row.latencyMs), 0.95), sampleSize: accepted.length } : null,
    modelQuality: mode === 'live' ? 'PENDING_HUMAN_REVIEW' : 'NOT_MEASURED',
    knowledgeChanges: 0, weightTraining: false, results };
  return { ...report, reportDigest: digest(report) };
}
export function reviewTemplate(report) {
  return { schemaVersion: 1, reportDigest: report.reportDigest, reviewerRole: null, reviewedAt: null,
    caseReviews: report.results.map(row => ({ caseId: row.caseId, scores: Object.fromEntries(DIMENSIONS.map(key => [key, null])),
      requiredPointsMet: null, criticalError: null, notes: '' })) };
}
export function reviewMarkdown(bundle, report = null) {
  const lines = ['# MathExam: синтетическое испытание модели', '',
    report?.kind === 'live-synthetic-evaluation' ? '**Ответы модели требуют ручной проверки.**' : '**ПОДГОТОВКА: качество модели не измерено, платных запросов не было.**', '',
    `План: \`${bundle.plan.planDigest}\`. Максимум: 32 обращения, общий резерв $0.20.`, '',
    'Оценка 0–2: математика, следующая подсказка, ясность, реакция на обратную связь, честность при нехватке данных.',
    'Для неприменимого критерия используется null; математика, ясность и честность оцениваются всегда.',
    'Порог: все 32 ответа проверены; не менее 29 прошли; критических ошибок нет; локальные отказы 8/8.',
    'Успех этого малого набора не разрешает публикацию и не доказывает качество на всём школьном курсе.', ''];
  for (const row of bundle.corpus.cases) {
    const actual = report?.results.find(item => item.caseId === row.id);
    lines.push(`## ${row.id} · ${row.grade} · ${row.phase}`, '', `Тема: ${row.input.topic}. Режим: ${row.input.mode}, подсказка ${row.input.hintLevel}, проще: ${row.input.simpler}.`, '',
      '```text', displayControls(row.input.question), '```', '', `Попытка: ${displayControls(row.input.attempt) || 'не задана'}.`, '',
      `Эталон для проверяющего: ${row.expectation.answer}`, '', 'Нужно проверить:', ...row.expectation.requiredPoints.map(point => `- ${point}`), '',
      'Недопустимо:', ...row.expectation.forbiddenPoints.map(point => `- ${point}`), '',
      'Ответ модели:', '', ...(actual?.answer ? JSON.stringify(actual.answer, null, 2).split('\n').map(line => `    ${line}`) : ['НЕ ПОЛУЧЕН']), '',
      `Ручная оценка: ${row.phase === 'model' ? 'НЕ ЗАПОЛНЕНА' : `локальный отказ ${row.expectedError}`}.`, '');
  }
  return `${lines.join('\n')}\n`;
}
function displayControls(value) {
  return value.replace(/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,
    character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

export async function runPilot({ bundle, ledger, mode, approval, config, fetchImpl, clock = Date.now, saveReport = () => {} }) {
  check(['live', 'dry-run'].includes(mode), 'EVAL_MODE_INVALID');
  const spec = bundle.plan.manifest.specification;
  validateSpecification(spec);
  check(digest(bundle.plan.manifest) === bundle.plan.planDigest && digest(bundle.corpus) === bundle.plan.manifest.corpusDigest
    && bundle.requests.length === spec.maxRequests && digest(sourceManifest()) === digest(bundle.plan.manifest.sources), 'EVAL_PLAN_CHANGED');
  for (const key of ['mode', 'provider', 'providerUrl', 'model', 'currency', 'maxInputTokens', 'maxOutputTokens',
    'inputPriceMicros', 'outputPriceMicros', 'timeoutMs', 'maxResponseBytes', 'priceReviewedAt', 'priceValidUntil'])
    check(config[key] === bundle.config[key], 'EVAL_CONFIG_CHANGED');
  check(bundle.plan.preflight.length === 8 && bundle.plan.preflight.every(row => row.passed), 'EVAL_PREFLIGHT_FAILED');
  const startedAt = clock();
  if (mode === 'live') { validateApproval(approval, bundle.plan, startedAt); check(pricesFresh(config, startedAt), 'CONFIG_PRICES_EXPIRED'); }
  else check(typeof fetchImpl === 'function', 'EVAL_SIMULATION_TRANSPORT_REQUIRED');
  const deadlineAt = Math.min(startedAt + spec.maxDurationMs,
    mode === 'live' ? Date.parse(approval.expiresAt) : Infinity, mode === 'live' ? config.priceValidUntil : Infinity);
  ledger.start({ planDigest: bundle.plan.planDigest, approvalDigest: mode === 'live' ? digest(approval) : null,
    mode, maxRequests: spec.maxRequests, totalBudgetMicros: spec.totalBudgetMicros, startedAt, deadlineAt });
  let currentCase;
  try {
    saveReport(makeReport(bundle, ledger.snapshot(), mode));
    for (const [index, row] of bundle.requests.entries()) {
      currentCase = row.caseId;
      const now = clock();
      check(now + config.timeoutMs < deadlineAt, 'CAMPAIGN_DEADLINE');
      if (mode === 'live') { validateApproval(approval, bundle.plan, now); check(pricesFresh(config, now), 'CONFIG_PRICES_EXPIRED'); }
      const expected = bundle.plan.manifest.requestDigests[index];
      check(expected.caseId === row.caseId && expected.digest === row.requestDigest
        && digest(row.prepared.body) === row.requestDigest, 'EVAL_REQUEST_CHANGED');
      if (mode === 'live') check(digest(sourceManifest()) === digest(bundle.plan.manifest.sources), 'EVAL_PLAN_CHANGED');
      const prepared = prepareRequest(config, row.input, row.cards, mode === 'live' ? now : config.priceReviewedAt);
      check(digest(prepared.body) === expected.digest && prepared.inputBound === row.prepared.inputBound
        && prepared.reservedMicros === row.prepared.reservedMicros, 'EVAL_REQUEST_CHANGED');
      ledger.reserve({ caseId: row.caseId, requestDigest: row.requestDigest,
        reservedMicros: prepared.reservedMicros, now });
      const start = clock();
      const result = await callProvider({ config, prepared, input: row.input, cards: row.cards, fetchImpl });
      ledger.complete({ caseId: row.caseId, answer: result.answer, usage: result.usage,
        reportedModel: result.reportedModel, latencyMs: Math.max(0, clock() - start), now: clock() });
      saveReport(makeReport(bundle, ledger.snapshot(), mode));
    }
    ledger.finish(clock());
    const report = makeReport(bundle, ledger.snapshot(), mode); saveReport(report); return report;
  } catch (error) {
    const code = safeError(error);
    if (ledger.snapshot().campaign.status === 'completed') throw new AssistantError('EVAL_REPORT_WRITE_FAILED');
    ledger.fail({ caseId: currentCase, code, now: clock() });
    const report = makeReport(bundle, ledger.snapshot(), mode);
    try { saveReport(report); } catch { /* The SQLite ledger is authoritative; never retry a possibly billed call. */ }
    return report;
  }
}

export function simulatedFetch() {
  return async () => new Response(JSON.stringify({ model: 'fixture-not-a-model',
    choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ title: 'Проверка сценария',
      text: 'Это заранее подготовленная заглушка. Качество модели здесь не проверяется.',
      steps: ['Выбери одно следующее математическое действие.'], check: 'Объяснение нужно будет проверить отдельно.' }) } }],
    usage: { prompt_tokens: 200, completion_tokens: 80, total_tokens: 280 } }),
  { headers: { 'Content-Type': 'application/json' } });
}

export function scoreReview(report, review) {
  check(report.kind === 'live-synthetic-evaluation' && report.campaign?.status === 'completed'
    && report.counts.accepted === 32 && report.counts.failed === 0 && report.counts.pending === 0
    && report.preflight.length === 8 && report.preflight.every(row => row.passed), 'EVAL_NOT_REVIEWABLE');
  const { reportDigest, ...unsigned } = report;
  check(digest(unsigned) === reportDigest, 'EVAL_REPORT_CHANGED');
  check(keys(review, ['schemaVersion', 'reportDigest', 'reviewerRole', 'reviewedAt', 'caseReviews'])
    && review.schemaVersion === 1 && review.reportDigest === reportDigest
    && ['owner-teacher', 'math-reviewer'].includes(review.reviewerRole)
    && Number.isFinite(Date.parse(review.reviewedAt)) && Array.isArray(review.caseReviews)
    && review.caseReviews.length === 32, 'EVAL_REVIEW_INCOMPLETE');
  const ids = new Set(), cases = [];
  for (const assessment of review.caseReviews) {
    check(keys(assessment, ['caseId', 'scores', 'requiredPointsMet', 'criticalError', 'notes'])
      && !ids.has(assessment.caseId), 'EVAL_REVIEW_INVALID'); ids.add(assessment.caseId);
    const actual = report.results.find(row => row.caseId === assessment.caseId); check(actual, 'EVAL_REVIEW_INVALID');
    const scores = assessment.scores;
    check(keys(scores, DIMENSIONS) && typeof assessment.requiredPointsMet === 'boolean'
      && typeof assessment.criticalError === 'boolean' && typeof assessment.notes === 'string'
      && assessment.notes.length <= 1000 && !containsSensitiveText(assessment.notes), 'EVAL_REVIEW_INCOMPLETE');
    const required = ['math', 'clarity', 'honesty', ...(actual.input.mode === 'hint' ? ['nextStep'] : []),
      ...(actual.pairId && actual.input.simpler ? ['feedback'] : [])];
    for (const key of DIMENSIONS) check(required.includes(key)
      ? Number.isInteger(scores[key]) && scores[key] >= 0 && scores[key] <= 2 : scores[key] === null, 'EVAL_REVIEW_INCOMPLETE');
    const numbers = Object.values(scores).filter(value => value !== null);
    const fraction = numbers.reduce((sum, score) => sum + score, 0) / (numbers.length * 2);
    // A manual zero for false mathematics or fabricated conditions is already
    // a critical finding; forgetting a second checkbox cannot average it away.
    const criticalError = assessment.criticalError || scores.math === 0 || scores.honesty === 0;
    const passed = scores.math === 2 && numbers.every(score => score >= 1) && fraction >= 0.8
      && assessment.requiredPointsMet && !criticalError;
    cases.push({ caseId: actual.caseId, passed, fraction, criticalError });
  }
  const passed = cases.filter(row => row.passed).length, criticalErrors = cases.filter(row => row.criticalError).length;
  return { schemaVersion: 1, reportDigest, reviewerRole: review.reviewerRole, reviewedAt: review.reviewedAt,
    reviewed: cases.length, passed, criticalErrors, cases,
    verdict: passed >= 29 && criticalErrors === 0 ? 'SMALL_SYNTHETIC_SET_PASSED' : 'REVISE_BEFORE_FURTHER_PILOT',
    deploymentAuthorized: false, pupilPilotAuthorized: false };
}

export { CampaignLedger };
