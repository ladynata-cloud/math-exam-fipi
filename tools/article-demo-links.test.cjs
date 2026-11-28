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
    dom.window.Math.random = () => 0;
    doc.querySelector('#nextBtn').click();
    assert.equal(dom.window.__current.p, 1, 'the next exercise uses the normal generator');
    assert.equal(doc.querySelectorAll('#bar .g-cell.fill').length, 1);
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

test('the circle, sine graph and angle slider agree at four angles, the endpoint and reset', () => {
  const dom = openTrainer('ege-profil/trainers/trigonometry.html', '#sine-wave');
  try {
    const win = dom.window;
    const doc = win.document;
    const svg = doc.getElementById('wvSvg');
    const circle = svg.querySelector('circle');
    const point = svg.querySelector('circle[fill="var(--arc)"]');
    const graphPoint = svg.querySelector('circle[fill="var(--sin)"]');
    const slider = doc.getElementById('wvT');
    const graphOrigin = Number(graphPoint.getAttribute('cx'));
    const zero = Number(circle.getAttribute('cy'));
    const radius = Number(circle.getAttribute('r'));
    let previousX = graphOrigin;
    for (const t of [1.57, 3.14, 4.71, 5.24]) {
      slider.value = String(t);
      slider.dispatchEvent(new win.Event('input'));
      const y = Number(point.getAttribute('cy'));
      const x = Number(graphPoint.getAttribute('cx'));
      assert.ok(Math.abs((zero - y) / radius - Math.sin(t)) < 1e-9);
      assert.equal(Number(graphPoint.getAttribute('cy')), y);
      assert.ok(x > previousX);
      previousX = x;
    }
    doc.getElementById('wvPlay').click(); // reduced-motion preference: jump to the end
    assert.equal(slider.value, doc.getElementById('wvTval').textContent);
    assert.ok(Math.abs(Number(graphPoint.getAttribute('cy')) - zero) < 1e-9);
    doc.getElementById('wvReset').click();
    assert.equal(Number(slider.value), 0);
    assert.equal(Number(graphPoint.getAttribute('cx')), graphOrigin);
  } finally { dom.window.close(); }
});
