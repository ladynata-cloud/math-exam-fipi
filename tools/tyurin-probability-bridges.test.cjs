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
    const canonical = 'https://mathexam.space/trainers/tyurin-statistics/' + link.slice(2);
    assert.equal((file.match(/<link rel="canonical" href="[^"]+">/g)||[]).length,1);
    assert(file.includes('<link rel="canonical" href="'+canonical+'">'));
    assert.match(file,/<meta name="description" content="[^"]+">/);
    const pair = '\n<script defer src="/assets/assistant/navigator-data.js?v=20261105-site1"></script>\n<script defer src="/assets/assistant/navigator-widget.js?v=20261105-site1"></script>\n';
    assert.equal(file.split(pair).length,2,'standard public navigation exactly once');
    assert.deepEqual([...file.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(x=>x[1]),[
      '/assets/assistant/navigator-data.js?v=20261105-site1',
      '/assets/assistant/navigator-widget.js?v=20261105-site1'
    ],'only optional site navigation; the mathematical runtime stays inline');
    assert.equal([...file.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g)].length,2,'two inline scripts: mathematics and learner UI');
  }
});

function attemptRegression(html, execute, assert, oldExpected=false) {
 const scripts=[...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
 assert.equal(scripts.length,2);
 function fixture(){
  let ids=new Map();
  class E {
   constructor(tag){this.tagName=tag;this.children=[];this.events={};this.attrs={};this.value='';this.textContent='';this.disabled=false;this.hidden=false;this.style={};}
   append(...children){this.children.push(...children);}
   replaceChildren(...children){this.children=children;}
   setAttribute(name,value){this.attrs[name]=String(value);}
   addEventListener(name,cb){this.events[name]=cb;}
   focus(){this.focused=true;}
   fire(name){this.events[name]({preventDefault(){}});}
  }
  const document={createElement:tag=>new E(tag),getElementById:id=>{if(!ids.has(id))ids.set(id,new E('static'));return ids.get(id)}};
  document.getElementById('coupling').value='2';
  function Option(label,value){this.textContent=label;this.value=value;}
  execute(scripts,document,Option);
  const block=document.getElementById('tasks').children[0];
  const form=block.children.find(x=>x.tagName==='form');
  const fields=form.children.filter(x=>x.tagName==='label').map(x=>x.children[0]);
  const controls=form.children.find(x=>x.className==='controls');
  const hint=controls.children.find(x=>x.type==='button');
  const msg=form.children.find(x=>x.className==='feedback');
  return {fields,form,hint,msg,summary:()=>document.getElementById('summary').textContent};
 }
 const right=['1/8','3/4','1/8','1','1/4','нет'];
 function set(f,values){f.fields.forEach((x,i)=>{x.value=values[i]});}
 function solve(f){set(f,right);f.form.fire('submit');}
 if(oldExpected){
  const f=fixture();f.form.fire('submit');solve(f);
  assert.equal(f.summary().includes('Самостоятельно с первой попытки: 0'),true);
  assert.equal(f.summary().includes('после исправления: 1'),true);
  return;
 }
 for(const [label,index,value] of [['empty field',0,''],['zero denominator',1,'1/0'],['invalid text',2,'abc'],['missing option',5,''],['unlisted option',5,'maybe']]){
  const f=fixture();set(f,right);f.fields[index].value=value;f.form.fire('submit');
  assert.equal(f.msg.textContent.includes('Попытка не засчитана'),true,label);
  assert.equal(f.fields[index].attrs['aria-invalid'],'true',label);
  assert.equal(f.fields[index].focused,true,label);
  assert.equal(f.summary().includes('Выполнено 0 из 6'),true,label);
  assert.equal(f.fields.some(x=>x.disabled),false,label);
  solve(f);assert.equal(f.summary().includes('Самостоятельно с первой попытки: 1'),true,label);
  assert.equal(f.summary().includes('после исправления: 0'),true,label);
 }
 {const f=fixture();set(f,right);f.fields[0].value='0';f.form.fire('submit');solve(f);
 assert.equal(f.summary().includes('Самостоятельно с первой попытки: 0'),true);
 assert.equal(f.summary().includes('после исправления: 1'),true);}
 {const f=fixture();f.hint.fire('click');f.form.fire('submit');solve(f);
 assert.equal(f.summary().includes('с подсказкой: 1'),true);
 assert.equal(f.summary().includes('Самостоятельно с первой попытки: 0'),true);}
 {const f=fixture();set(f,['0,125','0.75','1/8','1.0','2/8','нет']);f.form.fire('submit');
 assert.equal(f.summary().includes('Самостоятельно с первой попытки: 1'),true);const summary=f.summary();f.form.fire('submit');assert.equal(f.summary(),summary);}
}
test('sum dependence: only complete parseable submissions consume the first attempt',()=>{
  const file=fs.readFileSync(path.join(dir,'sum-dependence-lab.html'),'utf8');
  attemptRegression(file,(scripts,document,Option)=>{const context=vm.createContext({document,Option});for(const script of scripts)vm.runInContext(script,context);},assert);
});
