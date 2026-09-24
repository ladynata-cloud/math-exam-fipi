/* Независимый верификатор банка «Куб».
   Числа берутся регулярками из текста cond, ответ пересчитывается своей
   формулой по модели задачи (id → модель захардкожено ниже) и сравнивается
   с ans. Дополнительно каждое число условия, которому отвечает отрезок
   сцены, сверяется с фактическим расстоянием между точками сцены,
   а все числовые подписи labels — с длинами подписанных отрезков. */
const api = require("./_load.js")("./problems-kub.js", "P_KUB");
const { PROBLEMS, parseAns, sceneData, segKey } = api;

const EPS = 1e-9;
const num = s => parseFloat(String(s).replace(",", "."));
/* числа условия: цифры, перед которыми нет латинской буквы или цифры
   (чтобы не цеплять индексы вершин вида A1B1C1D1) */
const condNums = c => (c.match(/(?<![A-Za-z0-9])\d+(?:,\d+)?/g) || []).map(num);

const ptsOf = p => {
  const o = {};
  sceneData(p).gen.forEach(g => Object.assign(o, g.pts));
  return o;
};
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
const dist = (a, b) => Math.sqrt(d2(a, b));

/* id → модель: n — числа условия по порядку, pt — точки сцены.
   Возвращает { exp: ожидаемый ответ, geo: [[описание, факт, надо], …] } */
const MODELS = {
  "kub-01": (n, pt) => ({            /* квадрат диагонали куба по ребру */
    exp: 3 * n[0] * n[0],
    geo: [["ребро AB", dist(pt.A, pt.B), n[0]], ["AC1²", d2(pt.A, pt.C1), 3 * n[0] * n[0]]]
  }),
  "kub-02": (n, pt) => ({            /* квадрат диагонали куба (BD1) */
    exp: 3 * n[0] * n[0],
    geo: [["ребро BC", dist(pt.B, pt.C), n[0]], ["BD1²", d2(pt.B, pt.D1), 3 * n[0] * n[0]]]
  }),
  "kub-03": (n, pt) => ({            /* квадрат диагонали грани по ребру */
    exp: 2 * n[0] * n[0],
    geo: [["ребро AB", dist(pt.A, pt.B), n[0]], ["AB1²", d2(pt.A, pt.B1), 2 * n[0] * n[0]]]
  }),
  "kub-04": (n, pt) => ({            /* объём по квадрату диагонали куба */
    exp: Math.pow(n[0] / 3, 1.5),
    geo: [["BD1² (диагональ куба)", d2(pt.B, pt.D1), n[0]],
          ["ребро AB", dist(pt.A, pt.B), Math.sqrt(n[0] / 3)]]
  }),
  "kub-05": (n, pt) => ({            /* объём по квадрату диагонали грани */
    exp: Math.pow(n[0] / 2, 1.5),
    geo: [["AB1² (диагональ грани)", d2(pt.A, pt.B1), n[0]],
          ["ребро AB", dist(pt.A, pt.B), Math.sqrt(n[0] / 2)]]
  }),
  "kub-06": (n, pt) => ({            /* объём по площади поверхности */
    exp: Math.pow(n[0] / 6, 1.5),
    geo: [["6·AB² (поверхность)", 6 * d2(pt.A, pt.B), n[0]]]
  }),
  "kub-07": (n, pt) => ({            /* площадь поверхности по ребру */
    exp: 6 * n[0] * n[0],
    geo: [["ребро AB", dist(pt.A, pt.B), n[0]]]
  }),
  "kub-08": (n, pt) => ({            /* площадь поверхности по ребру (дробь) */
    exp: 6 * n[0] * n[0],
    geo: [["ребро AB", dist(pt.A, pt.B), n[0]]]
  }),
  "kub-09": (n, pt) => ({            /* площадь поверхности по объёму */
    exp: 6 * Math.pow(n[0], 2 / 3),
    geo: [["AB³ (объём)", Math.pow(dist(pt.A, pt.B), 3), n[0]]]
  }),
  "kub-10": (n, pt) => ({            /* сумма длин всех рёбер */
    exp: 12 * n[0],
    geo: [["ребро AB", dist(pt.A, pt.B), n[0]]]
  }),
  "kub-12": (n, pt) => ({            /* прирост поверхности при ребре +1 */
    exp: 6 * ((n[0] + n[1]) ** 2 - n[0] ** 2),
    geo: [["ребро AB", dist(pt.A, pt.B), n[0]],
          ["ребро PQ (увеличенный куб)", dist(pt.P, pt.Q), n[0] + n[1]]]
  }),
  "kub-13": (n, pt) => ({            /* падение объёма при ребре ÷k */
    exp: n[0] ** 3,
    geo: [["PQ / AB (отношение рёбер)", dist(pt.P, pt.Q) / dist(pt.A, pt.B), n[0]]]
  }),
  "kub-14": (n, pt) => ({            /* отношение поверхностей двух кубов */
    exp: (n[0] / n[1]) ** 2,
    geo: [["ребро AB", dist(pt.A, pt.B), n[0]], ["ребро KL", dist(pt.K, pt.L), n[1]]]
  })
};

const errs = [];
for (const p of PROBLEMS) {
  const model = MODELS[p.id];
  if (!model) { errs.push(`${p.id}: нет модели в верификаторе`); continue; }
  const n = condNums(p.cond);
  const pt = ptsOf(p);
  const { exp, geo } = model(n, pt);
  const got = parseAns(p.ans);
  if (!(Math.abs(exp - got) < EPS))
    errs.push(`${p.id}: по условию выходит ${exp}, в банке ans=${p.ans}`);
  for (const [what, fact, want] of geo)
    if (!(Math.abs(fact - want) < EPS))
      errs.push(`${p.id}: сцена: ${what} = ${fact}, по условию ${want}`);
  /* все числовые подписи labels обязаны совпадать с длинами отрезков сцены */
  for (const [a, b, t] of (p.labels || [])) {
    if (!/^\d+(,\d+)?$/.test(t)) continue;
    const L = dist(pt[a], pt[b]);
    if (!(Math.abs(L - num(t)) < EPS))
      errs.push(`${p.id}: подпись ${a}${b}="${t}", а в сцене |${a}${b}| = ${L}`);
  }
}

/* kub-11 убрана из банка 24.09.2026 как дубль задачи 27081 старого банка
   (та же модель, те же числа; старую задачу проверяет verify-legacy-*.js).
   Вернуть её в банк — значит снова задвоить задачу в тренажёре. */
const REMOVED_DUPES = { "kub-11": "27081" };
for (const [id, old] of Object.entries(REMOVED_DUPES))
  if (PROBLEMS.some(p => p.id === id)) errs.push(id + ": дубль старой задачи " + old + " снова в банке");

/* обратная проверка: модель в верификаторе есть, а задачи в банке нет —
   задачу потеряли или переименовали, и пропажу иначе никто бы не заметил */
for (const id of Object.keys(MODELS))
  if (!PROBLEMS.some(p => p.id === id)) errs.push(id + ": модель есть, задачи нет");

if (errs.length) {
  console.log(`РАСХОЖДЕНИЯ (${errs.length}):`);
  errs.forEach(e => console.log("  - " + e));
  process.exit(1);
}
console.log(`OK ${PROBLEMS.length} задач, расхождений 0`);
