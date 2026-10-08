'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const A = require('../trainers/oge-basics/arithmetic-route.js');
class Storage {
  constructor() { this.map = new Map(); }
  get length() { return this.map.size; }
  key(i) { return [...this.map.keys()][i] ?? null; }
  getItem(k) { return this.map.get(k) ?? null; }
  setItem(k,v) { this.map.set(k,String(v)); }
}
const storage = new Storage(), a = A.createStore(storage), otherTab = A.createStore(storage);
const legacy = '{"topics":{"arithmeticCourse":{"total":125,"right":120}}}';
storage.setItem('mathExamCourseProgress.v1',legacy);
assert.equal(a.summaryForLevel('n3e').independent,0,'aggregate legacy score is not mastery');
const r = (fingerprint,extra={}) => ({level:'n3e',fingerprint,errors:0,hints:0,revealed:false,at:1000,...extra});
assert.equal(a.recordAttempt(r('48:2')),true);
assert.equal(otherTab.recordAttempt(r('69:3',{at:1001})),true);
assert.equal(a.summaryForLevel('n3e').independent,2,'tabs append without overwriting');
a.recordAttempt(r('48:2',{at:1002}));
assert.equal(a.summaryForLevel('n3e').solved,2,'repeat is not a different example');
assert.equal(a.summaryForLevel('n3e').independent,2);
a.recordAttempt(r('84:2',{hints:1,at:1003}));
a.recordAttempt(r('84:2',{at:1004}));
a.recordAttempt(r('96:3',{errors:1,at:1005}));
a.recordAttempt(r('96:3',{at:1006}));
a.recordAttempt(r('66:2',{revealed:true,at:1007}));
assert.equal(a.summaryForLevel('n3e').solved,4,'revealed is not solved');
a.recordAttempt(r('66:2',{at:1008}));
assert.deepEqual(a.summaryForLevel('n3e'),{solved:5,independent:2,viewed:1,guidedSolved:0,guidedIndependent:0});
assert.equal(storage.getItem('mathExamCourseProgress.v1'),legacy);
assert.equal(a.recordAttempt(r('x',{level:'__proto__'})),false);
assert.equal(a.recordAttempt(r('x',{errors:-1})),false);
assert.equal(a.recordAttempt(r('x',{hints:NaN})),false);
storage.setItem(A.prefix+'broken','{broken');
assert.equal(a.summaryForLevel('n3e').independent,2); assert.match(a.notice(),/не удалось/);
assert.equal(storage.getItem(A.prefix+'broken'),'{broken');
const guidedRecord = (id,dividend,extra={}) => ({id,at:1000+id,topic:'start',task:{topicId:'start',level:'oneDigit',dividend,divisor:'2'},errors:0,hints:0,reveals:0,repeated:false,...extra});
storage.setItem(A.guidedKey,JSON.stringify({version:1,records:[guidedRecord(1,'48',{reveals:1}),guidedRecord(2,'48',{repeated:true}),guidedRecord(3,'84'),guidedRecord(3,'96'),guidedRecord(4,'66',{hints:1}),guidedRecord(5,'66',{repeated:true})]}));
assert.equal(a.summaryForLevel('n3e').guidedSolved,3);
assert.equal(a.summaryForLevel('n3e').guidedIndependent,1);
assert.equal(a.summaryForLevel('n3e').independent,2,'guided results do not inflate legacy practice');
const damaged = JSON.stringify({version:1,records:[guidedRecord(1,'1',{task:{topicId:'start',level:'oneDigit',dividend:'1',divisor:'0'}})]});
storage.setItem(A.guidedKey,damaged);
assert.equal(a.summaryForLevel('n3e').guidedIndependent,0,'invalid mathematical task cannot count');
assert.equal(storage.getItem(A.guidedKey),damaged); assert.match(a.notice(),/повреждена/);
const blocked = A.createStore({get length(){throw Error('denied')},setItem(){throw Error('denied')}});
assert.equal(blocked.recordAttempt(r('48:2')),false);
assert.equal(blocked.summaryForLevel('n3e').solved,0); assert.ok(blocked.notice());
assert.equal(A.createStore(null).recordAttempt(r('48:2')),false);
const html = fs.readFileSync(path.join(__dirname,'../trainers/arifmetika.html'),'utf8');
const optionLevels = [...html.matchAll(/<option value="([a-z]\d[a-z])"/g)].map(m=>m[1]).sort();
assert.deepEqual(A.levels.map(l=>l.id).sort(),optionLevels,'all existing levels, exactly once');
for(const level of A.levels) {
  const practice = new URL(A.practiceURL(level.id),'http://local');
  assert.equal(practice.searchParams.get('level'),level.id);
  assert.equal(practice.searchParams.get('course'),'preoge');
  const route = new URL(A.routeURL(level.id),'http://local');
  assert.equal(route.searchParams.get('skill'),level.group);
  for(const link of [practice,route,A.guidedURL(level.id) && new URL(A.guidedURL(level.id),'http://local')].filter(Boolean)) assert.ok(fs.existsSync(path.join(__dirname,'..',link.pathname)),link.pathname);
}
for(const g of A.groups) {
  assert.ok(fs.existsSync(path.join(__dirname,'../trainers/oge-basics',g.checkpoint)));
  if(g.easier) assert.ok(A.groups.some(x=>x.id===g.easier));
}
assert.equal(A.guidedURL('__proto__'),null); assert.equal(A.levelForGuided('constructor'),null);
assert.equal(A.practiceURL('https://evil.test'),' /trainers/arifmetika.html?course=preoge&level=n3e'.trim());
console.log('PREOGE_ARITHMETIC_CORE_OK: 43 level links; legacy preservation; help, errors, repeats and reveals; guided separation; two-tab append; corruption and blocked storage.');
