'use strict';
// The task harmonizes the topic workshops. These complete source trees remain
// frozen against the authorized base, including every published model and the
// legacy trainers. Ten exact runtime/route amendments already reviewed in #658
// have a separate full-byte supplement; every other byte stays unchanged.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const baseline = require('./preservation-baseline.json');
const supplements = [
  require('./preservation-supplement-658.json'),
  require('./preservation-supplement-651.json'),
  require('./preservation-supplement-651-ci.json'),
  require('./preservation-supplement-651-legacy-segments.json'),
  require('./preservation-supplement-693-board.json')
];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(baseline.schemaVersion, 1);
assert.equal(baseline.base, '5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae');
const [auditSupplement, compositionSupplement, ciSupplement, legacySegmentsSupplement] = supplements;
for (const supplement of supplements) {
  assert.equal(supplement.schemaVersion, 1);
  assert.equal(supplement.base, baseline.base);
}
assert.equal(auditSupplement.sourceCommit, '5d58b20a9aad26fbddc479f038d7df0faa62c68a');
assert.equal(auditSupplement.task, 'GEOMETRY_COURSES_AUDIT_20261118');
assert.deepEqual(Object.keys(auditSupplement.files).sort(), [
  'geometry-course/textbook/assets/engine.js',
  'geometry-course/textbook/assets/grade7-board-engine.js',
  'stereo-course/literacy/app.js',
  ...['course.js', 'lesson-model.js', 'lesson.html', 'lesson.js', 'lessons-a.js', 'lessons-b.js', 'lessons.js'].map(name => 'ege-profil/atanasyan-10-11/' + name)
].sort(), 'only the ten exact previously reviewed files may differ');
assert.equal(compositionSupplement.sourceCommit, '64ce01049377b4289f46979c52f2c50daf84b92f');
assert.equal(compositionSupplement.task, 'FINAL651_APPROVED_COMPOSITION_20261118');
assert.deepEqual(Object.keys(compositionSupplement.files).sort(), [
  'ege-profil/atanasyan-10-11/lessons-a.js',
  'ege-profil/atanasyan-10-11/model.js',
  'stereo-course/literacy/app.js',
  'stereo-course/textbook/schema/lesson.schema.json'
].sort(), 'only the four exact composed right-angle amendments may extend the frozen inventory');
assert.equal(ciSupplement.sourceCommit, 'f5987d9a654d6b0f4ad8d18f5786e8d9f8510b7a');
assert.equal(ciSupplement.task, 'FINAL651_EXACT_RENDERER_SYNC_20261119');
assert.deepEqual(Object.keys(ciSupplement.files), [
  'ege-profil/atanasyan-10-11/model.js'
], 'only the exact generated legacy renderer may be synchronized with the reviewed shared implementation');
assert.equal(legacySegmentsSupplement.sourceCommit, '78853df87a48dddd5a96bf5f2ad4947a9016225b');
assert.equal(legacySegmentsSupplement.task, 'FINAL651_LEGACY_VIEW_SEGMENTS_20261119');
assert.deepEqual(Object.keys(legacySegmentsSupplement.files), ['ege-profil/atanasyan-10-11/model.js']);
assert.deepEqual(Object.keys(supplements[4].files), ['geometry-course/textbook/assets/grade7-board-session.js']);
const sphere = require('./preservation-sphere-414.json');
const { ids: sphereIds } = require('../stereo-textbook/additional414-baseline.cjs');
assert.deepEqual(Object.keys(sphere.additions).sort(), [...sphereIds].map(id => 'stereo-course/textbook/lessons/' + id + '.json').sort());
assert.deepEqual(Object.keys(sphere.files).sort(), ['stereo-course/textbook/data/course.json', 'stereo-course/textbook/source-index.json']);
const mixed = require('../stereo-textbook/inscribed-solids.json');
const circumspheres = require('../stereo-textbook/circumspheres.json');
const round = require('../stereo-textbook/round-bodies.json');
const volumes = require('../stereo-textbook/box-volumes.json');
const prismVolumes = require('../stereo-textbook/prism-volumes.json');
const sections = require('../stereo-textbook/cross-sections.json');
const oblique = require('../stereo-textbook/oblique-prisms.json');
const pyramids = require('../stereo-textbook/pyramid-volumes.json');
const projections = require('../stereo-textbook/pyramid-projections.json');
const frusta = require('../stereo-textbook/pyramid-frusta.json');
const cones = require('../stereo-textbook/cone-volumes.json');
const sectors = require('../stereo-textbook/cone-nets-and-frusta.json');
const spheres = require('../stereo-textbook/sphere-measures.json');
const sphereApplications = require('../stereo-textbook/sphere-applications.json');
const volumeSelfcheck = require('../stereo-textbook/volume-selfcheck.json');
const prismApplications = require('../stereo-textbook/prism-applications.json');
const normalPrismApplications = require('../stereo-textbook/normal-prism-applications.json');
const pyramidAngleApplications = require('../stereo-textbook/pyramid-angle-applications.json');
const pyramidComparisonApplications = require('../stereo-textbook/pyramid-comparison-applications.json');
const cylinderApplications = require('../stereo-textbook/cylinder-applications.json');
const inscribedVolumeApplications = require('../stereo-textbook/inscribed-volume-applications.json');
const sphereVolumeAngles = require('../stereo-textbook/sphere-volume-angles.json');
const volumeChapterEnd = require('../stereo-textbook/volume-chapter-end.json');
const vectorBasics = require('../stereo-textbook/vector-basics.json');
const vectorPairs = require('../stereo-textbook/vector-pairs.json');
const vectorProperties = require('../stereo-textbook/vector-properties.json');
const spatialVectorSums = require('../stereo-textbook/spatial-vector-sums.json');
const oppositeDifference = require('../stereo-textbook/opposite-and-difference-vectors.json');
const vectorOriginPaths = require('../stereo-textbook/vector-origin-and-paths.json');
const diagonalPaths = require('../stereo-textbook/prism-diagonals-and-vector-paths.json');
const signedVectorCombinations = require('../stereo-textbook/signed-vector-combinations.json');
const prismVectorEquations = require('../stereo-textbook/prism-vector-equations.json');
const pyramidVectorMidpoints = require('../stereo-textbook/pyramid-vector-midpoints.json');
const midlinesVectorCoefficients = require('../stereo-textbook/midlines-vector-coefficients.json');
const collinearityVectorConditions = require('../stereo-textbook/collinearity-vector-conditions.json');
const coplanarVectorDirections = require('../stereo-textbook/coplanar-vector-directions.json');
const parallelepipedDirectedBases = require('../stereo-textbook/parallelepiped-directed-bases.json');
const fieldsAndMidpointVectors = require('../stereo-textbook/fields-and-midpoint-vectors.json');
const centroidsInTetrahedra = require('../stereo-textbook/centroids-in-tetrahedra.json');
const heightAndMidpointProofs = require('../stereo-textbook/height-and-midpoint-proofs.json');
const vectorChapterSelfcheck = require('../stereo-textbook/vector-chapter-selfcheck.json');
const additionalDirectedEdgeSums = require('../stereo-textbook/additional-directed-edge-sums.json');
const vectorSpanAndBarycentres = require('../stereo-textbook/vector-span-and-barycentres.json');
const vectorChapterSixEnd = require('../stereo-textbook/vector-chapter-six-end.json');
const cartesianCoordinateStart = require('../stereo-textbook/cartesian-coordinate-start.json');
const extraCards = Object.fromEntries(Object.entries({...mixed.cards, ...circumspheres.cards, ...round.cards, ...volumes.cards, ...prismVolumes.cards, ...sections.cards, ...oblique.cards, ...pyramids.cards, ...projections.cards, ...frusta.cards, ...cones.cards, ...sectors.cards, ...spheres.cards, ...sphereApplications.cards, ...volumeSelfcheck.cards, ...prismApplications.cards, ...normalPrismApplications.cards, ...pyramidAngleApplications.cards, ...pyramidComparisonApplications.cards, ...cylinderApplications.cards, ...inscribedVolumeApplications.cards, ...sphereVolumeAngles.cards, ...volumeChapterEnd.cards, ...vectorBasics.cards, ...vectorPairs.cards, ...vectorProperties.cards, ...spatialVectorSums.cards, ...oppositeDifference.cards, ...vectorOriginPaths.cards, ...diagonalPaths.cards, ...signedVectorCombinations.cards, ...prismVectorEquations.cards, ...pyramidVectorMidpoints.cards, ...midlinesVectorCoefficients.cards, ...collinearityVectorConditions.cards, ...coplanarVectorDirections.cards, ...parallelepipedDirectedBases.cards, ...fieldsAndMidpointVectors.cards, ...centroidsInTetrahedra.cards, ...heightAndMidpointProofs.cards, ...vectorChapterSelfcheck.cards, ...additionalDirectedEdgeSums.cards, ...vectorSpanAndBarycentres.cards, ...vectorChapterSixEnd.cards, ...cartesianCoordinateStart.cards}).map(([id,row]) => ['stereo-course/textbook/lessons/' + id + '.json', row.raw]));
const amendmentChains = {};
for (const supplement of [...supplements, sphere, mixed, circumspheres, round, volumes, prismVolumes, sections, oblique, pyramids, projections, frusta, cones, sectors, spheres, sphereApplications, volumeSelfcheck, prismApplications, normalPrismApplications, pyramidAngleApplications, pyramidComparisonApplications, cylinderApplications, inscribedVolumeApplications, sphereVolumeAngles, volumeChapterEnd, vectorBasics, vectorPairs, vectorProperties, spatialVectorSums, oppositeDifference, vectorOriginPaths, diagonalPaths, signedVectorCombinations, prismVectorEquations, pyramidVectorMidpoints, midlinesVectorCoefficients, collinearityVectorConditions, coplanarVectorDirections, parallelepipedDirectedBases, fieldsAndMidpointVectors, centroidsInTetrahedra, heightAndMidpointProofs, vectorChapterSelfcheck, additionalDirectedEdgeSums, vectorSpanAndBarycentres, vectorChapterSixEnd, cartesianCoordinateStart]) {
  for (const [file, amendment] of Object.entries(supplement.files)) {
    const chain = amendmentChains[file] ||= [];
    if (chain.length) assert.equal(amendment.beforeSHA256, chain.at(-1).afterSHA256, 'exact amendment chain: ' + file);
    chain.push(amendment);
  }
}
assert.deepEqual(baseline.groups.map(group => group.group), ['geometry_textbook', 'first_steps', 'legacy_trainers', 'stereo_textbook', 'literacy', 'ege_bridge']);
function filesAt(relative) {
  const name = path.join(root, relative);
  if (fs.statSync(name).isFile()) return [relative];
  return fs.readdirSync(name, {withFileTypes: true}).flatMap(entry => {
    assert(!entry.isSymbolicLink(), 'protected source cannot be replaced by a symlink');
    return filesAt(path.posix.join(relative, entry.name));
  });
}
// Independently authored assets in source commit 4a7c2d1; the old textbook bank stays byte-identical.
const approvedAreaFiles = {
  "geometry-course/textbook/assets/additional-lessons.js": "82e927e05ed568da30843ad7f79d4a75463e0fc096c827aa6cba2551b2ee68eb",
  "geometry-course/textbook/data/area-lessons.json": "fa3a34d97b7bb419085b4c3cebdf0a43d6b85f2084dc6775fe745eafedb059b4"
};
const newGroups = {geometry_textbook: approvedAreaFiles, stereo_textbook: {...sphere.additions, ...extraCards}};
function verify(group, read = file => fs.readFileSync(path.join(root, file)), extra = []) {
  const files = [...new Set(group.paths.flatMap(filesAt).concat(extra))].filter(file => !group.excluded.includes(file)).sort();
  const additions = newGroups[group.group] || {};
  assert.equal(files.length, group.fileCount + Object.keys(additions).length, group.group + ': exact protected file set size');
  for (const file of Object.keys(additions)) assert(files.includes(file), 'required reviewed addition: ' + file);
  const digest = crypto.createHash('sha256');
  for (const file of files) {
    const current = hash(read(file)), chain = amendmentChains[file];
    if (Object.hasOwn(additions, file)) {
      assert.equal(current, additions[file], 'exact reviewed new source: ' + file);
      continue;
    }
    if (chain) {
      assert.equal(current, chain.at(-1).afterSHA256, 'exact reviewed amendment: ' + file);
      assert.match(chain[0].beforeSHA256, /^[a-f0-9]{64}$/);
    }
    digest.update(file + '\0' + (chain ? chain[0].beforeSHA256 : current) + '\n');
  }
  assert.equal(digest.digest('hex'), group.sha256, group.group + ': every source path and byte must match the authorized base');
}
for (const group of baseline.groups) verify(group);
const geometry = require(root + '/geometry-course/textbook/data/course.json');
const currentStereo = require(root + '/stereo-course/textbook/data/course.json');
assert.equal(currentStereo.lessons.length, 1112);
const stereo = require('../stereo-textbook/additional414-baseline.cjs').previousCourse(currentStereo, require(root + '/stereo-course/textbook/source-index.json'));
const first = require(root + '/learning/atanasyan-first-steps/course.json');
const literacy = require(root + '/stereo-course/literacy/data/course.json');
const legacy = require(root + '/geometry-course/data/legacy.json');
assert.equal(geometry.lessons.length, 1425);
assert.equal(stereo.lessons.length, 674);
assert.equal(first.lessons.length, 255);
assert.equal(literacy.lessons.length, 36);
assert.equal(legacy.length, 70);
assert.equal(geometry.lessons.reduce((n, lesson) => n + lesson.steps.length, 0), 4951);
assert.equal(stereo.lessons.reduce((n, lesson) => n + lesson.steps.length, 0), 2614);
const sample = baseline.groups.find(group => group.group === 'literacy');
const protectedFile = 'stereo-course/literacy/data/course.json';
assert.throws(() => verify(sample, file => file === protectedFile ? Buffer.from('CHANGED') : fs.readFileSync(path.join(root, file))), /every source path and byte/);
assert.throws(() => verify(sample, undefined, ['stereo-course/literacy/unapproved.json']), /exact protected file set size/);
for (const file of Object.keys(amendmentChains)) {
  const group = baseline.groups.find(group => group.paths.some(prefix => file === prefix || file.startsWith(prefix)));
  assert(group, 'every exact amendment remains inside the original protected inventory');
  assert.throws(() => verify(group, name => name === file ? Buffer.concat([fs.readFileSync(path.join(root, name)), Buffer.from('\nUNREVIEWED')]) : fs.readFileSync(path.join(root, name))), /exact reviewed amendment/);
}
for (const group of baseline.groups.filter(group => newGroups[group.group])) {
  const sample = Object.keys(newGroups[group.group])[0];
  assert.throws(() => verify(group, file => file === sample ? Buffer.from('CHANGED') : fs.readFileSync(path.join(root, file))), /exact reviewed new source/);
}
console.log('ATANASYAN_HARMONIZATION_PRESERVATION_OK ' + JSON.stringify({geometryCards: 1425, stereoCards: currentStereo.lessons.length, preservedStereoCards: stereo.lessons.length, firstSteps: 255, literacy: 36, legacy: 70, protectedFiles: baseline.groups.reduce((n, group) => n + group.fileCount, 0), exactReviewedAmendments: Object.values(amendmentChains).reduce((n, chain) => n + chain.length, 0), amendedFiles: Object.keys(amendmentChains).length, negativeControls: 2 + Object.keys(amendmentChains).length + Object.keys(newGroups).length}));
