'use strict';
const assert = require('node:assert/strict');
const C = require('./check.js');
const G = require('./task-graphs.js');
const P = require('./models.js');
const cards = require('./exercises-1126-1130.json');
const byMode = mode => cards.filter(card => card.graph.mode === mode);

assert.equal(cards.length, 12);
for (const card of cards) {
  assert.equal(card.source.page, card.graph.mode === 'figure' ? 253 : 254);
  assert(C.check(card.answer, card), card.title);
  for (const step of card.steps) assert(C.check(step.answer, step));
}
assert(C.check('3;2', byMode('figure')[0]));
assert(!C.check('1;2;3', byMode('figure')[0]));
for (const card of byMode('level')) {
  const level = card.graph.level.split('/').map(Number);
  const height = level[0] / (level[1] || 1);
  if (height < 0) assert(C.check('нет',card));
  else {
    assert(C.check(String(height ** 2).replace('.', ','), card));
    assert(!C.check(String(height), card));
  }
}
for (const mode of ['double','negative','reflect']) {
  const card = byMode(mode)[0];
  for (let n = 1; n <= 9; n++) {
    const x = card.graph.inside * n*n;
    const y = card.graph.scale * n;
    assert(C.check('(0;0), ('+x+'/4;'+y+'/2)',card));
    assert(!C.check('(0;0), ('+x+'/4;'+(-y)+'/2)',card));
  }
  assert(!C.check('(0;0), (0;0)', card));
}
assert(C.check('(1;1), (0;0)', byMode('cross')[0]));
assert(!C.check('(1;1), (2;2)', byMode('cross')[0]));
for (const [mode, good, bad] of [['above','(0;1)','[0;1)'],['below','(1;+∞)','[1;+∞)'],['band','9<x<25','(9;25]']]) {
  assert(C.check(good, byMode(mode)[0]));
  assert(!C.check(bad, byMode(mode)[0]));
}
const segment = {kind:'root-study-segment',lower:9,upper:25};
assert(Number.isNaN(G.curveValue(segment, 4)));
assert.equal(G.curveValue(segment, 16), 4);
assert(Number.isNaN(G.curveValue(segment, 36)));
for (const skill of P.rootStudySkills) {
  const prompts = new Set();
  for (let seed = 0; seed < 24; seed++) {
    const trial = P.practiceRootStudy(skill.id, seed, 1 + seed % 3);
    assert(C.check(trial.answer, trial), trial.prompt);
    prompts.add(trial.prompt);
  }
  assert(prompts.size >= 3);
}
console.log('PASS 12 source cards, exact fractional points and heights, open intervals, 72 new-data practices.');
