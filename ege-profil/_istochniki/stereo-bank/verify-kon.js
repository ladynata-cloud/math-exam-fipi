/* Независимый верификатор банка «Конус».
   Числа берутся регулярками из текста cond, ответ пересчитывается
   своей формулой по модели (id -> модель), пифагоровы тройки
   проверяются прямым пересчётом, геометрия сцены сверяется с условием.
   Часть конуса (kon-23, kon-24, с 24.09.2026): обод основания — дуга
   над нарисованным сектором, A и B — на её концах (partRim). */
const api = require("./_load.js")("./problems-kon.js", "P_KON");
const errs = [];
const eq = (a, b, eps) => Math.abs(a - b) <= (eps || 1e-9);

const nums = p => (p.cond.match(/\d+(?:,\d+)?/g) || []).map(s => parseFloat(s.replace(",", ".")));
const ptsOf = p => {
  const sc = api.sceneData(p);
  const m = {};
  sc.gen.forEach(g => Object.assign(m, g.pts));
  return m;
};
const dist = (m, a, b) => {
  const p1 = m[a], p2 = m[b];
  return Math.hypot(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]);
};
const chk = (id, cond, msg) => { if (!cond) errs.push(id + ": " + msg); };
const rad = deg => deg * Math.PI / 180;

/* доля высоты, до которой налита вода: «половины» -> 2, «трети» -> 3 */
const frac = p => /половин/.test(p.cond) ? 2 : /трет/.test(p.cond) ? 3 : NaN;

/* конус с данными r и h из условия + именованные O, S (и A на ободе) */
function baseCone(p, r, h, m, withA) {
  const b = p.scene.bodies[0];
  chk(p.id, eq(b.r, r) && eq(b.h, h), "r/h сцены не из условия");
  chk(p.id, eq(dist(m, "O", "S"), h), "OS не равно высоте");
  if (withA) chk(p.id, eq(dist(m, "O", "A"), r), "OA не равно радиусу");
  return b;
}
/* часть конуса (sector.part): обод основания — дуга над нарисованным сектором
   поверхности, концы дуги — точки A, B на краях части. Точка обода —
   [r·cos u, ·, r·sin u], поверхность θ ∈ [ts; ts + tl] лежит над
   u ∈ [π/2 − ts − tl; π/2 − ts] (CylinderGeometry: x = r·sin θ, z = r·cos θ) */
function partRim(p, m) {
  const b = p.scene.bodies[0], g = api.sceneData(p).gen[0];
  const TAU = 2 * Math.PI, norm = x => ((x % TAU) + TAU) % TAU;
  const gap = (x, y) => { const d = norm(x - y); return Math.min(d, TAU - d); };
  const rim = g.circles.find(c => !c.col && eq(c.c[1], m.O[1]));
  chk(p.id, !!(b.sector && b.sector.part), "нарисована часть конуса, а sector.part не задан");
  chk(p.id, !!rim && rim.tl != null, "обод основания нарисован целиком, а тело — часть конуса");
  if (!rim || rim.tl == null || !b.sector) return;
  chk(p.id, eq(rim.tl, b.sector.tl) && gap(rim.ts, Math.PI / 2 - b.sector.ts - b.sector.tl) < 1e-9,
    "обод основания — дуга не над нарисованным сектором поверхности");
  const ang = n => Math.atan2(m[n][2] - m.O[2], m[n][0] - m.O[0]);
  const ends = [rim.ts, rim.ts + rim.tl];
  const hit = (x, y) => gap(ang(x), ends[0]) < 1e-9 && gap(ang(y), ends[1]) < 1e-9;
  chk(p.id, hit("A", "B") || hit("B", "A"), "A и B не на концах дуги обода");
}
/* сосуд-конус вершиной вниз, вода до 1/k высоты */
function vessel(p, k) {
  const b = p.scene.bodies[0];
  chk(p.id, !!b.flip && !!b.ghost && !!b.water, "сосуд должен быть flip+ghost с водой");
  chk(p.id, eq(b.water.h * k, b.h), "уровень воды не равен 1/" + k + " высоты");
  chk(p.id, eq(b.water.r * k, b.r), "конус воды не подобен сосуду");
}
/* объём конуса сцены (по r и h тела) равен V из условия */
function volIs(p, b, V) {
  chk(p.id, eq(Math.PI * b.r * b.r * b.h / 3, V), "объём конуса сцены не равен " + V + " из условия");
}
/* угол между OA и OB (в градусах) по точкам сцены */
function angAOB(m) {
  const O = m.O, A = m.A, B = m.B;
  const u = [A[0] - O[0], A[1] - O[1], A[2] - O[2]];
  const v = [B[0] - O[0], B[1] - O[1], B[2] - O[2]];
  const du = Math.hypot(...u), dv = Math.hypot(...v);
  return Math.acos((u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (du * dv)) * 180 / Math.PI;
}
/* прямой пересчёт пифагоровой тройки */
function pyth(id, a, b, c) {
  chk(id, a * a + b * b === c * c, "не пифагорова тройка: " + a + "," + b + "," + c);
}

const MODELS = {
  /* --- объём --- */
  "kon-01": (p, n, m) => { const [r, h] = n; baseCone(p, r, h, m, true); return r * r * h / 3; },
  "kon-02": (p, n, m) => {
    const [V, h] = n; const r = Math.sqrt(3 * V / h);
    baseCone(p, r, h, m, true);
    return r;
  },
  "kon-03": (p, n, m) => {
    const [V, r] = n; const h = 3 * V / (r * r);
    baseCone(p, r, h, m, true);
    return h;
  },
  "kon-04": (p, n) => {
    const [k] = n; const [b1, b2] = p.scene.bodies;
    chk(p.id, eq(b2.r / b1.r, k) && b1.h === b2.h, "в сцене радиус не в k раз больше при той же высоте");
    return k * k;
  },
  "kon-05": (p, n) => {
    const [k] = n; const [b1, b2] = p.scene.bodies;
    chk(p.id, eq(b2.h / b1.h, k) && b1.r === b2.r, "в сцене высота не в k раз больше при том же радиусе");
    return k;
  },
  "kon-06": (p, n) => {
    const [V1, kr, kh] = n; const [b1, b2] = p.scene.bodies;
    chk(p.id, eq(b2.r / b1.r, kr), "отношение радиусов сцены не из условия");
    chk(p.id, eq(b1.h / b2.h, kh), "отношение высот сцены не из условия");
    return V1 * kr * kr / kh;
  },
  "kon-07": (p, n) => {
    const [kr, kh] = n; const [b1, b2] = p.scene.bodies;
    chk(p.id, eq(b2.r / b1.r, kr), "в сцене радиус второго конуса не в " + kr + " раз больше");
    chk(p.id, eq(b1.h / b2.h, kh), "в сцене высота второго конуса не в " + kh + " раз меньше");
    return kr * kr / kh;
  },
  "kon-08": (p, n) => {
    const [a, b] = n; const [b1, b2] = p.scene.bodies;
    chk(p.id, eq(b1.r / b2.r, a / b), "радиусы сцены не относятся как " + a + " : " + b);
    chk(p.id, b1.h === b2.h, "высоты конусов сцены не равны");
    return (a / b) * (a / b);
  },
  "kon-09": (p, n) => {
    const [Vc] = n; const [b1, b2] = p.scene.bodies;
    chk(p.id, b1.kind === "cyl" && b2.kind === "cone", "нужны цилиндр и конус");
    chk(p.id, b1.r === b2.r && b1.h === b2.h, "основание и высота не общие");
    return Vc / 3;
  },
  /* --- образующая и поверхность --- */
  "kon-10": (p, n, m) => {
    const [r, h] = n; baseCone(p, r, h, m, true);
    chk(p.id, eq(dist(m, "S", "A") ** 2, r * r + h * h), "SA² не равно r²+h²");
    return r * r + h * h;
  },
  "kon-11": (p, n, m) => {
    const [r, h] = n; const l = Math.sqrt(r * r + h * h);
    pyth(p.id, 9, 12, 15);
    baseCone(p, r, h, m, true);
    chk(p.id, eq(dist(m, "S", "A"), l), "SA не равно образующей");
    return l;
  },
  "kon-12": (p, n, m) => {
    const [l, r] = n; const h = Math.sqrt(l * l - r * r);
    pyth(p.id, 5, 12, 13);
    baseCone(p, r, h, m, true);
    chk(p.id, eq(dist(m, "S", "A"), l), "SA не равно образующей");
    return h;
  },
  "kon-13": (p, n, m) => {
    const [l, h] = n; const r = Math.sqrt(l * l - h * h);
    pyth(p.id, 8, 15, 17);
    baseCone(p, r, h, m, true);
    chk(p.id, eq(dist(m, "S", "A"), l), "SA не равно образующей");
    return r;
  },
  "kon-14": (p, n, m) => {
    const [r, l] = n;
    pyth(p.id, 6, 8, 10);
    baseCone(p, r, Math.sqrt(l * l - r * r), m, true);
    chk(p.id, eq(dist(m, "S", "A"), l), "SA не равно образующей");
    return r * l;
  },
  "kon-15": (p, n, m) => {
    const [S, l] = n; const r = S / l;
    pyth(p.id, 20, 21, 29);
    baseCone(p, r, Math.sqrt(l * l - r * r), m, true);
    chk(p.id, eq(dist(m, "S", "A"), l), "SA не равно образующей");
    return r;
  },
  "kon-16": (p, n, m) => {
    const [r, l] = n;
    pyth(p.id, 3, 4, 5);
    baseCone(p, r, Math.sqrt(l * l - r * r), m, true);
    chk(p.id, eq(dist(m, "S", "A"), l), "SA не равно образующей");
    return r * (r + l);
  },
  "kon-18": (p, n, m) => {
    const [r, h] = n; baseCone(p, r, h, m, true);
    chk(p.id, eq(dist(m, "A", "B"), 2 * r), "AB не равно диаметру");
    return r * h;                                  /* ½·2r·h */
  },
  /* --- сечения и подобие --- */
  "kon-19": (p, n) => {
    const [S] = n;
    const b = p.scene.bodies[0], c = p.scene.bodies[1].circles[0];
    chk(p.id, eq(Math.PI * b.r * b.r, S), "площадь основания сцены не из условия");
    chk(p.id, eq(c.c[1], b.h / 2) && eq(c.r, b.r / 2), "окружность сечения не в середине высоты");
    return S / 4;
  },
  "kon-20": (p, n) => {
    const [S] = n;                                  /* полная поверхность, отсечение на половине */
    const [b1, b2] = p.scene.bodies;
    const l = Math.hypot(b1.r, b1.h);
    chk(p.id, eq(Math.PI * b1.r * (b1.r + l), S), "полная поверхность сцены не равна " + S + " из условия");
    chk(p.id, eq(b2.r * 2, b1.r) && eq(b2.h * 2, b1.h), "малый конус не подобен с коэффициентом 1/2");
    chk(p.id, eq(b2.at[1] * 2, b1.h), "малый конус не отсечён на середине высоты");
    return S / 4;
  },
  "kon-21": (p) => {
    const V = parseFloat(p.cond.match(/равен (\d+)/)[1]);
    const mt = p.cond.match(/отношении (\d+)\s*:\s*(\d+)/);
    const k = (+mt[1]) / (+mt[1] + +mt[2]);
    const [b1, b2] = p.scene.bodies;
    volIs(p, b1, V);
    chk(p.id, eq(b2.r, b1.r * k) && eq(b2.h, b1.h * k), "малый конус не подобен с коэффициентом " + k);
    chk(p.id, eq(b2.at[1], b1.h * (1 - k)), "малый конус не отсечён на доле " + k + " от вершины");
    return V * k * k * k;
  },
  "kon-22": (p) => {
    const R = parseFloat(p.cond.match(/равен (\d+)/)[1]);
    const mt = p.cond.match(/отношении (\d+)\s*:\s*(\d+)/);
    const k = (+mt[1]) / (+mt[1] + +mt[2]);          /* доля высоты от вершины */
    const b = p.scene.bodies[0], c = p.scene.bodies[1].circles[0];
    chk(p.id, eq(b.r, R), "радиус основания сцены не из условия");
    chk(p.id, eq(c.c[1], b.h * (1 - k)), "окружность сечения не на доле " + k + " от вершины");
    chk(p.id, eq(c.r, R * k), "радиус окружности сечения не равен R·k");
    return R * k;
  },
  /* --- часть конуса --- */
  "kon-23": (p, n, m) => {
    const [V, a] = n;
    const b = p.scene.bodies[0];
    volIs(p, b, V);
    chk(p.id, b.sector && eq(b.sector.tl, rad(360 - a), 1e-9), "sector.tl не равен оставшимся " + (360 - a) + "°");
    chk(p.id, eq(angAOB(m), a), "угол AOB между полуплоскостями не равен " + a + "°");
    chk(p.id, eq(dist(m, "O", "A"), b.r) && eq(dist(m, "O", "B"), b.r), "A и B не на окружности основания");
    partRim(p, m);
    return V * a / 360;
  },
  "kon-24": (p, n, m) => {
    const [V, a] = n;
    const b = p.scene.bodies[0];
    volIs(p, b, V);
    chk(p.id, b.sector && eq(b.sector.tl, rad(360 - a), 1e-9), "sector.tl не равен оставшимся " + (360 - a) + "°");
    chk(p.id, eq(angAOB(m), a), "угол AOB между полуплоскостями не равен " + a + "°");
    chk(p.id, eq(dist(m, "O", "A"), b.r) && eq(dist(m, "O", "B"), b.r), "A и B не на окружности основания");
    partRim(p, m);
    return V * a / 360;
  },
  /* --- вода и уровни --- */
  "kon-25": (p, n) => { const [Vw] = n; const k = frac(p); vessel(p, k); return Vw * (k ** 3 - 1); },
  "kon-26": (p, n) => { const [Vw] = n; const k = frac(p); vessel(p, k); return Vw * (k ** 3 - 1); },
  "kon-27": (p, n) => { const [V] = n; const k = frac(p); vessel(p, k); return V / k ** 3; },
  "kon-28": (p, n) => { const [V] = n; const k = frac(p); vessel(p, k); return V / k ** 3; },
  "kon-29": (p, n) => {
    const [V, a, b0] = n; const k = a / b0;          /* вода до 2/3 высоты */
    const b = p.scene.bodies[0];
    chk(p.id, !!b.flip && !!b.ghost && !!b.water, "сосуд должен быть flip+ghost с водой");
    volIs(p, b, V);
    chk(p.id, eq(b.water.h, b.h * k), "уровень воды не равен " + a + "/" + b0 + " высоты");
    chk(p.id, eq(b.water.r, b.r * k), "конус воды не подобен сосуду");
    return V * k * k * k;
  }
};

let count = 0;
for (const p of api.PROBLEMS) {
  const model = MODELS[p.id];
  if (!model) { errs.push(p.id + ": нет модели в верификаторе"); continue; }
  let expected;
  try { expected = model(p, nums(p), ptsOf(p)); }
  catch (e) { errs.push(p.id + ": " + e.message); continue; }
  const got = api.parseAns(p.ans);
  if (!eq(expected, got)) errs.push(p.id + ": пересчёт " + expected + " ≠ ответ " + got);
  count++;
}

/* kon-17 убрана из банка 24.09.2026 как дубль задачи 27160 старого банка
   (та же модель, те же числа; старую задачу проверяет verify-legacy-*.js).
   Вернуть её в банк — значит снова задвоить задачу в тренажёре. */
const REMOVED_DUPES = { "kon-17": "27160" };
for (const [id, old] of Object.entries(REMOVED_DUPES))
  if (api.PROBLEMS.some(p => p.id === id)) errs.push(id + ": дубль старой задачи " + old + " снова в банке");

/* обратная проверка: модель в верификаторе есть, а задачи в банке нет —
   задачу потеряли или переименовали, и пропажу иначе никто бы не заметил */
for (const id of Object.keys(MODELS))
  if (!api.PROBLEMS.some(p => p.id === id)) errs.push(id + ": модель есть, задачи нет");

if (errs.length) {
  console.log("РАСХОЖДЕНИЯ (" + errs.length + "):");
  errs.forEach(e => console.log("  - " + e));
  process.exit(1);
}
console.log("OK " + count + " задач, расхождений 0");
