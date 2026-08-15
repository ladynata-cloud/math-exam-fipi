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
    .replace(/[A-Za-z]:\\(?:[^\\\s:'\"]+\\)*[^\\\s:'\"]*/g, '[path]')
    .replace(/\/(?:data|app|tmp|home|workspace)(?:\/[^\s:'\"]*)?/g, '[path]')
    .slice(0, 500);
}

const JOB_ERRORS = Object.freeze({
  VIDEO_RENDER_FAILED: 'Не удалось собрать видео. Попробуйте ещё раз.',
  WORKER_LOCK_LOST: 'Сервис обновляется. Задание безопасно остановлено.',
  COMMAND_TIMEOUT: 'Сборка заняла слишком много времени и была остановлена.',
  WORK_BUDGET_EXCEEDED: 'Видео превысило допустимый размер рабочих файлов.',
  TTS_RESPONSE_TOO_LARGE: 'Озвучка превысила допустимый размер.',
});

export function publicError(error) {
  if (error && typeof error.publicMessage === 'string') return error.publicMessage;
  if (Number.isInteger(error && error.status) && error.status < 500) {
    return error instanceof Error ? error.message : 'Некорректный запрос';
  }
  return 'Видеосервис временно недоступен';
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
    error: job.status === 'failed' ? JOB_ERRORS[job.errorCode] || JOB_ERRORS.VIDEO_RENDER_FAILED : null,
    errorCode: job.status === 'failed' ? job.errorCode || 'VIDEO_RENDER_FAILED' : null,
    videoReady: job.status === 'ready',
  };
}
