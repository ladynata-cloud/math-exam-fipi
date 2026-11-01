import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { git, sourceFiles, buildPackage, verifyPackage, sha256 } from './release-package.mjs';

// Normal commits only: reverting source never rewinds the deployment repository
// or touches /data. A changed remote or unexpected deployed source fails closed.
export function publish({ repo, source, baseline, remote, expected, branch = 'master' }) {
  if (![source, baseline, expected].every(s => /^[a-f0-9]{40}$/.test(s))) throw new Error('Exact source, baseline and deployment commits are required');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9/_-]*$/.test(branch)) throw new Error('Invalid deployment branch');
  if (!(remote === 'git@git.msk1.amvera.ru:ladynata/mathexam-assistant' || (process.env.NODE_ENV === 'test' && path.isAbsolute(remote)))) throw new Error('Unapproved deployment remote');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'assistant-release-'));
  try {
    const oldFiles = sourceFiles(repo, baseline);
    const packageDir = path.join(temp, 'package');
    buildPackage(repo, source, packageDir);
    const manifest = verifyPackage(packageDir);
    const remoteHead = () => git(repo, 'ls-remote', remote, `refs/heads/${branch}`).toString().trim().split(/\s/)[0];
    if (remoteHead() !== expected) throw new Error('Deployment base drift');
    const checkout = path.join(temp, 'deploy');
    git(temp, 'clone', '--quiet', '--no-checkout', '--single-branch', '--branch', branch, remote, checkout);
    git(checkout, 'checkout', '--quiet', '--detach', expected);
    for (const [name, file] of Object.entries(oldFiles)) {
      const target = path.join(checkout, name);
      for (let p = target; p !== checkout; p = path.dirname(p)) {
        if (fs.existsSync(p) && fs.lstatSync(p).isSymbolicLink()) throw new Error('Deployment symlink rejected');
      }
      if (!fs.existsSync(target) || !fs.lstatSync(target).isFile() || sha256(fs.readFileSync(target)) !== file.sha256) throw new Error(`Deployed baseline mismatch: ${name}`);
    }
    for (const name of Object.keys(oldFiles)) if (!(name in manifest.files)) fs.unlinkSync(path.join(checkout, name));
    for (const name of Object.keys(manifest.files)) {
      const target = path.join(checkout, name);
      // No file, directory or parent symlink may redirect a write outside this checkout.
      for (let p = target; p !== checkout; p = path.dirname(p)) {
        if (fs.existsSync(p) && fs.lstatSync(p).isSymbolicLink()) throw new Error('Deployment symlink rejected');
      }
      if (!(name in oldFiles) && name !== 'assistant-service/release.json' && fs.existsSync(target)) throw new Error(`Unmanaged file collision: ${name}`);
      fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(path.join(packageDir, name), target);
    }
    git(checkout, 'add', '--', ...new Set([...Object.keys(oldFiles), ...Object.keys(manifest.files)]));
    git(checkout, '-c', 'user.name=MathExam release', '-c', 'user.email=release@users.noreply.github.com', 'commit', '--quiet', '-m', `Assistant source ${source}`);
    const commit = git(checkout, 'rev-parse', 'HEAD').toString().trim();
    if (remoteHead() !== expected) throw new Error('Deployment base changed before push');
    git(checkout, 'push', '--quiet', 'origin', `HEAD:refs/heads/${branch}`);
    if (remoteHead() !== commit) throw new Error('Deployment head changed after push; inspect before retry');
    return { sourceCommit: source, previousDeployment: expected, deploymentCommit: commit, files: Object.keys(manifest.files).length, healthVerified: false };
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [source, baseline, expected] = process.argv.slice(2);
  try { console.log(JSON.stringify(publish({ repo: process.cwd(), source, baseline, expected, remote: 'git@git.msk1.amvera.ru:ladynata/mathexam-assistant' }))); }
  catch (error) { console.error(error.message.startsWith('Command failed') ? 'Git transport failed; inspect cloud credential/host configuration.' : error.message); process.exitCode = 1; }
}
