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
