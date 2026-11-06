'use strict';

// No source-only substitutes or skipped browser checks can emit the final gate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const artifacts = path.resolve(process.env.SPACEMATH_ARTIFACTS || fs.mkdtempSync(path.join(os.tmpdir(), 'spacemath-gate-')));
const env = { ...process.env };
if (env.CHROMIUM_EXECUTABLE_PATH && !env.BROWSER_EXECUTABLE_PATH) env.BROWSER_EXECUTABLE_PATH = env.CHROMIUM_EXECUTABLE_PATH;
function run(command, args, overrides = {}) {
  console.log('\nRUN ' + command + ' ' + args.join(' '));
  const result = spawnSync(command, args, { cwd: root, env: { ...env, ...overrides }, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error('Required check failed: ' + command + ' ' + args.join(' ') + ' (exit ' + result.status + ')');
}
for (const file of ['trainers/spacemath/model.js', 'trainers/spacemath/app.js', 'trainers/spacemath/adapter.js',
  'learning/app.js', 'learning/catalog.js', 'learning/spacemath.js', 'learning/lesson-workspace.js', 'learning/teaching.js',
  'board-server/learning-spacemath.js', 'board-server/learning-contracts.js', 'board-server/learning-store.js',
  'board-server/learning-api.js', 'board-server/learning-teaching.js', 'board-server/learning-family.js',
  'trainers/board-picker.js', 'tools/spacemath/browser.cjs', 'tools/spacemath/editor.browser.cjs', 'tools/spacemath/public.browser.cjs']) {
  assert(fs.existsSync(path.join(root, file)), 'Required feature source is missing: ' + file);
  run(process.execPath, ['--check', file]);
}
run('npm', ['--prefix', 'board-server', 'test']);
run(process.execPath, ['--test', 'trainers/spacemath/model.test.cjs', 'tools/spacemath/assets.test.cjs',
  'tools/spacemath/cabinet.dom.test.cjs', 'tools/spacemath-public-registry.test.cjs', 'tools/spacemath-public-room.test.cjs',
  'tools/profile-log-trig-room-selection.test.cjs', 'tools/lesson-workspace-v1/dom.test.cjs',
  'tools/learning-ege-base-cards.test.cjs', 'tools/learning-number-theory-plan.dom.cjs',
  'tools/learning-number-theory-route.dom.cjs', 'tools/vilenkin6-course/lcm-multi.test.cjs']);
run(process.execPath, ['tools/grade7-geometry-rebuild.integration.cjs']);
run(process.execPath, ['tools/lesson-workspace-v1/dom.cjs']);
run(process.execPath, ['tools/lesson-workspace-v1/rehearsal.dom.cjs']);
for (const [file, folder] of [['editor.browser.cjs', 'editor'], ['public.browser.cjs', 'public'], ['browser.cjs', 'managed']]) {
  run(process.execPath, ['tools/spacemath/' + file], { SPACEMATH_ARTIFACTS: path.join(artifacts, folder) });
}
run(process.execPath, ['tools/lesson-workspace-v1/browser.cjs'], { LESSON_WORKSPACE_ARTIFACTS: path.join(artifacts, 'lesson-regression') });
run(process.execPath, ['tools/learning-cabinet.browser.cjs'], { LEARNING_BROWSER_ARTIFACTS: path.join(artifacts, 'cabinet-regression') });
run(process.execPath, ['tools/learning-course-navigation.browser.cjs'], { LEARNING_BROWSER_ARTIFACTS: path.join(artifacts, 'navigation-regression') });
run(process.execPath, ['tools/learning-number-theory-route.browser.cjs'], { NUMBER_THEORY_ROUTE_ARTIFACTS: path.join(artifacts, 'number-theory-regression') });
run(process.execPath, ['tools/board-picker-smoke.cjs']);
run('git', ['diff', '--check']);
console.log('SPACEMATH_2D_V1_READY');
