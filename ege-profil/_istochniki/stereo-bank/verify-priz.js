/* Независимый верификатор банка «Призма».
   Ответы пересчитываются от текста условия (числа берутся регулярками),
   длины всех подписанных отрезков и площади givenFaces сверяются со сценой. */
const api = require("./_load.js")("./problems-priz.js", "P_PRIZ");
const T = 1e-9;
const errs = [];

const stripV = s => s.replace(/([A-Za-z])1/g, "$1");   /* A1 → A в именах вершин */
const nums = c => (stripV(c).match(/\d+(?:,\d+)?/g) || []).map(s => parseFloat(s.replace(",", ".")));
const hyp = (a, b) => Math.sqrt(a * a + b * b);

/* id → своя формула от чисел условия (в порядке появления в cond) */
const FORMULA = {
  "priz-01": n => n[0] * n[0] * n[1],                       /* V квадратной призмы */
  "priz-02": n => n[0] / (n[1] * n[1]),                     /* h = V / a² */
  "priz-04": n => n[0] * n[1],                              /* V = S·h */
  "priz-05": n => n[0] * n[1] + (n[0] + n[1] + hyp(n[0], n[1])) * n[2],  /* 2·½ab + P·h */
  "priz-07": n => 6 * n[0] * n[1],                          /* Sбок шестиугольной */
  "priz-09": n => 12 * n[0] + 6 * n[1],                     /* сумма рёбер, n=6 */
  "priz-10": n => 6 * n[0] + 3 * n[1],                      /* сумма рёбер, n=3 */
  "priz-11": n => 2 * n[0] * n[0] + n[1] * n[1],            /* d² = 2a² + h² */
  "priz-12": n => n[0],                                     /* V ~ h */
  "priz-13": n => n[0],                                     /* V ~ h */
  "priz-14": n => 4 * n[0] * n[2],                          /* ΔSбок = P·Δh */
  "priz-15": n => 2 * n[0],                                 /* Sбок = 2·Sбок отсечённой */
  "priz-16": n => n[0] * n[1] / 3                           /* V = ⅓·S·ребро */
};

/* id → дополнительные проверки геометрии сцены против условия и ответа */
const EXTRA = {
  "priz-02": (q, n, ans) => { q.len("B", "B1", ans, "высота (искомое)"); },
  "priz-04": (q, n) => { q.perp("A", "B", "C"); },
  "priz-05": (q, n) => { q.perp("A", "B", "C"); q.len("B", "C", hyp(n[0], n[1]), "гипотенуза"); },
  "priz-11": (q, n, ans) => { q.sq("A", "C1", ans, "квадрат диагонали (искомое)"); },
  "priz-12": (q, n) => { q.ratio(["E", "E1"], ["A", "A1"], n[0], "отношение высот"); },
  "priz-13": (q, n) => { q.ratio(["A", "A1"], ["E", "E1"], n[0], "отношение высот"); },
  "priz-14": (q, n) => { q.len("K", "K1", n[2], "высота пояса"); q.len("A", "A1", n[1], "высота призмы"); },
  "priz-15": (q, n) => {
    const P = q.d("A", "B") + q.d("B", "C") + q.d("C", "A"), h = q.d("A", "A1");
    if (Math.abs(P * h - 2 * n[0]) > T) errs.push(`priz-15: Sбок исходной призмы в сцене ${P * h}, должно быть ${2 * n[0]}`);
    const Pc = q.d("M", "C") + q.d("C", "N") + q.d("N", "M");
    if (Math.abs(Pc * h - n[0]) > T) errs.push(`priz-15: Sбок отсечённой призмы в сцене ${Pc * h}, в условии ${n[0]}`);
  },
  "priz-16": (q, n, ans, pts) => {
    q.len("A", "A1", n[1], "боковое ребро");
    if (Math.abs(pts["A1"][0] - pts["A"][0]) > T || Math.abs(pts["A1"][2] - pts["A"][2]) > T)
      errs.push("priz-16: ребро A1A в сцене не перпендикулярно основанию");
  }
};

/* площадь плоского многоугольника в 3D */
function polyArea(vs) {
  const o = vs[0];
  let sx = 0, sy = 0, sz = 0;
  for (let i = 1; i + 1 < vs.length; i++) {
    const u = [vs[i][0] - o[0], vs[i][1] - o[1], vs[i][2] - o[2]];
    const v = [vs[i + 1][0] - o[0], vs[i + 1][1] - o[1], vs[i + 1][2] - o[2]];
    sx += u[1] * v[2] - u[2] * v[1];
    sy += u[2] * v[0] - u[0] * v[2];
    sz += u[0] * v[1] - u[1] * v[0];
  }
  return 0.5 * Math.hypot(sx, sy, sz);
}

for (const p of api.PROBLEMS) {
  const n = nums(p.cond);
  const want = api.parseAns(p.ans);
  const f = FORMULA[p.id];
  if (!f) { errs.push(p.id + ": в верификаторе нет модели"); continue; }
  const got = f(n);
  if (!isFinite(got) || Math.abs(got - want) > T)
    errs.push(`${p.id}: формула от условия даёт ${got}, в банке ответ ${p.ans}`);

  /* --- сцена --- */
  let sc;
  try { sc = api.sceneData(p); } catch (e) { errs.push(`${p.id}: сцена не строится: ${e.message}`); continue; }
  const pts = {};
  sc.gen.forEach(g => Object.assign(pts, g.pts));
  for (const [nm, spec] of Object.entries((p.construct && p.construct.points) || {})) {
    if (Array.isArray(spec) && spec[0] === "mid") {
      const a = pts[spec[1]], b = pts[spec[2]];
      pts[nm] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    } else {
      const fb = sc.firstBox;
      pts[nm] = fb ? [spec[0] * fb.a, spec[1] * fb.b, spec[2] * fb.c] : spec.slice();
    }
  }
  const dist = (a, b) => {
    const u = pts[a], v = pts[b];
    return Math.hypot(u[0] - v[0], u[1] - v[1], u[2] - v[2]);
  };
  const q = {
    d: dist,
    len: (a, b, v, what) => {
      const d = dist(a, b);
      if (Math.abs(d - v) > T) errs.push(`${p.id}: ${what}: отрезок ${a}${b} в сцене ${d}, должно быть ${v}`);
    },
    sq: (a, b, v, what) => {
      const d = dist(a, b);
      if (Math.abs(d * d - v) > T) errs.push(`${p.id}: ${what}: ${a}${b}² в сцене ${d * d}, должно быть ${v}`);
    },
    perp: (o, a, b) => {
      const u = [pts[a][0] - pts[o][0], pts[a][1] - pts[o][1], pts[a][2] - pts[o][2]];
      const v = [pts[b][0] - pts[o][0], pts[b][1] - pts[o][1], pts[b][2] - pts[o][2]];
      const d = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
      if (Math.abs(d) > T) errs.push(`${p.id}: угол ${a}${o}${b} в сцене не прямой`);
    },
    ratio: (s1, s2, v, what) => {
      const r = dist(s1[0], s1[1]) / dist(s2[0], s2[1]);
      if (Math.abs(r - v) > T) errs.push(`${p.id}: ${what}: в сцене ${r}, в условии ${v}`);
    }
  };

  /* все числовые подписи отрезков (labels + construct.segments) = длины в сцене */
  const numRe = /^\d+(?:,\d+)?$/;
  const tagged = [...(p.labels || []), ...((p.construct && p.construct.segments) || [])];
  for (const s of tagged) {
    if (s.length < 3 || typeof s[2] !== "string" || !numRe.test(s[2])) continue;
    q.len(s[0], s[1], parseFloat(s[2].replace(",", ".")), "подпись «" + s[2] + "»");
  }
  /* givenFaces: заявленная площадь = площадь грани в сцене */
  for (const gf of (p.givenFaces || [])) {
    const m = gf.text.match(/=\s*(\d+(?:,\d+)?)\s*$/);
    if (!m) continue;
    const v = parseFloat(m[1].replace(",", "."));
    const A = polyArea(gf.face.map(nm => pts[nm]));
    if (Math.abs(A - v) > T) errs.push(`${p.id}: грань ${gf.face.join("")} в сцене имеет площадь ${A}, подписано ${v}`);
  }
  if (EXTRA[p.id]) EXTRA[p.id](q, n, want, pts);
}

/* priz-03 убрана из банка 24.09.2026 как дубль задачи 27082 старого банка
   (та же модель, те же числа; старую задачу проверяет verify-legacy-*.js).
   Вернуть её в банк — значит снова задвоить задачу в тренажёре. */
const REMOVED_DUPES = { "priz-03": "27082" };
for (const [id, old] of Object.entries(REMOVED_DUPES))
  if (api.PROBLEMS.some(p => p.id === id)) errs.push(id + ": дубль старой задачи " + old + " снова в банке");

/* обратная проверка: модель в верификаторе есть, а задачи в банке нет —
   задачу потеряли или переименовали, и пропажу иначе никто бы не заметил */
for (const id of Object.keys(FORMULA))
  if (!api.PROBLEMS.some(p => p.id === id)) errs.push(id + ": модель есть, задачи нет");
for (const id of Object.keys(EXTRA))
  if (!api.PROBLEMS.some(p => p.id === id)) errs.push(id + ": модель есть, задачи нет");

if (errs.length) {
  console.log(`РАСХОЖДЕНИЯ (${errs.length}):`);
  errs.forEach(e => console.log("  - " + e));
  process.exit(1);
}
console.log(`OK ${api.PROBLEMS.length} задач, расхождений 0`);
