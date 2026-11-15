'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pages = require('../downloads/trainers-manifest.json').trainers.filter(entry => entry.adaptation);
const head = '<link rel="stylesheet" href="/assets/download-panel.css">\n'
  + '<link rel="stylesheet" href="/assets/download-adaptation.css">\n'
  + '<script defer src="/assets/download-adaptation.js"></script>\n';

// The live download controls are outside the reviewed exercise. Only invert an
// exact matching block on its own page. Anything else remains part of the pin.
function restoreTrainerDownload(file, source) {
  const html = String(source);
  const entry = pages.find(candidate => candidate.sourceHtml === '/' + file);
  if (!entry || !html.includes('data-trainer-download')) return html;
  const start = `<!-- download-panel:start:${entry.slug} -->`;
  const end = `<!-- download-panel:end:${entry.slug} -->\n`;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`, 'g');
  const committed = fs.readFileSync(path.join(root, file), 'utf8');
  const live = [...committed.matchAll(pattern)];
  const received = [...html.matchAll(pattern)];
  assert.equal(live.length, 1, file + ': one public download panel');
  assert.equal(received.length, 1, file + ': one matching download panel');
  assert.equal(received[0][0], live[0][0], file + ': exact download panel');
  assert.equal(html.split(head).length, 2, file + ': one exact download asset block');
  assert(html.includes(head + '</head>') && html.includes(live[0][0] + '</body>'), file + ': download boundaries');
  const restored = html.replace(head, '').replace(live[0][0], '');
  assert(!restored.includes('data-trainer-download') && !restored.includes('/assets/download-adaptation.'), file + ': extra download controls');
  return restored;
}

module.exports = { restoreTrainerDownload };
