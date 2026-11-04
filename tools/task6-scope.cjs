'use strict';

// A released task has a closed Git range. Its historical scope must not grow
// with main. Current work has a separate, explicit task inventory and real PR
// base/head; neither successful historical audit nor broad path prefixes can
// substitute for that current scope check.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const historicalTask6 = Object.freeze({
  baseSha: 'df63bacb2f82acf5f8543297c372b414925d6113',
  headSha: '813fdcc129b27e71cc83ebaa80bd590cf1d1f1f1',
  allowedPaths: Object.freeze([
    'trainers/oge-task6-fractions.html',
    'tools/oge-task6-fractions-focused.test.mjs',
    'tools/task6-minimal.test.cjs',
    'tools/task6-interactive.test.cjs',
    'tools/task6-minimal.browser.cjs',
    '.github/workflows/task6-minimal.yml',
    'docs/tasks/TASK6_MINIMAL_HINTS.md',
    'docs/tasks/TASK6_INTERACTIVE_HELP.md',
    'docs/PROJECT_STATUS.md',
  ]),
});

function git(root, ...args) {
  return execFileSync('git', ['-c', 'safe.directory=' + root, ...args], {
    cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  });
}

function sha(value, label) {
  assert.match(value, /^[0-9a-f]{40}$/, label + ' must be a full lowercase commit SHA');
  return value;
}

function paths(value, label) {
  assert.ok(Array.isArray(value) && value.length, label + ' must be a nonempty explicit path array');
  for (const item of value) {
    assert.equal(typeof item, 'string', label + ' contains a non-string');
    assert.ok(item && !/[\x00-\x1f\\*?\[\]]/.test(item), 'Invalid scope path: ' + item);
    assert.ok(!path.posix.isAbsolute(item) && item !== '.' && !item.startsWith('../') &&
      path.posix.normalize(item) === item && !item.endsWith('/'), 'Invalid scope path: ' + item);
  }
  assert.equal(new Set(value).size, value.length, label + ' must not contain duplicates');
  return value;
}

function nulPaths(output) {
  return output.split('\0').filter(Boolean);
}

function changedPaths(root, baseSha, headSha) {
  // Disable rename detection: both the deleted source and added destination
  // must belong to the approved scope, even for byte-identical moves.
  return nulPaths(git(root, 'diff', '--name-only', '--no-renames', '-z', baseSha, headSha, '--'));
}

function assertAllowedPaths(changed, allowed, label) {
  const allowlist = new Set(allowed);
  for (const file of changed) assert.ok(allowlist.has(file), label + ': out-of-scope change: ' + file);
}

function auditHistoricalTask6(root) {
  const { baseSha, headSha, allowedPaths } = historicalTask6;
  const ancestry = git(root, 'rev-list', '--parents', '-n', '1', headSha).trim().split(' ');
  assert.deepEqual(ancestry, [headSha, baseSha], 'Published Task6 release must retain its exact sole parent');
  const changed = changedPaths(root, baseSha, headSha);
  assert.ok(changed.length, 'Published Task6 release must have a nonempty delta');
  assertAllowedPaths(changed, allowedPaths, 'Historical Task6 scope');
  return { baseSha, headSha, changedPaths: changed, status: 'PASS' };
}

function validateManifest(manifest) {
  assert.equal(manifest.schemaVersion, 1, 'Unsupported scope manifest version');
  assert.equal(typeof manifest.task, 'string', 'A named task is required');
  assert.ok(manifest.task.trim(), 'A named task is required');
  assert.ok(Number.isSafeInteger(manifest.pullRequest) && manifest.pullRequest > 0, 'A positive PR number is required');
  sha(manifest.baseSha, 'Manifest base');
  sha(manifest.initialHeadSha, 'Manifest initial head');
  const initial = paths(manifest.initialPaths, 'Initial task paths');
  const continuation = paths(manifest.continuationPaths, 'Continuation task paths');
  assert.equal(new Set([...initial, ...continuation]).size, initial.length + continuation.length,
    'Continuation paths must not repeat initial paths');
}

function auditCurrentScope(root, manifest, { baseSha, headSha, pullRequest, includeWorktree = true }) {
  validateManifest(manifest);
  sha(baseSha, 'Actual base');
  sha(headSha, 'Actual head');
  assert.equal(pullRequest, manifest.pullRequest, 'Scope manifest belongs to a different PR');
  assert.equal(baseSha, manifest.baseSha, 'Actual PR base differs from the owner-approved scope base');
  git(root, 'cat-file', '-e', baseSha + '^{commit}');
  git(root, 'cat-file', '-e', headSha + '^{commit}');
  git(root, 'merge-base', '--is-ancestor', baseSha, manifest.initialHeadSha);
  git(root, 'merge-base', '--is-ancestor', manifest.initialHeadSha, headSha);

  const initialPaths = changedPaths(root, baseSha, manifest.initialHeadSha).sort();
  assert.deepEqual([...manifest.initialPaths].sort(), initialPaths,
    'Initial inventory must exactly match the owner-presented base/head delta');
  const allowedPaths = [...manifest.initialPaths, ...manifest.continuationPaths];
  const committed = changedPaths(root, baseSha, headSha);
  assertAllowedPaths(committed, allowedPaths, 'Current committed task scope');
  const worktree = includeWorktree ? [
    // Include staged and unstaged changes independently. Otherwise an unstaged
    // reversal could conceal an out-of-scope staged modification.
    ...nulPaths(git(root, 'diff', '--cached', '--name-only', '--no-renames', '-z', headSha, '--')),
    ...nulPaths(git(root, 'diff', '--name-only', '--no-renames', '-z', '--')),
    ...nulPaths(git(root, 'ls-files', '--others', '--exclude-standard', '-z')),
  ] : [];
  assertAllowedPaths(worktree, allowedPaths, 'Current worktree task scope');
  return { task: manifest.task, pullRequest, baseSha, headSha,
    initialHeadSha: manifest.initialHeadSha, status: 'PASS',
    initialPathCount: initialPaths.length, allowedPathCount: allowedPaths.length,
    changedPaths: [...new Set([...committed, ...worktree])].sort(),
  };
}

module.exports = { historicalTask6, assertAllowedPaths, changedPaths, auditHistoricalTask6, auditCurrentScope };

if (require.main === module) {
  try {
    const options = {};
    const argv = process.argv.slice(2);
    assert.equal(argv.length % 2, 0, 'Arguments must be --name value pairs');
    for (let i = 0; i < argv.length; i += 2) {
      assert.ok(['--manifest', '--base', '--head', '--pr'].includes(argv[i]), 'Unknown argument: ' + argv[i]);
      assert.ok(!options[argv[i]], 'Duplicate argument: ' + argv[i]);
      options[argv[i]] = argv[i + 1];
    }
    for (const key of ['--manifest', '--base', '--head', '--pr']) assert.ok(options[key], 'Missing ' + key);
    const root = path.resolve(__dirname, '..');
    const manifest = JSON.parse(fs.readFileSync(path.resolve(root, options['--manifest']), 'utf8'));
    console.log(JSON.stringify(auditCurrentScope(root, manifest, {
      baseSha: options['--base'], headSha: options['--head'], pullRequest: Number(options['--pr']),
    }), null, 2));
  } catch (error) {
    console.error('TASK_SCOPE_FAIL: ' + error.message);
    process.exitCode = 1;
  }
}
