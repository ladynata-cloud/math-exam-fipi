#!/usr/bin/env node
'use strict';

// Independent source-space ray/triangle checks for the fixed oblique renderer.
// No browser, network, public test hook, or third-party DOM package is required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'ege-profil/trainers/stereo-t14.html'), 'utf8');
const shared = fs.readFileSync(path.join(root, 'stereo-course/assets/task-scene-viewer.js'), 'utf8');
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const geometry = html.match(/<script>\n(\/\* ================= ГЕОМЕТРИЯ.*?<\/script>)/s)[1];
assert.equal(hash(geometry), '736c2060342fc55ff9039d4168cf560bd16afeeb68e4ba1b01c2cd5d6e7b4720', 'tasks, formulae and original geometry remain unchanged');
const outsideScene = html.slice(0, html.indexOf('/* ================= ИНТЕРФЕЙС')) + html.slice(html.indexOf('  /* ---------- хранение ---------- */'));
assert.equal(hash(outsideScene), '926d0da0482466d42385b07e9cc93d2f39bd5b71c8fae66b10dcd445a1f2056a', 'all other UI, lesson data and storage remain unchanged');
const core = (source, begin, end) => source.split(begin + '\n')[1].split(end)[0];
assert.equal(core(html, '  // BEGIN GENERATED PROFILE VISIBILITY FALLBACK', '  // END GENERATED PROFILE VISIBILITY FALLBACK'),
  core(shared, '  // BEGIN SHARED VISIBILITY CORE', '  // END SHARED VISIBILITY CORE'), 'embedded core must be byte-identical');

class Element {
  constructor(tag) { this.tagName = tag; this.attributes = {}; this.children = []; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null; }
  appendChild(node) { this.children.push(node); node.parentNode = this; return node; }
}
const context = { module: { exports: {} }, document: { createElementNS: (_ns, tag) => new Element(tag) } };
vm.createContext(context);
vm.runInContext(geometry.replace(/<\/script>$/, ''), context);
const G = context.module.exports;
let ui = html.slice(html.indexOf('/* ================= ИНТЕРФЕЙС'), html.indexOf('  /* ---------- хранение ---------- */'));
ui += '\n globalThis.sceneTest = {buildScene:buildScene, applyHl:applyHl};\n})();';
vm.runInContext(ui, context);
const { buildScene, applyHl } = context.sceneTest;
const all = (node, tag) => [...(node.tagName === tag ? [node] : []), ...node.children.flatMap(child => all(child, tag))];
const attrNumber = (node, name) => Number(node.getAttribute(name));
const partsFor = (scene, key) => all(scene.svg, 'line').filter(line => line.getAttribute('data-segment') === key)
  .sort((a, b) => attrNumber(a, 'data-part-start') - attrNumber(b, 'data-part-start'));
const hiddenLength = parts => parts.reduce((sum, p) => sum + (p.getAttribute('data-hidden') === 'true' ? attrNumber(p, 'data-part-end') - attrNumber(p, 'data-part-start') : 0), 0);
const near = (actual, expected, epsilon, message) => assert.ok(Math.abs(actual - expected) < epsilon, `${message}: ${actual} != ${expected}`);
const plus = (a,b) => a.map((v,i) => v+b[i]);
const minus = (a,b) => a.map((v,i) => v-b[i]);
const times = (a,t) => a.map(v => v*t);
const dot = (a,b) => a.reduce((s,v,i) => s+v*b[i],0);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
// These faces express the named solids in the original task coordinates.
// The oracle intersects a 3D viewing ray, not the renderer's projected polygons.
const faces = {
  cube: ['A B C D','A1 B1 C1 D1','A B B1 A1','B C C1 B1','C D D1 C1','D A A1 D1'],
  pyr4: ['A B C D','S A B','S B C','S C D','S D A'],
  prism3: ['A B C','A1 B1 C1','A B B1 A1','B C C1 B1','C A A1 C1'],
  pyr3: ['A B C','S A B','S B C','S C A']
};
const ray = [.45,-1,.30];
function isOccluded(p, body, kind) {
  for (const names of faces[kind]) {
    const vertices = names.split(' ').map(n => body.V[n]);
    for (let i=1; i<vertices.length-1; i++) {
      const a=vertices[0], e1=minus(vertices[i],a), e2=minus(vertices[i+1],a);
      const h=cross(ray,e2), determinant=dot(e1,h);
      if (Math.abs(determinant)<1e-10) continue;
      const offset=minus(p,a), u=dot(offset,h)/determinant;
      if (u < -1e-9 || u > 1+1e-9) continue;
      const q=cross(offset,e1), v=dot(ray,q)/determinant;
      if (v < -1e-9 || u+v > 1+1e-9) continue;
      if (dot(e2,q)/determinant > 1e-6) return true;
    }
  }
  return false;
}
let checkedSegments = 0, checkedSamples = 0, sceneCount = 0;
function checkScene(problem) {
  const scene = buildScene(problem), body = G.points(problem);
  const expected = [...body.hidden, ...body.edges, ...(problem.extra || [])];
  assert.equal(new Set(expected.map(e => e.join('-'))).size, expected.length, 'fixture uses unique directed segments');
  const groups = scene.svg.children.filter(n => n.tagName === 'g');
  assert.deepEqual(groups.map(n => n.getAttribute('data-visibility-layer')), ['hidden','visible']);
  for (const [a,b] of expected) {
    const key = a+'-'+b, parts = partsFor(scene,key);
    assert.ok(parts.length, `${problem.id}: missing ${key}`);
    near(attrNumber(parts[0],'data-part-start'),0,1e-10,`${key} begins at zero`);
    near(attrNumber(parts.at(-1),'data-part-end'),1,1e-10,`${key} ends at one`);
    for (let i=0; i<parts.length; i++) {
      const part=parts[i], start=attrNumber(part,'data-part-start'), end=attrNumber(part,'data-part-end');
      assert.ok(end>start, `${key}: nonempty interval`);
      if(i) near(start,attrNumber(parts[i-1],'data-part-end'),1e-10,`${key}: exact partition`);
      const hidden=part.getAttribute('data-hidden')==='true';
      assert.equal(part.getAttribute('stroke-dasharray'),hidden?'5 5':null,`${key}: visible dash semantics`);
      assert.equal(part.parentNode.getAttribute('data-visibility-layer'),hidden?'hidden':'visible');
      for (const fraction of [.13,.31,.5,.73,.89]) {
        const t=start+(end-start)*fraction;
        const point=plus(body.V[a],times(minus(body.V[b],body.V[a]),t));
        assert.equal(hidden,isOccluded(point,body,problem.fig[0]),`${problem.id}: ${key} at ${t}, independent ray`);
        checkedSamples++;
      }
    }
    checkedSegments++;
  }
  const strokes = all(scene.svg,'line');
  const dashState = strokes.map(n => ['stroke-dasharray','stroke-dashoffset','data-hidden','data-part-start','data-part-end'].map(k=>n.getAttribute(k)));
  applyHl(scene, expected.map(edge=>edge.join('')));
  assert.deepEqual(strokes.map(n => ['stroke-dasharray','stroke-dashoffset','data-hidden','data-part-start','data-part-end'].map(k=>n.getAttribute(k))),dashState,'highlight cannot expose hidden parts');
  assert.ok(strokes.every(n=>+n.getAttribute('stroke-width')>=3.2));
  applyHl(scene,[]);
  sceneCount++;
  return scene;
}
const scenes = G.PROBLEMS.map(checkScene);
near(hiddenLength(partsFor(scenes[0],'A-C1')),1,1e-7,'cube interior AC1 is hidden');
near(hiddenLength(partsFor(scenes[0],'A-B')),0,1e-7,'cube silhouette AB stays solid');
for (let i=0;i<G.PROBLEMS.length;i++) {
  if ((G.PROBLEMS[i].extra||[]).some(e=>e.join('-')==='S-O')) near(hiddenLength(partsFor(scenes[i],'S-O')),1,1e-7,`${G.PROBLEMS[i].id} interior SO is hidden`);
  if (G.PROBLEMS[i].fig[0]==='pyr4') near(hiddenLength(partsFor(scenes[i],'S-D')),1,1e-7,`${G.PROBLEMS[i].id} rear edge SD is hidden`);
}

// Force a real visible/hidden/visible construction and its reverse through the
// actual scene renderer, without editing authored task data or the body faces.
const cube = G.FIGS.cube;
G.FIGS.cube = a => { const body=cube(a); body.V.E=[-2,1,1]; body.V.F=[4,1,1]; return body; };
const partial = checkScene({ id:'partial-control', fig:['cube',2], extra:[['E','F'],['F','E']], derive:{}, faces:[] });
G.FIGS.cube = cube;
const forward=partsFor(partial,'E-F'), backward=partsFor(partial,'F-E');
assert.deepEqual(forward.map(n=>n.getAttribute('data-hidden')),['false','true','false']);
near(attrNumber(forward[1],'data-part-start'),1.55/6,1e-7,'independent left face entry');
near(attrNumber(forward[1],'data-part-end'),4/6,1e-7,'independent right face exit');
function painted(line, x, y) {
  const start=[attrNumber(line,'x1'),attrNumber(line,'y1')], finish=[attrNumber(line,'x2'),attrNumber(line,'y2')];
  const length=Math.hypot(finish[0]-start[0],finish[1]-start[1]);
  const distance=((x-start[0])*(finish[0]-start[0])+(y-start[1])*(finish[1]-start[1]))/length;
  const phase=((distance+attrNumber(line,'stroke-dashoffset'))%10+10)%10;
  return phase<5;
}
let gaps=0, ink=0;
for (let i=1;i<500;i++) {
  const line=forward[1], t=i/500;
  const x=attrNumber(line,'x1')+(attrNumber(line,'x2')-attrNumber(line,'x1'))*t;
  const y=attrNumber(line,'y1')+(attrNumber(line,'y2')-attrNumber(line,'y1'))*t;
  assert.equal(painted(line,x,y),painted(backward[1],x,y),'reversed hidden strokes retain the same gaps');
  if(painted(line,x,y)) ink++; else gaps++;
}
assert.ok(gaps>100 && ink>100,'dash phase test checks both gaps and strokes');
const hiddenNode=partsFor(scenes[0],'A-C1')[0];
const savedDash=hiddenNode.getAttribute('stroke-dasharray');
hiddenNode.setAttribute('stroke-dasharray','none');
assert.throws(()=>assert.equal(hiddenNode.getAttribute('stroke-dasharray'),'5 5'),'negative control rejects an exposed hidden stroke');
hiddenNode.setAttribute('stroke-dasharray',savedDash);
console.log(JSON.stringify({status:'PASS',sceneCount,checkedSegments,checkedSamples,partialIntervals:forward.length,reversedDashSamples:499,negativeControls:1,geometryHash:hash(geometry),htmlHash:hash(html)},null,2));
