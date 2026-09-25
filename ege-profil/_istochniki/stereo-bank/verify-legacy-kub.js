/* Независимый верификатор СТАРЫХ задач стерео-банка, тема «Куб».

   Старые задачи — 14 задач с числовыми id (номера Решу ЕГЭ). Под этими id
   у учеников записан прогресс (stereo3.status), поэтому здесь ничего
   не правится — только проверяется.

   Что проверяется для каждой задачи
   1. Ответ. Тип задачи распознаётся по формулировке условия p.cond,
      числа берутся регулярками из того же текста, ответ пересчитывается
      своим кодом, а не формулой из решения: величины куба считаются
      численно по восьми вершинам (объём — разбиение на 6 тетраэдров,
      площадь поверхности — векторные произведения диагоналей граней,
      диагональ — расстояние между противоположными вершинами), обратные
      задачи («по площади найти ребро») решаются бисекцией, отсечённая
      призма — отсечением квадрата полуплоскостью и формулой шнурков.
      p.ans участвует только в итоговой сверке; p.sol и p.hint не читаются.
      Если данные есть только на рисунке, это помечено в коде: «ПО РИСУНКУ».
   2. Чертёж — выход sceneData(p), как его собирает тренажёр:
      • каждое тело сцены — действительно куб (рёбра равны, углы прямые);
      • ребро куба, каждая числовая подпись (labels и подписанные отрезки
        построения), искомый отрезок «?», объём нарисованного тела
        построения и размеры из задания сцены (scene.prims / dims)
        сводятся к ОДНОМУ масштабу на задачу (допуск 1e-6);
      • для двух кубов — отношение их размеров из условия;
      • пирамида, вписанная в куб (639619): тело-пирамида сцены (или, если
        его нет, тело построения) — основание на грани куба, вершина на
        противоположной грани; тело построения — та же пирамида;
        неподписанный отрезок построения — её высота;
      • поле unit (длина условия на единицу сцены) равно 1/k.
      Предупреждения (не ошибки): масштаб сцены не 1 без unit, совпадающие
      имена вершин у разных тел сцены, данные только на рисунке и т. п.

   Запуск (голый Node, без зависимостей):
     node verify-legacy-kub.js                  — линейка ../../trainers/stereo
     STEREO_ROOT=<папка линейки> node verify-legacy-kub.js
     ключ -v — по строке на каждую задачу;
     ключ --strict — дефекты видимости тел тоже считаются расхождениями.
   Берутся задачи PROBLEMS с id из одних цифр и topic === "Куб" (ровно 14);
   новые задачи (id вида kub-01) пропускаются — их проверяет verify-kub.js.
   Код 0 и маркер LEGACY_KUB_VERIFY_OK — только при нуле расхождений. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const STEREO_ROOT = process.env.STEREO_ROOT ||
  path.resolve(__dirname, "..", "..", "trainers", "stereo");
const DATA_JS = path.join(STEREO_ROOT, "js", "data.js");
const TOPIC = "Куб";
const EXPECTED_COUNT = 14;
const TOL_ANS = 1e-9;    /* ответ: относительный допуск */
const TOL_GEO = 1e-6;    /* единый масштаб чертежа: относительный допуск */
const TOL_SHAPE = 1e-9;  /* форма тела: равенство рёбер, прямые углы */
const VERBOSE = process.argv.includes("-v") || process.argv.includes("--verbose");
/* --strict: дефекты видимости (тело сцены закрыто другим из-за совпадающих
   имён точек, тела пересекаются) считаются расхождениями, а не предупреждениями */
const STRICT = process.argv.includes("--strict");

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
   1. Векторная арифметика
   ============================================================ */
const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const add = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
const scl = (p, s) => [p[0] * s, p[1] * s, p[2] * s];
const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
const norm = p => Math.hypot(p[0], p[1], p[2]);
const dist = (p, q) => norm(sub(p, q));
const det3 = (u, v, w) => dot(u, cross(v, w));
const tetVol = (p, q, r, s) => Math.abs(det3(sub(q, p), sub(r, p), sub(s, p))) / 6;
const relDiff = (x, y) => Math.abs(x - y) / Math.max(Math.abs(x), Math.abs(y), 1e-300);
const fmt = x => (Number.isFinite(x) ? String(+x.toPrecision(12)).replace(".", ",") : String(x));
const isPt = p => Array.isArray(p) && p.length >= 3 && p.slice(0, 3).every(Number.isFinite);

/* ============================================================
   2. Числа из текста условия
   ============================================================ */
const WORDS = { "два": 2, "две": 2, "три": 3, "четыре": 4, "пять": 5, "шесть": 6,
  "семь": 7, "восемь": 8, "девять": 9, "десять": 10 };
/* число условия: 18 · 0,5 · √12 · 24√3 */
const NUM = String.raw`(?:\d+(?:,\d+)?)?\s*√\s*\d+(?:,\d+)?|\d+(?:,\d+)?`;
/* то же или число словом («в три раза») */
const NUMW = NUM + "|" + Object.keys(WORDS).join("|");
const dec = s => Number(String(s).replace(",", "."));

function numOf(s) {
  const t = String(s).replace(/\s+/g, "").toLowerCase();
  if (t in WORDS) return WORDS[t];
  let m = t.match(/^(\d+(?:,\d+)?)?√(\d+(?:,\d+)?)$/);
  if (m) return (m[1] ? dec(m[1]) : 1) * Math.sqrt(dec(m[2]));
  if (/^\d+(?:,\d+)?$/.test(t)) return dec(t);
  throw new Error("не число: «" + s + "»");
}
/* все числа текста — для сверки подписей чертежа с условием */
function condNumbers(cond) {
  const out = [];
  const re = new RegExp("(?<![A-Za-z0-9])(?:" + NUM + ")|(?<![а-яё])(?:" +
    Object.keys(WORDS).join("|") + ")(?![а-яё])", "gi");
  for (const m of cond.match(re) || []) out.push(numOf(m));
  return out;
}
/* подпись чертежа: «6», «√12», «2√3», «1,5»; остальное (x, 90°, ?) — не число */
function labelNum(t) {
  const s = String(t).replace(/\s+/g, "");
  if (!/^(?:\d+(?:,\d+)?)?√\d+(?:,\d+)?$|^\d+(?:,\d+)?$/.test(s)) return null;
  return numOf(s);
}
/* какая величина куба названа в словах */
function qty(s) {
  s = String(s).toLowerCase();
  if (/поверхност/.test(s)) return "S";
  if (/объ[её]м/.test(s)) return "V";
  if (/диагонал/.test(s)) return /гран/.test(s) ? "F" : "D";
  if (/сумм\S* длин/.test(s)) return "E";
  if (/р[её]бр/.test(s)) return "a";
  return null;
}
const LEN_Q = new Set(["a", "D", "F", "E"]);
const QNAME = { a: "ребро", D: "диагональ куба", F: "диагональ грани", E: "сумма длин рёбер",
  S: "площадь поверхности", V: "объём" };

/* ============================================================
   3. Модель куба: величины — по вершинам, не по формулам
   Вершина i (0…7) — биты x, y, z: [i&1, i&2, i&4] · a.
   ============================================================ */
function cubeVerts(a) {
  const v = [];
  for (let i = 0; i < 8; i++) v.push([i & 1 ? a : 0, i & 2 ? a : 0, i & 4 ? a : 0]);
  return v;
}
const popcnt = x => (x & 1) + ((x >> 1) & 1) + ((x >> 2) & 1);
const KUHN = [[1, 2], [1, 4], [2, 1], [2, 4], [4, 1], [4, 2]];
function measure(a, q) {
  const v = cubeVerts(a);
  switch (q) {
    case "a": return dist(v[0], v[1]);
    case "D": return dist(v[0], v[7]);            /* противоположные вершины */
    case "F": return dist(v[0], v[3]);            /* противоположные вершины грани */
    case "E": {
      let s = 0;
      for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++)
        if (popcnt(i ^ j) === 1) s += dist(v[i], v[j]);
      return s;
    }
    case "S": {                                   /* 6 граней, площадь = ½|d₁ × d₂| */
      let s = 0;
      for (const b of [1, 2, 4]) for (const side of [0, b]) {
        const f = [0, 1, 2, 3, 4, 5, 6, 7].filter(i => (i & b) === side);
        s += norm(cross(sub(v[f[3]], v[f[0]]), sub(v[f[2]], v[f[1]]))) / 2;
      }
      return s;
    }
    case "V": {                                   /* разбиение Куна на 6 тетраэдров */
      let s = 0;
      for (const [p, q2] of KUHN) s += tetVol(v[0], v[p], v[p | q2], v[7]);
      return s;
    }
  }
  throw new Error("неизвестная величина " + q);
}
/* корень возрастающей на (0, ∞) функции: f(x) = target, бисекция */
function solveIncreasing(f, target, what) {
  let lo = 0, hi = 1;
  if (!(f(lo) < target)) throw new Error(what + ": положительного корня нет");
  while (f(hi) < target) { hi *= 2; if (hi > 1e15) throw new Error(what + ": корень не найден"); }
  for (let i = 0; i < 4000; i++) {
    const mid = lo + (hi - lo) / 2;
    if (mid <= lo || mid >= hi) break;
    if (f(mid) < target) lo = mid; else hi = mid;
  }
  return Math.abs(f(lo) - target) <= Math.abs(f(hi) - target) ? lo : hi;
}

/* ============================================================
   4. Модели задач: формулировка → числа → ответ
   solve(m, S) возвращает:
     ans       — пересчитанный ответ;
     ansIsLen  — ответ — длина (тогда отрезок «?» обязан иметь эту длину);
     edges     — рёбра кубов сцены по условию (по возрастанию) или null;
     ratios    — отношения между кубами сцены (без масштаба);
     solidVol  — объём тела построения на чертеже обязан равняться ans;
     cubes     — сколько кубов должно быть на чертеже;
     warns     — замечания.
   S (сцена) передаётся только моделям с пометкой «ПО РИСУНКУ».
   ============================================================ */
const rx = s => new RegExp("^" + s.replace(/\{NUMW\}/g, "(" + NUMW + ")")
  .replace(/\{NUM\}/g, "(" + NUM + ")") + "$", "i");
const EQ = "(?:равен|равна|равно|равны)";

const MODELS = [
  {
    name: "дано одна величина куба — найти другую",
    re: rx(String.raw`(Площадь поверхности|Объ[её]м|Диагональ|Ребро|Сумма длин всех р[её]бер) куба ${EQ}\s+{NUM}\.\s*Найдите\s+(?:длину\s+)?(?:его\s+)?(площадь\s+(?:его\s+)?поверхности|объ[её]м|диагонал[ьи](?:\s+грани)?|ребро|сумму длин (?:всех )?(?:его )?р[её]бер)(?:\s+куба)?\.`),
    solve(m) {
      const gq = qty(m[1]), gv = numOf(m[2]), fq = qty(m[3]);
      const a = solveIncreasing(x => measure(x, gq), gv, QNAME[gq]);
      return { ans: measure(a, fq), ansIsLen: LEN_Q.has(fq), edges: [a], cubes: 1,
        info: `${QNAME[gq]} ${fmt(gv)} → ребро ${fmt(a)} → ${QNAME[fq]}` };
    }
  },
  {
    name: "ребро увеличили на d — величина выросла на Δ; найти ребро",
    re: rx(String.raw`Если каждое ребро куба увеличить на {NUM}, то (?:его\s+)?(площадь (?:его )?поверхности|объ[её]м)(?: куба)? увеличится на {NUM}\.\s*Найдите ребро куба\.`),
    solve(m) {
      const d = numOf(m[1]), q = qty(m[2]), delta = numOf(m[3]);
      const a = solveIncreasing(x => measure(x + d, q) - measure(x, q), delta,
        `прирост величины «${QNAME[q]}»`);
      return { ans: a, ansIsLen: true, edges: [a, a + d], cubes: 2,
        info: `${QNAME[q]}(a+${fmt(d)}) − ${QNAME[q]}(a) = ${fmt(delta)} → a = ${fmt(a)}` };
    }
  },
  {
    name: "рёбра увеличили в k раз — во сколько раз выросла величина",
    re: rx(String.raw`Во сколько раз увеличится (площадь (?:его )?поверхности|объ[её]м|диагональ) куба, если (?:его |все его |все |каждое )?р[её]бр[оа]? (?:его )?увеличить в {NUMW} раза?\?`),
    solve(m) {
      const q = qty(m[1]), k = numOf(m[2]);
      /* ребро не дано: берём два разных — отношение не должно от него зависеть */
      const r1 = measure(k * 1, q) / measure(1, q), r2 = measure(k * 2.5, q) / measure(2.5, q);
      if (relDiff(r1, r2) > 1e-12) throw new Error("отношение зависит от ребра — модель неприменима");
      return { ans: r1, ansIsLen: false, edges: null, cubes: 2,
        ratios: [{ what: "отношение рёбер большего и меньшего куба", edgePow: 1, q: "a", want: k }],
        info: `${QNAME[q]}(${fmt(k)}·a) / ${QNAME[q]}(a)` };
    }
  },
  {
    name: "величина первого куба в m раз больше, чем у второго — отношение другой величины",
    re: rx(String.raw`(Объ[её]м|Площадь поверхности) первого куба в {NUMW} раза? больше (объ[её]ма|площади поверхности) второго куба\.\s*Во сколько раз (площадь поверхности|объ[её]м|ребро|диагональ) первого куба больше (площади поверхности|объ[её]ма|ребра|диагонали) второго куба\?`),
    solve(m) {
      const q1 = qty(m[1]), mv = numOf(m[2]), qf = qty(m[4]);
      if (q1 !== qty(m[3]) || qf !== qty(m[5])) throw new Error("в сравнении названы разные величины");
      const ratio = a2 => {
        const a1 = solveIncreasing(x => measure(x, q1), mv * measure(a2, q1), QNAME[q1]);
        return measure(a1, qf) / measure(a2, qf);
      };
      /* ребро второго куба не дано: два разных — ответ не должен от него зависеть */
      const r1 = ratio(1), r2 = ratio(1.7);
      if (relDiff(r1, r2) > 1e-9) throw new Error("отношение зависит от ребра — модель неприменима");
      return { ans: r1, ansIsLen: false, edges: null, cubes: 2,
        ratios: [{ what: `отношение величины «${QNAME[q1]}» большего и меньшего куба`, q: q1, want: mv }],
        info: `${QNAME[q1]}₁ = ${fmt(mv)}·${QNAME[q1]}₂ → ${QNAME[qf]}₁ / ${QNAME[qf]}₂` };
    }
  },
  {
    name: "призма, отсечённая плоскостью через середины двух рёбер",
    re: rx(String.raw`Ребро куба ${EQ} {NUM}\.\s*Найдите объ[её]м треугольной призмы, отсекаемой от него плоскостью, проходящей через середины двух р[её]бер, выходящих из одной вершины,? и параллельной третьему ребру, выходящему из этой же вершины\.`),
    solve(m) {
      const a = numOf(m[1]);
      const v = cubeVerts(a);
      /* вершина v0; два ребра из неё — к v1 (x) и v2 (y), третье — к v4 (z).
         Плоскость ∥ третьему ребру, поэтому все сечения z = const одинаковы:
         квадрат грани, отсечённый прямой через середины рёбер (Кавальери). */
      const mid = (p, q) => scl(add(p, q), 0.5);
      const M = mid(v[0], v[1]), N = mid(v[0], v[2]);
      const sq = [v[0], v[1], v[3], v[2]].map(p => [p[0], p[1]]);
      const nrm = [-(N[1] - M[1]), N[0] - M[0]];
      const side = p => nrm[0] * (p[0] - M[0]) + nrm[1] * (p[1] - M[1]);
      const clip = (poly, sgn) => {                 /* Сазерленд — Ходжман, одна прямая */
        const out = [];
        for (let i = 0; i < poly.length; i++) {
          const P = poly[i], Q = poly[(i + 1) % poly.length];
          const sp = sgn * side(P), sq2 = sgn * side(Q);
          if (sp >= 0) out.push(P);
          if ((sp > 0 && sq2 < 0) || (sp < 0 && sq2 > 0)) {
            const t = sp / (sp - sq2);
            out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]);
          }
        }
        return out.filter((p, i, arr) => {        /* убрать повторы вершин */
          const q = arr[(i + 1) % arr.length];
          return Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-12 * a;
        });
      };
      const shoelace = pg => Math.abs(pg.reduce((s, p, i) => {
        const q = pg[(i + 1) % pg.length];
        return s + p[0] * q[1] - q[0] * p[1];
      }, 0)) / 2;
      const pieces = [clip(sq, 1), clip(sq, -1)].filter(pg => pg.length >= 3);
      const tri = pieces.filter(pg => pg.length === 3);
      if (tri.length !== 1) throw new Error("сечение не даёт ровно одну треугольную призму");
      const h = dist(v[0], v[4]);
      return { ans: shoelace(tri[0]) * h, ansIsLen: false, edges: [a], cubes: 1, solidVol: true,
        info: `сечение грани — треугольник площади ${fmt(shoelace(tri[0]))}, высота ${fmt(h)}` };
    }
  },
  {
    name: "пирамида, вписанная в куб (ПО РИСУНКУ)",
    byPicture: true,
    re: rx(String.raw`Найдите объ[её]м пирамиды, вписанной в куб, если ребро куба ${EQ} {NUM}\.`),
    pyramidBody: true,
    solve(m, S) {
      const a = numOf(m[1]);
      /* ПО РИСУНКУ. Текст не говорит, какая пирамида вписана. Конфигурация
         (какая грань — основание, где вершина) берётся с чертежа: тело-пирамида
         сцены (линейка курса, с 24.09.2026), а если его нет — тело построения
         p.construct.solid (опубликованная линейка); в обоих случаях — в
         координатах куба сцены (0…1 вдоль трёх его рёбер). Ребро — только
         из текста условия. */
      const cfg = pyramidFromPicture(S);
      const P = t => scl(t, a);
      const base = cfg.base.map(P), apex = P(cfg.apex);
      const vol = at => tetVol(at, base[0], base[1], base[2]) + tetVol(at, base[0], base[2], base[3]);
      const V = vol(apex);
      /* объём не зависит от положения вершины на противоположной грани:
         переносим её в угол этой грани — ответ обязан сохраниться */
      const corner = cfg.apex.map((c, i) => (i === cfg.axis ? c : 0));
      if (relDiff(vol(P(corner)), V) > 1e-12) throw new Error("объём зависит от положения вершины");
      const warns = [], errs = [];
      if (cfg.fromBody) {
        /* пирамида нарисована телом сцены: тело построения (если есть) — та же пирамида */
        if (cfg.solidSame === false) errs.push("тело построения — не та пирамида, что нарисована на чертеже");
      } else
        warns.push("текст условия не задаёт пирамиду — конфигурация взята с чертежа " +
          "(основание — грань куба, вершина — на противоположной грани); на экране она видна " +
          "только после «Показать построение». Объём от положения вершины на грани не зависит (проверено).");
      if (!cfg.inscribed) warns.push("вершина пирамиды на чертеже не лежит на грани, противоположной основанию");
      return { ans: V, ansIsLen: false, edges: [a], cubes: 1, solidVol: true, warns, errs,
        info: `основание — грань, вершина (${cfg.apex.map(fmt).join("; ")}) в долях ребра` +
          (cfg.fromBody ? "; пирамида — тело сцены" : "; пирамида — из построения") };
    }
  }
];

/* ПО РИСУНКУ: пирамида в долях рёбер первого куба сцены — из тела-пирамиды
   сцены, а если его нет — из тела построения */
function pyramidFromPicture(S) {
  const rings = S.solid;
  let base, apexName, fromBody = false, solidSame = null;
  const fromRings = () => {
    if (!Array.isArray(rings) || rings.length < 4) throw new Error("на чертеже нет тела построения — пирамида не определена");
    const bases = rings.filter(r => r.length === 4);
    if (bases.length !== 1) throw new Error("в теле построения нет единственного четырёхугольного основания");
    const b = bases[0];
    const sides = rings.filter(r => r !== b);
    const apexes = [...new Set(sides.flat())].filter(n => !b.includes(n) && sides.every(r => r.includes(n)));
    if (apexes.length !== 1 || sides.some(r => r.length !== 3)) throw new Error("тело построения — не четырёхугольная пирамида");
    return { base: b, apex: apexes[0] };
  };
  if (S.pyramids.length > 1) throw new Error("на чертеже больше одной пирамиды");
  if (S.pyramids.length === 1) {
    ({ base, apex: apexName } = S.pyramids[0]);
    fromBody = true;
    if (Array.isArray(rings) && rings.length) {
      /* тело построения — те же точки, что у нарисованной пирамиды */
      const r = fromRings();
      const at = nms => nms.map(nm => S.pts[nm]);
      const same = (X, Y) => X.length === Y.length &&
        X.every(x => isPt(x) && Y.some(y => isPt(y) && dist(x, y) <= 1e-9 * (1 + norm(y))));
      solidSame = same(at(r.base), at(base)) && same(at([r.apex]), at([apexName]));
    }
  } else ({ base, apex: apexName } = fromRings());
  const c = S.cubes[0];
  if (!c) throw new Error("на чертеже нет куба");
  const toT = nm => {
    const d = sub(S.pts[nm], c.A);
    return [dot(d, c.u) / dot(c.u, c.u), dot(d, c.v) / dot(c.v, c.v), dot(d, c.w) / dot(c.w, c.w)];
  };
  const snap = x => (Math.abs(x) < 1e-9 ? 0 : Math.abs(x - 1) < 1e-9 ? 1 : x);
  const bt = base.map(toT).map(t => t.map(snap));
  const at = toT(apexName).map(snap);
  if (!bt.every(t => t.every(x => x === 0 || x === 1))) throw new Error("основание пирамиды — не вершины куба");
  const axis = [0, 1, 2].find(i => bt.every(t => t[i] === bt[0][i]));
  if (axis === undefined) throw new Error("основание пирамиды — не грань куба");
  const inscribed = at[axis] === 1 - bt[0][axis] && at.every(x => x >= -1e-9 && x <= 1 + 1e-9);
  return { base: bt, apex: at, axis, inscribed, fromBody, solidSame, apexName, baseNames: base };
}

/* тело сцены — четырёхугольная пирамида: вершина S<px>, основание A B C D<px>,
   рёбра от вершины ко всем точкам основания; O<px>, если есть, — центр основания */
function pyramidOf(g) {
  const pts = g.pts || {};
  const apex = Object.keys(pts).find(n => /^S/.test(n));
  if (!apex) return null;
  const px = apex.slice(1);
  const base = ["A", "B", "C", "D"].map(b => b + px);
  if (!base.every(b => isPt(pts[b]))) return null;
  const has = (x, y) => (g.edges || []).some(e => (e[0] === x && e[1] === y) || (e[0] === y && e[1] === x));
  if (!base.every(b => has(apex, b))) return null;
  return { apex, base, center: isPt(pts["O" + px]) ? "O" + px : null };
}

/* ============================================================
   5. Сцена задачи так, как её собирает тренажёр
   ============================================================ */
const BOX = ["A", "B", "C", "D", "A1", "B1", "C1", "D1"];
function findCube(pts) {
  const cands = Object.keys(pts).filter(n => n[0] === "A").map(n => n.slice(1));
  for (const px of cands) if (BOX.every(b => (b + px) in pts)) return px;
  return null;
}

function sceneOf(p, E, W) {
  const sd = sceneData(p);
  const gen = Array.from((sd && sd.gen) || []);
  if (!gen.length) { E("sceneData вернула пустую сцену"); return null; }
  /* конечность координат */
  gen.forEach((g, gi) => {
    for (const [nm, pt] of Object.entries(g.pts || {}))
      if (!isPt(pt)) E(`тело ${gi + 1}: точка ${nm} = [${Array.isArray(pt) ? pt.map(String).join(", ") : String(pt)}] — не конечные координаты`);
  });
  /* тела-кубы (и пирамида, вписанная в куб, — у модели «ПО РИСУНКУ») */
  const cubes = [], pyramids = [];
  gen.forEach((g, gi) => {
    const pts = g.pts || {};
    const px = findCube(pts);
    if (px === null) {
      const pyr = pyramidOf(g);
      if (!pyr) { E(`тело ${gi + 1} сцены — не параллелепипед ABCDA1B1C1D1 и не пирамида SABCD`); return; }
      if (pyr.center) {
        const c = scl(pyr.base.reduce((s, b) => add(s, pts[b]), [0, 0, 0]), 1 / 4);
        if (dist(pts[pyr.center], c) > TOL_SHAPE * (1 + norm(c))) E(`тело ${gi + 1} (пирамида): точка ${pyr.center} не в центре основания`);
      }
      pyramids.push(Object.assign({ gi }, pyr));
      return;
    }
    const P = b => pts[b + px];
    if (!BOX.every(b => isPt(P(b)))) return;
    const A = P("A"), u = sub(P("B"), A), v = sub(P("D"), A), w = sub(P("A1"), A);
    const e = norm(u);
    const bad = [];
    if (relDiff(norm(v), e) > TOL_SHAPE || relDiff(norm(w), e) > TOL_SHAPE)
      bad.push(`рёбра AB, AD, AA1 = ${fmt(e)}, ${fmt(norm(v))}, ${fmt(norm(w))}`);
    for (const [x, y, nm] of [[u, v, "AB·AD"], [u, w, "AB·AA1"], [v, w, "AD·AA1"]])
      if (Math.abs(dot(x, y)) > TOL_SHAPE * e * e) bad.push(`${nm} = ${fmt(dot(x, y))} ≠ 0`);
    const want = { C: add(A, add(u, v)), B1: add(A, add(u, w)), D1: add(A, add(v, w)), C1: add(A, add(u, add(v, w))) };
    for (const [b, q] of Object.entries(want))
      if (dist(P(b), q) > TOL_SHAPE * e) bad.push(`вершина ${b}${px} не на своём месте`);
    if (bad.length) E(`тело ${gi + 1} сцены — не куб: ${bad.join("; ")}`);
    cubes.push({ gi, px, A, u, v, w, edge: e, vol: Math.abs(det3(u, v, w)), ghost: !!g.ghost,
      box: BOX.map(b => P(b)) });
  });
  /* общий словарь точек, как в trainer.js: тела по порядку, последнее выигрывает */
  const pts = {}, owner = {}, clash = {};
  let ext = 0;
  gen.forEach(g => Object.values(g.pts || {}).forEach(pt => { if (isPt(pt)) ext = Math.max(ext, norm(pt)); }));
  gen.forEach((g, gi) => {
    for (const [nm, pt] of Object.entries(g.pts || {})) {
      if (nm in pts && isPt(pt) && dist(pts[nm], pt) > 1e-9 * Math.max(ext, 1)) {
        const key = `${owner[nm] + 1}→${gi + 1}`;
        (clash[key] = clash[key] || []).push(nm);
      }
      pts[nm] = pt; owner[nm] = gi;
    }
  });
  for (const [key, names] of Object.entries(clash)) {
    const [g1, g2] = key.split("→");
    W(`имена ${names.length} точек (${names.slice(0, 8).join(", ")}${names.length > 8 ? ", …" : ""}) ` +
      `у тел ${g1} и ${g2} сцены совпадают при разных координатах; тренажёр собирает точки ` +
      `в один словарь (последнее тело выигрывает), поэтому рёбра, грани и буквы тела ${g1} ` +
      `рисуются на месте тела ${g2} — на экране виден один куб вместо двух`);
  }
  /* точки построения — так же, как resolvePt в trainer.js */
  const cst = p.construct || {};
  const fb = sd.firstBox || { a: 1, b: 1, c: 1 };
  for (const [nm, spec] of Object.entries(cst.points || {})) {
    if (Array.isArray(spec) && spec[0] === "mid") {
      const a = pts[spec[1]], b = pts[spec[2]];
      if (!isPt(a) || !isPt(b)) { E(`точка построения ${nm}: нет точек ${spec[1]}, ${spec[2]}`); continue; }
      pts[nm] = scl(add(a, b), 0.5);
    } else if (Array.isArray(spec) && spec.length >= 3) {
      pts[nm] = [spec[0] * fb.a, spec[1] * fb.b, spec[2] * fb.c];
    } else E(`точка построения ${nm}: непонятное задание ${JSON.stringify(spec)}`);
  }
  /* пересечение тел: сравнение двух кубов должно быть видно раздельно */
  for (let i = 0; i < cubes.length; i++) for (let j = i + 1; j < cubes.length; j++) {
    const bb = c => [0, 1, 2].map(k => [Math.min(...c.box.map(q => q[k])), Math.max(...c.box.map(q => q[k]))]);
    const b1 = bb(cubes[i]), b2 = bb(cubes[j]);
    if ([0, 1, 2].every(k => Math.min(b1[k][1], b2[k][1]) - Math.max(b1[k][0], b2[k][0]) > 1e-9))
      W(`кубы ${cubes[i].gi + 1} и ${cubes[j].gi + 1} сцены пересекаются`);
  }
  return { gen, cubes, pyramids, pts, solid: cst.solid, segs: cst.segments || [] };
}

/* поле unit задачи: длина в единицах условия на единицу сцены — панель
   измерений тренажёра показывает fmtLen(длина на сцене · unit); нет поля — 1 */
function unitOf(p, E) {
  if (p.unit === undefined) return { u: 1, set: false };
  if (!(typeof p.unit === "number" && Number.isFinite(p.unit) && p.unit > 0)) {
    E(`unit = ${String(p.unit)} — не положительное число`);
    return { u: 1, set: false };
  }
  return { u: p.unit, set: true };
}

/* объём выпуклого тела построения по его граням (кольцам точек) */
function solidVolume(rings, pts) {
  const cnt = {};
  for (const r of rings) for (let i = 0; i < r.length; i++) {
    const k = [r[i], r[(i + 1) % r.length]].sort().join("|");
    cnt[k] = (cnt[k] || 0) + 1;
  }
  const open = Object.entries(cnt).filter(([, c]) => c !== 2).map(([k]) => k.replace("|", ""));
  if (open.length) return { err: `тело построения не замкнуто (рёбра ${open.join(", ")})` };
  const names = [...new Set(rings.flat())];
  if (!names.every(n => isPt(pts[n]))) return { err: "в теле построения есть несуществующие точки" };
  const G = scl(names.reduce((s, n) => add(s, pts[n]), [0, 0, 0]), 1 / names.length);
  const ext = Math.max(...names.map(n => dist(pts[n], G)));
  let V = 0;
  for (const r of rings) {
    const P = r.map(n => sub(pts[n], G));
    let N = [0, 0, 0];
    for (let i = 0; i < P.length; i++) N = add(N, cross(P[i], P[(i + 1) % P.length]));
    N = scl(N, 0.5);
    const area = norm(N);
    if (area < 1e-12 * ext * ext) return { err: `вырожденная грань ${r.join("")}` };
    const n1 = scl(N, 1 / area);
    const c = scl(P.reduce((s, q) => add(s, q), [0, 0, 0]), 1 / P.length);
    if (P.some(q => Math.abs(dot(sub(q, c), n1)) > 1e-9 * ext)) return { err: `грань ${r.join("")} не плоская` };
    const h = dot(c, n1);                       /* расстояние от G до плоскости грани, со знаком */
    if (names.some(n => Math.sign(h) * dot(sub(sub(pts[n], G), c), n1) > 1e-9 * ext))
      return { err: `тело построения невыпукло у грани ${r.join("")}` };
    V += area * Math.abs(h) / 3;
  }
  return { V };
}

/* размеры тела из задания сцены (scene.prims / scene.bodies / dims) */
function specDims(p, gi) {
  const sc = p.scene || {};
  const list = sc.prims || sc.bodies;
  if (Array.isArray(list)) {
    const s = list[gi];
    if (s && s.kind === "box") return [s.a, s.b, s.c != null ? s.c : s.h];
    return null;
  }
  if (gi === 0 && Array.isArray(p.dims)) return p.dims;
  return null;
}

function parseStored(s) {
  const t = String(s == null ? "" : s).trim();
  if (!/^-?\d+(?:[.,]\d+)?$/.test(t)) return null;
  return Number(t.replace(",", "."));
}

/* ============================================================
   6. Проверка одной задачи
   ============================================================ */
function verifyOne(p, errs, warns, answerMismatch) {
  const id = String(p.id);
  const E = msg => errs.push(`${id}: ${msg}`);
  const W = msg => warns.push(`${id}: ${msg}`);
  const cond = String(p.cond || "").replace(/\s+/g, " ").trim();

  const hits = MODELS.map(M => ({ M, m: cond.match(M.re) })).filter(h => h.m);
  if (!hits.length) { E(`формулировка не распознана ни одной моделью верификатора: «${cond}»`); return null; }
  if (hits.length > 1) { E(`формулировку распознают несколько моделей: ${hits.map(h => h.M.name).join("; ")}`); return null; }
  const { M, m } = hits[0];

  const S = sceneOf(p, E, STRICT ? E : W);   /* третий аргумент — дефекты видимости */
  if (!S) return null;

  /* --- ответ --- */
  const res = M.solve(m, S);
  const stored = parseStored(p.ans);
  if (stored === null) E(`ответ банка «${p.ans}» — не число`);
  else if (!(relDiff(res.ans, stored) <= TOL_ANS)) {
    E(`ответ: в банке ${p.ans}, пересчёт по условию${M.byPicture ? " и рисунку" : ""} ${fmt(res.ans)} (${M.name}: ${res.info})`);
    answerMismatch.push({ id, stored: String(p.ans), computed: fmt(res.ans), note: `${M.name}: ${res.info}` });
  }
  (res.warns || []).forEach(W);
  (res.errs || []).forEach(E);
  if (S.pyramids.length && !M.pyramidBody) E("на чертеже пирамида, а модель задачи её не предполагает");
  /* неподписанный отрезок построения у пирамиды — её высота: от вершины
     до основания перпендикуляра на плоскость основания */
  if (M.pyramidBody && S.pyramids.length === 1) {
    const pyr = S.pyramids[0], Ap = S.pts[pyr.apex], B0 = S.pts[pyr.base[0]];
    const nrm = cross(sub(S.pts[pyr.base[1]], B0), sub(S.pts[pyr.base[3]], B0));
    const n1 = scl(nrm, 1 / norm(nrm));
    const foot = sub(Ap, scl(n1, dot(sub(Ap, B0), n1)));
    for (const sg of S.segs) {
      if (sg[2] != null) continue;
      const ends = [S.pts[sg[0]], S.pts[sg[1]]];
      if (!ends.every(isPt)) { E(`отрезок построения ${sg[0]}${sg[1]}: нет точки на чертеже`); continue; }
      const ok = (dist(ends[0], Ap) < 1e-9 * (1 + norm(Ap)) && dist(ends[1], foot) < 1e-9 * (1 + norm(foot))) ||
        (dist(ends[1], Ap) < 1e-9 * (1 + norm(Ap)) && dist(ends[0], foot) < 1e-9 * (1 + norm(foot)));
      if (!ok) E(`отрезок построения ${sg[0]}${sg[1]} — не высота пирамиды`);
    }
  }

  /* --- чертёж: сколько кубов --- */
  const cubes = S.cubes;
  if (cubes.length < res.cubes)
    E(`в условии кубов ${res.cubes}, на чертеже ${cubes.length}`);
  const sorted = [...cubes].sort((x, y) => x.edge - y.edge);

  /* --- факты для единого масштаба: [что, на сцене, по условию, степень] --- */
  const facts = [];
  if (res.edges && sorted.length === res.edges.length)
    res.edges.forEach((e, i) => facts.push({ what: `ребро куба ${sorted[i].gi + 1} сцены`, scene: sorted[i].edge, want: e, pow: 1, src: "условие" }));
  else if (res.edges && sorted.length)
    facts.push({ what: `ребро куба ${sorted[0].gi + 1} сцены`, scene: sorted[0].edge, want: res.edges[0], pow: 1, src: "условие" });

  /* подписи: labels и подписанные отрезки построения */
  const cn = condNumbers(cond);
  const labelled = [
    ...(p.labels || []).map(l => ["подпись", l]),
    ...((p.construct && p.construct.segments) || []).filter(s => s.length > 2 && s[2] != null).map(s => ["подпись построения", s])
  ];
  for (const [src, [a, b, t]] of labelled) {
    if (!isPt(S.pts[a]) || !isPt(S.pts[b])) { E(`${src} ${a}${b} «${t}»: нет такой точки на чертеже`); continue; }
    const L = dist(S.pts[a], S.pts[b]);
    if (t === "?") {
      if (res.ansIsLen) facts.push({ what: `искомый отрезок ${a}${b} «?»`, scene: L, want: res.ans, pow: 1, src: "ответ по условию" });
      else W(`${src} ${a}${b} «?», а искомое — не длина: подпись указывает не на то`);
      continue;
    }
    const val = labelNum(t);
    if (val === null) continue;
    facts.push({ what: `${src} ${a}${b} = «${t}»`, scene: L, want: val, pow: 1, src: "подпись" });
    if (!cn.some(x => relDiff(x, val) < 1e-12)) W(`${src} ${a}${b} = «${t}»: такого числа нет в условии (данные только на рисунке)`);
  }
  /* подписи-размеры из координат (coordLabels) */
  S.gen.forEach((g, gi) => (g.coordLabels || []).forEach(cl => {
    const val = labelNum(cl && cl.t);
    if (val === null || !isPt(cl.p) || !isPt(cl.q) || dist(cl.p, cl.q) < 1e-12) return;
    facts.push({ what: `размерная подпись «${cl.t}» тела ${gi + 1}`, scene: dist(cl.p, cl.q), want: val, pow: 1, src: "подпись" });
  }));
  /* тело построения: его объём на чертеже — искомый */
  if (res.solidVol) {
    const sv = S.solid ? solidVolume(S.solid, S.pts) : { err: "тела построения нет" };
    if (sv.err) E(`объём тела построения не проверен: ${sv.err}`);
    else facts.push({ what: "объём тела построения на чертеже", scene: sv.V, want: res.ans, pow: 3, src: "ответ по условию" });
  }
  /* размеры из задания сцены (dims): куб — a = b = c, и тот же масштаб */
  for (const c of cubes) {
    const d = specDims(p, c.gi);
    if (!d) continue;
    if (!d.every(Number.isFinite)) { E(`задание тела ${c.gi + 1}: размеры ${JSON.stringify(d)} не числа`); continue; }
    if (relDiff(d[0], d[1]) > TOL_SHAPE || relDiff(d[0], d[2]) > TOL_SHAPE)
      E(`задание тела ${c.gi + 1}: размеры ${d.map(fmt).join(" × ")} — не куб`);
    facts.push({ what: `ребро куба ${c.gi + 1} по заданию сцены (dims)`, scene: c.edge, want: d[0], pow: 1, src: "dims" });
  }

  /* единый масштаб */
  let k0 = null, ref = null;
  const kOf = f => Math.pow(f.scene / f.want, 1 / f.pow);
  for (const f of facts) {
    if (!(f.want > 0) || !(f.scene > 0)) { E(`${f.what}: на сцене ${fmt(f.scene)}, по данным ${fmt(f.want)} — нулевая или неположительная величина`); continue; }
    const k = kOf(f);
    if (k0 === null) { k0 = k; ref = f; continue; }
    if (relDiff(k, k0) > TOL_GEO) {
      const unit = f.pow === 3 ? " (объём)" : "";
      E(`чертёж не в масштабе: ${f.what}${unit} на сцене ${fmt(f.scene)}, по данным (${f.src}) ` +
        `${fmt(f.want)} → масштаб ${fmt(k)}; а ${ref.what}: на сцене ${fmt(ref.scene)}, ` +
        `по данным (${ref.src}) ${fmt(ref.want)} → масштаб ${fmt(k0)}`);
    }
  }
  /* масштаб k = сцена / условие; панель измерений показывает длину сцены · unit,
     поэтому при k ≠ 1 нужен unit = 1/k */
  const U = unitOf(p, E);
  if (U.set && k0 === null) E(`задан unit = ${fmt(U.u)}, а масштаб сцены условием не задан — сверить не с чем`);
  else if (U.set && relDiff(k0 * U.u, 1) > TOL_GEO)
    E(`unit = ${fmt(U.u)} не согласован с масштабом сцены k = ${fmt(k0)} (нужно 1/k = ${fmt(1 / k0)}): ` +
      `панель измерений покажет длины, умноженные на ${fmt(k0 * U.u)}`);
  else if (!U.set && k0 !== null && relDiff(k0, 1) > 1e-9)
    W(`сцена в масштабе ${fmt(k0)} к единицам условия (по: ${ref.what}), а unit не задан — после «Показать ответ» ` +
      `панель измерений покажет длины сцены (нужно unit = ${fmt(1 / k0)})`);

  /* отношения двух кубов — без масштаба */
  for (const r of res.ratios || []) {
    if (sorted.length < 2) { E(`${r.what}: на чертеже нет двух кубов`); continue; }
    const big = sorted[sorted.length - 1], small = sorted[0];
    const got = r.q === "V" ? big.vol / small.vol : measure(big.edge, r.q) / measure(small.edge, r.q);
    if (relDiff(got, r.want) > TOL_GEO)
      E(`чертёж не соответствует условию: ${r.what} на сцене ${fmt(got)}, по условию ${fmt(r.want)}`);
  }

  if (VERBOSE)
    console.log(`  ${id.padEnd(7)} ответ ${String(p.ans).padEnd(4)} пересчёт ${fmt(res.ans).padEnd(6)} ` +
      `[${M.name}] ${res.info}; кубов на сцене ${cubes.length}; ` +
      `сверено величин ${facts.length}, отношений ${(res.ratios || []).length}` +
      (k0 !== null ? `; масштаб ${fmt(k0)}` : ""));
  return true;
}

/* ============================================================
   7. Прогон
   ============================================================ */
function main() {
  let api;
  try { api = loadData(DATA_JS); }
  catch (e) {
    console.log(`Не удалось загрузить ${DATA_JS}: ${e.message}`);
    console.log("Куб (старые): задач 0, расхождений 1");
    process.exit(1);
  }
  ({ PROBLEMS, sceneData } = api);
  const errs = [], warns = [], answerMismatch = [];
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
  for (const p of legacy) {
    try { verifyOne(p, errs, warns, answerMismatch); }
    catch (e) { errs.push(`${p.id}: проверка не выполнена: ${e.message}`); }
  }
  warns.forEach(w => console.log("предупреждение " + w));
  errs.forEach(e => console.log("РАСХОЖДЕНИЕ " + e));
  console.log(`Куб (старые): задач ${legacy.length}, расхождений ${errs.length}`);
  if (warns.length) console.log(`(предупреждений ${warns.length} — на код выхода не влияют)`);
  if (errs.length) process.exit(1);
  console.log("LEGACY_KUB_VERIFY_OK");
}
let PROBLEMS, sceneData;
main();
