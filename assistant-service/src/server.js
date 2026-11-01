import http from 'node:http';
import { readRelease } from './release.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import { loadConfig, pricesFresh } from './config.js';
import { AssistantError, requireValue, exactKeys } from './errors.js';
import { AssistantStore, secretEqual, hash } from './store.js';
import { parseQuestion } from './privacy.js';
import { isProviderTopic, listTopics, getBuiltinKnowledge, answerOffline } from './tutor.js';
import { createCabinetBridge, executeAssistantAnswer } from './cabinet-bridge.js';

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const ASSETS = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']], ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/study-tools.js', ['study-tools.js', 'text/javascript; charset=utf-8']],
  ['/study-ui.js', ['study-ui.js', 'text/javascript; charset=utf-8']],
  ['/learning-aids.js', ['learning-aids.js', 'text/javascript; charset=utf-8']]
]);
const COMMON_HEADERS = {
  'Cache-Control': 'no-store', 'Pragma': 'no-cache', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY', 'Cross-Origin-Resource-Policy': 'same-origin', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  'X-Robots-Tag': 'noindex, nofollow, noarchive'
};
function tokenFrom(req) {
  const cookies = String(req.headers.cookie || '').split(';').map(item => item.trim()).filter(item => item.startsWith('mathexam_assistant='));
  return cookies.length === 1 ? cookies[0].slice('mathexam_assistant='.length) : '';
}
async function readBody(req, limit) {
  requireValue(/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type'] || ''), 'JSON_REQUIRED', 415);
  requireValue(!req.headers['content-encoding'] || req.headers['content-encoding'] === 'identity', 'BODY_ENCODING_REJECTED', 415);
  const length = req.headers['content-length'];
  requireValue(!length || (/^\d+$/.test(length) && Number(length) <= limit), 'BODY_TOO_LARGE', 413);
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; requireValue(size <= limit, 'BODY_TOO_LARGE', 413); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new AssistantError('JSON_INVALID'); }
}
function send(res, status, body, extra = {}) {
  if (res.destroyed || res.writableEnded) return;
  res.writeHead(status, { ...COMMON_HEADERS, 'Content-Type': 'application/json; charset=utf-8', ...extra });
  res.end(JSON.stringify(body));
}

export function createAssistantServer({ config = loadConfig(), clock = Date.now, fetchImpl = fetch } = {}) {
  const topics = listTopics();
  const store = new AssistantStore({ config, clock, builtinCards: getBuiltinKnowledge(), topics: topics.map(topic => topic.id) });
  const loginAttempts = new Map(), active = new Map(), ipSalt = randomBytes(32).toString('hex');
  const cabinetBridge = createCabinetBridge({ config, store, clock, fetchImpl, active, readBody, send });
  let globalLoginWindow = { start: clock(), count: 0 };
  const cleanup = setInterval(() => { try { store.cleanup(); } catch { /* Storage failure closes requests, never silently resets it. */ }
    for (const [key, value] of loginAttempts) if (value.start < clock() - 600000) loginAttempts.delete(key);
  }, 60000);
  cleanup.unref();
  const cookie = token => `mathexam_assistant=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token ? 3600 : 0}${config.cookieSecure ? '; Secure' : ''}`;

  const server = http.createServer(async (req, res) => {
    try {
      // Do not trust X-Forwarded-* for identity, host, Origin or local demo access.
      requireValue(typeof req.url === 'string' && !req.url.includes('?') && !req.url.includes('#'), 'ROUTE_NOT_FOUND', 404);
      if (req.method === 'GET' && req.url === '/healthz') { send(res, 200, { ok: true, service: 'mathexam-assistant', mode: config.mode }); return; }
      requireValue(req.headers.host === new URL(config.publicOrigin).host, 'HOST_REJECTED', 403);
      if (await cabinetBridge(req, res)) return;
      if (req.method === 'GET' && req.url === '/robots.txt') {
        res.writeHead(200, { ...COMMON_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' }); res.end('User-agent: *\nDisallow: /\n'); return;
      }
      if (req.method === 'GET' && ASSETS.has(req.url)) {
        const [filename, type] = ASSETS.get(req.url);
        const data = fs.readFileSync(path.join(PUBLIC, filename));
        res.writeHead(200, { ...COMMON_HEADERS, 'Content-Type': type }); res.end(data); return;
      }
      if (req.method === 'GET' && req.url === '/api/version') { send(res, 200, { ok: true, ...readRelease() }); return; }
      if (req.method === 'GET' && req.url === '/api/status') {
        send(res, 200, { ok: true, mode: config.mode, externalEnabled: config.mode === 'api' && pricesFresh(config, clock()) && !store.meta('provider_circuit'),
          providerLabel: config.providerLabel, localDemo: config.localDemo }); return;
      }
      const write = ['POST', 'DELETE'].includes(req.method);
      if (write) {
        requireValue(req.headers.origin === config.publicOrigin, 'ORIGIN_REJECTED', 403);
        requireValue(!req.headers['sec-fetch-site'] || req.headers['sec-fetch-site'] === 'same-origin', 'ORIGIN_REJECTED', 403);
      }
      if (req.method === 'POST' && req.url === '/api/session') {
        const now = clock();
        const key = hash(`${ipSalt}:${req.socket.remoteAddress || ''}`);
        const old = loginAttempts.get(key);
        const attempt = !old || now - old.start >= 600000 ? { start: now, count: 0 } : old;
        attempt.count++; loginAttempts.set(key, attempt);
        if (now - globalLoginWindow.start >= 600000) globalLoginWindow = { start: now, count: 0 };
        globalLoginWindow.count++;
        requireValue(attempt.count <= 20 && globalLoginWindow.count <= 100, 'LOGIN_RATE_LIMIT', 429);
        const body = await readBody(req, config.maxBodyBytes);
        requireValue(exactKeys(body, ['pilotKey']) && typeof body.pilotKey === 'string' && body.pilotKey.length <= 128, 'LOGIN_INVALID');
        requireValue(config.localDemo ? body.pilotKey === '' : secretEqual(body.pilotKey, config.pilotKey), 'ACCESS_DENIED', 401);
        // A shared browser starts fresh; the pilot secret is never persisted.
        const previous = tokenFrom(req);
        if (previous) { try { const session = store.session(previous); store.deleteSession(session.hash); } catch (error) { if (!(error instanceof AssistantError && error.status === 401)) throw error; } }
        const created = store.createSession();
        send(res, 201, { ok: true, csrf: created.csrf }, { 'Set-Cookie': cookie(created.token) }); return;
      }
      requireValue(req.url?.startsWith('/api/'), 'ROUTE_NOT_FOUND', 404);
      const session = store.session(tokenFrom(req));
      if (write) store.verifyCsrf(session, req.headers['x-assistant-csrf']);
      if (req.method === 'GET' && req.url === '/api/topics') { send(res, 200, { topics }); return; }
      if (req.method === 'DELETE' && req.url === '/api/session') {
        for (const task of active.values()) if (task.sessionHash === session.hash) task.controller.abort();
        store.deleteSession(session.hash); send(res, 200, { ok: true }, { 'Set-Cookie': cookie('') }); return;
      }
      if (req.method === 'POST' && req.url === '/api/feedback') {
        const body = await readBody(req, config.maxBodyBytes);
        requireValue(exactKeys(body, ['answerId', 'rating']) && typeof body.answerId === 'string' && body.answerId.length <= 64, 'FEEDBACK_INVALID');
        store.feedback(session.hash, body.answerId, body.rating); send(res, 200, { ok: true }); return;
      }
      if (req.method === 'POST' && req.url === '/api/ask') {
        const input = { ...parseQuestion(await readBody(req, config.maxBodyBytes), topics.map(topic => topic.id)), simpler: !!session.simpler };
        const cards = store.knowledge(input.topic);
        const offline = answerOffline(input, cards);
        const result = await executeAssistantAnswer({ config, store, clock, fetchImpl, active, res, session, input, cards, offline, externalAllowed: isProviderTopic(input.topic) });
        send(res, 200, result);
        return;
      }
      throw new AssistantError('ROUTE_NOT_FOUND', 404);
    } catch (error) {
      // No prompts, keys, request bodies, provider errors, database paths or
      // identifiers are logged or exposed by this boundary.
      const known = error instanceof AssistantError;
      send(res, known ? error.status : 503, { ok: false, error: known ? error.code : 'SERVICE_UNAVAILABLE' });
    }
  });
  server.requestTimeout = 10000; server.headersTimeout = 10000; server.keepAliveTimeout = 5000; server.maxHeadersCount = 40;
  server.on('clientError', (_error, socket) => { socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n'); });
  let closed = false;
  return { server, store, config,
    async close() {
      if (closed) return; closed = true; clearInterval(cleanup);
      for (const task of active.values()) task.controller.abort();
      if (server.listening) await new Promise(resolve => { server.close(resolve); server.closeIdleConnections(); });
      store.close();
    }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const app = createAssistantServer();
    app.server.listen(app.config.port, app.config.host, () => console.info(`MathExam assistant: ${app.config.mode}; listening on port ${app.config.port}`));
    for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => { app.close().then(() => process.exit(0), () => process.exit(1)); });
    app.server.on('error', () => { console.error('ASSISTANT_LISTEN_FAILED'); process.exitCode = 1; app.close(); });
  } catch (error) { console.error(error instanceof AssistantError ? error.code : 'ASSISTANT_START_FAILED'); process.exitCode = 1; }
}
