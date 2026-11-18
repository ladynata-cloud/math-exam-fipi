'use strict';
const {readFileSync} = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');

function openTrainer(file, suffix) {
  const html = readFileSync(path.join(__dirname, '..', file), 'utf8');
  const dom = new JSDOM(html, {
    url: 'https://mathexam.space/' + file + suffix,
    runScripts: 'outside-only', pretendToBeVisual: true
  });
  const win = dom.window;
  win.matchMedia = () => ({matches:true, addEventListener(){}});
  win.HTMLElement.prototype.scrollIntoView = function(){win.lastScrollTarget = this;};
  for (const script of win.document.querySelectorAll('script:not([src])')) {
    if (!script.type || script.type === 'text/javascript') win.eval(script.textContent);
  }
  return dom;
}

test('the percent link opens 80 of 100 cells and accepts four fifths', () => {
  const dom = openTrainer('trainers/percent-part-whole-trainer.html', '?percent=80#exercise');
  try {
    const doc = dom.window.document;
    assert.equal(doc.querySelectorAll('#bar .g-cell').length, 100);
    assert.equal(doc.querySelectorAll('#bar .g-cell.fill').length, 80);
    doc.querySelector('#ansNumerator').value = '4';
    doc.querySelector('#ansDenominator').value = '5';
    doc.querySelector('#checkBtn').click();
    assert.match(doc.querySelector('#feedback').textContent, /Верно/);
    doc.querySelector('[data-mode="whole"]').click();
    assert.equal(dom.window.__current.type, 'whole');
  } finally { dom.window.close(); }
});

test('a direct sine-wave link selects the function panel and positions the model', () => {
  const dom = openTrainer('ege-profil/trainers/trigonometry.html', '#sine-wave');
  try {
    const doc = dom.window.document;
    assert.equal(doc.querySelector('[data-p="func"]').getAttribute('aria-selected'), 'true');
    assert.equal(dom.window.lastScrollTarget, doc.getElementById('sine-wave'));
    assert.ok(doc.getElementById('wvSvg').children.length);
    doc.querySelector('[data-p="intro"]').click();
    assert.equal(doc.querySelector('[data-p="intro"]').getAttribute('aria-selected'), 'true');
  } finally { dom.window.close(); }
});
