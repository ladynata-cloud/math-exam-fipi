/* ============================================================
   data.js — объединённый банк задач «Стереометрия · Задание 3 ЕГЭ
   (профиль)» и генераторы сцен для движка js/trainer.js.

   Файл СОБИРАЕТСЯ скриптом ege-profil/_istochniki/stereo-bank/sync-data.js
   из исходников банка (engine.js, engine-legacy.js, problems-*.js).
   Руками не править: верификаторы проверяют исходники, а sync-data.js —
   что опубликован именно их сборочный результат.

   Откуда задачи (состав на 24.09.2026):
     • 143 задачи открытого банка задания 3 (Решу ЕГЭ). id — номер задачи
       на math-ege.sdamgia.ru, у каждой в тренажёре ссылка на задачу.
       Перенесены из линейки trainers/ege-profile-stereometry-3d
       (коммит 4dc0592) вместе с их генераторами сцен (engine-legacy.js);
       id, условия, ответы, подсказки, решения и порядок — дословно (под id
       у учеников записан прогресс). По решению владельца (24.09.2026)
       у части задач исправлен чертёж (сцена, подписи, построение), а у задач
       со сценой в масштабе k ≠ 1 добавлено поле unit — длина в единицах
       условия на единицу сцены: панель измерений показывает fmtLen(длина
       на сцене · unit). Список и причины — legacy-parity.js.
     • 138 задач составлены по типовым моделям задания 3 (id вида kub-01):
       числа свои, формулировки по типовым моделям; у 17 задач условия,
       повторявшие шаблон текста открытого банка, 26.09.2026 переписаны
       своими словами (список — ege-profil/_istochniki/README.md, тексты
       «было/стало» — docs/tasks/STEREO_OWN_WORDING_17.md). Каждый ответ
       пересчитан независимым скриптом от текста условия, сцена сверена
       с условием.
     • 7 задач темы «Развёртки» — приложение сверх типов задания 3
       (в счётчик задания 3 не входят).
   В каждой теме сначала старые задачи в прежнем порядке, потом новые —
   так номер позиции в stereo3.last.<тема> указывает на ту же задачу,
   что в опубликованной линейке. Совместимость — только по темам:
   у марафона (stereo3.last.all) порядок иной (сначала Куб, как на главной).

   Структура файла:
     1. Палитра (COL — числовые цвета Three.js, PAL — CSS-цвета)
     2. Хелперы: SUB, segKey, fmtLen, parseAns, makeSprite
     3. Строители тел (box, lshape, prism, pyramid, cyl, cone, sphere, custom)
     4. sceneData(p) — сборка сцены задачи; задачи старого формата
        (scene.prims / dims) передаются в sceneDataLegacy
     5. TOPICS
     6. engine-legacy: генераторы сцен старого банка (genPrim, sceneDataLegacy)
     7. Тематические массивы P_LEGACY_* и P_* и общий PROBLEMS
   ============================================================ */

/* ---------- 1. Палитра ---------- */
const COL = {
  grid: 0xDCD9CC,
  edge: 0x3d5a8f,       /* рёбра многогранников (легенда) */
  face: 0x2B5FD9,       /* плоские выноски-полигоны */
  fill: 0xE9A13B,       /* заливки построения */
  vertex: 0x1D2434,
  ghost: 0xAEB4C4,      /* «призрачное» тело */
  terraFace: 0xE3A87C,  /* тела вращения — терракота */
  terraEdge: 0xA85B28,
  terraRing: 0x8F4A1D,
  magFace: 0x9FB7E4,    /* многогранники — голубой */
  magEdge: 0x3d5a8f,
  construct: 0xDE8A0D,  /* построение (легенда) */
  water: 0x3E9BD6,
  select: 0xD93A6A,     /* выделено (легенда) */
  user: 0x178A5F        /* отрезки, построенные учеником */
};
const PAL = {
  blue: "#2B5FD9", amber: "#DE8A0D", rose: "#D93A6A",
  green: "#178A5F", red: "#C9403F", ink: "#1D2434"
};

/* ---------- 2. Хелперы ---------- */

/* «A1» → «A₁» для подписей вершин */
const SUB = name => String(name).replace(/\d/g, d => "₀₁₂₃₄₅₆₇₈₉"[+d]);

/* канонический ключ отрезка */
const segKey = (a, b) => (a < b ? a + "|" + b : b + "|" + a);

/* длина в единицах задачи → строка для ученика (панель измерений):
     • целое → «n»;
     • x = √m для целого m ≤ FMT_ROOT_MAX, допуск — по самой длине:
       |√m − x| ≤ 1e-9·max(1, x) → корень в школьной записи, множитель
       вынесен: 8 → «2√2», 12 → «2√3», 5 → «√5». (Допуск 1e-6·m на квадрат
       длины, как было раньше, у длин от ≈30 принимал за корень числа,
       корнями не являющиеся, а от ≈707 — любое число.)
     • иначе — до сотых, с запятой, без хвостовых нулей: «2,5», «3,46».
       Сотые считаются целым числом, +1e-9 — против погрешности float:
       2,675 (в float 2,67499…) → «2,68». */
const FMT_ROOT_MAX = 1e5;   /* корни длин до ≈316; в банке самая длинная линия ≈72 */
function fmtLen(x) {
  if (!isFinite(x)) return String(x);
  if (x < 0) return "-" + fmtLen(-x);
  const n = Math.round(x);
  if (Math.abs(x - n) <= 1e-9 * Math.max(1, x)) return String(n);
  const m = Math.round(x * x);
  if (m > 0 && m <= FMT_ROOT_MAX && Math.abs(Math.sqrt(m) - x) <= 1e-9 * Math.max(1, x)) {
    let out = 1, rad = m;
    for (let f = 2; f * f <= rad; f++) while (rad % (f * f) === 0) { rad /= f * f; out *= f; }
    return rad === 1 ? String(out) : (out > 1 ? String(out) : "") + "√" + rad;
  }
  const c = Math.round(x * 100 + 1e-9);          /* x в сотых, целое */
  const s = String(Math.floor(c / 100)) + "," + String(c % 100).padStart(2, "0");
  return s.replace(/0+$/, "").replace(/,$/, "");
}

/* «2,5» → 2.5; поддерживает простые дроби «3/4» */
function parseAns(v) {
  const s = String(v).replace(",", ".").replace(/\s/g, "");
  const m = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (m) { const d = parseFloat(m[2]); return d ? parseFloat(m[1]) / d : NaN; }
  return parseFloat(s);
}

/* спрайт-подпись на канвасе */
function makeSprite(text, { fontPx = 44, color = PAL.ink, bg = null, pad = 8, italicSerif = true } = {}) {
  const cv = document.createElement("canvas");
  const ctx = cv.getContext("2d");
  const font = (italicSerif ? "italic " : "") + "600 " + fontPx + "px " + (italicSerif ? "Georgia, serif" : "'Segoe UI', system-ui, sans-serif");
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const h = Math.ceil(fontPx * 1.35) + pad * 2;
  cv.width = w * 2; cv.height = h * 2;           /* ретина */
  const c2 = cv.getContext("2d");
  c2.scale(2, 2);
  if (bg) {
    c2.fillStyle = bg;
    const r = Math.min(12, h / 2);
    c2.beginPath();
    c2.moveTo(r, 0); c2.lineTo(w - r, 0); c2.arcTo(w, 0, w, r, r);
    c2.lineTo(w, h - r); c2.arcTo(w, h, w - r, h, r);
    c2.lineTo(r, h); c2.arcTo(0, h, 0, h - r, r);
    c2.lineTo(0, r); c2.arcTo(0, 0, r, 0, r);
    c2.fill();
  }
  c2.font = font;
  c2.fillStyle = color;
  c2.textBaseline = "middle";
  c2.fillText(text, pad, h / 2 + 1);
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  const H = 0.34 * (fontPx / 44);                 /* мировая высота подписи */
  sp.scale.set(H * w / h, H, 1);
  sp.renderOrder = 10;
  return sp;
}

/* ---------- 3. Строители тел ----------
   Каждый строитель возвращает нормализованное тело:
   { pts, faces, edges, circles, surfaces, coordLabels,
     ghost, matKind, anonymous, hideLabels }
   Координаты — в ЕДИНИЦАХ ЗАДАЧИ, y — вверх. */

function _blank(spec) {
  return {
    pts: {}, faces: [], edges: [], circles: [], surfaces: [],
    coordLabels: spec.coordLabels || [],
    ghost: !!spec.ghost, matKind: spec.matKind || null,
    anonymous: !!spec.anonymous, hideLabels: !!spec.hideLabels
  };
}
const _off = spec => spec.at || [0, 0, 0];
const _shift = (p, o) => [p[0] + o[0], p[1] + o[1], p[2] + o[2]];

/* прямоугольный параллелепипед a(x) × b(z) × h(y), низ на y=0 */
function buildBox(spec) {
  const g = _blank(spec);
  const { a, b, h } = spec;
  const nm = spec.names || ["A", "B", "C", "D"];
  const top = nm.map(n => n + "1");
  const o = _off(spec);
  const base = [[0, 0, b], [a, 0, b], [a, 0, 0], [0, 0, 0]];   /* A спереди слева */
  nm.forEach((n, i) => { g.pts[n] = _shift(base[i], o); });
  top.forEach((n, i) => { g.pts[n] = _shift([base[i][0], h, base[i][2]], o); });
  g.faces = [
    [nm[0], nm[1], nm[2], nm[3]], [top[0], top[1], top[2], top[3]],
    [nm[0], nm[1], top[1], top[0]], [nm[1], nm[2], top[2], top[1]],
    [nm[2], nm[3], top[3], top[2]], [nm[3], nm[0], top[0], top[3]]
  ];
  for (let i = 0; i < 4; i++) {
    g.edges.push([nm[i], nm[(i + 1) % 4]], [top[i], top[(i + 1) % 4]], [nm[i], top[i]]);
  }
  g._boxDims = { a: a, b: h, c: b };   /* для firstBox: порядок x, y, z */
  return g;
}

/* прямая призма над прямоугольным (rectilinear) многоугольником.
   footprint — вершины по контуру [[x,z],…], faceRects — разбиение
   основания на прямоугольники [[x0,z0,x1,z1],…], h — высота. */
function buildLshape(spec) {
  const g = _blank(spec);
  const { footprint, faceRects, h } = spec;
  const nm = spec.names || footprint.map((_, i) => String.fromCharCode(65 + i));
  const top = nm.map(n => n + "1");
  const o = _off(spec);
  footprint.forEach((p2, i) => {
    g.pts[nm[i]] = _shift([p2[0], 0, p2[1]], o);
    g.pts[top[i]] = _shift([p2[0], h, p2[1]], o);
  });
  const n = footprint.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    g.edges.push([nm[i], nm[j]], [top[i], top[j]], [nm[i], top[i]]);
    g.faces.push([nm[i], nm[j], top[j], top[i]]);
  }
  /* низ и верх — прямоугольниками разбиения, с безымянными углами */
  let anon = 0;
  const ptAt = (x, y, z) => {
    for (const [k, p] of Object.entries(g.pts))
      if (Math.abs(p[0] - x - o[0]) < 1e-9 && Math.abs(p[1] - y - o[1]) < 1e-9 && Math.abs(p[2] - z - o[2]) < 1e-9) return k;
    const k = "_r" + (anon++);
    g.pts[k] = _shift([x, y, z], o);
    return k;
  };
  for (const [x0, z0, x1, z1] of faceRects) {
    g.faces.push([ptAt(x0, 0, z0), ptAt(x1, 0, z0), ptAt(x1, 0, z1), ptAt(x0, 0, z1)]);
    g.faces.push([ptAt(x0, h, z0), ptAt(x1, h, z0), ptAt(x1, h, z1), ptAt(x0, h, z1)]);
  }
  return g;
}

/* правильный n-угольник в плоскости y=const: центр [cx,cz], радиус R */
function _ngon(n, R, cx, cz, y, rot) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = rot + i * 2 * Math.PI / n;
    pts.push([cx + R * Math.cos(a), y, cz + R * Math.sin(a)]);
  }
  return pts;
}

/* прямая призма: правильная (n, side|R) или над произвольным основанием base=[[x,z],…] */
function buildPrism(spec) {
  const g = _blank(spec);
  const h = spec.h;
  const o = _off(spec);
  let base2;
  if (spec.base) base2 = spec.base.map(p2 => [p2[0], 0, p2[1]]);
  else {
    const n = spec.n;
    const R = spec.R !== undefined ? spec.R : spec.side / (2 * Math.sin(Math.PI / n));
    base2 = _ngon(n, R, 0, 0, 0, spec.rot !== undefined ? spec.rot : Math.PI / 2 + Math.PI / n);
  }
  const nm = spec.names || base2.map((_, i) => String.fromCharCode(65 + i));
  const top = nm.map(n2 => n2 + "1");
  base2.forEach((p3, i) => {
    g.pts[nm[i]] = _shift(p3, o);
    g.pts[top[i]] = _shift([p3[0], h, p3[2]], o);
  });
  const n = base2.length;
  g.faces.push(nm.slice(), top.slice());
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    g.faces.push([nm[i], nm[j], top[j], top[i]]);
    g.edges.push([nm[i], nm[j]], [top[i], top[j]], [nm[i], top[i]]);
  }
  return g;
}

/* пирамида: основание (правильное или base=[[x,z],…]) + вершина apex */
function buildPyramid(spec) {
  const g = _blank(spec);
  const o = _off(spec);
  let base2;
  if (spec.base) base2 = spec.base.map(p2 => [p2[0], 0, p2[1]]);
  else {
    const n = spec.n;
    const R = spec.R !== undefined ? spec.R : spec.side / (2 * Math.sin(Math.PI / n));
    base2 = _ngon(n, R, 0, 0, 0, spec.rot !== undefined ? spec.rot : Math.PI / 2 + Math.PI / n);
  }
  const nm = spec.names || base2.map((_, i) => String.fromCharCode(65 + i));
  const S = spec.apex || "S";
  base2.forEach((p3, i) => { g.pts[nm[i]] = _shift(p3, o); });
  let apexAt = spec.apexAt;
  if (!apexAt) {
    const cx = base2.reduce((s2, p3) => s2 + p3[0], 0) / base2.length;
    const cz = base2.reduce((s2, p3) => s2 + p3[2], 0) / base2.length;
    apexAt = [cx, spec.h, cz];
  }
  g.pts[S] = _shift(apexAt, o);
  const n = base2.length;
  g.faces.push(nm.slice());
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    g.faces.push([nm[i], nm[j], S]);
    g.edges.push([nm[i], nm[j]], [nm[i], S]);
  }
  return g;
}

/* цилиндр: r, h, центр низа в at (по умолчанию [0,0,0]).
   centers:["O","O1"] — имена центров, axis:true — ось-отрезок,
   rim:{A:{ang, at:"bot"|"top"}}, gens:[["A","A1"],…] — образующие,
   water:{h} — вода до уровня h */
function buildCyl(spec) {
  const g = _blank(spec);
  g.matKind = "round";
  const { r, h } = spec;
  const o = _off(spec);
  const [cO, cT] = spec.centers || ["O", "O1"];
  g.pts[cO] = _shift([0, 0, 0], o);
  g.pts[cT] = _shift([0, h, 0], o);
  for (const [nm2, rp] of Object.entries(spec.rim || {})) {
    const y = rp.at === "top" ? h : 0;
    g.pts[nm2] = _shift([r * Math.cos(rp.ang), y, r * Math.sin(rp.ang)], o);
  }
  if (spec.axis) g.edges.push([cO, cT]);
  for (const e of (spec.gens || [])) g.edges.push(e);
  for (const e of (spec.edges || [])) g.edges.push(e);
  g.surfaces.push({ type: "cyl", c: _shift([0, h / 2, 0], o), r: r, h: h });
  g.circles.push({ c: _shift([0, 0, 0], o), r: r, plane: "h" }, { c: _shift([0, h, 0], o), r: r, plane: "h" });
  if (spec.water) {
    const hw = spec.water.h;
    g.surfaces.push({ type: "water", c: _shift([0, hw / 2, 0], o), r: r * 0.995, h: hw });
    g.circles.push({ c: _shift([0, hw, 0], o), r: r, plane: "h", col: "water" });
  }
  return g;
}

/* конус: r, h; вершина сверху (flip не задан) или снизу (flip:true — сосуд).
   apex — имя вершины (по умолчанию "S"), center — имя центра основания ("O"),
   rim:{A:{ang}} — точки на окружности основания,
   water:{h, r} — конус воды (для сосуда вершиной вниз),
   sector:{ts, tl} — вырезанный сектор боковой поверхности;
   sector.part:true — нарисована часть конуса (а не только часть боковой
   поверхности): обод основания — дугой над тем же сектором */
function buildCone(spec) {
  const g = _blank(spec);
  g.matKind = "round";
  const { r, h } = spec;
  const o = _off(spec);
  const S = spec.apex || "S", O = spec.center || "O";
  const baseY = spec.flip ? h : 0, apexY = spec.flip ? 0 : h;
  g.pts[O] = _shift([0, baseY, 0], o);
  g.pts[S] = _shift([0, apexY, 0], o);
  for (const [nm2, rp] of Object.entries(spec.rim || {})) {
    g.pts[nm2] = _shift([r * Math.cos(rp.ang), baseY, r * Math.sin(rp.ang)], o);
  }
  if (spec.axis) g.edges.push([O, S]);
  for (const e of (spec.edges || [])) g.edges.push(e);
  const sf = { type: "cone", c: _shift([0, h / 2, 0], o), r: r, h: h };
  if (spec.flip) sf.flip = true;
  if (spec.sector) { sf.ts = spec.sector.ts; sf.tl = spec.sector.tl; }
  g.surfaces.push(sf);
  const rimC = { c: _shift([0, baseY, 0], o), r: r, plane: "h" };
  /* точка обода [r·cos u, ·, r·sin u]; поверхность θ ∈ [ts; ts + tl] лежит над
     u ∈ [π/2 − ts − tl; π/2 − ts] — в той же параметризации дуга окружности */
  if (spec.sector && spec.sector.part) { rimC.ts = Math.PI / 2 - spec.sector.ts - spec.sector.tl; rimC.tl = spec.sector.tl; }
  g.circles.push(rimC);
  if (spec.water) {
    const hw = spec.water.h, rw = spec.water.r;
    g.surfaces.push({ type: "waterCone", c: _shift([0, hw / 2, 0], o), r: rw * 0.99, h: hw });
    g.circles.push({ c: _shift([0, hw, 0], o), r: rw, plane: "h", col: "water" });
  }
  return g;
}

/* шар: R, центр по умолчанию в [0,R,0] (лежит на плоскости).
   center — имя центра ("O"), equator:true — большой круг,
   section:{y, name} — окружность сечения на высоте y от центра */
function buildSphere(spec) {
  const g = _blank(spec);
  g.matKind = "round";
  const R = spec.R;
  const o = spec.at || [0, R, 0];
  const O = spec.center || "O";
  g.pts[O] = o.slice();
  for (const [nm2, rp] of Object.entries(spec.rim || {})) {
    g.pts[nm2] = _shift([R * Math.cos(rp.ang), 0, R * Math.sin(rp.ang)], o);
  }
  for (const e of (spec.edges || [])) g.edges.push(e);
  g.surfaces.push({ type: "sphere", c: o.slice(), r: R });
  if (spec.equator !== false) g.circles.push({ c: o.slice(), r: R, plane: "h" });
  if (spec.section) {
    const dy = spec.section.y;
    const sr = Math.sqrt(Math.max(0, R * R - dy * dy));
    g.circles.push({ c: _shift([0, dy, 0], o), r: sr, plane: "h", col: "amber" });
    if (spec.section.name) g.pts[spec.section.name] = _shift([0, dy, 0], o);
  }
  return g;
}

/* произвольное тело: всё задаётся напрямую */
function buildCustom(spec) {
  const g = _blank(spec);
  Object.assign(g.pts, spec.pts || {});
  g.faces = spec.faces || [];
  g.edges = spec.edges || [];
  g.circles = spec.circles || [];
  g.surfaces = spec.surfaces || [];
  if (spec.matKind) g.matKind = spec.matKind;
  return g;
}

const BUILDERS = {
  box: buildBox, lshape: buildLshape, prism: buildPrism, pyramid: buildPyramid,
  cyl: buildCyl, cone: buildCone, sphere: buildSphere, custom: buildCustom
};

/* ---------- 4. Сборка сцены задачи ---------- */
/* размер сцены в единицах мира Three.js: наибольший габарит тела */
const SCENE_WORLD = 4.15;
function sceneData(p) {
  /* старый банк (числовые id): сцена задана в scene.prims или dims —
     её строит тот же код, что в опубликованной линейке (engine-legacy.js) */
  if (!p.scene || !p.scene.bodies) return sceneDataFromLegacy(p);

  const gen = (p.scene.bodies || []).map(spec => {
    const b = BUILDERS[spec.kind];
    if (!b) throw new Error("неизвестное тело: " + spec.kind);
    return b(spec);
  });

  /* габариты в единицах задачи: точки + поверхности + окружности */
  let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  const eat = (x, y, z) => {
    if (x < mn[0]) mn[0] = x; if (y < mn[1]) mn[1] = y; if (z < mn[2]) mn[2] = z;
    if (x > mx[0]) mx[0] = x; if (y > mx[1]) mx[1] = y; if (z > mx[2]) mx[2] = z;
  };
  for (const g of gen) {
    for (const pt of Object.values(g.pts)) eat(pt[0], pt[1], pt[2]);
    for (const sf of g.surfaces) {
      const hh = (sf.h || 0) / 2, rr = sf.r || 0;
      if (sf.type === "sphere") { eat(sf.c[0] - rr, sf.c[1] - rr, sf.c[2] - rr); eat(sf.c[0] + rr, sf.c[1] + rr, sf.c[2] + rr); }
      else { eat(sf.c[0] - rr, sf.c[1] - hh, sf.c[2] - rr); eat(sf.c[0] + rr, sf.c[1] + hh, sf.c[2] + rr); }
    }
    for (const c of g.circles) { eat(c.c[0] - c.r, c.c[1], c.c[2] - c.r); eat(c.c[0] + c.r, c.c[1], c.c[2] + c.r); }
  }
  if (!isFinite(mn[0])) { mn = [0, 0, 0]; mx = [1, 1, 1]; }
  const dims = [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]];
  const maxDim = Math.max(dims[0], dims[1], dims[2], 1e-6);
  const SIZE = SCENE_WORLD;
  const s = SIZE / maxDim;
  const cx = (mn[0] + mx[0]) / 2, cy = (mn[1] + mx[1]) / 2, cz = (mn[2] + mx[2]) / 2;
  const toW = u => new THREE.Vector3((u[0] - cx) * s, (u[1] - cy) * s, (u[2] - cz) * s);
  const groundY = (mn[1] - cy) * s;

  let firstBox = null;
  for (const spec of (p.scene.bodies || []))
    if (spec.kind === "box") {
      firstBox = { a: spec.a, b: spec.h, c: spec.b };
      break;
    }

  return { gen, s, toW, groundY, firstBox };
}

/* Сцена задачи старого формата. Тела, точки (в единицах задачи, z-вверх), рёбра,
   грани, окружности, поверхности и firstBox — ровно из sceneDataLegacy.
   Добавляется matKind для палитры движка (тела вращения — терракота,
   многогранники — голубой, как у строителей выше) и выравнивается размер
   в мире: старый код вписывает сцену в 5.6 единицы мира, новый — в SCENE_WORLD.
   При стартовой камере тренажёра у 53 из 143 старых задач часть вершин
   уходила за край кадра (так и в опубликованной линейке). Мир равномерно
   уменьшается в SCENE_WORLD / 5.6 раза: форма чертежа и все длины в единицах
   задачи прежние, меняется только то, насколько крупно он стоит в кадре.

   Дополнения к старому формату (правка линейки курса 24.09.2026,
   опубликованная линейка их не знает):
     • scene.segs: [[P, Q], …] — отрезки данных условия, видимые сразу
       (диагональ, названная в условии). В старом формате свободных отрезков
       нет; отрезок становится ребром первого тела, у которого есть обе точки,
       и рисуется в его стиле (скрытый — пунктиром).
     • scene.pts: {имя: [x, y, z]} — вспомогательная точка (координаты
       старого формата) первому телу — чтобы подписать отрезок данных условия
       (отрезки высоты конуса до сечения). Имя с «_» — без буквы и кружка.
     • часть конуса (prims: cone с keep): обод основания рисуется дугой над
       нарисованным сектором (тот же угол, что у закрашенного основания),
       точки целого конуса P, Q, оказавшиеся вне нарисованной части, и их
       рёбра не рисуются — иначе они висят в вырезе. */
const LEGACY_ROUND = { cyl: true, cone: true, sphere: true };
const LEGACY_WORLD = 5.6;   /* s = 5.6/ext в sceneDataLegacy (engine-legacy.js) */
function sceneDataFromLegacy(p) {
  const sd = sceneDataLegacy(p);
  const prims = (p.scene && p.scene.prims) || [{ kind: "box" }];
  sd.gen.forEach((g, i) => {
    g.matKind = LEGACY_ROUND[prims[i].kind] ? "round" : null;
    /* у тел вращения старого формата внутри всегда есть отрезки (ось, радиус,
       высота), у сосудов — вода, у конусов — сечения: стенку рисовать
       полупрозрачной (trainer.js, seeThrough), как в опубликованной линейке */
    if (g.matKind === "round") g.seeThrough = true;
  });
  for (const [nm, pt] of Object.entries((p.scene && p.scene.pts) || {})) sd.gen[0].pts[nm] = pt.slice();
  for (const [a, b] of ((p.scene && p.scene.segs) || [])) {
    const g = sd.gen.find(x => a in x.pts && b in x.pts);
    if (!g) throw new Error("scene.segs: нет тела с точками " + a + " и " + b);
    g.edges.push([a, b]);
  }
  prims.forEach((pr, i) => {
    if (pr.kind !== "cone" || !pr.keep || pr.flip) return;
    const g = sd.gen[i], px = pr.px || "";
    const cone = g.surfaces.find(s => s.type === "cone" && s.tl != null);
    const disc = g.surfaces.find(s => s.type === "disc" && s.tl != null);
    const rim = g.circles.find(c => !c.col);
    if (!cone || !disc || !rim) return;
    rim.ts = disc.ts; rim.tl = disc.tl;
    const O = g.pts["O" + px];
    for (const nm of ["P" + px, "Q" + px]) {
      const q = g.pts[nm];
      if (!q) continue;
      /* точка обода [r·sin φ, −r·cos φ] от центра; нарисовано φ ∈ [ts; ts + tl] */
      const phi = Math.atan2(q[0] - O[0], -(q[1] - O[1]));
      const rel = ((phi - cone.ts) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      if (rel <= cone.tl + 1e-9) continue;
      delete g.pts[nm];
      g.edges = g.edges.filter(e => e[0] !== nm && e[1] !== nm);
    }
  });
  const k = SCENE_WORLD / LEGACY_WORLD, toW0 = sd.toW;
  sd.toW = u => { const w = toW0(u); return new THREE.Vector3(w.x * k, w.y * k, w.z * k); };
  sd.s *= k;
  sd.groundY *= k;
  return sd;
}

/* ---------- 5. Темы и задачи ---------- */
const TOPICS = ["Куб", "Параллелепипед", "Составные тела", "Призма",
  "Пирамида", "Цилиндр", "Конус", "Шар", "Комбинации тел",
  "Развёртки"];   /* приложение: сверх типов задания 3 */

/* экспорт для node-верификаторов (в браузере блок не выполняется) */
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    get PROBLEMS() { return PROBLEMS; }, TOPICS, COL, PAL, SUB, segKey, fmtLen, parseAns, sceneData,
    /* sceneDataLegacy объявлена в engine-legacy.js, который идёт следом */
    get sceneDataLegacy() { return typeof sceneDataLegacy === "function" ? sceneDataLegacy : undefined; }
  };
}

/* ============================================================
   engine-legacy.js — генераторы сцен СТАРОГО банка (143 задачи
   открытого банка задания 3, числовые id = номера Решу ЕГЭ).

   Код перенесён без изменений из опубликованной линейки
   trainers/ege-profile-stereometry-3d/js/data.js (коммит 4dc0592).
   Изменено только:
     • убраны палитра, утилиты и makeSprite (PAL, COL, SUB, segKey,
       fmtLen, parseAns, makeSprite) — легаси-код работает на их
       определениях из engine.js, который стоит в data.js выше;
     • sceneData переименована в sceneDataLegacy — её вызывает
       sceneData из engine.js для задач без scene.bodies.

   Система координат старого формата: x — вправо, y — в глубину,
   z — вверх; toW переводит в мир Three.js (y — вверх). Равенство
   чертежей старых задач опубликованным проверяет legacy-parity.js.
   ============================================================ */

const SQ2 = Math.sqrt(2), SQ3 = Math.sqrt(3), SQ5 = Math.sqrt(5);

/* ---------- базовый параллелепипед ---------- */
const BOX_PTS = {
  A: [0, 0, 0], B: [1, 0, 0], C: [1, 1, 0], D: [0, 1, 0],
  A1: [0, 0, 1], B1: [1, 0, 1], C1: [1, 1, 1], D1: [0, 1, 1],
};
const BOX_EDGES = [
  ["A","B"],["B","C"],["C","D"],["D","A"],
  ["A1","B1"],["B1","C1"],["C1","D1"],["D1","A1"],
  ["A","A1"],["B","B1"],["C","C1"],["D","D1"],
];
const BOX_FACES = [
  ["A","B","C","D"],["A1","B1","C1","D1"],
  ["A","B","B1","A1"],["B","C","C1","B1"],
  ["C","D","D1","C1"],["D","A","A1","D1"],
];
/* внутренний «половинный» параллелепипед (задача 661073) */
const HALF_PTS = {}; const HALF_FACES = [];
{
  const n = (u,v,w)=>`H${u}${v}${w}`;
  for (const u of [0,1]) for (const v of [0,1]) for (const w of [0,1])
    HALF_PTS[n(u,v,w)] = [u*0.5, v*0.5, w*0.5];
  HALF_FACES.push(
    [n(0,0,0),n(1,0,0),n(1,1,0),n(0,1,0)], [n(0,0,1),n(1,0,1),n(1,1,1),n(0,1,1)],
    [n(0,0,0),n(1,0,0),n(1,0,1),n(0,0,1)], [n(1,0,0),n(1,1,0),n(1,1,1),n(1,0,1)],
    [n(1,1,0),n(0,1,0),n(0,1,1),n(1,1,1)], [n(0,1,0),n(0,0,0),n(0,0,1),n(0,1,1)],
  );
}

/* ============================================================
   ГЕНЕРАТОРЫ ПРИМИТИВОВ
   Единицы: x — вправо, y — в глубину, z — вверх.
   Каждый примитив возвращает: pts {имя:[x,y,z]}, edges [[p,q]],
   faces [[имена]], circles [{c,r,plane}], surfaces [{type,...}],
   coordLabels [{p:[xyz], q:[xyz], t}]
   ============================================================ */
const LTRS = ["A","B","C","D","E","F"];
function regBase(n, a) {
  const R = a / (2*Math.sin(Math.PI/n));
  const pts = [];
  for (let i=0;i<n;i++) {
    const ang = Math.PI/2 + Math.PI/n + (i*2*Math.PI)/n;
    pts.push([R*Math.cos(ang), R*Math.sin(ang)]);
  }
  return pts;
}
function ringFaces(names, top) {
  const f = [[...names],[...top]];
  for (let i=0;i<names.length;i++)
    f.push([names[i], names[(i+1)%names.length], top[(i+1)%names.length], top[i]]);
  return f;
}
function ringEdges(names, top) {
  const e = [];
  for (let i=0;i<names.length;i++) {
    e.push([names[i], names[(i+1)%names.length]]);
    e.push([top[i], top[(i+1)%top.length]]);
    e.push([names[i], top[i]]);
  }
  return e;
}

function genPrim(pr) {
  const px = pr.px || "";
  const N = s => s + px;
  const out = { pts:{}, edges:[], faces:[], circles:[], surfaces:[], coordLabels:[] };
  const k = pr.kind;

  if (k === "box") {
    const {a,b,c} = pr;
    for (const [nm,[u,v,w]] of Object.entries(BOX_PTS)) out.pts[N(nm)] = [u*a, v*b, w*c];
    out.edges = BOX_EDGES.map(([p,q])=>[N(p),N(q)]);
    out.faces = BOX_FACES.map(f=>f.map(N));
  }
  else if (k === "boxes") {
    // составное тело из осевых коробок; точки безымянные
    let idx = 0;
    for (const it of pr.items) {
      const [ox,oy,oz] = it.o, [dx,dy,dz] = it.d;
      const c = [];
      for (const w of [0,1]) for (const v of [0,1]) for (const u of [0,1])
        c.push([ox+u*dx, oy+v*dy, oz+w*dz]);
      const nm = c.map(()=>`_p${idx++}`);
      c.forEach((p,i)=>out.pts[nm[i]] = p);
      const E = [[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[2,6],[3,7]];
      for (const [i,j] of E) out.edges.push([nm[i],nm[j]]);
      const F = [[0,1,3,2],[4,5,7,6],[0,1,5,4],[2,3,7,6],[0,2,6,4],[1,3,7,5]];
      for (const f of F) out.faces.push(f.map(i=>nm[i]));
    }
    out.coordLabels = pr.labels || [];
    out.anonymous = true;
  }
  else if (k === "prism" || k === "pyramid") {
    const base = regBase(pr.n, pr.a);
    const names = LTRS.slice(0, pr.n);
    base.forEach(([x,y],i)=>{ out.pts[N(names[i])] = [x,y,0]; });
    let cx=0, cy=0; base.forEach(([x,y])=>{cx+=x;cy+=y;}); cx/=pr.n; cy/=pr.n;
    out.pts[N("O")] = [cx,cy,0];
    if (k === "prism") {
      const top = names.map(nm=>nm+"1");
      base.forEach(([x,y],i)=>{ out.pts[N(top[i])] = [x,y,pr.h]; });
      out.pts[N("O1")] = [cx,cy,pr.h];
      out.edges = ringEdges(names.map(N), top.map(N));
      out.faces = ringFaces(names.map(N), top.map(N));
    } else {
      out.pts[N("S")] = [cx,cy,pr.h];
      for (let i=0;i<pr.n;i++) {
        out.edges.push([N(names[i]), N(names[(i+1)%pr.n])]);
        out.edges.push([N(names[i]), N("S")]);
      }
      out.faces = [names.map(N)];
      for (let i=0;i<pr.n;i++) out.faces.push([N("S"),N(names[i]),N(names[(i+1)%pr.n])]);
    }
  }
  else if (k === "prism_rt") { // прямоугольный треугольник в основании
    const {l1,l2,h} = pr;
    const b = { A:[0,0,0], B:[l1,0,0], C:[0,l2,0] };
    for (const [nm,p] of Object.entries(b)) { out.pts[N(nm)]=p; out.pts[N(nm+"1")]=[p[0],p[1],h]; }
    out.edges = ringEdges(["A","B","C"].map(N), ["A1","B1","C1"].map(N));
    out.faces = ringFaces(["A","B","C"].map(N), ["A1","B1","C1"].map(N));
  }
  else if (k === "prism_rh") { // ромб с диагоналями d1 (гориз.), d2
    const {d1,d2,h} = pr;
    const b = { A:[-d1/2,0,0], B:[0,-d2/2,0], C:[d1/2,0,0], D:[0,d2/2,0] };
    for (const [nm,p] of Object.entries(b)) { out.pts[N(nm)]=p; out.pts[N(nm+"1")]=[p[0],p[1],h]; }
    out.edges = ringEdges(["A","B","C","D"].map(N), ["A1","B1","C1","D1"].map(N));
    out.faces = ringFaces(["A","B","C","D"].map(N), ["A1","B1","C1","D1"].map(N));
  }
  else if (k === "pyramid_rect") {
    const {a,b,h} = pr;
    const bs = { A:[0,0,0], B:[a,0,0], C:[a,b,0], D:[0,b,0] };
    for (const [nm,p] of Object.entries(bs)) out.pts[N(nm)] = p;
    out.pts[N("O")] = [a/2,b/2,0];
    out.pts[N("S")] = [a/2,b/2,h];
    ["A","B","C","D"].forEach((nm,i,arr)=>{
      out.edges.push([N(nm), N(arr[(i+1)%4])]); out.edges.push([N(nm), N("S")]);
    });
    out.faces = [["A","B","C","D"].map(N)];
    ["A","B","C","D"].forEach((nm,i,arr)=>out.faces.push([N("S"),N(nm),N(arr[(i+1)%4])]));
  }
  else if (k === "tetra") {
    const a = pr.a;
    const b = { A:[0,0,0], B:[a,0,0], C:[a/2, a*SQ3/2, 0] };
    for (const [nm,p] of Object.entries(b)) out.pts[N(nm)] = p;
    out.pts[N("D")] = [a/2, a*SQ3/6, a*Math.sqrt(2/3)];
    const v = ["A","B","C","D"];
    for (let i=0;i<4;i++) for (let j=i+1;j<4;j++) out.edges.push([N(v[i]),N(v[j])]);
    out.faces = [["A","B","C"],["A","B","D"],["B","C","D"],["A","C","D"]].map(f=>f.map(N));
  }
  else if (k === "cyl") {
    const {r,h} = pr;
    out.pts[N("O")] = [0,0,0]; out.pts[N("O1")] = [0,0,h];
    out.pts[N("P")] = [r,0,0]; out.pts[N("P1")] = [r,0,h];
    out.pts[N("Q")] = [-r,0,0]; out.pts[N("Q1")] = [-r,0,h];
    out.edges = [[N("O"),N("O1")],[N("O"),N("P")],[N("P"),N("P1")]];
    out.circles = [{c:[0,0,0], r, plane:"h"},{c:[0,0,h], r, plane:"h"}];
    out.surfaces = [{type:"cyl", c:[0,0,h/2], r, h}];
    if (pr.fill) out.surfaces.push({type:"water", c:[0,0,h*pr.fill/2], r:r*0.985, h:h*pr.fill});
  }
  else if (k === "cone") {
    const {r,h} = pr;
    if (pr.flip) {
      // сосуд-конус вершиной вниз (уровень жидкости fill = доля высоты от вершины)
      out.pts[N("S")] = [0,0,0]; out.pts[N("O")] = [0,0,h]; out.pts[N("P")] = [r,0,h];
      out.edges = [[N("S"),N("O")],[N("O"),N("P")],[N("S"),N("P")]];
      out.circles = [{c:[0,0,h], r, plane:"h"}];
      out.surfaces = [{type:"cone", c:[0,0,h/2], r, h, flip:true}];
      if (pr.fill) {
        const kf = pr.fill;
        out.surfaces.push({type:"waterCone", c:[0,0,h*kf/2], r:r*kf*0.98, h:h*kf});
        out.circles.push({c:[0,0,h*kf], r:r*kf, plane:"h", col:"water"});
      }
    } else {
      out.pts[N("O")] = [0,0,0]; out.pts[N("S")] = [0,0,h];
      out.pts[N("P")] = [r,0,0]; out.pts[N("Q")] = [-r,0,0];
      out.edges = [[N("O"),N("S")],[N("O"),N("P")],[N("S"),N("P")]];
      out.circles = [{c:[0,0,0], r, plane:"h"}];
      if (pr.keep) {
        // часть конуса: keep — оставленный угол в градусах
        const keep = pr.keep*Math.PI/180;
        const ts = keep < Math.PI ? -keep/2 : (2*Math.PI-keep)/2;
        out.pts[N("A")] = [r*Math.sin(ts), -r*Math.cos(ts), 0];
        out.pts[N("B")] = [r*Math.sin(ts+keep), -r*Math.cos(ts+keep), 0];
        out.edges.push([N("O"),N("A")],[N("O"),N("B")],[N("S"),N("A")],[N("S"),N("B")]);
        out.faces.push([N("S"),N("O"),N("A")],[N("S"),N("O"),N("B")]);
        out.surfaces = [
          {type:"cone", c:[0,0,h/2], r, h, ts, tl:keep},
          {type:"disc", c:[0,0,0.02], r, ts:Math.PI/2 - ts - keep, tl:keep},
        ];
        out.coordLabels = [{p:[0,-r*0.55,0.02], q:[0,-r*0.55,0.02],
          t:(pr.keep < 180 ? pr.keep : 360 - pr.keep) + "°"}];
      } else {
        out.surfaces = [{type:"cone", c:[0,0,h/2], r, h}];
      }
      if (pr.sect) {
        // параллельное сечение на доле sect высоты от вершины
        const kс = pr.sect, rs = r*kс, zs = h*(1-kс);
        out.circles.push({c:[0,0,zs], r:rs, plane:"h", col:"amber"});
        out.surfaces.push({type:"disc", c:[0,0,zs], r:rs});
      }
    }
  }
  else if (k === "sphere") {
    const {r} = pr;
    const zc = pr.zc != null ? pr.zc : r;
    out.pts[N("O")] = [0,0,zc]; out.pts[N("P")] = [r,0,zc];
    out.edges = [[N("O"),N("P")]];
    out.circles = [{c:[0,0,zc], r, plane:"h"},{c:[0,0,zc], r, plane:"v"}];
    out.surfaces = [{type:"sphere", c:[0,0,zc], r}];
    if (pr.disc) out.surfaces.push({type:"disc", c:[0,0,zc], r});
  }
  // смещение
  const at = pr.at || [0,0,0];
  if (at[0] || at[1] || at[2]) {
    for (const nm of Object.keys(out.pts)) {
      const p = out.pts[nm];
      out.pts[nm] = [p[0]+at[0], p[1]+(at[1]||0), p[2]+(at[2]||0)];
    }
    for (const c of out.circles) c.c = [c.c[0]+at[0], c.c[1]+(at[1]||0), c.c[2]+(at[2]||0)];
    for (const s of out.surfaces) s.c = [s.c[0]+at[0], s.c[1]+(at[1]||0), s.c[2]+(at[2]||0)];
    out.coordLabels = (out.coordLabels||[]).map(l=>({...l,
      p:[l.p[0]+at[0], l.p[1]+(at[1]||0), l.p[2]+(at[2]||0)],
      q:[l.q[0]+at[0], l.q[1]+(at[1]||0), l.q[2]+(at[2]||0)]}));
  }
  out.ghost = !!pr.ghost;
  out.hideLabels = !!pr.hideLabels;
  return out;
}

/* собрать все примитивы задачи (в опубликованной линейке — sceneData;
   переименовано, чтобы не конфликтовать с sceneData нового engine.js,
   которая сама передаёт сюда задачи старого формата) */
function sceneDataLegacy(p) {
  const prims = p.scene?.prims || [{ kind:"box", a:p.dims[0], b:p.dims[1], c:p.dims[2] }];
  const gen = prims.map(genPrim);
  // общий bbox
  let mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9];
  const acc = pt => { for (let i=0;i<3;i++){ mn[i]=Math.min(mn[i],pt[i]); mx[i]=Math.max(mx[i],pt[i]); } };
  for (const g of gen) {
    for (const pt of Object.values(g.pts)) acc(pt);
    for (const c of g.circles) { acc([c.c[0]-c.r,c.c[1]-c.r,c.c[2]]); acc([c.c[0]+c.r,c.c[1]+c.r,c.c[2]]); }
    for (const s of g.surfaces) if (s.type==="sphere") { acc([s.c[0]-s.r,s.c[1]-s.r,s.c[2]-s.r]); acc([s.c[0]+s.r,s.c[1]+s.r,s.c[2]+s.r]); }
  }
  const ext = Math.max(mx[0]-mn[0], mx[1]-mn[1], mx[2]-mn[2], 0.001);
  const s = 5.6/ext;
  const c = [(mn[0]+mx[0])/2,(mn[1]+mx[1])/2,(mn[2]+mx[2])/2];
  const toW = pt => new THREE.Vector3((pt[0]-c[0])*s, (pt[2]-c[2])*s, -(pt[1]-c[1])*s);
  return { gen, s, toW, groundY:(mn[2]-c[2])*s, firstBox: prims.find(x=>x.kind==="box") };
}

/* Старый банк, тема «Куб»: 14 задач открытого банка задания 3
   (Решу ЕГЭ; id — номер задачи на math-ege.sdamgia.ru/problem?id=…).
   Перенесены ДОСЛОВНО из опубликованной линейки
   trainers/ege-profile-stereometry-3d/js/data.js (коммит 4dc0592):
   поля, числа, тексты и порядок не менялись — под этими id у учеников
   записан прогресс (stereo3.status), а позиция задачи в теме —
   в stereo3.last.<тема>. Сцены строит engine-legacy.js (scene.prims / dims),
   общие константы (SQ2, SQ3, SQ5, HALF_PTS, HALF_FACES) — тоже там.
   Не переименовывать и не переставлять.
   Исключения (решение владельца 24.09.2026, только линейка курса):
     у 27061, 27081, 27102, 27130, 27168, 639619 исправлен чертёж (scene / labels / construct).
   id, условия, ответы, подсказки, решения и порядок — прежние;
   список и причины — legacy-parity.js. */
const P_LEGACY_KUB = [
  /* ================= КУБ ================= */
  { id:"27055", topic:"Куб", ans:"3",
    cond:"Площадь поверхности куба равна 18. Найдите его диагональ.",
    scene:{ prims:[{kind:"box",a:SQ3,b:SQ3,c:SQ3}] },
    construct:{ segments:[["B","D1","?"],["B","D"]] },
    hint:"S = 6a² ⇒ a² = 3. Диагональ куба d = a√3.",
    sol:["6a² = 18 ⇒ a² = 3.","d = a√3 = √(3·3) = √9 = 3."] },
  { id:"27056", topic:"Куб", ans:"24",
    cond:"Объём куба равен 8. Найдите площадь его поверхности.",
    scene:{ prims:[{kind:"box",a:2,b:2,c:2}] },
    hint:"Из V = a³ найдите ребро, затем S = 6a².",
    sol:["a = ∛8 = 2.","S = 6·2² = 24."] },
  { id:"27061", topic:"Куб", ans:"4",
    cond:"Если каждое ребро куба увеличить на 1, то его площадь поверхности увеличится на 54. Найдите ребро куба.",
    scene:{ prims:[{kind:"box",a:4,b:4,c:4},{kind:"box",a:5,b:5,c:5,px:"2",ghost:true,hideLabels:true,at:[6,0,0]}] },
    hint:"6(a+1)² − 6a² = 54.",
    sol:["6(a+1)² − 6a² = 54 ⇒ 12a + 6 = 54 ⇒ a = 4."] },
  { id:"27081", topic:"Куб", ans:"27",
    cond:"Во сколько раз увеличится объём куба, если его рёбра увеличить в три раза?",
    scene:{ prims:[{kind:"box",a:1,b:1,c:1},{kind:"box",a:3,b:3,c:3,px:"2",ghost:true,hideLabels:true,at:[2,0,0]}] },
    hint:"При увеличении всех рёбер в k раз объём растёт в k³ раз.",
    sol:["V = a³ ⇒ при увеличении ребра в 3 раза объём увеличится в 3³ = 27 раз."] },
  { id:"27098", topic:"Куб", ans:"8",
    cond:"Диагональ куба равна √12. Найдите его объём.",
    scene:{ prims:[{kind:"box",a:2,b:2,c:2}] },
    construct:{ segments:[["B","D1","√12"],["B","D"]] },
    hint:"d = a√3 ⇒ a = d/√3.",
    sol:["a = √12/√3 = √4 = 2.","V = 2³ = 8."] },
  { id:"27099", topic:"Куб", ans:"6",
    cond:"Объём куба равен 24√3. Найдите его диагональ.",
    scene:{ prims:[{kind:"box",a:2*SQ3,b:2*SQ3,c:2*SQ3}] },
    construct:{ segments:[["B","D1","?"],["B","D"]] },
    hint:"a³ = 24√3 = (2√3)³. Затем d = a√3.",
    sol:["a³ = 24√3 = 8·3√3 = (2√3)³ ⇒ a = 2√3.","d = a√3 = 2√3·√3 = 6."] },
  { id:"27102", topic:"Куб", ans:"2",
    cond:"Если каждое ребро куба увеличить на 1, то его объём увеличится на 19. Найдите ребро куба.",
    scene:{ prims:[{kind:"box",a:2,b:2,c:2},{kind:"box",a:3,b:3,c:3,px:"2",ghost:true,hideLabels:true,at:[3.4,0,0]}] },
    hint:"(a+1)³ − a³ = 19.",
    sol:["(a+1)³ − a³ = 19 ⇒ 3a² + 3a + 1 = 19 ⇒ a² + a − 6 = 0 ⇒ a = 2."] },
  { id:"27130", topic:"Куб", ans:"9",
    cond:"Во сколько раз увеличится площадь поверхности куба, если его ребро увеличить в три раза?",
    scene:{ prims:[{kind:"box",a:1,b:1,c:1},{kind:"box",a:3,b:3,c:3,px:"2",ghost:true,hideLabels:true,at:[2,0,0]}] },
    hint:"Площадь растёт как квадрат линейных размеров.",
    sol:["S = 6a² ⇒ при увеличении ребра в 3 раза площадь увеличится в 3² = 9 раз."] },
  { id:"27139", topic:"Куб", ans:"2",
    cond:"Диагональ куба равна 1. Найдите площадь его поверхности.",
    scene:{ prims:[{kind:"box",a:1/SQ3,b:1/SQ3,c:1/SQ3}] },
    construct:{ segments:[["B","D1","1"],["B","D"]] },
    hint:"d² = 3a² ⇒ a² = 1/3.",
    sol:["3a² = 1 ⇒ a² = 1/3.","S = 6a² = 6/3 = 2."] },
  { id:"27141", topic:"Куб", ans:"8",
    cond:"Площадь поверхности куба равна 24. Найдите его объём.",
    scene:{ prims:[{kind:"box",a:2,b:2,c:2}] },
    hint:"6a² = 24.",
    sol:["6a² = 24 ⇒ a = 2.","V = 2³ = 8."] },
  { id:"27168", topic:"Куб", ans:"4",
    cond:"Объём первого куба в 8 раз больше объёма второго куба. Во сколько раз площадь поверхности первого куба больше площади поверхности второго куба?",
    scene:{ prims:[{kind:"box",a:2,b:2,c:2},{kind:"box",a:1,b:1,c:1,px:"2",ghost:true,hideLabels:true,at:[3.2,0,0]}] },
    hint:"Отношение объёмов 8 = k³ даёт отношение рёбер k.",
    sol:["k³ = 8 ⇒ рёбра относятся как k = 2.","Площади относятся как k² = 4."] },
  { id:"501533", topic:"Куб", ans:"27",
    cond:"Ребро куба равно 6. Найдите объём треугольной призмы, отсекаемой от него плоскостью, проходящей через середины двух рёбер, выходящих из одной вершины и параллельной третьему ребру, выходящему из этой же вершины.",
    scene:{ prims:[{kind:"box",a:6,b:6,c:6}] }, labels:[["A","B","6"]],
    construct:{ points:{M:["mid","A","B"],N:["mid","A","D"],M1:["mid","A1","B1"],N1:["mid","A1","D1"]},
      solid:[["A","M","N"],["A1","M1","N1"],["M","N","N1","M1"],["A","M","M1","A1"],["A","N","N1","A1"]] },
    hint:"Основание отсекаемой призмы — прямоугольный треугольник с катетами 3 и 3, высота 6.",
    sol:["Катеты основания: 6/2 = 3 и 3; высота призмы 6.","V = ½·3·3·6 = 27."] },
  { id:"639619", topic:"Куб", ans:"9",
    cond:"Найдите объём пирамиды, вписанной в куб, если ребро куба равно 3.",
    scene:{ prims:[{kind:"box",a:3,b:3,c:3},{kind:"pyramid_rect",a:3,b:3,h:3}] }, labels:[["A","B","3"]],
    construct:{ segments:[["S","O"]],
      solid:[["A","B","C","D"],["S","A","B"],["S","B","C"],["S","C","D"],["S","D","A"]] },
    hint:"Основание пирамиды — грань куба, вершина — центр противоположной грани.",
    sol:["Основание — грань куба (S = 9), высота — ребро куба (h = 3).","V = ⅓·9·3 = 9."] },
  { id:"670262", topic:"Куб", ans:"8",
    cond:"Площадь поверхности куба равна 128. Найдите длину его диагонали.",
    scene:{ prims:[{kind:"box",a:Math.sqrt(128/6),b:Math.sqrt(128/6),c:Math.sqrt(128/6)}] },
    construct:{ segments:[["B","D1","?"],["B","D"]] },
    hint:"a² = 128/6, а d² = 3a².",
    sol:["a² = 128/6 = 64/3.","d = √(3a²) = √64 = 8."] },
];

const P_KUB = [
  {
    id: "kub-01", topic: "Куб", group: "диагонали",
    cond: "Ребро куба ABCDA1B1C1D1 равно 5. Найдите квадрат диагонали AC1.",
    ans: "75",
    scene: { bodies: [{ kind: "box", a: 5, b: 5, h: 5 }] },
    labels: [["A", "B", "5"], ["A", "C1", "?"]],
    construct: {
      segments: [["A", "C"], ["A", "C1", "?"]],
      fills: [["A", "C", "C1"]]
    },
    hint: "Рассмотрите прямоугольный треугольник ACC₁: его катеты — диагональ основания AC и вертикальное ребро CC₁.",
    sol: [
      "Диагональ основания: AC² = AB² + BC² = 25 + 25 = 50.",
      "Треугольник ACC₁ прямоугольный: AC₁² = AC² + CC₁² = 50 + 25 = 75."
    ]
  },
  {
    id: "kub-02", topic: "Куб", group: "диагонали",
    cond: "Ребро куба ABCDA1B1C1D1 равно 3. Найдите квадрат расстояния между вершинами B и D1.",
    ans: "27",
    scene: { bodies: [{ kind: "box", a: 3, b: 3, h: 3 }] },
    labels: [["B", "C", "3"], ["B", "D1", "?"]],
    construct: {
      segments: [["B", "D"], ["B", "D1", "?"]],
      fills: [["B", "D", "D1"]]
    },
    hint: "BD₁ — диагональ куба: гипотенуза прямоугольного треугольника BDD₁, где BD — диагональ основания.",
    sol: [
      "Диагональ основания: BD² = 9 + 9 = 18.",
      "Треугольник BDD₁ прямоугольный: BD₁² = BD² + DD₁² = 18 + 9 = 27."
    ]
  },
  {
    id: "kub-03", topic: "Куб", group: "диагонали",
    cond: "Ребро куба ABCDA1B1C1D1 равно 6. Найдите квадрат диагонали грани куба.",
    ans: "72",
    scene: { bodies: [{ kind: "box", a: 6, b: 6, h: 6 }] },
    labels: [["A", "B", "6"], ["A", "B1", "?"]],
    construct: {
      segments: [["A", "B1", "?"]],
      fills: [["A", "B", "B1"]]
    },
    hint: "Диагональ грани — гипотенуза прямоугольного треугольника, катеты которого — два ребра куба.",
    sol: [
      "В треугольнике ABB₁ катеты AB и BB₁ равны 6.",
      "AB₁² = 6² + 6² = 36 + 36 = 72."
    ]
  },
  {
    id: "kub-04", topic: "Куб", group: "объём",
    cond: "Квадрат диагонали куба равен 300. Найдите объём куба.",
    ans: "1000",
    scene: { bodies: [{ kind: "box", a: 10, b: 10, h: 10 }] },
    labels: [],
    construct: {
      segments: [["B", "D"], ["B", "D1", "d"]],
      fills: [["B", "D", "D1"]]
    },
    hint: "Квадрат диагонали куба втрое больше квадрата его ребра: d² = 3a². Сначала найдите ребро.",
    sol: [
      "d² = 3a², значит a² = 300 : 3 = 100, откуда a = 10.",
      "V = a³ = 10³ = 1000."
    ]
  },
  {
    id: "kub-05", topic: "Куб", group: "объём",
    cond: "Квадрат диагонали грани куба равен 32. Найдите объём куба.",
    ans: "64",
    scene: { bodies: [{ kind: "box", a: 4, b: 4, h: 4 }] },
    labels: [],
    construct: {
      segments: [["A", "B1", "d"]],
      fills: [["A", "B", "B1"]]
    },
    hint: "Диагональ грани куба и его ребро связаны равенством d² = 2a².",
    sol: [
      "d² = 2a², значит a² = 32 : 2 = 16, откуда a = 4.",
      "V = a³ = 4³ = 64."
    ]
  },
  {
    id: "kub-06", topic: "Куб", group: "объём",
    cond: "Найдите объём куба, если площадь его поверхности равна 216.",
    ans: "216",
    scene: { bodies: [{ kind: "box", a: 6, b: 6, h: 6 }] },
    labels: [],
    hint: "Поверхность куба состоит из шести равных квадратов. Найдите ребро из площади одного квадрата.",
    sol: [
      "Площадь одной грани: 216 : 6 = 36, значит ребро a = 6.",
      "V = a³ = 6³ = 216."
    ]
  },
  {
    id: "kub-07", topic: "Куб", group: "поверхность",
    cond: "Ребро куба равно 7. Найдите площадь поверхности куба.",
    ans: "294",
    scene: { bodies: [{ kind: "box", a: 7, b: 7, h: 7 }] },
    labels: [["A", "B", "7"]],
    hint: "Поверхность куба — шесть квадратов со стороной, равной ребру.",
    sol: [
      "S = 6a² = 6 · 7² = 6 · 49 = 294."
    ]
  },
  {
    id: "kub-08", topic: "Куб", group: "поверхность",
    cond: "Ребро куба равно 1,5. Найдите площадь поверхности куба.",
    ans: "13,5",
    scene: { bodies: [{ kind: "box", a: 1.5, b: 1.5, h: 1.5 }] },
    labels: [["A", "B", "1,5"]],
    hint: "Площадь поверхности куба равна 6a². Аккуратно возведите 1,5 в квадрат.",
    sol: [
      "1,5² = 2,25.",
      "S = 6 · 2,25 = 13,5."
    ]
  },
  {
    id: "kub-09", topic: "Куб", group: "поверхность",
    cond: "Найдите площадь полной поверхности куба, объём которого равен 125.",
    ans: "150",
    scene: { bodies: [{ kind: "box", a: 5, b: 5, h: 5 }] },
    labels: [],
    hint: "Сначала найдите ребро куба: его куб равен объёму. Затем сосчитайте шесть квадратных граней.",
    sol: [
      "a³ = 125, значит a = 5.",
      "S = 6 · 5² = 150."
    ]
  },
  {
    id: "kub-10", topic: "Куб", group: "рёбра",
    cond: "Ребро куба равно 2,5. Найдите сумму длин всех рёбер куба.",
    ans: "30",
    scene: { bodies: [{ kind: "box", a: 2.5, b: 2.5, h: 2.5 }] },
    labels: [["A", "B", "2,5"]],
    hint: "Сосчитайте, сколько всего рёбер у куба: по четыре в каждом из трёх направлений.",
    sol: [
      "У куба 12 рёбер.",
      "Сумма длин: 12 · 2,5 = 30."
    ]
  },
  /* kub-11 убрана 24.09.2026: дубль задачи 27081 старого банка (problems-legacy-kub.js) — та же модель, те же числа. */
  {
    id: "kub-12", topic: "Куб", group: "изменение размеров",
    cond: "Ребро куба равно 4. На сколько увеличится площадь поверхности куба, если его ребро увеличить на 1?",
    ans: "54",
    scene: {
      bodies: [
        { kind: "box", a: 4, b: 4, h: 4 },
        { kind: "box", a: 5, b: 5, h: 5, ghost: true, hideLabels: true, names: ["P", "Q", "R", "T"] }
      ]
    },
    labels: [["A", "B", "4"]],
    hint: "Найдите площадь поверхности старого куба и куба с ребром на 1 больше, затем вычтите.",
    sol: [
      "Старая площадь: 6 · 4² = 96; новая: 6 · 5² = 150.",
      "Прирост: 150 − 96 = 54."
    ]
  },
  {
    id: "kub-13", topic: "Куб", group: "изменение размеров",
    cond: "Ребро куба уменьшили в 2 раза. Во сколько раз уменьшился объём куба?",
    ans: "8",
    scene: {
      bodies: [
        { kind: "box", a: 2, b: 2, h: 2 },
        { kind: "box", a: 4, b: 4, h: 4, ghost: true, hideLabels: true, names: ["P", "Q", "R", "T"] }
      ]
    },
    labels: [["P", "Q", "a"], ["A", "B", "a/2"]],
    hint: "Объём куба пропорционален кубу ребра: сравните a³ и (a/2)³.",
    sol: [
      "Новое ребро a/2, его объём (a/2)³ = a³/8.",
      "Объём уменьшился в 8 раз."
    ]
  },
  {
    id: "kub-14", topic: "Куб", group: "изменение размеров",
    cond: "Рёбра двух кубов равны 6 и 2. Во сколько раз площадь поверхности первого куба больше площади поверхности второго?",
    ans: "9",
    scene: {
      bodies: [
        { kind: "box", a: 2, b: 2, h: 2, names: ["K", "L", "M", "N"], hideLabels: true },
        { kind: "box", a: 6, b: 6, h: 6, at: [3.5, 0, 0], hideLabels: true }
      ]
    },
    labels: [["A", "B", "6"], ["K", "L", "2"]],
    hint: "Площади поверхностей подобных тел относятся как квадраты соответствующих рёбер.",
    sol: [
      "S₁ = 6 · 6² = 216, S₂ = 6 · 2² = 24.",
      "S₁ : S₂ = 216 : 24 = 9."
    ]
  }
];

/* Старый банк, тема «Параллелепипед»: 33 задач открытого банка задания 3
   (Решу ЕГЭ; id — номер задачи на math-ege.sdamgia.ru/problem?id=…).
   Перенесены ДОСЛОВНО из опубликованной линейки
   trainers/ege-profile-stereometry-3d/js/data.js (коммит 4dc0592):
   поля, числа, тексты и порядок не менялись — под этими id у учеников
   записан прогресс (stereo3.status), а позиция задачи в теме —
   в stereo3.last.<тема>. Сцены строит engine-legacy.js (scene.prims / dims),
   общие константы (SQ2, SQ3, SQ5, HALF_PTS, HALF_FACES) — тоже там.
   Не переименовывать и не переставлять. */
const P_LEGACY_PAR = [
  /* ======= Поверхность и рёбра ======= */
  { id:"27054", topic:"Параллелепипед", group:"Поверхность", ans:"5",
    cond:"Два ребра прямоугольного параллелепипеда, выходящие из одной вершины, равны 3 и 4. Площадь поверхности этого параллелепипеда равна 94. Найдите третье ребро, выходящее из той же вершины.",
    dims:[3,4,5], labels:[["A","B","3"],["A","D","4"],["A","A1","?"]],
    hint:"Площадь поверхности: S = 2(ab + ac + bc). Обозначьте третье ребро за x.",
    sol:["S = 2(ab + ac + bc). Пусть третье ребро равно x.","2(3·4 + 3x + 4x) = 94 ⇒ 12 + 7x = 47 ⇒ 7x = 35 ⇒ x = 5."] },
  { id:"27128", topic:"Параллелепипед", group:"Поверхность", ans:"22",
    cond:"Рёбра прямоугольного параллелепипеда, выходящие из одной вершины, равны 1, 2, 3. Найдите его площадь поверхности.",
    dims:[1,2,3], labels:[["A","B","1"],["A","D","2"],["A","A1","3"]],
    hint:"S = 2(ab + ac + bc).",
    sol:["S = 2(ab + ac + bc) = 2(1·2 + 1·3 + 2·3) = 2·11 = 22."] },
  { id:"27143", topic:"Параллелепипед", group:"Поверхность", ans:"64",
    cond:"Два ребра прямоугольного параллелепипеда, выходящие из одной вершины, равны 2, 4. Диагональ параллелепипеда равна 6. Найдите площадь поверхности параллелепипеда.",
    dims:[2,4,4], labels:[["A","B","2"],["A","D","4"],["A","A1","?"]],
    construct:{ segments:[["B","D1","6"],["B","D"]] },
    hint:"Квадрат диагонали равен сумме квадратов трёх измерений: d² = a² + b² + c².",
    sol:["d² = a² + b² + c² ⇒ c² = 36 − 4 − 16 = 16 ⇒ c = 4.","S = 2(2·4 + 2·4 + 4·4) = 2·32 = 64."] },
  { id:"27146", topic:"Параллелепипед", group:"Поверхность", ans:"22",
    cond:"Два ребра прямоугольного параллелепипеда, выходящие из одной вершины, равны 1 и 2. Объём параллелепипеда равен 6. Найдите площадь его поверхности.",
    dims:[1,2,3], labels:[["A","B","1"],["A","D","2"],["A","A1","?"]],
    hint:"Из объёма V = abc найдите третье ребро.",
    sol:["c = V/(ab) = 6/2 = 3.","S = 2(1·2 + 1·3 + 2·3) = 2·11 = 22."] },
  /* ======= Объём ======= */
  { id:"27076", topic:"Параллелепипед", group:"Объём", ans:"48",
    cond:"Площадь грани прямоугольного параллелепипеда равна 12. Ребро, перпендикулярное этой грани, равно 4. Найдите объём параллелепипеда.",
    dims:[3,4,4], labels:[["A","A1","4"]], givenFaces:[{face:["A","B","C","D"],text:"S = 12"}],
    hint:"V = S·h, где S — площадь грани, h — перпендикулярное к ней ребро.",
    sol:["V = S·h = 12·4 = 48."] },
  { id:"27077", topic:"Параллелепипед", group:"Объём", ans:"8",
    cond:"Объём прямоугольного параллелепипеда равен 24. Одно из его рёбер равно 3. Найдите площадь грани параллелепипеда, перпендикулярной этому ребру.",
    dims:[2,4,3], labels:[["A","A1","3"]], givenFaces:[{face:["A","B","C","D"],text:"S = ?"}],
    hint:"V = S·h ⇒ S = V/h.",
    sol:["S = V/h = 24/3 = 8."] },
  { id:"27078", topic:"Параллелепипед", group:"Объём", ans:"5",
    cond:"Объём прямоугольного параллелепипеда равен 60. Площадь одной его грани равна 12. Найдите ребро параллелепипеда, перпендикулярное этой грани.",
    dims:[3,4,5], labels:[["A","A1","?"]], givenFaces:[{face:["A","B","C","D"],text:"S = 12"}],
    hint:"V = S·h ⇒ h = V/S.",
    sol:["h = V/S = 60/12 = 5."] },
  { id:"27079", topic:"Параллелепипед", group:"Объём", ans:"4",
    cond:"Два ребра прямоугольного параллелепипеда, выходящие из одной вершины, равны 2 и 6. Объём параллелепипеда равен 48. Найдите третье ребро параллелепипеда, выходящее из той же вершины.",
    dims:[2,6,4], labels:[["A","B","2"],["A","D","6"],["A","A1","?"]],
    hint:"V = abc.",
    sol:["x = V/(ab) = 48/(2·6) = 4."] },
  { id:"27080", topic:"Параллелепипед", group:"Объём", ans:"6",
    cond:"Три ребра прямоугольного параллелепипеда, выходящие из одной вершины, равны 4, 6, 9. Найдите ребро равновеликого ему куба.",
    dims:[4,6,9], labels:[["A","B","4"],["A","D","6"],["A","A1","9"]],
    hint:"Объёмы равновеликих тел равны: a³ = 4·6·9.",
    sol:["V = 4·6·9 = 216.","Ребро куба: a = ∛216 = 6."] },
  { id:"27100", topic:"Параллелепипед", group:"Объём", ans:"32",
    cond:"Два ребра прямоугольного параллелепипеда, выходящие из одной вершины, равны 2, 4. Диагональ параллелепипеда равна 6. Найдите объём параллелепипеда.",
    dims:[2,4,4], labels:[["A","B","2"],["A","D","4"],["A","A1","?"]],
    construct:{ segments:[["B","D1","6"],["B","D"]] },
    hint:"Сначала найдите третье ребро из d² = a² + b² + c².",
    sol:["c² = 36 − 4 − 16 = 16 ⇒ c = 4.","V = 2·4·4 = 32."] },
  { id:"27101", topic:"Параллелепипед", group:"Объём", ans:"7",
    cond:"Два ребра прямоугольного параллелепипеда, выходящие из одной вершины, равны 2, 3. Объём параллелепипеда равен 36. Найдите его диагональ.",
    dims:[2,3,6], labels:[["A","B","2"],["A","D","3"],["A","A1","?"]],
    construct:{ segments:[["B","D1","?"],["B","D"]] },
    hint:"Найдите третье ребро из объёма, затем d = √(a² + b² + c²).",
    sol:["c = 36/(2·3) = 6.","d = √(4 + 9 + 36) = √49 = 7."] },
  { id:"27103", topic:"Параллелепипед", group:"Объём", ans:"4",
    cond:"Одна из граней прямоугольного параллелепипеда — квадрат. Диагональ параллелепипеда равна √8 и образует с плоскостью этой грани угол 45°. Найдите объём параллелепипеда.",
    dims:[SQ2,SQ2,2],
    construct:{ segments:[["B","D1","√8"],["B","D"],["D","D1"]], fills:[["B","D","D1"]] },
    givenFaces:[{face:["A","B","C","D"],text:"квадрат"}],
    hint:"Проекция диагонали на плоскость грани — диагональ квадрата. При угле 45° катеты равны.",
    sol:["Проекция диагонали BD₁ на плоскость квадратной грани — диагональ квадрата BD; △BDD₁ прямоугольный.","Угол 45° ⇒ BD = DD₁ = √8·(√2/2) = 2.","Диагональ квадрата равна 2 ⇒ сторона a = 2/√2 = √2.","V = √2·√2·2 = 4."] },
  { id:"661073", topic:"Параллелепипед", group:"Объём", ans:"30",
    cond:"Три ребра прямоугольного параллелепипеда, исходящие из одной вершины, равны 5, 6, 8. Найдите объём параллелепипеда, рёбра которого равны половинам рёбер данного параллелепипеда.",
    dims:[5,6,8], labels:[["A","B","5"],["A","D","6"],["A","A1","8"]],
    construct:{ points:HALF_PTS, solid:HALF_FACES },
    hint:"Каждое измерение уменьшилось в 2 раза — объём уменьшился в 2³ = 8 раз.",
    sol:["V = (5/2)·(6/2)·(8/2) = 2,5·3·4 = 30.","Иначе: V = 5·6·8/8 = 240/8 = 30."] },
  /* ======= Диагонали и расстояния ======= */
  { id:"27060", topic:"Параллелепипед", group:"Диагонали", ans:"3",
    cond:"Два ребра прямоугольного параллелепипеда, выходящие из одной вершины, равны 1, 2. Площадь поверхности параллелепипеда равна 16. Найдите его диагональ.",
    dims:[1,2,2], labels:[["A","B","1"],["A","D","2"],["A","A1","?"]],
    construct:{ segments:[["B","D1","?"],["B","D"]] },
    hint:"Из площади поверхности найдите третье ребро, затем d = √(a² + b² + c²).",
    sol:["2(1·2 + 1·c + 2·c) = 16 ⇒ 2 + 3c = 8 ⇒ c = 2.","d = √(1 + 4 + 4) = √9 = 3."] },
  { id:"245359", topic:"Параллелепипед", group:"Диагонали", ans:"50",
    cond:"Найдите квадрат расстояния между вершинами C и A₁ прямоугольного параллелепипеда, для которого AB = 5, AD = 4, AA₁ = 3.",
    dims:[5,4,3], labels:[["A","B","5"],["A","D","4"],["A","A1","3"]],
    construct:{ segments:[["C","A1","?"],["A","C"]] },
    hint:"CA₁ — диагональ параллелепипеда: её квадрат равен сумме квадратов измерений.",
    sol:["CA₁² = AB² + AD² + AA₁² = 25 + 16 + 9 = 50."] },
  { id:"245360", topic:"Параллелепипед", group:"Диагонали", ans:"5",
    cond:"Найдите расстояние между вершинами A и D₁ прямоугольного параллелепипеда, для которого AB = 5, AD = 4, AA₁ = 3.",
    dims:[5,4,3], labels:[["A","B","5"],["A","D","4"],["A","A1","3"]],
    construct:{ segments:[["A","D1","?"]], fills:[["A","D","D1"]] },
    hint:"AD₁ — диагональ грани ADD₁A₁. Теорема Пифагора в △ADD₁.",
    sol:["AD₁ — диагональ прямоугольника ADD₁A₁:","AD₁ = √(AD² + DD₁²) = √(16 + 9) = √25 = 5."] },
  { id:"284357", topic:"Параллелепипед", group:"Диагонали", ans:"1",
    cond:"В прямоугольном параллелепипеде ABCDA₁B₁C₁D₁ известно, что BD₁ = 3, CD = 2, AD = 2. Найдите длину ребра AA₁.",
    dims:[2,2,1], labels:[["C","D","2"],["A","D","2"],["A","A1","?"]],
    construct:{ segments:[["B","D1","3"],["B","D"]] },
    hint:"BD₁ — диагональ параллелепипеда: BD₁² = AB² + AD² + AA₁² (AB = CD).",
    sol:["BD₁² = AB² + AD² + AA₁², где AB = CD = 2.","AA₁² = 9 − 4 − 4 = 1 ⇒ AA₁ = 1."] },
  { id:"284363", topic:"Параллелепипед", group:"Диагонали", ans:"3",
    cond:"В прямоугольном параллелепипеде ABCDA₁B₁C₁D₁ известно, что DD₁ = 1, CD = 2, AD = 2. Найдите длину диагонали CA₁.",
    dims:[2,2,1], labels:[["C","D","2"],["A","D","2"],["D","D1","1"]],
    construct:{ segments:[["C","A1","?"],["A","C"]] },
    hint:"CA₁² = CD² + AD² + DD₁².",
    sol:["CA₁ = √(CD² + AD² + DD₁²) = √(4 + 4 + 1) = √9 = 3."] },
  /* ======= Углы ======= */
  { id:"245361", topic:"Параллелепипед", group:"Углы", ans:"45",
    cond:"Найдите угол ABD₁ прямоугольного параллелепипеда, для которого AB = 5, AD = 4, AA₁ = 3. Дайте ответ в градусах.",
    dims:[5,4,3], labels:[["A","B","5"],["A","D","4"],["A","A1","3"]],
    construct:{ segments:[["A","D1","?"],["B","D1","?"]], fills:[["A","B","D1"]] },
    hint:"AB ⊥ плоскости ADD₁A₁, поэтому △ABD₁ прямоугольный с прямым углом при A. Найдите катет AD₁.",
    sol:["AD₁ = √(AD² + AA₁²) = √(16 + 9) = 5.","AB ⊥ (ADD₁A₁) ⇒ △ABD₁ прямоугольный при A.","tg∠ABD₁ = AD₁/AB = 5/5 = 1 ⇒ ∠ABD₁ = 45°."] },
  { id:"245363", topic:"Параллелепипед", group:"Углы", ans:"45",
    cond:"В прямоугольном параллелепипеде ABCDA₁B₁C₁D₁ известно, что AB = 4, AD = 3, AA₁ = 5. Найдите угол DBD₁. Ответ дайте в градусах.",
    dims:[4,3,5], labels:[["A","B","4"],["A","D","3"],["A","A1","5"]],
    construct:{ segments:[["B","D","?"],["B","D1","?"]], fills:[["D","B","D1"]] },
    hint:"△BDD₁ прямоугольный при D. Найдите BD — диагональ основания.",
    sol:["BD = √(AB² + AD²) = √(16 + 9) = 5.","DD₁ ⊥ (ABCD) ⇒ △BDD₁ прямоугольный при D.","tg∠DBD₁ = DD₁/BD = 5/5 = 1 ⇒ ∠DBD₁ = 45°."] },
  { id:"318474", topic:"Параллелепипед", group:"Углы", ans:"0,6",
    cond:"В прямоугольном параллелепипеде ABCDA₁B₁C₁D₁ известны длины рёбер AB = 8, AD = 6, AA₁ = 21. Найдите синус угла между прямыми CD и A₁C₁.",
    dims:[8,6,21], labels:[["A","B","8"],["A","D","6"],["A","A1","21"]],
    construct:{ segments:[["A","C","?"],["A1","C1","?"]], fills:[["A","B","C"]] },
    hint:"A₁C₁ ∥ AC, CD ∥ AB. Искомый угол равен углу BAC в прямоугольном △ABC.",
    sol:["A₁C₁ ∥ AC и CD ∥ AB ⇒ угол между прямыми равен ∠BAC.","AC = √(64 + 36) = 10.","sin∠BAC = BC/AC = 6/10 = 0,6."] },
  /* ======= Сечения ======= */
  { id:"316552", topic:"Параллелепипед", group:"Сечения", ans:"572",
    cond:"В прямоугольном параллелепипеде ABCDA₁B₁C₁D₁ известны длины рёбер: AB = 24, AD = 10, AA₁ = 22. Найдите площадь сечения, проходящего через вершины A, A₁ и C.",
    dims:[24,10,22], labels:[["A","B","24"],["A","D","10"],["A","A1","22"]],
    construct:{ segments:[["A","C","?"],["A1","C1","?"]], fills:[["A","C","C1","A1"]] },
    hint:"Сечение — прямоугольник ACC₁A₁. Найдите AC по теореме Пифагора.",
    sol:["Сечение — прямоугольник ACC₁A₁.","AC = √(24² + 10²) = √676 = 26.","S = AC·AA₁ = 26·22 = 572."] },
  { id:"324452", topic:"Параллелепипед", group:"Сечения", ans:"39",
    cond:"В прямоугольном параллелепипеде ABCDA₁B₁C₁D₁ известны длины рёбер: AB = 3, AD = 5, AA₁ = 12. Найдите площадь сечения параллелепипеда плоскостью, проходящей через точки A, B и C₁.",
    dims:[3,5,12], labels:[["A","B","3"],["A","D","5"],["A","A1","12"]],
    construct:{ segments:[["B","C1","?"],["A","D1","?"]], fills:[["A","B","C1","D1"]] },
    hint:"Сечение — прямоугольник ABC₁D₁. Найдите BC₁ из △BCC₁.",
    sol:["Плоскость через A, B, C₁ пересекает параллелепипед по прямоугольнику ABC₁D₁.","BC₁ = √(BC² + CC₁²) = √(25 + 144) = 13.","S = AB·BC₁ = 3·13 = 39."] },
  { id:"315131", topic:"Параллелепипед", group:"Сечения", ans:"5",
    cond:"В прямоугольном параллелепипеде ABCDA₁B₁C₁D₁ ребро AB = 2, ребро AD = √5, ребро AA₁ = 2. Точка K — середина ребра BB₁. Найдите площадь сечения, проходящего через точки A₁, D₁ и K.",
    dims:[2,SQ5,2], labels:[["A","B","2"],["A","D","√5"],["A","A1","2"]],
    construct:{ points:{K:[1,0,0.5],L:[1,1,0.5]}, segments:[["A1","K","?"],["D1","L","?"],["K","L","?"]], fills:[["A1","D1","L","K"]] },
    hint:"Плоскость сечения пересечёт ребро CC₁ в его середине L. Сечение — параллелограмм A₁D₁LK. Сравните его стороны и диагонали.",
    sol:["Сечение пересекает CC₁ в середине L; сечение — параллелограмм A₁D₁LK.","A₁K = √(AB² + (AA₁/2)²) = √(4+1) = √5 = A₁D₁ — ромб.","Диагонали: A₁L = D₁K = √10 — равны ⇒ A₁D₁LK — квадрат со стороной √5.","S = (√5)² = 5."] },
  /* ======= Объём многогранника ======= */
  { id:"27209", topic:"Параллелепипед", group:"Отсечённые тела", ans:"1,5",
    cond:"Объём параллелепипеда ABCDA₁B₁C₁D₁ равен 4,5. Найдите объём треугольной пирамиды AD₁CB₁.",
    dims:[2,1.5,1.5],
    construct:{ solid:[["A","C","B1"],["A","C","D1"],["A","B1","D1"],["C","B1","D1"]] },
    hint:"От параллелепипеда отсекаются четыре «угловых» тетраэдра, объём каждого — V/6.",
    sol:["Пирамида AD₁CB₁ получается отсечением от параллелепипеда четырёх тетраэдров (при вершинах B, D, A₁, C₁), объём каждого равен V/6.","V(AD₁CB₁) = V − 4·V/6 = V/3 = 4,5/3 = 1,5."] },
  { id:"245335", topic:"Параллелепипед", group:"Отсечённые тела", ans:"30",
    cond:"Найдите объём многогранника, вершинами которого являются точки A, D, A₁, B, C, B₁ прямоугольного параллелепипеда ABCDA₁B₁C₁D₁, у которого AB = 3, AD = 4, AA₁ = 5.",
    dims:[3,4,5], labels:[["A","B","3"],["A","D","4"],["A","A1","5"]],
    construct:{ solid:[["A","D","A1"],["B","C","B1"],["A","D","C","B"],["D","A1","B1","C"],["A","A1","B1","B"]] },
    hint:"Многогранник — треугольная призма, половина параллелепипеда.",
    sol:["Многогранник — призма с основаниями △ADA₁ и △BCB₁ — половина параллелепипеда.","V = 3·4·5/2 = 30."] },
  { id:"245336", topic:"Параллелепипед", group:"Отсечённые тела", ans:"8",
    cond:"Найдите объём многогранника, вершинами которого являются точки A, B, C, D₁ прямоугольного параллелепипеда ABCDA₁B₁C₁D₁, у которого AB = 4, AD = 3, AA₁ = 4.",
    dims:[4,3,4], labels:[["A","B","4"],["A","D","3"],["A","A1","4"]],
    construct:{ solid:[["A","B","C"],["A","B","D1"],["B","C","D1"],["A","C","D1"]] },
    hint:"Пирамида с основанием △ABC и высотой, равной DD₁.",
    sol:["Основание — △ABC: S = ½·AB·BC = ½·4·3 = 6.","Высота пирамиды равна DD₁ = 4 (D₁ проецируется в точку D плоскости основания).","V = ⅓·6·4 = 8."] },
  { id:"245337", topic:"Параллелепипед", group:"Отсечённые тела", ans:"16",
    cond:"Найдите объём многогранника, вершинами которого являются точки A₁, B, C, C₁, B₁ прямоугольного параллелепипеда ABCDA₁B₁C₁D₁, у которого AB = 4, AD = 3, AA₁ = 4.",
    dims:[4,3,4], labels:[["A","B","4"],["A","D","3"],["A","A1","4"]],
    construct:{ solid:[["B","C","C1","B1"],["A1","B","C"],["A1","C","C1"],["A1","C1","B1"],["A1","B1","B"]] },
    hint:"Пирамида с основанием — гранью BCC₁B₁ и вершиной A₁; высота — A₁B₁.",
    sol:["Основание — грань BCC₁B₁: S = BC·BB₁ = 3·4 = 12.","Высота — A₁B₁ ⊥ (BCC₁B₁), A₁B₁ = 4.","V = ⅓·12·4 = 16."] },
  { id:"245338", topic:"Параллелепипед", group:"Отсечённые тела", ans:"6",
    cond:"Найдите объём многогранника, вершинами которого являются точки A, B, C, B₁ прямоугольного параллелепипеда ABCDA₁B₁C₁D₁, у которого AB = 3, AD = 3, AA₁ = 4.",
    dims:[3,3,4], labels:[["A","B","3"],["A","D","3"],["A","A1","4"]],
    construct:{ solid:[["A","B","C"],["A","B","B1"],["B","C","B1"],["A","C","B1"]] },
    hint:"Пирамида с основанием △ABC и высотой BB₁.",
    sol:["Основание — △ABC: S = ½·3·3 = 4,5.","Высота — BB₁ = 4.","V = ⅓·4,5·4 = 6."] },
  { id:"245339", topic:"Параллелепипед", group:"Отсечённые тела", ans:"10",
    cond:"Найдите объём многогранника, вершинами которого являются точки A, B, B₁, C₁ прямоугольного параллелепипеда ABCDA₁B₁C₁D₁, у которого AB = 5, AD = 3, AA₁ = 4.",
    dims:[5,3,4], labels:[["A","B","5"],["A","D","3"],["A","A1","4"]],
    construct:{ solid:[["A","B","B1"],["B","B1","C1"],["A","B1","C1"],["A","B","C1"]] },
    hint:"Возьмите за основание △ABB₁ (лежит в грани ABB₁A₁); высота — расстояние от C₁ до этой грани.",
    sol:["Основание — △ABB₁: S = ½·AB·BB₁ = ½·5·4 = 10.","Высота — B₁C₁ ⊥ (ABB₁A₁), B₁C₁ = 3.","V = ⅓·10·3 = 10."] },
  { id:"639664", topic:"Параллелепипед", group:"Отсечённые тела", ans:"72",
    cond:"Найдите объём многогранника, вершинами которого являются вершины A, B, C, D, B₁ прямоугольного параллелепипеда ABCDA₁B₁C₁D₁, у которого AB = 9, BC = 3, BB₁ = 8.",
    dims:[9,3,8], labels:[["A","B","9"],["B","C","3"],["B","B1","8"]],
    construct:{ solid:[["A","B","C","D"],["B1","A","B"],["B1","B","C"],["B1","C","D"],["B1","D","A"]] },
    hint:"Пирамида с основанием ABCD и высотой BB₁.",
    sol:["Основание — прямоугольник ABCD: S = 9·3 = 27.","Высота — BB₁ = 8.","V = ⅓·27·8 = 72."] },
  { id:"639741", topic:"Параллелепипед", group:"Отсечённые тела", ans:"35",
    cond:"Найдите объём многогранника, вершинами которого являются вершины A, B, C, D, B₁ прямоугольного параллелепипеда ABCDA₁B₁C₁D₁, у которого AB = 3, BC = 7, BB₁ = 5.",
    dims:[3,7,5], labels:[["A","B","3"],["B","C","7"],["B","B1","5"]],
    construct:{ solid:[["A","B","C","D"],["B1","A","B"],["B1","B","C"],["B1","C","D"],["B1","D","A"]] },
    hint:"Пирамида с основанием ABCD и высотой BB₁.",
    sol:["S(ABCD) = 3·7 = 21, высота BB₁ = 5.","V = ⅓·21·5 = 35."] },
  { id:"660710", topic:"Параллелепипед", group:"Отсечённые тела", ans:"135",
    cond:"В прямоугольном параллелепипеде ABCDA₁B₁C₁D₁ известно, что AB = 9, BC = 6, AA₁ = 5. Найдите объём многогранника, вершинами которого являются точки A, B, C, A₁, B₁, C₁.",
    dims:[9,6,5], labels:[["A","B","9"],["B","C","6"],["A","A1","5"]],
    construct:{ solid:[["A","B","C"],["A1","B1","C1"],["A","B","B1","A1"],["B","C","C1","B1"],["A","C","C1","A1"]] },
    hint:"Многогранник — треугольная призма ABCA₁B₁C₁, половина параллелепипеда.",
    sol:["Многогранник — призма с основанием △ABC (половина параллелепипеда).","V = ½·9·6·5 = 135."] },
];

/* Банк «Параллелепипед» — Стереометрия, задание 3 ЕГЭ (профиль). 32 задачи
   (par-36 убрана как дубль старой задачи 245363; условие par-34 переписано
   своими словами 24.09.2026 — прежнее повторяло текст задания демоверсии). */
const P_PAR = [

  /* ---------- объём (7) ---------- */
  {
    id: "par-01", topic: "Параллелепипед", group: "объём",
    cond: "В прямоугольном параллелепипеде ABCDA1B1C1D1 рёбра AB, AD и AA1 равны 6, 5 и 4 соответственно. Найдите объём параллелепипеда.",
    ans: "120",
    scene: { bodies: [{ kind: "box", a: 6, b: 5, h: 4 }] },
    labels: [["A", "B", "6"], ["A", "D", "5"], ["B", "B1", "4"]],
    hint: "Объём прямоугольного параллелепипеда — произведение трёх его измерений.",
    sol: [
      "V = AB·AD·AA₁.",
      "V = 6·5·4 = 120."
    ]
  },
  {
    id: "par-02", topic: "Параллелепипед", group: "объём",
    cond: "Объём прямоугольного параллелепипеда ABCDA1B1C1D1 равен 80. Рёбра AB и BC равны 5 и 2. Найдите ребро AA1.",
    ans: "8",
    scene: { bodies: [{ kind: "box", a: 5, b: 2, h: 8 }] },
    labels: [["A", "B", "5"], ["B", "C", "2"], ["A", "A1", "?"]],
    hint: "Выразите неизвестное ребро из формулы V = abc.",
    sol: [
      "V = AB·BC·AA₁, откуда AA₁ = V/(AB·BC).",
      "AA₁ = 80/(5·2) = 8."
    ]
  },
  {
    id: "par-03", topic: "Параллелепипед", group: "объём",
    cond: "Во сколько раз увеличится объём прямоугольного параллелепипеда, если каждое из рёбер AB и AD увеличить в 2 раза, а ребро AA1 оставить прежним?",
    ans: "4",
    scene: {
      bodies: [
        { kind: "box", a: 3, b: 2, h: 3 },
        { kind: "box", a: 6, b: 4, h: 3, names: ["E", "F", "G", "H"], ghost: true, hideLabels: true }
      ]
    },
    labels: [["A", "B", "a"], ["A", "D", "b"], ["E", "F", "2a"], ["F", "G", "2b"]],
    hint: "Запишите объём как произведение трёх измерений и посмотрите, как меняется каждый множитель.",
    sol: [
      "V = AB·AD·AA₁.",
      "V′ = (2·AB)·(2·AD)·AA₁ = 4·V.",
      "Объём увеличится в 4 раза."
    ]
  },
  {
    id: "par-04", topic: "Параллелепипед", group: "объём",
    cond: "Во сколько раз увеличится объём прямоугольного параллелепипеда, если ребро CC1 увеличить в 3 раза, а остальные рёбра оставить прежними?",
    ans: "3",
    scene: {
      bodies: [
        { kind: "box", a: 4, b: 3, h: 2 },
        { kind: "box", a: 4, b: 3, h: 6, names: ["E", "F", "G", "H"], ghost: true, hideLabels: true }
      ]
    },
    labels: [["C", "C1", "c"], ["G", "G1", "3c"]],
    hint: "Объём — произведение трёх измерений; меняется только один множитель.",
    sol: [
      "V = AB·AD·CC₁ — произведение трёх измерений.",
      "Один множитель вырастает в 3 раза, поэтому V′ = 3·V."
    ]
  },
  {
    id: "par-05", topic: "Параллелепипед", group: "объём",
    cond: "Площадь грани ABB1A1 прямоугольного параллелепипеда ABCDA1B1C1D1 равна 14, а ребро AD равно 5. Найдите объём параллелепипеда.",
    ans: "70",
    scene: { bodies: [{ kind: "box", a: 7, b: 5, h: 2 }] },
    labels: [["A", "D", "5"]],
    givenFaces: [{ face: ["A", "B", "B1", "A1"], text: "S = 14" }],
    hint: "Объём равен площади грани, умноженной на перпендикулярное ей ребро.",
    sol: [
      "Ребро AD перпендикулярно грани ABB₁A₁.",
      "V = S·AD = 14·5 = 70."
    ]
  },
  {
    id: "par-06", topic: "Параллелепипед", group: "объём",
    cond: "Площади трёх граней прямоугольного параллелепипеда, имеющих общую вершину, равны 6, 10 и 15. Найдите объём параллелепипеда.",
    ans: "30",
    scene: { bodies: [{ kind: "box", a: 2, b: 3, h: 5 }] },
    givenFaces: [
      { face: ["A", "B", "C", "D"], text: "6" },
      { face: ["A", "B", "B1", "A1"], text: "10" },
      { face: ["A", "D", "D1", "A1"], text: "15" }
    ],
    hint: "Перемножьте все три площади — получится квадрат объёма.",
    sol: [
      "Пусть измерения равны a, b, c: ab = 6, ac = 10, bc = 15.",
      "Перемножим: (abc)² = 6·10·15 = 900.",
      "V = abc = 30."
    ]
  },
  {
    id: "par-07", topic: "Параллелепипед", group: "объём",
    cond: "Площади трёх граней прямоугольного параллелепипеда, имеющих общую вершину, равны 12, 15 и 20. Найдите объём параллелепипеда.",
    ans: "60",
    scene: { bodies: [{ kind: "box", a: 3, b: 4, h: 5 }] },
    givenFaces: [
      { face: ["A", "B", "C", "D"], text: "12" },
      { face: ["A", "B", "B1", "A1"], text: "15" },
      { face: ["A", "D", "D1", "A1"], text: "20" }
    ],
    hint: "Произведение трёх площадей граней равно квадрату объёма параллелепипеда.",
    sol: [
      "ab = 12, ac = 15, bc = 20.",
      "(abc)² = 12·15·20 = 3600.",
      "V = abc = 60."
    ]
  },

  /* ---------- площадь поверхности (7) ---------- */
  {
    id: "par-08", topic: "Параллелепипед", group: "площадь поверхности",
    cond: "Найдите площадь полной поверхности прямоугольного параллелепипеда с измерениями 3, 5 и 8.",
    ans: "158",
    scene: { bodies: [{ kind: "box", a: 5, b: 3, h: 8 }] },
    labels: [["A", "B", "5"], ["A", "D", "3"], ["B", "B1", "8"]],
    hint: "Площадь поверхности: S = 2(ab + bc + ac).",
    sol: [
      "S = 2(3·5 + 3·8 + 5·8).",
      "S = 2(15 + 24 + 40) = 158."
    ]
  },
  {
    id: "par-09", topic: "Параллелепипед", group: "площадь поверхности",
    cond: "Площадь поверхности прямоугольного параллелепипеда ABCDA1B1C1D1 равна 166. Рёбра AB и AD равны 7 и 4. Найдите ребро AA1.",
    ans: "5",
    scene: { bodies: [{ kind: "box", a: 7, b: 4, h: 5 }] },
    labels: [["A", "B", "7"], ["A", "D", "4"], ["A", "A1", "?"]],
    hint: "Подставьте известные рёбра в S = 2(ab + (a + b)c) и решите уравнение.",
    sol: [
      "166 = 2(7·4 + (7 + 4)·AA₁).",
      "83 = 28 + 11·AA₁, откуда AA₁ = 5."
    ]
  },
  {
    id: "par-10", topic: "Параллелепипед", group: "площадь поверхности",
    cond: "Длина, ширина и высота прямоугольного параллелепипеда равны 9, 4 и 1,5. Чему равна площадь его поверхности?",
    ans: "111",
    scene: { bodies: [{ kind: "box", a: 9, b: 4, h: 1.5 }] },
    labels: [["A", "B", "9"], ["A", "D", "4"], ["B", "B1", "1,5"]],
    hint: "S = 2(ab + bc + ac); аккуратно посчитайте слагаемые с дробью.",
    sol: [
      "S = 2(9·4 + 4·1,5 + 9·1,5).",
      "S = 2(36 + 6 + 13,5) = 2·55,5 = 111."
    ]
  },
  {
    id: "par-11", topic: "Параллелепипед", group: "площадь поверхности",
    cond: "Площадь поверхности прямоугольного параллелепипеда ABCDA1B1C1D1 равна 150. Рёбра AB и BC равны 10 и 4. Найдите ребро BB1.",
    ans: "2,5",
    scene: { bodies: [{ kind: "box", a: 10, b: 4, h: 2.5 }] },
    labels: [["A", "B", "10"], ["B", "C", "4"], ["B", "B1", "?"]],
    hint: "Подставьте данные в формулу площади поверхности и найдите высоту из уравнения.",
    sol: [
      "150 = 2(10·4 + (10 + 4)·BB₁).",
      "75 = 40 + 14·BB₁, откуда BB₁ = 35/14 = 2,5."
    ]
  },
  {
    id: "par-12", topic: "Параллелепипед", group: "площадь поверхности",
    cond: "Рёбра AB, AD и AA1 прямоугольного параллелепипеда ABCDA1B1C1D1 равны 6, 3 и 5. На сколько увеличится площадь поверхности параллелепипеда, если ребро AA1 увеличить на 2?",
    ans: "36",
    scene: {
      bodies: [
        { kind: "box", a: 6, b: 3, h: 5 },
        { kind: "box", a: 6, b: 3, h: 7, names: ["E", "F", "G", "H"], ghost: true, hideLabels: true }
      ]
    },
    labels: [["A", "B", "6"], ["A", "D", "3"], ["A", "A1", "5"], ["A1", "E1", "2"]],
    construct: {
      fills: [["A1", "B1", "F1", "E1"], ["B1", "C1", "G1", "F1"], ["C1", "D1", "H1", "G1"], ["D1", "A1", "E1", "H1"]]
    },
    hint: "Основания не изменятся — добавится только боковой пояс высотой 2.",
    sol: [
      "Площади оснований не меняются, добавляется боковой пояс высотой 2.",
      "ΔS = P·Δh = 2(6 + 3)·2 = 36."
    ]
  },
  {
    id: "par-13", topic: "Параллелепипед", group: "площадь поверхности",
    cond: "Площадь грани ABCD прямоугольного параллелепипеда ABCDA1B1C1D1 равна 12, площадь грани ABB1A1 равна 8, а ребро AB равно 4. Найдите площадь поверхности параллелепипеда.",
    ans: "52",
    scene: { bodies: [{ kind: "box", a: 4, b: 3, h: 2 }] },
    labels: [["A", "B", "4"]],
    givenFaces: [
      { face: ["A", "B", "C", "D"], text: "S = 12" },
      { face: ["A", "B", "B1", "A1"], text: "S = 8" }
    ],
    hint: "Найдите рёбра из данных площадей — тогда восстановится и третья грань.",
    sol: [
      "AD = 12/4 = 3, AA₁ = 8/4 = 2.",
      "Третья грань: AD·AA₁ = 3·2 = 6.",
      "S = 2(12 + 8 + 6) = 52."
    ]
  },
  {
    id: "par-14", topic: "Параллелепипед", group: "площадь поверхности",
    cond: "Рёбра AB, AD и AA1 прямоугольного параллелепипеда равны 8, 4 и 6. На сколько уменьшится площадь поверхности параллелепипеда, если ребро AB уменьшить на 2?",
    ans: "40",
    scene: { bodies: [{ kind: "box", a: 8, b: 4, h: 6 }] },
    labels: [["A", "B", "8"], ["A", "D", "4"], ["B", "B1", "6"]],
    hint: "От AB зависят только грани, содержащие это ребро: их суммарная площадь 2·AB·(AD + AA₁).",
    sol: [
      "От AB зависят грани площадью 2·AB·AD и 2·AB·AA₁.",
      "ΔS = 2·ΔAB·(AD + AA₁) = 2·2·(4 + 6) = 40."
    ]
  },

  /* ---------- диагонали (8) ---------- */
  {
    id: "par-15", topic: "Параллелепипед", group: "диагонали",
    cond: "В прямоугольном параллелепипеде ABCDA1B1C1D1 рёбра AB, AD и AA1 равны 2, 4 и 5. Найдите квадрат диагонали AC1.",
    ans: "45",
    scene: { bodies: [{ kind: "box", a: 2, b: 4, h: 5 }] },
    labels: [["A", "B", "2"], ["A", "D", "4"], ["A", "A1", "5"], ["A", "C1", "?"]],
    construct: {
      segments: [["A", "C"], ["A", "C1", "?"]],
      fills: [["A", "C", "C1"]]
    },
    hint: "Сначала найдите квадрат диагонали основания, затем прибавьте квадрат бокового ребра.",
    sol: [
      "AC² = AB² + AD² = 4 + 16 = 20.",
      "Треугольник ACC₁ прямоугольный: AC₁² = AC² + CC₁² = 20 + 25 = 45."
    ]
  },
  {
    id: "par-16", topic: "Параллелепипед", group: "диагонали",
    cond: "В прямоугольном параллелепипеде ABCDA1B1C1D1 известно: AB = 8, BC = 6, AA1 = 5. Найдите площадь сечения ACC1A1, проходящего через диагонали оснований AC и A1C1.",
    ans: "50",
    scene: { bodies: [{ kind: "box", a: 8, b: 6, h: 5 }] },
    labels: [["A", "B", "8"], ["B", "C", "6"], ["A", "A1", "5"]],
    construct: {
      segments: [["A", "C"], ["A1", "C1"]],
      fills: [["A", "C", "C1", "A1"]]
    },
    hint: "Сечение — прямоугольник со сторонами AC и AA₁; диагональ AC найдите по теореме Пифагора.",
    sol: [
      "Сечение ACC₁A₁ — прямоугольник со сторонами AC и AA₁.",
      "AC² = 8² + 6² = 100, AC = 10.",
      "S = 10·5 = 50."
    ]
  },
  {
    id: "par-17", topic: "Параллелепипед", group: "диагонали",
    cond: "Диагональ AC1 прямоугольного параллелепипеда ABCDA1B1C1D1 равна 13, а рёбра AD и AA1 равны 4 и 3. Найдите ребро AB.",
    ans: "12",
    scene: { bodies: [{ kind: "box", a: 12, b: 4, h: 3 }] },
    labels: [["A", "D", "4"], ["A", "A1", "3"], ["A", "B", "?"], ["A", "C1", "13"]],
    construct: {
      segments: [["A", "C"], ["A", "C1"]],
      fills: [["A", "C", "C1"]]
    },
    hint: "Квадрат диагонали параллелепипеда равен сумме квадратов трёх его измерений.",
    sol: [
      "AC₁² = AB² + AD² + AA₁².",
      "169 = AB² + 16 + 9, откуда AB² = 144.",
      "AB = 12."
    ]
  },
  {
    id: "par-18", topic: "Параллелепипед", group: "диагонали",
    cond: "Два измерения прямоугольного параллелепипеда равны 6 и 9, а его диагональ равна 11. Найдите третье измерение.",
    ans: "2",
    scene: { bodies: [{ kind: "box", a: 9, b: 6, h: 2 }] },
    labels: [["A", "B", "9"], ["A", "D", "6"], ["A", "A1", "?"], ["A", "C1", "11"]],
    construct: {
      segments: [["A", "C"], ["A", "C1"]],
      fills: [["A", "C", "C1"]]
    },
    hint: "d² = a² + b² + c² — выразите отсюда неизвестное измерение.",
    sol: [
      "d² = a² + b² + c².",
      "121 = 81 + 36 + c², откуда c² = 4, c = 2."
    ]
  },
  {
    id: "par-19", topic: "Параллелепипед", group: "диагонали",
    cond: "Основание ABCD прямоугольного параллелепипеда ABCDA1B1C1D1 — квадрат со стороной 4, а диагональ параллелепипеда равна 9. Найдите боковое ребро AA1.",
    ans: "7",
    scene: { bodies: [{ kind: "box", a: 4, b: 4, h: 7 }] },
    labels: [["A", "B", "4"], ["A", "A1", "?"], ["A", "C1", "9"]],
    construct: {
      segments: [["A", "C"], ["A", "C1"]],
      fills: [["A", "C", "C1"]]
    },
    hint: "Квадрат диагонали равен сумме квадратов трёх измерений; два из них равны.",
    sol: [
      "AC² = 4² + 4² = 32.",
      "AA₁² = AC₁² − AC² = 81 − 32 = 49.",
      "AA₁ = 7."
    ]
  },
  {
    id: "par-20", topic: "Параллелепипед", group: "диагонали",
    cond: "Рёбра прямоугольного параллелепипеда, выходящие из одной вершины, равны 6, 6 и 7. Найдите диагональ параллелепипеда.",
    ans: "11",
    scene: { bodies: [{ kind: "box", a: 6, b: 6, h: 7 }] },
    labels: [["A", "B", "6"], ["A", "D", "6"], ["A", "A1", "7"], ["A", "C1", "?"]],
    construct: {
      segments: [["A", "C"], ["A", "C1", "?"]],
      fills: [["A", "C", "C1"]]
    },
    hint: "Квадрат диагонали параллелепипеда равен сумме квадратов трёх его измерений.",
    sol: [
      "d² = 6² + 6² + 7² = 36 + 36 + 49 = 121.",
      "d = 11."
    ]
  },
  {
    id: "par-21", topic: "Параллелепипед", group: "диагонали",
    cond: "В прямоугольном параллелепипеде ABCDA1B1C1D1 рёбра AB, AD и AA1 равны 12, 9 и 8. Найдите диагональ BD1.",
    ans: "17",
    scene: { bodies: [{ kind: "box", a: 12, b: 9, h: 8 }] },
    labels: [["A", "B", "12"], ["A", "D", "9"], ["A", "A1", "8"], ["B", "D1", "?"]],
    construct: {
      segments: [["B", "D"], ["B", "D1", "?"]],
      fills: [["B", "D", "D1"]]
    },
    hint: "Рассмотрите прямоугольный треугольник BDD₁: сначала найдите диагональ основания BD.",
    sol: [
      "Диагональ основания: BD² = AB² + AD² = 144 + 81 = 225.",
      "Треугольник BDD₁ прямоугольный: BD₁² = BD² + DD₁² = 225 + 64 = 289.",
      "BD₁ = 17."
    ]
  },
  {
    id: "par-22", topic: "Параллелепипед", group: "диагонали",
    cond: "В прямоугольном параллелепипеде ABCDA1B1C1D1 рёбра AB и BB1 равны 4 и 7. Найдите квадрат диагонали AB1 грани ABB1A1.",
    ans: "65",
    scene: { bodies: [{ kind: "box", a: 4, b: 3, h: 7 }] },
    labels: [["A", "B", "4"], ["B", "B1", "7"], ["A", "B1", "?"]],
    construct: {
      segments: [["A", "B1", "?"]],
      fills: [["A", "B", "B1"]]
    },
    hint: "Диагональ грани — гипотенуза прямоугольного треугольника ABB₁.",
    sol: [
      "Треугольник ABB₁ прямоугольный с катетами AB и BB₁.",
      "AB₁² = AB² + BB₁² = 16 + 49 = 65."
    ]
  },

  /* ---------- рёбра и развёртка (6) ---------- */
  {
    id: "par-23", topic: "Параллелепипед", group: "рёбра и развёртка",
    cond: "Рёбра прямоугольного параллелепипеда, выходящие из одной вершины, равны 4, 5 и 9. Найдите сумму длин всех рёбер параллелепипеда.",
    ans: "72",
    scene: { bodies: [{ kind: "box", a: 9, b: 5, h: 4 }] },
    labels: [["A", "B", "9"], ["A", "D", "5"], ["B", "B1", "4"]],
    hint: "У параллелепипеда 12 рёбер: по четыре каждой длины.",
    sol: [
      "Каждое измерение повторяется в четырёх рёбрах.",
      "Сумма: 4(4 + 5 + 9) = 72."
    ]
  },
  {
    id: "par-24", topic: "Параллелепипед", group: "рёбра и развёртка",
    cond: "Сумма длин всех рёбер прямоугольного параллелепипеда ABCDA1B1C1D1 равна 92. Рёбра AB и AD равны 8 и 9. Найдите ребро AA1.",
    ans: "6",
    scene: { bodies: [{ kind: "box", a: 8, b: 9, h: 6 }] },
    labels: [["A", "B", "8"], ["A", "D", "9"], ["A", "A1", "?"]],
    hint: "Сумма всех рёбер равна 4(a + b + c).",
    sol: [
      "4(AB + AD + AA₁) = 92, значит AB + AD + AA₁ = 23.",
      "AA₁ = 23 − 8 − 9 = 6."
    ]
  },
  {
    id: "par-25", topic: "Параллелепипед", group: "рёбра и развёртка",
    cond: "Рёбра прямоугольного параллелепипеда, выходящие из одной вершины, равны 7, 9 и 2,5. Найдите сумму длин всех рёбер параллелепипеда.",
    ans: "74",
    scene: { bodies: [{ kind: "box", a: 9, b: 7, h: 2.5 }] },
    labels: [["A", "B", "9"], ["A", "D", "7"], ["B", "B1", "2,5"]],
    hint: "Каждое измерение входит в сумму рёбер четыре раза.",
    sol: [
      "Сумма всех рёбер: 4(7 + 9 + 2,5).",
      "4·18,5 = 74."
    ]
  },
  {
    id: "par-26", topic: "Параллелепипед", group: "рёбра и развёртка",
    cond: "Сумма длин всех рёбер прямоугольного параллелепипеда равна 96. Два ребра, выходящие из одной вершины, равны 6 и 4. Найдите третье ребро, выходящее из той же вершины.",
    ans: "14",
    scene: { bodies: [{ kind: "box", a: 6, b: 4, h: 14 }] },
    labels: [["A", "B", "6"], ["A", "D", "4"], ["A", "A1", "?"]],
    hint: "Разделите сумму на 4 — получится сумма трёх измерений.",
    sol: [
      "96/4 = 24 — сумма трёх измерений.",
      "Третье ребро: 24 − 6 − 4 = 14."
    ]
  },
  {
    id: "par-27", topic: "Параллелепипед", group: "рёбра и развёртка",
    cond: "В прямоугольном параллелепипеде ABCDA1B1C1D1 рёбра AB, BC и CC1 равны 12, 7 и 4. Найдите периметр грани ABB1A1.",
    ans: "32",
    scene: { bodies: [{ kind: "box", a: 12, b: 7, h: 4 }] },
    labels: [["A", "B", "12"], ["B", "C", "7"], ["C", "C1", "4"]],
    construct: { fills: [["A", "B", "B1", "A1"]] },
    hint: "Определите, какие из данных рёбер являются сторонами грани ABB₁A₁.",
    sol: [
      "Грань ABB₁A₁ — прямоугольник со сторонами AB = 12 и BB₁ = CC₁ = 4.",
      "P = 2(12 + 4) = 32."
    ]
  },
  {
    id: "par-28", topic: "Параллелепипед", group: "рёбра и развёртка",
    cond: "В прямоугольном параллелепипеде ABCDA1B1C1D1 рёбра AB, AD и AA1 равны 6, 9 и 8. Найдите периметр грани DCC1D1.",
    ans: "28",
    scene: { bodies: [{ kind: "box", a: 6, b: 9, h: 8 }] },
    labels: [["A", "B", "6"], ["A", "D", "9"], ["A", "A1", "8"]],
    construct: { fills: [["D", "C", "C1", "D1"]] },
    hint: "Стороны грани DCC₁D₁ равны рёбрам AB и AA₁ — найдите их среди данных.",
    sol: [
      "Грань DCC₁D₁ — прямоугольник со сторонами DC = AB = 6 и CC₁ = AA₁ = 8.",
      "P = 2(6 + 8) = 28."
    ]
  },

  /* ---------- сравнение (2) ---------- */
  {
    id: "par-29", topic: "Параллелепипед", group: "сравнение",
    cond: "Измерения первого прямоугольного параллелепипеда равны 5, 4 и 3, а второго — 4, 2 и 2. Во сколько раз объём первого параллелепипеда больше объёма второго?",
    ans: "3,75",
    scene: {
      bodies: [
        { kind: "box", a: 5, b: 4, h: 3, hideLabels: true },
        { kind: "box", a: 4, b: 2, h: 2, at: [7.5, 0, 0], names: ["K", "L", "M", "N"], hideLabels: true }
      ]
    },
    labels: [["A", "B", "5"], ["A", "D", "4"], ["A", "A1", "3"], ["K", "L", "4"], ["L", "M", "2"], ["M", "M1", "2"]],
    hint: "Найдите оба объёма и разделите один на другой.",
    sol: [
      "V₁ = 5·4·3 = 60, V₂ = 4·2·2 = 16.",
      "V₁/V₂ = 60/16 = 3,75."
    ]
  },
  {
    id: "par-32", topic: "Параллелепипед", group: "сравнение",
    cond: "Измерения первого прямоугольного параллелепипеда равны 9, 6 и 3, а второго — 3, 2 и 1. Во сколько раз площадь поверхности первого параллелепипеда больше площади поверхности второго?",
    ans: "9",
    scene: {
      bodies: [
        { kind: "box", a: 9, b: 6, h: 3, hideLabels: true },
        { kind: "box", a: 3, b: 2, h: 1, at: [12, 0, 0], names: ["K", "L", "M", "N"], hideLabels: true }
      ]
    },
    labels: [["A", "B", "9"], ["A", "D", "6"], ["A", "A1", "3"], ["K", "L", "3"], ["L", "M", "2"], ["M", "M1", "1"]],
    hint: "Параллелепипеды подобны с коэффициентом 3: площади подобных тел относятся как квадрат коэффициента.",
    sol: [
      "Измерения первого втрое больше, тела подобны с k = 3.",
      "Площади поверхностей относятся как k² = 9.",
      "Проверка: S₁ = 198, S₂ = 22, 198/22 = 9."
    ]
  },

  /* ---------- многогранник из вершин (2) ---------- */
  {
    id: "par-34", topic: "Параллелепипед", group: "многогранник из вершин",
    cond: "Рёбра AB, BC и AA1 прямоугольного параллелепипеда ABCDA1B1C1D1 равны соответственно 6, 6 и 7. Найдите объём многогранника с вершинами A, B, C и B1.",
    ans: "42",
    scene: { bodies: [{ kind: "box", a: 6, b: 6, h: 7 }] },
    labels: [["A", "B", "6"], ["B", "C", "6"], ["A", "A1", "7"]],
    construct: {
      segments: [["A", "C"], ["A", "B1"], ["C", "B1"]],
      solid: [["A", "B", "C"], ["A", "C", "B1"]]
    },
    hint: "Многогранник ABCB₁ — пирамида: её основание — треугольник ABC, а высота — ребро BB₁.",
    sol: [
      "Треугольник ABC — половина основания коробки: S = ½·6·6 = 18.",
      "Ребро BB₁ перпендикулярно основанию, поэтому высота пирамиды равна BB₁ = AA₁ = 7.",
      "V = ⅓·18·7 = 42."
    ]
  },
  {
    id: "par-35", topic: "Параллелепипед", group: "многогранник из вершин",
    cond: "Основание ABCD прямоугольного параллелепипеда ABCDA1B1C1D1 — прямоугольник со сторонами AB = 5 и BC = 6, боковое ребро AA1 равно 9. Точки A, B, C, D и B1 служат вершинами многогранника. Найдите его объём.",
    ans: "90",
    scene: { bodies: [{ kind: "box", a: 5, b: 6, h: 9 }] },
    labels: [["A", "B", "5"], ["B", "C", "6"], ["A", "A1", "9"]],
    construct: {
      segments: [["A", "B1"], ["D", "B1"], ["C", "B1"]],
      solid: [["A", "B", "C", "D"]]
    },
    hint: "Многогранник ABCDB₁ — пирамида с основанием ABCD и вершиной B₁.",
    sol: [
      "Основание пирамиды — прямоугольник ABCD: S = 5·6 = 30.",
      "Высота — ребро BB₁ = AA₁ = 9, оно перпендикулярно основанию.",
      "V = ⅓·30·9 = 90."
    ]
  },

  /* par-36 убрана 24.09.2026: дубль задачи 245363 старого банка (problems-legacy-par.js) — та же модель, те же числа. */
];

/* Старый банк, тема «Составные тела»: 6 задач открытого банка задания 3
   (Решу ЕГЭ; id — номер задачи на math-ege.sdamgia.ru/problem?id=…).
   Перенесены ДОСЛОВНО из опубликованной линейки
   trainers/ege-profile-stereometry-3d/js/data.js (коммит 4dc0592):
   поля, числа, тексты и порядок не менялись — под этими id у учеников
   записан прогресс (stereo3.status), а позиция задачи в теме —
   в stereo3.last.<тема>. Сцены строит engine-legacy.js (scene.prims / dims),
   общие константы (SQ2, SQ3, SQ5, HALF_PTS, HALF_FACES) — тоже там.
   Не переименовывать и не переставлять.
   Исключения (решение владельца 24.09.2026, только линейка курса):
     у 27188, 27210 исправлен чертёж (scene / labels / construct).
   id, условия, ответы, подсказки, решения и порядок — прежние;
   список и причины — legacy-parity.js. */
const P_LEGACY_SOST = [
  /* ================= СОСТАВНЫЕ ТЕЛА ================= */
  { id:"27044", topic:"Составные тела", ans:"39",
    cond:"Найдите объём многогранника, изображённого на рисунке (все двугранные углы многогранника прямые).",
    scene:{ prims:[{kind:"boxes", items:[{o:[0,0,0],d:[5,3,1]},{o:[0,1,1],d:[4,2,3]}],
      labels:[{p:[0,0,0],q:[5,0,0],t:"5"},{p:[5,0,0],q:[5,3,0],t:"3"},{p:[5,3,0],q:[5,3,1],t:"1"},
              {p:[0,1,4],q:[4,1,4],t:"4"},{p:[4,1,4],q:[4,3,4],t:"2"},{p:[4,3,1],q:[4,3,4],t:"3"}] }] },
    hint:"Разбейте тело на два параллелепипеда и сложите объёмы.",
    sol:["Тело состоит из параллелепипедов 5×3×1 и 4×2×3.","V = 5·3·1 + 4·2·3 = 15 + 24 = 39."] },
  { id:"27117", topic:"Составные тела", ans:"7",
    cond:"Найдите объём пространственного креста, изображённого на рисунке и составленного из единичных кубов.",
    scene:{ prims:[{kind:"boxes", items:[
      {o:[1,1,1],d:[1,1,1]},{o:[0,1,1],d:[1,1,1]},{o:[2,1,1],d:[1,1,1]},
      {o:[1,0,1],d:[1,1,1]},{o:[1,2,1],d:[1,1,1]},{o:[1,1,0],d:[1,1,1]},{o:[1,1,2],d:[1,1,1]}],
      labels:[{p:[1,1,0],q:[2,1,0],t:"1"}] }] },
    hint:"Сосчитайте единичные кубы.",
    sol:["Крест состоит из 7 единичных кубов.","V = 7·1 = 7."] },
  { id:"27188", topic:"Составные тела", ans:"7",
    cond:"Найдите объём многогранника, изображённого на рисунке (все двугранные углы прямые).",
    scene:{ prims:[{kind:"boxes", items:[{o:[0,0,0],d:[3,2,1]},{o:[0,0,1],d:[1,1,1]}],
      labels:[{p:[0,0,0],q:[3,0,0],t:"3"},{p:[3,0,0],q:[3,2,0],t:"2"},{p:[3,2,0],q:[3,2,1],t:"1"},
              {p:[0,0,2],q:[1,0,2],t:"1"},{p:[1,0,1],q:[1,0,2],t:"1"},
              {p:[1,0,2],q:[1,1,2],t:"1"}] }] },
    hint:"Параллелепипед 3×2×1 плюс единичный куб.",
    sol:["V = 3·2·1 + 1·1·1 = 6 + 1 = 7."] },
  { id:"27190", topic:"Составные тела", ans:"34",
    cond:"Найдите объём многогранника, изображённого на рисунке (все двугранные углы прямые).",
    scene:{ prims:[{kind:"boxes", items:[{o:[0,0,0],d:[5,3,2]},{o:[0,1,2],d:[2,2,1]}],
      labels:[{p:[0,0,0],q:[5,0,0],t:"5"},{p:[5,0,0],q:[5,3,0],t:"3"},{p:[5,3,0],q:[5,3,2],t:"2"},
              {p:[0,1,3],q:[2,1,3],t:"2"},{p:[2,1,3],q:[2,3,3],t:"2"},{p:[2,3,2],q:[2,3,3],t:"1"}] }] },
    hint:"Сумма объёмов нижнего параллелепипеда и верхнего бруска.",
    sol:["V = 5·3·2 + 2·2·1 = 30 + 4 = 34."] },
  { id:"27210", topic:"Составные тела", ans:"78",
    cond:"Найдите объём многогранника, изображённого на рисунке (все двугранные углы прямые).",
    scene:{ prims:[{kind:"boxes", items:[{o:[0,0,0],d:[5,3,4]},{o:[5,0,0],d:[2,3,3]}],
      labels:[{p:[0,0,0],q:[5,0,0],t:"5"},{p:[0,0,0],q:[0,0,4],t:"4"},
              {p:[5,0,4],q:[5,3,4],t:"3"},{p:[5,0,0],q:[7,0,0],t:"2"},{p:[7,0,0],q:[7,0,3],t:"3"}] }] },
    hint:"Разбейте «ступеньку» на два параллелепипеда.",
    sol:["V = 5·3·4 + 2·3·3 = 60 + 18 = 78."] },
  { id:"27211", topic:"Составные тела", ans:"104",
    cond:"Найдите объём многогранника, изображённого на рисунке (все двугранные углы прямые).",
    scene:{ prims:[{kind:"boxes", items:[{o:[0,0,0],d:[7,4,2]},{o:[0,1,2],d:[4,3,4]}],
      labels:[{p:[0,0,0],q:[7,0,0],t:"7"},{p:[7,0,0],q:[7,4,0],t:"4"},{p:[7,4,0],q:[7,4,2],t:"2"},
              {p:[0,1,6],q:[4,1,6],t:"4"},{p:[4,1,6],q:[4,4,6],t:"3"},{p:[4,4,2],q:[4,4,6],t:"4"}] }] },
    hint:"Нижняя плита плюс верхний параллелепипед.",
    sol:["V = 7·4·2 + 4·3·4 = 56 + 48 = 104."] },
];

const P_SOST = [
  {
    id: "sost-01", topic: "Составные тела", group: "объём",
    cond: "Все двугранные углы многогранника, изображённого на рисунке, прямые. Числа на рисунке — длины рёбер. Найдите объём многогранника.",
    ans: "100",
    scene: {
      bodies: [{
        kind: "lshape", h: 4,
        footprint: [[0, 0], [5, 0], [5, 3], [2, 3], [2, 8], [0, 8]],
        faceRects: [[0, 0, 5, 3], [0, 3, 2, 8]],
        names: ["A", "B", "C", "D", "E", "F"]
      }]
    },
    labels: [["A", "B", "5"], ["B", "C", "3"], ["D", "E", "5"], ["E", "F", "2"], ["A", "A1", "4"]],
    construct: {
      points: { "K": [0, 0, 3], "K1": [0, 4, 3] },
      segments: [["D", "K"], ["D1", "K1"]],
      fills: [["D", "K", "K1", "D1"]]
    },
    hint: "Разрежьте многогранник на два прямоугольных параллелепипеда; недостающие рёбра восстановите по рисунку.",
    sol: [
      "Режем тело на параллелепипеды 5 × 3 × 4 и 2 × 5 × 4.",
      "V = 5·3·4 + 2·5·4 = 60 + 40 = 100."
    ]
  },
  {
    id: "sost-02", topic: "Составные тела", group: "объём",
    cond: "На рисунке изображён многогранник, все двугранные углы которого прямые. Числа на рисунке — длины рёбер. Найдите объём многогранника.",
    ans: "78",
    scene: {
      bodies: [{
        kind: "lshape", h: 3,
        footprint: [[0, 0], [8, 0], [8, 2], [5, 2], [5, 7], [3, 7], [3, 2], [0, 2]],
        faceRects: [[0, 0, 8, 2], [3, 2, 5, 7]],
        names: ["A", "B", "C", "D", "E", "F", "G", "H"]
      }]
    },
    labels: [["A", "B", "8"], ["F", "G", "5"], ["C1", "D1", "3"], ["D", "E", "5"], ["E", "F", "2"], ["H", "A", "2"], ["A", "A1", "3"]],
    construct: {
      segments: [["D", "G"], ["D1", "G1"]],
      fills: [["D", "G", "G1", "D1"]]
    },
    hint: "Т-образное тело распадается на «перекладину» и «стойку» — два прямоугольных параллелепипеда.",
    sol: [
      "Перекладина: 8 · 2 · 3 = 48.",
      "Стойка: 2 · 5 · 3 = 30.",
      "V = 48 + 30 = 78."
    ]
  },
  {
    id: "sost-03", topic: "Составные тела", group: "объём",
    cond: "На рисунке изображён многогранник, все двугранные углы которого прямые. Числа на рисунке — длины рёбер. Найдите объём многогранника.",
    ans: "90",
    scene: {
      bodies: [{
        kind: "lshape", h: 3,
        footprint: [[0, 0], [8, 0], [8, 2], [5, 2], [5, 4], [2, 4], [2, 6], [0, 6]],
        faceRects: [[0, 0, 8, 2], [0, 2, 5, 4], [0, 4, 2, 6]],
        names: ["A", "B", "C", "D", "E", "F", "G", "H"]
      }]
    },
    labels: [["A1", "B1", "8"], ["B", "C", "2"], ["C", "D", "3"], ["D", "E", "2"], ["E", "F", "3"], ["F", "G", "2"], ["A", "A1", "3"]],
    hint: "Ступенчатое тело удобно разрезать на три прямоугольных параллелепипеда и сложить их объёмы.",
    sol: [
      "Ступени: 8 · 2 · 3 = 48, 5 · 2 · 3 = 30 и 2 · 2 · 3 = 12.",
      "V = 48 + 30 + 12 = 90."
    ]
  },
  {
    id: "sost-04", topic: "Составные тела", group: "поверхность",
    cond: "Все двугранные углы многогранника, изображённого на рисунке, прямые. Числа на рисунке — длины рёбер. Найдите площадь поверхности многогранника.",
    ans: "112",
    scene: {
      bodies: [{
        kind: "lshape", h: 2,
        footprint: [[0, 0], [7, 0], [7, 5], [5, 5], [5, 2], [2, 2], [2, 5], [0, 5]],
        faceRects: [[0, 0, 7, 2], [0, 2, 2, 5], [5, 2, 7, 5]],
        names: ["A", "B", "C", "D", "E", "F", "G", "H"]
      }]
    },
    labels: [["A", "B", "7"], ["B", "C", "5"], ["C", "D", "2"], ["D", "E", "3"], ["E", "F", "3"], ["F", "G", "3"], ["A", "A1", "2"]],
    hint: "Верхняя и нижняя грани равны основанию, а боковые грани разворачиваются в прямоугольник высоты тела с длиной, равной периметру основания.",
    sol: [
      "Основание — прямоугольник 7 × 5 с вырезом 3 × 3: S = 35 − 9 = 26.",
      "Периметр основания: 7 + 5 + 2 + 3 + 3 + 3 + 2 + 5 = 30.",
      "S = 2 · 26 + 30 · 2 = 52 + 60 = 112."
    ]
  },
  {
    id: "sost-06", topic: "Составные тела", group: "диагональ",
    cond: "На рисунке изображён многогранник, все двугранные углы которого прямые. Числа на рисунке — длины рёбер. Найдите квадрат расстояния между вершинами B и F1.",
    ans: "50",
    scene: {
      bodies: [{
        kind: "lshape", h: 3,
        footprint: [[0, 0], [4, 0], [4, 2], [2, 2], [2, 5], [0, 5]],
        faceRects: [[0, 0, 4, 2], [0, 2, 2, 5]],
        names: ["A", "B", "C", "D", "E", "F"]
      }]
    },
    labels: [["A", "B", "4"], ["B", "C", "2"], ["D", "E", "3"], ["E", "F", "2"], ["A", "A1", "3"], ["B", "F1", "?"]],
    construct: {
      segments: [["B", "F"], ["B", "F1", "?"]],
      fills: [["B", "F", "F1"]]
    },
    hint: "Сначала найдите квадрат отрезка BF в плоскости основания (отрезок AF соберите из данных рёбер), затем поднимитесь по вертикальному ребру FF₁.",
    sol: [
      "AF = 2 + 3 = 5, поэтому BF² = AB² + AF² = 16 + 25 = 41.",
      "Треугольник BFF₁ прямоугольный: BF₁² = BF² + FF₁² = 41 + 9 = 50."
    ]
  },
  {
    id: "sost-07", topic: "Составные тела", group: "угол",
    cond: "На рисунке изображён многогранник, все двугранные углы которого прямые. Числа на рисунке — длины рёбер. Найдите тангенс угла F1EF.",
    ans: "0,75",
    scene: {
      bodies: [{
        kind: "lshape", h: 6,
        footprint: [[0, 0], [11, 0], [11, 3], [8, 3], [8, 7], [0, 7]],
        faceRects: [[0, 0, 11, 3], [0, 3, 8, 7]],
        names: ["A", "B", "C", "D", "E", "F"]
      }]
    },
    labels: [["E", "F", "8"], ["F", "F1", "6"]],
    construct: {
      segments: [["E", "F1"]],
      fills: [["E", "F", "F1"]]
    },
    hint: "Угол F₁EF лежит в вертикальной грани EFF₁E₁: треугольник EFF₁ прямоугольный с прямым углом при вершине F.",
    sol: [
      "Ребро FF₁ вертикально, поэтому треугольник EFF₁ прямоугольный.",
      "tg∠F₁EF = FF₁/EF = 6/8 = 0,75."
    ]
  }
];

/* Старый банк, тема «Призма»: 14 задач открытого банка задания 3
   (Решу ЕГЭ; id — номер задачи на math-ege.sdamgia.ru/problem?id=…).
   Перенесены ДОСЛОВНО из опубликованной линейки
   trainers/ege-profile-stereometry-3d/js/data.js (коммит 4dc0592):
   поля, числа, тексты и порядок не менялись — под этими id у учеников
   записан прогресс (stereo3.status), а позиция задачи в теме —
   в stereo3.last.<тема>. Сцены строит engine-legacy.js (scene.prims / dims),
   общие константы (SQ2, SQ3, SQ5, HALF_PTS, HALF_FACES) — тоже там.
   Не переименовывать и не переставлять.
   Исключения (решение владельца 24.09.2026, только линейка курса):
     у 639940, 245340, 27062, 324457 исправлен чертёж (scene / labels / construct);
     у 27106, 27107, 27112, 27153, 639940 добавлено поле unit (длина условия на единицу сцены: сцена в масштабе k ≠ 1).
   id, условия, ответы, подсказки, решения и порядок — прежние;
   список и причины — legacy-parity.js. */
const P_LEGACY_PRIZ = [
  /* ================= ПРИЗМА ================= */
  { id:"27057", topic:"Призма", ans:"300",
    cond:"Найдите площадь боковой поверхности правильной шестиугольной призмы, сторона основания которой равна 5, а высота — 10.",
    scene:{ prims:[{kind:"prism",n:6,a:5,h:10}] }, labels:[["A","B","5"],["A","A1","10"]],
    hint:"Sбок = периметр основания · высота.",
    sol:["Sбок = P·h = 6·5·10 = 300."] },
  { id:"27062", topic:"Призма", ans:"248",
    cond:"Найдите площадь поверхности прямой призмы, в основании которой лежит ромб с диагоналями, равными 6 и 8, а боковое ребро призмы равно 10.",
    scene:{ prims:[{kind:"prism_rh",d1:8,d2:6,h:10}], segs:[["A","C"],["B","D"]] },
    labels:[["A","A1","10"],["A","C","8"],["B","D","6"]],
    construct:{ points:{O:["mid","A","C"]}, fills:[["A","O","B"]] },
    hint:"Сторона ромба — гипотенуза с катетами 3 и 4. Sосн = ½d₁d₂.",
    sol:["Сторона ромба: √(3² + 4²) = 5; Sосн = ½·6·8 = 24.","S = 2·24 + 4·5·10 = 48 + 200 = 248."] },
  { id:"27063", topic:"Призма", ans:"12",
    cond:"Найдите боковое ребро правильной четырёхугольной призмы, если сторона её основания равна 20, а площадь поверхности равна 1760.",
    scene:{ prims:[{kind:"prism",n:4,a:20,h:12}] }, labels:[["A","B","20"],["A","A1","?"]],
    hint:"S = 2a² + 4a·h.",
    sol:["2·400 + 4·20·h = 1760 ⇒ 80h = 960 ⇒ h = 12."] },
  { id:"27082", topic:"Призма", ans:"120",
    cond:"Основанием прямой треугольной призмы служит прямоугольный треугольник с катетами 6 и 8, боковое ребро равно 5. Найдите объём призмы.",
    scene:{ prims:[{kind:"prism_rt",l1:6,l2:8,h:5}] },
    labels:[["A","B","6"],["A","C","8"],["A","A1","5"]],
    hint:"V = Sосн·h, Sосн = ½·6·8.",
    sol:["V = ½·6·8·5 = 120."] },
  { id:"27083", topic:"Призма", ans:"4",
    cond:"Основанием прямой треугольной призмы служит прямоугольный треугольник с катетами 3 и 5. Объём призмы равен 30. Найдите её боковое ребро.",
    scene:{ prims:[{kind:"prism_rt",l1:3,l2:5,h:4}] },
    labels:[["A","B","3"],["A","C","5"],["A","A1","?"]],
    hint:"h = V/Sосн.",
    sol:["Sосн = ½·3·5 = 7,5.","h = 30/7,5 = 4."] },
  { id:"27106", topic:"Призма", ans:"8",
    cond:"Через среднюю линию основания треугольной призмы, объём которой равен 32, проведена плоскость, параллельная боковому ребру. Найдите объём отсечённой треугольной призмы.",
    scene:{ prims:[{kind:"prism",n:3,a:4,h:4.6}] },
    unit:Math.cbrt(32/(18.4*SQ3)),   /* длина условия на единицу сцены: V = 32, на сцене a = 4, h = 4,6: V = 18,4√3 */
    construct:{ points:{M:["mid","A","B"],N:["mid","A","C"],M1:["mid","A1","B1"],N1:["mid","A1","C1"]},
      segments:[["M","N"],["M1","N1"]], fills:[["M","N","N1","M1"]],
      solid:[["A","M","N"],["A1","M1","N1"],["A","M","M1","A1"],["A","N","N1","A1"]] },
    hint:"Отсечённый треугольник подобен основанию с коэффициентом ½ ⇒ его площадь в 4 раза меньше.",
    sol:["Средняя линия отсекает треугольник, подобный основанию с k = ½: Sмал = Sосн/4.","Высота та же ⇒ V = 32/4 = 8."] },
  { id:"27107", topic:"Призма", ans:"20",
    cond:"Через среднюю линию основания треугольной призмы проведена плоскость, параллельная боковому ребру. Найдите объём этой призмы, если объём отсечённой треугольной призмы равен 5.",
    scene:{ prims:[{kind:"prism",n:3,a:4,h:4.6}] },
    unit:Math.cbrt(5/(4.6*SQ3)),   /* длина условия на единицу сцены: Vотсеч = 5, на сцене отсечённая призма: V = 4,6√3 */
    construct:{ points:{M:["mid","A","B"],N:["mid","A","C"],M1:["mid","A1","B1"],N1:["mid","A1","C1"]},
      fills:[["M","N","N1","M1"]],
      solid:[["A","M","N"],["A1","M1","N1"],["A","M","M1","A1"],["A","N","N1","A1"]] },
    hint:"Объём отсечённой призмы — четверть объёма исходной.",
    sol:["Vотсеч = V/4 ⇒ V = 5·4 = 20."] },
  { id:"27112", topic:"Призма", ans:"4",
    cond:"От треугольной призмы, объём которой равен 6, отсечена треугольная пирамида плоскостью, проходящей через сторону одного основания и противоположную вершину другого основания. Найдите объём оставшейся части.",
    scene:{ prims:[{kind:"prism",n:3,a:4,h:3.5}] },
    unit:Math.cbrt(6/(14*SQ3)),   /* длина условия на единицу сцены: V = 6, на сцене a = 4, h = 3,5: V = 14√3 */
    construct:{ segments:[["A1","B"],["A1","C"]],
      solid:[["A","B","C"],["A1","A","B"],["A1","B","C"],["A1","A","C"]] },
    hint:"Отсечённая пирамида имеет то же основание и высоту, что и призма ⇒ её объём V/3.",
    sol:["Vпирамиды = ⅓·Vпризмы = 2.","Остаток: 6 − 2 = 4."] },
  { id:"27132", topic:"Призма", ans:"288",
    cond:"Основанием прямой треугольной призмы служит прямоугольный треугольник с катетами 6 и 8, высота призмы равна 10. Найдите площадь её поверхности.",
    scene:{ prims:[{kind:"prism_rt",l1:6,l2:8,h:10}] },
    labels:[["A","B","6"],["A","C","8"],["A","A1","10"]],
    construct:{ segments:[["B","C","?"]] },
    hint:"Гипотенуза равна 10. S = 2Sосн + P·h.",
    sol:["Гипотенуза: √(36+64) = 10; Sосн = 24.","S = 2·24 + (6+8+10)·10 = 48 + 240 = 288."] },
  { id:"27153", topic:"Призма", ans:"16",
    cond:"Через среднюю линию основания треугольной призмы проведена плоскость, параллельная боковому ребру. Площадь боковой поверхности отсечённой треугольной призмы равна 8. Найдите площадь боковой поверхности исходной призмы.",
    scene:{ prims:[{kind:"prism",n:3,a:4,h:4}] },
    unit:1/SQ3,   /* длина условия на единицу сцены: Sбок отсеч = 8, на сцене 24 */
    construct:{ points:{M:["mid","A","B"],N:["mid","A","C"],M1:["mid","A1","B1"],N1:["mid","A1","C1"]},
      fills:[["M","N","N1","M1"]],
      solid:[["A","M","N"],["A1","M1","N1"],["A","M","M1","A1"],["A","N","N1","A1"]] },
    hint:"Периметр отсечённого треугольника вдвое меньше периметра основания.",
    sol:["Стороны отсечённого основания вдвое меньше ⇒ Sбок отсеч = Sбок/2.","Sбок = 8·2 = 16."] },
  { id:"245340", topic:"Призма", ans:"2",
    cond:"Найдите объём многогранника, вершинами которого являются точки A, B, C, A₁ правильной треугольной призмы ABCA₁B₁C₁, площадь основания которой равна 2, а боковое ребро равно 3.",
    scene:{ prims:[{kind:"prism",n:3,a:Math.sqrt(8/SQ3),h:3}] }, labels:[["A","A1","3"]],
    construct:{ segments:[["A1","B"],["A1","C"]],
      solid:[["A","B","C"],["A1","A","B"],["A1","B","C"],["A1","A","C"]] },
    hint:"Пирамида A₁ABC: основание ABC, высота AA₁.",
    sol:["V = ⅓·Sосн·h = ⅓·2·3 = 2."] },
  { id:"639940", topic:"Призма", ans:"27",
    cond:"Кусок льда представляет собой правильную шестиугольную призму высотой 18 см. Его планируют расплавить и вновь заморозить так, чтобы получилась правильная треугольная призма, сторона основания которой в 2 раза больше стороны основания исходной. Чему будет равна её высота? Ответ дайте в сантиметрах.",
    scene:{ prims:[{kind:"prism",n:6,a:1,h:2.2},{kind:"prism",n:3,a:2,h:3.3,px:"2",ghost:true,hideLabels:true,at:[3.4,0,0]}] },
    unit:90/11,   /* длина условия на единицу сцены: высота 18 см на сцене 2,2 */
    hint:"Приравняйте объёмы: (3√3/2)a²·18 = (√3/4)(2a)²·h.",
    sol:["Vльда = (3√3/2)a²·18; Vновой = (√3/4)·4a²·h = √3·a²·h.","(3√3/2)·18 = √3·h ⇒ h = 27 см."] },
  { id:"324457", topic:"Призма", ans:"120",
    cond:"В правильной четырёхугольной призме ABCDA₁B₁C₁D₁ ребро AA₁ равно 15, а диагональ BD₁ равна 17. Найдите площадь сечения призмы плоскостью, проходящей через точки A, A₁ и C.",
    scene:{ prims:[{kind:"prism",n:4,a:8/SQ2,h:15}], segs:[["B","D1"]] },
    labels:[["A","A1","15"],["B","D1","17"]],
    construct:{ segments:[["B","D"],["A","C","?"]], fills:[["A","C","C1","A1"]] },
    hint:"Из △BDD₁ найдите BD; в квадрате AC = BD. Сечение — прямоугольник ACC₁A₁.",
    sol:["BD = √(17² − 15²) = √64 = 8; AC = BD = 8.","S = AC·AA₁ = 8·15 = 120."] },
  { id:"509576", topic:"Призма", ans:"240",
    cond:"Основанием прямой треугольной призмы служит прямоугольный треугольник с катетами 5 и 12, боковое ребро призмы равно 8. Найдите площадь боковой поверхности призмы.",
    scene:{ prims:[{kind:"prism_rt",l1:5,l2:12,h:8}] },
    labels:[["A","B","5"],["A","C","12"],["A","A1","8"]],
    construct:{ segments:[["B","C","?"]] },
    hint:"Гипотенуза равна 13. Sбок = P·h.",
    sol:["Гипотенуза: √(25 + 144) = 13.","Sбок = (5 + 12 + 13)·8 = 240."] },
];

const P_PRIZ = [
  {
    id: "priz-01", topic: "Призма", group: "объём",
    cond: "Сторона основания правильной четырёхугольной призмы равна 5, а высота призмы равна 8. Найдите объём призмы.",
    ans: "200",
    scene: { bodies: [{ kind: "box", a: 5, b: 5, h: 8 }] },
    labels: [["A", "B", "5"], ["B", "B1", "8"]],
    hint: "Объём призмы равен произведению площади основания на высоту. Основание — квадрат.",
    sol: [
      "Площадь основания: 5² = 25.",
      "V = S·h = 25 · 8 = 200."
    ]
  },
  {
    id: "priz-02", topic: "Призма", group: "объём",
    cond: "Объём правильной четырёхугольной призмы равен 192, сторона её основания равна 4. Найдите высоту призмы.",
    ans: "12",
    scene: { bodies: [{ kind: "box", a: 4, b: 4, h: 12 }] },
    labels: [["A", "B", "4"], ["B", "B1", "?"]],
    hint: "Выразите высоту из формулы объёма призмы: h = V/S, где S — площадь квадратного основания.",
    sol: [
      "Площадь основания: 4² = 16.",
      "h = V/S = 192/16 = 12."
    ]
  },
  /* priz-03 убрана 24.09.2026: дубль задачи 27082 старого банка (problems-legacy-priz.js) — та же модель, те же числа. */
  {
    id: "priz-04", topic: "Призма", group: "объём",
    cond: "Площадь основания прямой призмы равна 15, а высота призмы равна 7. Найдите объём призмы.",
    ans: "105",
    scene: { bodies: [{ kind: "prism", base: [[0, 0], [5, 0], [0, -6]], h: 7 }] },
    labels: [["B", "B1", "7"]],
    givenFaces: [{ face: ["A", "B", "C"], text: "S = 15" }],
    hint: "Объём любой прямой призмы равен произведению площади основания на высоту.",
    sol: [
      "По формуле объёма призмы V = S·h.",
      "V = 15 · 7 = 105."
    ]
  },
  {
    id: "priz-05", topic: "Призма", group: "поверхность",
    cond: "Катеты прямоугольного треугольника, лежащего в основании прямой призмы, равны 3 и 4, высота призмы равна 10. Найдите площадь полной поверхности призмы.",
    ans: "132",
    scene: { bodies: [{ kind: "prism", base: [[0, 0], [3, 0], [0, -4]], h: 10 }] },
    labels: [["A", "B", "3"], ["A", "C", "4"], ["B", "B1", "10"]],
    hint: "Найдите гипотенузу по теореме Пифагора, затем сложите площади двух оснований и трёх боковых граней.",
    sol: [
      "Гипотенуза основания: √(3² + 4²) = 5.",
      "Два основания: 2 · ½ · 3 · 4 = 12.",
      "Боковая поверхность: (3 + 4 + 5) · 10 = 120.",
      "S = 12 + 120 = 132."
    ]
  },
  {
    id: "priz-07", topic: "Призма", group: "поверхность",
    cond: "Сторона основания правильной шестиугольной призмы равна 4, высота призмы равна 10. Найдите площадь боковой поверхности призмы.",
    ans: "240",
    scene: { bodies: [{ kind: "prism", n: 6, side: 4, h: 10 }] },
    labels: [["A", "F", "4"], ["E", "E1", "10"]],
    hint: "Боковая поверхность состоит из шести равных прямоугольников: периметр основания умножьте на высоту.",
    sol: [
      "Периметр основания: 6 · 4 = 24.",
      "Sбок = P·h = 24 · 10 = 240."
    ]
  },
  {
    id: "priz-09", topic: "Призма", group: "рёбра",
    cond: "Найдите сумму длин всех рёбер правильной шестиугольной призмы, если сторона её основания равна 3, а высота равна 7.",
    ans: "78",
    scene: { bodies: [{ kind: "prism", n: 6, side: 3, h: 7 }] },
    labels: [["A", "F", "3"], ["E", "E1", "7"]],
    hint: "У шестиугольной призмы двенадцать рёбер в основаниях и шесть боковых рёбер.",
    sol: [
      "Рёбра двух оснований: 12 · 3 = 36.",
      "Боковые рёбра: 6 · 7 = 42.",
      "Сумма: 36 + 42 = 78."
    ]
  },
  {
    id: "priz-10", topic: "Призма", group: "рёбра",
    cond: "Сторона основания правильной треугольной призмы равна 4, боковое ребро равно 6. Найдите сумму длин всех рёбер призмы.",
    ans: "42",
    scene: { bodies: [{ kind: "prism", n: 3, side: 4, h: 6, rot: 2.0 }] },
    labels: [["A", "B", "4"], ["C", "C1", "6"]],
    hint: "Сосчитайте рёбра: по три в каждом основании и три боковых.",
    sol: [
      "Рёбра двух оснований: 6 · 4 = 24.",
      "Боковые рёбра: 3 · 6 = 18.",
      "Сумма: 24 + 18 = 42."
    ]
  },
  {
    id: "priz-11", topic: "Призма", group: "диагональ",
    cond: "Сторона основания правильной четырёхугольной призмы равна 4, высота призмы равна 6. Найдите квадрат диагонали призмы.",
    ans: "68",
    scene: { bodies: [{ kind: "box", a: 4, b: 4, h: 6 }] },
    labels: [["A", "B", "4"], ["C", "C1", "6"], ["A", "C1", "?"]],
    construct: {
      segments: [["A", "C"], ["A", "C1", "?"]],
      fills: [["A", "C", "C1"]]
    },
    hint: "Диагональ призмы — гипотенуза прямоугольного треугольника, катеты которого — диагональ основания и боковое ребро.",
    sol: [
      "Диагональ основания: AC² = 4² + 4² = 32.",
      "Треугольник ACC₁ прямоугольный: AC₁² = AC² + CC₁² = 32 + 36 = 68."
    ]
  },
  {
    id: "priz-12", topic: "Призма", group: "изменение величин",
    cond: "Высоту призмы увеличили в 4 раза, а основание оставили прежним. Во сколько раз увеличился объём призмы?",
    ans: "4",
    scene: {
      bodies: [
        { kind: "box", a: 3, b: 3, h: 2 },
        { kind: "box", a: 3, b: 3, h: 8, at: [5, 0, 0], names: ["E", "F", "G", "H"], ghost: true, hideLabels: true }
      ]
    },
    labels: [["A", "A1", "h"], ["E", "E1", "4h"]],
    hint: "Объём призмы прямо пропорционален высоте: V = S·h.",
    sol: [
      "V = S·h, а площадь основания не изменилась.",
      "Высота выросла в 4 раза — объём тоже вырос в 4 раза."
    ]
  },
  {
    id: "priz-13", topic: "Призма", group: "изменение величин",
    cond: "Высоту призмы уменьшили в 3 раза, не меняя её основания. Во сколько раз уменьшился объём призмы?",
    ans: "3",
    scene: {
      bodies: [
        { kind: "box", a: 3, b: 3, h: 6 },
        { kind: "box", a: 3, b: 3, h: 2, at: [5, 0, 0], names: ["E", "F", "G", "H"], ghost: true, hideLabels: true }
      ]
    },
    labels: [["A", "A1", "h"], ["E", "E1", "h/3"]],
    hint: "При неизменном основании объём прямо пропорционален высоте.",
    sol: [
      "V = S·h, площадь основания прежняя.",
      "Высота уменьшилась в 3 раза — объём уменьшился в 3 раза."
    ]
  },
  {
    id: "priz-14", topic: "Призма", group: "изменение величин",
    cond: "Сторона основания правильной четырёхугольной призмы равна 3, высота призмы равна 5. Высоту увеличили на 2, не меняя основания. На сколько увеличилась площадь боковой поверхности призмы?",
    ans: "24",
    scene: {
      bodies: [
        { kind: "box", a: 3, b: 3, h: 5 },
        { kind: "box", a: 3, b: 3, h: 2, at: [0, 5, 0], names: ["K", "L", "M", "N"], ghost: true, hideLabels: true }
      ]
    },
    labels: [["A", "B", "3"], ["A", "A1", "5"], ["K", "K1", "2"]],
    construct: { fills: [["K", "L", "L1", "K1"], ["L", "M", "M1", "L1"], ["M", "N", "N1", "M1"], ["N", "K", "K1", "N1"]] },
    hint: "К боковой поверхности добавился пояс из четырёх одинаковых прямоугольников высотой 2.",
    sol: [
      "Прибавка равна P · Δh, где P — периметр основания.",
      "P = 4 · 3 = 12, прибавка: 12 · 2 = 24."
    ]
  },
  {
    id: "priz-15", topic: "Призма", group: "поверхность",
    cond: "Плоскость, проходящая через среднюю линию основания треугольной призмы параллельно её боковому ребру, отсекает от призмы меньшую треугольную призму. Площадь боковой поверхности отсечённой призмы равна 14. Найдите площадь боковой поверхности исходной призмы.",
    ans: "28",
    scene: { bodies: [{ kind: "prism", base: [[0, 0], [2, 0], [1, Math.sqrt(21) / 2]], h: 4 }] },
    construct: {
      points: { "M": ["mid", "A", "C"], "N": ["mid", "B", "C"], "M1": ["mid", "A1", "C1"], "N1": ["mid", "B1", "C1"] },
      segments: [["M", "N"], ["M1", "N1"]],
      fills: [["M", "N", "N1", "M1"]]
    },
    hint: "Каждая сторона основания отсечённой призмы вдвое меньше соответствующей стороны исходного основания, а высота у призм общая.",
    sol: [
      "MN — средняя линия, поэтому стороны треугольника MNC вдвое меньше сторон ABC.",
      "Периметр основания отсечённой призмы вдвое меньше, значит и Sбок = P·h вдвое меньше.",
      "Sбок исходной призмы: 2·14 = 28."
    ]
  },
  {
    id: "priz-16", topic: "Призма", group: "пирамида в призме",
    cond: "В правильной треугольной призме ABCA1B1C1 площадь основания равна 8, а боковое ребро равно 6. Найдите объём пирамиды с вершинами A, B, C, A1.",
    ans: "16",
    scene: { bodies: [{ kind: "prism", n: 3, side: Math.sqrt(32 / Math.sqrt(3)), h: 6, rot: 2.0 }] },
    labels: [["C", "C1", "6"]],
    givenFaces: [{ face: ["A", "B", "C"], text: "S = 8" }],
    construct: {
      segments: [["A1", "B"], ["A1", "C"]],
      solid: [["A1", "B", "C"]]
    },
    hint: "Основание пирамиды ABCA₁ совпадает с основанием призмы, а высота из вершины A₁ равна боковому ребру.",
    sol: [
      "Ребро A₁A перпендикулярно плоскости ABC, поэтому высота пирамиды равна 6.",
      "V = ⅓·S·h = ⅓·8·6 = 16."
    ]
  }
];

/* Старый банк, тема «Пирамида»: 16 задач открытого банка задания 3
   (Решу ЕГЭ; id — номер задачи на math-ege.sdamgia.ru/problem?id=…).
   Перенесены ДОСЛОВНО из опубликованной линейки
   trainers/ege-profile-stereometry-3d/js/data.js (коммит 4dc0592):
   поля, числа, тексты и порядок не менялись — под этими id у учеников
   записан прогресс (stereo3.status), а позиция задачи в теме —
   в stereo3.last.<тема>. Сцены строит engine-legacy.js (scene.prims / dims),
   общие константы (SQ2, SQ3, SQ5, HALF_PTS, HALF_FACES) — тоже там.
   Не переименовывать и не переставлять.
   Исключения (решение владельца 24.09.2026, только линейка курса):
     у 901 исправлен чертёж (scene / labels / construct);
     у 509573 добавлено поле unit (длина условия на единицу сцены: сцена в масштабе k ≠ 1).
   id, условия, ответы, подсказки, решения и порядок — прежние;
   список и причины — legacy-parity.js. */
const P_LEGACY_PIR = [
  /* ================= ПИРАМИДА ================= */
  { id:"901", topic:"Пирамида", ans:"9",
    cond:"В правильной треугольной пирамиде SABC с вершиной S биссектрисы треугольника ABC пересекаются в точке O. Площадь треугольника ABC равна 2; объём пирамиды равен 6. Найдите длину отрезка OS.",
    scene:{ prims:[{kind:"pyramid",n:3,a:Math.sqrt(8/SQ3),h:9}] },
    construct:{ segments:[["S","O","?"]] },
    hint:"OS — высота пирамиды: V = ⅓·S·OS.",
    sol:["OS = 3V/S = 3·6/2 = 9."] },
  { id:"912", topic:"Пирамида", ans:"5",
    cond:"В правильной четырёхугольной пирамиде SABCD точка O — центр основания, S — вершина, SB = 13, AC = 24. Найдите длину отрезка SO.",
    scene:{ prims:[{kind:"pyramid",n:4,a:24/SQ2,h:5}] },
    construct:{ segments:[["A","C","24"],["S","B","13"],["S","O","?"]] },
    hint:"△SOB прямоугольный: OB = AC/2.",
    sol:["OB = 24/2 = 12.","SO = √(SB² − OB²) = √(169 − 144) = 5."] },
  { id:"915", topic:"Пирамида", ans:"15",
    cond:"В правильной четырёхугольной пирамиде SABCD точка O — центр основания, S — вершина, SO = 12, BD = 18. Найдите боковое ребро SB.",
    scene:{ prims:[{kind:"pyramid",n:4,a:18/SQ2,h:12}] },
    construct:{ segments:[["B","D","18"],["S","O","12"],["S","B","?"]] },
    hint:"OB = BD/2; △SOB прямоугольный.",
    sol:["OB = 9.","SB = √(12² + 9²) = √225 = 15."] },
  { id:"27069", topic:"Пирамида", ans:"340",
    cond:"Стороны основания правильной четырёхугольной пирамиды равны 10, боковые рёбра равны 13. Найдите площадь поверхности этой пирамиды.",
    scene:{ prims:[{kind:"pyramid",n:4,a:10,h:Math.sqrt(119)}] },
    labels:[["A","B","10"]],
    construct:{ points:{M:["mid","B","C"]}, segments:[["S","B","13"],["S","M","?"]] },
    hint:"Апофема SM = √(13² − 5²). S = a² + 4·(½·a·SM).",
    sol:["Апофема: SM = √(169 − 25) = 12.","Sбок = 4·½·10·12 = 240; S = 100 + 240 = 340."] },
  { id:"27070", topic:"Пирамида", ans:"360",
    cond:"Стороны основания правильной шестиугольной пирамиды равны 10, боковые рёбра равны 13. Найдите площадь боковой поверхности этой пирамиды.",
    scene:{ prims:[{kind:"pyramid",n:6,a:10,h:Math.sqrt(69)}] },
    labels:[["A","B","10"]],
    construct:{ points:{M:["mid","A","B"]}, segments:[["S","A","13"],["S","M","?"]] },
    hint:"Апофема боковой грани: √(13² − 5²) = 12.",
    sol:["Апофема грани: √(169 − 25) = 12.","Sбок = 6·½·10·12 = 360."] },
  { id:"27086", topic:"Пирамида", ans:"4",
    cond:"Основанием пирамиды является прямоугольник со сторонами 3 и 4. Её объём равен 16. Найдите высоту этой пирамиды.",
    scene:{ prims:[{kind:"pyramid_rect",a:3,b:4,h:4}] },
    labels:[["A","B","3"],["B","C","4"]],
    construct:{ segments:[["S","O","?"]] },
    hint:"V = ⅓·S·h ⇒ h = 3V/S.",
    sol:["h = 3·16/(3·4) = 4."] },
  { id:"27109", topic:"Пирамида", ans:"256",
    cond:"В правильной четырёхугольной пирамиде высота равна 6, боковое ребро равно 10. Найдите её объём.",
    scene:{ prims:[{kind:"pyramid",n:4,a:Math.sqrt(128),h:6}] },
    construct:{ segments:[["S","O","6"],["S","B","10"],["B","D","?"]] },
    hint:"Полдиагонали основания: √(10² − 6²) = 8 ⇒ a² = d²/2.",
    sol:["OB = √(100 − 36) = 8 ⇒ диагональ 16; a² = 16²/2 = 128.","V = ⅓·128·6 = 256."] },
  { id:"27111", topic:"Пирамида", ans:"4,5",
    cond:"Боковые рёбра треугольной пирамиды взаимно перпендикулярны, каждое из них равно 3. Найдите объём пирамиды.",
    scene:{ prims:[{kind:"box",a:3,b:3,c:3}] },
    labels:[["A","B","3"],["A","D","3"],["A","A1","3"]],
    construct:{ segments:[["B","D"],["B","A1"],["D","A1"]],
      solid:[["A","B","D"],["A","B","A1"],["A","D","A1"],["B","D","A1"]] },
    hint:"Возьмите за основание прямоугольный треугольник из двух рёбер, третье ребро — высота.",
    sol:["Основание — прямоугольный △ с катетами 3 и 3: S = 4,5; высота 3.","V = ⅓·4,5·3 = 4,5."] },
  { id:"27114", topic:"Пирамида", ans:"3",
    cond:"Объём правильной четырёхугольной пирамиды SABCD равен 12. Точка E — середина ребра SB. Найдите объём треугольной пирамиды EABC.",
    scene:{ prims:[{kind:"pyramid",n:4,a:3,h:4}] },
    construct:{ points:{E:["mid","S","B"]}, segments:[["E","A"],["E","C"]],
      solid:[["A","B","C"],["E","A","B"],["E","B","C"],["E","A","C"]] },
    hint:"Основание ABC — половина ABCD, высота точки E — половина высоты пирамиды.",
    sol:["S(ABC) = ½S(ABCD); высота E над основанием = h/2.","V(EABC) = 12·½·½ = 3."] },
  { id:"27155", topic:"Пирамида", ans:"96",
    cond:"Найдите площадь поверхности правильной четырёхугольной пирамиды, стороны основания которой равны 6 и высота равна 4.",
    scene:{ prims:[{kind:"pyramid",n:4,a:6,h:4}] },
    labels:[["A","B","6"]],
    construct:{ points:{M:["mid","B","C"]}, segments:[["S","O","4"],["O","M"],["S","M","?"]] },
    hint:"Апофема: √(h² + (a/2)²) = 5.",
    sol:["Апофема: √(16 + 9) = 5.","S = 36 + 4·½·6·5 = 36 + 60 = 96."] },
  { id:"27176", topic:"Пирамида", ans:"24",
    cond:"Найдите объём пирамиды, высота которой равна 6, а основание — прямоугольник со сторонами 3 и 4.",
    scene:{ prims:[{kind:"pyramid_rect",a:3,b:4,h:6}] },
    labels:[["A","B","3"],["B","C","4"]],
    construct:{ segments:[["S","O","6"]] },
    hint:"V = ⅓·S·h.",
    sol:["V = ⅓·3·4·6 = 24."] },
  { id:"27178", topic:"Пирамида", ans:"13",
    cond:"В правильной четырёхугольной пирамиде высота равна 12, объём равен 200. Найдите боковое ребро этой пирамиды.",
    scene:{ prims:[{kind:"pyramid",n:4,a:Math.sqrt(50),h:12}] },
    construct:{ segments:[["S","O","12"],["B","D","?"],["S","B","?"]] },
    hint:"a² = 3V/h = 50 ⇒ полдиагонали = 5.",
    sol:["a² = 3·200/12 = 50 ⇒ (d/2)² = a²/2 = 25, d/2 = 5.","SB = √(144 + 25) = 13."] },
  { id:"509991", topic:"Пирамида", ans:"15",
    cond:"В правильной шестиугольной пирамиде боковое ребро равно 17, а сторона основания равна 8. Найдите высоту пирамиды.",
    scene:{ prims:[{kind:"pyramid",n:6,a:8,h:15}] },
    labels:[["A","B","8"]],
    construct:{ segments:[["S","A","17"],["O","A","?"],["S","O","?"]] },
    hint:"В правильном шестиугольнике OA = стороне основания.",
    sol:["OA = 8 (радиус равен стороне).","h = √(17² − 8²) = √225 = 15."] },
  { id:"656074", topic:"Пирамида", ans:"1008",
    cond:"Стороны основания правильной шестиугольной пирамиды равны 14, боковые рёбра равны 25. Найдите площадь боковой поверхности этой пирамиды.",
    scene:{ prims:[{kind:"pyramid",n:6,a:14,h:Math.sqrt(429)}] },
    labels:[["A","B","14"]],
    construct:{ points:{M:["mid","A","B"]}, segments:[["S","A","25"],["S","M","?"]] },
    hint:"Апофема грани: √(25² − 7²) = 24.",
    sol:["Апофема: √(625 − 49) = 24.","Sбок = 6·½·14·24 = 1008."] },
  { id:"27184", topic:"Пирамида", ans:"2",
    cond:"Объём куба равен 12. Найдите объём четырёхугольной пирамиды, основанием которой является грань куба, а вершиной — центр куба.",
    scene:{ prims:[{kind:"box",a:2.29,b:2.29,c:2.29}] },
    construct:{ points:{T:["mid","A","C1"]},
      solid:[["A","B","C","D"],["T","A","B"],["T","B","C"],["T","C","D"],["T","D","A"]] },
    hint:"Куб разбивается на 6 таких пирамид.",
    sol:["Шесть пирамид с вершиной в центре куба и основаниями-гранями заполняют куб.","V = 12/6 = 2."] },
  { id:"509573", topic:"Пирамида", ans:"198",
    cond:"Найдите объём правильной шестиугольной пирамиды SABCDEF, если объём треугольной пирамиды SABC равен 33.",
    scene:{ prims:[{kind:"pyramid",n:6,a:3,h:3.4}] },
    unit:Math.cbrt(33/(2.55*SQ3)),   /* длина условия на единицу сцены: V(SABC) = 33, на сцене a = 3, h = 3,4: V = 2,55√3 */
    construct:{ segments:[["A","C"]],
      solid:[["A","B","C"],["S","A","B"],["S","B","C"],["S","A","C"]] },
    hint:"Площадь △ABC составляет 1/6 площади шестиугольника.",
    sol:["S(ABC) = ½a²·sin120° = (√3/4)a² = 1/6·S(ABCDEF).","V = 6·33 = 198."] },
];

const P_PIR = [
  {
    id: "pir-01", topic: "Пирамида", group: "объём",
    cond: "Сторона основания правильной четырёхугольной пирамиды равна 6, высота пирамиды равна 5. Найдите объём пирамиды.",
    ans: "60",
    scene: { bodies: [{ kind: "pyramid", n: 4, side: 6, h: 5 }] },
    labels: [["A", "D", "6"]],
    construct: {
      points: { "O": ["mid", "A", "C"] },
      segments: [["A", "C"], ["S", "O", "5"]]
    },
    hint: "Объём пирамиды равен трети произведения площади основания на высоту.",
    sol: [
      "Площадь основания: 6² = 36.",
      "V = ⅓·S·h = ⅓ · 36 · 5 = 60."
    ]
  },
  {
    id: "pir-03", topic: "Пирамида", group: "объём",
    cond: "Объём пирамиды равен 48, площадь её основания равна 18. Найдите высоту пирамиды.",
    ans: "8",
    scene: { bodies: [{ kind: "pyramid", base: [[0, 0], [6, 0], [6, 3], [0, 3]], apexAt: [3, 8, 1.5] }] },
    givenFaces: [{ face: ["A", "B", "C", "D"], text: "S = 18" }],
    construct: {
      points: { "O": ["mid", "A", "C"] },
      segments: [["A", "C"], ["S", "O", "?"]]
    },
    hint: "Из формулы V = ⅓·S·h выразите высоту: h = 3V/S.",
    sol: [
      "Из формулы объёма h = 3V/S.",
      "h = 3 · 48/18 = 8."
    ]
  },
  {
    id: "pir-04", topic: "Пирамида", group: "объём",
    cond: "Объём пирамиды равен 64, её высота равна 6. Найдите площадь основания пирамиды.",
    ans: "32",
    scene: { bodies: [{ kind: "pyramid", base: [[0, 0], [8, 0], [8, 4], [0, 4]], apexAt: [4, 6, 2] }] },
    givenFaces: [{ face: ["A", "B", "C", "D"], text: "S = ?" }],
    construct: {
      points: { "O": ["mid", "A", "C"] },
      segments: [["A", "C"], ["S", "O", "6"]]
    },
    hint: "Из формулы V = ⅓·S·h выразите площадь основания: S = 3V/h.",
    sol: [
      "Из формулы объёма S = 3V/h.",
      "S = 3 · 64/6 = 32."
    ]
  },
  {
    id: "pir-05", topic: "Пирамида", group: "апофема и ребро",
    cond: "Сторона основания правильной четырёхугольной пирамиды равна 6, высота пирамиды равна 4. Найдите апофему боковой грани пирамиды.",
    ans: "5",
    scene: { bodies: [{ kind: "pyramid", n: 4, side: 6, h: 4 }] },
    labels: [["A", "B", "6"]],
    construct: {
      points: { "O": ["mid", "A", "C"], "M": ["mid", "A", "D"] },
      segments: [["S", "M", "?"], ["S", "O", "4"]],
      fills: [["S", "O", "M"]]
    },
    hint: "Апофема — гипотенуза прямоугольного треугольника, катеты которого — высота пирамиды и половина стороны основания.",
    sol: [
      "OM — половина стороны основания: OM = 3.",
      "SM² = SO² + OM² = 16 + 9 = 25, SM = 5."
    ]
  },
  {
    id: "pir-06", topic: "Пирамида", group: "апофема и ребро",
    cond: "Высота правильной четырёхугольной пирамиды равна 12, диагональ основания равна 10. Найдите боковое ребро пирамиды.",
    ans: "13",
    scene: { bodies: [{ kind: "pyramid", n: 4, R: 5, h: 12 }] },
    labels: [["S", "B", "?"]],
    construct: {
      points: { "O": ["mid", "B", "D"] },
      segments: [["B", "D", "10"], ["S", "O", "12"]],
      fills: [["S", "O", "B"]]
    },
    hint: "Боковое ребро — гипотенуза прямоугольного треугольника с катетами: высота пирамиды и половина диагонали основания.",
    sol: [
      "BO — половина диагонали: BO = 5.",
      "SB² = SO² + BO² = 144 + 25 = 169, SB = 13."
    ]
  },
  {
    id: "pir-07", topic: "Пирамида", group: "поверхность",
    cond: "Сторона основания правильной четырёхугольной пирамиды равна 10, апофема боковой грани равна 13. Найдите площадь боковой поверхности пирамиды.",
    ans: "260",
    scene: { bodies: [{ kind: "pyramid", n: 4, side: 10, h: 12 }] },
    labels: [["A", "B", "10"]],
    construct: {
      points: { "M": ["mid", "A", "D"] },
      segments: [["S", "M", "13"]],
      fills: [["S", "A", "D"]]
    },
    hint: "Боковая поверхность — четыре равных треугольника, площадь каждого равна половине произведения стороны основания на апофему.",
    sol: [
      "Одна боковая грань: ½ · 10 · 13 = 65.",
      "Sбок = 4 · 65 = 260."
    ]
  },
  {
    id: "pir-08", topic: "Пирамида", group: "апофема и ребро",
    cond: "Боковое ребро правильной четырёхугольной пирамиды равно 8, диагональ основания равна 6. Найдите квадрат высоты пирамиды.",
    ans: "55",
    scene: { bodies: [{ kind: "pyramid", n: 4, R: 3, h: Math.sqrt(55) }] },
    labels: [["S", "D", "8"]],
    construct: {
      points: { "O": ["mid", "B", "D"] },
      segments: [["S", "O", "?"], ["B", "D", "6"]],
      fills: [["S", "O", "D"]]
    },
    hint: "Высота, половина диагонали основания и боковое ребро образуют прямоугольный треугольник.",
    sol: [
      "DO — половина диагонали: DO = 3.",
      "SO² = SD² − DO² = 64 − 9 = 55."
    ]
  },
  {
    id: "pir-09", topic: "Пирамида", group: "изменение величин",
    cond: "Высоту пирамиды увеличили в 4 раза, а основание оставили прежним. Во сколько раз увеличился объём пирамиды?",
    ans: "4",
    scene: {
      bodies: [
        { kind: "pyramid", n: 4, side: 4, h: 3, coordLabels: [{ t: "h", p: [0, 0, 0], q: [0, 3, 0] }] },
        { kind: "pyramid", n: 4, side: 4, h: 12, at: [7, 0, 0], names: ["E", "F", "G", "H"], apex: "T", ghost: true, hideLabels: true, coordLabels: [{ t: "4h", p: [7, 0, 0], q: [7, 12, 0] }] }
      ]
    },
    construct: {
      points: { "O": ["mid", "A", "C"], "Q": ["mid", "E", "G"] },
      segments: [["S", "O"], ["T", "Q"]]
    },
    hint: "Объём пирамиды прямо пропорционален высоте: V = ⅓·S·h.",
    sol: [
      "V = ⅓·S·h, а площадь основания не изменилась.",
      "Высота выросла в 4 раза — объём тоже вырос в 4 раза."
    ]
  },
  {
    id: "pir-10", topic: "Пирамида", group: "изменение величин",
    cond: "Все рёбра правильной четырёхугольной пирамиды увеличили в 3 раза. Во сколько раз увеличился объём пирамиды?",
    ans: "27",
    scene: {
      bodies: [
        { kind: "pyramid", n: 4, side: 3, h: 4, hideLabels: true },
        { kind: "pyramid", n: 4, side: 9, h: 12, at: [9, 0, 0], names: ["E", "F", "G", "H"], apex: "T", ghost: true, hideLabels: true }
      ]
    },
    labels: [["A", "D", "a"], ["E", "H", "3a"]],
    hint: "Новая пирамида подобна исходной. Объёмы подобных тел относятся как куб коэффициента подобия.",
    sol: [
      "Пирамида подобна исходной с коэффициентом 3.",
      "Объём увеличился в 3³ = 27 раз."
    ]
  },
  {
    id: "pir-11", topic: "Пирамида", group: "пирамида и призма",
    cond: "Объём правильной четырёхугольной призмы равен 54. Найдите объём пирамиды, основание которой совпадает с основанием призмы, а вершина — с центром верхнего основания призмы.",
    ans: "18",
    scene: {
      bodies: [
        { kind: "box", a: 3, b: 3, h: 6, ghost: true },
        { kind: "pyramid", base: [[0, 3], [3, 3], [3, 0], [0, 0]], apexAt: [1.5, 6, 1.5] }
      ]
    },
    construct: {
      points: { "O": ["mid", "A", "C"] },
      segments: [["S", "O"]]
    },
    hint: "У пирамиды и призмы общие основание и высота. Сравните формулы их объёмов.",
    sol: [
      "Основание и высота пирамиды те же, что у призмы.",
      "Vпир = ⅓·Vпризмы = 54/3 = 18."
    ]
  },
  {
    id: "pir-12", topic: "Пирамида", group: "пирамида и призма",
    cond: "Основание пирамиды совпадает с основанием куба, а вершина пирамиды — центр его верхней грани. Объём пирамиды равен 72. Найдите объём куба.",
    ans: "216",
    scene: {
      bodies: [
        { kind: "box", a: 6, b: 6, h: 6, ghost: true },
        { kind: "pyramid", base: [[0, 6], [6, 6], [6, 0], [0, 0]], apexAt: [3, 6, 3] }
      ]
    },
    construct: {
      points: { "O": ["mid", "A", "C"] },
      segments: [["S", "O"]]
    },
    hint: "Основание и высота у пирамиды и куба общие, поэтому объём куба втрое больше объёма пирамиды.",
    sol: [
      "Основание и высота пирамиды совпадают с основанием и высотой куба.",
      "Vкуба = 3 · 72 = 216."
    ]
  },
  {
    id: "pir-13", topic: "Пирамида", group: "объём",
    cond: "Площадь основания треугольной пирамиды равна 12, высота пирамиды равна 7. Найдите объём пирамиды.",
    ans: "28",
    scene: { bodies: [{ kind: "pyramid", base: [[0, 0], [6, 0], [0, 4]], apexAt: [3, 7, 2] }] },
    givenFaces: [{ face: ["A", "B", "C"], text: "S = 12" }],
    construct: {
      points: { "M": ["mid", "B", "C"] },
      segments: [["S", "M", "7"]]
    },
    hint: "Объём любой пирамиды — треть произведения площади основания на высоту.",
    sol: [
      "Объём пирамиды: V = ⅓·S·h.",
      "V = ⅓ · 12 · 7 = 28."
    ]
  },
  {
    id: "pir-14", topic: "Пирамида", group: "поверхность",
    cond: "Площадь боковой поверхности правильной четырёхугольной пирамиды равна 544, сторона основания равна 16. Найдите апофему пирамиды.",
    ans: "17",
    scene: { bodies: [{ kind: "pyramid", n: 4, side: 16, h: 15 }] },
    labels: [["A", "B", "16"]],
    construct: {
      points: { "M": ["mid", "A", "D"] },
      segments: [["S", "M", "?"]],
      fills: [["S", "A", "D"]]
    },
    hint: "Боковая поверхность равна половине произведения периметра основания на апофему. Выразите апофему.",
    sol: [
      "Периметр основания: 4 · 16 = 64.",
      "l = 2·Sбок/P = 2 · 544/64 = 17."
    ]
  },
  {
    id: "pir-16", topic: "Пирамида", group: "апофема и ребро",
    cond: "Диагональ основания правильной четырёхугольной пирамиды равна 12, высота пирамиды равна 8. Найдите боковое ребро пирамиды.",
    ans: "10",
    scene: { bodies: [{ kind: "pyramid", n: 4, R: 6, h: 8 }] },
    labels: [["S", "D", "?"]],
    construct: {
      points: { "O": ["mid", "B", "D"] },
      segments: [["B", "D", "12"], ["S", "O", "8"]],
      fills: [["S", "O", "D"]]
    },
    hint: "Рассмотрите прямоугольный треугольник, образованный высотой пирамиды и половиной диагонали основания.",
    sol: [
      "OD — половина диагонали: OD = 6.",
      "SD² = SO² + OD² = 64 + 36 = 100, SD = 10."
    ]
  },
  {
    id: "pir-17", topic: "Пирамида", group: "объём",
    cond: "Объём пирамиды равен 80. Через середину высоты пирамиды параллельно её основанию проведена плоскость, отсекающая меньшую пирамиду. Найдите объём отсечённой пирамиды.",
    ans: "10",
    scene: {
      bodies: [
        { kind: "pyramid", base: [[0, 0], [8, 0], [8, 6], [0, 6]], apexAt: [4, 5, 3], ghost: true },
        { kind: "pyramid", base: [[2, 1.5], [6, 1.5], [6, 4.5], [2, 4.5]], apexAt: [4, 2.5, 3], at: [0, 2.5, 0], names: ["K", "L", "M", "N"], hideLabels: true }
      ]
    },
    construct: {
      points: { "O": ["mid", "A", "C"] },
      segments: [["S", "O"]],
      fills: [["K", "L", "M", "N"]]
    },
    hint: "Отсечённая пирамида подобна исходной. Каким получается коэффициент подобия, если плоскость проходит через середину высоты?",
    sol: [
      "Малая пирамида подобна исходной с коэффициентом k = ½.",
      "Объёмы подобных тел относятся как k³ = ⅛.",
      "V = 80/8 = 10."
    ]
  },
  {
    id: "pir-18", topic: "Пирамида", group: "объём",
    cond: "В пирамиде DABC рёбра DA, DB и DC попарно перпендикулярны, DA = 3, DB = 4, DC = 5. Найдите объём пирамиды.",
    ans: "10",
    scene: {
      bodies: [{
        kind: "custom",
        pts: { D: [0, 0, 0], A: [3 * Math.cos(0.35), 0, 3 * Math.sin(0.35)], B: [-4 * Math.sin(0.35), 0, 4 * Math.cos(0.35)], C: [0, 5, 0] },
        faces: [["D", "A", "B"], ["D", "A", "C"], ["D", "B", "C"], ["A", "B", "C"]],
        edges: [["D", "A"], ["D", "B"], ["D", "C"], ["A", "B"], ["A", "C"], ["B", "C"]]
      }]
    },
    labels: [["D", "A", "3"], ["D", "B", "4"], ["D", "C", "5"]],
    construct: {
      solid: [["D", "A", "B"]]
    },
    hint: "Примите треугольник DAB за основание: тогда ребро DC перпендикулярно ему и является высотой пирамиды.",
    sol: [
      "Основание — прямоугольный треугольник DAB: S = ½·3·4 = 6.",
      "DC ⊥ DA и DC ⊥ DB, поэтому DC — высота пирамиды: h = 5.",
      "V = ⅓·6·5 = 10."
    ]
  }
];

/* Старый банк, тема «Цилиндр»: 9 задач открытого банка задания 3
   (Решу ЕГЭ; id — номер задачи на math-ege.sdamgia.ru/problem?id=…).
   Перенесены ДОСЛОВНО из опубликованной линейки
   trainers/ege-profile-stereometry-3d/js/data.js (коммит 4dc0592):
   поля, числа, тексты и порядок не менялись — под этими id у учеников
   записан прогресс (stereo3.status), а позиция задачи в теме —
   в stereo3.last.<тема>. Сцены строит engine-legacy.js (scene.prims / dims),
   общие константы (SQ2, SQ3, SQ5, HALF_PTS, HALF_FACES) — тоже там.
   Не переименовывать и не переставлять.
   Исключения (решение владельца 24.09.2026, только линейка курса):
     у 27045 исправлен чертёж (радиус сосуда — из условия, масштаб единый;
     построение — уровень воды 12 и подъём 9 на оси OO1: прежнее построение
     [O, O1] совпадало с осью и ничего не рисовало);
     у 27053, 27091 добавлено поле unit (длина условия на единицу сцены: сцена в масштабе k ≠ 1).
   id, условия, ответы, подсказки, решения и порядок — прежние;
   список и причины — legacy-parity.js. */
const P_LEGACY_CIL = [
  /* ================= ЦИЛИНДР ================= */
  { id:"27045", topic:"Цилиндр", ans:"1500",
    cond:"В цилиндрический сосуд налили 2000 см³ воды. Уровень воды при этом достигает высоты 12 см. В жидкость полностью погрузили деталь. При этом уровень жидкости в сосуде поднялся на 9 см. Чему равен объём детали? Ответ выразите в см³.",
    scene:{ prims:[{kind:"cyl",r:Math.sqrt(2000/(12*Math.PI)),h:21,fill:12/21}] },
    construct:{ points:{ K:[0,0,12] }, segments:[["O","K","12"],["K","O1","9"]] },
    hint:"Объём пропорционален высоте: на 12 см приходится 2000 см³.",
    sol:["На 1 см высоты приходится 2000/12 см³.","Vдетали = (2000/12)·9 = 1500 см³."] },
  { id:"27046", topic:"Цилиндр", ans:"4",
    cond:"В цилиндрическом сосуде уровень жидкости достигает 16 см. На какой высоте будет находиться уровень жидкости, если её перелить во второй сосуд, диаметр которого в 2 раза больше первого? Ответ дайте в сантиметрах.",
    scene:{ prims:[{kind:"cyl",r:2,h:20,fill:0.8},{kind:"cyl",r:4,h:20,ghost:true,hideLabels:true,px:"2",at:[8,0,0],fill:0.2}] },
    hint:"Площадь основания увеличится в 4 раза.",
    sol:["Диаметр ×2 ⇒ площадь основания ×4.","h = 16/4 = 4 см."] },
  { id:"27053", topic:"Цилиндр", ans:"9",
    cond:"Объём первого цилиндра равен 12 м³. У второго цилиндра высота в три раза больше, а радиус основания — в два раза меньше, чем у первого. Найдите объём второго цилиндра. Ответ дайте в кубических метрах.",
    scene:{ prims:[{kind:"cyl",r:2,h:2},{kind:"cyl",r:1,h:6,px:"2",ghost:true,hideLabels:true,at:[4.2,0,0]}] },
    unit:Math.cbrt(12/(8*Math.PI)),   /* длина условия на единицу сцены: V₁ = 12, на сцене r = 2, h = 2: V = 8π */
    hint:"V = πr²h: множители (1/2)² и 3.",
    sol:["V₂ = V₁·(1/2)²·3 = 12·3/4 = 9 м³."] },
  { id:"27058", topic:"Цилиндр", ans:"12",
    cond:"Радиус основания цилиндра равен 2, высота равна 3. Найдите площадь боковой поверхности цилиндра, делённую на π.",
    scene:{ prims:[{kind:"cyl",r:2,h:3}] },
    labels:[["O","P","2"],["P","P1","3"]],
    hint:"Sбок = 2πrh.",
    sol:["Sбок = 2πrh = 2π·2·3 = 12π.","Sбок/π = 12."] },
  { id:"27091", topic:"Цилиндр", ans:"3",
    cond:"В цилиндрический сосуд налили 6 куб. см воды. В воду полностью погрузили деталь. При этом уровень жидкости в сосуде увеличился в 1,5 раза. Найдите объём детали. Ответ выразите в куб. см.",
    scene:{ prims:[{kind:"cyl",r:1.6,h:4.5,fill:2/3}] },
    unit:Math.cbrt(6/(7.68*Math.PI)),   /* длина условия на единицу сцены: вода 6, на сцене r = 1,6, уровень 3: V = 7,68π */
    hint:"Объём воды с деталью стал 1,5·6 = 9 куб. см.",
    sol:["Новый объём: 6·1,5 = 9.","Vдетали = 9 − 6 = 3 куб. см."] },
  { id:"27118", topic:"Цилиндр", ans:"1,125",
    cond:"Одна цилиндрическая кружка вдвое выше второй, зато вторая в полтора раза шире. Найдите отношение объёма второй кружки к объёму первой.",
    scene:{ prims:[{kind:"cyl",r:1,h:2},{kind:"cyl",r:1.5,h:1,px:"2",ghost:true,hideLabels:true,at:[3.4,0,0]}] },
    hint:"V₂/V₁ = (r₂/r₁)²·(h₂/h₁) = 1,5²·(1/2).",
    sol:["V₂/V₁ = 1,5²·(1/2) = 2,25/2 = 1,125."] },
  { id:"27133", topic:"Цилиндр", ans:"6",
    cond:"Длина окружности основания цилиндра равна 3, высота равна 2. Найдите площадь боковой поверхности цилиндра.",
    scene:{ prims:[{kind:"cyl",r:3/(2*Math.PI),h:2}] },
    labels:[["P","P1","2"]],
    hint:"Sбок = C·h — развёртка боковой поверхности это прямоугольник.",
    sol:["Sбок = C·h = 3·2 = 6."] },
  { id:"27173", topic:"Цилиндр", ans:"4",
    cond:"Площадь осевого сечения цилиндра равна 4. Найдите площадь боковой поверхности цилиндра, делённую на π.",
    scene:{ prims:[{kind:"cyl",r:1,h:2}] },
    construct:{ segments:[["P","Q"],["P1","Q1"]], fills:[["P","Q","Q1","P1"]] },
    hint:"Осевое сечение — прямоугольник 2r × h, то есть 2rh = 4.",
    sol:["Sсеч = 2r·h = 4.","Sбок = 2πrh = π·(2rh) = 4π ⇒ Sбок/π = 4."] },
  { id:"245358", topic:"Цилиндр", ans:"2",
    cond:"Длина окружности основания цилиндра равна 3. Площадь боковой поверхности равна 6. Найдите высоту цилиндра.",
    scene:{ prims:[{kind:"cyl",r:3/(2*Math.PI),h:2}] },
    labels:[["P","P1","?"]],
    hint:"Sбок = C·h.",
    sol:["h = Sбок/C = 6/3 = 2."] },
];

const P_CIL = [
  {
    id: "cil-01", topic: "Цилиндр", group: "объём",
    cond: "Радиус основания цилиндра равен 4, высота равна 9. Найдите объём цилиндра, делённый на π.",
    ans: "144",
    scene: {
      bodies: [{
        kind: "cyl", r: 4, h: 9, centers: ["O", "O1"], axis: true,
        coordLabels: [
          { t: "4", p: [0, 9, 0], q: [2 * Math.cos(0.65), 9, 2 * Math.sin(0.65)] },
          { t: "9", p: [5.08 * Math.cos(0.65 - Math.PI), 0, 5.08 * Math.sin(0.65 - Math.PI)], q: [5.08 * Math.cos(0.65 - Math.PI), 9, 5.08 * Math.sin(0.65 - Math.PI)] }
        ]
      }]
    },
    labels: [],
    hint: "Объём цилиндра равен произведению площади основания на высоту: V = πr²h.",
    sol: [
      "V = πr²h = π · 4² · 9 = 144π.",
      "V/π = 144."
    ]
  },
  {
    id: "cil-02", topic: "Цилиндр", group: "объём",
    cond: "Объём цилиндра равен 63π, а его высота равна 7. Найдите радиус основания цилиндра.",
    ans: "3",
    scene: {
      bodies: [{
        kind: "cyl", r: 3, h: 7, centers: ["O", "O1"], axis: true,
        rim: { A: { ang: 0.65 } },
        coordLabels: [
          { t: "7", p: [3.84 * Math.cos(0.65 - Math.PI), 0, 3.84 * Math.sin(0.65 - Math.PI)], q: [3.84 * Math.cos(0.65 - Math.PI), 7, 3.84 * Math.sin(0.65 - Math.PI)] }
        ]
      }]
    },
    labels: [["O", "A", "?"]],
    construct: { segments: [["O", "A", "?"]] },
    hint: "Выразите площадь основания из формулы V = πr²h, затем найдите радиус.",
    sol: [
      "πr² · 7 = 63π, откуда r² = 9.",
      "r = 3."
    ]
  },
  {
    id: "cil-04", topic: "Цилиндр", group: "поверхность",
    cond: "Высота цилиндра равна 8, радиус его основания равен 5. Найдите S/π, где S — площадь боковой поверхности цилиндра.",
    ans: "80",
    scene: {
      bodies: [{
        kind: "cyl", r: 5, h: 8, centers: ["O", "O1"], axis: true,
        coordLabels: [
          { t: "5", p: [0, 8, 0], q: [2.5 * Math.cos(0.65), 8, 2.5 * Math.sin(0.65)] },
          { t: "8", p: [6.2 * Math.cos(0.65 - Math.PI), 0, 6.2 * Math.sin(0.65 - Math.PI)], q: [6.2 * Math.cos(0.65 - Math.PI), 8, 6.2 * Math.sin(0.65 - Math.PI)] }
        ]
      }]
    },
    labels: [],
    hint: "Боковая поверхность цилиндра — развёрнутый прямоугольник со сторонами 2πr и h.",
    sol: [
      "S(бок) = 2πrh = 2π · 5 · 8 = 80π.",
      "S(бок)/π = 80."
    ]
  },
  {
    id: "cil-05", topic: "Цилиндр", group: "поверхность",
    cond: "Цилиндр имеет высоту 7 и радиус основания 2. Найдите S/π, где S — площадь полной поверхности этого цилиндра.",
    ans: "36",
    scene: {
      bodies: [{
        kind: "cyl", r: 2, h: 7, centers: ["O", "O1"], axis: true,
        coordLabels: [
          { t: "2", p: [2.9 * Math.cos(0.65), 7.4, 2.9 * Math.sin(0.65)], q: [2.9 * Math.cos(0.65), 7.4, 2.9 * Math.sin(0.65)] },
          { t: "7", p: [2.84 * Math.cos(0.65 - Math.PI), 0, 2.84 * Math.sin(0.65 - Math.PI)], q: [2.84 * Math.cos(0.65 - Math.PI), 7, 2.84 * Math.sin(0.65 - Math.PI)] }
        ]
      }]
    },
    labels: [],
    hint: "Полная поверхность — боковая поверхность и два круга оснований: S = 2πrh + 2πr².",
    sol: [
      "S = 2πr(r + h) = 2π · 2 · (2 + 7) = 36π.",
      "S/π = 36."
    ]
  },
  {
    id: "cil-06", topic: "Цилиндр", group: "осевое сечение",
    cond: "Радиус основания цилиндра равен 4, высота равна 6. Найдите площадь осевого сечения цилиндра.",
    ans: "48",
    scene: {
      bodies: [{
        kind: "cyl", r: 4, h: 6, ghost: true, centers: ["O", "O1"],
        rim: {
          A: { ang: 0.65 }, B: { ang: 0.65 - Math.PI },
          A1: { ang: 0.65, at: "top" }, B1: { ang: 0.65 - Math.PI, at: "top" }
        },
        gens: [["A", "A1"], ["B", "B1"]],
        coordLabels: [
          { t: "4", p: [0, 0, 0], q: [4 * Math.cos(0.65), 0, 4 * Math.sin(0.65)] },
          { t: "6", p: [4 * Math.cos(0.65 - Math.PI), 0, 4 * Math.sin(0.65 - Math.PI)], q: [4 * Math.cos(0.65 - Math.PI), 6, 4 * Math.sin(0.65 - Math.PI)] }
        ]
      }]
    },
    labels: [],
    construct: { segments: [["A", "B"], ["A1", "B1"]], fills: [["A", "B", "B1", "A1"]] },
    hint: "Осевое сечение цилиндра — прямоугольник ABB₁A₁ со сторонами, равными диаметру основания и высоте.",
    sol: [
      "Стороны осевого сечения: AB = 2r = 8 и AA₁ = h = 6.",
      "S = 8 · 6 = 48."
    ]
  },
  {
    id: "cil-07", topic: "Цилиндр", group: "вода",
    cond: "В цилиндрическом сосуде уровень воды достигает 24 см. Всю воду перелили во второй цилиндрический сосуд, диаметр основания которого в 2 раза больше диаметра первого. На какой высоте (в см) будет находиться уровень воды во втором сосуде?",
    ans: "6",
    scene: {
      bodies: [
        {
          kind: "cyl", r: 6, h: 30, ghost: true, hideLabels: true, centers: ["_a", "_a1"],
          water: { h: 24 },
          coordLabels: [
            { t: "24", p: [6 * Math.cos(2.8), 0, 6 * Math.sin(2.8)], q: [6 * Math.cos(2.8), 24, 6 * Math.sin(2.8)] }
          ]
        },
        { kind: "cyl", r: 12, h: 30, ghost: true, hideLabels: true, centers: ["_b", "_b1"], at: [24, 0, 0], water: { h: 6 } },
        {
          kind: "custom",
          pts: { M: [24 + 12 * Math.cos(2.2), 0, 12 * Math.sin(2.2)], N: [24 + 12 * Math.cos(2.2), 6, 12 * Math.sin(2.2)] },
          edges: [["M", "N"]]
        }
      ]
    },
    labels: [["M", "N", "?"]],
    hint: "Объём воды не меняется. Если радиус основания больше в 2 раза, то площадь основания больше в 4 раза.",
    sol: [
      "Диаметр больше в 2 раза, значит площадь основания больше в 2² = 4 раза.",
      "При том же объёме уровень в 4 раза ниже: MN = 24 : 4 = 6 см."
    ]
  },
  {
    id: "cil-08", topic: "Цилиндр", group: "два цилиндра",
    cond: "Во сколько раз увеличится объём цилиндра, если радиус его основания увеличить в 2 раза, а высоту оставить прежней?",
    ans: "4",
    scene: {
      bodies: [
        {
          kind: "cyl", r: 2, h: 5, hideLabels: true, centers: ["_a", "_a1"],
          coordLabels: [
            { t: "r", p: [0, 6.1, 0], q: [0, 6.1, 0] },
            { t: "h", p: [3 * Math.cos(0.65 - Math.PI), 0, 3 * Math.sin(0.65 - Math.PI)], q: [3 * Math.cos(0.65 - Math.PI), 5, 3 * Math.sin(0.65 - Math.PI)] }
          ]
        },
        {
          kind: "cyl", r: 4, h: 5, hideLabels: true, centers: ["_b", "_b1"], at: [9, 0, 0],
          coordLabels: [
            { t: "2r", p: [9, 5, 0], q: [9, 5, 0] },
            { t: "h", p: [9 + 5 * Math.cos(0.65), 0, 5 * Math.sin(0.65)], q: [9 + 5 * Math.cos(0.65), 5, 5 * Math.sin(0.65)] }
          ]
        }
      ]
    },
    labels: [],
    hint: "Подставьте в формулу V = πr²h вместо r удвоенный радиус и сравните объёмы.",
    sol: [
      "V₂ = π(2r)²h = 4πr²h = 4V₁.",
      "Объём увеличится в 4 раза."
    ]
  },
  {
    id: "cil-09", topic: "Цилиндр", group: "два цилиндра",
    cond: "Объём первого цилиндра равен 12. У второго цилиндра радиус основания в 3 раза больше, а высота в 4 раза меньше, чем у первого. Найдите объём второго цилиндра.",
    ans: "27",
    scene: {
      bodies: [
        {
          kind: "cyl", r: 2, h: 8, hideLabels: true, centers: ["_a", "_a1"],
          coordLabels: [
            { t: "r", p: [0, 9.3, 0], q: [0, 9.3, 0] },
            { t: "h", p: [3 * Math.cos(0.65 - Math.PI), 0, 3 * Math.sin(0.65 - Math.PI)], q: [3 * Math.cos(0.65 - Math.PI), 8, 3 * Math.sin(0.65 - Math.PI)] }
          ]
        },
        {
          kind: "cyl", r: 6, h: 2, hideLabels: true, centers: ["_b", "_b1"], at: [11, 0, 0],
          coordLabels: [
            { t: "3r", p: [11, 2, 0], q: [11, 2, 0] },
            { t: "h/4", p: [11 + 7 * Math.cos(0.65), 0, 7 * Math.sin(0.65)], q: [11 + 7 * Math.cos(0.65), 2, 7 * Math.sin(0.65)] }
          ]
        }
      ]
    },
    labels: [],
    hint: "Объём пропорционален квадрату радиуса и первой степени высоты.",
    sol: [
      "V₂/V₁ = (3r)²·(h/4) / (r²h) = 9/4.",
      "V₂ = 12 · 9/4 = 27."
    ]
  },
  {
    id: "cil-10", topic: "Цилиндр", group: "вода",
    cond: "В цилиндрический бак, частично заполненный водой, целиком погрузили деталь. Площадь основания бака равна 80 см². После погружения детали уровень воды в баке поднялся на 5 см. Найдите объём детали. Ответ дайте в кубических сантиметрах.",
    ans: "400",
    scene: {
      bodies: [
        {
          kind: "cyl", r: Math.sqrt(80 / Math.PI), h: 14, ghost: true, hideLabels: true, centers: ["_o", "_o1"],
          water: { h: 11 },
          coordLabels: [
            { t: "5", p: [Math.sqrt(80 / Math.PI) * Math.cos(0.65), 6, Math.sqrt(80 / Math.PI) * Math.sin(0.65)], q: [Math.sqrt(80 / Math.PI) * Math.cos(0.65), 11, Math.sqrt(80 / Math.PI) * Math.sin(0.65)] }
          ]
        },
        {
          kind: "custom",
          pts: {
            _m: [Math.sqrt(80 / Math.PI) * Math.cos(0.65), 6, Math.sqrt(80 / Math.PI) * Math.sin(0.65)],
            _n: [Math.sqrt(80 / Math.PI) * Math.cos(0.65), 11, Math.sqrt(80 / Math.PI) * Math.sin(0.65)]
          },
          edges: [["_m", "_n"]],
          circles: [{ c: [0, 6, 0], r: Math.sqrt(80 / Math.PI), plane: "h", col: "amber" }]
        }
      ]
    },
    labels: [],
    hint: "Объём детали равен объёму вытесненной воды — слою между старым и новым уровнями.",
    sol: [
      "Деталь вытеснила слой воды высотой 5 см с площадью основания 80 см².",
      "V = 80·5 = 400 см³."
    ]
  }
];

/* Старый банк, тема «Конус»: 29 задач открытого банка задания 3
   (Решу ЕГЭ; id — номер задачи на math-ege.sdamgia.ru/problem?id=…).
   Перенесены ДОСЛОВНО из опубликованной линейки
   trainers/ege-profile-stereometry-3d/js/data.js (коммит 4dc0592):
   поля, числа, тексты и порядок не менялись — под этими id у учеников
   записан прогресс (stereo3.status), а позиция задачи в теме —
   в stereo3.last.<тема>. Сцены строит engine-legacy.js (scene.prims / dims),
   общие константы (SQ2, SQ3, SQ5, HALF_PTS, HALF_FACES) — тоже там.
   Не переименовывать и не переставлять.
   Исключения (решение владельца 24.09.2026, только линейка курса):
     у 27094, 27095, 27136, 27137, 324454, 525721, 676923 исправлен чертёж (scene / labels / construct);
     у 27052, 27161, 318145 добавлено поле unit (длина условия на единицу сцены: сцена в масштабе k ≠ 1);
     у 27202–27205 данные прежние, обод части конуса дугой рисует engine.js.
   id, условия, ответы, подсказки, решения и порядок — прежние;
   список и причины — legacy-parity.js. */
const P_LEGACY_KON = [
  /* ================= КОНУС ================= */
  { id:"27052", topic:"Конус", ans:"2",
    cond:"Объём конуса равен 16. Через середину высоты параллельно основанию конуса проведено сечение, которое является основанием меньшего конуса с той же вершиной. Найдите объём меньшего конуса.",
    scene:{ prims:[{kind:"cone",r:3,h:4,sect:0.5}] },
    unit:Math.cbrt(16/(12*Math.PI)),   /* длина условия на единицу сцены: V = 16, на сцене r = 3, h = 4: V = 12π */
    hint:"Меньший конус подобен большему с коэффициентом ½; объёмы относятся как куб коэффициента.",
    sol:["Меньший конус подобен большему с k = ½.","V = 16·(½)³ = 16/8 = 2."] },
  { id:"27093", topic:"Конус", ans:"1",
    cond:"Найдите объём V конуса, образующая которого равна 2 и наклонена к плоскости основания под углом 30°. В ответе укажите V/π.",
    scene:{ prims:[{kind:"cone",r:SQ3,h:1}] },
    construct:{ segments:[["S","P","2"],["S","O","?"],["O","P","?"]], fills:[["S","O","P"]] },
    hint:"h = l·sin30°, r = l·cos30°.",
    sol:["h = 2·sin30° = 1; r = 2·cos30° = √3.","V = ⅓π·(√3)²·1 = π ⇒ V/π = 1."] },
  { id:"27094", topic:"Конус", ans:"3",
    cond:"Во сколько раз уменьшится объём конуса, если его высота уменьшится в 3 раза, а радиус основания останется прежним?",
    scene:{ prims:[{kind:"cone",r:2,h:4.5},{kind:"cone",r:2,h:1.5,px:"2",ghost:true,hideLabels:true,at:[5,0,0]}] },
    hint:"V = ⅓πr²h — объём пропорционален высоте.",
    sol:["V пропорционален h ⇒ уменьшится в 3 раза."] },
  { id:"27095", topic:"Конус", ans:"2,25",
    cond:"Во сколько раз увеличится объём конуса, если радиус его основания увеличится в 1,5 раза, а высота останется прежней?",
    scene:{ prims:[{kind:"cone",r:1.4,h:3},{kind:"cone",r:2.1,h:3,px:"2",ghost:true,hideLabels:true,at:[4.4,0,0]}] },
    hint:"Объём пропорционален квадрату радиуса.",
    sol:["V ∝ r² ⇒ увеличится в 1,5² = 2,25 раза."] },
  { id:"27120", topic:"Конус", ans:"128",
    cond:"Высота конуса равна 6, образующая равна 10. Найдите его объём, делённый на π.",
    scene:{ prims:[{kind:"cone",r:8,h:6}] },
    construct:{ segments:[["S","O","6"],["S","P","10"],["O","P","?"]] },
    hint:"Найдите радиус по теореме Пифагора.",
    sol:["r = √(10² − 6²) = 8.","V/π = ⅓·64·6 = 128."] },
  { id:"27121", topic:"Конус", ans:"9",
    cond:"Диаметр основания конуса равен 6, а угол при вершине осевого сечения равен 90°. Вычислите объём конуса, делённый на π.",
    scene:{ prims:[{kind:"cone",r:3,h:3}] },
    construct:{ segments:[["P","Q","6"],["S","P","?"],["S","Q","?"],["S","O","?"]], fills:[["S","P","Q"]] },
    hint:"В осевом сечении углы при образующих по 45° ⇒ высота равна радиусу.",
    sol:["r = 3; при угле 90° при вершине h = r = 3.","V/π = ⅓·9·3 = 9."] },
  { id:"27122", topic:"Конус", ans:"72",
    cond:"Конус получается при вращении равнобедренного прямоугольного треугольника ABC вокруг катета, равного 6. Найдите его объём, делённый на π.",
    scene:{ prims:[{kind:"cone",r:6,h:6}] },
    construct:{ segments:[["S","O","6"],["O","P","6"],["S","P","?"]], fills:[["S","O","P"]] },
    hint:"Катеты равны ⇒ r = h = 6.",
    sol:["r = h = 6.","V/π = ⅓·36·6 = 72."] },
  { id:"27135", topic:"Конус", ans:"3",
    cond:"Длина окружности основания конуса равна 3, образующая равна 2. Найдите площадь боковой поверхности конуса.",
    scene:{ prims:[{kind:"cone",r:3/(2*Math.PI),h:Math.sqrt(4-Math.pow(3/(2*Math.PI),2))}] },
    construct:{ segments:[["S","P","2"]] },
    hint:"Sбок = πrl = ½·C·l.",
    sol:["Sбок = ½·C·l = ½·3·2 = 3."] },
  { id:"27136", topic:"Конус", ans:"3",
    cond:"Во сколько раз увеличится площадь боковой поверхности конуса, если его образующая увеличится в 3 раза, а радиус основания останется прежним?",
    scene:{ prims:[{kind:"cone",r:1.5,h:1.6},{kind:"cone",r:1.5,h:Math.sqrt(9*4.81-2.25),px:"2",ghost:true,hideLabels:true,at:[4,0,0]}] },
    hint:"Sбок = πrl.",
    sol:["Sбок = πrl пропорциональна l ⇒ увеличится в 3 раза."] },
  { id:"27137", topic:"Конус", ans:"1,5",
    cond:"Во сколько раз уменьшится площадь боковой поверхности конуса, если радиус его основания уменьшится в 1,5 раза, а образующая останется прежней?",
    scene:{ prims:[{kind:"cone",r:2.4,h:2.6},{kind:"cone",r:1.6,h:Math.sqrt(12.52-2.56),px:"2",ghost:true,hideLabels:true,at:[4.8,0,0]}] },
    hint:"Sбок = πrl.",
    sol:["Sбок пропорциональна r ⇒ уменьшится в 1,5 раза."] },
  { id:"27159", topic:"Конус", ans:"144",
    cond:"Высота конуса равна 6, образующая равна 10. Найдите площадь его полной поверхности, делённую на π.",
    scene:{ prims:[{kind:"cone",r:8,h:6}] },
    construct:{ segments:[["S","O","6"],["S","P","10"],["O","P","?"]] },
    hint:"S = πr² + πrl = πr(r + l).",
    sol:["r = √(100 − 36) = 8.","S/π = r(r + l) = 8·(8 + 10) = 144."] },
  { id:"27160", topic:"Конус", ans:"60",
    cond:"Площадь боковой поверхности конуса в два раза больше площади основания. Найдите угол между образующей конуса и плоскостью основания. Ответ дайте в градусах.",
    scene:{ prims:[{kind:"cone",r:1,h:SQ3}] },
    construct:{ segments:[["S","P","?"],["O","P","?"],["S","O"]], fills:[["S","O","P"]] },
    hint:"πrl = 2πr² ⇒ l = 2r; cos угла = r/l.",
    sol:["πrl = 2πr² ⇒ l = 2r.","cosα = r/l = ½ ⇒ α = 60°."] },
  { id:"27161", topic:"Конус", ans:"3",
    cond:"Площадь полной поверхности конуса равна 12. Параллельно основанию конуса проведено сечение, делящее высоту в отношении 1 : 1, считая от вершины конуса. Найдите площадь полной поверхности отсечённого конуса.",
    scene:{ prims:[{kind:"cone",r:3,h:4,sect:0.5}] },
    unit:Math.sqrt(12/(24*Math.PI)),   /* длина условия на единицу сцены: Sполн = 12, на сцене r = 3, l = 5: S = 24π */
    hint:"Отсечённый конус подобен исходному с k = ½; площади относятся как k².",
    sol:["k = ½ ⇒ площади относятся как ¼.","S = 12/4 = 3."] },
  { id:"27167", topic:"Конус", ans:"24",
    cond:"Радиус основания конуса равен 3, высота равна 4. Найдите площадь полной поверхности конуса, делённую на π.",
    scene:{ prims:[{kind:"cone",r:3,h:4}] },
    labels:[["O","P","3"],["S","O","4"]],
    construct:{ segments:[["S","P","?"]] },
    hint:"l = √(r² + h²) = 5; S = πr(r + l).",
    sol:["l = √(9 + 16) = 5.","S/π = r(r + l) = 3·8 = 24."] },
  { id:"27202", topic:"Конус", ans:"87,75",
    cond:"Найдите объём V части конуса, изображённой на рисунке. В ответе укажите V/π.",
    scene:{ prims:[{kind:"cone",r:9,h:13,keep:90}] },
    labels:[["S","O","13"],["O","B","9"]],
    hint:"Показанная часть — четверть конуса (угол 90°).",
    sol:["Vконуса/π = ⅓·9²·13 = 351.","Часть 90° — четверть: V/π = 351/4 = 87,75."] },
  { id:"27203", topic:"Конус", ans:"243",
    cond:"Найдите объём V части конуса, изображённой на рисунке. В ответе укажите V/π.",
    scene:{ prims:[{kind:"cone",r:9,h:12,keep:270}] },
    labels:[["S","O","12"],["O","B","9"]],
    hint:"Вырезана четверть (90°) — осталось ¾ конуса.",
    sol:["Vконуса/π = ⅓·9²·12 = 324.","Осталось ¾: V/π = ¾·324 = 243."] },
  { id:"27204", topic:"Конус", ans:"216",
    cond:"Найдите объём V части конуса, изображённой на рисунке. В ответе укажите V/π.",
    scene:{ prims:[{kind:"cone",r:12,h:27,keep:60}] },
    labels:[["S","O","27"],["O","B","12"]],
    hint:"Показанная часть — сектор 60°, то есть 1/6 конуса.",
    sol:["Vконуса/π = ⅓·12²·27 = 1296.","V/π = 1296·(60/360) = 216."] },
  { id:"27205", topic:"Конус", ans:"607,5",
    cond:"Найдите объём V части конуса, изображённой на рисунке. В ответе укажите V/π.",
    scene:{ prims:[{kind:"cone",r:9,h:27,keep:300}] },
    labels:[["S","O","27"],["O","B","9"]],
    hint:"Вырезан сектор 60° — осталось 300°, то есть 5/6 конуса.",
    sol:["Vконуса/π = ⅓·9²·27 = 729.","V/π = 729·(300/360) = 607,5."] },
  { id:"284358", topic:"Конус", ans:"5",
    cond:"Высота конуса равна 4, а диаметр основания — 6. Найдите образующую конуса.",
    scene:{ prims:[{kind:"cone",r:3,h:4}] },
    construct:{ segments:[["P","Q","6"],["S","O","4"],["S","P","?"]] },
    hint:"Образующая — гипотенуза в △SOP.",
    sol:["r = 3.","l = √(4² + 3²) = 5."] },
  { id:"284359", topic:"Конус", ans:"6",
    cond:"Высота конуса равна 4, а длина образующей — 5. Найдите диаметр основания конуса.",
    scene:{ prims:[{kind:"cone",r:3,h:4}] },
    construct:{ segments:[["S","O","4"],["S","P","5"],["P","Q","?"]] },
    hint:"r = √(l² − h²).",
    sol:["r = √(25 − 16) = 3.","d = 2r = 6."] },
  { id:"284360", topic:"Конус", ans:"4",
    cond:"Диаметр основания конуса равен 6, а длина образующей — 5. Найдите высоту конуса.",
    scene:{ prims:[{kind:"cone",r:3,h:4}] },
    construct:{ segments:[["P","Q","6"],["S","P","5"],["S","O","?"]] },
    hint:"h = √(l² − r²).",
    sol:["r = 3.","h = √(25 − 9) = 4."] },
  { id:"318145", topic:"Конус", ans:"490",
    cond:"В сосуде, имеющем форму конуса, уровень жидкости достигает 1/2 высоты. Объём жидкости равен 70 мл. Сколько миллилитров жидкости нужно долить, чтобы полностью наполнить сосуд?",
    scene:{ prims:[{kind:"cone",r:2.6,h:4.4,flip:true,fill:0.5}] },
    unit:Math.cbrt(70/(Math.PI*1.3*1.3*2.2/3)),   /* длина условия на единицу сцены: жидкость 70, на сцене конус жидкости r = 1,3, h = 2,2 */
    hint:"Жидкость образует конус, подобный сосуду с k = ½ ⇒ её объём равен 1/8 объёма сосуда.",
    sol:["Vжидкости = (½)³·Vсосуда ⇒ Vсосуда = 70·8 = 560 мл.","Долить: 560 − 70 = 490 мл."] },
  { id:"324453", topic:"Конус", ans:"24",
    cond:"Площадь основания конуса равна 16π, высота — 6. Найдите площадь осевого сечения конуса.",
    scene:{ prims:[{kind:"cone",r:4,h:6}] },
    construct:{ segments:[["P","Q","?"],["S","O","6"]], fills:[["S","P","Q"]] },
    hint:"πr² = 16π ⇒ r = 4. Осевое сечение — треугольник с основанием 2r и высотой h.",
    sol:["r = 4.","S = ½·2r·h = ½·8·6 = 24."] },
  { id:"324454", topic:"Конус", ans:"2",
    cond:"Площадь основания конуса равна 18. Плоскость, параллельная плоскости основания конуса, делит его высоту на отрезки длиной 3 и 6, считая от вершины. Найдите площадь сечения конуса этой плоскостью.",
    scene:{ prims:[{kind:"cone",r:Math.sqrt(18/Math.PI),h:9,sect:1/3}], pts:{_K:[0,0,6]} },
    labels:[["S","_K","3"],["_K","O","6"]],
    hint:"Сечение подобно основанию с k = 3/9 = 1/3.",
    sol:["k = 3/(3+6) = 1/3.","S = 18·(1/3)² = 2."] },
  { id:"324455", topic:"Конус", ans:"48",
    cond:"Высота конуса равна 8, а длина образующей — 10. Найдите площадь осевого сечения этого конуса.",
    scene:{ prims:[{kind:"cone",r:6,h:8}] },
    construct:{ segments:[["S","O","8"],["S","P","10"],["P","Q","?"]], fills:[["S","P","Q"]] },
    hint:"r = √(10² − 8²) = 6.",
    sol:["r = 6.","S = ½·2r·h = ½·12·8 = 48."] },
  { id:"324456", topic:"Конус", ans:"48",
    cond:"Диаметр основания конуса равен 12, а длина образующей — 10. Найдите площадь осевого сечения этого конуса.",
    scene:{ prims:[{kind:"cone",r:6,h:8}] },
    construct:{ segments:[["P","Q","12"],["S","P","10"],["S","O","?"]], fills:[["S","P","Q"]] },
    hint:"h = √(10² − 6²) = 8.",
    sol:["h = √(100 − 36) = 8.","S = ½·12·8 = 48."] },
  { id:"501878", topic:"Конус", ans:"12",
    cond:"Найдите площадь осевого сечения конуса, радиус основания которого равен 3, а образующая равна 5.",
    scene:{ prims:[{kind:"cone",r:3,h:4}] },
    labels:[["O","P","3"]],
    construct:{ segments:[["S","P","5"],["S","O","?"]], fills:[["S","P","Q"]] },
    hint:"h = √(l² − r²) = 4; сечение — треугольник с основанием 2r.",
    sol:["h = √(25 − 9) = 4.","S = ½·6·4 = 12."] },
  { id:"525721", topic:"Конус", ans:"5",
    cond:"Площадь основания конуса равна 45. Плоскость, параллельная плоскости основания конуса, делит его высоту на отрезки длиной 4 и 8, считая от вершины. Найдите площадь сечения конуса этой плоскостью.",
    scene:{ prims:[{kind:"cone",r:Math.sqrt(45/Math.PI),h:12,sect:1/3}], pts:{_K:[0,0,8]} },
    labels:[["S","_K","4"],["_K","O","8"]],
    hint:"k = 4/(4+8) = 1/3.",
    sol:["Сечение подобно основанию с k = 1/3.","S = 45/9 = 5."] },
  { id:"676923", topic:"Конус", ans:"12",
    cond:"Шар вписан в конус. Радиус основания конуса равен 3, а образующая равна 6. Найдите площадь поверхности шара, делённую на π.",
    scene:{ prims:[{kind:"cone",r:3,h:3*SQ3},{kind:"sphere",r:SQ3,zc:SQ3,px:"2",ghost:true,hideLabels:true}] },
    labels:[["O","P","3"],["S","P","6"]],
    construct:{ segments:[["S","Q","6"],["P","Q","?"]], fills:[["S","P","Q"]] },
    hint:"Осевое сечение — равносторонний треугольник со стороной 6; радиус шара — радиус вписанной в него окружности.",
    sol:["Осевое сечение — равносторонний △ со стороной 6 (2r = l = 6).","rшара = 6·√3/6 = √3.","Sшара/π = 4·(√3)² = 12."] },
];

const P_KON = [
  /* ---------- объём ---------- */
  {
    id: "kon-01", topic: "Конус", group: "объём",
    cond: "Радиус основания конуса равен 6, высота равна 7. Найдите объём конуса, делённый на π.",
    ans: "84",
    scene: {
      bodies: [{
        kind: "cone", r: 6, h: 7, center: "O", apex: "S", axis: true,
        rim: { A: { ang: 0.65 } }, edges: [["O", "A"]]
      }]
    },
    labels: [["O", "A", "6"], ["O", "S", "7"]],
    hint: "Объём конуса равен трети произведения площади основания на высоту: V = πr²h/3.",
    sol: [
      "V = ⅓ · πr² · h = ⅓ · π · 36 · 7 = 84π.",
      "V/π = 84."
    ]
  },
  {
    id: "kon-02", topic: "Конус", group: "объём",
    cond: "Объём конуса равен 25π, а его высота равна 3. Найдите радиус основания конуса.",
    ans: "5",
    scene: {
      bodies: [{
        kind: "cone", r: 5, h: 3, center: "O", apex: "S", axis: true,
        rim: { A: { ang: 0.65 } }
      }]
    },
    labels: [["O", "S", "3"], ["O", "A", "?"]],
    construct: { segments: [["O", "A", "?"]] },
    hint: "Выразите r² из формулы объёма конуса V = πr²h/3.",
    sol: [
      "⅓ · πr² · 3 = 25π, откуда r² = 25.",
      "r = 5."
    ]
  },
  {
    id: "kon-03", topic: "Конус", group: "объём",
    cond: "Объём конуса равен 48π, а радиус основания равен 6. Найдите высоту конуса.",
    ans: "4",
    scene: {
      bodies: [{
        kind: "cone", r: 6, h: 4, center: "O", apex: "S",
        rim: { A: { ang: 0.65 } }, edges: [["O", "A"]]
      }]
    },
    labels: [["O", "A", "6"], ["O", "S", "?"]],
    construct: { segments: [["O", "S", "?"]] },
    hint: "Высота конуса — отрезок OS от центра основания до вершины. Выразите её из V = πr²h/3.",
    sol: [
      "⅓ · π · 36 · h = 48π, откуда 12h = 48.",
      "h = 4."
    ]
  },
  {
    id: "kon-04", topic: "Конус", group: "объём",
    cond: "Радиус основания конуса увеличили в 2 раза, а высоту оставили прежней. Во сколько раз увеличился объём конуса?",
    ans: "4",
    scene: {
      bodies: [
        {
          kind: "cone", r: 2, h: 5, center: "_o", apex: "_s", hideLabels: true,
          coordLabels: [
            { t: "r", p: [0, 0, 3.2], q: [0, 0, 3.2] },
            { t: "h", p: [3 * Math.cos(0.65 - Math.PI), 0, 3 * Math.sin(0.65 - Math.PI)], q: [3 * Math.cos(0.65 - Math.PI), 5, 3 * Math.sin(0.65 - Math.PI)] }
          ]
        },
        {
          kind: "cone", r: 4, h: 5, center: "_p", apex: "_t", hideLabels: true, at: [8, 0, 0],
          coordLabels: [
            { t: "2r", p: [8, 0, 5.2], q: [8, 0, 5.2] },
            { t: "h", p: [8 + 5 * Math.cos(0.65), 0, 5 * Math.sin(0.65)], q: [8 + 5 * Math.cos(0.65), 5, 5 * Math.sin(0.65)] }
          ]
        }
      ]
    },
    labels: [],
    hint: "Подставьте в формулу V = πr²h/3 удвоенный радиус и сравните объёмы.",
    sol: [
      "V₂ = ⅓ · π(2r)² · h = 4 · ⅓ · πr²h = 4V₁.",
      "Объём увеличился в 4 раза."
    ]
  },
  {
    id: "kon-05", topic: "Конус", group: "объём",
    cond: "Высоту конуса увеличили в 2 раза, а радиус основания не изменили. Во сколько раз увеличился объём конуса?",
    ans: "2",
    scene: {
      bodies: [
        {
          kind: "cone", r: 3, h: 4, center: "_o", apex: "_s", hideLabels: true,
          coordLabels: [
            { t: "r", p: [0, 0, 4.2], q: [0, 0, 4.2] },
            { t: "h", p: [4 * Math.cos(0.65 - Math.PI), 0, 4 * Math.sin(0.65 - Math.PI)], q: [4 * Math.cos(0.65 - Math.PI), 4, 4 * Math.sin(0.65 - Math.PI)] }
          ]
        },
        {
          kind: "cone", r: 3, h: 8, center: "_p", apex: "_t", hideLabels: true, at: [8, 0, 0],
          coordLabels: [
            { t: "r", p: [8, 0, 4.2], q: [8, 0, 4.2] },
            { t: "2h", p: [8 + 4 * Math.cos(0.65), 0, 4 * Math.sin(0.65)], q: [8 + 4 * Math.cos(0.65), 8, 4 * Math.sin(0.65)] }
          ]
        }
      ]
    },
    labels: [],
    hint: "Объём конуса прямо пропорционален высоте.",
    sol: [
      "V₂ = ⅓ · πr² · 2h = 2 · ⅓ · πr²h = 2V₁.",
      "Объём увеличился в 2 раза."
    ]
  },
  {
    id: "kon-06", topic: "Конус", group: "объём",
    cond: "Объём первого конуса равен 18. У второго конуса радиус основания в 2 раза больше, а высота в 3 раза меньше, чем у первого. Найдите объём второго конуса.",
    ans: "24",
    scene: {
      bodies: [
        {
          kind: "cone", r: 2, h: 6, center: "_o", apex: "_s", hideLabels: true,
          coordLabels: [
            { t: "r", p: [0, 0, 3.2], q: [0, 0, 3.2] },
            { t: "h", p: [3 * Math.cos(0.65 - Math.PI), 0, 3 * Math.sin(0.65 - Math.PI)], q: [3 * Math.cos(0.65 - Math.PI), 6, 3 * Math.sin(0.65 - Math.PI)] }
          ]
        },
        {
          kind: "cone", r: 4, h: 2, center: "_p", apex: "_t", hideLabels: true, at: [8, 0, 0],
          coordLabels: [
            { t: "2r", p: [8, 0, 5.2], q: [8, 0, 5.2] },
            { t: "h/3", p: [8 + 5 * Math.cos(0.65), 0, 5 * Math.sin(0.65)], q: [8 + 5 * Math.cos(0.65), 2, 5 * Math.sin(0.65)] }
          ]
        }
      ]
    },
    labels: [],
    hint: "Объём пропорционален квадрату радиуса и первой степени высоты.",
    sol: [
      "V₂/V₁ = (2r)² · (h/3) / (r²h) = 4/3.",
      "V₂ = 18 · 4/3 = 24."
    ]
  },
  {
    id: "kon-07", topic: "Конус", group: "объём",
    cond: "Во сколько раз увеличится объём конуса, если радиус его основания увеличить в 3 раза, а высоту уменьшить в 3 раза?",
    ans: "3",
    scene: {
      bodies: [
        {
          kind: "cone", r: 2, h: 6, center: "_o", apex: "_s", hideLabels: true,
          coordLabels: [
            { t: "r", p: [0, 0, 3.2], q: [0, 0, 3.2] },
            { t: "h", p: [3 * Math.cos(0.65 - Math.PI), 0, 3 * Math.sin(0.65 - Math.PI)], q: [3 * Math.cos(0.65 - Math.PI), 6, 3 * Math.sin(0.65 - Math.PI)] }
          ]
        },
        {
          kind: "cone", r: 6, h: 2, center: "_p", apex: "_t", hideLabels: true, at: [10, 0, 0],
          coordLabels: [
            { t: "3r", p: [10, 0, 7.2], q: [10, 0, 7.2] },
            { t: "h/3", p: [10 + 7 * Math.cos(0.65), 0, 7 * Math.sin(0.65)], q: [10 + 7 * Math.cos(0.65), 2, 7 * Math.sin(0.65)] }
          ]
        }
      ]
    },
    labels: [],
    hint: "Объём конуса пропорционален квадрату радиуса и первой степени высоты.",
    sol: [
      "V₂ = ⅓ · π(3r)² · (h/3) = 3 · ⅓ · πr²h = 3V₁.",
      "Объём увеличится в 3 раза."
    ]
  },
  {
    id: "kon-08", topic: "Конус", group: "объём",
    cond: "Высоты двух конусов равны, а радиусы их оснований относятся как 2 : 1. Во сколько раз объём первого конуса больше объёма второго?",
    ans: "4",
    scene: {
      bodies: [
        {
          kind: "cone", r: 4, h: 5, center: "_o", apex: "_s", hideLabels: true,
          coordLabels: [
            { t: "2r", p: [0, 0, 5.2], q: [0, 0, 5.2] },
            { t: "h", p: [5 * Math.cos(0.65 - Math.PI), 0, 5 * Math.sin(0.65 - Math.PI)], q: [5 * Math.cos(0.65 - Math.PI), 5, 5 * Math.sin(0.65 - Math.PI)] }
          ]
        },
        {
          kind: "cone", r: 2, h: 5, center: "_p", apex: "_t", hideLabels: true, at: [9, 0, 0],
          coordLabels: [
            { t: "r", p: [9, 0, 3.2], q: [9, 0, 3.2] },
            { t: "h", p: [9 + 3 * Math.cos(0.65), 0, 3 * Math.sin(0.65)], q: [9 + 3 * Math.cos(0.65), 5, 3 * Math.sin(0.65)] }
          ]
        }
      ]
    },
    labels: [],
    hint: "При равных высотах объёмы конусов относятся как квадраты радиусов оснований.",
    sol: [
      "V₁/V₂ = (2r)² · h / (r² · h) = 4.",
      "Объём первого конуса больше в 4 раза."
    ]
  },
  {
    id: "kon-09", topic: "Конус", group: "объём",
    cond: "Основание конуса совпадает с основанием цилиндра, а вершина конуса лежит в центре другого основания цилиндра. Объём цилиндра составляет 57. Чему равен объём конуса?",
    ans: "19",
    scene: {
      bodies: [
        { kind: "cyl", r: 3, h: 4, ghost: true, hideLabels: true, centers: ["_c", "_c1"] },
        { kind: "cone", r: 3, h: 4, center: "O", apex: "S", axis: true }
      ]
    },
    labels: [],
    hint: "Объём конуса в 3 раза меньше объёма цилиндра с теми же основанием и высотой.",
    sol: [
      "V(конуса) = ⅓ · V(цилиндра).",
      "V = 57 : 3 = 19."
    ]
  },
  /* ---------- образующая и поверхность ---------- */
  {
    id: "kon-10", topic: "Конус", group: "образующая и поверхность",
    cond: "Радиус основания конуса равен 2, а высота равна 5. Найдите квадрат образующей конуса.",
    ans: "29",
    scene: {
      bodies: [{
        kind: "cone", r: 2, h: 5, center: "O", apex: "S", axis: true,
        rim: { A: { ang: 0.65 } }, edges: [["O", "A"]]
      }]
    },
    labels: [["O", "A", "2"], ["O", "S", "5"], ["S", "A", "?"]],
    construct: { segments: [["S", "A", "?"]] },
    hint: "Образующая, высота и радиус образуют прямоугольный треугольник SOA. Примените теорему Пифагора.",
    sol: [
      "Треугольник SOA прямоугольный: SA² = SO² + OA².",
      "SA² = 25 + 4 = 29."
    ]
  },
  {
    id: "kon-11", topic: "Конус", group: "образующая и поверхность",
    cond: "Радиус основания конуса равен 9, а высота равна 12. Найдите образующую конуса.",
    ans: "15",
    scene: {
      bodies: [{
        kind: "cone", r: 9, h: 12, center: "O", apex: "S", axis: true,
        rim: { A: { ang: 0.65 } }, edges: [["O", "A"]]
      }]
    },
    labels: [["O", "A", "9"], ["O", "S", "12"], ["S", "A", "?"]],
    construct: { segments: [["S", "A", "?"]] },
    hint: "Образующая — гипотенуза прямоугольного треугольника с катетами, равными высоте и радиусу.",
    sol: [
      "SA² = SO² + OA² = 144 + 81 = 225.",
      "SA = 15."
    ]
  },
  {
    id: "kon-12", topic: "Конус", group: "образующая и поверхность",
    cond: "Образующая конуса равна 13, а радиус основания равен 5. Найдите высоту конуса.",
    ans: "12",
    scene: {
      bodies: [{
        kind: "cone", r: 5, h: 12, center: "O", apex: "S",
        rim: { A: { ang: 0.65 } }, edges: [["O", "A"], ["S", "A"]]
      }]
    },
    labels: [["O", "A", "5"], ["S", "A", "13"], ["O", "S", "?"]],
    construct: { segments: [["O", "S", "?"]] },
    hint: "Высота — катет прямоугольного треугольника SOA с гипотенузой-образующей.",
    sol: [
      "SO² = SA² − OA² = 169 − 25 = 144.",
      "SO = 12."
    ]
  },
  {
    id: "kon-13", topic: "Конус", group: "образующая и поверхность",
    cond: "Образующая конуса равна 17, а высота равна 15. Найдите радиус основания конуса.",
    ans: "8",
    scene: {
      bodies: [{
        kind: "cone", r: 8, h: 15, center: "O", apex: "S", axis: true,
        rim: { A: { ang: 0.65 } }, edges: [["S", "A"]]
      }]
    },
    labels: [["O", "S", "15"], ["S", "A", "17"], ["O", "A", "?"]],
    construct: { segments: [["O", "A", "?"]] },
    hint: "Радиус — катет прямоугольного треугольника SOA с гипотенузой-образующей.",
    sol: [
      "OA² = SA² − SO² = 289 − 225 = 64.",
      "OA = 8."
    ]
  },
  {
    id: "kon-14", topic: "Конус", group: "образующая и поверхность",
    cond: "Радиус основания конуса равен 6, образующая равна 10. Найдите площадь боковой поверхности конуса, делённую на π.",
    ans: "60",
    scene: {
      bodies: [{
        kind: "cone", r: 6, h: 8, center: "O", apex: "S",
        rim: { A: { ang: 0.65 } }, edges: [["O", "A"], ["S", "A"]]
      }]
    },
    labels: [["O", "A", "6"], ["S", "A", "10"]],
    hint: "Площадь боковой поверхности конуса: S = πrl, где l — образующая.",
    sol: [
      "S(бок) = πrl = π · 6 · 10 = 60π.",
      "S(бок)/π = 60."
    ]
  },
  {
    id: "kon-15", topic: "Конус", group: "образующая и поверхность",
    cond: "Площадь боковой поверхности конуса равна 580π, а образующая равна 29. Найдите радиус основания конуса.",
    ans: "20",
    scene: {
      bodies: [{
        kind: "cone", r: 20, h: 21, center: "O", apex: "S", axis: true,
        rim: { A: { ang: 0.65 } }, edges: [["S", "A"]]
      }]
    },
    labels: [["S", "A", "29"], ["O", "A", "?"]],
    construct: { segments: [["O", "A", "?"]] },
    hint: "Выразите радиус из формулы боковой поверхности S = πrl.",
    sol: [
      "πr · 29 = 580π, откуда r = 580 : 29.",
      "r = 20."
    ]
  },
  {
    id: "kon-16", topic: "Конус", group: "образующая и поверхность",
    cond: "Образующая конуса равна 5, радиус основания равен 3. Найдите S/π, где S — площадь полной поверхности конуса.",
    ans: "24",
    scene: {
      bodies: [{
        kind: "cone", r: 3, h: 4, center: "O", apex: "S",
        rim: { A: { ang: 0.65 } }, edges: [["O", "A"], ["S", "A"]]
      }]
    },
    labels: [["O", "A", "3"], ["S", "A", "5"]],
    hint: "Полная поверхность — боковая поверхность и круг основания: S = πrl + πr².",
    sol: [
      "S = πr(r + l) = π · 3 · (3 + 5) = 24π.",
      "S/π = 24."
    ]
  },
  /* kon-17 убрана 24.09.2026: дубль задачи 27160 старого банка (problems-legacy-kon.js) — та же модель, те же числа. */
  {
    id: "kon-18", topic: "Конус", group: "образующая и поверхность",
    cond: "Радиус основания конуса равен 5, высота равна 6. Найдите площадь осевого сечения конуса.",
    ans: "30",
    scene: {
      bodies: [{
        kind: "cone", r: 5, h: 6, ghost: true, center: "O", apex: "S", axis: true,
        rim: { A: { ang: 0.65 }, B: { ang: 0.65 - Math.PI } },
        edges: [["S", "A"], ["S", "B"], ["O", "A"]]
      }]
    },
    labels: [["O", "A", "5"], ["O", "S", "6"]],
    construct: { segments: [["A", "B"]], fills: [["A", "B", "S"]] },
    hint: "Осевое сечение конуса — треугольник ABS с основанием, равным диаметру, и высотой конуса.",
    sol: [
      "Основание сечения AB = 2r = 10, высота сечения SO = 6.",
      "S = ½ · 10 · 6 = 30."
    ]
  },
  /* ---------- сечения и подобие ---------- */
  {
    id: "kon-19", topic: "Конус", group: "сечения и подобие",
    cond: "Площадь основания конуса равна 48. Плоскость, параллельная основанию, проходит через середину высоты конуса. Найдите площадь сечения конуса этой плоскостью.",
    ans: "12",
    scene: {
      bodies: [
        {
          kind: "cone", r: Math.sqrt(48 / Math.PI), h: 6, ghost: true, center: "O", apex: "S", axis: true,
          rim: { A: { ang: 0.65 } }
        },
        {
          kind: "custom",
          circles: [{ c: [0, 3, 0], r: Math.sqrt(48 / Math.PI) / 2, plane: "h", col: "amber" }]
        }
      ]
    },
    labels: [],
    construct: {
      points: {
        K: [0, 3, 0],
        M: [Math.sqrt(48 / Math.PI) / 2 * Math.cos(0.65), 3, Math.sqrt(48 / Math.PI) / 2 * Math.sin(0.65)]
      },
      segments: [["S", "A"], ["O", "A"], ["K", "M"]],
      fills: [["S", "O", "A"]]
    },
    hint: "Сечение — круг, подобный основанию. Радиус сечения вдвое меньше радиуса основания.",
    sol: [
      "Треугольники SKM и SOA подобны с коэффициентом ½, значит KM = OA/2.",
      "Площади кругов относятся как квадрат коэффициента: S = 48 · (½)² = 12."
    ]
  },
  {
    id: "kon-20", topic: "Конус", group: "сечения и подобие",
    cond: "Площадь полной поверхности конуса равна 48. Плоскость, параллельная основанию, проходит через середину высоты конуса и отсекает от него малый конус. Найдите площадь полной поверхности малого конуса.",
    ans: "12",
    scene: {
      bodies: [
        {
          kind: "cone", r: 4 / Math.sqrt(Math.PI), h: 4 * Math.sqrt(3 / Math.PI), ghost: true,
          center: "O", apex: "S", axis: true, rim: { A: { ang: 0.65 } }
        },
        {
          kind: "cone", r: 2 / Math.sqrt(Math.PI), h: 2 * Math.sqrt(3 / Math.PI),
          at: [0, 2 * Math.sqrt(3 / Math.PI), 0], center: "_k", apex: "_t"
        }
      ]
    },
    labels: [],
    construct: {
      points: {
        K: [0, 2 * Math.sqrt(3 / Math.PI), 0],
        M: [2 / Math.sqrt(Math.PI) * Math.cos(0.65), 2 * Math.sqrt(3 / Math.PI), 2 / Math.sqrt(Math.PI) * Math.sin(0.65)]
      },
      segments: [["S", "A"], ["O", "A"], ["K", "M"]],
      fills: [["S", "O", "A"]]
    },
    hint: "Малый конус подобен исходному с коэффициентом ½. Площади поверхностей подобных тел относятся как квадрат коэффициента подобия.",
    sol: [
      "Малый конус подобен исходному с коэффициентом k = ½.",
      "Площадь полной поверхности умножается на k² = ¼.",
      "S = 48 · ¼ = 12."
    ]
  },
  {
    id: "kon-21", topic: "Конус", group: "сечения и подобие",
    cond: "Объём конуса равен 54. Плоскость, параллельная основанию, делит его высоту в отношении 1 : 2, считая от вершины, и отсекает малый конус. Найдите объём малого конуса.",
    ans: "2",
    scene: {
      bodies: [
        {
          kind: "cone", r: Math.cbrt(81 / Math.PI), h: 2 * Math.cbrt(81 / Math.PI), ghost: true,
          center: "O", apex: "S", axis: true, rim: { A: { ang: 0.65 } }
        },
        {
          kind: "cone", r: Math.cbrt(81 / Math.PI) / 3, h: 2 * Math.cbrt(81 / Math.PI) / 3,
          at: [0, 4 * Math.cbrt(81 / Math.PI) / 3, 0], center: "_k", apex: "_t"
        }
      ]
    },
    labels: [],
    construct: {
      points: {
        K: [0, 4 * Math.cbrt(81 / Math.PI) / 3, 0],
        M: [Math.cbrt(81 / Math.PI) / 3 * Math.cos(0.65), 4 * Math.cbrt(81 / Math.PI) / 3, Math.cbrt(81 / Math.PI) / 3 * Math.sin(0.65)]
      },
      segments: [["S", "A"], ["O", "A"], ["K", "M"]],
      fills: [["S", "O", "A"]]
    },
    hint: "Малый конус подобен исходному; коэффициент подобия равен доле высоты, считая от вершины.",
    sol: [
      "Плоскость отсекает конус, подобный данному с коэффициентом k = ⅓.",
      "Объёмы подобных тел относятся как куб коэффициента: V = 54 · (⅓)³.",
      "V = 54 : 27 = 2."
    ]
  },
  {
    id: "kon-22", topic: "Конус", group: "сечения и подобие",
    cond: "Радиус основания конуса равен 9. Плоскость, параллельная основанию, делит высоту конуса в отношении 2 : 1, считая от вершины. Найдите радиус получившегося сечения.",
    ans: "6",
    scene: {
      bodies: [
        {
          kind: "cone", r: 9, h: 12, ghost: true, center: "O", apex: "S", axis: true,
          rim: { A: { ang: 0.65 } }, edges: [["S", "A"]]
        },
        {
          kind: "custom",
          circles: [{ c: [0, 4, 0], r: 6, plane: "h", col: "amber" }]
        }
      ]
    },
    labels: [],
    construct: {
      points: {
        K: [0, 4, 0],
        M: [6 * Math.cos(0.65), 4, 6 * Math.sin(0.65)]
      },
      segments: [["O", "A", "9"], ["K", "M", "?"]]
    },
    hint: "Сечение — круг с центром на оси. Рассмотрите подобные треугольники с вершиной S: коэффициент равен доле высоты от вершины.",
    sol: [
      "Треугольник SKM подобен треугольнику SOA с коэффициентом SK/SO = 2/3.",
      "KM = OA · 2/3 = 9 · 2/3 = 6."
    ]
  },
  /* ---------- часть конуса ---------- */
  {
    id: "kon-23", topic: "Конус", group: "часть конуса",
    cond: "Объём конуса равен 36. Из конуса вырезали часть, ограниченную двумя полуплоскостями, которые проходят через его ось и образуют угол 90°. Найдите объём вырезанной части.",
    ans: "9",
    scene: {
      bodies: [
        {
          kind: "cone", r: 3, h: 12 / Math.PI, center: "O", apex: "S",
          sector: { ts: Math.PI - 0.65 - 3 * Math.PI / 4, tl: 3 * Math.PI / 2, part: true },
          rim: { A: { ang: 0.65 + Math.PI / 4 }, B: { ang: 0.65 + 3 * Math.PI / 4 } },
          edges: [["S", "A"], ["S", "B"], ["O", "A"], ["O", "B"]]
        },
        { kind: "custom", matKind: "round", faces: [["S", "O", "A"], ["S", "O", "B"]] }
      ]
    },
    labels: [],
    hint: "Объём части конуса пропорционален её центральному углу: часть с углом α составляет α/360 объёма конуса.",
    sol: [
      "Вырезанная часть составляет 90/360 = ¼ объёма конуса.",
      "V = 36 · ¼ = 9."
    ]
  },
  {
    id: "kon-24", topic: "Конус", group: "часть конуса",
    cond: "Объём конуса равен 24. Из конуса вырезали часть, ограниченную двумя полуплоскостями, которые проходят через его ось и образуют угол 120°. Найдите объём вырезанной части.",
    ans: "8",
    scene: {
      bodies: [
        {
          kind: "cone", r: 2.5, h: 11.52 / Math.PI, center: "O", apex: "S",
          sector: { ts: Math.PI - 0.65 - 2 * Math.PI / 3, tl: 4 * Math.PI / 3, part: true },
          rim: { A: { ang: 0.65 + Math.PI / 6 }, B: { ang: 0.65 + 5 * Math.PI / 6 } },
          edges: [["S", "A"], ["S", "B"], ["O", "A"], ["O", "B"]]
        },
        { kind: "custom", matKind: "round", faces: [["S", "O", "A"], ["S", "O", "B"]] }
      ]
    },
    labels: [],
    hint: "Часть конуса между двумя осевыми полуплоскостями составляет такую же долю объёма, какую её угол составляет от 360°.",
    sol: [
      "Вырезанная часть составляет 120/360 = ⅓ объёма конуса.",
      "V = 24 · ⅓ = 8."
    ]
  },
  /* ---------- вода и уровни ---------- */
  {
    id: "kon-25", topic: "Конус", group: "вода и уровни",
    cond: "Сосуд имеет форму конуса, обращённого вершиной вниз. Уровень воды в сосуде достигает половины высоты. Объём воды равен 35 мл. Сколько миллилитров воды нужно долить, чтобы наполнить сосуд доверху?",
    ans: "245",
    scene: {
      bodies: [{
        kind: "cone", r: 3, h: 8, flip: true, axis: true, ghost: true,
        apex: "S", center: "O",
        water: { h: 4, r: 1.5 },
        coordLabels: [
          { t: "h", p: [3, 0, 0], q: [3, 8, 0] },
          { t: "h/2", p: [-3, 0, 0], q: [-3, 4, 0] }
        ]
      }]
    },
    labels: [],
    hint: "Вода образует конус, подобный сосуду с коэффициентом ½. Объёмы подобных тел относятся как куб коэффициента.",
    sol: [
      "Объём воды составляет (½)³ = ⅛ объёма сосуда.",
      "Объём сосуда: 35 · 8 = 280 мл.",
      "Долить: 280 − 35 = 245 мл."
    ]
  },
  {
    id: "kon-26", topic: "Конус", group: "вода и уровни",
    cond: "Сосуд имеет форму конуса, обращённого вершиной вниз. Уровень воды в сосуде достигает трети высоты. Объём воды равен 10 мл. Сколько миллилитров воды нужно долить, чтобы наполнить сосуд доверху?",
    ans: "260",
    scene: {
      bodies: [{
        kind: "cone", r: 3, h: 9, flip: true, axis: true, ghost: true,
        apex: "S", center: "O",
        water: { h: 3, r: 1 },
        coordLabels: [
          { t: "h", p: [3, 0, 0], q: [3, 9, 0] },
          { t: "h/3", p: [-3, 0, 0], q: [-3, 3, 0] }
        ]
      }]
    },
    labels: [],
    hint: "Конус воды подобен сосуду с коэффициентом ⅓, значит объёмы относятся как 1 : 27.",
    sol: [
      "Объём воды составляет (⅓)³ = 1/27 объёма сосуда.",
      "Объём сосуда: 10 · 27 = 270 мл.",
      "Долить: 270 − 10 = 260 мл."
    ]
  },
  {
    id: "kon-27", topic: "Конус", group: "вода и уровни",
    cond: "Сосуд имеет форму конуса, обращённого вершиной вниз. Объём сосуда равен 1200 мл. Воду налили до половины высоты сосуда. Сколько миллилитров воды налито в сосуд?",
    ans: "150",
    scene: {
      bodies: [{
        kind: "cone", r: 4, h: 8, flip: true, axis: true, ghost: true,
        apex: "S", center: "O",
        water: { h: 4, r: 2 },
        coordLabels: [
          { t: "h", p: [4, 0, 0], q: [4, 8, 0] },
          { t: "h/2", p: [-4, 0, 0], q: [-4, 4, 0] }
        ]
      }]
    },
    labels: [],
    hint: "Конус воды подобен сосуду с коэффициентом ½. Во сколько раз его объём меньше объёма сосуда?",
    sol: [
      "Объём воды составляет (½)³ = ⅛ объёма сосуда.",
      "V(воды) = 1200 : 8 = 150 мл."
    ]
  },
  {
    id: "kon-28", topic: "Конус", group: "вода и уровни",
    cond: "Сосуд имеет форму конуса, обращённого вершиной вниз. Объём сосуда равен 540 мл. Воду налили до трети высоты сосуда. Сколько миллилитров воды налито в сосуд?",
    ans: "20",
    scene: {
      bodies: [{
        kind: "cone", r: 4, h: 9, flip: true, axis: true, ghost: true,
        apex: "S", center: "O",
        water: { h: 3, r: 4 / 3 },
        coordLabels: [
          { t: "h", p: [4, 0, 0], q: [4, 9, 0] },
          { t: "h/3", p: [-4, 0, 0], q: [-4, 3, 0] }
        ]
      }]
    },
    labels: [],
    hint: "Конус воды подобен сосуду с коэффициентом ⅓. Объёмы подобных тел относятся как куб коэффициента.",
    sol: [
      "Объём воды составляет (⅓)³ = 1/27 объёма сосуда.",
      "V(воды) = 540 : 27 = 20 мл."
    ]
  },
  {
    id: "kon-29", topic: "Конус", group: "вода и уровни",
    cond: "Сосуд имеет форму конуса, обращённого вершиной вниз. Объём сосуда равен 81 мл. Воду налили до уровня 2/3 высоты сосуда. Сколько миллилитров воды налито в сосуд?",
    ans: "24",
    scene: {
      bodies: [{
        kind: "cone", r: 3, h: 27 / Math.PI, flip: true, axis: true, ghost: true,
        apex: "S", center: "O",
        water: { h: 18 / Math.PI, r: 2 },
        coordLabels: [
          { t: "h", p: [3, 0, 0], q: [3, 27 / Math.PI, 0] },
          { t: "2h/3", p: [-3, 0, 0], q: [-3, 18 / Math.PI, 0] }
        ]
      }]
    },
    labels: [],
    hint: "Вода образует конус, подобный сосуду с коэффициентом 2/3. Объёмы подобных тел относятся как куб коэффициента.",
    sol: [
      "Конус воды подобен сосуду с коэффициентом 2/3.",
      "V(воды) = 81 · (2/3)³ = 81 · 8/27.",
      "V(воды) = 24 мл."
    ]
  }
];

/* Старый банк, тема «Шар»: 8 задач открытого банка задания 3
   (Решу ЕГЭ; id — номер задачи на math-ege.sdamgia.ru/problem?id=…).
   Перенесены ДОСЛОВНО из опубликованной линейки
   trainers/ege-profile-stereometry-3d/js/data.js (коммит 4dc0592):
   поля, числа, тексты и порядок не менялись — под этими id у учеников
   записан прогресс (stereo3.status), а позиция задачи в теме —
   в stereo3.last.<тема>. Сцены строит engine-legacy.js (scene.prims / dims),
   общие константы (SQ2, SQ3, SQ5, HALF_PTS, HALF_FACES) — тоже там.
   Не переименовывать и не переставлять.
   Исключения (решение владельца 24.09.2026, только линейка курса):
     у 27059, 27125, 27163, 27174, 525372 добавлено поле unit (длина условия на единицу сцены: сцена в масштабе k ≠ 1).
   id, условия, ответы, подсказки, решения и порядок — прежние;
   список и причины — legacy-parity.js. */
const P_LEGACY_SHAR = [
  /* ================= ШАР ================= */
  { id:"27059", topic:"Шар", ans:"12",
    cond:"Площадь большого круга шара равна 3. Найдите площадь поверхности шара.",
    scene:{ prims:[{kind:"sphere",r:1,disc:true}] },
    unit:Math.sqrt(3/Math.PI),   /* длина условия на единицу сцены: площадь большого круга 3 ⇒ R = √(3/π), на сцене R = 1 */
    hint:"S шара = 4πR² — в 4 раза больше площади большого круга πR².",
    sol:["Sшара = 4·πR² = 4·3 = 12."] },
  { id:"27072", topic:"Шар", ans:"4",
    cond:"Даны два шара. Радиус первого шара в 2 раза больше радиуса второго. Во сколько раз площадь поверхности первого шара больше площади поверхности второго?",
    scene:{ prims:[{kind:"sphere",r:2},{kind:"sphere",r:1,px:"2",ghost:true,hideLabels:true,at:[3.4,0,0]}] },
    hint:"Площади относятся как квадраты радиусов.",
    sol:["S₁/S₂ = (R₁/R₂)² = 2² = 4."] },
  { id:"27097", topic:"Шар", ans:"27",
    cond:"Во сколько раз увеличится объём шара, если его радиус увеличить в три раза?",
    scene:{ prims:[{kind:"sphere",r:1},{kind:"sphere",r:3,px:"2",ghost:true,hideLabels:true,at:[4.6,0,0]}] },
    hint:"Объём растёт как куб радиуса.",
    sol:["V = (4/3)πR³ ⇒ увеличится в 3³ = 27 раз."] },
  { id:"27125", topic:"Шар", ans:"12",
    cond:"Радиусы трёх шаров равны 6, 8 и 10. Найдите радиус шара, объём которого равен сумме их объёмов.",
    scene:{ prims:[{kind:"sphere",r:0.6},{kind:"sphere",r:0.8,px:"2",hideLabels:true,at:[1.6,0,0]},{kind:"sphere",r:1,px:"3",hideLabels:true,at:[3.6,0,0]},{kind:"sphere",r:1.2,px:"4",ghost:true,hideLabels:true,at:[6,0,0]}] },
    unit:10,   /* длина условия на единицу сцены: радиусы 6, 8, 10 на сцене 0,6; 0,8; 1 */
    hint:"R³ = 6³ + 8³ + 10³.",
    sol:["R³ = 216 + 512 + 1000 = 1728.","R = ∛1728 = 12."] },
  { id:"27162", topic:"Шар", ans:"9",
    cond:"Объём первого шара в 27 раз больше объёма второго. Во сколько раз площадь поверхности первого шара больше площади поверхности второго?",
    scene:{ prims:[{kind:"sphere",r:1.5},{kind:"sphere",r:0.5,px:"2",ghost:true,hideLabels:true,at:[2.4,0,0]}] },
    hint:"Из отношения объёмов найдите отношение радиусов.",
    sol:["R₁/R₂ = ∛27 = 3.","S₁/S₂ = 3² = 9."] },
  { id:"27163", topic:"Шар", ans:"10",
    cond:"Радиусы двух шаров равны 6 и 8. Найдите радиус шара, площадь поверхности которого равна сумме площадей поверхностей двух данных шаров.",
    scene:{ prims:[{kind:"sphere",r:0.6},{kind:"sphere",r:0.8,px:"2",hideLabels:true,at:[1.6,0,0]},{kind:"sphere",r:1,px:"3",ghost:true,hideLabels:true,at:[3.6,0,0]}] },
    unit:10,   /* длина условия на единицу сцены: радиусы 6, 8 на сцене 0,6; 0,8 */
    hint:"R² = 6² + 8².",
    sol:["R² = 36 + 64 = 100 ⇒ R = 10."] },
  { id:"27174", topic:"Шар", ans:"144",
    cond:"Объём шара равен 288π. Найдите площадь его поверхности, делённую на π.",
    scene:{ prims:[{kind:"sphere",r:1}] },
    unit:6,   /* длина условия на единицу сцены: V = 288π ⇒ R = 6, на сцене R = 1 */
    hint:"(4/3)πR³ = 288π ⇒ R³ = 216.",
    sol:["R³ = 288·3/4 = 216 ⇒ R = 6.","S = 4πR² = 144π ⇒ S/π = 144."] },
  { id:"525372", topic:"Шар", ans:"6",
    cond:"Площадь поверхности шара равна 24. Найдите площадь большого круга шара.",
    scene:{ prims:[{kind:"sphere",r:1,disc:true}] },
    unit:Math.sqrt(6/Math.PI),   /* длина условия на единицу сцены: S = 24 ⇒ R = √(6/π), на сцене R = 1 */
    hint:"Площадь большого круга в 4 раза меньше площади сферы.",
    sol:["Sкруга = Sшара/4 = 24/4 = 6."] },
];

/* Банк «Шар» — Задание 3 ЕГЭ (профиль). 8 задач. */
const P_SHAR = [
  {
    id: "shar-01", topic: "Шар", group: "объём",
    cond: "Радиус шара равен 3. Найдите V/π, где V — объём шара.",
    ans: "36",
    scene: {
      bodies: [
        { kind: "sphere", R: 3, center: "O", rim: { A: { ang: 0.55 } }, edges: [["O", "A"]] }
      ]
    },
    labels: [["O", "A", "3"]],
    hint: "Объём шара выражается через радиус: V = 4/3·πR³. Подставьте радиус и поделите на π.",
    sol: [
      "V = 4/3·πR³ = 4/3·π·3³ = 36π.",
      "V/π = 36."
    ]
  },
  {
    id: "shar-02", topic: "Шар", group: "объём",
    cond: "Объём шара равен 288π. Найдите радиус шара.",
    ans: "6",
    scene: {
      bodies: [
        { kind: "sphere", R: 6, center: "O", rim: { B: { ang: 0.55 } }, edges: [["O", "B"]] }
      ]
    },
    labels: [["O", "B", "?"]],
    hint: "Выразите R³ из формулы объёма шара V = 4/3·πR³ и подберите куб.",
    sol: [
      "4/3·πR³ = 288π, откуда R³ = 288·3/4 = 216.",
      "R = 6, так как 6³ = 216."
    ]
  },
  {
    id: "shar-03", topic: "Шар", group: "поверхность",
    cond: "Радиус шара равен 4. Найдите S/π, где S — площадь поверхности шара.",
    ans: "64",
    scene: {
      bodies: [
        { kind: "sphere", R: 4, center: "O", rim: { A: { ang: 0.55 } }, edges: [["O", "A"]] }
      ]
    },
    labels: [["O", "A", "4"]],
    hint: "Площадь поверхности шара: S = 4πR².",
    sol: [
      "S = 4πR² = 4·π·4² = 64π.",
      "S/π = 64."
    ]
  },
  {
    id: "shar-04", topic: "Шар", group: "поверхность",
    cond: "Площадь поверхности шара равна 100π. Найдите радиус шара.",
    ans: "5",
    scene: {
      bodies: [
        { kind: "sphere", R: 5, center: "O", rim: { A: { ang: 0.55 } }, edges: [["O", "A"]] }
      ]
    },
    labels: [["O", "A", "?"]],
    hint: "Выразите R² из формулы площади поверхности S = 4πR².",
    sol: [
      "4πR² = 100π, откуда R² = 25.",
      "R = 5."
    ]
  },
  {
    id: "shar-05", topic: "Шар", group: "объём",
    cond: "Радиус первого шара в два раза больше радиуса второго. Во сколько раз объём первого шара больше объёма второго?",
    ans: "8",
    scene: {
      bodies: [
        { kind: "sphere", R: 4, center: "O" },
        { kind: "sphere", R: 2, at: [8, 2, 0], center: "O1" },
        { kind: "custom", pts: { T: [0, 8, 0], T1: [8, 4, 0] }, edges: [["O", "T"], ["O1", "T1"]] }
      ]
    },
    labels: [["O", "T", "2R"], ["O1", "T1", "R"]],
    hint: "Объёмы шаров относятся как кубы их радиусов.",
    sol: [
      "Отношение радиусов равно 2.",
      "Отношение объёмов: 2³ = 8."
    ]
  },
  {
    id: "shar-06", topic: "Шар", group: "поверхность",
    cond: "Во сколько раз увеличится площадь поверхности шара, если его радиус увеличить в два раза?",
    ans: "4",
    scene: {
      bodies: [
        { kind: "sphere", R: 2, center: "O" },
        { kind: "sphere", R: 4, at: [8, 4, 0], center: "O1" },
        { kind: "custom", pts: { T: [0, 4, 0], T1: [8, 8, 0] }, edges: [["O", "T"], ["O1", "T1"]] }
      ]
    },
    labels: [["O", "T", "R"], ["O1", "T1", "2R"]],
    hint: "Площади поверхностей шаров относятся как квадраты их радиусов.",
    sol: [
      "S = 4πR², площадь пропорциональна квадрату радиуса.",
      "При удвоении радиуса площадь увеличится в 2² = 4 раза."
    ]
  },
  {
    id: "shar-07", topic: "Шар", group: "большой круг",
    cond: "Сечение шара плоскостью, проходящей через его центр, — круг площадью 17. Найдите площадь поверхности шара.",
    ans: "68",
    scene: {
      bodies: [
        { kind: "sphere", R: Math.sqrt(17 / Math.PI), center: "O" },
        { kind: "custom", surfaces: [{ type: "disc", c: [0, Math.sqrt(17 / Math.PI), 0], r: Math.sqrt(17 / Math.PI) }] }
      ]
    },
    labels: [],
    hint: "Площадь поверхности шара вчетверо больше площади его большого круга.",
    sol: [
      "Большой круг — сечение через центр: его площадь πR² = 17.",
      "Площадь поверхности: S = 4πR² = 4·17 = 68."
    ]
  },
  {
    id: "shar-08", topic: "Шар", group: "сечение",
    cond: "Радиус шара равен 5. Шар пересечён плоскостью, находящейся на расстоянии 3 от центра шара. Найдите радиус сечения.",
    ans: "4",
    scene: {
      bodies: [
        { kind: "sphere", R: 5, center: "O", section: { y: 3, name: "O1" } },
        { kind: "custom", pts: { M: [4, 8, 0] }, edges: [["O", "O1"], ["O1", "M"], ["O", "M"]] }
      ]
    },
    labels: [["O", "O1", "3"], ["O", "M", "5"], ["O1", "M", "?"]],
    hint: "Радиус шара, расстояние от центра до плоскости и радиус сечения образуют прямоугольный треугольник.",
    sol: [
      "Треугольник OO₁M прямоугольный, гипотенуза OM = R = 5.",
      "O₁M² = OM² − OO₁² = 25 − 9 = 16.",
      "Радиус сечения O₁M = 4."
    ]
  }
];

/* Старый банк, тема «Комбинации тел»: 14 задач открытого банка задания 3
   (Решу ЕГЭ; id — номер задачи на math-ege.sdamgia.ru/problem?id=…).
   Перенесены ДОСЛОВНО из опубликованной линейки
   trainers/ege-profile-stereometry-3d/js/data.js (коммит 4dc0592):
   поля, числа, тексты и порядок не менялись — под этими id у учеников
   записан прогресс (stereo3.status), а позиция задачи в теме —
   в stereo3.last.<тема>. Сцены строит engine-legacy.js (scene.prims / dims),
   общие константы (SQ2, SQ3, SQ5, HALF_PTS, HALF_FACES) — тоже там.
   Не переименовывать и не переставлять.
   Исключения (решение владельца 24.09.2026, только линейка курса):
     у 5077, 245348 исправлен чертёж (scene / labels / construct);
     у 5077, 27051, 27096, 27214, 245348, 245350, 245351, 324449 добавлено поле unit (длина условия на единицу сцены: сцена в масштабе k ≠ 1).
   id, условия, ответы, подсказки, решения и порядок — прежние;
   список и причины — legacy-parity.js. */
const P_LEGACY_KOMB = [
  /* ================= КОМБИНАЦИИ ТЕЛ ================= */
  { id:"5077", topic:"Комбинации тел", ans:"12",
    cond:"Шар вписан в цилиндр. Площадь полной поверхности цилиндра равна 18. Найдите площадь поверхности шара.",
    scene:{ prims:[{kind:"cyl",r:1.5,h:3},{kind:"sphere",r:1.5,px:"2",ghost:true,hideLabels:true}] },
    unit:Math.sqrt(18/(13.5*Math.PI)),   /* длина условия на единицу сцены: Sполн цилиндра = 18, на сцене r = 1,5, h = 3: S = 13,5π */
    hint:"Для вписанного шара h = 2r: Sцил = 6πr², Sшара = 4πr².",
    sol:["Sполн.цил = 2πr² + 2πr·2r = 6πr² = 18 ⇒ πr² = 3.","Sшара = 4πr² = 12."] },
  { id:"27043", topic:"Комбинации тел", ans:"8",
    cond:"В куб вписан шар радиуса 1. Найдите объём куба.",
    scene:{ prims:[{kind:"box",a:2,b:2,c:2},{kind:"sphere",r:1,ghost:true,hideLabels:true,at:[1,1,0]}] },
    labels:[["A","B","?"]],
    hint:"Ребро куба равно диаметру вписанного шара.",
    sol:["a = 2R = 2.","V = 2³ = 8."] },
  { id:"27051", topic:"Комбинации тел", ans:"75",
    cond:"Цилиндр и конус имеют общие основание и высоту. Объём конуса равен 25. Найдите объём цилиндра.",
    scene:{ prims:[{kind:"cyl",r:2,h:3},{kind:"cone",r:2,h:3,ghost:true,hideLabels:true}] },
    unit:Math.cbrt(25/(4*Math.PI)),   /* длина условия на единицу сцены: Vконуса = 25, на сцене r = 2, h = 3: V = 4π */
    hint:"Vконуса = ⅓ Vцилиндра.",
    sol:["Vцил = 3·Vкон = 3·25 = 75."] },
  { id:"27064", topic:"Комбинации тел", ans:"8",
    cond:"Правильная четырёхугольная призма описана около цилиндра, радиус основания и высота которого равны 1. Найдите площадь боковой поверхности призмы.",
    scene:{ prims:[{kind:"prism",n:4,a:2,h:1},{kind:"cyl",r:1,h:1,ghost:true,hideLabels:true}] },
    hint:"Сторона основания призмы равна диаметру цилиндра.",
    sol:["a = 2r = 2; h = 1.","Sбок = 4·2·1 = 8."] },
  { id:"27096", topic:"Комбинации тел", ans:"50",
    cond:"Цилиндр и конус имеют общие основание и высоту. Найдите объём конуса, если объём цилиндра равен 150.",
    scene:{ prims:[{kind:"cyl",r:2,h:3,ghost:true},{kind:"cone",r:2,h:3,hideLabels:true}] },
    unit:Math.cbrt(150/(12*Math.PI)),   /* длина условия на единицу сцены: Vцил = 150, на сцене r = 2, h = 3: V = 12π */
    hint:"Vконуса = ⅓ Vцилиндра.",
    sol:["Vкон = 150/3 = 50."] },
  { id:"27105", topic:"Комбинации тел", ans:"3",
    cond:"Объём куба, описанного около сферы, равен 216. Найдите радиус сферы.",
    scene:{ prims:[{kind:"box",a:6,b:6,c:6},{kind:"sphere",r:3,ghost:true,hideLabels:true,at:[3,3,0]}] },
    construct:{ segments:[["O","P","?"]] },
    hint:"Диаметр сферы равен ребру куба.",
    sol:["a = ∛216 = 6.","R = a/2 = 3."] },
  { id:"27126", topic:"Комбинации тел", ans:"4,5",
    cond:"В куб с ребром 3 вписан шар. Найдите объём этого шара, делённый на π.",
    scene:{ prims:[{kind:"box",a:3,b:3,c:3},{kind:"sphere",r:1.5,ghost:true,hideLabels:true,at:[1.5,1.5,0]}] },
    labels:[["A","B","3"]],
    hint:"R = 3/2. V = (4/3)πR³.",
    sol:["R = 1,5.","V/π = (4/3)·1,5³ = (4/3)·3,375 = 4,5."] },
  { id:"27214", topic:"Комбинации тел", ans:"9,5",
    cond:"Объём тетраэдра равен 19. Найдите объём многогранника, вершинами которого являются середины рёбер данного тетраэдра.",
    scene:{ prims:[{kind:"tetra",a:4}] },
    unit:Math.cbrt(19*6*SQ2/64),   /* длина условия на единицу сцены: V = 19, на сцене тетраэдр с ребром 4: V = 64/(6√2) */
    construct:{ points:{MAB:["mid","A","B"],MAC:["mid","A","C"],MAD:["mid","A","D"],MBC:["mid","B","C"],MBD:["mid","B","D"],MCD:["mid","C","D"]},
      solid:[["MAB","MAC","MAD"],["MAB","MBC","MBD"],["MAC","MBC","MCD"],["MAD","MBD","MCD"],
             ["MAB","MBC","MAC"],["MAB","MBD","MAD"],["MAC","MCD","MAD"],["MBC","MCD","MBD"]] },
    hint:"Отсекаются 4 «угловых» тетраэдра, каждый объёмом V/8.",
    sol:["Середины рёбер образуют октаэдр; отсекаются 4 тетраэдра по (1/2)³ = 1/8 объёма.","V = 19 − 4·19/8 = 19/2 = 9,5."] },
  { id:"245348", topic:"Комбинации тел", ans:"22",
    cond:"Цилиндр описан около шара. Объём цилиндра равен 33. Найдите объём шара.",
    scene:{ prims:[{kind:"cyl",r:1.5,h:3},{kind:"sphere",r:1.5,px:"2",ghost:true,hideLabels:true}] },
    unit:Math.cbrt(33/(6.75*Math.PI)),   /* длина условия на единицу сцены: Vцил = 33, на сцене r = 1,5, h = 3: V = 6,75π */
    hint:"Vшара = ⅔ Vцилиндра (h = 2r).",
    sol:["Vцил = πr²·2r = 2πr³; Vшара = (4/3)πr³.","Vшара = ⅔·33 = 22."] },
  { id:"245350", topic:"Комбинации тел", ans:"15",
    cond:"Конус и цилиндр имеют общее основание и общую высоту (конус вписан в цилиндр). Вычислите объём цилиндра, если объём конуса равен 5.",
    scene:{ prims:[{kind:"cyl",r:2,h:3},{kind:"cone",r:2,h:3,ghost:true,hideLabels:true}] },
    unit:Math.cbrt(5/(4*Math.PI)),   /* длина условия на единицу сцены: Vконуса = 5, на сцене r = 2, h = 3: V = 4π */
    hint:"Vцилиндра = 3·Vконуса.",
    sol:["Vцил = 3·5 = 15."] },
  { id:"245351", topic:"Комбинации тел", ans:"7",
    cond:"Конус вписан в шар. Радиус основания конуса равен радиусу шара. Объём шара равен 28. Найдите объём конуса.",
    scene:{ prims:[{kind:"cone",r:2,h:2},{kind:"sphere",r:2,zc:0,ghost:true,hideLabels:true}] },
    unit:Math.cbrt(28*3/(32*Math.PI)),   /* длина условия на единицу сцены: Vшара = 28, на сцене R = 2: V = 32π/3 */
    hint:"Основание конуса проходит через центр шара, высота конуса равна R.",
    sol:["Vшара = (4/3)πR³ = 28; Vкон = ⅓πR²·R = ⅓πR³.","Vкон = 28·(1/4) = 7."] },
  { id:"245354", topic:"Комбинации тел", ans:"3",
    cond:"Правильная четырёхугольная призма описана около цилиндра, радиус основания которого равен 2. Площадь боковой поверхности призмы равна 48. Найдите высоту цилиндра.",
    scene:{ prims:[{kind:"prism",n:4,a:4,h:3},{kind:"cyl",r:2,h:3,ghost:true,hideLabels:true}] },
    construct:{ segments:[["O","P","2"]] },
    hint:"Сторона основания призмы 2r = 4; Sбок = 4a·h.",
    sol:["a = 4.","h = 48/(4·4) = 3."] },
  { id:"324449", topic:"Комбинации тел", ans:"36",
    cond:"Шар, объём которого равен 6π, вписан в куб. Найдите объём куба.",
    scene:{ prims:[{kind:"box",a:2,b:2,c:2},{kind:"sphere",r:1,ghost:true,hideLabels:true,at:[1,1,0]}] },
    unit:Math.cbrt(4.5),   /* длина условия на единицу сцены: Vшара = 6π ⇒ R³ = 4,5, на сцене R = 1 */
    hint:"(4/3)πr³ = 6π ⇒ r³ = 4,5; ребро куба 2r.",
    sol:["r³ = 6·3/4 = 4,5.","Vкуба = (2r)³ = 8r³ = 8·4,5 = 36."] },
  { id:"505096", topic:"Комбинации тел", ans:"1728",
    cond:"Куб описан около сферы радиуса 6. Найдите объём куба.",
    scene:{ prims:[{kind:"box",a:12,b:12,c:12},{kind:"sphere",r:6,ghost:true,hideLabels:true,at:[6,6,0]}] },
    construct:{ segments:[["O","P","6"]] },
    hint:"Ребро куба равно диаметру сферы.",
    sol:["a = 2R = 12.","V = 12³ = 1728."] },
];

/* Банк «Комбинации тел» — Задание 3 ЕГЭ (профиль). 13 задач
   (komb-07 убрана 24.09.2026 как дубль старой задачи 27051). */
const P_KOMB = [
  {
    id: "komb-01", topic: "Комбинации тел", group: "шар и куб",
    cond: "Шар радиуса 3 вписан в куб. Найдите объём куба.",
    ans: "216",
    scene: {
      bodies: [
        { kind: "box", a: 6, b: 6, h: 6, ghost: true },
        { kind: "sphere", R: 3, at: [3, 3, 3], center: "O", rim: { K: { ang: 0.55 } }, edges: [["O", "K"]] }
      ]
    },
    labels: [["O", "K", "3"]],
    construct: {
      points: { M: [0.5, 0, 0.5], N: [0.5, 1, 0.5] },
      segments: [["M", "N"]]
    },
    hint: "Шар касается всех граней куба, поэтому ребро куба равно диаметру шара.",
    sol: [
      "Ребро куба равно диаметру шара: a = 2R = 6.",
      "V = a³ = 6³ = 216."
    ]
  },
  {
    id: "komb-02", topic: "Комбинации тел", group: "шар и куб",
    cond: "Шар вписан в куб, объём которого равен 1000. Найдите радиус шара.",
    ans: "5",
    scene: {
      bodies: [
        { kind: "box", a: 10, b: 10, h: 10, ghost: true },
        { kind: "sphere", R: 5, at: [5, 5, 5], center: "O", rim: { K: { ang: 0.55 } }, edges: [["O", "K"]] }
      ]
    },
    labels: [["O", "K", "?"]],
    hint: "Найдите ребро куба по его объёму; диаметр вписанного шара равен ребру.",
    sol: [
      "Ребро куба: a³ = 1000, a = 10.",
      "R = a/2 = 5."
    ]
  },
  {
    id: "komb-03", topic: "Комбинации тел", group: "описанный шар",
    cond: "Куб с ребром 4 вписан в шар. Найдите квадрат диаметра шара.",
    ans: "48",
    scene: {
      bodies: [
        { kind: "box", a: 4, b: 4, h: 4 },
        { kind: "sphere", R: Math.sqrt(12), at: [2, 2, 2], center: "O", ghost: true }
      ]
    },
    labels: [["A", "B", "4"]],
    construct: {
      segments: [["A", "C"], ["A", "C1", "?"]],
      fills: [["A", "C", "C1"]]
    },
    hint: "Диаметр описанного шара равен диагонали куба. Найдите квадрат диагонали по трём рёбрам.",
    sol: [
      "Диагональ куба является диаметром шара.",
      "d² = a² + a² + a² = 16 + 16 + 16 = 48."
    ]
  },
  {
    id: "komb-04", topic: "Комбинации тел", group: "шар и цилиндр",
    cond: "Шар вписан в цилиндр. Во сколько раз объём цилиндра больше объёма шара?",
    ans: "1,5",
    scene: {
      bodies: [
        { kind: "cyl", r: 3, h: 6, ghost: true, centers: ["P", "P1"], rim: { K: { ang: 0.55, at: "bot" } }, edges: [["P", "K"]] },
        { kind: "sphere", R: 3, center: "O" }
      ]
    },
    labels: [["P", "K", "r"]],
    hint: "Радиус цилиндра равен радиусу шара, а высота — диаметру. Сравните πr²·2r и 4/3·πr³.",
    sol: [
      "V цилиндра = πr²·2r = 2πr³.",
      "V шара = 4/3·πr³.",
      "Отношение: 2πr³ ÷ 4/3·πr³ = 1,5."
    ]
  },
  {
    id: "komb-05", topic: "Комбинации тел", group: "шар и цилиндр",
    cond: "Шар радиуса 4 вписан в цилиндр. Найдите S/π, где S — площадь боковой поверхности цилиндра.",
    ans: "64",
    scene: {
      bodies: [
        { kind: "cyl", r: 4, h: 8, ghost: true, centers: ["P", "P1"], rim: { A: { ang: 0.55, at: "bot" }, A1: { ang: 0.55, at: "top" } } },
        { kind: "sphere", R: 4, center: "O", rim: { K: { ang: 0.55 } }, edges: [["O", "K"]] }
      ]
    },
    labels: [["O", "K", "4"]],
    construct: {
      segments: [["P", "P1"], ["A", "A1"]]
    },
    hint: "У описанного цилиндра r = R и h = 2R. Боковая поверхность: S = 2πrh.",
    sol: [
      "r = R = 4, h = 2R = 8.",
      "S = 2πrh = 2π·4·8 = 64π, S/π = 64."
    ]
  },
  {
    id: "komb-06", topic: "Комбинации тел", group: "шар и цилиндр",
    cond: "Шар объёмом 24 вписан в цилиндр. Найдите объём цилиндра.",
    ans: "36",
    scene: {
      bodies: [
        { kind: "cyl", r: Math.cbrt(18 / Math.PI), h: 2 * Math.cbrt(18 / Math.PI), ghost: true, centers: ["P", "P1"], hideLabels: true },
        { kind: "sphere", R: Math.cbrt(18 / Math.PI), center: "O" }
      ]
    },
    labels: [],
    hint: "Радиус цилиндра равен радиусу шара, высота — диаметру. Выразите оба объёма через r.",
    sol: [
      "V цилиндра = πr²·2r = 2πr³, V шара = 4/3·πr³.",
      "V цилиндра = 3/2·V шара = 1,5·24 = 36."
    ]
  },
  /* komb-07 убрана 24.09.2026: дубль задачи 27051 старого банка (problems-legacy-komb.js) — та же модель, те же числа. */
  {
    id: "komb-08", topic: "Комбинации тел", group: "конус и цилиндр",
    cond: "В цилиндр объёмом 114 помещён конус: их основания совпадают, а вершина конуса — в центре другого основания цилиндра. Найдите объём конуса.",
    ans: "38",
    scene: {
      bodies: [
        { kind: "cyl", r: 2.5, h: 114 / (6.25 * Math.PI), ghost: true, centers: ["P", "P1"], hideLabels: true },
        { kind: "cone", r: 2.5, h: 114 / (6.25 * Math.PI), apex: "S", center: "O", axis: true }
      ]
    },
    labels: [],
    hint: "Объём конуса составляет треть объёма цилиндра с теми же основанием и высотой.",
    sol: [
      "V конуса = 1/3·V цилиндра.",
      "V конуса = 114 : 3 = 38."
    ]
  },
  {
    id: "komb-09", topic: "Комбинации тел", group: "описанный шар",
    cond: "Прямоугольный параллелепипед с рёбрами 3, 4 и 12 вписан в шар. Найдите радиус шара.",
    ans: "6,5",
    scene: {
      bodies: [
        { kind: "box", a: 12, b: 4, h: 3 },
        { kind: "sphere", R: 6.5, at: [6, 1.5, 2], center: "O", ghost: true },
        { kind: "custom", edges: [["O", "A"]] }
      ]
    },
    labels: [["A", "B", "12"], ["B", "C", "4"], ["C", "C1", "3"], ["O", "A", "?"]],
    construct: {
      segments: [["A", "C"], ["A", "C1"]],
      fills: [["A", "C", "C1"]]
    },
    hint: "Диаметр описанного шара равен диагонали параллелепипеда: d² = a² + b² + c².",
    sol: [
      "d² = 3² + 4² + 12² = 9 + 16 + 144 = 169, d = 13.",
      "R = d/2 = 6,5."
    ]
  },
  {
    id: "komb-10", topic: "Комбинации тел", group: "призма и цилиндр",
    cond: "Правильная четырёхугольная призма, сторона основания которой равна 4, а высота равна 5, вписана в цилиндр. Найдите V/π, где V — объём цилиндра.",
    ans: "40",
    scene: {
      bodies: [
        { kind: "cyl", r: Math.sqrt(8), h: 5, ghost: true, centers: ["P", "P1"], hideLabels: true },
        { kind: "prism", n: 4, side: 4, h: 5 }
      ]
    },
    labels: [["A", "B", "4"], ["B", "B1", "5"]],
    construct: {
      segments: [["A", "C"], ["B", "D"]]
    },
    hint: "Радиус цилиндра равен половине диагонали основания призмы.",
    sol: [
      "Диагональ основания: 4√2, поэтому r = 2√2 и r² = 8.",
      "V = πr²h = π·8·5 = 40π, V/π = 40."
    ]
  },
  {
    id: "komb-11", topic: "Комбинации тел", group: "призма и цилиндр",
    cond: "Цилиндр вписан в правильную четырёхугольную призму со стороной основания 6 и высотой 7. Найдите V/π, где V — объём цилиндра.",
    ans: "63",
    scene: {
      bodies: [
        { kind: "prism", n: 4, side: 6, h: 7, ghost: true },
        { kind: "cyl", r: 3, h: 7, centers: ["P", "P1"] }
      ]
    },
    labels: [["C", "D", "6"], ["D", "D1", "7"]],
    construct: {
      points: { M: ["mid", "A", "D"], N: ["mid", "A", "B"] },
      segments: [["P", "M"], ["P", "N"]]
    },
    hint: "Цилиндр касается боковых граней призмы, поэтому его радиус равен половине стороны основания.",
    sol: [
      "r = 6/2 = 3.",
      "V = πr²h = π·9·7 = 63π, V/π = 63."
    ]
  },
  {
    id: "komb-12", topic: "Комбинации тел", group: "шар и куб",
    cond: "Шар вписан в куб. Объём шара равен 4,5π. Найдите объём куба.",
    ans: "27",
    scene: {
      bodies: [
        { kind: "box", a: 3, b: 3, h: 3, ghost: true },
        { kind: "sphere", R: 1.5, at: [1.5, 1.5, 1.5], center: "O" }
      ]
    },
    labels: [],
    hint: "Найдите радиус шара из его объёма; ребро куба равно диаметру шара.",
    sol: [
      "4/3·πR³ = 4,5π, откуда R³ = 3,375 и R = 1,5.",
      "Ребро куба: a = 2R = 3, V = 3³ = 27."
    ]
  },
  {
    id: "komb-13", topic: "Комбинации тел", group: "шар и куб",
    cond: "Шар вписан в куб, объём которого равен 1728. Найдите V/π, где V — объём шара.",
    ans: "288",
    scene: {
      bodies: [
        { kind: "box", a: 12, b: 12, h: 12, ghost: true },
        { kind: "sphere", R: 6, at: [6, 6, 6], center: "O" }
      ]
    },
    labels: [],
    hint: "Ребро куба равно диаметру шара. Сначала найдите ребро, затем радиус.",
    sol: [
      "a³ = 1728, a = 12, значит R = 6.",
      "V = 4/3·πR³ = 4/3·π·216 = 288π, V/π = 288."
    ]
  },
  {
    id: "komb-14", topic: "Комбинации тел", group: "пирамида и конус",
    cond: "Правильная четырёхугольная пирамида вписана в конус: их вершины совпадают, а вершины основания пирамиды лежат на окружности основания конуса. Радиус основания конуса равен 5. Найдите квадрат стороны основания пирамиды.",
    ans: "50",
    scene: {
      bodies: [
        { kind: "cone", r: 5, h: 6, ghost: true, apex: "S", center: "O", axis: true },
        { kind: "pyramid", n: 4, R: 5, h: 6, apex: "S" },
        { kind: "custom", edges: [["O", "D"]] }
      ]
    },
    labels: [["O", "D", "5"], ["A", "B", "?"]],
    construct: {
      segments: [["A", "C"], ["B", "D"]],
      fills: [["A", "B", "C", "D"]]
    },
    hint: "Диагональ основания пирамиды — диаметр окружности основания конуса. Свяжите сторону квадрата с его диагональю.",
    sol: [
      "Диагональ квадрата основания: d = 2R = 10.",
      "a² = d²/2 = 100/2 = 50."
    ]
  }
];

const P_RAZV = [
  /* ---------- сектор → конус ---------- */
  {
    id: "razv-01", topic: "Развёртки", group: "сектор → конус",
    cond: "Из круга радиуса 8 вырезали сектор с углом 90° и свернули из него боковую поверхность конуса. Найдите радиус основания этого конуса.",
    ans: "2",
    scene: {
      bodies: [{
        kind: "cone", r: 2, h: Math.sqrt(60), center: "O", apex: "S", axis: true,
        sector: { ts: Math.PI - 0.65 - Math.PI / 4, tl: Math.PI / 2 },
        rim: { A: { ang: 0.65 + Math.PI / 4 - Math.PI / 2 } },
        edges: [["S", "A"], ["O", "A"]]
      }]
    },
    labels: [["S", "A", "8"], ["O", "A", "?"]],
    hint: "Дуга сектора при свёртывании становится окружностью основания, а радиус круга — образующей.",
    sol: [
      "Длина дуги: 2π · 8 · (90/360) — это длина окружности основания 2πr.",
      "r = 8 · 90/360 = 2."
    ]
  },
  {
    id: "razv-02", topic: "Развёртки", group: "сектор → конус",
    cond: "Из круга радиуса 9 вырезали сектор с углом 120° и свернули из него боковую поверхность конуса. Найдите радиус основания этого конуса.",
    ans: "3",
    scene: {
      bodies: [{
        kind: "cone", r: 3, h: Math.sqrt(72), center: "O", apex: "S", axis: true,
        sector: { ts: Math.PI - 0.65 - Math.PI / 3, tl: 2 * Math.PI / 3 },
        rim: { A: { ang: 0.65 + Math.PI / 3 - Math.PI / 2 } },
        edges: [["S", "A"], ["O", "A"]]
      }]
    },
    labels: [["S", "A", "9"], ["O", "A", "?"]],
    hint: "Длина дуги сектора равна длине окружности основания конуса.",
    sol: [
      "2π · 9 · (120/360) = 2πr.",
      "r = 9 · 1/3 = 3."
    ]
  },
  {
    id: "razv-03", topic: "Развёртки", group: "сектор → конус",
    cond: "Из круга радиуса 7 вырезали полукруг и свернули из него боковую поверхность конуса. Найдите радиус основания этого конуса.",
    ans: "3,5",
    scene: {
      bodies: [{
        kind: "cone", r: 3.5, h: Math.sqrt(36.75), center: "O", apex: "S", axis: true,
        sector: { ts: Math.PI - 0.65 - Math.PI / 2, tl: Math.PI },
        rim: { A: { ang: 0.65 } },
        edges: [["S", "A"], ["O", "A"]]
      }]
    },
    labels: [["S", "A", "7"], ["O", "A", "?"]],
    hint: "Полукруг — сектор с углом 180°. Его дуга равна окружности основания конуса.",
    sol: [
      "2π · 7 · (180/360) = 2πr.",
      "r = 7 · 1/2 = 3,5."
    ]
  },
  {
    id: "razv-04", topic: "Развёртки", group: "сектор → конус",
    cond: "Из круга радиуса 8 вырезали сектор с углом 270° и свернули из него боковую поверхность конуса. Найдите радиус основания этого конуса.",
    ans: "6",
    scene: {
      bodies: [{
        kind: "cone", r: 6, h: Math.sqrt(28), center: "O", apex: "S", axis: true,
        sector: { ts: Math.PI - 0.65 - 3 * Math.PI / 4, tl: 3 * Math.PI / 2 },
        rim: { A: { ang: 0.65 + 3 * Math.PI / 4 - Math.PI / 2 } },
        edges: [["S", "A"], ["O", "A"]]
      }]
    },
    labels: [["S", "A", "8"], ["O", "A", "?"]],
    hint: "Дуга сектора с углом 270° составляет 3/4 полной окружности радиуса 8.",
    sol: [
      "2π · 8 · (270/360) = 2πr.",
      "r = 8 · 3/4 = 6."
    ]
  },
  /* ---------- угол развёртки ---------- */
  {
    id: "razv-05", topic: "Развёртки", group: "угол развёртки",
    cond: "Радиус основания конуса равен 3, а образующая равна 12. Найдите угол развёртки боковой поверхности конуса. Ответ дайте в градусах.",
    ans: "90",
    scene: {
      bodies: [{
        kind: "cone", r: 3, h: Math.sqrt(135), center: "O", apex: "S", axis: true,
        rim: { A: { ang: 0.65 } }, edges: [["O", "A"], ["S", "A"]]
      }]
    },
    labels: [["O", "A", "3"], ["S", "A", "12"]],
    hint: "Развёртка — сектор радиуса l. Длина его дуги равна длине окружности основания.",
    sol: [
      "2πl · (α/360) = 2πr, откуда α = 360 · r/l.",
      "α = 360 · 3/12 = 90°."
    ]
  },
  {
    id: "razv-06", topic: "Развёртки", group: "угол развёртки",
    cond: "Радиус основания конуса равен 5, а образующая равна 10. Найдите угол развёртки боковой поверхности конуса. Ответ дайте в градусах.",
    ans: "180",
    scene: {
      bodies: [{
        kind: "cone", r: 5, h: Math.sqrt(75), center: "O", apex: "S", axis: true,
        rim: { A: { ang: 0.65 } }, edges: [["O", "A"], ["S", "A"]]
      }]
    },
    labels: [["O", "A", "5"], ["S", "A", "10"]],
    hint: "Угол развёртки пропорционален отношению радиуса основания к образующей.",
    sol: [
      "α = 360 · r/l = 360 · 5/10.",
      "α = 180°."
    ]
  },
  {
    id: "razv-07", topic: "Развёртки", group: "угол развёртки",
    cond: "Развёртка боковой поверхности конуса — сектор с углом 120°. Радиус основания конуса равен 5. Найдите образующую конуса.",
    ans: "15",
    scene: {
      bodies: [{
        kind: "cone", r: 5, h: Math.sqrt(200), center: "O", apex: "S", axis: true,
        sector: { ts: Math.PI - 0.65 - Math.PI / 3, tl: 2 * Math.PI / 3 },
        rim: { A: { ang: 0.65 + Math.PI / 3 - Math.PI / 2 } },
        edges: [["O", "A"]]
      }]
    },
    labels: [["O", "A", "5"], ["S", "A", "?"]],
    construct: { segments: [["S", "A", "?"]] },
    hint: "Из равенства дуги развёртки и окружности основания выразите образующую.",
    sol: [
      "2πl · (120/360) = 2πr, откуда l = 3r.",
      "l = 3 · 5 = 15."
    ]
  }
];


const PROBLEMS = [].concat(P_LEGACY_KUB, P_KUB, P_LEGACY_PAR, P_PAR, P_LEGACY_SOST, P_SOST, P_LEGACY_PRIZ, P_PRIZ, P_LEGACY_PIR, P_PIR, P_LEGACY_CIL, P_CIL, P_LEGACY_KON, P_KON, P_LEGACY_SHAR, P_SHAR, P_LEGACY_KOMB, P_KOMB, P_RAZV);
