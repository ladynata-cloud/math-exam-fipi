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

test('the board entry renders the selected cube before the catalogue and the rule', () => {
  const file = 'trainers/sections-from-zero.html';
  const root = path.join(__dirname, '..');
  const dom = new JSDOM(readFileSync(path.join(root, file), 'utf8'), {
    url: 'https://mathexam.space/' + file + '#starter-18',
    runScripts: 'outside-only', pretendToBeVisual: true
  });
  try {
    const win = dom.window;
    const doc = win.document;
    win.TextEncoder = TextEncoder;
    win.SVGElement.prototype.getBBox = function () { return {x:0, y:-12, width:15, height:16}; };
    for (const script of doc.querySelectorAll('script:not([defer])')) {
      const src = script.getAttribute('src');
      win.eval(src ? readFileSync(path.join(root, src), 'utf8') : script.textContent);
    }
    const main = doc.querySelector('.course-main');
    assert.match(main.querySelector('#lesson-title').textContent, /Наклонный срез/);
    assert.ok(main.querySelector('.model-svg [data-point="M"]'));
    assert.ok(main.querySelector('.model-svg [data-point="N"]'));
    assert.equal(main.nextElementSibling, doc.querySelector('details.catalog'));
    assert.equal(main.parentElement.nextElementSibling, doc.querySelector('details.principle'));
  } finally { dom.window.close(); }
});

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
