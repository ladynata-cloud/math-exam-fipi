/*
  Общая часть гейта OGE_COURSE_03D_ALGEBRA (тренажёры 7, 8, 9; часть B — 10, 11, 12, 14).

  Загрузка тренажёра в node:vm — та же, что у гейта геометрии 03A
  (tools/oge-geometry-contract.lib.mjs): заглушки DOM и хранилища,
  детерминированный Math.random. Здесь — своя точная рациональная арифметика
  на BigInt для независимого пересчёта ответов: код тренажёра в ней не
  участвует.
*/
export { ROOT, KEY, readTrainer, inlineScripts, syntaxCheck, mulberry32, loadTrainer, makeStorage, readKey, JUNK_KEY, JUNK_REC }
  from './oge-geometry-contract.lib.mjs';

/* рациональное число {n, d}: d > 0, несократимо */
const babs = (x) => (x < 0n ? -x : x);
function gcd(a, b) { a = babs(a); b = babs(b); while (b) { [a, b] = [b, a % b]; } return a; }
export function R(n, d = 1n) {
  n = BigInt(n); d = BigInt(d);
  if (d === 0n) throw new Error('деление на ноль');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}
export const ZERO = R(0), ONE = R(1);
export const add = (a, b) => R(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => R(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a, b) => R(a.n * b.n, a.d * b.d);
export const div = (a, b) => R(a.n * b.d, a.d * b.n);
export const neg = (a) => R(-a.n, a.d);
export const cmp = (a, b) => { const l = a.n * b.d, r = b.n * a.d; return l < r ? -1 : l > r ? 1 : 0; };
export const eq = (a, b) => a.n === b.n && a.d === b.d;
export const isZero = (a) => a.n === 0n;
export const str = (a) => (a.d === 1n ? String(a.n) : a.n + '/' + a.d);
/* целая степень, в том числе отрицательная */
export function pow(a, e) {
  e = BigInt(e);
  if (e < 0n) return pow(div(ONE, a), -e);
  let r = ONE, b = a;
  while (e > 0n) { if (e & 1n) r = mul(r, b); b = mul(b, b); e >>= 1n; }
  return r;
}
/* целый корень: floor(√x) для x ≥ 0 */
export function isqrt(x) {
  x = BigInt(x);
  if (x < 0n) throw new Error('корень из отрицательного');
  if (x < 2n) return x;
  let y = x, z = (x + 1n) / 2n;
  while (z < y) { y = z; z = (x / z + z) / 2n; }
  return y;
}
/* точный корень рационального числа или null */
export function sqrtExact(a) {
  if (a.n < 0n) return null;
  const p = isqrt(a.n), q = isqrt(a.d);
  return p * p === a.n && q * q === a.d ? R(p, q) : null;
}
/* корни A·x² + B·x + C = 0 (A, B, C — рациональные), только рациональные; для A = 0 — линейное */
export function quadRoots(A, B, C) {
  if (isZero(A)) {
    if (isZero(B)) return null;              // вырождено
    return [div(neg(C), B)];
  }
  const D = sub(mul(B, B), mul(R(4), mul(A, C)));
  if (D.n < 0n) return [];
  const s = sqrtExact(D);
  if (!s) return 'irrational';
  const r1 = div(sub(neg(B), s), mul(R(2), A)), r2 = div(add(neg(B), s), mul(R(2), A));
  const out = cmp(r1, r2) <= 0 ? [r1, r2] : [r2, r1];
  return eq(out[0], out[1]) ? [out[0]] : out;
}
/* многочлен степени ≤ 2 по значениям в точках 0, 1, 2 (интерполяция Лагранжа) */
export function quadFrom3(f0, f1, f2) {
  // f(x) = A x² + B x + C: C = f0; A + B = f1 − f0; 4A + 2B = f2 − f0
  const C = f0, s1 = sub(f1, f0), s2 = sub(f2, f0);
  const A = div(sub(s2, mul(R(2), s1)), R(2));
  const B = sub(s1, A);
  return { A, B, C };
}
/* число из строки «−1,5» / «3/2» / «2.5» */
export function parseNum(s) {
  s = String(s).trim().replace(/\s+/g, '').replace(/[−–—]/g, '-').replace(',', '.');
  let m = s.match(/^(-?)(\d+)\/(\d+)$/);
  if (m) return R((m[1] ? -1n : 1n) * BigInt(m[2]), BigInt(m[3]));
  m = s.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!m) return null;
  const fr = m[3] || '', den = 10n ** BigInt(fr.length);
  return R((m[1] ? -1n : 1n) * (BigInt(m[2]) * den + BigInt(fr || '0')), den);
}
