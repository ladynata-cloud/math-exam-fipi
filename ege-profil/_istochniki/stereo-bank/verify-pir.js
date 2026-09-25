/* Независимый верификатор банка «Пирамида».
   Ответы пересчитываются от текста условия (числа берутся регулярками),
   длины всех подписанных отрезков и площади givenFaces сверяются со сценой. */
const api = require("./_load.js")("./problems-pir.js", "P_PIR");
const T = 1e-9;
const errs = [];

const nums = c => (c.match(/\d+(?:,\d+)?/g) || []).map(s => parseFloat(s.replace(",", ".")));
const hyp = (a, b) => Math.sqrt(a * a + b * b);

/* id → своя формула от чисел условия (в порядке появления в cond) */
const FORMULA = {
  "pir-01": n => n[0] * n[0] * n[1] / 3,          /* V = ⅓a²h */
  "pir-03": n => 3 * n[0] / n[1],                 /* h = 3V/S */
  "pir-04": n => 3 * n[0] / n[1],                 /* S = 3V/h */
  "pir-05": n => hyp(n[1], n[0] / 2),             /* апофема = √(h² + (a/2)²) */
  "pir-06": n => hyp(n[0], n[1] / 2),             /* ребро = √(h² + (d/2)²) */
  "pir-07": n => 0.5 * (4 * n[0]) * n[1],         /* Sбок = ½·P·l */
  "pir-08": n => n[0] * n[0] - (n[1] / 2) * (n[1] / 2),  /* h² = b² − (d/2)² */
  "pir-09": n => n[0],                            /* V ~ h */
  "pir-10": n => n[0] * n[0] * n[0],              /* V ~ k³ */
  "pir-11": n => n[0] / 3,                        /* Vпир = ⅓Vпризмы */
  "pir-12": n => 3 * n[0],                        /* Vкуба = 3Vпир */
  "pir-13": n => n[0] * n[1] / 3,                 /* V = ⅓Sh */
  "pir-14": n => 2 * n[0] / (4 * n[1]),           /* l = 2Sбок/P */
  "pir-16": n => hyp(n[1], n[0] / 2),             /* ребро = √(h² + (d/2)²) */
  "pir-17": n => n[0] / 8,                        /* V·(½)³ */
  "pir-18": n => n[0] * n[1] * n[2] / 6           /* V = abc/6 */
};

/* id → дополнительные проверки геометрии сцены против условия и ответа */
const EXTRA = {
  "pir-03": (q, n, ans) => { q.len("S", "O", ans, "высота (искомое)"); },
  "pir-04": (q, n, ans) => { q.area(["A", "B", "C", "D"], ans, "площадь основания (искомое)"); },
  "pir-05": (q, n, ans) => { q.len("S", "M", ans, "апофема (искомое)"); q.len("O", "M", n[0] / 2, "половина стороны"); },
  "pir-06": (q, n, ans) => { q.len("S", "B", ans, "боковое ребро (искомое)"); },
  "pir-07": (q, n) => { q.len("A", "D", n[0], "сторона грани SAD"); },
  "pir-08": (q, n, ans) => { q.sq("S", "O", ans, "квадрат высоты (искомое)"); },
  "pir-09": (q, n) => { q.ratio(["T", "Q"], ["S", "O"], n[0], "отношение высот"); },
  "pir-10": (q, n) => {
    q.ratio(["E", "H"], ["A", "D"], n[0], "отношение сторон");
    q.ratio(["T", "E"], ["S", "A"], n[0], "отношение боковых рёбер");
  },
  "pir-11": (q, n, ans, pts) => {
    const V = q.d("A", "B") * q.d("B", "C") * q.d("A", "A1");
    if (Math.abs(V - n[0]) > T) errs.push(`pir-11: объём призмы в сцене ${V}, в условии ${n[0]}`);
    if (Math.abs(pts["S"][1] - q.d("A", "A1")) > T) errs.push("pir-11: вершина пирамиды не на высоте призмы");
    if (Math.abs(pts["S"][0] - 1.5) > T || Math.abs(pts["S"][2] - 1.5) > T) errs.push("pir-11: вершина не в центре верхнего основания");
  },
  "pir-12": (q, n, ans, pts) => {
    const a = q.d("A", "B");
    if (Math.abs(q.d("B", "C") - a) > T || Math.abs(q.d("A", "A1") - a) > T) errs.push("pir-12: тело в сцене не куб");
    if (Math.abs(a * a * a - ans) > T) errs.push(`pir-12: объём куба в сцене ${a * a * a}, ответ ${ans}`);
    if (Math.abs(a * a * a / 3 - n[0]) > T) errs.push(`pir-12: объём пирамиды в сцене ${a * a * a / 3}, в условии ${n[0]}`);
    if (Math.abs(pts["S"][1] - a) > T) errs.push("pir-12: вершина пирамиды не в плоскости верхней грани");
  },
  "pir-13": (q, n, ans, pts) => {
    const M = [(pts["B"][0] + pts["C"][0]) / 2, 0, (pts["B"][2] + pts["C"][2]) / 2];
    if (Math.abs(pts["S"][0] - M[0]) > T || Math.abs(pts["S"][2] - M[2]) > T)
      errs.push("pir-13: SM в сцене не перпендикулярен основанию");
  },
  "pir-14": (q, n, ans) => { q.len("S", "M", ans, "апофема (искомое)"); q.len("A", "D", n[1], "сторона грани SAD"); },
  "pir-16": (q, n, ans) => { q.len("S", "D", ans, "боковое ребро (искомое)"); },
  "pir-17": (q, n, ans, pts) => {
    const V = polyArea([pts.A, pts.B, pts.C, pts.D]) * pts.S[1] / 3;
    if (Math.abs(V - n[0]) > T) errs.push(`pir-17: объём исходной пирамиды в сцене ${V}, в условии ${n[0]}`);
    [["K", "A"], ["L", "B"], ["M", "C"], ["N", "D"]].forEach(([k, v]) => {
      const m = [(pts[v][0] + pts.S[0]) / 2, (pts[v][1] + pts.S[1]) / 2, (pts[v][2] + pts.S[2]) / 2];
      if (Math.hypot(pts[k][0] - m[0], pts[k][1] - m[1], pts[k][2] - m[2]) > T)
        errs.push(`pir-17: ${k} в сцене не середина ребра S${v} — сечение не через середину высоты`);
    });
    const Vs = polyArea([pts.K, pts.L, pts.M, pts.N]) * (pts.S[1] - pts.K[1]) / 3;
    if (Math.abs(Vs - ans) > T) errs.push(`pir-17: объём отсечённой пирамиды в сцене ${Vs}, ответ ${ans}`);
  },
  "pir-18": (q, n, ans, pts) => {
    const vec = (P, Q) => [pts[Q][0] - pts[P][0], pts[Q][1] - pts[P][1], pts[Q][2] - pts[P][2]];
    const dot = (u, w) => u[0] * w[0] + u[1] * w[1] + u[2] * w[2];
    const da = vec("D", "A"), db = vec("D", "B"), dc = vec("D", "C");
    if (Math.abs(dot(da, db)) > T || Math.abs(dot(da, dc)) > T || Math.abs(dot(db, dc)) > T)
      errs.push("pir-18: рёбра DA, DB, DC в сцене не попарно перпендикулярны");
    q.len("D", "A", n[0], "ребро DA"); q.len("D", "B", n[1], "ребро DB"); q.len("D", "C", n[2], "ребро DC");
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
    ratio: (s1, s2, v, what) => {
      const r = dist(s1[0], s1[1]) / dist(s2[0], s2[1]);
      if (Math.abs(r - v) > T) errs.push(`${p.id}: ${what}: в сцене ${r}, в условии ${v}`);
    },
    area: (face, v, what) => {
      const A = polyArea(face.map(nm => pts[nm]));
      if (Math.abs(A - v) > T) errs.push(`${p.id}: ${what}: в сцене ${A}, должно быть ${v}`);
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
    q.area(gf.face, v, "площадь грани " + gf.face.join(""));
  }
  if (EXTRA[p.id]) EXTRA[p.id](q, n, want, pts);
}

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
