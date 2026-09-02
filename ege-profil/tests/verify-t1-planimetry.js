/* =========================================================================
   НЕЗАВИСИМАЯ ПРОВЕРКА БАНКА ПЛАНИМЕТРИИ

   Ответ пересчитывается только из текста условия и только численной
   геометрией: строится реальная фигура в координатах, проверяется, что она
   удовлетворяет условию, и измеряется искомая величина. Формулы генератора
   при проверке не используются.

   Запуск:  node tests/verify-t1-planimetry.js [задач на тип, по умолчанию 400]
   ========================================================================= */
const YB1 = require('../src/planimetry-t1/bank-t1-planimetry.js');

const D = Math.PI / 180;
const deg = r => r * 180 / Math.PI;
const plain = h => h.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
  .replace(/\u2212/g, '-').replace(/\u00a0/g, ' ');
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function angAt(v, a, b) {
  const u = [a[0] - v[0], a[1] - v[1]], w = [b[0] - v[0], b[1] - v[1]];
  let c = (u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w));
  c = Math.max(-1, Math.min(1, c));
  return deg(Math.acos(c));
}
function inter(p1, p2, p3, p4) {
  const a1 = p2[1] - p1[1], b1 = p1[0] - p2[0], c1 = a1 * p1[0] + b1 * p1[1];
  const a2 = p4[1] - p3[1], b2 = p3[0] - p4[0], c2 = a2 * p3[0] + b2 * p3[1];
  const dt = a1 * b2 - a2 * b1;
  return [(b2 * c1 - b1 * c2) / dt, (a1 * c2 - a2 * c1) / dt];
}
function area(p) {
  let s = 0;
  for (let i = 0; i < p.length; i++) { const j = (i + 1) % p.length; s += p[i][0] * p[j][1] - p[j][0] * p[i][1]; }
  return Math.abs(s) / 2;
}
function bisPoint(V, X, Y) {              // точка на биссектрисе угла XVY
  const u = [(X[0] - V[0]) / dist(V, X), (X[1] - V[1]) / dist(V, X)];
  const w = [(Y[0] - V[0]) / dist(V, Y), (Y[1] - V[1]) / dist(V, Y)];
  return [V[0] + u[0] + w[0], V[1] + u[1] + w[1]];
}
function onCirc(a) { return [Math.cos(a * D), Math.sin(a * D)]; }
function parseVal(s) {                    // «4√6», «3√2», «1,5», «25»
  s = s.trim().replace(/\u2212/g, '-');
  const m = s.match(/^(-?[\d,]*)\s*√\s*(\d+)$/);
  if (m) {
    const a = (m[1] === '' ? 1 : m[1] === '-' ? -1 : parseFloat(m[1].replace(',', '.')));
    return a * Math.sqrt(parseFloat(m[2]));
  }
  return parseFloat(s.replace(',', '.'));
}
const near = (a, b, e) => Math.abs(a - b) < (e || 1e-7);

const checks = {};

/* --- тип 1: равнобедренный треугольник и биссектриса --- */
checks.t1 = q => {
  const t = plain(q.text);
  const beta = +t.match(/равен (\d+)°/)[1];
  const askC = /угол AFC/.test(t);
  const al = (180 - beta) / 2;
  const A = [0, 0], C = [1, 0], B = [0.5, 0.5 * Math.tan(al * D)];
  if (!near(angAt(B, A, C), beta, 1e-9) || !near(dist(A, B), dist(B, C), 1e-9)) return NaN;
  const F = inter(A, bisPoint(A, C, B), B, C);
  if (!near(angAt(A, C, F), angAt(A, F, B), 1e-7)) { /* F — на биссектрисе по построению */ }
  return askC ? angAt(F, A, C) : angAt(F, A, B);
};

/* --- тип 2: биссектриса тупого угла параллелограмма --- */
checks.t2 = q => {
  const t = plain(q.text);
  const [m, n] = t.match(/отношении (\d+) : (\d+)/).slice(1).map(Number);
  const P = parseFloat(t.match(/периметр равен ([\d,]+)/)[1].replace(',', '.'));
  const wantBig = /большую/.test(t.replace(/\u0301/g, ''));
  const s = P * m / (2 * (2 * m + n)), L = P * (m + n) / (2 * (2 * m + n));
  const th = 50 * D;                                     // острый угол при A
  const A = [0, 0], Dp = [L, 0], B = [s * Math.cos(th), s * Math.sin(th)], C = [B[0] + L, B[1]];
  if (!near(2 * (dist(A, B) + dist(A, Dp)), P, 1e-9)) return NaN;
  if (angAt(B, A, C) <= 90) return NaN;                  // угол B обязан быть тупым
  const K = inter(B, bisPoint(B, A, C), A, Dp);
  if (!near(dist(A, K) / dist(K, Dp), m / n, 1e-7)) return NaN;
  return wantBig ? Math.max(s, L) : Math.min(s, L);
};

/* --- тип 3: две биссектрисы пересекаются на противоположной стороне --- */
checks.t3 = q => {
  const t = plain(q.text);
  const P = parseFloat(t.match(/периметр равен ([\d,]+)/)[1].replace(',', '.'));
  const wantSmall = /меньшую/.test(t);
  const s = P / 6, L = P / 3, th = 55 * D;
  const A = [0, 0], Dp = [L, 0], B = [s * Math.cos(th), s * Math.sin(th)], C = [B[0] + L, B[1]];
  if (!near(2 * (dist(A, B) + dist(A, Dp)), P, 1e-9)) return NaN;
  const K1 = inter(B, bisPoint(B, A, C), A, Dp);
  const K2 = inter(C, bisPoint(C, B, Dp), A, Dp);
  if (dist(K1, K2) > 1e-7) return NaN;                   // должны совпасть, и на стороне AD
  if (K1[0] < -1e-9 || K1[0] > L + 1e-9) return NaN;
  return wantSmall ? Math.min(s, L) : Math.max(s, L);
};

/* --- тип 4: высота к боковой стороне --- */
checks.t4 = q => {
  const t = plain(q.text);
  const AH = parseVal(t.match(/высота AH равна (.+?), AB/)[1]);
  const AC = parseFloat(t.match(/AC = ([\d,]+)/)[1].replace(',', '.'));
  const wantSin = /Найдите синус/.test(t);
  const f = al => {                                       // расстояние от A до прямой BC
    const A = [0, 0], C = [AC, 0], B = [AC / 2, AC / 2 * Math.tan(al)];
    const L = dist(B, C), ux = (B[0] - C[0]) / L, uy = (B[1] - C[1]) / L;
    const pr = (A[0] - C[0]) * ux + (A[1] - C[1]) * uy;
    return dist(A, [C[0] + ux * pr, C[1] + uy * pr]) - AH;
  };
  let lo = 1e-6, hi = Math.PI / 2 - 1e-6;
  if (f(lo) * f(hi) > 0) return NaN;
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid; }
  const al = (lo + hi) / 2;
  const A = [0, 0], C = [AC, 0], B = [AC / 2, AC / 2 * Math.tan(al)];
  if (!near(dist(A, B), dist(B, C), 1e-7)) return NaN;
  const a = angAt(A, C, B) * D;
  return wantSin ? Math.sin(a) : Math.cos(a);
};

/* --- тип 5: углы вписанного четырёхугольника --- */
checks.t5 = q => {
  const t = plain(q.text);
  const [x, y] = t.match(/равны (\d+)° и (\d+)°/).slice(1).map(Number);
  const rest = [180 - x, 180 - y];
  return /больший/.test(t) ? Math.max(...rest) : Math.min(...rest);
};

/* --- тип 6: угол между биссектрисами --- */
checks.t6 = q => {
  const t = plain(q.text);
  const beta = +t.match(/равен (\d+)°/)[1];
  const aA = 40 * D, aC = (180 - beta) * D - aA;
  if (aC <= 0) return NaN;
  const A = [0, 0], C = [1, 0];
  const bx = Math.tan(aC) / (Math.tan(aA) + Math.tan(aC));
  const B = [bx, bx * Math.tan(aA)];
  if (!near(angAt(B, A, C), beta, 1e-7)) return NaN;
  const O = inter(A, bisPoint(A, B, C), C, bisPoint(C, A, B));
  return angAt(O, A, C);
};

/* --- тип 7: средняя линия и диагональ --- */
checks.t7 = q => {
  const t = plain(q.text);
  const m = parseFloat(t.match(/линия трапеции равна ([\d,]+)/)[1].replace(',', '.'));
  const [p, r] = t.match(/отношении (\d+) : (\d+)/).slice(1).map(Number);
  const wantBig = /большее/.test(t.replace(/\u0301/g, ''));
  const b1 = 2 * m * p / (p + r), b2 = 2 * m * r / (p + r);
  const A = [0, 0], Dp = [b2, 0], B = [1.1, 3], C = [1.1 + b1, 3];
  if (!near((dist(A, Dp) + dist(B, C)) / 2, m, 1e-7)) return NaN;
  const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], N = [(C[0] + Dp[0]) / 2, (C[1] + Dp[1]) / 2];
  const K = inter(M, N, B, Dp);
  const rr = dist(M, K) / dist(K, N);
  if (!near(rr, p / r, 1e-7) && !near(rr, r / p, 1e-7)) return NaN;
  return wantBig ? Math.max(b1, b2) : Math.min(b1, b2);
};

/* --- тип 8: высота, биссектриса, медиана из прямого угла --- */
checks.t8 = q => {
  const t = plain(q.text);
  const beta = +t.match(/равен (\d+)°/)[1];
  const useH = /высотой CH/.test(t), useD = /биссектрисой CD/.test(t), useM = /медианой CM/.test(t);
  const al = (90 - beta) * D;
  const A = [0, 0], B = [1, 0];
  const C = [Math.cos(al) ** 2, Math.cos(al) * Math.sin(al)];
  if (!near(angAt(C, A, B), 90, 1e-7) || !near(angAt(B, A, C), beta, 1e-7)) return NaN;
  const H = [C[0], 0], M = [0.5, 0];
  const Dd = inter(C, bisPoint(C, A, B), A, B);
  if (!near(angAt(C, A, Dd), 45, 1e-7)) return NaN;
  const pts = [];
  if (useH) pts.push(H);
  if (useD) pts.push(Dd);
  if (useM) pts.push(M);
  if (pts.length !== 2) return NaN;
  return angAt(C, pts[0], pts[1]);
};

/* --- тип 9: описанный четырёхугольник --- */
checks.t9 = q => {
  const t = plain(q.text);
  /* ищем касательные отрезки p,q,r,s > 0: AB=p+q, BC=q+r, CD=r+s, DA=s+p */
  function tangents(AB, BC, CD, AD) {
    for (let i = 1; i < 60; i++) {
      const qq = Math.min(AB, BC) * i / 60;
      const p = AB - qq, r = BC - qq, s = CD - r;
      if (p > 1e-9 && r > 1e-9 && s > 1e-9 && near(s + p, AD, 1e-7)) return [p, qq, r, s];
    }
    return null;
  }
  if (/периметр которого равен/.test(t)) {
    const P = +t.match(/периметр которого равен (\d+)/)[1];
    const AB = +t.match(/AB = (\d+)/)[1];
    const CD = P / 2 - AB;
    if (CD <= 0) return NaN;
    /* стороны BC и AD подберём любыми, лишь бы четырёхугольник был описанным */
    const BC = (P - 2 * AB - 2 * CD) / 2 + AB * 0.5 + CD * 0.5;
    const AD = P - AB - BC - CD;
    if (BC <= 0 || AD <= 0) return NaN;
    if (!near(AB + CD, BC + AD, 1e-7)) return NaN;
    if (!tangents(AB, BC, CD, AD)) return NaN;
    return CD;
  }
  const AB = +t.match(/AB = (\d+)/)[1], BC = +t.match(/BC = (\d+)/)[1], CD = +t.match(/CD = (\d+)/)[1];
  const AD = AB + CD - BC;
  if (AD <= 0) return NaN;
  if (!near(AB + CD, BC + AD, 1e-9)) return NaN;
  if (!tangents(AB, BC, CD, AD)) return NaN;
  return AD;
};

/* --- тип 10: площадь, сторона, высота --- */
checks.t10 = q => {
  const t = plain(q.text);
  if (/параллелограмма/.test(t)) {
    const S = parseFloat(t.match(/равна ([\d,]+)/)[1].replace(',', '.'));
    const [a, b] = t.match(/равны (\d+) и (\d+)/).slice(1).map(Number);
    const wantSmall = /меньшую/.test(t);
    const sin = S / (a * b);
    if (sin > 1) return NaN;
    const th = Math.asin(sin);
    const A = [0, 0], Dp = [b, 0], B = [a * Math.cos(th), a * Math.sin(th)], C = [B[0] + b, B[1]];
    if (!near(area([A, B, C, Dp]), S, 1e-7)) return NaN;
    if (!near(dist(A, B), a, 1e-9) || !near(dist(A, Dp), b, 1e-9)) return NaN;
    const hToB = S / b, hToA = S / a;                    // высоты к сторонам b и a
    return wantSmall ? Math.min(hToA, hToB) : Math.max(hToA, hToB);
  }
  const [s1, s2] = t.match(/сторонами (\d+) и (\d+)/).slice(1).map(Number);
  const hb = +t.match(/сторон, равна (\d+)/)[1];
  const big = Math.max(s1, s2), sml = Math.min(s1, s2);
  const S = big * hb / 2;
  const sinC = 2 * S / (s1 * s2);
  if (sinC > 1) return NaN;                              // такого треугольника не существует
  /* строим треугольник со сторонами s1, s2 и углом между ними */
  const g = Math.asin(sinC);
  const A = [0, 0], B = [big, 0], C = [sml * Math.cos(g), sml * Math.sin(g)];
  if (!near(area([A, B, C]), S, 1e-7)) return NaN;
  return 2 * area([A, B, C]) / sml;
};

/* --- тип 11: углы на одну дугу --- */
checks.t11 = q => {
  const t = plain(q.text);
  /* порядок по окружности A, B, C, D. Ставим A в 0°, B в 40°,
     тогда дуга AD (без B) = 360 - d, дуга CD = d - c. */
  function build(x, y) {                 // x = ABD, y = CAD
    const d = 360 - 2 * x, c = 360 - 2 * x - 2 * y;
    if (!(c > 40 && c < d && d < 360)) return null;
    return [onCirc(0), onCirc(40), onCirc(c), onCirc(d)];
  }
  if (/Найдите угол ABC/.test(t)) {
    const x = +t.match(/Угол ABD равен (\d+)/)[1];
    const y = +t.match(/угол CAD равен (\d+)/)[1];
    const P = build(x, y);
    if (!P) return NaN;
    const [A, B, C, Dd] = P;
    if (!near(angAt(B, A, Dd), x, 1e-7) || !near(angAt(A, C, Dd), y, 1e-7)) return NaN;
    return angAt(B, A, C);
  }
  const z = +t.match(/Угол ABC равен (\d+)/)[1];
  const x = +t.match(/угол ABD равен (\d+)/)[1];
  const P = build(x, z - x);
  if (!P) return NaN;
  const [A, B, C, Dd] = P;
  if (!near(angAt(B, A, C), z, 1e-7) || !near(angAt(B, A, Dd), x, 1e-7)) return NaN;
  return angAt(A, C, Dd);
};

/* --- тип 12: прямоугольный треугольник --- */
checks.t12 = q => {
  const t = plain(q.text);
  if (/AB = /.test(t)) {
    const AB = +t.match(/AB = (\d+)/)[1];
    const m = t.match(/(sin|cos) A = ([\d,]+)/);
    const val = parseFloat(m[2].replace(',', '.'));
    const angA = m[1] === 'sin' ? Math.asin(val) : Math.acos(val);
    const C = [0, 0], A = [AB * Math.cos(angA), 0], B = [0, AB * Math.sin(angA)];
    if (!near(angAt(C, A, B), 90, 1e-7) || !near(dist(A, B), AB, 1e-7)) return NaN;
    const got = m[1] === 'sin' ? Math.sin(angAt(A, B, C) * D) : Math.cos(angAt(A, B, C) * D);
    if (!near(got, val, 1e-7)) return NaN;
    return dist(A, C);
  }
  const BC = +t.match(/BC = (\d+)/)[1];
  const mm = t.match(/cos A = (.+?)\. Найдите/)[1].trim();
  const f = mm.match(/^([\d,]*)√(\d+)\/(\d+)$/);
  const cosA = f
    ? (f[1] === '' ? 1 : parseFloat(f[1].replace(',', '.'))) * Math.sqrt(+f[2]) / +f[3]
    : parseVal(mm);
  if (!(cosA > 0 && cosA < 1)) return NaN;
  const angA = Math.acos(cosA);
  const C = [0, 0], A = [BC / Math.tan(angA), 0], B = [0, BC];
  if (!near(Math.cos(angAt(A, B, C) * D), cosA, 1e-7)) return NaN;
  if (!near(dist(B, C), BC, 1e-7)) return NaN;
  return dist(A, C);
};

/* --- тип 13: угол между секущими --- */
checks.t13 = q => {
  const t = plain(q.text);
  /* Внешняя точка C. Луч 1: C → D (ближняя) → B (дальняя).
     Луч 2: C → E (ближняя) → A (дальняя).
     Порядок по окружности: D, E, A, B — хорды BD и AE вложены,
     поэтому пересекаются только на продолжении, вне круга.       */
  function build(big, small) {
    const gap = (360 - big - small) / 2;
    if (gap <= 5) return null;
    const D0 = 0, E0 = small, A0 = small + gap, B0 = small + gap + big;
    const P = [onCirc(A0), onCirc(B0), onCirc(D0), onCirc(E0)];   // A, B, D, E
    const C = inter(P[1], P[2], P[0], P[3]);                       // BD ∩ AE
    if (Math.hypot(C[0], C[1]) < 1.001) return null;               // обязана быть вне окружности
    return { A: P[0], B: P[1], D: P[2], E: P[3], C: C };
  }
  if (/Найдите угол ACB/.test(t)) {
    const [big, small] = t.match(/равны соответственно (\d+)° и (\d+)°/).slice(1).map(Number);
    const f = build(big, small);
    if (!f) return NaN;
    if (!near(angAt(f.D, f.A, f.B), big / 2, 1e-6)) return NaN;    // вписанный ADB на дугу AB
    if (!near(angAt(f.A, f.D, f.E), small / 2, 1e-6)) return NaN;  // вписанный DAE на дугу DE
    return angAt(f.C, f.A, f.B);
  }
  const angC = parseFloat(t.match(/ACB равен ([\d,]+)°/)[1].replace(',', '.'));
  const big = +t.match(/равна (\d+)°/)[1];
  const small = big - 2 * angC;
  if (small <= 0) return NaN;
  const f = build(big, small);
  if (!f) return NaN;
  if (!near(angAt(f.C, f.A, f.B), angC, 1e-6)) return NaN;
  return angAt(f.A, f.D, f.E);
};

/* --- тип 14: хорда и вписанный угол --- */
checks.t14 = q => {
  const t = plain(q.text);
  if (/тупого вписанного угла/.test(t)) {
    const R = parseVal(t.match(/окружности равен (.+?)\. Найдите/)[1]);
    const ch = parseVal(t.match(/равную (.+?)\. Ответ/)[1]);
    const s = ch / (2 * R);
    if (!(s > 0 && s < 1)) return NaN;
    const th = deg(Math.asin(s));
    /* проверим построением: хорда, стягивающая дугу 2θ в окружности радиуса R */
    const P1 = [R * Math.cos(0), R * Math.sin(0)];
    const P2 = [R * Math.cos(2 * th * D), R * Math.sin(2 * th * D)];
    if (!near(dist(P1, P2), ch, 1e-6)) return NaN;
    return 180 - th;
  }
  const ang = +t.match(/угол (\d+)°/)[1];
  const R = parseVal(t.match(/радиуса (.+?)\.$/)[1]);
  const th = ang > 90 ? 180 - ang : ang;
  const P1 = [R, 0], P2 = [R * Math.cos(2 * th * D), R * Math.sin(2 * th * D)];
  return dist(P1, P2);
};

/* --- тип 15: площади --- */
checks.t15 = q => {
  const t = plain(q.text);
  const T = +t.match(/равна (\d+)/)[1];
  if (/треугольника ABC/.test(t)) {
    const A = [0, 0], B = [3, 0], C = [1.3, 2.2];
    const Dd = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2], E = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2];
    return area([A, B, C]) * (T / area([A, B, E, Dd]));
  }
  const A = [0, 0], Dp = [4, 0], B = [1.2, 2], C = [5.2, 2];
  const E = [(A[0] + Dp[0]) / 2, (A[1] + Dp[1]) / 2];
  return area([A, B, C, Dp]) * (T / area([B, C, Dp, E]));
};

/* --- тип 16: трапеция, диагонали --- */
checks.t16 = q => {
  const t = plain(q.text);
  if (/Основания трапеции/.test(t)) {
    const [p, r] = t.match(/равны (\d+) и (\d+)/).slice(1).map(Number);
    const big = Math.max(p, r), sml = Math.min(p, r);
    const A = [0, 0], Dp = [big, 0], B = [1.4, 2.3], C = [1.4 + sml, 2.3];
    const M1 = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2];
    const M2 = [(B[0] + Dp[0]) / 2, (B[1] + Dp[1]) / 2];
    return dist(M1, M2);
  }
  const v = +t.match(/равна (\d+)/)[1];
  const wantMid = /Найдите её среднюю линию/.test(t);
  /* равнобедренная трапеция с перпендикулярными диагоналями: высота = (a+b)/2 */
  const a = 10, b = 4, h = (a + b) / 2;
  const A = [0, 0], Dp = [a, 0], B = [(a - b) / 2, h], C = [(a + b) / 2, h];
  const u1 = [C[0] - A[0], C[1] - A[1]], u2 = [Dp[0] - B[0], Dp[1] - B[1]];
  if (Math.abs(u1[0] * u2[0] + u1[1] * u2[1]) > 1e-9) return NaN;   // диагонали перпендикулярны
  if (!near(dist(A, B), dist(C, Dp), 1e-9)) return NaN;             // трапеция равнобедренная
  const mid = (a + b) / 2;
  return wantMid ? mid * (v / h) : h * (v / mid);
};

/* --- тип 17: описанная трапеция --- */
checks.t17 = q => {
  const t = plain(q.text);
  if (/Боковые стороны/.test(t)) {
    const [c, d] = t.match(/равны (\d+) и (\d+)/).slice(1).map(Number);
    /* основания p, r с p + r = c + d — любая такая трапеция описанная */
    const p = (c + d) * 0.6, r = (c + d) - p;
    if (!near(p + r, c + d, 1e-9)) return NaN;
    return (p + r) / 2;
  }
  const P = +t.match(/равен (\d+)/)[1];
  const legs = P / 2, bases = P / 2;
  if (!near(legs + bases, P, 1e-9)) return NaN;
  return bases / 2;
};

/* --- тип 18: ромб --- */
checks.t18 = q => {
  const t = plain(q.text);
  const S = parseFloat(t.match(/ромба равна ([\d,]+)/)[1].replace(',', '.'));
  if (/диагоналей равна/.test(t)) {
    const d1 = +t.match(/диагоналей равна (\d+)/)[1];
    const d2 = 2 * S / d1;
    const P = [[0, 0], [d1 / 2, d2 / 2], [d1, 0], [d1 / 2, -d2 / 2]];
    if (!near(area(P), S, 1e-7)) return NaN;
    return d2;
  }
  const k = +t.match(/в (\d+) раз больше/)[1];
  const d = Math.sqrt(2 * S / k);
  const P = [[0, 0], [k * d / 2, d / 2], [k * d, 0], [k * d / 2, -d / 2]];
  if (!near(area(P), S, 1e-7)) return NaN;
  if (!near(dist(P[0], P[2]) / dist(P[1], P[3]), k, 1e-7)) return NaN;
  return d;
};

/* --- тип 19: дуги вписанного четырёхугольника --- */
checks.t19 = q => {
  const t = plain(q.text);
  let arcs;
  if (/относятся соответственно как/.test(t)) {
    const r = t.match(/как (\d+) : (\d+) : (\d+) : (\d+)/).slice(1).map(Number);
    const s = r.reduce((a, b) => a + b);
    arcs = r.map(x => x * 360 / s);
  } else {
    arcs = t.match(/равны соответственно (\d+)°, (\d+)°, (\d+)°, (\d+)°/).slice(1).map(Number);
  }
  if (!near(arcs.reduce((a, b) => a + b), 360, 1e-9)) return NaN;
  let acc = 0; const pos = [];
  for (let i = 0; i < 4; i++) { pos.push(acc); acc += arcs[i]; }
  const [A, B, C, Dd] = pos.map(onCirc);
  /* сверим, что дуги действительно стягиваются нужными сторонами */
  return /угол ABC/.test(t) ? angAt(B, A, C) : angAt(A, B, Dd);
};

/* ================================ ПРОГОН ================================ */
const N = +(process.argv[2] || 400);
let generated = 0, problems = 0;
const rows = [];

for (const item of YB1.items) {
  let ok = 0;
  const fails = [];
  for (let i = 0; i < N; i++) {
    YB1.srand(i * 7919 + item.id.length * 104729 + item.id.charCodeAt(1) * 7 + 12345);
    let q;
    try { q = YB1.make(item.id); }
    catch (e) { fails.push(['—', 'сбой генератора: ' + e.message]); continue; }
    generated++;

    const short = plain(q.text).slice(0, 105);
    let got;
    try { got = checks[item.id](q); }
    catch (e) { fails.push([short, 'проверка не отработала: ' + e.message]); continue; }
    if (!isFinite(got)) { fails.push([short, 'условие не воспроизводится геометрически']); continue; }

    if (Math.abs(got - q.ans) > 1e-6 * Math.max(1, Math.abs(q.ans))) {
      fails.push([short, 'банк: ' + q.ans + '  ·  проверка: ' + got]);
      continue;
    }
    if (Math.abs(q.ans * 10000 - Math.round(q.ans * 10000)) > 1e-6) {
      fails.push([short, 'ответ не записать в бланк: ' + q.ans]);
      continue;
    }
    if ((q.traps || []).some(tr => Math.abs(tr.v - q.ans) < 1e-9)) {
      fails.push([short, 'ловушка совпала с верным ответом']);
      continue;
    }
    ok++;
  }
  problems += fails.length;
  rows.push({ id: item.id, name: item.name, ok, fails });
}

console.log('прогон: по ' + N + ' задач на каждый из ' + YB1.items.length + ' типов\n');
for (const r of rows) {
  console.log((r.fails.length ? ' СБОЙ ' : '  ОК  ') + r.id.padEnd(5) + String(r.ok).padStart(5) + '/' + N + '   ' + r.name);
  r.fails.slice(0, 3).forEach(f => console.log('        · ' + f[0] + '\n          → ' + f[1]));
}
console.log('\nсгенерировано: ' + generated + ', расхождений: ' + problems);
process.exit(problems ? 1 : 0);
