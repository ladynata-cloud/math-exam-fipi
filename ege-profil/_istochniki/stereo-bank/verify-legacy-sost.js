/* Независимый верификатор СТАРЫХ задач стерео-банка, тема «Составные тела».

   Старые задачи — 6 задач с числовыми id (номера Решу ЕГЭ): 27044, 27117,
   27188, 27190, 27210, 27211. Под этими id у учеников записан прогресс
   (stereo3.status), поэтому здесь ничего не правится — только проверяется.

   Откуда берутся числа
   Все шесть условий — «по рисунку»: в тексте p.cond чисел нет (это
   проверяется регулярками — цифры и числительные словом), есть только тип
   вопроса («Найдите объём»), тип тела («многогранник, все двугранные углы
   прямые» или «пространственный крест из единичных кубов») и в 27117 —
   длина ребра кубика («единичных» → 1). Остальные числа ученик читает
   с чертежа: это подписи-выноски примитива boxes (coordLabels в выходе
   sceneData). В коде такие места помечены «ПО РИСУНКУ».

   Как пересчитывается ответ (p.ans участвует только в итоговой сверке;
   p.sol и p.hint не читаются)
   1. По подписям. Для каждого id в таблице MODELS записано, как читается
      рисунок: какая подпись какое ребро какого бруска измеряет и как бруски
      стоят друг относительно друга. Из ЧИСЕЛ ПОДПИСЕЙ модель строит бруски,
      объём считается как объём их объединения сжатием координат (сумма
      объёмов ячеек сетки, попавших в тело), а не суммой произведений,
      как в решении. Если размер на чертеже не подписан и модель берёт его
      из допущения, выводится предупреждение с объяснением.
   2. По сцене. Бруски, которые реально нарисованы (восьмёрки вершин из
      sceneData), тем же сжатием координат дают объём в единицах сцены,
      он умножается на k³, где k — масштаб «число подписи / длина отрезка».
   Оба числа должны совпасть с p.ans (относительный допуск 1e-9).

   Как сверяется чертёж (выход sceneData(p), как его рисует тренажёр)
   • все числовые подписи сводятся к ОДНОМУ масштабу k (допуск 1e-6);
     то же в мировых координатах (toW — подобие с коэффициентом s,
     вертикаль сцены — ось z, на экране — вверх);
   • каждая подпись: отрезок параллелен оси, его концы — нарисованные
     вершины, весь он покрыт нарисованными рёбрами и лежит на НАСТОЯЩЕМ
     ребре тела (проба четырёх четвертей вокруг отрезка: не в воздухе,
     не внутри тела и не на шве плоской грани);
   • бруски модели (из чисел) совпадают с нарисованными брусками после
     приведения к масштабу k — как мультимножество, без перекрытий;
   • каждая подпись стоит ровно на том ребре того бруска модели, размер
     которого она задаёт.
   Масштаб этих чертежей не схематичен (сцена строится по тем же числам,
   k = 1), поэтому несовпадение масштаба — ошибка, а не предупреждение.
   Панель измерений показывает fmtLen(длина на сцене · unit), поэтому
   масштаб подписей k (число / длина) обязан быть равен unit (по умолчанию 1).
   27188 и 27210 читаются по-разному в линейке курса и в опубликованной
   (подписи исправлены 24.09.2026) — у модели несколько вариантов, берётся
   тот, что описывает столько подписей, сколько на чертеже.
   Предупреждения (не ошибки): пустые подписи (тренажёр их не рисует),
   размеры, взятые из допущения, а не из подписи.

   Запуск (голый Node, без зависимостей):
     node verify-legacy-sost.js                  — линейка ../../trainers/stereo
     STEREO_ROOT=<папка линейки> node verify-legacy-sost.js
     ключ -v — по строке на каждую задачу;
     ключ --strict — предупреждения тоже считаются расхождениями.
   Берутся задачи PROBLEMS с id из одних цифр и topic === "Составные тела"
   (ровно 6); новые задачи (id вида sost-01) пропускаются — их проверяет
   verify-sost.js. Код 0 и маркер LEGACY_SOST_VERIFY_OK — только при нуле
   расхождений; иначе по строке на расхождение и код 1. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const STEREO_ROOT = process.env.STEREO_ROOT ||
  path.resolve(__dirname, "..", "..", "trainers", "stereo");
const DATA_JS = path.join(STEREO_ROOT, "js", "data.js");
const TOPIC = "Составные тела";
const EXPECTED_COUNT = 6;
const MARKER = "LEGACY_SOST_VERIFY_OK";
const TOL_ANS = 1e-9;    /* ответ: относительный допуск */
const TOL_GEO = 1e-6;    /* масштаб и размеры чертежа: относительный допуск */
const VERBOSE = process.argv.includes("-v") || process.argv.includes("--verbose");
const STRICT = process.argv.includes("--strict");   /* предупреждения — тоже расхождения */

/* ============================================================
   0. Загрузка data.js в песочницу vm
   Своя копия загрузчика (как _load.js, но для собранного data.js;
   чужие файлы не подключаются). data.js — браузерный скрипт: THREE
   и DOM ему нужны только при отрисовке, для загрузки хватает заглушек.
   Работает и со старым data.js линейки (PROBLEMS и sceneData — глобальные
   const/function, без module.exports), и с объединённым (sceneData там —
   диспетчер, старые задачи он передаёт легаси-генератору).
   ============================================================ */
function stub(name) {
  const fn = function () {};
  return new Proxy(fn, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => NaN;
      if (k === "then") return undefined;
      if (k === "prototype") return t.prototype;
      return stub(name + "." + String(k));
    },
    set() { return true; },
    apply() { return stub(name + "()"); },
    construct() { return stub("new " + name); }
  });
}

function loadData(file) {
  const src = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
  const THREE = new Proxy({
    Vector3: function Vector3(x, y, z) { this.x = x; this.y = y; this.z = z; }
  }, { get: (t, k) => (k in t ? t[k] : stub("THREE." + String(k))) });
  const sandbox = {
    THREE, console,
    document: stub("document"), navigator: stub("navigator"), location: stub("location"),
    localStorage: stub("localStorage"), sessionStorage: stub("sessionStorage"),
    addEventListener() {}, removeEventListener() {},
    requestAnimationFrame: () => 0, cancelAnimationFrame() {},
    setTimeout: () => 0, clearTimeout() {},
    module: { exports: {} }
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  const ctx = vm.createContext(sandbox);
  new vm.Script(src, { filename: file }).runInContext(ctx);
  /* const верхнего уровня живут в общей лексической области контекста —
     следующий скрипт в том же контексте их видит */
  const g = new vm.Script(
    "({ P: typeof PROBLEMS !== 'undefined' ? PROBLEMS : undefined," +
    "   S: typeof sceneData === 'function' ? sceneData : undefined })"
  ).runInContext(ctx);
  const ex = sandbox.module.exports || {};
  const PROBLEMS = g.P || ex.PROBLEMS;
  const sceneData = g.S || (typeof ex.sceneData === "function" ? ex.sceneData : undefined);
  if (!Array.isArray(PROBLEMS)) throw new Error("в data.js нет массива PROBLEMS");
  if (typeof sceneData !== "function") throw new Error("в data.js нет функции sceneData");
  return { PROBLEMS, sceneData };
}

/* ============================================================
   1. Арифметика
   ============================================================ */
const AX = ["x", "y", "z"];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const norm = v => Math.hypot(v[0], v[1], v[2]);
const dist = (p, q) => norm(sub(p, q));
const relDiff = (x, y) => {
  const d = Math.max(Math.abs(x), Math.abs(y));
  return d === 0 ? 0 : Math.abs(x - y) / d;
};
const fmt = x => (Number.isFinite(x) ? String(+x.toPrecision(12)).replace(".", ",") : String(x));
const P3 = p => "(" + p.map(fmt).join("; ") + ")";
const isPt = p => Array.isArray(p) && p.length >= 3 && p.slice(0, 3).every(Number.isFinite);

/* ответ бланка: «39», «1,5» — свой разбор, не parseAns банка */
function ansNum(s) {
  const t = String(s).trim();
  return /^\d+(?:,\d+)?$/.test(t) ? Number(t.replace(",", ".")) : NaN;
}
/* подпись чертежа: «5», «2,5», «√12», «2√3»; пустая → "" ; прочее (?, x) → null */
function labelNum(t) {
  const s = String(t == null ? "" : t).replace(/\s+/g, "");
  if (s === "") return "";
  let m = s.match(/^(\d+(?:,\d+)?)?√(\d+(?:,\d+)?)$/);
  if (m) return (m[1] ? Number(m[1].replace(",", ".")) : 1) * Math.sqrt(Number(m[2].replace(",", ".")));
  if (/^\d+(?:,\d+)?$/.test(s)) return Number(s.replace(",", "."));
  return null;
}
/* отсортированные различные значения (с допуском) */
function uniqSorted(vals, eps) {
  const a = vals.slice().sort((u, v) => u - v), out = [];
  for (const v of a) if (!out.length || v - out[out.length - 1] > eps) out.push(v);
  return out;
}

/* ============================================================
   2. Текст условия
   ============================================================ */
const WORD_NUM = ["один", "одна", "одно", "два", "две", "три", "четыре", "пять", "шесть",
  "семь", "восемь", "девять", "десять", "двух", "трех", "четырех", "пяти"];
function readCond(cond) {
  const raw = String(cond);
  const c = raw.toLowerCase().replace(/ё/g, "е");
  const r = {
    digits: raw.match(/\d+(?:[.,]\d+)?/g) || [],
    words: c.match(new RegExp("(?<![а-я])(?:" + WORD_NUM.join("|") + ")(?![а-я])", "g")) || [],
    ask: /найдите\s+объем/.test(c) ? "V" : null,
    byPicture: /на\s+рисунке/.test(c),
    kind: null,
    unit: null
  };
  if (/пространственн[а-я]*\s+крест/.test(c)) r.kind = "cross";
  else if (/многогранник/.test(c) && /все\s+двугранные\s+углы\s+(?:многогранника\s+)?прямые/.test(c))
    r.kind = "orthoPoly";
  /* единственное «число» текста: «составленного из единичных кубов» → ребро 1 */
  if (/из\s+единичн[а-я]*\s+куб/.test(c)) r.unit = 1;
  return r;
}

/* ============================================================
   3. Сцена: бруски, вершины, рёбра, подписи — из выхода sceneData
   ============================================================ */
/* восемь вершин → осевой брусок {lo, hi} или null, если это не брусок */
function boxFromCorners(ps, eps) {
  const X = uniqSorted(ps.map(p => p[0]), eps), Y = uniqSorted(ps.map(p => p[1]), eps),
        Z = uniqSorted(ps.map(p => p[2]), eps);
  if (ps.length !== 8 || X.length !== 2 || Y.length !== 2 || Z.length !== 2) return null;
  for (const x of X) for (const y of Y) for (const z of Z)
    if (!ps.some(p => Math.abs(p[0] - x) <= eps && Math.abs(p[1] - y) <= eps && Math.abs(p[2] - z) <= eps))
      return null;
  return { lo: [X[0], Y[0], Z[0]], hi: [X[1], Y[1], Z[1]] };
}

function readScene(p) {
  const sd = sceneData(p);
  if (!sd || !Array.isArray(sd.gen) || !sd.gen.length) throw new Error("sceneData не вернула тел");
  if (!(Number.isFinite(sd.s) && sd.s > 0)) throw new Error(`масштаб сцены s = ${sd.s}`);
  if (typeof sd.toW !== "function") throw new Error("в выходе sceneData нет toW");
  let big = 1;
  for (const g of sd.gen) for (const pt of Object.values(g.pts || {}))
    if (isPt(pt)) big = Math.max(big, Math.abs(pt[0]), Math.abs(pt[1]), Math.abs(pt[2]));
  const eps = 1e-9 * big;
  const boxes = [], verts = [], edges = [], coordLabels = [];
  sd.gen.forEach((g, gi) => {
    if (g.ghost) throw new Error(`тело сцены №${gi} «призрачное» — в составном теле не ожидается`);
    /* составное тело старого банка — примитив boxes: безымянные точки _p0…,
       по восемь на брусок в порядке items */
    if (!g.anonymous) throw new Error(`тело сцены №${gi} не из осевых брусков (не boxes) — модель верификатора к нему не применима`);
    const groups = new Map();
    for (const [nm, pt] of Object.entries(g.pts || {})) {
      const m = /^_p(\d+)$/.exec(nm);
      if (!m) throw new Error(`тело сцены №${gi}: вершина «${nm}» не из восьмёрок _p0…`);
      if (!isPt(pt)) throw new Error(`тело сцены №${gi}: вершина ${nm} = ${pt}`);
      const key = Math.floor(Number(m[1]) / 8);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(pt);
      verts.push(pt);
    }
    for (const key of [...groups.keys()].sort((a, b) => a - b)) {
      const b = boxFromCorners(groups.get(key), eps);
      if (!b) throw new Error(`тело сцены №${gi}: вершины _p${key * 8}…_p${key * 8 + 7} — не осевой брусок`);
      if (AX.some((_, ax) => !(b.hi[ax] - b.lo[ax] > eps)))
        throw new Error(`тело сцены №${gi}: брусок №${key} вырожден`);
      boxes.push(b);
    }
    for (const [a, b] of (g.edges || [])) {
      if (!isPt(g.pts[a]) || !isPt(g.pts[b])) throw new Error(`тело сцены №${gi}: ребро ${a}–${b} ссылается на несуществующую вершину`);
      edges.push([g.pts[a], g.pts[b]]);
    }
    for (const l of (g.coordLabels || [])) coordLabels.push(l);
  });
  return { sd, boxes, verts, edges, coordLabels, eps };
}

/* ============================================================
   4. Объединение брусков: объём, «внутри», перекрытия
   ============================================================ */
const inside = (boxes, pt) => boxes.some(b =>
  pt[0] > b.lo[0] && pt[0] < b.hi[0] && pt[1] > b.lo[1] && pt[1] < b.hi[1] && pt[2] > b.lo[2] && pt[2] < b.hi[2]);

/* объём объединения сжатием координат: сетка по всем граням брусков,
   считаются ячейки, центр которых внутри тела */
function unionVolume(boxes, eps) {
  const cuts = [0, 1, 2].map(ax => uniqSorted(boxes.flatMap(b => [b.lo[ax], b.hi[ax]]), eps));
  let V = 0;
  for (let i = 0; i + 1 < cuts[0].length; i++)
    for (let j = 0; j + 1 < cuts[1].length; j++)
      for (let k = 0; k + 1 < cuts[2].length; k++) {
        const c = [(cuts[0][i] + cuts[0][i + 1]) / 2, (cuts[1][j] + cuts[1][j + 1]) / 2, (cuts[2][k] + cuts[2][k + 1]) / 2];
        if (inside(boxes, c))
          V += (cuts[0][i + 1] - cuts[0][i]) * (cuts[1][j + 1] - cuts[1][j]) * (cuts[2][k + 1] - cuts[2][k]);
      }
  return V;
}
const overlap = (a, b, eps) => [0, 1, 2].every(ax => Math.min(a.hi[ax], b.hi[ax]) - Math.max(a.lo[ax], b.lo[ax]) > eps);
function overlapPairs(boxes, eps) {
  const out = [];
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) if (overlap(boxes[i], boxes[j], eps)) out.push([i, j]);
  return out;
}
const bxStr = b => `[${fmt(b.lo[0])}…${fmt(b.hi[0])}]×[${fmt(b.lo[1])}…${fmt(b.hi[1])}]×[${fmt(b.lo[2])}…${fmt(b.hi[2])}]`;

/* ============================================================
   5. Модели: как читается рисунок каждой задачи
   Система координат старого формата: x — вправо, y — в глубину
   (y = 0 — передняя грань), z — вверх; левый-передний-нижний угол
   тела — начало координат.
   marks[i] — что измеряет подпись №i (порядок coordLabels сцены):
     [номер бруска модели, ось]  или  null — пустая подпись (не рисуется).
   build(v, ctx) — бруски из ЧИСЕЛ ПОДПИСЕЙ v[i] (ПО РИСУНКУ) и ctx.unit
   (ребро кубика из текста). Позиции брусков, не заданные числами
   (брусок «у левой и задней граней» плиты), прочитаны с рисунка — на объём
   они не влияют, но сверяются со сценой.
   assume — размеры, которых на рисунке нет: модель берёт их из допущения,
   верификатор выводит предупреждение; check — непротиворечивость допущения.
   ============================================================ */
const bx = (lo, size) => ({ lo: lo.slice(), hi: [lo[0] + size[0], lo[1] + size[1], lo[2] + size[2]] });

/* плита a×b×c на земле; на её верхней грани брусок d×e×f у левой грани,
   прижатый к задней (back) или передней (front) грани плиты */
const slabBlock = side => ([a, b, c, d, e, f]) =>
  [bx([0, 0, 0], [a, b, c]), bx([0, side === "back" ? b - e : 0, c], [d, e, f])];
const SLAB_BLOCK_MARKS = [[0, "x"], [0, "y"], [0, "z"], [1, "x"], [1, "y"], [1, "z"]];

const MODELS = {
  /* ПО РИСУНКУ: плита 5×3×1, сверху у левой и задней граней брусок 4×2×3 */
  "27044": { kind: "orthoPoly", name: "плита + брусок сверху", marks: SLAB_BLOCK_MARKS,
    build: v => slabBlock("back")(v) },

  /* пространственный крест: центральный кубик и по кубику на каждой его грани;
     ребро — из ТЕКСТА («из единичных кубов»), подпись «1» на нижнем кубике
     (брусок №5 модели) — ПО РИСУНКУ, должна совпасть с текстом */
  "27117": { kind: "cross", name: "крест из 7 кубиков", marks: [[5, "x"]],
    build: (v, ctx) => {
      const a = ctx.unit, C = [a, a, a], out = [bx(C, [a, a, a])];
      for (let ax = 0; ax < 3; ax++) for (const sg of [-1, 1]) {
        const lo = C.slice(); lo[ax] += sg * a;
        out.push(bx(lo, [a, a, a]));          /* №1…6: −x, +x, −y, +y, −z, +z */
      }
      return out;
    },
    check: (v, ctx) => (relDiff(v[0], ctx.unit) > TOL_ANS
      ? `подпись ребра кубика «${fmt(v[0])}» противоречит тексту («единичных кубов» → ${fmt(ctx.unit)})` : null) },

  /* ПО РИСУНКУ: плита 3×2×1, сверху у левой и ПЕРЕДНЕЙ граней брусок.
     Линейка курса (с 24.09.2026): подписаны ширина, высота и глубина бруска
     (подпись №5 — данные рисунка: брусок сцены 1×1×1). Опубликованная линейка:
     глубина НЕ подписана — вариант с допущением «брусок — куб». Вариант
     выбирается по числу подписей чертежа (variants, см. 6.4). */
  "27188": { kind: "orthoPoly", name: "плита + брусок сверху",
    variants: [
      { marks: [[0, "x"], [0, "y"], [0, "z"], [1, "x"], [1, "z"], [1, "y"]],
        build: ([a, b, c, d, f, e]) => [bx([0, 0, 0], [a, b, c]), bx([0, 0, c], [d, e, f])] },
      { name: "плита + кубик сверху (глубина не подписана)",
        marks: [[0, "x"], [0, "y"], [0, "z"], [1, "x"], [1, "z"]],
        assume: ["глубина верхнего бруска на чертеже не подписана; модель принимает брусок " +
          "за куб (глубина = подписанной ширине) — ученик может это увидеть только по масштабу " +
          "чертежа, из подписей и текста ответ не следует"],
        build: ([a, b, c, d, f]) => {
          const e = d;                             /* ДОПУЩЕНИЕ: верхний брусок — куб */
          return [bx([0, 0, 0], [a, b, c]), bx([0, 0, c], [d, e, f])];
        },
        check: v => (relDiff(v[3], v[4]) > TOL_ANS
          ? `допущение «верхний брусок — куб» противоречит подписям: ширина ${fmt(v[3])}, высота ${fmt(v[4])}` : null) }
    ] },

  /* ПО РИСУНКУ: плита 5×3×2, сверху у левой и задней граней брусок 2×2×1 */
  "27190": { kind: "orthoPoly", name: "плита + брусок сверху", marks: SLAB_BLOCK_MARKS,
    build: v => slabBlock("back")(v) },

  /* ПО РИСУНКУ: «ступенька» — прямая призма с Г-образным профилем в плоскости xz:
     левая часть a (x) × h1 (z), правая c (x) × h2 (z), глубина b общая
     (подписана один раз, на левой части; передняя и задняя грани ступеньки —
     по одной плоскости: на чертеже их рёбра продолжают друг друга).
     Линейка курса (с 24.09.2026): 5 подписей. Опубликованная линейка: 7,
     подписи №2 и №6 пустые — тренажёр их не рисует (мёртвые данные). */
  "27210": { kind: "orthoPoly", name: "ступенька (Г-профиль × глубина)",
    variants: [
      { marks: [[0, "x"], [0, "z"], [0, "y"], [1, "x"], [1, "z"]],
        build: ([a, h1, b, c, h2]) => [bx([0, 0, 0], [a, b, h1]), bx([a, 0, 0], [c, b, h2])] },
      { marks: [[0, "x"], [0, "z"], null, [0, "y"], [1, "x"], [1, "z"], null],
        build: ([a, h1, , b, c, h2]) => [bx([0, 0, 0], [a, b, h1]), bx([a, 0, 0], [c, b, h2])] }
    ] },

  /* ПО РИСУНКУ: плита 7×4×2, сверху у левой и задней граней брусок 4×3×4 */
  "27211": { kind: "orthoPoly", name: "плита + брусок сверху", marks: SLAB_BLOCK_MARKS,
    build: v => slabBlock("back")(v) }
};

/* ============================================================
   6. Проверка одной задачи
   ============================================================ */
function verifyOne(p, errs, warns) {
  const id = String(p.id);
  const E = m => errs.push(`${id}: ${m}`), W = m => (STRICT ? errs : warns).push(`${id}: ${m}`);
  const M0 = MODELS[id];
  let M = M0;
  if (!M) { E("нет модели в верификаторе (новая старая задача? — описать её в MODELS)"); return; }

  /* --- 6.1 текст условия --- */
  const T = readCond(p.cond);
  if (T.ask !== "V") E(`не распознан вопрос (ожидалось «Найдите объём…»): «${p.cond}»`);
  if (T.kind !== M.kind) E(`по тексту тип тела «${T.kind}», модель верификатора — «${M.kind}»`);
  if (T.digits.length || T.words.length)
    E(`в тексте условия есть числа (${T.digits.concat(T.words).join(", ")}) — модель «по рисунку» их не учитывает`);
  if (!T.byPicture) E("в тексте нет «на рисунке», а чисел в тексте нет — условие неполно");
  if (M.kind === "cross" && T.unit !== 1) E("в тексте не найдено «из единичных кубов» — ребро кубика неизвестно");

  const got = ansNum(p.ans);
  if (!Number.isFinite(got)) E(`ответ «${p.ans}» — не число бланка`);

  /* --- 6.2 сцена --- */
  const S = readScene(p);
  const { sd, boxes: sBoxes, eps } = S;
  if (!sBoxes.length) { E("на сцене нет брусков"); return; }
  for (const [i, j] of overlapPairs(sBoxes, eps))
    E(`сцена: нарисованные бруски №${i} ${bxStr(sBoxes[i])} и №${j} ${bxStr(sBoxes[j])} перекрываются`);

  /* toW — подобие с коэффициентом s, ось z сцены — вверх на экране */
  const w = pt => { const v = sd.toW(pt); return [v.x, v.y, v.z]; };
  const O = w([0, 0, 0]);
  const e3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(u => sub(w(u), O));
  for (let a = 0; a < 3; a++) {
    if (relDiff(norm(e3[a]), sd.s) > 1e-9) E(`сцена: ось ${AX[a]} растянута в ${fmt(norm(e3[a]) / sd.s)} раза относительно s`);
    for (let b = a + 1; b < 3; b++)
      if (Math.abs(dot(e3[a], e3[b])) > 1e-9 * sd.s * sd.s) E(`сцена: оси ${AX[a]} и ${AX[b]} на чертеже не перпендикулярны`);
  }
  if (!(e3[2][1] > 0) || relDiff(e3[2][1], sd.s) > 1e-9)
    E("сцена: вертикаль сцены (z) на чертеже не смотрит вверх — «плита снизу, брусок сверху» не гарантирована");

  /* подписи по именам вершин (p.labels) — у безымянных брусков их быть не должно */
  for (const [a, b, t] of (p.labels || []))
    E(`подпись ${a}${b}="${t}" по именам вершин, а вершины составного тела безымянные — модель её не учитывает`);

  /* --- 6.3 подписи чертежа: числа ПО РИСУНКУ --- */
  const L = S.coordLabels.map((l, i) => ({ i, p: l.p, q: l.q, t: String(l.t == null ? "" : l.t), val: labelNum(l.t) }));
  const numL = [];
  for (const l of L) {
    if (!isPt(l.p) || !isPt(l.q)) { E(`подпись №${l.i} «${l.t}»: концы не точки`); continue; }
    if (l.val === "") { W(`подпись №${l.i} на отрезке ${P3(l.p)}–${P3(l.q)} пустая — тренажёр её не рисует (мёртвые данные)`); continue; }
    if (l.val === null) { W(`подпись №${l.i} «${l.t}» не число — в пересчёте не участвует`); continue; }
    numL.push(l);
  }
  if (!numL.length) { E("на чертеже нет ни одной числовой подписи — ответ не определён"); return; }

  /* единый масштаб k = число / длина отрезка (единицы сцены) и то же в мире */
  let k0 = null, kw0 = null;
  for (const l of numL) {
    const len = dist(l.p, l.q), wl = dist(w(l.p), w(l.q));
    if (!(len > eps)) { E(`подпись №${l.i} «${l.t}» на вырожденном отрезке`); continue; }
    const k = l.val / len, kw = l.val / wl;
    if (relDiff(wl, sd.s * len) > TOL_GEO) E(`подпись №${l.i} «${l.t}»: на экране отрезок ${fmt(wl)}, а s·длина = ${fmt(sd.s * len)}`);
    if (k0 === null) { k0 = k; kw0 = kw; l.k = k; continue; }
    l.k = k;
    if (relDiff(k, k0) > TOL_GEO)
      E(`масштаб чертежа не единый: подпись №${l.i} «${l.t}» на отрезке длины ${fmt(len)} (масштаб ${fmt(k)}), ` +
        `а подпись №${numL[0].i} «${numL[0].t}» — на отрезке длины ${fmt(dist(numL[0].p, numL[0].q))} (масштаб ${fmt(k0)})`);
    if (relDiff(kw, kw0) > TOL_GEO) E(`масштаб на экране не единый: подпись №${l.i} «${l.t}»`);
  }
  if (k0 === null) return;
  /* панель измерений после ответа показывает fmtLen(длина на сцене · unit);
     чтобы она совпадала с подписями, unit (по умолчанию 1) = число / длина = k */
  {
    const hasU = p.unit !== undefined;
    const u = hasU ? p.unit : 1;
    if (hasU && !(typeof u === "number" && Number.isFinite(u) && u > 0)) E(`unit = ${String(u)} — не положительное число`);
    else if (relDiff(k0, u) > TOL_GEO)
      E(`подписи в масштабе ${fmt(k0)} (число / длина на сцене), а панель измерений умножает длину сцены на unit = ${fmt(u)}`);
  }

  /* каждая подпись — на настоящем ребре нарисованного тела */
  const cutsAll = [0, 1, 2].map(ax => uniqSorted(sBoxes.flatMap(b => [b.lo[ax], b.hi[ax]]), eps));
  let gap = Infinity;
  for (const cs of cutsAll) for (let i = 0; i + 1 < cs.length; i++) gap = Math.min(gap, cs[i + 1] - cs[i]);
  const delta = gap / 4;
  const onDrawnEdge = pt => S.edges.some(([a, b]) => dist(a, pt) + dist(pt, b) - dist(a, b) <= 1e-9 * (1 + dist(a, b)));
  for (const l of numL) {
    const d = sub(l.q, l.p);
    const axes = [0, 1, 2].filter(ax => Math.abs(d[ax]) > eps);
    if (axes.length !== 1) { E(`подпись №${l.i} «${l.t}» на отрезке ${P3(l.p)}–${P3(l.q)}, не параллельном ребру тела`); continue; }
    const ax = axes[0], [u, v] = [0, 1, 2].filter(a => a !== ax);
    for (const end of [l.p, l.q])
      if (!S.verts.some(pt => dist(pt, end) <= eps))
        E(`подпись №${l.i} «${l.t}»: конец ${P3(end)} — не вершина чертежа`);
    const lo = Math.min(l.p[ax], l.q[ax]), hi = Math.max(l.p[ax], l.q[ax]);
    const br = uniqSorted([lo, hi].concat(cutsAll[ax].filter(c => c > lo + eps && c < hi - eps)), eps);
    const bad = new Set();
    for (let i = 0; i + 1 < br.length; i++) {
      const m = l.p.slice(0, 3); m[ax] = (br[i] + br[i + 1]) / 2;
      if (!onDrawnEdge(m)) bad.add("не покрыта нарисованными рёбрами");
      /* четыре четверти вокруг отрезка: сколько из них внутри тела */
      const q = [];
      for (const su of [-1, 1]) for (const sv of [-1, 1]) {
        const pt = m.slice(); pt[u] += su * delta; pt[v] += sv * delta;
        q.push(inside(sBoxes, pt));
      }
      const n = q.filter(Boolean).length;           /* порядок: (−,−) (−,+) (+,−) (+,+) */
      if (n === 0) bad.add("висит в воздухе — не на поверхности тела");
      else if (n === 4) bad.add("проходит внутри тела");
      else if (n === 2 && !(q[0] === q[3])) W(`подпись №${l.i} «${l.t}» стоит на шве плоской грани, а не на ребре тела`);
    }
    for (const b of bad) E(`подпись №${l.i} «${l.t}» на отрезке ${P3(l.p)}–${P3(l.q)} ${b}`);
    l.axis = ax;
  }

  /* --- 6.4 модель из чисел подписей --- */
  /* у задачи несколько чтений рисунка (линейка курса и опубликованная) —
     берётся вариант, описывающий столько подписей, сколько на чертеже */
  if (M0.variants) M = Object.assign({}, M0, M0.variants.find(v => v.marks.length === L.length) || M0.variants[0]);
  if (!Array.isArray(M.marks) || M.marks.length !== L.length) {
    E(`на чертеже подписей ${L.length}, модель верификатора описывает ${M.marks ? M.marks.length : 0}`);
    return;
  }
  const v = L.map(l => (typeof l.val === "number" ? l.val : null));
  let marksOk = true;
  for (let i = 0; i < L.length; i++) {
    if (M.marks[i] === null && v[i] !== null) { marksOk = false; E(`подпись №${i} «${L[i].t}» числовая, а модель считает её пустой`); }
    if (M.marks[i] !== null && v[i] === null) { marksOk = false; E(`подпись №${i} пустая или не число, а модель берёт из неё размер`); }
  }
  if (!marksOk) return;
  for (const a of (M.assume || [])) W(`ДОПУЩЕНИЕ: ${a}`);
  const ctx = { unit: T.unit };
  if (M.check) { const msg = M.check(v, ctx); if (msg) E(msg); }
  const mBoxes = M.build(v, ctx);
  if (!mBoxes.every(b => b.lo.concat(b.hi).every(Number.isFinite) && AX.every((_, ax) => b.hi[ax] - b.lo[ax] > 0))) {
    E(`модель не построилась по числам ${v.map(x => (x === null ? "—" : fmt(x))).join(", ")}`);
    return;
  }
  const mEps = 1e-9 * Math.max(1, ...mBoxes.flatMap(b => b.hi.map(Math.abs)));
  for (const [i, j] of overlapPairs(mBoxes, mEps))
    E(`модель: бруски №${i} и №${j} перекрываются — подписи противоречат чтению рисунка`);

  /* ответ, путь 1: объём тела, собранного из чисел подписей */
  const V1 = unionVolume(mBoxes, mEps);
  if (Number.isFinite(got) && relDiff(V1, got) > TOL_ANS)
    E(`по подписям чертежа V = ${fmt(V1)}, в банке ans = ${p.ans}`);
  /* ответ, путь 2: объём нарисованного тела × k³ */
  const V2 = unionVolume(sBoxes, eps) * k0 ** 3;
  if (Number.isFinite(got) && relDiff(V2, got) > TOL_ANS)
    E(`по сцене (нарисованные бруски, масштаб ${fmt(k0)}) V = ${fmt(V2)}, в банке ans = ${p.ans}`);

  /* --- 6.5 модель ↔ сцена: те же бруски после приведения к масштабу k --- */
  const minOf = bs => [0, 1, 2].map(ax => Math.min(...bs.map(b => b.lo[ax])));
  const sMin = minOf(sBoxes), mMin = minOf(mBoxes);
  const toM = pt => [0, 1, 2].map(ax => (pt[ax] - sMin[ax]) * k0);
  const sN = sBoxes.map(b => ({ lo: toM(b.lo), hi: toM(b.hi) }));
  const mN = mBoxes.map(b => ({ lo: sub(b.lo, mMin), hi: sub(b.hi, mMin) }));
  const ext = Math.max(1, ...mN.flatMap(b => b.hi));
  const same = (a, b) => [0, 1, 2].every(ax =>
    Math.abs(a.lo[ax] - b.lo[ax]) <= TOL_GEO * ext && Math.abs(a.hi[ax] - b.hi[ax]) <= TOL_GEO * ext);
  const used = new Set();
  mN.forEach((mb, i) => {
    const j = sN.findIndex((sb, jj) => !used.has(jj) && same(mb, sb));
    if (j < 0) E(`брусок модели №${i} ${bxStr(mb)} (из подписей) на чертеже не нарисован`);
    else used.add(j);
  });
  sN.forEach((sb, j) => { if (!used.has(j)) E(`нарисованный брусок №${j} ${bxStr(sb)} (в масштабе подписей) не входит в модель`); });

  /* --- 6.6 каждая подпись стоит на ребре того бруска, размер которого задаёт --- */
  for (let i = 0; i < L.length; i++) {
    const mk = M.marks[i];
    if (!mk) continue;
    const [bi, axName] = mk, ai = AX.indexOf(axName), B = mN[bi], l = L[i];
    if (!B || ai < 0) { E(`модель: подпись №${i} ссылается на брусок №${bi}/ось ${axName}`); continue; }
    if (l.axis !== undefined && l.axis !== ai) {
      E(`подпись №${i} «${l.t}» идёт вдоль оси ${AX[l.axis]}, а модель читает её как размер по ${axName}`);
      continue;
    }
    const pm = toM(l.p), qm = toM(l.q), tol = TOL_GEO * ext;
    const okAlong = Math.abs(Math.min(pm[ai], qm[ai]) - B.lo[ai]) <= tol && Math.abs(Math.max(pm[ai], qm[ai]) - B.hi[ai]) <= tol;
    const okSide = [0, 1, 2].filter(a => a !== ai).every(a =>
      Math.abs(pm[a] - qm[a]) <= tol && (Math.abs(pm[a] - B.lo[a]) <= tol || Math.abs(pm[a] - B.hi[a]) <= tol));
    if (!okAlong || !okSide)
      E(`подпись №${i} «${l.t}» (${P3(pm)}–${P3(qm)} в масштабе подписей) стоит не на ребре бруска модели №${bi} ` +
        `${bxStr(B)} вдоль ${axName}`);
  }

  if (VERBOSE)
    console.log(`  ${id.padEnd(6)} ответ ${String(p.ans).padEnd(4)} по подписям ${fmt(V1).padEnd(5)} по сцене ${fmt(V2).padEnd(5)} ` +
      `[${M.name}] подписей ${L.length} (числовых ${numL.length}), брусков ${sBoxes.length}, масштаб ${fmt(k0)}`);
}

/* ============================================================
   7. Прогон
   ============================================================ */
let PROBLEMS, sceneData;
function main() {
  try { ({ PROBLEMS, sceneData } = loadData(DATA_JS)); }
  catch (e) {
    console.log(`РАСХОЖДЕНИЕ не удалось загрузить ${DATA_JS}: ${e.message}`);
    console.log("Составные тела (старые): задач 0, расхождений 1");
    process.exit(1);
  }
  const errs = [], warns = [];
  const legacy = PROBLEMS.filter(p => p && /^\d+$/.test(String(p.id)) && p.topic === TOPIC);
  console.log(`Линейка: ${DATA_JS}`);
  console.log(`Задач в PROBLEMS: ${PROBLEMS.length}; старых «${TOPIC}» (числовой id): ${legacy.length}`);
  if (legacy.length !== EXPECTED_COUNT)
    errs.push(`банк: старых задач темы «${TOPIC}» ${legacy.length}, должно быть ровно ${EXPECTED_COUNT}`);
  const seen = new Set();
  for (const p of legacy) {
    if (seen.has(String(p.id))) errs.push(`${p.id}: id повторяется`);
    seen.add(String(p.id));
  }
  for (const id of Object.keys(MODELS))
    if (!seen.has(id)) errs.push(`${id}: задача из модели верификатора не найдена в банке`);
  for (const p of legacy) {
    try { verifyOne(p, errs, warns); }
    catch (e) { errs.push(`${p.id}: проверка не выполнена: ${e.message}`); }
  }
  warns.forEach(w => console.log("предупреждение " + w));
  errs.forEach(e => console.log("РАСХОЖДЕНИЕ " + e));
  console.log(`Составные тела (старые): задач ${legacy.length}, расхождений ${errs.length}`);
  if (warns.length) console.log(`(предупреждений ${warns.length} — на код выхода не влияют; --strict делает их расхождениями)`);
  if (errs.length) process.exit(1);
  console.log(MARKER);
}
main();
