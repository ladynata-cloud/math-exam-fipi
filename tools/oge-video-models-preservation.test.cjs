'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {entries, snippet, restoreVideoModels, restoreGraphScale} = require('./oge-video-models-preservation.cjs');
const {graphScale} = require('./fixtures/oge-video-models-native-bytes.json');
const ROOT = path.resolve(__dirname, '..');
const updates = require('./fixtures/oge-worked-steps-native-bytes.json');
const BASE = '89ee66bfe5068f16364d61d091fcbf1a1cbd6287';
for (const [number, file] of Object.entries(entries)) {
  test(file + ': only the exact optional model includes change', () => {
    const current = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const source = execFileSync('git', ['show', (updates.pages[file]?.sourceCommit || BASE) + ':' + file], {cwd: ROOT, encoding: 'utf8'});
    const baseline = restoreVideoModels(file, source);
    if (updates.pages[file]) assert.equal(require('node:crypto').createHash('sha256').update(baseline).digest('hex'), updates.pages[file].sha256, 'exact committed teaching revision');
    assert.equal(current.split(snippet(number)).length, 2);
    assert.equal(restoreGraphScale(file, restoreVideoModels(file, current)), baseline);
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

test('task22 preserves the original engine around a single, equal-scale graph projection', () => {
  const file = graphScale.file, source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  assert.equal(source.split(graphScale.after).length, 2);
  const start = source.indexOf('class Grapher{'), end = source.indexOf('  clear(){', start);
  const Grapher = require('node:vm').runInNewContext('(' + source.slice(start, end) + '})');
  const graph = new Grapher({setAttribute() {}});
  for (const [xmin, xmax, ymin, ymax] of [[-3, 8, -10, 4], [-8, 6, 1, 5], [-2, 4, -9, 11]]) {
    graph.setRange(xmin, xmax, ymin, ymax);
    const unitX = graph.X(xmin + 1) - graph.X(xmin), unitY = graph.Y(ymin) - graph.Y(ymin + 1);
    assert(unitX > 0 && Math.abs(unitX - unitY) < 1e-8);
    assert(graph.X(xmin) >= 29.999 && graph.X(xmax) <= graph.W - 29.999);
    assert(graph.Y(ymax) >= 29.999 && graph.Y(ymin) <= graph.H - 29.999);
  }
  assert.equal(restoreGraphScale(file, source.replace(graphScale.after, graphScale.after.repeat(2))), source.replace(graphScale.after, graphScale.after.repeat(2)));
});
