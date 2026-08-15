import path from 'node:path';

const DEFAULT_ORIGINS = 'http://127.0.0.1:8000,http://localhost:8000';

function integer(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.min(maximum, parsed));
}

function csv(value) {
  return [...new Set(String(value || '').split(',').map((item) => item.trim()).filter(Boolean))];
}

function checkedUrl(raw, production) {
  let value;
  try {
    value = new URL(raw);
  } catch {
    throw new Error('VIDEO_STUDIO_URL must be an absolute URL');
  }
  if (!['http:', 'https:'].includes(value.protocol)) {
    throw new Error('VIDEO_STUDIO_URL must use HTTP or HTTPS');
  }
  if (production && value.protocol !== 'https:') {
    throw new Error('VIDEO_STUDIO_URL must use HTTPS in production');
  }
  value.hash = '';
  value.username = '';
  value.password = '';
  return value.toString();
}

export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const adminToken = String(env.VIDEO_ADMIN_TOKEN || '');
  if (production && adminToken.length < 32) {
    throw new Error('VIDEO_ADMIN_TOKEN must have at least 32 characters');
  }
  const allowedOrigins = csv(env.VIDEO_ALLOWED_ORIGINS || (production ? '' : DEFAULT_ORIGINS));
  const ttsProvider = String(env.VIDEO_TTS_PROVIDER || (production ? '' : 'mock')).toLowerCase();
  const studioUrl = checkedUrl(
    env.VIDEO_STUDIO_URL || 'http://127.0.0.1:8000/trainers/dvi/math-18-20-video-studio.html',
    production,
  );
  const dataDir = path.resolve(env.VIDEO_DATA_DIR || (production ? '/data' : './.video-data'));

  if (!['openai', 'yandex', 'mock'].includes(ttsProvider)) {
    throw new Error('VIDEO_TTS_PROVIDER must be openai, yandex or mock');
  }
  if (production) {
    if (!allowedOrigins.length || allowedOrigins.some((origin) => !origin.startsWith('https://'))) {
      throw new Error('VIDEO_ALLOWED_ORIGINS must contain explicit HTTPS origins');
    }
    if (ttsProvider === 'mock') throw new Error('Mock speech is disabled in production');
    if (env.VIDEO_PERSISTENCE_CONFIRMED !== '1') {
      throw new Error('VIDEO_PERSISTENCE_CONFIRMED=1 is required in production');
    }
  }
  if (ttsProvider === 'openai' && !env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required');
  if (ttsProvider === 'yandex' && (!env.YANDEX_API_KEY || !env.YANDEX_FOLDER_ID)) {
    throw new Error('YANDEX_API_KEY and YANDEX_FOLDER_ID are required');
  }

  const maxOutputBytes = integer(env.VIDEO_MAX_OUTPUT_MB, 500, 20, 2000) * 1024 * 1024;
  const maxRetainedBytes = integer(env.VIDEO_MAX_RETAINED_MB, 4096, 100, 20_000) * 1024 * 1024;
  const maxWorkBytes = integer(env.VIDEO_MAX_WORK_MB, 1024, 100, 5000) * 1024 * 1024;
  const commandTimeoutMs = integer(env.VIDEO_COMMAND_TIMEOUT_SECONDS, 180, 30, 900) * 1000;
  const workerLockStaleMs = integer(env.VIDEO_WORKER_LOCK_STALE_SECONDS, 300, 60, 3600) * 1000;
  const workerLockWaitMs = integer(env.VIDEO_WORKER_LOCK_WAIT_SECONDS, 360, 0, 3600) * 1000;
  if (maxRetainedBytes < maxOutputBytes) {
    throw new Error('VIDEO_MAX_RETAINED_MB must be at least VIDEO_MAX_OUTPUT_MB');
  }
  if (workerLockStaleMs <= Math.max(commandTimeoutMs, 120_000) + 30_000) {
    throw new Error('VIDEO_WORKER_LOCK_STALE_SECONDS must exceed the longest external operation by 30 seconds');
  }

  return Object.freeze({
    production,
    port: integer(env.PORT, 3000, 1, 65535),
    adminToken,
    allowedOrigins,
    studioUrl,
    dataDir,
    jobDir: path.join(dataDir, 'jobs'),
    mediaDir: path.join(dataDir, 'videos'),
    workDir: path.join(dataDir, 'work'),
    ttsProvider,
    openaiKey: env.OPENAI_API_KEY || '',
    openaiModel: env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
    openaiVoice: env.OPENAI_TTS_VOICE || 'marin',
    yandexKey: env.YANDEX_API_KEY || '',
    yandexFolderId: env.YANDEX_FOLDER_ID || '',
    yandexVoice: env.YANDEX_TTS_VOICE || 'alena',
    maxPendingJobs: integer(env.VIDEO_MAX_PENDING_JOBS, 4, 1, 100),
    maxJobsPerHour: integer(env.VIDEO_MAX_JOBS_PER_HOUR, 4, 1, 100),
    dailyTtsCharacterBudget: integer(env.VIDEO_DAILY_TTS_CHAR_BUDGET, 120_000, 30_000, 3_000_000),
    maxTtsCharactersPerJob: 30_000,
    maxOutputBytes,
    maxRetainedBytes,
    maxWorkBytes,
    retentionDays: integer(env.VIDEO_RETENTION_DAYS, 30, 1, 365),
    commandTimeoutMs,
    workerLockStaleMs,
    workerLockWaitMs,
    ffmpegPath: env.FFMPEG_PATH || 'ffmpeg',
    ffprobePath: env.FFPROBE_PATH || 'ffprobe',
  });
}
