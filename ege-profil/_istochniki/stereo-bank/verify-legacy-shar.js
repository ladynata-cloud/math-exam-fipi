/* Независимый верификатор СТАРЫХ задач стерео-банка, тема «Шар».

   Старые задачи — 8 задач с числовыми id (номера задач Решу ЕГЭ).
   Под этими id у учеников записан прогресс (stereo3.status), а позиция
   задачи в теме — в stereo3.last.Шар. Здесь ничего не правится —
   только проверяется.

   Что проверяется для каждой задачи
   1. Ответ. Тип задачи распознаётся по формулировке p.cond (не по id),
      числа берутся регулярками из того же текста, ответ пересчитывается
      своим кодом:
        • величины шара (объём, площадь поверхности, площадь большого
          круга) считаются как функции радиуса интегрированием по формуле
          Симпсона — объём складывается из круговых слоёв, поверхность
          из поясов 2πR·dz, большой круг из колец 2πρ·dρ; на одном отрезке
          формула Симпсона точна для многочленов степени ≤ 3, так что
          погрешность только машинная;
        • обратные задачи («по объёму найти радиус») решаются бисекцией,
          без корней и готовых формул обращения;
        • в задачах на отношение абсолютный размер неизвестен, поэтому
          ответ считается при двух разных размерах второго шара и обязан
          от него не зависеть.
      p.ans участвует только в итоговой сверке; p.sol и p.hint не читаются.
      Все 8 задач темы содержат данные в тексте условия — ветки
      «ПО РИСУНКУ» (данные только из подписей чертежа) здесь нет. Если
      формулировка не узнана ни одним шаблоном, это расхождение, а не
      повод взять числа с чертежа.
   2. Чертёж — выход sceneData(p), как его получает тренажёр:
      • все координаты конечны (нет NaN / Infinity), имена точек разных
        тел не совпадают;
      • каждое тело — шар; его окружности и диски — большие (центр
        в центре шара, радиус равен радиусу шара), отрезок из центра
        оканчивается на сфере (это действительно радиус);
      • число шаров на чертеже равно числу шаров, о которых говорит
        условие; радиусы шаров сводятся к ОДНОМУ масштабу на задачу
        (допуск 1e-6): 6, 8, 10 и искомый 12 — это 0,6 : 0,8 : 1 : 1,2,
        «в 2 раза больше» — это 2 : 1 и т. д.;
      • если условие называет большой круг, он виден на чертеже;
      • числовые подписи (labels и подписанные отрезки построения, если
        они есть) — расстояние между точками пропорционально числу,
        в том же масштабе, что и радиусы.
      Расхождение: поле unit задачи (длина условия на единицу сцены) не равно 1/k —
      панель измерений показала бы длины не в единицах условия.
      Предупреждения (не ошибки, код выхода не меняют): масштаб чертежа
      не 1 там, где условие задаёт абсолютный размер, а unit не задан, —
      пропорции верны, но инструмент измерения тренажёра после решения
      показал бы длину в единицах чертежа; шары на чертеже пересекаются; роль «призрачного»
      шара не совпадает с ролью в условии.
   3. Состав темы: ровно 8 старых задач, те самые id и в том же порядке
      в начале темы, что в опубликованной линейке (иначе stereo3.last.Шар
      у учеников укажет на другую задачу), каждый id в PROBLEMS один раз.

   Запуск (голый Node, без зависимостей):
     node verify-legacy-shar.js                  — линейка ../../trainers/stereo
     STEREO_ROOT=<папка линейки> node verify-legacy-shar.js
     ключ -v — по строке на каждую задачу;
     ключ --strict — предупреждения тоже считаются расхождениями.
   Берутся задачи PROBLEMS с id из одних цифр и topic === "Шар";
   новые задачи (id вида shar-01) пропускаются — их проверяет verify-shar.js.
   Код 0 и маркер LEGACY_SHAR_VERIFY_OK — только при нуле расхождений. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const STEREO_ROOT = process.env.STEREO_ROOT ||
  path.resolve(__dirname, "..", "..", "trainers", "stereo");
const DATA_JS = path.join(STEREO_ROOT, "js", "data.js");
const TOPIC = "Шар";
const EXPECTED_COUNT = 8;
/* порядок старых задач темы в опубликованной линейке
   trainers/ege-profile-stereometry-3d (позиция = stereo3.last.Шар) */
const PUBLISHED_ORDER = ["27059", "27072", "27097", "27125", "27162", "27163", "27174", "525372"];
const TOL_ANS = 1e-9;   /* ответ: относительный допуск */
const TOL_GEO = 1e-6;   /* чертёж: относительный допуск */
const VERBOSE = process.argv.includes("-v") || process.argv.includes("--verbose");
const STRICT = process.argv.includes("--strict");   /* предупреждения — тоже расхождения */

/* ============================================================
   0. Загрузка data.js в песочницу vm
   Своя копия идеи _load.js (файлы других агентов не подключаются):
   data.js — браузерный скрипт, THREE и DOM нужны ему только при
   отрисовке, для загрузки хватает заглушек. Работает и со старым
   data.js линейки (PROBLEMS и sceneData — глобальные const/function,
   module.exports нет), и с объединённым (есть блок module.exports,
   sceneData — диспетчер, старые задачи отдаёт легаси-генератору).
   ============================================================ */
function inert(label) {
  const f = function () {};
  return new Proxy(f, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => NaN;
      if (k === "then") return undefined;
      if (k === "prototype") return t.prototype;
      return inert(label + "." + String(k));
    },
    set() { return true; },
    apply() { return inert(label + "()"); },
    construct() { return inert("new " + label); }
  });
}

function loadBank(file) {
  if (!fs.existsSync(file))
    throw new Error("не найден " + file + " (STEREO_ROOT — папка линейки, в которой лежит js/data.js)");
  const src = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
  function Vector3(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; }
  const THREE = new Proxy({ Vector3 }, {
    get: (t, k) => (k in t ? t[k] : inert("THREE." + String(k)))
  });
  const box = {
    THREE, console,
    document: inert("document"), navigator: inert("navigator"), location: inert("location"),
    localStorage: inert("localStorage"), sessionStorage: inert("sessionStorage"),
    addEventListener() {}, removeEventListener() {},
    requestAnimationFrame: () => 0, cancelAnimationFrame() {},
    setTimeout: () => 0, clearTimeout() {},
    module: { exports: {} }
  };
  box.window = box;
  box.self = box;
  const ctx = vm.createContext(box);
  new vm.Script(src, { filename: file }).runInContext(ctx);
  /* const/function верхнего уровня видны следующему скрипту того же контекста */
  const got = new vm.Script(
    "({ PROBLEMS: typeof PROBLEMS !== 'undefined' ? PROBLEMS : undefined," +
    "   sceneData: typeof sceneData === 'function' ? sceneData : undefined })"
  ).runInContext(ctx);
  const ex = box.module.exports || {};
  const PROBLEMS = got.PROBLEMS || ex.PROBLEMS;
  const sceneData = got.sceneData || (typeof ex.sceneData === "function" ? ex.sceneData : undefined);
  if (!Array.isArray(PROBLEMS)) throw new Error("в " + file + " нет массива PROBLEMS");
  if (typeof sceneData !== "function") throw new Error("в " + file + " нет функции sceneData");
  return { PROBLEMS, sceneData };
}

/* ============================================================
   1. Мелочи: векторы, сравнение, печать
   ============================================================ */
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
const relDiff = (x, y) => {
  const d = Math.max(Math.abs(x), Math.abs(y));
  return d === 0 ? 0 : Math.abs(x - y) / d;
};
const isPt = p => Array.isArray(p) && p.length >= 3 && [p[0], p[1], p[2]].every(Number.isFinite);
const fmt = x => (Number.isFinite(x) ? String(+x.toPrecision(12)).replace(".", ",") : String(x));
/* как округляет бланк тренажёра: до 2 знаков, запятая */
const fmt2 = x => (Number.isFinite(x) ? String(Math.round(x * 100) / 100).replace(".", ",") : String(x));
const norm = s => String(s).replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();

/* ============================================================
   2. Числа из текста условия и из ответа
   ============================================================ */
const WORDS = { "два": 2, "две": 2, "три": 3, "четыре": 4, "пять": 5,
  "шесть": 6, "семь": 7, "восемь": 8, "девять": 9, "десять": 10 };
const NUM = String.raw`\d+(?:,\d+)?`;                               /* 18 · 0,5 */
const NUMW = "(?:" + NUM + "|" + Object.keys(WORDS).join("|") + ")"; /* или словом */
const COUNT = { "двух": 2, "трёх": 3, "трех": 3, "четырёх": 4, "четырех": 4 };

function toNum(s) {
  const t = String(s).trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(WORDS, t)) return WORDS[t];
  if (!new RegExp("^" + NUM + "$").test(t)) return NaN;
  return Number(t.replace(",", "."));
}

/* ответ в формате бланка ЕГЭ: цифры, запятая, минус */
function storedAns(s) {
  const t = String(s).trim();
  if (!/^-?\d+(?:,\d+)?$/.test(t)) return NaN;
  return Number(t.replace(",", "."));
}

/* число подписи чертежа: 6 · 2,5 · √8 · 2√3; прочее («?», «R») — не число */
function labelNum(s) {
  const t = String(s).replace(/\s+/g, "");
  let m = t.match(/^(\d+(?:,\d+)?)$/);
  if (m) return Number(m[1].replace(",", "."));
  m = t.match(/^(\d+(?:,\d+)?)?√(\d+(?:,\d+)?)$/);
  if (m) return (m[1] ? Number(m[1].replace(",", ".")) : 1) * Math.sqrt(Number(m[2].replace(",", ".")));
  return NaN;
}

/* ============================================================
   3. Величины шара как функции радиуса — своим путём
   Формула Симпсона на одном отрезке точна для многочленов степени ≤ 3;
   все подынтегральные функции ниже — многочлены степени ≤ 2.
   ============================================================ */
const simpson = (f, a, b) => (b - a) / 6 * (f(a) + 4 * f((a + b) / 2) + f(b));
const Q = {
  radius: R => R,
  /* шар — стопка круговых слоёв радиуса √(R² − z²) */
  volume: R => simpson(z => Math.PI * (R * R - z * z), -R, R),
  /* пояс сферы высоты dz имеет площадь 2πR·dz (теорема Архимеда о поясе) */
  surface: R => simpson(() => 2 * Math.PI * R, -R, R),
  /* круг радиуса R — кольца площади 2πρ·dρ */
  bigCircle: R => simpson(rho => 2 * Math.PI * rho, 0, R)
};
const QNAME = { radius: "радиус", volume: "объём", surface: "площадь поверхности",
  bigCircle: "площадь большого круга" };

/* фраза условия → величина (падеж и число не важны) */
function qty(phrase) {
  const t = String(phrase).toLowerCase().replace(/ё/g, "е");
  if (/большого круга/.test(t)) return "bigCircle";
  if (/поверхност/.test(t)) return "surface";
  if (/объем/.test(t)) return "volume";
  if (/радиус/.test(t)) return "radius";
  return null;
}

/* радиус R > 0, при котором Q[key](R) = target: бисекция (все Q возрастают) */
function solveR(key, target) {
  if (!(target > 0) || !Number.isFinite(target)) return NaN;
  const f = Q[key];
  let lo = 0, hi = 1;
  for (let i = 0; f(hi) < target; i++) { hi *= 2; if (i > 2000) return NaN; }
  for (let i = 0; i < 400 && hi - lo > 1e-16 * hi; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/* ============================================================
   4. Шаблоны формулировок → модель задачи
   Модель: { kind, ans, what, radii, absolute, ghost, needDisc, issues }
     radii    — радиусы шаров в единицах задачи в порядке тел сцены
                (при absolute = false — с точностью до общего множителя);
     absolute — условие задаёт абсолютный размер (а не только отношение);
     ghost    — индексы шаров, которые по смыслу «искомые/воображаемые»
                (null — не проверять);
     needDisc — условие называет большой круг: он должен быть на чертеже.
   ============================================================ */
const Q_ALT = "площадь (?:его )?большого круга|площадь (?:его )?поверхности|объ[её]м|радиус";
const EQ = "(?:равна|равен|равно|равны)";

/* «Площадь большого круга шара равна 3. Найдите площадь поверхности шара.»
   «Объём шара равен 288π. Найдите площадь его поверхности, делённую на π.» */
const RE_GIVEN = new RegExp(
  "^(?<X>" + Q_ALT + ") шара " + EQ + " (?<v>" + NUM + ")\\s*(?<pi>π)?\\. " +
  "Найдите (?<Y>" + Q_ALT + ")(?: (?:шара|его))?(?<div>, делённ(?:ую|ый|ое) на π)?\\.$", "iu");

/* «[Даны два шара.] Радиус первого шара в 2 раза больше радиуса второго.
    Во сколько раз площадь поверхности первого шара больше площади
    поверхности второго?» */
const Q_GEN = "радиуса|объ[её]ма|площади поверхности|площади большого круга";
const RE_RATIO = new RegExp(
  "^(?:Даны два шара\\. )?(?<X>" + Q_ALT + ") первого шара в (?<k>" + NUMW + ") раза? больше " +
  "(?<X2>" + Q_GEN + ") второго(?: шара)?\\. Во сколько раз (?<Y>" + Q_ALT + ") первого шара " +
  "больше (?<Y2>" + Q_GEN + ") второго(?: шара)?\\?$", "iu");

/* «Во сколько раз увеличится объём шара, если его радиус увеличить в три раза?» */
const RE_GROW = new RegExp(
  "^Во сколько раз увеличится (?<Y>" + Q_ALT + ") шара, если (?:его )?(?<X>" + Q_ALT + ")" +
  "(?: шара)? увеличить в (?<k>" + NUMW + ") раза?\\?$", "iu");

/* «Радиусы трёх шаров равны 6, 8 и 10. Найдите радиус шара, объём которого
    равен сумме их объёмов.» */
const RE_SUM = new RegExp(
  "^Радиусы (?<cnt>двух|тр[её]х|четыр[её]х) шаров равны (?<list>" + NUM + "(?:, " + NUM + ")* и " + NUM + ")\\. " +
  "Найдите радиус шара, (?<X>" + Q_ALT + ") которого " + EQ + " сумме (?<S>[^.]+)\\.$", "iu");

function modelGiven(g) {
  const issues = [];
  const X = qty(g.X), Y = qty(g.Y);
  let v = toNum(g.v);
  if (g.pi) v *= Math.PI;                 /* «288π» — значение с множителем π */
  const R = solveR(X, v);
  let ans = Q[Y](R);
  if (g.div) ans /= Math.PI;              /* «…, делённую на π» */
  if (X === Y) issues.push("дана и требуется одна и та же величина");
  return {
    kind: "дано → найти", ans, issues,
    what: QNAME[X] + " = " + g.v + (g.pi ? "π" : "") + " ⇒ R = " + fmt(R) + "; " +
      QNAME[Y] + (g.div ? "/π" : "") + " = " + fmt(ans),
    radii: [R], absolute: true, ghost: null,
    needDisc: X === "bigCircle" || Y === "bigCircle"
  };
}

function modelRatio(g) {
  const issues = [];
  const X = qty(g.X), Y = qty(g.Y), k = toNum(g.k);
  if (qty(g.X2) !== X) issues.push("величины первого и второго шара в данных разные: «" + g.X + "» и «" + g.X2 + "»");
  if (qty(g.Y2) !== Y) issues.push("величины первого и второго шара в вопросе разные: «" + g.Y + "» и «" + g.Y2 + "»");
  /* размер второго шара не задан: считаем при двух размерах, ответ не должен зависеть */
  const at = r2 => {
    const r1 = solveR(X, k * Q[X](r2));
    return { r1, ans: Q[Y](r1) / Q[Y](r2) };
  };
  const a = at(1), b = at(2.7);
  if (relDiff(a.ans, b.ans) > TOL_ANS) issues.push("ответ зависит от размера шаров: " + fmt(a.ans) + " и " + fmt(b.ans));
  return {
    kind: "отношение двух шаров", ans: a.ans, issues,
    what: QNAME[X] + "₁ = " + fmt(k) + "·" + QNAME[X] + "₂ ⇒ R₁ : R₂ = " + fmt(a.r1) + "; " +
      QNAME[Y] + "₁ : " + QNAME[Y] + "₂ = " + fmt(a.ans),
    radii: [a.r1, 1], absolute: false, ghost: null, needDisc: X === "bigCircle" || Y === "bigCircle"
  };
}

function modelGrow(g) {
  const issues = [];
  const X = qty(g.X), Y = qty(g.Y), k = toNum(g.k);
  const at = r0 => {
    const r1 = solveR(X, k * Q[X](r0));
    return { r1, ans: Q[Y](r1) / Q[Y](r0) };
  };
  const a = at(1), b = at(2.7);
  if (relDiff(a.ans, b.ans) > TOL_ANS) issues.push("ответ зависит от размера шара: " + fmt(a.ans) + " и " + fmt(b.ans));
  return {
    kind: "увеличение шара", ans: a.ans, issues,
    what: QNAME[X] + " ×" + fmt(k) + " ⇒ R ×" + fmt(a.r1) + "; " + QNAME[Y] + " ×" + fmt(a.ans),
    /* тело 1 — исходный шар, тело 2 — увеличенный (воображаемый) */
    radii: [1, a.r1], absolute: false, ghost: [1], needDisc: X === "bigCircle" || Y === "bigCircle"
  };
}

function modelSum(g) {
  const issues = [];
  const X = qty(g.X);
  const list = g.list.split(/, | и /).map(toNum);
  const cnt = COUNT[g.cnt.toLowerCase()];
  if (list.length !== cnt) issues.push("«" + g.cnt + " шаров», а радиусов в условии " + list.length);
  if (qty(g.S) !== X) issues.push("складываются «" + g.S + "», а искомый шар задан через «" + g.X + "»");
  if (X === "radius") issues.push("сумма радиусов — не задача на шар");
  const total = list.reduce((s, r) => s + Q[X](r), 0);
  const R = solveR(X, total);
  return {
    kind: "шар с суммой величин", ans: R, issues,
    what: "радиусы " + list.map(fmt).join(", ") + "; " + QNAME[X] + " искомого = сумме ⇒ R = " + fmt(R),
    /* данные шары, затем искомый */
    radii: list.concat([R]), absolute: true, ghost: [list.length], needDisc: false
  };
}

const TEMPLATES = [
  { re: RE_GIVEN, make: modelGiven },
  { re: RE_RATIO, make: modelRatio },
  { re: RE_GROW, make: modelGrow },
  { re: RE_SUM, make: modelSum }
];

/* ============================================================
   5. Проверки
   ============================================================ */
const errs = [];   /* расхождения: «id: текст» */
const warns = [];  /* предупреждения */

function checkTask(p, sceneData) {
  const errs0 = errs.length;
  const err = m => errs.push(p.id + ": " + m);
  const warn = m => (STRICT ? errs : warns).push(p.id + ": " + m);
  const cond = norm(p.cond || "");

  /* ---- 5.1 модель по тексту условия ---- */
  const hits = [];
  for (const t of TEMPLATES) {
    const m = cond.match(t.re);
    if (m) hits.push(t.make(m.groups));
  }
  if (hits.length !== 1) {
    err(hits.length ? "формулировку узнали " + hits.length + " шаблона — неоднозначно"
      : "формулировка не узнана ни одним шаблоном (нет модели): «" + cond + "»");
    return;
  }
  const M = hits[0];
  M.issues.forEach(s => err("условие: " + s));

  /* ---- 5.2 ответ ---- */
  const stored = storedAns(p.ans);
  if (!Number.isFinite(stored)) err("ответ «" + p.ans + "» не в формате бланка (цифры, запятая, минус)");
  else if (!Number.isFinite(M.ans)) err("пересчёт не дал числа (" + M.what + ")");
  else if (relDiff(M.ans, stored) > TOL_ANS)
    err("ответ: пересчёт " + fmt(M.ans) + " ≠ " + p.ans + " в банке [" + M.kind + ": " + M.what + "]");

  /* ---- 5.3 чертёж ---- */
  let sd;
  try { sd = sceneData(p); }
  catch (e) { err("sceneData упала: " + e.message); return; }
  const gen = sd && Array.isArray(sd.gen) ? sd.gen : null;
  if (!gen || !gen.length) { err("sceneData не вернула тел (gen)"); return; }

  /* конечность координат и уникальность имён точек */
  const seen = {};
  gen.forEach((g, gi) => {
    for (const [nm, pt] of Object.entries(g.pts || {})) {
      if (!isPt(pt)) err("тело " + (gi + 1) + ": точка " + nm + " = " + JSON.stringify(pt));
      if (seen[nm] != null && seen[nm] !== gi)
        err("точка " + nm + " есть у тел " + (seen[nm] + 1) + " и " + (gi + 1) + " — в сцене одна затрёт другую");
      seen[nm] = gi;
    }
    (g.circles || []).forEach((c, j) => {
      if (!isPt(c.c) || !Number.isFinite(c.r)) err("тело " + (gi + 1) + ": окружность " + (j + 1) + " с нечисловыми данными");
    });
    (g.surfaces || []).forEach((s, j) => {
      if (!isPt(s.c) || (s.r != null && !Number.isFinite(s.r)) || (s.h != null && !Number.isFinite(s.h)))
        err("тело " + (gi + 1) + ": поверхность " + (j + 1) + " (" + s.type + ") с нечисловыми данными");
    });
  });

  /* каждое тело — шар; окружности/диски большие; отрезок из центра — радиус */
  const spheres = [];
  let greatDiscs = 0;
  gen.forEach((g, gi) => {
    const ss = (g.surfaces || []).filter(s => s.type === "sphere");
    if (ss.length !== 1) { err("тело " + (gi + 1) + ": ожидался один шар, поверхностей-шаров " + ss.length); return; }
    const S = ss[0];
    if (!(S.r > 0)) { err("тело " + (gi + 1) + ": радиус шара " + fmt(S.r)); return; }
    const tag = "шар " + (spheres.length + 1);
    spheres.push({ c: S.c, r: S.r, ghost: !!g.ghost, g });
    for (const c of (g.circles || [])) {
      if (dist(c.c, S.c) > TOL_GEO * S.r || relDiff(c.r, S.r) > TOL_GEO)
        err(tag + ": окружность (центр " + JSON.stringify(c.c) + ", r = " + fmt(c.r) + ") — не большая окружность шара (r = " + fmt(S.r) + ")");
    }
    for (const d of (g.surfaces || []).filter(s => s.type === "disc")) {
      if (dist(d.c, S.c) > TOL_GEO * S.r || relDiff(d.r, S.r) > TOL_GEO)
        err(tag + ": круг (центр " + JSON.stringify(d.c) + ", r = " + fmt(d.r) + ") — не большой круг шара (r = " + fmt(S.r) + ")");
      else greatDiscs++;
    }
    const centers = Object.keys(g.pts || {}).filter(nm => isPt(g.pts[nm]) && dist(g.pts[nm], S.c) <= TOL_GEO * S.r);
    if (!centers.length) warn(tag + ": центр шара не отмечен точкой");
    let radii = 0;
    for (const [a, b] of (g.edges || [])) {
      const from = centers.includes(a) ? b : centers.includes(b) ? a : null;
      if (from == null || !isPt(g.pts[from])) continue;
      radii++;
      if (relDiff(dist(g.pts[from], S.c), S.r) > TOL_GEO)
        err(tag + ": отрезок " + a + "–" + b + " из центра длины " + fmt(dist(g.pts[from], S.c)) +
          " — не радиус (r = " + fmt(S.r) + ")");
    }
    if (!radii) warn(tag + ": радиус на чертеже не проведён");
  });

  if (M.needDisc && !greatDiscs) err("условие называет большой круг, на чертеже его нет");

  /* число шаров и единый масштаб радиусов */
  let scale = null;   /* ед. чертежа на единицу задачи */
  if (spheres.length !== M.radii.length) {
    err("на чертеже шаров " + spheres.length + ", по условию " + M.radii.length + " [" + M.kind + "]");
  } else {
    const k0 = spheres[0].r / M.radii[0];
    let ok = true;
    spheres.forEach((S, i) => {
      if (relDiff(S.r / M.radii[i], k0) > TOL_GEO) {
        ok = false;
        err("радиус шара " + (i + 1) + " на чертеже " + fmt(S.r) + ", а в масштабе шара 1 должен быть " +
          fmt(M.radii[i] * k0) + " (по условию " + M.radii.map(fmt).join(" : ") + ")");
      }
    });
    if (ok) scale = k0;
    /* поле unit: длина условия на единицу сцены; панель измерений показывает
       fmtLen(длина на сцене · unit), поэтому при масштабе k0 (сцена / условие)
       верно unit = 1/k0 */
    const hasU = p.unit !== undefined, u = hasU ? p.unit : 1;
    if (hasU && !(typeof u === "number" && Number.isFinite(u) && u > 0)) err("unit = " + String(u) + " — не положительное число");
    else if (hasU && !(ok && M.absolute)) err("задан unit = " + fmt(u) + ", а абсолютный масштаб сцены условием не задан — сверить не с чем");
    else if (hasU && relDiff(k0 * u, 1) > TOL_GEO)
      err("unit = " + fmt(u) + " не согласован с масштабом чертежа k = " + fmt(k0) + " (нужно 1/k = " + fmt(1 / k0) +
        "): панель измерений покажет длины, умноженные на " + fmt(k0 * u));
    if (!hasU && ok && M.absolute && relDiff(k0, 1) > TOL_GEO) {
      const rEdge = (spheres[0].g.edges || [])[0];
      const seg = rEdge ? rEdge[0] + rEdge[1] : "радиус";
      warn("масштаб чертежа не 1 (≈ " + fmt2(k0) + "): радиусы на чертеже " +
        spheres.map(S => fmt2(S.r)).join("; ") + ", по условию " + M.radii.map(fmt2).join("; ") +
        (M.radii.some(r => Math.abs(r * 100 - Math.round(r * 100)) > 1e-9) ? " (≈)" : "") +
        ". Пропорции верны, но unit не задан, и инструмент измерения тренажёра после решения " +
        "(displayLen → fmtLen(длина на чертеже · unit)) покажет " + seg + " = " + fmt2(spheres[0].r) +
        ", а не " + fmt2(M.radii[0]) + " (нужно unit = " + fmt(1 / k0) + ")");
    }
    if (M.ghost) {
      spheres.forEach((S, i) => {
        const want = M.ghost.includes(i);
        if (S.ghost !== want)
          warn("шар " + (i + 1) + (want ? " — искомый/воображаемый, но нарисован обычным"
            : " — данный в условии, но нарисован «призрачным»"));
      });
    }
  }

  /* шары не должны пересекаться: иначе на чертеже не видно, где какой */
  for (let i = 0; i < spheres.length; i++)
    for (let j = i + 1; j < spheres.length; j++) {
      const d = dist(spheres[i].c, spheres[j].c), s = spheres[i].r + spheres[j].r;
      if (d < s * (1 - TOL_GEO)) warn("шары " + (i + 1) + " и " + (j + 1) + " на чертеже пересекаются");
    }

  /* числовые подписи: labels и подписанные отрезки построения */
  const all = {};
  gen.forEach(g => Object.assign(all, g.pts || {}));
  const signed = (p.labels || []).map(l => ({ a: l[0], b: l[1], t: l[2], src: "labels" }))
    .concat(((p.construct && p.construct.segments) || []).filter(s => s.length > 2)
      .map(s => ({ a: s[0], b: s[1], t: s[2], src: "построение" })));
  const lscales = [];
  for (const L of signed) {
    const v = labelNum(L.t);
    if (!Number.isFinite(v)) continue;          /* «?», «R», «2R» */
    if (!isPt(all[L.a]) || !isPt(all[L.b])) { err("подпись " + L.a + "–" + L.b + " «" + L.t + "» (" + L.src + "): нет такой точки в сцене"); continue; }
    lscales.push({ L, k: dist(all[L.a], all[L.b]) / v });
  }
  const ref = M.absolute && scale != null ? scale : (lscales.length ? lscales[0].k : null);
  for (const { L, k } of lscales)
    if (relDiff(k, ref) > TOL_GEO)
      err("подпись " + L.a + "–" + L.b + " «" + L.t + "» (" + L.src + "): длина на чертеже " +
        fmt(dist(all[L.a], all[L.b])) + ", в едином масштабе должно быть " + fmt(labelNum(L.t) * ref));

  if (VERBOSE)
    console.log((errs.length === errs0 ? "  ok " : "  !! ") + p.id + " [" + M.kind + "] " + M.what + " | в банке " + p.ans +
      " | шаров " + spheres.length + (scale != null ? ", масштаб " + fmt(scale) : "") +
      (lscales.length ? ", числовых подписей " + lscales.length : ", числовых подписей нет"));
}

/* ============================================================
   6. Прогон
   ============================================================ */
let bank;
try { bank = loadBank(DATA_JS); }
catch (e) {
  console.log("РАСХОЖДЕНИЕ: не удалось загрузить банк: " + e.message);
  console.log("Шар (старые): задач 0, расхождений 1");
  process.exit(1);
}
const { PROBLEMS, sceneData } = bank;
const inTopic = PROBLEMS.filter(p => p && (p.topic || "Параллелепипед") === TOPIC);
const legacy = inTopic.filter(p => /^\d+$/.test(String(p.id)));
if (VERBOSE)
  console.log(DATA_JS + ": задач всего " + PROBLEMS.length + ", в теме «" + TOPIC + "» " + inTopic.length +
    " (старых " + legacy.length + ", новых пропущено " + (inTopic.length - legacy.length) + ")");

/* состав и порядок темы */
if (legacy.length !== EXPECTED_COUNT)
  errs.push("тема «" + TOPIC + "»: старых задач " + legacy.length + ", ожидалось ровно " + EXPECTED_COUNT);
const ids = legacy.map(p => String(p.id));
if (ids.join(",") !== PUBLISHED_ORDER.join(","))
  errs.push("тема «" + TOPIC + "»: состав/порядок старых задач " + ids.join(", ") +
    " ≠ опубликованному " + PUBLISHED_ORDER.join(", ") + " — id и позиции — ключи прогресса");
const head = inTopic.slice(0, legacy.length).map(p => String(p.id));
if (head.join(",") !== ids.join(","))
  errs.push("тема «" + TOPIC + "»: старые задачи должны идти первыми (позиция в теме = stereo3.last." + TOPIC + "), а начало темы: " + head.join(", "));
for (const id of ids) {
  const n = PROBLEMS.filter(p => p && String(p.id) === id).length;
  if (n !== 1) errs.push(id + ": id встречается в PROBLEMS " + n + " раз");
}

for (const p of legacy) {
  try { checkTask(p, sceneData); }
  catch (e) { errs.push(p.id + ": проверка упала: " + (e && e.stack || e)); }
}

warns.forEach(w => console.log("предупреждение " + w));
errs.forEach(e => console.log("РАСХОЖДЕНИЕ " + e));
if (warns.length) console.log("предупреждений: " + warns.length + " (код выхода не меняют; --strict делает их расхождениями)");
console.log("Шар (старые): задач " + legacy.length + ", расхождений " + errs.length);
if (errs.length) process.exit(1);
console.log("LEGACY_SHAR_VERIFY_OK");
