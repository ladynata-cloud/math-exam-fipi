/*
  Независимый пересчёт задания 9 (уравнения) для гейта OGE_COURSE_03D_ALGEBRA.
  Задача приходит из тренажёра как данные {fam, p, ask}; решение строится
  своим кодом: значения левой и правой частей в трёх точках → коэффициенты
  многочлена интерполяцией → корни по дискриминанту на точной арифметике,
  посторонние корни — по своим знаменателям. Код тренажёра (taskNorm,
  evalTermsABC, solveABC) здесь не используется.
*/
import { R, ZERO, ONE, add, sub, mul, div, neg, cmp, eq, isZero, quadRoots, quadFrom3 } from './oge-algebra-contract.lib.mjs';

/* дробь тренажёра {n, d} (BigInt после разбора JSON) или число → рациональное */
const Q = (v) => (typeof v === 'object' && v !== null && 'n' in v ? R(v.n, v.d) : R(v));

/* значение списка слагаемых в точке x — своя подстановка по структуре слагаемых */
function termsAt(ts, x) {
  let s = ZERO;
  for (const t of ts || []) {
    let v;
    if (t.fr) v = div(mul(R(t.fr.neg ? -1 : 1), termsAt(t.fr.top, x)), R(t.fr.bot));
    else if (t.br) v = mul(Q(t.br.k), termsAt(t.br.inner, x));
    else if (t.sq) { const b = t.sq.rev ? sub(Q(t.sq.s), x) : add(x, Q(t.sq.s)); v = mul(b, b); }
    else if (t.mul) v = mul(termsAt(t.mul[0], x), termsAt(t.mul[1], x));
    else { v = Q(t.c); for (let i = 0; i < (t.x || 0); i++) v = mul(v, x); }
    s = add(s, v);
  }
  return s;
}
const PTS = [R(0), R(1), R(2)];
const polyOf = (f) => quadFrom3(...PTS.map(f));

/* {roots: [..] по возрастанию, excluded: [..]} или {bad: причина} */
export function solve(task) {
  const p = task.p;
  let poly, excl = [];
  switch (task.fam) {
    case 'PROP': {
      const one = [{ c: 1, x: 0 }];
      const ld = p.ld || one, rd = p.rd || one;
      poly = polyOf((x) => sub(mul(termsAt(p.ln, x), termsAt(rd, x)), mul(termsAt(p.rn, x), termsAt(ld, x))));
      for (const d of [p.ld, p.rd]) if (d) {
        const lin = polyOf((x) => termsAt(d, x));   // знаменатель — линейный
        if (!isZero(lin.B)) excl.push(div(neg(lin.C), lin.B));
      }
      break;
    }
    case 'Z': // 1/(x+c1) + 1/(x+c2) = 0 → (x+c2) + (x+c1) = 0
      poly = { A: ZERO, B: R(2), C: R(p.c1 + p.c2) }; excl = [R(-p.c1), R(-p.c2)]; break;
    case 'NZ': poly = { A: R(p.qa), B: R(p.qb), C: R(p.qc) }; excl = [R(-p.dr)]; break;
    case 'XF': poly = { A: ONE, B: R(-p.b), C: R(p.an) }; excl = [ZERO]; break;   // x·x + an = b·x
    case 'S2': { // a/(x−b) + c/(x−d) = k → a(x−d) + c(x−b) − k(x−b)(x−d) = 0
      poly = polyOf((x) => sub(add(mul(R(p.a), sub(x, R(p.d))), mul(R(p.c), sub(x, R(p.b)))), mul(R(p.k), mul(sub(x, R(p.b)), sub(x, R(p.d))))));
      excl = [R(p.b), R(p.d)]; break;
    }
    case 'SB': { // t = 1/(x−k): t² + m·t + n = 0, x = k + 1/t
      const ts = quadRoots(ONE, R(p.m), R(p.n));
      if (!Array.isArray(ts)) return { bad: 'нет рациональных корней t' };
      const roots = ts.filter((t) => !isZero(t)).map((t) => add(R(p.k), div(ONE, t))).sort(cmp);
      return { roots, excluded: [] };
    }
    default:
      poly = polyOf((x) => sub(termsAt(p.Lt, x), termsAt(p.Rt, x)));
  }
  const rs = quadRoots(poly.A, poly.B, poly.C);
  if (rs === null) return { bad: 'вырожденное уравнение' };
  if (rs === 'irrational') return { bad: 'иррациональные корни' };
  const roots = rs.filter((r) => !excl.some((e) => eq(e, r)));
  const excluded = rs.filter((r) => excl.some((e) => eq(e, r)));
  return { roots, excluded };
}

/* ответ задачи: единственный корень или меньший/больший по условию */
export function answer(task) {
  const s = solve(task);
  if (s.bad) return s;
  if (s.roots.length === 1) return { key: s.roots[0], ...s };
  if (s.roots.length === 2) return { key: task.ask === 'max' ? s.roots[1] : s.roots[0], ...s };
  return { bad: 'корней ' + s.roots.length };
}

/* ожидаемые значения ловушек итогового ответа: другой корень, посторонние, знак — без ответа и повторов */
export function trapValues(task) {
  const a = answer(task);
  if (a.bad) return null;
  const vals = [];
  if (a.roots.length === 2) vals.push(task.ask === 'max' ? a.roots[0] : a.roots[1]);
  vals.push(...a.excluded, neg(a.key));
  const out = [];
  for (const v of vals) if (!eq(v, a.key) && !out.some((o) => eq(o, v))) out.push(v);
  return out;
}
