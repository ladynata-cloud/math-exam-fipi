import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const managed = name => /^assistant-service\/(?:src\/[\w/.-]+\.js|public\/[\w/.-]+\.(?:js|css|html)|knowledge\/[\w/.-]+\.json|package(?:-lock)?\.json|Dockerfile)$/.test(name) && !name.split('/').some(p => p === '..' || p.startsWith('.'));
export const sha256 = data => createHash('sha256').update(data).digest('hex');
export function git(repo, ...args) { return execFileSync('git', ['-C', repo, ...args], { maxBuffer: 24 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }); }
export function sourceFiles(repo, commit) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('An exact source commit is required');
  if (git(repo, 'rev-parse', `${commit}^{commit}`).toString().trim() !== commit) throw new Error('Source is not a commit');
  const files = {};
  for (const entry of git(repo, 'ls-tree', '-rz', commit, '--', 'assistant-service').toString().split('\0').filter(Boolean)) {
    const [meta, name] = entry.split('\t');
    if (!managed(name)) continue;
    if (!/^100644 blob [a-f0-9]{40}$/.test(meta)) throw new Error('Only regular source files are allowed');
    const data = git(repo, 'show', `${commit}:${name}`);
    files[name] = { data, sha256: sha256(data) };
  }
  for (const name of ['src/server.js', 'public/index.html', 'package.json', 'Dockerfile']) {
    if (!files[`assistant-service/${name}`]) throw new Error('Incomplete assistant source');
  }
  return files;
}
export function releaseMetadata(repo, commit) {
  const title = git(repo, 'show', '-s', '--format=%s', commit).toString().trim().slice(0, 200);
  return { sourceCommit: commit, publishedAt: null, changes: [title] };
}
export function buildPackage(repo, commit, output) {
  const files = sourceFiles(repo, commit);
  fs.mkdirSync(output, { recursive: false });
  for (const [name, file] of Object.entries(files)) {
    const target = path.join(output, name); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, file.data);
  }
  const release = JSON.stringify(releaseMetadata(repo, commit), null, 2) + '\n';
  fs.writeFileSync(path.join(output, 'assistant-service/release.json'), release);
  const manifest = { format: 1, sourceCommit: commit, files: Object.fromEntries(Object.entries(files).map(([name, file]) => [name, file.sha256])) };
  manifest.files['assistant-service/release.json'] = sha256(release);
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
export function verifyPackage(directory) {
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json')));
  if (manifest.format !== 1 || !/^[a-f0-9]{40}$/.test(manifest.sourceCommit)) throw new Error('Invalid manifest');
  const expected = new Set(['manifest.json', ...Object.keys(manifest.files)]);
  function visit(dir, prefix = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const name = prefix + entry.name;
      if (entry.isSymbolicLink()) throw new Error('Symlinks are forbidden');
      if (entry.isDirectory()) visit(path.join(dir, entry.name), `${name}/`);
      else if (!entry.isFile() || !expected.delete(name)) throw new Error('Unexpected package file');
    }
  }
  visit(directory);
  if (expected.size) throw new Error('Missing package file');
  for (const [name, digest] of Object.entries(manifest.files)) {
    if (!(managed(name) || name === 'assistant-service/release.json') || !/^[a-f0-9]{64}$/.test(digest)) throw new Error('Invalid package path or digest');
    if (sha256(fs.readFileSync(path.join(directory, name))) !== digest) throw new Error('Package digest mismatch');
  }
  const metadata = JSON.parse(fs.readFileSync(path.join(directory, 'assistant-service/release.json')));
  if (metadata.sourceCommit !== manifest.sourceCommit) throw new Error('Version mismatch');
  return manifest;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [commit, output] = process.argv.slice(2);
  if (!output) throw new Error('Usage: release-package.mjs EXACT_SOURCE_SHA NEW_OUTPUT_DIRECTORY');
  const result = buildPackage(process.cwd(), commit, path.resolve(output));
  console.log(JSON.stringify({ sourceCommit: result.sourceCommit, files: Object.keys(result.files).length }));
}
