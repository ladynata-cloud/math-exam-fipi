'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {entries, snippet, restoreVideoModels} = require('./oge-video-models-preservation.cjs');
const {routes:activeRoutes,restoreActiveLearningIncludes}=require('./oge-active-learning-preservation.cjs');
const ROOT = path.resolve(__dirname, '..');
const BASE = '89ee66bfe5068f16364d61d091fcbf1a1cbd6287';
const nativeSource=(file,raw)=>{
  const native=restoreVideoModels(file,raw);
  return Object.values(activeRoutes).includes(file)?restoreActiveLearningIncludes(file,native):native;
};
for (const [number, file] of Object.entries(entries)) {
  test(file + ': only the exact optional model includes change', () => {
    const current = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const baseline = execFileSync('git', ['show', BASE + ':' + file], {cwd: ROOT, encoding: 'utf8'});
    assert.equal(current.split(snippet(number)).length, 2);
    assert.equal(nativeSource(file,current),baseline);
    assert.equal(restoreVideoModels(file, baseline), baseline);
    for (const changed of [snippet(number) + snippet(number), snippet(number).replace('defer', 'async'), snippet(number).replace('data-oge-video-task="' + number + '"', 'data-oge-video-task="0"')]) {
      assert.throws(() => restoreVideoModels(file, current.replace(snippet(number), changed)));
    }
    const outside = current.replace('</body>', '<script>void "unreviewed";</script></body>');
    assert.notEqual(nativeSource(file, outside), baseline, 'extra engine bytes are never normalized');
    assert.equal(restoreVideoModels('unrelated.html', current), current, 'wrong route has no inverse');
    assert.throws(() => restoreVideoModels(file, current.replace(snippet(number), '').replace('</body>', snippet(number) + '</body>')), /head boundary/);
  });
}
