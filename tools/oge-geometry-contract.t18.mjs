/*
  ОГЭ, задание 18 · «Фигуры на клетчатой бумаге» — независимый решатель
  для внешнего гейта (trainers/oge-task18-grid.html: 15 подтипов SUBS + ARCHIVE).

  Канон требует пересчитать каждый ответ ДРУГИМ кодом, а не тем выражением,
  из которого ответ получен в тренажёре. Поэтому здесь нет ни одной формулы
  из calc() тренажёра (a/2, (a+b)/2, a·h/2, 2·p·q, R²/r² …). Решатель
  действует как ученик с линейкой:
    1) по параметрам p ставит точки ровно туда, куда их ставит fig()
       тренажёра: клетка 1×1, начало в левом нижнем углу сетки, ось y вверх,
       сетка W×H клеток (как в построителе CF);
    2) ИЗМЕРЯЕТ ответ в координатах: длины — Math.hypot, площади — формулой
       трапеций (вариант формулы шнурования), тангенс — через векторное
       и скалярное произведения лучей, отношения — из измеренных длин.
  Какие стороны параллельны, где прямой угол, какой круг больше — тоже
  определяется по координатам, а не берётся из смысла параметров.

  Экспорт (голый Node, без зависимостей и без загрузки тренажёра):
    solve[k](p)    → число-ответ; NaN, если p повреждены или ответ не определён
                     (например, «трапеция» оказалась параллелограммом);
    points(k, p)   → { имя: [x, y] } — точки основного (не вспомогательного)
                     чертежа; имена — как в f.node() тренажёра, где они есть;
                     null, если p повреждены;
    frame(k, p)    → { W, H } — сетка в клетках: viewBox = (38+30W)×(38+30H);
    validity(k, p) → '' или причина по-русски (несколько — через «; »).

  Точки, которые по замыслу НЕ обязаны стоять в узлах: только концы
  отрезка AB в segAB (они на сторонах треугольника, на линии сетки).
*/

const EPS = 1e-9;

/* ---------- плоская геометрия ---------- */
const vec = (P, Q) => [Q[0] - P[0], Q[1] - P[1]];
const span = (P, Q) => Math.hypot(Q[0] - P[0], Q[1] - P[1]);          // длина отрезка PQ
const midpoint = (P, Q) => [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2];
const cross = (u, v) => u[0] * v[1] - u[1] * v[0];                     // векторное произведение (z)
const dot = (u, v) => u[0] * v[0] + u[1] * v[1];
const same = (P, Q) => Math.abs(P[0] - Q[0]) < EPS && Math.abs(P[1] - Q[1]) < EPS;
const isNode = P => Number.isInteger(P[0]) && Number.isInteger(P[1]);
const finitePt = P => Array.isArray(P) && Number.isFinite(P[0]) && Number.isFinite(P[1]);
const parallel = (P1, P2, P3, P4) => Math.abs(cross(vec(P1, P2), vec(P3, P4))) < EPS;

/* Площадь многоугольника формулой трапеций: каждое ребро (x₁,y₁)→(x₂,y₂)
   «заметает» до оси x трапецию площадью (x₂−x₁)·(y₁+y₂)/2 со знаком обхода. */
function polyArea(V) {
  let s = 0;
  for (let i = 0; i < V.length; i++) {
    const P = V[i], Q = V[(i + 1) % V.length];
    s += (Q[0] - P[0]) * (P[1] + Q[1]);
  }
  return Math.abs(s) / 2;
}

/* Точка пересечения прямых P1P2 и P3P4; null, если прямые параллельны. */
function meet(P1, P2, P3, P4) {
  const d = vec(P1, P2), e = vec(P3, P4), den = cross(d, e);
  if (Math.abs(den) < EPS) return null;
  const t = cross(vec(P1, P3), e) / den;
  return [P1[0] + d[0] * t, P1[1] + d[1] * t];
}

/* X лежит на отрезке PQ строго между концами. */
function strictlyInside(X, P, Q) {
  const d = vec(P, Q), w = vec(P, X), L2 = dot(d, d);
  if (L2 < EPS || Math.abs(cross(d, w)) > EPS * Math.sqrt(L2)) return false;
  const t = dot(d, w) / L2;
  return t > EPS && t < 1 - EPS;
}

/* Выпуклый многоугольник: все повороты одного знака, ни одного нулевого.
   Для четырёхугольника это заодно исключает самопересечение («бантик»). */
function convex(V) {
  let sgn = 0;
  for (let i = 0; i < V.length; i++) {
    const z = cross(vec(V[i], V[(i + 1) % V.length]), vec(V[(i + 1) % V.length], V[(i + 2) % V.length]));
    if (Math.abs(z) < EPS) return false;
    if (!sgn) sgn = Math.sign(z);
    else if (Math.sign(z) !== sgn) return false;
  }
  return true;
}

/* Отрезки PQ и RS имеют общую точку (включая касание концом). */
function touch(P, Q, R, S) {
  const turn = (A, B, C) => { const z = cross(vec(A, B), vec(A, C)); return Math.abs(z) < EPS ? 0 : Math.sign(z); };
  const box = (A, B, C) => Math.min(A[0], B[0]) - EPS <= C[0] && C[0] <= Math.max(A[0], B[0]) + EPS &&
    Math.min(A[1], B[1]) - EPS <= C[1] && C[1] <= Math.max(A[1], B[1]) + EPS;
  const o1 = turn(P, Q, R), o2 = turn(P, Q, S), o3 = turn(R, S, P), o4 = turn(R, S, Q);
  if (o1 !== o2 && o3 !== o4) return true;
  return (o1 === 0 && box(P, Q, R)) || (o2 === 0 && box(P, Q, S)) || (o3 === 0 && box(R, S, P)) || (o4 === 0 && box(R, S, Q));
}

/* Простой контур: несоседние рёбра не имеют общих точек. */
function simplePolygon(V) {
  const n = V.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;              // рёбра соседние через замыкание
      if (touch(V[i], V[(i + 1) % n], V[j], V[(j + 1) % n])) return false;
    }
  }
  return true;
}

/* Настоящий счёт клеток: сколько клеток 1×1 имеют центр внутри контура
   (луч вправо, чётность пересечений). Нужен только для перекрёстной
   проверки площади в validity, ответ считается формулой трапеций. */
function cellsInside(V) {
  const xs = V.map(P => P[0]), ys = V.map(P => P[1]);
  let n = 0;
  for (let x = Math.floor(Math.min(...xs)); x < Math.max(...xs); x++) {
    for (let y = Math.floor(Math.min(...ys)); y < Math.max(...ys); y++) {
      const cx = x + 0.5, cy = y + 0.5;
      let inside = false;
      for (let i = 0, j = V.length - 1; i < V.length; j = i++) {
        const A = V[i], B = V[j];
        if ((A[1] > cy) !== (B[1] > cy) && cx < A[0] + (cy - A[1]) * (B[0] - A[0]) / (B[1] - A[1])) inside = !inside;
      }
      if (inside) n++;
    }
  }
  return n;
}

/* Разложение n = a² + b² так, как его ищет fig() кругов: a — от ⌊√n⌋ вниз,
   первое подходящее. Конец радиуса fig ставит в центр + (b, a). */
function twoSquares(n) {
  for (let a = Math.floor(Math.sqrt(n)); a >= 0; a--) {
    const rest = n - a * a, b = Math.round(Math.sqrt(rest));
    if (b * b === rest) return [a, b];
  }
  return null;
}

/* ---------- модели чертежей: точки и сетка ровно как в fig() ---------- */
function rhombus(p) {                                   // rhombFig: центр (hp+1, hq+1)
  const [hp, hq] = p, c = [hp + 1, hq + 1];
  return { W: 2 * hp + 2, H: 2 * hq + 2,
    pts: { V0: [c[0] - hp, c[1]], V1: [c[0], c[1] + hq], V2: [c[0] + hp, c[1]], V3: [c[0], c[1] - hq] } };
}
function trapezoid(p) {                                 // midTrap и areaTrap рисуют одинаково
  const [a, b, h, s] = p;
  return { W: a + 2, H: h + 2, pts: { A: [1, 1], B: [1 + s, 1 + h], C: [1 + s + b, 1 + h], D: [1 + a, 1] } };
}

const MODEL = {
  dist(p) {                                             // две точки, o — наклон вниз
    const [dx, dy, o] = p;
    return { W: dx + 2, H: dy + 2, pts: { A: [1, o ? dy + 1 : 1], B: [1 + dx, o ? 1 : dy + 1] } };
  },
  midBC(p) {                                            // p = [bx,by,cx,cy,ax,ay], сетка не меньше 4×4
    const [bx, by, cx, cy, ax, ay] = p;
    return { W: Math.max(Math.max(bx, cx, ax) + 1, 4), H: Math.max(Math.max(by, cy, ay) + 1, 4),
      pts: { B: [bx, by], C: [cx, cy], A: [ax, ay] } };
  },
  leg(p) {                                              // o<2: длинный катет горизонтален; o нечётно — зеркало
    const [m, a, o] = p;
    const gx = o < 2 ? a : m, gy = o < 2 ? m : a, mirror = o % 2;
    const W = gx + 2, H = gy + 2, R = [mirror ? W - 1 : 1, 1];
    return { W, H, pts: { R, P1: [R[0] + (mirror ? -gx : gx), 1], P2: [R[0], 1 + gy] } };
  },
  rhombDiag: rhombus,
  areaRhomb: rhombus,
  midTri(p) {
    const [a, bx, h] = p;
    return { W: a + 2, H: h + 2, pts: { A: [1, 1], B: [1 + bx, 1 + h], C: [1 + a, 1] } };
  },
  midTrap: trapezoid,
  areaTri(p) {
    const [b, h, bx] = p;
    return { W: b + 2, H: h + 2, pts: { A: [1, 1], B: [1 + bx, 1 + h], C: [1 + b, 1] } };
  },
  areaPar(p) {
    const [a, h, s] = p;
    return { W: a + s + 2, H: h + 2, pts: { A: [1, 1], B: [1 + a, 1], C: [1 + a + s, 1 + h], D: [1 + s, 1 + h] } };
  },
  areaTrap: trapezoid,
  areaFig(p) {                                          // контур по вершинам p.pts
    const v = p.pts, pts = {};
    v.forEach((q, i) => { pts['p' + i] = [q[0], q[1]]; });
    return { W: Math.max(...v.map(q => q[0])) + 1, H: Math.max(...v.map(q => q[1])) + 1, pts };
  },
  tanA(p) {                                             // A — конец горизонтального луча у края сетки
    const [q, pp] = p, W = Math.max(pp + 2, 6);
    return { W, H: q + 2, pts: { O: [1, 1], A: [W - 1, 1], B: [1 + pp, 1 + q] } };
  },
  segAB(p) {                                            // треугольник C-P-D, AB на высоте h над CD
    const [d, H0, h, px] = p;
    const C = [1, 1], D = [1 + d, 1], P = [1 + px, 1 + H0];
    const A = [C[0] + (P[0] - C[0]) * h / H0, 1 + h], B = [D[0] + (P[0] - D[0]) * h / H0, 1 + h];
    return { W: d + 2, H: H0 + 2, pts: { C, D, P, A, B }, free: ['A', 'B'] };
  },
  segCmp(p) {                                           // M на AC, вершина B — по округлению 0,4·AC
    const [am, mc] = p, ac = am + mc, h = Math.min(5, Math.max(3, Math.round(ac / 2)));
    return { W: ac + 2, H: h + 2,
      pts: { A: [1, 1], B: [1 + Math.round(ac * 0.4), 1 + h], C: [1 + ac, 1], M: [1 + am, 1] } };
  },
  circRatio(p) {                                        // p = [r², R²]; круги рисуются радиусами √r², √R²
    const [rsq, Rsq] = p;
    const r = Math.sqrt(rsq), R = Math.sqrt(Rsq), cw = Math.ceil(r), CW = Math.ceil(R);
    const c1 = [1 + cw, 1 + CW], c2 = [2 * cw + 2 + CW, 1 + CW];
    const e1 = twoSquares(rsq), e2 = twoSquares(Rsq), pts = { c1, c2 };
    if (e1) pts.re = [c1[0] + e1[1], c1[1] + e1[0]];
    if (e2) pts.Re = [c2[0] + e2[1], c2[1] + e2[0]];
    return { W: 2 * cw + 2 * CW + 3, H: 2 * CW + 2, pts,
      circles: [{ c: c1, r, n: rsq, end: 're' }, { c: c2, r: R, n: Rsq, end: 'Re' }] };
  },
};

/* Сколько чисел в p читает fig() каждого подтипа. */
const ARITY = { dist: 3, midBC: 6, leg: 3, rhombDiag: 2, areaRhomb: 2, midTri: 3, midTrap: 4, areaTri: 3,
  areaPar: 3, areaTrap: 4, tanA: 2, segAB: 4, segCmp: 2, circRatio: 2 };

function wellFormed(k, p) {
  if (k === 'areaFig') {
    return !!p && Array.isArray(p.pts) && p.pts.length >= 3 &&
      p.pts.every(q => Array.isArray(q) && Number.isFinite(q[0]) && Number.isFinite(q[1]));
  }
  return Array.isArray(p) && p.length >= ARITY[k] && p.slice(0, ARITY[k]).every(x => Number.isFinite(x));
}

function model(k, p) {
  if (!MODEL[k] || !wellFormed(k, p)) return null;
  return MODEL[k](p);
}

/* ---------- измерения ---------- */

/* Средняя линия трапеции: по координатам находим пару параллельных сторон
   (основания) и соединяем середины двух других (боковых). Параллелограмм
   или четырёхугольник без параллельных сторон — ответа нет. */
function trapMidline(A, B, C, D) {
  const abdc = parallel(A, B, D, C), bcad = parallel(B, C, A, D);
  if (bcad && !abdc) return span(midpoint(A, B), midpoint(D, C));
  if (abdc && !bcad) return span(midpoint(B, C), midpoint(A, D));
  return NaN;
}

/* Больший катет: прямой угол ищем скалярным произведением сторон
   в каждой вершине, катеты — стороны при нём. */
function biggerLeg(T) {
  for (let i = 0; i < 3; i++) {
    const V = T[i], U = T[(i + 1) % 3], X = T[(i + 2) % 3];
    if (span(V, U) > EPS && span(V, X) > EPS && Math.abs(dot(vec(V, U), vec(V, X))) < EPS) {
      return Math.max(span(V, U), span(V, X));
    }
  }
  return NaN;
}

function measure(k, p, fn) {
  const f = model(k, p);
  if (!f || !Object.values(f.pts).every(finitePt)) return NaN;
  const v = fn(f.pts, f);
  return typeof v === 'number' ? v : NaN;
}

export const solve = {
  /* расстояние между точками A и B */
  dist: p => measure('dist', p, ({ A, B }) => span(A, B)),
  /* от A до середины BC: середину строим, расстояние меряем */
  midBC: p => measure('midBC', p, ({ A, B, C }) => span(A, midpoint(B, C))),
  /* больший катет: сторона при прямом угле, найденном по координатам */
  leg: p => measure('leg', p, ({ R, P1, P2 }) => biggerLeg([R, P1, P2])),
  /* большая из двух измеренных диагоналей V0V2 и V1V3 */
  rhombDiag: p => measure('rhombDiag', p, ({ V0, V1, V2, V3 }) => Math.max(span(V0, V2), span(V1, V3))),
  /* средняя линия ∥ AC: отрезок между серединами AB и BC */
  midTri: p => measure('midTri', p, ({ A, B, C }) => span(midpoint(A, B), midpoint(C, B))),
  /* средняя линия трапеции: между серединами боковых сторон */
  midTrap: p => measure('midTrap', p, ({ A, B, C, D }) => trapMidline(A, B, C, D)),
  /* площади — формулой трапеций по вершинам в порядке обхода чертежа */
  areaTri: p => measure('areaTri', p, ({ A, B, C }) => polyArea([A, B, C])),
  areaPar: p => measure('areaPar', p, ({ A, B, C, D }) => polyArea([A, B, C, D])),
  areaRhomb: p => measure('areaRhomb', p, ({ V0, V1, V2, V3 }) => polyArea([V0, V1, V2, V3])),
  areaTrap: p => measure('areaTrap', p, ({ A, B, C, D }) => polyArea([A, B, C, D])),
  areaFig: p => measure('areaFig', p, pts => polyArea(Object.values(pts))),
  /* tg∠AOB = |OA × OB| / (OA · OB) — синус к косинусу через векторы лучей */
  tanA: p => measure('tanA', p, ({ O, A, B }) => {
    const u = vec(O, A), v = vec(O, B), c = dot(u, v);
    return Math.abs(c) < EPS ? NaN : Math.abs(cross(u, v)) / c;
  }),
  /* AB — хорда треугольника по линии, на которой лежит отмеченный отрезок:
     пересекаем эту линию со сторонами CP и DP и меряем расстояние */
  segAB: p => measure('segAB', p, ({ C, D, P, A, B }) => {
    const X = meet(C, P, A, B), Y = meet(D, P, A, B);
    return X && Y ? span(X, Y) : NaN;
  }),
  /* во сколько раз MC длиннее AM — отношение измеренных длин */
  segCmp: p => measure('segCmp', p, ({ A, C, M }) => {
    const am = span(A, M);
    return am > EPS ? span(M, C) / am : NaN;
  }),
  /* радиусы меряем по нарисованным отрезкам «центр — узел на окружности»;
     больший круг определяем сравнением, отношение площадей = (R/r)² */
  circRatio: p => measure('circRatio', p, ({ c1, re, c2, Re }) => {
    if (!re || !Re) return NaN;
    const r1 = span(c1, re), r2 = span(c2, Re), big = Math.max(r1, r2), small = Math.min(r1, r2);
    return small > EPS ? (big / small) ** 2 : NaN;
  }),
};

export function points(k, p) {
  const f = model(k, p);
  if (!f) return null;
  const out = {};
  for (const [n, P] of Object.entries(f.pts)) out[n] = [P[0], P[1]];
  return out;
}

export function frame(k, p) {
  const f = model(k, p);
  return f ? { W: f.W, H: f.H } : null;
}

/* ---------- корректность задачи ---------- */

const show = x => String(Math.round(x * 1e4) / 1e4).replace('.', ',');

/* Ответ ОГЭ — целое или конечная десятичная дробь. Восстанавливаем дробь
   с наименьшим знаменателем (≤ 1000) и смотрим, есть ли в нём простые кроме 2 и 5. */
function answerForm(x) {
  for (let d = 1; d <= 1000; d++) {
    const n = Math.round(x * d);
    if (Math.abs(x * d - n) < 1e-7) {
      let r = d;
      while (r % 2 === 0) r /= 2;
      while (r % 5 === 0) r /= 5;
      return r === 1 ? '' : 'ответ ' + n + '/' + d + ' — бесконечная десятичная дробь: в бланк ОГЭ не записать';
    }
  }
  return 'ответ ≈ ' + show(x) + ' не выражается конечной десятичной дробью';
}

function triangleOk(T, why) {
  if (polyArea(T) < EPS) why.push('треугольник вырожден');
}

function rhombOk({ pts: { V0, V1, V2, V3 } }, why, square) {
  const Q = [V0, V1, V2, V3];
  if (polyArea(Q) < EPS || !convex(Q)) { why.push('четырёхугольник вырожден или не выпуклый'); return; }
  const L = Q.map((P, i) => span(P, Q[(i + 1) % 4]));
  if (Math.max(...L) - Math.min(...L) > EPS) { why.push('стороны не равны — это не ромб'); return; }
  if (Math.abs(span(V0, V2) - span(V1, V3)) < EPS) why.push('диагонали равны — ' + square);
}

function trapOk({ pts: { A, B, C, D } }, why) {
  const Q = [A, B, C, D];
  if (polyArea(Q) < EPS || !convex(Q)) { why.push('четырёхугольник вырожден или не выпуклый'); return; }
  const pairs = (parallel(A, B, D, C) ? 1 : 0) + (parallel(B, C, A, D) ? 1 : 0);
  if (pairs === 0) why.push('нет параллельных сторон — это не трапеция');
  if (pairs === 2) why.push('обе пары сторон параллельны — это параллелограмм, а не трапеция');
}

const CHECK = {
  dist({ pts: { A, B } }, why) {
    if (same(A, B)) why.push('точки A и B совпадают');
  },
  midBC({ pts: { A, B, C } }, why) {
    if (same(B, C)) why.push('B и C совпадают — у отрезка BC нет середины');
    else if (same(A, midpoint(B, C))) why.push('A совпадает с серединой BC');
  },
  leg({ pts: { R, P1, P2 } }, why) {
    const T = [R, P1, P2];
    if (polyArea(T) < EPS) { why.push('треугольник вырожден'); return; }
    const right = [0, 1, 2].filter(i => Math.abs(dot(vec(T[i], T[(i + 1) % 3]), vec(T[i], T[(i + 2) % 3]))) < EPS);
    if (right.length !== 1) { why.push('в треугольнике нет прямого угла'); return; }
    const i = right[0];
    if (Math.abs(span(T[i], T[(i + 1) % 3]) - span(T[i], T[(i + 2) % 3])) < EPS) why.push('катеты равны — «больший катет» не определён');
  },
  rhombDiag: (f, why) => rhombOk(f, why, '«большая диагональ» не определена (квадрат)'),
  areaRhomb: (f, why) => rhombOk(f, why, 'на чертеже квадрат, а не ромб'),
  midTri: ({ pts: { A, B, C } }, why) => triangleOk([A, B, C], why),
  midTrap: trapOk,
  areaTri: ({ pts: { A, B, C } }, why) => triangleOk([A, B, C], why),
  areaPar({ pts: { A, B, C, D } }, why) {
    const Q = [A, B, C, D];
    if (polyArea(Q) < EPS || !convex(Q)) { why.push('четырёхугольник вырожден или не выпуклый'); return; }
    if (!parallel(A, B, D, C) || !parallel(B, C, A, D)) why.push('противоположные стороны не параллельны — это не параллелограмм');
  },
  areaTrap: trapOk,
  areaFig({ pts }, why) {
    const V = Object.values(pts), n = V.length;
    if (n < 4) { why.push('у фигуры по линиям сетки меньше четырёх вершин'); return; }
    for (let i = 0; i < n; i++) {
      const P = V[i], Q = V[(i + 1) % n], R = V[(i + 2) % n], e = vec(P, Q), g = vec(Q, R);
      const name = 'p' + i + '–p' + ((i + 1) % n);
      if (span(P, Q) < EPS) { why.push('сторона ' + name + ' нулевой длины'); return; }
      if (Math.abs(e[0]) > EPS && Math.abs(e[1]) > EPS) { why.push('сторона ' + name + ' не по линии сетки'); return; }
      if (Math.abs(cross(e, g)) < EPS && dot(e, g) < 0) { why.push('контур возвращается по себе в вершине p' + ((i + 1) % n)); return; }
    }
    if (!simplePolygon(V)) { why.push('контур самопересекается'); return; }
    const cells = cellsInside(V), S = polyArea(V);
    if (Math.abs(cells - S) > EPS) why.push('клеток внутри ' + cells + ', а площадь контура ' + show(S));
  },
  tanA({ pts: { O, A, B } }, why) {
    const u = vec(O, A), v = vec(O, B);
    if (span(O, A) < EPS || span(O, B) < EPS) { why.push('луч угла вырожден'); return; }
    if (Math.abs(cross(u, v)) < EPS) { why.push('лучи OA и OB на одной прямой — угла нет'); return; }
    if (dot(u, v) < EPS) why.push('угол AOB не острый');
  },
  segAB({ pts: { C, D, P, A, B } }, why) {
    if (polyArea([C, P, D]) < EPS) { why.push('треугольник вырожден'); return; }
    if (!strictlyInside(A, C, P)) why.push('точка A не на стороне CP');
    if (!strictlyInside(B, D, P)) why.push('точка B не на стороне DP');
    if (same(A, B)) why.push('A и B совпадают');
    else if (!parallel(A, B, C, D)) why.push('AB не параллелен CD');
    if (!Number.isInteger(A[1]) || !Number.isInteger(B[1])) why.push('AB не на линии сетки — высоту не отсчитать по клеткам');
  },
  segCmp({ pts: { A, B, C, M } }, why) {
    if (polyArea([A, B, C]) < EPS) { why.push('треугольник вырожден'); return; }
    if (!strictlyInside(M, A, C)) { why.push('M не лежит внутри стороны AC'); return; }
    if (span(M, C) <= span(A, M) + EPS) why.push('MC не длиннее AM — вопрос «во сколько раз длиннее» некорректен');
  },
  circRatio(f, why) {
    for (const k of f.circles) {
      const E = f.pts[k.end];
      if (!E) { why.push('r² = ' + k.n + ' не сумма двух квадратов — радиус не довести до узла'); continue; }
      if (k.r < EPS) { why.push('радиус круга нулевой'); continue; }
      if (Math.abs(span(k.c, E) - k.r) > EPS) why.push('конец радиуса ' + k.end + ' не на окружности');
      if (k.c[0] - k.r < -EPS || k.c[0] + k.r > f.W + EPS || k.c[1] - k.r < -EPS || k.c[1] + k.r > f.H + EPS) why.push('круг выходит за сетку');
    }
    if (why.length) return;
    const [k1, k2] = f.circles;
    if (span(k1.c, k2.c) < k1.r + k2.r - EPS) why.push('круги перекрываются');
    if (Math.abs(k1.r - k2.r) < EPS) why.push('круги равны — «больший круг» не определён');
  },
};

export function validity(k, p) {
  if (!MODEL[k]) return 'неизвестный подтип «' + k + '»';
  if (!wellFormed(k, p)) return 'параметры задачи повреждены';
  const f = MODEL[k](p), why = [];
  if (!(Number.isInteger(f.W) && Number.isInteger(f.H) && f.W > 0 && f.H > 0)) why.push('сетка ' + f.W + '×' + f.H + ' некорректна');
  let broken = false;
  for (const [n, P] of Object.entries(f.pts)) {
    if (!finitePt(P)) { why.push('точка ' + n + ' не вычисляется'); broken = true; continue; }
    if (!(f.free || []).includes(n) && !isNode(P)) why.push('точка ' + n + ' не в узле сетки');
    if (P[0] < -EPS || P[0] > f.W + EPS || P[1] < -EPS || P[1] > f.H + EPS) why.push('точка ' + n + ' за краем сетки');
  }
  if (!broken) CHECK[k](f, why);
  const ans = solve[k](p);
  if (!Number.isFinite(ans)) {
    if (!why.length) why.push('ответ не определяется по чертежу');
  } else {
    const form = answerForm(ans);
    if (form) why.push(form);
  }
  return why.join('; ');
}
