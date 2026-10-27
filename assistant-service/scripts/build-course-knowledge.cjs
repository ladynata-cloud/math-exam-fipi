'use strict';
// Deterministic minimum teaching projection for the independent helper image.
// The public course keeps drawings; the helper only packages reviewed text.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { COURSE_FILE, projectCourse } = require('../../board-server/assistant-course-context');
const output = path.join(__dirname, '../knowledge/atanasyan-first-steps.json');
const raw = fs.readFileSync(COURSE_FILE);
const data = projectCourse(JSON.parse(raw.toString('utf8')), crypto.createHash('sha256').update(raw).digest('hex'));
const bytes = JSON.stringify(data, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== bytes) throw Error('COURSE_ASSISTANT_PROJECTION_STALE');
} else fs.writeFileSync(output, bytes);
process.stdout.write('ATANASYAN_ASSISTANT_SOURCE_OK\n');
