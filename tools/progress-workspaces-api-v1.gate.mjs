import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'c1217cda05725b0ba8bfde327c76281d7917853f';
const allowedFiles = new Set([
  '.gitignore',
  'Dockerfile',
  'board-server/README.md',
  'board-server/index.js',
  'board-server/progress-store.js',
  'board-server/test/progress-store.test.js',
  'board-server/test/server-progress.integration.test.js',
  'board-server/test/server-registry.integration.test.js',
  'board-server/test/trainer-registry.test.js',
  'board-server/trainer-registry.js',
  'docs/PROJECT_STATUS.md',
  'docs/tasks/PROGRESS_WORKSPACES_API_V1.md',
  'tools/progress-workspaces-api-v1.gate.mjs'
]);

function fail(message) {
  throw new Error(message);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
    shell: false
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (options.capture) process.stderr.write(result.stderr || result.stdout || '');
    fail(`${command} ${args.join(' ')} failed with ${result.status}`);
  }
  return options.capture ? result.stdout : '';
}

for (const file of [
  'board-server/index.js',
  'board-server/progress-store.js',
  'board-server/trainer-registry.js'
]) {
  run(process.execPath, ['--check', file]);
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
run(npm, ['test'], { cwd: path.join(root, 'board-server') });

run('git', ['diff', '--check', `${base}...HEAD`]);
const status = run('git', ['status', '--porcelain'], { capture: true }).trim();
if (status) fail(`worktree is not clean:\n${status}`);

const changedFiles = run(
  'git',
  ['diff', '--name-only', `${base}...HEAD`],
  { capture: true }
).trim().split(/\r?\n/).filter(Boolean);
if (!changedFiles.length) fail('no committed task files found');
for (const file of changedFiles) {
  if (!allowedFiles.has(file)) fail(`out-of-scope file: ${file}`);
}

const forbiddenControls = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u;
for (const file of changedFiles) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute) || fs.statSync(absolute).isDirectory()) continue;
  const text = fs.readFileSync(absolute, 'utf8');
  if (forbiddenControls.test(text)) fail(`forbidden control or bidi character: ${file}`);
}

for (const file of [
  'board-server/index.js',
  'board-server/progress-store.js',
  'board-server/trainer-registry.js'
]) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  if (/[?&](?:token|teacherCode|studentCode)=/i.test(text)) {
    fail(`URL secret parameter found in production source: ${file}`);
  }
  if (/req\.query/.test(text)) fail(`query-string authentication found: ${file}`);
}

const dockerfile = fs.readFileSync(path.join(root, 'Dockerfile'), 'utf8');
if (!dockerfile.includes('ENV PROGRESS_STORE_PATH=/data/progress.json')) {
  fail('Docker progress store path is missing');
}
if (!dockerfile.includes('VOLUME ["/data"]')) fail('Docker persistent volume is missing');
if (dockerfile.includes('PROGRESS_PERSISTENCE_CONFIRMED=1')) {
  fail('Dockerfile must not auto-confirm persistence');
}

process.stdout.write('PROGRESS_WORKSPACES_API_V1_GATE_OK\n');
