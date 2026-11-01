'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { auditCurrentScope, changedPaths, assertAllowedPaths } = require('./task6-scope.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'task6-scope-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  const write = (file, value) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), value);
  };
  git('init', '--quiet', '--initial-branch=main');
  git('config', 'user.name', 'Scope Test');
  git('config', 'user.email', 'scope-test@example.invalid');
  write('trainer.html', 'original trainer\n');
  write('unrelated.txt', 'original unrelated\n');
  git('add', '.'); git('commit', '--quiet', '-m', 'base');
  const baseSha = git('rev-parse', 'HEAD');
  write('trainer.html', 'reviewed trainer\n');
  git('add', '.'); git('commit', '--quiet', '-m', 'initial reviewed task');
  const initialHeadSha = git('rev-parse', 'HEAD');
  const manifest = {
    schemaVersion: 1, task: 'Test task', pullRequest: 387, baseSha, initialHeadSha,
    initialPaths: ['trainer.html'], continuationPaths: ['tools/repair.cjs'],
  };
  const audit = overrides => auditCurrentScope(root, manifest, {
    baseSha, headSha: git('rev-parse', 'HEAD'), pullRequest: 387, ...overrides,
  });
  return { root, git, write, manifest, baseSha, initialHeadSha, audit };
}

test('the exact reviewed delta and explicit continuation paths pass', t => {
  const f = fixture(t);
  f.write('tools/repair.cjs', 'approved repair\n');
  assert.deepEqual(f.audit().changedPaths, ['tools/repair.cjs', 'trainer.html']);
  f.git('add', '.'); f.git('commit', '--quiet', '-m', 'approved continuation');
  const result = f.audit();
  assert.equal(result.status, 'PASS');
  assert.equal(result.initialPathCount, 1);
  assert.equal(result.allowedPathCount, 2);
});

test('committed unrelated changes are rejected', t => {
  const f = fixture(t);
  f.write('tools/unapproved.cjs', 'not part of task\n');
  f.git('add', '.'); f.git('commit', '--quiet', '-m', 'out of scope');
  assert.throws(() => f.audit(), /Current committed task scope: out-of-scope change: tools\/unapproved.cjs/);
});

test('untracked and unstaged unrelated paths are rejected', t => {
  const f = fixture(t);
  f.write('new-unapproved.txt', 'new file\n');
  assert.throws(() => f.audit(), /out-of-scope change: new-unapproved.txt/);
  fs.unlinkSync(path.join(f.root, 'new-unapproved.txt'));
  f.write('unrelated.txt', 'unstaged\n');
  assert.throws(() => f.audit(), /out-of-scope change: unrelated.txt/);
});

test('an unstaged reversal cannot hide an out-of-scope staged change', t => {
  const f = fixture(t);
  f.write('unrelated.txt', 'staged alteration\n');
  f.git('add', 'unrelated.txt');
  f.write('unrelated.txt', 'original unrelated\n');
  assert.equal(f.git('diff', 'HEAD', '--', 'unrelated.txt'), '', 'Net worktree diff alone would miss the staged change');
  assert.throws(() => f.audit(), /out-of-scope change: unrelated.txt/);
});

test('renames validate both source and destination rather than a collapsed rename path', t => {
  const f = fixture(t);
  f.git('mv', 'trainer.html', 'outside.html');
  f.git('commit', '--quiet', '-m', 'rename outside scope');
  const changed = changedPaths(f.root, f.initialHeadSha, f.git('rev-parse', 'HEAD'));
  assert.deepEqual(changed, ['outside.html', 'trainer.html']);
  assert.throws(() => f.audit(), /out-of-scope change: outside.html/);
  assert.throws(() => assertAllowedPaths(changed, ['outside.html'], 'rename control'), /out-of-scope change: trainer.html/);
});

test('actual base and PR identity must match the approved task manifest', t => {
  const f = fixture(t);
  assert.throws(() => f.audit({ baseSha: f.initialHeadSha }), /Actual PR base differs/);
  assert.throws(() => f.audit({ pullRequest: 388 }), /different PR/);
  assert.throws(() => f.audit({ headSha: 'HEAD' }), /full lowercase commit SHA/);
});

test('a head preceding the owner-presented initial task cannot pass', t => {
  const f = fixture(t);
  assert.throws(() => f.audit({ headSha: f.baseSha }), /merge-base/);
});

test('the initial path inventory cannot omit or invent a reviewed path', t => {
  const f = fixture(t);
  f.manifest.initialPaths = ['invented.html'];
  assert.throws(() => f.audit(), /Initial inventory must exactly match/);
  f.manifest.initialPaths = ['trainer.html', 'unrelated.txt'];
  assert.throws(() => f.audit(), /Initial inventory must exactly match/);
});

test('scope inventory rejects broad patterns, traversal, duplicate and directory exemptions', t => {
  const f = fixture(t);
  for (const entry of ['tools/*', '../outside', '/absolute', 'tools/', 'tools/../unrelated.txt', 'tools\\repair.cjs']) {
    f.manifest.continuationPaths = [entry];
    assert.throws(() => f.audit(), /Invalid scope path/);
  }
  f.manifest.continuationPaths = ['tools/repair.cjs', 'tools/repair.cjs'];
  assert.throws(() => f.audit(), /must not contain duplicates/);
  f.manifest.continuationPaths = ['trainer.html'];
  assert.throws(() => f.audit(), /must not repeat initial paths/);
});
