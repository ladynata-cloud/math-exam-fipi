'use strict';
// Deterministic minimum teaching projection for the independent helper image.
// The public course keeps drawings; the helper only packages reviewed text.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { COURSE_SOURCES, ICHENSKAYA_MANIFEST_FILE, ICHENSKAYA_MANIFEST_SHA256, projectCourse } = require('../../board-server/assistant-course-context');
const check = process.argv.includes('--check');
function writeOrCheck(output, bytes) {
  if (check) {
    if (!fs.existsSync(output) || !fs.readFileSync(output).equals(Buffer.from(bytes))) throw Error('COURSE_ASSISTANT_PROJECTION_STALE');
  } else fs.writeFileSync(output, bytes);
}
// Validate every source before writing anything. These paths come only from
// the committed allowlist, never a CLI/request value.
const outputs = [];
for (const [id, source] of Object.entries(COURSE_SOURCES)) {
  const raw = fs.readFileSync(source.file);
  const data = projectCourse(JSON.parse(raw.toString('utf8')), crypto.createHash('sha256').update(raw).digest('hex'));
  outputs.push([path.join(__dirname, '../knowledge', id + '.json'), JSON.stringify(data, null, 2) + '\n']);
}
const manifest = fs.readFileSync(ICHENSKAYA_MANIFEST_FILE);
if (crypto.createHash('sha256').update(manifest).digest('hex') !== ICHENSKAYA_MANIFEST_SHA256) throw Error('COURSE_ASSISTANT_MANIFEST_STALE');
outputs.push([path.join(__dirname, '../knowledge/ichenskaya-grade7-works-manifest.json'), manifest]);
for (const [output, bytes] of outputs) writeOrCheck(output, bytes);
process.stdout.write('ATANASYAN_ASSISTANT_SOURCE_OK\nICHENSKAYA_ASSISTANT_SOURCE_OK\n');
