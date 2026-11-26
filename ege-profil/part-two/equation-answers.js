(function(root, factory) {
  'use strict';
  const answers = factory();
  if (typeof module === 'object' && module.exports) module.exports = answers;
  else root.ProfileEquationAnswers = answers;
})(globalThis, function() {
  'use strict';

  const limits = Object.freeze({ chars: 500, values: 64, families: 12, expandedFamilies: 16,
    digits: 12, decimalPlaces: 12, residues: 16384 });
  const types = new Set(['finite-pi', 'finite-rational', 'periodic-pi']);
  const one = Object.freeze({ n: 1n, d: 1n });
  const zero = Object.freeze({ n: 0n, d: 1n });
  const numeral = '(?:[0-9]+(?:[.,][0-9]+)?|[.,][0-9]+)';
  const exactNumeral = new RegExp('^' + numeral + '$');
  const beginningNumeral = new RegExp('^(' + numeral + ')(.*)$');
  const parameter = '[a-wy-zA-WY-Z]';
  const listOfParameters = parameter + '(?:\\s*[,;]\\s*' + parameter + ')*';
  const integerDeclaration = listOfParameters + '\\s*∈\\s*[ℤZz]';
  const declarations = new RegExp('(?:[,;]\\s*|\\s+)(' + integerDeclaration +
    '(?:\\s*[,;]\\s*' + integerDeclaration + ')*)$');
  const productTokens = new RegExp(numeral + '|π|~' + parameter + '|' + parameter + '|\\*', 'g');
  const emptySet = /^(?:∅|\{\s*\}|нет\s+корней|нет\s+решений|пустое\s+множество)$/iu;

  class FormatError extends Error {}

  function requireForm(condition, reason = 'syntax') {
    if (!condition) throw new FormatError(reason);
  }

  function abs(integer) { return integer < 0n ? -integer : integer; }

  function gcd(a, b) {
    a = abs(a);
    b = abs(b);
    while (b !== 0n) [a, b] = [b, a % b];
    return a;
  }

  function lcm(a, b) { return a / gcd(a, b) * b; }

  function rational(n, d) {
    requireForm(d !== 0n, 'zero-denominator');
    if (d < 0n) [n, d] = [-n, -d];
    const divisor = gcd(n, d);
    return { n: n / divisor, d: d / divisor };
  }

  function negate(q) { return { n: -q.n, d: q.d }; }
  function difference(a, b) { return rational(a.n * b.d - b.n * a.d, a.d * b.d); }
  function quotient(a, b) { return rational(a.n * b.d, a.d * b.n); }
  function order(a, b) { return a.n * b.d - b.n * a.d; }
  function modulo(n, d) { return (n % d + d) % d; }

  function decimal(text) {
    requireForm(exactNumeral.test(text));
    const [whole, fraction = ''] = text.split(/[.,]/);
    requireForm(whole.length <= limits.digits && fraction.length <= limits.decimalPlaces, 'complexity');
    const digits = whole + fraction;
    return rational(BigInt(digits), 10n ** BigInt(fraction.length));
  }

  function asText(q) { return String(q.n) + (q.d === 1n ? '' : '/' + q.d); }

  function normalize(input) {
    requireForm(typeof input === 'string');
    requireForm(input.length <= limits.chars, 'complexity');
    return input.trim().replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/\\?pi/gi, 'π');
  }

  function compact(input) {
    // Spaces between tokens are informal typography. Spaces within a number
    // or a decimal separator must never turn a malformed value into a new one.
    requireForm(!/[0-9][.,]?\s+(?=[0-9.,])|[.,]\s+(?=[0-9])/u.test(input));
    return input.replace(/\s+/g, '');
  }

  function readProduct(text) {
    const tokens = text.match(productTokens);
    requireForm(tokens && tokens.join('') === text && !/^\*|\*$|\*\*/.test(text));
    let number = null;
    const symbols = [];
    tokens.forEach((token, index) => {
      if (token === '*') return;
      if (!exactNumeral.test(token)) {
        symbols.push(token);
        return;
      }
      requireForm(number === null && (index === 0 || tokens[index - 1] === '*'));
      number = decimal(token);
    });
    return { number, symbols };
  }

  function monomial(text) {
    const pieces = text.split('/');
    requireForm(pieces.length <= 2);
    const { number, symbols } = readProduct(pieces[0]);
    let coefficient = number || one;
    if (pieces.length === 2) {
      const match = beginningNumeral.exec(pieces[1]);
      requireForm(match);
      const [, denominator, rest] = match;
      coefficient = quotient(coefficient, decimal(denominator));
      if (rest) {
        // A factor that follows a fractional coefficient can be implicit.
        // Where the numerator already contains a symbol, require “*” so the
        // extent of the denominator is clear (πn/2 or π/2*n).
        const explicitTimes = rest.startsWith('*');
        requireForm(explicitTimes || symbols.length === 0);
        const after = readProduct(explicitTimes ? rest.slice(1) : rest);
        requireForm(after.number === null);
        symbols.push(...after.symbols);
      }
    }
    return { coefficient, symbols };
  }

  function unitValue(coefficient, unit) {
    return { unit: coefficient.n === 0n ? 'number' : unit, coefficient };
  }

  function finiteValue(text, type) {
    const [, sign, body] = /^([+-]?)(.*)$/.exec(compact(text));
    const { coefficient, symbols } = monomial(body);
    const numeric = symbols.length === 0;
    requireForm(numeric || (type === 'finite-pi' && symbols.length === 1 && symbols[0] === 'π'));
    return unitValue(sign === '-' ? negate(coefficient) : coefficient, numeric ? 'number' : 'pi');
  }

  function finiteKey(value) { return value.unit + ':' + asText(value.coefficient); }

  function parseFinite(text, type) {
    if (emptySet.test(text)) return { values: [], duplicates: 0 };
    const list = text.startsWith('{') && text.endsWith('}') ? text.slice(1, -1) : text;
    const pieces = list.split(';');
    requireForm(pieces.length <= limits.values, 'complexity');
    const distinct = new Map();
    for (const piece of pieces) {
      const value = finiteValue(piece, type);
      distinct.set(finiteKey(value), value);
    }
    return { values: [...distinct.values()], duplicates: pieces.length - distinct.size };
  }

  function periodTerm(sign, input) {
    const { coefficient, symbols } = monomial(input);
    const names = symbols.filter(symbol => symbol !== 'π');
    const degree = symbols.length - names.length;
    requireForm(degree === 1 || (!symbols.length && coefficient.n === 0n));
    requireForm(names.length <= 1);
    const name = names[0] || '';
    const alternating = name.startsWith('~');
    const kind = alternating ? 'alternating' : name ? 'step' : 'offset';
    requireForm(sign !== '±' || kind === 'offset');
    return { kind, name: alternating ? name.slice(1) : name, plusMinus: sign === '±',
      coefficient: sign === '-' ? negate(coefficient) : coefficient };
  }

  function linearFamily(text) {
    const match = /^([+\-±]?)([^+\-±]+)(?:([+\-±])([^+\-±]+))?$/u.exec(text);
    requireForm(match);
    const terms = [periodTerm(match[1], match[2])];
    if (match[3]) terms.push(periodTerm(match[3], match[4]));
    const result = Object.fromEntries(terms.map(term => [term.kind, term]));
    requireForm(Object.keys(result).length === terms.length);

    const { alternating, offset, step } = result;
    if (alternating) {
      requireForm(step && alternating.name === step.name);
      const period = rational(2n * step.coefficient.n, step.coefficient.d);
      const base = alternating.coefficient;
      return { name: step.name, families: [[base, period], [difference(step.coefficient, base), period]] };
    }
    const a = offset ? offset.coefficient : zero;
    const b = step ? step.coefficient : zero;
    return { name: step ? step.name : '', families: offset && offset.plusMinus ? [[a, b], [negate(a), b]] : [[a, b]] };
  }

  function family(source) {
    let text = compact(source).replace(/^[xXхХ]=/u, '');
    requireForm(!text.includes('~'));
    text = text.replace(/\(-1\)\^([a-wy-zA-WY-Z])/g, '~$1');
    // Solving for x after solving for 2x or 3x may leave a whole series over a divisor.
    const grouped = /^\(([^()]+)\)\/([+-]?)([^()]+)$/.exec(text);
    if (!grouped) return linearFamily(text);
    const divisor = decimal(grouped[3]);
    const signedDivisor = grouped[2] === '-' ? negate(divisor) : divisor;
    const { name, families } = linearFamily(grouped[1]);
    return { name, families: families.map(pair => pair.map(term => quotient(term, signedDivisor))) };
  }

  function normalizeFamily([offset, step]) {
    const positive = step.n < 0n ? negate(step) : step;
    if (positive.n === 0n) return [offset, positive];
    const residue = rational(modulo(offset.n * positive.d, positive.n * offset.d), offset.d * positive.d);
    return [residue, positive];
  }

  function distinctFamilies(input) {
    const result = new Map();
    for (const f of input) {
      const normalized = normalizeFamily(f);
      result.set(normalized.map(asText).join(';'), normalized);
    }
    return [...result.values()];
  }

  function parsePeriodic(text) {
    if (emptySet.test(text)) return { families: [] };
    const suffix = declarations.exec(text);
    const formula = suffix ? text.slice(0, suffix.index) : text;
    const pieces = formula.split(/;|∪|или/iu);
    requireForm(pieces.length <= limits.families, 'complexity');
    const parsed = pieces.map(piece => {
      const local = declarations.exec(piece.trimEnd());
      if (!local) return family(piece);
      const item = family(piece.slice(0, local.index));
      validateDeclarations(local[1], new Set([item.name]));
      return { ...item, locallyDeclared: true };
    });
    const names = new Set(parsed.map(item => item.name));
    const globalNames = suffix ? validateDeclarations(suffix[1], names) : [];
    for (const item of parsed) {
      // Euler's number and the imaginary unit are not arbitrary integers.
      requireForm(!/^[ei]$/i.test(item.name) || item.locallyDeclared || globalNames.includes(item.name));
    }
    const expanded = parsed.flatMap(item => item.families);
    requireForm(expanded.length <= limits.expandedFamilies, 'complexity');
    return { families: distinctFamilies(expanded) };
  }

  function validateDeclarations(text, names) {
    const mentioned = text.replace(/∈\s*[ℤZz]/gu, '').match(/[a-wy-zA-WY-Z]/g) || [];
    requireForm(mentioned.every(name => names.has(name)));
    return mentioned;
  }

  function failed(type, reason) {
    return { type, recognized: false, correct: false, status: 'format', reason };
  }

  function parse(input, type) {
    if (!types.has(type)) throw new TypeError('Unknown equation answer type');
    try {
      const text = normalize(input);
      requireForm(text.length, 'empty');
      const value = type === 'periodic-pi' ? parsePeriodic(text) : parseFinite(text, type);
      return { type, recognized: true, ...value };
    } catch (error) {
      if (error instanceof FormatError) return failed(type, error.message);
      throw error;
    }
  }

  function coefficient(text) {
    const parsed = parse(String(text), 'finite-rational');
    if (!parsed.recognized || parsed.values.length !== 1) throw new TypeError('Invalid authored rational coefficient');
    return parsed.values[0].coefficient;
  }

  function authoredFamilies(items) {
    return distinctFamilies(items.map(pair => pair.map(coefficient)));
  }

  function belongs(value, families) {
    return families.some(([offset, step]) => {
      const distance = difference(value, offset);
      if (step.n === 0n) return distance.n === 0n;
      return (distance.n * step.d) % (distance.d * step.n) === 0n;
    });
  }

  function verdict(type, missing, extra, suffix = '', more = {}) {
    const status = [missing.length && 'missing', extra.length && 'extra', suffix].filter(Boolean).join('-') || 'correct';
    return { type, recognized: true, correct: status === 'correct', status, missing, extra, ...more };
  }

  function grid(families) {
    const denominator = families.flat().reduce((acc, value) => lcm(acc, value.d), 1n);
    const scaled = q => q.n * (denominator / q.d);
    const period = families.reduce((acc, [, step]) => lcm(acc, scaled(step)), 1n);
    const cost = families.reduce((acc, [, step]) => acc + period / scaled(step), 0n);
    requireForm(cost <= BigInt(limits.residues), 'complexity');
    return { denominator, scaled, period };
  }

  function residues(families, { period, scaled }) {
    const result = new Set();
    for (const [offset, step] of families) {
      const end = period;
      const increment = scaled(step);
      for (let index = scaled(offset); index < end; index += increment) result.add(index);
    }
    return result;
  }

  function comparePeriodic(type, actual, expected) {
    const positiveActual = actual.filter(([, step]) => step.n !== 0n);
    const positiveExpected = expected.filter(([, step]) => step.n !== 0n);
    const common = grid([...positiveActual, ...positiveExpected]);
    const actualResidues = residues(positiveActual, common);
    const expectedResidues = residues(positiveExpected, common);
    const describe = (have, want) => [...want].filter(index => !have.has(index)).map(index => ({
      offset: asText(rational(index, common.denominator)), step: asText(rational(common.period, common.denominator)) }));
    const isolated = (have, want) => want.filter(([offset, step]) => step.n === 0n && !belongs(offset, have))
      .map(([offset]) => ({ offset: asText(offset), step: '0' }));
    return verdict(type, [...describe(actualResidues, expectedResidues), ...isolated(actual, expected)],
      [...describe(expectedResidues, actualResidues), ...isolated(expected, actual)]);
  }

  function outside(q, boundary) {
    if (!boundary) return false;
    const [left, right, closedLeft, closedRight] = boundary;
    const below = left === null ? false : (closedLeft ? order(q, left) < 0n : order(q, left) <= 0n);
    const above = right === null ? false : (closedRight ? order(q, right) > 0n : order(q, right) >= 0n);
    return below || above;
  }

  function exactInterval(interval) {
    if (!interval) return null;
    const [left, right, closedLeft, closedRight] = interval;
    return [left === null ? null : coefficient(left), right === null ? null : coefficient(right), closedLeft, closedRight];
  }

  function finiteDescription(value) { return { unit: value.unit, value: asText(value.coefficient) }; }

  function compareFinite(parsed, spec) {
    const { type, values, duplicates } = parsed;
    const unit = type === 'finite-pi' ? 'pi' : 'number';
    const expected = spec.finite.map(item => unitValue(coefficient(item), unit));
    const expectedKeys = new Set(expected.map(finiteKey));
    const receivedKeys = new Set(values.map(finiteKey));
    const missing = expected.filter(item => !receivedKeys.has(finiteKey(item))).map(finiteDescription);
    const families = spec.general && authoredFamilies(spec.general);
    const interval = exactInterval(spec.interval);
    const domain = exactInterval(spec.domain?.interval);
    const excluded = (spec.domain?.excluded || []).map(coefficient);
    const extra = values.filter(item => !expectedKeys.has(finiteKey(item))).map(item => {
      const q = item.coefficient;
      let reason = '';
      if (families && ((q.n !== 0n && item.unit !== 'pi') || !belongs(q, families))) reason = 'not-root';
      else if (interval && outside(q, interval)) reason = 'outside-interval';
      else if (outside(q, domain) || excluded.some(value => order(q, value) === 0n)) reason = 'outside-domain';
      return { ...finiteDescription(item), reason };
    });
    const suffix = ['outside-interval', 'outside-domain', 'not-root'].find(reason => extra.some(item => item.reason === reason));
    return verdict(type, missing, extra, suffix, { duplicates });
  }

  function compare(parsed, spec) {
    if (!parsed.recognized) return parsed;
    try {
      if (parsed.type === 'periodic-pi') return comparePeriodic(parsed.type, parsed.families, authoredFamilies(spec.general));
      return compareFinite(parsed, spec);
    } catch (error) {
      if (error instanceof FormatError) return failed(parsed.type, error.message);
      throw error;
    }
  }

  return Object.freeze({ limits, parse, compare });
});
