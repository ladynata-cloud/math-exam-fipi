const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '..');
function boot() {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'courses/index.html'), 'utf8'), {url:'https://mathexam.space/courses/', runScripts:'outside-only'});
  dom.window.eval(fs.readFileSync(path.join(root, 'courses/catalog.js'), 'utf8'));
  return dom;
}
test('catalog preserves every course link and filters by real text', () => {
  const dom=boot(), w=dom.window, d=w.document;
  const cards=[...d.querySelectorAll('main > .grid > .card')];
  assert(cards.length>=25);
  const before=cards.map(c=>c.querySelector('h2 a').getAttribute('href'));
  const q=d.querySelector('#course-query');q.value='МАКАРЫЧЁВ';q.dispatchEvent(new w.Event('input'));
  const visible=cards.filter(c=>!c.hidden);assert(visible.length>=2);
  assert(visible.every(c=>/Макарычев/.test(c.textContent)));
  q.value='<script>';q.dispatchEvent(new w.Event('input'));assert(cards.every(c=>c.hidden));assert.equal(d.querySelector('#course-empty').hidden,false);
  d.querySelector('#course-clear').click();assert(cards.every(c=>!c.hidden));assert.equal(d.activeElement,q);
  assert.deepEqual(cards.map(c=>c.querySelector('h2 a').getAttribute('href')),before);
  assert.equal(w.localStorage.length,0);
  dom.window.close();
});
test('course directions keep meaningful results and combine with text', () => {
  const dom=boot(),w=dom.window,d=w.document, cards=[...d.querySelectorAll('main > .grid > .card')];
  for(const filter of ['basics','exam','geometry']){
    d.querySelector(`[data-course-filter="${filter}"]`).click();
    assert(cards.some(c=>!c.hidden),filter);
    if(filter==='exam')assert(cards.some(c=>!c.hidden&&c.querySelector('h2 a').getAttribute('href')==='/vpr/'));
    assert.equal(d.querySelectorAll('[data-course-filter][aria-pressed="true"]').length,1);
  }
  const q=d.querySelector('#course-query');q.value='Погорелов';q.dispatchEvent(new w.Event('input'));
  assert.equal(cards.filter(c=>!c.hidden).length,1);
  assert.match(d.querySelector('#course-count').textContent,/Найдено курсов: 1 из/);
  dom.window.close();
});
