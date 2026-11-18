'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const tyrePage = 'trainers/oge-1-5-trainers/practice-1-5-tires.html';
const frozenPage = path.join(__dirname, '../book/oge/2026-10-31/v2', tyrePage);
const renderers = [
  {
    start: 'function renderTask2(){', end: '/* ===== RENDER: TASK 3',
    before: '4e335393bb16cc0cc28b5f76a9b1774ccb33983d872af01cac1910db3fd089a3',
    after: '3b3370862bb0fd3e01ed0fb81623ae12691cb0ffcd57ecad10b954bf9f665487'
  },
  {
    start: 'function renderTask5(){', end: '/* ===== ANIMATION (task 5',
    before: '1cc552f3a33aef025745b0f9595f460164a93b3db54b3f356a3a2d43d72a6ef0',
    after: '5f85dc3cc36bf9b4f30b1d49773705ba043157e32ed37e3162565400fadf3475'
  }
];

function checkedRenderer(source, {start, end}, digest) {
  const first = source.indexOf(start);
  const last = source.indexOf(end);
  assert.ok(first >= 0 && first === source.lastIndexOf(start), 'unique tyre renderer start');
  assert.ok(last > first && last === source.lastIndexOf(end), 'unique tyre renderer end');
  const fragment = source.slice(first, last);
  assert.equal(crypto.createHash('sha256').update(fragment).digest('hex'), digest, 'reviewed tyre renderer');
  return fragment;
}

// Restore only the two known renderers before checking earlier whole-page and
// inline-engine identities. The released v2 edition contains their exact bytes.
function restoreTyreHints(file, html) {
  if (file !== tyrePage) return html;
  const published = fs.readFileSync(frozenPage, 'utf8');
  for (const renderer of renderers) {
    const current = checkedRenderer(html, renderer, renderer.after);
    const historical = checkedRenderer(published, renderer, renderer.before);
    html = html.replace(current, () => historical);
  }
  return html;
}

module.exports = {tyrePage, restoreTyreHints};
