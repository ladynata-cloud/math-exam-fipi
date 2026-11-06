'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');

test('numeric input accepts school fractions and decimal commas without evaluating expressions', () => {
  for (const [text, expected] of [['1/2',.5],['−3/4',-.75],['0,125',.125],[' -2 ', -2],['.5',.5],['0',0],['2 / -3',-2/3]]) assert.equal(E.parseNumber(text), expected, text);
  for (const raw of ['', ' ', '1/0', 'NaN', 'Infinity', '0x10', '2+2', 'alert(1)', '3abc', '1/2/3', '1e3', '2;3', '<script>', '9'.repeat(161)]) assert.equal(E.parseNumber(raw), null, raw);
});
test('intervals preserve open domain boundaries, negative values and infinite rays', () => {
  assert.deepEqual(E.parseInterval('(1;3]'), {lo:1,hi:3,loClosed:false,hiClosed:true});
  assert.deepEqual(E.parseInterval('(-inf; −1/2)'), {lo:null,hi:-.5,loClosed:false,hiClosed:false});
  assert.deepEqual(E.parseInterval('[0,5;+∞)'), {lo:.5,hi:null,loClosed:true,hiClosed:false});
  for (const raw of ['[−∞;1]', '(1;+∞]', '[3;1]', '(2;2)', '(1,3)', 'R', '(-∞;-∞)', '(∞;5)', '(1;NaN)']) assert.equal(E.parseInterval(raw),null,raw);
});
test('answer checking rejects wrong endpoints and reversed inequalities', () => {
  const s={kind:'interval',answer:{lo:1,hi:3,loClosed:false,hiClosed:false}};
  assert.equal(E.checkStep(s,'(1;3)').correct,true);
  for(const value of ['[1;3)', '(1;3]', '(3;+∞)', '(-∞;1)']) assert.equal(E.checkStep(s,value).correct,false,value);
  assert.equal(E.checkStep({kind:'number',answer:0},'').correct,false);
  assert.equal(E.checkStep({kind:'number',answer:1/3},'1/3').correct,true);
});
test('point coordinates and graph transformations are exact semantic values', () => {
  assert.deepEqual(E.parsePoint('1/2;−1'),{x:.5,y:-1});
  assert.equal(E.parsePoint('1;'),null);
  const g={base:.5,h:2,k:-1,sign:-1};
  assert.deepEqual(E.parseTransform(E.graphDraft(g)),g);
  assert.equal(E.parseTransform('[1,0,0,1]'),null);
  assert.equal(E.checkStep({kind:'point',answer:{x:.5,y:-1}},'0,5;-1').correct,true);
  assert.equal(E.checkStep({kind:'transform',answer:g},'[0.5,-2,-1,-1]').correct,false);
});
