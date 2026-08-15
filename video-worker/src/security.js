import crypto from 'node:crypto';

function digest(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest();
}

export function authorized(header, expectedToken) {
  if (!expectedToken || typeof header !== 'string' || !header.startsWith('Bearer ')) return false;
  const supplied = header.slice(7);
  return supplied.length > 0 && crypto.timingSafeEqual(digest(supplied), digest(expectedToken));
}

export function isAllowedOrigin(origin, allowedOrigins) {
  return typeof origin === 'string' && allowedOrigins.includes(origin);
}

export function safeError(error) {
  const message = error instanceof Error ? error.message : String(error || 'Unknown error');
  return message
    .replace(/Bearer\s+[^\s]+/gi, 'Bearer [redacted]')
    .replace(/(?:sk|AQVN)[-_A-Za-z0-9]{12,}/g, '[redacted]')
    .slice(0, 500);
}

export function publicJob(job) {
  return {
    id: job.id,
    status: job.status,
    task: job.request.task,
    preset: job.request.preset,
    format: job.request.format,
    captions: job.request.captions,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    progress: job.progress || null,
    error: job.status === 'failed' ? job.error || 'Не удалось собрать видео' : null,
    videoReady: job.status === 'ready',
  };
}

