/*
  Независимый решатель задания 14 (прогрессии) для гейта OGE_COURSE_03D_ALGEBRA.
  Берёт из facts тренажёра только те величины, которые названы в условии
  (и проверяет, что они там действительно названы), а ответ получает своим
  кодом: где тренажёр считает по готовой прибавке, гейт выводит её из
  данных условия (AP-SUM2DAY — из суммы, AP-2PT «давление» — из высот,
  ГП — из длительности и периода), пороговые задачи — перебором.
*/
import { R, add, sub, mul, div, eq, cmp, pow } from './oge-algebra-contract.lib.mjs';

const Q = (x) => (x && typeof x === 'object' && 'n' in x ? R(x.n, x.d) : R(BigInt(x)));
const plainText = (h) => String(h).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
/* запись числа, как в тренажёре: целые с узкими пробелами от 5 знаков, десятичные с запятой */
function shown(text, v) {
  v = Q(v);
  const neg = v.n < 0n, a = neg ? -v.n : v.n;
  let s;
  if (v.d === 1n) s = a.toString();
  else {
    let k = 0, D = 1n;
    while (D % v.d !== 0n) { D *= 10n; k++; if (k > 12) return false; }
    const qs = (a * (D / v.d)).toString().padStart(k + 1, '0');
    s = qs.slice(0, qs.length - k) + ',' + qs.slice(qs.length - k);
  }
  const t = plainText(text).replace(/(\d)[    ](?=\d{3})/g, '$1').replace(/−/g, '-');
  return new RegExp('(^|[^\\d,])' + (neg ? '-' : '') + s + '(?![\\d]|,\\d)').test(t);
}

/* value(task) → { v } или { bad } ; task: { code, facts, text } */
export function value(task) {
  const f = task.facts || {}, t = task.text, code = task.code;
  const need = (...xs) => { for (const x of xs) if (!shown(t, x)) return 'в условии нет числа ' + (typeof x === 'object' ? x.n + '/' + x.d : x); return null; };
  let v, miss = null;
  if (code === 'AP-VAL') {
    const a1 = Q(f.a1), d = Q(f.d), n = f.n;
    const dAbs = d.n < 0n ? R(-d.n, d.d) : d;
    miss = f.sub === 'sediment' ? need(dAbs, n) : need(a1, dAbs, n);
    // base 1: «в n-м ряду/дне/часе» — от первого n − 1 переходов; base 0: «через n минут» — n переходов
    let x = a1; const steps = f.base === 1 ? n - 1 : n;
    for (let i = 0; i < steps; i++) x = add(x, d);
    v = x;
  } else if (code === 'AP-SUM') {
    const a1 = Q(f.a1), d = Q(f.d), n = f.n;
    const dAbs = d.n < 0n ? R(-d.n, d.d) : d;
    miss = need(a1, dAbs, n);
    let x = a1, s = R(0);
    for (let i = 0; i < n; i++) { s = add(s, x); x = add(x, d); }
    v = s;
  } else if (code === 'AP-2PT') {
    if (f.sub === 'press') {
      miss = need(f.h1, f.P1, f.s, f.h2);
      const segs = div(sub(Q(f.h2), Q(f.h1)), Q(f.s));
      if (segs.d !== 1n) return { bad: 'давление: разница высот не делится на шаг' };
      v = sub(Q(f.P1), segs);
    } else {
      miss = f.sub === 'clock' ? need(f.am, f.p) : need(f.ak, f.am, f.k, f.m, f.p);
      const step = div(sub(Q(f.am), Q(f.ak)), R(f.m - f.k));
      v = add(Q(f.ak), mul(step, R(f.p - f.k)));
    }
  } else if (code === 'AP-SUM2DAY') {
    if (f.sub === 'snail') {
      miss = need(f.Fs, f.S);
      v = div(mul(R(2), Q(f.S)), Q(f.Fs));
    } else {
      miss = need(f.S, f.a1, f.Nd, f.k);
      // прибавку в условии не называют: из суммы S = (2a1 + d(N − 1))·N/2
      const N = R(f.Nd), a1 = Q(f.a1);
      const d = div(sub(div(mul(R(2), Q(f.S)), N), mul(R(2), a1)), sub(N, R(1)));
      v = add(a1, mul(d, R(f.k - 1)));
    }
  } else if (code === 'GP-VAL' || code === 'GP-COMPL') {
    let periods = f.k;
    if (f.P !== undefined && f.T !== undefined && f.P !== 1) {
      miss = need(f.P, f.T);
      const r = div(R(f.T), R(f.P)); if (r.d !== 1n) return { bad: 'время не делится на период' };
      periods = Number(r.n);
    } else miss = need(f.k);
    miss = miss || need(f.m0);
    const q = Q(f.q || 2);
    const up = f.sub === 'grow' || f.sub === 'dough';
    const rest = up ? mul(Q(f.m0), pow(q, periods)) : div(Q(f.m0), pow(q, periods));
    v = code === 'GP-COMPL' ? sub(Q(f.m0), rest) : rest;
  } else if (code === 'THRESH') {
    if (f.sub === 'bounce') {
      miss = need(f.h1, f.q, f.L);
      let h = Q(f.h1), n = 1;
      while (cmp(h, Q(f.L)) >= 0) { h = div(h, Q(f.q)); n++; if (n > 60) return { bad: 'отскоки: нет конца' }; }
      v = R(n);
    } else {
      miss = need(f.X);
      let add1 = R(2), s = R(0), n = 0;
      do { n++; s = add(s, add1); add1 = mul(add1, R(2)); } while (cmp(s, Q(f.X)) < 0 && n < 60);
      v = R(n);
    }
  } else if (code === 'PIC') {
    if (f.sub === 'tables') { miss = need(f.n); let seats = 4; for (let i = 2; i <= f.n; i++) seats += 2; v = R(seats); }   // каждый новый столик +2 места
    else if (f.sub === 'logs') { miss = need(f.base); let s = 0; for (let i = 1; i <= f.base; i++) s += i; v = R(s); }
    else { miss = need(f.K); let s = 0; for (let L = 1; L <= f.K; L++) s += 2 * L; v = R(s); }
  } else if (code === 'TAXI') {
    miss = need(f.K, f.C0, f.S2, f.T, f.K + 1, f.K + f.M);
    const perMin = div(Q(f.S2), R(f.M));
    v = add(Q(f.C0), mul(perMin, R(f.T - f.K)));
  } else return { bad: 'неизвестный код ' + code };
  if (miss) return { bad: code + '/' + (f.sub || '') + ': ' + miss };
  return { v };
}
export { shown };
