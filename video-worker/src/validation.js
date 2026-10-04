const SCHOOL_TASKS = new Set(['homework-help', 'linear-equation', 'adjacent-angles']);
const TASKS = new Set(['18', '19', '20', ...SCHOOL_TASKS]);
const FORMATS = new Set(['16:9', '9:16']);
const VIDEO_TYPES = new Set(['ideal-solution', 'student-path']);
const AUDIO_MODES = new Set(['silent', 'clicks', 'voice']);
const REQUEST_KEYS = new Set(['task', 'preset', 'format', 'captions', 'videoType', 'audioMode']);

export function validateJobRequest(input, options = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Требуется описание видео');
  }
  for (const key of Object.keys(input)) {
    if (!REQUEST_KEYS.has(key)) throw new Error(`Неизвестный параметр: ${key}`);
  }
  const task = String(input.task || '');
  const preset = Number(input.preset);
  const format = String(input.format || '16:9');
  if (!TASKS.has(task)) throw new Error('Доступны задачи 18, 19 и 20 и готовые школьные видеоуроки');
  if (!Number.isInteger(preset) || preset < 1 || preset > 3) {
    throw new Error('Доступны варианты 1, 2 и 3');
  }
  if (!FORMATS.has(format)) throw new Error('Формат должен быть 16:9 или 9:16');
  if (input.captions !== undefined && typeof input.captions !== 'boolean') {
    throw new Error('Параметр субтитров должен быть логическим');
  }
  const videoType = input.videoType === undefined ? 'ideal-solution' : String(input.videoType);
  if (!VIDEO_TYPES.has(videoType)) {
    throw new Error('Тип видео должен быть ideal-solution или student-path');
  }
  if (isSchoolTask(task) && videoType !== 'ideal-solution') {
    throw new Error('Школьные видеоуроки поддерживают только ideal-solution');
  }
  if (input.audioMode !== undefined && !AUDIO_MODES.has(input.audioMode)) {
    throw new Error('Режим звука должен быть silent, clicks или voice');
  }
  if (input.audioMode === 'voice' && !['openai', 'yandex'].includes(options.ttsProvider)) {
    throw new Error('Автоматическая озвучка требует настроенного провайдера OpenAI или Yandex');
  }
  const audioMode = resolveAudioMode(input, options.ttsProvider);
  const captions = isSchoolTask(task) || audioMode !== 'voice' ? true : input.captions !== false;
  return Object.freeze({ task, preset, format, captions, videoType,
    ...(input.audioMode !== undefined ? { audioMode: input.audioMode } : {}),
  });
}

export function resolveAudioMode(request, provider) {
  return request.audioMode || (['silent', 'mock'].includes(provider) ? 'clicks' : 'voice');
}

export function isSchoolTask(task) {
  return SCHOOL_TASKS.has(task);
}

export function studioUrlFor(task, studioUrl) {
  return isSchoolTask(task) ? new URL('/video-lessons/studio.html', studioUrl).toString() : studioUrl;
}

export function viewportFor(format, task) {
  if (isSchoolTask(task)) {
    return format === '9:16' ? { width: 720, height: 1280 } : { width: 1280, height: 720 };
  }
  return format === '9:16' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
}
