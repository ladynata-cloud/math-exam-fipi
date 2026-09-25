/* Независимый верификатор банка «Шар».
   Числа берутся регулярками из текста cond, формулы — свои
   (модель захардкожена по id), ответы сравниваются через parseAns
   с допуском 1e-9. Дополнительно геометрия сцены сверяется с условием:
   длины отрезков, радиусы шаров, расположение центров. */
const api = require("./_load.js")("./problems-shar.js", "P_SHAR");
const TOL = 1e-9;
const errs = [];

const num = s => api.parseAns(s);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function sceneOf(p) {
  const sc = api.sceneData(p);
  const pts = {};
  sc.gen.forEach(g => Object.assign(pts, g.pts));
  const spheres = [];
  sc.gen.forEach(g => g.surfaces.forEach(sf => { if (sf.type === "sphere") spheres.push(sf); }));
  return { sc, pts, spheres };
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
    if (!isFinite(v)) continue;               /* «?», «R», «2R» и т.п. */
    eq(p, "label " + a + "–" + b + " = " + txt, dist(S.pts[a], S.pts[b]), v);
  }
}

/* id → модель (пересчёт ответа + сверка сцены) */
const CHECK = {
  "shar-01"(p) {
    const R = grab(p, /Радиус шара равен (\d+(?:,\d+)?)/);
    eq(p, "ответ V/π = 4R³/3", num(p.ans), 4 * R * R * R / 3);
    const S = sceneOf(p);
    eq(p, "сцена: радиус шара", S.spheres[0].r, R);
    eq(p, "сцена: OA = R", dist(S.pts.O, S.pts.A), R);
  },
  "shar-02"(p) {
    const v = grab(p, /Объём шара равен (\d+(?:,\d+)?)π/);
    eq(p, "ответ R = ∛(3V/4)", num(p.ans), Math.cbrt(v * 3 / 4));
    const S = sceneOf(p);
    eq(p, "сцена: радиус шара = ответу", S.spheres[0].r, num(p.ans));
    eq(p, "сцена: OB = R", dist(S.pts.O, S.pts.B), num(p.ans));
  },
  "shar-03"(p) {
    const R = grab(p, /Радиус шара равен (\d+(?:,\d+)?)/);
    eq(p, "ответ S/π = 4R²", num(p.ans), 4 * R * R);
    const S = sceneOf(p);
    eq(p, "сцена: радиус шара", S.spheres[0].r, R);
    eq(p, "сцена: OA = R", dist(S.pts.O, S.pts.A), R);
  },
  "shar-04"(p) {
    const s4 = grab(p, /равна (\d+(?:,\d+)?)π/);
    eq(p, "ответ R = √(S/4)", num(p.ans), Math.sqrt(s4 / 4));
    const S = sceneOf(p);
    eq(p, "сцена: радиус шара = ответу", S.spheres[0].r, num(p.ans));
    eq(p, "сцена: OA = R", dist(S.pts.O, S.pts.A), num(p.ans));
  },
  "shar-05"(p) {
    if (!/в два раза больше/.test(p.cond)) errs.push(p.id + ": в cond нет «в два раза больше»");
    const k = 2;
    eq(p, "ответ k³", num(p.ans), k * k * k);
    const S = sceneOf(p);
    const rs = S.spheres.map(s => s.r).sort((a, b) => a - b);
    if (S.spheres.length !== 2) errs.push(p.id + ": в сцене не два шара");
    eq(p, "сцена: отношение радиусов", rs[1] / rs[0], k);
    for (const sf of S.spheres) eq(p, "сцена: шар лежит на плоскости", sf.c[1], sf.r);
  },
  "shar-06"(p) {
    if (!/увеличить в два раза/.test(p.cond)) errs.push(p.id + ": в cond нет «увеличить в два раза»");
    const k = 2;
    eq(p, "ответ k²", num(p.ans), k * k);
    const S = sceneOf(p);
    const rs = S.spheres.map(s => s.r).sort((a, b) => a - b);
    if (S.spheres.length !== 2) errs.push(p.id + ": в сцене не два шара");
    eq(p, "сцена: отношение радиусов", rs[1] / rs[0], k);
    for (const sf of S.spheres) eq(p, "сцена: шар лежит на плоскости", sf.c[1], sf.r);
  },
  "shar-07"(p) {
    const q = grab(p, /равна (\d+(?:,\d+)?)/);
    eq(p, "ответ S = 4·Sкруга", num(p.ans), 4 * q);
    const S = sceneOf(p);
    const R = S.spheres[0].r;
    eq(p, "сцена: πR² = площадь большого круга", Math.PI * R * R, q);
    /* диск большого круга: тот же радиус, центр в центре шара */
    let disc = null;
    S.sc.gen.forEach(g => g.surfaces.forEach(sf => { if (sf.type === "disc") disc = sf; }));
    if (!disc) errs.push(p.id + ": в сцене нет диска большого круга");
    else {
      eq(p, "сцена: радиус диска = R", disc.r, R);
      eq(p, "сцена: диск в центре шара", dist(disc.c, S.spheres[0].c), 0);
    }
  },
  "shar-08"(p) {
    const R = grab(p, /Радиус шара равен (\d+(?:,\d+)?)/);
    const d = grab(p, /расстоянии (\d+(?:,\d+)?) от центра/);
    eq(p, "ответ r = √(R²−d²)", num(p.ans), Math.sqrt(R * R - d * d));
    const S = sceneOf(p);
    eq(p, "сцена: радиус шара", S.spheres[0].r, R);
    eq(p, "сцена: OO₁ = d", dist(S.pts.O, S.pts.O1), d);
    eq(p, "сцена: OM = R", dist(S.pts.O, S.pts.M), R);
    eq(p, "сцена: O₁M = ответу", dist(S.pts.O1, S.pts.M), num(p.ans));
    /* M действительно в плоскости сечения */
    eq(p, "сцена: M на высоте сечения", S.pts.M[1], S.pts.O1[1]);
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

if (errs.length) {
  console.log("РАСХОЖДЕНИЯ (" + errs.length + "):");
  errs.forEach(e => console.log("  - " + e));
  process.exit(1);
}
console.log("OK " + n + " задач, расхождений 0");
