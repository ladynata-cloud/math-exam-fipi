'use strict';
const assert = require('node:assert/strict');
const C = require('../ege-profil/start/checks.js');
const M = require('../ege-profil/circle/checks.js');
const valid = [
  ['3/4π',3*Math.PI/4],['3/4pi',3*Math.PI/4],['3π/4',3*Math.PI/4],
  ['3*pi/4',3*Math.PI/4],['−3π/4',-3*Math.PI/4],['3 / 4 π',3*Math.PI/4],
  ['(3/4)π',3*Math.PI/4],['3/(4π)',3/(4*Math.PI)],['2π+π/2',2.5*Math.PI],
  ['2(3+4)',14],['(1+2)(3+4)',21],['2√3',2*Math.sqrt(3)],
  ['√3/2',Math.sqrt(3)/2],['2sqrt(3)/3',2*Math.sqrt(3)/3],
  ['0,75π',.75*Math.PI],['π^2',Math.PI**2],['-2^2',-4],['2^-3',.125],
  ['sqrt((-4)^2)',4],['sqrt(((-4)^2))',4],['sqrt(4)^2',4],
  ['(sqrt(4))^2',4],['sqrt(9)+1',4],['sqrt(sqrt(16))',2],
  ['sqrt(4^2)',4],['sqrt(4)2',4],['sqrt4^2',4],['sqrt4+2',4],
  ['2^3^2',512],['(-2)^2^3',256],['(-2)^3',-8],['(-2)^-3',-.125],
  ['0^1',0],['0^0.5',0],['(0^2)^3',0],['1^0',1],['(-2)^0',1],
  ['2^50',2**50]
];
for(const [text,value] of valid){
  assert(Math.abs(C.number(text)-value)<1e-10,text);
  assert(C.check(value,text),text);
  assert(M.check({kind:'number',expected:value},text),text);
}
const invalid = ['','2 3','1..2','pii','3π/','3/(4π','1/0','sqrt(-1)',
  '1e9','alert(1)','globalThis.x=1','π;2','()','2**3','2//3','9^99',
  // Invalid intermediate operations must not become an accepted finite answer.
  'sqrt(-4)^2','√(-4)^2','(sqrt(-4))^0','sqrt(sqrt(-4)^2)',
  '(1/0)^0','(0/0)^0','(0^-1)^0','((-1)^0.5)^0','((1/0)*0)^0',
  '((1/0)-(1/0))^0','((10^50)^50)^0','1/((10^50)^50)',
  // In this school-real-arithmetic input, zero to a nonpositive power is undefined.
  '0^0','0^-1','0^-0.5','0^(1-1)','(-0)^0','(0^0)^0'];
for(const text of invalid){
  assert(Number.isNaN(C.number(text)),text);
  for(const expected of [0,1,4]){
    assert(!C.check(expected,text),text+' must not be accepted as '+expected);
    assert(!C.check(expected,text,undefined,{strictNumeric:true}),text+' strict check');
    assert(!M.check({kind:'number',expected},text),text+' circle check');
  }
}
assert(!C.check(3*Math.PI/4,'3/(4π)'));
assert(!M.check({kind:'number',expected:3*Math.PI/4},'π/4'));
console.log(`PROFILE_NUMBER_INPUT_OK: ${valid.length} equivalent/precedence/domain cases, ${invalid.length} invalid cases; ordinary, strict and circle checks reject invalid domains`);
