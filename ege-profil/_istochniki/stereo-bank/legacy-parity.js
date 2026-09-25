/* Ворота «старые задачи не изменились».
   Сравнивает объединённый data.js с опубликованной линейкой
   trainers/ege-profile-stereometry-3d/js/data.js (её банк — 143 задачи
   открытого банка с числовыми id):
     1) каждая старая задача есть в объединённом банке, все её поля
        совпадают точно (тексты, ответы, числа сцены, подписи, построения) —
        кроме явно разрешённых ниже (SCENE_FIXED, UNIT);
     2) внутри каждой темы старые задачи стоят первыми и в прежнем порядке —
        значит, позиция в stereo3.last.<тема> указывает на ту же задачу;
     3) чертёж тот же: выход sceneDataLegacy совпадает с выходом опубликованной
        sceneData — точки, рёбра, грани, окружности, поверхности, выносные
        подписи, флаги тел, масштаб s, groundY, toW каждой точки и firstBox;
        допуск 1e-9 (у задач SCENE_FIXED чертёж исправлен — не сравнивается);
     4) sceneData движка отдаёт для старой задачи то же самое, кроме размера
        в мире: s, groundY и toW каждой точки ровно в k = SCENE_WORLD / LEGACY_WORLD
        раз меньше (равномерное уменьшение — чтобы тело входило в кадр, как
        у новых задач); форма чертежа от этого не меняется;
     5) тела вращения получили matKind "round" и seeThrough (полупрозрачная
        стенка, как в опубликованной линейке), многогранники — matKind null;
     6) у каждой задачи из SCENE_FIXED есть положительные отпечатки своей
        правки (REQUIRED: размеры тел, px, подписи, отрезки, точки,
        построение, дуга обода) — частичный откат правки краснеет, даже
        если другие отличия от опубликованной линейки остались;
     7) у ВСЕХ задач линейки (288) построение что-то добавляет на сцену:
        точку, закраску, новый отрезок или подпись. Отрезок построения,
        совпавший с уже нарисованной линией, тренажёр не рисует второй раз
        (только выделяет её и показывает подпись построения) — построение
        из одних таких отрезков без подписей не показало бы ничего.

   Разрешённые отличия — решение владельца 24.09.2026 (линейка курса:
   максимум задач и качество чертежей по канону CLAUDE.md — «чертёж строится
   по числам задачи», «если объект назван в условии, он виден на рисунке»).
   Списки точные: задача из списка, у которой отличий нет, — тоже расхождение
   (исключение устарело). id, cond, ans, hint, sol, topic, group и порядок
   задач не меняются никогда: под id записан прогресс stereo3.status,
   под позицией в теме — stereo3.last.<тема>. Опубликованная линейка
   trainers/ege-profile-stereometry-3d не правится.

   node legacy-parity.js
   Пути: STEREO_ROOT (по умолчанию ../../trainers/stereo) и LEGACY_DATA
   (по умолчанию ../../../trainers/ege-profile-stereometry-3d/js/data.js,
   относительно этого файла).                                              */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

/* ---------- разрешённые отличия ---------- */

/* Чертёж исправлен: может отличаться только то, что рисуется, — scene,
   labels, construct, givenFaces (и выход sceneData). Почему — по задачам. */
const DRAWING_KEYS = ["scene", "labels", "construct", "givenFaces"];
const SCENE_FIXED = {
  /* красные: чертёж не соответствовал числам условия */
  "901": "высота пирамиды была 3 при OS = 9 по условию (втрое ниже); сторона основания — точная √(8/√3)",
  "676923": "у конуса и шара-призрака были общие имена O, P: подписи «3», «6», «?» стояли не на своих отрезках; шару — px 2. " +
    "Образующая SP = 6 (данное условия) подписана сразу: в построении подпись на SP не рисовалась — SP уже ребро конуса",
  "27136": "образующая второго конуса была больше в 2,73 раза, по условию — в 3; второму конусу — px 2",
  "27137": "образующие конусов различались в 1,05 раза, по условию равны; второму конусу — px 2",
  "324454": "картинка была общей с 525721 (h/r = 1,5), по числам условия h/r ≈ 3,76; отрезки высоты 3 и 6 из условия " +
    "подписаны (scene.pts: центр сечения _K без буквы)",
  "525721": "сцена была скопирована с 324454 и не пересчитана, по числам условия h/r ≈ 3,17; отрезки высоты 4 и 8 из условия " +
    "подписаны (scene.pts: центр сечения _K без буквы)",
  /* масштаб не единый: уровень воды в масштабе 1, радиус сосуда — нет */
  "27045": "радиус сосуда был 6, по условию (2000 см³ при уровне 12) √(2000/(12π)) ≈ 7,28 — масштаб не был единым, " +
    "панель показывала OP = 6; теперь r = Math.sqrt(2000/(12*Math.PI)), масштаб 1, unit не нужен. " +
    "Построение было [O, O1] — это уже ось, кнопка ничего не рисовала; теперь на оси уровень воды OK = 12 и подъём KO1 = 9",
  /* у двух тел одинаковые имена точек: тренажёр рисовал одно тело на месте другого */
  "27061": "второе тело — px 2: видны оба куба", "27081": "второе тело — px 2: видны оба куба",
  "27102": "второе тело — px 2: видны оба куба", "27130": "второе тело — px 2: видны оба куба",
  "27168": "второе тело — px 2: видны оба куба",
  "639940": "вторая призма — px 2: была гибридом шестиугольной и треугольной",
  "27094": "второй конус — px 2: был нарисован по точкам первого", "27095": "второй конус — px 2: был нарисован по точкам первого",
  "5077": "шар — px 2: рёбра цилиндра шли от точек шара", "245348": "шар — px 2: рёбра цилиндра шли от точек шара",
  /* точность */
  "245340": "сторона основания — точная √(8/√3), а не 2,15",
  /* мелкие дефекты */
  "27210": "две пустые подписи (тренажёр их не рисовал) убраны",
  "27188": "подписана глубина верхнего бруска (данные рисунка: брусок 1×1×1) — ответ не опирается на «кубик» из подсказки",
  "27062": "диагонали ромба 8 и 6 (данные условия) видны сразу (scene.segs + labels), а не только в построении; построение — треугольник AOB",
  "324457": "диагональ BD1 = 17 (данное условия) видна сразу (scene.segs + labels), а не только в построении",
  "639619": "пирамида нарисована телом сцены сразу, а не только в построении; в построении — её высота SO",
  /* данные не менялись — чертёж исправляет engine.js (sceneDataFromLegacy): обод
     части конуса — дугой, точки P, Q целого конуса в вырезе не рисуются */
  "27202": "обод основания части конуса — дуга 90°; P, Q в вырезе не рисуются",
  "27203": "обод основания части конуса — дуга 270°",
  "27204": "обод основания части конуса — дуга 60°; P, Q в вырезе не рисуются",
  "27205": "обод основания части конуса — дуга 300°"
};
/* Положительные отпечатки правок SCENE_FIXED: не «что-то отличается», а «правка
   на месте». Вид проверки и аргументы:
     ["prims", n]              — тел в scene.prims ровно n
     ["prim", i, ключ, знач.]  — scene.prims[i][ключ] = знач. (число — допуск 1e-12)
     ["label", a, b, текст]    — подпись условия (labels) на отрезке ab
     ["seg", a, b]             — отрезок данных условия, видимый сразу (scene.segs)
     ["pt", имя, [x, y, z]]    — вспомогательная точка сцены (scene.pts)
     ["cseg", a, b, текст|null] — отрезок построения (с подписью / без)
     ["noCseg", a, b]          — отрезка ab в построении нет (перенесён в сцену)
     ["cpt", имя, задание]     — точка построения
     ["cfill", [кольцо]]       — закраска построения
     ["coordLabel", i, {p,q,t}] — выносная подпись тела i старого формата
     ["coordLabelsNonEmpty", i] — у тела i нет пустых выносных подписей
     ["rimArc", i, градусы]    — обод тела i в сцене движка — дуга этого угла
     ["noPts", i, [имена]]     — у тела i в сцене движка нет этих точек
   Ключи REQUIRED и SCENE_FIXED совпадают: исправленная задача без отпечатка —
   тоже расхождение. */
const SQ3_ = Math.sqrt(3);
const REQUIRED = {
  "901": [["prim", 0, "h", 9], ["prim", 0, "a", Math.sqrt(8 / SQ3_)]],
  "676923": [["prim", 1, "px", "2"], ["label", "S", "P", "6"], ["noCseg", "S", "P"]],
  "27136": [["prim", 1, "px", "2"], ["prim", 1, "h", Math.sqrt(9 * 4.81 - 2.25)]],
  "27137": [["prim", 1, "px", "2"], ["prim", 1, "h", Math.sqrt(12.52 - 2.56)]],
  "324454": [["prim", 0, "r", Math.sqrt(18 / Math.PI)], ["prim", 0, "h", 9], ["pt", "_K", [0, 0, 6]],
    ["label", "S", "_K", "3"], ["label", "_K", "O", "6"]],
  "525721": [["prim", 0, "r", Math.sqrt(45 / Math.PI)], ["prim", 0, "h", 12], ["pt", "_K", [0, 0, 8]],
    ["label", "S", "_K", "4"], ["label", "_K", "O", "8"]],
  "27045": [["prim", 0, "r", Math.sqrt(2000 / (12 * Math.PI))], ["prim", 0, "h", 21], ["prim", 0, "fill", 12 / 21],
    ["cpt", "K", [0, 0, 12]], ["cseg", "O", "K", "12"], ["cseg", "K", "O1", "9"]],
  "27061": [["prim", 1, "px", "2"]], "27081": [["prim", 1, "px", "2"]], "27102": [["prim", 1, "px", "2"]],
  "27130": [["prim", 1, "px", "2"]], "27168": [["prim", 1, "px", "2"]], "639940": [["prim", 1, "px", "2"]],
  "27094": [["prim", 1, "px", "2"]], "27095": [["prim", 1, "px", "2"]],
  "5077": [["prim", 1, "px", "2"]], "245348": [["prim", 1, "px", "2"]],
  "245340": [["prim", 0, "a", Math.sqrt(8 / SQ3_)]],
  "27210": [["coordLabelsNonEmpty", 0]],
  "27188": [["coordLabel", 0, { p: [1, 0, 2], q: [1, 1, 2], t: "1" }]],
  "27062": [["seg", "A", "C"], ["seg", "B", "D"], ["label", "A", "C", "8"], ["label", "B", "D", "6"],
    ["noCseg", "A", "C"], ["noCseg", "B", "D"], ["cfill", ["A", "O", "B"]]],
  "324457": [["seg", "B", "D1"], ["label", "B", "D1", "17"], ["noCseg", "B", "D1"]],
  "639619": [["prims", 2], ["prim", 1, "kind", "pyramid_rect"], ["prim", 1, "h", 3], ["cseg", "S", "O", null]],
  "27202": [["rimArc", 0, 90], ["noPts", 0, ["P", "Q"]]],
  "27203": [["rimArc", 0, 270]],
  "27204": [["rimArc", 0, 60], ["noPts", 0, ["P", "Q"]]],
  "27205": [["rimArc", 0, 300]]
};
/* Поле unit (длина условия на единицу сцены): сцена нарисована в масштабе
   k ≠ 1, и панель измерений без него показывала длины сцены, а не условия
   (у 27125 OP = 0,6 при радиусе 6). Сцена этих задач не меняется (кроме тех,
   что есть и в SCENE_FIXED); правильность unit = 1/k проверяют verify-legacy-*.js. */
const UNIT = ["27053", "27091", "27052", "27161", "318145", "5077", "27051", "27096", "27214",
  "245348", "245350", "245351", "324449", "27059", "27125", "27163", "27174", "525372",
  "27106", "27107", "27112", "27153", "639940", "509573"];

const here = __dirname;
const unifiedPath = path.join(process.env.STEREO_ROOT || path.resolve(here, "..", "..", "trainers", "stereo"), "js", "data.js");
const legacyPath = process.env.LEGACY_DATA ||
  path.resolve(here, "..", "..", "..", "trainers", "ege-profile-stereometry-3d", "js", "data.js");

function load(file, extra) {
  const ctx = { THREE: { Vector3: function (x, y, z) { this.x = x; this.y = y; this.z = z; } } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(file, "utf8") + "\n;this.__api = { PROBLEMS, TOPICS, sceneData" + (extra || "") + " };", ctx, { filename: file });
  return ctx.__api;
}
const OLD = load(legacyPath);
const NEW = load(unifiedPath, ", sceneDataLegacy, K: SCENE_WORLD / LEGACY_WORLD");

const EPS = 1e-9;
const errs = [];
const topicOf = p => p.topic || "Параллелепипед";

/* точное сравнение данных задачи (числа — ===, без допуска) */
function same(a, b, where, out) {
  if (typeof a === "number" && typeof b === "number") { if (a !== b && !(isNaN(a) && isNaN(b))) out.push(where + ": " + a + " ≠ " + b); return; }
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") { if (a !== b) out.push(where + ": " + JSON.stringify(a) + " ≠ " + JSON.stringify(b)); return; }
  if (Array.isArray(a) !== Array.isArray(b)) { out.push(where + ": массив/объект"); return; }
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
  if (ka.join(",") !== kb.join(",")) { out.push(where + ": ключи [" + ka + "] ≠ [" + kb + "]"); return; }
  for (const k of ka) same(a[k], b[k], where + "." + k, out);
}
/* сравнение геометрии с допуском */
function near(a, b, where, out) {
  if (typeof a === "number" && typeof b === "number") { if (!(Math.abs(a - b) <= EPS)) out.push(where + ": " + a + " ≠ " + b); return; }
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") { if (a !== b) out.push(where + ": " + JSON.stringify(a) + " ≠ " + JSON.stringify(b)); return; }
  if (Array.isArray(a) !== Array.isArray(b)) { out.push(where + ": массив/объект"); return; }
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
  if (ka.join(",") !== kb.join(",")) { out.push(where + ": ключи [" + ka + "] ≠ [" + kb + "]"); return; }
  for (const k of ka) near(a[k], b[k], where + "." + k, out);
}
const GEN_KEYS = ["pts", "edges", "faces", "circles", "surfaces", "coordLabels", "anonymous", "ghost", "hideLabels"];
/* отличия двух сцен (список строк; пустой — сцены совпадают) */
function sceneDiff(o, n, k) {
  const out = [];
  if (o.gen.length !== n.gen.length) out.push("тел " + o.gen.length + " ≠ " + n.gen.length);
  else o.gen.forEach((g, i) => {
    const pick = x => { const r = {}; for (const k of GEN_KEYS) if (x[k] !== undefined) r[k] = x[k]; return r; };
    near(pick(g), pick(n.gen[i]), "gen[" + i + "]", out);
    for (const nm of Object.keys(g.pts)) {
      /* точки нет в новой сцене — это уже отмечено сравнением pts выше */
      if (!n.gen[i].pts || !n.gen[i].pts[nm]) continue;
      const a = o.toW(g.pts[nm]), b = n.toW(n.gen[i].pts[nm]);
      near([a.x * k, a.y * k, a.z * k], [b.x, b.y, b.z], "toW(" + nm + ")", out);
    }
  });
  near(o.s * k, n.s, "s", out);
  near(o.groundY * k, n.groundY, "groundY", out);
  const fb = x => x ? { a: x.a, b: x.b, c: x.c } : null;
  near(fb(o.firstBox), fb(n.firstBox), "firstBox", out);
  return out;
}
/* копия задачи без перечисленных полей */
const without = (p, keys) => { const r = {}; for (const k of Object.keys(p)) if (!keys.includes(k)) r[k] = p[k]; return r; };

/* 6) отпечатки правки: список несработавших проверок REQUIRED[id] */
const keyOf = (a, b) => (a < b ? a + "|" + b : b + "|" + a);
function fingerprintErrs(pn, checks) {
  const out = [];
  const prims = (pn.scene && pn.scene.prims) || [];
  const eqv = (a, b) => (typeof a === "number" && typeof b === "number")
    ? Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(b)) : JSON.stringify(a) === JSON.stringify(b);
  const hasSeg = (list, a, b, t) => (list || []).some(s => Array.isArray(s) && keyOf(s[0], s[1]) === keyOf(a, b) &&
    (t === undefined || (t === null ? s[2] == null : s[2] === t)));
  let sd = null;
  const gen = i => { if (!sd) sd = NEW.sceneData(pn); return sd.gen[i]; };
  const cst = pn.construct || {};
  for (const [kind, ...a] of checks) {
    let ok;
    switch (kind) {
      case "prims": ok = prims.length === a[0]; break;
      case "prim": ok = !!prims[a[0]] && eqv(prims[a[0]][a[1]], a[2]); break;
      case "label": ok = hasSeg(pn.labels, a[0], a[1], a[2]); break;
      case "seg": ok = hasSeg(pn.scene && pn.scene.segs, a[0], a[1]); break;
      case "pt": ok = !!(pn.scene && pn.scene.pts) && eqv(pn.scene.pts[a[0]], a[1]); break;
      case "cseg": ok = hasSeg(cst.segments, a[0], a[1], a[2]); break;
      case "noCseg": ok = !hasSeg(cst.segments, a[0], a[1]); break;
      case "cpt": ok = !!cst.points && eqv(cst.points[a[0]], a[1]); break;
      case "cfill": ok = (cst.fills || []).some(r => eqv(r, a[0])); break;
      case "coordLabel": ok = ((prims[a[0]] || {}).labels || []).some(l => eqv(l, a[1])); break;
      case "coordLabelsNonEmpty": { const ls = (prims[a[0]] || {}).labels || []; ok = ls.length > 0 && ls.every(l => String(l.t) !== ""); break; }
      case "rimArc": { const g = gen(a[0]); ok = !!g && g.circles.some(c => !c.col && typeof c.tl === "number" && Math.abs(c.tl - a[1] * Math.PI / 180) < 1e-9); break; }
      case "noPts": { const g = gen(a[0]); ok = !!g && a[1].every(nm => !(nm in g.pts)); break; }
      default: ok = false;
    }
    if (!ok) out.push(kind + " " + JSON.stringify(a));
  }
  return out;
}

if (!(NEW.K > 0 && NEW.K <= 1)) errs.push("коэффициент мира SCENE_WORLD / LEGACY_WORLD = " + NEW.K);
let checked = 0, fixedSeen = 0, unitSeen = 0, fpSeen = 0;
for (const id of Object.keys(SCENE_FIXED))
  if (!REQUIRED[id] || !REQUIRED[id].length) errs.push(id + ": в SCENE_FIXED, но нет отпечатков правки в REQUIRED");
for (const id of Object.keys(REQUIRED))
  if (!Object.prototype.hasOwnProperty.call(SCENE_FIXED, id)) errs.push(id + ": отпечатки в REQUIRED, а задачи нет в SCENE_FIXED");
const byTopicOld = {};
for (const po of OLD.PROBLEMS) {
  (byTopicOld[topicOf(po)] = byTopicOld[topicOf(po)] || []).push(po.id);
  const pn = NEW.PROBLEMS.find(p => p.id === po.id);
  if (!pn) { errs.push(po.id + ": нет в объединённом банке"); continue; }
  const fixed = Object.prototype.hasOwnProperty.call(SCENE_FIXED, po.id);
  const withUnit = UNIT.includes(po.id);

  /* 1) данные: всё, кроме разрешённого, — дословно */
  const skip = (fixed ? DRAWING_KEYS : []).concat(withUnit ? ["unit"] : []);
  const d = [];
  same(without(po, skip), without(pn, skip), "задача", d);
  d.slice(0, 5).forEach(e => errs.push(po.id + ": " + e + (skip.length ? " (разрешены отличия только в " + skip.join(", ") + ")" : "")));
  if (withUnit) {
    unitSeen++;
    if (!(typeof pn.unit === "number" && Number.isFinite(pn.unit) && pn.unit > 0))
      errs.push(po.id + ": в списке UNIT, а unit = " + String(pn.unit) + " — не положительное число");
    else if (pn.unit === 1) errs.push(po.id + ": unit = 1 — исключение UNIT устарело, убрать из списка");
  }

  /* 3), 4) чертёж */
  const so = OLD.sceneData(po);
  const dLeg = sceneDiff(so, NEW.sceneDataLegacy(pn), 1);
  const sn = NEW.sceneData(pn);
  const dEng = sceneDiff(so, sn, NEW.K);
  if (fixed) {
    fixedSeen++;
    const dataDiff = [];
    same(po, without(pn, withUnit ? ["unit"] : []), "задача", dataDiff);
    if (!dataDiff.length && !dLeg.length && !dEng.length)
      errs.push(po.id + ": в списке SCENE_FIXED, но ни данные чертежа, ни сцена не отличаются — исключение устарело");
    /* 6) правка на месте целиком, а не только «что-то отличается» */
    if (REQUIRED[po.id]) {
      const fe = fingerprintErrs(pn, REQUIRED[po.id]);
      if (fe.length) errs.push(po.id + ": правка SCENE_FIXED откатилась (нет отпечатков: " + fe.join("; ") + ")");
      else fpSeen++;
    }
    /* размер в мире: движок по-прежнему только равномерно уменьшает мир */
    const snL = NEW.sceneDataLegacy(pn);
    const wd = [];
    near(snL.s * NEW.K, sn.s, "s", wd);
    near(snL.groundY * NEW.K, sn.groundY, "groundY", wd);
    wd.forEach(e => errs.push(po.id + " [мир движка] " + e));
  } else {
    dLeg.slice(0, 5).forEach(e => errs.push(po.id + " [sceneDataLegacy] " + e));
    dEng.slice(0, 5).forEach(e => errs.push(po.id + " [sceneData движка] " + e));
  }

  /* 5) материалы тел — по телам задачи объединённого банка */
  const prims = (pn.scene && pn.scene.prims) || [{ kind: "box" }];
  sn.gen.forEach((g, i) => {
    const want = ["cyl", "cone", "sphere"].includes(prims[i].kind) ? "round" : null;
    if (g.matKind !== want) errs.push(po.id + ": gen[" + i + "] " + prims[i].kind + " matKind=" + g.matKind + ", ждали " + want);
    /* тела вращения — с прозрачной стенкой: внутри ось, радиус, вода, сечения */
    if (!!g.seeThrough !== (want === "round")) errs.push(po.id + ": gen[" + i + "] " + prims[i].kind + " seeThrough=" + g.seeThrough);
  });
  checked++;
}
/* поле unit — только у задач из списка UNIT (у новых задач сцена в единицах условия) */
for (const p of NEW.PROBLEMS)
  if (p.unit !== undefined && !UNIT.includes(p.id)) errs.push(p.id + ": поле unit, а задачи нет в списке UNIT");
for (const id of Object.keys(SCENE_FIXED).concat(UNIT))
  if (!OLD.PROBLEMS.some(p => p.id === id)) errs.push(id + ": в списке исключений, но такой задачи нет в опубликованной линейке");

/* порядок: старые задачи — первыми в своей теме, в прежнем порядке */
for (const [t, ids] of Object.entries(byTopicOld)) {
  const lst = NEW.PROBLEMS.filter(p => topicOf(p) === t).map(p => p.id);
  const head = lst.slice(0, ids.length).join(",");
  if (head !== ids.join(",")) errs.push("тема «" + t + "»: старые задачи не первыми или не в прежнем порядке");
  if (lst.slice(ids.length).some(id => /^\d+$/.test(id))) errs.push("тема «" + t + "»: числовой id среди новых задач");
}
/* и в объединённом банке нет «лишних» числовых id */
const extraOld = NEW.PROBLEMS.filter(p => /^\d+$/.test(p.id) && !OLD.PROBLEMS.some(q => q.id === p.id));
extraOld.forEach(p => errs.push(p.id + ": числовой id, которого нет в опубликованной линейке"));

/* 7) построение каждой задачи линейки (старой и новой) что-то добавляет на сцену.
   Как в trainer.js (buildScene / constructBuild): точки — одна на имя, последнее
   тело выигрывает; линии сцены — рёбра тел ненулевой длины; отрезок построения,
   совпавший с линией сцены, второй раз не рисуется — от него видна только
   подпись построения (если эта линия не подписана уже данными условия). */
let cstChecked = 0;
for (const p of NEW.PROBLEMS) {
  const c = p.construct;
  if (!c) continue;
  cstChecked++;
  let sd;
  try { sd = NEW.sceneData(p); } catch (e) { errs.push(p.id + ": построение не проверено — sceneData: " + e.message); continue; }
  const P = {};
  for (const g of sd.gen) for (const [nm, pt] of Object.entries(g.pts)) P[nm] = pt;
  const fb = sd.firstBox || { a: 1, b: 1, c: 1 };
  for (const [nm, spec] of Object.entries(c.points || {})) {
    if (Array.isArray(spec) && spec[0] === "mid") {
      const a = P[spec[1]], b = P[spec[2]];
      if (a && b) P[nm] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    } else if (Array.isArray(spec)) P[nm] = [spec[0] * fb.a, spec[1] * fb.b, spec[2] * fb.c];
  }
  const wlen = (a, b) => { if (!P[a] || !P[b]) return 0; const A = sd.toW(P[a]), B = sd.toW(P[b]); return Math.hypot(A.x - B.x, A.y - B.y, A.z - B.z); };
  const lines = new Set();
  for (const g of sd.gen) for (const [a, b] of g.edges) if (wlen(a, b) >= 1e-6) lines.add(keyOf(a, b));
  const given = {};
  for (const [a, b, t] of (p.labels || [])) given[keyOf(a, b)] = t;
  const adds = [], dull = [];
  if (Object.keys(c.points || {}).length) adds.push("точки");
  if ((c.fills || []).length || (c.solid || []).length) adds.push("закраски");
  for (const sg of (c.segments || [])) {
    const k = keyOf(sg[0], sg[1]), t = sg[2];
    if (t != null && given[k] !== undefined && given[k] !== t)
      errs.push(p.id + ": подпись построения " + sg[0] + sg[1] + " «" + t + "» противоречит подписи условия «" + given[k] + "»");
    if (!lines.has(k)) { if (wlen(sg[0], sg[1]) >= 1e-6) adds.push("отрезок " + sg[0] + sg[1]); else dull.push(sg[0] + sg[1] + " (нулевой длины)"); }
    else if (t != null && t !== "" && given[k] === undefined) adds.push("подпись " + sg[0] + sg[1]);
    else dull.push(sg[0] + sg[1] + (t != null && t !== "" ? " (уже подписан условием)" : " (уже нарисован, без подписи)"));
  }
  if (!adds.length)
    errs.push(p.id + ": построение ничего не добавляет на сцену — ни точек, ни закрасок, ни новых отрезков, ни подписей: " +
      (dull.join(", ") || "пустое построение") + ". Кнопка «Показать построение» видна, а чертёж не меняется");
}

if (errs.length) {
  console.log("РАСХОЖДЕНИЯ (" + errs.length + "):");
  errs.slice(0, 60).forEach(e => console.log("  - " + e));
  process.exit(1);
}
console.log("OK " + checked + " старых задач: порядок в темах и id, условия, ответы, подсказки, решения совпадают " +
  "с опубликованной линейкой; чертежи совпадают у " + (checked - fixedSeen) + " (в движке — с равномерным " +
  "уменьшением мира k = " + NEW.K.toFixed(4) + "), исправлены по списку у " + fixedSeen + " (отпечатки правки на месте у " +
  fpSeen + "), поле unit у " + unitSeen + "; построение что-то добавляет у всех " + cstChecked + " задач с построением из " +
  NEW.PROBLEMS.length + "; расхождений 0");
