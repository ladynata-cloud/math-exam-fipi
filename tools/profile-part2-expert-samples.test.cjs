'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '../ege-profil/trainers/expert.html'), 'utf8');
const progressKey = 'mathExamCourseProgress.v1';

function openPage(priorProgress) {
  return new JSDOM(html, {
    url: 'https://mathexam.space/ege-profil/trainers/expert.html',
    runScripts: 'dangerously',
    beforeParse(window) {
      if (priorProgress) window.localStorage.setItem(progressKey, JSON.stringify(priorProgress));
    }
  });
}

test('real FIPI samples cover all second-part numbers, with a hidden review and an exact source page', () => {
  const { window } = openPage();
  try {
    const samples = [...window.document.querySelectorAll('#fipi-samples [data-expert-number]')];
    assert.deepEqual(samples.map(card => Number(card.dataset.expertNumber)), [13, 14, 15, 16, 17, 18, 19]);
    assert.deepEqual(samples.map(card => card.querySelector('strong').textContent),
      ['1 из 2.', '1 из 3.', '1 из 2.', '1 из 2.', '1 из 3.', '3 из 4.', '2 из 4.']);
    const pages = [15, 49, 92, 123, 157, 217, 237];
    samples.forEach((card, index) => {
      const link = new URL(card.querySelector('a[href]').href);
      assert.equal(link.hostname, 'doc.fipi.ru');
      assert.match(link.pathname, /\/2026\/matematika_mr_ege_2026\.pdf$/);
      assert.equal(link.hash, `#page=${pages[index]}`);
      assert.equal(card.querySelector('details').open, false);
    });
  } finally {
    window.close();
  }
});

test('the dependent geometry result receives one point and a saved choice remains intact', () => {
  const prior = { 'expert-t': { done: { w17b: { pick: 1, mark: 2, hit: true } } }, other: { value: 1 } };
  const { window } = openPage(prior);
  try {
    const { document } = window;
    const select = selector => document.querySelector(selector);
    assert.match(select('#totalLine').textContent, /1 из 12.*совпало с разбором: 0/);
    assert.deepEqual(JSON.parse(window.localStorage.getItem(progressKey)), prior);
    assert.match(select('[data-work-id="w17b"]').textContent, /балл в разборе: 1/);
    select('[data-work-id="w17b"]').click();
    assert.equal(document.activeElement, select('#wTitle'));
    assert.equal(select('#fipi-samples').hidden, true);
    assert.match(select('#wCond').textContent, /Из точки M вне окружности/);
    assert.equal(select('#wCheck').disabled, true);
    select('#cleanBtn').click();
    assert.equal(select('#cleanBtn').getAttribute('aria-pressed'), 'true');
    const step = select('#wSteps li:nth-child(2) button');
    step.click();
    assert.equal(step.getAttribute('aria-pressed'), 'true');
    assert.equal(select('#cleanBtn').getAttribute('aria-pressed'), 'false');
    select('#wChips button:nth-child(2)').click();
    assert.equal(select('#wCheck').disabled, false);
    select('#wCheck').click();
    assert.match(select('#wFb').textContent, /Вердикт совпал с разбором: 1 балл/);
    assert.match(select('#wCrit').textContent, /недоказанного утверждения пункта а\)/);
    const after = JSON.parse(window.localStorage.getItem(progressKey));
    assert.deepEqual(after.other, prior.other);
    assert.deepEqual(after['expert-t'].done.w17b, { pick: 1, mark: 1, hit: true });
    select('#backBtn').click();
    assert.equal(select('#fipi-samples').hidden, false);
    assert.equal(document.activeElement, select('[data-work-id="w17b"]'));
    assert.match(select('#totalLine').textContent, /1 из 12.*совпало с разбором: 1/);
  } finally {
    window.close();
  }
});
