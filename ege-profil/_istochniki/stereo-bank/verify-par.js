/* Независимый верификатор банка «Параллелепипед» (problems-par.js, P_PAR).
   Числа берутся регулярками ИЗ ТЕКСТА cond, ответ пересчитывается по
   захардкоженной модели задачи и сравнивается с ans (допуск 1e-9).
   Дополнительно: длины всех подписанных числами отрезков (labels) и
   ключевые размеры каждой модели сверяются с расстояниями между
   точками сцены (api.sceneData). */
const api = require("./_load.js")("./problems-par.js", "P_PAR");
const EPS = 1e-9;

/* числа из условия: убираем индексы вершин (A1 → A), берём 12 и 2,5 */
const stripV = s => s.replace(/([A-Za-z])1/g, "$1");
const nums = s => (stripV(s).match(/\d+(?:,\d+)?/g) || []).map(t => parseFloat(t.replace(",", ".")));

const sq = x => x * x;
const surf = (a, b, c) => 2 * (a * b + b * c + a * c);

/* числа при словах условия — для условий, написанных своими словами
   (26.09.2026), где порядок чисел в тексте не совпадает с порядком
   аргументов модели. Нет числа — модель падает (расхождение) */
const grab = (p, re) => {
  const m = stripV(p.cond).match(re);
  if (!m) throw new Error("в условии нет числа по " + re);
  return m.slice(1).map(t => parseFloat(t.replace(",", ".")));
};

/* геометрия сцены */
function ptsOf(p) {
  const pts = {};
  api.sceneData(p).gen.forEach(g => Object.assign(pts, g.pts));
  return pts;
}
const mkD = pts => (u, v) => {
  if (!(u in pts) || !(v in pts)) return NaN;
  const a = pts[u], b = pts[v];
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
};

/* сверка «три ребра из одной вершины box-а = мультимножество чисел» */
function dims3(D, names, vals) {
  const have = names.map(([u, v]) => D(u, v)).sort((x, y) => x - y);
  const want = vals.slice().sort((x, y) => x - y);
  return have.map((h, i) => ["изм." + (i + 1) + "(" + names[i][0] + names[i][1] + "…)", h, want[i]]);
}
const box1 = [["A", "B"], ["A", "D"], ["A", "A1"]];
const box2 = [["K", "L"], ["K", "N"], ["K", "K1"]];

/* модели: id → (n, D) → { ans, geo: [[что, факт, ожидание], …] } */
const MODELS = {
  "par-01": (n, D) => ({ ans: n[0] * n[1] * n[2], geo: [["AB", D("A", "B"), n[0]], ["AD", D("A", "D"), n[1]], ["AA1", D("A", "A1"), n[2]]] }),
  "par-02": (n, D) => ({ ans: n[0] / (n[1] * n[2]), geo: [["AB", D("A", "B"), n[1]], ["BC", D("B", "C"), n[2]], ["AA1", D("A", "A1"), n[0] / (n[1] * n[2])]] }),
  "par-03": (n, D) => ({ ans: n[0] * n[0], geo: [["EF=2·AB", D("E", "F"), n[0] * D("A", "B")], ["EH=2·AD", D("E", "H"), n[0] * D("A", "D")], ["EE1=AA1", D("E", "E1"), D("A", "A1")]] }),
  "par-04": (n, D) => ({ ans: n[0], geo: [["GG1=3·CC1", D("G", "G1"), n[0] * D("C", "C1")], ["EF=AB", D("E", "F"), D("A", "B")], ["EH=AD", D("E", "H"), D("A", "D")]] }),
  "par-05": (n, D) => ({ ans: n[0] * n[1], geo: [["AB·AA1", D("A", "B") * D("A", "A1"), n[0]], ["AD", D("A", "D"), n[1]]] }),
  "par-06": (n, D) => ({ ans: Math.sqrt(n[0] * n[1] * n[2]), geo: [["AB·AD", D("A", "B") * D("A", "D"), n[0]], ["AB·AA1", D("A", "B") * D("A", "A1"), n[1]], ["AD·AA1", D("A", "D") * D("A", "A1"), n[2]]] }),
  "par-07": (n, D) => ({ ans: Math.sqrt(n[0] * n[1] * n[2]), geo: [["AB·AD", D("A", "B") * D("A", "D"), n[0]], ["AB·AA1", D("A", "B") * D("A", "A1"), n[1]], ["AD·AA1", D("A", "D") * D("A", "A1"), n[2]]] }),
  "par-08": (n, D) => ({ ans: surf(n[0], n[1], n[2]), geo: dims3(D, box1, n) }),
  "par-09": (n, D) => ({ ans: (n[0] / 2 - n[1] * n[2]) / (n[1] + n[2]), geo: [["AB", D("A", "B"), n[1]], ["AD", D("A", "D"), n[2]], ["AA1", D("A", "A1"), (n[0] / 2 - n[1] * n[2]) / (n[1] + n[2])]] }),
  "par-10": (n, D) => ({ ans: surf(n[0], n[1], n[2]), geo: dims3(D, box1, n) }),
  "par-11": (n, D) => ({ ans: (n[0] / 2 - n[1] * n[2]) / (n[1] + n[2]), geo: [["AB", D("A", "B"), n[1]], ["BC", D("B", "C"), n[2]], ["BB1", D("B", "B1"), (n[0] / 2 - n[1] * n[2]) / (n[1] + n[2])]] }),
  "par-12": (n, D) => ({ ans: 2 * (n[0] + n[1]) * n[3], geo: [["AB", D("A", "B"), n[0]], ["AD", D("A", "D"), n[1]], ["AA1", D("A", "A1"), n[2]], ["A1E1", D("A1", "E1"), n[3]], ["EE1", D("E", "E1"), n[2] + n[3]]] }),
  "par-13": (n, D) => ({ ans: 2 * (n[0] + n[1] + (n[0] / n[2]) * (n[1] / n[2])), geo: [["AB", D("A", "B"), n[2]], ["AD", D("A", "D"), n[0] / n[2]], ["AA1", D("A", "A1"), n[1] / n[2]]] }),
  "par-14": (n, D) => ({ ans: 2 * n[3] * (n[1] + n[2]), geo: [["AB", D("A", "B"), n[0]], ["AD", D("A", "D"), n[1]], ["AA1", D("A", "A1"), n[2]]] }),
  "par-15": (n, D) => ({ ans: sq(n[0]) + sq(n[1]) + sq(n[2]), geo: [["AB", D("A", "B"), n[0]], ["AD", D("A", "D"), n[1]], ["AA1", D("A", "A1"), n[2]], ["AC1²", sq(D("A", "C1")), sq(n[0]) + sq(n[1]) + sq(n[2])]] }),
  "par-16": (n, D) => ({ ans: Math.hypot(n[0], n[1]) * n[2], geo: [["AB", D("A", "B"), n[0]], ["BC", D("B", "C"), n[1]], ["AA1", D("A", "A1"), n[2]], ["AC", D("A", "C"), Math.hypot(n[0], n[1])]] }),
  "par-17": (n, D) => ({ ans: Math.sqrt(sq(n[0]) - sq(n[1]) - sq(n[2])), geo: [["AD", D("A", "D"), n[1]], ["AA1", D("A", "A1"), n[2]], ["AC1", D("A", "C1"), n[0]], ["AB", D("A", "B"), Math.sqrt(sq(n[0]) - sq(n[1]) - sq(n[2]))]] }),
  "par-18": (n, D, p) => {                    /* два измерения, потом диагональ; третье измерение — искомое */
    const [a, b] = grab(p, /равны (\d+(?:,\d+)?) и (\d+(?:,\d+)?)/), [d] = grab(p, /[Дд]иагональ[^0-9.]*?(\d+(?:,\d+)?)/);
    const c = Math.sqrt(sq(d) - sq(a) - sq(b));
    return { ans: c, geo: [["AD", D("A", "D"), a], ["AB", D("A", "B"), b], ["AC1", D("A", "C1"), d], ["AA1", D("A", "A1"), c],
      ["числа условия — ровно [a, b, d]", n.length === 3 && n[0] === a && n[1] === b && n[2] === d ? 1 : 0, 1]] };
  },
  "par-19": (n, D) => ({ ans: Math.sqrt(sq(n[1]) - 2 * sq(n[0])), geo: [["AB", D("A", "B"), n[0]], ["AD", D("A", "D"), n[0]], ["AC1", D("A", "C1"), n[1]], ["AA1", D("A", "A1"), Math.sqrt(sq(n[1]) - 2 * sq(n[0]))]] }),
  "par-20": (n, D) => ({ ans: Math.sqrt(sq(n[0]) + sq(n[1]) + sq(n[2])), geo: [["AB", D("A", "B"), n[0]], ["AD", D("A", "D"), n[1]], ["AA1", D("A", "A1"), n[2]], ["AC1", D("A", "C1"), Math.sqrt(sq(n[0]) + sq(n[1]) + sq(n[2]))]] }),
  "par-21": (n, D) => ({ ans: Math.sqrt(sq(n[0]) + sq(n[1]) + sq(n[2])), geo: [["AB", D("A", "B"), n[0]], ["AD", D("A", "D"), n[1]], ["AA1", D("A", "A1"), n[2]], ["BD1", D("B", "D1"), Math.sqrt(sq(n[0]) + sq(n[1]) + sq(n[2]))]] }),
  "par-22": (n, D) => ({ ans: sq(n[0]) + sq(n[1]), geo: [["AB", D("A", "B"), n[0]], ["BB1", D("B", "B1"), n[1]], ["AB1²", sq(D("A", "B1")), sq(n[0]) + sq(n[1])]] }),
  "par-23": (n, D) => ({ ans: 4 * (n[0] + n[1] + n[2]), geo: dims3(D, box1, n) }),
  "par-24": (n, D) => ({ ans: n[0] / 4 - n[1] - n[2], geo: [["AB", D("A", "B"), n[1]], ["AD", D("A", "D"), n[2]], ["AA1", D("A", "A1"), n[0] / 4 - n[1] - n[2]]] }),
  "par-25": (n, D) => ({ ans: 4 * (n[0] + n[1] + n[2]), geo: dims3(D, box1, n) }),
  "par-26": (n, D) => ({ ans: n[0] / 4 - n[1] - n[2], geo: [["AB", D("A", "B"), n[1]], ["AD", D("A", "D"), n[2]], ["AA1", D("A", "A1"), n[0] / 4 - n[1] - n[2]]] }),
  "par-27": (n, D) => ({ ans: 2 * (n[0] + n[2]), geo: [["AB", D("A", "B"), n[0]], ["BC", D("B", "C"), n[1]], ["CC1", D("C", "C1"), n[2]], ["BB1=CC1", D("B", "B1"), n[2]]] }),
  "par-28": (n, D) => ({ ans: 2 * (n[0] + n[2]), geo: [["AB", D("A", "B"), n[0]], ["AD", D("A", "D"), n[1]], ["AA1", D("A", "A1"), n[2]], ["DC=AB", D("D", "C"), n[0]], ["CC1=AA1", D("C", "C1"), n[2]]] }),
  "par-29": (n, D) => ({ ans: (n[0] * n[1] * n[2]) / (n[3] * n[4] * n[5]), geo: [...dims3(D, box1, n.slice(0, 3)), ...dims3(D, box2, n.slice(3, 6))] }),
  "par-32": (n, D) => ({ ans: surf(n[0], n[1], n[2]) / surf(n[3], n[4], n[5]), geo: [...dims3(D, box1, n.slice(0, 3)), ...dims3(D, box2, n.slice(3, 6))] }),
  "par-34": (n, D) => ({ ans: 0.5 * n[0] * n[1] * n[2] / 3, geo: [["AB", D("A", "B"), n[0]], ["BC", D("B", "C"), n[1]], ["AA1", D("A", "A1"), n[2]], ["BB1", D("B", "B1"), n[2]]] }),
  "par-35": (n, D) => ({ ans: n[0] * n[1] * n[2] / 3, geo: [["AB", D("A", "B"), n[0]], ["BC", D("B", "C"), n[1]], ["AA1", D("A", "A1"), n[2]], ["BB1", D("B", "B1"), n[2]]] })
};

const bad = [];
let checked = 0;

for (const p of api.PROBLEMS) {
  const model = MODELS[p.id];
  if (!model) { bad.push(p.id + ": нет модели в верификаторе"); continue; }
  const n = nums(p.cond);
  let pts, D;
  try { pts = ptsOf(p); D = mkD(pts); }
  catch (e) { bad.push(p.id + ": sceneData: " + e.message); continue; }

  let m;
  try { m = model(n, D, p); }
  catch (e) { bad.push(p.id + ": модель упала: " + e.message); continue; }

  /* 1) ответ */
  const want = api.parseAns(p.ans);
  if (!isFinite(m.ans) || Math.abs(m.ans - want) > EPS)
    bad.push(p.id + ": ответ по модели " + m.ans + ", в банке " + p.ans);

  /* 2) геометрия модели */
  for (const [what, got, exp] of m.geo || []) {
    if (!isFinite(got) || !isFinite(exp) || Math.abs(got - exp) > EPS)
      bad.push(p.id + ": сцена: " + what + " = " + got + ", ожидалось " + exp);
  }

  /* 3) все числовые подписи labels против расстояний в сцене */
  for (const [u, v, txt] of p.labels || []) {
    if (!/^\d+(?:,\d+)?$/.test(txt)) continue;    /* «?», буквенные подписи */
    const val = api.parseAns(txt);
    const d = D(u, v);
    if (!isFinite(d) || Math.abs(d - val) > EPS)
      bad.push(p.id + ": подпись " + u + v + " = " + txt + ", в сцене " + d);
  }
  checked++;
}

/* par-36 убрана из банка 24.09.2026 как дубль задачи 245363 старого банка
   (та же модель, те же числа; старую задачу проверяет verify-legacy-*.js).
   Вернуть её в банк — значит снова задвоить задачу в тренажёре. */
const REMOVED_DUPES = { "par-36": "245363" };
for (const [id, old] of Object.entries(REMOVED_DUPES))
  if (api.PROBLEMS.some(p => p.id === id)) bad.push(id + ": дубль старой задачи " + old + " снова в банке");

/* обратная проверка: модель в верификаторе есть, а задачи в банке нет —
   задачу потеряли или переименовали, и пропажу иначе никто бы не заметил */
for (const id of Object.keys(MODELS))
  if (!api.PROBLEMS.some(p => p.id === id)) bad.push(id + ": модель есть, задачи нет");

if (bad.length) {
  console.log("РАСХОЖДЕНИЯ (" + bad.length + "):");
  bad.forEach(e => console.log("  - " + e));
  process.exit(1);
}
console.log("OK " + checked + " задач, расхождений 0");
process.exit(0);
