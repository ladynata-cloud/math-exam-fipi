'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const files = ['index.html', 'laboratory/index.html', 'oge/index.html',
  'trainers/oge-course/index.html', 'trainers/oge-basics/index.html'];
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const doc = file => new JSDOM(read(file), { url: 'https://mathexam.space/' + file }).window.document;
const home = doc('index.html'), lab = doc('laboratory/index.html');
const division = '/trainers/oge-basics/multiplication-division/long-division-from-simple-to-decimals.html';
const cabinet = 'https://mathexam-board-ladynata.amvera.io/learning/#route';
const allowedNav = new Set(['/', '/trainers/oge-course/', '/trainers/oge-basics/', '/laboratory/', cabinet]);

assert.match(home.title, /ОГЭ/);
assert.equal(home.querySelectorAll('h1').length, 1);
assert.doesNotMatch(home.querySelector('main').textContent, /ЕГЭ|Атанасян|Макарычев|ДВИ|7 класс/);
for (const href of ['/trainers/oge-course/', '/trainers/oge-basics/']) {
  assert(home.querySelector('.hero a[href="' + href + '"]'), 'Primary route: ' + href);
}
assert(home.querySelector('main a[href="' + division + '"]'), 'Division is directly reachable from home');
assert.equal(home.querySelectorAll('a[href="/laboratory/"]').length, 1);
assert(home.querySelector('footer a[href="/laboratory/"]'), 'Lab remains a discreet footer entry');
assert(!home.querySelector('main a[href="/laboratory/"]'));
assert(home.querySelector('a[href="' + cabinet + '"]'), 'The existing cabinet URL remains available');

const retained = ['/grade7/', '/geometry-course/', '/ege-baza/', '/ege-profil/', '/courses/',
  '/video-lessons/cheatsheets.html', '/oge/', '/trainers/', '/pedagogam/',
  '/trainers/trenazher-mcko-linejka-progress.html', '/trainers/teatr-formul-daily.html',
  '/trainers/algebra-7/control-work.html', '/trainers/oge-1-5-trainers/',
  division, '/trainers/arifmetika.html', '/azbuka-postroeniy-reviewed/',
  '/trainers/ege-t1-planimetry-generator.html', '/trainers/ege-profile/yashchenko-lines-1-2.html',
  '/trainers/dvi/math-18-20.html', '/articles/stroynost-kursa-geometrii/',
  '/articles/moy-vzglyad-na-geometriyu-atanasyana/', '/articles/pedagogicheskiy-webcoding/',
  '/pedagogam/kak-skachat-i-adaptirovat-trenazher/'];
for (const href of retained) assert(lab.querySelector('a[href="' + href + '"]'), 'Retained lab destination: ' + href);
assert(!lab.querySelector('meta[name="robots"][content*="noindex"]'), 'The lab remains public');

for (const file of ['index.html', 'oge/index.html', 'trainers/oge-course/index.html']) {
  const page = doc(file);
  for (const anchor of page.querySelectorAll('.site-nav a, footer a')) {
    const href = anchor.getAttribute('href');
    if (!href.startsWith('/') && href !== cabinet) continue;
    assert(allowedNav.has(href), file + ' must not foreground another course: ' + href);
  }
}
assert.equal(doc('trainers/oge-course/index.html').querySelector('[aria-current="page"]').getAttribute('href'), '/trainers/oge-course/');
const foundations = doc('trainers/oge-basics/index.html');
assert.match(foundations.title, /ПредОГЭ/);
assert.equal(new URL(foundations.querySelector('.map-hero .btn.primary').href).pathname, division);
for (const id of ['arithmetic', 'fractions', 'negative', 'measurement', 'percentages']) {
  assert(foundations.getElementById(id), 'Foundation module remains: ' + id);
  assert(foundations.querySelector('a[href="#' + id + '"]'), 'Foundation navigation remains: ' + id);
}
assert.match(read('scripts/build-trainer-downloads.mjs'), /path\.join\(root, "laboratory", "index\.html"\)/);
assert.equal((read('laboratory/index.html').match(/<!-- home-download-article:start -->/g) || []).length, 1);
assert(!read('index.html').includes('home-download-article:start'));

// Complete Git tree supports sparse local checkouts; newly authored files are on disk.
const tracked = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim().split('\n'));
let links = 0;
for (const file of files) {
  const page = doc(file), ids = [...page.querySelectorAll('[id]')].map(e => e.id);
  assert.equal(new Set(ids).size, ids.length, file + ' has duplicate IDs');
  assert.equal(page.querySelectorAll('h1').length, 1, file + ' has one page heading');
  for (const anchor of page.querySelectorAll('[href], [src]')) {
    const raw = anchor.getAttribute('href') || anchor.getAttribute('src');
    if (!raw || /^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(raw)) continue;
    if (raw.startsWith('#')) { assert(page.getElementById(decodeURIComponent(raw.slice(1))), file + ' missing anchor ' + raw); continue; }
    const url = new URL(raw, 'https://mathexam.space/' + file);
    let target = decodeURIComponent(url.pathname).slice(1);
    if (!target || target.endsWith('/')) target += 'index.html';
    assert(tracked.has(target) || fs.existsSync(path.join(root, target)), file + ' broken target ' + raw);
    links++;
  }
}
console.log('OGE_FOCUS_NAVIGATION_OK: two public routes, discreet lab, retained destinations, complete foundations, exact shared navigation, ' + links + ' internal links.');
