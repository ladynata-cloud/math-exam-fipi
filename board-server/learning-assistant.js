'use strict';

// Cabinet identities and quotas stay here. Only a random subject and bounded
// mathematical fields cross the independent assistant service boundary.
const express = require('express');
const crypto = require('node:crypto');
const { LearningError, requireValue, exactKeys, tokenHash } = require('./learning-auth');
const { SOURCE_PROFILE_ID, resolveCourseContext } = require('./assistant-course-context');
const { createDialogueCache } = require('./assistant-dialogue');
const PROFILE_IDS = ['oge-geometry', 'peterson-decimals', 'triangle-congruence', SOURCE_PROFILE_ID, 'vilenkin-grade6'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ID = /^[A-Za-z0-9_-]{12,80}$/;
const DAY = 86400000, RETENTION = 30 * DAY, MAX_REQUESTS = 100000;
const clone = value => JSON.parse(JSON.stringify(value));
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
  : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);

function loadAssistantConfig(env = process.env) {
  const flag = key => { requireValue(!env[key] || ['0', '1'].includes(env[key]), 'LEARNING_ASSISTANT_CONFIG_INVALID', 503); return env[key] === '1'; };
  const enabled = flag('LEARNING_ASSISTANT_ENABLED');
  const external = flag('LEARNING_ASSISTANT_EXTERNAL_ENABLED');
  const reviewed = flag('LEARNING_ASSISTANT_PROVIDER_DATA_REVIEWED');
  if (!enabled) return { enabled: false, external: false, origin: '', key: '', timeoutMs: 20000 };
  let url;
  try { url = new URL(env.LEARNING_ASSISTANT_ORIGIN); } catch { throw new LearningError('LEARNING_ASSISTANT_CONFIG_INVALID', 503); }
  const local = env.NODE_ENV !== 'production' && env.LEARNING_LOCAL_DEV === '1' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  requireValue(url.origin === env.LEARNING_ASSISTANT_ORIGIN && !url.username && !url.password
    && (url.protocol === 'https:' || (local && url.protocol === 'http:')), 'LEARNING_ASSISTANT_CONFIG_INVALID', 503);
  const key = env.LEARNING_ASSISTANT_BRIDGE_KEY || '';
  requireValue(/^[A-Za-z0-9_-]{43,128}$/.test(key), 'LEARNING_ASSISTANT_CONFIG_INVALID', 503);
  requireValue(!external || reviewed, 'LEARNING_ASSISTANT_CONFIG_INVALID', 503);
  return { enabled, external, origin: url.origin, key, timeoutMs: 20000 };
}

function containsSensitive(value, checkNumbers = true) {
  return /[\w.+-]+@[\w.-]+\.[a-zа-я]{2,}/iu.test(value)
    || /(?:https?:\/\/|www\.|t\.me\/|vk\.com\/|@\w{3})/iu.test(value)
    || (checkNumbers && /(?:\+?\d[\d ()-]{7,}\d)/u.test(value))
    || /(?:меня\s+зовут|моя\s+фамилия|мой\s+адрес|телефон|пароль|пин[ -]?код|\bpin\b|\bpassword\b|\btoken\b|sk-[a-z0-9]{8})/iu.test(value);
}
function mathText(value, maximum, empty = false) {
  requireValue(typeof value === 'string' && value.length <= maximum, 'LEARNING_ASSISTANT_INPUT_INVALID');
  const text = value.normalize('NFKC').trim();
  requireValue((empty || text.length > 0) && text.length <= maximum
    && !/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(text), 'LEARNING_ASSISTANT_INPUT_INVALID');
  requireValue(!containsSensitive(text), 'LEARNING_ASSISTANT_PERSONAL_DATA');
  return text;
}
function checkedAnswer(raw, topic, secret) {
  requireValue(raw && typeof raw === 'object' && !Array.isArray(raw), 'LEARNING_ASSISTANT_RESPONSE_INVALID', 503);
  const answerId = raw.answerId || raw.id;
  requireValue(typeof answerId === 'string' && UUID.test(answerId) && raw.topic === topic, 'LEARNING_ASSISTANT_RESPONSE_INVALID', 503);
  requireValue(!secret || !JSON.stringify(raw).includes(secret), 'LEARNING_ASSISTANT_RESPONSE_INVALID', 503);
  requireValue(['deterministic', 'curated-guidance', 'needs-teacher', 'model-unverified'].includes(raw.verification), 'LEARNING_ASSISTANT_RESPONSE_INVALID', 503);
  const plain = (value, max, optional = false) => {
    if (optional && value === undefined) return '';
    requireValue(typeof value === 'string' && value.length <= max && !/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(value)
      && !/<\/?[a-z][^>]*>/iu.test(value) && !containsSensitive(value,raw.verification !== 'deterministic') && (!secret || !value.includes(secret)), 'LEARNING_ASSISTANT_RESPONSE_INVALID', 503);
    return value;
  };
  requireValue(Array.isArray(raw.steps) && raw.steps.length >= 1 && raw.steps.length <= 12, 'LEARNING_ASSISTANT_RESPONSE_INVALID', 503);
  const sourceIds = Array.isArray(raw.sourceIds) ? raw.sourceIds.filter(id => typeof id === 'string' && /^[a-z0-9._:-]{1,100}$/i.test(id)).slice(0,12) : [];
  return { answerId, id: answerId, topic, title: plain(raw.title, 200), text: plain(raw.text, 2000, true),
    steps: raw.steps.map(step => plain(step, 1500)), check: plain(raw.check, 1500, true),
    verification: raw.verification, complete: raw.complete === true, sourceIds, sources: [] };
}

async function bridgeCall(config, endpoint, body, fetchImpl, signal) {
  requireValue(config.enabled, 'LEARNING_ASSISTANT_UNAVAILABLE', 503);
  const controller = new AbortController();
  let timeout, cancelReject;
  const deadline = new Promise((_,reject) => { cancelReject=reject;
    timeout=setTimeout(() => { controller.abort(); reject(new LearningError('LEARNING_ASSISTANT_UNAVAILABLE',503)); },config.timeoutMs);
  });
  const cancel = () => {controller.abort();cancelReject(new LearningError('LEARNING_ASSISTANT_UNAVAILABLE',503));};
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) cancel();
  try {
    const operation=async()=>{
    requireValue(!controller.signal.aborted,'LEARNING_ASSISTANT_UNAVAILABLE',503);
    const response = await fetchImpl(config.origin + '/internal/cabinet/' + endpoint, { method: 'POST', redirect: 'error', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + config.key }, body: JSON.stringify(body) });
    requireValue(response.ok && /^application\/json(?:;|$)/i.test(response.headers.get('content-type') || '')
      && Number(response.headers.get('content-length') || 0) <= 65536, 'LEARNING_ASSISTANT_UNAVAILABLE', 503);
    const reader = response.body?.getReader();
    requireValue(reader, 'LEARNING_ASSISTANT_RESPONSE_INVALID', 503);
    const chunks = []; let size = 0;
    try { for (;;) { const next = await reader.read(); if (next.done) break;
      size += next.value.length; requireValue(size <= 65536, 'LEARNING_ASSISTANT_RESPONSE_INVALID', 503); chunks.push(Buffer.from(next.value));
    } } finally { if (size > 65536) await reader.cancel().catch(() => {}); reader.releaseLock(); }
    let result; try { result = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new LearningError('LEARNING_ASSISTANT_RESPONSE_INVALID', 503); }
    requireValue(result?.ok === true, 'LEARNING_ASSISTANT_UNAVAILABLE', 503);
    return result;
    };
    return await Promise.race([operation(),deadline]);
  } catch (error) {
    if (error instanceof LearningError) throw error;
    throw new LearningError('LEARNING_ASSISTANT_UNAVAILABLE', 503);
  } finally { clearTimeout(timeout);controller.abort();signal?.removeEventListener('abort',cancel); }
}

function initializeAssistant(store) {
  if (!store.available) return;
  store.db.exec(`CREATE TABLE IF NOT EXISTS learning_assistant_settings(
    learner_id TEXT PRIMARY KEY REFERENCES accounts(id), profile_id TEXT NOT NULL,
    enabled INTEGER NOT NULL CHECK(enabled IN (0,1)), daily_limit INTEGER NOT NULL CHECK(daily_limit BETWEEN 1 AND 20),
    external_allowed INTEGER NOT NULL CHECK(external_allowed IN (0,1)), subject TEXT NOT NULL UNIQUE,
    version INTEGER NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS learning_assistant_usage(
      learner_id TEXT NOT NULL REFERENCES accounts(id), day TEXT NOT NULL, requests INTEGER NOT NULL,
      PRIMARY KEY(learner_id,day));
    CREATE TABLE IF NOT EXISTS learning_assistant_requests(
      request_key TEXT PRIMARY KEY, learner_id TEXT REFERENCES accounts(id), profile_id TEXT, topic TEXT,
      status TEXT NOT NULL CHECK(status IN ('running','done','failed')), answer_id TEXT UNIQUE,
      feedback TEXT, verification TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS learning_assistant_answers ON learning_assistant_requests(learner_id,answer_id);`);
  // A restarted single-writer cabinet cannot determine whether a prior request
  // was billed. Keep its quota/tombstone, mark uncertain work failed, never retry.
  store.run("UPDATE learning_assistant_requests SET status='failed',updated_at=? WHERE status='running'", store.clock());
}

function createLearningAssistantRouter(learning, options = {}) {
  const { store, handler, authMiddleware, mutationMiddleware } = learning;
  const catalog = options.catalog || require('./assistant-profile-catalog.json');
  requireValue(Array.isArray(catalog) && catalog.length === PROFILE_IDS.length
    && new Set(catalog.map(p => p.id)).size === PROFILE_IDS.length && catalog.every(p => PROFILE_IDS.includes(p.id)), 'LEARNING_ASSISTANT_CATALOG_INVALID', 503);
  let config, configError = false;
  try { config = options.config || loadAssistantConfig(options.env); }
  catch { configError = true; config = { enabled: false, external: false, origin: '', key: '', timeoutMs: 20000 }; }
  const fetchImpl = options.fetchImpl || fetch;
  initializeAssistant(store);
  const router = express.Router(); let cached = null, statusPending = null, lastCleanup = 0;
  const profiles = new Map(catalog.map(profile => [profile.id, profile]));
  const dialogues = createDialogueCache(() => store.clock());
  const day = () => new Date(store.clock()).toISOString().slice(0, 10);
  function cleanup() {
    const now = store.clock(); if (now - lastCleanup < 60000) return; lastCleanup = now;
    store.transaction(() => {
      require('./learning-assistant-practice').prunePractice(store,now);
      store.run('DELETE FROM learning_assistant_usage WHERE day<?', new Date(now - RETENTION).toISOString().slice(0,10));
      // Preserve unlinkable replay tombstones after the review/feedback window.
      store.run('UPDATE learning_assistant_requests SET learner_id=NULL,profile_id=NULL,topic=NULL,answer_id=NULL,feedback=NULL,verification=NULL WHERE created_at<? AND learner_id IS NOT NULL', now - RETENTION);
    });
  }
  function settings(id) { return store.row('SELECT * FROM learning_assistant_settings WHERE learner_id=?', id); }
  function used(id) { return store.row('SELECT requests FROM learning_assistant_usage WHERE learner_id=? AND day=?', id, day())?.requests || 0; }
  function owns(auth, id) {
    if (auth.role === 'teacher') store.ownsStudent(auth, id);
    else requireValue(auth.role === 'student' && auth.id === id, 'LEARNING_FORBIDDEN', 403);
  }
  function recheck(req, id) {
    const auth = store.session(req.learningSessionToken);
    requireValue(auth.id === req.learningAuth.id && auth.role === req.learningAuth.role, 'LEARNING_ACCOUNT_CHANGED', 409);
    owns(auth, id); return auth;
  }
  function examActive(id) {
    return !!(store.row("SELECT name FROM sqlite_master WHERE type='table' AND name='learning_runs'")
      && store.row('SELECT id FROM learning_runs WHERE learner_id=? AND finished_at IS NULL', id));
  }
  async function bridgeStatus() {
    if (!config.enabled) return null;
    if (cached && store.clock() - cached.at < 5000) return cached.value;
    if (statusPending) return statusPending;
    statusPending = (async () => {
      let result = null;
      try {
        const value = await bridgeCall({ ...config, timeoutMs: Math.min(5000, config.timeoutMs) }, 'status', {}, fetchImpl);
        requireValue(value.protocolVersion === 1 && ['offline','api'].includes(value.mode) && typeof value.externalEnabled === 'boolean'
          && canonical(value.profiles) === canonical(catalog), 'LEARNING_ASSISTANT_CATALOG_INVALID', 503);
        requireValue(typeof value.providerLabel === 'string' && value.providerLabel.length <= 100 && !/[<>\u0000-\u001f]/u.test(value.providerLabel)
          && !value.providerLabel.includes(config.key), 'LEARNING_ASSISTANT_RESPONSE_INVALID', 503);
        result = { mode: value.mode, externalEnabled: value.externalEnabled, providerLabel: value.providerLabel };
      } catch { /* A failed handshake cannot grant model access or reveal errors. */ }
      cached = { at: store.clock(), value: result }; return result;
    })().finally(() => { statusPending = null; });
    return statusPending;
  }
  async function status(req, id, teacher = false) {
    owns(req.learningAuth, id); cleanup();
    const initial = settings(id);
    const remote = (teacher || initial?.enabled) ? await bridgeStatus() : null;
    recheck(req, id);
    const row = settings(id), count = used(id), profile = row ? profiles.get(row.profile_id) : null;
    const externalAvailable = !!(config.enabled && config.external && remote?.externalEnabled && row?.profile_id !== SOURCE_PROFILE_ID);
    const enabled = !!(config.enabled && row?.enabled);
    return { ok: true, enabled, configuredEnabled: !!row?.enabled, available: !!config.enabled, profile: teacher || enabled ? clone(profile || null) : null,
      version: row?.version || 0, dailyLimit: row?.daily_limit || 10, used: count, remaining: Math.max(0,(row?.daily_limit || 10)-count),
      externalAllowed: !!row?.external_allowed, externalAvailable, externalEnabled: !!(enabled && row?.external_allowed && externalAvailable),
      mode: !remote ? 'unavailable' : externalAvailable && row?.external_allowed ? 'api' : 'offline',
      providerLabel: remote?.providerLabel || '', examActive: examActive(id),
      practiceRetentionEnabled: !!store.row('SELECT learner_id FROM assistant_practice_progress WHERE learner_id=?',id),
      ...(teacher ? { profileCatalog: clone(catalog), configuredError: configError, activeCount: store.row('SELECT COUNT(*) AS n FROM learning_assistant_settings WHERE enabled=1').n } : {}) };
  }
  router.get('/assistant', authMiddleware, handler(async (req,res) => {
    requireValue(req.learningAuth.role === 'student', 'LEARNING_FORBIDDEN', 403); exactKeys(req.query, []);
    res.json(await status(req, req.learningAuth.id));
  }));
  router.get('/teacher/students/:id/assistant', authMiddleware, handler(async (req,res) => {
    store.ownsStudent(req.learningAuth, req.params.id); exactKeys(req.query, []);
    res.json(await status(req, req.params.id, true));
  }));
  router.post('/teacher/students/:id/assistant', authMiddleware, mutationMiddleware, handler(async (req,res) => {
    store.ownsStudent(req.learningAuth, req.params.id); exactKeys(req.query, []);
    exactKeys(req.body, ['profileId','enabled','dailyLimit','version','externalAllowed'], ['profileId','enabled','dailyLimit','version']);
    const b = req.body;
    requireValue(profiles.has(b.profileId) && typeof b.enabled === 'boolean' && Number.isInteger(b.dailyLimit) && b.dailyLimit >= 1 && b.dailyLimit <= 20
      && Number.isSafeInteger(b.version) && b.version >= 0 && (b.externalAllowed === undefined || typeof b.externalAllowed === 'boolean'), 'LEARNING_ASSISTANT_CONFIG_INVALID');
    const externalAllowed = b.externalAllowed === true;
    requireValue(!externalAllowed || b.profileId !== SOURCE_PROFILE_ID, 'LEARNING_ASSISTANT_COURSE_SOURCE_ONLY', 409);
    if (externalAllowed) requireValue(config.external && (await bridgeStatus())?.externalEnabled, 'LEARNING_ASSISTANT_EXTERNAL_UNAVAILABLE', 409);
    recheck(req, req.params.id);
    store.transaction(() => {
      const previous = settings(req.params.id);
      requireValue((previous?.version || 0) === b.version, 'LEARNING_ASSISTANT_VERSION_CONFLICT', 409);
      if (b.enabled && !previous?.enabled) requireValue(store.row('SELECT COUNT(*) AS n FROM learning_assistant_settings WHERE enabled=1').n < 3, 'LEARNING_ASSISTANT_PILOT_FULL', 409);
      store.run(`INSERT INTO learning_assistant_settings(learner_id,profile_id,enabled,daily_limit,external_allowed,subject,version,updated_at) VALUES(?,?,?,?,?,?,?,?)
        ON CONFLICT(learner_id) DO UPDATE SET profile_id=excluded.profile_id,enabled=excluded.enabled,daily_limit=excluded.daily_limit,external_allowed=excluded.external_allowed,version=excluded.version,updated_at=excluded.updated_at`,
        req.params.id,b.profileId,+b.enabled,b.dailyLimit,+externalAllowed,previous?.subject || crypto.randomBytes(32).toString('hex'),b.version+1,store.clock());
    });
    res.json(await status(req, req.params.id, true));
  }));

  function structuredContext(auth, attemptId, profileId) {
    if (attemptId === undefined) return null;
    requireValue(typeof attemptId === 'string' && ID.test(attemptId), 'LEARNING_ASSISTANT_INPUT_INVALID');
    const a = store.getAttempt(auth, attemptId);
    requireValue(a.archivedAt == null, 'LEARNING_ATTEMPT_ARCHIVED', 409);
    requireValue(a.controller === auth.role, 'LEARNING_CONTROL_REQUIRED', 409);
    requireValue(!store.runGuard?.(attemptId), 'LEARNING_RUN_ACTIVE', 409);
    // Only published fixed task formats are projected. No state/history/photo,
    // answer key, title containing a pupil's name or whole DTO is forwarded.
    const supported = profileId === 'triangle-congruence' && a.trainerId === 'atanasyan-7-9';
    let question = null;
    if (supported && typeof a.taskSpec?.prompt === 'string') question = mathText(a.taskSpec.prompt, 1000);
    return { attempt: a, question };
  }
  router.post('/assistant/ask', authMiddleware, mutationMiddleware, handler(async (req,res) => {
    requireValue(req.learningAuth.role === 'student', 'LEARNING_FORBIDDEN', 403); exactKeys(req.query, []);
    const fromCourse = req.body !== null && typeof req.body === 'object' && Object.hasOwn(req.body, 'courseContext');
    exactKeys(req.body, fromCourse ? ['requestId','courseContext','attempt','mode','hintLevel','simpler','externalConsent']
      : ['requestId','topic','question','attempt','mode','hintLevel','simpler','attemptId','externalConsent','followUp'],
    fromCourse ? ['requestId','courseContext','mode','hintLevel','simpler'] : ['requestId','topic','question','mode','hintLevel','simpler']);
    const b = req.body, id = req.learningAuth.id;
    requireValue(typeof b.requestId === 'string' && UUID.test(b.requestId) && ['hint','full'].includes(b.mode) && Number.isInteger(b.hintLevel) && b.hintLevel >= 1 && b.hintLevel <= 8
      && typeof b.simpler === 'boolean' && (b.externalConsent === undefined || typeof b.externalConsent === 'boolean'), 'LEARNING_ASSISTANT_INPUT_INVALID');
    b.requestId=b.requestId.toLowerCase();
    const row = settings(id), profile = row && profiles.get(row.profile_id);
    requireValue(config.enabled && row?.enabled && profile, 'LEARNING_ASSISTANT_DISABLED', 403);
    requireValue(!examActive(id), 'LEARNING_RUN_ACTIVE', 409);
    requireValue(fromCourse === (row.profile_id === SOURCE_PROFILE_ID), 'LEARNING_ASSISTANT_TOPIC_INVALID');
    const course = fromCourse ? resolveCourseContext(b.courseContext) : null;
    const topic = course?.topic || b.topic;
    requireValue(profile.topics.some(t => t.id === topic), 'LEARNING_ASSISTANT_TOPIC_INVALID');
    const question = course?.question || mathText(b.question, 1000), attempt = mathText(b.attempt ?? '', 400, true);
    const context = fromCourse ? null : structuredContext(req.learningAuth, b.attemptId, row.profile_id);
    const externalConsent = b.externalConsent === true;
    requireValue(!externalConsent || row.profile_id !== SOURCE_PROFILE_ID, 'LEARNING_ASSISTANT_COURSE_SOURCE_ONLY', 409);
    // Check synchronous config before any remote I/O or request reservation.
    requireValue(!externalConsent || (row.external_allowed && config.external), 'LEARNING_ASSISTANT_EXTERNAL_UNAVAILABLE', 409);
    const hasFollowUp = Object.hasOwn(b, 'followUp');
    let followUp;
    if (hasFollowUp) {
      exactKeys(b.followUp, ['answerId','question'], ['answerId','question']);
      requireValue(typeof b.followUp.answerId === 'string' && UUID.test(b.followUp.answerId), 'LEARNING_ASSISTANT_INPUT_INVALID');
      requireValue(externalConsent && row.external_allowed && config.external, 'LEARNING_ASSISTANT_EXTERNAL_UNAVAILABLE', 409);
      followUp = { answerId: b.followUp.answerId.toLowerCase(), question: mathText(b.followUp.question, 400) };
    }
    requireValue(![question, attempt, followUp?.question].some(text => typeof text === 'string' && text.includes(config.key)), 'LEARNING_ASSISTANT_PERSONAL_DATA');
    // Bind to this login as well as the account and current task/settings. A
    // browser cannot supply a transcript, and another tab/login cannot change
    // the task under an earlier answer. Only a digest is kept with the cache.
    const dialogueBinding = tokenHash(canonical({ id, session: tokenHash(req.learningSessionToken),
      version: row.version, profile: row.profile_id, topic, question, effectiveQuestion: context?.question || question,
      attempt, attemptId: b.attemptId || null }));
    const dialogue = followUp ? dialogues.prepare(followUp.answerId, dialogueBinding, followUp.question) : null;
    const payload = { subject: row.subject, requestId:b.requestId,profileId:row.profile_id,topic,
      question:context?.question || question,attempt,mode:b.mode,hintLevel:b.hintLevel,simpler:b.simpler,externalConsent,
      ...(course ? { courseContext: course.courseContext, courseRevision: course.courseRevision } : {}),
      ...(dialogue ? { dialogue } : {}) };
    requireValue(Buffer.byteLength(JSON.stringify(payload), 'utf8') <= 8192, 'LEARNING_ASSISTANT_INPUT_INVALID');
    cleanup();
    const requestKey = tokenHash(id + ':' + b.requestId), settingsVersion = row.version;
    store.transaction(() => {
      requireValue(!store.row('SELECT request_key FROM learning_assistant_requests WHERE request_key=?', requestKey), 'LEARNING_ASSISTANT_REQUEST_REPLAY', 409);
      requireValue(!store.row("SELECT request_key FROM learning_assistant_requests WHERE status='running'"), 'LEARNING_ASSISTANT_BUSY', 429);
      requireValue(used(id) < row.daily_limit, 'LEARNING_ASSISTANT_QUOTA', 429);
      store.limit('learning_assistant_requests', MAX_REQUESTS);
      store.run(`INSERT INTO learning_assistant_usage(learner_id,day,requests) VALUES(?,?,1)
        ON CONFLICT(learner_id,day) DO UPDATE SET requests=requests+1`,id,day());
      store.run("INSERT INTO learning_assistant_requests(request_key,learner_id,profile_id,topic,status,created_at,updated_at) VALUES(?,?,?,?,'running',?,?)",requestKey,id,row.profile_id,topic,store.clock(),store.clock());
    });
    const controller = new AbortController();
    const disconnected = () => { if (!res.writableEnded) controller.abort(); }; res.once('close',disconnected);
    try {
      if (context) {
        // Mark assistance before a response can be observed or counted as an
        // independent solution. A concurrent version change fails closed.
        store.action(req.learningAuth, context.attempt.id, { opId: 'assistant-' + b.requestId,
          expectedVersion: context.attempt.version, type: 'hint', payload: { step: b.hintLevel-1 } });
      }
      const result = await bridgeCall(config, 'ask', payload, fetchImpl, controller.signal);
      const answer = checkedAnswer(result.answer,topic,config.key);
      if (course) requireValue(answer.verification === 'curated-guidance'
        && canonical(result.answer.courseContext) === canonical(course.courseContext)
        && result.answer.courseRevision === course.courseRevision, 'LEARNING_ASSISTANT_RESPONSE_INVALID', 503);
      requireValue(answer.verification !== 'model-unverified' || externalConsent, 'LEARNING_ASSISTANT_RESPONSE_INVALID', 503);
      requireValue(result.notice===undefined || (typeof result.notice==='string' && !result.notice.includes(config.key)), 'LEARNING_ASSISTANT_RESPONSE_INVALID',503);
      const notice = result.notice === undefined ? undefined : mathText(result.notice, 800, true);
      recheck(req,id);
      const current = settings(id);
      requireValue(current?.enabled && current.version === settingsVersion && !examActive(id), 'LEARNING_ASSISTANT_SETTINGS_CHANGED', 409);
      if(context)structuredContext(req.learningAuth,b.attemptId,current.profile_id);
      store.run("UPDATE learning_assistant_requests SET status='done',answer_id=?,verification=?,updated_at=? WHERE request_key=? AND status='running'",answer.answerId,answer.verification,store.clock(),requestKey);
      // Only validated, delivered answers can become context. Deterministic
      // arithmetic sometimes contains long digit runs allowed for display but
      // disallowed by the external-transfer filter; do not cache those.
      const transferText = JSON.stringify({ title: answer.title, text: answer.text, steps: answer.steps, check: answer.check });
      const followUpAvailable = !course && row.external_allowed && config.external && !res.destroyed
        && (!followUp || answer.verification === 'model-unverified') && !containsSensitive(transferText)
        && dialogues.remember(answer.answerId.toLowerCase(), dialogueBinding, followUp?.question || context?.question || question, answer, followUp?.answerId);
      res.json({ok:true,answer,...(notice ? {notice}:{}),remaining:Math.max(0,row.daily_limit-used(id)),
        followUpAvailable: !!followUpAvailable,
        contextMode:course ? 'course-task' : context?.question ? 'current-task' : 'entered',mode:answer.verification === 'model-unverified' ? 'api' : 'offline',
        ...(course ? { courseContext: course.courseContext, courseTask: { title: course.title, stepCount: course.stepCount } } : {}) });
    } catch (error) {
      store.run("UPDATE learning_assistant_requests SET status='failed',updated_at=? WHERE request_key=? AND status='running'",store.clock(),requestKey);
      throw error;
    } finally { res.removeListener('close',disconnected); }
  }));
  router.post('/assistant/feedback', authMiddleware, mutationMiddleware, handler(async (req,res) => {
    requireValue(req.learningAuth.role === 'student', 'LEARNING_FORBIDDEN', 403); exactKeys(req.query, []);
    exactKeys(req.body,['answerId','rating'],['answerId','rating']);
    const id=req.learningAuth.id,b=req.body,row=settings(id);
    requireValue(config.enabled && row?.enabled,'LEARNING_ASSISTANT_DISABLED',403);
    requireValue(ID.test(b.answerId || '') && ['helpful','simpler','incorrect'].includes(b.rating),'LEARNING_ASSISTANT_INPUT_INVALID');
    const answer=store.row("SELECT * FROM learning_assistant_requests WHERE learner_id=? AND answer_id=? AND status='done'",id,b.answerId);
    requireValue(answer && answer.created_at >= store.clock()-3600000,'LEARNING_NOT_FOUND',404);
    if(answer.feedback===b.rating){res.json({ok:true,duplicate:true});return;}
    requireValue(answer.feedback==null,'LEARNING_ASSISTANT_FEEDBACK_CONFLICT',409);
    store.run("UPDATE learning_assistant_requests SET feedback='pending',updated_at=? WHERE request_key=? AND feedback IS NULL",store.clock(),answer.request_key);
    await bridgeCall(config,'feedback',{subject:row.subject,answerId:b.answerId,rating:b.rating},fetchImpl);
    recheck(req,id);
    requireValue(settings(id)?.enabled && settings(id)?.version===row.version,'LEARNING_ASSISTANT_SETTINGS_CHANGED',409);
    store.run('UPDATE learning_assistant_requests SET feedback=?,updated_at=? WHERE request_key=?',b.rating,store.clock(),answer.request_key);
    res.json({ok:true});
  }));
  router.use(require('./learning-assistant-practice').createPracticeRouter(learning, { enabled: config.enabled, settings, examActive, recheck }));
  return { router, config, cleanup, catalog };
}

module.exports = { createLearningAssistantRouter, initializeAssistant, loadAssistantConfig, bridgeCall, mathText, checkedAnswer };
