'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { restoreOge18Clarity, receipt } = require('./oge18-clarity-preservation.cjs');
const root = path.resolve(__dirname, '..');
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const committed = (ref, file) => execFileSync('git', ['show', ref + ':' + file], {
  cwd: root, encoding: 'utf8', maxBuffer: 8e6
});

test('clarity receipt binds the exact public source revision and its complete base', () => {
  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.task, 'docs/tasks/OGE18_ANSWER_MODEL_CLARITY_20261116.md');
  assert.equal(receipt.sourceBase, '35e718ca74852857a86dfe9dcc68d091ce165308');
  assert.match(receipt.sourceCommit, /^[a-f0-9]{40}$/);
  assert.deepEqual(Object.keys(receipt.files).sort(), [
    'trainers/oge-course-geometry.js', 'trainers/oge-task18-grid.html'
  ]);
  for (const [file, row] of Object.entries(receipt.files)) {
    const current = fs.readFileSync(path.join(root, file), 'utf8');
    const before = committed(receipt.sourceBase, file);
    assert.equal(current, committed(receipt.sourceCommit, file), 'exact recorded source: ' + file);
    assert.equal(hash(current), row.afterSha256);
    assert.equal(hash(before), row.beforeSha256);
    assert.equal(restoreOge18Clarity(file, current), before, 'complete old source recovered: ' + file);
    assert.equal(restoreOge18Clarity(file, before), before, 'historical source unchanged');
    assert.equal(restoreOge18Clarity('unrelated.html', current), current, 'route cannot be generalized');
    assert.equal(restoreOge18Clarity('book/oge/2026-10-31/v1/' + file, current), current,
      'no inverse inside a fixed edition');
  }
});

test('partial, duplicate and unrelated edits cannot reuse the exact clarity receipt', () => {
  assert(Object.keys(receipt.files).length, 'source receipt must be populated');
  for (const [file, row] of Object.entries(receipt.files)) {
    const current = fs.readFileSync(path.join(root, file), 'utf8');
    const probes = [current + '\n/* unreviewed */\n'];
    for (const fragment of row.fragments) {
      probes.push(current.replace(fragment.after, () => fragment.before));
      probes.push(current.replace(fragment.after, () => fragment.after + fragment.after));
      probes.push(current.replace(fragment.after, () => fragment.after + ' '));
    }
    if (file.endsWith('.html')) {
      const changedMath = current.replace('calc:p=>p[0]*p[1],', 'calc:p=>p[0]*p[1]+1,');
      assert.notEqual(changedMath, current, 'mathematical mutation probe really changes source');
      probes.push(changedMath);
    }
    for (const probe of probes) {
      assert.notEqual(probe, current);
      assert.equal(restoreOge18Clarity(file, probe), probe, 'unrecorded bytes remain for the old pin to reject');
      assert.notEqual(hash(probe), row.beforeSha256);
    }
  }
});

test('incomplete or corrupted receipt fragments cannot recover the baseline', () => {
  for (const [file, row] of Object.entries(receipt.files)) {
    const current = fs.readFileSync(path.join(root, file), 'utf8');
    const corruptions = [
      { ...row, afterSha256: '0'.repeat(64) },
      { ...row, beforeSha256: '0'.repeat(64) },
      { ...row, fragments: [] },
      { ...row, fragments: row.fragments.map((fragment, index) => index ? fragment :
        { ...fragment, before: fragment.before + '\n/* altered old receipt */\n' }) },
      { ...row, fragments: row.fragments.map((fragment, index) => index ? fragment :
        { ...fragment, after: fragment.after + '\n/* missing receipt text */\n' }) }
    ];
    try {
      for (const corrupted of corruptions) {
        receipt.files[file] = corrupted;
        assert.equal(restoreOge18Clarity(file, current), current,
          'a malformed receipt cannot erase an unproved source delta');
      }
    } finally {
      receipt.files[file] = row;
    }
  }
});

test('Python and JavaScript inverses have the same full-match boundary', () => {
  const run = (file, value) => execFileSync('python3', ['-B', '-c',
    "import sys;sys.path.insert(0,'tools');from oge18_clarity_preservation import restore_oge18_clarity;sys.stdout.buffer.write(restore_oge18_clarity(sys.argv[1],sys.stdin.buffer.read()))", file],
    { cwd: root, input: value, encoding: 'utf8', maxBuffer: 8e6 });
  for (const [file, row] of Object.entries(receipt.files)) {
    const current = fs.readFileSync(path.join(root, file), 'utf8');
    const changed = current.replace(row.fragments[0].after, () => row.fragments[0].after + ' ');
    for (const value of [current, current + ' ', changed])
      assert.equal(run(file, value), restoreOge18Clarity(file, value));
    assert.equal(run('other/' + file, current), current);
  }
});
