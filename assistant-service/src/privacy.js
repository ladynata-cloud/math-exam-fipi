import { requireValue, exactKeys } from './errors.js';

// A rejection aid, not a proof of anonymisation. The pilot also requires no
// personal data at entry, excludes cabinet access and stores no conversations.
export function containsSensitiveText(value) {
  const text = value.normalize('NFKC');
  return /[\w.+-]+@[\w.-]+\.[a-zа-я]{2,}/iu.test(text)
    || /(?:https?:\/\/|www\.|t\.me\/|vk\.com\/|@\w{3})/iu.test(text)
    || /(?:\+?\d[\d ()-]{7,}\d)/u.test(text)
    || /(?:меня\s+зовут|моя\s+фамилия|мой\s+адрес|телефон|пароль|пин[ -]?код|\bpin\b|\bpassword\b|\btoken\b|sk-[a-z0-9]{8})/iu.test(text);
}
function taskText(value, min, max) {
  requireValue(typeof value === 'string' && value.length >= min && value.length <= max, 'TASK_INVALID');
  const text = value.normalize('NFKC').trim();
  requireValue(text.length >= min && text.length <= max && !/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(text), 'TASK_INVALID');
  requireValue(!containsSensitiveText(text), 'PERSONAL_DATA_REJECTED');
  return text;
}
export function parseQuestion(body, topics) {
  requireValue(exactKeys(body, ['topic', 'question', 'attempt', 'hintLevel', 'mode', 'externalConsent', 'requestId']), 'TASK_INVALID');
  requireValue(topics.includes(body.topic), 'TOPIC_INVALID');
  requireValue(Number.isInteger(body.hintLevel) && body.hintLevel >= 1 && body.hintLevel <= 5, 'TASK_INVALID');
  requireValue(['hint', 'explain'].includes(body.mode) && typeof body.externalConsent === 'boolean', 'TASK_INVALID');
  requireValue(typeof body.requestId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId), 'REQUEST_ID_INVALID');
  return {
    topic: body.topic, question: taskText(body.question, 1, 1000), attempt: taskText(body.attempt ?? '', 0, 400),
    hintLevel: body.hintLevel, mode: body.mode, externalConsent: body.externalConsent, requestId: body.requestId
  };
}
