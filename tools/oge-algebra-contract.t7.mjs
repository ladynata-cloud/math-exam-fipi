/*
  Независимый пересчёт задания 7 (координатная прямая) для гейта OGE_COURSE_03D_ALGEBRA.
  - Утверждения «по рисунку»: запись утверждения (HTML тренажёра) разбирается
    своим разборщиком в выражение и вычисляется точной арифметикой на
    значениях чисел; функции test() тренажёра не используются.
  - Оценка чисел и точки: верный вариант находится своими целочисленными
    сравнениями (квадраты, произведения, середина промежутка).
  Возвращает номер верного варианта (1…4) или null, если запись не разобрана.
*/
import { R, ZERO, ONE, add, sub, mul, div, neg, cmp, pow, isqrt, parseNum } from './oge-algebra-contract.lib.mjs';

const Q = (v) => (typeof v === 'object' && v !== null && 'n' in v ? R(v.n, v.d) : R(v));

/* ---- разбор записи утверждения ---- */
function tokenize(html) {
  let s = String(html)
    .replace(/<span class="frac"><span class="fn">([\s\S]*?)<\/span><span class="fd">([\s\S]*?)<\/span><\/span>/g, ' ( $1 ) / ( $2 ) ')
    .replace(/<i>([a-z])<\/i>/g, ' $$$1 ')
    .replace(/<sup>(\d+)<\/sup>/g, ' ^ $1 ')
    .replace(/&gt;/g, ' > ').replace(/&lt;/g, ' < ').replace(/&nbsp;/g, ' ').replace(/=/g, ' = ')
    .replace(/[−–—]/g, '-')
    .replace(/ и /g, ' & ');
  if (/<|&[a-z]/.test(s.replace(/ [<>] /g, ' '))) return null;   // незнакомая разметка
  const toks = s.match(/\$[a-z]|\d+(?:[.,]\d+)?|[()+\-*/^<>=|&]/g);
  const rest = s.replace(/\$[a-z]|\d+(?:[.,]\d+)?|[()+\-*/^<>=|&]|\s/g, '');
  return rest ? null : toks;
}
/* грамматика: cond = rel ('&' rel)*; rel = expr ('<'|'>') expr;
   expr = term (('+'|'-') term)*; term = unary (('*'|'/'|неявное) unary)*;
   unary = '-' unary | power; power = atom ('^' число)?; atom = число | $x | '(' expr ')' | '|' expr '|' */
function parse(toks, vals) {
  let i = 0;
  const peek = () => toks[i], next = () => toks[i++];
  const expect = (t) => { if (next() !== t) throw new Error('ожидалось ' + t); };
  function atom() {
    const t = next();
    if (t === undefined) throw new Error('конец записи');
    if (t === '(') { const v = expr(); expect(')'); return v; }
    if (t === '|') { const v = expr(); expect('|'); return cmp(v, ZERO) < 0 ? neg(v) : v; }
    if (t[0] === '$') { if (!(t[1] in vals)) throw new Error('нет значения ' + t[1]); return Q(vals[t[1]]); }
    if (/^\d/.test(t)) return parseNum(t);
    throw new Error('лишний знак ' + t);
  }
  function power() { const b = atom(); if (peek() === '^') { next(); return pow(b, Number(next())); } return b; }
  function unary() { if (peek() === '-') { next(); return neg(unary()); } return power(); }
  function term() {
    let v = unary();
    for (;;) {
      const t = peek();
      if (t === '*') { next(); v = mul(v, unary()); }
      else if (t === '/') { next(); v = div(v, unary()); }
      else if (t === '(' || (t && t[0] === '$') || (t && /^\d/.test(t))) v = mul(v, unary());   // неявное умножение
      else return v;
    }
  }
  function expr() {
    let v = term();
    for (;;) {
      const t = peek();
      if (t === '+') { next(); v = add(v, term()); }
      else if (t === '-') { next(); v = sub(v, term()); }
      else return v;
    }
  }
  function rel() { // сравнение, в том числе двойное: −3 < a + 1 < −2
    let a = expr(), res = true, n = 0;
    while (peek() === '<' || peek() === '>' || peek() === '=') {
      const op = next(), b = expr(), c = cmp(a, b);
      res = res && (op === '>' ? c > 0 : op === '<' ? c < 0 : c === 0);
      a = b; n++;
    }
    if (!n) throw new Error('нет знака сравнения');
    return res;
  }
  let ok = rel();
  while (peek() === '&') { next(); ok = rel() && ok; }
  if (i !== toks.length) throw new Error('лишнее в конце');
  return ok;
}
/* истинность утверждения по его записи (или null, если запись не разобрана) */
export function truth(html, vals) {
  const toks = tokenize(html);
  if (!toks) return null;
  try { return parse(toks, vals); } catch (e) { return null; }
}

/* ---- номер верного варианта ---- */
export function keyOf(t) {
  if (t.kind === 'L') { // «какое утверждение верно всегда»: проверка на примерах задачи своим разбором
    const cant = (o) => /сравнить/.test(o.html);   // «сравнить невозможно» — верно, когда ни одно сравнение не держится на всех примерах
    const tr = t.opts.map((o) => (cant(o) ? null : t.samples.map((s) => truth(o.html, Object.fromEntries(Object.entries(s).map(([k, v]) => [k, parseNum(String(v))]))))));
    if (tr.some((row) => row && row.some((x) => x === null))) return null;
    const always = tr.map((row) => !!row && row.every(Boolean)), none = !always.some(Boolean);
    const hits = t.opts.map((o, i) => ((cant(o) ? none : always[i]) ? i + 1 : 0)).filter(Boolean);
    return hits.length === 1 ? hits[0] : -1;
  }
  if (t.kind === 'A') {
    if (t.pairs) { // «какая из разностей положительна/отрицательна»; вариант 4 — «ни одна из них»
      const pos = t.diffSign === 'положительна';
      const good = t.pairs.map(([u, w]) => { const d = cmp(sub(Q(t.vals[u]), Q(t.vals[w])), ZERO); return pos ? d > 0 : d < 0; });
      const n = good.filter(Boolean).length;
      return n === 0 ? 4 : n === 1 ? good.indexOf(true) + 1 : null;
    }
    const want = t.mode !== 'неверно';
    const tr = t.opts.map((o) => truth(o.html, t.vals));
    if (tr.some((x) => x === null)) return null;
    const hits = tr.map((x, i) => (x === want ? i + 1 : 0)).filter(Boolean);
    return hits.length === 1 ? hits[0] : -1;
  }
  const one = (arr) => (arr.length === 1 ? arr[0] : -1);
  const idx = (pred) => one(t.opts.map((o, i) => (pred(i) ? i + 1 : 0)).filter(Boolean));
  const N = BigInt(t.N || 0);
  switch (t.sub) {
    case 'rootBetween': return idx((i) => { const [p, q] = t.optPairs ? t.optPairs[i] : [t.optK[i], t.optK[i] + 1];
      return BigInt(p) * BigInt(p) < N && N < BigInt(q) * BigInt(q); });
    case 'fracBetweenInt': return idx((i) => { const [p, q] = t.optPairs[i]; return p * t.n < t.m && t.m < q * t.n; });
    case 'fracTenths': return idx((i) => t.optD[i] * t.n <= 10 * t.m && 10 * t.m < (t.optD[i] + 1) * t.n);
    case 'rootInRange': return idx((i) => t.k * t.k <= t.Ns[i] && t.Ns[i] <= (t.k + 1) * (t.k + 1));
    case 'fracInRange': return idx((i) => t.k * t.den <= t.ms[i] && t.ms[i] <= (t.k + 1) * t.den);
    case 'betweenFracs': return idx((i) => { const v = Q(t.optVals[i]); return cmp(R(t.lo[0], t.lo[1]), v) < 0 && cmp(v, R(t.hi[0], t.hi[1])) < 0; });
    case 'genRoot': case 'rootPointHalf': { // промежуток (k; k+1) и половина: 4N против (2k+1)²
      const k = Number(isqrt(N)), left = 4n * N < BigInt((2 * k + 1) * (2 * k + 1));
      return pointIn(t, k, left);
    }
    case 'genFrac': case 'fracPointHalf': {
      const k = Math.floor(t.m / t.n), left = 2 * t.m < (2 * k + 1) * t.n;
      return pointIn(t, k, left);
    }
    case 'decOrder2': {
      const vals = t.nums.map(parseNum), target = parseNum(t.targetStr);
      const sorted = vals.slice().sort(cmp);
      return one(sorted.map((v, i) => (cmp(v, target) === 0 ? i + 1 : 0)).filter(Boolean));
    }
    /* одна точка A, варианты — числа: промежуток точки и её половина, целочисленно */
    case 'rootPoint': case 'rootValuePick': {
      const x = t.pic.pts[0].x, k = Math.floor(x), left = x < k + 0.5;
      return idx((i) => { const M = BigInt(t.Ns[i]); return Number(isqrt(M)) === k && M !== BigInt(k * k) && (4n * M < BigInt((2 * k + 1) * (2 * k + 1))) === left; });
    }
    case 'fracValueImp': {
      const x = t.pic.pts[0].x, k = Math.floor(x), left = x < k + 0.5;
      return idx((i) => k * t.n < t.ms[i] && t.ms[i] < (k + 1) * t.n && (2 * t.ms[i] < (2 * k + 1) * t.n) === left);
    }
    case 'fracValueDec': { // десятичные деления: цифра десятых и половина десятой
      const x = t.pic.pts[0].x, d = Math.floor(10 * x + 1e-9), left = 10 * x - d < 0.5;
      return idx((i) => d * t.n <= 10 * t.ms[i] && 10 * t.ms[i] < (d + 1) * t.n && (20 * t.ms[i] < (2 * d + 1) * t.n) === left);
    }
    /* особые рисунки банка: точное совпадение значения с положением точки */
    case 'fracPoint7': case 'decPoint': return idx((i) => Math.abs(t.fracs[i][0] / t.fracs[i][1] - t.pic.pts[0].x) < 1e-9);
    case 'fracPoint': return idx((i) => Math.abs(t.pic.pts[i].x - t.m / t.n) < 1e-9);
    case 'fracPointCmp': return idx((i) => Math.abs(t.pic.pts[i].x - t.tm / t.tn) < 1e-9);
    case 'decOrder': { const X = parseNum(t.targetStr); return idx((i) => Math.abs(t.pic.pts[i].x - Number(X.n) / Number(X.d)) < 1e-9); }
    default: return null;   // особые записи банка: проверяются самопроверкой тренажёра
  }
}
/* точка в промежутке (k; k+1) и в нужной его половине — единственная */
function pointIn(t, k, left) {
  const pts = t.pic.pts;
  const hits = pts.map((p, i) => (Math.floor(p.x) === k && (p.x < k + 0.5) === left ? i + 1 : 0)).filter(Boolean);
  return hits.length === 1 ? hits[0] : -1;
}
