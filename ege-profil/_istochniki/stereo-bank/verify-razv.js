/* Независимый верификатор банка «Развёртки».
   Числа берутся регулярками из текста cond, ответ пересчитывается
   своей формулой по модели (id -> модель), геометрия сцены
   (радиус, образующая SA, угол сектора) сверяется с условием. */
const api = require("./_load.js")("./problems-razv.js", "P_RAZV");
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

/* конус с данными r и h + именованные O, S, A */
function baseCone(p, r, h, m) {
  const b = p.scene.bodies[0];
  chk(p.id, eq(b.r, r) && eq(b.h, h), "r/h сцены не из условия");
  chk(p.id, eq(dist(m, "O", "S"), h), "OS не равно высоте");
  chk(p.id, eq(dist(m, "O", "A"), r), "OA не равно радиусу");
  return b;
}
/* сектор из круга радиуса R с углом alpha, свёрнутый в конус */
function sectorCone(p, R, alpha, m) {
  const b = p.scene.bodies[0];
  const r = R * alpha / 360;
  chk(p.id, eq(b.r, r), "радиус конуса не равен R·α/360");
  chk(p.id, eq(dist(m, "S", "A"), R, 1e-9), "образующая SA не равна радиусу круга");
  chk(p.id, b.sector && eq(b.sector.tl, rad(alpha), 1e-9), "sector.tl не равен углу сектора");
  return r;
}

const MODELS = {
  /* --- сектор → конус --- */
  "razv-01": (p, n, m) => { const [R, a] = n; return sectorCone(p, R, a, m); },
  "razv-02": (p, n, m) => { const [R, a] = n; return sectorCone(p, R, a, m); },
  "razv-03": (p, n, m) => { const [R] = n; return sectorCone(p, R, 180, m); }, /* полукруг */
  "razv-04": (p, n, m) => { const [R, a] = n; return sectorCone(p, R, a, m); },
  /* --- угол развёртки --- */
  "razv-05": (p, n, m) => {
    const [r, l] = n;
    baseCone(p, r, Math.sqrt(l * l - r * r), m);
    chk(p.id, eq(dist(m, "S", "A"), l), "SA не равно образующей");
    return 360 * r / l;
  },
  "razv-06": (p, n, m) => {
    const [r, l] = n;
    baseCone(p, r, Math.sqrt(l * l - r * r), m);
    chk(p.id, eq(dist(m, "S", "A"), l), "SA не равно образующей");
    return 360 * r / l;
  },
  "razv-07": (p, n, m) => {
    const [a, r] = n; const l = 360 * r / a;
    const b = p.scene.bodies[0];
    chk(p.id, eq(b.r, r), "радиус сцены не из условия");
    chk(p.id, eq(dist(m, "S", "A"), l), "SA не равно образующей-ответу");
    chk(p.id, b.sector && eq(b.sector.tl, rad(a), 1e-9), "sector.tl не равен углу развёртки");
    return l;
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
