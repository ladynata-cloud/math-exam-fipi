/*
  Независимый решатель задания 10 (вероятность) для гейта OGE_COURSE_03D_ALGEBRA.
  Читает только то, что видит ученик: текст условия и подписи чертежа (SVG).
  Код тренажёра и его поле meta в ответе не участвуют.
*/
import { R, add, mul, div, eq, cmp } from './oge-algebra-contract.lib.mjs';

const strip = (h) => String(h).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const bolds = (h) => [...String(h).matchAll(/<b>([^<]*)<\/b>/g)].map((m) => m[1]);
/* «0,15», «−3», «12» → рациональное */
export function num(s) {
  s = String(s).trim().replace(/[−]/g, '-').replace(/\s/g, '');
  const m = /^(-?)(\d+)(?:,(\d+))?$/.exec(s);
  if (!m) return null;
  const fr = m[3] || '', den = 10n ** BigInt(fr.length);
  return R((m[1] ? -1n : 1n) * (BigInt(m[2]) * den + BigInt(fr || '0')), den);
}
/* десятичная запись конечна? */
export function terminates(f) { let d = f.d; while (d % 2n === 0n) d /= 2n; while (d % 5n === 0n) d /= 5n; return d === 1n; }
/* округление до сотых (вероятности неотрицательны): половина — вверх */
export function round2(f) { const x = f.n * 100n, q = x / f.d, r = x % f.d; return R(2n * r >= f.d ? q + 1n : q, 100n); }

/* подписи SVG: [{x, y, t}] */
function svgTexts(svg) {
  return [...String(svg || '').matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>(.*?)<\/text>/g)]
    .map((m) => ({ x: +m[1], y: +m[2], t: strip(m[3]) }));
}
const at = (T, x, y) => { const e = T.find((o) => Math.abs(o.x - x) < 0.5 && Math.abs(o.y - y) < 0.5); return e ? e.t : null; };

/* сколько упорядоченных пар (a; b) очков двух кубиков удовлетворяют условию из текста */
function diceCount(text) {
  const t = strip(text), B = bolds(text).map(Number);
  let pred = null;
  if (/не меньше \d+ и не больше \d+/.test(t)) { const [lo, hi] = B; pred = (s) => s >= lo && s <= hi; }
  else if (/выпадет \d+, \d+ или \d+ очк/.test(t)) { const set = new Set(B); pred = (s) => set.has(s); }
  else if (/в сумме выпадет \d+ очк/.test(t)) { const s0 = B[0]; pred = (s) => s === s0; }
  else if (/сумма очков окажется нечётной/.test(t)) pred = (s) => s % 2 === 1;
  else if (/сумма очков окажется чётной/.test(t)) pred = (s) => s % 2 === 0;
  if (!pred) return null;
  let c = 0;
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (pred(a + b)) c++;
  return c;
}

/*
  solve(task) → { key, rounded|null, parts } или { bad: 'почему' }.
  task: { code, text, svg } — как у тренажёра; code — «10.1» … «10.7» или «10_1» … «10_7».
*/
export function solve(task) {
  const code = String(task.code).replace('_', '.');
  const text = task.text, t = strip(text), B = bolds(text);
  let key = null;
  if (code === '10.1') {
    const m = /ровно (\d+) равновозможных .*? благоприятствуют (\d+) из них/.exec(t);
    if (!m) return { bad: '10.1: не разобрано условие' };
    key = R(BigInt(m[2]), BigInt(m[1]));
  } else if (code === '10.2') {
    // «лежат 7 красных и 13 синих значков … окажется синим»
    const m = /лежат (\d+) ([а-яё]+) и (\d+) ([а-яё]+) .*? окажется ([а-яё]+)\./.exec(t);
    if (!m) return { bad: '10.2: не разобрано условие' };
    const st = (w) => w.slice(0, -1);
    const a = BigInt(m[1]), b = BigInt(m[3]);
    const fav = st(m[5]) === st(m[2]) ? a : st(m[5]) === st(m[4]) ? b : null;
    if (fav === null) return { bad: '10.2: цвет вопроса не найден среди цветов условия' };
    key = R(fav, a + b);
  } else if (code === '10.3') {
    // «лежат 9 оранжевых и 12 голубых фишек … первая фишка оказалась оранжевой … вторая фишка тоже окажется оранжевой»
    const m = /лежат (\d+) ([а-яё]+) и (\d+) ([а-яё]+) .*? по очереди достают .*? первая [а-яё]+ оказалась ([а-яё]+)\. .*? вторая [а-яё]+ тоже окажется ([а-яё]+)\./.exec(t);
    if (!m) return { bad: '10.3: не разобрано условие' };
    const st = (w) => w.slice(0, -2);
    if (st(m[5]) !== st(m[6])) return { bad: '10.3: первый и второй цвет вопроса различаются' };
    const g = BigInt(m[1]), y = BigInt(m[3]);
    const need = st(m[6]) === st(m[2]) ? g : st(m[6]) === st(m[4]) ? y : null;
    if (need === null) return { bad: '10.3: цвет вопроса не найден' };
    if (!/не глядя/.test(t)) return { bad: '10.3: нет «не глядя»' };
    key = R(need - 1n, g + y - 1n);   // без возвращения: первый уже вынут
  } else if (code === '10.4') {
    const m = /Монету бросили (\d+) раз\. .*? орёл выпал ровно (\d+) раз\. .*? выпала (решка|орёл)/.exec(t);
    if (!m) return { bad: '10.4: не разобрано условие' };
    const N = BigInt(m[1]), h = BigInt(m[2]);
    key = R(m[3] === 'решка' ? N - h : h, N);
  } else if (code === '10.5') {
    const c = diceCount(text);
    if (c === null) return { bad: '10.5: не разобрано условие' };
    key = R(BigInt(c), 36n);
  } else if (code === '10.6') {
    const T = svgTexts(task.svg);
    // рёбра: корень→верх (96;66), корень→низ (96;158), верх→листья (240;18), (240;86), низ→листья (240;140), (240;212)
    const e = [[96, 66], [96, 158], [240, 18], [240, 86], [240, 140], [240, 212]].map(([x, y]) => num(at(T, x, y)));
    const leaves = [16, 88, 136, 208].map((y) => at(T, 320, y + 5));
    if (e.some((v) => !v) || leaves.some((v) => v == null)) return { bad: '10.6: не прочитан чертёж' };
    if (!eq(add(e[0], e[1]), R(1)) || !eq(add(e[2], e[3]), R(1)) || !eq(add(e[4], e[5]), R(1))) return { bad: '10.6: на развилке сумма не 1' };
    let s = R(0), nb = 0;
    leaves.forEach((l, i) => { if (l === 'B') { nb++; s = add(s, mul(i < 2 ? e[0] : e[1], e[2 + i])); } });
    if (!nb) return { bad: '10.6: нет листьев B' };
    key = s;
  } else if (code === '10.7') {
    const T = svgTexts(task.svg);
    const v = [[122, 112], [200, 112], [278, 112], [360, 192]].map(([x, y]) => num(at(T, x, y)));
    if (v.some((x) => !x)) return { bad: '10.7: не прочитан чертёж' };
    const [oA, oI, oB, oO] = v, tot = add(add(oA, oI), add(oB, oO));
    const probs = /указана её вероятность/.test(t), counts = /указано число равновозможных/.test(t);
    if (probs === counts) return { bad: '10.7: не понятно, что в областях' };
    let fav;
    if (/произойдёт событие A, но не произойдёт B/.test(t)) fav = oA;
    else if (/события A и B произойдут одновременно/.test(t)) fav = oI;
    else if (/хотя бы одно из событий A, B/.test(t)) fav = add(add(oA, oI), oB);
    else if (/произойдёт событие A\./.test(t)) fav = add(oA, oI);
    else if (/произойдёт событие B\./.test(t)) fav = add(oB, oI);
    else return { bad: '10.7: событие не разобрано' };
    if (probs && !eq(tot, R(1))) return { bad: '10.7: вероятности областей в сумме не 1' };
    key = probs ? fav : div(fav, tot);
  } else return { bad: 'неизвестный тип ' + task.code };
  if (cmp(key, R(0)) < 0 || cmp(key, R(1)) > 0) return { bad: code + ': вероятность вне [0; 1]' };
  const askRound = /округлите до сотых/.test(t);
  if (askRound === terminates(key)) return { bad: code + ': просьба округлить ' + (askRound ? 'при конечной дроби' : 'не стоит, а дробь бесконечная') };
  return { key, rounded: askRound ? round2(key) : null };
}

/* ловушки итогового ответа, пересчитанные по условию и чертежу (решение D27):
   значения без сообщений; равная ответу снимается, повтор значения — один раз;
   в 10.5 сравнение — по округлённому до сотых, если дробь бесконечная */
export function trapValues(task) {
  const code = String(task.code).replace('_', '.');
  const sol = solve(task);
  if (sol.bad) return null;
  const t = strip(task.text), B = bolds(task.text), out = [];
  const add = (v) => { if (v) out.push(v); };   // здесь add — «записать ловушку»; сложение дробей — add2
  const ONE = R(1);
  if (code === '10.1') {
    const m = /ровно (\d+) равновозможных .*? благоприятствуют (\d+) из них/.exec(t);
    const N = BigInt(m[1]), k = BigInt(m[2]);
    add(R(N, k)); add(R(N - k, N)); if (N - k) add(R(k, N - k));
  } else if (code === '10.2') {
    const m = /лежат (\d+) ([а-яё]+) и (\d+) ([а-яё]+) .*? окажется ([а-яё]+)\./.exec(t);
    const st = (w) => w.slice(0, -1), a = BigInt(m[1]), b = BigInt(m[3]);
    const fav = st(m[5]) === st(m[2]) ? a : b, tot = a + b;
    add(R(tot, fav)); add(R(tot - fav, tot)); add(R(fav, tot - fav));
  } else if (code === '10.3') {
    const m = /лежат (\d+) ([а-яё]+) и (\d+) ([а-яё]+) .*? тоже окажется ([а-яё]+)\./.exec(t);
    const st = (w) => w.slice(0, -2), n1 = BigInt(m[1]), n2 = BigInt(m[3]);
    const g = st(m[5]) === st(m[2]) ? n1 : n2, y = g === n1 ? n2 : n1, T = g + y;
    add(R(g, T)); add(R(g - 1n, T)); add(R(g, T - 1n)); add(R(y, T - 1n)); add(R(T - 1n, g - 1n));
  } else if (code === '10.4') {
    const m = /Монету бросили (\d+) раз\. .*? орёл выпал ровно (\d+) раз/.exec(t);
    const N = BigInt(m[1]), h = BigInt(m[2]), tl = N - h;
    add(R(1, 2)); add(R(h, N)); add(R(N, tl)); add(R(tl, h));
  } else if (code === '10.5') {
    // условие → множество подходящих сумм; упорядоченные и неупорядоченные пары считаются перебором
    const sums = [];
    const pairs = []; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) pairs.push([a, b]);
    const okSum = (() => {
      if (/не меньше \d+ и не больше \d+/.test(t)) { const [lo, hi] = B.map(Number); return (s) => s >= lo && s <= hi; }
      if (/выпадет \d+, \d+ или \d+ очк/.test(t)) { const set = new Set(B.map(Number)); return (s) => set.has(s); }
      if (/в сумме выпадет \d+ очк/.test(t)) { const s0 = Number(B[0]); return (s) => s === s0; }
      if (/нечётной/.test(t)) return (s) => s % 2 === 1;
      return (s) => s % 2 === 0;
    })();
    for (let s = 2; s <= 12; s++) if (okSum(s)) sums.push(s);
    const cnt = pairs.filter(([a, b]) => okSum(a + b)).length;
    const u = pairs.filter(([a, b]) => a <= b && okSum(a + b)).length;
    add(R(BigInt(sums.length), 11n)); add(R(BigInt(u), 21n)); add(R(BigInt(cnt), 12n));
    if (sol.rounded) { const x = sol.key.n * 100n / sol.key.d, tr = R(x, 100n); if (!eq(tr, sol.rounded)) add(tr); }
  } else if (code === '10.6') {
    const T = svgTexts(task.svg);
    const e = [[96, 66], [96, 158], [240, 18], [240, 86], [240, 140], [240, 212]].map(([x, y]) => num(at(T, x, y)));
    const leaves = [16, 88, 136, 208].map((y) => at(T, 320, y + 5));
    const bl = leaves.map((l, i) => (l === 'B' ? i : -1)).filter((i) => i >= 0);
    const first = (i) => (i < 2 ? e[0] : e[1]), second = (i) => e[2 + i];
    const lf = bl.map((i) => mul(first(i), second(i))), ps = bl.map((i) => add2(first(i), second(i)));
    add(add2(ps[0], ps[1])); add(mul(lf[0], lf[1])); add(lf[0]); add(lf[1]); add(sub1(ONE, sol.key));
  } else if (code === '10.7') {
    const T = svgTexts(task.svg);
    const [oA, oI, oB, oO] = [[122, 112], [200, 112], [278, 112], [360, 192]].map(([x, y]) => num(at(T, x, y)));
    const counts = /указано число равновозможных/.test(t), tot = add2(add2(oA, oI), add2(oB, oO));
    const P = (v) => (counts ? div(v, tot) : v);
    let ev;
    if (/произойдёт событие A, но не произойдёт B/.test(t)) ev = 'AnotB';
    else if (/события A и B произойдут одновременно/.test(t)) ev = 'AiB';
    else if (/хотя бы одно из событий A, B/.test(t)) ev = 'AuB';
    else if (/произойдёт событие A\./.test(t)) ev = 'A';
    else ev = 'B';
    const other = { A: add2(oB, oI), B: add2(oA, oI), AnotB: oB }[ev];
    if (other) add(P(other));
    const fav = { A: add2(oA, oI), B: add2(oB, oI), AiB: oI, AuB: add2(add2(oA, oI), oB), AnotB: oA }[ev];
    if (counts) add(div(fav, sub1(tot, oO)));
    if (ev === 'AuB') { add(P(add2(add2(oA, oB), mul(R(2), oI)))); add(P(oI)); }
    if (ev === 'AiB') add(P(add2(add2(oA, oI), oB)));
    add(sub1(ONE, sol.key));
  }
  const keyOf = (v) => (code === '10.5' && !terminates(v) ? round2(v) : v);
  const ak = sol.rounded || sol.key, res = [];
  for (const v of out) { const k = keyOf(v); if (eq(k, ak) || res.some((r) => eq(keyOf(r), k))) continue; res.push(v); }
  return res;
}
const add2 = (a, b) => add(a, b);
const sub1 = (a, b) => R(a.n * b.d - b.n * a.d, a.d * b.d);
