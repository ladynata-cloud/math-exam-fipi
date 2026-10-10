'use strict';

// Family access is a separate principal. It never creates a learning-account
// session or impersonates the child to call student/teacher APIs.
const express = require('express');
const { LearningError, requireValue, exactKeys, safeName, token, tokenHash,
  hashPassword, verifyPassword, RateLimiter } = require('./learning-auth');
const DAY = 86400000;
const SECRET = /^[A-Za-z0-9_-]{43}$/;
const OUTCOMES = new Set(['started', 'independent', 'repeated', 'hinted', 'together', 'practiced']);

class FamilyAccess {
  constructor(store) {
    this.store = store;
    if (!store.available) return;
    store.db.exec(`
      CREATE TABLE IF NOT EXISTS learning_parents(id TEXT PRIMARY KEY,
        learner_id TEXT NOT NULL UNIQUE REFERENCES accounts(id), teacher_id TEXT NOT NULL REFERENCES accounts(id),
        name TEXT NOT NULL, login TEXT NOT NULL UNIQUE, password_hash TEXT, enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
        epoch INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS learning_parent_invitations(hash TEXT PRIMARY KEY,
        parent_id TEXT NOT NULL UNIQUE REFERENCES learning_parents(id), epoch INTEGER NOT NULL, expires_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS learning_parent_sessions(hash TEXT PRIMARY KEY,
        parent_id TEXT NOT NULL REFERENCES learning_parents(id), epoch INTEGER NOT NULL, expires_at INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS learning_parent_session_account ON learning_parent_sessions(parent_id);
    `);
  }
  account(id) { return this.store.row('SELECT * FROM learning_parents WHERE id=?', id); }
  bound(row) {
    const child = row && this.store.account(row.learner_id);
    const teacher = row && this.store.account(row.teacher_id);
    return child?.role === 'student' && child.teacher_id === row.teacher_id && teacher?.role === 'teacher' ? child : null;
  }
  metadata(learnerId) {
    const row = this.store.row('SELECT * FROM learning_parents WHERE learner_id=?', learnerId);
    if (!row) return { exists: false, name: '', login: '', enabled: false, active: false, version: 0, invitationExpiresAt: null };
    // Keep an expired invitation's timestamp visible so the teacher can
    // distinguish expiration from activation or a revoked invitation.
    const invitation = this.store.row('SELECT expires_at FROM learning_parent_invitations WHERE parent_id=? AND epoch=?', row.id, row.epoch);
    return { exists: true, name: row.name, login: row.login, enabled: !!row.enabled,
      active: !!row.enabled && !!row.password_hash, version: row.version, invitationExpiresAt: invitation?.expires_at ?? null };
  }
  write(teacherSession, learnerId, body, revoke = false) {
    exactKeys(body, revoke ? ['expectedVersion'] : ['name', 'expectedVersion'], revoke ? ['expectedVersion'] : ['name', 'expectedVersion']);
    requireValue(Number.isSafeInteger(body.expectedVersion) && body.expectedVersion >= 0 && body.expectedVersion < Number.MAX_SAFE_INTEGER, 'LEARNING_PARENT_INVALID');
    const name = revoke ? null : safeName(body.name);
    return this.store.transaction(() => {
      const auth = this.store.session(teacherSession);
      this.store.ownsStudent(auth, learnerId);
      const current = this.metadata(learnerId);
      requireValue(current.version === body.expectedVersion, 'LEARNING_PARENT_CONFLICT', 409);
      requireValue(!revoke || current.exists, 'LEARNING_NOT_FOUND', 404);
      const now = this.store.clock();
      if (!current.exists) {
        // Login is a non-secret random identifier; only the invitation is a credential.
        this.store.run(`INSERT INTO learning_parents(id,learner_id,teacher_id,name,login,created_at,updated_at)
          VALUES(?,?,?,?,?,?,?)`, token(18), learnerId, auth.id, name, 'parent-' + token(12).toLowerCase(), now, now);
      }
      const row = this.store.row('SELECT * FROM learning_parents WHERE learner_id=?', learnerId);
      requireValue(row.teacher_id === auth.id, 'LEARNING_NOT_FOUND', 404);
      // A reset cannot resurrect an old password or leave an old parent session
      // alive while a new invitation is waiting. Child credentials are untouched.
      this.store.run('DELETE FROM learning_parent_sessions WHERE parent_id=?', row.id);
      this.store.run('DELETE FROM learning_parent_invitations WHERE parent_id=?', row.id);
      this.store.run(`UPDATE learning_parents SET name=?,password_hash=NULL,enabled=?,epoch=epoch+1,
        version=version+1,updated_at=? WHERE id=?`, revoke ? row.name : name, revoke ? 0 : 1, now, row.id);
      let invitationToken;
      if (!revoke) {
        invitationToken = token(32);
        this.store.run('INSERT INTO learning_parent_invitations(hash,parent_id,epoch,expires_at) VALUES(?,?,?,?)',
          tokenHash(invitationToken), row.id, row.epoch + 1, now + 7 * DAY);
      }
      // Never use operation(): its result receipt would persist the raw token.
      return { parentAccess: this.metadata(learnerId), ...(invitationToken ? { invitationToken } : {}) };
    });
  }
  invitation(secret) {
    requireValue(typeof secret === 'string' && SECRET.test(secret), 'LEARNING_PARENT_INVITATION_INVALID', 401);
    const invitation = this.store.row('SELECT * FROM learning_parent_invitations WHERE hash=?', tokenHash(secret));
    const row = invitation && this.account(invitation.parent_id);
    requireValue(row && row.enabled && row.epoch === invitation.epoch && invitation.expires_at > this.store.clock()
      && this.bound(row), 'LEARNING_PARENT_INVITATION_INVALID', 401);
    return { invitation, row };
  }
  session(secret) {
    requireValue(typeof secret === 'string' && SECRET.test(secret), 'LEARNING_PARENT_ACCESS_INVALID', 401);
    const session = this.store.row('SELECT * FROM learning_parent_sessions WHERE hash=?', tokenHash(secret));
    const row = session && this.account(session.parent_id);
    requireValue(row && row.enabled && row.password_hash && session.epoch === row.epoch
      && session.expires_at > this.store.clock() && this.bound(row), 'LEARNING_PARENT_ACCESS_INVALID', 401);
    return row;
  }
  newSession(row) {
    const secret = token(32), now = this.store.clock();
    this.store.run('DELETE FROM learning_parent_sessions WHERE expires_at<=?', now);
    this.store.run(`DELETE FROM learning_parent_sessions WHERE parent_id=? AND hash NOT IN
      (SELECT hash FROM learning_parent_sessions WHERE parent_id=? ORDER BY expires_at DESC,hash DESC LIMIT 9)`, row.id, row.id);
    this.store.run('INSERT INTO learning_parent_sessions(hash,parent_id,epoch,expires_at) VALUES(?,?,?,?)', tokenHash(secret), row.id, row.epoch, now + 30 * DAY);
    return { sessionToken: secret, parent: { name: row.name, login: row.login } };
  }
  activate(secret, passwordHash, snapshot, requireSignedOut) {
    return this.store.transaction(() => {
      requireSignedOut();
      const { row } = this.invitation(secret);
      requireValue(row.id === snapshot.id && row.version === snapshot.version && row.epoch === snapshot.epoch,
        'LEARNING_PARENT_INVITATION_INVALID', 401);
      this.store.run('DELETE FROM learning_parent_invitations WHERE parent_id=?', row.id);
      this.store.run('DELETE FROM learning_parent_sessions WHERE parent_id=?', row.id);
      this.store.run('UPDATE learning_parents SET password_hash=?,epoch=epoch+1,version=version+1,updated_at=? WHERE id=?', passwordHash, this.store.clock(), row.id);
      return this.newSession(this.account(row.id));
    });
  }
  login(snapshot, requireSignedOut) {
    return this.store.transaction(() => {
      requireSignedOut();
      const row = this.account(snapshot.id);
      requireValue(row && row.enabled && row.password_hash && row.password_hash === snapshot.password_hash
        && row.epoch === snapshot.epoch && this.bound(row), 'LEARNING_PARENT_ACCESS_INVALID', 401);
      return this.newSession(row);
    });
  }
  overview(secret) {
    // Authorization and projection are synchronous in one SQLite transaction.
    return this.store.transaction(() => {
      const parent = this.session(secret), child = this.bound(parent), store = this.store;
      const profile = store.row('SELECT course,goal FROM learning_profiles WHERE learner_id=? AND teacher_id=?', child.id, parent.teacher_id);
      const runFilter = store.runGuard ? `AND NOT EXISTS(SELECT 1 FROM learning_run_attempts ra
        JOIN learning_runs r ON r.id=ra.run_id WHERE ra.attempt_id=a.id AND r.finished_at IS NULL)` : '';
      const visible = `a.learner_id=? AND a.teacher_id=? AND a.archived_at IS NULL
        AND NOT EXISTS(SELECT 1 FROM assignments hidden WHERE hidden.attempt_id=a.id AND hidden.status!='published') ${runFilter}`;
      const titles = new Map((store.contracts.list?.() || []).map(item => [JSON.stringify([item.trainerId, item.contentId]), item.title]));
      const progress = { totalAttempts: 0, startedAttempts: 0, completedAttempts: 0, independentAttempts: 0,
        helpedAttempts: 0, practicedAttempts: 0, lastActivityAt: null, recent: [] };
      // Iterate all eligible history; recent UI rows do not cap aggregate counts.
      for (const row of store.db.prepare(`SELECT a.trainer_id,json_extract(a.task_json,'$.contentId') AS content_id,
        a.outcome,a.updated_at FROM attempts a WHERE ${visible} ORDER BY a.updated_at DESC,a.id DESC`).iterate(child.id, parent.teacher_id)) {
        const outcome = OUTCOMES.has(row.outcome) ? row.outcome : 'started';
        progress.totalAttempts++;
        if (outcome === 'started') progress.startedAttempts++;
        else progress.completedAttempts++;
        if (outcome === 'independent' || outcome === 'repeated') progress.independentAttempts++;
        if (outcome === 'hinted' || outcome === 'together') progress.helpedAttempts++;
        if (outcome === 'practiced') progress.practicedAttempts++;
        if (progress.lastActivityAt === null) progress.lastActivityAt = row.updated_at;
        if (progress.recent.length < 20) progress.recent.push({ title: titles.get(JSON.stringify([row.trainer_id, row.content_id]))
          || (row.trainer_id === 'board' ? 'Работа на доске' : 'Учебное задание'), outcome, updatedAt: row.updated_at });
      }
      const homework = { total: 0, recent: [] };
      for (const row of store.db.prepare(`SELECT h.title,h.due_at,a.id,a.version,a.outcome,a.updated_at
        FROM assignments h JOIN attempts a ON a.id=h.attempt_id
        WHERE ${visible} AND h.status='published' AND h.learner_id=a.learner_id AND h.teacher_id=a.teacher_id
        ORDER BY h.created_at DESC,h.id DESC`).iterate(child.id, parent.teacher_id)) {
        homework.total++;
        if (homework.recent.length < 20) {
          // Reuse canonical freshness for paper-photo edits and later revision
          // requests. Only the safe current-submission timestamp leaves here.
          const submission = store.submissionForAttempt?.({ id: row.id, version: row.version, archived_at: null });
          homework.recent.push({ title: row.title, dueAt: row.due_at,
            outcome: OUTCOMES.has(row.outcome) ? row.outcome : 'started',
            submittedAt: submission && !submission.stale && submission.status !== 'revise' ? submission.submittedAt : null,
            updatedAt: row.updated_at });
        }
      }
      return { fetchedAt: store.clock(), student: { name: child.name }, profile: { course: profile?.course || 'school', goal: profile?.goal || null }, progress, homework };
    });
  }
}

function createFamilyRouter({ store, handler, authMiddleware, mutationMiddleware, publicOrigin, secureCookies, clock }) {
  const family = new FamilyAccess(store), router = express.Router(), parent = express.Router(), limiter = new RateLimiter(clock);
  const cookieName = secureCookies ? '__Host-mathexam_parent' : 'mathexam_parent_local';
  const cookieValues = req => (req.get('cookie') || '').split(';').map(part => part.trim()).filter(part => part.startsWith(cookieName + '='));
  const cookie = req => { const values = cookieValues(req); return values.length === 1 ? values[0].slice(cookieName.length + 1) : ''; };
  const csrf = secret => tokenHash('parent-csrf:' + secret);
  const response = (res, result) => {
    res.set('Set-Cookie', `${cookieName}=${result.sessionToken}; Path=/; HttpOnly; SameSite=Strict${secureCookies ? '; Secure' : ''}; Max-Age=2592000`);
    return { parent: result.parent, csrfToken: csrf(result.sessionToken) };
  };
  const origin = handler((req, _res, next) => {
    requireValue(publicOrigin && req.get('origin') === publicOrigin, 'LEARNING_ORIGIN_FORBIDDEN', 403);
    requireValue(req.is('application/json'), 'LEARNING_JSON_REQUIRED', 415); next();
  });
  const auth = handler((req, _res, next) => {
    req.parentSessionToken = cookie(req); req.parentAccount = family.session(req.parentSessionToken);
    // Bind an already rendered page to its parent identity across tab changes.
    requireValue(!req.get('x-learning-parent') || req.get('x-learning-parent') === req.parentAccount.login, 'LEARNING_PARENT_ACCOUNT_CHANGED', 409);
    limiter.take('auth:' + req.parentAccount.id, 300, 60000); next();
  });
  function signedOut(req) {
    requireValue(cookieValues(req).length <= 1, 'LEARNING_PARENT_ALREADY_SIGNED_IN', 409);
    if (!cookieValues(req).length) return;
    let current;
    try { current = family.session(cookie(req)); } catch (error) { if (!(error instanceof LearningError) || error.status !== 401) throw error; }
    requireValue(!current, 'LEARNING_PARENT_ALREADY_SIGNED_IN', 409);
  }
  function anonymous(req, key) {
    limiter.take('source:' + (req.socket.remoteAddress || 'unknown'), 30, 15 * 60000);
    limiter.take('credential:' + tokenHash(key || 'invalid'), 8, 15 * 60000);
  }
  parent.post('/activate', origin, handler(async (req, res) => {
    exactKeys(req.query, []); exactKeys(req.body, ['token', 'password'], ['token', 'password']);
    anonymous(req, typeof req.body.token === 'string' ? req.body.token.slice(0, 100) : 'invalid'); signedOut(req);
    const { row } = family.invitation(req.body.token);
    const hash = await hashPassword(req.body.password, 'parent');
    res.json(response(res, family.activate(req.body.token, hash, row, () => signedOut(req))));
  }));
  parent.post('/login', origin, handler(async (req, res) => {
    exactKeys(req.query, []); exactKeys(req.body, ['login', 'password'], ['login', 'password']);
    const login = typeof req.body.login === 'string' ? req.body.login.trim().toLowerCase().slice(0, 100) : '';
    anonymous(req, login); signedOut(req);
    const row = /^parent-[a-z0-9_-]{16}$/.test(login) ? store.row('SELECT * FROM learning_parents WHERE login=?', login) : null;
    const valid = await verifyPassword(req.body.password, row?.enabled ? row.password_hash : null);
    requireValue(valid, 'LEARNING_PARENT_ACCESS_INVALID', 401);
    res.json(response(res, family.login(row, () => signedOut(req))));
  }));
  parent.get('/session', auth, handler((req, res) => {
    exactKeys(req.query, []); res.json({ parent: { name: req.parentAccount.name, login: req.parentAccount.login }, csrfToken: csrf(req.parentSessionToken) });
  }));
  parent.get('/overview', auth, handler((req, res) => { exactKeys(req.query, []); res.json(family.overview(req.parentSessionToken)); }));
  parent.post('/logout', auth, origin, handler((req, res) => {
    exactKeys(req.query, []); exactKeys(req.body, []);
    requireValue(req.get('x-csrf-token') === csrf(req.parentSessionToken), 'LEARNING_CSRF_INVALID', 403);
    store.run('DELETE FROM learning_parent_sessions WHERE hash=?', tokenHash(req.parentSessionToken));
    res.set('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Strict${secureCookies ? '; Secure' : ''}; Max-Age=0`); res.json({ ok: true });
  }));
  // Terminate the namespace: a parent request must never reach generic learning auth.
  parent.use((_req, res) => res.status(404).json({ ok: false, error: 'LEARNING_NOT_FOUND' }));
  router.use('/parent', parent);
  router.get('/teacher/students/:id/parent-access', authMiddleware, handler((req, res) => {
    store.ownsStudent(req.learningAuth, req.params.id); exactKeys(req.query, []);
    res.json({ parentAccess: family.metadata(req.params.id) });
  }));
  for (const revoke of [false, true]) router.post('/teacher/students/:id/parent-access' + (revoke ? '/revoke' : ''), authMiddleware, mutationMiddleware, handler((req, res) => {
    store.ownsStudent(req.learningAuth, req.params.id); exactKeys(req.query, []);
    limiter.take('manage:' + req.learningAuth.id + ':' + req.params.id, 12, 15 * 60000);
    res.json(family.write(req.learningSessionToken, req.params.id, req.body, revoke));
  }));
  return router;
}

module.exports = { FamilyAccess, createFamilyRouter };
