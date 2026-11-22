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
  require('./preservation-supplement-693-board.json'),
  require('../geometry-textbook/answer-correction-amendment.json')
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
const amendmentChains = {};
for (const supplement of [...supplements, sphere]) {
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
// Exact digests of the independently verified lesson units and their loader.
const approvedAreaFiles = {
  "geometry-course/textbook/data/congruence-motion-review.json": "109b7704242a4f9bc6c8b00832511240764a75dba398505dd5aabb50db742ed5",
  "geometry-course/textbook/data/plane-map-review.json": "0fd93572ca5efd5aedaf882e44cbefd050945d84b3b8513eb8f7bda250f29b3a",
  "geometry-course/textbook/data/final-motion-constructions.json": "fda1ca84cc55d34db852a3d0144384fddbc253d3316b5dd95cc4df0678f7aa20",
  "geometry-course/textbook/data/medians-translated-altitudes.json": "19fa8661c65c6407986c5a27f101837e16a92df80efa60c46a3118004d99eaeb",
  "geometry-course/textbook/data/star-rays-perimeter.json": "96e3548345f6722807c56fe0d867f41411b7fe7807bd5f8e40591bf87753d033",
  "geometry-course/textbook/data/motion-applications.json": "9e0514ca53f89a003dc3b477ee21d2aeef0459076493685e5f766806dfefcb12",
  "geometry-course/textbook/data/tiling-symmetries.json": "23c355d28564c269abe6922221a6b97771dc7eeb93da176ea78c478d014e0f4b",
  "geometry-course/textbook/data/bounded-symmetries.json": "fefd44258c50ba2df40ad3008aff98f92fa93bd2bc04388ddf71b5d4e7659f1a",
  "geometry-course/textbook/data/regular-polygon-symmetries.json": "fa6c295ea99bd491ceb8a1b357779cbd561adeac2dfa2ed6af1a590490c8af66",
  "geometry-course/textbook/data/quadrilateral-symmetries.json": "679dde670227d32a3978571c0bb83289fbf923da1aa26cc223c0c678d022d9cd",
  "geometry-course/textbook/data/symmetry-applications.json": "59eae6a56f74469c315716df3e58c4457738a5fdf5b42793702bb09d61df69a4",
  "geometry-course/textbook/data/rotation-centers.json": "389bb8621f88f47483690437214e321fd13fff53042e2bb27813114115206870",
  "geometry-course/textbook/data/rotated-circles-lines.json": "698930acc921de1583364dd030ca8a0683258efbc9e3be0f1d0fbd4ee95655ca",
  "geometry-course/textbook/data/rotation-constructions.json": "419d2548b6e362e17f394534b1b3927e6d1df439838e88ffd8eead573ebb6fcf",
  "geometry-course/textbook/data/parallel-translation-constructions.json": "7f1051c6f4a2e3984f48a7447260bcc48c55de3a4d94bb720b01b819daad64fc",
  "geometry-course/textbook/data/translations-and-rotations.json": "8f47c491676549df994d6b3e6743d81b7cdfcc541870ea7a59bfee573b5bf97d",
  "geometry-course/textbook/data/motion-composition.json": "5abf322d24cc569d99630480005f10798df1ee9650137bc3b51b37f680298b52",
  "geometry-course/textbook/data/isometry-constructions.json": "79b41dbfe1d650abe58a5fd73a4648774f8ec5778d152471e93e79bf6bc8cee1",
  "geometry-course/textbook/data/circle-line-positions.json": "7d939bca6eb5642d3b76bf7bc24c932ac399ba6fd31dbf51636c6fe1212d009e",
  "geometry-course/textbook/data/triangle-sine-area.json": "329c77274a12acbab05da2084cfb72e09f7af67f4bb63773c241c7e8c6effcfa",
  "geometry-course/textbook/data/isometry-determination.json": "9f49f8b3673270005f566fbe14c89ab2641e35ca33a85dcce3c2eff1cfc8c17a",
  "geometry-course/textbook/data/isometric-quadrilaterals.json": "7a9bc29cd937e78519b37c277f07c9f5ea74bbc417e0ffe19c69f9ed15f2c351",
  "geometry-course/textbook/data/isometry-invariants.json": "8c0ca496eff98c128df14ec6fb7213b3f00ec939ca9c7f04d53acfb84b530cf7",
  "geometry-course/textbook/data/plane-isometries.json": "4f3338addd93ee1908c02c9bba74196d68c9c3391f1b0491c226950363a57514",
  "geometry-course/textbook/data/circle-measure-review.json": "27c325345f0697778d19b56d2784fa62520839d36fe24345b7dd61a934fb9eb1",
  "geometry-course/textbook/data/regular-polygon-review.json": "891a0a4621485a8230a4403cc3da809a62f448b8a6873e3bfd877b0d8075a501",
  "geometry-course/textbook/data/regular-compass-finale.json": "60723b135e6879dffeae0241cc1751bca923670cac1130c40e502fb627c6e550",
  "geometry-course/textbook/data/major-arcs-and-similar-circles.json": "a3ba46894835d2170413a49ac5fba492c352b1cd00717b006eb82f40c86de506",
  "geometry-course/textbook/data/arc-routes-and-incircles.json": "fc130ee10e628450c73ac7c1788a8c47638d9d0c88b6f6f9e45c8ad6cbbeb354",
  "geometry-course/textbook/data/regular-polygon-diagonals.json": "ac5e6f20c8578a53613c80ed901532c158e4f5a8e361ca1154e5614964dfe0cf",
  "geometry-course/textbook/data/additional-regular-perimeters.json": "e325535e36270f1b67ff009cefb4b72353f42e55f86e01b1d7d938efbfefc56a",
  "geometry-course/textbook/data/sector-areas.json": "d20b74f73c023d83c3a5b3dede12917abb5bb317eb173f4504dbcddd931956a8",
  "geometry-course/textbook/data/cut-disks-and-semicircles.json": "d3381d85810d24f48b4f5f68ccbbd9212e283fd6fd06d4c190a7fa790c6c6ee6",
  "geometry-course/textbook/data/disks-and-annuli.json": "3d19a60d3ca784466510ca0ce746af0edaa480a894079281f4f1b36631f30263",
  "geometry-course/textbook/data/areas-of-inscribed-disks.json": "84cb78f59290d47af5275ea48a96002746a758543f17b0249e079030c155463b",
  "geometry-course/textbook/data/disk-area-table.json": "ff200cd841da36ce563e4f5c0a84bab3ddaef25766e08e86fa74189fb455e121",
  "geometry-course/textbook/data/radian-constructions.json": "cb2c85ecd3a1662a30275ac85967e8ab524d88e160f7af2e7e35976c4f3b9de2",
  "geometry-course/textbook/data/radian-table.json": "b5d7464e67a2a2d57debd124e58ada9aaf7dd63a29d5ec3e58bb435c9a0de5d1",
  "geometry-course/textbook/data/measured-arc-devices.json": "c852a9f66acb61256654f362d796249fc43e56ac17607f3f34af107c95758875",
  "geometry-course/textbook/data/circle-length-applications.json": "68ead2ed05ac95d755243ccfeb7b46ba8a8049cd0a8ab22dae97242ce539d24a",
  "geometry-course/textbook/data/inscribed-circle-lengths.json": "4aea33ceda669f85d03113e5fd040867c6abae73faf436cbb82fd77b62cd3a9e",
  "geometry-course/textbook/data/circumference-lengths.json": "04e0c006733aa684bf1c50cf0d0537cffcc69e2abcf6f5bbc2dfc9318cd42016",
  "geometry-course/textbook/data/regular-polygon-constructions.json": "ab8d98f3e9a7c2c7843b7cd3df42b217886a8eefeb4c21be736788797e34cc5c",
  "geometry-course/textbook/data/regular-polygon-areas.json": "c125c9a924c849e12e69a8246a94b970fed42ca985293796bf767c98685c5c23",
  "geometry-course/textbook/data/polygon-circle-applications.json": "63c840924984e6b15ae0d95bad455fde986ff174b44fd0cd6ef0ec916e2c0877",
  "geometry-course/textbook/data/regular-polygon-tables.json": "d37771c6b0eefea41e67fc73f35ac403b4a6ece4e0bb3d592a62c00988a278ae",
  "geometry-course/textbook/data/regular-polygon-centers.json": "9c123147129a09042952095668d89b2b241e23763f3ebcb9bd08dc9ad3691292",
  "geometry-course/textbook/data/regular-polygon-angles.json": "a03682b0226304d9a116a4ebdf2c02cbdf317a9610f4906901dc52d81c5a0fc5",
  "geometry-course/textbook/data/regular-polygon-definition.json": "0835c8fab295b0b36d9b00f20676aa330eeae02559fc715b6660fad569fc1fd2",
  "geometry-course/textbook/data/chapter-twelve-finale.json": "33b94749ca144b8d90dc5ec1fd31c5f9349dec50095d2562eee16604901f03ce",
  "geometry-course/textbook/data/additional-scalar-vectors.json": "3dca70f9fb2eb91d752524d0d54d9252e6c952a72b9be3ef72eb695537b4ef85",
  "geometry-course/textbook/data/additional-solve-triangles.json": "b6c1e8337e4278a89a440518a2c60fea8e0b32725dee47b8ddb96e7522c38eb2",
  "geometry-course/textbook/data/additional-triangle-area.json": "c4c2ae9594c0641398bea1eb16df4826cf3e67753507a84ce149d571d0aafc1c",
  "geometry-course/textbook/data/vector-product-review.json": "12e51a35e2119c5f3dddf16a7b8a5dc7acaaa48ab8315e86c5b4392e372ce782",
  "geometry-course/textbook/data/triangle-review.json": "663abf870a97c20888a1a8e5ce1f1087633a69f2a901638baece22c4844a0796",
  "geometry-course/textbook/data/trigonometry-review.json": "2c9e62594ab7c2cd1dbb50e7233fc94772655f47fdf79d99e2efb55f91cb40e7",
  "geometry-course/textbook/data/scalar-geometry.json": "5f685dada18f45c3a61571324904669b24e6e2ce7359978b7de956e1626be621",
  "geometry-course/textbook/data/scalar-coordinates.json": "72da8b006bb404b4b67b6acfbad20fa2e5f2179fd14af6c3c1e529e942b97390",
  "geometry-course/textbook/data/scalar-product.json": "183a1bab4b8115daf7cf3d323179751752b7e2af962436139e4689c7a7b66cb2",
  "geometry-course/textbook/data/field-trigonometry.json": "62b7344a8caee414869f36ea48a1053bbf724c69291d7f1c6bc6870dae9adfc6",
  "geometry-course/textbook/data/solve-triangle.json": "d51ca83c1711b26949d4eba0e89e0ea2f7358f18da474aba767bc3896d233b5c",
  "geometry-course/textbook/data/oblique-triangle-cases.json": "565304b423ae86a9faf10c0df28a4587460fa868cd476808a697b053ad61e828",
  "geometry-course/textbook/data/triangle-section-applications.json": "22c4ffd1079c8abc17c39ec93ce4468c850356882f2240997128b7bb4adc6d3d",
  "geometry-course/textbook/data/triangle-relations.json": "64b65b5c40cd4edd1217d70b1c2a65c379c8f5887b036b8efc5494de81a483cc",
  "geometry-course/textbook/data/trigonometric-signs.json": "22d83be75d0a93f61fa9d230be762e7de0b27412608af570f0383cec57a9d944",
  "geometry-course/textbook/data/trigonometric-rays.json": "4f4f6f668aec42eef93fabd8b0cd7d0967a09c7a0f15780f5e1a31e977010940",
  "geometry-course/textbook/data/slope-and-reflection.json": "745546f67b66680bf4575f64daad403e1a921aeb8e29468b262ba2d9287e6d34",
  "geometry-course/textbook/data/upper-semicircle.json": "1e11581e38e95bdcc1c6e8fea01042fba0be077290bc83bbeab240d084c4d10c",
  "geometry-course/textbook/data/coordinate-additional-curves.json": "fee66bf53ff6b7d72bf4ea1291b3c0d301e88367f00f364df226e0bb3534d0b7",
  "geometry-course/textbook/data/coordinate-additional-applications.json": "9605c0578794ed4ced607dcd172cfbc23c348764863ba3a94110eed9e4cb151c",
  "geometry-course/textbook/data/coordinate-additional-figures.json": "f56367e0be6b845b59f84fa65d7ab70dd4691d5ff5faebc656ddb845438afd91",
  "geometry-course/textbook/data/coordinate-additional-vectors.json": "d1497cb4b710ad23f8cddcbdf9cbcf4eabaeab04fe5459bed358a88f58c8b07b",
  "geometry-course/textbook/data/coordinate-chapter-review.json": "562215271ad7d51a10e4def267c4e10cad8f22c034a3dd050635d01bf8fde4a7",
  "geometry-course/textbook/data/coordinate-loci.json": "4807dcebe9906d0a69a694a9f5885d5c30214e33474b16b0f830947f86dda6e5",
  "geometry-course/textbook/data/coordinate-lines.json": "2c3a70fb08f4dbe8ae4fa84aabb6102d456686754224169ce80aeb574125a0d3",
  "geometry-course/textbook/data/circle-equations.json": "23c66b091a73a6ab27c60a3dd199f33a213ed6d1af1b7a3d672a472667f9e6e0",
  "geometry-course/textbook/data/circle-intersections.json": "ea4bf02eed64b3eaf1c16c325cb029bc405b7860a3538e408a32e2e5fc86f359",
  "geometry-course/textbook/data/coordinate-curves.json": "c6afceb8b62420414f4bd31e88a1aa9be4be0055e9b4314037fdc81dd2c2604d",
  "geometry-course/textbook/data/coordinate-proof-method.json": "cb033807782332a0fc1a34b741ad6eece5d91cddf9c905091202347f2a331176",
  "geometry-course/textbook/data/coordinate-couriers.json": "3c35d0c58d6209093288a7795daf40e538b1d68f00f9f0dc4fa21832a780d246",
  "geometry-course/textbook/data/coordinate-figures.json": "ceace97699b6519fb7b9e5559efb01853574d18fd5c2e437f7860b233eefa996",
  "geometry-course/textbook/data/coordinate-distances.json": "296037c9427de22790142b4b2a0a3e2e70c5d497e192a3e726f11c96bd09291e",
  "geometry-course/textbook/data/coordinate-tables.json": "522e432e4012aa6f86ad222b937ff2d384102a00da9372c9b2d60a99f0955355",
  "geometry-course/textbook/data/coordinate-positions.json": "ae2efb234da6b82a751bf54299112863d6fefdc31e51b4fbe5759bcf9371ad3f",
  "geometry-course/textbook/data/vector-length-problems.json": "42dd51007d5a151c356399a661b0bc6ad3d5b0d84fe7d2dba664563f21547316",
  "geometry-course/textbook/data/vector-extra-problems.json": "ad3db9e607fceb082635834128979a184590b15a191f75d5440aa1c314f08a27",
  "geometry-course/textbook/data/vector-chapter-review.json": "2f48803cc3c840225f1b9ce28deae063ad447acca7244b6de15e88310e3f25a0",
  "geometry-course/textbook/data/coordinate-coefficients.json": "d5faaa4ec6da050268895496c94f31053786567701de7b4c364b65aba16bf3a9",
  "geometry-course/textbook/data/coordinate-relations.json": "f4d52e1e905701c2ea90517ac69003dc0eaa4aae9e15e5b1596c4124311b274b",
  "geometry-course/textbook/data/coordinate-grid.json": "fb6c040e8619e360592ed00fe918c694945bfffedab935cff77a98c7e2a41c99",
  "geometry-course/textbook/data/coordinate-actions.json": "5e225d5b4f78991aa476bda1bf874ae70b856165d2df58802fadf990e532214b",
  "geometry-course/textbook/data/vector-applications.json": "1227351c9822dc500b156ab9ec8e0fa0108fb80d9daf60e3315f0798037fce5d",
  "geometry-course/textbook/data/vector-midpoint-proofs.json": "61a8005acb5f11baac33ae01b98ff4c7f2473d071c28afd285c66365e872fa7b",
  "geometry-course/textbook/data/scalar-problems.json": "5c031761c712f9ae51e4bdeb7f1e13d7fa7e5be6fb507d8b98dc83c3d7875686",
  "geometry-course/textbook/data/vector-scaling.json": "0d409c98b6f1c53fbeea30103df9fce7d826cf04d19de26c205f958eba51cdba",
  "geometry-course/textbook/data/vector-identities.json": "6c73d491b2378ffb5a2cb4808c286e54ac078cf0c5b55a575778924d91bbb7b8",
  "geometry-course/textbook/data/vector-sum-problems.json": "10d24ab8f0cae8bf9c86a34219adebd1bb8c9aa69b2ea5482602a8d8bae7ce95",
  "geometry-course/textbook/data/vector-sums.json": "519ad0491eae1214d3ae3384cd00a656e5bb238a314c6168b7df5dda71c67317",
  "geometry-course/textbook/data/vector-conclusions.json": "f14e54f5228e0d8ea4a5cc1ab30dfcab3bd1bda98bb5a89c2afdba1acdbe47fc",
  "geometry-course/textbook/assets/additional-lessons.js": "0dad23dd7f604ab83690ed0014f786f11522330b5bdb3605b4eb5f4f35b91261",
  "geometry-course/textbook/data/grade9-vectors.json": "3ad74b998edfe9959260e66aabbd0d739f2f117334b4939955f74a8b521a813c",
  "geometry-course/textbook/data/circle-lessons.json": "1f219393e7e647d888dbdd419943618c2349168a91a44c3c4e300c6103a008fb",
  "geometry-course/textbook/data/area-lessons.json": "fa3a34d97b7bb419085b4c3cebdf0a43d6b85f2084dc6775fe745eafedb059b4",
  "geometry-course/textbook/data/area-similarity-lessons.json": "a03d352a79dda749b3ed61d60c1ac40460a4a4e5f5eabdccaadd4bbe9401aa43",
  "geometry-course/textbook/data/midpoint-lessons.json": "e61b548a9e236e0d8dcabb90dc0ca2820b8dd344fb3b6c85a1e9faf9427dbe71"
};
function verify(group, read = file => fs.readFileSync(path.join(root, file)), extra = []) {
  const files = [...new Set(group.paths.flatMap(filesAt).concat(extra))].filter(file => !group.excluded.includes(file)).sort();
  const additions = {geometry_textbook: approvedAreaFiles, stereo_textbook: sphere.additions}[group.group] || {};
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
assert.equal(currentStereo.lessons.length, 688);
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
const newGroups = {geometry_textbook: approvedAreaFiles, stereo_textbook: sphere.additions};
for (const group of baseline.groups.filter(group => newGroups[group.group])) {
  const sample = Object.keys(newGroups[group.group])[0];
  assert.throws(() => verify(group, file => file === sample ? Buffer.from('CHANGED') : fs.readFileSync(path.join(root, file))), /exact reviewed new source/);
}
console.log('ATANASYAN_HARMONIZATION_PRESERVATION_OK ' + JSON.stringify({geometryCards: 1425, stereoCards: currentStereo.lessons.length, preservedStereoCards: stereo.lessons.length, firstSteps: 255, literacy: 36, legacy: 70, protectedFiles: baseline.groups.reduce((n, group) => n + group.fileCount, 0), exactReviewedAmendments: Object.values(amendmentChains).reduce((n, chain) => n + chain.length, 0), amendedFiles: Object.keys(amendmentChains).length, negativeControls: 2 + Object.keys(amendmentChains).length + Object.keys(newGroups).length}));
