import { execFile } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..');
const nodeExecutable = process.execPath;

async function run(label, command, args, cwd = repoRoot) {
  process.stdout.write(`\n[${label}]\n`);
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd,
      env: process.env,
      windowsHide: true,
      maxBuffer: 32 * 1024 * 1024
    });
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  } catch (error) {
    if (error.stdout) process.stdout.write(error.stdout);
    if (error.stderr) process.stderr.write(error.stderr);
    throw new Error(`${label} failed`, { cause: error });
  }
}

async function output(command, args, cwd = repoRoot) {
  const { stdout } = await execFileAsync(command, args, {
    cwd,
    env: process.env,
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024
  });
  return stdout.trim();
}

async function main() {
  const inventoryTests = (await readdir(path.join(scriptDir, 'test')))
    .filter(name => name.endsWith('.test.mjs'))
    .sort()
    .map(name => path.join('tools', 'trainer-inventory', 'test', name));
  await run('Phase 1 tests', nodeExecutable, ['--test', ...inventoryTests]);
  await run(
    'Scoped repository inventory check',
    nodeExecutable,
    [path.join('tools', 'trainer-inventory', 'cli.mjs'), '--check']
  );

  const serverRoot = path.join(repoRoot, 'board-server');
  const serverTests = (await readdir(path.join(serverRoot, 'test')))
    .filter(name => name.endsWith('.test.js'))
    .sort()
    .map(name => path.join('test', name));
  await run('Board-server regression', nodeExecutable, ['--test', ...serverTests], serverRoot);

  const base = await output('git', ['merge-base', 'HEAD', 'origin/main']);
  await run('Committed diff check', 'git', ['diff', '--check', `${base}..HEAD`]);
  const status = await output('git', ['status', '--porcelain=v1', '-uall']);
  if (status) throw new Error('Working tree is not clean');

  process.stdout.write('\nTRAINER_FACTORY_INVENTORY_V1_GATE_OK\n');
}

main().catch(error => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
