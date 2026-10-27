import { exactKeys, requireValue } from './errors.js';
import { containsSensitiveText } from './privacy.js';

export function validateCard(card, topics) {
  requireValue(exactKeys(card, ['id', 'topic', 'title', 'explanation', 'steps', 'check', 'source', 'version'])
    && /^[a-z][a-z0-9-]{2,79}$/.test(card.id || '') && topics.includes(card.topic), 'KNOWLEDGE_INVALID');
  const prose = (text, max) => typeof text === 'string' && text.trim().length > 0 && text.length <= max
    && !/[<>\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e]/u.test(text) && !containsSensitiveText(text);
  requireValue(prose(card.title, 160) && prose(card.explanation, 1800) && prose(card.check, 600)
    && Array.isArray(card.steps) && card.steps.length >= 1 && card.steps.length <= 6
    && card.steps.every(step => prose(step, 600)), 'KNOWLEDGE_INVALID');
  requireValue(exactKeys(card.source, ['label', 'url']) && prose(card.source.label, 160), 'KNOWLEDGE_INVALID');
  let source;
  try { source = new URL(card.source.url); } catch { requireValue(false, 'KNOWLEDGE_SOURCE_INVALID'); }
  requireValue(source.protocol === 'https:' && !source.username && !source.password && !source.search
    && ((source.hostname === 'github.com' && source.pathname.startsWith('/ladynata-cloud/math-exam-fipi/'))
      || source.hostname === 'mathexam.space'), 'KNOWLEDGE_SOURCE_INVALID');
  requireValue(Number.isSafeInteger(card.version) && card.version >= 1 && card.version <= 1000000, 'KNOWLEDGE_INVALID');
  return JSON.parse(JSON.stringify(card));
}
