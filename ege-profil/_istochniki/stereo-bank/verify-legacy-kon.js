/* ============================================================
   verify-legacy-kon.js — независимый верификатор СТАРЫХ задач
   стерео-банка, тема «Конус».

   Старые задачи — 29 задач с числовыми id (номера Решу ЕГЭ). Под этими
   id у учеников записан прогресс (stereo3.status, stereo3.last.<тема>),
   поэтому здесь ничего не правится — только проверяется.

   1. Ответ
      • Модель задачи распознаётся шаблоном на ВСЁ условие p.cond целиком:
        изменённая формулировка не пройдёт молча, а получит «не распознана».
      • Числа берутся регулярками из того же текста, ответ пересчитывается
        своим кодом. Величины конуса считаются численно — по вписанной
        пирамиде с правильным n-угольником в основании:
          длина окружности — периметр n-угольника;
          площадь основания — сумма треугольников (векторное произведение);
          боковая поверхность — сумма боковых граней пирамиды;
          объём — сумма тетраэдров «вершина — центр — ребро основания»;
          часть конуса — те же тетраэдры только над нарисованной дугой;
          площадь сферы — многогранник «широта — долгота»;
        затем экстраполяция Ричардсона по n (2048 и 4096), погрешность
        ~1e-13. Образующая, диаметр, осевое сечение, углы — по точкам
        (расстояния, векторное и скалярное произведения).
        Формулы πr²h/3, πrl, πr², 4πR² и правило подобия «k², k³» в
        пересчёте не используются; π участвует только там, где условие
        само просит «делённую на π» (и в самопроверке численной модели).
      • Обратные задачи (по длине окружности — радиус, по углу — форма,
        по образующей — высота, вписанный шар) решаются бисекцией по той
        же численной модели.
      • Сечение плоскостью, параллельной основанию, строится: радиус
        сечения — расстояние от оси до точки, где образующая пересекает
        плоскость; отсечённый конус и жидкость в сосуде — отдельные конусы.
      • Если ответ не должен зависеть от неданного размера («во сколько раз
        изменится…», «объём конуса 16» без размеров), он считается для двух
        разных конусов и обязан совпасть (допуск 1e-9).
      • p.ans участвует только в итоговой сверке; p.sol и p.hint не читаются.
      • Данные ПО РИСУНКУ — только там, где их нет в тексте; такие места
        помечены в коде меткой «ПО РИСУНКУ»:
          27202–27205 «часть конуса, изображённой на рисунке»: высота и
            радиус — из подписей чертежа (labels) на отрезках SO и OB,
            угол — из подписи угла (coordLabels) с учётом того, стоит она
            внутри нарисованной части или в вырезе;
          318145 «сосуд, имеющий форму конуса»: текст не говорит, вершиной
            вниз стоит сосуд или вверх, — ориентация берётся с чертежа.
   2. Чертёж — выход sceneData(p) так, как его собирает тренажёр
      (buildScene: точки всех тел — в один словарь имя → точка, при
      совпадении имён берётся точка последнего тела):
      • каждое тело — действительно конус (шар): ось вертикальна, точки
        O, S, P, Q (A, B) на своих местах, поверхность и окружность
        основания совпадают с точками, сцена совпадает с scene.prims;
      • каждая числовая подпись [a, b, «число»] (labels и подписанные
        отрезки построения), отрезок «?» с известной по условию длиной,
        величины из условия, измеренные на нарисованном конусе, и искомая
        величина сводятся к ОДНОМУ масштабу на задачу (допуск 1e-6;
        площадь — через √, объём — через ∛);
      • подпись, которая из-за совпадения имён точек оказалась на отрезке
        другого тела, — расхождение (ученик видит число не на том отрезке);
      • отношения без масштаба: во сколько раз второй конус выше/шире/
        длиннее, доля высоты у секущей плоскости и у уровня жидкости,
        углы, вписанность шара;
      • часть конуса: нарисованный сектор, точки A, B на его краях,
        подпись угла и сторона, с которой она стоит.
      Предупреждения (на код выхода не влияют; --strict делает их
      расхождениями): сцена подобна условию, но в масштабе k ≠ 1, а unit
      не задан — после «Показать ответ» панель измерений (displayLen →
      fmtLen(scaleFn · unit)) показала бы длины сцены, не согласованные
      с условием; совпадающие имена точек у разных тел (буквы и рёбра одного
      тела рисуются на другом); число подписи, которого нет в условии.
      Окружность основания целиком при нарисованной части конуса и точка
      целого конуса (P, Q) в вырезе части — на линейке курса (объединённый
      data.js: есть sceneDataLegacy) расхождение: движок курса их исправил
      (engine.js, sceneDataFromLegacy), и откат правки должен краснеть; на
      опубликованной линейке — предупреждение, как раньше (там они есть).
      Расхождения сверх перечисленного: поле unit задачи (длина условия
      на единицу сцены) не равно 1/k — панель измерений показала бы длины
      не в единицах условия; обод части конуса — дуга не над нарисованным
      сектором; вспомогательная точка подписи (scene.pts, имя с «_») — не
      центр окружности сечения на оси конуса.

   Запуск (голый Node, без зависимостей):
     node verify-legacy-kon.js                  — линейка ../../trainers/stereo
     STEREO_ROOT=<папка линейки> node verify-legacy-kon.js
     ключ -v — по строке на каждую задачу;
     ключ --strict — предупреждения тоже считаются расхождениями.
   Берутся задачи PROBLEMS с id из одних цифр и topic === "Конус" (ровно 29);
   новые задачи (id вида kon-01) пропускаются — их проверяет verify-kon.js.
   Код 0 и маркер LEGACY_KON_VERIFY_OK — только при нуле расхождений.
   ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const STEREO_ROOT = process.env.STEREO_ROOT ||
  path.resolve(__dirname, "..", "..", "trainers", "stereo");
const DATA_JS = path.join(STEREO_ROOT, "js", "data.js");
const TOPIC = "Конус";
const EXPECTED_COUNT = 29;
const TOL_ANS = 1e-9;    /* ответ: относительный допуск */
const TOL_GEO = 1e-6;    /* единый масштаб и отношения на чертеже: относительный допуск */
const TOL_SHAPE = 1e-9;  /* форма тела: точки на своих местах */
const TOL_FREE = 1e-9;   /* ответ не зависит от неданного размера */
const VERBOSE = process.argv.includes("-v") || process.argv.includes("--verbose");
const STRICT = process.argv.includes("--strict");

/* ============================================================
   0. Загрузка data.js в песочницу vm
   Своя копия идеи _load.js (чужие файлы не подключаются): data.js —
   браузерный скрипт, THREE и DOM нужны ему только при отрисовке, для
   загрузки хватает заглушек. Работает и со старым data.js линейки
   (PROBLEMS и sceneData — глобальные const/function, без module.exports),
   и с объединённым (есть блок module.exports; sceneData там — диспетчер,
   который для старых задач вызывает легаси-генератор sceneDataLegacy).
   ============================================================ */
function inert(name) {
  const fn = function () {};
  return new Proxy(fn, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => NaN;
      if (k === "then") return undefined;
      if (k === "prototype") return t.prototype;
      return inert(name + "." + String(k));
    },
    set() { return true; },
    apply() { return inert(name + "()"); },
    construct() { return inert("new " + name); }
  });
}

function loadData(file) {
  const src = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
  function Vector3(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; }
  Vector3.prototype.clone = function () { return new Vector3(this.x, this.y, this.z); };
  const THREE = new Proxy({ Vector3 }, { get: (t, k) => (k in t ? t[k] : inert("THREE." + String(k))) });
  const sandbox = {
    THREE, console,
    document: inert("document"), navigator: inert("navigator"), location: inert("location"),
    localStorage: inert("localStorage"), sessionStorage: inert("sessionStorage"),
    addEventListener() {}, removeEventListener() {},
    requestAnimationFrame: () => 0, cancelAnimationFrame() {},
    setTimeout: () => 0, clearTimeout() {},
    module: { exports: {} }
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  const ctx = vm.createContext(sandbox);
  new vm.Script(src, { filename: file }).runInContext(ctx, { timeout: 30000 });
  /* const/let верхнего уровня живут в общей лексической области контекста —
     следующий скрипт в том же контексте их видит */
  const g = new vm.Script(
    "({ P: typeof PROBLEMS !== 'undefined' ? PROBLEMS : undefined," +
    "   S: typeof sceneData === 'function' ? sceneData : undefined })",
    { filename: "verify-legacy-kon:probe" }
  ).runInContext(ctx);
  const ex = sandbox.module.exports || {};
  const PROBLEMS = Array.isArray(g.P) ? g.P : ex.PROBLEMS;
  const sceneData = g.S || (typeof ex.sceneData === "function" ? ex.sceneData : undefined);
  if (!Array.isArray(PROBLEMS)) throw new Error("в data.js нет массива PROBLEMS");
  if (typeof sceneData !== "function") throw new Error("в data.js нет функции sceneData");
  /* линейка курса (объединённый data.js) экспортирует sceneDataLegacy;
     опубликованная линейка trainers/ege-profile-stereometry-3d — нет */
  const course = typeof ex.sceneDataLegacy === "function";
  return { PROBLEMS, sceneData, course };
}

/* ============================================================
   1. Векторная арифметика и мелочи
   ============================================================ */
const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const add = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
const scl = (p, s) => [p[0] * s, p[1] * s, p[2] * s];
const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
const norm = p => Math.hypot(p[0], p[1], p[2]);
const dist = (p, q) => norm(sub(p, q));
const triArea = (a, b, c) => norm(cross(sub(b, a), sub(c, a))) / 2;
const tetVol = (a, b, c, d) => Math.abs(dot(sub(b, a), cross(sub(c, a), sub(d, a)))) / 6;
const relDiff = (x, y) => Math.abs(x - y) / Math.max(Math.abs(x), Math.abs(y), 1e-300);
const fmt = x => (Number.isFinite(x) ? String(+x.toPrecision(12)).replace(".", ",") : String(x));
const isPt = p => Array.isArray(p) && p.length >= 3 && [0, 1, 2].every(i => Number.isFinite(p[i]));
const RAD2DEG = 180 / Math.PI;   /* перевод радиан в градусы — не формула задачи */

/* угол при вершине v между лучами va и vb, в градусах */
function angleAt(v, a, b) {
  const u = sub(a, v), w = sub(b, v);
  const c = dot(u, w) / (norm(u) * norm(w));
  return Math.acos(Math.max(-1, Math.min(1, c))) * RAD2DEG;
}
/* расстояние от точки X до прямой AB */
const distToLine = (X, A, B) => norm(cross(sub(X, A), sub(B, A))) / dist(A, B);

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
const NUM = String.raw`\d+(?:,\d+)?`;
const NUMW = NUM + "|" + Object.keys(WORDS).join("|");
const dec = s => Number(String(s).replace(",", "."));
/* текст условия: ё → е, любые пробелы (в т. ч. неразрывные) → один пробел */
const normText = s => String(s).replace(/ё/g, "е").replace(/Ё/g, "Е").replace(/\s+/g, " ").trim();

function numOf(s) {
  const t = String(s).replace(/\s+/g, "").toLowerCase();
  if (Object.prototype.hasOwnProperty.call(WORDS, t)) return WORDS[t];
  let m = t.match(/^(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  m = t.match(/^(\d+(?:,\d+)?)?√(\d+(?:,\d+)?)$/);
  if (m) return (m[1] ? dec(m[1]) : 1) * Math.sqrt(dec(m[2]));
  if (/^\d+(?:,\d+)?$/.test(t)) return dec(t);
  throw new Error(`не число: «${s}»`);
}
/* подпись чертежа: «6», «√12», «2√3», «1,5»; остальное (?, 90°, x) — не длина */
function labelNum(t) {
  const s = String(t).replace(/\s+/g, "");
  if (!/^(?:\d+(?:,\d+)?)?√\d+(?:,\d+)?$|^\d+(?:,\d+)?$/.test(s)) return null;
  return numOf(s);
}
/* все числа текста — для сверки подписей чертежа с условием */
function condNumbers(cond) {
  const out = [];
  const re = new RegExp(String.raw`(\d+)\s*/\s*(\d+)|(?<![A-Za-z0-9,])(?:(?:\d+(?:,\d+)?)?√\d+(?:,\d+)?|\d+(?:,\d+)?)|(?<![а-яё])(?:` +
    Object.keys(WORDS).join("|") + ")(?![а-яё])", "gi");
  let m;
  while ((m = re.exec(cond))) {
    if (m[1]) { out.push(Number(m[1]), Number(m[2]), Number(m[1]) / Number(m[2])); continue; }
    out.push(numOf(m[0]));
  }
  return out;
}

/* Шаблон условия: текст целиком; {N} — число цифрами, {W} — цифрами или
   словом («в два раза»), {F} — дробь «1/2». Остальной текст — буквально. */
const PH = { N: `(${NUM})`, W: `(${NUMW})`, F: String.raw`(\d+\s*/\s*\d+)` };
function tpl(text) {
  const re = normText(text).split(/(\{[NWF]\})/).map(part => {
    const m = part.match(/^\{([NWF])\}$/);
    return m ? PH[m[1]] : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("");
  return new RegExp("^" + re + "$");
}

/* величины конуса */
const QNAME = { r: "радиус основания", d: "диаметр основания", h: "высота", l: "образующая",
  C: "длина окружности основания", Sb: "площадь основания", Slat: "площадь боковой поверхности",
  Sfull: "площадь полной поверхности", Sax: "площадь осевого сечения", V: "объём",
  tilt: "угол между образующей и плоскостью основания", apex: "угол при вершине осевого сечения" };
/* степень по длине: 1 — длина, 2 — площадь, 3 — объём, 0 — угол (от масштаба не зависит) */
const QPOW = { r: 1, d: 1, h: 1, l: 1, C: 1, Sb: 2, Slat: 2, Sfull: 2, Sax: 2, V: 3, tilt: 0, apex: 0 };
const R_ONLY = new Set(["r", "d", "C", "Sb"]);   /* зависят только от радиуса */
const SHAPE_ONLY = new Set(["tilt", "apex"]);      /* зависят только от формы */

/* ============================================================
   3. Численная модель конуса
   Основание — окружность радиуса r в плоскости z = 0 с центром O,
   вершина S = (0, 0, h). В окружность вписан правильный n-угольник;
   все n треугольников основания, n боковых граней и n тетраэдров
   S–O–B_i–B_(i+1) конгруэнтны (поворот вокруг оси), поэтому сумма
   равна n × один элемент. Каждая величина считается при n = 2048
   и n = 4096, затем экстраполяция Ричардсона: у вписанной пирамиды
   погрешность периметра, площадей и объёма — ряд по 1/n², первый
   член уходит.
   ============================================================ */
const N_LO = 2048, N_HI = 4096;
const rich = f => (4 * f(N_HI) - f(N_LO)) / 3;
const O0 = [0, 0, 0];
/* i-я вершина правильного n-угольника, вписанного в окружность радиуса r */
function rimPt(r, n, i) {
  const t = 2 * Math.PI * i / n;   /* только расстановка вершин по кругу */
  return [r * Math.cos(t), r * Math.sin(t), 0];
}

function coneQ(q, r, h) {
  const S = [0, 0, h], B0 = rimPt(r, 2, 0), B1 = rimPt(r, 2, 1);   /* B0, B1 — концы диаметра */
  switch (q) {
    case "r": return dist(O0, B0);
    case "d": return dist(B0, B1);
    case "h": return dist(O0, S);
    case "l": return dist(S, B0);
    case "C": return rich(n => n * dist(rimPt(r, n, 0), rimPt(r, n, 1)));
    case "Sb": return rich(n => n * triArea(O0, rimPt(r, n, 0), rimPt(r, n, 1)));
    case "Slat": return rich(n => n * triArea(S, rimPt(r, n, 0), rimPt(r, n, 1)));
    case "Sfull": return coneQ("Sb", r, h) + coneQ("Slat", r, h);
    case "V": return rich(n => n * tetVol(S, O0, rimPt(r, n, 0), rimPt(r, n, 1)));
    case "Sax": return triArea(S, B0, B1);
    case "tilt": return angleAt(B0, S, O0);     /* угол SB0O: образующая и радиус (след плоскости) */
    case "apex": return angleAt(S, B0, B1);
  }
  throw new Error("неизвестная величина конуса: " + q);
}

/* объём части конуса между двумя полуплоскостями через ось, угол deg между ними:
   тетраэдры S–O–B_j–B_(j+1) над дугой deg, разбитой на n равных частей */
function partVol(r, h, deg) {
  const S = [0, 0, h], phi = deg / RAD2DEG;
  return rich(n => n * tetVol(S, O0, [r, 0, 0], [r * Math.cos(phi / n), r * Math.sin(phi / n), 0]));
}

/* радиус сечения плоскостью, параллельной основанию, на расстоянии t от вершины:
   расстояние от оси до точки, где образующая SB0 пересекает плоскость z = h − t */
function sectionRadius(r, h, t) {
  const S = [0, 0, h], B0 = [r, 0, 0], z = h - t;
  const u = (S[2] - z) / (S[2] - B0[2]);            /* параметр точки на отрезке S → B0 */
  const X = add(S, scl(sub(B0, S), u));
  return dist(X, [0, 0, z]);
}

/* площадь сферы: вписанный многогранник «широта — долгота» (M поясов, 2M меридианов);
   четырёхугольник пояса — равнобочная трапеция (плоская), считается двумя треугольниками;
   все 2M клеток одного пояса конгруэнтны */
function sphereArea(R) {
  const sp = (th, ph) => [R * Math.sin(th) * Math.cos(ph), R * Math.sin(th) * Math.sin(ph), R * Math.cos(th)];
  return rich(M => {
    const N = 2 * M, dp = 2 * Math.PI / N;
    return N * nsum(M, j => {
      const t0 = Math.PI * j / M, t1 = Math.PI * (j + 1) / M;
      const a = sp(t0, 0), b = sp(t0, dp), c = sp(t1, 0), d = sp(t1, dp);
      return triArea(a, c, d) + triArea(a, d, b);
    });
  });
}

/* бисекция для монотонной f: f(x) = target на [lo, hi] */
function solveMono(f, target, lo, hi, what) {
  let flo = f(lo) - target;
  const fhi = f(hi) - target;
  if (!(Number.isFinite(flo) && Number.isFinite(fhi)) || flo * fhi > 0)
    throw new Error(`нет решения (${what}): на [${fmt(lo)}; ${fmt(hi)}] значения ${fmt(flo + target)}…${fmt(fhi + target)}, нужно ${fmt(target)}`);
  if (flo === 0) return lo;
  if (fhi === 0) return hi;
  for (let i = 0; i < 400; i++) {
    const mid = (lo + hi) / 2;
    if (mid === lo || mid === hi) break;
    const fm = f(mid) - target;
    if (fm === 0) return mid;
    if ((fm < 0) === (flo < 0)) { lo = mid; flo = fm; } else hi = mid;
  }
  return (lo + hi) / 2;
}
const BIG = 1e6, TINY = 1e-12;

/* высота конуса по радиусу и образующей */
const hFromRL = (r, l) => solveMono(x => coneQ("l", r, x), l, 0, BIG, "высота по радиусу и образующей");

/* радиус шара, вписанного в конус: центр на оси на высоте z, касается основания
   (расстояние до него z) и образующей (расстояние до прямой SB0) */
function inscribedRadius(r, h) {
  const S = [0, 0, h], B0 = [r, 0, 0];
  return solveMono(z => distToLine([0, 0, z], S, B0) - z, 0, 0, h, "радиус вписанного шара");
}

/* конус по двум данным величинам — всё бисекцией по численной модели */
function coneSystem(known) {
  const rk = known.filter(k => R_ONLY.has(k.q));
  const hk = known.filter(k => k.q === "h");
  const rest = known.filter(k => !R_ONLY.has(k.q) && k.q !== "h");
  if (known.length !== 2 || rk.length > 1 || hk.length > 1)
    throw new Error("модель конуса ждёт ровно две независимые величины: " + known.map(k => k.q).join(", "));
  let r = null, h = null, how;
  if (rk.length) r = solveMono(x => coneQ(rk[0].q, x, 1), rk[0].v, TINY, BIG, "радиус по " + QNAME[rk[0].q]);
  if (hk.length) h = solveMono(x => coneQ("h", 1, x), hk[0].v, 0, BIG, "высота");
  if (r !== null && h !== null) how = "r и h даны";
  else if (r !== null) {
    const k = rest[0];
    h = solveMono(x => coneQ(k.q, r, x), k.v, 0, BIG, `высота по радиусу и ${QNAME[k.q]}`);
    how = `h — бисекцией по величине «${QNAME[k.q]}»`;
  } else if (h !== null) {
    const k = rest[0];
    r = solveMono(x => coneQ(k.q, x, h), k.v, TINY, BIG, `радиус по высоте и ${QNAME[k.q]}`);
    how = `r — бисекцией по величине «${QNAME[k.q]}»`;
  } else {
    const shape = rest.find(k => SHAPE_ONLY.has(k.q)), size = rest.find(k => !SHAPE_ONLY.has(k.q));
    if (!shape || !size) throw new Error("две величины не задают конус: " + rest.map(k => k.q).join(", "));
    const t = solveMono(x => coneQ(shape.q, 1, x), shape.v, 0, BIG, "форма по " + QNAME[shape.q]);   /* h/r */
    const lam = solveMono(x => coneQ(size.q, x, x * t), size.v, TINY, BIG, "размер по " + QNAME[size.q]);
    r = lam; h = lam * t;
    how = `форма — бисекцией по величине «${QNAME[shape.q]}», размер — по «${QNAME[size.q]}»`;
  }
  return { r, h, how };
}
const derivedOf = c => ({ r: c.r, h: c.h, l: coneQ("l", c.r, c.h), d: coneQ("d", c.r, c.h) });

/* ответ, который не должен зависеть от неданного размера: считается на нескольких
   конусах и обязан совпасть */
function invariant(f, variants, what) {
  const vals = variants.map(v => f(v));
  for (let i = 1; i < vals.length; i++)
    if (!(relDiff(vals[i], vals[0]) <= TOL_FREE))
      throw new Error(`ответ зависит от неданного размера (${what}): ${vals.map(fmt).join(" ≠ ")}`);
  return vals[0];
}

/* Самопроверка численной модели. Формулы здесь — ТОЛЬКО эталон, с которым
   сверяется численный метод; ответы задач ими не считаются. */
function modelSelfCheck() {
  const PI = Math.PI, tol = 1e-11;
  const cases = [
    ["V(3,4)", coneQ("V", 3, 4), PI * 9 * 4 / 3],
    ["Sb(3)", coneQ("Sb", 3, 4), 9 * PI],
    ["C(3)", coneQ("C", 3, 4), 6 * PI],
    ["Sбок(3,4)", coneQ("Slat", 3, 4), PI * 3 * 5],
    ["Sполн(0,7;2,9)", coneQ("Sfull", 0.7, 2.9), PI * 0.7 * (0.7 + Math.hypot(0.7, 2.9))],
    ["Sос(3,4)", coneQ("Sax", 3, 4), 12],
    ["l(3,4)", coneQ("l", 3, 4), 5],
    ["наклон(1,√3)", coneQ("tilt", 1, Math.sqrt(3)), 60],
    ["угол при вершине(3,3)", coneQ("apex", 3, 3), 90],
    ["часть 90°(9,13)", partVol(9, 13, 90), PI * 81 * 13 / 12],
    ["часть 300°(9,27)", partVol(9, 27, 300), PI * 81 * 27 / 3 * 5 / 6],
    ["сфера(2)", sphereArea(2), 16 * PI],
    ["сечение(3,4; t=2)", sectionRadius(3, 4, 2), 1.5],
    ["вписанный шар(3; 3√3)", inscribedRadius(3, 3 * Math.sqrt(3)), Math.sqrt(3)],
    ["h по r=3, l=5", hFromRL(3, 5), 4]
  ];
  const bad = cases.filter(([, got, want]) => !(relDiff(got, want) <= tol));
  if (bad.length)
    throw new Error("численная модель расходится с эталоном: " +
      bad.map(([n, g, w]) => `${n}: ${fmt(g)} вместо ${fmt(w)}`).join("; "));
}

/* ============================================================
   4. Сцена задачи — как её собирает тренажёр
   ============================================================ */
const KIND_NAME = { cone: "конус", sphere: "шар", cyl: "цилиндр", box: "параллелепипед",
  prism: "призма", pyramid: "пирамида" };

/* тело сцены: конус или шар из его собственных точек и поверхностей */
function bodyOf(g, pr, i, E) {
  const kind = pr && pr.kind;
  const px = (pr && pr.px) || "";
  const what = `(${KIND_NAME[kind] || kind}${g.ghost ? "-призрак" : ""}${g.hideLabels ? ", без букв" : ""})`;
  const tag = `тело ${i + 1} ${what}`, tagGen = `тела ${i + 1} ${what}`;
  const b = { i, kind, tag, tagGen, g, ghost: !!g.ghost, hide: !!g.hideLabels, px };
  const pts = g.pts || {};
  if (kind === "cone") {
    const nm = { O: "O" + px, S: "S" + px, P: "P" + px, Q: "Q" + px, A: "A" + px, B: "B" + px };
    b.names = nm;
    const surf = (g.surfaces || []).find(s => s && s.type === "cone");
    if (!surf) { E(`${tag}: нет поверхности конуса`); return null; }
    const O = pts[nm.O], S = pts[nm.S], P = pts[nm.P], Q = pts[nm.Q];
    /* у части конуса точки целого конуса P, Q в вырезе не рисуются (engine.js,
       с 24.09.2026) — тогда радиус сверяется по краю части A */
    const part = surf.tl != null;
    const R0 = isPt(P) ? P : part && isPt(pts[nm.A]) ? pts[nm.A] : null, nR = isPt(P) ? nm.P : nm.A;
    if (!isPt(O) || !isPt(S) || !R0) { E(`${tag}: нет точек ${nm.O}, ${nm.S}, ${part ? nm.P + " (или " + nm.A + ")" : nm.P}`); return null; }
    const r = surf.r, h = surf.h, flip = !!surf.flip;
    const ok = (x, y) => Math.abs(x - y) <= TOL_SHAPE * Math.max(1, r, h);
    const bad = [];
    const axis = sub(S, O);
    if (!(ok(axis[0], 0) && ok(axis[1], 0))) bad.push(`ось ${nm.O}${nm.S} не вертикальна`);
    if (!ok(norm(axis), h)) bad.push(`|${nm.O}${nm.S}| = ${fmt(norm(axis))}, а высота поверхности ${fmt(h)}`);
    if ((axis[2] < 0) !== flip) bad.push(`вершина ${nm.S} ${axis[2] < 0 ? "внизу" : "вверху"}, а поверхность ${flip ? "перевёрнута" : "не перевёрнута"}`);
    if (!ok(dist(scl(add(O, S), 0.5), surf.c), 0)) bad.push(`центр поверхности не в середине ${nm.O}${nm.S}`);
    if (!ok(dist(O, R0), r)) bad.push(`|${nm.O}${nR}| = ${fmt(dist(O, R0))}, а радиус поверхности ${fmt(r)}`);
    if (!ok(dot(sub(R0, O), axis) / Math.max(h, 1e-300), 0)) bad.push(`${nm.O}${nR} не перпендикулярен оси`);
    if (isPt(Q) && !(ok(dist(O, Q), r) && (!isPt(P) || ok(dist(scl(add(P, Q), 0.5), O), 0))))
      bad.push(`${nm.P}${nm.Q} — не диаметр основания`);
    const baseC = (g.circles || []).find(c => c && !c.col && isPt(c.c) && ok(dist(c.c, O), 0));
    if (!baseC || !ok(baseC.r, r)) bad.push("окружность основания не совпадает с поверхностью");
    if (pr && !(relDiff(pr.r, r) <= TOL_SHAPE && relDiff(pr.h, h) <= TOL_SHAPE))
      bad.push(`в scene.prims r = ${fmt(pr.r)}, h = ${fmt(pr.h)}, а нарисован r = ${fmt(r)}, h = ${fmt(h)}`);
    if (bad.length) E(`${tag} — не конус: ${bad.join("; ")}`);
    Object.assign(b, {
      O, S, P, Q, r, h, flip, surf, baseC, ok,
      sect: (g.circles || []).filter(c => c && c.col === "amber"),
      waterC: (g.circles || []).find(c => c && c.col === "water"),
      waterCone: (g.surfaces || []).find(s => s && s.type === "waterCone"),
      discs: (g.surfaces || []).filter(s => s && s.type === "disc"),
      A: pts[nm.A], B: pts[nm.B]
    });
    return b;
  }
  if (kind === "sphere") {
    const surf = (g.surfaces || []).find(s => s && s.type === "sphere");
    const nm = { O: "O" + px, P: "P" + px };
    b.names = nm;
    if (!surf || !isPt(surf.c)) { E(`${tag}: нет поверхности шара`); return null; }
    const O = pts[nm.O], P = pts[nm.P];
    const ok = (x, y) => Math.abs(x - y) <= TOL_SHAPE * Math.max(1, surf.r);
    const bad = [];
    if (!isPt(O) || !ok(dist(O, surf.c), 0)) bad.push(`${nm.O} не в центре`);
    if (!isPt(P) || !ok(dist(surf.c, P), surf.r)) bad.push(`${nm.P} не на сфере`);
    if (pr && !(relDiff(pr.r, surf.r) <= TOL_SHAPE)) bad.push(`в scene.prims r = ${fmt(pr.r)}, нарисован ${fmt(surf.r)}`);
    if (bad.length) E(`${tag} — не шар: ${bad.join("; ")}`);
    Object.assign(b, { O, P, R: surf.r, c: surf.c, surf });
    return b;
  }
  return b;   /* другие тела в теме «Конус» не нужны: просто учитываются в словаре точек */
}

function sceneOf(p, E) {
  let sd;
  try { sd = sceneData(p); }
  catch (e) { E(`sceneData упала: ${e.message}`); return null; }
  const gen = Array.from((sd && sd.gen) || []);
  if (!gen.length) { E("sceneData вернула пустую сцену"); return null; }
  const prims = (p.scene && Array.isArray(p.scene.prims)) ? p.scene.prims : null;
  if (!prims) { E("у старой задачи нет scene.prims"); return null; }
  if (prims.length !== gen.length) E(`в scene.prims тел ${prims.length}, на сцене ${gen.length}`);
  /* конечность координат */
  gen.forEach((g, gi) => {
    for (const [nm, pt] of Object.entries(g.pts || {}))
      if (!isPt(pt)) E(`тело ${gi + 1}: точка ${nm} — не конечные координаты`);
    (g.circles || []).forEach((c, i) => { if (!c || !isPt(c.c) || !Number.isFinite(c.r)) E(`тело ${gi + 1}: окружность ${i + 1} — не конечные центр или радиус`); });
    (g.surfaces || []).forEach((sf, i) => {
      if (!sf || !isPt(sf.c) || !Number.isFinite(sf.r) || (sf.h != null && !Number.isFinite(sf.h)))
        E(`тело ${gi + 1}: поверхность ${i + 1} (${sf && sf.type}) — не конечные размеры`);
    });
  });
  /* общий словарь точек, как в trainer.js (buildScene): тела по порядку, последнее выигрывает */
  const pts = {}, owners = {};
  gen.forEach((g, gi) => {
    for (const [nm, pt] of Object.entries(g.pts || {})) {
      if (!isPt(pt)) continue;
      (owners[nm] = owners[nm] || []).push({ i: gi, pt });
      pts[nm] = pt;
    }
  });
  const bodies = gen.map((g, gi) => bodyOf(g, prims[gi], gi, E)).filter(Boolean);
  const cones = bodies.filter(b => b.kind === "cone" && b.O);
  const spheres = bodies.filter(b => b.kind === "sphere" && b.c);
  const main = cones.find(b => !b.ghost) || cones[0] || null;
  /* точка «задумана» у первого тела, чьи буквы показываются (иначе — у первого владельца);
     «угнана», если в словаре тренажёра её место заняла точка другого тела */
  const intended = nm => {
    const list = owners[nm] || [];
    return list.find(o => !gen[o.i].hideLabels) || list[0];
  };
  const hijacked = nm => {
    const list = owners[nm] || [];
    if (list.length < 2) return null;
    const want = intended(nm), got = list[list.length - 1];
    if (want.i === got.i || dist(want.pt, got.pt) <= 1e-12) return null;
    return { want, got };
  };
  const cst = p.construct || {};
  return {
    sd, gen, prims, pts, owners, bodies, cones, spheres, main, intended, hijacked,
    segs: Array.isArray(cst.segments) ? cst.segments : [],
    fills: Array.isArray(cst.fills) ? cst.fills : [],
    tagOf: i => (bodies.find(b => b.i === i) || { tag: `тело ${i + 1}` }).tag,
    tagGen: i => (bodies.find(b => b.i === i) || { tagGen: `тела ${i + 1}` }).tagGen
  };
}

/* какую величину конуса изображает отрезок ab (по именам точек этого конуса) */
function roleOf(a, b, nm) {
  const s = new Set([a, b]);
  const rim = [nm.P, nm.Q, nm.A, nm.B];
  if (s.has(nm.S) && s.has(nm.O)) return "h";
  if (s.has(nm.O) && rim.some(x => s.has(x))) return "r";
  if (s.has(nm.S) && rim.some(x => s.has(x))) return "l";
  if (s.has(nm.P) && s.has(nm.Q)) return "d";
  return null;
}

/* ============================================================
   5. Модели задач
   Каждая модель: name, re (шаблон на всё условие), solve(m, p, S) →
   { ans, info, cones, spheres, derived?, byPicture?, geo(x) }.
   solve получает сцену S только ради данных ПО РИСУНКУ (помечено).
   ============================================================ */
const MODELS = [];

/* --- один конус: две величины даны, одна спрошена --- */
function oneCone(name, text, keys, ask, divPi) {
  MODELS.push({
    name, re: tpl(text),
    solve(m) {
      const known = keys.map((k, j) => {
        const piMul = k.endsWith("π"), q = piMul ? k.slice(0, -1) : k;
        return { q, v: numOf(m[j + 1]) * (piMul ? Math.PI : 1), shown: m[j + 1] + (piMul ? "π" : "") };
      });
      const c = coneSystem(known);
      const div = divPi ? Math.PI : 1;
      const ans = coneQ(ask, c.r, c.h) / div;
      return {
        ans, cones: 1, spheres: 0, derived: derivedOf(c),
        info: `${known.map(k => `${QNAME[k.q]} ${k.shown}`).join(", ")} → r = ${fmt(c.r)}, h = ${fmt(c.h)} (${c.how}) → ${QNAME[ask]}${divPi ? "/π" : ""}`,
        geo(x) {
          for (const k of known) x.coneFact(k.q, k.v, "условие");
          x.coneFact(ask, ans * div, "ответ по условию");
          if (ask === "Sax") x.axialFill(ans * div);
        }
      };
    }
  });
}
oneCone("объём по образующей и углу наклона",
  "Найдите объём V конуса, образующая которого равна {N} и наклонена к плоскости основания под углом {N}°. В ответе укажите V/π.",
  ["l", "tilt"], "V", true);
oneCone("объём по высоте и образующей",
  "Высота конуса равна {N}, образующая равна {N}. Найдите его объём, делённый на π.",
  ["h", "l"], "V", true);
oneCone("объём по диаметру и углу при вершине осевого сечения",
  "Диаметр основания конуса равен {N}, а угол при вершине осевого сечения равен {N}°. Вычислите объём конуса, делённый на π.",
  ["d", "apex"], "V", true);
oneCone("боковая поверхность по длине окружности и образующей",
  "Длина окружности основания конуса равна {N}, образующая равна {N}. Найдите площадь боковой поверхности конуса.",
  ["C", "l"], "Slat", false);
oneCone("полная поверхность по высоте и образующей",
  "Высота конуса равна {N}, образующая равна {N}. Найдите площадь его полной поверхности, делённую на π.",
  ["h", "l"], "Sfull", true);
oneCone("полная поверхность по радиусу и высоте",
  "Радиус основания конуса равен {N}, высота равна {N}. Найдите площадь полной поверхности конуса, делённую на π.",
  ["r", "h"], "Sfull", true);
oneCone("образующая по высоте и диаметру",
  "Высота конуса равна {N}, а диаметр основания — {N}. Найдите образующую конуса.",
  ["h", "d"], "l", false);
oneCone("диаметр по высоте и образующей",
  "Высота конуса равна {N}, а длина образующей — {N}. Найдите диаметр основания конуса.",
  ["h", "l"], "d", false);
oneCone("высота по диаметру и образующей",
  "Диаметр основания конуса равен {N}, а длина образующей — {N}. Найдите высоту конуса.",
  ["d", "l"], "h", false);
oneCone("осевое сечение по площади основания (kπ) и высоте",
  "Площадь основания конуса равна {N}π, высота — {N}. Найдите площадь осевого сечения конуса.",
  ["Sbπ", "h"], "Sax", false);
oneCone("осевое сечение по высоте и образующей",
  "Высота конуса равна {N}, а длина образующей — {N}. Найдите площадь осевого сечения этого конуса.",
  ["h", "l"], "Sax", false);
oneCone("осевое сечение по диаметру и образующей",
  "Диаметр основания конуса равен {N}, а длина образующей — {N}. Найдите площадь осевого сечения этого конуса.",
  ["d", "l"], "Sax", false);
oneCone("осевое сечение по радиусу и образующей",
  "Найдите площадь осевого сечения конуса, радиус основания которого равен {N}, а образующая равна {N}.",
  ["r", "l"], "Sax", false);

/* --- конус вращения равнобедренного прямоугольного треугольника вокруг катета --- */
MODELS.push({
  name: "вращение равнобедренного прямоугольного треугольника вокруг катета",
  re: tpl("Конус получается при вращении равнобедренного прямоугольного треугольника ABC вокруг катета, равного {N}. Найдите его объём, делённый на π."),
  solve(m) {
    const a = numOf(m[1]);
    /* прямой угол при C, катеты CA и CB по осям; равнобедренный — катеты равны */
    const C = [0, 0, 0], A = [a, 0, 0], B = [0, 0, a];
    if (Math.abs(dot(sub(A, C), sub(B, C))) > 1e-12) throw new Error("угол C не прямой");
    const h = dist(C, B), r = dist(C, A);   /* ось вращения — катет CB, другой катет — радиус */
    const ans = coneQ("V", r, h) / Math.PI;
    return {
      ans, cones: 1, spheres: 0, derived: derivedOf({ r, h }),
      info: `катет-ось ${fmt(h)}, второй катет (радиус) ${fmt(r)} → V/π`,
      geo(x) {
        x.coneFact("h", h, "условие (катет — ось)");
        x.coneFact("r", r, "условие (второй катет)");
        x.coneFact("V", ans * Math.PI, "ответ по условию");
      }
    };
  }
});

/* --- во сколько раз изменится объём / боковая поверхность --- */
const qOfPhrase = s => (/высот/.test(s) ? "h" : /радиус/.test(s) ? "r" : /образующ/.test(s) ? "l" : null);
MODELS.push({
  name: "во сколько раз изменится величина при изменении размера",
  re: new RegExp("^" + normText(
    "Во сколько раз (увеличится|уменьшится) (объём|площадь боковой поверхности) конуса, если " +
    "(его высота|радиус его основания|его образующая) (увеличится|уменьшится) в (" + NUMW + ") раза?, " +
    "а (высота|радиус основания|образующая) останется прежн(?:ей|им)\\?") + "$"),
  solve(m) {
    const dirQ = m[1], Q = /объем/.test(m[2]) ? "V" : "Slat";
    const chg = qOfPhrase(m[3]), dirC = m[4], k = numOf(m[5]), fix = qOfPhrase(m[6]);
    const pair = [chg, fix].sort().join("");
    if (pair !== "hr" && pair !== "lr") throw new Error(`пара «${chg}, ${fix}» не задаёт конус`);
    const f = dirC === "увеличится" ? k : 1 / k;
    const toRH = c => (pair === "hr" ? { r: c.r, h: c.h } : { r: c.r, h: hFromRL(c.r, c.l) });
    const variants = pair === "hr" ? [{ r: 2, h: 5 }, { r: 7, h: 3 }] : [{ r: 1, l: 5 }, { r: 2, l: 7 }];
    const ans = invariant(v => {
      const nv = Object.assign({}, v); nv[chg] *= f;
      const a = toRH(v), b = toRH(nv);
      const q0 = coneQ(Q, a.r, a.h), q1 = coneQ(Q, b.r, b.h);
      return dirQ === "увеличится" ? q1 / q0 : q0 / q1;
    }, variants, "размеры исходного конуса");
    if (!(ans > 1)) throw new Error(`в вопросе «${dirQ}», а пересчёт даёт отношение ${fmt(ans)}`);
    return {
      ans, cones: 2, spheres: 0,
      info: `${QNAME[chg]} ×${fmt(f)}, ${QNAME[fix]} — без изменений → ${QNAME[Q]}: отношение на двух разных конусах`,
      geo(x) {
        const b0 = x.main, b1 = x.S.cones.find(b => b !== b0);
        if (!b1) return;
        x.R({ what: `${QNAME[chg]}: ${b1.tag} / ${b0.tag}`, got: coneQ(chg, b1.r, b1.h) / coneQ(chg, b0.r, b0.h), want: f });
        x.R({ what: `${QNAME[fix]}: ${b1.tag} / ${b0.tag}`, got: coneQ(fix, b1.r, b1.h) / coneQ(fix, b0.r, b0.h), want: 1 });
      }
    };
  }
});

/* --- боковая поверхность в k раз больше основания: угол наклона образующей --- */
MODELS.push({
  name: "Sбок = k·Sосн: угол между образующей и основанием",
  re: tpl("Площадь боковой поверхности конуса в {W} раза больше площади основания. Найдите угол между образующей конуса и плоскостью основания. Ответ дайте в градусах."),
  solve(m) {
    const k = numOf(m[1]);
    const ans = invariant(r => {
      const h = solveMono(x => coneQ("Slat", r, x) / coneQ("Sb", r, x), k, 0, BIG, "высота по отношению поверхностей");
      return coneQ("tilt", r, h);
    }, [1, 5], "радиус основания");
    return {
      ans, cones: 1, spheres: 0,
      info: `Sбок/Sосн = ${fmt(k)} → форма бисекцией (на двух радиусах) → угол`,
      geo(x) {
        const b = x.main;
        x.R({ what: "Sбок / Sосн нарисованного конуса", got: coneQ("Slat", b.r, b.h) / coneQ("Sb", b.r, b.h), want: k });
        x.coneFact("tilt", ans, "ответ по условию");
      }
    };
  }
});

/* --- сечение, параллельное основанию: отсечённый конус --- */
function cutModel(given, a, total, ask) {
  const f = a / total;   /* доля высоты от вершины до секущей плоскости */
  const ans = invariant(([r, h]) => {
    const t = f * h;
    const rho = sectionRadius(r, h, t);                   /* отсечённый конус: высота t, радиус rho */
    return given.v * coneQ(ask, rho, t) / coneQ(given.q, r, h);
  }, [[2, 5], [7, 3]], "форма и размеры конуса");
  return {
    ans, cones: 1, spheres: 0,
    info: `${QNAME[given.q]} ${fmt(given.v)}, плоскость на доле ${fmt(f)} высоты от вершины → ${QNAME[ask]} отсечённого конуса (на двух разных конусах)`,
    geo(x) {
      const sec = x.sectionAt(f);
      x.coneFact(given.q, given.v, "условие");
      if (sec) x.F({ what: `${QNAME[ask]} отсечённого конуса на чертеже`, scene: coneQ(ask, sec.rho, sec.t), want: ans, pow: QPOW[ask], src: "ответ по условию" });
    }
  };
}
MODELS.push({
  name: "сечение через середину высоты: объём меньшего конуса",
  re: tpl("Объём конуса равен {N}. Через середину высоты параллельно основанию конуса проведено сечение, которое является основанием меньшего конуса с той же вершиной. Найдите объём меньшего конуса."),
  solve: m => cutModel({ q: "V", v: numOf(m[1]) }, 1, 2, "V")
});
MODELS.push({
  name: "сечение в отношении a : b от вершины: полная поверхность отсечённого конуса",
  re: tpl("Площадь полной поверхности конуса равна {N}. Параллельно основанию конуса проведено сечение, делящее высоту в отношении {N} : {N}, считая от вершины конуса. Найдите площадь полной поверхности отсечённого конуса."),
  solve: m => cutModel({ q: "Sfull", v: numOf(m[1]) }, numOf(m[2]), numOf(m[2]) + numOf(m[3]), "Sfull")
});
MODELS.push({
  name: "площадь сечения по площади основания и отрезкам высоты",
  re: tpl("Площадь основания конуса равна {N}. Плоскость, параллельная плоскости основания конуса, делит его высоту на отрезки длиной {N} и {N}, считая от вершины. Найдите площадь сечения конуса этой плоскостью."),
  solve(m) {
    const Sb = numOf(m[1]), t1 = numOf(m[2]), t2 = numOf(m[3]);
    const H = t1 + t2;
    const r = solveMono(x => coneQ("Sb", x, H), Sb, TINY, BIG, "радиус по площади основания");
    const rho = sectionRadius(r, H, t1);
    const ans = coneQ("Sb", rho, t1);    /* круг сечения — «основание» конуса радиуса rho */
    return {
      ans, cones: 1, spheres: 0, derived: derivedOf({ r, h: H }),
      info: `Sосн ${fmt(Sb)} → r = ${fmt(r)}; H = ${fmt(t1)} + ${fmt(t2)}; радиус сечения ${fmt(rho)} → его площадь`,
      geo(x) {
        const sec = x.sectionAt(t1 / H);
        x.coneFact("Sb", Sb, "условие");
        if (!sec) return;
        x.F({ what: "расстояние от вершины до секущей плоскости", scene: sec.t, want: t1, pow: 1, src: "условие" });
        x.F({ what: "расстояние от секущей плоскости до основания", scene: x.main.h - sec.t, want: t2, pow: 1, src: "условие" });
        x.F({ what: "площадь сечения на чертеже", scene: coneQ("Sb", sec.rho, 1), want: ans, pow: 2, src: "ответ по условию" });
      }
    };
  }
});

/* --- сосуд-конус: сколько долить --- */
MODELS.push({
  name: "сосуд-конус: сколько жидкости долить",
  re: tpl("В сосуде, имеющем форму конуса, уровень жидкости достигает {F} высоты. Объём жидкости равен {N} мл. Сколько миллилитров жидкости нужно долить, чтобы полностью наполнить сосуд?"),
  needsScene: true,
  solve(m, p, S) {
    const f = numOf(m[1]), Vl = numOf(m[2]);
    /* ПО РИСУНКУ: текст не говорит, как стоит сосуд; ориентация — с чертежа.
       Вершиной вниз — жидкость есть конус с той же вершиной высотой f·H;
       вершиной вверх — жидкость есть весь конус без верхнего конуса высотой (1 − f)·H. */
    const flip = !!(S.main && S.main.flip);
    const ans = invariant(([r, H]) => {
      const lvl = f * H, vessel = coneQ("V", r, H);
      const liq = flip ? coneQ("V", sectionRadius(r, H, lvl), lvl)
        : vessel - coneQ("V", sectionRadius(r, H, H - lvl), H - lvl);
      return Vl * vessel / liq - Vl;     /* сосуд подобен модели: объём сосуда = Vl · (сосуд / жидкость) */
    }, [[2, 5], [7, 3]], "форма и размеры сосуда");
    return {
      ans, cones: 1, spheres: 0, byPicture: true,
      info: `уровень ${fmt(f)} высоты, жидкость ${fmt(Vl)}; сосуд ${flip ? "вершиной вниз" : "вершиной вверх"} (по рисунку) → долить`,
      geo(x) {
        const w = x.waterAt(f);
        if (!w) return;
        x.F({ what: "объём жидкости на чертеже", scene: coneQ("V", w.rho, w.lvl), want: Vl, pow: 3, src: "условие" });
        x.F({ what: "объём, который нужно долить, на чертеже", scene: coneQ("V", x.main.r, x.main.h) - coneQ("V", w.rho, w.lvl), want: ans, pow: 3, src: "ответ по условию" });
      }
    };
  }
});

/* --- шар, вписанный в конус --- */
MODELS.push({
  name: "шар, вписанный в конус: площадь его поверхности",
  re: tpl("Шар вписан в конус. Радиус основания конуса равен {N}, а образующая равна {N}. Найдите площадь поверхности шара, делённую на π."),
  solve(m) {
    const r = numOf(m[1]), l = numOf(m[2]);
    const c = coneSystem([{ q: "r", v: r }, { q: "l", v: l }]);
    const rho = inscribedRadius(c.r, c.h);
    const ans = sphereArea(rho) / Math.PI;
    return {
      ans, cones: 1, spheres: 1, derived: derivedOf(c),
      info: `r = ${fmt(r)}, l = ${fmt(l)} → h = ${fmt(c.h)}; центр шара на оси, касание бисекцией → ρ = ${fmt(rho)} → Sсферы/π`,
      geo(x) {
        x.coneFact("r", r, "условие");
        x.coneFact("l", l, "условие");
        const sp = x.S.spheres[0], b = x.main;
        if (!sp) return;
        x.F({ what: "радиус нарисованного шара", scene: sp.R, want: rho, pow: 1, src: "выведено из условия" });
        x.F({ what: "площадь поверхности нарисованного шара", scene: sphereArea(sp.R), want: ans * Math.PI, pow: 2, src: "ответ по условию" });
        /* вписанность — по нарисованным телам, без масштаба */
        if (distToLine(sp.c, b.O, b.S) > TOL_SHAPE * Math.max(1, b.r, b.h)) x.E(`центр шара не на оси конуса`);
        x.R({ what: "высота центра шара над основанием / радиус шара", got: Math.abs(sp.c[2] - b.O[2]) / sp.R, want: 1 });
        x.R({ what: "радиус шара / радиус шара, вписанного в нарисованный конус", got: sp.R / inscribedRadius(b.r, b.h), want: 1 });
      }
    };
  }
});

/* --- часть конуса, изображённая на рисунке --- */
MODELS.push({
  name: "часть конуса по рисунку",
  re: tpl("Найдите объём V части конуса, изображённой на рисунке. В ответе укажите V/π."),
  needsScene: true,
  solve(m, p, S) {
    const b = S.main;
    if (!b) throw new Error("на чертеже нет конуса");
    /* ПО РИСУНКУ: в тексте чисел нет. Высота и радиус — из подписей labels
       на отрезках «вершина — центр основания» и «центр — точка окружности». */
    let h = null, r = null;
    for (const [a, c, t] of (p.labels || [])) {
      const v = labelNum(t), role = roleOf(a, c, b.names);
      if (v === null || !role) continue;
      if (role === "h") { if (h !== null) throw new Error("на рисунке две подписи высоты"); h = v; }
      if (role === "r") { if (r !== null) throw new Error("на рисунке две подписи радиуса"); r = v; }
    }
    if (h === null || r === null) throw new Error("на рисунке нет подписей высоты SO и радиуса");
    /* ПО РИСУНКУ: угол — подпись «α°» (coordLabels). Какой из двух углов (α или 360° − α)
       занимает тело, ученик видит по тому, где стоит подпись: внутри нарисованной
       части — это угол части, в вырезе — угол выреза. */
    const al = (b.g.coordLabels || []).filter(l => l && /^\s*\d+(?:,\d+)?\s*°\s*$/.test(String(l.t)));
    if (al.length !== 1) throw new Error(`подписей угла на рисунке ${al.length}, нужна одна`);
    const alpha = numOf(String(al[0].t).replace("°", ""));
    const lp = scl(add(al[0].p, al[0].q), 0.5);
    const th = thetaOf(lp, b.O);
    const inside = inSector(th, b.surf.ts || 0, b.surf.tl == null ? 2 * Math.PI : b.surf.tl);
    const kept = inside ? alpha : 360 - alpha;
    const ans = partVol(r, h, kept) / Math.PI;
    return {
      ans, cones: 1, spheres: 0, byPicture: true, derived: derivedOf({ r, h }),
      info: `по рисунку: h = ${fmt(h)}, r = ${fmt(r)}, подпись угла ${fmt(alpha)}° стоит ${inside ? "внутри нарисованной части" : "в вырезе"} → часть ${fmt(kept)}° → V/π`,
      geo(x) { x.partCone(kept, alpha, inside); }
    };
  }
});

/* Угол точки вокруг оси конуса в той же параметризации, что у поверхностей тренажёра.
   THREE.CylinderGeometry кладёт вершину угла θ в (x, z)мир = (R·sinθ, R·cosθ);
   toW переводит (x, y, z)задачи → (x, z, −y)мир, значит в координатах задачи
   точка угла θ — (R·sinθ, −R·cosθ). CircleGeometry с rotation.x = π/2 кладёт
   угол φ в (R·cosφ, −R·sinφ) задачи, то есть φ = π/2 − θ. */
function thetaOf(pt, O) {
  const x = pt[0] - O[0], y = pt[1] - O[1];
  return Math.atan2(x, -y);
}
function inSector(th, ts, tl) {
  const TWO = 2 * Math.PI;
  const d = (((th - ts) % TWO) + TWO) % TWO;
  return d <= tl + 1e-12;
}
/* расстояние между углами по окружности, 0…π */
function angGap(a, b) {
  const TWO = 2 * Math.PI;
  const d = (((a - b) % TWO) + TWO) % TWO;
  return Math.min(d, TWO - d);
}

/* ============================================================
   6. Проверка одной задачи
   ============================================================ */
function verifyOne(p, errs, warns, bankDiscrepancies) {
  const id = String(p.id);
  const E = msg => errs.push(`${id}: ${msg}`);
  const W = msg => warns.push(`${id}: ${msg}`);
  const WG = STRICT ? E : W;
  const D = (stored, computed, note) => bankDiscrepancies.push({ id, stored, computed, note });
  const cond = normText(p.cond || "");

  const hits = MODELS.filter(M => M.re.test(cond));
  if (!hits.length) { E(`формулировка не распознана ни одной моделью верификатора: «${cond}»`); return; }
  if (hits.length > 1) { E(`формулировку распознают несколько моделей: ${hits.map(h => h.name).join("; ")}`); return; }
  const M = hits[0], m = cond.match(M.re);

  const S = sceneOf(p, E);
  if (M.needsScene && !(S && S.main)) { E(`${M.name}: данные берутся с рисунка, а конуса на чертеже нет`); return; }

  /* --- ответ --- */
  const res = M.solve(m, p, S);
  const stored = /^\s*-?\d+(?:[.,]\d+)?\s*$/.test(String(p.ans)) ? dec(String(p.ans).trim()) : null;
  if (stored === null) E(`ответ банка «${p.ans}» — не число`);
  else if (!(relDiff(res.ans, stored) <= TOL_ANS)) {
    E(`ответ: в банке ${p.ans}, пересчёт по условию ${fmt(res.ans)} (${M.name}: ${res.info})`);
    D(`ответ ${p.ans}`, fmt(res.ans), `${M.name}: ${res.info}`);
  }

  /* --- чертёж --- */
  if (!S) return;
  if (S.cones.length !== res.cones) E(`по условию конусов ${res.cones}, на чертеже ${S.cones.length}`);
  if (S.spheres.length !== res.spheres) E(`по условию шаров ${res.spheres}, на чертеже ${S.spheres.length}`);
  const main = S.main;
  if (!main) { E("на чертеже нет конуса"); return; }
  const facts = [], ratios = [];
  const x = {
    S, main, E, W: WG,
    F: f => facts.push(f),
    R: r => ratios.push(r),
    /* величина нарисованного конуса против данных; углы — по нарисованным точкам (словарь тренажёра) */
    coneFact(q, want, src, b = main) {
      if (QPOW[q] === 0) {
        const nm = b.names, P = S.pts;
        const got = q === "tilt" ? angleAt(P[nm.P], P[nm.S], P[nm.O]) : angleAt(P[nm.S], P[nm.P], P[nm.Q]);
        ratios.push({ what: `${QNAME[q]} на чертеже (∠${q === "tilt" ? nm.S + nm.P + nm.O : nm.P + nm.S + nm.Q}), ${src}`, got, want });
      } else facts.push({ what: `${QNAME[q]} нарисованного конуса`, scene: coneQ(q, b.r, b.h), want, pow: QPOW[q], src });
    },
    /* закрашенное осевое сечение: треугольник SPQ из заливок построения */
    axialFill(want) {
      const nm = main.names;
      const f = S.fills.find(r => r.length === 3 && [nm.S, nm.P, nm.Q].every(n => r.includes(n)));
      if (!f) { WG("осевое сечение спрошено, но на чертеже не закрашено"); return; }
      if (f.some(n => !isPt(S.pts[n]))) { E(`заливка ${f.join("")}: нет точки на чертеже`); return; }
      facts.push({ what: `закрашенное осевое сечение ${f.join("")}`, scene: triArea(...f.map(n => S.pts[n])), want, pow: 2, src: "ответ по условию" });
    },
    /* секущая плоскость на доле f высоты от вершины: окружность сечения на поверхности */
    sectionAt(f) {
      if (main.sect.length !== 1) { E(`окружностей сечения на чертеже ${main.sect.length}, нужна одна`); return null; }
      const c = main.sect[0];
      const t = Math.abs(main.S[2] - c.c[2]);
      if (Math.hypot(c.c[0] - main.O[0], c.c[1] - main.O[1]) > TOL_SHAPE * Math.max(1, main.r)) E("центр окружности сечения не на оси");
      ratios.push({ what: "секущая плоскость: расстояние от вершины / высота", got: t / main.h, want: f });
      ratios.push({ what: "радиус окружности сечения / радиус конуса на этой высоте", got: c.r / sectionRadius(main.r, main.h, t), want: 1 });
      if (!main.discs.some(d => main.ok(dist(d.c, c.c), 0) && main.ok(d.r, c.r)))
        E("закрашенный круг сечения не совпадает с окружностью сечения");
      return { t, rho: c.r };
    },
    /* жидкость в сосуде вершиной вниз до доли f высоты */
    waterAt(f) {
      if (!main.flip) { E("сосуд нарисован вершиной вверх — жидкость не конус; модель чертежа не поддержана"); return null; }
      if (!main.waterC || !main.waterCone) { E("в сосуде не нарисована жидкость"); return null; }
      const lvl = Math.abs(main.waterC.c[2] - main.S[2]);
      ratios.push({ what: "уровень жидкости: высота от вершины / высота сосуда", got: lvl / main.h, want: f });
      ratios.push({ what: "радиус поверхности жидкости / радиус сосуда на этой высоте", got: main.waterC.r / sectionRadius(main.r, main.h, lvl), want: 1 });
      const wc = main.waterCone;
      if (!(main.ok(wc.h, lvl) && main.ok(wc.c[2], main.S[2] + (main.waterC.c[2] - main.S[2]) / 2) && wc.r <= main.waterC.r + 1e-12))
        E("тело жидкости не совпадает с уровнем: не от вершины до поверхности жидкости");
      return { lvl, rho: main.waterC.r };
    },
    /* часть конуса: нарисованный сектор, края A, B, подпись угла */
    partCone(kept, alpha, inside) {
      const b = main, sf = b.surf;
      if (sf.tl == null) { E("нарисован целый конус, а в условии — часть"); return; }
      ratios.push({ what: "угол нарисованной части (сектор поверхности)", got: sf.tl * RAD2DEG, want: kept });
      const endPt = th => [b.O[0] + b.r * Math.sin(th), b.O[1] - b.r * Math.cos(th), b.O[2]];
      const nm = b.names, A = S.pts[nm.A], B = S.pts[nm.B];
      if (!isPt(A) || !isPt(B)) { E(`нет точек ${nm.A}, ${nm.B} на краях части`); return; }
      const ends = [endPt(sf.ts), endPt(sf.ts + sf.tl)];
      const near = (P, Q) => dist(P, Q) <= TOL_SHAPE * Math.max(1, b.r);
      if (!((near(A, ends[0]) && near(B, ends[1])) || (near(A, ends[1]) && near(B, ends[0]))))
        E(`точки ${nm.A}, ${nm.B} не на краях нарисованного сектора`);
      ratios.push({ what: `угол ${nm.A}${nm.O}${nm.B} между разрезами`, got: angleAt(S.pts[nm.O], A, B), want: Math.min(alpha, 360 - alpha) });
      ratios.push({ what: "подпись угла против нарисованного сектора", got: inside ? sf.tl * RAD2DEG : 360 - sf.tl * RAD2DEG, want: alpha });
      /* закрашенное основание: круговой сектор CircleGeometry(ts, tl) с rotation.x = π/2;
         в параметризации поверхности он занимает θ ∈ [π/2 − ts − tl; π/2 − ts] */
      const disc = b.discs.find(d => d.tl != null && main.ok(d.r, b.r) &&
        Math.hypot(d.c[0] - b.O[0], d.c[1] - b.O[1]) <= TOL_SHAPE * Math.max(1, b.r));
      if (!disc || !main.ok(disc.tl, sf.tl) || !main.ok(angGap(Math.PI / 2 - (disc.ts || 0) - disc.tl, sf.ts), 0))
        E("закрашенное основание части не совпадает с сектором боковой поверхности");
      /* обод основания — дуга над нарисованным сектором, в той же параметризации,
         что закрашенное основание (TorusGeometry(arc = tl), повёрнутый на ts) */
      /* на линейке курса эти два дефекта исправлены движком — откат = расхождение */
      const WC = COURSE ? E : WG;
      if (b.baseC && b.baseC.tl == null)
        WC(`окружность основания нарисована целиком (360°), а тело — только часть ${fmt(kept)}°: ` +
          `обод вырезанной части виден как у целого конуса`);
      else if (b.baseC && !(main.ok(b.baseC.tl, sf.tl) && main.ok(angGap(Math.PI / 2 - (b.baseC.ts || 0) - b.baseC.tl, sf.ts), 0)))
        E(`обод основания — дуга ${fmt(b.baseC.tl * RAD2DEG)}°, но не над нарисованным сектором поверхности`);
      /* точки целого конуса P, Q в вырезе висели бы в воздухе */
      for (const key of ["P", "Q"]) {
        const q = b.g.pts && b.g.pts[nm[key]];
        if (!isPt(q)) continue;
        const th = Math.atan2(q[0] - b.O[0], -(q[1] - b.O[1]));
        const rel = ((th - sf.ts) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        if (rel > sf.tl + 1e-9)
          WC(`точка ${nm[key]} целого конуса лежит в вырезе, вне нарисованной части ${fmt(kept)}°, — висит в воздухе`);
      }
      /* высота и радиус — данные этой задачи (ПО РИСУНКУ): сверяем с нарисованным телом */
      facts.push({ what: "высота нарисованной части", scene: b.h, want: res.derived.h, pow: 1, src: "подпись на рисунке" });
      facts.push({ what: "радиус нарисованной части", scene: b.r, want: res.derived.r, pow: 1, src: "подпись на рисунке" });
    }
  };
  res.geo(x);

  /* --- подписи: labels и подписанные отрезки построения --- */
  const cn = condNumbers(cond);
  const labelled = [
    ...(p.labels || []).map(l => ["подпись", l]),
    ...S.segs.filter(s => Array.isArray(s) && s.length > 2 && s[2] != null).map(s => ["подпись построения", s])
  ];
  for (const [src, [a, b, t]] of labelled) {
    const pa = S.pts[a], pb = S.pts[b];
    if (!isPt(pa) || !isPt(pb)) { E(`${src} ${a}${b} «${t}»: нет такой точки на чертеже`); continue; }
    const L = dist(pa, pb);
    /* вспомогательная точка подписи (scene.pts, имя с «_», с 24.09.2026) — только
       центр окружности сечения на оси конуса: ею делятся отрезки высоты из условия */
    for (const n of [a, b]) {
      if (n[0] !== "_") continue;
      const q = S.pts[n];
      if (!main.sect.some(c => isPt(c.c) && dist(c.c, q) <= TOL_SHAPE * Math.max(1, main.r, main.h)))
        E(`${src} ${a}${b} «${t}»: вспомогательная точка ${n} — не центр окружности сечения на оси конуса`);
    }
    const role = roleOf(a, b, main.names);
    const val = t === "?" ? (res.derived && role ? res.derived[role] : null) : labelNum(t);
    const hj = [a, b].map(n => [n, S.hijacked(n)]).filter(([, h]) => h);
    if (hj.length) {
      const wantPt = n => (S.hijacked(n) ? S.hijacked(n).want.pt : S.pts[n]);
      const Lw = dist(wantPt(a), wantPt(b));
      const who = hj.map(([n, h]) => `${n} — от ${S.tagGen(h.got.i)}, а не от ${S.tagGen(h.want.i)}`).join("; ");
      E(`${src} ${a}${b} «${t}» стоит не на том отрезке: у тел совпадают имена точек, тренажёр хранит одну ` +
        `точку на имя (последнюю): ${who}. На сцене ${a}${b} = ${fmt(L)}, а задуманный отрезок имеет длину ${fmt(Lw)}` +
        (val !== null ? ` (по ${t === "?" ? "условию " + QNAME[role] : "подписи"} ${fmt(val)})` : ""));
      D(`${src} ${a}${b} «${t}»: на сцене отрезок длиной ${fmt(L)}`, `задуманный ${a}${b} = ${fmt(Lw)}`,
        `точки ${hj.map(([n]) => n).join(", ")} взяты у другого тела из-за совпадения имён`);
      continue;
    }
    if (t === "?") {
      if (val !== null) facts.push({ what: `отрезок ${a}${b} «?» (${QNAME[role]})`, scene: L, want: val, pow: 1, src: "выведено из условия" });
      continue;
    }
    if (val === null) continue;
    facts.push({ what: `${src} ${a}${b} = «${t}»`, scene: L, want: val, pow: 1, src: "подпись" });
    if (!res.byPicture && !cn.some(c => relDiff(c, val) < 1e-12))
      WG(`${src} ${a}${b} = «${t}»: такого числа нет в условии (данные только на рисунке)`);
  }

  /* --- единый масштаб --- */
  const kOf = f => Math.pow(f.scene / f.want, 1 / f.pow);
  const usable = facts.filter(f => {
    if (f.want > 0 && f.scene > 0 && Number.isFinite(f.scene) && Number.isFinite(f.want)) return true;
    E(`${f.what}: на сцене ${fmt(f.scene)}, по данным ${fmt(f.want)} — нулевая, отрицательная или не конечная величина`);
    return false;
  });
  const groups = [];
  for (const f of usable) {
    const k = kOf(f);
    let g = groups.find(gr => relDiff(gr.k, k) <= TOL_GEO);
    if (!g) groups.push(g = { k, items: [] });
    g.items.push(f);
  }
  const unit = f => (f.pow === 3 ? " (объём, масштаб через ∛)" : f.pow === 2 ? " (площадь, масштаб через √)" : "");
  if (groups.length > 1) {
    const txt = groups.map(g => "[" + g.items.map(f => `${f.what}${unit(f)}: на сцене ${fmt(f.scene)}, по данным (${f.src}) ${fmt(f.want)}`).join("; ") +
      `] → масштаб ${fmt(g.k)}`).join("  ≠  ");
    E(`чертёж не в едином масштабе: ${txt}`);
    D("чертёж: " + groups.map(g => `масштаб ${fmt(g.k)} по ${g.items.map(f => f.what).join(", ")}`).join("; "),
      "единый масштаб для всех величин условия", "сцена построена не по числам условия (ответ банка при этом верный)");
  }
  const k0 = groups.length === 1 ? groups[0].k : null;
  if (unitCheck(p, k0, E)) {
    const nm = main.names;
    WG(`чертёж подобен условию, но в масштабе ${fmt(k0)} (по: ${groups[0].items.map(f => f.what).join(", ")}), а unit не задан; ` +
      `после «Показать ответ» панель измерений покажет длину отрезка на сцене ` +
      `(displayLen → fmtLen(scaleFn · unit)): ученик увидит ${nm.S}${nm.O} = ${shownLen(main.h)} и ${nm.O}${nm.P} = ${shownLen(main.r)}, ` +
      `а в единицах условия это ${fmt(main.h / k0)} и ${fmt(main.r / k0)} (нужно unit = ${fmt(1 / k0)})`);
  }

  /* --- отношения и углы — без масштаба --- */
  for (const r of ratios)
    if (!(Number.isFinite(r.got) && relDiff(r.got, r.want) <= TOL_GEO)) {
      E(`чертёж не соответствует условию: ${r.what} на сцене ${fmt(r.got)}, по условию ${fmt(r.want)}`);
      D(`чертёж: ${r.what} = ${fmt(r.got)}`, fmt(r.want), "пропорции сцены не по числам условия (ответ банка при этом верный)");
    }

  /* --- совпадающие имена точек у разных тел --- */
  const clash = {};
  for (const [nm, list] of Object.entries(S.owners)) {
    if (list.length < 2) continue;
    const last = list[list.length - 1];
    for (const o of list.slice(0, -1))
      if (dist(o.pt, last.pt) > 1e-12) (clash[`${o.i}→${last.i}`] = clash[`${o.i}→${last.i}`] || []).push(nm);
  }
  for (const [key, names] of Object.entries(clash)) {
    const [i, j] = key.split("→").map(Number);
    const g = S.gen[i], set = new Set(names);
    const cons = [];
    const edges = (g.edges || []).filter(e => set.has(e[0]) || set.has(e[1])).map(e => e[0] + e[1]);
    if (edges.length) cons.push(`рёбра ${edges.join(", ")}`);
    if (!g.hideLabels && !g.anonymous) cons.push(`буквы ${names.join(", ")}`);
    const lab = labelled.filter(([, l]) => set.has(l[0]) || set.has(l[1])).map(([, l]) => `${l[0]}${l[1]} «${l[2]}»`);
    if (lab.length) cons.push(`подписи ${lab.join(", ")}`);
    const fl = S.fills.filter(f => f.some(n => set.has(n))).map(f => f.join(""));
    if (fl.length) cons.push(`заливки построения ${fl.join(", ")}`);
    WG(`имена точек ${names.join(", ")} есть у ${S.tagGen(i)} и ${S.tagGen(j)} с разными координатами; тренажёр хранит одну ` +
      `точку на имя — последнюю, поэтому ${cons.length ? cons.join("; ") : "точки"} ${S.tagGen(i)} рисуются по точкам ${S.tagGen(j)}`);
  }

  if (VERBOSE)
    console.log(`  ${id.padEnd(7)} ответ ${String(p.ans).padEnd(6)} пересчёт ${fmt(res.ans).padEnd(8)} [${M.name}] ${res.info}; ` +
      `тел на сцене ${S.gen.length}; сверено величин ${facts.length}, отношений ${ratios.length}` +
      (k0 !== null ? `; масштаб ${fmt(k0)}` : groups.length > 1 ? "; масштаб не единый" : "; масштаб условием не задан"));
}

/* ============================================================
   7. Прогон
   ============================================================ */
let PROBLEMS, sceneData, COURSE = false;
function main() {
  let api;
  try { api = loadData(DATA_JS); }
  catch (e) {
    console.log(`Не удалось загрузить ${DATA_JS}: ${e.message}`);
    console.log("Конус (старые): задач 0, расхождений 1");
    process.exit(1);
  }
  ({ PROBLEMS, sceneData } = api);
  COURSE = !!api.course;
  const errs = [], warns = [], bankDiscrepancies = [];
  try { modelSelfCheck(); }
  catch (e) { errs.push("верификатор: " + e.message); }
  const legacy = PROBLEMS.filter(p => p && /^\d+$/.test(String(p.id)) && p.topic === TOPIC);
  console.log(`Линейка: ${DATA_JS} (${COURSE ? "курса" : "опубликованная"})`);
  console.log(`Задач в PROBLEMS: ${PROBLEMS.length}; старых «${TOPIC}» (числовой id): ${legacy.length}`);
  if (legacy.length !== EXPECTED_COUNT)
    errs.push(`банк: старых задач темы «${TOPIC}» ${legacy.length}, должно быть ровно ${EXPECTED_COUNT}`);
  const seen = new Set();
  for (const p of legacy) {
    if (seen.has(String(p.id))) errs.push(`${p.id}: id повторяется`);
    seen.add(String(p.id));
  }
  for (const p of legacy) {
    try { verifyOne(p, errs, warns, bankDiscrepancies); }
    catch (e) { errs.push(`${p.id}: проверка не выполнена: ${e.message}`); }
  }
  warns.forEach(w => console.log("предупреждение " + w));
  errs.forEach(e => console.log("РАСХОЖДЕНИЕ " + e));
  console.log(`Конус (старые): задач ${legacy.length}, расхождений ${errs.length}`);
  if (warns.length) console.log(`(предупреждений ${warns.length} — на код выхода не влияют; --strict делает их расхождениями)`);
  if (errs.length) process.exit(1);
  console.log("LEGACY_KON_VERIFY_OK");
}
main();
