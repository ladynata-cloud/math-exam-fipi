'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {test} = require('node:test');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '../..');
const supportPath = path.join(root, 'courses/vilenkin-6-part-1/textbook-support.js');
const API = require(supportPath);
function open(options = {}) {
  const dom = new JSDOM('<main><div id="support"></div></main>', {url:'https://example.test/learning/',runScripts:'outside-only'});
  dom.window.eval(fs.readFileSync(supportPath, 'utf8'));
  const host = dom.window.document.getElementById('support');
  const reasons = [];
  const cleanup = dom.window.VilenkinStudySupport.mount(host, {unitId:7,onUse:reason=>reasons.push(reason),...options});
  return {dom,host,reasons,cleanup};
}
function toggle(ctx, reason, value = true) {
  const node = ctx.host.querySelector(`[data-v6-support="${reason}"]`);
  node.open = value;
  node.dispatchEvent(new ctx.dom.window.Event('toggle'));
}
test('exact prime table boundaries and complete list through 1000', () => {
  assert.deepEqual(API.primesUpTo(0), []);
  assert.deepEqual(API.primesUpTo(1), []);
  assert.deepEqual(API.primesUpTo(2), [2]);
  assert.deepEqual(API.primesUpTo(100), [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97]);
  const expected = [];
  for (let n=2;n<=1000;n++) {let divisors=0;for(let d=1;d<=n;d++)if(n%d===0)divisors++;if(divisors===2)expected.push(n);}
  assert.deepEqual(API.primesUpTo(1000), expected);
  assert.equal(expected.length,168);assert.equal(expected.at(-1),997);
  [0,1,-7,4,9,25,49,121,143,1000,1001,NaN,Infinity,2.5,'7'].forEach(n=>assert.equal(API.isPrime(n),false,String(n)));
  [2,3,7,11,97,997,1009].forEach(n=>assert.equal(API.isPrime(n),true,String(n)));
  [-1,1001,2.5,NaN,'100'].forEach(n=>assert.throws(()=>API.primesUpTo(n),RangeError));
});
test('mount stays collapsed and opens support only on actual use', () => {
  const ctx=open();
  assert.equal(ctx.host.querySelectorAll('details[open]').length,0);
  assert.deepEqual(ctx.reasons,[]);
  assert(ctx.host.textContent.includes('Число 1 не простое'));
  assert(ctx.host.querySelector('.v6-support-recommended'));
  assert.equal(ctx.host.querySelectorAll('[data-v6-primes] li').length,25);
  toggle(ctx,'prime-table');assert.deepEqual(ctx.reasons,['prime-table']);
  toggle(ctx,'prime-table',false);assert.deepEqual(ctx.reasons,['prime-table']);
  toggle(ctx,'prerequisites');assert.equal(ctx.reasons.at(-1),'prerequisites');
  ctx.cleanup();ctx.dom.window.close();
});
test('table range changes without replacing or solving a task', () => {
  const ctx=open();
  const sentinel=ctx.dom.window.document.createElement('input');sentinel.value='unfinished calculation';ctx.host.before(sentinel);
  const select=ctx.host.querySelector('select');select.value='1000';select.dispatchEvent(new ctx.dom.window.Event('change'));
  assert.equal(ctx.host.querySelectorAll('[data-v6-primes] li').length,168);
  assert.equal(ctx.host.querySelector('[data-v6-primes]').getAttribute('aria-label'),'Простые числа до 1000');
  assert.equal(sentinel.value,'unfinished calculation');
  assert.deepEqual(ctx.reasons,['prime-table']);
  ctx.cleanup();ctx.dom.window.close();
});
test('stale handlers and cleaned component cannot record help or open practice', () => {
  let current=true;
  const ctx=open({isCurrent:()=>current});
  current=false;toggle(ctx,'prime-table');assert.deepEqual(ctx.reasons,[]);
  const select=ctx.host.querySelector('select');select.value='1000';select.dispatchEvent(new ctx.dom.window.Event('change'));
  assert.equal(ctx.host.querySelectorAll('[data-v6-primes] li').length,25);
  const link=ctx.host.querySelector('[data-v6-practice]');
  const event=new ctx.dom.window.MouseEvent('click',{bubbles:true,cancelable:true});
  assert.equal(link.dispatchEvent(event),false);
  current=true;ctx.cleanup();toggle(ctx,'prerequisites');assert.deepEqual(ctx.reasons,[]);
  ctx.dom.window.close();
});
test('six grounded practice links open separately without leaking a task or account', () => {
  const ctx=open({unitId:10});
  const links=[...ctx.host.querySelectorAll('[data-v6-practice]')];
  assert.equal(links.length,6);
  for(const link of links){
    const url=new URL(link.href);assert.equal(url.origin,'https://mathexam.space');
    assert.equal(url.search,'');assert.equal(url.hash,'');
    assert(fs.statSync(path.join(root,url.pathname)).size>100,'existing non-empty trainer');
    assert.equal(link.target,'_blank');assert(link.rel.includes('noopener'));assert(link.rel.includes('noreferrer'));
  }
  assert.equal(ctx.dom.window.localStorage.length,0);
  assert(ctx.host.querySelector('.v6-support-fraction'));
  assert(!ctx.host.querySelector('.v6-support-recommended'));
  ctx.cleanup();ctx.dom.window.close();
});
test('unit recommendations address actual prerequisite needs without claiming textbook coverage', () => {
  assert.match(API.recommendation(6),/без остатка/);
  assert.match(API.recommendation(7),/попарно/);
  assert.match(API.recommendation(8),/каждое из данных/);
  assert.match(API.recommendation(9),/одно и то же/);
  assert.match(API.recommendation(12),/числитель и знаменатель/);
  assert.match(API.recommendation(0),/Повторять всё подряд не нужно/);
});
