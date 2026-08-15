const TASKS = new Set(['18', '19', '20']);
const FORMATS = new Set(['16:9', '9:16']);
const VIDEO_TYPES = new Set(['ideal-solution', 'student-path']);
const REQUEST_KEYS = new Set(['task', 'preset', 'format', 'captions', 'videoType']);

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
  if (!TASKS.has(task)) throw new Error('Доступны только задачи 18, 19 и 20');
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
  const captions = options.ttsProvider === 'silent' ? true : input.captions !== false;
  return Object.freeze({ task, preset, format, captions, videoType });
}

export function viewportFor(format) {
  return format === '9:16' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
}
