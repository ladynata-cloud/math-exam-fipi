'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { LearningError, requireValue, exactKeys, safeName, normalizeLogin, token, tokenHash, TOKEN_RE } = require('./learning-auth');
const DAY = 86400000;
const ID = /^[A-Za-z0-9_-]{12,80}$/;
const clone = value => JSON.parse(JSON.stringify(value));
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
const json = value => JSON.stringify(value);
const parse = value => JSON.parse(value);
function accountDTO(row) { return { id: row.id, role: row.role, name: row.name, login: row.login, teacherId: row.teacher_id, active: !!row.password_hash }; }
const QUICK_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

function migrateProfileCourse(db) {
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='learning_profiles'").get()?.sql;
  const previousCheck = "CHECK(course IN ('school','foundations','oge','ege'))";
  const currentCheck = "CHECK(course IN ('school','foundations','oge','ege','ege-profile'))";
  if (schema?.includes(currentCheck)) return;
  // Keep the existing backup format (user_version=1). Only this additive
  // feature's enum changes; identities, attempts and their contracts do not.
  requireValue(schema?.includes(previousCheck), 'LEARNING_SCHEMA_UNSUPPORTED');
  const quote = name => '"' + name.replaceAll('"', '""') + '"';
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  requireValue(tables.every(({ name }) => !db.prepare('PRAGMA foreign_key_list(' + quote(name) + ')').all()
    .some(key => key.table === 'learning_profiles')), 'LEARNING_SCHEMA_UNSUPPORTED');
  const related = db.prepare("SELECT sql FROM sqlite_master WHERE tbl_name='learning_profiles' AND type IN ('index','trigger') AND sql IS NOT NULL").all();
  const replacement = schema.replace(/^CREATE TABLE(?: IF NOT EXISTS)? (?:"learning_profiles"|learning_profiles)(?=\s*\()/i, 'CREATE TABLE learning_profiles_course_migration')
    .replace(previousCheck, currentCheck);
  requireValue(replacement.startsWith('CREATE TABLE learning_profiles_course_migration'), 'LEARNING_SCHEMA_UNSUPPORTED');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(replacement);
    db.exec(`INSERT INTO learning_profiles_course_migration SELECT * FROM learning_profiles;
      DROP TABLE learning_profiles;
      ALTER TABLE learning_profiles_course_migration RENAME TO learning_profiles;`);
    for (const row of related) db.exec(row.sql);
    requireValue(db.prepare('PRAGMA foreign_key_check').all().length === 0, 'LEARNING_SCHEMA_UNSUPPORTED');
    db.exec('COMMIT');
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch (_rollback) {}
    throw error;
  }
}

class LearningStore {
  constructor({ filePath = process.env.LEARNING_DB_PATH, contracts = {}, clock = Date.now } = {}) {
    this.clock = clock; this.contracts = contracts; this.available = false;
    this.reason = filePath ? 'LEARNING_STORAGE_UNAVAILABLE' : 'LEARNING_STORAGE_NOT_CONFIGURED';
    if (!filePath) return;
    try {
      requireValue(path.isAbsolute(filePath), 'LEARNING_DB_PATH_INVALID');
      fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
      try { const fd = fs.openSync(filePath, 'wx', 0o600); fs.closeSync(fd); }
      catch (error) { if (error.code !== 'EEXIST') throw error; }
      requireValue(fs.lstatSync(filePath).isFile() && !fs.lstatSync(filePath).isSymbolicLink(), 'LEARNING_DB_PATH_INVALID');
      fs.chmodSync(filePath, 0o600);
      this.db = new DatabaseSync(filePath);
      this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA busy_timeout=0; PRAGMA locking_mode=EXCLUSIVE; BEGIN EXCLUSIVE; COMMIT; PRAGMA max_page_count=262144;');
      const version = this.db.prepare('PRAGMA user_version').get().user_version;
      requireValue(version === 0 || version === 1, 'LEARNING_SCHEMA_UNSUPPORTED');
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('teacher','student')), teacher_id TEXT NOT NULL,
          login TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT, auth_epoch INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
        CREATE UNIQUE INDEX IF NOT EXISTS one_teacher ON accounts(role) WHERE role='teacher';
        CREATE TABLE IF NOT EXISTS learning_profiles(learner_id TEXT PRIMARY KEY REFERENCES accounts(id), teacher_id TEXT NOT NULL REFERENCES accounts(id),
          course TEXT NOT NULL CHECK(course IN ('school','foundations','oge','ege','ege-profile')), goal TEXT CHECK(goal IN ('pass','grade5')),
          focus TEXT NOT NULL, version INTEGER NOT NULL, updated_at INTEGER NOT NULL, CHECK(course='oge' OR goal IS NULL));
        CREATE TABLE IF NOT EXISTS invitations(hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), purpose TEXT NOT NULL,
          expires_at INTEGER NOT NULL, used_at INTEGER);
        CREATE TABLE IF NOT EXISTS recovery_codes(hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), used_at INTEGER);
        CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), epoch INTEGER NOT NULL, expires_at INTEGER NOT NULL);
        CREATE INDEX IF NOT EXISTS session_account ON sessions(account_id);
        CREATE TABLE IF NOT EXISTS learning_quick_access(account_id TEXT PRIMARY KEY REFERENCES accounts(id), hash TEXT UNIQUE,
          epoch INTEGER NOT NULL, expires_at INTEGER, version INTEGER NOT NULL, updated_at INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS learning_quick_sessions(session_hash TEXT PRIMARY KEY REFERENCES sessions(hash) ON DELETE CASCADE,
          quick_hash TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS quick_session_grant ON learning_quick_sessions(quick_hash);
        CREATE TABLE IF NOT EXISTS attempts(id TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES accounts(id), teacher_id TEXT NOT NULL REFERENCES accounts(id),
          trainer_id TEXT NOT NULL, task_json TEXT NOT NULL, initial_state_json TEXT NOT NULL, state_json TEXT NOT NULL, strokes_json TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0, trainer_version INTEGER NOT NULL DEFAULT 0,
          controller TEXT NOT NULL DEFAULT 'student', assistance_json TEXT NOT NULL, outcome TEXT NOT NULL DEFAULT 'started', source_attempt_id TEXT, archived_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
        CREATE INDEX IF NOT EXISTS attempt_learner ON attempts(learner_id);
        CREATE TABLE IF NOT EXISTS assignments(id TEXT PRIMARY KEY, title TEXT NOT NULL, learner_id TEXT NOT NULL REFERENCES accounts(id), teacher_id TEXT NOT NULL REFERENCES accounts(id),
          attempt_id TEXT NOT NULL REFERENCES attempts(id), due_at TEXT, status TEXT NOT NULL DEFAULT 'draft', batch_id TEXT, created_at INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT, attempt_id TEXT NOT NULL REFERENCES attempts(id), actor_id TEXT NOT NULL REFERENCES accounts(id),
          actor_role TEXT NOT NULL, op_id TEXT NOT NULL, fingerprint TEXT NOT NULL, revision INTEGER NOT NULL, type TEXT NOT NULL, payload_json TEXT NOT NULL, at INTEGER NOT NULL,
          UNIQUE(actor_id,op_id));
        CREATE INDEX IF NOT EXISTS attempt_events ON events(attempt_id,revision);
        CREATE TABLE IF NOT EXISTS lessons(id TEXT PRIMARY KEY, teacher_id TEXT NOT NULL REFERENCES accounts(id), title TEXT NOT NULL, seats_json TEXT NOT NULL,
          common_attempt_id TEXT REFERENCES attempts(id), presentation_target TEXT, version INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS lesson_operations(actor_id TEXT NOT NULL,op_id TEXT NOT NULL,lesson_id TEXT NOT NULL REFERENCES lessons(id),fingerprint TEXT NOT NULL,
          PRIMARY KEY(actor_id,op_id));
        CREATE TABLE IF NOT EXISTS operations(actor_id TEXT NOT NULL,op_id TEXT NOT NULL,fingerprint TEXT NOT NULL,result_json TEXT NOT NULL,PRIMARY KEY(actor_id,op_id));
        PRAGMA user_version=1;
      `);
      migrateProfileCourse(this.db);
      this.available = true; this.reason = null;
      if (this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='learning_run_attempts'").get()
        && this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='learning_runs'").get()) {
        this.runGuard = attemptId => !!this.row('SELECT r.id FROM learning_run_attempts a JOIN learning_runs r ON r.id=a.run_id WHERE a.attempt_id=? AND r.finished_at IS NULL', attemptId);
      }
    } catch (_error) { this.close(); }
  }
  close() { if (this.db) { try { this.db.close(); } catch (_error) {} this.db = null; } this.available = false; }
  ready() { requireValue(this.available, this.reason || 'LEARNING_STORAGE_UNAVAILABLE', 503); }
  status() { return { available: this.available, durable: this.available, reason: this.reason, maxStudents: 8,
    trainers: typeof this.contracts.list === 'function' ? this.contracts.list() : [] }; }
  transaction(callback) {
    this.ready(); this.db.exec('BEGIN IMMEDIATE');
    try { const result = callback(); this.db.exec('COMMIT'); return result; }
    catch (error) { try { this.db.exec('ROLLBACK'); } catch (_rollback) {} throw error; }
  }
  row(sql, ...args) { this.ready(); return this.db.prepare(sql).get(...args); }
  rows(sql, ...args) { this.ready(); return this.db.prepare(sql).all(...args); }
  run(sql, ...args) { this.ready(); return this.db.prepare(sql).run(...args); }
  account(id) { return this.row('SELECT * FROM accounts WHERE id=?', id); }
  accountByLogin(login) { return this.row('SELECT * FROM accounts WHERE login=?', login); }
  teacher(auth) { requireValue(auth?.role === 'teacher', 'LEARNING_FORBIDDEN', 403); }
  ownsStudent(auth, id) { this.teacher(auth); const row = this.account(id); requireValue(row?.role === 'student' && row.teacher_id === auth.id, 'LEARNING_NOT_FOUND', 404); return row; }
  limit(table, maximum) { requireValue(this.row(`SELECT COUNT(*) AS n FROM ${table}`).n < maximum, 'LEARNING_LIMIT_EXCEEDED', 507); }
  newInvitation(accountId, purpose, duration, providedSecret) {
    const secret = providedSecret ?? token(); const expiresAt = this.clock() + duration;
    requireValue(typeof secret === 'string' && /^[A-Za-z0-9_-]{43,100}$/.test(secret), 'LEARNING_BOOTSTRAP_CONFIG_INVALID');
    this.run('DELETE FROM invitations WHERE account_id=? AND used_at IS NULL', accountId);
    this.run('INSERT INTO invitations(hash,account_id,purpose,expires_at) VALUES(?,?,?,?)', tokenHash(secret), accountId, purpose, expiresAt);
    return { invitationToken: secret, expiresAt };
  }
  bootstrap({ login, name, invitationToken }) {
    login = normalizeLogin(login); name = safeName(name);
    return this.transaction(() => {
      requireValue(!this.row("SELECT id FROM accounts WHERE role='teacher'"), 'LEARNING_ALREADY_BOOTSTRAPPED', 409);
      const id = token(18);
      this.run("INSERT INTO accounts(id,role,teacher_id,login,name,created_at) VALUES(?,'teacher',?,?,?,?)", id, id, login, name, this.clock());
      return { account: accountDTO(this.account(id)), ...this.newInvitation(id, 'activate', 3 * DAY, invitationToken) };
    });
  }
  renewBootstrap(login) {
    login = normalizeLogin(login);
    return this.transaction(() => {
      const account = this.accountByLogin(login);
      requireValue(account?.role === 'teacher' && !account.password_hash, 'LEARNING_BOOTSTRAP_NOT_PENDING', 409);
      return { account: accountDTO(account), ...this.newBootstrapInvitation(account.id, token()) };
    });
  }
  // Operator-only pending invitation repair. Keep revoked hashes so an old
  // deployment configuration cannot bring a replaced invitation back to life.
  newBootstrapInvitation(accountId, secret) {
    requireValue(typeof secret === 'string' && /^[A-Za-z0-9_-]{43,100}$/.test(secret) && new Set(secret).size >= 16, 'LEARNING_BOOTSTRAP_CONFIG_INVALID');
    requireValue(!this.row('SELECT hash FROM invitations WHERE hash=?', tokenHash(secret)), 'LEARNING_BOOTSTRAP_TOKEN_REVOKED', 409);
    const at = this.clock(), expiresAt = at + 3 * DAY;
    this.run('UPDATE invitations SET used_at=? WHERE account_id=? AND used_at IS NULL', at, accountId);
    this.run("INSERT INTO invitations(hash,account_id,purpose,expires_at) VALUES(?,?,'activate',?)", tokenHash(secret), accountId, expiresAt);
    return { invitationToken: secret, expiresAt };
  }
  syncPendingBootstrap(login, secret) {
    login = normalizeLogin(login);
    return this.transaction(() => {
      const account = this.row("SELECT * FROM accounts WHERE role='teacher'");
      if (account?.password_hash) return 'active';
      requireValue(account && account.login === login, 'LEARNING_BOOTSTRAP_LOGIN_MISMATCH', 409);
      requireValue(typeof secret === 'string' && /^[A-Za-z0-9_-]{43,100}$/.test(secret) && new Set(secret).size >= 16, 'LEARNING_BOOTSTRAP_CONFIG_INVALID');
      const existing = this.row('SELECT * FROM invitations WHERE hash=?', tokenHash(secret));
      if (existing?.account_id === account.id && existing.purpose === 'activate' && existing.used_at == null) {
        // Restarting is not permission to extend the life of the same token.
        return existing.expires_at > this.clock() ? 'pending-unchanged' : 'pending-expired';
      }
      this.newBootstrapInvitation(account.id, secret);
      return 'pending-refreshed';
    });
  }
  createStudent(auth, body, passwordHash = null) {
    this.teacher(auth); exactKeys(body, ['name','login'], ['name','login']);
    const name = safeName(body.name), login = normalizeLogin(body.login);
    // Only a hash produced at the authenticated API boundary may reach storage.
    requireValue(passwordHash === null || (typeof passwordHash === 'string' && /^scrypt1:[a-f0-9]{32}:[a-f0-9]{64}$/.test(passwordHash)), 'LEARNING_PASSWORD_INVALID');
    return this.transaction(() => {
      this.limit('accounts', 2000); requireValue(!this.accountByLogin(login), 'LEARNING_LOGIN_EXISTS', 409);
      const id = token(18);
      this.run("INSERT INTO accounts(id,role,teacher_id,login,name,password_hash,created_at) VALUES(?,'student',?,?,?,?,?)", id, auth.id, login, name, passwordHash, this.clock());
      return { student: accountDTO(this.account(id)), ...(passwordHash === null ? this.newInvitation(id, 'activate', 7 * DAY) : {}) };
    });
  }
  students(auth) { this.teacher(auth); return this.rows("SELECT * FROM accounts WHERE teacher_id=? AND role='student' ORDER BY created_at,id", auth.id)
    .map(row => { const quickAccess = this.quickAccessStatus(row); return { ...accountDTO(row),
      active: !!row.password_hash || quickAccess.active, passwordReady: !!row.password_hash,
      quickAccess, invitationExpiresAt: this.row('SELECT expires_at FROM invitations WHERE account_id=? AND used_at IS NULL', row.id)?.expires_at ?? null,
      profile: this.studentProfile(auth, row.id) }; }); }
  quickAccessStatus(account) {
    const grant = this.row('SELECT * FROM learning_quick_access WHERE account_id=?', account.id);
    return { active: account.role === 'student' && !!grant?.hash && grant.epoch === account.auth_epoch && grant.expires_at > this.clock(),
      expiresAt: grant?.expires_at ?? null, version: grant?.version ?? 0 };
  }
  studentQuickAccess(auth, id) { return this.quickAccessStatus(this.ownsStudent(auth, id)); }
  writeStudentQuickAccess(sessionToken, id, body, revoke = false) {
    exactKeys(body, ['expectedVersion'], ['expectedVersion']);
    requireValue(Number.isSafeInteger(body.expectedVersion) && body.expectedVersion >= 0 && body.expectedVersion < Number.MAX_SAFE_INTEGER, 'LEARNING_QUICK_INVALID');
    return this.transaction(() => {
      // No asynchronous gap: revalidate the teacher and pupil ownership inside
      // the same transaction that fences this key's version and account epoch.
      const auth = this.session(sessionToken), account = this.ownsStudent(auth, id), current = this.quickAccessStatus(account);
      requireValue(current.version === body.expectedVersion, 'LEARNING_QUICK_CONFLICT', 409);
      const secret = revoke ? null : token(32), at = this.clock(), expiresAt = revoke ? null : at + 30 * DAY;
      this.run('DELETE FROM sessions WHERE account_id=? AND hash IN (SELECT session_hash FROM learning_quick_sessions)', id);
      this.run(`INSERT INTO learning_quick_access(account_id,hash,epoch,expires_at,version,updated_at) VALUES(?,?,?,?,?,?)
        ON CONFLICT(account_id) DO UPDATE SET hash=excluded.hash,epoch=excluded.epoch,expires_at=excluded.expires_at,
          version=excluded.version,updated_at=excluded.updated_at`, id, secret ? tokenHash(secret) : null, account.auth_epoch, expiresAt, current.version + 1, at);
      // Never use operation(): its receipts would persist the raw bearer token.
      return { quickAccess: { active: !revoke, expiresAt, version: current.version + 1 }, ...(secret ? { quickToken: secret } : {}) };
    });
  }
  invalidateStudentQuickAccess(accountId) {
    const account = this.account(accountId);
    if (account?.role !== 'student') return;
    const current = this.quickAccessStatus(account);
    requireValue(current.version < Number.MAX_SAFE_INTEGER, 'LEARNING_QUICK_INVALID');
    // Keep a tombstone even when no QR has been issued. A password change must
    // fence an earlier teacher screen that still expects the previous version.
    this.run(`INSERT INTO learning_quick_access(account_id,hash,epoch,expires_at,version,updated_at) VALUES(?,NULL,?,NULL,?,?)
      ON CONFLICT(account_id) DO UPDATE SET hash=NULL,epoch=excluded.epoch,expires_at=NULL,
        version=excluded.version,updated_at=excluded.updated_at`, account.id, account.auth_epoch, current.version + 1, this.clock());
  }
  quickLogin(secret) {
    requireValue(typeof secret === 'string' && QUICK_TOKEN_RE.test(secret), 'LEARNING_ACCESS_INVALID', 401);
    return this.transaction(() => {
      const hash = tokenHash(secret), grant = this.row('SELECT * FROM learning_quick_access WHERE hash=?', hash);
      const account = grant && this.account(grant.account_id);
      requireValue(account?.role === 'student' && grant.epoch === account.auth_epoch && grant.expires_at > this.clock(), 'LEARNING_ACCESS_INVALID', 401);
      return this.createSession(account.id, grant);
    });
  }
  studentProfile(auth, learnerId) {
    if (auth?.role === 'teacher') this.ownsStudent(auth, learnerId);
    else {
      requireValue(auth?.role === 'student', 'LEARNING_FORBIDDEN', 403);
      requireValue(learnerId === auth.id && this.account(learnerId)?.role === 'student', 'LEARNING_NOT_FOUND', 404);
    }
    const row = this.row('SELECT course,goal,focus,version,updated_at FROM learning_profiles WHERE learner_id=?', learnerId);
    // Existing pupils retain their school route until the teacher explicitly
    // selects another course. Reading a default must not write a profile.
    return row ? { course: row.course, goal: row.goal, focus: row.focus, version: row.version, updatedAt: row.updated_at }
      : { course: 'school', goal: null, focus: '', version: 0, updatedAt: null };
  }
  saveStudentProfile(auth, learnerId, body) {
    this.ownsStudent(auth, learnerId);
    exactKeys(body, ['opId','expectedVersion','course','goal','focus'], ['opId','expectedVersion','course','goal','focus']);
    requireValue(Number.isSafeInteger(body.expectedVersion) && body.expectedVersion >= 0, 'LEARNING_PROFILE_INVALID');
    requireValue(['school','foundations','oge','ege','ege-profile'].includes(body.course), 'LEARNING_PROFILE_INVALID');
    requireValue((body.goal === null || ['pass','grade5'].includes(body.goal)) && (body.course === 'oge' || body.goal === null), 'LEARNING_PROFILE_INVALID');
    requireValue(typeof body.focus === 'string' && body.focus.length <= 1200
      && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(body.focus), 'LEARNING_PROFILE_INVALID');
    const focus = body.focus.trim();
    return this.operation(auth, { ...body, focus, operation: 'save-profile', learnerId }, () => {
      const current = this.studentProfile(auth, learnerId);
      requireValue(current.version === body.expectedVersion, 'LEARNING_PROFILE_CONFLICT', 409);
      const version = current.version + 1, at = this.clock();
      this.run(`INSERT INTO learning_profiles(learner_id,teacher_id,course,goal,focus,version,updated_at) VALUES(?,?,?,?,?,?,?)
        ON CONFLICT(learner_id) DO UPDATE SET course=excluded.course,goal=excluded.goal,focus=excluded.focus,version=excluded.version,updated_at=excluded.updated_at`,
      learnerId, auth.id, body.course, body.goal, focus, version, at);
      return { profile: { course: body.course, goal: body.goal, focus, version, updatedAt: at } };
    });
  }
  recoverStudent(auth, id) { return this.transaction(() => { this.ownsStudent(auth, id); return this.newInvitation(id, 'recovery', 7 * DAY); }); }
  replaceStudentPassword(sessionToken, id, passwordHash, expectedHash, expectedEpoch) {
    requireValue(typeof passwordHash === 'string' && /^scrypt1:[a-f0-9]{32}:[a-f0-9]{64}$/.test(passwordHash), 'LEARNING_PASSWORD_INVALID');
    return this.transaction(() => {
      // Hashing awaited outside the transaction. Recheck the teacher's session,
      // ownership and pupil credentials before changing this existing account.
      const auth = this.session(sessionToken), student = this.ownsStudent(auth, id);
      requireValue(student.password_hash === expectedHash && student.auth_epoch === expectedEpoch, 'LEARNING_CREDENTIALS_CHANGED', 409);
      this.run('UPDATE accounts SET password_hash=?,auth_epoch=auth_epoch+1 WHERE id=?', passwordHash, id);
      this.invalidateStudentQuickAccess(id);
      this.run('DELETE FROM sessions WHERE account_id=?', id);
      this.run('DELETE FROM invitations WHERE account_id=?', id);
      return { student: accountDTO(this.account(id)) };
    });
  }
  invitation(secret, purposes = ['activate', 'recovery']) {
    requireValue(TOKEN_RE.test(secret || ''), 'LEARNING_ACCESS_INVALID', 401);
    const invitation = this.row('SELECT * FROM invitations WHERE hash=?', tokenHash(secret));
    requireValue(invitation && purposes.includes(invitation.purpose) && invitation.used_at == null && invitation.expires_at > this.clock(), 'LEARNING_ACCESS_INVALID', 401);
    return invitation;
  }
  // Called only by the private operator command. The synchronous publisher lets
  // a failed private-file write roll back issuance without revoking an old link.
  issueTeacherRecovery(login, publish = null) {
    login = normalizeLogin(login);
    return this.transaction(() => {
      const account = this.accountByLogin(login);
      requireValue(account?.role === 'teacher' && account.password_hash, 'LEARNING_TEACHER_RECOVERY_UNAVAILABLE', 409);
      const result = { account: accountDTO(account), ...this.newInvitation(account.id, 'teacher-recovery', 60 * 60 * 1000) };
      if (publish) publish(result);
      return result;
    });
  }
  teacherRecovery(secret) {
    const invitation = this.invitation(secret, ['teacher-recovery']), account = this.account(invitation.account_id);
    requireValue(account?.role === 'teacher' && account.password_hash, 'LEARNING_ACCESS_INVALID', 401);
    return { invitation, account };
  }
  replaceTeacherPassword(sessionToken, passwordHash, expectedHash, expectedEpoch) {
    requireValue(typeof passwordHash === 'string' && /^scrypt1:[a-f0-9]{32}:[a-f0-9]{64}$/.test(passwordHash), 'LEARNING_PASSWORD_INVALID');
    return this.transaction(() => {
      // Hashing happens outside this transaction. The original session and
      // credential snapshot must both still be current when the change commits.
      const auth = this.session(sessionToken); this.teacher(auth);
      const account = this.account(auth.id);
      requireValue(account.password_hash === expectedHash && account.auth_epoch === expectedEpoch, 'LEARNING_ACCESS_INVALID', 401);
      const current = tokenHash(sessionToken), epoch = account.auth_epoch + 1;
      this.run('UPDATE accounts SET password_hash=?,auth_epoch=? WHERE id=?', passwordHash, epoch, account.id);
      this.run('DELETE FROM sessions WHERE account_id=? AND hash<>?', account.id, current);
      this.run('UPDATE sessions SET epoch=? WHERE account_id=? AND hash=?', epoch, account.id, current);
      this.run('DELETE FROM recovery_codes WHERE account_id=?', account.id);
      this.run('DELETE FROM invitations WHERE account_id=?', account.id);
      // Do not renew the surviving session or rotate its token. A lost response
      // therefore leaves the teacher signed in and able to retry deliberately.
      return { ok: true, account: accountDTO(this.account(account.id)) };
    });
  }
  recoverTeacherPassword(secret, passwordHash, expectedHash, expectedEpoch) {
    requireValue(typeof passwordHash === 'string' && /^scrypt1:[a-f0-9]{32}:[a-f0-9]{64}$/.test(passwordHash), 'LEARNING_PASSWORD_INVALID');
    return this.transaction(() => {
      const { account } = this.teacherRecovery(secret);
      requireValue(account.password_hash === expectedHash && account.auth_epoch === expectedEpoch, 'LEARNING_ACCESS_INVALID', 401);
      this.run('UPDATE accounts SET password_hash=?,auth_epoch=auth_epoch+1 WHERE id=?', passwordHash, account.id);
      this.run('DELETE FROM sessions WHERE account_id=?', account.id);
      this.run('DELETE FROM recovery_codes WHERE account_id=?', account.id);
      this.run('DELETE FROM invitations WHERE account_id=?', account.id);
      return this.createSession(account.id);
    });
  }
  createSession(accountId, quickGrant = null) {
    const account = this.account(accountId), secret = token();
    let expiresAt = this.clock() + 30 * DAY;
    if (quickGrant !== null) {
      const current = this.row('SELECT * FROM learning_quick_access WHERE account_id=?', accountId);
      requireValue(account?.role === 'student' && current?.hash && current.hash === quickGrant.hash
        && current.epoch === account.auth_epoch && current.expires_at > this.clock(), 'LEARNING_ACCESS_INVALID', 401);
      expiresAt = Math.min(expiresAt, current.expires_at);
    }
    this.run('DELETE FROM sessions WHERE expires_at<=?', this.clock());
    const sessions = this.rows('SELECT hash FROM sessions WHERE account_id=? ORDER BY expires_at DESC', accountId);
    for (const old of sessions.slice(9)) this.run('DELETE FROM sessions WHERE hash=?', old.hash);
    this.run('INSERT INTO sessions(hash,account_id,epoch,expires_at) VALUES(?,?,?,?)', tokenHash(secret), accountId, account.auth_epoch, expiresAt);
    if (quickGrant !== null) this.run('INSERT INTO learning_quick_sessions(session_hash,quick_hash) VALUES(?,?)', tokenHash(secret), quickGrant.hash);
    return { account: { ...accountDTO(account), ...(quickGrant !== null ? { active: true, passwordReady: !!account.password_hash } : {}) }, sessionToken: secret, expiresAt };
  }
  activate(secret, passwordHash) {
    requireValue(/^scrypt1:[a-f0-9]{32}:[a-f0-9]{64}$/.test(passwordHash), 'LEARNING_PASSWORD_INVALID');
    return this.transaction(() => {
      const invitation = this.invitation(secret), account = this.account(invitation.account_id);
      requireValue(invitation.purpose === 'recovery' || !account.password_hash, 'LEARNING_ACCESS_INVALID', 401);
      this.run('UPDATE invitations SET used_at=? WHERE hash=?', this.clock(), invitation.hash);
      this.run('UPDATE accounts SET password_hash=?,auth_epoch=auth_epoch+1 WHERE id=?', passwordHash, account.id);
      this.invalidateStudentQuickAccess(account.id);
      this.run('DELETE FROM sessions WHERE account_id=?', account.id);
      let recoveryCodes;
      if (account.role === 'teacher' && invitation.purpose === 'activate') {
        recoveryCodes = Array.from({ length: 8 }, () => token(18));
        for (const code of recoveryCodes) this.run('INSERT INTO recovery_codes(hash,account_id) VALUES(?,?)', tokenHash(code), account.id);
      }
      return { ...this.createSession(account.id), ...(recoveryCodes ? { recoveryCodes } : {}) };
    });
  }
  recovery(login, code) {
    const account = this.accountByLogin(login), record = TOKEN_RE.test(code || '') ? this.row('SELECT * FROM recovery_codes WHERE hash=?', tokenHash(code)) : null;
    requireValue(account?.role === 'teacher' && record?.account_id === account.id && record.used_at == null, 'LEARNING_ACCESS_INVALID', 401);
    return { account, record };
  }
  recoverTeacher(login, code, passwordHash) {
    return this.transaction(() => {
      const { account, record } = this.recovery(login, code);
      requireValue(/^scrypt1:[a-f0-9]{32}:[a-f0-9]{64}$/.test(passwordHash), 'LEARNING_PASSWORD_INVALID');
      this.run('UPDATE recovery_codes SET used_at=? WHERE hash=?', this.clock(), record.hash);
      this.run('UPDATE accounts SET password_hash=?,auth_epoch=auth_epoch+1 WHERE id=?', passwordHash, account.id);
      this.run('DELETE FROM sessions WHERE account_id=?', account.id);
      this.run('DELETE FROM invitations WHERE account_id=?', account.id);
      return this.createSession(account.id);
    });
  }
  rotateTeacherRecoveryCodes(sessionToken, expectedHash, expectedEpoch) {
    return this.transaction(() => {
      // Password verification happened asynchronously at the API boundary.
      // Recheck both the session and the verified credential snapshot before
      // replacing codes, including logout/recovery while verification awaited.
      const auth = this.session(sessionToken);
      this.teacher(auth);
      const account = this.account(auth.id);
      requireValue(account && account.password_hash === expectedHash && account.auth_epoch === expectedEpoch, 'LEARNING_ACCESS_INVALID', 401);
      const recoveryCodes = Array.from({ length: 8 }, () => token(18));
      this.run('DELETE FROM recovery_codes WHERE account_id=?', account.id);
      for (const code of recoveryCodes) this.run('INSERT INTO recovery_codes(hash,account_id) VALUES(?,?)', tokenHash(code), account.id);
      // Issuing backup codes is not a password reset: keep the password and
      // existing sessions. Using a code via recoverTeacher still revokes them.
      return { recoveryCodes };
    });
  }
  session(secret) {
    requireValue(TOKEN_RE.test(secret || ''), 'LEARNING_UNAUTHORIZED', 401);
    const row = this.row(`SELECT a.*,s.expires_at AS session_expires,s.epoch AS session_epoch,q.quick_hash
      FROM sessions s JOIN accounts a ON a.id=s.account_id LEFT JOIN learning_quick_sessions q ON q.session_hash=s.hash WHERE s.hash=?`, tokenHash(secret));
    requireValue(row && row.session_expires > this.clock() && row.session_epoch === row.auth_epoch, 'LEARNING_UNAUTHORIZED', 401);
    if (row.quick_hash !== null) {
      const grant = this.row('SELECT * FROM learning_quick_access WHERE account_id=? AND hash=?', row.id, row.quick_hash);
      requireValue(row.role === 'student' && grant && grant.epoch === row.auth_epoch && grant.expires_at > this.clock(), 'LEARNING_UNAUTHORIZED', 401);
      return { ...accountDTO(row), active: true, passwordReady: !!row.password_hash };
    }
    requireValue(row.password_hash, 'LEARNING_UNAUTHORIZED', 401);
    return accountDTO(row);
  }
  logout(secret) { if (TOKEN_RE.test(secret || '')) this.run('DELETE FROM sessions WHERE hash=?', tokenHash(secret)); }
  loginSession(accountId, expectedHash, expectedEpoch) {
    return this.transaction(() => { const row = this.account(accountId);
      requireValue(row && row.password_hash === expectedHash && row.auth_epoch === expectedEpoch, 'LEARNING_ACCESS_INVALID', 401);
      return this.createSession(accountId); });
  }
  operation(auth, body, callback) {
    requireValue(ID.test(body.opId || ''), 'LEARNING_OP_INVALID');
    const fingerprint = tokenHash(canonical(body));
    return this.transaction(() => {
      const old = this.row('SELECT * FROM operations WHERE actor_id=? AND op_id=?', auth.id, body.opId);
      if (old) { requireValue(old.fingerprint === fingerprint, 'LEARNING_OP_CONFLICT', 409); return { ...parse(old.result_json), duplicate: true }; }
      this.limit('operations', 100000);
      const result = callback();
      this.run('INSERT INTO operations VALUES(?,?,?,?)', auth.id, body.opId, fingerprint, json(result));
      return { ...result, duplicate: false };
    });
  }
  attemptDTO(row) {
    const taskSpec = parse(row.task_json);
    return { id: row.id, learnerId: row.learner_id, teacherId: row.teacher_id, trainerId: row.trainer_id,
      contentId: taskSpec?.contentId || null, taskSpec, state: parse(row.state_json), strokes: parse(row.strokes_json), version: row.version, trainerVersion: row.trainer_version,
      controller: row.controller, assistance: parse(row.assistance_json), outcome: row.outcome, sourceAttemptId: row.source_attempt_id,
      submission: this.submissionForAttempt?.(row) || null,
      archivedAt: row.archived_at, createdAt: row.created_at, updatedAt: row.updated_at };
  }
  attemptSummary(row) {
    return { id: row.id, learnerId: row.learner_id, teacherId: row.teacher_id, trainerId: row.trainer_id,
      contentId: parse(row.task_json)?.contentId || null, version: row.version, trainerVersion: row.trainer_version,
      controller: row.controller, assistance: parse(row.assistance_json), outcome: row.outcome, sourceAttemptId: row.source_attempt_id,
      submission: this.submissionForAttempt?.(row) || null,
      archivedAt: row.archived_at, createdAt: row.created_at, updatedAt: row.updated_at };
  }
  attemptRow(auth, id) {
    requireValue(ID.test(id || ''), 'LEARNING_NOT_FOUND', 404);
    const row = this.row('SELECT * FROM attempts WHERE id=?', id);
    requireValue(row && (auth.role === 'teacher' ? row.teacher_id === auth.id : row.learner_id === auth.id), 'LEARNING_NOT_FOUND', 404);
    if (auth.role === 'student' && this.runGuard) requireValue(!this.runGuard(id), 'LEARNING_RUN_ACTIVE', 409);
    if (auth.role === 'student') requireValue(!this.row("SELECT id FROM assignments WHERE attempt_id=? AND status!='published'", id), 'LEARNING_NOT_FOUND', 404);
    return row;
  }
  getAttempt(auth, id) { return this.attemptDTO(this.attemptRow(auth, id)); }
  progress(auth) {
    requireValue(auth?.role === 'student', 'LEARNING_FORBIDDEN', 403);
    this.ready();
    // The recent-work list is deliberately limited to 200 attempts. A course
    // map must retain older achievements, so aggregate every visible current
    // attempt while returning only one small, answer-free row per content ID.
    // The run guard is installed only after both exam tables exist. Keep an
    // active exam's attempts behind its own interface until it is finished.
    const runFilter = this.runGuard ? `AND id NOT IN (SELECT a.attempt_id FROM learning_run_attempts a
      JOIN learning_runs r ON r.id=a.run_id WHERE r.finished_at IS NULL)` : '';
    const rows = this.db.prepare(`SELECT id,trainer_id,json_extract(task_json,'$.contentId') AS content_id,outcome,updated_at,created_at
      FROM attempts WHERE learner_id=? AND archived_at IS NULL AND trainer_id IN ('ege-path','oge-basics')
        AND id NOT IN (SELECT attempt_id FROM assignments WHERE status!='published')
        ${runFilter}
      ORDER BY updated_at DESC,id DESC`).iterate(auth.id);
    const completed = new Set(['independent','repeated','hinted','together','practiced']), grouped = new Map();
    for (const row of rows) {
      if (typeof row.content_id !== 'string' || !row.content_id) continue;
      const key = json([row.trainer_id, row.content_id]);
      if (!grouped.has(key)) grouped.set(key, { trainerId: row.trainer_id, contentId: row.content_id, completed: false,
        latest: { id: row.id, trainerId: row.trainer_id, contentId: row.content_id, outcome: row.outcome, updatedAt: row.updated_at, createdAt: row.created_at } });
      if (completed.has(row.outcome)) grouped.get(key).completed = true;
    }
    return [...grouped.values()];
  }
  listAttempts(auth) {
    const column = auth.role === 'teacher' ? 'teacher_id' : 'learner_id';
    return this.rows(`SELECT id,learner_id,teacher_id,trainer_id,task_json,version,trainer_version,controller,assistance_json,outcome,source_attempt_id,archived_at,created_at,updated_at FROM attempts WHERE ${column}=? AND archived_at IS NULL ${auth.role === 'student' ? "AND NOT EXISTS(SELECT 1 FROM assignments a WHERE a.attempt_id=attempts.id AND a.status!='published')" : ''} ORDER BY updated_at DESC,id LIMIT 200`, auth.id)
      .filter(row => auth.role === 'teacher' || !this.runGuard?.(row.id)).map(row => this.attemptSummary(row));
  }
  newAttempt(learnerId, teacherId, trainerId, generated, sourceAttemptId = null) {
    this.limit('attempts', 20000);
    requireValue(Buffer.byteLength(json(generated)) <= 128 * 1024, 'LEARNING_STATE_TOO_LARGE');
    const id = token(18), at = this.clock();
    this.run(`INSERT INTO attempts(id,learner_id,teacher_id,trainer_id,task_json,initial_state_json,state_json,strokes_json,assistance_json,source_attempt_id,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,'[]',?,?,?,?)`, id, learnerId, teacherId, trainerId, json(generated.taskSpec), json(generated.state), json(generated.state), json({ teacher: false, hints: false }), sourceAttemptId, at, at);
    if (learnerId === teacherId) this.run("UPDATE attempts SET controller='teacher' WHERE id=?", id);
    return this.attemptDTO(this.row('SELECT * FROM attempts WHERE id=?', id));
  }
  taskFingerprint(taskSpec) {
    if (typeof this.contracts.questionIdentity === 'function') return this.contracts.questionIdentity(taskSpec);
    const task = clone(taskSpec?.task ?? null);
    if (task && typeof task === 'object') { delete task.seed; delete task.id; }
    return tokenHash(canonical(task));
  }
  grade7Exposure(learnerId, trainerId, taskSpec, excludeAttemptId = '') {
    // Pinned, server-generated grade-7 tasks only: leave legacy assessment alone.
    if (trainerId !== 'ege-path' || taskSpec?.task?.grade7 !== true) return null;
    // Reset clears current progress, not knowledge of an already shown question.
    // Archived homework has lost its former publication status, so conservatively
    // retain it; an unpublished current draft is not learner exposure.
    const previous = this.rows(`SELECT task_json FROM attempts
      WHERE learner_id=? AND trainer_id=? AND json_extract(task_json,'$.contentId')=? AND id!=?
        AND NOT EXISTS(SELECT 1 FROM assignments a WHERE a.attempt_id=attempts.id AND a.status='draft')
      ORDER BY created_at,id LIMIT 501`, learnerId, trainerId, taskSpec.contentId, excludeAttemptId);
    return { fingerprints: new Set(previous.slice(0, 500).map(row => this.taskFingerprint(parse(row.task_json)))),
      truncated: previous.length > 500 };
  }
  createAttempt(auth, body) {
    requireValue(auth.role === 'student', 'LEARNING_FORBIDDEN', 403);
    exactKeys(body, ['opId','trainerId','contentId','fresh','sourceAttemptId','lessonId'], ['opId','trainerId','contentId']);
    requireValue(body.fresh === undefined || typeof body.fresh === 'boolean');
    return this.operation(auth, { operation: 'create-attempt', ...body }, () => {
      const source = body.sourceAttemptId ? this.attemptRow(auth, body.sourceAttemptId) : null;
      if (source) requireValue(source.archived_at == null && source.trainer_id === body.trainerId && parse(source.task_json).contentId === body.contentId, 'LEARNING_SOURCE_INVALID');
      let lesson, seats;
      if (body.lessonId !== undefined) {
        requireValue(body.fresh === true && source, 'LEARNING_LESSON_CONTEXT_INVALID');
        requireValue(source.controller === 'student', 'LEARNING_CONTROL_REQUIRED', 409);
        lesson = this.lessonRow(auth, body.lessonId); seats = parse(lesson.seats_json);
        requireValue(seats.some(seat => seat.learnerId === auth.id && seat.attemptId === source.id), 'LEARNING_LESSON_CONTEXT_INVALID', 409);
      }
      if (!body.fresh) {
        const existing = this.rows("SELECT * FROM attempts WHERE learner_id=? AND trainer_id=? AND outcome IN ('started') AND archived_at IS NULL AND NOT EXISTS(SELECT 1 FROM assignments a WHERE a.attempt_id=attempts.id AND a.status!='published') ORDER BY updated_at DESC", auth.id, body.trainerId)
          .find(row => parse(row.task_json).contentId === body.contentId && !this.runGuard?.(row.id));
        if (existing) return { attempt: this.attemptDTO(existing) };
      }
      let generated = this.contracts.create(body.trainerId, body.contentId);
      const exposure = this.grade7Exposure(auth.id, body.trainerId, generated.taskSpec);
      if (exposure) {
        for (let tries = 0; tries < 15 && (exposure.truncated || exposure.fingerprints.has(this.taskFingerprint(generated.taskSpec))); tries++) {
          generated = this.contracts.create(body.trainerId, body.contentId);
        }
      } else if (source && body.fresh) {
        const sourceFingerprint = this.taskFingerprint(parse(source.task_json));
        for (let tries = 0; tries < 15 && this.taskFingerprint(generated.taskSpec) === sourceFingerprint; tries++) generated = this.contracts.create(body.trainerId, body.contentId);
      }
      const attempt = this.newAttempt(auth.id, auth.teacherId, body.trainerId, generated, source?.id || null);
      if (lesson) {
        seats.find(seat => seat.learnerId === auth.id).attemptId = attempt.id;
        this.run('UPDATE lessons SET seats_json=?,version=version+1 WHERE id=?', json(seats), lesson.id);
      }
      return { attempt };
    });
  }
  listAssignments(auth) {
    const column = auth.role === 'teacher' ? 'teacher_id' : 'learner_id';
    return this.rows(`SELECT * FROM assignments WHERE ${column}=? ${auth.role === 'student' ? "AND status='published'" : ''} ORDER BY created_at DESC,id LIMIT 500`, auth.id).map(row => ({ id: row.id, title: row.title,
      learnerId: row.learner_id, attemptId: row.attempt_id, dueAt: row.due_at, status: row.status, batchId: row.batch_id, createdAt: row.created_at,
      paperReady: this.paperReadyForAssignment?.(row.id) || false,
      attempt: this.attemptSummary(this.attemptRow(auth, row.attempt_id)) }));
  }
  createAssignments(auth, body) {
    this.teacher(auth); exactKeys(body, ['opId','learnerIds','title','trainerId','contentId','dueAt'], ['opId','learnerIds','title','trainerId','contentId']);
    const title = safeName(body.title, 160);
    requireValue(Array.isArray(body.learnerIds) && body.learnerIds.length >= 1 && body.learnerIds.length <= 100 && new Set(body.learnerIds).size === body.learnerIds.length);
    requireValue(body.dueAt == null || (typeof body.dueAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.dueAt) && Number.isFinite(Date.parse(body.dueAt))), 'LEARNING_DATE_INVALID');
    return this.operation(auth, { operation: 'create-assignments', ...body }, () => {
      body.learnerIds.forEach(id => this.ownsStudent(auth, id));
      const generated = this.contracts.create(body.trainerId, body.contentId);
      const batchId = token(18);
      const assignments = body.learnerIds.map(id => {
        this.limit('assignments', 20000);
        const attempt = this.newAttempt(id, auth.id, body.trainerId, generated), assignmentId = token(18), createdAt = this.clock();
        this.run('INSERT INTO assignments(id,title,learner_id,teacher_id,attempt_id,due_at,batch_id,created_at) VALUES(?,?,?,?,?,?,?,?)', assignmentId, title, id, auth.id, attempt.id, body.dueAt || null, batchId, createdAt);
        return { id: assignmentId, title, learnerId: id, attemptId: attempt.id, dueAt: body.dueAt || null, status: 'draft', batchId, createdAt, attempt };
      });
      return { assignments };
    });
  }
  action(auth, id, body) {
    exactKeys(body, ['opId','expectedVersion','expectedTrainerVersion','type','payload'], ['opId','expectedVersion','type','payload']);
    requireValue(ID.test(body.opId || '') && Number.isSafeInteger(body.expectedVersion) && body.expectedVersion >= 0);
    requireValue(body.expectedTrainerVersion === undefined || (Number.isSafeInteger(body.expectedTrainerVersion) && body.expectedTrainerVersion >= 0));
    requireValue(Buffer.byteLength(json(body)) <= 96 * 1024, 'LEARNING_STATE_TOO_LARGE');
    const fingerprint = tokenHash(canonical({ attemptId: id, ...body }));
    return this.transaction(() => {
      const row = this.attemptRow(auth, id), attempt = this.attemptDTO(row);
      requireValue(!this.runGuard?.(id), 'LEARNING_RUN_ACTIVE', 409);
      requireValue(row.archived_at == null, 'LEARNING_ATTEMPT_ARCHIVED', 409);
      const previous = this.row('SELECT * FROM events WHERE actor_id=? AND op_id=?', auth.id, body.opId);
      if (previous) { requireValue(previous.fingerprint === fingerprint, 'LEARNING_OP_CONFLICT', 409); return { attempt, duplicate: true }; }
      const commutative = ['stroke','erase','reference'].includes(body.type) || (body.type === 'undo' && !!body.payload?.strokeId);
      const semantic = ['state','check','hint','control'].includes(body.type);
      requireValue(commutative ? body.expectedVersion <= row.version
        : !semantic || body.expectedTrainerVersion === undefined ? body.expectedVersion === row.version
          : body.expectedVersion <= row.version && body.expectedTrainerVersion === row.trainer_version, 'LEARNING_STATE_CONFLICT', 409);
      this.limit('events', 500000);
      requireValue(this.row('SELECT COUNT(*) AS n FROM events WHERE attempt_id=?', id).n < 20000, 'LEARNING_LIMIT_EXCEEDED', 507);
      const { type, payload } = body;
      requireValue(['state','check','hint','reference','stroke','erase','undo','control'].includes(type));
      let evaluation;
      if (['state','check','hint'].includes(type)) requireValue(attempt.controller === auth.role, 'LEARNING_CONTROL_REQUIRED', 409);
      if (type === 'state') {
        exactKeys(payload, ['state'], ['state']);
        requireValue(Buffer.byteLength(json(payload.state)) <= 64 * 1024, 'LEARNING_STATE_TOO_LARGE');
        attempt.state = this.contracts.normalize(attempt.trainerId, attempt.taskSpec, payload.state);
        if (attempt.state?.work?.help === true || (typeof this.contracts.assistance === 'function'
          && this.contracts.assistance(attempt.trainerId, attempt.taskSpec, attempt.state))) attempt.assistance.hints = true;
      } else if (type === 'check') {
        exactKeys(payload, ['state','details'], ['state','details']);
        requireValue(Buffer.byteLength(json(payload.state)) <= 64 * 1024, 'LEARNING_STATE_TOO_LARGE');
        attempt.state = this.contracts.normalize(attempt.trainerId, attempt.taskSpec, payload.state);
        if (attempt.state?.work?.help === true || (typeof this.contracts.assistance === 'function'
          && this.contracts.assistance(attempt.trainerId, attempt.taskSpec, attempt.state))) attempt.assistance.hints = true;
        evaluation = this.contracts.evaluate(attempt.trainerId, attempt.taskSpec, payload.details);
        requireValue(typeof evaluation?.correct === 'boolean' && typeof evaluation?.complete === 'boolean', 'LEARNING_EVALUATION_INVALID');
        if (evaluation.assisted === true) attempt.assistance.hints = true;
        if (evaluation.correct && evaluation.complete && row.outcome === 'started') attempt.outcome = 'independent';
      } else if (type === 'hint') {
        exactKeys(payload, ['step','state','details']);
        if (payload.step !== undefined) requireValue(Number.isInteger(payload.step) && payload.step >= 0 && payload.step < 100);
        if (payload.state !== undefined) attempt.state = this.contracts.normalize(attempt.trainerId, attempt.taskSpec, payload.state);
        if (payload.details !== undefined) {
          exactKeys(payload.details, ['step']);
          if (payload.details.step !== undefined) requireValue(Number.isInteger(payload.details.step) && payload.details.step >= 0 && payload.details.step < 100);
        }
        attempt.assistance.hints = true;
      } else if (type === 'reference') {
        exactKeys(payload, ['id']); if (payload.id !== undefined) safeName(payload.id, 100);
      } else if (type === 'control') {
        this.teacher(auth); exactKeys(payload, ['controller'], ['controller']); requireValue(['student','teacher'].includes(payload.controller));
        requireValue(attempt.learnerId !== attempt.teacherId || payload.controller === 'teacher', 'LEARNING_CONTROL_INVALID');
        attempt.controller = payload.controller;
      } else if (type === 'stroke') {
        exactKeys(payload, ['id','points','color','width'], ['id','points','color','width']);
        requireValue(ID.test(payload.id || '') && /^#[a-f0-9]{6}$/i.test(payload.color || '') && Number.isFinite(payload.width) && payload.width >= .5 && payload.width <= 12);
        requireValue(Array.isArray(payload.points) && payload.points.length >= 1 && payload.points.length <= 2000 && attempt.strokes.length < 3000);
        payload.points.forEach(point => { exactKeys(point, ['x','y'], ['x','y']); requireValue(Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1); });
        requireValue(!attempt.strokes.some(stroke => stroke.id === payload.id), 'LEARNING_STROKE_EXISTS', 409);
        attempt.strokes.push({ ...clone(payload), author: auth.id, role: auth.role, at: this.clock() });
      } else {
        exactKeys(payload, ['strokeId'], type === 'erase' ? ['strokeId'] : []);
        if (payload.strokeId !== undefined) requireValue(ID.test(payload.strokeId), 'LEARNING_STROKE_INVALID');
        const stroke = payload.strokeId ? attempt.strokes.find(item => item.id === payload.strokeId) : [...attempt.strokes].reverse().find(item => item.author === auth.id);
        requireValue(stroke, 'LEARNING_STROKE_NOT_FOUND', 409); requireValue(stroke.author === auth.id, 'LEARNING_FORBIDDEN', 403);
        attempt.strokes = attempt.strokes.filter(item => item.id !== stroke.id);
      }
      if (auth.role === 'teacher' && ['state','check','hint','stroke'].includes(type)) attempt.assistance.teacher = true;
      requireValue(Buffer.byteLength(json(attempt.strokes)) <= 1024 * 1024, 'LEARNING_DRAWING_LIMIT_EXCEEDED', 507);
      if (row.outcome === 'started' && attempt.outcome !== 'started') {
        attempt.outcome = attempt.assistance.teacher ? 'together' : attempt.assistance.hints ? 'hinted' : 'independent';
        if (attempt.outcome === 'independent') {
          // Recheck inside the grading transaction: another attempt may have
          // exposed this same question after the current attempt was created.
          const exposure = this.grade7Exposure(attempt.learnerId, attempt.trainerId, attempt.taskSpec, attempt.id);
          if (exposure && (exposure.truncated || exposure.fingerprints.has(this.taskFingerprint(attempt.taskSpec)))) attempt.outcome = 'practiced';
        }
        if (attempt.outcome === 'independent' && attempt.sourceAttemptId) {
          const prior = this.row('SELECT outcome,task_json FROM attempts WHERE id=? AND learner_id=?', attempt.sourceAttemptId, attempt.learnerId);
          if (prior) {
            const sameQuestion = this.taskFingerprint(parse(prior.task_json)) === this.taskFingerprint(attempt.taskSpec);
            if (sameQuestion) attempt.outcome = 'practiced';
            else if (prior.outcome !== 'started') attempt.outcome = 'repeated';
          }
        }
      }
      attempt.version++; if (semantic) attempt.trainerVersion++; attempt.updatedAt = this.clock();
      this.run('UPDATE attempts SET state_json=?,strokes_json=?,version=?,trainer_version=?,controller=?,assistance_json=?,outcome=?,updated_at=? WHERE id=?',
        json(attempt.state), json(attempt.strokes), attempt.version, attempt.trainerVersion, attempt.controller, json(attempt.assistance), attempt.outcome, attempt.updatedAt, id);
      this.run('INSERT INTO events(attempt_id,actor_id,actor_role,op_id,fingerprint,revision,type,payload_json,at) VALUES(?,?,?,?,?,?,?,?,?)',
        id, auth.id, auth.role, body.opId, fingerprint, attempt.version, type, json({ ...payload, ...(['state','check'].includes(type) || payload.state !== undefined ? { state: attempt.state } : {}),
          ...(evaluation ? { evaluation } : {}), after: { outcome: attempt.outcome, assistance: attempt.assistance, controller: attempt.controller, trainerVersion: attempt.trainerVersion } }), attempt.updatedAt);
      attempt.submission = this.submissionForAttempt?.({ ...row, version: attempt.version }) || null;
      return { attempt, duplicate: false, ...(evaluation ? { evaluation } : {}) };
    });
  }
  history(auth, id, { after = 0, through, limit = 100 } = {}) {
    const attempt = this.getAttempt(auth, id); through ??= attempt.version;
    requireValue(Number.isSafeInteger(after) && after >= 0 && Number.isSafeInteger(through) && through >= after && through <= attempt.version && Number.isInteger(limit) && limit >= 1 && limit <= 100);
    const rows = this.rows('SELECT * FROM events WHERE attempt_id=? AND revision>? AND revision<=? ORDER BY revision LIMIT ?', id, after, through, limit + 1);
    const events = rows.slice(0, limit).map(row => ({ revision: row.revision, at: row.at, actor: { id: row.actor_id, role: row.actor_role }, type: row.type, payload: parse(row.payload_json) }));
    const original = this.attemptRow(auth, id);
    const initialAttempt = { ...attempt, state: parse(original.initial_state_json), strokes: [], version: 0, trainerVersion: 0,
      assistance: { teacher: false, hints: false }, outcome: 'started', submission: null, controller: original.learner_id === original.teacher_id ? 'teacher' : 'student' };
    return { initialAttempt, events, nextAfter: events.at(-1)?.revision || after, hasMore: rows.length > limit, version: through };
  }
  lessonRow(auth, id) {
    requireValue(ID.test(id || ''), 'LEARNING_NOT_FOUND', 404);
    const row = this.row('SELECT * FROM lessons WHERE id=?', id);
    requireValue(row && (auth.role === 'teacher' ? row.teacher_id === auth.id : parse(row.seats_json).some(seat => seat.learnerId === auth.id)), 'LEARNING_NOT_FOUND', 404);
    return row;
  }
  lessonDTO(auth, row) {
    const seats = parse(row.seats_json);
    const visibleAttempt = id => {
      const attempt = id && this.row('SELECT * FROM attempts WHERE id=? AND archived_at IS NULL', id);
      // An unpublished homework draft is never leaked through a lesson/presentation.
      if (!attempt || (auth.role !== 'teacher' && (this.runGuard?.(id) || this.row("SELECT id FROM assignments WHERE attempt_id=? AND status!='published'", id)))) return null;
      return this.attemptDTO(attempt);
    };
    const common = visibleAttempt(row.common_attempt_id);
    const ownSeats = seats.filter(seat => auth.role === 'teacher' || seat.learnerId === auth.id).map(seat => ({ ...seat,
      name: this.account(seat.learnerId).name, attempt: visibleAttempt(seat.attemptId) }));
    let presentation = { target: null };
    if (row.presentation_target) {
      const seat = seats.find(item => item.learnerId === row.presentation_target);
      const attempt = row.presentation_target === 'common' ? common : visibleAttempt(seat?.attemptId);
      if (attempt) presentation = { target: row.presentation_target, name: row.presentation_target === 'common' ? 'Общая доска' : this.account(seat.learnerId).name, attempt };
    }
    return { id: row.id, title: row.title, version: row.version, seats: ownSeats, commonAttemptId: row.common_attempt_id,
      common, presentation, createdAt: row.created_at };
  }
  getLesson(auth, id) { return this.lessonDTO(auth, this.lessonRow(auth, id)); }
  listLessons(auth) {
    const rows = this.rows('SELECT * FROM lessons WHERE teacher_id=? ORDER BY created_at DESC,id LIMIT 100', auth.role === 'teacher' ? auth.id : auth.teacherId);
    return rows.filter(row => auth.role === 'teacher' || parse(row.seats_json).some(seat => seat.learnerId === auth.id)).map(row => this.lessonDTO(auth, row));
  }
  createLesson(auth, body) {
    this.teacher(auth); exactKeys(body, ['opId','title','learnerIds'], ['opId','title','learnerIds']);
    const title = safeName(body.title, 160);
    requireValue(Array.isArray(body.learnerIds) && body.learnerIds.length >= 1 && body.learnerIds.length <= 8 && new Set(body.learnerIds).size === body.learnerIds.length);
    return this.operation(auth, { operation: 'create-lesson', ...body }, () => {
      this.limit('lessons', 2000);
      const seats = body.learnerIds.map(learnerId => {
        this.ownsStudent(auth, learnerId);
        const attempt = this.row("SELECT * FROM attempts WHERE learner_id=? AND archived_at IS NULL AND NOT EXISTS(SELECT 1 FROM assignments a WHERE a.attempt_id=attempts.id AND a.status!='published') ORDER BY updated_at DESC,id LIMIT 1", learnerId);
        return { learnerId, attemptId: attempt?.id || null };
      });
      const common = this.newAttempt(auth.id, auth.id, 'board', { taskSpec: null, state: null });
      const id = token(18);
      this.run('INSERT INTO lessons(id,teacher_id,title,seats_json,common_attempt_id,created_at) VALUES(?,?,?,?,?,?)', id, auth.id, title, json(seats), common.id, this.clock());
      return { lesson: this.getLesson(auth, id) };
    });
  }
  lessonAction(auth, id, body) {
    this.teacher(auth); exactKeys(body, ['opId','expectedVersion','type','payload'], ['opId','expectedVersion','type','payload']);
    requireValue(ID.test(body.opId || '') && Number.isSafeInteger(body.expectedVersion));
    const fingerprint = tokenHash(canonical({ lessonId: id, ...body }));
    return this.transaction(() => {
      const row = this.lessonRow(auth, id), old = this.row('SELECT * FROM lesson_operations WHERE actor_id=? AND op_id=?', auth.id, body.opId);
      if (old) { requireValue(old.fingerprint === fingerprint, 'LEARNING_OP_CONFLICT', 409); return { lesson: this.lessonDTO(auth, row), duplicate: true }; }
      requireValue(row.version === body.expectedVersion, 'LEARNING_STATE_CONFLICT', 409);
      this.limit('lesson_operations', 100000);
      const seats = parse(row.seats_json);
      if (body.type === 'assign') {
        exactKeys(body.payload, ['learnerIds','trainerId','contentId'], ['learnerIds','trainerId','contentId']);
        const targets = body.payload.learnerIds;
        requireValue(Array.isArray(targets) && targets.length >= 1 && targets.length <= 9 && new Set(targets).size === targets.length
          && targets.every(target => target === 'common' || seats.some(seat => seat.learnerId === target)), 'LEARNING_SEAT_INVALID');
        const generated = this.contracts.create(body.payload.trainerId, body.payload.contentId);
        for (const target of targets) {
          const attempt = this.newAttempt(target === 'common' ? auth.id : target, auth.id, body.payload.trainerId, generated);
          if (target === 'common') row.common_attempt_id = attempt.id;
          else seats.find(seat => seat.learnerId === target).attemptId = attempt.id;
        }
        this.run('UPDATE lessons SET seats_json=?,common_attempt_id=?,version=version+1 WHERE id=?', json(seats), row.common_attempt_id, id);
      } else if (body.type === 'attach') {
        exactKeys(body.payload, ['learnerId','attemptId'], ['learnerId','attemptId']);
        const seat = seats.find(item => item.learnerId === body.payload.learnerId);
        requireValue(seat, 'LEARNING_SEAT_INVALID');
        const attempt = this.attemptRow(auth, body.payload.attemptId);
        requireValue(attempt.learner_id === seat.learnerId && attempt.archived_at == null, 'LEARNING_ATTEMPT_INVALID');
        requireValue(!this.row("SELECT id FROM assignments WHERE attempt_id=? AND status!='published'", attempt.id), 'LEARNING_HOMEWORK_DRAFT', 409);
        seat.attemptId = attempt.id;
        this.run('UPDATE lessons SET seats_json=?,version=version+1 WHERE id=?', json(seats), id);
      } else if (body.type === 'present') {
        exactKeys(body.payload, ['target'], ['target']);
        const target = body.payload.target;
        requireValue(target === null || target === 'common' || seats.some(seat => seat.learnerId === target && seat.attemptId), 'LEARNING_SEAT_INVALID');
        this.run('UPDATE lessons SET presentation_target=?,version=version+1 WHERE id=?', target, id);
      } else throw new LearningError('LEARNING_INVALID');
      this.run('INSERT INTO lesson_operations VALUES(?,?,?,?)', auth.id, body.opId, id, fingerprint);
      return { lesson: this.getLesson(auth, id), duplicate: false };
    });
  }
}

module.exports = { LearningStore, accountDTO, ID, canonical, clone, json, parse };
