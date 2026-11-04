'use strict';
// Projection regression for the legacy trainer's real scene construction and
// camera controls. WebGL and text rasterization are not exercised here: browser
// screenshots remain a separate gate. Synthetic label sizes deliberately vary.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const THREE = require('../trainers/ege-profile-stereometry-3d/js/three.min.js');
const visibility = require('../assets/stereo-three-visibility.js');
const folder = 'trainers/ege-profile-stereometry-3d';
const source = fs.readFileSync(path.join(root, folder, 'js/trainer.js'), 'utf8');
const events = new Map(), windowEvents = new Map();
let resize, frame;
const mount = { clientWidth: 760, clientHeight: 900, appendChild() {} };
const canvas = { style: {}, addEventListener(name, callback) { events.set(name, callback); } };
class Renderer {
  constructor() { this.domElement = canvas; }
  setPixelRatio() {}
  setSize(w, h) { this.width = w; this.height = h; }
  render() {}
}
const ctx = vm.createContext({
  THREE: { ...THREE, WebGLRenderer: Renderer }, StereoThreeVisibility: visibility,
  console, window: { devicePixelRatio: 1, addEventListener(name, callback) { windowEvents.set(name, callback); } },
  ResizeObserver: class { constructor(callback) { resize = callback; } observe() {} },
  requestAnimationFrame(callback) { frame = callback; },
  document: { getElementById() { return mount; } }
});
vm.runInContext(fs.readFileSync(path.join(root, folder, 'js/data.js'), 'utf8'), ctx);
vm.runInContext(`
  const $ = id => document.getElementById(id);
  const T = {}; let autoRot = false;
  makeSprite = text => { const s = new THREE.Sprite(new THREE.SpriteMaterial());
    s.scale.set(.25 + String(text).length * .27, .65, 1); return s; };
  globalThis.state = T; globalThis.bank = PROBLEMS;
  globalThis.setAuto = value => { autoRot = value; };
`, ctx);
const initStart = source.indexOf('function initThree()');
const buildStart = source.indexOf('function buildScene(');
const buildEnd = source.indexOf('\n/* ============================================================', buildStart);
vm.runInContext(source.slice(initStart, buildEnd) + '\ninitThree(); globalThis.build = buildScene;', ctx);
const T = ctx.state;
const sizes = [[320, 521], [320, 416], [320, 280], [760, 900], [1280, 720]];
let cards = 0, projections = 0, negativeClips = 0;
const regressions = [];
function points() {
  T.group.updateMatrixWorld(true);
  const vertices = [], labels = [];
  T.group.traverse(object => {
    if (object.isSprite) { labels.push({ center: object.getWorldPosition(new THREE.Vector3()), width: object.scale.x, height: object.scale.y }); return; }
    const pos = object.geometry?.attributes?.position;
    if (!pos) return;
    for (let i = 0; i < pos.count; i++) vertices.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(object.matrixWorld));
  });
  return { vertices, labels };
}
function outside(v) { return Math.abs(v.x) > 1 + 1e-7 || Math.abs(v.y) > 1 + 1e-7 || v.z < -1 || v.z > 1; }
function check(model, description) {
  T.camera.updateMatrixWorld(true);
  for (const v of model.vertices) {
    const p = v.clone().project(T.camera); projections++;
    assert(!outside(p), description + ' clipped geometry ' + p.toArray());
  }
  // THREE sprites are camera-facing; test all four actual world-size corners.
  for (const label of model.labels) for (const x of [-.5, .5]) for (const y of [-.5, .5]) {
    const p = new THREE.Vector3(label.width * x, label.height * y, 0).applyQuaternion(T.camera.quaternion).add(label.center).project(T.camera);
    projections++; assert(!outside(p), description + ' clipped label ' + p.toArray());
  }
}
for (const card of ctx.bank) {
  ctx.build(card); cards++;
  const model = points();
  for (const [width, height] of sizes) {
    mount.clientWidth = width; mount.clientHeight = height;
    T.goHome(); resize();
    check(model, card.id + ' home ' + width + 'x' + height);
    const homeDistance = T.sph.r;
    // Full containment must hold through rotation; a bounding sphere gives
    // that guarantee without changing the distance after each pointer move.
    for (const [th, ph] of [[1.1, .35], [-2.3, 2.8]]) {
      T.sph.th = th; T.sph.ph = ph; T.setCam();
      check(model, card.id + ' rotated ' + width + 'x' + height);
      assert.equal(T.sph.r, homeDistance);
    }
    if (['27052', '27054'].includes(String(card.id))) {
      const fitted = homeDistance;
      T.sph.r = 12; T.sph.th = -.65; T.sph.ph = 1.18; T.setCam(); T.camera.updateMatrixWorld(true);
      const clipped = model.vertices.filter(v => outside(v.clone().project(T.camera))).length;
      if (clipped) negativeClips++;
      regressions.push({ id: String(card.id), width, height, fittedDistance: fitted, oldCameraClippedVertices: clipped });
    }
  }
}
assert.equal(cards, 143);
assert(negativeClips >= 2, 'the original fixed-distance camera must fail actual clipped fixtures');
// Home responds to a viewport change, but an intentional zoom/rotation is
// preserved. Zoom-out never jumps toward a far fitted mobile home distance.
ctx.build(ctx.bank.find(p => String(p.id) === '27054'));
mount.clientWidth = 320; mount.clientHeight = 600; resize(); T.goHome();
const mobileDistance = T.homeR;
assert(mobileDistance > 12);
events.get('wheel')({ preventDefault() {}, deltaY: -100 });
assert.equal(T.atHome, false);
assert(T.sph.r < mobileDistance);
const zoomed = T.sph.r;
mount.clientWidth = 760; mount.clientHeight = 900; resize();
assert.equal(T.sph.r, zoomed, 'resize preserves intentional zoom');
T.goHome(); assert.equal(T.atHome, true); assert(T.sph.r < mobileDistance);
mount.clientWidth = 0; mount.clientHeight = 0; const aspect = T.camera.aspect; resize();
assert.equal(T.camera.aspect, aspect, 'hidden viewport does not corrupt the camera');
mount.clientWidth = 320; mount.clientHeight = 600; T.goHome(); resize();
ctx.setAuto(true); frame(); assert.equal(T.atHome, false, 'automatic rotation preserves its angle on resize');
ctx.setAuto(false); T.visibility.dispose();
console.log(JSON.stringify({ result: 'STEREO_THREE_FRAMING_OK', cards, projections, negativeClips, sizes, regressions, raster: 'NOT_RUN' }, null, 2));
