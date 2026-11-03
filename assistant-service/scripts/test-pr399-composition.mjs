// Read-only compatibility with the unmerged, immutable adapter. No keys/API.
// The caller fetches both pinned commits; all changes live in a temporary tree.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '../..');
const base = '846040b338fd21a69f52132a75e29e4a9e2669b6';
const adapter = '7f4c054b9b8fb5b519dcab60e6fa4e461ed7c21f';
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' });
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'mathexam-pr399-'));
try {
  for (const entry of fs.readdirSync(root)) {
    if (entry === '.git') continue;
    if (entry === 'assistant-service') fs.cpSync(path.join(root, entry), path.join(temporary, entry), { recursive: true });
    else fs.symlinkSync(path.join(root, entry), path.join(temporary, entry));
  }
  for (const name of ['provider.js', 'config.js']) {
    const rel = `assistant-service/src/${name}`;
    const original = path.join(temporary, `original-${name}`), proposed = path.join(temporary, `proposed-${name}`);
    fs.writeFileSync(original, git('show', `${base}:${rel}`));
    fs.writeFileSync(proposed, git('show', `${adapter}:${rel}`));
    const target = path.join(temporary, rel);
    const merged = spawnSync('git', ['merge-file', '-p', target, original, proposed], { encoding: 'utf8' });
    assert.equal(merged.status, 0, `PR399 ${name} composition conflict; resolve before claiming compatibility`);
    fs.writeFileSync(target, merged.stdout);
  }
  const testPath = 'assistant-service/test/openai.test.js';
  fs.writeFileSync(path.join(temporary, testPath), git('show', `${adapter}:${testPath}`));
  const result = spawnSync('npm', ['--prefix', path.join(temporary, 'assistant-service'), 'test'], { stdio: 'inherit' });
  assert.equal(result.status, 0, 'PR399 composed service tests failed');
  console.log('PR399_MATH_VERIFICATION_COMPOSITION_OK (mock transport only; no adapter publication)');
} finally { fs.rmSync(temporary, { recursive: true, force: true }); }
