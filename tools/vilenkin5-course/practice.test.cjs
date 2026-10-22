'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const api=require(path.join(__dirname,'../../courses/vilenkin-5-part-1/practice.js'));
let cases=0,steps=0;
for(const {id} of api.skills)for(let level=1;level<=3;level++)for(let seed=0;seed<300;seed++){
 const t=api.generate(id,level,seed),m=t.meta;let expected;
 switch(id){
  case 'add':expected=m.a+m.b;break;
  case 'subtract':expected=m.a-m.b;break;
  case 'multiply':expected=m.a*m.b;break;
  case 'divide':expected=m.a/m.b;assert.equal(m.a%m.b,0);break;
  case 'remainder':expected=m.a%m.b;assert(expected>0&&expected<m.b);assert.equal(m.q,Math.floor(m.a/m.b));break;
  case 'table':expected=m.reverse?m.b:m.a*m.b;break;
  case 'place':expected=level===1?Math.floor(m.n/10**m.p)%10:level===2?Math.floor(m.n/10**m.p):m.thousands*1000+m.tens*10+m.ones;break;
  case 'order':expected=level===1?m.a+m.b*m.c:(m.a+m.b)*m.c-(level===3?m.e/m.d:0);break;
  case 'power':expected=m.a**m.exp+(m.b?m.b*m.b:0);break;
  case 'divisibility':expected=m.n%m.b===0?'Да':'Нет';break;
  case 'units':expected=m.reverse?m.a/m.factor:m.a*m.factor;break;
 }
 assert.equal(t.answer,String(expected),JSON.stringify(m));assert(t.prompt.length>10);assert(t.hint.length>20);assert(t.steps.length>=1);assert(t.solution.length>=t.steps.length);assert.deepEqual(t,api.generate(id,level,seed));
 for(const s of t.steps){assert(s.prompt.length>10);assert(s.hint.length>8);assert(s.explain.length>4);assert(/^\d+$/.test(s.answer)||['Да','Нет'].includes(s.answer));steps++}
 if(t.model?.kind==='column'){
  const rows=t.model.rows.map(()=>0);for(const s of t.steps)if(s.mark?.row!==undefined)rows[s.mark.row]+=s.mark.digit*10**s.mark.place;
  assert.deepEqual(rows,t.model.rows,`completed digits ${id}/${seed}`);
  assert.equal(rows.reduce((a,b)=>a+b,0),Number(t.answer));assert(!api.renderModel(t,{step:t.steps.length}).includes('□'),'completed columns have no unfilled leading cells');
 }
 if(t.model?.kind==='division'){
  const q=t.steps.filter(s=>s.mark?.quotient!==undefined).map(s=>s.mark.digit).join('');assert.equal(Number(q),Math.floor(m.a/m.b));
  const rows=t.steps.filter(s=>s.mark?.division).map(s=>s.mark.division);for(const row of rows){assert.equal(row.current-row.product,row.left);assert(row.left>=0&&row.left<m.b);assert.equal(row.product%m.b,0)}assert.equal(rows.at(-1).left,m.a%m.b);
 }
 assert(!/undefined|NaN|Infinity/.test(api.renderModel(t,{step:0})));assert(!/undefined|NaN|Infinity/.test(api.renderModel(t,{step:t.steps.length})));
 cases++;
}
for(const p of [['unknown',1,0],['add',0,0],['add',4,0],['add',1,-1],['add',1,1.5],['add',1,2**32]])assert.throws(()=>api.generate(...p));
const task=api.generate('add',1,83),session={seed:83,step:0,draft:'',stepDraft:'',help:false,hintVisible:false,stepOpen:false,stepHint:false,revealed:false,attempts:0,solved:false,result:null};
const base={version:1,active:{skill:'add',level:1},counter:83,sessions:{'add:1':session},stats:{}};
assert.deepEqual(api.validateState(base),base);assert.notEqual(api.validateState(base).sessions['add:1'],session);
const change=f=>{const x=JSON.parse(JSON.stringify(base));f(x);return x};
for(const bad of [null,[],{},change(x=>x.version=2),change(x=>x.sessions=null),change(x=>x.active.skill='constructor'),change(x=>x.counter=Infinity),change(x=>x.sessions['add:1'].draft='1'.repeat(81)),change(x=>x.sessions['add:1'].step=999),change(x=>x.sessions['add:1'].revealed=true),change(x=>x.sessions['add:1'].solved=true),change(x=>x.sessions['add:1'].attempts=-1),change(x=>x.stats.constructor={independent:0,corrected:0,assisted:0})])assert.throws(()=>api.validateState(bad));
const solved=change(x=>Object.assign(x.sessions['add:1'],{draft:task.answer,solved:true,result:'independent',attempts:1}));assert(api.validateState(solved));solved.sessions['add:1'].help=true;assert.throws(()=>api.validateState(solved));solved.sessions['add:1'].result='assisted';assert(api.validateState(solved));
console.log(JSON.stringify({status:'PASS',families:api.skills.length,levels:3,generatedTasks:cases,checkedSteps:steps,checks:'independent arithmetic oracle, completed column digits, long-division invariants, deterministic generation, bounded progress and corrupt state rejection'}));

// State/DOM simulation only: does not claim visual browser QA.
const fs=require('node:fs'),vm=require('node:vm'),{parseHTML}=require('linkedom');
const source=fs.readFileSync(path.join(__dirname,'../../courses/vilenkin-5-part-1/practice.js'),'utf8');
function boot(saved,failWrite=false){
 const {window:dom}=parseHTML('<html><body><input id="original" value="347"><button id="launcher">Тренировка</button></body></html>');
 Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value||this.querySelector('option')?.value||''},set(v){for(const o of this.querySelectorAll('option')){if(o.value===String(v))o.setAttribute('selected','');else o.removeAttribute('selected')}}});
 dom.HTMLElement.prototype.showModal=function(){this.open=true};dom.HTMLElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.Event('close'))};
 const mem=new Map(saved?[[api.key,saved]]:[]),w={document:dom.document,HTMLElement:dom.HTMLElement,Event:dom.Event,Date,console};w.window=w;
 w.localStorage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>{if(failWrite)throw Error('quota');mem.set(k,v)}};
 vm.runInContext(source,vm.createContext(w),{filename:'practice.js'});
 return {w,mem,state:()=>JSON.parse(mem.get(api.key)),$:s=>w.document.querySelector(s)};
}
const click=(b,s)=>{const el=b.$(s);assert(el,s);el.click()};
function input(b,id,value,submit=false){const el=b.$('#'+id);assert(el,id);el.value=String(value);el.dispatchEvent(new b.w.Event('input'));if(submit)b.$('#'+id+'Form').dispatchEvent(new b.w.Event('submit',{cancelable:true}))}
function choose(b,id,value){const el=b.$('#'+id);el.value=String(value);el.dispatchEvent(new b.w.Event('change'))}
const b=boot();let helpCalls=0;b.w.ArithmeticPractice.open({skills:['add'],onHelp:()=>helpCalls++});b.w.ArithmeticPractice.open({onHelp:()=>helpCalls++});assert.equal(helpCalls,1);
input(b,'arithmeticAnswer','314');click(b,'#arithmeticHint');assert.equal(b.$('#arithmeticAnswer').value,'314');assert(b.state().sessions['add:1'].help);
click(b,'#arithmeticSteps');input(b,'arithmeticStepAnswer','99');const before=b.state().sessions['add:1'];click(b,'#arithmeticReveal');let s=b.state().sessions['add:1'];assert.equal(s.step,before.step);assert.equal(s.stepDraft,'99');assert.equal(b.$('#arithmeticStepAnswer').value,'99');assert(s.revealed);assert(b.$('#arithmeticContinue'));
click(b,'#arithmeticClose');assert.equal(b.$('#original').value,'347');assert.equal(b.$('#arithmeticPractice').open,false);b.w.ArithmeticPractice.open({skills:['add'],onHelp:()=>helpCalls++});assert.equal(helpCalls,2);assert.equal(b.$('#arithmeticStepAnswer').value,'99');
const reloaded=boot(b.mem.get(api.key));reloaded.w.ArithmeticPractice.open({skills:['add']});assert.equal(reloaded.$('#arithmeticAnswer').value,'314');assert.equal(reloaded.$('#arithmeticStepAnswer').value,'99');assert(reloaded.$('#arithmeticContinue'));
const oldContinue=reloaded.$('#arithmeticContinue').onclick;click(reloaded,'#arithmeticContinue');oldContinue();assert.equal(reloaded.state().sessions['add:1'].step,1);assert.equal(reloaded.$('#arithmeticAnswer').value,'314');assert.equal(reloaded.$('.arithmetic-completed').textContent.includes('Шаг 1'),true);
const currentTask=api.generate('add',1,reloaded.state().sessions['add:1'].seed);input(reloaded,'arithmeticAnswer','',true);input(reloaded,'arithmeticAnswer','1/0',true);assert.equal(reloaded.state().sessions['add:1'].attempts,0);
const oldForm=reloaded.$('#arithmeticAnswerForm').onsubmit;input(reloaded,'arithmeticAnswer',currentTask.answer,true);oldForm({preventDefault(){}});assert.equal(reloaded.state().stats.add.assisted,1);assert.equal(reloaded.state().sessions['add:1'].result,'assisted');
click(reloaded,'#arithmeticFreshCheck');s=reloaded.state().sessions['add:1'];const freshTask=api.generate('add',1,s.seed);assert.notEqual(freshTask.prompt,currentTask.prompt);assert(!s.help&&!s.stepOpen);input(reloaded,'arithmeticAnswer',freshTask.answer,true);assert.equal(reloaded.state().stats.add.independent,1);
click(reloaded,'#arithmeticNew');s=reloaded.state().sessions['add:1'];input(reloaded,'arithmeticAnswer','0',true);assert.equal(reloaded.state().sessions['add:1'].attempts,1);input(reloaded,'arithmeticAnswer',api.generate('add',1,s.seed).answer,true);assert.equal(reloaded.state().stats.add.corrected,1);
click(reloaded,'#arithmeticNew');input(reloaded,'arithmeticAnswer','789');choose(reloaded,'arithmeticSkill','divide');input(reloaded,'arithmeticAnswer','55');choose(reloaded,'arithmeticSkill','add');assert.equal(reloaded.$('#arithmeticAnswer').value,'789');choose(reloaded,'arithmeticSkill','divide');assert.equal(reloaded.$('#arithmeticAnswer').value,'55');
input(reloaded,'arithmeticAnswer','9'.repeat(100));assert.equal(reloaded.$('#arithmeticAnswer').value.length,80);assert.equal(reloaded.state().sessions['divide:1'].draft.length,80);
// Grouped thousands are valid, retain the learner's formatting and survive reload.
for(const separator of [' ', '\u00a0', '\u202f']){
 const grouped=boot();grouped.w.ArithmeticPractice.open({skills:['add']});choose(grouped,'arithmeticLevel',3);
 const actual=api.generate('add',3,grouped.state().sessions['add:3'].seed).answer;
 const written=actual.replace(/\B(?=(\d{3})+(?!\d))/g,separator);assert.notEqual(written,actual);
 input(grouped,'arithmeticAnswer',written,true);let gs=grouped.state().sessions['add:3'];
 assert.equal(gs.draft,written);assert.equal(gs.result,'independent');assert.equal(grouped.state().stats.add.independent,1);
 assert(api.validateState(grouped.state()));const resumed=boot(grouped.mem.get(api.key));resumed.w.ArithmeticPractice.open({skills:['add']});
 assert.equal(resumed.state().sessions['add:3'].draft,written);assert.equal(resumed.state().stats.add.independent,1);assert(resumed.$('.arithmetic-result'));
}
const malformedGrouping=boot();malformedGrouping.w.ArithmeticPractice.open({skills:['add']});
for(const bad of ['1 2','12 34','1 0000','1234 567','1  000','1,000','1.000','1\t000']){
 input(malformedGrouping,'arithmeticAnswer',bad,true);const gs=malformedGrouping.state().sessions['add:1'];
 assert.equal(gs.attempts,0);assert.equal(gs.draft,bad);assert.equal(gs.solved,false);
}
const malformedReload=boot(malformedGrouping.mem.get(api.key));malformedReload.w.ArithmeticPractice.open({skills:['add']});
assert.equal(malformedReload.$('#arithmeticAnswer').value,'1\t000');assert.equal(malformedReload.state().sessions['add:1'].attempts,0);
for(const {id} of api.skills)for(let level=1;level<=3;level++){
 choose(reloaded,'arithmeticSkill',id);choose(reloaded,'arithmeticLevel',level);assert(reloaded.$('#arithmeticPrompt').textContent.length>10);assert(!/undefined|NaN|Infinity/.test(reloaded.$('#arithmeticPractice').textContent));
}
assert(api.validateState(reloaded.state()));
for(const raw of ['{bad',JSON.stringify({version:1,active:{skill:'add',level:1},counter:0,sessions:null,stats:{}})]){const bad=boot(raw);bad.w.ArithmeticPractice.open();assert.equal(bad.mem.get(api.key),raw);assert(bad.$('.arithmetic-storage'));assert(bad.$('#arithmeticAnswer'))}
const quota=boot(undefined,true);quota.w.ArithmeticPractice.open();assert(quota.$('.arithmetic-storage'));assert(quota.$('#arithmeticAnswer'));
console.log(JSON.stringify({status:'PASS',domFlows:33,checks:'original draft retained; independent/helped/corrected provenance; fresh example differs; draft and steps resume across close, skill switch and reload; reveal does not advance; stale submit/continue guarded; blank/invalid input free; bounded persistence; corrupt state preserved; quota failure recovery',visualQA:'not performed by DOM simulation'}));
