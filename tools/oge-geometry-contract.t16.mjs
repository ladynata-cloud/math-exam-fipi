/*
  Независимый решатель задания 16 ОГЭ (окружность) для внешнего гейта
  тренажёра trainers/oge-task16-circle.html.

  Канон проекта требует пересчитать каждый ответ «другим кодом, не тем
  выражением, из которого ответ получен». Поэтому здесь нет ни формул
  из calc(), ни арифметики из sol(). Для каждого из 33 подтипов по числам
  условия строится чертёж в координатах: окружность с центром в начале
  координат, точки по углам, хорды, касательные, пересечения прямых
  и окружностей. Затем искомая величина ИЗМЕРЯЕТСЯ на построенной фигуре:
  угол — через atan2 векторного и скалярного произведений, длина — через
  Math.hypot, площадь — формулой шнурования (формула Гаусса).

  Если фигура по данным условия определена неоднозначно (описанный
  четырёхугольник или трапеция по трём сторонам, треугольник по периметру,
  стороне и радиусу вписанной окружности, угол между касательными),
  свободный параметр подбирается численно: сканирование и бисекция по
  измеряемой на чертеже длине или углу. Ответ снимается с любой подходящей
  построенной фигуры: если теорема, на которую опирается ответ тренажёра,
  верна, измерение с ним совпадёт.

  Экспорт:
    solve[k](p)     — число: измеренный ответ для подтипа k
                      (NaN, если фигуру по p построить нельзя);
    validity(k, p)  — '' если конфигурация из условия геометрически
                      возможна, иначе короткая причина по-русски.

  Числа условия читаются из p так же, как их печатает text(p) тренажёра
  (например, AB = k√2 при ∠C = 45° в sinR; стороны AB, BC, CD из
  касательных отрезков t в tanQuad). Модуль самодостаточен: только Math.
*/

/* ================= Векторная геометрия на плоскости ================= */
/* Ориентация математическая: ось y вверх, углы против часовой стрелки. */

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const V = (x, y) => ({ x, y });
const O = Object.freeze(V(0, 0));

const add = (a, b) => V(a.x + b.x, a.y + b.y);
const sub = (a, b) => V(a.x - b.x, a.y - b.y);
const mul = (a, s) => V(a.x * s, a.y * s);
const neg = (a) => V(-a.x, -a.y);
const dot = (a, b) => a.x * b.x + a.y * b.y;
const cross = (a, b) => a.x * b.y - a.y * b.x;
const len = (a) => Math.hypot(a.x, a.y);
const unit = (a) => mul(a, 1 / len(a));
const mid = (a, b) => V((a.x + b.x) / 2, (a.y + b.y) / 2);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/* единичный вектор под углом a° */
const dir = (a) => V(Math.cos(rad(a)), Math.sin(rad(a)));
/* точка окружности радиуса r с центром c под углом a° */
const pt = (a, r = 1, c = O) => add(c, mul(dir(a), r));
/* поворот вектора на a° против часовой стрелки */
function rot(v, a) {
  const c = Math.cos(rad(a)), s = Math.sin(rad(a));
  return V(v.x * c - v.y * s, v.x * s + v.y * c);
}

/* угол AVB в градусах (0..180): atan2(|векторное|, скалярное) */
function angleAt(Vx, A, B) {
  const u = sub(A, Vx), w = sub(B, Vx);
  return deg(Math.atan2(Math.abs(cross(u, w)), dot(u, w)));
}

/* расстояние от точки P до прямой AB */
const distToLine = (P, A, B) => Math.abs(cross(sub(B, A), sub(P, A))) / dist(A, B);

/* площадь многоугольника по вершинам (формула шнурования) */
function area(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    s += a.x * b.y - a.y * b.x;
  }
  return Math.abs(s) / 2;
}

/* пересечение прямых P1 + t·d1 и P2 + s·d2; null, если они параллельны */
function lineX(P1, d1, P2, d2) {
  const den = cross(d1, d2);
  if (Math.abs(den) <= 1e-14 * len(d1) * len(d2)) return null;
  return add(P1, mul(d1, cross(sub(P2, P1), d2) / den));
}

/* параметры t точек пересечения прямой P + t·d с окружностью (c, r), по возрастанию */
function lineCircleT(P, d, c, r) {
  const f = sub(P, c);
  const a = dot(d, d), b = dot(f, d), q = dot(f, f) - r * r;
  const D = b * b - a * q;
  if (D < 0) return [];
  const s = Math.sqrt(D);
  return [(-b - s) / a, (-b + s) / a];
}

/* дальняя точка пересечения луча из P (P на окружности или внутри) с окружностью */
function rayHit(P, d, c, r) {
  const ts = lineCircleT(P, d, c, r);
  if (!ts.length || !(ts[1] > 1e-12 * Math.max(r, 1))) return null;
  return add(P, mul(d, ts[1]));
}

/* точки пересечения двух окружностей: [слева от c1→c2, справа]; [] если их нет */
function circlesX(c1, r1, c2, r2) {
  const d = dist(c1, c2);
  if (!(d > 0) || d > r1 + r2 || d < Math.abs(r1 - r2)) return [];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const e = unit(sub(c2, c1)), n = V(-e.y, e.x);
  const M = add(c1, mul(e, a));
  return [add(M, mul(n, h)), add(M, mul(n, -h))];
}

/* точки касания касательных из внешней точки P к окружности (c, r):
   классическое построение — пересечение с окружностью на диаметре Pc (Фалес) */
function tangentPts(P, c, r) {
  const d = dist(P, c);
  if (!(d > r)) return [];
  return circlesX(c, r, mid(P, c), d / 2);
}

/* центр описанной окружности — пересечение серединных перпендикуляров */
function circumcenter(A, B, C) {
  return lineX(mid(A, B), rot(sub(B, A), 90), mid(B, C), rot(sub(C, B), 90));
}

/* направление биссектрисы угла при вершине X треугольника/многоугольника (соседи P, Q) */
const bisectorDir = (X, P, Q) => add(unit(sub(P, X)), unit(sub(Q, X)));

/* многоугольник, стороны которого касаются окружности радиуса r (центр O)
   в точках под углами angs (по порядку); вершины — пересечения соседних касательных */
function tangentPolygon(r, angs) {
  const L = angs.map((a) => ({ P: pt(a, r), d: dir(a + 90) }));
  return L.map((l, i) => {
    const m = L[(i + 1) % L.length];
    return lineX(l.P, l.d, m.P, m.d);
  });
}

/* точка на дуге окружности от P до Q, НЕ содержащей точку avoid, на доле frac дуги */
function arcPoint(P, Q, avoid, frac, c = O) {
  const ang = (T) => deg(Math.atan2(T.y - c.y, T.x - c.x));
  const norm = (a) => ((a % 360) + 360) % 360;
  const a0 = ang(P), span = norm(ang(Q) - a0); // дуга P→Q против часовой
  const r = dist(P, c);
  return norm(ang(avoid) - a0) < span
    ? pt(a0 - (360 - span) * frac, r, c) // avoid на этой дуге — идём по другой
    : pt(a0 + span * frac, r, c);
}

/* ================= Численные подборы ================= */

/* корень f на [lo, hi] бисекцией; f(lo) и f(hi) разных знаков (±Infinity допустимы);
   NaN внутри — отказ (null) */
function bisect(f, lo, hi, iters = 300) {
  let flo = f(lo);
  const fhi = f(hi);
  if (Number.isNaN(flo) || Number.isNaN(fhi)) return null;
  if (flo === 0) return lo;
  if (fhi === 0) return hi;
  if ((flo < 0) === (fhi < 0)) return null;
  for (let i = 0; i < iters; i++) {
    const m = lo + (hi - lo) / 2;
    if (!(m > lo && m < hi)) break; // точность double исчерпана
    const fm = f(m);
    if (Number.isNaN(fm)) return null;
    if (fm === 0) return m;
    if ((fm < 0) === (flo < 0)) { lo = m; flo = fm; } else hi = m;
  }
  return lo + (hi - lo) / 2;
}

/* корень f по возрастающей сетке xs: бисекция на первой смене знака между
   соседними узлами с конечными значениями */
function scanRoot(f, xs) {
  let px = null, pv = NaN;
  for (const x of xs) {
    const v = f(x);
    if (!Number.isFinite(v)) { px = null; continue; }
    if (v === 0) return x;
    if (px !== null && (v < 0) !== (pv < 0)) {
      const r = bisect(f, px, x);
      if (r !== null) return r;
    }
    px = x; pv = v;
  }
  return null;
}

const close9 = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));

/* ================= Построители неоднозначных фигур ================= */

/* Треугольник по периметру Per, стороне g и радиусу вписанной окружности r.
   Вписанная окружность — центр I(0; r); сторона AB лежит на оси x и касается
   окружности в начале координат: A(−u; 0), B(g − u; 0). Вершина C — пересечение
   вторых касательных из A и из B. */
function sprBuild(g, r, u) {
  const I = V(0, r), A = V(-u, 0), B = V(g - u, 0);
  const second = (X) => { // вторая точка касания — не та, что на оси x
    const ts = tangentPts(X, I, r);
    if (ts.length < 2) return null;
    return ts[0].y > ts[1].y ? ts[0] : ts[1];
  };
  const TA = second(A), TB = second(B);
  if (!TA || !TB) return null;
  const C = lineX(A, sub(TA, A), B, sub(TB, B));
  if (!C) return null;
  // касательные должны сойтись за точками касания, иначе треугольника нет
  if (!(dot(sub(C, A), sub(TA, A)) > dot(sub(TA, A), sub(TA, A)))) return null;
  if (!(dot(sub(C, B), sub(TB, B)) > dot(sub(TB, B), sub(TB, B)))) return null;
  return { A, B, C, per: dist(A, B) + dist(B, C) + dist(C, A) };
}
/* Периметр построенного треугольника убывает при u → g/2 (равнобедренный — самый
   короткий) и уходит в бесконечность, когда касательные перестают сходиться,
   поэтому u подбирается бисекцией на (0; g/2]. */
function sprTriangle(Per, r, g) {
  if (!(Per > 0 && r > 0 && g > 0)) return null;
  const f = (u) => { const t = sprBuild(g, r, u); return t ? t.per - Per : Infinity; };
  const fIso = f(g / 2);
  if (!(fIso <= 1e-12 * Per)) return null;
  if (fIso >= 0) return sprBuild(g, r, g / 2);
  const u = bisect(f, 1e-12 * g, g / 2);
  return u === null ? null : sprBuild(g, r, u);
}

/* Описанный четырёхугольник по сторонам AB, BC, CD.
   B — в начале координат, луч BA — по оси x, луч BC — под углом th. Центр I
   вписанной окружности — на биссектрисе угла B над точкой касания (xB; 0) стороны
   BA (0 < xB < min(AB, BC), поэтому касания BA и BC — внутри отрезков). Вторые
   касательные из A и из C сходятся в D. Возвращает фигуру либо {over: ±1}:
   +1 — касательные из A и C расходятся (сумма измеренных углов A, B, C ≥ 360°),
   −1 — угол D получился бы не меньше развёрнутого (сумма ≤ 180°). */
function tanQuadBuild(AB, BC, th, xB) {
  const B = V(0, 0), A = V(AB, 0), C = pt(th, BC);
  const I = lineX(B, dir(th / 2), V(xB, 0), V(0, 1));
  if (!I || !(I.y > 0)) return null;
  const r = I.y;
  const second = (X, Y) => { // точка касания из X, не лежащая на прямой XY
    const ts = tangentPts(X, I, r);
    if (ts.length < 2) return null;
    return distToLine(ts[0], X, Y) > distToLine(ts[1], X, Y) ? ts[0] : ts[1];
  };
  const TA = second(A, B), TC = second(C, B);
  if (!TA || !TC) return null;
  const s = angleAt(A, B, TA) + angleAt(B, A, C) + angleAt(C, B, TC);
  if (s >= 360) return { over: 1 };
  if (s <= 180) return { over: -1 };
  const D = lineX(A, sub(TA, A), C, sub(TC, C));
  if (!D) return { over: 1 };
  // касания CD и DA — во внутренних точках отрезков; обход A→B→C→D выпуклый
  const inside = (T, X, Y) => {
    const d = sub(Y, X), q = dot(sub(T, X), d) / dot(d, d);
    return q > 0 && q < 1;
  };
  if (!inside(TC, C, D) || !inside(TA, D, A)) return null;
  const Q = [A, B, C, D];
  const turns = Q.map((X, i) => cross(sub(Q[(i + 1) % 4], X), sub(Q[(i + 2) % 4], Q[(i + 1) % 4])));
  if (!(turns.every((t) => t > 0) || turns.every((t) => t < 0))) return null;
  return { A, B, C, D };
}
/* Три стороны задают однопараметрическое семейство описанных четырёхугольников.
   Берём точку касания xB (сначала равномерно, затем сгущаясь к min(AB, BC));
   при фиксированном xB рост угла B монотонно увеличивает сумму углов и длину CD,
   поэтому угол B находится бисекцией по измеренной CD. */
function tanQuadFind(AB, BC, CD) {
  if (!(AB > 0 && BC > 0 && CD > 0)) return null;
  const xmax = Math.min(AB, BC), cand = [];
  for (let i = 15; i >= 1; i--) cand.push((xmax * i) / 16);
  for (let j = 5; j <= 48; j++) cand.push(xmax * (1 - 2 ** -j));
  for (const xB of cand) {
    const f = (th) => {
      const Q = tanQuadBuild(AB, BC, th, xB);
      if (!Q) return NaN;
      return Q.over ? Q.over * Infinity : dist(Q.C, Q.D) - CD;
    };
    // у 180° окружность огромна и касание из A теряет точность — там не ищем
    const th = bisect(f, 1e-6, 179.5);
    if (th === null) continue;
    const Q = tanQuadBuild(AB, BC, th, xB);
    if (Q && !Q.over && close9(dist(Q.C, Q.D), CD)) return Q;
  }
  return null;
}

/* Описанная трапеция: окружность радиуса ρ с центром O, основания — параллельные
   касательные y = −ρ (AD) и y = ρ (BC), боковая сторона — касательная в точке
   окружности под углом ph; её концы — пересечения с основаниями. */
function legOn(rho, ph) {
  const T = pt(ph, rho), d = dir(ph + 90);
  const low = lineX(V(0, -rho), V(1, 0), T, d), high = lineX(V(0, rho), V(1, 0), T, d);
  return low && high ? { low, high } : null;
}
/* Угол точки касания, при котором боковая сторона имеет длину L. Ветви:
   'L+' / 'L−' — левая сторона AB, касание выше / ниже центра (90°..180° / 180°..270°),
   'R+' / 'R−' — правая сторона CD (0°..90° / −90°..0°). На ветви длина монотонна:
   2ρ у вертикали и неограниченно растёт к горизонтали. */
function legAngle(rho, L, br) {
  const f = (ph) => { const g = legOn(rho, ph); return g ? dist(g.low, g.high) - L : NaN; };
  const vert = br[0] === 'L' ? 180 : 0;
  if (Math.abs(f(vert)) <= 1e-12 * L) return vert; // сторона ровно равна высоте
  // отступ от горизонтали δ = ρ/L радиан: там сторона не короче 2L (sin δ ≤ δ)
  const d = deg(rho / L);
  const horiz = { 'L+': 90 + d, 'L-': 270 - d, 'R+': 90 - d, 'R-': -90 + d }[br];
  return vert < horiz ? bisect(f, vert, horiz) : bisect(f, horiz, vert);
}
const TRAP_BRANCHES = [['L+', 'R+'], ['L+', 'R-'], ['L-', 'R+'], ['L-', 'R-']];
/* Подбор ρ: при данных AB и CD измеряем BC и добиваемся BC, равной данной.
   Сетка по ρ ∈ (0; m]: геометрическая у нуля (очень плоские трапеции)
   и сгущённая у m, где высота равна короткой боковой стороне. */
function tanTrapFind(ab, bc, cd) {
  if (!(ab > 0 && bc > 0 && cd > 0)) return null;
  const m = Math.min(ab, cd) / 2; // боковая сторона не короче высоты 2ρ
  const grid = [];
  for (let j = 40; j >= 2; j--) grid.push(m * 2 ** -j);
  for (let j = 0; j <= 32; j++) grid.push(m * (1 - 0.5 * (1 - j / 32) ** 2));
  for (const [bl, br] of TRAP_BRANCHES) {
    const build = (rho) => {
      const pl = legAngle(rho, ab, bl), pr = legAngle(rho, cd, br);
      if (pl === null || pr === null) return null;
      const L = legOn(rho, pl), R = legOn(rho, pr);
      return L && R ? { A: L.low, B: L.high, C: R.high, D: R.low } : null;
    };
    const f = (rho) => { const T = build(rho); return T ? dist(T.B, T.C) - bc : NaN; };
    const rho = scanRoot(f, grid);
    if (rho === null) continue;
    const T = build(rho);
    if (T && close9(dist(T.A, T.B), ab) && close9(dist(T.B, T.C), bc) && close9(dist(T.C, T.D), cd)) return T;
  }
  return null;
}

/* ================= Решатели подтипов ================= */

export const solve = {
  /* ---------- Углы ---------- */

  // Вписанный угол по центральному и обратно
  insCen(p) {
    const c = +p.c;
    if (!p.rev) {
      // ∠AOB = c по построению; C — на большей дуге AB (так на чертеже тренажёра),
      // взята несимметрично, чтобы не опираться на равнобедренность
      const A = pt(-90 - c / 2), B = pt(-90 + c / 2);
      const C = pt(-90 + c / 2 + 0.37 * (360 - c));
      return angleAt(C, A, B);
    }
    // дан вписанный ∠ACB = c/2: из точки C окружности — два луча внутрь круга
    // с углом c/2 между ними, их вторые точки на окружности — A и B
    const half = c / 4, skew = 0.25 * Math.min(half, 90 - half);
    const C = pt(107), inward = unit(neg(C));
    const A = rayHit(C, rot(inward, half + skew), O, 1);
    const B = rayHit(C, rot(inward, -(half - skew)), O, 1);
    return A && B ? angleAt(O, A, B) : NaN;
  },

  // Диаметры AD и BC: ∠OAB ↔ ∠OCD
  twoDiam(p) {
    const x = +p.x;
    // X — вершина данного угла (A или C), Y — вторая точка хорды из X,
    // проведённой под углом x к радиусу XO; противоположные концы диаметров −X, −Y.
    // given A: C = −B, D = −A, ищем ∠OCD; given C: A = −D, B = −C, ищем ∠OAB —
    // в обоих случаях это угол при вершине −Y между лучами на O и на −X
    const X = pt(160);
    const Y = rayHit(X, rot(unit(neg(X)), -x), O, 1);
    return Y ? angleAt(neg(Y), O, neg(X)) : NaN;
  },

  // NP — диаметр, ∠MNP = x, ищем центральный ∠MON
  diamMON(p) {
    const x = +p.x;
    const N = pt(55), P = neg(N);
    const M = rayHit(N, rot(unit(sub(P, N)), x), O, 1);
    return M ? angleAt(O, M, N) : NaN;
  },

  // Диаметры AC и BD: ∠AOD ↔ ∠ACB
  diamsPair(p) {
    const x = +p.x;
    if (p.given === 'O') {
      const A = pt(200), D = pt(200 - x); // центральный ∠AOD = x
      const C = neg(A), B = neg(D);
      return angleAt(C, A, B);
    }
    // дан ∠ACB = x: A — противоположный конец диаметра из C,
    // B — вторая точка луча из C под углом x к CA, D — противоположный конец BD
    const C = pt(20), A = neg(C);
    const B = rayHit(C, rot(unit(sub(A, C)), -x), O, 1);
    return B ? angleAt(O, A, neg(B)) : NaN;
  },

  // AB — диаметр, M и N по разные стороны, ∠NBA = x, ищем ∠NMB
  mnDiam(p) {
    const x = +p.x;
    const A = V(-1, 0), B = V(1, 0);
    const N = rayHit(B, rot(unit(sub(A, B)), -x), O, 1); // над AB
    const M = pt(-117);                                   // под AB
    return N ? angleAt(M, N, B) : NaN;
  },

  // Сторона-диаметр: дан угол при одном конце диаметра, ищем угол при другом
  diamTri(p) {
    const a = +p.a;
    const L = V(-1, 0), R = V(1, 0);       // L = A; R = C (side AC) или B (side AB)
    const T = rayHit(L, dir(a), O, 1);     // третья вершина: луч из A под углом a
    return T ? angleAt(R, L, T) : NaN;
  },

  // Центр на AB, радиус R, BC = bc, ищем AC
  diamPif(p) {
    const R = +p.R, bc = +p.bc;
    const A = V(-R, 0), B = V(R, 0);
    const C = circlesX(O, R, B, bc)[0];    // C на окружности и на расстоянии bc от B
    return C ? dist(A, C) : NaN;
  },

  // Вписанный четырёхугольник: дан ∠A, ищем ∠C
  cyclQuad(p) {
    const a = +p.a;
    const A = pt(215), inward = unit(neg(A));
    const skew = 0.3 * (90 - a / 2);      // лучи несимметричны относительно AO
    const B = rayHit(A, rot(inward, a / 2 + skew), O, 1);
    const D = rayHit(A, rot(inward, -(a / 2 - skew)), O, 1);
    if (!B || !D) return NaN;
    const C = arcPoint(B, D, A, 0.41);     // C — на дуге BD, не содержащей A
    return angleAt(C, B, D);
  },

  // Вписанная трапеция с основаниями AD и BC: дан ∠A, ищем ∠C
  cyclTrap(p) {
    const a = +p.a;
    // AD — горизонтальная хорда (положение f свободно), B — вторая точка луча из A
    // под углом a к AD, C — вторая точка хорды через B, параллельной AD
    const build = (f) => {
      const A = pt(180 + f), D = pt(-f);
      const B = rayHit(A, rot(unit(sub(D, A)), a), O, 1);
      if (!B) return null;
      const ts = lineCircleT(B, V(1, 0), O, 1);
      if (ts.length < 2) return null;
      const C = add(B, V(Math.abs(ts[0]) > Math.abs(ts[1]) ? ts[0] : ts[1], 0));
      // выпуклая трапеция A→B→C→D: B и C выше AD, B левее C
      return B.y > A.y + 1e-9 && C.x - B.x > 1e-9 ? { A, B, C, D } : null;
    };
    // середина подходящих положений на сетке через 1°; при ∠A у 0° или 180° подходящая
    // полоса узкая и прижата к краю ±90° — тогда перебор сгущается к краям
    const ok = [];
    for (let f = -89; f <= 89; f += 1) if (build(f)) ok.push(f);
    let F = ok.length ? build(ok[Math.floor(ok.length / 2)]) : null;
    for (let j = 0; !F && j <= 200; j++) F = build(-90 + 2 ** (-j / 4)) || build(90 - 2 ** (-j / 4));
    return F ? angleAt(F.C, F.B, F.D) : NaN;
  },

  /* ---------- Описанная окружность ---------- */

  // Равносторонний треугольник по радиусу описанной R = k√3
  eqR2a(p) {
    const R = +p.k * Math.sqrt(3);
    // построение циркулем: окружность радиуса R с центром в точке, диаметрально
    // противоположной A, высекает на данной окружности вершины B и C
    const A = pt(90, R);
    const [B, C] = circlesX(O, R, neg(A), R);
    return B && C ? dist(A, B) : NaN;
  },

  // Равносторонний треугольник по расстоянию от центра до сторон d = k√3/2
  eqDist2a(p) {
    const d = (+p.k * Math.sqrt(3)) / 2;
    // стороны удалены от O на d — это касательные к окружности радиуса d
    // в точках через 120° (O — центр правильного треугольника)
    const T = tangentPolygon(d, [90, 210, 330]);
    return dist(T[0], T[1]);
  },

  // Квадрат по радиусу описанной R = k√2
  sqR2a(p) {
    const R = +p.k * Math.SQRT2;
    // диагонали квадрата — перпендикулярные диаметры описанной окружности
    const A = pt(23, R), B = rot(A, 90);
    return dist(A, B);
  },

  // Радиус описанной окружности по ∠C и стороне AB
  sinR(p) {
    const Cd = +p.C, k = +p.k;
    const ab = Cd === 30 ? k : Cd === 45 ? k * Math.SQRT2 : k * Math.sqrt(3); // как в тексте
    const A = V(0, 0), B = V(ab, 0);
    // C — на луче из A под произвольным допустимым углом; расстояние подбираем,
    // пока измеренный ∠ACB не станет равным данному (он монотонно убывает)
    const u = dir(0.4 * (180 - Cd));
    const t = bisect((s) => angleAt(add(A, mul(u, s)), A, B) - Cd, 1e-9 * ab, 1e7 * ab);
    if (t === null) return NaN;
    const C = add(A, mul(u, t));
    const Oc = circumcenter(A, B, C);
    return Oc ? dist(Oc, A) : NaN;
  },

  // Квадрат ABCD, O — середина CD, окружность через A радиуса 5m; ищем площадь
  sqMidO(p) {
    const R = 5 * +p.m;
    // единичный квадрат, затем подобие с коэффициентом R/OA
    const A = V(0, 1), B = V(1, 1), C = V(1, 0), D = V(0, 0);
    const s = R / dist(mid(C, D), A);
    return area([A, B, C, D].map((X) => mul(X, s)));
  },

  // Прямоугольник: sin угла между стороной и диагональю, диаметр описанной; площадь
  rectDiag(p) {
    const s = p.sin6 ? 0.6 : 0.8, R = +p.D / 2;
    const A = V(-R, 0), C = V(R, 0);                    // диагональ AC — диаметр
    const B = rayHit(A, dir(deg(Math.asin(s))), O, R);  // сторона AB под углом α к AC
    if (!B) return NaN;
    return area([A, B, C, neg(B)]);                     // D = −B: диагонали делятся пополам
  },

  /* ---------- Вписанная окружность ---------- */

  // Прямоугольный треугольник: гипотенуза c, острый угол 45°; площадь
  rtHyp45(p) {
    const c = +p.c;
    const A = V(0, 0), B = V(c, 0);
    // вершина прямого угла — на окружности с диаметром AB (Фалес), луч из A под 45°
    const C = rayHit(A, dir(45), mid(A, B), c / 2);
    return C ? area([A, B, C]) : NaN;
  },

  // Площадь квадрата, описанного около окружности радиуса r
  sqCircum(p) {
    return area(tangentPolygon(+p.r, [17, 107, 197, 287]));
  },

  // Высота описанной трапеции по радиусу r
  trapH(p) {
    const r = +p.r;
    // основания — параллельные касательные (в точках −90° и 90°), боковые стороны —
    // касательные в точках слева и справа (симметрично для равнобедренной)
    const [phL, phR] = p.iso ? [203, -23] : [212, 31];
    const L = legOn(r, phL), R = legOn(r, phR);   // L: A (низ), B (верх); R: D (низ), C (верх)
    return L && R ? distToLine(L.high, L.low, R.low) : NaN;
  },

  // Треугольник: периметр P, сторона side, радиус вписанной r; площадь
  Spr(p) {
    const T = sprTriangle(+p.P, +p.r, +p.side);
    return T ? area([T.A, T.B, T.C]) : NaN;
  },

  // Диагональ квадрата по радиусу вписанной r = k√2
  sqInD(p) {
    const Q = tangentPolygon(+p.k * Math.SQRT2, [9, 99, 189, 279]);
    return dist(Q[0], Q[2]);
  },

  // Радиус вписанной в квадрат со стороной a
  sqInR(p) {
    const a = +p.a;
    // квадрат, повёрнутый на 17°; центр — пересечение биссектрис углов A и B
    const e = dir(17), n = dir(107);
    const A = V(0, 0), B = mul(e, a), C = add(B, mul(n, a)), D = mul(n, a);
    const I = lineX(A, bisectorDir(A, B, D), B, bisectorDir(B, A, C));
    return I ? distToLine(I, A, B) : NaN;
  },

  // Радиус вписанной в равносторонний треугольник со стороной 2k√3
  eqA2r(p) {
    const a = 2 * +p.k * Math.sqrt(3);
    const A = V(0, 0), B = V(a, 0);
    const C = circlesX(A, a, B, a)[0];     // построение циркулем: CA = CB = AB
    if (!C) return NaN;
    const I = lineX(A, bisectorDir(A, B, C), B, bisectorDir(B, A, C));
    return I ? distToLine(I, A, B) : NaN;
  },

  // Высота равностороннего треугольника по радиусу вписанной r
  eqR2h(p) {
    // стороны — касательные в точках через 120°; T[1] — вершина против стороны,
    // касающейся окружности в точке −90°
    const T = tangentPolygon(+p.r, [-90, 30, 150]);
    return distToLine(T[1], T[2], T[0]);
  },

  // Сторона равностороннего треугольника по радиусу вписанной r = k√3
  eqR2aIn(p) {
    const T = tangentPolygon(+p.k * Math.sqrt(3), [-90, 30, 150]);
    return dist(T[0], T[1]);
  },

  // Описанный четырёхугольник: AB, BC, CD даны, ищем AD
  tanQuad(p) {
    const t = Array.isArray(p.t) ? p.t.map(Number) : [];
    if (t.length < 4) return NaN;
    const Q = tanQuadFind(t[0] + t[1], t[1] + t[2], t[2] + t[3]); // стороны — как в тексте
    return Q ? dist(Q.A, Q.D) : NaN;
  },

  // Описанная трапеция с основаниями AD и BC: AB, BC, CD даны, ищем AD
  tanTrap(p) {
    const T = tanTrapFind(+p.ab, +p.bc, +p.cd);
    return T ? dist(T.A, T.D) : NaN;
  },

  // Ромб: диагональ AC и tg∠BCA; радиус вписанной окружности
  rhombR(p) {
    const f = p.fam === '34' ? [3, 4, 5] : [7, 24, 25]; // как в тексте условия
    const d = 2 * f[1] * +p.k, tg = f[0] / f[1];
    const A = V(-d / 2, 0), C = V(d / 2, 0);
    // B — на серединном перпендикуляре к AC (BA = BC) и на луче из C под углом ∠BCA
    const B = lineX(C, rot(V(-1, 0), -deg(Math.atan(tg))), mid(A, C), V(0, 1));
    if (!B) return NaN;
    const D = sub(add(A, C), B);           // ромб — параллелограмм
    // центр вписанной окружности — пересечение биссектрис углов B и C
    const I = lineX(B, bisectorDir(B, A, C), C, bisectorDir(C, B, D));
    return I ? distToLine(I, B, C) : NaN;
  },

  /* ---------- Касательные, хорды, секущие ---------- */

  // Окружность с центром A через C, касательная из B
  tanExt(p) {
    const ac = +p.ac, cb = +p.cb;
    const A = V(0, 0), C = V(ac, 0), B = V(ac + cb, 0); // C на отрезке AB
    const T = tangentPts(B, A, dist(A, C))[0];
    return T ? dist(B, T) : NaN;
  },

  // Касательные в A и B пересекаются под углом u; ищем ∠ABO
  twoTan(p) {
    const u = +p.u;
    // точка C на оси x на расстоянии d от центра единичной окружности; касательные —
    // построением Фалеса; d подбираем, пока измеренный ∠ACB не станет равным u
    // (∠ACB — угол, в котором лежит окружность, так он отмечен на чертеже тренажёра)
    const f = (d) => { const [A, B] = tangentPts(V(d, 0), O, 1); return angleAt(V(d, 0), A, B) - u; };
    const d = bisect(f, 1 + 1e-12, 1e7);
    if (d === null) return NaN;
    const [A, B] = tangentPts(V(d, 0), O, 1);
    return angleAt(B, A, O);
  },

  // Хорда по радиусу R и расстоянию d от центра
  chordDist(p) {
    const R = +p.R, d = +p.d;
    const n = dir(64), P0 = mul(n, d), e = rot(n, 90); // прямая на расстоянии d от O
    const ts = lineCircleT(P0, e, O, R);
    return ts.length === 2 ? dist(add(P0, mul(e, ts[0])), add(P0, mul(e, ts[1]))) : NaN;
  },

  // Касательная AK и секущая ABC из точки A
  secTan(p) {
    const ab = +p.ab, ac = +p.ac;
    const A = V(0, 0), B = V(ab, 0);
    // окружность через B и C: центр на серединном перпендикуляре к BC, высота произвольна
    const Oc = V((ab + ac) / 2, 0.73 * (ac - ab) + 0.5);
    const K = tangentPts(A, Oc, dist(Oc, B))[0];
    return K ? dist(A, K) : NaN;
  },

  // Хорды AC и BD пересекаются в P: BP, CP, DP даны, ищем AP
  chordsX(p) {
    const bp = +p.bp, cp = +p.cp, dp = +p.dp;
    const P = V(0, 0), u1 = dir(18), u2 = dir(95);
    const B = mul(u1, bp), D = mul(u1, -dp), C = mul(u2, cp);
    const Oc = circumcenter(B, C, D);                    // окружность через B, C, D
    if (!Oc) return NaN;
    const A = rayHit(C, sub(P, C), Oc, dist(Oc, B));     // вторая точка прямой CP
    return A ? dist(A, P) : NaN;
  },

  // Угол между касательной BC и хордой AB, меньшая дуга AB = arc
  tanChord(p) {
    const arc = +p.arc;
    const B = pt(-90), A = pt(-90 + arc);
    let t = rot(B, 90);                                   // касательная в B ⟂ OB
    if (dot(t, sub(A, B)) < 0) t = neg(t);                // та сторона, где ∠ABC острый
    return angleAt(B, A, add(B, mul(t, 1.7)));
  },
};

/* ================= Геометрическая допустимость условия ================= */

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const allPos = (...xs) => xs.every((x) => isNum(x) && x > 0);
const inOpen = (x, a, b) => isNum(x) && x > a && x < b;

function domain(k, p) {
  switch (k) {
    case 'insCen':
      if (!isNum(p.c)) return 'угол не задан числом';
      if (p.rev) return inOpen(p.c / 2, 0, 180) ? '' : 'угол C треугольника должен быть между 0° и 180°';
      return p.c > 0 && p.c <= 180 ? '' : 'центральный угол AOB должен быть в промежутке (0°; 180°]';
    case 'twoDiam':
      return inOpen(p.x, 0, 90) ? '' : 'угол при основании равнобедренного треугольника AOB должен быть острым';
    case 'diamMON':
      return inOpen(p.x, 0, 90) ? '' : 'угол между хордой NM и диаметром NP должен быть острым';
    case 'diamsPair':
      if (p.given === 'O') return inOpen(p.x, 0, 180) ? '' : 'центральный угол AOD должен быть между 0° и 180°';
      return inOpen(p.x, 0, 90) ? '' : 'вписанный угол ACB при конце диаметра должен быть острым';
    case 'mnDiam':
      return inOpen(p.x, 0, 90) ? '' : 'угол NBA при конце диаметра должен быть острым';
    case 'diamTri':
      return inOpen(p.a, 0, 90) ? '' : 'острый угол прямоугольного треугольника должен быть между 0° и 90°';
    case 'diamPif':
      if (!allPos(p.R, p.bc)) return 'радиус и катет должны быть положительными';
      return p.bc < 2 * p.R ? '' : 'катет BC не короче диаметра AB — такого треугольника нет';
    case 'cyclQuad':
      return inOpen(p.a, 0, 180) ? '' : 'угол четырёхугольника должен быть между 0° и 180°';
    case 'cyclTrap':
      if (!inOpen(p.a, 0, 180)) return 'угол трапеции должен быть между 0° и 180°';
      return p.a === 90 ? 'при ∠A = 90° вписанная «трапеция» — прямоугольник' : '';
    case 'eqR2a': case 'eqDist2a': case 'sqR2a': case 'eqA2r': case 'eqR2aIn': case 'sqInD':
      return allPos(p.k) ? '' : 'множитель k должен быть положительным';
    case 'sinR':
      if (!allPos(p.k)) return 'сторона AB должна быть положительной';
      return inOpen(p.C, 0, 180) ? '' : 'угол C треугольника должен быть между 0° и 180°';
    case 'sqMidO':
      return allPos(p.m) ? '' : 'радиус должен быть положительным';
    case 'rectDiag':
      return allPos(p.D) ? '' : 'диаметр должен быть положительным';
    case 'rtHyp45':
      return allPos(p.c) ? '' : 'гипотенуза должна быть положительной';
    case 'sqCircum': case 'trapH': case 'eqR2h':
      return allPos(p.r) ? '' : 'радиус должен быть положительным';
    case 'sqInR':
      return allPos(p.a) ? '' : 'сторона должна быть положительной';
    case 'Spr':
      if (!allPos(p.P, p.r, p.side)) return 'периметр, сторона и радиус должны быть положительными';
      if (p.side >= p.P / 2) return 'сторона не меньше полупериметра — нарушено неравенство треугольника';
      return p.side > 2 * p.r ? '' : 'сторона не длиннее диаметра вписанной окружности — так не бывает';
    case 'tanQuad': {
      if (!Array.isArray(p.t) || p.t.length < 4 || !p.t.slice(0, 4).every(isNum)) return 'нужны четыре числа t';
      const t = p.t, AB = t[0] + t[1], BC = t[1] + t[2], CD = t[2] + t[3];
      if (!allPos(AB, BC, CD)) return 'стороны AB, BC, CD должны быть положительными';
      return AB + CD > BC ? '' : 'AB + CD ≤ BC — описанного четырёхугольника с такими сторонами нет';
    }
    case 'tanTrap':
      return allPos(p.ab, p.bc, p.cd) ? '' : 'стороны должны быть положительными';
    case 'rhombR':
      if (p.fam !== '34' && p.fam !== '724') return 'семейство fam должно быть «34» или «724»';
      return allPos(p.k) ? '' : 'множитель k должен быть положительным';
    case 'tanExt':
      if (!allPos(p.ac)) return 'радиус AC должен быть положительным';
      return allPos(p.cb) ? '' : 'точка B не вне окружности — касательной из неё нет';
    case 'twoTan':
      return inOpen(p.u, 0, 180) ? '' : 'угол между касательными должен быть между 0° и 180°';
    case 'chordDist':
      if (!allPos(p.R) || !isNum(p.d) || p.d < 0) return 'радиус и расстояние должны быть неотрицательными числами';
      return p.d < p.R ? '' : 'расстояние до хорды не меньше радиуса — хорды нет';
    case 'secTan':
      if (!allPos(p.ab, p.ac)) return 'отрезки секущей должны быть положительными';
      return p.ab < p.ac ? '' : 'нужно AB < AC: B лежит между A и C';
    case 'chordsX':
      return allPos(p.bp, p.cp, p.dp) ? '' : 'отрезки хорд должны быть положительными';
    case 'tanChord':
      return inOpen(p.arc, 0, 180) ? '' : 'меньшая дуга должна быть между 0° и 180°';
    default:
      return 'неизвестный подтип';
  }
}

/* причина, когда числа в своих диапазонах, но фигура всё равно не строится */
const NO_FIGURE = {
  Spr: (p) => {
    const iso = sprBuild(p.side, p.r, p.side / 2); // равнобедренный — самый короткий периметр
    return 'треугольника с такими периметром, стороной и радиусом нет' +
      (iso ? ` (наименьший возможный периметр ${+iso.per.toFixed(3)})` : '');
  },
  tanTrap: () => 'трапеции с такими сторонами, описанной около окружности, нет',
  tanQuad: () => 'описанный четырёхугольник с такими сторонами построить не удалось',
};

export function validity(k, p) {
  if (!p || typeof p !== 'object') return 'нет параметров задачи';
  if (!Object.prototype.hasOwnProperty.call(solve, k)) return 'неизвестный подтип';
  const why = domain(k, p);
  if (why) return why;
  // числа в допустимых диапазонах — фигура обязана построиться
  const v = solve[k](p);
  if (!Number.isFinite(v)) return NO_FIGURE[k] ? NO_FIGURE[k](p) : 'по этим числам фигуру построить не удалось';
  // описанный четырёхугольник с AD ∥ BC и AD = BC — параллелограмм, то есть ромб
  if (k === 'tanTrap' && close9(v, p.bc)) return 'AD = BC — получается ромб, а не трапеция';
  return '';
}
