// Model text is never an oracle. Only bounded exact grammars and versioned,
// synthetic task references can corroborate extracted claims. No eval/LLM judge.
import { readFileSync } from 'node:fs';
import { parseLinearEquation } from './extended-math.js';
import { numeric, eq, rounded, decimal } from './math-kernel.js';
import { parseExact, eEqual, er } from './exact-roots.js';
import { parseIntervals, verifyIntervals } from './intervals.js';

const references = JSON.parse(readFileSync(new URL('../knowledge/model-reference-cases.json', import.meta.url))).cases;
const clean = s => s.trim().replace(/[−–—]/g, '-').replaceAll('х', 'x');
const key = s => clean(s).replace(/\s+/g, ' ');
const arithmeticTopics = new Set(['fractions', 'arithmetic-expressions', 'decimal-add-subtract',
  'decimal-multiply', 'decimal-divide']);

export function modelReference(input) {
  if (!input || typeof input.question !== 'string' || input.question.length > 1200) return null;
  const row = references.find(r => r.topic === input.topic && key(r.question) === key(input.question));
  if (row) return row.expected === null ? null : { id: row.id, kind: row.kind || 'scalar',
    value: row.kind && row.kind !== 'scalar' ? row.expected : parseExact(row.expected), unit: row.unit };
  try {
    if (input.topic === 'linear-equations') {
      const solved = parseLinearEquation(input.question);
      if (solved?.kind === 'one') return { id: 'exact-linear', value: er(solved.expected), unit: null };
    }
    if (arithmeticTopics.has(input.topic)) return {
      id: 'exact-arithmetic', value: er(numeric(clean(input.question).replaceAll(':', '/')).value), unit: null
    };
    if (['rounding', 'decimal-rounding'].includes(input.topic)) {
      const m = /^Округли\s+([+-]?\d{1,6}(?:[.,]\d{1,6})?)\s+до\s+(единиц|десятых|сотых|тысячных)$/iu.exec(input.question.trim());
      if (m) return { id: 'exact-rounding', value: er(rounded(decimal(m[1]),
        { единиц: 0, десятых: 1, сотых: 2, тысячных: 3 }[m[2].toLowerCase()])), unit: null };
    }
  } catch { /* Ambiguity, bounds or unsupported notation => no verification. */ }
  return null;
}

function scalar(raw) {
  let s = clean(raw), unit = null;
  const suffix = /\s*(см(?:\^?2|²)?|рублей|рубля|руб\.?|градусов|градуса|градус|°)\s*$/iu.exec(s);
  if (suffix) {
    unit = /^см/i.test(suffix[1]) ? /2|²/.test(suffix[1]) ? 'cm2' : 'cm'
      : /^руб/i.test(suffix[1]) ? 'rub' : 'deg';
    s = s.slice(0, suffix.index).trim();
  }
  try { return { value: parseExact(s.replaceAll(':', '/')), unit }; } catch { return null; }
}

function equationVerdict(claim, original) {
  const parts = claim.split('=').map(s => s.trim());
  if (parts.length < 2 || parts.some(s => !s)) return null;
  // Missing units in an intermediate scalar must not hide incompatible
  // recognized units elsewhere in the same equality chain.
  const units = parts.map(scalar).filter(v => v?.unit).map(v => v.unit);
  if (new Set(units).size > 1) return false;
  const root = /[xх]/u.test(claim) ? parseLinearEquation(original) : null;
  const verdicts = parts.slice(1).map((right, i) => {
    const left = parts[i], pair = `${left}=${right}`;
    if (/[xх]/u.test(pair)) {
      // Variable-bearing links must preserve the original solution set.
      // A numeric link such as 19-4=15 is a true computation, not a new
      // equation that is supposed to have the original unique root.
      const parsed = parseLinearEquation(pair);
      if (!root || !parsed) return null;
      return parsed.kind === root.kind && (parsed.kind !== 'one' || eq(parsed.expected, root.expected));
    }
    const a = scalar(left), b = scalar(right);
    if (!a || !b) return null;
    return eEqual(a.value, b.value) && (!a.unit || !b.unit || a.unit === b.unit);
  });
  // An unsupported neighbour cannot erase a recognized false equality.
  // Conversely, checking one numeric link cannot certify an unknown chain.
  if (verdicts.includes(false)) return false;
  return verdicts.includes(null) ? null : true;
}

function piMultiple(raw) {
  const s = clean(raw).replace(/\s+/g, '');
  if (/^[+-]?0$/.test(s)) return parseExact('0');
  const m = /^([+-]?)(?:(\d{1,6})(?:\/(\d{1,6}))?\*?)?(?:pi|π)(?:\/(\d{1,6}))?$/iu.exec(s);
  if (!m) throw Error('PI_MULTIPLE_UNSUPPORTED');
  return parseExact(`${m[1]}${m[2] || 1}/${m[3] || 1}/${m[4] || 1}`);
}

function finalVerdict(raw, reference) {
  if (!reference) return 'unverified';
  try {
    const s = raw.replace(/^[xх]\s*=\s*/iu, '');
    if (reference.kind === 'interval') {
      const verdict = verifyIntervals(parseIntervals(reference.value), s).status;
      return verdict === 'correct' ? 'matched' : verdict === 'incorrect' ? 'failed' : 'unverified';
    }
    if (['set', 'pi-set'].includes(reference.kind)) {
      const parse = reference.kind === 'pi-set' ? piMultiple : parseExact;
      const values = s.split(';').map(v => parse(v.trim()));
      const expected = reference.value.split(';').map(parse);
      const unique = values.filter((v, i) => !values.slice(0, i).some(w => eEqual(v, w)));
      return unique.length === expected.length && unique.every(v => expected.some(w => eEqual(v, w))) ? 'matched' : 'failed';
    }
    const values = s.split('=').map(scalar);
    if (!values.every(Boolean)) return 'unverified';
    return values.every(v => eEqual(v.value, reference.value)
      && (!v.unit || v.unit === reference.unit)) ? 'matched' : 'failed';
  } catch { return 'unverified'; }
}

// Only complete math runs, not a convenient substring of unsupported notation.
// Dots inside decimal numbers are retained. Prose claims remain unverified.
function fragments(s) {
  return s.split(/\n|[!?]|(?<!\d)\.(?!\d)|(?<=\d)\.(?!\d)/u).flatMap(v =>
    /^(?:ответ|итог|результат)(?=\s|:|=)/iu.test(v.trim()) ? [v] : v.split(';')).map(v => v.trim()).filter(Boolean);
}
function contextual(s) {
  return /[«»"“”]|(?:попытк|ошиб|неверн|неправильн|допустим|если|например|предполож|не равно|не получ)/iu.test(s);
}

export function verifyModelMathematics(input, answer) {
  const reference = modelReference(input), claims = [];
  let finalCount = 0, finalUnknown = false, finalMatched = false;
  const fields = [['title', answer.title], ['text', answer.text],
    ...answer.steps.map((s, i) => [`steps.${i}`, s]), ['check', answer.check]];
  for (const [field, value] of fields) for (const fragment of fragments(value)) {
    if (contextual(fragment)) {
      if (/[=\d]/u.test(fragment)) claims.push({ field, kind: 'context', status: 'unverified' });
      continue;
    }
    // Accept an explicit labelled result, a complete x=number, or the reported
    // PR420 wording without the forbidden label: «Значение x равно 6».
    const labelled = /^(?:ответ|итог|результат)(?=\s|:|=)(?:\s+(?:равен|равно))?\s*[:=]?\s*(.+)$/iu.exec(fragment)
      || /^(?:значение\s+[xх]\s+равно|[xх]\s+равен|[xх]\s+равно)\s+(.+)$/iu.exec(fragment);
    // Only a scalar linear unknown is necessarily the final result. In a
    // quadratic derivation x=2 may be one branch, and in geometry x can name
    // a given side. Do not mistake either for the complete requested answer.
    const bareX = input.topic === 'linear-equations' ? /^(?:[xх]\s*=\s*)([^=]+)$/u.exec(fragment) : null;
    const rawFinal = labelled?.[1] || bareX?.[1];
    if (rawFinal) {
      finalCount++;
      const status = finalVerdict(rawFinal, reference);
      if (status === 'unverified') finalUnknown = true;
      if (status === 'matched') finalMatched = true;
      claims.push({ field, kind: 'final', status });
    }
    // Unlabelled numbers may be intermediate values; no final-answer inference.
    if (fragment.includes('=')) {
      // Strip only known leading commentary. Unknown words/variables/functions
      // are not discarded to manufacture a checkable equation.
      const expression = fragment.replace(/^(?:ответ|итог|получаем|запиши|проверка)\s*:?\s*/iu, '');
      const verdict = equationVerdict(expression, input.question);
      claims.push({ field, kind: 'equation', status: verdict === null ? 'unverified' : verdict ? 'matched' : 'failed' });
    }
  }
  const failed = claims.some(c => c.status === 'failed');
  return {
    status: failed ? 'failed' : claims.some(c => c.status === 'matched') ? 'partial' : 'unverified',
    referenceId: reference?.id || null,
    finalAnswer: claims.some(c => c.kind === 'final' && c.status === 'failed') ? 'failed'
      : finalCount && finalMatched && !finalUnknown ? 'matched' : 'unverified',
    claims,
    // Matching an answer or several equations is NOT proof of the prose,
    // units omitted by the model, geometric reasoning or pedagogical quality.
    explanation: 'unverified', mathematicallyVerified: false
  };
}
