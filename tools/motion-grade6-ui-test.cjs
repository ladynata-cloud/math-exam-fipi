'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const course=require('../trainers/motion-grade6/course-core');
const contract=require('../trainers/motion-grade6/learning-contracts');
const server=require('../board-server/learning-contracts');
function setup(){
 const elements=new Map();let bodyMarkup='',registration,events=[];
 class Element{
  constructor(id='',dataset={}){this.id=id;this.dataset=dataset;this.style={};this.value='';this.open=false;this.inert=false;this.checked=false;this.isConnected=true;this.classList={add(){}};this.selectionStart=0;this.selectionEnd=0;this.children=[];}
  set innerHTML(value){this.html=value;if(this.id==='main')bodyMarkup=value;this.children=[];const tags=value.matchAll(/<([a-z]+)\b([^>]*)>/g);for(const [,tag,attrs] of tags){const id=attrs.match(/\bid="([^"]+)"/)?.[1],data={};for(const [,key,val] of attrs.matchAll(/data-([a-z]+)="([^"]+)"/g))data[key]=val;if(id||Object.keys(data).length){const child=new Element(id||'',data);child.open=/\bopen(?:\s|$)/.test(attrs);child.checked=/\bchecked(?:\s|$)/.test(attrs);this.children.push(child);if(id)elements.set(id,child);}}}
  get innerHTML(){return this.html||'';}setAttribute(){}focus(){}setSelectionRange(){}
  querySelectorAll(selector){const m=selector.match(/\[data-([a-z]+)\]/);return m?this.children.filter(x=>Object.hasOwn(x.dataset,m[1])):[];}
 }
 const main=new Element('main');elements.set('main',main);
 const document={body:new Element(),activeElement:null,getElementById:id=>elements.get(id)||null};
 const window={MotionCourse:course,MotionContracts:contract,MathExamLearning:{register(adapter){registration=adapter;adapter.subscribe(e=>events.push(JSON.parse(JSON.stringify(e))));}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../trainers/motion-grade6/managed.js'),'utf8'),{window,document,location:{search:'?learning=1'},URLSearchParams,requestAnimationFrame:()=>1,cancelAnimationFrame(){}},{filename:'managed.js'});
 return {elements,main,document,get adapter(){return registration},events,markup:()=>bodyMarkup};
}
function apply(ui,created,readOnly=false){ui.adapter.applyState({...created,readOnly});}
function answer(ui,value){ui.elements.get('answer').value=String(value);ui.elements.get('check').onclick();const event=ui.events.at(-1);assert.equal(event.kind,'check');return event;}
for(const guided of [false,true])test(`all original 144 answers through managed UI, ${guided?'guided':'independent'}`,()=>{
 for(const id of course.ids){const ui=setup(),created=contract.create(id,17);apply(ui,created);
  for(let i=0;i<12;i++){
   if(i){const current=ui.adapter.getState();current.taskIndex=i;current.modelTime=0;current.exampleStep=0;current.help=false;apply(ui,{taskSpec:created.taskSpec,state:current});}
   const task=created.taskSpec.items[i];
   if(guided){const checkbox=ui.elements.get('guided');checkbox.checked=true;checkbox.onchange();for(const s of task.steps){const ev=answer(ui,s.a),state=server.normalize('motion-grade6',created.taskSpec,ev.state),result=server.evaluate('motion-grade6',created.taskSpec,ev.details,state);assert.equal(result.correct,true);assert.equal(result.assisted,true);}}
   else{const ev=answer(ui,task.answer),state=server.normalize('motion-grade6',created.taskSpec,ev.state),result=server.evaluate('motion-grade6',created.taskSpec,ev.details,state);assert.equal(result.correct,true);assert.equal(result.complete,i===11);assert.equal(result.assisted,false);}
  }
  const saved=ui.adapter.getState();assert.equal(contract.status(created.taskSpec,saved).completed,12);const restored=setup();apply(restored,{taskSpec:created.taskSpec,state:saved},true);assert.deepEqual(JSON.parse(JSON.stringify(restored.adapter.getState())),JSON.parse(JSON.stringify(saved)));assert.equal(restored.main.inert,true);assert.equal(restored.events.length,0);
 }
});
test('wrong answer, task navigation, animation and examples retain truthful assistance',()=>{
 const ui=setup(),created=contract.create('meeting',5);apply(ui,created);let ev=answer(ui,'999');let s=server.normalize('motion-grade6',created.taskSpec,ev.state);assert.equal(server.evaluate('motion-grade6',created.taskSpec,ev.details,s).correct,false);
 ui.elements.get('hint').onclick();assert.equal(ui.events.at(-1).kind,'hint');assert.equal(ui.adapter.getState().records[0].assisted,true);
 ui.elements.get('next').onclick();assert.equal(ui.adapter.getState().taskIndex,1);assert.equal(ui.adapter.getState().records[1].assisted,false);
 const model=ui.elements.get('modelDetails');model.open=true;model.ontoggle();assert.equal(ui.adapter.getState().records[1].assisted,true);
 let state=ui.adapter.getState();state.view='example';state.exampleStep=0;apply(ui,{taskSpec:created.taskSpec,state});ui.elements.get('exampleNext').onclick();assert.equal(ui.adapter.getState().exampleStep,1);assert.equal(contract.status(created.taskSpec,ui.adapter.getState()).completed,0);
});
test('reject altered task envelope; read-only handlers cannot submit answers',()=>{
 const ui=setup(),created=contract.create('distance',1);const altered=structuredClone(created);altered.taskSpec.items[0].answer=999;assert.throws(()=>apply(ui,altered));apply(ui,created,true);ui.elements.get('answer').value='8';ui.elements.get('check').onclick();assert.equal(ui.events.length,0);assert.deepEqual(JSON.parse(JSON.stringify(ui.adapter.getState())),created.state);
});
test('bridge accepts the two exact cabinet origins and rejects lookalikes',()=>{
 for(const [origin,enabled] of [['https://mathexam-board-ladynata.amvera.io',true],['https://mathexam-board-ladynata.msk1.amvera.tech',true],['https://mathexam-board-ladynata.msk1.amvera.tech.evil.test',false],['https://unrelated.amvera.tech',false],['http://mathexam-board-ladynata.msk1.amvera.tech',false]]){
  const window={location:{search:'?learning=1&channel=abcdefghijklmnop&parentOrigin='+encodeURIComponent(origin)},parent:{},crypto:require('node:crypto').webcrypto,addEventListener(){}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../trainers/learning-bridge.js'),'utf8'),{window,URLSearchParams,URL,TextEncoder,Uint8Array,document:{addEventListener(){}}});assert.equal(window.MathExamLearning.enabled,enabled,origin);
 }
});

test('last unfinished exercise can be reopened after summary',()=>{
 const ui=setup(),created=contract.create('distance',1);created.state.taskIndex=11;apply(ui,created);ui.elements.get('finish').onclick();assert.match(ui.elements.get('work').innerHTML,/Продолжи тренировку/);ui.main.querySelectorAll('[data-task]').find(b=>b.dataset.task==='11').onclick();assert.match(ui.elements.get('work').innerHTML,/answerForm/);
});
