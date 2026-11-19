'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const os = require('node:os'), crypto = require('node:crypto'), {spawnSync} = require('node:child_process');
const {historicalSignature, signature} = require('./visibility-profile-composition.cjs');
const {beforeProfileComposition, FILE, BEFORE, AFTER} = require('./visibility-profile-runtime-migration.cjs');
const {beforeCompactPreview} = require('./harmonization-preview-migration.cjs');
const {beforeRightAngles} = require('./right-angle-renderer-migration.cjs');
const root = path.resolve(__dirname, '../..'), hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const course = require('../../stereo-course/merzlyak-10-base/data/course.json');
const lessons = course.lessons.filter(lesson => /^research-sections-00[1-6]$/.test(lesson.id));
assert.equal(lessons.length, 6, 'all six sections research cards remain present');
const lesson = lessons.find(lesson => lesson.id === 'research-sections-004'), model = lesson.visualization.model;
const source = JSON.stringify(model), baseline = require('./visibility-profiles/merzlyak.json');
const original = baseline.profiles.find(profile => profile.lessonIds.includes(lesson.id));
assert.equal(historicalSignature(lesson.id, model, original.signature), original.signature);
assert.equal(historicalSignature(lesson.id, model, signature(model)), signature(model));
const viewer = require('../../stereo-course/assets/task-scene-viewer.js'), prepared = viewer.prepare(model);
assert.deepEqual(prepared.faces.map(face => face.names), original.faces, 'original six occluding faces restored');
assert.equal(Object.keys(prepared.viewSurfaces).length, 7, 'four old and three new surface views');
for (const [key, faces] of Object.entries(original.views)) {
  assert.deepEqual(prepared.viewSurfaces[key].faces.map(face => face.names), faces, 'unchanged historical surface ' + key);
}
for (const key of ['first-ratio', 'parallel-bases']) {
  assert.deepEqual(prepared.viewSurfaces[key].faces.map(face => face.names), original.faces, key + ': first prism');
}
assert.deepEqual(prepared.viewSurfaces['second-ratio'].faces.map(face => face.names), original.views['second-section'], 'second-ratio: second prism');
assert.equal(JSON.stringify(model), source, 'projection and preparation must not mutate learner data');
const oldModel = structuredClone(model);
for (const key of ['first-ratio', 'parallel-bases', 'second-ratio']) delete oldModel.views[key];
assert.deepEqual(viewer.prepare(oldModel).faces.map(face => face.names), original.faces, 'new viewer remains compatible with cached old lesson data');
assert.equal(Object.keys(viewer.prepare(oldModel).viewSurfaces).length, 4);
for (const other of lessons.filter(item => item.id !== lesson.id)) {
  assert.deepEqual(viewer.prepare(other.visualization.model).faces.map(face => face.names), other.visualization.model.faces, other.id + ': own original surfaces unchanged');
}
let negativeControls = 0;
for (const mutate of [
  model => { model.points.X[0] += .001; },
  model => { model.views.front.segments[0] = ['A', 'C']; },
  model => { model.views['first-ratio'].segments[0] = ['A', 'C']; },
  model => { model.views['parallel-bases'].points.push('V'); },
  model => { model.views['second-ratio'].label += ' changed'; },
  model => { model.views.unreviewed = {segments: [['A', 'C']]}; },
  model => { delete model.views['second-ratio']; }
]) {
  const changed = structuredClone(model); mutate(changed);
  assert.throws(() => historicalSignature(lesson.id, changed, original.signature), /exact reviewed/);
  negativeControls++;
}
const changedGeometry = structuredClone(model); changedGeometry.points.X[0] += .001;
assert.equal(viewer.prepare(changedGeometry).faces.length, 0, 'unknown geometry must not inherit the approved profile');
negativeControls++;
const renderer = fs.readFileSync(path.join(root, FILE));
const profileOnly = beforeRightAngles(FILE, beforeCompactPreview(FILE, renderer));
assert.equal(hash(profileOnly), AFTER, 'removing only reviewed angle marks and compact sizing retains the exact profile renderer');
const historicalRenderer = bytes => beforeProfileComposition(FILE, beforeRightAngles(FILE, beforeCompactPreview(FILE, bytes)));
assert.equal(hash(historicalRenderer(renderer)), BEFORE, 'exact composed byte inverse retains every old profile and executable line');
const previewOnly = beforeProfileComposition(FILE, profileOnly).toString().replace(
  '      viewportHeight = Math.max(360, Math.min(680, viewportWidth * .76));',
  '      const minimum = options.compactPreview ? 300 : 360;\n      viewportHeight = Math.max(minimum, Math.min(680, viewportWidth * .76));');
assert.equal(hash(Buffer.from(previewOnly)), '7681c481f3ee217a06e6714e01b113873494cb1e28ed712bec7bcbba5d7c3cea', 'original reviewed preview-only bytes stay frozen');
assert.equal(hash(beforeCompactPreview(FILE, Buffer.from(previewOnly))), BEFORE, 'original preview-only inverse remains accepted');
for (const changed of [Buffer.concat([renderer, Buffer.from('\nUNREVIEWED')]), Buffer.from(renderer.toString().replace('const surfaceProfile =', 'const changedSurfaceProfile =')),
  Buffer.from(renderer.toString().replace('options.compactPreview ? 300 : 360', 'options.compactPreview ? 301 : 360')),
  Buffer.from(renderer.toString().replace('first-ratio', 'unreviewed-ratio'))]) {
  assert.throws(() => historicalRenderer(changed), /exact reviewed/, 'an unrelated runtime, compact-sizing or profile edit cannot be projected away');
  negativeControls++;
}
// Reuse the independent world-space ray/triangle oracle, not the renderer's
// geometric helpers. It inspects every SVG interval in all six actual cards,
// including the three new views, under the default and two rotated cameras.
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'sections-visibility-'));
try {
  const bundle = path.join(temporary, 'course.json'); fs.writeFileSync(bundle, JSON.stringify({lessons}));
  const checked = spawnSync(process.execPath, [path.join(__dirname, 'visibility-math.test.cjs')], {
    cwd: root, env: {...process.env, VISIBILITY_BUNDLE: bundle, VISIBILITY_BUNDLES: ''}, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024
  });
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  const line = checked.stdout.split('\n').find(line => line.startsWith('ATANASYAN_VISIBILITY_MATH_OK '));
  assert(line, 'independent oracle completion required');
  const stats = JSON.parse(line.slice('ATANASYAN_VISIBILITY_MATH_OK '.length));
  assert.equal(stats.cards, 6); assert.equal(stats.profiledCards, 1);
  assert.equal(stats.authoredViews, lessons.reduce((count, item) => count + Object.keys(item.visualization.model.views).length, 0));
  assert(stats.hiddenPaths > 0 && stats.rays > 0 && stats.rotatedViews > 0);
  console.log(line);
} finally { fs.rmSync(temporary, {recursive: true, force: true}); }
console.log('SECTIONS_VISIBILITY_COMPOSITION_OK ' + JSON.stringify({cards: 6, exactDerivedProfiles: 1, newViews: 3, negativeControls}));
