'use strict';

// The final marker is emitted only after every actual process succeeds.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
function run(command, args) {
  console.log('\nRUN ' + command + ' ' + args.join(' '));
  const result = spawnSync(command, args, { cwd: root, env: process.env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error('Required check failed: ' + command + ' ' + args.join(' ') + ' (exit ' + result.status + ')');
}
for (const file of ['learning/app.js', 'learning/teaching.js', 'learning/lesson-workspace.js', 'learning/teacher-rehearsal.js',
  'tools/lesson-workspace-v1/fixture.cjs', 'tools/lesson-workspace-v1/browser.cjs', 'tools/lesson-workspace-v1/dom.cjs',
  'tools/lesson-workspace-v1/dom.test.cjs', 'tools/lesson-workspace-v1/rehearsal.dom.cjs',
  'tools/learning-cabinet.browser.cjs', 'tools/learning-course-navigation.browser.cjs']) {
  assert(fs.existsSync(path.join(root, file)), 'Required gate source is missing: ' + file);
  run(process.execPath, ['--check', file]);
}
assert(fs.existsSync(path.join(root, 'board-server/test/learning-workspace.test.js')), 'New ownership/queue contract tests are required');
run('npm', ['--prefix', 'board-server', 'test']);
run(process.execPath, ['--test', 'tools/lesson-workspace-v1/dom.test.cjs']);
run(process.execPath, ['tools/lesson-workspace-v1/dom.cjs']);
run(process.execPath, ['tools/lesson-workspace-v1/rehearsal.dom.cjs']);
run(process.execPath, ['tools/lesson-workspace-v1/browser.cjs']);
run(process.execPath, ['tools/learning-cabinet.browser.cjs']);
run(process.execPath, ['tools/learning-course-navigation.browser.cjs']);
run('git', ['diff', '--check']);
console.log('LESSON_WORKSPACE_V1_OK');
