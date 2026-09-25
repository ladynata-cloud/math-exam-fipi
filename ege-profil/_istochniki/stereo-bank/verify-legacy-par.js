#!/usr/bin/env node
/* verify-legacy-par.js — независимый верификатор СТАРЫХ задач стерео-банка
   темы «Параллелепипед»: 33 задачи с числовыми id (номера Решу ЕГЭ).
   Под этими id у учеников хранится прогресс, поэтому ни id, ни данные
   задач здесь не меняются — верификатор только читает линейку.

   Запуск (голый Node, без зависимостей, без require чужих файлов):
     node verify-legacy-par.js             линейка ../../trainers/stereo
     STEREO_ROOT=<папка линейки> node verify-legacy-par.js
     node verify-legacy-par.js --verbose   плюс строка по каждой задаче

   Линейка — папка, в которой лежит js/data.js с PROBLEMS и sceneData.
   Годится и опубликованная trainers/ege-profile-stereometry-3d, и
   объединённый банк курса ege-profil/trainers/stereo: из PROBLEMS берутся
   только задачи с id вида /^\d+$/ и topic === "Параллелепипед"
   (новые задачи с id вида par-01 пропускаются). Их должно быть ровно 33.

   Что проверяется у КАЖДОЙ задачи.
   1. Ответ. Числа берутся регулярками из ТЕКСТА условия p.cond; p.ans,
      p.sol, p.hint для вычисления не читаются (p.ans — только для сравнения
      в самом конце). По числам строится параллелепипед в координатах,
      неизвестное ребро находится бисекцией по геометрической мере
      (площадь поверхности и объём — через выпуклую оболочку вершин, длины —
      через координаты), искомая величина измеряется на построенном теле.
      Это другой код, чем разбор задачи: формул вида «2(ab+bc+ca)», «abc»,
      «V/3», «d² = a²+b²+c²» здесь нет.
      Где условие не задаёт тело однозначно (дана только площадь грани,
      объём произвольного параллелепипеда), ответ считается на нескольких
      разных телах и обязан совпасть на всех — так проверяется и то, что
      задача вообще корректна.
      Каждое число условия обязано быть использовано моделью; вопрос задачи
      распознаётся регулярками и сверяется с ожидаемым видом по id.
      Ни одна из 33 задач не берёт данные с чертежа: все числа — в тексте.
   2. Чертёж. Точки — из sceneData(p) самой линейки (плюс construct.points,
      разрешённые так же, как в trainer.js: доли firstBox или ["mid",P,Q]).
      Числовые подписи (labels, construct.segments, givenFaces «S = …»),
      данные условия и сама искомая величина, измеренная на чертеже,
      сверяются с единым масштабом k: длины ~ k, площади ~ k², объёмы ~ k³,
      углы и отношения ~ 1 (допуск 1e-6). Тренажёр после ответа показывает
      длину любого отрезка как fmtLen(расстояние в сцене · unit), unit —
      поле задачи (по умолчанию 1), поэтому k · unit обязан быть равен 1. Тело построения (construct.solid) и закрашенное сечение
      (construct.fills) сверяются с телом и сечением из условия; точка,
      названная в условии (K), обязана быть на чертеже там, где сказано.
   Печать: строка на каждое расхождение, затем
     «Параллелепипед (старые): задач N, расхождений K»;
   при K = 0 — маркер LEGACY_PAR_VERIFY_OK и код 0, иначе код 1.
   Предупреждения сверки чертежа на код выхода не влияют; ключ --strict
   делает их расхождениями (как у остальных verify-legacy-*.js).
   Примечания (ответ одинаков на нескольких телах, когда условие не задаёт
   форму) — сведения о пересчёте, не дефекты: --strict их не трогает. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const STEREO_ROOT = process.env.STEREO_ROOT
  ? path.resolve(process.env.STEREO_ROOT)
  : path.resolve(__dirname, "..", "..", "trainers", "stereo");
const DATA_FILE = path.join(STEREO_ROOT, "js", "data.js");
const TOPIC = "Параллелепипед";
const EXPECTED_COUNT = 33;
const EPS_ANS = 1e-9;   /* ответ: относительный допуск */
const EPS_GEO = 1e-6;   /* чертёж: относительный допуск */
const VERBOSE = process.argv.includes("-v") || process.argv.includes("--verbose");
const STRICT = process.argv.includes("--strict");   /* предупреждения — тоже расхождения */

/* =====================================================================
   Загрузка data.js в vm с заглушками THREE / DOM (копия идеи _load.js,
   чтобы не зависеть от файлов, которые правят другие)
   ===================================================================== */
function makeStub(name) {
  const fn = function () {};
  return new Proxy(fn, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === "then") return undefined;
      return makeStub(name + "." + String(k));
    },
    apply() { return makeStub(name + "()"); },
    construct() { return makeStub("new " + name); },
    set() { return true; }
  });
}
class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  clone() { return new Vector3(this.x, this.y, this.z); }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  setY(y) { this.y = y; return this; }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  length() { return Math.hypot(this.x, this.y, this.z); }
  normalize() { const l = this.length() || 1; return this.multiplyScalar(1 / l); }
}
function loadBank(file) {
  if (!fs.existsSync(file)) throw new Error("не найден " + file + " (задайте STEREO_ROOT)");
  const src = fs.readFileSync(file, "utf8");
  const THREE = new Proxy({ Vector3 }, {
    get(t, k) { return k in t ? t[k] : makeStub("THREE." + String(k)); }
  });
  const noop = () => {};
  const store = { getItem: () => null, setItem: noop, removeItem: noop, clear: noop, key: () => null, length: 0 };
  const sandbox = {
    THREE, document: makeStub("document"), navigator: makeStub("navigator"),
    location: { search: "", hash: "", href: "file:///", pathname: "/" },
    localStorage: store, sessionStorage: store,
    requestAnimationFrame: () => 0, cancelAnimationFrame: noop,
    setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
    addEventListener: noop, removeEventListener: noop,
    matchMedia: () => ({ matches: false, addEventListener: noop, addListener: noop }),
    console: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
    performance: { now: () => 0 }, devicePixelRatio: 1, innerWidth: 1024, innerHeight: 768
  };
  sandbox.window = sandbox; sandbox.self = sandbox;
  sandbox.module = { exports: {} }; sandbox.exports = sandbox.module.exports;
  vm.createContext(sandbox);
  const tail = "\n;globalThis.__LEGACY_PAR__ = {" +
    " PROBLEMS: (typeof PROBLEMS !== 'undefined') ? PROBLEMS : undefined," +
    " sceneData: (typeof sceneData === 'function') ? sceneData : undefined };\n";
  vm.runInContext(src + tail, sandbox, { filename: file });
  const got = sandbox.__LEGACY_PAR__ || {};
  const me = sandbox.module.exports || {};
  const PROBLEMS = got.PROBLEMS || me.PROBLEMS;
  const sceneData = got.sceneData || me.sceneData;
  if (!Array.isArray(PROBLEMS)) throw new Error("в " + file + " нет массива PROBLEMS");
  if (typeof sceneData !== "function") throw new Error("в " + file + " нет функции sceneData");
  return { PROBLEMS, sceneData };
}

/* =====================================================================
   Векторная геометрия
   ===================================================================== */
const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vmul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vlen = a => Math.hypot(a[0], a[1], a[2]);
const vunit = a => vmul(a, 1 / vlen(a));
const vmean = ps => vmul(ps.reduce(vadd, [0, 0, 0]), 1 / ps.length);
const clamp1 = x => Math.max(-1, Math.min(1, x));
const DEG = 180 / Math.PI;
const fmt = x => (typeof x === "number" && isFinite(x)) ? String(+x.toPrecision(12)) : String(x);
const relOk = (got, exp, eps) => isFinite(got) && isFinite(exp) && Math.abs(got - exp) <= eps * Math.max(1, Math.abs(exp));

/* параллелепипед: вершина A и три вектора рёбер AB, AD, AA1 */
const TEMPLATE = {
  A: [0, 0, 0], B: [1, 0, 0], C: [1, 1, 0], D: [0, 1, 0],
  A1: [0, 0, 1], B1: [1, 0, 1], C1: [1, 1, 1], D1: [0, 1, 1]
};
const VNAMES = Object.keys(TEMPLATE);
const BOX_EDGES = [];
for (let i = 0; i < VNAMES.length; i++)
  for (let j = i + 1; j < VNAMES.length; j++) {
    const d = vsub(TEMPLATE[VNAMES[i]], TEMPLATE[VNAMES[j]]);
    if (d.filter(x => x !== 0).length === 1) BOX_EDGES.push([VNAMES[i], VNAMES[j]]);
  }
const AXIS_END = ["B", "D", "A1"];   /* ребро из A вдоль оси 0, 1, 2 */
function boxFromVectors(u, v, w) {
  const G = {};
  for (const nm of VNAMES) {
    const [i, j, k] = TEMPLATE[nm];
    G[nm] = vadd(vadd(vmul(u, i), vmul(v, j)), vmul(w, k));
  }
  return G;
}
const rectBox = (x, y, z) => boxFromVectors([x, 0, 0], [0, y, 0], [0, 0, z]);
/* ось ребра по именам вершин (−1, если это не ребро) */
function edgeAxis(a, b) {
  if (!TEMPLATE[a] || !TEMPLATE[b]) return -1;
  const d = vsub(TEMPLATE[a], TEMPLATE[b]);
  const nz = [0, 1, 2].filter(i => d[i] !== 0);
  return nz.length === 1 ? nz[0] : -1;
}
const isSpaceDiagonal = (a, b) => !!TEMPLATE[a] && !!TEMPLATE[b] &&
  vsub(TEMPLATE[a], TEMPLATE[b]).every(x => x !== 0);

function pt(G, n) {
  const p = G[n];
  if (!p) throw new Error("нет точки " + n);
  return p;
}
const dist = (G, a, b) => vlen(vsub(pt(G, a), pt(G, b)));

/* площадь многоугольника в заданном порядке обхода (формула Ньюэлла) */
function ringArea(ps) {
  let n = [0, 0, 0];
  for (let i = 0; i < ps.length; i++) n = vadd(n, vcross(ps[i], ps[(i + 1) % ps.length]));
  return vlen(n) / 2;
}
/* нормаль по самой «толстой» тройке точек */
function bestNormal(ps) {
  let best = null, bl = 0;
  for (let i = 0; i < ps.length; i++)
    for (let j = i + 1; j < ps.length; j++)
      for (let k = j + 1; k < ps.length; k++) {
        const n = vcross(vsub(ps[j], ps[i]), vsub(ps[k], ps[i]));
        const l = vlen(n);
        if (l > bl) { bl = l; best = n; }
      }
  return best ? vunit(best) : null;
}
/* наибольшее удаление точек от их средней плоскости */
function planarityError(ps) {
  const n = bestNormal(ps);
  if (!n) return 0;
  const c = vmean(ps);
  return Math.max(...ps.map(p => Math.abs(vdot(n, vsub(p, c)))));
}
/* выпуклый многоугольник по неупорядоченным точкам плоскости */
function convexArea(ps) {
  if (ps.length < 3) return 0;
  const n = bestNormal(ps);
  if (!n) return 0;
  const c = vmean(ps);
  const far = ps.reduce((a, b) => (vlen(vsub(b, c)) > vlen(vsub(a, c)) ? b : a));
  const e1 = vunit(vsub(far, c)), e2 = vcross(n, e1);
  const ang = p => { const d = vsub(p, c); return Math.atan2(vdot(d, e2), vdot(d, e1)); };
  return ringArea(ps.slice().sort((a, b) => ang(a) - ang(b)));
}
/* выпуклая оболочка перебором опорных плоскостей (точек ≤ 12):
   объём = Σ S_грани · h(центр → грань) / 3, поверхность = Σ S_грани */
function hull(points) {
  const n = points.length;
  let scale = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) scale = Math.max(scale, vlen(vsub(points[i], points[j])));
  const eps = 1e-9 * Math.max(scale, 1e-300);
  const ctr = vmean(points);
  const planes = new Map();
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      for (let k = j + 1; k < n; k++) {
        const nr = vcross(vsub(points[j], points[i]), vsub(points[k], points[i]));
        if (vlen(nr) <= 1e-12 * scale * scale) continue;
        const nh = vunit(nr);
        let pos = false, neg = false;
        const on = [];
        for (let q = 0; q < n; q++) {
          const s = vdot(nh, vsub(points[q], points[i]));
          if (s > eps) pos = true;
          else if (s < -eps) neg = true;
          else on.push(q);
        }
        if (pos && neg) continue;
        const key = on.join(",");
        if (!planes.has(key)) planes.set(key, { on, normal: pos ? vmul(nh, -1) : nh, p0: points[i] });
      }
  let volume = 0, surface = 0;
  for (const pl of planes.values()) {
    const area = convexArea(pl.on.map(q => points[q]));
    surface += area;
    volume += area * Math.abs(vdot(pl.normal, vsub(pl.p0, ctr))) / 3;
  }
  return { volume, surface, faces: [...planes.values()] };
}
const hullOf = (G, names) => hull(names.map(nm => pt(G, nm)));
const boxVolume = G => hullOf(G, VNAMES).volume;
const boxSurface = G => hullOf(G, VNAMES).surface;
const faceArea = (G, names) => ringArea(names.map(nm => pt(G, nm)));

/* угол abc при вершине b, в градусах */
function angleAt(G, a, b, c) {
  const u = vsub(pt(G, a), pt(G, b)), v = vsub(pt(G, c), pt(G, b));
  return Math.acos(clamp1(vdot(u, v) / (vlen(u) * vlen(v)))) * DEG;
}
/* синус угла между прямыми ab и cd */
function sinLines(G, a, b, c, d) {
  const u = vsub(pt(G, b), pt(G, a)), v = vsub(pt(G, d), pt(G, c));
  return vlen(vcross(u, v)) / (vlen(u) * vlen(v));
}
/* угол между прямой ab и плоскостью через три точки, в градусах */
function angleLinePlane(G, a, b, plane) {
  const [p, q, r] = plane.map(nm => pt(G, nm));
  const n = vcross(vsub(q, p), vsub(r, p)), d = vsub(pt(G, b), pt(G, a));
  return Math.asin(clamp1(Math.abs(vdot(n, d)) / (vlen(n) * vlen(d)))) * DEG;
}
/* сечение параллелепипеда G плоскостью через точки P, Q, R:
   вершины многоугольника = пересечения плоскости с 12 рёбрами */
function sectionPoly(G, P, Q, R) {
  const p0 = pt(G, P);
  const nh = vunit(vcross(vsub(pt(G, Q), p0), vsub(pt(G, R), p0)));
  let scale = 0;
  for (const [a, b] of BOX_EDGES) scale = Math.max(scale, dist(G, a, b));
  const eps = 1e-9 * scale;
  const out = [];
  const addPt = x => { if (!out.some(y => vlen(vsub(x, y)) <= eps)) out.push(x); };
  for (const [a, b] of BOX_EDGES) {
    const U = pt(G, a), V = pt(G, b);
    const su = vdot(nh, vsub(U, p0)), sv = vdot(nh, vsub(V, p0));
    if (Math.abs(su) <= eps) addPt(U);
    if (Math.abs(sv) <= eps) addPt(V);
    if ((su > eps && sv < -eps) || (su < -eps && sv > eps)) addPt(vadd(U, vmul(vsub(V, U), su / (su - sv))));
  }
  return out;
}
const sectionArea = (G, P, Q, R) => convexArea(sectionPoly(G, P, Q, R));

/* корень возрастающей функции бисекцией до соседних double */
function solveInc(f, what, lo = 1e-6, hi = null) {
  if (hi === null) {
    hi = 1;
    for (let g = 0; g < 200 && f(hi) < 0; g++) hi *= 2;
  }
  const flo = f(lo), fhi = f(hi);
  if (!(flo <= 0 && fhi >= 0)) throw new Error("нет решения уравнения «" + what + "» на [" + fmt(lo) + "; " + fmt(hi) + "]");
  for (let i = 0; i < 4000; i++) {
    const m = (lo + hi) / 2;
    if (m <= lo || m >= hi) break;
    if (f(m) < 0) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

/* =====================================================================
   Разбор условия
   ===================================================================== */
const NUM = "√?\\d+(?:,\\d+)?";
const normText = s => String(s).replace(/₁/g, "1").replace(/ /g, " ");
function numVal(tok) {
  const s = String(tok).trim();
  if (s[0] === "√") return Math.sqrt(parseFloat(s.slice(1).replace(",", ".")));
  return parseFloat(s.replace(",", "."));
}
const isNumLabel = s => new RegExp("^" + NUM + "$").test(String(s).trim());
/* все числа текста, кроме индексов вершин (A1 → A) */
const allTokens = t => t.replace(/([A-Z])1/g, "$1").match(/√?\d+(?:,\d+)?/g) || [];
function splitNames(s) {
  const names = s.split(/\s*,\s*|\s+и\s+/).map(x => x.trim()).filter(Boolean);
  for (const nm of names) if (!/^[A-Z]1?$/.test(nm)) throw new Error("не разобрано имя точки «" + nm + "»");
  return names;
}
function makeReader(cond) {
  const t = normText(cond);
  const used = [];
  return {
    t, used,
    opt: re => t.match(re),
    need(re, what) {
      const m = t.match(re);
      if (!m) throw new Error("в условии не найдено: " + what);
      return m;
    },
    num(tok) { used.push(String(tok).trim()); return numVal(tok); },
    list(s) { return (s.match(/√?\d+(?:,\d+)?/g) || []).map(x => this.num(x)); }
  };
}

/* ---------- прямоугольный параллелепипед, заданный рёбрами и мерами ---------- */
function rectModel(R) {
  const t = R.t;
  const dims = [null, null, null];
  const facts = [];   /* данные условия — для сверки с чертежом */
  const cons = [];    /* уравнения на неизвестные рёбра */
  const setDim = (ax, v, what) => {
    if (dims[ax] !== null && !relOk(dims[ax], v, 1e-12)) throw new Error("противоречие в рёбрах условия: " + what);
    dims[ax] = v;
  };

  /* (а) рёбра из одной вершины, перечисленные числами: AB, AD, AA1 по порядку
     (так их подписывает чертёж; для прямоугольного параллелепипеда порядок
     на ответ не влияет) */
  let listed = 0;
  const mList = R.opt(/(Два ребра|Три ребра|Р[её]бра)[^.]*?из одной вершины,\s*равны\s+([^.]*?)\.(?:\s|$)/);
  if (mList) {
    const vals = R.list(mList[2]);
    const want = mList[1].startsWith("Два") ? 2 : 3;
    if (vals.length !== want) throw new Error("ожидалось рёбер из вершины: " + want + ", найдено " + vals.length);
    vals.forEach((v, i) => {
      setDim(i, v, "ребро " + (i + 1));
      facts.push({ what: "ребро A" + AXIS_END[i] + " = " + fmt(v), fn: G => dist(G, "A", AXIS_END[i]), value: v, power: 1 });
    });
    listed = vals.length;
  }
  /* (б) именованные отрезки «XY = n»: ребро задаёт измерение, иначе — уравнение */
  for (const m of t.matchAll(/\b([A-D]1?)([A-D]1?)\s*=\s*(√?\d+(?:,\d+)?)/g)) {
    const [, a, b, tok] = m;
    const v = R.num(tok);
    const ax = edgeAxis(a, b);
    const f = { what: a + b + " = " + tok, fn: G => dist(G, a, b), value: v, power: 1 };
    if (ax >= 0) setDim(ax, v, a + b); else cons.push(f);
    facts.push(f);
  }
  /* (в) площадь поверхности, объём, диагональ */
  const mS = R.opt(new RegExp("[Пп]лощадь поверхности[^.]*?равна\\s+(" + NUM + ")"));
  if (mS) {
    const f = { what: "площадь поверхности = " + mS[1], fn: boxSurface, value: R.num(mS[1]), power: 2 };
    cons.push(f); facts.push(f);
  }
  const mV = R.opt(new RegExp("Объём[^.]*?равен\\s+(" + NUM + ")"));
  if (mV) {
    const f = { what: "объём = " + mV[1], fn: boxVolume, value: R.num(mV[1]), power: 3 };
    cons.push(f); facts.push(f);
  }
  const mD = R.opt(new RegExp("Диагональ[^.]*?равна\\s+(" + NUM + ")"));
  if (mD) {
    /* у прямоугольного параллелепипеда все четыре диагонали равны; берём BD1 */
    const f = { what: "диагональ BD1 = " + mD[1], fn: G => dist(G, "B", "D1"), value: R.num(mD[1]), power: 1 };
    cons.push(f); facts.push(f);
  }

  const unknown = [0, 1, 2].filter(i => dims[i] === null);
  if (unknown.length > 1) throw new Error("модель: неизвестных рёбер больше одного");
  if (unknown.length !== cons.length)
    throw new Error("модель: неизвестных рёбер " + unknown.length + ", уравнений " + cons.length);
  if (unknown.length === 1) {
    const ax = unknown[0], c = cons[0];
    const mk = x => { const d = dims.slice(); d[ax] = x; return rectBox(d[0], d[1], d[2]); };
    dims[ax] = solveInc(x => c.fn(mk(x)) - c.value, c.what);
  }
  const G = rectBox(dims[0], dims[1], dims[2]);

  /* (г) точка — середина ребра */
  const extra = {};
  const mK = R.opt(/Точка ([E-Z]) [—–-] середина ребра ([A-D]1?)([A-D]1?)/);
  if (mK) {
    const [, nm, a, b] = mK;
    if (edgeAxis(a, b) < 0) throw new Error(a + b + " — не ребро");
    G[nm] = vmean([G[a], G[b]]);
    extra[nm] = [a, b];
  }

  /* (д) вопрос */
  let q, m;
  if (R.opt(/Найдите третье ребро/)) {
    if (listed !== 2 || unknown.length !== 1) throw new Error("«третье ребро»: в условии не два ребра из вершины");
    const e = AXIS_END[unknown[0]];
    q = { kind: "третье ребро", power: 1, ask: g => dist(g, "A", e) };
  } else if (R.opt(/Найдите (?:его )?площадь (?:его )?поверхности/)) {
    q = { kind: "площадь поверхности", power: 2, ask: boxSurface };
  } else if (R.opt(/Найдите ребро равновеликого ему куба/)) {
    q = {
      kind: "ребро равновеликого куба", power: 1,
      ask: g => { const V = boxVolume(g); return solveInc(e => boxVolume(rectBox(e, e, e)) - V, "ребро куба"); }
    };
  } else if (R.opt(/рёбра которого равны половинам рёбер/)) {
    q = {
      kind: "объём половинного параллелепипеда", power: 3,
      ask: g => {
        const half = nm => vmul(vsub(pt(g, nm), pt(g, "A")), 0.5);
        return boxVolume(boxFromVectors(half("B"), half("D"), half("A1")));
      }
    };
  } else if (R.opt(/Найдите объём параллелепипеда\./)) {
    q = { kind: "объём", power: 3, ask: boxVolume };
  } else if ((m = R.opt(/Найдите квадрат расстояния между вершинами ([A-D]1?) и ([A-D]1?)/))) {
    const [, a, b] = m;
    q = { kind: "квадрат расстояния", power: 2, ask: g => dist(g, a, b) ** 2 };
  } else if ((m = R.opt(/Найдите расстояние между вершинами ([A-D]1?) и ([A-D]1?)/))) {
    const [, a, b] = m;
    q = { kind: "расстояние", power: 1, ask: g => dist(g, a, b) };
  } else if ((m = R.opt(/Найдите длину ребра ([A-D]1?)([A-D]1?)/))) {
    const [, a, b] = m;
    if (edgeAxis(a, b) < 0) throw new Error(a + b + " — не ребро");
    q = { kind: "длина ребра", power: 1, ask: g => dist(g, a, b) };
  } else if ((m = R.opt(/Найдите длину диагонали ([A-D]1?)([A-D]1?)/))) {
    const [, a, b] = m;
    if (!isSpaceDiagonal(a, b)) throw new Error(a + b + " — не диагональ параллелепипеда");
    q = { kind: "длина диагонали", power: 1, ask: g => dist(g, a, b) };
  } else if (R.opt(/Найдите (?:его )?диагональ/)) {
    q = { kind: "диагональ", power: 1, ask: g => dist(g, "B", "D1") };
  } else if ((m = R.opt(/Найдите угол ([A-D]1?)([A-D]1?)([A-D]1?)/))) {
    R.need(/в градусах/, "«в градусах»");
    const [, a, b, c] = m;
    q = { kind: "угол", power: 0, ask: g => angleAt(g, a, b, c) };
  } else if ((m = R.opt(/синус угла между прямыми ([A-D]1?)([A-D]1?) и ([A-D]1?)([A-D]1?)/))) {
    const [, a, b, c, d] = m;
    q = { kind: "синус угла между прямыми", power: 0, ask: g => sinLines(g, a, b, c, d) };
  } else if ((m = R.opt(/площадь сечения[^.]*?через (?:вершины|точки) ([^.]*?)\.(?:\s|$)/))) {
    const names = splitNames(m[1]);
    if (names.length !== 3) throw new Error("сечение задано не тремя точками");
    q = { kind: "площадь сечения", power: 2, section: names, ask: g => sectionArea(g, names[0], names[1], names[2]) };
  } else if ((m = R.opt(/объём многогранника, вершинами которого являются (?:точки|вершины) ((?:[A-D]1?)(?:,\s*[A-D]1?)*)/))) {
    const names = splitNames(m[1]);
    q = { kind: "объём многогранника", power: 3, solid: names, ask: g => hullOf(g, names).volume };
  } else {
    throw new Error("вопрос задачи не распознан");
  }
  return {
    kind: q.kind, power: q.power, ask: q.ask, value: q.ask(G), G, facts, extra,
    determined: true, rect: true, solid: q.solid || null, section: q.section || null, notes: []
  };
}

/* ---------- тело не определено данными: ответ на нескольких телах ---------- */
function multiShape(name, variants, ask) {
  const vals = variants.map(ask);
  for (let i = 1; i < vals.length; i++)
    if (!relOk(vals[i], vals[0], EPS_ANS))
      throw new Error(name + ": ответ зависит от формы тела (" + vals.map(fmt).join(" / ") + ")");
  return vals[0];
}
const perpFact = { what: "ребро AA1 перпендикулярно грани ABCD", fn: G => angleLinePlane(G, "A", "A1", ["A", "B", "D"]), value: 90, power: 0 };
const XS = [0.5, 1, 2, 3, 7];   /* разные стороны грани ABCD */

/* 27076: дана площадь грани и перпендикулярное ей ребро; найти объём */
function faceEdgeVolModel(R) {
  const S = R.num(R.need(new RegExp("Площадь грани[^.]*?равна\\s+(" + NUM + ")"), "площадь грани")[1]);
  const h = R.num(R.need(new RegExp("Ребро, перпендикулярное этой грани, равно\\s+(" + NUM + ")"), "ребро ⟂ грани")[1]);
  R.need(/Найдите объём параллелепипеда\./, "вопрос «объём»");
  const variants = XS.map(x => {
    const y = solveInc(y => faceArea(rectBox(x, y, h), ["A", "B", "C", "D"]) - S, "грань x·y = S");
    return rectBox(x, y, h);
  });
  return {
    kind: "объём по грани и ребру", power: 3, ask: boxVolume, value: multiShape("объём", variants, boxVolume),
    facts: [
      { what: "площадь грани ABCD = " + fmt(S), fn: G => faceArea(G, ["A", "B", "C", "D"]), value: S, power: 2 },
      { what: "ребро AA1 = " + fmt(h), fn: G => dist(G, "A", "A1"), value: h, power: 1 }, perpFact
    ],
    extra: {}, determined: false, rect: true, solid: null, section: null,
    notes: ["данные не задают форму грани; ответ одинаков на " + variants.length + " телах"]
  };
}
/* 27077: даны объём и ребро; найти площадь грани, перпендикулярной ребру */
function volEdgeFaceModel(R) {
  const V = R.num(R.need(new RegExp("Объём[^.]*?равен\\s+(" + NUM + ")"), "объём")[1]);
  const e = R.num(R.need(new RegExp("Одно из его рёбер равно\\s+(" + NUM + ")"), "ребро")[1]);
  R.need(/Найдите площадь грани параллелепипеда, перпендикулярной этому ребру/, "вопрос «площадь грани»");
  const variants = XS.map(x => {
    const y = solveInc(y => boxVolume(rectBox(x, y, e)) - V, "объём = V");
    return rectBox(x, y, e);
  });
  const ask = G => faceArea(G, ["A", "B", "C", "D"]);
  return {
    kind: "площадь грани ⟂ ребру", power: 2, ask, value: multiShape("площадь грани", variants, ask),
    facts: [
      { what: "объём = " + fmt(V), fn: boxVolume, value: V, power: 3 },
      { what: "ребро AA1 = " + fmt(e), fn: G => dist(G, "A", "A1"), value: e, power: 1 }, perpFact
    ],
    extra: {}, determined: false, rect: true, solid: null, section: null,
    notes: ["данные не задают две другие стороны; ответ одинаков на " + variants.length + " телах"]
  };
}
/* 27078: даны объём и площадь грани; найти ребро, перпендикулярное грани */
function volFaceEdgeModel(R) {
  const V = R.num(R.need(new RegExp("Объём[^.]*?равен\\s+(" + NUM + ")"), "объём")[1]);
  const S = R.num(R.need(new RegExp("Площадь одной его грани равна\\s+(" + NUM + ")"), "площадь грани")[1]);
  R.need(/Найдите ребро параллелепипеда, перпендикулярное этой грани/, "вопрос «ребро ⟂ грани»");
  const variants = XS.map(x => {
    const y = solveInc(y => faceArea(rectBox(x, y, 1), ["A", "B", "C", "D"]) - S, "грань x·y = S");
    const z = solveInc(z => boxVolume(rectBox(x, y, z)) - V, "объём = V");
    return rectBox(x, y, z);
  });
  const ask = G => dist(G, "A", "A1");
  return {
    kind: "ребро ⟂ грани", power: 1, ask, value: multiShape("ребро", variants, ask),
    facts: [
      { what: "объём = " + fmt(V), fn: boxVolume, value: V, power: 3 },
      { what: "площадь грани ABCD = " + fmt(S), fn: G => faceArea(G, ["A", "B", "C", "D"]), value: S, power: 2 }, perpFact
    ],
    extra: {}, determined: false, rect: true, solid: null, section: null,
    notes: ["данные не задают форму грани; ответ одинаков на " + variants.length + " телах"]
  };
}
/* 27103: грань — квадрат, диагональ d под углом φ к плоскости этой грани */
function squareDiagAngleModel(R) {
  R.need(/Одна из граней[^.]*?[—–-] квадрат/, "грань-квадрат");
  const d = R.num(R.need(new RegExp("Диагональ параллелепипеда равна\\s+(" + NUM + ")"), "диагональ")[1]);
  const phi = R.num(R.need(/угол\s+(\d+(?:,\d+)?)°/, "угол")[1]);
  R.need(/Найдите объём параллелепипеда\./, "вопрос «объём»");
  /* квадрат ABCD со стороной s; высота h — из |BD1| = d; s — из угла */
  const withSide = s => rectBox(s, s, solveInc(h => dist(rectBox(s, s, h), "B", "D1") - d, "|BD1| = d", 1e-9, d));
  const sMax = d / Math.SQRT2 * (1 - 1e-12);
  const s = solveInc(x => phi - angleLinePlane(withSide(x), "B", "D1", ["A", "B", "D"]), "угол = φ", 1e-9 * d, sMax);
  const G = withSide(s);
  return {
    kind: "объём по диагонали и углу", power: 3, ask: boxVolume, value: boxVolume(G), G,
    facts: [
      { what: "грань ABCD — квадрат (AB : AD = 1)", fn: g => dist(g, "A", "B") / dist(g, "A", "D"), value: 1, power: 0 },
      { what: "диагональ BD1 = " + fmt(d), fn: g => dist(g, "B", "D1"), value: d, power: 1 },
      { what: "угол BD1 с плоскостью ABCD = " + fmt(phi) + "°", fn: g => angleLinePlane(g, "B", "D1", ["A", "B", "D"]), value: phi, power: 0 }
    ],
    extra: {}, determined: true, rect: true, solid: null, section: null, notes: []
  };
}
/* 27209: объём ПРОИЗВОЛЬНОГО параллелепипеда; найти объём пирамиды на его вершинах */
function generalHullModel(R) {
  if (R.opt(/прямоугольн/)) throw new Error("ожидался произвольный параллелепипед");
  const V = R.num(R.need(new RegExp("Объём параллелепипеда [A-D1]+ равен\\s+(" + NUM + ")"), "объём")[1]);
  const m = R.need(/объём треугольной пирамиды ((?:[A-D]1?){4})/, "вопрос «объём пирамиды»");
  const names = m[1].match(/[A-D]1?/g);
  const shapes = [
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    [[2, 0, 0], [0, 3, 0], [0, 0, 5]],
    [[3, 0, 0], [1, 2, 0], [0.5, 0.7, 1.9]],
    [[1, 0.2, 0], [-0.4, 1.3, 0.1], [0.6, -0.3, 2.2]]
  ];
  const variants = shapes.map(([u, v, w]) => {
    const lam = solveInc(l => boxVolume(boxFromVectors(vmul(u, l), vmul(v, l), vmul(w, l))) - V, "объём = V");
    return boxFromVectors(vmul(u, lam), vmul(v, lam), vmul(w, lam));
  });
  const ask = G => hullOf(G, names).volume;
  return {
    kind: "объём пирамиды в параллелепипеде", power: 3, ask, value: multiShape("объём пирамиды", variants, ask),
    facts: [{ what: "объём параллелепипеда = " + fmt(V), fn: boxVolume, value: V, power: 3 }],
    extra: {}, determined: false, rect: false, solid: names, section: null,
    notes: ["в условии произвольный параллелепипед; ответ одинаков на " + variants.length + " телах, в т. ч. двух наклонных"]
  };
}

/* модель по id (по умолчанию — общая модель прямоугольного параллелепипеда)
   и ожидаемый вид вопроса: сторож от регулярки, сработавшей не на то */
const SPECIAL = {
  "27076": faceEdgeVolModel, "27077": volEdgeFaceModel, "27078": volFaceEdgeModel,
  "27103": squareDiagAngleModel, "27209": generalHullModel
};
const EXPECT = {
  "27054": "третье ребро", "27128": "площадь поверхности", "27143": "площадь поверхности",
  "27146": "площадь поверхности", "27076": "объём по грани и ребру", "27077": "площадь грани ⟂ ребру",
  "27078": "ребро ⟂ грани", "27079": "третье ребро", "27080": "ребро равновеликого куба",
  "27100": "объём", "27101": "диагональ", "27103": "объём по диагонали и углу",
  "661073": "объём половинного параллелепипеда", "27060": "диагональ",
  "245359": "квадрат расстояния", "245360": "расстояние", "284357": "длина ребра",
  "284363": "длина диагонали", "245361": "угол", "245363": "угол",
  "318474": "синус угла между прямыми", "316552": "площадь сечения", "324452": "площадь сечения",
  "315131": "площадь сечения", "27209": "объём пирамиды в параллелепипеде",
  "245335": "объём многогранника", "245336": "объём многогранника", "245337": "объём многогранника",
  "245338": "объём многогранника", "245339": "объём многогранника", "639664": "объём многогранника",
  "639741": "объём многогранника", "660710": "объём многогранника"
};

function buildModel(p) {
  const R = makeReader(p.cond);
  const M = (SPECIAL[p.id] || rectModel)(R);
  /* каждое число условия должно войти в модель */
  const all = allTokens(R.t).slice().sort(), used = R.used.slice().sort();
  if (JSON.stringify(all) !== JSON.stringify(used))
    throw new Error("числа условия [" + all.join("; ") + "], модель использовала [" + used.join("; ") + "]");
  return M;
}

/* =====================================================================
   Сверка чертежа
   ===================================================================== */
function scenePoints(p, sd) {
  const SG = {};
  for (const g of sd.gen || [])
    for (const [nm, q] of Object.entries(g.pts || {})) SG[nm] = [+q[0], +q[1], +q[2]];
  /* construct.points — как resolvePt в trainer.js */
  const fb = sd.firstBox || { a: 1, b: 1, c: 1 };
  const cp = (p.construct && p.construct.points) || {};
  for (const [nm, spec] of Object.entries(cp)) {
    if (Array.isArray(spec) && spec[0] === "mid") SG[nm] = vmean([pt(SG, spec[1]), pt(SG, spec[2])]);
    else SG[nm] = [spec[0] * fb.a, spec[1] * fb.b, spec[2] * fb.c];
  }
  return SG;
}
const sameName = (a, b) => normText(a) === normText(b);

function checkScene(p, M, sd, err, warn) {
  const SG = scenePoints(p, sd);
  const missing = VNAMES.filter(nm => !SG[nm]);
  if (missing.length) { err("на чертеже нет вершин " + missing.join(", ")); return; }
  let scale = 0;
  for (const [a, b] of BOX_EDGES) scale = Math.max(scale, dist(SG, a, b));
  const epsLen = EPS_GEO * Math.max(1, scale);

  /* это параллелепипед (и прямоугольный, если так сказано в условии) */
  const axisVec = ax => vsub(SG[AXIS_END[ax]], SG.A);
  for (const [a, b] of BOX_EDGES) {
    const ax = edgeAxis(a, b);
    const [lo, hi] = TEMPLATE[a][ax] < TEMPLATE[b][ax] ? [a, b] : [b, a];
    if (vlen(vsub(vsub(SG[hi], SG[lo]), axisVec(ax))) > epsLen)
      err("чертёж не параллелепипед: ребро " + lo + hi + " не параллельно и не равно A" + AXIS_END[ax]);
  }
  if (M.rect)
    for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) {
      const c = vdot(axisVec(i), axisVec(j)) / (vlen(axisVec(i)) * vlen(axisVec(j)));
      if (Math.abs(c) > EPS_GEO) err("чертёж не прямоугольный: угол между A" + AXIS_END[i] + " и A" + AXIS_END[j] + " = " + fmt(Math.acos(clamp1(c)) * DEG) + "°");
    }

  const meas = [];   /* {what, got, exp, power}: got ≈ exp · k^power */
  const tryMeas = (what, fn, exp, power) => {
    let got;
    try { got = fn(); } catch (e) { err(what + ": " + e.message); return; }
    meas.push({ what, got, exp, power });
  };

  /* подписи чертежа */
  for (const [a, b, txt] of p.labels || []) {
    if (!SG[a] || !SG[b]) { err("подпись " + a + b + ": такой точки на чертеже нет"); continue; }
    if (isNumLabel(txt)) tryMeas("подпись " + a + b + " = " + txt, () => dist(SG, a, b), numVal(txt), 1);
  }
  const cst = p.construct || {};
  for (const [a, b, txt] of cst.segments || []) {
    if (!SG[a] || !SG[b]) { err("отрезок построения " + a + b + ": такой точки на чертеже нет"); continue; }
    if (txt != null && isNumLabel(txt)) tryMeas("подпись построения " + a + b + " = " + txt, () => dist(SG, a, b), numVal(txt), 1);
  }
  for (const gf of p.givenFaces || []) {
    const ring = gf.face || [];
    if (ring.some(nm => !SG[nm])) { err("грань " + ring.join("") + ": такой точки на чертеже нет"); continue; }
    const txt = String(gf.text || "").trim();
    const ms = txt.match(new RegExp("^S\\s*=\\s*(" + NUM + ")$"));
    if (ms) tryMeas("подпись грани " + ring.join("") + " «" + txt + "»", () => faceArea(SG, ring), numVal(ms[1]), 2);
    else if (txt === "квадрат") {
      const sides = ring.map((nm, i) => dist(SG, nm, ring[(i + 1) % ring.length]));
      sides.forEach((sd2, i) => tryMeas("грань-квадрат " + ring.join("") + ": сторона " + (i + 1) + " : сторона 1", () => sd2 / sides[0], 1, 0));
      tryMeas("грань-квадрат " + ring.join("") + ": угол", () => angleAt(SG, ring[3], ring[0], ring[1]), 90, 0);
    } else if (!/^S\s*=\s*\?$/.test(txt)) warn("подпись грани «" + txt + "» не разобрана");
  }

  /* данные условия и искомая величина, измеренные на чертеже */
  for (const f of M.facts) tryMeas("данное условия «" + f.what + "»", () => f.fn(SG), f.value, f.power);
  tryMeas("искомое (" + M.kind + ") на чертеже", () => M.ask(SG), M.value, M.power);
  if (M.determined)
    for (const e of AXIS_END) tryMeas("ребро A" + e + " как в модели по условию", () => dist(SG, "A", e), dist(M.G, "A", e), 1);

  /* точки, названные в условии */
  for (const [nm, [a, b]] of Object.entries(M.extra || {})) {
    if (!SG[nm]) { err("точка " + nm + " названа в условии, но на чертеже её нет"); continue; }
    const off = vlen(vsub(SG[nm], vmean([SG[a], SG[b]])));
    if (off > epsLen) err("точка " + nm + " на чертеже не середина " + a + b + " (смещение " + fmt(off) + ")");
  }

  /* тело построения */
  if (cst.solid) {
    const names = [...new Set(cst.solid.flat())];
    const miss = names.filter(nm => !SG[nm]);
    if (miss.length) err("construct.solid: нет точек " + miss.join(", "));
    else {
      if (M.solid) {
        const want = M.solid.slice().sort().join(","), have = names.slice().sort().join(",");
        if (want !== have) err("тело построения на вершинах " + have + ", а в условии " + want);
      }
      if (M.power === 3) tryMeas("объём тела построения (construct.solid)", () => hullOf(SG, names).volume, M.value, 3);
      else warn("тело построения в задаче, где спрашивают не объём");
      const H = hullOf(SG, names);
      let faceSum = 0;
      for (const ring of cst.solid) {
        const ps = ring.map(nm => SG[nm]);
        const pe = planarityError(ps);
        if (pe > epsLen) { err("грань тела построения " + ring.join("") + " не плоская (" + fmt(pe) + ")"); continue; }
        const n = bestNormal(ps);
        const sides = names.map(nm => vdot(n, vsub(SG[nm], ps[0])));
        if (sides.some(s => s > epsLen) && sides.some(s => s < -epsLen))
          err("грань тела построения " + ring.join("") + " режет тело (не грань выпуклой оболочки)");
        faceSum += ringArea(ps);
      }
      if (!relOk(faceSum, H.surface, EPS_GEO))
        err("грани тела построения покрывают площадь " + fmt(faceSum) + ", а поверхность тела " + fmt(H.surface) + " (грань пропущена или лишняя)");
    }
  }

  /* закрашенное сечение */
  if (M.section) {
    const [P, Q, Rn] = M.section;
    const fill = (cst.fills || []).find(r => M.section.every(nm => r.some(x => sameName(x, nm))));
    if (!fill) err("сечение через " + M.section.join(", ") + " не закрашено на чертеже");
    else if (fill.some(nm => !SG[nm])) err("закрашенное сечение: нет точек " + fill.filter(nm => !SG[nm]).join(", "));
    else if (M.section.every(nm => SG[nm])) {
      const ps = fill.map(nm => SG[nm]);
      const poly = sectionPoly(SG, P, Q, Rn);
      const n = vunit(vcross(vsub(SG[Q], SG[P]), vsub(SG[Rn], SG[P])));
      const off = Math.max(...ps.map(x => Math.abs(vdot(n, vsub(x, SG[P])))));
      if (off > epsLen) err("закрашенное сечение " + fill.join("") + " не лежит в плоскости " + P + Q + Rn);
      const match = poly.length === ps.length && poly.every(x => ps.some(y => vlen(vsub(x, y)) <= epsLen));
      if (!match) err("закрашено " + fill.join("") + " (" + ps.length + " верш.), а сечение плоскостью " + P + Q + Rn + " — " + poly.length + "-угольник с другими вершинами");
      tryMeas("площадь закрашенного сечения " + fill.join(""), () => ringArea(ps), M.value, 2);
    }
  }

  /* единый масштаб */
  const base = meas.find(x => x.power >= 1 && isFinite(x.got) && x.exp > 0);
  const k = base ? Math.pow(base.got / base.exp, 1 / base.power) : 1;
  if (!base) warn("на чертеже нет ни одной величины, задающей масштаб");
  /* поле unit: длина условия на единицу сцены — панель измерений показывает
     fmtLen(длина на сцене · unit); нет поля — 1. Верно k · unit = 1 */
  const hasU = p.unit !== undefined, u = hasU ? p.unit : 1;
  if (hasU && !(typeof u === "number" && isFinite(u) && u > 0)) err("unit = " + String(u) + " — не положительное число");
  else if (!relOk(k * u, 1, EPS_GEO))
    err("масштаб чертежа k = " + fmt(k) + " (по «" + (base ? base.what : "—") + "»), unit = " + fmt(u) +
      ": панель измерений покажет длины, умноженные на " + fmt(k * u) + ", а не длины условия");
  for (const x of meas) {
    const expK = x.exp * Math.pow(k, x.power);
    if (!relOk(x.got, expK, EPS_GEO))
      err(x.what + ": на чертеже " + fmt(x.got) + ", по условию " + fmt(expK) + (x.power ? " (k = " + fmt(k) + ")" : ""));
  }
  return { k, count: meas.length };
}

/* =====================================================================
   Прогон
   ===================================================================== */
function main() {
  let bank;
  try { bank = loadBank(DATA_FILE); }
  catch (e) {
    console.log("ОШИБКА загрузки линейки: " + e.message);
    console.log(TOPIC + " (старые): задач 0, расхождений 1");
    process.exit(1);
  }
  const tasks = bank.PROBLEMS.filter(p => p && /^\d+$/.test(String(p.id)) && p.topic === TOPIC);
  const lines = [];
  const notes = [], warns = [];
  if (tasks.length !== EXPECTED_COUNT)
    lines.push("ожидалось задач: " + EXPECTED_COUNT + ", найдено " + tasks.length + " (" + tasks.map(p => p.id).join(", ") + ")");
  const seen = new Set(tasks.map(p => String(p.id)));
  for (const id of Object.keys(EXPECT)) if (!seen.has(id)) lines.push(id + ": задачи нет в линейке");
  for (const id of seen) if (!EXPECT[id]) lines.push(id + ": задача не описана в верификаторе");

  for (const p of tasks) {
    const id = String(p.id);
    const err = msg => lines.push(id + ": " + msg);
    const warn = msg => (STRICT ? lines : warns).push(id + ": " + msg);
    if (!EXPECT[id]) continue;
    let M;
    try { M = buildModel(p); }
    catch (e) { err("модель: " + e.message); continue; }
    if (M.kind !== EXPECT[id]) err("вопрос распознан как «" + M.kind + "», ожидалось «" + EXPECT[id] + "»");

    /* 1) ответ */
    const ansStr = String(p.ans);
    if (!/^\d+(?:,\d+)?$/.test(ansStr.trim())) err("ответ в банке «" + ansStr + "» не число формата банка");
    const want = numVal(ansStr);
    if (!relOk(M.value, want, EPS_ANS)) err("ответ по условию " + fmt(M.value) + ", в банке " + ansStr);

    /* 2) чертёж */
    let sd = null;
    try { sd = bank.sceneData(p); }
    catch (e) { err("sceneData: " + e.message); }
    let sc = null;
    if (sd) {
      try { sc = checkScene(p, M, sd, err, warn); }
      catch (e) { err("сверка чертежа упала: " + e.message); }
    }
    for (const n of M.notes || []) notes.push(id + ": " + n);
    if (VERBOSE)
      console.log("  " + id.padEnd(7) + M.kind.padEnd(36) + "модель " + fmt(M.value).padEnd(14) + "банк " + ansStr.padEnd(6) +
        (sc ? "чертёж: величин " + sc.count + ", k = " + fmt(sc.k) : ""));
  }

  for (const n of notes) console.log("  примечание: " + n);
  for (const w of warns) console.log("предупреждение " + w);
  for (const l of lines) console.log("РАСХОЖДЕНИЕ " + l);
  console.log(TOPIC + " (старые): задач " + tasks.length + ", расхождений " + lines.length);
  if (warns.length) console.log("(предупреждений " + warns.length + " — на код выхода не влияют; --strict делает их расхождениями)");
  if (lines.length === 0) {
    console.log("LEGACY_PAR_VERIFY_OK");
    process.exit(0);
  }
  process.exit(1);
}

main();
