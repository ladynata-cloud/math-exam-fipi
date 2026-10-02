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
  ['0,75π',.75*Math.PI],['π^2',Math.PI**2],['-2^2',-4],['2^-3',.125]
];
for(const [text,value] of valid){
  assert(Math.abs(C.number(text)-value)<1e-10,text);
  assert(C.check(value,text),text);
  assert(M.check({kind:'number',expected:value},text),text);
}
for(const text of ['','2 3','1..2','pii','3π/','3/(4π','1/0','sqrt(-1)',
  '1e9','alert(1)','globalThis.x=1','π;2','()','2**3','2//3','9^99']){
  assert(Number.isNaN(C.number(text)),text);
}
assert(!C.check(3*Math.PI/4,'3/(4π)'));
assert(!M.check({kind:'number',expected:3*Math.PI/4},'π/4'));
console.log('PROFILE_NUMBER_INPUT_OK: 18 equivalent/precedence cases, 17 invalid cases, wrong values rejected');
