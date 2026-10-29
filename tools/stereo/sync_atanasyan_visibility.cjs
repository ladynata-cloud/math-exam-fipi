'use strict';
// The older 12-lesson route retains its public API, layout and controls. Only
// preparation and hidden-line drawing are generated from the shared renderer.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const sourcePath = 'stereo-course/assets/task-scene-viewer.js';
const targetPath = 'ege-profil/atanasyan-10-11/model.js';
const sections = [
  ['VISIBILITY CORE', '  // BEGIN SHARED VISIBILITY CORE\n', '  // END SHARED VISIBILITY CORE'],
  ['SURFACE PREPARATION', '  function prepare(source) {', '  function mount(container, source, options = {}) {'],
  ['LINE DRAWING', "      const defs = element('defs'", '      const focused = new Set(']
];
function extract(text, start, end, includeStart = true) {
  assert.equal(text.split(start).length, 2, 'one source start: ' + start);
  assert.equal(text.split(end).length, 2, 'one source end: ' + end);
  const from = text.indexOf(start), to = text.indexOf(end, from + start.length);
  assert(to > from, 'ordered source section');
  return text.slice(from + (includeStart ? 0 : start.length), to);
}
function build(read = file => fs.readFileSync(path.join(root, file), 'utf8')) {
  const source = read(sourcePath);
  let output = read(targetPath);
  for (const [name, from, to] of sections) {
    const start = '  // BEGIN GENERATED ' + name + '\n';
    const end = '  // END GENERATED ' + name;
    const prior = extract(output, start, end, false);
    const generated = extract(source, from, to, name !== 'VISIBILITY CORE');
    output = output.replace(start + prior + end, start + generated + end);
  }
  return output;
}
function run(check = false) {
  const output = build(), target = path.join(root, targetPath);
  if (check) assert.equal(fs.readFileSync(target, 'utf8'), output, 'legacy Atanasyan uses exact shared visibility implementation');
  else fs.writeFileSync(target, output);
  console.log('ATANASYAN_VISIBILITY_SYNC_OK: exact shared preparation, visibility and line drawing; legacy API/layout retained');
}
if (require.main === module) run(process.argv.includes('--check'));
module.exports = { build, sections, sourcePath, targetPath };
