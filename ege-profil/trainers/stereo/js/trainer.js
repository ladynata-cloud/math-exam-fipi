/* ============================================================
   Тренажёр «Стереометрия · Задание 3 ЕГЭ (профиль)»
   Движок страницы trainer.html (чистый JS + Three.js).
   Данные и генераторы фигур — в js/data.js (собирается из
   ege-profil/_istochniki/stereo-bank, см. sync-data.js).

   Прогресс — общий с опубликованной линейкой
   trainers/ege-profile-stereometry-3d (тот же домен):
     stereo3.status        — { <id задачи>: { st: "ok"|"fail", revealed,
                               attempts, wrong, topic, updatedAt, …чужие поля } }
     stereo3.last.<тема>   — позиция задачи в теме (целое 0…N−1).
                             Совместима с опубликованной линейкой только
                             по темам: в каждой теме старые задачи стоят
                             первыми и в прежнем порядке. У марафона
                             (stereo3.last.all) порядок иной — сначала Куб,
                             как на главной, — и сохранённая там позиция
                             может открыть другую задачу.
   Запись задачи — как в опубликованной линейке; чужие поля записи
   сохраняются, мусор в хранилище молча отбрасывается.
   ============================================================ */
(function () {
"use strict";

const $ = id => document.getElementById(id);
const topicOf = p => p.topic || "Параллелепипед";
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- список задач (фильтр по теме из URL) ---------- */
const urlp = new URLSearchParams(location.search);
const topicFilter = urlp.get("topic");
const LIST = topicFilter ? PROBLEMS.filter(p => topicOf(p) === topicFilter) : PROBLEMS;
if (!LIST.length) {
  document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">Тема не найдена. <a href="index.html">К списку тренажёров</a></p>';
  return;
}
/* «Развёртки» — тема-приложение сверх типов задания 3: в заголовке не «Задание 3» */
const APPENDIX = "Развёртки";
if (topicFilter === APPENDIX) {
  document.title = "Развёртки (приложение) · Стереометрия ЕГЭ";
  if ($("pageTitle")) $("pageTitle").textContent = "Развёртки (приложение)";
  if ($("subKind")) $("subKind").textContent = "приложение сверх типов задания 3";
} else document.title = (topicFilter ? topicFilter + " · " : "") + "Стереометрия · Задание 3 ЕГЭ";
$("topicName").textContent = topicFilter || "Все темы";

/* ---------- прогресс (localStorage) ---------- */
const LS = "stereo3.status";
/* прочитать прогресс; не объект — мусор, отбрасываем; хранилище недоступно —
   работаем с тем, что в памяти (fallback) */
const readStatus = fallback => {
  let raw;
  try { raw = localStorage.getItem(LS); } catch (e) { return fallback; }
  let s = null;
  try { s = JSON.parse(raw); } catch (e) { s = null; }
  return s && typeof s === "object" && !Array.isArray(s) ? s : {};
};
let status = readStatus({});
const recOf = id => { const r = status[id]; return r && typeof r === "object" && !Array.isArray(r) ? r : {}; };
const cnt = v => (typeof v === "number" && isFinite(v) && v >= 0 ? v : 0);
/* записать одну задачу: перед записью прогресс перечитывается — другая вкладка
   или опубликованная линейка (ключ общий) могли его обновить */
const saveRec = (id, make) => {
  status = readStatus(status);
  status[id] = make(recOf(id));
  try { localStorage.setItem(LS, JSON.stringify(status)); } catch (e) {}
};

/* ---------- состояние ---------- */
let idx = 0;
const lastKey = "stereo3.last." + (topicFilter || "all");
/* позиция — только целое число в пределах темы; дробь, минус, текст — мусор:
   молча начинаем с первой задачи */
try {
  const raw = localStorage.getItem(lastKey);
  if (typeof raw === "string" && /^\s*\d+\s*$/.test(raw)) {
    const v = Number(raw);
    if (Number.isSafeInteger(v) && v < LIST.length) idx = v;
  }
} catch (e) {}
let selected = [];      // [{key,label,user}]
let pending = null;
let constructOn = false;
let autoRot = false;

const prob = () => LIST[idx];
const revealed = () => !!status[prob().id]?.revealed;

/* ============================================================
   THREE.JS
   ============================================================ */
const T = {};
function initThree() {
  const mount = $("viewport");
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  mount.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const sph = { r: 12, th: -0.65, ph: 1.18 };

  scene.add(new THREE.AmbientLight(0xffffff, 0.52));
  const dl = new THREE.DirectionalLight(0xffffff, 0.72); dl.position.set(-4, 8, 6); scene.add(dl);
  const dl2 = new THREE.DirectionalLight(0xffffff, 0.22); dl2.position.set(5, 3, -5); scene.add(dl2);

  const grid = new THREE.GridHelper(15, 15, COL.grid, COL.grid);
  grid.material.transparent = true; grid.material.opacity = 0.55;
  scene.add(grid);

  const group = new THREE.Group(); scene.add(group);

  Object.assign(T, { renderer, scene, camera, sph, group, grid,
    segMap: {}, vertMap: {}, badges: new THREE.Group(), constructGroup: null,
    anims: [], solidMats: [], clock: new THREE.Clock(), pendingMesh: null });
  scene.add(T.badges);

  const setCam = () => {
    camera.position.setFromSphericalCoords(sph.r, sph.ph, sph.th);
    camera.lookAt(0, 0, 0);
  };
  setCam();
  T.setCam = setCam;

  /* вид «домой» (стартовый и кнопка ⌂): прежний ракурс, а расстояние такое,
     чтобы сцена целиком — тела и подписи — была в кадре при любом аспекте
     холста. Сфера радиуса R вокруг центра обзора (0,0,0) (T.sceneR —
     buildScene) видна вся, если r ≥ R / sin(половины меньшего из углов
     обзора: вертикального fov и горизонтального по аспекту). Не ближе
     прежних 12: на широком экране вид прежний, отодвигается только то,
     что не помещалось. */
  const HOME = { r: 12, th: -0.65, ph: 1.18 };
  const fitDistance = R => {
    const v = camera.fov * Math.PI / 360;
    const h = Math.atan(Math.tan(v) * camera.aspect);
    const fit = R > 0 ? R / Math.sin(Math.min(v, h)) : 0;
    return isFinite(fit) ? Math.max(HOME.r, fit) : HOME.r;
  };
  T.goHome = () => {
    sph.r = T.homeR = fitDistance(T.sceneR || 0); sph.th = HOME.th; sph.ph = HOME.ph;
    T.atHome = true;   /* пока ученик не повернул и не приблизил — при смене размера холста вид подстраивается */
    setCam();
  };
  const zoomTo = r => { sph.r = Math.min(Math.max(32, T.homeR || 0), Math.max(4, r)); T.atHome = false; setCam(); };

  const resize = () => {
    const w = mount.clientWidth, h = mount.clientHeight;
    if (!(w > 0 && h > 0)) return;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (T.atHome) T.goHome();
  };
  resize();
  new ResizeObserver(resize).observe(mount);

  /* управление. Вращение — только одним указателем (мышь или один палец):
     у каждого указателя свои координаты (Map по pointerId), поэтому второй
     палец не сдвигает точку отсчёта первого. Как только касается второй
     палец — это щипок: вращение выключено, и отпускание пальцев отрезок
     не выбирает; масштаб щипком — в touchmove ниже. */
  const ptrs = new Map();
  let drag = false, moved = 0, pinch = null;
  const el = renderer.domElement;
  el.style.touchAction = "none";
  el.addEventListener("pointerdown", e => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* в некоторых браузерах бросает — жест идёт и без захвата */ }
    if (ptrs.size === 1) { drag = true; moved = 0; }
    else { drag = false; moved = Infinity; }
  });
  window.addEventListener("pointermove", e => {
    const pt = ptrs.get(e.pointerId);
    if (!pt) return;
    const dx = e.clientX - pt.x, dy = e.clientY - pt.y;
    pt.x = e.clientX; pt.y = e.clientY;
    if (!drag || ptrs.size !== 1) return;
    moved += Math.abs(dx) + Math.abs(dy);
    sph.th -= dx * 0.0065;
    sph.ph = Math.min(Math.PI - 0.15, Math.max(0.15, sph.ph - dy * 0.0065));
    T.atHome = false;
    setCam();
  });
  const release = (e, cancelled) => {
    if (!ptrs.delete(e.pointerId)) return;
    if (!cancelled && drag && moved < 6 && !ptrs.size) {
      /* касание пальцем: эмуляция мыши погашена (touchend ниже), поэтому поле
         ответа, как и раньше при касании чертежа, теряет фокус здесь */
      if (e.pointerType === "touch" && document.activeElement && document.activeElement !== document.body &&
          typeof document.activeElement.blur === "function") document.activeElement.blur();
      pick(e);
    }
    if (!ptrs.size) drag = false;
  };
  window.addEventListener("pointerup", e => release(e, false));
  window.addEventListener("pointercancel", e => release(e, true));
  el.addEventListener("wheel", e => { e.preventDefault(); zoomTo(sph.r * (1 + e.deltaY * 0.001)); }, { passive: false });
  el.addEventListener("touchstart", e => { if (e.touches.length === 2) { const [a, b] = e.touches; pinch = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); } }, { passive: true });
  el.addEventListener("touchmove", e => { if (e.touches.length === 2 && pinch) { const [a, b] = e.touches; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); if (d > 0) { zoomTo(sph.r * pinch / d); pinch = d; } e.preventDefault(); } }, { passive: false });
  /* жест, начатый на чертеже, заканчивается на чертеже: touchend отменён, и браузер
     не шлёт после касания эмулированные mousedown/mouseup/click. Иначе click
     приходит в ту точку экрана, где был палец, уже после выбора линии, и если
     под пальцем оказался другой элемент (⟳, ⌂, «Следующая задача»), он
     срабатывал. Выбор линии — по pointerup (release), он приходит до touchend.
     Мышь и клавиатура touch-событий не дают — их это не касается. */
  el.addEventListener("touchend", e => { if (e.touches.length < 2) pinch = null; if (e.cancelable) e.preventDefault(); }, { passive: false });

  /* имя точки видно на чертеже: у неё есть буква (видимая вершина) или она
     безымянная («_…» — отрезок подписывается словом «отрезок») */
  const nameShown = n => {
    if (n[0] === "_") return true;
    const v = T.vertMap[n];
    return !!v && v.mesh.visible && v.mesh.parent?.visible !== false;
  };
  T.namesShown = s => nameShown(s.p1) && nameShown(s.p2);
  /* какие линии выбираются (клик или касание → панель измерений). Решает
     признак призрака, а не буквы: рёбра тел, отрезки построения и ученика
     выбираются всегда, в том числе у тел со скрытыми буквами (hideLabels:
     в панели и на бейдже тогда слово «ребро»/«отрезок» — segLabel, а не
     невидимые имена). Ребро призрака (kind "ghost": бледное тело для
     сравнения) — только когда буквы обоих концов видны на чертеже, как было
     в опубликованной линейке; у призраков с hideLabels (px "2" старых задач:
     27061 и т. п.) имена A₂B₂ нигде не видны — такие рёбра не выбираются. */
  T.segPickable = s => s.mesh.parent?.visible !== false && (s.kind !== "ghost" || T.namesShown(s));

  const ray = new THREE.Raycaster();
  function pick(e) {
    const rect = el.getBoundingClientRect();
    const m = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(m, camera);
    const objs = [];
    Object.values(T.vertMap).forEach(v => { if (v.mesh.visible && v.mesh.parent?.visible !== false) objs.push(v.mesh); });
    Object.values(T.segMap).forEach(s => { if (T.segPickable(s)) objs.push(s.mesh); });
    const hit = ray.intersectObjects(objs, false)[0];
    if (!hit) { setPending(null); return; }
    const ud = hit.object.userData;
    if (ud.vertex) onVertexClick(ud.vertex);
    else if (ud.seg) onSegClick(ud.seg);
  }

  (function loop() {
    const dt = T.clock.getDelta(), now = T.clock.elapsedTime;
    if (autoRot) { sph.th += dt * 0.35; T.atHome = false; setCam(); }
    T.anims = T.anims.filter(a => {
      const p = Math.min(1, Math.max(0, (now - a.start) / a.dur));
      a.step(p);
      return (now - a.start) / a.dur < 1;
    });
    T.solidMats.forEach(mm => { mm.opacity = mm.userData.base + 0.06 * Math.sin(now * 2.2); });
    if (T.pendingMesh) { const s = 1 + 0.25 * Math.sin(now * 6); T.pendingMesh.scale.setScalar(s); }
    updateHiddenEdges();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();
}

/* ============================================================
   СЦЕНА ЗАДАЧИ
   ============================================================ */
/* освободить память видеокарты под поддеревом: геометрии, материалы и их
   текстуры (CanvasTexture подписей). Каждый ресурс — ровно один раз (Set):
   у пунктира (mkDash) один материал на все штрихи ребра. Геометрию спрайтов
   three.js держит одну на все спрайты — её не трогаем. Без этого память
   растёт с каждой задачей, и в марафоне телефон теряет WebGL-контекст. */
function disposeTree(root) {
  const geos = new Set(), mats = new Set();
  root.traverse(o => {
    if (o.geometry && !o.isSprite) geos.add(o.geometry);
    const m = o.material;
    if (Array.isArray(m)) m.forEach(x => { if (x) mats.add(x); });
    else if (m) mats.add(m);
  });
  geos.forEach(g => g.dispose());
  mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
}

function buildScene(p) {
  disposeTree(T.group); T.group.clear();
  disposeTree(T.badges); T.badges.clear();
  T.segMap = {}; T.vertMap = {}; T.anims = []; T.solidMats = []; T.constructGroup = null; T.pendingMesh = null;

  const { gen, s, toW, groundY, firstBox } = sceneData(p);
  const hasGhost = gen.some(g => g.ghost);
  T.occluders = []; T.dashables = []; T._hforce = true;
  T.unitPts = {}; const V = {};
  for (const g of gen) for (const [nm, pt] of Object.entries(g.pts)) { T.unitPts[nm] = pt; V[nm] = toW(pt); }
  T.V = V;
  T.scaleFn = (n1, n2) => {
    const a = T.unitPts[n1], b = T.unitPts[n2];
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  };
  T.grid.position.y = groundY - 0.7;

  const rad = 0.042;

  const mkDash = (A, B, color, r) => {
    const grp = new THREE.Group();
    const dir = B.clone().sub(A); const len = dir.length(); const n = dir.clone().normalize();
    const mat = new THREE.MeshBasicMaterial({ color });
    const pitch = 0.36, dLen = 0.2; let t = 0.03;
    while (t < len - 0.001) {
      const seg = Math.min(dLen, len - t);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, seg, 6), mat);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
      m.position.copy(A).addScaledVector(n, t + seg / 2);
      grp.add(m); t += pitch;
    }
    grp.visible = false;
    return grp;
  };

  /* word — как назвать линию в панели и на бейдже, если букв её концов
     на чертеже нет (segLabel): «ребро» у многогранника, иначе «отрезок» */
  const addSeg = (p1, p2, { color = COL.edge, r = rad, parent = T.group, kind = "edge", given = null, dashable = false, word = "отрезок" } = {}) => {
    const k = segKey(p1, p2);
    if (T.segMap[k]) return T.segMap[k];
    const A = V[p1], B = V[p2];
    const dir = B.clone().sub(A), len = dir.length();
    if (len < 1e-6) return null;
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 12), new THREE.MeshBasicMaterial({ color }));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    mesh.scale.set(1, len, 1);
    mesh.position.copy(A).addScaledVector(dir, 0.5);
    mesh.userData.seg = k;
    parent.add(mesh);
    const rec = { mesh, mat: mesh.material, base: color, p1, p2, kind, given, A, B, len, anon: p1.startsWith("_") || p2.startsWith("_"), dashable, dash: null, selected: false, word };
    if (dashable) { rec.dash = mkDash(A, B, color, r * 0.9); parent.add(rec.dash); T.dashables.push(rec); }
    T.segMap[k] = rec;
    return rec;
  };
  T.addSeg = addSeg;

  /* плоский полупрозрачный полигон (для выносок «данная грань» и заливок построения) */
  const addPoly = (names, { color = COL.face, opacity = 0.07, parent = T.group } = {}) => {
    const pts = names.map(n => V[n]);
    const g = new THREE.BufferGeometry();
    const arr = [];
    for (let i = 1; i < pts.length - 1; i++) arr.push(pts[0], pts[i], pts[i + 1]);
    g.setFromPoints(arr); g.computeVertexNormals();
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false });
    parent.add(new THREE.Mesh(g, m));
    return m;
  };

  /* залитая затенённая грань тела (Lambert) */
  const addFaceLit = (names, { color, opacity, parent = T.group } = {}) => {
    const pts = names.map(n => V[n]);
    const g = new THREE.BufferGeometry();
    const arr = [];
    for (let i = 1; i < pts.length - 1; i++) arr.push(pts[0], pts[i], pts[i + 1]);
    g.setFromPoints(arr); g.computeVertexNormals();
    const m = new THREE.MeshLambertMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false });
    const me = new THREE.Mesh(g, m); parent.add(me);
    return me;
  };

  const addVertex = (name, { color = COL.vertex, parent = T.group } = {}) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({ color }));
    m.position.copy(V[name]); m.userData.vertex = name;
    parent.add(m);
    const lbl = makeSprite(SUB(name), { fontPx: 46 });
    const off = V[name].clone().setY(0).normalize().multiplyScalar(0.4);
    off.y = V[name].y >= 0 ? 0.28 : -0.28;
    lbl.position.copy(V[name]).add(off);
    parent.add(lbl);
    T.vertMap[name] = { mesh: m, lbl };
  };
  T.addVertex = addVertex;

  for (const g of gen) {
    const ghost = g.ghost;
    const round = g.matKind === "round";
    const pal = ghost ? { face: COL.ghost, edge: COL.ghost, ring: COL.ghost }
      : round ? { face: COL.terraFace, edge: COL.terraEdge, ring: COL.terraRing }
        : { face: COL.magFace, edge: COL.magEdge, ring: COL.magEdge };

    for (const f of g.faces) {
      const me = addFaceLit(f, { color: pal.face, opacity: ghost ? 0.12 : 0.5 });
      if (!ghost) T.occluders.push(me);
    }
    const word = round ? "отрезок" : "ребро";
    for (const [p1, p2] of g.edges) {
      const rec = addSeg(p1, p2, { color: pal.edge, r: ghost ? rad * 0.6 : rad, kind: ghost ? "ghost" : "edge", dashable: !ghost && !round, word });
      /* линия уже нарисована призраком (общее основание призмы и пирамиды,
         радиус цилиндра и конуса): она и ребро настоящего тела — выбирается */
      if (rec && !ghost && rec.kind === "ghost") { rec.kind = "edge"; rec.word = word; }
    }
    for (const c of g.circles) {
      const ccol = c.col === "amber" ? COL.construct : c.col === "water" ? COL.water : pal.ring;
      /* дуга (обод части конуса): tl — её угол, ts — начало, как у закрашенного
         сектора (CircleGeometry); без tl — окружность целиком */
      const arc = typeof c.tl === "number" && c.tl > 0 ? Math.min(c.tl, Math.PI * 2) : Math.PI * 2;
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(c.r * s, 0.03, 10, Math.max(8, Math.round(80 * arc / (Math.PI * 2))), arc),
        new THREE.MeshBasicMaterial({ color: ccol }));
      mesh.position.copy(toW(c.c));
      if (c.plane === "h") mesh.rotation.x = Math.PI / 2;
      if (arc < Math.PI * 2 && typeof c.ts === "number") mesh.rotation.z = c.ts;
      T.group.add(mesh);
    }
    for (const sf of g.surfaces) {
      if (sf.type === "waterCone") {
        const me = new THREE.Mesh(new THREE.CylinderGeometry(sf.r * s, 0.001, sf.h * s, 64),
          new THREE.MeshLambertMaterial({ color: COL.water, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
        me.position.copy(toW(sf.c)); T.group.add(me); continue;
      }
      if (sf.type === "water") {
        const me = new THREE.Mesh(new THREE.CylinderGeometry(sf.r * s, sf.r * s, sf.h * s, 64),
          new THREE.MeshLambertMaterial({ color: COL.water, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
        me.position.copy(toW(sf.c)); T.group.add(me); continue;
      }
      if (sf.type === "disc") {
        const me = new THREE.Mesh(new THREE.CircleGeometry(sf.r * s, 64, sf.ts || 0, sf.tl || Math.PI * 2),
          new THREE.MeshLambertMaterial({ color: COL.fill, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false }));
        me.rotation.x = Math.PI / 2; me.position.copy(toW(sf.c)); T.group.add(me); continue;
      }
      /* g.seeThrough — тело с важным внутри (ось, радиус, вода, сечение): стенка
         полупрозрачная и не закрывает то, что внутри; так задаёт engine для тел
         вращения старого банка — в опубликованной линейке они были прозрачными */
      const see = !ghost && !!g.seeThrough;
      let geo = null, opacity = 0.9, sideD = true, dw = false;
      if (sf.type === "cyl") {
        geo = new THREE.CylinderGeometry(sf.r * s, sf.r * s, sf.h * s, 64, 1, true);
        opacity = ghost ? 0.12 : see ? 0.3 : (hasGhost ? 0.5 : 0.9); dw = !hasGhost && !ghost && !see;
      } else if (sf.type === "cone") {
        geo = new THREE.CylinderGeometry(sf.flip ? sf.r * s : 0.001, sf.flip ? 0.001 : sf.r * s, sf.h * s, 64, 1, true, sf.ts || 0, sf.tl || Math.PI * 2);
        opacity = ghost ? 0.12 : see ? 0.3 : (hasGhost ? 0.5 : 0.9); dw = !hasGhost && !ghost && !see;
      } else if (sf.type === "sphere") {
        geo = new THREE.SphereGeometry(sf.r * s, 48, 32);
        opacity = ghost ? 0.1 : see ? 0.24 : (hasGhost ? 0.28 : 0.62); sideD = false; dw = false;
      }
      if (!geo) continue;
      const mat = new THREE.MeshLambertMaterial({ color: pal.face, transparent: opacity < 1, opacity, side: sideD ? THREE.DoubleSide : THREE.FrontSide, depthWrite: dw });
      const me = new THREE.Mesh(geo, mat); me.position.copy(toW(sf.c)); T.group.add(me);
      if (!ghost) T.occluders.push(me);
    }
    if (!g.anonymous && !g.hideLabels)
      for (const nm of Object.keys(g.pts)) { if (nm[0] !== "_") addVertex(nm); }
    for (const cl of (g.coordLabels || [])) {
      if (!cl.t) continue;
      const sp = makeSprite(cl.t, { fontPx: 42, color: PAL.blue, bg: "rgba(255,255,255,0.92)", pad: 9, italicSerif: false });
      const mid = toW([(cl.p[0] + cl.q[0]) / 2, (cl.p[1] + cl.q[1]) / 2, (cl.p[2] + cl.q[2]) / 2]);
      sp.position.copy(mid).add(mid.clone().setY(0).normalize().multiplyScalar(0.32));
      sp.position.y += 0.05;
      T.group.add(sp);
    }
  }

  /* место подписи отрезка: его середина. Если та же середина у подписи
     ДРУГОГО отрезка (диагонали ромба делятся точкой пересечения пополам),
     подписи налезли бы друг на друга — тогда каждая встаёт на 3/4 своего
     отрезка, ближе ко второй точке */
  const labelled = [...(p.labels || []), ...((p.construct && p.construct.segments) || []).filter(sg => sg[2])];
  const labelMid = (p1, p2) => {
    const k = segKey(p1, p2), mid = V[p1].clone().add(V[p2]).multiplyScalar(0.5);
    const clash = labelled.some(([a, b]) => segKey(a, b) !== k && V[a] && V[b] &&
      V[a].clone().add(V[b]).multiplyScalar(0.5).distanceTo(mid) < 1e-6);
    return clash ? mid.lerp(V[p2], 0.5) : mid;
  };

  /* подписи данных */
  T.givenMap = {};
  for (const [p1, p2, txt] of (p.labels || [])) {
    const k = segKey(p1, p2);
    T.givenMap[k] = txt;
    const sp = makeSprite(txt, { fontPx: 44, color: txt === "?" ? PAL.amber : PAL.blue, bg: "rgba(255,255,255,0.92)", pad: 10, italicSerif: false });
    const mid = labelMid(p1, p2);
    sp.position.copy(mid).add(mid.clone().normalize().multiplyScalar(0.34));
    T.group.add(sp);
  }
  for (const gf of (p.givenFaces || [])) {
    addPoly(gf.face, { opacity: 0.28 });
    const pts = gf.face.map(n => V[n]);
    const ctr = pts.reduce((sum, q) => sum.add(q), new THREE.Vector3()).multiplyScalar(1 / pts.length);
    const sp = makeSprite(gf.text, { fontPx: 42, color: PAL.blue, bg: "rgba(255,255,255,0.9)", pad: 10, italicSerif: false });
    sp.position.copy(ctr); T.group.add(sp);
  }

  /* построение */
  if (p.construct) {
    const cg = new THREE.Group(); cg.visible = false; T.group.add(cg); T.constructGroup = cg;
    const cst = p.construct;
    const resolvePt = spec => {
      if (Array.isArray(spec) && spec[0] === "mid") {
        const a = T.unitPts[spec[1]], b = T.unitPts[spec[2]];
        return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      }
      const fb = firstBox || { a: 1, b: 1, c: 1 };
      return [spec[0] * fb.a, spec[1] * fb.b, spec[2] * fb.c];
    };
    const extraNames = Object.keys(cst.points || {});
    for (const nm of extraNames) {
      const u = resolvePt(cst.points[nm]);
      T.unitPts[nm] = u; V[nm] = toW(u);
    }
    /* уже нарисованные линии (ребро, ось, радиус), совпавшие с отрезком
       построения: вторую линию поверх не рисуем, а эту на время построения
       красим цветом построения (base0 — прежний цвет) */
    const hi = [];
    let built = false;
    const recolor = rec => {
      if (!rec.selected) rec.mat.color.setHex(rec.base);
      if (rec.dash) rec.dash.children.forEach(m => m.material.color.setHex(rec.base));
    };
    const setHi = on => {
      for (const rec of hi) { rec.base = on ? COL.construct : rec.base0; recolor(rec); }
      T._hforce = true;
    };
    /* подпись построения: появляется плавно */
    const fadeLabel = (txt, p1, p2, start) => {
      const sp = makeSprite(txt, { fontPx: 44, color: PAL.amber, bg: "rgba(255,255,255,0.92)", pad: 10, italicSerif: false });
      const mid = labelMid(p1, p2);
      sp.position.copy(mid).add(mid.clone().normalize().multiplyScalar(0.34));
      sp.material.opacity = 0;
      cg.add(sp);
      T.anims.push({ start, dur: 0.4, step: pr => { sp.material.opacity = pr; } });
    };
    T.constructBuild = () => {
      cg.visible = true;
      if (built) { setHi(true); return; }
      built = true;
      const now = T.clock.elapsedTime; let delay = 0.05;
      const labelledHere = new Set();
      for (const nm of extraNames) addVertex(nm, { color: COL.construct, parent: cg });
      const segs = [...(cst.segments || [])];
      const ringEdges = [];
      const rings = [...(cst.fills || []), ...(cst.solid || [])];
      for (const ring of rings)
        for (let i = 0; i < ring.length; i++) {
          const p1 = ring[i], p2 = ring[(i + 1) % ring.length];
          const k = segKey(p1, p2);
          if (!T.segMap[k] && !segs.some(sg => segKey(sg[0], sg[1]) === k) && !ringEdges.some(e2 => segKey(e2[0], e2[1]) === k))
            ringEdges.push([p1, p2]);
        }
      for (const sg of [...segs, ...ringEdges]) {
        const [p1, p2, given] = sg;
        const rec = addSeg(p1, p2, { color: COL.construct, r: rad * 1.15, parent: cg, kind: "construct", given: given || null });
        if (!rec) continue;
        const k = segKey(p1, p2);
        if (rec.kind !== "construct") {
          /* отрезок построения — уже нарисованная линия: выделить её и показать
             данное построения (подпись), если эта линия ещё не подписана
             данными условия (labels) — иначе построение с такими отрезками
             ничего бы не показало */
          if (!hi.includes(rec)) { rec.base0 = rec.base; hi.push(rec); }
          if (given && !T.givenMap[k] && !labelledHere.has(k)) {
            labelledHere.add(k);
            fadeLabel(given, p1, p2, now + delay);
            delay += 0.28;
          }
          continue;
        }
        const { mesh, A, B, len } = rec;
        const dir = B.clone().sub(A);
        mesh.scale.y = 0.0001;
        const st = now + delay;
        T.anims.push({ start: st, dur: 0.55, step: pr => { mesh.scale.y = Math.max(0.0001, pr * len); mesh.position.copy(A).addScaledVector(dir, pr * 0.5); } });
        if (given && !labelledHere.has(k)) { labelledHere.add(k); fadeLabel(given, p1, p2, st + 0.3); }
        delay += 0.28;
      }
      const fadePoly = (ring, baseOp) => {
        const m = addPoly(ring, { color: COL.fill, opacity: 0, parent: cg });
        m.userData.base = baseOp;
        T.anims.push({ start: now + delay, dur: 0.6, step: pr => { m.opacity = pr * baseOp; } });
        return m;
      };
      for (const f of (cst.fills || [])) fadePoly(f, 0.30);
      for (const f of (cst.solid || [])) T.solidMats.push(fadePoly(f, 0.26));
      setHi(true);
    };
    T.constructHide = () => { cg.visible = false; T.solidMats.length = 0; setHi(false); };
  } else { T.constructBuild = null; T.constructHide = null; }

  /* радиус сцены вокруг центра обзора (0,0,0) — по всем вершинам геометрий
     (рёбра, грани, окружности, поверхности) и углам подписей; по нему
     T.goHome подбирает расстояние камеры */
  T.group.updateMatrixWorld(true);
  let R = 0;
  const v3 = new THREE.Vector3();
  T.group.traverse(o => {
    if (o.isSprite) { R = Math.max(R, o.getWorldPosition(v3).length() + Math.hypot(o.scale.x, o.scale.y) / 2); return; }
    const pos = o.geometry && o.geometry.attributes && o.geometry.attributes.position;
    if (!pos) return;
    for (let i = 0; i < pos.count; i++) R = Math.max(R, v3.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).length());
  });
  T.sceneR = isFinite(R) ? R : 0;
  T.goHome();
}

/* ============================================================
   СКРЫТЫЕ РЁБРА — пунктир (как в GeoGebra)
   Ребро считается скрытым, если луч от камеры к его середине
   упирается в грань/поверхность тела раньше самого ребра.
   ============================================================ */
function updateHiddenEdges() {
  if (!T.dashables || !T.dashables.length) return;
  const s = T.sph;
  if (T._hs && !T._hforce &&
      Math.abs(s.th - T._hs.th) < 0.0025 &&
      Math.abs(s.ph - T._hs.ph) < 0.0025 &&
      Math.abs(s.r - T._hs.r) < 0.01) return;
  T._hs = { th: s.th, ph: s.ph, r: s.r }; T._hforce = false;
  const ray = T._ray || (T._ray = new THREE.Raycaster());
  const camPos = T.camera.position;
  const occ = T.occluders || [];
  for (const rec of T.dashables) {
    if (rec.selected) { rec.mat.visible = true; rec.mat.color.setHex(COL.select); if (rec.dash) rec.dash.visible = false; continue; }
    const mid = rec.A.clone().add(rec.B).multiplyScalar(0.5);
    const dv = mid.clone().sub(camPos); const dist = dv.length();
    ray.set(camPos, dv.normalize());
    let hidden = false;
    const hits = ray.intersectObjects(occ, false);
    for (let i = 0; i < hits.length; i++) { if (hits[i].distance < dist - 0.09) { hidden = true; break; } }
    rec.mat.visible = !hidden;
    rec.mat.color.setHex(rec.base);
    if (rec.dash) rec.dash.visible = hidden;
  }
}

/* ============================================================
   ВЫБОР ЛИНИЙ / ОТРЕЗКИ ПО ДВУМ ТОЧКАМ
   ============================================================ */
/* подпись линии в панели и на бейдже: буквы концов — только если обе видны
   на чертеже; иначе слово (у тела со скрытыми буквами — «ребро» многогранника
   или «отрезок»), а не невидимые имена */
const segLabel = rec => rec.anon ? "отрезок" : T.namesShown(rec) ? SUB(rec.p1) + SUB(rec.p2) : (rec.word || "отрезок");

function onSegClick(key) {
  if (selected.some(x => x.key === key)) selected = selected.filter(x => x.key !== key);
  else {
    const rec = T.segMap[key];
    selected.push({ key, label: segLabel(rec), user: rec.kind === "user" });
  }
  setPending(null);
  paintSelection();
}
function onVertexClick(name) {
  if (!pending) { setPending(name); return; }
  if (pending === name) { setPending(null); return; }
  const key = segKey(pending, name);
  if (!T.segMap[key]) T.addSeg(pending, name, { color: COL.user, r: 0.034, kind: "user" });
  if (!selected.some(x => x.key === key)) {
    const rec = T.segMap[key];
    selected.push({ key, label: segLabel(rec), user: rec.kind === "user" });
  }
  setPending(null);
  paintSelection();
}
function setPending(name) {
  pending = name;
  if (T.pendingMesh) { T.pendingMesh.scale.setScalar(1); T.pendingMesh.material.color.setHex(COL.vertex); T.pendingMesh = null; }
  if (name && T.vertMap[name]) {
    T.pendingMesh = T.vertMap[name].mesh;
    T.pendingMesh.material.color.setHex(COL.select);
  }
  const hintEl = $("pendingHint");
  if (name) { hintEl.style.display = "block"; hintEl.innerHTML = "Точка <b>" + esc(SUB(name)) + "</b> выбрана — кликните вторую точку, чтобы построить отрезок"; }
  else hintEl.style.display = "none";
}

/* длина на сцене → в единицах условия. У старых задач, чья сцена нарисована
   в масштабе k ≠ 1 (дан только объём, радиусы 6, 8, 10 нарисованы как 0,6;
   0,8; 1 …), поле unit — длина условия на единицу сцены; у остальных 1 */
const unitOf = p => (typeof p.unit === "number" && isFinite(p.unit) && p.unit > 0 ? p.unit : 1);
function displayLen(key, rec) {
  if (T.givenMap?.[key] && T.givenMap[key] !== "?") return T.givenMap[key];
  if (rec.given && rec.given !== "?") return rec.given;
  if (!revealed()) return "?";
  return fmtLen(T.scaleFn(rec.p1, rec.p2) * unitOf(prob()));
}

function paintSelection() {
  const selKeys = new Set(selected.map(x => x.key));
  for (const [k, rec] of Object.entries(T.segMap)) {
    rec.selected = selKeys.has(k);
    if (rec.dashable) {
      if (rec.selected) { rec.mat.visible = true; rec.mat.color.setHex(COL.select); if (rec.dash) rec.dash.visible = false; }
    } else {
      rec.mat.color.setHex(rec.selected ? COL.select : rec.base);
    }
  }
  T._hforce = true;
  disposeTree(T.badges); T.badges.clear();
  for (const s2 of selected) {
    const rec = T.segMap[s2.key]; if (!rec) continue;
    const sp = makeSprite(s2.label + " = " + displayLen(s2.key, rec), { fontPx: 42, color: PAL.rose, bg: "rgba(255,255,255,0.94)", pad: 12, italicSerif: false });
    const mid = rec.A.clone().add(rec.B).multiplyScalar(0.5);
    sp.position.copy(mid); sp.position.y += 0.34;
    T.badges.add(sp);
  }
  /* панель измерений */
  const box = $("measures"), list = $("measureList");
  if (!selected.length) { box.style.display = "none"; return; }
  box.style.display = "block";
  list.innerHTML = "";
  for (const s2 of selected) {
    const rec = T.segMap[s2.key];
    const row = document.createElement("div");
    row.className = "measure-row";
    const val = rec ? displayLen(s2.key, rec) : "?";
    row.innerHTML = "<span>" + esc(s2.label) + ' = <b class="rose">' + esc(val) + "</b></span>";
    const del = document.createElement("button");
    del.className = "measure-del"; del.textContent = "✕";
    del.onclick = () => {
      selected = selected.filter(x => x.key !== s2.key);
      if (rec && rec.kind === "user") { rec.mesh.parent?.remove(rec.mesh); disposeTree(rec.mesh); delete T.segMap[s2.key]; }
      paintSelection();
    };
    row.appendChild(del);
    list.appendChild(row);
  }
  $("measureNote").style.display = revealed() ? "none" : "block";
}

/* ============================================================
   ПАНЕЛЬ ЗАДАЧИ
   ============================================================ */
const stColor = st => st === "ok" ? PAL.green : st === "fail" ? PAL.red : "#C9CBD4";

function renderNav() {
  const grid = $("navBody");
  grid.innerHTML = "";
  const topics = topicFilter ? [topicFilter] : TOPICS;
  for (const tp of topics) {
    if (!topicFilter) {
      const h = document.createElement("div");
      h.className = "nav-topic"; h.textContent = tp;
      grid.appendChild(h);
    }
    const row = document.createElement("div");
    row.className = "nav-grid";
    LIST.forEach((p, i) => {
      if (topicOf(p) !== tp) return;
      const b = document.createElement("button");
      b.className = "nav-dot";
      b.textContent = i + 1;
      const st = status[p.id]?.st;
      b.style.background = stColor(st);
      if (st) b.style.color = "#fff";
      if (i === idx) b.style.border = "2px solid " + PAL.ink;
      b.onclick = () => { idx = i; $("navPanel").style.display = "none"; showProblem(); };
      row.appendChild(b);
    });
    grid.appendChild(row);
  }
  const solved = LIST.filter(p => status[p.id]?.st === "ok").length;
  $("score").textContent = solved + " / " + LIST.length;
  $("navToggleText").textContent = "Задача " + (idx + 1) + " из " + LIST.length + " · " + topicOf(prob()) + (prob().group ? " · " + prob().group : "");
}

function showProblem() {
  const p = prob();
  try { localStorage.setItem(lastKey, idx); } catch (e) {}
  selected = []; setPending(null); constructOn = false; autoRot = false;
  $("btnRotate").classList.remove("on");
  buildScene(p);

  /* ссылка на Решу ЕГЭ: у задачи открытого банка (числовой id) — на саму задачу,
     у составленной по типовой модели — на прототип, если он указан в p.src */
  const sdam = id => "https://math-ege.sdamgia.ru/problem?id=" + encodeURIComponent(id);
  const link = /^\d+$/.test(String(p.id))
    ? ' · <a href="' + sdam(p.id) + '" target="_blank" rel="noreferrer">задача на Решу ЕГЭ</a>'
    : p.src ? ' · <a href="' + sdam(p.src) + '" target="_blank" rel="noreferrer">прототип на Решу ЕГЭ</a>' : "";
  $("probMeta").innerHTML = esc(topicOf(p)) + " · № " + esc(p.id) + link;
  $("probCond").textContent = p.cond;
  $("answer").value = "";
  $("feedback").style.display = "none";
  $("hintBox").style.display = "none";
  $("solBox").style.display = "none";
  $("measures").style.display = "none";
  $("btnConstruct").style.display = p.construct ? "inline-block" : "none";
  $("btnConstruct").classList.remove("on");
  $("btnConstruct").textContent = "✦ Показать построение";
  $("btnPrev").disabled = idx === 0;
  $("btnNext").disabled = idx === LIST.length - 1;
  renderNav();
  paintSelection();
}

function check() {
  const p = prob();
  const val = $("answer").value;
  if (!val.trim()) return;
  const ok = Math.abs(parseAns(val) - parseAns(p.ans)) < 1e-9;
  saveRec(p.id, prev => ({
    ...prev,
    st: ok ? "ok" : (prev.st === "ok" ? "ok" : "fail"),
    revealed: ok || prev.revealed,
    attempts: cnt(prev.attempts) + 1,
    wrong: cnt(prev.wrong) + (ok ? 0 : 1),
    topic: topicOf(p),
    updatedAt: Date.now()
  }));
  const fb = $("feedback");
  fb.style.display = "block";
  fb.className = "feedback " + (ok ? "ok" : "bad");
  fb.textContent = ok
    ? "Верно! Ответ: " + p.ans + ". Длины на чертеже открыты — проверьте себя."
    : "Пока неверно. Попробуйте ещё раз или откройте подсказку.";
  renderNav();
  paintSelection();
}

function revealSolution() {
  const p = prob();
  saveRec(p.id, prev => ({
    ...prev,
    st: prev.st === "ok" ? "ok" : "fail",
    revealed: true,
    attempts: cnt(prev.attempts),
    wrong: cnt(prev.wrong),
    topic: topicOf(p),
    updatedAt: Date.now()
  }));
  const box = $("solBox");
  box.style.display = "block";
  /* строки решения — разметка банка (<b>…</b>), ответ — текст */
  box.innerHTML = '<div class="sol-title">Решение</div>' +
    p.sol.map(l => '<div class="sol-line">' + l + "</div>").join("") +
    '<div class="sol-ans">Ответ: ' + esc(p.ans) + ".</div>";
  renderNav();
  paintSelection();
}

/* ---------- события ---------- */
function bind() {
  $("btnCheck").onclick = check;
  $("answer").addEventListener("keydown", e => { if (e.key === "Enter") check(); });
  $("btnHint").onclick = () => {
    const b = $("hintBox");
    b.style.display = b.style.display === "block" ? "none" : "block";
    b.textContent = prob().hint;
  };
  $("btnSolution").onclick = revealSolution;
  $("btnConstruct").onclick = () => {
    constructOn = !constructOn;
    const b = $("btnConstruct");
    b.classList.toggle("on", constructOn);
    b.textContent = constructOn ? "✦ Скрыть построение" : "✦ Показать построение";
    if (constructOn && T.constructBuild) T.constructBuild();
    else if (!constructOn && T.constructHide) T.constructHide();
  };
  $("btnPrev").onclick = () => { if (idx > 0) { idx--; showProblem(); } };
  $("btnNext").onclick = () => { if (idx < LIST.length - 1) { idx++; showProblem(); } };
  $("navToggle").onclick = () => {
    const p = $("navPanel");
    p.style.display = p.style.display === "block" ? "none" : "block";
  };
  $("btnRotate").onclick = () => { autoRot = !autoRot; $("btnRotate").classList.toggle("on", autoRot); };
  $("btnHome").onclick = () => T.goHome();
}

/* ---------- панель «Выделенные отрезки» на узком экране ----------
   До 520 px панель задачи стоит над чертежом (css: .app переносится), и панель
   измерений, раскрываясь по выбору линии, сдвигала бы холст вниз прямо под
   пальцем. Там она переезжает под чертёж — после легенды; шире 520 px стоит
   на прежнем месте в панели задачи. Порог — тот же, что в css/style.css. */
function placeMeasures() {
  const box = $("measures"), legend = document.querySelector(".stage .legend");
  if (!box || !legend) return;
  if (!placeMeasures.home) placeMeasures.home = { parent: box.parentNode, next: box.nextSibling };
  if (placeMeasures.mq.matches) { if (box.previousElementSibling !== legend) legend.after(box); }
  else if (box.parentNode !== placeMeasures.home.parent) placeMeasures.home.parent.insertBefore(box, placeMeasures.home.next);
}
placeMeasures.mq = window.matchMedia("(max-width: 520px)");

/* ---------- запуск ---------- */
placeMeasures();
if (placeMeasures.mq.addEventListener) placeMeasures.mq.addEventListener("change", placeMeasures);
else if (placeMeasures.mq.addListener) placeMeasures.mq.addListener(placeMeasures);
initThree();
bind();
showProblem();
})();
