/* Safe answer parsing for the college-functions trainer.
 * No evaluation of learner code. Parsers return null on invalid input.
 * Sets: {intervals:[{lo,hi,lc,rc}], points:[]}; infinities use '-inf'/'inf'.
 * Monotonic intervals remain separate: their union is NOT a monotonicity claim.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CollegeFunctionsEngine = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const LIMIT = 2048;
  const DECIMAL = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/;
  const empty = () => ({ intervals: [], points: [] });
  const clean = (value) => typeof value === 'string' && value.length <= LIMIT
    ? value.trim().replace(/[−–﹣－]/g, '-').replace(/\s+/g, '') : null;
  function near(a, b) {
    if (a === b) return true;
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  }
  function decimal(value) {
    if (!DECIMAL.test(value)) return null;
    const n = Number(value.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  function parseNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const s = clean(value);
    if (!s) return null;
    const pieces = s.split('/');
    if (pieces.length === 1) return decimal(pieces[0]);
    if (pieces.length !== 2) return null;
    const numerator = decimal(pieces[0]), denominator = decimal(pieces[1]);
    if (numerator === null || denominator === null || denominator === 0) return null;
    const result = numerator / denominator;
    return Number.isFinite(result) ? result : null;
  }
  const boundNumber = value => value === '-inf' ? -Infinity : value === 'inf' ? Infinity : value;
  const boundValue = value => value === -Infinity ? '-inf' : value === Infinity ? 'inf' : value;
  function parseBound(s) {
    if (/^\+?(?:∞|inf|infinity)$/i.test(s)) return Infinity;
    if (/^-(?:∞|inf|infinity)$/i.test(s)) return -Infinity;
    return parseNumber(s);
  }
  function validInterval(item) {
    if (!item || typeof item !== 'object' || typeof item.lc !== 'boolean' || typeof item.rc !== 'boolean') return null;
    const lo = boundNumber(item.lo), hi = boundNumber(item.hi);
    if (typeof lo !== 'number' || typeof hi !== 'number' || Number.isNaN(lo) || Number.isNaN(hi)) return null;
    if (lo === Infinity || hi === -Infinity || lo > hi) return null;
    if ((!Number.isFinite(lo) && item.lc) || (!Number.isFinite(hi) && item.rc)) return null;
    if (lo === hi && !(item.lc && item.rc)) return null;
    return { lo, hi, lc: item.lc, rc: item.rc };
  }
  function rawSet(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!Array.isArray(value.intervals) || !Array.isArray(value.points)) return null;
      if (value.intervals.length + value.points.length > 100) return null;
      const intervals = value.intervals.map(validInterval);
      if (intervals.some(x => x === null)) return null;
      if (value.points.some(x => typeof x !== 'number' || !Number.isFinite(x))) return null;
      return { intervals, points: value.points.slice() };
    }
    const s = clean(value);
    if (!s) return null;
    if (/^(?:ℝ|R|Р)$/i.test(s)) return { intervals: [{lo: -Infinity, hi: Infinity, lc: false, rc: false}], points: [] };
    if (/^(?:∅|нет|пусто)$/i.test(s)) return empty();
    const parts = s.split(/∪|[uU]|и/);
    if (parts.some(x => !x)) return null;
    const result = empty();
    for (const part of parts) {
      const match = part.match(/^([\[(])([^;]+);([^;]+)([\])])$/);
      if (match) {
        const lo = parseBound(match[2]), hi = parseBound(match[3]);
        if (lo === null || hi === null) return null;
        const item = validInterval({ lo, hi, lc: match[1] === '[', rc: match[4] === ']' });
        if (!item) return null;
        result.intervals.push(item);
        continue;
      }
      if (part.startsWith('{') && part.endsWith('}')) {
        const body = part.slice(1, -1);
        if (!body) return null;
        const numbers = body.split(';').map(parseNumber);
        if (numbers.some(x => x === null)) return null;
        result.points.push(...numbers);
        continue;
      }
      return null;
    }
    return result;
  }
  function sortIntervals(a, b) {
    return a.lo - b.lo || (a.lc === b.lc ? 0 : a.lc ? -1 : 1) || a.hi - b.hi;
  }
  function normalize(raw) {
    if (!raw) return null;
    const list = raw.intervals.map(x => ({...x}));
    for (const point of raw.points) list.push({lo: point, hi: point, lc: true, rc: true});
    list.sort(sortIntervals);
    const merged = [];
    for (const item of list) {
      const last = merged[merged.length - 1];
      const touching = last && near(last.hi, item.lo);
      if (!last || (item.lo > last.hi && !touching) || (touching && !last.rc && !item.lc)) {
        merged.push({...item});
        continue;
      }
      if (near(last.lo, item.lo)) last.lc = last.lc || item.lc;
      if (item.hi > last.hi && !near(item.hi, last.hi)) {
        last.hi = item.hi; last.rc = item.rc;
      } else if (near(item.hi, last.hi)) last.rc = last.rc || item.rc;
    }
    const result = empty();
    for (const item of merged) {
      if (item.lo === item.hi) result.points.push(item.lo);
      else result.intervals.push({...item, lo: boundValue(item.lo), hi: boundValue(item.hi)});
    }
    return result;
  }
  function parseSet(value) { return normalize(rawSet(value)); }
  function equalInterval(a, b) {
    return near(boundNumber(a.lo), boundNumber(b.lo)) && near(boundNumber(a.hi), boundNumber(b.hi)) && a.lc === b.lc && a.rc === b.rc;
  }
  function sameSet(input, expected) {
    const a = parseSet(input), b = parseSet(expected);
    return !!a && !!b && a.intervals.length === b.intervals.length && a.points.length === b.points.length
      && a.intervals.every((v, i) => equalInterval(v, b.intervals[i]))
      && a.points.every((v, i) => near(v, b.points[i]));
  }
  function sameIntervals(input, expected, options) {
    if (!Array.isArray(expected)) return false;
    const a = rawSet(input), b = rawSet({intervals: expected, points: []});
    if (!a || !b || a.points.length || b.points.length || a.intervals.length !== b.intervals.length) return false;
    const ai = a.intervals.slice().sort(sortIntervals), bi = b.intervals.slice().sort(sortIntervals);
    return ai.every((v, i) => {
      const expectedInterval=bi[i];
      if (!options || !options.allowOpenFinite) return equalInterval(v, expectedInterval);
      const loEqual=near(v.lo,expectedInterval.lo),hiEqual=near(v.hi,expectedInterval.hi);
      // School monotonicity notation may omit defined turning points. Never
      // admit an endpoint excluded by the actual domain or by a downward jump.
      const left=v.lc===expectedInterval.lc || (!v.lc && expectedInterval.lc && Number.isFinite(expectedInterval.lo));
      const right=v.rc===expectedInterval.rc || (!v.rc && expectedInterval.rc && Number.isFinite(expectedInterval.hi));
      return loEqual && hiEqual && left && right;
    });
  }
  function sameZeros(input, expected) {
    if (!Array.isArray(expected) || expected.some(x => typeof x !== 'number' || !Number.isFinite(x))) return false;
    const s = clean(input);
    if (!s) return false;
    let received;
    if (/^(?:∅|нет|пусто)$/i.test(s)) received = empty();
    else if (s.startsWith('{')) received = parseSet(s);
    else {
      const numbers = s.split(';').map(parseNumber);
      if (numbers.some(x => x === null)) return false;
      received = {intervals: [], points: numbers};
    }
    return !!received && sameSet(received, {intervals: [], points: expected});
  }
  function formatNumber(value) {
    if (value === '-inf' || value === -Infinity) return '-∞';
    if (value === 'inf' || value === Infinity) return '+∞';
    if (typeof value !== 'number' || !Number.isFinite(value)) return '';
    if (near(value, 0)) return '0';
    if (Number.isInteger(value)) return String(value);
    for (let d = 2; d <= 1000; d++) {
      const n = Math.round(value * d);
      if (Math.abs(n / d - value) <= 1e-11) return n + '/' + d;
    }
    return String(Number(value.toFixed(8))).replace('.', ',');
  }
  function formatInterval(interval) {
    return (interval.lc ? '[' : '(') + formatNumber(interval.lo) + '; ' + formatNumber(interval.hi) + (interval.rc ? ']' : ')');
  }
  function formatSet(set) {
    const normalized = parseSet(set);
    if (!normalized) return '';
    const parts = normalized.intervals.map(formatInterval);
    if (normalized.points.length) parts.push('{' + normalized.points.map(formatNumber).join('; ') + '}');
    if (!parts.length) return '∅';
    if (parts.length === 1 && parts[0] === '(-∞; +∞)') return 'ℝ';
    return parts.join(' ∪ ');
  }
  function formatIntervals(intervals) {
    return intervals.length ? intervals.map(formatInterval).join(' и ') : '∅';
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  }
  return Object.freeze({ parseNumber, parseSet, sameSet, sameIntervals, sameZeros,
    formatNumber, formatSet, formatIntervals, escapeHTML, near });
});
