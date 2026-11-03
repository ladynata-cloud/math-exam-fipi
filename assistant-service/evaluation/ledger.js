import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { AssistantError, exactKeys, requireValue } from '../src/errors.js';
import { containsSensitiveText } from '../src/privacy.js';
import { validateModelAnswer } from '../src/tutor.js';

const APPLICATION_ID = 0x4d455641; // MEVA: this is never a pupil/session database.
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const caseId = value => typeof value === 'string' && /^[a-z][a-z0-9-]{0,79}$/.test(value);
const timestamp = value => Number.isSafeInteger(value) && value >= 0;
const positive = value => Number.isSafeInteger(value) && value > 0;
const errorCode = value => typeof value === 'string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(value);

function storageError(error) {
  if (error instanceof AssistantError) return error;
  return new AssistantError('EVALUATION_STORAGE_FAILED', 503);
}

function privateFile(filename) {
  requireValue(typeof filename === 'string' && path.isAbsolute(filename)
    && path.normalize(filename) === filename, 'EVALUATION_STORAGE_INVALID');
  const parent = path.dirname(filename);
  requireValue(parent !== path.parse(parent).root, 'EVALUATION_STORAGE_INVALID');
  // Reject links in every existing component before recursive creation.
  const parts = parent.slice(path.parse(parent).root.length).split(path.sep);
  let current = path.parse(parent).root;
  for (const part of parts) {
    current = path.join(current, part);
    try {
      const info = fs.lstatSync(current);
      requireValue(info.isDirectory() && !info.isSymbolicLink(), 'EVALUATION_STORAGE_INVALID');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  fs.mkdirSync(parent, { recursive: true, mode: 0o700 });
  requireValue(fs.realpathSync(parent) === parent, 'EVALUATION_STORAGE_INVALID');
  fs.chmodSync(parent, 0o700);
  let fd;
  try {
    try { fd = fs.openSync(filename, fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600); }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const info = fs.lstatSync(filename);
      requireValue(info.isFile() && !info.isSymbolicLink() && info.nlink === 1, 'EVALUATION_STORAGE_INVALID');
      fd = fs.openSync(filename, fs.constants.O_RDWR | fs.constants.O_NOFOLLOW);
    }
    const info = fs.fstatSync(fd);
    requireValue(info.isFile() && info.nlink === 1, 'EVALUATION_STORAGE_INVALID');
    fs.fchmodSync(fd, 0o600);
  } finally { if (fd !== undefined) fs.closeSync(fd); }
}

function cleanResult({ answer, usage, reportedModel, latencyMs }) {
  requireValue(exactKeys(answer, ['title', 'text', 'steps', 'check', 'sources', 'verification', 'topic', 'complete']), 'EVALUATION_RESULT_INVALID');
  let text;
  try { text = validateModelAnswer({ title: answer.title, text: answer.text, steps: answer.steps, check: answer.check }); }
  catch { throw new AssistantError('EVALUATION_RESULT_INVALID'); }
  requireValue(!containsSensitiveText([text.title, text.text, ...text.steps, text.check].join('\n')), 'EVALUATION_RESULT_INVALID');
  requireValue(exactKeys(usage, ['prompt_tokens', 'completion_tokens'])
    && positive(usage.prompt_tokens) && usage.prompt_tokens <= 16000
    && positive(usage.completion_tokens) && usage.completion_tokens <= 500, 'EVALUATION_RESULT_INVALID');
  requireValue(reportedModel === null || reportedModel === undefined
    || (typeof reportedModel === 'string' && /^[a-z0-9][a-z0-9._:/-]{0,127}$/i.test(reportedModel)
      && !containsSensitiveText(reportedModel)), 'EVALUATION_RESULT_INVALID');
  requireValue(Number.isSafeInteger(latencyMs) && latencyMs >= 0 && latencyMs <= 3600000, 'EVALUATION_RESULT_INVALID');
  // Only validated public answer fields are saved, never an upstream envelope,
  // hidden reasoning, source credentials, arbitrary metadata or error messages.
  return { answer: JSON.stringify(text), usage: JSON.stringify({ prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens }), reportedModel: reportedModel ?? null, latencyMs };
}

/** One non-resettable synthetic campaign. CLI owns the canonical file path. */
export class CampaignLedger {
  #db;
  #closed = false;
  constructor(filename) {
    try {
      privateFile(filename);
      this.#db = new DatabaseSync(filename);
      const initialApp = this.#db.prepare('PRAGMA application_id').get().application_id;
      const initialVersion = this.#db.prepare('PRAGMA user_version').get().user_version;
      const initialTables = this.#db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table'").get().n;
      requireValue((initialApp === APPLICATION_ID && initialVersion === 1)
        || (initialApp === 0 && initialVersion === 0 && initialTables === 0), 'EVALUATION_STORAGE_INVALID');
      this.#db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA busy_timeout=1000; PRAGMA max_page_count=1024; PRAGMA secure_delete=ON;');
      this.#transaction(() => {
        const app = this.#db.prepare('PRAGMA application_id').get().application_id;
        const version = this.#db.prepare('PRAGMA user_version').get().user_version;
        if (app === APPLICATION_ID && version === 1) return;
        const existing = this.#db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table'").get().n;
        requireValue(app === 0 && version === 0 && existing === 0, 'EVALUATION_STORAGE_INVALID');
        this.#db.exec(`
          CREATE TABLE campaign (
            id INTEGER PRIMARY KEY CHECK(id=1), plan_digest TEXT NOT NULL, approval_digest TEXT,
            mode TEXT NOT NULL CHECK(mode IN ('live','dry-run')),
            status TEXT NOT NULL CHECK(status IN ('running','completed','failed')),
            max_requests INTEGER NOT NULL CHECK(max_requests>0 AND max_requests<=32),
            total_budget_micros INTEGER NOT NULL CHECK(total_budget_micros>0 AND total_budget_micros<=200000),
            reserved_micros INTEGER NOT NULL DEFAULT 0 CHECK(reserved_micros>=0 AND reserved_micros<=total_budget_micros),
            request_count INTEGER NOT NULL DEFAULT 0 CHECK(request_count>=0 AND request_count<=max_requests),
            started_at INTEGER NOT NULL, deadline_at INTEGER NOT NULL, finished_at INTEGER, error_code TEXT,
            CHECK(mode='dry-run' OR approval_digest IS NOT NULL)
          );
          CREATE TABLE cases (
            case_id TEXT PRIMARY KEY, request_digest TEXT NOT NULL UNIQUE,
            reserved_micros INTEGER NOT NULL CHECK(reserved_micros>0),
            status TEXT NOT NULL CHECK(status IN ('pending','completed','failed')),
            started_at INTEGER NOT NULL, finished_at INTEGER, answer_json TEXT, usage_json TEXT,
            reported_model TEXT, latency_ms INTEGER, error_code TEXT
          );
          PRAGMA application_id=${APPLICATION_ID};
          PRAGMA user_version=1;
        `);
      });
    } catch (error) { this.#db?.close(); throw storageError(error); }
  }
  #transaction(fn) {
    try {
      requireValue(!this.#closed, 'EVALUATION_LEDGER_CLOSED');
      this.#db.exec('BEGIN IMMEDIATE');
      try { const result = fn(); this.#db.exec('COMMIT'); return result; }
      catch (error) { try { this.#db.exec('ROLLBACK'); } catch {} throw error; }
    } catch (error) { throw storageError(error); }
  }
  #running() {
    const campaign = this.#db.prepare('SELECT * FROM campaign WHERE id=1').get();
    requireValue(campaign?.status === 'running', 'EVALUATION_CAMPAIGN_NOT_RUNNING');
    return campaign;
  }
  start({ planDigest, approvalDigest, mode, maxRequests, totalBudgetMicros, startedAt, deadlineAt }) {
    requireValue(digest(planDigest) && ['live', 'dry-run'].includes(mode)
      && (digest(approvalDigest) || (mode === 'dry-run' && approvalDigest === null))
      && positive(maxRequests) && maxRequests <= 32
      && positive(totalBudgetMicros) && totalBudgetMicros <= 200000
      && timestamp(startedAt) && timestamp(deadlineAt) && deadlineAt > startedAt,
    'EVALUATION_CAMPAIGN_INVALID');
    this.#transaction(() => {
      requireValue(!this.#db.prepare('SELECT id FROM campaign WHERE id=1').get(), 'EVALUATION_CAMPAIGN_ALREADY_USED');
      this.#db.prepare(`INSERT INTO campaign(id,plan_digest,approval_digest,mode,status,max_requests,total_budget_micros,started_at,deadline_at)
        VALUES(1,?,?,?,'running',?,?,?,?)`).run(planDigest, approvalDigest, mode, maxRequests, totalBudgetMicros, startedAt, deadlineAt);
    });
    return this.snapshot();
  }
  reserve({ caseId: id, requestDigest, reservedMicros, now }) {
    requireValue(caseId(id) && digest(requestDigest) && positive(reservedMicros) && timestamp(now), 'EVALUATION_RESERVATION_INVALID');
    this.#transaction(() => {
      const campaign = this.#running();
      requireValue(now >= campaign.started_at && now < campaign.deadline_at, 'EVALUATION_DEADLINE');
      requireValue(!this.#db.prepare('SELECT case_id FROM cases WHERE case_id=? OR request_digest=?').get(id, requestDigest), 'EVALUATION_CASE_ALREADY_USED');
      requireValue(!this.#db.prepare("SELECT case_id FROM cases WHERE status='pending'").get(), 'EVALUATION_REQUEST_PENDING');
      requireValue(campaign.request_count < campaign.max_requests, 'EVALUATION_REQUEST_LIMIT');
      requireValue(reservedMicros <= campaign.total_budget_micros - campaign.reserved_micros, 'EVALUATION_BUDGET_EXHAUSTED');
      this.#db.prepare('UPDATE campaign SET reserved_micros=reserved_micros+?,request_count=request_count+1 WHERE id=1').run(reservedMicros);
      this.#db.prepare("INSERT INTO cases(case_id,request_digest,reserved_micros,status,started_at) VALUES(?,?,?,'pending',?)")
        .run(id, requestDigest, reservedMicros, now);
    });
    return this.snapshot();
  }
  complete({ caseId: id, answer, usage, reportedModel = null, latencyMs, now }) {
    requireValue(caseId(id) && timestamp(now), 'EVALUATION_RESULT_INVALID');
    const clean = cleanResult({ answer, usage, reportedModel, latencyMs });
    this.#transaction(() => {
      this.#running();
      const row = this.#db.prepare("SELECT started_at FROM cases WHERE case_id=? AND status='pending'").get(id);
      requireValue(row && now >= row.started_at, 'EVALUATION_CASE_NOT_PENDING');
      this.#db.prepare(`UPDATE cases SET status='completed',finished_at=?,answer_json=?,usage_json=?,reported_model=?,latency_ms=? WHERE case_id=?`)
        .run(now, clean.answer, clean.usage, clean.reportedModel, clean.latencyMs, id);
    });
    return this.snapshot();
  }
  fail({ caseId: id, code, now }) {
    requireValue((id === undefined || caseId(id)) && errorCode(code) && timestamp(now), 'EVALUATION_FAILURE_INVALID');
    this.#transaction(() => {
      const campaign = this.#db.prepare('SELECT * FROM campaign WHERE id=1').get();
      // Idempotent failure handling never replaces a successful result or the
      // first failure, and never refunds a possibly billed reservation.
      if (!campaign || campaign.status !== 'running') return;
      requireValue(now >= campaign.started_at, 'EVALUATION_FAILURE_INVALID');
      this.#db.prepare("UPDATE campaign SET status='failed',finished_at=?,error_code=? WHERE id=1").run(now, code);
      if (id !== undefined) this.#db.prepare("UPDATE cases SET status='failed',finished_at=?,error_code=? WHERE case_id=? AND status='pending'").run(now, code, id);
      else this.#db.prepare("UPDATE cases SET status='failed',finished_at=?,error_code=? WHERE status='pending'").run(now, code);
    });
    return this.snapshot();
  }
  finish(now) {
    requireValue(timestamp(now), 'EVALUATION_CAMPAIGN_INVALID');
    this.#transaction(() => {
      const campaign = this.#running();
      requireValue(now >= campaign.started_at && campaign.request_count === campaign.max_requests
        && this.#db.prepare("SELECT COUNT(*) AS n FROM cases WHERE status='completed'").get().n === campaign.max_requests,
      'EVALUATION_CAMPAIGN_INCOMPLETE');
      this.#db.prepare("UPDATE campaign SET status='completed',finished_at=? WHERE id=1").run(now);
    });
    return this.snapshot();
  }
  snapshot() {
    try {
      requireValue(!this.#closed, 'EVALUATION_LEDGER_CLOSED');
      const row = this.#db.prepare('SELECT * FROM campaign WHERE id=1').get();
      const campaign = row ? { planDigest: row.plan_digest, approvalDigest: row.approval_digest, mode: row.mode,
        status: row.status, maxRequests: row.max_requests, totalBudgetMicros: row.total_budget_micros,
        reservedMicros: row.reserved_micros, requestCount: row.request_count,
        startedAt: row.started_at, deadlineAt: row.deadline_at, finishedAt: row.finished_at, errorCode: row.error_code } : null;
      const rows = this.#db.prepare('SELECT * FROM cases ORDER BY rowid').all().map(value => ({
        caseId: value.case_id, requestDigest: value.request_digest, reservedMicros: value.reserved_micros,
        status: value.status, startedAt: value.started_at, finishedAt: value.finished_at,
        answer: value.answer_json === null ? null : JSON.parse(value.answer_json),
        usage: value.usage_json === null ? null : JSON.parse(value.usage_json),
        reportedModel: value.reported_model, latencyMs: value.latency_ms, errorCode: value.error_code
      }));
      return { campaign, rows };
    } catch (error) { throw storageError(error); }
  }
  close() { if (!this.#closed) { this.#db.close(); this.#closed = true; } }
}
