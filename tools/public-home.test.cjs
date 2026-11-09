'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const { checkCoverage, hasHomeBundle } = require('./public-home-coverage.cjs');
const code = fs.readFileSync('assets/assistant/home-link.js', 'utf8');
function page(url = '/lessons/', html = '<main><input id="answer" value="42"></main>') {
  return new JSDOM(html, { url: 'https://mathexam.space' + url, runScripts: 'outside-only' });
}
function mount(window) { window.eval(code); window.document.dispatchEvent(new window.Event('DOMContentLoaded')); }
test('all active courses and trainers, including redirect targets, provide home navigation', () => {
  const report = checkCoverage();
  assert(report.eligible.length > 650);
  assert.deepEqual(report.failures, []);
  for (const file of ['lessons/index.html', 'school/peterson6/index.html', 'courses/vilenkin-6-part-1/index.html', 'equations/linear-pilot/index.html', 'trainers/logic-trainer/404.html']) assert(report.covered.includes(file), file);
  assert(!hasHomeBundle('a.html', '<!-- <script src="/assets/assistant/home-link.js"></script> -->'));
  assert(!hasHomeBundle('a.html', '<script type="text/plain" src="/assets/assistant/home-link.js"></script>'));
});
test('legacy bundle uses exactly the same home code without an extra network dependency', () => {
  assert(fs.readFileSync('assets/assistant/navigator-widget.js', 'utf8').startsWith(code + '\n'));
});
test('every covered document path mounts a direct named home link, independent of private query/hash', () => {
  for (const file of checkCoverage().covered) {
    const dom = page('/' + file + '?return=https://example.org&room=private#exercise');
    dom.window.localStorage.setItem('saved-work', '{"answer":42}');
    mount(dom.window);
    const host = dom.window.document.getElementById('mathexam-home-navigation');
    assert(host, file);
    const link = host.shadowRoot.querySelector('a');
    assert.equal(link.href, 'https://mathexam.space/', file);
    assert.equal(link.target, '_self');
    assert.equal(link.textContent, '← На главную');
    assert.equal(dom.window.document.querySelector('#answer').value, '42');
    assert.equal(dom.window.localStorage.getItem('saved-work'), '{"answer":42}');
    mount(dom.window);
    assert.equal(dom.window.document.querySelectorAll('#mathexam-home-navigation').length, 1);
    dom.window.close();
  }
});
test('embedded trainers and frozen editions retain their existing navigation', () => {
  for (const url of ['/', '/index.html', '/trainers/x.html?embed=1', '/trainers/x.html?embedded=true', '/book/oge/v1/index.html', '/learning/']) {
    const dom = page(url); mount(dom.window);
    assert.equal(dom.window.document.getElementById('mathexam-home-navigation'), null, url);
    dom.window.close();
  }
  const dom = page('/lessons/', '<iframe></iframe>');
  mount(dom.window.document.querySelector('iframe').contentWindow);
  assert.equal(dom.window.document.querySelector('iframe').contentDocument.querySelector('#mathexam-home-navigation'), null);
  dom.window.close();
});
test('centered flex-row trainer retains one body layout column without shifting its first task', () => {
  const dom = page('/trainers/example.html', '<body style="display:flex;flex-direction:row"><main><input id="answer" value="42"></main></body>');
  mount(dom.window);
  assert.equal(dom.window.document.body.children.length, 1);
  assert.equal(dom.window.document.querySelector('main').firstElementChild.id, 'answer');
  assert.equal(dom.window.document.querySelector('main').lastElementChild.id, 'mathexam-home-navigation');
  dom.window.close();
});
test('ordinary course keeps its authored content before the added navigation', () => {
  const dom = page('/video-lessons/cheatsheets.html', '<header>MathExam</header><main><p id="condition">Условие</p><svg id="diagram"></svg><video id="video-player"></video></main>');
  const children = Array.from(dom.window.document.body.children);
  mount(dom.window);
  assert.deepEqual(Array.from(dom.window.document.body.children).slice(0, -1), children);
  assert.equal(dom.window.document.body.lastElementChild.id, 'mathexam-home-navigation');
  assert.deepEqual(Array.from(dom.window.document.querySelector('main').children).map(node => node.id), ['condition', 'diagram', 'video-player']);
  dom.window.close();
});
test('lessons logos and explicit menu return home even when its fragment is opened', () => {
  const dom = page('/lessons/#demo-oge', fs.readFileSync('lessons/index.html', 'utf8'));
  for (const logo of dom.window.document.querySelectorAll('a.brand')) assert.equal(logo.getAttribute('href'), '/');
  assert.equal(dom.window.document.querySelector('.showcase-nav a[href="/"]').textContent, 'На главную');
  dom.window.close();
});
