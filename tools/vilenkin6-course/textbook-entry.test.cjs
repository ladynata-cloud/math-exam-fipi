const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('courses/vilenkin-6-part-1/textbook-entry.js', 'utf8');
function route(search = '', hash = '', protocol = 'https:') {
  let redirected = null;
  const location = { search, hash, protocol, href: protocol + '//mathexam.space/courses/vilenkin-6-part-1/' + search + hash,
    replace: url => { redirected = url; } };
  vm.runInNewContext(code, { URL, URLSearchParams, location });
  return redirected;
}
assert.equal(route(), 'https://mathexam.space/courses/vilenkin-6-part-1/textbook.html');
assert.equal(route('', '#lesson/9/practice/4'), 'https://mathexam.space/courses/vilenkin-6-part-1/textbook.html#unit/9');
assert.equal(route('', '#lesson/26/check'), 'https://mathexam.space/courses/vilenkin-6-part-1/textbook.html');
assert.equal(route('', '#book/2.134'), 'https://mathexam.space/courses/vilenkin-6-part-1/textbook.html#book');
assert.equal(route('', '#progress'), 'https://mathexam.space/courses/vilenkin-6-part-1/textbook.html#progress');
assert.equal(route('?learning=1&module=9', '#lesson/9/check'), null);
assert.equal(route('?legacy=1', '#lesson/24/check'), null);
assert.equal(route('', '', 'file:'), null);
assert(!route('?next=https://example.org/').includes('example.org'));
const index = fs.readFileSync('courses/vilenkin-6-part-1/index.html', 'utf8');
assert(index.indexOf('textbook-entry.js') < index.indexOf('src="app.js'));
// Catalogue and social previews describe the public destination, while the
// preserved thematic edition remains available only through explicit entry modes.
const catalogue = JSON.parse(fs.readFileSync('courses/catalog.json', 'utf8'));
const publicCourse = catalogue.find(item => item.title === 'Виленкин · 6 класс · часть 1 · 2024');
assert(publicCourse, 'the public course remains discoverable');
assert.equal(new URL(publicCourse.url, 'https://mathexam.space').href, route(), 'catalogue points directly to the current public course');
const descriptions = [publicCourse.description, ...[...index.matchAll(/<meta (?:name="description"|property="og:description") content="([^"]*)"/g)].map(match => match[1])];
assert.equal(descriptions.length, 3, 'catalogue, search and social descriptions present');
for (const description of descriptions) {
  assert.match(description, /23 тем/, 'current textbook topic scope');
  assert.match(description, /[Вв]ыбранные задания/, 'selected exercises are explicit');
  assert.match(description, /НОК трёх и более чисел/, 'author supplement remains distinct');
  assert(!/475|81 пошагов|27 модул/.test(description), 'legacy quantities must not advertise the redirected course');
}
const offline = fs.readFileSync('courses/vilenkin-6-part-1/offline.html', 'utf8');
assert(!offline.includes('textbook-entry.js'));
console.log('PASS: public textbook entry, managed/legacy/file preservation, safe hash mapping');
