import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { git, sourceFiles, buildPackage, verifyPackage } from '../scripts/release-package.mjs';
import { publish } from '../scripts/publish-package.mjs';
import { publicRelease, readRelease } from '../src/release.js';

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-test-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const repo = path.join(dir, 'source'); fs.mkdirSync(repo); git(repo, 'init', '--quiet', '-b', 'main');
  git(repo, 'config', 'user.name', 'Synthetic test'); git(repo, 'config', 'user.email', 'test@example.test');
  const write = (name, data) => { const p = path.join(repo, name); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, data); };
  for (const name of ['src/server.js', 'public/index.html', 'package.json', 'Dockerfile']) write(`assistant-service/${name}`, `first ${name}\n`);
  write('assistant-service/.env', 'synthetic excluded'); write('assistant-service/assistant.sqlite', 'synthetic excluded'); write('assistant-service/test/fake.js', 'synthetic excluded');
  const commit = () => { git(repo, 'add', '.'); git(repo, 'commit', '--quiet', '-m', 'Synthetic release'); return git(repo, 'rev-parse', 'HEAD').toString().trim(); };
  const base = commit();
  return { dir, repo, write, commit, base };
}
test('release packages use immutable source, reject tampering and omit private/unsupported files', t => {
  const f = fixture(t); f.write('assistant-service/src/server.js', 'uncommitted');
  const output = path.join(f.dir, 'package'); const manifest = buildPackage(f.repo, f.base, output);
  assert.equal(Object.keys(manifest.files).length, 5);
  assert.equal(fs.readFileSync(path.join(output, 'assistant-service/src/server.js'), 'utf8'), 'first src/server.js\n');
  assert.deepEqual(verifyPackage(output), manifest);
  fs.writeFileSync(path.join(output, 'extra.txt'), 'unlisted'); assert.throws(() => verifyPackage(output), /Unexpected/); fs.unlinkSync(path.join(output, 'extra.txt'));
  fs.writeFileSync(path.join(output, 'assistant-service/src/server.js'), 'tampered'); assert.throws(() => verifyPackage(output), /digest/);
  assert.throws(() => sourceFiles(f.repo, 'main'), /exact/);
});
test('source symlinks are rejected', t => {
  const f = fixture(t); fs.symlinkSync('../package.json', path.join(f.repo, 'assistant-service/src/link.js'));
  assert.throws(() => sourceFiles(f.repo, f.commit()), /regular/);
});
test('normal deployment and code rollback retain unrelated configuration and database, refuse drift', t => {
  const f = fixture(t); const deployment = path.join(f.dir, 'deployment');
  fs.mkdirSync(deployment); git(deployment, 'init', '--quiet', '-b', 'master'); git(deployment, 'config', 'user.name', 'Synthetic'); git(deployment, 'config', 'user.email', 'test@example.test');
  for (const [name, file] of Object.entries(sourceFiles(f.repo, f.base))) { const p = path.join(deployment, name); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, file.data); }
  fs.writeFileSync(path.join(deployment, 'amvera.yml'), 'preserved config'); fs.writeFileSync(path.join(deployment, 'database-fixture.txt'), 'preserved synthetic database');
  git(deployment, 'add', '.'); git(deployment, 'commit', '--quiet', '-m', 'Baseline');
  const remote = path.join(f.dir, 'remote.git'); git(f.dir, 'clone', '--quiet', '--bare', deployment, remote);
  const expected = git(deployment, 'rev-parse', 'HEAD').toString().trim();
  f.write('assistant-service/src/server.js', 'version two'); f.write('assistant-service/src/new.js', 'new file'); const next = f.commit();
  const oldEnv = process.env.NODE_ENV; process.env.NODE_ENV = 'test'; t.after(() => { if (oldEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldEnv; });
  const result = publish({ repo: f.repo, source: next, baseline: f.base, remote, expected });
  assert.equal(result.healthVerified, false);
  assert.equal(git(remote, 'show', `${result.deploymentCommit}:amvera.yml`).toString(), 'preserved config');
  assert.equal(git(remote, 'show', `${result.deploymentCommit}:database-fixture.txt`).toString(), 'preserved synthetic database');
  assert.equal(git(remote, 'rev-parse', `${result.deploymentCommit}^`).toString().trim(), expected);
  assert.throws(() => publish({ repo: f.repo, source: f.base, baseline: next, remote, expected }), /base drift/);
  assert.throws(() => publish({ repo: f.repo, source: f.base, baseline: f.base, remote, expected: result.deploymentCommit }), /baseline mismatch/);
  const rollback = publish({ repo: f.repo, source: f.base, baseline: next, remote, expected: result.deploymentCommit });
  assert.equal(git(remote, 'rev-parse', `${rollback.deploymentCommit}^`).toString().trim(), result.deploymentCommit);
  assert.equal(git(remote, 'show', `${rollback.deploymentCommit}:assistant-service/src/server.js`).toString(), 'first src/server.js\n');
  assert.equal(git(remote, 'show', `${rollback.deploymentCommit}:database-fixture.txt`).toString(), 'preserved synthetic database');
  assert.throws(() => git(remote, 'show', `${rollback.deploymentCommit}:assistant-service/src/new.js`));
});
test('public version metadata is bounded and excludes arbitrary fields', () => {
  const sourceCommit = 'a'.repeat(40);
  assert.deepEqual(publicRelease({ sourceCommit, changes: ['A', 2, 'x'.repeat(201), 'bad\nline'], secret: 'never export' }), { sourceCommit, label: `Версия ${'a'.repeat(7)}`, changes: ['A'] });
  assert.equal(publicRelease({ sourceCommit: '../private' }).sourceCommit, null);
  assert.equal(readRelease().sourceCommit, null);
});
