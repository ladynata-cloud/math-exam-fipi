'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {JSDOM, VirtualConsole} = require('jsdom');
const base = path.resolve(__dirname, '../trainers/oge-basics');
const tick = () => new Promise(resolve => setImmediate(resolve));

async function mount(t) {
  const errors = [], virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error));
  const html = fs.readFileSync(path.join(base,'multiplication-division/decimal-divisor-shift.html'),'utf8');
  const dom = new JSDOM(html,{url:'https://mathexam.space/trainers/oge-basics/multiplication-division/decimal-divisor-shift.html',runScripts:'outside-only',virtualConsole});
  const {window:w} = dom, d = w.document;
  w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
  const random = [0,55.5/78,0.75,21.5/89];
  w.Math.random = () => random.length ? random.shift() : 0.5;
  await new Promise(resolve => w.addEventListener('load',resolve,{once:true}));
  for (const script of d.scripts) if (!script.src && script.textContent.trim()) w.eval(script.textContent);
  for (const file of ['basics-help.js','basics-standalone.js']) w.eval(fs.readFileSync(path.join(base,file),'utf8'));
  await tick();
  t.after(() => { assert.deepEqual(errors,[]); w.close(); });
  const $ = selector => d.querySelector(selector), state = () => w.__trainerDebug.state();
  const answer = async value => { $('#answerArea input').value=value; $('#answerArea button').click(); await tick(); };
  const hint = async () => { $('.bh-toggle').click(); await tick(); const text=$('#hintStack').textContent; $('.bh-close').click(); return text; };
  return {w,d,$,state,answer,hint};
}

test('both original numbers are preserved and conversion results appear only after the corresponding checks',async t => {
  const {$,state,answer,hint} = await mount(t);
  assert.equal($('#taskTitle').textContent,'21,44 : 6,7');
  assert.equal($('#normalizeDividend').textContent,'21,44 × ? = ?');
  assert.equal($('#normalizeDivisor').textContent,'6,7 × ? = ?');
  assert($('#divisionBoard').hidden && $('#partialPanel').hidden && $('#normalizeEquation').hidden);
  assert.match(await hint(),/делителе 6,7/);
  await answer('2'); assert.equal(state().phase,'shiftCount');
  await answer('1'); assert.equal(state().phase,'shiftDividend');
  assert.equal($('#normalizeDividend').textContent,'21,44 × 10 = ?');
  assert.equal($('#normalizeDivisor').textContent,'6,7 × 10 = ?');
  assert.match(await hint(),/21,44.*на 10/);
  await answer('214.4'); assert.equal(state().phase,'shiftDivisor');
  assert.equal($('#normalizeDividend').textContent,'21,44 × 10 = 214,4');
  assert.equal($('#normalizeDivisor').textContent,'6,7 × 10 = ?');
  assert($('#divisionBoard').hidden && $('#partialPanel').hidden);
  assert.match(await hint(),/214,4.*6,7.*10/);
  await answer('6,7'); assert.equal(state().phase,'shiftDivisor'); assert($('#divisionBoard').hidden);
  await answer('67'); assert.equal(state().phase,'digit');
  assert.equal($('#taskTitle').textContent,'21,44 : 6,7');
  assert.equal($('#normalizeEquation').textContent,'21,44 : 6,7 = 214,4 : 67');
  assert.equal($('#dividendDisplay').textContent,'214,4'); assert.equal($('#divisorDisplay').textContent,'67');
  assert(!$('#divisionBoard').hidden && !$('#partialPanel').hidden && !$('#normalizeEquation').hidden);
  $('#multiples').children[3].click(); await tick();
  assert.match(await hint(),/цифру 3 на 67/);
  await answer('201'); assert.match(await hint(),/214.*201/);
  await answer('13'); assert.match(await hint(),/13.*цифру 4.*134/);
  $('#bringBtn').click(); await tick(); $('#commaBtn').click(); await tick();
  $('#multiples').children[2].click(); await tick();
  await answer('134'); await answer('0');
  assert.equal(state().phase,'done'); assert.equal(state().supported,1); assert.equal(state().independent,0);
  assert.match($('#feedback').textContent,/Ответ: 3,2/);
});

test('full review includes both transformations and keeps the original completion accounting',async t => {
  const {$,state} = await mount(t);
  $('.bh-toggle').click(); await tick(); $('#solution').click(); await tick();
  assert.match($('#hintStack').textContent,/21,44 × 10 = 214,4; 6,7 × 10 = 67/);
  assert.match($('#hintStack').textContent,/21,44 : 6,7 = 214,4 : 67/);
  assert.match($('#hintStack').textContent,/Ответ: 3,2/);
  assert.equal(state().phase,'done'); assert.equal(state().reviewed,1);
  assert.equal(state().independent,0); assert.equal(state().supported,0);
});
