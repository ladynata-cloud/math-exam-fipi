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
