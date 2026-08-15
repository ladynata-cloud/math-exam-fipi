import fs from 'node:fs';
import path from 'node:path';
import { authorized, isAllowedOrigin, publicError, publicJob } from './security.js';
import { validateJobRequest } from './validation.js';

const BODY_LIMIT = 16 * 1024;
const JOB_ROUTE = /^\/api\/v1\/jobs\/(vid_[A-Za-z0-9_-]{20,40})$/;
const VIDEO_ROUTE = /^\/api\/v1\/jobs\/(vid_[A-Za-z0-9_-]{20,40})\/video$/;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9._~-]{16,128}$/;

function setCommon(response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
}

function json(response, status, body) {
  setCommon(response);
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(`${JSON.stringify(body)}\n`);
}

async function readJson(request) {
  if (!String(request.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    const error = new Error('Content-Type must be application/json');
    error.status = 415;
    throw error;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > BODY_LIMIT) {
      const error = new Error('Request body is too large');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('Request body must be valid JSON');
    error.status = 400;
    throw error;
  }
}

function allowCors(request, response, config) {
  const origin = request.headers.origin;
  if (!isAllowedOrigin(origin, config.allowedOrigins)) return false;
  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key');
  response.setHeader('Access-Control-Max-Age', '600');
  response.setHeader('Vary', 'Origin');
  return true;
}

function safeOutput(job, config) {
  if (!job.output || job.status !== 'ready') return null;
  const target = path.resolve(job.output);
  const root = `${path.resolve(config.mediaDir)}${path.sep}`;
  if (!target.startsWith(root) || path.basename(target) !== `${job.id}.mp4`) return null;
  return target;
}

export function createRequestHandler({ config, store, queue }) {
  return async function handler(request, response) {
    try {
      const url = new URL(request.url || '/', 'http://video-worker.local');
      if (request.method === 'GET' && url.pathname === '/healthz') {
        const health = store.health();
        return json(response, health.ok ? 200 : 503, {
          ok: health.ok, service: 'mathexam-video-worker', queue: store.counts(),
        });
      }

      const corsAllowed = allowCors(request, response, config);
      if (request.method === 'OPTIONS') {
        if (!corsAllowed) return json(response, 403, { error: 'Origin is not allowed' });
        setCommon(response);
        response.statusCode = 204;
        return response.end();
      }
      if (!corsAllowed) return json(response, 403, { error: 'Origin is not allowed' });
      if (!authorized(request.headers.authorization, config.adminToken)) {
        response.setHeader('WWW-Authenticate', 'Bearer');
        return json(response, 401, { error: 'Authorization required' });
      }

      if (request.method === 'POST' && url.pathname === '/api/v1/jobs') {
        const idempotencyKey = String(request.headers['idempotency-key'] || '');
        if (!IDEMPOTENCY_KEY.test(idempotencyKey)) {
          return json(response, 400, { error: 'Требуется корректный Idempotency-Key' });
        }
        let jobRequest;
        try {
          jobRequest = validateJobRequest(await readJson(request));
        } catch (error) {
          if (!Number.isInteger(error.status)) error.status = 400;
          throw error;
        }
        const admitted = await store.admit(jobRequest, idempotencyKey);
        if (!admitted.reused) queue.enqueue(admitted.job.id);
        return json(response, admitted.reused ? 200 : 202, { job: publicJob(admitted.job), reused: admitted.reused });
      }

      const videoMatch = url.pathname.match(VIDEO_ROUTE);
      if (request.method === 'GET' && videoMatch) {
        const job = store.get(videoMatch[1]);
        if (!job) return json(response, 404, { error: 'Видео не найдено' });
        const target = safeOutput(job, config);
        if (!target || !fs.existsSync(target)) return json(response, 409, { error: 'Видео ещё не готово' });
        const stat = fs.statSync(target);
        setCommon(response);
        response.statusCode = 200;
        response.setHeader('Content-Type', 'video/mp4');
        response.setHeader('Content-Length', stat.size);
        response.setHeader('Content-Disposition', `attachment; filename="mathexam-task-${job.request.task}-variant-${job.request.preset}.mp4"`);
        return fs.createReadStream(target).pipe(response);
      }

      const jobMatch = url.pathname.match(JOB_ROUTE);
      if (request.method === 'GET' && jobMatch) {
        const job = store.get(jobMatch[1]);
        if (!job) return json(response, 404, { error: 'Задание не найдено' });
        return json(response, 200, { job: publicJob(job) });
      }

      return json(response, 404, { error: 'Not found' });
    } catch (error) {
      const status = Number.isInteger(error.status) ? error.status : 500;
      return json(response, status, { error: publicError(error), code: error.code || 'VIDEO_SERVICE_ERROR' });
    }
  };
}
