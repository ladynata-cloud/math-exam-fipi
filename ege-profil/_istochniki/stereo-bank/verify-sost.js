/* Независимый верификатор банка «Составные тела».
   Условие этих задач — стандартный текст плюс числа на рисунке (labels),
   поэтому исходные числа берутся из подписей рёбер. Верификатор сам,
   НЕ глядя в footprint/faceRects, восстанавливает контур основания:
   id → какие стороны подписаны и как выводятся недостающие (замыкание
   прямоугольного контура), затем строит многоугольник по направлениям
   обхода, считает площадь шнуровкой, периметр — суммой сторон, и своей
   формулой получает ответ (V = S·h; S_пов = 2S + P·h; d² по координатам).
   Сверка сцены: каждая сторона контура (в т.ч. выведенная) и высота
   равны расстояниям между точками сцены; координаты вершин сцены
   совпадают с восстановленным контуром; faceRects лишь проверяются на
   точное разбиение (сумма площадей = площадь контура, без перекрытий).
   Для задачи на угол (sost-07) контур не нужен: тангенс пересчитывается
   от подписанных рёбер, а сцена сверяется покомпонентно (вертикальность
   ребра, прямоугольность грани, длины, разбиение faceRects). */
const api = require("./_load.js")("./problems-sost.js", "P_SOST");
const { PROBLEMS, parseAns, sceneData, segKey } = api;

const EPS = 1e-9;
const num = s => parseFloat(String(s).replace(",", "."));

const ptsOf = p => {
  const o = {};
  sceneData(p).gen.forEach(g => Object.assign(o, g.pts));
  return o;
};
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
const dist = (a, b) => Math.sqrt(d2(a, b));

/* label-значение стороны по паре вершин */
function labelGetter(p, errs) {
  const map = {};
  for (const [a, b, t] of (p.labels || []))
    if (/^\d+(,\d+)?$/.test(t)) map[segKey(a, b)] = num(t);
  return (a, b) => {
    const k = segKey(a, b);
    if (!(k in map)) { errs.push(`${p.id}: на рисунке нет подписи ребра ${a}${b}`); return NaN; }
    return map[k];
  };
}

/* контур из направлений и длин, старт в A=(0,0) */
function walk(dirs, lens) {
  const poly = [[0, 0]];
  let x = 0, z = 0;
  for (let i = 0; i < dirs.length; i++) {
    x += dirs[i][0] * lens[i]; z += dirs[i][1] * lens[i];
    poly.push([x, z]);
  }
  return poly;          /* последняя точка обязана вернуться в (0,0) */
}
const shoelace = poly => {
  let s = 0;
  for (let i = 0; i < poly.length - 1; i++)
    s += poly[i][0] * poly[i + 1][1] - poly[i + 1][0] * poly[i][1];
  return Math.abs(s) / 2;
};

/* разбиение faceRects: точное покрытие площади area, без перекрытий */
function checkRects(p, area, errs) {
  const rects = p.scene.bodies[0].faceRects || [];
  let sum = 0;
  for (const [x0, z0, x1, z1] of rects) sum += Math.abs((x1 - x0) * (z1 - z0));
  if (!(Math.abs(sum - area) < EPS))
    errs.push(`${p.id}: faceRects покрывают ${sum}, а площадь основания ${area}`);
  for (let i = 0; i < rects.length; i++)
    for (let j = i + 1; j < rects.length; j++) {
      const [a0, b0, a1, b1] = rects[i], [c0, d0, c1, d1] = rects[j];
      const ox = Math.min(a1, c1) - Math.max(a0, c0), oz = Math.min(b1, d1) - Math.max(b0, d0);
      if (ox > EPS && oz > EPS) errs.push(`${p.id}: faceRects ${i} и ${j} перекрываются`);
    }
}

/* id → восстановление: g(a,b) — подписанная длина.
   Возвращает { model, names, dirs, lens, h } */
const RECON = {
  "sost-01": g => {                       /* Г, объём */
    const AB = g("A", "B"), BC = g("B", "C"), DE = g("D", "E"), EF = g("E", "F");
    return { model: "V", names: "ABCDEF",
      dirs: [[1, 0], [0, 1], [-1, 0], [0, 1], [-1, 0], [0, -1]],
      lens: [AB, BC, AB - EF, DE, EF, BC + DE], h: g("A", "A1") };
  },
  "sost-02": g => {                       /* Т, объём */
    /* CD подписана на равном верхнем ребре C1D1; BC выводится из FG, HA, DE */
    const AB = g("A", "B"), CD = g("C1", "D1"), DE = g("D", "E"),
          EF = g("E", "F"), FG = g("F", "G"), HA = g("H", "A");
    return { model: "V", names: "ABCDEFGH",
      dirs: [[1, 0], [0, 1], [-1, 0], [0, 1], [-1, 0], [0, -1], [-1, 0], [0, -1]],
      lens: [AB, FG + HA - DE, CD, DE, EF, FG, AB - CD - EF, HA], h: g("A", "A1") };
  },
  "sost-03": g => {                       /* ступенька, объём */
    /* AB подписана на равном верхнем ребре A1B1 */
    const AB = g("A1", "B1"), BC = g("B", "C"), CD = g("C", "D"),
          DE = g("D", "E"), EF = g("E", "F"), FG = g("F", "G");
    return { model: "V", names: "ABCDEFGH",
      dirs: [[1, 0], [0, 1], [-1, 0], [0, 1], [-1, 0], [0, 1], [-1, 0], [0, -1]],
      lens: [AB, BC, CD, DE, EF, FG, AB - CD - EF, BC + DE + FG], h: g("A", "A1") };
  },
  "sost-04": g => {                       /* П, поверхность */
    const AB = g("A", "B"), BC = g("B", "C"), CD = g("C", "D"),
          DE = g("D", "E"), EF = g("E", "F"), FG = g("F", "G");
    return { model: "S", names: "ABCDEFGH",
      dirs: [[1, 0], [0, 1], [-1, 0], [0, -1], [-1, 0], [0, 1], [-1, 0], [0, -1]],
      lens: [AB, BC, CD, DE, EF, FG, AB - CD - EF, BC - DE + FG], h: g("A", "A1") };
  },
  "sost-06": g => {                       /* Г, квадрат расстояния B–F1 */
    const AB = g("A", "B"), BC = g("B", "C"), DE = g("D", "E"), EF = g("E", "F");
    return { model: "D2", from: "B", to: "F", names: "ABCDEF",
      dirs: [[1, 0], [0, 1], [-1, 0], [0, 1], [-1, 0], [0, -1]],
      lens: [AB, BC, AB - EF, DE, EF, BC + DE], h: g("A", "A1") };
  }
};

/* id → задачи без контурной модели (пересчёт напрямую от подписей) */
const SPECIAL = {
  "sost-07": (p, errs) => {               /* тангенс угла F1EF в вертикальной грани */
    const g = labelGetter(p, errs);
    const L = g("E", "F"), H = g("F", "F1");
    if (!isFinite(L) || !isFinite(H)) return;
    const got = parseAns(p.ans);
    if (!(Math.abs(H / L - got) < EPS))
      errs.push(`${p.id}: по числам условия tg = ${H / L}, в банке ans=${p.ans}`);

    const pt = ptsOf(p);
    if (!(Math.abs(dist(pt.E, pt.F) - L) < EPS))
      errs.push(`${p.id}: сцена: |EF| = ${dist(pt.E, pt.F)}, по условию ${L}`);
    if (!(Math.abs(dist(pt.F, pt.F1) - H) < EPS))
      errs.push(`${p.id}: сцена: |FF1| = ${dist(pt.F, pt.F1)}, по условию ${H}`);
    /* FF1 вертикально, EF горизонтально — угол при F прямой */
    if (Math.abs(pt.F1[0] - pt.F[0]) > EPS || Math.abs(pt.F1[2] - pt.F[2]) > EPS || !(pt.F1[1] > pt.F[1]))
      errs.push(`${p.id}: сцена: ребро FF1 не вертикально`);
    if (Math.abs(pt.E[1] - pt.F[1]) > EPS)
      errs.push(`${p.id}: сцена: ребро EF не горизонтально`);
    /* грань EFF1E1 — прямоугольник */
    if (!(Math.abs(dist(pt.E, pt.E1) - H) < EPS) || Math.abs(pt.E1[0] - pt.E[0]) > EPS || Math.abs(pt.E1[2] - pt.E[2]) > EPS)
      errs.push(`${p.id}: сцена: грань EFF1E1 не прямоугольник`);
    /* тангенс, посчитанный прямо по сцене */
    const tg = dist(pt.F, pt.F1) / dist(pt.E, pt.F);
    if (!(Math.abs(tg - got) < EPS))
      errs.push(`${p.id}: сцена: tg∠F1EF = ${tg}, ans=${p.ans}`);
    /* все числовые подписи labels против сцены */
    for (const [a, b, t] of (p.labels || [])) {
      if (!/^\d+(,\d+)?$/.test(t)) continue;
      const Ld = dist(pt[a], pt[b]);
      if (!(Math.abs(Ld - num(t)) < EPS))
        errs.push(`${p.id}: подпись ${a}${b}="${t}", а в сцене |${a}${b}| = ${Ld}`);
    }
    /* faceRects — точное разбиение основания сцены */
    const fp = p.scene.bodies[0].footprint;
    checkRects(p, shoelace(fp.concat([fp[0]])), errs);
  }
};

const errs = [];
for (const p of PROBLEMS) {
  if (SPECIAL[p.id]) { SPECIAL[p.id](p, errs); continue; }
  const rec = RECON[p.id];
  if (!rec) { errs.push(`${p.id}: нет модели в верификаторе`); continue; }
  const g = labelGetter(p, errs);
  const { model, names, dirs, lens, h, from, to } = rec(g);
  if (lens.some(v => !isFinite(v)) || !isFinite(h)) continue;

  const poly = walk(dirs, lens);
  const last = poly[poly.length - 1];
  if (Math.abs(last[0]) > EPS || Math.abs(last[1]) > EPS) {
    errs.push(`${p.id}: контур из подписанных рёбер не замыкается (${last})`);
    continue;
  }
  const area = shoelace(poly);
  const perim = lens.reduce((s, v) => s + v, 0);

  let exp;
  if (model === "V") exp = area * h;
  else if (model === "S") exp = 2 * area + perim * h;
  else {                                          /* D2 */
    const i1 = names.indexOf(from), i2 = names.indexOf(to);
    const dx = poly[i1][0] - poly[i2][0], dz = poly[i1][1] - poly[i2][1];
    exp = dx * dx + dz * dz + h * h;
  }
  const got = parseAns(p.ans);
  if (!(Math.abs(exp - got) < EPS))
    errs.push(`${p.id}: по числам условия выходит ${exp}, в банке ans=${p.ans}`);

  /* --- сверка сцены с условием --- */
  const pt = ptsOf(p);
  const n = names.length;
  for (let i = 0; i < n; i++) {
    const a = names[i], b = names[(i + 1) % n];
    const L = dist(pt[a], pt[b]);
    if (!(Math.abs(L - lens[i]) < EPS))
      errs.push(`${p.id}: сцена: |${a}${b}| = ${L}, по условию ${lens[i]}`);
    /* координаты вершин сцены = восстановленный контур (низ и верх) */
    const [x, z] = poly[i];
    if (d2(pt[a], [x, 0, z]) > EPS)
      errs.push(`${p.id}: сцена: вершина ${a} в ${pt[a]}, по контуру (${x},0,${z})`);
    if (d2(pt[a + "1"], [x, h, z]) > EPS)
      errs.push(`${p.id}: сцена: вершина ${a}1 в ${pt[a + "1"]}, по контуру (${x},${h},${z})`);
  }
  const hz = dist(pt.A, pt.A1);
  if (!(Math.abs(hz - h) < EPS))
    errs.push(`${p.id}: сцена: высота |AA1| = ${hz}, по условию ${h}`);
  /* все числовые подписи labels против длин отрезков сцены */
  for (const [a, b, t] of (p.labels || [])) {
    if (!/^\d+(,\d+)?$/.test(t)) continue;
    const L = dist(pt[a], pt[b]);
    if (!(Math.abs(L - num(t)) < EPS))
      errs.push(`${p.id}: подпись ${a}${b}="${t}", а в сцене |${a}${b}| = ${L}`);
  }
  if (model === "D2" && !(Math.abs(d2(pt[from], pt[to + "1"]) - got) < EPS))
    errs.push(`${p.id}: сцена: |${from}${to}1|² = ${d2(pt[from], pt[to + "1"])}, ans=${p.ans}`);

  /* faceRects — точное разбиение восстановленной площади, без перекрытий */
  checkRects(p, area, errs);
}

/* обратная проверка: модель в верификаторе есть, а задачи в банке нет —
   задачу потеряли или переименовали, и пропажу иначе никто бы не заметил */
for (const id of Object.keys(RECON))
  if (!PROBLEMS.some(p => p.id === id)) errs.push(id + ": модель есть, задачи нет");
for (const id of Object.keys(SPECIAL))
  if (!PROBLEMS.some(p => p.id === id)) errs.push(id + ": модель есть, задачи нет");

if (errs.length) {
  console.log(`РАСХОЖДЕНИЯ (${errs.length}):`);
  errs.forEach(e => console.log("  - " + e));
  process.exit(1);
}
console.log(`OK ${PROBLEMS.length} задач, расхождений 0`);
