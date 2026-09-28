/*
  Независимый пересчёт задания 8 (степени и корни) для гейта OGE_COURSE_03D_ALGEBRA.
  Значение выражения считается прямо по его записи (вид задачи и параметры),
  своей точной арифметикой: степени — целые, корни — точные корни
  рациональных подкоренных выражений. Лестница тренажёра (buildSteps) и её
  промежуточные показатели здесь не используются.
*/
import { R, ONE, add, sub, mul, div, pow, sqrtExact } from './oge-algebra-contract.lib.mjs';

const root = (x) => { const r = sqrtExact(x); if (!r) throw new Error('корень не извлекается: ' + x.n + '/' + x.d); return r; };
const I = (v) => R(v);
/* степень с полуцелым показателем e/2 у точного квадрата */
const halfPow = (b, twiceE) => (twiceE % 2 === 0 ? pow(I(b), twiceE / 2) : pow(root(I(b)), twiceE));

export const VALUE = {
  rootpow: (p) => root(pow(I(p.b), p.n)),                                        // √(bⁿ)
  rootmono: (p) => root(mul(I(p.c), mul(pow(I(p.x), p.p), pow(I(p.y), p.q)))),     // √(c·xᵖ·y^q)
  rootfrac1: (p) => root(div(mul(mul(I(p.c1), pow(I(p.a), p.p)), mul(I(p.c2), pow(I(p.b), p.q))), mul(I(p.a), I(p.b)))),
  rootfrac2: (p) => root(div(mul(mul(I(p.c1), pow(I(p.a), p.p)), mul(I(p.c2), pow(I(p.b), p.q))), mul(pow(I(p.a), p.r), pow(I(p.b), p.s)))),
  sq_over_d: (p) => div(mul(pow(I(p.k), 2), I(p.m)), I(p.d)),                      // (k√m)² / d
  d_over_sq: (p) => div(I(p.d), mul(pow(I(p.k), 2), I(p.m))),                      // d / (k√m)²
  rootmuldiv: (p) => root(div(mul(I(p.m), I(p.n)), I(p.d))),                       // √m·√n / √d
  rootprod3: (p) => mul(mul(I(p.k1), I(p.k2)), root(mul(mul(I(p.m1), I(p.m2)), I(p.m3)))),
  rootprod2: (p) => root(mul(mul(I(p.m), I(p.n)), I(p.k))),                        // √(m·n)·√k
  diffsq_int: (p) => sub(I(p.a), pow(I(p.b), 2)),                                  // (√a − b)(√a + b)
  diffsq_root: (p) => sub(I(p.a), I(p.b)),                                         // (√a − √b)(√a + √b)
  distrib: (p) => { const s = root(mul(I(p.A), I(p.B))); return p.sign < 0 ? sub(s, I(p.B)) : add(s, I(p.B)); }, // (√A ± √B)·√B
  pow_mul_div: (p) => pow(I(p.b), p.p + p.q - p.r),
  pow_pow_div: (p) => pow(I(p.b), p.p * p.q - p.r),
  pow_mul_pow: (p) => pow(I(p.b), p.p + p.q * p.r),
  pow_prodbase_div: (p) => div(mul(pow(I(p.b1), p.p), pow(I(p.b2), p.q)), pow(I(p.b1 * p.b2), p.r)),
  prodbase_over: (p) => div(pow(I(p.b1 * p.b2), p.p), mul(pow(I(p.b1), p.q), pow(I(p.b2), p.r))),
  sqsum: (p) => add(I(p.m), pow(I(p.k), 2)),                                       // (√m ± k)² ∓ 2k√m
  pow_over_num: (p) => div(pow(I(p.b), p.p), I(p.d)),
  recip_pow: (p) => mul(div(ONE, pow(I(p.b), p.p)), div(ONE, pow(I(p.b), p.q))),
  pow_var_div: (p) => div(pow(pow(I(p.a), p.pp), p.q), pow(I(p.a), p.r)),         // (a^pp)^q : a^r
  // a^pp·(b^q)^r / (a·b)^s при b = √a: показатель у a — pp + qr/2 − s − s/2 (полуцелые части обязаны сократиться)
  pow_ab: (p) => { const twice = 2 * p.pp + p.q * p.r - 3 * p.s;
    if (twice % 2) throw new Error('показатель не целый'); return pow(I(p.a), twice / 2); },
  root_neg: (p) => root(mul(pow(I(-p.a), p.negfirst ? p.pp : p.q), pow(I(p.a), p.negfirst ? p.q : p.pp))),
  root_frac_a: (p) => root(div(mul(I(p.c), pow(I(p.a), p.pp)), pow(I(p.a), p.q))),
  root_invc: (p) => root(mul(div(ONE, I(p.c)), mul(pow(I(p.x), p.pp), pow(I(p.y), p.q)))),
  root_xy_frac: (p) => root(div(mul(I(p.c), pow(I(p.x), p.pp)), pow(I(p.y), p.q))),
  fold_square: (p) => { // √(A·a² + K·a·b + B·b²)
    const a = R(p.an, p.ad), b = R(p.bn, p.bd);
    return root(add(add(mul(I(p.A), mul(a, a)), mul(I(p.K), mul(a, b))), mul(I(p.B), mul(b, b))));
  },
  sci: (p) => mul(mul(pow(I(p.c), p.q), I(p.d)), pow(I(10), p.pp * p.q + p.r)),   // (c·10^pp)^q · (d·10^r)
};

export function value(task) {
  const f = VALUE[task.type];
  if (!f) throw new Error('нет формулы для ' + task.type);
  return f(task.p);
}
