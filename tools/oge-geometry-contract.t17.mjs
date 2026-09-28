/*
  Независимый решатель задания 17 ОГЭ «Четырёхугольники» —
  внешний пересчёт ответов для trainers/oge-task17-quadrilaterals.html.

  Зачем. Канон проекта требует пересчитать каждый ответ ДРУГИМ кодом, не тем
  выражением, из которого ответ получен в тренажёре. Тренажёр считает ответы
  формулами-приёмами (d = a√2, S = d₁d₂/2, m = (a + b)/2, 180° − 2α …).
  Здесь их нет: по числам задачи строится сам четырёхугольник в координатах,
  и искомое ИЗМЕРЯЕТСЯ на построенной фигуре.

  Как.
   • Вершины — точки плоскости. Точка пересечения диагоналей, биссектриса,
     основание высоты, середины сторон — пересечения прямых, проекции,
     пересечения прямой и окружности.
   • Параметры формы, которых в условии нет прямо (угол ромба по расстоянию
     от центра до стороны, угол параллелограмма по площади, длина основания,
     при которой диагональ — биссектриса, …), подбираются численно: сетка +
     бисекция, пока построенная фигура не воспроизведёт данные условия.
   • Искомое измеряется: углы — через векторы (atan2 векторного и скалярного
     произведений), длины — Math.hypot, площади — формулой шнурования.
   • Где форма фигуры условием не задана (параллелограмм с данной площадью,
     трапеция с данными основаниями и высотой), фигура строится в нескольких
     разных формах, и ответ обязан от формы не зависеть.
   • Если фигуры с такими числами нет (нарушено неравенство треугольника,
     площадь больше произведения сторон, трапеция не замыкается или
     вырождается в прямоугольник/параллелограмм, искомого «острого угла»
     не существует), решатель ответ не выдумывает: validity называет
     причину, solve возвращает NaN.

  Экспорт:
    solve[k](p)    — ответ подтипа k, число. Для rhombHeightSegments —
                     массив [меньший отрезок, больший отрезок]: в тренажёре
                     это ansFmt:'concat', ответ-строка «две длины подряд по
                     возрастанию» (при сверке склеивать через fnum тренажёра).
                     Фигуры нет — NaN (для rhombHeightSegments — [NaN, NaN]).
    validity(k, p) — '' если фигура с такими числами существует и искомое
                     определено, иначе короткая причина по-русски.

  Голый Node, без зависимостей:
    import { solve, validity } from './oge-geometry-contract.t17.mjs';
*/

/* ================= ГЕОМЕТРИЧЕСКОЕ ЯДРО ================= */

const RAD = (d) => (d * Math.PI) / 180;
const DEG = (r) => (r * 180) / Math.PI;
const pt = (x, y) => ({ x, y });
const add = (P, Q) => pt(P.x + Q.x, P.y + Q.y);
const sub = (P, Q) => pt(P.x - Q.x, P.y - Q.y);
const mul = (P, k) => pt(P.x * k, P.y * k);
const dot = (u, v) => u.x * v.x + u.y * v.y;
const cross = (u, v) => u.x * v.y - u.y * v.x;
const norm = (u) => Math.hypot(u.x, u.y);
const dist = (P, Q) => Math.hypot(P.x - Q.x, P.y - Q.y);
const mid = (P, Q) => pt((P.x + Q.x) / 2, (P.y + Q.y) / 2);
const unit = (u) => mul(u, 1 / norm(u));
/* единичный вектор под углом deg к оси x */
const dir = (deg) => pt(Math.cos(RAD(deg)), Math.sin(RAD(deg)));
const O0 = pt(0, 0);
const EX = pt(1, 0); // направление оси x

/* ∠PVQ в градусах, 0..180 */
function ang(V, P, Q) {
  const u = sub(P, V), v = sub(Q, V);
  return DEG(Math.atan2(Math.abs(cross(u, v)), dot(u, v)));
}
/* угол между прямыми P1P2 и Q1Q2, 0..90 */
function lineAng(P1, P2, Q1, Q2) {
  const a = ang(O0, sub(P2, P1), sub(Q2, Q1));
  return Math.min(a, 180 - a);
}
/* векторы параллельны: синус угла между ними не больше tol */
const parallel = (u, v, tol = 1e-9) => Math.abs(cross(u, v)) <= tol * norm(u) * norm(v);
/* пересечение прямых P1P2 и Q1Q2; null — если прямые параллельны */
function meet(P1, P2, Q1, Q2) {
  const r = sub(P2, P1), s = sub(Q2, Q1);
  if (parallel(r, s)) return null;
  return add(P1, mul(r, cross(sub(Q1, P1), s) / cross(r, s)));
}
/* основание перпендикуляра из P на прямую AB */
function foot(P, A, B) {
  const d = sub(B, A);
  return add(A, mul(d, dot(sub(P, A), d) / dot(d, d)));
}
/* площадь многоугольника по формуле шнурования */
function area(...pts) {
  let s = 0;
  pts.forEach((P, i) => {
    const Q = pts[(i + 1) % pts.length];
    s += P.x * Q.y - Q.x * P.y;
  });
  return Math.abs(s) / 2;
}
/* точки пересечения окружностей (O1, r1) и (O2, r2) */
function circles(O1, r1, O2, r2) {
  const d = dist(O1, O2);
  if (!(d > 0)) return [];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h2 = r1 * r1 - a * a;
  if (h2 < 0) return [];
  const e = mul(sub(O2, O1), 1 / d), M = add(O1, mul(e, a)), n = pt(-e.y, e.x), h = Math.sqrt(h2);
  return [add(M, mul(n, h)), add(M, mul(n, -h))];
}
/* из набора точек — самая далёкая от X (null, если набор пуст) */
const farthest = (pts, X) => pts.reduce((best, P) => (best && dist(best, X) >= dist(P, X) ? best : P), null);

/* ================= ЧИСЛЕННЫЙ ПОДБОР ================= */

/*
  Все корни f на [lo, hi]: сетка из n шагов, на каждом шаге со сменой знака —
  бисекция. Там, где фигура не строится, f возвращает NaN. Если шаг граничит
  с такой точкой (край области: вырождение в прямоугольник, нулевой угол,
  нулевое основание), его «пустой» конец сначала подтягивается бисекцией
  к самому краю — иначе корень, лежащий у края внутри одного шага сетки,
  потерялся бы. Корень принимается, только если в нём |f| действительно мал
  (это отсекает «корни» на разрывах) и если он не прилип к самому краю
  области: корень на краю — это вырожденная фигура (трапеция без основания,
  нулевой угол), а не ответ.
  scale — порядок величины f (для порога «точного нуля» в узле сетки).
*/
function roots(f, lo, hi, n = 90, scale = 100) {
  const out = [];
  const fin = Number.isFinite;
  const keep = (x) => { if (!out.some((y) => Math.abs(y - x) <= 1e-9 * (hi - lo))) out.push(x); };
  const zero = (v) => fin(v) && Math.abs(v) <= 1e-11 * scale;
  const tiny = (a, b) => Math.abs(b - a) <= 1e-15 * Math.max(1, Math.abs(a));
  const stuck = (x, e) => e !== null && Math.abs(x - e) <= 1e-12 * (hi - lo);
  // ближайшая к краю области точка между xOk (f определена) и xBad (NaN), где f ещё определена
  const edge = (xOk, xBad) => {
    for (let k = 0; k < 200 && !tiny(xOk, xBad); k++) {
      const m = (xOk + xBad) / 2;
      if (fin(f(m))) xOk = m; else xBad = m;
    }
    return xOk;
  };
  let x0 = lo, f0 = f(lo);
  if (zero(f0)) keep(lo);
  for (let i = 1; i <= n; i++) {
    const x1 = lo + ((hi - lo) * i) / n, f1 = f(x1);
    let a = x0, fa = f0, b = x1, fb = f1, ea = null, eb = null;
    if (fin(fa) && !fin(fb)) { b = eb = edge(a, b); fb = f(b); }
    else if (!fin(fa) && fin(fb)) { a = ea = edge(b, a); fa = f(a); }
    if (eb === null && zero(fb)) keep(b); // точный ноль в узле сетки (не на краю области)
    else if (fin(fa) && fin(fb) && !zero(fa) && !zero(fb) && (fa < 0) !== (fb < 0)) {
      const fa0 = fa, fb0 = fb;
      for (let k = 0; k < 200 && !tiny(a, b); k++) {
        const m = (a + b) / 2, fm = f(m);
        if (!fin(fm)) break;
        if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m;
      }
      const r = (a + b) / 2, fr = f(r);
      if (fin(fr) && !stuck(r, ea) && !stuck(r, eb) && Math.abs(fr) <= 1e-7 * Math.max(1, Math.abs(fa0), Math.abs(fb0))) keep(r);
    }
    x0 = x1; f0 = f1;
  }
  return out;
}
/* корень функции, меняющей знак на [lo, hi] (один корень); NaN, если знак не меняется */
function bisect(f, lo, hi) {
  let a = lo, b = hi, fa = f(lo);
  const fb = f(hi);
  if (fa === 0) return lo;
  if (fb === 0) return hi;
  if (!Number.isFinite(fa) || !Number.isFinite(fb) || (fa < 0) === (fb < 0)) return NaN;
  for (let k = 0; k < 200 && b - a > 1e-15 * Math.max(1, Math.abs(a)); k++) {
    const m = (a + b) / 2, fm = f(m);
    if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m;
  }
  return (a + b) / 2;
}
/* параметр на (0; +∞) через угол u ∈ (0°; 90°): t = tg u — сетка покрывает и малые, и большие t;
   концы u = 0° и u = 90° (t = 0 и t = ∞) — вырождение, там NaN */
const tanDeg = (u) => (u > 0 && u < 90 ? Math.tan(RAD(u)) : NaN);

/* ================= ОТКАЗ: ФИГУРЫ С ТАКИМИ ЧИСЛАМИ НЕТ ================= */

class Invalid extends Error {}
function need(cond, msg) {
  if (!cond) throw new Invalid(msg);
}
/* внутренняя сверка: построенная фигура воспроизводит данные условия */
function holds(cond, what) {
  need(cond, 'построение не воспроизводит условие: ' + what);
}
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
/* число для сообщения: до 4 знаков, десятичная запятая */
const fmt = (v) => (isNum(v) ? String(Math.round(v * 1e4) / 1e4).replace('.', ',') : typeof v === 'string' ? '«' + v + '»' : String(v));
const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));
function lengths(p, ...names) {
  for (const n of names) need(isNum(p[n]) && p[n] > 0, `${n} = ${fmt(p[n])}: нужна положительная величина`);
}
function degrees(p, name, lo, hi, what) {
  const v = p[name];
  need(isNum(v) && v > lo && v < hi, `${what} = ${fmt(v)}°: такой угол должен быть строго между ${lo}° и ${hi}°`);
}
function oneOf(p, name, list) {
  need(list.includes(p[name]), `${name} = ${fmt(p[name])}: ожидалось одно из ${list.join(', ')}`);
}
/* все измерения совпали — ответ не зависит от свободных параметров построения */
function same(vals) {
  need(vals.length > 0, 'фигура не построилась');
  need(vals.every((v) => isNum(v) && close(v, vals[0])),
    `ответ зависит от формы фигуры (${vals.map(fmt).join(' ≠ ')}) — данных в условии не хватает`);
  return vals[0];
}

/* ================= ЧЕТЫРЁХУГОЛЬНИКИ ================= */
/* Q = {A, B, C, D} — вершины в порядке обхода. */

const angles4 = (Q) => ({ A: ang(Q.A, Q.D, Q.B), B: ang(Q.B, Q.A, Q.C), C: ang(Q.C, Q.B, Q.D), D: ang(Q.D, Q.C, Q.A) });
const angleList = (Q) => Object.values(angles4(Q));
const perimeter = (Q) => dist(Q.A, Q.B) + dist(Q.B, Q.C) + dist(Q.C, Q.D) + dist(Q.D, Q.A);
const areaQ = (Q) => area(Q.A, Q.B, Q.C, Q.D);
/* точка пересечения диагоналей AC и BD */
const diagO = (Q) => meet(Q.A, Q.C, Q.B, Q.D);
/* длина отрезка по имени: 'AC', 'BO', 'CD' … (O — пересечение диагоналей) */
function seg(Q, name) {
  const at = (c) => (c === 'O' ? diagO(Q) : Q[c]);
  const P1 = at(name[0]), P2 = at(name[1]);
  return P1 && P2 ? dist(P1, P2) : NaN;
}
/* выпуклость ABCD: все четыре поворота одного знака, ни один не вырожден и ни одна сторона
   не стянулась в точку (длина ничтожна рядом с остальными — направление такой «стороны» —
   шум округления, и по поворотам вырождение не видно) */
function convex(Q) {
  const P = [Q.A, Q.B, Q.C, Q.D];
  const sides = P.map((X, i) => dist(X, P[(i + 1) % 4]));
  if (!(Math.min(...sides) > 1e-9 * Math.max(...sides))) return false;
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const u = sub(P[(i + 1) % 4], P[i]), v = sub(P[(i + 2) % 4], P[(i + 1) % 4]);
    const s = cross(u, v) / (norm(u) * norm(v));
    if (!(Math.abs(s) > 1e-7)) return false; // нулевая сторона, NaN или развёрнутый угол
    if (!sign) sign = Math.sign(s);
    else if (Math.sign(s) !== sign) return false;
  }
  return true;
}
/* трапеция с основаниями AD и BC (по Атанасяну): выпукла, BC ∥ AD, боковые AB и CD не параллельны */
const isTrap = (Q) => convex(Q) && parallel(sub(Q.C, Q.B), sub(Q.D, Q.A)) && !parallel(sub(Q.B, Q.A), sub(Q.D, Q.C), 1e-7);

/* квадрат со стороной s: AB — это AD, повёрнутый на 90°; C — пересечение прямых через B ∥ AD и через D ∥ AB */
function square(s) {
  const A = O0, D = pt(s, 0), B = mul(dir(90), s);
  return { A, B, C: meet(B, add(B, D), D, add(D, B)), D };
}
/* параллелограмм: угол t при A, AD = w, AB = l; C — пересечение прямых через B ∥ AD и через D ∥ AB */
function parallelogram(t, w, l) {
  const A = O0, D = pt(w, 0), B = mul(dir(t), l), C = meet(B, add(B, D), D, add(D, B));
  if (!C) return null;
  const Q = { A, B, C, D };
  return convex(Q) ? Q : null;
}
/* ромб: угол t при A, все стороны s; C — вторая точка пересечения окружностей (B, s) и (D, s) */
function rhombus(t, s) {
  const A = O0, D = pt(s, 0), B = mul(dir(t), s), C = farthest(circles(B, s, D, s), A);
  if (!C) return null;
  const Q = { A, B, C, D };
  return convex(Q) ? Q : null;
}
/*
  Вершина X равнобедренной трапеции по трём другим: X лежит на прямой через P
  с направлением u (второе основание), |OX| = r (боковые стороны равны), и OX
  не параллелен уже построенной боковой стороне leg — иначе вышел бы
  параллелограмм. null — если такой точки нет или боковые стороны
  перпендикулярны основаниям (трапеция выродилась в прямоугольник).
  Считается через проекцию F точки O на прямую и s = √((r − h)(r + h)), h = |OF|:
  без вычитания больших квадратов, которое губит точность у длинных трапеций.
*/
function isoVertex(O, r, P, u, leg) {
  const e = unit(u), F = add(P, mul(e, dot(sub(O, P), e))), h = dist(O, F);
  if (!(h <= r)) return null;
  const s = Math.sqrt((r - h) * (r + h));
  if (s <= 1e-9 * r) return null;
  const good = [add(F, mul(e, -s)), add(F, mul(e, s))].filter((X) => !parallel(sub(X, O), leg, 1e-7));
  return good.length === 1 ? good[0] : null;
}
/* равнобедренная трапеция: A(0,0), D(L,0), AB = s под углом t к AD; C — по равенству боковых сторон */
function isoTrapAngle(t, L, s) {
  const A = O0, D = pt(L, 0), B = mul(dir(t), s), C = isoVertex(D, s, B, EX, sub(B, A));
  if (!C) return null;
  const Q = { A, B, C, D };
  return isTrap(Q) ? Q : null;
}
/* равнобедренная трапеция по основаниям и высоте: AD = bottom, BC = top на высоте h;
   сдвиг верхнего основания подбирается из равенства боковых сторон AB = CD */
function isoTrapBases(bottom, top, h) {
  const make = (x) => ({ A: O0, B: pt(x, h), C: pt(x + top, h), D: pt(bottom, 0) });
  const R = 2 * (bottom + top);
  const x = bisect((x) => { const Q = make(x); return dist(Q.A, Q.B) - dist(Q.C, Q.D); }, -R, R);
  if (!isNum(x)) return null;
  const Q = make(x);
  return isTrap(Q) ? Q : null;
}
/* трапеция общего вида: AD = bottom на оси x, BC = top на высоте h, левый конец BC сдвинут на x0 */
const trapezoid = (bottom, top, h, x0) => ({ A: O0, B: pt(x0, h), C: pt(x0 + top, h), D: pt(bottom, 0) });
/* прямоугольная трапеция: прямые углы при A и B, высота 1, наклонная CD под углом t к DA */
function rightTrap(t) {
  const v = mul(dir(180 - t), 1 / Math.sin(RAD(t))); // вектор D→C
  const D = pt(1 + Math.max(0, -v.x), 0), C = add(D, v);
  const Q = { A: O0, B: pt(0, 1), C, D };
  return isTrap(Q) ? Q : null;
}
/* параллелограмм данной формы [угол, AD, AB], подобно растянутый до площади S */
function parWithArea([t, w, l], S) {
  const k = Math.sqrt(S / areaQ(parallelogram(t, w, l)));
  const Q = parallelogram(t, w * k, l * k);
  holds(close(areaQ(Q), S), 'площадь параллелограмма');
  return Q;
}
/* фигуры семейства make(t), у которых какой-то из четырёх углов равен given */
function shapesWithAngle(make, given, lo, hi) {
  const out = [];
  for (const V of ['A', 'B', 'C', 'D']) {
    const f = (t) => { const Q = make(t); return Q ? angles4(Q)[V] - given : NaN; };
    for (const t of roots(f, lo, hi)) out.push(make(t));
  }
  return out;
}
/* больший (q = 'big') или меньший угол каждой найденной фигуры — у всех один и тот же */
const bigOrSmall = (shapes, q) => same(shapes.map((Q) => (q === 'big' ? Math.max(...angleList(Q)) : Math.min(...angleList(Q)))));
/* острый угол фигуры — если он вообще есть */
function acuteOf(Q) {
  const m = Math.min(...angleList(Q));
  need(m < 90 - 1e-7, 'все углы фигуры прямые — острого угла нет');
  return m;
}

/* формы, в которых строятся фигуры с незаданной условием формой */
const PAR_FORMS = [[58, 13, 7], [117, 5, 9], [90, 4, 4]]; // [угол при A, AD, AB]
const TRAP_SHIFTS = [0.2, -0.35, 0.8]; // сдвиг верхнего основания в долях нижнего

/* ================= ПОДТИПЫ ================= */
/* Каждый строитель возвращает измеренный ответ или бросает Invalid с причиной. */

const BUILD = {
  /* ---------- КВАДРАТ ---------- */

  // Квадрат со стороной k√2; диагональ — расстояние между вершинами A и C.
  sqDiag(p) {
    lengths(p, 'k');
    const Q = square(p.k * Math.SQRT2);
    return dist(Q.A, Q.C);
  },

  // Квадрат со стороной k√2; площадь — шнурованием по вершинам.
  sqAreaSide(p) {
    lengths(p, 'k');
    return areaQ(square(p.k * Math.SQRT2));
  },

  // Единичный квадрат растягивается так, чтобы его ИЗМЕРЕННЫЙ периметр стал P; площадь — шнурованием.
  sqAreaPerim(p) {
    lengths(p, 'P');
    const Q = square(p.P / perimeter(square(1)));
    holds(close(perimeter(Q), p.P), 'периметр');
    return areaQ(Q);
  },

  /* ---------- ПРЯМОУГОЛЬНИК ---------- */

  // Диагональ AC (длина 1) под углом alpha к стороне AD; B и D — проекции C на стороны прямого угла A.
  // O = AC ∩ BD; из углов AOB и AOD при O берётся острый.
  rectDiagAngle(p) {
    degrees(p, 'alpha', 0, 90, 'угол диагонали со стороной');
    const C = dir(p.alpha), Q = { A: O0, B: pt(0, C.y), C, D: pt(C.x, 0) };
    holds(close(ang(Q.A, Q.C, Q.D), p.alpha), 'угол диагонали со стороной');
    const O = diagO(Q), acute = Math.min(ang(O, Q.A, Q.B), ang(O, Q.A, Q.D));
    need(acute < 90 - 1e-7, 'угол 45°: диагонали перпендикулярны (это квадрат) — острого угла между ними нет');
    return acute;
  },

  // Прямоугольник A(0,0), B(0,u), C(w,u), D(w,0). Названная в условии сторона получает длину side,
  // другая подбирается так, чтобы названный отрезок до O (пересечения диагоналей) был равен half;
  // затем измеряется названная диагональ.
  rectDiagBO(p) {
    lengths(p, 'half', 'side');
    oneOf(p, 'hn', ['AO', 'OA', 'BO', 'OB', 'CO', 'OC', 'DO', 'OD']);
    oneOf(p, 'sn', ['AB', 'BA', 'BC', 'CB', 'CD', 'DC', 'DA', 'AD']);
    oneOf(p, 'dn', ['AC', 'CA', 'BD', 'DB']);
    const vertical = ['AB', 'BA', 'CD', 'DC'].includes(p.sn);
    const make = (x) => {
      const u = vertical ? p.side : x, w = vertical ? x : p.side;
      const Q = { A: O0, B: pt(0, u), C: pt(w, u), D: pt(w, 0) };
      return convex(Q) ? Q : null;
    };
    const xs = roots((x) => { const Q = make(x); return Q ? seg(Q, p.hn) - p.half : NaN; }, 0, 2 * (p.half + p.side));
    need(xs.length, `${p.hn} = ${fmt(p.half)} ≤ ${p.sn}/2 = ${fmt(p.side / 2)}: диагональ — гипотенуза, она длиннее стороны, значит и её половина длиннее половины стороны`);
    return same(xs.map((x) => seg(make(x), p.dn)));
  },

  /* ---------- РОМБ ---------- */

  // Перебор ромбов с углом t при A: ищем те, у которых один из углов равен данному; берём больший/меньший угол.
  rhombAngle(p) {
    degrees(p, 'given', 0, 180, 'данный угол ромба');
    oneOf(p, 'q', ['big', 'small']);
    const shapes = shapesWithAngle((t) => rhombus(t, 1), p.given, 0, 180);
    need(shapes.length, 'ромба с таким углом нет');
    return bigOrSmall(shapes, p.q);
  },

  // B(0,0), BA по оси x, BC под углом abc; D — вторая точка пересечения окружностей (A, 1) и (C, 1).
  rhombACD(p) {
    degrees(p, 'abc', 0, 180, '∠ABC');
    const B = O0, A = EX, C = dir(p.abc), D = farthest(circles(A, 1, C, 1), B);
    const Q = { A, B, C, D };
    holds(D && convex(Q) && close(ang(B, A, C), p.abc), 'ромб с данным ∠ABC');
    return ang(C, A, D);
  },

  // Ромб со стороной a и углом ang при A; высота — длина перпендикуляра между противоположными сторонами
  // (из B на AD и из A на CD — обе обязаны совпасть).
  rhombHeight(p) {
    lengths(p, 'a');
    degrees(p, 'ang', 0, 180, 'угол ромба');
    const Q = rhombus(p.ang, p.a);
    holds(Q, 'ромб');
    return same([dist(Q.B, foot(Q.B, Q.A, Q.D)), dist(Q.A, foot(Q.A, Q.C, Q.D))]);
  },

  // A(0,0), C(d1,0). B и D равноудалены от A и C (стороны равны) — лежат на серединном перпендикуляре к AC —
  // и симметричны относительно AC (AB = AD), так что BD = d2. Площадь — шнурованием.
  rhombAreaDiag(p) {
    lengths(p, 'd1', 'd2');
    const A = O0, C = pt(p.d1, 0), M = mid(A, C), n = pt(0, 1);
    const Q = { A, B: add(M, mul(n, p.d2 / 2)), C, D: add(M, mul(n, -p.d2 / 2)) };
    const s = dist(Q.A, Q.B);
    holds(convex(Q) && [dist(Q.B, Q.C), dist(Q.C, Q.D), dist(Q.D, Q.A)].every((v) => close(v, s)) && close(dist(Q.B, Q.D), p.d2), 'ромб с диагоналями d1, d2');
    return areaQ(Q);
  },

  // Единичный ромб с данным углом растягивается до ИЗМЕРЕННОГО периметра P; площадь — шнурованием.
  rhombAreaPerim(p) {
    lengths(p, 'P');
    degrees(p, 'ang', 0, 180, 'угол ромба');
    const Q = rhombus(p.ang, p.P / perimeter(rhombus(p.ang, 1)));
    holds(Q && close(perimeter(Q), p.P), 'периметр');
    return areaQ(Q);
  },

  // Ромб со стороной a и неизвестным углом t ∈ (0°; 90°] при A; O — пересечение диагоналей.
  // t подбирается так, чтобы перпендикуляр из O на AB был равен dist; площадь — шнурованием.
  rhombAreaDist(p) {
    lengths(p, 'a', 'dist');
    const rho = (Q) => { const O = diagO(Q); return dist(O, foot(O, Q.A, Q.B)); };
    const ts = roots((t) => { const Q = rhombus(t, p.a); return Q ? rho(Q) - p.dist : NaN; }, 0, 90);
    need(ts.length, `высота ромба 2·${fmt(p.dist)} = ${fmt(2 * p.dist)} длиннее его стороны ${fmt(p.a)}: расстояние от центра до стороны не больше половины стороны`);
    return same(ts.map((t) => areaQ(rhombus(t, p.a))));
  },

  // Ромб с углом t при A; O — пересечение диагоналей, H — основание перпендикуляра из O на AB.
  // Ищем t, при которых OH образует с диагональю AC или BD угол phi; ответ — острый угол найденного ромба.
  rhombPerpDiag(p) {
    degrees(p, 'phi', 0, 90, 'угол перпендикуляра с диагональю');
    const f = (t, V) => {
      const Q = rhombus(t, 1);
      if (!Q) return NaN;
      const O = diagO(Q), H = foot(O, Q.A, Q.B);
      return lineAng(O, H, O, Q[V]) - p.phi;
    };
    const ts = [...roots((t) => f(t, 'A'), 0, 180), ...roots((t) => f(t, 'B'), 0, 180)];
    need(ts.length, 'ромба с таким углом нет');
    return same(ts.map((t) => acuteOf(rhombus(t, 1))));
  },

  // Ромб с данным углом; большая диагональ — длиннейшая из AC, BD. Высоты двух направлений
  // (из B на AD и из B на CD) — угол каждой с большей диагональю как угол между прямыми.
  rhombHeightBigDiag(p) {
    degrees(p, 'ang', 0, 180, 'угол ромба');
    const Q = rhombus(p.ang, 1);
    holds(Q, 'ромб');
    const ac = dist(Q.A, Q.C), bd = dist(Q.B, Q.D);
    need(!close(ac, bd, 1e-7), 'угол 90°: это квадрат, диагонали равны — «большей» нет');
    const [P1, P2] = ac > bd ? [Q.A, Q.C] : [Q.B, Q.D];
    return same([foot(Q.B, Q.A, Q.D), foot(Q.B, Q.C, Q.D)].map((H) => lineAng(Q.B, H, P1, P2)));
  },

  // Ромб с данным острым углом; меньшая диагональ — кратчайшая из AC, BD; её угол с каждой из сторон.
  rhombSideSmallDiag(p) {
    degrees(p, 'ac', 0, 90, 'острый угол ромба');
    const Q = rhombus(p.ac, 1);
    holds(Q, 'ромб');
    const [P1, P2] = dist(Q.A, Q.C) < dist(Q.B, Q.D) ? [Q.A, Q.C] : [Q.B, Q.D];
    return same([['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']].map(([u, v]) => lineAng(Q[u], Q[v], P1, P2)));
  },

  // Ромб со стороной a, острый угол при A, тупой — при B; H — основание перпендикуляра из B на AD.
  // Ответ — отрезки AH и HD по возрастанию (массив).
  rhombHeightSegments(p) {
    lengths(p, 'a');
    degrees(p, 'ang', 0, 90, 'острый угол ромба');
    const Q = rhombus(p.ang, p.a);
    holds(Q && angles4(Q).B > 90, 'ромб с тупым углом при B');
    const H = foot(Q.B, Q.A, Q.D), s1 = dist(Q.A, H), s2 = dist(H, Q.D);
    need(s1 > 1e-9 && s2 > 1e-9 && close(s1 + s2, p.a), 'основание высоты не попадает внутрь стороны');
    return [Math.min(s1, s2), Math.max(s1, s2)];
  },

  /* ---------- ПАРАЛЛЕЛОГРАММ ---------- */

  // Параллелограммы трёх разных форм, подобно растянутые до площади S; E — середина AB;
  // площадь DAEC — шнурованием. Ответ не должен зависеть от формы.
  parTrapDAEC(p) {
    lengths(p, 'S');
    return same(PAR_FORMS.map((form) => {
      const Q = parWithArea(form, p.S), E = mid(Q.A, Q.B);
      holds(parallel(sub(E, Q.A), sub(Q.C, Q.D)) && !parallel(sub(Q.C, E), sub(Q.D, Q.A)), 'DAEC — трапеция (AE ∥ DC)');
      return area(Q.D, Q.A, E, Q.C);
    }));
  },

  // То же построение; площадь треугольника CBE — шнурованием.
  parTriCBE(p) {
    lengths(p, 'S');
    return same(PAR_FORMS.map((form) => {
      const Q = parWithArea(form, p.S);
      return area(Q.C, Q.B, mid(Q.A, Q.B));
    }));
  },

  // A(0,0), B(ab,0); D = B + bd·(cos t, sin t) — так BD = bd при любом t; C достраивается до
  // параллелограмма. Угол t подбирается так, чтобы AC = ac; O = AC ∩ BD; измеряется названный отрезок.
  parDiagHalf(p) {
    lengths(p, 'ac', 'bd', 'ab');
    oneOf(p, 'tgt', ['AO', 'OA', 'BO', 'OB', 'CO', 'OC', 'DO', 'OD']);
    const A = O0, B = pt(p.ab, 0);
    const make = (t) => {
      const D = add(B, mul(dir(t), p.bd)), C = meet(B, add(B, sub(D, A)), D, add(D, sub(B, A)));
      if (!C) return null;
      const Q = { A, B, C, D };
      return convex(Q) ? Q : null;
    };
    const ts = roots((t) => { const Q = make(t); return Q ? dist(Q.A, Q.C) - p.ac : NaN; }, 0, 180);
    const AO = p.ac / 2, BO = p.bd / 2;
    need(ts.length, `треугольник AOB не существует: AO = ${fmt(AO)}, BO = ${fmt(BO)}, AB = ${fmt(p.ab)} — ` +
      (AO + BO <= p.ab ? `AO + BO = ${fmt(AO + BO)} ≤ AB` : `|AO − BO| = ${fmt(Math.abs(AO - BO))} ≥ AB`));
    return same(ts.map((t) => seg(make(t), p.tgt)));
  },

  // Параллелограмм AD = s1, AB = s2 с углом t ∈ (0°; 90°] при A; t подбирается по площади (шнурование).
  // Высоты — перпендикуляры из B на AD и из D на AB; берётся бо́льшая или ме́ньшая.
  parHeights(p) {
    lengths(p, 'S', 's1', 's2');
    oneOf(p, 'q', ['big', 'small']);
    const make = (t) => parallelogram(t, p.s1, p.s2);
    const ts = roots((t) => { const Q = make(t); return Q ? areaQ(Q) - p.S : NaN; }, 0, 90, 90, p.S);
    need(ts.length, `площадь ${fmt(p.S)} больше произведения сторон ${fmt(p.s1)}·${fmt(p.s2)} = ${fmt(p.s1 * p.s2)}: sin угла был бы ${fmt(p.S / (p.s1 * p.s2))} > 1`);
    return same(ts.map((t) => {
      const Q = make(t), h1 = dist(Q.B, foot(Q.B, Q.A, Q.D)), h2 = dist(Q.D, foot(Q.D, Q.A, Q.B));
      return p.q === 'big' ? Math.max(h1, h2) : Math.min(h1, h2);
    }));
  },

  // Перебор параллелограммов с углом t при A: у которых один из углов равен данному; больший/меньший угол.
  parAngle(p) {
    degrees(p, 'given', 0, 180, 'данный угол параллелограмма');
    oneOf(p, 'q', ['big', 'small']);
    const shapes = shapesWithAngle((t) => parallelogram(t, 13, 7), p.given, 0, 180);
    need(shapes.length, 'параллелограмма с таким углом нет');
    return bigOrSmall(shapes, p.q);
  },

  // A(0,0): AD по оси x, AC (длина 1) под углом b к AD, AB — ещё на a дальше. B — на луче AB и на прямой
  // через C ∥ AD; D — на оси x и на прямой через C ∥ AB. Ответ — наибольший из измеренных углов.
  parDiagAngles(p) {
    degrees(p, 'a', 0, 180, 'угол диагонали со стороной');
    degrees(p, 'b', 0, 180, 'угол диагонали со стороной');
    need(p.a + p.b < 180, `${fmt(p.a)}° + ${fmt(p.b)}° ≥ 180°: угол параллелограмма меньше 180°`);
    const A = O0, C = dir(p.b), uB = dir(p.a + p.b);
    const B = meet(A, uB, C, add(C, EX)), D = meet(A, EX, C, add(C, uB));
    const Q = { A, B, C, D };
    holds(B && D && convex(Q) && close(ang(A, B, C), p.a) && close(ang(A, C, D), p.b), 'углы диагонали со сторонами');
    return Math.max(...angleList(Q));
  },

  // Параллелограмм с углом t при A (две разные пары сторон); биссектриса угла A — луч по сумме
  // единичных векторов AB и AD; K — её пересечение с прямой BC. Ищем t, при котором угол между AK
  // и BC равен phi; ответ — острый угол параллелограмма.
  parBisector(p) {
    degrees(p, 'phi', 0, 90, 'угол биссектрисы со стороной BC');
    const res = [];
    for (const [w, l] of [[13, 7], [5, 9]]) {
      const f = (t) => {
        const Q = parallelogram(t, w, l);
        if (!Q) return NaN;
        const u = add(unit(sub(Q.B, Q.A)), unit(sub(Q.D, Q.A))), K = meet(Q.A, add(Q.A, u), Q.B, Q.C);
        return K ? lineAng(Q.A, K, Q.B, Q.C) - p.phi : NaN;
      };
      for (const t of roots(f, 0, 180)) res.push(acuteOf(parallelogram(t, w, l)));
    }
    need(res.length, 'параллелограмма с таким углом биссектрисы нет');
    return same(res);
  },

  /* ---------- ТРАПЕЦИЯ ---------- */

  // Трапеции трёх разных форм с основаниями a, b и высотой h; M, N — середины боковых сторон; |MN|.
  trapMid(p) {
    lengths(p, 'a', 'b', 'h');
    return same(TRAP_SHIFTS.map((x) => {
      const Q = trapezoid(p.b, p.a, p.h, x * p.b);
      need(isTrap(Q), `основания равны (${fmt(p.a)} = ${fmt(p.b)}): это параллелограмм, а не трапеция`);
      return dist(mid(Q.A, Q.B), mid(Q.C, Q.D));
    }));
  },

  // Те же трапеции; площадь — шнурованием.
  trapArea(p) {
    lengths(p, 'a', 'b', 'h');
    return same(TRAP_SHIFTS.map((x) => {
      const Q = trapezoid(p.b, p.a, p.h, x * p.b);
      need(isTrap(Q), `основания равны (${fmt(p.a)} = ${fmt(p.b)}): это параллелограмм, а не трапеция`);
      return areaQ(Q);
    }));
  },

  // Равнобедренные трапеции (угол t при A, C — по равенству боковых сторон) при двух длинах AD:
  // у которых один из углов равен данному; больший/меньший угол.
  trapIso(p) {
    degrees(p, 'given', 0, 180, 'данный угол трапеции');
    oneOf(p, 'q', ['big', 'small']);
    need(!close(p.given, 90), 'в равнобедренной трапеции нет прямых углов (с прямым углом это прямоугольник)');
    const shapes = [3, 5].flatMap((L) => shapesWithAngle((t) => isoTrapAngle(t, L, 1), p.given, 0, 180));
    need(shapes.length, 'равнобедренной трапеции с таким углом нет');
    return bigOrSmall(shapes, p.q);
  },

  // Равнобедренные трапеции с углом t при A: перебор всех шести пар вершин — ищем t, при котором сумма
  // пары углов равна данной; больший/меньший угол найденной трапеции.
  trapSum(p) {
    degrees(p, 'sum', 0, 360, 'сумма двух углов');
    oneOf(p, 'q', ['big', 'small']);
    need(!close(p.sum, 180), 'сумма 180°: столько дают любые два угла при боковой стороне — углы трапеции ею не определяются');
    const make = (t) => isoTrapAngle(t, 3, 1), shapes = [];
    for (const [u, v] of [['A', 'B'], ['A', 'C'], ['A', 'D'], ['B', 'C'], ['B', 'D'], ['C', 'D']]) {
      const f = (t) => { const Q = make(t); if (!Q) return NaN; const g = angles4(Q); return g[u] + g[v] - p.sum; };
      for (const t of roots(f, 0, 180)) shapes.push(make(t));
    }
    need(shapes.length, 'у равнобедренной трапеции нет двух углов с такой суммой');
    return bigOrSmall(shapes, p.q);
  },

  // Прямоугольные трапеции (прямые углы при A и B, угол t при D): у которых один из углов равен данному.
  trapRect(p) {
    degrees(p, 'given', 0, 180, 'данный угол трапеции');
    oneOf(p, 'q', ['big', 'small']);
    need(!close(p.given, 90), 'данный угол прямой — он не определяет наклонную боковую сторону');
    const shapes = shapesWithAngle(rightTrap, p.given, 0, 180);
    need(shapes.length, 'прямоугольной трапеции с таким углом нет');
    return bigOrSmall(shapes, p.q);
  },

  // A(0,0), D(ad,0); C на расстоянии ac от A (направление AC — свободный параметр, четыре варианта),
  // B = C − (bc, 0): BC ∥ AD и направлены одинаково. O = AC ∩ BD; измеряется AO.
  trapDiagAO(p) {
    lengths(p, 'bc', 'ad', 'ac');
    return same([25, 60, 90, 125].map((phi) => {
      const C = mul(dir(phi), p.ac), Q = { A: O0, B: sub(C, pt(p.bc, 0)), C, D: pt(p.ad, 0) };
      need(isTrap(Q), `основания равны (BC = AD = ${fmt(p.ad)}): это параллелограмм, а не трапеция`);
      return dist(Q.A, diagO(Q));
    }));
  },

  // Трапеции трёх форм; средняя линия MN соединяет середины боковых сторон; P — её пересечение
  // с диагональю (AC и отдельно BD); больший из отрезков MP, PN.
  trapMidSeg(p) {
    lengths(p, 'a', 'b');
    const vals = [];
    for (const [x, h] of [[0.2, 1], [-0.35, 3], [0.8, 0.5]]) {
      const Q = trapezoid(p.b, p.a, h * p.b, x * p.b);
      need(isTrap(Q), `основания равны (${fmt(p.a)} = ${fmt(p.b)}): это параллелограмм, а не трапеция`);
      const M = mid(Q.A, Q.B), N = mid(Q.C, Q.D);
      for (const [u, v] of [['A', 'C'], ['B', 'D']]) {
        const P = meet(M, N, Q[u], Q[v]);
        vals.push(Math.max(dist(M, P), dist(P, N)));
      }
    }
    return same(vals);
  },

  // Равнобедренная трапеция ABCD: варианты по p.v.
  //  ADCD: A(0,0), AD по оси x, AC (длина 1) под углом a к AD, луч CD повёрнут от CA на b, D — на оси x;
  //        B — на прямой через C ∥ AD с AB = CD (не параллелограмм). Измеряется ∠ABC.
  //  BCAB: A(0,0), AC (длина 1) по оси x, AB под углом b к AC, луч CB повёрнут от CA на a; B — их
  //        пересечение; D — на прямой через A ∥ BC с CD = AB. Измеряется ∠ADC.
  trapDiagFindC(p) {
    degrees(p, 'a', 0, 180, 'первый угол диагонали');
    degrees(p, 'b', 0, 180, 'второй угол диагонали');
    oneOf(p, 'v', ['ADCD', 'BCAB']);
    need(p.a + p.b < 180, `${fmt(p.a)}° + ${fmt(p.b)}° ≥ 180°: это два угла одного треугольника с диагональью`);
    const rest = 180 - 2 * p.a - p.b;
    if (p.v === 'ADCD') {
      const A = O0, C = dir(p.a), D = meet(C, add(C, dir(180 + p.a + p.b)), A, EX);
      holds(D && close(ang(A, C, D), p.a) && close(ang(C, A, D), p.b), '∠CAD = a, ∠ACD = b');
      const B = isoVertex(A, dist(C, D), C, EX, sub(C, D));
      need(B, '∠ADC = 90°: равнобедренная трапеция с прямым углом — прямоугольник, а не трапеция');
      const Q = { A, B, C, D };
      need(isTrap(Q), `∠BAC = ∠BAD − ∠CAD = (180° − ${fmt(p.a)}° − ${fmt(p.b)}°) − ${fmt(p.a)}° = ${fmt(rest)}° ≤ 0: диагональ AC не проходит внутри угла A — четырёхугольник ABCD самопересекающийся, трапеции нет`);
      return ang(B, A, C);
    }
    const A = O0, C = EX, B = meet(A, dir(p.b), C, add(C, dir(180 - p.a)));
    holds(B && close(ang(C, A, B), p.a) && close(ang(A, B, C), p.b), '∠ACB = a, ∠BAC = b');
    const D = isoVertex(C, dist(A, B), A, sub(C, B), sub(B, A));
    need(D, '∠ABC = 90°: равнобедренная трапеция с прямым углом — прямоугольник, а не трапеция');
    const Q = { A, B, C, D };
    need(isTrap(Q), `∠ACD = ∠BCD − ∠BCA = (180° − ${fmt(p.a)}° − ${fmt(p.b)}°) − ${fmt(p.a)}° = ${fmt(rest)}° ≤ 0: диагональ AC не проходит внутри угла C — четырёхугольник ABCD самопересекающийся, трапеции нет`);
    return ang(D, A, C);
  },

  // Равнобедренная трапеция по диагонали и двум углам (в тексте: «больший», если a + b < 90°, иначе «меньший»).
  //  по умолчанию: A(0,0), AD по оси x, AC под углом a, AB под углом a + b; B — на прямой через C ∥ AD;
  //                D — на оси x с CD = AB (не параллелограмм).
  //  BCCD:         C(0,0), CB по отрицательной оси x, CA повёрнута от CB на a, CD — ещё на b; D — на
  //                прямой через A ∥ BC; B — на прямой CB с AB = CD.
  trapDiagBS(p) {
    degrees(p, 'a', 0, 180, 'первый угол диагонали');
    degrees(p, 'b', 0, 180, 'второй угол диагонали');
    need(p.a + p.b < 180, `${fmt(p.a)}° + ${fmt(p.b)}° ≥ 180°: угол трапеции меньше 180°`);
    const asked = p.a + p.b < 90 ? 'big' : 'small';
    const rest = fmt(180 - 2 * p.a - p.b);
    let Q;
    if (p.v === 'BCCD') {
      const C = O0, A = dir(180 + p.a), D = meet(C, dir(180 + p.a + p.b), A, add(A, EX));
      holds(D, 'вершина D');
      const B = isoVertex(A, dist(C, D), C, EX, sub(D, C));
      need(B, '∠BCD = 90°: равнобедренная трапеция с прямым углом — прямоугольник, а не трапеция');
      Q = { A, B, C, D };
      need(isTrap(Q), `∠BAC = 180° − ∠ABC − ∠BCA = ${rest}° ≤ 0: треугольник ABC не замыкается — трапеции нет`);
      holds(close(ang(C, A, B), p.a) && close(ang(C, A, D), p.b), '∠ACB = a, ∠ACD = b');
    } else {
      const A = O0, C = dir(p.a), B = meet(A, dir(p.a + p.b), C, add(C, EX));
      holds(B, 'вершина B');
      const D = isoVertex(C, dist(A, B), A, EX, sub(B, A));
      need(D, '∠BAD = 90°: равнобедренная трапеция с прямым углом — прямоугольник, а не трапеция');
      Q = { A, B, C, D };
      need(isTrap(Q), `∠ACD = 180° − ∠CAD − ∠ADC = ${rest}° ≤ 0: треугольник ACD не замыкается — трапеции нет`);
      holds(close(ang(A, C, D), p.a) && close(ang(A, B, C), p.b), '∠CAD = a, ∠BAC = b');
    }
    holds(close(dist(Q.A, Q.B), dist(Q.C, Q.D)), 'AB = CD');
    return asked === 'big' ? Math.max(...angleList(Q)) : Math.min(...angleList(Q));
  },

  // H — основание высоты из C: A(0,0), H(AH,0), D(AH + HD, 0), C(AH, h). Порядок отрезков в условии
  // не задан — пробуются оба; B — на прямой через C ∥ AD с AB = CD. Две высоты — ответ от h не зависит.
  trapCutBase(p) {
    lengths(p, 'big', 'small');
    const vals = [];
    for (const [ah, hd] of [[p.big, p.small], [p.small, p.big]]) {
      for (const h of [1, 2.5]) {
        const A = O0, C = pt(ah, h), D = pt(ah + hd, 0), B = isoVertex(A, dist(C, D), C, EX, sub(C, D));
        const Q = B && { A, B, C, D };
        if (Q && isTrap(Q)) vals.push(dist(Q.B, Q.C));
      }
    }
    need(vals.length, `отрезки равны (${fmt(p.big)} = ${fmt(p.small)}): верхнее основание стянулось бы в точку — трапеции нет`);
    return same(vals);
  },

  // Равнобедренная трапеция с основаниями AD = b, BC = a и высотой t; t подбирается так, чтобы
  // диагональ AC образовала с AD угол 45°. Ответ — перпендикуляр из C на AD.
  trapDiag45h(p) {
    lengths(p, 'a', 'b');
    need(!close(p.a, p.b), `основания равны (${fmt(p.a)} = ${fmt(p.b)}): это параллелограмм, а не трапеция`);
    const make = (t) => isoTrapBases(p.b, p.a, t);
    const ts = roots((t) => { const Q = make(t); return Q ? ang(Q.A, Q.C, Q.D) - 45 : NaN; }, 0, 4 * (p.a + p.b));
    need(ts.length, 'трапеции с такой диагональю нет');
    return same(ts.map((t) => {
      const Q = make(t);
      holds(close(ang(Q.D, Q.B, Q.A), 45), 'вторая диагональ тоже под 45°');
      return dist(Q.C, foot(Q.C, Q.A, Q.D));
    }));
  },

  // big: меньшее основание BC = a на высоте h, боковые стороны уходят вниз под 45° к основанию
  //      (A и D — пересечения с осью x); измеряется AD.
  // small: большее основание AD = b на оси x, боковые — лучи из A и D под 45°; B и C — их пересечения
  //      с прямой y = h; измеряется BC.
  trap45Base(p) {
    lengths(p, 'h');
    oneOf(p, 'q', ['big', 'small']);
    let Q;
    if (p.q === 'big') {
      lengths(p, 'a');
      const B = pt(0, p.h), C = pt(p.a, p.h);
      Q = { A: meet(B, add(B, dir(225)), O0, EX), B, C, D: meet(C, add(C, dir(-45)), O0, EX) };
    } else {
      lengths(p, 'b');
      const A = O0, D = pt(p.b, 0), T1 = pt(0, p.h), T2 = pt(1, p.h);
      Q = { A, B: meet(A, dir(45), T1, T2), C: meet(D, add(D, dir(135)), T1, T2), D };
      need(isTrap(Q), `2h = ${fmt(2 * p.h)} ≥ ${fmt(p.b)}: боковые стороны под 45° сходятся не выше высоты — меньшего основания нет`);
    }
    holds(isTrap(Q) && close(angles4(Q).A, 45) && close(angles4(Q).D, 45) && close(dist(Q.C, foot(Q.C, Q.A, Q.D)), p.h), 'угол 45° и высота h');
    return p.q === 'big' ? dist(Q.A, Q.D) : dist(Q.B, Q.C);
  },

  // Большее основание AD на оси x, боковые — лучи из A и D под 45°; высота t подбирается так,
  // чтобы верхнее основание стало равно меньшему данному; площадь — шнурованием.
  trap45Area(p) {
    lengths(p, 'a', 'b');
    need(!close(p.a, p.b), `основания равны (${fmt(p.a)} = ${fmt(p.b)}): это параллелограмм, а не трапеция`);
    const big = Math.max(p.a, p.b), small = Math.min(p.a, p.b), D = pt(big, 0);
    const make = (t) => {
      const T1 = pt(0, t), T2 = pt(1, t);
      const Q = { A: O0, B: meet(O0, dir(45), T1, T2), C: meet(D, add(D, dir(135)), T1, T2), D };
      return isTrap(Q) ? Q : null;
    };
    const ts = roots((t) => { const Q = make(t); return Q ? dist(Q.B, Q.C) - small : NaN; }, 0, big);
    need(ts.length, 'трапеции с такими основаниями и углом 45° нет');
    return same(ts.map((t) => areaQ(make(t))));
  },

  // Равнобедренная трапеция: A(0,0), D(L,0), CD = 1 под углом d к DA, B — на прямой через C ∥ AD
  // с AB = CD (не параллелограмм). L подбирается так, чтобы AC делила угол BAD пополам; измеряется ∠ACD.
  trapBisector(p) {
    degrees(p, 'd', 0, 180, '∠D');
    need(!close(p.d, 90), 'угол D = 90°: равнобедренная трапеция с прямым углом — прямоугольник (а с диагональю-биссектрисой — квадрат), не трапеция');
    const make = (L) => {
      const D = pt(L, 0), C = add(D, dir(180 - p.d)), B = isoVertex(O0, 1, C, EX, sub(C, D));
      const Q = B && { A: O0, B, C, D };
      return Q && isTrap(Q) ? Q : null;
    };
    const us = roots((u) => { const Q = make(tanDeg(u)); return Q ? ang(Q.A, Q.B, Q.C) - ang(Q.A, Q.C, Q.D) : NaN; }, 0, 90);
    need(us.length, `∠CAD + ∠ADC = ${fmt(p.d / 2)}° + ${fmt(p.d)}° ≥ 180°: треугольник ACD не замыкается — такой трапеции нет`);
    return same(us.map((u) => {
      const Q = make(tanDeg(u));
      holds(close(angles4(Q).D, p.d) && close(angles4(Q).A, p.d), '∠A = ∠D = d');
      return ang(Q.C, Q.A, Q.D);
    }));
  },

  // То же построение, L подбирается так, чтобы ∠BAC = ab. Меньшее основание — измеренно короче;
  // ответ — угол диагонали AC с ним при их общей вершине.
  trapDiagSmallBase(p) {
    degrees(p, 'd', 0, 180, '∠D');
    degrees(p, 'ab', 0, 180, '∠BAC');
    need(!close(p.d, 90), 'угол D = 90°: равнобедренная трапеция с прямым углом — прямоугольник, не трапеция');
    const make = (L) => {
      const D = pt(L, 0), C = add(D, dir(180 - p.d)), B = isoVertex(O0, 1, C, EX, sub(C, D));
      const Q = B && { A: O0, B, C, D };
      return Q && isTrap(Q) ? Q : null;
    };
    const us = roots((u) => { const Q = make(tanDeg(u)); return Q ? ang(Q.A, Q.B, Q.C) - p.ab : NaN; }, 0, 90);
    need(us.length, p.ab >= p.d
      ? `∠BAC = ${fmt(p.ab)}° не меньше ∠BAD = ∠D = ${fmt(p.d)}°: диагональ AC не проходит внутри угла A`
      : `∠ACD = 180° − 2·${fmt(p.d)}° + ${fmt(p.ab)}° ≤ 0: треугольник ACD не замыкается — такой трапеции нет`);
    return same(us.map((u) => {
      const Q = make(tanDeg(u));
      holds(close(angles4(Q).D, p.d), '∠D = d');
      return dist(Q.B, Q.C) < dist(Q.A, Q.D) ? ang(Q.C, Q.A, Q.B) : ang(Q.A, Q.C, Q.D);
    }));
  },

  // A(0,0), D(1,0); B — на луче из D под углом bda к DA на расстоянии t; C — на прямой через B ∥ AD
  // с CD = AB и CD ∦ AB (равнобедренная трапеция, параллелограмм исключён построением).
  // t подбирается так, чтобы ∠BDC = bdc; измеряется ∠ABD.
  // (Подбор t из условия AB = CD при заданном луче DC здесь не годится: у него есть второй,
  //  параллелограммный корень, и при ∠ADC около 90° оба корня попадают в один шаг сетки.)
  trapBDA(p) {
    degrees(p, 'bda', 0, 180, '∠BDA');
    degrees(p, 'bdc', 0, 180, '∠BDC');
    need(p.bda + p.bdc < 180, `∠ADC = ∠BDA + ∠BDC = ${fmt(p.bda + p.bdc)}° ≥ 180°`);
    need(!close(p.bda + p.bdc, 90), '∠ADC = ∠BDA + ∠BDC = 90°: при AB = CD это прямоугольник, а не трапеция');
    const D = EX, uB = dir(180 - p.bda);
    const make = (t) => {
      const B = add(D, mul(uB, t)), C = isoVertex(D, dist(O0, B), B, EX, B);
      const Q = C && { A: O0, B, C, D };
      return Q && isTrap(Q) ? Q : null;
    };
    const us = roots((u) => { const Q = make(tanDeg(u)); return Q ? ang(Q.D, Q.B, Q.C) - p.bdc : NaN; }, 0, 90);
    need(us.length, `∠ABD = 180° − ∠BAD − ∠BDA = 180° − 2·${fmt(p.bda)}° − ${fmt(p.bdc)}° = ${fmt(180 - 2 * p.bda - p.bdc)}° ≤ 0: треугольник ABD не замыкается — такой трапеции нет`);
    return same(us.map((u) => {
      const Q = make(tanDeg(u));
      holds(close(ang(Q.D, Q.A, Q.B), p.bda) && close(dist(Q.A, Q.B), dist(Q.C, Q.D)), '∠BDA и AB = CD');
      return ang(Q.B, Q.A, Q.D);
    }));
  },
};

/* ================= ЭКСПОРТ ================= */

const CONCAT = new Set(['rhombHeightSegments']); // ответ — две длины по возрастанию

function attempt(k, p) {
  const f = BUILD[k];
  if (!f) return { err: `неизвестный подтип «${k}»` };
  try {
    return { ans: f(p && typeof p === 'object' ? p : {}) };
  } catch (e) {
    if (e instanceof Invalid) return { err: e.message };
    throw e;
  }
}

/* solve[k](p) — измеренный ответ; фигуры нет — NaN ([NaN, NaN] для rhombHeightSegments) */
export const solve = Object.fromEntries(Object.keys(BUILD).map((k) => [k, (p) => {
  const r = attempt(k, p);
  if ('err' in r) return CONCAT.has(k) ? [NaN, NaN] : NaN;
  return r.ans;
}]));

/* validity(k, p) — '' если фигура с такими числами существует и искомое определено, иначе причина */
export function validity(k, p) {
  const r = attempt(k, p);
  return 'err' in r ? r.err : '';
}
