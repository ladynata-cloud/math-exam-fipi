/* Независимый верификатор СТАРЫХ задач стерео-банка, тема «Цилиндр».

   Старые задачи — 9 задач с числовыми id (номера Решу ЕГЭ). Под этими id
   у учеников записан прогресс (stereo3.status, stereo3.last.<тема>),
   поэтому здесь ничего не правится — только проверяется.

   Что проверяется для каждой задачи
   1. Ответ. Модель задачи распознаётся по формулировке условия p.cond
      (шаблон на всё условие целиком: изменённый текст не пройдёт молча),
      числа берутся регулярками из того же текста, ответ пересчитывается
      своим кодом, а не формулой из решения. Величины цилиндра считаются
      численно — по вершинам вписанной правильной призмы (метод Архимеда):
        • длина окружности — периметр вписанного многоугольника;
        • площадь основания — сумма треугольников (векторные произведения);
        • боковая поверхность — сумма прямоугольных граней призмы;
        • объём — сумма тетраэдров, на которые режется призма;
        • осевое сечение — прямоугольник через диаметр и образующую;
      затем экстраполяция Ричардсона по числу сторон (2048 и 4096),
      погрешность ~1e-13. Формулы πr², 2πrh, πr²h нигде не используются;
      π участвует только там, где условие само просит «делённую на π».
      Обратные задачи (по объёму найти радиус и т. п.) решаются бисекцией.
      Если ответ не должен зависеть от неданного размера (сравнение двух
      цилиндров, переливание, погружение без радиуса сосуда), он считается
      при двух разных значениях этого размера и обязан совпасть.
      p.ans участвует только в итоговой сверке; p.sol и p.hint не читаются.
      Данных «только на рисунке» в этих 9 задачах нет: всё, что нужно для
      ответа, есть в тексте; подписи чертежа идут только в сверку геометрии.
   2. Чертёж — выход sceneData(p), как его собирает тренажёр:
      • каждое тело сцены — действительно цилиндр: вертикальная ось OO1,
        точки P, P1, Q, Q1 на своих местах, боковая поверхность и окружности
        оснований совпадают с точками, вода стоит на дне и не выше края;
      • сцена совпадает с заданием scene.prims (r, h, уровень fill·h);
      • каждая числовая подпись (labels и подписанные отрезки построения),
        искомый отрезок «?», величины из условия, измеренные на нарисованном
        цилиндре (длина окружности, площадь осевого сечения, объём воды,
        уровень воды…), и искомая величина сводятся к ОДНОМУ масштабу
        на задачу (допуск 1e-6); площадь — через √, объём — через ∛;
      • отношения двух тел (в 2 раза шире, втрое выше…) — без масштаба;
      • закрашенное осевое сечение — действительно осевое, площадь по условию;
      • поднявшаяся после погружения вода помещается в нарисованный сосуд.
      Предупреждения (не ошибки): величина, которой нет в условии и которая
      не подписана, но выводится из данных (радиус сосуда по объёму воды),
      нарисована не в масштабе; сцена в масштабе k ≠ 1 без поля unit —
      после «Показать ответ» панель измерений (displayLen →
      fmtLen(scaleFn · unit)) показала бы длины сцены, не согласованные
      с условием; совпадающие имена точек у разных тел, пересекающиеся тела.
      Расхождение: поле unit задачи (длина условия на единицу сцены) не равно 1/k —
      панель измерений показала бы длины не в единицах условия.

   Запуск (голый Node, без зависимостей):
     node verify-legacy-cil.js                  — линейка ../../trainers/stereo
     STEREO_ROOT=<папка линейки> node verify-legacy-cil.js
     ключ -v — по строке на каждую задачу;
     ключ --strict — предупреждения о чертеже тоже считаются расхождениями.
   Берутся задачи PROBLEMS с id из одних цифр и topic === "Цилиндр" (ровно 9);
   новые задачи (id вида cil-01) пропускаются — их проверяет verify-cil.js.
   Код 0 и маркер LEGACY_CIL_VERIFY_OK — только при нуле расхождений. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const STEREO_ROOT = process.env.STEREO_ROOT ||
  path.resolve(__dirname, "..", "..", "trainers", "stereo");
const DATA_JS = path.join(STEREO_ROOT, "js", "data.js");
const TOPIC = "Цилиндр";
const EXPECTED_COUNT = 9;
const TOL_ANS = 1e-9;    /* ответ: относительный допуск */
const TOL_GEO = 1e-6;    /* единый масштаб чертежа: относительный допуск */
const TOL_SHAPE = 1e-9;  /* форма тела: точки на своих местах */
const TOL_FREE = 1e-9;   /* ответ не зависит от неданного размера */
const VERBOSE = process.argv.includes("-v") || process.argv.includes("--verbose");
const STRICT = process.argv.includes("--strict");

/* ============================================================
   0. Загрузка data.js в песочницу vm
   Копия идеи _load.js (чужие файлы не подключаются): data.js —
   браузерный скрипт, THREE и DOM нужны ему только при отрисовке,
   для загрузки хватает заглушек. Работает и со старым data.js
   линейки (PROBLEMS и sceneData — глобальные const/function, без
   module.exports), и с объединённым (есть блок module.exports;
   sceneData там — диспетчер, который для старых задач вызывает
   легаси-генератор sceneDataLegacy).
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
/* как тренажёр подписывает длину отрезка после «Показать ответ» (fmtLen) */
function shownLen(x) {
  /* как fmtLen движка (engine.js): целое; x = √m (m ≤ 1e5, допуск по длине
     1e-9·max(1, x)) → корень в школьной записи (8 → 2√2); иначе до сотых */
  const r = Math.round(x);
  if (Math.abs(x - r) <= 1e-9 * Math.max(1, x)) return String(r);
  const m = Math.round(x * x);
  if (m > 0 && m <= 1e5 && Math.abs(Math.sqrt(m) - x) <= 1e-9 * Math.max(1, x)) {
    let out = 1, rad = m;
    for (let f = 2; f * f <= rad; f++) while (rad % (f * f) === 0) { rad /= f * f; out *= f; }
    return rad === 1 ? String(out) : (out > 1 ? String(out) : "") + "√" + rad;
  }
  const c = Math.round(x * 100 + 1e-9);
  return (String(Math.floor(c / 100)) + "," + String(c % 100).padStart(2, "0")).replace(/0+$/, "").replace(/,$/, "");
}
/* поле unit задачи: длина в единицах условия на единицу сцены — панель
   измерений тренажёра показывает fmtLen(длина на сцене · unit); нет поля — 1.
   Масштаб k здесь — «сцена / условие», поэтому верно unit = 1/k. */
function unitOf(p, E) {
  if (p.unit === undefined) return { u: 1, set: false };
  if (!(typeof p.unit === "number" && Number.isFinite(p.unit) && p.unit > 0)) {
    E(`unit = ${String(p.unit)} — не положительное число`);
    return { u: 1, set: false };
  }
  return { u: p.unit, set: true };
}
/* сверка unit с масштабом k (сцена / условие); true — масштаб не 1 и unit не задан */
function unitCheck(p, k0, E) {
  const U = unitOf(p, E);
  if (U.set && k0 === null) { E(`задан unit = ${fmt(U.u)}, а масштаб сцены условием не задан — сверить не с чем`); return false; }
  if (U.set && relDiff(k0 * U.u, 1) > TOL_GEO) {
    E(`unit = ${fmt(U.u)} не согласован с масштабом сцены k = ${fmt(k0)} (нужно 1/k = ${fmt(1 / k0)}): ` +
      `панель измерений покажет длины, умноженные на ${fmt(k0 * U.u)}`);
    return false;
  }
  return !U.set && k0 !== null && relDiff(k0, 1) > 1e-9;
}


/* ============================================================
   2. Числа из текста условия
   ============================================================ */
const WORDS = { "два": 2, "две": 2, "три": 3, "четыре": 4, "пять": 5, "шесть": 6,
  "семь": 7, "восемь": 8, "девять": 9, "десять": 10, "полтора": 1.5, "полторы": 1.5 };
const ADVERBS = { "вдвое": 2, "втрое": 3, "вчетверо": 4, "впятеро": 5 };
/* число условия: 18 · 0,5 · √12 · 24√3 */
const NUM = String.raw`(?:\d+(?:,\d+)?)?\s*√\s*\d+(?:,\d+)?|\d+(?:,\d+)?`;
/* то же или число словом («в три раза», «в полтора раза») */
const NUMW = NUM + "|" + Object.keys(WORDS).join("|");
/* кратность: «в 2 раза», «в полтора раза», «вдвое» */
const TIMES = "(?:" + Object.keys(ADVERBS).join("|") + "|в (?:" + NUMW + ") раза?)";
const dec = s => Number(String(s).replace(",", "."));

function numOf(s) {
  const t = String(s).replace(/\s+/g, "").toLowerCase();
  if (t in WORDS) return WORDS[t];
  if (t in ADVERBS) return ADVERBS[t];
  const m = t.match(/^(\d+(?:,\d+)?)?√(\d+(?:,\d+)?)$/);
  if (m) return (m[1] ? dec(m[1]) : 1) * Math.sqrt(dec(m[2]));
  if (/^\d+(?:,\d+)?$/.test(t)) return dec(t);
  throw new Error("не число: «" + s + "»");
}
function timesOf(s) {
  const t = String(s).trim().toLowerCase();
  if (t in ADVERBS) return ADVERBS[t];
  const m = t.match(/^в\s+(.+?)\s+раза?$/);
  if (!m) throw new Error("не кратность: «" + s + "»");
  return numOf(m[1]);
}
/* все числа текста — для сверки подписей чертежа с условием */
function condNumbers(cond) {
  const out = [];
  const words = [...Object.keys(WORDS), ...Object.keys(ADVERBS)].join("|");
  const re = new RegExp("(?<![A-Za-z0-9])(?:" + NUM + ")|(?<![а-яё])(?:" + words + ")(?![а-яё])", "gi");
  for (const m of cond.match(re) || []) out.push(numOf(m));
  return out;
}
/* подпись чертежа: «6», «√12», «2√3», «1,5»; остальное (x, 90°, ?) — не число */
function labelNum(t) {
  const s = String(t).replace(/\s+/g, "");
  if (!/^(?:\d+(?:,\d+)?)?√\d+(?:,\d+)?$|^\d+(?:,\d+)?$/.test(s)) return null;
  return numOf(s);
}

/* какая величина цилиндра названа в словах */
const QNAME = { r: "радиус основания", d: "диаметр основания", h: "высота",
  C: "длина окружности основания", Sb: "площадь основания", Slat: "площадь боковой поверхности",
  Sfull: "площадь полной поверхности", Sax: "площадь осевого сечения", V: "объём" };
const QPOW = { r: 1, d: 1, h: 1, C: 1, Sb: 2, Slat: 2, Sfull: 2, Sax: 2, V: 3 };
const QGEN = { r: "радиусов", d: "диаметров", h: "высот" };
const ONLY_R = new Set(["r", "d", "C", "Sb"]);     /* зависят только от радиуса */
const LEN_Q = new Set(["r", "d", "h", "C"]);
function qOf(s) {
  s = String(s).toLowerCase().trim();
  if (/осев/.test(s)) return "Sax";
  if (/боков/.test(s)) return "Slat";
  if (/полн/.test(s)) return "Sfull";
  if (/^площадь основания$/.test(s)) return "Sb";
  if (/окружност/.test(s)) return "C";
  if (/^радиус/.test(s)) return "r";
  if (/^диаметр/.test(s)) return "d";
  if (/^высот/.test(s)) return "h";
  if (/^объ[её]м$/.test(s)) return "V";
  return null;
}

/* ============================================================
   3. Модель цилиндра: величины — по вершинам вписанной призмы
   Нижнее основание — правильный n-угольник B_i на окружности радиуса r
   в плоскости z = 0, верхнее — T_i = B_i + (0, 0, h). Каждая величина
   считается на призме при n = 2048 и n = 4096, затем экстраполяция
   Ричардсона: у вписанного многоугольника погрешность периметра и
   площади — ряд по 1/n², первый член уходит.
   ============================================================ */
const N_POLY = 2048;
const RICHARDSON = new Set(["C", "Sb", "Slat", "Sfull", "V"]);

/* сумма Ноймайера — тысячи слагаемых не копят ошибку округления */
function nsum(n, f) {
  let s = 0, c = 0;
  for (let i = 0; i < n; i++) {
    const x = f(i), t = s + x;
    c += Math.abs(s) >= Math.abs(x) ? (s - t) + x : (x - t) + s;
    s = t;
  }
  return s + c;
}
/* треугольная призма ABC–A'B'C' = три тетраэдра (Евклид, XII.7) */
const prismVol = (A, B, C, A1, B1, C1) =>
  tetVol(A, B, C, C1) + tetVol(A, B, B1, C1) + tetVol(A, A1, B1, C1);

function polyMeasure(r, h, q, n) {
  const ring = [];
  for (let i = 0; i < n; i++) {
    const t = 2 * Math.PI * i / n;            /* только расстановка вершин по кругу */
    ring.push([r * Math.cos(t), r * Math.sin(t), 0]);
  }
  const up = [0, 0, h];
  const B = i => ring[i % n];
  const T = i => add(ring[i % n], up);
  const O = [0, 0, 0], O1 = up;
  switch (q) {
    case "r": return dist(O, B(0));
    case "d": return dist(B(0), B(n / 2));
    case "h": return dist(O, O1);
    case "C": return nsum(n, i => dist(B(i), B(i + 1)));
    case "Sb": return nsum(n, i => norm(cross(sub(B(i), O), sub(B(i + 1), O))) / 2);
    case "Slat": return nsum(n, i => norm(cross(sub(B(i + 1), B(i)), sub(T(i), B(i)))));
    case "Sfull": return nsum(n, i => norm(cross(sub(B(i + 1), B(i)), sub(T(i), B(i))))
      + norm(cross(sub(B(i), O), sub(B(i + 1), O))) / 2
      + norm(cross(sub(T(i), O1), sub(T(i + 1), O1))) / 2);
    case "Sax": return norm(cross(sub(B(n / 2), B(0)), sub(T(0), B(0))));
    case "V": return nsum(n, i => prismVol(O, B(i), B(i + 1), O1, T(i), T(i + 1)));
  }
  throw new Error("неизвестная величина " + q);
}
function measure(r, h, q) {
  if (!(q in QNAME)) throw new Error("неизвестная величина " + q);
  if (!RICHARDSON.has(q)) return polyMeasure(r, h, q, N_POLY);
  const a = polyMeasure(r, h, q, N_POLY), b = polyMeasure(r, h, q, 2 * N_POLY);
  return (4 * b - a) / 3;
}
/* корень возрастающей на (0, ∞) функции: f(x) = target, бисекция */
function solveIncreasing(f, target, what) {
  let lo = 0, hi = 1;
  if (!(target > 0)) throw new Error(what + ": данное не положительно");
  if (!(f(lo) < target)) throw new Error(what + ": положительного корня нет");
  while (f(hi) < target) { hi *= 2; if (hi > 1e15) throw new Error(what + ": корень не найден"); }
  for (let i = 0; i < 4000; i++) {
    const mid = lo + (hi - lo) / 2;
    if (mid <= lo || mid >= hi) break;
    if (f(mid) < target) lo = mid; else hi = mid;
  }
  return Math.abs(f(lo) - target) <= Math.abs(f(hi) - target) ? lo : hi;
}
/* ответ, который не должен зависеть от неданного размера t */
function invariant(fn, what) {
  const a1 = fn(1), a2 = fn(2.7);
  if (!(relDiff(a1, a2) <= TOL_FREE))
    throw new Error(`${what}: ответ зависит от неданного размера (${fmt(a1)} и ${fmt(a2)}) — модель неприменима`);
  return a1;
}
/* проверка самой численной модели (не ответов): единичный цилиндр
   против Math.PI — если экстраполяция сломалась, дальше верить нельзя */
function modelSelfCheck() {
  const bad = [];
  const want = { C: 2 * Math.PI, Sb: Math.PI, Slat: 2 * Math.PI, Sfull: 4 * Math.PI, V: Math.PI, Sax: 2, d: 2 };
  for (const [q, w] of Object.entries(want)) {
    const got = measure(1, 1, q);
    if (!(relDiff(got, w) < 1e-11)) bad.push(`${QNAME[q]} единичного цилиндра ${fmt(got)} ≠ ${fmt(w)}`);
  }
  if (bad.length) throw new Error("численная модель цилиндра неточна: " + bad.join("; "));
}

/* Система «величины одного цилиндра заданы — найти r и h».
   Возвращает {r, h} или {free, at(t)} — один размер условием не задан. */
function cylSystem(known) {
  if (!known.length) throw new Error("в условии нет данных о цилиндре");
  const byR = known.filter(k => ONLY_R.has(k.q));
  const byH = known.filter(k => k.q === "h");
  const mixed = known.filter(k => !ONLY_R.has(k.q) && k.q !== "h");
  const rFrom = k => solveIncreasing(x => measure(x, 1, k.q), k.v, QNAME[k.q]);
  const hFrom = (k, r) => solveIncreasing(x => measure(r, x, k.q), k.v, QNAME[k.q]);
  const rFromMixed = (k, h) => solveIncreasing(x => measure(x, h, k.q), k.v, QNAME[k.q]);
  const check = rh => {
    for (const k of known)
      if (!(relDiff(measure(rh.r, rh.h, k.q), k.v) <= TOL_ANS))
        throw new Error(`условие противоречиво: ${QNAME[k.q]} = ${fmt(k.v)} не выполняется при r = ${fmt(rh.r)}, h = ${fmt(rh.h)}`);
    return rh;
  };
  let r = byR.length ? rFrom(byR[0]) : null;
  let h = byH.length ? hFrom(byH[0], 1) : null;
  const rest = mixed.slice();
  if (r !== null && h === null && rest.length) h = hFrom(rest.shift(), r);
  else if (r === null && h !== null && rest.length) r = rFromMixed(rest.shift(), h);
  if (r !== null && h !== null) return check({ r, h });
  if (r !== null) return { free: "h", at: t => check({ r, h: t }) };
  if (h !== null) return { free: "r", at: t => check({ r: t, h }) };
  if (rest.length === 1) return { free: "r", at: t => check({ r: t, h: hFrom(rest[0], t) }) };
  throw new Error("радиус и высота по условию не определяются и не сводятся к одному свободному размеру");
}

/* ============================================================
   4. Модели задач: формулировка → числа → ответ
   match(cond) — разбор текста (null — не эта модель);
   solve(m) возвращает:
     ans       — пересчитанный ответ;
     ansIsLen  — ответ — длина (тогда отрезок «?» обязан иметь эту длину);
     cyl       — сколько цилиндров должно быть на чертеже;
     info      — ход пересчёта (для -v и сообщений);
     geo(B, S, F, R, E, W) — сверка чертежа: B — тела-цилиндры сцены по
       порядку, F — факт для единого масштаба {what, scene, want, pow, src,
       sev: "E" | "W", note}, R — отношение без масштаба {what, got, want}.
   Сцена в solve не передаётся: ответ считается только по тексту.
   ============================================================ */
const rx = s => new RegExp("^" + s
  .replace(/\{TIMES\}/g, "(" + TIMES + ")")
  .replace(/\{NUMW\}/g, "(" + NUMW + ")")
  .replace(/\{NUM\}/g, "(" + NUM + ")") + "$", "i");
const EQ = "(?:равен|равна|равно|равны)";
const GIVEN = "Радиус основания|Диаметр основания|Высота|Длина окружности основания|" +
  "Площадь осевого сечения|Площадь боковой поверхности|Площадь полной поверхности|Площадь основания|Объ[её]м";
const ASKED = "площадь осевого сечения|площадь боковой поверхности|площадь полной поверхности|" +
  "площадь основания|высоту|радиус основания|диаметр основания|длину окружности основания|объ[её]м";
const RE_GIVEN = new RegExp("^(" + GIVEN + ")(?: цилиндра)? " + EQ + " (" + NUM + ")$", "i");
const RE_ASKED = new RegExp("^(" + ASKED + ")(?: цилиндра)?(,? делённую на π)?\\.$", "i");
const CM3 = String.raw`(?:см³|куб\. см)`;

/* уровень воды на чертеже после погружения: level·factor ≤ высоты сосуда */
function riseCheck(b, factor, E, what) {
  const need = b.level * factor;
  if (b.h < need * (1 - TOL_SHAPE))
    E(`${what}: поднявшаяся вода (уровень ${fmt(need)} в единицах сцены) не помещается ` +
      `в нарисованный сосуд высотой ${fmt(b.h)}`);
}
const needWater = (b, E) => {
  if (b.level === null) { E(`в сосуде (тело ${b.gi + 1} сцены) на чертеже нет воды`); return false; }
  return true;
};

const MODELS = [
  {
    name: "величины одного цилиндра: даны — найти другую",
    match(cond) {
      const m = cond.match(/^(.*?)\s*Найдите (.*)$/);
      if (!m) return null;
      const clauses = m[1].replace(/\.$/, "").split(/[,.]\s+/);
      const known = [];
      for (const c of clauses) {
        const g = c.match(RE_GIVEN);
        if (!g) return null;
        known.push({ q: qOf(g[1]), v: numOf(g[2]) });
      }
      const a = m[2].match(RE_ASKED);
      if (!a) return null;
      return { known, asked: qOf(a[1]), divPi: !!a[2] };
    },
    solve(m) {
      const sys = cylSystem(m.known);
      const div = m.divPi ? Math.PI : 1;
      const val = rh => measure(rh.r, rh.h, m.asked) / div;
      const ans = sys.free ? invariant(t => val(sys.at(t)), QNAME[m.asked]) : val(sys);
      const given = m.known.map(k => `${QNAME[k.q]} ${fmt(k.v)}`).join(", ");
      const info = `${given} → ` + (sys.free
        ? (sys.free === "r" ? "радиус не задан, ответ от него не зависит (проверено)"
          : "высота не задана, ответ от неё не зависит (проверено)")
        : `r = ${fmt(sys.r)}, h = ${fmt(sys.h)}`) + ` → ${QNAME[m.asked]}${m.divPi ? "/π" : ""}`;
      return {
        ans, info, cyl: 1, ansIsLen: LEN_Q.has(m.asked) && !m.divPi,
        geo(B, S, F, R, E, W) {
          const b = B[0];
          for (const k of m.known)
            F({ what: `${QNAME[k.q]} нарисованного цилиндра`, scene: measure(b.r, b.h, k.q), want: k.v, pow: QPOW[k.q], src: "условие" });
          F({ what: `${QNAME[m.asked]}${m.divPi ? "/π" : ""} нарисованного цилиндра (искомое)`,
            scene: measure(b.r, b.h, m.asked) / div, want: ans, pow: QPOW[m.asked], src: "ответ по условию" });
          const ax = m.known.find(k => k.q === "Sax");
          if (ax || m.asked === "Sax") axialCheck(b, S, F, W, ax ? ax.v : ans);
          if (sys.free) this.note = `пропорция r : h на чертеже ${fmt(b.r / b.h)} — условием не задана`;
        }
      };
    }
  },
  {
    name: "погружение детали: уровень поднялся на d",
    re: rx(String.raw`В цилиндрический сосуд налили {NUM} ${CM3} воды\. Уровень воды при этом достигает высоты {NUM} см\. В (?:жидкость|воду) полностью погрузили деталь\. При этом уровень (?:жидкости|воды) в сосуде поднялся на {NUM} см\. (?:Чему равен объ[её]м детали\?|Найдите объ[её]м детали\.) Ответ выразите в ${CM3}\.`),
    solve(m) {
      const V0 = numOf(m[1]), h0 = numOf(m[2]), dh = numOf(m[3]);
      /* радиус сосуда не дан — находится из объёма воды при уровне h0 */
      const r = solveIncreasing(x => measure(x, h0, "V"), V0, "радиус сосуда по объёму воды");
      const ans = measure(r, h0 + dh, "V") - measure(r, h0, "V");
      return {
        ans, ansIsLen: false, cyl: 1,
        info: `вода ${fmt(V0)} при уровне ${fmt(h0)} → r = ${fmt(r)}; V(уровень ${fmt(h0 + dh)}) − V(уровень ${fmt(h0)})`,
        geo(B, S, F, R, E, W) {
          const b = B[0];
          if (!needWater(b, E)) return;
          F({ what: "уровень воды в сосуде", scene: b.level, want: h0, pow: 1, src: "условие" });
          F({ what: `радиус сосуда ${b.names.O}${b.names.P}`, scene: b.r, want: r, pow: 1,
            src: `выведен из объёма ${fmt(V0)} при уровне ${fmt(h0)}`, sev: "W",
            note: "радиус в условии не дан и на чертеже не подписан, ответ от него не зависит; " +
              `но после «Показать ответ» выбранный отрезок ${b.names.O}${b.names.P} тренажёр подпишет «${shownLen(b.r)}», ` +
              `а по данным задачи он ${fmt(r)}` });
          riseCheck(b, (h0 + dh) / h0, E, "подъём на " + fmt(dh));
        }
      };
    }
  },
  {
    name: "погружение детали: уровень вырос в k раз",
    re: rx(String.raw`В цилиндрический сосуд налили {NUM} ${CM3} воды\. В (?:воду|жидкость) полностью погрузили деталь\. При этом уровень (?:жидкости|воды) в сосуде (?:увеличился|вырос|поднялся) {TIMES}\. (?:Найдите объ[её]м детали\.|Чему равен объ[её]м детали\?) Ответ выразите в ${CM3}\.`),
    solve(m) {
      const V0 = numOf(m[1]), k = timesOf(m[2]);
      /* радиус сосуда не дан: ответ обязан от него не зависеть */
      const ans = invariant(t => {
        const h0 = solveIncreasing(x => measure(t, x, "V"), V0, "уровень воды");
        return measure(t, k * h0, "V") - measure(t, h0, "V");
      }, "объём детали");
      return {
        ans, ansIsLen: false, cyl: 1,
        info: `вода ${fmt(V0)}, уровень ×${fmt(k)} → V(k·h₀) − V(h₀) при двух радиусах сосуда`,
        geo(B, S, F, R, E, W) {
          const b = B[0];
          if (!needWater(b, E)) return;
          F({ what: "объём воды в нарисованном сосуде", scene: measure(b.r, b.level, "V"), want: V0, pow: 3, src: "условие" });
          riseCheck(b, k, E, "подъём в " + fmt(k) + " раза");
        }
      };
    }
  },
  {
    name: "переливание во второй сосуд другого диаметра",
    re: rx(String.raw`В цилиндрическом сосуде уровень жидкости достигает {NUM} см\. На какой высоте будет находиться уровень жидкости, если е[её] перелить во второй (?:цилиндрический )?сосуд, (диаметр|радиус) которого {TIMES} (больше|меньше)(?: (?:диаметра|радиуса))? первого\? Ответ дайте в сантиметрах\.`),
    solve(m) {
      const h1 = numOf(m[1]), q = qOf(m[2]), k = timesOf(m[3]);
      const f = m[4].toLowerCase() === "больше" ? k : 1 / k;
      /* радиус первого сосуда не дан: ответ обязан от него не зависеть */
      const ans = invariant(t => {
        const r2 = solveIncreasing(x => measure(x, 1, q), f * measure(t, 1, q), QNAME[q] + " второго сосуда");
        return solveIncreasing(x => measure(r2, x, "V"), measure(t, h1, "V"), "уровень во втором сосуде");
      }, "уровень во втором сосуде");
      return {
        ans, ansIsLen: true, cyl: 2,
        info: `уровень ${fmt(h1)}, ${QNAME[q]} ×${fmt(f)} → уровень, при котором объёмы жидкости равны`,
        geo(B, S, F, R, E, W) {
          if (!needWater(B[0], E) || !needWater(B[1], E)) return;
          F({ what: "уровень жидкости в первом сосуде", scene: B[0].level, want: h1, pow: 1, src: "условие" });
          F({ what: "уровень жидкости во втором сосуде (искомое)", scene: B[1].level, want: ans, pow: 1, src: "ответ по условию" });
          R({ what: `отношение ${QGEN[q]} второго и первого сосуда`,
            got: measure(B[1].r, 1, q) / measure(B[0].r, 1, q), want: f });
          R({ what: "объём жидкости во втором сосуде к объёму в первом",
            got: measure(B[1].r, B[1].level, "V") / measure(B[0].r, B[0].level, "V"), want: 1 });
        }
      };
    }
  },
  {
    name: "два цилиндра: объём первого, высота и радиус второго в разах",
    re: rx(String.raw`Объ[её]м первого цилиндра ${EQ} {NUM}(?: (?:м³|см³|дм³|куб\. м|куб\. см))?\. У второго цилиндра (высота|радиус основания|диаметр основания) {TIMES} (больше|меньше), а (высота|радиус основания|диаметр основания)\s*(?:—\s*)?{TIMES} (больше|меньше), чем у первого\. Найдите объ[её]м второго цилиндра\.(?: Ответ дайте в [а-яё ]+\.)?`),
    solve(m) {
      const V1 = numOf(m[1]);
      const rel = [[qOf(m[2]), timesOf(m[3]), m[4]], [qOf(m[5]), timesOf(m[6]), m[7]]]
        .map(([q, k, d]) => ({ q, f: d.toLowerCase() === "больше" ? k : 1 / k }));
      const hRel = rel.find(x => x.q === "h"), rRel = rel.find(x => x.q !== "h");
      if (!hRel || !rRel) throw new Error("во втором цилиндре должны быть названы высота и радиус (диаметр)");
      const second = (r1, h1) => ({
        h: solveIncreasing(x => measure(1, x, "h"), hRel.f * measure(r1, h1, "h"), "высота второго цилиндра"),
        r: solveIncreasing(x => measure(x, 1, rRel.q), rRel.f * measure(r1, h1, rRel.q), QNAME[rRel.q] + " второго цилиндра")
      });
      /* радиус первого не дан: ответ обязан от него не зависеть */
      const ans = invariant(t => {
        const h1 = solveIncreasing(x => measure(t, x, "V"), V1, "высота первого цилиндра");
        const c2 = second(t, h1);
        return measure(c2.r, c2.h, "V");
      }, "объём второго цилиндра");
      return {
        ans, ansIsLen: false, cyl: 2,
        info: `V₁ = ${fmt(V1)}; h₂ = ${fmt(hRel.f)}·h₁, ${QNAME[rRel.q]}₂ = ${fmt(rRel.f)}·${QNAME[rRel.q]}₁ → V₂`,
        geo(B, S, F, R, E, W) {
          F({ what: "объём первого цилиндра", scene: measure(B[0].r, B[0].h, "V"), want: V1, pow: 3, src: "условие" });
          F({ what: "объём второго цилиндра (искомое)", scene: measure(B[1].r, B[1].h, "V"), want: ans, pow: 3, src: "ответ по условию" });
          R({ what: "отношение высот второго и первого цилиндра", got: B[1].h / B[0].h, want: hRel.f });
          R({ what: `отношение ${QGEN[rRel.q]} второго и первого цилиндра`,
            got: measure(B[1].r, 1, rRel.q) / measure(B[0].r, 1, rRel.q), want: rRel.f });
        }
      };
    }
  },
  {
    name: "две кружки: одна в a раз выше, другая в b раз шире",
    re: rx(String.raw`Одна цилиндрическая кружка {TIMES} выше второй, зато вторая {TIMES} шире\. Найдите отношение объ[её]ма второй кружки к объ[её]му первой\.`),
    solve(m) {
      const a = timesOf(m[1]), b = timesOf(m[2]);
      /* «шире» — ширина кружки, то есть диаметр её основания */
      const ratio = t => {
        const r1 = t, h2 = 0.4 + 0.3 * t;          /* два неданных размера, оба меняются */
        const h1 = solveIncreasing(x => measure(1, x, "h"), a * measure(1, h2, "h"), "высота первой кружки");
        const r2 = solveIncreasing(x => measure(x, 1, "d"), b * measure(r1, 1, "d"), "диаметр второй кружки");
        return measure(r2, h2, "V") / measure(r1, h1, "V");
      };
      const ans = invariant(ratio, "отношение объёмов");
      return {
        ans, ansIsLen: false, cyl: 2,
        info: `h₁ = ${fmt(a)}·h₂, d₂ = ${fmt(b)}·d₁ → V₂ / V₁ при двух наборах размеров`,
        geo(B, S, F, R) {
          R({ what: "отношение высот первой и второй кружки", got: B[0].h / B[1].h, want: a });
          R({ what: "отношение диаметров второй и первой кружки",
            got: measure(B[1].r, 1, "d") / measure(B[0].r, 1, "d"), want: b });
        }
      };
    }
  }
];

/* осевое сечение: закраска построения — прямоугольник через ось тела */
function axialCheck(b, S, F, W, area) {
  const tol = TOL_SHAPE * Math.max(b.r, b.h);
  const near = (p, q) => dist(p, q) <= tol;
  const isAxial = ring => {
    if (!Array.isArray(ring) || ring.length !== 4) return false;
    const P = ring.map(n => S.pts[n]);
    if (!P.every(isPt)) return false;
    for (const s of [0, 1]) {
      const [a0, a1, a2, a3] = [0, 1, 2, 3].map(i => P[(i + s) % 4]);
      const m1 = scl(add(a0, a1), 0.5), m2 = scl(add(a2, a3), 0.5);
      const diamOk = relDiff(dist(a0, a1), 2 * b.r) <= TOL_SHAPE && relDiff(dist(a2, a3), 2 * b.r) <= TOL_SHAPE &&
        ((near(m1, b.O) && near(m2, b.O1)) || (near(m1, b.O1) && near(m2, b.O)));
      const gen1 = sub(a2, a1), gen2 = sub(a3, a0);
      const axis = sub(b.O1, b.O);
      const genOk = [gen1, gen2].every(g => relDiff(norm(g), b.h) <= TOL_SHAPE &&
        norm(cross(g, axis)) <= tol * b.h);
      if (diamOk && genOk) return true;
    }
    return false;
  };
  const rings = S.fills.filter(isAxial);
  if (!rings.length) {
    W(`осевое сечение названо в условии, но на чертеже (и в построении) его нет`);
    return;
  }
  for (const ring of rings) {
    const P = ring.map(n => S.pts[n]);
    const A = norm(cross(sub(P[1], P[0]), sub(P[3], P[0])));
    F({ what: `закрашенное осевое сечение ${ring.join("")}`, scene: A, want: area, pow: 2, src: "условие" });
  }
}

/* ============================================================
   5. Сцена задачи так, как её собирает тренажёр
   ============================================================ */
const CYL_PTS = ["O", "O1", "P", "P1", "Q", "Q1"];
function findCylNames(pts) {
  const found = [];
  for (const n of Object.keys(pts)) {
    if (n[0] !== "P") continue;
    const px = n.slice(1);
    if (CYL_PTS.every(b => (b + px) in pts)) found.push(px);
  }
  return found.length === 1 ? found[0] : null;
}

function cylBody(g, gi, E, W) {
  const T = `тело ${gi + 1} сцены`;
  const cs = (g.surfaces || []).filter(s => s && s.type === "cyl");
  if (cs.length !== 1) { E(`${T} — не цилиндр (боковых поверхностей цилиндра: ${cs.length})`); return null; }
  const pts = g.pts || {};
  const px = findCylNames(pts);
  if (px === null) { E(`${T}: нет однозначного набора точек O, O1, P, P1, Q, Q1`); return null; }
  const names = {};
  for (const k of CYL_PTS) names[k] = k + px;
  const P = k => pts[names[k]];
  if (!CYL_PTS.every(k => isPt(P(k)))) return null;     /* уже отмечено как не конечные координаты */
  const O = P("O"), O1 = P("O1"), axis = sub(O1, O);
  const r = dist(O, P("P")), h = norm(axis);
  const tol = TOL_SHAPE * Math.max(r, h);
  const bad = [];
  if (!(r > 0) || !(h > 0)) bad.push(`вырожден: r = ${fmt(r)}, h = ${fmt(h)}`);
  if (Math.hypot(axis[0], axis[1]) > tol || !(axis[2] > 0)) bad.push("ось OO1 не вертикальна");
  if (Math.abs(dot(sub(P("P"), O), axis)) > tol * h) bad.push("точка P не в плоскости нижнего основания");
  if (dist(P("P1"), add(P("P"), axis)) > tol) bad.push("P1 не над P на высоте цилиндра");
  if (dist(P("Q"), sub(scl(O, 2), P("P"))) > tol) bad.push("Q не диаметрально противоположна P");
  if (dist(P("Q1"), add(P("Q"), axis)) > tol) bad.push("Q1 не над Q на высоте цилиндра");
  const s = cs[0];
  if (!isPt(s.c) || dist(s.c, scl(add(O, O1), 0.5)) > tol || !(relDiff(s.r, r) <= TOL_SHAPE) || !(relDiff(s.h, h) <= TOL_SHAPE))
    bad.push(`боковая поверхность (r = ${fmt(s.r)}, h = ${fmt(s.h)}) не совпадает с точками (r = ${fmt(r)}, h = ${fmt(h)})`);
  const circ = g.circles || [];
  const hasCirc = c0 => circ.some(c => c && isPt(c.c) && dist(c.c, c0) <= tol && relDiff(c.r, r) <= TOL_SHAPE && c.plane === "h");
  if (!hasCirc(O)) bad.push("нет окружности нижнего основания радиуса r");
  if (!hasCirc(O1)) bad.push("нет окружности верхнего основания радиуса r");
  let level = null;
  const ws = (g.surfaces || []).filter(x => x && x.type === "water");
  if (ws.length > 1) bad.push("несколько слоёв воды");
  if (ws.length === 1) {
    const w = ws[0];
    level = w.h;
    if (!(w.h > 0)) bad.push("уровень воды не положителен");
    else {
      if (!isPt(w.c) || dist(sub(w.c, [0, 0, w.h / 2]), O) > tol) bad.push("вода не стоит на дне сосуда");
      if (w.h > h * (1 + TOL_SHAPE)) bad.push(`вода (уровень ${fmt(w.h)}) выше края сосуда (${fmt(h)})`);
    }
    /* радиус воды на чертеже = 0,985·r: зазор против мерцания граней при
       отрисовке; объём воды считается по радиусу сосуда */
    if (w.r > r * (1 + TOL_SHAPE)) bad.push("вода шире сосуда");
    else if (w.r < 0.9 * r) W(`${T}: вода нарисована заметно уже сосуда (${fmt(w.r)} при r = ${fmt(r)})`);
  }
  if (bad.length) E(`${T} — цилиндр построен неверно: ${bad.join("; ")}`);
  return { gi, px, names, O, O1, r, h, level, ghost: !!g.ghost };
}

function sceneOf(p, E, W) {
  const sd = sceneData(p);
  const gen = Array.from((sd && sd.gen) || []);
  if (!gen.length) { E("sceneData вернула пустую сцену"); return null; }
  /* конечность координат */
  gen.forEach((g, gi) => {
    for (const [nm, pt] of Object.entries(g.pts || {}))
      if (!isPt(pt)) E(`тело ${gi + 1}: точка ${nm} = [${Array.isArray(pt) ? pt.map(String).join(", ") : String(pt)}] — не конечные координаты`);
    (g.circles || []).forEach((c, i) => {
      if (!c || !isPt(c.c) || !Number.isFinite(c.r)) E(`тело ${gi + 1}: окружность ${i + 1} — не конечные центр или радиус`);
    });
    (g.surfaces || []).forEach((sf, i) => {
      if (!sf || !isPt(sf.c) || !Number.isFinite(sf.r) || (sf.h != null && !Number.isFinite(sf.h)))
        E(`тело ${gi + 1}: поверхность ${i + 1} (${sf && sf.type}) — не конечные размеры`);
    });
  });
  /* тела-цилиндры и сверка с заданием сцены (scene.prims) */
  const prims = (p.scene && Array.isArray(p.scene.prims)) ? p.scene.prims : null;
  const bodies = [];
  gen.forEach((g, gi) => {
    const b = cylBody(g, gi, E, W);
    if (!b) return;
    bodies.push(b);
    const sp = prims && prims[gi];
    if (!sp) { E(`тело ${gi + 1} сцены: нет задания в scene.prims`); return; }
    if (sp.kind !== "cyl") { E(`тело ${gi + 1} сцены: в scene.prims «${sp.kind}», а нарисован цилиндр`); return; }
    const pairs = [["радиус", sp.r, b.r], ["высота", sp.h, b.h]];
    if (sp.fill != null) pairs.push(["уровень воды (fill·h)", sp.fill * sp.h, b.level]);
    else if (b.level !== null) E(`тело ${gi + 1} сцены: вода нарисована, а в scene.prims её нет`);
    for (const [nm, w, got] of pairs)
      if (!(Number.isFinite(w) && got !== null && relDiff(w, got) <= TOL_SHAPE))
        E(`тело ${gi + 1} сцены: ${nm} на сцене ${fmt(got)}, в задании scene.prims ${fmt(w)} — сцена построена не по заданию`);
  });
  if (prims && prims.length !== gen.length) E(`в scene.prims тел ${prims.length}, на сцене ${gen.length}`);
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
  for (const [key, list] of Object.entries(clash)) {
    const [g1, g2] = key.split("→");
    W(`имена точек (${list.join(", ")}) у тел ${g1} и ${g2} сцены совпадают при разных координатах; ` +
      `тренажёр собирает точки в один словарь, и буквы тела ${g1} рисуются на месте тела ${g2}`);
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
  const segments = Array.isArray(cst.segments) ? cst.segments : [];
  const fills = [...(Array.isArray(cst.fills) ? cst.fills : []), ...(Array.isArray(cst.solid) ? cst.solid : [])];
  for (const sg of segments)
    for (const n of sg.slice(0, 2)) if (!isPt(pts[n])) E(`отрезок построения ${sg[0]}${sg[1]}: нет точки ${n} на чертеже`);
  for (const ring of fills)
    for (const n of ring) if (!isPt(pts[n])) E(`закраска построения ${ring.join("")}: нет точки ${n} на чертеже`);
  /* пересечение тел: два сосуда / два цилиндра должны быть видны раздельно */
  const bb = b => [[b.O[0] - b.r, b.O[0] + b.r], [b.O[1] - b.r, b.O[1] + b.r], [Math.min(b.O[2], b.O1[2]), Math.max(b.O[2], b.O1[2])]];
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
    const b1 = bb(bodies[i]), b2 = bb(bodies[j]);
    if ([0, 1, 2].every(k => Math.min(b1[k][1], b2[k][1]) - Math.max(b1[k][0], b2[k][0]) > 1e-9))
      W(`тела ${bodies[i].gi + 1} и ${bodies[j].gi + 1} сцены пересекаются`);
  }
  if (Array.isArray(p.givenFaces) && p.givenFaces.length)
    W("подписанные грани (givenFaces) этим верификатором не сверяются");
  return { gen, bodies, pts, segments, fills };
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
  const WG = STRICT ? E : W;                     /* предупреждения о чертеже */
  const cond = String(p.cond || "").replace(/\s+/g, " ").trim();

  const hits = MODELS.map(M => ({ M, m: M.match ? M.match(cond) : cond.match(M.re) })).filter(h => h.m);
  if (!hits.length) { E(`формулировка не распознана ни одной моделью верификатора: «${cond}»`); return; }
  if (hits.length > 1) { E(`формулировку распознают несколько моделей: ${hits.map(h => h.M.name).join("; ")}`); return; }
  const { M, m } = hits[0];

  /* --- ответ: только по тексту условия --- */
  const res = M.solve(m);
  const stored = parseStored(p.ans);
  if (stored === null) E(`ответ банка «${p.ans}» — не число`);
  else if (!(relDiff(res.ans, stored) <= TOL_ANS)) {
    E(`ответ: в банке ${p.ans}, пересчёт по условию ${fmt(res.ans)} (${M.name}: ${res.info})`);
    answerMismatch.push({ id, stored: String(p.ans), computed: fmt(res.ans), note: `${M.name}: ${res.info}` });
  }

  /* --- чертёж --- */
  const S = sceneOf(p, E, WG);
  if (!S) return;
  const B = S.bodies;
  if (B.length !== res.cyl) E(`в условии цилиндров ${res.cyl}, на чертеже ${B.length}`);
  const facts = [], ratios = [];
  const F = f => facts.push(Object.assign({ sev: "E" }, f));
  const R = r => ratios.push(r);
  if (B.length >= res.cyl) res.geo(B, S, F, R, E, WG);

  /* подписи: labels и подписанные отрезки построения */
  const cn = condNumbers(cond);
  const labelled = [
    ...(p.labels || []).map(l => ["подпись", l]),
    ...S.segments.filter(s => s.length > 2 && s[2] != null).map(s => ["подпись построения", s])
  ];
  for (const [src, [a, b, t]] of labelled) {
    if (!isPt(S.pts[a]) || !isPt(S.pts[b])) { E(`${src} ${a}${b} «${t}»: нет такой точки на чертеже`); continue; }
    const L = dist(S.pts[a], S.pts[b]);
    if (t === "?") {
      if (res.ansIsLen) F({ what: `искомый отрезок ${a}${b} «?»`, scene: L, want: res.ans, pow: 1, src: "ответ по условию" });
      else WG(`${src} ${a}${b} «?», а искомое — не длина: подпись указывает не на то`);
      continue;
    }
    const val = labelNum(t);
    if (val === null) continue;
    F({ what: `${src} ${a}${b} = «${t}»`, scene: L, want: val, pow: 1, src: "подпись" });
    if (!cn.some(x => relDiff(x, val) < 1e-12)) WG(`${src} ${a}${b} = «${t}»: такого числа нет в условии (данные только на рисунке)`);
  }

  /* единый масштаб. Опорный масштаб — тот, на котором сходится больше всего
     обязательных фактов (при равенстве — более ранний): тогда в сообщении
     названа именно выбившаяся величина, а не все остальные */
  const kOf = f => Math.pow(f.scene / f.want, 1 / f.pow);
  const usable = facts.filter(f => {
    if (f.want > 0 && f.scene > 0 && Number.isFinite(f.scene) && Number.isFinite(f.want)) return true;
    E(`${f.what}: на сцене ${fmt(f.scene)}, по данным ${fmt(f.want)} — нулевая, неположительная или не конечная величина`);
    return false;
  });
  const pool = usable.filter(f => f.sev === "E").length ? usable.filter(f => f.sev === "E") : usable;
  let ref = null, best = 0;
  for (const f of pool) {
    const n = pool.filter(g => relDiff(kOf(g), kOf(f)) <= TOL_GEO).length;
    if (n > best) { best = n; ref = f; }
  }
  const k0 = ref ? kOf(ref) : null;
  for (const f of usable) {
    if (f === ref) continue;
    const k = kOf(f);
    if (relDiff(k, k0) <= TOL_GEO) continue;
    const unit = f.pow === 3 ? " (объём)" : f.pow === 2 ? " (площадь)" : "";
    const msg = `чертёж не в масштабе: ${f.what}${unit} на сцене ${fmt(f.scene)}, по данным (${f.src}) ` +
      `${fmt(f.want)} → масштаб ${fmt(k)}; а ${ref.what}: на сцене ${fmt(ref.scene)}, ` +
      `по данным (${ref.src}) ${fmt(ref.want)} → масштаб ${fmt(k0)}` + (f.note ? `. ${f.note}` : "");
    (f.sev === "E" ? E : WG)(msg);
  }
  /* масштаб k ≠ 1: форма верна, но тренажёр после «Показать ответ» подписывает
     выбранный отрезок его длиной на сцене, без пересчёта (displayLen → fmtLen(scaleFn)) */
  if (unitCheck(p, k0, E) && B.length) {
    const b = B[0], n = b.names;
    WG(`чертёж подобен условию, но в масштабе ${fmt(k0)} (по: ${ref.what}), а unit не задан; после «Показать ответ» ` +
      `панель измерений покажет длину отрезка на сцене ` +
      `(displayLen → fmtLen(scaleFn · unit)): ученик увидит ${n.O}${n.P} = ${shownLen(b.r)} и ${n.O}${n.O1} = ${shownLen(b.h)}, ` +
      `а в единицах условия это ${fmt(b.r / k0)} и ${fmt(b.h / k0)}`);
  }

  /* отношения тел — без масштаба */
  for (const r of ratios)
    if (!(relDiff(r.got, r.want) <= TOL_GEO))
      E(`чертёж не соответствует условию: ${r.what} на сцене ${fmt(r.got)}, по условию ${fmt(r.want)}`);

  if (VERBOSE)
    console.log(`  ${id.padEnd(7)} ответ ${String(p.ans).padEnd(6)} пересчёт ${fmt(res.ans).padEnd(8)} ` +
      `[${M.name}] ${res.info}; цилиндров на сцене ${B.length}; ` +
      `сверено величин ${facts.length}, отношений ${ratios.length}` +
      (k0 !== null ? `; масштаб ${fmt(k0)}` : "; масштаб условием не задан") +
      (res.note ? `; ${res.note}` : ""));
}

/* ============================================================
   7. Прогон
   ============================================================ */
function main() {
  let api;
  try { api = loadData(DATA_JS); }
  catch (e) {
    console.log(`Не удалось загрузить ${DATA_JS}: ${e.message}`);
    console.log("Цилиндр (старые): задач 0, расхождений 1");
    process.exit(1);
  }
  ({ PROBLEMS, sceneData } = api);
  const errs = [], warns = [], answerMismatch = [];
  try { modelSelfCheck(); }
  catch (e) { errs.push("верификатор: " + e.message); }
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
  console.log(`Цилиндр (старые): задач ${legacy.length}, расхождений ${errs.length}`);
  if (warns.length) console.log(`(предупреждений ${warns.length} — на код выхода не влияют; --strict делает их расхождениями)`);
  if (errs.length) process.exit(1);
  console.log("LEGACY_CIL_VERIFY_OK");
}
let PROBLEMS, sceneData;
main();
