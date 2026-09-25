/* Независимый верификатор СТАРЫХ задач стерео-банка, тема «Комбинации тел».

   Старые задачи — 14 задач с числовыми id (номера Решу ЕГЭ). Под этими id
   у учеников записан прогресс (stereo3.status), а позиция задачи в теме —
   в stereo3.last.<тема>; поэтому здесь ничего не правится — только
   проверяется, в том числе состав и порядок этих 14 задач в теме.

   Что проверяется для каждой задачи
   1. Ответ. Модель задачи распознаётся по формулировке условия p.cond
      (шаблон на всё условие целиком: изменённый текст не пройдёт молча;
      модель обязана совпасть с ожидаемой для этого id). Числа берутся
      регулярками из того же текста. Ответ пересчитывается «с нуля»:
        • конфигурация строится по определению вписанности/описанности
          (касание граней, оснований, боковой поверхности; вершины на сфере),
          размеры, которых нет в условии, находятся бисекцией по касанию;
        • объёмы тел вращения — квадратурой Гаусса — Лежандра по сечениям
          (принцип Кавальери: V = ∫ S(z) dz, площадь круга-сечения — тоже
          интегралом ∫ 2πt dt), площади поверхностей вращения — интегралом
          по меридиану ∫ 2πρ·|γ'| dt;
        • объёмы и площади многогранников — по координатам вершин
          (разбиение на тетраэдры от внутренней точки, векторные произведения);
          многогранник из середин рёбер тетраэдра — выпуклой оболочкой
          (перебор опорных плоскостей), а не вычитанием «уголков»;
        • данное в условии (объём, площадь) превращается в размер бисекцией
          по монотонной функции; сокращённые соотношения из решений
          (Vкон = ⅓Vцил, Vшара = ⅔Vцил, Sшара = ⅔Sцил, V/8 и т. п.)
          нигде не используются;
        • если ответ не должен зависеть от неданной формы (у конуса и цилиндра
          дан только объём; тетраэдр любой), он считается на двух разных
          формах и обязан совпасть.
      p.ans участвует только в итоговой сверке; p.sol и p.hint не читаются.
      Данных «только на рисунке» в этих 14 задачах нет: всё, что нужно для
      ответа, есть в тексте; подписи чертежа идут только в сверку геометрии.
   2. Чертёж — выход sceneData(p), как его собирает тренажёр (единицы задачи,
      z — вверх):
      • каждое тело сцены — действительно то тело, за которое себя выдаёт:
        шар (точки O, P на своих местах), цилиндр и конус (вертикальная ось,
        радиусы, окружности оснований), куб, правильная четырёхугольная
        призма, тетраэдр;
      • взаимное расположение по условию: шар касается всех граней куба /
        оснований и боковой поверхности цилиндра, призма касается цилиндра
        всеми боковыми гранями, у конуса и цилиндра общие основание и высота,
        вершина и окружность основания конуса лежат на шаре;
      • построение 27214: точки — середины всех шести рёбер, закрашенное тело
        совпадает с выпуклой оболочкой середин, его доля объёма даёт ответ;
      • каждая числовая подпись (labels и подписанные отрезки построения),
        размеры тел и объёмы, данные в условии, сводятся к ОДНОМУ масштабу
        на задачу (допуск 1e-6; объём — через ∛); «?» должна стоять на
        отрезке, длина которого — величина модели.
      Расхождение: поле unit задачи (длина условия на единицу сцены) не равно 1/k —
      панель измерений показала бы длины не в единицах условия.
      Предупреждения (не ошибки): сцена подобна условию, но в масштабе
      k ≠ 1, а unit не задан — после «Показать ответ» панель измерений
      (displayLen → fmtLen(scaleFn · unit)) показала бы длины сцены, не
      согласованные с условием; у двух тел одинаковые
      имена точек в разных местах — тренажёр хранит одну точку на имя
      (последнюю), и рёбра/подписи первого тела рисуются от чужой точки.

   Запуск (голый Node, без зависимостей):
     node verify-legacy-komb.js                  — линейка ../../trainers/stereo
     STEREO_ROOT=<папка линейки> node verify-legacy-komb.js
     ключ -v — по строке на каждую задачу;
     ключ --strict — предупреждения о чертеже тоже считаются расхождениями.
   Берутся задачи PROBLEMS с id из одних цифр и topic === "Комбинации тел"
   (ровно 14); новые задачи (id вида komb-01) пропускаются — их проверяет
   verify-komb.js. Код 0 и маркер LEGACY_KOMB_VERIFY_OK — только при нуле
   расхождений. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const STEREO_ROOT = process.env.STEREO_ROOT ||
  path.resolve(__dirname, "..", "..", "trainers", "stereo");
const DATA_JS = path.join(STEREO_ROOT, "js", "data.js");
const TOPIC = "Комбинации тел";
const EXPECTED_COUNT = 14;
/* id → семейство модели; порядок — как в опубликованной линейке */
const EXPECTED = [
  ["5077", "sph-cyl"], ["27043", "sph-cube"], ["27051", "cone-cyl"], ["27064", "prism-cyl"],
  ["27096", "cone-cyl"], ["27105", "sph-cube"], ["27126", "sph-cube"], ["27214", "tetra-mid"],
  ["245348", "sph-cyl"], ["245350", "cone-cyl"], ["245351", "cone-sph"], ["245354", "prism-cyl"],
  ["324449", "sph-cube"], ["505096", "sph-cube"]
];
const TOL_ANS = 1e-9;    /* ответ: относительный допуск */
const TOL_GEO = 1e-6;    /* единый масштаб чертежа: относительный допуск */
const TOL_SHAPE = 1e-9;  /* форма и расположение тел: доля габарита сцены */
const TOL_FREE = 1e-11;  /* ответ не зависит от неданной формы */
const VERBOSE = process.argv.includes("-v") || process.argv.includes("--verbose");
const STRICT = process.argv.includes("--strict");

/* ============================================================
   0. Загрузка data.js в песочницу vm
   Своя копия идеи _load.js (чужие файлы не подключаются): data.js —
   браузерный скрипт, THREE и DOM нужны ему только при отрисовке,
   для загрузки хватает заглушек. Работает и со старым data.js линейки
   (PROBLEMS и sceneData — глобальные const/function), и с объединённым
   (там sceneData — диспетчер, который для старых задач вызывает
   легаси-генератор sceneDataLegacy; точки остаются в единицах задачи).
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
  const src = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
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
  /* const/let верхнего уровня живут в общей лексической области контекста */
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
   1. Векторы и числа
   ============================================================ */
const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const add = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
const scl = (p, s) => [p[0] * s, p[1] * s, p[2] * s];
const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
const norm = p => Math.hypot(p[0], p[1], p[2]);
const dist = (p, q) => norm(sub(p, q));
const unit = p => scl(p, 1 / norm(p));
const midp = (p, q) => scl(add(p, q), 0.5);
const det3 = (u, v, w) => dot(u, cross(v, w));
const centroid = pts => scl(pts.reduce((s, q) => add(s, q), [0, 0, 0]), 1 / pts.length);
const relDiff = (x, y) => Math.abs(x - y) / Math.max(Math.abs(x), Math.abs(y), 1e-300);
const isPt = p => Array.isArray(p) && p.length >= 3 && p.slice(0, 3).every(Number.isFinite);
const fmt = x => (Number.isFinite(x) ? String(+x.toPrecision(12)).replace(".", ",") : String(x));
const subs = s => String(s).replace(/\d/g, d => "₀₁₂₃₄₅₆₇₈₉"[+d]);
const segName = (a, b) => subs(a) + subs(b);
/* расстояние от точки до плоскости через три точки */
const planeDist = (x, a, b, c) => Math.abs(dot(sub(x, a), unit(cross(sub(b, a), sub(c, a)))));
/* расстояние от точки до прямой (ось через a и b) */
const lineDist = (x, a, b) => norm(cross(sub(x, a), unit(sub(b, a))));

/* число из условия или ответа: «4,5» → 4.5; другой формат — не число */
function parseNum(s) {
  const t = String(s).trim();
  if (!/^-?\d+(?:,\d+)?$/.test(t)) return NaN;
  return Number(t.replace(",", "."));
}
/* как тренажёр подписывает длину отрезка после «Показать ответ» (fmtLen);
   нужно только для текста предупреждения, в пересчёт не входит */
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
   2. Квадратура Гаусса — Лежандра (узлы — метод Ньютона)
   ============================================================ */
const GL = (function nodes(n) {
  const x = [], w = [];
  for (let i = 0; i < n; i++) {
    let z = Math.cos(Math.PI * (i + 0.75) / (n + 0.5)), dp = 1;
    for (let it = 0; it < 100; it++) {
      let p0 = 1, p1 = z;
      for (let k = 2; k <= n; k++) { const p2 = ((2 * k - 1) * z * p1 - (k - 1) * p0) / k; p0 = p1; p1 = p2; }
      dp = n * (z * p1 - p0) / (z * z - 1);
      const dz = p1 / dp;
      z -= dz;
      if (Math.abs(dz) < 1e-16) break;
    }
    x.push(z); w.push(2 / ((1 - z * z) * dp * dp));
  }
  return { x, w };
})(20);
function integrate(f, a, b, pieces = 8) {
  const h = (b - a) / pieces;
  let s = 0;
  for (let j = 0; j < pieces; j++) {
    const m = a + (j + 0.5) * h, half = h / 2;
    for (let i = 0; i < GL.x.length; i++) s += GL.w[i] * f(m + half * GL.x[i]) * half;
  }
  return s;
}

/* ============================================================
   3. Меры тел — численно, без готовых формул объёма и площади
   π — только как длина единичной полуокружности в длине окружности 2πt.
   ============================================================ */
const PI = Math.PI;
/* площадь круга радиуса ρ: ∫₀^ρ (длина окружности радиуса t) dt */
const diskArea = rho => integrate(t => 2 * PI * t, 0, rho);
/* объём тела вращения (ось z) по радиусу сечения ρ(z): ∫ S(z) dz */
const volRev = (rho, z0, z1) => integrate(z => diskArea(rho(z)), z0, z1);
/* площадь поверхности вращения по меридиану t → {rho, drho, dz} */
const areaRev = (mer, t0, t1) => integrate(t => { const m = mer(t); return 2 * PI * m.rho * Math.hypot(m.drho, m.dz); }, t0, t1);

const cylVolume = (r, h) => volRev(() => r, 0, h);
const coneVolume = (r, h) => volRev(z => r * (h - z) / h, 0, h);          /* вершина сверху */
const sphereVolume = R => volRev(z => Math.sqrt(Math.max(0, R * R - z * z)), -R, R);
const cylLateral = (r, h) => areaRev(() => ({ rho: r, drho: 0, dz: 1 }), 0, h);
const cylFullArea = (r, h) => diskArea(r) + diskArea(r) + cylLateral(r, h);
const sphereArea = R => areaRev(t => ({ rho: R * Math.sin(t), drho: R * Math.cos(t), dz: R * Math.sin(t) }), 0, PI);

/* выпуклый многогранник { V: вершины, F: грани (индексы по контуру) } */
function polyVolume(P) {
  const c = centroid(P.V);
  let v = 0;
  for (const f of P.F)
    for (let i = 1; i + 1 < f.length; i++)
      v += Math.abs(det3(sub(P.V[f[0]], c), sub(P.V[f[i]], c), sub(P.V[f[i + 1]], c))) / 6;
  return v;
}
function faceArea(P, f) {
  let s = 0;
  for (let i = 1; i + 1 < f.length; i++)
    s += norm(cross(sub(P.V[f[i]], P.V[f[0]]), sub(P.V[f[i + 1]], P.V[f[0]]))) / 2;
  return s;
}
/* расстояния от точки до плоскостей граней: min и max */
function faceDists(P, x, faces) {
  const d = faces.map(f => planeDist(x, P.V[f[0]], P.V[f[1]], P.V[f[2]]));
  return { min: Math.min(...d), max: Math.max(...d) };
}

/* куб [0,a]³, вершины A B C D A1 B1 C1 D1 */
function cube(a) {
  return {
    V: [[0, 0, 0], [a, 0, 0], [a, a, 0], [0, a, 0], [0, 0, a], [a, 0, a], [a, a, a], [0, a, a]],
    F: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]
  };
}
/* шар, вписанный в куб: касается всех шести граней ⇒ радиус — расстояние
   от центра куба до граней (оно обязано быть одинаковым для всех граней) */
function cubeInsphere(a) {
  const C = cube(a);
  const d = faceDists(C, centroid(C.V), C.F);
  if (relDiff(d.min, d.max) > 1e-12) throw new Error("куб модели: центр не равноудалён от граней");
  return d.min;
}
const cubeEdgeForInsphere = R => solveInc(a => cubeInsphere(a), R);

/* правильная четырёхугольная призма: квадрат со стороной a, высота h */
function squarePrism(a, h) {
  const q = a / 2;
  return {
    V: [[-q, -q, 0], [q, -q, 0], [q, q, 0], [-q, q, 0], [-q, -q, h], [q, -q, h], [q, q, h], [-q, q, h]],
    F: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]],
    lat: [2, 3, 4, 5],
    axis: [[0, 0, 0], [0, 0, h]]
  };
}
/* цилиндр вписан в призму: ось — ось призмы, основания — в основаниях призмы,
   боковая поверхность касается всех боковых граней ⇒ r = расстоянию
   от оси до каждой боковой грани */
function prismCylRadius(a) {
  const P = squarePrism(a, 1);
  const faces = P.lat.map(i => P.F[i]);
  const d0 = faceDists(P, P.axis[0], faces), d1 = faceDists(P, P.axis[1], faces);
  if (relDiff(d0.min, d0.max) > 1e-12 || relDiff(d0.min, d1.min) > 1e-12)
    throw new Error("призма модели: ось не равноудалена от боковых граней");
  return d0.min;
}
const prismLateral = (a, h) => { const P = squarePrism(a, h); return P.lat.reduce((s, i) => s + faceArea(P, P.F[i]), 0); };

/* цилиндр, описанный около шара радиуса R с центром в начале координат:
   боковая поверхность касается шара ⇒ расстояние от оси до неё равно R;
   основания — касательные плоскости z = −R и z = +R */
function cylAroundSphere(R) {
  const zBot = -R, zTop = R;
  return { r: R, h: zTop - zBot };
}

/* выпуклая оболочка (перебор опорных плоскостей; грани — треугольники) */
function hull(P) {
  const n = P.length, F = [];
  let size = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) size = Math.max(size, dist(P[i], P[j]));
  const eps = 1e-9 * size;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
    const nr = cross(sub(P[j], P[i]), sub(P[k], P[i]));
    if (norm(nr) < eps * size) continue;
    const u = unit(nr);
    let pos = 0, neg = 0, zero = 0;
    for (let m = 0; m < n; m++) {
      if (m === i || m === j || m === k) continue;
      const d = dot(sub(P[m], P[i]), u);
      if (d > eps) pos++; else if (d < -eps) neg++; else zero++;
    }
    if (pos && neg) continue;
    if (zero) throw new Error("выпуклая оболочка: четыре точки в одной опорной плоскости");
    F.push([i, j, k]);
  }
  return { V: P, F };
}
const TETRA_FACES = [[0, 1, 2], [0, 1, 3], [1, 2, 3], [0, 2, 3]];
const TETRA_EDGES = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
/* две формы тетраэдра: правильный и произвольный «косой» */
const TETRA_SHAPES = [
  [[0, 0, 0], [1, 0, 0], [0.5, Math.sqrt(3) / 2, 0], [0.5, Math.sqrt(3) / 6, Math.sqrt(2 / 3)]],
  [[0, 0, 0], [3, 0.4, 0.2], [0.7, 2.2, -0.3], [1.1, 0.9, 2.6]]
];

/* ============================================================
   4. Решение f(x) = target для возрастающей f, x > 0 (бисекция)
   ============================================================ */
function solveInc(f, target) {
  if (!(target > 0)) throw new Error("бисекция: искомое значение должно быть положительным");
  let lo = 0, hi = 1, n = 0;
  while (!(f(hi) >= target)) { lo = hi; hi *= 2; if (++n > 2000) throw new Error("бисекция: не найдена верхняя граница"); }
  for (let i = 0; i < 400; i++) {
    const m = (lo + hi) / 2;
    if (m <= lo || m >= hi) break;
    if (f(m) < target) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

/* самопроверка численной модели на телах с известной мерой */
function modelSelfCheck() {
  const bad = [];
  const chk = (what, got, want) => { if (!(relDiff(got, want) < 1e-12)) bad.push(`${what}: ${fmt(got)} ≠ ${fmt(want)}`); };
  chk("∫₀¹ x⁹ dx", integrate(x => Math.pow(x, 9), 0, 1), 0.1);
  chk("объём единичного куба", polyVolume(cube(1)), 1);
  chk("объём тетраэдра 0, e₁, e₂, e₃", polyVolume({ V: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]], F: TETRA_FACES }), 1 / 6);
  const oct = hull([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]);
  if (oct.F.length !== 8) bad.push(`оболочка октаэдра: граней ${oct.F.length} ≠ 8`);
  chk("объём октаэдра |x|+|y|+|z| ≤ 1 (две пирамиды 2·⅓·2·1)", polyVolume(oct), 4 / 3);
  chk("площадь круга r = 1", diskArea(1), PI);
  chk("объём цилиндра r = h = 1", cylVolume(1, 1), PI);
  /* dV/dR = площадь сферы: два независимых интеграла согласованы */
  const h = 1e-4, dV = (sphereVolume(1 + h) - sphereVolume(1 - h)) / (2 * h);
  if (!(relDiff(dV, sphereArea(1)) < 1e-7)) bad.push(`dV/dR шара ${fmt(dV)} ≠ площади сферы ${fmt(sphereArea(1))}`);
  chk("бисекция ∛27", solveInc(x => x * x * x, 27), 3);
  if (bad.length) throw new Error("численная модель неточна: " + bad.join("; "));
}

/* ============================================================
   5. Модели задач: шаблон условия → ответ, размеры (lin, в единицах
   условия), объёмы (vol) для сверки со сценой
   ============================================================ */
const NUM = "(\\d+(?:,\\d+)?)";
const tpl = s => new RegExp("^" + s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/#/g, NUM) + "$");

const L_RS = "радиус шара", L_AC = "ребро куба", L_RC = "радиус цилиндра", L_HC = "высота цилиндра",
  L_RK = "радиус основания конуса", L_HK = "высота конуса", L_AP = "сторона основания призмы",
  L_HP = "высота призмы";
const V_K = "объём конуса", V_C = "объём цилиндра", V_T = "объём тетраэдра";

/* конус и цилиндр с общими основанием и высотой; дан объём одного тела.
   r и h по отдельности не заданы ⇒ считаем на двух формах (h = 1,5r и
   h = 0,4r), ответ обязан совпасть */
function coneCyl(Vgiven, given) {
  const outs = [1.5, 0.4].map(q => {
    const r = solveInc(x => (given === "cone" ? coneVolume(x, q * x) : cylVolume(x, q * x)), Vgiven);
    return given === "cone" ? cylVolume(r, q * r) : coneVolume(r, q * r);
  });
  const ans = outs[0];
  return {
    ans, free: relDiff(outs[0], outs[1]) > TOL_FREE ? outs : null,
    vol: given === "cone" ? { [V_K]: Vgiven, [V_C]: ans } : { [V_C]: Vgiven, [V_K]: ans },
    info: `две формы (h = 1,5r и h = 0,4r) дают ${fmt(outs[0])} и ${fmt(outs[1])}`
  };
}

const VARIANTS = [
  { fam: "sph-cyl", name: "шар вписан в цилиндр: Sполн цилиндра → S сферы",
    re: [tpl("Шар вписан в цилиндр. Площадь полной поверхности цилиндра равна #. Найдите площадь поверхности шара.")],
    solve([S]) {
      const R = solveInc(x => { const c = cylAroundSphere(x); return cylFullArea(c.r, c.h); }, S);
      const c = cylAroundSphere(R);
      return { ans: sphereArea(R), lin: { [L_RS]: R, [L_RC]: c.r, [L_HC]: c.h },
        info: `R = ${fmt(R)} из Sполн = ${fmt(S)}` };
    } },
  { fam: "sph-cyl", name: "цилиндр описан около шара: V цилиндра → V шара",
    re: [tpl("Цилиндр описан около шара. Объём цилиндра равен #. Найдите объём шара.")],
    solve([V]) {
      const R = solveInc(x => { const c = cylAroundSphere(x); return cylVolume(c.r, c.h); }, V);
      const c = cylAroundSphere(R);
      return { ans: sphereVolume(R), lin: { [L_RS]: R, [L_RC]: c.r, [L_HC]: c.h },
        vol: { [V_C]: V }, info: `R = ${fmt(R)} из Vцил = ${fmt(V)}` };
    } },
  { fam: "sph-cube", name: "шар радиуса R вписан в куб: V куба",
    re: [tpl("В куб вписан шар радиуса #. Найдите объём куба."),
         tpl("Куб описан около сферы радиуса #. Найдите объём куба.")],
    solve([R]) {
      const a = cubeEdgeForInsphere(R);
      return { ans: polyVolume(cube(a)), lin: { [L_RS]: R, [L_AC]: a }, info: `ребро ${fmt(a)} по касанию граней` };
    } },
  { fam: "sph-cube", name: "куб описан около сферы: V куба → радиус",
    re: [tpl("Объём куба, описанного около сферы, равен #. Найдите радиус сферы.")],
    solve([V]) {
      const a = solveInc(x => polyVolume(cube(x)), V);
      const R = cubeInsphere(a);
      return { ans: R, lin: { [L_RS]: R, [L_AC]: a }, info: `ребро ${fmt(a)} из Vкуба = ${fmt(V)}` };
    } },
  { fam: "sph-cube", name: "шар вписан в куб с ребром a: V шара / π",
    re: [tpl("В куб с ребром # вписан шар. Найдите объём этого шара, делённый на π.")],
    solve([a]) {
      const R = cubeInsphere(a);
      /* деление на π просит само условие */
      return { ans: sphereVolume(R) / PI, lin: { [L_RS]: R, [L_AC]: a }, info: `R = ${fmt(R)} по касанию граней` };
    } },
  { fam: "sph-cube", name: "шар объёма cπ вписан в куб: V куба",
    re: [tpl("Шар, объём которого равен #π, вписан в куб. Найдите объём куба.")],
    solve([c]) {
      const R = solveInc(sphereVolume, c * PI);
      const a = cubeEdgeForInsphere(R);
      return { ans: polyVolume(cube(a)), lin: { [L_RS]: R, [L_AC]: a }, info: `R = ${fmt(R)} из Vшара = ${fmt(c)}π` };
    } },
  { fam: "cone-cyl", name: "общие основание и высота: V конуса → V цилиндра",
    re: [tpl("Цилиндр и конус имеют общие основание и высоту. Объём конуса равен #. Найдите объём цилиндра."),
         tpl("Конус и цилиндр имеют общее основание и общую высоту (конус вписан в цилиндр). Вычислите объём цилиндра, если объём конуса равен #.")],
    solve([V]) { return coneCyl(V, "cone"); } },
  { fam: "cone-cyl", name: "общие основание и высота: V цилиндра → V конуса",
    re: [tpl("Цилиндр и конус имеют общие основание и высоту. Найдите объём конуса, если объём цилиндра равен #.")],
    solve([V]) { return coneCyl(V, "cyl"); } },
  { fam: "prism-cyl", name: "правильная 4-уг. призма около цилиндра (r = h): Sбок призмы",
    re: [tpl("Правильная четырёхугольная призма описана около цилиндра, радиус основания и высота которого равны #. Найдите площадь боковой поверхности призмы.")],
    solve([x]) {
      const r = x, h = x;
      const a = solveInc(prismCylRadius, r);
      return { ans: prismLateral(a, h), lin: { [L_RC]: r, [L_HC]: h, [L_AP]: a, [L_HP]: h },
        info: `сторона основания ${fmt(a)} по касанию граней` };
    } },
  { fam: "prism-cyl", name: "правильная 4-уг. призма около цилиндра: r, Sбок → h",
    re: [tpl("Правильная четырёхугольная призма описана около цилиндра, радиус основания которого равен #. Площадь боковой поверхности призмы равна #. Найдите высоту цилиндра.")],
    solve([r, S]) {
      const a = solveInc(prismCylRadius, r);
      const h = solveInc(t => prismLateral(a, t), S);
      /* основания цилиндра лежат в основаниях призмы: высоты равны */
      return { ans: h, lin: { [L_RC]: r, [L_HC]: h, [L_AP]: a, [L_HP]: h },
        info: `сторона ${fmt(a)} по касанию, h из Sбок = ${fmt(S)}` };
    } },
  { fam: "tetra-mid", name: "середины рёбер тетраэдра: V многогранника",
    re: [tpl("Объём тетраэдра равен #. Найдите объём многогранника, вершинами которого являются середины рёбер данного тетраэдра.")],
    solve([V]) {
      const outs = TETRA_SHAPES.map(T0 => {
        const k = solveInc(x => polyVolume({ V: T0.map(q => scl(q, x)), F: TETRA_FACES }), V);
        const T = T0.map(q => scl(q, k));
        const H = hull(TETRA_EDGES.map(([i, j]) => midp(T[i], T[j])));
        if (H.F.length !== 8) throw new Error(`оболочка середин рёбер: граней ${H.F.length}, ожидалось 8`);
        return polyVolume(H);
      });
      return { ans: outs[0], free: relDiff(outs[0], outs[1]) > TOL_FREE ? outs : null, vol: { [V_T]: V },
        info: `оболочка середин на двух тетраэдрах: ${fmt(outs[0])} и ${fmt(outs[1])}` };
    } },
  { fam: "cone-sph", name: "конус вписан в шар, rосн = R: V шара → V конуса",
    re: [tpl("Конус вписан в шар. Радиус основания конуса равен радиусу шара. Объём шара равен #. Найдите объём конуса.")],
    solve([V]) {
      const R = solveInc(sphereVolume, V);
      const rb = R;                                   /* по условию */
      /* окружность основания лежит на сфере: её радиус — катет,
         расстояние от центра шара до плоскости основания — другой катет */
      const d = Math.sqrt(Math.max(0, R * R - rb * rb));
      /* вершина — на сфере на оси: по другую сторону от центра или по ту же */
      const hs = [R + d, R - d];
      const outs = hs.map(h => coneVolume(rb, h));
      return { ans: outs[0], free: relDiff(outs[0], outs[1]) > TOL_FREE ? outs : null,
        lin: { [L_RS]: R, [L_RK]: rb, [L_HK]: hs[0] },
        info: `R = ${fmt(R)}, плоскость основания в ${fmt(d)} от центра` };
    } }
];

function recognize(cond) {
  const hits = [];
  for (const V of VARIANTS)
    for (const re of V.re) {
      const m = String(cond).match(re);
      if (m) hits.push({ V, nums: m.slice(1).map(parseNum) });
    }
  return hits;
}

/* ============================================================
   6. Сцена: тела из выхода sceneData(p)
   ============================================================ */
const KIND_RU = { sphere: "шар", cyl: "цилиндр", cone: "конус", box: "куб", prism: "призма", tetra: "тетраэдр" };
const hasPts = (g, names) => names.every(n => isPt(g.pts[n]));

function classify(g) {
  const sf = t => (g.surfaces || []).filter(s => s.type === t);
  const names = Object.keys(g.pts || {});
  if (sf("sphere").length) return "sphere";
  if (sf("cyl").length) return "cyl";
  if (sf("cone").length) return "cone";
  if (g.anonymous) return null;
  const box = ["A", "B", "C", "D", "A1", "B1", "C1", "D1"];
  if (names.length === 8 && hasPts(g, box)) return "box";
  if (names.length === 10 && hasPts(g, box.concat(["O", "O1"]))) return "prism";
  if (names.length === 4 && hasPts(g, ["A", "B", "C", "D"])) return "tetra";
  return null;
}

function sceneOf(p) {
  const sd = sceneData(p);
  if (!sd || !Array.isArray(sd.gen) || !sd.gen.length) throw new Error("sceneData не вернула тел (gen)");
  const gens = sd.gen;
  const all = [];
  gens.forEach((g, gi) => {
    for (const [nm, q] of Object.entries(g.pts || {})) {
      if (!isPt(q)) throw new Error(`тело №${gi}: точка ${nm} не конечная: ${JSON.stringify(q)}`);
      all.push(q);
    }
    for (const s of (g.surfaces || [])) {
      if (!isPt(s.c) || !Number.isFinite(s.r) || (s.h != null && !Number.isFinite(s.h)))
        throw new Error(`тело №${gi}: поверхность ${s.type} с не конечными размерами`);
      all.push(add(s.c, [s.r, s.r, s.r]), sub(s.c, [s.r, s.r, s.r]));
    }
  });
  const mn = [0, 1, 2].map(i => Math.min(...all.map(q => q[i])));
  const mx = [0, 1, 2].map(i => Math.max(...all.map(q => q[i])));
  const L = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2], 1e-9);
  /* точки так, как их видит тренажёр: одна точка на имя, последняя побеждает */
  const merged = {}, owner = {}, collisions = [];
  gens.forEach((g, gi) => {
    for (const [nm, q] of Object.entries(g.pts || {})) {
      if (merged[nm] && dist(merged[nm], q) > TOL_SHAPE * L)
        collisions.push({ nm, from: owner[nm], to: gi, was: merged[nm], now: q });
      merged[nm] = q; owner[nm] = gi;
    }
  });
  const bodies = gens.map((g, gi) => ({ kind: classify(g), gi, g, ghost: !!g.ghost }));
  return { sd, gens, L, merged, owner, collisions, bodies };
}

/* проверка формы тела; дополняет body измеренными величинами */
function checkBody(b, S, rel) {
  const g = b.g, P = g.pts, who = `${KIND_RU[b.kind]} (тело №${b.gi})`;
  const vertical = u => { rel(`${who}: ось вертикальна (x)`, u[0], 0); rel(`${who}: ось вертикальна (y)`, u[1], 0); };
  if (b.kind === "sphere") {
    const s = g.surfaces.find(x => x.type === "sphere");
    b.c = s.c; b.r = s.r;
    if (isPt(P.O)) rel(`${who}: O — центр`, dist(P.O, s.c), 0);
    if (isPt(P.P)) rel(`${who}: P на сфере`, dist(P.P, s.c), s.r);
    for (const c of (g.circles || [])) { rel(`${who}: окружность с центром в O`, dist(c.c, s.c), 0); rel(`${who}: радиус окружности`, c.r, s.r); }
  } else if (b.kind === "cyl" || b.kind === "cone") {
    const s = g.surfaces.find(x => x.type === b.kind);
    const top = b.kind === "cyl" ? "O1" : "S";
    if (!hasPts(g, ["O", top, "P"])) throw new Error(`${who}: нет точек O, ${top}, P`);
    if (s.flip) throw new Error(`${who}: перевёрнутый конус-сосуд — не та модель`);
    const u = sub(P[top], P.O);
    b.r = s.r; b.h = s.h; b.O = P.O; b.top = P[top];
    rel(`${who}: |O${top}| = высоте поверхности`, norm(u), s.h);
    if (!(u[2] > 0)) throw new Error(`${who}: ось направлена не вверх`);
    vertical(u);
    rel(`${who}: центр поверхности — середина оси`, dist(s.c, midp(P.O, P[top])), 0);
    for (const n of ["P", "Q"]) if (isPt(P[n])) {
      rel(`${who}: |O${n}| = радиусу`, dist(P[n], P.O), s.r);
      rel(`${who}: O${n} ⟂ оси`, dot(sub(P[n], P.O), unit(u)), 0);
      if (b.kind === "cyl" && isPt(P[n + "1"])) rel(`${who}: ${n}${n}₁ — образующая`, dist(P[n + "1"], add(P[n], u)), 0);
    }
    for (const c of (g.circles || [])) {
      const at = Math.min(dist(c.c, P.O), b.kind === "cyl" ? dist(c.c, P[top]) : Infinity);
      rel(`${who}: окружность в центре основания`, at, 0);
      rel(`${who}: радиус окружности основания`, c.r, s.r);
    }
  } else if (b.kind === "box") {
    const e1 = sub(P.B, P.A), e2 = sub(P.D, P.A), e3 = sub(P.A1, P.A);
    const E = [norm(e1), norm(e2), norm(e3)];
    rel(`${who}: AB ⟂ AD`, dot(e1, e2) / E[1], 0);
    rel(`${who}: AB ⟂ AA₁`, dot(e1, e3) / E[2], 0);
    rel(`${who}: AD ⟂ AA₁`, dot(e2, e3) / E[2], 0);
    rel(`${who}: C = B + AD`, dist(P.C, add(P.B, e2)), 0);
    for (const n of ["B", "C", "D"]) rel(`${who}: ${n}₁ = ${n} + AA₁`, dist(P[n + "1"], add(P[n], e3)), 0);
    b.edges = E; b.center = centroid(["A", "B", "C", "D", "A1", "B1", "C1", "D1"].map(n => P[n]));
    b.planes = [["A", "B", "C"], ["A1", "B1", "C1"], ["A", "B", "B1"], ["B", "C", "C1"], ["C", "D", "D1"], ["D", "A", "A1"]]
      .map(t => ({ name: t.map(subs).join(""), pts: t.map(n => P[n]) }));
  } else if (b.kind === "prism") {
    const base = ["A", "B", "C", "D"], u = sub(P.O1, P.O);
    const a = dist(P.A, P.B);
    for (let i = 0; i < 4; i++) rel(`${who}: сторона ${base[i]}${base[(i + 1) % 4]} = AB`, dist(P[base[i]], P[base[(i + 1) % 4]]), a);
    rel(`${who}: диагонали основания равны`, dist(P.A, P.C), dist(P.B, P.D));
    const n = unit(cross(sub(P.B, P.A), sub(P.C, P.A)));
    rel(`${who}: основание плоское`, dot(sub(P.D, P.A), n), 0);
    rel(`${who}: O — центр основания`, dist(P.O, centroid(base.map(x => P[x]))), 0);
    rel(`${who}: боковое ребро ⟂ основанию`, norm(cross(n, unit(u))), 0);
    for (const x of base) rel(`${who}: ${x}₁ = ${x} + OO₁`, dist(P[x + "1"], add(P[x], u)), 0);
    b.a = a; b.h = norm(u); b.O = P.O; b.O1 = P.O1;
    b.lat = [["A", "B", "B1"], ["B", "C", "C1"], ["C", "D", "D1"], ["D", "A", "A1"]]
      .map(t => ({ name: t.map(subs).join(""), pts: t.map(x => P[x]) }));
  } else if (b.kind === "tetra") {
    b.V = ["A", "B", "C", "D"].map(n => P[n]);
    b.vol = polyVolume({ V: b.V, F: TETRA_FACES });
    if (!(b.vol > 1e-9 * S.L * S.L * S.L)) throw new Error(`${who}: вырожден`);
  }
}

/* ============================================================
   7. Сверка сцены по семействам моделей
   ============================================================ */
const one = (S, kind) => S.bodies.find(b => b.kind === kind);

const FAMILIES = {
  "sph-cyl": { bodies: ["cyl", "sphere"], geo(p, S, res, C) {
    const cy = one(S, "cyl"), sp = one(S, "sphere");
    C.rel("центр шара на оси цилиндра", lineDist(sp.c, cy.O, cy.top), 0);
    C.rel("шар касается нижнего основания", dot(sub(sp.c, cy.O), unit(sub(cy.top, cy.O))), sp.r);
    C.rel("шар касается верхнего основания", dot(sub(cy.top, sp.c), unit(sub(cy.top, cy.O))), sp.r);
    C.rel("шар касается боковой поверхности (r цилиндра = R)", cy.r, sp.r);
    C.fact(L_RS, sp.r, res.lin[L_RS]);
    C.fact(L_RC, cy.r, res.lin[L_RC]);
    C.fact(L_HC, cy.h, res.lin[L_HC]);
    if (res.vol && res.vol[V_C]) C.fact(V_C, cylVolume(cy.r, cy.h), res.vol[V_C], 3);
  } },
  "sph-cube": { bodies: ["box", "sphere"], geo(p, S, res, C) {
    const bx = one(S, "box"), sp = one(S, "sphere");
    C.rel("куб: AD = AB", bx.edges[1], bx.edges[0]);
    C.rel("куб: AA₁ = AB", bx.edges[2], bx.edges[0]);
    C.rel("центр шара = центр куба", dist(sp.c, bx.center), 0);
    for (const pl of bx.planes) C.rel(`шар касается грани ${pl.name}…`, planeDist(sp.c, ...pl.pts), sp.r);
    C.fact(L_RS, sp.r, res.lin[L_RS]);
    C.fact(L_AC, bx.edges[0], res.lin[L_AC]);
  } },
  "cone-cyl": { bodies: ["cone", "cyl"], geo(p, S, res, C) {
    const cy = one(S, "cyl"), co = one(S, "cone");
    C.rel("общее основание: центр", dist(co.O, cy.O), 0);
    C.rel("общее основание: радиус", co.r, cy.r);
    C.rel("общая высота: вершина конуса в центре верхнего основания", dist(co.top, cy.top), 0);
    C.fact(V_K, coneVolume(co.r, co.h), res.vol[V_K], 3);
    C.fact(V_C, cylVolume(cy.r, cy.h), res.vol[V_C], 3);
    C.free = "r и h по отдельности условием не заданы";
  } },
  "prism-cyl": { bodies: ["cyl", "prism"], geo(p, S, res, C) {
    const cy = one(S, "cyl"), pr = one(S, "prism");
    C.rel("нижнее основание цилиндра — в основании призмы, ось через O", dist(cy.O, pr.O), 0);
    C.rel("верхнее основание цилиндра — в основании призмы, ось через O₁", dist(cy.top, pr.O1), 0);
    for (const pl of pr.lat) {
      C.rel(`цилиндр касается грани ${pl.name}… (внизу)`, planeDist(cy.O, ...pl.pts), cy.r);
      C.rel(`цилиндр касается грани ${pl.name}… (вверху)`, planeDist(cy.top, ...pl.pts), cy.r);
    }
    C.fact(L_RC, cy.r, res.lin[L_RC]);
    C.fact(L_HC, cy.h, res.lin[L_HC]);
    C.fact(L_AP, pr.a, res.lin[L_AP]);
    C.fact(L_HP, pr.h, res.lin[L_HP]);
  } },
  "cone-sph": { bodies: ["cone", "sphere"], geo(p, S, res, C) {
    const co = one(S, "cone"), sp = one(S, "sphere");
    const u = unit(sub(co.top, co.O));
    C.rel("центр шара на оси конуса", lineDist(sp.c, co.O, co.top), 0);
    C.rel("вершина конуса на сфере", dist(co.top, sp.c), sp.r);
    C.rel("окружность основания на сфере", Math.hypot(dot(sub(co.O, sp.c), u), co.r), sp.r);
    C.rel("радиус основания конуса = радиусу шара", co.r, sp.r);
    C.fact(L_RS, sp.r, res.lin[L_RS]);
    C.fact(L_RK, co.r, res.lin[L_RK]);
    C.fact(L_HK, co.h, res.lin[L_HK]);
  } },
  "tetra-mid": { bodies: ["tetra"], geo(p, S, res, C) {
    const te = one(S, "tetra");
    C.fact(V_T, te.vol, res.vol[V_T], 3);
    C.free = "форма тетраэдра условием не задана";
    /* построение: середины всех рёбер и закрашенное тело */
    const cst = p.construct || {};
    const names = ["A", "B", "C", "D"];
    const mids = {}, pairs = new Set();
    for (const [nm, spec] of Object.entries(cst.points || {})) {
      if (!Array.isArray(spec) || spec[0] !== "mid" || !names.includes(spec[1]) || !names.includes(spec[2]) || spec[1] === spec[2]) {
        C.E(`построение: точка ${nm} — не середина ребра тетраэдра (${JSON.stringify(spec)})`); continue;
      }
      const key = [spec[1], spec[2]].sort().join("");
      if (pairs.has(key)) C.E(`построение: середина ребра ${key} задана дважды`);
      pairs.add(key);
      mids[nm] = midp(S.merged[spec[1]], S.merged[spec[2]]);   /* как resolvePt тренажёра */
    }
    const allEdges = TETRA_EDGES.map(([i, j]) => names[i] + names[j]);
    const missing = allEdges.filter(k => !pairs.has(k));
    if (missing.length) { C.E(`построение: нет середин рёбер ${missing.join(", ")}`); return; }
    const mn = Object.keys(mids);
    const H = hull(mn.map(n => mids[n]));
    const want = new Set(H.F.map(f => f.map(i => mn[i]).sort().join(" ")));
    const got = new Set((cst.solid || []).map(f => f.slice().sort().join(" ")));
    for (const f of want) if (!got.has(f)) C.E(`построение: у тела нет грани ${f} (есть у оболочки середин)`);
    for (const f of got) if (!want.has(f)) C.E(`построение: грань ${f} не лежит на оболочке середин`);
    const frac = polyVolume(H) / te.vol;
    C.relR("доля объёма тела построения × объём из условия = ответ модели", frac * res.vol[V_T], res.ans);
  } }
};

/* ============================================================
   8. Одна задача
   ============================================================ */
function verifyOne(p, want, errs, warns) {
  const id = String(p.id);
  const E = msg => errs.push(`${id}: ${msg}`);
  const W = msg => warns.push(`${id}: ${msg}`);
  const WG = STRICT ? E : W;

  /* 1) ответ */
  const hits = recognize(p.cond);
  if (hits.length !== 1) {
    E(hits.length ? `условие подходит к ${hits.length} шаблонам` : "условие не распознано ни одним шаблоном (текст изменён?)");
    return;
  }
  const { V: M, nums } = hits[0];
  if (M.fam !== want) E(`условие распознано как «${M.name}», а для этого id ожидается семейство ${want}`);
  if (nums.some(x => !Number.isFinite(x))) { E(`числа условия не разобраны: ${nums.join(", ")}`); return; }
  const res = M.solve(nums);
  if (res.free) E(`ответ зависит от неданной формы: ${res.free.map(fmt).join(" ≠ ")} — условие не определяет ответ`);
  const stored = parseNum(p.ans);
  if (!Number.isFinite(stored)) E(`ответ «${p.ans}» не в формате бланка ЕГЭ (целое или десятичная дробь через запятую)`);
  else if (!(relDiff(stored, res.ans) <= TOL_ANS))
    E(`ответ в банке ${p.ans}, независимый пересчёт ${fmt(res.ans)} [${M.name}; ${res.info}]`);

  /* 2) сцена */
  const S = sceneOf(p);
  const F = FAMILIES[M.fam];
  const kinds = S.bodies.map(b => b.kind || "?").sort();
  if (kinds.join(",") !== F.bodies.slice().sort().join(",")) {
    E(`на чертеже тела [${kinds.map(k => KIND_RU[k] || k).join(", ")}], по условию нужны [${F.bodies.map(k => KIND_RU[k]).join(", ")}]`);
    return;
  }
  const rel = (what, got, wantV) => {
    if (!(Math.abs(got - wantV) <= TOL_SHAPE * S.L)) E(`чертёж: ${what}: на сцене ${fmt(got)}, должно быть ${fmt(wantV)}`);
  };
  for (const b of S.bodies) checkBody(b, S, rel);
  const facts = [];
  const C = {
    E, rel, free: null,
    relR(what, got, wantV) { if (!(relDiff(got, wantV) <= TOL_ANS)) E(`чертёж: ${what}: ${fmt(got)} ≠ ${fmt(wantV)}`); },
    fact(what, scene, wantV, pow = 1, src = "модель по условию") { facts.push({ what, scene, want: wantV, pow, src }); }
  };
  F.geo(p, S, res, C);

  /* подписи чертежа: labels и подписанные отрезки построения */
  const condNums = (String(p.cond).match(/\d+(?:,\d+)?/g) || []).map(parseNum);
  const segs = [];
  for (const l of (p.labels || [])) segs.push({ src: "подпись", a: l[0], b: l[1], t: l[2] });
  for (const s of ((p.construct && p.construct.segments) || []))
    if (s[2] != null) segs.push({ src: "построение", a: s[0], b: s[1], t: s[2] });
  const question = [];
  for (const sg of segs) {
    if (!isPt(S.merged[sg.a]) || !isPt(S.merged[sg.b])) { E(`${sg.src} ${sg.a}–${sg.b}: такой точки на чертеже нет`); continue; }
    const len = dist(S.merged[sg.a], S.merged[sg.b]);
    const t = String(sg.t).trim();
    if (t === "?") { question.push({ sg, len }); continue; }
    const v = parseNum(t);
    if (!Number.isFinite(v)) continue;                      /* «r», «2R» и т. п. — не число */
    C.fact(`${sg.src} ${segName(sg.a, sg.b)} = «${t}»`, len, v, 1, "подпись");
    if (!condNums.some(x => relDiff(x, v) < 1e-12))
      WG(`${sg.src} ${segName(sg.a, sg.b)} = «${t}»: такого числа нет в условии (данные только на рисунке)`);
  }
  /* dims: у этих задач сцена задана scene.prims; если бы была задана dims,
     рёбра коробки сверялись бы с ними тем же масштабом */
  if (Array.isArray(p.dims) && one(S, "box")) {
    const e = one(S, "box").edges.slice().sort((x, y) => x - y), d = p.dims.map(Number).sort((x, y) => x - y);
    e.forEach((x, i) => C.fact(`ребро коробки №${i + 1} (dims)`, x, d[i], 1, "dims"));
  }

  /* единый масштаб: опорный — тот, на котором сходится больше всего фактов */
  const kOf = f => Math.pow(f.scene / f.want, 1 / f.pow);
  const usable = facts.filter(f => {
    if (f.want > 0 && f.scene > 0 && Number.isFinite(f.scene) && Number.isFinite(f.want)) return true;
    E(`${f.what}: на сцене ${fmt(f.scene)}, по данным ${fmt(f.want)} — нулевая или не конечная величина`);
    return false;
  });
  let ref = null, best = 0;
  for (const f of usable) {
    const n = usable.filter(g => relDiff(kOf(g), kOf(f)) <= TOL_GEO).length;
    if (n > best) { best = n; ref = f; }
  }
  const k0 = ref ? kOf(ref) : null;
  for (const f of usable) {
    if (f === ref) continue;
    const k = kOf(f);
    if (relDiff(k, k0) <= TOL_GEO) continue;
    const unitTxt = f.pow === 3 ? " (объём)" : f.pow === 2 ? " (площадь)" : "";
    E(`чертёж не в масштабе: ${f.what}${unitTxt} на сцене ${fmt(f.scene)}, по данным (${f.src}) ${fmt(f.want)} → ` +
      `масштаб ${fmt(k)}; а ${ref.what}: на сцене ${fmt(ref.scene)}, по данным (${ref.src}) ${fmt(ref.want)} → масштаб ${fmt(k0)}`);
  }
  /* «?» — на отрезке, длина которого есть величина модели */
  const qNotes = [];
  for (const { sg, len } of question) {
    if (k0 === null || !res.lin) { WG(`${sg.src} ${segName(sg.a, sg.b)} «?»: масштаб или размеры модели не определены — не с чем сверить`); continue; }
    const hit = Object.entries(res.lin).find(([, v]) => relDiff(len / k0, v) <= TOL_GEO);
    if (hit) qNotes.push(`«?» на ${segName(sg.a, sg.b)} = ${hit[0]} ${fmt(hit[1])}`);
    else WG(`${sg.src} ${segName(sg.a, sg.b)} «?»: длина ${fmt(len / k0)} в единицах условия — не величина модели (${Object.keys(res.lin).join(", ")})`);
  }

  /* масштаб k ≠ 1: форма верна, но после «Показать ответ» тренажёр подписывает
     выбранный отрезок его длиной на сцене, без пересчёта (displayLen → fmtLen(scaleFn)) */
  if (unitCheck(p, k0, E)) {
    const shown = [];
    const seen = new Set();
    const KEY = { sphere: [["O", "P"]], cyl: [["O", "P"], ["O", "O1"]], cone: [["O", "P"], ["O", "S"]],
      box: [["A", "B"]], prism: [["A", "B"], ["A", "A1"]], tetra: [["A", "B"]] };
    for (const b of S.bodies)
      for (const [x, y] of (KEY[b.kind] || [])) {
        const key = [x, y].sort().join("–");
        if (seen.has(key) || !isPt(S.merged[x]) || !isPt(S.merged[y])) continue;
        seen.add(key);
        const len = dist(S.merged[x], S.merged[y]);
        shown.push(`${segName(x, y)} = ${shownLen(len)} (в единицах условия ${fmt(len / k0)})`);
      }
    WG(`чертёж подобен условию, но в масштабе ${fmt(k0)} (по: ${ref.what}${C.free ? "; " + C.free : ""}), а unit не задан; ` +
      `после «Показать ответ» панель измерений покажет длину отрезка на сцене ` +
      `(displayLen → fmtLen(scaleFn · unit)): ученик увидит ${shown.join(", ")} (нужно unit = ${fmt(1 / k0)})`);
  }

  /* одинаковые имена точек у разных тел в разных местах */
  const byPair = {};
  for (const c of S.collisions) (byPair[c.from + ">" + c.to] = byPair[c.from + ">" + c.to] || []).push(c);
  for (const list of Object.values(byPair)) {
    const b1 = S.bodies[list[0].from], b2 = S.bodies[list[0].to];
    const nms = list.map(c => c.nm);
    const edges = (b1.g.edges || []).filter(([x, y]) => nms.includes(x) || nms.includes(y)).map(([x, y]) => segName(x, y));
    WG(`точки ${nms.map(subs).join(", ")} есть и у тела «${KIND_RU[b1.kind]}», и у тела «${KIND_RU[b2.kind]}», но в разных местах ` +
      `(${list.map(c => `${subs(c.nm)}: ${JSON.stringify(c.was.map(v => +v.toPrecision(6)))} и ${JSON.stringify(c.now.map(v => +v.toPrecision(6)))}`).join("; ")}); ` +
      `тренажёр хранит одну точку на имя (последнюю — у тела «${KIND_RU[b2.kind]}»), поэтому ` +
      (edges.length ? `рёбра ${edges.join(", ")} тела «${KIND_RU[b1.kind]}» проведены от точек тела «${KIND_RU[b2.kind]}», ` : "") +
      (b1.g.hideLabels ? "" : `подписи ${nms.map(subs).join(", ")} тела «${KIND_RU[b1.kind]}» стоят там же; `) +
      `числа на рисунке это не затрагивает`);
  }

  if (VERBOSE)
    console.log(`  ${id.padEnd(7)} ответ ${String(p.ans).padEnd(5)} пересчёт ${fmt(res.ans).padEnd(8)} ` +
      `[${M.name}] ${res.info}; фактов масштаба ${facts.length}` +
      (k0 !== null ? `, масштаб ${fmt(k0)}` : ", масштаб условием не задан") +
      (qNotes.length ? `; ${qNotes.join("; ")}` : ""));
}

/* ============================================================
   9. Прогон
   ============================================================ */
let PROBLEMS, sceneData;
function main() {
  let api;
  try { api = loadData(DATA_JS); }
  catch (e) {
    console.log(`Не удалось загрузить ${DATA_JS}: ${e.message}`);
    console.log("Комбинации тел (старые): задач 0, расхождений 1");
    process.exit(1);
  }
  ({ PROBLEMS, sceneData } = api);
  const errs = [], warns = [];
  try { modelSelfCheck(); }
  catch (e) { errs.push("верификатор: " + e.message); }

  const legacy = PROBLEMS.filter(p => p && /^\d+$/.test(String(p.id)) && p.topic === TOPIC);
  console.log(`Линейка: ${DATA_JS}`);
  console.log(`Задач в PROBLEMS: ${PROBLEMS.length}; старых «${TOPIC}» (числовой id): ${legacy.length}`);
  if (legacy.length !== EXPECTED_COUNT)
    errs.push(`банк: старых задач темы «${TOPIC}» ${legacy.length}, должно быть ровно ${EXPECTED_COUNT}`);
  const expIds = EXPECTED.map(x => x[0]);
  const gotIds = legacy.map(p => String(p.id));
  for (const id of expIds) if (!gotIds.includes(id)) errs.push(`${id}: задачи нет в банке (под этим id у учеников прогресс)`);
  for (const id of gotIds) if (!expIds.includes(id)) errs.push(`${id}: лишняя старая задача в теме — её нет в опубликованной линейке`);
  for (const id of new Set(gotIds))
    if (PROBLEMS.filter(p => p && String(p.id) === id).length !== 1) errs.push(`${id}: id встречается в PROBLEMS не один раз`);
  /* stereo3.last.<тема> хранит позицию в теме: старые задачи идут первыми и в прежнем порядке */
  const topicIds = PROBLEMS.filter(p => p && p.topic === TOPIC).map(p => String(p.id));
  const head = topicIds.slice(0, expIds.length);
  if (head.join(",") !== expIds.join(","))
    errs.push(`банк: в теме «${TOPIC}» первые ${expIds.length} задач [${head.join(", ")}], а должны быть старые в прежнем порядке ` +
      `[${expIds.join(", ")}] — иначе stereo3.last.${TOPIC} укажет ученику на другую задачу`);

  const wantFam = Object.fromEntries(EXPECTED);
  for (const p of legacy) {
    try { verifyOne(p, wantFam[String(p.id)], errs, warns); }
    catch (e) { errs.push(`${p.id}: проверка не выполнена: ${e.message}`); }
  }
  warns.forEach(w => console.log("предупреждение " + w));
  errs.forEach(e => console.log("РАСХОЖДЕНИЕ " + e));
  console.log(`Комбинации тел (старые): задач ${legacy.length}, расхождений ${errs.length}`);
  if (warns.length) console.log(`(предупреждений ${warns.length} — на код выхода не влияют; --strict делает их расхождениями)`);
  if (errs.length) process.exit(1);
  console.log("LEGACY_KOMB_VERIFY_OK");
}
main();
