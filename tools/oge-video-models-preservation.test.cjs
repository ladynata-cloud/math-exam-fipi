'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {entries, activeEntries, snippet, restoreVideoModels, restoreGraphScale, restoreGraphIntersections} = require('./oge-video-models-preservation.cjs');
const {graphScale} = require('./fixtures/oge-video-models-native-bytes.json');
const graphIntersections = require('./fixtures/oge22-intersections-display.json');
const ROOT = path.resolve(__dirname, '..');
const updates = require('./fixtures/oge-worked-steps-native-bytes.json');
const BASE = '89ee66bfe5068f16364d61d091fcbf1a1cbd6287';
test('only task19 retires the optional addon; all nine historical routes remain protected', () => {
  assert.deepEqual(Object.keys(entries), ['11','15','16','17','19','22','23','24','25']);
  assert.deepEqual(Object.keys(activeEntries), ['11','15','16','17','22','23','24','25']);
});
for (const [number, file] of Object.entries(entries)) {
  test(file + ': only the exact optional model includes change', () => {
    const current = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const source = execFileSync('git', ['show', (updates.pages[file]?.sourceCommit || BASE) + ':' + file], {cwd: ROOT, encoding: 'utf8'});
    const baseline = restoreVideoModels(file, source);
    if (updates.pages[file]) assert.equal(require('node:crypto').createHash('sha256').update(baseline).digest('hex'), updates.pages[file].sha256, 'exact committed teaching revision');
    const active = Object.hasOwn(activeEntries, number);
    if (active) assert.equal(current.split(snippet(number)).length, 2);
    else {
      assert.equal(number, '19', 'only the explicitly retired route can omit the addon');
      assert.doesNotMatch(current, /OGE video-model investigations|oge-video-(?:models|graphs|geometry)/);
      assert.equal(current, baseline, 'task19 retains every byte of its approved native teaching page');
    }
    assert.equal(restoreGraphScale(file, restoreVideoModels(file, current)), baseline);
    assert.equal(restoreVideoModels(file, baseline), baseline);
    // The inverse still protects historical task19 receipts. Exercise every
    // malformed-include probe with that exact historical block reinstated.
    const included = active ? current : current.replace('</head>', snippet(number) + '</head>');
    assert.equal(included.split(snippet(number)).length, 2);
    assert.equal(restoreGraphScale(file, restoreVideoModels(file, included)), baseline);
    for (const changed of [snippet(number) + snippet(number), snippet(number).replace('defer', 'async'), snippet(number).replace('data-oge-video-task="' + number + '"', 'data-oge-video-task="0"')]) {
      assert.throws(() => restoreVideoModels(file, included.replace(snippet(number), changed)));
    }
    const outside = included.replace('</head>', '</head><script>void "unreviewed";</script>');
    assert.notEqual(restoreVideoModels(file, outside), baseline, 'extra engine bytes are never normalized');
    if (included.includes('data-trainer-download')) {
      const editedPanel = included.replace('Скачать и изменить', 'Изменённая панель');
      assert.throws(() => restoreVideoModels(file, editedPanel), /exact download panel/);
    }
    assert.equal(restoreVideoModels('unrelated.html', current), current, 'wrong route has no inverse');
    assert.throws(() => restoreVideoModels(file, included.replace(snippet(number), '').replace('<body', snippet(number) + '<body')), /head boundary/);
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

test('task22 intersection display inverse requires the complete exact renderer and two call sites', () => {
  const {file, fragments} = graphIntersections;
  assert.equal(file, 'trainers/oge-task22-functions-graphs.html');
  assert.equal(graphIntersections.task, 'docs/tasks/TRAINER_DOWNLOADS_STAGE4_20261114.md');
  assert.equal(graphIntersections.sourceBase, '1dea53a92200942bd40712cfed2ce06085d0c892');
  assert.equal(fragments.length, 3);
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const restored = restoreGraphIntersections(file, source);
  assert.notEqual(restored, source);
  for (const fragment of fragments) {
    assert.equal(source.split(fragment.after).length, 2);
    assert.equal(restored.split(fragment.before).length, 2);
    assert(!restored.includes(fragment.after));
  }
  assert.equal(restoreGraphIntersections(file, restored), restored, 'historical renderer is not altered');
  assert.equal(restoreGraphIntersections('unrelated.html', source), source, 'wrong route has no inverse');

  const historicalPin = require('./fixtures/oge-video-models-native-bytes.json').pages[file].sha256;
  const nativeHash = value => require('node:crypto').createHash('sha256')
    .update(restoreGraphScale(file, restoreVideoModels(file, value))).digest('hex');
  assert.equal(nativeHash(source), historicalPin, 'full original native engine remains sealed');
  for (const fragment of fragments) {
    for (const replacement of [fragment.before, fragment.after.repeat(2), fragment.after.replace('addMeasureH', 'unreviewedMeasureH')]) {
      const changed = source.replace(fragment.after, replacement);
      assert.notEqual(changed, source, 'negative probe actually changes the source');
      assert.equal(restoreGraphIntersections(file, changed), changed, 'partial or altered display delta is not normalized');
      assert.notEqual(nativeHash(changed), historicalPin, 'old full-engine pin rejects the change');
    }
  }
  const changedMath = source.replace('const x=1/(C-m);', 'const x=2/(C-m);');
  assert.notEqual(changedMath, source);
  assert(restoreGraphIntersections(file, changedMath).includes('const x=2/(C-m);'), 'inverse cannot erase an unrelated mathematical edit');
  assert.notEqual(nativeHash(changedMath), historicalPin);
});
