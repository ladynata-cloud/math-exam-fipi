#!/usr/bin/env node
// npm install --prefix /tmp/seo-catalog-qa jsdom@26.1.0
// NODE_PATH=/tmp/seo-catalog-qa/node_modules node tools/seo-catalog.test.cjs [base]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const origin = 'https://mathexam.space';
const cases = [
  ['trainers/index.html', '#catalog [data-card]', 'h3', '.actions a'],
  ['ege-profil/trainers/parameters-18/index.html', '.grid .tcard', '.th', null],
  ['trainers/oge-basics/percentages/index.html', '#map .item', 'h3', null],
];

function cards(document, selector, heading, link) {
  return [...document.querySelectorAll(selector)].map(card => ({
    title: card.querySelector(heading).textContent.trim(),
    href: (link ? card.querySelector(link) : card).getAttribute('href'),
  }));
}

let links = 0;
for (const [file, selector, heading, link] of cases) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const options = { url: `${origin}/${file}` };
  const source = new JSDOM(html, options);
  const enabled = new JSDOM(html, { ...options, runScripts: 'dangerously' });
  const fallback = cards(source.window.document, selector, heading, link);
  assert(fallback.length > 0, `${file}: empty source catalog`);
  assert.deepEqual(cards(enabled.window.document, selector, heading, link), fallback,
    `${file}: JavaScript must replace, not duplicate or change, fallback cards`);
  assert(!enabled.window.document.body.innerHTML.includes('seo-catalog-fallback:'),
    `${file}: JavaScript did not replace every source fallback container`);
  for (const { href } of fallback) {
    if (!href) continue; // Existing unavailable chapters have no fake links.
    const url = new URL(href, options.url);
    assert.equal(url.origin, origin);
    const relative = decodeURIComponent(url.pathname).replace(/^\//, '');
    const target = path.join(root, relative.endsWith('/') ? relative + 'index.html' : relative);
    assert(fs.statSync(target).isFile(), `${file}: missing ${href}`);
    links++;
  }
  if (process.argv[2]) {
    const old = execFileSync('git', ['show', `${process.argv[2]}:${file}`], { cwd: root, encoding: 'utf8' });
    const baseline = new JSDOM(old, { ...options, runScripts: 'dangerously' });
    assert.deepEqual(cards(baseline.window.document, selector, heading, link), fallback,
      `${file}: catalog differs from the reviewed base`);
    baseline.window.close();
  }
  if (file === 'trainers/index.html') {
    assert.equal(Number(source.window.document.getElementById('countCards').textContent), fallback.length);
    assert.equal(Number(source.window.document.getElementById('countSections').textContent),
      source.window.document.querySelectorAll('#catalog [data-section]').length);
  }
  console.log(`${file}: ${fallback.length} source/rendered cards, identical titles and destinations`);
  source.window.close(); enabled.window.close();
}

const course = 'courses/vilenkin-6-part-1/';
const target = `${origin}/${course}textbook.html`;
for (const file of ['index.html', 'textbook.html']) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, course, file), 'utf8'));
  assert.deepEqual([...dom.window.document.querySelectorAll('link[rel="canonical"]')].map(a => a.href), [target]);
  if (file === 'textbook.html') assert.equal(dom.window.document.querySelectorAll('main h1').length, 1);
  dom.window.close();
}
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
assert(sitemap.includes(`<loc>${target}</loc>`));
assert(!sitemap.includes(`<loc>${origin}/${course}</loc>`));
console.log(`SEO_CATALOG_OK: ${links} existing destinations available without JavaScript; Vilenkin canonical/sitemap agree.`);
