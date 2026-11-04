#!/usr/bin/env node
'use strict';

// Reproduce the numeric core embedded in standalone profile/base renderers.
// Run normally after editing the shared core, or use --check in CI.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const check = process.argv.includes('--check');
if (process.argv.slice(2).some(arg => arg !== '--check')) throw new Error('Usage: node tools/sync-profile-stereo-visibility.cjs [--check]');
const sourcePath = 'stereo-course/assets/task-scene-viewer.js';
const source = fs.readFileSync(path.join(root, sourcePath), 'utf8');
function bounds(text, begin, end, file) {
  const start = text.indexOf(begin), finish = text.indexOf(end);
  if (start < 0 || finish < start || text.indexOf(begin, start + begin.length) >= 0 || text.indexOf(end, finish + end.length) >= 0) {
    throw new Error(`${file}: exactly one ordered pair of generated markers is required`);
  }
  return [start + begin.length, finish];
}
const sourceBounds = bounds(source, '  // BEGIN SHARED VISIBILITY CORE\n', '  // END SHARED VISIBILITY CORE', sourcePath);
const core = source.slice(...sourceBounds);
const targets = [
  ['ege-profil/start/stereo-tasks.js', '  // BEGIN GENERATED PROFILE VISIBILITY FALLBACK\n', '  // END GENERATED PROFILE VISIBILITY FALLBACK'],
  ['ege-profil/trainers/stereo-t14.html', '  // BEGIN GENERATED PROFILE VISIBILITY FALLBACK\n', '  // END GENERATED PROFILE VISIBILITY FALLBACK'],
  ['ege-baza/path/models.js', '// BEGIN GENERATED VISIBILITY FALLBACK\n', '// END GENERATED VISIBILITY FALLBACK']
];
const mismatches = [];
for (const [file, begin, end] of targets) {
  const fullPath = path.join(root, file), current = fs.readFileSync(fullPath, 'utf8');
  const [start, finish] = bounds(current, begin, end, file);
  if (current.slice(start, finish) === core) continue;
  mismatches.push(file);
  if (!check) fs.writeFileSync(fullPath, current.slice(0, start) + core + current.slice(finish));
}
if (check && mismatches.length) {
  console.error(`Generated visibility cores differ: ${mismatches.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ status: 'PASS', mode: check ? 'check' : 'sync', targets: targets.map(([file]) => file), changed: check ? [] : mismatches, coreSha256: crypto.createHash('sha256').update(core).digest('hex') }));
}
