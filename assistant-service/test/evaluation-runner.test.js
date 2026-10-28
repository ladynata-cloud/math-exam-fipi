import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { preparePilot, readMaterials, digest, approvalTemplate, validateApproval, liveConfig, CampaignLedger,
  runPilot, simulatedFetch, reviewTemplate, scoreReview, reviewMarkdown, privateDirectory, writePrivate,
  readPrivateJson, safeError, LIVE_LEDGER_PATH } from '../evaluation/pilot.js';
import { main } from '../evaluation/cli.js';
import { NOW } from './helpers.js';

function bundle() { return preparePilot({ ...readMaterials(), now: NOW }); }
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-pilot-test-'));
  const ledger = new CampaignLedger(path.join(directory, 'pilot.sqlite'));
  t.after(() => { ledger.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return { directory, ledger, filename: path.join(directory, 'pilot.sqlite') };
}
function approval(plan) {
  return { ...approvalTemplate(plan), status: 'approved', ownerDecisionReference: 'SYNTHETIC UNIT FIXTURE ONLY',
    approvedAt: new Date(NOW - 1000).toISOString(), expiresAt: new Date(NOW + 3600000).toISOString(),
    providerDataTermsReviewed: true, providerSpendingControlsReviewed: true };
}
const fakeEnv = { ASSISTANT_EVAL_ALLOW_PAID: '1', ASSISTANT_EXTERNAL_ENABLED: '1',
  ASSISTANT_PROVIDER_DATA_REVIEWED: '1', ASSISTANT_API_KEY: 'unit-fixture-key-never-a-real-provider-key' };
function allGoodReview(report) {
  const value = reviewTemplate(report); value.reviewerRole = 'math-reviewer'; value.reviewedAt = new Date(NOW).toISOString();
  for (const row of value.caseReviews) {
    const result = report.results.find(item => item.caseId === row.caseId);
    row.scores = { math: 2, nextStep: result.input.mode === 'hint' ? 2 : null, clarity: 2,
      feedback: result.pairId && result.input.simpler ? 2 : null, honesty: 2 };
    row.requiredPointsMet = true; row.criticalError = false; row.notes = 'UNIT FIXTURE; no model quality measured.';
  }
  return value;
}
async function mockedLive(t, overrides = {}) {
  const b = bundle(), a = approval(b.plan), config = liveConfig(b.plan, a, fakeEnv, NOW), f = fixture(t);
  const report = await runPilot({ bundle: b, approval: a, config, ledger: f.ledger, mode: 'live',
    fetchImpl: simulatedFetch(), clock: () => NOW, ...overrides });
  return { b, a, config, report, ...f };
}

test('pilot preparation binds exact source/corpus/payloads, passes 8 local checks and computes bounded cost without a key', () => {
  const b = bundle();
  assert.equal(b.requests.length, 32); assert.equal(b.plan.preflight.length, 8);
  assert(b.plan.preflight.every(row => row.passed)); assert.equal(b.plan.liveRequests, 0);
  assert.equal(b.plan.modelQuality, 'NOT_MEASURED'); assert.equal(b.config.apiKey, '');
  assert.equal(b.plan.planDigest, digest(b.plan.manifest));
  assert(b.plan.totalReservedMicros > 0 && b.plan.totalReservedMicros <= 172800);
  assert(b.plan.totalReservedMicros <= b.plan.proposedBudgetMicros);
  assert(b.plan.inputBounds.every(row => row.tokens <= 16000));
  assert.equal(b.plan.manifest.specification.totalBudgetMicros, 200000);
  for (const row of b.requests) {
    const sent = JSON.parse(row.prepared.body.messages[1].content);
    assert.deepEqual(Object.keys(sent).sort(), ['attempt', 'hintLevel', 'knowledge', 'mode', 'question', 'simpler', 'topic']);
    assert(!Object.hasOwn(sent, 'expectation')); assert(!Object.hasOwn(sent, 'answer'));
    assert.equal(row.prepared.body.max_tokens, 500); assert.equal(row.prepared.body.thinking.type, 'disabled');
  }
});
test('corpus or budget changes and an unexpectedly accepted preflight block planning', () => {
  const materials = readMaterials(); materials.specification.totalBudgetMicros = 1000000;
  assert.throws(() => preparePilot({ ...materials, now: NOW }), /EVAL_LIMIT_INVALID/);
  const bad = readMaterials(); bad.corpus.cases.find(row => row.phase === 'preflight').input.question = '3x + 5 = 20';
  assert.throws(() => preparePilot({ ...bad, now: NOW }), /EVAL_PREFLIGHT_FAILED/);
});
test('pending, changed, stale or expanded live approvals never pass configuration', () => {
  const b = bundle();
  assert.throws(() => liveConfig(b.plan, approvalTemplate(b.plan), fakeEnv, NOW), /EVAL_APPROVAL_MISMATCH/);
  for (const changes of [{ planDigest: 'a'.repeat(64) }, { totalBudgetMicros: 300000 }, { maxRequests: 33 },
    { providerDataTermsReviewed: false }, { providerSpendingControlsReviewed: false },
    { expiresAt: new Date(NOW - 1).toISOString() }, { expiresAt: new Date(NOW + 2 * 86400000).toISOString() }])
    assert.throws(() => validateApproval({ ...approval(b.plan), ...changes }, b.plan, NOW));
  assert.throws(() => liveConfig(b.plan, approval(b.plan), { ASSISTANT_API_KEY: fakeEnv.ASSISTANT_API_KEY }, NOW), /EVAL_PAID_NOT_ENABLED/);
  assert.throws(() => liveConfig(b.plan, approval(b.plan), { ...fakeEnv, ASSISTANT_API_KEY: '' }, NOW), /CONFIG_API_KEY_REQUIRED/);
});
test('default CLI and dry run ignore inherited enable flags and real-looking keys; zero network and no live ledger', async () => {
  const before = fs.existsSync(LIVE_LEDGER_PATH), original = globalThis.fetch; let network = 0;
  globalThis.fetch = async () => { network++; throw new Error('Network is forbidden during preparation.'); };
  try {
    const plan = await main([], fakeEnv); const simulation = await main(['dry-run'], fakeEnv);
    assert.equal(plan.liveRequests, 0); assert.equal(simulation.counts.liveRequests, 0);
    assert.equal(simulation.counts.simulatedRequests, 32); assert.equal(simulation.campaignStatus, 'completed');
    assert.equal(simulation.modelQuality, 'NOT_MEASURED'); assert.equal(simulation.reservedMicros, 0);
    assert.equal(network, 0); assert.equal(fs.existsSync(LIVE_LEDGER_PATH), before);
    await assert.rejects(main(['dry-run', '--reset', 'true'], fakeEnv), /EVAL_ARGUMENT_INVALID/);
  } finally { globalThis.fetch = original; }
});
test('transport simulation cannot become human-reviewed model evidence', async t => {
  const b = bundle(), { ledger } = fixture(t);
  const report = await runPilot({ bundle: b, config: b.config, ledger, mode: 'dry-run', fetchImpl: simulatedFetch(), clock: () => NOW });
  assert.equal(report.campaign.status, 'completed'); assert.equal(report.counts.simulatedRequests, 32);
  assert.equal(report.modelQuality, 'NOT_MEASURED'); assert.equal(report.latency, null);
  assert.equal(report.reportedUsageCostMicros, null); assert.equal(report.reservedMicros, 0);
  assert.throws(() => scoreReview(report, allGoodReview(report)), /EVAL_NOT_REVIEWABLE/);
});
test('live-bound injected transport requires human review; returned model and peak usage estimate are separate from reserve', async t => {
  const { report } = await mockedLive(t);
  assert.equal(report.campaign.status, 'completed'); assert.equal(report.counts.accepted, 32);
  assert.equal(report.modelQuality, 'PENDING_HUMAN_REVIEW'); assert.equal(report.latency.sampleSize, 32);
  assert(report.results.every(row => row.reportedModel === 'fixture-not-a-model' && row.humanReview === 'PENDING'));
  assert(report.reservedMicros > report.reportedUsageCostMicros); assert.equal(report.knowledgeChanges, 0);
  assert(!JSON.stringify(report).includes(fakeEnv.ASSISTANT_API_KEY));
});
test('changed source manifest, configuration, payload or reservation cannot reach fetch', async t => {
  for (const kind of ['manifest', 'config', 'payload', 'reservation']) {
    const b = bundle(), { ledger } = fixture(t); let network = 0; let config = b.config;
    if (kind === 'manifest') b.plan.manifest.corpusDigest = '0'.repeat(64);
    if (kind === 'config') config = { ...b.config, maxOutputTokens: 800 };
    if (kind === 'payload') b.requests[0].prepared.body.messages[1].content = '{}';
    if (kind === 'reservation') b.requests[0].prepared.reservedMicros = 1;
    try {
      const report = await runPilot({ bundle: b, config, ledger, mode: 'dry-run',
        fetchImpl: async () => { network++; return simulatedFetch()(); }, clock: () => NOW });
      assert.equal(report.campaign.status, 'failed'); assert.equal(report.counts.attempted, 0);
    } catch (error) { assert.match(safeError(error), /EVAL_(?:PLAN|CONFIG)_CHANGED/); }
    assert.equal(network, 0);
  }
});
test('first provider failure stops after one retained reservation, never retries and restart does not renew allowance', async t => {
  const b = bundle(), a = approval(b.plan), config = liveConfig(b.plan, a, fakeEnv, NOW), f = fixture(t); let calls = 0;
  const report = await runPilot({ bundle: b, approval: a, config, ledger: f.ledger, mode: 'live', clock: () => NOW,
    fetchImpl: async () => { calls++; return new Response('DO NOT RECORD UPSTREAM PRIVATE BODY', { status: 503 }); } });
  assert.equal(calls, 1); assert.equal(report.campaign.status, 'failed'); assert.equal(report.counts.notAttempted, 31);
  assert.equal(report.counts.errored, 1); assert(report.reservedMicros > 0);
  assert(!JSON.stringify(report).includes('UPSTREAM PRIVATE'));
  f.ledger.close(); const reopened = new CampaignLedger(f.filename); t.after(() => reopened.close());
  await assert.rejects(runPilot({ bundle: b, approval: a, config, ledger: reopened, mode: 'live', clock: () => NOW,
    fetchImpl: async () => { calls++; return simulatedFetch()(); } }), /EVALUATION_CAMPAIGN_ALREADY_USED/);
  assert.equal(calls, 1);
});
test('initial report-write failure closes campaign before fetch', async t => {
  const b = bundle(), { ledger } = fixture(t); let calls = 0;
  const report = await runPilot({ bundle: b, config: b.config, ledger, mode: 'dry-run', clock: () => NOW,
    fetchImpl: async () => { calls++; return simulatedFetch()(); }, saveReport: () => { throw new Error('secret filesystem detail'); } });
  assert.equal(calls, 0); assert.equal(report.campaign.status, 'failed'); assert.equal(report.counts.attempted, 0);
  assert.equal(report.campaign.errorCode, 'EVAL_INTERNAL_ERROR'); assert(!JSON.stringify(report).includes('secret filesystem'));
});
test('report-write failure after a charged response retains that result and stops before the next call', async t => {
  let saves = 0, calls = 0;
  const { report } = await mockedLive(t, { fetchImpl: async () => { calls++; return simulatedFetch()(); },
    saveReport: () => { if (++saves > 1) throw new Error('PRIVATE OUTPUT ERROR'); } });
  assert.equal(calls, 1); assert.equal(report.campaign.status, 'failed'); assert.equal(report.counts.accepted, 1);
  assert.equal(report.counts.notAttempted, 31); assert(report.reservedMicros > 0);
  assert(!JSON.stringify(report).includes('PRIVATE OUTPUT'));
});
test('expiry while running stops before the second call without granting a fresh campaign', async t => {
  const b = bundle(), a = { ...approval(b.plan), expiresAt: new Date(NOW + 60000).toISOString() };
  const config = liveConfig(b.plan, a, fakeEnv, NOW), { ledger } = fixture(t); let now = NOW, calls = 0;
  const report = await runPilot({ bundle: b, approval: a, config, ledger, mode: 'live', clock: () => now,
    fetchImpl: async () => { calls++; const response = await simulatedFetch()(); now += 61000; return response; } });
  assert.equal(calls, 1); assert.equal(report.campaign.status, 'failed'); assert.equal(report.counts.notAttempted, 31);
  assert.equal(report.campaign.errorCode, 'CAMPAIGN_DEADLINE');
});
test('human rubric stays incomplete until all cases are reviewed; optional scores cannot inflate pass and zero feedback fails', async t => {
  const { report } = await mockedLive(t);
  assert.throws(() => scoreReview(report, reviewTemplate(report)), /EVAL_REVIEW_INCOMPLETE/);
  const good = allGoodReview(report); const approved = scoreReview(report, good);
  assert.equal(approved.verdict, 'SMALL_SYNTHETIC_SET_PASSED'); assert.equal(approved.deploymentAuthorized, false);
  const inflated = structuredClone(good); inflated.caseReviews.find(row => row.scores.nextStep === null).scores.nextStep = 2;
  assert.throws(() => scoreReview(report, inflated), /EVAL_REVIEW_INCOMPLETE/);
  const feedback = structuredClone(good); const paired = feedback.caseReviews.find(row => row.scores.feedback !== null);
  paired.scores.feedback = 0; assert.equal(scoreReview(report, feedback).cases.find(row => row.caseId === paired.caseId).passed, false);
  const critical = structuredClone(good); critical.caseReviews[0].criticalError = true;
  assert.equal(scoreReview(report, critical).verdict, 'REVISE_BEFORE_FURTHER_PILOT');
  for (const dimension of ['math', 'honesty']) {
    const incorrect = structuredClone(good); incorrect.caseReviews[0].scores[dimension] = 0;
    const result = scoreReview(report, incorrect);
    assert.equal(result.criticalErrors, 1);
    assert.equal(result.verdict, 'REVISE_BEFORE_FURTHER_PILOT');
  }
  const missing = structuredClone(good); missing.caseReviews.pop(); assert.throws(() => scoreReview(report, missing));
  const changed = structuredClone(report); changed.results[0].answer.title = 'Altered'; assert.throws(() => scoreReview(changed, good), /EVAL_REPORT_CHANGED/);
});
test('review displays synthetic control markers visibly and model Markdown as inert code', async t => {
  const { b, report } = await mockedLive(t);
  report.results[0].answer.text = '![Схема](//example.invalid/probe)';
  const markdown = reviewMarkdown(b, report);
  assert(!markdown.includes('\u0000')); assert(!markdown.includes('\u202e'));
  assert(markdown.includes('\\u0000') && markdown.includes('\\u202e'));
  const imageLine = markdown.split('\n').find(line => line.includes('![Схема]'));
  assert(imageLine.startsWith('    '));
});
test('evaluation files are private and symlink ancestors cannot redirect artifacts', t => {
  const { directory } = fixture(t), file = path.join(directory, 'report.json');
  writePrivate(file, { safe: true }); assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  assert.deepEqual(readPrivateJson(file), { safe: true });
  fs.chmodSync(file, 0o644); assert.throws(() => readPrivateJson(file), /EVAL_APPROVAL_FILE_INVALID/);
  const actual = path.join(directory, 'actual'), link = path.join(directory, 'link'); fs.mkdirSync(actual); fs.symlinkSync(actual, link);
  assert.throws(() => privateDirectory(path.join(link, 'nested')), /EVAL_STORAGE_INVALID/);
  assert.throws(() => writePrivate(path.join(link, 'redirected.json'), {}), /EVAL_STORAGE_INVALID/);
});
