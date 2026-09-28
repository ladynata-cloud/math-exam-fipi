/*
  Задание 25 ОГЭ (trainers/oge-task25-geometry.html): независимый решатель
  для гейта OGE_COURSE_03A. Голый Node, без зависимостей. Тренажёр не
  импортируется, его выражения для ответов не повторяются.

  Как считается. По данным задачи фигура строится в координатах. Неизвестные
  длины и углы подбираются численно (перебор с шагом и деление отрезка
  пополам) прямо из условий задачи: «точка лежит на прямой», «касается»,
  «биссектриса», «угол равен». Ответ измеряется на построенной фигуре
  (расстояния, площадь по координатам вершин, центр описанной окружности).
  После построения условия задачи проверяются на фигуре ещё раз. Если ответ
  не должен зависеть от свободного параметра (угол параллелограмма, высота
  трапеции, форма треугольника, выбор одной из двух окружностей), фигура
  строится дважды и ответы сверяются.

  Экспорт:
    solve[id](p)     -> { метка: число } с метками build(p).ans тренажёра;
                        если конфигурации нет — те же метки со значением NaN;
    validity(id, p)  -> '' или короткая причина, почему конфигурации нет;
    askValues(id, p) -> { метка: число } для шагов-вопросов steps[].ask
                        (тот же расчёт по построенной фигуре; {} если её нет).
*/

const PI = Math.PI;
const TOL = 1e-7;

class Invalid extends Error {}
const fail = (why) => { throw new Invalid(why); };
const check = (ok, why) => { if (!ok) fail(why); };
const near = (a, b, tol = TOL) =>
  Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

/* ---------------- плоскость ---------------- */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const len = (a) => Math.hypot(a[0], a[1]);
const dist = (a, b) => len(sub(a, b));
const unit = (a) => mul(a, 1 / len(a));
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const perp = (a) => [-a[1], a[0]];
const polar = (r, t) => [r * Math.cos(t), r * Math.sin(t)];
const rad = (deg) => (deg * PI) / 180;

/* расстояние от точки P до прямой, проходящей через A и B */
const toLine = (P, A, B) => Math.abs(cross(sub(B, A), sub(P, A))) / dist(A, B);

/* угол при вершине V между лучами VP и VQ, радианы, от 0 до π */
const angle = (V, P, Q) => {
  const a = sub(P, V), b = sub(Q, V);
  return Math.atan2(Math.abs(cross(a, b)), dot(a, b));
};

/* точка пересечения прямых P1P2 и P3P4; null, если прямые параллельны */
function meet(P1, P2, P3, P4) {
  const r = sub(P2, P1), s = sub(P4, P3), den = cross(r, s);
  if (Math.abs(den) < 1e-14 * len(r) * len(s)) return null;
  return add(P1, mul(r, cross(sub(P3, P1), s) / den));
}

/* основание перпендикуляра из P на прямую AB и его параметр t (A — 0, B — 1) */
function foot(P, A, B) {
  const d = sub(B, A), t = dot(sub(P, A), d) / dot(d, d);
  return { X: add(A, mul(d, t)), t };
}

/* верхняя (y > 0) точка пересечения окружностей (c1, r1) и (c2, r2), центры на оси x */
function circlesUp(c1, r1, c2, r2) {
  // точка X на обеих окружностях: |X − c1| = r1, |X − c2| = r2; ищем по x, затем y
  const d = c2[0] - c1[0];
  if (Math.abs(d) < 1e-15) return null;
  const x = (r1 * r1 - r2 * r2 + d * d) / (2 * d), y2 = r1 * r1 - x * x;
  if (!(y2 > 1e-18 * r1 * r1)) return null;
  return [c1[0] + x, Math.sqrt(y2)];
}

/* центр описанной окружности: из |X − A|² = |X − B|² = |X − C|² (правило Крамера) */
function circumcenter(A, B, C) {
  const a1 = 2 * (B[0] - A[0]), b1 = 2 * (B[1] - A[1]), c1 = dot(B, B) - dot(A, A);
  const a2 = 2 * (C[0] - A[0]), b2 = 2 * (C[1] - A[1]), c2 = dot(C, C) - dot(A, A);
  const det = a1 * b2 - a2 * b1;
  return [(c1 * b2 - c2 * b1) / det, (a1 * c2 - a2 * c1) / det];
}

/* площадь многоугольника по координатам вершин (формула шнурования) */
function area(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) s += cross(pts[i], pts[(i + 1) % pts.length]);
  return Math.abs(s) / 2;
}

/* ---------------- численные методы ---------------- */
function bisect(f, a, b) {
  let fa = f(a);
  for (let i = 0; i < 400; i++) {
    const m = (a + b) / 2;
    if (m === a || m === b) break;
    const fm = f(m);
    if (fm === 0) return m;
    if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m;
  }
  return (a + b) / 2;
}

/* все корни f на [lo, hi]: перебор с n шагами и уточнение делением пополам */
function roots(f, lo, hi, n) {
  const out = [];
  let x0 = lo, f0 = f(lo);
  for (let i = 1; i <= n; i++) {
    const x1 = lo + ((hi - lo) * i) / n, f1 = f(x1);
    if (Number.isFinite(f0) && Number.isFinite(f1)) {
      if (f0 === 0) out.push(x0);
      else if (f1 !== 0 && (f0 < 0) !== (f1 < 0)) out.push(bisect(f, x0, x1));
    }
    x0 = x1; f0 = f1;
  }
  if (f0 === 0) out.push(x0);
  return out;
}

const uniq = (xs, eps = 1e-9) => xs.filter((x, i) => xs.findIndex((y) => Math.abs(x - y) <= eps * Math.max(1, Math.abs(y))) === i);

/* единственный корень; иначе — отказ с причиной why */
function root1(f, lo, hi, n, why, tol) {
  const r = uniq(roots(f, lo, hi, n)).filter((x) => Math.abs(f(x)) <= tol);
  check(r.length === 1, why);
  return r[0];
}

/* ---------------- параметры ---------------- */
function nums(p, n) {
  const a = n === 1 && !Array.isArray(p) ? [p] : p;
  check(Array.isArray(a) && a.length === n && a.every((x) => typeof x === 'number' && Number.isFinite(x)),
    `нужно ${n} ${n === 1 ? 'число' : 'числа'}`);
  return a;
}
const positive = (...xs) => check(xs.every((x) => x > 0), 'длины должны быть положительными');

const LABELS = {
  1: ['AB', 'BC', 'AC'], 2: ['S'], 3: ['S'], 4: ['a (большее)', 'b (меньшее)'], 5: ['AD'], 6: ['d'],
  7: ['EK'], 8: ['CD'], 9: ['AH'], 10: ['расстояние'], 11: ['R'], 12: ['R'], 13: ['R'], 14: ['R'],
  15: ['S'], 16: ['r'],
};

/* ---------------- построения по типам ---------------- */
const BUILD = {
  /* 1. Биссектриса BE и медиана AD перпендикулярны и равны L. */
  1(p) {
    const [L] = nums(p, 1); positive(L);
    // P — точка пересечения; прямая AD — ось x, прямая BE — ось y (BE ⟂ AD).
    // A=(−s,0), D=(L−s,0), B=(0,t), E=(0,t−L); D — середина BC, поэтому C = 2D − B.
    const fig = (s, t) => {
      const A = [-s, 0], D = [L - s, 0], B = [0, t], E = [0, t - L];
      return { A, B, C: sub(mul(D, 2), B), D, E };
    };
    // при данном s число t — из условия «E лежит на AC»
    const tOf = (s) => {
      const r = uniq(roots((t) => { const F = fig(s, t); return cross(sub(F.C, F.A), sub(F.E, F.A)); }, 0, L, 64));
      return r.length === 1 ? r[0] : NaN;
    };
    // s — из условия «BE — биссектриса угла B»
    const s = root1((x) => {
      const t = tOf(x);
      if (!Number.isFinite(t)) return NaN;
      const F = fig(x, t);
      return angle(F.B, F.A, F.E) - angle(F.B, F.E, F.C);
    }, L * 1e-6, L * (1 - 1e-6), 400, 'треугольника с такими биссектрисой и медианой нет', 1e-9);
    const F = fig(s, tOf(s));
    check(near(dist(F.A, F.D), L) && near(dist(F.B, F.E), L), 'AD или BE не равна данной длине');
    check(Math.abs(dot(unit(sub(F.D, F.A)), unit(sub(F.E, F.B)))) < TOL, 'AD не перпендикулярна BE');
    check(near(dist(F.B, F.D), dist(F.D, F.C)) && toLine(F.D, F.B, F.C) < TOL * L, 'D не середина BC');
    const e = foot(F.E, F.A, F.C);
    check(e.t > 0 && e.t < 1 && toLine(F.E, F.A, F.C) < TOL * L, 'E не на стороне AC');
    check(near(angle(F.B, F.A, F.E), angle(F.B, F.E, F.C)), 'BE не биссектриса угла B');
    const AB = dist(F.A, F.B), BC = dist(F.B, F.C), AC = dist(F.A, F.C);
    return { ans: { AB, BC, AC }, ask: { 'AB = c': AB } };
  },

  /* 2. Параллелограмм, биссектрисы углов A и B пересекаются в K; BC и расстояние от K до AB. */
  2(p) {
    const [a, h] = nums(p, 2); positive(a, h);
    const fig = (phi, ab) => {
      const A = [0, 0], D = [a, 0], B = polar(ab, phi), C = add(B, [a, 0]);
      const K = meet(A, add(A, add(unit(sub(B, A)), unit(sub(D, A)))),
        B, add(B, add(unit(sub(A, B)), unit(sub(C, B)))));
      return { A, B, C, D, K };
    };
    const one = (deg) => {
      const phi = rad(deg);
      // сторона AB не дана: подбираем её так, чтобы K была на расстоянии h от прямой AB
      const ab = root1((x) => { const F = fig(phi, x); return toLine(F.K, F.A, F.B) - h; },
        h * 1e-6, h * 1e3, 4000, 'параллелограмм не найден', 1e-9 * h);
      const F = fig(phi, ab);
      const k = foot(F.K, F.A, F.B);
      check(k.t > 0 && k.t < 1, 'перпендикуляр из K падает не на сторону AB');
      check(near(angle(F.A, F.B, F.K), angle(F.A, F.K, F.D)) && near(angle(F.B, F.A, F.K), angle(F.B, F.K, F.C)),
        'AK и BK не биссектрисы');
      return { S: area([F.A, F.B, F.C, F.D]), H: toLine(F.B, F.A, F.D) };
    };
    const u = one(64), v = one(117);   // угол параллелограмма в условии не задан
    check(near(u.S, v.S), 'площадь зависит от угла параллелограмма — данных не хватает');
    return { ans: { S: u.S }, ask: { 'высота': u.H, S: u.S } };
  },

  /* 3. Трапеция: боковые AB, CD, основание BC; биссектриса угла ADC проходит через середину AB. */
  3(p) {
    const [AB, CD, BC] = nums(p, 3); positive(AB, CD, BC);
    // A=(0,0), D=(x,0), x = AD неизвестно; B — на окружности (A, AB), C = B + (BC, 0) — на окружности (D, CD)
    const fig = (x) => {
      const B = circlesUp([0, 0], AB, [x - BC, 0], CD);
      return B ? { A: [0, 0], B, C: add(B, [BC, 0]), D: [x, 0] } : null;
    };
    const bis = (F) => add(unit(sub(F.A, F.D)), unit(sub(F.C, F.D)));   // направление биссектрисы угла ADC
    const g = (x) => { const F = fig(x); return F ? cross(bis(F), sub(mid(F.A, F.B), F.D)) : NaN; };
    const X = 2 * (AB + CD + BC);
    const xs = uniq(roots(g, X * 1e-9, X, 40000)).filter((x) => {
      const F = fig(x);
      return F && Math.abs(g(x)) < 1e-8 * X && dot(bis(F), sub(mid(F.A, F.B), F.D)) > 0;
    });
    check(xs.length >= 1, 'трапеции с такими сторонами, у которой биссектриса угла D проходит через середину AB, нет');
    const res = xs.map((x) => { const F = fig(x); return { F, S: area([F.A, F.B, F.C, F.D]) }; });
    check(res.every((r) => near(r.S, res[0].S)), 'площадь определяется неоднозначно');
    const { F, S } = res[0];
    check(F.B[1] > 1e-6 * X, 'трапеция вырождается в отрезок');
    check(Math.abs(F.B[1] - F.C[1]) < TOL * X, 'BC не параллельна AD');
    check(near(dist(F.A, F.B), AB) && near(dist(F.C, F.D), CD) && near(dist(F.B, F.C), BC), 'стороны не совпадают с данными');
    const M = mid(F.A, F.B);
    check(near(angle(F.D, F.A, M), angle(F.D, M, F.C)), 'DM не биссектриса угла ADC');
    return { ans: { S }, ask: { AD: dist(F.A, F.D), 'высота h': F.B[1], S } };
  },

  /* 4. Трапеция: углы при одном основании; отрезки между серединами противоположных сторон. */
  4(p) {
    const [al, be, s1, s2] = nums(p, 4);
    check(al > 0 && al < 180 && be > 0 && be < 180, 'углы трапеции должны быть между 0° и 180°');
    check(al + be !== 180, 'при сумме углов 180° получается параллелограмм, а не трапеция');
    positive(s1, s2);
    // сумма углов при большем основании меньше 180°; если данные углы в сумме больше — они при меньшем
    const [qa, qd] = al + be < 180 ? [al, be] : [180 - al, 180 - be];
    // AD = a — большее основание, BC = b; углы при A и D равны qa и qd
    const fig = (a, b) => {
      const A = [0, 0], D = [a, 0], D1 = [a - b, 0];
      const B = meet(A, polar(1, rad(qa)), D1, add(D1, polar(1, PI - rad(qd))));
      return B ? { A, B, C: add(B, [b, 0]), D } : null;
    };
    const segs = (F) => ({
      m: dist(mid(F.A, F.B), mid(F.C, F.D)),   // между серединами боковых сторон
      q: dist(mid(F.A, F.D), mid(F.B, F.C)),   // между серединами оснований
    });
    const top = 4 * (s1 + s2);
    const sols = [];
    for (const [m, q] of [[s1, s2], [s2, s1]]) {   // какой отрезок какой — в условии не сказано
      // при данной сумме оснований sg разность dl подбираем по второму отрезку (0 < dl < sg, чтобы b > 0),
      // затем sg — по первому
      const dOf = (sg) => {
        const r = uniq(roots((dl) => { const F = fig((sg + dl) / 2, (sg - dl) / 2); return F ? segs(F).q - q : NaN; },
          sg * 1e-9, sg * (1 - 1e-9), 100));
        return r.length === 1 ? r[0] : NaN;
      };
      const sgs = uniq(roots((sg) => {
        const dl = dOf(sg);
        if (!Number.isFinite(dl)) return NaN;
        const F = fig((sg + dl) / 2, (sg - dl) / 2);
        return F ? segs(F).m - m : NaN;
      }, top * 1e-9, top, 100));
      for (const sg of sgs) {
        const dl = dOf(sg), a = (sg + dl) / 2, b = (sg - dl) / 2, F = fig(a, b);
        if (F && b > 0 && a > b && near(segs(F).m, m) && near(segs(F).q, q)) sols.push({ a, b, F });
      }
    }
    check(sols.length === 1, sols.length ? 'основания определяются неоднозначно' : 'трапеции с такими отрезками нет');
    const { a, b, F } = sols[0];
    check(near(angle(F.A, F.D, F.B), rad(qa)) && near(angle(F.D, F.A, F.C), rad(qd)), 'углы при основании не совпадают с данными');
    check(near(dist(F.B, F.C), b) && Math.abs(F.B[1] - F.C[1]) < TOL * a && F.B[1] > 0, 'BC не параллельна AD');
    return { ans: { 'a (большее)': a, 'b (меньшее)': b }, ask: { 'большее основание a': a } };
  },

  /* 5. Середина M стороны AD выпуклого ABCD равноудалена от вершин; BC, углы B и C. */
  5(p) {
    const [BC, Bd, Cd] = nums(p, 3); positive(BC);
    check(Bd > 0 && Bd < 180 && Cd > 0 && Cd < 180, 'углы четырёхугольника должны быть между 0° и 180°');
    // M — центр окружности через A, B, C, D; радиус 1 (затем масштаб), AD — диаметр.
    // B и C — на одной полуокружности (иначе ABCD не выпуклый).
    const A = [-1, 0], D = [1, 0], P = (t) => polar(1, t);
    // угол ABC зависит только от положения C (B — любая точка дуги CA), угол BCD — только от B
    const tC = root1((t) => angle(P((t + PI) / 2), A, P(t)) - rad(Bd), 1e-9, PI - 1e-9, 2000,
      'угол B такого четырёхугольника должен быть тупым', 1e-12);
    const tB = root1((t) => angle(P(t / 2), P(t), D) - rad(Cd), 1e-9, PI - 1e-9, 2000,
      'угол C такого четырёхугольника должен быть тупым', 1e-12);
    check(tB - tC > 1e-6, 'выпуклого четырёхугольника с такими углами нет (сумма углов B и C должна быть меньше 270°)');
    const B = P(tB), C = P(tC);
    check(near(angle(B, A, C), rad(Bd)) && near(angle(C, B, D), rad(Cd)), 'углы B и C не совпадают с данными');
    const Q = [A, B, C, D];
    const turns = Q.map((X, i) => cross(sub(Q[(i + 1) % 4], X), sub(Q[(i + 2) % 4], Q[(i + 1) % 4])));
    check(turns.every((z) => z < 0) || turns.every((z) => z > 0), 'четырёхугольник не выпуклый');
    const k = BC / dist(B, C);   // масштаб: радиус окружности равен k
    const AD = k * dist(A, D);
    return { ans: { AD }, ask: { AD } };
  },

  /* 6. Равнобедренная трапеция с вписанной окружностью: периметр P, площадь S. */
  6(p) {
    const [P, S] = nums(p, 2); positive(P, S);
    // площадь описанного многоугольника равна радиусу вписанной окружности, умноженному на полупериметр;
    // окружность касается обоих оснований, поэтому высота равна диаметру
    const r = S / (P / 2), H = 2 * r, I = [0, r];
    // симметрия: A=(−x,0), D=(x,0), B=(−y,H), C=(y,H); при данном x число y — из касания AB с окружностью
    const yOf = (x) => {
      const s = uniq(roots((y) => toLine(I, [-x, 0], [-y, H]) - r, 0, x, 150));
      return s.length === 1 ? s[0] : NaN;
    };
    const per = (x) => {
      const y = yOf(x);
      return Number.isFinite(y) ? 2 * x + 2 * y + 2 * dist([-x, 0], [-y, H]) - P : NaN;
    };
    const x = root1(per, r * (1 + 1e-9), P / 2, 400,
      'равнобедренной трапеции с таким периметром и такой площадью, в которую можно вписать окружность, нет', 1e-9 * P);
    const y = yOf(x);
    const A = [-x, 0], B = [-y, H], C = [y, H], D = [x, 0];
    check([[A, B], [B, C], [C, D], [D, A]].every(([U, V]) => near(toLine(I, U, V), r)), 'окружность касается не всех сторон');
    check(near(area([A, B, C, D]), S) && near(dist(A, B) + dist(B, C) + dist(C, D) + dist(D, A), P), 'площадь или периметр не совпадают с данными');
    check(y > 0 && x - y > 1e-6 * x, 'получается квадрат, а не трапеция (нужно P² > 16·S)');
    const K = meet(A, C, B, D);
    const d = toLine(K, B, C);
    return { ans: { d }, ask: { 'высота h': toLine(B, A, D), 'расстояние': d } };
  },

  /* 7. Трапеция, AB ⟂ BC; окружность через C и D касается прямой AB в E; AD и BC. */
  7(p) {
    const [AD, BC] = nums(p, 2); positive(AD, BC);
    check(AD !== BC, 'при AD = BC получается прямоугольник, а не трапеция');
    const vals = [];
    for (const H of [0.8 * (AD + BC), 2.3 * (AD + BC)]) {   // длина AB в условии не дана
      const A = [0, H], B = [0, 0], C = [BC, 0], D = [AD, H];
      // окружность касается прямой AB (x = 0): центр (ρ, y0), радиус ρ; через C: ρ = (BC² + y0²)/(2·BC)
      const rho = (y0) => (BC * BC + y0 * y0) / (2 * BC);
      // проходит ли окружность через D: |OD|² − ρ² = (ρ − AD)² + (y0 − H)² − ρ², слагаемые ρ² сокращены,
      // иначе при AD ≈ BC вторая (огромная) окружность теряет точность
      const f = (y0) => AD * AD - 2 * rho(y0) * AD + (y0 - H) ** 2;
      const Y = 4 * (AD + BC + H) * (1 + (AD + BC) / Math.abs(AD - BC));
      const ys = uniq(roots(f, -Y, Y, 40000));
      check(ys.length === 2, 'окружностей через C и D, касающихся AB, не две');
      for (const y0 of ys) {
        const O = [rho(y0), y0], R = rho(y0), E = [0, y0];
        check(near(dist(O, C), R) && near(dist(O, D), R) && near(toLine(O, A, B), R), 'окружность построена неверно');
        vals.push(toLine(E, C, D));
      }
    }
    check(vals.every((v) => near(v, vals[0])), 'расстояние зависит от высоты трапеции — данных не хватает');
    return { ans: { EK: vals[0] }, ask: { 'EK² = BC·AD': vals[0] ** 2, EK: vals[0] } };
  },

  /* 8. AB и AC; O — центр описанной окружности; прямая BD ⟂ AO пересекает сторону AC в D. */
  8(p) {
    const [AB, AC] = nums(p, 2); positive(AB, AC);
    const res = [47, 76, 118].map((deg) => {   // угол A в условии не задан: три разных треугольника
      const A = [0, 0], B = polar(AB, rad(deg)), C = [AC, 0];
      const O = circumcenter(A, B, C);
      check(near(dist(O, A), dist(O, B)) && near(dist(O, A), dist(O, C)), 'центр описанной окружности найден неверно');
      const D = meet(B, add(B, perp(sub(O, A))), A, C);
      check(D, 'прямая BD параллельна AC');
      check(Math.abs(dot(unit(sub(D, B)), unit(sub(O, A)))) < TOL, 'BD не перпендикулярна AO');
      return { t: foot(D, A, C).t, AD: dist(A, D), CD: dist(C, D) };
    });
    check(res.every((r) => r.t > 0 && r.t < 1), 'прямая BD пересекает прямую AC вне стороны AC (нужно AB < AC)');
    check(res.every((r) => near(r.CD, res[0].CD)), 'CD зависит от угла A — данных не хватает');
    return { ans: { CD: res[0].CD }, ask: { AD: res[0].AD, CD: res[0].CD } };
  },

  /* 9. Остроугольный ABC, полуокружность на BC пересекает высоту AD в M; H — ортоцентр. */
  9(p) {
    const [AD, MD] = nums(p, 2); positive(AD, MD);
    check(MD < AD, 'точка M должна лежать на высоте AD между A и D (MD < AD)');
    const A = [0, AD], D = [0, 0], M = [0, MD];
    const res = [0.45, 1.8].map((k) => {   // BD в условии не дано: два разных треугольника
      const B = [-k * MD, 0];
      // DC подбираем так, чтобы окружность с диаметром BC прошла через M
      const c = root1((x) => dist(mid(B, [x, 0]), M) - dist(B, [x, 0]) / 2, MD * 1e-9, MD * (4 + 4 / k), 4000,
        'полуокружность на BC не проходит через M', 1e-9 * MD);
      const C = [c, 0];
      const H = meet(A, D, B, add(B, perp(sub(C, A))));   // пересечение высот из A и из B
      check([angle(A, B, C), angle(B, A, C), angle(C, A, B)].every((x) => x < PI / 2), 'треугольник не остроугольный');
      check(near(angle(M, B, C), PI / 2), 'угол BMC не прямой');
      check(Math.abs(dot(unit(sub(C, H)), unit(sub(B, A)))) < TOL, 'H не точка пересечения высот');
      return { AH: dist(A, H), DH: dist(D, H) };
    });
    check(near(res[0].AH, res[1].AH), 'AH зависит от формы треугольника — данных не хватает');
    return { ans: { AH: res[0].AH }, ask: { DH: res[0].DH, AH: res[0].AH } };
  },

  /* 10. Две окружности касаются внешним образом; AC и BD — общие касательные. */
  10(p) {
    const [r1, r2] = nums(p, 2); positive(r1, r2);
    const O1 = [0, 0], O2 = [r1 + r2, 0];   // внешнее касание: расстояние между центрами — сумма радиусов
    // прямая {X : n·X = r1} (n — единичная нормаль) касается первой окружности;
    // вторую она касается с той же стороны, если n·O2 = r1 − r2
    const ths = uniq(roots((t) => dot(polar(1, t), O2) - (r1 - r2), -PI + 1e-9, PI - 1e-9, 4000));
    check(ths.length === 2, 'общих внешних касательных не две');
    const tang = ths.map((t) => { const n = polar(1, t); return [mul(n, r1), add(O2, mul(n, r1 - dot(n, O2)))]; });
    for (const [X, Y] of tang) {
      check(near(dist(X, O1), r1) && near(dist(Y, O2), r2) && near(toLine(O1, X, Y), r1) && near(toLine(O2, X, Y), r2),
        'прямая не касается обеих окружностей');
    }
    const [[A, C], [B, D]] = tang;
    check(Math.abs(cross(unit(sub(B, A)), unit(sub(D, C)))) < TOL, 'AB не параллельна CD');
    const dd = toLine(C, A, B);
    return { ans: { 'расстояние': dd }, ask: { 'd = O₁O₂': dist(O1, O2), 'расстояние': dd } };
  },

  /* 11. Вписанный ABCD со сторонами AB и CD; диагонали пересекаются в K, ∠AKB = 60°. */
  11(p) {
    const [AB, CD] = nums(p, 2); positive(AB, CD);
    // вершины по порядку на окружности радиуса R; хорды AB и CD стягивают дуги 2·arcsin(хорда/2R),
    // оставшиеся дуги BC и DA делятся в доле tau (от неё ответ зависеть не должен)
    const fig = (R, tau) => {
      const a1 = 2 * Math.asin(AB / (2 * R)), a3 = 2 * Math.asin(CD / (2 * R)), rest = 2 * PI - a1 - a3;
      if (!(rest > 0)) return null;
      const tC = a1 + tau * rest;
      const A = polar(R, 0), B = polar(R, a1), C = polar(R, tC), D = polar(R, tC + a3);
      return { A, B, C, D, K: meet(A, C, B, D) };
    };
    const lo = Math.max(AB, CD) / 2;
    const Rs = [0.37, 0.61].map((tau) => {
      const R = root1((x) => { const F = fig(x, tau); return F && F.K ? angle(F.K, F.A, F.B) - PI / 3 : NaN; },
        lo * (1 + 1e-12), 50 * (AB + CD), 20000, 'радиус не найден', 1e-12);
      const F = fig(R, tau);
      check(near(dist(F.A, F.B), AB) && near(dist(F.C, F.D), CD), 'хорды не совпадают с данными');
      const k1 = foot(F.K, F.A, F.C).t, k2 = foot(F.K, F.B, F.D).t;
      check(k1 > 0 && k1 < 1 && k2 > 0 && k2 < 1, 'диагонали пересекаются не внутри четырёхугольника');
      return R;
    });
    check(near(Rs[0], Rs[1]), 'радиус зависит от положения вершин — данных не хватает');
    return { ans: { R: Rs[0] }, ask: { 'AB² + CD² + AB·CD': 3 * Rs[0] ** 2, R: Rs[0] } };
  },

  /* 12. M и N на AC (AM = m, AN = n); окружность через M и N касается луча AB; cos∠BAC = √under/den. */
  12(p) {
    const [m, n, under, den] = nums(p, 4);
    check(m > 0 && n > m, 'нужно 0 < AM < AN (M между A и N)');
    check(under >= 0 && den > 0 && under < den * den, 'косинус угла BAC должен быть от 0 до 1');
    const al = Math.acos(Math.sqrt(under) / den);
    const A = [0, 0], M = [m, 0], N = [n, 0], U = polar(1, al);   // луч AC — ось x, луч AB — под углом A
    // центр — на серединном перпендикуляре к MN; касание прямой AB: расстояние до неё равно радиусу
    const xc = (m + n) / 2, Y = (8 * n) / Math.sin(al) + 8 * n;
    const f = (k) => toLine([xc, k], A, U) - dist([xc, k], M);
    const cands = uniq(roots(f, -Y, Y, 40000)).filter((k) => Math.abs(f(k)) < 1e-9 * Y).map((k) => {
      const O = [xc, k], T = foot(O, A, U);
      return { O, T: T.X, t: T.t, R: dist(O, M) };
    });
    check(cands.length === 2, 'окружностей через M и N, касающихся прямой AB, не две');
    const ray = cands.filter((c) => c.t > 0);
    check(ray.length === 1, 'окружность, касающаяся именно луча AB, не единственна');
    const { O, T, R } = ray[0];
    check(near(dist(O, N), R) && near(toLine(O, A, U), R), 'окружность не проходит через N или не касается AB');
    return { ans: { R }, ask: { 'AT² = AM·AN': dist(A, T) ** 2, R } };
  },

  /* 13. Высота BH и биссектриса из A пересекаются в K, BK : KH = p : q; дано BC. */
  13(p) {
    const [pp, qq, BC] = nums(p, 3); positive(pp, qq, BC);
    check(pp > qq, 'BK должно быть больше KH: в прямоугольном треугольнике ABH гипотенуза AB длиннее катета AH');
    const tri = (phi, ac) => {   // AB = 1, угол A = phi, AC = ac
      const A = [0, 0], B = polar(1, phi), C = [ac, 0];
      const H = foot(B, A, C).X;
      const K = meet(A, add(A, add(unit(sub(B, A)), unit(sub(C, A)))), B, H);
      return { A, B, C, H, K };
    };
    // угол A подбираем так, чтобы биссектриса делила высоту BH в данном отношении
    const phi = root1((x) => { const F = tri(x, 2); return dist(F.B, F.K) / dist(F.K, F.H) - pp / qq; },
      1e-6, PI / 2 - 1e-9, 4000, 'угол A не найден', 1e-10 * (pp / qq));
    const res = [1.25, 1.7].map((ac) => {   // форма треугольника (AC : AB) не дана
      const F = tri(phi, ac), s = BC / dist(F.B, F.C);   // масштаб, чтобы BC стала данной
      const [A, B, C, H, K] = [F.A, F.B, F.C, F.H, F.K].map((X) => mul(X, s));
      const th = foot(H, A, C).t, tk = foot(K, B, H).t;
      check(th > 0 && th < 1 && tk > 0 && tk < 1, 'H не на стороне AC или K не на высоте BH');
      check(near(dist(B, K) / dist(K, H), pp / qq) && near(angle(A, B, K), angle(A, K, C)), 'отношение или биссектриса не совпадают');
      const O = circumcenter(A, B, C);
      return { R: dist(O, A), cos: Math.cos(angle(A, B, C)) };
    });
    check(near(res[0].R, res[1].R), 'радиус зависит от формы треугольника — данных не хватает');
    return { ans: { R: res[0].R }, ask: { 'cos α': res[0].cos, R: res[0].R } };
  },

  /* 14. Трапеция: AD, BC, ∠A + ∠D = 90°; окружность через A и B касается прямой CD; дано AB. */
  14(p) {
    const [AD, BC, AB] = nums(p, 3); positive(AD, BC, AB);
    check(AD > BC, 'при сумме углов 90° основание AD должно быть большим');
    const fig = (al) => {   // угол A = al, угол D = 90° − al
      const A = [0, 0], D = [AD, 0], B = polar(AB, al);
      const C = meet(B, add(B, [1, 0]), D, add(D, polar(1, PI / 2 + al)));
      return { A, B, C, D };
    };
    const al = root1((x) => { const F = fig(x); return F.C[0] - F.B[0] - BC; }, 1e-9, PI / 2 - 1e-9, 4000,
      'трапеции с такими сторонами нет (нужно AB < AD − BC)', 1e-9 * AD);
    const F = fig(al);
    check(F.B[1] > 1e-6 * AD, 'трапеция вырождается в отрезок (нужно AB < AD − BC)');
    check(near(angle(F.A, F.B, F.D) + angle(F.D, F.A, F.C), PI / 2), 'сумма углов при AD не 90°');
    check(near(dist(F.B, F.C), BC) && near(dist(F.A, F.B), AB) && Math.abs(F.B[1] - F.C[1]) < TOL * AD, 'стороны не совпадают с данными');
    // центр — на серединном перпендикуляре к AB; касание прямой CD: расстояние до неё равно радиусу
    const Mab = mid(F.A, F.B), nv = perp(unit(sub(F.B, F.A))), Z = 4 * (AD + AB + BC);
    const g = (s) => { const O = add(Mab, mul(nv, s)); return dist(O, F.A) - toLine(O, F.C, F.D); };
    const Rs = uniq(roots(g, -Z, Z, 40000)).filter((s) => Math.abs(g(s)) < 1e-9 * Z).map((s) => dist(add(Mab, mul(nv, s)), F.A));
    check(Rs.length >= 1, 'окружности через A и B, касающейся CD, нет');
    check(Rs.every((R) => near(R, Rs[0])), 'две такие окружности дают разные радиусы — ответ неоднозначен');
    const P = meet(F.A, F.B, F.D, F.C);   // точка пересечения продолжений боковых сторон
    return { ans: { R: Rs[0] }, ask: { 'k = AD/BC': dist(P, F.A) / dist(P, F.B), R: Rs[0] } };
  },

  /* 15. Параллелограмм ABCD, O — центр окружности, вписанной в △ABC; OA, расстояния до AD и до AC. */
  15(p) {
    const [dA, dAD, r] = nums(p, 3); positive(dA, dAD, r);
    check(r < dA, 'OA должно быть больше радиуса r вписанной окружности');
    check(dAD <= dA, 'расстояние от O до прямой AD не может быть больше OA');
    const t = Math.sqrt(dA * dA - r * r);
    const A = [0, 0], O = [t, r];   // окружность касается прямой AC (ось x) в точке (t, 0)
    const uo = unit(O), ab = sub(mul(uo, 2 * uo[0]), [1, 0]);   // луч AB — отражение луча AC относительно AO
    // прямая AD: через A, ниже оси x (B и D по разные стороны от AC), на расстоянии dAD от O
    const f = (ph) => toLine(O, A, polar(1, ph)) - dAD;
    let phs = uniq(roots(f, -PI + 1e-9, -1e-9, 20000)).filter((ph) => Math.abs(f(ph)) < 1e-9 * dA);
    const phPerp = Math.atan2(r, t) - PI / 2;   // касание сверху: AD ⟂ AO
    if (!phs.length && Math.abs(f(phPerp)) < 1e-9 * dA) phs = [phPerp];
    const sols = [];
    for (const ph of phs) {
      const w = polar(1, ph);
      let nv = perp(w);
      if (dot(nv, O) < 0) nv = mul(nv, -1);
      const X0 = mul(nv, dot(nv, O) + r);   // BC ∥ AD и касается окружности с дальней от A стороны
      const B = meet(X0, add(X0, w), A, ab), C = meet(X0, add(X0, w), A, [1, 0]);
      if (!B || !C || !(dot(B, ab) > 0) || !(C[0] > 0)) continue;
      const sides = [[A, B], [B, C], [C, A]];
      if (!sides.every(([U, V]) => near(toLine(O, U, V), r))) continue;
      const side = sides.map(([U, V]) => Math.sign(cross(sub(V, U), sub(O, U))));
      if (!side.every((z) => z === side[0])) continue;   // O внутри треугольника ABC
      const D = sub(add(A, C), B);
      check(near(toLine(O, A, D), dAD) && near(dist(O, A), dA) && near(toLine(O, A, C), r), 'расстояния не совпадают с данными');
      sols.push(Math.abs(cross(sub(B, A), sub(D, A))));
    }
    check(sols.length >= 1, 'параллелограмма с такими расстояниями нет (нужно r < расстояния до AD ≤ OA)');
    check(sols.every((S) => near(S, sols[0])), 'площадь определяется неоднозначно');
    return { ans: { S: sols[0] }, ask: { S: sols[0] } };
  },

  /* 16. Равнобедренный ABC с основанием AC; вневписанная окружность, касающаяся AC, радиуса rB. */
  16(p) {
    const [AC, rB] = nums(p, 2); positive(AC, rB);
    const w = AC / 2, A = [-w, 0], C = [w, 0], E = [0, -rB];   // центр — на оси симметрии, под основанием
    // вершину B=(0, h) подбираем из касания прямой AB с окружностью; переменная — логарифм h
    const g = (z) => toLine(E, A, [0, w * Math.exp(z)]) - rB;
    const z = root1(g, Math.log(1e-6), Math.log(1e9), 20000,
      'такого треугольника нет: радиус вневписанной окружности должен быть больше половины основания', 1e-9 * rB);
    const B = [0, w * Math.exp(z)];
    const a = dist(B, C), b = dist(C, A), c = dist(A, B);
    const I = mul(add(add(mul(A, a), mul(B, b)), mul(C, c)), 1 / (a + b + c));   // центр вписанной окружности
    const r = toLine(I, A, C);
    check(near(toLine(I, A, B), r) && near(toLine(I, B, C), r), 'I не равноудалена от сторон');
    check(near(toLine(E, B, C), rB) && near(toLine(E, A, C), rB), 'вневписанная окружность не касается сторон');
    const tA = foot(E, B, A).t, tC = foot(E, B, C).t, tAC = foot(E, A, C).t;
    check(tA > 1 && tC > 1 && tAC > 0 && tAC < 1, 'окружность касается не основания и продолжений боковых сторон');
    const s = (a + b + c) / 2;
    return { ans: { r }, ask: { 's − AB': s - c, r } };
  },
};

/* ---------------- экспорт ---------------- */
/* гейт спрашивает solve, validity и askValues про одни и те же данные — построение кешируется */
const CACHE = new Map();
function run(id, p) {
  const key = id + ':' + JSON.stringify(p);
  if (CACHE.has(key)) return CACHE.get(key);
  let r;
  const f = BUILD[id];
  if (!f) r = { why: 'неизвестный тип задачи' };
  else {
    try {
      r = f(p);
    } catch (e) {
      r = { why: e instanceof Invalid ? e.message : 'сбой решателя: ' + (e && e.message ? e.message : String(e)) };
    }
  }
  if (CACHE.size > 2000) CACHE.clear();
  CACHE.set(key, r);
  return r;
}

export const solve = Object.fromEntries(Object.keys(BUILD).map((id) => [id, (p) => {
  const r = run(+id, p);
  return r.why ? Object.fromEntries(LABELS[id].map((l) => [l, NaN])) : { ...r.ans };
}]));

export function validity(id, p) {
  const r = run(+id, p);
  return r.why || '';
}

export function askValues(id, p) {
  const r = run(+id, p);
  return r.why ? {} : { ...r.ask };
}
