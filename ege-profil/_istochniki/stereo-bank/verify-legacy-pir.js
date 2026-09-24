/* Независимый верификатор СТАРЫХ задач стерео-банка, тема «Пирамида».

   Старые задачи — 16 задач с числовыми id (номера Решу ЕГЭ). Под этими id
   у учеников записан прогресс (stereo3.status), поэтому здесь ничего
   не правится — только проверяется.

   Что проверяется для каждой задачи
   1. Ответ. Условие p.cond разбирается регулярками: вид тела (правильная
      n-угольная пирамида, пирамида с прямоугольным основанием, пирамида
      с попарно перпендикулярными боковыми рёбрами, пирамида в кубе с
      вершиной в центре), данные («сторона основания равна…», «SB = 13»,
      «объём … SABC равен 33», «площадь треугольника ABC равна 2»…),
      определения точек («O — центр основания», «биссектрисы … в точке O»,
      «E — середина ребра SB») и вопрос («Найдите …»). Все числа условия
      должны уйти в данные — неразобранное число считается ошибкой.
      По данным строится своя модель тела в координатах: неизвестные
      размеры (радиус описанной окружности основания, высота, ребро…)
      находятся методом Гаусса — Ньютона из равенств «измеренное на модели
      = данное», а искомое снова ИЗМЕРЯЕТСЯ на модели: длины — расстояние
      между точками, высота — расстояние от вершины до плоскости основания
      (нормаль по Ньюэллу), площади — векторные произведения, объёмы —
      разбиение на тетраэдры от внутренней точки. Формулы решения
      (⅓Sh, апофема, a = d/√2 …) не используются; p.sol и p.hint не
      читаются, p.ans участвует только в итоговой сверке.
      Если условие не задаёт форму (дан один объём), ответ считается при
      нескольких разных формах и обязан от них не зависеть.
   2. Чертёж — выход sceneData(p), как его собирает тренажёр (точки
      построения ставятся так же, как в trainer.js: «mid» или доли
      firstBox). Модель, построенная по условию, и сцена должны быть
      ПОДОБНЫ с одним масштабом k на задачу (допуск 1e-6):
      • каждая числовая подпись (labels и подписанные отрезки построения)
        равна длине этого отрезка в модели и его длине на сцене, делённой
        на k; масштаб k берётся по первой числовой подписи, а если их нет —
        по ребру основания;
      • искомые отрезки «?», размеры из задания сцены (scene.prims / dims),
        объём подсвеченного тела и ВСЕ попарные расстояния между
        названными точками сцены — тот же масштаб k;
      • точки сцены, которых нет в фигуре условия, — ошибка (кроме
        вспомогательного куба-достроения, который проверяется отдельно).
      Масштаб k ≠ 1 без поля unit — предупреждение, а не ошибка: панель
      измерений после «Показать ответ» показывает fmtLen(длина на сцене ·
      unit), то есть длины сцены; сцена при этом подобна условию. Если unit
      задан, он обязан быть равен 1/k — иначе расхождение.
      Если свободный параметр формы (не заданный условием) нужен, чтобы
      сравнить со сценой, он снимается СО СЦЕНЫ — это помечено в коде
      «СО СЦЕНЫ». Данных «по рисунку» у задач этой темы нет: все числа
      есть в тексте условия.

   Запуск (голый Node, без зависимостей):
     node verify-legacy-pir.js                  — линейка ../../trainers/stereo
     STEREO_ROOT=<папка линейки> node verify-legacy-pir.js
     ключ -v — по строке на каждую задачу;
     ключ --strict — предупреждения тоже считаются расхождениями.
   Примечание (не предупреждение, --strict его не трогает): сцена подобна
   условию в масштабе k ≠ 1 из-за округления размера в задании сцены, а все
   длины между названными точками панель измерений показывает так же, как
   при k = 1 (строки fmtLen банка совпадают) — на экране это не видно.
   Берутся задачи PROBLEMS с id из одних цифр и topic === "Пирамида"
   (ровно 16); новые задачи (id вида pir-01) пропускаются — их проверяет
   verify-pir.js. Код 0 и маркер LEGACY_PIR_VERIFY_OK — только при нуле
   расхождений. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const STEREO_ROOT = process.env.STEREO_ROOT ||
  path.resolve(__dirname, "..", "..", "trainers", "stereo");
const DATA_JS = path.join(STEREO_ROOT, "js", "data.js");
const TOPIC = "Пирамида";
const EXPECTED_COUNT = 16;
const TOL_ANS = 1e-9;     /* ответ и подписи против условия: относительный допуск */
const TOL_GEO = 1e-6;     /* подобие сцены и модели: относительный допуск */
const TOL_SOLVE = 1e-12;  /* невязка решения модели (в логарифмах) */
const VERBOSE = process.argv.includes("-v") || process.argv.includes("--verbose");
const STRICT = process.argv.includes("--strict");   /* предупреждения — тоже расхождения */

/* ============================================================
   0. Загрузка data.js в песочницу vm
   Своя копия идеи _load.js (чужие файлы не подключаются): data.js —
   браузерный скрипт, THREE и DOM нужны ему только при отрисовке,
   для загрузки хватает заглушек. Работает и со старым data.js
   линейки (PROBLEMS и sceneData — глобальные const/function), и с
   объединённым (там ещё и блок module.exports).
   ============================================================ */
function stub(label) {
  const fn = function () {};
  return new Proxy(fn, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => NaN;
      if (k === "then") return undefined;
      if (k === "prototype") return t.prototype;
      return stub(label + "." + String(k));
    },
    set() { return true; },
    apply() { return stub(label + "()"); },
    construct() { return stub("new " + label); }
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
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    module: { exports: {} }
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  new vm.Script(src, { filename: file }).runInContext(ctx);
  /* const верхнего уровня живут в общей лексической области контекста —
     следующий скрипт в том же контексте их видит */
  const g = new vm.Script(
    "({ P: typeof PROBLEMS !== 'undefined' ? PROBLEMS : undefined," +
    "   S: typeof sceneData === 'function' ? sceneData : undefined," +
    "   F: typeof fmtLen === 'function' ? fmtLen : undefined })"
  ).runInContext(ctx);
  const ex = sandbox.module.exports || {};
  const PROBLEMS = g.P || ex.PROBLEMS;
  const sceneData = g.S || (typeof ex.sceneData === "function" ? ex.sceneData : undefined);
  const fmtLen = g.F || (typeof ex.fmtLen === "function" ? ex.fmtLen : undefined);
  if (!Array.isArray(PROBLEMS)) throw new Error("в data.js нет массива PROBLEMS");
  if (typeof sceneData !== "function") throw new Error("в data.js нет функции sceneData");
  return { PROBLEMS, sceneData, fmtLen };
}

/* ============================================================
   1. Векторы и измерения
   ============================================================ */
const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const add = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
const scl = (p, s) => [p[0] * s, p[1] * s, p[2] * s];
const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
const norm = p => Math.hypot(p[0], p[1], p[2]);
const dist = (p, q) => norm(sub(p, q));
const mid = (p, q) => scl(add(p, q), 0.5);
const avg = arr => scl(arr.reduce((s, p) => add(s, p), [0, 0, 0]), 1 / arr.length);
const relDiff = (x, y) => Math.abs(x - y) / Math.max(Math.abs(x), Math.abs(y), 1e-300);
const fmt = x => (Number.isFinite(x) ? String(+x.toPrecision(7)).replace(".", ",") : String(x));
const isPt = p => Array.isArray(p) && p.length >= 3 && [p[0], p[1], p[2]].every(v => typeof v === "number" && Number.isFinite(v));
const segKey = (a, b) => [a, b].sort().join("–");

/* нормаль плоского многоугольника (метод Ньюэлла), длина = 2·площадь */
function newell(vs) {
  let n = [0, 0, 0];
  for (let i = 0; i < vs.length; i++) n = add(n, cross(vs[i], vs[(i + 1) % vs.length]));
  return n;
}
const polyArea = vs => norm(newell(vs)) / 2;
/* расстояние от точки до плоскости многоугольника */
function planeDist(P, vs) {
  const n = newell(vs);
  return Math.abs(dot(sub(P, vs[0]), n)) / norm(n);
}
/* объём выпуклого многогранника: тетраэдры от средней точки вершин к
   веерным треугольникам граней (ориентация граней не важна) */
function convexVolume(pts, faces) {
  const names = [...new Set(faces.flat())];
  const c = avg(names.map(nm => pts[nm]));
  let V = 0;
  for (const f of faces) {
    const v = f.map(nm => pts[nm]);
    for (let i = 1; i + 1 < v.length; i++)
      V += Math.abs(dot(sub(v[0], c), cross(sub(v[i], c), sub(v[i + 1], c)))) / 6;
  }
  return V;
}
/* центр вписанной окружности: взвешенное длинами противолежащих сторон */
function incenter(A, B, C) {
  const a = dist(B, C), b = dist(C, A), c = dist(A, B);
  return scl(add(add(scl(A, a), scl(B, b)), scl(C, c)), 1 / (a + b + c));
}
const pyramidFaces = (apex, base) =>
  [base.slice(), ...base.map((b, i) => [apex, b, base[(i + 1) % base.length]])];

/* ============================================================
   2. Разбор условия
   ============================================================ */
const NUM = String.raw`(\d+(?:,\d+)?)`;
const dec = s => Number(String(s).replace(",", "."));

function parseCond(cond) {
  const t = String(cond).replace(/\s+/g, " ").trim();
  const pc = { text: t, kind: null, n: null, apex: null, apexNote: "", facts: [], defs: [], asked: null };
  const used = [];

  /* --- вопрос: «Найдите <величина>» --- */
  const H = new RegExp(String.raw`Найдите\s+(длину\s+отрезка\s+([A-Z]{2})\b|боковое\s+ребро(?:\s+([A-Z]{2})\b)?|высоту|площадь\s+боковой\s+поверхности|площадь\s+поверхности|(?:её\s+|его\s+)?объ[её]м(?:[^.,;]*?\sпирамиды\s+([A-Z]{4,})\b)?)`);
  const h = t.match(H);
  if (!h) throw new Error("не найден вопрос «Найдите …» известного вида");
  const hs = h[1];
  if (h[2]) pc.asked = { q: "len", seg: [h[2][0], h[2][1]], what: "длина " + h[2] };
  else if (/^боковое/.test(hs)) pc.asked = { q: "lateral", seg: h[3] ? [h[3][0], h[3][1]] : null, what: "боковое ребро" + (h[3] ? " " + h[3] : "") };
  else if (hs === "высоту") pc.asked = { q: "height", what: "высота" };
  else if (/боковой/.test(hs)) pc.asked = { q: "lateralArea", what: "площадь боковой поверхности" };
  else if (/^площадь/.test(hs)) pc.asked = { q: "totalArea", what: "площадь поверхности" };
  else pc.asked = { q: "volume", solid: h[4] || null, what: "объём" + (h[4] ? " " + h[4] : "") };
  /* данные ищем в тексте без заголовка вопроса (в нём самом данных нет,
     а условия после «Найдите …, если …» остаются) */
  const rest = t.slice(0, h.index) + " ∎ " + t.slice(h.index + h[0].length);

  /* --- вид тела --- */
  const kinds = [];
  if (/центр\s+куба/.test(t) && /грань\s+куба/.test(t)) kinds.push("cube");
  if (/взаимно\s+перпендикулярны/.test(t)) kinds.push("trirect");
  if (/прямоугольник\s+со\s+сторонами/.test(t)) kinds.push("rect");
  const mr = t.match(/правильн\S*\s+(треугольн|четыр[её]хугольн|шестиугольн)\S*\s+пирамид/);
  if (mr) {
    kinds.push("regular");
    pc.n = /^треуг/.test(mr[1]) ? 3 : /^четыр/.test(mr[1]) ? 4 : 6;
  }
  if (kinds.length !== 1)
    throw new Error(kinds.length ? "условие подходит под несколько моделей: " + kinds.join(", ")
      : "вид тела не распознан (нет модели)");
  pc.kind = kinds[0];

  /* --- вершина: «с вершиной S», «S — вершина», имя «SABCD» --- */
  const ma = t.match(/с\s+вершиной\s+([A-Z])\b/) || t.match(/\b([A-Z])\s+[—–-]\s+вершин/);
  const mn = t.match(/пирамид\S*\s+([A-Z]{4,})\b/);
  if (ma) pc.apex = ma[1];
  else if (mn) pc.apex = mn[1][0];
  else { pc.apex = "S"; pc.apexNote = "вершина в условии не названа — S (обозначение, принятое на чертеже)"; }

  /* --- данные --- */
  const add1 = (f, ...raw) => { pc.facts.push(f); raw.forEach(r => used.push(dec(r))); };
  const each = (re, fn) => { for (const m of rest.matchAll(re)) fn(m); };
  each(new RegExp(String.raw`[Сс]торон[аы]\s+основания[^.;,]*?\sравн[аы]\s+${NUM}`, "g"),
    m => add1({ q: "side", v: dec(m[1]), what: "сторона основания" }, m[1]));
  each(new RegExp(String.raw`[Бб]оков(?:ое|ые)\s+р[её]бр[оа][^.;,]*?\sравн[оы]\s+${NUM}`, "g"),
    m => add1({ q: "lateral", v: dec(m[1]), what: "боковое ребро" }, m[1]));
  each(new RegExp(String.raw`[Вв]ысот[аы][^.;,]*?\sравн[аы]\s+${NUM}`, "g"),
    m => add1({ q: "height", v: dec(m[1]), what: "высота" }, m[1]));
  each(new RegExp(String.raw`[Оо]бъ[её]м([^.;,]*?)\s+равен\s+${NUM}`, "g"), m => {
    const nm = (m[1].match(/\b([A-Z]{4,})\b/) || [])[1] || null;
    const cube = /куба/.test(m[1]);
    add1({ q: "volume", solid: nm, cube, v: dec(m[2]), what: "объём" + (cube ? " куба" : nm ? " " + nm : "") }, m[2]);
  });
  each(new RegExp(String.raw`\b([A-Z]{2})\s*=\s*${NUM}`, "g"),
    m => add1({ q: "len", seg: [m[1][0], m[1][1]], v: dec(m[2]), what: m[1] }, m[2]));
  each(new RegExp(String.raw`[Пп]лощадь\s+треугольника\s+([A-Z]{3})\s+равна\s+${NUM}`, "g"),
    m => add1({ q: "area", poly: m[1].split(""), v: dec(m[2]), what: "площадь " + m[1] }, m[2]));
  each(new RegExp(String.raw`прямоугольник\s+со\s+сторонами\s+${NUM}\s+и\s+${NUM}`, "g"),
    m => add1({ q: "rectSides", v: [dec(m[1]), dec(m[2])], what: "стороны прямоугольника" }, m[1], m[2]));
  each(new RegExp(String.raw`взаимно\s+перпендикулярны,?\s+каждое\s+из\s+них\s+равно\s+${NUM}`, "g"),
    m => add1({ q: "trirectEdge", v: dec(m[1]), what: "каждое боковое ребро" }, m[1]));

  /* --- определения точек --- */
  for (const m of t.matchAll(/биссектрисы\s+треугольника\s+([A-Z])([A-Z])([A-Z])\s+пересекаются\s+в\s+точке\s+([A-Z])\b/g))
    pc.defs.push({ type: "incenter", pt: m[4], tri: [m[1], m[2], m[3]] });
  for (const m of t.matchAll(/[Тт]очк[аи]\s+([A-Z])\s+[—–-]\s+центр\s+основания/g))
    pc.defs.push({ type: "center", pt: m[1] });
  for (const m of t.matchAll(/[Тт]очка\s+([A-Z])\s+[—–-]\s+середина\s+ребра\s+([A-Z])([A-Z])\b/g))
    pc.defs.push({ type: "mid", pt: m[1], a: m[2], b: m[3] });

  /* --- все числа условия должны уйти в данные --- */
  const left = (t.match(/\d+(?:,\d+)?/g) || []).map(dec);
  for (const v of used) {
    const i = left.indexOf(v);
    if (i >= 0) left.splice(i, 1);
  }
  if (left.length) throw new Error("в условии есть числа, которые верификатор не разобрал: " + left.map(fmt).join(", "));
  if (!pc.facts.length) throw new Error("из текста не извлечено ни одного данного (задача «по рисунку»? — модели нет)");

  /* --- данные, без которых модель вида не строится --- */
  const has = q => pc.facts.some(f => f.q === q);
  if (pc.kind === "cube" && !pc.facts.some(f => f.q === "volume" && f.cube)) throw new Error("нет объёма куба");
  if (pc.kind === "trirect" && !has("trirectEdge")) throw new Error("нет длины боковых рёбер");
  if (pc.kind === "rect" && !has("rectSides")) throw new Error("нет сторон прямоугольника");
  return pc;
}

/* ============================================================
   3. Модели тел (координаты в единицах условия)
   ============================================================ */
const LTRS = ["A", "B", "C", "D", "E", "F"];
const CUBE_NAMES = ["A", "B", "C", "D", "A1", "B1", "C1", "D1"];
const CUBE_FACES = [["A", "B", "C", "D"], ["A1", "B1", "C1", "D1"], ["A", "B", "B1", "A1"],
  ["B", "C", "C1", "B1"], ["C", "D", "D1", "C1"], ["D", "A", "A1", "D1"]];
const PHI0 = 0.37;   /* своя ориентация основания — не как в генераторе сцены */
const N_PARAMS = { regular: 2, rect: 3, trirect: 1, cube: 1 };

function P(M, nm) {
  if (!M.pts[nm]) throw new Error(`точка ${nm} не определена условием`);
  return M.pts[nm];
}

/* x — размеры (не логарифмы), free — параметры, которых условие не задаёт */
function baseModel(pc, x, free) {
  if (pc.kind === "regular") {
    /* правильная пирамида: основание — правильный n-угольник, вписанный
       в окружность радиуса R, вершина над центром этой окружности */
    const [R, h] = x, base = LTRS.slice(0, pc.n), pts = {};
    base.forEach((nm, i) => {
      const f = PHI0 + 2 * Math.PI * i / pc.n;
      pts[nm] = [R * Math.cos(f), R * Math.sin(f), 0];
    });
    pts[pc.apex] = [0, 0, h];
    return { pts, base, apex: pc.apex, faces: pyramidFaces(pc.apex, base) };
  }
  if (pc.kind === "rect") {
    /* основание — прямоугольник a × b; где стоит вершина, условие не
       говорит: её проекция (u·a, v·b) — свободный параметр */
    const [a, b, h] = x, base = ["A", "B", "C", "D"];
    const pts = { A: [0, 0, 0], B: [a, 0, 0], C: [a, b, 0], D: [0, b, 0] };
    pts[pc.apex] = [free.u * a, free.v * b, h];
    return { pts, base, apex: pc.apex, faces: pyramidFaces(pc.apex, base) };
  }
  if (pc.kind === "trirect") {
    /* три боковых ребра длины l вдоль трёх взаимно перпендикулярных осей */
    const [l] = x, [V, X, Y, Z] = free.names;
    const pts = { [V]: [0, 0, 0], [X]: [l, 0, 0], [Y]: [0, l, 0], [Z]: [0, 0, l] };
    return { pts, base: [X, Y, Z], apex: V, faces: pyramidFaces(V, [X, Y, Z]) };
  }
  if (pc.kind === "cube") {
    /* куб с ребром e; центр — среднее восьми вершин */
    const [e] = x, u = [[0, 0, 0], [e, 0, 0], [e, e, 0], [0, e, 0]], pts = {};
    ["A", "B", "C", "D"].forEach((nm, i) => { pts[nm] = u[i].slice(); pts[nm + "1"] = [u[i][0], u[i][1], e]; });
    pts[free.center] = avg(CUBE_NAMES.map(nm => pts[nm]));
    return { pts, cubeFaces: CUBE_FACES, faces: CUBE_FACES, center: free.center, edge: e };
  }
  throw new Error("нет модели вида " + pc.kind);
}

function applyDefs(M, pc) {
  for (const d of pc.defs) {
    if (d.type === "center") M.pts[d.pt] = avg(M.base.map(nm => P(M, nm)));
    else if (d.type === "incenter") M.pts[d.pt] = incenter(P(M, d.tri[0]), P(M, d.tri[1]), P(M, d.tri[2]));
    else if (d.type === "mid") M.pts[d.pt] = mid(P(M, d.a), P(M, d.b));
  }
  /* O в условии не определена: по соглашению задач о пирамиде это центр
     основания — для правильной центр многоугольника (среднее вершин),
     для прямоугольника точка пересечения диагоналей */
  if (!M.pts.O && pc.kind === "regular") { M.pts.O = avg(M.base.map(nm => M.pts[nm])); M.oNote = true; }
  if (!M.pts.O && pc.kind === "rect") {
    const o1 = mid(M.pts.A, M.pts.C), o2 = mid(M.pts.B, M.pts.D);
    if (dist(o1, o2) > 1e-12 * dist(M.pts.A, M.pts.C)) throw new Error("диагонали модели не делятся пополам");
    M.pts.O = o1; M.oNote = true;
  }
  return M;
}

const heightOf = M => planeDist(P(M, M.apex), M.base.map(nm => P(M, nm)));

function solidVolume(M, name) {
  if (!name) return convexVolume(M.pts, M.faces);
  const s = name.split("");
  s.forEach(nm => P(M, nm));
  return convexVolume(M.pts, pyramidFaces(s[0], s.slice(1)));
}

/* равенства «измерено на модели = данное» в логарифмах */
const lg = v => (v > 0 && Number.isFinite(v) ? Math.log(v) : NaN);
function factFns(f, free) {
  const lv = Math.log;
  switch (f.q) {
    case "side": return [M => lg(dist(P(M, M.base[0]), P(M, M.base[1]))) - lv(f.v)];
    case "lateral": return [M => lg(dist(P(M, M.apex), P(M, M.base[0]))) - lv(f.v)];
    case "height": return [M => lg(heightOf(M)) - lv(f.v)];
    case "volume":
      if (f.cube) return [M => lg(convexVolume(M.pts, M.cubeFaces)) - lv(f.v)];
      return [M => lg(solidVolume(M, f.solid)) - lv(f.v)];
    case "len": return [M => lg(dist(P(M, f.seg[0]), P(M, f.seg[1]))) - lv(f.v)];
    case "area": return [M => lg(polyArea(f.poly.map(nm => P(M, nm)))) - lv(f.v)];
    case "rectSides": {
      const [x, y] = free && free.swap ? [f.v[1], f.v[0]] : f.v;
      return [M => lg(dist(P(M, "A"), P(M, "B"))) - lv(x), M => lg(dist(P(M, "B"), P(M, "C"))) - lv(y)];
    }
    case "trirectEdge":
      return [0, 1, 2].map(i => M => lg(dist(P(M, M.apex), P(M, M.base[i]))) - lv(f.v));
  }
  throw new Error("неизвестное данное " + f.q);
}
const nConstraints = pc => pc.facts.reduce((s, f) => s + factFns(f, null).length, 0);

/* Гаусс — Ньютон по логарифмам размеров; якобиан — центральные разности */
function linSolve(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-300) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const k = M[r][c] / M[c][c];
      for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j];
    }
  }
  return M.map((r, i) => r[n] / r[i]);
}
function gaussNewton(n, F) {
  const ss = r => (r.every(Number.isFinite) ? r.reduce((s, v) => s + v * v, 0) : Infinity);
  let x = new Array(n).fill(0), r = F(x), f = ss(r);
  for (let it = 0; it < 200 && f > 1e-32; it++) {
    const J = r.map(() => new Array(n).fill(0)), e = 1e-6;
    for (let j = 0; j < n; j++) {
      const xp = x.slice(), xm = x.slice();
      xp[j] += e; xm[j] -= e;
      const rp = F(xp), rm = F(xm);
      for (let i = 0; i < r.length; i++) J[i][j] = (rp[i] - rm[i]) / (2 * e);
    }
    const A = [], g = [];
    for (let a = 0; a < n; a++) {
      A.push([]);
      for (let b = 0; b < n; b++) A[a].push(J.reduce((s, row) => s + row[a] * row[b], 0));
      g.push(-J.reduce((s, row, i) => s + row[a] * r[i], 0));
    }
    const dx = linSolve(A, g);
    if (!dx || !dx.every(Number.isFinite)) break;
    let step = 1, moved = false;
    while (step > 1e-12) {
      const xn = x.map((v, j) => v + step * dx[j]), rn = F(xn), fn = ss(rn);
      if (fn < f) { x = xn; r = rn; f = fn; moved = true; break; }
      step /= 2;
    }
    if (!moved) break;
  }
  return { x, maxRes: r.every(Number.isFinite) ? Math.max(...r.map(Math.abs)) : Infinity };
}

function solveModel(pc, free) {
  const np = N_PARAMS[pc.kind];
  const build = lx => applyDefs(baseModel(pc, lx.map(Math.exp), free), pc);
  const fns = [];
  for (const f of pc.facts) fns.push(...factFns(f, free));
  const extra = [];
  /* форма правильной пирамиды h/R, когда условие её не задаёт */
  if (pc.kind === "regular" && free && free.t) extra.push(lx => (lx[1] - lx[0]) - Math.log(free.t));
  if (fns.length + extra.length < np)
    throw new Error(`данных ${fns.length} на ${np} неизвестных размера — модель недоопределена`);
  const F = lx => {
    let M;
    try { M = build(lx); } catch (e) { return new Array(fns.length + extra.length).fill(NaN); }
    return [...fns.map(fn => fn(M)), ...extra.map(fn => fn(lx))];
  };
  const sol = gaussNewton(np, F);
  if (!(sol.maxRes <= TOL_SOLVE))
    throw new Error(`данные условия не выполняются ни при каких размерах модели (невязка ${fmt(sol.maxRes)})`);
  const M = build(sol.x);
  M.size = sol.x.map(Math.exp);
  return M;
}

/* варианты свободных параметров для расчёта ответа: ответ обязан
   от них не зависеть */
function answerVariants(pc) {
  const nc = nConstraints(pc);
  if (pc.kind === "regular") {
    if (nc >= 2) return [null];
    if (nc === 1) return [{ t: 0.35 }, { t: 1 }, { t: 2.8 }];   /* разные формы h/R */
  }
  if (pc.kind === "rect")   /* вершина над центром, над другой точкой и вне основания; стороны в обоих порядках */
    return [{ u: 0.5, v: 0.5, swap: false }, { u: 0.2, v: 0.7, swap: true }, { u: 1.3, v: -0.4, swap: false }];
  if (pc.kind === "trirect") return [{ names: ["V", "X", "Y", "Z"] }];
  if (pc.kind === "cube") return [{ center: "Ц" }];
  throw new Error("нет вариантов для вида " + pc.kind);
}

function askedValue(pc, M) {
  const a = pc.asked;
  switch (a.q) {
    case "len": return dist(P(M, a.seg[0]), P(M, a.seg[1]));
    case "lateral": {
      if (a.seg) return dist(P(M, a.seg[0]), P(M, a.seg[1]));
      const e = M.base.map(nm => dist(P(M, M.apex), P(M, nm)));
      if (relDiff(Math.max(...e), Math.min(...e)) > TOL_ANS)
        throw new Error("боковые рёбра модели не равны — «боковое ребро» неоднозначно");
      return e[0];
    }
    case "height": return heightOf(M);
    case "lateralArea": return M.faces.slice(1).reduce((s, f) => s + polyArea(f.map(nm => P(M, nm))), 0);
    case "totalArea": return M.faces.reduce((s, f) => s + polyArea(f.map(nm => P(M, nm))), 0);
    case "volume": {
      if (pc.kind === "cube") {
        /* «основанием является грань куба» — любая из шести */
        const v = M.cubeFaces.map(f => convexVolume(M.pts, pyramidFaces(M.center, f)));
        if (v.some(x => relDiff(x, v[0]) > TOL_ANS)) throw new Error("объём зависит от выбора грани");
        return v[0];
      }
      return solidVolume(M, a.solid);
    }
  }
  throw new Error("неизвестный вопрос " + a.q);
}

/* ============================================================
   4. Сцена (как её собирает trainer.js)
   ============================================================ */
let sceneData = null, bankFmtLen = null;
const showLen = x => (bankFmtLen ? String(bankFmtLen(x)) : fmt(x));

function sceneOf(p) {
  const sc = sceneData(p);
  if (!sc || !Array.isArray(sc.gen)) throw new Error("sceneData не вернула gen");
  const pts = {}, dup = [], genNames = new Set();
  for (const g of sc.gen) for (const [nm, pt] of Object.entries(g.pts || {})) {
    if (!isPt(pt)) throw new Error(`точка ${nm}: координаты ${JSON.stringify(pt)}`);
    const q = [pt[0], pt[1], pt[2]];
    if (nm in pts && dist(pts[nm], q) > 1e-12) dup.push(nm);
    pts[nm] = q;           /* как T.unitPts: последнее тело перекрывает */
    genNames.add(nm);
  }
  const cons = {};
  for (const [nm, spec] of Object.entries((p.construct && p.construct.points) || {})) {
    let q;
    if (Array.isArray(spec) && spec[0] === "mid") {
      const a = pts[spec[1]], b = pts[spec[2]];
      if (!a || !b) throw new Error(`точка построения ${nm}: нет точек ${spec[1]}/${spec[2]}`);
      q = mid(a, b);
    } else if (isPt(spec)) {
      const fb = sc.firstBox || { a: 1, b: 1, c: 1 };
      q = [spec[0] * fb.a, spec[1] * fb.b, spec[2] * fb.c];
    } else throw new Error(`точка построения ${nm}: непонятное задание ${JSON.stringify(spec)}`);
    if (!isPt(q)) throw new Error(`точка построения ${nm}: координаты ${JSON.stringify(q)}`);
    pts[nm] = q; cons[nm] = spec;
  }
  return { sc, pts, dup, cons, genNames };
}

/* свободные параметры модели, СНЯТЫЕ СО СЦЕНЫ (условие их не задаёт);
   на ответ они не влияют — это проверено вариантами в answerVariants */
function freeFromScene(pc, S, p) {
  const need = nm => { if (!S.pts[nm]) throw new Error(`на сцене нет точки ${nm}`); return S.pts[nm]; };
  if (pc.kind === "regular") {
    if (nConstraints(pc) >= 2) return null;
    /* СО СЦЕНЫ: форма h/R (условие даёт только объём) */
    const bs = LTRS.slice(0, pc.n).map(need), apex = need(pc.apex);
    return { t: planeDist(apex, bs) / dist(avg(bs), bs[0]), fromScene: "форма h/R" };
  }
  if (pc.kind === "rect") {
    /* СО СЦЕНЫ: проекция вершины на основание и какая сторона названа AB */
    const A = need("A"), B = need("B"), C = need("C"), D = need("D"), V = need(pc.apex);
    const n = newell([A, B, C, D]), nh = scl(n, 1 / norm(n));
    const F = sub(V, scl(nh, dot(sub(V, A), nh)));
    const u = dot(sub(F, A), sub(B, A)) / dot(sub(B, A), sub(B, A));
    const v = dot(sub(F, A), sub(D, A)) / dot(sub(D, A), sub(D, A));
    /* какая сторона названа AB: по числовой подписи на AB, если она есть
       (тогда неверная сцена не «перевернёт» модель), иначе по сцене */
    const f = pc.facts.find(x => x.q === "rectSides");
    const labAB = [...(p.labels || []), ...((p.construct && p.construct.segments) || [])]
      .filter(s => Array.isArray(s) && s.length >= 3 && segKey(s[0], s[1]) === segKey("A", "B"))
      .map(s => labelNum(s[2])).find(x => x !== null);
    let swap;
    if (labAB !== undefined && f.v[0] !== f.v[1] && (relDiff(labAB, f.v[0]) <= TOL_ANS || relDiff(labAB, f.v[1]) <= TOL_ANS))
      swap = relDiff(labAB, f.v[0]) > TOL_ANS;
    else {
      const r = dist(A, B) / dist(B, C);
      swap = relDiff(r, f.v[1] / f.v[0]) < relDiff(r, f.v[0] / f.v[1]);
    }
    return { u, v, swap, fromScene: "положение вершины" + (labAB === undefined ? " и порядок сторон" : "") };
  }
  if (pc.kind === "trirect") {
    /* СО СЦЕНЫ: какие точки чертежа — вершины пирамиды (construct.solid)
       и какая из них общая для трёх перпендикулярных рёбер */
    const solid = p.construct && p.construct.solid;
    if (!solid) throw new Error("на чертеже не выделена пирамида (construct.solid)");
    const V4 = [...new Set(solid.flat())];
    if (V4.length !== 4) throw new Error(`выделенное тело имеет ${V4.length} вершин, а не 4`);
    V4.forEach(need);
    const cand = V4.filter(X => {
      const o = V4.filter(y => y !== X).map(y => sub(S.pts[y], S.pts[X]));
      return [[0, 1], [0, 2], [1, 2]].every(([i, j]) => Math.abs(dot(o[i], o[j])) <= 1e-9 * norm(o[i]) * norm(o[j]));
    });
    if (cand.length !== 1)
      throw new Error("у выделенной пирамиды нет вершины, где три ребра попарно перпендикулярны");
    return { names: [cand[0], ...V4.filter(y => y !== cand[0])], fromScene: "соответствие вершин" };
  }
  if (pc.kind === "cube") {
    /* СО СЦЕНЫ: как на чертеже названа вершина пирамиды (центр куба) */
    const solid = p.construct && p.construct.solid;
    if (!solid) throw new Error("на чертеже не выделена пирамида (construct.solid)");
    const c = [...new Set(solid.flat())].filter(nm => !CUBE_NAMES.includes(nm));
    if (c.length !== 1) throw new Error("не найдена вершина выделенной пирамиды вне вершин куба");
    return { center: c[0], fromScene: "имя центра куба" };
  }
  return null;
}

/* число из подписи: 18 · 4,5 · √12 · 2√3; иначе null */
function labelNum(s) {
  const t = String(s).trim();
  let m = t.match(/^(\d+(?:,\d+)?)$/);
  if (m) return dec(m[1]);
  m = t.match(/^(\d+(?:,\d+)?)?\s*√\s*(\d+(?:,\d+)?)$/);
  if (m) return (m[1] ? dec(m[1]) : 1) * Math.sqrt(dec(m[2]));
  return null;
}

/* ============================================================
   5. Проверка одной задачи
   ============================================================ */
function checkScene(p, pc, S, ans, e0, w, info, note) {
  /* чертёж честно помечен как схематичный («не в масштабе») — тогда
     несходство масштаба только предупреждение; у задач этой темы такой
     пометки сейчас нет */
  const schematic = /не\s+в\s+масштабе|схематичн/i.test(
    [p.cond, p.scene && p.scene.note, p.caption].filter(Boolean).join(" "));
  const e = schematic ? (m => w("[чертёж помечен как схематичный] " + m)) : e0;
  const prims0 = (p.scene && p.scene.prims) || [];
  if (prims0.length === 1 && prims0[0].kind === "pyramid" && pc.kind === "regular" && prims0[0].n !== pc.n) {
    e(`на сцене ${prims0[0].n}-угольная пирамида, в условии ${pc.n}-угольная`);
    return null;
  }
  const free = freeFromScene(pc, S, p);
  if (free && free.fromScene) info.push("со сцены: " + free.fromScene);
  const M = solveModel(pc, free);
  if (M.oNote) info.push("O — центр основания (в условии не определена)");
  if (pc.apexNote && (pc.kind === "regular" || pc.kind === "rect")) info.push(pc.apexNote);

  /* точки построения, которых нет в условии: так же, как их задаёт
     чертёж (середины — по точкам модели) */
  for (const [nm, spec] of Object.entries(S.cons)) {
    if (nm in M.pts) continue;
    if (Array.isArray(spec) && spec[0] === "mid" && M.pts[spec[1]] && M.pts[spec[2]]) {
      M.pts[nm] = mid(M.pts[spec[1]], M.pts[spec[2]]);
      info.push(`${nm} — середина ${spec[1]}${spec[2]} (точка построения, в условии не названа)`);
    } else if (pc.kind === "cube" && isPt(spec)) {
      M.pts[nm] = scl([spec[0], spec[1], spec[2]], M.edge);
    }
  }

  /* куб-достроение для пирамиды с перпендикулярными рёбрами: каждая
     лишняя точка сцены — вершина куба на трёх боковых рёбрах */
  if (pc.kind === "trirect") {
    const [V0, ...ax] = free.names;
    const eS = ax.map(nm => sub(S.pts[nm], S.pts[V0])), eM = ax.map(nm => sub(M.pts[nm], M.pts[V0]));
    const helper = [];
    for (const nm of Object.keys(S.pts)) {
      if (nm in M.pts) continue;
      const d = sub(S.pts[nm], S.pts[V0]);
      const eps = eS.map(v => dot(d, v) / dot(v, v));
      const r = eps.map(Math.round);
      const back = eS.reduce((s, v, i) => add(s, scl(v, r[i])), [0, 0, 0]);
      if (!r.every((x, i) => (x === 0 || x === 1) && Math.abs(eps[i] - x) < 1e-9) || dist(back, d) > 1e-9 * norm(eS[0])) {
        e(`точка ${nm} сцены — не вершина куба, достроенного на боковых рёбрах пирамиды`);
        continue;
      }
      M.pts[nm] = eM.reduce((s, v, i) => add(s, scl(v, r[i])), M.pts[V0]);
      helper.push(nm);
    }
    if (helper.length) info.push("куб-достроение: " + helper.join(", "));
  }

  /* точки сцены, которых нет в фигуре условия */
  for (const nm of Object.keys(S.pts)) {
    if (nm in M.pts) continue;
    if (S.genNames.has(nm)) e(`точка ${nm} есть на сцене, но её нет в фигуре из условия`);
    else w(`точка построения ${nm} (${JSON.stringify(S.cons[nm])}) не проверена — модель её не знает`);
  }
  if (S.dup.length) w(`имена точек повторяются у разных тел сцены: ${S.dup.join(", ")}`);

  const common = Object.keys(S.pts).filter(nm => nm in M.pts);
  const sd = (a, b) => dist(S.pts[a], S.pts[b]), md = (a, b) => dist(M.pts[a], M.pts[b]);
  const inBoth = nm => nm in S.pts && nm in M.pts;

  /* подписи: числовые и «?» */
  const labeled = [];
  for (const [src, list] of [["подпись", p.labels || []], ["построение", (p.construct && p.construct.segments) || []]])
    for (const s of list) {
      if (!Array.isArray(s) || s.length < 3 || typeof s[2] !== "string") continue;
      const txt = s[2].trim();
      const num = txt === "?" ? null : labelNum(txt);
      if (txt !== "?" && num === null) { if (/\d/.test(txt)) w(`подпись «${txt}» на ${s[0]}${s[1]} не разобрана как число`); continue; }
      if (!inBoth(s[0]) || !inBoth(s[1])) { e(`подпись «${txt}» стоит на ${s[0]}${s[1]}, а такой точки нет на сцене или в фигуре условия`); continue; }
      labeled.push({ a: s[0], b: s[1], txt, num, src });
    }
  /* числовая подпись = длина отрезка в фигуре из условия */
  for (const L of labeled)
    if (L.num !== null && relDiff(L.num, md(L.a, L.b)) > TOL_ANS)
      e(`${L.src} «${L.txt}» на ${L.a}${L.b} не совпадает с условием: по условию ${L.a}${L.b} = ${fmt(md(L.a, L.b))}`);

  /* что сверяем с единым масштабом k: сцена = k^pow · условие */
  const items = [], seen = new Set();
  const seg = (a, b, tag) => {
    const key = segKey(a, b);
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ name: a + b + tag, sd: sd(a, b), want: md(a, b), pow: 1, q: tag === " («?»)" ? [a, b] : null });
  };
  for (const L of labeled)
    if (L.num !== null) {
      seen.add(segKey(L.a, L.b));
      items.push({ name: `${L.a}${L.b} (подпись «${L.txt}»)`, sd: sd(L.a, L.b), want: L.num, pow: 1 });
    }
  for (const L of labeled) if (L.num === null) seg(L.a, L.b, " («?»)");
  /* размеры из задания сцены (scene.prims / dims) */
  const prims = (p.scene && p.scene.prims) || (p.dims ? [{ kind: "box", a: p.dims[0], b: p.dims[1], c: p.dims[2] }] : []);
  if (prims.length === 1) {
    const pr = prims[0], tag = p.scene && p.scene.prims ? "scene.prims[0]." : "dims.";
    const dimsOf = {
      pyramid: { a: () => md("A", "B"), h: () => heightOf(M) },
      pyramid_rect: { a: () => md("A", "B"), b: () => md("B", "C"), h: () => heightOf(M) },
      box: { a: () => md("A", "B"), b: () => md("A", "D"), c: () => md("A", "A1") }
    }[pr.kind];
    if (!dimsOf) w(`тело сцены «${pr.kind}» — размеры задания сцены не сверяются`);
    else for (const [key, f] of Object.entries(dimsOf)) {
      if (typeof pr[key] !== "number") continue;
      let want;
      try { want = f(); } catch (err) { w(`${tag}${key}: не с чем сверить (${err.message})`); continue; }
      items.push({ name: tag + key, sd: pr[key], want, pow: 1 });
    }
  } else if (prims.length > 1) w(`на сцене ${prims.length} тел — размеры задания сцены не сверяются`);
  /* объём подсвеченного тела */
  const solid = p.construct && p.construct.solid;
  if (solid && solid.flat().every(inBoth)) {
    const vS = convexVolume(S.pts, solid), vM = convexVolume(M.pts, solid);
    const nm = [...new Set(solid.flat())].join("");
    items.push({ name: `объём выделенного тела ${nm}`, sd: vS, want: vM, pow: 3 });
    if (pc.asked.q === "volume") {
      const known = [ans, ...pc.facts.filter(f => f.q === "volume").map(f => f.v)];
      if (!known.some(v => relDiff(v, vM) <= TOL_ANS))
        w(`выделенное тело ${nm} (объём ${fmt(vM)}) — ни искомое, ни данное в условии`);
    }
  }
  /* givenFaces: «… = N» — площадь грани */
  for (const gf of (p.givenFaces || [])) {
    const m = String(gf.text || "").match(/=\s*(\d+(?:,\d+)?)\s*$/);
    if (!m || !gf.face.every(inBoth)) continue;
    const aM = polyArea(gf.face.map(nm => M.pts[nm]));
    if (relDiff(dec(m[1]), aM) > TOL_ANS) e(`площадь грани ${gf.face.join("")} подписана ${m[1]}, по условию ${fmt(aM)}`);
    items.push({ name: `площадь грани ${gf.face.join("")}`, sd: polyArea(gf.face.map(nm => S.pts[nm])), want: aM, pow: 2 });
  }
  /* все попарные расстояния названных точек — фигура целиком */
  for (let i = 0; i < common.length; i++)
    for (let j = i + 1; j < common.length; j++) seg(common[i], common[j], "");

  let diam = 0;
  for (const it of items) if (it.pow === 1) diam = Math.max(diam, it.want);
  const badAt = kk => items.filter(it => {
    const target = Math.pow(kk, it.pow) * it.want;
    if (it.want <= 1e-12 * diam) return Math.abs(it.sd) > 1e-9 * kk * diam;
    return relDiff(it.sd, target) > TOL_GEO;
  });

  /* масштаб k. Кандидаты: каждая числовая подпись, согласная с условием
     (неверная уже отмечена выше), и ребро основания. Берётся тот, с
     которым сходится больше всего величин, — так один испорченный
     отрезок не «сдвигает» всю фигуру; при равенстве — первый кандидат. */
  const cands = [];
  for (const L of labeled)
    if (L.num !== null && relDiff(L.num, md(L.a, L.b)) <= TOL_ANS)
      cands.push({ k: sd(L.a, L.b) / L.num, what: `подписи «${L.txt}» на ${L.a}${L.b}`, a: L.a, b: L.b });
  {
    const [a, b] = pc.kind === "trirect" ? [free.names[0], free.names[1]] : ["A", "B"];
    if (inBoth(a) && inBoth(b))
      cands.push({ k: sd(a, b) / md(a, b), what: `ребру ${a}${b} (на сцене ${fmt(sd(a, b))}, по условию ${fmt(md(a, b))})`, a, b });
  }
  let ref = null, bad = null;
  for (const c of cands) {
    if (!(c.k > 0) || !Number.isFinite(c.k)) continue;
    const b = badAt(c.k);
    if (!ref || b.length < bad.length) { ref = c; bad = b; }
  }
  if (!ref) { e("масштаб сцены не определяется: нет ни числовой подписи, ни ребра основания"); return M; }
  const k = ref.k;
  if (bad.length) {
    const show = bad.slice(0, 6).map(it => {
      const target = Math.pow(k, it.pow) * it.want;
      let s = `${it.name}: на сцене ${fmt(it.sd)}, по условию ${fmt(it.want)} → в масштабе ${fmt(target)}`;
      if (it.q && showLen(it.sd) !== showLen(it.want))
        s += ` [после «Показать ответ» панель измерений покажет ${it.q.join("")} = ${showLen(it.sd)}, а по условию ${it.q.join("")} = ${showLen(it.want)}]`;
      return s;
    });
    e(`чертёж не подобен фигуре из условия (масштаб k = ${fmt(k)} по ${ref.what}; ` +
      `не сходится ${bad.length} из ${items.length} величин): ` + show.join("; ") +
      (bad.length > 6 ? `; и ещё ${bad.length - 6}` : ""));
  }
  /* поле unit: длина условия на единицу сцены — панель измерений показывает
     fmtLen(длина на сцене · unit); при масштабе k (сцена / условие) верно unit = 1/k */
  const hasU = p.unit !== undefined, u = hasU ? p.unit : 1;
  if (hasU && !(typeof u === "number" && Number.isFinite(u) && u > 0)) e(`unit = ${String(u)} — не положительное число`);
  else if (hasU && relDiff(k * u, 1) > TOL_GEO)
    e(`unit = ${fmt(u)} не согласован с масштабом сцены k = ${fmt(k)} (по ${ref.what}; нужно 1/k = ${fmt(1 / k)}): ` +
      `панель измерений покажет длины, умноженные на ${fmt(k * u)}`);
  if (!bad.length && !hasU && relDiff(k, 1) > TOL_GEO) {
    const [a, b] = [ref.a, ref.b];
    /* видно ли это на экране: панель покажет fmtLen(длина на сцене) — сравниваем
       строки для ВСЕХ длин между названными точками, не только для опорной */
    const lens = items.filter(it => it.pow === 1);
    const shown = lens.filter(it => showLen(it.sd) !== showLen(it.want));
    const vis = !shown.length
      ? `на экране не видно: все ${lens.length} длин панель показывает так же, как при k = 1 (${a}${b} = ${showLen(sd(a, b))})`
      : `после «Показать ответ» панель измерений покажет ${shown[0].name} = ${showLen(shown[0].sd)} вместо ${showLen(shown[0].want)}` +
        (shown.length > 1 ? ` (и ещё ${shown.length - 1})` : "");
    const rounded = !(free && free.fromScene === "форма h/R");
    const why = rounded
      ? "размер в задании сцены округлён"
      : "условие задаёт только объём, форма и размеры чертежа — один из допустимых вариантов";
    /* округление, невидимое ни в одной длине, — примечание; остальное — предупреждение */
    (rounded && !shown.length && note ? note : w)(`сцена подобна условию, но в масштабе k = ${fmt(k)} (${why}); ${vis}`);
  }
  /* искомый отрезок отмечен «?» */
  if (["len", "lateral", "height"].includes(pc.asked.q) &&
      !labeled.some(L => L.num === null && relDiff(md(L.a, L.b), ans) <= TOL_ANS))
    w(`искомая величина (${pc.asked.what} = ${fmt(ans)}) не отмечена на чертеже отрезком «?»`);
  info.push(`масштаб ${fmt(k)}, сверено величин ${items.length}`);
  return M;
}

function verifyOne(p, E, W, rows, N) {
  const id = String(p.id);
  const e = m => E(`${id}: ${m}`), w = m => (STRICT ? E : W)(`${id}: ${m}`), note = N ? m => N(`${id}: ${m}`) : null;
  const info = [];
  let pc;
  try { pc = parseCond(p.cond); } catch (err) { e("условие не разобрано: " + err.message); return; }

  /* 1. ответ — от условия, при всех вариантах свободных параметров */
  let got = NaN;
  try {
    const vals = answerVariants(pc).map(v => askedValue(pc, solveModel(pc, v)));
    got = vals[0];
    if (vals.some(v => relDiff(v, got) > TOL_ANS))
      e(`ответ зависит от того, чего условие не задаёт: ${vals.map(fmt).join(" / ")}`);
    if (vals.length > 1) info.push(`ответ одинаков при ${vals.length} вариантах свободных параметров`);
  } catch (err) { e("ответ не пересчитан: " + err.message); }
  const want = dec(String(p.ans).trim());
  if (!Number.isFinite(want)) e(`ответ в банке не число: «${p.ans}»`);
  else if (Number.isFinite(got) && relDiff(got, want) > TOL_ANS)
    e(`ответ: пересчёт от условия даёт ${fmt(got)}, в банке ${p.ans}`);

  /* 2. чертёж */
  let S;
  try { S = sceneOf(p); } catch (err) { e("сцена не строится: " + err.message); return; }
  if (Number.isFinite(got)) {
    try { checkScene(p, pc, S, got, e, w, info, note); }
    catch (err) { e("чертёж не проверен: " + err.message); }
  }
  const facts = pc.facts.map(f => `${f.what} ${Array.isArray(f.v) ? f.v.join(" и ") : fmt(f.v)}`).join("; ");
  rows.push(`  ${id.padEnd(7)} ответ ${String(p.ans).padEnd(5)} пересчёт ${fmt(got).padEnd(6)} ` +
    `[${pc.kind}${pc.n ? " n=" + pc.n : ""}] дано: ${facts}; найти: ${pc.asked.what}; ${info.join("; ")}`);
}

/* ============================================================
   6. Прогон
   ============================================================ */
function main() {
  let api;
  try { api = loadData(DATA_JS); }
  catch (err) {
    console.log(`Не удалось загрузить ${DATA_JS}: ${err.message}`);
    console.log(`${TOPIC} (старые): задач 0, расхождений 1`);
    process.exit(1);
  }
  sceneData = api.sceneData;
  bankFmtLen = api.fmtLen;
  const errs = [], warns = [], notes = [], rows = [];
  const legacy = api.PROBLEMS.filter(p => p && /^\d+$/.test(String(p.id)) && p.topic === TOPIC);
  console.log(`Линейка: ${DATA_JS}`);
  console.log(`Задач в PROBLEMS: ${api.PROBLEMS.length}; старых «${TOPIC}» (числовой id): ${legacy.length}`);
  if (legacy.length !== EXPECTED_COUNT)
    errs.push(`банк: старых задач темы «${TOPIC}» ${legacy.length}, должно быть ровно ${EXPECTED_COUNT}`);
  const seen = new Set();
  for (const p of legacy) {
    if (seen.has(String(p.id))) errs.push(`${p.id}: id повторяется`);
    seen.add(String(p.id));
  }
  for (const p of legacy) {
    try { verifyOne(p, m => errs.push(m), m => warns.push(m), rows, m => notes.push(m)); }
    catch (err) { errs.push(`${p.id}: проверка не выполнена: ${err.message}`); }
  }
  if (VERBOSE) rows.forEach(r => console.log(r));
  notes.forEach(m => console.log("примечание " + m));
  warns.forEach(m => console.log("предупреждение " + m));
  errs.forEach(m => console.log("РАСХОЖДЕНИЕ " + m));
  console.log(`${TOPIC} (старые): задач ${legacy.length}, расхождений ${errs.length}`);
  if (warns.length) console.log(`(предупреждений ${warns.length} — на код выхода не влияют; --strict делает их расхождениями)`);
  if (errs.length) process.exit(1);
  console.log("LEGACY_PIR_VERIFY_OK");
}
main();
