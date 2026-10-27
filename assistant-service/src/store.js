import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import { DatabaseSync, backup } from 'node:sqlite';
import { requireValue } from './errors.js';
import { validateCard } from './knowledge.js';

export const hash = text => createHash('sha256').update(text).digest('hex');
export function secretEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  return timingSafeEqual(Buffer.from(hash(a), 'hex'), Buffer.from(hash(b), 'hex'));
}
const dayKey = now => new Date(now).toISOString().slice(0, 10);
const monthKey = now => new Date(now).toISOString().slice(0, 7);

export class AssistantStore {
  constructor({ config, builtinCards = [], topics = [], clock = Date.now }) {
    this.config = config; this.clock = clock; this.builtinCards = builtinCards; this.topics = topics;
    const filename = config.dbPath;
    fs.mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
    requireValue(!fs.lstatSync(path.dirname(filename)).isSymbolicLink(), 'STORAGE_INVALID', 503);
    try { const fd = fs.openSync(filename, 'wx', 0o600); fs.closeSync(fd); }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
    requireValue(fs.lstatSync(filename).isFile() && !fs.lstatSync(filename).isSymbolicLink(), 'STORAGE_INVALID', 503);
    fs.chmodSync(filename, 0o600);
    this.db = new DatabaseSync(filename);
    try {
      this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA busy_timeout=1000; PRAGMA max_page_count=16384; PRAGMA secure_delete=ON;');
      const version = this.db.prepare('PRAGMA user_version').get().user_version;
      requireValue(version === 0 || version === 1, 'STORAGE_VERSION_UNSUPPORTED', 503);
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, csrf_hash TEXT NOT NULL, created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL, simpler INTEGER NOT NULL DEFAULT 0, requests INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY, session_hash TEXT REFERENCES sessions(hash) ON DELETE SET NULL,
          created_at INTEGER NOT NULL, kind TEXT NOT NULL, reserved_micros INTEGER NOT NULL, input_bound INTEGER NOT NULL,
          output_bound INTEGER NOT NULL, status TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS requests_pending ON requests(kind,status,created_at);
        CREATE TABLE IF NOT EXISTS answers(id TEXT PRIMARY KEY, session_hash TEXT NOT NULL REFERENCES sessions(hash) ON DELETE CASCADE,
          topic TEXT NOT NULL, created_at INTEGER NOT NULL, verification TEXT NOT NULL, rating TEXT);
        CREATE TABLE IF NOT EXISTS feedback_totals(day TEXT NOT NULL, topic TEXT NOT NULL, rating TEXT NOT NULL,
          count INTEGER NOT NULL CHECK(count>=0), PRIMARY KEY(day,topic,rating));
        CREATE TABLE IF NOT EXISTS usage_totals(period TEXT PRIMARY KEY, reserved_micros INTEGER NOT NULL DEFAULT 0,
          requests INTEGER NOT NULL DEFAULT 0, api_requests INTEGER NOT NULL DEFAULT 0,
          input_tokens INTEGER NOT NULL DEFAULT 0, output_tokens INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS knowledge_candidates(id TEXT PRIMARY KEY, card_json TEXT NOT NULL,
          created_at INTEGER NOT NULL, status TEXT NOT NULL, reviewer TEXT, reviewed_at INTEGER);
        CREATE TABLE IF NOT EXISTS knowledge_revisions(card_id TEXT NOT NULL, version INTEGER NOT NULL,
          card_json TEXT NOT NULL, reviewer TEXT NOT NULL, approved_at INTEGER NOT NULL, candidate_id TEXT NOT NULL,
          PRIMARY KEY(card_id,version));
        PRAGMA user_version=1;
      `);
      if (config.mode === 'api') this.transaction(() => {
        const oldCurrency = this.meta('currency');
        requireValue(!oldCurrency || oldCurrency === config.currency, 'BUDGET_CURRENCY_MISMATCH', 503);
        this.setMeta('currency', config.currency);
      });
      this.cleanup();
    } catch (error) { this.db.close(); throw error; }
  }
  transaction(fn) {
    this.db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); this.db.exec('COMMIT'); return result; }
    catch (error) { try { this.db.exec('ROLLBACK'); } catch {} throw error; }
  }
  meta(key) { return this.db.prepare('SELECT value FROM meta WHERE key=?').get(key)?.value; }
  setMeta(key, value) { this.db.prepare('INSERT INTO meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, String(value)); }
  cleanup() {
    const now = this.clock();
    this.transaction(() => {
      this.db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(now);
      this.db.prepare('DELETE FROM requests WHERE created_at<=?').run(now - this.config.sessionTtlMs);
      this.db.prepare('DELETE FROM feedback_totals WHERE day<=?').run(dayKey(now - this.config.feedbackRetentionMs));
      // Only aggregate accounting survives sessions: current calendar month
      // and the previous twelve UTC months, never conversation contents.
      const oldest = new Date(now); oldest.setUTCDate(1); oldest.setUTCMonth(oldest.getUTCMonth() - 12);
      this.db.prepare('DELETE FROM usage_totals WHERE period<?').run(monthKey(oldest.getTime()));
    });
  }
  createSession() {
    const now = this.clock(), token = randomBytes(32).toString('base64url'), csrf = randomBytes(32).toString('base64url');
    this.transaction(() => {
      this.db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(now);
      requireValue(this.db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n < 200, 'SESSION_CAPACITY', 429);
      this.db.prepare('INSERT INTO sessions(hash,csrf_hash,created_at,expires_at) VALUES(?,?,?,?)')
        .run(hash(token), hash(csrf), now, now + this.config.sessionTtlMs);
    });
    return { token, csrf };
  }
  session(token) {
    requireValue(typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token), 'SESSION_REQUIRED', 401);
    const row = this.db.prepare('SELECT * FROM sessions WHERE hash=? AND expires_at>?').get(hash(token), this.clock());
    requireValue(row, 'SESSION_REQUIRED', 401);
    return row;
  }
  verifyCsrf(session, csrf) { requireValue(typeof csrf === 'string' && secretEqual(session.csrf_hash, hash(csrf)), 'CSRF_REJECTED', 403); }
  deleteSession(sessionHash) {
    this.transaction(() => {
      for (const row of this.db.prepare('SELECT topic,rating,created_at FROM answers WHERE session_hash=? AND rating IS NOT NULL').all(sessionHash)) {
        this.db.prepare('UPDATE feedback_totals SET count=count-1 WHERE day=? AND topic=? AND rating=? AND count>0')
          .run(dayKey(row.created_at), row.topic, row.rating);
      }
      this.db.prepare("DELETE FROM requests WHERE session_hash=? AND status!='pending'").run(sessionHash);
      // ON DELETE SET NULL preserves in-flight reservations/concurrency without
      // a session link until completion/expiry. Aggregate spend cannot be reset.
      this.db.prepare('DELETE FROM sessions WHERE hash=?').run(sessionHash);
    });
  }
  total(period) { return this.db.prepare('SELECT * FROM usage_totals WHERE period=?').get(period)
    || { period, reserved_micros: 0, requests: 0, api_requests: 0, input_tokens: 0, output_tokens: 0 }; }
  reserve({ sessionHash, requestId, kind = 'offline', reservedMicros = 0, inputBound = 0 }) {
    const now = this.clock(), id = hash(`${sessionHash}:${requestId}`), day = dayKey(now), month = monthKey(now);
    return this.transaction(() => {
      const session = this.db.prepare('SELECT * FROM sessions WHERE hash=? AND expires_at>?').get(sessionHash, now);
      requireValue(session, 'SESSION_REQUIRED', 401);
      requireValue(!this.db.prepare('SELECT id FROM requests WHERE id=?').get(id), 'REQUEST_ALREADY_USED', 409);
      requireValue(session.requests < this.config.maxSessionRequests, 'SESSION_RATE_LIMIT', 429);
      const recent = this.db.prepare('SELECT COUNT(*) AS n FROM requests WHERE session_hash=? AND created_at>?').get(sessionHash, now - 60000).n;
      requireValue(recent < 10, 'SESSION_RATE_LIMIT', 429);
      const daily = this.total(day), monthly = this.total(month);
      requireValue(daily.requests < this.config.maxDailyRequests, 'GLOBAL_RATE_LIMIT', 429);
      if (kind === 'api') {
        requireValue(this.config.mode === 'api' && !this.meta('provider_circuit'), 'PROVIDER_DISABLED', 503);
        requireValue(Number.isSafeInteger(reservedMicros) && reservedMicros > 0, 'BUDGET_INVALID', 503);
        requireValue(daily.api_requests < this.config.maxDailyApiRequests, 'API_RATE_LIMIT', 429);
        requireValue(daily.reserved_micros + reservedMicros <= this.config.dailyBudgetMicros
          && monthly.reserved_micros + reservedMicros <= this.config.monthlyBudgetMicros, 'BUDGET_EXHAUSTED', 429);
        const pending = this.db.prepare("SELECT COUNT(*) AS n FROM requests WHERE kind='api' AND status='pending' AND created_at>?")
          .get(now - this.config.timeoutMs - 5000).n;
        requireValue(pending < this.config.maxConcurrent, 'PROVIDER_BUSY', 429);
      }
      this.db.prepare('UPDATE sessions SET requests=requests+1 WHERE hash=?').run(sessionHash);
      for (const period of [day, month]) {
        this.db.prepare(`INSERT INTO usage_totals(period,reserved_micros,requests,api_requests) VALUES(?,?,1,?)
          ON CONFLICT(period) DO UPDATE SET reserved_micros=reserved_micros+excluded.reserved_micros,
          requests=requests+1, api_requests=api_requests+excluded.api_requests`).run(period, reservedMicros, kind === 'api' ? 1 : 0);
      }
      this.db.prepare('INSERT INTO requests VALUES(?,?,?,?,?,?,?,?)').run(id, sessionHash, now, kind, reservedMicros,
        inputBound, kind === 'api' ? this.config.maxOutputTokens : 0, 'pending');
      return { id, day, month };
    });
  }
  finish(reservation, sessionHash, answer, usage = null) {
    return this.transaction(() => {
      requireValue(this.db.prepare('SELECT hash FROM sessions WHERE hash=? AND expires_at>?').get(sessionHash, this.clock()), 'SESSION_REQUIRED', 401);
      const request = this.db.prepare('SELECT * FROM requests WHERE id=? AND status=?').get(reservation.id, 'pending');
      requireValue(request, 'REQUEST_ALREADY_USED', 409);
      this.db.prepare("UPDATE requests SET status='complete' WHERE id=?").run(reservation.id);
      if (usage) for (const period of [reservation.day, reservation.month]) {
        this.db.prepare('UPDATE usage_totals SET input_tokens=input_tokens+?,output_tokens=output_tokens+? WHERE period=?')
          .run(usage.prompt_tokens, usage.completion_tokens, period);
      }
      const id = randomUUID();
      this.db.prepare('INSERT INTO answers(id,session_hash,topic,created_at,verification) VALUES(?,?,?,?,?)')
        .run(id, sessionHash, answer.topic, this.clock(), answer.verification);
      return { ...answer, id };
    });
  }
  fail(reservation) { this.db.prepare("UPDATE requests SET status='failed' WHERE id=?").run(reservation.id); }
  tripCircuit(reason = 'PROVIDER_CONTRACT_CHANGED') { this.setMeta('provider_circuit', reason); }
  feedback(sessionHash, answerId, rating) {
    requireValue(['helpful', 'unclear', 'incorrect'].includes(rating), 'FEEDBACK_INVALID');
    return this.transaction(() => {
      requireValue(this.db.prepare('SELECT hash FROM sessions WHERE hash=? AND expires_at>?').get(sessionHash, this.clock()), 'SESSION_REQUIRED', 401);
      const answer = this.db.prepare('SELECT * FROM answers WHERE id=? AND session_hash=?').get(answerId, sessionHash);
      requireValue(answer, 'ANSWER_NOT_FOUND', 404);
      const day = dayKey(answer.created_at);
      if (answer.rating === rating) return;
      if (answer.rating) this.db.prepare('UPDATE feedback_totals SET count=count-1 WHERE day=? AND topic=? AND rating=? AND count>0')
        .run(day, answer.topic, answer.rating);
      this.db.prepare(`INSERT INTO feedback_totals VALUES(?,?,?,1) ON CONFLICT(day,topic,rating) DO UPDATE SET count=count+1`)
        .run(day, answer.topic, rating);
      this.db.prepare('UPDATE answers SET rating=? WHERE id=?').run(rating, answerId);
      if (rating !== 'helpful') this.db.prepare('UPDATE sessions SET simpler=1 WHERE hash=?').run(sessionHash);
    });
  }
  knowledge(topic) {
    const cards = new Map();
    const rows = this.db.prepare(`SELECT r.card_json FROM knowledge_revisions r JOIN
      (SELECT card_id, MAX(version) AS version FROM knowledge_revisions GROUP BY card_id) latest
      ON latest.card_id=r.card_id AND latest.version=r.version ORDER BY r.approved_at DESC,r.version DESC,r.card_id`).all();
    for (const row of rows) { const card = validateCard(JSON.parse(row.card_json), this.topics); if (card.topic === topic) cards.set(card.id, card); }
    for (const card of this.builtinCards) if (card.topic === topic && !cards.has(card.id)) cards.set(card.id, card);
    return [...cards.values()].slice(0, 3);
  }
  propose(card) {
    const value = validateCard(card, this.topics), id = randomUUID();
    this.db.prepare('INSERT INTO knowledge_candidates(id,card_json,created_at,status) VALUES(?,?,?,?)')
      .run(id, JSON.stringify(value), this.clock(), 'pending');
    return id;
  }
  review(id, verdict, reviewer) {
    requireValue(['approve', 'reject'].includes(verdict) && /^[a-z][a-z0-9-]{1,39}$/.test(reviewer), 'REVIEW_INVALID');
    return this.transaction(() => {
      const row = this.db.prepare('SELECT * FROM knowledge_candidates WHERE id=? AND status=?').get(id, 'pending');
      requireValue(row, 'CANDIDATE_NOT_FOUND', 404);
      const card = validateCard(JSON.parse(row.card_json), this.topics);
      if (verdict === 'approve') {
        const previous = this.db.prepare('SELECT MAX(version) AS version FROM knowledge_revisions WHERE card_id=?').get(card.id).version || 0;
        const builtin = this.builtinCards.find(value => value.id === card.id)?.version || 0;
        card.version = Math.max(previous, builtin) + 1;
        this.db.prepare('INSERT INTO knowledge_revisions VALUES(?,?,?,?,?,?)')
          .run(card.id, card.version, JSON.stringify(card), reviewer, this.clock(), id);
      }
      this.db.prepare('UPDATE knowledge_candidates SET status=?,reviewer=?,reviewed_at=? WHERE id=?')
        .run(verdict === 'approve' ? 'approved' : 'rejected', reviewer, this.clock(), id);
      return card;
    });
  }
  summary() {
    return {
      day: this.total(dayKey(this.clock())), month: this.total(monthKey(this.clock())), currency: this.meta('currency') || null,
      providerCircuit: this.meta('provider_circuit') || null,
      feedback: this.db.prepare('SELECT day,topic,rating,count FROM feedback_totals WHERE count>0 ORDER BY day DESC,topic,rating LIMIT 300').all(),
      pendingKnowledge: this.db.prepare("SELECT id,card_json,created_at FROM knowledge_candidates WHERE status='pending' ORDER BY created_at LIMIT 100").all()
        .map(row => ({ id: row.id, card: JSON.parse(row.card_json), createdAt: row.created_at }))
    };
  }
  async backupTo(filename) {
    requireValue(path.isAbsolute(filename) && !fs.existsSync(filename), 'BACKUP_PATH_INVALID');
    // Secure from the first byte, not only after an asynchronous copy completes.
    const fd = fs.openSync(filename, 'wx', 0o600); fs.closeSync(fd);
    await backup(this.db, filename);
  }
  close() { this.db.close(); }
}
