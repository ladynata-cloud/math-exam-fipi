'use strict';
// Exercise actual inline learner handlers without a browser or dependencies.
const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('trainers/ege-profile-vectors-trainer.html','utf8');
const script=[...source.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
function surface(saved){
  const nodes=new Map(),storage=new Map(saved?Object.entries(saved):[]);
  function el(id){if(!nodes.has(id)){const classes=new Set();nodes.set(id,{id,value:'',textContent:'',innerHTML:'',style:{},dataset:{},listeners:{},classList:{add(...x){x.forEach(v=>classes.add(v));},remove(...x){x.forEach(v=>classes.delete(v));},contains(v){return classes.has(v);}},addEventListener(k,fn){this.listeners[k]=fn;},setAttribute(){},focus(){},select(){},closest(){return this;},querySelectorAll(){return [];}});}return nodes.get(id);}
  const context=vm.createContext({document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{href:'https://mathexam.space/trainers/ege-profile-vectors-trainer.html'},performance:{now:()=>10000},setTimeout:()=>0,console});
  vm.runInContext(script,context);
  const run=s=>vm.runInContext(s,context);
  const start=()=>{run('cur={answer:5,sub:"test",steps:[N_("Сколько будет 2+3?",5,"Сложи два и три.")]};answered=false;solOpenedFirst=false;sp={idx:0,errs:0,help:false,stepHelp:false,log:[]};renderStep();');};
  start();
  return {run,el,storage,start,stats:()=>JSON.parse(run('JSON.stringify(stats)')),check(v){el('stepIn').value=v;el('stepCheck').listeners.click();},hint(){el('stepHint').listeners.click();}};
}
test('manual hint excludes the solved task from right/series and records assisted step',()=>{
 const f=surface();f.hint();f.check('5');assert.equal(f.stats().solved,1);assert.equal(f.stats().right,0);assert.equal(f.stats().streak,0);assert.equal(f.run('sp.log[0].helped'),true);assert.match(f.el('feedback').innerHTML,/подсказкой/);
 const g=surface(Object.fromEntries(f.storage));assert.equal(g.stats().solved,1);assert.equal(g.stats().right,0);
});
test('automatically revealed numeric hint also marks assistance',()=>{const f=surface();f.check('4');f.check('4');assert.equal(f.el('hintBox').classList.contains('show'),true);f.check('5');assert.equal(f.stats().right,0);assert.equal(f.stats().solved,1);});
test('unassisted correct step is counted once and a new task clears assistance',()=>{const f=surface();f.hint();f.check('5');f.start();f.check('5');assert.equal(f.stats().solved,2);assert.equal(f.stats().right,1);assert.equal(f.stats().streak,1);assert.equal(f.run('sp.log[0].helped'),false);});
test('empty numeric step does not solve or increase statistics',()=>{const f=surface();f.check('');assert.equal(f.run('sp.idx'),0);assert.equal(f.stats().solved,0);assert.equal(f.run('sp.help'),false);});
test('empty or malformed numeric steps explain the format without counting an error or revealing a hint',()=>{
 for(const value of ['', '  ', '5tail', '0x5', '5e0', 'Infinity', '-Infinity', '1/0', '5,4,3', '9'.repeat(400)]){
  const f=surface();f.check(value);
  assert.equal(f.run('sp.idx'),0,value);assert.equal(f.run('sp.errs'),0,value);
  assert.equal(f.run('sp.help'),false,value);assert.equal(f.stats().solved,0,value);
  assert.equal(f.el('hintBox').classList.contains('show'),false,value);
  assert.match(f.el('stepInputFeedback').textContent,/Введите ответ|Введите число целиком/);
  f.check('5');assert.equal(f.stats().right,1,'A formatting correction remains unassisted');
 }
});
test('signed decimal and comma formats remain accepted',()=>{
 const f=surface();
 for(const [input,expected] of [['+5',5],['−1,25',-1.25],[' .5 ',.5],['5.',5],['-0',-0],['1 000',1000]]){
  assert.equal(f.run('parseAns('+JSON.stringify(input)+')'),expected,input);
 }
});
test('a completed or replaced step cannot be completed again by an old handler',()=>{
 const f=surface();f.run('var previousStep=cur.steps[0]');f.check('5');
 const before=JSON.stringify(f.stats()),saved=Object.fromEntries(f.storage);
 f.check('5');f.run('completeStep(previousStep,"5",true)');
 assert.equal(JSON.stringify(f.stats()),before);assert.deepEqual(Object.fromEntries(f.storage),saved);
 f.start();f.run('completeStep(previousStep,"5",true)');
 assert.equal(f.run('sp.idx'),0);assert.equal(f.run('sp.help'),false);assert.equal(f.stats().solved,1);
 f.check('5');assert.equal(f.stats().solved,2);assert.equal(f.stats().right,2);
});
test('opening full solution before completing still excludes the attempt',()=>{const f=surface();f.run('openSolution(true)');f.check('5');assert.equal(f.stats().solved,0);assert.equal(f.stats().right,0);});
test('automatic choice hint cannot raise independent results',()=>{
 const f=surface(),wrong=f.el('choiceWrong'),right=f.el('choiceRight'),other=f.el('choiceOther');
 wrong.dataset.ok='0';right.dataset.ok='1';other.dataset.ok='0';right.textContent='5';
 f.el('steps').querySelectorAll=()=>[wrong,right,other];
 f.run('cur={answer:5,sub:"choice",steps:[C_("Сколько будет 2+3?",[{h:"4",ok:false},{h:"5",ok:true},{h:"6",ok:false}],"Сложи два и три.")]};renderStep();');
 wrong.listeners.click();assert.equal(f.el('hintBox').classList.contains('show'),true);
 right.listeners.click();assert.equal(f.stats().solved,1);assert.equal(f.stats().right,0);assert.equal(f.run('sp.log[0].helped'),true);
});
test('published UI accurately describes persisted statistics and non-resumed current task',()=>{assert.match(source,/Статистика сохраняется в этом браузере; незавершённая задача после перезагрузки меняется/);assert.doesNotMatch(source,/Статистика считается за текущую сессию/);});
