// The factory accepts short polynomial expressions with integer coefficients.
// Keep individual signed monomials until we have checked the requested step.
(function () {
  'use strict';

  const keyboardLetters = {
    а: 'a', в: 'b', с: 'c', д: 'd', е: 'e', к: 'k', м: 'm', н: 'n',
    о: 'o', р: 'p', т: 't', у: 'y', х: 'x'
  };
  const isNumber = token => token !== undefined && /^\d+$/.test(token);
  const isLetter = token => token !== undefined && /^[a-z]$/.test(token);

  function parse(source) {
    if (typeof source !== 'string' || source.length > 240) throw new SyntaxError();
    // Match the neighbouring like-terms trainer's keyboard aliases, including x2.
    const normalized = source.toLowerCase()
      .replace(/[а-яё]/g, ch => keyboardLetters[ch] || ch)
      .replace(/[−–—]/g, '-').replace(/[·⋅×]/g, '*').replace(/\*\*/g, '^')
      .replace(/²/g, '^2').replace(/³/g, '^3').replace(/([a-z])([23])(?!\d)/g, '$1^$2');
    const tokens = normalized.match(/\d+|[^\s]/g) || [];
    let pos = 0;
    let uncomputedProduct = false;

    function atom() {
      const token = tokens[pos++];
      if (isNumber(token)) return [{ key: '', coeff: BigInt(token) }];
      if (isLetter(token)) {
        let key = token;
        if (tokens[pos] === '^') {
          const exponent = tokens[++pos];
          if (exponent !== '2' && exponent !== '3') throw new SyntaxError();
          key = token.repeat(Number(exponent));
          pos++;
        }
        return [{ key, coeff: 1n }];
      }
      if (token !== '(') throw new SyntaxError();
      const terms = sum();
      if (tokens[pos++] !== ')') throw new SyntaxError();
      return terms;
    }

    function product() {
      let numericFactor = isNumber(tokens[pos]);
      let terms = atom();
      while (tokens[pos] === '*' || isLetter(tokens[pos]) || tokens[pos] === '(') {
        if (tokens[pos] === '*') pos++;
        if (isNumber(tokens[pos])) {
          if (numericFactor) uncomputedProduct = true;
          numericFactor = true;
        }
        const factor = atom();
        // Bound distributive expansion when the pupil pastes a long product.
        if (terms.length * factor.length > 128) throw new SyntaxError();
        terms = terms.flatMap(left => factor.map(right => ({
          key: [...left.key, ...right.key].sort().join(''),
          coeff: left.coeff * right.coeff
        })));
      }
      return terms;
    }

    function sum() {
      const terms = [];
      let sign = 1n;
      if (tokens[pos] === '+' || tokens[pos] === '-') sign = tokens[pos++] === '-' ? -1n : 1n;
      while (true) {
        for (const term of product()) terms.push({ key: term.key, coeff: sign * term.coeff });
        if (tokens[pos] !== '+' && tokens[pos] !== '-') return terms;
        sign = tokens[pos++] === '-' ? -1n : 1n;
      }
    }

    const terms = sum();
    if (pos !== tokens.length) throw new SyntaxError();
    return { terms, hasBrackets: tokens.includes('('), uncomputedProduct };
  }

  function coefficients(terms) {
    const byKey = new Map();
    for (const { key, coeff } of terms) byKey.set(key, (byKey.get(key) || 0n) + coeff);
    for (const [key, coeff] of byKey) if (coeff === 0n) byKey.delete(key);
    return byKey;
  }

  function sameTerms(left, right) {
    if (left.length !== right.length) return false;
    // Sorting strings here is only for matching a multiset, never for arithmetic.
    const signatures = terms => terms.map(term => term.key + ':' + term.coeff).sort();
    const a = signatures(left);
    const b = signatures(right);
    return a.every((value, index) => value === b[index]);
  }

  function check(input, expected, form = 'simplified') {
    if (typeof input !== 'string') return { status: 'syntax' };
    if (!input.trim()) return { status: 'empty' };
    let actual;
    try {
      actual = parse(input);
    } catch (error) {
      if (error instanceof SyntaxError) return { status: 'syntax' };
      throw error;
    }
    const target = parse(expected);
    const a = coefficients(actual.terms);
    const b = coefficients(target.terms);
    if (a.size !== b.size || [...a].some(([key, value]) => b.get(key) !== value)) {
      return { status: 'wrong' };
    }
    if (actual.hasBrackets) return { status: 'expand' };
    if (form === 'expanded') {
      if (actual.uncomputedProduct) return { status: 'multiply' };
      return { status: sameTerms(actual.terms, target.terms) ? 'correct' : 'terms' };
    }
    const singleZero = actual.terms.length === 1 && actual.terms[0].key === '' && a.size === 0;
    if (actual.uncomputedProduct || (!singleZero && a.size !== actual.terms.length)) {
      return { status: 'collect' };
    }
    return { status: 'correct' };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { check };
  else window.FactoryMath = { check };
})();
