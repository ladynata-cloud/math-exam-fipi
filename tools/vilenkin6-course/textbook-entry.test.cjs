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
const offline = fs.readFileSync('courses/vilenkin-6-part-1/offline.html', 'utf8');
assert(!offline.includes('textbook-entry.js'));
console.log('PASS: public textbook entry, managed/legacy/file preservation, safe hash mapping');
