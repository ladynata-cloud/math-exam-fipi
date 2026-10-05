'use strict';

const express = require('express');
const { LearningStore } = require('./learning-store');
const { LearningError, requireValue, exactKeys, safeName, normalizeLogin, tokenHash, hashPassword, verifyPassword, RateLimiter } = require('./learning-auth');

function createLearningApi(options = {}) {
  const store = options.store || new LearningStore(options);
  const router = express.Router();
  const clock = options.clock || Date.now;
  const limiter = new RateLimiter(clock);
  const secureCookies = options.secureCookies !== false;
  const cookieName = secureCookies ? '__Host-mathexam_learning' : 'mathexam_learning_local';
  const publicOrigin = options.publicOrigin || process.env.LEARNING_PUBLIC_ORIGIN || null;
  if (publicOrigin) requireValue(new URL(publicOrigin).origin === publicOrigin, 'LEARNING_ORIGIN_INVALID');
  function handler(callback) {
    return (req, res, next) => Promise.resolve().then(() => callback(req, res, next)).catch(error => {
      if (res.headersSent) return next(error);
      const known = error instanceof LearningError;
      if (known && error.status === 429) res.set('Retry-After', '60');
      res.status(known ? error.status : 500).json({ ok: false, error: known ? error.code : 'LEARNING_INTERNAL_ERROR' });
    });
  }
  function cookie(req) {
    const raw = req.get('cookie') || '';
    const values = raw.split(';').map(part => part.trim()).filter(part => part.startsWith(`${cookieName}=`));
    return values.length === 1 ? values[0].slice(cookieName.length + 1) : '';
  }
  const csrf = secret => tokenHash(`learning-csrf:${secret}`);
  function sessionResponse(res, result) {
    res.set('Set-Cookie', `${cookieName}=${result.sessionToken}; Path=/; HttpOnly; SameSite=Strict${secureCookies ? '; Secure' : ''}; Max-Age=2592000`);
    return { account: result.account, csrfToken: csrf(result.sessionToken), ...(result.recoveryCodes ? { recoveryCodes: result.recoveryCodes } : {}) };
  }
  const originMiddleware = handler((req, _res, next) => {
    requireValue(publicOrigin && req.get('origin') === publicOrigin, 'LEARNING_ORIGIN_FORBIDDEN', 403);
    requireValue(req.is('application/json'), 'LEARNING_JSON_REQUIRED', 415);
    next();
  });
  const authMiddleware = handler((req, _res, next) => {
    req.learningSessionToken = cookie(req);
    req.learningAuth = store.session(req.learningSessionToken);
    limiter.take(`authenticated:${req.learningAuth.id}`, 900, 60000);
    next();
  });
  const mutationMiddleware = handler((req, _res, next) => {
    requireValue(publicOrigin && req.get('origin') === publicOrigin, 'LEARNING_ORIGIN_FORBIDDEN', 403);
    requireValue(req.is('application/json'), 'LEARNING_JSON_REQUIRED', 415);
    requireValue(req.get('x-csrf-token') === csrf(req.learningSessionToken), 'LEARNING_CSRF_INVALID', 403);
    limiter.take(`mutation:${req.learningAuth.id}`, 360, 60000);
    next();
  });
  function anonymousLimit(req, login) {
    limiter.take(`source:${req.socket.remoteAddress || 'unknown'}`, 30, 15 * 60000);
    limiter.take(`login:${tokenHash(login || 'invalid')}`, 8, 15 * 60000);
  }
  router.use((_req, res, next) => { res.set({ 'Cache-Control': 'no-store', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff' }); next(); });
  router.get('/status', (_req, res) => res.json(store.status()));
  router.get('/catalog', (_req, res) => res.json({ trainers: store.status().trainers }));
  router.post('/login', originMiddleware, handler(async (req, res) => {
    exactKeys(req.body, ['login','password'], ['login','password']);
    const rawLogin = typeof req.body.login === 'string' ? req.body.login.trim().toLowerCase().slice(0, 100) : '';
    anonymousLimit(req, rawLogin);
    let login;
    try { login = normalizeLogin(rawLogin); } catch (_error) { login = ''; }
    const account = login ? store.accountByLogin(login) : null;
    const valid = await verifyPassword(req.body.password, account?.password_hash);
    requireValue(valid, 'LEARNING_ACCESS_INVALID', 401);
    res.json(sessionResponse(res, store.loginSession(account.id, account.password_hash, account.auth_epoch)));
  }));
  router.post('/activate', originMiddleware, handler(async (req, res) => {
    exactKeys(req.body, ['token','password'], ['token','password']);
    anonymousLimit(req, typeof req.body.token === 'string' ? req.body.token : 'invalid');
    const invitation = store.invitation(req.body.token);
    const account = store.account(invitation.account_id);
    const passwordHash = await hashPassword(req.body.password, account.role);
    res.json(sessionResponse(res, store.activate(req.body.token, passwordHash)));
  }));
  router.post('/recover', originMiddleware, handler(async (req, res) => {
    exactKeys(req.body, ['login','code','password'], ['login','code','password']);
    const login = typeof req.body.login === 'string' ? req.body.login.trim().toLowerCase().slice(0, 100) : '';
    anonymousLimit(req, login);
    store.recovery(login, req.body.code);
    const passwordHash = await hashPassword(req.body.password);
    res.json(sessionResponse(res, store.recoverTeacher(login, req.body.code, passwordHash)));
  }));
  router.get('/session', authMiddleware, handler((req, res) => res.json({ account: req.learningAuth, csrfToken: csrf(req.learningSessionToken) })));
  router.post('/logout', authMiddleware, mutationMiddleware, handler((req, res) => {
    exactKeys(req.body, []); store.logout(req.learningSessionToken);
    res.set('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Strict${secureCookies ? '; Secure' : ''}; Max-Age=0`);
    res.json({ ok: true });
  }));
  router.post('/teacher/recovery-codes', authMiddleware, mutationMiddleware, handler(async (req, res) => {
    store.teacher(req.learningAuth);
    exactKeys(req.body, ['password'], ['password']);
    // Bound password guesses across every session of the same teacher before
    // scheduling the expensive asynchronous password verification.
    limiter.take(`recovery-codes:${req.learningAuth.id}`, 8, 15 * 60000);
    const account = store.account(req.learningAuth.id);
    const valid = await verifyPassword(req.body.password, account?.password_hash);
    requireValue(valid, 'LEARNING_ACCESS_INVALID', 401);
    res.json(store.rotateTeacherRecoveryCodes(req.learningSessionToken, account.password_hash, account.auth_epoch));
  }));
  router.get('/teacher/students', authMiddleware, handler((req, res) => res.json({ students: store.students(req.learningAuth) })));
  router.post('/teacher/students', authMiddleware, mutationMiddleware, handler(async (req, res) => {
    // Check the role and request shape before scheduling expensive password work.
    store.teacher(req.learningAuth);
    exactKeys(req.body, ['name', 'login', 'password'], ['name', 'login']);
    const student = { name: safeName(req.body.name), login: normalizeLogin(req.body.login) };
    requireValue(!store.accountByLogin(student.login), 'LEARNING_LOGIN_EXISTS', 409);
    const passwordHash = Object.hasOwn(req.body, 'password') ? await hashPassword(req.body.password, 'student') : null;
    // Hashing is asynchronous: a logout or recovery in the meantime revokes permission.
    const auth = store.session(req.learningSessionToken);
    res.status(201).json(store.createStudent(auth, student, passwordHash));
  }));
  router.post('/teacher/students/:id/recovery', authMiddleware, mutationMiddleware, handler((req, res) => {
    exactKeys(req.body, []); res.json(store.recoverStudent(req.learningAuth, req.params.id));
  }));
  router.get('/attempts', authMiddleware, handler((req, res) => res.json({ attempts: store.listAttempts(req.learningAuth) })));
  router.post('/attempts', authMiddleware, mutationMiddleware, handler((req, res) => res.status(201).json(store.createAttempt(req.learningAuth, req.body))));
  router.get('/attempts/:id', authMiddleware, handler((req, res) => res.json(store.getAttempt(req.learningAuth, req.params.id))));
  router.post('/attempts/:id/actions', authMiddleware, mutationMiddleware, handler((req, res) => res.json(store.action(req.learningAuth, req.params.id, req.body))));
  router.get('/attempts/:id/history', authMiddleware, handler((req, res) => res.json(store.history(req.learningAuth, req.params.id,
    { after: Number(req.query.after || 0), limit: Number(req.query.limit || 100), ...(req.query.through === undefined ? {} : { through: Number(req.query.through) }) }))));
  router.get('/assignments', authMiddleware, handler((req, res) => res.json({ assignments: store.listAssignments(req.learningAuth) })));
  router.post('/assignments', authMiddleware, mutationMiddleware, handler((req, res) => res.status(201).json(store.createAssignments(req.learningAuth, req.body))));
  router.get('/lessons', authMiddleware, handler((req, res) => res.json({ lessons: store.listLessons(req.learningAuth) })));
  router.post('/lessons', authMiddleware, mutationMiddleware, handler((req, res) => res.status(201).json(store.createLesson(req.learningAuth, req.body))));
  router.get('/lessons/:id', authMiddleware, handler((req, res) => res.json(store.getLesson(req.learningAuth, req.params.id))));
  router.post('/lessons/:id/actions', authMiddleware, mutationMiddleware, handler((req, res) => res.json(store.lessonAction(req.learningAuth, req.params.id, req.body))));
  return { router, store, handler, authMiddleware, mutationMiddleware, close: () => store.close() };
}

module.exports = { createLearningApi };
