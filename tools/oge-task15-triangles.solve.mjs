/*
  Независимый решатель задания 15 ОГЭ (треугольники) для внешнего гейта
  тренажёра trainers/oge-task15-triangles.html.

  Канон проекта: каждый ответ пересчитывается «другим кодом, не тем
  выражением, из которого ответ получен». Решатель не видит параметров
  генератора и формул тренажёра: он читает ЧИСЛА ИЗ ТЕКСТА условия (как
  ученик), строит треугольник в координатах по определяющим свойствам
  (равные отрезки, биссектриса как направление суммы единичных векторов,
  высота как основание перпендикуляра, прямой угол, окружности через
  серединные перпендикуляры и взвешенный центр вписанной) и ИЗМЕРЯЕТ
  искомую величину: угол — через atan2, длину — через Math.hypot, площадь —
  формулой шнурования. Если построение по данным задачи определено не
  напрямую (угол по условию «AK = KC», катет по гипотенузе, сторона
  правильного треугольника по радиусу), свободный параметр подбирается
  бисекцией по измеряемой величине.

  Экспорт:
    plainText(html)   — текст условия без разметки (дроби «p/q», индексы, степени);
    solve(k, html)    — { ans, pts }: измеренный ответ и построенные точки
                        (A, B, C и вспомогательные) в математических координатах;
                        ans = NaN, если условие не прочитано или фигура невозможна;
    shapeFixed(k, t)  — определена ли форма треугольника ABC условием
                        (для сверки чертежа по углам).
  Модуль самодостаточен: только Math.
*/

/* ---------- векторы ---------- */
const V = (x, y) => ({ x, y });
const add = (a, b) => V(a.x + b.x, a.y + b.y);
const sub = (a, b) => V(a.x - b.x, a.y - b.y);
const mul = (a, t) => V(a.x * t, a.y * t);
const len = (a) => Math.hypot(a.x, a.y);
const dist = (a, b) => len(sub(a, b));
const unit = (a) => mul(a, 1 / len(a));
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const dir = (d) => V(Math.cos(rad(d)), Math.sin(rad(d)));
/* неориентированный угол при вершине O между лучами на P и Q, градусы */
export function angle(O, P, Q) {
  const u = sub(P, O), v = sub(Q, O);
  return deg(Math.atan2(Math.abs(u.x * v.y - u.y * v.x), u.x * v.x + u.y * v.y));
}
/* пересечение прямых P + t·u и Q + s·v */
function meet(P, u, Q, v) {
  const d = u.x * v.y - u.y * v.x;
  if (Math.abs(d) < 1e-12 * len(u) * len(v)) return V(NaN, NaN);
  const t = ((Q.x - P.x) * v.y - (Q.y - P.y) * v.x) / d;
  return add(P, mul(u, t));
}
/* основание перпендикуляра из P на прямую AB */
function footOf(P, A, B) {
  const u = sub(B, A), t = ((P.x - A.x) * u.x + (P.y - A.y) * u.y) / (u.x * u.x + u.y * u.y);
  return add(A, mul(u, t));
}
const distLine = (P, A, B) => dist(P, footOf(P, A, B));
/* площадь многоугольника по формуле шнурования */
function shoelace(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a.x * b.y - a.y * b.x; }
  return Math.abs(s) / 2;
}
/* точка пересечения биссектрисы угла при V (направление — сумма единичных векторов) с прямой PQ */
function bisectorFoot(Vx, P, Q) {
  const d = add(unit(sub(P, Vx)), unit(sub(Q, Vx)));
  return meet(Vx, d, P, sub(Q, P));
}
/* центр описанной окружности — пересечение серединных перпендикуляров */
function circumcenter(A, B, C) {
  const m1 = mul(add(A, B), 0.5), m2 = mul(add(B, C), 0.5);
  const p1 = V(-(B.y - A.y), B.x - A.x), p2 = V(-(C.y - B.y), C.x - B.x);
  return meet(m1, p1, m2, p2);
}
/* центр вписанной окружности — среднее вершин с весами противолежащих сторон */
function incenter(A, B, C) {
  const a = dist(B, C), b = dist(A, C), c = dist(A, B), s = a + b + c;
  return V((a * A.x + b * B.x + c * C.x) / s, (a * A.y + b * B.y + c * C.y) / s);
}
/* поворот точки P вокруг O на угол d (градусы) */
function rot(P, O, d) {
  const c = Math.cos(rad(d)), s = Math.sin(rad(d)), u = sub(P, O);
  return add(O, V(u.x * c - u.y * s, u.x * s + u.y * c));
}
/* бисекция: x на [lo, hi] с f(x) = target (f монотонна на отрезке) */
function solveFor(f, target, lo, hi) {
  let a = lo, b = hi, fa = f(a) - target, fb = f(b) - target;
  if (!(isFinite(fa) && isFinite(fb)) || fa * fb > 0) return NaN;
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2, fm = f(m) - target;
    if (!isFinite(fm)) return NaN;
    if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; }
  }
  return (a + b) / 2;
}
/* треугольник с основанием P0P1 на оси x: угол a при P0, угол b при P1, третья вершина сверху */
function byTwoAngles(a, b, base = 1) {
  const P0 = V(0, 0), P1 = V(base, 0);
  return [P0, P1, meet(P0, dir(a), P1, dir(180 - b))];
}
/* прямоугольный треугольник с прямым углом C(0; 0), A на оси x, B на оси y */
const rightTri = (ac, bc) => ({ C: V(0, 0), A: V(ac, 0), B: V(0, bc) });

/* ---------- текст условия ---------- */
export function plainText(html) {
  return String(html)
    .replace(/<span class="frac"><span class="fn">([^<]*)<\/span><span class="fd">([^<]*)<\/span><\/span>/g, '$1/$2')
    .replace(/<sub>([^<]*)<\/sub>/g, '$1').replace(/<sup>2<\/sup>/g, '²')
    .replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
/* число из записи условия: «12», «2,5», «6√2», «√3», «56,25√3», «5/13» */
function num(s) {
  s = String(s).trim().replace(/−/g, '-').replace(/,/g, '.');
  let m = /^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(s);
  if (m) return +m[1] / +m[2];
  m = /^(\d+(?:\.\d+)?)?√(\d+)$/.exec(s);
  if (m) return (m[1] ? +m[1] : 1) * Math.sqrt(+m[2]);
  return /^-?\d+(?:\.\d+)?$/.test(s) ? +s : NaN;
}
const NUM = '(\\d+\\/\\d+|\\d+(?:,\\d+)?(?:√\\d+)?|√\\d+)';
/* первое совпадение шаблона (строка с NUM) — число, иначе NaN */
function grab(t, re) {
  const m = new RegExp(re.replace(/NUM/g, NUM)).exec(t);
  return m ? num(m[1]) : NaN;
}
function asks(t) { const m = /Найдите ([^.]*)\./.exec(t); return m ? m[1] : ''; }

/* ---------- решатели по типам ---------- */
const S = {};
S.angSum = (t) => {
  const a = grab(t, '[Уу]гол A (?:треугольника ABC )?равен NUM°'), b = grab(t, 'угол B равен NUM°');
  const [A, B, C] = byTwoAngles(a, b);
  return { ans: angle(C, A, B), pts: { A, B, C } };
};
S.extAng = (t) => {
  const a = grab(t, 'Угол A треугольника ABC равен NUM°') || grab(t, 'угол A равен NUM°');
  const build = (b) => { const [A, B, C] = byTwoAngles(a, b); return { A, B, C, D: add(C, sub(C, A)) }; };
  if (/Найдите угол BCD/.test(t)) {
    const b = grab(t, 'угол B равен NUM°'), P = build(b);
    return { ans: angle(P.C, P.B, P.D), pts: P };
  }
  const e = grab(t, 'угол BCD (?:оказался )?равен NUM°');
  const x = solveFor((b) => { const P = build(b); return angle(P.C, P.B, P.D); }, e, 0.01, 179.99 - a);
  const P = build(x);
  return { ans: angle(P.B, P.A, P.C), pts: P };
};
/* равнобедренный треугольник AB = BC с углом x при вершине B */
const isoApexTri = (x) => ({ B: V(0, 0), A: dir(-90 - x / 2), C: dir(-90 + x / 2) });
S.isoBase = (t) => {
  const b = grab(t, 'угол (?:B|ABC) равен NUM°'), P = isoApexTri(b);
  return { ans: /Найдите угол (?:C|BCA)/.test(t) ? angle(P.C, P.A, P.B) : angle(P.A, P.B, P.C), pts: P };
};
S.isoApex = (t) => {
  const a = grab(t, 'угол A равен NUM°') || grab(t, 'основании AC равнобедренного треугольника ABC равен NUM°');
  const x = solveFor((x) => { const P = isoApexTri(x); return angle(P.A, P.B, P.C); }, a, 0.01, 179.99);
  const P = isoApexTri(x);
  return { ans: angle(P.B, P.A, P.C), pts: P };
};
S.bisIso = (t) => {
  const L = (/(?:Отрезок|луч) A([A-Z])/.exec(t) || [])[1];
  if (!L || !new RegExp('A' + L + ' = (?:' + L + 'C|C' + L + ')').test(t)) return { ans: NaN, pts: {} };
  /* A(0;0), C(1;0); угол при C — c, при A — x; L — на BC по биссектрисе из A */
  const build = (x, c) => { const A = V(0, 0), C = V(1, 0), B = meet(A, dir(x), C, dir(180 - c)); return { A, B, C, [L]: bisectorFoot(A, B, C) }; };
  const gap = (P) => dist(P.A, P[L]) - dist(P[L], P.C);
  if (/Найдите угол ABC/.test(t)) {
    const c = grab(t, 'Угол ACB равен NUM°');
    const x = solveFor((x) => gap(build(x, c)), 0, 0.5, 179.5 - c);
    const P = build(x, c);
    return { ans: angle(P.B, P.A, P.C), pts: P };
  }
  /* дан угол B: B(0;0), C(1;0), угол при B — β, при C — y */
  const beta = grab(t, 'Угол ABC равен NUM°');
  const b2 = (y) => { const B = V(0, 0), C = V(1, 0), A = meet(B, dir(beta), C, dir(180 - y)); return { A, B, C, [L]: bisectorFoot(A, B, C) }; };
  const y = solveFor((y) => gap(b2(y)), 0, 0.5, 179.5 - beta);
  const P = b2(y);
  return { ans: angle(P.C, P.A, P.B), pts: P };
};
S.bisExt = (t) => {
  const a = grab(t, 'угол BAC равен NUM°'), c = grab(t, 'угол ACB равен NUM°');
  const [A, C, B] = byTwoAngles(a, c), D = bisectorFoot(A, B, C);
  return { ans: /Найдите угол ADB/.test(t) ? angle(D, A, B) : angle(D, A, C), pts: { A, B, C, D } };
};
S.twoExt = (t) => {
  let e1, e2, m = /Внешние углы треугольника ABC при вершинах A и B равны NUM° и NUM°/.source.replace(/NUM/g, NUM);
  const mm = new RegExp(m).exec(t);
  if (mm) { e1 = num(mm[1]); e2 = num(mm[2]); }
  else { e1 = grab(t, 'при вершине A равен NUM°'); e2 = grab(t, 'внешний угол при вершине B равен NUM°'); }
  /* внешний угол при вершине P0 треугольника с углами x при P0 и y при P1 — между P0P1 и продолжением P2P0 */
  const extAt0 = (x, y) => { const [P0, P1, P2] = byTwoAngles(x, y); return angle(P0, P1, add(P0, sub(P0, P2))); };
  const x = solveFor((x) => extAt0(x, 1), e1, 0.01, 178.9);
  const y = solveFor((y) => extAt0(y, 1), e2, 0.01, 178.9);
  const [A, B, C] = byTwoAngles(x, y);
  const ans = /внешн\S* угл\S* при вершине C/.test(t) ? angle(C, B, add(C, sub(C, A))) : angle(C, A, B);
  return { ans, pts: { A, B, C } };
};
S.bisAlt = (t) => {
  const a = grab(t, 'угол A равен NUM°'), c = grab(t, 'угол C равен NUM°');
  const [A, C, B] = byTwoAngles(a, c), H = footOf(B, A, C), D = bisectorFoot(B, A, C);
  return { ans: angle(B, D, H), pts: { A, B, C, H, D } };
};
S.altAlt = (t) => {
  let A, B, C;
  if (/угол A равен/.test(t)) { [A, B, C] = byTwoAngles(grab(t, 'угол A равен NUM°'), grab(t, 'угол B равен NUM°')); }
  else { const g = grab(t, 'угол C равен NUM°'); C = V(0, 0); A = dir(90 - g / 2); B = dir(90 + g / 2); }
  const A1 = footOf(A, B, C), B1 = footOf(B, A, C), H = meet(A, sub(A1, A), B, sub(B1, B));
  if (!(angle(A, B, C) < 90 && angle(B, A, C) < 90 && angle(C, A, B) < 90)) return { ans: NaN, pts: {} };
  return { ans: angle(H, A, B), pts: { A, B, C, A1, B1, H } };
};
S.rtAcute = (t) => {
  if (!/прямым углом C|угол C прямой/.test(t)) return { ans: NaN, pts: {} };
  const a = grab(t, 'угол A равен NUM°');
  const bc = solveFor((y) => { const P = rightTri(1, y); return angle(P.A, P.B, P.C); }, a, 1e-6, 1e6);
  const P = rightTri(1, bc), H = footOf(P.C, P.A, P.B);
  const q = asks(t);
  const ans = /BCH/.test(q) ? angle(P.C, P.B, H) : /ACH/.test(q) ? angle(P.C, P.A, H) : angle(P.B, P.A, P.C);
  return { ans, pts: { ...P, H } };
};
/* прямоугольный треугольник (C — прямой) с заданным значением f(угол A) */
function rtByTrig(f, v) {
  const y = solveFor((y) => f(rad(angle(V(1, 0), V(0, y), V(0, 0)))), v, 1e-7, 1e7);
  return rightTri(1, y);
}
function scaleTo(P, a, b, want) { const k = want / dist(P[a], P[b]); const Q = {}; for (const n in P) Q[n] = mul(P[n], k); return Q; }
const TRIG = { sin: Math.sin, cos: Math.cos, tg: Math.tan };
function rtLeg(t, fn) {
  if (!/угол C прямой/.test(t)) return { ans: NaN, pts: {} };
  const v = grab(t, (fn === 'tg' ? 'tg' : fn) + ' A = NUM');
  let P = rtByTrig(TRIG[fn], v);
  const given = /гипотенуза AB равна/.test(t) ? ['A', 'B', grab(t, 'гипотенуза AB равна NUM')]
    : /катет BC равен/.test(t) ? ['B', 'C', grab(t, 'катет BC равен NUM')] : ['A', 'C', grab(t, 'катет AC равен NUM')];
  P = scaleTo(P, given[0], given[1], given[2]);
  const q = asks(t), target = /AB/.test(q) ? ['A', 'B'] : /BC/.test(q) ? ['B', 'C'] : ['A', 'C'];
  return { ans: dist(P[target[0]], P[target[1]]), pts: P };
}
S.rtLegSin = (t) => rtLeg(t, 'sin');
S.rtLegCos = (t) => rtLeg(t, 'cos');
S.rtLegTan = (t) => rtLeg(t, 'tg');
/* прямоугольный треугольник по двум сторонам из условия: катеты AC, BC и гипотенуза AB */
function rtBySides(t) {
  const L = {};
  for (const n of ['AC', 'BC', 'AB']) { const v = grab(t, n + ' = NUM'); if (isFinite(v)) L[n] = v; }
  if (isFinite(L.AC) && isFinite(L.BC)) return rightTri(L.AC, L.BC);
  if (isFinite(L.AB) && isFinite(L.AC)) return rightTri(L.AC, solveFor((y) => dist(V(L.AC, 0), V(0, y)), L.AB, 0, L.AB));
  if (isFinite(L.AB) && isFinite(L.BC)) return rightTri(solveFor((x) => dist(V(x, 0), V(0, L.BC)), L.AB, 0, L.AB), L.BC);
  return null;
}
S.rtTrig = (t) => {
  if (!/угол C прямой/.test(t)) return { ans: NaN, pts: {} };
  const q = asks(t), fn = /^(?:sin|синус)/.test(q) ? 'sin' : /^(?:cos|косинус)/.test(q) ? 'cos' : 'tg';
  let P;
  if (/sin A = /.test(t)) P = rtByTrig(Math.sin, grab(t, 'sin A = NUM'));
  else P = rtBySides(t);
  if (!P) return { ans: NaN, pts: {} };
  return { ans: TRIG[fn](rad(angle(P.A, P.B, P.C))), pts: P };
};
S.pythLeg = (t) => {
  const c = grab(t, 'гипотенуза AB равна NUM') || grab(t, 'Гипотенуза AB прямоугольного треугольника ABC равна NUM');
  const giv = /катет AC равен/.test(t) ? 'AC' : 'BC', a = grab(t, 'катет ' + giv + ' равен NUM');
  const other = solveFor((y) => Math.hypot(a, y), c, 0, c);
  const P = giv === 'AC' ? rightTri(a, other) : rightTri(other, a);
  const q = asks(t), target = /BC/.test(q) ? ['B', 'C'] : ['A', 'C'];
  return { ans: dist(P[target[0]], P[target[1]]), pts: P };
};
S.pythHyp = (t) => {
  const P = rightTri(grab(t, 'AC = NUM'), grab(t, 'BC = NUM'));
  return { ans: dist(P.A, P.B), pts: P };
};
S.rtAltitude = (t) => {
  if (/делит гипотенузу на отрезки/.test(t)) {
    const p = grab(t, 'AH = NUM'), q = grab(t, 'BH = NUM');
    const A = V(0, 0), B = V(p + q, 0), H = V(p, 0);
    const h = solveFor((y) => angle(V(p, y), A, B), 90, 1e-6, 1e6);
    const C = V(p, h);
    return { ans: dist(C, H), pts: { A, B, C, H } };
  }
  const P = rightTri(grab(t, 'AC = NUM'), grab(t, 'BC = NUM')), H = footOf(P.C, P.A, P.B);
  return { ans: /отрезок AH/.test(asks(t)) ? dist(P.A, H) : dist(P.C, H), pts: { ...P, H } };
};
S.areaBH = (t) => {
  const ac = grab(t, 'сторона AC равна NUM'), A = V(0, 0), C = V(ac, 0);
  if (/Найдите площадь/.test(t)) {
    const ab = grab(t, 'сторона AB равна NUM'), h = grab(t, 'равна NUM\\. Найдите площадь');
    const x = solveFor((x) => Math.hypot(x, h), ab, 0, ab), B = V(x, h);
    return { ans: shoelace([A, B, C]), pts: { A, B, C, H: V(x, 0) } };
  }
  const s = grab(t, 'Площадь треугольника ABC равна NUM');
  const y = solveFor((y) => shoelace([A, V(ac / 3, y), C]), s, 0, 1e6), B = V(ac / 3, y);
  return { ans: distLine(B, A, C), pts: { A, B, C, H: footOf(B, A, C) } };
};
S.areaSin = (t) => {
  const ab = grab(t, 'сторона AB равна NUM'), ac = grab(t, 'сторона AC равна NUM'), g = grab(t, 'угол A между ними равен NUM°');
  const A = V(0, 0), C = V(ac, 0), B = mul(dir(g), ab);
  return { ans: shoelace([A, B, C]), pts: { A, B, C } };
};
/* треугольник по трём сторонам: A(0;0), C(AC;0), B — поворотом луча до |BC| = BC */
function bySides(ab, bc, ac) {
  const A = V(0, 0), C = V(ac, 0);
  const th = solveFor((th) => dist(mul(dir(th), ab), C), bc, 0, 180);
  return { A, B: mul(dir(th), ab), C };
}
S.midline = (t) => {
  const P = bySides(grab(t, 'AB = NUM'), grab(t, 'BC = NUM'), grab(t, 'AC = NUM'));
  const M = mul(add(P.A, P.B), 0.5), N = mul(add(P.B, P.C), 0.5);
  const ans = /периметр/.test(asks(t)) ? dist(M, P.B) + dist(P.B, N) + dist(N, M) : dist(M, N);
  return { ans, pts: { ...P, M, N } };
};
S.medianRt = (t) => {
  if (!/прямым углом C|прямоугольного треугольника ABC/.test(t)) return { ans: NaN, pts: {} };
  const P = rtBySides(t.replace(/Гипотенуза AB прямоугольного треугольника ABC равна (\S+),/, 'AB = $1,').replace(/катет AC равен/, 'AC ='));
  if (!P) return { ans: NaN, pts: {} };
  const M = mul(add(P.A, P.B), 0.5);
  return { ans: dist(P.C, M), pts: { ...P, M } };
};
/* правильный треугольник со стороной s: A(0;0), C(s;0), B — поворот C вокруг A на 60° */
function eqTri(s) { const A = V(0, 0), C = V(s, 0); return { A, C, B: rot(C, A, 60) }; }
const eqR = (P) => dist(circumcenter(P.A, P.B, P.C), P.A);
const eqr = (P) => distLine(incenter(P.A, P.B, P.C), P.A, P.C);
const eqH = (P) => distLine(P.B, P.A, P.C);
/* сторона правильного треугольника по данному условию (сторона, высота, R, r или площадь) */
function eqSide(t) {
  let v;
  if (isFinite(v = grab(t, '(?:Сторона правильного треугольника ABC равна|со стороной|имеет сторону) NUM'))) return v;
  if (isFinite(v = grab(t, '(?:Высота правильного треугольника ABC равна|высота которого равна) NUM'))) return solveFor((s) => eqH(eqTri(s)), v, 1e-6, 1e4);
  if (isFinite(v = grab(t, '(?:Радиус окружности, описанной около правильного треугольника ABC, равен|описана окружность радиуса) NUM'))) return solveFor((s) => eqR(eqTri(s)), v, 1e-6, 1e4);
  if (isFinite(v = grab(t, '(?:Радиус окружности, вписанной в правильный треугольник ABC, равен|вписана окружность радиуса) NUM'))) return solveFor((s) => eqr(eqTri(s)), v, 1e-6, 1e4);
  if (isFinite(v = grab(t, '(?:Площадь правильного треугольника ABC равна|имеет площадь) NUM'))) return solveFor((s) => { const P = eqTri(s); return shoelace([P.A, P.B, P.C]); }, v, 1e-6, 1e4);
  return NaN;
}
function eqSolve(t, what) {
  const s = eqSide(t);
  if (!isFinite(s)) return { ans: NaN, pts: {} };
  const P = eqTri(s), O = circumcenter(P.A, P.B, P.C);
  const ans = what === 'R' ? eqR(P) : what === 'r' ? eqr(P) : what === 'h' ? eqH(P) : what === 'P' ? 3 * dist(P.A, P.C) : dist(P.A, P.C);
  return { ans, pts: { ...P, O, H: footOf(P.B, P.A, P.C) } };
}
S.regR = (t) => eqSolve(t, 'R');
S.regr = (t) => eqSolve(t, 'r');
S.regH = (t) => eqSolve(t, 'h');
S.regArea = (t) => eqSolve(t, /периметр/.test(t) ? 'P' : 'a');
S.isoLeg = (t) => {
  if (/Периметр/.test(t)) {
    const Pm = grab(t, 'основанием AC равен NUM'), a = grab(t, 'основание AC равно NUM');
    const A = V(0, 0), C = V(a, 0), x = solveFor((x) => dist(V(x, 1), A) - dist(V(x, 1), C), 0, 0, a);
    const y = solveFor((y) => 2 * dist(V(x, y), A) + a, Pm, 0, 1e5), B = V(x, y);
    return { ans: dist(A, B), pts: { A, B, C } };
  }
  const b = grab(t, 'основанием AC = NUM'), h = grab(t, 'к основанию, равна NUM');
  const A = V(0, 0), C = V(b, 0), x = solveFor((x) => dist(V(x, h), A) - dist(V(x, h), C), 0, 0, b), B = V(x, h);
  return { ans: dist(A, B), pts: { A, B, C, H: V(x, 0) } };
};

export function solve(k, html) {
  const t = plainText(html);
  if (!S[k]) return { ans: NaN, pts: {} };
  try { return S[k](t); } catch (e) { return { ans: NaN, pts: {}, err: e.message }; }
}
/* форма треугольника ABC определена условием (кроме задач, где дан только один угол или площадь) */
export function shapeFixed(k, html) {
  const t = plainText(html);
  if (k === 'altAlt' && !/угол A равен/.test(t)) return false;
  if (k === 'areaBH' && !/Найдите площадь/.test(t)) return false;
  return true;
}
export const TYPES = Object.keys(S);
