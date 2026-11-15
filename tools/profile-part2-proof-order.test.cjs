'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');

test('planimetry accepts independent deductions in both orders and keeps full review out of proof credit', () => {
  const html = fs.readFileSync(path.join(__dirname, '../ege-profil/trainers/planimetry-t17.html'), 'utf8');
  const dom = new JSDOM(html, {url: 'https://mathexam.space/ege-profil/trainers/planimetry-t17.html', runScripts: 'dangerously'});
  const {document: page, localStorage} = dom.window;
  const pick = i => page.querySelector(`#tPool [data-step="${i}"]`).click();
  const open = index => page.querySelectorAll('#taskList button')[index].click();
  const progress = () => JSON.parse(localStorage.getItem('mathExamCourseProgress.v1') || '{}')['planimetry-t17']?.tasks || {};

  try {
    page.querySelector('.tab[data-view="tasks"]').click();
    for (const ordered of [[0,1,2,3], [0,2,1,3]]) {
      open(0);
      ordered.forEach(pick);
      const lines = [...page.querySelectorAll('#tProof li')].map(node => node.textContent);
      assert.equal(lines.length, 4);
      assert.equal(lines.findIndex(line => line.includes('вертикальные')), ordered.indexOf(2));
      assert.equal(page.querySelector('#tErr').textContent, '0');
      assert(progress().p1.proof);
      page.querySelector('#backToList').click();
    }

    open(4);
    pick(1);
    pick(2);
    assert.equal(page.querySelector('#tProof').children.length, 1);
    assert.match(page.querySelector('#tProofFb').textContent, /оба угловых/);
    pick(0);
    pick(2);
    assert.equal(page.querySelector('#tProof').children.length, 3);
    assert(progress().p5.proof);
    page.querySelector('#backToList').click();

    open(1);
    pick(1);
    page.querySelector('#tShowAll').click();
    assert.equal(page.querySelector('#tProof').children.length, 4);
    assert.equal(page.querySelector('#tPool').children.length, 0);
    assert(!progress().p2?.proof);
  } finally {
    dom.window.close();
  }
});
