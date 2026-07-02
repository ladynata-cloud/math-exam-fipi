/* ============================================================
   Тренажёр «Стереометрия · Задание 3 ЕГЭ (профиль)»
   Движок страницы trainer.html (чистый JS + Three.js).
   Данные и генераторы фигур — в js/data.js
   ============================================================ */
(function () {
"use strict";

const $ = id => document.getElementById(id);
const topicOf = p => p.topic || "Параллелепипед";

/* ---------- список задач (фильтр по теме из URL) ---------- */
const urlp = new URLSearchParams(location.search);
const topicFilter = urlp.get("topic");
const LIST = topicFilter ? PROBLEMS.filter(p => topicOf(p) === topicFilter) : PROBLEMS;
if (!LIST.length) {
  document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">Тема не найдена. <a href="index.html">К списку тренажёров</a></p>';
  return;
}
document.title = (topicFilter ? topicFilter + " · " : "") + "Стереометрия · Задание 3 ЕГЭ";
$("topicName").textContent = topicFilter || "Все темы";

/* ---------- прогресс (localStorage) ---------- */
const LS = "stereo3.status";
let status = {};
try { status = JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { status = {}; }
const saveStatus = () => { try { localStorage.setItem(LS, JSON.stringify(status)); } catch (e) {} };

/* ---------- состояние ---------- */
let idx = 0;
const lastKey = "stereo3.last." + (topicFilter || "all");
try { const v = +localStorage.getItem(lastKey); if (v >= 0 && v < LIST.length) idx = v; } catch (e) {}
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

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const dl = new THREE.DirectionalLight(0xffffff, 0.5); dl.position.set(4, 8, 6); scene.add(dl);

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

  const resize = () => {
    const w = mount.clientWidth, h = mount.clientHeight;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(mount);

  /* управление */
  let drag = false, moved = 0, lx = 0, ly = 0, pinch = null;
  const el = renderer.domElement;
  el.style.touchAction = "none";
  el.addEventListener("pointerdown", e => { drag = true; moved = 0; lx = e.clientX; ly = e.clientY; });
  window.addEventListener("pointermove", e => {
    if (!drag) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; moved += Math.abs(dx) + Math.abs(dy);
    lx = e.clientX; ly = e.clientY;
    sph.th -= dx * 0.0065;
    sph.ph = Math.min(Math.PI - 0.15, Math.max(0.15, sph.ph - dy * 0.0065));
    setCam();
  });
  window.addEventListener("pointerup", e => { if (drag && moved < 6) pick(e); drag = false; });
  el.addEventListener("wheel", e => { e.preventDefault(); sph.r = Math.min(32, Math.max(4, sph.r * (1 + e.deltaY * 0.001))); setCam(); }, { passive: false });
  el.addEventListener("touchstart", e => { if (e.touches.length === 2) { const [a, b] = e.touches; pinch = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); } }, { passive: true });
  el.addEventListener("touchmove", e => { if (e.touches.length === 2 && pinch) { const [a, b] = e.touches; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); sph.r = Math.min(32, Math.max(4, sph.r * pinch / d)); pinch = d; setCam(); e.preventDefault(); } }, { passive: false });

  const ray = new THREE.Raycaster();
  function pick(e) {
    const rect = el.getBoundingClientRect();
    const m = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(m, camera);
    const objs = [];
    Object.values(T.vertMap).forEach(v => { if (v.mesh.visible && v.mesh.parent?.visible !== false) objs.push(v.mesh); });
    Object.values(T.segMap).forEach(s => { if (s.mesh.visible && s.mesh.parent?.visible !== false) objs.push(s.mesh); });
    const hit = ray.intersectObjects(objs, false)[0];
    if (!hit) { setPending(null); return; }
    const ud = hit.object.userData;
    if (ud.vertex) onVertexClick(ud.vertex);
    else if (ud.seg) onSegClick(ud.seg);
  }

  (function loop() {
    const dt = T.clock.getDelta(), now = T.clock.elapsedTime;
    if (autoRot) { sph.th += dt * 0.35; setCam(); }
    T.anims = T.anims.filter(a => {
      const p = Math.min(1, Math.max(0, (now - a.start) / a.dur));
      a.step(p);
      return (now - a.start) / a.dur < 1;
    });
    T.solidMats.forEach(mm => { mm.opacity = mm.userData.base + 0.06 * Math.sin(now * 2.2); });
    if (T.pendingMesh) { const s = 1 + 0.25 * Math.sin(now * 6); T.pendingMesh.scale.setScalar(s); }
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();
}

/* ============================================================
   СЦЕНА ЗАДАЧИ
   ============================================================ */
function buildScene(p) {
  T.group.clear(); T.badges.clear();
  T.segMap = {}; T.vertMap = {}; T.anims = []; T.solidMats = []; T.constructGroup = null; T.pendingMesh = null;

  const { gen, s, toW, groundY, firstBox } = sceneData(p);
  T.unitPts = {}; const V = {};
  for (const g of gen) for (const [nm, pt] of Object.entries(g.pts)) { T.unitPts[nm] = pt; V[nm] = toW(pt); }
  T.V = V;
  T.scaleFn = (n1, n2) => {
    const a = T.unitPts[n1], b = T.unitPts[n2];
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  };
  T.grid.position.y = groundY - 0.7;

  const rad = 0.03;
  const addSeg = (p1, p2, { color = COL.edge, r = rad, parent = T.group, kind = "edge", given = null } = {}) => {
    const k = segKey(p1, p2);
    if (T.segMap[k]) return T.segMap[k];
    const A = V[p1], B = V[p2];
    const dir = B.clone().sub(A), len = dir.length();
    if (len < 1e-6) return null;
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 10), new THREE.MeshBasicMaterial({ color }));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    mesh.scale.set(1, len, 1);
    mesh.position.copy(A).addScaledVector(dir, 0.5);
    mesh.userData.seg = k;
    parent.add(mesh);
    const rec = { mesh, mat: mesh.material, base: color, p1, p2, kind, given, A, B, len, anon: p1.startsWith("_") };
    T.segMap[k] = rec;
    return rec;
  };
  T.addSeg = addSeg;

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

  const addVertex = (name, { color = COL.vertex, parent = T.group } = {}) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 14), new THREE.MeshBasicMaterial({ color }));
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
    for (const f of g.faces) addPoly(f, { opacity: ghost ? 0.04 : 0.07 });
    for (const [p1, p2] of g.edges)
      addSeg(p1, p2, { color: ghost ? COL.ghost : COL.edge, r: ghost ? rad * 0.75 : rad, kind: ghost ? "ghost" : "edge" });
    for (const c of g.circles) {
      const ccol = c.col === "amber" ? COL.construct : c.col === "water" ? COL.water : ghost ? COL.ghost : COL.edge;
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(c.r * s, 0.022, 8, 72), new THREE.MeshBasicMaterial({ color: ccol }));
      mesh.position.copy(toW(c.c));
      if (c.plane === "h") mesh.rotation.x = Math.PI / 2;
      T.group.add(mesh);
    }
    for (const sf of g.surfaces) {
      let mesh = null;
      if (sf.type === "cyl")
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(sf.r * s, sf.r * s, sf.h * s, 48, 1, true),
          new THREE.MeshBasicMaterial({ color: COL.face, transparent: true, opacity: ghost ? 0.07 : 0.11, side: THREE.DoubleSide, depthWrite: false }));
      else if (sf.type === "cone")
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(sf.flip ? sf.r * s : 0.001, sf.flip ? 0.001 : sf.r * s, sf.h * s, 48, 1, true, sf.ts || 0, sf.tl || Math.PI * 2),
          new THREE.MeshBasicMaterial({ color: COL.face, transparent: true, opacity: ghost ? 0.07 : 0.12, side: THREE.DoubleSide, depthWrite: false }));
      else if (sf.type === "waterCone")
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(sf.r * s, 0.001, sf.h * s, 48),
          new THREE.MeshBasicMaterial({ color: COL.water, transparent: true, opacity: 0.3, depthWrite: false }));
      else if (sf.type === "sphere")
        mesh = new THREE.Mesh(new THREE.SphereGeometry(sf.r * s, 36, 24),
          new THREE.MeshBasicMaterial({ color: COL.face, transparent: true, opacity: ghost ? 0.08 : 0.13, depthWrite: false }));
      else if (sf.type === "water")
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(sf.r * s, sf.r * s, sf.h * s, 48),
          new THREE.MeshBasicMaterial({ color: COL.water, transparent: true, opacity: 0.28, depthWrite: false }));
      else if (sf.type === "disc") {
        mesh = new THREE.Mesh(new THREE.CircleGeometry(sf.r * s, 48, sf.ts || 0, sf.tl || Math.PI * 2),
          new THREE.MeshBasicMaterial({ color: COL.fill, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }));
        mesh.rotation.x = Math.PI / 2;
      }
      if (mesh) { mesh.position.copy(toW(sf.c)); T.group.add(mesh); }
    }
    if (!g.anonymous && !g.hideLabels)
      for (const nm of Object.keys(g.pts)) addVertex(nm);
    for (const cl of (g.coordLabels || [])) {
      if (!cl.t) continue;
      const sp = makeSprite(cl.t, { fontPx: 42, color: PAL.blue, bg: "rgba(255,255,255,0.92)", pad: 9, italicSerif: false });
      const mid = toW([(cl.p[0] + cl.q[0]) / 2, (cl.p[1] + cl.q[1]) / 2, (cl.p[2] + cl.q[2]) / 2]);
      sp.position.copy(mid).add(mid.clone().setY(0).normalize().multiplyScalar(0.32));
      sp.position.y += 0.05;
      T.group.add(sp);
    }
  }

  /* подписи данных */
  T.givenMap = {};
  for (const [p1, p2, txt] of (p.labels || [])) {
    const k = segKey(p1, p2);
    T.givenMap[k] = txt;
    const sp = makeSprite(txt, { fontPx: 44, color: txt === "?" ? PAL.amber : PAL.blue, bg: "rgba(255,255,255,0.92)", pad: 10, italicSerif: false });
    const mid = V[p1].clone().add(V[p2]).multiplyScalar(0.5);
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
    T.constructBuild = () => {
      cg.visible = true;
      if (cg.children.length) return;
      const now = T.clock.elapsedTime; let delay = 0.05;
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
        if (!rec || rec.kind !== "construct") continue;
        const { mesh, A, B, len } = rec;
        const dir = B.clone().sub(A);
        mesh.scale.y = 0.0001;
        const st = now + delay;
        T.anims.push({ start: st, dur: 0.55, step: pr => { mesh.scale.y = Math.max(0.0001, pr * len); mesh.position.copy(A).addScaledVector(dir, pr * 0.5); } });
        if (given) {
          const sp = makeSprite(given, { fontPx: 44, color: PAL.amber, bg: "rgba(255,255,255,0.92)", pad: 10, italicSerif: false });
          const mid = A.clone().add(B).multiplyScalar(0.5);
          sp.position.copy(mid).add(mid.clone().normalize().multiplyScalar(0.34));
          sp.material.opacity = 0;
          cg.add(sp);
          T.anims.push({ start: st + 0.3, dur: 0.4, step: pr => { sp.material.opacity = pr; } });
        }
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
    };
    T.constructHide = () => { cg.visible = false; T.solidMats.length = 0; };
  } else { T.constructBuild = null; T.constructHide = null; }

  T.sph.r = 12; T.sph.th = -0.65; T.sph.ph = 1.18; T.setCam();
}

/* ============================================================
   ВЫБОР ЛИНИЙ / ОТРЕЗКИ ПО ДВУМ ТОЧКАМ
   ============================================================ */
const segLabel = rec => rec.anon ? "отрезок" : SUB(rec.p1) + SUB(rec.p2);

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
  if (name) { hintEl.style.display = "block"; hintEl.innerHTML = "Точка <b>" + SUB(name) + "</b> выбрана — кликните вторую точку, чтобы построить отрезок"; }
  else hintEl.style.display = "none";
}

function displayLen(key, rec) {
  if (T.givenMap?.[key] && T.givenMap[key] !== "?") return T.givenMap[key];
  if (rec.given && rec.given !== "?") return rec.given;
  if (!revealed()) return "?";
  return fmtLen(T.scaleFn(rec.p1, rec.p2));
}

function paintSelection() {
  const selKeys = new Set(selected.map(x => x.key));
  for (const [k, rec] of Object.entries(T.segMap))
    rec.mat.color.setHex(selKeys.has(k) ? COL.select : rec.base);
  T.badges.clear();
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
    row.innerHTML = "<span>" + s2.label + ' = <b class="rose">' + val + "</b></span>";
    const del = document.createElement("button");
    del.className = "measure-del"; del.textContent = "✕";
    del.onclick = () => {
      selected = selected.filter(x => x.key !== s2.key);
      if (rec && rec.kind === "user") { rec.mesh.parent?.remove(rec.mesh); delete T.segMap[s2.key]; }
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

  $("probMeta").innerHTML = topicOf(p) + " · № " + p.id +
    ' · <a href="https://math-ege.sdamgia.ru/problem?id=' + p.id + '" target="_blank" rel="noreferrer">открыть на Решу ЕГЭ</a>';
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
  const prev = status[p.id] || {};
  status[p.id] = {
    st: ok ? "ok" : (prev.st === "ok" ? "ok" : "fail"),
    revealed: ok || prev.revealed,
    attempts: (prev.attempts || 0) + 1,
    wrong: (prev.wrong || 0) + (ok ? 0 : 1),
    topic: topicOf(p),
    updatedAt: Date.now()
  };
  saveStatus();
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
  const prev = status[p.id] || {};
  status[p.id] = {
    st: prev.st === "ok" ? "ok" : "fail",
    revealed: true,
    attempts: prev.attempts || 0,
    wrong: prev.wrong || 0,
    topic: topicOf(p),
    updatedAt: Date.now()
  };
  saveStatus();
  const box = $("solBox");
  box.style.display = "block";
  box.innerHTML = '<div class="sol-title">Решение</div>' +
    p.sol.map(l => '<div class="sol-line">' + l + "</div>").join("") +
    '<div class="sol-ans">Ответ: ' + p.ans + ".</div>";
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
  $("btnHome").onclick = () => { T.sph.r = 12; T.sph.th = -0.65; T.sph.ph = 1.18; T.setCam(); };
}

/* ---------- запуск ---------- */
initThree();
bind();
showProblem();
})();
