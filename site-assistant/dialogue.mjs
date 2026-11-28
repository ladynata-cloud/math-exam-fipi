// Adapters for the same reviewed rules used in the two public interfaces.
import { readFileSync } from 'node:fs';
import navigator from '../assets/assistant/navigator-data.js';
import division from '../assets/assistant/division-dialogue.js';
import reader from './reader/search.cjs';

const mathOrigin = 'https://mathexam.space';
const mathEntries = new Map(navigator.catalogue.map(entry => [entry.url, entry]));
const { before, after } = JSON.parse(readFileSync(new URL('./reader/pilot.json', import.meta.url), 'utf8'));
const works = new Map(before.map((card, index) => [card.id, index]));
const analyses = new Map(after.map(record => [record.card_id, record]));
const indexes = before.map(card => reader.indexCard({ ...card, cues: card.cues.join(' ') }));
const divisionSteps = new Set(['start', 'count', 'digit', 'product', 'subtract', 'remainder-check',
  'bring', 'partial', 'comma', 'answer', 'final-remainder', 'verify',
  'shift-count', 'shift-factor', 'shift-divisor', 'shift-dividend']);

export class InvalidTurn extends Error {}
const object = input => input !== null && typeof input === 'object' && !Array.isArray(input);
function requireInput(valid) {
  if (!valid) throw new InvalidTurn('Invalid request fields');
}
function fields(value, allowed) {
  requireInput(object(value) && Object.keys(value).every(key => allowed.includes(key)));
}

function navigatorTurn(message, context, state) {
  fields(context, ['surface', 'pathname']);
  const pathname = context.pathname ?? '/';
  requireInput(typeof pathname === 'string' && pathname.length <= 500 && /^\/(?!\/)[\w./-]*$/.test(pathname));
  const result = navigator.respond({ text: message, pathname, dialog: state.dialog,
    difficultyCount: state.difficultyCount, referralShown: state.referralShown });
  const links = result.links.map(link => {
    const entry = mathEntries.get(link.url);
    return { id: entry.id, label: link.title, url: new URL(entry.url, mathOrigin).href };
  });
  return { reply: result.text, links, kind: result.kind, actions: result.actions ?? [],
    state: { surface: 'navigator', dialog: result.dialog ?? {}, difficultyCount: result.difficultyCount,
      referralShown: result.referralShown } };
}

function divisionTurn(message, context, state) {
  fields(context, ['surface', 'step', 'divisor', 'partial', 'attempt', 'dividend', 'originalDivisor', 'quotientStarted', 'placeExponent']);
  const { step, divisor, partial, attempt, dividend, originalDivisor } = context;
  requireInput(divisionSteps.has(step) && Number.isSafeInteger(divisor) && divisor > 0 && divisor <= 1e9);
  requireInput(partial == null || (Number.isSafeInteger(partial) && partial >= 0 && partial <= 1e12));
  requireInput(step !== 'digit' || partial == null || partial < 10 * divisor);
  requireInput(attempt == null || (Number.isInteger(attempt) && attempt >= 0 && attempt <= 9));
  requireInput(context.quotientStarted == null || typeof context.quotientStarted === 'boolean');
  requireInput(context.placeExponent == null || Number.isInteger(context.placeExponent) && context.placeExponent >= -20 && context.placeExponent <= 8);
  for (const quantity of [dividend, originalDivisor]) {
    requireInput(quantity == null || typeof quantity === 'string' && /^\d{1,12}(?:[.,]\d{1,6})?$/.test(quantity));
  }
  // Apply a previous intent only for the exact current operation and step.
  const frame = [step, divisor, partial ?? '', dividend ?? '', originalDivisor ?? '', context.quotientStarted ?? '', context.placeExponent ?? ''].join('/');
  const previous = state.frame === frame ? {intent:typeof state.intent === 'string' ? state.intent : '',
    attempt:Number.isInteger(state.attempt) && state.attempt >= 0 && state.attempt <= 9 ? state.attempt : undefined,
    nativeAttempt:Number.isInteger(state.nativeAttempt) && state.nativeAttempt >= 0 && state.nativeAttempt <= 9 ? state.nativeAttempt : null} : {};
  const result = division.reply(message, context, previous);
  const candidate = result.attempt ?? (previous.nativeAttempt !== (attempt ?? null) ? attempt : previous.attempt ?? attempt);
  return { reply: result.text, links: [], state: { surface: 'division', frame, intent: result.intent,
    nativeAttempt:attempt ?? null,
    ...(Number.isInteger(candidate) && candidate >= 0 && candidate <= 9 ? {attempt:candidate} : {}) } };
}

function readerTurn(message, context, state) {
  fields(context, ['surface', 'mode', 'workId']);
  requireInput(['before_reading','after_reading'].includes(context.mode));
  requireInput(context.workId == null || works.has(context.workId));
  // A request for the safe mode takes precedence over stale client state.
  const safe = reader.asksForSafeMode(message);
  if (context.mode === 'after_reading' && !safe) {
    requireInput(works.has(context.workId));
    const record = analyses.get(context.workId);
    const previous = state.workId === context.workId && Number.isInteger(state.paragraph) ? state.paragraph : -1;
    const result = reader.afterReadingReply(record, message, previous);
    const sources = [record.url, ...(record.sections ?? []).map(s => s.url), ...record.sources.map(s => s.url)];
    const links = result.links.map(link => {
      const index = sources.indexOf(link.url);
      if (index === -1) throw new Error('Unknown source returned by reader');
      return { id: index === 0 ? record.card_id : record.card_id + '-source-' + index, label: link.label, url: link.url };
    });
    return { reply: result.text, links, state: { surface: 'reader', mode: 'after_reading',
      workId: context.workId, paragraph: result.paragraph } };
  }
  let candidates = [];
  if (state.mode === 'before_reading' && Array.isArray(state.candidates)) {
    candidates = [...new Set(state.candidates)].filter(id => works.has(id)).map(id => works.get(id));
  }
  if (context.workId) candidates = [works.get(context.workId)];
  let result = reader.firstReadingReply(before, indexes, candidates, message);
  if (!result.matched && safe && candidates.length === 1 && result.indices.includes(candidates[0]) && !/[«“„"]/u.test(message)) {
    // The reader may simply say «без спойлеров» after discussing a particular work.
    result = reader.firstReadingReply(before, indexes, candidates, before[candidates[0]].title);
  }
  return { reply: result.text, links: result.links, state: { surface: 'reader', mode: 'before_reading',
    candidates: result.indices.map(index => before[index].id) } };
}

export function respond(input) {
  fields(input, ['site', 'message', 'context', 'state']);
  const { site, message, context } = input;
  requireInput(typeof message === 'string' && message.trim().length > 0 && message.length <= 500 &&
               object(context) && (!Object.hasOwn(input,'state') || input.state == null || object(input.state)));
  const state = input.state?.surface === context.surface ? input.state : {};
  let result;
  if (site === 'uzel' && context.surface === 'reader') result = readerTurn(message.trim(), context, state);
  else if (site === 'mathexam' && context.surface === 'navigator') result = navigatorTurn(message.trim(), context, state);
  else if (site === 'mathexam' && context.surface === 'division') result = divisionTurn(message.trim(), context, state);
  else throw new InvalidTurn('Unsupported site or surface');
  return { version: 1, site, ...result };
}
