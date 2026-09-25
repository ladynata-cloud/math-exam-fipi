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
       числа свои, формулировки по типовым моделям; 17 задач повторяют
       шаблон текста открытого банка с другими числами (список —
       ege-profil/_istochniki/README.md). Каждый ответ пересчитан
       независимым скриптом от текста условия, сцена сверена с условием.
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
