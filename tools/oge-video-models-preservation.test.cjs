'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {entries, activeEntries, assets, snippet, restoreVideoModels, restoreGraphScale, restoreGraphIntersections, restoreTask19CacheVersions} = require('./oge-video-models-preservation.cjs');
const {graphScale} = require('./fixtures/oge-video-models-native-bytes.json');
const graphIntersections = require('./fixtures/oge22-intersections-display.json');
const task19CacheVersions = require('./fixtures/task19-major-source-cache-versions.json');
const ROOT = path.resolve(__dirname, '..');
const updates = require('./fixtures/oge-worked-steps-native-bytes.json');
const alignment10To14 = require('./fixtures/oge-source-alignment-10-14.json');
const {createHash} = require('node:crypto');
const {sourcePin} = require('./oge-video-models-book-context.cjs');
const BASE = '89ee66bfe5068f16364d61d091fcbf1a1cbd6287';
test('only task19 retires the optional addon; all nine historical routes remain protected', () => {
  assert.deepEqual(Object.keys(entries), ['11','15','16','17','19','22','23','24','25']);
  assert.deepEqual(Object.keys(activeEntries), ['11','15','16','17','22','23','24','25']);
});
for (const [number, file] of Object.entries(entries)) {
  test(file + ': only the exact optional model includes change', () => {
    const current = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const source = execFileSync('git', ['show', (updates.pages[file]?.sourceCommit || BASE) + ':' + file], {cwd: ROOT, encoding: 'utf8'});
    const historical = restoreVideoModels(file, source);
    if (updates.pages[file]) assert.equal(createHash('sha256').update(historical).digest('hex'), updates.pages[file].sha256, 'exact historical teaching revision');
    const pin = sourcePin(file);
    const currentPin = file === entries[11] ? BASE : pin.sourceCommit;
    const baseline = currentPin === (updates.pages[file]?.sourceCommit || BASE)
      ? historical
      : restoreVideoModels(file, execFileSync('git', ['show', currentPin + ':' + file], {cwd: ROOT, encoding: 'utf8'}));
    if (file !== entries[11]) assert.equal(createHash('sha256').update(baseline).digest('hex'), pin.sha256, 'exact reviewed source-alignment revision');
    const active = Object.hasOwn(activeEntries, number);
    if (active) assert.equal(current.split(snippet(number)).length, 2);
    else {
      assert.equal(number, '19', 'only the explicitly retired route can omit the addon');
      assert.doesNotMatch(current, /OGE video-model investigations|oge-video-(?:models|graphs|geometry)/);
      assert.equal(restoreTask19CacheVersions(file, current), baseline, 'task19 retains its native page apart from the exact six reviewed cache tags');
    }
    const restored = active ? restoreGraphScale(file, restoreVideoModels(file, current)) : restoreTask19CacheVersions(file, current);
    if (file === entries[11]) {
      assert.equal(require('node:crypto').createHash('sha256').update(baseline).digest('hex'),
        require('./fixtures/oge-video-models-native-bytes.json').pages[file].sha256, 'original graph pin is intact');
      assert.equal(require('node:crypto').createHash('sha256').update(restored).digest('hex'),
        alignment10To14.task11NativeSha256, 'only the reviewed matching revision is accepted');
    } else assert.equal(restored, baseline);
    assert.equal(restoreVideoModels(file, baseline), baseline);
    // The inverse still protects historical task19 receipts. Exercise every
    // malformed-include probe with that exact historical block reinstated.
    const included = active ? current : current.replace('</head>', snippet(number) + '</head>');
    assert.equal(included.split(snippet(number)).length, 2);
    assert.equal(restoreGraphScale(file, restoreVideoModels(file, included)), restored);
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

test('task19 cache fixture binds exactly six script tags to the approved task and source commit', () => {
  assert.equal(task19CacheVersions.file, 'trainers/task19-trainer.html');
  assert.equal(task19CacheVersions.task, 'docs/tasks/OGE19_MAJOR_SOURCE_EXPANSION_20261116.md');
  assert.equal(task19CacheVersions.sourceCommit, 'd75801c4aa85b3960dcc4414f0ae57ae7e54b9f9');
  assert(fs.existsSync(path.join(ROOT, task19CacheVersions.task)));
  const scripts = ['task19-visual-data.js', 'task19-models-triangles.js', 'task19-models-circles.js',
    'task19-models-lines-polygons.js', 'task19-visual-models.js', 'task19-textbook-data.js'];
  assert.deepEqual(task19CacheVersions.fragments, scripts.map(script => ({
    script,
    before: '  <script defer src="' + script + '?v=sources-20261021"></script>\n',
    after: '  <script defer src="' + script + '?v=major-sources-20261116"></script>\n'
  })), 'the fixture cannot widen the approved files, attributes or versions');
});

test('task19 six-tag inverse preserves the entire historical native body and is idempotent', () => {
  const {file, fragments} = task19CacheVersions;
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const restored = restoreTask19CacheVersions(file, source);
  assert.notEqual(restored, source);
  for (const {before, after} of fragments) {
    assert.equal(source.split(after).length, 2);
    assert.equal(restored.split(before).length, 2);
    assert(!restored.includes(after));
  }
  assert.equal(restoreTask19CacheVersions(file, restored), restored);
  const historical = execFileSync('git', ['show', updates.pages[file].sourceCommit + ':' + file], {cwd: ROOT, encoding: 'utf8'});
  assert.equal(restoreTask19CacheVersions(file, historical), historical, 'old source is unchanged');
  const native = restoreTask19CacheVersions(file, source), baseline = restoreVideoModels(file, historical);
  assert.equal(native, baseline, 'every native HTML byte is still checked');
  assert.equal(require('node:crypto').createHash('sha256').update(native).digest('hex'), updates.pages[file].sha256);
  assert.equal(restoreVideoModels(file, native), native);
  for (const other of ['unrelated.html', 'trainers/geometry_statements_trainer_improved.html',
    '/trainers/task19-trainer.html', 'book/oge/2026-10-31/v1/trainers/task19-trainer.html']) {
    assert.equal(restoreTask19CacheVersions(other, source), source, 'no inverse on ' + other);
    assert.equal(restoreVideoModels(other, source), source, 'no addon or cache inverse on ' + other);
  }
});

test('task19 rejects partial, duplicate, altered and unrelated native changes even with a forged addon receipt', () => {
  const {file, fragments} = task19CacheVersions;
  const source = execFileSync('git', ['show', task19CacheVersions.sourceCommit + ':' + file], {cwd: ROOT, encoding: 'utf8'});
  const {receipt, label, summaryHtml, hash} = require('./oge-video-models-book-context.cjs');
  const input = {file, raw: source, id: '71', prefix: '', visible: 'Native condition. ' + label + ' Native footer.',
    dom: {count: 1, tag: 'DETAILS', id: 'oge-video-models', closed: true, summaryCount: 1, summaryHtml, visibleText: label},
    assetHashes: Object.fromEntries(assets.map(asset => ['/' + asset, hash(fs.readFileSync(path.join(ROOT, asset)))]))};
  assert.doesNotThrow(() => receipt(input));
  const rejects = (changed, message) => {
    assert.notEqual(changed, source, 'negative probe actually changes the source: ' + message);
    assert.notEqual(hash(restoreVideoModels(file, changed)), updates.pages[file].sha256, message);
    assert.throws(() => receipt({...input, raw: changed}), message);
  };
  for (const {script, before, after} of fragments) {
    for (const replacement of [before, '', after.repeat(2), after + before,
      after.replace('defer', 'async'), after.replace(script, 'unreviewed-' + script),
      after.replace('major-sources-20261116', 'unreviewed-version')]) {
      const changed = source.replace(after, replacement);
      assert.equal(restoreTask19CacheVersions(file, changed), changed, script + ': incomplete or ambiguous set has no inverse');
      rejects(changed, script + ': malformed tag set');
    }
  }
  for (const changed of [source + '\n', source.replace('<title>', '<title>Changed '),
    source.replace('</body>', '<p>Changed condition</p></body>'),
    source.replace(fragments[0].after, fragments[0].after + fragments[0].after.replace('defer', 'async')),
    source.replace('task19-reference.js?v=sources-20261021', 'task19-reference.js?v=major-sources-20261116')]) {
    rejects(changed, 'the inverse must retain unrelated native bytes');
  }
  const withoutAddon = source.replace(snippet(19), '');
  assert.equal(restoreVideoModels(file, withoutAddon), withoutAddon, 'cache changes alone do not attest the required addon');
  assert.throws(() => receipt({...input, raw: withoutAddon}), /optional include block/);
  assert.throws(() => receipt({...input, file: 'trainers/geometry_statements_trainer_improved.html'}), /book\/source route/);
});
