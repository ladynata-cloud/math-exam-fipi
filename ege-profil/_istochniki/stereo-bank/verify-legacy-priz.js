#!/usr/bin/env node
/* verify-legacy-priz.js — независимый верификатор СТАРЫХ задач стерео-банка
   темы «Призма»: 14 задач с числовыми id (номера Решу ЕГЭ). Под этими id
   у учеников записан прогресс (stereo3.status), поэтому здесь ничего
   не правится — верификатор только читает линейку.

   Запуск (голый Node, без зависимостей, без require чужих файлов):
     node verify-legacy-priz.js                 линейка ../../trainers/stereo
     STEREO_ROOT=<папка линейки> node verify-legacy-priz.js
     ключ -v (--verbose) — по строке на каждую задачу;
     ключ --strict — дефекты видимости (точки разных тел с одинаковыми
       именами, из-за чего тренажёр рисует тело не на своём месте)
       считаются расхождениями, а не предупреждениями.
   Линейка — папка с js/data.js (PROBLEMS и sceneData). Годится и
   опубликованная trainers/ege-profile-stereometry-3d, и объединённый банк
   курса ege-profil/trainers/stereo (там sceneData — диспетчер, для старых
   задач он вызывает легаси-генератор). Берутся задачи PROBLEMS с id из
   одних цифр и topic === "Призма" — ровно 14; новые задачи (id вида
   priz-01) пропускаются, их проверяет verify-priz.js.

   Что проверяется у КАЖДОЙ задачи
   1. Ответ. Формулировка p.cond распознаётся одной из моделей (регулярка
      на весь текст — лишнее или пропущенное число не даст совпадения),
      числа берутся из того же текста, модель сверяется с ожидаемой по id.
      Ответ пересчитывается своим кодом, а не формулой из решения: по
      числам условия строится призма в координатах (правильный
      многоугольник — «черепашкой»: n шагов длины a с поворотом на 360°/n),
      неизвестный размер находится бисекцией по величине, измеренной на
      построенном теле; объём и полная поверхность — по выпуклой оболочке
      вершин, боковая поверхность — сумма граней, отсечённые части —
      отсечением оболочки плоскостью, сечение — пересечением с плоскостью.
      Формул вида «P·h», «½ab», «V/3», «V/4» здесь нет.
      Где условие не задаёт тело однозначно (произвольная треугольная
      призма, сторона основания не дана), ответ считается на нескольких
      разных телах, в том числе наклонных, и обязан совпасть на всех —
      так проверяется и корректность самой задачи.
      p.ans участвует только в итоговой сверке; p.sol и p.hint не читаются.
      Данных «ПО РИСУНКУ» в этих 14 задачах нет: все числа — в тексте.
      Чертёж используется только в части 2 (в т. ч. чтобы узнать, какую
      из трёх средних линий провёл чертёж, — ответ от этого не зависит,
      это проверено в модели).
   2. Чертёж — выход sceneData(p), собранный так, как его собирает
      trainer.js (точки всех тел — в один словарь, последнее тело
      выигрывает; точки построения — как resolvePt):
      • каждое тело сцены — призма ABC…A₁B₁C₁… (боковые рёбра равны и
        параллельны, основание плоское и выпуклое, O и O₁ — центры
        оснований); прямая / правильная / прямоугольный треугольник /
        ромб в основании — если так сказано в условии;
      • числовые подписи (labels, подписанные отрезки построения), данные
        условия и искомая величина, измеренные на чертеже, сводятся к
        ОДНОМУ масштабу k на задачу (длины ~ k, площади ~ k², объёмы ~ k³,
        отношения ~ 1; допуск 1e-6);
      • подпись «?» стоит на искомом отрезке и имеет длину ответа;
      • тело построения (construct.solid) — именно то тело, о котором
        спрашивают или которое отсекают, и оно замкнуто (грани, которых
        нет в solid, может закрывать заливка сечения construct.fills —
        тренажёр рисует обе полупрозрачными гранями);
      • закрашенное сечение (construct.fills) — именно сечение из условия;
      • неподписанные отрезки построения — следы секущей плоскости (лежат
        в ней) или рёбра многогранника из условия — смотря по модели.
      Масштаб k: тренажёр после ответа показывает длину любого отрезка как
      fmtLen(расстояние в сцене · unit), unit — поле задачи (по умолчанию 1).
      Задан unit — он обязан быть равен 1/k (иначе расхождение). Не задан —
      чертёж с числовыми подписями обязан быть в масштабе k = 1 (иначе —
      расхождение); если числовых подписей нет и условие не задаёт размеров
      тела (дан только объём или площадь, или не дана сторона основания),
      чертёж — схема одного из допустимых тел: k ≠ 1 — предупреждение.
      Предупреждения (не ошибки): схематичный масштаб, совпадающие имена
      точек у разных тел сцены (без --strict), числа условия, подписанные
      только в построении, подписи, которых нет в условии, сторона
      основания, округлённая в сцене до сотых (модель vertpoly: только
      ровно до сотых и только если на экране это не видно — иначе
      расхождение).
   Печать: строка на каждое расхождение, затем
     «Призма (старые): задач N, расхождений K»;
   при K = 0 — маркер LEGACY_PRIZ_VERIFY_OK и код 0, иначе код 1. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const STEREO_ROOT = process.env.STEREO_ROOT
  ? path.resolve(process.env.STEREO_ROOT)
  : path.resolve(__dirname, "..", "..", "trainers", "stereo");
const DATA_JS = path.join(STEREO_ROOT, "js", "data.js");
const TOPIC = "Призма";
const EXPECTED_COUNT = 14;
const TOL_ANS = 1e-9;    /* ответ: относительный допуск */
const TOL_GEO = 1e-6;    /* единый масштаб чертежа: относительный допуск */
const TOL_SHAPE = 1e-9;  /* форма тела: равенство рёбер, прямые углы, плоскостность */
const VERBOSE = process.argv.includes("-v") || process.argv.includes("--verbose");
const STRICT = process.argv.includes("--strict");

/* id → модель, которой обязана распознаться формулировка */
const EXPECT = {
  "27057": "regprism", "27062": "rhombprism", "27063": "regprism-h", "27082": "rtprism",
  "27083": "rtprism-h", "27106": "midline", "27107": "midline", "27112": "cutpyr",
  "27132": "rtprism", "27153": "midline", "245340": "vertpoly", "639940": "recast",
  "324457": "diagsection", "509576": "rtprism"
};

/* ============================================================
   0. Загрузка data.js в песочницу vm
   Копия идеи _load.js (чужие файлы не подключаются): data.js —
   браузерный скрипт, THREE и DOM нужны ему только при отрисовке,
   для загрузки хватает заглушек. Работает и со старым data.js
   линейки (PROBLEMS и sceneData — глобальные const/function, без
   module.exports), и с объединённым (есть блок module.exports).
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
  /* const/let верхнего уровня живут в общей лексической области контекста —
     следующий скрипт в том же контексте их видит */
  const g = new vm.Script(
    "({ P: typeof PROBLEMS !== 'undefined' ? PROBLEMS : undefined," +
    "   S: typeof sceneData === 'function' ? sceneData : undefined," +
    "   F: typeof fmtLen === 'function' ? fmtLen : undefined })"
  ).runInContext(ctx);
  const ex = sandbox.module.exports || {};
  const PROBLEMS = g.P || ex.PROBLEMS;
  const sceneData = g.S || (typeof ex.sceneData === "function" ? ex.sceneData : undefined);
  if (!Array.isArray(PROBLEMS)) throw new Error("в data.js нет массива PROBLEMS");
  if (typeof sceneData !== "function") throw new Error("в data.js нет функции sceneData");
  const fmtLen = g.F || (typeof ex.fmtLen === "function" ? ex.fmtLen : undefined);
  return { PROBLEMS, sceneData, fmtLen };
}
/* как тренажёр покажет длину (fmtLen банка) — для сверки видимого округления */
let bankFmtLen = null;

/* ============================================================
   1. Векторная арифметика
   ============================================================ */
const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const add = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
const scl = (p, s) => [p[0] * s, p[1] * s, p[2] * s];
const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
const norm = p => Math.hypot(p[0], p[1], p[2]);
const dist = (p, q) => norm(sub(p, q));
const unit = p => scl(p, 1 / norm(p));
const mean = arr => scl(arr.reduce(add, [0, 0, 0]), 1 / arr.length);
const lerp = (p, q, t) => add(p, scl(sub(q, p), t));
const angleAt = (p, q, r) => { const u = sub(p, q), v = sub(r, q); return Math.atan2(norm(cross(u, v)), dot(u, v)); };
const relDiff = (x, y) => Math.abs(x - y) / Math.max(Math.abs(x), Math.abs(y), 1e-300);
const fmt = x => (Number.isFinite(x) ? String(+x.toPrecision(12)).replace(".", ",") : String(x));
const isPt = p => Array.isArray(p) && p.length >= 3 && [p[0], p[1], p[2]].every(Number.isFinite);
const P3 = p => [p[0], p[1], p[2]];          /* копия точки из песочницы vm */
const DEG = 180 / Math.PI;

/* нормаль Ньюэлла: |N| = 2·площадь многоугольника */
function newell(poly) {
  const n = [0, 0, 0];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    n[0] += (p[1] - q[1]) * (p[2] + q[2]);
    n[1] += (p[2] - q[2]) * (p[0] + q[0]);
    n[2] += (p[0] - q[0]) * (p[1] + q[1]);
  }
  return n;
}
const polyArea = poly => norm(newell(poly)) / 2;
const extentOf = pts => { const c = mean(pts); return Math.max(...pts.map(p => dist(p, c)), 1e-300); };
function dedupe(pts, eps) {
  const out = [];
  for (const p of pts) if (!out.some(q => dist(p, q) <= eps)) out.push(p);
  return out;
}
const sameSet = (A, B, eps) => A.length === B.length &&
  A.every(p => B.some(q => dist(p, q) <= eps)) && B.every(q => A.some(p => dist(p, q) <= eps));
function planeOf(a, b, c) {
  const n = cross(sub(b, a), sub(c, a));
  if (norm(n) <= 1e-12 * Math.max(dist(a, b), dist(a, c)) ** 2) throw new Error("три точки на одной прямой — плоскость не определена");
  const u = unit(n);
  return { n: u, d: dot(u, a) };
}

/* ============================================================
   2. Выпуклые оболочки, отсечение, сечение
   ============================================================ */
/* выпуклая оболочка точек одной плоскости (нормаль n): только углы, по порядку */
function hull2(points, n) {
  if (points.length < 3) return points.slice();
  const c = mean(points);
  let far = points[0];
  for (const p of points) if (dist(p, c) > dist(far, c)) far = p;
  const ext = dist(far, c);
  if (!(ext > 0)) return [points[0]];
  const u = unit(sub(far, c)), v = cross(unit(n), u);
  const q = points.map(p => ({ p, x: dot(sub(p, c), u), y: dot(sub(p, c), v) }))
    .sort((a, b) => a.x - b.x || a.y - b.y);
  const tol = 1e-12 * ext * ext;
  const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower = [], upper = [];
  for (const o of q) {
    while (lower.length >= 2 && cr(lower[lower.length - 2], lower[lower.length - 1], o) <= tol) lower.pop();
    lower.push(o);
  }
  for (let i = q.length - 1; i >= 0; i--) {
    const o = q[i];
    while (upper.length >= 2 && cr(upper[upper.length - 2], upper[upper.length - 1], o) <= tol) upper.pop();
    upper.push(o);
  }
  upper.pop(); lower.pop();
  return lower.concat(upper).map(o => o.p);
}

/* выпуклая оболочка в пространстве перебором опорных плоскостей (точек ≤ 16).
   Возвращает грани (кольца углов), вершины, объём и площадь поверхности. */
function hull3(input) {
  const P = dedupe(input, 1e-9 * extentOf(input));
  const ext = extentOf(P), eps = 1e-9 * ext;
  const G = mean(P);
  const planes = [];
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) for (let k = j + 1; k < P.length; k++) {
    let n = cross(sub(P[j], P[i]), sub(P[k], P[i]));
    const nn = norm(n);
    if (nn <= 1e-12 * ext * ext) continue;
    n = scl(n, 1 / nn);
    let d = dot(n, P[i]);
    if (dot(n, G) > d) { n = scl(n, -1); d = -d; }
    if (P.some(q => dot(n, q) - d > eps)) continue;
    if (planes.some(pl => dot(pl.n, n) > 1 - 1e-12 && Math.abs(pl.d - d) <= eps)) continue;
    planes.push({ n, d });
  }
  if (planes.length < 4) return { degenerate: true, volume: 0, surface: 0, faces: [], points: P };
  let volume = 0, surface = 0;
  const faces = planes.map(({ n, d }) => {
    const ring = hull2(P.filter(q => Math.abs(dot(n, q) - d) <= eps), n);
    const area = polyArea(ring);
    surface += area;
    volume += area * (d - dot(n, G)) / 3;   /* пирамида с вершиной G над гранью */
    return { n, d, ring, area };
  });
  const points = dedupe([].concat(...faces.map(f => f.ring)), eps);
  return { degenerate: false, volume, surface, faces, points };
}

/* часть выпуклого тела (вершины points) по сторону sigma·(n·x − d) ≥ 0.
   Точки пересечения берутся на всех отрезках между вершинами по разные
   стороны: все они лежат в сечении, лишние отбрасывает оболочка. */
function clipHalf(points, n, d, sigma) {
  const eps = 1e-9 * extentOf(points);
  const s = points.map(q => sigma * (dot(n, q) - d));
  const keep = points.filter((q, i) => s[i] >= -eps);
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++)
    if ((s[i] > eps && s[j] < -eps) || (s[i] < -eps && s[j] > eps))
      keep.push(lerp(points[i], points[j], s[i] / (s[i] - s[j])));
  return hull3(keep);
}

/* сечение выпуклого тела плоскостью: многоугольник (углы по порядку) и площадь */
function planeSection(points, n, d) {
  const eps = 1e-9 * extentOf(points);
  const s = points.map(q => dot(n, q) - d);
  const cand = points.filter((q, i) => Math.abs(s[i]) <= eps);
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++)
    if ((s[i] > eps && s[j] < -eps) || (s[i] < -eps && s[j] > eps))
      cand.push(lerp(points[i], points[j], s[i] / (s[i] - s[j])));
  const ring = hull2(dedupe(cand, eps), n);
  return { ring, area: ring.length >= 3 ? polyArea(ring) : 0 };
}

/* ============================================================
   3. Призма: описание и измерения
   Призма = { n, names:[A,B,…], base:[точки], top:[точки] }; вершина
   верхнего основания над X называется X1 (в сцене — X1 + суффикс тела).
   Одни и те же измерения применяются к телу модели и к телу чертежа.
   ============================================================ */
const LTRS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function prismFrom(pts, px) {
  const names = [];
  for (const L of LTRS) {
    if (isPt(pts[L + px]) && isPt(pts[L + "1" + px])) names.push(L);
    else break;
  }
  if (names.length < 3) return null;
  return { n: names.length, names, px,
    base: names.map(L => P3(pts[L + px])), top: names.map(L => P3(pts[L + "1" + px])) };
}

const PR = {
  pts: P => P.base.concat(P.top),
  lat: P => mean(P.top.map((t, i) => sub(t, P.base[i]))),          /* вектор бокового ребра */
  nrm: P => unit(newell(P.base)),                                   /* нормаль основания */
  height: P => Math.abs(dot(PR.lat(P), PR.nrm(P))),                 /* расстояние между основаниями */
  edge: P => norm(PR.lat(P)),                                       /* длина бокового ребра */
  baseArea: P => polyArea(P.base),
  sides: P => P.base.map((p, i) => dist(p, P.base[(i + 1) % P.n])),
  side: P => mean(PR.sides(P).map(x => [x, 0, 0]))[0],
  angles: P => P.base.map((p, i) => angleAt(P.base[(i + P.n - 1) % P.n], p, P.base[(i + 1) % P.n])),
  latArea: P => P.base.reduce((s, b, i) => {                        /* сумма боковых граней */
    const j = (i + 1) % P.n;
    return s + polyArea([b, P.base[j], P.top[j], P.top[i]]);
  }, 0),
  hull: P => hull3(PR.pts(P))
};
const epsOf = P => 1e-9 * extentOf(PR.pts(P));

/* величина тела: V — объём, S — полная поверхность (оболочка), L — боковая поверхность */
const QN = { V: "объём", S: "площадь поверхности", L: "площадь боковой поверхности", h: "боковое ребро" };
const POW = { V: 3, S: 2, L: 2, h: 1 };
function measure(P, q) {
  if (q === "V") return PR.hull(P).volume;
  if (q === "S") return PR.hull(P).surface;
  if (q === "L") return PR.latArea(P);
  if (q === "h") return PR.edge(P);
  throw new Error("неизвестная величина " + q);
}
/* боковая поверхность части призмы: грани оболочки, кроме лежащих в плоскостях оснований */
function hullLat(H, P) {
  const nb = PR.nrm(P), d0 = dot(nb, P.base[0]), d1 = dot(nb, P.top[0]), eps = epsOf(P);
  const inBase = f => f.ring.every(q => Math.abs(dot(nb, q) - d0) <= eps) ||
    f.ring.every(q => Math.abs(dot(nb, q) - d1) <= eps);
  return H.faces.filter(f => !inBase(f)).reduce((s, f) => s + f.area, 0);
}

/* модельные тела */
function turtle(n, a) {       /* правильный n-угольник: n шагов длины a, поворот на 360°/n */
  const out = [];
  let x = 0, y = 0, th = 0;
  for (let i = 0; i < n; i++) {
    out.push([x, y]);
    x += a * Math.cos(th); y += a * Math.sin(th); th += 2 * Math.PI / n;
  }
  return out;
}
function mkPrism(base2, lat) {
  const base = base2.map(([x, y]) => [x, y, 0]);
  return { n: base.length, names: LTRS.slice(0, base.length), px: "", base, top: base.map(b => add(b, lat)) };
}
const scalePrism = (P, t) => ({ ...P, base: P.base.map(p => scl(p, t)), top: P.top.map(p => scl(p, t)) });
const ptsOfPrism = P => {
  const o = {};
  P.names.forEach((L, i) => { o[L] = P.base[i]; o[L + "1"] = P.top[i]; });
  return o;
};
/* произвольные треугольные призмы — для условий, не задающих тело */
const TRI_SHAPES = [
  { what: "прямая, основание правильное", P: mkPrism(turtle(3, 1), [0, 0, 1.3]) },
  { what: "прямая, основание разностороннее", P: mkPrism([[0, 0], [2.3, 0], [0.9, 1.7]], [0, 0, 0.8]) },
  { what: "наклонная, основание разностороннее", P: mkPrism([[0, 0], [1.9, 0.2], [0.4, 1.3]], [0.35, -0.25, 1.1]) },
  { what: "наклонная, основание тупоугольное", P: mkPrism([[0, 0], [3.1, 0], [-0.7, 0.9]], [-0.6, 0.4, 0.7]) }
];

/* корень возрастающей функции f(x) = target на (0, ∞), бисекция */
function solveInc(f, target, what) {
  let lo = 1, guard = 0;
  while (!(f(lo) < target)) { lo /= 2; if (++guard > 200) throw new Error(what + ": положительного корня нет"); }
  let hi = lo * 2;
  guard = 0;
  while (f(hi) < target) { hi *= 2; if (++guard > 200) throw new Error(what + ": корень не найден"); }
  for (let i = 0; i < 400; i++) {
    const mid = lo + (hi - lo) / 2;
    if (mid <= lo || mid >= hi) break;
    if (f(mid) < target) lo = mid; else hi = mid;
  }
  return Math.abs(f(lo) - target) <= Math.abs(f(hi) - target) ? lo : hi;
}
/* ответ, посчитанный на нескольких телах, обязан быть одним и тем же */
function same(list, what) {
  for (const x of list) if (!(relDiff(x.v, list[0].v) <= TOL_ANS))
    throw new Error(`${what} зависит от формы тела: ${fmt(list[0].v)} (${list[0].on}) и ${fmt(x.v)} (${x.on}) — модель неприменима или задача некорректна`);
  return list[0].v;
}

/* плоскость через среднюю линию основания у вершины base[i], параллельная боковому ребру */
function midCut(P, i) {
  const A = P.base[i], B = P.base[(i + 1) % 3], C = P.base[(i + 2) % 3];
  const M = lerp(A, B, 0.5), N = lerp(A, C, 0.5);
  const n = unit(cross(sub(N, M), PR.lat(P)));
  const d = dot(n, M);
  const sA = Math.sign(dot(n, A) - d);
  const pts = PR.pts(P);
  const small = clipHalf(pts, n, d, sA), big = clipHalf(pts, n, d, -sA);
  if (small.degenerate || small.points.length !== 6 || small.faces.length !== 5)
    throw new Error("плоскость через среднюю линию не отсекает треугольную призму");
  if (big.degenerate || big.points.length !== 8 || big.faces.length !== 6)
    throw new Error("после отсечения по средней линии остаётся не четырёхугольная призма");
  return { i, small, big, plane: { n, d }, tag: `средняя линия у вершины ${P.names[i]}` };
}
function midMeasure(P, cut, who, q) {
  if (who === "whole") return q === "V" ? PR.hull(P).volume : hullLat(PR.hull(P), P);
  return q === "V" ? cut.small.volume : hullLat(cut.small, P);
}

/* плоскость через сторону одного основания и противоположную вершину другого */
function cutPyr(P, i, lower) {
  const j = (i + 1) % 3, k = (i + 2) % 3;
  const [X, Y, Z] = lower ? [P.base[i], P.base[j], P.top[k]] : [P.top[i], P.top[j], P.base[k]];
  const pl = planeOf(X, Y, Z);
  const pts = PR.pts(P);
  const parts = [clipHalf(pts, pl.n, pl.d, 1), clipHalf(pts, pl.n, pl.d, -1)];
  const pyr = parts.find(h => !h.degenerate && h.points.length === 4 && h.faces.length === 4);
  const rest = parts.find(h => h !== pyr && !h.degenerate);
  if (!pyr || !rest) throw new Error("плоскость не отсекает треугольную пирамиду");
  const nm = L => L + (lower ? "" : "1"), nm2 = L => L + (lower ? "1" : "");
  return { pyr, rest, plane: pl, tag: `плоскость ${nm(P.names[i])}${nm(P.names[j])}${nm2(P.names[k])}` };
}

/* ============================================================
   4. Числа и слова условия
   ============================================================ */
const WORDS = { "два": 2, "две": 2, "три": 3, "четыре": 4, "пять": 5, "шесть": 6,
  "семь": 7, "восемь": 8, "девять": 9, "десять": 10 };
const NUM = String.raw`(?:\d+(?:,\d+)?)?\s*√\s*\d+(?:,\d+)?|\d+(?:,\d+)?`;
const NUMW = NUM + "|" + Object.keys(WORDS).join("|");
const NAME = "[A-Z][₀-₉]?";
const dec = s => Number(String(s).replace(",", "."));
function numOf(s) {
  const t = String(s).replace(/\s+/g, "").toLowerCase();
  if (t in WORDS) return WORDS[t];
  const m = t.match(/^(\d+(?:,\d+)?)?√(\d+(?:,\d+)?)$/);
  if (m) return (m[1] ? dec(m[1]) : 1) * Math.sqrt(dec(m[2]));
  if (/^\d+(?:,\d+)?$/.test(t)) return dec(t);
  throw new Error("не число: «" + s + "»");
}
/* все числа текста — для сверки подписей чертежа с условием (индексы A₁ — не ASCII-цифры) */
function condNumbers(cond) {
  const re = new RegExp("(?<![A-Za-z0-9])(?:" + NUM + ")|(?<![а-яё])(?:" +
    Object.keys(WORDS).join("|") + ")(?![а-яё])", "gi");
  return (cond.match(re) || []).map(numOf);
}
/* подпись чертежа: «6», «√12», «2√3», «1,5»; остальное (x, 90°, ?) — не число */
function labelNum(t) {
  const s = String(t).replace(/\s+/g, "");
  if (!/^(?:\d+(?:,\d+)?)?√\d+(?:,\d+)?$|^\d+(?:,\d+)?$/.test(s)) return null;
  return numOf(s);
}
const subToDigit = s => String(s).replace(/[₀-₉]/g, c => String(c.charCodeAt(0) - 0x2080));
const namesOf = s => (String(s).match(/[A-Z][₀-₉]?/g) || []).map(subToDigit);
function ngon(w) {
  const s = String(w).toLowerCase();
  for (const [k, n] of [["тре", 3], ["четыр", 4], ["пяти", 5], ["шести", 6], ["восьми", 8]])
    if (s.startsWith(k)) return n;
  throw new Error("не понято число углов: «" + w + "»");
}
function qtyOf(s) {
  s = String(s).toLowerCase();
  if (/боков\S* поверхн/.test(s)) return "L";
  if (/поверхн/.test(s)) return "S";
  if (/объ[её]м/.test(s)) return "V";
  if (/ребр|высот/.test(s)) return "h";
  throw new Error("не понята величина «" + s + "»");
}
function prismName(n) {
  const L = LTRS.slice(0, n);
  return L.join("") + L.map(x => x + "1").join("");
}
/* искомый отрезок «боковое ребро»: X и X1 */
const isLateral = (a, b) => a !== b && a.replace(/1$/, "") === b.replace(/1$/, "") &&
  LTRS.includes(a.replace(/1$/, ""));

const EQ = "(?:равен|равна|равно|равны)";
const rx = s => new RegExp("^" + s
  .replace(/\{EQ\}/g, EQ)
  .replace(/\{NUMW\}/g, "(" + NUMW + ")")
  .replace(/\{NUM\}/g, "(" + NUM + ")")
  .replace(/\{NGON\}/g, "(\\S+?угольн(?:ой|ую|ая|ый|ом|ое))")
  .replace(/\{NAME2\}/g, "((?:" + NAME + "){2})")
  .replace(/\{PNAME\}/g, "((?:" + NAME + "){6,16})")
  .replace(/\{NAME\}/g, "(" + NAME + ")")
  .replace(/\{N\}/g, "(?:" + NAME + ")") + "$");

/* ============================================================
   5. Модели задач: формулировка → числа → ответ → чертёж
   parse(m, вариант) → данные условия;
   solve(d) → { ans, isLen, info, … } — только по данным условия;
   scene(d, res, S, F, E, W) — проверки тела чертежа; F(что, на чертеже,
     по данным, степень, источник, пояснение) — величина для единого масштаба.
   ============================================================ */
function checkRight(P, E, tag) {
  const l = PR.lat(P), s = norm(cross(l, PR.nrm(P))) / norm(l);
  if (s > TOL_SHAPE) E(`${tag}: призма на чертеже не прямая — боковое ребро отклонено от перпендикуляра к основанию на ${fmt(Math.asin(Math.min(1, s)) * DEG)}°`);
}
function checkRegular(P, E, tag) {
  const sd = PR.sides(P), an = PR.angles(P), want = Math.PI * (P.n - 2) / P.n;
  if (sd.some(x => relDiff(x, sd[0]) > TOL_SHAPE) || an.some(a => Math.abs(a - want) > TOL_SHAPE))
    E(`${tag}: основание на чертеже — не правильный ${P.n}-угольник (стороны ${sd.map(fmt).join(", ")}; углы ${an.map(a => fmt(a * DEG)).join(", ")}°)`);
}
function rightVertex(P) {
  const an = PR.angles(P);
  const r = an.map((a, i) => (Math.abs(a - Math.PI / 2) <= TOL_SHAPE ? i : -1)).filter(i => i >= 0);
  return r.length === 1 ? r[0] : -1;
}

const MODELS = [
  {
    key: "regprism", name: "правильная призма: сторона и высота → величина",
    res: [rx(String.raw`Найдите (площадь боковой поверхности|площадь поверхности|объ[её]м) правильной {NGON} призмы, сторона основания которой равна {NUM}, а (высота|боковое ребро) (?:—|равна|равно) {NUM}\.`)],
    parse: m => ({ q: qtyOf(m[1]), n: ngon(m[2]), a: numOf(m[3]), hw: m[4], h: numOf(m[5]) }),
    solve(d) {
      const P = mkPrism(turtle(d.n, d.a), [0, 0, d.h]);
      return { ans: measure(P, d.q), isLen: false,
        info: `правильная ${d.n}-угольная призма a = ${fmt(d.a)}, h = ${fmt(d.h)} → ${QN[d.q]}` };
    },
    scene(d, res, S, F, E) {
      const B = S.one(d.n, "правильная призма"); if (!B) return;
      checkRight(B.P, E, B.tag); checkRegular(B.P, E, B.tag);
      F("сторона основания", PR.side(B.P), d.a, 1);
      F(d.hw, d.hw === "высота" ? PR.height(B.P) : PR.edge(B.P), d.h, 1);
      F(QN[d.q] + " (искомое)", measure(B.P, d.q), res.ans, POW[d.q], "ответ по условию");
    }
  },
  {
    key: "regprism-h", name: "правильная призма: сторона и величина → боковое ребро",
    res: [rx(String.raw`Найдите (боковое ребро|высоту) правильной {NGON} призмы, если сторона е[её] основания равна {NUM}, а (площадь боковой поверхности|площадь поверхности|объ[её]м)(?: призмы)? {EQ} {NUM}\.`)],
    parse: m => ({ aw: m[1], n: ngon(m[2]), a: numOf(m[3]), q: qtyOf(m[4]), val: numOf(m[5]) }),
    solve(d) {
      const base = turtle(d.n, d.a);
      const h = solveInc(x => measure(mkPrism(base, [0, 0, x]), d.q), d.val, "боковое ребро");
      const P = mkPrism(base, [0, 0, h]);
      return { ans: PR.edge(P), isLen: true, askedSeg: isLateral, askName: "боковое ребро",
        info: `${QN[d.q]}(h) = ${fmt(d.val)} при a = ${fmt(d.a)} → h = ${fmt(h)}` };
    },
    scene(d, res, S, F, E) {
      const B = S.one(d.n, "правильная призма"); if (!B) return;
      checkRight(B.P, E, B.tag); checkRegular(B.P, E, B.tag);
      F("сторона основания", PR.side(B.P), d.a, 1);
      F(QN[d.q], measure(B.P, d.q), d.val, POW[d.q]);
      F("боковое ребро (искомое)", PR.edge(B.P), res.ans, 1, "ответ по условию");
    }
  },
  {
    key: "rhombprism", name: "прямая призма, в основании ромб с диагоналями → величина",
    res: [rx(String.raw`Найдите (площадь боковой поверхности|площадь поверхности|объ[её]м) прямой призмы, в основании которой лежит ромб с диагоналями, равными {NUM} и {NUM}, а (боковое ребро|высота) призмы {EQ} {NUM}\.`)],
    parse: m => ({ q: qtyOf(m[1]), d1: numOf(m[2]), d2: numOf(m[3]), hw: m[4], h: numOf(m[5]) }),
    solve(d) {
      /* ромб — концы диагоналей на осях: диагонали перпендикулярны и делятся пополам */
      const P = mkPrism([[d.d1 / 2, 0], [0, d.d2 / 2], [-d.d1 / 2, 0], [0, -d.d2 / 2]], [0, 0, d.h]);
      return { ans: measure(P, d.q), isLen: false,
        info: `ромб с диагоналями ${fmt(d.d1)} и ${fmt(d.d2)}, сторона ${fmt(PR.side(P))}, h = ${fmt(d.h)} → ${QN[d.q]}` };
    },
    scene(d, res, S, F, E) {
      const B = S.one(4, "прямая призма с ромбом в основании"); if (!B) return;
      const P = B.P;
      checkRight(P, E, B.tag);
      const sd = PR.sides(P);
      if (sd.some(x => relDiff(x, sd[0]) > TOL_SHAPE)) E(`${B.tag}: основание на чертеже — не ромб (стороны ${sd.map(fmt).join(", ")})`);
      const dg = [dist(P.base[0], P.base[2]), dist(P.base[1], P.base[3])].sort((x, y) => x - y);
      const want = [d.d1, d.d2].sort((x, y) => x - y);
      F("меньшая диагональ основания", dg[0], want[0], 1);
      F("большая диагональ основания", dg[1], want[1], 1);
      F(d.hw, d.hw === "высота" ? PR.height(P) : PR.edge(P), d.h, 1);
      F(QN[d.q] + " (искомое)", measure(P, d.q), res.ans, POW[d.q], "ответ по условию");
    }
  },
  {
    key: "rtprism", name: "прямая призма, в основании прямоугольный треугольник → величина",
    res: [rx(String.raw`Основанием прямой треугольной призмы служит прямоугольный треугольник с катетами {NUM} и {NUM}, (боковое ребро(?: призмы)?|высота призмы) {EQ} {NUM}\. Найдите (объ[её]м|площадь (?:е[её] )?(?:боковой )?поверхности)(?: призмы)?\.`)],
    parse: m => ({ l1: numOf(m[1]), l2: numOf(m[2]), hw: /высот/.test(m[3]) ? "высота" : "боковое ребро", h: numOf(m[4]), q: qtyOf(m[5]) }),
    solve(d) {
      const P = mkPrism([[0, 0], [d.l1, 0], [0, d.l2]], [0, 0, d.h]);
      return { ans: measure(P, d.q), isLen: false,
        info: `катеты ${fmt(d.l1)}, ${fmt(d.l2)} (гипотенуза на теле ${fmt(dist(P.base[1], P.base[2]))}), h = ${fmt(d.h)} → ${QN[d.q]}` };
    },
    scene(d, res, S, F, E) {
      const B = S.one(3, "прямая треугольная призма"); if (!B) return;
      const P = B.P;
      checkRight(P, E, B.tag);
      const r = rightVertex(P);
      if (r < 0) E(`${B.tag}: основание на чертеже — не прямоугольный треугольник (углы ${PR.angles(P).map(a => fmt(a * DEG)).join(", ")}°)`);
      else {
        const legs = [dist(P.base[r], P.base[(r + 1) % 3]), dist(P.base[r], P.base[(r + 2) % 3])].sort((x, y) => x - y);
        const want = [d.l1, d.l2].sort((x, y) => x - y);
        F("меньший катет основания", legs[0], want[0], 1);
        F("больший катет основания", legs[1], want[1], 1);
      }
      F(d.hw, d.hw === "высота" ? PR.height(P) : PR.edge(P), d.h, 1);
      F(QN[d.q] + " (искомое)", measure(P, d.q), res.ans, POW[d.q], "ответ по условию");
    }
  },
  {
    key: "rtprism-h", name: "прямая призма, прямоугольный треугольник в основании: величина → боковое ребро",
    res: [rx(String.raw`Основанием прямой треугольной призмы служит прямоугольный треугольник с катетами {NUM} и {NUM}\. (Объ[её]м|Площадь боковой поверхности|Площадь поверхности) призмы {EQ} {NUM}\. Найдите е[её] (боковое ребро|высоту)\.`)],
    parse: m => ({ l1: numOf(m[1]), l2: numOf(m[2]), q: qtyOf(m[3]), val: numOf(m[4]) }),
    solve(d) {
      const base = [[0, 0], [d.l1, 0], [0, d.l2]];
      const h = solveInc(x => measure(mkPrism(base, [0, 0, x]), d.q), d.val, "боковое ребро");
      return { ans: PR.edge(mkPrism(base, [0, 0, h])), isLen: true, askedSeg: isLateral, askName: "боковое ребро",
        info: `${QN[d.q]}(h) = ${fmt(d.val)} при катетах ${fmt(d.l1)}, ${fmt(d.l2)} → h = ${fmt(h)}` };
    },
    scene(d, res, S, F, E) {
      const B = S.one(3, "прямая треугольная призма"); if (!B) return;
      const P = B.P;
      checkRight(P, E, B.tag);
      const r = rightVertex(P);
      if (r < 0) E(`${B.tag}: основание на чертеже — не прямоугольный треугольник`);
      else {
        const legs = [dist(P.base[r], P.base[(r + 1) % 3]), dist(P.base[r], P.base[(r + 2) % 3])].sort((x, y) => x - y);
        const want = [d.l1, d.l2].sort((x, y) => x - y);
        F("меньший катет основания", legs[0], want[0], 1);
        F("больший катет основания", legs[1], want[1], 1);
      }
      F(QN[d.q], measure(P, d.q), d.val, POW[d.q]);
      F("боковое ребро (искомое)", PR.edge(P), res.ans, 1, "ответ по условию");
    }
  },
  {
    key: "midline", name: "плоскость через среднюю линию основания ∥ боковому ребру",
    res: (() => {
      const Q = "([Оо]бъ[её]м|[Пп]лощадь боковой поверхности)";
      const WHO = "(отсеч[её]нной треугольной призмы|исходной призмы|этой призмы)";
      const PRE = "Через среднюю линию основания треугольной призмы";
      const PL = "проведена плоскость, параллельная боковому ребру";
      return [
        rx(`${PRE}, ${Q} которой {EQ} {NUM}, ${PL}\\. Найдите ${Q} ${WHO}\\.`),
        rx(`${PRE} ${PL}\\. Найдите ${Q} ${WHO}, если ${Q} ${WHO} {EQ} {NUM}\\.`),
        rx(`${PRE} ${PL}\\. ${Q} ${WHO} {EQ} {NUM}\\. Найдите ${Q} ${WHO}\\.`)
      ];
    })(),
    parse(m, vi) {
      const who = s => (/отсеч/.test(s) ? "cut" : "whole");
      let g, a;
      if (vi === 0) { g = { q: qtyOf(m[1]), who: "whole", val: numOf(m[2]) }; a = { q: qtyOf(m[3]), who: who(m[4]) }; }
      else if (vi === 1) { a = { q: qtyOf(m[1]), who: who(m[2]) }; g = { q: qtyOf(m[3]), who: who(m[4]), val: numOf(m[5]) }; }
      else { g = { q: qtyOf(m[1]), who: who(m[2]), val: numOf(m[3]) }; a = { q: qtyOf(m[4]), who: who(m[5]) }; }
      if (g.who === a.who && g.q === a.q) throw new Error("дано и спрошено одно и то же");
      return { g, a };
    },
    solve(d) {
      const out = [];
      for (const sh of TRI_SHAPES) for (const i of [0, 1, 2]) {
        const c0 = midCut(sh.P, i);
        const t = Math.pow(d.g.val / midMeasure(sh.P, c0, d.g.who, d.g.q), 1 / POW[d.g.q]);
        const P = scalePrism(sh.P, t), c = midCut(P, i);   /* тело, у которого данное = условию */
        if (relDiff(midMeasure(P, c, d.g.who, d.g.q), d.g.val) > 1e-12) throw new Error("масштабирование тела не дало данного условия");
        out.push({ v: midMeasure(P, c, d.a.who, d.a.q), on: `${sh.what}, ${c.tag}` });
      }
      return { ans: same(out, "ответ"), isLen: false,
        info: `одинаково на ${out.length} телах (${TRI_SHAPES.length} формы × 3 средние линии, в т. ч. наклонные призмы)` };
    },
    scene(d, res, S, F, E, W) {
      const B = S.one(3, "треугольная призма"); if (!B) return;
      const P = B.P, eps = epsOf(P);
      const cands = [0, 1, 2].map(i => midCut(P, i));
      const SP = S.solidPts(E);
      let pick = null;
      if (SP) {
        pick = cands.find(c => sameSet(c.small.points, SP, eps));
        if (!pick) E("тело построения — не отсечённая треугольная призма ни для одной из трёх средних линий основания");
      } else W("тела построения нет — отсечённая призма сверяется для средней линии у вершины A");
      pick = pick || cands[0];
      if (SP) S.checkSolidRings(pick.small, "отсечённой призмы", E);
      S.checkFill(planeSection(PR.pts(P), pick.plane.n, pick.plane.d).ring, `сечение плоскостью (${pick.tag})`, E);
      S.checkSegsInPlane(pick.plane, `секущей плоскости (${pick.tag})`, E);
      const WHO = { whole: "исходной призмы", cut: "отсечённой призмы" };
      F(`${QN[d.g.q]} ${WHO[d.g.who]}`, midMeasure(P, pick, d.g.who, d.g.q), d.g.val, POW[d.g.q]);
      F(`${QN[d.a.q]} ${WHO[d.a.who]} (искомое)`, midMeasure(P, pick, d.a.who, d.a.q), res.ans, POW[d.a.q], "ответ по условию");
    }
  },
  {
    key: "cutpyr", name: "от призмы отсечена пирамида плоскостью через сторону основания и вершину другого",
    res: [rx(String.raw`От треугольной призмы, объ[её]м которой равен {NUM}, отсечена треугольная пирамида плоскостью, проходящей через сторону одного основания и противоположную вершину другого основания\. Найдите объ[её]м (оставшейся части|отсеч[её]нной пирамиды)\.`)],
    parse: m => ({ val: numOf(m[1]), ask: /оставш/.test(m[2]) ? "rest" : "pyr" }),
    solve(d) {
      const out = [], parts = [];
      for (const sh of TRI_SHAPES) for (const lower of [true, false]) for (const i of [0, 1, 2]) {
        const t = Math.cbrt(d.val / PR.hull(sh.P).volume);
        const P = scalePrism(sh.P, t);
        if (relDiff(PR.hull(P).volume, d.val) > 1e-12) throw new Error("масштабирование тела не дало объёма условия");
        const c = cutPyr(P, i, lower);
        out.push({ v: c[d.ask].volume, on: `${sh.what}, ${c.tag}` });
        parts.push({ v: c[d.ask === "rest" ? "pyr" : "rest"].volume, on: `${sh.what}, ${c.tag}` });
      }
      const ans = same(out, "ответ"), other = same(parts, "вторая часть");
      return { ans, isLen: false, parts: { [d.ask]: ans, [d.ask === "rest" ? "pyr" : "rest"]: other },
        info: `одинаково на ${out.length} телах (${TRI_SHAPES.length} формы × 6 плоскостей); пирамида ${fmt(d.ask === "pyr" ? ans : other)}` };
    },
    scene(d, res, S, F, E, W) {
      const B = S.one(3, "треугольная призма"); if (!B) return;
      const P = B.P, eps = epsOf(P);
      const cands = [];
      for (const lower of [true, false]) for (const i of [0, 1, 2]) cands.push(cutPyr(P, i, lower));
      const SP = S.solidPts(E);
      let pick = null, role = null;
      if (SP) {
        for (const c of cands) for (const r of ["pyr", "rest"]) if (!pick && sameSet(c[r].points, SP, eps)) { pick = c; role = r; }
        if (!pick) E("тело построения — ни отсечённая пирамида, ни оставшаяся часть ни для одной из шести таких плоскостей");
      } else W("тела построения нет");
      pick = pick || cands[0];
      const NAMES = { pyr: "отсечённой пирамиды", rest: "оставшейся части" };
      if (role) S.checkSolidRings(pick[role], NAMES[role], E);
      S.checkSegsInPlane(pick.plane, `секущей плоскости (${pick.tag})`, E);
      F("объём призмы", PR.hull(P).volume, d.val, 3);
      F(`объём ${NAMES[d.ask]} (искомое; ${pick.tag})`, pick[d.ask].volume, res.ans, 3, "ответ по условию");
      if (role && role !== d.ask)
        F(`объём тела построения — ${NAMES[role]}`, pick[role].volume, res.parts[role], 3, "пересчёт по условию");
    }
  },
  {
    key: "vertpoly", name: "многогранник на вершинах правильной призмы (площадь основания, ребро)",
    res: [rx(String.raw`Найдите объ[её]м многогранника, вершинами которого являются точки ((?:{N}, )+{N}(?: и {N})?) правильной {NGON} призмы {PNAME}, площадь основания которой равна {NUM}, а боковое ребро равно {NUM}\.`)],
    parse(m) {
      const d = { names: namesOf(m[1]), n: ngon(m[2]), pname: subToDigit(m[3]), S: numOf(m[4]), h: numOf(m[5]) };
      if (d.pname !== prismName(d.n)) throw new Error(`имя призмы ${d.pname} не ${d.n}-угольная призма ${prismName(d.n)}`);
      const all = namesOf(m[3]);
      const bad = d.names.filter(x => !all.includes(x));
      if (bad.length) throw new Error("точек " + bad.join(", ") + " нет среди вершин призмы");
      return d;
    },
    solve(d) {
      const a = solveInc(x => polyArea(mkPrism(turtle(d.n, x), [0, 0, 1]).base), d.S, "сторона основания");
      const P = mkPrism(turtle(d.n, a), [0, 0, d.h]);
      const pts = ptsOfPrism(P);
      const H = hull3(d.names.map(nm => pts[nm]));
      if (H.degenerate) throw new Error("точки " + d.names.join(", ") + " лежат в одной плоскости");
      return { ans: H.volume, isLen: false, side: a,
        info: `площадь основания ${fmt(d.S)} → сторона ${fmt(a)}; оболочка точек ${d.names.join(", ")}: ${H.points.length} вершин, ${H.faces.length} граней` };
    },
    scene(d, res, S, F, E, W) {
      const B = S.one(d.n, "правильная призма"); if (!B) return;
      const P = B.P;
      checkRight(P, E, B.tag); checkRegular(P, E, B.tag);
      /* Сторона основания здесь получается из площади и обычно иррациональна.
         Старый банк задаёт такие размеры сцены десятичной дробью до сотых —
         с той же точностью тренажёр показывает длины (fmtLen); так же
         27184 в «Пирамиде» (ребро куба 2,29 ≈ ∛12). Если сторона на чертеже —
         РОВНО точная сторона, округлённая до сотых, чертёж сверяется с
         призмой именно с такой стороной (она строится тем же кодом, что
         в solve), всё остальное — с прежним допуском 1e-6, а округление —
         предупреждение. Но каждое расстояние между вершинами чертежа
         должно показываться (до сотых) так же, как у точной призмы: если
         округление видно ученику, это расхождение. Любая другая сторона
         (2,16; 2,149; 2,2 вместо 2,15) — расхождение, как и раньше. */
      const side = PR.side(P), side2 = Math.round(res.side * 100) / 100;
      const rounded = relDiff(side, res.side) > TOL_GEO && Math.abs(side - side2) <= 1e-9;
      let wantS = d.S, wantV = res.ans, why = "";
      if (rounded) {
        const Pm = mkPrism(turtle(d.n, side2), [0, 0, d.h]);
        const Hm = hull3(d.names.map(nm => ptsOfPrism(Pm)[nm]));
        wantS = polyArea(Pm.base); wantV = Hm.volume;
        why = `; сторона основания ${fmt(res.side)} задана в сцене округлённой до ${fmt(side2)}`;
        const ex = ptsOfPrism(mkPrism(turtle(d.n, res.side), [0, 0, d.h])), dr = ptsOfPrism(P);
        const nms = Object.keys(ex).filter(x => isPt(dr[x]));
        const shown = [];
        let pairs = 0;
        const show = x => (bankFmtLen ? String(bankFmtLen(x)) : fmt(Math.round(x * 100) / 100));
        for (let i = 0; i < nms.length; i++) for (let j = i + 1; j < nms.length; j++) {
          pairs++;
          const a = show(dist(dr[nms[i]], dr[nms[j]])), b = show(dist(ex[nms[i]], ex[nms[j]]));
          if (a !== b) shown.push(`${nms[i]}${nms[j]} = ${a} вместо ${b}`);
        }
        const dp = (wantS / d.S - 1) * 100;
        const pct = (dp >= 0 ? "больше" : "меньше") + " условия на " + Math.abs(dp).toFixed(2).replace(".", ",");
        if (shown.length)
          E(`сторона основания на чертеже ${fmt(side)} — точная ${fmt(res.side)}, округлённая до сотых, но округление видно на экране: после ответа тренажёр покажет ${shown.join(", ")}`);
        else
          W(`сторона основания на чертеже ${fmt(side2)} — это точная сторона ${fmt(res.side)} (площадь основания ${fmt(d.S)}), ` +
            `округлённая до сотых, как принято в старом банке; поэтому площадь основания и объём ${d.names.join("")} ` +
            `на чертеже ${pct} % (${fmt(wantS)} и ${fmt(wantV)}). На экране не видно: все ${pairs} ` +
            `расстояний между вершинами тренажёр показывает до сотых так же, как у точной призмы`);
      }
      F("площадь основания", PR.baseArea(P), wantS, 2, "условие" + why,
        rounded ? "" : ` (сторона основания на чертеже ${fmt(PR.side(P))}; при площади ${fmt(d.S)} она равна ${fmt(res.side)} — параметр сцены округлён?)`);
      F("боковое ребро", PR.edge(P), d.h, 1);
      const miss = d.names.filter(nm => !isPt(S.all[nm]));
      if (miss.length) { E("на чертеже нет точек " + miss.join(", ")); return; }
      const H = hull3(d.names.map(nm => S.all[nm]));
      F(`объём многогранника ${d.names.join("")} (искомое)`, H.volume, wantV, 3, "ответ по условию" + why,
        ` (площадь основания на чертеже ${fmt(PR.baseArea(P))})`);
      S.checkSegsOnHull(H, "многогранника " + d.names.join(""), E);
      const SP = S.solidPts(E);
      if (!SP) { W("тело построения не нарисовано"); return; }
      if (!sameSet(SP, H.points, epsOf(P))) E(`тело построения — не многогранник ${d.names.join("")}`);
      else S.checkSolidRings(H, "многогранника " + d.names.join(""), E);
    }
  },
  {
    key: "recast", name: "переплавка: правильная призма → правильная призма той же массы",
    res: [rx(String.raw`Кусок льда представляет собой правильную {NGON} призму высотой {NUM} см\. Его планируют расплавить и вновь заморозить так, чтобы получилась правильная {NGON} призма, сторона основания которой в {NUMW} раза? (больше|меньше) стороны основания исходной\. Чему будет равна е[её] высота\? Ответ дайте в сантиметрах\.`)],
    parse: m => ({ n1: ngon(m[1]), h1: numOf(m[2]), n2: ngon(m[3]), k: m[5] === "больше" ? numOf(m[4]) : 1 / numOf(m[4]) }),
    solve(d) {
      if (d.n1 === d.n2) throw new Error("модель рассчитана на призмы с разным числом углов");
      const out = [];
      for (const a of [1, 0.37, 2.9]) {           /* сторона исходной не дана — берём разные */
        const V1 = PR.hull(mkPrism(turtle(d.n1, a), [0, 0, d.h1])).volume;
        const h2 = solveInc(x => PR.hull(mkPrism(turtle(d.n2, a * d.k), [0, 0, x])).volume, V1, "высота новой призмы");
        out.push({ v: h2, on: `сторона исходной ${fmt(a)}` });
      }
      return { ans: same(out, "ответ"), isLen: true, askedSeg: isLateral, askName: "высота новой призмы",
        info: `объёмы равны; одинаково при ${out.length} разных сторонах исходной` };
    },
    scene(d, res, S, F, E) {
      const B1 = S.one(d.n1, "исходная призма"), B2 = S.one(d.n2, "новая призма");
      if (!B1 || !B2) return;
      for (const B of [B1, B2]) { checkRight(B.P, E, B.tag); checkRegular(B.P, E, B.tag); }
      F("высота исходной призмы", PR.height(B1.P), d.h1, 1);
      F("высота новой призмы (искомое)", PR.height(B2.P), res.ans, 1, "ответ по условию");
      F("отношение сторон оснований (новая : исходная)", PR.side(B2.P) / PR.side(B1.P), d.k, 0);
      F("отношение объёмов (новая : исходная)", PR.hull(B2.P).volume / PR.hull(B1.P).volume, 1, 0);
    }
  },
  {
    key: "diagsection", name: "правильная призма: ребро и диагональ → площадь сечения через три вершины",
    res: [rx(String.raw`В правильной {NGON} призме {PNAME} ребро {NAME2} равно {NUM}, а диагональ {NAME2} равна {NUM}\. Найдите площадь сечения призмы плоскостью, проходящей через точки {NAME}, {NAME} и {NAME}\.`)],
    parse(m) {
      const d = { n: ngon(m[1]), pname: subToDigit(m[2]), e: namesOf(m[3]), ev: numOf(m[4]),
        g: namesOf(m[5]), gv: numOf(m[6]), sec: [m[7], m[8], m[9]].map(subToDigit) };
      if (d.pname !== prismName(d.n)) throw new Error(`имя призмы ${d.pname} не ${d.n}-угольная призма ${prismName(d.n)}`);
      if (!isLateral(d.e[0], d.e[1])) throw new Error("названное ребро — не боковое (модель рассчитана на боковое)");
      return d;
    },
    solve(d) {
      const build = a => ptsOfPrism(mkPrism(turtle(d.n, a), [0, 0, d.ev]));
      if (relDiff(dist(build(1)[d.e[0]], build(1)[d.e[1]]), d.ev) > 1e-12) throw new Error("боковое ребро модели не равно данному");
      const a = solveInc(x => { const q = build(x); return dist(q[d.g[0]], q[d.g[1]]); }, d.gv, "сторона основания");
      const q = build(a);
      const pl = planeOf(q[d.sec[0]], q[d.sec[1]], q[d.sec[2]]);
      const sec = planeSection(Object.values(q), pl.n, pl.d);
      return { ans: sec.area, isLen: false,
        info: `${d.g.join("")} = ${fmt(d.gv)} при ${d.e.join("")} = ${fmt(d.ev)} → сторона ${fmt(a)}; сечение — ${sec.ring.length}-угольник` };
    },
    scene(d, res, S, F, E) {
      const B = S.one(d.n, "правильная призма"); if (!B) return;
      checkRight(B.P, E, B.tag); checkRegular(B.P, E, B.tag);
      const need = [...d.e, ...d.g, ...d.sec].filter(nm => !isPt(S.all[nm]));
      if (need.length) { E("на чертеже нет точек " + [...new Set(need)].join(", ")); return; }
      const at = nm => S.all[nm];
      F(`ребро ${d.e.join("")}`, dist(at(d.e[0]), at(d.e[1])), d.ev, 1);
      F(`диагональ ${d.g.join("")}`, dist(at(d.g[0]), at(d.g[1])), d.gv, 1);
      const pl = planeOf(at(d.sec[0]), at(d.sec[1]), at(d.sec[2]));
      const sec = planeSection(PR.pts(B.P), pl.n, pl.d);
      F(`площадь сечения плоскостью ${d.sec.join("")} (искомое)`, sec.area, res.ans, 2, "ответ по условию");
      S.checkFill(sec.ring, `сечение плоскостью ${d.sec.join("")}`, E);
    }
  }
];

/* ============================================================
   6. Сцена задачи так, как её собирает тренажёр
   ============================================================ */
function prismDefects(P, pts) {
  const out = [], eps = TOL_SHAPE * extentOf(PR.pts(P));
  const l0 = sub(P.top[0], P.base[0]);
  P.base.forEach((b, i) => {
    if (dist(sub(P.top[i], b), l0) > eps)
      out.push(`боковое ребро ${P.names[i]}${P.names[i]}1 не равно и не параллельно ${P.names[0]}${P.names[0]}1 — это не призма`);
  });
  const nb = unit(newell(P.base));
  if (P.base.some(q => Math.abs(dot(nb, sub(q, P.base[0]))) > eps)) out.push("основание не плоское");
  const turns = P.base.map((b, i) => dot(cross(sub(P.base[(i + 1) % P.n], b), sub(P.base[(i + 2) % P.n], P.base[(i + 1) % P.n])), nb));
  if (turns.some(t => !(t > 0))) out.push("основание — не выпуклый многоугольник (или вершины не по порядку)");
  if (!(PR.height(P) > eps)) out.push("призма вырождена: высота 0");
  for (const [o, ring] of [["O", P.base], ["O1", P.top]]) {
    const q = pts[o + P.px];
    if (isPt(q) && dist(P3(q), mean(ring)) > eps) out.push(`точка ${o} не в центре ${o === "O" ? "нижнего" : "верхнего"} основания`);
  }
  return out;
}

function sceneOf(p, sceneData, E, W) {
  const sd = sceneData(p);
  const gen = Array.from((sd && sd.gen) || []);
  if (!gen.length) { E("sceneData вернула пустую сцену"); return null; }
  let broken = false;
  gen.forEach((g, gi) => {
    for (const [nm, pt] of Object.entries(g.pts || {}))
      if (!isPt(pt)) { E(`тело ${gi + 1}: точка ${nm} = ${JSON.stringify(pt)} — не конечные координаты`); broken = true; }
  });
  if (broken) return null;

  /* тела-призмы (суффикс имён тела — px генератора) */
  const bodies = gen.map((g, gi) => {
    const pts = g.pts || {};
    const pxs = [""].concat(Object.keys(pts).filter(n => n[0] === "A" && n.length > 1).map(n => n.slice(1)));
    let P = null;
    for (const px of pxs) { P = prismFrom(pts, px); if (P) break; }
    const tag = P ? `тело ${gi + 1} (${P.n}-угольная призма)` : `тело ${gi + 1}`;
    if (!P) E(`тело ${gi + 1} сцены — не призма ABC…A1B1C1…`);
    else prismDefects(P, pts).forEach(msg => E(`${tag}: ${msg}`));
    return { gi, g, P, tag, ghost: !!g.ghost, hideLabels: !!g.hideLabels };
  });

  /* общий словарь точек, как в trainer.js: тела по порядку, последнее выигрывает */
  const merged = {}, owner = {};
  let ext = 0;
  gen.forEach((g, gi) => {
    for (const [nm, pt] of Object.entries(g.pts || {})) { merged[nm] = P3(pt); owner[nm] = gi; ext = Math.max(ext, norm(pt)); }
  });
  const epsS = 1e-9 * Math.max(ext, 1);

  /* тело, часть вершин которого тренажёр рисует на месте вершин другого тела */
  const V = STRICT ? E : W;
  const drawnBy = {};                      /* ключ ребра → тело, которое нарисовало его первым */
  bodies.forEach(b => {
    const own = b.g.pts || {};
    const moved = Object.keys(own).filter(nm => dist(merged[nm], P3(own[nm])) > epsS);
    const edges = Array.from(b.g.edges || []).map(e => [e[0], e[1]]);
    const inhE = edges.filter(([x, y]) => { const k = [x, y].sort().join("–"); return k in drawnBy && drawnBy[k] !== b.gi; });
    const inherited = inhE.map(([x, y]) => x + y);
    const solidLook = b.ghost && inhE.some(([x, y]) => !bodies[drawnBy[[x, y].sort().join("–")]].ghost);
    edges.forEach(([x, y]) => { const k = [x, y].sort().join("–"); if (!(k in drawnBy)) drawnBy[k] = b.gi; });
    if (moved.length) {
      const others = [...new Set(moved.map(nm => owner[nm] + 1))].join(", ");
      const torn = edges.filter(([x, y]) => moved.includes(x) !== moved.includes(y)).map(([x, y]) => x + y);
      V(`${b.tag}: ${moved.length} его точек (${moved.join(", ")}) названы так же, как точки тела ${others}, ` +
        `при других координатах; тренажёр собирает точки в один словарь (последнее тело выигрывает), ` +
        `поэтому эти вершины тела ${b.gi + 1} рисуются на месте вершин тела ${others}` +
        (torn.length ? `, рёбра ${torn.join(", ")} тянутся от одного тела к другому` : "") +
        `, грани тела ${b.gi + 1} искажены` +
        (b.hideLabels ? "" : `, буквы ${moved.join(", ")} стоят у вершин тела ${others}`) +
        " — на экране тело из условия выглядит не так, как задано");
    }
    if (inherited.length)
      V(`${b.tag}: рёбра ${inherited.join(", ")} совпадают по именам с уже нарисованными рёбрами другого тела — ` +
        `тренажёр их не рисует заново (segMap), они видны в стиле того тела${solidLook ? " (сплошными, а не «призрачными»)" : ""}`);
  });

  /* точки построения — как resolvePt в trainer.js */
  const cst = p.construct || {};
  const all = Object.assign({}, merged);
  const fb = (sd && sd.firstBox) || { a: 1, b: 1, c: 1 };
  for (const [nm, spec] of Object.entries(cst.points || {})) {
    if (Array.isArray(spec) && spec[0] === "mid") {
      const a = all[spec[1]], b = all[spec[2]];
      if (!isPt(a) || !isPt(b)) { E(`точка построения ${nm}: нет точек ${spec[1]}, ${spec[2]}`); continue; }
      all[nm] = lerp(a, b, 0.5);
    } else if (Array.isArray(spec) && spec.length >= 3) all[nm] = [spec[0] * fb.a, spec[1] * fb.b, spec[2] * fb.c];
    else E(`точка построения ${nm}: непонятное задание ${JSON.stringify(spec)}`);
  }
  const nameAt = q => Object.keys(all).find(nm => !/^O/.test(nm) && dist(all[nm], q) <= epsS) || `(${q.map(fmt).join("; ")})`;
  const ringsOf = list => Array.from(list || []).map(r => Array.from(r));

  const S = {
    sd, gen, bodies, merged, all, cst,
    /* единственное тело-призма с n вершинами основания */
    one(n, what) {
      const hit = bodies.filter(b => b.P && b.P.n === n);
      if (hit.length !== 1) { E(`${what}: на чертеже ${hit.length} ${n}-угольных призм, нужна ровно одна`); return null; }
      return hit[0];
    },
    /* вершины тела построения (construct.solid) */
    solidPts(Err) {
      const rings = ringsOf(cst.solid);
      if (!rings.length) return null;
      const names = [...new Set([].concat(...rings))];
      const miss = names.filter(nm => !isPt(all[nm]));
      if (miss.length) { Err("тело построения: нет точек " + miss.join(", ")); return null; }
      return dedupe(names.map(nm => all[nm]), epsS);
    },
    /* каждая грань тела H закрыта кольцами solid (или заливкой fills в той же плоскости) */
    checkSolidRings(H, what, Err) {
      const seen = new Set(), rings = [];
      for (const r of ringsOf(cst.solid).concat(ringsOf(cst.fills))) {
        const k = r.slice().sort().join(",");
        if (!seen.has(k) && r.every(nm => isPt(all[nm]))) { seen.add(k); rings.push(r); }
      }
      for (const f of H.faces) {
        const eps = 1e-9 * Math.max(ext, 1);
        const onFace = rings.filter(r => r.every(nm => Math.abs(dot(f.n, all[nm]) - f.d) <= eps));
        const got = onFace.reduce((s, r) => s + polyArea(r.map(nm => all[nm])), 0);
        if (relDiff(got, f.area) > TOL_GEO)
          Err(`грань ${f.ring.map(nameAt).join("")} ${what} на чертеже ${got === 0 ? "не нарисована" : "нарисована не целиком (" + fmt(got) + " из " + fmt(f.area) + ")"} — тело построения не замкнуто`);
      }
    },
    /* неподписанные отрезки построения — следы секущей плоскости: лежат в ней */
    checkSegsInPlane(pl, what, Err) {
      for (const sg of Array.from(cst.segments || [])) {
        if (sg[2] != null) continue;
        const [a, b] = [sg[0], sg[1]];
        if (!isPt(all[a]) || !isPt(all[b])) continue;      /* об отсутствующих точках — отдельная строка */
        if ([a, b].some(nm => Math.abs(dot(pl.n, all[nm]) - pl.d) > epsS))
          Err(`отрезок построения ${a}${b} не лежит в ${what}`);
      }
    },
    /* неподписанные отрезки построения — рёбра многогранника H */
    checkSegsOnHull(H, what, Err) {
      const isEdge = (p, q) => H.faces.some(f => f.ring.some((r, i) => {
        const s = f.ring[(i + 1) % f.ring.length];
        return (dist(r, p) <= epsS && dist(s, q) <= epsS) || (dist(r, q) <= epsS && dist(s, p) <= epsS);
      }));
      for (const sg of Array.from(cst.segments || [])) {
        if (sg[2] != null) continue;
        const [a, b] = [sg[0], sg[1]];
        if (isPt(all[a]) && isPt(all[b]) && !isEdge(all[a], all[b])) Err(`отрезок построения ${a}${b} — не ребро ${what}`);
      }
    },
    /* закрашено ли сечение ring */
    checkFill(ring, what, Err) {
      const fills = ringsOf(cst.fills);
      const ok = fills.some(r => r.every(nm => isPt(all[nm])) && sameSet(dedupe(r.map(nm => all[nm]), epsS), ring, epsS));
      if (!ok) Err(`${what} (${ring.map(nameAt).join("")}) не закрашено на чертеже` +
        (fills.length ? `; закрашено: ${fills.map(r => r.join("")).join(", ")}` : ""));
    }
  };
  return S;
}

function parseStored(s) {
  const t = String(s == null ? "" : s).trim();
  if (!/^-?\d+(?:[.,]\d+)?$/.test(t)) return null;
  return Number(t.replace(",", "."));
}

/* ============================================================
   7. Проверка одной задачи
   ============================================================ */
function verifyOne(p, sceneData, errs, warns, mism) {
  const id = String(p.id);
  const E = msg => errs.push(`${id}: ${msg}`);
  const W = msg => warns.push(`${id}: ${msg}`);
  const cond = String(p.cond || "").replace(/\s+/g, " ").trim();

  const hits = [];
  for (const M of MODELS) for (let vi = 0; vi < M.res.length; vi++) {
    const m = cond.match(M.res[vi]);
    if (m) { hits.push({ M, m, vi }); break; }
  }
  if (!hits.length) { E(`формулировка не распознана ни одной моделью верификатора: «${cond}»`); return; }
  if (hits.length > 1) { E(`формулировку распознают несколько моделей: ${hits.map(h => h.M.name).join("; ")}`); return; }
  const { M, m, vi } = hits[0];
  if (EXPECT[id] !== M.key) E(`формулировка распознана моделью «${M.key}», для этой задачи ожидается «${EXPECT[id]}»`);

  /* --- ответ: только по тексту условия --- */
  const d = M.parse(m, vi);
  const res = M.solve(d);
  const stored = parseStored(p.ans);
  if (stored === null) E(`ответ банка «${p.ans}» — не число`);
  else if (!(relDiff(res.ans, stored) <= TOL_ANS)) {
    E(`ответ: в банке ${p.ans}, пересчёт по условию ${fmt(res.ans)} (${M.name}: ${res.info})`);
    mism.push({ id, stored: String(p.ans), computed: fmt(res.ans), note: `${M.name}: ${res.info}` });
  }

  /* --- чертёж --- */
  const S = sceneOf(p, sceneData, E, W);
  if (!S) return;
  const facts = [];
  const F = (what, got, want, pow, src = "условие", hint = "") => facts.push({ what, got, want, pow, src, hint });
  M.scene(d, res, S, F, E, W);

  /* подписи чертежа */
  const cn = condNumbers(cond);
  let numericLabels = 0;
  const onlyInConstruct = [];
  for (const L of Array.from(p.labels || [])) {
    const [a, b, t] = [L[0], L[1], L[2]];
    if (!isPt(S.merged[a]) || !isPt(S.merged[b])) {
      if (isPt(S.all[a]) && isPt(S.all[b])) E(`подпись ${a}${b} «${t}» ссылается на точку построения — тренажёр ставит подписи до построения, точки там ещё нет`);
      else E(`подпись ${a}${b} «${t}»: такой точки на чертеже нет`);
      continue;
    }
    const len = dist(S.merged[a], S.merged[b]);
    if (t === "?") {
      if (res.isLen) {
        if (!res.askedSeg(a, b)) E(`подпись «?» стоит на ${a}${b}, а искомое — ${res.askName}`);
        F(`искомый отрезок ${a}${b} «?»`, len, res.ans, 1, "ответ по условию");
      } else W(`подпись ${a}${b} «?», а искомое — не длина: подпись указывает не на то`);
      continue;
    }
    const val = labelNum(t);
    if (val === null) continue;
    numericLabels++;
    F(`подпись ${a}${b} = «${t}»`, len, val, 1, "подпись");
    if (!cn.some(x => relDiff(x, val) < 1e-12)) W(`подпись ${a}${b} = «${t}»: такого числа нет в условии (данные только на рисунке)`);
  }
  for (const sg of Array.from((S.cst && S.cst.segments) || [])) {
    const [a, b, t] = [sg[0], sg[1], sg[2]];
    if (!isPt(S.all[a]) || !isPt(S.all[b])) { E(`отрезок построения ${a}${b}: такой точки на чертеже нет`); continue; }
    if (t == null || t === "?") continue;      /* «?» в построении — промежуточное неизвестное */
    const val = labelNum(t);
    if (val === null) continue;
    numericLabels++;
    F(`подпись построения ${a}${b} = «${t}»`, dist(S.all[a], S.all[b]), val, 1, "подпись");
    if (!cn.some(x => relDiff(x, val) < 1e-12)) W(`подпись построения ${a}${b} = «${t}»: такого числа нет в условии (данные только на рисунке)`);
    else onlyInConstruct.push(`${a}${b} = ${t}`);
  }
  if (onlyInConstruct.length)
    W(`данные условия ${onlyInConstruct.join(", ")} подписаны только в построении — до нажатия «Показать построение» их на чертеже нет`);
  for (const gf of Array.from(p.givenFaces || [])) {
    const ring = Array.from(gf.face || []);
    const mt = String(gf.text || "").replace(/\s+/g, "").match(new RegExp("^S=(" + NUM + ")$"));
    if (!mt) continue;
    if (!ring.every(nm => isPt(S.all[nm]))) { E(`подпись грани ${ring.join("")}: нет точек`); continue; }
    numericLabels++;
    F(`подпись грани ${ring.join("")} «${gf.text}»`, polyArea(ring.map(nm => S.all[nm])), numOf(mt[1]), 2, "подпись");
  }

  /* единый масштаб: опорная величина — первая подпись, иначе первая длина/площадь/объём */
  const ref = facts.find(f => f.src === "подпись" && f.pow > 0) || facts.find(f => f.pow > 0);
  let k = 1;
  for (const f of facts) {
    if (!(f.want > 0) || !(f.got > 0)) E(`${f.what}: на чертеже ${fmt(f.got)}, по данным ${fmt(f.want)} — нулевая или неположительная величина`);
  }
  if (ref && ref.want > 0 && ref.got > 0) {
    k = Math.pow(ref.got / ref.want, 1 / ref.pow);
    for (const f of facts) {
      if (f === ref || !(f.want > 0) || !(f.got > 0)) continue;
      const exp = f.want * Math.pow(k, f.pow);
      if (relDiff(f.got, exp) > TOL_GEO)
        E(`чертёж не соответствует условию: ${f.what} на чертеже ${fmt(f.got)}, по данным (${f.src}) ${fmt(f.want)}` +
          (f.pow ? ` → при масштабе k = ${fmt(k)} (по: ${ref.what}) ожидается ${fmt(exp)}` : "") + f.hint);
    }
    /* поле unit: длина условия на единицу сцены — панель измерений показывает
       fmtLen(длина на сцене · unit); при масштабе k (сцена / условие) верно unit = 1/k */
    const hasU = p.unit !== undefined, u = hasU ? p.unit : 1;
    if (hasU && !(typeof u === "number" && Number.isFinite(u) && u > 0)) E(`unit = ${String(u)} — не положительное число`);
    else if (hasU && relDiff(k * u, 1) > TOL_GEO)
      E(`unit = ${fmt(u)} не согласован с масштабом чертежа k = ${fmt(k)} (по: ${ref.what}; нужно 1/k = ${fmt(1 / k)}): ` +
        `панель измерений покажет длины, умноженные на ${fmt(k * u)}`);
    else if (!hasU && relDiff(k, 1) > TOL_GEO) {
      if (numericLabels)
        E(`чертёж с числовыми подписями не в масштабе 1: k = ${fmt(k)} (по: ${ref.what}); тренажёр после ответа показывает длины сцены как настоящие`);
      else
        W(`схема не в масштабе условия: k = ${fmt(k)} (по: ${ref.what}); условие не задаёт размеров тела целиком, ` +
          `поэтому чертёж — один из допустимых вариантов, и все величины сведены к одному k. Но unit не задан, и после ` +
          `ответа панель измерений покажет длины сцены (fmtLen(длина · unit)) как настоящие — они не согласованы ` +
          `с числами условия (нужно unit = ${fmt(1 / k)})`);
    }
  } else if (!ref) {
    W("на чертеже нет ни одной величины, задающей масштаб");
    if (p.unit !== undefined) E(`задан unit = ${fmt(p.unit)}, а масштаб сцены не определяется — сверить не с чем`);
  }

  if (VERBOSE)
    console.log(`  ${id.padEnd(7)} ответ ${String(p.ans).padEnd(5)} пересчёт ${fmt(res.ans).padEnd(8)} ` +
      `[${M.key}] ${res.info}; сверено величин ${facts.length}, масштаб k = ${fmt(k)}`);
}

/* ============================================================
   8. Прогон
   ============================================================ */
function main() {
  let api;
  try { api = loadData(DATA_JS); }
  catch (e) {
    console.log(`Не удалось загрузить ${DATA_JS}: ${e.message}`);
    console.log(`${TOPIC} (старые): задач 0, расхождений 1`);
    process.exit(1);
  }
  const { PROBLEMS, sceneData } = api;
  bankFmtLen = api.fmtLen || null;
  const errs = [], warns = [], mism = [];
  const legacy = PROBLEMS.filter(p => p && /^\d+$/.test(String(p.id)) && p.topic === TOPIC);
  console.log(`Линейка: ${DATA_JS}`);
  console.log(`Задач в PROBLEMS: ${PROBLEMS.length}; старых «${TOPIC}» (числовой id): ${legacy.length}`);
  if (legacy.length !== EXPECTED_COUNT)
    errs.push(`банк: старых задач темы «${TOPIC}» ${legacy.length}, должно быть ровно ${EXPECTED_COUNT} (${legacy.map(p => p.id).join(", ")})`);
  const seen = new Set();
  for (const p of legacy) {
    if (seen.has(String(p.id))) errs.push(`${p.id}: id повторяется`);
    seen.add(String(p.id));
  }
  for (const id of Object.keys(EXPECT)) if (!seen.has(id)) errs.push(`${id}: задачи нет в линейке`);
  for (const p of legacy) {
    const id = String(p.id);
    if (!(id in EXPECT)) { errs.push(`${id}: задача не описана в верификаторе`); continue; }
    try { verifyOne(p, sceneData, errs, warns, mism); }
    catch (e) { errs.push(`${id}: проверка не выполнена: ${e.message}`); }
  }
  warns.forEach(w => console.log("предупреждение " + w));
  errs.forEach(e => console.log("РАСХОЖДЕНИЕ " + e));
  console.log(`${TOPIC} (старые): задач ${legacy.length}, расхождений ${errs.length}`);
  if (warns.length) console.log(`(предупреждений ${warns.length} — на код выхода не влияют${STRICT ? "" : "; с --strict дефекты видимости считаются расхождениями"})`);
  if (errs.length) process.exit(1);
  console.log("LEGACY_PRIZ_VERIFY_OK");
}

main();
