'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {entries, snippet, restoreVideoModels} = require('./oge-video-models-preservation.cjs');
const ROOT = path.resolve(__dirname, '..');
const {sourcePin} = require('./oge-video-models-book-context.cjs');
for (const [number, file] of Object.entries(entries)) {
  test(file + ': only the exact optional model includes change', () => {
    const current = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const pin = sourcePin(file);
    const source = execFileSync('git', ['show', pin.sourceCommit + ':' + file], {cwd: ROOT, encoding: 'utf8'});
    const baseline = restoreVideoModels(file, source);
    assert.equal(require('node:crypto').createHash('sha256').update(baseline).digest('hex'), pin.sha256, 'exact committed teaching revision');
    if (pin.currentSource) assert.equal(current, source, 'exact feedback source with reviewed includes');
    assert.equal(current.split(snippet(number)).length, 2);
    assert.equal(restoreVideoModels(file, current), baseline);
    assert.equal(restoreVideoModels(file, baseline), baseline);
    for (const changed of [snippet(number) + snippet(number), snippet(number).replace('defer', 'async'), snippet(number).replace('data-oge-video-task="' + number + '"', 'data-oge-video-task="0"')]) {
      assert.throws(() => restoreVideoModels(file, current.replace(snippet(number), changed)));
    }
    const outside = current.replace('</body>', '<script>void "unreviewed";</script></body>');
    assert.notEqual(restoreVideoModels(file, outside), baseline, 'extra engine bytes are never normalized');
    assert.equal(restoreVideoModels('unrelated.html', current), current, 'wrong route has no inverse');
    assert.throws(() => restoreVideoModels(file, current.replace(snippet(number), '').replace('</body>', snippet(number) + '</body>')), /head boundary/);
  });
}
