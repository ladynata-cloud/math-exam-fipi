/* Независимый верификатор банка «Комбинации тел».
   Числа берутся регулярками из текста cond, формулы — свои
   (модель захардкожена по id), ответы сравниваются через parseAns
   с допуском 1e-9. Сцена сверяется с условием координатно:
   длины подписанных отрезков, равенство радиусов и высот,
   совпадение центров тел при вписанности/описанности. */
const api = require("./_load.js")("./problems-komb.js", "P_KOMB");
const TOL = 1e-9;
const errs = [];

const num = s => api.parseAns(s);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function sceneOf(p) {
  const sc = api.sceneData(p);
  const pts = {};
  sc.gen.forEach(g => Object.assign(pts, g.pts));
  const surf = t => {
    const out = [];
    sc.gen.forEach(g => g.surfaces.forEach(sf => { if (sf.type === t) out.push(sf); }));
    return out;
  };
  return { sc, pts, sphere: surf("sphere")[0], cyl: surf("cyl")[0], cone: surf("cone")[0] };
}

/* центр и полуразмеры бокса по его собственным точкам (gen[i]) */
function boxInfo(S, i) {
  const mn = [1e99, 1e99, 1e99], mx = [-1e99, -1e99, -1e99];
  const vs = Object.values(S.sc.gen[i].pts);
  for (const q of vs) for (let k = 0; k < 3; k++) {
    if (q[k] < mn[k]) mn[k] = q[k];
    if (q[k] > mx[k]) mx[k] = q[k];
  }
  return {
    c: [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2],
    half: [(mx[0] - mn[0]) / 2, (mx[1] - mn[1]) / 2, (mx[2] - mn[2]) / 2],
    verts: vs
  };
}

function grab(p, re) {
  const m = p.cond.match(re);
  if (!m) { errs.push(p.id + ": в cond не найдено число по " + re); return NaN; }
  return num(m[1]);
}

function eq(p, what, got, want) {
  if (!(Math.abs(got - want) <= TOL)) errs.push(p.id + ": " + what + ": " + got + " ≠ " + want);
}

/* все числовые подписи labels обязаны совпадать с длинами отрезков сцены */
function checkLabels(p, S) {
  for (const [a, b, txt] of (p.labels || [])) {
    if (!/^\d+(?:,\d+)?$/.test(txt)) continue;   /* «?», «r», «2R» и т.п. */
    const v = num(txt);
    if (!isFinite(v)) continue;               /* «?», «r» и т.п. */
    eq(p, "label " + a + "–" + b + " = " + txt, dist(S.pts[a], S.pts[b]), v);
  }
}

/* шар вписан в куб (бокс — gen[0], шар — gen[1]): центры совпадают,
   ребро = 2R, шар касается всех шести граней */
function sphereInCube(p, S, R) {
  const B = boxInfo(S, 0);
  eq(p, "сцена: радиус шара", S.sphere.r, R);
  for (let k = 0; k < 3; k++) {
    eq(p, "сцена: центр шара = центру куба (ось " + k + ")", S.sphere.c[k], B.c[k]);
    eq(p, "сцена: полуребро куба = R (ось " + k + ")", B.half[k], R);
  }
}

/* шар вписан в цилиндр: общая ось, r совпадают, h = 2R,
   центр шара — середина оси цилиндра */
function sphereInCyl(p, S) {
  eq(p, "сцена: r цилиндра = R шара", S.cyl.r, S.sphere.r);
  eq(p, "сцена: h цилиндра = 2R", S.cyl.h, 2 * S.sphere.r);
  eq(p, "сцена: центр шара на оси в середине", dist(S.cyl.c, S.sphere.c), 0);
}

/* id → модель */
const CHECK = {
  "komb-01"(p) {
    const R = grab(p, /Шар радиуса (\d+(?:,\d+)?)/);
    eq(p, "ответ V куба = (2R)³", num(p.ans), Math.pow(2 * R, 3));
    sphereInCube(p, sceneOf(p), R);
  },
  "komb-02"(p) {
    const v = grab(p, /объём которого равен (\d+(?:,\d+)?)/);
    const a = Math.cbrt(v);
    eq(p, "ответ R = ∛V/2", num(p.ans), a / 2);
    sphereInCube(p, sceneOf(p), a / 2);
  },
  "komb-03"(p) {
    const a = grab(p, /Куб с ребром (\d+(?:,\d+)?)/);
    eq(p, "ответ d² = 3a²", num(p.ans), 3 * a * a);
    const S = sceneOf(p);
    const B = boxInfo(S, 0);
    for (let k = 0; k < 3; k++) {
      eq(p, "сцена: ребро куба (ось " + k + ")", 2 * B.half[k], a);
      eq(p, "сцена: центр шара = центру куба (ось " + k + ")", S.sphere.c[k], B.c[k]);
    }
    eq(p, "сцена: диаметр шара² = ответу", Math.pow(2 * S.sphere.r, 2), num(p.ans));
    B.verts.forEach((q, i) => eq(p, "сцена: вершина куба №" + i + " на шаре", dist(q, S.sphere.c), S.sphere.r));
  },
  "komb-04"(p) {
    if (!/Во сколько раз/.test(p.cond)) errs.push(p.id + ": в cond нет вопроса об отношении");
    eq(p, "ответ 2πr³ / (4/3·πr³)", num(p.ans), 2 / (4 / 3));
    sphereInCyl(p, sceneOf(p));
  },
  "komb-05"(p) {
    const R = grab(p, /Шар радиуса (\d+(?:,\d+)?)/);
    eq(p, "ответ S/π = 2R·2R = 4R²", num(p.ans), 4 * R * R);
    const S = sceneOf(p);
    eq(p, "сцена: радиус шара", S.sphere.r, R);
    sphereInCyl(p, S);
    /* точка касания K на боковой поверхности цилиндра */
    const hor = Math.hypot(S.pts.K[0] - S.cyl.c[0], S.pts.K[2] - S.cyl.c[2]);
    eq(p, "сцена: K на боковой поверхности", hor, S.cyl.r);
    eq(p, "сцена: K на шаре", dist(S.pts.K, S.sphere.c), R);
  },
  "komb-06"(p) {
    const v = grab(p, /Объём шара равен (\d+(?:,\d+)?)/);
    eq(p, "ответ V цил = 1,5·V шара", num(p.ans), 1.5 * v);
    const S = sceneOf(p);
    eq(p, "сцена: объём шара из условия", 4 / 3 * Math.PI * Math.pow(S.sphere.r, 3), v);
    sphereInCyl(p, S);
  },
  "komb-08"(p) {
    const v = grab(p, /Объём цилиндра равен (\d+(?:,\d+)?)/);
    eq(p, "ответ V кон = V цил/3", num(p.ans), v / 3);
    const S = sceneOf(p);
    eq(p, "сцена: общий радиус", S.cone.r, S.cyl.r);
    eq(p, "сцена: общая высота", S.cone.h, S.cyl.h);
    eq(p, "сцена: общая ось и основание", dist(S.cone.c, S.cyl.c), 0);
    eq(p, "сцена: объём цилиндра из условия", Math.PI * S.cyl.r * S.cyl.r * S.cyl.h, v);
  },
  "komb-09"(p) {
    const m = p.cond.match(/с рёбрами (\d+), (\d+) и (\d+)/);
    if (!m) { errs.push(p.id + ": в cond не найдены три ребра"); return; }
    const [a, b, c] = [num(m[1]), num(m[2]), num(m[3])];
    eq(p, "ответ R = √(a²+b²+c²)/2", num(p.ans), Math.sqrt(a * a + b * b + c * c) / 2);
    const S = sceneOf(p);
    const B = boxInfo(S, 0);
    const dims = B.half.map(x => 2 * x).sort((x, y) => x - y);
    const need = [a, b, c].sort((x, y) => x - y);
    for (let k = 0; k < 3; k++) eq(p, "сцена: набор рёбер, №" + k, dims[k], need[k]);
    for (let k = 0; k < 3; k++) eq(p, "сцена: центр шара = центру бокса (ось " + k + ")", S.sphere.c[k], B.c[k]);
    eq(p, "сцена: радиус шара = ответу", S.sphere.r, num(p.ans));
    B.verts.forEach((q, i) => eq(p, "сцена: вершина №" + i + " на шаре", dist(q, S.sphere.c), S.sphere.r));
  },
  "komb-10"(p) {
    const a = grab(p, /сторона основания которой равна (\d+(?:,\d+)?)/);
    const h = grab(p, /высота равна (\d+(?:,\d+)?)/);
    eq(p, "ответ V/π = a²h/2", num(p.ans), a * a * h / 2);
    const S = sceneOf(p);
    eq(p, "сцена: сторона основания AB", dist(S.pts.A, S.pts.B), a);
    eq(p, "сцена: высота призмы", dist(S.pts.B, S.pts.B1), h);
    eq(p, "сцена: высота цилиндра", S.cyl.h, h);
    eq(p, "сцена: r² цилиндра = a²/2", S.cyl.r * S.cyl.r, a * a / 2);
    /* ось цилиндра — через центр основания призмы, вершины на боковой поверхности */
    const base = ["A", "B", "C", "D"].map(n => S.pts[n]);
    const cx = base.reduce((s, q) => s + q[0], 0) / 4, cz = base.reduce((s, q) => s + q[2], 0) / 4;
    eq(p, "сцена: ось цилиндра по x", S.cyl.c[0], cx);
    eq(p, "сцена: ось цилиндра по z", S.cyl.c[2], cz);
    base.forEach((q, i) => eq(p, "сцена: вершина основания №" + i + " на цилиндре",
      Math.hypot(q[0] - S.cyl.c[0], q[2] - S.cyl.c[2]), S.cyl.r));
  },
  "komb-11"(p) {
    const a = grab(p, /со стороной основания (\d+(?:,\d+)?)/);
    const h = grab(p, /высотой (\d+(?:,\d+)?)/);
    eq(p, "ответ V/π = a²h/4", num(p.ans), a * a * h / 4);
    const S = sceneOf(p);
    eq(p, "сцена: сторона основания AB", dist(S.pts.A, S.pts.B), a);
    eq(p, "сцена: высота призмы DD₁", dist(S.pts.D, S.pts.D1), h);
    eq(p, "сцена: высота цилиндра", S.cyl.h, h);
    eq(p, "сцена: r цилиндра = a/2 (касание граней)", S.cyl.r, a / 2);
    const base = ["A", "B", "C", "D"].map(n => S.pts[n]);
    const cx = base.reduce((s, q) => s + q[0], 0) / 4, cz = base.reduce((s, q) => s + q[2], 0) / 4;
    eq(p, "сцена: ось цилиндра по x", S.cyl.c[0], cx);
    eq(p, "сцена: ось цилиндра по z", S.cyl.c[2], cz);
    /* расстояние от оси до каждой стороны основания = r */
    for (let i = 0; i < 4; i++) {
      const q1 = base[i], q2 = base[(i + 1) % 4];
      const mx = [(q1[0] + q2[0]) / 2, (q1[2] + q2[2]) / 2];
      eq(p, "сцена: касание грани №" + i, Math.hypot(mx[0] - cx, mx[1] - cz), S.cyl.r);
    }
  },
  "komb-12"(p) {
    const v = grab(p, /Объём шара равен (\d+(?:,\d+)?)π/);
    const R = Math.cbrt(v * 3 / 4);
    eq(p, "ответ V куба = (2R)³", num(p.ans), Math.pow(2 * R, 3));
    sphereInCube(p, sceneOf(p), R);
  },
  "komb-13"(p) {
    const v = grab(p, /объём которого равен (\d+(?:,\d+)?)/);
    const R = Math.cbrt(v) / 2;
    eq(p, "ответ V/π шара = 4R³/3", num(p.ans), 4 * R * R * R / 3);
    sphereInCube(p, sceneOf(p), R);
  },
  "komb-14"(p) {
    const R = grab(p, /Радиус основания конуса равен (\d+(?:,\d+)?)/);
    eq(p, "ответ a² = (2R)²/2", num(p.ans), 2 * R * R);
    const S = sceneOf(p);
    eq(p, "сцена: радиус конуса", S.cone.r, R);
    /* вершина пирамиды совпадает с вершиной конуса */
    eq(p, "сцена: общая вершина S", dist(S.sc.gen[0].pts.S, S.sc.gen[1].pts.S), 0);
    /* вершины основания пирамиды — на окружности основания конуса */
    const O = S.pts.O;
    ["A", "B", "C", "D"].forEach(n => {
      eq(p, "сцена: " + n + " в плоскости основания", S.pts[n][1], O[1]);
      eq(p, "сцена: " + n + " на окружности основания", Math.hypot(S.pts[n][0] - O[0], S.pts[n][2] - O[2]), R);
    });
    eq(p, "сцена: AB² = ответу", Math.pow(dist(S.pts.A, S.pts.B), 2), num(p.ans));
  }
};

let n = 0;
for (const p of api.PROBLEMS) {
  if (!CHECK[p.id]) { errs.push(p.id + ": для задачи нет модели в верификаторе"); continue; }
  CHECK[p.id](p);
  checkLabels(p, sceneOf(p));
  n++;
}
for (const id of Object.keys(CHECK))
  if (!api.PROBLEMS.some(p => p.id === id)) errs.push(id + ": модель есть, задачи нет");

/* komb-07 убрана из банка 24.09.2026 как дубль задачи 27051 старого банка
   (та же модель, те же числа; старую задачу проверяет verify-legacy-*.js).
   Вернуть её в банк — значит снова задвоить задачу в тренажёре. */
const REMOVED_DUPES = { "komb-07": "27051" };
for (const [id, old] of Object.entries(REMOVED_DUPES))
  if (api.PROBLEMS.some(p => p.id === id)) errs.push(id + ": дубль старой задачи " + old + " снова в банке");

if (errs.length) {
  console.log("РАСХОЖДЕНИЯ (" + errs.length + "):");
  errs.forEach(e => console.log("  - " + e));
  process.exit(1);
}
console.log("OK " + n + " задач, расхождений 0");
