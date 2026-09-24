/* Независимый верификатор банка «Цилиндр».
   Числа берутся регулярками из текста cond, ответ пересчитывается
   своей формулой по модели задачи (id -> модель), затем сверяется
   геометрия сцены с числами условия. */
const api = require("./_load.js")("./problems-cil.js", "P_CIL");
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

/* id -> проверка: возвращает ожидаемый ответ, попутно сверяя сцену */
const MODELS = {
  "cil-01": (p, n, m) => {                     /* V/π по r и h */
    const [r, h] = n;
    const b = p.scene.bodies[0];
    chk(p.id, b.r === r && b.h === h, "r/h сцены не из условия");
    chk(p.id, eq(dist(m, "O", "O1"), h), "OO1 не равно h");
    return r * r * h;
  },
  "cil-02": (p, n, m) => {                     /* r по V/π и h */
    const [V, h] = n;
    const r = Math.sqrt(V / h);
    const b = p.scene.bodies[0];
    chk(p.id, b.h === h, "высота сцены не из условия");
    chk(p.id, eq(b.r, r), "радиус сцены не равен ответу");
    chk(p.id, eq(dist(m, "O", "A"), r), "OA не равно радиусу");
    return r;
  },
  "cil-04": (p, n) => {                        /* боковая поверхность */
    const [r, h] = n;
    const b = p.scene.bodies[0];
    chk(p.id, b.r === r && b.h === h, "r/h сцены не из условия");
    return 2 * r * h;
  },
  "cil-05": (p, n) => {                        /* полная поверхность */
    const [r, h] = n;
    const b = p.scene.bodies[0];
    chk(p.id, b.r === r && b.h === h, "r/h сцены не из условия");
    return 2 * r * (r + h);
  },
  "cil-06": (p, n, m) => {                     /* осевое сечение */
    const [r, h] = n;
    const b = p.scene.bodies[0];
    chk(p.id, b.r === r && b.h === h, "r/h сцены не из условия");
    chk(p.id, eq(dist(m, "A", "B"), 2 * r), "AB не равно диаметру");
    chk(p.id, eq(dist(m, "A", "A1"), h) && eq(dist(m, "B", "B1"), h), "образующая не равна высоте");
    return 2 * r * h;
  },
  "cil-07": (p, n, m) => {                     /* переливание воды */
    const [h1, k] = n;                          /* уровень 24, «в 2 раза» */
    const ans = h1 / (k * k);
    const [b1, b2] = p.scene.bodies;
    chk(p.id, b1.water.h === h1, "уровень воды в первом сосуде не из условия");
    chk(p.id, eq(b2.r / b1.r, k), "отношение радиусов сосудов не из условия");
    chk(p.id, eq(b2.water.h, ans), "уровень во втором сосуде не равен ответу");
    chk(p.id, eq(dist(m, "M", "N"), ans), "MN не равно ответу");
    chk(p.id, eq(b1.r * b1.r * b1.water.h, b2.r * b2.r * b2.water.h), "объём воды не сохраняется");
    return ans;
  },
  "cil-08": (p, n) => {                        /* удвоение радиуса */
    const [k] = n;
    const [b1, b2] = p.scene.bodies;
    chk(p.id, eq(b2.r / b1.r, k), "отношение радиусов сцены не из условия");
    chk(p.id, b1.h === b2.h, "высоты в сцене различны");
    return k * k;
  },
  "cil-09": (p, n) => {                        /* сравнение двух цилиндров */
    const [V1, kr, kh] = n;
    const [b1, b2] = p.scene.bodies;
    chk(p.id, eq(b2.r / b1.r, kr), "отношение радиусов сцены не из условия");
    chk(p.id, eq(b1.h / b2.h, kh), "отношение высот сцены не из условия");
    return V1 * kr * kr / kh;
  },
  "cil-10": (p, n, m) => {                     /* погружение детали */
    const [S, dh] = n;
    const [b1, b2] = p.scene.bodies;
    chk(p.id, eq(Math.PI * b1.r * b1.r, S), "площадь основания бака не из условия");
    chk(p.id, eq(b1.water.h - b2.circles[0].c[1], dh), "подъём уровня в сцене не равен данному");
    chk(p.id, eq(dist(m, "_m", "_n"), dh), "отметка между уровнями не равна подъёму");
    chk(p.id, b1.water.h < b1.h, "вода выше стенок бака");
    return S * dh;
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
