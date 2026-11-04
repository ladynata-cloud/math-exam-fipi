'use strict';

/* Private harness oracle. Deliberately imports no trainer, contract, plan,
 * check or evaluate code. Inputs are saved task specifications; outputs must
 * never be passed to the pupil robot. Arithmetic uses exact BigInt values.
 * Lesson questions are outside this oracle's scope: it checks practice steps.
 */

const pow10 = n => 10n ** BigInt(n);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function decimal(raw) {
  const text = String(raw).trim().replace(',', '.');
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) throw Error('Expected an integer or finite decimal: ' + text);
  let units = BigInt((match[1] === '-' ? '-' : '') + match[2] + (match[3] || ''));
  let places = (match[3] || '').length;
  while (places && units % 10n === 0n) { units /= 10n; places--; }
  return {units, places};
}

function format(units, places = 0) {
  if (places < 0) return String(units * pow10(-places));
  const sign = units < 0n ? '-' : '';
  let text = String(units < 0n ? -units : units).padStart(places + 1, '0');
  if (places) text = (text.slice(0, -places) + ',' + text.slice(-places)).replace(/0+$/, '').replace(/,$/, '');
  return sign + text;
}

function numericEqual(left, right) {
  try {
    const a = decimal(left), b = decimal(right);
    return a.units * pow10(b.places) === b.units * pow10(a.places);
  } catch { return false; }
}

function explicitExpression(prompt) {
  const matches = String(prompt || '').match(/\d+(?:[,.]\d+)?(?:\s*[+−×:*÷/-]\s*\d+(?:[,.]\d+)?)+/g);
  return matches ? matches[matches.length - 1] : null;
}

function expressionEquals(expression, expected) {
  const tokens = expression.match(/\d+(?:[,.]\d+)?|[+−×:*÷/-]/g);
  const numbers = tokens.filter((_, i) => i % 2 === 0).map(raw => {
    const value = decimal(raw); return {n: value.units, d: pow10(value.places)};
  });
  const operators = tokens.filter((_, i) => i % 2 === 1);
  for (let i = 0; i < operators.length;) {
    if (['×', '*', ':', '÷', '/'].includes(operators[i])) {
      const a = numbers[i], b = numbers[i + 1], multiply = operators[i] === '×' || operators[i] === '*';
      const value = multiply ? {n: a.n * b.n, d: a.d * b.d} : {n: a.n * b.d, d: a.d * b.n};
      if (!value.d) throw Error('Zero divisor in explicit prompt expression');
      numbers.splice(i, 2, value); operators.splice(i, 1);
    } else i++;
  }
  let value = numbers[0];
  for (let i = 0; i < operators.length; i++) {
    const right = numbers[i + 1], sign = operators[i] === '+' ? 1n : -1n;
    value = {n: value.n * right.d + sign * right.n * value.d, d: value.d * right.d};
  }
  const target = decimal(expected);
  return value.n * pow10(target.places) === target.units * value.d;
}

function integer(raw) {
  const value = decimal(raw);
  if (value.places || value.units < 0n) throw Error('Expected a nonnegative integer: ' + raw);
  return value.units;
}

const digit = (value, col) => value / pow10(col) % 10n;
const action = (kind, expected, extra = {}) => ({kind, expected: String(expected), ...extra});

function multiplicationSteps(task) {
  const a = integer(task.a), b = integer(task.b);
  if (a < 10n || a > 9999n || b < 2n || b > 999n) throw Error('Multiplication operands outside the supported columns');
  const widthA = String(a).length, widthB = String(b).length, result = [];
  const emit = (kind, value, meta, effects = []) => result.push(action(kind, value, {multiplication: {...meta, effects}}));
  const place = (total, meta, last) => {
    emit('digit', total % 10n, {...meta, event: 'write'}, [{row: meta.row, col: meta.col, digit: Number(total % 10n)}]);
    const carry = total / 10n;
    if (carry) emit('digit', carry, {...meta, col: meta.col + 1, event: last ? 'write' : 'carry'},
      [{row: meta.row, col: meta.col + 1, digit: Number(carry), ...(last ? {} : {carry: true})}]);
  };
  for (let pass = 0; pass < widthB; pass++) {
    const multiplier = digit(b, pass), row = widthB === 1 ? 'RES' : 'P' + (pass + 1);
    for (let col = 0; col < widthA; col++) {
      // The incoming carry is derived from the entire lower prefix, not from
      // a saved step or the preceding answer.
      const base = digit(a, col) * multiplier;
      const carry = (a % pow10(col)) * multiplier / pow10(col);
      const meta = {phase: 'multiply', row, col: col + pass, operandColumn: col, multiplierColumn: pass};
      emit('product', base, {...meta, event: 'calculate'});
      if (carry) emit('product', base + carry, {...meta, event: 'add-carry'});
      place(base + carry, meta, col === widthA - 1);
    }
  }
  if (widthB > 1) {
    const parts = Array.from({length: widthB}, (_, i) => a * digit(b, i) * pow10(i));
    // A zero partial row still occupies its shifted column.
    const width = Math.max(...parts.map((part, i) => part === 0n ? i + 1 : String(part).length));
    for (let col = 0; col < width; col++) {
      const carry = parts.reduce((sum, part) => sum + part % pow10(col), 0n) / pow10(col);
      const total = parts.reduce((sum, part) => sum + digit(part, col), carry);
      const meta = {phase: 'add', row: 'RES', col};
      emit('product', total, {...meta, event: 'calculate'});
      place(total, {...meta, operandColumn: null, multiplierColumn: null}, col === width - 1);
    }
  }
  emit('answer', a * b, {phase: 'answer', row: 'RES', event: 'answer'});
  return result;
}

function divisionSteps(raw) {
  const a = decimal(raw.dividend), b = decimal(raw.divisor);
  if (a.units < 0n || b.units <= 0n) throw Error('Division requires a nonnegative dividend and positive divisor');
  if (raw.level === 'remainder' && (a.places || b.places)) throw Error('Remainder division requires integers');
  const n = format(a.units, a.places - b.places), d = b.units;
  const [whole, fraction = ''] = n.split(','), source = [...whole, ...fraction].map(BigInt);
  const originalLength = source.length, result = [];
  if (b.places) result.push(
    action('shift-count', b.places), action('shift-factor', pow10(b.places)),
    action('shift-divisor', d), action('shift-dividend', n));
  let at = 0, partial = source[0], quotient = '', remainder = 0n, cycle = 0;
  while (partial < d && at + 1 < whole.length) partial = partial * 10n + source[++at];
  result.push(action('start', partial, {sourceIndex: at}));
  for (;;) {
    if (cycle > 64 || source.length - originalLength > 32) throw Error('Nonterminating or unsupported long division');
    const q = partial / d, product = q * d;
    if (q > 9n) throw Error('Long division produced more than one digit');
    remainder = partial % d;
    result.push(action('digit', q, {cycle}), action('product', product, {cycle}), action('subtract', remainder, {cycle}));
    quotient += q;
    if (at === source.length - 1 && (raw.level === 'remainder' || remainder === 0n)) break;
    at++;
    if (at === whole.length) { result.push(action('comma', quotient + ',')); quotient += ','; }
    const appended = at === source.length;
    if (appended) source.push(0n);
    result.push(action('bring', source[at], {sourceIndex: at, appended}));
    partial = remainder * 10n + source[at];
    result.push(action('partial', partial, {sourceIndex: at}));
    cycle++;
  }
  const parsed = decimal(quotient), answer = format(parsed.units, parsed.places);
  // A second, whole-number identity checks the independent long-division
  // reconstruction against the original operands, including decimal scales.
  const left = parsed.units * b.units * pow10(a.places);
  const right = a.units * pow10(parsed.places + b.places);
  const remainderTerm = raw.level === 'remainder' ? remainder * pow10(a.places + parsed.places + b.places) : 0n;
  if (left + remainderTerm !== right) throw Error('Independent quotient identity failed');
  result.push(action('answer', answer));
  if (raw.level === 'remainder') result.push(action('final-remainder', remainder));
  result.push(action('verify', format(a.units, a.places)));
  return result;
}

function pair(text, symbol) {
  const match = new RegExp('(\\d+(?:[,.]\\d+)?)\\s*' + symbol + '\\s*(\\d+(?:[,.]\\d+)?)').exec(String(text));
  if (!match) throw Error('Missing operands in prompt: ' + text);
  return [integer(match[1]), integer(match[2])];
}

function prefixDivision(n, d) {
  if (d <= 0n) throw Error('Zero divisor');
  const digits = String(n);
  let count = 1;
  while (count < digits.length && BigInt(digits.slice(0, count)) < d) count++;
  const first = BigInt(digits.slice(0, count));
  return {digits, count, first, remainder: first % d};
}

function microSteps(slug, group) {
  if (slug === 'digit-choice') {
    const [n, d] = pair(group.prompt, ':'), q = n / d;
    if (q > 9n) throw Error('Micro division requires one digit');
    return [action('digit', q), action('product', q * d),
      ...(n % d && q < 9n ? [action('product', (q + 1n) * d)] : []), action('digit', q)];
  }
  if (slug === 'multiply-bridge') {
    const [a, b] = pair(group.prompt, '×'), [n, d] = pair(group.prompt, ':');
    if (a * b !== n || b !== d) throw Error('Multiplication/division bridge operands disagree');
    return [action('product', a * b), action('digit', n / d)];
  }
  if (slug === 'multiply-two-digit') {
    const [a, b] = pair(group.prompt, '×');
    return [action('product', a * (b / 10n * 10n)), action('product', a * (b % 10n)), action('answer', a * b)];
  }
  if (slug === 'subtract') {
    const [a, b] = pair(group.prompt, '[−-]');
    if (a < b) throw Error('Negative subtraction is outside this course');
    if (a >= 100n && a % 100n === 0n) {
      if (a - b < 1n || a - b > 9n) throw Error('Unsupported zero-borrowing micro exercise');
      return [action('product', 10), action('digit', 9), action('digit', 10n - b % 10n),
        action('digit', 9n - digit(b, 1)), action('digit', a / 100n - 1n - b / 100n), action('answer', a - b)];
    }
    const borrow = a % 10n < b % 10n ? 1n : 0n;
    return [action('digit', a % 10n + borrow * 10n - b % 10n),
      action('digit', a / 10n - borrow - b / 10n), action('answer', a - b)];
  }
  if (slug === 'first-part' || slug === 'bring-digit') {
    const [n, d] = pair(group.prompt, ':'), prefix = prefixDivision(n, d);
    if (slug === 'first-part') return [action('start', prefix.first, {visual: {
      kind: 'first', digits: String(n), divisor: String(d), sourceIndex: prefix.count - 1}})];
    if (prefix.count >= prefix.digits.length) throw Error('Bring-digit exercise has no next digit');
    const next = BigInt(prefix.digits[prefix.count]);
    const visual = {kind: 'bring', digits: String(n), divisor: String(d), sourceIndex: prefix.count, remainder: Number(prefix.remainder)};
    return [action('bring', next, {visual}), action('partial', prefix.remainder * 10n + next, {visual})];
  }
  throw Error('Unsupported arithmetic micro stage: ' + slug);
}

function estimateSteps(spec) {
  const prompt = String(spec.task?.prompt || ''), result = [];
  let n, d;
  if (/Подбери одну цифру для \d/.test(prompt)) [n, d] = pair(prompt, ':');
  else {
    // The zero example supplies the current partial separately from the full
    // division written in its story. It is not the quotient of 10032 : 33.
    const m = /Получилось (\d+)\./.exec(prompt);
    if (!m) throw Error('Missing current partial in estimation story');
    n = BigInt(m[1]); [, d] = pair(prompt, ':');
  }
  if (d < 10n || d > 99n || n >= d * 10n) throw Error('Unsupported one-digit estimation operands');
  if (n < d) return [action('product', d), action('digit', 0)];
  const roundTen = x => (x + 5n) / 10n * 10n;
  const roundedN = roundTen(n), roundedD = roundTen(d);
  if (roundedN % roundedD) throw Error('Estimate does not divide exactly');
  const estimate = roundedN / roundedD;
  let trial = estimate > 9n ? 9n : estimate;
  result.push(action('round', roundedD), action('round', roundedN), action('estimate', estimate), action('digit', trial), action('product', trial * d));
  if (trial * d > n) {
    do { trial--; result.push(action('digit', trial), action('product', trial * d)); } while (trial * d > n);
  } else {
    while (trial < 9n && trial * d < n) {
      const next = trial + 1n;
      result.push(action('digit', next), action('product', next * d));
      if (next * d > n) break;
      trial = next;
    }
  }
  if (trial !== n / d) throw Error('Estimate adjustment failed maximal-digit identity');
  result.push(action('digit', n / d));
  return result;
}

function verifySpec(spec) {
  const errors = [], records = [], covered = new Set(), methods = new Set();
  const steps = Array.isArray(spec?.steps) ? spec.steps : [];
  const fail = (index, code, expected, actual) => errors.push({index, code, expected, actual});
  const compare = (actualSteps, expectedSteps, offset, method) => {
    methods.add(method);
    if (actualSteps.length !== expectedSteps.length) fail(offset, 'step-count', expectedSteps.length, actualSteps.length);
    for (let i = 0; i < Math.max(actualSteps.length, expectedSteps.length); i++) {
      const actual = actualSteps[i], expected = expectedSteps[i], index = offset + i;
      if (!actual || !expected) { fail(index, actual ? 'unexpected-step' : 'missing-step', expected?.kind || null, actual?.kind || null); continue; }
      covered.add(index);
      records.push({index, kind: expected.kind, expected: expected.expected, actual: actual.answer, method});
      if (actual.kind !== expected.kind) fail(index, 'kind', expected.kind, actual.kind);
      const raw = String(actual.answer ?? '').trim();
      const equal = expected.kind === 'comma' ? raw.replace('.', ',') === expected.expected
        : ['digit', 'bring'].includes(expected.kind) ? /^\d$/.test(raw) && raw === expected.expected
          : numericEqual(raw, expected.expected);
      if (!equal) fail(index, 'arithmetic', expected.expected, actual.answer);
      // A correct hidden answer is not enough when an explicit on-screen
      // calculation asks for something else. Brief prompts without numbers
      // are checked through the reconstructed task/column metadata instead.
      const arithmeticPrompt = ['product', 'subtract', 'answer', 'estimate', 'shift-divisor', 'shift-dividend', 'verify'].includes(expected.kind)
        || (expected.kind === 'digit' && /Вычти:/.test(actual.prompt || ''));
      const expression = arithmeticPrompt && explicitExpression(actual.prompt);
      if (expression && !expressionEquals(expression, expected.expected)) fail(index, 'prompt-arithmetic', expected.expected, expression);
      if (expected.kind === 'round') {
        const value = /округли\s+(\d+)/i.exec(actual.prompt || '');
        if (!value || !numericEqual((BigInt(value[1]) + 5n) / 10n * 10n, expected.expected)) fail(index, 'prompt-rounding', expected.expected, actual.prompt);
      }
      for (const key of ['cycle', 'sourceIndex', 'appended']) {
        if (own(expected, key) && actual[key] !== expected[key]) fail(index, key, expected[key], actual[key]);
      }
      for (const key of ['multiplication', 'visual']) {
        if (!own(expected, key)) continue;
        const actualMeta = actual[key] || {};
        for (const [name, value] of Object.entries(expected[key])) {
          if (JSON.stringify(actualMeta[name]) !== JSON.stringify(value)) fail(index, key + '.' + name, value, actualMeta[name]);
        }
      }
    }
  };
  try {
    if (!spec || !Array.isArray(spec.steps) || !steps.length) throw Error('A nonempty saved practice-step list is required');
    if (spec.task?.multiplication) compare(steps, multiplicationSteps(spec.task.multiplication), 0, 'independent-column-multiplication');
    else if (/\/(?:course-estimate|quotient-estimate)$/.test(spec.contentId || '')) compare(steps, estimateSteps(spec), 0, 'independent-rounded-estimation');
    else if (Array.isArray(spec.divisionTasks) && spec.divisionTasks.length) {
      let end = 0;
      for (const [groupIndex, group] of spec.divisionTasks.entries()) {
        if (!Number.isInteger(group.startIndex) || !Number.isInteger(group.endIndex) || group.startIndex !== end || group.endIndex <= group.startIndex || group.endIndex > steps.length) throw Error('Division group ranges must cover steps exactly once');
        const actual = steps.slice(group.startIndex, group.endIndex);
        for (let i = group.startIndex; i < group.endIndex; i++) if (steps[i].taskIndex !== groupIndex) fail(i, 'taskIndex', groupIndex, steps[i].taskIndex);
        if (group.task) {
          const full = divisionSteps(group.task);
          const expected = /\/(?:course-simple-check|course-independent-check)$/.test(spec.contentId || '') ? full.filter(step => step.kind === 'answer') : full;
          compare(actual, expected, group.startIndex, 'independent-long-division');
        } else compare(actual, microSteps(String(spec.contentId).replace(/^.*\/course-/, ''), group), group.startIndex, 'independent-micro-arithmetic');
        end = group.endIndex;
      }
      if (end !== steps.length) throw Error('Division groups leave unchecked steps');
    } else if (spec.divisionTask) compare(steps, divisionSteps(spec.divisionTask), 0, 'independent-long-division');
    else if (spec.contentId === 'multiplication-division/long-division-quotient-digit') {
      const [n, d] = pair(spec.task?.prompt || steps[0].prompt, ':');
      if (d <= 0n || n / d > 9n) throw Error('Legacy quotient digit outside range');
      compare(steps, [action('digit', n / d)], 0, 'independent-one-digit-division');
    } else throw Error('Unsupported arithmetic task: ' + spec.contentId);
  } catch (error) { errors.push({index: null, code: 'unsupported-or-invalid', message: error.message}); }
  for (let i = 0; i < steps.length; i++) if (!covered.has(i)) fail(i, 'unchecked-step', 'independent arithmetic check', steps[i]?.kind);
  return {
    ok: errors.length === 0 && covered.size === steps.length && steps.length > 0,
    tested: covered.size, totalSteps: steps.length, errors, records,
    coverage: {kinds: [...new Set(records.map(record => record.kind))].sort(), methods: [...methods].sort(), lessonsChecked: false}
  };
}

module.exports = Object.freeze({verifySpec});
