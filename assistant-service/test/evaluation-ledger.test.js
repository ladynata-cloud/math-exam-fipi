import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { CampaignLedger } from '../evaluation/ledger.js';

const NOW = Date.parse('2026-10-27T12:00:00Z');
const H = n => n.toString(16).padStart(64, '0');
const start = extra => ({ planDigest: H(1), approvalDigest: H(2), mode: 'live', maxRequests: 2,
  totalBudgetMicros: 10000, startedAt: NOW, deadlineAt: NOW + 600000, ...extra });
const reservation = extra => ({ caseId: 'linear-first', requestDigest: H(3), reservedMicros: 5000, now: NOW + 1, ...extra });
const completion = extra => ({ caseId: 'linear-first', answer: { title: 'Первый шаг', text: 'Рассмотрим равенство.',
  steps: ['Вычти пять из обеих частей равенства.'], check: 'Какое равенство получится?' },
  usage: { prompt_tokens: 200, completion_tokens: 60 }, reportedModel: 'deepseek-flash', latencyMs: 20, now: NOW + 21, ...extra });
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-evaluation-ledger-'));
  const filename = path.join(directory, 'campaign', 'evaluation.sqlite');
  const ledgers = [];
  const open = () => { const ledger = new CampaignLedger(filename); ledgers.push(ledger); return ledger; };
  t.after(() => { for (const ledger of ledgers) ledger.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return { directory, filename, open };
}

test('evaluation ledger secures its file and directory before use and refuses links or a pupil DB', t => {
  const f = fixture(t), ledger = f.open();
  assert.equal(fs.statSync(f.filename).mode & 0o777, 0o600);
  assert.equal(fs.statSync(path.dirname(f.filename)).mode & 0o777, 0o700);
  assert.deepEqual(ledger.snapshot(), { campaign: null, rows: [] });
  const link = path.join(f.directory, 'linked.sqlite'); fs.symlinkSync(f.filename, link);
  assert.throws(() => new CampaignLedger(link), /EVALUATION_STORAGE_INVALID/);
  const dirLink = path.join(f.directory, 'linked-dir'); fs.symlinkSync(path.dirname(f.filename), dirLink);
  assert.throws(() => new CampaignLedger(path.join(dirLink, 'other.sqlite')), /EVALUATION_STORAGE_INVALID/);
  const other = path.join(f.directory, 'other.sqlite');
  const db = new DatabaseSync(other); db.exec('PRAGMA journal_mode=WAL; CREATE TABLE sessions(id INTEGER); PRAGMA user_version=1;'); db.close();
  assert.throws(() => new CampaignLedger(other), /EVALUATION_STORAGE_INVALID/);
  const unchanged = new DatabaseSync(other, { readOnly: true });
  assert.equal(unchanged.prepare('PRAGMA journal_mode').get().journal_mode, 'wal'); unchanged.close();
});

test('two ledger connections cannot claim one campaign or reserve concurrent calls', t => {
  const f = fixture(t), first = f.open(), second = f.open();
  first.start(start());
  assert.throws(() => second.start(start({ planDigest: H(4), approvalDigest: H(5) })), /EVALUATION_CAMPAIGN_ALREADY_USED/);
  first.reserve(reservation());
  assert.throws(() => second.reserve(reservation({ caseId: 'fraction-first', requestDigest: H(4) })), /EVALUATION_REQUEST_PENDING/);
  assert.equal(second.snapshot().campaign.reservedMicros, 5000);
  assert.equal(second.snapshot().campaign.requestCount, 1);
});

test('pending calls survive restart; a new date, campaign digest or request UUID cannot restart the budget', t => {
  const f = fixture(t), first = f.open(); first.start(start()); first.reserve(reservation()); first.close();
  const reopened = f.open();
  assert.equal(reopened.snapshot().rows[0].status, 'pending');
  assert.equal(reopened.snapshot().campaign.reservedMicros, 5000);
  const nextMonth = Date.parse('2026-11-01T12:00:00Z');
  assert.throws(() => reopened.start(start({ planDigest: H(100), approvalDigest: H(101), startedAt: nextMonth,
    deadlineAt: nextMonth + 600000 })), /EVALUATION_CAMPAIGN_ALREADY_USED/);
  assert.throws(() => reopened.reserve(reservation({ requestDigest: H(102), now: nextMonth })), /EVALUATION_DEADLINE/);
  reopened.fail({ code: 'EVALUATION_INTERRUPTED', now: nextMonth });
  assert.equal(reopened.snapshot().campaign.reservedMicros, 5000);
  assert.equal(reopened.snapshot().campaign.status, 'failed');
  assert.throws(() => reopened.start(start()), /EVALUATION_CAMPAIGN_ALREADY_USED/);
});

test('duplicate case or request content and an exhausted lifetime budget cannot reserve a second payment', t => {
  const f = fixture(t), ledger = f.open(); ledger.start(start({ totalBudgetMicros: 7000 }));
  ledger.reserve(reservation()); ledger.complete(completion());
  assert.throws(() => ledger.reserve(reservation({ requestDigest: H(4) })), /EVALUATION_CASE_ALREADY_USED/);
  assert.throws(() => ledger.reserve(reservation({ caseId: 'fraction-first' })), /EVALUATION_CASE_ALREADY_USED/);
  assert.throws(() => ledger.reserve(reservation({ caseId: 'fraction-first', requestDigest: H(4), reservedMicros: 2001 })), /EVALUATION_BUDGET_EXHAUSTED/);
  ledger.reserve(reservation({ caseId: 'fraction-first', requestDigest: H(4), reservedMicros: 2000, now: NOW + 22 }));
  assert.equal(ledger.snapshot().campaign.reservedMicros, 7000);
  assert.equal(ledger.snapshot().campaign.requestCount, 2);
});

test('start, deadline and total request bounds are validated without resetting state', t => {
  const f = fixture(t), ledger = f.open();
  for (const invalid of [{ maxRequests: 33 }, { totalBudgetMicros: 200001 }, { approvalDigest: null },
    { planDigest: 'not-a-digest' }, { deadlineAt: NOW }, { mode: 'mock' }, { totalBudgetMicros: 1.5 }])
    assert.throws(() => ledger.start(start(invalid)), /EVALUATION_CAMPAIGN_INVALID/);
  ledger.start(start({ maxRequests: 1 }));
  assert.throws(() => ledger.reserve(reservation({ now: NOW - 1 })), /EVALUATION_DEADLINE/);
  assert.throws(() => ledger.reserve(reservation({ now: NOW + 600000 })), /EVALUATION_DEADLINE/);
  assert.equal(ledger.snapshot().campaign.requestCount, 0);
  ledger.reserve(reservation()); ledger.complete(completion());
  assert.throws(() => ledger.reserve(reservation({ caseId: 'fraction-first', requestDigest: H(4), now: NOW + 22 })), /EVALUATION_REQUEST_LIMIT/);
});

test('failure preserves spent reservation, safe error codes and any completed synthetic response', t => {
  const f = fixture(t), ledger = f.open(); ledger.start(start()); ledger.reserve(reservation()); ledger.complete(completion());
  ledger.reserve(reservation({ caseId: 'fraction-first', requestDigest: H(4), now: NOW + 22 }));
  assert.throws(() => ledger.fail({ code: 'private provider message /local/path', now: NOW + 23 }), /EVALUATION_FAILURE_INVALID/);
  ledger.fail({ caseId: 'fraction-first', code: 'PROVIDER_TIMEOUT', now: NOW + 24 });
  const snapshot = ledger.snapshot();
  assert.equal(snapshot.campaign.reservedMicros, 10000); assert.equal(snapshot.campaign.requestCount, 2);
  assert.equal(snapshot.campaign.status, 'failed'); assert.equal(snapshot.campaign.errorCode, 'PROVIDER_TIMEOUT');
  assert.equal(snapshot.rows[0].status, 'completed'); assert.equal(snapshot.rows[1].status, 'failed');
  assert.equal(snapshot.rows[1].answer, null);
  ledger.fail({ code: 'SECOND_ERROR', now: NOW + 25 }); assert.deepEqual(ledger.snapshot(), snapshot);
  assert.throws(() => ledger.reserve(reservation()), /EVALUATION_CAMPAIGN_NOT_RUNNING/);
  assert.throws(() => ledger.finish(NOW + 26), /EVALUATION_CAMPAIGN_NOT_RUNNING/);
});

test('only complete campaigns finish; success cannot be overwritten or rerun', t => {
  const f = fixture(t), ledger = f.open(); ledger.start(start({ maxRequests: 1 }));
  assert.throws(() => ledger.finish(NOW + 1), /EVALUATION_CAMPAIGN_INCOMPLETE/);
  ledger.reserve(reservation());
  assert.throws(() => ledger.finish(NOW + 2), /EVALUATION_CAMPAIGN_INCOMPLETE/);
  ledger.complete(completion()); ledger.finish(NOW + 22);
  const snapshot = ledger.snapshot();
  assert.equal(snapshot.campaign.status, 'completed');
  assert.equal(snapshot.rows[0].reportedModel, 'deepseek-flash');
  assert.deepEqual(snapshot.rows[0].usage, { prompt_tokens: 200, completion_tokens: 60 });
  ledger.fail({ code: 'OUTPUT_WRITE_FAILED', now: NOW + 23 }); assert.deepEqual(ledger.snapshot(), snapshot);
  assert.throws(() => ledger.start(start()), /EVALUATION_CAMPAIGN_ALREADY_USED/);
  assert.throws(() => ledger.complete(completion()), /EVALUATION_CAMPAIGN_NOT_RUNNING/);
});

test('the result boundary saves only validated answer fields and safe usage/model metadata', t => {
  const f = fixture(t), ledger = f.open(); ledger.start(start({ maxRequests: 1 })); ledger.reserve(reservation());
  for (const extra of [{ answer: { ...completion().answer, reasoning_content: 'hidden' } },
    { answer: { ...completion().answer, text: 'name@example.test' } },
    { usage: { prompt_tokens: 200, completion_tokens: 501 } },
    { usage: { prompt_tokens: 200, completion_tokens: 60, raw: 'upstream' } },
    { reportedModel: 'model@example.test' }, { latencyMs: -1 }])
    assert.throws(() => ledger.complete(completion(extra)), /EVALUATION_RESULT_INVALID/);
  assert.equal(ledger.snapshot().rows[0].status, 'pending');
  ledger.complete(completion({ answer: { ...completion().answer, verification: 'model-unverified', topic: 'linear-equations',
    sources: [{ id: 'safe-card', url: 'https://mathexam.space/' }], complete: false }, reportedModel: null }));
  assert.deepEqual(ledger.snapshot().rows[0].answer, completion().answer);
  assert.equal(ledger.snapshot().rows[0].reportedModel, null);
});

test('dry-run is explicitly separate and may have no paid approval digest', t => {
  const f = fixture(t), ledger = f.open(); ledger.start(start({ mode: 'dry-run', approvalDigest: null, maxRequests: 1 }));
  ledger.reserve(reservation()); ledger.complete(completion()); ledger.finish(NOW + 22);
  assert.equal(ledger.snapshot().campaign.mode, 'dry-run');
  assert.equal(ledger.snapshot().campaign.approvalDigest, null);
  assert.throws(() => ledger.start(start()), /EVALUATION_CAMPAIGN_ALREADY_USED/);
});

test('failure before the first case permanently closes an empty campaign with zero reservation', t => {
  const f = fixture(t), ledger = f.open(); ledger.start(start());
  assert.throws(() => ledger.fail({ caseId: null, code: 'EVAL_ARTIFACT_WRITE_FAILED', now: NOW + 1 }), /EVALUATION_FAILURE_INVALID/);
  ledger.fail({ code: 'EVAL_ARTIFACT_WRITE_FAILED', now: NOW + 1 });
  assert.equal(ledger.snapshot().campaign.status, 'failed');
  assert.equal(ledger.snapshot().campaign.reservedMicros, 0);
  assert.equal(ledger.snapshot().campaign.requestCount, 0);
  assert.throws(() => ledger.start(start()), /EVALUATION_CAMPAIGN_ALREADY_USED/);
});
