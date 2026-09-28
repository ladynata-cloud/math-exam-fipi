/*
  Независимый решатель задания №23 ОГЭ «Геометрические задачи на вычисление»
  для тренажёра trainers/oge-task23-geometry-calculations.html (20 подтипов SUBS).

  Зачем. Гейт OGE_COURSE_03A требует пересчитывать каждый ответ ДРУГИМ кодом,
  «через геометрию в координатах». Поэтому здесь нет ни формул-ответов из
  SUBS[k].calc, ни таблицы IND тренажёра. Для каждого подтипа фигура строится
  численно по данным задачи: точки, прямые, окружности, их пересечения,
  перпендикуляры, биссектрисы, касательные. Искомая величина затем измеряется
  на построенном чертеже: расстояние, угол, периметр, площадь.

  Подбор. Когда в условии дано измерение, а не координата (BK при неизвестной
  стороне AB, расстояние от центра до стороны при неизвестной диагонали BD,
  длина касательной при неизвестном радиусе), неизвестный параметр подбирается
  бисекцией по монотонной зависимости «параметр → измерение на чертеже» до
  машинной точности. Теоремы о равнобедренном треугольнике, подобии,
  касательной и секущей при этом не используются — они проверяются.

  Свободные параметры. Если данные не фиксируют фигуру целиком (угол
  параллелограмма, форма треугольника, высота трапеции, выбор окружности через
  B и C), фигура строится в двух разных допустимых формах. Разные измерения
  значат, что ответ условием не определён: решатель возвращает NaN, и гейт
  покажет это как расхождение.

  Экспорт:
    solve[k](p)    → Number: ответ десятичным числом (корни — десятичной дробью:
                     25√3 → 43,301…). Для rhombAng — ОСТРЫЙ угол ромба в градусах.
                     Тренажёр принимает и α, и 180° − α (SUBS.rhombAng.ansEqCustom),
                     а SUBS.rhombAng.calc отдаёт угол при вершине A, который при
                     2d/D > √2/2 тупой. Сравнивать с min(calc, 180 − calc).
    validity(k, p) → '' — фигура с такими данными существует и она того вида,
                     что назван в условии; иначе короткая причина по-русски.

  Голый Node ≥ 18, без зависимостей, тренажёр не импортируется.
*/

/* ================= геометрический набор: координаты, y вверх ================= */

const RAD = Math.PI / 180;
const pt = (x, y) => ({ x, y });
const add = (a, b) => pt(a.x + b.x, a.y + b.y);
const sub = (a, b) => pt(a.x - b.x, a.y - b.y);
const mul = (a, k) => pt(a.x * k, a.y * k);
const dot = (a, b) => a.x * b.x + a.y * b.y;
const cross = (a, b) => a.x * b.y - a.y * b.x;
const len = (a) => Math.hypot(a.x, a.y);
const dist = (a, b) => len(sub(a, b));
const unit = (a) => mul(a, 1 / len(a));
const mid = (a, b) => pt((a.x + b.x) / 2, (a.y + b.y) / 2);
const lerp = (a, b, t) => add(a, mul(sub(b, a), t));              // точка a + t·(b − a)
const ray = (deg) => pt(Math.cos(deg * RAD), Math.sin(deg * RAD)); // единичный вектор под углом deg к оси x
const turn90 = (a) => pt(-a.y, a.x);                                // поворот на 90° против часовой стрелки
const ORIGIN = pt(0, 0);
const X = pt(1, 0);                                                 // направление оси x

/* пересечение прямых p1p2 и q1q2 (правило Крамера); null — прямые параллельны */
function meet(p1, p2, q1, q2) {
  const r = sub(p2, p1), s = sub(q2, q1), den = cross(r, s);
  if (!(Math.abs(den) > 1e-13 * len(r) * len(s))) return null;
  return add(p1, mul(r, cross(sub(q1, p1), s) / den));
}

/* основание перпендикуляра из точки p на прямую ab */
function foot(p, a, b) {
  const ab = sub(b, a);
  return add(a, mul(ab, dot(sub(p, a), ab) / dot(ab, ab)));
}

/* расстояние от точки p до прямой ab: |векторное произведение| / длина ab */
const distToLine = (p, a, b) => Math.abs(cross(sub(b, a), sub(p, a))) / dist(a, b);

/* точки пересечения прямой ab с окружностью (o, r): от основания перпендикуляра
   из центра откладываем в обе стороны половину хорды */
function lineCircle(a, b, o, r) {
  const f = foot(o, a, b), h = dist(o, f);
  if (!(h <= r * (1 + 1e-12))) return [];
  const half = Math.sqrt(Math.max(r * r - h * h, 0)), u = unit(sub(b, a));
  return [sub(f, mul(u, half)), add(f, mul(u, half))];
}

/* вторая точка пересечения прямой ab с окружностью — дальняя от известной точки known */
function otherPoint(a, b, o, r, known) {
  const s = lineCircle(a, b, o, r);
  if (!s.length) return null;
  return dist(s[0], known) >= dist(s[1], known) ? s[0] : s[1];
}

/* точки пересечения окружностей (o1, r1) и (o2, r2) — через радикальную ось */
function circleCircle(o1, r1, o2, r2) {
  const d = dist(o1, o2), tol = 1e-12 * (r1 + r2);
  if (!(d > 0) || d > r1 + r2 + tol || d < Math.abs(r1 - r2) - tol) return [];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);                  // от o1 до радикальной оси
  const h = Math.sqrt(Math.max(r1 * r1 - a * a, 0));
  const u = unit(sub(o2, o1)), base = add(o1, mul(u, a)), n = turn90(u);
  return [add(base, mul(n, h)), sub(base, mul(n, h))];
}

/* центр описанной окружности — пересечение серединных перпендикуляров к ab и bc */
function circumcenter(a, b, c) {
  const m1 = mid(a, b), m2 = mid(b, c);
  return meet(m1, add(m1, turn90(sub(b, a))), m2, add(m2, turn90(sub(c, b))));
}

/* угол при вершине v между лучами v→p1 и v→p2, в градусах (через atan2, без acos) */
function angleAt(v, p1, p2) {
  const a = sub(p1, v), b = sub(p2, v);
  return Math.atan2(Math.abs(cross(a, b)), dot(a, b)) / RAD;
}

/* площадь многоугольника по формуле шнурования */
function area(poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) s += cross(poly[i], poly[(i + 1) % poly.length]);
  return Math.abs(s) / 2;
}

/* положение точки q прямой ab: 0 — в точке a, 1 — в точке b */
const along = (q, a, b) => dot(sub(q, a), sub(b, a)) / dot(sub(b, a), sub(b, a));
/* q лежит строго внутри отрезка ab (q берётся на прямой ab) */
const inside = (q, a, b) => { const t = along(q, a, b); return t > 1e-9 && t < 1 - 1e-9; };

/* бисекция: x ∈ [lo, hi], при котором монотонная f(x) равна target; NaN — корня нет */
function fit(f, target, lo, hi) {
  let gLo = f(lo) - target;
  const gHi = f(hi) - target;
  if (!Number.isFinite(gLo) || !Number.isFinite(gHi) || gLo * gHi > 0) return NaN;
  if (gLo === 0) return lo;
  if (gHi === 0) return hi;
  for (let i = 0; i < 400; i++) {
    const m = lo + (hi - lo) / 2;
    if (m <= lo || m >= hi) break;                                  // машинная точность достигнута
    const g = f(m) - target;
    if (!Number.isFinite(g)) return NaN;
    if (g === 0) return m;
    if ((g < 0) === (gLo < 0)) { lo = m; gLo = g; } else hi = m;
  }
  return lo + (hi - lo) / 2;
}

/* одна и та же величина, измеренная на двух формах фигуры: расхождение → NaN */
function invariant(v1, v2) {
  if (!Number.isFinite(v1) || !Number.isFinite(v2)) return NaN;
  return Math.abs(v1 - v2) <= 1e-9 * Math.max(1, Math.abs(v1)) ? (v1 + v2) / 2 : NaN;
}

/* ================= построители, общие для решателя и validity ================= */

/* окружность по хорде AB и расстоянию dAB до неё: A(0,0), B(AB,0); центр равноудалён
   от A и B (серединный перпендикуляр) и отстоит от прямой AB на dAB */
function circleByChord(AB, dAB) {
  const A = ORIGIN, B = pt(AB, 0), M = mid(A, B);
  const O = meet(M, add(M, turn90(sub(B, A))), pt(0, dAB), pt(1, dAB));
  return { A, B, O, R: dist(O, A) };
}

/* трапеция ABCD с основаниями BC и AD: B(0,0), BC — по оси x, трапеция ниже BC.
   Луч CD — луч CB (180°), повёрнутый внутрь на угол C; луч BA — луч BC (0°),
   повёрнутый внутрь на угол B. A — пересечение луча BA с прямой AD ∥ BC через D. */
function trapLegFigure(p) {
  const al = +p.al, be = +p.be, CD = +p.CD;
  if (!(al > 0 && al < 180 && be > 0 && be < 180 && CD > 0)) return null;
  const vCD = mul(ray(180 + be), CD);                               // вектор C→D
  const uBA = ray(-al);                                             // направление B→A
  const B = ORIGIN;
  const A = meet(B, add(B, uBA), pt(0, vCD.y), pt(1, vCD.y));       // уровень AD не зависит от длины BC
  if (!A) return null;
  const w = Math.max(A.x - vCD.x, 0) + CD;                          // BC: A левее D, фигура выпуклая
  const C = pt(w, 0), D = add(C, vCD);
  return { A, B, C, D };
}

/* прямоугольный треугольник ABC (∠B = 90°) с катетами LA и LC, высота BH,
   окружность с диаметром BH и её вторые точки P на AB и K на CB */
function rectFigure(LA, LC) {
  const B = ORIGIN, A = pt(0, LA), C = pt(LC, 0);
  const H = foot(B, A, C);
  const O = mid(B, H), r = dist(B, H) / 2;
  return { A, B, C, H, P: otherPoint(B, A, O, r, B), K: otherPoint(B, C, O, r, B) };
}

/* ================= решатель: построить по данным и измерить ================= */

export const solve = {
  /* 1. Высота ромба. D(0,0), C(a,0), a = DH + CH (H между D и C). Вершина A — на
     перпендикуляре к DC в точке H и на окружности (D, a), так как AD = DC.
     B = A + (C − D). Высота = площадь ромба (шнурование) / сторона DC. */
  rhombH(p) {
    const DH = +p.DH, CH = +p.CH, a = DH + CH;
    const D = ORIGIN, C = pt(a, 0), H = pt(DH, 0);
    const A = lineCircle(H, add(H, turn90(sub(C, D))), D, a).find((q) => q.y > 0);
    if (!A) return NaN;
    const B = add(A, sub(C, D));
    return area([A, B, C, D]) / dist(D, C);
  },

  /* 2. Периметр параллелограмма. A(0,0), AD = BC = BK + CK по оси x, угол A задан
     произвольно, AB = x неизвестна. Биссектриса угла A — сумма единичных векторов
     сторон; K — её пересечение с прямой BC. x подбирается, пока BK на чертеже не
     станет как в условии. Периметр — сумма четырёх измеренных сторон.
     Угол A в условии не дан: считаем при 57° и 118°, ответ обязан совпасть. */
  pgramBis(p) {
    const BK = +p.BK, BC = BK + +p.CK;
    const fig = (theta, x) => {
      const A = ORIGIN, D = pt(BC, 0), B = mul(ray(theta), x), C = add(B, sub(D, A));
      const K = meet(A, add(A, add(unit(sub(B, A)), unit(sub(D, A)))), B, C);
      return { A, B, C, D, K };
    };
    const perimeter = (theta) => {
      const bk = (x) => { const f = fig(theta, x); return f.K ? along(f.K, f.B, f.C) * BC : NaN; };
      const x = fit(bk, BK, 1e-9 * BC, 4 * BC + 1);
      if (!Number.isFinite(x)) return NaN;
      const f = fig(theta, x);
      if (!inside(f.K, f.B, f.C)) return NaN;                       // K — на стороне BC
      return dist(f.A, f.B) + dist(f.B, f.C) + dist(f.C, f.D) + dist(f.D, f.A);
    };
    return invariant(perimeter(57), perimeter(118));
  },

  /* 3. Боковая сторона трапеции по отрезкам биссектрис. A(0,0), основание AD по оси x,
     AB = c под углом α, основание BC из B сонаправлено AD. Биссектрисы углов A и B —
     суммы единичных векторов сторон; F — их пересечение. Угол α подбирается по
     отношению AF : BF (от c оно не зависит), затем масштаб — по AF. AB измеряется. */
  trapBis(p) {
    const AF = +p.AF, BF = +p.BF;
    const fig = (alpha, c) => {
      const A = ORIGIN, e = ray(alpha), B = mul(e, c);
      const F = meet(A, add(A, add(e, X)), B, add(B, add(mul(e, -1), X)));
      return { A, B, F };
    };
    const ratio = (alpha) => { const f = fig(alpha, 1); return f.F ? dist(f.A, f.F) / dist(f.B, f.F) : NaN; };
    const alpha = fit(ratio, AF / BF, 1e-4, 180 - 1e-4);
    if (!Number.isFinite(alpha)) return NaN;
    const probe = fig(alpha, 1);
    const f = fig(alpha, AF / dist(probe.A, probe.F));
    if (Math.abs(dist(f.B, f.F) - BF) > 1e-9 * Math.max(1, BF)) return NaN;   // BF тоже как в условии
    return dist(f.A, f.B);
  },

  /* 4. Боковая сторона AB трапеции по углам B, C и стороне CD (см. trapLegFigure).
     Ответ-радикал возвращается десятичной дробью. */
  trapLeg(p) {
    const f = trapLegFigure(p);
    return f ? dist(f.A, f.B) : NaN;
  },

  /* 5. Углы ромба. O(0,0), A(−AC/2, 0), C(AC/2, 0); B(0, q), D(0, −q) — диагонали ромба
     перпендикулярны и делятся точкой O пополам. Полудиагональ q подбирается, пока
     расстояние от O до прямой AB не станет d. Угол при A измеряется; возвращается
     острый угол ромба (второй угол 180° минус он). */
  rhombAng(p) {
    const d = +p.d, AC = +p.D;
    if (!(d > 0 && 2 * d < AC)) return NaN;                         // O удалена от стороны меньше, чем от вершины A
    const O = ORIGIN, A = pt(-AC / 2, 0);
    const dO = (q) => distToLine(O, A, pt(0, q));
    let hi = AC;
    while (dO(hi) < d && hi < 1e12 * AC) hi *= 2;
    const q = fit(dO, d, 1e-12 * AC, hi);
    if (!Number.isFinite(q)) return NaN;
    const angA = angleAt(A, pt(0, q), pt(0, -q));
    return Math.min(angA, 180 - angA);
  },

  /* 6. Отрезок EF ∥ основаниям. A(0,0), D(AD,0), B(u,h), C(u+BC,h). F делит CD так,
     что CF : FD = m : n; E — пересечение прямой AB с прямой через F параллельно AD.
     Сдвиг u и высота h в условии не даны: две разные формы, ответ обязан совпасть. */
  trapEF(p) {
    const AD = +p.AD, BC = +p.BC, m = +p.m, n = +p.n;
    const ef = (u, h) => {
      const A = ORIGIN, D = pt(AD, 0), B = pt(u, h), C = pt(u + BC, h);
      const F = lerp(C, D, m / (m + n));
      const E = meet(A, B, F, add(F, sub(D, A)));
      if (!E || !inside(E, A, B)) return NaN;                       // E — на стороне AB
      return dist(E, F);
    };
    return invariant(ef(0.31 * AD + 1, 0.7 * AD + 2), ef(-0.4 * BC, 0.23 * AD + 5));
  },

  /* 7. Сторона BC по двум углам и радиусу описанной окружности. Пробный треугольник:
     B(0,0), C(1,0), A — пересечение лучей под углами B и C к BC. Центр описанной —
     пересечение серединных перпендикуляров. Растягиваем фигуру, пока радиус не
     станет R, и измеряем BC. Теорема синусов не используется. */
  circR(p) {
    const be = +p.be, ga = +p.ga, R = +p.R;
    const B = ORIGIN, C = pt(1, 0);
    const A = meet(B, add(B, ray(be)), C, add(C, ray(180 - ga)));
    if (!A || !(A.y > 0)) return NaN;
    const O = circumcenter(A, B, C);
    if (!O) return NaN;
    return dist(B, C) * (R / dist(O, A));
  },

  /* 8. Высота к гипотенузе по двум катетам. C(0,0), A(b,0), B(0,a); H — основание
     перпендикуляра из C на AB; измеряется CH. */
  hAB(p) {
    const a = +p.a, b = +p.b;
    const C = ORIGIN, A = pt(b, 0), B = pt(0, a);
    return dist(C, foot(C, A, B));
  },

  /* 9. Высота к гипотенузе по катету и гипотенузе. A(0,0), B(c,0). Вершина прямого
     угла C — на окружности с диаметром AB и на окружности (B, a). Измеряется
     расстояние от C до прямой AB. */
  hAC(p) {
    const a = +p.a, c = +p.c;
    const A = ORIGIN, B = pt(c, 0);
    const C = circleCircle(mid(A, B), c / 2, B, a).find((q) => q.y > 0);
    return C ? distToLine(C, A, B) : NaN;
  },

  /* 10. Катет по проекции. A(0,0), C(AC,0), H(AH,0). Вершина прямого угла B — на
     перпендикуляре к AC в H и на окружности с диаметром AC. Измеряется AB. */
  projAB(p) {
    const AH = +p.AH, AC = +p.AC;
    const A = ORIGIN, C = pt(AC, 0), H = pt(AH, 0);
    const B = lineCircle(H, add(H, pt(0, 1)), mid(A, C), AC / 2).find((q) => q.y > 0);
    return B ? dist(A, B) : NaN;
  },

  /* 11. BN при MN ∥ AC. A(0,0), C(AC,0); N — на луче из C под углом γ к CA, CN = NC;
     M = N − (MN, 0) (MN ∥ AC). B — пересечение прямых AM и CN. Измеряется BN.
     Угол C в условии не дан: γ = 63° и 104°, ответ обязан совпасть. */
  paraBN(p) {
    const MN = +p.MN, AC = +p.AC, NC = +p.NC;
    const bn = (gamma) => {
      const A = ORIGIN, C = pt(AC, 0);
      const N = add(C, mul(ray(180 - gamma), NC));
      const M = sub(N, pt(MN, 0));
      const B = meet(A, M, C, N);
      if (!B || !inside(N, C, B) || !inside(M, A, B)) return NaN;   // M и N — на сторонах
      return dist(B, N);
    };
    return invariant(bn(63), bn(104));
  },

  /* 12. MC в трапеции с основаниями AB и DC. A(0,h), B(AB,h); C — на прямой DC (ось x)
     на расстоянии AC от A; D = C − (DC, 0). M — пересечение диагоналей AC и BD.
     Высота h в условии не дана: h = 0,55·AC и 0,83·AC, ответ обязан совпасть. */
  paraMC(p) {
    const AB = +p.AB, DC = +p.DC, AC = +p.AC;
    const mc = (h) => {
      const A = pt(0, h), B = pt(AB, h);
      const C = lineCircle(ORIGIN, X, A, AC).find((q) => q.x > 0);
      if (!C) return NaN;
      const D = sub(C, pt(DC, 0));
      const M = meet(A, C, B, D);
      if (!M || !inside(M, A, C) || !inside(M, B, D)) return NaN;
      return dist(M, C);
    };
    return invariant(mc(0.55 * AC), mc(0.83 * AC));
  },

  /* 13. Расстояние до хорды CD. Окружность — по хорде AB и расстоянию dAB
     (circleByChord). C — точка окружности, D — вторая точка окружности на
     расстоянии CD от C. Измеряется расстояние от центра до прямой CD.
     Положение хорды свободно: две разные хорды, ответ обязан совпасть. */
  chordDist(p) {
    const { O, R } = circleByChord(+p.AB, +p.dAB), CD = +p.CD;
    const dcd = (phi) => {
      const C = add(O, mul(ray(phi), R));
      const D = circleCircle(O, R, C, CD)[0];
      return D ? distToLine(O, C, D) : NaN;
    };
    return invariant(dcd(200), dcd(311));
  },

  /* 14. Длина хорды CD. Окружность — как в 13. Прямая на расстоянии dCD от центра
     (перпендикулярная направлению ψ) пересекается с окружностью; измеряется CD. */
  chordLen(p) {
    const { O, R } = circleByChord(+p.AB, +p.dAB), dCD = +p.dCD;
    const cd = (psi) => {
      const n = ray(psi), Q = add(O, mul(n, dCD));
      const s = lineCircle(Q, add(Q, turn90(n)), O, R);
      return s.length ? dist(s[0], s[1]) : NaN;
    };
    return invariant(cd(35), cd(250));
  },

  /* 15. KP, окружность через B и C, дано AK и AC = k·BC. Пробный треугольник:
     C(0,0), B(1,0), A = k·(cos γ, sin γ). K — точка стороны AB; окружность через B, C, K
     (центр — пересечение серединных перпендикуляров); P — её вторая точка на прямой AC.
     K сдвигается к A, пока P не окажется на стороне AC. Фигура растягивается до
     данного AK. Форма треугольника и окружность свободны: γ = 67° и 38°. */
  secKP1(p) {
    const AK = +p.AK, k = +p.k;
    const kp = (gamma) => {
      const C = ORIGIN, B = pt(1, 0), A = mul(ray(gamma), k);
      for (let t = 0.5; t > 1e-6; t /= 2) {
        const K = lerp(A, B, t);
        const O = circumcenter(B, C, K);
        if (!O) continue;
        const P = otherPoint(A, C, O, dist(O, C), C);
        if (P && inside(P, A, C)) return dist(K, P) * (AK / dist(A, K));
      }
      return NaN;
    };
    return invariant(kp(67), kp(38));
  },

  /* 16. KP, окружность через B и C, дано AP и AB = m·BC. Пробный треугольник:
     C(0,0), B(1,0), A = B + m·(направление под углом β к BC). P — точка стороны AC;
     окружность через B, C, P; K — её вторая точка на прямой AB (на стороне AB).
     Растяжение до данного AP. Свободная форма: β = 71° и 115°. */
  secKP2(p) {
    const AP = +p.AP, m = +p.m;
    const kp = (beta) => {
      const C = ORIGIN, B = pt(1, 0), A = add(B, mul(ray(180 - beta), m));
      for (let t = 0.5; t > 1e-6; t /= 2) {
        const P = lerp(A, C, t);
        const O = circumcenter(B, C, P);
        if (!O) continue;
        const K = otherPoint(A, B, O, dist(O, B), B);
        if (K && inside(K, A, B)) return dist(K, P) * (AP / dist(A, P));
      }
      return NaN;
    };
    return invariant(kp(71), kp(115));
  },

  /* 17. PK по высоте BH (rectFigure): измеряем PK и растягиваем фигуру до данной BH.
     Катеты в условии не даны: две разные формы треугольника. */
  rectPK(p) {
    const BH = +p.BH;
    const pk = (LA, LC) => {
      const f = rectFigure(LA, LC);
      return f.P && f.K ? dist(f.P, f.K) * (BH / dist(f.B, f.H)) : NaN;
    };
    return invariant(pk(3, 4.7), pk(5, 1.3));
  },

  /* 18. BH по отрезку PK — та же фигура, растяжение до данного PK. */
  rectBH(p) {
    const PK = +p.PK;
    const bh = (LA, LC) => {
      const f = rectFigure(LA, LC);
      return f.P && f.K ? dist(f.B, f.H) * (PK / dist(f.P, f.K)) : NaN;
    };
    return invariant(bh(3, 4.7), bh(5, 1.3));
  },

  /* 19. AC по диаметру и касательной AB. O(0,0), r = D/2, C(r,0) — окружность проходит
     через C, центр на стороне AC, значит A(−x, 0) по другую сторону от O. Точка
     касания B — пересечение окружности с окружностью на AO как на диаметре
     (∠OBA = 90°). x подбирается, пока AB на чертеже не станет как в условии;
     измеряется AC. */
  tanSecAC(p) {
    const r = +p.D / 2, AB = +p.AB;
    const fig = (x) => {
      const O = ORIGIN, C = pt(r, 0), A = pt(-x, 0);
      const B = circleCircle(O, r, mid(A, O), x / 2).find((q) => q.y > 0);
      return { A, B, C };
    };
    const ab = (x) => { const f = fig(x); return f.B ? dist(f.A, f.B) : NaN; };
    const x = fit(ab, AB, r * (1 + 1e-9), r + AB + 1);
    if (!Number.isFinite(x)) return NaN;
    const f = fig(x);
    return dist(f.A, f.C);
  },

  /* 20. Диаметр по касательной AB и стороне AC. A(0,0), C(AC,0), центр O(AC − r, 0) на
     стороне AC, окружность проходит через C. Точка касания B — как в 19. Радиус r
     подбирается по длине AB; диаметр измеряется как хорда NC на прямой AC. */
  tanSecD(p) {
    const AB = +p.AB, AC = +p.AC;
    const fig = (r) => {
      const A = ORIGIN, C = pt(AC, 0), O = pt(AC - r, 0);
      const B = circleCircle(O, r, mid(A, O), dist(A, O) / 2).find((q) => q.y > 0);
      return { A, B, C, O };
    };
    const ab = (r) => { const f = fig(r); return f.B ? dist(f.A, f.B) : NaN; };
    const r = fit(ab, AB, 1e-12 * AC, (AC / 2) * (1 - 1e-12));
    if (!Number.isFinite(r)) return NaN;
    const f = fig(r);
    const N = otherPoint(f.A, f.C, f.O, r, f.C);
    return N ? dist(N, f.C) : NaN;
  },
};

/* ================= существование фигуры ================= */

/*
  '' — фигура с данными p существует и она того вида, что назван в условии
  (трапеция — не параллелограмм, точка — на стороне, а не на продолжении);
  иначе короткая причина по-русски.
*/
export function validity(k, p) {
  if (!p || typeof p !== 'object') return 'нет данных задачи';
  const v = (name) => Number(p[name]);
  const need = (...names) => {
    for (const nm of names) if (!(Number.isFinite(v(nm)) && v(nm) > 0)) return `${nm} должно быть положительным числом`;
    return '';
  };
  const nonNeg = (...names) => {
    for (const nm of names) if (!(Number.isFinite(v(nm)) && v(nm) >= 0)) return `${nm} должно быть неотрицательным числом`;
    return '';
  };
  let r;
  switch (k) {
    case 'rhombH':
      return need('DH', 'CH');                                     // H строго внутри DC, иначе ромб вырожден
    case 'pgramBis':
      return need('BK', 'CK');
    case 'trapBis':
      return need('AF', 'BF');
    case 'trapLeg': {
      if ((r = need('al', 'be', 'CD'))) return r;
      if (v('al') >= 180 || v('be') >= 180) return 'угол трапеции должен быть меньше 180°';
      const f = trapLegFigure(p);                                  // тот же чертёж, что у решателя
      if (!f) return 'трапеция не строится';
      if (Math.abs(cross(unit(sub(f.B, f.A)), unit(sub(f.D, f.C)))) < 1e-9) {
        return `∠B + ∠C = ${v('al') + v('be')}°: боковые стороны AB и CD параллельны — это параллелограмм, а не трапеция`;
      }
      return '';
    }
    case 'rhombAng':
      if ((r = need('d', 'D'))) return r;
      if (2 * v('d') >= v('D')) return 'расстояние от центра до стороны должно быть меньше половины диагонали';
      return '';
    case 'trapEF':
      if ((r = need('AD', 'BC', 'm', 'n'))) return r;
      if (v('AD') === v('BC')) return 'основания равны — это параллелограмм, а не трапеция';
      return '';
    case 'circR':
      if ((r = need('be', 'ga', 'R'))) return r;
      if (v('be') + v('ga') >= 180) return 'сумма двух углов треугольника должна быть меньше 180°';
      return '';
    case 'hAB':
      return need('a', 'b');
    case 'hAC':
      if ((r = need('a', 'c'))) return r;
      if (v('a') >= v('c')) return 'катет должен быть меньше гипотенузы';
      return '';
    case 'projAB':
      if ((r = need('AH', 'AC'))) return r;
      if (v('AH') >= v('AC')) return 'отрезок AH должен быть меньше гипотенузы AC';
      return '';
    case 'paraBN':
      if ((r = need('MN', 'AC', 'NC'))) return r;
      if (v('MN') >= v('AC')) return 'отрезок MN ∥ AC внутри треугольника должен быть короче AC';
      return '';
    case 'paraMC':
      if ((r = need('AB', 'DC', 'AC'))) return r;
      if (v('AB') === v('DC')) return 'основания равны — это параллелограмм, а не трапеция';
      return '';
    case 'chordDist': {
      if ((r = need('AB', 'CD') || nonNeg('dAB'))) return r;
      const R = circleByChord(v('AB'), v('dAB')).R;
      if (v('CD') > 2 * R * (1 + 1e-12)) return `хорда CD = ${v('CD')} длиннее диаметра ${+(2 * R).toFixed(6)}`;
      return '';
    }
    case 'chordLen': {
      if ((r = need('AB') || nonNeg('dAB', 'dCD'))) return r;
      const R = circleByChord(v('AB'), v('dAB')).R;
      if (v('dCD') >= R) return `хорда CD удалена от центра на ${v('dCD')}, а радиус ${+R.toFixed(6)} — такой хорды нет`;
      return '';
    }
    case 'secKP1':
      return need('AK', 'k');
    case 'secKP2':
      return need('AP', 'm');
    case 'rectPK':
      return need('BH');
    case 'rectBH':
      return need('PK');
    case 'tanSecAC':
      return need('D', 'AB');
    case 'tanSecD':
      if ((r = need('AB', 'AC'))) return r;
      if (v('AB') >= v('AC')) return 'касательная AB должна быть короче AC, иначе A не лежит вне окружности';
      return '';
    default:
      return `неизвестный подтип «${k}»`;
  }
}
