'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const dir = path.join(root, 'trainers/tyurin-statistics');
const source = fs.readFileSync(path.join(dir, 'condition-lab.js'), 'utf8');
const marker = '/* WORK-12: additional standalone probability practice, separate from board state. */';
assert.equal(source.split(marker).length, 2, 'one independent mount block');
const script = source.slice(source.indexOf(marker));
const index = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const links = ['./discrete-lab.html', './sum-dependence-lab.html'];
function run({embedded=false, anchorExists=true, existing=false}={}) {
  let section = existing ? {id:'probability-bridges'} : null;
  let inserts = 0, creates = 0;
  const anchor = {hidden:true, insertAdjacentElement(where, el) {
    assert.equal(where, 'afterend'); section=el; inserts++;
  }};
  const document = {getElementById(id) {return id==='condition-entry'?(anchorExists?anchor:null):id==='probability-bridges'?section:null;},
    createElement(tag) {assert.equal(tag,'section'); creates++; return {setAttribute(name,value){this[name]=value;}};}};
  const window = {}; window.top = embedded ? {} : window;
  const context = {window,document};
  for(const key of ['localStorage','sessionStorage','fetch','XMLHttpRequest']) Object.defineProperty(context,key,{get(){throw Error('unexpected '+key);}});
  vm.runInNewContext(script,context); vm.runInNewContext(script,context);
  return {section,inserts,creates,anchor};
}
test('standalone: two links inserted once, existing entry untouched',()=>{
  const r=run(); assert.equal(r.inserts,1);assert.equal(r.creates,1);assert.equal(r.anchor.hidden,true);
  assert.equal(r.section.id,'probability-bridges');assert.equal(r.section['aria-label'],'Дополнительные практикумы по вероятности');
  assert.deepEqual([...r.section.innerHTML.matchAll(/href="([^"]+)"/g)].map(x=>x[1]),links);
  assert(!/\btarget=|<form|<button/i.test(r.section.innerHTML));
});
test('embedded, absent anchor, already mounted: no DOM writes',()=>{
  for(const opts of [{embedded:true},{anchorExists:false},{existing:true}]){
    const r=run(opts);assert.equal(r.inserts,0);assert.equal(r.creates,0);
  }
});
test('existing course already loads condition script and has one anchor',()=>{
  assert.equal((index.match(/id="condition-entry"/g)||[]).length,1);
  assert.match(index,/<script defer src="condition-lab\.js"><\/script>/);
  assert(!index.includes('id="probability-bridges"'));
});
test('two existing lessons link back to course and to one another, paper fallback',()=>{
  for(const [i,link] of links.entries()){
    const file=fs.readFileSync(path.join(dir,link),'utf8');
    assert.match(file,/href="\.\.\/\.\.\/"/);
    assert.match(file,/href="\.\/index\.html(?:#lesson\/\d+-\d+)?"/);
    assert(file.includes('href="'+links[1-i]+'"'));
    assert.match(file,/<noscript>[\s\S]*?<li>/);
    assert(!/<script[^>]+src=/.test(file));
  }
});
