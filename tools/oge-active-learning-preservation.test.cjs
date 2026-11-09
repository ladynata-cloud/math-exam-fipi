'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {routes, assets, includeBlock, restoreActiveLearningIncludes} = require('./oge-active-learning-preservation.cjs');
const {restoreVideoModels}=require('./oge-video-models-preservation.cjs');
const {restoreFractionExplanation} = require('./oge7-fraction-explanation-preservation.cjs');
const {restoreNumericSafety, restoreNumericLayout} = require('./oge8-numeric-safety-preservation.cjs');
const root = path.resolve(__dirname, '..');
// Entire published documents at 463d6bf56fc8f1f944da8d237102f77888711e79.
// New teaching is external. The separately reviewed №7 explanation and №8
// input-safety correction have exact inverses; historical hashes stay fixed.
const nativeHashes = Object.freeze({
  6: '4b959d2462005bd7ef796a29c1e75b42527bb58a4db80d7ee782e11db902b6e5',
  7: '327b041bf929619f3ced888e576ce12c560def6fd918aa637fc967ee355504ca',
  8: 'def5a8e5d2d979bef43bd54f09354c3cb6b372be7d98d64e37017378ceb486b1',
  9: 'a3d4de85e84b02a7cd74f11d6b2bb444257f205ef63ab63784d0b682c7366224',
  10: '6af36a504fd0d75c9166642876691709d932d51484d0d7a9e421b67204ef91a5',
  11: '1fc5b5736e68acfb289a97b2409a7f646ffad3ed11edc39a30b58a823e265b37',
  12: 'aa017e456d48c7bb11ee388a4fa5e0ce73fb7b80a06e86654c4dcd3134a08dc5'
});
const sha = source => createHash('sha256').update(source).digest('hex');
const nativeSource = (number, file, raw) => {
  const source = restoreActiveLearningIncludes(file, restoreVideoModels(file, raw));
  if (Number(number) === 8) return restoreNumericSafety(restoreNumericLayout(source));
  return Number(number) === 7 ? restoreFractionExplanation(source) : source;
};
for (const [number, file] of Object.entries(routes)) {
  const raw = fs.readFileSync(path.join(root, file), 'utf8');
  test(number + ': exact three includes preserve the entire published lesson', () => {
    assert.equal(sha(nativeSource(number, file, raw)), nativeHashes[number]);
    for (const asset of assets) assert(fs.statSync(path.join(root, asset)).isFile(), asset);
  });
  test(number + ': inverse rejects altered, partial, duplicate and executable includes', () => {
    const block = includeBlock(number);
    for (const invalid of [
      raw.replace(block, block + block),
      raw.replace('oge-active-learning.css?v=20261109', 'oge-active-learning.css?v=unreviewed'),
      raw.replace('data-oa-task="' + number + '"', 'data-oa-task="99"'),
      raw.replace('oge-active-learning-data.js?v=20261109"></script>', 'oge-active-learning-data.js?v=20261109">alert(1)</script>'),
      raw.replace(block, block.split('\n').slice(1).join('\n')),
      raw.replace(block, block + '<script src="oge-active-learning-extra.js"></script>\n')
    ]) assert.throws(() => restoreActiveLearningIncludes(file, restoreVideoModels(file, invalid)));
    const changedEngine = raw.replace('</script>', '\nvoid "unreviewed native change";\n</script>');
    assert.notEqual(sha(nativeSource(number, file, changedEngine)), nativeHashes[number], 'extra native bytes remain visible to the historical hash');
  });
}
test('the inverse cannot normalize another route', () => {
  const unknown = '<script src="oge-active-learning.js"></script>';
  assert.equal(restoreActiveLearningIncludes('trainers/oge-task14-progressions.html', unknown), unknown);
});
